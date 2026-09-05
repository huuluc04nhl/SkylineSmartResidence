'use client';

import React, { useState } from 'react';
import { 
  Box, 
  Layers, 
  Eye, 
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
  SplitSquareVertical,
  CheckCircle2,
  Maximize2
} from 'lucide-react';
import { useAuth } from '@/lib/authContext';

export type ViewMode = '3D_BLOCKS' | '2D_BLUEPRINT' | '3D_EXPLODED';
export type ViewAngle = 'SOUTH_WEST' | 'NORTH_EAST';

export interface RoomDetails {
  id: string;
  code: string;
  name: string;
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
  apartmentType = '2PN - 2WC',
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
  const isOwner = userRole === 'OWNER';
  const isTenant = userRole === 'TENANT';
  const isAdmin = userRole === 'ADMIN';
  const isGuest = !currentUser || !interactive;

  const [viewMode, setViewMode] = useState<ViewMode>('3D_BLOCKS');
  const [viewAngle, setViewAngle] = useState<ViewAngle>('SOUTH_WEST');
  const [selectedRoom, setSelectedRoom] = useState<string>('living');
  const [showDimensions, setShowDimensions] = useState(true);
  const [showIotNodes, setShowIotNodes] = useState(true);

  // Danh Mục Khối Không Gian Căn Hộ (Chuẩn Thiết Kế Kiến Trúc & Nghiệp Vụ Quản Lý Bất Động Sản)
  const rooms: Record<string, RoomDetails> = {
    foyer: {
      id: 'foyer',
      code: 'SẢNH',
      name: 'Sảnh Đón & Cửa Vào',
      area: 4.2,
      dimensions: '2.1m x 2.0m',
      color: '#64748B',
      borderColor: '#94A3B8',
      temperature: 26,
      humidity: 55,
      lightState: true,
      devices: ['Khóa Cửa Thông Minh FaceID', 'Đèn Cảm Biến Chào Mừng']
    },
    commonBath: {
      id: 'commonBath',
      code: 'WC 2',
      name: 'Phòng Tắm & WC Chung',
      area: 3.8,
      dimensions: '2.0m x 1.9m',
      color: '#06B6D4',
      borderColor: '#67E8F9',
      temperature: 25,
      humidity: 65,
      lightState: true,
      devices: ['Hệ Thống Hút Mùi Tự Động', 'Bình Nước Nóng Ariston']
    },
    living: {
      id: 'living',
      code: 'PK',
      name: 'Phòng Khách & Sinh Hoạt Chung',
      area: 26.8,
      dimensions: '5.8m x 4.6m',
      color: '#C5A880',
      borderColor: '#E2D4BF',
      temperature: acTemp,
      humidity: 56,
      lightState: lights.livingRoom,
      devices: ['Đèn LED Dimmable Chiếu Sáng Thông Minh', 'Điều Hòa Inverter Trung Tâm', 'Smart TV 75"']
    },
    diningKitchen: {
      id: 'diningKitchen',
      code: 'BẾP',
      name: 'Khu Vực Bếp & Bàn Ăn',
      area: 12.5,
      dimensions: '3.8m x 3.3m',
      color: '#F59E0B',
      borderColor: '#FDE68A',
      temperature: 26,
      humidity: 52,
      lightState: lights.kitchen,
      devices: ['Bếp Từ 3 Vùng Nấu', 'Máy Hút Mùi Cảm Biến', 'Cảm Biến Tràn Nước AI']
    },
    masterBed: {
      id: 'masterBed',
      code: 'PN MASTER',
      name: 'Phòng Ngủ Master',
      area: 18.2,
      dimensions: '4.8m x 3.8m',
      color: '#818CF8',
      borderColor: '#C7D2FE',
      temperature: acTemp - 1,
      humidity: 58,
      lightState: lights.bedroomMaster,
      devices: ['Đèn Ngủ Tự Động Điều Chỉnh', 'Cảm Biến Hiện Diện mmWave', 'Rèm Tự Động']
    },
    masterBath: {
      id: 'masterBath',
      code: 'WC 1',
      name: 'Phòng Tắm & WC Master',
      area: 4.5,
      dimensions: '2.4m x 1.9m',
      color: '#3B82F6',
      borderColor: '#93C5FD',
      temperature: 25,
      humidity: 62,
      lightState: true,
      devices: ['Bồn Cầu Thông Minh Tự Động', 'Vòi Sen Âm Trần Cao Cấp']
    },
    secondBed: {
      id: 'secondBed',
      code: 'PN 2',
      name: 'Phòng Ngủ 2',
      area: 12.4,
      dimensions: '3.6m x 3.4m',
      color: '#38BDF8',
      borderColor: '#BAE6FD',
      temperature: 25,
      humidity: 60,
      lightState: true,
      devices: ['Đèn Bàn Cảm Ứng Thông Minh', 'Cảm Biến Báo Cháy PCCC']
    },
    balcony: {
      id: 'balcony',
      code: 'BAN CÔNG',
      name: 'Ban Công & Lô Gia',
      area: 7.8,
      dimensions: '4.6m x 1.7m',
      color: '#10B981',
      borderColor: '#A7F3D0',
      temperature: 29,
      humidity: 68,
      lightState: lights.balcony,
      devices: ['Hệ Rèm Chắn Nắng Tự Động', 'Cảm Biến Mưa & Gió Thông Minh']
    }
  };

