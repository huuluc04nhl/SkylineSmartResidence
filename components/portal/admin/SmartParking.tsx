'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Car, 
  Bike, 
  Search, 
  Plus, 
  Trash2, 
  LayoutGrid, 
  CreditCard,
  Building,
  UserCheck,
  CheckCircle2,
  X,
  Layers,
  ArrowRight,
  ShieldCheck,
  Hash,
  Sparkles
} from 'lucide-react';
import { 
  getApartmentUnits, 
  addApartmentVehicle, 
  removeApartmentVehicle, 
  ApartmentVehicle,
  ApartmentUnit 
} from '@/lib/apartmentStore';
import { useLanguage } from '@/lib/languageContext';

interface RegisteredVehicleWithUnit extends ApartmentVehicle {
  aptCode: string;
  ownerName: string;
  floor: number;
}

export default function SmartParking() {
  const { isEn } = useLanguage();

  // Apartment Data & Registered Vehicles
  const [apartments, setApartments] = useState<ApartmentUnit[]>([]);
  const [searchPlate, setSearchPlate] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'CAR' | 'MOTORBIKE'>('ALL');
  const [selectedFloorMap, setSelectedFloorMap] = useState<'B2_CAR' | 'B1_MOTO'>('B2_CAR');

  // Selected Slot for detail panel
  const [selectedSlotCode, setSelectedSlotCode] = useState<string | null>(null);

  // Modal State for New Vehicle Registration
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [regAptCode, setRegAptCode] = useState('');
  const [regType, setRegType] = useState<'CAR' | 'MOTORBIKE'>('CAR');
  const [regPlate, setRegPlate] = useState('');
  const [regBrand, setRegBrand] = useState('');
  const [regCustomSlot, setRegCustomSlot] = useState('');
  const [regFormError, setRegFormError] = useState('');
  const [regSuccessMsg, setRegSuccessMsg] = useState('');

  // Initial load
  useEffect(() => {
    try {
      const data = getApartmentUnits();
      setApartments(data);
      if (data.length > 0) {
        setRegAptCode(data[0].code);
      }
    } catch {
      setApartments([]);
    }
  }, []);

  const registeredVehicles: RegisteredVehicleWithUnit[] = useMemo(() => {
    const list: RegisteredVehicleWithUnit[] = [];
    apartments.forEach(apt => {
      if (apt.vehicles && apt.vehicles.length > 0) {
        apt.vehicles.forEach(v => {
          list.push({
            ...v,
            aptCode: apt.code,
            ownerName: apt.owner?.name || (isEn ? 'Resident' : 'Cư dân căn hộ'),
            floor: apt.floor,
          });
        });
      }
    });
    return list;
  }, [apartments, isEn]);

  // Operational Specs for Basement B1 & B2
  const MAX_CAR_SLOTS = 120; // Hầm B2
  const MAX_MOTO_SLOTS = 350; // Hầm B1
  const CAR_MONTHLY_FEE = 1200000;
  const MOTO_MONTHLY_FEE = 120000;

  const registeredCars = registeredVehicles.filter(v => v.type === 'CAR').length;
  const registeredMotos = registeredVehicles.filter(v => v.type === 'MOTORBIKE').length;

  const carOccupancyPct = Math.min(100, Math.round((registeredCars / MAX_CAR_SLOTS) * 100));
  const motoOccupancyPct = Math.min(100, Math.round((registeredMotos / MAX_MOTO_SLOTS) * 100));

  const totalMonthlyRevenue = (registeredCars * CAR_MONTHLY_FEE) + (registeredMotos * MOTO_MONTHLY_FEE);

  // Generate Matrix of Slots for Visual Inspection
  // Basement B2: Zone A (VIP: B2-A01 to B2-A16) & Zone B (Standard: B2-B01 to B2-B16)
  const b2Slots = useMemo(() => {
    const slots = [];
    // Zone A
    for (let i = 1; i <= 16; i++) {
      const code = `B2-A${String(i).padStart(2, '0')}`;
      const assigned = registeredVehicles.find(v => v.type === 'CAR' && v.slot === code);
      slots.push({ code, zone: 'Zone A (VIP)', type: 'CAR' as const, assigned });
    }
    // Zone B
    for (let i = 1; i <= 16; i++) {
      const code = `B2-B${String(i).padStart(2, '0')}`;
      const assigned = registeredVehicles.find(v => v.type === 'CAR' && v.slot === code);
      slots.push({ code, zone: 'Zone B (Tiêu chuẩn)', type: 'CAR' as const, assigned });
    }
    return slots;
  }, [registeredVehicles]);

  // Basement B1: Zone M1 (B1-M01 to B1-M18) & Zone M2 (B1-M19 to B1-M36)
  const b1Slots = useMemo(() => {
    const slots = [];
    for (let i = 1; i <= 32; i++) {
      const code = `B1-M${String(i).padStart(2, '0')}`;
      const assigned = registeredVehicles.find(v => v.type === 'MOTORBIKE' && v.slot === code);
      slots.push({ 
        code, 
        zone: i <= 16 ? 'Zone M1 (Khu Vực 1)' : 'Zone M2 (Khu Vực 2)', 
        type: 'MOTORBIKE' as const, 
        assigned 
      });
    }
    return slots;
  }, [registeredVehicles]);

  // Selected slot detail
  const currentSlotDetail = useMemo(() => {
    if (!selectedSlotCode) return null;
    const allSlots = [...b2Slots, ...b1Slots];
    return allSlots.find(s => s.code === selectedSlotCode) || null;
  }, [selectedSlotCode, b2Slots, b1Slots]);

  // Handler: Register New Vehicle
  const handleRegisterVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    setRegFormError('');
    setRegSuccessMsg('');

    if (!regAptCode) {
      setRegFormError(isEn ? 'Please select an apartment' : 'Vui lòng chọn căn hộ');
      return;
    }
    if (!regPlate.trim()) {
      setRegFormError(isEn ? 'Please enter license plate' : 'Vui lòng nhập biển số xe');
      return;
    }

    const cleanNew = regPlate.trim().toUpperCase().replace(/[-.\s]/g, '');
    const exists = registeredVehicles.some(
      v => v.plate.toUpperCase().replace(/[-.\s]/g, '') === cleanNew
    );
    if (exists) {
      setRegFormError(isEn ? 'This plate number is already registered' : 'Biển số này đã được đăng ký trong hệ thống');
      return;
    }

    // Determine slot
    let slotCode = regCustomSlot.trim();
    if (!slotCode) {
      const prefixSlot = regType === 'CAR' ? 'B2-A' : 'B1-M';
      const randomSlotNum = Math.floor(Math.random() * 16) + 1;
      slotCode = `${prefixSlot}${String(randomSlotNum).padStart(2, '0')}`;
    }

    const generatedCardNo = `RFID-${regAptCode}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newVehicle: ApartmentVehicle = {
      id: `veh-${Date.now()}`,
      type: regType,
      plate: regPlate.trim().toUpperCase(),
      brand: regBrand.trim() || (regType === 'CAR' ? 'Sedan / SUV' : 'Xe máy'),
      cardNo: generatedCardNo,
      slot: slotCode,
    };

    const ok = addApartmentVehicle(regAptCode, newVehicle);
    if (ok) {
      const refreshed = getApartmentUnits();
      setApartments(refreshed);
      setRegSuccessMsg(
        isEn
          ? `Vehicle ${newVehicle.plate} successfully registered to Unit ${regAptCode} (Slot ${slotCode})`
          : `Đã cấp thẻ thành công xe ${newVehicle.plate} cho Căn ${regAptCode} (Ô ${slotCode})`
      );
      setRegPlate('');
      setRegBrand('');
      setRegCustomSlot('');
      setTimeout(() => {
        setIsRegisterModalOpen(false);
        setRegSuccessMsg('');
      }, 1400);
    } else {
      setRegFormError(isEn ? 'Failed to save vehicle. Check apartment code.' : 'Lỗi khi lưu phương tiện. Kiểm tra lại mã căn.');
    }
  };

  // Handler: Revoke Vehicle
  const handleRevokeVehicle = (aptCode: string, vehicleId: string, plate: string) => {
    const confirmText = isEn
      ? `Are you sure you want to revoke vehicle ${plate} of apartment ${aptCode}?`
      : `Bạn có chắc chắn muốn thu hồi và xóa thẻ xe ${plate} của căn hộ ${aptCode}?`;
    if (!window.confirm(confirmText)) return;

    const ok = removeApartmentVehicle(aptCode, vehicleId);
    if (ok) {
      const refreshed = getApartmentUnits();
      setApartments(refreshed);
      if (selectedSlotCode && currentSlotDetail?.assigned?.id === vehicleId) {
        setSelectedSlotCode(null);
      }
    }
  };

  // Filtered vehicles
  const filteredVehicles = registeredVehicles.filter(v => {
    if (typeFilter !== 'ALL' && v.type !== typeFilter) return false;
    if (searchPlate.trim()) {
      const q = searchPlate.toLowerCase();
      return (
        v.plate.toLowerCase().includes(q) ||
        v.aptCode.toLowerCase().includes(q) ||
        v.ownerName.toLowerCase().includes(q) ||
        (v.brand && v.brand.toLowerCase().includes(q)) ||
        (v.cardNo && v.cardNo.toLowerCase().includes(q)) ||
        (v.slot && v.slot.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222B35] pb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-semibold flex items-center gap-2">
            <Building className="w-3.5 h-3.5 text-[#C5A880]" />
            {isEn ? 'PARKING & INFRASTRUCTURE MANAGEMENT • BASEMENT B1 & B2' : 'HỆ THỐNG QUẢN LÝ BÃI ĐỖ XE & ĐỊNH DANH Ô ĐỖ • TÒA NHÀ THE TROPICAL'}
          </div>
          <h2 className="font-serif text-xl sm:text-2xl text-white font-bold mt-1">
            {isEn ? 'Parking Facility & Resident Vehicle Oversight' : 'Quản Lý Bãi Đỗ Xe & Cấp Phát Thẻ Cư Dân'}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setRegCustomSlot('');
              setIsRegisterModalOpen(true);
            }}
            className="px-4 py-2 bg-[#C5A880] hover:bg-[#E2C9A5] text-[#0A0E14] text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors rounded-none"
          >
            <Plus className="w-3.5 h-3.5" />
            {isEn ? 'Register New Vehicle' : 'Cấp Thẻ & Đăng Ký Xe Mới'}
          </button>
        </div>
      </div>

      {/* 2. Top Telemetry KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Car Slots (Basement B2) */}
        <div className="p-4 bg-[#121820] border border-[#222B35] space-y-2.5">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="uppercase tracking-wider font-semibold flex items-center gap-1.5 text-gray-300">
              <Car className="w-4 h-4 text-[#C5A880]" />
              {isEn ? 'Car Slots (B2)' : 'Ô Đỗ Ô Tô (Hầm B2)'}
            </span>
            <span className="font-mono text-emerald-400 font-bold">{carOccupancyPct}%</span>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="font-mono text-xl font-bold text-white">
              {registeredCars} <span className="text-xs text-gray-500 font-normal">/ {MAX_CAR_SLOTS} ô</span>
            </div>
            <span className="text-[11px] font-mono text-gray-400">
              {isEn ? 'Free:' : 'Còn trống:'} <strong className="text-white">{MAX_CAR_SLOTS - registeredCars}</strong>
            </span>
          </div>
          <div className="w-full h-1.5 bg-[#0A0E14] border border-[#222B35] overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                carOccupancyPct >= 90 ? 'bg-rose-500' : carOccupancyPct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.max(registeredCars > 0 ? 5 : 0, carOccupancyPct)}%` }}
            />
          </div>
          <div className="text-[10px] text-gray-500 font-mono">
            {isEn ? 'Fee: 1,200,000 VND / slot / month' : 'Định mức: 1.200.000 đ/tháng/ô'}
          </div>
        </div>

        {/* KPI 2: Motorbike Slots (Basement B1) */}
        <div className="p-4 bg-[#121820] border border-[#222B35] space-y-2.5">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="uppercase tracking-wider font-semibold flex items-center gap-1.5 text-gray-300">
              <Bike className="w-4 h-4 text-cyan-400" />
              {isEn ? 'Bikes (B1)' : 'Xe Máy (Hầm B1)'}
            </span>
            <span className="font-mono text-cyan-400 font-bold">{motoOccupancyPct}%</span>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="font-mono text-xl font-bold text-white">
              {registeredMotos} <span className="text-xs text-gray-500 font-normal">/ {MAX_MOTO_SLOTS} xe</span>
            </div>
            <span className="text-[11px] font-mono text-gray-400">
              {isEn ? 'Free:' : 'Còn nhận:'} <strong className="text-white">{MAX_MOTO_SLOTS - registeredMotos}</strong>
            </span>
          </div>
          <div className="w-full h-1.5 bg-[#0A0E14] border border-[#222B35] overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                motoOccupancyPct >= 90 ? 'bg-rose-500' : 'bg-cyan-500'
              }`}
              style={{ width: `${Math.max(registeredMotos > 0 ? 4 : 0, motoOccupancyPct)}%` }}
            />
          </div>
          <div className="text-[10px] text-gray-500 font-mono">
            {isEn ? 'Fee: 120,000 VND / bike / month' : 'Định mức: 120.000 đ/tháng/xe'}
          </div>
        </div>

        {/* KPI 3: Monthly Projected Revenue */}
        <div className="p-4 bg-[#121820] border border-[#222B35] space-y-2.5">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="uppercase tracking-wider font-semibold flex items-center gap-1.5 text-gray-300">
              <CreditCard className="w-4 h-4 text-[#C5A880]" />
              {isEn ? 'Projected Revenue' : 'Dự Thu Phí Gửi Xe'}
            </span>
            <span className="text-[10px] font-mono text-[#C5A880]">THÁNG NÀY</span>
          </div>
          <div className="font-mono text-xl font-bold text-[#C5A880]">
            {totalMonthlyRevenue.toLocaleString('vi-VN')} <span className="text-xs text-gray-400 font-normal">VNĐ</span>
          </div>
          <div className="text-[11px] text-gray-400 font-mono flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            {isEn ? 'Billed via apartment ledger' : 'Ghi nợ tự động vào hóa đơn căn'}
          </div>
          <div className="text-[10px] text-gray-500 font-mono">
            {isEn ? 'Auto-synchronized with VNPay' : 'Đồng bộ hóa đơn VNPay hàng tháng'}
          </div>
        </div>

        {/* KPI 4: Active RFID Passes */}
        <div className="p-4 bg-[#121820] border border-[#222B35] space-y-2.5">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="uppercase tracking-wider font-semibold flex items-center gap-1.5 text-gray-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              {isEn ? 'Active RFID Passes' : 'Thẻ RFID Đã Kích Hoạt'}
            </span>
            <span className="text-[10px] font-mono text-emerald-400">ACTIVE</span>
          </div>
          <div className="font-mono text-xl font-bold text-white">
            {registeredCars + registeredMotos} <span className="text-xs text-gray-500 font-normal">thẻ xe</span>
          </div>
          <div className="text-[11px] text-gray-400 font-mono flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            {isEn ? '100% Verified Resident Quota' : '100% Căn hộ cư dân hợp lệ'}
          </div>
          <div className="text-[10px] text-gray-500 font-mono">
            {isEn ? 'Max 1 car & 2 bikes / unit' : 'Chuẩn: Tối đa 1 ô tô & 2 xe máy / căn'}
          </div>
        </div>
      </div>

      {/* 3. Interactive Parking Matrix & Slot Map */}
      <div className="bg-[#121820] border border-[#222B35] p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222B35] pb-3">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[#C5A880] font-semibold flex items-center gap-1.5">
              <LayoutGrid className="w-3.5 h-3.5" />
              {isEn ? 'INTERACTIVE SLOT ALLOCATION MATRIX' : 'SƠ ĐỒ PHÂN BỔ Ô ĐỖ TRỰC QUAN'}
            </div>
            <h3 className="font-serif text-base sm:text-lg font-bold text-white mt-0.5">
              {isEn ? 'Basement Floor Map & Spatial Coordinates' : 'Bản Đồ Không Gian Tầng Hầm B1 & B2'}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedFloorMap('B2_CAR')}
              className={`px-3 py-1.5 text-xs font-mono font-semibold uppercase tracking-wider transition-colors rounded-none flex items-center gap-1.5 ${
                selectedFloorMap === 'B2_CAR'
                  ? 'bg-[#C5A880] text-black font-bold'
                  : 'bg-[#161B22] text-gray-400 hover:text-white border border-[#2D3748]'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              {isEn ? 'Basement B2: Cars' : 'Hầm B2: Ô Tô (VIP & Std)'}
            </button>
            <button
              type="button"
              onClick={() => setSelectedFloorMap('B1_MOTO')}
              className={`px-3 py-1.5 text-xs font-mono font-semibold uppercase tracking-wider transition-colors rounded-none flex items-center gap-1.5 ${
                selectedFloorMap === 'B1_MOTO'
                  ? 'bg-[#C5A880] text-black font-bold'
                  : 'bg-[#161B22] text-gray-400 hover:text-white border border-[#2D3748]'
              }`}
            >
              <Bike className="w-3.5 h-3.5" />
              {isEn ? 'Basement B1: Bikes' : 'Hầm B1: Xe Máy (M1/M2)'}
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-mono text-gray-400 flex-wrap pt-1">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-[#1C2533] border border-[#C5A880]"></span>
            <span className="text-white">{isEn ? 'Occupied (Allocated)' : 'Đã cấp cố định'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-[#161B22] border border-[#2D3748]"></span>
            <span>{isEn ? 'Available (Empty)' : 'Còn trống / Khả dụng'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-[#C5A880] border border-white"></span>
            <span className="text-[#C5A880] font-semibold">{isEn ? 'Selected Slot' : 'Ô đang chọn'}</span>
          </div>
          <div className="text-[11px] text-gray-500 ml-auto hidden md:block">
            {isEn ? 'Click any slot to inspect or assign vehicle' : 'Nhấp vào bất kỳ ô nào để xem chi tiết hoặc gán xe'}
          </div>
        </div>

        {/* Slot Grid Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2">
          {/* Grid Layout (8 cols on lg) */}
          <div className="lg:col-span-8 bg-[#0E131B] border border-[#222B35] p-4">
            <div className="text-[11px] font-mono text-gray-400 mb-3 flex justify-between items-center border-b border-[#222B35] pb-2">
              <span className="text-gray-300 font-semibold uppercase">
                {selectedFloorMap === 'B2_CAR' ? 'SƠ ĐỒ HẦM B2 (32 Ô ĐỖ ĐẠI DIỆN)' : 'SƠ ĐỒ HẦM B1 (32 Ô ĐỖ ĐẠI DIỆN)'}
              </span>
              <span className="text-[#C5A880]">
                {selectedFloorMap === 'B2_CAR' 
                  ? `${registeredCars} / 32 ô đang có xe` 
                  : `${registeredMotos} / 32 ô đang có xe`}
              </span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
              {(selectedFloorMap === 'B2_CAR' ? b2Slots : b1Slots).map((slot) => {
                const isSelected = selectedSlotCode === slot.code;
                const isOccupied = !!slot.assigned;

                return (
                  <button
                    key={slot.code}
                    type="button"
                    onClick={() => setSelectedSlotCode(slot.code)}
                    className={`p-2 border text-center transition-all flex flex-col justify-between h-20 rounded-none relative group ${
                      isSelected
                        ? 'bg-[#C5A880]/20 border-[#C5A880] shadow-[0_0_12px_rgba(197,168,128,0.25)]'
                        : isOccupied
                        ? 'bg-[#1C2533] border-[#C5A880]/60 hover:border-[#C5A880]'
                        : 'bg-[#121820] border-[#2D3748] hover:border-gray-500 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full text-[10px] font-mono">
                      <span className={`font-bold ${isSelected ? 'text-[#C5A880]' : isOccupied ? 'text-white' : 'text-gray-400'}`}>
                        {slot.code}
                      </span>
                      {isOccupied && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      )}
                    </div>

                    <div className="my-auto">
                      {isOccupied ? (
                        <div>
                          <div className="text-[10px] font-mono font-bold text-[#C5A880] truncate">
                            {slot.assigned?.plate}
                          </div>
                          <div className="text-[9px] text-gray-400 font-mono truncate">
                            Căn {slot.assigned?.aptCode}
                          </div>
                        </div>
                      ) : (
                        <div className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">
                          TRỐNG
                        </div>
                      )}
                    </div>

                    <div className="text-[9px] text-gray-500 font-mono truncate">
                      {slot.code.includes('A') ? 'VIP' : slot.code.includes('B') ? 'STD' : 'MOTO'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Slot Detail Inspector Panel (4 cols on lg) */}
          <div className="lg:col-span-4 bg-[#0E131B] border border-[#222B35] p-4 flex flex-col justify-between">
            {currentSlotDetail ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#222B35] pb-2">
                  <div className="text-xs uppercase tracking-wider font-semibold text-[#C5A880] flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5" />
                    {isEn ? 'Slot Inspector' : 'Chi Tiết Ô Đỗ Đang Chọn'}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedSlotCode(null)}
                    className="text-gray-400 hover:text-white text-xs p-1"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-3 bg-[#121820] border border-[#222B35] space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400">Mã Vị Trí:</span>
                    <span className="font-mono font-bold text-white text-sm bg-[#161B22] px-2 py-0.5 border border-gray-700">
                      {currentSlotDetail.code}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400">Khu Vực Phân Bổ:</span>
                    <span className="font-mono text-gray-300 text-xs">
                      {currentSlotDetail.zone}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400">Trạng Thái:</span>
                    <span className={`font-mono text-xs font-semibold px-2 py-0.5 border ${
                      currentSlotDetail.assigned
                        ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/50'
                        : 'bg-gray-900 text-gray-400 border-gray-700'
                    }`}>
                      {currentSlotDetail.assigned ? 'ĐÃ ĐƯỢC CẤP' : 'CÒN TRỐNG'}
                    </span>
                  </div>
                </div>

                {currentSlotDetail.assigned ? (
                  <div className="p-3.5 bg-[#161B22] border border-[#222B35] space-y-2.5 text-xs">
                    <div className="text-[11px] font-semibold text-gray-300 uppercase tracking-wider border-b border-[#222B35] pb-1.5">
                      Thông Tin Phương Tiện Cư Dân
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Biển số:</span>
                      <span className="font-mono font-bold text-[#C5A880] text-sm">
                        {currentSlotDetail.assigned.plate}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Chủ sở hữu:</span>
                      <span className="text-white font-semibold">
                        {currentSlotDetail.assigned.ownerName}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Căn hộ:</span>
                      <span className="text-gray-200 font-mono">
                        Căn {currentSlotDetail.assigned.aptCode} (Tầng {currentSlotDetail.assigned.floor})
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Dòng xe:</span>
                      <span className="text-gray-300 font-mono">
                        {currentSlotDetail.assigned.brand || '---'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Mã thẻ RFID:</span>
                      <span className="text-gray-300 font-mono">
                        {currentSlotDetail.assigned.cardNo}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Mức cước:</span>
                      <span className="text-emerald-400 font-mono font-semibold">
                        {currentSlotDetail.type === 'CAR' ? '1.200.000 đ/tháng' : '120.000 đ/tháng'}
                      </span>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => handleRevokeVehicle(
                          currentSlotDetail.assigned!.aptCode, 
                          currentSlotDetail.assigned!.id, 
                          currentSlotDetail.assigned!.plate
                        )}
                        className="w-full py-1.5 px-3 bg-rose-950/40 hover:bg-rose-900 border border-rose-500/50 text-rose-300 text-xs font-mono font-semibold transition-colors rounded-none flex items-center justify-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {isEn ? 'Revoke Slot Allocation' : 'Thu Hồi / Giải Phóng Ô Này'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-[#121820] border border-[#222B35] text-center space-y-3">
                    <div className="text-xs text-gray-400">
                      Ô đỗ này hiện đang trống và sẵn sàng tiếp nhận phương tiện mới của cư dân.
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setRegCustomSlot(currentSlotDetail.code);
                        setRegType(currentSlotDetail.type);
                        setIsRegisterModalOpen(true);
                      }}
                      className="w-full py-2 bg-[#C5A880] hover:bg-[#E2C9A5] text-black text-xs font-semibold uppercase tracking-wider transition-colors rounded-none flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {isEn ? `Assign Unit to ${currentSlotDetail.code}` : `Cấp Xe Vào Ô ${currentSlotDetail.code}`}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-2 text-gray-500">
                <LayoutGrid className="w-8 h-8 text-gray-600" />
                <div className="text-xs font-mono">
                  {isEn ? 'Select a slot on the left matrix to inspect details.' : 'Nhấp vào một ô trên ma trận bên trái để xem chi tiết.'}
                </div>
              </div>
            )}

            <div className="text-[10px] text-gray-500 font-mono text-center pt-3 border-t border-[#222B35] mt-4">
              {isEn ? 'Real-time allocation linked directly to unit master store' : 'Dữ liệu phân bổ liên kết trực tiếp với CSDL căn hộ'}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Resident Vehicles Registry Table */}
      <div className="bg-[#121820] border border-[#222B35] p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222B35] pb-3">
          <div>
            <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
              <Car className="w-4 h-4 text-[#C5A880]" />
              {isEn ? `Resident Vehicle Registry (${filteredVehicles.length})` : `Danh Sách Phương Tiện Đã Cấp Thẻ (${filteredVehicles.length} xe)`}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {isEn 
                ? 'Official resident vehicles approved for basement parking access' 
                : 'Toàn bộ phương tiện chính thức được cấp quyền sử dụng hầm B1 và B2'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={isEn ? 'Search plate, unit, owner...' : 'Tìm biển số, căn hộ, chủ xe...'}
                value={searchPlate}
                onChange={(e) => setSearchPlate(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-[#161B22] border border-[#2D3748] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#C5A880] w-48 sm:w-60 rounded-none"
              />
            </div>

            <div className="flex items-center border border-[#2D3748] bg-[#161B22] p-0.5 text-xs font-mono">
              <button
                type="button"
                onClick={() => setTypeFilter('ALL')}
                className={`px-2.5 py-1 ${typeFilter === 'ALL' ? 'bg-[#C5A880] text-black font-bold' : 'text-gray-400 hover:text-white'}`}
              >
                {isEn ? 'All' : 'Tất cả'}
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('CAR')}
                className={`px-2.5 py-1 ${typeFilter === 'CAR' ? 'bg-[#C5A880] text-black font-bold' : 'text-gray-400 hover:text-white'}`}
              >
                {isEn ? 'Cars' : 'Ô tô'}
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('MOTORBIKE')}
                className={`px-2.5 py-1 ${typeFilter === 'MOTORBIKE' ? 'bg-[#C5A880] text-black font-bold' : 'text-gray-400 hover:text-white'}`}
              >
                {isEn ? 'Bikes' : 'Xe máy'}
              </button>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-[#222B35]">
            <thead className="bg-[#161B22] text-gray-400 font-semibold uppercase tracking-wider text-[10px] border-b border-[#222B35]">
              <tr>
                <th className="p-3">{isEn ? 'Plate Number' : 'Biển Số Xe'}</th>
                <th className="p-3">{isEn ? 'Classification' : 'Phân Loại'}</th>
                <th className="p-3">{isEn ? 'Brand / Model' : 'Hãng Xe / Model'}</th>
                <th className="p-3">{isEn ? 'Unit' : 'Căn Hộ'}</th>
                <th className="p-3">{isEn ? 'Owner' : 'Chủ Sở Hữu'}</th>
                <th className="p-3">{isEn ? 'RFID Pass ID' : 'Mã Thẻ RFID'}</th>
                <th className="p-3">{isEn ? 'Allocated Slot' : 'Vị Trí Ô Đỗ'}</th>
                <th className="p-3">{isEn ? 'Monthly Fee' : 'Phí Tháng'}</th>
                <th className="p-3 text-right">{isEn ? 'Action' : 'Thao Tác'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C2533]">
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-gray-500 font-mono space-y-2">
                    <Car className="w-8 h-8 text-gray-600 mx-auto" />
                    <div>
                      {searchPlate.trim() 
                        ? (isEn ? 'No vehicles match your search query.' : 'Không tìm thấy phương tiện nào phù hợp với từ khóa tìm kiếm.')
                        : (isEn ? 'No vehicles registered in the building yet. Click "+ Register New Vehicle" to add.' : 'Chưa có phương tiện nào được cấp quyền trong tòa nhà. Hãy nhấn "+ Cấp Thẻ & Đăng Ký Xe Mới" để đăng ký.')}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((veh) => (
                  <tr key={veh.id} className="hover:bg-[#161F2E]/60 transition-colors">
                    <td className="p-3 font-mono font-bold text-[#C5A880]">
                      {veh.plate}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 text-[10px] font-semibold uppercase font-mono ${
                        veh.type === 'CAR'
                          ? 'bg-amber-950/60 text-amber-300 border border-amber-500/40'
                          : 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/40'
                      }`}>
                        {veh.type === 'CAR' ? (isEn ? 'CAR (B2)' : 'Ô Tô (B2)') : (isEn ? 'MOTO (B1)' : 'Xe Máy (B1)')}
                      </span>
                    </td>
                    <td className="p-3 text-gray-300">
                      {veh.brand || '---'}
                    </td>
                    <td className="p-3 font-mono font-semibold text-white">
                      {isEn ? `Unit ${veh.aptCode} (Fl ${veh.floor})` : `Căn ${veh.aptCode} (Tầng ${veh.floor})`}
                    </td>
                    <td className="p-3 text-gray-300">
                      {veh.ownerName}
                    </td>
                    <td className="p-3 font-mono text-gray-400">
                      {veh.cardNo || `RFID-${veh.aptCode}`}
                    </td>
                    <td className="p-3 font-mono text-[#C5A880] font-bold">
                      {veh.slot || (veh.type === 'CAR' ? 'B2-A01' : 'B1-M01')}
                    </td>
                    <td className="p-3 font-mono text-emerald-400 font-semibold">
                      {veh.type === 'CAR' ? '1.200.000 đ' : '120.000 đ'}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            if (veh.slot) {
                              setSelectedFloorMap(veh.type === 'CAR' ? 'B2_CAR' : 'B1_MOTO');
                              setSelectedSlotCode(veh.slot);
                            }
                          }}
                          className="px-2.5 py-1 bg-[#1C2533] hover:bg-[#C5A880] hover:text-black text-gray-300 border border-gray-700 text-[11px] font-semibold transition-all rounded-none"
                          title={isEn ? 'View Slot' : 'Xem Ô Đỗ'}
                        >
                          {isEn ? 'Locate' : 'Vị Trí'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRevokeVehicle(veh.aptCode, veh.id, veh.plate)}
                          className="p-1 text-gray-400 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-500/50 transition-colors rounded-none"
                          title={isEn ? 'Revoke Vehicle' : 'Thu Hồi / Xóa Thẻ Xe'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Modal: Cấp Thẻ & Đăng Ký Phương Tiện Mới */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-[#0E131B] border border-[#C5A880]/40 p-6 space-y-5 text-gray-200 rounded-none shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#222B35] pb-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-[#C5A880] font-semibold">
                  {isEn ? 'SMART PARKING REGISTRATION' : 'QUY TRÌNH CẤP THẺ BÃI ĐỖ XE'}
                </div>
                <h3 className="font-serif text-lg font-bold text-white mt-0.5">
                  {isEn ? 'Register Resident Vehicle & Issue RFID' : 'Đăng Ký Phương Tiện & Cấp Thẻ RFID'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRegisterModalOpen(false)}
                className="text-gray-400 hover:text-white transition-colors p-1"
              >
                ✕
              </button>
            </div>

            {regFormError && (
              <div className="p-3 bg-rose-950/40 border border-rose-500/50 text-rose-300 text-xs font-mono">
                ⚠️ {regFormError}
              </div>
            )}

            {regSuccessMsg && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 text-xs font-mono">
                ✓ {regSuccessMsg}
              </div>
            )}

            <form onSubmit={handleRegisterVehicle} className="space-y-4 text-xs">
              {/* Select Apartment */}
              <div>
                <label className="block text-gray-400 uppercase tracking-wider font-semibold mb-1.5">
                  {isEn ? 'Select Apartment Unit *' : 'Chọn Căn Hộ Cư Dân *'}
                </label>
                <select
                  value={regAptCode}
                  onChange={(e) => setRegAptCode(e.target.value)}
                  className="w-full px-3 py-2 bg-[#161B22] border border-[#2D3748] text-white focus:outline-none focus:border-[#C5A880] rounded-none font-mono"
                  required
                >
                  {apartments.map((apt) => (
                    <option key={apt.code} value={apt.code}>
                      Căn {apt.code} - Tầng {apt.floor} ({apt.owner?.name || (isEn ? 'Vacant' : 'Chưa có tên')})
                    </option>
                  ))}
                </select>
              </div>

              {/* Vehicle Type */}
              <div>
                <label className="block text-gray-400 uppercase tracking-wider font-semibold mb-1.5">
                  {isEn ? 'Vehicle Classification *' : 'Phân Loại Phương Tiện *'}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setRegType('CAR');
                      if (regCustomSlot.startsWith('B1')) setRegCustomSlot('');
                    }}
                    className={`py-2 px-3 border text-left flex items-center gap-2 transition-all rounded-none ${
                      regType === 'CAR'
                        ? 'border-[#C5A880] bg-[#C5A880]/10 text-white'
                        : 'border-[#2D3748] bg-[#161B22] text-gray-400 hover:text-white'
                    }`}
                  >
                    <Car className="w-4 h-4 text-[#C5A880]" />
                    <div>
                      <div className="font-bold">{isEn ? 'Car (Basement B2)' : 'Ô Tô (Hầm B2)'}</div>
                      <div className="text-[10px] text-gray-400 font-mono">1.200.000 đ/tháng</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRegType('MOTORBIKE');
                      if (regCustomSlot.startsWith('B2')) setRegCustomSlot('');
                    }}
                    className={`py-2 px-3 border text-left flex items-center gap-2 transition-all rounded-none ${
                      regType === 'MOTORBIKE'
                        ? 'border-cyan-400 bg-cyan-950/20 text-white'
                        : 'border-[#2D3748] bg-[#161B22] text-gray-400 hover:text-white'
                    }`}
                  >
                    <Bike className="w-4 h-4 text-cyan-400" />
                    <div>
                      <div className="font-bold">{isEn ? 'Motorbike (Basement B1)' : 'Xe Máy (Hầm B1)'}</div>
                      <div className="text-[10px] text-gray-400 font-mono">120.000 đ/tháng</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* License Plate Number */}
              <div>
                <label className="block text-gray-400 uppercase tracking-wider font-semibold mb-1.5">
                  {isEn ? 'License Plate Number *' : 'Biển Số Xe *'}
                </label>
                <input
                  type="text"
                  placeholder={regType === 'CAR' ? 'Ví dụ: 51K-889.99' : 'Ví dụ: 59F2-688.88'}
                  value={regPlate}
                  onChange={(e) => setRegPlate(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-[#161B22] border border-[#2D3748] text-white font-mono font-bold focus:outline-none focus:border-[#C5A880] rounded-none tracking-widest"
                  required
                />
              </div>

              {/* Brand / Model */}
              <div>
                <label className="block text-gray-400 uppercase tracking-wider font-semibold mb-1.5">
                  {isEn ? 'Vehicle Brand / Model' : 'Hãng Xe / Nhãn Hiệu'}
                </label>
                <input
                  type="text"
                  placeholder={regType === 'CAR' ? 'Ví dụ: Mercedes-Benz C300 AMG' : 'Ví dụ: Honda SH 150i ABS'}
                  value={regBrand}
                  onChange={(e) => setRegBrand(e.target.value)}
                  className="w-full px-3 py-2 bg-[#161B22] border border-[#2D3748] text-white focus:outline-none focus:border-[#C5A880] rounded-none"
                />
              </div>

              {/* Allocated Slot (Optional or auto) */}
              <div>
                <label className="block text-gray-400 uppercase tracking-wider font-semibold mb-1.5">
                  {isEn ? 'Allocated Slot (Leave empty for auto-assign)' : 'Vị Trí Ô Đỗ Chỉ Định (Để trống để tự động gán)'}
                </label>
                <input
                  type="text"
                  placeholder={regType === 'CAR' ? 'Ví dụ: B2-A05 hoặc B2-B12' : 'Ví dụ: B1-M08'}
                  value={regCustomSlot}
                  onChange={(e) => setRegCustomSlot(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-[#161B22] border border-[#2D3748] text-white font-mono focus:outline-none focus:border-[#C5A880] rounded-none"
                />
              </div>

              {/* Automated Provisioning Info */}
              <div className="p-3 bg-[#121820] border border-[#222B35] space-y-1.5 text-[11px] text-gray-400 font-mono">
                <div className="text-gray-300 font-semibold">{isEn ? 'System Allocation Notice:' : 'Thông Tin Cấp Phát Tự Động:'}</div>
                <div>• {isEn ? 'Automated RFID card ID generation linked to unit quota' : 'Hệ thống tự động cấp mã thẻ RFID liên kết với hạn mức căn hộ'}</div>
                <div>• {regType === 'CAR' ? 'Định mức: 1.200.000 đ/tháng (Hầm B2)' : 'Định mức: 120.000 đ/tháng (Hầm B1)'}</div>
                <div>• {isEn ? 'Billing automatically added to monthly apartment utilities' : 'Cước phí gửi xe tự động ghi nợ vào sổ cái hàng tháng của căn hộ'}</div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#222B35]">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2 bg-[#161B22] hover:bg-gray-800 text-gray-300 border border-gray-700 transition-colors rounded-none"
                >
                  {isEn ? 'Cancel' : 'Hủy Bỏ'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#C5A880] hover:bg-[#E2C9A5] text-[#0A0E14] font-semibold uppercase tracking-wider transition-colors rounded-none"
                >
                  {isEn ? 'Issue RFID & Register' : 'Xác Nhận Cấp Thẻ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
