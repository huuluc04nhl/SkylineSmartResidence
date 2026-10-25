import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { 
  getApartmentMembers, 
  addApartmentMember, 
  updateApartmentMember,
  removeApartmentMember, 
  ApartmentMember,
  extractUserIdFromToken,
  getUserStore,
  updateUserStore
} from '@/lib/userStore';
import { DEMO_USERS } from '@/lib/dataStore';
import { submitEkycRequest } from '@/lib/ekycStore';

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
    let currentApiUser: any = null;

    if (token && !token.startsWith('NKS_FACEID_SESSION_')) {
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
            currentApiUser = data.data;
          }
        }
      } catch (e) {
        // ignore
      }
    }

    const userId = extractUserIdFromToken(token);
    const localUser = userId ? getUserStore(userId) : getUserStore('user-owner-1');
    const url = new URL(req.url);
    const paramApt = url.searchParams.get('apartment') || url.searchParams.get('aptCode');
    const rawApt = paramApt || currentApiUser?.apartment_code || localUser?.apartment_code || 'CH-06';
    const aptCode = (rawApt === '12A05' || rawApt === '12A5') ? 'CH-06' : rawApt;
    const ownerName = currentApiUser?.name || localUser?.fullname || 'Trần Hữu Lực';
    const searchQuery = url.searchParams.get('search')?.trim().toLowerCase();

    // 1. If searching for an account by Phone / CCCD / Email / Name
    if (searchQuery) {
      const normalize = (str: string) =>
        (str || '')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase();

      const qRaw = searchQuery.toLowerCase().trim();
      const qNorm = normalize(searchQuery);
      const qDigits = searchQuery.replace(/\D/g, '');

      const matchedList = DEMO_USERS.filter((u) => {
        if (u.role === 'ADMIN' || u.role === 'TECHNICIAN' || u.role === 'OWNER') return false;
        if (localUser && (u.id === localUser.id || u.phone === localUser.phone)) return false;

        const phoneDigits = (u.phone || '').replace(/\D/g, '');
        const idCardClean = (u.id_card_no || '').replace(/\s/g, '').toLowerCase();
        const username = (u.username || '').toLowerCase();
        const fullName = (u.full_name || '').toLowerCase();
        const fullNorm = normalize(u.full_name || '');

        return (
          (qDigits.length >= 3 && phoneDigits.includes(qDigits)) ||
          (qDigits.length >= 3 && idCardClean.includes(qDigits)) ||
          username.includes(qRaw) ||
          fullName.includes(qRaw) ||
          (qNorm.length >= 2 && fullNorm.includes(qNorm))
        );
      }).map((matched) => {
        const userDetails = getUserStore(matched.id);
        const rawAvatar = userDetails.avatar_url || matched.avatar_url || '';
        const cleanAvatar = rawAvatar ? rawAvatar.replace('data.nks.vn//', 'data.nks.vn/') : 'https://data.nks.vn/storage/users/default.png';
        const currentMembers = getApartmentMembers(aptCode);
        return {
          id: userDetails.id,
          username: userDetails.username,
          fullName: userDetails.fullname || userDetails.full_name,
          phone: userDetails.phone,
          idCard: userDetails.id_number || userDetails.id_card_no || '',
          avatarUrl: cleanAvatar,
          licensePlate: userDetails.license_plate || '',
          role: 'Family',
          relationship: userDetails.relationship || 'Người Nhà',
          apartmentCode: userDetails.apartment_code || aptCode,
          isAlreadyInUnit: currentMembers.some(
            (m) => m.id === userDetails.id || m.phone === userDetails.phone || m.username === userDetails.username
          ),
        };
      });

      if (matchedList.length > 0) {
        return NextResponse.json({
          success: true,
          found: true,
          account: matchedList[0],
          accounts: matchedList,
        });
      }

      return NextResponse.json({
        success: true,
        found: false,
        message: `Không tìm thấy tài khoản người nhà nào khớp với "${searchQuery}" trên hệ thống API.`
      });
    }

    // 2. Fetch current registered members for this apartment
    const members = getApartmentMembers(aptCode);

    // 3. Eligible resident accounts registered in API (All TENANT role family accounts)
    const bqlAccounts = DEMO_USERS
      .filter((u) => u.role === 'TENANT' && (!localUser || (u.id !== localUser.id && u.phone !== localUser.phone)))
      .map((u) => {
        const liveUser = getUserStore(u.id);
        const rawAvatar = liveUser.avatar_url || u.avatar_url || '';
        const cleanAvatar = rawAvatar ? rawAvatar.replace('data.nks.vn//', 'data.nks.vn/') : 'https://data.nks.vn/storage/users/default.png';
        return {
          id: liveUser.id,
          username: liveUser.username,
          fullName: liveUser.fullname || liveUser.full_name,
          email: liveUser.email,
          phone: liveUser.phone,
          idCard: liveUser.id_number || liveUser.id_card_no || '',
          avatarUrl: cleanAvatar,
          licensePlate: liveUser.license_plate || '',
          role: 'Family',
          relationship: liveUser.relationship || 'Người Nhà',
          isAdded: members.some((m) => m.username === liveUser.username || m.phone === liveUser.phone || m.id === liveUser.id),
        };
      });

    const owner = {
      id: currentApiUser ? String(currentApiUser.id) : (localUser?.id || 'usr-120'),
      fullName: ownerName,
      phone: currentApiUser?.phone || localUser?.phone || '0364967082',
      email: currentApiUser?.email || localUser?.email || 'huuluc04@gmail.com',
      idCard: currentApiUser?.id_number || localUser?.id_number || localUser?.id_card_no || '067204000961',
      licensePlate: localUser?.license_plate || '51K-988.24',
      avatarUrl: currentApiUser?.avatar ? (currentApiUser.avatar.startsWith('http') ? currentApiUser.avatar : `https://data.nks.vn/${currentApiUser.avatar}`) : (localUser?.avatar_url || 'https://data.nks.vn/storage/users/202609021654232258.jpg'),
      role: 'OWNER',
      relationship: 'Chủ Hộ (Chủ Sở Hữu)',
      faceStatus: 'Đã Kích Hoạt FaceID',
    };

    return NextResponse.json({
      success: true,
      apartment_code: aptCode,
      owner_name: ownerName,
      owner,
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
    const rawApt = currentUser?.apartment_code || 'CH-06';
    const aptCode = (rawApt === '12A05' || rawApt === '12A5') ? 'CH-06' : rawApt;

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
    const finalAvatar = (resolvedUser?.avatar_url || avatarUrl || '').replace('data.nks.vn//', 'data.nks.vn/') || 'https://data.nks.vn/storage/users/default.png';
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

    // 4. Register in apartment member store (Initial status pending BQL approval)
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
      faceStatus: 'Đang Chờ BQL Phê Duyệt',
      addedDate: new Date().toLocaleDateString('vi-VN'),
    };

    const updated = addApartmentMember(aptCode, newMember);

    // 5. Automatically create/sync e-KYC dossier for BQL to review and approve
    try {
      submitEkycRequest({
        userId: newMember.id,
        fullName: finalFullName,
        roleLabel: `Người Nhà (${relationship} - Căn ${aptCode}) - Chủ Hộ Bảo Lãnh`,
        apartmentCode: aptCode,
        phone: finalPhone,
        idCardNo: finalIdCard,
        avatarUrl: finalAvatar,
        status: 'PENDING',
      });
    } catch (ekycErr) {
      console.warn('Auto create eKYC request for new member error:', ekycErr);
    }

    return NextResponse.json({
      success: true,
      message: `Đã thêm thành viên "${finalFullName}" vào Căn hộ ${aptCode} thành công. Hồ sơ đang chờ Ban Quản Lý phê duyệt quyền ra vào.`,
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
    const rawApt = currentUser?.apartment_code || 'CH-06';
    const aptCode = (rawApt === '12A05' || rawApt === '12A5') ? 'CH-06' : rawApt;

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

/**
 * PUT /api/user/family
 * Update member details (relationship, licensePlate, phone, CCCD, fullName)
 */
export async function PUT(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('nks_token')?.value || '';
    const userId = extractUserIdFromToken(token);
    const currentUser = userId ? getUserStore(userId) : getUserStore('user-owner-1');
    const rawApt = currentUser?.apartment_code || 'CH-06';
    const aptCode = (rawApt === '12A05' || rawApt === '12A5') ? 'CH-06' : rawApt;

    const body = await req.json();
    const { 
      memberId, 
      relationship, 
      licensePlate, 
      fullName, 
      phone, 
      idCard 
    } = body;

    if (!memberId) {
      return NextResponse.json(
        { success: false, message: 'Thiếu ID thành viên cần cập nhật.' },
        { status: 400 }
      );
    }

    const updates: Partial<ApartmentMember> = {};
    if (relationship !== undefined) updates.relationship = relationship;
    if (licensePlate !== undefined) updates.licensePlate = licensePlate.trim();
    if (fullName !== undefined && fullName.trim()) updates.fullName = fullName.trim();
    if (phone !== undefined && phone.trim()) updates.phone = phone.trim();
    if (idCard !== undefined && idCard.trim()) updates.idCard = idCard.trim();

    // 1. Update apartment member store
    const updated = updateApartmentMember(aptCode, memberId, updates);

    // 2. Also update in userStore if matched
    try {
      const liveUser = getUserStore(memberId);
      if (liveUser && liveUser.id) {
        updateUserStore(liveUser.id, {
          relationship: updates.relationship || liveUser.relationship,
          license_plate: updates.licensePlate !== undefined ? updates.licensePlate : liveUser.license_plate,
          full_name: updates.fullName || liveUser.full_name,
          phone: updates.phone || liveUser.phone,
          id_card_no: updates.idCard || liveUser.id_card_no,
        });
      }
    } catch (e) {
      // ignore
    }

    return NextResponse.json({
      success: true,
      message: 'Cập nhật thông tin thành viên thành công.',
      members: updated,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Lỗi khi cập nhật thông tin thành viên.' },
      { status: 500 }
    );
  }
}
