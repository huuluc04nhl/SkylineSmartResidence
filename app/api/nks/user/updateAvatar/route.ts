import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { updateUserStore } from '@/lib/userStore';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { avatar, access_token } = body;

    const cookieStore = cookies();
    const token = access_token || cookieStore.get('nks_token')?.value || '';
    const roleKey = token.includes('ADMIN') ? 'ADMIN' : token.includes('TENANT') ? 'TENANT' : 'OWNER';

    const updated = updateUserStore(roleKey, {
      avatar_url: avatar
    });

    return NextResponse.json({
      success: true,
      message: 'Cập nhật ảnh đại diện NKS thành công',
      avatar_url: updated.avatar_url,
      user: updated
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Lỗi cập nhật ảnh đại diện NKS' }, { status: 500 });
  }
}
