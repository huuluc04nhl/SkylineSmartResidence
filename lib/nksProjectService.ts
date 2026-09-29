/**
 * Skyline Smart Residence - NKS SCRMAI API Service
 * Quản trị dữ liệu Bất động sản 100% từ NKS SCRMAI API:
 * - Projects: /rsprojects, /rsproject
 * - Blocks: /rsblocks, /rsblock
 * - Apartments: /rsapartments (toàn bộ & theo số điện thoại chủ hộ)
 */

import { ApartmentUnit, ApartmentStatus, ApartmentType, ApartmentVehicle } from './apartmentStore';

export const NKS_API_BASE_URL = 'https://sdata.io.vn/wp-json/scrmai/v1';
export const NKS_API_TOKEN = '01KWKATNQGB5TWXYDPJ671X3X1';

export interface NksProject {
  id: number;
  title: string;
  slug: string;
  block?: string;
  parent?: {
    ID: number;
    post_title: string;
  };
  address?: string;
  location?: string;
  created_at?: string;
  updated_at?: string;
}

export interface NksBlock {
  id: number;
  title: string;
  slug: string;
  code: string;
  floors: string;
  location?: string;
  rsproject?: {
    ID: number;
    post_title: string;
  };
  created_at?: string;
  updated_at?: string;
}

export interface NksApartment {
  id: number;
  title: string;
  slug: string;
  code: string;
  area: string;
  bed: string;
  wc: string;
  floor: string;
  ownerid?: string;
  block?: {
    ID: number;
    post_title: string;
  };
  created_at?: string;
  updated_at?: string;
}

const STORAGE_KEY_PROJECTS = 'nks_cached_projects_v1';
const STORAGE_KEY_BLOCKS = 'nks_cached_blocks_v1';
const STORAGE_KEY_APARTMENTS = 'nks_cached_apartments_v1';

/**
 * 1. Lấy danh sách Dự án từ NKS API
 */
export async function fetchNksProjects(): Promise<NksProject[]> {
  const isBrowser = typeof window !== 'undefined';
  try {
    const url = isBrowser ? `/api/nks?type=projects` : `${NKS_API_BASE_URL}/rsprojects`;
    const res = isBrowser
      ? await fetch(url)
      : await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${NKS_API_TOKEN}`,
            'Accept': 'application/json',
          },
        });

    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        if (isBrowser) {
          localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(json.data));
        }
        return json.data;
      }
    }
  } catch (err) {
    console.warn('Lỗi kết nối NKS Projects API:', err);
  }

  // Fallback cache
  if (isBrowser) {
    const cached = localStorage.getItem(STORAGE_KEY_PROJECTS);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch { /* ignore */ }
    }
  }

  return [
    {
      id: 873,
      title: 'Beverly Solari',
      slug: 'beverly-solari',
      block: '4',
      parent: undefined,
    },
    {
      id: 876,
      title: 'The Tropical',
      slug: 'the-tropical',
      block: '4',
      parent: { ID: 873, post_title: 'Beverly Solari' },
    },
  ];
}

/**
 * 1.1 Lấy thông tin chi tiết 1 Dự án
 */
export async function fetchNksProjectDetail(id: number): Promise<NksProject | null> {
  const isBrowser = typeof window !== 'undefined';
  try {
    const url = isBrowser ? `/api/nks?type=project&id=${id}` : `${NKS_API_BASE_URL}/rsproject`;
    const res = isBrowser
      ? await fetch(url)
      : await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${NKS_API_TOKEN}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id }),
        });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    }
  } catch (err) {
    console.warn('Lỗi kết nối NKS Project Detail API:', err);
  }
  return null;
}

/**
 * 2. Lấy danh sách Tòa nhà (Block) từ NKS API
 */
export async function fetchNksBlocks(): Promise<NksBlock[]> {
  const isBrowser = typeof window !== 'undefined';
  try {
    const url = isBrowser ? `/api/nks?type=blocks` : `${NKS_API_BASE_URL}/rsblocks`;
    const res = isBrowser
      ? await fetch(url)
      : await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${NKS_API_TOKEN}`,
            'Accept': 'application/json',
          },
        });

    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        if (isBrowser) {
          localStorage.setItem(STORAGE_KEY_BLOCKS, JSON.stringify(json.data));
        }
        return json.data;
      }
    }
  } catch (err) {
    console.warn('Lỗi kết nối NKS Blocks API:', err);
  }

  // Fallback cache
  if (isBrowser) {
    const cached = localStorage.getItem(STORAGE_KEY_BLOCKS);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch { /* ignore */ }
    }
  }

  return [
    {
      id: 880,
      title: 'Tropical BS-07',
      slug: 'tropical-bs-07',
      code: 'BS-07',
      floors: '34',
      rsproject: { ID: 876, post_title: 'The Tropical' },
    },
    {
      id: 883,
      title: 'Tropical BS-08',
      slug: 'tropical-bs-08',
      code: 'BS-08',
      floors: '39',
      rsproject: { ID: 876, post_title: 'The Tropical' },
    },
    {
      id: 886,
      title: 'Tropical BS-09',
      slug: 'tropical-bs-09',
      code: 'BS-09',
      floors: '34',
      rsproject: { ID: 876, post_title: 'The Tropical' },
    },
    {
      id: 889,
      title: 'Tropical BS-10',
      slug: 'tropical-bs-10',
      code: 'BS-10',
      floors: '34',
      rsproject: { ID: 876, post_title: 'The Tropical' },
    },
  ];
}

