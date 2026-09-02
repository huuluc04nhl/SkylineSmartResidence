import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { DEMO_USERS } from '@/lib/dataStore';

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

    const u = username.toLowerCase().trim();

    // 1. Call official live NKS Server (https://account.nks.vn/api/nks/user/login)
    try {
      const formData = new URLSearchParams();
      formData.append('username', username.trim());
      formData.append('password', password || '12345678');
      formData.append('system', 'NKS');
      formData.append('device', 'Web Browser');

      const remoteRes = await fetch('https://account.nks.vn/api/nks/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });

      if (remoteRes.ok) {
        const data = await remoteRes.json();
        if (data.success && data.data) {
          const apiUser = data.data.user || {};
          const accessToken = data.data.access_token || '';

          const role = (u.includes('manager01') || u.includes('admin')) 
            ? 'ADMIN' 
            : u.includes('manager02')
            ? 'TECHNICIAN'
            : (u.includes('nhut') || u.includes('cuong') || u.includes('hai') || u.includes('thinh'))
            ? 'TENANT'
            : 'OWNER';

          const formattedUser = {
            id: String(apiUser.id || 'usr-120'),
            username: apiUser.email || username,
            firstname: apiUser.firstname || '',
            lastname: apiUser.lastname || '',
            fullname: apiUser.name || `${apiUser.lastname || ''} ${apiUser.firstname || ''}`.trim() || 'Nguyễn Hữu Lực',
            full_name: apiUser.name || `${apiUser.lastname || ''} ${apiUser.firstname || ''}`.trim() || 'Nguyễn Hữu Lực',
            email: apiUser.email || username,
            phone: apiUser.phone || '0903112233',
            role: role,
            apartment_code: '12A05',
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
            message: 'Đăng nhập thành công từ NKS API',
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
        }
      }
    } catch (e) {
      console.warn('Remote NKS login error:', e);
    }

    // 2. Query User Database (Exact Matching)
    const matched = DEMO_USERS.find((user) => {
      const uName = (user.username || '').toLowerCase().trim();
      const uEmail = (user.email || '').toLowerCase().trim();
      const uPhone = (user.phone || '').toLowerCase().trim();
      return uName === u || uEmail === u || uPhone === u;
    });

    if (!matched) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Tài khoản không tồn tại. Vui lòng kiểm tra lại số điện thoại hoặc email đã đăng ký với BQL tòa nhà.' 
        },
        { status: 401 }
      );
    }

    // 3. For Admin / Manager, verify password
    if (matched.role === 'ADMIN') {
      if (password && password !== '12345678' && password !== 'admin123') {
        return NextResponse.json(
          { success: false, message: 'Mật khẩu quản trị Ban Quản Lý không chính xác.' },
          { status: 401 }
        );
      }
    }

    // 4. Generate Access Token & Build User Profile
    const token = `NKS_TOKEN_${matched.role}_${Date.now()}`;
    const userProfile = {
      id: matched.id,
      username: matched.username,
      firstname: matched.full_name.split(' ').slice(-1)[0] || '',
      lastname: matched.full_name.split(' ').slice(0, -1).join(' ') || '',
      fullname: matched.full_name,
      full_name: matched.full_name,
      email: matched.email || `${matched.username}@skyline.vn`,
      phone: matched.phone || matched.username,
      role: matched.role,
      apartment_code: matched.apartment_code || (matched.role === 'ADMIN' ? 'BQL_OFFICE' : '12A05'),
      avatar_url: matched.avatar_url,
      id_number: matched.id_card_no || '079095001234',
    };

    const res = NextResponse.json({
      success: true,
      message: 'Đăng nhập thành công',
      access_token: token,
      user: userProfile,
    });

    // Set secure HTTP-Only session cookie
    res.cookies.set('nks_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (error: any) {
    console.error('Login route error:', error?.message || error);
    return NextResponse.json(
      { success: false, message: 'Lỗi máy chủ xử lý đăng nhập: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}
