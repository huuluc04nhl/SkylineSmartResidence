'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { KeyRound, X, LogOut, LayoutDashboard, UserCheck } from 'lucide-react';
import SkylineLogo from '@/components/shared/SkylineLogo';
import { useAuth } from '@/lib/authContext';

interface HeaderNavProps {
  onOpenLogin: () => void;
}

export default function HeaderNav({ onOpenLogin }: HeaderNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { currentUser, isAuthenticated, logout } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0D1117]/95 backdrop-blur-md border-b border-[#222B35]">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="group">
          <SkylineLogo variant="full" size="md" theme="dark" />
        </Link>

        {/* Desktop Menu */}
        <nav className="hidden md:flex items-center gap-8 text-[12px] uppercase tracking-[0.18em] font-medium text-gray-300">
          <a href="#concept" className="hover:text-[#C5A880] transition-colors">Tổng Quan</a>
          <a href="#floorplans" className="hover:text-[#C5A880] transition-colors">Mặt Bằng Căn Hộ</a>
          <a href="#amenities" className="hover:text-[#C5A880] transition-colors">Tiện Ích 5 Sao</a>
          <a href="#smart-tech" className="hover:text-[#C5A880] transition-colors">Lõi Công Nghệ AI</a>
        </nav>

        {/* Unified Authentication / User Profile */}
        <div className="hidden lg:flex items-center gap-3">
          {isAuthenticated && currentUser ? (
            <div className="flex items-center gap-3 bg-[#121820] border border-[#C5A880]/60 p-1.5 pl-3">
              <div className="text-left">
                <div className="text-xs font-semibold text-white truncate max-w-[140px]">
                  {currentUser.full_name}
                </div>
                <div className="text-[10px] text-[#C5A880] font-mono uppercase font-bold">
                  {currentUser.role === 'ADMIN' ? 'BQL Tòa Nhà' : `Căn ${currentUser.apartment_code || '12A05'} (${currentUser.role})`}
                </div>
              </div>

              <Link
                href="/portal"
                className="px-3 py-1.5 bg-[#C5A880] hover:bg-white text-[#0D1117] text-[11px] uppercase tracking-wider font-bold transition-colors flex items-center gap-1.5"
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
              className="px-5 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] text-[11px] uppercase tracking-[0.18em] transition-all flex items-center gap-2 font-bold shadow-sm"
            >
              <KeyRound className="w-3.5 h-3.5" />
              Đăng Nhập
            </button>
          )}
        </div>

        {/* Mobile menu trigger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-gray-300 p-2 hover:text-[#C5A880]"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : (
            <div className="space-y-1.5 w-6">
              <div className="w-6 h-0.5 bg-[#C5A880]"></div>
              <div className="w-4 h-0.5 bg-gray-300"></div>
              <div className="w-6 h-0.5 bg-gray-300"></div>
            </div>
          )}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0D1117] border-b border-[#222B35] px-6 py-6 space-y-4">
          <nav className="flex flex-col space-y-3 text-[13px] uppercase tracking-[0.15em] text-gray-300">
            <a href="#concept" onClick={() => setMobileMenuOpen(false)} className="py-1">Tổng Quan</a>
            <a href="#floorplans" onClick={() => setMobileMenuOpen(false)} className="py-1">Mặt Bằng Căn Hộ</a>
            <a href="#amenities" onClick={() => setMobileMenuOpen(false)} className="py-1">Tiện Ích 5 Sao</a>
            <a href="#smart-tech" onClick={() => setMobileMenuOpen(false)} className="py-1">Lõi Công Nghệ AI</a>
          </nav>
          <div className="pt-4 border-t border-[#222B35]">
            {isAuthenticated ? (
              <Link
                href="/portal"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 bg-[#C5A880] text-[#0D1117] text-xs uppercase tracking-wider font-bold text-center block"
              >
                Vào Bảng Điều Khiển ({currentUser?.role})
              </Link>
            ) : (
              <button
                onClick={() => { setMobileMenuOpen(false); onOpenLogin(); }}
                className="w-full py-2.5 bg-[#C5A880] text-[#0D1117] text-xs uppercase tracking-wider font-bold flex items-center justify-center gap-2"
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
