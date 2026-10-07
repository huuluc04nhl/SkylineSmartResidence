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
  ChevronUp,
  Sparkles, 
  Building, 
  Building2,
  Search,
  MapPin, 
  Check, 
  Key,
  UserCheck,
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
import TropicalCampusSvgModel from './models/TropicalCampusSvgModel';
import SurroundingRadarSvgModel from './models/SurroundingRadarSvgModel';
import CadFloorplanSvgModel from './models/CadFloorplanSvgModel';
import MacroCitySvgModel from './models/MacroCitySvgModel';

export type OccupancyFilter = 'ALL' | 'OCCUPIED' | 'VACANT' | 'MAINTENANCE';
export type ApartmentTypeFilter = 'ALL' | '1PN' | '2PN' | '3PN' | 'DUPLEX_PENTHOUSE';
export type FloorRangeFilter = 'ALL' | 'LOW' | 'MID' | 'HIGH';
export type ViewPerspective = 'BUILDING_3D_FLOOR' | 'MASTER_PLAN' | 'GRID' | '3D' | 'BUILDING_ELEVATION' | 'FLOOR_PLAN';

export type BuildingColorTone = 'GOLD_LUXURY';

export interface TropicalAmenity {
  id: string;
  displayNumber?: string;
  name: string;
  category: 'POOL' | 'PARK' | 'SPORT' | 'ACCESS';
  desc: string;
  x: number;
  y: number;
  distance: string;
  isGoldBadge?: boolean;
}

