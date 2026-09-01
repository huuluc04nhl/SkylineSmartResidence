import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { updateUserStore } from '@/lib/userStore';

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

    // 1. Forward to remote official NKS API if live
    try {
      const remoteRes = await fetch('https://account.nks.vn/api/nks/user/updateInfo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (remoteRes.ok) {
        const data = await remoteRes.json();
        return NextResponse.json(data);
      }
    } catch (e) {
      // Remote unavailable
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

    const cookieStore = cookies();
    const token = access_token || cookieStore.get('nks_token')?.value || '';
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
      dob: dob,
      pob: pob,
      id_number: id_number,
      id_card_no: id_number,
      id_date: id_date,
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
