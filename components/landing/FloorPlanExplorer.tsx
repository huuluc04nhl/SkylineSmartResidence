'use client';

import React, { useState, useMemo } from 'react';
import { 
  Box, 
  Layers, 
  SplitSquareVertical, 
  Eye, 
  Plus, 
  Minus, 
  RotateCw, 
  PhoneCall, 
  Sparkles, 
  Check, 
  X, 
  CheckCircle2, 
  Compass, 
  Wind, 
  Sun, 
  ShieldCheck, 
  Maximize2
} from 'lucide-react';

interface FloorPlanExplorerProps {
  onOpenLogin?: () => void;
}

export type ApartmentCategory = '1PN' | '2PN' | '3PN' | 'DUPLEX';
export type ViewerMode = 'ASSEMBLED_3D' | 'EXPLODED_3D' | 'REAL_PHOTO';

export interface Room3DBlock {
  id: string;
  name: string;
  code: string;
  area: number; // m2
  dim: string;  // e.g. "4.8m x 4.6m"
  x: number;
  y: number;
  w: number;
  d: number;
  h: number;
  z?: number;   // Tầng 2 nếu là duplex (z > 0)
  color: string;
  desc: string;
}

export interface ApartmentData {
  category: ApartmentCategory;
  code: string;
  name: string;
  subtitle: string;
  floorText: string;
  area: number;
  wallArea: number;
  bedrooms: number;
  bathrooms: number;
  direction: string;
  viewDesc: string;
  priceBillion: number;
  statusLabel: string;
  isRealResident?: boolean;
  residentName?: string;
  photoUrl: string;
  features: string[];
  rooms: Room3DBlock[];
}