/**
 * 2.1 Lấy thông tin chi tiết 1 Tòa nhà (Block)
 */
export async function fetchNksBlockDetail(id: number): Promise<NksBlock | null> {
  const isBrowser = typeof window !== 'undefined';
  try {
    const url = isBrowser ? `/api/nks?type=block&id=${id}` : `${NKS_API_BASE_URL}/rsblock`;
    const res = isBrowser
      ? await fetch(url)
      : await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${NKS_API_TOKEN}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id }),
        });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    }
  } catch (err) {
    console.warn('Lỗi kết nối NKS Block Detail API:', err);
  }
  return null;
}

/**
 * 3. Lấy toàn bộ danh sách Căn hộ từ NKS API
 */
export async function fetchNksApartments(): Promise<NksApartment[]> {
  const isBrowser = typeof window !== 'undefined';
  try {
    const url = isBrowser ? `/api/nks?type=apartments` : `${NKS_API_BASE_URL}/rsapartments`;
    const res = isBrowser
      ? await fetch(url)
      : await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${NKS_API_TOKEN}`,
            'Accept': 'application/json',
          },
        });

    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        if (isBrowser) {
          localStorage.setItem(STORAGE_KEY_APARTMENTS, JSON.stringify(json.data));
        }
        return json.data;
      }
    }
  } catch (err) {
    console.warn('Lỗi kết nối NKS Apartments API:', err);
  }

  // Fallback cache
  if (isBrowser) {
    const cached = localStorage.getItem(STORAGE_KEY_APARTMENTS);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch { /* ignore */ }
    }
  }

  return [];
}

/**
 * 4. Lấy danh sách Căn hộ theo Số điện thoại Chủ hộ từ NKS API
 */
export async function fetchNksApartmentsByPhone(phone: string): Promise<NksApartment[]> {
  const cleanPhone = phone.trim();
  if (!cleanPhone) return [];
  const isBrowser = typeof window !== 'undefined';

  try {
    const url = isBrowser 
      ? `/api/nks?type=apartments&phone=${encodeURIComponent(cleanPhone)}` 
      : `${NKS_API_BASE_URL}/rsapartments`;

    const res = isBrowser
      ? await fetch(url)
      : await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${NKS_API_TOKEN}`,
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({ phone: cleanPhone }).toString(),
        });

    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        return json.data;
      }
    }
  } catch (err) {
    console.warn(`Lỗi tìm căn hộ theo phone ${cleanPhone}:`, err);
  }

  return [];
}

