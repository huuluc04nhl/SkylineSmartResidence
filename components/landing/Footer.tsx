'use client';

import React from 'react';
import Link from 'next/link';
import SkylineLogo from '@/components/shared/SkylineLogo';

export default function Footer() {
  return (
    <footer className="bg-[#0A0E14] text-gray-400 py-16 border-t border-[#1C2533]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-[#1C2533]">
          {/* Col 1 */}
          <div className="space-y-4">
            <SkylineLogo variant="full" size="sm" theme="dark" />
            <p className="text-xs text-gray-500 font-light leading-relaxed">
              Dự án Khu Căn hộ Cao cấp & Hệ thống Quản lý Chung cư Ứng dụng AI Tự động hóa Vận hành.
            </p>
            <div className="text-[11px] text-gray-500">
              Phát triển bởi: <strong>Nguyễn Hữu Lực</strong>
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
              <div>Đại lộ Skyline, Trung tâm Khu Đô Thị Mới</div>
              <div>Hotline Kỹ thuật: <strong>1900 1088</strong></div>
              <div>Email: bql@skyline-residence.vn</div>
              <div className="pt-2">
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#121820] hover:bg-[#1C2533] border border-[#C5A880]/60 hover:border-[#C5A880] text-[#C5A880] text-[11px] font-semibold uppercase tracking-wider transition-colors"
                >
                  <span>🛡️ Cổng Ban Quản Lý (Admin)</span>
                </Link>
              </div>
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
