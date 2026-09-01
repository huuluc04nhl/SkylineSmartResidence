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
  LockKeyhole,
  Sparkles, 
  Sun, 
  ShieldCheck, 
  Grid, 
  Move,
  Flame,
  Info,
  Radio,
  SplitSquareVertical,
  ShieldAlert,
  SlidersHorizontal
} from 'lucide-react';
import { useAuth } from '@/lib/authContext';

export type ViewMode = '3D_BLOCKS' | '2D_BLUEPRINT' | '3D_EXPLODED';
export type ViewAngle = 'SOUTH_WEST' | 'NORTH_EAST';

export interface RoomDetails {
  id: string;
  code: string;
  name: string;
  nameEn: string;
  area: number; // m2
  dimensions: string; // e.g. "5.8m x 4.6m"
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
  const { currentUser } = useAuth();
  const userRole = currentUser?.role; // 'OWNER' | 'TENANT' | 'ADMIN' | undefined
  const isOwnerOfThisApt = userRole === 'OWNER' && (currentUser?.apartment_code === apartmentCode || !currentUser?.apartment_code);
  const isTenantOfThisApt = userRole === 'TENANT' && (currentUser?.apartment_code === apartmentCode || !currentUser?.apartment_code);
  const isAdmin = userRole === 'ADMIN';
  const isGuest = !currentUser;

