/**
 * Skyline Smart Residence & The Tropical - Apartment Management Store
 * Quản lý Danh sách Căn Hộ, Chi Tiết Căn Hộ 100% từ NKS SCRMAI API
 */

import { ApartmentMember, registerNewOwnerUser } from './userStore';
import { 
  generateNksBlockUnits, 
  DEFAULT_NKS_APARTMENTS_DATA, 
  fetchNksApartments 
} from './nksProjectService';

export type TowerId = 'A' | 'B';
export type ApartmentType = '1PN' | '2PN' | '3PN' | 'DUPLEX_PENTHOUSE';
export type ApartmentStatus = 'OCCUPIED' | 'VACANT' | 'MAINTENANCE' | 'HANDOVER_PENDING';

export interface ApartmentVehicle {
  id: string;
  type: 'CAR' | 'MOTORBIKE' | 'BICYCLE';
  plate: string;
  brand?: string;
  cardNo: string;
  slot?: string;
}

export interface ApartmentBilling {
  monthlyFee: number;
  parkingFee: number;
  serviceFee: number;
  totalAmount: number;
  status: 'PAID' | 'UNPAID';
  period: string;
  dueDate: string;
  lastPaidDate?: string;
}

export interface ApartmentMaintenanceRecord {
  id: string;
  date: string;
  title: string;
  technician: string;
  status: 'COMPLETED' | 'IN_PROGRESS';
  cost: number;
  note?: string;
}

export interface ApartmentHandoverProtocol {
  protocolCode: string;
  handoverDate: string;
  handoverOfficer: string;
  keysCount: number;
  cardsCount: number;
  initialElectricMeter: number;
  initialWaterMeter: number;
  notes?: string;
  pdfUrl?: string;
}

export interface ApartmentResidentOwner {
  name: string;
  phone: string;
  email: string;
  cccd: string;
  avatar: string;
  eKycApproved: boolean;
  handoverDate?: string;
  dob?: string;
  pob?: string;
  handoverProtocol?: ApartmentHandoverProtocol;
}

export interface ApartmentUnit {
  code: string;
  tower: TowerId;
  towerName: string;
  floor: number;
  type: ApartmentType;
  typeLabel: string;
  area: number;        // Diện tích thông thủy (m2)
  wallArea: number;    // Diện tích tim tường (m2)
  bedrooms: number;
  bathrooms: number;
  direction: string;   // Hướng ban công
  mainDoorDirection?: string;
  priceBillion: number;
  status: ApartmentStatus;
  statusLabel: string;
  owner?: ApartmentResidentOwner;
  handoverProtocol?: ApartmentHandoverProtocol;
  membersCount: number;
  members?: ApartmentMember[];
  vehicles?: ApartmentVehicle[];
  billing?: ApartmentBilling;
  maintenanceHistory?: ApartmentMaintenanceRecord[];
  description?: string;
  handoverDate?: string;
  createdAt: string;
  updatedAt: string;
}

const APARTMENTS_STORAGE_KEY = 'nks_apartments_master_v10';

/**
 * Danh sách căn hộ gốc khởi tạo từ NKS SCRMAI API (Tòa BS-07 - 34 Tầng)
 */
export const INITIAL_APARTMENTS: ApartmentUnit[] = generateNksBlockUnits(
  DEFAULT_NKS_APARTMENTS_DATA,
  'BS-07',
  34
);

/**
 * Lấy danh sách toàn bộ căn hộ từ bộ nhớ hoặc dữ liệu NKS SCRMAI API
 */
export function getApartmentUnits(): ApartmentUnit[] {
  if (typeof window === 'undefined') {
    return INITIAL_APARTMENTS;
  }

  try {
    // 1. Dọn dẹp triệt để các khóa lưu trữ mock cũ trong trình duyệt
    const LEGACY_STORAGE_KEYS = [
      'skyline_apartments_master_v1',
      'skyline_apartments_master_v2',
      'skyline_apartments_master_v3',
      'skyline_apartments_master_v4',
      'skyline_apartments_master_v5',
      'skyline_apartments_master_v6',
      'skyline_apartments_master_v7'
    ];
    LEGACY_STORAGE_KEYS.forEach(key => {
      try {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
        }
      } catch (e) {}
    });

    const raw = localStorage.getItem(APARTMENTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(APARTMENTS_STORAGE_KEY, JSON.stringify(INITIAL_APARTMENTS));
      return INITIAL_APARTMENTS;
    }

    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (e) {
    console.warn('Load apartments storage error:', e);
  }

  return INITIAL_APARTMENTS;
}

