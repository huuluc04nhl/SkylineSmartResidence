'use client';

import React, { useState } from 'react';
import { 
  Radar, Compass, Maximize2, Sparkles, Navigation, 
  GraduationCap, ShoppingBag, Waves, HeartPulse, Bus, Anchor, Trophy, Building2
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

  // Tâm điểm tọa độ: Chung Cư BS-07 / The Tropical (x = 500, y = 330)
  const CENTER = { x: 500, y: 330 };

  // Toạ độ vector cụ thể trên radar cho 8 đại tiện ích xung quanh
  const AMENITY_COORDS: Record<string, { x: number; y: number; icon: any; color: string; label: string }> = {
    'SUR-01': { x: 620, y: 200, icon: GraduationCap, color: '#38BDF8', label: 'Vinschool' }, // ~180m Bắc Đông
    'SUR-02': { x: 670, y: 440, icon: ShoppingBag, color: '#F43F5E', label: 'Vincom Mega Mall' }, // ~320m Đông Nam
    'SUR-03': { x: 780, y: 310, icon: Waves, color: '#06B6D4', label: 'Công Viên 36ha & Biển Hồ' }, // ~400m Đông
    'SUR-04': { x: 490, y: 110, icon: HeartPulse, color: '#EF4444', label: 'Vinmec Quốc Tế' }, // ~550m Bắc
    'SUR-05': { x: 380, y: 340, icon: Bus, color: '#10B981', label: 'Depot VinBus Sinh Thái' }, // ~50m Tây
    'SUR-06': { x: 830, y: 510, icon: Anchor, color: '#8B5CF6', label: 'Bến Du Thuyền Manhattan' }, // ~750m Nam
    'SUR-07': { x: 440, y: 460, icon: Trophy, color: '#F59E0B', label: 'Quảng Trường Golden Eagle' }, // ~260m Tây Nam
    'SUR-08': { x: 680, y: 280, icon: Building2, color: '#C5A880', label: 'Tháp Biểu Tượng 45T' }, // ~480m Đông Bắc
  };

  const activeAmenity = amenities.find(a => a.id === (hoveredAmenityId || selectedAmenityId));
  const activeCoord = (hoveredAmenityId || selectedAmenityId) ? AMENITY_COORDS[hoveredAmenityId || selectedAmenityId || ''] : null;

  return (
    <div className="relative bg-[#06090F] border border-[#1E293B] rounded-none overflow-hidden select-none shadow-2xl flex flex-col">
      {/* Thanh công cụ đỉnh radar */}
      <div className="px-3.5 py-2 bg-[#0B111A] border-b border-[#1E293B] flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#141E2D] border border-[#23354C] text-[#C5A880]">
            <Radar className="w-3.5 h-3.5 text-[#C5A880] animate-pulse" />
            <span className="font-bold tracking-wider uppercase text-[11px]">Bản Đồ Radar Tiện Ích Đô Thị Tự Vẽ (Bán Kính 1km)</span>
          </div>
          <span className="text-gray-400 text-[11px] hidden sm:inline">
            Tâm điểm: Chung Cư {selectedBlock} (The Tropical) • Bán kính mở rộng
          </span>
        </div>

        {/* Nút thu phóng */}
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
            onClick={() => setZoomLevel(1)}
            className="px-2 py-0.5 bg-[#121A26] hover:bg-[#1A2637] border border-[#223247] text-gray-300 hover:text-white text-[10px]"
          >
            100%
          </button>
        </div>
      </div>

      {/* VÙNG HIỂN THỊ SVG RADAR TỰ VẼ */}
      <div className="relative w-full h-[460px] sm:h-[500px] bg-[#05080E] overflow-hidden flex items-center justify-center">
        
        {/* Lưới tọa độ bản đồ đô thị */}
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(to right, #38BDF8 1px, transparent 1px), linear-gradient(to bottom, #38BDF8 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />

        <svg
          viewBox="0 0 1000 660"
          className="w-full h-full object-contain transition-transform duration-200 ease-out"
          style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'center center'
          }}
        >
          <defs>
            {/* Gradient cho dòng sông Tắc & sông Đồng Nai */}
            <linearGradient id="riverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0369A1" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#0284C7" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#075985" stopOpacity="0.5" />
            </linearGradient>

            {/* Gradient cho Đại công viên 36ha */}
            <radialGradient id="park36haGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#047857" stopOpacity="0.45" />
              <stop offset="70%" stopColor="#064E3B" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#022C22" stopOpacity="0.85" />
            </radialGradient>

            {/* Glow laser trajectory */}
            <filter id="laserGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#F59E0B" floodOpacity="0.9" />
            </filter>
          </defs>

          {/* 1. DÒNG SÔNG TỰ NHIÊN: SÔNG TẮC & SÔNG ĐỒNG NAI (TỰ VẼ UỐN LƯỢN) */}
          <path
            d="M 980,10 C 920,120 900,240 880,360 C 850,520 890,620 950,650 L 1000,650 L 1000,10 Z"
            fill="url(#riverGrad)"
            stroke="#0284C7"
            strokeWidth="1.5"
            strokeOpacity="0.6"
          />
          <text x="940" y="320" fill="#38BDF8" fontSize="11" fontFamily="monospace" transform="rotate(90 940 320)" textAnchor="middle" letterSpacing="4" opacity="0.7">
            SÔNG TẮC & SÔNG ĐỒNG NAI
          </text>

          {/* Kênh sinh thái dẫn nước vào Đại công viên 36ha */}
          <path
            d="M 880,360 C 820,350 780,330 740,320"
            fill="none"
            stroke="#0284C7"
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.6"
          />

          {/* 2. CÁC ĐẠI LỘ ĐÔ THỊ KẾT NỐI (ARTERIAL BOULEVARDS) */}
          {/* Trục Vành Đai 3 Cao Tốc (Chạy song song phía Tây) */}
          <path d="M 240,20 L 240,640" stroke="#1E293B" strokeWidth="24" />
          <path d="M 240,20 L 240,640" stroke="#0284C7" strokeWidth="2" strokeDasharray="12 8" opacity="0.6" />
          <text x="235" y="100" fill="#7DD3FC" fontSize="10" fontFamily="monospace" transform="rotate(-90 235 100)" textAnchor="middle" letterSpacing="2">
            TUYẾN VÀNH ĐAI 3 CAO TỐC
          </text>

          {/* Đại lộ Ánh Sáng / Rodeo (Nối từ Chung Cư ra Vincom Mega Mall) */}
          <path d="M 450,330 L 680,450" stroke="#334155" strokeWidth="16" strokeLinecap="round" />
          <path d="M 450,330 L 680,450" stroke="#C5A880" strokeWidth="1.5" strokeDasharray="8 6" opacity="0.7" />

          {/* Trục D1 & Cầu dạo bộ công viên */}
          <path d="M 500,100 L 500,600" stroke="#1E293B" strokeWidth="12" />
          <path d="M 500,100 L 500,600" stroke="#64748B" strokeWidth="1" strokeDasharray="6 6" opacity="0.5" />

          {/* 3. TỰ VẼ KHU ĐẠI CÔNG VIÊN 36HA & BIỂN HỒ CÁT TRẮNG (SUR-03) */}
          <path
            d="M 720,240 C 820,220 860,260 840,370 C 820,440 730,420 700,340 C 690,290 700,250 720,240 Z"
            fill="url(#park36haGrad)"
            stroke="#059669"
            strokeWidth="2"
          />
          {/* Lòng biển hồ cát trắng nước ngọt */}
          <path
            d="M 740,270 C 800,255 830,285 815,355 C 800,395 745,380 725,335 C 720,300 725,280 740,270 Z"
            fill="#06B6D4"
            fillOpacity="0.6"
            stroke="#67E8F9"
            strokeWidth="1.5"
          />
          <text x="770" y="325" fill="#FFFFFF" fontSize="10" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">
            BIỂN HỒ 36HA
          </text>

          {/* 4. VÒNG TRÒN CỰC RADAR (CONCENTRIC DISTANCE RINGS) TỪ CHUNG CƯ BS-07 */}
          {[
            { r: 70, label: '100m' },
            { r: 140, label: '250m' },
            { r: 230, label: '500m' },
            { r: 320, label: '750m' },
            { r: 410, label: '1.000m (1km)' }
          ].map((ring, idx) => (
            <g key={idx}>
              <circle
                cx={CENTER.x}
                cy={CENTER.y}
                r={ring.r}
                fill="none"
                stroke="#1E293B"
                strokeWidth="1"
                strokeDasharray="4 6"
                opacity="0.8"
              />
              <rect
                x={CENTER.x - 22}
                y={CENTER.y - ring.r - 8}
                width="44"
                height="16"
                rx="3"
                fill="#0A0F17"
                stroke="#2A3B50"
                strokeWidth="1"
              />
              <text
                x={CENTER.x}
                y={CENTER.y - ring.r + 4}
                fill="#64748B"
                fontSize="8"
                fontFamily="monospace"
                textAnchor="middle"
              >
                {ring.label}
              </text>
            </g>
          ))}

          {/* Trục chữ thập radar */}
          <line x1={CENTER.x - 420} y1={CENTER.y} x2={CENTER.x + 420} y2={CENTER.y} stroke="#1E293B" strokeWidth="1" opacity="0.6" />
          <line x1={CENTER.x} y1={CENTER.y - 320} x2={CENTER.x} y2={CENTER.y + 320} stroke="#1E293B" strokeWidth="1" opacity="0.6" />

          {/* 5. TIA LASER QUỸ ĐẠO KẾT NỐI KHI RÊ CHUỘT VÀO TIỆN ÍCH */}
          {activeCoord && (
            <g filter="url(#laserGlow)">
              <line
                x1={CENTER.x}
                y1={CENTER.y}
                x2={activeCoord.x}
                y2={activeCoord.y}
                stroke="#F59E0B"
                strokeWidth="2.5"
                strokeDasharray="6 4"
                className="animate-pulse"
              />
              {/* Badge khoảng cách trên thân đường nối */}
              <g transform={`translate(${(CENTER.x + activeCoord.x) / 2}, ${(CENTER.y + activeCoord.y) / 2 - 12})`}>
                <rect x="-55" y="-12" width="110" height="24" rx="4" fill="#0B111A" stroke="#F59E0B" strokeWidth="1.5" />
                <text x="0" y="4" fill="#F59E0B" fontSize="9.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                  {activeAmenity?.distance} • {activeAmenity?.walkTime}
                </text>
              </g>
            </g>
          )}

          {/* 6. TÂM ĐIỂM RADAR: CHUNG CƯ BS-07 • THE TROPICAL */}
          <g transform={`translate(${CENTER.x}, ${CENTER.y})`} className="cursor-pointer">
            {/* Vòng lan tỏa định vị */}
            <circle cx="0" cy="0" r="28" fill="none" stroke="#C5A880" strokeWidth="1.5" opacity="0.6" className="animate-ping" />
            <circle cx="0" cy="0" r="16" fill="#C5A880" fillOpacity="0.25" stroke="#F59E0B" strokeWidth="1.5" />
            
            {/* Biểu tượng Chung Cư chính */}
            <rect x="-10" y="-10" width="20" height="20" rx="3" fill="#C5A880" stroke="#FFFFFF" strokeWidth="2" />
            <text x="0" y="4" fill="#000000" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
              BS
            </text>

            {/* Nhãn tâm điểm */}
            <g transform="translate(0, 26)">
              <rect x="-70" y="-10" width="140" height="20" rx="3" fill="#0D1420" stroke="#C5A880" strokeWidth="1" />
              <text x="0" y="4" fill="#F8FAFC" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                CHUNG CƯ {selectedBlock} (BẠN ĐANG Ở ĐÂY)
              </text>
            </g>
          </g>

          {/* 7. TỰ VẼ 8 NODE ĐẠI TIỆN ÍCH XUNG QUANH */}
          {amenities.map((item) => {
            const coord = AMENITY_COORDS[item.id] || { x: 500, y: 200, color: '#C5A880', label: item.name };
            const isSelected = selectedAmenityId === item.id;
            const isHovered = hoveredAmenityId === item.id;
            const isHighlighted = isSelected || isHovered;

            return (
              <g
                key={item.id}
                transform={`translate(${coord.x}, ${coord.y})`}
                onClick={() => onSelectAmenity?.(isSelected ? null : item.id)}
                onMouseEnter={() => onHoverAmenity(item.id)}
                onMouseLeave={() => onHoverAmenity(null)}
                className="cursor-pointer group"
              >
                {/* Vòng phát sáng khi selected hoặc rê chuột */}
                {isHighlighted && (
                  <>
                    <circle cx="0" cy="0" r="32" fill="none" stroke={isSelected ? '#F59E0B' : coord.color} strokeWidth="2" opacity="0.8" className="animate-ping" />
                    <circle cx="0" cy="0" r="24" fill={coord.color} fillOpacity="0.3" stroke={coord.color} strokeWidth="1.5" />
                  </>
                )}
                {isSelected && (
                  <circle cx="0" cy="0" r="20" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="3 3" />
                )}

                {/* Node kiến trúc đại diện */}
                <rect
                  x="-16"
                  y="-16"
                  width="32"
                  height="32"
                  rx="6"
                  fill={isHighlighted ? (isSelected ? '#F59E0B' : coord.color) : '#0D1522'}
                  stroke={isHighlighted ? '#FFFFFF' : coord.color}
                  strokeWidth={isHighlighted ? 2.5 : 1.5}
                  className="transition-all duration-200 shadow-xl"
                />

                {/* Ký hiệu viết tắt tên node */}
                <text
                  x="0"
                  y="4"
                  fill={isHighlighted ? '#000000' : '#FFFFFF'}
                  fontSize="9"
                  fontFamily="monospace"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {item.id.replace('SUR-', '#')}
                </text>

                {/* Nhãn tên tiện ích dưới chân node */}
                <g transform="translate(0, 26)">
                  <rect
                    x="-65"
                    y="-8"
                    width="130"
                    height="18"
                    rx="3"
                    fill={isHighlighted ? '#0B111A' : '#070D16'}
                    stroke={isSelected ? '#F59E0B' : isHovered ? coord.color : '#233246'}
                    strokeWidth={isHighlighted ? 1.5 : 1}
                  />
                  <text
                    x="0"
                    y="4"
                    fill={isHovered ? '#FFFFFF' : '#94A3B8'}
                    fontSize="8.5"
                    fontWeight={isHovered ? 'bold' : 'normal'}
                    fontFamily="sans-serif"
                    textAnchor="middle"
                  >
                    {coord.label}
                  </text>
                </g>

                {/* Badge khoảng cách */}
                <text
                  x="0"
                  y="-22"
                  fill={coord.color}
                  fontSize="8.5"
                  fontFamily="monospace"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {item.distance}
                </text>
              </g>
            );
          })}

          {/* La bàn chỉ hướng */}
          <g transform="translate(920, 70)">
            <circle cx="0" cy="0" r="22" fill="#0D131F" stroke="#334155" strokeWidth="1" />
            <polygon points="0,-16 5,-3 -5,-3" fill="#EF4444" />
            <polygon points="0,16 5,3 -5,3" fill="#94A3B8" />
            <text x="0" y="-19" fill="#EF4444" fontSize="9" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">N</text>
            <text x="0" y="27" fill="#94A3B8" fontSize="8" fontFamily="sans-serif" textAnchor="middle">S</text>
            <text x="18" y="3" fill="#94A3B8" fontSize="8" fontFamily="sans-serif" textAnchor="middle">E</text>
            <text x="-18" y="3" fill="#94A3B8" fontSize="8" fontFamily="sans-serif" textAnchor="middle">W</text>
          </g>
        </svg>

        {/* HUD OVERLAY GÓC TRÁI: THÔNG TIN TIỆN ÍCH NGOẠI KHU ĐANG RÊ CHUỘT */}
        {activeAmenity && (
          <div className="absolute bottom-3 left-3 bg-[#0A0F17]/95 border border-[#C5A880] p-3 max-w-sm backdrop-blur-md shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-150 pointer-events-none">
            <div className="flex items-center justify-between text-[10px] font-mono text-[#C5A880] uppercase font-bold pb-1 border-b border-[#1E293B]">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                {activeAmenity.id} • {activeAmenity.categoryLabel}
              </span>
              <span className="text-emerald-400 font-bold">{activeAmenity.walkTime}</span>
            </div>
            <div className="text-white font-bold text-xs mt-1.5">
              {activeAmenity.name}
            </div>
            <div className="text-gray-300 text-[11px] mt-1 leading-relaxed">
              {activeAmenity.desc}
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-cyan-400 mt-2 pt-1.5 border-t border-[#1E293B]">
              <span>📍 Khoảng Cách: {activeAmenity.distance}</span>
              <span className="text-[#C5A880]">Kết Nối VinBus & Đi Bộ</span>
            </div>
          </div>
        )}

        {/* CHÚ DẪN PHẠM VI BÁN KÍNH */}
        <div className="absolute top-3 right-3 bg-[#0B111A]/90 border border-[#1E293B] px-2.5 py-1.5 text-[10px] font-mono text-gray-400 backdrop-blur-sm hidden sm:block">
          <div className="text-[#C5A880] font-bold">MẠNG LƯỚI ĐÔ THỊ:</div>
          <div className="text-[9.5px] mt-0.5 space-y-0.5">
            <div>• Vòng 1 (100m): VinBus, Rodeo Drive</div>
            <div>• Vòng 2 (250m): Vinschool, Golden Eagle</div>
            <div>• Vòng 3 (500m): Vincom Mega Mall, Biển hồ 36ha</div>
            <div>• Vòng 4 (750m): Vinmec, Bến du thuyền</div>
          </div>
        </div>
      </div>
    </div>
  );
}