  const [viewMode, setViewMode] = useState<ViewMode>('3D_BLOCKS');
  const [viewAngle, setViewAngle] = useState<ViewAngle>('SOUTH_WEST');
  const [selectedRoom, setSelectedRoom] = useState<string>('living');
  const [showDimensions, setShowDimensions] = useState(true);
  const [showIotNodes, setShowIotNodes] = useState(true);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  // Architectural Massing Block Catalog (Non-overlapping strict boundaries)
  const rooms: Record<string, RoomDetails> = {
    foyer: {
      id: 'foyer',
      code: 'TS-01',
      name: 'Tiền Sảnh & Cửa Chính FaceID',
      nameEn: 'Smart Foyer & Entry',
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
      name: 'Phòng Khách & Sinh Hoạt Chung',
      nameEn: 'Grand Living Lounge',
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
      name: 'Bếp & Đảo Bếp Gourmet',
      nameEn: 'Open Kitchen & Island',
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
      name: 'Phòng Ngủ Master Suite',
      nameEn: 'Master Bedroom Suite',
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
      name: 'Phòng Ngủ Phụ / Studio',
      nameEn: 'Guest Suite / Workspace',
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
      name: 'Ban Công Kính Panorama',
      nameEn: 'Skyline Terrace Glass',
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

  // Role Action Handlers
  const handleActionToggleLight = (room: 'livingRoom' | 'bedroomMaster' | 'kitchen' | 'balcony') => {
    if (isAdmin) {
      showToast('🛡️ Ban Quản Lý không có quyền điều khiển thiết bị phòng riêng của cư dân (Bảo mật riêng tư).');
      return;
    }
    if (onToggleLight) {
      onToggleLight(room);
    }
  };

  const handleActionToggleCurtains = () => {
    if (isAdmin) {
      showToast('🛡️ Ban Quản Lý không có quyền đóng/mở rèm phòng riêng của cư dân.');
      return;
    }
    if (onToggleCurtains) {
      onToggleCurtains();
    }
  };

  const handleActionToggleDoor = () => {
    if (isAdmin) {
      showToast('🛡️ Ban Quản Lý không được phép mở khóa căn hộ riêng của cư dân từ xa.');
      return;
    }
    if (isTenantOfThisApt) {
      showToast('⚠️ Quyền Chủ Hộ: Chỉ Chủ Hộ đứng tên căn hộ mới có quyền khóa/mở khóa chốt Master FaceID.');
      return;
    }
    if (onToggleDoor) {
      onToggleDoor();
    }
  };

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
            <Box className="w-3.5 h-3.5" /> 1. Khối Không Gian 3D
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
            <Layers className="w-3.5 h-3.5" /> 2. Mặt Bằng CAD 2D
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
            <SplitSquareVertical className="w-3.5 h-3.5" /> 3. Bóc Tách Khối 3D
          </button>
        </div>

        {/* Right: Camera Angles & Toggles */}
        <div className="flex items-center gap-2">
          {viewMode !== '2D_BLUEPRINT' && (
            <div className="hidden sm:flex items-center gap-1 bg-[#121820] p-1 border border-[#222B35] rounded text-[10px]">
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

          <button
            type="button"
            onClick={() => setShowDimensions(!showDimensions)}
            className={`p-1.5 border rounded transition-colors text-[10px] flex items-center gap-1 ${
              showDimensions ? 'bg-[#1C2533] border-[#C5A880] text-[#C5A880]' : 'bg-[#121820] border-gray-700 text-gray-400'
            }`}
            title="Ẩn/Hiện kích thước Laser CAD"
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
            title="Ẩn/Hiện node thiết bị"
          >
            <Zap className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Thiết Bị</span>
          </button>
        </div>
      </div>

      {/* Toast Feedback Notification */}
      {feedbackToast && (
        <div className="mx-4 mt-3 p-3 bg-[#121E2A] border border-[#C5A880] text-[#C5A880] text-xs font-mono rounded animate-fadeIn flex items-center gap-2 shadow-lg">
          <Sparkles className="w-4 h-4 text-[#C5A880] flex-shrink-0" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. CLEAN ARCHITECTURAL SIMULATION CANVAS (ZERO OVERLAP)        */}
      {/* ------------------------------------------------------------- */}
      <div className="relative w-full h-[440px] sm:h-[480px] bg-[#05070A] overflow-hidden flex items-center justify-center">
        {/* Background Architectural Blueprint Grid */}
        <div 
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(to right, #1E293B 1px, transparent 1px), linear-gradient(to bottom, #1E293B 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        />

        {/* Dynamic Architectural 3D Stage with Smooth Isometric Transformation */}
        <div 
          className="relative transition-all duration-700 ease-out transform"
          style={{
            transform: viewMode === '2D_BLUEPRINT'
              ? 'perspective(0px) rotateX(0deg) rotateZ(0deg) scale(0.95)'
              : viewAngle === 'SOUTH_WEST'
                ? 'perspective(1400px) rotateX(54deg) rotateZ(-36deg) scale(0.92)'
                : 'perspective(1400px) rotateX(54deg) rotateZ(144deg) scale(0.92)'
          }}
        >
          <svg
            viewBox="0 0 880 600"
            className="w-[660px] sm:w-[760px] h-[460px] sm:h-[510px] drop-shadow-[0_30px_60px_rgba(0,0,0,0.95)] cursor-pointer"
          >
            <defs>
              {/* Floor Materials Pattern */}
              <pattern id="oakFlooring" width="36" height="18" patternUnits="userSpaceOnUse">
                <rect width="36" height="18" fill="#141820" stroke="#1F2633" strokeWidth="0.8" />
                <line x1="0" y1="9" x2="36" y2="9" stroke="#1F2633" strokeWidth="0.6" />
                <line x1="18" y1="0" x2="18" y2="9" stroke="#1F2633" strokeWidth="0.6" />
              </pattern>

              <pattern id="marbleTile" width="28" height="28" patternUnits="userSpaceOnUse">
                <rect width="28" height="28" fill="#10141C" stroke="#1E2533" strokeWidth="0.8" />
              </pattern>

              {/* Lighting Radial Cones */}
              <radialGradient id="lightWarmGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFE4A0" stopOpacity="0.85" />
                <stop offset="50%" stopColor="#C5A880" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#C5A880" stopOpacity="0" />
              </radialGradient>

              <radialGradient id="lightCoolGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#BAE6FD" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* ======================================================= */}
            {/* 1. KHỐI TIỀN SẢNH (Foyer Block: x=70, y=240, w=110, h=130)*/}
            {/* ======================================================= */}
            <g 
              onClick={() => setSelectedRoom('foyer')}
              className="transition-all duration-300 group"
              transform={viewMode === '3D_EXPLODED' ? 'translate(-25, 0)' : 'translate(0, 0)'}
            >
              {/* Floor Surface */}
              <rect
                x="70" y="240" width="110" height="130" rx="4"
                fill="url(#marbleTile)"
                stroke={selectedRoom === 'foyer' ? '#C5A880' : '#334155'}
                strokeWidth={selectedRoom === 'foyer' ? '3' : '1.5'}
              />
              {/* Door Swing Arc */}
              <path d="M 75,300 A 35,35 0 0,1 110,335" fill="none" stroke="#C5A880" strokeWidth="1.5" strokeDasharray="3 3" />
              <line x1="75" y1="300" x2="75" y2="335" stroke="#C5A880" strokeWidth="3" strokeLinecap="round" />
              {/* Room Code Badge */}
              <rect x="95" y="295" width="60" height="22" rx="3" fill="#0D1117" stroke="#475569" strokeWidth="1" />
              <text x="125" y="310" fill="#FFFFFF" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                TS 4.2m²
              </text>
            </g>

            {/* ======================================================= */}
            {/* 2. KHỐI PHÒNG KHÁCH (Living: x=190, y=100, w=300, h=270) */}
            {/* ======================================================= */}
            <g 
              onClick={() => setSelectedRoom('living')}
              className="transition-all duration-300 group"
              transform={viewMode === '3D_EXPLODED' ? 'translate(-15, -15)' : 'translate(0, 0)'}
            >
              {/* Floor Surface */}
              <rect
                x="190" y="100" width="300" height="270" rx="4"
                fill="url(#oakFlooring)"
                stroke={selectedRoom === 'living' ? '#C5A880' : '#334155'}
                strokeWidth={selectedRoom === 'living' ? '3' : '1.5'}
                className="transition-all hover:fill-[#1C202B]"
              />

              {/* Ambient Warm Light Cone */}
              {lights.livingRoom && viewMode !== '2D_BLUEPRINT' && (
                <ellipse cx="340" cy="235" rx="130" ry="100" fill="url(#lightWarmGlow)" pointerEvents="none" />
              )}

              {/* Sofa & Coffee Table */}
              <rect x="235" y="210" width="130" height="42" rx="4" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />
              <rect x="235" y="252" width="42" height="48" rx="4" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />
              <rect x="300" y="265" width="60" height="30" rx="3" fill="#C5A880" stroke="#E2D4BF" strokeWidth="1.5" opacity="0.95" />
              {/* TV Wall */}
              <rect x="455" y="180" width="16" height="110" rx="2" fill="#0D1117" stroke="#475569" strokeWidth="1.2" />
              <line x1="461" y1="195" x2="461" y2="275" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />

              {/* Laser Dimensions */}
              {showDimensions && (
                <g className="opacity-80">
                  <line x1="190" y1="88" x2="490" y2="88" stroke="#C5A880" strokeWidth="1" strokeDasharray="3 3" />
                  <text x="340" y="83" fill="#C5A880" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">5.80 m</text>
                </g>
              )}

              {/* Room Badge */}
              <g transform="translate(340, 145)">
                <rect x="-55" y="-12" width="110" height="24" rx="4" fill="#0D1117" stroke="#C5A880" strokeWidth="1.5" />
                <text x="0" y="5" fill="#C5A880" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                  PK-01 • 26.8 m²
                </text>
              </g>
            </g>

            {/* ======================================================= */}
            {/* 3. KHỐI BẾP & ĐẢO BẾP (Kitchen: x=190, y=380, w=300, h=160)*/}
            {/* ======================================================= */}
            <g 
              onClick={() => setSelectedRoom('diningKitchen')}
              className="transition-all duration-300 group"
              transform={viewMode === '3D_EXPLODED' ? 'translate(-15, 20)' : 'translate(0, 0)'}
            >
              {/* Floor Surface */}
              <rect
                x="190" y="380" width="300" height="160" rx="4"
                fill="url(#marbleTile)"
                stroke={selectedRoom === 'diningKitchen' ? '#F59E0B' : '#334155'}
                strokeWidth={selectedRoom === 'diningKitchen' ? '3' : '1.5'}
                className="transition-all hover:fill-[#1C202B]"
              />

              {/* Kitchen Island */}
              <rect x="250" y="410" width="130" height="38" rx="3" fill="#1E293B" stroke="#F59E0B" strokeWidth="1.5" />
              <circle cx="280" cy="465" r="8" fill="#C5A880" />
              <circle cx="315" cy="465" r="8" fill="#C5A880" />
              <circle cx="350" cy="465" r="8" fill="#C5A880" />

              {/* Cooktop & Sink */}
              <rect x="430" y="405" width="42" height="85" rx="3" fill="#0D1117" stroke="#64748B" strokeWidth="1" />
              <circle cx="451" cy="430" r="9" fill="#EF4444" opacity="0.85" />
              <rect x="440" y="455" width="22" height="22" rx="2" fill="#334155" />

              {/* Room Badge */}
              <g transform="translate(340, 515)">
                <rect x="-48" y="-11" width="96" height="22" rx="4" fill="#0D1117" stroke="#F59E0B" strokeWidth="1.5" />
                <text x="0" y="4" fill="#F59E0B" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                  BP-01 • 12.5 m²
                </text>
              </g>
            </g>

            {/* ======================================================= */}
            {/* 4. KHỐI PHÒNG NGỦ MASTER (Master: x=500, y=100, w=290, h=220)*/}
            {/* ======================================================= */}
            <g 
              onClick={() => setSelectedRoom('masterBed')}
              className="transition-all duration-300 group"
              transform={viewMode === '3D_EXPLODED' ? 'translate(20, -15)' : 'translate(0, 0)'}
            >
              {/* Floor Surface */}
              <rect
                x="500" y="100" width="290" height="220" rx="4"
                fill="url(#oakFlooring)"
                stroke={selectedRoom === 'masterBed' ? '#818CF8' : '#334155'}
                strokeWidth={selectedRoom === 'masterBed' ? '3' : '1.5'}
                className="transition-all hover:fill-[#1E2232]"
              />

              {/* Cool Blue Lighting Glow */}
              {lights.bedroomMaster && viewMode !== '2D_BLUEPRINT' && (
                <ellipse cx="645" cy="210" rx="110" ry="85" fill="url(#lightCoolGlow)" pointerEvents="none" />
              )}

              {/* King Bed 2.0m x 2.2m */}
              <rect x="575" y="135" width="120" height="110" rx="5" fill="#1E293B" stroke="#818CF8" strokeWidth="1.5" />
              <rect x="590" y="145" width="38" height="22" rx="3" fill="#F1F5F9" opacity="0.9" />
              <rect x="640" y="145" width="38" height="22" rx="3" fill="#F1F5F9" opacity="0.9" />
              {/* Nightstands */}
              <rect x="542" y="150" width="22" height="22" rx="2" fill="#334155" stroke="#64748B" />
              <rect x="705" y="150" width="22" height="22" rx="2" fill="#334155" stroke="#64748B" />

              {/* Room Badge */}
              <g transform="translate(645, 290)">
                <rect x="-52" y="-11" width="104" height="22" rx="4" fill="#0D1117" stroke="#818CF8" strokeWidth="1.5" />
                <text x="0" y="4" fill="#818CF8" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                  PN-01 • 18.2 m²
                </text>
              </g>
            </g>

            {/* ======================================================= */}
            {/* 5. KHỐI PHÒNG NGỦ PHỤ (Bed 2: x=500, y=330, w=290, h=120) */}
            {/* ======================================================= */}
            <g 
              onClick={() => setSelectedRoom('secondBed')}
              className="transition-all duration-300 group"
              transform={viewMode === '3D_EXPLODED' ? 'translate(20, 10)' : 'translate(0, 0)'}
            >
              {/* Floor Surface */}
              <rect
                x="500" y="330" width="290" height="120" rx="4"
                fill="url(#oakFlooring)"
                stroke={selectedRoom === 'secondBed' ? '#38BDF8' : '#334155'}
                strokeWidth={selectedRoom === 'secondBed' ? '3' : '1.5'}
                className="transition-all hover:fill-[#1A2330]"
              />

              {/* Queen Bed & Study Desk */}
              <rect x="655" y="348" width="95" height="78" rx="4" fill="#1E293B" stroke="#38BDF8" strokeWidth="1.5" />
              <rect x="670" y="355" width="65" height="16" rx="2" fill="#F1F5F9" opacity="0.9" />
              <rect x="525" y="348" width="70" height="32" rx="3" fill="#334155" stroke="#64748B" />

              {/* Room Badge */}
              <g transform="translate(565, 420)">
                <rect x="-48" y="-11" width="96" height="22" rx="4" fill="#0D1117" stroke="#38BDF8" strokeWidth="1.5" />
                <text x="0" y="4" fill="#38BDF8" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                  PN-02 • 12.4 m²
                </text>
              </g>
            </g>

            {/* ======================================================= */}
            {/* 6. KHỐI BAN CÔNG KÍNH (Balcony: x=500, y=460, w=290, h=80)*/}
            {/* ======================================================= */}
            <g 
              onClick={() => setSelectedRoom('balcony')}
              className="transition-all duration-300 group"
              transform={viewMode === '3D_EXPLODED' ? 'translate(20, 25)' : 'translate(0, 0)'}
            >
              {/* Floor Surface */}
              <rect
                x="500" y="460" width="290" height="80" rx="4"
                fill="url(#marbleTile)"
                stroke={selectedRoom === 'balcony' ? '#10B981' : '#334155'}
                strokeWidth={selectedRoom === 'balcony' ? '3' : '1.5'}
                className="transition-all hover:fill-[#162A22]"
              />

              {/* Glass Railing */}
              <line x1="790" y1="460" x2="790" y2="540" stroke="#38BDF8" strokeWidth="3" strokeDasharray="6 3" opacity="0.9" />
              <line x1="500" y1="540" x2="790" y2="540" stroke="#38BDF8" strokeWidth="3" strokeDasharray="6 3" opacity="0.9" />

              {/* Outdoor Lounge & Planters */}
              <circle cx="535" cy="495" r="12" fill="#10B981" opacity="0.75" />
              <circle cx="560" cy="495" r="9" fill="#10B981" opacity="0.75" />
              <rect x="630" y="480" width="85" height="35" rx="5" fill="#1E293B" stroke="#10B981" strokeWidth="1.5" />

              {/* Curtain Line */}
              <line
                x1="500"
                y1="460"
                x2="790"
                y2="460"
                stroke={curtainsOpen ? '#C5A880' : '#EF4444'}
                strokeWidth="3.5"
                strokeDasharray={curtainsOpen ? '6 4' : '0'}
              />

              {/* Room Badge */}
              <g transform="translate(645, 525)">
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
                <g transform="translate(470, 120)" className="cursor-pointer">
                  <title>Daikin VRV Inverter AC</title>
                  <circle cx="0" cy="0" r="13" fill={acPower ? '#0284C7' : '#475569'} stroke="#FFFFFF" strokeWidth="1.5" />
                  <text x="0" y="4" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">AC</text>
                  {acPower && (
                    <circle cx="0" cy="0" r="20" fill="none" stroke="#38BDF8" strokeWidth="1.5" className="animate-ping opacity-60" />
                  )}
                </g>

                {/* Node 2: Master FaceID Door Lock */}
                <g 
                  transform="translate(75, 300)" 
                  className="cursor-pointer"
                  onClick={handleActionToggleDoor}
                >
                  <title>Khóa Cửa FaceID Master</title>
                  <circle cx="0" cy="0" r="13" fill={doorLocked ? '#059669' : '#DC2626'} stroke="#FFFFFF" strokeWidth="1.5" />
                  <text x="0" y="4" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle">ID</text>
                </g>

                {/* Node 3: Water Leak Sensor in Kitchen */}
                <g transform="translate(440, 500)" className="cursor-pointer">
                  <title>Cảm biến rò rỉ nước AI</title>
                  <circle cx="0" cy="0" r="11" fill={waterLeakActive ? '#0284C7' : '#94A3B8'} stroke="#FFFFFF" strokeWidth="1" />
                  <text x="0" y="3" fill="#FFFFFF" fontSize="7" fontWeight="bold" textAnchor="middle">H2O</text>
                </g>

                {/* Node 4: Balcony Smart Curtain */}
                <g 
                  transform="translate(645, 460)" 
                  className="cursor-pointer"
                  onClick={handleActionToggleCurtains}
                >
                  <title>Rèm ban công tự động</title>
                  <circle cx="0" cy="0" r="12" fill={curtainsOpen ? '#D97706' : '#475569'} stroke="#FFFFFF" strokeWidth="1.5" />
                  <text x="0" y="4" fill="#FFFFFF" fontSize="7" fontWeight="bold" textAnchor="middle">RÈM</text>
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
            Tỉ lệ: <strong>1:50 Metric Architectural Layout</strong>
          </div>
        </div>

        {/* Interactive Click Tip */}
        <div className="absolute bottom-3 right-3 bg-[#1C2533]/90 border border-[#C5A880]/60 px-3 py-1.5 text-[10px] text-[#C5A880] font-mono rounded backdrop-blur-md">
          * Nhấp vào từng khối phòng để kiểm tra thông số & bật/tắt thiết bị
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. BOTTOM INSPECTION PANEL & ROLE-AWARE DEVICE CONTROLS       */}
      {/* ------------------------------------------------------------- */}
      {activeRoom && (
        <div className="p-4 bg-[#0D1117] border-t border-[#222B35] grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Room Name, Code & Dimensions */}
          <div className="md:col-span-4 border-r border-[#222B35] pr-4 space-y-1">
            <div className="text-[10px] uppercase tracking-wider text-gray-400 font-mono flex items-center justify-between">
              <span>Khối Đang Chọn</span>
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

          {/* Role-Aware Device Controls */}
          <div className="md:col-span-4 flex flex-wrap items-center justify-end gap-2">
            {/* Light Switch */}
            <button
              type="button"
              onClick={() => {
                if (selectedRoom === 'living') handleActionToggleLight('livingRoom');
                else if (selectedRoom === 'masterBed') handleActionToggleLight('bedroomMaster');
                else if (selectedRoom === 'diningKitchen') handleActionToggleLight('kitchen');
                else if (selectedRoom === 'balcony') handleActionToggleLight('balcony');
                else handleActionToggleLight('livingRoom');
              }}
              className="px-3 py-2 bg-[#161B22] hover:bg-[#C5A880] hover:text-[#0D1117] border border-gray-700 hover:border-[#C5A880] text-xs font-bold uppercase tracking-wider transition-colors rounded flex items-center gap-1.5 text-white shadow"
            >
              <Zap className="w-3.5 h-3.5" /> Bật/Tắt Đèn
            </button>

            {/* Curtain Switch */}
            {selectedRoom === 'balcony' && (
              <button
                type="button"
                onClick={handleActionToggleCurtains}
                className="px-3 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-colors rounded flex items-center gap-1.5 shadow"
              >
                <Sun className="w-3.5 h-3.5" /> {curtainsOpen ? 'Đóng Rèm' : 'Mở Rèm'}
              </button>
            )}

            {/* Master Door Switch (Owner Exclusive) */}
            {selectedRoom === 'foyer' && (
              <button
                type="button"
                onClick={handleActionToggleDoor}
                className={`px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors rounded flex items-center gap-1.5 shadow ${
                  isTenantOfThisApt
                    ? 'bg-amber-950/80 border border-amber-500 text-amber-300'
                    : 'bg-[#C5A880] hover:bg-white text-[#0D1117]'
                }`}
                title={isTenantOfThisApt ? 'Quyền Chủ Hộ: Thành viên gia đình không có quyền mở/đổi mã PIN Master Door' : 'Khóa/Mở chốt FaceID'}
              >
                {isTenantOfThisApt ? (
                  <>
                    <LockKeyhole className="w-3.5 h-3.5 text-amber-400" />
                    <span>Khóa Của Chủ Hộ</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>{doorLocked ? 'Mở Khóa' : 'Khóa Chốt'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
