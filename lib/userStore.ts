// ============================================================================
// SERVER-SIDE USER STORE (Multi-User, Role-Isolated Storage for NKS User APIs)
// ============================================================================
import { DEMO_USERS, updateDemoUser, User } from '@/lib/dataStore';

export interface StoredUser {
  id: string;
  username: string;
  firstname?: string;
  lastname?: string;
  fullname: string;
  full_name: string;
  email: string;
  phone: string;
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
  avatar_url?: string;
  role: 'ADMIN' | 'OWNER' | 'TENANT' | 'TECHNICIAN' | 'RECEPTIONIST';
  relationship?: string;
  apartment_code: string;
  updated_at?: string;
}

export interface ApartmentMember {
  id: string;
  username?: string;
  fullName: string;
  role: 'Family' | 'Tenant';
  relationship: string;
  phone: string;
  idCard: string;
  licensePlate?: string;
  faceStatus: string;
  avatarUrl?: string;
  addedDate: string;
}

// Global server memory store to maintain live user updates
declare global {
  // eslint-disable-next-line no-var
  var __NKS_USER_STORE: Record<string, StoredUser> | undefined;
  // eslint-disable-next-line no-var
  var __NKS_FAMILY_STORE: Record<string, ApartmentMember[]> | undefined;
}

/**
 * Initialize individual, isolated user records from DEMO_USERS
 */
function initUserStore(): Record<string, StoredUser> {
  const store: Record<string, StoredUser> = {};

  DEMO_USERS.forEach((u) => {
    const parts = (u.full_name || '').split(' ');
    const firstname = parts.slice(-1)[0] || '';
    const lastname = parts.slice(0, -1).join(' ') || '';

    const stored: StoredUser = {
      id: u.id,
      username: u.username,
      firstname,
      lastname,
      fullname: u.full_name,
      full_name: u.full_name,
      email: u.email || `${u.username}@skyline.vn`,
      phone: u.phone || u.username,
      gender: 1,
      dob: u.dob || (u.role === 'OWNER' ? '2004-11-02' : '1996-09-13'),
      pob: u.pob || 'TP. Hồ Chí Minh',
      id_number: u.id_card_no || '',
      id_card_no: u.id_card_no || '',
      id_date: '2022-08-15',
      id_place: 'Cục Cảnh sát QLHC về TTXH',
      province: 'TP. Hồ Chí Minh',
      intro: u.role === 'ADMIN' 
        ? 'Ban Quản Lý Tòa Nhà Skyline' 
        : u.role === 'OWNER' 
        ? 'Chủ Hộ Căn Hộ 12A05' 
        : u.relationship || 'Cư Dân Căn Hộ 12A05',
      license_plate: u.license_plate || '',
      avatar_url: u.avatar_url,
      role: u.role as any,
      relationship: u.relationship,
      apartment_code: u.apartment_code || '12A05',
    };

    // Index by primary ID
    store[u.id] = stored;
    // Index by username
    store[u.username.toLowerCase().trim()] = stored;
    // Index by phone
    if (u.phone) {
      store[u.phone.trim()] = stored;
    }
  });

  return store;
}

if (!global.__NKS_USER_STORE) {
  global.__NKS_USER_STORE = initUserStore();
}

/**
 * Extract specific user ID from session token
 * Token format: NKS_SESSION_{userId}_{role}_{timestamp}
 */
export function extractUserIdFromToken(token?: string): string | null {
  if (!token) return null;

  if (token.startsWith('NKS_SESSION_')) {
    const parts = token.split('_');
    if (parts.length >= 3) {
      return parts[2]; // Extracted user ID
    }
  }

  // Check if token contains user id directly
  const foundUser = DEMO_USERS.find(u => token.includes(u.id));
  if (foundUser) return foundUser.id;

  return null;
}

/**
 * Get distinct user profile by specific ID, username, phone, or email
 */
