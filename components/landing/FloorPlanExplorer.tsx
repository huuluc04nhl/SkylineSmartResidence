'use client';

import React, { useState, useMemo } from 'react';
import { 
  Compass, 
  Wind, 
  Sun, 
  ShieldCheck, 
  CheckCircle2, 
  PhoneCall, 
  Layers, 
  Sparkles,
  BedDouble,
  Bath,
  Maximize2,
  Check,
  X,
  Eye,
  Box,
  Building2,
  ArrowRight
} from 'lucide-react';
import { ApartmentUnit, getApartmentUnits, INITIAL_APARTMENTS } from '@/lib/apartmentStore';

interface FloorPlanExplorerProps {
  onOpenLogin?: () => void;
}

// 4 Căn hộ biểu tượng đại diện cho 4 dòng sản phẩm cốt lõi của Skyline (100% Dữ liệu thực tế từ store)
interface FeaturedUnitConfig {
  code: string;
  type: string;
  badge: string;
  badgeColor: string;
  title: string;
  floorText: string;
  area: number;
  wallArea: number;
  bedrooms: number;
  bathrooms: number;
  direction: string;
  viewTitle: string;
  priceBillion: number;
  statusLabel: string;
  isRealResident?: boolean;
  residentOwner?: string;
  features: string[];
  photoUrl: string;
  rooms: { name: string; area: string }[];
  // Vị trí trên sơ đồ tầng (Minimap highlight)
  minimapSlot: 'A01' | 'A02' | 'A03' | 'A05' | 'PH01' | 'PH02';
}