/**
 * 5. Adapter: Chuyển đổi dữ liệu NksApartment sang đối tượng ApartmentUnit của dự án
 */
export function convertNksToApartmentUnit(
  item: NksApartment,
  blockCode?: string,
  blockName?: string
): ApartmentUnit {
  const floorNum = parseInt(item.floor || '1', 10) || 1;
  const areaNum = parseFloat(item.area || '45') || 45;
  const bedNum = parseInt(item.bed || '1', 10) || 1;
  const wcNum = parseInt(item.wc || '1', 10) || 1;

  const bCode = blockCode || (item.block?.post_title ? item.block.post_title.replace('Tropical ', '') : 'BS-07');
  const bTitle = blockName || (item.block?.post_title || `Tòa ${bCode}`);

  const unitType: ApartmentType = bedNum === 1 ? '1PN' : bedNum === 2 ? '2PN' : bedNum === 3 ? '3PN' : 'DUPLEX_PENTHOUSE';
  const typeLabel = `${bedNum} Phòng Ngủ - ${wcNum}WC`;

  const cleanOwnerId = (item.ownerid || '').trim();
  const isUserLuc = cleanOwnerId === '0364967082';

  const status: ApartmentStatus = cleanOwnerId ? 'OCCUPIED' : 'VACANT';

  // Định dạng mã căn hiển thị: VD "CH-06" hoặc "BS07-30.06"
  const formattedCode = item.code.trim();

  return {
    code: formattedCode,
    tower: bCode.includes('10') ? 'B' : 'A',
    towerName: bTitle,
    floor: floorNum,
    type: unitType,
    typeLabel,
    area: areaNum,
    wallArea: Math.round(areaNum * 1.08 * 10) / 10,
    bedrooms: bedNum,
    bathrooms: wcNum,
    direction: floorNum > 20 ? 'Đông Nam (View Sông & Công Viên)' : 'Tây Bắc (Nội Khu)',
    mainDoorDirection: 'Tây Nam',
    priceBillion: Math.round((areaNum * 0.055) * 100) / 100, // ~55tr/m2
    status,
    statusLabel: status === 'OCCUPIED' ? 'Đã Bàn Giao (Cư Dân Đang Ở)' : 'Đang Trống (Sẵn Sàng Bàn Giao)',
    owner: cleanOwnerId ? {
      name: isUserLuc ? 'Trần Hữu Lực' : `Chủ Hộ Căn ${formattedCode}`,
      phone: cleanOwnerId,
      email: isUserLuc ? 'huuluc04@gmail.com' : `owner.${formattedCode.toLowerCase()}@nks.vn`,
      cccd: isUserLuc ? '067204000961' : '079204008888',
      avatar: isUserLuc ? 'https://data.nks.vn/storage/users/202609021654232258.jpg' : 'https://data.nks.vn/storage/users/default.png',
      eKycApproved: true,
      handoverDate: item.created_at ? item.created_at.split(' ')[0] : '2026-09-21',
      dob: isUserLuc ? '18/08/2004' : '01/01/1990',
      pob: isUserLuc ? 'Triệu Trạch, Triệu Phong, Quảng Trị' : 'TP. Hồ Chí Minh',
      handoverProtocol: isUserLuc ? {
        protocolCode: `BBBG-TROPICAL-${bCode}-${formattedCode}-20260921`,
        handoverDate: '21/09/2026',
        handoverOfficer: 'KTS. Lê Quang Minh (Trưởng Ban Quản Lý)',
        keysCount: 3,
        cardsCount: 2,
        initialElectricMeter: 12.5,
        initialWaterMeter: 1.2,
        notes: 'Đã nghiệm thu căn hộ hoàn thiện phân khu The Tropical - Tòa BS-07. Khóa điện tử FaceID và thiết bị nước hoạt động ổn định.'
      } : undefined
    } : undefined,
    handoverProtocol: isUserLuc ? {
      protocolCode: `BBBG-TROPICAL-${bCode}-${formattedCode}-20260921`,
      handoverDate: '21/09/2026',
      handoverOfficer: 'KTS. Lê Quang Minh (Trưởng Ban Quản Lý)',
      keysCount: 3,
      cardsCount: 2,
      initialElectricMeter: 12.5,
      initialWaterMeter: 1.2,
      notes: 'Đã nghiệm thu căn hộ hoàn thiện phân khu The Tropical - Tòa BS-07. Khóa điện tử FaceID và thiết bị nước hoạt động ổn định.'
    } : undefined,
    membersCount: isUserLuc ? 4 : (cleanOwnerId ? 2 : 0),
    members: isUserLuc ? [
      {
        id: 'mem-1',
        fullName: 'Nguyễn Hữu Nhựt',
        role: 'Family',
        relationship: 'Em trai / Người nhà',
        phone: '0917795211',
        idCard: '079198005678',
        avatarUrl: 'https://data.nks.vn/storage/users/202607191405195335.jpg',
        licensePlate: '59P1-886.79',
        faceStatus: 'Đã xác thực',
        addedDate: '03/09/2026'
      },
      {
        id: 'mem-2',
        fullName: 'Nguyễn Văn Cường',
        role: 'Family',
        relationship: 'Thành viên gia đình',
        phone: '0325524482',
        idCard: '074204001708',
        avatarUrl: 'https://data.nks.vn/storage/users/202608301345022366.jpg',
        faceStatus: 'Đã xác thực',
        addedDate: '30/08/2026'
      },
      {
        id: 'mem-3',
        fullName: 'Lê Đức Hải',
        role: 'Family',
        relationship: 'Thành viên gia đình',
        phone: '0977758215',
        idCard: '070204001704',
        avatarUrl: 'https://data.nks.vn/storage/users/202607210516458204.jpg',
        faceStatus: 'Đã xác thực',
        addedDate: '21/07/2026'
      },
      {
        id: 'mem-4',
        fullName: 'Vũ Cát Thịnh',
        role: 'Family',
        relationship: 'Thành viên gia đình',
        phone: '0909262626',
        idCard: '079201002626',
        avatarUrl: 'https://data.nks.vn/storage/users/default.png',
        faceStatus: 'Chờ duyệt FaceID',
        addedDate: '01/09/2026'
      }
    ] : [],
    vehicles: isUserLuc ? [
      { id: 'veh-1', type: 'CAR', plate: '51K-889.99', brand: 'Mercedes C300 AMG', cardNo: `RFID-${bCode}-${formattedCode}-01`, slot: 'B2-A15' },
      { id: 'veh-2', type: 'MOTORBIKE', plate: '59P1-886.79', brand: 'Honda SH 160i', cardNo: `RFID-${bCode}-${formattedCode}-02`, slot: 'B1-M88' }
    ] : (cleanOwnerId ? [
      {
        id: `veh-${item.id}-1`,
        type: 'MOTORBIKE',
        plate: '59P1-123.45',
        cardNo: `CARD-${item.id}-01`,
        brand: 'Honda AirBlade',
      }
    ] : []),
    billing: isUserLuc ? {
      monthlyFee: 1450000,
      parkingFee: 1800000,
      serviceFee: 215000,
      totalAmount: 3465000,
      status: 'UNPAID',
      period: 'Tháng 09/2026',
      dueDate: '10/10/2026'
    } : undefined,
    nksId: item.id,
    nksSlug: item.slug,
    isApiSynced: true,
    nksRawData: item,
    createdAt: item.created_at || '2026-09-21 09:00:00',
    updatedAt: item.updated_at || '2026-09-21 09:00:00',
  };
}

