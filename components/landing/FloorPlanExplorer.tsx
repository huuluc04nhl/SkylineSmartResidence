'use client';

import React, { useState } from 'react';
import { DEMO_APARTMENTS, Apartment } from '@/lib/dataStore';
import { 
  Building2, 
  Box, 
  Layers, 
  Eye, 
  Sparkles,
  Lock,
  Compass
} from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import ApartmentModel3DViewer from '@/components/portal/shared/ApartmentModel3DViewer';
import BlockFloorplateViewer from '@/components/landing/BlockFloorplateViewer';

export default function FloorPlanExplorer() {
  const { isAuthenticated } = useAuth();
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [activeUnit, setActiveUnit] = useState<Apartment>(DEMO_APARTMENTS[0]);
  const [viewTab, setViewTab] = useState<'BLOCK_FLOORPLATE' | 'APARTMENT_3D' | 'PHOTO'>('BLOCK_FLOORPLATE');
  
  const filteredUnits = selectedType === 'ALL'
    ? DEMO_APARTMENTS
    : DEMO_APARTMENTS.filter((u) => u.apt_type === selectedType);

  const handleSelectUnit = (unit: Apartment) => {
    setActiveUnit(unit);
    // When clicking a unit, zoom into 3D view
    setViewTab('APARTMENT_3D');
  };

  return (
    <section id="floorplans" className="py-24 bg-[#0B0E14] border-b border-[#222B35] text-white select-none">
      <div className="max-w-7xl mx-auto px-6 space-y-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="text-[11px] uppercase tracking-[0.25em] text-[#C5A880] font-semibold flex items-center gap-2">
              <Box className="w-4 h-4 text-[#C5A880]" /> Mô Hình Khối Tháp 3D & Bản Vẽ Kỹ Thuật
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif text-white font-bold">
              Mặt Bằng Tầng Tổng Thể & Mô Phỏng Căn Hộ 3D
            </h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              Trải nghiệm sơ đồ mặt bằng tầng điển hình (Block A/B), thang máy Otis và mô phỏng 3D Isometric từng căn hộ. Chế độ xem công khai minh bạch.
            </p>
          </div>

          {/* Master View Switcher (Block Floorplate vs Apartment 3D vs Photo) */}
          <div className="flex bg-[#121820] p-1.5 border border-[#222B35] rounded">
            <button
              type="button"
              onClick={() => setViewTab('BLOCK_FLOORPLATE')}
              className={`px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition-all rounded flex items-center gap-1.5 ${
                viewTab === 'BLOCK_FLOORPLATE'
                  ? 'bg-[#C5A880] text-[#0D1117] shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4" /> 1. Sơ Đồ Khối Tầng (Floorplate)
            </button>
            <button
              type="button"
              onClick={() => setViewTab('APARTMENT_3D')}
              className={`px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition-all rounded flex items-center gap-1.5 ${
                viewTab === 'APARTMENT_3D'
                  ? 'bg-[#C5A880] text-[#0D1117] shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Box className="w-4 h-4" /> 2. Căn Hộ 3D ({activeUnit.apt_code})
            </button>
            <button
              type="button"
              onClick={() => setViewTab('PHOTO')}
              className={`px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition-all rounded flex items-center gap-1.5 ${
                viewTab === 'PHOTO'
                  ? 'bg-[#C5A880] text-[#0D1117] shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Eye className="w-4 h-4" /> 3. Ảnh Bàn Giao
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* VIEW 1: BLOCK & FLOORPLATE MASTER VIEW                        */}
        {/* ------------------------------------------------------------- */}
        {viewTab === 'BLOCK_FLOORPLATE' && (
          <div className="space-y-6">
            <BlockFloorplateViewer
              onSelectApartment={handleSelectUnit}
              selectedApartmentCode={activeUnit.apt_code}
            />

            {/* Quick Prompt to zoom into 3D Apartment */}
            <div className="p-4 bg-[#121820] border border-[#222B35] flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded">
              <div className="text-xs text-gray-300">
                Đang chọn: <strong className="text-white font-mono">Căn {activeUnit.apt_code}</strong> ({activeUnit.apt_type} • {activeUnit.clear_area} m²)
              </div>
              <button
                type="button"
                onClick={() => setViewTab('APARTMENT_3D')}
                className="px-4 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-colors rounded shadow flex items-center gap-1.5"
              >
                <span>Xem Mô Hình 3D Căn Hộ Này →</span>
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 2: DETAILED APARTMENT 3D SIMULATION (READ-ONLY ON PUBLIC)*/}
        {/* ------------------------------------------------------------- */}
        {viewTab === 'APARTMENT_3D' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Unit Cards Selector */}
            <div className="lg:col-span-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-gray-400 font-semibold mb-1">
                <span>Chọn căn hộ mẫu:</span>
                <span className="text-[10px] text-[#C5A880] font-mono">Chế Độ Xem Thử</span>
              </div>

              {/* Unit Type Filters */}
              <div className="flex flex-wrap gap-1.5 pb-2">
                {['ALL', 'Studio', '1PN', '2PN', '3PN'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`px-2.5 py-1 text-[10px] uppercase font-bold border transition-all rounded ${
                      selectedType === type
                        ? 'bg-[#C5A880] text-[#0D1117] border-[#C5A880]'
                        : 'bg-[#121820] text-gray-400 border-[#222B35] hover:text-white'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                {filteredUnits.map((unit) => {
                  const isSelected = activeUnit.id === unit.id;
                  return (
                    <div
                      key={unit.id}
                      onClick={() => setActiveUnit(unit)}
                      className={`p-3.5 border transition-all cursor-pointer rounded ${
                        isSelected
                          ? 'bg-[#161D26] border-[#C5A880] shadow-xl ring-1 ring-[#C5A880]'
                          : 'bg-[#121820] border-[#222B35] hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white font-mono">Căn {unit.apt_code}</span>
                        <span className="text-[10px] px-2 py-0.5 bg-[#1C2533] text-[#C5A880] border border-[#2D3748] rounded">
                          {unit.apt_type}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1 font-mono">{unit.clear_area} m² • Tầng {unit.floor_number}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: 3D Apartment Model Canvas */}
            <div className="lg:col-span-8 space-y-4">
              <ApartmentModel3DViewer
                apartmentCode={activeUnit.apt_code}
                apartmentType={activeUnit.apt_type}
                clearArea={activeUnit.clear_area}
                interactive={false} // Strictly read-only on public landing page!
              />

              {/* Public Read-Only Security Assurance Banner */}
              <div className="p-3 bg-[#121820] border border-[#222B35] text-[11px] text-gray-400 flex items-center justify-between rounded">
                <span className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-[#C5A880]" />
                  Bảo mật căn hộ: Quyền điều khiển công tắc, đèn và khóa cửa thuộc quyền riêng tư của từng chủ hộ sau khi đăng nhập.
                </span>
                <button
                  type="button"
                  onClick={() => setViewTab('BLOCK_FLOORPLATE')}
                  className="text-[#C5A880] hover:underline font-bold text-[11px] whitespace-nowrap"
                >
                  ← Về Sơ Đồ Khối
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 3: ACTUAL DELIVERY PHOTO GALLERY                         */}
        {/* ------------------------------------------------------------- */}
        {viewTab === 'PHOTO' && (
          <div className="space-y-4">
            <div className="relative border border-[#222B35] bg-[#121820] h-[480px] overflow-hidden rounded">
              <img
                src={activeUnit.thumbnail_url}
                alt={activeUnit.apt_code}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 left-4 bg-[#0D1117]/95 border border-[#C5A880] p-4 text-xs text-white backdrop-blur-md rounded max-w-lg space-y-1">
                <div className="font-bold text-[#C5A880] text-sm">Không Gian Thực Tế Căn Hộ {activeUnit.apt_code}</div>
                <div className="text-gray-300 text-xs">Bàn giao gói Full nội thất cao cấp: Thiết bị vệ sinh Kohler, Bếp từ Bosch, Điều hòa âm trần Daikin VRV, Cửa chống cháy FaceID chống trộm 4 lớp.</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
