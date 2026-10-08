'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, ShieldCheck, LayoutDashboard, KeyRound, Building2 } from 'lucide-react';
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
      isDark ? 'bg-[#0A0E14] text-white' : 'bg-[#F8FAFC] text-gray-900'
    }`}>
      {/* Background Architectural Texture with subtle overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center opacity-25"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1920&auto=format&fit=crop&q=80')`,
        }}
      ></div>
      <div className={`absolute inset-0 z-0 ${
        isDark 
          ? 'bg-gradient-to-r from-[#0A0E14] via-[#0A0E14]/90 to-transparent' 
          : 'bg-gradient-to-r from-[#F8FAFC] via-[#F8FAFC]/90 to-transparent'
      }`}></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column: Architectural Editorial Text */}
        <div className="lg:col-span-7 space-y-6 sm:space-y-8">
          <div className={`inline-flex items-center gap-2.5 px-3 py-1.5 border text-[11px] uppercase tracking-[0.25em] font-medium backdrop-blur-sm rounded-none ${
            isDark 
              ? 'border-[#C5A880]/40 text-[#C5A880] bg-[#0E131B]/80' 
              : 'border-[#C5A880]/60 text-amber-800 bg-white/90 shadow-sm'
          }`}>
            <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
            Kiến Trúc Đương Đại Tích Hợp Lõi AI
          </div>

          <h1 className={`text-3xl sm:text-5xl lg:text-6xl font-serif font-normal leading-[1.15] tracking-tight ${
            isDark ? 'text-[#FAFAFA]' : 'text-[#0D1117]'
          }`}>
            Nơi Chuẩn Mực Kiến Trúc Gặp Gỡ <br />
            <span className="italic text-[#C5A880] font-light">Trí Tuệ Nhân Tạo 4.0</span>
          </h1>

          <p className={`font-light text-sm sm:text-base lg:text-lg max-w-2xl leading-relaxed ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Dự án căn hộ hạng sang <strong>SKYLINE Smart Residence</strong> tại cụm 4 chung cư 
            <strong> The Tropical (BS-07, BS-08, BS-09, BS-10)</strong> kiến tạo chuẩn sống tự động hóa 
            hoàn chỉnh: Định danh sinh trắc học FaceID &lt;0.5s, giám sát an ninh Vision AI, 
            trợ lý ảo AI Concierge 24/7 và hệ thống dự báo bảo trì thông minh.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-1">
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
                    ? 'border-gray-600 hover:border-white text-white bg-[#0E131B]/60 backdrop-blur-sm'
                    : 'border-gray-400 hover:border-gray-900 text-gray-800 bg-white/60'
                }`}
              >
                <KeyRound className="w-4 h-4 text-[#C5A880]" />
                Đăng Nhập Hệ Thống
              </button>
            )}
          </div>

          {/* Core Highlights Grid - Chuẩn Hóa Cụm 4 Chung Cư The Tropical */}
          <div className={`grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 pt-6 sm:pt-8 border-t ${
            isDark ? 'border-[#222B35]' : 'border-gray-200'
          }`}>
            <div>
              <div className="text-xl sm:text-2xl font-serif text-[#C5A880] font-bold">34 - 39 Tầng</div>
              <div className={`text-[11px] uppercase tracking-wider mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                4 Chung Cư (BS-07 đến BS-10)
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-serif text-[#C5A880] font-bold">&lt; 0.5s</div>
              <div className={`text-[11px] uppercase tracking-wider mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Tốc Độ Mở Cửa &amp; Cổng Xe
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-serif text-[#C5A880] font-bold">15 Module</div>
              <div className={`text-[11px] uppercase tracking-wider mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Hệ Thống Vận Hành AI
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-serif text-[#C5A880] font-bold">100%</div>
              <div className={`text-[11px] uppercase tracking-wider mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Sổ Hồng &amp; SPA Minh Bạch
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Khi CHƯA ĐĂNG NHẬP -> Hiển thị Video Sống Động giới thiệu Chung Cư */}
        {/* Khi ĐÃ ĐĂNG NHẬP -> Hiển thị Thẻ Phiên Cư Dân */}
        <div className="lg:col-span-5 w-full">
          {!isAuthenticated || !currentUser ? (
            /* CINEMATIC VIDEO SHOWCASE CHO KHÁCH VÃNG LAI */
            <div className={`border p-2 sm:p-2.5 rounded-none shadow-[0_20px_60px_rgba(0,0,0,0.85)] transition-all duration-300 ${
              isDark 
                ? 'border-[#C5A880]/35 bg-[#0E131B]/95 backdrop-blur-xl' 
                : 'border-gray-300 bg-white shadow-xl'
            }`}>
              {/* Video Header Bar */}
              <div className={`flex items-center justify-between px-3 py-2 border-b text-xs ${
                isDark ? 'border-[#222B35] bg-[#141B24]' : 'border-gray-100 bg-slate-50'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-rose-500 rounded-none animate-pulse"></span>
                  <span className="font-mono text-[11px] font-semibold text-[#C5A880] uppercase tracking-wider">
                    Thước Phim Thực Tế
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-gray-400">
                  <Building2 className="w-3.5 h-3.5 text-[#C5A880]" />
                  <span>The Tropical BS-07 ~ BS-10</span>
                </div>
              </div>

              {/* Responsive 16:9 Video Frame */}
              <div className="relative aspect-video w-full overflow-hidden bg-black rounded-none">
                <iframe
                  className="w-full h-full object-cover rounded-none"
                  src="https://www.youtube.com/embed/NjkWg9gaHfE?autoplay=1&mute=1&controls=1&loop=1&playlist=NjkWg9gaHfE&rel=0&modestbranding=1"
                  title="Thước phim thực tế Cụm Chung Cư The Tropical - Beverly Solari"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>

              {/* Video Footer Caption */}
              <div className={`p-3 space-y-1 text-left ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <div className="flex items-center justify-between text-xs font-serif font-bold">
                  <span className={isDark ? 'text-white' : 'text-gray-900'}>
                    Cụm 4 Chung Cư The Tropical (Beverly Solari)
                  </span>
                  <span className="text-[10px] font-mono text-[#C5A880] uppercase">Bàn Giao Thực Tế</span>
                </div>
                <p className="text-[11px] text-gray-400 font-light leading-relaxed">
                  Trải nghiệm không gian sống xanh nhiệt đới, cụm hồ bơi resort nội khu và hạ tầng vận hành ứng dụng trí tuệ nhân tạo hiện đại bậc nhất.
                </p>
              </div>
            </div>
          ) : (
            /* THẺ PHIÊN ĐĂNG NHẬP (Khi ĐÃ ĐĂNG NHẬP) */
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
          )}
        </div>
      </div>
    </section>
  );
}
