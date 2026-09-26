'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { 
  Box, 
  Layers, 
  Sparkles, 
  Check, 
  CheckCircle2, 
  Compass, 
  ShieldCheck, 
  Maximize2,
  BedDouble,
  Bath,
  ArrowRight,
  Info,
  Phone,
  LogIn,
  Home,
  UserCheck,
  CreditCard,
  UserPlus,
  Wrench,
  Building,
  Crown
} from 'lucide-react';
import { useTheme } from '@/lib/themeContext';
import { useAuth } from '@/lib/authContext';

interface FloorPlanExplorerProps {
  onOpenLogin?: () => void;
}

export type ApartmentCategory = '1PN' | '2PN' | '3PN' | 'DUPLEX';

export interface RoomHotspot {
  id: string;
  code: string;
  name: string;
  label: string;
  area: string;
  desc: string;
  top: number;
  left: number;
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
  render3DUrl: string;
  features: string[];
  hotspots: RoomHotspot[];
}

export const APARTMENT_MODELS: Record<ApartmentCategory, ApartmentData> = {
  '1PN': {
    category: '1PN',
    code: 'CH-06',
    name: 'Căn Hộ 1PN Chuẩn (CH-06)',
    subtitle: 'Căn hộ thực tế cư dân • Chung Cư BS-07 phân khu The Tropical',
    floorText: 'Tầng 30 • Chung Cư BS-07 (The Tropical)',
    area: 42.0,
    wallArea: 45.5,
    bedrooms: 1,
    bathrooms: 1,
    direction: 'Đông Nam',
    viewDesc: 'View trực diện công viên nội khu & hồ cảnh quan The Tropical',
    priceBillion: 2.31,
    statusLabel: 'Đã Bàn Giao Cư Dân',
    isRealResident: true,
    residentName: 'Trần Hữu Lực (Chủ Hộ)',
    render3DUrl: '/floorplans/1pn-3d.jpg',
    features: [
      'Căn hộ tiêu chuẩn 1PN - 1WC bàn giao thực tế tại Chung Cư BS-07',
      'Ban công kính tràn viền kết nối trực tiếp phòng khách đón trọn gió mát',
      'Đầy đủ nội thất cao cấp: tủ bếp, bếp điện từ âm, khóa thông minh FaceID'
    ],
    hotspots: [
      {
        id: 'living',
        code: 'PK',
        name: 'Phòng Khách & Bàn Ăn',
        label: 'Phòng Khách & Ăn',
        area: '18.5 m²',
        desc: 'Sofa góc bọc nỉ cao cấp, Smart TV gắn tường và bàn ăn thông minh.',
        top: 66,
        left: 58
      },
      {
        id: 'balcony',
        code: 'BC',
        name: 'Ban Công View Công Viên',
        label: 'Ban Công View Hồ',
        area: '3.5 m²',
        desc: 'Ban công kính rộng ngắm trọn hồ cảnh quan và quảng trường nội khu.',
        top: 68,
        left: 23
      },
      {
        id: 'bed',
        code: 'PN',
        name: 'Phòng Ngủ Master',
        label: 'Phòng Ngủ Master',
        area: '14.0 m²',
        desc: 'Giường nệm êm ái, tủ áo kịch trần và cửa sổ kính Low-E tràn viền.',
        top: 48,
        left: 31
      },
      {
        id: 'kitchen',
        code: 'BẾP',
        name: 'Khu Bếp & Logia',
        label: 'Bếp & Logia',
        area: '5.0 m²',
        desc: 'Bếp từ âm Hafele, mặt đá cao cấp và khu giặt sấy thông thoáng.',
        top: 28,
        left: 58
      },
      {
        id: 'bath',
        code: 'WC',
        name: 'Phòng Tắm & Vệ Sinh',
        label: 'Phòng Tắm WC',
        area: '4.0 m²',
        desc: 'Vách kính cường lực, lavabo sứ Kohler và hệ thống sen tắm âm tường.',
        top: 30,
        left: 40
      }
    ]
  },
  '2PN': {
    category: '2PN',
    code: 'CH-01',
    name: 'Căn Hộ 2PN Tiêu Chuẩn (CH-01)',
    subtitle: 'Căn mẫu thực tế cư dân • Bố cục bóc mái 3D view trực diện Sông Tắc & Công Viên',
    floorText: 'Tầng 30 • Chung Cư BS-07 (The Tropical)',
    area: 50.0,
    wallArea: 54.8,
    bedrooms: 2,
    bathrooms: 1,
    direction: 'Đông Bắc',
    viewDesc: 'View sông Sài Gòn & Quảng trường công viên ánh sáng 36ha',
    priceBillion: 2.75,
    statusLabel: 'Đã Bàn Giao Cư Dân',
    isRealResident: true,
    residentName: 'Trần Hữu Lực (Chủ Hộ)',
    render3DUrl: '/floorplans/2pn-3d.jpg',
    features: [
      'Thiết kế tối ưu 2 phòng ngủ ngập tràn ánh sáng tự nhiên từ mọi góc',
      'Phòng khách liên thông phòng ăn tạo cảm giác rộng rãi và thoáng đãng',
      'Trang bị hệ thống Smart Home chuẩn quốc tế, điều khiển qua ứng dụng Skyline'
    ],
    hotspots: [
      {
        id: 'living',
        code: 'PK',
        name: 'Phòng Khách Trung Tâm',
        label: 'Phòng Khách',
        area: '20.0 m²',
        desc: 'Sofa góc hiện đại, sàn gỗ công nghiệp cao cấp chống nước.',
        top: 50,
        left: 48
      },
      {
        id: 'balcony',
        code: 'BC',
        name: 'Ban Công Hướng Đông Bắc',
        label: 'Ban Công View Sông',
        area: '3.8 m²',
        desc: 'Lan can kính cường lực an toàn, thoáng mát suốt ngày.',
        top: 75,
        left: 35
      },
      {
        id: 'masterBed',
        code: 'PN 1',
        name: 'Phòng Ngủ Master',
        label: 'Phòng Ngủ Master',
        area: '16.0 m²',
        desc: 'Giường King size, vách ốp đầu giường da cao cấp, cửa sổ lớn view sông.',
        top: 52,
        left: 23
      },
      {
        id: 'secondBed',
        code: 'PN 2',
        name: 'Phòng Ngủ Số 2',
        label: 'Phòng Ngủ Số 2',
        area: '10.5 m²',
        desc: 'Không gian riêng tư cho thành viên gia đình hoặc phòng làm việc.',
        top: 72,
        left: 70
      },
      {
        id: 'bath',
        code: 'WC',
        name: 'Phòng Tắm & WC Tiêu Chuẩn',
        label: 'Phòng Tắm Master',
        area: '4.2 m²',
        desc: 'Vách kính tắm đứng, sen tắm âm tường Kohler và lavabo mặt đá.',
        top: 38,
        left: 77
      }
    ]
  },
  '3PN': {
    category: '3PN',
    code: 'CH-04',
    name: 'Căn Hộ 3PN Góc Panorama (CH-04)',
    subtitle: 'Căn góc 2 mặt thoáng VIP • View trọn vẹn quảng trường The Tropical',
    floorText: 'Tầng 30 • Chung Cư BS-07 (The Tropical)',
    area: 85.0,
    wallArea: 92.5,
    bedrooms: 3,
    bathrooms: 2,
    direction: 'Đông Nam & Tây Nam',
    viewDesc: 'View sông Sài Gòn & Quảng trường Grand Park lung linh',
    priceBillion: 4.68,
    statusLabel: 'Sẵn Sàng Bàn Giao',
    render3DUrl: '/floorplans/3pn-3d.jpg',
    features: [
      'Căn góc 2 mặt thoáng, ban công góc kép 270° ngắm toàn cảnh đại đô thị',
      'Đại sảnh phòng khách nối liền bàn ăn 6-8 người và khu bếp tiện nghi',
      '3 Phòng ngủ biệt lập có cửa sổ kính Low-E kịch trần cản 99% tia UV'
    ],
    hotspots: [
      {
        id: 'living',
        code: 'PK',
        name: 'Đại Phòng Khách Lớn',
        label: 'Đại Phòng Khách',
        area: '28.0 m²',
        desc: 'Sofa cong nghệ thuật, bàn trà đôi mặt đá và hệ thống đèn LED âm trần dịu mắt.',
        top: 54,
        left: 33
      },
      {
        id: 'balcony',
        code: 'BC',
        name: 'Ban Công Góc Kép 270°',
        label: 'Ban Công Góc 270°',
        area: '6.5 m²',
        desc: 'Kính Low-E tràn viền ngắm toàn cảnh thành phố và khúc sông uốn lượn.',
        top: 24,
        left: 30
      },
      {
        id: 'kitchen',
        code: 'BẾP',
        name: 'Khu Bếp Đảo Bar & Bàn Tiệc',
        label: 'Bếp Đảo & Bàn Tiệc',
        area: '12.0 m²',
        desc: 'Tủ rượu âm tường, bếp đảo đá tự nhiên và bàn ăn sang trọng.',
        top: 32,
        left: 56
      },
      {
        id: 'masterSuite',
        code: 'PN 1',
        name: 'Master Presidential Suite',
        label: 'Master Suite',
        area: '20.0 m²',
        desc: 'Phòng ngủ master có góc thay đồ walk-in closet và view ngắm hoàng hôn.',
        top: 40,
        left: 78
      },
      {
        id: 'bed2',
        code: 'PN 2',
        name: 'Phòng Ngủ Số 2 Ensuite',
        label: 'Phòng Ngủ Số 2',
        area: '13.0 m²',
        desc: 'Phòng ngủ lớn tiện nghi cho người thân, giường Queen và tủ âm.',
        top: 53,
        left: 85
      },
      {
        id: 'bed3',
        code: 'PN 3',
        name: 'Phòng Ngủ Số 3 / Studio',
        label: 'Phòng Ngủ 3 / Studio',
        area: '10.5 m²',
        desc: 'Bàn làm việc cạnh cửa sổ lớn, sofa bed thư giãn hoặc phòng làm việc riêng.',
        top: 78,
        left: 52
      }
    ]
  },
  'DUPLEX': {
    category: 'DUPLEX',
    code: 'PH-3401',
    name: 'Duplex Penthouse Hoàng Gia',
    subtitle: 'Tuyệt tác thông 2 tầng đỉnh Chung Cư BS-07 • Trần cao 6.5m & Hồ Jacuzzi',
    floorText: 'Tầng 34 (Đỉnh Chung Cư) • The Tropical',
    area: 215.0,
    wallArea: 232.0,
    bedrooms: 4,
    bathrooms: 4,
    direction: 'Đông Nam • Chính Diện Sông',
    viewDesc: 'View triệu đô Panorama 360° ôm trọn sông Đồng Nai và toàn thành phố',
    priceBillion: 12.80,
    statusLabel: 'Phiên Bản Giới Hạn',
    render3DUrl: '/floorplans/duplex-3d.jpg',
    features: [
      'Thiết kế thông tầng Duplex trần cao 6.5m với đèn chùm pha lê cao cấp',
      'Hồ bơi Jacuzzi chân mây và sân vườn thượng uyển riêng trên cao',
      'Hệ thống thang máy riêng bảo mật sinh trắc học FaceID tầng Penthouse'
    ],
    hotspots: [
      {
        id: 'livingAtrium',
        code: 'ĐẠI SẢNH',
        name: 'Đại Phòng Khách Thông Tầng',
        label: 'Đại Sảnh Thông Tầng',
        area: '55.0 m²',
        desc: 'Trần cao 6.5m, vách kính chịu lực ngắm bầu trời và toàn cảnh thành phố.',
        top: 48,
        left: 38
      },
      {
        id: 'jacuzziSky',
        code: 'JACUZZI',
        name: 'Sân Vườn & Hồ Jacuzzi Chân Mây',
        label: 'Hồ Jacuzzi & Vườn',
        area: '24.0 m²',
        desc: 'Hồ sục nước ấm thư giãn ngoài trời với cây xanh nhiệt đới The Tropical.',
        top: 80,
        left: 28
      },
      {
        id: 'penthouseMaster',
        code: 'ROYAL SUITE',
        name: 'Phòng Ngủ Hoàng Gia Tầng 2',
        label: 'Phòng Ngủ Hoàng Gia',
        area: '32.0 m²',
        desc: 'Phòng ngủ tổng thống, bồn tắm nằm đá cẩm thạch ngắm trọn sao trời.',
        top: 25,
        left: 45
      },
      {
        id: 'guestLounge',
        code: 'PN PHỤ',
        name: 'Phòng Khách Phụ & Phòng Ngủ 2',
        label: 'Phòng Khách Phụ',
        area: '18.0 m²',
        desc: 'Phòng ngủ thứ 2 tầng trên có ban công lửng nhìn xuống phòng khách.',
        top: 30,
        left: 80
      },
      {
        id: 'diningKitchen',
        code: 'BẾP & TIỆC',
        name: 'Show Kitchen & Bàn Tiệc 12 Chỗ',
        label: 'Show Kitchen & Bàn Tiệc',
        area: '25.0 m²',
        desc: 'Khu vực ẩm thực thượng lưu với tủ bảo quản rượu vang và bàn ăn dài.',
        top: 72,
        left: 66
      }
    ]
  }
};

