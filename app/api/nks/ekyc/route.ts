import { NextResponse } from 'next/server';
import { 
  getEkycRequests, 
  getEkycForUser, 
  submitEkycRequest, 
  approveEkycRequest, 
  rejectEkycRequest 
} from '@/lib/ekycStore';

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

      return NextResponse.json({
        success: true,
        message: 'Hồ sơ e-KYC đã được gửi đến Ban Quản Lý thành công.',
        ekyc: newRequest,
      });
    }

    // 2. BQL Approves e-KYC
    if (action === 'APPROVE') {
      const { id, approverName } = body;
      const approved = approveEkycRequest(id, approverName);
      if (!approved) {
        return NextResponse.json({ success: false, message: 'Không tìm thấy hồ sơ e-KYC' }, { status: 404 });
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
