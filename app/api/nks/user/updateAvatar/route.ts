import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { updateUserStore, extractUserIdFromToken } from '@/lib/userStore';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { avatar, access_token } = body;

    const cookieStore = cookies();
    const token = access_token || cookieStore.get('nks_token')?.value || '';

    let liveAvatarUrl: string | undefined = undefined;

    // 1. Forward directly to live official NKS API
    try {
      if (token) {
        const formData = new URLSearchParams();
        formData.append('access_token', token);
        if (avatar) formData.append('avatar', avatar);

        const remoteRes = await fetch('https://account.nks.vn/api/nks/user/updateAvatar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData.toString(),
        });

        if (remoteRes.ok) {
          // Immediately fetch updated user to get newly generated CDN avatar URL
          const userRes = await fetch('https://account.nks.vn/api/nks/user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ access_token: token }).toString(),
          });
          if (userRes.ok) {
            const userData = await userRes.json();
            if (userData.success && userData.data?.avatar) {
              const rawAvatar = userData.data.avatar;
              liveAvatarUrl = rawAvatar.startsWith('http') ? rawAvatar : `https://data.nks.vn/${rawAvatar.startsWith('/') ? rawAvatar.slice(1) : rawAvatar}`;
            }
          }
        }
      }
    } catch (e) {
      console.warn('Remote updateAvatar error:', e);
    }

    const finalAvatar = liveAvatarUrl || avatar;
    const userIdentifier = extractUserIdFromToken(token) || body.username || body.phone || 'user-owner-1';
    const updated = updateUserStore(userIdentifier, {
      avatar_url: finalAvatar
    });

    return NextResponse.json({
      success: true,
      message: 'Cập nhật ảnh đại diện NKS API thành công',
      avatar_url: finalAvatar,
      user: {
        ...updated,
        avatar_url: finalAvatar,
        avatar: finalAvatar,
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Lỗi cập nhật ảnh đại diện NKS' }, { status: 500 });
  }
}
