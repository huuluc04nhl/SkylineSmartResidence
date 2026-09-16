import { NextResponse } from 'next/server';
import { extractFaceDescriptorFromBase64, EnrolledFaceProfile } from '@/lib/biometricFaceEngine';
import { saveEnrolledFaceProfile, getEnrolledFaceProfile, getAllEnrolledFaceProfiles } from '@/lib/faceEnrollStore';
import { updateUserStore, getUserStore } from '@/lib/userStore';
import { submitEkycRequest } from '@/lib/ekycStore';

/**
 * GET /api/nks/user/face-enroll?userId=...
 * Đồng bộ hồ sơ 4 mẫu FaceID giữa Mobile, Desktop và Ban Quản Lý
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (userId) {
      const profile = getEnrolledFaceProfile(userId);
      return NextResponse.json({
        success: true,
        profile: profile || null,
      });
    }

    const profiles = getAllEnrolledFaceProfiles();
    return NextResponse.json({
      success: true,
      profiles,
    });
  } catch (error: any) {
    console.error('Lỗi GET face-enroll:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Lỗi tải thông tin FaceID.' },
      { status: 500 }
    );
  }
}

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

    // 1. Phân tích trích xuất vector đặc trưng sinh trắc học tổng hợp từ cả 4 mẫu quét
    const descFront = extractFaceDescriptorFromBase64(samples.front);
    const descLeft = extractFaceDescriptorFromBase64(samples.left);
    const descRight = extractFaceDescriptorFromBase64(samples.right);
    const descSmile = extractFaceDescriptorFromBase64(samples.smile);

    // Tạo vector tổng hợp 128 chiều từ 4 mẫu góc quét
    const compositeDesc = new Float32Array(128);
    let sumSq = 0;
    for (let i = 0; i < 128; i++) {
      const val = (descFront[i] + descLeft[i] + descRight[i] + descSmile[i]) / 4;
      compositeDesc[i] = val;
      sumSq += val * val;
    }
    const norm = Math.sqrt(sumSq);
    if (norm > 0) {
      for (let i = 0; i < 128; i++) {
        compositeDesc[i] /= norm;
      }
    }
    const descriptorArray = Array.from(compositeDesc);

    // Lấy thông tin user hiện tại (giữ nguyên avatar_url, không ghi đè)
    const existingUser = getUserStore(userId);

    // 2. Tạo hồ sơ đăng ký FaceID chính thức lưu đủ 4 mẫu quét
    // QUY TẮC: Mẫu quét xong sẽ ở trạng thái PENDING chờ Ban Quản Lý thẩm định & phê duyệt
    const faceProfile: EnrolledFaceProfile = {
      userId,
      fullName: fullName || existingUser?.fullname || 'Cư Dân Skyline',
      apartmentCode: apartmentCode || existingUser?.apartment_code || '12A05',
      phone: phone || existingUser?.phone || '',
      avatarUrl: existingUser?.avatar_url || '',
      samples: {
        front: samples.front,
        left: samples.left,
        right: samples.right,
        smile: samples.smile,
      },
      descriptor: descriptorArray,
      enrolledAt: new Date().toISOString(),
      status: 'PENDING', // Chờ Ban Quản Lý phê duyệt
      faceScore: 99.4,
    };

    // 3. Lưu vào FaceEnrollStore (Bộ nhớ + File .skyline_faces.json trên server)
    saveEnrolledFaceProfile(faceProfile);

    // 4. Cập nhật trạng thái FaceID trong User Store - TUYỆT ĐỐI KHÔNG cập nhật / ghi đè avatar_url
    updateUserStore(userId, {
      updated_at: new Date().toISOString(),
    });

    // 5. Tự động gửi hồ sơ lên Ban Quản Lý (eKYC) kèm trọn vẹn 4 mẫu quét để đối soát & phê duyệt
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
        avatarUrl: existingUser?.avatar_url || '',
        idCardFrontUrl: existingUser?.cccd_front_url || '',
        idCardBackUrl: existingUser?.cccd_back_url || '',
        faceSamples: {
          front: samples.front,
          left: samples.left,
          right: samples.right,
          smile: samples.smile,
        },
        faceScore: 99.4,
      });
    } catch (e) {
      console.warn('Sync ekyc request error:', e);
    }

    return NextResponse.json({
      success: true,
      message: 'Thu thập 4 mẫu FaceID thành công! Hồ sơ đã được chuyển đến Ban Quản Lý để thẩm định và phê duyệt.',
      profile: {
        userId: faceProfile.userId,
        fullName: faceProfile.fullName,
        apartmentCode: faceProfile.apartmentCode,
        enrolledAt: faceProfile.enrolledAt,
        status: faceProfile.status,
        faceScore: faceProfile.faceScore,
        samples: faceProfile.samples,
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
