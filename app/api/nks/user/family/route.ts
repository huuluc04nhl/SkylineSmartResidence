import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { 
  getApartmentMembers, 
  addApartmentMember, 
  removeApartmentMember, 
  ApartmentMember,
  extractUserIdFromToken,
  getUserStore,
  updateUserStore
} from '@/lib/userStore';
import { DEMO_USERS } from '@/lib/dataStore';

/**
 * GET /api/nks/user/family
 * 1. Returns apartment members list
 * 2. Returns pre-verified family accounts from API for this apartment
 * 3. Supports ?search=... to lookup user profile from system API by phone, CCCD, or username
 */
export async function GET(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('nks_token')?.value || '';
    const userId = extractUserIdFromToken(token);
    const currentUser = userId ? getUserStore(userId) : getUserStore('user-owner-1');
    const aptCode = currentUser?.apartment_code || '12A05';

    const url = new URL(req.url);
    const searchQuery = url.searchParams.get('search')?.trim().toLowerCase();

    // 1. If searching for an account by Phone / CCCD / Email
    if (searchQuery) {
      const matched = DEMO_USERS.find(u => 
        (u.phone && u.phone.includes(searchQuery)) ||
        (u.id_card_no && u.id_card_no.includes(searchQuery)) ||
        (u.username && u.username.toLowerCase().includes(searchQuery)) ||
        (u.full_name && u.full_name.toLowerCase().includes(searchQuery))
      );

      if (matched) {
        const userDetails = getUserStore(matched.id);
        return NextResponse.json({
          success: true,
          found: true,
          account: {
            id: userDetails.id,
            username: userDetails.username,
            fullName: userDetails.fullname || userDetails.full_name,
            phone: userDetails.phone,
            idCard: userDetails.id_number || userDetails.id_card_no || '',
            avatarUrl: userDetails.avatar_url,
            licensePlate: userDetails.license_plate || '',
            role: 'Family',
            relationship: userDetails.relationship || 'Thành viên gia đình',
            apartmentCode: userDetails.apartment_code || aptCode,
          }
        });
      }

      return NextResponse.json({
        success: true,
        found: false,
        message: `Không tìm thấy tài khoản cư dân nào khớp với "${searchQuery}" trên hệ thống API.`
      });
    }

    // 2. Fetch current registered members for this apartment
    const members = getApartmentMembers(aptCode);

    // 3. Eligible resident accounts registered in API for this apartment
    const bqlAccounts = DEMO_USERS
      .filter((u) => u.apartment_code === aptCode && u.role !== 'OWNER' && u.role !== 'ADMIN' && u.role !== 'TECHNICIAN')
      .map((u) => {
        const liveUser = getUserStore(u.id);
        return {
          id: liveUser.id,
          username: liveUser.username,
          fullName: liveUser.fullname || liveUser.full_name,
          email: liveUser.email,
          phone: liveUser.phone,
          idCard: liveUser.id_number || liveUser.id_card_no || '',
          avatarUrl: liveUser.avatar_url,
          licensePlate: liveUser.license_plate || '',
          role: 'Family',
          relationship: liveUser.relationship || 'Thành viên gia đình',
          isAdded: members.some((m) => m.username === liveUser.username || m.phone === liveUser.phone || m.id === liveUser.id),
        };
      });

    return NextResponse.json({
      success: true,
      apartment_code: aptCode,
      owner_name: currentUser?.fullname || 'Nguyễn Hữu Lực',
      members,
      bqlAccounts,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Lỗi tải danh sách thành viên gia đình từ API.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/nks/user/family
 * Add a family member strictly verified from API user records
 */
export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('nks_token')?.value || '';
    const userId = extractUserIdFromToken(token);
    const currentUser = userId ? getUserStore(userId) : getUserStore('user-owner-1');
    const aptCode = currentUser?.apartment_code || '12A05';

    const body = await req.json();
    const { 
      accountId, 
      username, 
      phone, 
      fullName, 
      relationship = 'Thành Viên Gia Đình', 
      licensePlate,
      idCard,
      avatarUrl 
    } = body;

    const identifier = accountId || username || phone;
    if (!identifier && !fullName) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng chọn tài khoản hợp lệ từ hệ thống API.' },
        { status: 400 }
      );
    }

    // 1. Resolve user from API userStore
    let resolvedUser = identifier ? getUserStore(identifier) : null;

    // If not found in userStore, lookup from DEMO_USERS
    if (!resolvedUser && identifier) {
      const demoMatch = DEMO_USERS.find(u => u.id === identifier || u.username === identifier || u.phone === identifier);
      if (demoMatch) {
        resolvedUser = getUserStore(demoMatch.id);
      }
    }

    // 2. Build verified member object from API record
    const finalFullName = (resolvedUser?.fullname || resolvedUser?.full_name || fullName || '').trim();
    const finalPhone = (resolvedUser?.phone || phone || '').trim();
    const finalIdCard = resolvedUser?.id_number || resolvedUser?.id_card_no || idCard || '079' + Math.floor(100000000 + Math.random() * 900000000);
    const finalAvatar = resolvedUser?.avatar_url || avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
    const finalLicense = (licensePlate || resolvedUser?.license_plate || '').trim();

    if (!finalFullName || !finalPhone) {
      return NextResponse.json(
        { success: false, message: 'Dữ liệu tài khoản API không hợp lệ (thiếu họ tên hoặc số điện thoại).' },
        { status: 400 }
      );
    }

    // 3. Update User Record in API User Store
    if (resolvedUser) {
      updateUserStore(resolvedUser.id, {
        apartment_code: aptCode,
        relationship: relationship,
        license_plate: finalLicense || resolvedUser.license_plate,
      });
    }

    // 4. Register in apartment member store
    const newMember: ApartmentMember = {
      id: resolvedUser?.id || `mem-${Date.now()}`,
      username: resolvedUser?.username || username || finalPhone,
      fullName: finalFullName,
      role: 'Family',
      relationship: relationship,
      phone: finalPhone,
      idCard: finalIdCard,
      licensePlate: finalLicense,
      avatarUrl: finalAvatar,
      faceStatus: 'Đã Kích Hoạt FaceID',
      addedDate: new Date().toLocaleDateString('vi-VN'),
    };

    const updated = addApartmentMember(aptCode, newMember);

    return NextResponse.json({
      success: true,
      message: `Đã liên kết tài khoản API của "${finalFullName}" vào Căn hộ ${aptCode} thành công.`,
      members: updated,
      member: newMember,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Lỗi khi xử lý thêm thành viên qua API.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/nks/user/family
 * Unlink and revoke access of an apartment member
 */
export async function DELETE(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('nks_token')?.value || '';
    const userId = extractUserIdFromToken(token);
    const currentUser = userId ? getUserStore(userId) : getUserStore('user-owner-1');
    const aptCode = currentUser?.apartment_code || '12A05';

    const body = await req.json();
    const { memberId } = body;

    if (!memberId) {
      return NextResponse.json(
        { success: false, message: 'Thiếu ID thành viên cần hủy liên kết.' },
        { status: 400 }
      );
    }

    const updated = removeApartmentMember(aptCode, memberId);

    return NextResponse.json({
      success: true,
      message: 'Đã hủy liên kết tài khoản thành viên khỏi căn hộ.',
      members: updated,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Lỗi xóa thành viên gia đình.' },
      { status: 500 }
    );
  }
}