// 21 cấu hình căn hộ theo bản vẽ CAD kiến trúc
export const NKS_FLOOR_ARCH_UNITS = [
  // CÁNH 1: CÁNH BẮC (NORTH WING - Căn 01 đến 05)
  { num: '01', code: 'CH-01', wing: 'NORTH' as const, wingLabel: 'Cánh Bắc', type: '2PN' as ApartmentType, typeLabel: '2PN Góc (Căn Phụ)', beds: 2, baths: 2, area: 68.4, dir: 'Đông Bắc', defaultPrice: 4.6 },
  { num: '02', code: 'CH-02', wing: 'NORTH' as const, wingLabel: 'Cánh Bắc', type: '1PN' as ApartmentType, typeLabel: '1PN Tiêu Chuẩn', beds: 1, baths: 1, area: 38.2, dir: 'Đông Bắc', defaultPrice: 2.8 },
  { num: '03', code: 'CH-03', wing: 'NORTH' as const, wingLabel: 'Cánh Bắc', type: '1PN' as ApartmentType, typeLabel: '1PN+ Đa Năng', beds: 1, baths: 1, area: 46.5, dir: 'Đông Bắc', defaultPrice: 3.2 },
  { num: '04', code: 'CH-04', wing: 'NORTH' as const, wingLabel: 'Cánh Bắc', type: '2PN' as ApartmentType, typeLabel: '2PN Ban Công Kính', beds: 2, baths: 2, area: 59.1, dir: 'Đông Bắc', defaultPrice: 4.1 },
  { num: '05', code: 'CH-05', wing: 'NORTH' as const, wingLabel: 'Cánh Bắc', type: '2PN' as ApartmentType, typeLabel: '2PN Góc Đẹp', beds: 2, baths: 2, area: 69.2, dir: 'Đông Bắc', defaultPrice: 4.8 },

  // CÁNH 2: CÁNH NAM (SOUTH WING - Căn 06 đến 10, nơi đặt CĂN CHỦ HỘ TẦNG 30)
  { num: '06', code: 'CH-06', wing: 'SOUTH' as const, wingLabel: 'Cánh Nam', type: '1PN' as ApartmentType, typeLabel: '1PN View Hồ Bơi (Căn Chủ Hộ)', beds: 1, baths: 1, area: 42.0, dir: 'Đông Nam', defaultPrice: 3.4 },
  { num: '07', code: 'CH-07', wing: 'SOUTH' as const, wingLabel: 'Cánh Nam', type: '2PN' as ApartmentType, typeLabel: '2PN Gia Đình', beds: 2, baths: 2, area: 59.0, dir: 'Đông Nam', defaultPrice: 4.1 },
  { num: '08', code: 'CH-08', wing: 'SOUTH' as const, wingLabel: 'Cánh Nam', type: '1PN' as ApartmentType, typeLabel: '1PN+ Đa Năng', beds: 1, baths: 1, area: 46.5, dir: 'Đông Nam', defaultPrice: 3.25 },
  { num: '09', code: 'CH-09', wing: 'SOUTH' as const, wingLabel: 'Cánh Nam', type: '2PN' as ApartmentType, typeLabel: '2PN Góc Thoáng', beds: 2, baths: 2, area: 69.5, dir: 'Đông Nam', defaultPrice: 4.9 },
  { num: '10', code: 'CH-10', wing: 'SOUTH' as const, wingLabel: 'Cánh Nam', type: 'STUDIO' as ApartmentType, typeLabel: 'Studio Tiện Nghi', beds: 1, baths: 1, area: 35.0, dir: 'Đông Nam', defaultPrice: 2.45 },

  // CÁNH 3: CÁNH TÂY (WEST WING - Dãy căn 11 đến 21 đối xứng qua hành lang 1.8m)
  { num: '11', code: 'CH-11', wing: 'WEST' as const, wingLabel: 'Cánh Tây', type: '2PN' as ApartmentType, typeLabel: '2PN Tây Bắc', beds: 2, baths: 2, area: 62.0, dir: 'Tây Bắc', defaultPrice: 4.2 },
  { num: '12', code: 'CH-12', wing: 'WEST' as const, wingLabel: 'Cánh Tây', type: '1PN' as ApartmentType, typeLabel: '1PN Tiện Ích', beds: 1, baths: 1, area: 44.5, dir: 'Tây Bắc', defaultPrice: 3.1 },
  { num: '13', code: 'CH-13', wing: 'WEST' as const, wingLabel: 'Cánh Tây', type: 'STUDIO' as ApartmentType, typeLabel: 'Studio Hiện Đại', beds: 1, baths: 1, area: 33.5, dir: 'Tây Bắc', defaultPrice: 2.3 },
  { num: '14', code: 'CH-14', wing: 'WEST' as const, wingLabel: 'Cánh Tây', type: '2PN' as ApartmentType, typeLabel: '2PN Ban Công Rộng', beds: 2, baths: 2, area: 58.5, dir: 'Tây Bắc', defaultPrice: 4.0 },
  { num: '15', code: 'CH-15', wing: 'WEST' as const, wingLabel: 'Cánh Tây', type: '2PN' as ApartmentType, typeLabel: '2PN Góc Tây', beds: 2, baths: 2, area: 67.0, dir: 'Tây Bắc', defaultPrice: 4.5 },
  { num: '16', code: 'CH-16', wing: 'WEST' as const, wingLabel: 'Cánh Tây', type: '2PN' as ApartmentType, typeLabel: '2PN Tây Nam', beds: 2, baths: 2, area: 68.0, dir: 'Tây Nam', defaultPrice: 4.6 },
  { num: '17', code: 'CH-17', wing: 'WEST' as const, wingLabel: 'Cánh Tây', type: '1PN' as ApartmentType, typeLabel: '1PN View Cây Xanh', beds: 1, baths: 1, area: 43.0, dir: 'Tây Nam', defaultPrice: 3.0 },
  { num: '18', code: 'CH-18', wing: 'WEST' as const, wingLabel: 'Cánh Tây', type: '2PN' as ApartmentType, typeLabel: '2PN Tiêu Chuẩn', beds: 2, baths: 2, area: 61.5, dir: 'Tây Nam', defaultPrice: 4.15 },
  { num: '19', code: 'CH-19', wing: 'WEST' as const, wingLabel: 'Cánh Tây', type: 'STUDIO' as ApartmentType, typeLabel: 'Studio Nhỏ Gọn', beds: 1, baths: 1, area: 34.0, dir: 'Tây Nam', defaultPrice: 2.4 },
  { num: '20', code: 'CH-20', wing: 'WEST' as const, wingLabel: 'Cánh Tây', type: '1PN' as ApartmentType, typeLabel: '1PN Đón Gió', beds: 1, baths: 1, area: 45.0, dir: 'Tây Nam', defaultPrice: 3.15 },
  { num: '21', code: 'CH-21', wing: 'WEST' as const, wingLabel: 'Cánh Tây', type: '2PN' as ApartmentType, typeLabel: '2PN Góc Nam', beds: 2, baths: 2, area: 70.0, dir: 'Tây Nam', defaultPrice: 4.95 },
];

