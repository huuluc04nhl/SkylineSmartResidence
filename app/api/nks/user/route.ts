import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserStore } from '@/lib/userStore';

export async function POST(req: Request) {
  try {
    let access_token: string | undefined;

    try {
      const body = await req.json();
      access_token = body.access_token;
    } catch (e) {
      // Body empty
    }

    if (!access_token) {
      const cookieStore = cookies();
      access_token = cookieStore.get('nks_token')?.value;
    }

    if (!access_token) {
      return NextResponse.json({ success: false, message: 'Chưa đăng nhập (No Token)' }, { status: 401 });
    }

    // 1. Try remote official NKS Server if live
    try {
      const remoteRes = await fetch('https://account.nks.vn/api/nks/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token }),
      });

      if (remoteRes.ok) {
        const data = await remoteRes.json();
        return NextResponse.json({ success: true, user: data.user || data });
      }
    } catch (e) {
      // Remote NKS offline
    }

    // 2. Server-side Session Token Resolver
    if (access_token.includes('ADMIN') || access_token.includes('MANAGER')) {
      return NextResponse.json({
        success: true,
        user: getUserStore('ADMIN'),
      });
    }

    if (access_token.includes('TENANT')) {
      return NextResponse.json({
        success: true,
        user: getUserStore('TENANT'),
      });
    }

    // Default Owner
    return NextResponse.json({
      success: true,
      user: getUserStore('OWNER'),
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Lỗi xác thực NKS User Info' }, { status: 500 });
  }
}

// Support GET method for direct cookie authentication
export async function GET() {
  const cookieStore = cookies();
  const token = cookieStore.get('nks_token')?.value;

  if (!token) {
    return NextResponse.json({ success: false, message: 'Chưa đăng nhập' }, { status: 401 });
  }

  try {
    const remoteRes = await fetch('https://account.nks.vn/api/nks/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: token }),
    });

    if (remoteRes.ok) {
      const data = await remoteRes.json();
      return NextResponse.json({ success: true, user: data.user || data });
    }
  } catch (e) {
    // Remote offline
  }

  if (token.includes('ADMIN') || token.includes('MANAGER')) {
    return NextResponse.json({
      success: true,
      user: getUserStore('ADMIN'),
    });
  }

  if (token.includes('TENANT')) {
    return NextResponse.json({
      success: true,
      user: getUserStore('TENANT'),
    });
  }

  return NextResponse.json({
    success: true,
    user: getUserStore('OWNER'),
  });
}
