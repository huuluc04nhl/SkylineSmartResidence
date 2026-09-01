import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { DEMO_USERS } from '@/lib/dataStore';

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

    // 1. Attempt remote NKS Server if live
    try {
      const remoteRes = await fetch('https://account.nks.vn/api/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (remoteRes.ok) {
        const data = await remoteRes.json();
        const response = NextResponse.json(data);
        if (data.access_token) {
          response.cookies.set('nks_token', data.access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7,
          });
        }
        return response;
      }
    } catch (e) {
      // Remote unavailable, proceed with internal database authentication
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
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Lỗi máy chủ xử lý đăng nhập.' },
      { status: 500 }
    );
  }
}
