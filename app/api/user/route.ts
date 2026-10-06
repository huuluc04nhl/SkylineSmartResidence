import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

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

    // Xác thực trực tiếp qua NKS API (https://account.nks.vn/api/nks/user)
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
        const emailLower = (apiUser.email || '').toLowerCase();
        const role = (emailLower.includes('manager01') || emailLower.includes('admin'))
          ? 'ADMIN'
          : (emailLower.includes('manager02'))
          ? 'TECHNICIAN'
          : (emailLower.includes('nhut') || emailLower.includes('cuong') || emailLower.includes('hai') || emailLower.includes('thinh'))
          ? 'TENANT'
          : 'OWNER';

        const formatted = {
          id: String(apiUser.id || 'usr-120'),
          username: apiUser.email || '',
          firstname: apiUser.firstname || '',
          lastname: apiUser.lastname || '',
          fullname: apiUser.name || `${apiUser.lastname || ''} ${apiUser.firstname || ''}`.trim() || 'Cư Dân SKYLINE',
          full_name: apiUser.name || `${apiUser.lastname || ''} ${apiUser.firstname || ''}`.trim() || 'Cư Dân SKYLINE',
          email: apiUser.email || '',
          phone: apiUser.phone || '',
          role: role,
          apartment_code: (role === 'ADMIN' ? 'BQL_OFFICE' : role === 'TECHNICIAN' ? 'TECH_ROOM' : 'CH-06'),
          relationship: (role === 'ADMIN' || role === 'TECHNICIAN') ? 'Staff' : role === 'OWNER' ? 'Owner' : 'Family',
          avatar_url: apiUser.avatar ? (apiUser.avatar.startsWith('http') ? apiUser.avatar : `https://data.nks.vn/${apiUser.avatar}`) : undefined,
          avatar: apiUser.avatar ? (apiUser.avatar.startsWith('http') ? apiUser.avatar : `https://data.nks.vn/${apiUser.avatar}`) : undefined,
          id_number: apiUser.id_number || '',
          id_card_no: apiUser.id_number || '',
          id_card_number: apiUser.id_number || '',
          id_date: formatToDateInput(apiUser.id_date || apiUser.formatedCccdDate || ''),
          id_place: apiUser.id_place || '',
          province: apiUser.province || 'Thành phố Hồ Chí Minh',
          gender: apiUser.gender ?? 1,
          dob: formatToDateInput(apiUser.dob || apiUser.formatedDob || ''),
          pob: apiUser.pob || '',
          intro: apiUser.intro || '',
        };
        return NextResponse.json({ success: true, user: formatted });
      }
    }

    // Nếu token không hợp lệ hoặc API từ chối, trả về lỗi, không dùng mock demo
    return NextResponse.json(
      { success: false, user: null, message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Lỗi xác thực người dùng từ API' }, { status: 500 });
  }
}

// Support GET method for direct cookie authentication
export async function GET() {
  const cookieStore = cookies();
  const token = cookieStore.get('nks_token')?.value;

  if (!token) {
    return NextResponse.json({ success: false, user: null, message: 'Chưa đăng nhập' }, { status: 200 });
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
        const emailLower = (apiUser.email || '').toLowerCase();
        const role = (emailLower.includes('manager01') || emailLower.includes('admin'))
          ? 'ADMIN'
          : (emailLower.includes('manager02'))
          ? 'TECHNICIAN'
          : (emailLower.includes('nhut') || emailLower.includes('cuong') || emailLower.includes('hai') || emailLower.includes('thinh'))
          ? 'TENANT'
          : 'OWNER';

        const formatted = {
          id: String(apiUser.id || 'usr-120'),
          username: apiUser.email || '',
          firstname: apiUser.firstname || '',
          lastname: apiUser.lastname || '',
          fullname: apiUser.name || `${apiUser.lastname || ''} ${apiUser.firstname || ''}`.trim() || 'Cư Dân SKYLINE',
          full_name: apiUser.name || `${apiUser.lastname || ''} ${apiUser.firstname || ''}`.trim() || 'Cư Dân SKYLINE',
          email: apiUser.email || '',
          phone: apiUser.phone || '',
          role: role,
          apartment_code: (role === 'ADMIN' ? 'BQL_OFFICE' : role === 'TECHNICIAN' ? 'TECH_ROOM' : 'CH-06'),
          relationship: (role === 'ADMIN' || role === 'TECHNICIAN') ? 'Staff' : role === 'OWNER' ? 'Owner' : 'Family',
          avatar_url: apiUser.avatar ? (apiUser.avatar.startsWith('http') ? apiUser.avatar : `https://data.nks.vn/${apiUser.avatar}`) : undefined,
          avatar: apiUser.avatar ? (apiUser.avatar.startsWith('http') ? apiUser.avatar : `https://data.nks.vn/${apiUser.avatar}`) : undefined,
          id_number: apiUser.id_number || '',
          id_card_no: apiUser.id_number || '',
          id_card_number: apiUser.id_number || '',
          id_date: formatToDateInput(apiUser.id_date || apiUser.formatedCccdDate || ''),
          id_place: apiUser.id_place || '',
          province: apiUser.province || 'Thành phố Hồ Chí Minh',
          gender: apiUser.gender ?? 1,
          dob: formatToDateInput(apiUser.dob || apiUser.formatedDob || ''),
          pob: apiUser.pob || '',
          intro: apiUser.intro || '',
        };
        return NextResponse.json({ success: true, user: formatted });
      }
    }

    return NextResponse.json({ success: false, user: null, message: 'Phiên làm việc hết hạn' }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ success: false, user: null, message: 'Lỗi kết nối API' }, { status: 200 });
  }
}