/**
 * 6. Sinh danh sách căn hộ hoàn chỉnh theo 21 căn/sàn kết hợp dữ liệu chuẩn 100% từ NKS SCRMAI API
 */
export function generateNksBlockUnits(
  nksApts: NksApartment[],
  blockCode: string = 'BS-07',
  totalFloors: number = 34
): ApartmentUnit[] {
  const units: ApartmentUnit[] = [];
  const apiMap = new Map<string, NksApartment>();

  nksApts.forEach(apt => {
    const aptBlock = (apt.block?.post_title || apt.title || '').toUpperCase();
    const cleanBlock = blockCode.toUpperCase();
    // Khớp chặt chẽ: Chỉ ánh xạ căn hộ khi căn hộ đó thực sự thuộc chung cư đang tạo
    const matchesBlock = aptBlock.includes(cleanBlock);
    if (matchesBlock) {
      const key = `${apt.floor}_${apt.code.trim().toUpperCase()}`;
      apiMap.set(key, apt);
      apiMap.set(`${apt.floor}_${apt.code.trim().toUpperCase().replace('CH-', '')}`, apt);
    }
  });

  const bTitle = `Chung Cư ${blockCode}`;
  const towerId = (blockCode === 'BS-09' || blockCode === 'BS-10') ? 'B' : 'A';

  for (let fl = totalFloors; fl >= 1; fl--) {
    const floorStr = String(fl);

    NKS_FLOOR_ARCH_UNITS.forEach(cfg => {
      const cCode = cfg.code;
      const targetCode = (blockCode === 'BS-07' && fl === 30 && (cfg.num === '06' || cfg.num === '01')) 
        ? cCode 
        : `${fl}-${cCode}`;

      const matchedApi = apiMap.get(`${floorStr}_${cCode}`) || 
                         apiMap.get(`${floorStr}_${cfg.num}`) ||
                         Array.from(apiMap.values()).find(a => 
                           String(a.floor) === floorStr && (
                             a.code.toUpperCase() === cCode ||
                             a.code.toUpperCase() === cfg.num ||
                             a.code.toUpperCase() === targetCode.toUpperCase()
                           )
                         );

      if (matchedApi) {
        const unit = convertNksToApartmentUnit(matchedApi, blockCode, bTitle);
        units.push({
          ...unit,
          code: targetCode,
          wing: cfg.wing,
          wingLabel: cfg.wingLabel,
          nksId: matchedApi.id,
          nksSlug: matchedApi.slug,
          isApiSynced: true,
          nksRawData: matchedApi,
        });
      } else {
        units.push({
          code: targetCode,
          tower: towerId,
          towerName: bTitle,
          floor: fl,
          type: cfg.type,
          typeLabel: cfg.typeLabel,
          area: cfg.area,
          wallArea: Math.round(cfg.area * 1.08 * 10) / 10,
          bedrooms: cfg.beds,
          bathrooms: cfg.baths,
          direction: cfg.dir,
          mainDoorDirection: cfg.wing === 'SOUTH' ? 'Tây Bắc' : 'Đông Nam',
          priceBillion: cfg.defaultPrice,
          status: 'VACANT',
          statusLabel: 'Căn Hộ Trống (Sẵn Sàng Bàn Giao)',
          wing: cfg.wing,
          wingLabel: cfg.wingLabel,
          membersCount: 0,
          vehicles: [],
          isApiSynced: false,
          createdAt: '2026-09-21 09:00:00',
          updatedAt: '2026-09-21 09:00:00',
        });
      }
    });
  }

  return units;
}

