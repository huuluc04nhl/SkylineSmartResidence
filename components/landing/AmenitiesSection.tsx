'use client';

import React from 'react';
import { DEMO_FACILITIES, Facility } from '@/lib/dataStore';
import { Star, Clock, Sparkles, ArrowRight } from 'lucide-react';
import { useTheme } from '@/lib/themeContext';

export default function AmenitiesSection() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <section id="amenities" className={`py-20 sm:py-24 border-b scroll-mt-20 relative overflow-hidden transition-colors duration-300 ${
      isDark 
        ? 'bg-[#0A0E14] text-white border-[#1E293B]' 
        : 'bg-white text-gray-900 border-gray-200'
    }`}>
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#C5A880]/4 rounded-none blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <div className="max-w-3xl mb-14 sm:mb-16 space-y-4">
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
            Hệ Thống Tiện Ích Đỉnh Cao<br />
            <span className="italic font-light text-[#C5A880]">The Tropical Beverly Solari</span>
          </h2>

          <p className={`text-sm sm:text-base font-light leading-relaxed max-w-2xl ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Từ hồ bơi vô cực tầng chân mây đến khu BBQ panoramic — toàn bộ 8 đại tiện ích vận hành tự động 24/7, ra vào bằng FaceID sinh trắc học, không cần vé giấy.
          </p>
        </div>

        {/* Facilities Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {DEMO_FACILITIES.map((facility: Facility) => (
            <div
              key={facility.id}
              className={`rounded-none overflow-hidden group transition-all duration-300 hover:-translate-y-1 ${
                isDark
                  ? 'border border-[#1E293B] hover:border-[#C5A880]/50 bg-[#0E131B] shadow-xl'
                  : 'border border-gray-200 hover:border-[#C5A880]/60 bg-white shadow-md hover:shadow-xl'
              }`}
            >
              {/* Image */}
              <div className="relative h-52 overflow-hidden">
                <img
                  src={facility.hero_image_url}
                  alt={facility.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className={`absolute inset-0 pointer-events-none ${
                  isDark 
                    ? 'bg-gradient-to-t from-[#0E131B] via-[#0E131B]/20 to-transparent' 
                    : 'bg-gradient-to-t from-black/50 via-transparent to-transparent'
                }`} />

                {/* Rating badge */}
                <div className="absolute top-3 right-3 bg-black/75 text-[#C5A880] px-2 py-1 text-[11px] font-mono font-bold flex items-center gap-1 rounded-none backdrop-blur-sm border border-[#C5A880]/40">
                  <Star className="w-3 h-3 fill-[#C5A880]" />
                  {facility.rating_score.toFixed(1)}
                </div>

                {/* Category badge */}
                <div className="absolute bottom-3 left-3 px-2 py-1 text-[10px] font-mono uppercase tracking-wider rounded-none bg-black/70 backdrop-blur-sm text-gray-200 border border-white/10">
                  {facility.category}
                </div>
              </div>

              {/* Info */}
              <div className="p-5 space-y-3">
                <h3 className={`font-serif text-base font-bold leading-snug line-clamp-2 min-h-[2.75rem] transition-colors ${
                  isDark 
                    ? 'text-white group-hover:text-[#C5A880]' 
                    : 'text-gray-900 group-hover:text-[#9E8057]'
                }`}>
                  {facility.name}
                </h3>

                <div className={`flex flex-col gap-1.5 text-xs border-t pt-3 ${
                  isDark ? 'border-[#1E293B]' : 'border-gray-100'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={`flex items-center gap-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      <Clock className="w-3.5 h-3.5 text-[#C5A880]" />
                      Giờ mở cửa
                    </span>
                    <span className={`font-mono font-semibold text-[11px] ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {facility.operating_hours}
                    </span>
                  </div>

                  <div className={`text-[11px] font-light pt-1 border-t border-dashed ${
                    isDark ? 'border-gray-800 text-gray-400' : 'border-gray-100 text-gray-500'
                  }`}>
                    <span className="text-[#C5A880] font-medium">{facility.pricing}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA — một nút duy nhất, đơn giản */}
        <div className={`mt-14 flex flex-col sm:flex-row items-center justify-between gap-5 p-6 border rounded-none ${
          isDark ? 'bg-[#0E131B] border-[#1E293B]' : 'bg-slate-50 border-gray-200'
        }`}>
          <p className={`text-sm font-light max-w-xl leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Cư dân 4 chung cư <strong className={isDark ? 'text-white' : 'text-gray-900'}>The Tropical (BS-07 → BS-10)</strong> được sử dụng tất cả tiện ích thông qua hạn mức thẻ cư dân thông minh và quét FaceID tự động tại cổng vào.
          </p>

          <a
            href="#floorplans"
            className="shrink-0 px-6 py-3 bg-[#C5A880] hover:bg-white text-[#0A0E14] font-mono text-xs uppercase tracking-widest font-bold transition-colors rounded-none shadow-lg flex items-center gap-2"
          >
            Khám Phá Căn Hộ
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
