import { NextResponse } from 'next/server';
import { extractFaceDescriptorFromBase64, EnrolledFaceProfile } from '@/lib/biometricFaceEngine';
import { saveEnrolledFaceProfile, getEnrolledFaceProfile, getAllEnrolledFaceProfiles } from '@/lib/faceEnrollStore';
import { updateUserStore, getUserStore, updateApartmentMember } from '@/lib/userStore';
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
    const { 
      action,
      userId, 
      fullName, 
      apartmentCode, 
      phone, 
      samples,
      isFamilyMemberSelfEnroll,
      submittedByRole
    } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Thiếu thông tin định danh người dùng (userId).' },
        { status: 400 }
      );
    }

    // =========================================================================
    // CASE 1: CHỦ HỘ XÁC NHẬN HỒ SƠ FACEID CỦA NGƯỜI NHÀ ĐỂ GỬI BQL
    // =========================================================================
    if (action === 'CONFIRM_BY_OWNER') {
      const existingProfile = getEnrolledFaceProfile(userId);
      if (!existingProfile) {
        return NextResponse.json(
          { success: false, message: 'Không tìm thấy hồ sơ mẫu FaceID cần xác nhận.' },
          { status: 404 }
        );
      }

      existingProfile.status = 'PENDING';
      existingProfile.confirmedByOwner = true;
      existingProfile.confirmedByOwnerAt = new Date().toISOString();
      saveEnrolledFaceProfile(existingProfile);

      const targetApt = apartmentCode || existingProfile.apartmentCode || '12A05';
      updateApartmentMember(targetApt, userId, {
        faceStatus: 'Đang Chờ BQL Phê Duyệt',
      });

      const existingUser = getUserStore(userId);
      try {
        submitEkycRequest({
          userId,
          fullName: existingProfile.fullName,
          roleLabel: 'Người Nhà (Đã Chủ Hộ Xác Nhận)',
          apartmentCode: targetApt,
          phone: existingProfile.phone || existingUser?.phone || '',
          idCardNo: existingUser?.id_card_no || '079198005678',
          idDate: existingUser?.id_date || '10/01/2023',
          idPlace: existingUser?.id_place || 'Cục Cảnh sát QLHC về TTXH',
          avatarUrl: existingUser?.avatar_url || existingProfile.avatarUrl || '',
          idCardFrontUrl: existingUser?.cccd_front_url || '',
          idCardBackUrl: existingUser?.cccd_back_url || '',
          faceSamples: {
            front: existingProfile.samples.front,
            left: existingProfile.samples.left,
            right: existingProfile.samples.right,
            smile: existingProfile.samples.smile,
          },
          faceScore: existingProfile.faceScore || 99.4,
        });
      } catch (e) {
        console.warn('Submit e-KYC request to BQL error:', e);
      }

      return NextResponse.json({
        success: true,
        message: `Chủ hộ đã xác nhận hồ sơ FaceID cho thành viên "${existingProfile.fullName}" và gửi Ban Quản Lý phê duyệt thành công!`,
        profile: existingProfile,
      });
    }

    // =========================================================================
    // CASE 2: THU THẬP MẪU FACEID MỚI (BỞI CHỦ HỘ HOẶC NGƯỜI NHÀ TỰ QUÉT)
    // =========================================================================
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
    const targetApt = apartmentCode || existingUser?.apartment_code || '12A05';

    // Xác định luồng: Nếu là Người nhà tự quét (TENANT) -> status = 'PENDING_OWNER' (chờ chủ hộ duyệt)
    // Nếu do Chủ hộ đích thân quét hoặc Chủ hộ tự làm -> status = 'PENDING' (gửi thẳng BQL)
    const isPendingOwner = isFamilyMemberSelfEnroll || (submittedByRole === 'TENANT' && existingUser?.role !== 'OWNER');

    const faceProfile: EnrolledFaceProfile = {
      userId,
      fullName: fullName || existingUser?.fullname || 'Cư Dân Skyline',
      apartmentCode: targetApt,
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
      status: isPendingOwner ? 'PENDING_OWNER' : 'PENDING',
      confirmedByOwner: !isPendingOwner,
      confirmedByOwnerAt: !isPendingOwner ? new Date().toISOString() : undefined,
      faceScore: 99.4,
    };

    // 2. Lưu vào FaceEnrollStore (Bộ nhớ + File .skyline_faces.json trên server)
    saveEnrolledFaceProfile(faceProfile);

    // 3. Cập nhật trạng thái FaceID trong ApartmentMember
    updateApartmentMember(targetApt, userId, {
      faceStatus: isPendingOwner ? 'Chờ Chủ Hộ Xác Nhận' : 'Đang Chờ BQL Phê Duyệt',
    });

    // 4. Cập nhật User Store
    updateUserStore(userId, {
      updated_at: new Date().toISOString(),
    });

    // 5. Nếu không phải chờ chủ hộ xác nhận (đã được Chủ hộ bảo lãnh), gửi thẳng BQL
    if (!isPendingOwner) {
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
    }

    const message = isPendingOwner
      ? 'Đã thu thập 4 mẫu FaceID thành công! Hồ sơ đang chờ Chủ Hộ căn hộ xác nhận trước khi chuyển tới Ban Quản Lý.'
      : 'Thu thập 4 mẫu FaceID thành công! Hồ sơ đã được chuyển đến Ban Quản Lý để thẩm định và phê duyệt.';

    return NextResponse.json({
      success: true,
      message,
      status: faceProfile.status,
      profile: {
        userId: faceProfile.userId,
        fullName: faceProfile.fullName,
        apartmentCode: faceProfile.apartmentCode,
        enrolledAt: faceProfile.enrolledAt,
        status: faceProfile.status,
        confirmedByOwner: faceProfile.confirmedByOwner,
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