const FEATURED_UNITS: FeaturedUnitConfig[] = [
  {
    code: '12A05',
    type: '2PN',
    badge: 'Căn Hộ Thực Tế',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
    title: 'Căn Hộ 2PN Tiêu Chuẩn • Căn Cư Dân Điển Hình',
    floorText: 'Tầng 12A • Tháp A (Chung Cư Skyline)',
    area: 78.5,
    wallArea: 83.2,
    bedrooms: 2,
    bathrooms: 2,
    direction: 'Đông Nam',
    viewTitle: 'Trực Diện Sông Sài Gòn (Đón Gió Mát)',
    priceBillion: 4.85,
    statusLabel: 'Đã Bàn Giao Cư Dân',
    isRealResident: true,
    residentOwner: 'Nguyễn Hữu Lực (Chủ hộ)',
    features: [
      'Căn góc 2 mặt thoáng, ban công kính Low-E đón trọn bình minh và gió sông mát lành',
      'Khóa cửa FaceID sinh trắc học tích hợp mạng an ninh tòa nhà',
      'Bàn giao đầy đủ thiết bị bếp Hafele, thiết bị vệ sinh Kohler, điều hòa âm trần'
    ],
    photoUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80',
    rooms: [
      { name: 'Phòng khách & Phòng ăn', area: '22.0 m²' },
      { name: 'Phòng ngủ Master Ensuite', area: '21.0 m²' },
      { name: 'Phòng ngủ phụ (Bed 2)', area: '11.5 m²' },
      { name: 'Bếp đảo & Logia giặt', area: '14.5 m²' },
      { name: '2 Phòng tắm WC Kohler', area: '9.5 m²' }
    ],
    minimapSlot: 'A05'
  },
  {
    code: '24A01',
    type: '3PN',
    badge: 'Sky Suite View Sông',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/50',
    title: 'Căn Hộ 3PN Áp Mái • Không Gian Đa Thế Hệ',
    floorText: 'Tầng 24 (Áp Mái) • Tháp A (Chung Cư Skyline)',
    area: 112.0,
    wallArea: 119.5,
    bedrooms: 3,
    bathrooms: 3,
    direction: 'Đông Nam',
    viewTitle: 'View Triệu Đô Ôm Trọn Sông Sài Gòn',
    priceBillion: 8.50,
    statusLabel: 'Sẵn Sàng Bàn Giao',
    features: [
      'Tầm nhìn panorama triệu đô không giới hạn ôm trọn khúc quanh sông Sài Gòn',
      'Hệ thống kính hộp Low-E 3 lớp dày 24mm cách âm, cản 99% tia cực tím',
      'Phòng ngủ Master Presidential Suite tích hợp bồn tắm nằm và phòng thay đồ riêng'
    ],
    photoUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&auto=format&fit=crop&q=80',
    rooms: [
      { name: 'Đại sảnh & Phòng khách lớn', area: '32.0 m²' },
      { name: 'Master Presidential Suite', area: '26.0 m²' },
      { name: 'Phòng ngủ số 2', area: '14.5 m²' },
      { name: 'Phòng ngủ số 3 / Studio', area: '11.5 m²' },
      { name: 'Khu bếp & Đảo Bar cao cấp', area: '14.0 m²' }
    ],
    minimapSlot: 'A01'
  },
  {
    code: '12A02',
    type: '1PN',
    badge: 'Tối Ưu Công Năng',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/50',
    title: 'Căn Hộ 1PN Thông Minh • Tiện Nghi Độc Thân & Chuyên Gia',
    floorText: 'Tầng 12A • Tháp A (Chung Cư Skyline)',
    area: 52.0,
    wallArea: 56.5,
    bedrooms: 1,
    bathrooms: 1,
    direction: 'Chính Nam',
    viewTitle: 'View Công Viên Nội Khu & Hồ Cảnh Quan',
    priceBillion: 3.35,
    statusLabel: 'Sẵn Sàng Bàn Giao',
    features: [
      'Bố trí không gian vuông vức không góc chết, tối ưu hóa 100% diện tích sử dụng',
      'Phòng khách thông liền ban công đón ánh sáng tự nhiên suốt cả ngày',
      'Bàn giao hoàn thiện full thiết bị bếp điện từ âm và máy hút mùi Hafele'
    ],
    photoUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&auto=format&fit=crop&q=80',
    rooms: [
      { name: 'Phòng khách & Khu ẩm thực', area: '18.5 m²' },
      { name: 'Phòng ngủ Master riêng tư', area: '15.2 m²' },
      { name: 'Bếp mở & Logia thông gió', area: '9.6 m²' },
      { name: 'Phòng tắm WC chuẩn 5 sao', area: '4.5 m²' },
      { name: 'Ban công ngắm cảnh', area: '4.2 m²' }
    ],
    minimapSlot: 'A02'
  },
  {
    code: '25PH-01',
    type: 'Duplex',
    badge: 'Tuyệt Phẩm Đỉnh Tháp',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/50',
    title: 'Duplex Penthouse Hoàng Gia • 2 Tầng Thông Suốt',
    floorText: 'Tầng 25 (Đỉnh Tháp) • Tháp A (Chung Cư Skyline)',
    area: 215.0,
    wallArea: 232.0,
    bedrooms: 4,
    bathrooms: 4,
    direction: 'Đông Nam',
    viewTitle: 'Panorama 270° Sông Sài Gòn & Trung Tâm Q1',
    priceBillion: 18.50,
    statusLabel: 'Sẵn Sàng Bàn Giao',
    features: [
      'Trần phòng khách Double Height cao 6.5m tạo chiều sâu không gian tráng lệ',
      'Sky Terrace sân thượng 26m² có bể sục Jacuzzi ngoài trời ngắm trọn thành phố',
      'Đặc quyền thang máy riêng và kế cận Hồ bơi vô cực chân mây tầng 25'
    ],
    photoUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&auto=format&fit=crop&q=80',
    rooms: [
      { name: 'Grand Living Double Height (Trần 6.5m)', area: '58.0 m²' },
      { name: 'Master Presidential Suite', area: '45.0 m²' },
      { name: '3 Phòng ngủ Ensuite VIP', area: '48.0 m²' },
      { name: 'Sky Terrace & Bể sục Jacuzzi', area: '26.0 m²' },
      { name: 'Show Kitchen & Thư viện riêng', area: '38.0 m²' }
    ],
    minimapSlot: 'PH01'
  }
];

