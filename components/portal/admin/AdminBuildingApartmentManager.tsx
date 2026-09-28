'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  getApartmentUnits, 
  getApartmentByCode, 
  syncApartmentsFromNksApi, 
  ApartmentUnit, 
  ApartmentResidentOwner, 
  ApartmentType, 
  ApartmentStatus, 
  saveApartmentsList 
} from '@/lib/apartmentStore';
import { getUserStore, getApartmentMembers, ApartmentMember } from '@/lib/userStore';
import { 
  Map, 
  Layers, 
  Compass, 
  Maximize2, 
  Minimize2, 
  ZoomIn, 
  Eye, 
  ChevronRight, 
  ChevronLeft,
  Sparkles, 
  Building, 
  Building2,
  MapPin, 
  Check, 
  ExternalLink,
  Info,
  X,
  Navigation,
  TreePine,
  Waves,
  Dumbbell,
  FileText,
  RefreshCw,
  GraduationCap,
  ShoppingBag,
  Bus,
  HeartPulse
} from 'lucide-react';
import { fetchNksApartments } from '@/lib/nksProjectService';
import AssignResidentModal from '@/components/portal/admin/AssignResidentModal';
import EditApartmentModal from '@/components/portal/admin/EditApartmentModal';
import AddApartmentModal from '@/components/portal/admin/AddApartmentModal';
import ApartmentDetailModal from '@/components/portal/admin/ApartmentDetailModal';

export type OccupancyFilter = 'ALL' | 'OCCUPIED' | 'VACANT' | 'MAINTENANCE';
export type ApartmentTypeFilter = 'ALL' | '1PN' | '2PN' | '3PN' | 'DUPLEX_PENTHOUSE';
export type FloorRangeFilter = 'ALL' | 'LOW' | 'MID' | 'HIGH';
export type ViewPerspective = '3D' | 'BUILDING_ELEVATION' | 'FLOOR_PLAN' | 'GRID' | 'MASTER_PLAN';

export type BuildingColorTone = 'GOLD_LUXURY';

export interface TropicalAmenity {
  id: string;
  name: string;
  category: 'POOL' | 'PARK' | 'SPORT' | 'ACCESS';
  desc: string;
  x: number;
  y: number;
  distance: string;
}

// Danh sách 18 tiện ích quy hoạch phân khu The Tropical chuẩn từ sơ đồ chủ đầu tư (kèm tọa độ định vị trên bản đồ)
export const THE_TROPICAL_AMENITIES: TropicalAmenity[] = [
  { id: '01', name: 'Phố cọ Rodeo', category: 'PARK', desc: 'Tuyến phố thương mại shophouse & dạo bộ rợp bóng cọ nhiệt đới', x: 20, y: 34, distance: 'Liền kề BS-07 (20m)' },
  { id: '02', name: 'Bể bơi nhiệt đới Resort', category: 'POOL', desc: 'Cụm hồ bơi phong cách resort nhiệt đới trung tâm phân khu', x: 47, y: 46, distance: 'Cách BS-07: ~60m' },
  { id: '03', name: 'Bể bơi ốc đảo sinh thái', category: 'POOL', desc: 'Khu bơi lội thư giãn cảnh quan ốc đảo sinh thái trong lành', x: 55, y: 53, distance: 'Cách BS-07: ~85m' },
  { id: '04', name: 'Sân thể thao / Bể bơi Malibu', category: 'SPORT', desc: 'Cụm sân tennis, bóng rổ & bể bơi chuẩn thi đấu Olympic', x: 74, y: 36, distance: 'Cách BS-07: ~135m' },
  { id: '05', name: 'Nhà phụ trợ bể bơi', category: 'POOL', desc: 'Khu thay đồ, tắm tráng & quầy cứu hộ vận hành chuyên nghiệp', x: 51, y: 39, distance: 'Cách BS-07: ~75m' },
  { id: '06', name: 'Sân chơi trẻ em sắc màu', category: 'SPORT', desc: 'Khu vận động vui chơi liên hoàn an toàn cho cư dân nhí', x: 38, y: 63, distance: 'Cách BS-07: ~75m' },
  { id: '07', name: 'Sân Gym ngoài trời', category: 'SPORT', desc: 'Trang thiết bị máy tập thể lực đa năng ngoài trời hiện đại', x: 43, y: 32, distance: 'Cách BS-07: ~50m' },
  { id: '08', name: 'Sân thiền & Yoga', category: 'SPORT', desc: 'Không gian tĩnh lặng râm mát rèn luyện thể chất & tái tạo năng lượng', x: 62, y: 31, distance: 'Cách BS-07: ~110m' },
  { id: '09', name: 'Suối bậc cảnh quan sinh thái', category: 'PARK', desc: 'Thác nước bậc thang & dòng chảy sinh thái điều hòa nhiệt độ', x: 45, y: 57, distance: 'Cách BS-07: ~65m' },
  { id: '10', name: 'Vườn cọ nhiệt đới Honolulu', category: 'PARK', desc: 'Đại cảnh quan công viên cọ xanh ngát trung tâm The Tropical', x: 33, y: 50, distance: 'Cách BS-07: ~40m' },
  { id: '11', name: 'Vườn dạo California', category: 'PARK', desc: 'Khu vườn dạo bộ phong cách Bờ Tây nước Mỹ sang trọng', x: 25, y: 68, distance: 'Cách BS-07: ~60m' },
  { id: '12', name: 'Vườn San Mario', category: 'PARK', desc: 'Tiểu cảnh hoa cỏ & đường dạo dưỡng sinh cho người cao tuổi', x: 68, y: 66, distance: 'Cách BS-07: ~125m' },
  { id: '13', name: 'Biển tên phân khu The Tropical', category: 'ACCESS', desc: 'Cổng chào nhận diện thương hiệu The Tropical biểu tượng', x: 15, y: 43, distance: 'Trước sảnh BS-07 (30m)' },
  { id: '14', name: 'Chòi nghỉ thư giãn phong cách Resort', category: 'PARK', desc: 'Khu vực dừng chân ngắm cảnh râm mát bên hồ cảnh quan', x: 59, y: 44, distance: 'Cách BS-07: ~95m' },
  { id: '15', name: 'Giàn cảnh quan nghệ thuật', category: 'PARK', desc: 'Điểm nhấn kiến trúc biểu tượng chụp ảnh check-in sống ảo', x: 51, y: 70, distance: 'Cách BS-07: ~105m' },
  { id: '16', name: 'Ghế nghỉ Sunken chìm bên hồ', category: 'PARK', desc: 'Không gian phòng khách chìm thư thái độc bản giữa làn nước xanh', x: 44, y: 48, distance: 'Cách BS-07: ~55m' },
  { id: 'P', name: 'Bãi đỗ xe & Lối xuống hầm B1/B2', category: 'ACCESS', desc: 'Khu vực gửi xe & lối xuống hầm B1/B2 kiểm soát tự động thông minh', x: 80, y: 78, distance: 'Dưới hầm kết nối cả 4 chung cư' },
  { id: 'D', name: 'Sảnh đón Drop-off Chung Cư', category: 'ACCESS', desc: 'Lối xe đón trả cư dân tại sảnh chính chung cư có mái che', x: 28, y: 28, distance: 'Ngay mặt tiền sảnh BS-07' },
];

export interface SurroundingAmenity {
  id: string;
  name: string;
  category: 'EDUCATION' | 'SHOPPING' | 'PARK' | 'HEALTH' | 'TRANSIT' | 'MARINA';
  categoryLabel: string;
  desc: string;
  distance: string;
  walkTime: string;
  x: number;
  y: number;
}

// Danh sách các tiện ích xung quanh của dự án & khu dân cư
export const SURROUNDING_AMENITIES: SurroundingAmenity[] = [
  {
    id: 'SUR-01',
    name: 'Trường Liên Cấp Vinschool Grand Park',
    category: 'EDUCATION',
    categoryLabel: 'Giáo Dục Chuẩn Quốc Tế',
    desc: 'Hệ sinh thái giáo dục chuẩn Cambridge từ mầm non đến THPT, hệ thống xe buýt trường đón trả an toàn tại sảnh.',
    distance: '~180m',
    walkTime: '3 phút đi bộ',
    x: 28,
    y: 35
  },
  {
    id: 'SUR-02',
    name: 'Đại Siêu Thị TTTM Vincom Mega Mall Lớn Nhất Miền Nam',
    category: 'SHOPPING',
    categoryLabel: 'Mua Sắm & Giải Trí',
    desc: 'Trung tâm thương mại theo mô hình Life-Design Mall lớn nhất miền Nam với 5 tầng quy tụ hơn 140 thương hiệu.',
    distance: '~320m',
    walkTime: '5 phút đi bộ',
    x: 52,
    y: 22
  },
  {
    id: 'SUR-03',
    name: 'Đại Công Viên Ven Sông 36ha & Biển Hồ Cát Trắng',
    category: 'PARK',
    categoryLabel: 'Cảnh Quan Sinh Thái',
    desc: 'Kỳ quan công viên 36ha ven sông lớn nhất Đông Nam Á với bãi cát trắng tự nhiên, 15 công viên chủ đề liên hoàn.',
    distance: '~400m',
    walkTime: '6 phút đi bộ',
    x: 76,
    y: 42
  },
  {
    id: 'SUR-04',
    name: 'Bệnh Viện Đa Khoa Quốc Tế Vinmec Grand Park',
    category: 'HEALTH',
    categoryLabel: 'Y Tế Chất Lượng Cao',
    desc: 'Bệnh viện đa khoa quốc tế tiêu chuẩn JCI với đội ngũ chuyên gia đầu ngành túc trực cấp cứu 24/7.',
    distance: '~550m',
    walkTime: '2 phút xe điện',
    x: 32,
    y: 65
  },
  {
    id: 'SUR-05',
    name: 'Trạm Xe Buýt Điện Thông Minh VinBus',
    category: 'TRANSIT',
    categoryLabel: 'Giao Thông Xanh',
    desc: 'Hệ thống xe buýt điện thông minh kết nối xuyên suốt nội khu, tuyến D4 kết nối trực tiếp trung tâm Quận 1 & Bến Thành.',
    distance: '~50m',
    walkTime: '1 phút dạo bộ',
    x: 20,
    y: 45
  },
  {
    id: 'SUR-06',
    name: 'Bến Du Thuyền Thượng Lưu The Manhattan Glory',
    category: 'MARINA',
    categoryLabel: 'Bến Thuyền & Du Lịch',
    desc: 'Bến đỗ du thuyền sang trọng bên dòng sông Tắc và sông Đồng Nai lộng gió, điểm check-in hoàng hôn thơ mộng.',
    distance: '~750m',
    walkTime: '4 phút xe điện',
    x: 82,
    y: 72
  },
  {
    id: 'SUR-07',
    name: 'Quảng Trường Nghệ Thuật Biểu Tượng Golden Eagle',
    category: 'PARK',
    categoryLabel: 'Văn Hóa & Check-in',
    desc: 'Quảng trường nghệ thuật biểu tượng chim đại bàng khổng lồ với thác nước cảnh quan và đài phun nước trình diễn ánh sáng.',
    distance: '~260m',
    walkTime: '4 phút đi bộ',
    x: 42,
    y: 40
  },
  {
    id: 'SUR-08',
    name: 'Tháp Văn Phòng Thông Minh Cao Cấp 45 Tầng',
    category: 'TRANSIT',
    categoryLabel: 'Kinh Tế & Công Nghệ',
    desc: 'Biểu tượng kinh tế tài chính thế hệ mới với công nghệ IoT & FaceID, quy tụ các tập đoàn đa quốc gia.',
    distance: '~480m',
    walkTime: '6 phút đi bộ',
    x: 64,
    y: 20
  }
];

// Cấu hình đầy đủ 21 căn hộ/sàn theo bản vẽ CAD kiến trúc Chung Cư BS-09 & BS-07 (Phân khu The Tropical - The Beverly Solari)
export const CAD_FLOOR_UNITS_CONFIG = [
  // CÁNH 1: CÁNH BẮC (NORTH WING - Căn 01 đến 05)
  { num: '01', code: 'CH-01', wing: 'NORTH', wingLabel: 'Cánh Bắc', type: '2PN', typeLabel: '2PN Góc (Căn Phụ)', beds: 2, baths: 2, area: 68.4, dir: 'Đông Bắc', defaultPrice: 4.6 },
  { num: '02', code: 'CH-02', wing: 'NORTH', wingLabel: 'Cánh Bắc', type: '1PN', typeLabel: '1PN Tiêu Chuẩn', beds: 1, baths: 1, area: 38.2, dir: 'Đông Bắc', defaultPrice: 2.8 },
  { num: '03', code: 'CH-03', wing: 'NORTH', wingLabel: 'Cánh Bắc', type: '1PN', typeLabel: '1PN+ Đa Năng', beds: 1, baths: 1, area: 46.5, dir: 'Đông Bắc', defaultPrice: 3.2 },
  { num: '04', code: 'CH-04', wing: 'NORTH', wingLabel: 'Cánh Bắc', type: '2PN', typeLabel: '2PN Ban Công Kính', beds: 2, baths: 2, area: 59.1, dir: 'Đông Bắc', defaultPrice: 4.1 },
  { num: '05', code: 'CH-05', wing: 'NORTH', wingLabel: 'Cánh Bắc', type: '2PN', typeLabel: '2PN Góc Đẹp', beds: 2, baths: 2, area: 69.2, dir: 'Đông Bắc', defaultPrice: 4.8 },

  // CÁNH 2: CÁNH NAM (SOUTH WING - Căn 06 đến 10, nơi đặt CĂN CHỦ HỘ TẦNG 30)
  { num: '06', code: 'CH-06', wing: 'SOUTH', wingLabel: 'Cánh Nam', type: '1PN', typeLabel: '1PN View Hồ Bơi (Căn Chủ Hộ)', beds: 1, baths: 1, area: 42.0, dir: 'Đông Nam', defaultPrice: 3.4 },
  { num: '07', code: 'CH-07', wing: 'SOUTH', wingLabel: 'Cánh Nam', type: '2PN', typeLabel: '2PN Gia Đình', beds: 2, baths: 2, area: 59.0, dir: 'Đông Nam', defaultPrice: 4.1 },
  { num: '08', code: 'CH-08', wing: 'SOUTH', wingLabel: 'Cánh Nam', type: '1PN', typeLabel: '1PN+ Đa Năng', beds: 1, baths: 1, area: 46.5, dir: 'Đông Nam', defaultPrice: 3.25 },
  { num: '09', code: 'CH-09', wing: 'SOUTH', wingLabel: 'Cánh Nam', type: '2PN', typeLabel: '2PN Góc Thoáng', beds: 2, baths: 2, area: 69.5, dir: 'Đông Nam', defaultPrice: 4.9 },
  { num: '10', code: 'CH-10', wing: 'SOUTH', wingLabel: 'Cánh Nam', type: 'STUDIO', typeLabel: 'Studio Tiện Nghi', beds: 1, baths: 1, area: 35.0, dir: 'Đông Nam', defaultPrice: 2.45 },

  // CÁNH 3: CÁNH TÂY (WEST WING - Dãy căn 11 đến 21 đối xứng qua hành lang 1.8m)
  { num: '11', code: 'CH-11', wing: 'WEST', wingLabel: 'Cánh Tây', type: '2PN', typeLabel: '2PN Tây Bắc', beds: 2, baths: 2, area: 62.0, dir: 'Tây Bắc', defaultPrice: 4.2 },
  { num: '12', code: 'CH-12', wing: 'WEST', wingLabel: 'Cánh Tây', type: '1PN', typeLabel: '1PN Tiện Ích', beds: 1, baths: 1, area: 44.5, dir: 'Tây Bắc', defaultPrice: 3.1 },
  { num: '13', code: 'CH-13', wing: 'WEST', wingLabel: 'Cánh Tây', type: 'STUDIO', typeLabel: 'Studio Hiện Đại', beds: 1, baths: 1, area: 33.5, dir: 'Tây Bắc', defaultPrice: 2.3 },
  { num: '14', code: 'CH-14', wing: 'WEST', wingLabel: 'Cánh Tây', type: '2PN', typeLabel: '2PN Ban Công Rộng', beds: 2, baths: 2, area: 58.5, dir: 'Tây Bắc', defaultPrice: 4.0 },
  { num: '15', code: 'CH-15', wing: 'WEST', wingLabel: 'Cánh Tây', type: '2PN', typeLabel: '2PN Góc Tây', beds: 2, baths: 2, area: 67.0, dir: 'Tây Bắc', defaultPrice: 4.5 },
  { num: '16', code: 'CH-16', wing: 'WEST', wingLabel: 'Cánh Tây', type: '2PN', typeLabel: '2PN Tây Nam', beds: 2, baths: 2, area: 68.0, dir: 'Tây Nam', defaultPrice: 4.6 },
  { num: '17', code: 'CH-17', wing: 'WEST', wingLabel: 'Cánh Tây', type: '1PN', typeLabel: '1PN View Cây Xanh', beds: 1, baths: 1, area: 43.0, dir: 'Tây Nam', defaultPrice: 3.0 },
  { num: '18', code: 'CH-18', wing: 'WEST', wingLabel: 'Cánh Tây', type: '2PN', typeLabel: '2PN Tiêu Chuẩn', beds: 2, baths: 2, area: 61.5, dir: 'Tây Nam', defaultPrice: 4.15 },
  { num: '19', code: 'CH-19', wing: 'WEST', wingLabel: 'Cánh Tây', type: 'STUDIO', typeLabel: 'Studio Nhỏ Gọn', beds: 1, baths: 1, area: 34.0, dir: 'Tây Nam', defaultPrice: 2.4 },
  { num: '20', code: 'CH-20', wing: 'WEST', wingLabel: 'Cánh Tây', type: '1PN', typeLabel: '1PN Đón Gió', beds: 1, baths: 1, area: 45.0, dir: 'Tây Nam', defaultPrice: 3.15 },
  { num: '21', code: 'CH-21', wing: 'WEST', wingLabel: 'Cánh Tây', type: '2PN', typeLabel: '2PN Góc Nam', beds: 2, baths: 2, area: 70.0, dir: 'Tây Nam', defaultPrice: 4.95 },
];

// Danh sách các khối căn hộ kiến trúc hiển thị trên mô hình 3D (hỗ trợ tối đa 39 tầng phân khu The Tropical - Chung Cư BS-07, BS-08, BS-09, BS-10)
export const BUILDING_3D_UNITS: {
  code: string;
  floor: number;
  side: 'LEFT' | 'RIGHT';
  wing?: 'WEST' | 'SOUTH' | 'NORTH';
  type: ApartmentType;
  defaultStatus: ApartmentStatus;
  area: number;
  defaultName?: string;
}[] = (() => {
  const list: any[] = [];
  for (let fl = 39; fl >= 1; fl--) {
    // Khối Cánh Tây (Left Wing): Căn góc CH-11/15
    list.push({ code: `${fl}-CH-11`, floor: fl, side: 'LEFT', wing: 'WEST', type: '2PN', defaultStatus: 'VACANT', area: 62, defaultName: 'Căn Hộ Trống' });
    // Khối Cánh Nam (Right Wing): Nơi có Căn Chủ Hộ CH-06 tại Tầng 30
    list.push({ code: fl === 30 ? 'CH-06' : `${fl}-CH-06`, floor: fl, side: 'RIGHT', wing: 'SOUTH', type: '1PN', defaultStatus: fl === 30 ? 'OCCUPIED' : 'VACANT', area: 42, defaultName: fl === 30 ? 'Trần Hữu Lực (Chủ Hộ)' : 'Căn Hộ Trống' });
  }
  return list;
})();

// Helper tính toán chỉ số tiêu thụ hàng tháng & dòng tiền thu nhập căn hộ
export function getApartmentFinancialMetrics(unit: ApartmentUnit | null) {
  if (!unit) return null;
  const isOccupied = unit.status === 'OCCUPIED';
  const isMaintenance = unit.status === 'MAINTENANCE';
  const area = unit.area || 75;

  // 1. Phí quản lý chung cư tiêu chuẩn Skyline (18.000 đ/m²)
  const managementFee = Math.round(area * 18000);

  // 2. Phí phương tiện hầm gửi xe
  const vehicles = unit.vehicles || [];
  let parkingFee = 0;
  if (vehicles.length > 0) {
    vehicles.forEach(v => {
      if (v.type === 'CAR') parkingFee += 1200000;
      else if (v.type === 'MOTORBIKE') parkingFee += 120000;
      else parkingFee += 50000;
    });
  } else if (isOccupied) {
    const isOwnerTarget = unit.code === 'CH-06' || unit.code.endsWith('CH-06') || (unit.floor === 30 && (unit.code === 'CH-01' || unit.code.endsWith('CH-01')));
    parkingFee = isOwnerTarget ? 1320000 : 120000;
  }

  // 3. Tiêu thụ điện sinh hoạt
  let electricKwh = 0;
  let electricCost = 0;
  let waterM3 = 0;
  let waterCost = 0;

  if (isOccupied) {
    const isOwnerTarget = unit.code === 'CH-06' || unit.code.endsWith('CH-06') || (unit.floor === 30 && (unit.code === 'CH-01' || unit.code.endsWith('CH-01')));
    electricKwh = isOwnerTarget ? 285 : Math.round(180 + (area * 1.4));
    // Đơn giá điện lực bậc thang trung bình ~3.100 đ/kWh
    electricCost = Math.round(electricKwh * 3100);
    waterM3 = isOwnerTarget ? 18 : Math.max(12, Math.round(area * 0.22));
    waterCost = Math.round(waterM3 * 18000);
  } else if (isMaintenance) {
    electricKwh = 35;
    electricCost = Math.round(electricKwh * 3100);
    waterM3 = 2;
    waterCost = Math.round(waterM3 * 18000);
  } else {
    // Căn hộ trống duy trì cảm biến & hệ thống chiếu sáng bảo dưỡng
    electricKwh = 8;
    electricCost = Math.round(electricKwh * 3100);
    waterM3 = 0;
    waterCost = 0;
  }

  // Tổng doanh thu BQL thu về từ căn hộ
  const totalBqlRevenue = managementFee + parkingFee + (isOccupied ? (electricCost + waterCost) : 0);

  // Giá trị khai thác cho thuê tham chiếu thị trường (Rental Benchmark)
  let estimatedRentalPrice = 19500000;
  if (unit.type === '1PN') estimatedRentalPrice = 13500000;
  else if (unit.type === '2PN') estimatedRentalPrice = 19500000;
  else if (unit.type === '3PN') estimatedRentalPrice = 28000000;
  else if (unit.type === 'DUPLEX_PENTHOUSE') estimatedRentalPrice = 65000000;

  // Tỷ suất sinh lời cho thuê (%/năm)
  const propertyValue = (unit.priceBillion || 4.5) * 1000000000;
  const rentalYield = ((estimatedRentalPrice * 12) / propertyValue * 100).toFixed(1);

  return {
    isOccupied,
    isMaintenance,
    area,
    managementFee,
    parkingFee,
    electricKwh,
    electricCost,
    waterM3,
    waterCost,
    totalBqlRevenue,
    estimatedRentalPrice,
    rentalYield,
    paymentStatus: isOccupied ? (unit.billing?.status || 'PAID') : 'PAID_BY_DEVELOPER',
    meterElectricId: `EM-${unit.code}-IoT`,
    meterWaterId: `WM-${unit.code}-SKY`,
    lastSync: '12/09/2026 00:30'
  };
}

