'use client';

import React, { useState } from 'react';
import { 
  Map, Compass, Maximize2, Sparkles, Navigation, 
  ChevronRight, Building2, Trees, Waves, Eye,
  ShoppingBag, HeartPulse, Anchor, ZoomIn, ZoomOut, RotateCcw
} from 'lucide-react';

interface MacroCitySvgModelProps {
  selectedBlock: string;
  selectedAmenityId?: string | null;
  onSelectAmenity?: (id: string | null) => void;
  onSelectTropical?: () => void;
  onOpenZoomModal?: () => void;
}

export default function MacroCitySvgModel({
  selectedBlock,
  selectedAmenityId,
  onSelectAmenity,
  onSelectTropical,
  onOpenZoomModal
}: MacroCitySvgModelProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>('SOLARI');
  const [showOverlays, setShowOverlays] = useState<boolean>(true);

  // Danh mục 10 phân khu & đại tiện ích trọng điểm trên bản đồ quy hoạch 271ha (kích thước ảnh gốc 1024 x 778)
  const MACRO_LANDMARKS = [
    {
      id: 'SOLARI',
      name: 'Phân Khu The Beverly Solari (The Tropical)',
      tag: 'TÂM ĐIỂM DỰ ÁN',
      isProjectCore: true,
      x: 498,
      y: 268,
      desc: 'Cụm 4 tòa BS-7, BS-8, BS-9, BS-10 đang được quản lý. Sở hữu phố cọ Rodeo & bể bơi resort nhiệt đới.',
      distance: '0m (Vị trí hiện tại)',
      color: '#F59E0B'
    },
    {
      id: 'VINCOM',
      name: 'TTTM Vincom Mega Mall Grand Park',
      tag: 'THƯƠNG MẠI',
      x: 532,
      y: 350,
      desc: 'Trung tâm thương mại Life-Design Mall lớn nhất miền Nam quy tụ hơn 140 thương hiệu quốc tế.',
      distance: '~320m • 4 phút đi bộ',
      color: '#EC4899'
    },
    {
      id: 'PARK36',
      name: 'Đại Công Viên 36ha & Biển Hồ Cát Trắng',
      tag: 'CẢNH QUAN',
      x: 655,
      y: 475,
      desc: 'Kỳ quan công viên 36ha với bãi cát trắng tự nhiên, công viên ánh sáng nghệ thuật và hồ sinh thái.',
      distance: '~400m • 5 phút đi bộ',
      color: '#10B981'
    },
    {
      id: 'VINMEC',
      name: 'Bệnh Viện Quốc Tế Vinmec Grand Park',
      tag: 'Y TẾ CAO CẤP',
      x: 642,
      y: 740,
      desc: 'Bệnh viện đa khoa quốc tế tiêu chuẩn JCI, cấp cứu 24/7 và dịch vụ y tế chuẩn 5 sao.',
      distance: '~550m • 2 phút xe điện',
      color: '#3B82F6'
    },
    {
      id: 'VINPEARL',
      name: 'Khách Sạn Quốc Tế Vinpearl',
      tag: 'NGHỈ DƯỠNG',
      x: 835,
      y: 405,
      desc: 'Tổ hợp khách sạn 5 sao cao cấp phục vụ chuyên gia quốc tế và du khách nghỉ dưỡng ven hồ.',
      distance: '~600m • 3 phút xe điện',
      color: '#EAB308'
    },
    {
      id: 'MANHATTAN',
      name: 'Bến Du Thuyền Manhattan Island',
      tag: 'THƯỢNG LƯU',
      x: 462,
      y: 910,
      desc: 'Bến du thuyền ven sông Đồng Nai & Sông Tắc, khu phố thương mại thấp tầng Manhattan sầm uất.',
      distance: '~750m • 4 phút xe điện',
      color: '#8B5CF6'
    },
    {
      id: 'TOWER45',
      name: 'Tháp Văn Phòng Vingroup 45 Tầng',
      tag: 'TÀI CHÍNH',
      x: 352,
      y: 672,
      desc: 'Tòa tháp biểu tượng kinh tế - tài chính, công nghệ IoT và trung tâm điều hành đô thị.',
      distance: '~480m • 6 phút đi bộ',
      color: '#6366F1'
    },
    {
      id: 'ORIGAMI',
      name: 'Phân Khu The Origami (S6 - S10)',
      tag: 'PHONG CÁCH NHẬT',
      x: 345,
      y: 280,
      desc: 'Khu căn hộ đậm chất Nhật Bản với vườn Nhật truyền thống, hồ cá Koi và cầu gỗ đỏ.',
      distance: '~300m • 3 phút đi bộ',
      color: '#EF4444'
    },
    {
      id: 'RAINBOW',
      name: 'Phân Khu The Rainbow (S1 - S5)',
      tag: 'SÔI ĐỘNG',
      x: 175,
      y: 590,
      desc: 'Phân khu bàn giao đầu tiên với công viên Cầu Vồng và mật độ dân cư hiện hữu đông đúc.',
      distance: '~600m • 6 phút đi bộ',
      color: '#06B6D4'
    },
    {
      id: 'LUMIERE',
      name: 'Lumière Boulevard & Masteri Centre Point',
      tag: 'CĂN HỘ CAO CẤP',
      x: 410,
      y: 550,
      desc: 'Kiến trúc xanh 3D độc đáo nằm dọc trục đại lộ mua sắm Manhattan sầm uất.',
      distance: '~350m • 4 phút đi bộ',
      color: '#14B8A6'
    }
  ];

  return (
    <div className="relative w-full h-full flex-1 flex flex-col bg-[#070B12] overflow-hidden select-none">
      {/* THANH ĐIỀU HÀNH THU PHÓNG & LỚP PHỦ TINH GỌN (ĐÃ BỎ TIÊU ĐỀ TRÙNG LẶP) */}
      <div className="px-3 py-1.5 bg-[#0A0F17] border-b border-[#1E293B] flex items-center justify-between gap-2 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse" />
          <span className="text-gray-400 text-[11px]">Đại Đô Thị:</span>
          <span className="px-2 py-0.5 bg-[#141E2D] border border-[#23354C] text-[#C5A880] font-bold text-[11px]">
            271 ha • 10 Phân Khu Trọng Điểm
          </span>
        </div>

        {/* Nút điều khiển thu phóng & Phóng to */}
        <div className="flex items-center gap-1.5">
          {/* Nút bật tắt lớp phủ */}
          <button
            type="button"
            onClick={() => setShowOverlays(!showOverlays)}
            className={`px-2 py-0.5 border text-[11px] transition-all flex items-center gap-1 ${
              showOverlays
                ? 'bg-[#182638] border-[#3B82F6] text-cyan-300'
                : 'bg-[#0E1520] border-[#222E3E] text-gray-400 hover:text-white'
            }`}
            title="Bật/tắt ghim phân khu"
          >
            <Eye className="w-3 h-3" />
            <span className="hidden sm:inline">Lớp Phủ</span>
          </button>

          <button
            type="button"
            onClick={() => setZoomLevel(prev => Math.max(0.7, Number((prev - 0.15).toFixed(2))))}
            className="p-1 bg-[#121A26] hover:bg-[#1A2637] border border-[#223247] text-gray-300 hover:text-white"
            title="Thu nhỏ"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel(1)}
            className="px-2 py-0.5 bg-[#090D14] border border-[#223247] text-[#C5A880] text-[11px] min-w-[48px] text-center hover:bg-[#121A26]"
            title="Mặc định 100%"
          >
            {Math.round(zoomLevel * 100)}%
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel(prev => Math.min(2.0, Number((prev + 0.15).toFixed(2))))}
            className="p-1 bg-[#121A26] hover:bg-[#1A2637] border border-[#223247] text-gray-300 hover:text-white"
            title="Phóng to"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          {onOpenZoomModal && (
            <button
              type="button"
              onClick={onOpenZoomModal}
              className="p-1 bg-[#121A26] hover:bg-[#C5A880] hover:text-black border border-[#223247] text-gray-300 transition-all ml-0.5"
              title="Phóng to toàn màn hình"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* VÙNG HIỂN THỊ ẢNH QUY HOẠCH CHIẾM TRỌN KHÔNG GIAN */}
      <div className="relative w-full flex-1 min-h-[380px] sm:min-h-[460px] bg-[#070B12] overflow-hidden flex items-center justify-center p-2">
        <div 
          className="relative w-full h-full flex items-center justify-center transition-transform duration-200"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <svg
            viewBox="0 0 1024 778"
            className="w-full h-full max-h-full object-contain filter drop-shadow-2xl"
          >
            <defs>
              <filter id="macroGoldGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#F59E0B" floodOpacity="0.9" />
              </filter>
              <filter id="macroBadgeShadow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#000000" floodOpacity="0.85" />
              </filter>
            </defs>

            {/* 1. ẢNH GỐC SƠ ĐỒ ĐẠI ĐÔ THỊ VINHOMES GRAND PARK 271HA */}
            <image
              href="/masterplan/vinhomes-grand-park-macro-plan.jpg"
              x="0"
              y="0"
              width="1024"
              height="778"
              preserveAspectRatio="xMidYMid meet"
            />

            {/* 2. LỚP GHIM VÀ BADGE TƯƠNG TÁC CÁC PHÂN KHU TRỌNG ĐIỂM */}
            {showOverlays && MACRO_LANDMARKS.map((lm) => {
              const isSelected = selectedDistrict === lm.id;
              const isHovered = hoveredDistrict === lm.id;
              const isHighlighted = isSelected || isHovered;
              const isCore = lm.isProjectCore;

              return (
                <g
                  key={`landmark-${lm.id}`}
                  transform={`translate(${lm.x}, ${lm.y})`}
                  className="cursor-pointer group"
                  onClick={() => {
                    setSelectedDistrict(isSelected ? null : lm.id);
                    if (isCore && onSelectTropical) {
                      onSelectTropical();
                    }
                  }}
                  onMouseEnter={() => setHoveredDistrict(lm.id)}
                  onMouseLeave={() => setHoveredDistrict(null)}
                >
                  <title>{lm.name} • {lm.tag} ({lm.distance})</title>
                  {/* Radar beacon pulse */}
                  {isCore && (
                    <circle
                      r="26"
                      fill="#F59E0B"
                      opacity="0.4"
                      className="animate-ping"
                    />
                  )}
                  {isHighlighted && !isCore && (
                    <circle
                      r="20"
                      fill={lm.color}
                      opacity="0.5"
                      className="animate-ping"
                    />
                  )}

                  {/* Vòng định vị */}
                  <circle
                    r={isHighlighted ? 15 : isCore ? 13 : 10}
                    fill={isCore ? '#F59E0B' : isHighlighted ? lm.color : '#0B121D'}
                    stroke={isHighlighted || isCore ? '#FFFFFF' : lm.color}
                    strokeWidth={isHighlighted || isCore ? 2.5 : 1.5}
                    filter={isHighlighted || isCore ? 'url(#macroGoldGlow)' : undefined}
                    className="transition-all duration-200"
                  />

                  {/* Icon / Tâm ghim */}
                  <circle
                    r={isHighlighted ? 5 : 3.5}
                    fill={isCore ? '#000000' : '#FFFFFF'}
                  />

                  {/* Badge nhãn địa điểm */}
                  <g
                    transform={`translate(0, ${isCore ? -24 : -18})`}
                    filter="url(#macroBadgeShadow)"
                  >
                    <rect
                      x="-65"
                      y="-11"
                      width="130"
                      height="22"
                      rx="3"
                      fill={isCore ? '#F59E0B' : isHighlighted ? '#1E293B' : '#0B111A/90'}
                      stroke={isCore ? '#FFFFFF' : isHighlighted ? lm.color : '#334155'}
                      strokeWidth={isHighlighted ? 1.5 : 1}
                      className="transition-all group-hover:brightness-125"
                    />
                    <text
                      y="3.5"
                      fill={isCore ? '#000000' : '#FFFFFF'}
                      fontSize="9.5"
                      fontWeight="bold"
                      fontFamily="sans-serif"
                      textAnchor="middle"
                    >
                      {lm.name.split('(')[0].trim()}
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Hướng dẫn thao tác */}
        <div className="absolute bottom-2 right-2 px-2 py-1 bg-[#0A0F17]/85 border border-[#1E2B3C] text-[10px] font-mono text-gray-400 backdrop-blur-sm pointer-events-none hidden sm:block">
          Nhấn The Beverly Solari để mở 23 tiện ích The Tropical
        </div>
      </div>

      {/* DANH SÁCH CÁC PHÂN KHU ĐẠI ĐÔ THỊ TRỌNG ĐIỂM */}
      <div className="p-3 bg-[#0A0E17] border-t border-[#1E293B] space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-[#C5A880]" />
            <span>DANH SÁCH 10 TÂM ĐIỂM ĐẠI ĐÔ THỊ VINHOMES GRAND PARK</span>
          </div>
          <span className="text-[10px] text-[#C5A880] font-mono">
            Quy mô: 271 ha • 44.000 căn hộ
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-xs font-mono">
          {MACRO_LANDMARKS.map(lm => {
            const isSel = selectedDistrict === lm.id;
            return (
              <button
                key={lm.id}
                type="button"
                onClick={() => {
                  setSelectedDistrict(lm.id);
                  if (lm.isProjectCore && onSelectTropical) {
                    onSelectTropical();
                  }
                }}
                className={`p-1.5 border text-left transition-all truncate ${
                  isSel
                    ? 'bg-[#1C2838] border-[#F59E0B] text-white shadow'
                    : 'bg-[#0E1522] border-[#222E3E] text-gray-400 hover:text-white hover:border-gray-500'
                }`}
              >
                <div className="flex items-center gap-1">
                  <span 
                    className="w-2 h-2 rounded-full shrink-0" 
                    style={{ backgroundColor: lm.color }} 
                  />
                  <span className="font-bold text-[10.5px] truncate">{lm.name.split('(')[0]}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