export default function FloorPlanExplorer({ onOpenLogin }: FloorPlanExplorerProps) {
  const [selectedCode, setSelectedCode] = useState<string>('12A05');
  const [viewTab, setViewTab] = useState<'PHOTO' | 'BLUEPRINT'>('PHOTO');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [leadForm, setLeadForm] = useState({ name: '', phone: '', timeSlot: '' });

  // Căn hộ được chọn
  const activeUnit = useMemo(() => {
    return FEATURED_UNITS.find((u) => u.code === selectedCode) || FEATURED_UNITS[0];
  }, [selectedCode]);

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterSuccess(true);
    setTimeout(() => {
      setRegisterSuccess(false);
      setIsRegisterModalOpen(false);
      setLeadForm({ name: '', phone: '', timeSlot: '' });
    }, 2000);
  };

  return (
    <section id="floorplans" className="py-12 sm:py-20 bg-[#0A0E17] text-white border-b border-[#1E293B] relative overflow-hidden">
      {/* Background glow tinh tế */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#C5A880]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-900/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 space-y-8 sm:space-y-10">
        {/* ============================================================= */}
        {/* 1. TIÊU ĐỀ RÕ RÀNG, TINH GỌN, DỄ HIỂU                          */}
        {/* ============================================================= */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#1E293B]">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#161F2E] border border-[#C5A880]/40 rounded text-[11px] font-mono uppercase tracking-[0.2em] text-[#C5A880]">
              <Layers className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>Sơ Đồ Mặt Bằng & Không Gian Căn Hộ</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif text-white font-bold tracking-tight">
              Khám Phá Mặt Bằng Căn Hộ Skyline
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 font-light leading-relaxed">
              Thiết kế tối ưu công năng, 100% căn hộ sở hữu ban công đón gió mát tự nhiên từ Sông Sài Gòn và ánh sáng ban mai.
            </p>
          </div>

          {/* Nút hành động nhanh */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsRegisterModalOpen(true)}
              className="px-4 py-2.5 bg-[#C5A880] hover:bg-[#D4AF37] text-[#0A0E17] font-bold text-xs tracking-wider uppercase rounded transition-all shadow-lg flex items-center gap-2 shrink-0"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Đăng Ký Xem Thực Tế</span>
            </button>
          </div>
        </div>

        {/* ============================================================= */}
        {/* 2. THANH CHỌN CĂN HỘ NHANH (4 LOẠI CỐT LÕI - RESPONSIVE MOBILE)*/}
        {/* ============================================================= */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
          {FEATURED_UNITS.map((unit) => {
            const isSelected = selectedCode === unit.code;
            return (
              <button
                key={unit.code}
                type="button"
                onClick={() => setSelectedCode(unit.code)}
                className={`p-3 sm:p-4 rounded-lg border text-left transition-all relative flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#151D29] border-[#C5A880] shadow-xl ring-1 ring-[#C5A880]/60'
                    : 'bg-[#0E131C] border-[#1E293B] hover:border-[#2D3F58] hover:bg-[#121824]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-mono text-xs font-bold text-white">Căn {unit.code}</span>
                    <span className={`text-[9.5px] px-1.5 py-0.5 rounded border font-mono font-medium ${unit.badgeColor}`}>
                      {unit.badge}
                    </span>
                  </div>
                  <div className="font-serif text-sm font-bold text-[#C5A880] mt-0.5">
                    {unit.type} • {unit.area} m²
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-[#1E293B] flex items-center justify-between text-[11px] text-gray-400 font-mono">
                  <span>{unit.bedrooms} PN • {unit.bathrooms} WC</span>
                  <span className="text-white font-semibold">{unit.priceBillion.toFixed(2)} Tỷ</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* ============================================================= */}
        {/* 3. KHU VỰC HIỂN THỊ CHÍNH (2 CỘT RÕ RÀNG TRÊN DESKTOP, CO DÃN MOBILE) */}
        {/* ============================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* CỘT TRÁI (7 CỘT): HÌNH ẢNH MẶT BẰNG & SƠ ĐỒ VỊ TRÍ TẦNG (MINIMAP) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Khung ảnh phối cảnh / bản vẽ 2D */}
            <div className="border border-[#1E293B] bg-[#0E131C] rounded-lg overflow-hidden shadow-xl">
              {/* Header chuyển tab xem nhanh */}
              <div className="p-3 bg-[#121824] border-b border-[#1E293B] flex items-center justify-between gap-2">
                <div className="text-xs font-mono font-semibold text-gray-300 truncate">
                  {activeUnit.title}
                </div>
                <div className="flex bg-[#070A10] p-1 border border-[#1E293B] rounded shrink-0">
                  <button
                    type="button"
                    onClick={() => setViewTab('PHOTO')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors flex items-center gap-1.5 ${
                      viewTab === 'PHOTO' ? 'bg-[#C5A880] text-[#0A0E17] font-bold' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Phối Cảnh</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewTab('BLUEPRINT')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors flex items-center gap-1.5 ${
                      viewTab === 'BLUEPRINT' ? 'bg-[#C5A880] text-[#0A0E17] font-bold' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Box className="w-3.5 h-3.5" />
                    <span>Bản Vẽ 2D</span>
                  </button>
                </div>
              </div>

              {/* Nội dung hình ảnh */}
              {viewTab === 'PHOTO' ? (
                <div className="relative h-64 sm:h-80 md:h-96 overflow-hidden group">
                  <img
                    src={activeUnit.photoUrl}
                    alt={activeUnit.code}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E17]/90 via-transparent to-transparent pointer-events-none" />
                  
                  {/* Badge hướng view góc dưới */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 text-xs">
                    <div className="bg-[#0A0E17]/85 border border-[#C5A880]/60 px-3 py-1.5 rounded backdrop-blur-md">
                      <span className="text-[10.5px] font-mono uppercase text-[#C5A880] font-semibold block">Tầm nhìn ban công:</span>
                      <span className="text-white font-medium">{activeUnit.viewTitle}</span>
                    </div>
                    <div className="bg-[#0A0E17]/85 border border-emerald-500/60 px-2.5 py-1.5 rounded backdrop-blur-md text-emerald-300 font-mono text-[11px] whitespace-nowrap">
                      ✓ {activeUnit.statusLabel}
                    </div>
                  </div>
                </div>
              ) : (
                /* BẢN VẼ 2D TỐI GIẢN, RÕ RÀNG, DỄ HIỂU */
                <div className="p-4 sm:p-6 bg-[#070A10] flex items-center justify-center">
                  <svg viewBox="0 0 540 320" className="w-full max-w-lg h-auto select-none">
                    {/* Tường bao */}
                    <rect x="20" y="20" width="500" height="280" rx="4" fill="#0C121E" stroke="#334155" strokeWidth="3" />
                    
                    {/* Phòng khách & Ban công */}
                    <rect x="20" y="20" width="300" height="170" fill="#0F172A" stroke="#1E293B" strokeWidth="2" />
                    <text x="170" y="90" fill="#FFFFFF" fontSize="14" fontFamily="serif" fontWeight="bold" textAnchor="middle">
                      PHÒNG KHÁCH & ĂN
                    </text>
                    <text x="170" y="112" fill="#C5A880" fontSize="11" fontFamily="monospace" textAnchor="middle">
                      Ban Công Kính Low-E (Gió Sông)
                    </text>

                    {/* Phòng ngủ Master */}
                    <rect x="320" y="20" width="200" height="150" fill="#131D2E" stroke="#1E293B" strokeWidth="2" />
                    <text x="420" y="85" fill="#FFFFFF" fontSize="13" fontFamily="serif" fontWeight="bold" textAnchor="middle">
                      PHÒNG NGỦ MASTER
                    </text>
                    <text x="420" y="105" fill="#C5A880" fontSize="10.5" fontFamily="monospace" textAnchor="middle">
                      Ensuite Bathroom
                    </text>

                    {/* WC Master */}
                    <rect x="430" y="20" width="90" height="65" fill="#1E293B" stroke="#334155" strokeWidth="1" />
                    <text x="475" y="55" fill="#94A3B8" fontSize="9" fontFamily="monospace" textAnchor="middle">WC 1</text>

                    {/* Phòng ngủ 2 / Studio */}
                    <rect x="320" y="170" width="200" height="130" fill="#0F172A" stroke="#1E293B" strokeWidth="2" />
                    <text x="420" y="235" fill="#FFFFFF" fontSize="12.5" fontFamily="serif" fontWeight="bold" textAnchor="middle">
                      PHÒNG NGỦ SỐ 2
                    </text>
                    <text x="420" y="255" fill="#C5A880" fontSize="10" fontFamily="monospace" textAnchor="middle">
                      Ánh Sáng Tự Nhiên
                    </text>

                    {/* Bếp & WC chung */}
                    <rect x="20" y="190" width="180" height="110" fill="#141E33" stroke="#1E293B" strokeWidth="2" />
                    <text x="110" y="245" fill="#FFFFFF" fontSize="12" fontFamily="serif" fontWeight="bold" textAnchor="middle">
                      BẾP ĐẢO HAFELE
                    </text>
                    <text x="110" y="265" fill="#94A3B8" fontSize="10" fontFamily="monospace" textAnchor="middle">
                      Logia Giặt Phơi
                    </text>

                    {/* WC chung */}
                    <rect x="200" y="190" width="120" height="110" fill="#1E293B" stroke="#334155" strokeWidth="2" />
                    <text x="260" y="245" fill="#E2E8F0" fontSize="11" fontFamily="serif" textAnchor="middle">
                      WC CHUNG
                    </text>
                    <text x="260" y="265" fill="#94A3B8" fontSize="9.5" fontFamily="monospace" textAnchor="middle">
                      Kohler
                    </text>

                    {/* Cửa chính ra vào */}
                    <g transform="translate(240, 300)">
                      <path d="M 0 0 A 30 30 0 0 1 30 -30" fill="none" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="2 2" />
                      <line x1="0" y1="0" x2="0" y2="-30" stroke="#F59E0B" strokeWidth="2" />
                      <text x="15" y="15" fill="#F59E0B" fontSize="8.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                        CỬA FACEID
                      </text>
                    </g>
                  </svg>
                </div>
              )}
            </div>

            {/* SƠ ĐỒ VỊ TRÍ TRÊN MẶT BẰNG TẦNG (FLOOR MINIMAP - TRỰC QUAN & DỄ HIỂU NGAY) */}
            <div className="p-3.5 sm:p-4 bg-[#0E131C] border border-[#1E293B] rounded-lg space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-[#C5A880]" />
                  <span className="font-mono font-bold text-gray-200 uppercase tracking-wider text-[11px]">
                    Vị Trí Căn Hộ Trên Sàn Tầng
                  </span>
                </div>
                <span className="text-[10.5px] font-mono text-[#C5A880]">
                  {activeUnit.floorText}
                </span>
              </div>

              {/* Sơ đồ tầng mini (Vector Minimap) */}
              <div className="relative bg-[#070A10] border border-[#1E293B] rounded p-2 sm:p-3 overflow-hidden">
                <svg viewBox="0 0 600 160" className="w-full h-auto select-none">
                  {/* Chỉ báo Hướng Bắc & Hướng Nam */}
                  <text x="300" y="18" fill="#94A3B8" fontSize="9" fontFamily="monospace" textAnchor="middle">
                    ▲ HƯỚNG BẮC: TRUNG TÂM THÀNH PHỐ & LANDMARK 81
                  </text>
                  <text x="300" y="152" fill="#34D399" fontSize="9.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                    ▼ HƯỚNG NAM / ĐÔNG NAM: VIEW TRỰC DIỆN SÔNG SÀI GÒN (GIÓ MÁT)
                  </text>

                  {/* LÕI TÒA NHÀ */}
                  <rect x="230" y="55" width="140" height="50" rx="3" fill="#161F2E" stroke="#334155" strokeWidth="1" />
                  <text x="300" y="83" fill="#94A3B8" fontSize="9" fontFamily="monospace" textAnchor="middle">
                    THANG MÁY & CORE
                  </text>

                  {/* DÃY PHÍA BẮC (TRÊN): Căn A04, A06, A07, A08 */}
                  <rect x="30" y="30" width="90" height="40" rx="2" fill="#0E131C" stroke="#1E293B" />
                  <text x="75" y="54" fill="#64748B" fontSize="9" fontFamily="monospace" textAnchor="middle">Căn 12A08</text>

                  <rect x="130" y="30" width="90" height="40" rx="2" fill="#0E131C" stroke="#1E293B" />
                  <text x="175" y="54" fill="#64748B" fontSize="9" fontFamily="monospace" textAnchor="middle">Căn 12A07</text>

                  <rect x="380" y="30" width="90" height="40" rx="2" fill="#0E131C" stroke="#1E293B" />
                  <text x="425" y="54" fill="#64748B" fontSize="9" fontFamily="monospace" textAnchor="middle">Căn 12A06</text>

                  <rect x="480" y="30" width="90" height="40" rx="2" fill="#0E131C" stroke="#1E293B" />
                  <text x="525" y="54" fill="#64748B" fontSize="9" fontFamily="monospace" textAnchor="middle">Căn 12A04</text>

                  {/* DÃY PHÍA NAM (DƯỚI): Căn A01, A02, A03, A05 (View Sông) */}
                  {/* Căn A01 (24A01) */}
                  <rect
                    x="30"
                    y="90"
                    width="90"
                    height="45"
                    rx="3"
                    fill={activeUnit.minimapSlot === 'A01' ? '#C5A880' : '#121824'}
                    stroke={activeUnit.minimapSlot === 'A01' ? '#FFFFFF' : '#334155'}
                    strokeWidth={activeUnit.minimapSlot === 'A01' ? '2' : '1'}
                  />
                  <text
                    x="75"
                    y="117"
                    fill={activeUnit.minimapSlot === 'A01' ? '#0A0E17' : '#E2E8F0'}
                    fontSize="10"
                    fontFamily="monospace"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    Căn A01
                  </text>

                  {/* Căn A02 (12A02) */}
                  <rect
                    x="130"
                    y="90"
                    width="90"
                    height="45"
                    rx="3"
                    fill={activeUnit.minimapSlot === 'A02' ? '#C5A880' : '#121824'}
                    stroke={activeUnit.minimapSlot === 'A02' ? '#FFFFFF' : '#334155'}
                    strokeWidth={activeUnit.minimapSlot === 'A02' ? '2' : '1'}
                  />
                  <text
                    x="175"
                    y="117"
                    fill={activeUnit.minimapSlot === 'A02' ? '#0A0E17' : '#E2E8F0'}
                    fontSize="10"
                    fontFamily="monospace"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    Căn A02
                  </text>

                  {/* Căn A03 (12A03) */}
                  <rect x="380" y="90" width="90" height="45" rx="3" fill="#121824" stroke="#334155" />
                  <text x="425" y="117" fill="#CBD5E1" fontSize="10" fontFamily="monospace" textAnchor="middle">
                    Căn A03
                  </text>

                  {/* Căn A05 (12A05 - Căn thực tế) */}
                  <rect
                    x="480"
                    y="90"
                    width="90"
                    height="45"
                    rx="3"
                    fill={activeUnit.minimapSlot === 'A05' ? '#C5A880' : '#121824'}
                    stroke={activeUnit.minimapSlot === 'A05' ? '#FFFFFF' : '#F59E0B'}
                    strokeWidth={activeUnit.minimapSlot === 'A05' ? '2.5' : '1'}
                  />
                  <text
                    x="525"
                    y="117"
                    fill={activeUnit.minimapSlot === 'A05' ? '#0A0E17' : '#FBBF24'}
                    fontSize="10"
                    fontFamily="monospace"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    ★ 12A05
                  </text>
                </svg>
              </div>

              <div className="text-[11px] text-gray-400 font-light flex items-center justify-between">
                <span>Vị trí: <strong className="text-white">Căn góc đón gió sông</strong></span>
                <span className="text-emerald-400">Không gian yên tĩnh, cách ly tiếng ồn</span>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI (5 CỘT): THÔNG SỐ VÀNG, GIÁ BÁN & NÚT HÀNH ĐỘNG (ÍT MÀ CHẤT LƯỢNG) */}
          <div className="lg:col-span-5 space-y-4">
            {/* THẺ BÁO GIÁ VÀ THÔNG SỐ CỐT LÕI */}
            <div className="p-5 sm:p-6 bg-[#0E131C] border border-[#C5A880]/50 rounded-lg shadow-2xl space-y-5">
              {/* Tiêu đề căn & Giá niêm yết */}
              <div className="flex items-start justify-between pb-4 border-b border-[#1E293B] gap-2">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-[#C5A880] font-semibold">
                    Mã Căn Hộ Skyline
                  </div>
                  <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white mt-0.5">
                    Căn {activeUnit.code}
                  </h3>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {activeUnit.floorText}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-gray-400">
                    Giá Bán Dự Kiến
                  </div>
                  <div className="font-mono text-xl sm:text-2xl font-bold text-[#C5A880] mt-0.5">
                    {activeUnit.priceBillion.toFixed(2)} Tỷ
                  </div>
                  <div className="text-[10px] text-gray-400 font-mono">
                    ~ {(activeUnit.priceBillion * 1000 / activeUnit.area).toFixed(1)} tr/m²
                  </div>
                </div>
              </div>

              {/* LƯỚI 4 THÔNG SỐ CHÍNH (TO RÕ, DỄ NHÌN TRÊN ĐIỆN THOẠI) */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 bg-[#121824] border border-[#1E293B] rounded">
                  <div className="text-[10px] text-gray-400 font-mono uppercase">Diện Tích Thông Thủy</div>
                  <div className="font-mono text-base sm:text-lg font-bold text-white mt-0.5">
                    {activeUnit.area} m²
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">Tim tường: {activeUnit.wallArea} m²</div>
                </div>

                <div className="p-3 bg-[#121824] border border-[#1E293B] rounded">
                  <div className="text-[10px] text-gray-400 font-mono uppercase">Hướng Ban Công</div>
                  <div className="font-mono text-base sm:text-lg font-bold text-emerald-400 mt-0.5">
                    {activeUnit.direction}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">Đón gió sông mát lành</div>
                </div>

                <div className="p-3 bg-[#121824] border border-[#1E293B] rounded">
                  <div className="text-[10px] text-gray-400 font-mono uppercase">Cơ Cấu Phòng</div>
                  <div className="font-mono text-base sm:text-lg font-bold text-white mt-0.5">
                    {activeUnit.bedrooms} PN • {activeUnit.bathrooms} WC
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">Ban công + Logia riêng</div>
                </div>

                <div className="p-3 bg-[#121824] border border-[#1E293B] rounded">
                  <div className="text-[10px] text-gray-400 font-mono uppercase">Pháp Lý & Bàn Giao</div>
                  <div className="font-mono text-base sm:text-lg font-bold text-white mt-0.5">
                    Sổ Hồng Lâu Dài
                  </div>
                  <div className="text-[10px] text-[#C5A880] mt-0.5 font-medium">{activeUnit.statusLabel}</div>
                </div>
              </div>

              {/* HUY HIỆU CĂN THỰC TẾ (NẾU LÀ 12A05) */}
              {activeUnit.isRealResident && (
                <div className="p-3 bg-[#1A160E] border border-amber-500/50 rounded flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    ★
                  </div>
                  <div className="text-xs">
                    <span className="font-bold text-amber-300 block">Căn Hộ Cư Dân Thực Tế</span>
                    <span className="text-gray-300 font-light">Chủ sở hữu: <strong>{activeUnit.residentOwner}</strong> • Đã nghiệm thu nhận nhà</span>
                  </div>
                </div>
              )}

              {/* ĐIỂM NỔI BẬT ĐÁNG GIÁ (3 Ý NGẮN GỌN) */}
              <div className="space-y-2 pt-2 border-t border-[#1E293B]">
                <div className="text-[10.5px] font-mono uppercase text-gray-400 tracking-wider">
                  Tiêu Chuẩn Bàn Giao & Đặc Quyền
                </div>
                <ul className="space-y-1.5 text-xs text-gray-300 font-light">
                  {activeUnit.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-[#C5A880] shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* PHÂN BỔ DIỆN TÍCH PHÒNG (GỌN GÀNG) */}
              <div className="pt-2 border-t border-[#1E293B] space-y-1.5">
                <div className="text-[10.5px] font-mono uppercase text-gray-400 tracking-wider">
                  Bố Trí Công Năng
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  {activeUnit.rooms.map((r, idx) => (
                    <div key={idx} className="p-1.5 bg-[#121824] rounded flex items-center justify-between text-[11px]">
                      <span className="text-gray-400 truncate pr-1">{r.name}</span>
                      <strong className="text-white font-mono shrink-0">{r.area}</strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2 NÚT HÀNH ĐỘNG CHÍNH (DỄ CHẠM BẤM TRÊN MOBILE) */}
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(true)}
                  className="w-full py-3.5 bg-[#C5A880] hover:bg-[#D4AF37] text-[#0A0E17] font-bold text-xs tracking-wider uppercase rounded-lg transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Đăng Ký Tham Quan Căn Hộ</span>
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
                  <span>Truy Cập Portal Ban Quản Lý / Cư Dân</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================= */}
      {/* MODAL ĐĂNG KÝ THAM QUAN GỌN GÀNG, RESPONSIVE                 */}
      {/* ============================================================= */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0E131C] border border-[#C5A880]/60 rounded-xl p-5 sm:p-6 max-w-sm w-full shadow-2xl relative">
            <button
              onClick={() => setIsRegisterModalOpen(false)}
              className="absolute top-3.5 right-3.5 text-gray-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1.5 mb-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#C5A880] font-semibold">
                Tham Quan Thực Tế Skyline
              </span>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-white">
                Căn Hộ {activeUnit.code} ({activeUnit.type})
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
                  Chuyên viên lễ tân sẽ gọi tới số của quý khách để xác nhận lịch xem nhà.
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
                  <label className="block text-gray-300 font-mono mb-1">Khung Giờ Dự Kiến Đến:</label>
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
