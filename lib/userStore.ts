// ============================================================================
// SERVER-SIDE USER STORE (Dynamic in-memory storage for NKS User APIs)
// ============================================================================

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
  role: 'ADMIN' | 'OWNER' | 'TENANT' | 'TECHNICIAN';
  apartment_code: string;
  updated_at?: string;
}

// Global server memory store to maintain live user updates
declare global {
  // eslint-disable-next-line no-var
  var __NKS_USER_STORE: Record<string, StoredUser> | undefined;
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
    }
  };
}

export function getUserStore(roleKey: 'ADMIN' | 'OWNER' | 'TENANT'): StoredUser {
  return global.__NKS_USER_STORE![roleKey] || global.__NKS_USER_STORE!['OWNER'];
}

export function updateUserStore(roleKey: 'ADMIN' | 'OWNER' | 'TENANT', updates: Partial<StoredUser>): StoredUser {
  const current = getUserStore(roleKey);
  const updated: StoredUser = {
    ...current,
    ...updates,
    updated_at: new Date().toISOString()
  };
  global.__NKS_USER_STORE![roleKey] = updated;
  return updated;
}
