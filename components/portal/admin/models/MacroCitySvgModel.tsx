'use client';

import React, { useState } from 'react';
import { Map, Compass, Maximize2, Sparkles, Navigation } from 'lucide-react';

interface MacroCitySvgModelProps {
  selectedBlock: string;
  onOpenZoomModal?: () => void;
}

export default function MacroCitySvgModel({
  selectedBlock,
  onOpenZoomModal
}: MacroCitySvgModelProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  return (
    <div className="relative bg-[#06090F] border border-[#1E293B] rounded-none overflow-hidden select-none shadow-2xl flex flex-col">
      {/* Header */}
      <div className="px-3.5 py-2 bg-[#0B111A] border-b border-[#1E293B] flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#141E2D] border border-[#23354C] text-[#C5A880]">
            <Map className="w-3.5 h-3.5 text-[#C5A880]" />
            <span className="font-bold tracking-wider uppercase text-[11px]">Mô Hình Quy Hoạch Tổng Thể Đại Đô Thị 271 ha (Tự Vẽ Vector)</span>
          </div>
          <span className="text-gray-400 text-[11px] hidden sm:inline">
            Vinhomes Grand Park • Phân khu The Beverly Solari
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setZoomLevel(prev => Math.max(0.8, Number((prev - 0.2).toFixed(1))))}
            className="px-2 py-0.5 bg-[#121A26] hover:bg-[#1A2637] border border-[#223247] text-gray-300 hover:text-white"
          >
            -
          </button>
          <span className="px-2 py-0.5 bg-[#090D14] border border-[#223247] text-[#C5A880] text-[11px] min-w-[48px] text-center">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoomLevel(prev => Math.min(2.0, Number((prev + 0.2).toFixed(1))))}
            className="px-2 py-0.5 bg-[#121A26] hover:bg-[#1A2637] border border-[#223247] text-gray-300 hover:text-white"
          >
            +
          </button>
          {onOpenZoomModal && (
            <button
              type="button"
              onClick={onOpenZoomModal}
              className="px-2.5 py-0.5 bg-[#C5A880] hover:bg-[#D4BC96] text-black font-bold flex items-center gap-1 ml-1"
            >
              <Maximize2 className="w-3 h-3" />
              <span className="text-[10.5px]">Toàn Cảnh</span>
            </button>
          )}
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full h-[460px] sm:h-[500px] bg-[#05080E] overflow-hidden flex items-center justify-center">
        <svg
          viewBox="0 0 1000 660"
          className="w-full h-full object-contain transition-transform duration-200"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <defs>
            <linearGradient id="macroRiver" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0284C7" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#0369A1" stopOpacity="0.6" />
            </linearGradient>
            <filter id="macroGoldGlow">
              <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#C5A880" floodOpacity="0.8" />
            </filter>
          </defs>

          {/* Sông Đồng Nai (Phía Đông) */}
          <path
            d="M 850,0 C 820,150 830,300 870,450 C 900,550 940,620 980,660 L 1000,660 L 1000,0 Z"
            fill="url(#macroRiver)"
            stroke="#0284C7"
            strokeWidth="1.5"
            opacity="0.7"
          />
          <text x="920" y="240" fill="#38BDF8" fontSize="12" fontFamily="monospace" transform="rotate(90 920 240)" letterSpacing="3">
            SÔNG ĐỒNG NAI
          </text>

          {/* Sông Tắc (Phía Nam) */}
          <path
            d="M 200,660 C 350,620 550,630 750,650 C 850,660 900,660 980,660 L 200,660 Z"
            fill="url(#macroRiver)"
            opacity="0.5"
          />
          <text x="500" y="645" fill="#38BDF8" fontSize="11" fontFamily="monospace" textAnchor="middle">
            SÔNG TẮC
          </text>

          {/* Cao tốc Vành Đai 3 */}
          <path d="M 120,0 L 120,660" stroke="#1E293B" strokeWidth="20" />
          <path d="M 120,0 L 120,660" stroke="#0284C7" strokeWidth="2" strokeDasharray="10 6" opacity="0.7" />
          <text x="115" y="120" fill="#7DD3FC" fontSize="10" fontFamily="monospace" transform="rotate(-90 115 120)" textAnchor="middle">
            CAO TỐC VÀNH ĐAI 3
          </text>

          {/* Đại công viên 36ha & Biển hồ */}
          <path
            d="M 520,240 C 640,210 740,230 760,360 C 740,460 620,480 500,420 C 470,360 480,280 520,240 Z"
            fill="#064E3B"
            stroke="#10B981"
            strokeWidth="2"
            opacity="0.6"
          />
          <path
            d="M 560,280 C 640,260 700,280 710,360 C 690,420 620,430 550,380 C 530,340 540,300 560,280 Z"
            fill="#0891B2"
            opacity="0.7"
          />
          <text x="630" y="350" fill="#FFFFFF" fontSize="11" fontWeight="bold" textAnchor="middle">
            ĐẠI CÔNG VIÊN 36HA
          </text>

          {/* PHÂN KHU 1: THE BEVERLY SOLARI (NƠI ĐẶT DỰ ÁN & CHUNG CƯ BS-07 ĐẾN BS-10) - NỔI BẬT ÁNH VÀNG */}
          <g filter="url(#macroGoldGlow)">
            <path
              d="M 240,240 L 440,210 L 470,390 L 260,430 Z"
              fill="#1A2536"
              stroke="#C5A880"
              strokeWidth="2.5"
            />
            <text x="350" y="290" fill="#C5A880" fontSize="13" fontWeight="bold" textAnchor="middle">
              THE BEVERLY SOLARI
            </text>
            <text x="350" y="310" fill="#F8FAFC" fontSize="10" fontFamily="monospace" textAnchor="middle">
              Phân khu The Tropical ({selectedBlock})
            </text>
            <rect x="290" y="325" width="120" height="22" rx="3" fill="#C5A880" />
            <text x="350" y="340" fill="#000000" fontSize="9.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
              ★ VỊ TRÍ CỦA BẠN
            </text>
          </g>

          {/* Các phân khu đô thị khác */}
          {/* The Origami */}
          <path d="M 220,50 L 420,40 L 430,190 L 230,210 Z" fill="#0F172A" stroke="#334155" strokeWidth="1.5" />
          <text x="330" y="125" fill="#94A3B8" fontSize="11" fontWeight="bold" textAnchor="middle">THE ORIGAMI</text>
          <text x="330" y="142" fill="#64748B" fontSize="9" fontFamily="monospace" textAnchor="middle">21 Chung Cư • Phong Cách Nhật</text>

          {/* The Rainbow */}
          <path d="M 450,40 L 650,30 L 660,180 L 460,190 Z" fill="#0F172A" stroke="#334155" strokeWidth="1.5" />
          <text x="555" y="115" fill="#94A3B8" fontSize="11" fontWeight="bold" textAnchor="middle">THE RAINBOW</text>
          <text x="555" y="132" fill="#64748B" fontSize="9" fontFamily="monospace" textAnchor="middle">17 Chung Cư • Đã Bàn Giao</text>

          {/* The Beverly */}
          <path d="M 480,210 L 580,200 L 590,320 L 490,330 Z" fill="#0F172A" stroke="#334155" strokeWidth="1.5" />
          <text x="535" y="270" fill="#94A3B8" fontSize="10" fontWeight="bold" textAnchor="middle">THE BEVERLY</text>

          {/* The Manhattan & Manhattan Glory (Khu biệt thự thấp tầng & Shophouse) */}
          <path d="M 520,470 L 780,440 L 800,580 L 540,610 Z" fill="#0F172A" stroke="#334155" strokeWidth="1.5" />
          <text x="660" y="535" fill="#94A3B8" fontSize="11" fontWeight="bold" textAnchor="middle">THE MANHATTAN GLORY</text>
          <text x="660" y="552" fill="#64748B" fontSize="9" fontFamily="monospace" textAnchor="middle">Bến Du Thuyền & Biệt Thự Ven Sông</text>

          {/* Vincom Mega Mall */}
          <rect x="470" y="380" width="55" height="40" rx="4" fill="#881337" stroke="#F43F5E" strokeWidth="1.5" />
          <text x="497" y="405" fill="#FECDD3" fontSize="8" fontWeight="bold" textAnchor="middle">VINCOM</text>

          {/* Bệnh viện Vinmec */}
          <rect x="360" y="470" width="60" height="40" rx="4" fill="#450A0A" stroke="#EF4444" strokeWidth="1.5" />
          <text x="390" y="495" fill="#FCA5A5" fontSize="8" fontWeight="bold" textAnchor="middle">VINMEC</text>

          {/* Vinschool */}
          <rect x="440" y="160" width="60" height="35" rx="4" fill="#082F49" stroke="#38BDF8" strokeWidth="1.5" />
          <text x="470" y="182" fill="#BAE6FD" fontSize="8" fontWeight="bold" textAnchor="middle">VINSCHOOL</text>
        </svg>

        <div className="absolute bottom-3 left-3 bg-[#0A0F17]/95 border border-[#C5A880] p-2.5 text-xs font-mono backdrop-blur-md">
          <div className="text-[#C5A880] font-bold">ĐẠI ĐÔ THỊ VINHOMES GRAND PARK (271 HA)</div>
          <div className="text-gray-400 text-[10px] mt-0.5">
            Dự án Skyline Smart Residence nằm tại phân khu trung tâm The Beverly Solari
          </div>
        </div>
      </div>
    </div>
  );
}
