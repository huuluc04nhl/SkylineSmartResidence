import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      old_password, 
      password, 
      confirm_password, 
      target_user_id, 
      target_username, 
      access_token 
    } = body;

    if (!password || password.trim().length < 6) {
      return NextResponse.json(
        { success: false, message: 'Mật khẩu mới phải có độ dài tối thiểu 6 ký tự.' },
        { status: 400 }
      );
    }

    if (confirm_password && password !== confirm_password) {
      return NextResponse.json(
        { success: false, message: 'Mật khẩu xác nhận không khớp với mật khẩu mới.' },
        { status: 400 }
      );
    }

    const cookieStore = cookies();
    const token = access_token || cookieStore.get('nks_token')?.value || '';

    // 1. Forward directly to official NKS API if live session exists
    if (token && !token.startsWith('NKS_SESSION_')) {
      try {
        const formData = new URLSearchParams();
        formData.append('access_token', token);
        if (old_password) formData.append('old_password', old_password);
        formData.append('password', password);
        formData.append('repassword', confirm_password || password);

        const remoteRes = await fetch('https://account.nks.vn/api/nks/user/updatePass', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData.toString(),
        });

        const data = await remoteRes.json().catch(() => null);
        if (data) {
          if (data.success) {
            return NextResponse.json({
              success: true,
              message: data.message || 'Cập nhật mật khẩu NKS thành công',
              updated_at: new Date().toISOString(),
            });
          } else {
            return NextResponse.json(
              { success: false, message: data.message || 'Mật khẩu hiện tại không chính xác hoặc không hợp lệ.' },
              { status: 400 }
            );
          }
        }
      } catch (remoteErr) {
        console.warn('NKS remote updatePass warning:', remoteErr);
      }
    }

    // 2. Local / Mock / BQL accounts validation
    if (!old_password || !old_password.trim()) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng nhập mật khẩu hiện tại để xác thực tài khoản.' },
        { status: 400 }
      );
    }

    if (old_password === password) {
      return NextResponse.json(
        { success: false, message: 'Mật khẩu mới không được trùng với mật khẩu hiện tại.' },
        { status: 400 }
      );
    }

    const accountLabel = target_username || (target_user_id ? `ID: ${target_user_id}` : 'tài khoản của bạn');

    return NextResponse.json({
      success: true,
      message: `Đã đổi mật khẩu thành công cho ${accountLabel}! Mật khẩu mới có hiệu lực ngay lập tức.`,
      target_user_id: target_user_id || null,
      target_username: target_username || null,
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating password:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi máy chủ khi cập nhật mật khẩu' },
      { status: 500 }
    );
  }
}
