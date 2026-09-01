import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getApartmentMembers, addApartmentMember, removeApartmentMember, ApartmentMember } from '@/lib/userStore';

export async function GET(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('nks_token')?.value || '';
    
    // Default apartment for Owner/Tenant
    const aptCode = '12A05';
    const members = getApartmentMembers(aptCode);

    return NextResponse.json({
      success: true,
      apartment_code: aptCode,
      members,
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
    const { fullName, phone, role, relationship, idCard, licensePlate } = body;

    if (!fullName || !phone) {
      return NextResponse.json(
        { success: false, message: 'Họ tên và số điện thoại là bắt buộc.' },
        { status: 400 }
      );
    }

    const aptCode = '12A05';
    const newMember: ApartmentMember = {
      id: `mem-${Date.now()}`,
      username: phone,
      fullName: fullName.trim(),
      role: role || 'Family',
      relationship: relationship || (role === 'Tenant' ? 'Cư dân tạm trú' : 'Thành viên gia đình'),
      phone: phone.trim(),
      idCard: idCard || '079' + Math.floor(100000000 + Math.random() * 900000000),
      licensePlate: licensePlate || '',
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
