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
        : 'bg-white text-gray-600 border-gray-200'
    }`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className={`grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b ${
          isDark ? 'border-[#1C2533]' : 'border-gray-200'
        }`}>
          {/* Col 1 */}
          <div className="space-y-4">
            <SkylineLogo variant="full" size="sm" theme={isDark ? 'dark' : 'light'} />
            <p className={`text-xs font-light leading-relaxed ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Dự án Chung Cư Cao Cấp Skyline & Hệ thống Quản trị Vận hành Thông minh Tự động hóa.
            </p>
            <div className={`text-[11px] ${
              isDark ? 'text-gray-400' : 'text-gray-700'
            }`}>
              Phát triển bởi: <strong className={isDark ? 'text-white' : 'text-gray-900'}>Trần Hữu Lực</strong>
            </div>
          </div>

          {/* Col 2 */}
          <div className="space-y-3">
            <div className={`text-xs font-semibold uppercase tracking-widest ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Khám Phá
            </div>
            <ul className="space-y-2 text-xs">
              <li><a href="#concept" className={`transition-colors ${isDark ? 'hover:text-[#C5A880]' : 'hover:text-[#9E8057]'}`}>Triết lý thiết kế</a></li>
              <li><a href="#floorplans" className={`transition-colors ${isDark ? 'hover:text-[#C5A880]' : 'hover:text-[#9E8057]'}`}>Mặt bằng căn hộ</a></li>
              <li><a href="#amenities" className={`transition-colors ${isDark ? 'hover:text-[#C5A880]' : 'hover:text-[#9E8057]'}`}>Tiện ích đặc quyền</a></li>
              <li><a href="#smart-tech" className={`transition-colors ${isDark ? 'hover:text-[#C5A880]' : 'hover:text-[#9E8057]'}`}>Công nghệ thông minh</a></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-3">
            <div className={`text-xs font-semibold uppercase tracking-widest ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Pháp Lý & An Ninh
            </div>
            <ul className={`space-y-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              <li><span>Hợp đồng Mua bán (SPA)</span></li>
              <li><span>Sổ hồng sở hữu lâu dài</span></li>
              <li><span>Định danh e-KYC & Mã hóa 2FA</span></li>
              <li><span>Tiêu chuẩn SLA Vận hành</span></li>
            </ul>
          </div>

          {/* Col 4 */}
          <div className="space-y-3">
            <div className={`text-xs font-semibold uppercase tracking-widest ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Liên Hệ BQL
            </div>
            <div className={`text-xs space-y-1.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              <div>Chung Cư BS-07, Phân khu Beverly Solari, Vinhomes Grand Park, TP. Thủ Đức, TP.HCM</div>
              <div>Hotline Đón Khách: <strong className={isDark ? 'text-white' : 'text-gray-900'}>0901 888 999</strong></div>
              <div>Hotline Kỹ Thuật: <strong className={isDark ? 'text-white' : 'text-gray-900'}>1900 1088</strong></div>
              <div>Email: bql@skyline-residence.vn</div>
            </div>
          </div>
        </div>

        <div className={`pt-8 flex flex-col sm:flex-row items-center justify-between text-xs gap-4 ${
          isDark ? 'text-gray-600' : 'text-gray-500'
        }`}>
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
