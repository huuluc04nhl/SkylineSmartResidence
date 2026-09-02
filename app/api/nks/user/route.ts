import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserStore, extractUserIdFromToken } from '@/lib/userStore';

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

    // 1. Call official live NKS Server (https://account.nks.vn/api/nks/user)
    try {
      const formData = new URLSearchParams();
      formData.append('access_token', access_token);

      const remoteRes = await fetch('https://account.nks.vn/api/nks/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });

      if (remoteRes.ok) {
        const data = await remoteRes.json();
        if (data.success && data.data) {
          const apiUser = data.data;
          const role = (apiUser.email && (apiUser.email.includes('manager01') || apiUser.email.includes('admin')))
            ? 'ADMIN'
            : (apiUser.email && apiUser.email.includes('manager02'))
            ? 'TECHNICIAN'
            : (apiUser.email && (apiUser.email.includes('nhut') || apiUser.email.includes('cuong') || apiUser.email.includes('hai') || apiUser.email.includes('thinh')))
            ? 'TENANT'
            : 'OWNER';

          const formatted = {
            id: String(apiUser.id || 'usr-120'),
            username: apiUser.email || 'huuluc04@gmail.com',
            firstname: apiUser.firstname || '',
            lastname: apiUser.lastname || '',
            fullname: apiUser.name || `${apiUser.lastname || ''} ${apiUser.firstname || ''}`.trim() || 'Trần Hữu Lực',
            full_name: apiUser.name || `${apiUser.lastname || ''} ${apiUser.firstname || ''}`.trim() || 'Trần Hữu Lực',
            email: apiUser.email || 'huuluc04@gmail.com',
            phone: apiUser.phone || '',
            role: role,
            apartment_code: '12A05',
            avatar_url: apiUser.avatar ? (apiUser.avatar.startsWith('http') ? apiUser.avatar : `https://data.nks.vn/${apiUser.avatar}`) : undefined,
            avatar: apiUser.avatar ? (apiUser.avatar.startsWith('http') ? apiUser.avatar : `https://data.nks.vn/${apiUser.avatar}`) : undefined,
            id_number: apiUser.id_number || '',
            id_card_no: apiUser.id_number || '',
            id_card_number: apiUser.id_number || '',
            id_date: formatToDateInput(apiUser.id_date || apiUser.formatedCccdDate || ''),
            id_place: apiUser.id_place || '',
            province: apiUser.province || '',
            gender: apiUser.gender ?? 1,
            dob: formatToDateInput(apiUser.dob || apiUser.formatedDob || ''),
            pob: apiUser.pob || '',
            intro: apiUser.intro || '',
          };
          return NextResponse.json({ success: true, user: formatted });
        }
      }
    } catch (e) {
      console.warn('Remote NKS user fetch error:', e);
    }

    // 2. Server-side Session Token Resolver (Direct Per-User Identification)
    const targetUserId = extractUserIdFromToken(access_token);
    if (targetUserId) {
      return NextResponse.json({
        success: true,
        user: getUserStore(targetUserId),
      });
    }

    if (access_token.includes('ADMIN') || access_token.includes('MANAGER')) {
      return NextResponse.json({
        success: true,
        user: getUserStore('user-manager-1'),
      });
    }

    if (access_token.includes('TECHNICIAN')) {
      return NextResponse.json({
        success: true,
        user: getUserStore('user-tech-1'),
      });
    }

    if (access_token.includes('TENANT')) {
      return NextResponse.json({
        success: true,
        user: getUserStore('user-tenant-1'),
      });
    }

    // Default Owner
    return NextResponse.json({
      success: true,
      user: getUserStore('user-owner-1'),
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
    const formData = new URLSearchParams();
    formData.append('access_token', token);

    const remoteRes = await fetch('https://account.nks.vn/api/nks/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    });

    if (remoteRes.ok) {
      const data = await remoteRes.json();
      if (data.success && data.data) {
        const apiUser = data.data;
        const role = (apiUser.email && (apiUser.email.includes('manager01') || apiUser.email.includes('admin')))
          ? 'ADMIN'
          : (apiUser.email && apiUser.email.includes('manager02'))
          ? 'TECHNICIAN'
          : (apiUser.email && (apiUser.email.includes('nhut') || apiUser.email.includes('cuong') || apiUser.email.includes('hai') || apiUser.email.includes('thinh')))
          ? 'TENANT'
          : 'OWNER';

        const formatted = {
          id: String(apiUser.id || 'usr-120'),
          username: apiUser.email || 'huuluc04@gmail.com',
          firstname: apiUser.firstname || '',
          lastname: apiUser.lastname || '',
          fullname: apiUser.name || `${apiUser.lastname || ''} ${apiUser.firstname || ''}`.trim() || 'Trần Hữu Lực',
          full_name: apiUser.name || `${apiUser.lastname || ''} ${apiUser.firstname || ''}`.trim() || 'Trần Hữu Lực',
          email: apiUser.email || 'huuluc04@gmail.com',
          phone: apiUser.phone || '',
          role: role,
          apartment_code: '12A05',
          avatar_url: apiUser.avatar ? (apiUser.avatar.startsWith('http') ? apiUser.avatar : `https://data.nks.vn/${apiUser.avatar}`) : undefined,
          avatar: apiUser.avatar ? (apiUser.avatar.startsWith('http') ? apiUser.avatar : `https://data.nks.vn/${apiUser.avatar}`) : undefined,
          id_number: apiUser.id_number || '',
          id_card_no: apiUser.id_number || '',
          id_card_number: apiUser.id_number || '',
          id_date: formatToDateInput(apiUser.id_date || apiUser.formatedCccdDate || ''),
          id_place: apiUser.id_place || '',
          province: apiUser.province || '',
          gender: apiUser.gender ?? 1,
          dob: formatToDateInput(apiUser.dob || apiUser.formatedDob || ''),
          pob: apiUser.pob || '',
          intro: apiUser.intro || '',
        };
        return NextResponse.json({ success: true, user: formatted });
      }
    }
  } catch (e) {
    // Remote offline
  }

  const targetUserId = extractUserIdFromToken(token);
  if (targetUserId) {
    return NextResponse.json({
      success: true,
      user: getUserStore(targetUserId),
    });
  }

  if (token.includes('ADMIN') || token.includes('MANAGER')) {
    return NextResponse.json({
      success: true,
      user: getUserStore('user-manager-1'),
    });
  }

  if (token.includes('TECHNICIAN')) {
    return NextResponse.json({
      success: true,
      user: getUserStore('user-tech-1'),
    });
  }

  if (token.includes('TENANT')) {
    return NextResponse.json({
      success: true,
      user: getUserStore('user-tenant-1'),
    });
  }

  return NextResponse.json({
    success: true,
    user: getUserStore('user-owner-1'),
  });
}
