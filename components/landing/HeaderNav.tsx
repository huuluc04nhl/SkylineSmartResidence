'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { KeyRound, X, LogOut, LayoutDashboard, UserCheck, Sun, Moon } from 'lucide-react';
import SkylineLogo from '@/components/shared/SkylineLogo';
import { useAuth } from '@/lib/authContext';
import { useTheme } from '@/lib/themeContext';

interface HeaderNavProps {
  onOpenLogin: () => void;
}

export default function HeaderNav({ onOpenLogin }: HeaderNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { currentUser, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const isDark = theme === 'dark';

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b transition-colors duration-300 ${
      isDark 
        ? 'bg-[#0D1117]/95 border-[#222B35] text-white' 
        : 'bg-white/95 border-gray-200 text-gray-800 shadow-sm'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="group flex-shrink-0">
          <SkylineLogo variant="full" size="md" theme={isDark ? 'dark' : 'light'} />
        </Link>

        {/* Desktop Menu */}
        <nav className={`hidden md:flex items-center gap-6 lg:gap-8 text-[12px] uppercase tracking-[0.18em] font-medium transition-colors whitespace-nowrap ${
          isDark ? 'text-gray-300' : 'text-gray-700'
        }`}>
          <a href="#concept" className={`whitespace-nowrap transition-colors ${isDark ? 'hover:text-[#C5A880]' : 'hover:text-[#9E8057]'}`}>Tổng Quan</a>
          <a href="#floorplans" className={`whitespace-nowrap transition-colors ${isDark ? 'hover:text-[#C5A880]' : 'hover:text-[#9E8057]'}`}>Mặt Bằng Căn Hộ</a>
          <a href="#amenities" className={`whitespace-nowrap transition-colors ${isDark ? 'hover:text-[#C5A880]' : 'hover:text-[#9E8057]'}`}>Tiện Ích 5 Sao</a>
          <a href="#smart-tech" className={`whitespace-nowrap transition-colors ${isDark ? 'hover:text-[#C5A880]' : 'hover:text-[#9E8057]'}`}>Lõi Công Nghệ AI</a>
        </nav>

        {/* Action Controls & Authentication */}
        <div className="hidden lg:flex items-center gap-3">
          {/* CÔNG TẮC BẬT SÁNG / TỐI (TOGGLE SWITCH - KHÔNG BORDER-RADIUS) */}
          <button
            onClick={toggleTheme}
            type="button"
            role="switch"
            aria-checked={!isDark}
            aria-label={isDark ? 'Bật Chế độ Sáng' : 'Bật Chế độ Tối'}
            className={`relative inline-flex items-center h-8 w-[62px] border cursor-pointer select-none transition-colors duration-200 rounded-none shrink-0 ${
              isDark
                ? 'bg-[#121820] border-[#C5A880]/60'
                : 'bg-slate-200 border-gray-400'
            }`}
            title={isDark ? 'Bật Chế độ Sáng' : 'Bật Chế độ Tối'}
          >
            {/* 2 Icon cố định bên trong track */}
            <span className="w-full flex items-center justify-between px-2 pointer-events-none">
              <Sun className={`w-3.5 h-3.5 ${isDark ? 'text-gray-500' : 'text-amber-500'}`} />
              <Moon className={`w-3.5 h-3.5 ${isDark ? 'text-[#C5A880]' : 'text-slate-400'}`} />
            </span>

            {/* Khối trượt sắc nét (Thumb) - KHÔNG BORDER-RADIUS */}
            <span
              className={`absolute top-[2px] bottom-[2px] w-[26px] flex items-center justify-center transition-all duration-300 ease-in-out rounded-none shadow-sm ${
                isDark
                  ? 'left-[32px] bg-[#C5A880] text-[#0D1117]'
                  : 'left-[2px] bg-white text-amber-600 border border-gray-300'
              }`}
            >
              {isDark ? (
                <Moon className="w-3.5 h-3.5 fill-current" />
              ) : (
                <Sun className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              )}
            </span>
          </button>

          {isAuthenticated && currentUser ? (
            <div className={`flex items-center gap-3 p-1.5 pl-3 border rounded-none ${
              isDark ? 'bg-[#121820] border-[#C5A880]/60' : 'bg-slate-50 border-gray-300'
            }`}>
              <div className="text-left">
                <div className={`text-xs font-semibold truncate max-w-[130px] ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {currentUser.full_name}
                </div>
                <div className="text-[10px] text-[#C5A880] font-mono uppercase font-bold">
                  {currentUser.role === 'ADMIN' ? 'BQL Tòa Nhà' : `Căn ${currentUser.apartment_code || '12A05'} (${currentUser.role})`}
                </div>
              </div>

              <Link
                href="/portal"
                className="px-3 py-1.5 bg-[#C5A880] hover:bg-white text-[#0D1117] text-[11px] uppercase tracking-wider font-bold transition-colors flex items-center gap-1.5 rounded-none"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Vào Bảng Điều Khiển
              </Link>

              <button
                onClick={logout}
                className="p-1.5 text-gray-400 hover:text-red-400 transition-colors rounded-none"
                title="Đăng xuất"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="px-5 py-2 bg-[#C5A880] hover:bg-[#D4AF37] text-[#0D1117] text-[11px] uppercase tracking-[0.18em] transition-all flex items-center gap-2 font-bold shadow-md rounded-none cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              Đăng Nhập
            </button>
          )}
        </div>

        {/* Mobile controls: Theme toggle switch + menu trigger */}
        <div className="flex items-center gap-2 md:hidden">
          {/* Mobile Theme Toggle Switch (Không border-radius) */}
          <button
            onClick={toggleTheme}
            type="button"
            role="switch"
            aria-checked={!isDark}
            aria-label={isDark ? 'Bật Chế độ Sáng' : 'Bật Chế độ Tối'}
            className={`relative inline-flex items-center h-7 w-[52px] border cursor-pointer select-none transition-colors duration-200 rounded-none shrink-0 ${
              isDark
                ? 'bg-[#121820] border-[#C5A880]/60'
                : 'bg-slate-200 border-gray-400'
            }`}
            title={isDark ? 'Bật Chế độ Sáng' : 'Bật Chế độ Tối'}
          >
            <span className="w-full flex items-center justify-between px-1.5 pointer-events-none">
              <Sun className={`w-3 h-3 ${isDark ? 'text-gray-500' : 'text-amber-500'}`} />
              <Moon className={`w-3 h-3 ${isDark ? 'text-[#C5A880]' : 'text-slate-400'}`} />
            </span>
            <span
              className={`absolute top-[2px] bottom-[2px] w-[22px] flex items-center justify-center transition-all duration-300 ease-in-out rounded-none ${
                isDark
                  ? 'left-[26px] bg-[#C5A880] text-[#0D1117]'
                  : 'left-[2px] bg-white text-amber-600 border border-gray-300'
              }`}
            >
              {isDark ? (
                <Moon className="w-2.5 h-2.5 fill-current" />
              ) : (
                <Sun className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
              )}
            </span>
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`p-2 transition-colors rounded-none ${isDark ? 'text-gray-300 hover:text-[#C5A880]' : 'text-gray-700 hover:text-[#9E8057]'}`}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : (
              <div className="space-y-1.5 w-6">
                <div className="w-6 h-0.5 bg-[#C5A880]"></div>
                <div className={`w-4 h-0.5 ${isDark ? 'bg-gray-300' : 'bg-gray-600'}`}></div>
                <div className={`w-6 h-0.5 ${isDark ? 'bg-gray-300' : 'bg-gray-600'}`}></div>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className={`md:hidden border-b px-6 py-6 space-y-4 transition-colors ${
          isDark ? 'bg-[#0D1117] border-[#222B35]' : 'bg-white border-gray-200 shadow-xl'
        }`}>
          <nav className={`flex flex-col space-y-3 text-[13px] uppercase tracking-[0.15em] font-medium ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>
            <a href="#concept" onClick={() => setMobileMenuOpen(false)} className="py-1">Tổng Quan</a>
            <a href="#floorplans" onClick={() => setMobileMenuOpen(false)} className="py-1">Mặt Bằng Căn Hộ</a>
            <a href="#amenities" onClick={() => setMobileMenuOpen(false)} className="py-1">Tiện Ích 5 Sao</a>
            <a href="#smart-tech" onClick={() => setMobileMenuOpen(false)} className="py-1">Lõi Công Nghệ AI</a>
          </nav>

          <div className={`pt-4 border-t ${isDark ? 'border-[#222B35]' : 'border-gray-200'}`}>
            {isAuthenticated ? (
              <Link
                href="/portal"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 bg-[#C5A880] text-[#0D1117] text-xs uppercase tracking-wider font-bold text-center block rounded-none"
              >
                Vào Bảng Điều Khiển ({currentUser?.role})
              </Link>
            ) : (
              <button
                onClick={() => { setMobileMenuOpen(false); onOpenLogin(); }}
                className="w-full py-2.5 bg-[#C5A880] text-[#0D1117] text-xs uppercase tracking-wider font-bold flex items-center justify-center gap-2 rounded-none shadow-md"
              >
                <KeyRound className="w-4 h-4" />
                Đăng Nhập Hệ Thống
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
