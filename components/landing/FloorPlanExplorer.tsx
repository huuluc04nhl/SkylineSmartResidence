'use client';

import React, { useState } from 'react';
import { DEMO_APARTMENTS, Apartment } from '@/lib/dataStore';
import { 
  Maximize2, 
  BedDouble, 
  Bath, 
  CheckCircle2, 
  Shield, 
  Eye, 
  Cpu, 
  Zap, 
  Droplets, 
  Lock, 
  LockKeyhole,
  Box,
  Layers,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import ApartmentModel3DViewer from '@/components/portal/shared/ApartmentModel3DViewer';

export default function FloorPlanExplorer() {
  const { isAuthenticated, currentUser } = useAuth();
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [activeUnit, setActiveUnit] = useState<Apartment>(DEMO_APARTMENTS[0]);
  const [activeTab, setActiveTab] = useState<'3D_MODEL' | 'PHOTO'>('3D_MODEL');
  
  // Local state for interactive 3D model simulation
  const [lights, setLights] = useState({
    livingRoom: true,
    bedroomMaster: true,
    kitchen: true,
    balcony: false,
  });
  const [curtainsOpen, setCurtainsOpen] = useState(true);
  const [doorLocked, setDoorLocked] = useState(true);

  const filteredUnits = selectedType === 'ALL'
    ? DEMO_APARTMENTS
    : DEMO_APARTMENTS.filter((u) => u.apt_type === selectedType);

  const handleSelectUnit = (unit: Apartment) => {
    setActiveUnit(unit);
  };

  const handleToggleLight = (room: 'livingRoom' | 'bedroomMaster' | 'kitchen' | 'balcony') => {
    setLights(prev => ({ ...prev, [room]: !prev[room] }));
  };

  // Determine if the current viewer has write permission (resident of this unit)
  const isResidentOfThisUnit = isAuthenticated && (currentUser?.role === 'OWNER' || currentUser?.role === 'TENANT') && (currentUser?.apartment_code === activeUnit.apt_code || !currentUser?.apartment_code);

  return (
    <section id="floorplans" className="py-24 bg-[#0B0E14] border-b border-[#222B35] text-white select-none">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="text-[11px] uppercase tracking-[0.25em] text-[#C5A880] font-semibold flex items-center gap-2">
              <Box className="w-4 h-4 text-[#C5A880]" /> Mô Hình Khối Kiến Trúc 3D (Architectural Massing)
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif text-white font-bold">
              Bản Vẽ Phác Thảo Khối Không Gian Căn Hộ
            </h2>
            <p className="text-xs text-gray-400">
              Khám phá từng khối phòng độc lập chuẩn thiết kế kiến trúc sư (Living Lounge, Master Suite, Gourmet Kitchen, Sky Terrace) với bản vẽ mặt bằng 2D CAD và góc nhìn bóc tách 3D Exploded.
            </p>
          </div>

          {/* Unit Type Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {['ALL', 'Studio', '1PN', '2PN', '3PN', 'Duplex'].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-4 py-2 text-[11px] uppercase tracking-wider font-semibold border transition-all rounded ${
                  selectedType === type
                    ? 'bg-[#C5A880] text-[#0D1117] border-[#C5A880] shadow'
                    : 'bg-[#121820] text-gray-300 border-[#222B35] hover:border-[#C5A880] hover:text-white'
                }`}
              >
                {type === 'ALL' ? 'Tất cả loại căn' : type}
              </button>
            ))}
          </div>
        </div>

        {/* Main Grid: Interactive Unit Selector & 3D Viewer */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Unit Cards List */}
          <div className="lg:col-span-4 space-y-3">
            <div className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2 flex items-center justify-between">
              <span>Danh mục căn hộ mẫu ({filteredUnits.length})</span>
              <span className="text-[10px] text-[#C5A880] font-mono">Bàn Giao Smart Living</span>
            </div>

            <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
              {filteredUnits.map((unit) => {
                const isSelected = activeUnit.id === unit.id;
                return (
                  <div
                    key={unit.id}
                    onClick={() => handleSelectUnit(unit)}
                    className={`p-4 border transition-all cursor-pointer rounded ${
                      isSelected
                        ? 'bg-[#161D26] border-[#C5A880] shadow-xl ring-1 ring-[#C5A880]'
                        : 'bg-[#121820] border-[#222B35] hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-serif text-lg font-bold text-white">
                        Căn {unit.apt_code}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold bg-[#1C2533] border border-[#2D3748] text-[#C5A880] rounded">
                        {unit.apt_type}
                      </span>
                    </div>

                    <div className="text-xs text-gray-400 mt-1">{unit.block_code} • Tầng {unit.floor_number}</div>

                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#222B35] text-xs text-gray-400 font-mono">
                      <div>Thông thủy: <strong className="text-white">{unit.clear_area} m²</strong></div>
                      <div>Tim tường: <strong className="text-white">{unit.wall_area} m²</strong></div>
                    </div>

                    <div className="flex items-center justify-between mt-3 text-xs pt-1">
                      <span className="text-[#C5A880] font-bold font-mono">
                        {(unit.price_vnd / 1000000000).toFixed(2)} tỷ VNĐ
                      </span>
                      <span className={`text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded ${
                        unit.status === 'Đã bàn giao' ? 'bg-emerald-950/80 border border-emerald-500 text-emerald-300' : 'bg-blue-950/80 border border-blue-500 text-blue-300'
                      }`}>
                        {unit.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: 3D Interactive Model Simulation Canvas */}
          <div className="lg:col-span-8 space-y-4">
            {/* Top Display Switcher */}
            <div className="p-4 bg-[#121820] border border-[#222B35] flex flex-wrap items-center justify-between gap-4 rounded">
              <div>
                <div className="text-xs uppercase tracking-widest text-[#C5A880] font-semibold">
                  Mô Phỏng Kiến Trúc 3D / 2D Thực Tế Ảo
                </div>
                <h3 className="font-serif text-2xl text-white font-bold mt-0.5">
                  Căn Hộ {activeUnit.apt_code} ({activeUnit.apt_type})
                </h3>
              </div>

              {/* View Mode Switcher */}
              <div className="flex bg-[#0D1117] p-1 border border-[#222B35] rounded">
                <button
                  type="button"
                  onClick={() => setActiveTab('3D_MODEL')}
                  className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors rounded flex items-center gap-1.5 ${
                    activeTab === '3D_MODEL' ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Box className="w-3.5 h-3.5" /> Mô Hình 3D Khối Kiến Trúc
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('PHOTO')}
                  className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors rounded flex items-center gap-1.5 ${
                    activeTab === 'PHOTO' ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" /> Ảnh Thực Tế
                </button>
              </div>
            </div>

            {/* Display Component */}
            {activeTab === '3D_MODEL' && (
              <ApartmentModel3DViewer
                apartmentCode={activeUnit.apt_code}
                apartmentType={activeUnit.apt_type}
                clearArea={activeUnit.clear_area}
                lights={lights}
                curtainsOpen={curtainsOpen}
                doorLocked={doorLocked}
                onToggleLight={handleToggleLight}
                onToggleCurtains={() => setCurtainsOpen(!curtainsOpen)}
                onToggleDoor={() => setDoorLocked(!doorLocked)}
                interactive={Boolean(isResidentOfThisUnit)}
              />
            )}

            {activeTab === 'PHOTO' && (
              <div className="relative border border-[#222B35] bg-[#121820] h-[480px] overflow-hidden rounded">
                <img
                  src={activeUnit.thumbnail_url}
                  alt={activeUnit.apt_code}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 left-4 bg-[#0D1117]/90 border border-[#C5A880] p-3 text-xs text-white backdrop-blur-md rounded">
                  <div className="font-bold text-[#C5A880]">Không Gian Thực Tế Căn {activeUnit.apt_code}</div>
                  <div className="text-gray-300 text-[11px] mt-0.5">Tiêu chuẩn bàn giao Full nội thất cao cấp chuẩn Châu Âu (Kohler, Daikin, Bosch).</div>
                </div>
              </div>
            )}

            {/* Specifications Summary Footer */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-center">
              <div className="p-3 bg-[#121820] border border-[#222B35] rounded">
                <div className="text-[10px] text-gray-400 uppercase tracking-wider">Phòng Ngủ</div>
                <div className="font-serif text-lg font-bold text-white mt-0.5">{activeUnit.bedrooms} Phòng</div>
              </div>
              <div className="p-3 bg-[#121820] border border-[#222B35] rounded">
                <div className="text-[10px] text-gray-400 uppercase tracking-wider">Phòng Tắm</div>
                <div className="font-serif text-lg font-bold text-white mt-0.5">{activeUnit.bathrooms} Phòng</div>
              </div>
              <div className="p-3 bg-[#121820] border border-[#222B35] rounded">
                <div className="text-[10px] text-gray-400 uppercase tracking-wider">Thông Thủy</div>
                <div className="font-serif text-lg font-bold text-[#C5A880] mt-0.5">{activeUnit.clear_area} m²</div>
              </div>
              <div className="p-3 bg-[#121820] border border-[#222B35] rounded">
                <div className="text-[10px] text-gray-400 uppercase tracking-wider">Pháp Lý</div>
                <div className="font-serif text-sm font-bold text-emerald-400 mt-1">Sổ Hồng Lâu Dài</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