// Danh sách 23 tiện ích quy hoạch phân khu The Tropical chuẩn 100% theo sơ đồ chủ đầu tư (kèm tọa độ định vị trên bản đồ)
export const THE_TROPICAL_AMENITIES: TropicalAmenity[] = [
  // Cột trái (Số tròn đen 01 - 12)
  { id: '01', displayNumber: '01', name: 'Phố cọ Rodeo', category: 'PARK', desc: 'Tuyến phố thương mại shophouse & dạo bộ rợp bóng cọ nhiệt đới', x: 22, y: 84, distance: 'Liền kề BS-7' },
  { id: '02', displayNumber: '02', name: 'Bể bơi nhiệt đới', category: 'POOL', desc: 'Cụm hồ bơi phong cách resort nhiệt đới trung tâm phân khu', x: 42, y: 20, distance: 'Cách BS-7: ~60m' },
  { id: '03', displayNumber: '03', name: 'Bể bơi ốc đảo', category: 'POOL', desc: 'Khu bơi lội thư giãn cảnh quan ốc đảo sinh thái trong lành', x: 48, y: 22, distance: 'Cách BS-7: ~85m' },
  { id: '04', displayNumber: '04', name: 'Bể bơi Malibu', category: 'POOL', desc: 'Bể bơi Malibu chuẩn phong cách resort miền nhiệt đới California', x: 12, y: 14, distance: 'Cụm phía Tây phân khu' },
  { id: '05', displayNumber: '05', name: 'Nhà phụ trợ bể bơi', category: 'POOL', desc: 'Khu thay đồ, tắm tráng & quầy cứu hộ vận hành chuyên nghiệp', x: 44, y: 24, distance: 'Cạnh bể bơi nhiệt đới' },
  { id: '06', displayNumber: '06', name: 'Sân chơi trẻ em', category: 'SPORT', desc: 'Khu vận động vui chơi liên hoàn an toàn cho cư dân nhí', x: 62, y: 22, distance: 'Cách BS-7: ~75m' },
  { id: '07', displayNumber: '07', name: 'Sân Gym ngoài trời', category: 'SPORT', desc: 'Trang thiết bị máy tập thể lực đa năng ngoài trời hiện đại', x: 56, y: 18, distance: 'Cách BS-7: ~50m' },
  { id: '08', displayNumber: '08', name: 'Sân yoga', category: 'SPORT', desc: 'Không gian tĩnh lặng râm mát rèn luyện thể chất & tái tạo năng lượng', x: 26, y: 20, distance: 'Cách BS-7: ~40m' },
  { id: '09', displayNumber: '09', name: 'Suối bậc cảnh quan', category: 'PARK', desc: 'Thác nước bậc thang & dòng chảy sinh thái điều hòa nhiệt độ', x: 45, y: 18, distance: 'Khu vườn trung tâm' },
  { id: '10', displayNumber: '10', name: 'Vườn cọ nhiệt đới Honolulu', category: 'PARK', desc: 'Đại cảnh quan công viên cọ xanh ngát trung tâm The Tropical', x: 49, y: 27, distance: 'Cách BS-7: ~40m' },
  { id: '11', displayNumber: '11', name: 'Vườn California', category: 'PARK', desc: 'Khu vườn dạo bộ phong cách Bờ Tây nước Mỹ sang trọng', x: 30, y: 24, distance: 'Cách BS-7: ~50m' },
  { id: '12', displayNumber: '12', name: 'Vườn San Mario', category: 'PARK', desc: 'Tiểu cảnh hoa cỏ & đường dạo dưỡng sinh cho người cao tuổi', x: 74, y: 29, distance: 'Khu phía Đông phân khu' },

  // Cột phải (Số tròn đen 13 - 16)
  { id: '13', displayNumber: '13', name: 'Biển tên', category: 'ACCESS', desc: 'Cổng chào nhận diện thương hiệu phân khu The Tropical biểu tượng', x: 90, y: 29, distance: 'Cổng đón phân khu' },
  { id: '14', displayNumber: '14', name: 'Chòi nghỉ', category: 'PARK', desc: 'Khu vực dừng chân ngắm cảnh râm mát bên hồ cảnh quan sinh thái', x: 52, y: 18, distance: 'Ven hồ bơi resort' },
  { id: '15', displayNumber: '15', name: 'Giàn cảnh quan', category: 'PARK', desc: 'Điểm nhấn kiến trúc biểu tượng chụp ảnh check-in sống ảo', x: 57, y: 23, distance: 'Cách BS-7: ~65m' },
  { id: '16', displayNumber: '16', name: 'Ghế nghỉ Sunken', category: 'PARK', desc: 'Không gian phòng khách chìm thư thái độc bản giữa làn nước xanh', x: 25, y: 22, distance: 'Ven hồ cảnh quan' },

  // Số tròn vàng (Tiện ích điểm nhấn 01 - 04)
  { id: 'Y-01', displayNumber: '01', isGoldBadge: true, name: 'Sân cỏ đa năng', category: 'PARK', desc: 'Thảm cỏ mở rộng tổ chức sự kiện cộng đồng & dã ngoại gia đình ngoài trời', x: 13, y: 31, distance: 'Cạnh bể bơi Malibu' },
  { id: 'Y-02', displayNumber: '02', isGoldBadge: true, name: 'Thác nước điểm nhấn', category: 'PARK', desc: 'Thác nước trang trí tạo âm thanh róc rách thư giãn tinh thần', x: 13, y: 33, distance: 'Khu Malibu' },
  { id: 'Y-03', displayNumber: '03', isGoldBadge: true, name: 'Artwork điểm nhấn', category: 'PARK', desc: 'Tác phẩm điêu khắc nghệ thuật biểu tượng phong cách nhiệt đới', x: 13, y: 29, distance: 'Khu cảnh quan Tây' },
  { id: 'Y-04', displayNumber: '04', isGoldBadge: true, name: 'Sân thể thao', category: 'SPORT', desc: 'Cụm sân tennis, bóng rổ tiêu chuẩn quốc tế cho cư dân', x: 12, y: 20, distance: 'Khu thể thao Malibu' },

  // Ký hiệu chữ & biểu tượng hạ tầng
  { id: 'P', displayNumber: 'P', name: 'Bãi đỗ xe', category: 'ACCESS', desc: 'Khu vực gửi xe thông minh và lối đón trả khách thuận tiện', x: 77, y: 32, distance: 'Gần Chung Cư BS-10' },
  { id: 'D', displayNumber: 'D', name: 'Lối vào sảnh (Drop off)', category: 'ACCESS', desc: 'Sảnh đón trả khách có mái che trang trọng tại từng chung cư', x: 70, y: 29, distance: 'Sảnh chính chung cư' },
  { id: 'H', displayNumber: '▼', name: 'Lối xuống hầm', category: 'ACCESS', desc: 'Ram dốc kết nối trực tiếp 2 tầng hầm để xe B1/B2 thông minh', x: 47, y: 31, distance: 'Lối xe xuống hầm trung tâm' },
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
  { num: '01', code: 'CH-01', wing: 'NORTH', wingLabel: 'Cánh Bắc', type: '2PN', typeLabel: '2PN Góc', beds: 2, baths: 2, area: 68.4, dir: 'Đông Bắc', defaultPrice: 4.6 },
  { num: '02', code: 'CH-02', wing: 'NORTH', wingLabel: 'Cánh Bắc', type: '1PN', typeLabel: '1PN Tiêu Chuẩn', beds: 1, baths: 1, area: 38.2, dir: 'Đông Bắc', defaultPrice: 2.8 },
  { num: '03', code: 'CH-03', wing: 'NORTH', wingLabel: 'Cánh Bắc', type: '1PN', typeLabel: '1PN+ Đa Năng', beds: 1, baths: 1, area: 46.5, dir: 'Đông Bắc', defaultPrice: 3.2 },
  { num: '04', code: 'CH-04', wing: 'NORTH', wingLabel: 'Cánh Bắc', type: '2PN', typeLabel: '2PN Ban Công Kính', beds: 2, baths: 2, area: 59.1, dir: 'Đông Bắc', defaultPrice: 4.1 },
  { num: '05', code: 'CH-05', wing: 'NORTH', wingLabel: 'Cánh Bắc', type: '2PN', typeLabel: '2PN Góc Đẹp', beds: 2, baths: 2, area: 69.2, dir: 'Đông Bắc', defaultPrice: 4.8 },

  // CÁNH 2: CÁNH NAM (SOUTH WING - Căn 06 đến 10)
  { num: '06', code: 'CH-06', wing: 'SOUTH', wingLabel: 'Cánh Nam', type: '1PN', typeLabel: '1PN View Hồ Bơi', beds: 1, baths: 1, area: 42.0, dir: 'Đông Nam', defaultPrice: 3.4 },
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
    // Khối Cánh Nam (Right Wing): Căn góc CH-06
    list.push({ code: `${fl}-CH-06`, floor: fl, side: 'RIGHT', wing: 'SOUTH', type: '1PN', defaultStatus: fl === 30 ? 'OCCUPIED' : 'VACANT', area: 42, defaultName: fl === 30 ? 'Căn Hộ Đã Ở' : 'Căn Hộ Trống' });
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

  // 2. Phí phương tiện hầm gửi xe (chỉ tính khi có xe đăng ký thực tế)
  const vehicles = unit.vehicles || [];
  let parkingFee = 0;
  if (vehicles.length > 0) {
    vehicles.forEach(v => {
      if (v.type === 'CAR') parkingFee += 1200000;
      else if (v.type === 'MOTORBIKE') parkingFee += 120000;
      else parkingFee += 50000;
    });
  }

  // 3. Tiêu thụ điện sinh hoạt
  let electricKwh = 0;
  let electricCost = 0;
  let waterM3 = 0;
  let waterCost = 0;

  if (isOccupied) {
    electricKwh = Math.round(180 + (area * 1.4));
    // Đơn giá điện lực bậc thang trung bình ~3.100 đ/kWh
    electricCost = Math.round(electricKwh * 3100);
    waterM3 = Math.max(12, Math.round(area * 0.22));
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

// Cấu hình chi tiết các phân khu chức năng Tầng Sảnh (Lobby / G)
const LOBBY_ZONES_DETAIL: Record<string, { title: string; status: string; desc: string; staff: string; hotline: string }> = {
  RECEPTION: {
    title: 'Quầy Đại Lễ Tân & Concierge 24/7',
    status: 'Trực 24/7',
    desc: 'Đón tiếp cư dân, hướng dẫn khách đến thăm, tiếp nhận bàn giao bưu phẩm và điều phối các yêu cầu hỗ trợ khẩn cấp.',
    staff: '2 Lễ tân chuyên nghiệp',
    hotline: '028.7300.8888 (Nhánh 1)'
  },
  BQL_OFFICE: {
    title: 'Văn Phòng Ban Quản Lý (BQL)',
    status: '08:00 - 17:30 (T2 - T7)',
    desc: 'Tiếp nhận ý kiến cư dân, cấp thẻ ra vào, đăng ký gửi xe hầm B1-B2, hỗ trợ thủ tục bàn giao căn hộ và hồ sơ thi công.',
    staff: 'Trưởng ban & 3 Chuyên viên BQL',
    hotline: '028.7300.8888 (Nhánh 2)'
  },
  ELEVATOR_LOBBY: {
    title: 'Sảnh Chờ 6 Thang Máy & Cổng FaceID',
    status: 'Hoạt động liên tục',
    desc: 'Hệ thống kiểm soát an ninh AI thông minh nhận diện khuôn mặt tự động gọi tầng thang máy cho cư dân, 6 thang khách tốc độ cao 3.5m/s.',
    staff: 'Hệ thống AI tự động',
    hotline: 'Kỹ Thuật Thang: 1900.6368'
  },
  LOUNGE: {
    title: 'Resident Lounge Tiếp Khách Sang Trọng',
    status: '06:00 - 22:30',
    desc: 'Không gian tiếp khách sang trọng chuẩn resort nhiệt đới, trang bị điều hòa trung tâm, wifi tốc độ cao và bàn ghế thư giãn.',
    staff: 'Nhân viên sảnh phục vụ',
    hotline: '028.7300.8888 (Nhánh 3)'
  },
  MAIL_LOCKER: {
    title: 'Phòng Hòm Thư & Tủ Smart Locker',
    status: 'Mở cửa 24/7',
    desc: 'Hòm thư bưu điện riêng cho từng căn hộ (T1 đến T34) và hệ thống tủ gửi đồ thông minh mở bằng mã QR hoặc mã OTP.',
    staff: 'Tự phục vụ bằng mã số',
    hotline: 'Hỗ trợ Locker: 1900.2244'
  },
  DROP_OFF: {
    title: 'Ram Dốc Lối Xuống Hầm Xe B1 - B2',
    status: 'Thông suốt 24/7',
    desc: 'Lối ram dốc 2 chiều rộng 7m dẫn xuống hầm B1 (xe máy & sạc xe điện) và hầm B2 (ô tô), barrier tự động nhận diện biển số.',
    staff: '2 Nhân viên điều phối giao thông',
    hotline: 'Đội An Ninh Hầm: Nhánh 4'
  }
};

export default function AdminBuildingApartmentManager() {
  // 1. Quản lý danh sách căn hộ thực tế từ apartmentStore & NKS API
  const [apartments, setApartments] = useState<ApartmentUnit[]>([]);
  const [selectedAptCode, setSelectedAptCode] = useState<string>('CH-06');
  const [selectedBlock, setSelectedBlock] = useState<'BS-07' | 'BS-08' | 'BS-09' | 'BS-10'>('BS-07');
  const buildingColorTone: BuildingColorTone = 'GOLD_LUXURY';

  const [selectedFloorRange, setSelectedFloorRange] = useState<FloorRangeFilter>('ALL');
  const [buildingPerspective, setBuildingPerspective] = useState<ViewPerspective>('BUILDING_3D_FLOOR');
    const [detailTab, setDetailTab] = useState<'OVERVIEW' | 'FINANCIAL' | 'TECHNICAL'>('OVERVIEW');

  // Điều khiển Floor Plan View (Mặt Bằng Tầng & Chế độ Mở Rộng) - Mặc định tầng 30 của chủ hộ
  const [selectedFloor, setSelectedFloor] = useState<number>(30);
  const [selectedLobbyZone, setSelectedLobbyZone] = useState<string>('RECEPTION');
  const [hoveredUnitCode, setHoveredUnitCode] = useState<string | null>(null);
  const [hoveredFloor, setHoveredFloor] = useState<number | null>(null);
  const [buildingTheme, setBuildingTheme] = useState<'NIGHT' | 'DAY'>('NIGHT');
  const [building3dZoom, setBuilding3dZoom] = useState<number>(1);
  const [isFloorPlanExpanded, setIsFloorPlanExpanded] = useState<boolean>(false);
  const [floorFilterStatus, setFloorFilterStatus] = useState<'ALL' | 'OCCUPIED' | 'VACANT' | 'MAINTENANCE'>('ALL');
  const [unitSearchQuery, setUnitSearchQuery] = useState<string>('');
  const [floorPlanViewMode, setFloorPlanViewMode] = useState<'CAD_VECTOR' | 'BLUEPRINT_IMAGE'>('CAD_VECTOR');
  const [floorPlanFilterWing, setFloorPlanFilterWing] = useState<'ALL' | 'NORTH' | 'SOUTH' | 'WEST'>('ALL');
  const [floorPlanCadZoom, setFloorPlanCadZoom] = useState<number>(1);
  const [billToastMessage, setBillToastMessage] = useState<string | null>(null);

  // Điều khiển chế độ xem Bản đồ Quy hoạch Phân khu & Đô thị
  const [masterPlanTab, setMasterPlanTab] = useState<'TROPICAL' | 'SURROUNDINGS' | 'MACRO'>('TROPICAL');
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

  // Chuyển đổi giữa 4 Chung Cư (Giữ nguyên góc nhìn hiện tại, không tự ý nhảy tab)
  const handleSwitchBlock = async (blockCode: 'BS-07' | 'BS-08' | 'BS-09' | 'BS-10') => {
    setSelectedBlock(blockCode);
    const maxFloors = blockCode === 'BS-08' ? 39 : 34;
    
    // Load local block units immediately for instant UI responsiveness
    const localUnits = getApartmentUnits(blockCode);
    setApartments(localUnits);

    // Giữ nguyên số tầng hiện tại nếu hợp lệ, chỉ điều chỉnh nếu vượt quá số tầng tối đa của tòa
    const nextFloor = selectedFloor > maxFloors ? 1 : selectedFloor;
    setSelectedFloor(nextFloor);
    const targetUnit = localUnits.find(u => u.floor === nextFloor) || localUnits[0];
    if (targetUnit) {
      setSelectedAptCode(targetUnit.code);
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


  const currentBlockConfig = useMemo(() => {
    switch (selectedBlock) {
      case 'BS-08':
        return { name: 'Chung Cư BS-08', floors: 39, badge: 'Chung Cư Điểm Nhấn (39 Tầng)' };
      case 'BS-09':
        return { name: 'Chung Cư BS-09', floors: 34, badge: 'Chung Cư Hướng Công Viên (34 Tầng)' };
      case 'BS-10':
        return { name: 'Chung Cư BS-10', floors: 34, badge: 'Chung Cư Hướng Quảng Trường (34 Tầng)' };
      default:
        return { name: 'Chung Cư BS-07', floors: 34, badge: 'Chung Cư Cư Dân (34 Tầng)' };
    }
  }, [selectedBlock]);

  const currentBlockName = currentBlockConfig.name;
  const currentTotalFloors = currentBlockConfig.floors;

  // Danh sách căn hộ hiển thị đồng bộ theo dữ liệu quản lý tòa nhà
  const displayUnits = useMemo(() => {
    return apartments.map(u => ({
      ...u,
      towerName: currentBlockName,
      statusLabel: u.status === 'OCCUPIED' ? 'Đã Bàn Giao (Có Cư Dân)' : u.status === 'MAINTENANCE' ? 'Nghiệm Thu Kỹ Thuật' : 'Căn Hộ Trống'
    }));
  }, [apartments, currentBlockName]);

  // Danh sách căn hộ hiển thị đồng bộ theo bộ lọc trạng thái và tìm kiếm
  const filteredUnits = useMemo(() => {
    return displayUnits.filter(u => {
      if (floorFilterStatus !== 'ALL' && u.status !== floorFilterStatus) return false;
      if (unitSearchQuery.trim()) {
        const q = unitSearchQuery.trim().toLowerCase();
        const codeMatch = u.code.toLowerCase().includes(q);
        const ownerMatch = u.owner?.name?.toLowerCase().includes(q);
        const floorMatch = String(u.floor) === q;
        if (!codeMatch && !ownerMatch && !floorMatch) return false;
      }
      return true;
    });
  }, [displayUnits, floorFilterStatus, unitSearchQuery]);

  // Điều phối chọn căn hộ
  const handleSelectApartment = (unit: ApartmentUnit) => {
    setSelectedAptCode(unit.code);
    if (unit.floor && unit.floor !== selectedFloor) {
      setSelectedFloor(unit.floor);
    }
  };

  // Điều hướng và chọn tầng thông minh - Đồng bộ 100% dữ liệu mặt bằng, số căn và hồ sơ căn hộ
  const handleSelectFloor = useCallback((targetFloor: number) => {
    const safeFloor = Math.max(0, Math.min(currentTotalFloors, targetFloor));
    setSelectedFloor(safeFloor);
    if (safeFloor >= 1) {
      // Chuyển mã căn hộ sang tầng mới tương ứng theo đúng vị trí
      const baseCode = selectedAptCode?.includes('-') ? selectedAptCode.split('-').pop() : (selectedAptCode || 'CH-06');
      const newTargetCode = (safeFloor === 30 && selectedBlock === 'BS-07') ? (baseCode || 'CH-06') : `${safeFloor}-${baseCode || 'CH-06'}`;
      setSelectedAptCode(newTargetCode);
    }
  }, [currentTotalFloors, selectedAptCode, selectedBlock]);

  const handleSelectBlockAndShowFloors = (blockCode: any) => {
    handleSwitchBlock(blockCode);
    setBuildingPerspective('BUILDING_3D_FLOOR');
    };

  const handleSelectFloorAndShowUnits = (floor: number) => {
    handleSelectFloor(floor);
    setBuildingPerspective('BUILDING_3D_FLOOR');
  };

  const isAnyFilterActive = false;

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

  // Danh sách các tầng thực tế của chung cư (sắp xếp giảm dần từ tầng cao nhất xuống tầng 1)
  const buildingFloors = useMemo(() => {
    const list: number[] = [];
    for (let f = currentTotalFloors; f >= 1; f--) {
      list.push(f);
    }
    return list;
  }, [currentTotalFloors]);

  // Danh sách các căn hộ thuộc tầng đang chọn theo mặt bằng kiến trúc 21 căn The Tropical
  const floorUnits = useMemo(() => {
    return CAD_FLOOR_UNITS_CONFIG.map(cfg => {
      const chCode = cfg.code;
      const targetCode = (selectedFloor === 30 && selectedBlock === 'BS-07') ? chCode : `${selectedFloor}-${chCode}`;
      const found = displayUnits.find(u => 
        u.floor === selectedFloor && (
          u.code.toUpperCase() === chCode ||
          u.code.toUpperCase() === targetCode ||
          u.code.toUpperCase().endsWith(`-${chCode}`) ||
          u.code.toUpperCase().endsWith(chCode) ||
          u.code.toUpperCase().endsWith(`-${cfg.num}`) ||
          u.code.toUpperCase().endsWith(cfg.num) ||
          (selectedFloor === 30 && u.code === chCode)
        )
      );

      if (found) {
        return found;
      }

      return ({
        code: targetCode,
        tower: (selectedBlock === 'BS-09' || selectedBlock === 'BS-10') ? 'B' : 'A',
        towerName: currentBlockName,
        floor: selectedFloor,
        type: cfg.type,
        typeLabel: cfg.typeLabel,
        status: 'VACANT',
        statusLabel: 'Căn Hộ Trống',
        area: cfg.area,
        wallArea: Math.round(cfg.area * 1.08 * 10) / 10,
        bedrooms: cfg.beds,
        bathrooms: cfg.baths,
        direction: cfg.dir,
        priceBillion: cfg.defaultPrice,
      } as ApartmentUnit);
    });
  }, [displayUnits, selectedFloor, selectedBlock, currentBlockName]);

  const floorOccupiedCount = useMemo(() => floorUnits.filter(u => u.status === 'OCCUPIED').length, [floorUnits]);
  const floorMaintenanceCount = useMemo(() => floorUnits.filter(u => u.status === 'MAINTENANCE').length, [floorUnits]);
  const floorVacantCount = useMemo(() => floorUnits.filter(u => u.status === 'VACANT').length, [floorUnits]);

  // Căn hộ đang được chọn làm tiêu điểm hồ sơ - LUÔN THUỘC TẦNG ĐANG CHỌN (selectedFloor)
  const activeUnit = useMemo(() => {
    if (!floorUnits || floorUnits.length === 0) return null;

    // 1. Tìm chính xác theo mã căn hộ trong danh sách 21 căn của tầng đang chọn
    let unit = floorUnits.find(u => u.code === selectedAptCode);
    if (unit) return unit;

    // 2. Tìm theo số hiệu / mã đuôi căn hộ (ví dụ: 'CH-06' hoặc '30-CH-06' khớp với '12-CH-06')
    const baseCode = selectedAptCode?.includes('-') ? selectedAptCode.split('-').pop() : selectedAptCode;
    if (baseCode) {
      unit = floorUnits.find(u => 
        u.code === baseCode || 
        u.code === `${selectedFloor}-${baseCode}` ||
        u.code.endsWith(`-${baseCode}`) || 
        u.code.endsWith(baseCode)
      );
      if (unit) return unit;
    }

    // 3. Ưu tiên căn đã có người ở trên tầng này nếu có
    unit = floorUnits.find(u => u.status === 'OCCUPIED');
    if (unit) return unit;

    // 4. Mặc định là căn đầu tiên của tầng đang chọn
    return floorUnits[0] || null;
  }, [floorUnits, selectedAptCode, selectedFloor]);

  // Thống kê từng tầng của tòa nhà phục vụ mô hình 3D
  const floorStatsList = useMemo(() => {
    const list: Array<{ floor: number; total: number; occupied: number; maintenance: number; vacant: number }> = [];
    for (let fl = currentTotalFloors; fl >= 1; fl--) {
      const unitsOnFl = displayUnits.filter(u => u.floor === fl);
      const occupied = unitsOnFl.filter(u => u.status === 'OCCUPIED').length;
      const maintenance = unitsOnFl.filter(u => u.status === 'MAINTENANCE').length;
      const total = 21;
      const vacant = Math.max(0, total - occupied - maintenance);
      list.push({ floor: fl, total, occupied, maintenance, vacant });
    }
    return list;
  }, [displayUnits, currentTotalFloors]);

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
            Sơ đồ mặt bằng và trạng thái kỹ thuật căn hộ.
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
      {/* BỘ LỌC TINH GỌN BQL: CHUNG CƯ • TẦNG • TÌM KIẾM • TRẠNG THÁI   */}
      {/* ============================================================= */}
      <div className="bg-[#0B121D] border border-[#1E2D42] p-2.5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          
          {/* Cụm 1: Chọn Chung Cư & Tầng & Tìm Kiếm */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* 1. CHỌN CHUNG CƯ */}
            <div className="flex items-center gap-1 bg-[#121B27] border border-[#1E2D42] p-1">
              <span className="text-gray-400 font-medium text-[11px] px-1.5 flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-[#C5A880]" />
                <span className="hidden sm:inline">Chung Cư:</span>
              </span>
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
                    className={`px-2.5 py-1 text-xs font-mono transition-all flex items-center gap-1 border ${
                      isCurrent
                        ? 'bg-[#C5A880] text-black border-[#C5A880] font-bold shadow'
                        : 'bg-[#0E1521] text-gray-300 border-[#1B293C] hover:border-[#385175] hover:text-white'
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

            {/* 2. CHỌN TẦNG TINH GỌN */}
            <div className="flex items-center gap-1 bg-[#121B27] border border-[#1E2D42] p-1">
              <span className="text-gray-400 font-medium text-[11px] px-1.5 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-[#C5A880]" />
                <span className="hidden sm:inline">Tầng:</span>
              </span>

              <button
                type="button"
                onClick={() => handleSelectFloor(selectedFloor - 1)}
                disabled={selectedFloor <= 0}
                className="w-6 h-6 flex items-center justify-center bg-[#1A2536] hover:bg-[#25354D] text-gray-300 hover:text-white disabled:opacity-30 border border-[#2C3E56]"
                title="Tầng bên dưới"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              
              <select
                value={selectedFloor}
                onChange={(e) => handleSelectFloor(Number(e.target.value))}
                className="bg-[#182333] border border-[#2D3E56] text-white font-mono font-bold text-xs px-2 py-0.5 outline-none focus:border-[#C5A880] cursor-pointer"
              >
                <option value={0}>Sảnh (G) - Dịch Vụ</option>
                {buildingFloors.map(f => (
                  <option key={f} value={f}>
                    Tầng {f} {f === 30 ? '(Chủ Hộ)' : ''}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => handleSelectFloor(selectedFloor + 1)}
                disabled={selectedFloor >= currentTotalFloors}
                className="w-6 h-6 flex items-center justify-center bg-[#1A2536] hover:bg-[#25354D] text-gray-300 hover:text-white disabled:opacity-30 border border-[#2C3E56]"
                title="Tầng bên trên"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {/* 3. Ô TÌM NHANH CĂN HỘ */}
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2 pointer-events-none" />
              <input
                type="text"
                placeholder="Tìm mã căn (vd: 06, CH-01)..."
                value={unitSearchQuery}
                onChange={(e) => {
                  const val = e.target.value;
                  setUnitSearchQuery(val);
                  if (val.trim()) {
                    const clean = val.trim().toLowerCase();
                    const match = floorUnits.find(u => u.code.toLowerCase().includes(clean)) 
                                || displayUnits.find(u => u.code.toLowerCase().includes(clean));
                    if (match) {
                      setSelectedAptCode(match.code);
                      if (match.floor && match.floor !== selectedFloor) {
                        setSelectedFloor(match.floor);
                      }
                    }
                  }
                }}
                className="pl-7 pr-6 py-1 bg-[#121B27] border border-[#1E2D42] text-white text-xs placeholder-gray-500 outline-none focus:border-[#C5A880] w-36 sm:w-44 transition-all font-mono"
              />
              {unitSearchQuery && (
                <button
                  type="button"
                  onClick={() => setUnitSearchQuery('')}
                  className="absolute right-2 text-gray-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Cụm 2: Bộ Lọc Trạng Thái Cư Trú Kèm Số Lượng Trực Tiếp & Làm Mới */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <div className="flex items-center gap-1 bg-[#121B27] border border-[#1E2D42] p-1">
              {[
                { key: 'ALL', label: 'Tất Cả', count: totalUnitsCount, countColor: 'text-gray-300' },
                { key: 'OCCUPIED', label: 'Đã Ở', count: occupiedCount, countColor: 'text-emerald-400' },
                { key: 'VACANT', label: 'Căn Trống', count: vacantCount, countColor: 'text-amber-400' },
                { key: 'MAINTENANCE', label: 'Bảo Trì', count: maintenanceCount, countColor: 'text-blue-400' },
              ].map(item => {
                const isActive = floorFilterStatus === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setFloorFilterStatus(item.key as any)}
                    className={`px-2.5 py-1 text-xs transition-all flex items-center gap-1.5 border ${
                      isActive
                        ? 'bg-[#C5A880] text-black border-[#C5A880] font-bold shadow'
                        : 'bg-[#0E1521] text-gray-300 border-[#1B293C] hover:border-[#385175] hover:text-white'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className={`text-[10px] font-mono px-1 py-0.2 ${
                      isActive ? 'bg-black/20 text-black font-bold' : `${item.countColor} bg-[#152132]`
                    }`}>
                      {item.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Nút Đồng bộ dữ liệu BQL */}
            <button
              type="button"
              onClick={() => syncLiveApartmentsFromApi(selectedBlock)}
              disabled={isSyncingApi}
              className="p-1.5 bg-[#121B27] hover:bg-[#1A2536] text-gray-300 hover:text-white border border-[#1E2D42] transition-colors disabled:opacity-50"
              title="Đồng bộ dữ liệu cư dân mới nhất"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#C5A880] ${isSyncingApi ? 'animate-spin' : ''}`} />
            </button>
          </div>

        </div>
      </div>

      {/* 4. KHU VỰC CHÍNH: SƠ ĐỒ CHUNG CƯ & HỒ SƠ CHI TIẾT CĂN HỘ       */}
      {/* ============================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* CỘT TRÁI: SƠ ĐỒ CHUNG CƯ / MÔ HÌNH 3D / DANH SÁCH */}
        <div className={`${(buildingPerspective === 'BUILDING_3D_FLOOR' || buildingPerspective === '3D' || buildingPerspective === 'BUILDING_ELEVATION' || buildingPerspective === 'FLOOR_PLAN') ? 'lg:col-span-6' : 'lg:col-span-7'} bg-[#0D1117] border border-[#222B35] rounded-none overflow-hidden shadow-2xl flex flex-col`}>
          
          {/* THANH ĐIỀU HÀNH GÓC NHÌN DUY NHẤT (SINGLE UNIFIED VIEWPORT TOOLBAR) */}
          <div className="px-2 sm:px-3 py-1.5 bg-[#0E1520] border-b border-[#222B35] flex items-center justify-between gap-2 text-xs">
            {/* 3 Tab Chuyển Đổi Góc Nhìn Chuẩn BQL */}
            <div className="flex items-center overflow-x-auto no-scrollbar scroll-smooth bg-[#070B11] p-0.5 border border-[#1E2A38] text-xs font-semibold shrink-0">
              {/* Tab 1: Quy Hoạch */}
              <button
                type="button"
                onClick={() => {
                  setBuildingPerspective('MASTER_PLAN');
                  setMasterPlanTab('TROPICAL');
                }}
                className={`px-3 py-1.5 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 text-xs ${
                  buildingPerspective === 'MASTER_PLAN'
                    ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Bản đồ quy hoạch phân khu The Tropical và tiện ích nội/ngoại khu"
              >
                <Map className="w-3.5 h-3.5 shrink-0" />
                <span>Khuôn Viên & Tiện Ích</span>
              </button>

              {/* Tab 2: Số Tầng & Mặt Bằng 3D (Gộp Số Tầng, Mặt Bằng và Mô Hình 3D) */}
              <button
                type="button"
                onClick={() => {
                  setBuildingPerspective('BUILDING_3D_FLOOR');
                  }}
                className={`px-3 py-1.5 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 text-xs ${
                  buildingPerspective === 'BUILDING_3D_FLOOR' || buildingPerspective === '3D' || buildingPerspective === 'BUILDING_ELEVATION' || buildingPerspective === 'FLOOR_PLAN'
                    ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Mô hình 3D thống kê số tầng và xem mặt bằng căn hộ trực quan"
              >
                <Building2 className="w-3.5 h-3.5 shrink-0" />
                <span>Số Tầng & Mặt Bằng 3D</span>
                <span className={`text-[9.5px] px-1.5 py-0.2 font-mono font-bold ${
                  (buildingPerspective === 'BUILDING_3D_FLOOR' || buildingPerspective === '3D' || buildingPerspective === 'BUILDING_ELEVATION' || buildingPerspective === 'FLOOR_PLAN')
                    ? 'bg-black/20 text-black' 
                    : 'text-amber-300'
                }`}>
                  {selectedBlock} • {selectedFloor === 0 ? 'Sảnh (G)' : `T${selectedFloor}`}
                </span>
              </button>

              {/* Tab 3: Lưới Căn Hộ */}
              <button
                type="button"
                onClick={() => setBuildingPerspective('GRID')}
                className={`px-3 py-1.5 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 text-xs ${
                  buildingPerspective === 'GRID'
                    ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Danh sách toàn bộ căn hộ dạng bảng lưới"
              >
                <FileText className="w-3.5 h-3.5 shrink-0" />
                <span>Danh Sách Căn Hộ</span>
              </button>
            </div>

            {/* BÊN PHẢI: BỘ CÔNG CỤ THEO NGỮ CẢNH CỦA VIEW */}
            <div className="flex items-center gap-2 shrink-0">
              {buildingPerspective === 'MASTER_PLAN' && (
                <button
                  type="button"
                  onClick={() => setIsMasterPlanZoomed(true)}
                  className="px-2.5 py-1 bg-[#141E2B] hover:bg-[#C5A880] text-[#C5A880] hover:text-black border border-[#223348] text-xs font-mono font-bold transition-all flex items-center gap-1 shrink-0"
                  title="Phóng to toàn cảnh"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Toàn Cảnh</span>
                </button>
              )}

              {(buildingPerspective === 'BUILDING_3D_FLOOR' || buildingPerspective === '3D' || buildingPerspective === 'BUILDING_ELEVATION' || buildingPerspective === 'FLOOR_PLAN') && (
                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-[#141E2B] border border-[#233345] text-[11px] font-mono shrink-0">
                    <span className="text-gray-400">Đang chiếu:</span>
                    <strong className="text-amber-300">{selectedFloor === 0 ? "Tầng Sảnh (G)" : `Tầng ${selectedFloor}`}</strong>
                    <span className="text-gray-600">•</span>
                    <strong className="text-[#C5A880]">Căn {selectedAptCode}</strong>
                  </div>

                  {/* Lọc khoảng tầng */}
                  <div className="flex items-center gap-1 font-mono text-[10.5px]">
                    {[
                      { key: 'ALL', label: 'Tất Cả Tầng' },
                      { key: 'LOW', label: 'Tầng Thấp (1-10)' },
                      { key: 'MID', label: 'Tầng Trung (11-20)' },
                      { key: 'HIGH', label: 'Tầng Cao (21+)' }
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setSelectedFloorRange(item.key as FloorRangeFilter)}
                        className={`px-2 py-0.5 border transition-all ${
                          selectedFloorRange === item.key
                            ? 'bg-[#C5A880] text-black font-bold border-[#C5A880]'
                            : 'bg-[#141E2B] text-gray-300 border-[#233345] hover:text-white'
                        }`}
                        title={`Lọc tầng: ${item.label}`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  {/* Chế độ Ngày / Đêm */}
                  <button
                    type="button"
                    onClick={() => setBuildingTheme(buildingTheme === 'NIGHT' ? 'DAY' : 'NIGHT')}
                    className="px-2 py-0.5 bg-[#141E2B] hover:bg-[#1E2E40] border border-[#233345] text-white text-[10.5px] font-mono transition-all shrink-0"
                    title={buildingTheme === 'NIGHT' ? 'Chuyển sang chế độ Ban Ngày' : 'Chuyển sang chế độ Ban Đêm'}
                  >
                    <span>{buildingTheme === 'NIGHT' ? 'Đêm' : 'Ngày'}</span>
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

          {/* THANH PHÂN CẤP BẢN ĐỒ QUY HOẠCH TINH GỌN (MASTER PLAN SCOPE TABS) */}
          {buildingPerspective === 'MASTER_PLAN' && (
            <div className="px-2 sm:px-3 py-1.5 bg-[#090E17] border-b border-[#1E293B] flex items-center justify-between gap-2 text-xs font-mono">
              <div className="flex items-center gap-1 bg-[#121A26] p-0.5 border border-[#202E42]">
                <button
                  type="button"
                  onClick={() => setMasterPlanTab('TROPICAL')}
                  className={`px-2.5 py-1 text-xs transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                    masterPlanTab === 'TROPICAL'
                      ? 'bg-[#C5A880] text-black font-bold shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  title="Phân khu The Tropical và 23 tiện ích nội khu"
                >
                  <Map className="w-3.5 h-3.5 shrink-0" />
                  <span>The Tropical (23)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMasterPlanTab('SURROUNDINGS')}
                  className={`px-2.5 py-1 text-xs transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                    masterPlanTab === 'SURROUNDINGS'
                      ? 'bg-[#C5A880] text-black font-bold shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  title="Hệ thống tiện ích thành phố biển hồ & xung quanh"
                >
                  <Waves className="w-3.5 h-3.5 shrink-0" />
                  <span>Tiện Ích Biển Hồ (8)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMasterPlanTab('MACRO')}
                  className={`px-2.5 py-1 text-xs transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                    masterPlanTab === 'MACRO'
                      ? 'bg-[#C5A880] text-black font-bold shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  title="Quy hoạch tổng thể đại đô thị Vinhomes Grand Park 271 ha"
                >
                  <Building2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Đại Đô Thị (271ha)</span>
                </button>
              </div>

              <div className="text-[11px] text-gray-400 hidden sm:flex items-center gap-1 shrink-0">
                <span className="text-[#C5A880]">💡</span>
                <span>Bấm chọn khối Chung Cư để xem số tầng</span>
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------- */}
          {/* GÓC NHÌN 1: MÔ HÌNH KHỐI 3D KIẾN TRÚC CHUNG CƯ & SỐ TẦNG */}
          {/* ----------------------------------------------------------- */}
          {(buildingPerspective === 'BUILDING_3D_FLOOR' || buildingPerspective === '3D' || buildingPerspective === 'BUILDING_ELEVATION' || buildingPerspective === 'FLOOR_PLAN') && (() => {
            const curTone = toneConfig.GOLD_LUXURY;

            const floorStep = (790 - 95) / (currentTotalFloors - 1);
            const baseRulerLevels = currentTotalFloors === 39 
              ? [39, 35, 30, 25, 20, 15, 10, 5, 1] 
              : [34, 30, 25, 20, 15, 10, 5, 1];
            // Đồng bộ thước đo: luôn luôn có mốc tầng đang chọn, nếu sát mốc khác thì thay thế mốc đó để không đè chữ
            const rulerLevels = Array.from(new Set([
              ...baseRulerLevels.filter(fl => Math.abs(fl - selectedFloor) > 1),
              ...(selectedFloor > 0 ? [selectedFloor] : [])
            ])).sort((a, b) => b - a);

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

                {/* THANH HUD ĐIỀU KHIỂN & PHÓNG TO 3D GÓC TRÊN */}
                <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
                  {/* Chip thông số tòa nhà góc trái */}
                  <div className="pointer-events-auto flex items-center gap-2 px-2.5 py-1 bg-[#090E17]/90 border border-[#222E3E] text-xs font-mono shadow-lg backdrop-blur-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[#C5A880] font-bold">{selectedBlock} • THE TROPICAL</span>
                    <span className="text-gray-500">|</span>
                    <span className="text-gray-300">Lấp đầy: <strong className="text-emerald-400">{occupancyRate}%</strong></span>
                    <span className="text-gray-500 hidden sm:inline">|</span>
                    <span className="text-gray-400 text-[10.5px] hidden sm:inline">21 Căn/Tầng</span>
                  </div>

                  {/* Bộ điều khiển Zoom góc phải */}
                  <div className="pointer-events-auto flex items-center gap-1 bg-[#090E17]/90 p-1 border border-[#222E3E] text-xs font-mono shadow-lg backdrop-blur-sm">
                    <button
                      type="button"
                      onClick={() => setBuilding3dZoom(z => Math.max(0.85, Number((z - 0.15).toFixed(2))))}
                      className="w-6 h-6 flex items-center justify-center bg-[#141E2B] hover:bg-[#C5A880] text-gray-300 hover:text-black font-bold transition-all"
                      title="Thu nhỏ mô hình"
                    >
                      -
                    </button>
                    <span className="px-1.5 text-[10.5px] text-[#C5A880] font-bold min-w-[38px] text-center">
                      {Math.round(building3dZoom * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={() => setBuilding3dZoom(z => Math.min(2.2, Number((z + 0.15).toFixed(2))))}
                      className="w-6 h-6 flex items-center justify-center bg-[#141E2B] hover:bg-[#C5A880] text-gray-300 hover:text-black font-bold transition-all"
                      title="Phóng to mô hình"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => setBuilding3dZoom(1)}
                      className="px-1.5 h-6 flex items-center justify-center bg-[#141E2B] hover:bg-[#1E2E40] text-gray-400 hover:text-white text-[10px] transition-all ml-0.5"
                      title="Đặt lại kích thước chuẩn"
                    >
                      100%
                    </button>
                  </div>
                </div>

                {/* BẢN VẼ PHỐI CẢNH 3D CHUNG CƯ ISOMETRIC MỞ RỘNG TOÀN DIỆN KHUNG HÌNH */}
                <div className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden">
                  <div 
                    className="w-full h-full flex items-center justify-center transition-transform duration-300 ease-out"
                    style={{
                      transform: `scale(${building3dZoom})`,
                      transformOrigin: 'center center'
                    }}
                  >
                    <svg
                      viewBox="10 -20 960 1100"
                      preserveAspectRatio="xMidYMid meet"
                      className="w-full h-full cursor-default drop-shadow-[0_30px_60px_rgba(0,0,0,0.95)]"
                    >
                      <defs>
                        <style>{`
                          @keyframes laserDrawPath {
                            0% { stroke-dashoffset: 380; opacity: 0; }
                            20% { opacity: 1; }
                            100% { stroke-dashoffset: 0; opacity: 1; }
                          }
                          @keyframes calloutSlideIn {
                            0% { opacity: 0; transform: translateY(10px) scale(0.96); }
                            100% { opacity: 1; transform: translateY(0) scale(1); }
                          }
                          @keyframes pingRing {
                            0% { r: 3.5; opacity: 1; stroke-width: 2.5; }
                            70% { opacity: 0.5; }
                            100% { r: 18; opacity: 0; stroke-width: 0.5; }
                          }
                          .anim-laser-line {
                            stroke-dasharray: 380;
                            stroke-dashoffset: 380;
                            animation: laserDrawPath 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                          }
                          .anim-callout-card {
                            animation: calloutSlideIn 0.45s 0.15s cubic-bezier(0.16, 1, 0.3, 1) both;
                          }
                          .anim-ping-pulse {
                            animation: pingRing 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
                          }
                        `}</style>

                        <filter id="unitGlow" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="3" result="blur" />
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
                      </defs>

                      {/* THƯỚC ĐO CAO ĐỘ CÁC TẦNG BÊN TRÁI (LEVEL RULER) */}
                      <g className="font-mono text-[9.5px]">
                        {/* VẠCH TẦNG SẢNH (G) */}
                        {(() => {
                          const yPos = 785;
                          const isFloorSelected = selectedFloor === 0;
                          const rulerColor = isFloorSelected ? '#C5A880' : '#38BDF8';
                          const rulerTextColor = isFloorSelected ? '#E6CA9E' : '#7DD3FC';
                          const rulerBg = isFloorSelected ? '#2A2015' : '#082F49';
                          const rulerBorder = isFloorSelected ? '#C5A880' : '#0369A1';
                          return (
                            <g
                              key="level-ruler-lobby"
                              onClick={() => handleSelectFloor(0)}
                              onMouseEnter={() => setHoveredFloor(0)}
                              onMouseLeave={() => setHoveredFloor(null)}
                              className="cursor-pointer group"
                            >
                              <line 
                                x1="88" 
                                y1={yPos} 
                                x2="200" 
                                y2={yPos} 
                                stroke={rulerColor} 
                                strokeWidth={isFloorSelected ? 2 : 1.2} 
                              />
                              <circle cx="200" cy={yPos} r={isFloorSelected ? 4 : 3} fill={rulerColor} />
                              <rect
                                x="18"
                                y={yPos - 9}
                                width="68"
                                height="18"
                                rx="3"
                                fill={rulerBg}
                                stroke={rulerBorder}
                                strokeWidth={isFloorSelected ? 1.6 : 1}
                                className="group-hover:stroke-cyan-300 transition-all"
                              />
                              <text x="52" y={yPos + 3.8} fill={rulerTextColor} fontWeight="bold" textAnchor="middle">
                                SẢNH (G)
                              </text>
                            </g>
                          );
                        })()}
                        {rulerLevels.map(fl => {
                          const yBase = 790 - (fl - 1) * floorStep;
                          const flH = fl === currentTotalFloors ? 18 : 14;
                          // Tâm dải tầng 3D tại vách bên trái (x = 220) nằm chính xác giữa (yBase - 40 - flH) và (yBase - 40)
                          const yPos = Number((yBase - 40 - (flH / 2)).toFixed(1));
                          const hasOccupied = displayUnits.some(u => u.floor === fl && u.status === 'OCCUPIED');
                          const isFloorSelected = selectedFloor === fl;
                          const rulerColor = isFloorSelected ? '#C5A880' : hasOccupied ? '#10B981' : '#334155';
                          const rulerTextColor = isFloorSelected ? '#E6CA9E' : hasOccupied ? '#34D399' : '#94A3B8';
                          const rulerBg = isFloorSelected ? '#2A2015' : hasOccupied ? '#064E3B' : '#0B121D';
                          const rulerBorder = isFloorSelected ? '#C5A880' : hasOccupied ? '#10B981' : '#1E2D42';

                          return (
                            <g
                              key={`level-ruler-${fl}`}
                              onClick={() => {
                                handleSelectFloor(fl);
                              }}
                              onMouseEnter={() => setHoveredFloor(fl)}
                              onMouseLeave={() => setHoveredFloor(null)}
                              className="cursor-pointer group"
                            >
                              <line 
                                x1="88" 
                                y1={yPos} 
                                x2="220" 
                                y2={yPos} 
                                stroke={rulerColor} 
                                strokeWidth={isFloorSelected || hasOccupied ? 1.8 : 1} 
                                strokeDasharray={isFloorSelected || hasOccupied ? 'none' : '3 3'} 
                              />
                              <circle cx="220" cy={yPos} r={isFloorSelected ? 4 : hasOccupied ? 3 : 2} fill={rulerColor} />
                              
                              <rect
                                x="22"
                                y={yPos - 9}
                                width="64"
                                height="18"
                                rx="3"
                                fill={rulerBg}
                                stroke={rulerBorder}
                                strokeWidth={isFloorSelected ? 1.6 : 1}
                                className="group-hover:stroke-amber-300 transition-all"
                              />
                              <text x="54" y={yPos + 3.8} fill={rulerTextColor} fontWeight="bold" textAnchor="middle">
                                TẦNG {fl}
                              </text>
                            </g>
                          );
                        })}
                      </g>

                      {/* 1. KHUÔN VIÊN QUẢNG TRƯỜNG & HỒ NƯỚC NỀN */}
                      <g className="opacity-95">
                        <polygon points="60,860 440,945 820,860 440,775" fill="#070B12" stroke="#1E293B" strokeWidth="2" />
                        <polygon points="300,910 440,936 580,910 440,884" fill="#0369A1" fillOpacity="0.4" stroke="#38BDF8" strokeWidth="1.2" />
                      </g>

                      {/* 2. THÂN CHUNG CƯ CAO TẦNG ISOMETRIC ĐỒ SỘ */}
                      <g className="transition-all duration-300">
                        {/* Mặt Trái Tòa Nhà */}
                        <polygon points="220,750 440,790 440,95 220,55" fill="url(#skylineGlassL)" stroke={curTone.borderBuilding} strokeWidth="2" />
                        {/* Mặt Phải Tòa Nhà */}
                        <polygon points="440,790 660,750 660,55 440,95" fill="url(#skylineGlassR)" stroke={curTone.borderBuilding} strokeWidth="2" />
                        
                        {/* Nan lam kiến trúc đứng */}
                        <line x1="290" y1="68" x2="290" y2="763" stroke={curTone.mullionColor} strokeWidth="0.8" opacity="0.35" />
                        <line x1="365" y1="81" x2="365" y2="776" stroke={curTone.mullionColor} strokeWidth="0.8" opacity="0.35" />
                        <line x1="515" y1="81" x2="515" y2="776" stroke={curTone.mullionColor} strokeWidth="0.8" opacity="0.35" />
                        <line x1="590" y1="68" x2="590" y2="763" stroke={curTone.mullionColor} strokeWidth="0.8" opacity="0.35" />

                        {/* RENDER CÁC TẦNG CĂN HỘ (TẦNG 2 ĐẾN TẦNG MAX) */}
                        {floorStatsList.filter(item => item.floor >= 1).map(item => {
                          const fl = item.floor;
                          const isSelected = selectedFloor === fl;
                          const isHovered = hoveredFloor === fl;
                          const hasOccupied = item.occupied > 0;
                          const hasMaint = item.maintenance > 0;

                          const yBase = 790 - (fl - 1) * floorStep;
                          const h = fl === currentTotalFloors ? 18 : 14;

                          const isMatchedZone = selectedFloorRange === 'ALL'
                            ? true
                            : selectedFloorRange === 'HIGH'
                            ? fl >= 21
                            : selectedFloorRange === 'MID'
                            ? (fl >= 11 && fl <= 20)
                            : (fl <= 10);

                          let opacityVal = isMatchedZone ? 0.94 : 0.22;
                          if (isSelected || isHovered) opacityVal = 1;

                          const leftPts = `222,${(yBase - 40 - h).toFixed(1)} 438,${(yBase - h).toFixed(1)} 438,${yBase.toFixed(1)} 222,${(yBase - 40).toFixed(1)}`;
                          const rightPts = `442,${(yBase - h).toFixed(1)} 658,${(yBase - 40 - h).toFixed(1)} 658,${(yBase - 40).toFixed(1)} 442,${yBase.toFixed(1)}`;

                          let fillColorL = buildingTheme === 'NIGHT' ? '#0E1726' : '#0369A1';
                          let fillColorR = buildingTheme === 'NIGHT' ? '#131F33' : '#0284C7';
                          let strokeColor = buildingTheme === 'NIGHT' ? '#1E293B' : '#0E3A66';
                          let strokeWidth = 0.8;

                          if (isSelected) {
                            fillColorL = '#C5A880';
                            fillColorR = '#D8BC94';
                            strokeColor = '#FFFFFF';
                            strokeWidth = 2.4;
                          } else if (isHovered) {
                            fillColorL = '#2A3C53';
                            fillColorR = '#3B5270';
                            strokeColor = '#FDE68A';
                            strokeWidth = 1.8;
                          } else if (hasOccupied) {
                            fillColorL = '#064E3B';
                            fillColorR = '#065F46';
                            strokeColor = '#10B981';
                            strokeWidth = 1.2;
                          } else if (hasMaint) {
                            fillColorL = '#0C2A40';
                            fillColorR = '#0E3652';
                            strokeColor = '#38BDF8';
                            strokeWidth = 1.0;
                          }

                          return (
                            <g
                              key={`floor-layer-${fl}`}
                              onClick={() => {
                                handleSelectFloor(fl);
                              }}
                              onMouseEnter={() => setHoveredFloor(fl)}
                              onMouseLeave={() => setHoveredFloor(null)}
                              className="cursor-pointer group"
                              opacity={opacityVal}
                            >
                              {/* Mặt kính trái tầng */}
                              <polygon 
                                points={leftPts} 
                                fill={fillColorL} 
                                stroke={strokeColor} 
                                strokeWidth={strokeWidth}
                                className="transition-all duration-200" 
                              />
                              {/* Mặt kính phải tầng */}
                              <polygon 
                                points={rightPts} 
                                fill={fillColorR} 
                                stroke={strokeColor} 
                                strokeWidth={strokeWidth}
                                className="transition-all duration-200" 
                              />

                              {/* Vạch đèn LED ban công sàn nếu đã có cư dân ở */}
                              {hasOccupied && (
                                <>
                                  <line 
                                    x1="226" 
                                    y1={(yBase - 38).toFixed(1)} 
                                    x2="434" 
                                    y2={(yBase + 2).toFixed(1)} 
                                    stroke="#34D399" 
                                    strokeWidth="1.8" 
                                    strokeDasharray="8 4" 
                                    opacity="0.8" 
                                  />
                                  <line 
                                    x1="446" 
                                    y1={(yBase + 2).toFixed(1)} 
                                    x2="654" 
                                    y2={(yBase - 38).toFixed(1)} 
                                    stroke="#34D399" 
                                    strokeWidth="1.8" 
                                    strokeDasharray="8 4" 
                                    opacity="0.8" 
                                  />
                                </>
                              )}

                              {/* Hiệu ứng tầng đang chọn */}
                              {isSelected && (
                                <g className="pointer-events-none">
                                  <line 
                                    x1="222" 
                                    y1={(yBase - 40 - h).toFixed(1)} 
                                    x2="438" 
                                    y2={(yBase - h).toFixed(1)} 
                                    stroke="#FFFFFF" 
                                    strokeWidth="2.4" 
                                    strokeLinecap="round" 
                                  />
                                  <line 
                                    x1="442" 
                                    y1={(yBase - h).toFixed(1)} 
                                    x2="658" 
                                    y2={(yBase - 40 - h).toFixed(1)} 
                                    stroke="#FFFFFF" 
                                    strokeWidth="2.4" 
                                    strokeLinecap="round" 
                                  />
                                  <rect
                                    x="414"
                                    y={(yBase - h / 2 - 9).toFixed(1)}
                                    width="52"
                                    height="18"
                                    rx="3"
                                    fill="#C5A880"
                                    stroke="#FFFFFF"
                                    strokeWidth="1.6"
                                    filter="url(#unitGlow)"
                                  />
                                  <text
                                    x="440"
                                    y={(yBase - h / 2 + 4).toFixed(1)}
                                    fill="#0D1117"
                                    fontSize="10"
                                    fontWeight="900"
                                    textAnchor="middle"
                                    fontFamily="monospace"
                                  >
                                    TẦNG {fl}
                                  </text>
                                </g>
                              )}
                            </g>
                          );
                        })}

                        {/* 3. MÁI THƯỢNG, SÂN ĐÁP TRỰC THĂNG (HELIPAD) & ĐÈN ĐỈNH TÒA */}
                        <g id="skyline-crown-roof">
                          {/* Sàn Bê Tông Mái Thượng */}
                          <polygon points="220,55 440,95 660,55 440,15" fill={curTone.roofColor} stroke={curTone.crownColor} strokeWidth="2.5" />

                          {/* Sân đỗ trực thăng Helipad 3D */}
                          <ellipse cx="440" cy="57" rx="60" ry="11" fill="#0A0F18" stroke="#1E293B" strokeWidth="1.2" />
                          <ellipse cx="440" cy="55" rx="60" ry="11" fill="#111827" stroke="#C5A880" strokeWidth="1.8" />
                          <ellipse cx="440" cy="55" rx="44" ry="8" fill="none" stroke="#FDE68A" strokeWidth="1.6" strokeDasharray="6 3" />
                          <ellipse cx="440" cy="55" rx="28" ry="5" fill="none" stroke="#FFFFFF" strokeWidth="1.8" />
                          <text x="440" y="59" fill="#FFFFFF" fontSize="13" fontWeight="900" textAnchor="middle" fontFamily="monospace">H</text>

                          {/* Đèn tín hiệu hàng không ban đêm LED quanh Helipad */}
                          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
                            const rad = (deg * Math.PI) / 180;
                            const lx = 440 + 58 * Math.cos(rad);
                            const ly = 55 + 10.5 * Math.sin(rad);
                            const ledColor = deg % 90 === 0 ? '#EF4444' : '#10B981';
                            return (
                              <circle 
                                key={`helipad-led-${deg}`} 
                                cx={lx.toFixed(1)} 
                                cy={ly.toFixed(1)} 
                                r="1.8" 
                                fill={ledColor} 
                                className="animate-pulse" 
                              />
                            );
                          })}

                          {/* Cột ăng-ten & Đèn chớp đỏ */}
                          <line x1="440" y1="15" x2="440" y2="-5" stroke="#64748B" strokeWidth="1.8" />
                          <circle cx="440" cy="-5" r="3.5" fill="#EF4444" className="animate-pulse" filter="url(#unitGlow)" />

                          {/* Tiêu đề Đỉnh Chung Cư */}
                          <text 
                            x="440" 
                            y="-12" 
                            fill={curTone.titleColor} 
                            fontSize="11" 
                            fontWeight="bold" 
                            textAnchor="middle" 
                            fontFamily="serif" 
                            letterSpacing="0.06em"
                          >
                            {currentBlockName.toUpperCase()} ({currentTotalFloors} TẦNG) • CHUNG CƯ THE TROPICAL
                          </text>
                        </g>

                        {/* 4. ĐẠI SẢNH CHÀO ĐÓN & DỊCH VỤ BQL (TẦNG SẢNH / G) */}
                        <g 
                          id="grand-lobby-podium"
                          onClick={() => {
                            handleSelectFloor(0);
                          }}
                          onMouseEnter={() => setHoveredFloor(0)}
                          onMouseLeave={() => setHoveredFloor(null)}
                          className="cursor-pointer group"
                        >
                          {/* Mái vát khối sảnh Tầng 1 (kết nối chân tháp) */}
                          <polygon 
                            points="200,747 440,790 680,747 440,704" 
                            fill="url(#podiumMallGrad)" 
                            stroke={curTone.borderBuilding} 
                            strokeWidth="1.6" 
                          />

                          {/* Mặt kính sảnh trái */}
                          <polygon 
                            points="200,747 440,790 440,865 200,822" 
                            fill={selectedFloor === 0 ? '#C5A880' : 'url(#skylineGlassL)'} 
                            fillOpacity={selectedFloor === 0 ? 0.95 : 0.88}
                            stroke={selectedFloor === 0 ? '#FFFFFF' : curTone.borderBuilding} 
                            strokeWidth={selectedFloor === 0 ? 2.2 : 1.6} 
                          />

                          {/* Mặt kính sảnh phải */}
                          <polygon 
                            points="440,790 680,747 680,822 440,865" 
                            fill={selectedFloor === 0 ? '#D8BC94' : 'url(#skylineGlassR)'} 
                            fillOpacity={selectedFloor === 0 ? 0.95 : 0.88}
                            stroke={selectedFloor === 0 ? '#FFFFFF' : curTone.borderBuilding} 
                            strokeWidth={selectedFloor === 0 ? 2.2 : 1.6} 
                          />

                          {/* Ánh sáng vàng tiếp tân ấm cúng */}
                          <polygon 
                            points="220,760 440,798 440,858 220,822" 
                            fill="#F59E0B" 
                            fillOpacity={selectedFloor === 0 ? 0.35 : 0.18} 
                            stroke="#FDE68A" 
                            strokeWidth="0.8" 
                          />
                          <polygon 
                            points="440,798 660,760 660,822 440,858" 
                            fill="#F59E0B" 
                            fillOpacity={selectedFloor === 0 ? 0.35 : 0.18} 
                            stroke="#FDE68A" 
                            strokeWidth="0.8" 
                          />

                          {/* Mái đón sảnh chính (Canopy đón trả khách) */}
                          <polygon 
                            points="340,847 440,865 540,847 440,830" 
                            fill="#0F172A" 
                            stroke="#C5A880" 
                            strokeWidth="1.8" 
                          />
                          <line x1="350" y1="849" x2="350" y2="880" stroke="#C5A880" strokeWidth="2.2" />
                          <line x1="530" y1="849" x2="530" y2="880" stroke="#C5A880" strokeWidth="2.2" />

                          {/* Đèn rọi lối đón khách */}
                          <ellipse cx="440" cy="872" rx="36" ry="7" fill="#FDE68A" fillOpacity="0.28" filter="url(#unitGlow)" />

                          {/* Chữ biểu hiệu Đại Sảnh */}
                          <text 
                            x="440" 
                            y="845" 
                            fill={selectedFloor === 0 ? '#0D1117' : '#FFFFFF'} 
                            fontSize="9.5" 
                            fontFamily="sans-serif" 
                            textAnchor="middle" 
                            fontWeight="900" 
                            letterSpacing="0.06em"
                          >
                            🏛️ ĐẠI SẢNH CHÀO ĐÓN & DỊCH VỤ CƯ DÂN (TẦNG SẢNH / G)
                          </text>
                          <text 
                            x="440" 
                            y="860" 
                            fill={selectedFloor === 0 ? '#1E293B' : '#CBD5E1'} 
                            fontSize="8" 
                            fontFamily="monospace" 
                            textAnchor="middle"
                          >
                            Lễ Tân 24/7 • Ban Quản Lý • Sảnh Thang Máy • Hầm B1 - B2
                          </text>

                          {selectedFloor === 0 && (
                            <g className="pointer-events-none">
                              <rect
                                x="385"
                                y="868"
                                width="110"
                                height="18"
                                rx="3"
                                fill="#C5A880"
                                stroke="#FFFFFF"
                                strokeWidth="2"
                                filter="url(#unitGlow)"
                              />
                              <text
                                x="440"
                                y="881"
                                fill="#0D1117"
                                fontSize="9.5"
                                fontWeight="900"
                                textAnchor="middle"
                                fontFamily="monospace"
                              >
                                TẦNG SẢNH (G)
                              </text>
                            </g>
                          )}
                        </g>

                        {/* CON TRỎ LASER VÀ BẢNG CALLOUT HOLOGRAPHIC ĐỒNG BỘ */}
                        {(() => {
                          const isPodium = selectedFloor === 0;
                          const curFloor = Math.max(1, Math.min(currentTotalFloors, selectedFloor));
                          const curYBase = 790 - (curFloor - 1) * floorStep;
                          const curH = curFloor === currentTotalFloors ? 18 : 14;

                          // Tọa độ định vị laser khớp chuẩn xác 100% với trục tim dải tầng 3D
                          const pinX = isPodium ? 560 : 550;
                          const pinY = isPodium ? 806 : Number((curYBase - 20 - (curH / 2)).toFixed(1));

                          const wallX = isPodium ? 680 : 658;
                          const wallY = isPodium ? 785 : Number((curYBase - 40 - (curH / 2)).toFixed(1));

                          // Thẻ Callout Tầng - Tinh gọn, thanh thoát, định vị cao độ kiến trúc
                          const cardX = 672;
                          const cardW = 248;
                          const cardH = 90;
                          const targetCardY = Math.max(25, Math.min(780, Math.round(wallY - cardH / 2)));
                          const dockX = cardX;
                          const dockY = Math.max(targetCardY + 18, Math.min(targetCardY + cardH - 18, wallY));

                          // Đường dẫn laze chuẩn xác không bị gập ziczac hay ngược chiều
                          const isDirectHorizontal = Math.abs(dockY - wallY) < 2;
                          const midX = Math.round((wallX + dockX) / 2);
                          const laserPath = isDirectHorizontal
                            ? `M ${pinX} ${pinY} L ${wallX} ${wallY} L ${dockX} ${dockY}`
                            : `M ${pinX} ${pinY} L ${wallX} ${wallY} L ${midX} ${wallY} L ${midX} ${dockY} L ${dockX} ${dockY}`;

                          const curFloorStats = floorStatsList.find(f => f.floor === curFloor);
                          const occCount = curFloorStats?.occupied || floorOccupiedCount;
                          const hasOcc = occCount > 0;

                          // Thông tin đặc thù theo cao độ & kiến trúc tòa nhà (tránh trùng lặp với mặt bằng bên phải)
                          const floorZone = isPodium
                            ? 'SẢNH TRỆT / G'
                            : curFloor >= 21
                            ? 'PHÂN KHU TẦNG CAO'
                            : curFloor >= 11
                            ? 'PHÂN KHU TẦNG TRUNG'
                            : curFloor === 1
                            ? 'KHỐI ĐẾ THƯƠNG MẠI'
                            : 'PHÂN KHU TẦNG THẤP';

                          const elevationM = isPodium ? '0m' : `~${(curFloor * 3.2).toFixed(0)}m`;
                          const elevatorAccess = isPodium ? 'Trục thang máy sảnh' : '4 Thang khách + 1 Thang PCCC';
                          const viewOrientation = isPodium
                            ? 'Sảnh đón tiếp tân & Kiểm soát FaceID'
                            : curFloor >= 21
                            ? 'Tầm nhìn: View Sông & Panorama thoáng đãng'
                            : curFloor >= 11
                            ? 'Tầm nhìn: View Toàn cảnh nội khu & Hồ bơi'
                            : 'Tầm nhìn: View Mảng xanh & Tiện ích tầng thấp';

                          const themeNeon = '#C5A880';
                          const themeBg = '#0B121D';
                          const themeBorder = '#C5A880';

                          return (
                            <g key={`dynamic-floor-pointer-${selectedFloor}`} className="pointer-events-none">
                              {/* Vòng tâm định vị tầng chuẩn xác trên dải 3D */}
                              <circle cx={pinX} cy={pinY} r="4.5" fill={themeNeon} filter="url(#unitGlow)" />
                              <circle cx={pinX} cy={pinY} r="14" fill="none" stroke={themeNeon} strokeWidth="1.5" className="anim-ping-pulse" />
                              <circle cx={pinX} cy={pinY} r="2" fill="#FFFFFF" />

                              {/* Đường dẫn Laser chỉ tầng */}
                              <path
                                d={laserPath}
                                fill="none"
                                stroke={themeNeon}
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="anim-laser-line"
                                filter="url(#unitGlow)"
                              />
                              <circle cx={wallX} cy={wallY} r="3" fill={themeNeon} />
                              <circle cx={dockX} cy={dockY} r="3.5" fill={themeBorder} />

                              {/* Thẻ Callout Tầng Tinh Gọn - Tránh trùng lặp với mặt bằng bên phải */}
                              <g className="anim-callout-card">
                                <rect
                                  x={cardX}
                                  y={targetCardY}
                                  width={cardW}
                                  height={cardH}
                                  fill={themeBg}
                                  fillOpacity="0.96"
                                  stroke={themeBorder}
                                  strokeWidth="1.6"
                                  rx="4"
                                  filter="url(#unitGlow)"
                                />

                                {/* Dải viền vàng bên trái */}
                                <rect
                                  x={cardX}
                                  y={targetCardY}
                                  width="4"
                                  height={cardH}
                                  fill="#C5A880"
                                  rx="2"
                                />

                                {/* Dòng 1: Tiêu đề tầng & Phân khu kiến trúc */}
                                <circle cx={cardX + 16} cy={targetCardY + 20} r="3.5" fill={themeNeon} />
                                <text
                                  x={cardX + 25}
                                  y={targetCardY + 24}
                                  fill="#FFFFFF"
                                  fontSize="12.5"
                                  fontWeight="900"
                                  fontFamily="monospace"
                                >
                                  {isPodium ? 'TẦNG SẢNH (G)' : `TẦNG ${curFloor}`}
                                </text>

                                <text
                                  x={cardX + (isPodium ? 122 : 94)}
                                  y={targetCardY + 24}
                                  fill="#C5A880"
                                  fontSize="10"
                                  fontWeight="bold"
                                  fontFamily="monospace"
                                >
                                  • {floorZone}
                                </text>

                                {/* Huy hiệu tỷ lệ ở ngắn gọn góc phải */}
                                <rect
                                  x={cardX + cardW - 84}
                                  y={targetCardY + 11}
                                  width="74"
                                  height="18"
                                  fill="#162232"
                                  stroke="#26374D"
                                  rx="3"
                                />
                                <text
                                  x={cardX + cardW - 47}
                                  y={targetCardY + 23}
                                  fill={hasOcc ? '#34D399' : '#94A3B8'}
                                  fontSize="9.5"
                                  fontWeight="bold"
                                  textAnchor="middle"
                                  fontFamily="monospace"
                                >
                                  {isPodium ? 'SẢNH ĐÓN' : `Ở: ${occCount}/21 CĂN`}
                                </text>

                                {/* Dòng 2: Cao độ tĩnh không & Trục giao thông đứng */}
                                <text
                                  x={cardX + 16}
                                  y={targetCardY + 48}
                                  fill="#94A3B8"
                                  fontSize="10"
                                  fontFamily="monospace"
                                >
                                  Cao độ: <tspan fill="#F1F5F9" fontWeight="bold">{elevationM}</tspan>  •  {elevatorAccess}
                                </text>

                                {/* Dòng 3: Tầm nhìn kiến trúc & Hướng cảnh quan */}
                                <text
                                  x={cardX + 16}
                                  y={targetCardY + 70}
                                  fill="#CBD5E1"
                                  fontSize="10"
                                  fontFamily="sans-serif"
                                >
                                  {viewOrientation}
                                </text>
                              </g>
                            </g>
                          );
                        })()}
                      </g>

                      {/* THẺ HOVER */}
                      {hoveredFloor && hoveredFloor !== selectedFloor && (
                        <g className="pointer-events-none">
                          {(() => {
                            const hStats = floorStatsList.find(f => f.floor === hoveredFloor);
                            return (
                              <g>
                                <rect x="660" y="16" width="285" height="42" fill="#0D1117" fillOpacity="0.96" stroke={curTone.borderBuilding} strokeWidth="1.2" rx="3" />
                                <text x="674" y="33" fill={curTone.titleColor} fontSize="9.5" fontWeight="bold" fontFamily="monospace">
                                  {hoveredFloor === 1 ? 'XEM NHANH: TẦNG 1 (ĐẠI SẢNH ĐÓN)' : `XEM NHANH: TẦNG ${hoveredFloor} (21 CĂN HỘ)`}
                                </text>
                                <text x="674" y="47" fill="#94A3B8" fontSize="8" fontFamily="sans-serif">
                                  {hoveredFloor === 1 ? 'Khu vực lễ tân & kiểm soát an ninh' : (hStats?.occupied && hStats.occupied > 0 ? `${hStats.occupied} căn có người ở` : 'Tất cả căn trống')} • Nhấp để xem mặt bằng tầng
                                </text>
                              </g>
                            );
                          })()}
                        </g>
                      )}
                    </svg>
                  </div>
                </div>

                {/* THANH THÔNG BÁO TRẠNG THÁI HUD DƯỚI ĐÁY */}
                <div className="absolute bottom-2.5 left-3 right-3 z-10 flex items-center justify-between bg-[#080D16]/90 border border-[#1E2B3C] px-3 py-1.5 text-xs font-mono backdrop-blur-md shadow-lg pointer-events-auto">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">TÒA {selectedBlock}:</span>
                    <span className="text-[#C5A880] font-bold">{currentTotalFloors} TẦNG</span>
                    <span className="text-gray-500">|</span>
                    <span className="text-gray-300">Đang chọn: <strong className="text-white bg-[#142030] px-1.5 py-0.5 border border-[#23354C]">TẦNG {selectedFloor === 0 ? "SẢNH (G)" : selectedFloor}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                    <span className="w-2 h-2 rounded-full bg-[#C5A880] animate-pulse" />
                    <span className="text-gray-300 hidden sm:inline">Nhấp trực tiếp vào tầng để mở mặt bằng tương ứng bên phải</span>
                    <span className="text-gray-300 sm:hidden">Nhấp tầng để mở mặt bằng</span>
                  </div>
                </div>

              </div>
            );
          })()}

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
            <div className="h-[660px] sm:h-[760px] bg-[#070B12] overflow-y-auto no-scrollbar select-none flex flex-col">
              
              {/* SUB-VIEW 1: PHÂN KHU THE TROPICAL - BẢN ĐỒ MẶT BẰNG QUY HOẠCH THỰC TẾ & 23 TIỆN ÍCH */}
              {masterPlanTab === 'TROPICAL' && (
                <TropicalCampusSvgModel
                  amenities={THE_TROPICAL_AMENITIES}
                  selectedBlock={selectedBlock}
                  onSelectBlock={handleSwitchBlock}
                  onSelectBlockAndShowFloors={handleSelectBlockAndShowFloors}
                  selectedAmenityId={selectedAmenityId}
                  onSelectAmenity={setSelectedAmenityId}
                  hoveredAmenityId={hoveredAmenityId}
                  onHoverAmenity={setHoveredAmenityId}
                  onOpenZoomModal={() => setIsMasterPlanZoomed(true)}
                />
              )}

              {/* SUB-VIEW 2: TIỆN ÍCH XUNG QUANH CỦA DỰ ÁN & KHU DÂN CƯ */}
              {masterPlanTab === 'SURROUNDINGS' && (
                <div className="flex-1 flex flex-col space-y-2 p-2">
                  {/* MÔ HÌNH BẢN ĐỒ TIỆN ÍCH THÀNH PHỐ BIỂN HỒ */}
                  <SurroundingRadarSvgModel
                    amenities={SURROUNDING_AMENITIES}
                    selectedBlock={selectedBlock}
                    selectedAmenityId={selectedAmenityId}
                    onSelectAmenity={setSelectedAmenityId}
                    hoveredAmenityId={hoveredAmenityId}
                    onHoverAmenity={setHoveredAmenityId}
                    onOpenZoomModal={() => setIsMasterPlanZoomed(true)}
                  />

                  {/* Danh sách các tiện ích xung quanh của dự án & khu dân cư (HOVER XEM TIỆN ÍCH) */}
                  <div className="p-2.5 bg-[#111622] border border-[#222E3E] space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-[#C5A880]" />
                        <span>DANH SÁCH 8 ĐẠI TIỆN ÍCH XUNG QUANH KHU DÂN CƯ</span>
                      </div>
                      <span className="text-[10px] font-mono text-cyan-300">
                        Bán kính: 50m - 750m
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto no-scrollbar pr-1">
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

              {/* SUB-VIEW 3: QUY HOẠCH TỔNG THỂ ĐẠI ĐÔ THỊ VINHOMES GRAND PARK */}
              {masterPlanTab === 'MACRO' && (
                <div className="flex-1 flex flex-col space-y-2 p-2">
                  {/* BẢN ĐỒ QUY HOẠCH TỔNG THỂ ĐẠI ĐÔ THỊ 271HA THỰC TẾ */}
                  <MacroCitySvgModel
                    selectedBlock={selectedBlock}
                    selectedAmenityId={selectedAmenityId}
                    onSelectAmenity={setSelectedAmenityId}
                    onSelectTropical={() => setMasterPlanTab('TROPICAL')}
                    onOpenZoomModal={() => setIsMasterPlanZoomed(true)}
                  />

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

        {/* CỘT PHẢI (5 COLS): THÔNG TIN CHI TIẾT CĂN HỘ HOẶC QUY HOẠCH */}
        <div className={`${(buildingPerspective === 'BUILDING_3D_FLOOR' || buildingPerspective === '3D' || buildingPerspective === 'BUILDING_ELEVATION' || buildingPerspective === 'FLOOR_PLAN') ? 'lg:col-span-6' : 'lg:col-span-5'} bg-[#0D1117] border border-[#222B35] rounded-none p-4 shadow-2xl min-h-[660px] sm:min-h-[760px] flex flex-col justify-between overflow-hidden`}>
          {/* NẾU ĐANG Ở GÓC NHÌN QUY HOẠCH VÀ CHỌN TAB QUY HOẠCH: HIỂN THỊ CONSOLE QUY HOẠCH & TIỆN ÍCH */}
          {buildingPerspective === 'MASTER_PLAN' ? (() => {
            const activeAmenityId = selectedAmenityId || hoveredAmenityId;
            const tropicalAmenity = THE_TROPICAL_AMENITIES.find(a => a.id === activeAmenityId);
            const surroundingAmenity = SURROUNDING_AMENITIES.find(a => a.id === activeAmenityId);
            const activeAmenity = tropicalAmenity || surroundingAmenity;

            return (
              <div className="flex flex-col h-full justify-between select-none">
                <div className="space-y-3 overflow-y-auto pr-1 no-scrollbar flex-1">
                  
                  {/* TIÊU ĐỀ QUY HOẠCH TINH GỌN (ĐÃ LOẠI BỎ TAB HỒ SƠ CĂN) */}
                  <div className="flex items-center justify-between border-b border-[#222B35] pb-2 text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <Map className="w-3.5 h-3.5 text-[#C5A880]" />
                      <span className="text-white font-bold tracking-wide">
                        QUY HOẠCH PHÂN KHU THE TROPICAL
                      </span>
                      <span className="text-gray-500">•</span>
                      <span className="text-[#C5A880] font-bold">{selectedBlock}</span>
                    </div>

                    {activeAmenity && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAmenityId(null);
                          setHoveredAmenityId(null);
                        }}
                        className="px-2 py-0.5 bg-[#141E2D] hover:bg-[#1E2E42] text-[#C5A880] text-[10.5px] border border-[#23354C] flex items-center gap-1 transition-all"
                        title="Đóng chi tiết tiện ích, quay về chung cư"
                      >
                        <X className="w-3 h-3" />
                        <span>Về Tổng Quan</span>
                      </button>
                    )}
                  </div>

                  {/* ========================================================================= */}
                  {/* TRƯỜNG HỢP 1: CÓ TIỆN ÍCH ĐANG ĐƯỢC CHỌN HOẶC HOVER                       */}
                  {/* ========================================================================= */}
                  {activeAmenity ? (
                    <div className="space-y-3 animate-in fade-in duration-200">
                      
                      {/* Tiêu đề tiện ích */}
                      <div className="border-b border-[#222B35] pb-2.5 flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[#C5A880] font-mono font-semibold">
                            <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
                            <span>
                              {tropicalAmenity ? `TIỆN ÍCH NỘI KHU #${tropicalAmenity.displayNumber || tropicalAmenity.id}` : `ĐẠI TIỆN ÍCH ĐÔ THỊ ${surroundingAmenity?.id}`}
                            </span>
                          </div>
                          <h3 className="font-serif text-lg sm:text-xl font-bold text-white mt-0.5 leading-snug">
                            {activeAmenity.name}
                          </h3>
                        </div>

                        <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded-none border bg-emerald-950 text-emerald-300 border-emerald-500 shrink-0 ml-2">
                          VẬN HÀNH 5★
                        </span>
                      </div>

                      {/* 3 Thẻ chỉ số tiện ích thiết yếu */}
                      <div className="grid grid-cols-3 gap-1.5 p-2 bg-[#121820] border border-[#222B35] text-center font-mono">
                        <div className="p-1.5 bg-[#161B22]">
                          <div className="text-[9.5px] text-gray-400">Khoảng Cách</div>
                          <div className="text-xs font-bold text-cyan-400 mt-0.5 truncate">{activeAmenity.distance}</div>
                        </div>
                        <div className="p-1.5 bg-[#161B22]">
                          <div className="text-[9.5px] text-gray-400">Thời Gian Đến</div>
                          <div className="text-xs font-bold text-emerald-400 mt-0.5 truncate">{surroundingAmenity?.walkTime || '1 - 2 phút'}</div>
                        </div>
                        <div className="p-1.5 bg-[#161B22]">
                          <div className="text-[9.5px] text-gray-400">Khung Giờ Mở</div>
                          <div className="text-xs font-bold text-[#C5A880] mt-0.5 truncate">
                            {tropicalAmenity?.category === 'POOL' ? '06h - 21h30' : tropicalAmenity?.category === 'SPORT' ? '06h - 22h00' : surroundingAmenity?.category === 'SHOPPING' ? '09h30 - 22h' : '05h - 23h'}
                          </div>
                        </div>
                      </div>

                      {/* Mô tả chi tiết không gian */}
                      <div className="p-3 bg-[#111622] border border-[#222E3E] space-y-1.5">
                        <div className="text-xs font-mono font-bold text-[#C5A880] flex items-center gap-1.5">
                          <Compass className="w-3.5 h-3.5" />
                          <span>KHÔNG GIAN KIẾN TRÚC & CẢNH QUAN</span>
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed font-sans">
                          {activeAmenity.desc}
                        </p>
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAmenityId(null);
                            setHoveredAmenityId(null);
                          }}
                          className="w-full py-2 bg-[#141E2D] hover:bg-[#C5A880] text-[#C5A880] hover:text-black border border-[#23354C] text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                          <span>Quay Lại Tổng Quan Phân Khu</span>
                        </button>
                      </div>

                    </div>
                  ) : (
                    /* ========================================================================= */
                    /* TRƯỜNG HỢP 2: TỔNG QUAN QUY HOẠCH KHỐI CHUNG CƯ ĐANG CHỌN (BS-07..BS-10)   */
                    /* ========================================================================= */
                    <div className="space-y-3 animate-in fade-in duration-200">
                      
                      {/* Tiêu đề tòa nhà */}
                      <div className="border-b border-[#222B35] pb-2.5 flex items-start justify-between">
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-[#C5A880] font-mono font-semibold">
                            QUY HOẠCH PHÂN KHU THE TROPICAL
                          </div>
                          <h3 className="font-serif text-xl sm:text-2xl font-bold text-white mt-0.5">
                            {currentBlockConfig.name}
                          </h3>
                        </div>

                        <span className="px-2.5 py-1 text-[11px] font-bold uppercase rounded-none border bg-blue-950 text-blue-300 border-blue-500 shrink-0 ml-2 font-mono">
                          {currentTotalFloors} TẦNG
                        </span>
                      </div>

                      {/* 3 Thẻ thông số quy hoạch khối tòa gọn gàng */}
                      <div className="grid grid-cols-3 gap-1.5 p-2 bg-[#121820] border border-[#222B35] text-center font-mono">
                        <div className="p-1.5 bg-[#161B22]">
                          <div className="text-[9.5px] text-gray-400">Chiều Cao</div>
                          <div className="text-xs font-bold text-white mt-0.5">{currentTotalFloors} Tầng</div>
                        </div>
                        <div className="p-1.5 bg-[#161B22]">
                          <div className="text-[9.5px] text-gray-400">Tổng Căn Hộ</div>
                          <div className="text-xs font-bold text-cyan-400 mt-0.5">{selectedBlock === 'BS-08' ? '819' : '714'} căn</div>
                        </div>
                        <div className="p-1.5 bg-[#161B22]">
                          <div className="text-[9.5px] text-gray-400">Mật Độ Thiết Kế</div>
                          <div className="text-xs font-bold text-emerald-400 mt-0.5">21 căn/sàn</div>
                        </div>
                      </div>

                      {/* BỘ CHUYỂN 4 KHỐI CHUNG CƯ THE TROPICAL GỌN GÀNG */}
                      <div className="space-y-1.5">
                        <div className="text-xs font-mono font-bold text-gray-300 flex items-center justify-between">
                          <span>KHỐI CHUNG CƯ TRONG PHÂN KHU:</span>
                          <span className="text-[#C5A880] text-[11px]">Bấm chuyển khối</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                          {[
                            { code: 'BS-07', name: 'BS-07 (The Tropical)', floors: 34, loc: 'Trục Phố Cọ Rodeo' },
                            { code: 'BS-08', name: 'BS-08 (The Tropical)', floors: 39, loc: 'Vườn Cọ California' },
                            { code: 'BS-09', name: 'BS-09 (The Tropical)', floors: 34, loc: 'Trực Diện Hồ Bơi Resort' },
                            { code: 'BS-10', name: 'BS-10 (The Tropical)', floors: 34, loc: 'Sân Thể Thao Malibu' },
                          ].map(blk => {
                            const isCur = selectedBlock === blk.code;
                            return (
                              <div
                                key={blk.code}
                                onClick={() => handleSwitchBlock(blk.code as any)}
                                className={`p-2.5 border cursor-pointer transition-all ${
                                  isCur 
                                    ? 'bg-[#1C2838] border-[#C5A880] ring-1 ring-[#C5A880]' 
                                    : 'bg-[#111622] border-[#222E3E] hover:border-gray-500'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <strong className={isCur ? 'text-[#C5A880]' : 'text-white'}>{blk.name}</strong>
                                  <span className={`text-[10px] px-1.5 py-0.5 ${isCur ? 'bg-[#C5A880] text-black font-bold' : 'bg-[#182333] text-gray-400'}`}>
                                    {blk.floors}T
                                  </span>
                                </div>
                                <div className="text-[10.5px] text-gray-400 mt-1 truncate">{blk.loc}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Khối tóm tắt tiện ích trọng điểm nội khu */}
                      <div className="p-3 bg-[#111622] border border-[#222E3E] space-y-1.5">
                        <div className="text-xs font-mono font-bold text-[#C5A880] flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>TIỆN ÍCH ĐẶC QUYỀN NỘI KHU THE TROPICAL</span>
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed font-sans">
                          Phân khu The Tropical sở hữu 23 tiện ích phong cách nghỉ dưỡng nhiệt đới: Bể bơi resort 800m², phố cọ Rodeo, vườn California, sân tập yoga và sân thể thao Malibu.
                        </p>
                      </div>

                      {/* Thẻ chỉ dẫn thao tác nhanh */}
                      <div className="p-2.5 bg-[#0C111A] border border-[#1E293B] text-[11px] font-mono text-gray-400 flex items-center gap-2">
                        <span className="text-[#C5A880] text-sm">💡</span>
                        <span>Nhấp vào các điểm đánh dấu trên bản đồ bên trái để xem chi tiết tiện ích.</span>
                      </div>

                    </div>
                  )}

                </div>
              </div>
            );
          })() : (buildingPerspective === 'BUILDING_3D_FLOOR' || buildingPerspective === '3D' || buildingPerspective === 'BUILDING_ELEVATION' || buildingPerspective === 'FLOOR_PLAN') ? (
            /* ========================================================================= */
            /* PHÂN ĐỊNH RÕ RÀNG: TẦNG SẢNH (G) vs TẦNG CĂN HỘ (TẦNG 1 ĐẾN 34/39)         */
            /* ========================================================================= */
            selectedFloor === 0 ? (
              /* TRƯỜNG HỢP A: TẦNG SẢNH CHÀO ĐÓN (LOBBY / G) - TIỆN ÍCH DỊCH VỤ & BQL (KHÔNG CÓ CĂN HỘ) */
              <div className="flex flex-col h-full justify-between select-none">
                <div className="space-y-3 overflow-y-auto pr-1 no-scrollbar flex-1">
                  
                  {/* TIÊU ĐỀ TẦNG SẢNH */}
                  <div className="flex items-center justify-between border-b border-[#222B35] pb-2 text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                      <span className="text-white font-bold text-sm tracking-wide">
                        MẶT BẰNG ĐẠI SẢNH CHÀO ĐÓN (TẦNG G)
                      </span>
                      <span className="text-gray-500">•</span>
                      <span className="text-[#C5A880] font-bold">{selectedBlock}</span>
                      <span className="text-[10px] px-2 py-0.5 bg-blue-950 border border-blue-500 text-blue-300 font-bold uppercase hidden sm:inline">
                        TIỆN ÍCH & BQL (KHÔNG CÓ CĂN HỘ)
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleSelectFloor(1)}
                        className="px-2.5 py-1 bg-[#141E2D] hover:bg-[#C5A880] text-[#C5A880] hover:text-black text-xs border border-[#23354C] flex items-center gap-1.5 transition-all shadow"
                        title="Lên Tầng 1 xem mặt bằng căn hộ"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                        <span>Lên Tầng 1 (Căn Hộ) ➔</span>
                      </button>
                    </div>
                  </div>

                  {/* 4 THẺ THỐNG KÊ VẬN HÀNH TẦNG SẢNH */}
                  <div className="grid grid-cols-4 gap-1.5 p-2 bg-[#121820] border border-[#222B35] text-center font-mono">
                    <div className="p-1 bg-[#161B22]">
                      <div className="text-[9.5px] text-gray-400">Diện Tích Sảnh</div>
                      <div className="text-xs font-bold text-white mt-0.5">850 m²</div>
                    </div>
                    <div className="p-1 bg-[#161B22] border-b-2 border-emerald-500">
                      <div className="text-[9.5px] text-gray-400">Lễ Tân & BQL</div>
                      <div className="text-xs font-bold text-emerald-400 mt-0.5">Trực 24/7</div>
                    </div>
                    <div className="p-1 bg-[#161B22] border-b-2 border-sky-500">
                      <div className="text-[9.5px] text-gray-400">An Ninh Sảnh</div>
                      <div className="text-xs font-bold text-sky-400 mt-0.5">12 Camera AI</div>
                    </div>
                    <div className="p-1 bg-[#161B22] border-b-2 border-amber-500">
                      <div className="text-[9.5px] text-gray-400">Lõi Thang Máy</div>
                      <div className="text-xs font-bold text-amber-300 mt-0.5">6 Thang FaceID</div>
                    </div>
                  </div>

                  {/* SƠ ĐỒ MẶT BẰNG KIẾN TRÚC TẦNG SẢNH CAD SVG */}
                  <div className="border border-[#1E293B] bg-[#05080E] p-2 relative overflow-hidden">
                    <svg viewBox="0 0 800 420" className="w-full h-auto select-none font-mono">
                      <defs>
                        <pattern id="lobbyCadGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#131D2A" strokeWidth="0.6" />
                        </pattern>
                      </defs>
                      <rect width="800" height="420" fill="#070B12" />
                      <rect width="800" height="420" fill="url(#lobbyCadGrid)" opacity="0.6" />

                      {/* Tường bao chu vi đại sảnh */}
                      <rect x="30" y="30" width="740" height="360" fill="none" stroke="#334155" strokeWidth="3" />
                      <rect x="35" y="35" width="730" height="350" fill="#0B1320" fillOpacity="0.85" />

                      {/* 1. DROP-OFF & LỐI VÀO CHÍNH CÓ MÁI CHE */}
                      <rect x="280" y="360" width="240" height="30" fill="#162234" stroke="#C5A880" strokeWidth="1.5" strokeDasharray="4 2" />
                      <text x="400" y="380" fill="#E2E8F0" fontSize="10" fontWeight="bold" textAnchor="middle">▼ LỐI VÀO SẢNH ĐÓN CHÍNH (DROP-OFF CANOPY) ▼</text>

                      {/* Cửa xoay tự động */}
                      <circle cx="400" cy="355" r="14" fill="#1E293B" stroke="#C5A880" strokeWidth="1.5" />
                      <line x1="400" y1="341" x2="400" y2="369" stroke="#C5A880" strokeWidth="1.5" />
                      <line x1="386" y1="355" x2="414" y2="355" stroke="#C5A880" strokeWidth="1.5" />

                      {/* 2. QUẦY ĐẠI LỄ TÂN & CONCIERGE 24/7 */}
                      <g
                        onClick={() => setSelectedLobbyZone('RECEPTION')}
                        className="cursor-pointer group"
                      >
                        <rect 
                          x="300" 
                          y="245" 
                          width="200" 
                          height="65" 
                          rx="6"
                          fill={selectedLobbyZone === 'RECEPTION' ? '#2A2314' : '#141C26'} 
                          stroke={selectedLobbyZone === 'RECEPTION' ? '#C5A880' : '#2D3E54'} 
                          strokeWidth={selectedLobbyZone === 'RECEPTION' ? 2 : 1.2} 
                        />
                        <path d="M 330 268 Q 400 252 470 268" fill="none" stroke="#C5A880" strokeWidth="3" />
                        <text x="400" y="285" fill={selectedLobbyZone === 'RECEPTION' ? '#FDE68A' : '#FFFFFF'} fontSize="11" fontWeight="bold" textAnchor="middle">
                          QUẦY ĐẠI LỄ TÂN & CONCIERGE
                        </text>
                        <text x="400" y="300" fill="#94A3B8" fontSize="8.5" textAnchor="middle">
                          Trực Tiếp Đón Khách 24/7 • Bàn Tròn VIP
                        </text>
                      </g>

                      {/* 3. LÕI 6 THANG MÁY CƯ DÂN & CỔNG FACEID */}
                      <g
                        onClick={() => setSelectedLobbyZone('ELEVATOR_LOBBY')}
                        className="cursor-pointer group"
                      >
                        <rect 
                          x="260" 
                          y="50" 
                          width="280" 
                          height="150" 
                          rx="4"
                          fill={selectedLobbyZone === 'ELEVATOR_LOBBY' ? '#0E241E' : '#0F1A24'} 
                          stroke={selectedLobbyZone === 'ELEVATOR_LOBBY' ? '#34D399' : '#1E3A34'} 
                          strokeWidth={selectedLobbyZone === 'ELEVATOR_LOBBY' ? 2 : 1.2} 
                        />
                        <text x="400" y="75" fill="#34D399" fontSize="11" fontWeight="bold" textAnchor="middle">
                          LÕI 6 THANG MÁY CƯ DÂN (TỐC ĐỘ CAO 3.5m/s)
                        </text>

                        {[0, 1, 2].map(i => (
                          <rect key={`elev-l-${i}`} x={280 + i * 42} y="90" width="34" height="42" fill="#162232" stroke="#38BDF8" strokeWidth="1" />
                        ))}
                        {[0, 1, 2].map(i => (
                          <rect key={`elev-r-${i}`} x={425 + i * 42} y="90" width="34" height="42" fill="#162232" stroke="#38BDF8" strokeWidth="1" />
                        ))}
                        <text x="330" y="115" fill="#E2E8F0" fontSize="8.5" textAnchor="middle">THANG 1-3</text>
                        <text x="475" y="115" fill="#E2E8F0" fontSize="8.5" textAnchor="middle">THANG 4-6</text>

                        {/* Cổng Flap Barrier FaceID */}
                        <line x1="280" y1="165" x2="520" y2="165" stroke="#34D399" strokeWidth="2" strokeDasharray="6 3" />
                        <text x="400" y="185" fill="#6EE7B7" fontSize="9" textAnchor="middle">
                          [ CỔNG KIỂM SOÁT AN NINH FACEID AI & FLAP BARRIER ]
                        </text>
                      </g>

                      {/* 4. VĂN PHÒNG BAN QUẢN LÝ (BQL) */}
                      <g
                        onClick={() => setSelectedLobbyZone('BQL_OFFICE')}
                        className="cursor-pointer group"
                      >
                        <rect 
                          x="50" 
                          y="220" 
                          width="210" 
                          height="150" 
                          rx="4"
                          fill={selectedLobbyZone === 'BQL_OFFICE' ? '#0F2338' : '#0B1622'} 
                          stroke={selectedLobbyZone === 'BQL_OFFICE' ? '#38BDF8' : '#1D334C'} 
                          strokeWidth={selectedLobbyZone === 'BQL_OFFICE' ? 2 : 1.2} 
                        />
                        <text x="155" y="245" fill="#38BDF8" fontSize="11" fontWeight="bold" textAnchor="middle">
                          VĂN PHÒNG BAN QUẢN LÝ (BQL)
                        </text>
                        <text x="155" y="265" fill="#E2E8F0" fontSize="9" textAnchor="middle">
                          Phòng Tiếp Dân & Thủ Tục Cư Trú
                        </text>
                        <rect x="70" y="280" width="80" height="35" fill="#142436" stroke="#2563EB" strokeWidth="0.8" />
                        <text x="110" y="302" fill="#93C5FD" fontSize="8.5" textAnchor="middle">Bàn BQL</text>
                        <rect x="160" y="280" width="80" height="35" fill="#142436" stroke="#2563EB" strokeWidth="0.8" />
                        <text x="200" y="302" fill="#93C5FD" fontSize="8.5" textAnchor="middle">Bàn Kỹ Thuật</text>
                        <text x="155" y="350" fill="#94A3B8" fontSize="8.5" textAnchor="middle">
                          Giờ làm việc: 08h00 - 17h30 (T2-T7)
                        </text>
                      </g>

                      {/* 5. RESIDENT LOUNGE */}
                      <g
                        onClick={() => setSelectedLobbyZone('LOUNGE')}
                        className="cursor-pointer group"
                      >
                        <rect 
                          x="50" 
                          y="50" 
                          width="190" 
                          height="150" 
                          rx="4"
                          fill={selectedLobbyZone === 'LOUNGE' ? '#2A2012' : '#14141E'} 
                          stroke={selectedLobbyZone === 'LOUNGE' ? '#FBBF24' : '#2D2938'} 
                          strokeWidth={selectedLobbyZone === 'LOUNGE' ? 2 : 1.2} 
                        />
                        <text x="145" y="75" fill="#FBBF24" fontSize="11" fontWeight="bold" textAnchor="middle">
                          RESIDENT LOUNGE RESORT
                        </text>
                        <text x="145" y="95" fill="#E2E8F0" fontSize="9" textAnchor="middle">
                          Sảnh Tiếp Khách Cư Dân 5★
                        </text>
                        <rect x="80" y="115" width="130" height="50" rx="4" fill="#201C2B" stroke="#D97706" strokeWidth="0.8" />
                        <text x="145" y="145" fill="#FDE68A" fontSize="9" textAnchor="middle">Sofa Thư Giãn • Máy Pha Cà Phê</text>
                      </g>

                      {/* 6. HÒM THƯ CƯ DÂN & SMART LOCKER */}
                      <g
                        onClick={() => setSelectedLobbyZone('MAIL_LOCKER')}
                        className="cursor-pointer group"
                      >
                        <rect 
                          x="560" 
                          y="50" 
                          width="190" 
                          height="150" 
                          rx="4"
                          fill={selectedLobbyZone === 'MAIL_LOCKER' ? '#1C162A' : '#12101C'} 
                          stroke={selectedLobbyZone === 'MAIL_LOCKER' ? '#A78BFA' : '#2D2444'} 
                          strokeWidth={selectedLobbyZone === 'MAIL_LOCKER' ? 2 : 1.2} 
                        />
                        <text x="655" y="75" fill="#A78BFA" fontSize="11" fontWeight="bold" textAnchor="middle">
                          HÒM THƯ & SMART LOCKER
                        </text>
                        <text x="655" y="95" fill="#E2E8F0" fontSize="9" textAnchor="middle">
                          Giao Nhận Bưu Kiện Tự Động 24/7
                        </text>
                        <rect x="580" y="115" width="150" height="50" fill="#1C182E" stroke="#8B5CF6" strokeWidth="0.8" />
                        <text x="655" y="135" fill="#DDD6FE" fontSize="8.5" textAnchor="middle">Tủ Locker Thông Minh (Mở QR/OTP)</text>
                        <text x="655" y="152" fill="#94A3B8" fontSize="8" textAnchor="middle">Hòm Thư Từng Căn T1 - T34</text>
                      </g>

                      {/* 7. RAM DỐC HẦM XE B1 - B2 */}
                      <g
                        onClick={() => setSelectedLobbyZone('DROP_OFF')}
                        className="cursor-pointer group"
                      >
                        <rect 
                          x="560" 
                          y="220" 
                          width="190" 
                          height="150" 
                          rx="4"
                          fill={selectedLobbyZone === 'DROP_OFF' ? '#2A1420' : '#1A0E18'} 
                          stroke={selectedLobbyZone === 'DROP_OFF' ? '#F472B6' : '#3E1E34'} 
                          strokeWidth={selectedLobbyZone === 'DROP_OFF' ? 2 : 1.2} 
                        />
                        <text x="655" y="245" fill="#F472B6" fontSize="11" fontWeight="bold" textAnchor="middle">
                          RAM DỐC HẦM XE B1 - B2
                        </text>
                        <text x="655" y="265" fill="#E2E8F0" fontSize="9" textAnchor="middle">
                          Lối Xe Ô Tô & Xe Máy Xuống Hầm
                        </text>
                        <rect x="585" y="280" width="140" height="40" fill="#261022" stroke="#E11D48" strokeWidth="0.8" strokeDasharray="3 2" />
                        <text x="655" y="305" fill="#FDA4AF" fontSize="9" textAnchor="middle">▼ RAM DỐC B1 - B2 ▼</text>
                        <text x="655" y="350" fill="#94A3B8" fontSize="8.5" textAnchor="middle">
                          Kiểm soát Barrier tự động biển số
                        </text>
                      </g>
                    </svg>
                  </div>

                  {/* DANH SÁCH 6 KHU VỰC CHỨC NĂNG TẦNG SẢNH */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-mono text-gray-400">
                      <span>PHÂN KHU CHỨC NĂNG ĐẠI SẢNH (TẦNG G):</span>
                      <span className="text-[#C5A880] text-[10.5px]">Bấm vào khu vực để xem chi tiết</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 text-xs font-mono">
                      {[
                        { id: 'RECEPTION', name: 'Quầy Lễ Tân 24/7', tag: 'Tiếp đón', color: 'border-[#C5A880] text-[#C5A880]' },
                        { id: 'BQL_OFFICE', name: 'Văn Phòng BQL', tag: 'Hành chính', color: 'border-sky-400 text-sky-400' },
                        { id: 'ELEVATOR_LOBBY', name: 'Lõi 6 Thang Máy', tag: 'FaceID AI', color: 'border-emerald-400 text-emerald-400' },
                        { id: 'LOUNGE', name: 'Resident Lounge', tag: 'Tiếp khách 5★', color: 'border-amber-400 text-amber-400' },
                        { id: 'MAIL_LOCKER', name: 'Hòm Thư & Locker', tag: 'Smart Locker', color: 'border-purple-400 text-purple-400' },
                        { id: 'DROP_OFF', name: 'Ram Dốc Hầm B1-B2', tag: 'Lối xe', color: 'border-pink-400 text-pink-400' },
                      ].map(z => {
                        const isCur = selectedLobbyZone === z.id;
                        return (
                          <button
                            key={z.id}
                            type="button"
                            onClick={() => setSelectedLobbyZone(z.id)}
                            className={`p-2 border text-left transition-all ${
                              isCur 
                                ? 'bg-[#182333] border-[#C5A880] ring-1 ring-[#C5A880]' 
                                : 'bg-[#101622] border-[#1E293B] hover:border-gray-500'
                            }`}
                          >
                            <div className="font-bold text-white truncate text-[11px]">{z.name}</div>
                            <div className={`text-[10px] mt-0.5 font-bold ${z.color}`}>{z.tag}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* CHI TIẾT KHU VỰC TẦNG SẢNH ĐANG CHỌN */}
                  {(() => {
                    const curZoneInfo = LOBBY_ZONES_DETAIL[selectedLobbyZone] || LOBBY_ZONES_DETAIL['RECEPTION'];
                    return (
                      <div className="p-3 bg-[#111824] border border-[#23354C] space-y-2 font-mono">
                        <div className="flex items-center justify-between border-b border-[#1E2D42] pb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#C5A880]" />
                            <strong className="text-white text-xs">{curZoneInfo.title}</strong>
                          </div>
                          <span className="text-[10.5px] px-2 py-0.5 bg-[#182436] text-[#C5A880] border border-[#2B3E59]">
                            {curZoneInfo.status}
                          </span>
                        </div>

                        <p className="text-xs text-gray-300 font-sans leading-relaxed">
                          {curZoneInfo.desc}
                        </p>

                        <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                          <div className="p-1.5 bg-[#0C121C] border border-[#1A2636]">
                            <span className="text-gray-400">Nhân sự phụ trách:</span>
                            <div className="text-emerald-400 font-bold mt-0.5">{curZoneInfo.staff}</div>
                          </div>
                          <div className="p-1.5 bg-[#0C121C] border border-[#1A2636]">
                            <span className="text-gray-400">Hotline BQL nội bộ:</span>
                            <div className="text-cyan-400 font-bold mt-0.5">{curZoneInfo.hotline}</div>
                          </div>
                        </div>

                        {/* Thông báo phân định kiến trúc */}
                        <div className="p-2 bg-[#0A0F18] border border-[#182638] text-[10.5px] text-gray-400 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <span className="text-[#C5A880]">ℹ️</span>
                            <span>Tầng sảnh là khu vực dịch vụ công cộng, không có căn hộ ở.</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleSelectFloor(1)}
                            className="text-[#C5A880] hover:underline font-bold ml-2 shrink-0 flex items-center gap-1"
                          >
                            <span>Xem Tầng 1 (Căn Hộ)</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                </div>
              </div>
            ) : (
              /* TRƯỜNG HỢP B: CÁC TẦNG CĂN HỘ (TẦNG 1 ĐẾN TẦNG 34/39) - HIỂN THỊ 21 CĂN HỘ CAD */
              <div className="flex flex-col h-full justify-between select-none">
                <div className="space-y-3 overflow-y-auto pr-1 no-scrollbar flex-1">
                  
                  {/* THANH TIÊU ĐỀ MẶT BẰNG TẦNG CĂN HỘ */}
                  <div className="flex items-center justify-between border-b border-[#222B35] pb-2 text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#C5A880]" />
                      <span className="text-white font-bold text-sm tracking-wide">
                        MẶT BẰNG TẦNG {selectedFloor}
                      </span>
                      <span className="text-gray-500">•</span>
                      <span className="text-[#C5A880] font-bold">{selectedBlock}</span>
                      <span className="text-[10.5px] px-2 py-0.5 bg-[#162232] border border-[#23354C] text-[#C5A880] hidden sm:inline">
                        21 Căn Hộ CAD
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setIsFloorPlanExpanded(true)}
                        className="px-2.5 py-1 bg-[#141E2D] hover:bg-[#C5A880] text-[#C5A880] hover:text-black text-xs border border-[#23354C] flex items-center gap-1.5 transition-all shadow"
                        title="Mở rộng mặt bằng toàn màn hình"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Phóng To Mặt Bằng</span>
                      </button>
                    </div>
                  </div>

                {/* 4 THẺ THỐNG KÊ SÀN TẦNG HIỆN TẠI */}
                <div className="grid grid-cols-4 gap-1.5 p-2 bg-[#121820] border border-[#222B35] text-center font-mono">
                  <div className="p-1 bg-[#161B22]">
                    <div className="text-[9.5px] text-gray-400">Tổng Căn</div>
                    <div className="text-xs font-bold text-white mt-0.5">{floorUnits.length} căn</div>
                  </div>
                  <div className="p-1 bg-[#161B22] border-b-2 border-emerald-500">
                    <div className="text-[9.5px] text-gray-400">Đã Có Người Ở</div>
                    <div className="text-xs font-bold text-emerald-400 mt-0.5">
                      {floorOccupiedCount} ({floorUnits.length > 0 ? Math.round((floorOccupiedCount / floorUnits.length) * 100) : 0}%)
                    </div>
                  </div>
                  <div className="p-1 bg-[#161B22] border-b-2 border-sky-500">
                    <div className="text-[9.5px] text-gray-400">Nghiệm Thu</div>
                    <div className="text-xs font-bold text-sky-400 mt-0.5">{floorMaintenanceCount}</div>
                  </div>
                  <div className="p-1 bg-[#161B22] border-b-2 border-amber-500">
                    <div className="text-[9.5px] text-gray-400">Căn Trống</div>
                    <div className="text-xs font-bold text-amber-300 mt-0.5">{floorVacantCount}</div>
                  </div>
                </div>

                {/* BẢN VẼ MẶT BẰNG SÀN 21 CĂN HỘ CAD TƯƠNG TÁC */}
                <div className="border border-[#1E293B] bg-[#05080E] p-1 overflow-hidden">
                  <CadFloorplanSvgModel
                    selectedFloor={selectedFloor}
                    selectedBlock={selectedBlock}
                    activeUnitCode={activeUnit?.code || selectedAptCode}
                    onSelectUnit={(u) => handleSelectApartment(u)}
                    unitsOnFloor={floorUnits}
                    onOpenZoomModal={() => setIsFloorPlanExpanded(true)}
                  />
                </div>

                {/* DANH MỤC 21 CĂN HỘ DẠNG CHIPS NHANH */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-mono text-gray-400">
                    <span className="flex items-center gap-1.5">
                      <span>DANH MỤC CĂN HỘ TẦNG {selectedFloor}:</span>
                      {floorFilterStatus !== 'ALL' && (
                        <span className="text-amber-300 text-[10px]">
                          (Lọc: {floorFilterStatus === 'OCCUPIED' ? 'Có cư dân' : floorFilterStatus === 'VACANT' ? 'Còn trống' : 'Bảo trì'})
                        </span>
                      )}
                    </span>
                    <span className="text-[#C5A880] text-[10.5px]">Bấm chọn căn</span>
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {floorUnits.map(unit => {
                      const isSelected = activeUnit?.code === unit.code || selectedAptCode === unit.code;
                      const isOccupied = unit.status === 'OCCUPIED';
                      const isMaint = unit.status === 'MAINTENANCE';
                      const chShort = unit.code.includes('-') ? unit.code.split('-').pop() : unit.code;

                      const matchesStatus = floorFilterStatus === 'ALL' || unit.status === floorFilterStatus;
                      const matchesSearch = !unitSearchQuery.trim() || unit.code.toLowerCase().includes(unitSearchQuery.trim().toLowerCase());
                      const isMatched = matchesStatus && matchesSearch;

                      return (
                        <button
                          key={unit.code}
                          type="button"
                          onClick={() => handleSelectApartment(unit)}
                          className={`py-1 text-[10px] font-mono font-bold transition-all border text-center ${
                            isSelected
                              ? 'bg-[#C5A880] text-black border-white shadow-md ring-1 ring-[#C5A880]'
                              : !isMatched
                              ? 'opacity-25 bg-[#0C1118] text-gray-500 border-gray-800'
                              : isOccupied
                              ? 'bg-[#0B2319] text-emerald-400 border-emerald-800/60 hover:border-emerald-500'
                              : isMaint
                              ? 'bg-[#0D253A] text-sky-400 border-sky-800/60 hover:border-sky-500'
                              : 'bg-[#101722] text-amber-300 border-amber-900/50 hover:border-amber-600'
                          }`}
                          title={`Căn ${unit.code}: ${isOccupied ? 'Đã có người ở' : isMaint ? 'Bảo trì kỹ thuật' : 'Nhà trống'}`}
                        >
                          {chShort}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* THẺ TÓM TẮT & NÚT HÀNH ĐỘNG CỦA CĂN ĐANG CHỌN */}
                {activeUnit && (
                  <div className="p-2.5 bg-[#101622] border border-[#223348] mt-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-white">
                          CĂN {activeUnit.code}
                        </span>
                        <span className="text-[10.5px] font-mono text-gray-400">
                          (Tầng {activeUnit.floor})
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 uppercase border ${
                          activeUnit.status === 'OCCUPIED'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                            : activeUnit.status === 'MAINTENANCE'
                            ? 'bg-blue-950 text-blue-300 border-blue-500'
                            : 'bg-amber-950 text-amber-300 border-amber-500'
                        }`}>
                          {activeUnit.status === 'OCCUPIED' ? 'Đã Có Người Ở' : activeUnit.status === 'MAINTENANCE' ? 'Nghiệm Thu' : 'Nhà Trống'}
                        </span>
                      </div>

                      <div className="text-[11px] font-mono text-[#C5A880] font-bold">
                        {activeUnit.typeLabel || '2PN'} • {activeUnit.area || 65}m²
                      </div>
                    </div>

                    <div className="text-[11px] text-gray-300 flex items-center justify-between border-t border-[#1C283A] pt-1.5 font-mono">
                      <div>
                        <span className="text-gray-400">Chủ hộ: </span>
                        <strong className="text-white">
                          {activeUnit.status === 'OCCUPIED'
                            ? (activeUnit.owner?.name || (activeUnit.code === 'CH-06' || activeUnit.code === 'CH-01' ? 'Trần Hữu Lực' : 'Cư Dân Đã Nhận Nhà'))
                            : 'Chưa Bàn Giao (Nhà Trống)'}
                        </strong>
                        {activeUnit.status === 'OCCUPIED' && (activeUnit.owner?.phone || activeUnit.code === 'CH-06' || activeUnit.code === 'CH-01') && (
                          <span className="text-gray-400 ml-1 font-mono">
                            ({activeUnit.owner?.phone || '0364967082'})
                          </span>
                        )}
                      </div>
                      <div className="text-gray-400 text-[10.5px]">
                        Hướng: <span className="text-white font-bold">{activeUnit.direction || 'Đông Nam'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsAssignModalOpen(true)}
                        className="flex-1 py-1.5 bg-[#C5A880] hover:bg-[#d8bc94] text-black text-xs font-bold font-mono transition-all flex items-center justify-center gap-1.5 shadow"
                        title={activeUnit.status === 'OCCUPIED' ? 'Xem và cập nhật thông tin cư dân' : 'Bàn giao căn hộ và cấp quyền cho cư dân'}
                      >
                        {activeUnit.status === 'OCCUPIED' ? (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Thông Tin Cư Dân</span>
                          </>
                        ) : (
                          <>
                            <Key className="w-3.5 h-3.5" />
                            <span>Bàn Giao Căn Hộ</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsDetailModalOpen(true)}
                        className="px-2.5 py-1.5 bg-[#172335] hover:bg-[#20324A] text-[#C5A880] text-xs font-mono border border-[#2B3E59] transition-all flex items-center gap-1"
                        title="Xem toàn bộ hồ sơ chi tiết và 3D nội thất căn hộ này"
                      >
                        <Building className="w-3.5 h-3.5" />
                        <span>Xem Chi Tiết ➔</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditModalOpen(true)}
                        className="px-2.5 py-1.5 bg-[#172335] hover:bg-[#22354F] text-gray-200 text-xs font-mono border border-[#2B3E59] transition-all flex items-center gap-1"
                        title="Chỉnh sửa thông số căn hộ"
                      >
                        <span>Sửa</span>
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>
            )
          ) : activeUnit ? (
            <div className="flex flex-col h-full justify-between">
              <div className="space-y-3 overflow-y-auto pr-1 no-scrollbar flex-1">
                {/* TIÊU ĐỀ HỒ SƠ CĂN HỘ TRONG TAB LƯỚI */}
                <div className="flex items-center justify-between border-b border-[#222B35] pb-2 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <Building className="w-3.5 h-3.5 text-[#C5A880]" />
                    <span className="text-white font-bold tracking-wide">
                      HỒ SƠ CĂN HỘ {activeUnit.code}
                    </span>
                    <span className="text-gray-500">•</span>
                    <span className="text-[#C5A880] font-bold">{activeUnit.towerName}</span>
                  </div>
                  <span className="text-[10.5px] px-2 py-0.5 bg-[#162232] border border-[#23354C] text-[#C5A880]">
                    Tầng {activeUnit.floor}
                  </span>
                </div>

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
                        {activeUnit.handoverProtocol ? (
                          <div className="p-2.5 bg-[#121820] border border-[#222B35] text-[11px] font-mono space-y-1">
                            <div className="flex items-center justify-between text-gray-400">
                              <span>Biên bản bàn giao:</span>
                              <strong className="text-[#C5A880]">{activeUnit.handoverProtocol.protocolCode}</strong>
                            </div>
                            <div className="flex items-center justify-between text-gray-400">
                              <span>Chìa khóa & thẻ từ:</span>
                              <strong className="text-white">
                                {activeUnit.handoverProtocol.keysCount} chìa khóa • {activeUnit.handoverProtocol.cardsCount} thẻ thang máy
                              </strong>
                            </div>
                            <div className="flex items-center justify-between text-gray-400">
                              <span>Chỉ số khi nhận:</span>
                              <strong className="text-amber-400">
                                {activeUnit.handoverProtocol.initialElectricMeter} kWh • {activeUnit.handoverProtocol.initialWaterMeter} m³
                              </strong>
                            </div>
                          </div>
                        ) : (
                          <div className="p-2.5 bg-[#121820] border border-[#222B35] text-[11px] font-mono text-gray-400 flex items-center justify-between">
                            <span>Biên bản bàn giao kỹ thuật:</span>
                            <span className="text-gray-500 italic">Chưa lập biên bản</span>
                          </div>
                        )}

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
                            <span className="text-gray-400">• Phí gửi xe tầng hầm ({activeUnit.vehicles?.length || 0} xe):</span>
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
              u.code.toUpperCase().endsWith(`-${chCode}`) ||
              u.code.toUpperCase().endsWith(chCode) ||
              u.code.toUpperCase().endsWith(`-${cfg.num}`) ||
              u.code.toUpperCase().endsWith(cfg.num) ||
              (selectedFloor === 30 && u.code === chCode)
            )
          );

          if (found) {
            return found;
          }

          return ({
            code: targetCode,
            tower: selectedBlock === 'BS-10' ? 'B' : 'A',
            towerName: currentBlockName,
            floor: selectedFloor,
            type: cfg.type,
            typeLabel: cfg.typeLabel,
            status: 'VACANT',
            statusLabel: 'Căn Hộ Trống',
            area: cfg.area,
            bedrooms: cfg.beds,
            bathrooms: cfg.baths,
            direction: cfg.dir,
            priceBillion: cfg.defaultPrice,
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
                      onClick={() => handleSelectFloor(fl)}
                      className={`px-2 py-1 text-[11px] font-mono transition-all border ${
                        selectedFloor === fl
                          ? 'bg-[#C5A880] text-[#0D1117] font-bold border-[#C5A880] shadow'
                          : 'bg-[#161B22] text-gray-300 border-[#2D3748] hover:border-gray-500'
                      }`}
                    >
                      T{fl}
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
                      Bản Vẽ Thiết Kế
                    </button>
                  </div>

                  {floorPlanViewMode === 'CAD_VECTOR' && (
                    <div className="flex items-center gap-1">
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
                            const isSelected = selectedAptCode === unit?.code;
                            const isOccupied = unit?.status === 'OCCUPIED';
                            const isMaint = unit?.status === 'MAINTENANCE';
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
                                  fill={isSelected ? '#143126' : isOccupied ? '#0B2319' : isMaint ? '#0D253A' : '#101722'}
                                  stroke={isSelected ? '#F59E0B' : isOccupied ? '#10B981' : isMaint ? '#0284C7' : '#2D3E54'}
                                  strokeWidth={isSelected ? 2.5 : 1.2}
                                  rx="1"
                                />
                                <text x={pos.x + pos.w / 2} y={pos.y + 22} fill="#FFFFFF" fontSize="8.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                                  CH-{pos.num}
                                </text>
                                <text x={pos.x + pos.w / 2} y={pos.y + 33} fill={isOccupied ? '#6EE7B7' : '#94A3B8'} fontSize="7" textAnchor="middle">
                                  {pos.num === '01' ? '2PN • 68m²' : pos.num === '02' ? '1PN • 38m²' : pos.num === '03' ? '1PN+ • 46m²' : pos.num === '04' ? '2PN • 59m²' : '2PN • 69m²'}
                                </text>
                                <rect x={pos.x + 8} y={pos.y + 38} width={pos.w - 16} height="10" fill={isOccupied ? '#065F46' : isMaint ? '#075985' : '#78350F'} />
                                <text x={pos.x + pos.w / 2} y={pos.y + 46} fill="#FFFFFF" fontSize="6" fontWeight="bold" textAnchor="middle">
                                  {isOccupied ? 'ĐÃ CÓ CƯ DÂN' : isMaint ? 'NGHIỆM THU' : 'NHÀ TRỐNG'}
                                </text>
                              </g>
                            );
                          });
                        })()}

                        {/* CÁNH NAM: CH-06 ĐẾN CH-10 */}
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
                            const isSelected = selectedAptCode === unit?.code;
                            const isOccupied = unit?.status === 'OCCUPIED';
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
                                  fill={isSelected ? '#143126' : isOccupied ? '#0B2319' : isMaint ? '#0D253A' : '#101722'}
                                  stroke={isSelected ? '#F59E0B' : isOccupied ? '#10B981' : isMaint ? '#0284C7' : '#2D3E54'}
                                  strokeWidth={isSelected ? 2.2 : 1.2}
                                  rx="1"
                                />
                                <text x={pos.x + pos.w / 2} y={pos.y + 19} fill="#FFFFFF" fontSize="8.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                                  CH-{pos.num}
                                </text>
                                <text x={pos.x + pos.w / 2} y={pos.y + 30} fill={isOccupied ? '#6EE7B7' : '#94A3B8'} fontSize="7" textAnchor="middle">
                                  {pos.num === '06' ? '1PN • 42m² (View Hồ Bơi)' : pos.num === '07' ? '2PN • 59m²' : pos.num === '08' ? '1PN • 46m²' : pos.num === '09' ? '2PN Góc • 69m²' : 'Studio • 35m²'}
                                </text>
                                <rect x={pos.x + 8} y={pos.y + 36} width={pos.w - 16} height="10" fill={isOccupied ? '#065F46' : isMaint ? '#075985' : '#78350F'} />
                                <text x={pos.x + pos.w / 2} y={pos.y + 43.5} fill="#FFFFFF" fontSize="6.5" fontWeight="bold" textAnchor="middle">
                                  {isOccupied ? 'CÓ CƯ DÂN' : isMaint ? 'NGHIỆM THU' : 'NHÀ TRỐNG'}
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
                      <div className="w-full max-w-5xl">
                        <CadFloorplanSvgModel
                          selectedFloor={selectedFloor}
                          selectedBlock={selectedBlock}
                          activeUnitCode={activeUnit?.code}
                          onSelectUnit={(u) => handleSelectApartment(u)}
                          unitsOnFloor={displayUnits.filter(u => u.floor === selectedFloor)}
                        />
                      </div>
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
            title: 'Mô Hình Quy Hoạch Phân Khu The Tropical (The Beverly Solari)',
            desc: '4 Chung Cư BS-07, BS-08, BS-09, BS-10 & 23 Tiện Ích Kiến Trúc Nội Khu'
          },
          MACRO: {
            title: 'Mô Hình Quy Hoạch Đại Đô Thị 271 ha',
            desc: 'Vị Trí Phân Khu The Beverly Solari, Vincom Mega Mall, Công Viên 36ha & Vành Đai 3'
          },
          SURROUNDINGS: {
            title: 'Bản Đồ Tiện Ích Thành Phố Biển Hồ & Xung Quanh',
            desc: 'Mạng Lưới 8 Đại Tiện Ích Giáo Dục, Y Tế, Mua Sắm & Giao Thông'
          }
        }[masterPlanTab] || {
          title: 'Mô Hình Quy Hoạch',
          desc: ''
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
                {(['TROPICAL', 'SURROUNDINGS', 'MACRO'] as const).map((tab) => (
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
                    {tab === 'TROPICAL' ? 'The Tropical (Nội Khu)' : tab === 'SURROUNDINGS' ? 'Tiện Ích Xung Quanh' : 'Đại Đô Thị'}
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

            {/* Vùng hiển thị bản đồ quy hoạch thực tế toàn màn hình */}
            <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-[#05070A]">
              <div 
                className="w-full max-w-6xl transition-transform duration-200 ease-out"
                style={{
                  transform: `scale(${modalZoomScale})`,
                  transformOrigin: 'center center'
                }}
              >
                {masterPlanTab === 'TROPICAL' && (
                  <TropicalCampusSvgModel
                    amenities={THE_TROPICAL_AMENITIES}
                    selectedBlock={selectedBlock}
                    onSelectBlock={handleSwitchBlock}
                    onSelectBlockAndShowFloors={(b) => {
                      setIsMasterPlanZoomed(false);
                      handleSelectBlockAndShowFloors(b);
                    }}
                    selectedAmenityId={selectedAmenityId}
                    onSelectAmenity={setSelectedAmenityId}
                    hoveredAmenityId={hoveredAmenityId}
                    onHoverAmenity={setHoveredAmenityId}
                  />
                )}
                {masterPlanTab === 'SURROUNDINGS' && (
                  <SurroundingRadarSvgModel
                    amenities={SURROUNDING_AMENITIES}
                    selectedBlock={selectedBlock}
                    selectedAmenityId={selectedAmenityId}
                    onSelectAmenity={setSelectedAmenityId}
                    hoveredAmenityId={hoveredAmenityId}
                    onHoverAmenity={setHoveredAmenityId}
                  />
                )}
                {masterPlanTab === 'MACRO' && (
                  <MacroCitySvgModel
                    selectedBlock={selectedBlock}
                    selectedAmenityId={selectedAmenityId}
                    onSelectAmenity={setSelectedAmenityId}
                    onSelectTropical={() => {
                      setMasterPlanTab('TROPICAL');
                    }}
                  />
                )}
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
