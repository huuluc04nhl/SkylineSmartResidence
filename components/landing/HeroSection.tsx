'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowDown, Sparkles, Building, ShieldCheck, LayoutDashboard, KeyRound } from 'lucide-react';
import { UserRole } from '@/lib/dataStore';
import { useAuth } from '@/lib/authContext';

interface HeroSectionProps {
  onOpenLogin: (role?: UserRole) => void;
}

export default function HeroSection({ onOpenLogin }: HeroSectionProps) {
  const { currentUser, isAuthenticated } = useAuth();

  return (
    <section className="relative min-h-[92vh] flex items-center bg-[#0D1117] text-white pt-24 pb-16 overflow-hidden">
      {/* Background Architectural Texture with subtle overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center opacity-30"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1920&auto=format&fit=crop&q=80')`,
        }}
      ></div>
      <div className="absolute inset-0 z-0 bg-gradient-to-r from-[#0D1117] via-[#0D1117]/85 to-transparent"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column: Architectural Editorial Text */}
        <div className="lg:col-span-8 space-y-8">
          <div className="inline-flex items-center gap-2.5 px-3 py-1.5 border border-[#C5A880]/40 text-[#C5A880] text-[11px] uppercase tracking-[0.25em] font-medium bg-[#0D1117]/80">
            <Sparkles className="w-3.5 h-3.5" />
            Kiến Trúc Đương Đại Tích Hợp Lõi AI
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-normal leading-[1.15] text-[#FAFAFA] tracking-tight">
            Nơi Chuẩn Mực Kiến Trúc Gặp Gỡ <br />
            <span className="italic text-[#C5A880] font-light">Trí Tuệ Nhân Tạo 4.0</span>
          </h1>

          <p className="text-gray-300 font-light text-base lg:text-lg max-w-2xl leading-relaxed">
            Dự án căn hộ hạng sang <strong>SKYLINE Smart Residence</strong> kiến tạo chuẩn sống tự động hóa 
            hoàn chỉnh: Định danh sinh trắc học FaceID &lt;0.5s, giám sát an ninh Vision AI, 
            trợ lý ảo AI Concierge 24/7 và hệ thống dự báo bảo trì thông minh.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <a
              href="#floorplans"
              className="hendon-btn-gold text-[12px]"
            >
              Xem Mặt Bằng Căn Hộ
            </a>

            {isAuthenticated ? (
              <Link
                href="/portal"
                className="hendon-btn-outline text-white border-[#C5A880] text-[#C5A880] hover:bg-[#C5A880] hover:text-[#0D1117] text-[12px] flex items-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                Vào Bảng Điều Khiển ({currentUser?.role})
              </Link>
            ) : (
              <button
                onClick={() => onOpenLogin()}
                className="hendon-btn-outline text-white border-gray-500 hover:border-white text-[12px] flex items-center gap-2"
              >
                <KeyRound className="w-4 h-4 text-[#C5A880]" />
                Đăng Nhập Hệ Thống
              </button>
            )}
          </div>

          {/* Core Highlights Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-8 border-t border-[#222B35]">
            <div>
              <div className="text-2xl font-serif text-[#C5A880]">25 Tầng</div>
              <div className="text-[11px] uppercase tracking-wider text-gray-400 mt-1">2 Tháp Sapphire & Diamond</div>
            </div>
            <div>
              <div className="text-2xl font-serif text-[#C5A880]">&lt; 0.5s</div>
              <div className="text-[11px] uppercase tracking-wider text-gray-400 mt-1">Tốc Độ FaceID / ALPR</div>
            </div>
            <div>
              <div className="text-2xl font-serif text-[#C5A880]">15 Module</div>
              <div className="text-[11px] uppercase tracking-wider text-gray-400 mt-1">Hệ Thống Vận Hành AI</div>
            </div>
            <div>
              <div className="text-2xl font-serif text-[#C5A880]">100%</div>
              <div className="text-[11px] uppercase tracking-wider text-gray-400 mt-1">Sổ Hồng & SPA Minh Bạch</div>
            </div>
          </div>
        </div>

        {/* Right Column: Architectural Visual Card */}
        <div className="lg:col-span-4 hidden lg:block">
          <div className="border border-[#2D3748] bg-[#121820] p-6 space-y-4 shadow-2xl">
            <div className="text-[11px] uppercase tracking-[0.2em] text-[#C5A880] font-semibold border-b border-[#222B35] pb-3 flex items-center justify-between">
              <span>Định Danh Tòa Nhà</span>
              <span className="text-gray-400 font-mono">ID: SKY-01</span>
            </div>
            
            <div className="space-y-3 text-sm text-gray-300">
              <div className="flex justify-between py-1.5 border-b border-[#1E2631]">
                <span className="text-gray-400">Vị Trí:</span>
                <span className="font-medium text-white">Đại lộ Skyline City</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#1E2631]">
                <span className="text-gray-400">Loại hình căn hộ:</span>
                <span className="font-medium text-white">Studio, 1PN, 2PN, 3PN, Duplex</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#1E2631]">
                <span className="text-gray-400">Kiểm soát an ninh:</span>
                <span className="font-medium text-[#C5A880]">Vision AI CCTV 24/7</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-gray-400">Quản lý bãi đỗ:</span>
                <span className="font-medium text-white">Camera ALPR & Barrier</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => onOpenLogin('OWNER')}
                className="w-full py-3 bg-[#1C2533] border border-[#C5A880]/50 text-[#C5A880] text-[11px] uppercase tracking-[0.18em] font-semibold hover:bg-[#C5A880] hover:text-[#0D1117] transition-all flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                Vào Không Gian Căn Hộ 12A05
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
