import { NextResponse } from 'next/server';
import { 
  getEkycRequests, 
  getEkycForUser, 
  submitEkycRequest, 
  approveEkycRequest, 
  rejectEkycRequest 
} from '@/lib/ekycStore';
import { updateUserStore, updateApartmentMember } from '@/lib/userStore';
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
 * Submits e-KYC or handles BQL approve/reject
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
        faceScore
      } = body;

      // 1.1 Kiểm tra ảnh CCCD Mặt Trước
      if (idCardFrontUrl) {
        const frontCheck = validateCccdCard(idCardFrontUrl, 'FRONT');
        if (!frontCheck.valid) {
          return NextResponse.json(
            { success: false, message: frontCheck.error || 'Ảnh CCCD Mặt Trước không đúng tiêu chuẩn.' },
            { status: 400 }
          );
        }
      }

      // 1.2 Kiểm tra ảnh CCCD Mặt Sau
      if (idCardBackUrl) {
        const backCheck = validateCccdCard(idCardBackUrl, 'BACK');
        if (!backCheck.valid) {
          return NextResponse.json(
            { success: false, message: backCheck.error || 'Ảnh CCCD Mặt Sau không đúng tiêu chuẩn.' },
            { status: 400 }
          );
        }
      }

      // 1.3 Đối chiếu sinh trắc học: Ảnh chân dung FaceID vs Ảnh trên CCCD
      let calculatedFaceScore = faceScore || 98.6;
      if (avatarUrl && idCardFrontUrl) {
        const biometricCheck = verifyFaceWithCccd(avatarUrl, idCardFrontUrl);
        calculatedFaceScore = biometricCheck.score;
        if (!biometricCheck.matched) {
          return NextResponse.json(
            {
              success: false,
              matchScore: biometricCheck.score,
              message: biometricCheck.reason,
            },
            { status: 400 }
          );
        }
      }

      const newRequest = submitEkycRequest({
        userId: userId || phone,
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
        faceScore
      });

      // Synchronize apartment member face status
      try {
        updateApartmentMember(apartmentCode || '12A05', userId || phone, {
          faceStatus: 'Đang Chờ BQL Phê Duyệt',
          avatarUrl: avatarUrl,
          idCard: idCardNo,
        });
      } catch (memErr) {
        console.warn('Sync member face status on submit error:', memErr);
      }

      return NextResponse.json({
        success: true,
        message: 'Hồ sơ e-KYC đã được gửi đến Ban Quản Lý thành công.',
        ekyc: newRequest,
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
        updateApartmentMember(approved.apartmentCode || '12A05', approved.userId, {
          faceStatus: 'Đã Kích Hoạt FaceID',
          avatarUrl: approved.avatarUrl,
          idCard: approved.idCardNo,
        });
      } catch (err) {
        console.warn('Sync userStore on ekyc approve error:', err);
      }

      return NextResponse.json({
        success: true,
        message: 'Đã phê duyệt hồ sơ e-KYC và cấp quyền FaceID thành công.',
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
        updateApartmentMember(rejected.apartmentCode || '12A05', rejected.userId, {
          faceStatus: 'BQL Yêu Cầu Chụp Lại',
        });
      } catch (memErr) {
        console.warn('Sync member face status on reject error:', memErr);
      }

      return NextResponse.json({
        success: true,
        message: 'Đã từ chối hồ sơ e-KYC.',
        ekyc: rejected,
      });
    }

    return NextResponse.json({ success: false, message: 'Action không hợp lệ' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