  const activeRoom = rooms[selectedRoom] || rooms['living'];

  const getModeLabel = (mode: ViewMode) => {
    switch (mode) {
      case '3D_BLOCKS': return 'Mô Hình Khối 3D';
      case '2D_BLUEPRINT': return 'Mặt Bằng 2D Kỹ Thuật';
      case '3D_EXPLODED': return 'Bóc Tách Khối 3D';
    }
  };

  return (
    <div className="w-full bg-[#080B10] border border-[#222B35] rounded-lg shadow-2xl flex flex-col overflow-hidden select-none">
      {/* ------------------------------------------------------------- */}
      {/* 1. THANH ĐIỀU HƯỚNG CHẾ ĐỘ HIỂN THỊ & GÓC NHÌN                */}
      {/* ------------------------------------------------------------- */}
      <div className="p-3 bg-[#0D1117] border-b border-[#222B35] flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Nút Chuyển Chế Độ Khối 3D / 2D */}
        <div className="flex items-center gap-1.5 bg-[#121820] p-1 border border-[#222B35] rounded">
          <button
            type="button"
            onClick={() => setViewMode('3D_BLOCKS')}
            className={`px-3 py-1.5 font-bold uppercase tracking-wider text-[10px] rounded flex items-center gap-1.5 transition-all ${
              viewMode === '3D_BLOCKS'
                ? 'bg-[#C5A880] text-[#0D1117] shadow font-extrabold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Box className="w-3.5 h-3.5" /> Mô Hình Khối 3D
          </button>

          <button
            type="button"
            onClick={() => setViewMode('2D_BLUEPRINT')}
            className={`px-3 py-1.5 font-bold uppercase tracking-wider text-[10px] rounded flex items-center gap-1.5 transition-all ${
              viewMode === '2D_BLUEPRINT'
                ? 'bg-[#C5A880] text-[#0D1117] shadow font-extrabold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Mặt Bằng 2D Kỹ Thuật
          </button>

          <button
            type="button"
            onClick={() => setViewMode('3D_EXPLODED')}
            className={`px-3 py-1.5 font-bold uppercase tracking-wider text-[10px] rounded flex items-center gap-1.5 transition-all ${
              viewMode === '3D_EXPLODED'
                ? 'bg-amber-400 text-[#0D1117] shadow font-extrabold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <SplitSquareVertical className="w-3.5 h-3.5" /> Bóc Tách Khối 3D
          </button>
        </div>

        {/* Nút Góc Nhìn & Bộ Lọc Lớp Hiển Thị */}
        <div className="flex items-center gap-2">
          {viewMode !== '2D_BLUEPRINT' && (
            <div className="hidden sm:flex items-center gap-1 bg-[#121820] p-1 border border-[#222B35] rounded text-[10px]">
              <button
                type="button"
                onClick={() => setViewAngle('SOUTH_WEST')}
                className={`px-2.5 py-1 rounded transition-colors ${viewAngle === 'SOUTH_WEST' ? 'bg-[#1C2533] text-[#C5A880] font-bold shadow' : 'text-gray-400 hover:text-white'}`}
              >
                Góc Tây Nam
              </button>
              <button
                type="button"
                onClick={() => setViewAngle('NORTH_EAST')}
                className={`px-2.5 py-1 rounded transition-colors ${viewAngle === 'NORTH_EAST' ? 'bg-[#1C2533] text-[#C5A880] font-bold shadow' : 'text-gray-400 hover:text-white'}`}
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
            title="Ẩn / Hiện kích thước kỹ thuật CAD"
          >
            <Grid className="w-3.5 h-3.5" />
            <span className="hidden md:inline font-medium">Kích Thước</span>
          </button>

          <button
            type="button"
            onClick={() => setShowIotNodes(!showIotNodes)}
            className={`p-1.5 border rounded transition-colors text-[10px] flex items-center gap-1 ${
              showIotNodes ? 'bg-[#1C2533] border-emerald-500 text-emerald-400' : 'bg-[#121820] border-gray-700 text-gray-400'
            }`}
            title="Ẩn / Hiện điểm cảm biến thiết bị thông minh"
          >
            <Zap className="w-3.5 h-3.5" />
            <span className="hidden md:inline font-medium">Cảm Biến</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. KHÔNG GIAN HIỂN THỊ MÔ HÌNH KHỐI (CANVAS SVG ĐA CHIỀU)     */}
      {/* ------------------------------------------------------------- */}
      <div className="relative w-full h-[470px] sm:h-[510px] bg-[#05070A] overflow-hidden flex items-center justify-center">
        {/* Lưới Nền Kiến Trúc Chuẩn CAD */}
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: viewMode === '2D_BLUEPRINT'
              ? 'linear-gradient(to right, #0284C7 1px, transparent 1px), linear-gradient(to bottom, #0284C7 1px, transparent 1px)'
              : 'linear-gradient(to right, #1E293B 1px, transparent 1px), linear-gradient(to bottom, #1E293B 1px, transparent 1px)',
            backgroundSize: viewMode === '2D_BLUEPRINT' ? '20px 20px' : '28px 28px'
          }}
        />

        {/* Khung Chiếu 3D Đa Trục - Phối Cảnh Trực Quan */}
        <div 
          className="relative transition-all duration-700 ease-out transform"
          style={{
            transform: viewMode === '2D_BLUEPRINT'
              ? 'perspective(0px) rotateX(0deg) rotateZ(0deg) scale(0.92)'
              : viewAngle === 'SOUTH_WEST'
                ? 'perspective(1500px) rotateX(52deg) rotateZ(-34deg) scale(0.88)'
                : 'perspective(1500px) rotateX(52deg) rotateZ(146deg) scale(0.88)'
          }}
        >
          <svg
            viewBox="0 0 960 640"
            className="w-[700px] sm:w-[840px] h-[480px] sm:h-[540px] drop-shadow-[0_35px_70px_rgba(0,0,0,0.95)] cursor-pointer"
          >
            <defs>
              {/* Vân Sàn Gỗ Tự Nhiên Cao Cấp */}
              <pattern id="oakFlooring" width="36" height="18" patternUnits="userSpaceOnUse">
                <rect width="36" height="18" fill="#141820" stroke="#1F2633" strokeWidth="0.8" />
                <line x1="0" y1="9" x2="36" y2="9" stroke="#1F2633" strokeWidth="0.6" />
                <line x1="18" y1="0" x2="18" y2="9" stroke="#1F2633" strokeWidth="0.6" />
              </pattern>

              {/* Vân Đá Marble Cẩm Thạch */}
              <pattern id="marbleTile" width="32" height="32" patternUnits="userSpaceOnUse">
                <rect width="32" height="32" fill="#0F141C" stroke="#1E2533" strokeWidth="0.8" />
                <circle cx="16" cy="16" r="1.5" fill="#2A3649" />
              </pattern>

              {/* Nón Ánh Sáng Ấm Phòng Khách */}
              <radialGradient id="lightWarmGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFE8B0" stopOpacity="0.8" />
                <stop offset="60%" stopColor="#C5A880" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#C5A880" stopOpacity="0" />
              </radialGradient>

              {/* Nón Ánh Sáng Xanh Êm Dịu Phòng Ngủ */}
              <radialGradient id="lightCoolGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#C7D2FE" stopOpacity="0.75" />
                <stop offset="60%" stopColor="#818CF8" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#818CF8" stopOpacity="0" />
              </radialGradient>

              {/* Hiệu Ứng Chiều Sâu Thành Khối 3D */}
              <linearGradient id="wallExtrusionLeft" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0B0F17" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#1E293B" stopOpacity="0.4" />
              </linearGradient>
            </defs>

            {/* ======================================================= */}
            {/* 1. KHỐI SẢNH ĐÓN (Foyer: x=50, y=260, w=120, h=140)     */}
            {/* ======================================================= */}
            <g 
              onClick={() => setSelectedRoom('foyer')}
              className="transition-all duration-300 group"
              transform={viewMode === '3D_EXPLODED' ? 'translate(-35, 0)' : 'translate(0, 0)'}
            >
              {/* Thành Khối 3D Volumetric Extrusion */}
              {viewMode === '3D_BLOCKS' && (
                <path d="M 50,400 L 50,412 L 170,412 L 170,400 Z" fill="#0A0E17" stroke="#334155" strokeWidth="1" />
              )}
              {/* Mặt Sàn Khối Sảnh */}
              <rect
                x="50" y="260" width="120" height="140" rx="4"
                fill="url(#marbleTile)"
                stroke={selectedRoom === 'foyer' ? '#C5A880' : '#334155'}
                strokeWidth={selectedRoom === 'foyer' ? '3' : '1.5'}
                className="transition-all hover:fill-[#161F2C]"
              />
              {/* Vòng Cung Cửa Mở FaceID */}
              <path d="M 55,330 A 40,40 0 0,1 95,370" fill="none" stroke="#C5A880" strokeWidth="1.5" strokeDasharray="3 3" />
              <line x1="55" y1="330" x2="55" y2="370" stroke="#C5A880" strokeWidth="3.5" strokeLinecap="round" />
              <rect x="115" y="280" width="45" height="25" rx="3" fill="#1E293B" stroke="#475569" strokeWidth="1" />
              
              {/* Thẻ Nhãn Khối Chuẩn */}
              <g transform="translate(110, 375)">
                <rect x="-44" y="-10" width="88" height="20" rx="3" fill="#0D1117" stroke="#64748B" strokeWidth="1" />
                <text x="0" y="4" fill="#E2E8F0" fontSize="9.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                  Sảnh Đón • 4.2 m²
                </text>
              </g>
            </g>

            {/* ======================================================= */}
            {/* 2. KHỐI WC CHUNG (commonBath: x=50, y=140, w=120, h=110)*/}
            {/* ======================================================= */}
            <g 
              onClick={() => setSelectedRoom('commonBath')}
              className="transition-all duration-300 group"
              transform={viewMode === '3D_EXPLODED' ? 'translate(-35, -25)' : 'translate(0, 0)'}
            >
              {viewMode === '3D_BLOCKS' && (
                <path d="M 50,250 L 50,260 L 170,260 L 170,250 Z" fill="#0A0E17" stroke="#334155" strokeWidth="1" />
              )}
              <rect
                x="50" y="140" width="120" height="110" rx="4"
                fill="url(#marbleTile)"
                stroke={selectedRoom === 'commonBath' ? '#06B6D4' : '#334155'}
                strokeWidth={selectedRoom === 'commonBath' ? '3' : '1.5'}
                className="transition-all hover:fill-[#12242E]"
              />
              {/* Chi Tiết Buồng Tắm Kính & Lavabo */}
              <rect x="60" y="150" width="42" height="42" rx="2" fill="#0E2330" stroke="#06B6D4" strokeWidth="1.2" strokeDasharray="3 2" />
              <circle cx="81" cy="171" r="5" fill="#38BDF8" opacity="0.8" />
              <rect x="115" y="150" width="38" height="22" rx="2" fill="#1E293B" stroke="#64748B" />
              <circle cx="134" cy="161" r="6" fill="#F8FAFC" />
              <rect x="120" y="200" width="30" height="38" rx="5" fill="#1E293B" stroke="#64748B" />

              {/* Thẻ Nhãn Khối Chuẩn */}
              <g transform="translate(110, 235)">
                <rect x="-42" y="-10" width="84" height="20" rx="3" fill="#0D1117" stroke="#06B6D4" strokeWidth="1" />
                <text x="0" y="4" fill="#06B6D4" fontSize="9.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                  WC Chung • 3.8 m²
                </text>
              </g>
            </g>

            {/* ======================================================= */}
            {/* 3. KHỐI PHÒNG KHÁCH (Living: x=180, y=90, w=320, h=270) */}
            {/* ======================================================= */}
            <g 
              onClick={() => setSelectedRoom('living')}
              className="transition-all duration-300 group"
              transform={viewMode === '3D_EXPLODED' ? 'translate(0, -30)' : 'translate(0, 0)'}
            >
              {viewMode === '3D_BLOCKS' && (
                <path d="M 180,360 L 180,372 L 500,372 L 500,360 Z" fill="#0A0E17" stroke="#334155" strokeWidth="1" />
              )}
              <rect
                x="180" y="90" width="320" height="270" rx="4"
                fill="url(#oakFlooring)"
                stroke={selectedRoom === 'living' ? '#C5A880' : '#334155'}
                strokeWidth={selectedRoom === 'living' ? '3' : '1.5'}
                className="transition-all hover:fill-[#1B202B]"
              />

              {/* Nón Ánh Sáng Chiếu Tỏa */}
              {lights.livingRoom && viewMode !== '2D_BLUEPRINT' && (
                <ellipse cx="340" cy="225" rx="140" ry="110" fill="url(#lightWarmGlow)" pointerEvents="none" />
              )}

              {/* Ghế Sofa Chữ L Sang Trọng & Bàn Trà */}
              <rect x="230" y="195" width="145" height="44" rx="4" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />
              <rect x="230" y="239" width="44" height="52" rx="4" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />
              <rect x="300" y="255" width="68" height="34" rx="3" fill="#C5A880" stroke="#E2D4BF" strokeWidth="1.5" opacity="0.95" />
              {/* Kệ TV Màn Hình Siêu Mỏng */}
              <rect x="470" y="170" width="18" height="115" rx="2" fill="#0D1117" stroke="#475569" strokeWidth="1.2" />
              <line x1="477" y1="185" x2="477" y2="270" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" />

              {/* Bàn Ăn 6 Ghế Khu Vực Tiếp Giáp */}
              <rect x="230" y="120" width="90" height="42" rx="3" fill="#1E293B" stroke="#C5A880" strokeWidth="1.2" />
              <circle cx="245" cy="112" r="5" fill="#475569" />
              <circle cx="275" cy="112" r="5" fill="#475569" />
              <circle cx="305" cy="112" r="5" fill="#475569" />
              <circle cx="245" cy="170" r="5" fill="#475569" />
              <circle cx="275" cy="170" r="5" fill="#475569" />
              <circle cx="305" cy="170" r="5" fill="#475569" />

              {/* Đường Đo Kích Thước Laser CAD */}
              {showDimensions && (
                <g className="opacity-80">
                  <line x1="180" y1="78" x2="500" y2="78" stroke="#C5A880" strokeWidth="1" strokeDasharray="3 3" />
                  <text x="340" y="73" fill="#C5A880" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">5.80 m</text>
                </g>
              )}

              {/* Thẻ Nhãn Khối Chuẩn */}
              <g transform="translate(340, 315)">
                <rect x="-56" y="-11" width="112" height="22" rx="4" fill="#0D1117" stroke="#C5A880" strokeWidth="1.5" />
                <text x="0" y="4.5" fill="#C5A880" fontSize="10.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                  Phòng Khách • 26.8 m²
                </text>
              </g>
            </g>

            {/* ======================================================= */}
            {/* 4. KHỐI BẾP & BÀN ĂN (Kitchen: x=180, y=370, w=320, h=180)*/}
            {/* ======================================================= */}
            <g 
              onClick={() => setSelectedRoom('diningKitchen')}
              className="transition-all duration-300 group"
              transform={viewMode === '3D_EXPLODED' ? 'translate(0, 30)' : 'translate(0, 0)'}
            >
              {viewMode === '3D_BLOCKS' && (
                <path d="M 180,550 L 180,562 L 500,562 L 500,550 Z" fill="#0A0E17" stroke="#334155" strokeWidth="1" />
              )}
              <rect
                x="180" y="370" width="320" height="180" rx="4"
                fill="url(#marbleTile)"
                stroke={selectedRoom === 'diningKitchen' ? '#F59E0B' : '#334155'}
                strokeWidth={selectedRoom === 'diningKitchen' ? '3' : '1.5'}
                className="transition-all hover:fill-[#211E18]"
              />

              {/* Đảo Bếp & Quầy Bar */}
              <rect x="235" y="405" width="135" height="42" rx="3" fill="#1E293B" stroke="#F59E0B" strokeWidth="1.5" />
              <circle cx="260" cy="465" r="7" fill="#C5A880" />
              <circle cx="300" cy="465" r="7" fill="#C5A880" />
              <circle cx="340" cy="465" r="7" fill="#C5A880" />

              {/* Bếp Từ & Chậu Rửa Inox */}
              <rect x="440" y="395" width="46" height="95" rx="3" fill="#0D1117" stroke="#64748B" strokeWidth="1" />
              <circle cx="463" cy="420" r="8" fill="#EF4444" opacity="0.85" />
              <circle cx="463" cy="445" r="6" fill="#EF4444" opacity="0.7" />
              <rect x="450" y="465" width="26" height="18" rx="2" fill="#334155" />

              {/* Thẻ Nhãn Khối Chuẩn */}
              <g transform="translate(340, 520)">
                <rect x="-52" y="-11" width="104" height="22" rx="4" fill="#0D1117" stroke="#F59E0B" strokeWidth="1.5" />
                <text x="0" y="4.5" fill="#F59E0B" fontSize="10.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                  Bếp & Ăn • 12.5 m²
                </text>
              </g>
            </g>

            {/* ======================================================= */}
            {/* 5. KHỐI PHÒNG NGỦ MASTER (Master: x=510, y=90, w=270, h=200)*/}
            {/* ======================================================= */}
            <g 
              onClick={() => setSelectedRoom('masterBed')}
              className="transition-all duration-300 group"
              transform={viewMode === '3D_EXPLODED' ? 'translate(30, -30)' : 'translate(0, 0)'}
            >
              {viewMode === '3D_BLOCKS' && (
                <path d="M 510,290 L 510,302 L 780,302 L 780,290 Z" fill="#0A0E17" stroke="#334155" strokeWidth="1" />
              )}
              <rect
                x="510" y="90" width="270" height="200" rx="4"
                fill="url(#oakFlooring)"
                stroke={selectedRoom === 'masterBed' ? '#818CF8' : '#334155'}
                strokeWidth={selectedRoom === 'masterBed' ? '3' : '1.5'}
                className="transition-all hover:fill-[#1D2133]"
              />

              {/* Ánh Sáng Êm Dịu */}
              {lights.bedroomMaster && viewMode !== '2D_BLUEPRINT' && (
                <ellipse cx="645" cy="190" rx="100" ry="75" fill="url(#lightCoolGlow)" pointerEvents="none" />
              )}

              {/* Giường King Size 2.0m x 2.2m */}
              <rect x="585" y="120" width="115" height="105" rx="5" fill="#1E293B" stroke="#818CF8" strokeWidth="1.5" />
              <rect x="597" y="130" width="36" height="20" rx="3" fill="#F1F5F9" opacity="0.9" />
              <rect x="647" y="130" width="36" height="20" rx="3" fill="#F1F5F9" opacity="0.9" />
              <rect x="555" y="135" width="22" height="20" rx="2" fill="#334155" stroke="#64748B" />
              <rect x="710" y="135" width="22" height="20" rx="2" fill="#334155" stroke="#64748B" />

              {/* Tủ Quần Áo Âm Tường */}
              <rect x="525" y="240" width="150" height="28" rx="2" fill="#1E293B" stroke="#64748B" />

              {/* Thẻ Nhãn Khối Chuẩn */}
              <g transform="translate(645, 270)">
                <rect x="-56" y="-11" width="112" height="22" rx="4" fill="#0D1117" stroke="#818CF8" strokeWidth="1.5" />
                <text x="0" y="4.5" fill="#818CF8" fontSize="10.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                  PN Master • 18.2 m²
                </text>
              </g>
            </g>

            {/* ======================================================= */}
            {/* 6. KHỐI WC MASTER (masterBath: x=790, y=90, w=120, h=200) */}
            {/* ======================================================= */}
            <g 
              onClick={() => setSelectedRoom('masterBath')}
              className="transition-all duration-300 group"
              transform={viewMode === '3D_EXPLODED' ? 'translate(55, -30)' : 'translate(0, 0)'}
            >
              {viewMode === '3D_BLOCKS' && (
                <path d="M 790,290 L 790,302 L 910,302 L 910,290 Z" fill="#0A0E17" stroke="#334155" strokeWidth="1" />
              )}
              <rect
                x="790" y="90" width="120" height="200" rx="4"
                fill="url(#marbleTile)"
                stroke={selectedRoom === 'masterBath' ? '#3B82F6' : '#334155'}
                strokeWidth={selectedRoom === 'masterBath' ? '3' : '1.5'}
                className="transition-all hover:fill-[#122338]"
              />

              {/* Bồn Tắm Nằm Thư Giãn Luxury */}
              <rect x="805" y="110" width="90" height="42" rx="15" fill="#0D1117" stroke="#3B82F6" strokeWidth="1.5" />
              <circle cx="825" cy="131" r="4" fill="#60A5FA" />
              {/* Lavabo Đá & Bồn Cầu Thông Minh */}
              <rect x="815" y="170" width="70" height="24" rx="3" fill="#1E293B" stroke="#64748B" />
              <circle cx="850" cy="182" r="6" fill="#FFFFFF" />
              <rect x="830" y="220" width="40" height="45" rx="8" fill="#1E293B" stroke="#64748B" />

              {/* Thẻ Nhãn Khối Chuẩn */}
              <g transform="translate(850, 270)">
                <rect x="-44" y="-10" width="88" height="20" rx="3" fill="#0D1117" stroke="#3B82F6" strokeWidth="1" />
                <text x="0" y="4" fill="#60A5FA" fontSize="9.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                  WC Master • 4.5 m²
                </text>
              </g>
            </g>

            {/* ======================================================= */}
            {/* 7. KHỐI PHÒNG NGỦ 2 (secondBed: x=510, y=300, w=270, h=150)*/}
            {/* ======================================================= */}
            <g 
              onClick={() => setSelectedRoom('secondBed')}
              className="transition-all duration-300 group"
              transform={viewMode === '3D_EXPLODED' ? 'translate(30, 5)' : 'translate(0, 0)'}
            >
              {viewMode === '3D_BLOCKS' && (
                <path d="M 510,450 L 510,462 L 780,462 L 780,450 Z" fill="#0A0E17" stroke="#334155" strokeWidth="1" />
              )}
              <rect
                x="510" y="300" width="270" height="150" rx="4"
                fill="url(#oakFlooring)"
                stroke={selectedRoom === 'secondBed' ? '#38BDF8' : '#334155'}
                strokeWidth={selectedRoom === 'secondBed' ? '3' : '1.5'}
                className="transition-all hover:fill-[#1A2533]"
              />

              {/* Giường Queen & Bàn Làm Việc */}
              <rect x="655" y="325" width="105" height="85" rx="4" fill="#1E293B" stroke="#38BDF8" strokeWidth="1.5" />
              <rect x="670" y="333" width="75" height="18" rx="2" fill="#F1F5F9" opacity="0.9" />
              <rect x="530" y="325" width="80" height="35" rx="3" fill="#334155" stroke="#64748B" />

              {/* Thẻ Nhãn Khối Chuẩn */}
              <g transform="translate(585, 420)">
                <rect x="-48" y="-11" width="96" height="22" rx="4" fill="#0D1117" stroke="#38BDF8" strokeWidth="1.5" />
                <text x="0" y="4.5" fill="#38BDF8" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                  Phòng Ngủ 2 • 12.4 m²
                </text>
              </g>
            </g>

            {/* ======================================================= */}
            {/* 8. KHỐI BAN CÔNG & LÔ GIA (Balcony: x=510, y=460, w=400, h=90)*/}
            {/* ======================================================= */}
            <g 
              onClick={() => setSelectedRoom('balcony')}
              className="transition-all duration-300 group"
              transform={viewMode === '3D_EXPLODED' ? 'translate(30, 35)' : 'translate(0, 0)'}
            >
              {viewMode === '3D_BLOCKS' && (
                <path d="M 510,550 L 510,562 L 910,562 L 910,550 Z" fill="#0A0E17" stroke="#334155" strokeWidth="1" />
              )}
              <rect
                x="510" y="460" width="400" height="90" rx="4"
                fill="url(#marbleTile)"
                stroke={selectedRoom === 'balcony' ? '#10B981' : '#334155'}
                strokeWidth={selectedRoom === 'balcony' ? '3' : '1.5'}
                className="transition-all hover:fill-[#142B23]"
              />

              {/* Lan Can Kính Cường Lực & Ghế Thư Giãn */}
              <line x1="910" y1="460" x2="910" y2="550" stroke="#38BDF8" strokeWidth="3.5" strokeDasharray="6 3" opacity="0.9" />
              <line x1="510" y1="550" x2="910" y2="550" stroke="#38BDF8" strokeWidth="3.5" strokeDasharray="6 3" opacity="0.9" />

              <circle cx="545" cy="505" r="14" fill="#10B981" opacity="0.75" />
              <circle cx="580" cy="505" r="10" fill="#10B981" opacity="0.75" />
              <rect x="670" y="485" width="95" height="38" rx="5" fill="#1E293B" stroke="#10B981" strokeWidth="1.5" />

              {/* Đường Rèm Chắn Nắng Tự Động */}
              <line
                x1="510"
                y1="460"
                x2="910"
                y2="460"
                stroke={curtainsOpen ? '#C5A880' : '#EF4444'}
                strokeWidth="4"
                strokeDasharray={curtainsOpen ? '8 4' : '0'}
              />

              {/* Thẻ Nhãn Khối Chuẩn */}
              <g transform="translate(830, 525)">
                <rect x="-50" y="-10" width="100" height="20" rx="3" fill="#0D1117" stroke="#10B981" strokeWidth="1.5" />
                <text x="0" y="4" fill="#10B981" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                  Ban Công • 7.8 m²
                </text>
              </g>
            </g>

            {/* ======================================================= */}
            {/* 9. ĐIỂM CẢM BIẾN THÔNG MINH IOT (HOTSPOT NODES)        */}
            {/* ======================================================= */}
            {showIotNodes && (
              <g className="pointer-events-auto">
                {/* Node 1: Điều Hòa Phòng Khách */}
                <g transform="translate(480, 115)" className="cursor-pointer">
                  <title>Điều Hòa Inverter Trung Tâm</title>
                  <circle cx="0" cy="0" r="13" fill={acPower ? '#0284C7' : '#475569'} stroke="#FFFFFF" strokeWidth="1.5" />
                  <text x="0" y="4" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">AC</text>
                  {acPower && (
                    <circle cx="0" cy="0" r="20" fill="none" stroke="#38BDF8" strokeWidth="1.5" className="animate-ping opacity-60" />
                  )}
                </g>

                {/* Node 2: Khóa Cửa FaceID */}
                <g 
                  transform="translate(55, 330)" 
                  className={isOwner ? "cursor-pointer" : "cursor-default"}
                  onClick={isOwner ? onToggleDoor : undefined}
                >
                  <title>{isOwner ? "Khóa Cửa FaceID Master" : "Khóa Cửa FaceID Căn Hộ"}</title>
                  <circle cx="0" cy="0" r="13" fill={doorLocked ? '#059669' : '#DC2626'} stroke="#FFFFFF" strokeWidth="1.5" />
                  <text x="0" y="4" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle">ID</text>
                </g>

                {/* Node 3: Cảm Biến Tràn Nước Bếp */}
                <g transform="translate(455, 510)" className="cursor-pointer">
                  <title>Cảm biến cảnh báo rò rỉ nước AI</title>
                  <circle cx="0" cy="0" r="11" fill={waterLeakActive ? '#0284C7' : '#94A3B8'} stroke="#FFFFFF" strokeWidth="1" />
                  <text x="0" y="3" fill="#FFFFFF" fontSize="7" fontWeight="bold" textAnchor="middle">H2O</text>
                </g>

                {/* Node 4: Rèm Ban Công */}
                <g 
                  transform="translate(715, 460)" 
                  className={isOwner || isTenant ? "cursor-pointer" : "cursor-default"}
                  onClick={(isOwner || isTenant) ? onToggleCurtains : undefined}
                >
                  <title>Hệ Thống Rèm Ban Công Tự Động</title>
                  <circle cx="0" cy="0" r="12" fill={curtainsOpen ? '#D97706' : '#475569'} stroke="#FFFFFF" strokeWidth="1.5" />
                  <text x="0" y="4" fill="#FFFFFF" fontSize="7" fontWeight="bold" textAnchor="middle">RÈM</text>
                </g>
              </g>
            )}
          </svg>
        </div>

        {/* HUD Góc Trên Bên Trái: Thông Số Căn Hộ & Chế Độ */}
        <div className="absolute top-3 left-3 bg-[#0D1117]/95 border border-[#222B35] px-3.5 py-2.5 text-[10px] space-y-1 backdrop-blur-md rounded shadow-xl">
          <div className="text-white font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Căn Hộ {apartmentCode} • {apartmentType} ({clearArea} m²)
          </div>
          <div className="text-gray-300 font-mono">
            Chế độ hiển thị: <strong className="text-[#C5A880]">{getModeLabel(viewMode)}</strong>
          </div>
          <div className="text-gray-400 font-mono">
            Tỉ lệ hiển thị: <strong>1:50 Chuẩn Thiết Kế Kiến Trúc</strong>
          </div>
        </div>

        {/* Gợi Ý Thao Tác Trực Quan */}
        <div className="absolute bottom-3 right-3 bg-[#1C2533]/90 border border-[#C5A880]/60 px-3 py-1.5 text-[10px] text-[#C5A880] font-mono rounded backdrop-blur-md">
          * Nhấp vào từng khối phòng để kiểm tra thông số kỹ thuật
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. BẢNG KIỂM TRA THÔNG SỐ KHỐI & PHÂN QUYỀN THAO TÁC        */}
      {/* ------------------------------------------------------------- */}
      {activeRoom && (
        <div className="p-4 bg-[#0D1117] border-t border-[#222B35] grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Thông Tin Khối Không Gian */}
          <div className="md:col-span-4 border-r border-[#222B35] pr-4 space-y-1">
            <div className="text-[10px] uppercase tracking-wider text-gray-400 font-mono flex items-center justify-between">
              <span>Khối Không Gian Đang Chọn</span>
              <span className="text-[#C5A880] font-bold font-mono">{activeRoom.code}</span>
            </div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: activeRoom.color }} />
              <span>{activeRoom.name}</span>
            </div>
            <div className="text-xs text-gray-300 font-mono">
              Diện tích: <strong className="text-[#C5A880]">{activeRoom.area} m²</strong> • Kích thước: <strong>{activeRoom.dimensions}</strong>
            </div>
          </div>

          {/* Chỉ Số Môi Trường Khối */}
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
              <div className="text-[10px] text-gray-400">Chiếu Sáng</div>
              <div className={`font-mono font-bold mt-0.5 ${activeRoom.lightState ? 'text-amber-400' : 'text-gray-500'}`}>
                {activeRoom.lightState ? 'ĐANG BẬT' : 'ĐÃ TẮT'}
              </div>
            </div>
          </div>

          {/* Phân Quyền Thao Tác (Đảm bảo khách chỉ xem thuần túy) */}
          <div className="md:col-span-4 flex flex-wrap items-center justify-end gap-2">
            {/* Trường Hợp 1: Ban Quản Lý (Admin) -> Giám sát kỹ thuật */}
            {isAdmin && (
              <div className="flex items-center gap-1.5 px-3 py-2 bg-[#121820] border border-blue-500/50 text-blue-300 text-xs font-mono rounded">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>Giám Sát Kỹ Thuật BQL • Thiết Bị Bình Thường</span>
              </div>
            )}

            {/* Trường Hợp 2: Chủ Hộ Căn Hộ (Owner) -> Toàn quyền điều khiển */}
            {isOwner && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedRoom === 'living') onToggleLight?.('livingRoom');
                    else if (selectedRoom === 'masterBed') onToggleLight?.('bedroomMaster');
                    else if (selectedRoom === 'diningKitchen') onToggleLight?.('kitchen');
                    else if (selectedRoom === 'balcony') onToggleLight?.('balcony');
                    else onToggleLight?.('livingRoom');
                  }}
                  className="px-3 py-2 bg-[#161B22] hover:bg-[#C5A880] hover:text-[#0D1117] border border-gray-700 hover:border-[#C5A880] text-xs font-bold uppercase tracking-wider transition-colors rounded flex items-center gap-1.5 text-white shadow"
                >
                  <Zap className="w-3.5 h-3.5" /> Bật / Tắt Đèn
                </button>

                {selectedRoom === 'balcony' && (
                  <button
                    type="button"
                    onClick={onToggleCurtains}
                    className="px-3 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-colors rounded flex items-center gap-1.5 shadow"
                  >
                    <Sun className="w-3.5 h-3.5" /> {curtainsOpen ? 'Đóng Rèm' : 'Mở Rèm'}
                  </button>
                )}

                {selectedRoom === 'foyer' && (
                  <button
                    type="button"
                    onClick={onToggleDoor}
                    className="px-3 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-colors rounded flex items-center gap-1.5 shadow"
                  >
                    <Lock className="w-3.5 h-3.5" /> {doorLocked ? 'Mở Khóa FaceID' : 'Khóa Chốt FaceID'}
                  </button>
                )}
              </>
            )}

            {/* Trường Hợp 3: Thành Viên / Cư Dân Thuê (Tenant) */}
            {isTenant && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedRoom === 'living') onToggleLight?.('livingRoom');
                    else if (selectedRoom === 'masterBed') onToggleLight?.('bedroomMaster');
                    else if (selectedRoom === 'diningKitchen') onToggleLight?.('kitchen');
                    else if (selectedRoom === 'balcony') onToggleLight?.('balcony');
                    else onToggleLight?.('livingRoom');
                  }}
                  className="px-3 py-2 bg-[#161B22] hover:bg-[#C5A880] hover:text-[#0D1117] border border-gray-700 hover:border-[#C5A880] text-xs font-bold uppercase tracking-wider transition-colors rounded flex items-center gap-1.5 text-white shadow"
                >
                  <Zap className="w-3.5 h-3.5" /> Bật / Tắt Đèn
                </button>

                {selectedRoom === 'balcony' && (
                  <button
                    type="button"
                    onClick={onToggleCurtains}
                    className="px-3 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-colors rounded flex items-center gap-1.5 shadow"
                  >
                    <Sun className="w-3.5 h-3.5" /> {curtainsOpen ? 'Đóng Rèm' : 'Mở Rèm'}
                  </button>
                )}
              </>
            )}

            {/* Trường Hợp 4: Khách Vãng Lai (Trang chủ / Chưa đăng nhập) -> Thuần Xem Mô Phỏng */}
            {isGuest && (
              <div className="text-[11px] text-gray-400 italic flex items-center gap-1.5 bg-[#121820] px-3 py-2 border border-[#222B35] rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C5A880]"></span>
                <span>Chế độ xem mô phỏng kiến trúc • Đăng nhập để điều khiển Smart Living</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
