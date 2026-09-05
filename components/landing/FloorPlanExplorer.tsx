'use client';

import React, { useState } from 'react';
import { DEMO_APARTMENTS, Apartment } from '@/lib/dataStore';
import { 
  Box, 
  Eye, 
  CheckCircle2, 
  Layers
} from 'lucide-react';
import ApartmentModel3DViewer from '@/components/portal/shared/ApartmentModel3DViewer';

export default function FloorPlanExplorer() {
  const [selectedBlock, setSelectedBlock] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [activeUnit, setActiveUnit] = useState<Apartment>(DEMO_APARTMENTS[0]);
  const [activeTab, setActiveTab] = useState<'MODEL' | 'PHOTO'>('MODEL');

  // Lọc danh sách căn hộ theo Tòa (Block) và Loại Căn
  const filteredUnits = DEMO_APARTMENTS.filter((unit) => {
    const matchBlock = selectedBlock === 'ALL' 
      ? true 
      : selectedBlock === 'BLOCK_A' 
        ? unit.block_id === 1 
        : unit.block_id === 2;
    const matchType = selectedType === 'ALL' ? true : unit.apt_type === selectedType;
    return matchBlock && matchType;
  });

  const handleSelectUnit = (unit: Apartment) => {
    setActiveUnit(unit);
  };

  return (
    <section id="floorplans" className="py-12 sm:py-20 md:py-24 bg-[#0B0E14] border-b border-[#222B35] text-white select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* ============================================================= */}
        {/* TIÊU ĐỀ ĐỀ MỤC: CĂN HỘ CHUNG CƯ                               */}
        {/* ============================================================= */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-10 gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="text-[10.5px] sm:text-[11px] uppercase tracking-[0.2em] text-[#C5A880] font-semibold flex items-center gap-2">
              <Box className="w-4 h-4 text-[#C5A880]" /> Sơ Đồ Căn Hộ Chung Cư
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif text-white font-bold tracking-tight">
              Sơ Đồ Mặt Bằng & Không Gian Căn Hộ
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              Khám phá chi tiết sơ đồ bố trí không gian căn hộ chung cư Skyline với mô hình 3D trực quan và bản vẽ mặt bằng 2D kỹ thuật.
            </p>
          </div>

          {/* Bộ Lọc Theo Tòa & Loại Căn */}
          <div className="flex flex-col gap-2.5">
            {/* Lọc Tòa (Block A / Block B) */}
            <div className="flex flex-wrap gap-1.5 sm:gap-2 items-center">
              <span className="text-[11px] uppercase text-gray-400 font-semibold font-mono mr-1">Tòa:</span>
              {[
                { id: 'ALL', label: 'Tất Cả Tòa' },
                { id: 'BLOCK_A', label: 'Tòa A' },
                { id: 'BLOCK_B', label: 'Tòa B' }
              ].map((block) => (
                <button
                  key={block.id}
                  onClick={() => setSelectedBlock(block.id)}
                  className={`px-2.5 sm:px-3 py-1.5 text-[10.5px] sm:text-[11px] uppercase tracking-wider font-semibold border transition-all rounded ${
                    selectedBlock === block.id
                      ? 'bg-[#C5A880] text-[#0D1117] border-[#C5A880] font-bold shadow'
                      : 'bg-[#121820] text-gray-300 border-[#222B35] hover:border-[#C5A880] hover:text-white'
                  }`}
                >
                  {block.label}
                </button>
              ))}
            </div>

            {/* Lọc Loại Căn */}
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[11px] uppercase text-gray-400 font-semibold font-mono mr-1">Loại:</span>
              {['ALL', '1PN', '2PN', '3PN', 'Duplex'].map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-2 sm:px-2.5 py-1 text-[10px] sm:text-[10.5px] uppercase tracking-wider font-semibold border transition-all rounded ${
                    selectedType === type
                      ? 'bg-[#1E293B] text-[#C5A880] border-[#C5A880] shadow font-bold'
                      : 'bg-[#0D1117] text-gray-400 border-[#222B35] hover:border-gray-500 hover:text-white'
                  }`}
                >
                  {type === 'ALL' ? 'Tất cả' : type}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ============================================================= */}
        {/* DANH MỤC CĂN HỘ & MÔ HÌNH XEM TRỰC QUAN                      */}
        {/* ============================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          {/* CỘT PHẢI: BỘ HIỂN THỊ SƠ ĐỒ CĂN HỘ (Ưu tiên đưa lên trước trên Mobile - order-1 lg:order-2) */}
          <div className="order-1 lg:order-2 lg:col-span-8 space-y-4">
            {/* Thanh Chọn Nhanh Căn Hộ Dạng Chip Ngang Dành Riêng Cho Mobile */}
            <div className="lg:hidden space-y-1.5">
              <div className="text-[10.5px] uppercase tracking-wider text-gray-400 font-mono flex items-center justify-between">
                <span>Chọn căn hộ nhanh:</span>
                <span className="text-[#C5A880]">{filteredUnits.length} căn phù hợp</span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin scrollbar-thumb-gray-800">
                {filteredUnits.map((unit) => {
                  const isSelected = activeUnit.id === unit.id;
                  return (
                    <button
                      key={unit.id}
                      type="button"
                      onClick={() => handleSelectUnit(unit)}
                      className={`px-3 py-1.5 rounded text-xs font-mono font-semibold whitespace-nowrap border transition-all flex items-center gap-1.5 shrink-0 ${
                        isSelected
                          ? 'bg-[#C5A880] text-[#0D1117] border-[#C5A880] font-bold shadow'
                          : 'bg-[#121820] text-gray-300 border-[#222B35] hover:border-gray-600'
                      }`}
                    >
                      <span>Căn {unit.apt_code}</span>
                      <span className={`text-[10px] px-1 rounded ${
                        isSelected ? 'bg-[#0D1117] text-[#C5A880]' : 'bg-[#1C2533] text-gray-400'
                      }`}>
                        {unit.apt_type}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Thanh Tiêu Đề & Chuyển Tab Xem */}
            <div className="p-3 sm:p-4 bg-[#121820] border border-[#222B35] flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 rounded shadow-lg">
              <div>
                <div className="text-[10px] sm:text-[10.5px] uppercase tracking-widest text-[#C5A880] font-semibold font-mono">
                  Sơ Đồ Bố Trí Căn Hộ
                </div>
                <h3 className="font-serif text-xl sm:text-2xl text-white font-bold mt-0.5">
                  Căn Hộ {activeUnit.apt_code} ({activeUnit.apt_type}) • {activeUnit.block_id === 1 ? 'Tòa A' : 'Tòa B'}
                </h3>
              </div>

              {/* 2 Tab Gọn Gàng: Sơ Đồ Căn Hộ / Ảnh Thực Tế */}
              <div className="flex bg-[#0D1117] p-1 border border-[#222B35] rounded self-start sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab('MODEL')}
                  className={`px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold uppercase tracking-wider transition-colors rounded flex items-center gap-1.5 ${
                    activeTab === 'MODEL' ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Box className="w-3.5 h-3.5 shrink-0" />
                  <span><span className="hidden xs:inline">Sơ Đồ </span>3D / 2D</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('PHOTO')}
                  className={`px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold uppercase tracking-wider transition-colors rounded flex items-center gap-1.5 ${
                    activeTab === 'PHOTO' ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5 shrink-0" />
                  <span>Ảnh Thực Tế</span>
                </button>
              </div>
            </div>

            {/* TAB 1: Sơ Đồ Căn Hộ (3D & 2D) - Chế độ thuần xem, interactive = false */}
            {activeTab === 'MODEL' && (
              <ApartmentModel3DViewer
                apartmentCode={activeUnit.apt_code}
                apartmentType={activeUnit.apt_type}
                clearArea={activeUnit.clear_area}
                interactive={false}
              />
            )}

            {/* TAB 2: Ảnh Thực Tế Căn Hộ */}
            {activeTab === 'PHOTO' && (
              <div className="relative border border-[#222B35] bg-[#121820] h-[320px] sm:h-[420px] md:h-[490px] overflow-hidden rounded-lg shadow-xl">
                <img
                  src={activeUnit.thumbnail_url}
                  alt={activeUnit.apt_code}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 bg-[#0D1117]/90 border border-[#C5A880] p-3 sm:p-4 text-xs text-white backdrop-blur-md rounded shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div>
                    <div className="font-bold text-sm sm:text-base text-[#C5A880]">
                      Không Gian Bàn Giao Thực Tế • Căn Hộ {activeUnit.apt_code} ({activeUnit.apt_type})
                    </div>
                    <div className="text-gray-300 text-[11px] sm:text-xs mt-0.5 sm:mt-1">
                      Tiêu chuẩn hoàn thiện: Thiết bị vệ sinh cao cấp, Bếp từ âm, Hệ thống điều hòa âm trần Inverter.
                    </div>
                  </div>
                  <div className="px-3 py-1.5 bg-[#161B22] border border-emerald-500/50 text-emerald-300 font-mono text-[10.5px] sm:text-[11px] rounded whitespace-nowrap text-center self-start sm:self-auto">
                    ✓ Sẵn Sàng Bàn Giao
                  </div>
                </div>
              </div>
            )}

            {/* Thông Số Kỹ Thuật Tóm Tắt Chân Trang */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 pt-1 sm:pt-2 text-center">
              <div className="p-2.5 sm:p-3 bg-[#121820] border border-[#222B35] rounded">
                <div className="text-[9.5px] sm:text-[10px] text-gray-400 uppercase tracking-wider">Phòng Ngủ</div>
                <div className="font-serif text-base sm:text-lg font-bold text-white mt-0.5">{activeUnit.bedrooms} Phòng</div>
              </div>
              <div className="p-2.5 sm:p-3 bg-[#121820] border border-[#222B35] rounded">
                <div className="text-[9.5px] sm:text-[10px] text-gray-400 uppercase tracking-wider">Phòng Tắm / WC</div>
                <div className="font-serif text-base sm:text-lg font-bold text-white mt-0.5">{activeUnit.bathrooms} Phòng</div>
              </div>
              <div className="p-2.5 sm:p-3 bg-[#121820] border border-[#222B35] rounded">
                <div className="text-[9.5px] sm:text-[10px] text-gray-400 uppercase tracking-wider">Diện Tích Thông Thủy</div>
                <div className="font-serif text-base sm:text-lg font-bold text-[#C5A880] mt-0.5">{activeUnit.clear_area} m²</div>
              </div>
              <div className="p-2.5 sm:p-3 bg-[#121820] border border-[#222B35] rounded">
                <div className="text-[9.5px] sm:text-[10px] text-gray-400 uppercase tracking-wider">Tình Trạng Pháp Lý</div>
                <div className="font-serif text-xs sm:text-sm font-bold text-emerald-400 mt-1">Sổ Hồng Lâu Dài</div>
              </div>
            </div>
          </div>

          {/* CỘT TRÁI: DANH SÁCH CĂN HỘ MẪU CHI TIẾT (order-2 lg:order-1) */}
          <div className="order-2 lg:order-1 lg:col-span-4 space-y-3 w-full">
            <div className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2 flex items-center justify-between">
              <span>Danh Sách Căn Hộ ({filteredUnits.length})</span>
              <span className="text-[10px] text-[#C5A880] font-mono">Bàn Giao Hoàn Thiện</span>
            </div>

            <div className="space-y-2.5 max-h-[500px] sm:max-h-[620px] overflow-y-auto pr-1">
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
                      className={`p-3.5 sm:p-4 border transition-all cursor-pointer rounded ${
                        isSelected
                          ? 'bg-[#161D26] border-[#C5A880] shadow-xl ring-1 ring-[#C5A880]'
                          : 'bg-[#121820] border-[#222B35] hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-serif text-base sm:text-lg font-bold text-white">
                          Căn Hộ {unit.apt_code}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold bg-[#1C2533] border border-[#2D3748] text-[#C5A880] rounded">
                          {unit.apt_type}
                        </span>
                      </div>

                      <div className="text-xs text-gray-300 mt-1 font-medium">
                        {unit.block_id === 1 ? 'Tòa A' : 'Tòa B'} • Tầng {unit.floor_number}
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-2.5 pt-2.5 border-t border-[#222B35] text-[11px] sm:text-xs text-gray-400 font-mono">
                        <div>Thông thủy: <strong className="text-white">{unit.clear_area} m²</strong></div>
                        <div>Tim tường: <strong className="text-white">{unit.wall_area} m²</strong></div>
                      </div>

                      <div className="flex items-center justify-between mt-2.5 pt-1 text-xs">
                        <span className="text-[#C5A880] font-bold font-mono text-sm sm:text-base">
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
        </div>
      </div>
    </section>
  );
}
