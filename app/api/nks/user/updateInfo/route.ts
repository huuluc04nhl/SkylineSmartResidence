import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { updateUserStore } from '@/lib/userStore';

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
    const body = await req.json();
    const { 
      firstname, 
      lastname, 
      fullname,
      intro,
      phone, 
      email,
      gender,
      website,
      dob, 
      pob, 
      id_number, 
      id_date, 
      id_place, 
      province, 
      license_plate,
      access_token 
    } = body;

    const cookieStore = cookies();
    const token = access_token || cookieStore.get('nks_token')?.value || '';

    // 1. Forward directly to live official NKS API (https://account.nks.vn/api/nks/user/updateInfo)
    try {
      if (token) {
        const formData = new URLSearchParams();
        formData.append('access_token', token);
        if (firstname) formData.append('firstname', firstname);
        if (lastname) formData.append('lastname', lastname);
        if (intro) formData.append('intro', intro);
        if (phone) formData.append('phone', phone);
        if (gender !== undefined) formData.append('gender', String(gender));
        if (website) formData.append('website', website);
        if (dob) formData.append('dob', formatToDateInput(dob));
        formData.append('pob', pob || '');
        if (id_number) formData.append('id_number', id_number);
        if (id_date) formData.append('id_date', formatToDateInput(id_date));
        if (id_place) formData.append('id_place', id_place);
        if (province) formData.append('province', province);

        const remoteRes = await fetch('https://account.nks.vn/api/nks/user/updateInfo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData.toString(),
        });

        if (remoteRes.ok) {
          const data = await remoteRes.json();
          if (data.success && data.data) {
            const apiUser = data.data;
            const updated = updateUserStore(body.username || email || phone || token, {
              firstname: apiUser.firstname || firstname,
              lastname: apiUser.lastname || lastname,
              fullname: apiUser.name || fullname,
              full_name: apiUser.name || fullname,
              phone: apiUser.phone || phone,
              email: apiUser.email || email,
              dob: formatToDateInput(apiUser.dob || dob),
              pob: apiUser.pob !== undefined ? apiUser.pob : (pob || ''),
              id_number: apiUser.id_number || id_number,
              id_card_no: apiUser.id_number || id_number,
              id_date: apiUser.id_date || id_date,
              id_place: apiUser.id_place || id_place,
              province: apiUser.province || province,
              intro: apiUser.intro || intro,
              license_plate: license_plate,
            });
            return NextResponse.json({ success: true, message: 'Đã cập nhật trực tiếp lên NKS API thành công', user: updated });
          }
        }
      }
    } catch (e) {
      console.warn('Remote NKS updateInfo error:', e);
    }

    // Determine clean names
    let computedLastname = lastname || '';
    let computedFirstname = firstname || '';
    if (fullname && (!firstname || !lastname)) {
      const parts = fullname.trim().split(' ');
      computedFirstname = parts.slice(-1)[0] || '';
      computedLastname = parts.slice(0, -1).join(' ') || '';
    }

    const resolvedFullname = fullname || `${computedLastname} ${computedFirstname}`.trim();

    const userIdentifier = body.username || email || phone || (token.includes('ADMIN') ? 'ADMIN' : token.includes('TECHNICIAN') ? 'TECHNICIAN' : token.includes('TENANT') ? 'TENANT' : 'OWNER');

    const updatedUser = updateUserStore(userIdentifier, {
      firstname: computedFirstname,
      lastname: computedLastname,
      fullname: resolvedFullname,
      full_name: resolvedFullname,
      intro: intro,
      phone: phone,
      email: email,
      gender: gender !== undefined ? Number(gender) as 0 | 1 : 1,
      website: website,
      dob: formatToDateInput(dob),
      pob: pob || '',
      id_number: id_number,
      id_card_no: id_number,
      id_date: formatToDateInput(id_date),
      id_place: id_place,
      province: province,
      license_plate: license_plate,
    });

    return NextResponse.json({
      success: true,
      message: 'Cập nhật thông tin thành viên NKS thành công',
      user: updatedUser,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Lỗi cập nhật NKS User Info từ máy chủ.' },
      { status: 500 }
    );
  }
}
