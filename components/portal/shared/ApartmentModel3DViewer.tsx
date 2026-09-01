'use client';

import React, { useState } from 'react';
import { 
  Box, 
  Layers, 
  Eye, 
  Zap, 
  Cpu, 
  Wind, 
  Droplets, 
  Lock, 
  Sparkles, 
  Sun, 
  ShieldCheck, 
  Grid, 
  Flame, 
  Radio,
  Sliders,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';

export type ViewMode = '3D_ISOMETRIC' | '2D_CAD' | 'XRAY_IOT';
export type ViewAngle = 'SOUTH_WEST' | 'NORTH_EAST' | 'TOP_DOWN';

export interface RoomDetails {
  id: string;
  code: string;
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
  apartmentType = '2PN - 2WC (Master Suite)',
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
  const [selectedRoom, setSelectedRoom] = useState<string>('living');
  const [showDimensions, setShowDimensions] = useState(true);
  const [showIotNodes, setShowIotNodes] = useState(true);

  // Detailed Architectural Room Catalog
  const rooms: Record<string, RoomDetails> = {
    foyer: {
      id: 'foyer',
      code: 'TS',
      name: 'Tiền Sảnh & Tủ Giày',
      nameEn: 'Smart Foyer',
      area: 3.8,
      color: '#E2E8F0',
      temperature: 26,
      humidity: 55,
      lightState: true,
      devices: ['Khóa Cửa FaceID Master', 'Cảm Biến Mở Cửa Từ Tính', 'Đèn Welcome Auto']
    },
    living: {
      id: 'living',
      code: 'PK',
      name: 'Phòng Khách Luxury',
      nameEn: 'Grand Living Room',
      area: 24.6,
      color: '#C5A880',
      temperature: acTemp,
      humidity: 56,
      lightState: lights.livingRoom,
      devices: ['Sofa Chữ L Da Bò Ý', 'Smart TV 85" 4K', 'Điều Hòa VRV Daikin Inverter']
    },
    dining: {
      id: 'dining',
      code: 'BA',
      name: 'Khu Vực Bàn Ăn',
      nameEn: 'Dining Area',
      area: 7.2,
      color: '#CBD5E1',
      temperature: acTemp,
      humidity: 56,
      lightState: lights.livingRoom,
      devices: ['Bàn Ăn Đá Marble 6 Ghế', 'Đèn Thả Nghệ Thuật Dimmable']
    },
    kitchen: {
      id: 'kitchen',
      code: 'BP',
      name: 'Bếp & Đảo Bếp Gourmet',
      nameEn: 'Kitchen & Island',
      area: 9.8,
      color: '#F59E0B',
      temperature: 26,
      humidity: 52,
      lightState: lights.kitchen,
      devices: ['Bếp Từ Âm Bosch 3 Vùng', 'Hút Mùi Tự Động', 'Cảm Biến Rò Rỉ Nước AI']
    },
    masterBed: {
      id: 'masterBed',
      code: 'PN1',
      name: 'Phòng Ngủ Master',
      nameEn: 'Master Suite',
      area: 17.5,
      color: '#818CF8',
      temperature: acTemp - 1,
      humidity: 58,
      lightState: lights.bedroomMaster,
      devices: ['Giường King Size 2m x 2.2m', 'Tủ Áo Cánh Kính LED', 'Cảm Biến Hiện Diện mmWave']
    },
    masterWc: {
      id: 'masterWc',
      code: 'WC1',
      name: 'WC Master & Bồn Tắm',
      nameEn: 'En-suite Bath & Tub',
      area: 5.8,
      color: '#38BDF8',
      temperature: 25,
      humidity: 72,
      lightState: true,
      devices: ['Bồn Tắm Nằm Thư Giãn', 'Bồn Cầu Thông Minh TOTO', 'Vách Tắm Đứng Kính']
    },
    secondBed: {
      id: 'secondBed',
      code: 'PN2',
      name: 'Phòng Ngủ Phụ',
      nameEn: 'Second Bedroom',
      area: 12.2,
      color: '#A78BFA',
      temperature: 25,
      humidity: 60,
      lightState: true,
      devices: ['Giường Queen Size 1.6m', 'Bàn Học & Giá Sách', 'Đèn Bàn Chống Cận']
    },
    guestWc: {
      id: 'guestWc',
      code: 'WC2',
      name: 'WC Khách',
      nameEn: 'Guest Bathroom',
      area: 4.2,
      color: '#06B6D4',
      temperature: 26,
      humidity: 70,
      lightState: false,
      devices: ['Cabin Tắm Đứng', 'Vòi Sen Cây Hansgrohe', 'Lavabo Mặt Đá']
    },
    balcony: {
      id: 'balcony',
      code: 'BC',
      name: 'Ban Công Sky Lounge',
      nameEn: 'Skyline Balcony',
      area: 7.2,
      color: '#10B981',
      temperature: 29,
      humidity: 68,
      lightState: lights.balcony,
      devices: ['Rèm Chắn Nắng Tự Động', 'Sàn Gỗ Ngoài Trời', 'Cây Cảnh & Hoa Leo']
    }
  };

  const activeRoom = rooms[selectedRoom] || rooms['living'];

  return (
    <div className="w-full bg-[#0A0E14] border border-[#222B35] rounded shadow-2xl flex flex-col overflow-hidden select-none">
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP TOOLBAR: COMPACT CONTROLS & CAMERA ANGLES              */}
      {/* ------------------------------------------------------------- */}
      <div className="p-3 bg-[#121820] border-b border-[#222B35] flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: View Mode Pills */}
        <div className="flex items-center gap-1 bg-[#0D1117] p-1 border border-[#222B35] rounded">
          <button
            type="button"
            onClick={() => setViewMode('3D_ISOMETRIC')}
            className={`px-3 py-1.5 font-bold uppercase tracking-wider text-[10px] rounded flex items-center gap-1.5 transition-all ${
              viewMode === '3D_ISOMETRIC'
                ? 'bg-[#C5A880] text-[#0D1117] shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Box className="w-3.5 h-3.5" /> 3D Isometric
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
            <Layers className="w-3.5 h-3.5" /> 2D CAD
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
            <Radio className="w-3.5 h-3.5" /> X-Ray Heatmap
          </button>
        </div>

        {/* Right: Camera Angles & Toggles */}
        <div className="flex items-center gap-2">
          {viewMode === '3D_ISOMETRIC' && (
            <div className="hidden sm:flex items-center gap-1 bg-[#0D1117] p-1 border border-[#222B35] rounded text-[10px]">
              <button
                type="button"
                onClick={() => setViewAngle('SOUTH_WEST')}
                className={`px-2 py-1 rounded transition-colors ${viewAngle === 'SOUTH_WEST' ? 'bg-[#1C2533] text-[#C5A880] font-bold' : 'text-gray-400 hover:text-white'}`}
              >
                Tây Nam
              </button>
              <button
                type="button"
                onClick={() => setViewAngle('NORTH_EAST')}
                className={`px-2 py-1 rounded transition-colors ${viewAngle === 'NORTH_EAST' ? 'bg-[#1C2533] text-[#C5A880] font-bold' : 'text-gray-400 hover:text-white'}`}
              >
                Đông Bắc
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowDimensions(!showDimensions)}
            className={`p-1.5 border rounded transition-colors text-[10px] flex items-center gap-1 ${
              showDimensions ? 'bg-[#1C2533] border-[#C5A880] text-[#C5A880]' : 'bg-[#0D1117] border-gray-700 text-gray-400'
            }`}
            title="Ẩn/Hiện diện tích m²"
          >
            <Grid className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Nhãn m²</span>
          </button>

          <button
            type="button"
            onClick={() => setShowIotNodes(!showIotNodes)}
            className={`p-1.5 border rounded transition-colors text-[10px] flex items-center gap-1 ${
              showIotNodes ? 'bg-[#1C2533] border-emerald-500 text-emerald-400' : 'bg-[#0D1117] border-gray-700 text-gray-400'
            }`}
            title="Ẩn/Hiện Node IoT"
          >
            <Zap className="w-3.5 h-3.5" />
            <span className="hidden md:inline">IoT Nodes</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. MAIN SIMULATION CANVAS: RICH ARCHITECTURAL LAYOUT          */}
      {/* ------------------------------------------------------------- */}
      <div className="relative w-full h-[440px] sm:h-[500px] bg-[#07090D] overflow-hidden flex items-center justify-center">
        {/* Subtle Background Grid */}
        <div 
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(to right, #222B35 1px, transparent 1px), linear-gradient(to bottom, #222B35 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        />

        {/* Ambient Living Room Glow */}
        {lights.livingRoom && (
          <div className="absolute w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none -translate-x-20 -translate-y-10 animate-pulse" />
        )}

        {/* Dynamic Architectural Simulation Canvas */}
        <div 
          className="relative transition-all duration-700 ease-out transform"
          style={{
            transform: viewMode === '3D_ISOMETRIC'
              ? viewAngle === 'SOUTH_WEST'
                ? 'perspective(1200px) rotateX(54deg) rotateZ(-38deg) scale(0.92)'
                : 'perspective(1200px) rotateX(54deg) rotateZ(142deg) scale(0.92)'
              : 'perspective(0px) rotateX(0deg) rotateZ(0deg) scale(0.94)'
          }}
        >
          <svg
            viewBox="0 0 880 620"
            className="w-[660px] sm:w-[780px] h-[460px] sm:h-[540px] drop-shadow-[0_30px_60px_rgba(0,0,0,0.9)] cursor-pointer"
          >
            <defs>
              {/* Floor Textures */}
              <pattern id="oakWood" width="36" height="18" patternUnits="userSpaceOnUse">
                <rect width="36" height="18" fill="#1C1814" stroke="#26201B" strokeWidth="0.8" />
                <line x1="0" y1="9" x2="36" y2="9" stroke="#26201B" strokeWidth="0.6" />
                <line x1="18" y1="0" x2="18" y2="9" stroke="#26201B" strokeWidth="0.6" />
              </pattern>

              <pattern id="marbleTile" width="28" height="28" patternUnits="userSpaceOnUse">
                <rect width="28" height="28" fill="#13171E" stroke="#1E2530" strokeWidth="0.8" />
              </pattern>

              <pattern id="terrazzoBath" width="16" height="16" patternUnits="userSpaceOnUse">
                <rect width="16" height="16" fill="#0F172A" stroke="#1E293B" strokeWidth="0.6" />
                <circle cx="8" cy="8" r="1.5" fill="#38BDF8" opacity="0.4" />
              </pattern>

              {/* Lighting Glow */}
              <radialGradient id="glowWarm" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFE082" stopOpacity="0.85" />
                <stop offset="50%" stopColor="#C5A880" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#C5A880" stopOpacity="0" />
              </radialGradient>

              <radialGradient id="glowCool" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#BAE6FD" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
              </radialGradient>

              {/* Heatmap */}
              <linearGradient id="heatMap" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.6" />
                <stop offset="50%" stopColor="#3B82F6" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.6" />
              </linearGradient>
            </defs>

            {/* ======================================================= */}
            {/* 1. ARCHITECTURAL OUTER WALLS (Độ Dày Tường Bê Tông)     */}
            {/* ======================================================= */}
            <polygon
              points="70,110 810,110 810,550 70,550"
              fill="none"
              stroke="#334155"
              strokeWidth="12"
              strokeLinejoin="round"
            />

            {/* ======================================================= */}
            {/* 2. ZONE: TIỀN SẢNH & CỬA CHÍNH (Foyer & Main Door)     */}
            {/* ======================================================= */}
            <g onClick={() => setSelectedRoom('foyer')} className="group">
              <polygon
                points="80,240 180,240 180,360 80,360"
                fill={viewMode === 'XRAY_IOT' ? 'url(#heatMap)' : 'url(#marbleTile)'}
                stroke={selectedRoom === 'foyer' ? '#C5A880' : '#1E293B'}
                strokeWidth={selectedRoom === 'foyer' ? '2.5' : '1'}
              />
              {/* Smart Shoe Cabinet */}
              <rect x="85" y="250" width="18" height="55" rx="2" fill="#334155" stroke="#64748B" />
              {/* Door Swing Arc */}
              <path d="M 80,320 A 40,40 0 0,1 120,360" fill="none" stroke="#C5A880" strokeWidth="1.2" strokeDasharray="3 3" />
              <line x1="80" y1="320" x2="80" y2="360" stroke="#C5A880" strokeWidth="3" />
              {/* Micro Badge */}
              <g transform="translate(130, 300)">
                <rect x="-24" y="-10" width="48" height="20" rx="4" fill="#0D1117" stroke="#64748B" strokeWidth="1" />
                <text x="0" y="4" fill="#FFFFFF" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                  {showDimensions ? 'TS 3.8m²' : 'TS'}
                </text>
              </g>
            </g>

            {/* ======================================================= */}
            {/* 3. ZONE: PHÒNG KHÁCH (Grand Living Room)               */}
            {/* ======================================================= */}
            <g onClick={() => setSelectedRoom('living')} className="group">
              <polygon
                points="180,120 460,120 460,390 180,390"
                fill={viewMode === 'XRAY_IOT' ? 'url(#heatMap)' : 'url(#oakWood)'}
                stroke={selectedRoom === 'living' ? '#C5A880' : '#1E293B'}
                strokeWidth={selectedRoom === 'living' ? '3' : '1'}
              />
              {/* Warm Light Glow */}
              {lights.livingRoom && viewMode !== '2D_CAD' && (
                <ellipse cx="320" cy="250" rx="120" ry="90" fill="url(#glowWarm)" pointerEvents="none" />
              )}
              {/* Luxury Sectional Sofa */}
              <rect x="230" y="240" width="130" height="42" rx="6" fill="#334155" stroke="#64748B" strokeWidth="1.5" />
              <rect x="230" y="282" width="42" height="50" rx="6" fill="#334155" stroke="#64748B" strokeWidth="1.5" />
              {/* Marble Coffee Table */}
              <rect x="295" y="295" width="55" height="30" rx="3" fill="#C5A880" stroke="#E2D4BF" strokeWidth="1.2" opacity="0.9" />
              {/* TV Wall Console */}
              <rect x="420" y="200" width="16" height="110" rx="2" fill="#0F172A" stroke="#475569" strokeWidth="1.2" />
              <line x1="426" y1="215" x2="426" y2="295" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
              {/* Plant Pot */}
              <circle cx="210" cy="150" r="10" fill="#10B981" />
              {/* Minimalist Micro Badge */}
              <g transform="translate(320, 160)">
                <rect x="-42" y="-11" width="84" height="22" rx="4" fill="#0D1117" stroke="#C5A880" strokeWidth="1.5" />
                <text x="0" y="4" fill="#C5A880" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                  {showDimensions ? 'PK • 24.6 m²' : 'PHÒNG KHÁCH'}
                </text>
              </g>
            </g>

            {/* ======================================================= */}
            {/* 4. ZONE: KHU BÀN ĂN (Dining Area)                      */}
            {/* ======================================================= */}
            <g onClick={() => setSelectedRoom('dining')} className="group">
              <polygon
                points="180,390 320,390 320,540 180,540"
                fill={viewMode === 'XRAY_IOT' ? 'url(#heatMap)' : 'url(#marbleTile)'}
                stroke={selectedRoom === 'dining' ? '#CBD5E1' : '#1E293B'}
                strokeWidth={selectedRoom === 'dining' ? '2.5' : '1'}
              />
              {/* 6-Chair Dining Table */}
              <rect x="210" y="430" width="80" height="42" rx="4" fill="#1E293B" stroke="#64748B" strokeWidth="1.5" />
              <circle cx="230" cy="415" r="7" fill="#C5A880" />
              <circle cx="250" cy="415" r="7" fill="#C5A880" />
              <circle cx="270" cy="415" r="7" fill="#C5A880" />
              <circle cx="230" cy="487" r="7" fill="#C5A880" />
              <circle cx="250" cy="487" r="7" fill="#C5A880" />
              <circle cx="270" cy="487" r="7" fill="#C5A880" />
              {/* Micro Badge */}
              <g transform="translate(250, 515)">
                <rect x="-26" y="-10" width="52" height="20" rx="4" fill="#0D1117" stroke="#64748B" strokeWidth="1" />
                <text x="0" y="4" fill="#FFFFFF" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                  {showDimensions ? 'BA 7.2m²' : 'BÀN ĂN'}
                </text>
              </g>
            </g>

            {/* ======================================================= */}
            {/* 5. ZONE: BẾP & ĐẢO BẾP (Kitchen & Island)              */}
            {/* ======================================================= */}
            <g onClick={() => setSelectedRoom('kitchen')} className="group">
              <polygon
                points="320,390 460,390 460,540 320,540"
                fill={viewMode === 'XRAY_IOT' ? 'url(#heatMap)' : 'url(#marbleTile)'}
                stroke={selectedRoom === 'kitchen' ? '#F59E0B' : '#1E293B'}
                strokeWidth={selectedRoom === 'kitchen' ? '2.5' : '1'}
              />
              {/* L-Shaped Kitchen Counter */}
              <rect x="330" y="480" width="120" height="50" rx="3" fill="#1E293B" stroke="#F59E0B" strokeWidth="1.2" />
              {/* Induction Cooktop with Red Burner */}
              <rect x="345" y="490" width="35" height="25" rx="2" fill="#0F172A" />
              <circle cx="355" cy="502" r="5" fill="#EF4444" opacity="0.9" />
              <circle cx="370" cy="502" r="5" fill="#EF4444" opacity="0.9" />
              {/* Sink */}
              <rect x="400" y="490" width="35" height="25" rx="2" fill="#334155" />
              <circle cx="417" cy="502" r="3" fill="#38BDF8" />
              {/* Island Stools */}
              <circle cx="360" cy="425" r="7" fill="#C5A880" />
              <circle cx="395" cy="425" r="7" fill="#C5A880" />
              <circle cx="430" cy="425" r="7" fill="#C5A880" />
              {/* Micro Badge */}
              <g transform="translate(390, 455)">
                <rect x="-26" y="-10" width="52" height="20" rx="4" fill="#0D1117" stroke="#F59E0B" strokeWidth="1.2" />
                <text x="0" y="4" fill="#F59E0B" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                  {showDimensions ? 'BP 9.8m²' : 'BẾP'}
                </text>
              </g>
            </g>

            {/* ======================================================= */}
            {/* 6. ZONE: BAN CÔNG SKY LOUNGE (Balcony)                 */}
            {/* ======================================================= */}
            <g onClick={() => setSelectedRoom('balcony')} className="group">
              <polygon
                points="460,390 640,390 640,540 460,540"
                fill={viewMode === 'XRAY_IOT' ? 'url(#heatMap)' : 'url(#marbleTile)'}
                stroke={selectedRoom === 'balcony' ? '#10B981' : '#1E293B'}
                strokeWidth={selectedRoom === 'balcony' ? '2.5' : '1'}
              />
              {/* 3D Glass Railing */}
              <line x1="460" y1="540" x2="640" y2="540" stroke="#38BDF8" strokeWidth="4" strokeDasharray="8 4" opacity="0.85" />
              {/* Balcony Coffee Table & Chairs */}
              <rect x="520" y="440" width="40" height="30" rx="4" fill="#1E293B" stroke="#10B981" strokeWidth="1.2" />
              <circle cx="500" cy="455" r="9" fill="#334155" />
              <circle cx="580" cy="455" r="9" fill="#334155" />
              {/* Green Planter Row */}
              <circle cx="480" cy="515" r="10" fill="#10B981" opacity="0.8" />
              <circle cx="510" cy="518" r="8" fill="#10B981" opacity="0.8" />
              <circle cx="615" cy="515" r="10" fill="#10B981" opacity="0.8" />
              {/* Curtain Line */}
              <line
                x1="460"
                y1="390"
                x2="640"
                y2="390"
                stroke={curtainsOpen ? '#C5A880' : '#EF4444'}
                strokeWidth="3.5"
                strokeDasharray={curtainsOpen ? '6 4' : '0'}
              />
              {/* Micro Badge */}
              <g transform="translate(550, 415)">
                <rect x="-26" y="-10" width="52" height="20" rx="4" fill="#0D1117" stroke="#10B981" strokeWidth="1.2" />
                <text x="0" y="4" fill="#10B981" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                  {showDimensions ? 'BC 7.2m²' : 'BAN CÔNG'}
                </text>
              </g>
            </g>

            {/* ======================================================= */}
            {/* 7. ZONE: PHÒNG NGỦ MASTER (Master Suite)               */}
            {/* ======================================================= */}
            <g onClick={() => setSelectedRoom('masterBed')} className="group">
              <polygon
                points="460,120 680,120 680,310 460,310"
                fill={viewMode === 'XRAY_IOT' ? 'url(#heatMap)' : 'url(#oakWood)'}
                stroke={selectedRoom === 'masterBed' ? '#818CF8' : '#1E293B'}
                strokeWidth={selectedRoom === 'masterBed' ? '3' : '1'}
              />
              {/* Cool Blue Glow */}
              {lights.bedroomMaster && viewMode !== '2D_CAD' && (
                <ellipse cx="570" cy="210" rx="90" ry="70" fill="url(#glowCool)" pointerEvents="none" />
              )}
              {/* King Bed with Dual Pillows */}
              <rect x="525" y="150" width="95" height="95" rx="5" fill="#1E293B" stroke="#818CF8" strokeWidth="1.5" />
              <rect x="535" y="158" width="32" height="20" rx="3" fill="#F1F5F9" opacity="0.9" />
              <rect x="578" y="158" width="32" height="20" rx="3" fill="#F1F5F9" opacity="0.9" />
              {/* Nightstands */}
              <rect x="495" y="165" width="22" height="20" rx="2" fill="#334155" stroke="#64748B" />
              <rect x="628" y="165" width="22" height="20" rx="2" fill="#334155" stroke="#64748B" />
              {/* Wardrobe with Glass Slider */}
              <rect x="470" y="270" width="140" height="25" rx="2" fill="#0F172A" stroke="#818CF8" strokeWidth="1.2" />
              {/* Micro Badge */}
              <g transform="translate(570, 275)">
                <rect x="-38" y="-11" width="76" height="22" rx="4" fill="#0D1117" stroke="#818CF8" strokeWidth="1.5" />
                <text x="0" y="4" fill="#818CF8" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                  {showDimensions ? 'PN1 • 17.5m²' : 'PN MASTER'}
                </text>
              </g>
            </g>

            {/* ======================================================= */}
            {/* 8. ZONE: WC MASTER & BỒN TẮM (En-suite Bath & Tub)     */}
            {/* ======================================================= */}
            <g onClick={() => setSelectedRoom('masterWc')} className="group">
              <polygon
                points="680,120 800,120 800,260 680,260"
                fill={viewMode === 'XRAY_IOT' ? 'url(#heatMap)' : 'url(#terrazzoBath)'}
                stroke={selectedRoom === 'masterWc' ? '#38BDF8' : '#1E293B'}
                strokeWidth={selectedRoom === 'masterWc' ? '2.5' : '1'}
              />
              {/* Oval Bathtub */}
              <ellipse cx="740" cy="155" rx="42" ry="22" fill="#F8FAFC" stroke="#38BDF8" strokeWidth="1.5" />
              {/* Smart TOTO Toilet */}
              <rect x="695" y="210" width="24" height="34" rx="10" fill="#F8FAFC" stroke="#64748B" />
              {/* Lavabo with LED Mirror */}
              <rect x="745" y="225" width="40" height="22" rx="2" fill="#334155" stroke="#38BDF8" />
              <circle cx="765" cy="236" r="6" fill="#F8FAFC" />
              {/* Micro Badge */}
              <g transform="translate(740, 195)">
                <rect x="-26" y="-10" width="52" height="20" rx="4" fill="#0D1117" stroke="#38BDF8" strokeWidth="1.2" />
                <text x="0" y="4" fill="#38BDF8" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                  {showDimensions ? 'WC1 5.8m²' : 'WC1'}
                </text>
              </g>
            </g>

            {/* ======================================================= */}
            {/* 9. ZONE: PHÒNG NGỦ PHỤ (Second Bedroom)                */}
            {/* ======================================================= */}
            <g onClick={() => setSelectedRoom('secondBed')} className="group">
              <polygon
                points="680,260 800,260 800,430 680,430"
                fill={viewMode === 'XRAY_IOT' ? 'url(#heatMap)' : 'url(#oakWood)'}
                stroke={selectedRoom === 'secondBed' ? '#A78BFA' : '#1E293B'}
                strokeWidth={selectedRoom === 'secondBed' ? '2.5' : '1'}
              />
              {/* Queen Bed */}
              <rect x="700" y="280" width="80" height="75" rx="4" fill="#1E293B" stroke="#A78BFA" strokeWidth="1.2" />
              <rect x="715" y="288" width="50" height="16" rx="2" fill="#F1F5F9" opacity="0.9" />
              {/* Study Desk & Chair */}
              <rect x="700" y="380" width="50" height="22" rx="2" fill="#334155" stroke="#64748B" />
              <circle cx="725" cy="415" r="7" fill="#C5A880" />
              {/* Micro Badge */}
              <g transform="translate(740, 360)">
                <rect x="-28" y="-10" width="56" height="20" rx="4" fill="#0D1117" stroke="#A78BFA" strokeWidth="1.2" />
                <text x="0" y="4" fill="#A78BFA" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                  {showDimensions ? 'PN2 12.2m²' : 'PN2'}
                </text>
              </g>
            </g>

            {/* ======================================================= */}
            {/* 10. ZONE: WC KHÁCH (Guest Bathroom)                    */}
            {/* ======================================================= */}
            <g onClick={() => setSelectedRoom('guestWc')} className="group">
              <polygon
                points="640,430 800,430 800,540 640,540"
                fill={viewMode === 'XRAY_IOT' ? 'url(#heatMap)' : 'url(#terrazzoBath)'}
                stroke={selectedRoom === 'guestWc' ? '#06B6D4' : '#1E293B'}
                strokeWidth={selectedRoom === 'guestWc' ? '2.5' : '1'}
              />
              {/* Glass Shower Cabin */}
              <rect x="650" y="445" width="45" height="45" rx="2" fill="none" stroke="#06B6D4" strokeWidth="1.5" />
              <circle cx="672" cy="467" r="4" fill="#38BDF8" />
              {/* Toilet & Sink */}
              <rect x="710" y="450" width="22" height="30" rx="8" fill="#F8FAFC" />
              <rect x="745" y="455" width="35" height="20" rx="2" fill="#334155" />
              {/* Micro Badge */}
              <g transform="translate(720, 510)">
                <rect x="-26" y="-10" width="52" height="20" rx="4" fill="#0D1117" stroke="#06B6D4" strokeWidth="1.2" />
                <text x="0" y="4" fill="#06B6D4" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                  {showDimensions ? 'WC2 4.2m²' : 'WC2'}
                </text>
              </g>
            </g>

            {/* ======================================================= */}
            {/* 11. ACTIVE IOT SMART HOTSPOT NODES                      */}
            {/* ======================================================= */}
            {showIotNodes && (
              <g className="pointer-events-auto">
                {/* Node 1: Living Room AC */}
                <g transform="translate(440, 140)" className="cursor-pointer">
                  <title>Daikin VRV AC</title>
                  <circle cx="0" cy="0" r="13" fill={acPower ? '#0284C7' : '#475569'} stroke="#FFFFFF" strokeWidth="1.5" />
                  <text x="0" y="4" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">AC</text>
                  {acPower && (
                    <circle cx="0" cy="0" r="20" fill="none" stroke="#38BDF8" strokeWidth="1.5" className="animate-ping opacity-60" />
                  )}
                </g>

                {/* Node 2: Master FaceID Door Lock */}
                <g transform="translate(90, 320)" className="cursor-pointer" onClick={onToggleDoor}>
                  <title>Khóa FaceID Master</title>
                  <circle cx="0" cy="0" r="13" fill={doorLocked ? '#059669' : '#DC2626'} stroke="#FFFFFF" strokeWidth="1.5" />
                  <text x="0" y="4" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle">ID</text>
                </g>

                {/* Node 3: Water Leak Sensor in Kitchen */}
                <g transform="translate(445, 520)" className="cursor-pointer">
                  <title>Cảm biến rò rỉ nước AI</title>
                  <circle cx="0" cy="0" r="11" fill={waterLeakActive ? '#0284C7' : '#94A3B8'} stroke="#FFFFFF" strokeWidth="1" />
                  <text x="0" y="3" fill="#FFFFFF" fontSize="7" fontWeight="bold" textAnchor="middle">H2O</text>
                </g>

                {/* Node 4: Balcony Smart Curtain */}
                <g transform="translate(550, 390)" className="cursor-pointer" onClick={onToggleCurtains}>
                  <title>Rèm ban công tự động</title>
                  <circle cx="0" cy="0" r="12" fill={curtainsOpen ? '#D97706' : '#475569'} stroke="#FFFFFF" strokeWidth="1.5" />
                  <text x="0" y="4" fill="#FFFFFF" fontSize="7" fontWeight="bold" textAnchor="middle">RÈM</text>
                </g>
              </g>
            )}
          </svg>
        </div>

        {/* Compact HUD Overlay: Top Left */}
        <div className="absolute top-3 left-3 bg-[#0D1117]/95 border border-[#222B35] px-3 py-2 text-[10px] space-y-0.5 backdrop-blur-md rounded shadow-lg">
          <div className="text-white font-bold flex items-center gap-1.5 truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0"></span>
            <span>Căn {apartmentCode} ({clearArea} m²)</span>
          </div>
          <div className="text-gray-400 font-mono text-[9px] truncate">
            Chế độ: <span className="text-[#C5A880] font-bold">{viewMode}</span>
          </div>
        </div>

        {/* Compact Legend: Bottom Left */}
        <div className="absolute bottom-3 left-3 hidden sm:flex items-center gap-2.5 bg-[#0D1117]/95 border border-[#222B35] px-3 py-1.5 text-[10px] backdrop-blur-md rounded text-gray-300">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-sky-500"></span> AC VRV
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> FaceID
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span> Rèm Auto
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-400"></span> Cảm Biến Nước
          </div>
        </div>

        {/* Action Tip: Bottom Right */}
        <div className="absolute bottom-3 right-3 bg-[#1C2533]/90 border border-[#C5A880]/60 px-2.5 py-1 text-[10px] text-[#C5A880] font-mono rounded backdrop-blur-md">
          * Nhấp từng phòng để kiểm tra & điều khiển
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. CLEAN BOTTOM INSPECTION PANEL (Zero Text Overflow)          */}
      {/* ------------------------------------------------------------- */}
      <div className="p-4 bg-[#0D1117] border-t border-[#222B35] grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Active Room Focus */}
        <div className="md:col-span-4 border-r border-[#222B35] pr-3 space-y-1 overflow-hidden">
          <div className="text-[10px] uppercase tracking-wider text-gray-400 font-mono flex items-center justify-between">
            <span>Phòng Đang Chọn</span>
            <span className="text-[#C5A880] font-bold">{activeRoom.code}</span>
          </div>
          <div className="text-sm font-bold text-white flex items-center gap-2 truncate">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: activeRoom.color }} />
            <span className="truncate">{activeRoom.name}</span>
          </div>
          <div className="text-xs text-gray-400 font-mono truncate">
            Diện tích: <strong className="text-[#C5A880]">{activeRoom.area} m²</strong> ({((activeRoom.area / clearArea) * 100).toFixed(1)}% căn hộ)
          </div>
        </div>

        {/* Environmental Telemetry */}
        <div className="md:col-span-4 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2 bg-[#121820] border border-[#222B35] rounded">
            <div className="text-[9px] text-gray-400 truncate">Nhiệt Độ</div>
            <div className="font-mono font-bold text-white mt-0.5">{activeRoom.temperature}°C</div>
          </div>
          <div className="p-2 bg-[#121820] border border-[#222B35] rounded">
            <div className="text-[9px] text-gray-400 truncate">Độ Ẩm</div>
            <div className="font-mono font-bold text-blue-400 mt-0.5">{activeRoom.humidity}%</div>
          </div>
          <div className="p-2 bg-[#121820] border border-[#222B35] rounded">
            <div className="text-[9px] text-gray-400 truncate">Ánh Sáng</div>
            <div className={`font-mono font-bold mt-0.5 ${activeRoom.lightState ? 'text-amber-400' : 'text-gray-500'}`}>
              {activeRoom.lightState ? 'SÁNG' : 'TẮT'}
            </div>
          </div>
        </div>

        {/* Interactive Controls */}
        <div className="md:col-span-4 flex flex-wrap items-center justify-end gap-2">
          {interactive && onToggleLight && (
            <button
              type="button"
              onClick={() => {
                if (selectedRoom === 'living' || selectedRoom === 'dining') onToggleLight('livingRoom');
                else if (selectedRoom === 'masterBed') onToggleLight('bedroomMaster');
                else if (selectedRoom === 'kitchen') onToggleLight('kitchen');
                else if (selectedRoom === 'balcony') onToggleLight('balcony');
              }}
              className="px-3 py-2 bg-[#161B22] hover:bg-[#C5A880] hover:text-[#0D1117] border border-gray-700 hover:border-[#C5A880] text-xs font-bold uppercase tracking-wider transition-colors rounded flex items-center gap-1.5 text-white shadow"
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
        </div>
      </div>
    </div>
  );
}
