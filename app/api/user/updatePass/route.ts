import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      old_password, 
      password, 
      confirm_password, 
      access_token 
    } = body;

    if (!old_password || !old_password.trim()) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng nhập mật khẩu hiện tại để xác thực tài khoản.' },
        { status: 400 }
      );
    }

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

    if (old_password === password) {
      return NextResponse.json(
        { success: false, message: 'Mật khẩu mới không được trùng với mật khẩu hiện tại.' },
        { status: 400 }
      );
    }

    const cookieStore = cookies();
    const token = access_token || cookieStore.get('nks_token')?.value || '';

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để đổi mật khẩu.' },
        { status: 401 }
      );
    }

    // Gửi yêu cầu đổi mật khẩu trực tiếp tới API (https://account.nks.vn/api/nks/user/updatePass)
    const formData = new URLSearchParams();
    formData.append('access_token', token);
    formData.append('old_password', old_password);
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
          message: data.message || 'Cập nhật mật khẩu thành công qua hệ thống API.',
          updated_at: new Date().toISOString(),
        });
      } else {
        return NextResponse.json(
          { 
            success: false, 
            message: data.message || data.error || 'Mật khẩu hiện tại không chính xác hoặc không hợp lệ theo API.' 
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { success: false, message: 'Máy chủ API không phản hồi kết quả đổi mật khẩu.' },
      { status: 502 }
    );
  } catch (error: any) {
    console.error('Error updating password via API:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi máy chủ khi cập nhật mật khẩu qua API: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}
