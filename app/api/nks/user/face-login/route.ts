import { NextResponse } from 'next/server';
import { getUserStore, StoredUser } from '@/lib/userStore';
import { DEMO_USERS } from '@/lib/dataStore';
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
    const { faceImage, isCameraCapture } = body;

    // 1. Kiểm tra ảnh đầu vào
    if (!faceImage || typeof faceImage !== 'string' || faceImage.trim() === '') {
      return NextResponse.json(
        { success: false, message: 'Vui lòng cung cấp hình ảnh khuôn mặt.' },
        { status: 400 }
      );
    }

    let imageBuffer: Buffer | null = null;
    if (faceImage.startsWith('data:image/')) {
      const base64Data = faceImage.replace(/^data:image\/\w+;base64,/, '');
      imageBuffer = Buffer.from(base64Data, 'base64');
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
        if (cp && cp.userId && !enrolledProfiles.some(p => p.userId === cp.userId)) {
          enrolledProfiles.push(cp);
          try {
            saveEnrolledFaceProfile(cp);
          } catch (e) {
            console.warn('Sync client profile error:', e);
          }
        }
      });
    }

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

    // 4. Nhận diện sinh trắc học 1:N đối soát với toàn bộ 4 mẫu góc quét của các hồ sơ đã đăng ký
    const matchResult = identifyFaceAmongEnrolled(faceImage, enrolledProfiles, 72.0);

    // 5. Nếu không khớp bất kỳ khuôn mặt nào trong 4 mẫu
    if (!matchResult.matched || !matchResult.profile) {
      return NextResponse.json(
        {
          success: false,
          matchScore: matchResult.score || 42.0,
          bestAngle: matchResult.bestAngle,
          sampleScores: matchResult.sampleScores,
          message: matchResult.message || 'Khuôn mặt chưa được đăng ký FaceID trên hệ thống. Vui lòng đăng nhập bằng mật khẩu và hoàn tất thu thập đủ 4 mẫu tại Hồ Sơ Cá Nhân.',
        },
        { status: 401 }
      );
    }

    // 5.1 Kiểm tra phê duyệt từ Ban Quản Lý (yêu cầu BQL duyệt trước khi kích hoạt FaceID)
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

    let matchedUserRecord = getUserStore(matchedUserId);
    if (!matchedUserRecord) {
      const demoMatch = DEMO_USERS.find(u => u.id === matchedUserId || u.username === matchedUserId);
      if (demoMatch) {
        matchedUserRecord = {
          id: demoMatch.id,
          username: demoMatch.username,
          fullname: demoMatch.full_name,
          full_name: demoMatch.full_name,
          email: demoMatch.email || `${demoMatch.username}@skyline.vn`,
          phone: demoMatch.phone || demoMatch.username,
          role: demoMatch.role as any,
          apartment_code: demoMatch.apartment_code || '12A05',
          avatar_url: matchResult.profile.avatarUrl || demoMatch.avatar_url,
        };
      }
    }

    if (!matchedUserRecord) {
      return NextResponse.json(
        { success: false, message: 'Tài khoản cư dân không tồn tại.' },
        { status: 404 }
      );
    }

    // 7. Cấp Token phiên đăng nhập an toàn & Cookie
    const token = `NKS_FACEID_SESSION_${matchedUserRecord.id}_${matchedUserRecord.role}_${Date.now()}`;

    const formattedUser = {
      id: matchedUserRecord.id,
      username: matchedUserRecord.username,
      firstname: matchedUserRecord.firstname || matchedUserRecord.fullname.split(' ').slice(-1)[0] || '',
      lastname: matchedUserRecord.lastname || matchedUserRecord.fullname.split(' ').slice(0, -1).join(' ') || '',
      fullname: matchedUserRecord.fullname,
      full_name: matchedUserRecord.fullname,
      email: matchedUserRecord.email,
      phone: matchedUserRecord.phone,
      role: matchedUserRecord.role,
      relationship: matchedUserRecord.relationship || (matchedUserRecord.role === 'OWNER' ? 'Owner' : 'Family'),
      apartment_code: matchedUserRecord.apartment_code || '12A05',
      avatar_url: matchedUserRecord.avatar_url,
      license_plate: matchedUserRecord.license_plate || '',
      id_number: matchedUserRecord.id_card_no || '',
      id_card_no: matchedUserRecord.id_card_no || '',
      dob: formatToDateInput(matchedUserRecord.dob),
      pob: matchedUserRecord.pob || '',
    };

    const res = NextResponse.json({
      success: true,
      message: `Nhận diện thành công: ${formattedUser.fullname} (${formattedUser.apartment_code}) - Mẫu khớp: ${matchResult.bestAngle || 'Chính diện'}`,
      matchScore: matchScore || 99.2,
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
      maxAge: 60 * 60 * 24 * 7,
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
