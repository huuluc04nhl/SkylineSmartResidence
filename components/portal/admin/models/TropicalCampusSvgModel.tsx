'use client';

import React, { useState } from 'react';
import { 
  Waves, Trees, Dumbbell, Compass, Maximize2, 
  Sparkles, CheckCircle2, ChevronRight, Eye, Navigation
} from 'lucide-react';
import { TropicalAmenity } from '../AdminBuildingApartmentManager';

interface TropicalCampusSvgModelProps {
  amenities: TropicalAmenity[];
  selectedBlock: string;
  onSelectBlock: (blockCode: any) => void;
  hoveredAmenityId: string | null;
  onHoverAmenity: (id: string | null) => void;
  onOpenZoomModal?: () => void;
}

export default function TropicalCampusSvgModel({
  amenities,
  selectedBlock,
  onSelectBlock,
  hoveredAmenityId,
  onHoverAmenity,
  onOpenZoomModal
}: TropicalCampusSvgModelProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const activeAmenity = amenities.find(a => a.id === hoveredAmenityId);

  // Danh sách 4 Chung Cư thuộc phân khu The Tropical
  const buildings = [
    {
      code: 'BS-07',
      name: 'Chung Cư BS-07',
      floors: 34,
      units: 714,
      x: 170,
      y: 190,
      width: 140,
      height: 220,
      direction: 'Tây - Hướng Phố Cọ Rodeo & Vành Đai',
      isCurrent: selectedBlock === 'BS-07',
      badge: 'Căn Hộ Của Bạn (Tầng 30)'
    },
    {
      code: 'BS-08',
      name: 'Chung Cư BS-08',
      floors: 39,
      units: 819,
      x: 390,
      y: 70,
      width: 200,
      height: 120,
      direction: 'Bắc - Hướng Vườn Cọ & Sân Thiền',
      isCurrent: selectedBlock === 'BS-08',
      badge: '39 Tầng (Cao Nhất)'
    },
    {
      code: 'BS-09',
      name: 'Chung Cư BS-09',
      floors: 34,
      units: 714,
      x: 690,
      y: 150,
      width: 140,
      height: 220,
      direction: 'Đông Bắc - Hướng Trực Diện Hồ Bơi',
      isCurrent: selectedBlock === 'BS-09',
      badge: 'View Hồ Bơi Resort'
    },
    {
      code: 'BS-10',
      name: 'Chung Cư BS-10',
      floors: 34,
      units: 714,
      x: 710,
      y: 410,
      width: 150,
      height: 160,
      direction: 'Đông Nam - Hướng Sân Malibu',
      isCurrent: selectedBlock === 'BS-10',
      badge: 'Cụm Thể Thao Malibu'
    }
  ];

  return (
    <div className="relative bg-[#06090F] border border-[#1E293B] rounded-none overflow-hidden select-none shadow-2xl flex flex-col">
      {/* Thanh công cụ đỉnh bản đồ vector */}
      <div className="px-3.5 py-2 bg-[#0B111A] border-b border-[#1E293B] flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#141E2D] border border-[#23354C] text-[#C5A880]">
            <Compass className="w-3.5 h-3.5 text-[#C5A880] animate-spin-slow" />
            <span className="font-bold tracking-wider uppercase text-[11px]">Mô Hình Quy Hoạch Tự Vẽ The Tropical (2.5D Vector)</span>
          </div>
          <span className="text-gray-400 text-[11px] hidden sm:inline">
            Tỉ lệ kiến trúc 1:500 • Phân khu The Beverly Solari
          </span>
        </div>

        {/* Công cụ thu phóng & toàn màn hình */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setZoomLevel(prev => Math.max(0.8, Number((prev - 0.2).toFixed(1))))}
            className="px-2 py-0.5 bg-[#121A26] hover:bg-[#1A2637] border border-[#223247] text-gray-300 hover:text-white"
            title="Thu nhỏ"
          >
            -
          </button>
          <span className="px-2 py-0.5 bg-[#090D14] border border-[#223247] text-[#C5A880] text-[11px] min-w-[48px] text-center">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoomLevel(prev => Math.min(2.0, Number((prev + 0.2).toFixed(1))))}
            className="px-2 py-0.5 bg-[#121A26] hover:bg-[#1A2637] border border-[#223247] text-gray-300 hover:text-white"
            title="Phóng to"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => { setZoomLevel(1); setPanOffset({ x: 0, y: 0 }); }}
            className="px-2 py-0.5 bg-[#121A26] hover:bg-[#1A2637] border border-[#223247] text-gray-300 hover:text-white text-[10px]"
          >
            Mặc Định
          </button>
          {onOpenZoomModal && (
            <button
              type="button"
              onClick={onOpenZoomModal}
              className="px-2.5 py-0.5 bg-[#C5A880] hover:bg-[#D4BC96] text-black font-bold flex items-center gap-1 ml-1 transition-all"
              title="Phóng to toàn màn hình"
            >
              <Maximize2 className="w-3 h-3" />
              <span className="text-[10.5px]">Toàn Cảnh</span>
            </button>
          )}
        </div>
      </div>

      {/* KHUNG HIỂN THỊ SVG MÔ HÌNH KIẾN TRÚC TỰ VẼ */}
      <div className="relative w-full h-[460px] sm:h-[500px] bg-[#070B12] overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing">
        
        {/* Lưới tọa độ bản vẽ kiến trúc nền */}
        <div 
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #38BDF8 1px, transparent 0)`,
            backgroundSize: '24px 24px'
          }}
        />

        {/* SVG CHÍNH: TỰ VẼ TOÀN BỘ PHÂN KHU & TIỆN ÍCH */}
        <svg
          viewBox="0 0 1000 640"
          className="w-full h-full object-contain transition-transform duration-200 ease-out"
          style={{
            transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
            transformOrigin: 'center center'
          }}
        >
          <defs>
            {/* Gradient cho nước hồ bơi nhiệt đới */}
            <linearGradient id="tropicalPoolGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#0891B2" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#0E7490" stopOpacity="0.95" />
            </linearGradient>

            {/* Gradient cho cây xanh cảnh quan nhiệt đới */}
            <radialGradient id="greenGardenGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
              <stop offset="70%" stopColor="#064E3B" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#022C22" stopOpacity="0.8" />
            </radialGradient>

            {/* Gradient sàn gạch lát đi dạo */}
            <linearGradient id="pavedWalkGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1E293B" />
              <stop offset="100%" stopColor="#0F172A" />
            </linearGradient>

            {/* Hiệu ứng bóng đổ kiến trúc 2.5D */}
            <filter id="buildingShadow" x="-10%" y="-10%" width="130%" height="130%">
              <feDropShadow dx="8" dy="12" stdDeviation="6" floodColor="#000000" floodOpacity="0.7" />
            </filter>

            {/* Glow ánh vàng cho Chung Cư BS-07 đang chọn */}
            <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#C5A880" floodOpacity="0.8" />
            </filter>

            {/* Pattern thảm cỏ cảnh quan */}
            <pattern id="grassTexture" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="#047857" opacity="0.3" />
              <circle cx="12" cy="12" r="1.2" fill="#10B981" opacity="0.25" />
            </pattern>
          </defs>

          {/* 1. RANH GIỚI VÀ KHUÔN VIÊN TỔNG THỂ PHÂN KHU (TERRAIN) */}
          <rect x="30" y="20" width="940" height="600" rx="24" fill="#0A0E17" stroke="#1E293B" strokeWidth="2" />
          <rect x="40" y="30" width="920" height="580" rx="18" fill="url(#grassTexture)" opacity="0.4" />

          {/* Đường trục giao thông bao quanh: Phố Cọ Rodeo (Phía Tây) */}
          <rect x="50" y="40" width="60" height="560" rx="8" fill="#111827" stroke="#374151" strokeWidth="1.5" />
          <line x1="80" y1="40" x2="80" y2="600" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="8 6" opacity="0.6" />
          <text x="80" y="320" fill="#9CA3AF" fontSize="10" fontFamily="monospace" transform="rotate(-90 80 320)" textAnchor="middle" letterSpacing="3">
            ĐẠI LỘ THƯƠNG MẠI RODEO DRIVE
          </text>

          {/* Vành đai giao thông nội khu (Đường xe & Drop-off) */}
          <path
            d="M 110,60 H 910 V 580 H 110 Z"
            fill="none"
            stroke="#1F2937"
            strokeWidth="20"
            strokeLinejoin="round"
          />
          <path
            d="M 110,60 H 910 V 580 H 110 Z"
            fill="none"
            stroke="#C5A880"
            strokeWidth="1.5"
            strokeDasharray="10 8"
            strokeOpacity="0.4"
            strokeLinejoin="round"
          />

          {/* 2. KHU VỰC CẢNH QUAN XANH TRUNG TÂM (TROPICAL OASIS GARDENS) */}
          {/* Mảng vườn cọ Honolulu */}
          <path
            d="M 160,100 C 260,80 340,110 360,200 C 370,280 290,340 180,310 Z"
            fill="url(#greenGardenGrad)"
            stroke="#059669"
            strokeWidth="1.5"
            strokeOpacity="0.5"
          />
          {/* Mảng vườn San Mario & đường dạo California */}
          <path
            d="M 200,430 C 320,410 440,430 480,510 C 460,570 320,580 210,560 Z"
            fill="url(#greenGardenGrad)"
            stroke="#059669"
            strokeWidth="1.5"
            strokeOpacity="0.5"
          />
          {/* Mảng vườn thiền & Yoga */}
          <path
            d="M 600,80 C 660,70 700,100 680,140 C 650,180 590,160 580,120 Z"
            fill="url(#greenGardenGrad)"
            stroke="#059669"
            strokeWidth="1"
            strokeOpacity="0.4"
          />

          {/* 3. TỰ VẼ HỒ BƠI NHIỆT ĐỚI RESORT OASIS TRUNG TÂM (800m²) */}
          {/* Boong sàn gỗ tắm nắng (Pool Deck) bao quanh */}
          <path
            d="M 360,230 C 420,180 580,170 660,240 C 700,310 680,410 600,460 C 520,500 400,480 340,400 C 300,330 310,270 360,230 Z"
            fill="#1E293B"
            stroke="#334155"
            strokeWidth="2"
          />

          {/* Mặt nước hồ bơi nhiệt đới uốn lượn phong cách Resort */}
          <path
            d="M 375,245 C 430,200 565,190 645,250 C 680,315 660,395 585,445 C 510,480 410,465 355,390 C 320,325 330,280 375,245 Z"
            fill="url(#tropicalPoolGrad)"
            stroke="#38BDF8"
            strokeWidth="2.5"
            className="filter drop-shadow"
          />

          {/* Đường bơi chuẩn Olympic (Lap pool 50m) vạch kẻ trong lòng hồ */}
          <path d="M 420,290 L 600,290" stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="6 4" strokeOpacity="0.7" />
          <path d="M 410,320 L 620,320" stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="6 4" strokeOpacity="0.7" />
          <path d="M 400,350 L 610,350" stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="6 4" strokeOpacity="0.7" />

          {/* Khu hồ bơi trẻ em & vòi phun nước nông */}
          <circle cx="390" cy="410" r="32" fill="#22D3EE" fillOpacity="0.8" stroke="#67E8F9" strokeWidth="2" />
          <circle cx="390" cy="410" r="16" fill="none" stroke="#FFFFFF" strokeWidth="1" strokeDasharray="3 3" opacity="0.8" />
          <text x="390" y="413" fill="#0C4A6E" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">KIDS</text>

          {/* Sunken Lounge chìm thư giãn độc bản giữa hồ nước */}
          <circle cx="510" cy="335" r="28" fill="#0F172A" stroke="#C5A880" strokeWidth="2.5" />
          <circle cx="510" cy="335" r="18" fill="#1E293B" stroke="#64748B" strokeWidth="1" />
          <circle cx="510" cy="335" r="6" fill="#F59E0B" />
          <text x="510" y="322" fill="#C5A880" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="monospace">SUNKEN</text>

          {/* Chòi nghỉ Cabana & ghế tắm nắng ven hồ */}
          {[
            { cx: 460, cy: 195 },
            { cx: 520, cy: 190 },
            { cx: 580, cy: 200 },
            { cx: 640, cy: 370 },
            { cx: 460, cy: 475 },
            { cx: 520, cy: 470 }
          ].map((c, i) => (
            <g key={i}>
              <rect x={c.cx - 8} y={c.cy - 6} width="16" height="12" rx="2" fill="#334155" stroke="#C5A880" strokeWidth="1" />
              <line x1={c.cx - 6} y1={c.cy} x2={c.cx + 6} y2={c.cy} stroke="#F8FAFC" strokeWidth="1" strokeOpacity="0.6" />
            </g>
          ))}

          {/* 4. CỤM THỂ THAO MALIBU (TENNIS & BÓNG RỔ PHÍA ĐÔNG NAM) */}
          <g transform="translate(680, 290)">
            {/* Sân Tennis chuẩn thi đấu */}
            <rect x="0" y="0" width="110" height="70" rx="4" fill="#065F46" stroke="#10B981" strokeWidth="1.5" />
            <rect x="10" y="8" width="90" height="54" fill="none" stroke="#FFFFFF" strokeWidth="1" opacity="0.85" />
            <line x1="55" y1="8" x2="55" y2="62" stroke="#FFFFFF" strokeWidth="2" />
            <line x1="10" y1="35" x2="100" y2="35" stroke="#FFFFFF" strokeWidth="1" strokeDasharray="3 3" opacity="0.7" />
            <text x="55" y="4" fill="#6EE7B7" fontSize="8" fontFamily="monospace" textAnchor="middle">SÂN TENNIS MALIBU</text>
          </g>

          {/* Sân Gym ngoài trời & Sân chơi trẻ em sắc màu */}
          <g transform="translate(420, 110)">
            <rect x="0" y="0" width="80" height="50" rx="6" fill="#1E1B4B" stroke="#6366F1" strokeWidth="1.5" />
            <text x="40" y="24" fill="#A5B4FC" fontSize="8" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">OUTDOOR GYM</text>
            <text x="40" y="38" fill="#818CF8" fontSize="7" fontFamily="monospace" textAnchor="middle">12 Máy Tập Đa Năng</text>
          </g>

          <g transform="translate(260, 360)">
            <rect x="0" y="0" width="75" height="55" rx="6" fill="#431407" stroke="#EA580C" strokeWidth="1.5" />
            <text x="37" y="25" fill="#FDBA74" fontSize="8" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">KIDS PLAY</text>
            <text x="37" y="40" fill="#FB923C" fontSize="7" fontFamily="monospace" textAnchor="middle">Rừng Nhiệt Đới</text>
          </g>

          {/* 5. TỰ VẼ 4 CHUNG CƯ THE TROPICAL VỚI ĐỒ HỌA KIẾN TRÚC 2.5D */}
          {buildings.map((b) => {
            const isBS07 = b.code === 'BS-07';
            return (
              <g
                key={b.code}
                onClick={() => onSelectBlock(b.code)}
                className="cursor-pointer group transition-all duration-300"
                filter={b.isCurrent ? 'url(#goldGlow)' : 'url(#buildingShadow)'}
              >
                {/* Khối đế chung cư 2.5D (Extruded architectural base) */}
                <rect
                  x={b.x + 8}
                  y={b.y + 12}
                  width={b.width}
                  height={b.height}
                  rx="6"
                  fill="#030712"
                  opacity="0.9"
                />

                {/* Thân chung cư kiến trúc chính */}
                <rect
                  x={b.x}
                  y={b.y}
                  width={b.width}
                  height={b.height}
                  rx="6"
                  fill={b.isCurrent ? '#162235' : '#0F172A'}
                  stroke={b.isCurrent ? '#C5A880' : '#334155'}
                  strokeWidth={b.isCurrent ? 2.5 : 1.5}
                  className="transition-colors group-hover:stroke-[#C5A880]"
                />

                {/* Lưới căn hộ trên mặt sàn kiến trúc (Cad floor slots schematic) */}
                <g opacity="0.35">
                  <line x1={b.x + 20} y1={b.y} x2={b.x + 20} y2={b.y + b.height} stroke="#64748B" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1={b.x + b.width - 20} y1={b.y} x2={b.x + b.width - 20} y2={b.y + b.height} stroke="#64748B" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1={b.x} y1={b.y + b.height / 2} x2={b.x + b.width} y2={b.y + b.height / 2} stroke="#64748B" strokeWidth="1" strokeDasharray="4 4" />
                </g>

                {/* Sân thượng cảnh quan Sky Garden & Hệ pin năng lượng mặt trời */}
                <rect
                  x={b.x + 10}
                  y={b.y + 8}
                  width={b.width - 20}
                  height="22"
                  rx="3"
                  fill={b.isCurrent ? '#1E293B' : '#0B0F17'}
                  stroke={b.isCurrent ? '#F59E0B' : '#475569'}
                  strokeWidth="1"
                />
                <text
                  x={b.x + b.width / 2}
                  y={b.y + 22}
                  fill={b.isCurrent ? '#F59E0B' : '#94A3B8'}
                  fontSize="9"
                  fontFamily="monospace"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  SOLAR ROOF • {b.floors} TẦNG
                </text>

                {/* Nhãn tên Chung Cư */}
                <text
                  x={b.x + b.width / 2}
                  y={b.y + b.height / 2 - 8}
                  fill={b.isCurrent ? '#FFFFFF' : '#E2E8F0'}
                  fontSize="14"
                  fontFamily="sans-serif"
                  fontWeight="bold"
                  textAnchor="middle"
                  className="tracking-wider"
                >
                  {b.name}
                </text>
                <text
                  x={b.x + b.width / 2}
                  y={b.y + b.height / 2 + 10}
                  fill={b.isCurrent ? '#C5A880' : '#94A3B8'}
                  fontSize="10"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {b.units} Căn Hộ • {b.floors} Tầng
                </text>

                {/* Badge trạng thái chọn */}
                <rect
                  x={b.x + 15}
                  y={b.y + b.height - 30}
                  width={b.width - 30}
                  height="20"
                  rx="3"
                  fill={b.isCurrent ? '#C5A880' : '#1E293B'}
                  stroke={b.isCurrent ? '#FBBF24' : '#334155'}
                  strokeWidth="1"
                />
                <text
                  x={b.x + b.width / 2}
                  y={b.y + b.height - 16}
                  fill={b.isCurrent ? '#000000' : '#94A3B8'}
                  fontSize="9"
                  fontFamily="monospace"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {b.isCurrent ? `★ ${b.badge}` : `Click Chọn ${b.code}`}
                </text>

                {/* Sảnh đón Drop-off trước mặt tiền */}
                <path
                  d={`M ${b.x + b.width / 2 - 25},${b.y + b.height} L ${b.x + b.width / 2 + 25},${b.y + b.height} L ${b.x + b.width / 2 + 18},${b.y + b.height + 12} L ${b.x + b.width / 2 - 18},${b.y + b.height + 12} Z`}
                  fill="#F59E0B"
                  fillOpacity="0.85"
                />
              </g>
            );
          })}

          {/* 6. HỆ THỐNG 18 GHIM TIỆN ÍCH TỰ VẼ TRÊN MÔ HÌNH KIẾN TRÚC */}
          {amenities.map((item) => {
            // Chuyển phần trăm x, y sang tọa độ SVG 1000 x 640
            const svgX = (item.x / 100) * 940 + 30;
            const svgY = (item.y / 100) * 580 + 30;
            const isHovered = hoveredAmenityId === item.id;

            return (
              <g
                key={item.id}
                transform={`translate(${svgX}, ${svgY})`}
                onMouseEnter={() => onHoverAmenity(item.id)}
                onMouseLeave={() => onHoverAmenity(null)}
                className="cursor-pointer group"
              >
                {/* Vòng xung radar phát sáng khi được hover */}
                {isHovered && (
                  <>
                    <circle cx="0" cy="0" r="26" fill="none" stroke="#C5A880" strokeWidth="1.5" opacity="0.8" className="animate-ping" />
                    <circle cx="0" cy="0" r="18" fill="#C5A880" fillOpacity="0.2" stroke="#F59E0B" strokeWidth="1" />
                  </>
                )}

                {/* Nền ghim tiện ích */}
                <circle
                  cx="0"
                  cy="0"
                  r={isHovered ? 13 : 9}
                  fill={isHovered ? '#C5A880' : item.category === 'POOL' ? '#0891B2' : item.category === 'SPORT' ? '#7C3AED' : item.category === 'ACCESS' ? '#EA580C' : '#059669'}
                  stroke="#FFFFFF"
                  strokeWidth={isHovered ? 2.5 : 1.5}
                  className="transition-all duration-200 shadow-lg"
                />

                {/* Số thứ tự hoặc ký hiệu */}
                <text
                  x="0"
                  y={isHovered ? 3.5 : 3}
                  fill={isHovered ? '#000000' : '#FFFFFF'}
                  fontSize={isHovered ? 9 : 7.5}
                  fontFamily="monospace"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {item.id}
                </text>

                {/* Tooltip nổi trực tiếp trên SVG khi được rê chuột vào */}
                {isHovered && (
                  <g transform="translate(0, -22)" className="pointer-events-none filter drop-shadow-2xl">
                    <rect
                      x="-95"
                      y="-48"
                      width="190"
                      height="46"
                      rx="4"
                      fill="#0B1017"
                      stroke="#C5A880"
                      strokeWidth="1.5"
                    />
                    <polygon points="-6,-2 6,-2 0,4" fill="#C5A880" />
                    <text x="0" y="-32" fill="#F8FAFC" fontSize="10" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">
                      {item.id}. {item.name}
                    </text>
                    <text x="0" y="-18" fill="#C5A880" fontSize="9" fontFamily="monospace" textAnchor="middle">
                      {item.distance}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* La bàn chỉ hướng (Compass Rose) */}
          <g transform="translate(900, 70)">
            <circle cx="0" cy="0" r="22" fill="#0D131F" stroke="#334155" strokeWidth="1" />
            <polygon points="0,-16 5,-3 -5,-3" fill="#EF4444" />
            <polygon points="0,16 5,3 -5,3" fill="#94A3B8" />
            <text x="0" y="-19" fill="#EF4444" fontSize="9" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">N</text>
            <text x="0" y="27" fill="#94A3B8" fontSize="8" fontFamily="sans-serif" textAnchor="middle">S</text>
            <text x="18" y="3" fill="#94A3B8" fontSize="8" fontFamily="sans-serif" textAnchor="middle">E</text>
            <text x="-18" y="3" fill="#94A3B8" fontSize="8" fontFamily="sans-serif" textAnchor="middle">W</text>
          </g>
        </svg>

        {/* HUD OVERLAY GÓC TRÁI: THÔNG TIN TIỆN ÍCH ĐANG RÊ CHUỘT */}
        {activeAmenity && (
          <div className="absolute bottom-3 left-3 bg-[#0A0F17]/95 border border-[#C5A880] p-3 max-w-sm backdrop-blur-md shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-150 pointer-events-none">
            <div className="flex items-center gap-1.5 text-[#C5A880] font-mono text-[10.5px] uppercase font-bold tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tiện Ích #{activeAmenity.id} • {activeAmenity.name}</span>
            </div>
            <div className="text-gray-300 text-[11px] mt-1 line-clamp-2">
              {activeAmenity.desc}
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-emerald-400 mt-2 pt-1.5 border-t border-[#1E293B]">
              <span>📍 {activeAmenity.distance}</span>
              <span className="text-cyan-400">Đang Vận Hành 24/7</span>
            </div>
          </div>
        )}

        {/* HUD CHỈ DẪN NHANH GÓC PHẢI */}
        <div className="absolute top-3 right-3 bg-[#0B111A]/90 border border-[#1E293B] px-2.5 py-1.5 text-[10px] font-mono text-gray-400 backdrop-blur-sm hidden sm:block">
          <div className="text-[#C5A880] font-bold">CHÚ DẪN MÔ HÌNH:</div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>Hồ bơi Resort</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 ml-1.5" />
            <span>Cảnh quan</span>
            <span className="w-2 h-2 rounded-full bg-purple-500 ml-1.5" />
            <span>Thể thao</span>
          </div>
        </div>
      </div>
    </div>
  );
}
