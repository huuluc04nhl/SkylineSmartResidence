import { NextResponse } from 'next/server';
import { 
  getEkycRequests, 
  getEkycForUser, 
  submitEkycRequest, 
  approveEkycRequest, 
  rejectEkycRequest,
  confirmEkycByOwner,
} from '@/lib/ekycStore';
import { updateUserStore, updateApartmentMember } from '@/lib/userStore';
import { updateEnrolledFaceStatus } from '@/lib/faceEnrollStore';
import { validateCccdCard, verifyFaceWithCccd } from '@/lib/ekycValidator';

/**
 * GET /api/nks/ekyc
 * Returns e-KYC requests for BQL or specific user
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (userId) {
    const userEkyc = getEkycForUser(userId);
    return NextResponse.json({
      success: true,
      ekyc: userEkyc || null,
    });
  }

  const allRequests = getEkycRequests();
  return NextResponse.json({
    success: true,
    requests: allRequests,
  });
}

/**
 * POST /api/nks/ekyc
 * Submits e-KYC or handles BQL approve/reject/confirm
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    // 1. Resident Submits e-KYC
    if (action === 'SUBMIT') {
      const { 
        userId, 
        fullName, 
        roleLabel, 
        apartmentCode, 
        phone, 
        email, 
        idCardNo, 
        idDate, 
        idPlace, 
        dob, 
        pob, 
        avatarUrl, 
        idCardFrontUrl, 
        idCardBackUrl,
        faceSamples,
        faceScore,
        isFamilyMemberSelfEnroll,
        submittedByRole
      } = body;

      const isPendingOwner = isFamilyMemberSelfEnroll || (submittedByRole === 'TENANT');
      const targetStatus = isPendingOwner ? 'PENDING_OWNER' : 'PENDING';

      const newRequest = submitEkycRequest({
        userId: userId || phone,
        fullName,
        roleLabel,
        apartmentCode: (apartmentCode === '12A05' || apartmentCode === '12A5' || !apartmentCode) ? 'CH-06' : apartmentCode,
        phone,
        email,
        idCardNo,
        idDate,
        idPlace,
        dob,
        pob,
        avatarUrl,
        idCardFrontUrl: idCardFrontUrl || '',
        idCardBackUrl: idCardBackUrl || '',
        faceSamples,
        faceScore: faceScore || 99.4,
        status: targetStatus,
      });

      // Synchronize apartment member face status
      try {
        const targetApt = (apartmentCode === '12A05' || apartmentCode === '12A5' || !apartmentCode) ? 'CH-06' : apartmentCode;
        updateApartmentMember(targetApt, userId || phone, {
          faceStatus: isPendingOwner ? 'Chờ Chủ Hộ Xác Nhận' : 'Đang Chờ BQL Phê Duyệt',
          avatarUrl: avatarUrl,
          idCard: idCardNo,
        });
        updateEnrolledFaceStatus(userId || phone, targetStatus);
      } catch (memErr) {
        console.warn('Sync member face status on submit error:', memErr);
      }

      return NextResponse.json({
        success: true,
        message: isPendingOwner 
          ? 'Hồ sơ định danh e-KYC đã được gửi tới Chủ Hộ để xác nhận trước khi chuyển Ban Quản Lý.'
          : 'Hồ sơ định danh e-KYC đã được gửi đến Ban Quản Lý thẩm duyệt thành công.',
        ekyc: newRequest,
      });
    }

    // 1b. Owner Confirms Family Member e-KYC
    if (action === 'CONFIRM_BY_OWNER') {
      const { userId, phone } = body;
      const targetId = userId || phone;
      const confirmed = confirmEkycByOwner(targetId);

      if (confirmed) {
        try {
          updateApartmentMember(confirmed.apartmentCode, confirmed.userId, {
            faceStatus: 'Đang Chờ BQL Phê Duyệt',
          });
          updateEnrolledFaceStatus(confirmed.userId, 'PENDING');
          if (confirmed.phone) updateEnrolledFaceStatus(confirmed.phone, 'PENDING');
        } catch (e) {
          console.warn('Sync confirm by owner error:', e);
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Chủ Hộ đã xác nhận hồ sơ của thành viên và gửi tới Ban Quản Lý thành công.',
        ekyc: confirmed,
      });
    }

    // 2. BQL Approves e-KYC
    if (action === 'APPROVE') {
      const { id, approverName } = body;
      const approved = approveEkycRequest(id, approverName || 'Ban Quản Lý Skyline');
      if (!approved) {
        return NextResponse.json({ success: false, message: 'Không tìm thấy hồ sơ e-KYC' }, { status: 404 });
      }

      // Synchronize approved legal identity to user store
      try {
        updateUserStore(approved.userId, {
          fullname: approved.fullName,
          full_name: approved.fullName,
          id_number: approved.idCardNo,
          id_card_no: approved.idCardNo,
          id_date: approved.idDate,
          id_place: approved.idPlace,
          dob: approved.dob,
          pob: approved.pob,
          avatar_url: approved.avatarUrl,
        });
        const approvedApt = (approved.apartmentCode === '12A05' || approved.apartmentCode === '12A5' || !approved.apartmentCode) ? 'CH-06' : approved.apartmentCode;
        updateApartmentMember(approvedApt, approved.userId, {
          faceStatus: 'Đã Kích Hoạt FaceID',
          avatarUrl: approved.avatarUrl,
          idCard: approved.idCardNo,
        });
      } catch (err) {
        console.warn('Sync userStore on ekyc approve error:', err);
      }

      // Kích hoạt hồ sơ FaceID trong FaceEnrollStore sang ACTIVE
      try {
        updateEnrolledFaceStatus(approved.userId, 'ACTIVE');
        if (approved.phone) {
          updateEnrolledFaceStatus(approved.phone, 'ACTIVE');
        }
      } catch (faceErr) {
        console.warn('Sync face profile status error:', faceErr);
      }

      return NextResponse.json({
        success: true,
        message: `Đã phê duyệt hồ sơ e-KYC của cư dân ${approved.fullName} & Cấp quyền FaceID thành công.`,
        ekyc: approved,
      });
    }

    // 3. BQL Rejects e-KYC
    if (action === 'REJECT') {
      const { id, reason, approverName } = body;
      const rejected = rejectEkycRequest(id, reason, approverName);
      if (!rejected) {
        return NextResponse.json({ success: false, message: 'Không tìm thấy hồ sơ e-KYC' }, { status: 404 });
      }

      try {
        const rejectedApt = (rejected.apartmentCode === '12A05' || rejected.apartmentCode === '12A5' || !rejected.apartmentCode) ? 'CH-06' : rejected.apartmentCode;
        updateApartmentMember(rejectedApt, rejected.userId, {
          faceStatus: 'BQL Yêu Cầu Chụp Lại',
        });
        updateEnrolledFaceStatus(rejected.userId, 'REVOKED');
        if (rejected.phone) {
          updateEnrolledFaceStatus(rejected.phone, 'REVOKED');
        }
      } catch (memErr) {
        console.warn('Sync member face status on reject error:', memErr);
      }

      return NextResponse.json({
        success: true,
        message: `Đã từ chối hồ sơ e-KYC của cư dân ${rejected.fullName}.`,
        ekyc: rejected,
      });
    }

    // 4. BQL Revokes e-KYC (Tạm khóa / Thu hồi quyền sau khi đã duyệt)
    if (action === 'REVOKE') {
      const { id, reason, approverName } = body;
      const revoked = rejectEkycRequest(
        id, 
        reason || 'Ban Quản Lý đã tạm khóa / thu hồi quyền ra vào FaceID theo quy định vận hành.', 
        approverName || 'Ban Quản Lý Skyline'
      );
      if (!revoked) {
        return NextResponse.json({ success: false, message: 'Không tìm thấy hồ sơ e-KYC' }, { status: 404 });
      }

      try {
        const revokedApt = (revoked.apartmentCode === '12A05' || revoked.apartmentCode === '12A5' || !revoked.apartmentCode) ? 'CH-06' : revoked.apartmentCode;
        updateApartmentMember(revokedApt, revoked.userId, {
          faceStatus: 'BQL Tạm Khóa / Thu Hồi Quyền',
        });
        updateEnrolledFaceStatus(revoked.userId, 'REVOKED');
        if (revoked.phone) {
          updateEnrolledFaceStatus(revoked.phone, 'REVOKED');
        }
      } catch (memErr) {
        console.warn('Sync member face status on revoke error:', memErr);
      }

      return NextResponse.json({
        success: true,
        message: `Đã thu hồi quyền ra vào FaceID của cư dân ${revoked.fullName}.`,
        ekyc: revoked,
      });
    }

    return NextResponse.json({ success: false, message: 'Action không hợp lệ' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