export default function AdminBuildingApartmentManager() {
  // 1. Quản lý danh sách căn hộ thực tế từ apartmentStore & NKS API
  const [apartments, setApartments] = useState<ApartmentUnit[]>([]);
  const [selectedAptCode, setSelectedAptCode] = useState<string>('CH-06');
  const [selectedBlock, setSelectedBlock] = useState<'BS-07' | 'BS-08' | 'BS-09' | 'BS-10'>('BS-07');
  const buildingColorTone: BuildingColorTone = 'GOLD_LUXURY';

  const [selectedOccupancy, setSelectedOccupancy] = useState<OccupancyFilter>('ALL');
  const [selectedType, setSelectedType] = useState<ApartmentTypeFilter>('ALL');
  const [selectedFloorRange, setSelectedFloorRange] = useState<FloorRangeFilter>('ALL');
  const [isOnlyOwnerUnits, setIsOnlyOwnerUnits] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [buildingPerspective, setBuildingPerspective] = useState<ViewPerspective>('FLOOR_PLAN');
  const [detailTab, setDetailTab] = useState<'OVERVIEW' | 'FINANCIAL' | 'TECHNICAL'>('OVERVIEW');

  // Điều khiển Floor Plan View (Mặt Bằng Tầng & Chế độ Mở Rộng) - Mặc định tầng 30 của chủ hộ
  const [selectedFloor, setSelectedFloor] = useState<number>(30);
  const [hoveredUnitCode, setHoveredUnitCode] = useState<string | null>(null);
  const [hoveredFloor, setHoveredFloor] = useState<number | null>(null);
  const [buildingTheme, setBuildingTheme] = useState<'NIGHT' | 'DAY'>('NIGHT');
  const [isFloorPlanExpanded, setIsFloorPlanExpanded] = useState<boolean>(false);
  const [floorFilterStatus, setFloorFilterStatus] = useState<'ALL' | 'OCCUPIED' | 'VACANT'>('ALL');
  const [floorPlanViewMode, setFloorPlanViewMode] = useState<'CAD_VECTOR' | 'BLUEPRINT_IMAGE'>('CAD_VECTOR');
  const [floorPlanFilterWing, setFloorPlanFilterWing] = useState<'ALL' | 'NORTH' | 'SOUTH' | 'WEST'>('ALL');
  const [floorPlanCadZoom, setFloorPlanCadZoom] = useState<number>(1);
  const [billToastMessage, setBillToastMessage] = useState<string | null>(null);

  // Điều khiển chế độ xem Bản đồ Quy hoạch Phân khu & Đô thị
  const [masterPlanTab, setMasterPlanTab] = useState<'TROPICAL' | 'SURROUNDINGS' | 'CAD_FLOOR' | 'MACRO'>('TROPICAL');
  const [isMasterPlanZoomed, setIsMasterPlanZoomed] = useState<boolean>(false);
  const [modalZoomScale, setModalZoomScale] = useState<number>(1);
  const [selectedAmenityCategory, setSelectedAmenityCategory] = useState<'ALL' | 'POOL' | 'PARK' | 'SPORT' | 'ACCESS'>('ALL');
  const [selectedAmenityId, setSelectedAmenityId] = useState<string | null>(null);
  const [hoveredAmenityId, setHoveredAmenityId] = useState<string | null>(null);
  const [amenityScope, setAmenityScope] = useState<'ALL' | 'INTERNAL' | 'SURROUNDINGS'>('ALL');

  // Modals state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // 2. Dữ liệu thực tế cho cư dân căn hộ CH-06 từ API & userStore
  const initialOwner = getUserStore('user-owner-1');
  const initialMembers = getApartmentMembers('CH-06');
  const [liveOwner, setLiveOwner] = useState<any>(null);
  const [liveMembers, setLiveMembers] = useState<ApartmentMember[]>(initialMembers);

  // Hàm tải danh sách căn hộ từ kho theo block
  const reloadApartments = (bCode: string = selectedBlock) => {
    const list = getApartmentUnits(bCode);
    setApartments(list);
  };

  // 3. Trạng thái và hàm đồng bộ dữ liệu Realtime 100% từ NKS SCRMAI API
  const [isSyncingApi, setIsSyncingApi] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>('Vừa cập nhật');
  const [apiLiveApartments, setApiLiveApartments] = useState<any[]>([]);

  // Tải và đồng bộ danh sách căn hộ trực tiếp từ API NKS SCRMAI
  const syncLiveApartmentsFromApi = useCallback(async (bCode: string = selectedBlock) => {
    setIsSyncingApi(true);
    try {
      const units = await syncApartmentsFromNksApi(bCode);
      if (Array.isArray(units) && units.length > 0) {
        setApartments(units);
      }
      const rawApi = await fetchNksApartments();
      if (Array.isArray(rawApi)) {
        setApiLiveApartments(rawApi);
      }
      setLastSyncedTime(new Date().toLocaleTimeString('vi-VN'));
    } catch (err) {
      console.warn('API sync error:', err);
    } finally {
      setIsSyncingApi(false);
    }
  }, [selectedBlock]);

  // Tự động kích hoạt đồng bộ API khi khởi chạy hoặc chuyển chung cư
  useEffect(() => {
    syncLiveApartmentsFromApi(selectedBlock);
  }, [selectedBlock, syncLiveApartmentsFromApi]);

  // Chuyển đổi giữa 4 Chung Cư
  const handleSwitchBlock = async (blockCode: 'BS-07' | 'BS-08' | 'BS-09' | 'BS-10') => {
    setSelectedBlock(blockCode);
    const maxFloors = blockCode === 'BS-08' ? 39 : 34;
    
    // Load local block units immediately for instant UI responsiveness
    const localUnits = getApartmentUnits(blockCode);
    setApartments(localUnits);

    // Khi chuyển chung cư: Nếu về BS-07 thì chọn căn chủ hộ tầng 30, nếu sang chung cư khác thì chọn căn của chung cư đó
    if (blockCode === 'BS-07') {
      setSelectedFloor(30);
      setSelectedAptCode('CH-06');
    } else {
      const nextFloor = selectedFloor > maxFloors ? 1 : selectedFloor;
      setSelectedFloor(nextFloor);
      const targetUnit = localUnits.find(u => u.floor === nextFloor) || localUnits[0];
      if (targetUnit) {
        setSelectedAptCode(targetUnit.code);
      }
    }

    try {
      const units = await syncApartmentsFromNksApi(blockCode);
      setApartments(units);
    } catch (e) {
      console.warn('Switch block error:', e);
    }
  };

  // Lắng nghe thay đổi từ storage
  useEffect(() => {
    reloadApartments(selectedBlock);

    const handleUpdate = (e: any) => {
      if (e?.detail?.blockCode && e.detail.blockCode !== selectedBlock) {
        return;
      }
      reloadApartments(selectedBlock);
    };

    window.addEventListener('skyline_apartments_updated', handleUpdate);
    return () => {
      window.removeEventListener('skyline_apartments_updated', handleUpdate);
    };
  }, [selectedBlock]);

  // Đồng bộ thông tin thực tế của chủ hộ CH-06 từ API NKS
  useEffect(() => {
    let isMounted = true;
    async function syncRealResident() {
      try {
        const famRes = await fetch('/api/user/family?aptCode=CH-06');
        if (famRes.ok) {
          const famData = await famRes.json();
          if (famData.success && Array.isArray(famData.members) && famData.members.length > 0) {
            if (isMounted) setLiveMembers(famData.members);
          }
        }

        const userRes = await fetch('/api/user');
        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData.user && isMounted) {
            if (userData.user.role === 'OWNER' && (userData.user.apartment_code === 'CH-06' || userData.user.apartment_code === '12A05' || !userData.user.role?.includes('ADMIN'))) {
              setLiveOwner(userData.user);
            }
          }
        }
      } catch (err) {
        console.warn('API sync warning:', err);
      }
    }
    syncRealResident();
    return () => { isMounted = false; };
  }, []);

  // Thông tin chủ hộ CH-06 chuẩn thực tế
  const isActualResident = 
    liveOwner && 
    liveOwner.role === 'OWNER' && 
    (liveOwner.apartment_code === 'CH-06' || liveOwner.apartment_code === '12A05') &&
    !liveOwner.email?.includes('manager') &&
    !liveOwner.full_name?.includes('Quản Trị');

  const ownerData = isActualResident ? liveOwner : initialOwner;

  const activeOwnerName = isActualResident 
    ? (liveOwner.full_name || liveOwner.fullname || 'Trần Hữu Lực')
    : (initialOwner?.full_name || 'Trần Hữu Lực');

  const activeOwnerPhone = isActualResident 
    ? (liveOwner.phone || '0364967082') 
    : (initialOwner?.phone || '0364967082');

  const activeOwnerEmail = isActualResident 
    ? (liveOwner.email || 'huuluc04@gmail.com') 
    : (initialOwner?.email || 'huuluc04@gmail.com');

  const activeOwnerCccd = isActualResident 
    ? (liveOwner.cccd || liveOwner.idCard || liveOwner.id_card_no || '067204000961') 
    : ((initialOwner as any)?.cccd || initialOwner?.id_card_no || '067204000961');

  const activeOwnerAvatar = isActualResident 
    ? (liveOwner.avatar_url || liveOwner.avatar || 'https://data.nks.vn/storage/users/202609021654232258.jpg') 
    : (initialOwner?.avatar_url || 'https://data.nks.vn/storage/users/202609021654232258.jpg');

  const activeOwnerDob = isActualResident 
    ? (liveOwner.dob || liveOwner.birthday || '18/08/2004') 
    : (initialOwner?.dob || '18/08/2004');

  const activeOwnerPob = isActualResident 
    ? (liveOwner.pob || liveOwner.address || 'Triệu Trạch, Triệu Phong, Quảng Trị') 
    : (initialOwner?.pob || (initialOwner as any)?.address || 'Triệu Trạch, Triệu Phong, Quảng Trị');

  const currentBlockConfig = useMemo(() => {
    switch (selectedBlock) {
      case 'BS-08':
        return { name: 'Chung Cư BS-08', floors: 39, badge: 'Chung Cư Điểm Nhấn (39 Tầng)' };
      case 'BS-09':
        return { name: 'Chung Cư BS-09', floors: 34, badge: 'Chung Cư View Công Viên (34 Tầng)' };
      case 'BS-10':
        return { name: 'Chung Cư BS-10', floors: 34, badge: 'Chung Cư View Quảng Trường (34 Tầng)' };
      default:
        return { name: 'Chung Cư BS-07', floors: 34, badge: 'Chung Cư Cư Dân Chính (34 Tầng)' };
    }
  }, [selectedBlock]);

  const currentBlockName = currentBlockConfig.name;
  const currentTotalFloors = currentBlockConfig.floors;
  // Chủ hộ Trần Hữu Lực chỉ sở hữu 2 căn hộ (CH-06 và CH-01 Tầng 30) tại duy nhất Chung Cư BS-07
  const isOwnerBuilding = selectedBlock === 'BS-07';

  // Danh sách căn hộ hiển thị với dữ liệu người thật của chung cư đang chọn
  const displayUnits = useMemo(() => {
    return apartments.map(u => {
      const isOwnerPrimary = isOwnerBuilding && (u.code === 'CH-06' || (u.floor === 30 && u.code.includes('CH-06')) || u.code === '12A05');
      const isOwnerSecondary = isOwnerBuilding && (u.floor === 30 && (u.code === 'CH-01' || u.code.includes('CH-01')));

      if (isOwnerPrimary) {
        return {
          ...u,
          towerName: currentBlockName,
          status: 'OCCUPIED' as ApartmentStatus,
          statusLabel: 'Đã Bàn Giao (Căn Hộ Chính Chủ)',
          owner: {
            ...u.owner,
            name: activeOwnerName,
            phone: activeOwnerPhone,
            email: activeOwnerEmail,
            cccd: activeOwnerCccd,
            avatar: activeOwnerAvatar,
            dob: activeOwnerDob,
            pob: activeOwnerPob,
            eKycApproved: true
          },
          members: liveMembers,
          membersCount: liveMembers.length
        };
      }

      if (isOwnerSecondary) {
        return {
          ...u,
          towerName: currentBlockName,
          status: 'OCCUPIED' as ApartmentStatus,
          statusLabel: 'Đã Bàn Giao (Căn Phụ Cùng Chủ Hộ)',
          owner: {
            ...u.owner,
            name: activeOwnerName,
            phone: activeOwnerPhone,
            email: activeOwnerEmail,
            cccd: activeOwnerCccd,
            avatar: activeOwnerAvatar,
            dob: activeOwnerDob,
            pob: activeOwnerPob,
            eKycApproved: true
          }
        };
      }

      return {
        ...u,
        towerName: currentBlockName
      };
    });
  }, [apartments, activeOwnerName, activeOwnerPhone, activeOwnerEmail, activeOwnerCccd, activeOwnerAvatar, activeOwnerDob, activeOwnerPob, liveMembers, currentBlockName, isOwnerBuilding]);

  // Bộ lọc căn hộ đa tiêu chí & tìm kiếm thông minh
  const filteredUnits = useMemo(() => {
    return displayUnits.filter(unit => {
      // 1. Lọc theo chủ hộ chính (Trần Hữu Lực) - Chỉ có tại Chung Cư BS-07
      if (isOnlyOwnerUnits) {
        if (!isOwnerBuilding) return false;
        const isOwner = unit.owner?.phone === activeOwnerPhone || 
          unit.owner?.name?.toLowerCase().includes('lực') ||
          unit.code === 'CH-06' || 
          (unit.floor === 30 && (unit.code === 'CH-01' || unit.code.includes('CH-01') || unit.code === 'CH-06' || unit.code.includes('CH-06')));
        if (!isOwner) return false;
      }

      const matchOccupancy = selectedOccupancy === 'ALL'
        ? true
        : selectedOccupancy === 'OCCUPIED'
        ? unit.status === 'OCCUPIED'
        : selectedOccupancy === 'VACANT'
        ? unit.status === 'VACANT'
        : unit.status === 'MAINTENANCE';

      const matchType = selectedType === 'ALL'
        ? true
        : selectedType === '1PN'
        ? (unit.type === '1PN' || unit.typeLabel.includes('1PN'))
        : selectedType === '2PN'
        ? (unit.type === '2PN' || unit.typeLabel.includes('2PN'))
        : selectedType === '3PN'
        ? (unit.type === '3PN' || unit.typeLabel.includes('3PN'))
        : (unit.type === 'DUPLEX_PENTHOUSE' || unit.typeLabel.toLowerCase().includes('duplex') || unit.typeLabel.toLowerCase().includes('penthouse'));

      const matchFloorRange = selectedFloorRange === 'ALL'
        ? true
        : selectedFloorRange === 'LOW'
        ? (unit.floor >= 1 && unit.floor <= 10)
        : selectedFloorRange === 'MID'
        ? (unit.floor >= 11 && unit.floor <= 20)
        : (unit.floor >= 21);

      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchOccupancy && matchType && matchFloorRange;

      // Hỗ trợ tìm: mã căn, tên chủ hộ, sđt, cccd, email, loại căn, hướng, số tầng ("tầng 12", "tang 12", "12")
      const matchSearch = 
        unit.code.toLowerCase().includes(q) ||
        (unit.owner?.name && unit.owner.name.toLowerCase().includes(q)) ||
        (unit.owner?.phone && unit.owner.phone.includes(q)) ||
        (unit.owner?.cccd && unit.owner.cccd.includes(q)) ||
        (unit.owner?.email && unit.owner.email.toLowerCase().includes(q)) ||
        unit.typeLabel.toLowerCase().includes(q) ||
        (unit.direction && unit.direction.toLowerCase().includes(q)) ||
        `tầng ${unit.floor}`.toLowerCase().includes(q) ||
        `tang ${unit.floor}`.toLowerCase().includes(q) ||
        (q.startsWith('tầng ') && unit.floor === parseInt(q.replace('tầng ', ''))) ||
        (q.startsWith('tang ') && unit.floor === parseInt(q.replace('tang ', '')));

      return matchOccupancy && matchType && matchFloorRange && matchSearch;
    });
  }, [displayUnits, selectedOccupancy, selectedType, selectedFloorRange, searchQuery, isOnlyOwnerUnits, activeOwnerPhone]);

  // Danh sách gợi ý tìm kiếm tức thì
  const instantSearchMatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return displayUnits.filter(u => {
      return (
        u.code.toLowerCase().includes(q) ||
        (u.owner?.name && u.owner.name.toLowerCase().includes(q)) ||
        (u.owner?.phone && u.owner.phone.includes(q)) ||
        (u.owner?.cccd && u.owner.cccd.includes(q)) ||
        (u.owner?.email && u.owner.email.toLowerCase().includes(q)) ||
        u.typeLabel.toLowerCase().includes(q) ||
        (u.direction && u.direction.toLowerCase().includes(q))
      );
    }).slice(0, 6);
  }, [displayUnits, searchQuery]);

  const handleSelectSearchResult = (unit: ApartmentUnit) => {
    setSelectedAptCode(unit.code);
    setSelectedFloor(unit.floor);
    setIsSearchFocused(false);
  };

  const isAnyFilterActive = 
    selectedOccupancy !== 'ALL' || 
    selectedType !== 'ALL' || 
    selectedFloorRange !== 'ALL' || 
    isOnlyOwnerUnits ||
    searchQuery.trim() !== '';

  const resetAllFilters = () => {
    setSelectedOccupancy('ALL');
    setSelectedType('ALL');
    setSelectedFloorRange('ALL');
    setIsOnlyOwnerUnits(false);
    setSearchQuery('');
  };

  // Bộ tra cứu O(1) phục vụ lọc thống nhất trên toàn bộ hệ thống (3D, Mặt Đứng, Mặt Bằng, Lưới)
  const matchingUnitCodesSet = useMemo(() => {
    return new Set(filteredUnits.map(u => u.code.toUpperCase()));
  }, [filteredUnits]);

  const matchingFloorsSet = useMemo(() => {
    return new Set(filteredUnits.map(u => u.floor));
  }, [filteredUnits]);

  // Hàm kiểm tra thống nhất căn hộ có khớp bộ lọc hay không trên toàn bộ giao diện
  const isUnitMatchingFilter = useCallback((unitCode: string, floor?: number) => {
    if (!isAnyFilterActive) return true;
    const clean = unitCode.toUpperCase();
    if (matchingUnitCodesSet.has(clean)) return true;
    return filteredUnits.some(f => 
      f.code.toUpperCase() === clean || 
      f.code.toUpperCase().endsWith(`-${clean}`) || 
      clean.endsWith(`-${f.code.toUpperCase()}`) ||
      (floor !== undefined && f.floor === floor && (clean.includes(f.code.toUpperCase()) || f.code.toUpperCase().includes(clean)))
    );
  }, [isAnyFilterActive, matchingUnitCodesSet, filteredUnits]);

  // Căn hộ đang được chọn làm tiêu điểm hồ sơ (ưu tiên căn chủ hộ tầng 30 khi ở Chung Cư BS-07)
  const activeUnit = useMemo(() => {
    return (
      displayUnits.find(u => u.code === selectedAptCode && u.floor === selectedFloor) ||
      displayUnits.find(u => u.code === selectedAptCode) ||
      (isOwnerBuilding ? displayUnits.find(u => u.floor === selectedFloor && (u.code === 'CH-06' || u.code.endsWith('CH-06'))) : null) ||
      displayUnits.find(u => u.floor === selectedFloor) ||
      displayUnits[0] ||
      null
    );
  }, [displayUnits, selectedAptCode, selectedFloor, isOwnerBuilding]);

  // Cấu hình Tone màu sang trọng mặc định (Hoàng Gia Gold) cho phối cảnh BIM 3D
  const toneConfig = useMemo(() => ({
    GOLD_LUXURY: {
      id: 'GOLD_LUXURY' as BuildingColorTone,
      label: 'Hoàng Gia Gold',
      containerBg: buildingTheme === 'NIGHT' ? 'bg-[#040711]' : 'bg-[#091122]',
      gridLineColor: buildingTheme === 'NIGHT' ? '#1E293B' : '#C5A880',
      glassL: buildingTheme === 'NIGHT' ? ['#172033', '#0F1626', '#060A13'] : ['#22324F', '#152136', '#0B1322'],
      glassR: buildingTheme === 'NIGHT' ? ['#2D3D5A', '#1C293E', '#0B1320'] : ['#3A5074', '#25354F', '#111D30'],
      borderBuilding: '#C5A880',
      roofColor: '#172033',
      crownColor: '#D4AF37',
      titleColor: '#E6CA9E',
      laserBeamColor: '#C5A880',
      podiumGrad: ['#1A253A', '#0F1726', '#070C15'],
      accentTag: 'bg-[#C5A880] text-black',
      mullionColor: '#C5A880',
    },
  }), [buildingTheme]);

  // Thống kê toàn chung cư
  const totalUnitsCount = displayUnits.length;
  const occupiedCount = displayUnits.filter(u => u.status === 'OCCUPIED').length;
  const vacantCount = displayUnits.filter(u => u.status === 'VACANT').length;
  const maintenanceCount = displayUnits.filter(u => u.status === 'MAINTENANCE').length;
  const occupancyRate = totalUnitsCount > 0 ? Math.round((occupiedCount / totalUnitsCount) * 100) : 0;

  // Danh sách các tầng thực tế của chung cư (sắp xếp giảm dần từ tầng cao nhất xuống)
  const buildingFloors = useMemo(() => {
    const floors = Array.from(new Set(displayUnits.map(u => u.floor)));
    return floors.sort((a, b) => b - a);
  }, [displayUnits]);

  // Danh sách các căn hộ thuộc tầng đang chọn trong Floor Plan View
  const floorUnits = useMemo(() => {
    return displayUnits.filter(u => u.floor === selectedFloor);
  }, [displayUnits, selectedFloor]);

  return (
    <div className="space-y-6 animate-fadeIn select-none">
      {/* ============================================================= */}
      {/* 1. TIÊU ĐỀ HỆ THỐNG QUẢN LÝ CĂN HỘ BQL                        */}
      {/* ============================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222B35] pb-4">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-[#C5A880] font-semibold font-mono">
            CHUNG CƯ THE TROPICAL • BEVERLY SOLARI
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl text-white font-bold mt-0.5">
            Sơ Đồ Tầng & Căn Hộ
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Trung tâm giám sát mặt bằng trực quan & quản lý kỹ thuật vận hành theo thời gian thực.
          </p>
        </div>

        {/* Nút hành động BQL */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider rounded-none transition-all shadow-lg active:scale-95"
          >
            Thêm Căn Hộ Mới
          </button>
        </div>
      </div>

      {/* ============================================================= */}
      {/* TRUNG TÂM ĐIỀU HÀNH: PHÂN CẤP DỰ ÁN > CHUNG CƯ > TẦNG > CĂN HỘ */}
      {/* ============================================================= */}
      <div className="bg-[#0B121D] border border-[#22344B] p-3 space-y-2.5 shadow-lg">
        {/* HÀNG 1: BREADCRUMB PHÂN CẤP TRỰC QUAN */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-[#1A283B]">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap text-xs">
            {/* 1. DỰ ÁN */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#121B27] border border-[#1E2D42] text-gray-200">
              <Building2 className="w-3.5 h-3.5 text-[#C5A880]" />
              <span className="text-gray-400 font-mono text-[10.5px]">DỰ ÁN:</span>
              <span className="font-bold text-white">Skyline Smart Residence</span>
              <button
                type="button"
                onClick={() => setBuildingPerspective('MASTER_PLAN')}
                className="text-[10px] px-1.5 py-0.2 bg-[#1B293C] hover:bg-[#C5A880] text-[#C5A880] hover:text-black font-mono border border-[#263C58] transition-colors ml-0.5"
                title="Xem bản đồ nội khu & tiện ích xung quanh"
              >
                The Tropical ↗
              </button>
            </div>

            <ChevronRight className="w-3.5 h-3.5 text-gray-500 shrink-0" />

            {/* 2. CHUNG CƯ */}
            <div className="flex items-center gap-1">
              <span className="text-gray-400 font-mono text-[10.5px] mr-0.5 hidden sm:inline">CHUNG CƯ:</span>
              {[
                { code: 'BS-07', name: 'BS-07', floors: 34 },
                { code: 'BS-08', name: 'BS-08', floors: 39 },
                { code: 'BS-09', name: 'BS-09', floors: 34 },
                { code: 'BS-10', name: 'BS-10', floors: 34 },
              ].map(b => {
                const isCurrent = selectedBlock === b.code;
                return (
                  <button
                    key={b.code}
                    type="button"
                    onClick={() => handleSwitchBlock(b.code as any)}
                    className={`px-2 py-1 text-xs font-mono transition-all flex items-center gap-1 border ${
                      isCurrent
                        ? 'bg-[#C5A880] text-black border-[#C5A880] font-bold shadow'
                        : 'bg-[#121B27] text-gray-300 border-[#1E2D42] hover:border-[#385175] hover:text-white'
                    }`}
                  >
                    <span>{b.name}</span>
                    <span className={`text-[9.5px] px-1 ${isCurrent ? 'bg-black/20 text-black font-bold' : 'bg-[#152132] text-cyan-300'}`}>
                      {b.floors}T
                    </span>
                  </button>
                );
              })}
            </div>

            <ChevronRight className="w-3.5 h-3.5 text-gray-500 shrink-0" />

            {/* 3. TẦNG */}
            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-[#121B27] border border-[#1E2D42]">
              <span className="text-gray-400 font-mono text-[10.5px]">TẦNG:</span>
              <button
                type="button"
                onClick={() => setSelectedFloor(prev => Math.max(1, prev - 1))}
                disabled={selectedFloor <= 1}
                className="w-5 h-5 flex items-center justify-center bg-[#1A2536] hover:bg-[#25354D] text-gray-300 hover:text-white disabled:opacity-30 border border-[#2C3E56]"
                title="Tầng dưới"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <select
                value={selectedFloor}
                onChange={(e) => setSelectedFloor(Number(e.target.value))}
                className="bg-[#182333] border border-[#2D3E56] text-white font-mono font-bold text-xs px-1.5 py-0.5 outline-none focus:border-[#C5A880]"
              >
                {buildingFloors.map(f => (
                  <option key={f} value={f}>
                    Tầng {f} {f === 30 ? '⭐ (Căn Chủ Hộ)' : ''}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setSelectedFloor(prev => Math.min(currentTotalFloors, prev + 1))}
                disabled={selectedFloor >= currentTotalFloors}
                className="w-5 h-5 flex items-center justify-center bg-[#1A2536] hover:bg-[#25354D] text-gray-300 hover:text-white disabled:opacity-30 border border-[#2C3E56]"
                title="Tầng trên"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <ChevronRight className="w-3.5 h-3.5 text-gray-500 shrink-0" />

            {/* 4. CĂN HỘ */}
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#121B27] border border-[#1E2D42]">
              <span className="text-gray-400 font-mono text-[10.5px]">CĂN:</span>
              <strong className="text-[#C5A880] font-mono font-bold">{selectedAptCode}</strong>
              {activeUnit && (
                <span className={`text-[9.5px] px-1 font-mono font-bold ${
                  activeUnit.status === 'OCCUPIED' ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  ({activeUnit.status === 'OCCUPIED' ? 'Đã Ở' : 'Trống'})
                </span>
              )}
            </div>
          </div>

          {/* Phía phải: 4 chỉ số thống kê & Nút Làm Mới */}
          <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
            <div className="px-2 py-1 bg-[#121820] border border-[#222B35] flex items-center gap-1.5" title="Tổng số căn hộ">
              <span className="text-gray-400">Tổng: </span>
              <strong className="text-white font-bold">{totalUnitsCount}</strong>
            </div>
            <div className="px-2 py-1 bg-[#121820] border border-emerald-500/40 flex items-center gap-1.5" title="Căn hộ đã bàn giao">
              <span className="text-gray-400">Đã Ở: </span>
              <strong className="text-emerald-300 font-bold">{occupiedCount} ({occupancyRate}%)</strong>
            </div>
            <div className="px-2 py-1 bg-[#121820] border border-amber-500/40 flex items-center gap-1.5" title="Căn hộ trống">
              <span className="text-gray-400">Trống: </span>
              <strong className="text-amber-300 font-bold">{vacantCount}</strong>
            </div>

            {/* Nút Làm Mới Dữ Liệu */}
            <button
              type="button"
              onClick={() => syncLiveApartmentsFromApi(selectedBlock)}
              disabled={isSyncingApi}
              className="px-2.5 py-1 bg-[#121820] hover:bg-[#1a232e] text-gray-300 hover:text-white border border-[#222B35] flex items-center gap-1.5 transition-colors disabled:opacity-50 text-xs font-mono"
              title="Làm mới dữ liệu từ hệ thống"
            >
              <RefreshCw className={`w-3 h-3 text-[#C5A880] ${isSyncingApi ? 'animate-spin' : ''}`} />
              <span>{isSyncingApi ? 'Đang tải...' : 'Làm mới'}</span>
            </button>
          </div>
        </div>

        {/* HÀNG 2: BỘ LỌC TÌM KIẾM CĂN HỘ TẬP TRUNG */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs">
          {/* Nhóm trái: Ô tìm kiếm thông minh */}
          <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-sm">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 250)}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm căn (CH-06), tầng (T30), cư dân (Lực)..."
                className="w-full bg-[#161B22] border border-[#2D3748] px-2.5 py-1 text-white text-xs placeholder:text-gray-500 outline-none focus:border-[#C5A880] transition-colors font-mono"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white font-mono text-xs"
                  title="Xóa tìm kiếm"
                >
                  ✕
                </button>
              )}

              {/* Instant Search Matches Dropdown */}
              {isSearchFocused && searchQuery.trim() !== '' && (
                <div className="absolute top-full left-0 mt-1.5 w-84 bg-[#0F141C] border border-[#C5A880]/50 shadow-2xl z-50 divide-y divide-[#1F2937] max-h-64 overflow-y-auto">
                  <div className="px-3 py-1 bg-[#161F2C] text-[10px] font-mono text-[#C5A880] uppercase tracking-wider flex items-center justify-between">
                    <span>Khớp ({instantSearchMatches.length} căn)</span>
                    <span className="text-gray-400 text-[9px]">Nhấp chọn</span>
                  </div>
                  {instantSearchMatches.length === 0 ? (
                    <div className="p-3 text-center text-gray-400 text-xs">
                      Không tìm thấy căn &ldquo;{searchQuery}&rdquo;
                    </div>
                  ) : (
                    instantSearchMatches.map(u => (
                      <div
                        key={u.code}
                        onMouseDown={() => handleSelectSearchResult(u)}
                        className={`p-2 hover:bg-[#1C2533] cursor-pointer flex items-center justify-between transition-colors ${
                          selectedAptCode === u.code ? 'bg-[#1C2533] border-l-2 border-[#C5A880]' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white text-xs bg-[#161B22] px-1.5 py-0.5 border border-[#2D3748]">
                            {u.code}
                          </span>
                          <div className="min-w-0">
                            <div className="text-white text-xs font-semibold truncate flex items-center gap-1">
                              <span>{u.owner?.name ? u.owner.name : 'Nhà Trống'}</span>
                              {(u.code === 'CH-06' || (u.floor === 30 && u.code === 'CH-01')) && (
                                <span className="text-[9px] px-1 bg-amber-500/20 text-amber-300">Chủ Hộ</span>
                              )}
                            </div>
                            <div className="text-[10px] text-gray-400 truncate">
                              Tầng {u.floor} • {u.typeLabel}
                            </div>
                          </div>
                        </div>
                        <span className={`text-[9px] px-1.5 py-0.5 font-mono shrink-0 ${
                          u.status === 'OCCUPIED'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                            : u.status === 'MAINTENANCE'
                            ? 'bg-blue-950 text-blue-300 border border-blue-800/60'
                            : 'bg-amber-950 text-amber-300 border border-amber-800/60'
                        }`}>
                          {u.status === 'OCCUPIED' ? 'Đã Ở' : u.status === 'MAINTENANCE' ? 'Nghiệm Thu' : 'Trống'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Nút lọc nhanh riêng Căn Chủ Hộ (Trần Hữu Lực) */}
            <button
              type="button"
              onClick={() => {
                const next = !isOnlyOwnerUnits;
                setIsOnlyOwnerUnits(next);
                if (next) {
                  if (selectedBlock !== 'BS-07') handleSwitchBlock('BS-07');
                  setSelectedFloor(30);
                  setSelectedAptCode('CH-06');
                }
              }}
              className={`px-2.5 py-1 text-xs font-semibold font-mono transition-all shrink-0 border ${
                isOnlyOwnerUnits
                  ? 'bg-[#C5A880] text-black border-[#C5A880] font-bold shadow'
                  : 'text-amber-300 bg-[#292015] hover:bg-[#3D2F1E] border-amber-600/40'
              }`}
              title="Lọc 2 căn chủ hộ của Trần Hữu Lực (CH-06 & CH-01 Tầng 30 - Chung Cư BS-07)"
            >
              <span>{isOwnerBuilding ? 'Căn Chủ Hộ (2)' : 'Căn Chủ Hộ (Chung Cư BS-07)'}</span>
            </button>
          </div>

          {/* Nhóm giữa: Nút chọn Tình trạng */}
          <div className="flex items-center gap-1 font-mono">
            {[
              { id: 'ALL', label: 'Tất Cả' },
              { id: 'OCCUPIED', label: 'Đã Ở' },
              { id: 'VACANT', label: 'Trống' },
              { id: 'MAINTENANCE', label: 'Nghiệm Thu' }
            ].map(o => (
              <button
                key={o.id}
                onClick={() => setSelectedOccupancy(o.id as any)}
                className={`px-2.5 py-1 text-xs transition-all border ${
                  selectedOccupancy === o.id
                    ? 'bg-[#1C2533] text-[#C5A880] border-[#C5A880] font-bold shadow'
                    : 'text-gray-400 hover:text-white bg-[#161B22]/70 border-transparent hover:bg-[#161B22]'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>

          {/* Nhóm phải: Select Loại Căn + Select Tầng + Số lượng & Reset */}
          <div className="flex items-center gap-2 font-mono flex-wrap">
            {/* Select Loại Căn */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="bg-[#161B22] border border-[#2D3748] text-xs text-gray-200 px-2 py-1 outline-none focus:border-[#C5A880]"
              title="Lọc theo loại phòng ngủ"
            >
              <option value="ALL">Mọi loại căn</option>
              <option value="1PN">1 Phòng Ngủ</option>
              <option value="2PN">2 Phòng Ngủ</option>
              <option value="3PN">3 Phòng Ngủ</option>
              <option value="DUPLEX_PENTHOUSE">Căn Lớn / Duplex</option>
            </select>

            {/* Select Tầng */}
            <select
              value={selectedFloorRange}
              onChange={(e) => setSelectedFloorRange(e.target.value as any)}
              className="bg-[#161B22] border border-[#2D3748] text-xs text-gray-200 px-2 py-1 outline-none focus:border-[#C5A880]"
              title="Lọc theo khoảng tầng"
            >
              <option value="ALL">Mọi tầng</option>
              <option value="LOW">Thấp (1-10)</option>
              <option value="MID">Trung (11-20)</option>
              <option value="HIGH">Cao (21-{currentTotalFloors})</option>
            </select>

            {/* Đếm số căn */}
            <div className="text-[11px] text-gray-300 bg-[#161B22] px-2 py-1 border border-[#2D3748] hidden sm:block">
              <strong className="text-white">{filteredUnits.length}</strong>/{displayUnits.length}
            </div>

            {/* Nút Đặt lại khi có bộ lọc hoạt động */}
            {isAnyFilterActive && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="px-2.5 py-1 bg-[#2B1D1D] hover:bg-[#3D2525] text-rose-300 border border-rose-800/60 text-xs font-semibold transition-all active:scale-95"
                title="Đặt lại toàn bộ tiêu chí lọc"
              >
                <span>Đặt Lại</span>
              </button>
            )}
          </div>
        </div>

        {/* HÀNG PHỤ: TIÊU CHÍ ĐANG LỌC (CHỈ HIỆN KHI CÓ LỌC) */}
        {isAnyFilterActive && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-[#1C2533] text-[11px] font-mono">
            <span className="text-gray-400 text-[10px]">Đang lọc:</span>
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 bg-[#1F2A38] text-white border border-[#2D3E54]">
                &ldquo;{searchQuery}&rdquo;
                <button type="button" onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-white">✕</button>
              </span>
            )}
            {isOnlyOwnerUnits && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 bg-amber-950 text-amber-300 border border-amber-700/60 font-bold">
                Căn Chủ Hộ (Trần Hữu Lực)
                <button type="button" onClick={() => setIsOnlyOwnerUnits(false)} className="text-amber-400 hover:text-white">✕</button>
              </span>
            )}
            {selectedOccupancy !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 bg-[#1A2533] text-[#C5A880] border border-[#2F4259]">
                {selectedOccupancy === 'OCCUPIED' ? 'Đã ở' : selectedOccupancy === 'VACANT' ? 'Trống' : 'Nghiệm thu'}
                <button type="button" onClick={() => setSelectedOccupancy('ALL')} className="text-gray-400 hover:text-white">✕</button>
              </span>
            )}
            {selectedType !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 bg-[#1A2533] text-sky-300 border border-[#2F4259]">
                {selectedType}
                <button type="button" onClick={() => setSelectedType('ALL')} className="text-gray-400 hover:text-white">✕</button>
              </span>
            )}
            {selectedFloorRange !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 bg-[#1A2533] text-amber-300 border border-[#2F4259]">
                Tầng: {selectedFloorRange === 'LOW' ? '1-10' : selectedFloorRange === 'MID' ? '11-20' : `21-${currentTotalFloors}`}
                <button type="button" onClick={() => setSelectedFloorRange('ALL')} className="text-gray-400 hover:text-white">✕</button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* ============================================================= */}
      {/* 4. KHU VỰC CHÍNH: SƠ ĐỒ CHUNG CƯ & HỒ SƠ CHI TIẾT CĂN HỘ       */}
      {/* ============================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* CỘT TRÁI (7 COLS): SƠ ĐỒ CHUNG CƯ / MẶT BẰNG TẦNG / DANH SÁCH */}
        <div className="lg:col-span-7 bg-[#0D1117] border border-[#222B35] rounded-none overflow-hidden shadow-2xl flex flex-col">
          
          {/* THANH ĐIỀU HÀNH GÓC NHÌN DUY NHẤT (SINGLE UNIFIED VIEWPORT TOOLBAR) */}
          <div className="px-3 py-2 bg-[#0E1520] border-b border-[#222B35] flex items-center justify-between gap-2.5 text-xs">
            {/* 5 Tab Chuyển Đổi Góc Nhìn */}
            <div className="flex bg-[#070B11] p-0.5 border border-[#1E2A38] text-xs font-semibold shrink-0 flex-wrap">
              <button
                type="button"
                onClick={() => setBuildingPerspective('FLOOR_PLAN')}
                className={`px-2.5 sm:px-3 py-1 transition-all flex items-center gap-1.5 ${
                  buildingPerspective === 'FLOOR_PLAN'
                    ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Sơ Đồ Tầng & Căn Hộ</span>
              </button>
              <button
                type="button"
                onClick={() => setBuildingPerspective('MASTER_PLAN')}
                className={`px-2.5 sm:px-3 py-1 transition-all flex items-center gap-1.5 ${
                  buildingPerspective === 'MASTER_PLAN'
                    ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Map className="w-3.5 h-3.5" />
                <span>Bản Đồ Nội Khu & Tiện Ích</span>
              </button>
              <button
                type="button"
                onClick={() => setBuildingPerspective('3D')}
                className={`px-2.5 sm:px-3 py-1 transition-all flex items-center gap-1.5 ${
                  buildingPerspective === '3D'
                    ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Mô Hình 3D</span>
              </button>
              <button
                type="button"
                onClick={() => setBuildingPerspective('BUILDING_ELEVATION')}
                className={`px-2.5 sm:px-3 py-1 transition-all flex items-center gap-1.5 ${
                  buildingPerspective === 'BUILDING_ELEVATION'
                    ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Mặt Đứng</span>
              </button>
              <button
                type="button"
                onClick={() => setBuildingPerspective('GRID')}
                className={`px-2.5 sm:px-3 py-1 transition-all flex items-center gap-1.5 ${
                  buildingPerspective === 'GRID'
                    ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Lưới Căn</span>
              </button>
            </div>

            {/* BÊN PHẢI: BỘ CÔNG CỤ THEO NGỮ CẢNH TƯƠNG ỨNG CỦA TỪNG VIEW */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {buildingPerspective === 'MASTER_PLAN' && (
                <div className="flex items-center gap-1.5 font-mono text-xs">
                  <div className="flex bg-[#141E2B] p-0.5 border border-[#233345] text-[11px]">
                    <button
                      type="button"
                      onClick={() => setMasterPlanTab('TROPICAL')}
                      className={`px-2 py-0.5 transition-all ${
                        masterPlanTab === 'TROPICAL'
                          ? 'bg-[#C5A880] text-black font-bold'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Nội Khu (18 Tiện Ích)
                    </button>
                    <button
                      type="button"
                      onClick={() => setMasterPlanTab('SURROUNDINGS')}
                      className={`px-2 py-0.5 transition-all ${
                        masterPlanTab === 'SURROUNDINGS'
                          ? 'bg-[#C5A880] text-black font-bold'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Xung Quanh Dự Án
                    </button>
                    <button
                      type="button"
                      onClick={() => setMasterPlanTab('CAD_FLOOR')}
                      className={`px-2 py-0.5 transition-all ${
                        masterPlanTab === 'CAD_FLOOR'
                          ? 'bg-[#C5A880] text-black font-bold'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Mặt Bằng CAD
                    </button>
                    <button
                      type="button"
                      onClick={() => setMasterPlanTab('MACRO')}
                      className={`px-2 py-0.5 transition-all ${
                        masterPlanTab === 'MACRO'
                          ? 'bg-[#C5A880] text-black font-bold'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Đại Đô Thị
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMasterPlanZoomed(true)}
                    className="px-2 py-0.5 bg-[#C5A880]/20 hover:bg-[#C5A880] text-[#C5A880] hover:text-black border border-[#C5A880]/60 text-[11px] font-bold transition-all flex items-center gap-1"
                  >
                    <Maximize2 className="w-3 h-3" />
                    <span>Phóng To</span>
                  </button>
                </div>
              )}
              {buildingPerspective === '3D' && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#141E2B] border border-[#233345] text-[11px] font-mono shrink-0">
                    <span className="text-gray-400">Đang chiếu:</span>
                    <strong className="text-white">T{selectedFloor}</strong>
                    <span className="text-gray-600">•</span>
                    <strong className="text-[#C5A880]">{activeUnit?.code || selectedAptCode}</strong>
                  </div>

                  {/* Chế độ Ngày / Đêm dạng text thanh lịch */}
                  <button
                    type="button"
                    onClick={() => setBuildingTheme(buildingTheme === 'NIGHT' ? 'DAY' : 'NIGHT')}
                    className="px-2.5 py-1 bg-[#141E2B] hover:bg-[#1E2E40] border border-[#233345] text-white text-[11px] font-mono transition-all shrink-0"
                    title={buildingTheme === 'NIGHT' ? 'Chuyển sang chế độ Ban Ngày' : 'Chuyển sang chế độ Ban Đêm'}
                  >
                    <span>{buildingTheme === 'NIGHT' ? 'Chế độ: Đêm' : 'Chế độ: Ngày'}</span>
                  </button>
                </div>
              )}

              {buildingPerspective === 'BUILDING_ELEVATION' && (
                <div className="flex items-center gap-1 font-mono text-[11px]">
                  <span className="text-gray-400 hidden md:inline">Vùng:</span>
                  {(['ALL', 'HIGH', 'MID', 'LOW'] as FloorRangeFilter[]).map((fr) => (
                    <button
                      key={fr}
                      type="button"
                      onClick={() => setSelectedFloorRange(fr)}
                      className={`px-2 py-0.5 border transition-all ${
                        selectedFloorRange === fr
                          ? 'bg-[#C5A880] text-black font-bold border-[#C5A880]'
                          : 'bg-[#141E2B] text-gray-300 border-[#233345] hover:text-white'
                      }`}
                    >
                      {fr === 'ALL' ? 'Tất Cả' : fr === 'HIGH' ? 'Cao' : fr === 'MID' ? 'Trung' : 'Hạ'}
                    </button>
                  ))}
                </div>
              )}

              {buildingPerspective === 'FLOOR_PLAN' && (
                <div className="flex items-center gap-2 font-mono text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-400 text-[11px] hidden sm:inline">Tầng:</span>
                    <select
                      value={selectedFloor}
                      onChange={(e) => setSelectedFloor(Number(e.target.value))}
                      className="bg-[#141E2B] border border-[#233345] px-2 py-0.5 text-white font-mono text-[11px] outline-none focus:border-[#C5A880]"
                    >
                      {buildingFloors.map(f => (
                        <option key={f} value={f}>
                          Tầng {f} {f === 30 ? '(Căn chủ hộ)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsFloorPlanExpanded(true)}
                    className="px-2.5 py-0.5 bg-[#C5A880]/15 hover:bg-[#C5A880] text-[#C5A880] hover:text-black border border-[#C5A880]/60 font-bold text-[11px] font-mono transition-all"
                  >
                    <span>Mở Rộng</span>
                  </button>
                </div>
              )}

              {buildingPerspective === 'GRID' && (
                <div className="text-[11px] font-mono text-[#C5A880] px-2.5 py-0.5 bg-[#141E2B] border border-[#233345]">
                  {filteredUnits.length}/{displayUnits.length} căn
                </div>
              )}
            </div>
          </div>

          {/* ----------------------------------------------------------- */}
          {/* GÓC NHÌN 1: MÔ HÌNH KHỐI 3D KIẾN TRÚC CHUNG CƯ*/}
          {/* ----------------------------------------------------------- */}
          {buildingPerspective === '3D' && (() => {
            const curTone = toneConfig.GOLD_LUXURY;
            const floorStep = (472 - 90) / (currentTotalFloors - 1);
            const rulerLevels = currentTotalFloors === 39 
              ? [39, 35, 30, 25, 20, 15, 10, 5, 1] 
              : [34, 30, 25, 20, 15, 10, 5, 1];

            return (
              <div className={`relative w-full h-[660px] sm:h-[760px] ${curTone.containerBg} overflow-hidden flex flex-col select-none transition-colors duration-500`}>
                {/* Lưới tọa độ kiến trúc số */}
                <div 
                  className="absolute inset-0 opacity-15 pointer-events-none"
                  style={{
                    backgroundImage: `linear-gradient(to right, ${curTone.gridLineColor} 1px, transparent 1px), linear-gradient(to bottom, ${curTone.gridLineColor} 1px, transparent 1px)`,
                    backgroundSize: '24px 24px'
                  }}
                />

                {/* BẢN VẼ PHỐI CẢNH 3D CHUNG CƯ ISOMETRIC CHUẨN KIẾN TRÚC */}
                <div className="relative flex-1 w-full h-full flex items-center justify-center">
                  <svg
                    viewBox="0 0 1000 680"
                    className="w-full h-full cursor-default drop-shadow-[0_30px_60px_rgba(0,0,0,0.95)]"
                  >
                    <defs>
                      <style>{`
                        @keyframes laserDrawPath {
                          0% { stroke-dashoffset: 340; opacity: 0; }
                          20% { opacity: 1; }
                          100% { stroke-dashoffset: 0; opacity: 1; }
                        }
                        @keyframes calloutSlideIn {
                          0% { opacity: 0; transform: translateY(12px) scale(0.95); }
                          100% { opacity: 1; transform: translateY(0) scale(1); }
                        }
                        @keyframes pingRing {
                          0% { r: 3.5; opacity: 1; stroke-width: 2.5; }
                          70% { opacity: 0.5; }
                          100% { r: 20; opacity: 0; stroke-width: 0.5; }
                        }
                        .anim-laser-line {
                          stroke-dasharray: 340;
                          stroke-dashoffset: 340;
                          animation: laserDrawPath 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                        }
                        .anim-callout-card {
                          animation: calloutSlideIn 0.5s 0.18s cubic-bezier(0.16, 1, 0.3, 1) both;
                        }
                        .anim-ping-pulse {
                          animation: pingRing 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
                        }
                      `}</style>

                      <filter id="unitGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3.5" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>

                      {/* Gradient kính ban đêm vs ban ngày theo Tone Màu được chọn */}
                      <linearGradient id="skylineGlassL" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={curTone.glassL[0]} />
                        <stop offset="50%" stopColor={curTone.glassL[1]} />
                        <stop offset="100%" stopColor={curTone.glassL[2]} />
                      </linearGradient>

                      <linearGradient id="skylineGlassR" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={curTone.glassR[0]} />
                        <stop offset="60%" stopColor={curTone.glassR[1]} />
                        <stop offset="100%" stopColor={curTone.glassR[2]} />
                      </linearGradient>

                      {/* Gradient khối đế tiếp tân */}
                      <linearGradient id="podiumMallGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={curTone.podiumGrad[0]} />
                        <stop offset="60%" stopColor={curTone.podiumGrad[1]} />
                        <stop offset="100%" stopColor={curTone.podiumGrad[2]} />
                      </linearGradient>

                      {/* Gradient phát sáng cửa sổ phòng cư dân tầng 30 */}
                      <linearGradient id="warmWindowGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#059669" />
                        <stop offset="50%" stopColor="#10B981" />
                        <stop offset="100%" stopColor="#34D399" />
                      </linearGradient>
                    </defs>

                    {/* THƯỚC ĐO CAO ĐỘ CÁC TẦNG BÊN TRÁI & PHẢI (LEVEL RULER) */}
                    <g className="opacity-70 font-mono text-[9px]">
                      {rulerLevels.map(fl => {
                        const yPos = 472 - (fl - 1) * floorStep - 25;
                        const is30 = fl === 30;
                        const is20 = fl === 20;

                        return (
                          <g key={`level-ruler-${fl}`} className="pointer-events-none">
                            <line x1="160" y1={yPos} x2="225" y2={yPos} stroke={is30 ? '#10B981' : is20 ? '#38BDF8' : '#334155'} strokeWidth={is30 ? 2 : 1} strokeDasharray={is30 ? 'none' : '3 3'} />
                            <circle cx="225" cy={yPos} r={is30 ? 3.5 : 2} fill={is30 ? '#10B981' : is20 ? '#38BDF8' : '#475569'} />
                            <rect x="95" y={yPos - 9} width="60" height="18" fill={is30 ? '#064E3B' : is20 ? '#082F49' : '#0B121D'} stroke={is30 ? '#10B981' : is20 ? '#38BDF8' : '#1E2D42'} strokeWidth="1" />
                            <text x="125" y={yPos + 3.5} fill={is30 ? '#34D399' : is20 ? '#7DD3FC' : '#94A3B8'} fontWeight="bold" textAnchor="middle">
                              TẦNG {fl}
                            </text>

                            {/* Nhãn bên phải */}
                            <line x1="775" y1={yPos} x2="840" y2={yPos} stroke={is30 ? '#10B981' : is20 ? '#38BDF8' : '#334155'} strokeWidth={is30 ? 2 : 1} strokeDasharray={is30 ? 'none' : '3 3'} />
                            <circle cx="775" cy={yPos} r={is30 ? 3.5 : 2} fill={is30 ? '#10B981' : is20 ? '#38BDF8' : '#475569'} />
                          </g>
                        );
                      })}
                    </g>

                    {/* 1. KHUÔN VIÊN MẶT ĐẤT & SẢNH ĐÓN TẦNG 1 */}
                    <g className="opacity-95">
                      <polygon points="60,575 500,665 940,575 500,485" fill="#070B12" stroke="#1E293B" strokeWidth="2" />

                      {/* Khối Sảnh Đón Tiếp Tân Hoàng Gia (Tầng 1) */}
                      <polygon points="180,555 500,605 820,555 820,490 500,540 180,490" fill="url(#podiumMallGrad)" stroke={curTone.borderBuilding} strokeWidth="1.8" />
                      <polygon points="210,540 500,586 790,540 790,505 500,551 210,505" fill="#0EA5E9" fillOpacity="0.2" stroke="#38BDF8" strokeWidth="1.2" />
                      
                      <text x="500" y="546" fill="#F8FAFC" fontSize="11" fontFamily="sans-serif" textAnchor="middle" fontWeight="900" letterSpacing="0.08em">
                        ĐẠI SẢNH ĐÓN TIẾP TÂN & KHU DỊCH VỤ CƯ DÂN (TẦNG 1)
                      </text>
                      <text x="500" y="566" fill="#94A3B8" fontSize="8.5" fontFamily="monospace" textAnchor="middle">
                        Lễ Tân 24/7 • Ban Quản Lý • Hầm Để Xe Thông Minh B1 - B2
                      </text>

                      {/* Hồ nước sinh thái */}
                      <polygon points="300,612 500,646 700,612 500,578" fill="#0369A1" fillOpacity="0.35" stroke="#38BDF8" strokeWidth="1" />
                      <text x="500" y="616" fill="#38BDF8" fontSize="8.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                        HỒ CẢNH QUAN & QUẢNG TRƯỜNG NỘI KHU THE TROPICAL
                      </text>
                    </g>

                    {/* 2. THÂN CHUNG CƯ (TỐI ĐA 39 TẦNG TÙY BLOCK) */}
                    <g className="transition-all duration-300">
                      {/* Mặt Trái (Hướng Đông Nam) */}
                      <polygon points="230,475 500,520 500,68 230,38" fill="url(#skylineGlassL)" stroke={curTone.borderBuilding} strokeWidth="2" />
                      {/* Mặt Phải (Hướng Tây Nam) */}
                      <polygon points="500,520 770,475 770,38 500,68" fill="url(#skylineGlassR)" stroke={curTone.borderBuilding} strokeWidth="2" />
                      
                      {/* Nan lam kiến trúc đứng (Architectural Mullions) tạo chiều sâu cho chung cư */}
                      <line x1="320" y1="48" x2="320" y2="489" stroke={curTone.mullionColor} strokeWidth="0.8" opacity="0.4" />
                      <line x1="410" y1="58" x2="410" y2="505" stroke={curTone.mullionColor} strokeWidth="0.8" opacity="0.4" />
                      <line x1="590" y1="58" x2="590" y2="505" stroke={curTone.mullionColor} strokeWidth="0.8" opacity="0.4" />
                      <line x1="680" y1="48" x2="680" y2="489" stroke={curTone.mullionColor} strokeWidth="0.8" opacity="0.4" />

                      {/* Mái Chung Cư (Sân Thượng Helipad) */}
                      <polygon points="230,38 500,68 770,38 500,16" fill={curTone.roofColor} stroke={curTone.borderBuilding} strokeWidth="2" />

                      {/* Sân đáp trực thăng Helipad trên đỉnh chung cư */}
                      <ellipse cx="500" cy="54" rx="65" ry="18" fill="#0F172A" stroke={curTone.borderBuilding} strokeWidth="1.8" />
                      <circle cx="500" cy="54" r="11" fill="none" stroke={curTone.crownColor} strokeWidth="1.5" />
                      <text x="500" y="58" fill={curTone.crownColor} fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">H</text>

                      {/* Đèn báo tín hiệu hàng không nhấp nháy trên đỉnh */}
                      <circle cx="500" cy="12" r="3.5" fill="#EF4444" className="animate-pulse" />
                      <line x1="500" y1="12" x2="500" y2="22" stroke="#64748B" strokeWidth="1.5" />

                      {/* Tiêu đề Đỉnh Chung Cư */}
                      <text x="500" y="8" fill={curTone.titleColor} fontSize="12" fontWeight="bold" textAnchor="middle" fontFamily="serif" letterSpacing="0.05em">
                        {currentBlockName.toUpperCase()} ({currentTotalFloors} TẦNG) • CHUNG CƯ THE TROPICAL
                      </text>

                      {/* RENDER CÁC TẦNG THỰC TẾ THEO CHUNG CƯ */}
                      {BUILDING_3D_UNITS.filter(b => b.floor <= currentTotalFloors).map(b => {
                        const liveUnit = displayUnits.find(u => 
                          u.code === b.code || 
                          (u.floor === b.floor && (
                            u.code.endsWith(b.code) || 
                            b.code.endsWith(u.code) ||
                            (b.side === 'LEFT' && (u.code.includes('CH-06') || u.code.endsWith('06'))) ||
                            (b.side === 'RIGHT' && (u.code.includes('CH-01') || u.code.endsWith('01')))
                          ))
                        );
                        const actualStatus = liveUnit ? liveUnit.status : 'VACANT';
                        const actualOwnerName = isOwnerBuilding && (b.code === 'CH-06' || b.floor === 30) && b.side === 'LEFT' 
                          ? activeOwnerName 
                          : (liveUnit?.owner?.name || (actualStatus === 'OCCUPIED' ? 'Cư Dân Sinh Sống' : 'Căn Hộ Trống'));
                        const isSelected = selectedAptCode === b.code || (selectedFloor === b.floor && (selectedAptCode === b.code || selectedAptCode.endsWith(b.code) || b.code.endsWith(selectedAptCode)));
                        const isHovered = hoveredUnitCode === b.code || (hoveredFloor === b.floor && (hoveredUnitCode?.endsWith(b.code) || b.code.endsWith(hoveredUnitCode || '')));
                        
                        // Lọc theo bộ lọc thống nhất toàn hệ thống
                        const isMatchedFilter = isUnitMatchingFilter(b.code, b.floor);

                        // Tọa độ hình học chính xác cho khối căn hộ
                        const yBase = 472 - (b.floor - 1) * floorStep;
                        const h = b.floor === currentTotalFloors ? 13 : 9.5;
                        
                        const pts = b.side === 'LEFT'
                          ? `${248},${(yBase - 33 - h).toFixed(1)} ${494},${(yBase - 1 - h).toFixed(1)} ${494},${(yBase - 1).toFixed(1)} ${248},${(yBase - 33).toFixed(1)}`
                          : `${506},${(yBase - 1 - h).toFixed(1)} ${752},${(yBase - 33 - h).toFixed(1)} ${752},${(yBase - 33).toFixed(1)} ${506},${(yBase - 1).toFixed(1)}`;
                        
                        // Màu sắc theo trạng thái thực tế 100% từ NKS API
                        let fillColor = buildingTheme === 'NIGHT' ? '#0F172A' : '#0369A1';
                        let strokeColor = buildingTheme === 'NIGHT' ? '#1E293B' : '#0284C7';
                        let fillOpacity = 0.55;

                        if (actualStatus === 'OCCUPIED') {
                          fillColor = isSelected ? '#059669' : '#065F46';
                          strokeColor = isSelected ? '#34D399' : '#10B981';
                          fillOpacity = isSelected ? 0.98 : 0.85;
                        } else if (actualStatus === 'MAINTENANCE') {
                          fillColor = isSelected ? '#0284C7' : '#075985';
                          strokeColor = isSelected ? '#7DD3FC' : '#38BDF8';
                          fillOpacity = isSelected ? 0.95 : 0.8;
                        } else {
                          fillColor = isSelected ? '#B45309' : (buildingTheme === 'NIGHT' ? '#141E2B' : '#0A2540');
                          strokeColor = isSelected ? '#F59E0B' : (buildingTheme === 'NIGHT' ? '#1E2D42' : '#0E3A66');
                          fillOpacity = isSelected ? 0.9 : 0.55;
                        }

                        // Lọc theo vùng tầng đồng bộ với thanh điều hành
                        const isMatchedZone = selectedFloorRange === 'ALL'
                          ? true
                          : selectedFloorRange === 'HIGH'
                          ? b.floor >= 21
                          : selectedFloorRange === 'MID'
                          ? (b.floor >= 11 && b.floor <= 20)
                          : (b.floor <= 10);

                        let opacityVal = isMatchedZone ? 0.9 : 0.25;
                        if (isSelected || isHovered) opacityVal = 1;
                        if (isOnlyOwnerUnits) {
                          opacityVal = b.floor === 30 ? 1 : 0.2;
                        }

                        return (
                          <g
                            key={b.code}
                            onClick={() => {
                              setSelectedAptCode(b.code);
                              setSelectedFloor(b.floor);
                            }}
                            onMouseEnter={() => {
                              setHoveredUnitCode(b.code);
                              setHoveredFloor(b.floor);
                            }}
                            onMouseLeave={() => {
                              setHoveredUnitCode(null);
                              setHoveredFloor(null);
                            }}
                            className="cursor-pointer transition-all duration-200"
                            style={{ opacity: opacityVal }}
                          >
                            <polygon
                              points={pts}
                              fill={fillColor}
                              fillOpacity={fillOpacity}
                              stroke={isSelected ? '#FFFFFF' : (isHovered ? '#FDE68A' : strokeColor)}
                              strokeWidth={isSelected ? 2.2 : (isHovered ? 1.8 : 0.8)}
                              filter={isSelected || (b.floor === 30 && actualStatus === 'OCCUPIED') ? 'url(#unitGlow)' : undefined}
                            />

                            {/* Ánh đèn phòng ấm cúng cho tầng 30 có cư dân ở ban đêm (Chỉ ở Chung Cư BS-07) */}
                            {isOwnerBuilding && b.floor === 30 && buildingTheme === 'NIGHT' && (
                              <line
                                x1={b.side === 'LEFT' ? 290 : 540}
                                y1={yBase - 18}
                                x2={b.side === 'LEFT' ? 450 : 710}
                                y2={yBase - 8}
                                stroke="#FDE68A"
                                strokeWidth="1.5"
                                strokeDasharray="4 2"
                                opacity="0.8"
                                className="animate-pulse"
                              />
                            )}

                            {/* Điểm nhấn Pin vàng định vị Căn Hộ Chủ Hộ Tầng 30 (Chỉ ở Chung Cư BS-07) */}
                            {isOwnerBuilding && b.floor === 30 && b.code === 'CH-06' && (
                              <g className="pointer-events-none">
                                <circle cx={b.side === 'LEFT' ? 370 : 630} cy={yBase - 18} r="6" fill="#F59E0B" className="animate-ping opacity-75" />
                                <circle cx={b.side === 'LEFT' ? 370 : 630} cy={yBase - 18} r="3" fill="#FDE68A" stroke="#B45309" strokeWidth="1" />
                                <rect x={b.side === 'LEFT' ? 315 : 575} y={yBase - 33} width="112" height="13" fill="#0B131E" fillOpacity="0.92" stroke="#F59E0B" strokeWidth="0.8" rx="2" />
                                <text x={b.side === 'LEFT' ? 371 : 631} y={yBase - 23.5} fill="#FDE68A" fontSize="7" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                                  CĂN CHỦ HỘ (LỰC)
                                </text>
                              </g>
                            )}
                          </g>
                        );
                      })}

                      {/* =================================================================== */}
                      {/* CON TRỎ LASER VÀ BẢNG CALLOUT HOLOGRAPHIC ĐỊNH VỊ CHÍNH XÁC CĂN HỘ  */}
                      {/* =================================================================== */}
                      {(() => {
                        let activeTargetBlock = BUILDING_3D_UNITS.find(b => b.code === selectedAptCode);
                        if (!activeTargetBlock) {
                          const targetFloor = activeUnit?.floor || 30;
                          const numStr = selectedAptCode.replace(/\D/g, '').slice(-2);
                          const num = parseInt(numStr || '1', 10);
                          const fallbackSide: 'LEFT' | 'RIGHT' = num % 2 === 1 ? 'LEFT' : 'RIGHT';
                          activeTargetBlock = BUILDING_3D_UNITS.find(b => b.floor === targetFloor && b.side === fallbackSide)
                            || BUILDING_3D_UNITS.find(b => b.floor === targetFloor)
                            || {
                              code: selectedAptCode,
                              floor: Math.max(1, Math.min(currentTotalFloors, targetFloor)),
                              side: fallbackSide,
                              type: (activeUnit?.type || '2PN') as ApartmentType,
                              defaultStatus: (activeUnit?.status || 'VACANT') as ApartmentStatus,
                              area: activeUnit?.area || 75
                            };
                        }

                        const curFloor = Math.max(1, Math.min(currentTotalFloors, activeTargetBlock.floor));
                        const curSide = activeTargetBlock.side;
                        const curYBase = 472 - (curFloor - 1) * floorStep;
                        const curH = curFloor === currentTotalFloors ? 13 : 9.5;

                        const wallX = curSide === 'LEFT' ? 248 : 752;
                        const wallY = Number((curYBase - 33 - (curH / 2)).toFixed(1));

                        const pinDist = 67;
                        const pinX = curSide === 'LEFT' ? (wallX + pinDist) : (wallX - pinDist);
                        const pinY = Number((wallY + (32 / 246) * pinDist).toFixed(1));

                        const elbowX = curSide === 'LEFT' ? (wallX - 24) : (wallX + 24);
                        const elbowY = wallY;

                        const cardW = 205;
                        const cardH = 82;
                        const cardX = curSide === 'LEFT' ? 14 : 780;
                        const dockX = curSide === 'LEFT' ? (cardX + cardW) : cardX;
                        const targetCardY = Math.max(48, Math.min(480, Math.round(wallY - cardH / 2)));
                        const dockY = targetCardY + cardH / 2;

                        const laserPath = `M ${pinX} ${pinY} L ${wallX} ${wallY} L ${elbowX} ${elbowY} L ${dockX} ${dockY}`;

                        const isCurOccupied = activeUnit?.status === 'OCCUPIED' || curFloor === 30;
                        const isCurMaint = activeUnit?.status === 'MAINTENANCE' || curFloor === 20;
                        const themeNeon = isCurOccupied ? '#10B981' : isCurMaint ? '#38BDF8' : curTone.laserBeamColor;
                        const themeBg = isCurOccupied ? '#064E3B' : isCurMaint ? '#082F49' : '#1C1917';
                        const themeBorder = isCurOccupied ? '#34D399' : isCurMaint ? '#7DD3FC' : curTone.borderBuilding;
                        const themeText = isCurOccupied ? '#D1FAE5' : isCurMaint ? '#BAE6FD' : curTone.titleColor;

                        return (
                          <g key={`dynamic-pointer-${selectedAptCode}`} className="pointer-events-none">
                            <circle cx={pinX} cy={pinY} r="4.5" fill={themeNeon} filter="url(#unitGlow)" />
                            <circle cx={pinX} cy={pinY} r="14" fill="none" stroke={themeNeon} strokeWidth="1.6" className="anim-ping-pulse" />
                            <circle cx={pinX} cy={pinY} r="1.8" fill="#FFFFFF" />

                            <path
                              d={laserPath}
                              fill="none"
                              stroke={themeNeon}
                              strokeWidth="2.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="anim-laser-line"
                              filter="url(#unitGlow)"
                            />
                            <circle cx={wallX} cy={wallY} r="2.5" fill={themeNeon} />
                            <circle cx={dockX} cy={dockY} r="3.5" fill={themeBorder} />

                            <g className="anim-callout-card">
                              <rect
                                x={cardX}
                                y={targetCardY}
                                width={cardW}
                                height={cardH}
                                fill={themeBg}
                                fillOpacity="0.96"
                                stroke={themeBorder}
                                strokeWidth="1.8"
                                rx="4"
                                filter="url(#unitGlow)"
                              />

                              <circle cx={cardX + 14} cy={targetCardY + 16} r="3.5" fill={themeNeon} />
                              <text
                                x={cardX + 24}
                                y={targetCardY + 20}
                                fill="#FFFFFF"
                                fontSize="10"
                                fontWeight="900"
                                fontFamily="monospace"
                              >
                                CĂN {activeUnit?.code || selectedAptCode} • TẦNG {curFloor}
                              </text>

                              <text
                                x={cardX + 14}
                                y={targetCardY + 36}
                                fill={themeText}
                                fontSize="8.5"
                                fontWeight="bold"
                              >
                                {isOwnerBuilding && curFloor === 30 && (selectedAptCode === 'CH-06' || activeUnit?.code === 'CH-06')
                                  ? `CHỦ HỘ: ${activeOwnerName} (${activeOwnerPhone})`
                                  : isOwnerBuilding && curFloor === 30 && (selectedAptCode === 'CH-01' || activeUnit?.code === 'CH-01')
                                  ? `CĂN PHỤ CHỦ HỘ: ${activeOwnerName}`
                                  : activeUnit?.owner?.name
                                  ? `CƯ DÂN: ${activeUnit.owner.name}`
                                  : activeUnit?.status === 'OCCUPIED'
                                  ? 'CÓ CƯ DÂN SINH SỐNG'
                                  : isCurMaint
                                  ? 'ĐANG NGHIỆM THU KỸ THUẬT'
                                  : 'NHÀ TRỐNG • SẴN SÀNG Ở'}
                              </text>

                              <text
                                x={cardX + 14}
                                y={targetCardY + 50}
                                fill="#CBD5E1"
                                fontSize="7.5"
                                fontFamily="monospace"
                              >
                                {activeUnit?.typeLabel || `${activeTargetBlock.type}`} • {activeUnit?.area || activeTargetBlock.area}m² • Hướng {activeUnit?.direction || (curSide === 'LEFT' ? 'Đông Nam' : 'Tây Nam')}
                              </text>

                              <text
                                x={cardX + 14}
                                y={targetCardY + 68}
                                fill={themeNeon}
                                fontSize="7.5"
                                fontWeight="semibold"
                              >
                                Nhấp Mặt Bằng Tầng để xem 8 căn chi tiết
                              </text>
                            </g>
                          </g>
                        );
                      })()}
                    </g>

                    {/* THẺ QUAN SÁT TỨC THÌ KHI HOVER CĂN HỘ KHÁC */}
                    {hoveredUnitCode && hoveredUnitCode !== selectedAptCode && (
                      <g className="pointer-events-none">
                        {(() => {
                          const hUnit = displayUnits.find(u => u.code === hoveredUnitCode);
                          return (
                            <g>
                              <rect x="735" y="25" width="245" height="42" fill="#0D1117" fillOpacity="0.94" stroke={curTone.borderBuilding} strokeWidth="1.2" rx="3" />
                              <text x="748" y="42" fill={curTone.titleColor} fontSize="9.5" fontWeight="bold" fontFamily="monospace">
                                XEM NHANH: CĂN {hoveredUnitCode} (Tầng {hUnit?.floor || hoveredFloor || 30})
                              </text>
                              <text x="748" y="56" fill="#94A3B8" fontSize="8" fontFamily="sans-serif">
                                {hUnit?.status === 'OCCUPIED' ? 'Đã có người ở' : hUnit?.status === 'MAINTENANCE' ? 'Nghiệm thu kỹ thuật' : 'Nhà trống (Sẵn sàng bàn giao)'} • Nhấp để định vị
                              </text>
                            </g>
                          );
                        })()}
                      </g>
                    )}
                  </svg>
                </div>
              </div>
            );
          })()}

          {/* ----------------------------------------------------------- */}
          {/* GÓC NHÌN 2: SƠ ĐỒ TOÀN CẢNH CHUNG CƯ THEO CÁC TẦNG   */}
          {/* ----------------------------------------------------------- */}
          {buildingPerspective === 'BUILDING_ELEVATION' && (() => {
            const displayedElevationFloors = buildingFloors.filter(floor => {
              if (selectedFloorRange === 'HIGH' && floor < 21) return false;
              if (selectedFloorRange === 'MID' && (floor < 11 || floor > 20)) return false;
              if (selectedFloorRange === 'LOW' && floor > 10) return false;

              return true;
            });

            return (
              <div className="p-4 bg-[#05070A] h-[640px] overflow-y-auto space-y-4">
                {/* KHỐI HIỂN THỊ CÁC TẦNG CỦA CHUNG CƯ */}
                <div className="bg-[#0B0F17] border border-[#222B35] p-3 rounded-none flex flex-col space-y-3">
                  {/* Tầng Mái Sân Thượng */}
                  {(selectedFloorRange === 'ALL' || selectedFloorRange === 'HIGH') && (
                    <div className="p-2.5 bg-[#121822] border border-[#1E293B] text-[11px] text-gray-300 font-mono text-center">
                      <span className="font-bold">TẦNG MÁI • SÂN THƯỢNG HELIPAD & KHU KỸ THUẬT {currentBlockName.toUpperCase()}</span>
                    </div>
                  )}

                  {/* Danh sách các tầng từ cao xuống thấp */}
                  <div className="space-y-2.5">
                    {displayedElevationFloors.map(floor => {
                      const unitsOnFloor = displayUnits.filter(u => u.floor === floor);
                      const isFloor30 = isOwnerBuilding && floor === 30;

                      return (
                        <div 
                          key={`Floor-${floor}`} 
                          className={`p-2.5 bg-[#0E141E] border transition-colors space-y-2 ${
                            isFloor30 ? 'border-[#10B981]/60 bg-[#064E3B]/10' : 'border-[#1F2937] hover:border-gray-600'
                          }`}
                        >
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-white font-bold">
                            TẦNG {floor} {isFloor30 ? '(Căn Chủ Hộ)' : ''}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedFloor(floor);
                              setBuildingPerspective('FLOOR_PLAN');
                            }}
                            className="text-[10.5px] text-[#C5A880] hover:text-white hover:underline font-semibold"
                          >
                            Xem mặt bằng tầng
                          </button>
                        </div>

                        {/* Dãy các căn hộ trên tầng này */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {unitsOnFloor.map(unit => {
                            const isSelected = selectedAptCode === unit.code;
                            const isMatchedFilter = isUnitMatchingFilter(unit.code, floor);
                            const isOwnerPrimary = isOwnerBuilding && floor === 30 && (unit.code === 'CH-06' || unit.code.endsWith('CH-06'));
                            const isOwnerSecondary = isOwnerBuilding && floor === 30 && (unit.code === 'CH-01' || unit.code.endsWith('CH-01'));

                            return (
                              <div
                                key={unit.code}
                                onClick={() => setSelectedAptCode(unit.code)}
                                className={`p-2 border transition-all cursor-pointer select-none relative ${
                                  isSelected
                                    ? 'bg-[#1C2533] border-[#C5A880] ring-1 ring-[#C5A880] shadow-md z-10'
                                    : isOwnerPrimary
                                    ? 'bg-[#15231B] border-[#F59E0B] shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                                    : isOwnerSecondary
                                    ? 'bg-[#101F2D] border-cyan-500/60'
                                    : 'bg-[#141B26] border-[#222E3E] hover:border-gray-500'
                                } ${!isMatchedFilter ? 'opacity-30' : 'opacity-100'}`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold font-mono text-white">
                                      {unit.code}
                                    </span>
                                    {isOwnerPrimary && (
                                      <span className="text-[8.5px] px-1 bg-amber-500/25 text-amber-300 font-bold border border-amber-500/50 font-mono">
                                        CHỦ HỘ
                                      </span>
                                    )}
                                    {isOwnerSecondary && (
                                      <span className="text-[8.5px] px-1 bg-cyan-950 text-cyan-300 font-bold border border-cyan-700/60 font-mono">
                                        CĂN PHỤ
                                      </span>
                                    )}
                                  </div>
                                  <span
                                    className={`w-2 h-2 rounded-full ${
                                      unit.status === 'OCCUPIED'
                                        ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
                                        : unit.status === 'MAINTENANCE'
                                        ? 'bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.8)]'
                                        : 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]'
                                    }`}
                                    title={
                                      unit.status === 'OCCUPIED'
                                        ? 'Đã có người ở'
                                        : unit.status === 'MAINTENANCE'
                                        ? 'Đang nghiệm thu'
                                        : 'Chưa có người ở'
                                    }
                                  />
                                </div>

                                <div className="text-[10px] text-gray-400 mt-0.5 truncate">
                                  {unit.typeLabel.split('-')[0].trim()} • {unit.area}m²
                                </div>

                                <div className="text-[9.5px] font-semibold mt-1 truncate">
                                  {isOwnerPrimary ? (
                                    <span className="text-amber-300 font-bold">
                                      {activeOwnerName} (Chính Chủ)
                                    </span>
                                  ) : isOwnerSecondary ? (
                                    <span className="text-cyan-300 font-bold">
                                      {activeOwnerName} (Căn Phụ)
                                    </span>
                                  ) : unit.status === 'OCCUPIED' ? (
                                    <span className="text-emerald-300 font-bold">
                                      {unit.owner?.name || 'Đã có cư dân'}
                                    </span>
                                  ) : unit.status === 'MAINTENANCE' ? (
                                    <span className="text-blue-300">Nghiệm thu</span>
                                  ) : (
                                    <span className="text-amber-300/80">Nhà trống</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Tầng 1 - Sảnh chính */}
                <div className="p-3 bg-[#121820] border border-[#222B35] text-[11px] font-mono text-center text-gray-300">
                  TẦNG 1: SẢNH ĐÓN CƯ DÂN • QUẦY LỄ TÂN • VĂN PHÒNG BAN QUẢN LÝ • LỐI XUỐNG HẦM XE B1-B2
                </div>
              </div>
            </div>
          );
        })()}

          {/* ----------------------------------------------------------- */}
          {/* GÓC NHÌN 3: SƠ ĐỒ MẶT BẰNG TẦNG THỰC TẾ (FLOOR PLAN)        */}
          {/* ----------------------------------------------------------- */}
          {buildingPerspective === 'FLOOR_PLAN' && (() => {
            // Danh sách đầy đủ 21 căn hộ theo bản vẽ CAD kiến trúc Chung Cư BS-09 & The Tropical
            const floorUnits = CAD_FLOOR_UNITS_CONFIG.map(cfg => {
              const chCode = cfg.code;
              const targetCode = selectedFloor === 30 ? chCode : `${selectedFloor}-${chCode}`;
              const found = displayUnits.find(u => 
                u.floor === selectedFloor && (
                  u.code.toUpperCase() === chCode ||
                  u.code.toUpperCase() === targetCode ||
                  u.code.toUpperCase().endsWith(chCode) ||
                  (selectedFloor === 30 && u.code === chCode)
                )
              );
              const isOwnerPrimary = isOwnerBuilding && selectedFloor === 30 && (cfg.num === '06');
              const isOwnerSecondary = isOwnerBuilding && selectedFloor === 30 && (cfg.num === '01');
              const isOccupied = isOwnerPrimary || isOwnerSecondary || found?.status === 'OCCUPIED' || (selectedFloor === 12 && cfg.num === '05') || (selectedFloor % 2 === 0 && (cfg.num === '03' || cfg.num === '15' || cfg.num === '18'));
              const isMaintenance = found?.status === 'MAINTENANCE' || (selectedFloor % 5 === 0 && cfg.num === '09');

              return found || ({
                code: targetCode,
                tower: selectedBlock === 'BS-10' ? 'B' : 'A',
                towerName: currentBlockName,
                floor: selectedFloor,
                type: cfg.type,
                typeLabel: cfg.typeLabel,
                status: isOccupied ? 'OCCUPIED' : isMaintenance ? 'MAINTENANCE' : 'VACANT',
                statusLabel: isOccupied ? 'Có Cư Dân' : isMaintenance ? 'Nghiệm Thu Kỹ Thuật' : 'Căn Hộ Trống',
                area: cfg.area,
                bedrooms: cfg.beds,
                bathrooms: cfg.baths,
                direction: cfg.dir,
                priceBillion: cfg.defaultPrice,
                owner: isOwnerPrimary ? { name: activeOwnerName, phone: activeOwnerPhone, email: activeOwnerEmail, cccd: activeOwnerCccd, avatar: activeOwnerAvatar, eKycApproved: true }
                  : isOwnerSecondary ? { name: `${activeOwnerName} (Căn Phụ)`, phone: activeOwnerPhone, email: activeOwnerEmail, cccd: activeOwnerCccd, avatar: activeOwnerAvatar, eKycApproved: true }
                  : isOccupied ? { name: `Cư Dân Căn ${cfg.num}`, phone: '0908123456', email: `resident.${cfg.num}@skyline.vn`, cccd: '079204000123', avatar: '', eKycApproved: true }
                  : undefined
              } as ApartmentUnit);
            });

            const floorOccupiedCount = floorUnits.filter(u => u.status === 'OCCUPIED').length;
            const floorTotalRevenue = floorUnits.reduce((sum, u) => {
              const fin = getApartmentFinancialMetrics(u);
              return sum + (fin ? fin.totalBqlRevenue : 0);
            }, 0);
            const floorTotalElectric = floorUnits.reduce((sum, u) => {
              const fin = getApartmentFinancialMetrics(u);
              return sum + (fin ? fin.electricKwh : 0);
            }, 0);
            const floorTotalWater = floorUnits.reduce((sum, u) => {
              const fin = getApartmentFinancialMetrics(u);
              return sum + (fin ? fin.waterM3 : 0);
            }, 0);

            return (
              <div className="p-4 sm:p-5 bg-[#05070A] h-[660px] sm:h-[760px] overflow-y-auto space-y-3.5 no-scrollbar select-none">

                {/* THANH KPI TÓM TẮT DÒNG TIỀN & TIÊU THỤ TOÀN TẦNG 21 CĂN HỘ */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 bg-gradient-to-r from-[#101722] via-[#121A26] to-[#101722] border border-[#253244] text-[11px] font-mono">
                  <div className="p-1.5 bg-[#16202D] border border-[#2B394E]">
                    <div className="text-[9.5px] text-gray-400">Doanh Thu Tầng {selectedFloor}:</div>
                    <div className="text-xs sm:text-sm font-bold text-emerald-400 mt-0.5">
                      {new Intl.NumberFormat('vi-VN').format(floorTotalRevenue)} <span className="text-[9px] text-gray-400">đ/th</span>
                    </div>
                  </div>
                  <div className="p-1.5 bg-[#16202D] border border-[#2B394E]">
                    <div className="text-[9.5px] text-gray-400">Điện Tiêu Thụ Sàn:</div>
                    <div className="text-xs sm:text-sm font-bold text-amber-300 mt-0.5">
                      {floorTotalElectric} kWh
                    </div>
                  </div>
                  <div className="p-1.5 bg-[#16202D] border border-[#2B394E]">
                    <div className="text-[9.5px] text-gray-400">Nước Tiêu Thụ Sàn:</div>
                    <div className="text-xs sm:text-sm font-bold text-cyan-300 mt-0.5">
                      {floorTotalWater} m³
                    </div>
                  </div>
                  <div className="p-1.5 bg-[#16202D] border border-[#2B394E]">
                    <div className="text-[9.5px] text-gray-400">Lấp Đầy Cư Dân:</div>
                    <div className="text-xs sm:text-sm font-bold text-white mt-0.5">
                      {floorOccupiedCount}/21 căn <span className="text-[9.5px] text-gray-400">({Math.round((floorOccupiedCount / 21) * 100)}%)</span>
                    </div>
                  </div>
                </div>

                {/* THANH ĐIỀU KHIỂN CHẾ ĐỘ XEM: SƠ ĐỒ VECTOR CHỮ Z/T VS BẢN VẼ CAD GỐC */}
                <div className="p-2.5 bg-[#0E1522] border border-[#233246] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-[11px]">Chế độ xem:</span>
                    <div className="flex bg-[#070B12] p-0.5 border border-[#1E293B]">
                      <button
                        type="button"
                        onClick={() => setFloorPlanViewMode('CAD_VECTOR')}
                        className={`px-3 py-1 text-xs transition-all ${
                          floorPlanViewMode === 'CAD_VECTOR'
                            ? 'bg-[#C5A880] text-black font-bold shadow'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        Sơ Đồ Tầng
                      </button>
                      <button
                        type="button"
                        onClick={() => setFloorPlanViewMode('BLUEPRINT_IMAGE')}
                        className={`px-3 py-1 text-xs transition-all ${
                          floorPlanViewMode === 'BLUEPRINT_IMAGE'
                            ? 'bg-[#C5A880] text-black font-bold shadow'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        Bản Vẽ CAD
                      </button>
                    </div>
                  </div>

                  {/* Lọc theo Cánh Kiến Trúc */}
                  {floorPlanViewMode === 'CAD_VECTOR' && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-400 text-[11px] hidden sm:inline">Lọc cánh:</span>
                      {[
                        { key: 'ALL', label: 'Tất Cả (21)' },
                        { key: 'NORTH', label: 'Cánh Bắc (5)' },
                        { key: 'SOUTH', label: 'Cánh Nam (5)' },
                        { key: 'WEST', label: 'Cánh Tây (11)' }
                      ].map(item => (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setFloorPlanFilterWing(item.key as any)}
                          className={`px-2 py-0.5 text-[11px] border transition-all ${
                            floorPlanFilterWing === item.key
                              ? 'bg-[#C5A880] text-black font-bold border-[#C5A880]'
                              : 'bg-[#141E2B] text-gray-300 border-[#233345] hover:text-white'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {floorPlanViewMode === 'BLUEPRINT_IMAGE' && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setFloorPlanCadZoom(prev => Math.max(0.8, Number((prev - 0.2).toFixed(1))))}
                        className="px-2 py-0.5 bg-[#141E2B] hover:bg-[#202E42] border border-[#233345] text-white"
                        title="Thu nhỏ"
                      >
                        -
                      </button>
                      <span className="text-[11px] text-[#C5A880] min-w-[45px] text-center">
                        {Math.round(floorPlanCadZoom * 100)}%
                      </span>
                      <button
                        type="button"
                        onClick={() => setFloorPlanCadZoom(prev => Math.min(2.5, Number((prev + 0.2).toFixed(1))))}
                        className="px-2 py-0.5 bg-[#141E2B] hover:bg-[#202E42] border border-[#233345] text-white"
                        title="Phóng to"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => setFloorPlanCadZoom(1)}
                        className="px-2 py-0.5 bg-[#141E2B] hover:bg-[#202E42] border border-[#233345] text-gray-300 text-[11px]"
                      >
                        100%
                      </button>
                    </div>
                  )}
                </div>

                {/* THÔNG BÁO CHUYỂN TẦNG NHANH NẾU CĂN ĐANG CHỌN KHÁC TẦNG */}
                {activeUnit && activeUnit.floor !== selectedFloor && (
                  <div className="p-2.5 bg-[#C5A880]/10 border border-[#C5A880]/40 flex items-center justify-between gap-3 text-xs">
                    <div className="text-amber-200">
                      <span>
                        Hồ sơ căn <strong className="text-white font-mono">{activeUnit.code}</strong> (Tầng {activeUnit.floor}), đang xem sơ đồ Tầng {selectedFloor}.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedFloor(activeUnit.floor)}
                      className="px-2.5 py-1 bg-[#C5A880] hover:bg-[#d8bb93] text-[#0D1117] font-bold text-[11px] shrink-0 transition-colors"
                    >
                      Xem Tầng {activeUnit.floor}
                    </button>
                  </div>
                )}

                {/* CHẾ ĐỘ 1: BẢN VẼ SƠ ĐỒ MẶT BẰNG VECTOR CHỮ Z/T ĐA CÁNH THỰC TẾ */}
                {floorPlanViewMode === 'CAD_VECTOR' && (
                  <div className="relative w-full bg-[#080D16] border border-[#1E2C3E] p-3 flex flex-col items-center">
                    <div className="w-full flex items-center justify-between text-[11px] font-mono text-[#C5A880] mb-2 px-1">
                      <span className="flex items-center gap-1.5 font-bold">
                        <Compass className="w-3.5 h-3.5 text-[#C5A880]" />
                        <span>Mặt Bằng Tầng {selectedFloor}</span>
                      </span>
                      <span className="text-gray-400">
                        {currentBlockName} • 21 Căn
                      </span>
                    </div>

                    <svg viewBox="0 0 980 580" className="w-full drop-shadow-2xl">
                      {/* Lưới định vị tọa độ kiến trúc mờ */}
                      <defs>
                        <pattern id="cadGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#162334" strokeWidth="0.6" opacity="0.6" />
                        </pattern>
                      </defs>
                      <rect x="10" y="10" width="960" height="560" fill="url(#cadGrid)" stroke="#1F2E42" strokeWidth="1.5" />

                      {/* LA BÀN ĐỊNH HƯỚNG BẮC (NORTH COMPASS) */}
                      <g transform="translate(60, 55)" className="pointer-events-none opacity-80">
                        <circle cx="0" cy="0" r="24" fill="#0C1420" stroke="#33465E" strokeWidth="1.2" />
                        <polygon points="0,-20 5,-4 0,0 -5,-4" fill="#EF4444" />
                        <polygon points="0,20 5,4 0,0 -5,4" fill="#64748B" />
                        <polygon points="-20,0 -4,5 0,0 -4,-5" fill="#64748B" />
                        <polygon points="20,0 4,5 0,0 4,-5" fill="#64748B" />
                        <text x="0" y="-24" fill="#F8FAFC" fontSize="11" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">B</text>
                      </g>

                      {/* KEY PLAN ĐỊNH VỊ VỊ TRÍ CHUNG CƯ TRONG PHÂN KHU */}
                      <g transform="translate(860, 480)" className="pointer-events-none opacity-85">
                        <rect x="-65" y="-55" width="130" height="110" fill="#0B121C" stroke="#26374E" strokeWidth="1.2" rx="3" />
                        <text x="0" y="-40" fill="#94A3B8" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">KEY PLAN</text>
                        <polygon points="-45,-25 35,-30 45,25 -35,35" fill="#141E2C" stroke="#3B4F68" strokeWidth="1" strokeDasharray="2 2" />
                        <circle cx="0" cy="0" r="10" fill="#EF4444" fillOpacity="0.4" />
                        <circle cx="0" cy="0" r="5" fill="#EF4444" />
                        <text x="0" y="24" fill="#F87171" fontSize="7" fontWeight="bold" fontFamily="monospace" textAnchor="middle">{selectedBlock}</text>
                      </g>

                      {/* ĐƯỜNG BAO SÀN KIẾN TRÚC CHỮ Z/T ĐA CÁNH */}
                      <path
                        d="M 50,160 L 370,160 L 370,40 L 930,40 L 930,190 L 610,190 L 610,430 L 760,430 L 760,560 L 460,560 L 460,440 L 50,440 Z"
                        fill="#0A101A"
                        stroke="#2A3D54"
                        strokeWidth="2.5"
                      />

                      {/* KHU LÕI SẢNH THANG MÁY & HẠ TẦNG KỸ THUẬT TRUNG TÂM (CORE) */}
                      <g>
                        <rect x="380" y="195" width="220" height="230" fill="#111B28" stroke="#33465E" strokeWidth="1.5" />
                        <text x="490" y="215" fill="#E2E8F0" fontSize="9.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                          LÕI THANG MÁY & SẢNH CHỜ TẦNG {selectedFloor}
                        </text>

                        {/* HÀNG THANG MÁY TRÁI: Thang 1, 2, 3 */}
                        <rect x="395" y="230" width="38" height="34" fill="#0D1622" stroke="#38BDF8" strokeWidth="1" />
                        <text x="414" y="250" fill="#38BDF8" fontSize="7.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">P1</text>
                        <text x="414" y="260" fill="#64748B" fontSize="6" textAnchor="middle">Khách</text>

                        <rect x="395" y="270" width="38" height="34" fill="#0D1622" stroke="#38BDF8" strokeWidth="1" />
                        <text x="414" y="290" fill="#38BDF8" fontSize="7.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">P2</text>
                        <text x="414" y="300" fill="#64748B" fontSize="6" textAnchor="middle">Khách</text>

                        <rect x="395" y="310" width="38" height="34" fill="#0D1622" stroke="#38BDF8" strokeWidth="1" />
                        <text x="414" y="330" fill="#38BDF8" fontSize="7.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">P3</text>
                        <text x="414" y="340" fill="#64748B" fontSize="6" textAnchor="middle">Khách</text>

                        {/* HÀNG THANG MÁY PHẢI: Thang 4, 5, 6 */}
                        <rect x="545" y="230" width="38" height="34" fill="#0D1622" stroke="#38BDF8" strokeWidth="1" />
                        <text x="564" y="250" fill="#38BDF8" fontSize="7.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">P4</text>
                        <text x="564" y="260" fill="#64748B" fontSize="6" textAnchor="middle">Khách</text>

                        <rect x="545" y="270" width="38" height="34" fill="#0D1622" stroke="#38BDF8" strokeWidth="1" />
                        <text x="564" y="290" fill="#38BDF8" fontSize="7.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">P5</text>
                        <text x="564" y="300" fill="#64748B" fontSize="6" textAnchor="middle">Khách</text>

                        <rect x="545" y="310" width="38" height="34" fill="#0D1622" stroke="#38BDF8" strokeWidth="1" />
                        <text x="564" y="330" fill="#38BDF8" fontSize="7.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">P6</text>
                        <text x="564" y="340" fill="#64748B" fontSize="6" textAnchor="middle">Khách</text>

                        {/* Thang Hàng & PCCC */}
                        <rect x="445" y="230" width="90" height="34" fill="#1C2634" stroke="#F59E0B" strokeWidth="1.2" />
                        <text x="490" y="250" fill="#FDE68A" fontSize="7.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">THANG PCCC & HÀNG</text>
                        <text x="490" y="260" fill="#F59E0B" fontSize="6" textAnchor="middle">Phòng đệm áp suất</text>

                        {/* 2 Buồng Thang Bộ Thoát Hiểm Chống Khói */}
                        <rect x="445" y="272" width="42" height="72" fill="#0B131E" stroke="#10B981" strokeWidth="1" />
                        <text x="466" y="306" fill="#10B981" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="monospace">THOÁT</text>
                        <text x="466" y="316" fill="#10B981" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="monospace">HIỂM 1</text>

                        <rect x="493" y="272" width="42" height="72" fill="#0B131E" stroke="#10B981" strokeWidth="1" />
                        <text x="514" y="306" fill="#10B981" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="monospace">THOÁT</text>
                        <text x="514" y="316" fill="#10B981" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="monospace">HIỂM 2</text>

                        {/* Sảnh hành lang đệm trung tâm */}
                        <rect x="440" y="352" width="100" height="34" fill="#0A1017" stroke="#1E2B3C" strokeDasharray="2 2" />
                        <text x="490" y="372" fill="#94A3B8" fontSize="7.5" textAnchor="middle" fontFamily="monospace">SẢNH CHỜ THANG MÁY (2.4m)</text>

                        {/* Kỹ thuật điện nước & Gom rác */}
                        <rect x="395" y="392" width="90" height="26" fill="#141E2B" stroke="#475569" strokeWidth="0.8" />
                        <text x="440" y="408" fill="#94A3B8" fontSize="6.5" textAnchor="middle" fontFamily="monospace">PHÒNG RÁC HÚT CHÂN KHÔNG</text>

                        <rect x="495" y="392" width="88" height="26" fill="#141E2B" stroke="#475569" strokeWidth="0.8" />
                        <text x="539" y="408" fill="#94A3B8" fontSize="6.5" textAnchor="middle" fontFamily="monospace">HỘP KỸ THUẬT ĐIỆN - NƯỚC</text>
                      </g>

                      {/* HÀNH LANG KẾT NỐI 3 CÁNH */}
                      <path d="M 60,300 L 380,300" stroke="#33465E" strokeWidth="20" strokeLinecap="square" opacity="0.25" />
                      <text x="210" y="304" fill="#64748B" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">HÀNH LANG TÂY (1.8m)</text>

                      <path d="M 500,105 L 920,105" stroke="#33465E" strokeWidth="20" strokeLinecap="square" opacity="0.25" />
                      <text x="730" y="109" fill="#64748B" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">HÀNH LANG BẮC (1.8m)</text>

                      <path d="M 540,430 L 540,550" stroke="#33465E" strokeWidth="20" strokeLinecap="square" opacity="0.25" />
                      <text x="540" y="490" fill="#64748B" fontSize="7.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle" transform="rotate(-90 540 490)">HÀNH LANG NAM (1.8m)</text>

                      {/* CÁNH 1: CÁNH BẮC (NORTH WING - Căn CH-01 đến CH-05) */}
                      {(() => {
                        const northCoords = [
                          { num: '01', x: 520, y: 48, w: 76, h: 52, isTop: true },
                          { num: '02', x: 604, y: 48, w: 74, h: 52, isTop: true },
                          { num: '03', x: 686, y: 48, w: 74, h: 52, isTop: true },
                          { num: '04', x: 768, y: 48, w: 74, h: 52, isTop: true },
                          { num: '05', x: 850, y: 48, w: 74, h: 52, isTop: true },
                        ];

                        return northCoords.map(pos => {
                          const unit = floorUnits.find(u => u.code.endsWith(`CH-${pos.num}`) || u.code.endsWith(pos.num));
                          const isSelected = selectedAptCode === unit?.code || (selectedFloor === 30 && pos.num === '01' && selectedAptCode === 'CH-01');
                          const isOccupied = unit?.status === 'OCCUPIED';
                          const isMaint = unit?.status === 'MAINTENANCE';
                          const isOwnerSecondary = isOwnerBuilding && selectedFloor === 30 && pos.num === '01';
                          const isDimmed = floorPlanFilterWing !== 'ALL' && floorPlanFilterWing !== 'NORTH';

                          return (
                            <g
                              key={`north-apt-${pos.num}`}
                              onClick={() => unit && setSelectedAptCode(unit.code)}
                              className="cursor-pointer transition-transform hover:opacity-90"
                              style={{ opacity: isDimmed ? 0.2 : 1 }}
                            >
                              <rect
                                x={pos.x}
                                y={pos.y}
                                width={pos.w}
                                height={pos.h}
                                fill={isSelected ? '#143126' : isOwnerSecondary ? '#0E2436' : isOccupied ? '#0B2319' : isMaint ? '#0D253A' : '#101722'}
                                stroke={isSelected ? '#F59E0B' : isOwnerSecondary ? '#38BDF8' : isOccupied ? '#10B981' : isMaint ? '#0284C7' : '#2D3E54'}
                                strokeWidth={isSelected ? 2.5 : isOwnerSecondary ? 2 : 1.2}
                                rx="1"
                              />
                              <rect x={pos.x + 4} y={pos.y + 3} width={pos.w - 8} height="6" fill="#38BDF8" fillOpacity="0.25" stroke="#38BDF8" strokeWidth="0.8" />
                              
                              <text x={pos.x + pos.w / 2} y={pos.y + 22} fill="#FFFFFF" fontSize="8.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                                CH-{pos.num}
                              </text>
                              <text x={pos.x + pos.w / 2} y={pos.y + 33} fill={isOccupied ? '#6EE7B7' : '#94A3B8'} fontSize="7" textAnchor="middle">
                                {pos.num === '01' ? '2PN • 68m²' : pos.num === '02' ? '1PN • 38m²' : pos.num === '03' ? '1PN+ • 46m²' : pos.num === '04' ? '2PN • 59m²' : '2PN • 69m²'}
                              </text>
                              <rect x={pos.x + 8} y={pos.y + 38} width={pos.w - 16} height="10" fill={isOwnerSecondary ? '#0369A1' : isOccupied ? '#065F46' : isMaint ? '#075985' : '#78350F'} />
                              <text x={pos.x + pos.w / 2} y={pos.y + 46} fill="#FFFFFF" fontSize="6" fontWeight="bold" textAnchor="middle">
                                {isOwnerSecondary ? 'CĂN PHỤ' : isOccupied ? 'ĐÃ CÓ CƯ DÂN' : isMaint ? 'NGHIỆM THU' : 'NHÀ TRỐNG'}
                              </text>
                            </g>
                          );
                        });
                      })()}

                      {/* CÁNH 2: CÁNH NAM (SOUTH WING - Căn CH-06 CHỦ HỘ đến CH-10) */}
                      {(() => {
                        const southCoords = [
                          { num: '06', x: 470, y: 440, w: 90, h: 54, isOwnerTarget: true },
                          { num: '07', x: 570, y: 440, w: 90, h: 54 },
                          { num: '08', x: 670, y: 440, w: 85, h: 54 },
                          { num: '09', x: 470, y: 500, w: 140, h: 54 },
                          { num: '10', x: 620, y: 500, w: 135, h: 54 },
                        ];

                        return southCoords.map(pos => {
                          const unit = floorUnits.find(u => u.code.endsWith(`CH-${pos.num}`) || u.code.endsWith(pos.num));
                          const isOwnerTarget = isOwnerBuilding && selectedFloor === 30 && pos.num === '06';
                          const isSelected = selectedAptCode === unit?.code || (isOwnerTarget && selectedAptCode === 'CH-06');
                          const isOccupied = isOwnerTarget || unit?.status === 'OCCUPIED';
                          const isMaint = unit?.status === 'MAINTENANCE';
                          const isDimmed = floorPlanFilterWing !== 'ALL' && floorPlanFilterWing !== 'SOUTH';

                          return (
                            <g
                              key={`south-apt-${pos.num}`}
                              onClick={() => unit && setSelectedAptCode(unit.code)}
                              className="cursor-pointer transition-transform hover:opacity-90"
                              style={{ opacity: isDimmed ? 0.2 : 1 }}
                            >
                              <rect
                                x={pos.x}
                                y={pos.y}
                                width={pos.w}
                                height={pos.h}
                                fill={isSelected ? '#143126' : isOwnerTarget ? '#192E1E' : isOccupied ? '#0B2319' : isMaint ? '#0D253A' : '#101722'}
                                stroke={isSelected ? '#F59E0B' : isOwnerTarget ? '#F59E0B' : isOccupied ? '#10B981' : isMaint ? '#0284C7' : '#2D3E54'}
                                strokeWidth={isOwnerTarget ? 2.5 : isSelected ? 2.2 : 1.2}
                                filter={isOwnerTarget ? 'url(#unitGlow)' : undefined}
                                rx="1"
                              />

                              <rect x={pos.x + 4} y={pos.y + pos.h - 8} width={pos.w - 8} height="5" fill="#38BDF8" fillOpacity="0.3" stroke="#38BDF8" strokeWidth="0.8" />

                              {isOwnerTarget && (
                                <g>
                                  <rect x={pos.x + 2} y={pos.y + 2} width={pos.w - 4} height="13" fill="#F59E0B" />
                                  <text x={pos.x + pos.w / 2} y={pos.y + 11.5} fill="#000000" fontSize="7.5" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">
                                    👑 CĂN CHỦ HỘ (LỰC)
                                  </text>
                                </g>
                              )}

                              <text x={pos.x + pos.w / 2} y={pos.y + (isOwnerTarget ? 26 : 19)} fill="#FFFFFF" fontSize={isOwnerTarget ? "10" : "8.5"} fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                                CH-{pos.num}
                              </text>
                              <text x={pos.x + pos.w / 2} y={pos.y + (isOwnerTarget ? 37 : 30)} fill={isOccupied ? '#6EE7B7' : '#94A3B8'} fontSize="7" textAnchor="middle">
                                {pos.num === '06' ? '1PN • 42m² (View Hồ Bơi)' : pos.num === '07' ? '2PN • 59m²' : pos.num === '08' ? '1PN • 46m²' : pos.num === '09' ? '2PN Góc • 69m²' : 'Studio • 35m²'}
                              </text>
                              
                              <rect x={pos.x + 8} y={pos.y + (isOwnerTarget ? 41 : 36)} width={pos.w - 16} height="10" fill={isOwnerTarget ? '#065F46' : isOccupied ? '#065F46' : '#78350F'} />
                              <text x={pos.x + pos.w / 2} y={pos.y + (isOwnerTarget ? 48.5 : 43.5)} fill="#FFFFFF" fontSize="6.5" fontWeight="bold" textAnchor="middle">
                                {isOwnerTarget ? activeOwnerName : isOccupied ? 'CÓ CƯ DÂN' : 'NHÀ TRỐNG'}
                              </text>
                            </g>
                          );
                        });
                      })()}

                      {/* CÁNH 3: CÁNH TÂY (WEST WING - Dãy căn CH-11 đến CH-21) */}
                      {(() => {
                        const westCoords = [
                          { num: '11', x: 60, y: 170, w: 58, h: 58 },
                          { num: '12', x: 122, y: 170, w: 58, h: 58 },
                          { num: '13', x: 184, y: 170, w: 58, h: 58 },
                          { num: '14', x: 246, y: 170, w: 58, h: 58 },
                          { num: '15', x: 308, y: 170, w: 58, h: 58 },
                          { num: '16', x: 60, y: 370, w: 48, h: 62 },
                          { num: '17', x: 112, y: 370, w: 48, h: 62 },
                          { num: '18', x: 164, y: 370, w: 48, h: 62 },
                          { num: '19', x: 216, y: 370, w: 48, h: 62 },
                          { num: '20', x: 268, y: 370, w: 48, h: 62 },
                          { num: '21', x: 320, y: 370, w: 48, h: 62 },
                        ];

                        return westCoords.map(pos => {
                          const unit = floorUnits.find(u => u.code.endsWith(`CH-${pos.num}`) || u.code.endsWith(pos.num));
                          const isSelected = selectedAptCode === unit?.code;
                          const isOccupied = unit?.status === 'OCCUPIED';
                          const isMaint = unit?.status === 'MAINTENANCE';
                          const isDimmed = floorPlanFilterWing !== 'ALL' && floorPlanFilterWing !== 'WEST';

                          return (
                            <g
                              key={`west-apt-${pos.num}`}
                              onClick={() => unit && setSelectedAptCode(unit.code)}
                              className="cursor-pointer transition-transform hover:opacity-90"
                              style={{ opacity: isDimmed ? 0.2 : 1 }}
                            >
                              <rect
                                x={pos.x}
                                y={pos.y}
                                width={pos.w}
                                height={pos.h}
                                fill={isSelected ? '#143126' : isOccupied ? '#0B2319' : isMaint ? '#0D253A' : '#101722'}
                                stroke={isSelected ? '#F59E0B' : isOccupied ? '#10B981' : isMaint ? '#0284C7' : '#2D3E54'}
                                strokeWidth={isSelected ? 2.2 : 1.1}
                                rx="1"
                              />
                              <text x={pos.x + pos.w / 2} y={pos.y + 18} fill="#FFFFFF" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                                CH-{pos.num}
                              </text>
                              <text x={pos.x + pos.w / 2} y={pos.y + 28} fill={isOccupied ? '#6EE7B7' : '#94A3B8'} fontSize="6.5" textAnchor="middle">
                                {unit?.area || 60}m²
                              </text>
                              <rect x={pos.x + 4} y={pos.y + pos.h - 14} width={pos.w - 8} height="9" fill={isOccupied ? '#065F46' : isMaint ? '#075985' : '#78350F'} />
                              <text x={pos.x + pos.w / 2} y={pos.y + pos.h - 7} fill="#FFFFFF" fontSize="5.5" fontWeight="bold" textAnchor="middle">
                                {isOccupied ? 'CÓ CƯ DÂN' : isMaint ? 'NGHIỆM THU' : 'TRỐNG'}
                              </text>
                            </g>
                          );
                        });
                      })()}
                    </svg>
                  </div>
                )}

                {/* CHẾ ĐỘ 2: BẢN VẼ KỸ THUẬT CAD GỐC (BẢO LƯU ẢNH THIẾT KẾ CỦA DỰ ÁN) */}
                {floorPlanViewMode === 'BLUEPRINT_IMAGE' && (
                  <div className="relative w-full bg-[#080D16] border border-[#1E2C3E] p-3 flex flex-col items-center overflow-hidden">
                    <div className="w-full flex items-center justify-between text-[11px] font-mono text-[#C5A880] mb-2 px-1">
                      <span className="flex items-center gap-1.5 font-bold">
                        <FileText className="w-3.5 h-3.5 text-[#C5A880]" />
                        <span>Bản Vẽ Mặt Bằng CAD</span>
                      </span>
                      <span className="text-gray-400">
                        Chung Cư BS-09
                      </span>
                    </div>

                    <div className="w-full h-[480px] flex items-center justify-center overflow-auto bg-[#04060A] border border-[#192433] p-2">
                      <div 
                        className="transition-transform duration-200 ease-out inline-block cursor-grab active:cursor-grabbing"
                        style={{
                          transform: `scale(${floorPlanCadZoom})`,
                          transformOrigin: 'center center'
                        }}
                      >
                        <img
                          src="/masterplan/the-tropical-floorplan-cad.png"
                          alt="Bản vẽ CAD The Tropical"
                          className="max-h-[460px] w-auto object-contain mx-auto shadow-2xl border border-[#233345]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* DANH SÁCH 21 CĂN HỘ TẦNG HIỆN TẠI (GRID THẺ CĂN HỘ ĐẦY ĐỦ) */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs font-mono text-gray-400">
                    <span>Danh Mục 21 Căn Hộ Tầng {selectedFloor} • {currentBlockName}:</span>
                    <button
                      type="button"
                      onClick={() => setIsFloorPlanExpanded(true)}
                      className="text-[#C5A880] hover:text-white underline text-[11px]"
                    >
                      Mở Rộng Toàn Cảnh (Deep-Dive) ↗
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                    {floorUnits.map(unit => {
                      const num = unit.code.replace(/\D/g, '').slice(-2);
                      const isOwnerPrimary = isOwnerBuilding && selectedFloor === 30 && num === '06';
                      const isOwnerSecondary = isOwnerBuilding && selectedFloor === 30 && num === '01';
                      const isSelected = selectedAptCode === unit.code || (isOwnerPrimary && selectedAptCode === 'CH-06');
                      const isOccupied = unit.status === 'OCCUPIED';
                      const isMaint = unit.status === 'MAINTENANCE';
                      const fin = getApartmentFinancialMetrics(unit);

                      return (
                        <button
                          key={unit.code}
                          type="button"
                          onClick={() => setSelectedAptCode(unit.code)}
                          className={`p-2 border text-left transition-all relative overflow-hidden ${
                            isSelected
                              ? 'bg-[#1C2533] border-[#C5A880] ring-1 ring-[#C5A880] shadow-lg'
                              : isOwnerPrimary
                              ? 'bg-[#15231B] border-[#F59E0B]/70'
                              : 'bg-[#121820] border-[#222B35] hover:border-gray-600'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs font-mono font-bold text-white">
                            <span className="truncate">{unit.code}</span>
                            <span className={`text-[8px] px-1 py-0.2 border ${
                              isOwnerPrimary
                                ? 'bg-amber-950 text-amber-300 border-amber-500'
                                : isOwnerSecondary
                                ? 'bg-sky-950 text-sky-300 border-sky-500'
                                : isOccupied
                                ? 'bg-emerald-950 text-emerald-400 border-emerald-500'
                                : isMaint
                                ? 'bg-sky-950 text-sky-400 border-sky-600'
                                : 'bg-[#18202A] text-gray-400 border-gray-600'
                            }`}>
                              {isOwnerPrimary ? 'CHỦ HỘ' : isOwnerSecondary ? 'CĂN PHỤ' : isOccupied ? 'ĐÃ Ở' : isMaint ? 'THU' : 'TRỐNG'}
                            </span>
                          </div>
                          <div className="text-[9.5px] text-gray-400 mt-1 truncate">
                            {unit.typeLabel} • {unit.area}m²
                          </div>
                          <div className="mt-1.5 pt-1 border-t border-[#1E293B] flex items-center justify-between text-[9px] font-mono">
                            <span className="text-amber-300">{fin ? fin.electricKwh : 0} kWh</span>
                            <span className="text-emerald-400 font-bold">{fin ? (fin.totalBqlRevenue / 1000000).toFixed(1) + ' tr' : '0 tr'}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>
            );
          })()}

          {/* ----------------------------------------------------------- */}
          {/* GÓC NHÌN 3: DANH SÁCH LƯỚI TẤT CẢ CĂN HỘ                    */}
          {/* ----------------------------------------------------------- */}
          {buildingPerspective === 'GRID' && (
            <div className="p-4 bg-[#05070A] h-[540px] sm:h-[600px] overflow-y-auto space-y-3">
              <div className="text-xs text-gray-400 font-mono mb-2 flex items-center justify-between">
                <span>Danh Sách Căn Hộ ({filteredUnits.length} căn phù hợp):</span>
                <span className="text-[11px] text-[#C5A880]">Nhấn vào từng ô để xem chi tiết bên phải</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {filteredUnits.map(unit => {
                  const isSelected = unit.code === selectedAptCode;
                  const isOccupied = unit.status === 'OCCUPIED';
                  const isMaint = unit.status === 'MAINTENANCE';

                  return (
                    <div
                      key={unit.code}
                      onClick={() => setSelectedAptCode(unit.code)}
                      className={`p-3 rounded-none border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#1C2533] border-[#C5A880] ring-1 ring-[#C5A880] shadow-xl'
                          : 'bg-[#121820] border-[#222B35] hover:border-gray-600'
                      }`}
                    >
                      <div>
                        <div className="font-serif text-base font-bold text-white flex items-center gap-2">
                          <span>Căn {unit.code}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-none bg-[#161B22] border border-gray-700 text-[#C5A880] font-sans">
                            {unit.typeLabel}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {unit.towerName} • Tầng {unit.floor} • {unit.area} m²
                        </div>
                        {isOccupied && unit.owner?.name && (
                          <div className="text-[11px] text-emerald-400 mt-1 font-medium truncate">
                            {unit.owner.name}
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-none border ${
                          isOccupied
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                            : isMaint
                            ? 'bg-blue-950 text-blue-300 border-blue-500'
                            : 'bg-amber-950 text-amber-300 border-amber-500'
                        }`}>
                          {isOccupied ? 'Đã Ở' : isMaint ? 'Nghiệm Thu' : 'Trống'}
                        </span>
                        <div className="text-[11px] font-mono text-[#C5A880] mt-1.5 font-bold">
                          {unit.priceBillion} tỷ VNĐ
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------- */}
          {/* GÓC NHÌN 5: BẢN ĐỒ QUY HOẠCH ĐÔ THỊ & KIẾN TRÚC PHÂN KHU    */}
          {/* ----------------------------------------------------------- */}
          {buildingPerspective === 'MASTER_PLAN' && (
            <div className="p-3 sm:p-4 bg-[#0A0E17] h-[660px] sm:h-[760px] overflow-y-auto space-y-4 no-scrollbar select-none">
              
              {/* SUB-VIEW 1: PHÂN KHU THE TROPICAL - BẢN ĐỒ NỘI KHU 18 TIỆN ÍCH */}
              {masterPlanTab === 'TROPICAL' && (
                <div className="space-y-3.5">
                  {/* Thanh điều hướng 4 chung cư */}
                  <div className="p-3 bg-[#111622] border border-[#222E3E] space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                      <div>
                        <span className="text-[#C5A880] font-mono font-bold tracking-wider uppercase text-[11px] flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
                          BẢN ĐỒ NỘI KHU PHÂN KHU THE TROPICAL (18 TIỆN ÍCH)
                        </span>
                        <div className="text-gray-400 text-[11px] mt-0.5">
                          Rê chuột vào điểm ghim trên bản đồ hoặc danh sách bên dưới để xem chi tiết vị trí & khoảng cách
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/70 border border-emerald-500/50 px-2 py-0.5 self-start sm:self-auto shrink-0">
                        Đang vận hành: {selectedBlock}
                      </span>
                    </div>

                    {/* Bộ chuyển nhanh 4 Chung Cư */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      {[
                        { code: 'BS-07', floors: 34, units: 714, loc: 'Trục Rodeo' },
                        { code: 'BS-08', floors: 39, units: 819, loc: 'Vườn Cọ' },
                        { code: 'BS-09', floors: 34, units: 714, loc: 'Hồ Nhiệt Đới' },
                        { code: 'BS-10', floors: 34, units: 714, loc: 'Sân Malibu' },
                      ].map((item) => {
                        const isCurrent = selectedBlock === item.code;
                        return (
                          <button
                            key={item.code}
                            type="button"
                            onClick={() => handleSwitchBlock(item.code as any)}
                            className={`p-2 border text-left transition-all relative ${
                              isCurrent
                                ? 'bg-[#1E2A38] border-[#C5A880] ring-1 ring-[#C5A880]'
                                : 'bg-[#141C27] border-[#223042] hover:border-gray-500 text-gray-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className={`font-mono font-bold text-xs ${isCurrent ? 'text-[#C5A880]' : 'text-white'}`}>
                                Chung Cư {item.code}
                              </span>
                              {isCurrent && (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              )}
                            </div>
                            <div className="text-[10px] text-gray-400 mt-0.5 flex justify-between font-mono">
                              <span>{item.floors} Tầng • {item.units} Căn</span>
                            </div>
                            <div className="text-[9.5px] text-[#C5A880]/80 mt-0.5 truncate">
                              {item.loc}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bản đồ hình ảnh Phân khu The Tropical với GHIM TIỆN ÍCH TƯƠNG TÁC (INTERACTIVE PINS) */}
                  <div className="relative bg-[#070A0F] border border-[#222E3E] rounded-none overflow-hidden group shadow-2xl">
                    <img
                      src="/masterplan/the-tropical-masterplan.png"
                      alt="Quy hoạch The Tropical"
                      className="w-full h-auto object-contain max-h-[380px] sm:max-h-[420px] mx-auto block cursor-pointer transition-transform duration-300 group-hover:scale-[1.01]"
                      onClick={() => setIsMasterPlanZoomed(true)}
                    />

                    {/* OVERLAY GHIM TIỆN ÍCH NỘI KHU TƯƠNG TÁC */}
                    <div className="absolute inset-0 pointer-events-none">
                      {THE_TROPICAL_AMENITIES.map((item) => {
                        const isHovered = hoveredAmenityId === item.id;
                        const isSelected = selectedAmenityId === item.id;
                        const isActive = isHovered || isSelected;
                        return (
                          <div
                            key={item.id}
                            style={{ left: `${item.x}%`, top: `${item.y}%` }}
                            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-pointer z-20 group"
                            onMouseEnter={() => setHoveredAmenityId(item.id)}
                            onMouseLeave={() => setHoveredAmenityId(null)}
                            onClick={() => setSelectedAmenityId(isSelected ? null : item.id)}
                          >
                            {/* Vòng sóng pulse khi hover */}
                            {isActive && (
                              <span className="absolute -inset-2.5 rounded-full bg-[#C5A880]/60 animate-ping pointer-events-none" />
                            )}

                            {/* Badge ghim tròn */}
                            <div className={`px-2 py-0.5 rounded-full font-mono text-[9.5px] font-bold flex items-center gap-1 transition-all shadow-2xl border ${
                              isActive
                                ? 'bg-[#C5A880] text-black border-white scale-125 z-30 ring-2 ring-[#C5A880]/80'
                                : item.category === 'POOL'
                                ? 'bg-cyan-950/90 text-cyan-300 border-cyan-500/70 hover:scale-115 hover:border-cyan-300'
                                : item.category === 'SPORT'
                                ? 'bg-amber-950/90 text-amber-300 border-amber-500/70 hover:scale-115 hover:border-amber-300'
                                : item.category === 'PARK'
                                ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/70 hover:scale-115 hover:border-emerald-300'
                                : 'bg-[#121B27]/90 text-gray-200 border-[#2C3F58] hover:scale-115 hover:border-gray-300'
                            }`}>
                              <span>{item.id}</span>
                              {isActive && (
                                <span className="text-[9.5px] max-w-[110px] truncate">{item.name}</span>
                              )}
                            </div>

                            {/* TOOLTIP BAY NỔI KHI RÊ CHUỘT HOẶC CHỌN */}
                            {isActive && (
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 sm:w-72 bg-[#0C121D]/95 backdrop-blur-md border border-[#C5A880] p-3 shadow-2xl z-40 text-left pointer-events-none animate-fadeIn">
                                <div className="flex items-center justify-between gap-1.5 border-b border-[#233346] pb-1.5">
                                  <span className="text-[10px] px-1.5 py-0.5 bg-[#C5A880] text-black font-bold font-mono">
                                    Vị trí {item.id}
                                  </span>
                                  <span className="text-[10.5px] text-cyan-300 font-mono">
                                    {item.distance}
                                  </span>
                                </div>
                                <div className="text-white font-bold text-xs mt-1.5 leading-snug">
                                  {item.name}
                                </div>
                                <div className="text-gray-300 text-[11px] mt-1 leading-relaxed">
                                  {item.desc}
                                </div>
                                <div className="mt-2 pt-1.5 border-t border-[#1F2C3D] flex items-center justify-between text-[10px] text-gray-400 font-mono">
                                  <span>Tiện ích cư dân</span>
                                  <span className="text-emerald-400 font-bold">✓ Hoạt động 24/7</span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Nút phóng to nổi góc trên */}
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
                      <button
                        type="button"
                        onClick={() => setIsMasterPlanZoomed(true)}
                        className="px-2.5 py-1 bg-black/80 hover:bg-[#C5A880] text-white hover:text-black border border-[#C5A880]/50 text-[11px] font-mono font-bold transition-all flex items-center gap-1 shadow-lg backdrop-blur-sm"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>Phóng To Chi Tiết</span>
                      </button>
                    </div>

                    {/* La bàn / Định vị hướng góc dưới */}
                    <div className="absolute bottom-2.5 left-2.5 px-2 py-1 bg-black/80 border border-[#233345] text-[10px] font-mono text-gray-300 backdrop-blur-sm flex items-center gap-2 z-10">
                      <Navigation className="w-3 h-3 text-[#C5A880]" />
                      <span>Hướng Bắc (N) • Trục Vành Đai 3 & Đại Lộ Rodeo</span>
                    </div>
                  </div>

                  {/* Danh bạ 18 Tiện Ích Nội Khu The Tropical (HOVER XEM TIỆN ÍCH TRÊN BẢN ĐỒ) */}
                  <div className="p-3 bg-[#111622] border border-[#222E3E] space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-white">
                        <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
                        <span>18 TIỆN ÍCH NỘI KHU THE TROPICAL</span>
                        <span className="text-gray-400 font-normal">({THE_TROPICAL_AMENITIES.length} hạng mục)</span>
                      </div>

                      {/* Bộ lọc loại tiện ích */}
                      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar font-mono text-[10.5px]">
                        {[
                          { key: 'ALL', label: 'Tất Cả' },
                          { key: 'POOL', label: 'Bể Bơi' },
                          { key: 'PARK', label: 'Cảnh Quan' },
                          { key: 'SPORT', label: 'Thể Thao' },
                          { key: 'ACCESS', label: 'Hạ Tầng' },
                        ].map((c) => (
                          <button
                            key={c.key}
                            type="button"
                            onClick={() => setSelectedAmenityCategory(c.key as any)}
                            className={`px-2 py-0.5 border transition-all ${
                              selectedAmenityCategory === c.key
                                ? 'bg-[#C5A880] text-black font-bold border-[#C5A880]'
                                : 'bg-[#161F2C] text-gray-400 border-[#253346] hover:text-white'
                            }`}
                          >
                            {c.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Lưới danh mục tiện ích: HOVER VÀO THẺ ĐỂ SÁNG GHIM TRÊN BẢN ĐỒ */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-[220px] overflow-y-auto no-scrollbar pr-1">
                      {THE_TROPICAL_AMENITIES
                        .filter(item => selectedAmenityCategory === 'ALL' || item.category === selectedAmenityCategory)
                        .map((item) => {
                          const isHovered = hoveredAmenityId === item.id;
                          const isSel = selectedAmenityId === item.id;
                          const isHighlighted = isHovered || isSel;
                          return (
                            <div
                              key={item.id}
                              onMouseEnter={() => setHoveredAmenityId(item.id)}
                              onMouseLeave={() => setHoveredAmenityId(null)}
                              onClick={() => setSelectedAmenityId(isSel ? null : item.id)}
                              className={`p-2 border text-left cursor-pointer transition-all ${
                                isHighlighted
                                  ? 'bg-[#1C2838] border-[#C5A880] ring-1 ring-[#C5A880]'
                                  : 'bg-[#131A24] border-[#222E3E] hover:border-gray-600'
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                <span className={`w-5 h-5 rounded-none flex items-center justify-center font-mono font-bold text-[10px] shrink-0 ${
                                  isHighlighted
                                    ? 'bg-[#C5A880] text-black border border-white'
                                    : item.category === 'POOL'
                                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60'
                                    : item.category === 'PARK'
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                                    : item.category === 'SPORT'
                                    ? 'bg-amber-950 text-amber-300 border border-amber-700/60'
                                    : 'bg-indigo-950 text-indigo-300 border border-indigo-700/60'
                                }`}>
                                  {item.id}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between">
                                    <div className="text-[11.5px] font-bold text-white truncate">
                                      {item.name}
                                    </div>
                                    <span className="text-[9.5px] font-mono text-cyan-300 shrink-0 ml-1">
                                      {item.distance.replace('Cách BS-07: ', '')}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-gray-400 mt-0.5 line-clamp-2 leading-snug">
                                    {item.desc}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-VIEW 2: TIỆN ÍCH XUNG QUANH CỦA DỰ ÁN & KHU DÂN CƯ */}
              {masterPlanTab === 'SURROUNDINGS' && (
                <div className="space-y-3.5">
                  <div className="p-3 bg-[#111622] border border-[#222E3E] space-y-1">
                    <div className="text-[#C5A880] font-mono font-bold tracking-wider uppercase text-[11px] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
                      <span>HỆ THỐNG TIỆN ÍCH XUNG QUANH DỰ ÁN & KHU DÂN CƯ</span>
                    </div>
                    <div className="text-gray-400 text-[11px]">
                      Rê chuột xem danh sách hoặc các điểm ghim trên bản đồ để khám phá tiện ích đẳng cấp xung quanh chung cư
                    </div>
                  </div>

                  {/* Bản đồ tiện ích xung quanh khu dân cư với ghim tương tác */}
                  <div className="relative bg-[#070A0F] border border-[#222E3E] rounded-none overflow-hidden group shadow-2xl">
                    <img
                      src="/masterplan/vinhomes-amenities-map.jpg"
                      alt="Tiện ích xung quanh khu dân cư"
                      className="w-full h-auto object-contain max-h-[380px] sm:max-h-[420px] mx-auto block cursor-pointer transition-transform duration-300 group-hover:scale-[1.01]"
                      onClick={() => setIsMasterPlanZoomed(true)}
                    />

                    {/* OVERLAY GHIM TIỆN ÍCH XUNG QUANH */}
                    <div className="absolute inset-0 pointer-events-none">
                      {SURROUNDING_AMENITIES.map((sur) => {
                        const isHovered = hoveredAmenityId === sur.id;
                        const isSelected = selectedAmenityId === sur.id;
                        const isActive = isHovered || isSelected;
                        return (
                          <div
                            key={sur.id}
                            style={{ left: `${sur.x}%`, top: `${sur.y}%` }}
                            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-pointer z-20 group"
                            onMouseEnter={() => setHoveredAmenityId(sur.id)}
                            onMouseLeave={() => setHoveredAmenityId(null)}
                            onClick={() => setSelectedAmenityId(isSelected ? null : sur.id)}
                          >
                            {/* Ping ring */}
                            {isActive && (
                              <span className="absolute -inset-2.5 rounded-full bg-[#C5A880]/60 animate-ping pointer-events-none" />
                            )}

                            {/* Badge */}
                            <div className={`px-2 py-0.5 rounded-full font-mono text-[9.5px] font-bold flex items-center gap-1 transition-all shadow-2xl border ${
                              isActive
                                ? 'bg-[#C5A880] text-black border-white scale-125 z-30 ring-2 ring-[#C5A880]/80'
                                : 'bg-[#0E1624]/90 text-[#C5A880] border-[#C5A880]/70 hover:scale-115'
                            }`}>
                              <span>{sur.id.replace('SUR-', '#')}</span>
                              {isActive && (
                                <span className="text-[9.5px] max-w-[120px] truncate">{sur.name}</span>
                              )}
                            </div>

                            {/* Tooltip bay nổi */}
                            {isActive && (
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 sm:w-72 bg-[#0C121D]/95 backdrop-blur-md border border-[#C5A880] p-3 shadow-2xl z-40 text-left pointer-events-none animate-fadeIn">
                                <div className="flex items-center justify-between gap-1.5 border-b border-[#233346] pb-1.5">
                                  <span className="text-[10px] px-1.5 py-0.5 bg-[#C5A880] text-black font-bold font-mono">
                                    {sur.categoryLabel}
                                  </span>
                                  <span className="text-[10.5px] text-cyan-300 font-mono">
                                    {sur.distance} ({sur.walkTime})
                                  </span>
                                </div>
                                <div className="text-white font-bold text-xs mt-1.5 leading-snug">
                                  {sur.name}
                                </div>
                                <div className="text-gray-300 text-[11px] mt-1 leading-relaxed">
                                  {sur.desc}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Nút phóng to nổi góc trên */}
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
                      <button
                        type="button"
                        onClick={() => setIsMasterPlanZoomed(true)}
                        className="px-2.5 py-1 bg-black/80 hover:bg-[#C5A880] text-white hover:text-black border border-[#C5A880]/50 text-[11px] font-mono font-bold transition-all flex items-center gap-1 shadow-lg backdrop-blur-sm"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>Phóng To Bản Đồ</span>
                      </button>
                    </div>
                  </div>

                  {/* Danh sách các tiện ích xung quanh của dự án & khu dân cư (HOVER XEM TIỆN ÍCH) */}
                  <div className="p-3 bg-[#111622] border border-[#222E3E] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-[#C5A880]" />
                        <span>DANH SÁCH 8 ĐẠI TIỆN ÍCH XUNG QUANH KHU DÂN CƯ</span>
                      </div>
                      <span className="text-[10px] font-mono text-cyan-300">
                        Bán kính: 50m - 750m
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[240px] overflow-y-auto no-scrollbar pr-1">
                      {SURROUNDING_AMENITIES.map((sur) => {
                        const isHovered = hoveredAmenityId === sur.id;
                        const isSel = selectedAmenityId === sur.id;
                        const isHighlighted = isHovered || isSel;
                        return (
                          <div
                            key={sur.id}
                            onMouseEnter={() => setHoveredAmenityId(sur.id)}
                            onMouseLeave={() => setHoveredAmenityId(null)}
                            onClick={() => setSelectedAmenityId(isSel ? null : sur.id)}
                            className={`p-2.5 border text-left cursor-pointer transition-all ${
                              isHighlighted
                                ? 'bg-[#1C2838] border-[#C5A880] ring-1 ring-[#C5A880]'
                                : 'bg-[#131A24] border-[#222E3E] hover:border-gray-600'
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <span className={`w-6 h-6 rounded-none flex items-center justify-center font-mono font-bold text-[10px] shrink-0 ${
                                isHighlighted
                                  ? 'bg-[#C5A880] text-black border border-white'
                                  : 'bg-[#182333] text-[#C5A880] border border-[#283C57]'
                              }`}>
                                {sur.id.replace('SUR-', '')}
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between">
                                  <div className="text-xs font-bold text-white truncate">
                                    {sur.name}
                                  </div>
                                  <span className="text-[10px] text-cyan-300 font-mono shrink-0 ml-1">
                                    {sur.distance}
                                  </span>
                                </div>
                                <div className="text-[10.5px] text-[#C5A880] font-mono mt-0.5">
                                  {sur.categoryLabel} • {sur.walkTime}
                                </div>
                                <div className="text-[10.5px] text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                                  {sur.desc}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-VIEW 2: MẶT BẰNG TẦNG ĐIỂN HÌNH BẢN VẼ KIẾN TRÚC CAD */}
              {masterPlanTab === 'CAD_FLOOR' && (
                <div className="space-y-3.5">
                  <div className="p-3 bg-[#111622] border border-[#222E3E] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="text-[#C5A880] font-mono font-bold tracking-wider uppercase text-[11px]">
                        MẶT BẰNG TẦNG ĐIỂN HÌNH KIẾN TRÚC CAD (BS-07 & BS-09)
                      </div>
                      <div className="text-gray-400 text-[11px] mt-0.5">
                        Layout thiết kế 21 căn hộ/sàn • Key Plan định vị hướng & trục giao thông đứng
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setBuildingPerspective('FLOOR_PLAN')}
                      className="px-3 py-1 bg-[#C5A880] hover:bg-white text-black font-bold text-[11px] font-mono transition-all self-start sm:self-auto shrink-0 flex items-center gap-1"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Xem Mặt Bằng Tương Tác</span>
                    </button>
                  </div>

                  {/* Bản vẽ CAD */}
                  <div className="relative bg-[#070A0F] border border-[#222E3E] rounded-none overflow-hidden group shadow-2xl">
                    <img
                      src="/masterplan/the-tropical-floorplan-cad.png"
                      alt="Mặt bằng tầng CAD"
                      className="w-full h-auto object-contain max-h-[460px] mx-auto block cursor-pointer transition-transform duration-300 group-hover:scale-[1.01]"
                      onClick={() => setIsMasterPlanZoomed(true)}
                    />
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setIsMasterPlanZoomed(true)}
                        className="px-2.5 py-1 bg-black/80 hover:bg-[#C5A880] text-white hover:text-black border border-[#C5A880]/50 text-[11px] font-mono font-bold transition-all flex items-center gap-1 shadow-lg backdrop-blur-sm"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>Phóng To Bản Vẽ CAD</span>
                      </button>
                    </div>
                  </div>

                  {/* Thông số kỹ thuật kiến trúc mặt bằng */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                    <div className="p-2.5 bg-[#111622] border border-[#222E3E]">
                      <div className="text-gray-400 text-[10px]">Cơ Cấu Sàn:</div>
                      <div className="text-white font-bold text-sm mt-0.5">21 Căn / Sàn</div>
                      <div className="text-[10px] text-[#C5A880] mt-0.5">CH-01 đến CH-21</div>
                    </div>
                    <div className="p-2.5 bg-[#111622] border border-[#222E3E]">
                      <div className="text-gray-400 text-[10px]">Thang Máy:</div>
                      <div className="text-white font-bold text-sm mt-0.5">6 Cư Dân + 1 PCCC</div>
                      <div className="text-[10px] text-emerald-400 mt-0.5">Tốc độ cao 3.0 m/s</div>
                    </div>
                    <div className="p-2.5 bg-[#111622] border border-[#222E3E]">
                      <div className="text-gray-400 text-[10px]">Thoát Hiểm:</div>
                      <div className="text-white font-bold text-sm mt-0.5">2 Buồng Thang Bộ</div>
                      <div className="text-[10px] text-cyan-400 mt-0.5">Áp suất dương chống khói</div>
                    </div>
                    <div className="p-2.5 bg-[#111622] border border-[#222E3E]">
                      <div className="text-gray-400 text-[10px]">Hướng Đối Lưu:</div>
                      <div className="text-white font-bold text-sm mt-0.5">Đông Nam - Tây Bắc</div>
                      <div className="text-[10px] text-amber-300 mt-0.5">View hồ bơi & đại lộ</div>
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-VIEW 3: QUY HOẠCH TỔNG THỂ ĐẠI ĐÔ THỊ VINHOMES GRAND PARK */}
              {masterPlanTab === 'MACRO' && (
                <div className="space-y-3.5">
                  <div className="p-3 bg-[#111622] border border-[#222E3E] space-y-1">
                    <div className="text-[#C5A880] font-mono font-bold tracking-wider uppercase text-[11px]">
                      QUY HOẠCH TỔNG THỂ ĐẠI ĐÔ THỊ VINHOMES GRAND PARK (271 HA)
                    </div>
                    <div className="text-gray-400 text-[11px]">
                      Vị trí chiến lược phân khu The Beverly Solari (The Tropical) trong cấu trúc đô thị và kết nối tiện ích vùng
                    </div>
                  </div>

                  {/* Bản đồ đại đô thị */}
                  <div className="relative bg-[#070A0F] border border-[#222E3E] rounded-none overflow-hidden group shadow-2xl">
                    <img
                      src="/masterplan/vinhomes-grand-park-macro-plan.jpg"
                      alt="Quy hoạch đại đô thị"
                      className="w-full h-auto object-contain max-h-[460px] mx-auto block cursor-pointer transition-transform duration-300 group-hover:scale-[1.01]"
                      onClick={() => setIsMasterPlanZoomed(true)}
                    />
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setIsMasterPlanZoomed(true)}
                        className="px-2.5 py-1 bg-black/80 hover:bg-[#C5A880] text-white hover:text-black border border-[#C5A880]/50 text-[11px] font-mono font-bold transition-all flex items-center gap-1 shadow-lg backdrop-blur-sm"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>Phóng To Bản Đồ</span>
                      </button>
                    </div>
                  </div>

                  {/* Hạ tầng trọng điểm */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
                    <div className="p-2.5 bg-[#111622] border border-[#222E3E]">
                      <div className="text-[#C5A880] font-bold">TTTM Vincom Mega Mall</div>
                      <div className="text-gray-400 text-[10.5px] mt-1">
                        Trung tâm thương mại lớn nhất miền Nam, cách The Tropical 2 phút dạo bộ
                      </div>
                    </div>
                    <div className="p-2.5 bg-[#111622] border border-[#222E3E]">
                      <div className="text-emerald-400 font-bold">Đại Công Viên 36ha</div>
                      <div className="text-gray-400 text-[10.5px] mt-1">
                        Hồ cảnh quan cát trắng, bãi biển nhân tạo và 15 công viên chủ đề liên hoàn
                      </div>
                    </div>
                    <div className="p-2.5 bg-[#111622] border border-[#222E3E]">
                      <div className="text-cyan-400 font-bold">Vành Đai 3 & Tuyến VinBus</div>
                      <div className="text-gray-400 text-[10.5px] mt-1">
                        Huyết mạch giao thông kết nối liên vùng & mạng lưới xe buýt điện thông minh
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

        {/* CỘT PHẢI (5 COLS): THÔNG TIN CHI TIẾT CĂN HỘ (GỌN GÀNG, DỄ TƯƠNG TÁC) */}
        <div className="lg:col-span-5 bg-[#0D1117] border border-[#222B35] rounded-none p-4 shadow-2xl min-h-[660px] sm:min-h-[760px] flex flex-col justify-between overflow-hidden">
          
          {activeUnit ? (
            <div className="flex flex-col h-full justify-between">
              <div className="space-y-3 overflow-y-auto pr-1 no-scrollbar flex-1">
                {/* 1. Tiêu đề & Trạng thái căn */}
                <div className="border-b border-[#222B35] pb-2.5 flex items-start justify-between">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-[#C5A880] font-mono font-semibold">
                      {activeUnit.towerName} • TẦNG {activeUnit.floor}
                    </div>
                    <h3 className="font-serif text-xl sm:text-2xl font-bold text-white mt-0.5">
                      Căn Hộ {activeUnit.code}
                    </h3>
                  </div>

                  {/* Trạng thái thực tế */}
                  <span className={`px-2.5 py-1 text-[11px] font-bold uppercase rounded-none border ${
                    activeUnit.status === 'OCCUPIED'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                      : activeUnit.status === 'MAINTENANCE'
                      ? 'bg-blue-950 text-blue-300 border-blue-500'
                      : 'bg-amber-950 text-amber-300 border-amber-500'
                  }`}>
                    {activeUnit.status === 'OCCUPIED' ? 'ĐÃ CÓ NGƯỜI Ở' : activeUnit.status === 'MAINTENANCE' ? 'NGHIỆM THU' : 'NHÀ TRỐNG'}
                  </span>
                </div>

                {/* 2. Thanh 4 thông số chính nhanh gọn */}
                <div className="grid grid-cols-4 gap-1.5 p-2 bg-[#121820] border border-[#222B35] text-center font-mono">
                  <div className="p-1 bg-[#161B22]">
                    <div className="text-[9.5px] text-gray-400">Diện Tích</div>
                    <div className="text-xs font-bold text-white mt-0.5">{activeUnit.area} m²</div>
                  </div>
                  <div className="p-1 bg-[#161B22]">
                    <div className="text-[9.5px] text-gray-400">Bố Trí</div>
                    <div className="text-xs font-bold text-gray-200 mt-0.5">{activeUnit.bedrooms}PN • {activeUnit.bathrooms}WC</div>
                  </div>
                  <div className="p-1 bg-[#161B22]">
                    <div className="text-[9.5px] text-gray-400">Hướng Ban Công</div>
                    <div className="text-xs font-bold text-[#C5A880] mt-0.5">{activeUnit.direction || 'Đông Nam'}</div>
                  </div>
                  <div className="p-1 bg-[#161B22]">
                    <div className="text-[9.5px] text-gray-400">Giá Niêm Yết</div>
                    <div className="text-xs font-bold text-emerald-400 mt-0.5">{activeUnit.priceBillion} tỷ</div>
                  </div>
                </div>

                {/* 3. Thanh chuyển Tab tinh gọn (3 Tab: Cư dân, Tiêu thụ & Doanh thu, Kỹ thuật) */}
                <div className="flex border-b border-[#222B35] text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setDetailTab('OVERVIEW')}
                    className={`pb-2 px-2.5 transition-colors border-b-2 ${
                      detailTab === 'OVERVIEW'
                        ? 'border-[#C5A880] text-[#C5A880]'
                        : 'border-transparent text-gray-400 hover:text-white'
                    }`}
                  >
                    {activeUnit.status === 'OCCUPIED' ? 'Hồ Sơ Cư Dân' : 'Hiện Trạng'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailTab('FINANCIAL')}
                    className={`pb-2 px-2.5 transition-colors border-b-2 ${
                      detailTab === 'FINANCIAL'
                        ? 'border-[#C5A880] text-[#C5A880]'
                        : 'border-transparent text-gray-400 hover:text-white'
                    }`}
                  >
                    Năng Lượng & Chi Phí
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailTab('TECHNICAL')}
                    className={`pb-2 px-2.5 transition-colors border-b-2 ${
                      detailTab === 'TECHNICAL'
                        ? 'border-[#C5A880] text-[#C5A880]'
                        : 'border-transparent text-gray-400 hover:text-white'
                    }`}
                  >
                    Kỹ Thuật & Pháp Lý
                  </button>
                </div>

                {/* 4. Nội dung Tab 1: Tổng quan cư dân / hiện trạng */}
                {detailTab === 'OVERVIEW' && (
                  <div className="space-y-2.5">
                    {activeUnit.status === 'OCCUPIED' && activeUnit.owner ? (
                      <>
                        {/* Chủ hộ súc tích */}
                        <div className="p-2.5 bg-[#121820] border border-[#222B35] flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={activeUnit.owner.avatar}
                              alt={activeUnit.owner.name}
                              className="w-10 h-10 rounded-none object-cover border border-[#C5A880] shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="font-bold text-white text-sm truncate">{activeUnit.owner.name}</div>
                              <div className="text-[11px] text-gray-300 font-mono flex items-center gap-2">
                                <span>ĐT: {activeUnit.owner.phone}</span>
                                <span>• CCCD: {activeUnit.owner.cccd}</span>
                              </div>
                            </div>
                          </div>
                          <span className="text-[9.5px] px-1.5 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-600 font-mono">
                            Đã Đối Chiếu
                          </span>
                        </div>

                        {/* Tóm tắt bàn giao */}
                        <div className="p-2.5 bg-[#121820] border border-[#222B35] text-[11px] font-mono space-y-1">
                          <div className="flex items-center justify-between text-gray-400">
                            <span>Biên bản bàn giao:</span>
                            <strong className="text-[#C5A880]">BBBG-{activeUnit.code}</strong>
                          </div>
                          <div className="flex items-center justify-between text-gray-400">
                            <span>Chìa khóa & thẻ từ:</span>
                            <strong className="text-white">3 chìa khóa • 2 thẻ thang máy</strong>
                          </div>
                          <div className="flex items-center justify-between text-gray-400">
                            <span>Chỉ số khi nhận:</span>
                            <strong className="text-amber-400">12.5 kWh • 1.2 m³</strong>
                          </div>
                        </div>

                        {/* Nhân khẩu & xe gọn */}
                        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                          <div className="p-2 bg-[#121820] border border-[#222B35]">
                            <div className="text-gray-400 text-[10px]">Cùng Cư Trú:</div>
                            <div className="text-white font-bold mt-0.5">
                              {activeUnit.members?.length || activeUnit.membersCount || 0} người thân
                            </div>
                          </div>
                          <div className="p-2 bg-[#121820] border border-[#222B35]">
                            <div className="text-gray-400 text-[10px]">Xe Đăng Ký Gửi Hầm:</div>
                            <div className="text-emerald-400 font-bold mt-0.5 truncate">
                              {activeUnit.vehicles && activeUnit.vehicles.length > 0
                                ? activeUnit.vehicles.map(v => v.plate).join(', ')
                                : 'Chưa đăng ký'}
                            </div>
                          </div>
                        </div>
                      </>
                    ) : activeUnit.status === 'MAINTENANCE' ? (
                      <div className="p-3 bg-[#121820] border border-blue-500/40 space-y-2">
                        <div className="text-blue-400 font-bold text-xs font-mono">
                          Căn Hộ Đang Nghiệm Thu Kỹ Thuật
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed">
                          Tổ kỹ thuật BQL đang kiểm tra điều hòa trung tâm, cửa sổ kính cách âm và van cấp nước. Tiến độ đạt 85%, sẵn sàng bàn giao trong 2 ngày.
                        </p>
                        <button
                          type="button"
                          onClick={() => setIsEditModalOpen(true)}
                          className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase transition-all"
                        >
                          Cập Nhật Tình Trạng
                        </button>
                      </div>
                    ) : (
                      <div className="p-3 bg-[#121820] border border-amber-500/40 space-y-2.5">
                        <div className="text-amber-400 font-bold text-xs font-mono">
                          Căn Hộ Trống (Sẵn Sàng Bàn Giao)
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed">
                          Căn hộ đã hoàn tất nghiệm thu hoàn thiện xây dựng, an toàn điện nước và đầu phun chữa cháy PCCC đạt chuẩn an toàn. Sẵn sàng bàn giao cho cư dân mới.
                        </p>
                        <button
                          type="button"
                          onClick={() => setIsAssignModalOpen(true)}
                          className="w-full py-2.5 px-3 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center shadow"
                        >
                          Bàn Giao Căn Hộ & Cấp Tài Khoản
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* 4.5. Nội dung Tab 2: Tiêu Thụ Hàng Tháng & Doanh Thu / Dòng Tiền */}
                {detailTab === 'FINANCIAL' && (() => {
                  const fin = getApartmentFinancialMetrics(activeUnit);
                  if (!fin) return null;

                  return (
                    <div className="space-y-2.5 text-xs font-mono">
                      {/* Thông báo thao tác thu phí */}
                      {billToastMessage && (
                        <div className="p-2 bg-emerald-950 border border-emerald-500 text-emerald-300 text-[11px] flex items-center justify-between">
                          <span>{billToastMessage}</span>
                          <button onClick={() => setBillToastMessage(null)} className="text-gray-400 hover:text-white ml-2">✕</button>
                        </div>
                      )}

                      {/* 1. KHỐI TỔNG HỢP DOANH THU BQL & GIÁ TRỊ KHAI THÁC */}
                      <div className="p-2.5 bg-gradient-to-br from-[#16202E] to-[#0E1520] border border-[#2A374A] space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-gray-200 font-bold">
                            DÒNG TIỀN & DOANH THU CĂN HỘ
                          </span>
                          <span className={`px-2 py-0.5 text-[9.5px] font-bold border ${
                            fin.isOccupied 
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-500' 
                              : 'bg-amber-950 text-amber-300 border-amber-600'
                          }`}>
                            {fin.isOccupied ? 'ĐÃ ĐÓNG ĐỦ' : 'CĐT BẢO DƯỠNG'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-[#232F42]">
                          <div>
                            <div className="text-[9.5px] text-gray-400">Doanh Thu Phí BQL:</div>
                            <div className="text-sm sm:text-base font-bold text-emerald-400 mt-0.5">
                              {new Intl.NumberFormat('vi-VN').format(fin.totalBqlRevenue)} <span className="text-[10px] text-gray-400">đ/th</span>
                            </div>
                            <div className="text-[9px] text-gray-400">~{((fin.totalBqlRevenue * 12) / 1000000).toFixed(1)} triệu đ/năm</div>
                          </div>
                          <div>
                            <div className="text-[9.5px] text-gray-400">Giá Thuê Ước Tính:</div>
                            <div className="text-sm sm:text-base font-bold text-amber-300 mt-0.5">
                              {new Intl.NumberFormat('vi-VN').format(fin.estimatedRentalPrice)} <span className="text-[10px] text-gray-400">đ/th</span>
                            </div>
                            <div className="text-[9px] text-emerald-400">
                              Lợi suất: {fin.rentalYield}% / năm
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 2. CHỈ SỐ TIÊU THỤ NĂNG LƯỢNG HÀNG THÁNG (ĐIỆN - NƯỚC) */}
                      <div className="p-2.5 bg-[#121820] border border-[#222B35] space-y-2">
                        <div className="flex items-center justify-between text-[11px] pb-1 border-b border-[#222B35]">
                          <span className="text-[#C5A880] font-bold">
                            TIÊU THỤ HÀNG THÁNG (KỲ GẦN NHẤT)
                          </span>
                          <span className="text-[9px] text-gray-400">Đồng hồ IoT</span>
                        </div>

                        {/* Tiêu thụ Điện */}
                        <div className="p-2 bg-[#161B22] border border-[#2D3748] space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-amber-300 font-bold text-[10.5px]">
                              Điện Sinh Hoạt ({fin.meterElectricId})
                            </span>
                            <span className="text-amber-300 font-bold text-xs">
                              {new Intl.NumberFormat('vi-VN').format(fin.electricCost)} đ
                            </span>
                          </div>
                          <div className="flex items-baseline justify-between text-[11px]">
                            <span className="font-bold text-white text-sm">{fin.electricKwh} <span className="text-[10px] text-gray-400 font-normal">kWh</span></span>
                            <span className="text-[9px] text-gray-400">{fin.electricKwh > 300 ? 'Cao hơn trung bình' : 'Tiêu thụ chuẩn'}</span>
                          </div>
                          {/* Thanh đo */}
                          <div className="w-full bg-gray-800 h-1.5 overflow-hidden">
                            <div 
                              className="bg-amber-400 h-full transition-all duration-500" 
                              style={{ width: `${Math.min(100, Math.round((fin.electricKwh / 350) * 100))}%` }}
                            />
                          </div>
                        </div>

                        {/* Tiêu thụ Nước */}
                        <div className="p-2 bg-[#161B22] border border-[#2D3748] space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-cyan-300 font-bold text-[10.5px]">
                              Nước Sinh Hoạt ({fin.meterWaterId})
                            </span>
                            <span className="text-cyan-300 font-bold text-xs">
                              {new Intl.NumberFormat('vi-VN').format(fin.waterCost)} đ
                            </span>
                          </div>
                          <div className="flex items-baseline justify-between text-[11px]">
                            <span className="font-bold text-white text-sm">{fin.waterM3} <span className="text-[10px] text-gray-400 font-normal">m³</span></span>
                            <span className="text-[9px] text-emerald-400">Áp lực ống: 2.8 bar</span>
                          </div>
                          {/* Thanh đo */}
                          <div className="w-full bg-gray-800 h-1.5 overflow-hidden">
                            <div 
                              className="bg-cyan-400 h-full transition-all duration-500" 
                              style={{ width: `${Math.min(100, Math.round((fin.waterM3 / 25) * 100))}%` }}
                            />
                          </div>
                        </div>

                        {/* Chi tiết phí dịch vụ & xe */}
                        <div className="pt-1 space-y-1 text-[10.5px] text-gray-300">
                          <div className="flex justify-between py-0.5 border-b border-[#1E293B]">
                            <span className="text-gray-400">• Phí quản lý chung cư ({fin.area} m² x 18k):</span>
                            <span className="font-bold text-white">{new Intl.NumberFormat('vi-VN').format(fin.managementFee)} đ</span>
                          </div>
                          <div className="flex justify-between py-0.5 border-b border-[#1E293B]">
                            <span className="text-gray-400">• Phí gửi xe tầng hầm ({activeUnit.vehicles?.length || (fin.isOccupied ? 2 : 0)} xe):</span>
                            <span className="font-bold text-white">{new Intl.NumberFormat('vi-VN').format(fin.parkingFee)} đ</span>
                          </div>
                        </div>
                      </div>

                      {/* 3. NÚT TƯƠNG TÁC NHANH */}
                      <div className="grid grid-cols-2 gap-2 pt-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            setBillToastMessage(`Đã trích xuất biên lai phiếu thu căn hộ ${activeUnit.code} thành công.`);
                            setTimeout(() => setBillToastMessage(null), 3500);
                          }}
                          className="py-2 px-2 bg-[#16202E] hover:bg-[#1E2B3E] text-gray-200 hover:text-white border border-[#2D3B4E] font-semibold text-[10.5px] transition-all flex items-center justify-center"
                        >
                          Xuất Phiếu Thu
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setBillToastMessage(`Đã gửi tin nhắn nhắc phí & hóa đơn tới chủ căn hộ ${activeUnit.code}.`);
                            setTimeout(() => setBillToastMessage(null), 3500);
                          }}
                          className="py-2 px-2 bg-[#162B22] hover:bg-[#1E3B2F] text-emerald-300 hover:text-emerald-200 border border-emerald-600/50 font-semibold text-[10.5px] transition-all flex items-center justify-center"
                        >
                          Gửi Thông Báo Phí
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* 5. Nội dung Tab 3: Thông số kỹ thuật & phí */}
                {detailTab === 'TECHNICAL' && (
                  <div className="p-3 bg-[#121820] border border-[#222B35] space-y-2 text-xs font-mono">
                    <div className="flex items-center justify-between pb-1.5 border-b border-[#222B35]">
                      <span className="text-gray-400">Diện tích thông thủy:</span>
                      <strong className="text-white">{activeUnit.area} m²</strong>
                    </div>
                    <div className="flex items-center justify-between pb-1.5 border-b border-[#222B35]">
                      <span className="text-gray-400">Diện tích tim tường:</span>
                      <strong className="text-white">{Math.round(activeUnit.area * 1.08)} m²</strong>
                    </div>
                    <div className="flex items-center justify-between pb-1.5 border-b border-[#222B35]">
                      <span className="text-gray-400">Phí quản lý chung cư:</span>
                      <strong className="text-amber-300">
                        {new Intl.NumberFormat('vi-VN').format(Math.round(activeUnit.area * 18000))} đ/tháng (18.000 đ/m²)
                      </strong>
                    </div>
                    <div className="flex items-center justify-between pb-1.5 border-b border-[#222B35]">
                      <span className="text-gray-400">Pháp lý sở hữu:</span>
                      <strong className="text-emerald-400">Sổ hồng lâu dài (Đã cấp)</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Hệ thống kỹ thuật:</span>
                      <strong className="text-gray-200">Smart Intercom & Báo khói PCCC</strong>
                    </div>
                  </div>
                )}
              </div>

              {/* 6. Chân thẻ: Nút hành động nhanh */}
              <div className="pt-2.5 border-t border-[#222B35] flex items-center gap-2 text-xs shrink-0">
                <button
                  type="button"
                  onClick={() => setIsDetailModalOpen(true)}
                  className="flex-1 py-2 px-3 bg-[#161B22] hover:bg-[#202936] text-gray-200 hover:text-white border border-[#2D3748] font-semibold transition-all flex items-center justify-center"
                >
                  Mặt Bằng Sàn
                </button>

                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="py-2 px-3 bg-[#161B22] hover:bg-[#202936] text-gray-200 hover:text-white border border-[#2D3748] font-semibold transition-all flex items-center justify-center"
                >
                  Chỉnh Sửa
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400 text-xs font-mono my-auto">
              Vui lòng chọn một căn hộ trên mô hình để xem thông tin chi tiết.
            </div>
          )}

        </div>
      </div>

      {/* ============================================================= */}
      {/* 5. CÁC MODAL QUẢN LÝ BQL TÍCH HỢP                           */}
      {/* ============================================================= */}
      {/* Modal Bàn Giao Cư Dân Mới */}
      {isAssignModalOpen && activeUnit && (
        <AssignResidentModal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          unit={activeUnit}
          onSuccess={() => {
            syncLiveApartmentsFromApi(selectedBlock);
          }}
        />
      )}

      {/* Modal Chỉnh Sửa Thông Số Căn Hộ */}
      {isEditModalOpen && activeUnit && (
        <EditApartmentModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          unit={activeUnit}
          onSuccess={() => {
            syncLiveApartmentsFromApi(selectedBlock);
          }}
        />
      )}

      {/* Modal Thêm Căn Hộ Mới */}
      {isAddModalOpen && (
        <AddApartmentModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={(newUnit) => {
            syncLiveApartmentsFromApi(selectedBlock);
            setSelectedAptCode(newUnit.code);
          }}
        />
      )}

      {/* Modal Xem 3D Nội Thất & Chi Tiết */}
      {isDetailModalOpen && activeUnit && (
        <ApartmentDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          unit={activeUnit}
          onEditUnit={() => {
            setIsDetailModalOpen(false);
            setIsEditModalOpen(true);
          }}
          onAssignResident={() => {
            setIsDetailModalOpen(false);
            setIsAssignModalOpen(true);
          }}
          onRefresh={() => syncLiveApartmentsFromApi(selectedBlock)}
        />
      )}

      {/* ============================================================= */}
      {/* 6. MODAL MỞ RỘNG KHÔNG GIAN MẶT BẰNG TOÀN CẢNH (DEEP-DIVE)     */}
      {/* ============================================================= */}
      {isFloorPlanExpanded && (() => {
        // Danh sách 21 căn của tầng đang chọn theo bản vẽ CAD kiến trúc Chung Cư BS-09 & The Tropical
        const floorExpandedUnits = CAD_FLOOR_UNITS_CONFIG.map(cfg => {
          const chCode = cfg.code;
          const targetCode = selectedFloor === 30 ? chCode : `${selectedFloor}-${chCode}`;
          const found = apartments.find(u => 
            u.floor === selectedFloor && (
              u.code.toUpperCase() === chCode ||
              u.code.toUpperCase() === targetCode ||
              u.code.toUpperCase().endsWith(chCode) ||
              (selectedFloor === 30 && u.code === chCode)
            )
          );
          const isOwnerPrimary = isOwnerBuilding && selectedFloor === 30 && (cfg.num === '06');
          const isOwnerSecondary = isOwnerBuilding && selectedFloor === 30 && (cfg.num === '01');
          const isOccupied = isOwnerPrimary || isOwnerSecondary || found?.status === 'OCCUPIED' || (selectedFloor === 12 && cfg.num === '05') || (selectedFloor % 2 === 0 && (cfg.num === '03' || cfg.num === '15' || cfg.num === '18'));
          const isMaintenance = found?.status === 'MAINTENANCE' || (selectedFloor % 5 === 0 && cfg.num === '09');

          return found || ({
            code: targetCode,
            tower: selectedBlock === 'BS-10' ? 'B' : 'A',
            towerName: currentBlockName,
            floor: selectedFloor,
            type: cfg.type,
            typeLabel: cfg.typeLabel,
            status: isOccupied ? 'OCCUPIED' : isMaintenance ? 'MAINTENANCE' : 'VACANT',
            statusLabel: isOccupied ? 'Có Cư Dân' : isMaintenance ? 'Nghiệm Thu Kỹ Thuật' : 'Căn Hộ Trống',
            area: cfg.area,
            bedrooms: cfg.beds,
            bathrooms: cfg.baths,
            direction: cfg.dir,
            priceBillion: cfg.defaultPrice,
            owner: isOwnerPrimary ? { name: activeOwnerName, phone: activeOwnerPhone, email: activeOwnerEmail, cccd: activeOwnerCccd, avatar: activeOwnerAvatar, eKycApproved: true }
              : isOwnerSecondary ? { name: `${activeOwnerName} (Căn Phụ)`, phone: activeOwnerPhone, email: activeOwnerEmail, cccd: activeOwnerCccd, avatar: activeOwnerAvatar, eKycApproved: true }
              : isOccupied ? { name: `Cư Dân Căn ${cfg.num}`, phone: '0908123456', email: `resident.${cfg.num}@skyline.vn`, cccd: '079204000123', avatar: '', eKycApproved: true }
              : undefined
          } as ApartmentUnit);
        });

        const currentExpandedUnit = floorExpandedUnits.find(u => u.code === selectedAptCode || u.code.endsWith(selectedAptCode)) || floorExpandedUnits[0];
        const currentFin = getApartmentFinancialMetrics(currentExpandedUnit);

        const totalExpRevenue = floorExpandedUnits.reduce((sum, u) => sum + (getApartmentFinancialMetrics(u)?.totalBqlRevenue || 0), 0);
        const totalExpElectric = floorExpandedUnits.reduce((sum, u) => sum + (getApartmentFinancialMetrics(u)?.electricKwh || 0), 0);
        const totalExpWater = floorExpandedUnits.reduce((sum, u) => sum + (getApartmentFinancialMetrics(u)?.waterM3 || 0), 0);
        const occupiedExpCount = floorExpandedUnits.filter(u => u.status === 'OCCUPIED').length;

        return (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 text-white animate-fadeIn select-none">
            <div className="relative w-full h-[95vh] max-w-7xl bg-[#090D14] border border-[#C5A880]/80 shadow-2xl flex flex-col overflow-hidden">
              
              <div className="p-3 sm:p-4 bg-[#101620] border-b border-[#222B35] flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-sm sm:text-base font-serif font-bold text-white tracking-wide flex items-center gap-2">
                    <span>Mặt Bằng Tầng {selectedFloor}</span>
                    <span className="text-[10px] px-2 py-0.5 bg-[#C5A880]/20 text-[#C5A880] border border-[#C5A880]/40 font-mono font-normal">
                      {currentBlockName}
                    </span>
                  </h2>
                  <div className="text-[10.5px] text-gray-400 font-mono mt-0.5">
                    21 Căn hộ • 6 Thang máy khách • 2 Thang thoát hiểm
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsFloorPlanExpanded(false)}
                  className="px-3 py-1.5 bg-[#161B22] hover:bg-rose-950 text-gray-300 hover:text-rose-200 border border-[#2D3748] hover:border-rose-500 text-xs font-mono transition-all"
                >
                  <span>Đóng [✕]</span>
                </button>
              </div>

              <div className="p-2.5 sm:p-3 bg-[#121820] border-b border-[#222B35] flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-gray-400 font-mono text-[11px]">Chuyển Tầng:</span>
                  {[34, 30, 25, 20, 18, 15, 12, 10, 8, 5, 2, 1].map(fl => (
                    <button
                      key={fl}
                      type="button"
                      onClick={() => {
                        setSelectedFloor(fl);
                        if (fl === 30) setSelectedAptCode('CH-06');
                      }}
                      className={`px-2 py-1 text-[11px] font-mono transition-all border ${
                        selectedFloor === fl
                          ? 'bg-[#C5A880] text-[#0D1117] font-bold border-[#C5A880] shadow'
                          : 'bg-[#161B22] text-gray-300 border-[#2D3748] hover:border-gray-500'
                      }`}
                    >
                      {fl === 30 ? 'T30 (Chủ Hộ)' : `T${fl}`}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex bg-[#070B12] p-0.5 border border-[#1E293B]">
                    <button
                      type="button"
                      onClick={() => setFloorPlanViewMode('CAD_VECTOR')}
                      className={`px-2.5 py-1 text-xs transition-all ${
                        floorPlanViewMode === 'CAD_VECTOR'
                          ? 'bg-[#C5A880] text-black font-bold shadow'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Sơ Đồ BIM 3 Cánh
                    </button>
                    <button
                      type="button"
                      onClick={() => setFloorPlanViewMode('BLUEPRINT_IMAGE')}
                      className={`px-2.5 py-1 text-xs transition-all ${
                        floorPlanViewMode === 'BLUEPRINT_IMAGE'
                          ? 'bg-[#C5A880] text-black font-bold shadow'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Bản Vẽ CAD Gốc
                    </button>
                  </div>

                  {floorPlanViewMode === 'CAD_VECTOR' && (
                    <div className="flex items-center gap-1">
                      {[
                        { key: 'ALL', label: 'Tất Cả (21)' },
                        { key: 'NORTH', label: 'Cánh Bắc (5)' },
                        { key: 'SOUTH', label: 'Cánh Nam (Chủ Hộ)' },
                        { key: 'WEST', label: 'Cánh Tây (11)' }
                      ].map(item => (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setFloorPlanFilterWing(item.key as any)}
                          className={`px-2 py-0.5 text-[10.5px] border transition-all ${
                            floorPlanFilterWing === item.key
                              ? 'bg-[#C5A880] text-black font-bold border-[#C5A880]'
                              : 'bg-[#141E2B] text-gray-300 border-[#233345] hover:text-white'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {floorPlanViewMode === 'BLUEPRINT_IMAGE' && (
                    <div className="flex items-center gap-1.5 font-mono">
                      <button
                        type="button"
                        onClick={() => setFloorPlanCadZoom(prev => Math.max(0.8, Number((prev - 0.2).toFixed(1))))}
                        className="px-2 py-0.5 bg-[#141E2B] text-white border border-[#233345]"
                      >
                        -
                      </button>
                      <span className="text-[11px] text-[#C5A880] min-w-[40px] text-center">
                        {Math.round(floorPlanCadZoom * 100)}%
                      </span>
                      <button
                        type="button"
                        onClick={() => setFloorPlanCadZoom(prev => Math.min(2.5, Number((prev + 0.2).toFixed(1))))}
                        className="px-2 py-0.5 bg-[#141E2B] text-white border border-[#233345]"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-3 sm:px-4 py-2 bg-[#0C121B] border-b border-[#1E293B] grid grid-cols-4 gap-2 text-[11px] font-mono text-center">
                <div className="p-1 bg-[#121A26] border border-[#222E3E]">
                  <span className="text-gray-400 text-[10px]">Doanh Thu Sàn Tầng:</span>
                  <div className="text-emerald-400 font-bold">{new Intl.NumberFormat('vi-VN').format(totalExpRevenue)} đ/th</div>
                </div>
                <div className="p-1 bg-[#121A26] border border-[#222E3E]">
                  <span className="text-gray-400 text-[10px]">Điện Tiêu Thụ:</span>
                  <div className="text-amber-300 font-bold">{totalExpElectric} kWh</div>
                </div>
                <div className="p-1 bg-[#121A26] border border-[#222E3E]">
                  <span className="text-gray-400 text-[10px]">Nước Tiêu Thụ:</span>
                  <div className="text-cyan-300 font-bold">{totalExpWater} m³</div>
                </div>
                <div className="p-1 bg-[#121A26] border border-[#222E3E]">
                  <span className="text-gray-400 text-[10px]">Lấp Đầy:</span>
                  <div className="text-white font-bold">{occupiedExpCount}/21 Căn ({Math.round((occupiedExpCount / 21) * 100)}%)</div>
                </div>
              </div>

              <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
                <div className="lg:col-span-8 p-3 sm:p-5 bg-[#05080E] flex flex-col items-center justify-center overflow-auto border-r border-[#1E293B]">
                  {floorPlanViewMode === 'CAD_VECTOR' ? (
                    <div className="w-full max-w-[850px] relative">
                      <svg viewBox="0 0 980 580" className="w-full drop-shadow-2xl">
                        <defs>
                          <pattern id="modalCadGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#162334" strokeWidth="0.6" opacity="0.6" />
                          </pattern>
                        </defs>
                        <rect x="10" y="10" width="960" height="560" fill="url(#modalCadGrid)" stroke="#1F2E42" strokeWidth="1.5" />

                        <g transform="translate(60, 55)" className="pointer-events-none opacity-80">
                          <circle cx="0" cy="0" r="24" fill="#0C1420" stroke="#33465E" strokeWidth="1.2" />
                          <polygon points="0,-20 5,-4 0,0 -5,-4" fill="#EF4444" />
                          <polygon points="0,20 5,4 0,0 -5,4" fill="#64748B" />
                          <polygon points="-20,0 -4,5 0,0 -4,-5" fill="#64748B" />
                          <polygon points="20,0 4,5 0,0 4,-5" fill="#64748B" />
                          <text x="0" y="-24" fill="#F8FAFC" fontSize="11" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">B</text>
                        </g>

                        <g transform="translate(860, 480)" className="pointer-events-none opacity-85">
                          <rect x="-65" y="-55" width="130" height="110" fill="#0B121C" stroke="#26374E" strokeWidth="1.2" rx="3" />
                          <text x="0" y="-40" fill="#94A3B8" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">KEY PLAN</text>
                          <polygon points="-45,-25 35,-30 45,25 -35,35" fill="#141E2C" stroke="#3B4F68" strokeWidth="1" strokeDasharray="2 2" />
                          <circle cx="0" cy="0" r="10" fill="#EF4444" fillOpacity="0.4" />
                          <circle cx="0" cy="0" r="5" fill="#EF4444" />
                          <text x="0" y="24" fill="#F87171" fontSize="7" fontWeight="bold" fontFamily="monospace" textAnchor="middle">{selectedBlock}</text>
                        </g>

                        <path
                          d="M 50,160 L 370,160 L 370,40 L 930,40 L 930,190 L 610,190 L 610,430 L 760,430 L 760,560 L 460,560 L 460,440 L 50,440 Z"
                          fill="#0A101A"
                          stroke="#2A3D54"
                          strokeWidth="2.5"
                        />

                        <g>
                          <rect x="380" y="195" width="220" height="230" fill="#111B28" stroke="#33465E" strokeWidth="1.5" />
                          <text x="490" y="215" fill="#E2E8F0" fontSize="9.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                            LÕI THANG MÁY & SẢNH CHỜ TẦNG {selectedFloor}
                          </text>

                          <rect x="395" y="230" width="38" height="34" fill="#0D1622" stroke="#38BDF8" strokeWidth="1" />
                          <text x="414" y="250" fill="#38BDF8" fontSize="7.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">P1</text>
                          <text x="414" y="260" fill="#64748B" fontSize="6" textAnchor="middle">Khách</text>

                          <rect x="395" y="270" width="38" height="34" fill="#0D1622" stroke="#38BDF8" strokeWidth="1" />
                          <text x="414" y="290" fill="#38BDF8" fontSize="7.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">P2</text>
                          <text x="414" y="300" fill="#64748B" fontSize="6" textAnchor="middle">Khách</text>

                          <rect x="395" y="310" width="38" height="34" fill="#0D1622" stroke="#38BDF8" strokeWidth="1" />
                          <text x="414" y="330" fill="#38BDF8" fontSize="7.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">P3</text>
                          <text x="414" y="340" fill="#64748B" fontSize="6" textAnchor="middle">Khách</text>

                          <rect x="545" y="230" width="38" height="34" fill="#0D1622" stroke="#38BDF8" strokeWidth="1" />
                          <text x="564" y="250" fill="#38BDF8" fontSize="7.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">P4</text>
                          <text x="564" y="260" fill="#64748B" fontSize="6" textAnchor="middle">Khách</text>

                          <rect x="545" y="270" width="38" height="34" fill="#0D1622" stroke="#38BDF8" strokeWidth="1" />
                          <text x="564" y="290" fill="#38BDF8" fontSize="7.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">P5</text>
                          <text x="564" y="300" fill="#64748B" fontSize="6" textAnchor="middle">Khách</text>

                          <rect x="545" y="310" width="38" height="34" fill="#0D1622" stroke="#38BDF8" strokeWidth="1" />
                          <text x="564" y="330" fill="#38BDF8" fontSize="7.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">P6</text>
                          <text x="564" y="340" fill="#64748B" fontSize="6" textAnchor="middle">Khách</text>

                          <rect x="445" y="230" width="90" height="34" fill="#1C2634" stroke="#F59E0B" strokeWidth="1.2" />
                          <text x="490" y="250" fill="#FDE68A" fontSize="7.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">THANG PCCC & HÀNG</text>
                          <text x="490" y="260" fill="#F59E0B" fontSize="6" textAnchor="middle">Phòng đệm áp suất</text>

                          <rect x="445" y="272" width="42" height="72" fill="#0B131E" stroke="#10B981" strokeWidth="1" />
                          <text x="466" y="306" fill="#10B981" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="monospace">THOÁT</text>
                          <text x="466" y="316" fill="#10B981" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="monospace">HIỂM 1</text>

                          <rect x="493" y="272" width="42" height="72" fill="#0B131E" stroke="#10B981" strokeWidth="1" />
                          <text x="514" y="306" fill="#10B981" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="monospace">THOÁT</text>
                          <text x="514" y="316" fill="#10B981" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="monospace">HIỂM 2</text>

                          <rect x="440" y="352" width="100" height="34" fill="#0A1017" stroke="#1E2B3C" strokeDasharray="2 2" />
                          <text x="490" y="372" fill="#94A3B8" fontSize="7.5" textAnchor="middle" fontFamily="monospace">SẢNH CHỜ THANG MÁY (2.4m)</text>
                          <rect x="395" y="392" width="90" height="26" fill="#141E2B" stroke="#475569" strokeWidth="0.8" />
                          <text x="440" y="408" fill="#94A3B8" fontSize="6.5" textAnchor="middle" fontFamily="monospace">PHÒNG RÁC HÚT CHÂN KHÔNG</text>
                          <rect x="495" y="392" width="88" height="26" fill="#141E2B" stroke="#475569" strokeWidth="0.8" />
                          <text x="539" y="408" fill="#94A3B8" fontSize="6.5" textAnchor="middle" fontFamily="monospace">HỘP KỸ THUẬT ĐIỆN - NƯỚC</text>
                        </g>

                        <path d="M 60,300 L 380,300" stroke="#33465E" strokeWidth="20" strokeLinecap="square" opacity="0.25" />
                        <text x="210" y="304" fill="#64748B" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">HÀNH LANG TÂY (1.8m)</text>
                        <path d="M 500,105 L 920,105" stroke="#33465E" strokeWidth="20" strokeLinecap="square" opacity="0.25" />
                        <text x="730" y="109" fill="#64748B" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">HÀNH LANG BẮC (1.8m)</text>
                        <path d="M 540,430 L 540,550" stroke="#33465E" strokeWidth="20" strokeLinecap="square" opacity="0.25" />
                        <text x="540" y="490" fill="#64748B" fontSize="7.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle" transform="rotate(-90 540 490)">HÀNH LANG NAM (1.8m)</text>

                        {/* CÁNH BẮC: CH-01 ĐẾN CH-05 */}
                        {(() => {
                          const northCoords = [
                            { num: '01', x: 520, y: 48, w: 76, h: 52 },
                            { num: '02', x: 604, y: 48, w: 74, h: 52 },
                            { num: '03', x: 686, y: 48, w: 74, h: 52 },
                            { num: '04', x: 768, y: 48, w: 74, h: 52 },
                            { num: '05', x: 850, y: 48, w: 74, h: 52 },
                          ];
                          return northCoords.map(pos => {
                            const unit = floorExpandedUnits.find(u => u.code.endsWith(`CH-${pos.num}`) || u.code.endsWith(pos.num));
                            const isSelected = selectedAptCode === unit?.code || (selectedFloor === 30 && pos.num === '01' && selectedAptCode === 'CH-01');
                            const isOccupied = unit?.status === 'OCCUPIED';
                            const isMaint = unit?.status === 'MAINTENANCE';
                            const isOwnerSecondary = isOwnerBuilding && selectedFloor === 30 && pos.num === '01';
                            const isDimmed = floorPlanFilterWing !== 'ALL' && floorPlanFilterWing !== 'NORTH';

                            return (
                              <g
                                key={`exp-north-${pos.num}`}
                                onClick={() => unit && setSelectedAptCode(unit.code)}
                                className="cursor-pointer transition-all hover:opacity-90"
                                style={{ opacity: isDimmed ? 0.2 : 1 }}
                              >
                                <rect
                                  x={pos.x}
                                  y={pos.y}
                                  width={pos.w}
                                  height={pos.h}
                                  fill={isSelected ? '#143126' : isOwnerSecondary ? '#0E2436' : isOccupied ? '#0B2319' : isMaint ? '#0D253A' : '#101722'}
                                  stroke={isSelected ? '#F59E0B' : isOwnerSecondary ? '#38BDF8' : isOccupied ? '#10B981' : isMaint ? '#0284C7' : '#2D3E54'}
                                  strokeWidth={isSelected ? 2.5 : isOwnerSecondary ? 2 : 1.2}
                                  rx="1"
                                />
                                <text x={pos.x + pos.w / 2} y={pos.y + 22} fill="#FFFFFF" fontSize="8.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                                  CH-{pos.num}
                                </text>
                                <text x={pos.x + pos.w / 2} y={pos.y + 33} fill={isOccupied ? '#6EE7B7' : '#94A3B8'} fontSize="7" textAnchor="middle">
                                  {pos.num === '01' ? '2PN • 68m²' : pos.num === '02' ? '1PN • 38m²' : pos.num === '03' ? '1PN+ • 46m²' : pos.num === '04' ? '2PN • 59m²' : '2PN • 69m²'}
                                </text>
                                <rect x={pos.x + 8} y={pos.y + 38} width={pos.w - 16} height="10" fill={isOwnerSecondary ? '#0369A1' : isOccupied ? '#065F46' : isMaint ? '#075985' : '#78350F'} />
                                <text x={pos.x + pos.w / 2} y={pos.y + 46} fill="#FFFFFF" fontSize="6" fontWeight="bold" textAnchor="middle">
                                  {isOwnerSecondary ? 'CĂN PHỤ' : isOccupied ? 'ĐÃ CÓ CƯ DÂN' : isMaint ? 'NGHIỆM THU' : 'NHÀ TRỐNG'}
                                </text>
                              </g>
                            );
                          });
                        })()}

                        {/* CÁNH NAM: CH-06 (CHỦ HỘ) ĐẾN CH-10 */}
                        {(() => {
                          const southCoords = [
                            { num: '06', x: 470, y: 440, w: 90, h: 54 },
                            { num: '07', x: 570, y: 440, w: 90, h: 54 },
                            { num: '08', x: 670, y: 440, w: 85, h: 54 },
                            { num: '09', x: 470, y: 500, w: 140, h: 54 },
                            { num: '10', x: 620, y: 500, w: 135, h: 54 },
                          ];
                          return southCoords.map(pos => {
                            const unit = floorExpandedUnits.find(u => u.code.endsWith(`CH-${pos.num}`) || u.code.endsWith(pos.num));
                            const isOwnerTarget = isOwnerBuilding && selectedFloor === 30 && pos.num === '06';
                            const isSelected = selectedAptCode === unit?.code || (isOwnerTarget && selectedAptCode === 'CH-06');
                            const isOccupied = isOwnerTarget || unit?.status === 'OCCUPIED';
                            const isMaint = unit?.status === 'MAINTENANCE';
                            const isDimmed = floorPlanFilterWing !== 'ALL' && floorPlanFilterWing !== 'SOUTH';

                            return (
                              <g
                                key={`exp-south-${pos.num}`}
                                onClick={() => unit && setSelectedAptCode(unit.code)}
                                className="cursor-pointer transition-all hover:opacity-90"
                                style={{ opacity: isDimmed ? 0.2 : 1 }}
                              >
                                <rect
                                  x={pos.x}
                                  y={pos.y}
                                  width={pos.w}
                                  height={pos.h}
                                  fill={isSelected ? '#143126' : isOwnerTarget ? '#192E1E' : isOccupied ? '#0B2319' : isMaint ? '#0D253A' : '#101722'}
                                  stroke={isSelected ? '#F59E0B' : isOwnerTarget ? '#F59E0B' : isOccupied ? '#10B981' : isMaint ? '#0284C7' : '#2D3E54'}
                                  strokeWidth={isOwnerTarget ? 2.5 : isSelected ? 2.2 : 1.2}
                                  rx="1"
                                />
                                {isOwnerTarget && (
                                  <g>
                                    <rect x={pos.x + 2} y={pos.y + 2} width={pos.w - 4} height="13" fill="#F59E0B" />
                                    <text x={pos.x + pos.w / 2} y={pos.y + 11.5} fill="#000000" fontSize="7.5" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">
                                      👑 CĂN CHỦ HỘ (LỰC)
                                    </text>
                                  </g>
                                )}
                                <text x={pos.x + pos.w / 2} y={pos.y + (isOwnerTarget ? 26 : 19)} fill="#FFFFFF" fontSize={isOwnerTarget ? "10" : "8.5"} fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                                  CH-{pos.num}
                                </text>
                                <text x={pos.x + pos.w / 2} y={pos.y + (isOwnerTarget ? 37 : 30)} fill={isOccupied ? '#6EE7B7' : '#94A3B8'} fontSize="7" textAnchor="middle">
                                  {pos.num === '06' ? '1PN • 42m² (View Hồ Bơi)' : pos.num === '07' ? '2PN • 59m²' : pos.num === '08' ? '1PN • 46m²' : pos.num === '09' ? '2PN Góc • 69m²' : 'Studio • 35m²'}
                                </text>
                                <rect x={pos.x + 8} y={pos.y + (isOwnerTarget ? 41 : 36)} width={pos.w - 16} height="10" fill={isOwnerTarget ? '#065F46' : isOccupied ? '#065F46' : '#78350F'} />
                                <text x={pos.x + pos.w / 2} y={pos.y + (isOwnerTarget ? 48.5 : 43.5)} fill="#FFFFFF" fontSize="6.5" fontWeight="bold" textAnchor="middle">
                                  {isOwnerTarget ? activeOwnerName : isOccupied ? 'CÓ CƯ DÂN' : 'NHÀ TRỐNG'}
                                </text>
                              </g>
                            );
                          });
                        })()}

                        {/* CÁNH TÂY: CH-11 ĐẾN CH-21 */}
                        {(() => {
                          const westCoords = [
                            { num: '11', x: 60, y: 170, w: 58, h: 58 },
                            { num: '12', x: 122, y: 170, w: 58, h: 58 },
                            { num: '13', x: 184, y: 170, w: 58, h: 58 },
                            { num: '14', x: 246, y: 170, w: 58, h: 58 },
                            { num: '15', x: 308, y: 170, w: 58, h: 58 },
                            { num: '16', x: 60, y: 370, w: 48, h: 62 },
                            { num: '17', x: 112, y: 370, w: 48, h: 62 },
                            { num: '18', x: 164, y: 370, w: 48, h: 62 },
                            { num: '19', x: 216, y: 370, w: 48, h: 62 },
                            { num: '20', x: 268, y: 370, w: 48, h: 62 },
                            { num: '21', x: 320, y: 370, w: 48, h: 62 },
                          ];
                          return westCoords.map(pos => {
                            const unit = floorExpandedUnits.find(u => u.code.endsWith(`CH-${pos.num}`) || u.code.endsWith(pos.num));
                            const isSelected = selectedAptCode === unit?.code;
                            const isOccupied = unit?.status === 'OCCUPIED';
                            const isMaint = unit?.status === 'MAINTENANCE';
                            const isDimmed = floorPlanFilterWing !== 'ALL' && floorPlanFilterWing !== 'WEST';

                            return (
                              <g
                                key={`exp-west-${pos.num}`}
                                onClick={() => unit && setSelectedAptCode(unit.code)}
                                className="cursor-pointer transition-all hover:opacity-90"
                                style={{ opacity: isDimmed ? 0.2 : 1 }}
                              >
                                <rect
                                  x={pos.x}
                                  y={pos.y}
                                  width={pos.w}
                                  height={pos.h}
                                  fill={isSelected ? '#143126' : isOccupied ? '#0B2319' : isMaint ? '#0D253A' : '#101722'}
                                  stroke={isSelected ? '#F59E0B' : isOccupied ? '#10B981' : isMaint ? '#0284C7' : '#2D3E54'}
                                  strokeWidth={isSelected ? 2.2 : 1.1}
                                  rx="1"
                                />
                                <text x={pos.x + pos.w / 2} y={pos.y + 18} fill="#FFFFFF" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                                  CH-{pos.num}
                                </text>
                                <text x={pos.x + pos.w / 2} y={pos.y + 28} fill={isOccupied ? '#6EE7B7' : '#94A3B8'} fontSize="6.5" textAnchor="middle">
                                  {unit?.area || 60}m²
                                </text>
                                <rect x={pos.x + 4} y={pos.y + pos.h - 14} width={pos.w - 8} height="9" fill={isOccupied ? '#065F46' : isMaint ? '#075985' : '#78350F'} />
                                <text x={pos.x + pos.w / 2} y={pos.y + pos.h - 7} fill="#FFFFFF" fontSize="5.5" fontWeight="bold" textAnchor="middle">
                                  {isOccupied ? 'CÓ CƯ DÂN' : isMaint ? 'NGHIỆM THU' : 'TRỐNG'}
                                </text>
                              </g>
                            );
                          });
                        })()}
                      </svg>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center overflow-auto">
                      <img
                        src="/masterplan/the-tropical-floorplan-cad.png"
                        alt="Bản vẽ CAD The Tropical"
                        className="transition-transform duration-200 object-contain shadow-2xl border border-[#233345]"
                        style={{
                          transform: `scale(${floorPlanCadZoom})`,
                          transformOrigin: 'center center',
                          maxHeight: '75vh'
                        }}
                      />
                    </div>
                  )}

                  <div className="text-[10px] text-gray-400 font-mono mt-2 flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-500 inline-block"></span> Đã ở</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[#101722] border border-gray-600 inline-block"></span> Trống</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 bg-amber-500 inline-block"></span> Đang chọn</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 bg-sky-500 inline-block"></span> Căn phụ</span>
                  </div>
                </div>

                <div className="lg:col-span-4 p-4 bg-[#0D121B] flex flex-col justify-between overflow-y-auto space-y-3">
                  <div className="space-y-3">
                    <div className="pb-2.5 border-b border-[#222B35] flex items-start justify-between">
                      <div>
                        <div className="text-[10px] text-[#C5A880] font-mono font-semibold uppercase">
                          CHI TIẾT MỞ RỘNG • TẦNG {currentExpandedUnit.floor}
                        </div>
                        <h3 className="text-xl font-serif font-bold text-white mt-0.5">
                          Căn Hộ {currentExpandedUnit.code}
                        </h3>
                      </div>
                      <span className={`px-2 py-0.5 text-[10px] font-bold border ${
                        currentExpandedUnit.status === 'OCCUPIED'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                          : 'bg-amber-950 text-amber-300 border-amber-500'
                      }`}>
                        {currentExpandedUnit.status === 'OCCUPIED' ? 'CÓ CƯ DÂN' : 'NHÀ TRỐNG'}
                      </span>
                    </div>

                    <div className="p-2.5 bg-[#121822] border border-[#222B35] space-y-2">
                      <div className="text-[11px] font-bold text-[#C5A880]">
                        BỐ TRÍ MẶT BẰNG KHÔNG GIAN
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 text-[10.5px] font-mono">
                        <div className="p-1.5 bg-[#161F2C]">
                          <span className="text-gray-400">Phòng Khách & Bếp:</span>
                          <div className="text-white font-bold">{Math.round(currentExpandedUnit.area * 0.45)} m²</div>
                        </div>
                        <div className="p-1.5 bg-[#161F2C]">
                          <span className="text-gray-400">Phòng Ngủ Master:</span>
                          <div className="text-white font-bold">{Math.round(currentExpandedUnit.area * 0.28)} m²</div>
                        </div>
                        <div className="p-1.5 bg-[#161F2C]">
                          <span className="text-gray-400">Phòng Ngủ Phụ & WC:</span>
                          <div className="text-white font-bold">{Math.round(currentExpandedUnit.area * 0.2)} m²</div>
                        </div>
                        <div className="p-1.5 bg-[#161F2C]">
                          <span className="text-gray-400">Logia & Giặt Phơi:</span>
                          <div className="text-white font-bold">{Math.round(currentExpandedUnit.area * 0.07)} m²</div>
                        </div>
                      </div>

                      <div className="pt-1 border-t border-[#1F2A38] text-[10.5px] font-mono space-y-1">
                        <div className="flex justify-between text-gray-300">
                          <span className="text-gray-400">Hướng Ban Công:</span>
                          <strong className="text-[#C5A880]">{currentExpandedUnit.direction || 'Đông Nam'}</strong>
                        </div>
                        <div className="flex justify-between text-gray-300">
                          <span className="text-gray-400">Tầm Nhìn (View):</span>
                          <strong className="text-white truncate max-w-[150px]">
                            {currentExpandedUnit.code.includes('06') ? 'Hồ Bơi Nhiệt Đới & Sông Đồng Nai' : 'Công Viên Cầu Vồng 36ha'}
                          </strong>
                        </div>
                        <div className="flex justify-between text-gray-300">
                          <span className="text-gray-400">Chiếu Sáng Tự Nhiên:</span>
                          <strong className="text-emerald-400">94% diện tích sàn</strong>
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 bg-[#121822] border border-[#222B35] space-y-2 text-xs font-mono">
                      <div className="text-[11px] font-bold text-amber-300">
                        TIÊU THỤ NĂNG LƯỢNG & DOANH THU CĂN
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                        <div className="p-1.5 bg-[#161F2C] border border-[#26354A]">
                          <div className="text-gray-400">
                            Điện Tiêu Thụ:
                          </div>
                          <div className="text-white font-bold mt-0.5">{currentFin?.electricKwh} kWh</div>
                          <div className="text-[9.5px] text-amber-300">{new Intl.NumberFormat('vi-VN').format(currentFin?.electricCost || 0)} đ</div>
                        </div>

                        <div className="p-1.5 bg-[#161F2C] border border-[#26354A]">
                          <div className="text-gray-400">
                            Nước Tiêu Thụ:
                          </div>
                          <div className="text-white font-bold mt-0.5">{currentFin?.waterM3} m³</div>
                          <div className="text-[9.5px] text-cyan-300">{new Intl.NumberFormat('vi-VN').format(currentFin?.waterCost || 0)} đ</div>
                        </div>
                      </div>

                      <div className="pt-1 border-t border-[#1F2A38] space-y-1 text-[10.5px]">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Doanh Thu Phí BQL Thu Về:</span>
                          <strong className="text-emerald-400">{new Intl.NumberFormat('vi-VN').format(currentFin?.totalBqlRevenue || 0)} đ/tháng</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Giá Cho Thuê Tham Chiếu:</span>
                          <strong className="text-amber-300">{new Intl.NumberFormat('vi-VN').format(currentFin?.estimatedRentalPrice || 0)} đ/tháng</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Suất Sinh Lời Cho Thuê:</span>
                          <strong className="text-emerald-400">{currentFin?.rentalYield}% / năm</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#222B35] flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsFloorPlanExpanded(false);
                        setSelectedAptCode(currentExpandedUnit.code);
                        setDetailTab('FINANCIAL');
                      }}
                      className="flex-1 py-2 px-3 bg-[#C5A880] hover:bg-white text-[#0D1117] font-bold text-xs font-mono transition-all flex items-center justify-center"
                    >
                      Xem Hóa Đơn & Tiêu Thụ
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsFloorPlanExpanded(false);
                        setSelectedAptCode(currentExpandedUnit.code);
                        setIsDetailModalOpen(true);
                      }}
                      className="py-2 px-3 bg-[#161F2C] hover:bg-[#202B3C] text-white border border-[#2D3748] font-bold text-xs font-mono transition-all"
                    >
                      Hồ Sơ Căn
                    </button>
                  </div>
                </div>

              </div>

            </div>
          </div>
        );
      })()}

      {/* ------------------------------------------------------------- */}
      {/* MODAL PHÓNG TO BẢN ĐỒ QUY HOẠCH & BẢN VẼ KIẾN TRÚC TOÀN MÀN HÌNH */}
      {/* ------------------------------------------------------------- */}
      {isMasterPlanZoomed && (() => {
        const planMeta = {
          TROPICAL: {
            title: 'Quy Hoạch Phân Khu The Tropical (The Beverly Solari)',
            desc: '4 Chung Cư BS-07, BS-08, BS-09, BS-10 & 18 Tiện Ích Chuẩn Resort',
            src: '/masterplan/the-tropical-masterplan.png'
          },
          CAD_FLOOR: {
            title: 'Mặt Bằng Tầng Điển Hình Kiến Trúc CAD (BS-07 & BS-09)',
            desc: 'Layout Kỹ Thuật 21 Căn/Sàn, Lõi Thang Máy & Key Plan Định Vị',
            src: '/masterplan/the-tropical-floorplan-cad.png'
          },
          MACRO: {
            title: 'Quy Hoạch Tổng Thể Đại Đô Thị Vinhomes Grand Park (271 ha)',
            desc: 'Vị Trí Phân Khu The Beverly Solari, Vincom Mega Mall, Công Viên 36ha & Vành Đai 3',
            src: '/masterplan/vinhomes-grand-park-macro-plan.jpg'
          },
          SURROUNDINGS: {
            title: 'Bản Đồ Hệ Thống Tiện Ích Đô Thị & Khu Dân Cư',
            desc: 'Mạng Lưới Tiện Ích Giáo Dục, Y Tế, Mua Sắm & Giao Thông Xung Quanh Dự Án',
            src: '/masterplan/vinhomes-amenities-map.jpg'
          }
        }[masterPlanTab] || {
          title: 'Bản Đồ Quy Hoạch',
          desc: '',
          src: '/masterplan/the-tropical-masterplan.png'
        };

        return (
          <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col select-none">
            {/* Thanh điều khiển đỉnh modal */}
            <div className="px-4 py-2.5 bg-[#0D1117] border-b border-[#233345] flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <Map className="w-4 h-4 text-[#C5A880]" />
                <div>
                  <h3 className="text-white font-bold text-sm tracking-wide">
                    {planMeta.title}
                  </h3>
                  <div className="text-[11px] text-gray-400 font-mono">
                    {planMeta.desc}
                  </div>
                </div>
              </div>

              {/* Chuyển tab trực tiếp trong modal */}
              <div className="flex items-center bg-[#141E2B] p-0.5 border border-[#233345] text-xs font-mono">
                {(['TROPICAL', 'SURROUNDINGS', 'CAD_FLOOR', 'MACRO'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => {
                      setMasterPlanTab(tab);
                      setModalZoomScale(1);
                    }}
                    className={`px-2.5 py-1 transition-all ${
                      masterPlanTab === tab
                        ? 'bg-[#C5A880] text-black font-bold'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {tab === 'TROPICAL' ? 'The Tropical (Nội Khu)' : tab === 'SURROUNDINGS' ? 'Tiện Ích Xung Quanh' : tab === 'CAD_FLOOR' ? 'Mặt Bằng CAD' : 'Đại Đô Thị'}
                  </button>
                ))}
              </div>

              {/* Công cụ thu phóng & đóng */}
              <div className="flex items-center gap-2 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setModalZoomScale(prev => Math.max(0.75, Number((prev - 0.25).toFixed(2))))}
                  className="px-2.5 py-1 bg-[#16202C] hover:bg-[#223042] text-gray-300 hover:text-white border border-[#2B3B4E]"
                  title="Thu nhỏ (-)"
                >
                  -
                </button>
                <span className="px-2 py-1 bg-[#101720] border border-[#223042] text-white min-w-[55px] text-center">
                  {Math.round(modalZoomScale * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setModalZoomScale(prev => Math.min(2.5, Number((prev + 0.25).toFixed(2))))}
                  className="px-2.5 py-1 bg-[#16202C] hover:bg-[#223042] text-gray-300 hover:text-white border border-[#2B3B4E]"
                  title="Phóng to (+)"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => setModalZoomScale(1)}
                  className="px-2.5 py-1 bg-[#16202C] hover:bg-[#223042] text-gray-300 hover:text-white border border-[#2B3B4E]"
                >
                  100%
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMasterPlanZoomed(false);
                    setModalZoomScale(1);
                  }}
                  className="p-1.5 bg-red-950/60 hover:bg-red-900 text-red-200 border border-red-700 transition-all ml-2"
                  title="Đóng cửa sổ"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Vùng hiển thị ảnh độ phân giải cao */}
            <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-[#05070A]">
              <div 
                className="max-w-none transition-transform duration-200 ease-out inline-block"
                style={{
                  transform: `scale(${modalZoomScale})`,
                  transformOrigin: 'center center'
                }}
              >
                <img
                  src={planMeta.src}
                  alt={planMeta.title}
                  className="max-h-[85vh] w-auto object-contain mx-auto shadow-2xl border border-[#233345]"
                />
              </div>
            </div>

            {/* Ghi chú chân trang */}
            <div className="px-4 py-2 bg-[#0D1117] border-t border-[#233345] flex items-center justify-between text-[11px] font-mono text-gray-400">
              <span className="flex items-center gap-1.5 text-[#C5A880]">
                <Info className="w-3.5 h-3.5" />
                <span>Bản quyền dữ liệu quy hoạch & bản vẽ kiến trúc đô thị Skyline Apartment & Vinhomes Grand Park</span>
              </span>
              <span>Cuộn chuột hoặc dùng các nút +/- để phóng to từng chi tiết</span>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
