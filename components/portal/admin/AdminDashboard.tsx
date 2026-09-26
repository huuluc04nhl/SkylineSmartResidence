'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Activity, 
  Receipt, 
  Car, 
  Flame, 
  Eye, 
  Radio, 
  CheckCircle2, 
  TrendingUp,
  Building,
  ShieldCheck,
  Clock,
  Sliders
} from 'lucide-react';
import { getApartmentUnits } from '@/lib/apartmentStore';
import { getAllVisitorPasses, getGateAuditLogs } from '@/lib/visitorStore';
import { getBills } from '@/lib/billingStore';

// Cấu trúc dữ liệu phân tầng an ninh và cảnh báo BMS
interface FloorThreatData {
  floor: 'B2' | 'B1' | 'L1' | '20' | '30' | '34';
  floorName: string;
  threatLevel: 'NORMAL' | 'WARNING' | 'CRITICAL';
  activeNodes: number;
  threats: {
    id: string;
    type: 'FIRE' | 'WATER' | 'INTRUSION' | 'PARKING';
    title: string;
    location: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    confidence: number;
    snapshot: string;
    time: string;
    coords: { x: number; y: number };
    actionHint: string;
  }[];
}

const FLOOR_THREAT_DATABASE: Record<string, FloorThreatData> = {
  B2: {
    floor: 'B2',
    floorName: 'Hầm B2 • Trạm Bơm & Bể PCCC',
    threatLevel: 'NORMAL',
    activeNodes: 22,
    threats: [
      {
        id: 'T-B2-01',
        type: 'WATER',
        title: 'Áp lực nước PCCC ổn định (6.2 bar)',
        location: 'Trạm bơm Grundfos Hầm B2',
        severity: 'LOW',
        confidence: 0.99,
        snapshot: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600',
        time: '00:55',
        coords: { x: 28, y: 32 },
        actionHint: 'Áp lực 6.2 bar, bể nước đạt 94% dung tích.'
      }
    ]
  },
  B1: {
    floor: 'B1',
    floorName: 'Hầm B1 • Bãi Đỗ Xe & Trạm Biến Áp',
    threatLevel: 'WARNING',
    activeNodes: 32,
    threats: [
      {
        id: 'T-B1-01',
        type: 'FIRE',
        title: 'Nhiệt độ tủ điện trung thế: 42°C',
        location: 'Trạm biến áp Hầm B1',
        severity: 'MEDIUM',
        confidence: 0.94,
        snapshot: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600',
        time: '00:52',
        coords: { x: 26, y: 72 },
        actionHint: 'Tự động kích hoạt quạt tản nhiệt.'
      },
      {
        id: 'T-B1-02',
        type: 'PARKING',
        title: 'Xe đỗ chắn họng nước cứu hỏa',
        location: 'Hành lang lối thoát hiểm (Cột B1-08)',
        severity: 'MEDIUM',
        confidence: 0.91,
        snapshot: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=600',
        time: '00:45',
        coords: { x: 74, y: 30 },
        actionHint: 'Bảo vệ ca trực đã tiếp cận xử lý.'
      }
    ]
  },
  L1: {
    floor: 'L1',
    floorName: 'Tầng 1 • Sảnh Grand Lobby & Lễ Tân',
    threatLevel: 'NORMAL',
    activeNodes: 26,
    threats: [
      {
        id: 'T-L1-01',
        type: 'INTRUSION',
        title: 'Cổng FaceID lễ tân vận hành tốt',
        location: 'Sảnh chính Tầng 1',
        severity: 'LOW',
        confidence: 0.98,
        snapshot: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=600',
        time: '00:58',
        coords: { x: 74, y: 72 },
        actionHint: 'Nhận diện mở cửa tức thì < 0.2s.'
      }
    ]
  },
  '20': {
    floor: '20',
    floorName: 'Tầng 20 • Gian Lánh Nạn PCCC',
    threatLevel: 'NORMAL',
    activeNodes: 18,
    threats: [
      {
        id: 'T-20-01',
        type: 'FIRE',
        title: 'Áp suất dương buồng đệm an toàn',
        location: 'Gian lánh nạn Tầng 20',
        severity: 'LOW',
        confidence: 0.97,
        snapshot: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600',
        time: '00:42',
        coords: { x: 50, y: 50 },
        actionHint: 'Hệ thống liên lạc khẩn cấp sẵn sàng 100%.'
      }
    ]
  },
  '30': {
    floor: '30',
    floorName: 'Tầng 30 • Hành Lang Căn Hộ',
    threatLevel: 'NORMAL',
    activeNodes: 20,
    threats: [
      {
        id: 'T-30-01',
        type: 'WATER',
        title: 'Cảm biến rò rỉ nước bình thường',
        location: 'Hộp kỹ thuật tầng 30 (Khu căn CH-06)',
        severity: 'LOW',
        confidence: 0.96,
        snapshot: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600',
        time: '00:50',
        coords: { x: 74, y: 30 },
        actionHint: 'Áp lực 2.8 bar, không ghi nhận rò rỉ.'
      }
    ]
  },
  '34': {
    floor: '34',
    floorName: 'Tầng 34 • Phòng Máy Kéo & Mái',
    threatLevel: 'NORMAL',
    activeNodes: 16,
    threats: [
      {
        id: 'T-34-01',
        type: 'FIRE',
        title: 'Quạt tăng áp hút khói sẵn sàng',
        location: 'Trục kỹ thuật tầng mái BS-07',
        severity: 'LOW',
        confidence: 0.99,
        snapshot: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600',
        time: '00:40',
        coords: { x: 28, y: 32 },
        actionHint: 'Áp suất 50 Pa, van chặn lửa mở sẵn sàng.'
      }
    ]
  }
};

