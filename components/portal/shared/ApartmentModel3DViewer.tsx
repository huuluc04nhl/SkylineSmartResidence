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
  Radio,
  SplitSquareVertical,
  Compass
} from 'lucide-react';

export type ViewMode = '3D_BLOCKS' | '2D_BLUEPRINT' | '3D_EXPLODED';
export type ViewAngle = 'SOUTH_WEST' | 'NORTH_EAST' | 'TOP_DOWN';

export interface RoomDetails {
  id: string;
  code: string;
  name: string;
  nameEn: string;
  area: number; // m2
  dimensions: string; // e.g. "5.4m x 4.8m"
  color: string;
  borderColor: string;
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
  interactive?: boolean; // false on Landing page (read-only for guests)
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
  const [viewMode, setViewMode] = useState<ViewMode>('3D_BLOCKS');
  const [viewAngle, setViewAngle] = useState<ViewAngle>('SOUTH_WEST');
  const [selectedRoom, setSelectedRoom] = useState<string>('living');
  const [showDimensions, setShowDimensions] = useState(true);
  const [showIotNodes, setShowIotNodes] = useState(true);
  const [showWireframe, setShowWireframe] = useState(true);

  // Architectural Massing Block Catalog
  const rooms: Record<string, RoomDetails> = {
    foyer: {
      id: 'foyer',
      code: 'TS-01',
      name: 'Khối Tiền Sảnh & Cửa Chính FaceID',
      nameEn: 'Smart Foyer & Entry Block',
      area: 4.2,
      dimensions: '2.1m x 2.0m',
      color: '#334155',
      borderColor: '#64748B',
      temperature: 26,
      humidity: 55,
      lightState: true,
      devices: ['Khóa Cửa Thông Minh FaceID 512D', 'Đèn Chào Mừng Cảm Biến Hiện Diện']
    },
    living: {
      id: 'living',
      code: 'PK-01',
      name: 'Khối Không Gian Phòng Khách',
      nameEn: 'Grand Living Lounge Block',
      area: 26.8,
      dimensions: '5.8m x 4.6m',
      color: '#C5A880',
      borderColor: '#E2D4BF',
      temperature: acTemp,
      humidity: 56,
      lightState: lights.livingRoom,
      devices: ['Smart Ambient LED Bar (Dimmable)', 'Điều Hòa Daikin VRV Inverter', 'Smart TV 75"']
    },
    diningKitchen: {
      id: 'diningKitchen',
      code: 'BP-01',
      name: 'Khối Bếp & Đảo Bếp Gourmet',
      nameEn: 'Open Kitchen & Island Block',
      area: 12.5,
      dimensions: '3.8m x 3.3m',
      color: '#F59E0B',
      borderColor: '#FDE68A',
      temperature: 26,
      humidity: 52,
      lightState: lights.kitchen,
      devices: ['Bếp Từ Bosch 3 Vùng Nấu', 'Hệ Thống Hút Mùi Cảm Biến', 'Cảm Biến Rò Rỉ Nước AI']
    },
    masterBed: {
      id: 'masterBed',
      code: 'PN-01',
      name: 'Khối Phòng Ngủ Master Suite',
      nameEn: 'Master Bedroom Suite Block',
      area: 18.2,
      dimensions: '4.8m x 3.8m',
      color: '#818CF8',
      borderColor: '#C7D2FE',
      temperature: acTemp - 1,
      humidity: 58,
      lightState: lights.bedroomMaster,
      devices: ['Đèn Ngủ Cảm Ứng SleepMode', 'Cảm Biến Hiện Diện mmWave', 'Rèm Tự Động']
    },
    secondBed: {
      id: 'secondBed',
      code: 'PN-02',
      name: 'Khối Phòng Ngủ Phụ / Studio',
      nameEn: 'Guest Suite / Workspace Block',
      area: 12.4,
      dimensions: '3.6m x 3.4m',
      color: '#38BDF8',
      borderColor: '#BAE6FD',
      temperature: 25,
      humidity: 60,
      lightState: true,
      devices: ['Đèn Bàn Công Tắc Cảm Ứng', 'Cảm Biến Khói PCCC']
    },
    balcony: {
      id: 'balcony',
      code: 'BC-01',
      name: 'Khối Ban Công Kính Panorama',
      nameEn: 'Skyline Terrace Glass Block',
      area: 7.8,
      dimensions: '4.6m x 1.7m',
      color: '#10B981',
      borderColor: '#A7F3D0',
      temperature: 29,
      humidity: 68,
      lightState: lights.balcony,
      devices: ['Hệ Thống Rèm Chắn Nắng Thông Minh', 'Cảm Biến Mưa & Gió']
    }
  };

