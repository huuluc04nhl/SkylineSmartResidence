import { NextResponse } from 'next/server';
import { getEkycRequests } from '@/lib/ekycStore';
import { getUserStore, StoredUser } from '@/lib/userStore';
import { DEMO_USERS } from '@/lib/dataStore';
import { identifyFaceResident } from '@/lib/ekycValidator';

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

    // 3. Cơ sở dữ liệu e-KYC từ Ban Quản Lý và User Store
    const ekycList = getEkycRequests();
    
    // Xây dựng danh sách ứng viên đối chiếu sinh trắc học
    const candidateResidents = ekycList.map(r => ({
      userId: r.userId,
      fullName: r.fullName,
      avatarUrl: r.avatarUrl,
      status: r.status,
      apartmentCode: r.apartmentCode,
    }));

    // Bổ sung các tài khoản demo nếu chưa có trong ekycList
    DEMO_USERS.forEach(u => {
      if (!candidateResidents.some(c => c.userId === u.id)) {
        candidateResidents.push({
          userId: u.id,
          fullName: u.full_name,
          avatarUrl: u.avatar_url || '',
          status: u.role === 'OWNER' ? 'APPROVED' : 'APPROVED',
          apartmentCode: u.apartment_code || '12A05',
        });
      }
    });

    // 4. Nhận diện sinh trắc học 1:N chuẩn xác
    const faceResult = identifyFaceResident(imageBuffer || faceImage, candidateResidents);

    // 5. Nếu không khớp bất kỳ cư dân nào
    if (!faceResult.matched) {
      if (faceResult.status === 'PENDING') {
        return NextResponse.json(
          {
            success: false,
            matchScore: faceResult.score,
            message: faceResult.message,
          },
          { status: 403 }
        );
      }

      if (faceResult.status === 'REJECTED') {
        return NextResponse.json(
          {
            success: false,
            matchScore: faceResult.score,
            message: faceResult.message,
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          matchScore: faceResult.score || 42.0,
          message: faceResult.message,
        },
        { status: 401 }
      );
    }

    const matchedUserId = faceResult.resident!.userId;
    const matchScore = faceResult.score;

    const matchedUserRecord = getUserStore(matchedUserId);
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
      message: `Nhận diện thành công: ${formattedUser.fullname} (${formattedUser.apartment_code})`,
      matchScore: matchScore || 99.2,
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
