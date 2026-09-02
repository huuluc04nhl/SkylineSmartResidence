// ============================================================================
// NKS USER API CLIENT - SKYLINE SMART RESIDENCE (100% PURE API DRIVEN)
// Specification Source: NKS API (https://docs.google.com/document/d/1MIVPh6N9-TQAk12WrRyE3CPBeTgop_04ZVJfMtwuaOc)
// ============================================================================

export interface NksUserInfo {
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

export interface NksLoginResponse {
  success: boolean;
  message?: string;
  access_token?: string;
  user?: NksUserInfo;
}

/**
 * 1. Login API (POST /api/nks/user/login)
 * Body: username, password, fbtoken, system="NKS", device, ip_address, location
 */
export async function nksLogin(
  username: string, 
  password?: string
): Promise<NksLoginResponse> {
  const payload = {
    username: username.trim(),
    password: password || '12345678',
    fbtoken: 'NKS_FCM_TOKEN_' + Date.now(),
    system: 'NKS',
    device: 'Web Browser (SKYLINE Smart Residence)',
    ip_address: '127.0.0.1',
    location: 'TP. Ho Chi Minh, Vietnam',
  };

  const res = await fetch('/api/nks/user/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error('NKS Login API returned status ' + res.status);
  }

  return await res.json();
}

/**
 * 2. Get User Info API (POST /api/nks/user or GET)
 */
export async function nksGetUserInfo(accessToken?: string): Promise<NksUserInfo | null> {
  try {
    const res = await fetch('/api/nks/user', {
      method: accessToken ? 'POST' : 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: accessToken ? JSON.stringify({ access_token: accessToken }) : undefined,
    });

    if (res.ok) {
      const data = await res.json();
      return data.user || data;
    }
  } catch (err) {
    console.warn('NKS GetUserInfo error', err);
  }

  return null;
}

/**
 * 3. Update User Info API (POST /api/nks/user/updateInfo)
 */
export async function nksUpdateInfo(info: Partial<NksUserInfo>): Promise<{ success: boolean; user?: NksUserInfo }> {
  const res = await fetch('/api/nks/user/updateInfo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(info),
  });

  if (!res.ok) {
    throw new Error('NKS UpdateInfo API failed');
  }

  return await res.json();
}

/**
 * 4. Update Password API (POST /api/nks/user/updatePass)
 */
export async function nksUpdatePassword(oldPass: string, newPass: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch('/api/nks/user/updatePass', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ old_password: oldPass, password: newPass }),
  });

  if (!res.ok) {
    throw new Error('NKS UpdatePass API failed');
  }

  return await res.json();
}

/**
 * 5. Update Avatar API (POST /api/nks/user/updateAvatar)
 */
export async function nksUpdateAvatar(avatarBase64: string): Promise<{ success: boolean; avatar_url?: string }> {
  const res = await fetch('/api/nks/user/updateAvatar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ avatar: avatarBase64 }),
  });

  if (!res.ok) {
    throw new Error('NKS UpdateAvatar API failed');
  }

  return await res.json();
}

/**
 * 6. Update CCCD e-KYC API (POST /api/nks/user/updateCccd)
 */
export async function nksUpdateCccd(payload: {
  front?: string;
  back?: string;
  number: string;
  date?: string;
  place?: string;
}): Promise<{ success: boolean; message: string }> {
  const res = await fetch('/api/nks/user/updateCccd', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error('NKS UpdateCccd API failed');
  }

  return await res.json();
}

/**
 * 7. Get Family Members API (GET /api/nks/user/family)
 */
export async function nksGetFamilyMembers(): Promise<{ success: boolean; members: any[]; bqlAccounts?: any[] }> {
  const res = await fetch('/api/nks/user/family', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    throw new Error('NKS GetFamily API failed');
  }

  return await res.json();
}

/**
 * 8. Search Resident Account from API (GET /api/nks/user/family?search=...)
 */
export async function nksSearchFamilyAccount(query: string): Promise<{ success: boolean; found: boolean; account?: any; message?: string }> {
  const res = await fetch(`/api/nks/user/family?search=${encodeURIComponent(query)}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    throw new Error('NKS SearchFamilyAccount API failed');
  }

  return await res.json();
}

/**
 * 9. Add Family Member API (POST /api/nks/user/family)
 */
export async function nksAddFamilyMember(payload: {
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
  const res = await fetch('/api/nks/user/family', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error('NKS AddFamily API failed');
  }

  return await res.json();
}

/**
 * 9. Remove Family Member API (DELETE /api/nks/user/family)
 */
export async function nksRemoveFamilyMember(memberId: string): Promise<{ success: boolean; message: string; members: any[] }> {
  const res = await fetch('/api/nks/user/family', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ memberId }),
  });

  if (!res.ok) {
    throw new Error('NKS RemoveFamily API failed');
  }

  return await res.json();
}
