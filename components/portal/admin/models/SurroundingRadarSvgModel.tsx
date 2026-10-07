'use client';

import React, { useState } from 'react';
import { 
  Radar, Compass, Maximize2, Sparkles, Navigation, 
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
  const [displayMode, setDisplayMode] = useState<'PHOTO_MAP' | 'RADAR_SCANNER'>('PHOTO_MAP');
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

  // Tọa độ vector trên radar tròn (CENTER: 500, 256)
  const RADAR_CENTER = { x: 500, y: 256 };
  const RADAR_COORDS: Record<string, { x: number; y: number }> = {
    'SUR-01': { x: 600, y: 170 },
    'SUR-02': { x: 660, y: 330 },
    'SUR-03': { x: 740, y: 240 },
    'SUR-04': { x: 490, y: 90 },
    'SUR-05': { x: 410, y: 260 },
    'SUR-06': { x: 770, y: 380 },
    'SUR-07': { x: 440, y: 360 },
    'SUR-08': { x: 650, y: 220 },
  };

  return (
    <div className="relative w-full h-full flex-1 flex flex-col bg-[#070B12] overflow-hidden select-none">
      {/* THANH ĐIỀU HÀNH BẢN ĐỒ TIỆN ÍCH TINH GỌN (ĐÃ BỎ TIÊU ĐỀ TRÙNG LẶP) */}
      <div className="px-3 py-1.5 bg-[#0A0F17] border-b border-[#1E293B] flex items-center justify-between gap-2 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-gray-400 text-[11px]">Bán kính:</span>
          <span className="px-2 py-0.5 bg-[#141E2D] border border-[#23354C] text-cyan-300 font-bold text-[11px]">
            1km • 8 Đại Tiện Ích
          </span>
        </div>

        {/* Nút chuyển đổi chế độ & Thu phóng */}
        <div className="flex items-center gap-1.5">
          {/* Chuyển chế độ xem */}
          <div className="flex items-center bg-[#101723] p-0.5 border border-[#1E2B3C] text-[10.5px]">
            <button
              type="button"
              onClick={() => setDisplayMode('PHOTO_MAP')}
              className={`px-2 py-0.5 transition-all flex items-center gap-1 ${
                displayMode === 'PHOTO_MAP'
                  ? 'bg-[#C5A880] text-black font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Xem bản đồ phối cảnh thực tế"
            >
              <Map className="w-3 h-3" />
              <span>Bản Đồ Ảnh</span>
            </button>
            <button
              type="button"
              onClick={() => setDisplayMode('RADAR_SCANNER')}
              className={`px-2 py-0.5 transition-all flex items-center gap-1 ${
                displayMode === 'RADAR_SCANNER'
                  ? 'bg-[#C5A880] text-black font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Xem radar bán kính 1km"
            >
              <Radar className="w-3 h-3" />
              <span>Radar 1km</span>
            </button>
          </div>

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

      {/* VÙNG CANVAS HIỂN THỊ CHIẾM TRỌN KHÔNG GIAN */}
      <div className="relative w-full flex-1 min-h-[380px] sm:min-h-[460px] bg-[#05080E] overflow-hidden flex items-center justify-center p-2">
        
        <div 
          className="relative w-full h-full flex items-center justify-center transition-transform duration-200"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {displayMode === 'PHOTO_MAP' ? (
            /* =================================================================== */
            /* CHẾ ĐỘ 1: ẢNH BẢN ĐỒ TIỆN ÍCH THỰC TẾ THÀNH PHỐ BIỂN HỒ 1024 x 512 */
            /* =================================================================== */
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
          ) : (
            /* =================================================================== */
            /* CHẾ ĐỘ 2: RADAR TỌA ĐỘ BÁN KÍNH 1KM                                  */
            /* =================================================================== */
            <svg
              viewBox="0 0 1000 512"
              className="w-full h-full max-h-full object-contain"
            >
              <defs>
                <radialGradient id="radarBeam" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#C5A880" stopOpacity="0.25" />
                  <stop offset="60%" stopColor="#0284C7" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#05080E" stopOpacity="0" />
                </radialGradient>
              </defs>

              <rect x="0" y="0" width="1000" height="512" fill="#06090F" />

              {/* Các vòng bán kính radar */}
              <circle cx={RADAR_CENTER.x} cy={RADAR_CENTER.y} r="80" fill="none" stroke="#223348" strokeWidth="1" strokeDasharray="3 3" />
              <text x={RADAR_CENTER.x + 85} y={RADAR_CENTER.y - 5} fill="#475569" fontSize="9" fontFamily="monospace">200m</text>

              <circle cx={RADAR_CENTER.x} cy={RADAR_CENTER.y} r="160" fill="none" stroke="#223348" strokeWidth="1" strokeDasharray="3 3" />
              <text x={RADAR_CENTER.x + 165} y={RADAR_CENTER.y - 5} fill="#475569" fontSize="9" fontFamily="monospace">500m</text>

              <circle cx={RADAR_CENTER.x} cy={RADAR_CENTER.y} r="230" fill="none" stroke="#334155" strokeWidth="1.2" />
              <text x={RADAR_CENTER.x + 235} y={RADAR_CENTER.y - 5} fill="#C5A880" fontSize="9" fontFamily="monospace">1.000m (1km)</text>

              {/* Tia quét radar động */}
              <circle cx={RADAR_CENTER.x} cy={RADAR_CENTER.y} r="230" fill="url(#radarBeam)" />

              {/* Trục chữ thập */}
              <line x1={RADAR_CENTER.x - 240} y1={RADAR_CENTER.y} x2={RADAR_CENTER.x + 240} y2={RADAR_CENTER.y} stroke="#1E293B" strokeWidth="1" />
              <line x1={RADAR_CENTER.x} y1={RADAR_CENTER.y - 240} x2={RADAR_CENTER.x} y2={RADAR_CENTER.y + 240} stroke="#1E293B" strokeWidth="1" />

              {/* Tâm dự án: The Tropical */}
              <circle cx={RADAR_CENTER.x} cy={RADAR_CENTER.y} r="12" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="2" />
              <text x={RADAR_CENTER.x} y={RADAR_CENTER.y + 25} fill="#F59E0B" fontSize="10" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                TÒA {selectedBlock} (THE TROPICAL)
              </text>

              {/* Ghim các tiện ích trên radar */}
              {amenities.map(sur => {
                const rCoord = RADAR_COORDS[sur.id] || { x: RADAR_CENTER.x + 70, y: RADAR_CENTER.y + 70 };
                const pCoord = PHOTO_AMENITY_COORDS[sur.id];
                const isSelected = selectedAmenityId === sur.id;
                const isHovered = hoveredAmenityId === sur.id;
                const isHighlighted = isSelected || isHovered;

                return (
                  <g
                    key={`radar-pin-${sur.id}`}
                    transform={`translate(${rCoord.x}, ${rCoord.y})`}
                    className="cursor-pointer"
                    onClick={() => onSelectAmenity?.(isSelected ? null : sur.id)}
                    onMouseEnter={() => onHoverAmenity(sur.id)}
                    onMouseLeave={() => onHoverAmenity(null)}
                  >
                    <title>{sur.name} ({sur.distance})</title>
                    <line x1="0" y1="0" x2={RADAR_CENTER.x - rCoord.x} y2={RADAR_CENTER.y - rCoord.y} stroke="#334155" strokeWidth="0.8" opacity="0.4" />
                    
                    <circle
                      r={isHighlighted ? 14 : 10}
                      fill={isHighlighted ? (pCoord?.color || '#38BDF8') : '#0F172A'}
                      stroke={isHighlighted ? '#FFFFFF' : (pCoord?.color || '#38BDF8')}
                      strokeWidth={isHighlighted ? 2.5 : 1.5}
                    />
                    <text
                      y="3.5"
                      fill={isHighlighted ? '#000000' : '#FFFFFF'}
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {sur.id.replace('SUR-', '')}
                    </text>
                  </g>
                );
              })}
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}
