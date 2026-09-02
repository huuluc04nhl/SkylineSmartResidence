import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getApartmentMembers, addApartmentMember, removeApartmentMember, ApartmentMember } from '@/lib/userStore';
import { DEMO_USERS } from '@/lib/dataStore';

export async function GET(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('nks_token')?.value || '';
    
    // Default apartment for Owner/Tenant
    const aptCode = '12A05';
    const members = getApartmentMembers(aptCode);

    // Accounts registered/managed by BQL for this apartment
    const bqlAccounts = DEMO_USERS
      .filter((u) => u.apartment_code === aptCode && u.role !== 'OWNER' && u.role !== 'ADMIN' && u.role !== 'TECHNICIAN')
      .map((u) => ({
        id: u.id,
        username: u.username,
        fullName: u.full_name,
        email: u.email,
        phone: u.phone,
        idCard: u.id_card_no || u.id_number || '',
        avatarUrl: u.avatar_url,
        licensePlate: u.license_plate || '',
        role: u.relationship === 'Family' ? 'Family' : 'Tenant',
        relationship: u.relationship === 'Family' ? 'Thành viên gia đình' : 'Cư dân tạm trú',
        isAdded: members.some((m) => m.username === u.username || m.phone === u.phone),
      }));

    return NextResponse.json({
      success: true,
      apartment_code: aptCode,
      members,
      bqlAccounts,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Lỗi tải danh sách thành viên gia đình.' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fullName, phone, role, relationship, idCard, licensePlate, avatarUrl, username } = body;

    if (!fullName || !phone) {
      return NextResponse.json(
        { success: false, message: 'Họ tên và số điện thoại là bắt buộc.' },
        { status: 400 }
      );
    }

    const aptCode = '12A05';
    const newMember: ApartmentMember = {
      id: `mem-${Date.now()}`,
      username: username || phone,
      fullName: fullName.trim(),
      role: role || 'Family',
      relationship: relationship || (role === 'Tenant' ? 'Cư dân tạm trú' : 'Thành viên gia đình'),
      phone: phone.trim(),
      idCard: idCard || '079' + Math.floor(100000000 + Math.random() * 900000000),
      licensePlate: licensePlate || '',
      avatarUrl: avatarUrl || '',
      faceStatus: 'Đã Xác Thực FaceID',
      addedDate: new Date().toLocaleDateString('vi-VN'),
    };

    const updated = addApartmentMember(aptCode, newMember);

    return NextResponse.json({
      success: true,
      message: 'Thêm thành viên gia đình và cấp quyền FaceID thành công.',
      members: updated,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Lỗi thêm thành viên gia đình.' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { memberId } = body;

    if (!memberId) {
      return NextResponse.json(
        { success: false, message: 'Thiếu ID thành viên cần xóa.' },
        { status: 400 }
      );
    }

    const aptCode = '12A05';
    const updated = removeApartmentMember(aptCode, memberId);

    return NextResponse.json({
      success: true,
      message: 'Đã hủy phân quyền thành viên căn hộ.',
      members: updated,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Lỗi xóa thành viên gia đình.' },
      { status: 500 }
    );
  }
}