  const activeRoom = rooms[selectedRoom] || rooms['living'];

  return (
    <div className="w-full bg-[#080B10] border border-[#222B35] rounded-lg shadow-2xl flex flex-col overflow-hidden select-none">
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP TOOLBAR: ARCHITECTURAL MODES & CAMERA ANGLES           */}
      {/* ------------------------------------------------------------- */}
      <div className="p-3 bg-[#0D1117] border-b border-[#222B35] flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Architectural Mode Switcher */}
        <div className="flex items-center gap-1.5 bg-[#121820] p-1 border border-[#222B35] rounded">
          <button
            type="button"
            onClick={() => setViewMode('3D_BLOCKS')}
            className={`px-3 py-1.5 font-bold uppercase tracking-wider text-[10px] rounded flex items-center gap-1.5 transition-all ${
              viewMode === '3D_BLOCKS'
                ? 'bg-[#C5A880] text-[#0D1117] shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Box className="w-3.5 h-3.5" /> 1. Khối Kiến Trúc 3D (Massing)
          </button>

          <button
            type="button"
            onClick={() => setViewMode('2D_BLUEPRINT')}
            className={`px-3 py-1.5 font-bold uppercase tracking-wider text-[10px] rounded flex items-center gap-1.5 transition-all ${
              viewMode === '2D_BLUEPRINT'
                ? 'bg-[#C5A880] text-[#0D1117] shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> 2. Mặt Bằng CAD (Blueprint)
          </button>

          <button
            type="button"
            onClick={() => setViewMode('3D_EXPLODED')}
            className={`px-3 py-1.5 font-bold uppercase tracking-wider text-[10px] rounded flex items-center gap-1.5 transition-all ${
              viewMode === '3D_EXPLODED'
                ? 'bg-cyan-500 text-[#0D1117] shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <SplitSquareVertical className="w-3.5 h-3.5" /> 3. Bóc Tách Khối (Exploded 3D)
          </button>
        </div>

        {/* Right: Technical Display Toggles */}
        <div className="flex items-center gap-2">
          {viewMode !== '2D_BLUEPRINT' && (
            <div className="hidden sm:flex items-center gap-1 bg-[#121820] p-1 border border-[#222B35] rounded text-[10px]">
              <button
                type="button"
                onClick={() => setViewAngle('SOUTH_WEST')}
                className={`px-2 py-1 rounded transition-colors ${viewAngle === 'SOUTH_WEST' ? 'bg-[#1C2533] text-[#C5A880] font-bold' : 'text-gray-400 hover:text-white'}`}
              >
                Góc Phối Cảnh Tây Nam
              </button>
              <button
                type="button"
                onClick={() => setViewAngle('NORTH_EAST')}
                className={`px-2 py-1 rounded transition-colors ${viewAngle === 'NORTH_EAST' ? 'bg-[#1C2533] text-[#C5A880] font-bold' : 'text-gray-400 hover:text-white'}`}
              >
                Góc Phối Cảnh Đông Bắc
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowDimensions(!showDimensions)}
            className={`p-1.5 border rounded transition-colors text-[10px] flex items-center gap-1 ${
              showDimensions ? 'bg-[#1C2533] border-[#C5A880] text-[#C5A880]' : 'bg-[#121820] border-gray-700 text-gray-400'
            }`}
            title="Ẩn/Hiện đường kích thước Laser CAD"
          >
            <Grid className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Kích Thước</span>
          </button>

          <button
            type="button"
            onClick={() => setShowIotNodes(!showIotNodes)}
            className={`p-1.5 border rounded transition-colors text-[10px] flex items-center gap-1 ${
              showIotNodes ? 'bg-[#1C2533] border-emerald-500 text-emerald-400' : 'bg-[#121820] border-gray-700 text-gray-400'
            }`}
            title="Ẩn/Hiện node thiết bị thông minh"
          >
            <Zap className="w-3.5 h-3.5" />
            <span className="hidden md:inline">IoT Nodes</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. MAIN SIMULATION CANVAS: ARCHITECTURAL VOLUMETRIC BLOCKS   */}
      {/* ------------------------------------------------------------- */}
      <div className="relative w-full h-[450px] sm:h-[500px] bg-[#05070A] overflow-hidden flex items-center justify-center">
        {/* Architectural Blueprint Matrix Grid */}
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(to right, #1E293B 1px, transparent 1px), linear-gradient(to bottom, #1E293B 1px, transparent 1px)',
            backgroundSize: '25px 25px'
          }}
        />

        {/* Ambient Living Room Light Atmosphere */}
        {lights.livingRoom && viewMode !== '2D_BLUEPRINT' && (
          <div className="absolute w-[420px] h-[420px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none -translate-x-12 -translate-y-8 animate-pulse" />
        )}

        {/* 3D Massing Stage */}
        <div 
          className="relative transition-all duration-700 ease-out transform"
          style={{
            transform: viewMode === '2D_BLUEPRINT'
              ? 'perspective(0px) rotateX(0deg) rotateZ(0deg) scale(0.95)'
              : viewAngle === 'SOUTH_WEST'
                ? 'perspective(1400px) rotateX(55deg) rotateZ(-36deg) scale(0.92)'
                : 'perspective(1400px) rotateX(55deg) rotateZ(144deg) scale(0.92)'
          }}
        >
          <svg
            viewBox="0 0 900 620"
            className="w-[660px] sm:w-[780px] h-[470px] sm:h-[530px] drop-shadow-[0_30px_60px_rgba(0,0,0,0.95)] cursor-pointer"
          >
            <defs>
              {/* Floor Materials & CAD Hatches */}
              <pattern id="oakFlooring" width="40" height="20" patternUnits="userSpaceOnUse">
                <rect width="40" height="20" fill="#141820" stroke="#1F2633" strokeWidth="1" />
                <line x1="0" y1="10" x2="40" y2="10" stroke="#1F2633" strokeWidth="0.8" />
                <line x1="20" y1="0" x2="20" y2="10" stroke="#1F2633" strokeWidth="0.8" />
              </pattern>

              <pattern id="marbleTile" width="30" height="30" patternUnits="userSpaceOnUse">
                <rect width="30" height="30" fill="#10141C" stroke="#1E2533" strokeWidth="1" />
              </pattern>

              {/* Lighting Radial Cones */}
              <radialGradient id="lightWarmGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFE4A0" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#C5A880" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#C5A880" stopOpacity="0" />
              </radialGradient>

              <radialGradient id="lightCoolGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#BAE6FD" stopOpacity="0.85" />
                <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* ======================================================= */}
            {/* 1. KHỐI TIỀN SẢNH & CỬA CHÍNH (Foyer Massing Block)    */}
            {/* ======================================================= */}
            <g 
              onClick={() => setSelectedRoom('foyer')}
              className="transition-all duration-300 group"
              transform={viewMode === '3D_EXPLODED' ? 'translate(-20, 0)' : 'translate(0, 0)'}
            >
              {/* Floor Base */}
              <polygon
                points="80,240 180,240 180,360 80,360"
                fill="url(#marbleTile)"
                stroke={selectedRoom === 'foyer' ? '#C5A880' : '#334155'}
                strokeWidth={selectedRoom === 'foyer' ? '3' : '1.5'}
              />
              {/* 3D Extruded Wall Block */}
              {viewMode !== '2D_BLUEPRINT' && (
                <>
                  <polygon points="80,240 80,180 180,180 180,240" fill="#1E2633" stroke="#475569" strokeWidth="1" />
                  <polygon points="80,240 40,270 40,390 80,360" fill="#131922" stroke="#334155" strokeWidth="1" />
                </>
              )}
              {/* Door Swing Arc */}
              <path d="M 80,310 A 40,40 0 0,1 120,350" fill="none" stroke="#C5A880" strokeWidth="1.5" strokeDasharray="3 3" />
              <line x1="80" y1="310" x2="80" y2="350" stroke="#C5A880" strokeWidth="3" strokeLinecap="round" />
              {/* Block Code Label */}
              <rect x="105" y="285" width="50" height="22" rx="3" fill="#0D1117" stroke="#475569" strokeWidth="1" />
              <text x="130" y="300" fill="#FFFFFF" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                {showDimensions ? 'TS 4.2m²' : 'SẢNH'}
              </text>
            </g>

            {/* ======================================================= */}
            {/* 2. KHỐI PHÒNG KHÁCH (Grand Living Room Massing Block)  */}
            {/* ======================================================= */}
            <g 
              onClick={() => setSelectedRoom('living')}
              className="transition-all duration-300 group"
              transform={viewMode === '3D_EXPLODED' ? 'translate(-15, -15)' : 'translate(0, 0)'}
            >
              {/* Floor Base */}
              <polygon
                points="180,130 480,130 480,410 180,410"
                fill="url(#oakFlooring)"
                stroke={selectedRoom === 'living' ? '#C5A880' : '#334155'}
                strokeWidth={selectedRoom === 'living' ? '3' : '1.5'}
                className="transition-all hover:fill-[#1C202B]"
              />

              {/* Ambient Light Cone */}
              {lights.livingRoom && viewMode !== '2D_BLUEPRINT' && (
                <ellipse cx="330" cy="270" rx="140" ry="110" fill="url(#lightWarmGlow)" pointerEvents="none" />
              )}

              {/* 3D Extruded Architectural Walls */}
              {viewMode !== '2D_BLUEPRINT' && (
                <>
                  <polygon points="180,130 180,70 480,70 480,130" fill="#252F3F" stroke="#475569" strokeWidth="1" />
                  <polygon points="180,130 140,160 140,440 180,410" fill="#18202C" stroke="#334155" strokeWidth="1" />
                </>
              )}

              {/* Architectural Furniture Silhouettes */}
              <rect x="240" y="250" width="140" height="48" rx="4" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />
              <rect x="240" y="298" width="48" height="55" rx="4" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />
              <rect x="310" y="315" width="65" height="35" rx="3" fill="#C5A880" stroke="#E2D4BF" strokeWidth="1.5" opacity="0.95" />
              {/* TV Wall Console */}
              <rect x="440" y="210" width="18" height="120" rx="2" fill="#0D1117" stroke="#475569" strokeWidth="1.2" />
              <line x1="446" y1="225" x2="446" y2="315" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" />

              {/* Laser Measurement Dimensions */}
              {showDimensions && (
                <g className="opacity-80">
                  <line x1="180" y1="115" x2="480" y2="115" stroke="#C5A880" strokeWidth="1" strokeDasharray="3 3" />
                  <text x="330" y="110" fill="#C5A880" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">5.80 m</text>
                </g>
              )}

              {/* Block Badge */}
              <g transform="translate(330, 180)">
                <rect x="-55" y="-12" width="110" height="24" rx="4" fill="#0D1117" stroke="#C5A880" strokeWidth="1.5" />
                <text x="0" y="5" fill="#C5A880" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                  PK-01 • 26.8 m²
                </text>
              </g>
            </g>

            {/* ======================================================= */}
            {/* 3. KHỐI BẾP & ĐẢO BẾP (Kitchen & Island Block)          */}
            {/* ======================================================= */}
            <g 
              onClick={() => setSelectedRoom('diningKitchen')}
              className="transition-all duration-300 group"
              transform={viewMode === '3D_EXPLODED' ? 'translate(-15, 20)' : 'translate(0, 0)'}
            >
              {/* Floor Base */}
              <polygon
                points="180,410 480,410 480,560 180,560"
                fill="url(#marbleTile)"
                stroke={selectedRoom === 'diningKitchen' ? '#F59E0B' : '#334155'}
                strokeWidth={selectedRoom === 'diningKitchen' ? '3' : '1.5'}
                className="transition-all hover:fill-[#1C202B]"
              />

              {/* 3D Extruded Walls */}
              {viewMode !== '2D_BLUEPRINT' && (
                <polygon points="180,560 140,590 440,590 480,560" fill="#131922" stroke="#334155" strokeWidth="1" />
              )}

              {/* Kitchen Island with Bar Stools */}
              <rect x="250" y="440" width="140" height="42" rx="3" fill="#1E293B" stroke="#F59E0B" strokeWidth="1.5" />
              <circle cx="280" cy="505" r="9" fill="#C5A880" />
              <circle cx="320" cy="505" r="9" fill="#C5A880" />
              <circle cx="360" cy="505" r="9" fill="#C5A880" />

              {/* Induction Cooktop & Sink */}
              <rect x="420" y="440" width="45" height="90" rx="3" fill="#0D1117" stroke="#64748B" strokeWidth="1" />
              <circle cx="442" cy="465" r="10" fill="#EF4444" opacity="0.85" />
              <rect x="430" y="495" width="25" height="25" rx="2" fill="#334155" />

              {/* Block Badge */}
              <g transform="translate(330, 535)">
                <rect x="-48" y="-11" width="96" height="22" rx="4" fill="#0D1117" stroke="#F59E0B" strokeWidth="1.5" />
                <text x="0" y="4" fill="#F59E0B" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                  BP-01 • 12.5 m²
                </text>
              </g>
            </g>

            {/* ======================================================= */}
            {/* 4. KHỐI PHÒNG NGỦ MASTER (Master Suite Block)           */}
            {/* ======================================================= */}
            <g 
              onClick={() => setSelectedRoom('masterBed')}
              className="transition-all duration-300 group"
              transform={viewMode === '3D_EXPLODED' ? 'translate(20, -15)' : 'translate(0, 0)'}
            >
              {/* Floor Base */}
              <polygon
                points="480,130 760,130 760,340 480,340"
                fill="url(#oakFlooring)"
                stroke={selectedRoom === 'masterBed' ? '#818CF8' : '#334155'}
                strokeWidth={selectedRoom === 'masterBed' ? '3' : '1.5'}
                className="transition-all hover:fill-[#1E2232]"
              />

              {/* Cool Blue Lighting Glow */}
              {lights.bedroomMaster && viewMode !== '2D_BLUEPRINT' && (
                <ellipse cx="620" cy="235" rx="120" ry="90" fill="url(#lightCoolGlow)" pointerEvents="none" />
              )}

              {/* 3D Extruded Architectural Walls */}
              {viewMode !== '2D_BLUEPRINT' && (
                <>
                  <polygon points="480,130 480,70 760,70 760,130" fill="#222840" stroke="#475569" strokeWidth="1" />
                  <polygon points="760,130 800,160 800,370 760,340" fill="#151A2C" stroke="#334155" strokeWidth="1" />
                </>
              )}

              {/* King Bed 2.0m x 2.2m */}
              <rect x="560" y="170" width="125" height="115" rx="5" fill="#1E293B" stroke="#818CF8" strokeWidth="1.5" />
              <rect x="575" y="180" width="42" height="24" rx="3" fill="#F1F5F9" opacity="0.9" />
              <rect x="628" y="180" width="42" height="24" rx="3" fill="#F1F5F9" opacity="0.9" />
              {/* Nightstands */}
              <rect x="525" y="185" width="25" height="25" rx="2" fill="#334155" stroke="#64748B" />
              <rect x="695" y="185" width="25" height="25" rx="2" fill="#334155" stroke="#64748B" />

              {/* Block Badge */}
              <g transform="translate(620, 310)">
                <rect x="-52" y="-11" width="104" height="22" rx="4" fill="#0D1117" stroke="#818CF8" strokeWidth="1.5" />
                <text x="0" y="4" fill="#818CF8" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                  PN-01 • 18.2 m²
                </text>
              </g>
            </g>

            {/* ======================================================= */}
            {/* 5. KHỐI PHÒNG NGỦ PHỤ (Second Bedroom Block)            */}
            {/* ======================================================= */}
            <g 
              onClick={() => setSelectedRoom('secondBed')}
              className="transition-all duration-300 group"
              transform={viewMode === '3D_EXPLODED' ? 'translate(20, 10)' : 'translate(0, 0)'}
            >
              {/* Floor Base */}
              <polygon
                points="480,340 760,340 760,470 480,470"
                fill="url(#oakFlooring)"
                stroke={selectedRoom === 'secondBed' ? '#38BDF8' : '#334155'}
                strokeWidth={selectedRoom === 'secondBed' ? '3' : '1.5'}
                className="transition-all hover:fill-[#1A2330]"
              />

              {/* Queen Bed & Study Desk */}
              <rect x="630" y="360" width="100" height="85" rx="4" fill="#1E293B" stroke="#38BDF8" strokeWidth="1.5" />
              <rect x="645" y="368" width="70" height="18" rx="2" fill="#F1F5F9" opacity="0.9" />
              <rect x="510" y="360" width="75" height="35" rx="3" fill="#334155" stroke="#64748B" />

              {/* Block Badge */}
              <g transform="translate(560, 440)">
                <rect x="-48" y="-11" width="96" height="22" rx="4" fill="#0D1117" stroke="#38BDF8" strokeWidth="1.5" />
                <text x="0" y="4" fill="#38BDF8" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                  PN-02 • 12.4 m²
                </text>
              </g>
            </g>

            {/* ======================================================= */}
            {/* 6. KHỐI BAN CÔNG KÍNH (Glass Balcony Block)             */}
            {/* ======================================================= */}
            <g 
              onClick={() => setSelectedRoom('balcony')}
              className="transition-all duration-300 group"
              transform={viewMode === '3D_EXPLODED' ? 'translate(20, 25)' : 'translate(0, 0)'}
            >
              {/* Floor Base */}
              <polygon
                points="480,470 760,470 760,560 480,560"
                fill="url(#marbleTile)"
                stroke={selectedRoom === 'balcony' ? '#10B981' : '#334155'}
                strokeWidth={selectedRoom === 'balcony' ? '3' : '1.5'}
                className="transition-all hover:fill-[#162A22]"
              />

              {/* 3D Glass Curtain Railing */}
              <line x1="760" y1="470" x2="760" y2="560" stroke="#38BDF8" strokeWidth="4" strokeDasharray="8 4" opacity="0.9" />
              <line x1="480" y1="560" x2="760" y2="560" stroke="#38BDF8" strokeWidth="4" strokeDasharray="8 4" opacity="0.9" />

              {/* Outdoor Lounge & Green Planters */}
              <circle cx="520" cy="515" r="14" fill="#10B981" opacity="0.75" />
              <circle cx="550" cy="515" r="10" fill="#10B981" opacity="0.75" />
              <rect x="620" y="495" width="90" height="40" rx="6" fill="#1E293B" stroke="#10B981" strokeWidth="1.5" />

              {/* Curtain Line */}
              <line
                x1="480"
                y1="470"
                x2="760"
                y2="470"
                stroke={curtainsOpen ? '#C5A880' : '#EF4444'}
                strokeWidth="3.5"
                strokeDasharray={curtainsOpen ? '6 4' : '0'}
              />

              {/* Block Badge */}
              <g transform="translate(620, 465)">
                <rect x="-46" y="-10" width="92" height="20" rx="3" fill="#0D1117" stroke="#10B981" strokeWidth="1.5" />
                <text x="0" y="4" fill="#10B981" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                  BC-01 • 7.8 m²
                </text>
              </g>
            </g>

            {/* ======================================================= */}
            {/* 7. ACTIVE IOT SMART HOTSPOT NODES                       */}
            {/* ======================================================= */}
            {showIotNodes && (
              <g className="pointer-events-auto">
                {/* Node 1: Living Room AC */}
                <g transform="translate(460, 150)" className="cursor-pointer">
                  <title>Daikin VRV Inverter AC</title>
                  <circle cx="0" cy="0" r="14" fill={acPower ? '#0284C7' : '#475569'} stroke="#FFFFFF" strokeWidth="1.5" />
                  <text x="0" y="4" fill="#FFFFFF" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">AC</text>
                  {acPower && (
                    <circle cx="0" cy="0" r="22" fill="none" stroke="#38BDF8" strokeWidth="1.5" className="animate-ping opacity-60" />
                  )}
                </g>

                {/* Node 2: Master FaceID Door Lock */}
                <g 
                  transform="translate(80, 310)" 
                  className="cursor-pointer"
                  onClick={interactive ? onToggleDoor : undefined}
                >
                  <title>Khóa Cửa FaceID Master</title>
                  <circle cx="0" cy="0" r="14" fill={doorLocked ? '#059669' : '#DC2626'} stroke="#FFFFFF" strokeWidth="1.5" />
                  <text x="0" y="4" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle">ID</text>
                </g>

                {/* Node 3: Water Leak Sensor in Kitchen */}
                <g transform="translate(430, 530)" className="cursor-pointer">
                  <title>Cảm biến rò rỉ nước AI</title>
                  <circle cx="0" cy="0" r="12" fill={waterLeakActive ? '#0284C7' : '#94A3B8'} stroke="#FFFFFF" strokeWidth="1" />
                  <text x="0" y="3" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle">H2O</text>
                </g>

                {/* Node 4: Balcony Smart Curtain */}
                <g 
                  transform="translate(620, 470)" 
                  className="cursor-pointer"
                  onClick={interactive ? onToggleCurtains : undefined}
                >
                  <title>Rèm ban công tự động</title>
                  <circle cx="0" cy="0" r="13" fill={curtainsOpen ? '#D97706' : '#475569'} stroke="#FFFFFF" strokeWidth="1.5" />
                  <text x="0" y="4" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle">RÈM</text>
                </g>
              </g>
            )}
          </svg>
        </div>

        {/* Compass & Architectural HUD: Top Left */}
        <div className="absolute top-3 left-3 bg-[#0D1117]/95 border border-[#222B35] px-3.5 py-2.5 text-[10px] space-y-1 backdrop-blur-md rounded shadow-xl">
          <div className="text-white font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Căn Hộ {apartmentCode} ({clearArea} m²)
          </div>
          <div className="text-gray-400 font-mono">
            Chế độ: <strong className="text-[#C5A880]">{viewMode}</strong>
          </div>
          <div className="text-gray-400 font-mono">
            Tỉ lệ mô hình: <strong>1:50 Architectural Metric</strong>
          </div>
        </div>

        {/* Read-Only Mode Badge (For Landing Page) */}
        {!interactive && (
          <div className="absolute top-3 right-3 bg-blue-950/90 border border-blue-500/80 px-3 py-1.5 text-[10px] text-blue-300 font-mono rounded backdrop-blur-md flex items-center gap-1.5 shadow-lg">
            <Eye className="w-3.5 h-3.5" /> Chế Độ Xem Kiến Trúc (Đăng nhập tài khoản căn hộ để điều khiển)
          </div>
        )}

        {/* Interactive Click Tip */}
        <div className="absolute bottom-3 right-3 bg-[#1C2533]/90 border border-[#C5A880]/60 px-3 py-1.5 text-[10px] text-[#C5A880] font-mono rounded backdrop-blur-md">
          * Nhấp vào từng khối phòng để kiểm tra thông số kỹ thuật
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. BOTTOM INSPECTION PANEL: ACTIVE ROOM SPECIFICATIONS        */}
      {/* ------------------------------------------------------------- */}
      {activeRoom && (
        <div className="p-4 bg-[#0D1117] border-t border-[#222B35] grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Room Name, Code & Dimensions */}
          <div className="md:col-span-4 border-r border-[#222B35] pr-4 space-y-1">
            <div className="text-[10px] uppercase tracking-wider text-gray-400 font-mono flex items-center justify-between">
              <span>Khối Không Gian Đang Soi</span>
              <span className="text-[#C5A880] font-bold font-mono">{activeRoom.code}</span>
            </div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activeRoom.color }} />
              <span>{activeRoom.name}</span>
            </div>
            <div className="text-xs text-gray-300 font-mono">
              Diện tích: <strong className="text-[#C5A880]">{activeRoom.area} m²</strong> • Kích thước: <strong>{activeRoom.dimensions}</strong>
            </div>
          </div>

          {/* Environmental Sensors for Selected Room */}
          <div className="md:col-span-4 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 bg-[#121820] border border-[#222B35] rounded">
              <div className="text-[10px] text-gray-400">Nhiệt Độ</div>
              <div className="font-mono font-bold text-white mt-0.5">{activeRoom.temperature}°C</div>
            </div>
            <div className="p-2 bg-[#121820] border border-[#222B35] rounded">
              <div className="text-[10px] text-gray-400">Độ Ẩm</div>
              <div className="font-mono font-bold text-blue-400 mt-0.5">{activeRoom.humidity}%</div>
            </div>
            <div className="p-2 bg-[#121820] border border-[#222B35] rounded">
              <div className="text-[10px] text-gray-400">Ánh Sáng</div>
              <div className={`font-mono font-bold mt-0.5 ${activeRoom.lightState ? 'text-amber-400' : 'text-gray-500'}`}>
                {activeRoom.lightState ? 'SÁNG' : 'TẮT'}
              </div>
            </div>
          </div>

          {/* Action Control / Guest Prompt */}
          <div className="md:col-span-4 flex flex-wrap items-center justify-end gap-2">
            {interactive ? (
              <>
                {onToggleLight && (
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedRoom === 'living') onToggleLight('livingRoom');
                      else if (selectedRoom === 'masterBed') onToggleLight('bedroomMaster');
                      else if (selectedRoom === 'diningKitchen') onToggleLight('kitchen');
                      else if (selectedRoom === 'balcony') onToggleLight('balcony');
                    }}
                    className="px-3 py-2 bg-[#161B22] hover:bg-[#C5A880] hover:text-[#0D1117] border border-gray-700 hover:border-[#C5A880] text-xs font-bold uppercase tracking-wider transition-colors rounded flex items-center gap-1.5 text-white"
                  >
                    <Zap className="w-3.5 h-3.5" /> Bật/Tắt Đèn
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

                {selectedRoom === 'foyer' && onToggleDoor && (
                  <button
                    type="button"
                    onClick={onToggleDoor}
                    className="px-3 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-colors rounded flex items-center gap-1.5 shadow"
                  >
                    <Lock className="w-3.5 h-3.5" /> {doorLocked ? 'Mở Khóa' : 'Khóa Chốt'}
                  </button>
                )}
              </>
            ) : (
              <div className="text-[11px] text-gray-400 italic text-right">
                🔒 Đăng nhập tài khoản cá nhân căn hộ này để kích hoạt bảng điều khiển Smart Living thực tế.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
