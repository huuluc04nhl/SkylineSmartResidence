'use client';

import React from 'react';
import Link from 'next/link';
import SkylineLogo from '@/components/shared/SkylineLogo';
import { useTheme } from '@/lib/themeContext';

export default function Footer() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <footer className={`py-16 border-t transition-colors duration-300 ${
      isDark 
        ? 'bg-[#0A0E14] text-gray-400 border-[#1C2533]' 
        : 'bg-slate-900 text-slate-300 border-slate-800'
    }`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className={`grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b ${
          isDark ? 'border-[#1C2533]' : 'border-slate-800'
        }`}>
          {/* Col 1 */}
          <div className="space-y-4">
            <SkylineLogo variant="full" size="sm" theme="dark" />
            <p className="text-xs text-slate-400 font-light leading-relaxed">
              Dự án Chung Cư Cao Cấp Skyline & Hệ thống Quản trị Vận hành Thông minh Tự động hóa.
            </p>
            <div className="text-[11px] text-slate-400">
              Phát triển bởi: <strong className="text-white">Nguyễn Hữu Lực</strong>
            </div>
          </div>

          {/* Col 2 */}
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-widest text-white">Khám Phá</div>
            <ul className="space-y-2 text-xs">
              <li><a href="#concept" className="hover:text-[#C5A880]">Triết lý thiết kế</a></li>
              <li><a href="#floorplans" className="hover:text-[#C5A880]">Mặt bằng căn hộ</a></li>
              <li><a href="#amenities" className="hover:text-[#C5A880]">Tiện ích đặc quyền</a></li>
              <li><a href="#smart-tech" className="hover:text-[#C5A880]">Công nghệ thông minh</a></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-widest text-white">Pháp Lý & An Ninh</div>
            <ul className="space-y-2 text-xs">
              <li><span>Hợp đồng Mua bán (SPA)</span></li>
              <li><span>Sổ hồng sở hữu lâu dài</span></li>
              <li><span>Định danh e-KYC & Mã hóa 2FA</span></li>
              <li><span>Tiêu chuẩn SLA Vận hành</span></li>
            </ul>
          </div>

          {/* Col 4 */}
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-widest text-white">Liên Hệ BQL</div>
            <div className="text-xs space-y-1.5 text-gray-400">
              <div>128 Bến Vân Đồn, P.6, Q.4, TP.HCM</div>
              <div>Hotline Đón Khách: <strong>0901 888 999</strong></div>
              <div>Hotline Kỹ Thuật: <strong>1900 1088</strong></div>
              <div>Email: bql@skyline-residence.vn</div>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-600 gap-4">
          <div>© 2026 SKYLINE Smart Residence. All rights reserved. Hendon Architectural Edition.</div>
          <div className="flex items-center gap-6">
            <span>Bảo mật dữ liệu (Data at-rest)</span>
            <span>Chuẩn WCAG 2.1</span>
            <span>Next.js 14 SPA</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
