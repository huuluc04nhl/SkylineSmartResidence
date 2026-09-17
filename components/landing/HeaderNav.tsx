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
        <nav className={`hidden md:flex items-center gap-7 lg:gap-8 text-[12px] uppercase tracking-[0.18em] font-medium transition-colors ${
          isDark ? 'text-gray-300' : 'text-gray-700'
        }`}>
          <a href="#concept" className={`transition-colors ${isDark ? 'hover:text-[#C5A880]' : 'hover:text-[#9E8057]'}`}>Tổng Quan</a>
          <a href="#floorplans" className={`transition-colors ${isDark ? 'hover:text-[#C5A880]' : 'hover:text-[#9E8057]'}`}>Mặt Bằng Căn Hộ</a>
          <a href="#amenities" className={`transition-colors ${isDark ? 'hover:text-[#C5A880]' : 'hover:text-[#9E8057]'}`}>Tiện Ích 5 Sao</a>
          <a href="#smart-tech" className={`transition-colors ${isDark ? 'hover:text-[#C5A880]' : 'hover:text-[#9E8057]'}`}>Lõi Công Nghệ AI</a>
        </nav>

        {/* Action Controls & Authentication */}
        <div className="hidden lg:flex items-center gap-3">
          {/* NÚT CHUYỂN ĐỔI GIAO DIỆN SÁNG / TỐI */}
          <button
            onClick={toggleTheme}
            type="button"
            className={`p-2 px-3 rounded-lg border transition-all flex items-center gap-2 text-xs font-mono cursor-pointer shadow-sm ${
              isDark
                ? 'bg-[#161F2E] border-[#C5A880]/40 text-[#C5A880] hover:bg-[#1E293B] hover:border-[#C5A880]'
                : 'bg-slate-100 border-gray-300 text-amber-700 hover:bg-slate-200 hover:border-amber-600'
            }`}
            title={isDark ? 'Chuyển sang Giao diện Sáng' : 'Chuyển sang Giao diện Tối'}
          >
            {isDark ? (
              <>
                <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
                <span className="text-[11px] font-semibold">Chế độ Sáng</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-slate-700" />
                <span className="text-[11px] font-semibold text-slate-700">Chế độ Tối</span>
              </>
            )}
          </button>

          {isAuthenticated && currentUser ? (
            <div className={`flex items-center gap-3 p-1.5 pl-3 border rounded ${
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
                className="px-3 py-1.5 bg-[#C5A880] hover:bg-white text-[#0D1117] text-[11px] uppercase tracking-wider font-bold transition-colors flex items-center gap-1.5 rounded"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Vào Bảng Điều Khiển
              </Link>

              <button
                onClick={logout}
                className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
                title="Đăng xuất"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="px-5 py-2 bg-[#C5A880] hover:bg-[#D4AF37] text-[#0D1117] text-[11px] uppercase tracking-[0.18em] transition-all flex items-center gap-2 font-bold shadow-md rounded cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              Đăng Nhập
            </button>
          )}
        </div>

        {/* Mobile controls: Theme toggle + menu trigger */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={toggleTheme}
            type="button"
            className={`p-2 rounded-lg border transition-colors ${
              isDark
                ? 'bg-[#161F2E] border-[#C5A880]/40 text-amber-400'
                : 'bg-gray-100 border-gray-300 text-slate-700'
            }`}
            title="Đổi giao diện Sáng / Tối"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`p-2 transition-colors ${isDark ? 'text-gray-300 hover:text-[#C5A880]' : 'text-gray-700 hover:text-[#9E8057]'}`}
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
                className="w-full py-2.5 bg-[#C5A880] text-[#0D1117] text-xs uppercase tracking-wider font-bold text-center block rounded"
              >
                Vào Bảng Điều Khiển ({currentUser?.role})
              </Link>
            ) : (
              <button
                onClick={() => { setMobileMenuOpen(false); onOpenLogin(); }}
                className="w-full py-2.5 bg-[#C5A880] text-[#0D1117] text-xs uppercase tracking-wider font-bold flex items-center justify-center gap-2 rounded shadow-md"
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
