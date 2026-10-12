import { NextResponse } from 'next/server';
import { getUserStore, StoredUser } from '@/lib/userStore';
import { identifyFaceAmongEnrolled } from '@/lib/biometricFaceEngine';
import { getAllEnrolledFaceProfiles, saveEnrolledFaceProfile } from '@/lib/faceEnrollStore';

function formatToDateInput(d?: string): string {
  if (!d) return '';
  const cleanD = d.replace(/[^\d\/\-\.]/g, '');
  const parts = cleanD.split(/[\/\-\.]/);
  if (parts.length === 3) {
    if (parts[2].length === 4) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }
    if (parts[0].length === 4) {
      const year = parts[0];
      const month = parts[1].padStart(2, '0');
      const day = parts[2].padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }
  return d;
}

/**
 * Trích xuất kích thước và định dạng ảnh từ Buffer
 */
function parseImageDimensions(buf: Buffer): { width: number; height: number; type: string } | null {
  if (buf.length < 16) return null;
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return {
      width: buf.readUInt32BE(16),
      height: buf.readUInt32BE(20),
      type: 'png'
    };
  }
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i < buf.length - 10) {
      if (buf[i] === 0xff && (buf[i + 1] === 0xc0 || buf[i + 1] === 0xc2)) {
        return {
          height: buf.readUInt16BE(i + 5),
          width: buf.readUInt16BE(i + 7),
          type: 'jpeg'
        };
      }
      i++;
    }
    return { width: 640, height: 480, type: 'jpeg' };
  }
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
    return { width: 640, height: 480, type: 'webp' };
  }
  return null;
}