/**
 * Đồng bộ dữ liệu mới nhất trực tiếp 100% từ NKS SCRMAI API
 */
export async function syncApartmentsFromNksApi(blockCode: string = 'BS-07'): Promise<ApartmentUnit[]> {
  try {
    const nksApts = await fetchNksApartments();
    if (Array.isArray(nksApts) && nksApts.length > 0) {
      const liveUnits = generateNksBlockUnits(nksApts, blockCode, 34);
      saveApartmentsList(liveUnits);
      return liveUnits;
    }
  } catch (err) {
    console.warn('Sync NKS API apartments error:', err);
  }
  return getApartmentUnits();
}

/**
 * Lấy thông tin 1 căn hộ theo mã căn (hỗ trợ mã NKS API như CH-06, CH-01, 30-CH-06 và alias 12A05)
 */
export function getApartmentByCode(code: string): ApartmentUnit | undefined {
  if (!code) return undefined;
  const clean = code.trim().toUpperCase();
  const units = getApartmentUnits();

  // 1. Khớp chính xác mã căn (ví dụ 'CH-06', '30-CH-06')
  const exact = units.find((u) => u.code.toUpperCase() === clean);
  if (exact) return exact;

  // 2. Chuyển đổi mềm (Backward Compatibility): Nếu tìm 12A05 -> trả về căn hộ thực tế CH-06 của Trần Hữu Lực
  if (clean === '12A05' || clean === 'CH-06' || clean.endsWith('CH-06')) {
    const ownerUnit = units.find((u) => u.code === 'CH-06' || (u.floor === 30 && u.code.includes('CH-06')));
    if (ownerUnit) return ownerUnit;
  }

  if (clean === 'CH-01' || clean.endsWith('CH-01')) {
    const ch01Unit = units.find((u) => u.code === 'CH-01' || (u.floor === 30 && u.code.includes('CH-01')));
    if (ch01Unit) return ch01Unit;
  }

  // 3. Khớp tiền tố/hậu tố tầng (VD: '30-CH-06' khớp 'CH-06')
  const partial = units.find((u) => 
    u.code.toUpperCase().endsWith(`-${clean}`) || 
    clean.endsWith(`-${u.code.toUpperCase()}`)
  );
  if (partial) return partial;

  return units[0];
}

/**
 * Lưu/Cập nhật toàn bộ danh sách căn hộ vào localStorage
 */
export function saveApartmentsList(units: ApartmentUnit[]): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(APARTMENTS_STORAGE_KEY, JSON.stringify(units));
    window.dispatchEvent(new CustomEvent('skyline_apartments_updated', { detail: { units } }));
    return true;
  } catch (e) {
    console.error('Save apartments storage error:', e);
    return false;
  }
}

/**
 * Thêm một căn hộ mới vào hệ thống
 */
export function addApartmentUnit(unit: ApartmentUnit): boolean {
  const units = getApartmentUnits();
  const existing = units.find(u => u.code.toLowerCase() === unit.code.toLowerCase().trim());
  if (existing) {
    return false; // Mã căn hộ đã tồn tại
  }

  const newUnits = [unit, ...units];
  return saveApartmentsList(newUnits);
}

/**
 * Cập nhật thông số của căn hộ
 */
export function updateApartmentUnit(code: string, patch: Partial<ApartmentUnit>): boolean {
  const units = getApartmentUnits();
  const index = units.findIndex(u => u.code.toLowerCase() === code.toLowerCase().trim());
  if (index === -1) return false;

  const current = units[index];
  const updated: ApartmentUnit = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString()
  };

  // Cập nhật nhãn trạng thái nếu có đổi status
  if (patch.status) {
    if (patch.status === 'OCCUPIED') updated.statusLabel = 'Đang Sinh Sống';
    else if (patch.status === 'VACANT') updated.statusLabel = 'Căn Hộ Trống';
    else if (patch.status === 'MAINTENANCE') updated.statusLabel = 'Đang Sửa Chữa / Bảo Trì';
    else if (patch.status === 'HANDOVER_PENDING') updated.statusLabel = 'Chờ Bàn Giao';
  }

  units[index] = updated;
  return saveApartmentsList(units);
}

