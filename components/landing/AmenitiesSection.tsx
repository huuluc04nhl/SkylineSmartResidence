'use client';

import React from 'react';
import Link from 'next/link';
import { DEMO_FACILITIES } from '@/lib/dataStore';
import { Star, Clock, Users, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { useTheme } from '@/lib/themeContext';
import { useAuth } from '@/lib/authContext';

export default function AmenitiesSection() {
  const { theme } = useTheme();
  const { currentUser, isAuthenticated } = useAuth();
  const isDark = theme === 'dark';

  const facilityPortalUrl = isAuthenticated
    ? currentUser?.role === 'ADMIN'
      ? '/portal?tab=admin-facilities'
      : '/portal?tab=resident-facilities'
    : '/portal';

  return (
    <section id="amenities" className={`py-20 sm:py-24 border-b scroll-mt-20 relative overflow-hidden transition-colors duration-300 ${
      isDark 
        ? 'bg-[#0D1117] text-white border-[#1E293B]' 
        : 'bg-white text-gray-900 border-gray-200'
    }`}>
      {/* Background glow tinh tế */}
      <div className="absolute top-1/3 left-0 w-96 h-96 bg-[#C5A880]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="max-w-3xl mb-14 sm:mb-16 space-y-3">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-none text-[11px] font-mono uppercase tracking-[0.2em] ${
            isDark 
              ? 'bg-[#161F2E] border border-[#C5A880]/40 text-[#C5A880]' 
              : 'bg-slate-100 border border-[#C5A880]/60 text-amber-800'
          }`}>
            <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
            <span>Tiện Ích Đặc Quyền 5 Sao</span>
          </div>
          <h2 className={`text-3xl sm:text-4xl font-serif font-bold tracking-tight ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Trải Nghiệm Thượng Lưu Tại Skyline Smart Residence
          </h2>
          <p className={`text-sm sm:text-base font-light leading-relaxed ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Tổ hợp tiện ích đỉnh cao phân bổ từ Tầng 1 đến Tầng áp mái 25, vận hành tự động qua Quota sinh trắc học và hệ thống đặt chỗ thông minh.
          </p>
        </div>

        {/* Facilities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {DEMO_FACILITIES.slice(0, 6).map((facility) => (
            <div
              key={facility.id}
              className={`rounded-none overflow-hidden shadow-2xl flex flex-col justify-between group transition-all duration-300 hover:-translate-y-1 ${
                isDark
                  ? 'border border-[#1E293B] hover:border-[#C5A880]/60 bg-[#0E131C]'
                  : 'border border-gray-200 hover:border-[#C5A880] bg-white shadow-lg'
              }`}
            >
              <div>
                <div className="relative h-60 sm:h-64 overflow-hidden">
                  <img
                    src={facility.hero_image_url}
                    alt={facility.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className={`absolute inset-0 pointer-events-none ${
                    isDark 
                      ? 'bg-gradient-to-t from-[#0E131C] via-transparent to-transparent' 
                      : 'bg-gradient-to-t from-white/90 via-transparent to-transparent'
                  }`} />

                  <div className="absolute top-3 right-3 bg-[#0D1117]/90 text-[#C5A880] px-2.5 py-1 text-xs font-mono font-bold flex items-center gap-1 border border-[#C5A880]/50 rounded-none backdrop-blur-md shadow-lg">
                    <Star className="w-3.5 h-3.5 fill-[#C5A880]" />
                    <span>{facility.rating_score.toFixed(1)}</span>
                  </div>

                  <div className={`absolute bottom-3 left-3 px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest rounded backdrop-blur-md border ${
                    isDark 
                      ? 'bg-[#0A0E17]/90 border-gray-700 text-gray-200' 
                      : 'bg-white/90 border-gray-200 text-gray-800 shadow-sm'
                  }`}>
                    {facility.category}
                  </div>
                </div>

                <div className="p-5 sm:p-6 space-y-4">
                  <h3 className={`font-serif text-lg sm:text-xl font-bold transition-colors leading-snug ${
                    isDark 
                      ? 'text-white group-hover:text-[#C5A880]' 
                      : 'text-gray-900 group-hover:text-[#9E8057]'
                  }`}>
                    {facility.name}
                  </h3>

                  <div className={`space-y-2.5 text-xs border-t pt-3.5 ${
                    isDark ? 'text-gray-300 border-[#1E293B]' : 'text-gray-600 border-gray-100'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className={`flex items-center gap-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        <Clock className="w-3.5 h-3.5 text-[#C5A880]" /> Giờ mở cửa:
                      </span>
                      <strong className={`font-mono ${isDark ? 'text-white' : 'text-gray-900'}`}>{facility.operating_hours}</strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className={`flex items-center gap-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        <Users className="w-3.5 h-3.5 text-[#C5A880]" /> Sức chứa:
                      </span>
                      <strong className={`font-mono ${isDark ? 'text-white' : 'text-gray-900'}`}>{facility.current_occupancy} / {facility.max_capacity} người</strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Hạn mức tháng:</span>
                      <strong className={`font-mono ${isDark ? 'text-white' : 'text-gray-900'}`}>{facility.max_quota_per_month} lượt/căn</strong>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Biểu phí:</span>
                      <span className="text-[#C5A880] font-semibold text-right truncate max-w-[200px]">{facility.pricing}</span>
                    </div>
                  </div>
                </div>
              </div>

              <Link
                href={facilityPortalUrl}
                className={`p-4 border-t flex items-center justify-center gap-2 text-[11px] font-mono uppercase tracking-wider font-semibold transition-colors cursor-pointer group-hover:bg-[#C5A880] group-hover:text-[#0D1117] ${
                  isDark 
                    ? 'bg-[#121824] border-[#1E293B] text-[#C5A880]' 
                    : 'bg-slate-50 border-gray-100 text-amber-800'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 group-hover:text-[#0D1117]" />
                <span>Đặt Chỗ Tiện Ích Trực Tuyến</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
