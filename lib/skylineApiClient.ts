// ============================================================================
// SKYLINE USER API CLIENT - SKYLINE SMART RESIDENCE (100% PURE API DRIVEN)
// Standardized API client for Skyline Smart Residence operations
// ============================================================================

export interface SkylineUserInfo {
  id: string;
  username: string;
  firstname: string;
  lastname: string;
  fullname: string;
  full_name?: string;
  email: string;
  phone: string;
  avatar_url?: string;
  avatar?: string;
  gender?: 0 | 1;
  dob?: string;
  pob?: string;
  id_number?: string;
  id_card_no?: string;
  id_date?: string;
  id_place?: string;
  province?: string;
  intro?: string;
  website?: string;
  license_plate?: string;
  role: 'ADMIN' | 'OWNER' | 'TENANT' | 'TECHNICIAN';
  apartment_code?: string;
  access_token?: string;
}

export type NksUserInfo = SkylineUserInfo;

export interface SkylineLoginResponse {
  success: boolean;
  message?: string;
  access_token?: string;
  user?: SkylineUserInfo;
}

export type NksLoginResponse = SkylineLoginResponse;

/**
 * 1. Login API (POST /api/user/login)
 */
export async function skylineLogin(
  username: string, 
  password?: string
): Promise<SkylineLoginResponse> {
  const payload = {
    username: username.trim(),
    password: password || '12345678',
    fbtoken: 'SKYLINE_FCM_TOKEN_' + Date.now(),
    system: 'SKYLINE',
    device: 'Web Browser (Skyline Smart Residence)',
    ip_address: '127.0.0.1',
    location: 'TP. Ho Chi Minh, Vietnam',
  };

  const res = await fetch('/api/user/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error('Skyline Login API returned status ' + res.status);
  }

  return await res.json();
}
export const nksLogin = skylineLogin;

/**
 * 2. Get User Info API (POST /api/user or GET)
 */
export async function skylineGetUserInfo(accessToken?: string): Promise<SkylineUserInfo | null> {
  try {
    const res = await fetch('/api/user', {
      method: accessToken ? 'POST' : 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: accessToken ? JSON.stringify({ access_token: accessToken }) : undefined,
    });

    if (res.ok) {
      const data = await res.json();
      return data.user || data;
    }
  } catch (err) {
    console.warn('Skyline GetUserInfo error', err);
  }

  return null;
}
export const nksGetUserInfo = skylineGetUserInfo;

/**
 * 3. Update User Info API (POST /api/user/updateInfo)
 */
export async function skylineUpdateInfo(info: Partial<SkylineUserInfo>): Promise<{ success: boolean; user?: SkylineUserInfo }> {
  const res = await fetch('/api/user/updateInfo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(info),
  });

  if (!res.ok) {
    throw new Error('Skyline UpdateInfo API failed');
  }

  return await res.json();
}
export const nksUpdateInfo = skylineUpdateInfo;

/**
 * 4. Update Password API (POST /api/user/updatePass)
 */
export async function skylineUpdatePassword(
  oldPass: string, 
  newPass: string,
  options?: {
    confirmPass?: string;
    targetUserId?: string;
    targetUsername?: string;
  }
): Promise<{ success: boolean; message: string }> {
  const res = await fetch('/api/user/updatePass', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      old_password: oldPass, 
      password: newPass,
      confirm_password: options?.confirmPass || newPass,
      target_user_id: options?.targetUserId,
      target_username: options?.targetUsername,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Cập nhật mật khẩu không thành công');
  }

  return data;
}
export const nksUpdatePassword = skylineUpdatePassword;

/**
 * 5. Update Avatar API (POST /api/user/updateAvatar)
 */
export async function skylineUpdateAvatar(avatarBase64: string): Promise<{ success: boolean; avatar_url?: string }> {
  const res = await fetch('/api/user/updateAvatar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ avatar: avatarBase64 }),
  });

  if (!res.ok) {
    throw new Error('Skyline UpdateAvatar API failed');
  }

  return await res.json();
}
export const nksUpdateAvatar = skylineUpdateAvatar;

/**
 * 6. Update CCCD e-KYC API (POST /api/user/updateCccd)
 */
export async function skylineUpdateCccd(payload: {
  front?: string;
  back?: string;
  number: string;
  date?: string;
  place?: string;
}): Promise<{ success: boolean; message: string }> {
  const res = await fetch('/api/user/updateCccd', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error('Skyline UpdateCccd API failed');
  }

  return await res.json();
}
export const nksUpdateCccd = skylineUpdateCccd;

/**
 * 7. Get Family Members API (GET /api/user/family)
 */
export async function skylineGetFamilyMembers(aptCode?: string): Promise<{ success: boolean; members: any[]; bqlAccounts?: any[] }> {
  const url = aptCode ? `/api/user/family?aptCode=${encodeURIComponent(aptCode)}` : '/api/user/family';
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    throw new Error('Skyline GetFamily API failed');
  }

  return await res.json();
}
export const nksGetFamilyMembers = skylineGetFamilyMembers;

/**
 * 8. Search Resident Account from API (GET /api/user/family?search=...)
 */
