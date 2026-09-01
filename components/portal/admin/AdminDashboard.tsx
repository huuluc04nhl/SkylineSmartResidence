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
  AlertCircle
} from 'lucide-react';

interface ThreatItem {
  id: string;
  code: string;
  type: 'FIRE' | 'WATER' | 'INTRUSION' | 'PARKING';
  title: string;
  location: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  confidence: number;
  snapshot: string;
  time: string;
  cx: number;
  cy: number;
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
        code: 'CAM-B1-08',
        type: 'FIRE',
        title: 'Tụ Điểm Khói Ngầm (Vision AI YOLOv8)',
        location: 'Khu Vực Bãi Xe Block A (Cột B1-08)',
        severity: 'HIGH',
        confidence: 0.96,
        snapshot: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600',
        time: '13:42:15',
        cx: 260,
        cy: 160
      },
      {
        id: 'T-B1-02',
        code: 'CAM-B1-14',
        type: 'PARKING',
        title: 'Đỗ Xe Trái Phép Chắn Lối Thoát Hiểm',
        location: 'Lối Thoát Nạn Cửa B1-North',
        severity: 'MEDIUM',
        confidence: 0.89,
        snapshot: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=600',
        time: '13:30:00',
        cx: 520,
        cy: 220
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
        code: 'CAM-L1-02',
        type: 'INTRUSION',
        title: 'Cửa Thoát Hiểm Cầu Thang Mở Quá 5 Phút',
        location: 'Sảnh Đón Tháp B (Cửa Stair-02)',
        severity: 'LOW',
        confidence: 0.92,
        snapshot: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=600',
        time: '13:15:00',
        cx: 220,
        cy: 180
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
        code: 'SENSOR-H2O-12',
        type: 'WATER',
        title: 'Áp Lực Nước Bất Thường (+115%)',
        location: 'Hộp Trục Kỹ Thuật Căn 12A05',
        severity: 'MEDIUM',
        confidence: 0.94,
        snapshot: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600',
        time: '12:50:20',
        cx: 440,
        cy: 150
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
    code: 'SYSTEM-OK',
    type: 'FIRE' as const,
    title: 'Không Có Sự Cố An Ninh Nào',
    location: currentFloorData.floorName,
    severity: 'LOW' as const,
    confidence: 1.0,
    snapshot: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600',
    time: 'Bình thường',
    cx: 350,
    cy: 150
  };

  const handleDispatchSecurity = () => {
    setDispatchStatus(`📡 LỆNH ĐIỀU ĐỘNG: Đã phát lệnh phản ứng nhanh tới Đội Bảo Vệ Trực Ban tại ${currentFloorData.floorName} (Cam kết có mặt trong 3 phút theo chuẩn SLA BQL)!`);
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
          {/* Top Floor Switcher & Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222B35] pb-3">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-red-500 animate-pulse flex-shrink-0" />
              <span className="font-serif text-base text-white font-bold">
                Bản Đồ Cảnh Báo An Ninh Đa Tầng
              </span>
            </div>

            {/* Floor Switcher with clean indicators (No overflowing pings) */}
            <div className="flex gap-1.5 bg-[#0D1117] p-1 border border-[#2D3748] rounded">
              {(['B1', 'L1', '12', '25'] as const).map((floor) => {
                const fData = FLOOR_THREAT_DATABASE[floor];
                const hasCritical = fData.threatLevel === 'CRITICAL';
                const hasWarning = fData.threatLevel === 'WARNING';
                const isSelected = selectedFloor === floor;
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
                    className={`px-3 py-1.5 text-xs font-mono font-bold transition-all rounded flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#C5A880] text-[#0D1117] shadow'
                        : 'text-gray-300 hover:bg-[#1C2533] hover:text-white'
                    }`}
                  >
                    <span>Tầng {floor}</span>
                    {hasCritical && (
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    )}
                    {hasWarning && !hasCritical && (
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current Floor Threat Status Banner */}
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#0D1117] border border-[#222B35] text-xs font-mono rounded">
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

          {/* Clean Vector SVG Blueprint Radar (Zero Overlapping Text) */}
          <div className="relative h-72 sm:h-80 bg-[#070A0F] border border-[#222B35] flex items-center justify-center overflow-hidden rounded">
            <svg
              viewBox="0 0 700 300"
              className="w-full h-full p-3 cursor-pointer"
            >
              <defs>
                <pattern id="radarGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="0" x2="20" y2="0" stroke="#1E293B" strokeWidth="0.8" opacity="0.4" />
                  <line x1="0" y1="0" x2="0" y2="20" stroke="#1E293B" strokeWidth="0.8" opacity="0.4" />
                </pattern>
              </defs>

              {/* Background Grid */}
              <rect width="700" height="300" fill="url(#radarGrid)" />

              {/* Main Floor Outer Boundary Wall */}
              <rect x="30" y="20" width="640" height="260" rx="8" fill="#0D1117" stroke="#334155" strokeWidth="2" strokeDasharray="8 4" />

              {/* Zone A: North Stairwell */}
              <g transform="translate(50, 40)">
                <rect width="160" height="55" rx="4" fill="#161B22" stroke="#475569" strokeWidth="1" />
                <text x="80" y="32" fill="#94A3B8" fontSize="10" fontFamily="monospace" textAnchor="middle">
                  CẦU THANG THOÁT N-01
                </text>
              </g>

              {/* Zone B: Central Elevator Core (Schindler Hub) */}
              <g transform="translate(260, 40)">
                <rect width="200" height="55" rx="4" fill="#1C2533" stroke="#64748B" strokeWidth="1.2" />
                <text x="100" y="26" fill="#FFFFFF" fontSize="10" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                  TRỤC 06 THANG MÁY
                </text>
                <text x="100" y="42" fill="#10B981" fontSize="9" fontFamily="monospace" textAnchor="middle">
                  4.0 m/s • Tải: Bình Thường
                </text>
              </g>

              {/* Zone C: South Fire Hydrant & Pump Valve */}
              <g transform="translate(480, 40)">
                <rect width="170" height="55" rx="4" fill="#161B22" stroke="#475569" strokeWidth="1" />
                <text x="85" y="32" fill="#94A3B8" fontSize="10" fontFamily="monospace" textAnchor="middle">
                  HỘP HỌNG NƯỚC PCCC S-02
                </text>
              </g>

              {/* Main Area Blueprint Partition */}
              <rect x="50" y="115" width="600" height="145" rx="6" fill="#10151E" stroke="#1E293B" strokeWidth="1.5" />
              <text x="70" y="135" fill="#64748B" fontSize="10" fontFamily="monospace" fontWeight="bold">
                KHU VỰC CHÍNH • {currentFloorData.floorName.toUpperCase()}
              </text>

              {/* Normal Static IoT Nodes (Green dots with clean labels) */}
              <g transform="translate(100, 210)">
                <circle cx="0" cy="0" r="5" fill="#10B981" />
                <text x="12" y="4" fill="#10B981" fontSize="9" fontFamily="monospace">Smoke-Sensor 01</text>
              </g>

              <g transform="translate(290, 210)">
                <circle cx="0" cy="0" r="5" fill="#10B981" />
                <text x="12" y="4" fill="#10B981" fontSize="9" fontFamily="monospace">Barrier-Gate 02</text>
              </g>

              <g transform="translate(480, 210)">
                <circle cx="0" cy="0" r="5" fill="#10B981" />
                <text x="12" y="4" fill="#10B981" fontSize="9" fontFamily="monospace">Cam-AI-14</text>
              </g>

              {/* Active Threat Pins on Blueprint Canvas */}
              {currentFloorData.threats.map((threat, idx) => {
                const isSelected = activeThreat.id === threat.id;
                const isHigh = threat.severity === 'HIGH';
                return (
                  <g
                    key={threat.id}
                    transform={`translate(${threat.cx}, ${threat.cy})`}
                    onClick={() => setSelectedThreatId(threat.id)}
                    className="cursor-pointer"
                  >
                    {/* Ping Radar Ring */}
                    <circle
                      cx="0" cy="0" r={isSelected ? 26 : 20}
                      fill="none"
                      stroke={isHigh ? '#EF4444' : '#F59E0B'}
                      strokeWidth="2"
                      opacity="0.6"
                      className="animate-ping"
                    />

                    {/* Outer Glow Halo */}
                    <circle
                      cx="0" cy="0" r="18"
                      fill={isHigh ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.25)'}
                    />

                    {/* Solid Pin Circle */}
                    <circle
                      cx="0" cy="0" r="13"
                      fill={isHigh ? '#DC2626' : '#D97706'}
                      stroke="#FFFFFF"
                      strokeWidth={isSelected ? '3' : '1.5'}
                    />

                    {/* Numeric Alert Indicator Text */}
                    <text
                      x="0" y="4"
                      fill="#FFFFFF"
                      fontSize="10"
                      fontWeight="bold"
                      textAnchor="middle"
                      fontFamily="monospace"
                    >
                      !
                    </text>

                    {/* Clean Code Tag under the pin */}
                    <rect x="-32" y="16" width="64" height="16" rx="3" fill="#0D1117" stroke={isHigh ? '#EF4444' : '#F59E0B'} strokeWidth="1" />
                    <text x="0" y="28" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                      {threat.code}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Active Incidents Quick List (No Text Overlap inside Canvas) */}
          <div className="space-y-2 pt-1">
            <div className="text-[11px] font-mono text-gray-400 uppercase tracking-wider flex items-center justify-between">
              <span>Danh Sách Điểm Cảnh Báo Phát Hiện ({currentFloorData.threats.length})</span>
              <span className="text-gray-500">* Nhấp vào sự cố để xem chi tiết camera AI</span>
            </div>

            {currentFloorData.threats.length === 0 ? (
              <div className="p-3 bg-[#0D1117] border border-[#222B35] rounded text-center text-xs text-emerald-400 font-mono">
                ✓ Toàn bộ khu vực tầng này đang hoạt động an toàn, không có đe dọa an ninh.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {currentFloorData.threats.map((threat) => {
                  const isSelected = activeThreat.id === threat.id;
                  const isHigh = threat.severity === 'HIGH';
                  return (
                    <div
                      key={threat.id}
                      onClick={() => setSelectedThreatId(threat.id)}
                      className={`p-2.5 border rounded cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#1C2533] border-[#C5A880] ring-1 ring-[#C5A880]'
                          : 'bg-[#0D1117] border-[#222B35] hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-2 overflow-hidden pr-2">
                        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isHigh ? 'bg-red-500 animate-pulse' : 'bg-amber-400'}`} />
                        <div className="truncate">
                          <div className="text-xs font-bold text-white truncate">{threat.title}</div>
                          <div className="text-[10px] text-gray-400 font-mono truncate">{threat.location}</div>
                        </div>
                      </div>
                      <span className="px-1.5 py-0.5 bg-[#121820] border border-gray-700 text-gray-300 text-[9px] font-mono rounded flex-shrink-0">
                        {threat.code}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
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
                LIVE SNAPSHOT • MÃ: {activeThreat.code}
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
                <span className="font-mono text-white text-right truncate max-w-[220px]">{activeThreat.location}</span>
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