const APARTMENT_MODELS: Record<ApartmentCategory, ApartmentData> = {
  '1PN': {
    category: '1PN',
    code: '12A02',
    name: 'Căn Hộ 1PN Thông Minh',
    subtitle: 'Tối ưu hóa không gian cho chuyên gia trẻ & người độc thân',
    floorText: 'Tầng 12A • Tháp A (Chung Cư Skyline)',
    area: 52.0,
    wallArea: 56.5,
    bedrooms: 1,
    bathrooms: 1,
    direction: 'Chính Nam',
    viewDesc: 'View công viên nội khu & hồ cảnh quan',
    priceBillion: 3.35,
    statusLabel: 'Sẵn Sàng Bàn Giao',
    photoUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&auto=format&fit=crop&q=80',
    features: [
      'Bố cục vuông vức không góc chết, 4 khối không gian kết nối liên hoàn',
      'Phòng khách và phòng ngủ đều có cửa sổ lớn đón ánh sáng tự nhiên',
      'Bàn giao hoàn thiện tủ bếp, bếp điện từ âm và hút mùi Hafele cao cấp'
    ],
    rooms: [
      {
        id: 'living',
        name: 'Phòng Khách & Ban Công',
        code: 'PK',
        area: 22.7,
        dim: '5.2m x 4.4m',
        x: 0,
        y: 0,
        w: 110,
        d: 90,
        h: 42,
        color: '#C5A880',
        desc: 'Không gian sinh hoạt chính, ban công kính Low-E đón ánh sáng ban mai.'
      },
      {
        id: 'kitchen',
        name: 'Bếp Đảo & Sảnh Vào',
        code: 'BẾP',
        area: 9.6,
        dim: '3.2m x 3.0m',
        x: 0,
        y: 95,
        w: 110,
        d: 65,
        h: 42,
        color: '#F59E0B',
        desc: 'Bếp mở hiện đại có máy hút mùi âm trần và logia giặt phơi riêng.'
      },
      {
        id: 'masterBed',
        name: 'Phòng Ngủ Master',
        code: 'PN',
        area: 15.2,
        dim: '3.8m x 4.0m',
        x: 115,
        y: 0,
        w: 95,
        d: 90,
        h: 42,
        color: '#818CF8',
        desc: 'Phòng ngủ rộng rãi sàn gỗ tự nhiên, view thoáng mát không bị chắn.'
      },
      {
        id: 'bath',
        name: 'Phòng Tắm & WC',
        code: 'WC',
        area: 4.5,
        dim: '2.3m x 2.0m',
        x: 115,
        y: 95,
        w: 95,
        d: 65,
        h: 42,
        color: '#06B6D4',
        desc: 'Buồng tắm kính đứng, lavabo và vòi sen Kohler sang trọng.'
      }
    ]
  },
  '2PN': {
    category: '2PN',
    code: '12A05',
    name: 'Căn Hộ 2PN Tiêu Chuẩn',
    subtitle: 'Căn mẫu thực tế cư dân • Bố cục 7 khối phòng vuông vức view sông',
    floorText: 'Tầng 12A • Tháp A (Chung Cư Skyline)',
    area: 78.5,
    wallArea: 83.2,
    bedrooms: 2,
    bathrooms: 2,
    direction: 'Đông Nam',
    viewDesc: 'Trực diện Sông Sài Gòn & Hồ bơi vô cực nội khu',
    priceBillion: 4.85,
    statusLabel: 'Đã Bàn Giao Cư Dân',
    isRealResident: true,
    residentName: 'Nguyễn Hữu Lực (Chủ hộ)',
    photoUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80',
    features: [
      'Căn góc 2 mặt thoáng, 7 khối không gian được bố trí tách biệt tĩnh - động',
      'Phòng ngủ Master khép kín có WC riêng biệt và phòng thay đồ walk-in',
      'Khóa cửa sinh trắc học FaceID tích hợp toàn diện hệ thống an ninh tòa nhà'
    ],
    rooms: [
      {
        id: 'living',
        name: 'Phòng Khách & Sinh Hoạt Chung',
        code: 'PK',
        area: 22.0,
        dim: '4.8m x 4.6m',
        x: 0,
        y: 0,
        w: 115,
        d: 85,
        h: 44,
        color: '#C5A880',
        desc: 'Không gian trung tâm thông thoáng, kết nối trực tiếp ban công view sông.'
      },
      {
        id: 'balcony',
        name: 'Ban Công Panorama Kính Low-E',
        code: 'BC',
        area: 5.5,
        dim: '4.2m x 1.3m',
        x: -35,
        y: 0,
        w: 30,
        d: 85,
        h: 22,
        color: '#10B981',
        desc: 'Ban công kính tràn viền đón trọn bình minh và gió mát Đông Nam.'
      },
      {
        id: 'kitchen',
        name: 'Bếp Đảo & Khu Ẩm Thực',
        code: 'BẾP',
        area: 12.0,
        dim: '3.8m x 3.2m',
        x: 0,
        y: 90,
        w: 115,
        d: 65,
        h: 44,
        color: '#F59E0B',
        desc: 'Đảo bếp Hafele, quầy bar ăn sáng và logia giặt phơi riêng biệt.'
      },
      {
        id: 'masterBed',
        name: 'Phòng Ngủ Master Ensuite',
        code: 'PN 1',
        area: 21.0,
        dim: '4.6m x 4.5m',
        x: 120,
        y: 0,
        w: 95,
        d: 85,
        h: 44,
        color: '#6366F1',
        desc: 'Phòng ngủ lớn tiện nghi khép kín, tầm nhìn trực diện ra bờ sông.'
      },
      {
        id: 'masterBath',
        name: 'WC Khép Kín Master',
        code: 'WC 1',
        area: 4.2,
        dim: '2.2m x 1.9m',
        x: 220,
        y: 0,
        w: 55,
        d: 50,
        h: 44,
        color: '#3B82F6',
        desc: 'Trang bị vách kính tắm đứng và sen vòi âm tường thương hiệu Đức.'
      },
      {
        id: 'secondBed',
        name: 'Phòng Ngủ Số 2',
        code: 'PN 2',
        area: 11.5,
        dim: '3.5m x 3.3m',
        x: 120,
        y: 90,
        w: 95,
        d: 65,
        h: 44,
        color: '#38BDF8',
        desc: 'Phòng ngủ cho con hoặc phòng làm việc, cửa sổ kính cách âm 3 lớp.'
      },
      {
        id: 'commonBath',
        name: 'WC Chung & Logia Giặt',
        code: 'WC 2',
        area: 6.5,
        dim: '2.5m x 2.6m',
        x: 220,
        y: 90,
        w: 55,
        d: 65,
        h: 44,
        color: '#64748B',
        desc: 'Phòng tắm cho khách và khu vực giặt phơi quần áo tách biệt.'
      }
    ]
  },
  '3PN': {
    category: '3PN',
    code: '24A01',
    name: 'Căn Hộ 3PN Sky Suite',
    subtitle: 'Phân khu áp mái cao cấp • Căn góc 2 mặt thoáng 9 khối phòng view triệu đô',
    floorText: 'Tầng 24 (Áp Mái) • Tháp A (Chung Cư Skyline)',
    area: 112.0,
    wallArea: 119.5,
    bedrooms: 3,
    bathrooms: 3,
    direction: 'Đông Nam & Tây Nam',
    viewDesc: 'View sông Sài Gòn & Cầu Phú Mỹ lung linh ban đêm',
    priceBillion: 8.50,
    statusLabel: 'Sẵn Sàng Bàn Giao',
    photoUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&auto=format&fit=crop&q=80',
    features: [
      'Căn góc VIP tầng áp mái, 9 khối không gian mở rộng rãi cho gia đình 3 thế hệ',
      'Đại sảnh phòng khách nối liền ban công góc rộng 32m²',
      'Master Suite tích hợp bồn tắm nằm Kohler và phòng thay đồ rộng rãi'
    ],
    rooms: [
      {
        id: 'grandLiving',
        name: 'Đại Sảnh & Living Room',
        code: 'PK',
        area: 32.0,
        dim: '6.2m x 5.2m',
        x: 0,
        y: 0,
        w: 130,
        d: 95,
        h: 46,
        color: '#C5A880',
        desc: 'Phòng khách thênh thang với vách kính panorama kịch trần.'
      },
      {
        id: 'cornerBalcony',
        name: 'Ban Công Góc Kép Panorama',
        code: 'BC',
        area: 7.2,
        dim: '5.5m x 1.3m',
        x: -40,
        y: 0,
        w: 35,
        d: 95,
        h: 22,
        color: '#10B981',
        desc: 'Tầm nhìn 2 mặt sông nước thoáng mát, không gian thưởng trà thư giãn.'
      },
      {
        id: 'islandKitchen',
        name: 'Khu Bếp Đảo Bar & Bàn Ăn',
        code: 'BẾP',
        area: 14.0,
        dim: '4.0m x 3.5m',
        x: 0,
        y: 100,
        w: 130,
        d: 70,
        h: 46,
        color: '#F59E0B',
        desc: 'Đảo bếp mặt đá Marble Carrara, bàn ăn phục vụ 8 - 10 người.'
      },
      {
        id: 'masterSuite',
        name: 'Master Presidential Suite',
        code: 'PN 1',
        area: 26.0,
        dim: '5.2m x 5.0m',
        x: 135,
        y: 0,
        w: 105,
        d: 95,
        h: 46,
        color: '#8B5CF6',
        desc: 'Phòng ngủ tổng thống rộng 26m² có góc làm việc và ngắm hoàng hôn.'
      },
      {
        id: 'luxuryBath',
        name: 'WC Master & Bồn Tắm Nằm',
        code: 'WC 1',
        area: 7.0,
        dim: '3.0m x 2.3m',
        x: 245,
        y: 0,
        w: 60,
        d: 55,
        h: 46,
        color: '#2563EB',
        desc: 'Bồn tắm nằm view kính, sen vòi mạ vàng chải satin cao cấp.'
      },
      {
        id: 'bed2',
        name: 'Phòng Ngủ Số 2 Ensuite',
        code: 'PN 2',
        area: 14.5,
        dim: '4.1m x 3.5m',
        x: 135,
        y: 100,
        w: 105,
        d: 70,
        h: 46,
        color: '#38BDF8',
        desc: 'Phòng ngủ riêng tư cho ông bà hoặc con lớn, có WC riêng bên trong.'
      },
      {
        id: 'bed3',
        name: 'Phòng Ngủ Số 3 / Studio',
        code: 'PN 3',
        area: 11.5,
        dim: '3.6m x 3.2m',
        x: 0,
        y: 175,
        w: 85,
        d: 70,
        h: 46,
        color: '#A78BFA',
        desc: 'Không gian linh hoạt làm phòng ngủ con nhỏ hoặc phòng đọc sách.'
      },
      {
        id: 'bath2',
        name: 'WC Chung & Khu Giặt Khép Kín',
        code: 'WC 2',
        area: 5.8,
        dim: '2.5m x 2.3m',
        x: 90,
        y: 175,
        w: 75,
        d: 70,
        h: 46,
        color: '#64748B',
        desc: 'Phòng vệ sinh chung cho khách và khu máy giặt sấy hiện đại.'
      }
    ]
  },
  'DUPLEX': {
    category: 'DUPLEX',
    code: '25PH-01',
    name: 'Duplex Penthouse Hoàng Gia',
    subtitle: 'Tuyệt tác thông tầng đỉnh tháp Tầng 25 • Trần 6.5m & Hồ Jacuzzi',
    floorText: 'Tầng 25 (Đỉnh Tháp) • Tháp A (Chung Cư Skyline)',
    area: 215.0,
    wallArea: 232.0,
    bedrooms: 4,
    bathrooms: 4,
    direction: 'Đông Nam & Tây Nam (270°)',
    viewDesc: 'Tầm nhìn không giới hạn ôm trọn Sông Sài Gòn & Landmark 81',
    priceBillion: 18.50,
    statusLabel: 'Tuyệt Phẩm Độc Bản',
    photoUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&auto=format&fit=crop&q=80',
    features: [
      'Thiết kế 2 tầng thông suốt với trần phòng khách Double-Height cao 6.5m',
      'Sky Terrace sân thượng 26m² trang bị bồn sục Jacuzzi ngoài trời ngắm sao',
      'Đặc quyền thang máy riêng và hồ bơi vô cực chân mây ngay ngưỡng cửa'
    ],
    rooms: [
      // TẦNG 1: KHỐI SÀN DƯỚI (Z = 0)
      {
        id: 'doubleLiving',
        name: 'Grand Living Thông Tầng (Cao 6.5m)',
        code: 'TRẦN 6.5M',
        area: 58.0,
        dim: '8.5m x 6.8m',
        x: 0,
        y: 0,
        w: 140,
        d: 105,
        h: 88, // Khối hộp cao gấp đôi thông suốt 2 tầng
        z: 0,
        color: '#EAB308',
        desc: 'Phòng khách đại tiệc trần cao 6.5m, đèn chùm pha lê và vách kính thông tầng.'
      },
      {
        id: 'skyTerrace',
        name: 'Sky Terrace & Bể Sục Jacuzzi',
        code: 'JACUZZI',
        area: 26.0,
        dim: '7.5m x 3.5m',
        x: -55,
        y: 0,
        w: 50,
        d: 105,
        h: 22,
        z: 0,
        color: '#06B6D4',
        desc: 'Sân thượng ngắm trọn thành phố từ độ cao 100m, bồn sục Jacuzzi nước ấm.'
      },
      {
        id: 'showKitchen',
        name: 'Show Kitchen & Bàn Tiệc 12 Chỗ',
        code: 'BẾP ĐẢO',
        area: 23.0,
        dim: '5.5m x 4.2m',
        x: 0,
        y: 110,
        w: 140,
        d: 75,
        h: 42,
        z: 0,
        color: '#EA580C',
        desc: 'Khu bếp biểu diễn trang thiết bị Miele cao cấp và hầm rượu vang âm tường.'
      },
      {
        id: 'guestBed',
        name: 'Phòng Ngủ Khách Tầng 1 Ensuite',
        code: 'PN KHÁCH',
        area: 18.0,
        dim: '4.5m x 4.0m',
        x: 145,
        y: 110,
        w: 95,
        d: 75,
        h: 42,
        z: 0,
        color: '#3B82F6',
        desc: 'Phòng ngủ tầng trệt dành cho khách quý, WC khép kín tiện lợi.'
      },
      // TẦNG 2: KHỐI SÀN TRÊN (Z = 55 - XẾP CHỒNG LÊN TRÊN!)
      {
        id: 'presidentialSuite',
        name: 'Presidential Suite (Tầng 2)',
        code: 'VIP TẦNG 2',
        area: 45.0,
        dim: '7.2m x 6.2m',
        x: 145,
        y: 0,
        w: 115,
        d: 105,
        h: 42,
        z: 55, // Nằm ở độ cao tầng 2!
        color: '#F43F5E',
        desc: 'Phòng ngủ hoàng gia tầng trên với ban công lửng nhìn ra sông Sài Gòn.'
      },
      {
        id: 'vipBed2',
        name: 'Phòng Ngủ VIP Tầng 2',
        code: 'PN 3',
        area: 16.0,
        dim: '4.2m x 3.8m',
        x: 0,
        y: 110,
        w: 80,
        d: 75,
        h: 42,
        z: 55,
        color: '#6366F1',
        desc: 'Phòng ngủ cho con trên tầng 2, trần cao thoáng đãng và cách âm tuyệt đối.'
      },
      {
        id: 'skyLibrary',
        name: 'Thư Viện & Lounge Tầng Lửng',
        code: 'GÁC LỬNG',
        area: 15.0,
        dim: '4.0m x 3.8m',
        x: 85,
        y: 110,
        w: 55,
        d: 75,
        h: 42,
        z: 55,
        color: '#D97706',
        desc: 'Không gian thư viện gác lửng nhìn xuống phòng khách thông tầng ngoạn mục.'
      }
    ]
  }
};

