'use client';

import React, { useState, useMemo } from 'react';
import { 
  Box, 
  Layers, 
  Eye, 
  PhoneCall, 
  Sparkles, 
  Check, 
  X, 
  CheckCircle2, 
  Compass, 
  Wind, 
  Sun, 
  ShieldCheck, 
  Maximize2,
  BedDouble,
  Bath,
  ArrowRight,
  Info,
  Calendar,
  Clock,
  MapPin,
  Users
} from 'lucide-react';

interface FloorPlanExplorerProps {
  onOpenLogin?: () => void;
}

export type ApartmentCategory = '2PN' | '3PN' | '1PN' | 'DUPLEX';

export interface RoomHotspot {
  id: string;
  code: string;
  name: string;
  label: string; // Tên hiển thị trực tiếp trên ảnh phối cảnh
  area: string;
  desc: string;
  top: number;   // Vị trí Y%
  left: number;  // Vị trí X%
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

const APARTMENT_MODELS: Record<ApartmentCategory, ApartmentData> = {
  '2PN': {
    category: '2PN',
    code: '12A05',
    name: 'Căn Hộ 2PN Tiêu Chuẩn',
    subtitle: 'Căn mẫu thực tế cư dân • Bố cục bóc mái 3D view trực diện Sông Sài Gòn',
    floorText: 'Tầng 12A • Tháp A (Chung Cư Skyline)',
    area: 78.5,
    wallArea: 83.2,
    bedrooms: 2,
    bathrooms: 2,
    direction: 'Đông Nam',
    viewDesc: 'Trực diện Sông Sài Gòn (Đón trọn bình minh & gió sông mát lành)',
    priceBillion: 4.85,
    statusLabel: 'Đã Bàn Giao Cư Dân',
    isRealResident: true,
    residentName: 'Nguyễn Hữu Lực (Chủ hộ)',
    render3DUrl: '/floorplans/2pn-3d.jpg',
    features: [
      'Căn góc 2 mặt thoáng view sông, ban công kính tràn viền kết nối trực tiếp phòng khách',
      'Phòng ngủ Master khép kín có WC riêng biệt và tủ quần áo âm tường',
      'Bếp đảo mở ốp đá Marble trắng Calacatta, bàn ăn 6 người sang trọng'
    ],
    hotspots: [
      {
        id: 'living',
        code: 'PK',
        name: 'Đại Sảnh & Phòng Khách',
        label: 'Phòng Khách & Ăn',
        area: '22.0 m²',
        desc: 'Sofa góc bọc nỉ cao cấp, Smart TV gắn tường và sàn gỗ chevron nhập khẩu Đức.',
        top: 46,
        left: 42
      },
      {
        id: 'balcony',
        code: 'BC',
        name: 'Ban Công Panorama Kính Low-E',
        label: 'Ban Công View Sông',
        area: '5.5 m²',
        desc: 'Sàn gỗ nhựa ngoài trời, lan can kính cường lực đón trọn gió sông Sài Gòn.',
        top: 76,
        left: 35
      },
      {
        id: 'kitchen',
        code: 'BẾP',
        name: 'Bếp Đảo & Quầy Bar',
        label: 'Bếp Đảo & Bar',
        area: '12.0 m²',
        desc: 'Mặt đá Marble vân mây, bếp từ đôi Hafele âm trần và quầy bar ăn sáng.',
        top: 32,
        left: 60
      },
      {
        id: 'masterBed',
        code: 'PN 1',
        name: 'Phòng Ngủ Master',
        label: 'Phòng Ngủ Master',
        area: '21.0 m²',
        desc: 'Giường King size, vách ốp đầu giường da cao cấp, cửa sổ lớn view sông.',
        top: 52,
        left: 23
      },
      {
        id: 'secondBed',
        code: 'PN 2',
        name: 'Phòng Ngủ Số 2',
        label: 'Phòng Ngủ Số 2',
        area: '11.5 m²',
        desc: 'Không gian riêng tư cho con hoặc khách, đầy đủ bàn làm việc và tủ áo.',
        top: 72,
        left: 70
      },
      {
        id: 'bath',
        code: 'WC',
        name: 'Phòng Tắm & WC Master',
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
    code: '24A01',
    name: 'Căn Hộ 3PN Sky Suite',
    subtitle: 'Phân khu áp mái cao cấp • Căn góc 2 mặt thoáng view triệu đô',
    floorText: 'Tầng 24 (Áp Mái) • Tháp A (Chung Cư Skyline)',
    area: 112.0,
    wallArea: 119.5,
    bedrooms: 3,
    bathrooms: 3,
    direction: 'Đông Nam & Tây Nam',
    viewDesc: 'View sông Sài Gòn & Bán đảo Nam Sài Gòn lung linh',
    priceBillion: 8.50,
    statusLabel: 'Sẵn Sàng Bàn Giao',
    render3DUrl: '/floorplans/3pn-3d.jpg',
    features: [
      'Căn góc VIP tầng áp mái, ban công góc kép 270° ngắm toàn cảnh thành phố',
      'Đại sảnh phòng khách nối liền bàn tiệc 8 chỗ và khu bếp đảo phong cách Ý',
      '3 Phòng ngủ biệt lập có cửa sổ kính Low-E kịch trần cản 99% tia UV'
    ],
    hotspots: [
      {
        id: 'living',
        code: 'PK',
        name: 'Đại Phòng Khách Lớn',
        label: 'Đại Phòng Khách',
        area: '32.0 m²',
        desc: 'Sofa cong nghệ thuật, bàn trà đôi mặt đá và hệ thống đèn LED âm trần dịu mắt.',
        top: 54,
        left: 33
      },
      {
        id: 'balcony',
        code: 'BC',
        name: 'Ban Công Góc Kép 270°',
        label: 'Ban Công Góc 270°',
        area: '7.2 m²',
        desc: 'Kính Low-E tràn viền ngắm toàn cảnh thành phố và khúc sông uốn lượn.',
        top: 24,
        left: 30
      },
      {
        id: 'kitchen',
        code: 'BẾP',
        name: 'Khu Bếp Đảo Bar & Bàn Tiệc',
        label: 'Bếp Đảo & Bàn Tiệc',
        area: '14.0 m²',
        desc: 'Tủ rượu âm tường, bếp đảo đá tự nhiên và bàn ăn 8 người đẳng cấp.',
        top: 32,
        left: 56
      },
      {
        id: 'masterSuite',
        code: 'PN 1',
        name: 'Master Presidential Suite',
        label: 'Master Presidential Suite',
        area: '26.0 m²',
        desc: 'Phòng ngủ tổng thống có góc thay đồ walk-in closet và view ngắm hoàng hôn.',
        top: 40,
        left: 78
      },
      {
        id: 'bed2',
        code: 'PN 2',
        name: 'Phòng Ngủ Số 2 Ensuite',
        label: 'Phòng Ngủ Số 2',
        area: '14.5 m²',
        desc: 'Phòng ngủ lớn cho ông bà hoặc con lớn, giường Queen và WC khép kín.',
        top: 53,
        left: 85
      },
      {
        id: 'bed3',
        code: 'PN 3',
        name: 'Phòng Ngủ Số 3 / Studio',
        label: 'Phòng Ngủ 3 / Studio',
        area: '11.5 m²',
        desc: 'Bàn làm việc cạnh cửa sổ lớn, sofa bed thư giãn hoặc phòng làm việc riêng.',
        top: 78,
        left: 52
      }
    ]
  },
  '1PN': {
    category: '1PN',
    code: '12A02',
    name: 'Căn Hộ 1PN Thông Minh',
    subtitle: 'Tối ưu hóa không gian sống cho chuyên gia trẻ & người độc thân',
    floorText: 'Tầng 12A • Tháp A (Chung Cư Skyline)',
    area: 52.0,
    wallArea: 56.5,
    bedrooms: 1,
    bathrooms: 1,
    direction: 'Chính Nam',
    viewDesc: 'View công viên nội khu & hồ cảnh quan',
    priceBillion: 3.35,
    statusLabel: 'Sẵn Sàng Bàn Giao',
    render3DUrl: '/floorplans/1pn-3d.jpg',
    features: [
      'Bố cục vuông vức không góc chết, tối ưu 100% diện tích sử dụng',
      'Ban công gỗ teak kết nối trực tiếp phòng khách đón ánh sáng tự nhiên',
      'Bàn giao đầy đủ tủ bếp, bếp điện từ âm và thiết bị vệ sinh cao cấp'
    ],
    hotspots: [
      {
        id: 'living',
        code: 'PK',
        name: 'Phòng Khách & Ăn',
        label: 'Phòng Khách & Ăn',
        area: '22.7 m²',
        desc: 'Phòng khách thông liền ban công gỗ, TV âm tường và bàn ăn 2-4 người.',
        top: 66,
        left: 58
      },
      {
        id: 'balcony',
        code: 'BC',
        name: 'Ban Công Gỗ Teak Tự Nhiên',
        label: 'Ban Công Gỗ Teak',
        area: '4.2 m²',
        desc: 'Không gian thư giãn thưởng trà ngắm cảnh sân vườn nội khu.',
        top: 68,
        left: 23
      },
      {
        id: 'bed',
        code: 'PN',
        name: 'Phòng Ngủ Master',
        label: 'Phòng Ngủ Master',
        area: '15.2 m²',
        desc: 'Giường nệm êm ái, tủ áo kính trượt và cửa sổ thoáng đãng đón sáng.',
        top: 48,
        left: 31
      },
      {
        id: 'kitchen',
        code: 'BẾP',
        name: 'Bếp Đảo & Khu Giặt',
        label: 'Bếp Đảo & Khu Giặt',
        area: '9.6 m²',
        desc: 'Khu vực bếp âm hiện đại, quầy bar nhỏ và góc máy giặt tiện lợi.',
        top: 28,
        left: 58
      },
      {
        id: 'bath',
        code: 'WC',
        name: 'Phòng Tắm & WC',
        label: 'Phòng Tắm WC',
        area: '4.5 m²',
        desc: 'Vách kính cường lực, gương LED cảm ứng và lavabo sứ Kohler.',
        top: 30,
        left: 40
      }
    ]
  },
  'DUPLEX': {
    category: 'DUPLEX',
    code: '25PH-01',
    name: 'Duplex Penthouse Hoàng Gia',
    subtitle: 'Tuyệt tác thông 2 tầng đỉnh tháp Tầng 25 • Trần cao 6.5m & Hồ Jacuzzi',
    floorText: 'Tầng 25 (Đỉnh Tháp) • Tháp A (Chung Cư Skyline)',
    area: 215.0,
    wallArea: 232.0,
    bedrooms: 4,
    bathrooms: 4,
    direction: 'Đông Nam & Tây Nam (270°)',
    viewDesc: 'Tầm nhìn triệu đô ôm trọn Sông Sài Gòn & Landmark 81',
    priceBillion: 18.50,
    statusLabel: 'Tuyệt Phẩm Độc Bản',
    render3DUrl: '/floorplans/duplex-3d.jpg',
    features: [
      'Thiết kế 2 tầng thông suốt với trần phòng khách Double-Height cao 6.5m',
      'Sky Terrace sân thượng có bồn sục Jacuzzi nước ấm ngoài trời ngắm thành phố',
      'Cầu thang kính nổi liên tầng, hầm rượu vang và sảnh tiệc 12 chỗ'
    ],
    hotspots: [
      {
        id: 'jacuzzi',
        code: 'JACUZZI',
        name: 'Sky Terrace & Bể Sục Jacuzzi',
        label: 'Bể Sục Jacuzzi Ngoài Trời',
        area: '26.0 m²',
        desc: 'Sân thượng ngắm trọn thành phố từ độ cao 100m, hồ sục Jacuzzi thư giãn.',
        top: 70,
        left: 20
      },
      {
        id: 'doubleLiving',
        code: 'TRẦN 6.5M',
        name: 'Grand Living Thông Tầng',
        label: 'Grand Living Trần 6.5m',
        area: '58.0 m²',
        desc: 'Phòng khách thông 2 tầng trần cao 6.5m, đèn chùm pha lê và lò sưởi nghệ thuật.',
        top: 66,
        left: 43
      },
      {
        id: 'stair',
        code: 'THANG KÍNH',
        name: 'Cầu Thang Kính Nổi Liên Tầng',
        label: 'Cầu Thang Kính Nổi',
        area: 'Liên tầng',
        desc: 'Cầu thang kết cấu kính cường lực và gỗ sồi nối liền 2 sàn penthouse.',
        top: 45,
        left: 55
      },
      {
        id: 'presidentialSuite',
        code: 'TẦNG 2 VIP',
        name: 'Presidential Suite (Tầng 2)',
        label: 'Presidential Suite (Tầng 2)',
        area: '45.0 m²',
        desc: 'Phòng ngủ tổng thống tầng trên có phòng thay đồ walk-in và view sông đêm.',
        top: 25,
        left: 36
      },
      {
        id: 'vipBed2',
        code: 'PN 2 LẦU',
        name: 'Phòng Ngủ VIP Tầng Trên',
        label: 'Phòng VIP Tầng Trên',
        area: '22.0 m²',
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

export interface TourTimeSlot {
  id: string;
  time: string;
  period: 'Sáng' | 'Trưa' | 'Chiều' | 'Hoàng Hôn' | 'Tối';
  tag: string;
  popular?: boolean;
}

export const TOUR_TIME_SLOTS: TourTimeSlot[] = [
  { id: 'morning_1', time: '09:00 - 10:00', period: 'Sáng', tag: 'Đón nắng mai & gió sông' },
  { id: 'morning_2', time: '10:30 - 11:30', period: 'Trưa', tag: 'Tham quan tiện ích tầng 5' },
  { id: 'afternoon_1', time: '14:30 - 15:30', period: 'Chiều', tag: 'Trải nghiệm Smart Home' },
  { id: 'afternoon_2', time: '16:00 - 17:00', period: 'Chiều', tag: 'Căn hộ thực tế cư dân' },
  { id: 'sunset', time: '17:30 - 18:30', period: 'Hoàng Hôn', tag: 'Ngắm hoàng hôn sông Sài Gòn', popular: true },
  { id: 'evening', time: '19:00 - 20:00', period: 'Tối', tag: 'Skyline về đêm lung linh', popular: true },
];

export function getTourDateOptions() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  const fmt = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;

  return [
    { id: 'today', label: `Hôm nay (${fmt(now)})`, fullText: `Hôm nay - ${fmt(now)}` },
    { id: 'tomorrow', label: `Ngày mai (${fmt(tomorrow)})`, fullText: `Ngày mai - ${fmt(tomorrow)}` },
    { id: 'weekend', label: 'Cuối tuần này', fullText: 'Cuối tuần này (Thứ 7 / CN)' },
    { id: 'custom', label: 'Chọn ngày khác...', fullText: 'Ngày tùy chọn' },
  ];
}

export default function FloorPlanExplorer({ onOpenLogin }: FloorPlanExplorerProps) {
  const [selectedCategory, setSelectedCategory] = useState<ApartmentCategory>('2PN');
  const [activeHotspotId, setActiveHotspotId] = useState<string>('living');
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [leadForm, setLeadForm] = useState({
    name: '',
    phone: '',
    dateOption: 'tomorrow',
    customDate: '',
    timeSlot: '17:30 - 18:30',
    guests: '1-2 người'
  });
  const [confirmedBooking, setConfirmedBooking] = useState<{
    name: string;
    phone: string;
    apartmentCode: string;
    apartmentName: string;
    dateText: string;
    timeSlot: string;
    guests: string;
  } | null>(null);

  const currentApartment = APARTMENT_MODELS[selectedCategory];

  // Phòng đang được chọn qua hotspot
  const activeRoom = useMemo(() => {
    return currentApartment.hotspots.find(h => h.id === activeHotspotId) || currentApartment.hotspots[0];
  }, [currentApartment, activeHotspotId]);

  // Đổi loại căn hộ thì tự động chọn hotspot đầu tiên
  const handleSelectCategory = (cat: ApartmentCategory) => {
    setSelectedCategory(cat);
    const newApt = APARTMENT_MODELS[cat];
    setActiveHotspotId(newApt.hotspots[0].id);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dateOptions = getTourDateOptions();
    let dateText = 'Ngày mai';
    if (leadForm.dateOption === 'today') {
      dateText = dateOptions[0]?.fullText || 'Hôm nay';
    } else if (leadForm.dateOption === 'tomorrow') {
      dateText = dateOptions[1]?.fullText || 'Ngày mai';
    } else if (leadForm.dateOption === 'weekend') {
      dateText = dateOptions[2]?.fullText || 'Cuối tuần này';
    } else if (leadForm.dateOption === 'custom' && leadForm.customDate) {
      dateText = leadForm.customDate;
    }

    const booking = {
      name: leadForm.name,
      phone: leadForm.phone,
      apartmentCode: currentApartment.code,
      apartmentName: currentApartment.name,
      dateText,
      timeSlot: leadForm.timeSlot,
      guests: leadForm.guests
    };

    try {
      const existing = JSON.parse(localStorage.getItem('skyline_tour_bookings') || '[]');
      existing.unshift({ ...booking, createdAt: new Date().toISOString() });
      localStorage.setItem('skyline_tour_bookings', JSON.stringify(existing.slice(0, 20)));
    } catch {
      // ignore
    }

    setConfirmedBooking(booking);
    setRegisterSuccess(true);
  };

  return (
    <section id="floorplans" className="py-12 sm:py-20 bg-[#0A0E17] text-white border-b border-[#1E293B] relative overflow-hidden select-none">
      {/* Background glow tinh tế */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-[#C5A880]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-blue-900/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 space-y-8 sm:space-y-10">
        {/* ============================================================= */}
        {/* 1. TIÊU ĐỀ RÕ RÀNG, TINH TẾ, DỄ HIỂU                          */}
        {/* ============================================================= */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#1E293B]">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#161F2E] border border-[#C5A880]/40 rounded text-[11px] font-mono uppercase tracking-[0.2em] text-[#C5A880]">
              <Box className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>Phối Cảnh Bóc Mái 3D Căn Hộ Skyline</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif text-white font-bold tracking-tight">
              Sơ Đồ Không Gian 3D Căn Hộ
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 font-light leading-relaxed">
              Mỗi dòng căn hộ sở hữu thiết kế hình khối bóc mái chân thực. Click vào nhãn các phòng trên ảnh 3D để xem chi tiết công năng.
            </p>
          </div>

          <button
            onClick={() => setIsRegisterOpen(true)}
            className="px-4 py-2.5 bg-[#C5A880] hover:bg-[#D4AF37] text-[#0A0E17] font-bold text-xs tracking-wider uppercase rounded transition-all shadow-lg flex items-center gap-2 shrink-0 self-start md:self-auto"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Đăng Ký Xem Thực Tế</span>
          </button>
        </div>

        {/* ============================================================= */}
        {/* 2. BỘ CHỌN 4 LOẠI CĂN HỘ                                      */}
        {/* ============================================================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          {(['2PN', '3PN', '1PN', 'DUPLEX'] as ApartmentCategory[]).map((cat) => {
            const apt = APARTMENT_MODELS[cat];
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => handleSelectCategory(cat)}
                className={`p-3 sm:p-4 rounded-lg border text-left transition-all relative flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#151D29] border-[#C5A880] shadow-xl ring-1 ring-[#C5A880]/70'
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
                      {cat === 'DUPLEX' ? '2 Tầng Thông Suốt' : `${apt.bedrooms} PN • ${apt.bathrooms} WC`}
                    </span>
                  </div>
                  <div className="font-serif text-sm font-bold text-[#C5A880] mt-0.5">
                    {apt.name} ({apt.area} m²)
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-[#1E293B] flex items-center justify-between text-[11px] text-gray-400 font-mono">
                  <span>{cat === 'DUPLEX' ? 'Trần cao 6.5m' : `${apt.wallArea} m² tim tường`}</span>
                  <span className="text-white font-semibold">{apt.priceBillion.toFixed(2)} Tỷ</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* ============================================================= */}
        {/* 3. KHU VỰC HIỂN THỊ PHỐI CẢNH 3D & THÔNG SỐ CÂN ĐỐI 100%       */}
        {/* ============================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          {/* CỘT TRÁI (7 CỘT): KHUNG PHỐI CẢNH 3D UNIFIED CARD - CÂN BẰNG HOÀN TOÀN */}
          <div className="lg:col-span-7 flex flex-col justify-between h-full border border-[#C5A880]/40 bg-[#0E131C] rounded-xl overflow-hidden shadow-2xl">
            {/* Header thanh chỉ báo */}
            <div className="p-3 sm:p-3.5 bg-[#121824] border-b border-[#1E293B] flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold text-gray-300 truncate">
                <span className="w-2 h-2 rounded-full bg-[#C5A880] animate-pulse" />
                <span className="truncate">{currentApartment.subtitle}</span>
              </div>
              <div className="text-[10px] font-mono text-[#C5A880] bg-[#070A10] border border-[#1E293B] px-2.5 py-0.5 rounded shrink-0">
                Click nhãn phòng để xem
              </div>
            </div>

            {/* KHUNG ẢNH 3D ISOMETRIC CUTAWAY (flex-1 để tự co giãn vừa khít độ cao cột phải) */}
            <div className="relative flex-1 min-h-[360px] sm:min-h-[420px] md:min-h-[460px] bg-[#05070A] overflow-hidden group">
              <img
                src={currentApartment.render3DUrl}
                alt={currentApartment.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />

              {/* Gradient che phủ viền tinh tế */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E17]/80 via-transparent to-transparent pointer-events-none" />

              {/* Hướng ban công góc trên bên trái */}
              <div className="absolute top-3 left-3 bg-[#0A0E17]/90 border border-[#1E293B] px-3 py-1.5 rounded-lg text-xs font-mono text-gray-300 flex items-center gap-2 backdrop-blur-md z-10 shadow-lg">
                <Compass className="w-4 h-4 text-[#C5A880]" />
                <span>Ban công: <strong className="text-emerald-400">{currentApartment.direction}</strong></span>
              </div>

              {/* Trạng thái căn hộ góc trên bên phải */}
              <div className="absolute top-3 right-3 bg-[#0A0E17]/90 border border-emerald-500/50 px-3 py-1.5 rounded-lg text-xs font-mono text-emerald-300 flex items-center gap-1.5 backdrop-blur-md z-10 shadow-lg">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{currentApartment.statusLabel}</span>
              </div>

              {/* NHÃN PHÒNG VIẾT RÕ RÀNG TRÊN PHỐI CẢNH: MẶC ĐỊNH LÀM MỜ, CLICK VÀO THÌ SÁNG RÕ RA */}
              {currentApartment.hotspots.map((spot) => {
                const isActive = activeHotspotId === spot.id;
                return (
                  <button
                    key={spot.id}
                    type="button"
                    onClick={() => setActiveHotspotId(spot.id)}
                    className={`absolute z-20 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 group/pin focus:outline-none flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs cursor-pointer ${
                      isActive
                        ? 'bg-[#0E131C] text-white border-2 border-[#C5A880] shadow-[0_0_25px_rgba(197,168,128,0.8)] scale-110 opacity-100 z-30 font-bold ring-2 ring-[#C5A880]/50'
                        : 'bg-black/60 text-gray-300 border border-white/20 backdrop-blur-md opacity-60 hover:opacity-100 hover:border-white/60 hover:scale-105'
                    }`}
                    style={{ top: `${spot.top}%`, left: `${spot.left}%` }}
                  >
                    {/* Chấm tròn nhỏ phát sáng */}
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 transition-colors ${
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
                <div className="bg-[#0A0E17]/90 border border-[#C5A880]/60 px-3 py-1.5 rounded backdrop-blur-md">
                  <span className="text-[10px] font-mono uppercase text-[#C5A880] font-semibold block">Tầm nhìn thực tế:</span>
                  <span className="text-white font-medium">{currentApartment.viewDesc}</span>
                </div>
                <div className="bg-[#0A0E17]/90 border border-gray-700 px-3 py-1.5 rounded backdrop-blur-md text-gray-300 font-mono text-xs hidden sm:block">
                  Mô hình bóc mái 3D
                </div>
              </div>
            </div>

            {/* THANH THÔNG TIN PHÒNG ĐANG CHỌN (GẮN LIỀN VÀO ĐÁY KHUNG 3D, CÂN BẰNG HOÀN TOÀN) */}
            <div className="p-3.5 sm:p-4 bg-[#121824] border-t border-[#1E293B] flex items-center justify-between gap-3 text-xs shrink-0">
              <div className="flex items-center gap-3 truncate">
                <div className="w-9 h-9 rounded-lg bg-[#C5A880]/20 border border-[#C5A880] text-[#C5A880] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  {activeRoom.code}
                </div>
                <div className="truncate">
                  <div className="font-bold text-white font-serif text-sm flex items-center gap-2">
                    <span>{activeRoom.name}</span>
                    <span className="text-[#C5A880] font-mono text-xs font-semibold">({activeRoom.area})</span>
                  </div>
                  <div className="text-gray-300 text-[11px] font-light truncate mt-0.5">
                    {activeRoom.desc}
                  </div>
                </div>
              </div>

              <div className="text-[10px] font-mono text-emerald-400 shrink-0 bg-emerald-950/60 border border-emerald-500/40 px-2 py-1 rounded">
                ✓ Đang Xem
              </div>
            </div>
          </div>

          {/* CỘT PHẢI (5 CỘT): BÁO GIÁ, THÔNG SỐ VÀNG & NÚT HÀNH ĐỘNG (ĐỒNG BỘ CHIỀU CAO) */}
          <div className="lg:col-span-5 flex flex-col justify-between h-full p-5 sm:p-6 bg-[#0E131C] border border-[#C5A880]/50 rounded-xl shadow-2xl space-y-5">
            <div className="space-y-5">
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
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    {currentApartment.category === 'DUPLEX' ? '2 Tầng Thông Suốt' : 'Ban công + Logia riêng'}
                  </div>
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
                <ul className="space-y-2 text-xs text-gray-300 font-light">
                  {currentApartment.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-[#C5A880] shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 2 NÚT HÀNH ĐỘNG CHÍNH - DOCKED CÂN ĐỐI Ở ĐÁY KHUNG */}
            <div className="pt-4 border-t border-[#1E293B] space-y-2.5 mt-auto">
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

      {/* ============================================================= */}
      {/* MODAL ĐĂNG KÝ XEM NHÀ - CHỌN MỐC GIỜ THAM QUAN CHUYÊN NGHIỆP  */}
      {/* ============================================================= */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#0E131C] border border-[#C5A880]/60 rounded-2xl p-5 sm:p-7 max-w-lg w-full shadow-2xl relative my-auto">
            <button
              type="button"
              onClick={() => {
                setIsRegisterOpen(false);
                setRegisterSuccess(false);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Tiêu đề Modal */}
            <div className="space-y-1 mb-5 pr-8">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#161F2E] border border-[#C5A880]/40 rounded text-[10px] font-mono uppercase tracking-wider text-[#C5A880]">
                <Clock className="w-3 h-3 text-[#C5A880]" />
                <span>Đặt Lịch Tiếp Đón Trực Tiếp</span>
              </div>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-white">
                Tham Quan Căn Hộ {currentApartment.code}
              </h3>
              <p className="text-xs text-gray-400 font-light leading-relaxed">
                {currentApartment.name} • {currentApartment.area} m² • {currentApartment.floorText}
              </p>
            </div>

            {registerSuccess && confirmedBooking ? (
              /* MÀN HÌNH XÁC NHẬN THÀNH CÔNG */
              <div className="space-y-4">
                <div className="p-4 bg-emerald-950/40 border border-emerald-500/60 rounded-xl text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h4 className="font-serif text-base font-bold text-white">
                    Đăng Ký Tham Quan Thành Công!
                  </h4>
                  <p className="text-xs text-gray-300 font-light leading-relaxed">
                    Lễ tân và chuyên viên Ban Quản Lý Skyline đã tiếp nhận yêu cầu và sẽ sẵn sàng đón tiếp quý khách đúng khung giờ đã chọn.
                  </p>
                </div>

                {/* Thẻ tóm tắt thông tin lịch hẹn */}
                <div className="bg-[#121824] border border-[#1E293B] rounded-xl p-4 space-y-2.5 text-xs font-mono">
                  <div className="flex justify-between items-center pb-2 border-b border-[#1E293B]">
                    <span className="text-gray-400">Căn hộ mục tiêu:</span>
                    <span className="font-bold text-white">{confirmedBooking.apartmentCode} ({confirmedBooking.apartmentName})</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-[#1E293B]">
                    <span className="text-gray-400">Mốc giờ tham quan:</span>
                    <span className="font-bold text-[#C5A880] bg-[#C5A880]/15 px-2 py-0.5 rounded border border-[#C5A880]/40">
                      {confirmedBooking.timeSlot}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-[#1E293B]">
                    <span className="text-gray-400">Ngày tham quan:</span>
                    <span className="font-bold text-white">{confirmedBooking.dateText}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-[#1E293B]">
                    <span className="text-gray-400">Khách hẹn:</span>
                    <span className="text-gray-200">{confirmedBooking.name} • {confirmedBooking.phone} ({confirmedBooking.guests})</span>
                  </div>
                  <div className="flex items-start gap-2 pt-1 text-[11px] text-gray-400 font-sans leading-relaxed">
                    <MapPin className="w-4 h-4 text-[#C5A880] shrink-0 mt-0.5" />
                    <span><strong>Địa điểm đón tiếp:</strong> Sảnh Lễ Tân Tháp A, 128 Bến Vân Đồn, P.6, Q.4, TP.HCM (Hotline đón khách: 0901 888 999).</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegisterOpen(false);
                      setRegisterSuccess(false);
                    }}
                    className="w-full py-3 bg-[#C5A880] hover:bg-[#D4AF37] text-[#0A0E17] font-bold text-xs tracking-wider uppercase rounded-xl transition-all shadow-lg"
                  >
                    Hoàn Tất & Đóng
                  </button>
                </div>
              </div>
            ) : (
              /* FORM ĐĂNG KÝ VỚI BỘ CHỌN MỐC GIỜ THÔNG MINH */
              <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
                {/* 1. Họ tên và Số điện thoại */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-300 font-mono text-[11px] mb-1">
                      Họ và Tên (*):
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Nguyễn Hữu Lực"
                      value={leadForm.name}
                      onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                      className="w-full bg-[#121824] border border-[#1E293B] rounded-lg p-2.5 text-white focus:outline-none focus:border-[#C5A880] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 font-mono text-[11px] mb-1">
                      Số Điện Thoại (*):
                    </label>
                    <input
                      type="tel"
                      required
                      pattern="[0-9]{9,11}"
                      placeholder="Ví dụ: 0901 888 999"
                      value={leadForm.phone}
                      onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                      className="w-full bg-[#121824] border border-[#1E293B] rounded-lg p-2.5 text-white focus:outline-none focus:border-[#C5A880] transition-colors"
                    />
                  </div>
                </div>

                {/* 2. Chọn Ngày Tham Quan */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-gray-300 font-mono text-[11px]">
                    <Calendar className="w-3.5 h-3.5 text-[#C5A880]" />
                    <span>Ngày Quý Khách Muốn Tham Quan:</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {getTourDateOptions().map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setLeadForm({ ...leadForm, dateOption: opt.id })}
                        className={`py-2 px-2 text-center rounded-lg text-xs transition-all font-medium ${
                          leadForm.dateOption === opt.id
                            ? 'bg-[#C5A880] text-[#0A0E17] font-bold shadow-md'
                            : 'bg-[#121824] border border-[#1E293B] text-gray-300 hover:text-white hover:border-[#C5A880]/50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {leadForm.dateOption === 'custom' && (
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={leadForm.customDate}
                      onChange={(e) => setLeadForm({ ...leadForm, customDate: e.target.value })}
                      className="w-full bg-[#121824] border border-[#1E293B] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#C5A880] mt-1.5 transition-colors"
                    />
                  )}
                </div>

                {/* 3. CHỌN MỐC GIỜ THAM QUAN (THEO CÁC MỐC CHUẨN) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-gray-300 font-mono text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-[#C5A880]" />
                      <span>Chọn Mốc Giờ Đón Tiếp (*):</span>
                    </label>
                    <span className="text-[10px] font-mono text-[#C5A880]">60 phút / ca đón</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {TOUR_TIME_SLOTS.map((slot) => {
                      const isSelected = leadForm.timeSlot === slot.time;
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => setLeadForm({ ...leadForm, timeSlot: slot.time })}
                          className={`p-2.5 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-[#C5A880]/15 border-[#C5A880] ring-1 ring-[#C5A880] shadow-[0_0_15px_rgba(197,168,128,0.3)]'
                              : 'bg-[#121824] border-[#1E293B] hover:border-[#C5A880]/50 hover:bg-[#161F2E]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className={`text-[9.5px] font-mono uppercase px-1.5 py-0.5 rounded ${
                              isSelected
                                ? 'bg-[#C5A880] text-[#0A0E17] font-bold'
                                : 'bg-[#1E293B] text-gray-400'
                            }`}>
                              {slot.period}
                            </span>
                            {slot.popular && (
                              <span className="text-[9px] text-amber-400 font-mono">
                                ★ Hot
                              </span>
                            )}
                          </div>

                          <div className={`font-mono text-xs font-bold mt-1.5 ${
                            isSelected ? 'text-white' : 'text-gray-200'
                          }`}>
                            {slot.time}
                          </div>

                          <div className="text-[10px] text-gray-400 truncate mt-0.5">
                            {slot.tag}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Số lượng người tham quan */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-gray-300 font-mono text-[11px]">
                    <Users className="w-3.5 h-3.5 text-[#C5A880]" />
                    <span>Số Lượng Người Đi Cùng:</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['1 - 2 người', '3 - 4 người', 'Đoàn > 4 người'].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setLeadForm({ ...leadForm, guests: g })}
                        className={`py-2 px-1 text-center rounded-lg text-[11px] font-mono transition-all ${
                          leadForm.guests === g
                            ? 'bg-[#1E293B] border border-[#C5A880] text-[#C5A880] font-bold'
                            : 'bg-[#121824] border border-[#1E293B] text-gray-400 hover:text-white'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. Nút Xác Nhận Đặt Lịch */}
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3.5 bg-[#C5A880] hover:bg-[#D4AF37] text-[#0A0E17] font-bold text-xs tracking-wider uppercase rounded-xl transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>Xác Nhận Đặt Lịch Tham Quan ({leadForm.timeSlot})</span>
                  </button>
                  <div className="text-center text-[10px] text-gray-400 font-mono mt-2">
                    ✓ Miễn phí tham quan • Có xe đưa đón nội khu & đồ uống welcome
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
