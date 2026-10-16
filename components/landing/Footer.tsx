'use client';

import React from 'react';
import Link from 'next/link';
import SkylineLogo from '@/components/shared/SkylineLogo';
import { useTheme } from '@/lib/themeContext';
import { useLanguage } from '@/lib/languageContext';

export default function Footer() {
  const { theme } = useTheme();
  const { t } = useLanguage();
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
              {t('Dự án Chung Cư Cao Cấp Skyline & Hệ thống Quản trị Vận hành Thông minh Tự động hóa.', 'Skyline Luxury Smart Residence & Automated Operations Management System.')}
            </p>
            <div className={`text-[11px] ${
              isDark ? 'text-gray-400' : 'text-gray-700'
            }`}>
              {t('Phát triển bởi:')} <strong className={isDark ? 'text-white' : 'text-gray-900'}>Trần Hữu Lực</strong>
            </div>
          </div>

          {/* Col 2 */}
          <div className="space-y-3">
            <div className={`text-xs font-semibold uppercase tracking-widest ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              {t('Khám Phá', 'Explore')}
            </div>
            <ul className="space-y-2 text-xs">
              <li><a href="#concept" className={`transition-colors ${isDark ? 'hover:text-[#C5A880]' : 'hover:text-[#9E8057]'}`}>{t('Triết lý thiết kế', 'Design Philosophy')}</a></li>
              <li><a href="#floorplans" className={`transition-colors ${isDark ? 'hover:text-[#C5A880]' : 'hover:text-[#9E8057]'}`}>{t('Mặt bằng căn hộ', 'Apartment Layouts')}</a></li>
              <li><a href="#amenities" className={`transition-colors ${isDark ? 'hover:text-[#C5A880]' : 'hover:text-[#9E8057]'}`}>{t('Tiện ích đặc quyền', 'Exclusive Amenities')}</a></li>
              <li><a href="#smart-tech" className={`transition-colors ${isDark ? 'hover:text-[#C5A880]' : 'hover:text-[#9E8057]'}`}>{t('Công nghệ thông minh', 'Smart Technology')}</a></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-3">
            <div className={`text-xs font-semibold uppercase tracking-widest ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              {t('Pháp Lý & An Ninh', 'Legal & Security')}
            </div>
            <ul className={`space-y-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              <li><span>{t('Hợp đồng Mua bán (SPA)', 'Sales & Purchase Agreement (SPA)')}</span></li>
              <li><span>{t('Sổ hồng sở hữu lâu dài', 'Long-term Pink Book Ownership')}</span></li>
              <li><span>{t('Định danh e-KYC & Mã hóa 2FA', 'e-KYC & 2FA Encryption')}</span></li>
              <li><span>{t('Tiêu chuẩn SLA Vận hành', 'Operational SLA Standards')}</span></li>
            </ul>
          </div>

          {/* Col 4 */}
          <div className="space-y-3">
            <div className={`text-xs font-semibold uppercase tracking-widest ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              {t('Liên Hệ Ban Quản Lý', 'Contact Management Board')}
            </div>
            <div className={`text-xs space-y-1.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              <div>{t('Chung Cư BS-07, Phân khu Beverly Solari, Vinhomes Grand Park, TP. Thủ Đức, TP.HCM', 'BS-07 Building, The Beverly Solari, Vinhomes Grand Park, Thu Duc City, HCMC')}</div>
              <div>{t('Hotline Tiếp Đón:')} <strong className={isDark ? 'text-white' : 'text-gray-900'}>0901 888 999</strong></div>
              <div>{t('Hotline Kỹ Thuật:')} <strong className={isDark ? 'text-white' : 'text-gray-900'}>1900 8899</strong></div>
              <div>Email: banquanly@skyline-residence.vn</div>
            </div>
          </div>
        </div>

        <div className={`pt-8 flex flex-col sm:flex-row items-center justify-between text-xs gap-4 ${
          isDark ? 'text-gray-600' : 'text-gray-500'
        }`}>
          <div>© 2026 SKYLINE Smart Residence. All rights reserved. Hendon Architectural Edition.</div>
          <div className="flex flex-wrap items-center gap-3 sm:gap-6 justify-center sm:justify-end text-[11px] sm:text-xs">
            <span>{t('Bảo mật dữ liệu (Data at-rest)', 'Data Security (At-rest)')}</span>
            <span>{t('Chuẩn WCAG 2.1', 'WCAG 2.1 Standard')}</span>
            <span>Next.js 14 SPA</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
