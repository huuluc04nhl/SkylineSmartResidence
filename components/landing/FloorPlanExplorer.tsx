'use client';

import React, { useState, useMemo } from 'react';
import { 
  Box, 
  Layers, 
  Eye, 
  Compass, 
  Building2, 
  Sparkles, 
  Wind, 
  Sun, 
  ShieldCheck, 
  FileDown, 
  CheckCircle2, 
  PhoneCall, 
  ChevronRight, 
  Maximize2,
  BedDouble,
  Bath,
  ArrowUpRight,
  Clock,
  Dumbbell,
  Flame,
  Award,
  Check,
  X
} from 'lucide-react';
import { 
  ApartmentUnit, 
  getApartmentUnits, 
  INITIAL_APARTMENTS 
} from '@/lib/apartmentStore';

interface FloorPlanExplorerProps {
  onOpenLogin?: () => void;
}

type FloorZone = 'TYPICAL' | 'SKY_SUITE' | 'PENTHOUSE' | 'AMENITY';
type UnitDisplayTab = 'BLUEPRINT' | 'FURNISHED' | 'PHOTO';

// Ảnh thực tế theo phân loại căn hộ
const REAL_PHOTOS: Record<string, { url: string; caption: string }> = {
  '12A05': {
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80',
    caption: 'Không gian phòng khách căn hộ 12A05 hướng Đông Nam đón gió sông Sài Gòn'
  },
  '25PH-01': {
    url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&auto=format&fit=crop&q=80',
    caption: 'Tuyệt phẩm Duplex Penthouse 25PH-01 thông tầng trần cao 6.5m kèm Sky Garden'
  },
  '25PH-02': {
    url: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&auto=format&fit=crop&q=80',
    caption: 'Penthouse hoàng gia 25PH-02 view hoàng hôn panoramic ôm trọn thành phố'
  },
  '24A01': {
    url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&auto=format&fit=crop&q=80',
    caption: 'Phân khu Sky Suite 24A01 (3PN) ban công kính tràn viền view triệu đô'
  },
  '24A02': {
    url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&auto=format&fit=crop&q=80',
    caption: 'Sky Suite 24A02 (2PN) hoàn thiện nội thất tiêu chuẩn Châu Âu'
  },
  '12A01': {
    url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&auto=format&fit=crop&q=80',
    caption: 'Căn góc 12A01 (3PN) thiết kế mở đón sáng tự nhiên cả ngày'
  },
  '12A02': {
    url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&auto=format&fit=crop&q=80',
    caption: 'Căn hộ 12A02 (1PN) thông minh tối ưu diện tích cho chuyên gia'
  },
  'DEFAULT_1PN': {
    url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&auto=format&fit=crop&q=80',
    caption: 'Căn hộ 1PN cao cấp với bếp âm Hafele và phòng ngủ riêng tư'
  },
  'DEFAULT_2PN': {
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80',
    caption: 'Căn hộ 2PN Skyline thiết kế vuông vức, ban công view thoáng'
  },
  'DEFAULT_3PN': {
    url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&auto=format&fit=crop&q=80',
    caption: 'Căn hộ 3PN đa thế hệ với phòng khách lớn và 3 phòng tắm tiện nghi'
  },
};

// Dữ liệu diện tích phòng thực tế theo từng loại căn hộ (chuẩn kiến trúc m²)
const ROOM_AREAS: Record<string, { name: string; dim: string; area: number }[]> = {
  '1PN': [
    { name: 'Phòng khách & Phòng ăn', dim: '4.2m x 4.4m', area: 18.5 },
    { name: 'Phòng ngủ Master', dim: '3.8m x 4.0m', area: 15.2 },
    { name: 'Khu vực bếp Hafele', dim: '2.5m x 2.7m', area: 6.8 },
    { name: 'Phòng tắm & WC', dim: '2.1m x 2.1m', area: 4.5 },
    { name: 'Ban công kính Low-E', dim: '3.0m x 1.4m', area: 4.2 },
    { name: 'Logia giặt phơi', dim: '2.0m x 1.4m', area: 2.8 },
  ],
  '2PN': [
    { name: 'Đại sảnh & Phòng khách', dim: '4.8m x 4.6m', area: 22.0 },
    { name: 'Phòng ngủ Master Ensuite', dim: '4.6m x 4.5m', area: 21.0 },
    { name: 'Phòng ngủ phụ (Bed 2)', dim: '3.5m x 3.3m', area: 11.5 },
    { name: 'Bếp đảo & Khu ẩm thực', dim: '3.8m x 3.2m', area: 12.0 },
    { name: 'Ban công Panorama', dim: '4.2m x 1.3m', area: 5.5 },
    { name: 'WC Master & WC Chung', dim: '2 phòng riêng', area: 4.0 },
    { name: 'Logia thông gió', dim: '1.9m x 1.3m', area: 2.5 },
  ],
  '3PN': [
    { name: 'Đại sảnh & Living Room', dim: '6.2m x 5.2m', area: 32.0 },
    { name: 'Master Presidential Suite', dim: '5.2m x 5.0m', area: 26.0 },
    { name: 'Phòng ngủ số 2', dim: '4.1m x 3.5m', area: 14.5 },
    { name: 'Phòng ngủ số 3 / Studio', dim: '3.6m x 3.2m', area: 11.5 },
    { name: 'Khu bếp & Đảo Bar cao cấp', dim: '4.0m x 3.5m', area: 14.0 },
    { name: 'Ban công đôi view sông', dim: '5.5m x 1.3m', area: 7.2 },
    { name: '3 Phòng WC biệt lập', dim: '3 phòng cao cấp', area: 7.0 },
  ],
  'DUPLEX_PENTHOUSE': [
    { name: 'Grand Living Double Height (Trần 6.5m)', dim: '8.5m x 6.8m', area: 58.0 },
    { name: 'Master Presidential Suite (Tầng 2)', dim: '7.2m x 6.2m', area: 45.0 },
    { name: '3 Phòng ngủ VIP khép kín', dim: '3 phòng ensuite', area: 48.0 },
    { name: 'Khu bếp Show Kitchen & Bếp ướt', dim: '5.5m x 4.2m', area: 23.0 },
    { name: 'Sky Terrace & Bể sục Jacuzzi', dim: '7.5m x 3.5m', area: 26.0 },
    { name: 'Phòng đọc sách & Thư viện riêng', dim: '4.0m x 3.8m', area: 15.0 },
  ],
};

