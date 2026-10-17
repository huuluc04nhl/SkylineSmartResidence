'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Car, 
  ShieldCheck, 
  AlertTriangle, 
  Camera, 
  Check, 
  RefreshCw, 
  Search, 
  Bike, 
  CreditCard,
  Building,
  UserCheck,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  History,
  Lock,
  Unlock,
  Radio,
  ArrowRight,
  Filter,
  Play
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

interface LprLogEntry {
  id: string;
  timestamp: string;
  lane: 'INBOUND_01' | 'OUTBOUND_02';
  plate: string;
  vehicleType: 'CAR' | 'MOTORBIKE';
  aptCode?: string;
  ownerName?: string;
  result: 'MATCHED' | 'UNREGISTERED';
  barrierAction: 'OPENED' | 'DENIED' | 'MANUAL_OVERRIDE';
}

const LPR_LOGS_STORAGE_KEY = 'skyline_parking_lpr_logs_v1';

export default function SmartParking() {
  const { isEn } = useLanguage();

  // Apartment Data & Registered Vehicles
  const [apartments, setApartments] = useState<ApartmentUnit[]>([]);
  const [activeTab, setActiveTab] = useState<'REGISTRY' | 'LOGS'>('REGISTRY');
  const [activeLane, setActiveLane] = useState<'INBOUND_01' | 'OUTBOUND_02'>('INBOUND_01');

  // Scanner & Barrier State
  const [barrierOpen, setBarrierOpen] = useState(false);
  const [manualOverride, setManualOverride] = useState(false);
  const [searchPlate, setSearchPlate] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'CAR' | 'MOTORBIKE'>('ALL');
  const [customScanPlate, setCustomScanPlate] = useState('');

  // Modal State for New Vehicle Registration
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [regAptCode, setRegAptCode] = useState('');
  const [regType, setRegType] = useState<'CAR' | 'MOTORBIKE'>('CAR');
  const [regPlate, setRegPlate] = useState('');
  const [regBrand, setRegBrand] = useState('');
  const [regFormError, setRegFormError] = useState('');
  const [regSuccessMsg, setRegSuccessMsg] = useState('');

  // Initial Real State: No fake plates by default
  const [lastScannedPlate, setLastScannedPlate] = useState('');
  const [matchedVehicle, setMatchedVehicle] = useState<RegisteredVehicleWithUnit | null>(null);
  const [scanResult, setScanResult] = useState<'IDLE' | 'MATCHED' | 'UNREGISTERED'>('IDLE');

  // Real LPR Logs loaded from storage
  const [lprLogs, setLprLogs] = useState<LprLogEntry[]>([]);

  // Initial load: Fetch real apartments and real logs
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

    try {
      const storedLogs = localStorage.getItem(LPR_LOGS_STORAGE_KEY);
      if (storedLogs) {
        const parsed = JSON.parse(storedLogs);
        if (Array.isArray(parsed)) {
          setLprLogs(parsed);
        }
      }
    } catch (e) {
      console.warn('Error reading LPR logs storage:', e);
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

  // Real Infrastructure capacity specs for Chung Cư BS-07 (The Tropical)
  const MAX_CAR_SLOTS = 120; // Hầm B2
  const MAX_MOTO_SLOTS = 350; // Hầm B1
  const registeredCars = registeredVehicles.filter(v => v.type === 'CAR').length;
  const registeredMotos = registeredVehicles.filter(v => v.type === 'MOTORBIKE').length;

  const carOccupancyPct = Math.min(100, Math.round((registeredCars / MAX_CAR_SLOTS) * 100));
  const motoOccupancyPct = Math.min(100, Math.round((registeredMotos / MAX_MOTO_SLOTS) * 100));

  // Handler: Real LPR Camera OCR Scan Simulation
  const handleSimulateScan = (plateNumber: string) => {
    if (!plateNumber.trim()) return;

    const formattedPlate = plateNumber.trim().toUpperCase();
    const cleanPlate = formattedPlate.replace(/[-.\s]/g, '');

    const found = registeredVehicles.find(v => 
      v.plate.toUpperCase().replace(/[-.\s]/g, '') === cleanPlate
    );

    setLastScannedPlate(formattedPlate);

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} ${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}`;

    if (found) {
      setMatchedVehicle(found);
      setScanResult('MATCHED');
      setBarrierOpen(true);

      const newLog: LprLogEntry = {
        id: `LOG-${Date.now().toString().slice(-4)}`,
        timestamp: timeStr,
        lane: activeLane,
        plate: formattedPlate,
        vehicleType: found.type === 'CAR' ? 'CAR' : 'MOTORBIKE',
        aptCode: found.aptCode,
        ownerName: found.ownerName,
        result: 'MATCHED',
        barrierAction: 'OPENED',
      };

      setLprLogs(prev => {
        const updated = [newLog, ...prev.slice(0, 49)];
        try {
          localStorage.setItem(LPR_LOGS_STORAGE_KEY, JSON.stringify(updated));
        } catch {}
        return updated;
      });

      setTimeout(() => {
        if (!manualOverride) {
          setBarrierOpen(false);
        }
      }, 4000);
    } else {
      setMatchedVehicle(null);
      setScanResult('UNREGISTERED');
      setBarrierOpen(false);

      const newLog: LprLogEntry = {
        id: `LOG-${Date.now().toString().slice(-4)}`,
        timestamp: timeStr,
        lane: activeLane,
        plate: formattedPlate,
        vehicleType: formattedPlate.includes('F') || formattedPlate.includes('M') ? 'MOTORBIKE' : 'CAR',
        result: 'UNREGISTERED',
        barrierAction: 'DENIED',
      };

      setLprLogs(prev => {
        const updated = [newLog, ...prev.slice(0, 49)];
        try {
          localStorage.setItem(LPR_LOGS_STORAGE_KEY, JSON.stringify(updated));
        } catch {}
        return updated;
      });
    }
  };

  // Clear all recorded LPR logs
  const handleClearLogs = () => {
    const confirmMsg = isEn 
      ? 'Are you sure you want to clear all real-time LPR audit logs?' 
      : 'Bạn có chắc chắn muốn xóa toàn bộ lịch sử quét LPR thời gian thực?';
    if (!window.confirm(confirmMsg)) return;

    setLprLogs([]);
    try {
      localStorage.removeItem(LPR_LOGS_STORAGE_KEY);
    } catch {}
  };

  // Toggle Manual BMS Override
  const handleToggleManualOverride = () => {
    if (manualOverride) {
      setManualOverride(false);
      setBarrierOpen(false);
    } else {
      setManualOverride(true);
      setBarrierOpen(true);
    }
  };

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

    // Auto-generate slot & RFID
    const prefixSlot = regType === 'CAR' ? 'B2-A' : 'B1-M';
    const randomSlotNum = Math.floor(Math.random() * 80) + 1;
    const generatedSlot = `${prefixSlot}${String(randomSlotNum).padStart(2, '0')}`;
    const generatedCardNo = `RFID-${regAptCode}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newVehicle: ApartmentVehicle = {
      id: `veh-${Date.now()}`,
      type: regType,
      plate: regPlate.trim().toUpperCase(),
      brand: regBrand.trim() || (regType === 'CAR' ? 'Sedan / SUV' : 'Xe máy'),
      cardNo: generatedCardNo,
      slot: generatedSlot,
    };

    const ok = addApartmentVehicle(regAptCode, newVehicle);
    if (ok) {
      const refreshed = getApartmentUnits();
      setApartments(refreshed);
      setRegSuccessMsg(
        isEn
          ? `Vehicle ${newVehicle.plate} successfully assigned to Unit ${regAptCode} (Slot ${generatedSlot})`
          : `Đã cấp thẻ thành công xe ${newVehicle.plate} cho Căn ${regAptCode} (Ô ${generatedSlot})`
      );
      setRegPlate('');
      setRegBrand('');
      setTimeout(() => {
        setIsRegisterModalOpen(false);
        setRegSuccessMsg('');
      }, 1500);
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
      // Reset scanner if current plate was revoked
      if (lastScannedPlate === plate) {
        setLastScannedPlate('');
        setMatchedVehicle(null);
        setScanResult('IDLE');
        setBarrierOpen(false);
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
        (v.brand && v.brand.toLowerCase().includes(q))
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
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            {isEn ? 'SMART PARKING AUTOMATION • BASEMENT B1 & B2' : 'BÃI ĐỖ XE THÔNG MINH HẦM B1 & B2 • TÒA NHÀ THE TROPICAL'}
          </div>
          <h2 className="font-serif text-xl sm:text-2xl text-white font-bold mt-1">
            {isEn ? 'Vehicle Access & AI LPR Surveillance' : 'Hệ Thống Kiểm Soát & Giám Sát Phương Tiện'}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#121820] border border-[#222B35] text-[11px] font-mono text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
            LPR-01 & 02: ONLINE
          </div>
          <button
            type="button"
            onClick={() => setIsRegisterModalOpen(true)}
            className="px-4 py-2 bg-[#C5A880] hover:bg-[#E2C9A5] text-[#0A0E14] text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors rounded-none"
          >
            <Plus className="w-3.5 h-3.5" />
            {isEn ? 'Register New Vehicle' : 'Cấp Thẻ & Đăng Ký Xe'}
          </button>
        </div>
      </div>

      {/* 2. Infrastructure Capacity Gauges (Basement B1 & B2) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Car Capacity (Basement B2) */}
        <div className="p-4 bg-[#121820] border border-[#222B35] space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-200 font-semibold uppercase tracking-wider flex items-center gap-2">
              <Car className="w-4 h-4 text-[#C5A880]" />
              {isEn ? 'Car Capacity (Basement B2 - VIP Zone)' : 'Sức Chứa Ô Tô (Hầm B2 - Phân Khu A/B)'}
            </span>
            <span className="font-mono text-xs font-bold text-white bg-[#161B22] px-2 py-0.5 border border-[#2D3748]">
              {registeredCars} / {MAX_CAR_SLOTS} {isEn ? 'Slots' : 'Chỗ'} ({carOccupancyPct}%)
            </span>
          </div>

          <div className="w-full h-2.5 bg-[#0A0E14] border border-[#222B35] overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                carOccupancyPct >= 90 ? 'bg-rose-500' : carOccupancyPct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.max(registeredCars > 0 ? 4 : 0, carOccupancyPct)}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[11px] text-gray-400 font-mono">
            <span className="text-emerald-400 flex items-center gap-1">
              ● {isEn ? `Registered: ${registeredCars} slots` : `Đã cấp ô đỗ cố định: ${registeredCars} xe`}
            </span>
            <span className="text-gray-300">
              {isEn ? `Available: ${MAX_CAR_SLOTS - registeredCars}` : `Còn trống: ${MAX_CAR_SLOTS - registeredCars} ô`}
            </span>
            <span className="text-[#C5A880] font-semibold">1.200.000 đ/{isEn ? 'mo' : 'tháng'}</span>
          </div>
        </div>

        {/* Motorbike Capacity (Basement B1) */}
        <div className="p-4 bg-[#121820] border border-[#222B35] space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-200 font-semibold uppercase tracking-wider flex items-center gap-2">
              <Bike className="w-4 h-4 text-cyan-400" />
              {isEn ? 'Motorbike Capacity (Basement B1 - Zone M)' : 'Sức Chứa Xe Máy (Hầm B1 - Khu M1/M2)'}
            </span>
            <span className="font-mono text-xs font-bold text-white bg-[#161B22] px-2 py-0.5 border border-[#2D3748]">
              {registeredMotos} / {MAX_MOTO_SLOTS} {isEn ? 'Slots' : 'Xe'} ({motoOccupancyPct}%)
            </span>
          </div>

          <div className="w-full h-2.5 bg-[#0A0E14] border border-[#222B35] overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                motoOccupancyPct >= 90 ? 'bg-rose-500' : 'bg-cyan-500'
              }`}
              style={{ width: `${Math.max(registeredMotos > 0 ? 4 : 0, motoOccupancyPct)}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[11px] text-gray-400 font-mono">
            <span className="text-cyan-400 flex items-center gap-1">
              ● {isEn ? `Issued RFID: ${registeredMotos}` : `Đã cấp thẻ RFID: ${registeredMotos} xe`}
            </span>
            <span className="text-gray-300">
              {isEn ? `Available: ${MAX_MOTO_SLOTS - registeredMotos}` : `Còn nhận tối đa: ${MAX_MOTO_SLOTS - registeredMotos} xe`}
            </span>
            <span className="text-cyan-300 font-semibold">120.000 đ/{isEn ? 'mo' : 'tháng'}</span>
          </div>
        </div>
      </div>

      {/* 3. AI LPR Terminal & BMS Barrier HUD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left (7 cols): Camera Feed & Dynamic Scanner */}
        <div className="lg:col-span-7 bg-[#121820] border border-[#222B35] p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#222B35] pb-3 text-xs">
            <div className="flex items-center gap-2 font-mono">
              <button
                type="button"
                onClick={() => setActiveLane('INBOUND_01')}
                className={`px-2.5 py-1 text-xs uppercase font-semibold transition-colors ${
                  activeLane === 'INBOUND_01'
                    ? 'bg-[#C5A880] text-black'
                    : 'bg-[#161B22] text-gray-400 hover:text-white border border-[#2D3748]'
                }`}
              >
                {isEn ? 'Inbound Lane 01' : 'Làn Vào LPR-01'}
              </button>
              <button
                type="button"
                onClick={() => setActiveLane('OUTBOUND_02')}
                className={`px-2.5 py-1 text-xs uppercase font-semibold transition-colors ${
                  activeLane === 'OUTBOUND_02'
                    ? 'bg-[#C5A880] text-black'
                    : 'bg-[#161B22] text-gray-400 hover:text-white border border-[#2D3748]'
                }`}
              >
                {isEn ? 'Outbound Lane 02' : 'Làn Ra LPR-02'}
              </button>
            </div>
            <span className="font-mono text-gray-400 text-[11px] flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-emerald-400" />
              1080P 60FPS • AI OCR CORE V4.2
            </span>
          </div>

          {/* Camera Viewport */}
          <div className="relative h-60 bg-black border border-gray-800 flex items-center justify-center overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80"
              alt="Car Entry Surveillance"
              className="w-full h-full object-cover opacity-50"
            />

            {/* Corner HUD Reticles */}
            <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-[#C5A880]/80"></div>
            <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-[#C5A880]/80"></div>
            <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-[#C5A880]/80"></div>
            <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-[#C5A880]/80"></div>

            {/* Top Lane Watermark */}
            <div className="absolute top-3 inset-x-8 flex justify-between items-center text-[10px] font-mono text-gray-300 bg-black/60 px-3 py-1 border border-gray-800 backdrop-blur-sm">
              <span className="text-[#C5A880] font-bold">
                {activeLane === 'INBOUND_01' ? 'GATE 01 - CỔNG BẮC (VÀO)' : 'GATE 02 - CỔNG NAM (RA)'}
              </span>
              <span className="text-emerald-400">IR SENSOR ACTIVE</span>
            </div>

            {/* AI Bounding Box Overlay */}
            {scanResult === 'IDLE' ? (
              <div className="absolute inset-x-6 bottom-4 border p-2.5 bg-black/85 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="font-mono text-xs sm:text-sm font-bold tracking-widest px-2 py-0.5 border text-gray-400 border-gray-700 bg-gray-900/60">
                    [ {isEn ? 'SENSOR STANDBY' : 'CHỜ XE TIẾN VÀO'} ]
                  </div>
                  <div className="text-[11px] font-mono text-gray-400">
                    {isEn ? 'Induction loop ready • Enter plate to test' : 'Vòng lặp từ tính sẵn sàng • Quét biển số bên dưới'}
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-1 uppercase font-semibold border text-gray-400 bg-gray-900 border-gray-700">
                  STANDBY
                </span>
              </div>
            ) : (
              <div className={`absolute inset-x-6 bottom-4 border-2 p-2.5 bg-black/85 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                scanResult === 'MATCHED' ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`font-mono text-lg font-bold tracking-widest px-2 py-0.5 border ${
                    scanResult === 'MATCHED' 
                      ? 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40' 
                      : 'text-rose-400 border-rose-500/40 bg-rose-950/40'
                  }`}>
                    [ {lastScannedPlate} ]
                  </div>
                  <div className="text-[11px] font-mono text-gray-300">
                    {matchedVehicle 
                      ? `${matchedVehicle.brand || 'Vehicle'} • Căn ${matchedVehicle.aptCode}` 
                      : (isEn ? 'Unregistered Guest' : 'Xe Vãng Lai Chưa Đăng Ký')}
                  </div>
                </div>

                <span className={`text-[10px] font-mono px-2 py-1 uppercase font-semibold border ${
                  scanResult === 'MATCHED'
                    ? 'text-emerald-300 bg-emerald-950/70 border-emerald-500'
                    : 'text-rose-300 bg-rose-950/70 border-rose-500'
                }`}>
                  {scanResult === 'MATCHED' ? (isEn ? 'VERIFIED MATCH' : 'HỢP LỆ • CƯ DÂN') : (isEn ? 'UNREGISTERED' : 'CHƯA ĐĂNG KÝ')}
                </span>
              </div>
            )}
          </div>

          {/* Dynamic License Plate Scanner Bar */}
          <div className="space-y-3 pt-1">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (customScanPlate.trim()) {
                  handleSimulateScan(customScanPlate);
                  setCustomScanPlate('');
                }
              }}
              className="flex gap-2"
            >
              <div className="relative flex-1">
                <Camera className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={isEn ? "Enter license plate to scan (e.g. 51K-889.99)..." : "Nhập biển số xe bất kỳ để quét kiểm tra..."}
                  value={customScanPlate}
                  onChange={(e) => setCustomScanPlate(e.target.value.toUpperCase())}
                  className="w-full pl-8 pr-3 py-2 bg-[#161B22] border border-[#2D3748] text-xs font-mono font-bold text-white uppercase focus:outline-none focus:border-[#C5A880] rounded-none tracking-wider"
                />
              </div>
              <button
                type="submit"
                disabled={!customScanPlate.trim()}
                className="px-4 py-2 bg-[#C5A880] hover:bg-[#E2C9A5] disabled:bg-gray-800 disabled:text-gray-500 text-black text-xs font-semibold uppercase tracking-wider font-mono transition-colors rounded-none flex items-center gap-1.5"
              >
                <Play className="w-3 h-3 fill-current" />
                {isEn ? "Scan Plate" : "Quét Ngay"}
              </button>
            </form>

            {/* Quick Simulation Buttons from REAL Registered Vehicles */}
            <div className="space-y-1.5">
              <div className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider flex items-center justify-between">
                <span>{isEn ? 'Quick Scan Registered Resident Vehicles:' : 'Xe Cư Dân Thực Tế Trong Tòa Nhà:'}</span>
                <span className="text-[#C5A880] text-[10px] font-mono">{registeredVehicles.length} {isEn ? 'registered' : 'phương tiện'}</span>
              </div>

              {registeredVehicles.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {registeredVehicles.slice(0, 4).map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => handleSimulateScan(v.plate)}
                      className="p-2 bg-[#161B22] border border-[#2D3748] hover:border-[#C5A880] text-left transition-all group rounded-none"
                    >
                      <div className="text-[11px] font-mono font-bold text-[#C5A880] group-hover:text-white">
                        {v.plate}
                      </div>
                      <div className="text-[10px] text-gray-400 truncate mt-0.5">
                        Căn {v.aptCode} • {v.type === 'CAR' ? 'Ô tô' : 'Xe máy'}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-[#161B22] border border-[#222B35] text-gray-400 text-xs font-mono flex items-center justify-between">
                  <span>{isEn ? 'No vehicles registered in building yet.' : 'Chưa có phương tiện nào đăng ký trong tòa nhà.'}</span>
                  <button
                    type="button"
                    onClick={() => setIsRegisterModalOpen(true)}
                    className="text-[#C5A880] hover:underline font-semibold"
                  >
                    + {isEn ? 'Register Now' : 'Đăng Ký Ngay'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right (5 cols): Barrier Control & BMS Match HUD */}
        <div className="lg:col-span-5 bg-[#121820] border border-[#222B35] p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#222B35] pb-3 text-xs uppercase tracking-wider text-[#C5A880] font-semibold">
              <span>{isEn ? 'BMS Telemetry & Barrier State' : 'Đối Soát Căn Hộ & Cần Barrier'}</span>
              <span className="font-mono text-emerald-400 text-[11px]">SLA &lt; 0.4s</span>
            </div>

            {/* Resident & Slot Match Card */}
            <div className="p-3.5 bg-[#161B22] border border-[#222B35] space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">{isEn ? 'License Plate:' : 'Biển số nhận diện:'}</span>
                <span className="font-mono font-bold text-white bg-[#0A0E14] px-2 py-0.5 border border-gray-700">
                  {lastScannedPlate || '---'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">{isEn ? 'Resident / Unit:' : 'Chủ xe & Căn hộ:'}</span>
                <span className="text-gray-200 font-semibold truncate max-w-[200px]">
                  {scanResult === 'IDLE' 
                    ? '---' 
                    : matchedVehicle 
                    ? `${matchedVehicle.ownerName} (Căn ${matchedVehicle.aptCode})` 
                    : (isEn ? 'Guest (Ticket required)' : 'Khách Vãng Lai (Vé lượt)')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">{isEn ? 'Vehicle Spec:' : 'Dòng xe & Nhãn hiệu:'}</span>
                <span className="text-gray-300 font-mono">
                  {scanResult === 'IDLE' 
                    ? '---' 
                    : matchedVehicle 
                    ? `${matchedVehicle.type === 'CAR' ? 'Ô tô' : 'Xe máy'} • ${matchedVehicle.brand || '---'}` 
                    : (isEn ? 'Unregistered' : 'Chưa định danh')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">{isEn ? 'RFID Card & Slot:' : 'Mã thẻ & Vị trí đỗ:'}</span>
                <span className="text-[#C5A880] font-mono font-bold">
                  {scanResult === 'IDLE' 
                    ? '---' 
                    : matchedVehicle 
                    ? `${matchedVehicle.cardNo} • Ô ${matchedVehicle.slot || 'B2-A01'}` 
                    : 'VÉ LƯỢT BMS'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">{isEn ? 'Monthly Billing:' : 'Phí đỗ tháng:'}</span>
                <span className={`font-mono text-[11px] font-semibold ${
                  scanResult === 'IDLE' 
                    ? 'text-gray-500' 
                    : matchedVehicle 
                    ? 'text-emerald-400' 
                    : 'text-amber-400'
                }`}>
                  {scanResult === 'IDLE' 
                    ? '---' 
                    : matchedVehicle 
                    ? (isEn ? 'PAID / ACTIVE ✓' : 'ĐÃ ĐÓNG ĐẦY ĐỦ ✓') 
                    : (isEn ? 'GUEST HOURLY' : 'TÍNH THEO GIỜ')}
                </span>
              </div>
            </div>

            {/* Barrier Visual Indicator Box */}
            <div 
              className={`p-4 border text-center space-y-1.5 transition-all duration-300 ${
                barrierOpen 
                  ? 'bg-emerald-950/40 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.25)]' 
                  : 'bg-[#161F2E]/60 border-gray-700'
              }`}
            >
              <div className="text-[10px] uppercase tracking-widest text-gray-400 font-mono flex items-center justify-center gap-1.5">
                {barrierOpen ? <Unlock className="w-3.5 h-3.5 text-emerald-400" /> : <Lock className="w-3.5 h-3.5 text-gray-400" />}
                {barrierOpen ? 'TÍN HIỆU BMS: CẦN BARRIER ĐANG MỞ' : 'TÍN HIỆU BMS: RÀO CHẮN ĐANG HẠ (ĐÓNG)'}
              </div>
              <div className={`font-serif text-lg sm:text-xl font-bold tracking-wide ${
                barrierOpen ? 'text-emerald-400' : 'text-gray-300'
              }`}>
                {barrierOpen ? (isEn ? 'BARRIER OPEN — PASS' : 'BARRIER ĐANG MỞ — MỜI QUA') : (isEn ? 'BARRIER CLOSED' : 'BARRIER ĐANG ĐÓNG')}
              </div>
              {manualOverride && (
                <div className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider">
                  ⚠️ {isEn ? 'MANUAL BMS OVERRIDE ACTIVE' : 'CHẾ ĐỘ MỞ KHẨN CẤP ĐANG BẬT'}
                </div>
              )}
            </div>
          </div>

          {/* Manual Control Actions */}
          <div className="pt-3 border-t border-[#222B35] space-y-2">
            <button
              type="button"
              onClick={handleToggleManualOverride}
              className={`w-full py-2 px-3 text-xs font-semibold font-mono uppercase tracking-wider border transition-colors flex items-center justify-center gap-2 rounded-none ${
                manualOverride
                  ? 'bg-rose-950 border-rose-500 text-rose-300 hover:bg-rose-900'
                  : 'bg-[#161B22] border-[#C5A880]/50 text-[#C5A880] hover:bg-[#C5A880] hover:text-black'
              }`}
            >
              {manualOverride ? (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  {isEn ? 'Cancel Override (Close Barrier)' : 'Hủy Can Thiệp (Hạ Cần Barrier)'}
                </>
              ) : (
                <>
                  <Unlock className="w-3.5 h-3.5" />
                  {isEn ? 'Manual BMS Override (Open Gate)' : 'Mở Barrier Khẩn Cấp (BMS Override)'}
                </>
              )}
            </button>
            <div className="text-[10px] text-gray-500 text-center font-mono">
              {isEn ? 'Direct relay control via IoT Modbus TCP Gateway' : 'Điều khiển rơ-le trực tiếp qua cổng IoT Modbus TCP Gateway'}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Tab Navigation: Registered Vehicles vs LPR Event Logs */}
      <div className="bg-[#121820] border border-[#222B35] p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222B35] pb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('REGISTRY')}
              className={`px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider font-mono flex items-center gap-2 transition-colors rounded-none ${
                activeTab === 'REGISTRY'
                  ? 'bg-[#C5A880] text-black font-bold'
                  : 'bg-[#161B22] text-gray-400 hover:text-white border border-[#2D3748]'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              {isEn ? `Resident Vehicles (${filteredVehicles.length})` : `Danh Sách Xe Cư Dân (${filteredVehicles.length})`}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('LOGS')}
              className={`px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider font-mono flex items-center gap-2 transition-colors rounded-none ${
                activeTab === 'LOGS'
                  ? 'bg-[#C5A880] text-black font-bold'
                  : 'bg-[#161B22] text-gray-400 hover:text-white border border-[#2D3748]'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              {isEn ? `LPR Event Logs (${lprLogs.length})` : `Nhật Ký Quét LPR (${lprLogs.length})`}
            </button>
          </div>

          {activeTab === 'REGISTRY' ? (
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
          ) : (
            lprLogs.length > 0 && (
              <button
                type="button"
                onClick={handleClearLogs}
                className="px-3 py-1 bg-rose-950/30 border border-rose-500/40 hover:border-rose-400 text-rose-300 text-xs font-mono flex items-center gap-1.5 transition-colors rounded-none"
              >
                <Trash2 className="w-3 h-3" />
                {isEn ? 'Clear Logs' : 'Xóa Nhật Ký'}
              </button>
            )
          )}
        </div>

        {/* Tab 1 Content: Resident Vehicles Registry */}
        {activeTab === 'REGISTRY' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-[#222B35]">
              <thead className="bg-[#161B22] text-gray-400 font-semibold uppercase tracking-wider text-[10px] border-b border-[#222B35]">
                <tr>
                  <th className="p-3">{isEn ? 'Plate Number' : 'Biển Số Xe'}</th>
                  <th className="p-3">{isEn ? 'Type' : 'Phân Loại'}</th>
                  <th className="p-3">{isEn ? 'Model / Brand' : 'Dòng Xe / Nhãn Hiệu'}</th>
                  <th className="p-3">{isEn ? 'Unit' : 'Căn Hộ'}</th>
                  <th className="p-3">{isEn ? 'Owner' : 'Chủ Sở Hữu'}</th>
                  <th className="p-3">{isEn ? 'RFID Card ID' : 'Mã Thẻ RFID'}</th>
                  <th className="p-3">{isEn ? 'Slot' : 'Vị Trí Ô Đỗ'}</th>
                  <th className="p-3 text-right">{isEn ? 'Actions' : 'Thao Tác'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1C2533]">
                {filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-500 font-mono space-y-2">
                      <Car className="w-8 h-8 text-gray-600 mx-auto" />
                      <div>
                        {searchPlate.trim() 
                          ? (isEn ? 'No vehicles match your search query.' : 'Không tìm thấy phương tiện nào phù hợp với từ khóa tìm kiếm.')
                          : (isEn ? 'No vehicles registered in the building yet. Click "+ Register New Vehicle" to add.' : 'Chưa có phương tiện nào được cấp quyền trong tòa nhà. Hãy nhấn "+ Cấp Thẻ & Đăng Ký Xe" để đăng ký.')}
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
                          {veh.type === 'CAR' ? (isEn ? 'CAR' : 'Ô Tô') : (isEn ? 'MOTO' : 'Xe Máy')}
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
                      <td className="p-3 font-mono text-[#C5A880]">
                        {veh.slot || (veh.type === 'CAR' ? 'B2-A' : 'B1-M')}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleSimulateScan(veh.plate)}
                            className="px-2.5 py-1 bg-[#1C2533] hover:bg-[#C5A880] hover:text-black text-gray-300 border border-gray-700 text-[11px] font-semibold transition-all rounded-none"
                            title={isEn ? 'Test LPR Scan' : 'Quét Thử Biển Số'}
                          >
                            {isEn ? 'Test' : 'Quét Thử'}
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
        )}

        {/* Tab 2 Content: Real-time LPR Event Logs */}
        {activeTab === 'LOGS' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-[#222B35]">
              <thead className="bg-[#161B22] text-gray-400 font-semibold uppercase tracking-wider text-[10px] border-b border-[#222B35]">
                <tr>
                  <th className="p-3">{isEn ? 'Log ID & Time' : 'Mã & Thời Gian'}</th>
                  <th className="p-3">{isEn ? 'Lane' : 'Làn Kiểm Soát'}</th>
                  <th className="p-3">{isEn ? 'Plate Number' : 'Biển Số Xe'}</th>
                  <th className="p-3">{isEn ? 'Type' : 'Phân Loại'}</th>
                  <th className="p-3">{isEn ? 'Unit / Target' : 'Căn Hộ / Đối Tượng'}</th>
                  <th className="p-3">{isEn ? 'LPR Match Result' : 'Kết Quả Quét AI'}</th>
                  <th className="p-3 text-right">{isEn ? 'Barrier Action' : 'Trạng Thái Barrier'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1C2533]">
                {lprLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500 font-mono space-y-2">
                      <History className="w-8 h-8 text-gray-600 mx-auto" />
                      <div>
                        {isEn 
                          ? 'No LPR scan records recorded yet. Scan a vehicle above to generate real-time audit logs.' 
                          : 'Chưa có nhật ký quét LPR nào được ghi nhận. Hãy quét biển số ở trên để tạo bản ghi thời gian thực.'}
                      </div>
                    </td>
                  </tr>
                ) : (
                  lprLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#161F2E]/60 transition-colors">
                      <td className="p-3 font-mono">
                        <span className="text-gray-300 font-bold">{log.id}</span>
                        <span className="text-gray-500 ml-2">{log.timestamp}</span>
                      </td>
                      <td className="p-3 font-mono text-[11px]">
                        {log.lane === 'INBOUND_01' ? (
                          <span className="text-emerald-400">LPR-01 (Vào)</span>
                        ) : (
                          <span className="text-cyan-400">LPR-02 (Ra)</span>
                        )}
                      </td>
                      <td className="p-3 font-mono font-bold text-white">
                        {log.plate}
                      </td>
                      <td className="p-3 font-mono text-gray-300">
                        {log.vehicleType === 'CAR' ? (isEn ? 'Car' : 'Ô tô') : (isEn ? 'Motorbike' : 'Xe máy')}
                      </td>
                      <td className="p-3 text-gray-300">
                        {log.aptCode ? (
                          <span>Căn {log.aptCode} - {log.ownerName}</span>
                        ) : (
                          <span className="text-amber-400 italic">{isEn ? 'Guest / Visitor' : 'Khách Vãng Lai'}</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 text-[10px] font-mono font-semibold border ${
                          log.result === 'MATCHED'
                            ? 'bg-emerald-950/50 text-emerald-300 border-emerald-500/40'
                            : 'bg-rose-950/50 text-rose-300 border-rose-500/40'
                        }`}>
                          {log.result === 'MATCHED' ? (isEn ? 'MATCHED' : 'HỢP LỆ') : (isEn ? 'UNREGISTERED' : 'KHÔNG KHỚP')}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono">
                        <span className={`font-semibold ${
                          log.barrierAction === 'OPENED'
                            ? 'text-emerald-400'
                            : log.barrierAction === 'DENIED'
                            ? 'text-rose-400'
                            : 'text-amber-400'
                        }`}>
                          {log.barrierAction === 'OPENED' ? 'OPENED ✓' : log.barrierAction === 'DENIED' ? 'DENIED ✕' : 'OVERRIDE'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
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
                  {isEn ? 'Register Resident Vehicle' : 'Đăng Ký Định Danh Phương Tiện Mới'}
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
                    onClick={() => setRegType('CAR')}
                    className={`py-2 px-3 border text-left flex items-center gap-2 transition-all rounded-none ${
                      regType === 'CAR'
                        ? 'border-[#C5A880] bg-[#C5A880]/10 text-white'
                        : 'border-[#2D3748] bg-[#161B22] text-gray-400 hover:text-white'
                    }`}
                  >
                    <Car className="w-4 h-4 text-[#C5A880]" />
                    <div>
                      <div className="font-bold">{isEn ? 'Car (Hầm B2)' : 'Ô Tô (Hầm B2)'}</div>
                      <div className="text-[10px] text-gray-400 font-mono">1.200.000 đ/tháng</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegType('MOTORBIKE')}
                    className={`py-2 px-3 border text-left flex items-center gap-2 transition-all rounded-none ${
                      regType === 'MOTORBIKE'
                        ? 'border-cyan-400 bg-cyan-950/20 text-white'
                        : 'border-[#2D3748] bg-[#161B22] text-gray-400 hover:text-white'
                    }`}
                  >
                    <Bike className="w-4 h-4 text-cyan-400" />
                    <div>
                      <div className="font-bold">{isEn ? 'Motorbike (Hầm B1)' : 'Xe Máy (Hầm B1)'}</div>
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

              {/* Automated Provisioning Info */}
              <div className="p-3 bg-[#121820] border border-[#222B35] space-y-1.5 text-[11px] text-gray-400 font-mono">
                <div className="text-gray-300 font-semibold">{isEn ? 'System Allocation Notice:' : 'Thông Tin Cấp Phát Tự Động:'}</div>
                <div>• {isEn ? 'Automated RFID card ID generation linked to unit quota' : 'Hệ thống tự động cấp mã thẻ RFID liên kết với hạn mức căn'}</div>
                <div>• {regType === 'CAR' ? 'Ô đỗ cố định phân bổ tại Hầm B2 (Khu VIP/Standard)' : 'Vị trí đỗ xe máy phân bổ tự do tại Hầm B1'}</div>
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
