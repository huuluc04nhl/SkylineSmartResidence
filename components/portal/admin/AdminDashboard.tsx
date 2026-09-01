'use client';

import React, { useState } from 'react';
import { 
  DEMO_SECURITY_ALERTS, 
  DEMO_TICKETS, 
  DEMO_BILLS, 
  DEMO_DEVICES,
  SecurityAlert 
} from '@/lib/dataStore';
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
  CornerUpLeft,
  CornerDownRight
} from 'lucide-react';

interface ThreatItem {
  id: string;
  type: 'FIRE' | 'WATER' | 'INTRUSION' | 'PARKING';
  title: string;
  shortTag: string;
  location: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  confidence: number;
  snapshot: string;
  time: string;
  pin: { x: number; y: number }; // In percentage 0-100
  elbow: { x: number; y: number }; // In percentage 0-100
  callout: { x: number; y: number; align: 'left' | 'right' }; // Position for floating callout stick
}

interface FloorThreatData {
  floor: 'B1' | 'L1' | '12' | '25';
  floorName: string;
  threatLevel: 'NORMAL' | 'WARNING' | 'CRITICAL';
  activeNodes: number;
  threats: ThreatItem[];
}

const FLOOR_THREAT_DATABASE: Record<string, FloorThreatData> = {
  B1: {
    floor: 'B1',
    floorName: 'Hầm B1 - Bãi Đỗ Xe & Trạm Kỹ Thuật PCCC',
    threatLevel: 'CRITICAL',
    activeNodes: 28,
    threats: [
      {
        id: 'T-B1-01',
        type: 'FIRE',
        title: 'Camera AI Phát Hiện Tụ Điểm Khói Ngầm (96%)',
        shortTag: '🔴 Tụ điểm khói ngầm (96%) • CAM-B1-08',
        location: 'Khu Vực Đỗ Xe Ô Tô Block A (Cột B1-08)',
        severity: 'HIGH',
        confidence: 0.96,
        snapshot: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600',
        time: '13:42:15',
        pin: { x: 42, y: 46 },
        elbow: { x: 30, y: 22 },
        callout: { x: 8, y: 18, align: 'left' }
      },
      {
        id: 'T-B1-02',
        type: 'PARKING',
        title: 'Cảnh Báo Đỗ Xe Sai Vị Trí / Chắn Lối Thoát Hiểm',
        shortTag: '⚠️ Đỗ xe sai vị trí • Cửa B1-North',
        location: 'Lối Thoát Nạn Cửa B1-North',
        severity: 'MEDIUM',
        confidence: 0.89,
        snapshot: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=600',
        time: '13:30:00',
        pin: { x: 68, y: 58 },
        elbow: { x: 78, y: 76 },
        callout: { x: 55, y: 78, align: 'right' }
      }
    ]
  },
  L1: {
    floor: 'L1',
    floorName: 'Tầng 1 - Sảnh Grand Lobby & Lễ Tân',
    threatLevel: 'NORMAL',
    activeNodes: 24,
    threats: [
      {
        id: 'T-L1-01',
        type: 'INTRUSION',
        title: 'Cửa Thoát Hiểm Cầu Thang Bộ Mở Quá 5 Phút',
        shortTag: '⚠️ Cửa thoát hiểm Stair-02 mở > 5p',
        location: 'Sảnh Đón Tháp B (Cửa Stair-02)',
        severity: 'LOW',
        confidence: 0.92,
        snapshot: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=600',
        time: '13:15:00',
        pin: { x: 30, y: 52 },
        elbow: { x: 20, y: 26 },
        callout: { x: 8, y: 22, align: 'left' }
      }
    ]
  },
  '12': {
    floor: '12',
    floorName: 'Tầng 12 - Hành Lang Căn Hộ (12A01 - 12A08)',
    threatLevel: 'WARNING',
    activeNodes: 18,
    threats: [
      {
        id: 'T-12-01',
        type: 'WATER',
        title: 'Cảm Biến AI Phát Hiện Áp Lực Nước Bất Thường (+115%)',
        shortTag: '💧 Áp lực nước trục 12A05 (+115%)',
        location: 'Trục Kỹ Thuật Căn 12A05',
        severity: 'MEDIUM',
        confidence: 0.94,
        snapshot: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600',
        time: '12:50:20',
        pin: { x: 62, y: 44 },
        elbow: { x: 74, y: 22 },
        callout: { x: 52, y: 18, align: 'right' }
      }
    ]
  },
  '25': {
    floor: '25',
    floorName: 'Tầng 25 - Tiện Ích Sky Pool, Panorama Gym & BBQ',
    threatLevel: 'NORMAL',
    activeNodes: 20,
    threats: []
  }
};

