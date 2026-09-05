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
  Box,
  Layers,
  Sparkles,
  Building,
  Building2,
  Compass,
  ArrowUpRight
} from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import ApartmentModel3DViewer from '@/components/portal/shared/ApartmentModel3DViewer';

export default function FloorPlanExplorer() {
  const { isAuthenticated, currentUser } = useAuth();
  const [selectedTower, setSelectedTower] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [activeUnit, setActiveUnit] = useState<Apartment>(DEMO_APARTMENTS[0]);
  const [activeTab, setActiveTab] = useState<'3D_APARTMENT' | '3D_TOWER' | 'PHOTO'>('3D_APARTMENT');
  
  // Trạng thái mô phỏng thiết bị căn hộ
  const [lights, setLights] = useState({
    livingRoom: true,
    bedroomMaster: true,
    kitchen: true,
    balcony: false,
  });
  const [curtainsOpen, setCurtainsOpen] = useState(true);
  const [doorLocked, setDoorLocked] = useState(true);

  // Bộ lọc kết hợp: Tòa tháp & Loại hình căn hộ
  const filteredUnits = DEMO_APARTMENTS.filter((unit) => {
    const matchTower = selectedTower === 'ALL' 
      ? true 
      : selectedTower === 'TOWER_A' 
        ? unit.block_id === 1 
        : unit.block_id === 2;
    const matchType = selectedType === 'ALL' ? true : unit.apt_type === selectedType;
    return matchTower && matchType;
  });

  const handleSelectUnit = (unit: Apartment) => {
    setActiveUnit(unit);
  };

  const handleToggleLight = (room: 'livingRoom' | 'bedroomMaster' | 'kitchen' | 'balcony') => {
    setLights(prev => ({ ...prev, [room]: !prev[room] }));
  };

  // Xác định quyền điều khiển: chỉ cư dân hoặc chủ hộ chính căn hộ đó mới có quyền
  const isResidentOfThisUnit = isAuthenticated && 
    (currentUser?.role === 'OWNER' || currentUser?.role === 'TENANT') && 
    (currentUser?.apartment_code === activeUnit.apt_code || !currentUser?.apartment_code);

  return (
    <section id="floorplans" className="py-24 bg-[#0B0E14] border-b border-[#222B35] text-white select-none">
      <div className="max-w-7xl mx-auto px-6">
        {/* ============================================================= */}
        {/* TIÊU ĐỀ PHÂN HỆ: CHUẨN HÓA TIẾNG VIỆT                         */}
        {/* ============================================================= */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="text-[11px] uppercase tracking-[0.25em] text-[#C5A880] font-semibold flex items-center gap-2">
              <Box className="w-4 h-4 text-[#C5A880]" /> Mô Hình Khối Kiến Trúc 3D
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif text-white font-bold tracking-tight">
              Mô Phỏng Không Gian Khối & Mặt Bằng Căn Hộ
            </h2>
            <p className="text-xs text-gray-300 leading-relaxed">
              Khám phá các khối phòng chức năng độc lập theo chuẩn thiết kế kiến trúc với mô hình 3D đa chiều, mặt bằng kỹ thuật 2D và mô hình khối toàn tòa tháp Skyline Residence.
            </p>
          </div>

          {/* Bộ Lọc Theo Tòa Tháp & Loại Căn Hộ */}
          <div className="flex flex-col gap-2.5">
            {/* Hàng 1: Lọc Tòa Tháp */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-[11px] uppercase text-gray-400 font-semibold font-mono mr-1">Tòa Tháp:</span>
              {[
                { id: 'ALL', label: 'Tất Cả Tòa Tháp' },
                { id: 'TOWER_A', label: 'Tòa Tháp A (Sapphire)' },
                { id: 'TOWER_B', label: 'Tòa Tháp B (Diamond)' }
              ].map((tower) => (
                <button
                  key={tower.id}
                  onClick={() => setSelectedTower(tower.id)}
                  className={`px-3.5 py-1.5 text-[11px] uppercase tracking-wider font-semibold border transition-all rounded ${
                    selectedTower === tower.id
                      ? 'bg-[#C5A880] text-[#0D1117] border-[#C5A880] font-bold shadow'
                      : 'bg-[#121820] text-gray-300 border-[#222B35] hover:border-[#C5A880] hover:text-white'
                  }`}
                >
                  {tower.label}
                </button>
              ))}
            </div>

            {/* Hàng 2: Lọc Loại Căn */}
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[11px] uppercase text-gray-400 font-semibold font-mono mr-1">Loại Căn:</span>
              {['ALL', '1PN', '2PN', '3PN', 'Duplex'].map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-3 py-1 text-[10.5px] uppercase tracking-wider font-semibold border transition-all rounded ${
                    selectedType === type
                      ? 'bg-[#1E293B] text-[#C5A880] border-[#C5A880] shadow font-bold'
                      : 'bg-[#0D1117] text-gray-400 border-[#222B35] hover:border-gray-500 hover:text-white'
                  }`}
                >
                  {type === 'ALL' ? 'Tất cả loại căn' : type}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ============================================================= */}
        {/* LƯỚI NỘI DUNG CHÍNH: DANH SÁCH CĂN HỘ & MÔ HÌNH KHỐI 3D        */}
        {/* ============================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Cột Trái: Danh Mục Căn Hộ */}
          <div className="lg:col-span-4 space-y-3">
            <div className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2 flex items-center justify-between">
              <span>Danh Mục Căn Hộ Tuyển Chọn ({filteredUnits.length})</span>
              <span className="text-[10px] text-[#C5A880] font-mono">Bàn Giao Hoàn Thiện</span>
            </div>

            <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
              {filteredUnits.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-xs bg-[#121820] border border-[#222B35] rounded">
                  Không tìm thấy căn hộ phù hợp với bộ lọc hiện tại.
                </div>
              ) : (
                filteredUnits.map((unit) => {
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
                          Căn Hộ {unit.apt_code}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold bg-[#1C2533] border border-[#2D3748] text-[#C5A880] rounded">
                          {unit.apt_type}
                        </span>
                      </div>

                      <div className="text-xs text-gray-300 mt-1 font-medium">
                        {unit.block_id === 1 ? 'Tòa Tháp A (Sapphire)' : 'Tòa Tháp B (Diamond)'} • Tầng {unit.floor_number}
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#222B35] text-xs text-gray-400 font-mono">
                        <div>Thông thủy: <strong className="text-white">{unit.clear_area} m²</strong></div>
                        <div>Tim tường: <strong className="text-white">{unit.wall_area} m²</strong></div>
                      </div>

                      <div className="flex items-center justify-between mt-3 text-xs pt-1">
                        <span className="text-[#C5A880] font-bold font-mono text-sm">
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
                })
              )}
            </div>
          </div>

          {/* Cột Phải: Bộ Hiển Thị Mô Hình Khối 3D Đa Chiều */}
          <div className="lg:col-span-8 space-y-4">
            {/* Thanh Tiêu Đề & Bộ Chuyển Đổi Tab Xem */}
            <div className="p-4 bg-[#121820] border border-[#222B35] flex flex-wrap items-center justify-between gap-4 rounded shadow-lg">
              <div>
                <div className="text-[10.5px] uppercase tracking-widest text-[#C5A880] font-semibold font-mono">
                  Mô Phỏng Không Gian Kiến Trúc Đa Chiều
                </div>
                <h3 className="font-serif text-2xl text-white font-bold mt-0.5">
                  Căn Hộ {activeUnit.apt_code} ({activeUnit.apt_type}) • {activeUnit.block_id === 1 ? 'Tháp A' : 'Tháp B'}
                </h3>
              </div>

              {/* 3 Tab Chuyển Đổi Xem */}
              <div className="flex bg-[#0D1117] p-1 border border-[#222B35] rounded">
                <button
                  type="button"
                  onClick={() => setActiveTab('3D_APARTMENT')}
                  className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors rounded flex items-center gap-1.5 ${
                    activeTab === '3D_APARTMENT' ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Box className="w-3.5 h-3.5" /> Mô Hình Khối Căn Hộ
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('3D_TOWER')}
                  className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors rounded flex items-center gap-1.5 ${
                    activeTab === '3D_TOWER' ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" /> Mô Hình Khối Tòa Tháp
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

            {/* TAB 1: Mô Hình Khối Căn Hộ (Apartment 3D Massing & 2D CAD) */}
            {activeTab === '3D_APARTMENT' && (
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

            {/* TAB 2: Mô Hình Khối Tòa Tháp (Building Tower 3D Massing) */}
            {activeTab === '3D_TOWER' && (
              <div className="relative border border-[#222B35] bg-[#070A0F] h-[510px] overflow-hidden rounded-lg shadow-2xl flex flex-col justify-center items-center">
                {/* Lưới Nền Phối Cảnh Đô Thị */}
                <div 
                  className="absolute inset-0 opacity-15 pointer-events-none"
                  style={{
                    backgroundImage: 'linear-gradient(to right, #1E293B 1px, transparent 1px), linear-gradient(to bottom, #1E293B 1px, transparent 1px)',
                    backgroundSize: '30px 30px'
                  }}
                />

                {/* SVG Mô Phỏng 3D Khối Toàn Tòa Tháp Skyline Residence */}
                <div className="relative transform scale-90 sm:scale-100 transition-all duration-500">
                  <svg viewBox="0 0 800 480" className="w-[740px] h-[450px]">
                    <defs>
                      <linearGradient id="towerAGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#1E293B" />
                        <stop offset="50%" stopColor="#334155" />
                        <stop offset="100%" stopColor="#0F172A" />
                      </linearGradient>
                      <linearGradient id="towerBGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#1A2234" />
                        <stop offset="50%" stopColor="#2A374F" />
                        <stop offset="100%" stopColor="#0C1322" />
                      </linearGradient>
                      <linearGradient id="activeFloorGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#C5A880" />
                        <stop offset="50%" stopColor="#FDE68A" />
                        <stop offset="100%" stopColor="#D97706" />
                      </linearGradient>
                    </defs>

                    {/* Khối Mặt Đất / Quảng Trường Cảnh Quan */}
                    <ellipse cx="400" cy="430" rx="340" ry="40" fill="#0B1017" stroke="#1F2937" strokeWidth="2" />
                    
                    {/* Khối Đế Thương Mại Podium (Tầng 1 - 3) */}
                    <rect x="220" y="360" width="360" height="60" rx="4" fill="#131B26" stroke="#334155" strokeWidth="1.5" />
                    <text x="400" y="395" fill="#94A3B8" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                      KHỐI ĐẾ THƯƠNG MẠI & DỊCH VỤ TIỆN ÍCH 5 SAO (TẦNG 1 - 3)
                    </text>

                    {/* --------------------------------------------------- */}
                    {/* THÁP A - SAPPHIRE (25 Tầng - Trái)                  */}
                    {/* --------------------------------------------------- */}
                    <g className="cursor-pointer">
                      {/* Thân Tòa Tháp A */}
                      <rect x="250" y="80" width="130" height="280" rx="2" fill="url(#towerAGradient)" stroke="#475569" strokeWidth="1.5" />
                      {/* Mái Kính Sky Deck */}
                      <polygon points="250,80 315,50 380,80" fill="#1E293B" stroke="#C5A880" strokeWidth="1.5" />
                      <circle cx="315" cy="50" r="3" fill="#EF4444" className="animate-ping" />

                      {/* Các Tầng Của Tháp A (Minh Họa) */}
                      {Array.from({ length: 22 }).map((_, idx) => {
                        const floorNum = 25 - idx;
                        const yPos = 85 + idx * 12.2;
                        const isThisFloor = activeUnit.block_id === 1 && activeUnit.floor_number === floorNum;
                        return (
                          <g key={floorNum}>
                            <rect
                              x="254"
                              y={yPos}
                              width="122"
                              height="8"
                              rx="1"
                              fill={isThisFloor ? "url(#activeFloorGlow)" : "#1E2638"}
                              stroke={isThisFloor ? "#FFFFFF" : "#2E3B52"}
                              strokeWidth={isThisFloor ? 1.5 : 0.6}
                              opacity={isThisFloor ? 1 : 0.85}
                            />
                            {isThisFloor && (
                              <g transform={`translate(240, ${yPos + 4})`}>
                                <line x1="0" y1="0" x2="-60" y2="0" stroke="#C5A880" strokeWidth="1.5" strokeDasharray="3 2" />
                                <circle cx="0" cy="0" r="4" fill="#F59E0B" />
                                <rect x="-195" y="-12" width="130" height="24" rx="4" fill="#0D1117" stroke="#C5A880" strokeWidth="1.5" />
                                <text x="-130" y="4" fill="#FDE68A" fontSize="9.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                                  Căn Hộ {activeUnit.apt_code} • Tầng {activeUnit.floor_number}
                                </text>
                              </g>
                            )}
                          </g>
                        );
                      })}

                      {/* Nhãn Tòa Tháp A */}
                      <rect x="260" y="325" width="110" height="22" rx="3" fill="#0D1117" stroke="#38BDF8" strokeWidth="1.2" />
                      <text x="315" y="340" fill="#38BDF8" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                        TÒA THÁP A (25 TẦNG)
                      </text>
                    </g>

                    {/* --------------------------------------------------- */}
                    {/* CẦU KÍNH SKYBRIDGE & HỒ BƠI CHÂN MÂY (Tầng 20-21)   */}
                    {/* --------------------------------------------------- */}
                    <rect x="380" y="135" width="60" height="18" rx="2" fill="#0284C7" stroke="#38BDF8" strokeWidth="1.2" opacity="0.9" />
                    <text x="410" y="147" fill="#FFFFFF" fontSize="7" fontWeight="bold" textAnchor="middle">
                      SKYBRIDGE
                    </text>

                    {/* --------------------------------------------------- */}
                    {/* THÁP B - DIAMOND (20 Tầng - Phải)                   */}
                    {/* --------------------------------------------------- */}
                    <g className="cursor-pointer">
                      {/* Thân Tòa Tháp B */}
                      <rect x="440" y="135" width="120" height="225" rx="2" fill="url(#towerBGradient)" stroke="#475569" strokeWidth="1.5" />
                      {/* Mái Kính Tháp B */}
                      <polygon points="440,135 500,110 560,135" fill="#1E293B" stroke="#C5A880" strokeWidth="1.5" />

                      {/* Các Tầng Của Tháp B */}
                      {Array.from({ length: 18 }).map((_, idx) => {
                        const floorNum = 20 - idx;
                        const yPos = 140 + idx * 12;
                        const isThisFloor = activeUnit.block_id === 2 && activeUnit.floor_number === floorNum;
                        return (
                          <g key={floorNum}>
                            <rect
                              x="444"
                              y={yPos}
                              width="112"
                              height="8"
                              rx="1"
                              fill={isThisFloor ? "url(#activeFloorGlow)" : "#1B2333"}
                              stroke={isThisFloor ? "#FFFFFF" : "#2A364B"}
                              strokeWidth={isThisFloor ? 1.5 : 0.6}
                              opacity={isThisFloor ? 1 : 0.85}
                            />
                            {isThisFloor && (
                              <g transform={`translate(560, ${yPos + 4})`}>
                                <line x1="0" y1="0" x2="50" y2="0" stroke="#C5A880" strokeWidth="1.5" strokeDasharray="3 2" />
                                <circle cx="0" cy="0" r="4" fill="#F59E0B" />
                                <rect x="55" y="-12" width="130" height="24" rx="4" fill="#0D1117" stroke="#C5A880" strokeWidth="1.5" />
                                <text x="120" y="4" fill="#FDE68A" fontSize="9.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                                  Căn Hộ {activeUnit.apt_code} • Tầng {activeUnit.floor_number}
                                </text>
                              </g>
                            )}
                          </g>
                        );
                      })}

                      {/* Nhãn Tòa Tháp B */}
                      <rect x="445" y="325" width="110" height="22" rx="3" fill="#0D1117" stroke="#10B981" strokeWidth="1.2" />
                      <text x="500" y="340" fill="#10B981" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                        TÒA THÁP B (20 TẦNG)
                      </text>
                    </g>
                  </svg>
                </div>

                {/* Chú Thích HUD Trên Mô Hình Tòa Tháp */}
                <div className="absolute top-3 left-3 bg-[#0D1117]/95 border border-[#222B35] p-3 text-xs space-y-1 backdrop-blur-md rounded shadow-xl">
                  <div className="text-white font-bold flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#C5A880]" />
                    <span>Mô Hình Khối Tòa Tháp Skyline Smart Residence</span>
                  </div>
                  <div className="text-gray-300 font-mono text-[11px]">
                    Vị trí căn hộ: <strong className="text-[#C5A880]">Căn Hộ {activeUnit.apt_code} • {activeUnit.block_id === 1 ? 'Tháp A (Sapphire)' : 'Tháp B (Diamond)'} • Tầng {activeUnit.floor_number}</strong>
                  </div>
                  <div className="text-gray-400 font-mono text-[10px]">
                    Tổng thể dự án: <strong>2 Tháp Căn Hộ • 45 Tầng Nổi • 3 Tầng Hầm Đỗ Xe AI</strong>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Ảnh Thực Tế Bàn Giao */}
            {activeTab === 'PHOTO' && (
              <div className="relative border border-[#222B35] bg-[#121820] h-[510px] overflow-hidden rounded-lg shadow-xl">
                <img
                  src={activeUnit.thumbnail_url}
                  alt={activeUnit.apt_code}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 left-4 right-4 bg-[#0D1117]/90 border border-[#C5A880] p-4 text-xs text-white backdrop-blur-md rounded shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-base text-[#C5A880]">
                      Không Gian Bàn Giao Thực Tế • Căn Hộ {activeUnit.apt_code} ({activeUnit.apt_type})
                    </div>
                    <div className="text-gray-300 text-xs mt-1">
                      Tiêu chuẩn hoàn thiện nội thất Châu Âu: Thiết bị vệ sinh Kohler, Bếp từ âm Bosch, Hệ thống điều hòa âm trần Daikin Inverter.
                    </div>
                  </div>
                  <div className="px-3 py-1.5 bg-[#161B22] border border-emerald-500/50 text-emerald-300 font-mono text-[11px] rounded whitespace-nowrap text-center">
                    ✓ Sẵn Sàng Bàn Giao
                  </div>
                </div>
              </div>
            )}

            {/* Thông Số Kỹ Thuật Tóm Tắt Chân Trang */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-center">
              <div className="p-3 bg-[#121820] border border-[#222B35] rounded">
                <div className="text-[10px] text-gray-400 uppercase tracking-wider">Phòng Ngủ</div>
                <div className="font-serif text-lg font-bold text-white mt-0.5">{activeUnit.bedrooms} Phòng</div>
              </div>
              <div className="p-3 bg-[#121820] border border-[#222B35] rounded">
                <div className="text-[10px] text-gray-400 uppercase tracking-wider">Phòng Tắm / WC</div>
                <div className="font-serif text-lg font-bold text-white mt-0.5">{activeUnit.bathrooms} Phòng</div>
              </div>
              <div className="p-3 bg-[#121820] border border-[#222B35] rounded">
                <div className="text-[10px] text-gray-400 uppercase tracking-wider">Diện Tích Thông Thủy</div>
                <div className="font-serif text-lg font-bold text-[#C5A880] mt-0.5">{activeUnit.clear_area} m²</div>
              </div>
              <div className="p-3 bg-[#121820] border border-[#222B35] rounded">
                <div className="text-[10px] text-gray-400 uppercase tracking-wider">Tình Trạng Pháp Lý</div>
                <div className="font-serif text-sm font-bold text-emerald-400 mt-1">Sổ Hồng Lâu Dài</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