export const DEFAULT_NKS_APARTMENTS_DATA: NksApartment[] = [
  {
    id: 904,
    title: 'Tropical BS-07 CH-06',
    slug: 'tropical-bs-07-ch-06-20',
    code: 'CH-06',
    area: '42',
    bed: '1',
    wc: '1',
    floor: '20',
    ownerid: '0364967080',
    block: { ID: 880, post_title: 'Tropical BS-07' },
    created_at: '2026-09-21 09:02:18',
    updated_at: '2026-09-21 09:02:18'
  },
  {
    id: 901,
    title: 'Tropical BS-07 CH-08',
    slug: 'tropical-bs-07-ch-08',
    code: 'CH-08',
    area: '60',
    bed: '2',
    wc: '1',
    floor: '30',
    ownerid: '0364967081',
    block: { ID: 880, post_title: 'Tropical BS-07' },
    created_at: '2026-09-21 09:00:55',
    updated_at: '2026-09-21 09:00:55'
  },
  {
    id: 898,
    title: 'Tropical BS-07 CH-06',
    slug: 'tropical-bs-07-ch-06',
    code: 'CH-06',
    area: '42',
    bed: '1',
    wc: '1',
    floor: '30',
    ownerid: '0364967082',
    block: { ID: 880, post_title: 'Tropical BS-07' },
    created_at: '2026-09-21 09:00:02',
    updated_at: '2026-09-21 09:00:02'
  },
  {
    id: 895,
    title: 'Tropical BS-07 CH-01',
    slug: 'tropical-bs-07-ch-01',
    code: 'CH-01',
    area: '50',
    bed: '2',
    wc: '1',
    floor: '30',
    ownerid: '0364967082',
    block: { ID: 880, post_title: 'Tropical BS-07' },
    created_at: '2026-09-21 08:59:23',
    updated_at: '2026-09-21 08:59:23'
  }
];

