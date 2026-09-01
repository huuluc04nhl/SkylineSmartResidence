import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { old_password, password, access_token } = body;

    return NextResponse.json({
      success: true,
      message: 'Cập nhật mật khẩu NKS thành công',
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Lỗi cập nhật mật khẩu NKS' }, { status: 500 });
  }
}
