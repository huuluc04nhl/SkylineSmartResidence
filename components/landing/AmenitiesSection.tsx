'use client';

import React from 'react';
import { DEMO_FACILITIES } from '@/lib/dataStore';
import { Star, Clock, Users, Sparkles, CheckCircle2 } from 'lucide-react';

export default function AmenitiesSection() {
  return (
    <section id="amenities" className="py-20 sm:py-24 bg-[#0D1117] text-white border-b border-[#1E293B] scroll-mt-20 relative overflow-hidden">
      {/* Background glow tinh tế */}
      <div className="absolute top-1/3 left-0 w-96 h-96 bg-[#C5A880]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="max-w-3xl mb-14 sm:mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#161F2E] border border-[#C5A880]/40 rounded text-[11px] font-mono uppercase tracking-[0.2em] text-[#C5A880]">
            <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
            <span>Tiện Ích Đặc Quyền 5 Sao</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif text-white font-bold tracking-tight">
            Trải Nghiệm Thượng Lưu Tại Skyline Smart Residence
          </h2>
          <p className="text-gray-300 text-sm sm:text-base font-light leading-relaxed">
            Tổ hợp tiện ích đỉnh cao phân bổ từ Tầng 1 đến Tầng áp mái 25, vận hành tự động qua Quota sinh trắc học và hệ thống đặt chỗ thông minh.
          </p>
        </div>

        {/* Facilities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {DEMO_FACILITIES.slice(0, 6).map((facility) => (
            <div
              key={facility.id}
              className="border border-[#1E293B] hover:border-[#C5A880]/60 bg-[#0E131C] rounded-2xl overflow-hidden shadow-2xl flex flex-col justify-between group transition-all duration-300 hover:-translate-y-1"
            >
              <div>
                <div className="relative h-60 sm:h-64 overflow-hidden">
                  <img
                    src={facility.hero_image_url}
                    alt={facility.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0E131C] via-transparent to-transparent pointer-events-none" />

                  <div className="absolute top-3 right-3 bg-[#0D1117]/90 text-[#C5A880] px-2.5 py-1 text-xs font-mono font-bold flex items-center gap-1 border border-[#C5A880]/50 rounded-lg backdrop-blur-md shadow-lg">
                    <Star className="w-3.5 h-3.5 fill-[#C5A880]" />
                    <span>{facility.rating_score.toFixed(1)}</span>
                  </div>

                  <div className="absolute bottom-3 left-3 bg-[#0A0E17]/90 border border-gray-700 text-gray-200 px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest rounded backdrop-blur-md">
                    {facility.category}
                  </div>
                </div>

                <div className="p-5 sm:p-6 space-y-4">
                  <h3 className="font-serif text-lg sm:text-xl text-white font-bold group-hover:text-[#C5A880] transition-colors leading-snug">
                    {facility.name}
                  </h3>

                  <div className="space-y-2.5 text-xs text-gray-300 border-t border-[#1E293B] pt-3.5">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-gray-400">
                        <Clock className="w-3.5 h-3.5 text-[#C5A880]" /> Giờ mở cửa:
                      </span>
                      <strong className="text-white font-mono">{facility.operating_hours}</strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-gray-400">
                        <Users className="w-3.5 h-3.5 text-[#C5A880]" /> Sức chứa:
                      </span>
                      <strong className="text-white font-mono">{facility.current_occupancy} / {facility.max_capacity} người</strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Hạn mức tháng:</span>
                      <strong className="text-white font-mono">{facility.max_quota_per_month} lượt/căn</strong>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-gray-400">Biểu phí:</span>
                      <span className="text-[#C5A880] font-semibold text-right truncate max-w-[200px]">{facility.pricing}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-[#121824] border-t border-[#1E293B] flex items-center justify-center gap-2 text-[11px] font-mono uppercase tracking-wider font-semibold text-[#C5A880]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Đặt Chỗ Trực Tuyến Qua Portal Cư Dân</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
