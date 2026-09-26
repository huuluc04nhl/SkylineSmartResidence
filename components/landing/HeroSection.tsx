'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, ShieldCheck, LayoutDashboard, KeyRound } from 'lucide-react';
import { UserRole } from '@/lib/dataStore';
import { useAuth } from '@/lib/authContext';
import { useTheme } from '@/lib/themeContext';

interface HeroSectionProps {
  onOpenLogin: (role?: UserRole) => void;
}

export default function HeroSection({ onOpenLogin }: HeroSectionProps) {
  const { currentUser, isAuthenticated } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <section className={`relative min-h-[92vh] flex items-center pt-24 pb-16 overflow-hidden transition-colors duration-300 ${
      isDark ? 'bg-[#0D1117] text-white' : 'bg-[#F8FAFC] text-gray-900'
    }`}>
      {/* Background Architectural Texture with subtle overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center opacity-30"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1920&auto=format&fit=crop&q=80')`,
        }}
      ></div>
      <div className={`absolute inset-0 z-0 ${
        isDark 
          ? 'bg-gradient-to-r from-[#0D1117] via-[#0D1117]/85 to-transparent' 
          : 'bg-gradient-to-r from-[#F8FAFC] via-[#F8FAFC]/90 to-transparent'
      }`}></div>

      <div className={`relative z-10 max-w-7xl mx-auto px-6 grid grid-cols-1 ${
        isAuthenticated && currentUser ? 'lg:grid-cols-12 gap-12' : 'gap-8'
      } items-center`}>
        {/* Left Column: Architectural Editorial Text */}
        <div className={`${isAuthenticated && currentUser ? 'lg:col-span-8' : 'lg:col-span-12 max-w-4xl'} space-y-8`}>
          <div className={`inline-flex items-center gap-2.5 px-3 py-1.5 border text-[11px] uppercase tracking-[0.25em] font-medium backdrop-blur-sm rounded-none ${
            isDark 
              ? 'border-[#C5A880]/40 text-[#C5A880] bg-[#0D1117]/80' 
              : 'border-[#C5A880]/60 text-amber-800 bg-white/90 shadow-sm'
          }`}>
            <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
            Kiến Trúc Đương Đại Tích Hợp Lõi AI
          </div>

          <h1 className={`text-4xl sm:text-5xl lg:text-6xl font-serif font-normal leading-[1.15] tracking-tight ${
            isDark ? 'text-[#FAFAFA]' : 'text-[#0D1117]'
          }`}>
            Nơi Chuẩn Mực Kiến Trúc Gặp Gỡ <br />
            <span className="italic text-[#C5A880] font-light">Trí Tuệ Nhân Tạo 4.0</span>
          </h1>

          <p className={`font-light text-base lg:text-lg max-w-2xl leading-relaxed ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Dự án căn hộ hạng sang <strong>SKYLINE Smart Residence</strong> kiến tạo chuẩn sống tự động hóa 
            hoàn chỉnh: Định danh sinh trắc học FaceID &lt;0.5s, giám sát an ninh Vision AI, 
            trợ lý ảo AI Concierge 24/7 và hệ thống dự báo bảo trì thông minh.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <a
              href="#floorplans"
              className="hendon-btn-gold text-[12px] shadow-lg rounded-none"
            >
              Xem Mặt Bằng Căn Hộ
            </a>

            {isAuthenticated && currentUser ? (
              <Link
                href={currentUser.role === 'ADMIN' ? '/portal?tab=admin-dashboard' : currentUser.role === 'TECHNICIAN' ? '/portal?tab=admin-kanban' : '/portal?tab=resident-home'}
                className={`text-[12px] flex items-center gap-2 px-5 py-3 border font-semibold tracking-wider uppercase transition-all rounded-none ${
                  isDark
                    ? 'border-[#C5A880] text-[#C5A880] hover:bg-[#C5A880] hover:text-[#0D1117]'
                    : 'border-amber-700 text-amber-800 hover:bg-[#C5A880] hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Vào Bảng Điều Khiển ({currentUser.role === 'ADMIN' ? 'Ban Quản Lý' : currentUser.role === 'TECHNICIAN' ? 'Kỹ Thuật' : 'Cư Dân'})
              </Link>
            ) : (
              <button
                onClick={() => onOpenLogin()}
                className={`text-[12px] flex items-center gap-2 px-5 py-3 border font-semibold tracking-wider uppercase transition-all rounded-none cursor-pointer ${
                  isDark
                    ? 'border-gray-600 hover:border-white text-white'
                    : 'border-gray-400 hover:border-gray-900 text-gray-800'
                }`}
              >
                <KeyRound className="w-4 h-4 text-[#C5A880]" />
                Đăng Nhập Hệ Thống
              </button>
            )}
          </div>

          {/* Core Highlights Grid - 1 Tòa Chung Cư Đơn Khối Skyline */}
          <div className={`grid grid-cols-2 sm:grid-cols-4 gap-6 pt-8 border-t ${
            isDark ? 'border-[#222B35]' : 'border-gray-200'
          }`}>
            <div>
              <div className="text-2xl font-serif text-[#C5A880] font-bold">25 Tầng</div>
              <div className={`text-[11px] uppercase tracking-wider mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Tòa Tháp Đơn Khối Skyline
              </div>
            </div>
            <div>
              <div className="text-2xl font-serif text-[#C5A880] font-bold">&lt; 0.5s</div>
              <div className={`text-[11px] uppercase tracking-wider mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Tốc Độ Mở Cửa &amp; Cổng Xe
              </div>
            </div>
            <div>
              <div className="text-2xl font-serif text-[#C5A880] font-bold">15 Module</div>
              <div className={`text-[11px] uppercase tracking-wider mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Hệ Thống Vận Hành AI
              </div>
            </div>
            <div>
              <div className="text-2xl font-serif text-[#C5A880] font-bold">100%</div>
              <div className={`text-[11px] uppercase tracking-wider mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Sổ Hồng &amp; SPA Minh Bạch
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Chỉ hiển thị Thẻ Định Danh / Phiên Cư Dân khi ĐÃ ĐĂNG NHẬP */}
        {isAuthenticated && currentUser && (
          <div className="lg:col-span-4 hidden lg:block">
            <div className={`border p-6 space-y-4 shadow-2xl rounded-none transition-colors ${
              isDark 
                ? 'border-[#2D3748] bg-[#121820]' 
                : 'border-gray-200 bg-white shadow-xl'
            }`}>
              <div className={`text-[11px] uppercase tracking-[0.2em] text-[#C5A880] font-semibold border-b pb-3 flex items-center justify-between ${
                isDark ? 'border-[#222B35]' : 'border-gray-100'
              }`}>
                <span>Thông Tin Phiên Đăng Nhập</span>
                <span className="text-gray-400 font-mono">ID: {currentUser.apartment_code || 'SKY-01'}</span>
              </div>
              
              <div className="space-y-3 text-sm">
                <div className={`flex justify-between py-1.5 border-b ${isDark ? 'border-[#1E2631]' : 'border-gray-100'}`}>
                  <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Họ và tên:</span>
                  <span className={`font-semibold text-right text-xs sm:text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {currentUser.full_name}
                  </span>
                </div>
                <div className={`flex justify-between py-1.5 border-b ${isDark ? 'border-[#1E2631]' : 'border-gray-100'}`}>
                  <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Vai trò:</span>
                  <span className="font-semibold text-right text-xs text-[#C5A880]">
                    {currentUser.role === 'ADMIN' ? 'Ban Quản Lý Chung Cư' : currentUser.role === 'TECHNICIAN' ? 'Kỹ Thuật Viên' : `Chủ Hộ Căn ${currentUser.apartment_code || 'CH-06'}`}
                  </span>
                </div>
                <div className={`flex justify-between py-1.5 border-b ${isDark ? 'border-[#1E2631]' : 'border-gray-100'}`}>
                  <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Vị Trí:</span>
                  <span className={`font-medium text-right text-xs sm:text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Chung Cư BS-07 • The Tropical, TP. Thủ Đức
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Trạng thái:</span>
                  <span className="font-medium text-emerald-500 flex items-center gap-1.5 text-xs">
                    <span className="w-2 h-2 bg-emerald-500 rounded-none animate-pulse"></span>
                    Đang Hoạt Động
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href={currentUser.role === 'ADMIN' ? '/portal?tab=admin-dashboard' : currentUser.role === 'TECHNICIAN' ? '/portal?tab=admin-kanban' : '/portal?tab=resident-home'}
                  className="w-full py-3 bg-[#C5A880] hover:bg-[#D4AF37] text-[#0D1117] text-[11px] uppercase tracking-[0.18em] font-bold transition-all flex items-center justify-center gap-2 rounded-none cursor-pointer shadow-md"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  {currentUser.role === 'ADMIN' ? 'Vào Bảng Quản Trị Ban Quản Lý' : currentUser.role === 'TECHNICIAN' ? 'Vào Bảng Việc Kỹ Thuật' : 'Vào Bảng Điều Khiển Căn Hộ'}
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