export function getUserStore(identifier: string): StoredUser {
  if (!global.__NKS_USER_STORE) {
    global.__NKS_USER_STORE = initUserStore();
  }

  // 1. Direct key match (id, username, phone)
  if (global.__NKS_USER_STORE[identifier]) {
    return global.__NKS_USER_STORE[identifier];
  }

  const norm = identifier.toLowerCase().trim();
  if (global.__NKS_USER_STORE[norm]) {
    return global.__NKS_USER_STORE[norm];
  }

  // 2. Iterate store to match id, username, email, or phone
  for (const key in global.__NKS_USER_STORE) {
    const u = global.__NKS_USER_STORE[key];
    if (
      u.id === identifier ||
      (u.username && u.username.toLowerCase().trim() === norm) ||
      (u.email && u.email.toLowerCase().trim() === norm) ||
      (u.phone && u.phone.toLowerCase().trim() === norm)
    ) {
      return u;
    }
  }

  // 3. Match from DEMO_USERS
  const fromDemo = DEMO_USERS.find(u => 
    u.id === identifier ||
    (u.username && u.username.toLowerCase().trim() === norm) ||
    (u.email && u.email.toLowerCase().trim() === norm) ||
    (u.phone && u.phone.toLowerCase().trim() === norm)
  );

  if (fromDemo) {
    const parts = (fromDemo.full_name || '').split(' ');
    const firstname = parts.slice(-1)[0] || '';
    const lastname = parts.slice(0, -1).join(' ') || '';

    const newUser: StoredUser = {
      id: fromDemo.id,
      username: fromDemo.username,
      firstname,
      lastname,
      fullname: fromDemo.full_name,
      full_name: fromDemo.full_name,
      email: fromDemo.email || '',
      phone: fromDemo.phone || fromDemo.username,
      role: fromDemo.role,
      relationship: fromDemo.relationship,
      apartment_code: fromDemo.apartment_code || '12A05',
      id_number: fromDemo.id_card_no || '',
      id_card_no: fromDemo.id_card_no || '',
      avatar_url: fromDemo.avatar_url,
      license_plate: fromDemo.license_plate,
    };

    global.__NKS_USER_STORE[fromDemo.id] = newUser;
    global.__NKS_USER_STORE[fromDemo.username.toLowerCase().trim()] = newUser;
    if (fromDemo.phone) global.__NKS_USER_STORE[fromDemo.phone.trim()] = newUser;

    return newUser;
  }

  // 4. Role default fallback ONLY when role keyword is explicitly passed
  if (identifier === 'ADMIN') {
    return global.__NKS_USER_STORE['user-manager-1'] || Object.values(global.__NKS_USER_STORE).find(u => u.role === 'ADMIN')!;
  }
  if (identifier === 'TECHNICIAN') {
    return global.__NKS_USER_STORE['user-tech-1'] || Object.values(global.__NKS_USER_STORE).find(u => u.role === 'TECHNICIAN')!;
  }
  if (identifier === 'TENANT') {
    return global.__NKS_USER_STORE['user-tenant-1'] || Object.values(global.__NKS_USER_STORE).find(u => u.role === 'TENANT')!;
  }

  // Fallback to Owner
  return global.__NKS_USER_STORE['user-owner-1'] || Object.values(global.__NKS_USER_STORE).find(u => u.role === 'OWNER')!;
}

/**
 * Update ONLY the targeted user's record without affecting other accounts
 */
export function updateUserStore(identifier: string, updates: Partial<StoredUser>): StoredUser {
  const current = getUserStore(identifier);
  const updated: StoredUser = {
    ...current,
    ...updates,
    updated_at: new Date().toISOString()
  };

  if (!global.__NKS_USER_STORE) {
    global.__NKS_USER_STORE = initUserStore();
  }

  // Save STRICTLY under this user's unique identifiers (ID, username, phone)
  global.__NKS_USER_STORE[updated.id] = updated;
  if (updated.username) {
    global.__NKS_USER_STORE[updated.username.toLowerCase().trim()] = updated;
  }
  if (updated.phone) {
    global.__NKS_USER_STORE[updated.phone.trim()] = updated;
  }
  if (updated.email) {
    global.__NKS_USER_STORE[updated.email.toLowerCase().trim()] = updated;
  }

  // Sync to DEMO_USERS in dataStore
  updateDemoUser(updated.id, {
    full_name: updated.fullname || updated.full_name,
    email: updated.email,
    phone: updated.phone,
    id_card_no: updated.id_number || updated.id_card_no,
    avatar_url: updated.avatar_url,
    license_plate: updated.license_plate,
    dob: updated.dob,
    pob: updated.pob,
  });

  return updated;
}

export function getApartmentMembers(aptCode: string): ApartmentMember[] {
  if (!global.__NKS_FAMILY_STORE) {
    global.__NKS_FAMILY_STORE = {};
  }
  return global.__NKS_FAMILY_STORE[aptCode] || global.__NKS_FAMILY_STORE['12A05'] || [];
}

export function addApartmentMember(aptCode: string, member: ApartmentMember): ApartmentMember[] {
  if (!global.__NKS_FAMILY_STORE) {
    global.__NKS_FAMILY_STORE = {};
  }
  const current = getApartmentMembers(aptCode);
  const updated = [
    ...current.filter(m => m.id !== member.id && m.phone !== member.phone),
    member
  ];
  global.__NKS_FAMILY_STORE[aptCode] = updated;
  return updated;
}

export function removeApartmentMember(aptCode: string, memberId: string): ApartmentMember[] {
  if (!global.__NKS_FAMILY_STORE) {
    global.__NKS_FAMILY_STORE = {};
  }
  const current = getApartmentMembers(aptCode);
  const updated = current.filter(m => m.id !== memberId);
  global.__NKS_FAMILY_STORE[aptCode] = updated;
  return updated;
}
