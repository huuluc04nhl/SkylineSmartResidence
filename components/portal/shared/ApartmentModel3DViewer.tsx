'use client';

import React, { useState } from 'react';
import { 
  Box, 
  Layers, 
  Eye, 
  Maximize2, 
  RotateCw, 
  Zap, 
  Cpu, 
  Wind, 
  Droplets, 
  Lock, 
  Sparkles, 
  Sun, 
  ShieldCheck, 
  Grid, 
  Move,
  Flame,
  Info,
  Radio
} from 'lucide-react';

export type ViewMode = '3D_ISOMETRIC' | '2D_CAD' | 'XRAY_IOT';
export type ViewAngle = 'SOUTH_WEST' | 'NORTH_EAST' | 'TOP_DOWN';

export interface RoomDetails {
  id: string;
  name: string;
  nameEn: string;
  area: number; // m2
  color: string;
  temperature: number;
  humidity: number;
  lightState: boolean;
  devices: string[];
}

interface ApartmentModel3DViewerProps {
  apartmentCode?: string;
  apartmentType?: string;
  clearArea?: number;
  lights?: {
    livingRoom: boolean;
    bedroomMaster: boolean;
    kitchen: boolean;
    balcony: boolean;
  };
  acPower?: boolean;
  acTemp?: number;
  curtainsOpen?: boolean;
  doorLocked?: boolean;
  waterLeakActive?: boolean;
  onToggleLight?: (room: 'livingRoom' | 'bedroomMaster' | 'kitchen' | 'balcony') => void;
  onToggleDoor?: () => void;
  onToggleCurtains?: () => void;
  interactive?: boolean;
}

