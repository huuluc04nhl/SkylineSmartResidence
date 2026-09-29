'use client';

import React, { useState } from 'react';
import { Map, Compass, Maximize2, Sparkles, Navigation, ChevronRight, Building2, Trees, Waves } from 'lucide-react';

interface MacroCitySvgModelProps {
  selectedBlock: string;
  onSelectTropical?: () => void;
  onOpenZoomModal?: () => void;
}

export default function MacroCitySvgModel({
  selectedBlock,
  onSelectTropical,
  onOpenZoomModal
}: MacroCitySvgModelProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null);

  return (
    <div className="relative bg-[#06090F] border border-[#1E293B] rounded-none overflow-hidden select-none shadow-2xl flex flex-col">
      {/* THANH ĐIỀU HÀNH MÔ HÌNH ĐẠI ĐÔ THỊ */}
      <div className="px-3.5 py-2.5 bg-[#0B111A] border-b border-[#1E293B] flex flex-wrap items-center justify-between gap-2.5 text-xs font-mono">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#141E2D] border border-[#23354C] text-[#C5A880]">
            <Map className="w-3.5 h-3.5 text-[#C5A880]" />
            <span className="font-bold tracking-wider uppercase text-[11px]">
              QUY HOẠCH TỔNG THỂ ĐẠI ĐÔ THỊ VINHOMES GRAND PARK (271 HA)
            </span>
          </div>
          <span className="text-gray-400 text-[11px] hidden md:inline">
            Tâm điểm kết nối: Phân khu The Beverly Solari (The Tropical)
          </span>
        </div>

        {/* Nút điều khiển thu phóng & Phóng to */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setZoomLevel(prev => Math.max(0.7, Number((prev - 0.15).toFixed(2))))}
            className="px-2 py-0.5 bg-[#121A26] hover:bg-[#1A2637] border border-[#223247] text-gray-300 hover:text-white"
            title="Thu nhỏ"
          >
            -
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
            className="px-2 py-0.5 bg-[#121A26] hover:bg-[#1A2637] border border-[#223247] text-gray-300 hover:text-white"
            title="Phóng to"
          >
            +
          </button>
          {onOpenZoomModal && (
            <button
              type="button"
              onClick={onOpenZoomModal}
              className="px-2.5 py-1 bg-[#C5A880] hover:bg-[#D4BC96] text-black font-bold flex items-center gap-1 ml-1"
              title="Phóng to toàn màn hình"
            >
              <Maximize2 className="w-3 h-3" />
              <span className="text-[10.5px]">Toàn Cảnh</span>
            </button>
          )}
        </div>
      </div>

      {/* SVG CANVAS ĐƯỢC CĂN CHỈNH TỶ LỆ CHUẨN XÁC, CÂN ĐỐI TỔNG THỂ */}
      <div className="relative w-full h-[460px] sm:h-[500px] bg-[#070B12] overflow-hidden flex items-center justify-center p-2">
        <svg
          viewBox="0 0 1000 620"
          className="w-full h-full object-contain transition-transform duration-200"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <defs>
            {/* Gradient Sông Đồng Nai & Sông Tắc */}
            <linearGradient id="macroRiverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0284C7" stopOpacity="0.5" />
              <stop offset="50%" stopColor="#0369A1" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#075985" stopOpacity="0.9" />
            </linearGradient>

            {/* Gradient Đại Công Viên 36ha */}
            <radialGradient id="macroParkGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#059669" stopOpacity="0.85" />
              <stop offset="60%" stopColor="#065F46" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#022C22" stopOpacity="0.95" />
            </radialGradient>

            {/* Gradient Biển Hồ Cát Trắng */}
            <linearGradient id="macroLakeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#0891B2" stopOpacity="0.95" />
            </linearGradient>

            {/* Hiệu ứng hào quang Vàng Kim Phân khu dự án */}
            <filter id="macroSolariGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="10" floodColor="#C5A880" floodOpacity="0.95" />
            </filter>

            {/* Pattern đường cao tốc & hạ tầng */}
            <pattern id="macroRoadGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#162235" strokeWidth="0.5" />
            </pattern>
          </defs>

          {/* Lưới tọa độ bản đồ nền */}
          <rect x="0" y="0" width="1000" height="620" fill="#070B12" />
          <rect x="0" y="0" width="1000" height="620" fill="url(#macroRoadGrid)" opacity="0.4" />

          {/* ================================================================= */}
          {/* HỆ THỐNG SÔNG NƯỚC BAO QUANH: SÔNG ĐỒNG NAI & SÔNG TẮC            */}
          {/* ================================================================= */}
          {/* Sông Đồng Nai (Phía Đông lộng gió) */}
          <path
            d="M 820,0 C 790,140 800,280 840,410 C 870,510 910,580 970,620 L 1000,620 L 1000,0 Z"
            fill="url(#macroRiverGrad)"
            stroke="#38BDF8"
            strokeWidth="2"
          />
          <text x="915" y="240" fill="#E0F2FE" fontSize="12" fontWeight="bold" fontFamily="monospace" transform="rotate(90 915 240)" letterSpacing="4">
            SÔNG ĐỒNG NAI (RỘNG 1KM)
          </text>

          {/* Sông Tắc (Phía Nam) */}
          <path
            d="M 120,620 C 300,575 520,585 730,605 C 830,615 900,620 970,620 L 120,620 Z"
            fill="url(#macroRiverGrad)"
            opacity="0.75"
          />
          <text x="470" y="605" fill="#BAE6FD" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
            SÔNG TẮC
          </text>

          {/* Trục Cao Tốc Vành Đai 3 chạy dọc phía Tây dự án */}
          <rect x="70" y="0" width="28" height="620" fill="#0F172A" stroke="#253549" strokeWidth="1.5" />
          <line x1="84" y1="0" x2="84" y2="620" stroke="#F59E0B" strokeWidth="1.8" strokeDasharray="14 10" />
          <text x="80" y="310" fill="#FDE68A" fontSize="10.5" fontWeight="bold" fontFamily="monospace" transform="rotate(-90 80 310)" textAnchor="middle" letterSpacing="3">
            CAO TỐC VÀNH ĐAI 3 TP.HCM
          </text>

          {/* ================================================================= */}
          {/* TRÁI TIM ĐÔ THỊ: ĐẠI CÔNG VIÊN 36HA & BIỂN HỒ CÁT TRẮNG           */}
          {/* ================================================================= */}
          <g className="cursor-pointer group" onMouseEnter={() => setHoveredDistrict('PARK_36HA')} onMouseLeave={() => setHoveredDistrict(null)}>
            <ellipse cx="640" cy="330" rx="145" ry="110" fill="url(#macroParkGrad)" stroke="#10B981" strokeWidth="2.5" />
            <ellipse cx="640" cy="330" rx="85" ry="60" fill="url(#macroLakeGrad)" stroke="#E0F2FE" strokeWidth="1.5" />
            <text x="640" y="325" fill="#FFFFFF" fontSize="13" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle" filter="drop-shadow(0 2px 4px #000)">
              ĐẠI CÔNG VIÊN 36HA
            </text>
            <text x="640" y="345" fill="#E0F2FE" fontSize="10" fontFamily="monospace" textAnchor="middle">
              Biển Hồ Cát Trắng Nhân Tạo
            </text>
          </g>

          {/* ================================================================= */}
          {/* CÁC PHÂN KHU ĐÔ THỊ LÂN CẬN                                       */}
          {/* ================================================================= */}
          {/* Phân khu The Origami (Phong cách Nhật Bản) */}
          <g className="cursor-pointer group" onMouseEnter={() => setHoveredDistrict('ORIGAMI')} onMouseLeave={() => setHoveredDistrict(null)}>
            <polygon points="140,70 380,55 390,215 150,230" fill="#0E1726" stroke="#2B3E56" strokeWidth="1.5" />
            <text x="260" y="130" fill="#CBD5E1" fontSize="13" fontWeight="bold" textAnchor="middle">THE ORIGAMI</text>
            <text x="260" y="150" fill="#94A3B8" fontSize="10" fontFamily="monospace" textAnchor="middle">21 Khối Chung Cư • Phong Cách Nhật Bản</text>
          </g>

          {/* Phân khu The Rainbow */}
          <g className="cursor-pointer group" onMouseEnter={() => setHoveredDistrict('RAINBOW')} onMouseLeave={() => setHoveredDistrict(null)}>
            <polygon points="410,50 660,35 675,200 425,215" fill="#0E1726" stroke="#2B3E56" strokeWidth="1.5" />
            <text x="540" y="120" fill="#CBD5E1" fontSize="13" fontWeight="bold" textAnchor="middle">THE RAINBOW</text>
            <text x="540" y="140" fill="#94A3B8" fontSize="10" fontFamily="monospace" textAnchor="middle">17 Khối Chung Cư • Đã Bàn Giao</text>
          </g>

          {/* Phân khu The Beverly */}
          <g className="cursor-pointer group" onMouseEnter={() => setHoveredDistrict('BEVERLY')} onMouseLeave={() => setHoveredDistrict(null)}>
            <polygon points="460,240 560,225 570,360 470,375" fill="#0F1B2D" stroke="#38BDF8" strokeWidth="1.5" />
            <text x="515" y="300" fill="#7DD3FC" fontSize="11" fontWeight="bold" textAnchor="middle">THE BEVERLY</text>
            <text x="515" y="318" fill="#94A3B8" fontSize="8.5" fontFamily="monospace" textAnchor="middle">View Trực Diện Biển Hồ</text>
          </g>

          {/* Khu The Manhattan & Manhattan Glory (Biệt thự thấp tầng & Bến du thuyền) */}
          <g className="cursor-pointer group" onMouseEnter={() => setHoveredDistrict('MANHATTAN')} onMouseLeave={() => setHoveredDistrict(null)}>
            <polygon points="500,470 780,440 810,570 520,590" fill="#0C1523" stroke="#334155" strokeWidth="1.5" />
            <text x="650" y="525" fill="#E2E8F0" fontSize="12" fontWeight="bold" textAnchor="middle">THE MANHATTAN GLORY</text>
            <text x="650" y="545" fill="#94A3B8" fontSize="9.5" fontFamily="monospace" textAnchor="middle">Bến Du Thuyền Thượng Lưu & Biệt Thự Ven Sông</text>
          </g>

          {/* ================================================================= */}
          {/* PHÂN KHU TRỌNG ĐIỂM: THE BEVERLY SOLARI (CHUNG CƯ CỦA BẠN)        */}
          {/* ================================================================= */}
          <g
            filter="url(#macroSolariGlow)"
            onClick={() => onSelectTropical && onSelectTropical()}
            className="cursor-pointer group"
          >
            {/* Khối khuôn viên phân khu */}
            <polygon
              points="150,265 410,245 425,445 165,475"
              fill="#182538"
              stroke="#C5A880"
              strokeWidth="3"
              className="group-hover:fill-[#1F314A] transition-colors"
            />

            {/* Viền chỉ hướng kim cương */}
            <rect x="175" y="280" width="220" height="26" rx="3" fill="#C5A880" />
            <text x="285" y="298" fill="#000000" fontSize="13" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle" letterSpacing="1">
              THE BEVERLY SOLARI
            </text>

            <text x="290" y="335" fill="#FFFFFF" fontSize="12" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
              Phân khu The Tropical
            </text>
            <text x="290" y="355" fill="#E2E8F0" fontSize="10.5" fontFamily="monospace" textAnchor="middle">
              Chung Cư BS-07 • BS-08 • BS-09 • BS-10
            </text>

            {/* Badge căn của bạn */}
            <rect x="200" y="375" width="180" height="24" rx="3" fill="#78350F" stroke="#F59E0B" strokeWidth="1" />
            <text x="290" y="391" fill="#FEF08A" fontSize="9.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
              ⭐ CĂN CỦA BẠN: BS-07 (TẦNG 30)
            </text>

            {/* Nút Call To Action xem The Tropical */}
            <rect
              x="180"
              y="420"
              width="220"
              height="28"
              rx="4"
              fill="#C5A880"
              className="group-hover:brightness-125 transition-all"
            />
            <text
              x="290"
              y="438"
              fill="#000000"
              fontSize="10.5"
              fontWeight="bold"
              fontFamily="monospace"
              textAnchor="middle"
            >
              BẤM XEM PHÂN KHU TROPICAL ➔
            </text>
          </g>

          {/* ================================================================= */}
          {/* CÁC ĐẠI TIỆN ÍCH BIỂU TƯỢNG (VINCOM, VINMEC, VINSCHOOL)            */}
          {/* ================================================================= */}
          {/* TTTM Vincom Mega Mall (Liền kề The Beverly Solari) */}
          <g className="cursor-pointer">
            <rect x="420" y="410" width="70" height="42" rx="4" fill="#881337" stroke="#F43F5E" strokeWidth="1.5" />
            <text x="455" y="428" fill="#FFFFFF" fontSize="9" fontWeight="bold" textAnchor="middle">VINCOM</text>
            <text x="455" y="442" fill="#FECDD3" fontSize="7.5" fontFamily="monospace" textAnchor="middle">Mega Mall</text>
          </g>

          {/* Bệnh viện Vinmec */}
          <g className="cursor-pointer">
            <rect x="330" y="500" width="70" height="38" rx="4" fill="#450A0A" stroke="#EF4444" strokeWidth="1.5" />
            <text x="365" y="518" fill="#FFFFFF" fontSize="9" fontWeight="bold" textAnchor="middle">VINMEC</text>
            <text x="365" y="530" fill="#FCA5A5" fontSize="7.5" fontFamily="monospace" textAnchor="middle">Bệnh Viện QT</text>
          </g>

          {/* Trường Vinschool */}
          <g className="cursor-pointer">
            <rect x="390" y="190" width="70" height="36" rx="4" fill="#0C4A6E" stroke="#38BDF8" strokeWidth="1.5" />
            <text x="425" y="207" fill="#FFFFFF" fontSize="9" fontWeight="bold" textAnchor="middle">VINSCHOOL</text>
            <text x="425" y="219" fill="#BAE6FD" fontSize="7.5" fontFamily="monospace" textAnchor="middle">Liên Cấp K-12</text>
          </g>
        </svg>

        {/* HUD CHÂN BẢN ĐỒ: THÔNG TIN TÓM TẮT & NÚT TRUY CẬP NHANH */}
        <div className="absolute bottom-3 left-3 right-3 bg-[#0A0F17]/95 border border-[#C5A880] p-2.5 backdrop-blur-md shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#C5A880] shrink-0" />
            <div>
              <span className="text-white font-bold">ĐẠI ĐÔ THỊ VINHOMES GRAND PARK (271 HA)</span>
              <span className="text-gray-400 text-[11px] block sm:inline sm:ml-2">
                Phân khu The Beverly Solari tọa lạc tại tọa độ trung tâm thương mại & kết nối giao thông đắt giá nhất
              </span>
            </div>
          </div>
          {onSelectTropical && (
            <button
              type="button"
              onClick={onSelectTropical}
              className="px-3 py-1 bg-[#C5A880] hover:bg-[#D4BC96] text-black font-bold text-xs font-mono transition-all flex items-center gap-1 self-start sm:self-auto shrink-0 shadow"
            >
              <span>Xem Phân Khu The Tropical</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
