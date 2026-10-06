import { NextResponse } from 'next/server';

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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || typeof username !== 'string' || username.trim() === '') {
      return NextResponse.json(
        { success: false, message: 'Vui lòng cung cấp số điện thoại hoặc email đăng nhập.' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.trim() === '') {
      return NextResponse.json(
        { success: false, message: 'Vui lòng nhập mật khẩu tài khoản để đăng nhập.' },
        { status: 400 }
      );
    }

    const u = username.trim();

    // 1. Xác thực trực tiếp 100% qua API chính thức (https://account.nks.vn/api/nks/user/login)
    const formData = new URLSearchParams();
    formData.append('username', u);
    formData.append('password', password);
    formData.append('system', 'NKS');
    formData.append('device', 'Web Browser');

    let remoteRes: Response;
    try {
      remoteRes = await fetch('https://account.nks.vn/api/nks/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });
    } catch (networkErr: any) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Không thể kết nối đến máy chủ API xác thực (https://account.nks.vn). Vui lòng kiểm tra mạng.' 
        },
        { status: 503 }
      );
    }

    const data = await remoteRes.json().catch(() => null);

    if (!data) {
      return NextResponse.json(
        { success: false, message: 'Máy chủ API không phản hồi dữ liệu hợp lệ.' },
        { status: 502 }
      );
    }

    // 2. Kiểm tra phản hồi từ API: Nếu API từ chối -> Báo lỗi chính xác từ API, KHÔNG fallback tài khoản demo
    if (!data.success || !data.data) {
      const errorMessage = data.error || data.message || 'Tài khoản hoặc mật khẩu không chính xác trên hệ thống API.';
      return NextResponse.json(
        { success: false, message: errorMessage },
        { status: 401 }
      );
    }

    // 3. API xác thực thành công -> Chuẩn hóa thông tin User & Access Token từ API response
    const apiUser = data.data.user || {};
    const accessToken = data.data.access_token || '';

    const uLower = u.toLowerCase();
    const emailLower = (apiUser.email || '').toLowerCase();
    const role = (emailLower.includes('manager01') || emailLower.includes('admin') || uLower.includes('manager01') || uLower.includes('admin')) 
      ? 'ADMIN' 
      : (emailLower.includes('manager02') || uLower.includes('manager02'))
      ? 'TECHNICIAN'
      : (emailLower.includes('nhut') || emailLower.includes('cuong') || emailLower.includes('hai') || emailLower.includes('thinh'))
      ? 'TENANT'
      : 'OWNER';

    const formattedUser = {
      id: String(apiUser.id || 'usr-120'),
      username: apiUser.email || u,
      firstname: apiUser.firstname || '',
      lastname: apiUser.lastname || '',
      fullname: apiUser.name || `${apiUser.lastname || ''} ${apiUser.firstname || ''}`.trim() || 'Cư Dân SKYLINE',
      full_name: apiUser.name || `${apiUser.lastname || ''} ${apiUser.firstname || ''}`.trim() || 'Cư Dân SKYLINE',
      email: apiUser.email || u,
      phone: apiUser.phone || '',
      role: role,
      apartment_code: (role === 'ADMIN' || role === 'TECHNICIAN') ? 'BQL_OFFICE' : 'CH-06',
      relationship: (role === 'ADMIN' || role === 'TECHNICIAN') ? 'Staff' : role === 'OWNER' ? 'Owner' : 'Family',
      avatar_url: apiUser.avatar ? (apiUser.avatar.startsWith('http') ? apiUser.avatar : `https://data.nks.vn/${apiUser.avatar}`) : undefined,
      avatar: apiUser.avatar ? (apiUser.avatar.startsWith('http') ? apiUser.avatar : `https://data.nks.vn/${apiUser.avatar}`) : undefined,
      id_number: apiUser.id_number || '',
      id_card_no: apiUser.id_number || '',
      id_card_number: apiUser.id_number || '',
      id_date: formatToDateInput(apiUser.id_date || apiUser.formatedCccdDate || ''),
      id_place: apiUser.id_place || '',
      province: apiUser.province || 'Thành phố Hồ Chí Minh',
      gender: apiUser.gender ?? 1,
      dob: formatToDateInput(apiUser.dob || apiUser.formatedDob || ''),
      pob: apiUser.pob || '',
    };

    const response = NextResponse.json({
      success: true,
      message: 'Đăng nhập thành công từ API',
      access_token: accessToken,
      user: formattedUser,
    });

    if (accessToken) {
      response.cookies.set('nks_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    return response;
  } catch (error: any) {
    console.error('Login route error:', error?.message || error);
    return NextResponse.json(
      { success: false, message: 'Lỗi máy chủ xử lý đăng nhập: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}
