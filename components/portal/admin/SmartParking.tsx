'use client';

import React, { useState, useMemo } from 'react';
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
  XCircle
} from 'lucide-react';
import { getApartmentUnits, ApartmentVehicle } from '@/lib/apartmentStore';

interface RegisteredVehicleWithUnit extends ApartmentVehicle {
  aptCode: string;
  ownerName: string;
  floor: number;
}

export default function SmartParking() {
  const [barrierOpen, setBarrierOpen] = useState(false);
  const [searchPlate, setSearchPlate] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'CAR' | 'MOTORBIKE'>('ALL');

  // Load actual units and registered vehicles
  const apartments = useMemo(() => {
    try {
      return getApartmentUnits();
    } catch {
      return [];
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
            ownerName: apt.owner?.name || 'Cư dân căn hộ',
            floor: apt.floor,
          });
        });
      }
    });
    return list;
  }, [apartments]);

  // Initial test vehicle is the first real registered vehicle or fallback
  const firstCar = registeredVehicles.find(v => v.type === 'CAR') || registeredVehicles[0];
  const [lastScannedPlate, setLastScannedPlate] = useState(firstCar?.plate || '51K-889.99');
  const [matchedVehicle, setMatchedVehicle] = useState<RegisteredVehicleWithUnit | null>(firstCar || null);
  const [scanResult, setScanResult] = useState<'MATCHED' | 'UNREGISTERED'>('MATCHED');

  // Realistic parking capacity specs for Chung Cư BS-07 (Hầm B1 & B2)
  const MAX_CAR_SLOTS = 120; // Hầm B2
  const MAX_MOTO_SLOTS = 350; // Hầm B1
  const registeredCars = registeredVehicles.filter(v => v.type === 'CAR').length;
  const registeredMotos = registeredVehicles.filter(v => v.type === 'MOTORBIKE').length;

  const carOccupancyPct = Math.min(100, Math.round((registeredCars / MAX_CAR_SLOTS) * 100));
  const motoOccupancyPct = Math.min(100, Math.round((registeredMotos / MAX_MOTO_SLOTS) * 100));

  const handleSimulateScan = (plateNumber: string) => {
    const cleanPlate = plateNumber.trim().toUpperCase().replace(/[-.\s]/g, '');
    const found = registeredVehicles.find(v => 
      v.plate.toUpperCase().replace(/[-.\s]/g, '') === cleanPlate
    );

    setLastScannedPlate(plateNumber);

    if (found) {
      setMatchedVehicle(found);
      setScanResult('MATCHED');
      setBarrierOpen(true);
      setTimeout(() => setBarrierOpen(false), 4000);
    } else {
      setMatchedVehicle(null);
      setScanResult('UNREGISTERED');
      setBarrierOpen(false);
    }
  };

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222B35] pb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-semibold">
            Hạ Tầng Tòa Nhà • Kiểm Soát Ra Vào Hầm B1-B2 (Chung Cư BS-07)
          </div>
          <h2 className="font-serif text-2xl text-white font-bold mt-1">
            Kiểm Soát Phương Tiện & Nhận Diện Biển Số LPR
          </h2>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1 bg-[#161B22] border border-[#2D3748] text-emerald-400 flex items-center gap-1.5 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            LPR Camera AI: &lt; 0.28s • Độ chính xác: 99.4%
          </span>
        </div>
      </div>

      {/* Real Infrastructure Capacity Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Car Capacity (Basement B2) */}
        <div className="p-4 bg-[#121820] border border-[#222B35] space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-300 font-semibold uppercase tracking-wider flex items-center gap-2">
              <Car className="w-4 h-4 text-[#C5A880]" /> Sức Chứa Ô Tô (Hầm B2)
            </span>
            <span className="font-mono text-xs font-bold text-white">
              {registeredCars} / {MAX_CAR_SLOTS} chỗ ({carOccupancyPct}%)
            </span>
          </div>
          <div className="w-full h-2.5 bg-[#1C2533] border border-[#2D3748] overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                carOccupancyPct >= 90 ? 'bg-red-500' : carOccupancyPct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.max(5, carOccupancyPct)}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-gray-400 font-mono">
            <span className="text-emerald-400">● Đã đăng ký cố định: {registeredCars} ô</span>
            <span>Còn trống: {MAX_CAR_SLOTS - registeredCars} ô</span>
          </div>
        </div>

        {/* Motorbike Capacity (Basement B1) */}
        <div className="p-4 bg-[#121820] border border-[#222B35] space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-300 font-semibold uppercase tracking-wider flex items-center gap-2">
              <Bike className="w-4 h-4 text-cyan-400" /> Sức Chứa Xe Máy (Hầm B1)
            </span>
            <span className="font-mono text-xs font-bold text-white">
              {registeredMotos} / {MAX_MOTO_SLOTS} xe ({motoOccupancyPct}%)
            </span>
          </div>
          <div className="w-full h-2.5 bg-[#1C2533] border border-[#2D3748] overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                motoOccupancyPct >= 90 ? 'bg-red-500' : 'bg-cyan-500'
              }`}
              style={{ width: `${Math.max(5, motoOccupancyPct)}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-gray-400 font-mono">
            <span className="text-cyan-400">● Đã cấp thẻ RFID: {registeredMotos} xe</span>
            <span>Còn nhận tối đa: {MAX_MOTO_SLOTS - registeredMotos} xe</span>
          </div>
        </div>
      </div>

      {/* Simulation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Camera Feed Simulator */}
        <div className="bg-[#121820] border border-[#222B35] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#222B35] pb-3 text-xs">
            <span className="text-[#C5A880] uppercase tracking-wider font-semibold flex items-center gap-1.5">
              <Camera className="w-4 h-4" /> Camera Quét Biển Số Làn Vào LPR-01 (Cổng Hầm B1)
            </span>
            <span className="font-mono text-gray-400">60 FPS • HD 1080P</span>
          </div>

          <div className="relative h-56 bg-black border border-gray-800 flex items-center justify-center overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80"
              alt="Car Entry"
              className="w-full h-full object-cover opacity-60"
            />
            {/* AI Bounding Box Overlay */}
            <div className={`absolute inset-x-8 bottom-6 border-2 p-2 bg-black/80 flex items-center justify-between ${
              scanResult === 'MATCHED' ? 'border-emerald-500' : 'border-red-500'
            }`}>
              <div className={`font-mono text-base font-bold tracking-widest ${
                scanResult === 'MATCHED' ? 'text-emerald-400' : 'text-red-400'
              }`}>
                [ {lastScannedPlate} ]
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 border ${
                scanResult === 'MATCHED'
                  ? 'text-emerald-300 bg-emerald-950 border-emerald-500'
                  : 'text-red-300 bg-red-950 border-red-500'
              }`}>
                {scanResult === 'MATCHED' ? 'BIỂN SỐ HỢP LỆ (HỢP ĐỒNG HIỆU LỰC)' : 'XE CHƯA ĐĂNG KÝ VÉ THÁNG'}
              </span>
            </div>
          </div>

          {/* Quick Simulation Buttons based on REAL Registered Vehicles */}
          <div className="space-y-2 pt-1">
            <div className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">
              Kiểm Tra Nhanh Nhận Diện Thực Tế:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {registeredVehicles.slice(0, 3).map((v) => (
                <button
                  key={v.id}
                  onClick={() => handleSimulateScan(v.plate)}
                  className="py-1.5 px-2 bg-[#1C2533] border border-[#C5A880]/50 hover:border-[#C5A880] text-gray-200 text-xs font-mono text-left flex items-center justify-between transition-colors"
                >
                  <span className="font-bold text-[#C5A880]">{v.plate}</span>
                  <span className="text-[10px] text-gray-400 truncate max-w-[120px]">
                    {v.aptCode} - {v.ownerName}
                  </span>
                </button>
              ))}
              <button
                onClick={() => handleSimulateScan('29A-999.88')}
                className="py-1.5 px-2 bg-red-950/40 border border-red-500/50 hover:border-red-500 text-red-300 text-xs font-mono text-left flex items-center justify-between transition-colors"
              >
                <span className="font-bold">29A-999.88</span>
                <span className="text-[10px] text-red-400">Khách Vãng Lai</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Barrier Status & Match Result */}
        <div className="bg-[#121820] border border-[#222B35] p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-[#222B35] pb-3 text-xs uppercase tracking-wider text-[#C5A880] font-semibold">
              Đối Soát CSDL Phương Tiện Cư Dân & Trạng Thái Barrier
            </div>

            <div className="p-4 bg-[#161B22] border border-[#222B35] space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Biển số nhận diện:</span>
                <span className="font-mono font-bold text-white text-sm bg-[#121820] px-2 py-0.5 border border-gray-700">
                  {lastScannedPlate}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Chủ sở hữu & Căn hộ:</span>
                <span className="text-gray-200 font-semibold">
                  {matchedVehicle ? `${matchedVehicle.ownerName} (Căn ${matchedVehicle.aptCode})` : 'Khách Vãng Lai / Chưa Đăng Ký'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Loại xe & Dòng xe:</span>
                <span className="text-gray-300 font-mono">
                  {matchedVehicle ? `${matchedVehicle.type === 'CAR' ? 'Ô tô' : 'Xe máy'} • ${matchedVehicle.brand || 'Tiêu chuẩn'}` : 'Vãng lai'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Mã thẻ RFID / Vị trí ô đỗ:</span>
                <span className="text-[#C5A880] font-mono font-bold">
                  {matchedVehicle ? `${matchedVehicle.cardNo || 'RFID-TAG'} • Ô ${matchedVehicle.slot || 'B1-M01'}` : 'Lấy thẻ giấy / Quét VietQR thu phí lượt'}
                </span>
              </div>
            </div>

            {/* Barrier Visual Indicator */}
            <div 
              className={`p-4 border text-center space-y-1 transition-all duration-300 ${
                barrierOpen 
                  ? 'bg-emerald-950/50 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]' 
                  : 'bg-[#161F2E]/60 border-gray-700'
              }`}
            >
              <div className="text-xs uppercase tracking-widest text-gray-400 font-mono">
                {barrierOpen ? 'TÍN HIỆU BMS: MỞ CỔNG TỰ ĐỘNG' : 'TÍN HIỆU BMS: RÀO CHẮN ĐANG HẠ'}
              </div>
              <div className={`font-serif text-xl sm:text-2xl font-bold tracking-wide ${
                barrierOpen ? 'text-emerald-400' : 'text-gray-300'
              }`}>
                {barrierOpen ? 'BARRIER ĐANG MỞ (XE QUA)' : 'BARRIER ĐANG ĐÓNG'}
              </div>
            </div>
          </div>

          <div className="text-[11px] text-gray-400 flex items-center justify-between border-t border-[#222B35] pt-3">
            <span>Dữ liệu đối soát trực tiếp từ CSDL Căn Hộ Chung Cư BS-07.</span>
            <span className="text-emerald-400 font-mono">SLA &lt; 0.5s</span>
          </div>
        </div>
      </div>

      {/* Table: Danh sách toàn bộ xe cư dân đã đăng ký */}
      <div className="bg-[#121820] border border-[#222B35] p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
              <Car className="w-5 h-5 text-[#C5A880]" />
              Danh Sách Phương Tiện Cư Dân Đã Đăng Ký ({filteredVehicles.length} phương tiện)
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Toàn bộ phương tiện chính thức được cấp quyền ra vào hầm B1 và B2 Tòa BS-07
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm biển số, căn hộ, chủ xe..."
                value={searchPlate}
                onChange={(e) => setSearchPlate(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-[#161B22] border border-[#2D3748] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#C5A880] w-48 sm:w-60"
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

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-[#222B35]">
            <thead className="bg-[#161B22] text-gray-400 font-semibold uppercase tracking-wider text-[10px] border-b border-[#222B35]">
              <tr>
                <th className="p-3">Biển Số Xe</th>
                <th className="p-3">Phân Loại</th>
                <th className="p-3">Dòng Xe / Nhãn Hiệu</th>
                <th className="p-3">Căn Hộ</th>
                <th className="p-3">Chủ Sở Hữu</th>
                <th className="p-3">Mã Thẻ RFID</th>
                <th className="p-3">Vị Trí Ô Đỗ</th>
                <th className="p-3 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C2533]">
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-gray-500">
                    Không tìm thấy phương tiện nào phù hợp với bộ lọc tìm kiếm.
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
                    <td className="p-3 font-mono text-[#C5A880]">
                      {veh.slot || (veh.type === 'CAR' ? 'B2-A' : 'B1-M')}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleSimulateScan(veh.plate)}
                        className="px-2 py-1 bg-[#1C2533] hover:bg-[#C5A880] hover:text-black text-gray-300 border border-gray-700 text-[11px] font-semibold transition-all"
                      >
                        Quét Thử
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
