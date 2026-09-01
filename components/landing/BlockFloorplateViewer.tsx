'use client';

import React, { useState } from 'react';
import { 
  Building2, 
  Layers, 
  Box, 
  Compass, 
  Maximize2, 
  CheckCircle2, 
  Sparkles, 
  Flame, 
  Zap,
  ArrowRight,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { DEMO_APARTMENTS, Apartment } from '@/lib/dataStore';

interface BlockFloorplateViewerProps {
  onSelectApartment?: (apartment: Apartment) => void;
  selectedApartmentCode?: string;
}

export default function BlockFloorplateViewer({
  onSelectApartment,
  selectedApartmentCode = '12A05'
}: BlockFloorplateViewerProps) {
  const [selectedBlock, setSelectedBlock] = useState<'BLOCK_A' | 'BLOCK_B'>('BLOCK_A');
  const [selectedFloor, setSelectedFloor] = useState<number>(12);
  const [hoveredUnitCode, setHoveredUnitCode] = useState<string | null>(null);

  // Floorplate Units Matrix for the selected floor
  const floorUnits = [
    { code: '12A01', type: '1PN', area: 52.3, status: 'Đã bàn giao', price: '3.4 tỷ', orientation: 'Đông Nam (View Sông)', pos: 'top-left' },
    { code: '12A02', type: '2PN', area: 75.8, status: 'Đang mở bán', price: '4.8 tỷ', orientation: 'Đông Bắc (View Landmark)', pos: 'top-mid' },
    { code: '12A03', type: 'Studio', area: 38.5, status: 'Đã bàn giao', price: '2.6 tỷ', orientation: 'Tây Bắc (Nội Khu)', pos: 'top-right' },
    { code: '12A05', type: '2PN Corner', area: 78.5, status: 'Căn Hộ Mẫu (Smart Living)', price: '5.2 tỷ', orientation: 'Đông Nam - Tây Nam (Góc 2 Mặt Thoáng)', pos: 'bot-left', isFeatured: true },
    { code: '12A06', type: '3PN Luxury', area: 110.2, status: 'Đang mở bán', price: '7.6 tỷ', orientation: 'Tây Nam (View Công Viên)', pos: 'bot-mid' },
    { code: '12A08', type: '2PN', area: 76.0, status: 'Đã bàn giao', price: '4.9 tỷ', orientation: 'Tây Bắc (View Hồ Bơi T25)', pos: 'bot-right' },
  ];

  const handleUnitClick = (code: string) => {
    const matched = DEMO_APARTMENTS.find(a => a.apt_code === code) || DEMO_APARTMENTS[0];
    if (onSelectApartment) {
      onSelectApartment(matched);
    }
  };

  return (
    <div className="w-full bg-[#0D1117] border border-[#222B35] rounded shadow-2xl p-4 sm:p-6 space-y-6 text-white select-none">
      {/* Top Header: Tower & Floor Selectors */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#222B35] pb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-semibold flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-[#C5A880]" /> Sơ Đồ Khối Tháp & Mặt Bằng Tầng Tổng Thể (Master Floorplate)
          </div>
          <h3 className="font-serif text-xl sm:text-2xl font-bold text-white mt-1">
            {selectedBlock === 'BLOCK_A' ? 'Tháp A (Diamond Tower)' : 'Tháp B (Sapphire Tower)'} • Mặt Bằng Tầng {selectedFloor}
          </h3>
        </div>

        {/* Controls: Block Switcher & Floor Level Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Block Switch */}
          <div className="flex bg-[#161B22] p-1 border border-[#222B35] rounded text-xs font-bold">
            <button
              type="button"
              onClick={() => setSelectedBlock('BLOCK_A')}
              className={`px-3 py-1.5 rounded transition-all ${
                selectedBlock === 'BLOCK_A' ? 'bg-[#C5A880] text-[#0D1117] shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              Tháp A (Diamond)
            </button>
            <button
              type="button"
              onClick={() => setSelectedBlock('BLOCK_B')}
              className={`px-3 py-1.5 rounded transition-all ${
                selectedBlock === 'BLOCK_B' ? 'bg-[#C5A880] text-[#0D1117] shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              Tháp B (Sapphire)
            </button>
          </div>

          {/* Floor Switch */}
          <div className="flex items-center gap-1 bg-[#161B22] p-1 border border-[#222B35] rounded text-xs font-mono">
            <span className="text-gray-400 px-2 text-[11px]">Tầng:</span>
            {[5, 12, 20, 25].map((fl) => (
              <button
                key={fl}
                type="button"
                onClick={() => setSelectedFloor(fl)}
                className={`px-2.5 py-1 rounded transition-all ${
                  selectedFloor === fl ? 'bg-[#1C2533] text-[#C5A880] border border-[#C5A880] font-bold' : 'text-gray-400 hover:text-white'
                }`}
              >
                {fl === 25 ? 'T25 (Sky Pool)' : `T${fl}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive 2D/3D Master Floorplate Schematic */}
      <div className="relative bg-[#070A0E] border border-[#222B35] rounded p-4 sm:p-6 overflow-hidden">
        {/* Architectural Grid Background */}
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(#C5A880 1px, transparent 1px), radial-gradient(#222B35 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        />

        {/* Floorplate Grid: 3 Units on Top, Central Core Corridor in Middle, 3 Units on Bottom */}
        <div className="relative z-10 max-w-4xl mx-auto space-y-4">
          {/* Top Row: Units 12A01, 12A02, 12A03 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {floorUnits.slice(0, 3).map((unit) => {
              const isSelected = selectedApartmentCode === unit.code;
              return (
                <div
                  key={unit.code}
                  onClick={() => handleUnitClick(unit.code)}
                  onMouseEnter={() => setHoveredUnitCode(unit.code)}
                  onMouseLeave={() => setHoveredUnitCode(null)}
                  className={`p-3.5 border transition-all cursor-pointer rounded text-left ${
                    isSelected
                      ? 'bg-[#1C2533] border-[#C5A880] shadow-[0_0_20px_rgba(197,168,128,0.3)] ring-1 ring-[#C5A880]'
                      : 'bg-[#121820] border-[#222B35] hover:border-gray-500 hover:bg-[#161D26]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white font-mono">CĂN {unit.code}</span>
                    <span className="text-[10px] px-2 py-0.5 bg-[#0D1117] text-[#C5A880] border border-[#2D3748] rounded font-semibold">
                      {unit.type}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1 font-mono">{unit.area} m² • {unit.orientation}</div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#222B35] text-[11px]">
                    <span className="text-[#C5A880] font-bold">{unit.price}</span>
                    <span className="text-emerald-400 text-[10px]">{unit.status}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Central Elevator & Service Core (Sảnh Thang Máy & Lối Thoát Hiểm) */}
          <div className="p-3.5 bg-[#161D26] border-2 border-dashed border-[#2E3B4E] rounded grid grid-cols-1 sm:grid-cols-3 gap-3 items-center text-center">
            {/* Left Exit Stairs */}
            <div className="p-2 bg-[#0D1117] border border-[#222B35] rounded text-[10px] text-gray-300 flex items-center justify-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <span>Thang Bộ Thoát Hiểm PCCC 1</span>
            </div>

            {/* Central Elevator Lobby */}
            <div className="p-2.5 bg-[#121820] border border-[#C5A880] rounded space-y-1">
              <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-center gap-1.5">
                <Box className="w-3.5 h-3.5 text-[#C5A880]" />
                Sảnh Thang Máy Thẻ Từ Otis (4 Cabin)
              </div>
              <div className="text-[10px] text-emerald-400 font-mono">
                Hành Lang Điều Hòa 24/7 • Đèn LED Cảm Ứng mmWave
              </div>
            </div>

            {/* Right Exit Stairs */}
            <div className="p-2 bg-[#0D1117] border border-[#222B35] rounded text-[10px] text-gray-300 flex items-center justify-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Trục Hộp Kỹ Thuật & PCCC 2</span>
            </div>
          </div>

          {/* Bottom Row: Units 12A05, 12A06, 12A08 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {floorUnits.slice(3, 6).map((unit) => {
              const isSelected = selectedApartmentCode === unit.code;
              return (
                <div
                  key={unit.code}
                  onClick={() => handleUnitClick(unit.code)}
                  onMouseEnter={() => setHoveredUnitCode(unit.code)}
                  onMouseLeave={() => setHoveredUnitCode(null)}
                  className={`p-3.5 border transition-all cursor-pointer rounded text-left ${
                    isSelected
                      ? 'bg-[#1C2533] border-[#C5A880] shadow-[0_0_20px_rgba(197,168,128,0.3)] ring-1 ring-[#C5A880]'
                      : 'bg-[#121820] border-[#222B35] hover:border-gray-500 hover:bg-[#161D26]'
                  } ${unit.isFeatured ? 'relative overflow-hidden' : ''}`}
                >
                  {unit.isFeatured && (
                    <div className="absolute top-0 right-0 bg-[#C5A880] text-[#0D1117] text-[8px] font-bold px-2 py-0.5 uppercase tracking-wider rounded-bl">
                      Căn Mẫu 3D
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white font-mono">CĂN {unit.code}</span>
                    <span className="text-[10px] px-2 py-0.5 bg-[#0D1117] text-[#C5A880] border border-[#2D3748] rounded font-semibold">
                      {unit.type}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1 font-mono">{unit.area} m² • {unit.orientation}</div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#222B35] text-[11px]">
                    <span className="text-[#C5A880] font-bold">{unit.price}</span>
                    <span className="text-emerald-400 text-[10px]">{unit.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Guide Footer */}
        <div className="mt-4 pt-3 border-t border-[#222B35] flex flex-wrap items-center justify-between gap-2 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-[#C5A880]" />
            <span>Hướng chính: Đông Nam (Mặt tiền đón gió sông tự nhiên)</span>
          </div>
          <div className="text-[#C5A880] font-mono text-[11px]">
            * Bấm vào từng căn hộ trên sơ đồ để phóng to mô hình 3D chi tiết
          </div>
        </div>
      </div>
    </div>
  );
}