/**
 * Biến đổi tọa độ không gian 3D (X, Y, Z) sang tọa độ màn hình Isometric 2D
 */
function toIso(
  x: number,
  y: number,
  z: number,
  originX: number,
  originY: number,
  scale: number
): { sx: number; sy: number } {
  // Chuẩn phép chiếu Isometric (Cos 30° = 0.866, Sin 30° = 0.5)
  const isoX = (x - y) * 0.866;
  const isoY = (x + y) * 0.5 - z;
  return {
    sx: originX + isoX * scale,
    sy: originY + isoY * scale
  };
}

/**
 * Làm tối màu hex để tạo bóng đổ mặt bên
 */
function shadeColor(hex: string, percent: number): string {
  let color = hex.replace('#', '');
  if (color.length === 3) {
    color = color.split('').map(c => c + c).join('');
  }
  const num = parseInt(color, 16);
  let r = (num >> 16) + Math.round(255 * (percent / 100));
  let g = ((num >> 8) & 0x00ff) + Math.round(255 * (percent / 100));
  let b = (num & 0x0000ff) + Math.round(255 * (percent / 100));

  r = Math.min(255, Math.max(0, r));
  g = Math.min(255, Math.max(0, g));
  b = Math.min(255, Math.max(0, b));

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export default function FloorPlanExplorer({ onOpenLogin }: FloorPlanExplorerProps) {
  const [selectedCategory, setSelectedCategory] = useState<ApartmentCategory>('2PN');
  const [viewerMode, setViewerMode] = useState<ViewerMode>('ASSEMBLED_3D');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('living');
  const [hoveredRoomId, setHoveredRoomId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [leadForm, setLeadForm] = useState({ name: '', phone: '', timeSlot: '' });

  const currentApartment = APARTMENT_MODELS[selectedCategory];

  // Phòng đang được chọn hoặc hover
  const activeRoom = useMemo(() => {
    const targetId = hoveredRoomId || selectedRoomId;
    return currentApartment.rooms.find(r => r.id === targetId) || currentApartment.rooms[0];
  }, [currentApartment, hoveredRoomId, selectedRoomId]);

  // Đổi loại căn hộ thì tự động chọn phòng đầu tiên
  const handleSelectCategory = (cat: ApartmentCategory) => {
    setSelectedCategory(cat);
    const newApt = APARTMENT_MODELS[cat];
    setSelectedRoomId(newApt.rooms[0].id);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterSuccess(true);
    setTimeout(() => {
      setRegisterSuccess(false);
      setIsRegisterOpen(false);
      setLeadForm({ name: '', phone: '', timeSlot: '' });
    }, 2000);
  };

  // Tính toán scale và origin cho SVG Isometric
  const originX = 420;
  const originY = selectedCategory === 'DUPLEX' ? 240 : 190;
  const baseScale = (selectedCategory === 'DUPLEX' ? 1.05 : 1.15) * zoomLevel;

  return (
    <section id="floorplans" className="py-12 sm:py-20 bg-[#0A0E17] text-white border-b border-[#1E293B] relative overflow-hidden select-none">
      {/* Background glow tinh tế */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-[#C5A880]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-blue-900/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 space-y-8 sm:space-y-10">
        {/* ============================================================= */}
        {/* 1. TIÊU ĐỀ RÕ RÀNG, TINH TẾ                                    */}
        {/* ============================================================= */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#1E293B]">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#161F2E] border border-[#C5A880]/40 rounded text-[11px] font-mono uppercase tracking-[0.2em] text-[#C5A880]">
              <Box className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>Mô Hình Khối Không Gian 3D Căn Hộ Skyline</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif text-white font-bold tracking-tight">
              Khám Phá Cấu Trúc Khối Xếp & Thiết Kế Căn Hộ
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 font-light leading-relaxed">
              Mỗi loại căn hộ sở hữu thiết kế hình khối và cơ cấu xếp phòng độc bản. Chạm hoặc rê chuột vào từng khối phòng để khám phá chi tiết công năng.
            </p>
          </div>

          <button
            onClick={() => setIsRegisterOpen(true)}
            className="px-4 py-2.5 bg-[#C5A880] hover:bg-[#D4AF37] text-[#0A0E17] font-bold text-xs tracking-wider uppercase rounded transition-all shadow-lg flex items-center gap-2 shrink-0 self-start md:self-auto"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Đăng Ký Tham Quan Căn Hộ</span>
          </button>
        </div>

        {/* ============================================================= */}
        {/* 2. BỘ CHỌN 4 LOẠI CĂN HỘ VỚI CẤU TRÚC KHỐI XẾP KHÁC BIỆT       */}
        {/* ============================================================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          {(['1PN', '2PN', '3PN', 'DUPLEX'] as ApartmentCategory[]).map((cat) => {
            const apt = APARTMENT_MODELS[cat];
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => handleSelectCategory(cat)}
                className={`p-3 sm:p-4 rounded-lg border text-left transition-all relative flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#151D29] border-[#C5A880] shadow-xl ring-1 ring-[#C5A880]/60'
                    : 'bg-[#0E131C] border-[#1E293B] hover:border-[#2D3F58] hover:bg-[#121824]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-mono text-xs font-bold text-white">Căn {apt.code}</span>
                    <span className={`text-[9.5px] px-1.5 py-0.5 rounded font-mono font-semibold border ${
                      cat === 'DUPLEX' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                      cat === '3PN' ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' :
                      cat === '2PN' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                      'bg-sky-500/20 text-sky-300 border-sky-500/40'
                    }`}>
                      {cat === 'DUPLEX' ? '2 Tầng Thông Suốt' : `${apt.rooms.length} Khối Phòng`}
                    </span>
                  </div>
                  <div className="font-serif text-sm font-bold text-[#C5A880] mt-0.5">
                    {apt.name} ({apt.area} m²)
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-[#1E293B] flex items-center justify-between text-[11px] text-gray-400 font-mono">
                  <span>{apt.bedrooms} PN • {apt.bathrooms} WC</span>
                  <span className="text-white font-semibold">{apt.priceBillion.toFixed(2)} Tỷ</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* ============================================================= */}
        {/* 3. KHU VỰC HIỂN THỊ MÔ HÌNH 3D & THÔNG SỐ CĂN HỘ               */}
        {/* ============================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* CỘT TRÁI (7 CỘT): MÔ HÌNH KHỐI HỘP 3D ISOMETRIC CHÂN THỰC */}
          <div className="lg:col-span-7 space-y-3">
            <div className="border border-[#1E293B] bg-[#0E131C] rounded-lg overflow-hidden shadow-2xl relative">
              {/* THANH ĐIỀU KHIỂN CHẾ ĐỘ 3D & ZOOM */}
              <div className="p-3 bg-[#121824] border-b border-[#1E293B] flex flex-wrap items-center justify-between gap-2">
                {/* 3 Chế độ: Xếp liền khối / Tách khối / Ảnh thực tế */}
                <div className="flex bg-[#070A10] p-1 border border-[#1E293B] rounded shrink-0">
                  <button
                    type="button"
                    onClick={() => setViewerMode('ASSEMBLED_3D')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors flex items-center gap-1.5 ${
                      viewerMode === 'ASSEMBLED_3D' ? 'bg-[#C5A880] text-[#0A0E17] font-bold shadow' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Box className="w-3.5 h-3.5" />
                    <span>3D Liền Khối</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewerMode('EXPLODED_3D')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors flex items-center gap-1.5 ${
                      viewerMode === 'EXPLODED_3D' ? 'bg-[#C5A880] text-[#0A0E17] font-bold shadow' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <SplitSquareVertical className="w-3.5 h-3.5" />
                    <span>Tách Khối Phòng</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewerMode('REAL_PHOTO')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors flex items-center gap-1.5 ${
                      viewerMode === 'REAL_PHOTO' ? 'bg-[#C5A880] text-[#0A0E17] font-bold shadow' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ảnh Bàn Giao</span>
                  </button>
                </div>

                {/* Bộ điều khiển Zoom */}
                {viewerMode !== 'REAL_PHOTO' && (
                  <div className="flex items-center bg-[#070A10] border border-[#1E293B] rounded overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setZoomLevel(prev => Math.max(0.7, Number((prev - 0.15).toFixed(2))))}
                      className="px-2 py-1 text-gray-400 hover:text-white hover:bg-[#1E293B] transition-colors"
                      title="Thu nhỏ"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-2 py-1 font-mono text-[10.5px] text-[#C5A880] border-x border-[#1E293B]">
                      {Math.round(zoomLevel * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={() => setZoomLevel(prev => Math.min(1.5, Number((prev + 0.15).toFixed(2))))}
                      className="px-2 py-1 text-gray-400 hover:text-white hover:bg-[#1E293B] transition-colors"
                      title="Phóng to"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* KHUNG HIỂN THỊ CHÍNH (3D ISOMETRIC / ẢNH) */}
              {viewerMode === 'REAL_PHOTO' ? (
                <div className="relative h-72 sm:h-96 overflow-hidden group">
                  <img
                    src={currentApartment.photoUrl}
                    alt={currentApartment.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E17]/90 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 text-xs">
                    <div className="bg-[#0A0E17]/90 border border-[#C5A880]/60 px-3 py-1.5 rounded backdrop-blur-md">
                      <span className="text-[10px] font-mono uppercase text-[#C5A880] font-semibold block">Tầm nhìn thực tế:</span>
                      <span className="text-white font-medium">{currentApartment.viewDesc}</span>
                    </div>
                    <div className="bg-[#0A0E17]/90 border border-emerald-500/60 px-3 py-1.5 rounded backdrop-blur-md text-emerald-300 font-mono text-xs">
                      ✓ {currentApartment.statusLabel}
                    </div>
                  </div>
                </div>
              ) : (
                /* CANVAS SVG 3D ISOMETRIC RENDER CHÍNH XÁC */
                <div className="relative bg-[#070A10] h-72 sm:h-96 md:h-[420px] flex items-center justify-center overflow-hidden p-2">
                  {/* Lưới tọa độ kiến trúc */}
                  <div 
                    className="absolute inset-0 opacity-15 pointer-events-none"
                    style={{
                      backgroundImage: 'linear-gradient(to right, #1E293B 1px, transparent 1px), linear-gradient(to bottom, #1E293B 1px, transparent 1px)',
                      backgroundSize: '24px 24px'
                    }}
                  />

                  {/* La bàn phong thủy chỉ hướng trên mô hình */}
                  <div className="absolute top-3 left-3 bg-[#0E131C]/80 border border-[#1E293B] px-2.5 py-1 rounded text-[10.5px] font-mono text-gray-400 flex items-center gap-1.5 z-10 backdrop-blur-sm">
                    <Compass className="w-3.5 h-3.5 text-[#C5A880]" />
                    <span>Hướng Ban Công: <strong className="text-emerald-400">{currentApartment.direction}</strong></span>
                  </div>

                  {/* SVG VẼ TỪNG KHỐI HỘP 3D ISOMETRIC */}
                  <svg
                    viewBox="0 0 840 500"
                    className="w-full h-full max-w-none select-none cursor-pointer"
                  >
                    {/* Vẽ từng khối phòng theo thứ tự từ xa lại gần (Z-sorting để đổ bóng chính xác) */}
                    {(() => {
                      // Sắp xếp các khối theo độ sâu isometric: (x + y + z)
                      const isExploded = viewerMode === 'EXPLODED_3D';
                      const sortedRooms = [...currentApartment.rooms].sort((a, b) => {
                        const depthA = (a.x + a.y) + (a.z || 0) * 0.5;
                        const depthB = (b.x + b.y) + (b.z || 0) * 0.5;
                        return depthA - depthB;
                      });

                      return sortedRooms.map((room) => {
                        const isHovered = hoveredRoomId === room.id;
                        const isSelected = selectedRoomId === room.id;
                        const isElevated = isHovered || isSelected;

                        // Độ dịch chuyển khi Tách khối (Exploded View)
                        const explodeFactor = isExploded ? 1.25 : 1.0;
                        const offsetX = (room.x - 50) * (explodeFactor - 1);
                        const offsetY = (room.y - 50) * (explodeFactor - 1);

                        // Nâng khối lên nhẹ khi hover/click
                        const liftZ = isElevated ? 12 : 0;
                        const finalZ = (room.z || 0) + liftZ;

                        const curX = room.x + offsetX;
                        const curY = room.y + offsetY;
                        const { w, d, h } = room;

                        // Tính toán 8 đỉnh của khối hộp 3D Isometric
                        // Đỉnh mặt sàn dưới (Z = finalZ)
                        const p0 = toIso(curX, curY, finalZ, originX, originY, baseScale);
                        const p1 = toIso(curX + w, curY, finalZ, originX, originY, baseScale);
                        const p2 = toIso(curX + w, curY + d, finalZ, originX, originY, baseScale);
                        const p3 = toIso(curX, curY + d, finalZ, originX, originY, baseScale);

                        // Đỉnh mặt sàn trên (Z = finalZ + h)
                        const t0 = toIso(curX, curY, finalZ + h, originX, originY, baseScale);
                        const t1 = toIso(curX + w, curY, finalZ + h, originX, originY, baseScale);
                        const t2 = toIso(curX + w, curY + d, finalZ + h, originX, originY, baseScale);
                        const t3 = toIso(curX, curY + d, finalZ + h, originX, originY, baseScale);

                        // Màu sắc bóng đổ 3D
                        const topColor = isElevated ? '#D4AF37' : room.color;
                        const rightColor = shadeColor(room.color, -25);
                        const leftColor = shadeColor(room.color, -42);

                        // Tâm của mặt trên để đặt nhãn text
                        const midTopX = (t0.sx + t2.sx) / 2;
                        const midTopY = (t0.sy + t2.sy) / 2;

                        return (
                          <g
                            key={room.id}
                            onClick={() => setSelectedRoomId(room.id)}
                            onMouseEnter={() => setHoveredRoomId(room.id)}
                            onMouseLeave={() => setHoveredRoomId(null)}
                            className="transition-all duration-300"
                          >
                            {/* Bóng đổ mặt sàn */}
                            {isElevated && (
                              <polygon
                                points={`${p0.sx},${p0.sy} ${p1.sx},${p1.sy} ${p2.sx},${p2.sy} ${p3.sx},${p3.sy}`}
                                fill="#000000"
                                opacity="0.45"
                              />
                            )}

                            {/* Mặt Bên Trái (Front-Left Face) */}
                            <polygon
                              points={`${p3.sx},${p3.sy} ${p2.sx},${p2.sy} ${t2.sx},${t2.sy} ${t3.sx},${t3.sy}`}
                              fill={leftColor}
                              stroke="#1E293B"
                              strokeWidth="1"
                            />

                            {/* Mặt Bên Phải (Front-Right Face) */}
                            <polygon
                              points={`${p1.sx},${p1.sy} ${p2.sx},${p2.sy} ${t2.sx},${t2.sy} ${t1.sx},${t1.sy}`}
                              fill={rightColor}
                              stroke="#1E293B"
                              strokeWidth="1"
                            />

                            {/* Mặt Trên (Top Face) */}
                            <polygon
                              points={`${t0.sx},${t0.sy} ${t1.sx},${t1.sy} ${t2.sx},${t2.sy} ${t3.sx},${t3.sy}`}
                              fill={topColor}
                              stroke={isElevated ? '#FFFFFF' : '#334155'}
                              strokeWidth={isElevated ? '2' : '1'}
                            />

                            {/* Viền sáng (Highlight wireframe) */}
                            {isElevated && (
                              <polygon
                                points={`${t0.sx},${t0.sy} ${t1.sx},${t1.sy} ${t2.sx},${t2.sy} ${t3.sx},${t3.sy}`}
                                fill="none"
                                stroke="#FFFFFF"
                                strokeWidth="2"
                                strokeDasharray="4 2"
                              />
                            )}

                            {/* Nhãn Tên Phòng Trên Mặt Khối */}
                            <text
                              x={midTopX}
                              y={midTopY - 2}
                              fill="#0A0E17"
                              fontSize="11"
                              fontFamily="sans-serif"
                              fontWeight="bold"
                              textAnchor="middle"
                              className="pointer-events-none select-none drop-shadow-sm"
                            >
                              {room.code}
                            </text>
                            <text
                              x={midTopX}
                              y={midTopY + 12}
                              fill="#1E293B"
                              fontSize="9.5"
                              fontFamily="monospace"
                              fontWeight="bold"
                              textAnchor="middle"
                              className="pointer-events-none select-none"
                            >
                              {room.area}m²
                            </text>
                          </g>
                        );
                      });
                    })()}
                  </svg>
                </div>
              )}
            </div>

            {/* CHÚ GIẢI PHÒNG ĐANG CHỌN (INTERACTIVE ROOM TOOLTIP) */}
            <div className="p-3.5 bg-[#0E131C] border border-[#1E293B] rounded-lg flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <span
                  className="w-4 h-4 rounded shrink-0 shadow"
                  style={{ backgroundColor: activeRoom.color }}
                />
                <div>
                  <div className="font-bold text-white font-serif text-sm">
                    {activeRoom.name} ({activeRoom.area} m²)
                  </div>
                  <div className="text-gray-400 text-[11px] font-light mt-0.5">
                    {activeRoom.desc} • Kích thước: <span className="font-mono text-gray-200">{activeRoom.dim}</span>
                  </div>
                </div>
              </div>

              <div className="text-[10.5px] font-mono text-[#C5A880] shrink-0 border border-[#C5A880]/30 px-2 py-1 rounded bg-[#151D29]">
                Chạm để chọn khối
              </div>
            </div>
          </div>

          {/* CỘT PHẢI (5 CỘT): BÁO GIÁ, THÔNG SỐ VÀNG & NÚT HÀNH ĐỘNG */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 sm:p-6 bg-[#0E131C] border border-[#C5A880]/50 rounded-lg shadow-2xl space-y-5">
              {/* Tiêu đề căn & Giá niêm yết */}
              <div className="flex items-start justify-between pb-4 border-b border-[#1E293B] gap-2">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-[#C5A880] font-semibold">
                    {currentApartment.name}
                  </div>
                  <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white mt-0.5">
                    Căn Hộ {currentApartment.code}
                  </h3>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {currentApartment.floorText}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-gray-400">
                    Giá Bán Dự Kiến
                  </div>
                  <div className="font-mono text-xl sm:text-2xl font-bold text-[#C5A880] mt-0.5">
                    {currentApartment.priceBillion.toFixed(2)} Tỷ
                  </div>
                  <div className="text-[10px] text-gray-400 font-mono">
                    ~ {(currentApartment.priceBillion * 1000 / currentApartment.area).toFixed(1)} tr/m²
                  </div>
                </div>
              </div>

              {/* LƯỚI 4 THÔNG SỐ CHÍNH (TO RÕ TRÊN MỌI THIẾT BỊ) */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 bg-[#121824] border border-[#1E293B] rounded">
                  <div className="text-[10px] text-gray-400 font-mono uppercase">Diện Tích Thông Thủy</div>
                  <div className="font-mono text-base sm:text-lg font-bold text-white mt-0.5">
                    {currentApartment.area} m²
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">Tim tường: {currentApartment.wallArea} m²</div>
                </div>

                <div className="p-3 bg-[#121824] border border-[#1E293B] rounded">
                  <div className="text-[10px] text-gray-400 font-mono uppercase">Hướng Ban Công</div>
                  <div className="font-mono text-base sm:text-lg font-bold text-emerald-400 mt-0.5">
                    {currentApartment.direction}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">Đón gió sông mát lành</div>
                </div>

                <div className="p-3 bg-[#121824] border border-[#1E293B] rounded">
                  <div className="text-[10px] text-gray-400 font-mono uppercase">Cơ Cấu Phòng</div>
                  <div className="font-mono text-base sm:text-lg font-bold text-white mt-0.5">
                    {currentApartment.bedrooms} PN • {currentApartment.bathrooms} WC
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{currentApartment.rooms.length} Khối phòng chức năng</div>
                </div>

                <div className="p-3 bg-[#121824] border border-[#1E293B] rounded">
                  <div className="text-[10px] text-gray-400 font-mono uppercase">Pháp Lý & Bàn Giao</div>
                  <div className="font-mono text-base sm:text-lg font-bold text-white mt-0.5">
                    Sổ Hồng Lâu Dài
                  </div>
                  <div className="text-[10px] text-[#C5A880] mt-0.5 font-medium">{currentApartment.statusLabel}</div>
                </div>
              </div>

              {/* HUY HIỆU CĂN CƯ DÂN THỰC TẾ (NẾU LÀ CĂN 12A05) */}
              {currentApartment.isRealResident && (
                <div className="p-3 bg-[#1A160E] border border-amber-500/50 rounded flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 font-bold text-sm">
                    ★
                  </div>
                  <div className="text-xs">
                    <span className="font-bold text-amber-300 block">Căn Hộ Cư Dân Thực Tế Đã Bàn Giao</span>
                    <span className="text-gray-300 font-light">Chủ hộ: <strong>{currentApartment.residentName}</strong> • Đang sinh sống</span>
                  </div>
                </div>
              )}

              {/* TIÊU CHUẨN KHÔNG GIAN BÀN GIAO */}
              <div className="space-y-2 pt-2 border-t border-[#1E293B]">
                <div className="text-[10.5px] font-mono uppercase text-gray-400 tracking-wider">
                  Đặc Trưng Kiến Trúc & Công Nghệ
                </div>
                <ul className="space-y-1.5 text-xs text-gray-300 font-light">
                  {currentApartment.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-[#C5A880] shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* DANH SÁCH KHỐI PHÒNG CHI TIẾT */}
              <div className="pt-2 border-t border-[#1E293B] space-y-1.5">
                <div className="text-[10.5px] font-mono uppercase text-gray-400 tracking-wider flex items-center justify-between">
                  <span>Cơ Cấu Khối Không Gian</span>
                  <span className="text-[#C5A880]">{currentApartment.rooms.length} Khối</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  {currentApartment.rooms.map((r) => {
                    const isSelected = selectedRoomId === r.id;
                    return (
                      <div
                        key={r.id}
                        onClick={() => setSelectedRoomId(r.id)}
                        className={`p-1.5 rounded flex items-center justify-between text-[11px] cursor-pointer transition-all border ${
                          isSelected 
                            ? 'bg-[#18212F] border-[#C5A880] text-white font-bold' 
                            : 'bg-[#121824] border-[#1E293B] text-gray-300 hover:border-gray-500'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: r.color }} />
                          <span className="truncate">{r.name}</span>
                        </div>
                        <strong className="font-mono text-white shrink-0 ml-1">{r.area}m²</strong>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* NÚT HÀNH ĐỘNG DỄ BẤM TRÊN MOBILE */}
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(true)}
                  className="w-full py-3.5 bg-[#C5A880] hover:bg-[#D4AF37] text-[#0A0E17] font-bold text-xs tracking-wider uppercase rounded-lg transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Đăng Ký Tham Quan Căn Hộ Thực Tế</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onOpenLogin) {
                      onOpenLogin();
                    } else {
                      window.location.href = '/portal';
                    }
                  }}
                  className="w-full py-2.5 bg-[#121824] hover:bg-[#1A2232] border border-[#2A374A] hover:border-[#C5A880]/60 text-gray-300 hover:text-white text-xs font-semibold tracking-wider uppercase rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
                  <span>Đăng Nhập Portal Ban Quản Lý / Cư Dân</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================= */}
      {/* MODAL ĐĂNG KÝ XEM NHÀ GỌN GÀNG, RESPONSIVE                     */}
      {/* ============================================================= */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0E131C] border border-[#C5A880]/60 rounded-xl p-5 sm:p-6 max-w-sm w-full shadow-2xl relative">
            <button
              onClick={() => setIsRegisterOpen(false)}
              className="absolute top-3.5 right-3.5 text-gray-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1.5 mb-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#C5A880] font-semibold">
                Tham Quan Trực Tiếp Skyline
              </span>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-white">
                Căn Hộ {currentApartment.code} ({currentApartment.category})
              </h3>
              <p className="text-xs text-gray-400 font-light">
                Ban Quản Lý sẽ liên hệ sắp xếp đón tiếp quý khách tham quan trực tiếp trong 15 phút.
              </p>
            </div>

            {registerSuccess ? (
              <div className="p-4 bg-emerald-950/80 border border-emerald-500 rounded-lg text-center space-y-1.5">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <div className="font-serif text-sm font-bold text-white">Ghi Nhận Thành Công!</div>
                <div className="text-xs text-gray-300">
                  Lễ tân Skyline sẽ liên hệ với quý khách để xác nhận khung giờ đón tiếp.
                </div>
              </div>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block text-gray-300 font-mono mb-1">Họ và Tên (*):</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Nguyễn Văn A"
                    value={leadForm.name}
                    onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                    className="w-full bg-[#121824] border border-[#1E293B] rounded p-2.5 text-white focus:outline-none focus:border-[#C5A880]"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-mono mb-1">Số Điện Thoại (*):</label>
                  <input
                    type="tel"
                    required
                    placeholder="Ví dụ: 0901 888 999"
                    value={leadForm.phone}
                    onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                    className="w-full bg-[#121824] border border-[#1E293B] rounded p-2.5 text-white focus:outline-none focus:border-[#C5A880]"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-mono mb-1">Khung Giờ Muốn Xem:</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Sáng mai lúc 9h30"
                    value={leadForm.timeSlot}
                    onChange={(e) => setLeadForm({ ...leadForm, timeSlot: e.target.value })}
                    className="w-full bg-[#121824] border border-[#1E293B] rounded p-2.5 text-white focus:outline-none focus:border-[#C5A880]"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 bg-[#C5A880] hover:bg-[#D4AF37] text-[#0A0E17] font-bold text-xs tracking-wider uppercase rounded-lg transition-all shadow-lg"
                  >
                    Xác Nhận Đăng Ký
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
