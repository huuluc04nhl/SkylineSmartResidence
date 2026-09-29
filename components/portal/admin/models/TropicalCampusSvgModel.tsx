'use client';

import React, { useState } from 'react';
import { 
  Compass, Maximize2, Sparkles, ChevronRight,
  Building2, Layers, MapPin, ZoomIn, ZoomOut, RotateCcw
} from 'lucide-react';
import { TropicalAmenity } from '../AdminBuildingApartmentManager';

interface TropicalCampusSvgModelProps {
  amenities: TropicalAmenity[];
  selectedBlock: string;
  onSelectBlock: (blockCode: any) => void;
  onSelectBlockAndShowFloors?: (blockCode: any) => void;
  hoveredAmenityId: string | null;
  onHoverAmenity: (id: string | null) => void;
  onOpenZoomModal?: () => void;
}

export default function TropicalCampusSvgModel({
  amenities,
  selectedBlock,
  onSelectBlock,
  onSelectBlockAndShowFloors,
  hoveredAmenityId,
  onHoverAmenity,
  onOpenZoomModal
}: TropicalCampusSvgModelProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [activeAmenityCategory, setActiveAmenityCategory] = useState<'ALL' | 'POOL' | 'PARK' | 'SPORT' | 'ACCESS'>('ALL');

  const activeAmenity = amenities.find(a => a.id === hoveredAmenityId);

  // 4 Khối Chung Cư chuẩn quy hoạch The Tropical (Tọa độ tự vẽ chuẩn kiến trúc 2.5D)
  const buildings = [
    {
      code: 'BS-07',
      shortCode: 'BS-7',
      name: 'Chung Cư BS-7',
      floors: 34,
      units: 714,
      loc: 'Trục Phố Cọ Rodeo & Vành Đai',
      badge: 'Căn Hộ Của Bạn (Tầng 30 • Căn CH-06)',
      isOwner: true,
      svgX: 170,
      svgY: 400,
      svgW: 210,
      svgH: 125,
      isCurrent: selectedBlock === 'BS-07' || selectedBlock === 'BS-7',
    },
    {
      code: 'BS-08',
      shortCode: 'BS-8',
      name: 'Chung Cư BS-8',
      floors: 39,
      units: 819,
      loc: 'Hướng Vườn Cọ & Sân Thiền',
      badge: '39 Tầng (Cao Nhất Phân Khu)',
      isOwner: false,
      svgX: 230,
      svgY: 70,
      svgW: 260,
      svgH: 110,
      isCurrent: selectedBlock === 'BS-08' || selectedBlock === 'BS-8',
    },
    {
      code: 'BS-09',
      shortCode: 'BS-9',
      name: 'Chung Cư BS-9',
      floors: 34,
      units: 714,
      loc: 'View Trực Diện Hồ Bơi Resort',
      badge: 'View Hồ Bơi Nhiệt Đới',
      isOwner: false,
      svgX: 635,
      svgY: 75,
      svgW: 175,
      svgH: 195,
      isCurrent: selectedBlock === 'BS-09' || selectedBlock === 'BS-9',
    },
    {
      code: 'BS-10',
      shortCode: 'BS-10',
      name: 'Chung Cư BS-10',
      floors: 34,
      units: 714,
      loc: 'Cụm Thể Thao Malibu & Bãi Đỗ Xe',
      badge: 'Gần Cụm Sân Malibu',
      isOwner: false,
      svgX: 575,
      svgY: 400,
      svgW: 235,
      svgH: 125,
      isCurrent: selectedBlock === 'BS-10' || selectedBlock === 'BS-10',
    }
  ];

  const handleBlockClick = (blockCode: string) => {
    if (onSelectBlockAndShowFloors) {
      onSelectBlockAndShowFloors(blockCode);
    } else {
      onSelectBlock(blockCode);
    }
  };

  // Tọa độ SVG tự vẽ cho 23 tiện ích chuẩn khớp với bản vẽ kiến trúc
  const AMENITY_SVG_POSITIONS: Record<string, { x: number; y: number }> = {
    '01': { x: 280, y: 575 }, // Phố cọ Rodeo
    '02': { x: 480, y: 260 }, // Bể bơi nhiệt đới
    '03': { x: 440, y: 295 }, // Bể bơi ốc đảo
    '04': { x: 100, y: 150 }, // Bể bơi Malibu
    '05': { x: 410, y: 350 }, // Nhà phụ trợ bể bơi
    '06': { x: 610, y: 310 }, // Sân chơi trẻ em
    '07': { x: 550, y: 215 }, // Sân Gym ngoài trời
    '08': { x: 315, y: 260 }, // Sân yoga
    '09': { x: 470, y: 215 }, // Suối bậc cảnh quan
    '10': { x: 475, y: 375 }, // Vườn cọ nhiệt đới Honolulu
    '11': { x: 270, y: 320 }, // Vườn California
    '12': { x: 710, y: 310 }, // Vườn San Mario
    '13': { x: 865, y: 340 }, // Biển tên The Tropical
    '14': { x: 535, y: 255 }, // Chòi nghỉ
    '15': { x: 570, y: 275 }, // Giàn cảnh quan
    '16': { x: 385, y: 280 }, // Ghế nghỉ Sunken
    'Y-01': { x: 100, y: 325 }, // Sân cỏ đa năng
    'Y-02': { x: 100, y: 375 }, // Thác nước điểm nhấn
    'Y-03': { x: 100, y: 280 }, // Artwork điểm nhấn
    'Y-04': { x: 100, y: 220 }, // Sân thể thao
    'P': { x: 795, y: 345 }, // Bãi đỗ xe
    'D': { x: 385, y: 430 }, // Lối vào sảnh Drop-off
    'H': { x: 475, y: 435 }, // Lối xuống hầm
  };

  // Chia danh sách tiện ích làm 2 cột chuẩn 100% theo bản phân loại
  const colLeftAmenities = amenities.slice(0, 12);
  const colRightAmenities = amenities.slice(12);

  return (
    <div className="relative bg-[#06090F] border border-[#1E293B] rounded-none overflow-hidden select-none shadow-2xl flex flex-col">
      
      {/* THANH TIÊU ĐỀ ĐIỀU HÀNH & NÚT THU PHÓNG */}
      <div className="px-3.5 py-2.5 bg-[#0B111A] border-b border-[#1E293B] flex flex-wrap items-center justify-between gap-2.5 text-xs font-mono">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#141E2D] border border-[#23354C] text-[#C5A880]">
            <Compass className="w-3.5 h-3.5 text-[#C5A880]" />
            <span className="font-bold tracking-wider uppercase text-[11px]">
              QUY HOẠCH KIẾN TRÚC PHÂN KHU THE TROPICAL (MÔ HÌNH TỰ VẼ 2.5D)
            </span>
          </div>
          <span className="text-gray-400 text-[11px] hidden md:inline">
            Chọn Chung Cư để chuyển tới danh sách số tầng
          </span>
        </div>

        {/* Cụm nút điều khiển & Thu phóng */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setZoomLevel(prev => Math.max(0.7, Number((prev - 0.15).toFixed(2))))}
              className="p-1 bg-[#121A26] hover:bg-[#1A2637] border border-[#223247] text-gray-300 hover:text-white"
              title="Thu nhỏ"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(1)}
              className="px-2 py-0.5 bg-[#090D14] border border-[#223247] text-[#C5A880] text-[11px] min-w-[48px] text-center hover:bg-[#121A26]"
              title="Mặc định 100%"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(prev => Math.min(2.0, Number((prev + 0.15).toFixed(2))))}
              className="p-1 bg-[#121A26] hover:bg-[#1A2637] border border-[#223247] text-gray-300 hover:text-white"
              title="Phóng to"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {onOpenZoomModal && (
            <button
              type="button"
              onClick={onOpenZoomModal}
              className="px-2.5 py-1 bg-[#C5A880] hover:bg-[#D4BC96] text-black font-bold flex items-center gap-1 transition-all"
              title="Phóng to toàn màn hình"
            >
              <Maximize2 className="w-3 h-3" />
              <span className="text-[10.5px]">Toàn Cảnh</span>
            </button>
          )}
        </div>
      </div>

      {/* THANH 4 KHỐI CHUNG CƯ NỔI BẬT: BẤM ĐỂ XEM DANH SÁCH TẦNG */}
      <div className="p-2.5 bg-[#0B1017] border-b border-[#1E293B]">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-mono text-[#C5A880] font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" />
            4 Khối Chung Cư Phân Khu The Tropical (Nhấp để xem danh sách số tầng):
          </span>
          <span className="text-[10.5px] text-gray-400 font-mono hidden sm:inline">
            Đang chọn: <strong className="text-white font-bold">{selectedBlock}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {buildings.map(b => (
            <button
              key={b.code}
              type="button"
              onClick={() => handleBlockClick(b.code)}
              className={`p-2 border text-left transition-all relative group ${
                b.isCurrent
                  ? 'bg-gradient-to-r from-[#1E293B] to-[#121B27] border-[#C5A880] ring-1 ring-[#C5A880]'
                  : 'bg-[#0E1522] border-[#222E3E] hover:border-gray-500 hover:bg-[#151E2B]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`font-mono font-bold text-xs ${b.isCurrent ? 'text-[#C5A880]' : 'text-white'}`}>
                  {b.name}
                </span>
                <span className="text-[9.5px] px-1.5 py-0.2 bg-[#C5A880]/20 text-[#C5A880] border border-[#C5A880]/40 font-mono font-bold">
                  {b.floors} Tầng
                </span>
              </div>
              <div className="text-[10px] text-gray-400 mt-1 flex items-center justify-between font-mono">
                <span>{b.units} Căn Hộ</span>
                <span className="text-emerald-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 font-bold">
                  Xem Số Tầng <ChevronRight className="w-3 h-3" />
                </span>
              </div>
              {b.isOwner && (
                <div className="text-[9px] text-amber-300 font-mono font-semibold mt-0.5 truncate">
                  ⭐ Căn Của Bạn (Tầng 30)
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VÙNG MÔ HÌNH KIẾN TRÚC SVG TỰ VẼ 100% (KHÔNG SỬ DỤNG HÌNH ĐÈ)             */}
      {/* ========================================================================= */}
      <div className="relative w-full h-[500px] sm:h-[550px] bg-[#070B12] overflow-hidden flex items-center justify-center">
        
        <svg
          viewBox="0 0 1000 640"
          className="w-full h-full object-contain transition-transform duration-200"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <defs>
            {/* Gradient Bể Bơi Resort Nhiệt Đới */}
            <linearGradient id="svgPoolGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#0891B2" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#0E7490" stopOpacity="1" />
            </linearGradient>

            {/* Gradient Bể Bơi Malibu */}
            <linearGradient id="svgMalibuGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#0284C7" stopOpacity="0.95" />
            </linearGradient>

            {/* Gradient Cảnh Quan Cây Xanh Vườn Cọ */}
            <radialGradient id="svgParkGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#064E3B" stopOpacity="0.8" />
              <stop offset="70%" stopColor="#022C22" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#061A14" stopOpacity="0.95" />
            </radialGradient>

            {/* Hiệu ứng hào quang Chung Cư đang chọn */}
            <filter id="svgGoldGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#C5A880" floodOpacity="0.9" />
            </filter>

            {/* Đổ bóng cho khối kiến trúc 2.5D */}
            <filter id="svgBuildingShadow" x="-10%" y="-10%" width="130%" height="130%">
              <feDropShadow dx="5" dy="8" stdDeviation="6" floodColor="#000000" floodOpacity="0.9" />
            </filter>

            {/* Họa tiết lưới cửa sổ kính kiến trúc */}
            <pattern id="svgWindowPattern" width="16" height="12" patternUnits="userSpaceOnUse">
              <rect width="16" height="12" fill="#0F172A" />
              <rect x="2" y="2" width="12" height="8" rx="1" fill="#1E293B" stroke="#334155" strokeWidth="0.5" />
              <line x1="8" y1="2" x2="8" y2="10" stroke="#0F172A" strokeWidth="0.8" />
            </pattern>

            {/* Pattern đường chạy & lối đi */}
            <pattern id="svgWalkwayPattern" width="8" height="8" patternUnits="userSpaceOnUse">
              <rect width="8" height="8" fill="#192333" />
              <circle cx="4" cy="4" r="1.5" fill="#2A3B50" />
            </pattern>
          </defs>

          {/* 1. KHUÔN VIÊN ĐẤT QUY HOẠCH TOÀN KHU THE TROPICAL */}
          <rect x="35" y="25" width="930" height="590" rx="30" fill="#080D16" stroke="#1E293B" strokeWidth="2.5" />
          
          {/* Đường vành đai ranh giới phân khu */}
          <rect x="50" y="40" width="900" height="560" rx="24" fill="none" stroke="#C5A880" strokeWidth="1.5" strokeDasharray="10 8" opacity="0.35" />

          {/* Mảng xanh cảnh quan công viên nội khu */}
          <path
            d="M 60,50 L 940,50 C 940,50 940,590 940,590 L 60,590 Z"
            fill="url(#svgParkGrad)"
            opacity="0.85"
          />

          {/* 2. HẠ TẦNG GIAO THÔNG: ĐƯỜNG VÀNH ĐAI & TRỤC PHỐ CỌ RODEO */}
          {/* Trục Phố Cọ Rodeo (Mặt tiền chính phía dưới) */}
          <rect x="60" y="555" width="880" height="35" rx="4" fill="#0F172A" stroke="#253549" strokeWidth="1.5" />
          <line x1="70" y1="572" x2="930" y2="572" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="14 10" opacity="0.7" />
          <text x="500" y="577" fill="#C5A880" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle" letterSpacing="3">
            ★ TRỤC ĐẠI LỘ THƯƠNG MẠI PHỐ CỌ RODEO ★
          </text>

          {/* Đường nội bộ nối các sảnh chung cư */}
          <path
            d="M 120,555 L 120,400 Q 120,300 200,280 L 320,280 Q 420,280 440,360 L 440,555"
            fill="none"
            stroke="#1E293B"
            strokeWidth="16"
          />
          <path
            d="M 560,555 L 560,370 Q 560,280 650,280 L 850,280 L 850,555"
            fill="none"
            stroke="#1E293B"
            strokeWidth="16"
          />

          {/* Đường đi dạo bộ rải sỏi uốn lượn ven hồ */}
          <path
            d="M 200,220 C 260,180 340,190 380,230 C 440,290 540,290 600,230 C 660,180 740,200 780,240"
            fill="none"
            stroke="#C5A880"
            strokeWidth="3"
            strokeDasharray="4 4"
            opacity="0.5"
          />

          {/* 3. CỤM TIỆN ÍCH MẶT NƯỚC: HỒ BƠI NHIỆT ĐỚI RESORT TRUNG TÂM */}
          {/* Bể bơi nhiệt đới uốn lượn tự nhiên (02) */}
          <path
            d="M 360,240 C 410,190 530,180 610,230 C 660,270 650,340 590,380 C 520,410 420,400 370,350 C 330,310 330,270 360,240 Z"
            fill="url(#svgPoolGrad)"
            stroke="#38BDF8"
            strokeWidth="3"
            filter="drop-shadow(0 4px 12px rgba(6, 182, 212, 0.4))"
          />

          {/* Làn sóng nước biểu tượng */}
          <path
            d="M 400,260 Q 440,240 480,260 T 560,260"
            fill="none"
            stroke="#E0F2FE"
            strokeWidth="1.5"
            opacity="0.6"
          />
          <path
            d="M 410,310 Q 450,290 490,310 T 570,310"
            fill="none"
            stroke="#E0F2FE"
            strokeWidth="1.5"
            opacity="0.6"
          />

          {/* Đảo cảnh quan giữa hồ - Bể bơi ốc đảo (03) */}
          <ellipse cx="490" cy="300" rx="35" ry="22" fill="#064E3B" stroke="#10B981" strokeWidth="2" />
          <text x="490" y="303" fill="#A7F3D0" fontSize="8" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">
            ỐC ĐẢO CỌ
          </text>

          {/* Ghế nghỉ Sunken (16) chìm trong lòng hồ */}
          <rect x="365" y="270" width="30" height="20" rx="4" fill="#0C4A6E" stroke="#38BDF8" strokeWidth="1.5" />
          <text x="380" y="283" fill="#BAE6FD" fontSize="7" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
            SUNKEN
          </text>

          {/* Chòi nghỉ cabana ven hồ (14) */}
          <polygon points="530,240 545,225 560,240 555,255 535,255" fill="#78350F" stroke="#F59E0B" strokeWidth="1.5" />

          {/* Nhãn hồ bơi trung tâm */}
          <text x="490" y="245" fill="#FFFFFF" fontSize="11" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle" filter="drop-shadow(0 1px 2px #000)">
            BỂ BƠI NHIỆT ĐỚI RESORT (800m²)
          </text>

          {/* 4. CỤM TIỆN ÍCH MALIBU PHÍA TÂY (BỂ BƠI MALIBU & SÂN THỂ THAO) */}
          {/* Bể bơi Malibu chuẩn phong cách California (04) */}
          <rect x="75" y="110" width="55" height="85" rx="6" fill="url(#svgMalibuGrad)" stroke="#38BDF8" strokeWidth="2" />
          <line x1="88" y1="115" x2="88" y2="190" stroke="#BAE6FD" strokeWidth="1" strokeDasharray="3 3" opacity="0.7" />
          <line x1="102" y1="115" x2="102" y2="190" stroke="#BAE6FD" strokeWidth="1" strokeDasharray="3 3" opacity="0.7" />
          <line x1="118" y1="115" x2="118" y2="190" stroke="#BAE6FD" strokeWidth="1" strokeDasharray="3 3" opacity="0.7" />
          <text x="102" y="152" fill="#FFFFFF" fontSize="8" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle" transform="rotate(-90 102 152)">
            BỂ BƠI MALIBU
          </text>

          {/* Sân thể thao đa năng (Y-04: Tennis / Bóng rổ) */}
          <rect x="75" y="205" width="55" height="40" rx="3" fill="#065F46" stroke="#34D399" strokeWidth="1.5" />
          <rect x="80" y="210" width="45" height="30" fill="none" stroke="#A7F3D0" strokeWidth="1" />
          <line x1="102" y1="210" x2="102" y2="240" stroke="#FFFFFF" strokeWidth="1" />
          <text x="102" y="228" fill="#ECFDF5" fontSize="7" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">
            SÂN TENNIS
          </text>

          {/* Sân cỏ đa năng (Y-01) */}
          <rect x="75" y="305" width="55" height="40" rx="4" fill="#047857" stroke="#10B981" strokeWidth="1.5" />
          <text x="102" y="328" fill="#D1FAE5" fontSize="7" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">
            SÂN CỎ ĐA NĂNG
          </text>

          {/* 5. CẢNH QUAN CÔNG VIÊN & VƯỜN CHỦ ĐỀ */}
          {/* Vườn cọ Honolulu (10) */}
          <circle cx="475" cy="375" r="22" fill="#064E3B" stroke="#059669" strokeWidth="1.5" />
          <text x="475" y="378" fill="#6EE7B7" fontSize="8" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">
            VƯỜN CỌ
          </text>

          {/* Sân Yoga (08) */}
          <polygon points="315,245 335,260 315,275 295,260" fill="#78350F" stroke="#D97706" strokeWidth="1.5" />
          <text x="315" y="263" fill="#FDE68A" fontSize="7" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">
            YOGA
          </text>

          {/* Sân chơi trẻ em (06) */}
          <circle cx="610" cy="310" r="18" fill="#831843" stroke="#F43F5E" strokeWidth="1.5" />
          <text x="610" y="313" fill="#FECDD3" fontSize="7" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">
            KIDS
          </text>

          {/* Bãi đỗ xe thông minh (P) */}
          <rect x="765" y="325" width="60" height="40" rx="3" fill="#1E293B" stroke="#64748B" strokeWidth="1.5" />
          <text x="795" y="348" fill="#94A3B8" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
            PARKING
          </text>

          {/* ===================================================================== */}
          {/* 6. VẼ 4 KHỐI CHUNG CƯ 2.5D KIẾN TRÚC THE TROPICAL                      */}
          {/* ===================================================================== */}
          {buildings.map(b => (
            <g
              key={b.code}
              onClick={() => handleBlockClick(b.code)}
              className="cursor-pointer group"
              filter={b.isCurrent ? 'url(#svgGoldGlow)' : 'url(#svgBuildingShadow)'}
            >
              {/* Bóng chân toà nhà */}
              <rect
                x={b.svgX + 8}
                y={b.svgY + 10}
                width={b.svgW}
                height={b.svgH}
                rx="6"
                fill="#000000"
                opacity="0.8"
              />

              {/* Thân toà nhà chính (Kiến trúc hiện đại) */}
              <rect
                x={b.svgX}
                y={b.svgY}
                width={b.svgW}
                height={b.svgH}
                rx="6"
                fill={b.isCurrent ? '#162235' : '#0F172A'}
                stroke={b.isCurrent ? '#C5A880' : '#334155'}
                strokeWidth={b.isCurrent ? 2.5 : 1.5}
              />

              {/* Lớp họa tiết cửa sổ kính kiến trúc */}
              <rect
                x={b.svgX + 4}
                y={b.svgY + 28}
                width={b.svgW - 8}
                height={b.svgH - 58}
                fill="url(#svgWindowPattern)"
                opacity="0.85"
              />

              {/* Mái toà nhà kiến trúc (Roof Top Crown) */}
              <rect
                x={b.svgX}
                y={b.svgY}
                width={b.svgW}
                height={26}
                rx="6"
                fill={b.isCurrent ? '#1E2D42' : '#141E2D'}
                stroke={b.isCurrent ? '#C5A880' : '#334155'}
                strokeWidth="1"
              />

              {/* Tên Chung Cư & Số Tầng */}
              <text
                x={b.svgX + 12}
                y={b.svgY + 17}
                fill={b.isCurrent ? '#FFFFFF' : '#F1F5F9'}
                fontSize="12"
                fontWeight="bold"
                fontFamily="monospace"
              >
                {b.name}
              </text>
              <rect
                x={b.svgX + b.svgW - 65}
                y={b.svgY + 5}
                width={55}
                height={16}
                rx="2"
                fill={b.isCurrent ? '#C5A880' : '#1E293B'}
              />
              <text
                x={b.svgX + b.svgW - 37}
                y={b.svgY + 17}
                fill={b.isCurrent ? '#000000' : '#94A3B8'}
                fontSize="9.5"
                fontWeight="bold"
                fontFamily="monospace"
                textAnchor="middle"
              >
                {b.floors} TẦNG
              </text>

              {/* Badge Căn Chủ Hộ (Dành riêng cho BS-7 Tầng 30) */}
              {b.isOwner && (
                <g>
                  <rect
                    x={b.svgX + 8}
                    y={b.svgY + 34}
                    width={b.svgW - 16}
                    height={18}
                    rx="2"
                    fill="#78350F"
                    stroke="#F59E0B"
                    strokeWidth="1"
                  />
                  <text
                    x={b.svgX + b.svgW / 2}
                    y={b.svgY + 46}
                    fill="#FEF08A"
                    fontSize="9"
                    fontWeight="bold"
                    fontFamily="sans-serif"
                    textAnchor="middle"
                  >
                    ⭐ CĂN CỦA BẠN: TẦNG 30 (CH-06)
                  </text>
                </g>
              )}

              {/* Nút Call To Action chuyển tới Danh Sách Số Tầng */}
              <rect
                x={b.svgX + 10}
                y={b.svgY + b.svgH - 26}
                width={b.svgW - 20}
                height={20}
                rx="3"
                fill={b.isCurrent ? '#C5A880' : '#1E293B'}
                stroke={b.isCurrent ? '#FFFFFF' : '#334155'}
                strokeWidth="1"
                className="transition-all group-hover:brightness-125"
              />
              <text
                x={b.svgX + b.svgW / 2}
                y={b.svgY + b.svgH - 13}
                fill={b.isCurrent ? '#000000' : '#E2E8F0'}
                fontSize="9.5"
                fontWeight="bold"
                fontFamily="monospace"
                textAnchor="middle"
              >
                {b.isCurrent ? `★ XEM ${b.floors} TẦNG & CĂN HỘ ➔` : `Bấm Xem ${b.floors} Tầng ➔`}
              </text>
            </g>
          ))}

          {/* ===================================================================== */}
          {/* 7. LỚP GHIM ĐỊNH VỊ 23 TIỆN ÍCH NỘI KHU THE TROPICAL TRỰC TIẾP SVG     */}
          {/* ===================================================================== */}
          {amenities.map(item => {
            const pos = AMENITY_SVG_POSITIONS[item.id] || { x: item.x * 9.5, y: item.y * 6.0 };
            const isHovered = hoveredAmenityId === item.id;
            const isGold = item.isGoldBadge;
            const isSpecialCode = item.id === 'P' || item.id === 'D' || item.id === 'H';

            return (
              <g
                key={item.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                className="cursor-pointer"
                onMouseEnter={() => onHoverAmenity(item.id)}
                onMouseLeave={() => onHoverAmenity(null)}
              >
                {/* Vòng pulse phát sáng khi hover */}
                {isHovered && (
                  <circle
                    r="18"
                    fill="#C5A880"
                    opacity="0.4"
                    className="animate-ping"
                  />
                )}

                {/* Bóng đổ của ghim */}
                <circle
                  cx="1"
                  cy="2"
                  r={isHovered ? 12 : 9}
                  fill="#000000"
                  opacity="0.6"
                />

                {/* Vòng tròn ghim chuẩn phong cách Chủ Đầu Tư:
                    - Số tròn đen viền trắng (01 đến 16)
                    - Số tròn vàng viền vàng kim (01 đến 04 vàng)
                    - Ký hiệu chữ P, D, ▼
                */}
                <circle
                  r={isHovered ? 12 : 9}
                  fill={
                    isHovered
                      ? '#C5A880'
                      : isGold
                      ? '#F59E0B'
                      : isSpecialCode
                      ? '#1E293B'
                      : '#000000'
                  }
                  stroke={
                    isHovered
                      ? '#FFFFFF'
                      : isGold
                      ? '#FEF08A'
                      : '#94A3B8'
                  }
                  strokeWidth={isHovered ? 2 : 1.2}
                  className="transition-all duration-150"
                />

                {/* Số / Ký tự bên trong ghim */}
                <text
                  y="3"
                  fill={
                    isHovered
                      ? '#000000'
                      : isGold
                      ? '#000000'
                      : '#FFFFFF'
                  }
                  fontSize={isHovered ? 10 : 8}
                  fontWeight="bold"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {item.displayNumber || item.id}
                </text>
              </g>
            );
          })}
        </svg>

        {/* HUD OVERLAY GÓC TRÁI DƯỚI: THÔNG TIN TIỆN ÍCH ĐANG RÊ CHUỘT */}
        {activeAmenity && (
          <div className="absolute bottom-3 left-3 bg-[#0A0F17]/95 border border-[#C5A880] p-3 max-w-sm backdrop-blur-md shadow-2xl animate-in fade-in duration-150 pointer-events-none z-30">
            <div className="flex items-center justify-between text-[#C5A880] font-mono text-[10.5px] uppercase font-bold tracking-wider pb-1 border-b border-[#1E293B]">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Vị Trí #{activeAmenity.displayNumber || activeAmenity.id}
              </span>
              <span className="text-cyan-300 font-bold">{activeAmenity.distance}</span>
            </div>
            <div className="text-white font-bold text-sm mt-1.5">
              {activeAmenity.name}
            </div>
            <div className="text-gray-300 text-[11px] mt-1 leading-relaxed">
              {activeAmenity.desc}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* BẢNG DANH MỤC 23 TIỆN ÍCH NỘI KHU CHUẨN 100% THEO SƠ ĐỒ CHỦ ĐẦU TƯ         */}
      {/* ========================================================================= */}
      <div className="p-3 bg-[#0A0E17] border-t border-[#1E293B] space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
            <span>DANH MỤC 23 TIỆN ÍCH NỘI KHU THE TROPICAL (RÊ CHUỘT ĐỂ ĐỊNH VỊ)</span>
          </div>
          <span className="text-[10.5px] text-gray-400 font-mono">
            Tổng cộng: {amenities.length} hạng mục tiện ích
          </span>
        </div>

        {/* 2 CỘT DANH MỤC TIỆN ÍCH CHUẨN HÌNH ẢNH */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 font-sans text-xs">
          
          {/* CỘT TRÁI (01 ĐẾN 12) */}
          <div className="space-y-1">
            {colLeftAmenities.map(item => {
              const isHovered = hoveredAmenityId === item.id;
              return (
                <div
                  key={item.id}
                  onMouseEnter={() => onHoverAmenity(item.id)}
                  onMouseLeave={() => onHoverAmenity(null)}
                  className={`p-1.5 px-2 rounded-sm flex items-center justify-between cursor-pointer transition-all ${
                    isHovered
                      ? 'bg-[#1C2838] border border-[#C5A880] text-white shadow'
                      : 'bg-[#0E1522] border border-transparent hover:border-gray-600 text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-5 h-5 rounded-full font-mono text-[9px] font-bold flex items-center justify-center shrink-0 ${
                      isHovered
                        ? 'bg-[#C5A880] text-black'
                        : 'bg-black text-white border border-gray-600'
                    }`}>
                      {item.displayNumber || item.id}
                    </span>
                    <span className="font-medium text-[11.5px] truncate">
                      {item.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-300/80 shrink-0 ml-1">
                    {item.distance.replace('Cách BS-07: ', '').replace('Liền kề BS-07 ', '')}
                  </span>
                </div>
              );
            })}
          </div>

          {/* CỘT PHẢI (13 ĐẾN 16, 01-04 VÀNG, P, D, ▼) */}
          <div className="space-y-1">
            {colRightAmenities.map(item => {
              const isHovered = hoveredAmenityId === item.id;
              return (
                <div
                  key={item.id}
                  onMouseEnter={() => onHoverAmenity(item.id)}
                  onMouseLeave={() => onHoverAmenity(null)}
                  className={`p-1.5 px-2 rounded-sm flex items-center justify-between cursor-pointer transition-all ${
                    isHovered
                      ? 'bg-[#1C2838] border border-[#C5A880] text-white shadow'
                      : 'bg-[#0E1522] border border-transparent hover:border-gray-600 text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-5 h-5 rounded-full font-mono text-[9px] font-bold flex items-center justify-center shrink-0 ${
                      isHovered
                        ? 'bg-[#C5A880] text-black'
                        : item.isGoldBadge
                        ? 'bg-[#F59E0B] text-black font-bold'
                        : 'bg-black text-white border border-gray-600'
                    }`}>
                      {item.displayNumber || item.id}
                    </span>
                    <span className="font-medium text-[11.5px] truncate">
                      {item.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-300/80 shrink-0 ml-1">
                    {item.distance.replace('Cách BS-07: ', '')}
                  </span>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
}
