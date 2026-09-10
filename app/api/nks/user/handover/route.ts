import { NextResponse } from 'next/server';
import { registerNewOwnerUser, getUserStore } from '@/lib/userStore';
import { assignApartmentResident, ApartmentHandoverProtocol, ApartmentResidentOwner } from '@/lib/apartmentStore';

/**
 * POST /api/nks/user/handover
 * API Cấp tài khoản Cư Dân & Bàn Giao Căn Hộ Chính Thức (BQL Handover Provisioning)
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      apartmentCode, 
      fullName, 
      phone, 
      email, 
      idCard, 
      dob, 
      pob, 
      avatarUrl, 
      handoverProtocol 
    } = body;

    // 1. Kiểm tra tính hợp lệ của dữ liệu đầu vào
    if (!apartmentCode || typeof apartmentCode !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Vui lòng cung cấp mã căn hộ cần bàn giao.' },
        { status: 400 }
      );
    }

    if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng cung cấp họ tên chủ hộ / người tiếp nhận.' },
        { status: 400 }
      );
    }

    if (!phone || typeof phone !== 'string' || !phone.trim()) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng cung cấp số điện thoại làm tài khoản đăng nhập.' },
        { status: 400 }
      );
    }

    if (!idCard || typeof idCard !== 'string' || idCard.trim().length < 9) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng cung cấp số thẻ CCCD hợp lệ (9 đến 12 số).' },
        { status: 400 }
      );
    }

    const cleanCode = apartmentCode.trim().toUpperCase();
    const cleanPhone = phone.trim();
    const cleanName = fullName.trim();
    const cleanIdCard = idCard.trim();
    const cleanEmail = email?.trim() || `${cleanPhone}@skyline.residence.vn`;
    const cleanAvatar = avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop&crop=face';

    // 2. Cấp tài khoản Cư Dân chính thức trên Server User Store & DEMO_USERS
    const provisionedUser = registerNewOwnerUser({
      name: cleanName,
      phone: cleanPhone,
      email: cleanEmail,
      cccd: cleanIdCard,
      apartmentCode: cleanCode,
      dob: dob?.trim() || '1992-06-15',
      pob: pob?.trim() || 'TP. Hồ Chí Minh',
      avatarUrl: cleanAvatar
    });

    // 3. Chuẩn hóa Biên bản bàn giao kỹ thuật (Handover Protocol)
    const todayStr = new Date().toLocaleDateString('vi-VN');
    const dateCode = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const protocolCode = handoverProtocol?.protocolCode || `BBBG-SKYLINE-${cleanCode}-${dateCode}`;

    const finalProtocol: ApartmentHandoverProtocol = {
      protocolCode,
      handoverDate: handoverProtocol?.handoverDate || todayStr,
      handoverOfficer: handoverProtocol?.handoverOfficer || 'Ban Quản Lý Skyline Smart Residence',
      keysCount: Number(handoverProtocol?.keysCount) || 3,
      cardsCount: Number(handoverProtocol?.cardsCount) || 2,
      initialElectricMeter: Number(handoverProtocol?.initialElectricMeter) || 0,
      initialWaterMeter: Number(handoverProtocol?.initialWaterMeter) || 0,
      notes: handoverProtocol?.notes || 'Đã nghiệm thu kỹ thuật bàn giao căn hộ, bàn giao chìa khóa cơ và cấp thẻ từ cư dân.'
    };

    // 4. Cập nhật hồ sơ căn hộ sang trạng thái ĐANG SINH SỐNG
    const ownerObj: ApartmentResidentOwner = {
      name: cleanName,
      phone: cleanPhone,
      email: cleanEmail,
      cccd: cleanIdCard,
      avatar: cleanAvatar,
      eKycApproved: true,
      handoverDate: finalProtocol.handoverDate,
      dob: provisionedUser.dob,
      pob: provisionedUser.pob,
      handoverProtocol: finalProtocol
    };

    assignApartmentResident(cleanCode, ownerObj, finalProtocol);

    return NextResponse.json({
      success: true,
      message: `Đã cấp tài khoản cư dân chính thức cho chủ hộ ${cleanName} và bàn giao căn hộ ${cleanCode} thành công.`,
      account: {
        id: provisionedUser.id,
        username: provisionedUser.username,
        fullName: provisionedUser.fullname || provisionedUser.full_name,
        phone: provisionedUser.phone,
        email: provisionedUser.email,
        idCard: provisionedUser.id_number || provisionedUser.id_card_no,
        apartmentCode: provisionedUser.apartment_code,
        role: 'OWNER',
        initialPassword: '•••••••• (12345678)',
        provisionedAt: new Date().toISOString()
      },
      protocol: finalProtocol
    });
  } catch (error: any) {
    console.error('Handover provision API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Lỗi máy chủ khi xử lý cấp tài khoản bàn giao: ' + (error?.message || '') 
      },
      { status: 500 }
    );
  }
}
