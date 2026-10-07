'use client';

import React, { useState } from 'react';
import { 
  Compass, Maximize2, Sparkles, Navigation, 
  GraduationCap, ShoppingBag, Waves, HeartPulse, Bus, Anchor, Trophy, Building2,
  ZoomIn, ZoomOut, RotateCcw, Map, Eye
} from 'lucide-react';
import { SurroundingAmenity } from '../AdminBuildingApartmentManager';

interface SurroundingRadarSvgModelProps {
  amenities: SurroundingAmenity[];
  selectedBlock: string;
  selectedAmenityId?: string | null;
  onSelectAmenity?: (id: string | null) => void;
  hoveredAmenityId: string | null;
  onHoverAmenity: (id: string | null) => void;
  onOpenZoomModal?: () => void;
}

export default function SurroundingRadarSvgModel({
  amenities,
  selectedBlock,
  selectedAmenityId,
  onSelectAmenity,
  hoveredAmenityId,
  onHoverAmenity,
  onOpenZoomModal
}: SurroundingRadarSvgModelProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showPins, setShowPins] = useState<boolean>(true);

  // Tọa độ định vị các đại tiện ích trên ảnh bản đồ thực tế 1024 x 512
  const PHOTO_AMENITY_COORDS: Record<string, { x: number; y: number; icon: any; color: string; label: string }> = {
    'SUR-01': { x: 460, y: 350, icon: GraduationCap, color: '#38BDF8', label: 'Vinschool & VinUni' },
    'SUR-02': { x: 880, y: 245, icon: ShoppingBag, color: '#F43F5E', label: 'Vincom Mega Mall' },
    'SUR-03': { x: 600, y: 260, icon: Waves, color: '#06B6D4', label: 'Biển Hồ & Hồ Ngọc Trai' },
    'SUR-04': { x: 610, y: 405, icon: HeartPulse, color: '#EF4444', label: 'Bệnh Viện Vinmec' },
    'SUR-05': { x: 775, y: 310, icon: Bus, color: '#10B981', label: 'Trạm VinBus Xanh' },
    'SUR-06': { x: 520, y: 285, icon: Anchor, color: '#8B5CF6', label: 'Bến Thuyền & Thể Thao' },
    'SUR-07': { x: 260, y: 400, icon: Trophy, color: '#F59E0B', label: 'Quảng Trường & VinWonders' },
    'SUR-08': { x: 105, y: 190, icon: Building2, color: '#C5A880', label: 'Tháp Biểu Tượng 45T' },
  };

  return (
    <div className="relative w-full h-full flex-1 flex flex-col bg-[#070B12] overflow-hidden select-none">
      {/* THANH ĐIỀU HÀNH BẢN ĐỒ TIỆN ÍCH TINH GỌN */}
      <div className="px-3 py-1.5 bg-[#0A0F17] border-b border-[#1E293B] flex items-center justify-between gap-2 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-gray-400 text-[11px]">Tiện ích:</span>
          <span className="px-2 py-0.5 bg-[#141E2D] border border-[#23354C] text-cyan-300 font-bold text-[11px]">
            8 Đại Tiện Ích Thành Phố Biển Hồ
          </span>
        </div>

        {/* Nút bật tắt ghim & Thu phóng */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowPins(!showPins)}
            className={`px-2 py-0.5 border text-[10.5px] transition-all flex items-center gap-1 ${
              showPins
                ? 'bg-[#182638] border-[#3B82F6] text-cyan-300'
                : 'bg-[#0E1520] border-[#222E3E] text-gray-400 hover:text-white'
            }`}
            title="Bật/tắt ghim định vị"
          >
            <Eye className="w-3 h-3" />
            <span className="hidden sm:inline">Ghim</span>
          </button>

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

      {/* VÙNG CANVAS HIỂN THỊ ẢNH BẢN ĐỒ TIỆN ÍCH THỰC TẾ CHIẾM TRỌN KHÔNG GIAN */}
      <div className="relative w-full flex-1 min-h-[380px] sm:min-h-[460px] bg-[#05080E] overflow-hidden flex items-center justify-center p-2">
        <div 
          className="relative w-full h-full flex items-center justify-center transition-transform duration-200"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {/* =================================================================== */}
          {/* ẢNH BẢN ĐỒ TIỆN ÍCH THỰC TẾ THÀNH PHỐ BIỂN HỒ 1024 x 512            */}
          {/* =================================================================== */}
          <svg
            viewBox="0 0 1024 512"
            className="w-full h-full max-h-full object-contain filter drop-shadow-2xl"
          >
            <defs>
              <filter id="photoPinGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#38BDF8" floodOpacity="0.85" />
              </filter>
              <filter id="photoBadgeShadow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.9" />
              </filter>
            </defs>

            {/* 1. ẢNH GỐC BẢN ĐỒ TIỆN ÍCH THÀNH PHỐ BIỂN HỒ */}
            <image
              href="/masterplan/vinhomes-amenities-map.jpg"
              x="0"
              y="0"
              width="1024"
              height="512"
              preserveAspectRatio="xMidYMid meet"
            />

            {/* 2. LỚP GHIM TIỆN ÍCH TƯƠNG TÁC */}
            {showPins && amenities.map(sur => {
              const coord = PHOTO_AMENITY_COORDS[sur.id];
              if (!coord) return null;

              const isSelected = selectedAmenityId === sur.id;
              const isHovered = hoveredAmenityId === sur.id;
              const isHighlighted = isSelected || isHovered;

              return (
                <g
                  key={`photo-pin-${sur.id}`}
                  transform={`translate(${coord.x}, ${coord.y})`}
                  className="cursor-pointer group"
                  onClick={() => onSelectAmenity?.(isSelected ? null : sur.id)}
                  onMouseEnter={() => onHoverAmenity(sur.id)}
                  onMouseLeave={() => onHoverAmenity(null)}
                >
                  <title>{sur.name} ({sur.distance})</title>
                  {/* Ping animation khi hover / select */}
                  {isHighlighted && (
                    <circle
                      r="20"
                      fill={coord.color}
                      opacity="0.5"
                      className="animate-ping"
                    />
                  )}

                  {/* Vòng ngoài */}
                  <circle
                    r={isHighlighted ? 14 : 10}
                    fill={isHighlighted ? coord.color : '#0B111A'}
                    stroke={isHighlighted ? '#FFFFFF' : coord.color}
                    strokeWidth={isHighlighted ? 2.5 : 1.8}
                    filter={isHighlighted ? 'url(#photoPinGlow)' : undefined}
                    className="transition-all duration-200"
                  />

                  {/* Số thứ tự tiện ích */}
                  <text
                    y="3.5"
                    fill={isHighlighted ? '#000000' : '#FFFFFF'}
                    fontSize={isHighlighted ? 10 : 8.5}
                    fontWeight="bold"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {sur.id.replace('SUR-', '')}
                  </text>

                  {/* Badge tên tiện ích nổi bật */}
                  {isHighlighted && (
                    <g transform="translate(0, -20)" filter="url(#photoBadgeShadow)">
                      <rect
                        x="-65"
                        y="-10"
                        width="130"
                        height="20"
                        rx="3"
                        fill="#0A0F17"
                        stroke={coord.color}
                        strokeWidth="1.5"
                      />
                      <text
                        y="3.5"
                        fill="#FFFFFF"
                        fontSize="9"
                        fontWeight="bold"
                        fontFamily="sans-serif"
                        textAnchor="middle"
                      >
                        {coord.label}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}
