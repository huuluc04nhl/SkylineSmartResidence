'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  ShieldAlert, 
  Activity, 
  Receipt, 
  Wrench, 
  Car, 
  Flame, 
  Eye, 
  Radio, 
  CheckCircle2, 
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Sparkles,
  Bell,
  Cpu,
  Server,
  Zap,
  Users,
  Building,
  Layers,
  MapPin,
  Waves,
  ShieldCheck,
  AlertCircle,
  Clock,
  Droplets,
  Wind,
  Compass,
  Maximize2,
  Minimize2,
  RefreshCw,
  Send,
  Volume2,
  Sliders
} from 'lucide-react';
import { getApartmentUnits } from '@/lib/apartmentStore';
import { getAllVisitorPasses, getGateAuditLogs } from '@/lib/visitorStore';

// Cấu trúc dữ liệu phân tầng an ninh và cảnh báo BMS
interface FloorThreatData {
  floor: 'B2' | 'B1' | 'L1' | '12' | '25';
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
    floorName: 'Hầm B2 - Trạm Bơm Cấp Nước Sinh Hoạt & Bể Ngầm PCCC 800m³',
    threatLevel: 'NORMAL',
    activeNodes: 22,
    threats: [
      {
        id: 'T-B2-01',
        type: 'WATER',
        title: 'Cảm biến áp lực nước bể ngầm PCCC ổn định',
        location: 'Trạm Bơm Tăng Áp Cứu Hỏa (Cụm Bơm Grundfos)',
        severity: 'LOW',
        confidence: 0.99,
        snapshot: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600',
        time: '00:55:10',
        coords: { x: 50, y: 50 },
        actionHint: 'Áp lực duy trì ổn định 6.2 bar. Bể nước đạt mức 94% dung tích an toàn.'
      }
    ]
  },
  B1: {
    floor: 'B1',
    floorName: 'Hầm B1 - Bãi Đỗ Xe Thông Minh & Trạm Kỹ Thuật Điện 1500kVA',
    threatLevel: 'WARNING',
    activeNodes: 32,
    threats: [
      {
        id: 'T-B1-01',
        type: 'FIRE',
        title: 'Camera AI Giám Sát Nhiệt Độ Tủ Điện Trung Thế (42°C)',
        location: 'Trạm Biến Áp Trung Thế & Máy Phát Điện Cummins 2500kVA',
        severity: 'MEDIUM',
        confidence: 0.94,
        snapshot: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600',
        time: '00:52:15',
        coords: { x: 42, y: 40 },
        actionHint: 'Quạt hút tản nhiệt tự động kích hoạt. Nhiệt độ an toàn dưới ngưỡng 50°C.'
      },
      {
        id: 'T-B1-02',
        type: 'PARKING',
        title: 'Cảnh Báo Đỗ Xe Chắn Họng Nước Cứu Hỏa Cửa Bắc',
        location: 'Hành Lang Lối Thoát Hiểm Hầm B1 (Cột B1-08)',
        severity: 'MEDIUM',
        confidence: 0.91,
        snapshot: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=600',
        time: '00:45:00',
        coords: { x: 76, y: 68 },
        actionHint: 'Bảo vệ ca trực đã tiếp cận hiện trường và yêu cầu di dời xe.'
      }
    ]
  },
  L1: {
    floor: 'L1',
    floorName: 'Tầng 1 - Sảnh Grand Lobby, Quầy Lễ Tân & Phòng Trực Ban An Ninh',
    threatLevel: 'NORMAL',
    activeNodes: 26,
    threats: [
      {
        id: 'T-L1-01',
        type: 'INTRUSION',
        title: 'Cổng Kiểm Soát FaceID Lễ Tân Sảnh Chính Hoạt Động Ổn Định',
        location: 'Cửa Xoay Tự Động & Cổng Từ Phân Tầng Thang Máy',
        severity: 'LOW',
        confidence: 0.98,
        snapshot: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=600',
        time: '00:58:30',
        coords: { x: 32, y: 55 },
        actionHint: 'Hệ thống nhận diện khuôn mặt sinh trắc học mở cửa trong 0.2 giây.'
      }
    ]
  },
  '12': {
    floor: '12',
    floorName: 'Tầng 12 - Hành Lang Căn Hộ & Trục Kỹ Thuật (Căn 12A05)',
    threatLevel: 'NORMAL',
    activeNodes: 20,
    threats: [
      {
        id: 'T-12-01',
        type: 'WATER',
        title: 'Đồng Hồ Đo Lưu Lượng Nước IoT Căn 12A05 Hoạt Động Chuẩn',
        location: 'Hộp Trục Kỹ Thuật Căn Hộ 12A05 (Nguyễn Hữu Lực)',
        severity: 'LOW',
        confidence: 0.96,
        snapshot: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600',
        time: '00:50:20',
        coords: { x: 62, y: 44 },
        actionHint: 'Áp lực nước 2.8 bar, cảm biến chống rò rỉ không ghi nhận dòng chảy bất thường.'
      }
    ]
  },
  '25': {
    floor: '25',
    floorName: 'Tầng 25 - Tiện Ích Trên Cao Sky Pool, Vườn Treo & Sân Đáp Helipad',
    threatLevel: 'NORMAL',
    activeNodes: 24,
    threats: [
      {
        id: 'T-25-01',
        type: 'FIRE',
        title: 'Đèn Tín Hiệu Hàng Không & Cảm Biến Gió Helipad Sẵn Sàng',
        location: 'Sân Thượng Helipad PCCC & Cứu Hộ Hàng Không',
        severity: 'LOW',
        confidence: 0.99,
        snapshot: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600',
        time: '00:40:00',
        coords: { x: 50, y: 28 },
        actionHint: 'Đèn chớp tín hiệu nhấp nháy chuẩn quốc tế, sàn đỗ thông thoáng.'
      }
    ]
  }
};

