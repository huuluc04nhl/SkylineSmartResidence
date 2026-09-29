'use client';

import React, { useState } from 'react';
import { Layers, Maximize2, Sparkles, Star, CheckCircle2, ShieldCheck } from 'lucide-react';
import { ApartmentUnit } from '@/lib/apartmentStore';
import { CAD_FLOOR_UNITS_CONFIG } from '../AdminBuildingApartmentManager';

interface CadFloorplanSvgModelProps {
  selectedFloor: number;
  selectedBlock: string;
  activeUnitCode?: string;
  onSelectUnit: (unit: ApartmentUnit) => void;
  unitsOnFloor: ApartmentUnit[];
  onOpenZoomModal?: () => void;
}

export default function CadFloorplanSvgModel({
  selectedFloor,
  selectedBlock,
  activeUnitCode,
  onSelectUnit,
  unitsOnFloor,
  onOpenZoomModal
}: CadFloorplanSvgModelProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [hoveredUnitCode, setHoveredUnitCode] = useState<string | null>(null);

  // Bản đồ vị trí CAD cho 21 căn hộ trên sàn kiến trúc chữ Z/T (1000 x 660)
  // Phân bố: Cánh Bắc (trên phải), Lõi thang máy (giữa), Cánh Nam (dưới phải), Cánh Tây (dãy dài bên trái)
  const UNIT_LAYOUT_COORDS: Record<string, { x: number; y: number; w: number; h: number; balcony: 'TOP' | 'BOTTOM' | 'LEFT' | 'RIGHT' }> = {
    // Cánh Bắc: Căn 01 - 05
    '01': { x: 740, y: 70, w: 120, h: 90, balcony: 'RIGHT' },
    '02': { x: 630, y: 70, w: 100, h: 90, balcony: 'TOP' },
    '03': { x: 520, y: 70, w: 100, h: 90, balcony: 'TOP' },
    '04': { x: 410, y: 70, w: 100, h: 90, balcony: 'TOP' },
    '05': { x: 300, y: 70, w: 100, h: 90, balcony: 'TOP' },

    // Cánh Nam: Căn 06 - 10
    '06': { x: 740, y: 390, w: 120, h: 95, balcony: 'RIGHT' },
    '07': { x: 630, y: 390, w: 100, h: 95, balcony: 'BOTTOM' },
    '08': { x: 520, y: 390, w: 100, h: 95, balcony: 'BOTTOM' },
    '09': { x: 410, y: 390, w: 100, h: 95, balcony: 'BOTTOM' },
    '10': { x: 300, y: 390, w: 100, h: 95, balcony: 'BOTTOM' },

    // Cánh Tây: Căn 11 - 21 (Dãy đối xứng 2 bên hành lang Tây)
    // Dãy trên (Bắc - Tây)
    '11': { x: 70, y: 70, w: 100, h: 100, balcony: 'LEFT' },
    '12': { x: 180, y: 70, w: 90, h: 100, balcony: 'TOP' },
    '13': { x: 70, y: 180, w: 100, h: 80, balcony: 'LEFT' },
    '14': { x: 70, y: 270, w: 100, h: 90, balcony: 'LEFT' },
    '15': { x: 70, y: 370, w: 100, h: 100, balcony: 'LEFT' },

    // Dãy dưới (Nam - Tây)
    '16': { x: 180, y: 370, w: 90, h: 100, balcony: 'BOTTOM' },
    '17': { x: 70, y: 480, w: 100, h: 90, balcony: 'BOTTOM' },
    '18': { x: 180, y: 480, w: 90, h: 90, balcony: 'BOTTOM' },
    '19': { x: 280, y: 495, w: 85, h: 75, balcony: 'BOTTOM' },
    '20': { x: 375, y: 495, w: 85, h: 75, balcony: 'BOTTOM' },
    '21': { x: 470, y: 495, w: 95, h: 75, balcony: 'BOTTOM' },
  };

  return (
    <div className="relative bg-[#060B12] border border-[#1E293B] rounded-none overflow-hidden select-none shadow-2xl flex flex-col">
      {/* Header */}
      <div className="px-3.5 py-2 bg-[#0A101A] border-b border-[#1E293B] flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#121C2B] border border-[#23354C] text-[#C5A880]">
            <Layers className="w-3.5 h-3.5 text-[#C5A880]" />
            <span className="font-bold tracking-wider uppercase text-[11px]">Sơ Đồ Mặt Bằng Tầng CAD Kỹ Thuật (Tự Vẽ 21 Căn)</span>
          </div>
          <span className="text-gray-400 text-[11px] hidden sm:inline">
            Chung Cư {selectedBlock} • Tầng {selectedFloor} • Tỉ lệ 1:100
          </span>
        </div>

        {/* Nút thu phóng */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setZoomLevel(prev => Math.max(0.8, Number((prev - 0.2).toFixed(1))))}
            className="px-2 py-0.5 bg-[#121A26] hover:bg-[#1A2637] border border-[#223247] text-gray-300 hover:text-white"
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
          >
            +
          </button>
          {onOpenZoomModal && (
            <button
              type="button"
              onClick={onOpenZoomModal}
              className="px-2.5 py-0.5 bg-[#C5A880] hover:bg-[#D4BC96] text-black font-bold flex items-center gap-1 ml-1"
            >
              <Maximize2 className="w-3 h-3" />
              <span className="text-[10.5px]">Toàn Cảnh</span>
            </button>
          )}
        </div>
      </div>

      {/* KHUNG VẼ CAD BLUEPRINT SVG */}
      <div className="relative w-full h-[480px] sm:h-[530px] bg-[#050C16] overflow-hidden flex items-center justify-center">
        {/* Lưới tọa độ CAD Blueprint Blueprint Grid */}
        <div 
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(to right, #0284C7 1px, transparent 1px), linear-gradient(to bottom, #0284C7 1px, transparent 1px)`,
            backgroundSize: '20px 20px'
          }}
        />

        <svg
          viewBox="0 0 1000 640"
          className="w-full h-full object-contain transition-transform duration-200"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <defs>
            <filter id="cadGoldGlow">
              <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#C5A880" floodOpacity="0.9" />
            </filter>
          </defs>

          {/* 1. LÕI KỸ THUẬT & HÀNH LANG TRUNG TÂM (CORE ELEVATOR & CORRIDOR) */}
          {/* Lõi thang máy trung tâm */}
          <rect x="340" y="200" width="360" height="150" fill="#0A1424" stroke="#0284C7" strokeWidth="2" strokeDasharray="4 2" />
          
          {/* 5 Thang máy tốc độ cao */}
          {[0, 1, 2, 3, 4].map(i => (
            <g key={i} transform={`translate(${360 + i * 55}, 215)`}>
              <rect x="0" y="0" width="45" height="50" rx="2" fill="#0F2038" stroke="#38BDF8" strokeWidth="1.5" />
              <line x1="5" y1="5" x2="40" y2="45" stroke="#38BDF8" strokeWidth="1" strokeOpacity="0.5" />
              <line x1="40" y1="5" x2="5" y2="45" stroke="#38BDF8" strokeWidth="1" strokeOpacity="0.5" />
              <text x="22" y="30" fill="#BAE6FD" fontSize="8" fontFamily="monospace" textAnchor="middle">THANG {i + 1}</text>
            </g>
          ))}

          {/* Thang bộ thoát hiểm 1 & 2 */}
          <g transform="translate(645, 215)">
            <rect x="0" y="0" width="45" height="50" fill="#1C1917" stroke="#EA580C" strokeWidth="1.5" />
            <text x="22" y="28" fill="#FDBA74" fontSize="8" fontFamily="monospace" textAnchor="middle">THANG BỘ 1</text>
          </g>
          <g transform="translate(360, 280)">
            <rect x="0" y="0" width="45" height="50" fill="#1C1917" stroke="#EA580C" strokeWidth="1.5" />
            <text x="22" y="28" fill="#FDBA74" fontSize="8" fontFamily="monospace" textAnchor="middle">THANG BỘ 2</text>
          </g>

          {/* Phòng kỹ thuật rác & Hộp gen MEP */}
          <rect x="420" y="280" width="70" height="50" fill="#0C1E34" stroke="#64748B" strokeWidth="1" />
          <text x="455" y="308" fill="#94A3B8" fontSize="8" fontFamily="monospace" textAnchor="middle">PHÒNG RÁC</text>

          {/* Hành lang thông khí 1.8m */}
          <rect x="500" y="280" width="190" height="50" fill="#0D1F36" stroke="#38BDF8" strokeWidth="1" strokeDasharray="3 3" />
          <text x="595" y="308" fill="#7DD3FC" fontSize="9" fontFamily="monospace" textAnchor="middle">HÀNH LANG TRUNG TÂM (1.8m)</text>

          {/* 2. TỰ VẼ 21 CĂN HỘ TRÊN MẶT SÀN CAD */}
          {CAD_FLOOR_UNITS_CONFIG.map(cfg => {
            const coord = UNIT_LAYOUT_COORDS[cfg.num] || { x: 100, y: 100, w: 80, h: 80, balcony: 'TOP' };
            const unit = unitsOnFloor.find(u => u.code.endsWith(cfg.code) || u.code === cfg.code);
            const isSelected = activeUnitCode === cfg.code || activeUnitCode?.endsWith(cfg.code);
            const isHovered = hoveredUnitCode === cfg.code;

            const isOccupied = unit?.status === 'OCCUPIED' || (selectedFloor === 12 && cfg.num === '05') || (selectedFloor % 2 === 0 && (cfg.num === '03' || cfg.num === '15' || cfg.num === '18'));

            return (
              <g
                key={cfg.code}
                transform={`translate(${coord.x}, ${coord.y})`}
                onClick={() => {
                  if (unit) onSelectUnit(unit);
                }}
                onMouseEnter={() => setHoveredUnitCode(cfg.code)}
                onMouseLeave={() => setHoveredUnitCode(null)}
                className="cursor-pointer group"
                filter={isSelected ? 'url(#cadGoldGlow)' : undefined}
              >
                {/* Viền tường căn hộ CAD (Wall outline with thickness) */}
                <rect
                  x="0"
                  y="0"
                  width={coord.w}
                  height={coord.h}
                  fill={
                    isSelected
                      ? '#162235'
                      : isHovered
                      ? '#111C2D'
                      : isOccupied
                      ? '#0B192A'
                      : '#08111D'
                  }
                  stroke={
                    isSelected
                      ? '#38BDF8'
                      : isHovered
                      ? '#94A3B8'
                      : isOccupied
                      ? '#0284C7'
                      : '#1E293B'
                  }
                  strokeWidth={isSelected ? 2.5 : 1.5}
                  className="transition-colors"
                />

                {/* Vách ban công kính kiến trúc */}
                {coord.balcony === 'TOP' && (
                  <line x1="10" y1="4" x2={coord.w - 10} y2="4" stroke="#38BDF8" strokeWidth="2.5" strokeDasharray="8 3" />
                )}
                {coord.balcony === 'BOTTOM' && (
                  <line x1="10" y1={coord.h - 4} x2={coord.w - 10} y2={coord.h - 4} stroke="#38BDF8" strokeWidth="2.5" strokeDasharray="8 3" />
                )}
                {coord.balcony === 'LEFT' && (
                  <line x1="4" y1="10" x2="4" y2={coord.h - 10} stroke="#38BDF8" strokeWidth="2.5" strokeDasharray="8 3" />
                )}
                {coord.balcony === 'RIGHT' && (
                  <line x1={coord.w - 4} y1="10" x2={coord.w - 4} y2={coord.h - 10} stroke="#38BDF8" strokeWidth="2.5" strokeDasharray="8 3" />
                )}

                {/* Vòng cung mở cửa ra vào hành lang (Door swing arc) */}
                <path
                  d={`M ${coord.w / 2 - 12},${coord.h} A 16 16 0 0 1 ${coord.w / 2 + 12},${coord.h}`}
                  fill="none"
                  stroke="#64748B"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />

                {/* Mã căn hộ */}
                <text
                  x={coord.w / 2}
                  y={coord.h / 2 - 12}
                  fill={isSelected ? '#38BDF8' : '#FFFFFF'}
                  fontSize="12"
                  fontFamily="sans-serif"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {cfg.code}
                </text>

                {/* Loại căn & Diện tích */}
                <text
                  x={coord.w / 2}
                  y={coord.h / 2 + 3}
                  fill={isSelected ? '#C5A880' : '#94A3B8'}
                  fontSize="9.5"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {cfg.type} • {cfg.area}m²
                </text>

                {/* Badge trạng thái */}
                <g transform={`translate(${coord.w / 2}, ${coord.h / 2 + 20})`}>
                  <rect
                    x="-36"
                    y="-8"
                    width="72"
                    height="16"
                    rx="3"
                    fill={isOccupied ? '#065F46' : '#1E293B'}
                  />
                  <text
                    x="0"
                    y="3.5"
                    fill={isOccupied ? '#A7F3D0' : '#94A3B8'}
                    fontSize="7.5"
                    fontFamily="monospace"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {isOccupied ? 'CÓ CƯ DÂN' : 'CĂN TRỐNG'}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>

        {/* Chú giải góc bản vẽ */}
        <div className="absolute bottom-3 left-3 bg-[#08101A]/95 border border-[#1E293B] p-2.5 text-[10.5px] font-mono text-gray-400 backdrop-blur-md">
          <div className="text-[#C5A880] font-bold">MẶT BẰNG 21 CĂN HỘ CHUNG CƯ {selectedBlock}:</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2.5 h-2.5 bg-[#38BDF8] inline-block" />
            <span>Đang Chọn</span>
            <span className="w-2.5 h-2.5 bg-[#065F46] inline-block ml-2" />
            <span>Đã Có Cư Dân</span>
            <span className="w-2.5 h-2.5 bg-[#1E293B] inline-block ml-2" />
            <span>Căn Trống</span>
          </div>
        </div>
      </div>
    </div>
  );
}
