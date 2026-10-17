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
  Clock,
  Warehouse,
  Check,
  Share2,
  Sparkles,
  Zap,
  Info
} from 'lucide-react';
import { 
  getApartmentUnits, 
  addApartmentVehicle, 
  removeApartmentVehicle, 
  ApartmentVehicle,
  ApartmentUnit 
} from '@/lib/apartmentStore';
import { DEMO_USERS } from '@/lib/dataStore';
import { useLanguage } from '@/lib/languageContext';

interface RegisteredVehicleWithUnit extends ApartmentVehicle {
  aptCode: string;
  ownerName: string;
  floor: number;
}

export interface ParkingWaitlistEntry {
  id: string;
  aptCode: string;
  ownerName: string;
  floor: number;
  vehicleType: 'CAR' | 'MOTORBIKE';
  plate: string;
  brand: string;
  requestedZone: 'FIXED_B2' | 'FLOATING_B2' | 'SOLARI_HUB';
  requestDate: string;
  status: 'PENDING' | 'APPROVED';
}

const WAITLIST_STORAGE_KEY = 'skyline_parking_waitlist_v4';



export default function SmartParking() {
  const { isEn } = useLanguage();

  // Apartment Data & Registered Vehicles
  const [apartments, setApartments] = useState<ApartmentUnit[]>([]);
  const [activeMainTab, setActiveMainTab] = useState<'MATRIX' | 'REGISTRY' | 'WAITLIST'>('MATRIX');
  const [searchPlate, setSearchPlate] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'CAR' | 'MOTORBIKE'>('ALL');
  const [selectedFloorMap, setSelectedFloorMap] = useState<'B2_FIXED' | 'B2_FLOATING' | 'B1_MOTO' | 'SOLARI_HUB'>('B2_FIXED');

  // Selected Slot for detail panel
  const [selectedSlotCode, setSelectedSlotCode] = useState<string | null>(null);

  // Waitlist Queue State
  const [waitlist, setWaitlist] = useState<ParkingWaitlistEntry[]>([]);

  // Modal State for New Vehicle Registration
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [regAptCode, setRegAptCode] = useState('');
  const [regType, setRegType] = useState<'CAR' | 'MOTORBIKE'>('CAR');
  const [regPlate, setRegPlate] = useState('');
  const [regBrand, setRegBrand] = useState('');
  const [regTargetZone, setRegTargetZone] = useState<'FIXED_B2' | 'FLOATING_B2' | 'SOLARI_HUB'>('FIXED_B2');
  const [regCustomSlot, setRegCustomSlot] = useState('');
  const [regActionType, setRegActionType] = useState<'DIRECT_ISSUE' | 'WAITLIST'>('DIRECT_ISSUE');
  const [regFormError, setRegFormError] = useState('');
  const [regSuccessMsg, setRegSuccessMsg] = useState('');

  // Selected declared vehicle index when apartment has multiple declared vehicles
  const [selectedVehicleIdx, setSelectedVehicleIdx] = useState<number>(0);

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

    try {
      const rawWait = localStorage.getItem(WAITLIST_STORAGE_KEY);
      if (rawWait) {
        const parsed = JSON.parse(rawWait);
        if (Array.isArray(parsed)) setWaitlist(parsed);
      }
    } catch (e) {
      console.warn('Load parking waitlist error:', e);
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

  // Operational Multi-Hub Capacity Specs
  const B2_FIXED_CAR_SLOTS = 60; // Hầm B2 Zone A: Ô cố định VIP
  const B2_FLOATING_CAR_SLOTS = 90; // Hầm B2 Zone B: Ô đỗ tự do
  const TOTAL_B2_CAR_SLOTS = B2_FIXED_CAR_SLOTS + B2_FLOATING_CAR_SLOTS; // 150 ô nội khu

  const SOLARI_HUB_CAR_SLOTS = 650; // Nhà xe cao tầng Beverly Solari
  const TOTAL_EXPANDED_CAR_CAPACITY = TOTAL_B2_CAR_SLOTS + SOLARI_HUB_CAR_SLOTS; // 800 chỗ ô tô (> 1.1 ô tô/căn)

  const MAX_MOTO_SLOTS = 850; // Hầm B1: 850 xe máy (~1.2 xe/căn hộ)

  const CAR_MONTHLY_FEE = 1200000;
  const MOTO_MONTHLY_FEE = 120000;

  const registeredCars = registeredVehicles.filter(v => v.type === 'CAR').length;
  const registeredMotos = registeredVehicles.filter(v => v.type === 'MOTORBIKE').length;

  const carOccupancyPct = Math.min(100, Math.round((registeredCars / TOTAL_B2_CAR_SLOTS) * 100));
  const motoOccupancyPct = Math.min(100, Math.round((registeredMotos / MAX_MOTO_SLOTS) * 100));

  const totalMonthlyRevenue = (registeredCars * CAR_MONTHLY_FEE) + (registeredMotos * MOTO_MONTHLY_FEE);

  // Generate Slot Matrices for Multi-Hub Spatial Mapping
  // 1. Hầm B2 Zone A: Ô Đỗ Cố Định (B2-A01 đến B2-A24)
  const b2FixedSlots = useMemo(() => {
    const slots = [];
    for (let i = 1; i <= 24; i++) {
      const code = `B2-A${String(i).padStart(2, '0')}`;
      const assigned = registeredVehicles.find(v => v.type === 'CAR' && v.slot === code);
      slots.push({ code, zone: 'Zone A (Cố Định VIP)', type: 'CAR' as const, assigned, category: 'FIXED' });
    }
    return slots;
  }, [registeredVehicles]);

  // 2. Hầm B2 Zone B: Ô Đỗ Tự Do Chia Sẻ (B2-B01 đến B2-B24)
  const b2FloatingSlots = useMemo(() => {
    const slots = [];
    for (let i = 1; i <= 24; i++) {
      const code = `B2-B${String(i).padStart(2, '0')}`;
      const assigned = registeredVehicles.find(v => v.type === 'CAR' && v.slot === code);
      slots.push({ code, zone: 'Zone B (Tự Do Luân Phiên)', type: 'CAR' as const, assigned, category: 'FLOATING' });
    }
    return slots;
  }, [registeredVehicles]);

  // 3. Hầm B1: Xe Máy (B1-M01 đến B1-M32)
  const b1Slots = useMemo(() => {
    const slots = [];
    for (let i = 1; i <= 32; i++) {
      const code = `B1-M${String(i).padStart(2, '0')}`;
      const assigned = registeredVehicles.find(v => v.type === 'MOTORBIKE' && v.slot === code);
      slots.push({ code, zone: 'Hầm B1 Xe Máy', type: 'MOTORBIKE' as const, assigned, category: 'MOTO' });
    }
    return slots;
  }, [registeredVehicles]);

  // 4. Nhà Xe Thông Minh Beverly Solari Hub (HUB-01 đến HUB-24)
  const solariHubSlots = useMemo(() => {
    const slots = [];
    for (let i = 1; i <= 24; i++) {
      const code = `HUB-${String(i).padStart(2, '0')}`;
      const assigned = registeredVehicles.find(v => v.type === 'CAR' && v.slot === code);
      slots.push({ code, zone: 'Nhà Xe Thông Minh Beverly Solari', type: 'CAR' as const, assigned, category: 'HUB' });
    }
    return slots;
  }, [registeredVehicles]);

  // Selected slot detail
  const currentSlotDetail = useMemo(() => {
    if (!selectedSlotCode) return null;
    const allSlots = [...b2FixedSlots, ...b2FloatingSlots, ...b1Slots, ...solariHubSlots];
    return allSlots.find(s => s.code === selectedSlotCode) || null;
  }, [selectedSlotCode, b2FixedSlots, b2FloatingSlots, b1Slots, solariHubSlots]);

  const saveWaitlistState = (newList: ParkingWaitlistEntry[]) => {
    setWaitlist(newList);
    try {
      localStorage.setItem(WAITLIST_STORAGE_KEY, JSON.stringify(newList));
    } catch {}
  };

  const activeApartmentUnit = useMemo(() => {
    return apartments.find(a => a.code === regAptCode) || null;
  }, [regAptCode, apartments]);

  const hasResident = useMemo(() => {
    return Boolean(
      activeApartmentUnit?.owner?.name || 
      activeApartmentUnit?.status === 'OCCUPIED' || 
      (activeApartmentUnit?.members && activeApartmentUnit.members.length > 0)
    );
  }, [activeApartmentUnit]);

  // Genuinely declared resident vehicles from NKS API / Apartment Store
  const detectedResidentVehicles = useMemo(() => {
    if (!regAptCode || !activeApartmentUnit || !hasResident) return [];

    const list: Array<{
      plate: string;
      brand: string;
      type: 'CAR' | 'MOTORBIKE';
      cardNo?: string;
      slot?: string;
      source: string;
    }> = [];

    const seenPlates = new Set<string>();

    // 1. Existing vehicles on the apartment unit (from NKS API / Apartment Store)
    if (activeApartmentUnit.vehicles && activeApartmentUnit.vehicles.length > 0) {
      activeApartmentUnit.vehicles.forEach(v => {
        const clean = v.plate.trim().toUpperCase();
        if (clean && !seenPlates.has(clean)) {
          seenPlates.add(clean);
          list.push({
            plate: clean,
            brand: v.brand || (v.type === 'CAR' ? 'Sedan / SUV' : 'Xe máy'),
            type: v.type === 'CAR' ? 'CAR' : 'MOTORBIKE',
            cardNo: v.cardNo,
            slot: v.slot,
            source: isEn ? 'Registered Vehicle' : 'Hồ sơ xe căn hộ',
          });
        }
      });
    }

    // 2. Family members with declared license plate (from NKS API / Apartment Store)
    if (activeApartmentUnit.members && activeApartmentUnit.members.length > 0) {
      activeApartmentUnit.members.forEach(m => {
        if (m.licensePlate) {
          const clean = m.licensePlate.trim().toUpperCase();
          if (clean && !seenPlates.has(clean)) {
            seenPlates.add(clean);
            list.push({
              plate: clean,
              brand: isEn ? 'Member Vehicle' : 'Xe thành viên',
              type: 'MOTORBIKE',
              source: `${isEn ? 'Member' : 'Thành viên'}: ${m.fullName}`,
            });
          }
        }
      });
    }

    return list;
  }, [regAptCode, activeApartmentUnit, hasResident, isEn]);

  // ZERO-CLICK AUTO-DETECTION:
  // When apartment changes, auto-load genuinely declared vehicle (if any).
  // If apartment is vacant or resident has no vehicle, clear inputs and DO NOT invent fake plates!
  useEffect(() => {
    if (!regAptCode) return;

    if (!hasResident) {
      setRegPlate('');
      setRegBrand('');
      setRegCustomSlot('');
      setSelectedVehicleIdx(0);
      return;
    }

    if (detectedResidentVehicles.length > 0) {
      const target = detectedResidentVehicles[selectedVehicleIdx] || detectedResidentVehicles[0];
      setRegPlate(target.plate);
      setRegBrand(target.brand);
      setRegType(target.type);
    } else {
      // Resident has no vehicle declared! DO NOT make up fake plates!
      setRegPlate('');
      setRegBrand('');
      setRegCustomSlot('');
      setSelectedVehicleIdx(0);
    }
  }, [regAptCode, hasResident, detectedResidentVehicles, selectedVehicleIdx]);

  // AI SPATIAL AUTO-ALLOCATION (Zero-Click):
  // When a valid plate is present, AI instantly finds the closest free slot near elevator core.
  useEffect(() => {
    if (!regPlate.trim() || !hasResident) {
      setRegCustomSlot('');
      return;
    }

    const wing = activeApartmentUnit?.wing || (regAptCode.includes('06') || regAptCode.includes('08') || regAptCode.includes('09') ? 'SOUTH' : 'NORTH');

    let suggestedSlot = '';

    if (regType === 'MOTORBIKE') {
      const free = b1Slots.find(s => !s.assigned);
      suggestedSlot = free ? free.code : (wing === 'SOUTH' ? 'B1-M08' : 'B1-M02');
    } else if (regTargetZone === 'FIXED_B2') {
      const preferred = wing === 'SOUTH' 
        ? ['B2-A06', 'B2-A07', 'B2-A08', 'B2-A05', 'B2-A09'] 
        : ['B2-A03', 'B2-A02', 'B2-A04', 'B2-A01'];
      const preferredFree = b2FixedSlots.find(s => !s.assigned && preferred.includes(s.code));
      if (preferredFree) {
        suggestedSlot = preferredFree.code;
      } else {
        const anyFree = b2FixedSlots.find(s => !s.assigned);
        suggestedSlot = anyFree ? anyFree.code : (wing === 'SOUTH' ? 'B2-A06' : 'B2-A03');
      }
    } else if (regTargetZone === 'FLOATING_B2') {
      const preferred = wing === 'SOUTH' 
        ? ['B2-B08', 'B2-B07', 'B2-B09', 'B2-B06'] 
        : ['B2-B04', 'B2-B03', 'B2-B05', 'B2-B02'];
      const preferredFree = b2FloatingSlots.find(s => !s.assigned && preferred.includes(s.code));
      if (preferredFree) {
        suggestedSlot = preferredFree.code;
      } else {
        const anyFree = b2FloatingSlots.find(s => !s.assigned);
        suggestedSlot = anyFree ? anyFree.code : (wing === 'SOUTH' ? 'B2-B08' : 'B2-B04');
      }
    } else {
      const anyFree = solariHubSlots.find(s => !s.assigned);
      suggestedSlot = anyFree ? anyFree.code : 'HUB-08';
    }

    setRegCustomSlot(suggestedSlot);
  }, [regPlate, regType, regTargetZone, activeApartmentUnit, regAptCode, hasResident, b1Slots, b2FixedSlots, b2FloatingSlots, solariHubSlots]);

  // Handler: Register New Vehicle or Enqueue to Waitlist
  const handleRegisterVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    setRegFormError('');
    setRegSuccessMsg('');

    if (!regAptCode) {
      setRegFormError(isEn ? 'Please select an apartment' : 'Vui lòng chọn căn hộ');
      return;
    }

    if (!hasResident) {
      setRegFormError(
        isEn
          ? 'Cannot issue pass: Apartment is vacant with no registered resident.'
          : 'Không thể cấp thẻ: Căn hộ đang trống, chưa có cư dân nhận bàn giao.'
      );
      return;
    }

    if (!regPlate.trim()) {
      setRegFormError(
        isEn
          ? 'Please enter or select a vehicle license plate'
          : 'Vui lòng nhập hoặc chọn biển số xe cần cấp thẻ'
      );
      return;
    }

    const cleanNew = regPlate.trim().toUpperCase().replace(/[-.\s]/g, '');
    const existsOther = registeredVehicles.some(
      v => v.plate.toUpperCase().replace(/[-.\s]/g, '') === cleanNew && v.aptCode !== regAptCode
    );
    if (existsOther) {
      setRegFormError(isEn ? 'This plate number is already registered to another apartment' : 'Biển số này đã được đăng ký cho căn hộ khác trong hệ thống');
      return;
    }

    const apt = apartments.find(a => a.code === regAptCode);

    // If enqueuing to Waitlist
    if (regActionType === 'WAITLIST') {
      const newWaitEntry: ParkingWaitlistEntry = {
        id: `wait-${Date.now()}`,
        aptCode: regAptCode,
        ownerName: apt?.owner?.name || (isEn ? 'Resident' : 'Cư dân căn hộ'),
        floor: apt?.floor || 1,
        vehicleType: regType,
        plate: regPlate.trim().toUpperCase(),
        brand: regBrand.trim() || (regType === 'CAR' ? 'Sedan / SUV' : 'Xe máy'),
        requestedZone: regTargetZone,
        requestDate: new Date().toLocaleDateString('vi-VN'),
        status: 'PENDING',
      };

      saveWaitlistState([...waitlist, newWaitEntry]);
      setRegSuccessMsg(
        isEn
          ? `Added vehicle ${newWaitEntry.plate} to Waitlist Queue (#${waitlist.length + 1})`
          : `Đã đưa phương tiện ${newWaitEntry.plate} vào Hàng đợi xét duyệt (#${waitlist.length + 1})`
      );
      setRegPlate('');
      setRegBrand('');
      setTimeout(() => {
        setIsRegisterModalOpen(false);
        setRegSuccessMsg('');
      }, 1400);
      return;
    }

    // Direct issue slot with AI allocated code
    const slotCode = regCustomSlot.trim() || (regType === 'CAR' ? 'B2-A06' : 'B1-M08');
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
          ? `Vehicle ${newVehicle.plate} successfully assigned to Unit ${regAptCode} (Slot ${slotCode})`
          : `Đã cấp thẻ thành công xe ${newVehicle.plate} cho Căn ${regAptCode} (Vị trí ${slotCode})`
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

  // Handler: Approve Waitlist Item directly to slot
  const handleApproveWaitlistEntry = (entry: ParkingWaitlistEntry, targetSlotCode: string) => {
    const newVehicle: ApartmentVehicle = {
      id: `veh-${Date.now()}`,
      type: entry.vehicleType,
      plate: entry.plate,
      brand: entry.brand,
      cardNo: `RFID-${entry.aptCode}-${Math.floor(1000 + Math.random() * 9000)}`,
      slot: targetSlotCode,
    };

    const ok = addApartmentVehicle(entry.aptCode, newVehicle);
    if (ok) {
      const refreshed = getApartmentUnits();
      setApartments(refreshed);
      saveWaitlistState(waitlist.filter(w => w.id !== entry.id));
    }
  };

  // Handler: Remove Waitlist Entry
  const handleRemoveWaitlistEntry = (id: string) => {
    saveWaitlistState(waitlist.filter(w => w.id !== id));
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
            {isEn ? 'MULTI-HUB PARKING & QUOTA BALANCING • THE BEVERLY SOLARI' : 'HỆ THỐNG ĐIỀU PHỐI ĐỖ XE ĐA TẦNG HẦM & LIÊN KHU • TÒA NHÀ THE TROPICAL'}
          </div>
          <h2 className="font-serif text-xl sm:text-2xl text-white font-bold mt-1">
            {isEn ? 'Parking Infrastructure & Resident Quota Management' : 'Quản Lý Bãi Đỗ Xe & Điều Phối Hạn Mức Tòa Nhà'}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setRegCustomSlot('');
              setRegActionType('DIRECT_ISSUE');
              setIsRegisterModalOpen(true);
            }}
            className="px-4 py-2 bg-[#C5A880] hover:bg-[#E2C9A5] text-[#0A0E14] text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors rounded-none"
          >
            <Plus className="w-3.5 h-3.5" />
            {isEn ? 'Issue Pass / Register' : 'Cấp Thẻ / Đăng Ký Ô Đỗ'}
          </button>
        </div>
      </div>

      {/* 2. Top Multi-Hub KPI Cards (Pixel-Perfect Alignment across all 4 cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Hầm B2 Ô Tô Nội Khu */}
        <div className="p-4 bg-[#121820] border border-[#222B35] h-[156px] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs gap-2">
            <span className="uppercase tracking-wider font-semibold flex items-center gap-1.5 text-gray-300 truncate">
              <Car className="w-4 h-4 text-[#C5A880] shrink-0" />
              <span className="truncate">Hầm B2 Ô Tô (Nội Khu)</span>
            </span>
            <span className="font-mono text-xs font-bold text-emerald-400 shrink-0 whitespace-nowrap px-1.5 py-0.5 bg-[#161B22] border border-[#2D3748]">
              {carOccupancyPct}%
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-2">
            <div className="font-mono text-xl font-bold text-white">
              {registeredCars} <span className="text-xs text-gray-500 font-normal">/ {TOTAL_B2_CAR_SLOTS} chỗ</span>
            </div>
            <span className="text-[11px] font-mono text-gray-400 shrink-0">
              Trống: <strong className="text-white">{Math.max(0, TOTAL_B2_CAR_SLOTS - registeredCars)}</strong>
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

          <div className="text-[10px] text-gray-400 font-mono flex justify-between items-center gap-2 border-t border-[#1C2533] pt-2">
            <span className="truncate">60 VIP Cố Định</span>
            <span className="truncate shrink-0 text-right">90 Đỗ Tự Do</span>
          </div>
        </div>

        {/* KPI 2: Nhà Xe Thông Minh Beverly Solari Hub */}
        <div className="p-4 bg-[#121820] border border-[#222B35] h-[156px] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs gap-2">
            <span className="uppercase tracking-wider font-semibold flex items-center gap-1.5 text-gray-300 truncate">
              <Warehouse className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="truncate">Nhà Xe Solari Hub</span>
            </span>
            <span className="font-mono text-xs font-bold text-amber-300 shrink-0 whitespace-nowrap px-1.5 py-0.5 bg-amber-950/40 border border-amber-500/40">
              MỞ RỘNG
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-2">
            <div className="font-mono text-xl font-bold text-white">
              {SOLARI_HUB_CAR_SLOTS} <span className="text-xs text-gray-500 font-normal">chỗ bổ sung</span>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 shrink-0">
              Toàn khu: <strong className="text-white">{TOTAL_EXPANDED_CAR_CAPACITY} ô</strong>
            </span>
          </div>

          <div className="w-full h-1.5 bg-[#0A0E14] border border-[#222B35] overflow-hidden">
            <div
              className="h-full bg-amber-500 transition-all duration-500"
              style={{ width: '15%' }}
            />
          </div>

          <div className="text-[10px] text-gray-400 font-mono flex justify-between items-center gap-2 border-t border-[#1C2533] pt-2">
            <span className="truncate">Nhà xe cao tầng liên tòa</span>
            <span className="truncate shrink-0 text-emerald-400 text-right">Sẵn sàng điều phối</span>
          </div>
        </div>

        {/* KPI 3: Hầm B1 Xe Máy */}
        <div className="p-4 bg-[#121820] border border-[#222B35] h-[156px] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs gap-2">
            <span className="uppercase tracking-wider font-semibold flex items-center gap-1.5 text-gray-300 truncate">
              <Bike className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="truncate">Xe Máy (Hầm B1)</span>
            </span>
            <span className="font-mono text-xs font-bold text-cyan-400 shrink-0 whitespace-nowrap px-1.5 py-0.5 bg-[#161B22] border border-[#2D3748]">
              {motoOccupancyPct}%
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-2">
            <div className="font-mono text-xl font-bold text-white">
              {registeredMotos} <span className="text-xs text-gray-500 font-normal">/ {MAX_MOTO_SLOTS} xe</span>
            </div>
            <span className="text-[11px] font-mono text-gray-400 shrink-0">
              Còn nhận: <strong className="text-white">{MAX_MOTO_SLOTS - registeredMotos}</strong>
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

          <div className="text-[10px] text-gray-400 font-mono flex justify-between items-center gap-2 border-t border-[#1C2533] pt-2">
            <span className="truncate">120.000 đ/tháng/xe</span>
            <span className="truncate shrink-0 text-right">Định mức: 1.2 xe/căn</span>
          </div>
        </div>

        {/* KPI 4: Hàng Đợi Danh Sách Chờ */}
        <div className="p-4 bg-[#121820] border border-[#222B35] h-[156px] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs gap-2">
            <span className="uppercase tracking-wider font-semibold flex items-center gap-1.5 text-gray-300 truncate">
              <Clock className="w-4 h-4 text-[#C5A880] shrink-0" />
              <span className="truncate">Hàng Đợi Xét Duyệt</span>
            </span>
            <span className="font-mono text-xs font-bold text-emerald-400 shrink-0 whitespace-nowrap px-1.5 py-0.5 bg-emerald-950/40 border border-emerald-500/40">
              {waitlist.length} HỒ SƠ
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-2">
            <div className="font-mono text-xl font-bold text-white">
              {totalMonthlyRevenue.toLocaleString('vi-VN')} <span className="text-xs text-gray-500 font-normal">đ</span>
            </div>
            <span className="text-[11px] font-mono text-gray-400 shrink-0">
              Thu tháng này
            </span>
          </div>

          <div className="w-full h-1.5 bg-[#0A0E14] border border-[#222B35] overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: '100%' }}
            />
          </div>

          <div className="text-[10px] text-gray-400 font-mono flex justify-between items-center gap-2 border-t border-[#1C2533] pt-2">
            <span className="truncate">AI Tự Động Nâng Hạng</span>
            <button
              type="button"
              onClick={() => setActiveMainTab('WAITLIST')}
              className="truncate shrink-0 text-[#C5A880] hover:underline text-right"
            >
              Xem hàng đợi →
            </button>
          </div>
        </div>
      </div>

      {/* 3. Main Navigation Tabs (3 Clean Essential Tabs: Matrix, Registry, Waitlist) */}
      <div className="border-b border-[#222B35] flex items-center gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveMainTab('MATRIX')}
          className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider font-mono flex items-center gap-2 border-b-2 transition-all rounded-none whitespace-nowrap ${
            activeMainTab === 'MATRIX'
              ? 'border-[#C5A880] text-white bg-[#121820]'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5 text-[#C5A880]" />
          Sơ Đồ Phân Bổ Không Gian Ô Đỗ
        </button>

        <button
          type="button"
          onClick={() => setActiveMainTab('REGISTRY')}
          className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider font-mono flex items-center gap-2 border-b-2 transition-all rounded-none whitespace-nowrap ${
            activeMainTab === 'REGISTRY'
              ? 'border-[#C5A880] text-white bg-[#121820]'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Car className="w-3.5 h-3.5 text-[#C5A880]" />
          Danh Sách Xe Đã Cấp Thẻ ({filteredVehicles.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveMainTab('WAITLIST')}
          className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider font-mono flex items-center gap-2 border-b-2 transition-all rounded-none whitespace-nowrap ${
            activeMainTab === 'WAITLIST'
              ? 'border-[#C5A880] text-white bg-[#121820]'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          Hàng Đợi Waitlist ({waitlist.length})
        </button>
      </div>

      {/* 4. Tab 1: Interactive Spatial Slot Matrix */}
      {activeMainTab === 'MATRIX' && (
        <div className="bg-[#121820] border border-[#222B35] p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222B35] pb-3">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-[#C5A880] font-semibold flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                HỆ THỐNG PHÂN KHU HẦM B1/B2 & NHÀ XE THÔNG MINH LIÊN TÒA
              </div>
              <h3 className="font-serif text-base sm:text-lg font-bold text-white mt-0.5">
                Chọn Phân Khu Để Giám Sát Không Gian Ô Đỗ
              </h3>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setSelectedFloorMap('B2_FIXED')}
                className={`px-2.5 py-1 text-xs font-mono font-semibold uppercase tracking-wider transition-colors rounded-none flex items-center gap-1.5 ${
                  selectedFloorMap === 'B2_FIXED'
                    ? 'bg-[#C5A880] text-black font-bold'
                    : 'bg-[#161B22] text-gray-400 hover:text-white border border-[#2D3748]'
                }`}
              >
                <Car className="w-3.5 h-3.5" />
                B2: Ô Cố Định VIP
              </button>
              <button
                type="button"
                onClick={() => setSelectedFloorMap('B2_FLOATING')}
                className={`px-2.5 py-1 text-xs font-mono font-semibold uppercase tracking-wider transition-colors rounded-none flex items-center gap-1.5 ${
                  selectedFloorMap === 'B2_FLOATING'
                    ? 'bg-[#C5A880] text-black font-bold'
                    : 'bg-[#161B22] text-gray-400 hover:text-white border border-[#2D3748]'
                }`}
              >
                <Car className="w-3.5 h-3.5" />
                B2: Đỗ Tự Do
              </button>
              <button
                type="button"
                onClick={() => setSelectedFloorMap('SOLARI_HUB')}
                className={`px-2.5 py-1 text-xs font-mono font-semibold uppercase tracking-wider transition-colors rounded-none flex items-center gap-1.5 ${
                  selectedFloorMap === 'SOLARI_HUB'
                    ? 'bg-[#C5A880] text-black font-bold'
                    : 'bg-[#161B22] text-gray-400 hover:text-white border border-[#2D3748]'
                }`}
              >
                <Warehouse className="w-3.5 h-3.5" />
                Nhà Xe Solari Hub
              </button>
              <button
                type="button"
                onClick={() => setSelectedFloorMap('B1_MOTO')}
                className={`px-2.5 py-1 text-xs font-mono font-semibold uppercase tracking-wider transition-colors rounded-none flex items-center gap-1.5 ${
                  selectedFloorMap === 'B1_MOTO'
                    ? 'bg-[#C5A880] text-black font-bold'
                    : 'bg-[#161B22] text-gray-400 hover:text-white border border-[#2D3748]'
                }`}
              >
                <Bike className="w-3.5 h-3.5" />
                Hầm B1: Xe Máy
              </button>
            </div>
          </div>

          {/* Grid Layout & Inspector */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-1">
            {/* Slot Matrix (8 cols on lg) */}
            <div className="lg:col-span-8 bg-[#0E131B] border border-[#222B35] p-4">
              <div className="text-[11px] font-mono text-gray-400 mb-3 flex justify-between items-center border-b border-[#222B35] pb-2">
                <span className="text-gray-300 font-semibold uppercase">
                  {selectedFloorMap === 'B2_FIXED'
                    ? 'HẦM B2 ZONE A: Ô CỐ ĐỊNH ĐỊNH DANH VIP'
                    : selectedFloorMap === 'B2_FLOATING'
                    ? 'HẦM B2 ZONE B: KHU ĐỖ TỰ DO CHIA SẺ'
                    : selectedFloorMap === 'SOLARI_HUB'
                    ? 'NHÀ XE CAO TẦNG BEVERLY SOLARI HUB (ĐIỀU PHỐI MỞ RỘNG)'
                    : 'HẦM B1: XE MÁY CƯ DÂN TOÀN TÒA BS-07'}
                </span>
                <span className="text-[#C5A880]">24 - 32 Ô ĐẠI DIỆN</span>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
                {(
                  selectedFloorMap === 'B2_FIXED'
                    ? b2FixedSlots
                    : selectedFloorMap === 'B2_FLOATING'
                    ? b2FloatingSlots
                    : selectedFloorMap === 'SOLARI_HUB'
                    ? solariHubSlots
                    : b1Slots
                ).map((slot) => {
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
                        {slot.category}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Slot Inspector (4 cols on lg) */}
            <div className="lg:col-span-4 bg-[#0E131B] border border-[#222B35] p-4 flex flex-col justify-between">
              {currentSlotDetail ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[#222B35] pb-2">
                    <div className="text-xs uppercase tracking-wider font-semibold text-[#C5A880] flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5" />
                      Chi Tiết Ô Đỗ Đang Chọn
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
                      <span className="text-gray-400">Phân Khu:</span>
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
                        <span className="text-gray-400">Mã thẻ RFID:</span>
                        <span className="text-gray-300 font-mono">
                          {currentSlotDetail.assigned.cardNo}
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
                          Thu Hồi / Giải Phóng Ô Này
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-[#121820] border border-[#222B35] text-center space-y-3">
                      <div className="text-xs text-gray-400">
                        Ô đỗ này hiện đang trống. BQL có thể cấp trực tiếp hoặc duyệt từ hồ sơ khai báo cư dân.
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setRegCustomSlot(currentSlotDetail.code);
                          setRegType(currentSlotDetail.type);
                          setRegActionType('DIRECT_ISSUE');
                          setIsRegisterModalOpen(true);
                        }}
                        className="w-full py-2 bg-[#C5A880] hover:bg-[#E2C9A5] text-black text-xs font-semibold uppercase tracking-wider transition-colors rounded-none flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Cấp Xe Vào Ô {currentSlotDetail.code}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-2 text-gray-500">
                  <LayoutGrid className="w-8 h-8 text-gray-600" />
                  <div className="text-xs font-mono">
                    Nhấp vào một ô trên ma trận bên trái để xem chi tiết.
                  </div>
                </div>
              )}

              <div className="text-[10px] text-gray-500 font-mono text-center pt-3 border-t border-[#222B35] mt-4">
                Dữ liệu phân bổ liên kết thời gian thực với CSDL căn hộ
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Tab 2: Active Vehicle Registry Table */}
      {activeMainTab === 'REGISTRY' && (
        <div className="bg-[#121820] border border-[#222B35] p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222B35] pb-3">
            <div>
              <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
                <Car className="w-4 h-4 text-[#C5A880]" />
                Danh Sách Phương Tiện Đã Cấp Thẻ ({filteredVehicles.length} xe)
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Toàn bộ phương tiện chính thức được cấp quyền sử dụng hầm nội khu hoặc nhà xe liên khu
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm biển số, căn hộ, chủ xe..."
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
                  Tất cả
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter('CAR')}
                  className={`px-2.5 py-1 ${typeFilter === 'CAR' ? 'bg-[#C5A880] text-black font-bold' : 'text-gray-400 hover:text-white'}`}
                >
                  Ô tô
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter('MOTORBIKE')}
                  className={`px-2.5 py-1 ${typeFilter === 'MOTORBIKE' ? 'bg-[#C5A880] text-black font-bold' : 'text-gray-400 hover:text-white'}`}
                >
                  Xe máy
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-[#222B35]">
              <thead className="bg-[#161B22] text-gray-400 font-semibold uppercase tracking-wider text-[10px] border-b border-[#222B35]">
                <tr>
                  <th className="p-3">Biển Số Xe</th>
                  <th className="p-3">Phân Loại</th>
                  <th className="p-3">Hãng Xe / Model</th>
                  <th className="p-3">Căn Hộ</th>
                  <th className="p-3">Chủ Sở Hữu</th>
                  <th className="p-3">Mã Thẻ RFID</th>
                  <th className="p-3">Vị Trí Ô Đỗ</th>
                  <th className="p-3">Phí Tháng</th>
                  <th className="p-3 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1C2533]">
                {filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-gray-500 font-mono space-y-2">
                      <Car className="w-8 h-8 text-gray-600 mx-auto" />
                      <div>
                        {searchPlate.trim() 
                          ? 'Không tìm thấy phương tiện nào phù hợp với từ khóa tìm kiếm.'
                          : 'Chưa có phương tiện nào được cấp quyền trong tòa nhà. Hãy nhấn "+ Cấp Thẻ / Đăng Ký Ô Đỗ" để đăng ký.'}
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
                          {veh.type === 'CAR' ? 'Ô Tô' : 'Xe Máy'}
                        </span>
                      </td>
                      <td className="p-3 text-gray-300">
                        {veh.brand || '---'}
                      </td>
                      <td className="p-3 font-mono font-semibold text-white">
                        Căn {veh.aptCode} (Tầng {veh.floor})
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
                                setActiveMainTab('MATRIX');
                                setSelectedSlotCode(veh.slot);
                              }
                            }}
                            className="px-2.5 py-1 bg-[#1C2533] hover:bg-[#C5A880] hover:text-black text-gray-300 border border-gray-700 text-[11px] font-semibold transition-all rounded-none"
                            title="Xem Ô Đỗ"
                          >
                            Vị Trí
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRevokeVehicle(veh.aptCode, veh.id, veh.plate)}
                            className="p-1 text-gray-400 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-500/50 transition-colors rounded-none"
                            title="Thu Hồi / Xóa Thẻ Xe"
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
      )}

      {/* 6. Tab 3: Waitlist & Quota Overflow Queue */}
      {activeMainTab === 'WAITLIST' && (
        <div className="bg-[#121820] border border-[#222B35] p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222B35] pb-3">
            <div>
              <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                Hàng Đợi Danh Sách Chờ Xét Duyệt Ô Đỗ ({waitlist.length} hồ sơ)
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Cơ chế điều phối xếp hàng thông minh: Tự động nâng thứ tự ưu tiên khi có căn hộ trả chỗ hoặc điều phối sang nhà xe liên khu
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setRegActionType('WAITLIST');
                setIsRegisterModalOpen(true);
              }}
              className="px-3.5 py-1.5 bg-[#161B22] border border-amber-500/50 hover:border-amber-400 text-amber-300 text-xs font-mono font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors rounded-none"
            >
              <Plus className="w-3.5 h-3.5" />
              + Thêm Đơn Vào Hàng Đợi
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-[#222B35]">
              <thead className="bg-[#161B22] text-gray-400 font-semibold uppercase tracking-wider text-[10px] border-b border-[#222B35]">
                <tr>
                  <th className="p-3">Hạng Ưu Tiên</th>
                  <th className="p-3">Căn Hộ</th>
                  <th className="p-3">Chủ Sở Hữu</th>
                  <th className="p-3">Biển Số Xe</th>
                  <th className="p-3">Dòng Xe</th>
                  <th className="p-3">Nhu Cầu Đỗ</th>
                  <th className="p-3">Ngày Nộp Đơn</th>
                  <th className="p-3 text-right">Điều Phối / Duyệt Cấp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1C2533]">
                {waitlist.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-500 font-mono space-y-2">
                      <Clock className="w-8 h-8 text-gray-600 mx-auto" />
                      <div>
                        Hiện không có hồ sơ nào trong danh sách chờ. Sức chứa tầng hầm và bãi xe liên tòa đang đáp ứng tốt nhu cầu cư dân.
                      </div>
                    </td>
                  </tr>
                ) : (
                  waitlist.map((item, index) => (
                    <tr key={item.id} className="hover:bg-[#161F2E]/60 transition-colors">
                      <td className="p-3 font-mono">
                        <span className="px-2 py-0.5 bg-amber-950/60 border border-amber-500/50 text-amber-300 font-bold text-xs">
                          #{index + 1}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold text-white">
                        Căn {item.aptCode} (Tầng {item.floor})
                      </td>
                      <td className="p-3 text-gray-300">
                        {item.ownerName}
                      </td>
                      <td className="p-3 font-mono font-bold text-[#C5A880]">
                        {item.plate}
                      </td>
                      <td className="p-3 text-gray-300">
                        {item.brand}
                      </td>
                      <td className="p-3 font-mono text-[11px] text-gray-300">
                        {item.requestedZone === 'FIXED_B2' ? (
                          <span className="text-[#C5A880]">Ô Cố Định Hầm B2</span>
                        ) : item.requestedZone === 'FLOATING_B2' ? (
                          <span className="text-cyan-300">Ô Tự Do Hầm B2</span>
                        ) : (
                          <span className="text-amber-300">Nhà Xe Solari Hub</span>
                        )}
                      </td>
                      <td className="p-3 font-mono text-gray-400">
                        {item.requestDate}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const slot = item.requestedZone === 'FIXED_B2' ? 'B2-A08' : item.requestedZone === 'FLOATING_B2' ? 'B2-B12' : 'HUB-15';
                              handleApproveWaitlistEntry(item, slot);
                            }}
                            className="px-2.5 py-1 bg-emerald-950/50 hover:bg-emerald-900 border border-emerald-500/60 text-emerald-300 text-[11px] font-mono font-semibold transition-colors rounded-none flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            Duyệt Cấp Slot
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveWaitlistEntry(item.id)}
                            className="p-1 text-gray-400 hover:text-rose-400 transition-colors"
                            title="Xóa khỏi hàng đợi"
                          >
                            <X className="w-3.5 h-3.5" />
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
      )}

      {/* 7. Modal: Cấp Thẻ & Điều Phối Ô Đỗ Xe */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-[#0E131B] border border-[#C5A880]/50 p-6 space-y-5 text-gray-200 rounded-none shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#222B35] pb-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-[#C5A880] font-semibold">
                  {isEn ? 'PARKING PASS ISSUANCE & AUTO ALLOCATION' : 'CẤP THẺ XE & ĐIỀU PHỐI Ô ĐỖ THÔNG MINH'}
                </div>
                <h3 className="font-serif text-lg font-bold text-white mt-0.5">
                  {regActionType === 'WAITLIST' 
                    ? (isEn ? 'Enqueue to Parking Waitlist' : 'Đưa Vào Hàng Đợi Xét Duyệt (Waitlist)') 
                    : (isEn ? 'Issue Parking Pass & Assign Slot' : 'Cấp Thẻ & Điều Phối Vị Trí Đỗ Xe')}
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

            {/* Error & Success Alerts */}
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
                <label className="block text-gray-300 uppercase tracking-wider font-semibold mb-1.5 text-xs">
                  {isEn ? 'Select Apartment Unit *' : 'Chọn Căn Hộ Cư Dân *'}
                </label>
                <select
                  value={regAptCode}
                  onChange={(e) => {
                    setRegAptCode(e.target.value);
                    setSelectedVehicleIdx(0);
                  }}
                  className="w-full px-3 py-2.5 bg-[#161B22] border border-[#2D3748] text-white focus:outline-none focus:border-[#C5A880] rounded-none font-mono text-xs font-bold"
                  required
                >
                  {apartments.map((apt) => (
                    <option key={apt.code} value={apt.code}>
                      Căn {apt.code} - Tầng {apt.floor} {apt.owner?.name ? `(${apt.owner.name})` : '(Đang trống)'}
                    </option>
                  ))}
                </select>

                {/* Resident & Vehicle Status Indicator */}
                <div className="mt-1.5 font-mono text-[11px]">
                  {!hasResident ? (
                    <span className="text-amber-400 flex items-center gap-1.5">
                      ⚠️ {isEn ? 'Unit is currently vacant — No registered resident.' : 'Căn hộ đang trống — Chưa có cư dân nhận bàn giao.'}
                    </span>
                  ) : detectedResidentVehicles.length === 0 ? (
                    <span className="text-gray-400 flex items-center gap-1.5">
                      ℹ️ {isEn ? 'Owner' : 'Chủ hộ'}: <strong className="text-gray-200">{activeApartmentUnit?.owner?.name}</strong> • {isEn ? 'No vehicles declared in resident profile.' : 'Chưa có phương tiện nào trong hồ sơ cư dân.'}
                    </span>
                  ) : (
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      ✓ {isEn ? 'Owner' : 'Chủ hộ'}: <strong className="text-white">{activeApartmentUnit?.owner?.name}</strong> • {isEn ? `Identified ${detectedResidentVehicles.length} declared vehicle(s)` : `Đã nhận diện ${detectedResidentVehicles.length} phương tiện khai báo`}
                    </span>
                  )}
                </div>
              </div>

              {/* Declared Vehicles Quick Selector (when resident has multiple declared vehicles) */}
              {hasResident && detectedResidentVehicles.length > 1 && (
                <div>
                  <label className="block text-gray-400 uppercase tracking-wider font-semibold mb-1.5 text-xs">
                    {isEn ? 'Select Declared Vehicle' : 'Chọn Phương Tiện Khai Báo Của Cư Dân'}
                  </label>
                  <div className="space-y-1.5">
                    {detectedResidentVehicles.map((veh, idx) => (
                      <button
                        key={veh.plate}
                        type="button"
                        onClick={() => {
                          setSelectedVehicleIdx(idx);
                          setRegPlate(veh.plate);
                          setRegBrand(veh.brand);
                          setRegType(veh.type);
                        }}
                        className={`w-full p-2 text-left border flex items-center justify-between font-mono text-xs transition-colors rounded-none ${
                          selectedVehicleIdx === idx
                            ? 'border-[#C5A880] bg-[#C5A880]/15 text-white'
                            : 'border-[#222B35] bg-[#121820] text-gray-400 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {veh.type === 'CAR' ? <Car className="w-3.5 h-3.5 text-[#C5A880]" /> : <Bike className="w-3.5 h-3.5 text-cyan-400" />}
                          <span className="font-bold text-white tracking-wider">{veh.plate}</span>
                          <span className="text-gray-400 font-sans text-[11px]">({veh.brand})</span>
                        </div>
                        <span className="text-[10px] text-gray-400">
                          {veh.cardNo ? `Thẻ: ${veh.cardNo} (Ô ${veh.slot || 'N/A'})` : veh.source}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Vehicle Classification */}
              <div>
                <label className="block text-gray-400 uppercase tracking-wider font-semibold mb-1.5 text-xs">
                  {isEn ? 'Vehicle Type' : 'Phân Loại Phương Tiện'}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRegType('CAR')}
                    className={`py-2 px-3 border text-left flex items-center gap-2 rounded-none transition-colors ${
                      regType === 'CAR'
                        ? 'border-[#C5A880] bg-[#C5A880]/15 text-white shadow-[0_0_10px_rgba(197,168,128,0.15)]'
                        : 'border-[#2D3748] bg-[#161B22] text-gray-500'
                    }`}
                  >
                    <Car className="w-4 h-4 text-[#C5A880]" />
                    <div>
                      <div className="font-bold">{isEn ? 'Car' : 'Ô Tô'}</div>
                      <div className="text-[10px] text-gray-400 font-mono">1.200.000 đ/tháng</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegType('MOTORBIKE')}
                    className={`py-2 px-3 border text-left flex items-center gap-2 rounded-none transition-colors ${
                      regType === 'MOTORBIKE'
                        ? 'border-cyan-400 bg-cyan-950/25 text-white shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                        : 'border-[#2D3748] bg-[#161B22] text-gray-500'
                    }`}
                  >
                    <Bike className="w-4 h-4 text-cyan-400" />
                    <div>
                      <div className="font-bold">{isEn ? 'Motorbike (B1)' : 'Xe Máy (Hầm B1)'}</div>
                      <div className="text-[10px] text-gray-400 font-mono">120.000 đ/tháng</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Target Zone Selection (For Car) */}
              {regType === 'CAR' && (
                <div>
                  <label className="block text-gray-400 uppercase tracking-wider font-semibold mb-1.5 text-xs">
                    {isEn ? 'Parking Zone' : 'Phân Khu Điều Phối Ô Đỗ'}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setRegTargetZone('FIXED_B2')}
                      className={`p-2 border text-left rounded-none font-mono text-[11px] transition-colors ${
                        regTargetZone === 'FIXED_B2'
                          ? 'border-[#C5A880] bg-[#C5A880]/15 text-white'
                          : 'border-[#2D3748] bg-[#161B22] text-gray-400 hover:text-white'
                      }`}
                    >
                      <div className="font-bold">Hầm B2 Cố Định</div>
                      <div className="text-[9px] text-gray-400">Zone A VIP</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegTargetZone('FLOATING_B2')}
                      className={`p-2 border text-left rounded-none font-mono text-[11px] transition-colors ${
                        regTargetZone === 'FLOATING_B2'
                          ? 'border-[#C5A880] bg-[#C5A880]/15 text-white'
                          : 'border-[#2D3748] bg-[#161B22] text-gray-400 hover:text-white'
                      }`}
                    >
                      <div className="font-bold">Hầm B2 Tự Do</div>
                      <div className="text-[9px] text-gray-400">Zone B Luân Phiên</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegTargetZone('SOLARI_HUB')}
                      className={`p-2 border text-left rounded-none font-mono text-[11px] transition-colors ${
                        regTargetZone === 'SOLARI_HUB'
                          ? 'border-amber-400 bg-amber-950/25 text-white'
                          : 'border-[#2D3748] bg-[#161B22] text-gray-400 hover:text-white'
                      }`}
                    >
                      <div className="font-bold">Solari Hub</div>
                      <div className="text-[9px] text-amber-400">Nhà Xe Liên Tòa</div>
                    </button>
                  </div>
                </div>
              )}

              {/* License Plate & Brand */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 uppercase tracking-wider font-semibold mb-1.5 text-xs">
                    {isEn ? 'License Plate *' : 'Biển Số Xe *'}
                  </label>
                  <input
                    type="text"
                    placeholder={isEn ? 'e.g. 51K-889.99' : 'VD: 51K-889.99'}
                    value={regPlate}
                    onChange={(e) => setRegPlate(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-[#161B22] border border-[#2D3748] text-[#C5A880] font-mono font-bold focus:outline-none focus:border-[#C5A880] rounded-none tracking-wider text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-400 uppercase tracking-wider font-semibold mb-1.5 text-xs">
                    {isEn ? 'Brand / Model' : 'Hãng Xe / Dòng Xe'}
                  </label>
                  <input
                    type="text"
                    placeholder={isEn ? 'e.g. Mercedes-Benz, Honda...' : 'VD: Mercedes-Benz, Honda...'}
                    value={regBrand}
                    onChange={(e) => setRegBrand(e.target.value)}
                    className="w-full px-3 py-2 bg-[#161B22] border border-[#2D3748] text-white font-mono focus:outline-none focus:border-[#C5A880] rounded-none text-xs"
                  />
                </div>
              </div>

              {/* Allocated Slot */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-gray-400 uppercase tracking-wider font-semibold text-xs">
                    {isEn ? 'Allocated Parking Slot' : 'Vị Trí Ô Đỗ Được Phân Bổ Tối Ưu'}
                  </label>
                  <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                    {isEn ? 'Auto-routed near elevator' : 'Tự động chọn ô gần thang máy'}
                  </span>
                </div>
                <input
                  type="text"
                  placeholder={isEn ? 'Auto-allocated when vehicle is identified...' : 'Tự động tính ô khi có thông tin xe...'}
                  value={regCustomSlot}
                  onChange={(e) => setRegCustomSlot(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-[#161B22] border border-[#C5A880]/60 text-[#C5A880] font-mono font-bold focus:outline-none focus:border-[#C5A880] rounded-none text-xs"
                />
              </div>

              {/* Action Mode Toggle */}
              <div>
                <label className="block text-gray-400 uppercase tracking-wider font-semibold mb-1.5 text-xs">
                  {isEn ? 'Allocation Method' : 'Phương Thức Phân Bổ'}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRegActionType('DIRECT_ISSUE')}
                    className={`py-2 px-3 border text-left rounded-none font-mono text-xs transition-colors ${
                      regActionType === 'DIRECT_ISSUE'
                        ? 'border-emerald-500 bg-emerald-950/25 text-white'
                        : 'border-[#2D3748] bg-[#161B22] text-gray-400'
                    }`}
                  >
                    <div className="font-bold">{isEn ? 'Direct Pass Issue' : 'Cấp Slot Ngay'}</div>
                    <div className="text-[10px] text-emerald-400">{isEn ? 'Assign slot & issue RFID' : 'Gán ô & phát thẻ RFID'}</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegActionType('WAITLIST')}
                    className={`py-2 px-3 border text-left rounded-none font-mono text-xs transition-colors ${
                      regActionType === 'WAITLIST'
                        ? 'border-amber-400 bg-amber-950/25 text-white'
                        : 'border-[#2D3748] bg-[#161B22] text-gray-400'
                    }`}
                  >
                    <div className="font-bold">{isEn ? 'Waitlist Queue' : 'Hàng Đợi Waitlist'}</div>
                    <div className="text-[10px] text-amber-400">{isEn ? 'Queue for review' : 'Xếp hàng chờ duyệt'}</div>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#222B35]">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2 bg-[#161B22] hover:bg-gray-800 text-gray-300 border border-gray-700 transition-colors rounded-none text-xs"
                >
                  {isEn ? 'Cancel' : 'Hủy Bỏ'}
                </button>
                <button
                  type="submit"
                  disabled={!hasResident}
                  className={`px-5 py-2 font-semibold uppercase tracking-wider transition-colors rounded-none flex items-center gap-1.5 text-xs ${
                    hasResident
                      ? 'bg-[#C5A880] hover:bg-[#E2C9A5] text-[#0A0E14]'
                      : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  {regActionType === 'WAITLIST' 
                    ? (isEn ? 'Confirm Enqueue' : 'Xác Nhận Xếp Hàng Đợi') 
                    : (isEn ? 'Confirm Pass Issue' : 'Xác Nhận Cấp Thẻ')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
