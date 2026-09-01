// ============================================================================
// SERVER-SIDE USER STORE (Dynamic in-memory storage for NKS User APIs)
import { DEMO_USERS, updateDemoUser } from '@/lib/dataStore';

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

if (!global.__NKS_USER_STORE) {
  global.__NKS_USER_STORE = {
    'ADMIN': {
      id: 'usr-admin-01',
      username: 'nks.manager01@gmail.com',
      firstname: 'Quản Trị',
      lastname: 'Ban Quản Lý',
      fullname: 'Ban Quản Lý Tòa Nhà Skyline',
      full_name: 'Ban Quản Lý Tòa Nhà Skyline',
      email: 'nks.manager01@gmail.com',
      phone: '0901888999',
      gender: 1,
      dob: '1985-05-20',
      pob: 'Hà Nội',
      id_number: '001085009988',
      id_card_no: '001085009988',
      id_date: '2021-05-20',
      id_place: 'Cục Cảnh sát QLHC về TTXH',
      province: 'TP. Hồ Chí Minh',
      intro: 'Trưởng Ban Quản Lý Tòa Nhà SKYLINE Smart Residence',
      license_plate: '51A-999.88',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
      role: 'ADMIN',
      apartment_code: 'BQL_OFFICE',
    },
    'OWNER': {
      id: 'usr-owner-01',
      username: 'huuluc04@gmail.com',
      firstname: 'Lực',
      lastname: 'Nguyễn Hữu',
      fullname: 'Nguyễn Hữu Lực',
      full_name: 'Nguyễn Hữu Lực',
      email: 'huuluc04@gmail.com',
      phone: '0903112233',
      gender: 1,
      dob: '1990-08-15',
      pob: 'TP. Hồ Chí Minh',
      id_number: '079095001234',
      id_card_no: '079095001234',
      id_date: '2022-08-15',
      id_place: 'Cục Cảnh sát QLHC về TTXH',
      province: 'TP. Hồ Chí Minh',
      intro: 'Chủ Hộ Căn Hộ 12A05 - SKYLINE Smart Residence',
      license_plate: '51K-889.99',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
      role: 'OWNER',
      apartment_code: '12A05',
    },
    'TENANT': {
      id: 'usr-tenant-01',
      username: 'nguyenhuunhut1309@gmail.com',
      firstname: 'Nhựt',
      lastname: 'Nguyễn Hữu',
      fullname: 'Nguyễn Hữu Nhựt',
      full_name: 'Nguyễn Hữu Nhựt',
      email: 'nguyenhuunhut1309@gmail.com',
      phone: '0908776655',
      gender: 1,
      dob: '1996-09-13',
      pob: 'TP. Hồ Chí Minh',
      id_number: '079198005678',
      id_card_no: '079198005678',
      id_date: '2023-01-10',
      id_place: 'Cục Cảnh sát QLHC về TTXH',
      province: 'TP. Hồ Chí Minh',
      intro: 'Cư Dân Thành Viên Căn Hộ 12A05',
      license_plate: '59P1-886.79',
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
      role: 'TENANT',
      apartment_code: '12A05',
    },
    'TECHNICIAN': {
      id: 'usr-tech-01',
      username: 'nks.manager02@gmail.com',
      firstname: 'Kỹ Thuật',
      lastname: 'Trần Văn',
      fullname: 'Trần Văn Kỹ Thuật',
      full_name: 'Trần Văn Kỹ Thuật (Kỹ Sư Vận Hành)',
      email: 'nks.manager02@gmail.com',
      phone: '0901888998',
      gender: 1,
      dob: '1988-11-25',
      pob: 'Đà Nẵng',
      id_number: '048088001122',
      id_card_no: '048088001122',
      id_date: '2021-08-10',
      id_place: 'Cục Cảnh sát QLHC về TTXH',
      province: 'TP. Hồ Chí Minh',
      intro: 'Đội Trưởng Đội Kỹ Thuật Vận Hành & PCCC Tòa Nhà SKYLINE',
      license_plate: '51D-882.11',
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300',
      role: 'TECHNICIAN',
      apartment_code: 'TECH_ROOM',
    }
  };
}