/**
 * Xóa một căn hộ khỏi hệ thống
 */
export function deleteApartmentUnit(code: string): boolean {
  const units = getApartmentUnits();
  const filtered = units.filter(u => u.code.toLowerCase() !== code.toLowerCase().trim());
  if (filtered.length === units.length) return false;
  return saveApartmentsList(filtered);
}

/**
 * Bàn giao căn hộ & gán chủ hộ mới (Kèm Biên bản bàn giao kỹ thuật & Đồng bộ tài khoản cư dân)
 */
export function assignApartmentResident(
  code: string, 
  owner: ApartmentResidentOwner,
  protocol?: ApartmentHandoverProtocol
): boolean {
  // 1. Tự động cấp tài khoản đăng nhập Cư Dân trên hệ thống
  try {
    registerNewOwnerUser({
      name: owner.name,
      phone: owner.phone,
      email: owner.email,
      cccd: owner.cccd,
      apartmentCode: code,
      dob: owner.dob,
      pob: owner.pob,
      avatarUrl: owner.avatar
    });
  } catch (e) {
    console.warn('Sync new resident to userStore error:', e);
  }

  // 2. Chuẩn hóa Biên bản bàn giao kỹ thuật (Handover Protocol)
  const todayStr = new Date().toLocaleDateString('vi-VN');
  const codeClean = code.toUpperCase().trim();
  const dateCode = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  
  const finalProtocol: ApartmentHandoverProtocol = protocol || owner.handoverProtocol || {
    protocolCode: `BBBG-TROPICAL-${codeClean}-${dateCode}`,
    handoverDate: owner.handoverDate || todayStr,
    handoverOfficer: 'Ban Quản Lý Phân Khu The Tropical',
    keysCount: 3,
    cardsCount: 2,
    initialElectricMeter: 0,
    initialWaterMeter: 0,
    notes: 'Đã hoàn tất nghiệm thu kỹ thuật bàn giao căn hộ, bàn giao chìa khóa cơ và cấp thẻ từ cư dân.'
  };

  const ownerWithProtocol: ApartmentResidentOwner = {
    ...owner,
    handoverProtocol: finalProtocol
  };

  return updateApartmentUnit(code, {
    status: 'OCCUPIED',
    statusLabel: 'Đang Sinh Sống',
    owner: ownerWithProtocol,
    handoverProtocol: finalProtocol,
    membersCount: Math.max(1, 1),
    handoverDate: owner.handoverDate || finalProtocol.handoverDate
  });
}

/**
 * Thu hồi căn hộ về trạng thái trống (trả nhà / chuyển đi)
 */
export function evictApartmentResident(code: string): boolean {
  return updateApartmentUnit(code, {
    status: 'VACANT',
    statusLabel: 'Căn Hộ Trống',
    owner: undefined,
    membersCount: 0,
    members: [],
    vehicles: []
  });
}

/**
 * Cập nhật trạng thái thanh toán hóa đơn
 */
export function updateApartmentBillingStatus(code: string, status: 'PAID' | 'UNPAID'): boolean {
  const unit = getApartmentByCode(code);
  if (!unit || !unit.billing) return false;

  const updatedBilling: ApartmentBilling = {
    ...unit.billing,
    status,
    lastPaidDate: status === 'PAID' ? new Date().toLocaleDateString('vi-VN') : unit.billing.lastPaidDate
  };

  return updateApartmentUnit(code, { billing: updatedBilling });
}

/**
 * Thêm phương tiện đăng ký cho căn hộ
 */
export function addApartmentVehicle(code: string, vehicle: ApartmentVehicle): boolean {
  const unit = getApartmentByCode(code);
  if (!unit) return false;

  const vehicles = unit.vehicles || [];
  const updatedVehicles = [...vehicles, vehicle];
  return updateApartmentUnit(code, { vehicles: updatedVehicles });
}

/**
 * Khôi phục danh sách căn hộ về mặc định
 */
export function resetApartmentsToDefault(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(APARTMENTS_STORAGE_KEY);
    saveApartmentsList(INITIAL_APARTMENTS);
  }
}
