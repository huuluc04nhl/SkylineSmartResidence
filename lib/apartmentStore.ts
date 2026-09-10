/**
 * Skyline Smart Residence - Apartment Management Store
 * Quản lý Danh sách Căn Hộ, Chi Tiết Căn Hộ, Trạng Thái Cư Trú và Bàn Giao
 */

import { ApartmentMember } from './userStore';

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

const APARTMENTS_STORAGE_KEY = 'skyline_apartments_master_v1';

export const INITIAL_APARTMENTS: ApartmentUnit[] = [
  // -------------------------------------------------------------
  // TÒA A - SAPPHIRE TOWER (32 TẦNG)
  // -------------------------------------------------------------
  // Căn hộ cư dân chính thức: 12A05 (Nguyễn Hữu Lực)
  {
    code: '12A05',
    tower: 'A',
    towerName: 'Tòa A (Sapphire)',
    floor: 12,
    type: '2PN',
    typeLabel: '2 Phòng Ngủ - 2WC',
    area: 78.5,
    wallArea: 83.2,
    bedrooms: 2,
    bathrooms: 2,
    direction: 'Đông Nam',
    mainDoorDirection: 'Tây Bắc',
    priceBillion: 4.85,
    status: 'OCCUPIED',
    statusLabel: 'Đang Sinh Sống',
    owner: {
      name: 'Nguyễn Hữu Lực',
      phone: '0364967082',
      email: 'huuluc04@gmail.com',
      cccd: '067204000961',
      avatar: 'https://data.nks.vn/storage/users/202609021654232258.jpg',
      eKycApproved: true,
      handoverDate: '15/01/2026',
      dob: '18/08/2004',
      pob: 'Triệu Trạch, Triệu Phong, Quảng Trị',
    },
    membersCount: 4,
    members: [
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
    ],
    vehicles: [
      { id: 'veh-1', type: 'CAR', plate: '51K-889.99', brand: 'Mercedes C300 AMG', cardNo: 'RFID-A1205-01', slot: 'B2-A15' },
      { id: 'veh-2', type: 'MOTORBIKE', plate: '59P1-886.79', brand: 'Honda SH 160i', cardNo: 'RFID-A1205-02', slot: 'B1-M88' }
    ],
    billing: {
      monthlyFee: 1450000,
      parkingFee: 1800000,
      serviceFee: 215000,
      totalAmount: 3465000,
      status: 'UNPAID',
      period: 'Tháng 08/2026',
      dueDate: '10/09/2026'
    },
    maintenanceHistory: [
      {
        id: 'mt-1',
        date: '12/08/2026',
        title: 'Bảo dưỡng định kỳ hệ thống điều hòa Multi Daikin',
        technician: 'KTV Trần Anh Tuấn (BQL)',
        status: 'COMPLETED',
        cost: 0,
        note: 'Gói bảo hành kỹ thuật 12 tháng của CĐT'
      }
    ],
    description: 'Căn góc 2 mặt thoáng view trọn vẹn công viên ven sông và hồ bơi vô cực Sky Pool.',
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: '2026-09-10T14:30:00Z'
  },

  // Toàn bộ các căn còn lại trên Tầng 12 (Tòa A) - Chuẩn mặt bằng 8 căn/tầng
  {
    code: '12A01',
    tower: 'A',
    towerName: 'Tòa A (Sapphire)',
    floor: 12,
    type: '3PN',
    typeLabel: '3 Phòng Ngủ - 2WC',
    area: 98.0,
    wallArea: 104.5,
    bedrooms: 3,
    bathrooms: 2,
    direction: 'Đông Nam',
    mainDoorDirection: 'Tây Bắc',
    priceBillion: 6.20,
    status: 'VACANT',
    statusLabel: 'Căn Hộ Trống',
    membersCount: 0,
    vehicles: [],
    description: 'Căn góc 3 phòng ngủ đón gió tự nhiên, ban công kính Low-E tầm nhìn sông Sài Gòn.',
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: '2026-09-10T14:30:00Z'
  },
  {
    code: '12A02',
    tower: 'A',
    towerName: 'Tòa A (Sapphire)',
    floor: 12,
    type: '1PN',
    typeLabel: '1 Phòng Ngủ - 1WC',
    area: 52.0,
    wallArea: 56.5,
    bedrooms: 1,
    bathrooms: 1,
    direction: 'Chính Nam',
    mainDoorDirection: 'Chính Bắc',
    priceBillion: 3.35,
    status: 'VACANT',
    statusLabel: 'Căn Hộ Trống',
    membersCount: 0,
    vehicles: [],
    description: 'Căn 1PN thông minh, thiết kế vuông vức bàn giao full thiết bị bếp Hafele.',
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: '2026-09-10T14:30:00Z'
  },
  {
    code: '12A03',
    tower: 'A',
    towerName: 'Tòa A (Sapphire)',
    floor: 12,
    type: '2PN',
    typeLabel: '2 Phòng Ngủ - 2WC',
    area: 75.0,
    wallArea: 80.2,
    bedrooms: 2,
    bathrooms: 2,
    direction: 'Đông Nam',
    mainDoorDirection: 'Tây Bắc',
    priceBillion: 4.65,
    status: 'VACANT',
    statusLabel: 'Căn Hộ Trống',
    membersCount: 0,
    vehicles: [],
    description: 'Căn 2PN tiêu chuẩn hướng nội khu công viên cây xanh và hồ cảnh quan.',
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: '2026-09-10T14:30:00Z'
  },
  {
    code: '12A04',
    tower: 'A',
    towerName: 'Tòa A (Sapphire)',
    floor: 12,
    type: '3PN',
    typeLabel: '3 Phòng Ngủ - 3WC',
    area: 108.0,
    wallArea: 115.0,
    bedrooms: 3,
    bathrooms: 3,
    direction: 'Tây Nam',
    mainDoorDirection: 'Đông Bắc',
    priceBillion: 6.95,
    status: 'VACANT',
    statusLabel: 'Căn Hộ Trống',
    membersCount: 0,
    vehicles: [],
    description: 'Căn 3PN gia đình rộng rãi, phòng khách nối liền logia thoáng mát.',
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: '2026-09-10T14:30:00Z'
  },
  {
    code: '12A06',
    tower: 'A',
    towerName: 'Tòa A (Sapphire)',
    floor: 12,
    type: '2PN',
    typeLabel: '2 Phòng Ngủ - 2WC',
    area: 75.0,
    wallArea: 80.0,
    bedrooms: 2,
    bathrooms: 2,
    direction: 'Đông Bắc',
    mainDoorDirection: 'Tây Nam',
    priceBillion: 4.60,
    status: 'VACANT',
    statusLabel: 'Căn Hộ Trống',
    membersCount: 0,
    vehicles: [],
    description: 'Căn 2PN thiết kế tối ưu đón ánh sáng ban mai, tầm nhìn quảng trường.',
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: '2026-09-10T14:30:00Z'
  },
  {
    code: '12A07',
    tower: 'A',
    towerName: 'Tòa A (Sapphire)',
    floor: 12,
    type: '3PN',
    typeLabel: '3 Phòng Ngủ - 3WC',
    area: 112.0,
    wallArea: 119.5,
    bedrooms: 3,
    bathrooms: 3,
    direction: 'Chính Bắc',
    mainDoorDirection: 'Chính Nam',
    priceBillion: 7.25,
    status: 'VACANT',
    statusLabel: 'Căn Hộ Trống',
    membersCount: 0,
    vehicles: [],
    description: 'Căn 3PN góc hai mặt thoáng mát mẻ quanh năm, view panorama thành phố.',
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: '2026-09-10T14:30:00Z'
  },
  {
    code: '12A08',
    tower: 'A',
    towerName: 'Tòa A (Sapphire)',
    floor: 12,
    type: '1PN',
    typeLabel: '1 Phòng Ngủ - 1WC',
    area: 52.0,
    wallArea: 56.4,
    bedrooms: 1,
    bathrooms: 1,
    direction: 'Tây Bắc',
    mainDoorDirection: 'Đông Nam',
    priceBillion: 3.30,
    status: 'VACANT',
    statusLabel: 'Căn Hộ Trống',
    membersCount: 0,
    vehicles: [],
    description: 'Căn 1PN thông minh, đầy đủ đầu chờ smart home và khóa cửa thông minh FaceID.',
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: '2026-09-10T14:30:00Z'
  },

  // Các tầng tiêu biểu khác của Tòa A
  {
    code: '05A02',
    tower: 'A',
    towerName: 'Tòa A (Sapphire)',
    floor: 5,
    type: '1PN',
    typeLabel: '1 Phòng Ngủ - 1WC',
    area: 52.0,
    wallArea: 56.4,
    bedrooms: 1,
    bathrooms: 1,
    direction: 'Đông Bắc',
    mainDoorDirection: 'Tây Nam',
    priceBillion: 3.25,
    status: 'VACANT',
    statusLabel: 'Căn Hộ Trống',
    membersCount: 0,
    vehicles: [],
    description: 'Căn 1PN tầng 5 di chuyển thuận tiện, view nhìn thẳng vườn hoa trung tâm.',
    createdAt: '2026-03-01T08:00:00Z',
    updatedAt: '2026-09-05T09:00:00Z'
  },
  {
    code: '10A03',
    tower: 'A',
    towerName: 'Tòa A (Sapphire)',
    floor: 10,
    type: '2PN',
    typeLabel: '2 Phòng Ngủ - 2WC',
    area: 78.5,
    wallArea: 83.2,
    bedrooms: 2,
    bathrooms: 2,
    direction: 'Đông Nam',
    mainDoorDirection: 'Tây Bắc',
    priceBillion: 4.90,
    status: 'MAINTENANCE',
    statusLabel: 'Đang Nghiệm Thu Kỹ Thuật',
    membersCount: 0,
    vehicles: [],
    maintenanceHistory: [
      {
        id: 'mt-10a03-1',
        date: '05/09/2026',
        title: 'Nghiệm thu hoàn thiện nội thất và hệ thống PCCC căn hộ',
        technician: 'KTV Trần Văn Kỹ Thuật (BQL)',
        status: 'IN_PROGRESS',
        cost: 0,
        note: 'Dự kiến bàn giao đón cư dân ngày 20/09/2026'
      }
    ],
    description: 'Căn hộ đang trong đợt nghiệm thu kỹ thuật bàn giao của chủ đầu tư.',
    createdAt: '2026-03-10T10:00:00Z',
    updatedAt: '2026-09-08T16:00:00Z'
  },
  {
    code: '15A04',
    tower: 'A',
    towerName: 'Tòa A (Sapphire)',
    floor: 15,
    type: '2PN',
    typeLabel: '2 Phòng Ngủ - 2WC',
    area: 78.5,
    wallArea: 83.2,
    bedrooms: 2,
    bathrooms: 2,
    direction: 'Chính Nam',
    mainDoorDirection: 'Chính Bắc',
    priceBillion: 5.10,
    status: 'VACANT',
    statusLabel: 'Căn Hộ Trống',
    membersCount: 0,
    vehicles: [],
    description: 'Căn tầng cao thoáng mát, view sông trực diện, không bị chắn tầm nhìn.',
    createdAt: '2026-02-15T09:00:00Z',
    updatedAt: '2026-09-02T10:00:00Z'
  },
  {
    code: '18A01',
    tower: 'A',
    towerName: 'Tòa A (Sapphire)',
    floor: 18,
    type: '3PN',
    typeLabel: '3 Phòng Ngủ - 3WC',
    area: 112.0,
    wallArea: 119.5,
    bedrooms: 3,
    bathrooms: 3,
    direction: 'Chính Nam',
    mainDoorDirection: 'Chính Bắc',
    priceBillion: 7.60,
    status: 'VACANT',
    statusLabel: 'Căn Hộ Trống',
    membersCount: 0,
    vehicles: [],
    description: 'Căn hộ 3PN cao cấp tầm view panorama ôm trọn skyline thành phố.',
    createdAt: '2026-02-01T09:00:00Z',
    updatedAt: '2026-08-28T10:00:00Z'
  },
  {
    code: '20A02',
    tower: 'A',
    towerName: 'Tòa A (Sapphire)',
    floor: 20,
    type: '3PN',
    typeLabel: '3 Phòng Ngủ - 3WC',
    area: 112.0,
    wallArea: 119.5,
    bedrooms: 3,
    bathrooms: 3,
    direction: 'Đông Nam',
    mainDoorDirection: 'Tây Bắc',
    priceBillion: 7.90,
    status: 'VACANT',
    statusLabel: 'Căn Hộ Trống',
    membersCount: 0,
    vehicles: [],
    description: 'Căn 3PN view sông đắt giá, cửa kính cách âm 3 lớp Low-E giảm nhiệt tối đa.',
    createdAt: '2026-03-20T10:00:00Z',
    updatedAt: '2026-08-25T11:00:00Z'
  },
  {
    code: '22A01',
    tower: 'A',
    towerName: 'Tòa A (Sapphire)',
    floor: 22,
    type: '3PN',
    typeLabel: '3 Phòng Ngủ - 3WC',
    area: 112.0,
    wallArea: 119.5,
    bedrooms: 3,
    bathrooms: 3,
    direction: 'Đông Nam',
    mainDoorDirection: 'Tây Bắc',
    priceBillion: 8.10,
    status: 'VACANT',
    statusLabel: 'Căn Hộ Trống',
    membersCount: 0,
    vehicles: [],
    description: 'Căn hộ Sky Suite tầng 22 đẳng cấp, thang máy riêng và sảnh đệm cao cấp.',
    createdAt: '2026-03-22T08:00:00Z',
    updatedAt: '2026-08-22T09:00:00Z'
  },
  {
    code: '25PH-01',
    tower: 'A',
    towerName: 'Tòa A (Sapphire)',
    floor: 25,
    type: 'DUPLEX_PENTHOUSE',
    typeLabel: 'Duplex Penthouse 5 Sao',
    area: 215.0,
    wallArea: 232.0,
    bedrooms: 4,
    bathrooms: 4,
    direction: 'Đông Nam',
    mainDoorDirection: 'Tây Bắc',
    priceBillion: 18.50,
    status: 'VACANT',
    statusLabel: 'Căn Hộ Trống',
    membersCount: 0,
    vehicles: [],
    description: 'Tuyệt tác Penthouse thông tầng tầng 25, hồ bơi riêng Sky Garden và thang máy độc bản.',
    createdAt: '2026-02-10T10:00:00Z',
    updatedAt: '2026-08-30T11:00:00Z'
  },

  // -------------------------------------------------------------
  // TÒA B - DIAMOND TOWER (32 TẦNG)
  // -------------------------------------------------------------
  {
    code: '04B01',
    tower: 'B',
    towerName: 'Tòa B (Diamond)',
    floor: 4,
    type: '2PN',
    typeLabel: '2 Phòng Ngủ - 2WC',
    area: 75.0,
    wallArea: 79.8,
    bedrooms: 2,
    bathrooms: 2,
    direction: 'Đông Nam',
    mainDoorDirection: 'Tây Bắc',
    priceBillion: 4.50,
    status: 'VACANT',
    statusLabel: 'Căn Hộ Trống',
    membersCount: 0,
    vehicles: [],
    description: 'Căn tầng 4 tiện di chuyển, kết nối thẳng tới cầu kính nội khu và hồ bơi.',
    createdAt: '2026-03-25T08:00:00Z',
    updatedAt: '2026-09-04T12:00:00Z'
  },
  {
    code: '08B12',
    tower: 'B',
    towerName: 'Tòa B (Diamond)',
    floor: 8,
    type: '1PN',
    typeLabel: '1 Phòng Ngủ - 1WC',
    area: 52.0,
    wallArea: 56.4,
    bedrooms: 1,
    bathrooms: 1,
    direction: 'Tây Nam',
    mainDoorDirection: 'Đông Bắc',
    priceBillion: 3.20,
    status: 'VACANT',
    statusLabel: 'Căn Hộ Trống',
    membersCount: 0,
    vehicles: [],
    description: 'Căn 1PN thông minh, bàn giao bếp từ Bosch và thiết bị vệ sinh Kohler.',
    createdAt: '2026-04-01T09:00:00Z',
    updatedAt: '2026-08-20T10:00:00Z'
  },
  {
    code: '11B06',
    tower: 'B',
    towerName: 'Tòa B (Diamond)',
    floor: 11,
    type: '2PN',
    typeLabel: '2 Phòng Ngủ - 2WC',
    area: 75.0,
    wallArea: 79.8,
    bedrooms: 2,
    bathrooms: 2,
    direction: 'Đông Nam',
    mainDoorDirection: 'Tây Bắc',
    priceBillion: 4.70,
    status: 'VACANT',
    statusLabel: 'Căn Hộ Trống',
    membersCount: 0,
    vehicles: [],
    description: 'Căn hộ gia đình ấm cúng, thiết kế thông minh view nhìn trọn vườn nhiệt đới.',
    createdAt: '2026-03-12T08:00:00Z',
    updatedAt: '2026-09-08T09:00:00Z'
  },
  {
    code: '16B08',
    tower: 'B',
    towerName: 'Tòa B (Diamond)',
    floor: 16,
    type: '3PN',
    typeLabel: '3 Phòng Ngủ - 3WC',
    area: 108.0,
    wallArea: 115.0,
    bedrooms: 3,
    bathrooms: 3,
    direction: 'Chính Nam',
    mainDoorDirection: 'Chính Bắc',
    priceBillion: 7.20,
    status: 'VACANT',
    statusLabel: 'Căn Hộ Trống',
    membersCount: 0,
    vehicles: [],
    description: 'Căn 3PN view hồ sinh thái và sân golf đẳng cấp quốc tế.',
    createdAt: '2026-04-05T10:00:00Z',
    updatedAt: '2026-08-15T11:00:00Z'
  },
  {
    code: '19B03',
    tower: 'B',
    towerName: 'Tòa B (Diamond)',
    floor: 19,
    type: '3PN',
    typeLabel: '3 Phòng Ngủ - 3WC',
    area: 108.0,
    wallArea: 115.0,
    bedrooms: 3,
    bathrooms: 3,
    direction: 'Đông Nam',
    mainDoorDirection: 'Tây Bắc',
    priceBillion: 7.45,
    status: 'VACANT',
    statusLabel: 'Căn Hộ Trống',
    membersCount: 0,
    vehicles: [],
    description: 'Căn 3PN sang trọng với tầm nhìn khoáng đạt về tháp Landmark.',
    createdAt: '2026-02-28T09:00:00Z',
    updatedAt: '2026-09-01T10:00:00Z'
  },
  {
    code: '25PH-02',
    tower: 'B',
    towerName: 'Tòa B (Diamond)',
    floor: 25,
    type: 'DUPLEX_PENTHOUSE',
    typeLabel: 'Duplex Penthouse 5 Sao',
    area: 215.0,
    wallArea: 232.0,
    bedrooms: 4,
    bathrooms: 4,
    direction: 'Đông Nam',
    mainDoorDirection: 'Tây Bắc',
    priceBillion: 18.20,
    status: 'VACANT',
    statusLabel: 'Căn Hộ Trống',
    membersCount: 0,
    vehicles: [],
    description: 'Penthouse đỉnh cao Tòa B với sân thượng riêng 45m2 ngắm trọn hoàng hôn.',
    createdAt: '2026-04-10T11:00:00Z',
    updatedAt: '2026-08-30T14:00:00Z'
  }
];

/**
 * Lấy danh sách toàn bộ căn hộ từ bộ nhớ hoặc dữ liệu mặc định
 */
export function getApartmentUnits(): ApartmentUnit[] {
  if (typeof window === 'undefined') {
    return INITIAL_APARTMENTS;
  }

  try {
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
 * Lấy thông tin 1 căn hộ theo mã căn (ví dụ: '12A05')
 */
export function getApartmentByCode(code: string): ApartmentUnit | undefined {
  const units = getApartmentUnits();
  return units.find((u) => u.code.toLowerCase() === code.toLowerCase().trim());
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
 * Bàn giao căn hộ & gán chủ hộ mới
 */
export function assignApartmentResident(code: string, owner: ApartmentResidentOwner): boolean {
  return updateApartmentUnit(code, {
    status: 'OCCUPIED',
    statusLabel: 'Đang Sinh Sống',
    owner,
    membersCount: Math.max(1, 1),
    handoverDate: owner.handoverDate || new Date().toLocaleDateString('vi-VN')
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