function getUserAptCategory(code?: string): ApartmentCategory | null {
  if (!code) return null;
  const upper = code.toUpperCase();
  if (upper.includes('CH-06')) return '1PN';
  if (upper.includes('CH-01') || upper.includes('CH-08')) return '2PN';
  if (upper.includes('CH-04')) return '3PN';
  if (upper.includes('PH') || upper.includes('DUPLEX')) return 'DUPLEX';
  return '1PN';
}

export default function FloorPlanExplorer({ onOpenLogin }: FloorPlanExplorerProps) {
  const { theme } = useTheme();
  const { currentUser, isAuthenticated } = useAuth();
  const isDark = theme === 'dark';

  const [selectedCategory, setSelectedCategory] = useState<ApartmentCategory>('1PN');
  const [activeHotspotId, setActiveHotspotId] = useState<string>('living');

  const isOwnerOrResident = isAuthenticated && (currentUser?.role === 'OWNER' || currentUser?.role === 'TENANT');
  const isAdmin = isAuthenticated && currentUser?.role === 'ADMIN';
  const isTechnician = isAuthenticated && currentUser?.role === 'TECHNICIAN';

  // Xác định loại căn hộ mà cư dân đang sở hữu
  const userAptCategory = useMemo(() => {
    if (isOwnerOrResident && currentUser) {
      return getUserAptCategory(currentUser.apartment_code || 'CH-06');
    }
    return null;
  }, [isOwnerOrResident, currentUser]);

  // Nếu cư dân đăng nhập, tự động ưu tiên hiển thị căn hộ của họ trước
  useEffect(() => {
    if (userAptCategory) {
      setSelectedCategory(userAptCategory);
      setActiveHotspotId(APARTMENT_MODELS[userAptCategory].hotspots[0].id);
    }
  }, [userAptCategory]);

  const currentApartment = APARTMENT_MODELS[selectedCategory];

  // Người dùng đang xem đúng loại căn hộ mà họ sở hữu
  const isUserOwnsThisApt = Boolean(isOwnerOrResident && userAptCategory === selectedCategory);

  // Phòng đang được chọn qua hotspot
  const activeRoom = useMemo(() => {
    return currentApartment.hotspots.find(h => h.id === activeHotspotId) || currentApartment.hotspots[0];
  }, [currentApartment, activeHotspotId]);

  const handleSelectCategory = (cat: ApartmentCategory) => {
    setSelectedCategory(cat);
    const newApt = APARTMENT_MODELS[cat];
    setActiveHotspotId(newApt.hotspots[0].id);
  };

  return (
    <section id="floorplans" className={`py-12 sm:py-20 border-b scroll-mt-20 relative overflow-hidden select-none transition-colors duration-300 ${
      isDark 
        ? 'bg-[#0A0E17] text-white border-[#1E293B]' 
        : 'bg-[#F8FAFC] text-gray-900 border-gray-200'
    }`}>
      {/* Background glow tinh tế */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-[#C5A880]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-blue-900/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 space-y-8 sm:space-y-10">
        {/* ============================================================= */}
        {/* 1. HEADER KHU VỰC: MINH BẠCH, HIỂN THỊ THEO TỪNG VAI TRÒ      */}
        {/* ============================================================= */}
        <div className={`flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b ${
          isDark ? 'border-[#1E293B]' : 'border-gray-200'
        }`}>
          <div className="space-y-2 max-w-2xl">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-none text-[11px] font-mono uppercase tracking-[0.2em] ${
              isDark 
                ? 'bg-[#161F2E] border border-[#C5A880]/40 text-[#C5A880]' 
                : 'bg-white border border-[#C5A880]/60 text-amber-800 shadow-sm'
            }`}>
              <Box className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>Mặt Bằng 3D Minh Bạch • Chung Cư BS-07 The Tropical</span>
            </div>
            <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-serif font-bold tracking-tight ${
              isDark ? 'text-white' : 'text-[#0D1117]'
            }`}>
              Sơ Đồ Không Gian 3D Căn Hộ
            </h2>
            <p className={`text-xs sm:text-sm font-light leading-relaxed ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Thông tin diện tích, mặt bằng bóc mái 3D và hiện trạng kỹ thuật được hiển thị minh bạch. Click trực tiếp vào các phòng trên mô hình để xem công năng chi tiết.
            </p>
          </div>

          {/* Phía bên phải Header: Phù hợp theo trạng thái đăng nhập & Role */}
          <div className="shrink-0 self-start md:self-auto">
            {!isAuthenticated ? (
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={onOpenLogin || (() => { window.location.href = '/portal'; })}
                  className="px-4 py-2.5 bg-[#C5A880] hover:bg-[#D4AF37] text-[#0A0E17] font-bold text-xs tracking-wider uppercase rounded-none transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Đăng Nhập Cư Dân / BQL</span>
                </button>
                <a
                  href="tel:0364967082"
                  className={`px-3 py-2.5 border rounded-none text-xs font-mono transition-colors flex items-center gap-1.5 ${
                    isDark 
                      ? 'border-[#2A374A] hover:border-[#C5A880] text-gray-300 hover:text-white' 
                      : 'border-gray-300 hover:border-gray-500 text-gray-700 bg-white'
                  }`}
                  title="Hotline Ban Quản Lý"
                >
                  <Phone className="w-3.5 h-3.5 text-[#C5A880]" />
                  <span>0364 967 082</span>
                </a>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className={`text-right hidden sm:block ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <div className="text-xs font-semibold flex items-center justify-end gap-1.5">
                    {isOwnerOrResident && <Crown className="w-3.5 h-3.5 text-[#C5A880]" />}
                    {isAdmin && <Building className="w-3.5 h-3.5 text-blue-400" />}
                    {isTechnician && <Wrench className="w-3.5 h-3.5 text-amber-400" />}
                    <span>{currentUser?.full_name}</span>
                  </div>
                  <div className="text-[10px] text-[#C5A880] font-mono uppercase font-bold">
                    {isAdmin 
                      ? 'Quản Trị BQL Chung Cư' 
                      : isTechnician 
                        ? 'Kỹ Thuật Viên Vận Hành' 
                        : `Chủ Hộ Căn ${currentUser?.apartment_code || 'CH-06'}`}
                  </div>
                </div>

                <Link
                  href={isAdmin ? '/portal?tab=admin-building' : isTechnician ? '/portal?tab=admin-kanban' : '/portal?tab=resident-home'}
                  className="px-4 py-2.5 bg-[#C5A880] hover:bg-[#D4AF37] text-[#0A0E17] font-bold text-xs tracking-wider uppercase rounded-none transition-all shadow-md flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Vào Bảng Điều Khiển</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* ============================================================= */}
        {/* 2. BỘ CHỌN 4 LOẠI CĂN HỘ (ĐÁNH DẤU CĂN CỦA CƯ DÂN NẾU CÓ)      */}
        {/* ============================================================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          {(['1PN', '2PN', '3PN', 'DUPLEX'] as ApartmentCategory[]).map((cat) => {
            const apt = APARTMENT_MODELS[cat];
            const isSelected = selectedCategory === cat;
            const isThisUserApt = Boolean(isOwnerOrResident && userAptCategory === cat);

            return (
              <button
                key={cat}
                type="button"
                onClick={() => handleSelectCategory(cat)}
                className={`p-3 sm:p-4 rounded-none border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? isDark
                      ? 'bg-[#151D29] border-[#C5A880] shadow-xl ring-1 ring-[#C5A880]/70'
                      : 'bg-white border-[#C5A880] shadow-lg ring-1 ring-[#C5A880]'
                    : isDark
                      ? 'bg-[#0E131C] border-[#1E293B] hover:border-[#2D3F58] hover:bg-[#121824]'
                      : 'bg-white border-gray-200 hover:border-gray-400 hover:bg-slate-50 shadow-sm'
                }`}
              >
                {/* Huy hiệu Căn Của Bạn nếu người dùng sở hữu loại căn này */}
                {isThisUserApt && (
                  <div className="absolute -top-2.5 right-3 bg-[#C5A880] text-[#0A0E17] text-[9.5px] font-mono font-bold px-2 py-0.5 uppercase tracking-wider shadow-md flex items-center gap-1 z-20">
                    <Crown className="w-2.5 h-2.5" />
                    <span>Căn Của Bạn</span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className={`font-mono text-xs font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Căn {apt.code}
                    </span>
                    <span className={`text-[9.5px] px-1.5 py-0.5 rounded-none font-mono font-semibold border ${
                      cat === 'DUPLEX' ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' :
                      cat === '3PN' ? 'bg-purple-500/20 text-purple-400 border-purple-500/40' :
                      cat === '2PN' ? 'bg-amber-500/20 text-amber-500 border-amber-500/40' :
                      'bg-sky-500/20 text-sky-400 border-sky-500/40'
                    }`}>
                      {cat === 'DUPLEX' ? '2 Tầng Thông Suốt' : `${apt.bedrooms} PN • ${apt.bathrooms} WC`}
                    </span>
                  </div>
                  <div className={`font-serif text-sm font-bold mt-0.5 ${
                    isSelected ? 'text-[#C5A880]' : isDark ? 'text-gray-200' : 'text-gray-800'
                  }`}>
                    {apt.name} ({apt.area} m²)
                  </div>
                </div>

                <div className={`mt-2 pt-2 border-t flex items-center justify-between text-[11px] font-mono ${
                  isDark ? 'border-[#1E293B] text-gray-400' : 'border-gray-100 text-gray-500'
                }`}>
                  <span>{cat === 'DUPLEX' ? 'Trần cao 6.5m' : `${apt.wallArea} m² tim tường`}</span>
                  <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {isThisUserApt ? 'Đang Cư Trú' : `${apt.priceBillion.toFixed(2)} Tỷ`}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* ============================================================= */}
        {/* 3. KHU VỰC HIỂN THỊ PHỐI CẢNH 3D & THÔNG TIN THEO TỪNG VAI TRÒ */}
        {/* ============================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          {/* CỘT TRÁI (7 CỘT): KHUNG PHỐI CẢNH 3D UNIFIED CARD */}
          <div className={`lg:col-span-7 flex flex-col justify-between h-full border rounded-none overflow-hidden shadow-2xl transition-colors ${
            isDark 
              ? 'border-[#C5A880]/40 bg-[#0E131C]' 
              : 'border-gray-200 bg-white shadow-xl'
          }`}>
            {/* Header thanh chỉ báo */}
            <div className={`p-3 sm:p-3.5 border-b flex items-center justify-between gap-2 shrink-0 ${
              isDark ? 'bg-[#121824] border-[#1E293B]' : 'bg-slate-50 border-gray-200'
            }`}>
              <div className={`flex items-center gap-2 text-xs font-mono font-semibold truncate ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <span className="w-2 h-2 rounded-full bg-[#C5A880] animate-pulse" />
                <span className="truncate">{currentApartment.subtitle}</span>
              </div>
              <div className={`text-[10px] font-mono px-2.5 py-0.5 rounded-none shrink-0 border ${
                isDark 
                  ? 'text-[#C5A880] bg-[#070A10] border-[#1E293B]' 
                  : 'text-amber-800 bg-white border-gray-200 shadow-sm'
              }`}>
                Click nhãn phòng để xem chi tiết
              </div>
            </div>

            {/* KHUNG ẢNH 3D ISOMETRIC CUTAWAY */}
            <div className="relative flex-1 min-h-[360px] sm:min-h-[420px] md:min-h-[460px] bg-[#05070A] overflow-hidden group">
              <img
                src={currentApartment.render3DUrl}
                alt={currentApartment.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />

              {/* Gradient che phủ viền tinh tế */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E17]/80 via-transparent to-transparent pointer-events-none" />

              {/* Hướng ban công góc trên bên trái */}
              <div className="absolute top-3 left-3 bg-[#0A0E17]/90 border border-[#1E293B] px-3 py-1.5 rounded-none text-xs font-mono text-gray-300 flex items-center gap-2 backdrop-blur-md z-10 shadow-lg">
                <Compass className="w-4 h-4 text-[#C5A880]" />
                <span>Ban công: <strong className="text-emerald-400">{currentApartment.direction}</strong></span>
              </div>

              {/* Trạng thái căn hộ góc trên bên phải */}
              <div className="absolute top-3 right-3 bg-[#0A0E17]/90 border border-emerald-500/50 px-3 py-1.5 rounded-none text-xs font-mono text-emerald-300 flex items-center gap-1.5 backdrop-blur-md z-10 shadow-lg">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isUserOwnsThisApt ? 'Căn Hộ Của Bạn' : currentApartment.statusLabel}</span>
              </div>

              {/* NHÃN PHÒNG TRÊN PHỐI CẢNH */}
              {currentApartment.hotspots.map((spot) => {
                const isActive = activeHotspotId === spot.id;
                return (
                  <button
                    key={spot.id}
                    type="button"
                    onClick={() => setActiveHotspotId(spot.id)}
                    className={`absolute z-20 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 group/pin focus:outline-none flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-none text-[11px] sm:text-xs cursor-pointer ${
                      isActive
                        ? 'bg-[#0E131C] text-white border-2 border-[#C5A880] shadow-[0_0_25px_rgba(197,168,128,0.8)] scale-110 opacity-100 z-30 font-bold ring-2 ring-[#C5A880]/50'
                        : 'bg-black/60 text-gray-300 border border-white/20 backdrop-blur-md opacity-60 hover:opacity-100 hover:border-white/60 hover:scale-105'
                    }`}
                    style={{ top: `${spot.top}%`, left: `${spot.left}%` }}
                  >
                    <span
                      className={`w-2 h-2 rounded-none shrink-0 transition-colors ${
                        isActive 
                          ? 'bg-[#C5A880] shadow-[0_0_8px_#C5A880] animate-pulse' 
                          : 'bg-white/60 group-hover/pin:bg-[#C5A880]'
                      }`}
                    />
                    <span className="whitespace-nowrap drop-shadow font-medium">
                      {spot.label}
                    </span>
                  </button>
                );
              })}

              {/* Thẻ chú thích hướng nhìn góc dưới */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 text-xs">
                <div className="bg-[#0A0E17]/90 border border-[#C5A880]/60 px-3 py-1.5 rounded-none backdrop-blur-md">
                  <span className="text-[10px] font-mono uppercase text-[#C5A880] font-semibold block">Tầm nhìn thực tế:</span>
                  <span className="text-white font-medium">{currentApartment.viewDesc}</span>
                </div>
                <div className="bg-[#0A0E17]/90 border border-gray-700 px-3 py-1.5 rounded-none backdrop-blur-md text-gray-300 font-mono text-xs hidden sm:block">
                  Mặt bằng bóc mái 3D
                </div>
              </div>
            </div>

            {/* THANH THÔNG TIN PHÒNG ĐANG CHỌN */}
            <div className={`p-3.5 sm:p-4 border-t flex items-center justify-between gap-3 text-xs shrink-0 ${
              isDark ? 'bg-[#121824] border-[#1E293B]' : 'bg-slate-50 border-gray-200'
            }`}>
              <div className="flex items-center gap-3 truncate">
                <div className="w-9 h-9 rounded-none bg-[#C5A880]/20 border border-[#C5A880] text-[#C5A880] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  {activeRoom.code}
                </div>
                <div className="truncate">
                  <div className={`font-bold font-serif text-sm flex items-center gap-2 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    <span>{activeRoom.name}</span>
                    <span className="text-[#C5A880] font-mono text-xs font-semibold">({activeRoom.area})</span>
                  </div>
                  <div className={`text-[11px] font-light truncate mt-0.5 ${
                    isDark ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {activeRoom.desc}
                  </div>
                </div>
              </div>

              <div className="text-[10px] font-mono text-emerald-400 shrink-0 bg-emerald-950/60 border border-emerald-500/40 px-2 py-1 rounded-none">
                ✓ Đang Xem Chi Tiết
              </div>
            </div>
          </div>

          {/* CỘT PHẢI (5 CỘT): NỘI DUNG VÀ HÀNH ĐỘNG ĐƯỢC CÁ NHÂN HÓA THEO ROLE */}
          <div className={`lg:col-span-5 flex flex-col justify-between h-full p-5 sm:p-6 rounded-none shadow-2xl space-y-5 transition-colors ${
            isDark ? 'bg-[#0E131C] border border-[#C5A880]/50' : 'bg-white border border-gray-200 shadow-xl'
          }`}>
            <div className="space-y-4">
              {/* ========================================================= */}
              {/* BANNER THÔNG BÁO THEO ROLE / NGƯỜI CÓ CĂN HỘ              */}
              {/* ========================================================= */}
              {isUserOwnsThisApt && (
                <div className="p-3 bg-gradient-to-r from-amber-500/20 via-[#C5A880]/15 to-transparent border-l-4 border-l-[#C5A880] border border-[#C5A880]/40 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-none bg-[#C5A880]/20 border border-[#C5A880] text-[#C5A880] flex items-center justify-center font-bold shrink-0">
                      <Crown className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#C5A880] uppercase tracking-wider flex items-center gap-1.5">
                        <span>Căn Hộ Đang Sở Hữu Của Bạn</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      </div>
                      <div className={`text-[11px] mt-0.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Chủ Hộ: <strong>{currentUser?.full_name}</strong> • Tầng 30 • Chung Cư BS-07
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shrink-0 font-semibold">
                    ĐÃ BÀN GIAO
                  </span>
                </div>
              )}

              {isOwnerOrResident && !isUserOwnsThisApt && (
                <div className="p-3 bg-blue-500/10 border-l-4 border-l-blue-500 border border-blue-500/30 flex items-center justify-between gap-3">
                  <div className="text-xs">
                    <div className="text-blue-400 font-bold uppercase tracking-wider">Mặt Bằng Dòng Căn Khác</div>
                    <div className={`text-[11px] mt-0.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      Căn hộ của bạn là <strong>Căn {currentUser?.apartment_code || 'CH-06'}</strong> ({userAptCategory}).
                    </div>
                  </div>
                  {userAptCategory && (
                    <button
                      type="button"
                      onClick={() => handleSelectCategory(userAptCategory)}
                      className="px-2.5 py-1 bg-[#C5A880] hover:bg-[#D4AF37] text-[#0A0E17] font-bold text-[10px] uppercase font-mono shrink-0 cursor-pointer shadow-sm"
                    >
                      Về Căn Của Tôi →
                    </button>
                  )}
                </div>
              )}

              {isAdmin && (
                <div className="p-3 bg-[#161F2E] border-l-4 border-l-blue-400 border border-[#233146] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-blue-400 shrink-0" />
                    <div className="text-xs">
                      <span className="font-bold text-blue-400 block uppercase">Chế Độ Quản Trị BQL Chung Cư</span>
                      <span className="text-[11px] text-gray-300">Dữ liệu NKS SCRMAI • Chung Cư BS-07 Tầng 30</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/40">
                    BQL ADMIN
                  </span>
                </div>
              )}

              {isTechnician && (
                <div className="p-3 bg-[#161F2E] border-l-4 border-l-amber-400 border border-[#233146] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-amber-400 shrink-0" />
                    <div className="text-xs">
                      <span className="font-bold text-amber-400 block uppercase">Chế Độ Kỹ Thuật Viên Vận Hành</span>
                      <span className="text-[11px] text-gray-300">Giám sát sơ đồ MEP, điện nước &amp; PCCC</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tiêu đề căn & Giá trị / Tình trạng */}
              <div className={`flex items-start justify-between pb-3.5 border-b gap-2 ${
                isDark ? 'border-[#1E293B]' : 'border-gray-200'
              }`}>
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-[#C5A880] font-semibold">
                    {currentApartment.name}
                  </div>
                  <h3 className={`font-serif text-2xl sm:text-3xl font-bold mt-0.5 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    Căn Hộ {currentApartment.code}
                  </h3>
                  <div className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {currentApartment.floorText}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-gray-400">
                    {isUserOwnsThisApt ? 'Hồ Sơ Căn Hộ' : isAdmin ? 'Trạng Thái Căn' : 'Giá Tham Chiếu'}
                  </div>
                  <div className="font-mono text-xl sm:text-2xl font-bold text-[#C5A880] mt-0.5">
                    {isUserOwnsThisApt ? 'Sổ Hồng Riêng' : isAdmin ? 'Đã Kích Hoạt' : `${currentApartment.priceBillion.toFixed(2)} Tỷ`}
                  </div>
                  <div className="text-[10px] text-gray-400 font-mono">
                    {isUserOwnsThisApt ? 'Sở Hữu Lâu Dài' : `~ ${(currentApartment.priceBillion * 1000 / currentApartment.area).toFixed(1)} tr/m²`}
                  </div>
                </div>
              </div>

              {/* LƯỚI 4 THÔNG SỐ CHÍNH */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className={`p-3 rounded-none ${
                  isDark ? 'bg-[#121824] border border-[#1E293B]' : 'bg-slate-50 border border-gray-200'
                }`}>
                  <div className="text-[10px] text-gray-400 font-mono uppercase">Diện Tích Thông Thủy</div>
                  <div className={`font-mono text-base sm:text-lg font-bold mt-0.5 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {currentApartment.area} m²
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">Tim tường: {currentApartment.wallArea} m²</div>
                </div>

                <div className={`p-3 rounded-none ${
                  isDark ? 'bg-[#121824] border border-[#1E293B]' : 'bg-slate-50 border border-gray-200'
                }`}>
                  <div className="text-[10px] text-gray-400 font-mono uppercase">Hướng Ban Công</div>
                  <div className="font-mono text-base sm:text-lg font-bold text-emerald-500 mt-0.5">
                    {currentApartment.direction}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">Đón gió mát tự nhiên</div>
                </div>

                <div className={`p-3 rounded-none ${
                  isDark ? 'bg-[#121824] border border-[#1E293B]' : 'bg-slate-50 border border-gray-200'
                }`}>
                  <div className="text-[10px] text-gray-400 font-mono uppercase">Cơ Cấu Phòng</div>
                  <div className={`font-mono text-base sm:text-lg font-bold mt-0.5 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {currentApartment.bedrooms} PN • {currentApartment.bathrooms} WC
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    {currentApartment.category === 'DUPLEX' ? '2 Tầng Thông Suốt' : 'Ban công & logia riêng'}
                  </div>
                </div>

                <div className={`p-3 rounded-none ${
                  isDark ? 'bg-[#121824] border border-[#1E293B]' : 'bg-slate-50 border border-gray-200'
                }`}>
                  <div className="text-[10px] text-gray-400 font-mono uppercase">Pháp Lý &amp; Vận Hành</div>
                  <div className={`font-mono text-base sm:text-lg font-bold mt-0.5 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    Sổ Hồng Lâu Dài
                  </div>
                  <div className="text-[10px] text-[#C5A880] mt-0.5 font-medium">
                    {isUserOwnsThisApt ? 'Phí QL: 12.500 đ/m²' : currentApartment.statusLabel}
                  </div>
                </div>
              </div>

              {/* TIÊU CHUẨN KHÔNG GIAN BÀN GIAO */}
              <div className={`space-y-2 pt-2 border-t ${isDark ? 'border-[#1E293B]' : 'border-gray-200'}`}>
                <div className="text-[10.5px] font-mono uppercase text-gray-400 tracking-wider">
                  Đặc Trưng Kiến Trúc &amp; Công Nghệ
                </div>
                <ul className={`space-y-2 text-xs font-light ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {currentApartment.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-[#C5A880] shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* ========================================================= */}
            {/* 4. KHU VỰC HÀNH ĐỘNG MINH BẠCH - HOÀN TOÀN THEO TỪNG VAI TRÒ */}
            {/* ========================================================= */}
            <div className={`pt-4 border-t mt-auto ${isDark ? 'border-[#1E293B]' : 'border-gray-200'}`}>
              {/* TRƯỜNG HỢP 1: CƯ DÂN ĐANG XEM ĐÚNG CĂN HỘ CỦA MÌNH */}
              {isUserOwnsThisApt && (
                <div className="space-y-2.5">
                  <Link
                    href="/portal?tab=resident-home"
                    className="w-full py-3.5 bg-[#C5A880] hover:bg-[#D4AF37] text-[#0A0E17] font-bold text-xs tracking-wider uppercase rounded-none transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    <Home className="w-4 h-4" />
                    <span>Vào Bảng Điều Khiển Căn Hộ Của Bạn</span>
                  </Link>

                  <div className="grid grid-cols-3 gap-2">
                    <Link
                      href="/portal?tab=resident-billing"
                      className={`py-2 px-2 border text-center text-[11px] font-semibold rounded-none transition-colors flex flex-col items-center justify-center gap-1 ${
                        isDark ? 'bg-[#121824] hover:bg-[#1A2232] border-[#2A374A] text-gray-200 hover:text-[#C5A880]' : 'bg-slate-50 hover:bg-slate-100 border-gray-200 text-gray-800'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5 text-[#C5A880]" />
                      <span>Hóa Đơn Căn</span>
                    </Link>
                    <Link
                      href="/portal?tab=resident-visitor"
                      className={`py-2 px-2 border text-center text-[11px] font-semibold rounded-none transition-colors flex flex-col items-center justify-center gap-1 ${
                        isDark ? 'bg-[#121824] hover:bg-[#1A2232] border-[#2A374A] text-gray-200 hover:text-[#C5A880]' : 'bg-slate-50 hover:bg-slate-100 border-gray-200 text-gray-800'
                      }`}
                    >
                      <UserPlus className="w-3.5 h-3.5 text-[#C5A880]" />
                      <span>Cấp Thẻ Khách</span>
                    </Link>
                    <Link
                      href="/portal?tab=resident-request"
                      className={`py-2 px-2 border text-center text-[11px] font-semibold rounded-none transition-colors flex flex-col items-center justify-center gap-1 ${
                        isDark ? 'bg-[#121824] hover:bg-[#1A2232] border-[#2A374A] text-gray-200 hover:text-[#C5A880]' : 'bg-slate-50 hover:bg-slate-100 border-gray-200 text-gray-800'
                      }`}
                    >
                      <Wrench className="w-3.5 h-3.5 text-[#C5A880]" />
                      <span>Báo Kỹ Thuật</span>
                    </Link>
                  </div>
                </div>
              )}

              {/* TRƯỜNG HỢP 2: CƯ DÂN ĐANG THAM KHẢO DÒNG CĂN KHÁC */}
              {isOwnerOrResident && !isUserOwnsThisApt && (
                <div className="space-y-2">
                  {userAptCategory && (
                    <button
                      type="button"
                      onClick={() => handleSelectCategory(userAptCategory)}
                      className="w-full py-3 bg-[#C5A880] hover:bg-[#D4AF37] text-[#0A0E17] font-bold text-xs tracking-wider uppercase rounded-none transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Crown className="w-4 h-4" />
                      <span>Quay Về Căn Hộ Của Tôi ({currentUser?.apartment_code || 'CH-06'})</span>
                    </button>
                  )}
                  <Link
                    href="/portal?tab=resident-home"
                    className={`w-full py-2.5 border text-xs font-semibold tracking-wider uppercase rounded-none transition-all flex items-center justify-center gap-2 ${
                      isDark
                        ? 'bg-[#121824] hover:bg-[#1A2232] border-[#2A374A] text-gray-300 hover:text-white'
                        : 'bg-slate-100 hover:bg-slate-200 border-gray-300 text-gray-800'
                    }`}
                  >
                    <Home className="w-3.5 h-3.5 text-[#C5A880]" />
                    <span>Vào Bảng Điều Khiển Căn Hộ Của Bạn</span>
                  </Link>
                </div>
              )}

              {/* TRƯỜNG HỢP 3: QUẢN TRỊ VIÊN BAN QUẢN LÝ */}
              {isAdmin && (
                <div className="space-y-2">
                  <Link
                    href="/portal?tab=admin-building"
                    className="w-full py-3.5 bg-[#C5A880] hover:bg-[#D4AF37] text-[#0A0E17] font-bold text-xs tracking-wider uppercase rounded-none transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    <Building className="w-4 h-4" />
                    <span>Quản Lý Căn Hộ &amp; Cư Dân (Portal BQL)</span>
                  </Link>

                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href="/portal?tab=admin-visitor"
                      className={`py-2 px-2 border text-center text-xs font-semibold rounded-none transition-colors flex items-center justify-center gap-1.5 ${
                        isDark ? 'bg-[#121824] hover:bg-[#1A2232] border-[#2A374A] text-gray-200 hover:text-white' : 'bg-slate-50 hover:bg-slate-100 border-gray-200 text-gray-800'
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5 text-[#C5A880]" />
                      <span>Kiểm Soát Thẻ Khách</span>
                    </Link>
                    <Link
                      href="/portal?tab=admin-billing"
                      className={`py-2 px-2 border text-center text-xs font-semibold rounded-none transition-colors flex items-center justify-center gap-1.5 ${
                        isDark ? 'bg-[#121824] hover:bg-[#1A2232] border-[#2A374A] text-gray-200 hover:text-white' : 'bg-slate-50 hover:bg-slate-100 border-gray-200 text-gray-800'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5 text-[#C5A880]" />
                      <span>Thu Phí &amp; Hóa Đơn</span>
                    </Link>
                  </div>
                </div>
              )}

              {/* TRƯỜNG HỢP 4: KỸ THUẬT VIÊN VẬN HÀNH */}
              {isTechnician && (
                <div className="space-y-2">
                  <Link
                    href="/portal?tab=admin-kanban"
                    className="w-full py-3.5 bg-[#C5A880] hover:bg-[#D4AF37] text-[#0A0E17] font-bold text-xs tracking-wider uppercase rounded-none transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    <Wrench className="w-4 h-4" />
                    <span>Bảng Việc Kỹ Thuật (Kanban)</span>
                  </Link>
                  <Link
                    href="/portal?tab=admin-dashboard"
                    className={`w-full py-2.5 border text-xs font-semibold tracking-wider uppercase rounded-none transition-all flex items-center justify-center gap-2 ${
                      isDark
                        ? 'bg-[#121824] hover:bg-[#1A2232] border-[#2A374A] text-gray-300 hover:text-white'
                        : 'bg-slate-100 hover:bg-slate-200 border-gray-300 text-gray-800'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 text-[#C5A880]" />
                    <span>Xem Giám Sát Cơ Điện Chung Cư</span>
                  </Link>
                </div>
              )}

              {/* TRƯỜNG HỢP 5: KHÁCH VÃNG LAI (CHƯA ĐĂNG NHẬP) - MINH BẠCH, TRỰC TIẾP */}
              {!isAuthenticated && (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenLogin) {
                        onOpenLogin();
                      } else {
                        window.location.href = '/portal';
                      }
                    }}
                    className="w-full py-3.5 bg-[#C5A880] hover:bg-[#D4AF37] text-[#0A0E17] font-bold text-xs tracking-wider uppercase rounded-none transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Đăng Nhập Cư Dân / BQL Để Quản Lý</span>
                  </button>

                  <a
                    href="tel:0364967082"
                    className={`w-full py-2.5 border text-xs font-semibold tracking-wider uppercase rounded-none transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      isDark
                        ? 'bg-[#121824] hover:bg-[#1A2232] border-[#2A374A] hover:border-[#C5A880]/60 text-gray-300 hover:text-white'
                        : 'bg-slate-100 hover:bg-slate-200 border-gray-300 hover:border-[#C5A880] text-gray-800'
                    }`}
                  >
                    <Phone className="w-3.5 h-3.5 text-[#C5A880]" />
                    <span>Hotline Ban Quản Lý: 0364 967 082</span>
                  </a>

                  <div className={`p-2.5 border rounded-none text-[11px] leading-relaxed flex items-start gap-2 ${
                    isDark ? 'bg-[#0A0E17] border-[#1E293B] text-gray-400' : 'bg-slate-50 border-gray-200 text-gray-600'
                  }`}>
                    <Info className="w-4 h-4 text-[#C5A880] shrink-0 mt-0.5" />
                    <span>Tiếp đón trực tiếp tại <strong>Sảnh The Tropical • Chung Cư BS-07</strong> (08:00 - 20:00). Minh bạch hồ sơ pháp lý, không qua trung gian.</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