export default function FloorPlanExplorer({ onOpenLogin }: FloorPlanExplorerProps) {
  // Lấy dữ liệu căn hộ chuẩn từ store
  const allUnits = useMemo(() => {
    const list = getApartmentUnits();
    return list.length > 0 ? list : INITIAL_APARTMENTS;
  }, []);

  const [selectedZone, setSelectedZone] = useState<FloorZone>('TYPICAL');
  const [selectedUnitCode, setSelectedUnitCode] = useState<string>('12A05');
  const [unitTab, setUnitTab] = useState<UnitDisplayTab>('BLUEPRINT');
  const [hoveredUnitCode, setHoveredUnitCode] = useState<string | null>(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [leadForm, setLeadForm] = useState({ name: '', phone: '', note: '' });

  // Lấy căn hộ đang active
  const activeUnit = useMemo(() => {
    return allUnits.find((u) => u.code === selectedUnitCode) || allUnits[0];
  }, [allUnits, selectedUnitCode]);

  // Danh sách các căn thuộc tầng đang chọn để vẽ sơ đồ mặt bằng tầng
  const currentFloorUnits = useMemo(() => {
    if (selectedZone === 'PENTHOUSE') {
      return allUnits.filter((u) => u.floor === 25);
    }
    if (selectedZone === 'SKY_SUITE') {
      return allUnits.filter((u) => u.floor === 24);
    }
    // TYPICAL: Tầng 12A tiêu chuẩn đại diện
    return allUnits.filter((u) => u.floor === 12);
  }, [allUnits, selectedZone]);

  // Căn hộ được hiển thị ảnh thực tế
  const photoData = useMemo(() => {
    if (REAL_PHOTOS[activeUnit.code]) return REAL_PHOTOS[activeUnit.code];
    if (activeUnit.type === '1PN') return REAL_PHOTOS['DEFAULT_1PN'];
    if (activeUnit.type === '3PN') return REAL_PHOTOS['DEFAULT_3PN'];
    return REAL_PHOTOS['DEFAULT_2PN'];
  }, [activeUnit]);

  // Xử lý chọn Zone
  const handleSelectZone = (zone: FloorZone) => {
    setSelectedZone(zone);
    if (zone === 'PENTHOUSE') {
      setSelectedUnitCode('25PH-01');
    } else if (zone === 'SKY_SUITE') {
      setSelectedUnitCode('24A01');
    } else if (zone === 'TYPICAL') {
      setSelectedUnitCode('12A05');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterSuccess(true);
    setTimeout(() => {
      setRegisterSuccess(false);
      setIsRegisterModalOpen(false);
      setLeadForm({ name: '', phone: '', note: '' });
    }, 2200);
  };

  return (
    <section id="floorplans" className="py-16 sm:py-24 bg-[#0A0E17] text-white border-b border-[#1E293B] select-none relative overflow-hidden">
      {/* Background glow tinh tế */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#C5A880]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-900/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* ============================================================= */}
        {/* TIÊU ĐỀ CHUẨN KIẾN TRÚC BẤT ĐỘNG SẢN CAO CẤP                 */}
        {/* ============================================================= */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-8 sm:mb-12 gap-6 pb-6 border-b border-[#1E293B]">
          <div className="space-y-2.5 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#161F2E] border border-[#C5A880]/40 rounded text-[11px] font-mono uppercase tracking-[0.2em] text-[#C5A880]">
              <Layers className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>Kiến Trúc & Không Gian Căn Hộ Skyline</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-serif text-white font-bold tracking-tight">
              Sơ Đồ Mặt Bằng Tầng & Layout Chi Tiết
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-light">
              Quy chuẩn thiết kế 25 tầng cao cấp với mật độ thông thoáng chỉ 8 căn/sàn. Tối ưu hóa 100% căn hộ đón ánh sáng tự nhiên và gió mát trực diện từ Sông Sài Gòn.
            </p>
          </div>

          {/* Nút Kêu gọi / Tải Brochure */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsRegisterModalOpen(true)}
              className="px-4 py-2.5 bg-[#C5A880] hover:bg-[#D4AF37] text-[#0A0E17] font-semibold text-xs tracking-wider uppercase rounded transition-all shadow-lg flex items-center gap-2"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Đăng Ký Tham Quan Căn Hộ</span>
            </button>
            <a
              href="#contact"
              onClick={(e) => {
                e.preventDefault();
                alert(`Đang tải trọn bộ Bản vẽ CAD & Brochure Mặt bằng Chung Cư Skyline (Mã căn: ${activeUnit.code})`);
              }}
              className="px-4 py-2.5 bg-[#121824] hover:bg-[#1A2232] border border-[#2A374A] hover:border-[#C5A880]/60 text-gray-300 hover:text-white font-semibold text-xs tracking-wider uppercase rounded transition-all flex items-center gap-2"
            >
              <FileDown className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>Brochure Mặt Bằng (PDF)</span>
            </a>
          </div>
        </div>

        {/* ============================================================= */}
        {/* BỘ CHỌN PHÂN KHU TẦNG (BUILDING ZONE SELECTOR)                */}
        {/* ============================================================= */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 mb-8">
          {/* ZONE 1: TẦNG ĐIỂN HÌNH (TẦNG 5 - 21) */}
          <button
            type="button"
            onClick={() => handleSelectZone('TYPICAL')}
            className={`p-3.5 sm:p-4 rounded border text-left transition-all relative ${
              selectedZone === 'TYPICAL'
                ? 'bg-[#151D29] border-[#C5A880] shadow-xl ring-1 ring-[#C5A880]/50'
                : 'bg-[#0E131C] border-[#1E293B] hover:border-[#2D3F58] hover:bg-[#131A24]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#C5A880] font-semibold">Tầng 05 - 21</span>
              {selectedZone === 'TYPICAL' && <span className="w-2 h-2 rounded-full bg-[#C5A880] animate-pulse" />}
            </div>
            <div className="font-serif text-sm sm:text-base font-bold text-white mt-1">
              Căn Hộ Điển Hình (8 Căn/Sàn)
            </div>
            <div className="text-[11px] text-gray-400 mt-1 font-light">
              Mẫu 1PN, 2PN, 3PN • Tiêu biểu Tầng 12A
            </div>
          </button>

          {/* ZONE 2: SKY SUITE TẦNG CAO (TẦNG 22 - 24) */}
          <button
            type="button"
            onClick={() => handleSelectZone('SKY_SUITE')}
            className={`p-3.5 sm:p-4 rounded border text-left transition-all relative ${
              selectedZone === 'SKY_SUITE'
                ? 'bg-[#151D29] border-[#C5A880] shadow-xl ring-1 ring-[#C5A880]/50'
                : 'bg-[#0E131C] border-[#1E293B] hover:border-[#2D3F58] hover:bg-[#131A24]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#C5A880] font-semibold">Tầng 22 - 24</span>
              {selectedZone === 'SKY_SUITE' && <span className="w-2 h-2 rounded-full bg-[#C5A880] animate-pulse" />}
            </div>
            <div className="font-serif text-sm sm:text-base font-bold text-white mt-1">
              Phân Khu Sky Suite Áp Mái
            </div>
            <div className="text-[11px] text-gray-400 mt-1 font-light">
              4 Căn góc VIP/Sàn • View triệu đô ôm trọn sông
            </div>
          </button>

          {/* ZONE 3: PENTHOUSE HOÀNG GIA (TẦNG 25) */}
          <button
            type="button"
            onClick={() => handleSelectZone('PENTHOUSE')}
            className={`p-3.5 sm:p-4 rounded border text-left transition-all relative ${
              selectedZone === 'PENTHOUSE'
                ? 'bg-[#151D29] border-[#C5A880] shadow-xl ring-1 ring-[#C5A880]/50'
                : 'bg-[#0E131C] border-[#1E293B] hover:border-[#2D3F58] hover:bg-[#131A24]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#C5A880] font-semibold">Tầng 25 (Đỉnh Tháp)</span>
              {selectedZone === 'PENTHOUSE' && <span className="w-2 h-2 rounded-full bg-[#C5A880] animate-pulse" />}
            </div>
            <div className="font-serif text-sm sm:text-base font-bold text-white mt-1">
              Duplex Penthouse & Sky Oasis
            </div>
            <div className="text-[11px] text-gray-400 mt-1 font-light">
              2 Căn Duplex độc bản 215m² + Bể bơi vô cực
            </div>
          </button>

          {/* ZONE 4: TẦNG TIỆN ÍCH CHĂM SÓC SỨC KHỎE (TẦNG 3) */}
          <button
            type="button"
            onClick={() => handleSelectZone('AMENITY')}
            className={`p-3.5 sm:p-4 rounded border text-left transition-all relative ${
              selectedZone === 'AMENITY'
                ? 'bg-[#151D29] border-[#C5A880] shadow-xl ring-1 ring-[#C5A880]/50'
                : 'bg-[#0E131C] border-[#1E293B] hover:border-[#2D3F58] hover:bg-[#131A24]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#C5A880] font-semibold">Tầng 03 - 04</span>
              {selectedZone === 'AMENITY' && <span className="w-2 h-2 rounded-full bg-[#C5A880] animate-pulse" />}
            </div>
            <div className="font-serif text-sm sm:text-base font-bold text-white mt-1">
              Tầng Tiện Ích Sức Khỏe
            </div>
            <div className="text-[11px] text-gray-400 mt-1 font-light">
              Gym Technogym 24/7 & Sauna Đá Muối VIP
            </div>
          </button>
        </div>

        {/* ============================================================= */}
        {/* NỘI DUNG CHÍNH: SƠ ĐỒ MẶT BẰNG TẦNG VÀ CHI TIẾT CĂN HỘ       */}
        {/* ============================================================= */}

        {selectedZone === 'AMENITY' ? (
          /* TRƯỜNG HỢP XEM TẦNG TIỆN ÍCH TẦNG 3 - 4 */
          <div className="border border-[#1E293B] bg-[#0E131C] rounded-lg p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#1E293B]">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#C5A880]">Mặt Bằng Tầng 03 Tiện Ích Thể Thao & Sức Khỏe</span>
                <h3 className="font-serif text-xl sm:text-2xl text-white font-bold mt-1">
                  Khu Vực Phục Vụ Cư Dân Khép Kín 5 Sao
                </h3>
              </div>
              <div className="text-xs text-emerald-400 bg-emerald-950/80 border border-emerald-500/50 px-3 py-1.5 rounded flex items-center gap-1.5 self-start sm:self-auto">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Hoạt Động 24/7 • Miễn Phí Theo Thẻ Cư Dân</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-[#1E293B] bg-[#121824] rounded-lg overflow-hidden group">
                <div className="h-52 relative overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80"
                    alt="Technogym Center"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 bg-[#0A0E17]/90 text-[#C5A880] px-2.5 py-1 text-xs font-mono font-bold border border-[#C5A880]/50 rounded">
                    350 m²
                  </div>
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-2 text-[#C5A880] text-xs font-semibold uppercase tracking-wider">
                    <Dumbbell className="w-4 h-4" />
                    <span>Trung Tâm Thể Hình Technogym</span>
                  </div>
                  <h4 className="font-serif text-lg font-bold text-white">Fitness & Yoga Panoramic Tầng 3</h4>
                  <p className="text-xs text-gray-300 font-light leading-relaxed">
                    Trang bị trọn bộ máy tập thể hình chuẩn Olympic thương hiệu Ý Technogym, phòng tập Yoga sàn gỗ tự nhiên cách âm hoàn toàn, tầm nhìn rộng mở ra công viên nội khu.
                  </p>
                  <div className="pt-2 flex items-center justify-between text-xs text-gray-400 border-t border-[#1E293B]">
                    <span>Thời gian mở cửa: <strong className="text-white">Mở 24/7</strong></span>
                    <span>Sức chứa: <strong className="text-[#C5A880]">35 người/lượt</strong></span>
                  </div>
                </div>
              </div>

              <div className="border border-[#1E293B] bg-[#121824] rounded-lg overflow-hidden group">
                <div className="h-52 relative overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop&q=80"
                    alt="Himalayan Salt Sauna"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 bg-[#0A0E17]/90 text-[#C5A880] px-2.5 py-1 text-xs font-mono font-bold border border-[#C5A880]/50 rounded">
                    VIP Khép Kín
                  </div>
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-2 text-[#C5A880] text-xs font-semibold uppercase tracking-wider">
                    <Flame className="w-4 h-4" />
                    <span>Phòng Xông Hơi Đá Muối Himalaya</span>
                  </div>
                  <h4 className="font-serif text-lg font-bold text-white">Sauna & Spa Trị Liệu Gia Đình</h4>
                  <p className="text-xs text-gray-300 font-light leading-relaxed">
                    Không gian thư giãn trị liệu bằng đá muối khoáng tự nhiên nhập khẩu từ dãy núi Himalaya, hỗ trợ đào thải độc tố, điều hòa nhịp tim và tái tạo năng lượng cho cả gia đình.
                  </p>
                  <div className="pt-2 flex items-center justify-between text-xs text-gray-400 border-t border-[#1E293B]">
                    <span>Giờ phục vụ: <strong className="text-white">08:00 - 22:00</strong></span>
                    <span>Đặc quyền: <strong className="text-[#C5A880]">Đặt chỗ riêng qua App</strong></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* TRƯỜNG HỢP XEM MẶT BẰNG TẦNG CĂN HỘ (TYPICAL / SKY SUITE / PENTHOUSE) */
          <div className="space-y-8">
            {/* ============================================================= */}
            {/* PHẦN 1: BẢN ĐỒ MẶT BẰNG TẦNG TƯƠNG TÁC (INTERACTIVE FLOOR PLATE) */}
            {/* ============================================================= */}
            <div className="border border-[#1E293B] bg-[#0E131C] rounded-lg p-4 sm:p-6 space-y-4 shadow-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1E293B]">
                <div>
                  <div className="text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-[#C5A880] font-semibold flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-[#C5A880]" />
                    <span>Sơ Đồ Mặt Bằng Sàn Tương Tác • {
                      selectedZone === 'PENTHOUSE' ? 'Tầng 25 (Đỉnh Tháp)' :
                      selectedZone === 'SKY_SUITE' ? 'Tầng 24 (Sky Suite Áp Mái)' :
                      'Tầng 12A (Tầng Điển Hình Chuẩn)'
                    }</span>
                  </div>
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-white mt-1">
                    Bố Trí 8 Căn Hộ Quanh Lõi Thang Máy & Hành Lang Thông Gió
                  </h3>
                </div>

                {/* Chú thích màu loại căn */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-blue-500/30 border border-blue-400" />
                    <span className="text-gray-300">1PN (52m²)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-[#C5A880]/30 border border-[#C5A880]" />
                    <span className="text-gray-300">2PN (75-80m²)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-purple-500/30 border border-purple-400" />
                    <span className="text-gray-300">3PN (98-112m²)</span>
                  </div>
                  {selectedZone === 'PENTHOUSE' && (
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-rose-500/30 border border-rose-400" />
                      <span className="text-gray-300">Duplex (215m²)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Chỉ báo Hướng Bắc - Nam & Cảnh quan */}
              <div className="flex items-center justify-between text-[11px] font-mono px-2 text-gray-400">
                <div className="flex items-center gap-1.5 text-blue-300">
                  <Sun className="w-3.5 h-3.5" />
                  <span>HƯỚNG BẮC: View Trung Tâm Thành Phố & Landmark 81</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-300">
                  <Wind className="w-3.5 h-3.5" />
                  <span>HƯỚNG NAM / ĐÔNG NAM: View Trực Diện Sông Sài Gòn (Gió Mát)</span>
                </div>
              </div>

              {/* KHUNG VẼ SƠ ĐỒ MẶT BẰNG TẦNG CHUẨN KIẾN TRÚC BẰNG SVG TƯƠNG TÁC */}
              <div className="relative bg-[#070A10] border border-[#1E293B] rounded-lg p-2 sm:p-4 overflow-x-auto">
                <svg
                  viewBox="0 0 960 480"
                  className="w-full min-w-[700px] h-auto select-none"
                  style={{ maxHeight: '480px' }}
                >
                  {/* Định nghĩa gradient & hiệu ứng */}
                  <defs>
                    <linearGradient id="corridorGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#1E293B" stopOpacity="0.8" />
                      <stop offset="50%" stopColor="#2A374A" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#1E293B" stopOpacity="0.8" />
                    </linearGradient>
                    <pattern id="cadGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <line x1="0" y1="0" x2="20" y2="0" stroke="#161E2E" strokeWidth="0.8" />
                      <line x1="0" y1="0" x2="0" y2="20" stroke="#161E2E" strokeWidth="0.8" />
                    </pattern>
                  </defs>

                  {/* Nền lưới kỹ thuật CAD */}
                  <rect x="0" y="0" width="960" height="480" fill="url(#cadGrid)" />

                  {/* La bàn phong thủy chỉ hướng góc trên bên phải */}
                  <g transform="translate(900, 50)">
                    <circle cx="0" cy="0" r="26" fill="#0E131C" stroke="#C5A880" strokeWidth="1.2" />
                    <line x1="0" y1="-20" x2="0" y2="20" stroke="#C5A880" strokeWidth="1" strokeDasharray="2 2" />
                    <line x1="-20" y1="0" x2="20" y2="0" stroke="#C5A880" strokeWidth="1" strokeDasharray="2 2" />
                    {/* Kim chỉ Bắc */}
                    <polygon points="0,-22 -5,-4 0,0" fill="#EF4444" />
                    <polygon points="0,-22 5,-4 0,0" fill="#DC2626" />
                    <polygon points="0,22 -5,4 0,0" fill="#94A3B8" />
                    <polygon points="0,22 5,4 0,0" fill="#64748B" />
                    <text x="0" y="-25" fill="#EF4444" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">B</text>
                    <text x="0" y="32" fill="#94A3B8" fontSize="8" fontFamily="monospace" textAnchor="middle">N</text>
                    <text x="30" y="3" fill="#94A3B8" fontSize="8" fontFamily="monospace" textAnchor="middle">Đ</text>
                    <text x="-30" y="3" fill="#94A3B8" fontSize="8" fontFamily="monospace" textAnchor="middle">T</text>
                  </g>

                  {/* KHUNG TỔNG THỂ TẦNG */}
                  <rect
                    x="40"
                    y="30"
                    width="880"
                    height="420"
                    rx="8"
                    fill="none"
                    stroke="#2A374A"
                    strokeWidth="3"
                  />

                  {/* HÀNH LANG THÔNG GIÓ TRUNG TÂM (CORRIDOR) */}
                  <rect
                    x="60"
                    y="210"
                    width="840"
                    height="60"
                    fill="url(#corridorGrad)"
                    stroke="#334155"
                    strokeWidth="1.2"
                  />
                  <text
                    x="80"
                    y="245"
                    fill="#94A3B8"
                    fontSize="10"
                    fontFamily="monospace"
                    fontWeight="bold"
                    letterSpacing="2"
                  >
                    ◀ HÀNH LANG RỘNG 1.8M - LẤY SÁNG & GIÓ TỰ NHIÊN 2 ĐẦU HỒI ▶
                  </text>

                  {/* LÕI GIAO THÔNG TRUNG TÂM (BUILDING CORE): THANG MÁY + THANG BỘ */}
                  <g transform="translate(360, 160)">
                    {/* Hộp lõi bê tông chịu lực */}
                    <rect
                      x="0"
                      y="0"
                      width="240"
                      height="160"
                      rx="4"
                      fill="#121824"
                      stroke="#C5A880"
                      strokeWidth="2"
                    />

                    {/* Sảnh Thang Máy */}
                    <rect x="15" y="60" width="210" height="40" fill="#1C2536" stroke="#334155" strokeWidth="1" />
                    <text x="120" y="84" fill="#C5A880" fontSize="9.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                      SẢNH THANG MÁY CAO CẤP
                    </text>

                    {/* 4 Thang máy cư dân tốc độ cao (2.5 m/s) */}
                    <g transform="translate(20, 10)">
                      <rect x="0" y="0" width="45" height="40" rx="3" fill="#162030" stroke="#475569" strokeWidth="1.2" />
                      <text x="22.5" y="24" fill="#E2E8F0" fontSize="8.5" fontFamily="monospace" textAnchor="middle">THANG 1</text>
                      
                      <rect x="50" y="0" width="45" height="40" rx="3" fill="#162030" stroke="#475569" strokeWidth="1.2" />
                      <text x="72.5" y="24" fill="#E2E8F0" fontSize="8.5" fontFamily="monospace" textAnchor="middle">THANG 2</text>

                      <rect x="105" y="0" width="45" height="40" rx="3" fill="#162030" stroke="#475569" strokeWidth="1.2" />
                      <text x="127.5" y="24" fill="#E2E8F0" fontSize="8.5" fontFamily="monospace" textAnchor="middle">THANG 3</text>

                      <rect x="155" y="0" width="45" height="40" rx="3" fill="#162030" stroke="#475569" strokeWidth="1.2" />
                      <text x="177.5" y="24" fill="#E2E8F0" fontSize="8.5" fontFamily="monospace" textAnchor="middle">THANG 4</text>
                    </g>

                    {/* 2 Thang Bộ Thoát Hiểm Chống Khói PCCC & Thang Hàng */}
                    <g transform="translate(20, 110)">
                      <rect x="0" y="0" width="60" height="40" rx="2" fill="#1A1412" stroke="#EA580C" strokeWidth="1" />
                      <text x="30" y="24" fill="#FB923C" fontSize="8" fontFamily="monospace" textAnchor="middle">THANG BỘ 1</text>

                      <rect x="70" y="0" width="60" height="40" rx="2" fill="#1E293B" stroke="#64748B" strokeWidth="1" />
                      <text x="100" y="24" fill="#CBD5E1" fontSize="8" fontFamily="monospace" textAnchor="middle">THANG HÀNG</text>

                      <rect x="140" y="0" width="60" height="40" rx="2" fill="#1A1412" stroke="#EA580C" strokeWidth="1" />
                      <text x="170" y="24" fill="#FB923C" fontSize="8" fontFamily="monospace" textAnchor="middle">THANG BỘ 2</text>
                    </g>
                  </g>

                  {/* ========================================================= */}
                  {/* VẼ CÁC CĂN HỘ THEO ZONE ĐANG CHỌN                         */}
                  {/* ========================================================= */}
                  {selectedZone === 'PENTHOUSE' ? (
                    /* TẦNG 25: 2 CĂN DUPLEX PENTHOUSE 2 ĐẦU + HỒ BƠI VÔ CỰC Ở GIỮA */
                    <>
                      {/* CĂN 25PH-01 (Đầu Đông Nam) */}
                      {(() => {
                        const isSelected = selectedUnitCode === '25PH-01';
                        const isHovered = hoveredUnitCode === '25PH-01';
                        return (
                          <g
                            onClick={() => setSelectedUnitCode('25PH-01')}
                            onMouseEnter={() => setHoveredUnitCode('25PH-01')}
                            onMouseLeave={() => setHoveredUnitCode(null)}
                            className="cursor-pointer"
                          >
                            <rect
                              x="60"
                              y="50"
                              width="280"
                              height="380"
                              rx="6"
                              fill={isSelected ? '#2A1B18' : isHovered ? '#201614' : '#140E0D'}
                              stroke={isSelected ? '#F43F5E' : isHovered ? '#FDA4AF' : '#E11D48'}
                              strokeWidth={isSelected ? '3' : '1.5'}
                            />
                            <text x="200" y="110" fill="#FDA4AF" fontSize="18" fontFamily="serif" fontWeight="bold" textAnchor="middle">
                              CĂN 25PH-01
                            </text>
                            <text x="200" y="135" fill="#E2E8F0" fontSize="12" fontFamily="monospace" textAnchor="middle">
                              Duplex Penthouse Hoàng Gia
                            </text>
                            <text x="200" y="160" fill="#C5A880" fontSize="14" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                              215.0 m² • 4 Phòng Ngủ • 4 WC
                            </text>
                            <text x="200" y="190" fill="#10B981" fontSize="11" fontFamily="monospace" textAnchor="middle">
                              Ban công: Đông Nam • View Sông Sài Gòn
                            </text>
                            <rect x="130" y="350" width="140" height="28" rx="4" fill="#E11D48" />
                            <text x="200" y="368" fill="#FFFFFF" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                              18.50 TỶ VNĐ
                            </text>
                          </g>
                        );
                      })()}

                      {/* HỒ BƠI VÔ CỰC CHÂN MÂY & SKY BAR TRUNG TÂM TẦNG 25 */}
                      <g transform="translate(360, 50)">
                        <rect x="0" y="0" width="240" height="100" rx="6" fill="#0C2538" stroke="#38BDF8" strokeWidth="1.5" />
                        <text x="120" y="45" fill="#38BDF8" fontSize="13" fontFamily="serif" fontWeight="bold" textAnchor="middle">
                          HỒ BƠI VÔ CỰC CHÂN MÂY
                        </text>
                        <text x="120" y="68" fill="#BAE6FD" fontSize="10" fontFamily="monospace" textAnchor="middle">
                          Skyline Horizon Pool • 250 m²
                        </text>

                        <rect x="0" y="330" width="240" height="50" rx="6" fill="#201C12" stroke="#F59E0B" strokeWidth="1.5" />
                        <text x="120" y="360" fill="#FBBF24" fontSize="12" fontFamily="serif" fontWeight="bold" textAnchor="middle">
                          VƯỜN TIỆC NƯỚNG BBQ PANORAMIC
                        </text>
                      </g>

                      {/* CĂN 25PH-02 (Đầu Tây Nam) */}
                      {(() => {
                        const isSelected = selectedUnitCode === '25PH-02';
                        const isHovered = hoveredUnitCode === '25PH-02';
                        return (
                          <g
                            onClick={() => setSelectedUnitCode('25PH-02')}
                            onMouseEnter={() => setHoveredUnitCode('25PH-02')}
                            onMouseLeave={() => setHoveredUnitCode(null)}
                            className="cursor-pointer"
                          >
                            <rect
                              x="620"
                              y="50"
                              width="280"
                              height="380"
                              rx="6"
                              fill={isSelected ? '#2A1B18' : isHovered ? '#201614' : '#140E0D'}
                              stroke={isSelected ? '#F43F5E' : isHovered ? '#FDA4AF' : '#E11D48'}
                              strokeWidth={isSelected ? '3' : '1.5'}
                            />
                            <text x="760" y="110" fill="#FDA4AF" fontSize="18" fontFamily="serif" fontWeight="bold" textAnchor="middle">
                              CĂN 25PH-02
                            </text>
                            <text x="760" y="135" fill="#E2E8F0" fontSize="12" fontFamily="monospace" textAnchor="middle">
                              Duplex Penthouse Hoàng Gia
                            </text>
                            <text x="760" y="160" fill="#C5A880" fontSize="14" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                              215.0 m² • 4 Phòng Ngủ • 4 WC
                            </text>
                            <text x="760" y="190" fill="#10B981" fontSize="11" fontFamily="monospace" textAnchor="middle">
                              Ban công: Tây Nam • View Hoàng Hôn Triệu Đô
                            </text>
                            <rect x="690" y="350" width="140" height="28" rx="4" fill="#E11D48" />
                            <text x="760" y="368" fill="#FFFFFF" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                              18.20 TỶ VNĐ
                            </text>
                          </g>
                        );
                      })()}
                    </>
                  ) : (
                    /* TẦNG ĐIỂN HÌNH (TẦNG 12A / TẦNG 24): 8 CĂN HỘ CHIA 2 DÃY BẮC - NAM */
                    <>
                      {/* DÃY PHÍA BẮC (TRÊN): Căn 08, Căn 07, Căn 06, Căn 04 (View Thành phố) */}
                      {[
                        { code: selectedZone === 'SKY_SUITE' ? '24A04' : '12A08', x: 60, y: 50, w: 140, h: 150, type: '2PN', area: 78.5, price: selectedZone === 'SKY_SUITE' ? '5.40 Tỷ' : '4.80 Tỷ', view: 'Bắc • City' },
                        { code: selectedZone === 'SKY_SUITE' ? '24A03' : '12A07', x: 210, y: 50, w: 140, h: 150, type: '3PN', area: selectedZone === 'SKY_SUITE' ? 108.0 : 88.0, price: selectedZone === 'SKY_SUITE' ? '8.20 Tỷ' : '5.50 Tỷ', view: 'Đông Bắc' },
                        { code: selectedZone === 'SKY_SUITE' ? '24A02' : '12A06', x: 610, y: 50, w: 140, h: 150, type: '2PN', area: 75.0, price: selectedZone === 'SKY_SUITE' ? '5.60 Tỷ' : '4.60 Tỷ', view: 'Tây Bắc' },
                        { code: selectedZone === 'SKY_SUITE' ? '24A01' : '12A04', x: 760, y: 50, w: 140, h: 150, type: '3PN', area: selectedZone === 'SKY_SUITE' ? 112.0 : 108.0, price: selectedZone === 'SKY_SUITE' ? '8.50 Tỷ' : '6.95 Tỷ', view: 'Tây Nam' },
                      ].map((u) => {
                        const isSelected = selectedUnitCode === u.code;
                        const isHovered = hoveredUnitCode === u.code;
                        const strokeColor = u.type === '3PN' ? '#A855F7' : '#C5A880';
                        return (
                          <g
                            key={u.code}
                            onClick={() => setSelectedUnitCode(u.code)}
                            onMouseEnter={() => setHoveredUnitCode(u.code)}
                            onMouseLeave={() => setHoveredUnitCode(null)}
                            className="cursor-pointer"
                          >
                            <rect
                              x={u.x}
                              y={u.y}
                              width={u.w}
                              height={u.h}
                              rx="4"
                              fill={isSelected ? '#1A2333' : isHovered ? '#141C29' : '#0F1622'}
                              stroke={isSelected ? '#C5A880' : isHovered ? '#94A3B8' : strokeColor}
                              strokeWidth={isSelected ? '2.5' : '1.2'}
                            />
                            <text x={u.x + u.w / 2} y={u.y + 35} fill="#FFFFFF" fontSize="13" fontFamily="serif" fontWeight="bold" textAnchor="middle">
                              CĂN {u.code}
                            </text>
                            <text x={u.x + u.w / 2} y={u.y + 60} fill="#C5A880" fontSize="10.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                              {u.type} • {u.area} m²
                            </text>
                            <text x={u.x + u.w / 2} y={u.y + 85} fill="#94A3B8" fontSize="9" fontFamily="monospace" textAnchor="middle">
                              {u.view}
                            </text>
                            <rect x={u.x + 20} y={u.y + 105} width={u.w - 40} height="22" rx="3" fill="#1E293B" />
                            <text x={u.x + u.w / 2} y={u.y + 120} fill="#E2E8F0" fontSize="9.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                              {u.price}
                            </text>
                            {isSelected && (
                              <circle cx={u.x + u.w - 15} cy={u.y + 15} r="5" fill="#C5A880" />
                            )}
                          </g>
                        );
                      })}

                      {/* DÃY PHÍA NAM (DƯỚI): Căn 01, Căn 02, Căn 03, Căn 05 (View Sông Sài Gòn & Căn Chủ Hộ) */}
                      {[
                        { code: selectedZone === 'SKY_SUITE' ? '23A01' : '12A01', x: 60, y: 280, w: 140, h: 150, type: '3PN', area: 98.0, price: '6.20 Tỷ', view: 'Đông Nam • View Sông' },
                        { code: selectedZone === 'SKY_SUITE' ? '23A02' : '12A02', x: 210, y: 280, w: 140, h: 150, type: '1PN', area: 52.0, price: '3.35 Tỷ', view: 'Chính Nam • View Sông' },
                        { code: selectedZone === 'SKY_SUITE' ? '23A03' : '12A03', x: 610, y: 280, w: 140, h: 150, type: '2PN', area: 75.0, price: '4.65 Tỷ', view: 'Đông Nam • View Sông' },
                        // CĂN 12A05: CĂN CƯ DÂN THẬT NGUYỄN HỮU LỰC (HIGHLIGHT ĐẶC BIỆT)
                        { 
                          code: selectedZone === 'SKY_SUITE' ? '23A04' : '12A05', 
                          x: 760, 
                          y: 280, 
                          w: 140, 
                          h: 150, 
                          type: '2PN', 
                          area: 78.5, 
                          price: '4.85 Tỷ', 
                          view: 'Đông Nam • View Sông', 
                          isRealResident: selectedZone === 'TYPICAL' 
                        },
                      ].map((u) => {
                        const isSelected = selectedUnitCode === u.code;
                        const isHovered = hoveredUnitCode === u.code;
                        const strokeColor = u.isRealResident ? '#F59E0B' : (u.type === '1PN' ? '#38BDF8' : u.type === '3PN' ? '#A855F7' : '#C5A880');
                        return (
                          <g
                            key={u.code}
                            onClick={() => setSelectedUnitCode(u.code)}
                            onMouseEnter={() => setHoveredUnitCode(u.code)}
                            onMouseLeave={() => setHoveredUnitCode(null)}
                            className="cursor-pointer"
                          >
                            <rect
                              x={u.x}
                              y={u.y}
                              width={u.w}
                              height={u.h}
                              rx="4"
                              fill={isSelected ? '#1A2333' : isHovered ? '#141C29' : (u.isRealResident ? '#18140B' : '#0F1622')}
                              stroke={isSelected ? '#C5A880' : isHovered ? '#94A3B8' : strokeColor}
                              strokeWidth={isSelected ? '2.5' : (u.isRealResident ? '2' : '1.2')}
                            />
                            {/* Huy hiệu Căn Hộ Thực Tế cho 12A05 */}
                            {u.isRealResident && (
                              <g transform={`translate(${u.x + 10}, ${u.y + 10})`}>
                                <rect x="0" y="0" width="120" height="16" rx="3" fill="#B45309" />
                                <text x="60" y="11" fill="#FEF3C7" fontSize="7.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                                  ★ CĂN HỘ CƯ DÂN THỰC TẾ
                                </text>
                              </g>
                            )}

                            <text x={u.x + u.w / 2} y={u.y + (u.isRealResident ? 46 : 38)} fill="#FFFFFF" fontSize="13" fontFamily="serif" fontWeight="bold" textAnchor="middle">
                              CĂN {u.code}
                            </text>
                            <text x={u.x + u.w / 2} y={u.y + (u.isRealResident ? 68 : 62)} fill="#C5A880" fontSize="10.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                              {u.type} • {u.area} m²
                            </text>
                            <text x={u.x + u.w / 2} y={u.y + (u.isRealResident ? 90 : 85)} fill="#34D399" fontSize="9" fontFamily="monospace" textAnchor="middle">
                              {u.view}
                            </text>
                            <rect x={u.x + 20} y={u.y + 110} width={u.w - 40} height="22" rx="3" fill="#1E293B" />
                            <text x={u.x + u.w / 2} y={u.y + 125} fill="#E2E8F0" fontSize="9.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                              {u.price}
                            </text>
                            {isSelected && (
                              <circle cx={u.x + u.w - 15} cy={u.y + 15} r="5" fill="#C5A880" />
                            )}
                          </g>
                        );
                      })}
                    </>
                  )}
                </svg>
              </div>
            </div>

            {/* ============================================================= */}
            {/* PHẦN 2: BẢN VẼ MẶT BẰNG CHI TIẾT CĂN HỘ ĐANG CHỌN (UNIT DETAIL) */}
            {/* ============================================================= */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
              {/* CỘT TRÁI: BẢN VẼ KIẾN TRÚC & VIEW TRỰC QUAN (8 CỘT) */}
              <div className="lg:col-span-8 space-y-4">
                {/* Header thanh điều hướng tab: 2D Blueprint / Bố trí nội thất / Ảnh thực tế */}
                <div className="p-3 sm:p-4 bg-[#0E131C] border border-[#1E293B] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
                  <div>
                    <div className="text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-[#C5A880] font-semibold">
                      Bản Vẽ Chi Tiết Công Năng Căn Hộ
                    </div>
                    <h3 className="font-serif text-lg sm:text-2xl text-white font-bold mt-0.5">
                      Căn Hộ {activeUnit.code} ({activeUnit.typeLabel}) • {activeUnit.towerName}
                    </h3>
                  </div>

                  <div className="flex bg-[#070A10] p-1 border border-[#1E293B] rounded self-start sm:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => setUnitTab('BLUEPRINT')}
                      className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors rounded flex items-center gap-1.5 ${
                        unitTab === 'BLUEPRINT' ? 'bg-[#C5A880] text-[#0A0E17] font-bold shadow' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Box className="w-3.5 h-3.5" />
                      <span>Bản Vẽ 2D CAD</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setUnitTab('FURNISHED')}
                      className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors rounded flex items-center gap-1.5 ${
                        unitTab === 'FURNISHED' ? 'bg-[#C5A880] text-[#0A0E17] font-bold shadow' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Phối Cảnh Nội Thất</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setUnitTab('PHOTO')}
                      className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors rounded flex items-center gap-1.5 ${
                        unitTab === 'PHOTO' ? 'bg-[#C5A880] text-[#0A0E17] font-bold shadow' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ảnh Thực Tế</span>
                    </button>
                  </div>
                </div>

                {/* TAB 1: BẢN VẼ 2D CAD KIẾN TRÚC */}
                {unitTab === 'BLUEPRINT' && (
                  <div className="bg-[#070A10] border border-[#1E293B] rounded-lg p-4 sm:p-6 relative overflow-hidden shadow-2xl">
                    <div className="flex items-center justify-between text-xs text-gray-400 font-mono pb-3 border-b border-[#1E293B]">
                      <span className="text-[#C5A880] font-semibold">TỈ LỆ 1:50 • TIÊU CHUẨN THI CÔNG HOÀN THIỆN</span>
                      <span>ĐƠN VỊ ĐO: MÉT (m)</span>
                    </div>

                    {/* SVG BẢN VẼ CAD KIẾN TRÚC CHI TIẾT */}
                    <svg viewBox="0 0 700 420" className="w-full h-auto select-none mt-2" style={{ maxHeight: '420px' }}>
                      <defs>
                        <pattern id="hatchPattern" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                          <line x1="0" y1="0" x2="0" y2="8" stroke="#334155" strokeWidth="1" />
                        </pattern>
                      </defs>

                      {/* TƯỜNG BAO NGOÀI (BÊ TÔNG DÀY 200MM) */}
                      <rect x="50" y="40" width="600" height="340" fill="#0C121E" stroke="#475569" strokeWidth="4" />
                      
                      {/* VÁCH NGĂN PHÒNG CHÍNH */}
                      {/* 1. Phòng Khách & Ban Công */}
                      <rect x="50" y="40" width="360" height="220" fill="#0F172A" stroke="#334155" strokeWidth="2" />
                      <text x="230" y="140" fill="#FFFFFF" fontSize="16" fontFamily="serif" fontWeight="bold" textAnchor="middle">
                        PHÒNG KHÁCH & KHU ĂN UỐNG
                      </text>
                      <text x="230" y="165" fill="#C5A880" fontSize="12" fontFamily="monospace" textAnchor="middle">
                        22.0 m² (4.8m x 4.6m)
                      </text>

                      {/* Ban công kính Low-E tràn viền */}
                      <rect x="50" y="40" width="360" height="45" fill="#082F49" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="4 2" />
                      <text x="230" y="68" fill="#38BDF8" fontSize="11" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                        BAN CÔNG PANORAMA KÍNH LOW-E (ĐÓN GIÓ ĐÔNG NAM)
                      </text>

                      {/* 2. Phòng Ngủ Master */}
                      <rect x="410" y="40" width="240" height="200" fill="#141E33" stroke="#334155" strokeWidth="2" />
                      <text x="530" y="130" fill="#FFFFFF" fontSize="14" fontFamily="serif" fontWeight="bold" textAnchor="middle">
                        PHÒNG NGỦ MASTER
                      </text>
                      <text x="530" y="155" fill="#C5A880" fontSize="11" fontFamily="monospace" textAnchor="middle">
                        21.0 m² (4.6m x 4.5m)
                      </text>
                      <text x="530" y="175" fill="#94A3B8" fontSize="9.5" fontFamily="monospace" textAnchor="middle">
                        Ensuite Bathroom
                      </text>

                      {/* WC Master */}
                      <rect x="530" y="40" width="120" height="75" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />
                      <text x="590" y="82" fill="#E2E8F0" fontSize="10" fontFamily="monospace" textAnchor="middle">
                        WC MASTER
                      </text>

                      {/* 3. Phòng Ngủ Số 2 (Bedroom 2) */}
                      <rect x="410" y="240" width="240" height="140" fill="#0F172A" stroke="#334155" strokeWidth="2" />
                      <text x="530" y="305" fill="#FFFFFF" fontSize="13" fontFamily="serif" fontWeight="bold" textAnchor="middle">
                        PHÒNG NGỦ SỐ 2
                      </text>
                      <text x="530" y="325" fill="#C5A880" fontSize="10.5" fontFamily="monospace" textAnchor="middle">
                        11.5 m² (3.5m x 3.3m)
                      </text>

                      {/* 4. Khu Bếp & Logia Giặt Phơi */}
                      <rect x="50" y="260" width="220" height="120" fill="#131D2E" stroke="#334155" strokeWidth="2" />
                      <text x="160" y="315" fill="#FFFFFF" fontSize="13" fontFamily="serif" fontWeight="bold" textAnchor="middle">
                        BẾP ĐẢO HAFELE
                      </text>
                      <text x="160" y="335" fill="#C5A880" fontSize="10.5" fontFamily="monospace" textAnchor="middle">
                        12.0 m² (Hút mùi âm trần)
                      </text>

                      {/* Logia giặt phơi */}
                      <rect x="50" y="330" width="90" height="50" fill="#1E293B" stroke="#64748B" strokeWidth="1.5" strokeDasharray="3 2" />
                      <text x="95" y="360" fill="#94A3B8" fontSize="9" fontFamily="monospace" textAnchor="middle">
                        LOGIA GIẶT
                      </text>

                      {/* WC Chung */}
                      <rect x="270" y="260" width="140" height="120" fill="#1E293B" stroke="#334155" strokeWidth="2" />
                      <text x="340" y="315" fill="#E2E8F0" fontSize="12" fontFamily="serif" textAnchor="middle">
                        WC CHUNG
                      </text>
                      <text x="340" y="335" fill="#94A3B8" fontSize="10" fontFamily="monospace" textAnchor="middle">
                        4.0 m² (Kohler)
                      </text>

                      {/* Cửa chính ra vào (Main Entrance) */}
                      <g transform="translate(320, 380)">
                        <path d="M 0 0 A 40 40 0 0 1 40 -40" fill="none" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="2 2" />
                        <line x1="0" y1="0" x2="0" y2="-40" stroke="#F59E0B" strokeWidth="2" />
                        <text x="20" y="18" fill="#F59E0B" fontSize="9.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                          CỬA CHÍNH (FACEID)
                        </text>
                      </g>

                      {/* Thước đo tỉ lệ Laser CAD góc dưới */}
                      <g transform="translate(60, 400)">
                        <line x1="0" y1="0" x2="100" y2="0" stroke="#C5A880" strokeWidth="1.5" />
                        <line x1="0" y1="-3" x2="0" y2="3" stroke="#C5A880" strokeWidth="1.5" />
                        <line x1="50" y1="-3" x2="50" y2="3" stroke="#C5A880" strokeWidth="1.5" />
                        <line x1="100" y1="-3" x2="100" y2="3" stroke="#C5A880" strokeWidth="1.5" />
                        <text x="0" y="12" fill="#94A3B8" fontSize="8" fontFamily="monospace">0m</text>
                        <text x="50" y="12" fill="#94A3B8" fontSize="8" fontFamily="monospace">2.5m</text>
                        <text x="100" y="12" fill="#94A3B8" fontSize="8" fontFamily="monospace">5.0m</text>
                      </g>
                    </svg>

                    <div className="mt-4 pt-3 border-t border-[#1E293B] flex flex-wrap items-center justify-between text-xs text-gray-400 font-mono gap-2">
                      <span className="flex items-center gap-1.5 text-emerald-400">
                        <Check className="w-3.5 h-3.5" /> Bàn giao hoàn thiện full nội thất liền tường
                      </span>
                      <span>Hệ thống kính hộp Low-E 3 lớp dày 24mm</span>
                    </div>
                  </div>
                )}

                {/* TAB 2: PHỐI CẢNH NỘI THẤT */}
                {unitTab === 'FURNISHED' && (
                  <div className="relative border border-[#1E293B] bg-[#0E131C] h-[340px] sm:h-[440px] overflow-hidden rounded-lg shadow-xl group">
                    <img
                      src={photoData.url}
                      alt={activeUnit.code}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E17] via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 bg-[#0E131C]/90 border border-[#C5A880]/60 p-4 rounded backdrop-blur-md">
                      <div className="font-serif text-base sm:text-lg font-bold text-white">
                        Phối Cảnh Không Gian Căn Hộ {activeUnit.code} ({activeUnit.type})
                      </div>
                      <div className="text-xs text-gray-300 mt-1 font-light">
                        Phòng khách kết nối trực tiếp ban công đón gió tự nhiên. Hệ thống đèn LED rọi âm trần, sàn gỗ công nghiệp nhập khẩu Đức.
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: ẢNH THỰC TẾ BÀN GIAO */}
                {unitTab === 'PHOTO' && (
                  <div className="relative border border-[#1E293B] bg-[#0E131C] h-[340px] sm:h-[440px] overflow-hidden rounded-lg shadow-xl group">
                    <img
                      src={photoData.url}
                      alt={activeUnit.code}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute top-4 right-4 bg-[#0A0E17]/90 text-emerald-300 border border-emerald-500/50 px-3 py-1.5 rounded text-xs font-mono font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{activeUnit.status === 'OCCUPIED' ? 'Đã Bàn Giao Cư Dân' : 'Sẵn Sàng Bàn Giao'}</span>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 bg-[#0E131C]/90 border border-[#C5A880]/60 p-4 rounded backdrop-blur-md">
                      <div className="font-serif text-base sm:text-lg font-bold text-[#C5A880]">
                        {photoData.caption}
                      </div>
                      <div className="text-xs text-gray-300 mt-1">
                        Tiêu chuẩn bàn giao: Khóa điện tử FaceID sinh trắc học, Bếp Hafele, Thiết bị vệ sinh Kohler, Điều hòa âm trần Inverter.
                      </div>
                    </div>
                  </div>
                )}

                {/* BẢNG PHÂN BỔ DIỆN TÍCH PHÒNG (ROOM BREAKDOWN) */}
                <div className="border border-[#1E293B] bg-[#0E131C] rounded-lg p-4 sm:p-5">
                  <div className="text-xs font-mono uppercase tracking-wider text-[#C5A880] font-semibold mb-3 flex items-center justify-between">
                    <span>Bảng Phân Bổ Diện Tích Công Năng Căn Hộ</span>
                    <span className="text-gray-400">Tổng thông thủy: {activeUnit.area} m²</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {(ROOM_AREAS[activeUnit.type] || ROOM_AREAS['2PN']).map((room, idx) => (
                      <div key={idx} className="p-2.5 bg-[#121824] border border-[#1E293B] rounded">
                        <div className="text-[10px] text-gray-400 font-mono">{room.name}</div>
                        <div className="font-serif text-sm font-bold text-white mt-0.5">{room.area} m²</div>
                        <div className="text-[9.5px] text-[#C5A880] font-mono mt-0.5">{room.dim}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* CỘT PHẢI: THÔNG SỐ KỸ THUẬT BẤT ĐỘNG SẢN & BÁO GIÁ (4 CỘT) */}
              <div className="lg:col-span-4 space-y-4">
                {/* Thẻ Báo Giá & Thông Tin Trực Tiếp */}
                <div className="border border-[#C5A880]/60 bg-[#0E131C] rounded-lg p-5 sm:p-6 space-y-5 shadow-2xl relative">
                  <div className="flex items-center justify-between pb-4 border-b border-[#1E293B]">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Mã Căn Hộ</span>
                      <div className="font-serif text-2xl sm:text-3xl font-bold text-white mt-0.5">
                        {activeUnit.code}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-[#C5A880]">Giá Niêm Yết</span>
                      <div className="font-mono text-xl sm:text-2xl font-bold text-[#C5A880] mt-0.5">
                        {activeUnit.priceBillion.toFixed(2)} Tỷ VNĐ
                      </div>
                    </div>
                  </div>

                  {/* Danh sách thông số kỹ thuật chuẩn */}
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-[#1E293B]">
                      <span className="text-gray-400">Vị trí phân khu:</span>
                      <strong className="text-white font-mono">{activeUnit.towerName} • Tầng {activeUnit.floor}</strong>
                    </div>

                    <div className="flex items-center justify-between pb-2 border-b border-[#1E293B]">
                      <span className="text-gray-400">Loại hình căn hộ:</span>
                      <strong className="text-[#C5A880] font-mono">{activeUnit.typeLabel}</strong>
                    </div>

                    <div className="flex items-center justify-between pb-2 border-b border-[#1E293B]">
                      <span className="text-gray-400">Diện tích thông thủy (Net):</span>
                      <strong className="text-white font-mono text-sm">{activeUnit.area} m²</strong>
                    </div>

                    <div className="flex items-center justify-between pb-2 border-b border-[#1E293B]">
                      <span className="text-gray-400">Diện tích tim tường (Gross):</span>
                      <strong className="text-white font-mono">{activeUnit.wallArea} m²</strong>
                    </div>

                    <div className="flex items-center justify-between pb-2 border-b border-[#1E293B]">
                      <span className="text-gray-400">Cơ cấu phòng:</span>
                      <strong className="text-white font-mono">{activeUnit.bedrooms} Phòng Ngủ • {activeUnit.bathrooms} WC</strong>
                    </div>

                    <div className="flex items-center justify-between pb-2 border-b border-[#1E293B]">
                      <span className="text-gray-400">Hướng ban công:</span>
                      <strong className="text-emerald-400 font-mono">{activeUnit.direction} (Gió mát)</strong>
                    </div>

                    <div className="flex items-center justify-between pb-2 border-b border-[#1E293B]">
                      <span className="text-gray-400">Hướng cửa chính:</span>
                      <strong className="text-white font-mono">{activeUnit.mainDoorDirection || 'Tây Bắc'}</strong>
                    </div>

                    <div className="flex items-center justify-between pb-2 border-b border-[#1E293B]">
                      <span className="text-gray-400">Pháp lý sở hữu:</span>
                      <strong className="text-emerald-400 font-mono">Sổ Hồng Lâu Dài</strong>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-gray-400">Trạng thái căn hộ:</span>
                      <span className={`px-2.5 py-1 text-[10.5px] uppercase font-mono font-bold rounded ${
                        activeUnit.status === 'OCCUPIED'
                          ? 'bg-amber-950/80 border border-amber-500 text-amber-300'
                          : activeUnit.status === 'MAINTENANCE'
                          ? 'bg-blue-950/80 border border-blue-500 text-blue-300'
                          : 'bg-emerald-950/80 border border-emerald-500 text-emerald-300'
                      }`}>
                        {activeUnit.status === 'OCCUPIED' ? 'Đã Bàn Giao Cư Dân' : 'Sẵn Sàng Bàn Giao'}
                      </span>
                    </div>

                    {/* Hiển thị cư dân thực tế nếu là căn 12A05 */}
                    {activeUnit.owner && (
                      <div className="p-3 bg-[#161F2E] border border-[#C5A880]/40 rounded space-y-1 mt-2">
                        <div className="text-[10px] font-mono text-[#C5A880] uppercase tracking-wider">Căn Hộ Đã Nghiệm Thu Bàn Giao:</div>
                        <div className="text-sm font-bold text-white font-serif">{activeUnit.owner.name}</div>
                        <div className="text-[11px] text-gray-300 font-mono">Biên bản bàn giao: {activeUnit.handoverProtocol?.protocolCode || 'BBBG-SKYLINE-12A05'}</div>
                      </div>
                    )}
                  </div>

                  {/* Nút Gọi Hành Động Mua / Tham Quan */}
                  <div className="pt-3 space-y-2.5">
                    <button
                      type="button"
                      onClick={() => setIsRegisterModalOpen(true)}
                      className="w-full py-3 bg-[#C5A880] hover:bg-[#D4AF37] text-[#0A0E17] font-bold text-xs tracking-wider uppercase rounded transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                      <PhoneCall className="w-4 h-4" />
                      <span>Đăng Ký Xem Căn Hộ Thực Tế</span>
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
                      className="w-full py-2.5 bg-[#121824] hover:bg-[#1A2232] border border-[#2A374A] hover:border-[#C5A880]/60 text-gray-200 text-xs font-semibold tracking-wider uppercase rounded transition-all flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4 text-[#C5A880]" />
                      <span>Đăng Nhập Portal Quản Trị / Cư Dân</span>
                    </button>
                  </div>
                </div>

                {/* Danh Sách Căn Hộ Cùng Tầng Để Chuyển Đổi Nhanh */}
                <div className="border border-[#1E293B] bg-[#0E131C] rounded-lg p-4 space-y-3">
                  <div className="text-xs uppercase tracking-wider text-gray-400 font-mono font-semibold flex items-center justify-between">
                    <span>Căn Hộ Cùng Phân Khu ({currentFloorUnits.length})</span>
                    <span className="text-[#C5A880]">Chọn nhanh</span>
                  </div>

                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                    {currentFloorUnits.map((unit) => {
                      const isSelected = activeUnit.code === unit.code;
                      return (
                        <div
                          key={unit.code}
                          onClick={() => setSelectedUnitCode(unit.code)}
                          className={`p-2.5 rounded border transition-all cursor-pointer flex items-center justify-between text-xs ${
                            isSelected
                              ? 'bg-[#18212F] border-[#C5A880] text-white font-bold ring-1 ring-[#C5A880]/40'
                              : 'bg-[#121824] border-[#1E293B] text-gray-300 hover:border-gray-500'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[#C5A880]">Căn {unit.code}</span>
                            <span className="text-[10.5px] px-1.5 py-0.5 bg-[#1C2536] text-gray-300 rounded font-mono">
                              {unit.type}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="font-mono text-white">{unit.area} m²</div>
                            <div className="text-[10px] text-gray-400 font-mono">{unit.priceBillion.toFixed(2)} Tỷ</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================= */}
      {/* MODAL ĐĂNG KÝ THAM QUAN CĂN HỘ THỰC TẾ                       */}
      {/* ============================================================= */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0E131C] border border-[#C5A880]/60 rounded-xl p-6 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setIsRegisterModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-2 mb-6">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#C5A880] font-semibold">Trải Nghiệm Căn Hộ Skyline</span>
              <h3 className="font-serif text-xl font-bold text-white">
                Đăng Ký Tham Quan Căn Hộ {activeUnit.code}
              </h3>
              <p className="text-xs text-gray-400 font-light">
                Chuyên viên Ban Quản Lý sẽ liên hệ sắp xếp đón tiếp quý khách tham quan thực tế trong vòng 15 phút.
              </p>
            </div>

            {registerSuccess ? (
              <div className="p-6 bg-emerald-950/80 border border-emerald-500 rounded-lg text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <div className="font-serif text-base font-bold text-white">Đăng Ký Thành Công!</div>
                <div className="text-xs text-gray-300 font-light">
                  Ban Quản Lý Skyline đã ghi nhận yêu cầu tham quan Căn {activeUnit.code}.
                </div>
              </div>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
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
                  <label className="block text-gray-300 font-mono mb-1">Ghi Chú / Khung Giờ Muốn Xem:</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Xem nhà sáng thứ 7 lúc 9h30"
                    value={leadForm.note}
                    onChange={(e) => setLeadForm({ ...leadForm, note: e.target.value })}
                    className="w-full bg-[#121824] border border-[#1E293B] rounded p-2.5 text-white focus:outline-none focus:border-[#C5A880]"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 bg-[#C5A880] hover:bg-[#D4AF37] text-[#0A0E17] font-bold text-xs tracking-wider uppercase rounded transition-all shadow-lg"
                  >
                    Xác Nhận Đăng Ký Xem Nhà
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
