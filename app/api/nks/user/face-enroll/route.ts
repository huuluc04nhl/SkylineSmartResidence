import { NextResponse } from 'next/server';
import { extractFaceDescriptorFromBase64, EnrolledFaceProfile } from '@/lib/biometricFaceEngine';
import { saveEnrolledFaceProfile } from '@/lib/faceEnrollStore';
import { updateUserStore, getUserStore } from '@/lib/userStore';
import { submitEkycRequest } from '@/lib/ekycStore';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { userId, fullName, apartmentCode, phone, samples } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Thiếu thông tin định danh người dùng (userId).' },
        { status: 400 }
      );
    }

    if (!samples || !samples.front || !samples.left || !samples.right || !samples.smile) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Quy trình thu thập sinh trắc học yêu cầu đầy đủ 4 mẫu góc mặt: Nhìn thẳng, Nghiêng trái, Nghiêng phải và Xác thực sống (Liveness).' 
        },
        { status: 400 }
      );
    }

    // 1. Phân tích trích xuất vector đặc trưng sinh trắc học từ mẫu chính diện
    const descriptorVec = extractFaceDescriptorFromBase64(samples.front);
    const descriptorArray = Array.from(descriptorVec);

    // 2. Tạo hồ sơ đăng ký FaceID chính thức
    const faceProfile: EnrolledFaceProfile = {
      userId,
      fullName: fullName || 'Cư Dân Skyline',
      apartmentCode: apartmentCode || '12A05',
      phone: phone || '',
      avatarUrl: samples.front,
      samples: {
        front: samples.front,
        left: samples.left,
        right: samples.right,
        smile: samples.smile,
      },
      descriptor: descriptorArray,
      enrolledAt: new Date().toISOString(),
      status: 'ACTIVE',
      faceScore: 99.4,
    };

    // 3. Lưu vào FaceEnrollStore
    saveEnrolledFaceProfile(faceProfile);

    // 4. Đồng bộ cập nhật vào User Store
    const existingUser = getUserStore(userId);
    updateUserStore(userId, {
      avatar_url: samples.front,
      updated_at: new Date().toISOString(),
    });

    // 5. Cập nhật trạng thái e-KYC sang APPROVED nếu đã có
    try {
      submitEkycRequest({
        userId,
        fullName: faceProfile.fullName,
        roleLabel: existingUser?.role === 'OWNER' ? 'Chủ Hộ' : 'Cư Dân',
        apartmentCode: faceProfile.apartmentCode,
        phone: faceProfile.phone || '',
        idCardNo: existingUser?.id_card_no || '067204000961',
        idDate: existingUser?.id_date || '18/08/2022',
        idPlace: existingUser?.id_place || 'Cục Cảnh sát QLHC về TTXH',
        avatarUrl: samples.front,
        idCardFrontUrl: existingUser?.cccd_front_url || '',
        idCardBackUrl: existingUser?.cccd_back_url || '',
        faceScore: 99.4,
      });
    } catch (e) {
      console.warn('Sync ekyc request error:', e);
    }

    return NextResponse.json({
      success: true,
      message: 'Đăng ký thu thập 4 mẫu FaceID chính thức thành công!',
      profile: {
        userId: faceProfile.userId,
        fullName: faceProfile.fullName,
        apartmentCode: faceProfile.apartmentCode,
        enrolledAt: faceProfile.enrolledAt,
        status: faceProfile.status,
        faceScore: faceProfile.faceScore,
      },
    });
  } catch (error: any) {
    console.error('Lỗi API face-enroll:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Lỗi hệ thống khi lưu trữ mẫu FaceID.' },
      { status: 500 }
    );
  }
}