export default function ApartmentModel3DViewer({
  apartmentCode = '12A05',
  apartmentType = '2PN - 2WC (Luxury Corner)',
  clearArea = 78.5,
  lights = { livingRoom: true, bedroomMaster: true, kitchen: true, balcony: false },
  acPower = true,
  acTemp = 24,
  curtainsOpen = true,
  doorLocked = true,
  waterLeakActive = true,
  onToggleLight,
  onToggleDoor,
  onToggleCurtains,
  interactive = true
}: ApartmentModel3DViewerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('3D_ISOMETRIC');
  const [viewAngle, setViewAngle] = useState<ViewAngle>('SOUTH_WEST');
  const [selectedRoom, setSelectedRoom] = useState<string | null>('living');
  const [showDimensions, setShowDimensions] = useState(true);
  const [showIotNodes, setShowIotNodes] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Room catalog with architectural data
  const rooms: Record<string, RoomDetails> = {
    living: {
      id: 'living',
      name: 'Phòng Khách & Sinh Hoạt Chung',
      nameEn: 'Grand Living Lounge',
      area: 28.6,
      color: '#C5A880',
      temperature: acTemp,
      humidity: 56,
      lightState: lights.livingRoom,
      devices: ['Smart Ambient LED Bar (Dimmable)', 'Daikin VRV Inverter AC', 'Smart 4K TV 75"']
    },
    masterBed: {
      id: 'masterBed',
      name: 'Phòng Ngủ Master',
      nameEn: 'Master Suite',
      area: 18.2,
      color: '#818CF8',
      temperature: acTemp - 1,
      humidity: 58,
      lightState: lights.bedroomMaster,
      devices: ['Đèn Ngủ Cảm Ứng SleepMode', 'Cảm Biến Hiện Diện mmWave', 'Rèm Thông Minh Tự Động']
    },
    secondBed: {
      id: 'secondBed',
      name: 'Phòng Ngủ Phụ / Studio',
      nameEn: 'Guest Suite / Workspace',
      area: 12.4,
      color: '#38BDF8',
      temperature: 25,
      humidity: 60,
      lightState: true,
      devices: ['Đèn Bàn Công Tắc Cảm Ứng', 'Cảm Biến Khói Thông Minh']
    },
    kitchen: {
      id: 'kitchen',
      name: 'Bếp & Đảo Bếp Gourmet',
      nameEn: 'Open Kitchen & Dining',
      area: 11.5,
      color: '#F59E0B',
      temperature: 26,
      humidity: 52,
      lightState: lights.kitchen,
      devices: ['Bếp Từ Bosch 3 Vùng Nấu', 'Hệ Thống Hút Mùi Tự Động', 'Cảm Biến Rò Rỉ Nước IoT']
    },
    balcony: {
      id: 'balcony',
      name: 'Ban Công Panorama Sky View',
      nameEn: 'Skyline Terrace',
      area: 7.8,
      color: '#10B981',
      temperature: 29,
      humidity: 68,
      lightState: lights.balcony,
      devices: ['Hệ Thống Rèm Chắn Nắng Thông Minh', 'Cảm Biến Mưa & Gió']
    }
  };

  const activeRoomData = selectedRoom ? rooms[selectedRoom] : rooms['living'];

  return (
    <div className="w-full bg-[#0A0E14] border border-[#222B35] rounded shadow-2xl flex flex-col overflow-hidden select-none">
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP TOOLBAR: VIEW CONTROLS & CAMERA ANGLES                */}
      {/* ------------------------------------------------------------- */}
      <div className="p-3 bg-gradient-to-r from-[#121820] via-[#161D26] to-[#121820] border-b border-[#222B35] flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Mode Tabs */}
        <div className="flex items-center gap-1.5 bg-[#0D1117] p-1 border border-[#222B35] rounded">
          <button
            type="button"
            onClick={() => setViewMode('3D_ISOMETRIC')}
            className={`px-3 py-1.5 font-bold uppercase tracking-wider text-[10px] rounded flex items-center gap-1.5 transition-all ${
              viewMode === '3D_ISOMETRIC'
                ? 'bg-[#C5A880] text-[#0D1117] shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Box className="w-3.5 h-3.5" /> Mô Hình 3D Isometric
          </button>

          <button
            type="button"
            onClick={() => setViewMode('2D_CAD')}
            className={`px-3 py-1.5 font-bold uppercase tracking-wider text-[10px] rounded flex items-center gap-1.5 transition-all ${
              viewMode === '2D_CAD'
                ? 'bg-[#C5A880] text-[#0D1117] shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Bản Vẽ Kỹ Thuật 2D CAD
          </button>

          <button
            type="button"
            onClick={() => setViewMode('XRAY_IOT')}
            className={`px-3 py-1.5 font-bold uppercase tracking-wider text-[10px] rounded flex items-center gap-1.5 transition-all ${
              viewMode === 'XRAY_IOT'
                ? 'bg-cyan-500 text-[#0D1117] shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" /> Cảm Biến X-Ray IoT
          </button>
        </div>

        {/* Right: Layer Toggles & Angle Selector */}
        <div className="flex items-center gap-2">
          {viewMode === '3D_ISOMETRIC' && (
            <div className="hidden sm:flex items-center gap-1 bg-[#0D1117] p-1 border border-[#222B35] rounded text-[10px]">
              <button
                type="button"
                onClick={() => setViewAngle('SOUTH_WEST')}
                className={`px-2 py-1 rounded transition-colors ${viewAngle === 'SOUTH_WEST' ? 'bg-[#1C2533] text-[#C5A880] font-bold' : 'text-gray-400 hover:text-white'}`}
              >
                Góc Tây Nam
              </button>
              <button
                type="button"
                onClick={() => setViewAngle('NORTH_EAST')}
                className={`px-2 py-1 rounded transition-colors ${viewAngle === 'NORTH_EAST' ? 'bg-[#1C2533] text-[#C5A880] font-bold' : 'text-gray-400 hover:text-white'}`}
              >
                Góc Đông Bắc
              </button>
            </div>
          )}

          {/* Toggle Dimension & Nodes */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowDimensions(!showDimensions)}
              className={`p-1.5 border rounded transition-colors text-[10px] flex items-center gap-1 ${
                showDimensions ? 'bg-[#1C2533] border-[#C5A880] text-[#C5A880]' : 'bg-[#0D1117] border-gray-700 text-gray-400'
              }`}
              title="Ẩn/Hiện kích thước diện tích (m²)"
            >
              <Grid className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Kích Thước</span>
            </button>

            <button
              type="button"
              onClick={() => setShowIotNodes(!showIotNodes)}
              className={`p-1.5 border rounded transition-colors text-[10px] flex items-center gap-1 ${
                showIotNodes ? 'bg-[#1C2533] border-emerald-500 text-emerald-400' : 'bg-[#0D1117] border-gray-700 text-gray-400'
              }`}
              title="Ẩn/Hiện các node thiết bị thông minh"
            >
              <Zap className="w-3.5 h-3.5" />
              <span className="hidden md:inline">IoT Nodes</span>
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. MAIN SIMULATION CANVAS                                     */}
      {/* ------------------------------------------------------------- */}
      <div className="relative w-full h-[420px] sm:h-[480px] bg-[#080B0F] overflow-hidden flex items-center justify-center">
        {/* Background Grid Pattern */}
        {showGrid && (
          <div 
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(#C5A880 1px, transparent 1px), radial-gradient(#222B35 1px, transparent 1px)',
              backgroundSize: '30px 30px',
              backgroundPosition: '0 0, 15px 15px'
            }}
          />
        )}

        {/* Ambient Glow from Living Room */}
        {lights.livingRoom && (
          <div className="absolute w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -translate-x-12 -translate-y-8 animate-pulse" />
        )}

        {/* Dynamic Architectural SVG Simulation Canvas */}
        <div 
          className="relative transition-all duration-700 ease-out transform"
          style={{
            transform: viewMode === '3D_ISOMETRIC'
              ? viewAngle === 'SOUTH_WEST'
                ? 'perspective(1200px) rotateX(54deg) rotateZ(-38deg) scale(0.92)'
                : 'perspective(1200px) rotateX(54deg) rotateZ(142deg) scale(0.92)'
              : 'perspective(0px) rotateX(0deg) rotateZ(0deg) scale(0.95)'
          }}
        >
          <svg
            viewBox="0 0 800 600"
            className="w-[620px] sm:w-[720px] h-[460px] sm:h-[520px] drop-shadow-[0_25px_50px_rgba(0,0,0,0.85)] cursor-pointer"
          >
            <defs>
              {/* Floor Materials */}
              <pattern id="hardwoodPattern" width="40" height="20" patternUnits="userSpaceOnUse">
                <rect width="40" height="20" fill="#1C1814" stroke="#28221B" strokeWidth="1" />
                <line x1="0" y1="10" x2="40" y2="10" stroke="#28221B" strokeWidth="0.8" />
                <line x1="20" y1="0" x2="20" y2="10" stroke="#28221B" strokeWidth="0.8" />
              </pattern>
              
              <pattern id="marblePattern" width="30" height="30" patternUnits="userSpaceOnUse">
                <rect width="30" height="30" fill="#161B22" stroke="#252D38" strokeWidth="1" />
              </pattern>

              {/* Lighting Gradients */}
              <radialGradient id="lightWarm" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFE4A0" stopOpacity="0.85" />
                <stop offset="60%" stopColor="#C5A880" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#C5A880" stopOpacity="0" />
              </radialGradient>

              <radialGradient id="lightCool" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#BAE6FD" stopOpacity="0.8" />
                <stop offset="60%" stopColor="#38BDF8" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
              </radialGradient>

              {/* X-Ray Heatmap Gradient */}
              <linearGradient id="xrayHeatmap" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.6" />
                <stop offset="50%" stopColor="#3B82F6" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.6" />
              </linearGradient>
            </defs>

            {/* ======================================================= */}
            {/* ROOM 1: GRAND LIVING ROOM & LOUNGE (Phòng Khách)       */}
            {/* ======================================================= */}
            <g
              onClick={() => setSelectedRoom('living')}
              className="transition-all duration-300 group"
            >
              {/* Floor Base */}
              <polygon
                points="120,180 440,180 440,460 120,460"
                fill={viewMode === 'XRAY_IOT' ? 'url(#xrayHeatmap)' : 'url(#hardwoodPattern)'}
                stroke={selectedRoom === 'living' ? '#C5A880' : '#334155'}
                strokeWidth={selectedRoom === 'living' ? '3' : '1.5'}
                className="transition-all hover:fill-[#2A231C]"
              />

              {/* Glowing Warm Cone when Light is ON */}
              {lights.livingRoom && viewMode !== '2D_CAD' && (
                <ellipse cx="280" cy="320" rx="140" ry="110" fill="url(#lightWarm)" pointerEvents="none" />
              )}

              {/* 3D Isometric Wall Elevations */}
              {viewMode === '3D_ISOMETRIC' && (
                <>
                  <polygon points="120,180 120,140 440,140 440,180" fill="#2E3846" stroke="#475569" strokeWidth="1" />
                  <polygon points="120,180 80,210 80,490 120,460" fill="#1E2631" stroke="#334155" strokeWidth="1" />
                </>
              )}

              {/* Furniture: Luxury Sectional Sofa + Coffee Table */}
              <rect x="180" y="300" width="130" height="45" rx="6" fill="#334155" stroke="#64748B" strokeWidth="1.5" />
              <rect x="180" y="345" width="45" height="60" rx="6" fill="#334155" stroke="#64748B" strokeWidth="1.5" />
              <rect x="250" y="360" width="60" height="35" rx="4" fill="#C5A880" stroke="#E2D4BF" strokeWidth="1.5" opacity="0.9" />
              {/* TV Console */}
              <rect x="390" y="260" width="20" height="120" rx="3" fill="#0F172A" stroke="#475569" strokeWidth="1.5" />
              <line x1="395" y1="280" x2="395" y2="360" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" />

              {/* Room Label */}
              <text x="280" y="240" fill="#FFFFFF" fontSize="15" fontWeight="bold" textAnchor="middle" letterSpacing="0.5">
                PHÒNG KHÁCH
              </text>
              {showDimensions && (
                <text x="280" y="260" fill="#C5A880" fontSize="12" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                  28.6 m² • {acTemp}°C
                </text>
              )}
            </g>

            {/* ======================================================= */}
            {/* ROOM 2: MASTER BEDROOM (Phòng Ngủ Master)              */}
            {/* ======================================================= */}
            <g
              onClick={() => setSelectedRoom('masterBed')}
              className="transition-all duration-300 group"
            >
              {/* Floor Base */}
              <polygon
                points="440,180 720,180 720,380 440,380"
                fill={viewMode === 'XRAY_IOT' ? 'url(#xrayHeatmap)' : 'url(#hardwoodPattern)'}
                stroke={selectedRoom === 'masterBed' ? '#818CF8' : '#334155'}
                strokeWidth={selectedRoom === 'masterBed' ? '3' : '1.5'}
                className="transition-all hover:fill-[#222436]"
              />

              {/* Light Glow */}
              {lights.bedroomMaster && viewMode !== '2D_CAD' && (
                <ellipse cx="580" cy="280" rx="110" ry="85" fill="url(#lightCool)" pointerEvents="none" />
              )}

              {/* 3D Wall Elevations */}
              {viewMode === '3D_ISOMETRIC' && (
                <polygon points="440,180 440,140 720,140 720,180" fill="#2A2F45" stroke="#475569" strokeWidth="1" />
              )}

              {/* King Bed & Pillows */}
              <rect x="530" y="220" width="120" height="110" rx="6" fill="#1E293B" stroke="#818CF8" strokeWidth="1.5" />
              <rect x="545" y="230" width="40" height="25" rx="4" fill="#E2E8F0" opacity="0.9" />
              <rect x="595" y="230" width="40" height="25" rx="4" fill="#E2E8F0" opacity="0.9" />
              {/* Nightstands */}
              <rect x="495" y="235" width="25" height="25" rx="3" fill="#334155" stroke="#64748B" />
              <rect x="660" y="235" width="25" height="25" rx="3" fill="#334155" stroke="#64748B" />

              {/* Label */}
              <text x="580" y="350" fill="#FFFFFF" fontSize="14" fontWeight="bold" textAnchor="middle">
                PHÒNG NGỦ MASTER
              </text>
              {showDimensions && (
                <text x="580" y="368" fill="#818CF8" fontSize="11" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                  18.2 m² • King Bed
                </text>
              )}
            </g>

            {/* ======================================================= */}
            {/* ROOM 3: GOURMET KITCHEN & DINING (Bếp & Bàn Ăn)        */}
            {/* ======================================================= */}
            <g
              onClick={() => setSelectedRoom('kitchen')}
              className="transition-all duration-300 group"
            >
              {/* Floor Base */}
              <polygon
                points="120,460 440,460 440,580 120,580"
                fill={viewMode === 'XRAY_IOT' ? 'url(#xrayHeatmap)' : 'url(#marblePattern)'}
                stroke={selectedRoom === 'kitchen' ? '#F59E0B' : '#334155'}
                strokeWidth={selectedRoom === 'kitchen' ? '3' : '1.5'}
                className="transition-all hover:fill-[#202733]"
              />

              {/* Kitchen Island & Bar Stools */}
              <rect x="220" y="490" width="140" height="40" rx="4" fill="#1E293B" stroke="#F59E0B" strokeWidth="1.5" />
              <circle cx="250" cy="550" r="10" fill="#C5A880" />
              <circle cx="290" cy="550" r="10" fill="#C5A880" />
              <circle cx="330" cy="550" r="10" fill="#C5A880" />

              {/* Induction Cooktop & Sink */}
              <rect x="140" y="475" width="50" height="85" rx="3" fill="#0F172A" stroke="#64748B" strokeWidth="1" />
              <circle cx="165" cy="500" r="12" fill="#E11D48" opacity="0.8" />
              <rect x="150" y="525" width="30" height="25" rx="2" fill="#475569" />

              {/* Label */}
              <text x="280" y="480" fill="#FFFFFF" fontSize="13" fontWeight="bold" textAnchor="middle">
                BẾP & ĐẢO BẾP
              </text>
              {showDimensions && (
                <text x="280" y="495" fill="#F59E0B" fontSize="11" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                  11.5 m² • Smart Bosch
                </text>
              )}
            </g>

            {/* ======================================================= */}
            {/* ROOM 4: SKYLINE BALCONY (Ban Công Panorama)            */}
            {/* ======================================================= */}
            <g
              onClick={() => setSelectedRoom('balcony')}
              className="transition-all duration-300 group"
            >
              {/* Floor Base */}
              <polygon
                points="440,380 720,380 720,580 440,580"
                fill={viewMode === 'XRAY_IOT' ? 'url(#xrayHeatmap)' : 'url(#marblePattern)'}
                stroke={selectedRoom === 'balcony' ? '#10B981' : '#334155'}
                strokeWidth={selectedRoom === 'balcony' ? '3' : '1.5'}
                className="transition-all hover:fill-[#1A2E26]"
              />

              {/* Glass Railing Stroke */}
              <line x1="720" y1="380" x2="720" y2="580" stroke="#38BDF8" strokeWidth="4" strokeDasharray="10 5" opacity="0.8" />
              <line x1="440" y1="580" x2="720" y2="580" stroke="#38BDF8" strokeWidth="4" strokeDasharray="10 5" opacity="0.8" />

              {/* Outdoor Lounge Chair & Green Planters */}
              <circle cx="480" cy="420" r="16" fill="#10B981" opacity="0.7" />
              <circle cx="510" cy="420" r="12" fill="#10B981" opacity="0.7" />
              <rect x="580" y="460" width="80" height="40" rx="8" fill="#1E293B" stroke="#10B981" strokeWidth="1.5" />

              {/* Curtain Status Indicator Line */}
              <line
                x1="440"
                y1="380"
                x2="720"
                y2="380"
                stroke={curtainsOpen ? '#C5A880' : '#E11D48'}
                strokeWidth="3"
                strokeDasharray={curtainsOpen ? '6 4' : '0'}
              />

              {/* Label */}
              <text x="580" y="530" fill="#FFFFFF" fontSize="13" fontWeight="bold" textAnchor="middle">
                BAN CÔNG SKY VIEW
              </text>
              {showDimensions && (
                <text x="580" y="550" fill="#10B981" fontSize="11" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                  7.8 m² • Rèm: {curtainsOpen ? 'Mở (100%)' : 'Đóng'}
                </text>
              )}
            </g>

            {/* ======================================================= */}
            {/* 3. ACTIVE IOT SMART HOTSPOT NODES                       */}
            {/* ======================================================= */}
            {showIotNodes && (
              <g className="pointer-events-auto">
                {/* Node 1: Living Room AC */}
                <g 
                  transform="translate(420, 200)"
                  className="cursor-pointer"
                >
                  <title>Daikin Smart AC</title>
                  <circle cx="0" cy="0" r="14" fill={acPower ? '#0284C7' : '#475569'} stroke="#FFFFFF" strokeWidth="1.5" />
                  <text x="0" y="4" fill="#FFFFFF" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">AC</text>
                  {acPower && (
                    <circle cx="0" cy="0" r="22" fill="none" stroke="#38BDF8" strokeWidth="1.5" className="animate-ping opacity-60" />
                  )}
                </g>

                {/* Node 2: Master FaceID Door Lock */}
                <g 
                  transform="translate(120, 320)"
                  className="cursor-pointer"
                  onClick={onToggleDoor}
                >
                  <title>Khóa Cửa FaceID Master</title>
                  <circle cx="0" cy="0" r="14" fill={doorLocked ? '#059669' : '#DC2626'} stroke="#FFFFFF" strokeWidth="1.5" />
                  <text x="0" y="4" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle">ID</text>
                </g>

                {/* Node 3: Water Leak Sensor in Kitchen */}
                <g 
                  transform="translate(150, 540)"
                  className="cursor-pointer"
                >
                  <title>Cảm biến rò rỉ nước AI</title>
                  <circle cx="0" cy="0" r="12" fill={waterLeakActive ? '#0284C7' : '#94A3B8'} stroke="#FFFFFF" strokeWidth="1" />
                  <text x="0" y="3" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle">H2O</text>
                </g>

                {/* Node 4: Balcony Smart Curtain */}
                <g 
                  transform="translate(580, 380)"
                  className="cursor-pointer"
                  onClick={onToggleCurtains}
                >
                  <title>Rèm ban công tự động</title>
                  <circle cx="0" cy="0" r="13" fill={curtainsOpen ? '#D97706' : '#475569'} stroke="#FFFFFF" strokeWidth="1.5" />
                  <text x="0" y="4" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle">CURT</text>
                </g>
              </g>
            )}
          </svg>
        </div>

        {/* Live Simulation Compass & Legend Overlay */}
        <div className="absolute top-3 left-3 bg-[#0D1117]/90 border border-[#222B35] p-2.5 text-[10px] space-y-1 backdrop-blur-md rounded shadow-lg">
          <div className="text-white font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Căn Hộ {apartmentCode} ({clearArea} m²)
          </div>
          <div className="text-gray-400 font-mono">
            Chế độ: <strong className="text-[#C5A880]">{viewMode}</strong>
          </div>
          <div className="text-gray-400 font-mono">
            Góc nhìn: <strong>{viewAngle} (Perspective)</strong>
          </div>
        </div>

        {/* Hotspot Legend */}
        <div className="absolute bottom-3 left-3 hidden sm:flex items-center gap-3 bg-[#0D1117]/90 border border-[#222B35] px-3 py-1.5 text-[10px] backdrop-blur-md rounded text-gray-300">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span> Điều Hòa VRV
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Khóa FaceID
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Rèm Tự Động
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span> Cảm Biến Nước
          </div>
        </div>

        {/* Interactive Click Tip */}
        <div className="absolute bottom-3 right-3 bg-[#1C2533]/90 border border-[#C5A880]/60 px-3 py-1.5 text-[10px] text-[#C5A880] font-mono rounded backdrop-blur-md">
          * Nhấp vào từng phòng trên mô hình để xem thông số kỹ thuật & điều khiển
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. BOTTOM INSPECTION PANEL: ACTIVE ROOM SPECIFICATIONS        */}
      {/* ------------------------------------------------------------- */}
      {activeRoomData && (
        <div className="p-4 bg-[#0D1117] border-t border-[#222B35] grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Room Name & Area */}
          <div className="md:col-span-4 border-r border-[#222B35] pr-4 space-y-1">
            <div className="text-[10px] uppercase tracking-wider text-gray-400 font-mono">
              Phòng Đang Chọn (Active Focus)
            </div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activeRoomData.color }} />
              <span>{activeRoomData.name}</span>
            </div>
            <div className="text-xs text-[#C5A880] font-mono font-bold">
              Diện tích: {activeRoomData.area} m² ({((activeRoomData.area / clearArea) * 100).toFixed(1)}% căn hộ)
            </div>
          </div>

          {/* Environmental Sensors for Selected Room */}
          <div className="md:col-span-4 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 bg-[#121820] border border-[#222B35] rounded">
              <div className="text-[10px] text-gray-400">Nhiệt Độ</div>
              <div className="font-mono font-bold text-white mt-0.5">{activeRoomData.temperature}°C</div>
            </div>
            <div className="p-2 bg-[#121820] border border-[#222B35] rounded">
              <div className="text-[10px] text-gray-400">Độ Ẩm</div>
              <div className="font-mono font-bold text-blue-400 mt-0.5">{activeRoomData.humidity}%</div>
            </div>
            <div className="p-2 bg-[#121820] border border-[#222B35] rounded">
              <div className="text-[10px] text-gray-400">Ánh Sáng</div>
              <div className={`font-mono font-bold mt-0.5 ${activeRoomData.lightState ? 'text-amber-400' : 'text-gray-500'}`}>
                {activeRoomData.lightState ? 'SÁNG' : 'TẮT'}
              </div>
            </div>
          </div>

          {/* Quick Actions for Selected Room */}
          <div className="md:col-span-4 flex flex-wrap items-center justify-end gap-2">
            {interactive && onToggleLight && (
              <button
                type="button"
                onClick={() => {
                  if (selectedRoom === 'living') onToggleLight('livingRoom');
                  else if (selectedRoom === 'masterBed') onToggleLight('bedroomMaster');
                  else if (selectedRoom === 'kitchen') onToggleLight('kitchen');
                  else if (selectedRoom === 'balcony') onToggleLight('balcony');
                }}
                className="px-3 py-2 bg-[#161B22] hover:bg-[#C5A880] hover:text-[#0D1117] border border-gray-700 hover:border-[#C5A880] text-xs font-bold uppercase tracking-wider transition-colors rounded flex items-center gap-1.5 text-white"
              >
                <Zap className="w-3.5 h-3.5" /> Đổi Trạng Thái Đèn
              </button>
            )}

            {selectedRoom === 'balcony' && onToggleCurtains && (
              <button
                type="button"
                onClick={onToggleCurtains}
                className="px-3 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-colors rounded flex items-center gap-1.5 shadow"
              >
                <Sun className="w-3.5 h-3.5" /> {curtainsOpen ? 'Đóng Rèm' : 'Mở Rèm'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