export async function skylineSearchFamilyAccount(query: string): Promise<{ success: boolean; found: boolean; account?: any; message?: string }> {
  const res = await fetch(`/api/user/family?search=${encodeURIComponent(query)}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    throw new Error('Skyline SearchFamilyAccount API failed');
  }

  return await res.json();
}
export const nksSearchFamilyAccount = skylineSearchFamilyAccount;

/**
 * 9. Add Family Member API (POST /api/user/family)
 */
export async function skylineAddFamilyMember(payload: {
  accountId?: string;
  fullName: string;
  phone: string;
  role?: string;
  relationship?: string;
  idCard?: string;
  licensePlate?: string;
  avatarUrl?: string;
  username?: string;
}): Promise<{ success: boolean; message: string; members: any[] }> {
  const res = await fetch('/api/user/family', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error('Skyline AddFamily API failed');
  }

  return await res.json();
}
export const nksAddFamilyMember = skylineAddFamilyMember;

/**
 * 10. Remove Family Member API (DELETE /api/user/family)
 */
export async function skylineRemoveFamilyMember(memberId: string): Promise<{ success: boolean; message: string; members: any[] }> {
  const res = await fetch('/api/user/family', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ memberId }),
  });

  if (!res.ok) {
    throw new Error('Skyline RemoveFamily API failed');
  }

  return await res.json();
}
export const nksRemoveFamilyMember = skylineRemoveFamilyMember;

/**
 * 10b. Update Family Member API (PUT /api/user/family)
 */
export async function skylineUpdateFamilyMember(payload: {
  memberId: string;
  relationship?: string;
  licensePlate?: string;
  fullName?: string;
  phone?: string;
  idCard?: string;
}): Promise<{ success: boolean; message: string; members: any[] }> {
  const res = await fetch('/api/user/family', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error('Skyline UpdateFamily API failed');
  }

  return await res.json();
}
export const nksUpdateFamilyMember = skylineUpdateFamilyMember;

/**
 * 11. FaceID Biometric Login API (POST /api/user/face-login)
 */
export async function skylineFaceLogin(payload: {
  faceImage?: string;
  faceVector?: string;
  targetUserId?: string;
  account?: string;
  isTestMode?: boolean;
  isCameraCapture?: boolean;
  uploadedFileName?: string;
  deviceType?: string;
  clientProfiles?: any[];
}): Promise<{
  success: boolean;
  user?: any;
  matchScore?: number;
  bestAngle?: string;
  sampleScores?: {
    front: number;
    left: number;
    right: number;
    smile: number;
  };
  message?: string;
}> {
  let clientProfiles = payload.clientProfiles;
  if (!clientProfiles && typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('skyline_enrolled_faces_v1');
      if (raw) clientProfiles = JSON.parse(raw);
    } catch (e) {
      console.warn('Lỗi đọc client profiles:', e);
    }
  }

  const res = await fetch('/api/user/face-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...payload,
      clientProfiles,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `FaceID Login thất bại (Mã lỗi: ${res.status})`);
  }

  return data;
}
export const nksFaceLogin = skylineFaceLogin;

/**
 * 12. FaceID Biometric 4-Step Enrollment API (POST /api/user/face-enroll)
 */
export async function skylineEnrollFaceId(payload: {
  userId: string;
  fullName?: string;
  apartmentCode?: string;
  phone?: string;
  email?: string;
  isFamilyMemberSelfEnroll?: boolean;
  submittedByRole?: string;
  samples: {
    front: string;
    left: string;
    right: string;
    smile: string;
  };
}): Promise<{ success: boolean; message: string; profile?: any; status?: string }> {
  const res = await fetch('/api/user/face-enroll', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Lỗi gửi dữ liệu sinh trắc học FaceID lên máy chủ.');
  }

  return data;
}
export const nksEnrollFaceId = skylineEnrollFaceId;

/**
 * 12b. Chủ hộ xác nhận hồ sơ FaceID của người nhà và gửi BQL
 */
export async function skylineConfirmFamilyFaceIdByOwner(userId: string, apartmentCode?: string, phone?: string): Promise<{ success: boolean; message: string; profile?: any }> {
  const res = await fetch('/api/user/face-enroll', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'CONFIRM_BY_OWNER',
      userId,
      phone,
      apartmentCode,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Lỗi khi chủ hộ xác nhận FaceID.');
  }

  return data;
}
export const nksConfirmFamilyFaceIdByOwner = skylineConfirmFamilyFaceIdByOwner;

/**
 * 13. Lấy hồ sơ 4 mẫu FaceID đã đăng ký từ Server (GET /api/user/face-enroll)
 * Hỗ trợ đồng bộ xuyên thiết bị (Mobile <-> Desktop <-> Admin)
 */
export async function skylineGetEnrolledFaceProfile(userId: string): Promise<any | null> {
  if (!userId) return null;
  try {
    const res = await fetch(`/api/user/face-enroll?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) return null;
    const data = await res.json().catch(() => ({}));
    if (data.success && data.profile) {
      return data.profile;
    }
    return null;
  } catch (e) {
    console.warn('Lỗi fetch skylineGetEnrolledFaceProfile:', e);
    return null;
  }
}
export const nksGetEnrolledFaceProfile = skylineGetEnrolledFaceProfile;

/**
 * 14. Apartment Handover & Account Provisioning API (POST /api/user/handover)
 */
export async function skylineHandoverProvisionAccount(payload: {
  apartmentCode: string;
  fullName: string;
  phone: string;
  email?: string;
  idCard: string;
  dob?: string;
  pob?: string;
  avatarUrl?: string;
  handoverProtocol?: any;
}): Promise<{
  success: boolean;
  message: string;
  account?: {
    id: string;
    username: string;
    fullName: string;
    phone: string;
    email: string;
    idCard: string;
    apartmentCode: string;
    role: string;
    initialPassword: string;
    provisionedAt: string;
  };
  protocol?: any;
}> {
  const res = await fetch('/api/user/handover', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.message || `Lỗi máy chủ khi cấp tài khoản cư dân (Mã lỗi: ${res.status})`);
  }

  return data;
}
export const nksHandoverProvisionAccount = skylineHandoverProvisionAccount;
