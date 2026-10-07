'use client';

import React, { useState } from 'react';
import { 
  Compass, Maximize2, Sparkles, ChevronRight,
  Building2, Layers, MapPin, ZoomIn, ZoomOut, RotateCcw,
  Eye, Info, Check, Navigation, SlidersHorizontal
} from 'lucide-react';
import { TropicalAmenity } from '../AdminBuildingApartmentManager';

interface TropicalCampusSvgModelProps {
  amenities: TropicalAmenity[];
  selectedBlock: string;
  onSelectBlock: (blockCode: any) => void;
  onSelectBlockAndShowFloors?: (blockCode: any) => void;
  selectedAmenityId?: string | null;
  onSelectAmenity?: (id: string | null) => void;
  hoveredAmenityId: string | null;
  onHoverAmenity: (id: string | null) => void;
  onOpenZoomModal?: () => void;
}

export default function TropicalCampusSvgModel({
  amenities,
  selectedBlock,
  onSelectBlock,
  onSelectBlockAndShowFloors,
  selectedAmenityId,
  onSelectAmenity,
  hoveredAmenityId,
  onHoverAmenity,
  onOpenZoomModal
}: TropicalCampusSvgModelProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showHotspots, setShowHotspots] = useState<boolean>(true);
  const [activeAmenityCategory, setActiveAmenityCategory] = useState<'ALL' | 'POOL' | 'PARK' | 'SPORT' | 'ACCESS'>('ALL');

  // 4 Khối Chung Cư chuẩn quy hoạch The Tropical trên bản đồ kiến trúc gốc (kích thước gốc 453 x 677)
  const buildings = [
    {
      code: 'BS-07',
      shortCode: 'BS-7',
      name: 'Chung Cư BS-7',
      floors: 34,
      units: 714,
      loc: 'Mặt tiền Phố Cọ Rodeo & Vành Đai',
      badge: 'Chung Cư BS-7 (34 Tầng)',
      // Tọa độ trên ảnh gốc 453 x 677
      svgX: 68,
      svgY: 180,
      svgW: 122,
      svgH: 105,
      pillX: 86,
      pillY: 292,
      isCurrent: selectedBlock === 'BS-07' || selectedBlock === 'BS-7',
    },
    {
      code: 'BS-08',
      shortCode: 'BS-8',
      name: 'Chung Cư BS-8',
      floors: 39,
      units: 819,
      loc: 'Hướng Vườn Cọ & Sân Thiền',
      badge: 'Chung Cư BS-8 (39 Tầng)',
      svgX: 68,
      svgY: 58,
      svgW: 190,
      svgH: 60,
      pillX: 95,
      pillY: 48,
      isCurrent: selectedBlock === 'BS-08' || selectedBlock === 'BS-8',
    },
    {
      code: 'BS-09',
      shortCode: 'BS-9',
      name: 'Chung Cư BS-9',
      floors: 34,
      units: 714,
      loc: 'View Trực Diện Hồ Bơi Resort',
      badge: 'Chung Cư BS-9 (34 Tầng)',
      svgX: 295,
      svgY: 55,
      svgW: 100,
      svgH: 98,
      pillX: 395,
      pillY: 115,
      isCurrent: selectedBlock === 'BS-09' || selectedBlock === 'BS-9',
    },
    {
      code: 'BS-10',
      shortCode: 'BS-10',
      name: 'Chung Cư BS-10',
      floors: 34,
      units: 714,
      loc: 'Cụm Thể Thao Malibu & Bãi Đỗ Xe',
      badge: 'Chung Cư BS-10 (34 Tầng)',
      svgX: 236,
      svgY: 172,
      svgW: 192,
      svgH: 88,
      pillX: 405,
      pillY: 260,
      isCurrent: selectedBlock === 'BS-10' || selectedBlock === 'BS-10',
    }
  ];

  // Tọa độ các ghim tiện ích trên ảnh quy hoạch thực tế (ảnh gốc 453 x 677)
  const AMENITY_POSITIONS_453x677: Record<string, { x: number; y: number }> = {
    '01': { x: 175, y: 288 }, // Phố cọ Rodeo
    '02': { x: 198, y: 160 }, // Bể bơi nhiệt đới
    '03': { x: 200, y: 175 }, // Bể bơi ốc đảo
    '04': { x: 42, y: 102 },  // Bể bơi Malibu
    '05': { x: 203, y: 185 }, // Nhà phụ trợ bể bơi
    '06': { x: 304, y: 163 }, // Sân chơi trẻ em
    '07': { x: 271, y: 140 }, // Sân Gym ngoài trời
    '08': { x: 112, y: 157 }, // Sân yoga
    '09': { x: 211, y: 141 }, // Suối bậc cảnh quan
    '10': { x: 230, y: 215 }, // Vườn cọ nhiệt đới Honolulu
    '11': { x: 136, y: 230 }, // Vườn California
    '12': { x: 317, y: 180 }, // Vườn San Mario
    '13': { x: 440, y: 245 }, // Biển tên The Tropical
    '14': { x: 245, y: 141 }, // Chòi nghỉ
    '15': { x: 274, y: 181 }, // Giàn cảnh quan
    '16': { x: 179, y: 166 }, // Ghế nghỉ Sunken
    'Y-01': { x: 40, y: 247 }, // Sân cỏ đa năng
    'Y-02': { x: 40, y: 274 }, // Thác nước điểm nhấn
    'Y-03': { x: 40, y: 227 }, // Artwork điểm nhấn
    'Y-04': { x: 42, y: 160 }, // Sân thể thao
    'P': { x: 378, y: 268 },   // Bãi đỗ xe
    'D': { x: 134, y: 281 },   // Lối vào sảnh Drop-off
    'H': { x: 223, y: 261 },   // Lối xuống hầm
  };

  const filteredAmenities = amenities.filter(item => {
    if (activeAmenityCategory === 'ALL') return true;
    return item.category === activeAmenityCategory;
  });

  const midIdx = Math.ceil(filteredAmenities.length / 2);
  const colLeftAmenities = filteredAmenities.slice(0, midIdx);
  const colRightAmenities = filteredAmenities.slice(midIdx);

  return (
    <div className="relative bg-[#06090F] border border-[#1E293B] rounded-none overflow-hidden select-none shadow-2xl flex flex-col">
      
      {/* THANH ĐIỀU HÀNH MẶT BẰNG & CÁC CHẾ ĐỘ HIỂN THỊ */}
      <div className="px-2.5 sm:px-3.5 py-2 bg-[#0B111A] border-b border-[#1E293B] flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#141E2D] border border-[#23354C] text-[#C5A880]">
            <Compass className="w-3.5 h-3.5 text-[#C5A880] shrink-0" />
            <span className="font-bold tracking-wider uppercase text-[10.5px] sm:text-[11px]">
              QUY HOẠCH THE TROPICAL (ẢNH MẶT BẰNG THỰC TẾ)
            </span>
          </div>
          <span className="text-gray-400 text-[10.5px] hidden lg:inline">
            4 Khối tháp BS-7, BS-8, BS-9, BS-10 & 23 tiện ích
          </span>
        </div>

        {/* Nút bật tắt lớp phủ & Thu phóng */}
        <div className="flex items-center gap-1.5">
          {/* Bật/Tắt Lớp phủ tương tác */}
          <button
            type="button"
            onClick={() => setShowHotspots(!showHotspots)}
            className={`px-2 py-0.5 border text-[10.5px] transition-all flex items-center gap-1 ${
              showHotspots
                ? 'bg-[#182638] border-[#3B82F6] text-cyan-300'
                : 'bg-[#0E1520] border-[#222E3E] text-gray-400 hover:text-white'
            }`}
            title="Bật/tắt ghim định vị & viền tòa tháp"
          >
            <Eye className="w-3 h-3" />
            <span className="hidden sm:inline">Lớp Phủ</span>
          </button>

          {/* Cụm nút thu phóng */}
          <div className="flex items-center gap-0.5 bg-[#101723] border border-[#1E2B3C] p-0.5">
            <button
              type="button"
              onClick={() => setZoomLevel(prev => Math.max(0.75, Number((prev - 0.15).toFixed(2))))}
              className="p-1 hover:bg-[#1A2637] text-gray-300 hover:text-white"
              title="Thu nhỏ"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(1)}
              className="px-1.5 py-0.5 text-[#C5A880] text-[10.5px] min-w-[38px] text-center hover:bg-[#1A2637]"
              title="100%"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(prev => Math.min(2.2, Number((prev + 0.15).toFixed(2))))}
              className="p-1 hover:bg-[#1A2637] text-gray-300 hover:text-white"
              title="Phóng to"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {onOpenZoomModal && (
            <button
              type="button"
              onClick={onOpenZoomModal}
              className="p-1 bg-[#121A26] hover:bg-[#C5A880] hover:text-black border border-[#223247] text-gray-300 transition-all ml-0.5"
              title="Phóng to toàn màn hình"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* KHUNG HIỂN THỊ ẢNH MẶT BẰNG QUY HOẠCH CHÍNH XÁC + LỚP PHỦ TƯƠNG TÁC        */}
      {/* ========================================================================= */}
      <div className="relative w-full h-[430px] sm:h-[490px] md:h-[530px] bg-[#070A0F] overflow-hidden flex items-center justify-center p-1 sm:p-2">
        
        {/* Container thu phóng & di chuyển mượt mà */}
        <div 
          className="relative w-full h-full flex items-center justify-center transition-transform duration-200"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <svg
            viewBox="0 15 453 315"
            className="w-full h-full max-h-full object-contain filter drop-shadow-2xl"
          >
            <defs>
              {/* Hiệu ứng viền vàng phát quang cho tòa nhà được chọn */}
              <filter id="goldBlockGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#F59E0B" floodOpacity="0.8" />
              </filter>
              <filter id="badgeShadow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.85" />
              </filter>
            </defs>

            {/* 1. ẢNH GỐC BẢN VẼ MẶT BẰNG THE TROPICAL CHUẨN THIẾT KẾ CĐT */}
            <image
              href="/masterplan/the-tropical-masterplan.png"
              x="0"
              y="0"
              width="453"
              height="677"
              preserveAspectRatio="xMidYMid meet"
            />

            {/* 2. LỚP PHỦ TƯƠNG TÁC 4 KHỐI CHUNG CƯ (BS-7, BS-8, BS-9, BS-10) */}
            {showHotspots && buildings.map((b) => {
              const isSelected = b.isCurrent;

              return (
                <g key={`building-block-${b.code}`} className="group cursor-pointer">
                  {/* Vùng bao viền phát sáng khi chọn tòa */}
                  <rect
                    x={b.svgX}
                    y={b.svgY}
                    width={b.svgW}
                    height={b.svgH}
                    rx="6"
                    fill={isSelected ? '#F59E0B' : 'transparent'}
                    fillOpacity={isSelected ? 0.18 : 0.04}
                    stroke={isSelected ? '#F59E0B' : '#C5A880'}
                    strokeWidth={isSelected ? 2.5 : 1}
                    strokeDasharray={isSelected ? 'none' : '4 3'}
                    filter={isSelected ? 'url(#goldBlockGlow)' : undefined}
                    className="transition-all duration-200 group-hover:stroke-[#F59E0B] group-hover:stroke-width-2 group-hover:fill-amber-500/10"
                    onClick={() => onSelectBlock(b.code)}
                  />

                  {/* Vòng pulse hiệu ứng cho tòa đang quản lý */}
                  {isSelected && (
                    <circle
                      cx={b.pillX}
                      cy={b.pillY}
                      r="14"
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth="1.5"
                      className="animate-ping"
                      opacity="0.6"
                    />
                  )}

                  {/* Thẻ ghim tên Chung Cư đính kèm */}
                  <g 
                    transform={`translate(${b.pillX}, ${b.pillY})`}
                    onClick={() => onSelectBlock(b.code)}
                    filter="url(#badgeShadow)"
                  >
                    <rect
                      x="-38"
                      y="-11"
                      width="76"
                      height="22"
                      rx="3"
                      fill={isSelected ? '#F59E0B' : '#0B111A'}
                      stroke={isSelected ? '#FFFFFF' : '#C5A880'}
                      strokeWidth={isSelected ? 1.5 : 1}
                      className="transition-all group-hover:brightness-125"
                    />
                    <text
                      y="3.5"
                      fill={isSelected ? '#000000' : '#FFFFFF'}
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {b.shortCode} • {b.floors}T
                    </text>
                  </g>

                  {/* Nút hành động trực tiếp: Bấm xem số tầng nếu là tòa đang chọn */}
                  {isSelected && onSelectBlockAndShowFloors && (
                    <g
                      transform={`translate(${b.pillX}, ${b.pillY + 16})`}
                      className="cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectBlockAndShowFloors(b.code);
                      }}
                      filter="url(#badgeShadow)"
                    >
                      <rect
                        x="-46"
                        y="-8"
                        width="92"
                        height="16"
                        rx="3"
                        fill="#064E3B"
                        stroke="#10B981"
                        strokeWidth="1"
                        className="hover:fill-emerald-800"
                      />
                      <text
                        y="3"
                        fill="#A7F3D0"
                        fontSize="7.5"
                        fontWeight="bold"
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        ⚡ XEM {b.floors} TẦNG ➔
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* 3. LỚP GHIM ĐỊNH VỊ 23 TIỆN ÍCH TRÊN MẶT BẰNG THỰC TẾ */}
            {showHotspots && amenities.map(item => {
              const pos = AMENITY_POSITIONS_453x677[item.id];
              if (!pos) return null;

              const isSelected = selectedAmenityId === item.id;
              const isHovered = hoveredAmenityId === item.id;
              const isHighlighted = isSelected || isHovered;
              const isGold = item.isGoldBadge;
              const isSpecialCode = item.id === 'P' || item.id === 'D' || item.id === 'H';

              return (
                <g
                  key={`amenity-pin-${item.id}`}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  className="cursor-pointer group"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectAmenity?.(isSelected ? null : item.id);
                  }}
                  onMouseEnter={() => onHoverAmenity(item.id)}
                  onMouseLeave={() => onHoverAmenity(null)}
                >
                  <title>{item.name} (#{item.displayNumber || item.id}) - {item.distance}</title>
                  {/* Radar pulse khi chọn hoặc hover */}
                  {isHighlighted && (
                    <circle
                      r="16"
                      fill={isSelected ? '#F59E0B' : '#38BDF8'}
                      opacity={isSelected ? 0.6 : 0.4}
                      className="animate-ping"
                    />
                  )}

                  {/* Vòng hào quang định vị */}
                  {isHighlighted && (
                    <circle
                      r="12"
                      fill="none"
                      stroke="#FFFFFF"
                      strokeWidth="1.5"
                      strokeDasharray="2 2"
                    />
                  )}

                  {/* Nút ghim tiện ích (tương ứng với số tròn đen / vàng trên bản đồ gốc) */}
                  <circle
                    r={isHighlighted ? 9.5 : 7.5}
                    fill={
                      isSelected
                        ? '#F59E0B'
                        : isHovered
                        ? '#C5A880'
                        : isGold
                        ? '#EAB308'
                        : isSpecialCode
                        ? '#1E293B'
                        : '#000000'
                    }
                    stroke={
                      isSelected
                        ? '#FFFFFF'
                        : isHovered
                        ? '#FFFFFF'
                        : isGold
                        ? '#000000'
                        : '#94A3B8'
                    }
                    strokeWidth={isHighlighted ? 1.8 : 1}
                    className="transition-all duration-150"
                  />

                  {/* Ký hiệu / Số trên ghim */}
                  <text
                    y="2.5"
                    fill={
                      isSelected
                        ? '#000000'
                        : isGold
                        ? '#000000'
                        : '#FFFFFF'
                    }
                    fontSize={isHighlighted ? 7.5 : 6}
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
        </div>

        {/* GHI CHÚ ĐIỀU HƯỚNG GÓC PHẢI DƯỚI */}
        <div className="absolute bottom-2 right-2 px-2 py-1 bg-[#0A0F17]/85 border border-[#1E2B3C] text-[10px] font-mono text-gray-400 backdrop-blur-sm pointer-events-none hidden sm:block">
          Nhấn tòa để chọn • Rê chuột vào số để xem tiện ích
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BẢNG 23 TIỆN ÍCH THE TROPICAL KHỚP CHÍNH XÁC VỚI BẢNG CHÚ THÍCH CỦA CĐT    */}
      {/* ========================================================================= */}
      <div className="p-2.5 sm:p-3 bg-[#0A0E17] border-t border-[#1E293B] space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <div className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#C5A880] shrink-0" />
            <span>23 TIỆN ÍCH NỘI KHU THE TROPICAL</span>
          </div>
          <span className="text-[10px] text-gray-400 font-mono">
            Hiển thị: <strong className="text-[#C5A880]">{filteredAmenities.length}</strong>/{amenities.length} mục
          </span>
        </div>

        {/* BỘ LỌC DANH MỤC TIỆN ÍCH NHANH */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {[
            { id: 'ALL', label: 'Tất Cả', count: amenities.length },
            { id: 'POOL', label: 'Bể Bơi & Chòi', count: amenities.filter(a => a.category === 'POOL').length },
            { id: 'PARK', label: 'Cảnh Quan & Vườn', count: amenities.filter(a => a.category === 'PARK').length },
            { id: 'SPORT', label: 'Sân Thể Thao', count: amenities.filter(a => a.category === 'SPORT').length },
            { id: 'ACCESS', label: 'Hạ Tầng & Sảnh', count: amenities.filter(a => a.category === 'ACCESS').length },
          ].map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveAmenityCategory(cat.id as any)}
              className={`px-2 py-0.5 text-[10.5px] sm:text-[11px] font-mono whitespace-nowrap transition-all flex items-center gap-1 shrink-0 ${
                activeAmenityCategory === cat.id
                  ? 'bg-[#C5A880] text-black font-bold shadow'
                  : 'bg-[#0E1522] border border-[#23354C] text-gray-400 hover:text-white hover:border-gray-500'
              }`}
            >
              <span>{cat.label}</span>
              <span className={`text-[9.5px] px-1 py-0.1 font-bold ${
                activeAmenityCategory === cat.id ? 'bg-black/20 text-black' : 'text-gray-500'
              }`}>
                {cat.count}
              </span>
            </button>
          ))}
        </div>

        {/* 2 CỘT DANH MỤC TIỆN ÍCH ĐỒNG BỘ HOVER & CLICK VỚI BẢN ĐỒ TRÊN */}
        <div className="max-h-[175px] sm:max-h-[210px] overflow-y-auto no-scrollbar pr-0.5 grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 font-sans text-xs">
          
          {/* CỘT TRÁI */}
          <div className="space-y-1">
            {colLeftAmenities.map(item => {
              const isSelected = selectedAmenityId === item.id;
              const isHovered = hoveredAmenityId === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => onSelectAmenity?.(isSelected ? null : item.id)}
                  onMouseEnter={() => onHoverAmenity(item.id)}
                  onMouseLeave={() => onHoverAmenity(null)}
                  className={`p-1.5 px-2 rounded-none flex items-center justify-between cursor-pointer transition-all active:scale-[0.99] ${
                    isSelected
                      ? 'bg-[#223348] border border-[#F59E0B] text-white shadow-md ring-1 ring-[#F59E0B]/50'
                      : isHovered
                      ? 'bg-[#1C2838] border border-[#C5A880] text-white shadow'
                      : 'bg-[#0E1522] border border-transparent hover:border-gray-600 text-gray-300'
                  }`}
                  title={`${item.name} - Bấm để xem vị trí trên bản đồ`}
                >
                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                    <span className={`w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full font-mono text-[9px] font-bold flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-[#F59E0B] text-black ring-1 ring-white'
                        : isHovered
                        ? 'bg-[#C5A880] text-black'
                        : item.isGoldBadge
                        ? 'bg-[#F59E0B] text-black font-bold'
                        : 'bg-black text-white border border-gray-600'
                    }`}>
                      {item.displayNumber || item.id}
                    </span>
                    <span className="font-medium text-[11px] sm:text-[11.5px] truncate">
                      {item.name}
                    </span>
                  </div>
                  <span className="text-[9.5px] sm:text-[10px] font-mono text-cyan-300/80 shrink-0 ml-1">
                    {item.distance.replace('Cách BS-07: ', '').replace('Liền kề BS-07 ', '')}
                  </span>
                </div>
              );
            })}
          </div>

          {/* CỘT PHẢI */}
          <div className="space-y-1">
            {colRightAmenities.map(item => {
              const isSelected = selectedAmenityId === item.id;
              const isHovered = hoveredAmenityId === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => onSelectAmenity?.(isSelected ? null : item.id)}
                  onMouseEnter={() => onHoverAmenity(item.id)}
                  onMouseLeave={() => onHoverAmenity(null)}
                  className={`p-1.5 px-2 rounded-none flex items-center justify-between cursor-pointer transition-all active:scale-[0.99] ${
                    isSelected
                      ? 'bg-[#223348] border border-[#F59E0B] text-white shadow-md ring-1 ring-[#F59E0B]/50'
                      : isHovered
                      ? 'bg-[#1C2838] border border-[#C5A880] text-white shadow'
                      : 'bg-[#0E1522] border border-transparent hover:border-gray-600 text-gray-300'
                  }`}
                  title={`${item.name} - Bấm để xem vị trí trên bản đồ`}
                >
                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                    <span className={`w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full font-mono text-[9px] font-bold flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-[#F59E0B] text-black ring-1 ring-white'
                        : isHovered
                        ? 'bg-[#C5A880] text-black'
                        : item.isGoldBadge
                        ? 'bg-[#F59E0B] text-black font-bold'
                        : 'bg-black text-white border border-gray-600'
                    }`}>
                      {item.displayNumber || item.id}
                    </span>
                    <span className="font-medium text-[11px] sm:text-[11.5px] truncate">
                      {item.name}
                    </span>
                  </div>
                  <span className="text-[9.5px] sm:text-[10px] font-mono text-cyan-300/80 shrink-0 ml-1">
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
