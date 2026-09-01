import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { avatar, access_token } = body;

    return NextResponse.json({
      success: true,
      message: 'Cập nhật ảnh đại diện NKS thành công',
      avatar_url: avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Lỗi cập nhật ảnh đại diện NKS' }, { status: 500 });
  }
}