if (!global.__NKS_FAMILY_STORE) {
  global.__NKS_FAMILY_STORE = {
    '12A05': [
      {
        id: 'mem-nhut-01',
        username: 'nguyenhuunhut1309@gmail.com',
        fullName: 'Nguyễn Hữu Nhựt',
        role: 'Family',
        relationship: 'Thành viên gia đình (Em trai)',
        phone: '0908776655',
        idCard: '079198005678',
        licensePlate: '59P1-886.79',
        faceStatus: 'Đã Xác Thực FaceID',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
        addedDate: '10/01/2026',
      },
      {
        id: 'mem-thinh-02',
        username: '26vucatthinh@gmail.com',
        fullName: 'Vũ Cát Thịnh',
        role: 'Family',
        relationship: 'Thành viên gia đình (Gia phả TreeFamily)',
        phone: '0909262626',
        idCard: '079201002626',
        licensePlate: '59P1-926.26',
        faceStatus: 'Đã Xác Thực FaceID',
        avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
        addedDate: '15/02/2026',
      }
    ]
  };
}

export function getUserStore(identifier: string): StoredUser {
  if (!global.__NKS_USER_STORE) {
    global.__NKS_USER_STORE = {};
  }

  // 1. Direct key match (e.g. 'OWNER', 'ADMIN', 'TENANT', 'TECHNICIAN' or email/username)
  if (global.__NKS_USER_STORE[identifier]) {
    return global.__NKS_USER_STORE[identifier];
  }

  const norm = identifier.toLowerCase().trim();

  // 2. Match by email, username, or id in store
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

  // 3. Fallback to DEMO_USERS from dataStore if not yet in userStore
  const fromDemo = DEMO_USERS.find(u => 
    u.id === identifier ||
    (u.username && u.username.toLowerCase().trim() === norm) ||
    (u.email && u.email.toLowerCase().trim() === norm) ||
    (u.phone && u.phone.toLowerCase().trim() === norm) ||
    u.role === identifier
  );

  if (fromDemo) {
    const newUser: StoredUser = {
      id: fromDemo.id,
      username: fromDemo.username,
      firstname: fromDemo.full_name.split(' ').slice(-1)[0] || '',
      lastname: fromDemo.full_name.split(' ').slice(0, -1).join(' ') || '',
      fullname: fromDemo.full_name,
      full_name: fromDemo.full_name,
      email: fromDemo.email || '',
      phone: fromDemo.phone || fromDemo.username,
      role: fromDemo.role,
      apartment_code: fromDemo.apartment_code || '12A05',
      id_number: fromDemo.id_card_no || '079095001234',
      id_card_no: fromDemo.id_card_no || '079095001234',
      avatar_url: fromDemo.avatar_url,
      license_plate: fromDemo.license_plate,
    };
    global.__NKS_USER_STORE[fromDemo.role] = newUser;
    global.__NKS_USER_STORE[fromDemo.username] = newUser;
    if (fromDemo.email) global.__NKS_USER_STORE[fromDemo.email] = newUser;
    return newUser;
  }

  return global.__NKS_USER_STORE['OWNER'] || {
    id: 'usr-default',
    username: 'huuluc04@gmail.com',
    fullname: 'Nguyễn Hữu Lực',
    full_name: 'Nguyễn Hữu Lực',
    email: 'huuluc04@gmail.com',
    phone: '0903112233',
    role: 'OWNER',
    apartment_code: '12A05',
  };
}

export function updateUserStore(identifier: string, updates: Partial<StoredUser>): StoredUser {
  const current = getUserStore(identifier);
  const updated: StoredUser = {
    ...current,
    ...updates,
    updated_at: new Date().toISOString()
  };

  // Sync to all alias keys
  global.__NKS_USER_STORE![identifier] = updated;
  if (updated.role) global.__NKS_USER_STORE![updated.role] = updated;
  if (updated.username) global.__NKS_USER_STORE![updated.username] = updated;
  if (updated.email) global.__NKS_USER_STORE![updated.email] = updated;
  if (updated.id) global.__NKS_USER_STORE![updated.id] = updated;

  // Real-time synchronization to DEMO_USERS in dataStore
  updateDemoUser(identifier, {
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
