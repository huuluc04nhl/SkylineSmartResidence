'use client';

import React from 'react';
import Link from 'next/link';
import { DEMO_FACILITIES, Facility } from '@/lib/dataStore';
import { Star, Clock, Users, Sparkles, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';
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
        ? 'bg-[#0A0E14] text-white border-[#1E293B]' 
        : 'bg-white text-gray-900 border-gray-200'
    }`}>
      {/* Background glow tinh tế */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#C5A880]/5 rounded-none blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-[#C5A880]/5 rounded-none blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 sm:mb-16">
          <div className="max-w-3xl space-y-3">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-none text-[11px] font-mono uppercase tracking-[0.2em] ${
              isDark 
                ? 'bg-[#141B24] border border-[#C5A880]/40 text-[#C5A880]' 
                : 'bg-slate-100 border border-[#C5A880]/60 text-amber-800'
            }`}>
              <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>Đặc Quyền Nghỉ Dưỡng 5 Sao</span>
            </div>
            <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-serif font-bold tracking-tight ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Hệ Thống Tiện Ích Đỉnh Cao The Tropical
            </h2>
            <p className={`text-sm sm:text-base font-light leading-relaxed ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Tổ hợp 8 đại tiện ích phân bổ từ Công viên nhiệt đới nội khu đến Tầng tiện ích chân mây. Ra vào tự động bằng FaceID và hạn mức thẻ cư dân thông minh — không cần vé giấy, không xếp hàng.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className={`p-4 border rounded-none flex items-center gap-5 shrink-0 ${
            isDark ? 'bg-[#0E131B] border-[#1E293B]' : 'bg-slate-50 border-gray-200'
          }`}>
            <div className="border-r pr-4 border-gray-700/50">
              <div className="text-xl sm:text-2xl font-serif font-bold text-[#C5A880]">08+</div>
              <div className="text-[10px] font-mono uppercase text-gray-400">Đại tiện ích</div>
            </div>
            <div className="border-r pr-4 border-gray-700/50">
              <div className="text-xl sm:text-2xl font-serif font-bold text-emerald-400">100%</div>
              <div className="text-[10px] font-mono uppercase text-gray-400">FaceID tự động</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-serif font-bold text-sky-400">24/7</div>
              <div className="text-[10px] font-mono uppercase text-gray-400">Gym & An ninh</div>
            </div>
          </div>
        </div>

        {/* Facilities Grid - Hiển thị tất cả, không bộ lọc */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {DEMO_FACILITIES.map((facility: Facility) => {
            const occupancyPct = Math.round((facility.current_occupancy / facility.max_capacity) * 100);

            return (
              <div
                key={facility.id}
                className={`rounded-none overflow-hidden shadow-xl flex flex-col justify-between group transition-all duration-300 hover:-translate-y-1 ${
                  isDark
                    ? 'border border-[#1E293B] hover:border-[#C5A880]/70 bg-[#0E131B]'
                    : 'border border-gray-200 hover:border-[#C5A880] bg-white shadow-md'
                }`}
              >
                <div>
                  {/* Image */}
                  <div className="relative h-52 overflow-hidden">
                    <img
                      src={facility.hero_image_url}
                      alt={facility.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className={`absolute inset-0 pointer-events-none ${
                      isDark 
                        ? 'bg-gradient-to-t from-[#0E131B] via-transparent to-transparent' 
                        : 'bg-gradient-to-t from-white/90 via-transparent to-transparent'
                    }`} />

                    {/* Rating */}
                    <div className="absolute top-3 right-3 bg-[#0A0E14]/90 text-[#C5A880] px-2.5 py-1 text-xs font-mono font-bold flex items-center gap-1 border border-[#C5A880]/50 rounded-none backdrop-blur-md">
                      <Star className="w-3.5 h-3.5 fill-[#C5A880]" />
                      <span>{facility.rating_score.toFixed(1)}</span>
                    </div>

                    {/* Category Tag */}
                    <div className={`absolute bottom-3 left-3 px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest rounded-none backdrop-blur-md border ${
                      isDark 
                        ? 'bg-[#0A0E14]/90 border-gray-700 text-gray-200' 
                        : 'bg-white/90 border-gray-200 text-gray-800 shadow-sm'
                    }`}>
                      {facility.category}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-5 space-y-3.5">
                    <h3 className={`font-serif text-base font-bold transition-colors leading-snug line-clamp-2 min-h-[2.8rem] ${
                      isDark 
                        ? 'text-white group-hover:text-[#C5A880]' 
                        : 'text-gray-900 group-hover:text-[#9E8057]'
                    }`}>
                      {facility.name}
                    </h3>

                    {/* Occupancy Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Đang sử dụng:</span>
                        <span className={`font-bold ${occupancyPct > 80 ? 'text-rose-400' : 'text-[#C5A880]'}`}>
                          {facility.current_occupancy}/{facility.max_capacity} ({occupancyPct}%)
                        </span>
                      </div>
                      <div className={`w-full h-1.5 overflow-hidden rounded-none ${isDark ? 'bg-[#141B24]' : 'bg-gray-200'}`}>
                        <div 
                          className={`h-full transition-all duration-500 rounded-none ${occupancyPct > 80 ? 'bg-rose-500' : 'bg-[#C5A880]'}`}
                          style={{ width: `${Math.min(100, occupancyPct)}%` }}
                        />
                      </div>
                    </div>

                    {/* Specs */}
                    <div className={`space-y-2 text-xs border-t pt-3 ${
                      isDark ? 'text-gray-300 border-[#1E293B]' : 'text-gray-600 border-gray-100'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className={`flex items-center gap-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          <Clock className="w-3.5 h-3.5 text-[#C5A880]" /> Giờ mở cửa:
                        </span>
                        <strong className={`font-mono text-[11px] ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {facility.operating_hours}
                        </strong>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className={`flex items-center gap-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          <ShieldCheck className="w-3.5 h-3.5 text-[#C5A880]" /> Hạn mức căn:
                        </span>
                        <strong className={`font-mono text-[11px] ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {facility.max_quota_per_month} lượt/tháng
                        </strong>
                      </div>

                      <div className="pt-1 border-t border-dashed border-gray-700/30">
                        <div className="text-[10px] text-gray-400 uppercase font-mono mb-0.5">Biểu phí:</div>
                        <div className="text-[#C5A880] font-semibold text-xs truncate">
                          {facility.pricing}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer CTA */}
                <Link
                  href={facilityPortalUrl}
                  className={`p-3.5 border-t flex items-center justify-center gap-2 text-[11px] font-mono uppercase tracking-wider font-semibold transition-colors cursor-pointer group-hover:bg-[#C5A880] group-hover:text-[#0A0E14] ${
                    isDark 
                      ? 'bg-[#141B24] border-[#1E293B] text-[#C5A880]' 
                      : 'bg-slate-50 border-gray-100 text-amber-800'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 group-hover:text-[#0A0E14]" />
                  <span>Đặt Chỗ / Đăng Ký Quota</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            );
          })}
        </div>

        {/* FaceID Banner */}
        <div className={`mt-14 p-6 sm:p-8 border rounded-none flex flex-col md:flex-row items-center justify-between gap-6 ${
          isDark 
            ? 'bg-[#0E131B] border-[#C5A880]/30' 
            : 'bg-amber-50/50 border-[#C5A880]/50'
        }`}>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[#C5A880]/15 border border-[#C5A880]/40 flex items-center justify-center text-[#C5A880] shrink-0 rounded-none">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className={`text-base sm:text-lg font-serif font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Kiểm Soát Ra Vào Sinh Trắc Học — Không Cần Vé Giấy
              </h4>
              <p className={`text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Cư dân 4 chung cư The Tropical chỉ cần quét FaceID tại cửa kiểm soát hoặc mở mã QR trên ứng dụng Skyline Resident. Không xếp hàng, tính riêng tư và an toàn tuyệt đối.
              </p>
            </div>
          </div>

          <Link
            href={facilityPortalUrl}
            className="px-6 py-3 bg-[#C5A880] hover:bg-white text-[#0A0E14] font-mono text-xs uppercase tracking-widest font-bold transition-colors whitespace-nowrap rounded-none shrink-0 shadow-lg"
          >
            Quản Lý Thẻ & Quota Căn Hộ
          </Link>
        </div>
      </div>
    </section>
  );
}
