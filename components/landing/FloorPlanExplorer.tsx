'use client';

import React, { useState } from 'react';
import { DEMO_APARTMENTS, Apartment, SmartWidget } from '@/lib/dataStore';
import { Maximize2, BedDouble, Bath, CheckCircle2, Shield, Eye, Cpu, Zap, Droplets, Lock, LockKeyhole } from 'lucide-react';
import { useAuth } from '@/lib/authContext';

export default function FloorPlanExplorer() {
  const { isAuthenticated, currentUser, canAccess } = useAuth();
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [activeUnit, setActiveUnit] = useState<Apartment>(DEMO_APARTMENTS[0]);
  const [activeTab, setActiveTab] = useState<'PHOTO' | 'PLAN' | 'SMART'>('PLAN');
  const [smartWidgets, setSmartWidgets] = useState<SmartWidget[]>(DEMO_APARTMENTS[0].smart_widgets);
  const [guestPrompt, setGuestPrompt] = useState<string | null>(null);

  const filteredUnits = selectedType === 'ALL'
    ? DEMO_APARTMENTS
    : DEMO_APARTMENTS.filter((u) => u.apt_type === selectedType);

  const handleSelectUnit = (unit: Apartment) => {
    setActiveUnit(unit);
    setSmartWidgets(unit.smart_widgets.length > 0 ? unit.smart_widgets : [
      { id: 'w-1', name: 'Đèn phòng khách', type: 'light', status: 'on', x: 35, y: 40 },
      { id: 'w-2', name: 'Điều hòa Daikin', type: 'ac', status: 24, x: 55, y: 30 },
      { id: 'w-3', name: 'Khóa cửa FaceID', type: 'door', status: 'on', x: 15, y: 80 },
    ]);
  };

  const toggleWidget = (id: string) => {
    if (!isAuthenticated) {
      setGuestPrompt('Chế độ Xem Khách: Vui lòng đăng nhập tài khoản Cư dân hoặc Ban Quản lý để điều khiển thiết bị Smart Home thực tế.');
      setTimeout(() => setGuestPrompt(null), 4000);
      return;
    }

    setSmartWidgets(prev => prev.map(w => {
      if (w.id === id) {
        if (typeof w.status === 'string') {
          return { ...w, status: w.status === 'on' ? 'off' : 'on' };
        }
      }
      return w;
    }));
  };

  return (
    <section id="floorplans" className="py-24 bg-[#F8FAFC] border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="text-[11px] uppercase tracking-[0.25em] text-[#9E8057] font-semibold">
              Mặt Bằng & Căn Hộ Tương Tác
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif text-[#0D1117]">
              Khám Phá Chi Tiết Từng Bản Vẽ Căn Hộ
            </h2>
          </div>

          {/* Unit Type Filter Pills (Sharp Hendon style) */}
          <div className="flex flex-wrap gap-2">
            {['ALL', 'Studio', '1PN', '2PN', '3PN', 'Duplex'].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-4 py-2 text-[11px] uppercase tracking-wider font-semibold border transition-all ${
                  selectedType === type
                    ? 'bg-[#0D1117] text-white border-[#0D1117]'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-[#0D1117]'
                }`}
              >
                {type === 'ALL' ? 'Tất cả loại căn' : type}
              </button>
            ))}
          </div>
        </div>

        {/* Main Grid: Interactive Unit Selector & Viewer */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Unit Cards List */}
          <div className="lg:col-span-4 space-y-3">
            <div className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">
              Danh sách căn hộ mẫu ({filteredUnits.length})
            </div>
            {filteredUnits.map((unit) => {
              const isSelected = activeUnit.id === unit.id;
              return (
                <div
                  key={unit.id}
                  onClick={() => handleSelectUnit(unit)}
                  className={`p-4 border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white border-[#C5A880] shadow-md ring-1 ring-[#C5A880]'
                      : 'bg-white border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-lg font-bold text-[#0D1117]">
                      Căn {unit.apt_code}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold bg-gray-100 text-gray-700">
                      {unit.apt_type}
                    </span>
                  </div>

                  <div className="text-xs text-gray-500 mt-1">{unit.block_code} • Tầng {unit.floor_number}</div>

                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-600">
                    <div>Thông thủy: <strong className="text-gray-900">{unit.clear_area} m²</strong></div>
                    <div>Tim tường: <strong className="text-gray-900">{unit.wall_area} m²</strong></div>
                  </div>

                  <div className="flex items-center justify-between mt-3 text-xs">
                    <span className="text-[#9E8057] font-semibold">
                      {(unit.price_vnd / 1000000000).toFixed(2)} tỷ VNĐ
                    </span>
                    <span className={`text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 ${
                      unit.status === 'Đã bàn giao' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                    }`}>
                      {unit.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Interactive Blueprint & Smart Home Viewer */}
          <div className="lg:col-span-8 bg-white border border-gray-200 p-6 space-y-6">
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
              <div>
                <div className="text-xs uppercase tracking-widest text-[#9E8057] font-semibold">
                  Chi Tiết Mặt Bằng Kỹ Thuật
                </div>
                <h3 className="font-serif text-2xl text-[#0D1117] font-bold mt-0.5">
                  Căn Hộ {activeUnit.apt_code} ({activeUnit.apt_type})
                </h3>
              </div>

              {/* View Mode Switcher */}
              <div className="flex border border-gray-300">
                <button
                  onClick={() => setActiveTab('PLAN')}
                  className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                    activeTab === 'PLAN' ? 'bg-[#0D1117] text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Bản Vẽ 2D
                </button>
                <button
                  onClick={() => setActiveTab('SMART')}
                  className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                    activeTab === 'SMART' ? 'bg-[#C5A880] text-[#0D1117]' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Smart Home AI
                </button>
                <button
                  onClick={() => setActiveTab('PHOTO')}
                  className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                    activeTab === 'PHOTO' ? 'bg-[#0D1117] text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Ảnh Thực Tế
                </button>
              </div>
            </div>

            {/* Display Canvas */}
            <div className="relative border border-gray-200 bg-[#FAFAFA] min-h-[380px] flex items-center justify-center overflow-hidden">
              {activeTab === 'PHOTO' && (
                <img
                  src={activeUnit.thumbnail_url}
                  alt={activeUnit.apt_code}
                  className="w-full h-[400px] object-cover"
                />
              )}

              {activeTab === 'PLAN' && (
                <div className="relative w-full h-[400px] flex items-center justify-center p-4">
                  <img
                    src={activeUnit.floor_plan_url}
                    alt="Floor plan"
                    className="max-h-[360px] object-contain"
                  />
                  <div className="absolute top-4 right-4 bg-white/95 border border-gray-300 p-3 text-xs space-y-1">
                    <div className="font-semibold text-gray-900">Thông số kỹ thuật:</div>
                    <div>• Diện tích thông thủy: <strong>{activeUnit.clear_area} m²</strong></div>
                    <div>• Diện tích tim tường: <strong>{activeUnit.wall_area} m²</strong></div>
                    <div>• Pháp lý: <strong>{activeUnit.legal_status === 'Pink_Book' ? 'Sổ hồng lâu dài' : 'HĐMB (SPA)'}</strong></div>
                  </div>
                </div>
              )}

              {activeTab === 'SMART' && (
                <div className="relative w-full h-[400px] bg-[#0E1318] p-6 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-white border-b border-[#222B35] pb-3">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#C5A880] font-semibold">
                      <Cpu className="w-4 h-4" />
                      Mô Phỏng Điều Khiển Smart Home Căn {activeUnit.apt_code}
                    </div>
                    <div className="text-[11px] text-gray-400 font-mono">Bảng CSDL: apartments.smart_widgets</div>
                  </div>

                  {/* Interactive Floor with Hotspot Pins */}
                  <div className="relative w-full h-[260px] border border-[#222B35] bg-[#161B22]">
                    <img
                      src={activeUnit.floor_plan_url}
                      alt="Smart plan"
                      className="w-full h-full object-contain opacity-30"
                    />

                    {smartWidgets.map((widget) => {
                      const isOn = widget.status === 'on' || typeof widget.status === 'number';
                      return (
                        <button
                          key={widget.id}
                          onClick={() => toggleWidget(widget.id)}
                          style={{ left: `${widget.x}%`, top: `${widget.y}%` }}
                          className={`absolute -translate-x-1/2 -translate-y-1/2 p-2 border transition-all text-xs font-mono flex items-center gap-1.5 shadow-lg ${
                            isOn
                              ? 'bg-[#C5A880] border-[#C5A880] text-[#0D1117] font-bold'
                              : 'bg-[#222B35] border-gray-600 text-gray-300'
                          }`}
                        >
                          {widget.type === 'light' && <Zap className="w-3.5 h-3.5" />}
                          {widget.type === 'ac' && <Cpu className="w-3.5 h-3.5" />}
                          {widget.type === 'door' && <Lock className="w-3.5 h-3.5" />}
                          {widget.type === 'sensor' && <Droplets className="w-3.5 h-3.5" />}
                          <span>{widget.name}: {typeof widget.status === 'number' ? `${widget.status}°C` : widget.status.toUpperCase()}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Guest Lock Notice */}
                  {guestPrompt && (
                    <div className="p-2.5 bg-amber-950/90 border border-amber-500 text-amber-300 text-xs flex items-center justify-between animate-pulse">
                      <span className="flex items-center gap-1.5">
                        <LockKeyhole className="w-3.5 h-3.5" />
                        {guestPrompt}
                      </span>
                    </div>
                  )}

                  <div className="text-[11px] text-gray-400 italic">
                    {!isAuthenticated 
                      ? '🔒 Chế độ Xem (Chưa Đăng Nhập): Bạn chỉ có thể xem sơ đồ. Hãy đăng nhập để điều khiển Smart Home thực tế.' 
                      : '* Đã đăng nhập: Nhấp vào từng nút trên mặt bằng để bật/tắt thiết bị hoặc xem cảm biến IoT thời gian thực.'}
                  </div>
                </div>
              )}
            </div>

            {/* Specifications Summary Footer */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-gray-200 text-center">
              <div className="p-3 bg-gray-50 border border-gray-200">
                <div className="text-xs text-gray-500 uppercase tracking-wider">Phòng Ngủ</div>
                <div className="font-serif text-lg font-bold text-gray-900 mt-0.5">{activeUnit.bedrooms} Phòng</div>
              </div>
              <div className="p-3 bg-gray-50 border border-gray-200">
                <div className="text-xs text-gray-500 uppercase tracking-wider">Phòng Tắm</div>
                <div className="font-serif text-lg font-bold text-gray-900 mt-0.5">{activeUnit.bathrooms} Phòng</div>
              </div>
              <div className="p-3 bg-gray-50 border border-gray-200">
                <div className="text-xs text-gray-500 uppercase tracking-wider">Thông Thủy</div>
                <div className="font-serif text-lg font-bold text-gray-900 mt-0.5">{activeUnit.clear_area} m²</div>
              </div>
              <div className="p-3 bg-gray-50 border border-gray-200">
                <div className="text-xs text-gray-500 uppercase tracking-wider">Tim Tường</div>
                <div className="font-serif text-lg font-bold text-gray-900 mt-0.5">{activeUnit.wall_area} m²</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