export default function AdminDashboard() {
  const [selectedFloor, setSelectedFloor] = useState<'B2' | 'B1' | 'L1' | '12' | '25'>('B1');
  const [selectedThreatId, setSelectedThreatId] = useState<string>('T-B1-01');
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);
  const [bmsFilter, setBmsFilter] = useState<'ALL' | 'CRITICAL' | 'NORMAL'>('ALL');
  
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

  const occupiedCount = useMemo(() => {
    return apartments.filter(u => u.status === 'OCCUPIED').length || 1;
  }, [apartments]);

  const currentFloorData = FLOOR_THREAT_DATABASE[selectedFloor] || FLOOR_THREAT_DATABASE['B1'];
  const activeThreat = currentFloorData.threats.find(t => t.id === selectedThreatId) || currentFloorData.threats[0];

  const handleDispatchSecurity = () => {
    setDispatchStatus(`📡 LỆNH ĐIỀU ĐỘNG: Đã phát tín hiệu điều động Đội Bảo Vệ Trực Ban tới ${currentFloorData.floorName} (Cam kết tiếp cận xử lý trong 3 phút theo tiêu chuẩn SLA BQL)!`);
    setTimeout(() => setDispatchStatus(null), 6000);
  };

  return (
    <div className="space-y-6 animate-fadeIn select-none text-white">
      
      {/* ============================================================= */}
      {/* 1. HEADER CHỈ HUY TRUNG TÂM VẬN HÀNH BMS (MISSION CONTROL)     */}
      {/* ============================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 sm:p-5 bg-gradient-to-r from-[#0C121B] via-[#121A26] to-[#0C121B] border border-[#222B35] shadow-2xl">
        <div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-mono font-bold">
            <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" />
            <span>HỆ THỐNG BMS CHỈ HUY VẬN HÀNH 24/7 • CHUNG CƯ SKYLINE</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white mt-1 tracking-wide flex items-center gap-3">
            <span>Trung Tâm Vận Hành & An Ninh Tòa Nhà</span>
            <span className="text-xs px-2.5 py-0.5 bg-emerald-950/80 text-emerald-300 border border-emerald-500 font-mono font-normal">
              LIVE SYSTEM
            </span>
          </h1>
          <p className="text-xs text-gray-400 mt-1 flex items-center gap-2 font-mono">
            <span>Giám sát thời gian thực toàn bộ hạ tầng kỹ thuật, Camera AI YOLOv8, Trạm bơm PCCC & Năng lượng IoT</span>
            <span className="text-[#C5A880]">• Đồng hồ máy chủ: {currentTimeStr || '12/09/2026'}</span>
          </p>
        </div>

        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <div className="px-3 py-1.5 bg-[#16202D] border border-emerald-500/60 text-emerald-300 flex items-center gap-1.5 shadow">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>BMS: 100% Online (124 Nodes)</span>
          </div>

          <div className="px-3 py-1.5 bg-[#16202D] border border-cyan-500/60 text-cyan-300 flex items-center gap-1.5 shadow">
            <Droplets className="w-3 h-3 text-cyan-400" />
            <span>Áp Suất Nước: 6.2 Bar</span>
          </div>

          <div className="px-3 py-1.5 bg-[#16202D] border border-amber-500/60 text-amber-300 flex items-center gap-1.5 shadow">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Điện EVN & UPS: 100%</span>
          </div>
        </div>
      </div>

      {/* ============================================================= */}
      {/* 2. 4 THẺ KPI CHỈ SỐ VẬN HÀNH TÒA NHÀ CỐT LÕI (CORE KPIS)       */}
      {/* ============================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* KPI 1: Doanh thu & Phí dịch vụ */}
        <div className="p-4 bg-[#121820] border border-[#222B35] space-y-2 hover:border-[#C5A880]/60 transition-all shadow-lg">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="font-semibold">Doanh Thu Vận Hành Tháng 09/2026</span>
            <Receipt className="w-4 h-4 text-[#C5A880]" />
          </div>
          <div className="font-serif text-2xl text-white font-bold tracking-wide">
            1.845.200.000 <span className="text-xs font-sans text-gray-400 font-normal">đ</span>
          </div>
          <div className="text-[11px] text-emerald-400 flex items-center justify-between font-mono pt-1 border-t border-[#1C2533]">
            <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> +8.4% so tháng trước</span>
            <span className="text-gray-400">Thu hồi: 96.5%</span>
          </div>
        </div>

        {/* KPI 2: Không gian & Cư trú */}
        <div className="p-4 bg-[#121820] border border-[#222B35] space-y-2 hover:border-[#C5A880]/60 transition-all shadow-lg">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="font-semibold">Hiện Trạng Không Gian Căn Hộ</span>
            <Building className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-serif text-2xl text-white font-bold tracking-wide flex items-baseline gap-2">
            <span>{occupiedCount} Đã Ở</span>
            <span className="text-xs font-sans text-gray-400 font-normal">/ {apartments.length || 36} Căn BQL</span>
          </div>
          <div className="text-[11px] text-gray-300 flex items-center justify-between font-mono pt-1 border-t border-[#1C2533]">
            <span className="text-emerald-400">Căn 12A05: Nguyễn Hữu Lực</span>
            <span className="text-amber-300">Nghiệm thu: 10A03</span>
          </div>
        </div>

        {/* KPI 3: An ninh & Khách thăm */}
        <div className="p-4 bg-[#121820] border border-[#222B35] space-y-2 hover:border-[#C5A880]/60 transition-all shadow-lg">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="font-semibold">Kiểm Soát An Ninh Khách Thăm</span>
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="font-serif text-2xl text-white font-bold tracking-wide flex items-baseline gap-2">
            <span>{visitorPasses.length} Thẻ Khách</span>
            <span className="text-xs font-sans text-gray-400 font-normal">• {auditLogs.length} Lượt Quét</span>
          </div>
          <div className="text-[11px] text-cyan-400 flex items-center justify-between font-mono pt-1 border-t border-[#1C2533]">
            <span>100% Dữ Liệu Thật</span>
            <span className="text-gray-400">Sảnh 1 & Hầm B1</span>
          </div>
        </div>

        {/* KPI 4: Hầm Bãi Xe Thông Minh */}
        <div className="p-4 bg-[#121820] border border-[#222B35] space-y-2 hover:border-[#C5A880]/60 transition-all shadow-lg">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="font-semibold">Sức Chứa Bãi Xe Hầm B1-B2</span>
            <Car className="w-4 h-4 text-[#C5A880]" />
          </div>
          <div className="font-serif text-2xl text-white font-bold tracking-wide">
            78% <span className="text-xs font-sans text-gray-400 font-normal">Công Suất Hầm</span>
          </div>
          <div className="text-[11px] text-emerald-400 flex items-center justify-between font-mono pt-1 border-t border-[#1C2533]">
            <span>Trống: 42 Ô tô</span>
            <span>128 Xe máy</span>
          </div>
        </div>
      </div>

      {/* ============================================================= */}
      {/* 3. KHU VỰC CHÍNH: BẢN ĐỒ CẢNH BÁO AN NINH & PCCC ĐA TẦNG       */}
      {/* ============================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* CỘT TRÁI (7 COLS): BẢN ĐỒ RADAR MẶT BẰNG & SƠ ĐỒ ĐA TẦNG */}
        <div className="lg:col-span-7 bg-[#0E141E] border border-[#222B35] p-4 sm:p-5 space-y-3.5 shadow-2xl">
          
          {/* Thanh chuyển tầng nhanh & Trạng thái an ninh */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222B35] pb-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-white">
              <Radio className="w-4 h-4 text-red-500 animate-pulse" />
              <span>BẢN ĐỒ AN NINH & PCCC ĐA TẦNG (LIVE THREAT RADAR)</span>
            </div>

            {/* Switch tầng: B2, B1, L1, 12, 25 */}
            <div className="flex items-center gap-1 bg-[#16202D] border border-[#2B394E] p-1 text-xs font-mono">
              {(['B2', 'B1', 'L1', '12', '25'] as const).map((fl) => {
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
                    className={`px-2.5 py-1 transition-all border relative ${
                      isSel
                        ? 'bg-[#C5A880] text-[#0D1117] font-bold border-[#C5A880] shadow'
                        : 'bg-transparent text-gray-300 border-transparent hover:bg-[#1E2C3D] hover:text-white'
                    }`}
                  >
                    <span>{fl === 'L1' ? 'Tầng 1' : fl === '12' ? 'Tầng 12' : fl === '25' ? 'Tầng 25' : `Hầm ${fl}`}</span>
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

          {/* Banner thông số phân tầng đang chọn */}
          <div className="flex items-center justify-between px-3 py-2 bg-[#141C28] border border-[#243244] text-xs font-mono">
            <div className="flex items-center gap-2 truncate">
              <Building className="w-3.5 h-3.5 text-[#C5A880] shrink-0" />
              <span className="text-white font-bold truncate">{currentFloorData.floorName}</span>
            </div>
            <span className={`px-2 py-0.5 text-[9.5px] font-bold shrink-0 border ${
              currentFloorData.threatLevel === 'CRITICAL'
                ? 'bg-red-950 text-red-300 border-red-500'
                : currentFloorData.threatLevel === 'WARNING'
                ? 'bg-amber-950 text-amber-300 border-amber-500'
                : 'bg-emerald-950 text-emerald-300 border-emerald-500'
            }`}>
              {currentFloorData.threatLevel === 'CRITICAL' ? '⚠️ NGUY HIỂM CAO' : currentFloorData.threatLevel === 'WARNING' ? '⚡ CẢNH BÁO NHẸ' : '🟢 BÌNH THƯỜNG'}
            </span>
          </div>

          {/* SƠ ĐỒ BẢN ĐỒ MẶT BẰNG PHÂN VÙNG KIẾN TRÚC & CẢM BIẾN */}
          <div className="relative h-[340px] bg-[#070A0F] border border-[#222B35] flex items-center justify-center overflow-hidden">
            {/* Lưới tọa độ kiến trúc BMS */}
            <div 
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage: 'linear-gradient(to right, #1E293B 1px, transparent 1px), linear-gradient(to bottom, #1E293B 1px, transparent 1px)',
                backgroundSize: '24px 24px'
              }}
            />

            {/* Bản vẽ mặt bằng sàn kiến trúc */}
            <div className="relative z-10 w-[94%] h-[90%] border border-gray-700 bg-[#0C121D]/90 p-3.5 flex flex-col justify-between shadow-2xl">
              
              {/* Header sơ đồ sàn */}
              <div className="flex justify-between items-center text-[10px] font-mono text-gray-400 border-b border-gray-800 pb-1.5">
                <span className="text-[#C5A880] font-bold">MẶT BẰNG BMS • CHUNG CƯ SKYLINE ({selectedFloor})</span>
                <span className="text-emerald-400">Cảm Biến Hoạt Động: {currentFloorData.activeNodes} Nodes Active</span>
              </div>

              {/* Các phân khu kiến trúc thực tế & Cảm biến */}
              <div className="relative flex-1 my-2">
                {/* Buồng Thang Thoát Hiểm 1 (Áp suất dương) */}
                <div className="absolute top-2 left-3 px-2 py-1 bg-[#141C28] border border-emerald-600/70 text-[9px] font-mono text-emerald-300">
                  Thang Thoát Hiểm 01 (Áp suất dương)
                </div>

                {/* Lõi Thang Máy Trung Tâm (4 Thang Khách + 1 Thang PCCC) */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3.5 py-2 bg-[#172230] border border-[#3A4D66] text-[10px] font-mono text-center shadow-lg">
                  <div className="font-bold text-white flex items-center justify-center gap-1">
                    <Sliders className="w-3 h-3 text-[#C5A880]" /> Lõi Thang Máy Trung Tâm (3.5 m/s)
                  </div>
                  <div className="text-[8.5px] text-cyan-300 mt-0.5">4 Thang Khách + 1 Thang Chuyên Dụng PCCC</div>
                </div>

                {/* Buồng Thang Thoát Hiểm 2 */}
                <div className="absolute bottom-2 right-3 px-2 py-1 bg-[#141C28] border border-emerald-600/70 text-[9px] font-mono text-emerald-300">
                  Thang Thoát Hiểm 02 (Chống khói)
                </div>

                {/* Hộp Vòi Cứu Hỏa Vách Tường */}
                <div className="absolute top-2 right-3 px-2 py-1 bg-[#141C28] border border-gray-700 text-[9px] font-mono text-gray-300">
                  Họng Nước Cứu Hỏa PCCC
                </div>

                {/* CÁC ĐIỂM SỰ CỐ / CẢNH BÁO TƯƠNG TÁC */}
                {currentFloorData.threats.map((threat) => {
                  const isSelected = activeThreat?.id === threat.id;
                  const isHigh = threat.severity === 'HIGH';
                  const isMed = threat.severity === 'MEDIUM';

                  return (
                    <div
                      key={threat.id}
                      onClick={() => setSelectedThreatId(threat.id)}
                      style={{ left: `${threat.coords.x}%`, top: `${threat.coords.y}%` }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group"
                    >
                      <div className="relative flex items-center justify-center">
                        <span className={`w-8 h-8 rounded-full absolute ${
                          isHigh ? 'bg-red-600/60 animate-ping' : isMed ? 'bg-amber-500/60 animate-pulse' : 'bg-emerald-500/40'
                        }`} />
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs text-white font-bold shadow-2xl border-2 border-white ${
                          isHigh ? 'bg-red-600' : isMed ? 'bg-amber-500' : 'bg-emerald-600'
                        } ${isSelected ? 'ring-4 ring-[#C5A880]' : ''}`}>
                          !
                        </span>
                      </div>
                      <div className="mt-1.5 px-2 py-0.5 bg-[#0A0F16]/95 border border-[#C5A880] text-white text-[9px] font-mono whitespace-nowrap shadow-xl">
                        {threat.title.substring(0, 26)}...
                      </div>
                    </div>
                  );
                })}

                {/* Các cảm biến xanh lá an toàn trải khắp sàn */}
                <div className="absolute top-1/4 left-1/4 flex items-center gap-1 text-[8.5px] text-emerald-400 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Sensor Smoke-01 ✓
                </div>
                <div className="absolute bottom-1/4 left-1/3 flex items-center gap-1 text-[8.5px] text-emerald-400 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Barie Gate B1 ✓
                </div>
                <div className="absolute top-1/3 right-1/4 flex items-center gap-1 text-[8.5px] text-emerald-400 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Camera AI-14 ✓
                </div>
              </div>

              {/* Status Footer Legend Bar */}
              <div className="flex justify-between items-center text-[9px] text-gray-400 font-mono pt-1.5 border-t border-gray-800 flex-wrap gap-2">
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Cửa Thoát Hiểm: Đóng Kín An Toàn
                </span>
                <span className="flex items-center gap-1 text-cyan-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span> Áp Lực Ống PCCC: 6.2 Bar
                </span>
                <span className="flex items-center gap-1 text-amber-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Điện UPS & Dự Phòng: 100%
                </span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-gray-400 font-mono flex items-center justify-between">
            <span>* Nhấp vào các điểm nhấp nháy trên bản đồ để xem chi tiết Camera AI và điều phối xử lý tức thì.</span>
            <span className="text-[#C5A880]">SLA phản ứng: 3 phút</span>
          </div>
        </div>

        {/* CỘT PHẢI (5 COLS): TRUNG TÂM PHẢN ỨNG NHANH & LIVE SNAPSHOT AI */}
        <div className="lg:col-span-5 bg-[#0E141E] border border-[#222B35] p-4 sm:p-5 space-y-4 flex flex-col justify-between shadow-2xl">
          <div className="space-y-3.5">
            {/* Header Snapshot */}
            <div className="flex items-center justify-between border-b border-[#222B35] pb-2.5">
              <span className="text-xs uppercase tracking-wider text-[#C5A880] font-mono font-bold flex items-center gap-1.5">
                <Eye className="w-4 h-4" /> CAMERA AI SNAPSHOT (YOLOV8)
              </span>
              <span className="px-2 py-0.5 bg-red-950 border border-red-500 text-red-300 text-[10px] font-mono font-bold">
                Độ Tin Cậy AI: {(activeThreat.confidence * 100).toFixed(0)}%
              </span>
            </div>

            {/* Live Camera Snapshot Frame */}
            <div className="relative border-2 border-red-500/70 h-48 overflow-hidden shadow-2xl bg-black">
              <img
                src={activeThreat.snapshot}
                alt={activeThreat.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 bg-black/85 px-2 py-0.5 text-[9px] font-mono text-red-400 border border-red-800">
                LIVE SNAPSHOT • {activeThreat.id}
              </div>
              <div className="absolute bottom-2 right-2 bg-black/85 px-2 py-0.5 text-[9px] font-mono text-gray-300">
                Thời Gian: {activeThreat.time}
              </div>
            </div>

            {/* Thông số chi tiết cảnh báo */}
            <div className="space-y-1.5 text-xs text-gray-300 bg-[#141C28] p-3 border border-[#222B35] font-mono">
              <div className="flex justify-between items-start gap-2">
                <span className="text-gray-400 shrink-0">Sự cố:</span>
                <strong className="text-red-400 font-semibold text-right">{activeThreat.title}</strong>
              </div>
              <div className="flex justify-between items-start gap-2">
                <span className="text-gray-400 shrink-0">Vị trí:</span>
                <span className="text-white text-right">{activeThreat.location}</span>
              </div>
              <div className="flex justify-between items-start gap-2">
                <span className="text-gray-400 shrink-0">Ghi chú AI:</span>
                <span className="text-emerald-300 text-right">{activeThreat.actionHint}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-[#202C3E]">
                <span className="text-gray-400">Mức độ ưu tiên:</span>
                <span className="text-red-400 font-bold uppercase">SLA Level 1 (Khẩn Cấp 3 Phút)</span>
              </div>
            </div>

            {/* Feedback Dispatch Toast */}
            {dispatchStatus && (
              <div className="p-3 bg-blue-950/90 border border-blue-500 text-blue-300 text-xs font-mono animate-fadeIn shadow-lg">
                {dispatchStatus}
              </div>
            )}
          </div>

          {/* Action Control Buttons */}
          <div className="pt-3 border-t border-[#222B35] space-y-2 font-mono">
            <button
              type="button"
              onClick={() => setIsEmergencyActive(!isEmergencyActive)}
              className={`w-full py-3 text-xs uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-2 shadow-lg ${
                isEmergencyActive
                  ? 'bg-red-600 text-white animate-pulse shadow-red-500/50'
                  : 'bg-red-950/90 border border-red-500 text-red-300 hover:bg-red-900'
              }`}
            >
              <Flame className="w-4 h-4" />
              <span>{isEmergencyActive ? 'ĐÃ KÍCH HOẠT BÁO ĐỘNG PCCC TOÀN TÒA NHÀ' : 'Kích Hoạt Chuông Báo PCCC Khẩn Cấp'}</span>
            </button>

            <button 
              type="button"
              onClick={handleDispatchSecurity}
              className="w-full py-2.5 bg-[#1C2533] hover:bg-[#C5A880] text-gray-200 hover:text-[#0D1117] border border-gray-700 hover:border-[#C5A880] text-xs uppercase tracking-wider font-bold transition-colors flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Điều Phối Đội Bảo Vệ Đến Hiện Trường Ngay (SLA 3p)</span>
            </button>
          </div>
        </div>

      </div>

      {/* ============================================================= */}
      {/* 4. NHẬT KÝ SỰ KIỆN VẬN HÀNH THỜI GIAN THỰC (LIVE OPERATION STREAM) */}
      {/* ============================================================= */}
      <div className="p-4 sm:p-5 bg-[#0E141E] border border-[#222B35] space-y-3 shadow-xl">
        <div className="flex items-center justify-between border-b border-[#222B35] pb-2.5">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-white">
            <Activity className="w-4 h-4 text-[#C5A880]" />
            <span>NHẬT KÝ HOẠT ĐỘNG & SỰ KIỆN VẬN HÀNH THỜI GIAN THỰC (BMS AUDIT STREAM)</span>
          </div>
          <span className="text-[11px] text-emerald-400 font-mono">Tự động cập nhật 2s</span>
        </div>

        <div className="space-y-2 text-xs font-mono">
          {[
            {
              time: '01:00:25',
              type: 'ACCESS',
              icon: ShieldCheck,
              iconColor: 'text-emerald-400',
              text: 'Cửa xoay sảnh Tầng 1: Cư dân [Nguyễn Hữu Lực - Căn 12A05] xác thực khuôn mặt sinh trắc học FaceID thành công, thang máy mở quyền Tầng 12.',
              badge: 'BÌNH THƯỜNG'
            },
            {
              time: '00:52:10',
              type: 'PARKING',
              icon: Car,
              iconColor: 'text-cyan-400',
              text: 'Barie hầm B1: Xe ô tô biển số 51G-889.23 đã vào bãi đỗ an toàn, cảm biến siêu âm dẫn đường tới ô đỗ B1-14.',
              badge: 'AN TOÀN'
            },
            {
              time: '00:45:00',
              type: 'WATER',
              icon: Droplets,
              iconColor: 'text-blue-400',
              text: 'Trạm bơm PCCC hầm B2: Áp suất buồng nén ổn định 6.2 bar, van cấp nước trục đứng hoạt động đạt chuẩn kiểm định.',
              badge: 'ĐẠT CHUẨN'
            },
            {
              time: '00:30:15',
              type: 'POWER',
              icon: Zap,
              iconColor: 'text-amber-400',
              text: 'Trạm biến áp trung thế & Máy phát điện Cummins 2500kVA: Tự động chạy chế độ standby, điện áp 3 pha 380V cân bằng.',
              badge: 'STANDBY'
            },
            {
              time: '00:15:00',
              type: 'PCCC',
              icon: Flame,
              iconColor: 'text-emerald-400',
              text: 'Hệ thống quạt hút khói tăng áp buồng thang thoát hiểm: Áp suất dương duy trì 50 Pa theo tiêu chuẩn QCVN 06:2022/BXD.',
              badge: 'AN TOÀN'
            }
          ].map((event, idx) => {
            const Icon = event.icon;
            return (
              <div 
                key={idx}
                className="p-2.5 bg-[#121822] border border-[#1E293B] hover:border-[#2D3B4E] transition-colors flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-gray-400 shrink-0 text-[10.5px]">{event.time}</span>
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${event.iconColor}`} />
                  <span className="text-gray-200 truncate text-[11.5px]">{event.text}</span>
                </div>
                <span className="px-2 py-0.5 text-[9.5px] bg-[#16202D] border border-gray-700 text-emerald-300 shrink-0">
                  {event.badge}
                </span>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