export default function AdminDashboard() {
  const [selectedFloor, setSelectedFloor] = useState<'B1' | 'L1' | '12' | '25'>('B1');
  const [selectedThreatId, setSelectedThreatId] = useState<string>('T-B1-01');
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);

  const currentFloorData = FLOOR_THREAT_DATABASE[selectedFloor];
  const activeThreat = currentFloorData.threats.find(t => t.id === selectedThreatId) || currentFloorData.threats[0] || {
    id: 'NONE',
    type: 'FIRE' as const,
    title: 'Không Có Sự Cố An Ninh Nào Tại Tầng Này',
    shortTag: 'Mọi khu vực đều an toàn',
    location: currentFloorData.floorName,
    severity: 'LOW' as const,
    confidence: 1.0,
    snapshot: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600',
    time: 'Bình thường',
    pin: { x: 50, y: 50 },
    elbow: { x: 50, y: 50 },
    callout: { x: 50, y: 50, align: 'left' as const }
  };

  const handleDispatchSecurity = () => {
    setDispatchStatus(`📡 LỆNH ĐIỀU ĐỘNG: Đã phát lệnh phản ứng nhanh tới Đội Bảo Vệ Trực Ban tại ${currentFloorData.floorName} (Cam kết có mặt & xử lý trong 3 phút theo chuẩn SLA BQL)!`);
    setTimeout(() => setDispatchStatus(null), 6000);
  };

  return (
    <div className="space-y-8 animate-fadeIn select-none">
      {/* Module Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222B35] pb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-bold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Module 3.2.6 & 3.2.10 • SRS Central Command
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl text-white font-bold mt-1 tracking-wide">
            Trung Tâm Vận Hành & Bản Đồ Cảnh Báo Toàn Tòa Nhà
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Giám sát 24/7 toàn bộ hạ tầng BMS, Bản đồ đe dọa đa tầng, Thị giác máy tính YOLOv8 & Radar PCCC
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs flex-shrink-0">
          <span className="flex items-center gap-2 px-3 py-1.5 bg-[#121820] border border-emerald-500/80 text-emerald-400 font-mono rounded shadow">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>Vision AI Radar: ACTIVE (90 Cảm Biến)</span>
          </span>
        </div>
      </div>

      {/* 4 Core Building KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="p-5 bg-[#121820] border border-[#222B35] space-y-2 hover:border-[#C5A880]/60 transition-colors shadow-lg rounded">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Doanh Thu Quản Lý Tháng 08/2026</span>
            <Receipt className="w-4 h-4 text-[#C5A880]" />
          </div>
          <div className="font-serif text-2xl text-white font-bold">1.845.200.000 đ</div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
            <TrendingUp className="w-3.5 h-3.5" /> +8.4% so với tháng trước
          </div>
        </div>

        {/* KPI 2 */}
        <div className="p-5 bg-[#121820] border border-[#222B35] space-y-2 hover:border-[#C5A880]/60 transition-colors shadow-lg rounded">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Tỷ Lệ Thu Hồi Phí Tòa Nhà</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-serif text-2xl text-white font-bold">94.8%</div>
          <div className="text-[11px] text-gray-400 font-mono">Còn 12 căn hộ chưa thanh toán</div>
        </div>

        {/* KPI 3 */}
        <div className="p-5 bg-[#121820] border border-[#222B35] space-y-2 hover:border-[#C5A880]/60 transition-colors shadow-lg rounded">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Sự Cố Kỹ Thuật Hạ Tầng (Kanban)</span>
            <Wrench className="w-4 h-4 text-amber-400" />
          </div>
          <div className="font-serif text-2xl text-white font-bold">03 Phiếu</div>
          <div className="text-[11px] text-amber-400 flex items-center gap-1 font-mono">
            <AlertTriangle className="w-3.5 h-3.5" /> Đang điều phối kỹ sư theo SLA 60p
          </div>
        </div>

        {/* KPI 4 */}
        <div className="p-5 bg-[#121820] border border-[#222B35] space-y-2 hover:border-[#C5A880]/60 transition-colors shadow-lg rounded">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Sức Chứa Bãi Xe Hầm B1 (ALPR)</span>
            <Car className="w-4 h-4 text-[#C5A880]" />
          </div>
          <div className="font-serif text-2xl text-white font-bold">88% / 100%</div>
          <div className="text-[11px] text-emerald-400 font-mono">Còn 42 chỗ đỗ ô tô & 120 chỗ xe máy</div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MAIN SECTION: LIVE BUILDING THREAT MAP & VISION AI RADAR      */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Multi-Floor Security & PCCC Warning Map */}
        <div className="lg:col-span-7 bg-[#121820] border border-[#222B35] p-5 space-y-4 shadow-xl rounded">
          {/* Top Floor Switcher & Threat Level */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222B35] pb-3">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-red-500 animate-pulse" />
              <span className="font-serif text-base text-white font-bold">
                Bản Đồ Cảnh Báo An Ninh Đa Tầng (Live Threat Radar)
              </span>
            </div>

            {/* Floor Switcher */}
            <div className="flex gap-1 border border-[#2D3748] bg-[#0D1117] p-0.5 rounded">
              {(['B1', 'L1', '12', '25'] as const).map((floor) => {
                const fData = FLOOR_THREAT_DATABASE[floor];
                const hasCritical = fData.threatLevel === 'CRITICAL';
                const hasWarning = fData.threatLevel === 'WARNING';
                return (
                  <button
                    key={floor}
                    type="button"
                    onClick={() => {
                      setSelectedFloor(floor);
                      if (fData.threats.length > 0) {
                        setSelectedThreatId(fData.threats[0].id);
                      }
                    }}
                    className={`px-3 py-1 text-xs font-mono font-bold transition-all rounded relative ${
                      selectedFloor === floor
                        ? 'bg-[#C5A880] text-[#0D1117] shadow'
                        : 'text-gray-400 hover:bg-[#1C2533] hover:text-white'
                    }`}
                  >
                    <span>Tầng {floor}</span>
                    {hasCritical && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></span>
                    )}
                    {hasWarning && !hasCritical && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current Floor Threat Status Banner */}
          <div className="flex items-center justify-between px-3.5 py-2 bg-[#0D1117] border border-[#222B35] text-xs font-mono rounded">
            <div className="flex items-center gap-2">
              <Building className="w-3.5 h-3.5 text-[#C5A880]" />
              <span className="text-white font-bold">{currentFloorData.floorName}</span>
            </div>
            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
              currentFloorData.threatLevel === 'CRITICAL'
                ? 'bg-red-950 text-red-300 border border-red-500'
                : currentFloorData.threatLevel === 'WARNING'
                  ? 'bg-amber-950 text-amber-300 border border-amber-500'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-500'
            }`}>
              {currentFloorData.threatLevel === 'CRITICAL' ? '⚠️ NGUY HIỂM CAO' : currentFloorData.threatLevel === 'WARNING' ? '⚡ CẢNH BÁO' : '🟢 BÌNH THƯỜNG'}
            </span>
          </div>

          {/* Sơ đồ radar mặt bằng tòa nhà tương tác với STICK LEADER LINES */}
          <div className="relative h-[390px] bg-[#070A0F] border border-[#222B35] overflow-hidden rounded">
            {/* Background architectural grid */}
            <div 
              className="absolute inset-0 opacity-25 pointer-events-none"
              style={{
                backgroundImage: 'linear-gradient(to right, #1E293B 1px, transparent 1px), linear-gradient(to bottom, #1E293B 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }}
            />

            {/* Simulated Floor Outline */}
            <div className="absolute inset-4 border-2 border-dashed border-gray-800 bg-[#0D1117]/70 rounded p-3 flex flex-col justify-between shadow-2xl pointer-events-none">
              {/* Floor Header Label */}
              <div className="flex justify-between items-center text-[10px] font-mono text-gray-400 border-b border-gray-800/80 pb-1">
                <span className="text-[#C5A880] font-bold">Khu Vực: Trục Tháp Sapphire (Tầng {selectedFloor})</span>
                <span>Cảm Biến IoT: {currentFloorData.activeNodes} Nodes Active</span>
              </div>

              {/* Central Infrastructure Box (Spaced cleanly) */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-2.5 bg-[#121820]/95 border border-gray-700/80 text-[10px] font-mono text-gray-300 text-center rounded shadow-xl">
                <div className="font-bold text-white flex items-center justify-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Trục 06 Thang Máy Schindler
                </div>
                <div className="text-[8px] text-emerald-400 mt-0.5">Tốc độ: 4.0 m/s • Tải: Bình thường</div>
              </div>

              {/* Zone Landmarks */}
              <div className="flex justify-between items-end text-[9px] font-mono text-gray-400 pt-1 border-t border-gray-800/80">
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Cửa Thoát Hiểm N-01: Đóng
                </span>
                <span className="flex items-center gap-1 text-blue-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Bơm Áp Lực PCCC: 6.2 Bar
                </span>
                <span className="flex items-center gap-1 text-amber-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Nguồn UPS: 100%
                </span>
              </div>
            </div>

            {/* SVG OVERLAY: Tactical HUD Leader Sticks (Đường que chỉ hướng không bị chồng) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
              <defs>
                <filter id="glowRed" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {currentFloorData.threats.map((threat) => {
                const isSelected = activeThreat.id === threat.id;
                const strokeColor = threat.severity === 'HIGH' ? '#EF4444' : '#F59E0B';
                return (
                  <g key={`stick-${threat.id}`} className="transition-all duration-300">
                    {/* Leader Line: Pin -> Elbow -> Callout */}
                    <polyline
                      points={`${threat.pin.x}%,${threat.pin.y}% ${threat.elbow.x}%,${threat.elbow.y}% ${threat.callout.x}%,${threat.elbow.y}%`}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={isSelected ? '2' : '1.5'}
                      strokeDasharray={isSelected ? 'none' : '4 2'}
                      opacity={isSelected ? 1 : 0.75}
                    />
                    {/* Anchor Dot on Pin */}
                    <circle
                      cx={`${threat.pin.x}%`}
                      cy={`${threat.pin.y}%`}
                      r={isSelected ? 4 : 3}
                      fill={strokeColor}
                    />
                    {/* Anchor Dot on Elbow */}
                    <circle
                      cx={`${threat.elbow.x}%`}
                      cy={`${threat.elbow.y}%`}
                      r="2.5"
                      fill={strokeColor}
                    />
                  </g>
                );
              })}
            </svg>

            {/* INTERACTIVE THREAT PINS & FLOATING CALLOUT STICKS */}
            {currentFloorData.threats.map((threat) => {
              const isSelected = activeThreat.id === threat.id;
              const isHigh = threat.severity === 'HIGH';

              return (
                <React.Fragment key={threat.id}>
                  {/* 1. Pulsing Hotspot Circle at (pin.x, pin.y) */}
                  <div
                    onClick={() => setSelectedThreatId(threat.id)}
                    style={{ left: `${threat.pin.x}%`, top: `${threat.pin.y}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group"
                  >
                    <div className="relative flex items-center justify-center">
                      <span className={`w-8 h-8 rounded-full absolute ${
                        isHigh ? 'bg-red-600/50 animate-ping' : 'bg-amber-500/50 animate-pulse'
                      }`} />
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs text-white font-bold shadow-2xl border-2 border-white transition-transform group-hover:scale-110 ${
                        isHigh ? 'bg-red-600' : 'bg-amber-500'
                      } ${isSelected ? 'ring-4 ring-white' : ''}`}>
                        !
                      </span>
                    </div>
                  </div>

                  {/* 2. Floating Callout Card Pointed by the Leader Stick */}
                  <div
                    onClick={() => setSelectedThreatId(threat.id)}
                    style={{ 
                      left: `${threat.callout.x}%`, 
                      top: `${threat.elbow.y}%`,
                      transform: 'translateY(-50%)'
                    }}
                    className={`absolute z-30 cursor-pointer transition-all duration-300 ${
                      isSelected
                        ? 'scale-105 shadow-[0_0_20px_rgba(239,68,68,0.5)] ring-1 ring-white'
                        : 'opacity-90 hover:opacity-100 hover:scale-102'
                    }`}
                  >
                    <div className={`px-3 py-1.5 rounded text-[10px] font-mono flex items-center gap-2 border shadow-2xl backdrop-blur-md ${
                      isHigh
                        ? 'bg-[#180A0A]/95 border-red-500 text-red-200'
                        : 'bg-[#18140A]/95 border-amber-500 text-amber-200'
                    }`}>
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isHigh ? 'bg-red-500 animate-pulse' : 'bg-amber-400'}`} />
                      <span className="font-bold tracking-tight whitespace-nowrap">{threat.shortTag}</span>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}

            {/* Background Normal Sensors (Evenly Distributed, Zero Overlap) */}
            <div className="absolute top-1/4 left-1/4 flex items-center gap-1 text-[9px] text-emerald-400 font-mono pointer-events-none opacity-60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Sensor Smoke-01
            </div>
            <div className="absolute bottom-1/4 left-1/4 flex items-center gap-1 text-[9px] text-emerald-400 font-mono pointer-events-none opacity-60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Barrier-Gate 02
            </div>
            <div className="absolute top-1/4 right-1/4 flex items-center gap-1 text-[9px] text-emerald-400 font-mono pointer-events-none opacity-60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Cam-AI-14
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
            <span>* Đường que (Leader Stick) chỉ rõ vị trí cảm biến AI phát hiện sự cố theo từng hướng riêng biệt.</span>
          </div>
        </div>

        {/* Right 5 Cols: Live Snapshot & Incident Command Center */}
        <div className="lg:col-span-5 bg-[#121820] border border-[#222B35] p-5 space-y-4 flex flex-col justify-between shadow-xl rounded">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between border-b border-[#222B35] pb-2.5">
              <span className="text-xs uppercase tracking-wider text-[#C5A880] font-bold flex items-center gap-1.5">
                <Eye className="w-4 h-4" /> Snapshot Thị Giác Máy Tính (YOLOv8)
              </span>
              <span className="px-2 py-0.5 bg-red-950 border border-red-500 text-red-300 text-[10px] font-mono font-bold rounded">
                Độ Tin Cậy: {(activeThreat.confidence * 100).toFixed(0)}%
              </span>
            </div>

            {/* Snapshot Image with AI Bounding Box Frame */}
            <div className="relative border-2 border-red-500/60 h-44 overflow-hidden shadow-2xl rounded">
              <img
                src={activeThreat.snapshot}
                alt="Camera AI Snapshot"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 bg-black/90 px-2 py-0.5 text-[9px] font-mono text-red-400 border border-red-800 rounded">
                LIVE SNAPSHOT • ID: {activeThreat.id}
              </div>
              <div className="absolute bottom-2 right-2 bg-black/90 px-2 py-0.5 text-[9px] font-mono text-gray-300 rounded">
                Thời Gian: {activeThreat.time}
              </div>
            </div>

            {/* Threat Description Specs */}
            <div className="space-y-1.5 text-xs text-gray-300 bg-[#161B22] p-3 border border-[#222B35] rounded">
              <div className="flex justify-between">
                <span className="text-gray-400">Tiêu đề sự cố:</span>
                <strong className="text-red-400 uppercase font-semibold text-right max-w-[200px] truncate">{activeThreat.title}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Vị trí xảy ra:</span>
                <span className="font-mono text-white text-right">{activeThreat.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Mức độ ưu tiên:</span>
                <span className="font-mono font-bold text-red-400 uppercase">SLA Level 1 (Khẩn Cấp)</span>
              </div>
            </div>

            {/* Feedback Dispatch Toast */}
            {dispatchStatus && (
              <div className="p-3 bg-blue-950/90 border border-blue-500 text-blue-300 text-xs font-mono animate-fadeIn rounded shadow-lg">
                {dispatchStatus}
              </div>
            )}
          </div>

          {/* Action Control Buttons */}
          <div className="pt-3 border-t border-[#222B35] space-y-2">
            <button
              onClick={() => setIsEmergencyActive(!isEmergencyActive)}
              className={`w-full py-3 text-xs uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-2 rounded shadow ${
                isEmergencyActive
                  ? 'bg-red-600 text-white animate-pulse shadow-red-500/50'
                  : 'bg-red-950/90 border border-red-500 text-red-300 hover:bg-red-900'
              }`}
            >
              <Flame className="w-4 h-4" />
              {isEmergencyActive ? 'ĐÃ KÍCH HOẠT CHUÔNG BÁO PCCC TOÀN TÒA NHÀ' : 'Kích Hoạt Chuông Báo PCCC Khẩn Cấp'}
            </button>

            <button 
              onClick={handleDispatchSecurity}
              className="w-full py-2.5 bg-[#1C2533] hover:bg-[#C5A880] hover:text-[#0D1117] border border-gray-700 hover:border-[#C5A880] text-gray-200 text-xs uppercase tracking-wider font-bold transition-colors rounded flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              Điều Phối Đội Bảo Vệ Đến Hiện Trường Ngay (SLA 3p)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