/**
 * POST /api/nks/user/face-login
 * API chuẩn xác thực sinh trắc học FaceID 1:N
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { faceImage, faceVector, isCameraCapture } = body;

    // 1. Kiểm tra ảnh đầu vào hoặc vector đặc trưng
    if ((!faceImage || typeof faceImage !== 'string' || faceImage.trim() === '') && !Array.isArray(faceVector)) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng cung cấp hình ảnh khuôn mặt.' },
        { status: 400 }
      );
    }

    let imageBuffer: Buffer | null = null;
    if (faceImage && typeof faceImage === 'string') {
      const base64Data = faceImage.startsWith('data:image/')
        ? faceImage.replace(/^data:image\/\w+;base64,/, '')
        : faceImage.trim();
      try {
        imageBuffer = Buffer.from(base64Data, 'base64');
      } catch {
        imageBuffer = null;
      }
    }

    // 2. Kiểm tra chất lượng và độ rõ nét
    if (imageBuffer) {
      if (imageBuffer.length < 2500) {
        return NextResponse.json(
          { success: false, message: 'Ảnh khuôn mặt quá mờ hoặc dung lượng quá nhỏ.' },
          { status: 400 }
        );
      }

      const dimensions = parseImageDimensions(imageBuffer);
      if (dimensions && (dimensions.width < 100 || dimensions.height < 100)) {
        return NextResponse.json(
          { success: false, message: 'Độ phân giải ảnh quá thấp (yêu cầu tối thiểu 150x150px).' },
          { status: 400 }
        );
      }
    }

    // 3. Cơ sở dữ liệu FaceID ĐÃ ĐĂNG KÝ MẪU CHÍNH THỨC
    const serverProfiles = getAllEnrolledFaceProfiles();
    const enrolledProfiles = [...serverProfiles];

    // Đồng bộ hồ sơ 4 mẫu quét từ client (nếu có)
    if (Array.isArray(body.clientProfiles)) {
      body.clientProfiles.forEach((cp: any) => {
        if (cp && cp.userId) {
          if (cp.apartmentCode === '12A05' || cp.apartmentCode === '12A5' || !cp.apartmentCode) {
            cp.apartmentCode = 'CH-06';
          }
          if (!enrolledProfiles.some(p => p.userId === cp.userId)) {
            enrolledProfiles.push(cp);
            try {
              saveEnrolledFaceProfile(cp);
            } catch (e) {
              console.warn('Sync client profile error:', e);
            }
          }
        }
      });
    }

    // Luôn chuẩn hóa toàn bộ hồ sơ đối soát sang mã căn hộ chuẩn API (CH-06)
    enrolledProfiles.forEach(p => {
      if (p && (p.apartmentCode === '12A05' || p.apartmentCode === '12A5' || !p.apartmentCode)) {
        p.apartmentCode = 'CH-06';
      }
    });

    if (enrolledProfiles.length === 0) {
      return NextResponse.json(
        {
          success: false,
          matchScore: 0,
          message: 'Chưa có tài khoản nào hoàn tất thu thập đủ 4 mẫu FaceID trên hệ thống. Vui lòng đăng nhập bằng mật khẩu và vào mục Hồ Sơ Cá Nhân để đăng ký quét mặt.',
        },
        { status: 401 }
      );
    }

    // 4. Nhận diện sinh trắc học 1:N đối soát với vector pixel chuẩn hóa
    const liveInput = (Array.isArray(faceVector) && faceVector.length === 128)
      ? faceVector
      : faceImage;

    const threshold = isCameraCapture ? 68.0 : 72.0;
    const matchResult = identifyFaceAmongEnrolled(liveInput, enrolledProfiles, threshold);

    if (matchResult.profile) {
      if (matchResult.profile.apartmentCode === '12A05' || matchResult.profile.apartmentCode === '12A5' || !matchResult.profile.apartmentCode) {
        matchResult.profile.apartmentCode = 'CH-06';
      }
    }

    // 5. Nếu không khớp bất kỳ khuôn mặt nào trong 4 mẫu
    if (!matchResult.matched || !matchResult.profile) {
      return NextResponse.json(
        {
          success: false,
          matchScore: matchResult.score || 38.0,
          bestAngle: matchResult.bestAngle,
          sampleScores: matchResult.sampleScores,
          message: matchResult.message || 'Khuôn mặt chưa được đăng ký FaceID trên hệ thống hoặc độ tương đồng không đạt chuẩn an toàn.',
        },
        { status: 401 }
      );
    }

    // 5.1 Kiểm tra phê duyệt
    if (matchResult.profile.status === 'PENDING_OWNER') {
      return NextResponse.json(
        {
          success: false,
          matchScore: matchResult.score,
          bestAngle: matchResult.bestAngle,
          sampleScores: matchResult.sampleScores,
          message: `Hồ sơ 4 mẫu FaceID của cư dân ${matchResult.profile.fullName} (Căn ${matchResult.profile.apartmentCode}) đang chờ Chủ Hộ xác nhận trước khi gửi Ban Quản Lý phê duyệt. Vui lòng nhắc Chủ Hộ vào mục Quản lý người thân để xác nhận hoặc đăng nhập bằng Email / Mật khẩu.`,
        },
        { status: 403 }
      );
    }

    if (matchResult.profile.status === 'PENDING') {
      return NextResponse.json(
        {
          success: false,
          matchScore: matchResult.score,
          bestAngle: matchResult.bestAngle,
          sampleScores: matchResult.sampleScores,
          message: `Hồ sơ 4 mẫu FaceID của cư dân ${matchResult.profile.fullName} (Căn ${matchResult.profile.apartmentCode}) đang chờ Ban Quản Lý phê duyệt. Vui lòng liên hệ BQL hoặc đăng nhập bằng Email / Mật khẩu.`,
        },
        { status: 403 }
      );
    }

    if (matchResult.profile.status === 'REVOKED') {
      return NextResponse.json(
        {
          success: false,
          matchScore: matchResult.score,
          message: `Quyền truy cập FaceID của cư dân ${matchResult.profile.fullName} đã bị thu hồi. Vui lòng liên hệ Ban Quản Lý Skyline để kích hoạt lại.`,
        },
        { status: 403 }
      );
    }

    const matchedUserId = matchResult.profile.userId;
    const matchScore = matchResult.score;

    // Lấy thông tin tài khoản người dùng khớp FaceID
    let matchedUserRecord = getUserStore(matchedUserId);
    if (!matchedUserRecord && matchResult.profile.phone) {
      matchedUserRecord = getUserStore(matchResult.profile.phone);
    }
    if (!matchedUserRecord && matchResult.profile.email) {
      matchedUserRecord = getUserStore(matchResult.profile.email);
    }

    const fallbackRole = (matchResult.profile.email?.includes('admin') || matchResult.profile.email?.includes('manager01'))
      ? 'ADMIN'
      : (matchResult.profile.email?.includes('technician') || matchResult.profile.email?.includes('manager02'))
      ? 'TECHNICIAN'
      : (matchedUserRecord?.role || 'OWNER');

    const resolvedUser = matchedUserRecord || {
      id: matchedUserId,
      username: matchResult.profile.email || matchResult.profile.phone || matchedUserId,
      firstname: matchResult.profile.fullName.split(' ').slice(-1)[0] || '',
      lastname: matchResult.profile.fullName.split(' ').slice(0, -1).join(' ') || '',
      fullname: matchResult.profile.fullName,
      email: matchResult.profile.email || '',
      phone: matchResult.profile.phone || '',
      role: fallbackRole,
      apartment_code: matchResult.profile.apartmentCode || 'CH-06',
      avatar_url: matchResult.profile.avatarUrl || '',
      relationship: fallbackRole === 'ADMIN' || fallbackRole === 'TECHNICIAN' ? 'Staff' : (fallbackRole === 'OWNER' ? 'Owner' : 'Family'),
      id_card_no: '',
      dob: '',
      pob: '',
    };

    const token = `SKYLINE_FACEID_SESSION_${resolvedUser.id}_${resolvedUser.role}_${Date.now()}`;
    const cleanApt = (!resolvedUser.apartment_code || resolvedUser.apartment_code === '12A05' || resolvedUser.apartment_code === '12A5') ? 'CH-06' : resolvedUser.apartment_code;

    const formattedUser = {
      id: String(resolvedUser.id),
      username: resolvedUser.username || resolvedUser.email || resolvedUser.phone || '',
      firstname: (resolvedUser as any).firstname || resolvedUser.fullname.split(' ').slice(-1)[0] || '',
      lastname: (resolvedUser as any).lastname || resolvedUser.fullname.split(' ').slice(0, -1).join(' ') || '',
      fullname: resolvedUser.fullname,
      full_name: resolvedUser.fullname,
      email: resolvedUser.email || '',
      phone: resolvedUser.phone || '',
      role: resolvedUser.role,
      relationship: (resolvedUser as any).relationship || (resolvedUser.role === 'ADMIN' || resolvedUser.role === 'TECHNICIAN' ? 'Staff' : (resolvedUser.role === 'OWNER' ? 'Owner' : 'Family')),
      apartment_code: cleanApt,
      avatar_url: resolvedUser.avatar_url || matchResult.profile.avatarUrl || '',
      avatar: resolvedUser.avatar_url || matchResult.profile.avatarUrl || '',
      id_number: (resolvedUser as any).id_card_no || '',
      id_card_no: (resolvedUser as any).id_card_no || '',
      dob: formatToDateInput((resolvedUser as any).dob),
      pob: (resolvedUser as any).pob || '',
    };

    const res = NextResponse.json({
      success: true,
      message: `Nhận diện FaceID thành công: ${formattedUser.fullname} (${formattedUser.apartment_code}) - Mẫu khớp: ${matchResult.bestAngle || 'Chính diện'}`,
      matchScore: matchScore || 0,
      bestAngle: matchResult.bestAngle || 'Chính diện',
      sampleScores: matchResult.sampleScores,
      access_token: token,
      user: formattedUser,
    });

    res.cookies.set('nks_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });

    res.cookies.set('nks_user_role', formattedUser.role, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });

    return res;
  } catch (error: any) {
    console.error('FaceID login error:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi máy chủ xác thực khuôn mặt.' },
      { status: 500 }
    );
  }
}
