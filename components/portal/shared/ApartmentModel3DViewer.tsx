'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  Sun, 
  ShieldCheck, 
  Grid, 
  SplitSquareVertical,
  CheckCircle2,
  Info,
  Plus,
  Minus,
  Maximize2
} from 'lucide-react';
import { useAuth } from '@/lib/authContext';

export type ViewMode = '3D_BLOCKS' | '2D_BLUEPRINT' | '3D_EXPLODED';

export interface RoomDetails {
  id: string;
  code: string;
  name: string;
  area: number; // m2
  dimensions: string; // e.g. "5.8m x 4.6m"
  color: string;
  borderColor: string;
  description: string;
  temperature?: number;
  humidity?: number;
  lightState?: boolean;
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
  interactive?: boolean; // False on Landing Page & FloorPlanExplorer (view-only)
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
  interactive = false
}: ApartmentModel3DViewerProps) {
  const { currentUser } = useAuth();
  const userRole = currentUser?.role; // 'OWNER' | 'TENANT' | 'ADMIN' | undefined
  const isOwner = userRole === 'OWNER';
  const isTenant = userRole === 'TENANT';

  // Chỉ cho phép điều khiển khi được đặt interactive=true VÀ người dùng đã đăng nhập đúng vai trò quản lý căn hộ
  const canControl = interactive && (isOwner || isTenant);

  const [viewMode, setViewMode] = useState<ViewMode>('3D_BLOCKS');
  const [selectedRoom, setSelectedRoom] = useState<string>('living');
  const [showDimensions, setShowDimensions] = useState(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(840);

  // Theo dõi bề rộng khung chứa để tự động tính toán hệ số thu phóng vừa vặn trên mọi thiết bị
  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Tính toán baseScale theo containerWidth:
  // SVG gốc 960x640:
  // - Mobile (< 480px): scale ~0.40 - 0.52
  // - Tablet (480px - 768px): scale ~0.55 - 0.75
  // - Desktop (> 768px): scale ~0.82 - 0.92
  const targetCanvasWidth = viewMode === '2D_BLUEPRINT' ? 960 : 860;
  const calculatedBase = (containerWidth - 32) / targetCanvasWidth;
  const baseScale = Math.min(Math.max(calculatedBase, 0.38), 0.92);
  const finalScale = Number((baseScale * zoomLevel).toFixed(2));

  // Danh Mục Khối Không Gian Căn Hộ Chung Cư (Chuẩn Kiến Trúc Thực Tế)
  const rooms: Record<string, RoomDetails> = {
    foyer: {
      id: 'foyer',
      code: 'SẢNH',
      name: 'Sảnh Đón & Cửa Vào',
      area: 4.2,
      dimensions: '2.1m x 2.0m',
      color: '#64748B',
      borderColor: '#94A3B8',
      description: 'Khu vực cửa chính, tủ giày âm tường và sảnh tiếp đón lối vào căn hộ.',
      temperature: 26,
      humidity: 55,
      lightState: true
    },
    commonBath: {
      id: 'commonBath',
      code: 'WC 2',
      name: 'Phòng Tắm & WC Chung',
      area: 3.8,
      dimensions: '2.0m x 1.9m',
      color: '#06B6D4',
      borderColor: '#67E8F9',
      description: 'Phòng vệ sinh chung hoàn thiện buồng tắm kính đứng, lavabo và quạt hút gió âm trần.',
      temperature: 25,
      humidity: 65,
      lightState: true
    },
    living: {
      id: 'living',
      code: 'PK',
      name: 'Phòng Khách & Sinh Hoạt Chung',
      area: 26.8,
      dimensions: '5.8m x 4.6m',
      color: '#C5A880',
      borderColor: '#E2D4BF',
      description: 'Không gian sinh hoạt trung tâm kết nối trực tiếp ban công, bàn ăn và hệ thống chiếu sáng âm trần.',
      temperature: acTemp,
      humidity: 56,
      lightState: lights.livingRoom
    },
    diningKitchen: {
      id: 'diningKitchen',
      code: 'BẾP',
      name: 'Khu Vực Bếp & Bàn Ăn',
      area: 12.5,
      dimensions: '3.8m x 3.3m',
      color: '#F59E0B',
      borderColor: '#FDE68A',
      description: 'Khu bếp nấu đảo bếp hoàn thiện mặt đá, vị trí lắp đặt bếp từ và bồn rửa đôi.',
      temperature: 26,
      humidity: 52,
      lightState: lights.kitchen
    },
    masterBed: {
      id: 'masterBed',
      code: 'PN MASTER',
      name: 'Phòng Ngủ Master',
      area: 18.2,
      dimensions: '4.8m x 3.8m',
      color: '#818CF8',
      borderColor: '#C7D2FE',
      description: 'Phòng ngủ chính khép kín có WC riêng, view thoáng mát và vị trí tủ quần áo âm tường.',
      temperature: acTemp - 1,
      humidity: 58,
      lightState: lights.bedroomMaster
    },
    masterBath: {
      id: 'masterBath',
      code: 'WC 1',
      name: 'Phòng Tắm & WC Master',
      area: 4.5,
      dimensions: '2.4m x 1.9m',
      color: '#3B82F6',
      borderColor: '#93C5FD',
      description: 'Phòng tắm riêng biệt của phòng ngủ Master với bồn tắm nằm, vách kính và lavabo đá.',
      temperature: 25,
      humidity: 62,
      lightState: true
    },
    secondBed: {
      id: 'secondBed',
      code: 'PN 2',
      name: 'Phòng Ngủ 2',
      area: 12.4,
      dimensions: '3.6m x 3.4m',
      color: '#38BDF8',
      borderColor: '#BAE6FD',
      description: 'Phòng ngủ phụ dành cho con cái hoặc người thân, có cửa sổ đón ánh sáng tự nhiên.',
      temperature: 25,
      humidity: 60,
      lightState: true
    },
    balcony: {
      id: 'balcony',
      code: 'BAN CÔNG',
      name: 'Ban Công & Lô Gia',
      area: 7.8,
      dimensions: '4.6m x 1.7m',
      color: '#10B981',
      borderColor: '#A7F3D0',
      description: 'Ban công rộng rãi đón gió, lan can kính cường lực an toàn và khu vực lắp rèm che.',
      temperature: 29,
      humidity: 68,
      lightState: lights.balcony
    }
  };

  const activeRoom = rooms[selectedRoom] || rooms['living'];

  const getModeLabel = (mode: ViewMode) => {
    switch (mode) {
      case '3D_BLOCKS': return 'Mô Hình 3D';
      case '2D_BLUEPRINT': return 'Mặt Bằng 2D Kỹ Thuật';
      case '3D_EXPLODED': return 'Bóc Tách Khối';
    }
  };

  return (
    <div className="w-full bg-[#080B10] border border-[#222B35] rounded-lg shadow-2xl flex flex-col overflow-hidden select-none">
      {/* ------------------------------------------------------------- */}
      {/* 1. THANH CÔNG CỤ CHẾ ĐỘ HIỂN THỊ (RESPONSIVE TOÀN DIỆN)      */}
      {/* ------------------------------------------------------------- */}
      <div className="p-2 sm:p-3 bg-[#0D1117] border-b border-[#222B35] flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Bộ Chuyển Đổi Chế Độ Xem Căn Hộ */}
        <div className="flex items-center gap-1 bg-[#121820] p-1 border border-[#222B35] rounded">
          <button
            type="button"
            onClick={() => setViewMode('3D_BLOCKS')}
            className={`px-2.5 sm:px-3 py-1.5 font-bold uppercase tracking-wider text-[10px] sm:text-[10.5px] rounded flex items-center gap-1.5 transition-all ${
              viewMode === '3D_BLOCKS'
                ? 'bg-[#C5A880] text-[#0D1117] shadow font-extrabold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Box className="w-3.5 h-3.5 shrink-0" />
            <span><span className="hidden sm:inline">Mô Hình </span>3D</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('2D_BLUEPRINT')}
            className={`px-2.5 sm:px-3 py-1.5 font-bold uppercase tracking-wider text-[10px] sm:text-[10.5px] rounded flex items-center gap-1.5 transition-all ${
              viewMode === '2D_BLUEPRINT'
                ? 'bg-[#C5A880] text-[#0D1117] shadow font-extrabold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5 shrink-0" />
            <span><span className="hidden sm:inline">Mặt Bằng </span>2D</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('3D_EXPLODED')}
            className={`px-2.5 sm:px-3 py-1.5 font-bold uppercase tracking-wider text-[10px] sm:text-[10.5px] rounded flex items-center gap-1.5 transition-all ${
              viewMode === '3D_EXPLODED'
                ? 'bg-amber-400 text-[#0D1117] shadow font-extrabold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <SplitSquareVertical className="w-3.5 h-3.5 shrink-0" />
            <span><span className="hidden sm:inline">Bóc Tách </span>Khối</span>
          </button>
        </div>

        {/* Cụm Tiện Ích: Kích Thước Đo & Nút Zoom Tương Tác */}
        <div className="flex items-center gap-1.5">
          {/* Nút Ẩn / Hiện Kích Thước Laser */}
          <button
            type="button"
            onClick={() => setShowDimensions(!showDimensions)}
            className={`px-2 sm:px-2.5 py-1.5 border rounded transition-colors text-[10px] sm:text-[10.5px] flex items-center gap-1.5 ${
              showDimensions ? 'bg-[#1C2533] border-[#C5A880] text-[#C5A880]' : 'bg-[#121820] border-gray-700 text-gray-400'
            }`}
            title="Ẩn / Hiện kích thước kỹ thuật CAD"
          >
            <Grid className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden xs:inline">Đo CAD</span>
          </button>

          {/* Bộ Điều Khiển Zoom Thông Minh Cho Cả Mobile & Desktop */}
          <div className="flex items-center bg-[#121820] border border-[#222B35] rounded overflow-hidden">
            <button 
              type="button" 
              onClick={() => setZoomLevel(prev => Math.max(Number((prev - 0.15).toFixed(2)), 0.6))} 
              className="px-2 py-1.5 text-gray-400 hover:text-white hover:bg-[#1C2533] transition-colors"
              title="Thu nhỏ mô hình"
            >
              <Minus className="w-3 h-3" />
            </button>
            <button 
              type="button" 
              onClick={() => setZoomLevel(1)} 
              className="px-2 py-1.5 font-mono text-[9.5px] sm:text-[10px] text-[#C5A880] hover:bg-[#1C2533] transition-colors border-x border-[#222B35]"
              title="Khôi phục kích thước chuẩn vừa khung (Fit)"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button 
              type="button" 
              onClick={() => setZoomLevel(prev => Math.min(Number((prev + 0.15).toFixed(2)), 1.8))} 
              className="px-2 py-1.5 text-gray-400 hover:text-white hover:bg-[#1C2533] transition-colors"
              title="Phóng to mô hình"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. KHÔNG GIAN BẢN VẼ / MÔ HÌNH CĂN HỘ CHUNG CƯ                 */}
      {/* ------------------------------------------------------------- */}
      <div 
        ref={containerRef}
        className="relative w-full h-[380px] sm:h-[460px] md:h-[500px] bg-[#05070A] overflow-hidden flex items-center justify-center"
      >
        {/* Lưới Nền Kiến Trúc */}
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: viewMode === '2D_BLUEPRINT'
              ? 'linear-gradient(to right, #0284C7 1px, transparent 1px), linear-gradient(to bottom, #0284C7 1px, transparent 1px)'
              : 'linear-gradient(to right, #1E293B 1px, transparent 1px), linear-gradient(to bottom, #1E293B 1px, transparent 1px)',
            backgroundSize: viewMode === '2D_BLUEPRINT' ? '20px 20px' : '28px 28px'
          }}
        />

        {/* Khung Chiếu Phối Cảnh Không Gian (Tự Co Giãn 100% Khung Chứa Mobile & Desktop) */}
        <div 
          className="relative transition-all duration-700 ease-out transform origin-center flex items-center justify-center shrink-0"
          style={{
            transform: viewMode === '2D_BLUEPRINT'
              ? `perspective(0px) rotateX(0deg) rotateZ(0deg) scale(${finalScale})`
              : `perspective(1400px) rotateX(52deg) rotateZ(-34deg) scale(${finalScale})`
          }}
        >
          <svg
            viewBox="0 0 960 640"
            className="w-[960px] h-[640px] max-w-none drop-shadow-[0_35px_70px_rgba(0,0,0,0.95)] cursor-pointer"
          >
            <defs>
              {/* Sàn Gỗ Tự Nhiên */}
              <pattern id="oakFlooring" width="36" height="18" patternUnits="userSpaceOnUse">
                <rect width="36" height="18" fill="#141820" stroke="#1F2633" strokeWidth="0.8" />
                <line x1="0" y1="9" x2="36" y2="9" stroke="#1F2633" strokeWidth="0.6" />
                <line x1="18" y1="0" x2="18" y2="9" stroke="#1F2633" strokeWidth="0.6" />
              </pattern>

              {/* Sàn Đá Marble */}
              <pattern id="marbleTile" width="32" height="32" patternUnits="userSpaceOnUse">
                <rect width="32" height="32" fill="#0F141C" stroke="#1E2533" strokeWidth="0.8" />
                <circle cx="16" cy="16" r="1.5" fill="#2A3649" />
              </pattern>

              {/* Chiếu Sáng Phòng Khách */}
              <radialGradient id="lightWarmGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFE8B0" stopOpacity="0.8" />
                <stop offset="60%" stopColor="#C5A880" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#C5A880" stopOpacity="0" />
              </radialGradient>

              {/* Chiếu Sáng Phòng Ngủ */}
              <radialGradient id="lightCoolGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#C7D2FE" stopOpacity="0.75" />
                <stop offset="60%" stopColor="#818CF8" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#818CF8" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* ======================================================= */}
            {/* 1. KHỐI SẢNH ĐÓN (Foyer: x=50, y=260, w=120, h=140)     */}
            {/* ======================================================= */}
            <g 
              onClick={() => setSelectedRoom('foyer')}
              className="transition-all duration-300 group"
              transform={viewMode === '3D_EXPLODED' ? 'translate(-35, 0)' : 'translate(0, 0)'}
            >
              {viewMode === '3D_BLOCKS' && (
                <path d="M 50,400 L 50,412 L 170,412 L 170,400 Z" fill="#0A0E17" stroke="#334155" strokeWidth="1" />
              )}
              <rect
                x="50" y="260" width="120" height="140" rx="4"
                fill="url(#marbleTile)"
                stroke={selectedRoom === 'foyer' ? '#C5A880' : '#334155'}
                strokeWidth={selectedRoom === 'foyer' ? '3' : '1.5'}
                className="transition-all hover:fill-[#161F2C]"
              />
              <path d="M 55,330 A 40,40 0 0,1 95,370" fill="none" stroke="#C5A880" strokeWidth="1.5" strokeDasharray="3 3" />
              <line x1="55" y1="330" x2="55" y2="370" stroke="#C5A880" strokeWidth="3.5" strokeLinecap="round" />
              <rect x="115" y="280" width="45" height="25" rx="3" fill="#1E293B" stroke="#475569" strokeWidth="1" />
              
              {/* Thẻ Nhãn Phòng 2 Dòng Gọn Gàng, Không Tràn Viền */}
              <g transform="translate(110, 345)">
                <rect x="-42" y="-16" width="84" height="32" rx="4" fill="#0A0E17" fillOpacity="0.92" stroke="#64748B" strokeWidth="1.2" />
                <text x="0" y="-3" fill="#E2E8F0" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="system-ui, sans-serif" letterSpacing="0.05em">
                  SẢNH ĐÓN
                </text>
                <text x="0" y="10" fill="#94A3B8" fontSize="8.5" fontWeight="600" textAnchor="middle" fontFamily="system-ui, sans-serif">
                  4.2 m²
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
              <rect x="60" y="150" width="42" height="42" rx="2" fill="#0E2330" stroke="#06B6D4" strokeWidth="1.2" strokeDasharray="3 2" />
              <circle cx="81" cy="171" r="5" fill="#38BDF8" opacity="0.8" />
              <rect x="115" y="150" width="38" height="22" rx="2" fill="#1E293B" stroke="#64748B" />
              <circle cx="134" cy="161" r="6" fill="#F8FAFC" />
              <rect x="120" y="200" width="30" height="38" rx="5" fill="#1E293B" stroke="#64748B" />

              <g transform="translate(110, 205)">
                <rect x="-42" y="-16" width="84" height="32" rx="4" fill="#0A0E17" fillOpacity="0.92" stroke="#06B6D4" strokeWidth="1.2" />
                <text x="0" y="-3" fill="#06B6D4" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="system-ui, sans-serif" letterSpacing="0.05em">
                  WC CHUNG
                </text>
                <text x="0" y="10" fill="#67E8F9" fontSize="8.5" fontWeight="600" textAnchor="middle" fontFamily="system-ui, sans-serif">
                  3.8 m²
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

              {lights.livingRoom && viewMode !== '2D_BLUEPRINT' && (
                <ellipse cx="340" cy="225" rx="140" ry="110" fill="url(#lightWarmGlow)" pointerEvents="none" />
              )}

              {/* Nội thất cơ bản phòng khách */}
              <rect x="230" y="195" width="145" height="44" rx="4" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />
              <rect x="230" y="239" width="44" height="52" rx="4" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />
              <rect x="300" y="255" width="68" height="34" rx="3" fill="#C5A880" stroke="#E2D4BF" strokeWidth="1.5" opacity="0.95" />
              <rect x="470" y="170" width="18" height="115" rx="2" fill="#0D1117" stroke="#475569" strokeWidth="1.2" />
              <line x1="477" y1="185" x2="477" y2="270" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" />

              {/* Bàn Ăn Tiếp Giáp */}
              <rect x="230" y="120" width="90" height="42" rx="3" fill="#1E293B" stroke="#C5A880" strokeWidth="1.2" />
              <circle cx="245" cy="112" r="5" fill="#475569" />
              <circle cx="275" cy="112" r="5" fill="#475569" />
              <circle cx="305" cy="112" r="5" fill="#475569" />
              <circle cx="245" cy="170" r="5" fill="#475569" />
              <circle cx="275" cy="170" r="5" fill="#475569" />
              <circle cx="305" cy="170" r="5" fill="#475569" />

              {showDimensions && (
                <g className="opacity-80">
                  <line x1="180" y1="78" x2="500" y2="78" stroke="#C5A880" strokeWidth="1" strokeDasharray="3 3" />
                  <text x="340" y="73" fill="#C5A880" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">5.80 m</text>
                </g>
              )}

              <g transform="translate(340, 310)">
                <rect x="-56" y="-17" width="112" height="34" rx="4" fill="#0A0E17" fillOpacity="0.92" stroke="#C5A880" strokeWidth="1.5" />
                <text x="0" y="-3" fill="#C5A880" fontSize="9.5" fontWeight="bold" textAnchor="middle" fontFamily="system-ui, sans-serif" letterSpacing="0.05em">
                  PHÒNG KHÁCH
                </text>
                <text x="0" y="10" fill="#FDE68A" fontSize="9" fontWeight="600" textAnchor="middle" fontFamily="system-ui, sans-serif">
                  26.8 m²
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

              <rect x="235" y="405" width="135" height="42" rx="3" fill="#1E293B" stroke="#F59E0B" strokeWidth="1.5" />
              <circle cx="260" cy="465" r="7" fill="#C5A880" />
              <circle cx="300" cy="465" r="7" fill="#C5A880" />
              <circle cx="340" cy="465" r="7" fill="#C5A880" />

              <rect x="440" y="395" width="46" height="95" rx="3" fill="#0D1117" stroke="#64748B" strokeWidth="1" />
              <circle cx="463" cy="420" r="8" fill="#EF4444" opacity="0.85" />
              <circle cx="463" cy="445" r="6" fill="#EF4444" opacity="0.7" />
              <rect x="450" y="465" width="26" height="18" rx="2" fill="#334155" />

              <g transform="translate(340, 515)">
                <rect x="-52" y="-17" width="104" height="34" rx="4" fill="#0A0E17" fillOpacity="0.92" stroke="#F59E0B" strokeWidth="1.2" />
                <text x="0" y="-3" fill="#F59E0B" fontSize="9.5" fontWeight="bold" textAnchor="middle" fontFamily="system-ui, sans-serif" letterSpacing="0.05em">
                  BẾP & BÀN ĂN
                </text>
                <text x="0" y="10" fill="#FDE68A" fontSize="8.5" fontWeight="600" textAnchor="middle" fontFamily="system-ui, sans-serif">
                  12.5 m²
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

              {lights.bedroomMaster && viewMode !== '2D_BLUEPRINT' && (
                <ellipse cx="645" cy="190" rx="100" ry="75" fill="url(#lightCoolGlow)" pointerEvents="none" />
              )}

              <rect x="585" y="120" width="115" height="105" rx="5" fill="#1E293B" stroke="#818CF8" strokeWidth="1.5" />
              <rect x="597" y="130" width="36" height="20" rx="3" fill="#F1F5F9" opacity="0.9" />
              <rect x="647" y="130" width="36" height="20" rx="3" fill="#F1F5F9" opacity="0.9" />
              <rect x="555" y="135" width="22" height="20" rx="2" fill="#334155" stroke="#64748B" />
              <rect x="710" y="135" width="22" height="20" rx="2" fill="#334155" stroke="#64748B" />
              <rect x="525" y="240" width="150" height="28" rx="2" fill="#1E293B" stroke="#64748B" />

              <g transform="translate(645, 260)">
                <rect x="-54" y="-17" width="108" height="34" rx="4" fill="#0A0E17" fillOpacity="0.92" stroke="#818CF8" strokeWidth="1.2" />
                <text x="0" y="-3" fill="#818CF8" fontSize="9.5" fontWeight="bold" textAnchor="middle" fontFamily="system-ui, sans-serif" letterSpacing="0.05em">
                  PN MASTER
                </text>
                <text x="0" y="10" fill="#C7D2FE" fontSize="8.5" fontWeight="600" textAnchor="middle" fontFamily="system-ui, sans-serif">
                  18.2 m²
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

              <rect x="805" y="110" width="90" height="42" rx="15" fill="#0D1117" stroke="#3B82F6" strokeWidth="1.5" />
              <circle cx="825" cy="131" r="4" fill="#60A5FA" />
              <rect x="815" y="170" width="70" height="24" rx="3" fill="#1E293B" stroke="#64748B" />
              <circle cx="850" cy="182" r="6" fill="#FFFFFF" />
              <rect x="830" y="220" width="40" height="45" rx="8" fill="#1E293B" stroke="#64748B" />

              <g transform="translate(850, 260)">
                <rect x="-44" y="-16" width="88" height="32" rx="4" fill="#0A0E17" fillOpacity="0.92" stroke="#3B82F6" strokeWidth="1.2" />
                <text x="0" y="-3" fill="#60A5FA" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="system-ui, sans-serif" letterSpacing="0.05em">
                  WC MASTER
                </text>
                <text x="0" y="10" fill="#93C5FD" fontSize="8.5" fontWeight="600" textAnchor="middle" fontFamily="system-ui, sans-serif">
                  4.5 m²
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

              <rect x="655" y="325" width="105" height="85" rx="4" fill="#1E293B" stroke="#38BDF8" strokeWidth="1.5" />
              <rect x="670" y="333" width="75" height="18" rx="2" fill="#F1F5F9" opacity="0.9" />
              <rect x="530" y="325" width="80" height="35" rx="3" fill="#334155" stroke="#64748B" />

              <g transform="translate(585, 415)">
                <rect x="-50" y="-17" width="100" height="34" rx="4" fill="#0A0E17" fillOpacity="0.92" stroke="#38BDF8" strokeWidth="1.2" />
                <text x="0" y="-3" fill="#38BDF8" fontSize="9.5" fontWeight="bold" textAnchor="middle" fontFamily="system-ui, sans-serif" letterSpacing="0.05em">
                  PHÒNG NGỦ 2
                </text>
                <text x="0" y="10" fill="#BAE6FD" fontSize="8.5" fontWeight="600" textAnchor="middle" fontFamily="system-ui, sans-serif">
                  12.4 m²
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

              <line x1="910" y1="460" x2="910" y2="550" stroke="#38BDF8" strokeWidth="3.5" strokeDasharray="6 3" opacity="0.9" />
              <line x1="510" y1="550" x2="910" y2="550" stroke="#38BDF8" strokeWidth="3.5" strokeDasharray="6 3" opacity="0.9" />

              <circle cx="545" cy="505" r="14" fill="#10B981" opacity="0.75" />
              <circle cx="580" cy="505" r="10" fill="#10B981" opacity="0.75" />
              <rect x="670" y="485" width="95" height="38" rx="5" fill="#1E293B" stroke="#10B981" strokeWidth="1.5" />

              <line
                x1="510"
                y1="460"
                x2="910"
                y2="460"
                stroke={curtainsOpen ? '#C5A880' : '#EF4444'}
                strokeWidth="4"
                strokeDasharray={curtainsOpen ? '8 4' : '0'}
              />

              <g transform="translate(830, 515)">
                <rect x="-45" y="-16" width="90" height="32" rx="4" fill="#0A0E17" fillOpacity="0.92" stroke="#10B981" strokeWidth="1.2" />
                <text x="0" y="-3" fill="#10B981" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="system-ui, sans-serif" letterSpacing="0.05em">
                  BAN CÔNG
                </text>
                <text x="0" y="10" fill="#A7F3D0" fontSize="8.5" fontWeight="600" textAnchor="middle" fontFamily="system-ui, sans-serif">
                  7.8 m²
                </text>
              </g>
            </g>

            {/* CHỈ HIỂN THỊ ĐIỂM ĐIỀU KHIỂN KHI ĐÃ ĐĂNG NHẬP VÀO TRANG QUẢN LÝ (canControl === true) */}
            {canControl && (
              <g className="pointer-events-auto">
                <g transform="translate(480, 115)" className="cursor-pointer">
                  <circle cx="0" cy="0" r="13" fill={acPower ? '#0284C7' : '#475569'} stroke="#FFFFFF" strokeWidth="1.5" />
                  <text x="0" y="4" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">AC</text>
                </g>
                <g transform="translate(55, 330)" className="cursor-pointer" onClick={onToggleDoor}>
                  <circle cx="0" cy="0" r="13" fill={doorLocked ? '#059669' : '#DC2626'} stroke="#FFFFFF" strokeWidth="1.5" />
                  <text x="0" y="4" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle">ID</text>
                </g>
                <g transform="translate(715, 460)" className="cursor-pointer" onClick={onToggleCurtains}>
                  <circle cx="0" cy="0" r="12" fill={curtainsOpen ? '#D97706' : '#475569'} stroke="#FFFFFF" strokeWidth="1.5" />
                  <text x="0" y="4" fill="#FFFFFF" fontSize="7" fontWeight="bold" textAnchor="middle">RÈM</text>
                </g>
              </g>
            )}
          </svg>
        </div>

        {/* HUD Góc Trên Bên Trái (Co giãn linh hoạt, không cản trở thao tác chạm trên mobile) */}
        <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 bg-[#0D1117]/95 border border-[#222B35] px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-[9px] sm:text-[10px] space-y-0.5 sm:space-y-1 backdrop-blur-md rounded shadow-xl max-w-[calc(100%-6rem)] pointer-events-none">
          <div className="text-white font-bold flex items-center gap-1.5 truncate">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 shrink-0"></span>
            <span className="truncate">Căn Hộ {apartmentCode} ({clearArea} m²)</span>
          </div>
          <div className="text-gray-300 font-mono truncate">
            Chế độ: <strong className="text-[#C5A880]">{getModeLabel(viewMode)}</strong>
          </div>
        </div>

        {/* Gợi ý tương tác (Hiển thị tinh tế trên mọi màn hình) */}
        <div className="absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-3 bg-[#1C2533]/90 border border-[#C5A880]/60 px-2.5 py-1 text-[9px] sm:text-[10px] text-[#C5A880] font-mono rounded backdrop-blur-md pointer-events-none">
          * Chạm / Click vào phòng để xem
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. BẢNG THÔNG TIN KHỐI PHÒNG (RESPONSIVE CHUẨN MỰC)           */}
      {/* ------------------------------------------------------------- */}
      {activeRoom && (
        <div className="p-3 sm:p-4 bg-[#0D1117] border-t border-[#222B35] flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          {/* Thông Tin Khối Không Gian */}
          <div className="space-y-1 min-w-0">
            <div className="text-[10.5px] uppercase tracking-wider text-gray-400 font-mono flex items-center gap-2 flex-wrap">
              <span>Khối Đang Chọn:</span>
              <span className="text-[#C5A880] font-bold font-mono px-2 py-0.5 bg-[#1C2533] border border-[#2D3748] rounded">
                {activeRoom.code}
              </span>
              <span className="text-white font-bold text-sm ml-1 truncate">{activeRoom.name}</span>
            </div>
            <div className="text-xs text-gray-300">
              Diện tích: <strong className="text-[#C5A880]">{activeRoom.area} m²</strong> • Kích thước: <strong>{activeRoom.dimensions}</strong>
            </div>
            <div className="text-xs text-gray-400 break-words">
              {activeRoom.description}
            </div>
          </div>

          {/* Quyền Thao Tác: CHỈ XUẤT HIỆN KHI ĐĂNG NHẬP VÀO TRANG QUẢN LÝ CĂN HỘ CỦA MÌNH */}
          {canControl ? (
            <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
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
                  <Lock className="w-3.5 h-3.5" /> {doorLocked ? 'Mở Khóa' : 'Khóa Chốt'}
                </button>
              )}
            </div>
          ) : (
            <div className="text-[11px] text-gray-400 italic bg-[#121820] px-3.5 py-2 border border-[#222B35] rounded flex items-center gap-2 flex-shrink-0">
              <Info className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>Chế độ xem sơ đồ. Đăng nhập trang quản lý để điều khiển căn hộ.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