export default function AdminDashboard() {
  const [selectedFloor, setSelectedFloor] = useState<'B2' | 'B1' | 'L1' | '20' | '30' | '34'>('B1');
  const [selectedThreatId, setSelectedThreatId] = useState<string>('T-B1-01');
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);
  
  // Realtime clock display
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(now.toLocaleTimeString('vi-VN', { hour12: false }) + ' • ' + now.toLocaleDateString('vi-VN'));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Lấy dữ liệu thật từ apartmentStore & visitorStore
  const apartments = useMemo(() => {
    try {
      return getApartmentUnits();
    } catch {
      return [];
    }
  }, []);

  const visitorPasses = useMemo(() => {
    try {
      return getAllVisitorPasses();
    } catch {
      return [];
    }
  }, []);

  const auditLogs = useMemo(() => {
    try {
      return getGateAuditLogs();
    } catch {
      return [];
    }
  }, []);

  const occupiedUnits = useMemo(() => {
    return apartments.filter(u => u.status === 'OCCUPIED').length;
  }, [apartments]);

  const maintenanceUnits = useMemo(() => {
    return apartments.filter(u => u.status === 'MAINTENANCE' || u.status === 'HANDOVER_PENDING').length;
  }, [apartments]);

  const vacantUnits = useMemo(() => {
    return apartments.filter(u => u.status === 'VACANT').length;
  }, [apartments]);

  const totalUnits = apartments.length;
  const occupiedPct = totalUnits > 0 ? ((occupiedUnits / totalUnits) * 100).toFixed(1) : '0';
  const maintPct = totalUnits > 0 ? ((maintenanceUnits / totalUnits) * 100).toFixed(1) : '0';
  const vacantPct = totalUnits > 0 ? ((vacantUnits / totalUnits) * 100).toFixed(1) : '0';

  // Lấy dữ liệu thật từ billingStore
  const bills = useMemo(() => {
    try {
      return getBills();
    } catch {
      return [];
    }
  }, []);

  const totalPaidRevenue = useMemo(() => {
    return bills.filter(b => b.status === 'Paid').reduce((sum, b) => sum + (b.total_amount || 0), 0);
  }, [bills]);

  const totalExpectedRevenue = useMemo(() => {
    return bills.reduce((sum, b) => sum + (b.total_amount || 0), 0);
  }, [bills]);

  const collectionRate = useMemo(() => {
    return totalExpectedRevenue > 0 ? ((totalPaidRevenue / totalExpectedRevenue) * 100).toFixed(1) : '100';
  }, [totalPaidRevenue, totalExpectedRevenue]);

  // Lấy dữ liệu phương tiện xe thực tế từ apartmentStore
  const registeredCars = useMemo(() => {
    return apartments.reduce((sum, apt) => sum + (apt.vehicles?.filter(v => v.type === 'CAR').length || 0), 0);
  }, [apartments]);

  const registeredMotos = useMemo(() => {
    return apartments.reduce((sum, apt) => sum + (apt.vehicles?.filter(v => v.type === 'MOTORBIKE').length || 0), 0);
  }, [apartments]);

  const currentFloorData = FLOOR_THREAT_DATABASE[selectedFloor] || FLOOR_THREAT_DATABASE['B1'];
  const activeThreat = currentFloorData.threats.find(t => t.id === selectedThreatId) || currentFloorData.threats[0];

  const handleDispatchSecurity = () => {
    setDispatchStatus(`Đã phát lệnh điều động bảo vệ tới ${currentFloorData.floorName}!`);
    setTimeout(() => setDispatchStatus(null), 4000);
  };

  return (
    <div className="space-y-5 animate-fadeIn select-none text-white">
      
      {/* 1. HEADER CHỈ HUY TRUNG TÂM VẬN HÀNH */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gradient-to-r from-[#0C121B] via-[#121A26] to-[#0C121B] border border-[#222B35] shadow-lg">
        <div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[#C5A880] font-mono font-bold">
            <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" />
            <span>TRUNG TÂM VẬN HÀNH BMS • BS-07</span>
          </div>
          <h1 className="font-serif text-xl sm:text-2xl font-bold text-white mt-0.5 tracking-wide flex items-center gap-2.5">
            <span>Giám Sát An Ninh & Kỹ Thuật</span>
            <span className="text-[10px] px-2 py-0.5 bg-emerald-950/80 text-emerald-300 border border-emerald-500/80 font-mono font-normal">
              TRỰC TUYẾN
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <div className="px-3 py-1.5 bg-[#16202D] border border-[#2B394E] text-gray-300 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-[#C5A880]" />
            <span>{currentTimeStr || 'Đang cập nhật...'}</span>
          </div>
          <button 
            type="button"
            onClick={() => setIsEmergencyActive(!isEmergencyActive)}
            className={`px-3 py-1.5 font-bold flex items-center gap-1.5 border transition-all ${
              isEmergencyActive 
                ? 'bg-red-600 text-white border-red-400 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.5)]' 
                : 'bg-[#1C161D] text-red-400 border-red-900/60 hover:border-red-600'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>{isEmergencyActive ? 'BÁO ĐỘNG BẬT' : 'DIỄN TẬP PCCC'}</span>
          </button>
        </div>
      </div>

      {/* 2. 4 THẺ KPI CHỈ SỐ CỐT LÕI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* KPI 1: Doanh thu thực thu */}
        <div className="p-3.5 bg-[#121820] border border-[#222B35] space-y-1.5 hover:border-[#C5A880]/60 transition-all shadow">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="font-semibold">Doanh Thu Đã Thu</span>
            <Receipt className="w-4 h-4 text-[#C5A880]" />
          </div>
          <div className="font-serif text-2xl text-white font-bold tracking-wide">
            {totalPaidRevenue.toLocaleString('vi-VN')} <span className="text-xs font-sans text-gray-400 font-normal">đ</span>
          </div>
          <div className="text-[11px] text-emerald-400 flex items-center justify-between font-mono pt-1 border-t border-[#1C2533]">
            <span>Đã thu {bills.filter(b => b.status === 'Paid').length}/{bills.length} căn</span>
            <span className="text-gray-400">Đạt {collectionRate}%</span>
          </div>
        </div>

        {/* KPI 2: Tỷ lệ lấp đầy */}
        <div className="p-3.5 bg-[#121820] border border-[#222B35] space-y-1.5 hover:border-[#C5A880]/60 transition-all shadow">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="font-semibold">Tỷ Lệ Lấp Đầy</span>
            <Building className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-serif text-2xl text-white font-bold tracking-wide flex items-baseline gap-2">
            <span>{occupiedPct}%</span>
            <span className="text-xs font-sans text-gray-400 font-normal">/ {totalUnits} Căn</span>
          </div>
          <div className="w-full bg-[#1C2533] h-1.5 flex overflow-hidden">
            <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${occupiedPct}%` }} title={`Đã ở: ${occupiedUnits}`} />
            <div className="bg-amber-400 h-full transition-all duration-500" style={{ width: `${maintPct}%` }} title={`Nghiệm thu: ${maintenanceUnits}`} />
            <div className="bg-gray-600 h-full transition-all duration-500" style={{ width: `${vacantPct}%` }} title={`Trống: ${vacantUnits}`} />
          </div>
          <div className="text-[10.5px] text-gray-400 flex items-center justify-between font-mono pt-0.5 border-t border-[#1C2533]">
            <span className="text-emerald-400">● {occupiedUnits} Ở</span>
            <span className="text-amber-400">● {maintenanceUnits} Bàn Giao</span>
            <span className="text-gray-400">● {vacantUnits} Trống</span>
          </div>
        </div>

        {/* KPI 3: Khách thăm */}
        <div className="p-3.5 bg-[#121820] border border-[#222B35] space-y-1.5 hover:border-[#C5A880]/60 transition-all shadow">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="font-semibold">Khách Thăm Tòa Nhà</span>
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="font-serif text-2xl text-white font-bold tracking-wide flex items-baseline gap-2">
            <span>{visitorPasses.length} Thẻ</span>
            <span className="text-xs font-sans text-gray-400 font-normal">• {auditLogs.length} Lượt Quét</span>
          </div>
          <div className="text-[11px] text-cyan-400 flex items-center justify-between font-mono pt-1 border-t border-[#1C2533]">
            <span>Đang hoạt động</span>
            <span className="text-gray-400">Cổng L1 & B1</span>
          </div>
        </div>

        {/* KPI 4: Phương tiện */}
        <div className="p-3.5 bg-[#121820] border border-[#222B35] space-y-1.5 hover:border-[#C5A880]/60 transition-all shadow">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="font-semibold">Phương Tiện Cư Dân</span>
            <Car className="w-4 h-4 text-[#C5A880]" />
          </div>
          <div className="font-serif text-2xl text-white font-bold tracking-wide">
            {registeredCars + registeredMotos} <span className="text-xs font-sans text-gray-400 font-normal">Xe Đăng Ký</span>
          </div>
          <div className="text-[11px] text-emerald-400 flex items-center justify-between font-mono pt-1 border-t border-[#1C2533]">
            <span>● {registeredCars} Ô tô</span>
            <span>● {registeredMotos} Xe máy</span>
          </div>
        </div>
      </div>

      {/* 3. KHU VỰC CHÍNH: BẢN ĐỒ & CAMERA AI */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* CỘT TRÁI (7 COLS): SƠ ĐỒ MẶT BẰNG TẦNG */}
        <div className="lg:col-span-7 bg-[#0E141E] border border-[#222B35] p-4 space-y-3 shadow-xl">
          
          {/* Thanh chuyển tầng nhanh */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-[#222B35] pb-2.5">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-white">
              <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" />
              <span>SƠ ĐỒ PHÂN TẦNG BMS</span>
            </div>

            {/* Switch tầng: B2, B1, L1, 20, 30, 34 */}
            <div className="flex items-center gap-1 bg-[#16202D] border border-[#2B394E] p-1 text-xs font-mono flex-wrap">
              {(['B2', 'B1', 'L1', '20', '30', '34'] as const).map((fl) => {
                const fData = FLOOR_THREAT_DATABASE[fl];
                const isCrit = fData.threatLevel === 'CRITICAL';
                const isWarn = fData.threatLevel === 'WARNING';
                const isSel = selectedFloor === fl;

                return (
                  <button
                    key={fl}
                    type="button"
                    onClick={() => {
                      setSelectedFloor(fl);
                      if (fData.threats.length > 0) {
                        setSelectedThreatId(fData.threats[0].id);
                      }
                    }}
                    className={`px-2 py-0.5 transition-all border relative ${
                      isSel
                        ? 'bg-[#C5A880] text-[#0D1117] font-bold border-[#C5A880] shadow'
                        : 'bg-transparent text-gray-300 border-transparent hover:bg-[#1E2C3D] hover:text-white'
                    }`}
                  >
                    <span>{fl === 'L1' ? 'Tầng 1' : fl === 'B1' ? 'Hầm B1' : fl === 'B2' ? 'Hầm B2' : fl === '34' ? 'Tầng 34' : `Tầng ${fl}`}</span>
                    {isCrit && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                    )}
                    {isWarn && !isCrit && (
                      <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-amber-400 rounded-full"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Banner tầng đang chọn */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-[#141C28] border border-[#243244] text-xs font-mono">
            <div className="flex items-center gap-2 truncate">
              <Building className="w-3.5 h-3.5 text-[#C5A880] shrink-0" />
              <span className="text-white font-bold truncate">{currentFloorData.floorName}</span>
            </div>
            <span className={`px-2 py-0.5 text-[9px] font-bold shrink-0 border ${
              currentFloorData.threatLevel === 'CRITICAL'
                ? 'bg-red-950 text-red-300 border-red-500'
                : currentFloorData.threatLevel === 'WARNING'
                ? 'bg-amber-950 text-amber-300 border-amber-500'
                : 'bg-emerald-950 text-emerald-300 border-emerald-500'
            }`}>
              {currentFloorData.threatLevel === 'CRITICAL' ? 'NGUY HIỂM' : currentFloorData.threatLevel === 'WARNING' ? 'CẢNH BÁO' : 'BÌNH THƯỜNG'}
            </span>
          </div>

          {/* SƠ ĐỒ BẢN ĐỒ MẶT BẰNG */}
          <div className="relative h-[250px] bg-[#070A0F] border border-[#222B35] flex items-center justify-center overflow-hidden">
            <div 
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage: 'linear-gradient(to right, #1E293B 1px, transparent 1px), linear-gradient(to bottom, #1E293B 1px, transparent 1px)',
                backgroundSize: '24px 24px'
              }}
            />

            <div className="relative z-10 w-[96%] h-[92%] border border-gray-800/80 bg-[#0A0F17]/95 p-2 flex flex-col justify-between shadow-xl">
              {/* Header sơ đồ sàn */}
              <div className="flex justify-between items-center text-[9px] font-mono text-gray-400 border-b border-gray-800/60 pb-1">
                <span className="text-[#C5A880] font-bold">MẶT BẰNG SÀN • {selectedFloor}</span>
                <span className="text-gray-400">{currentFloorData.activeNodes} Cảm Biến Hoạt Động</span>
              </div>

              {/* Các phân khu kiến trúc */}
              <div className="relative flex-1 my-1">
                <div className="absolute top-1 left-2 px-1.5 py-0.5 border border-dashed border-emerald-700/50 bg-[#0E1722]/40 text-[8px] font-mono text-emerald-400/80 pointer-events-none">
                  THANG BỘ 01
                </div>

                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 py-1.5 border border-[#2B3B4F] bg-[#111924]/80 text-center shadow pointer-events-none">
                  <div className="font-bold text-gray-200 text-[8.5px] tracking-wide flex items-center justify-center gap-1">
                    <Sliders className="w-2.5 h-2.5 text-[#C5A880]" /> LÕI THANG MÁY
                  </div>
                </div>

                <div className="absolute bottom-1 right-2 px-1.5 py-0.5 border border-dashed border-emerald-700/50 bg-[#0E1722]/40 text-[8px] font-mono text-emerald-400/80 pointer-events-none">
                  THANG BỘ 02
                </div>

                <div className="absolute top-1 right-2 px-1.5 py-0.5 border border-dashed border-gray-700/50 bg-[#0E1722]/40 text-[8px] font-mono text-gray-400/80 pointer-events-none">
                  HỌNG PCCC
                </div>

                <div className="absolute bottom-1 left-2 px-1.5 py-0.5 border border-dashed border-gray-700/50 bg-[#0E1722]/40 text-[8px] font-mono text-gray-400/80 pointer-events-none">
                  TRỤC M&E
                </div>

                {/* Các điểm radar cảnh báo */}
                {currentFloorData.threats.map((threat, idx) => {
                  const isSelected = activeThreat?.id === threat.id;
                  const isHigh = threat.severity === 'HIGH';
                  const isMed = threat.severity === 'MEDIUM';

                  return (
                    <button
                      key={threat.id}
                      type="button"
                      onClick={() => setSelectedThreatId(threat.id)}
                      style={{ left: `${threat.coords.x}%`, top: `${threat.coords.y}%` }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group focus:outline-none flex items-center gap-1"
                    >
                      <span className="relative flex items-center justify-center">
                        <span className={`w-3.5 h-3.5 rounded-full absolute ${
                          isHigh 
                            ? 'bg-red-500/25 animate-ping' 
                            : isMed 
                            ? 'bg-amber-500/25 animate-pulse' 
                            : 'bg-emerald-500/20'
                        }`} />
                        <span className={`w-3 h-3 rounded-full flex items-center justify-center text-[7px] font-mono font-bold transition-all border ${
                          isHigh 
                            ? 'bg-red-600/60 border-red-400 text-white' 
                            : isMed 
                            ? 'bg-amber-600/60 border-amber-400 text-white' 
                            : 'bg-emerald-600/60 border-emerald-400 text-white'
                        } ${isSelected ? 'scale-125 ring-2 ring-[#C5A880] ring-offset-1 ring-offset-black !bg-opacity-100' : 'opacity-80 group-hover:opacity-100'}`}>
                          !
                        </span>
                      </span>

                      <span className={`text-[8px] font-mono px-1 py-0.2 border transition-all ${
                        isSelected 
                          ? 'bg-[#0E1520] border-[#C5A880] text-[#C5A880] font-bold' 
                          : 'bg-[#0A0F17]/80 border-gray-800 text-gray-400 group-hover:text-white'
                      }`}>
                        T{idx + 1}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Status Footer Legend Bar */}
              <div className="flex justify-between items-center text-[8px] text-gray-400 font-mono pt-1 border-t border-gray-800/60">
                <span className="text-emerald-400">● Hệ thống an toàn</span>
                <span className="text-amber-400">● Điểm cảnh báo T1/T2</span>
                <span className="text-cyan-400">● BMS kết nối trực tiếp</span>
              </div>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI (5 COLS): CAMERA & THÔNG BÁO XỬ LÝ */}
        <div className="lg:col-span-5 bg-[#0E141E] border border-[#222B35] p-4 space-y-3 flex flex-col justify-between shadow-xl">
          <div className="space-y-2.5">
            {/* Header Camera */}
            <div className="flex items-center justify-between border-b border-[#222B35] pb-2">
              <span className="text-xs uppercase tracking-wider text-[#C5A880] font-mono font-bold flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" /> CAMERA AN NINH LIVE
              </span>
              <span className="px-1.5 py-0.5 bg-red-950/80 border border-red-500 text-red-300 text-[9px] font-mono font-bold">
                AI: {(activeThreat.confidence * 100).toFixed(0)}%
              </span>
            </div>

            {/* Live Camera Frame */}
            <div className="relative border border-red-500/40 h-36 overflow-hidden shadow-lg bg-black">
              <img
                src={activeThreat.snapshot}
                alt={activeThreat.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-1.5 left-1.5 bg-black/80 px-1.5 py-0.5 text-[8.5px] font-mono text-red-400 border border-red-800">
                CAM-{selectedFloor} • {activeThreat.id}
              </div>
              <div className="absolute bottom-1.5 right-1.5 bg-black/80 px-1.5 py-0.5 text-[8.5px] font-mono text-gray-300">
                {activeThreat.time}
              </div>
            </div>

            {/* Thông số chi tiết cảnh báo - Tinh gọn, rõ ràng */}
            <div className="space-y-1.5 text-xs text-gray-300 bg-[#131A26] p-2.5 border border-[#222B35] font-mono">
              <div className="flex justify-between items-start gap-2">
                <span className="text-gray-400 shrink-0">Sự việc:</span>
                <strong className="text-red-400 font-semibold text-right truncate">{activeThreat.title}</strong>
              </div>
              <div className="flex justify-between items-start gap-2">
                <span className="text-gray-400 shrink-0">Vị trí:</span>
                <span className="text-white text-right truncate">{activeThreat.location}</span>
              </div>
              <div className="flex justify-between items-start gap-2">
                <span className="text-gray-400 shrink-0">Xử lý:</span>
                <span className="text-emerald-300 text-right truncate">{activeThreat.actionHint}</span>
              </div>
            </div>

            {/* Feedback Dispatch Toast */}
            {dispatchStatus && (
              <div className="p-2 bg-blue-950/90 border border-blue-500 text-blue-300 text-xs font-mono animate-fadeIn shadow">
                {dispatchStatus}
              </div>
            )}
          </div>

          {/* Action Control Buttons */}
          <div className="pt-2 border-t border-[#222B35] space-y-1.5 font-mono">
            <button
              type="button"
              onClick={() => setIsEmergencyActive(!isEmergencyActive)}
              className={`w-full py-2 text-xs uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-2 shadow ${
                isEmergencyActive
                  ? 'bg-red-600 text-white animate-pulse shadow-red-500/50'
                  : 'bg-red-950/80 border border-red-500/80 text-red-300 hover:bg-red-900'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>{isEmergencyActive ? 'TẮT BÁO ĐỘNG KHẨN CẤP' : 'Báo Động Khẩn Cấp'}</span>
            </button>

            <button 
              type="button"
              onClick={handleDispatchSecurity}
              className="w-full py-2 bg-[#1C2533] hover:bg-[#C5A880] text-gray-200 hover:text-[#0D1117] border border-gray-700 hover:border-[#C5A880] text-xs uppercase tracking-wider font-bold transition-colors flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Điều Phối Bảo Vệ Hiện Trường</span>
            </button>
          </div>
        </div>

      </div>

      {/* 4. NHẬT KÝ SỰ KIỆN VẬN HÀNH THỜI GIAN THỰC */}
      <div className="p-3 bg-[#0E141E] border border-[#222B35] space-y-2 shadow font-mono">
        <div className="flex items-center justify-between text-xs text-gray-400 border-b border-[#1E293B] pb-1.5">
          <div className="flex items-center gap-2 font-bold text-white text-xs">
            <Activity className="w-3.5 h-3.5 text-[#C5A880]" />
            <span>NHẬT KÝ SỰ KIỆN VẬN HÀNH</span>
          </div>
          <span className="text-[10px] text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Trực tiếp
          </span>
        </div>

        {/* 3 Dòng sự kiện ngắn gọn, đúng nghiệp vụ */}
        <div className="space-y-1">
          {[
            {
              time: '01:00',
              type: 'FaceID T1',
              text: 'Xác thực thành công - Cư dân Căn CH-06 mở thang máy',
              badge: 'BÌNH THƯỜNG',
              badgeColor: 'text-emerald-400 border-emerald-800/80 bg-emerald-950/40'
            },
            {
              time: '00:52',
              type: 'Barrier B1',
              text: 'Mở tự động - Xe ô tô 51K-889.99 vào hầm',
              badge: 'HỢP LỆ',
              badgeColor: 'text-cyan-400 border-cyan-800/80 bg-cyan-950/40'
            },
            {
              time: '00:45',
              type: 'Trạm Bơm B2',
              text: 'Áp suất duy trì ổn định 6.2 bar (Bể 94%)',
              badge: 'CHUẨN',
              badgeColor: 'text-blue-400 border-blue-800/80 bg-blue-950/40'
            }
          ].map((item, idx) => (
            <div 
              key={idx}
              className="px-2.5 py-1.5 bg-[#121822] border border-[#1A2536] flex items-center justify-between gap-2.5 text-xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-gray-500 text-[10px] shrink-0">{item.time}</span>
                <span className="text-[#C5A880] shrink-0 font-semibold text-[11px]">[{item.type}]</span>
                <span className="text-gray-300 truncate text-[11px]">{item.text}</span>
              </div>
              <span className={`px-1.5 py-0.2 text-[8.5px] border shrink-0 font-bold ${item.badgeColor}`}>
                {item.badge}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
