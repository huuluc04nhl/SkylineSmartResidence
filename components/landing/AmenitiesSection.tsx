'use client';

import React from 'react';
import { DEMO_FACILITIES } from '@/lib/dataStore';
import { Star, Clock, Users, ShieldCheck } from 'lucide-react';

export default function AmenitiesSection() {
  return (
    <section id="amenities" className="py-24 bg-white border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="max-w-3xl mb-16 space-y-4">
          <div className="text-[11px] uppercase tracking-[0.25em] text-[#9E8057] font-semibold">
            Tiện Ích Đặc Quyền 5 Sao
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif text-[#0D1117]">
            Trải Nghiệm Thượng Lưu Tại Skyline Residence
          </h2>
          <p className="text-gray-600 text-sm sm:text-base font-light">
            Không gian thư giãn đẳng cấp quốc tế được quản lý thông minh qua hệ thống Quota và đặt chỗ tự động.
          </p>
        </div>

        {/* Facilities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {DEMO_FACILITIES.map((facility) => (
            <div
              key={facility.id}
              className="border border-[#E2E8F0] bg-[#FAFAFA] flex flex-col justify-between group hover:border-[#C5A880] transition-colors"
            >
              <div>
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={facility.hero_image_url}
                    alt={facility.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 bg-[#0D1117]/90 text-[#C5A880] px-2.5 py-1 text-xs font-semibold flex items-center gap-1 border border-[#C5A880]/40">
                    <Star className="w-3.5 h-3.5 fill-[#C5A880]" />
                    {facility.rating_score.toFixed(1)} / 5.0
                  </div>
                  <div className="absolute bottom-3 left-3 bg-[#0D1117]/85 text-white px-2 py-0.5 text-[10px] uppercase tracking-widest">
                    {facility.category}
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <h3 className="font-serif text-xl text-[#0D1117] font-bold">
                    {facility.name}
                  </h3>

                  <div className="space-y-2 text-xs text-gray-600 border-t border-gray-200 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-gray-500">
                        <Clock className="w-3.5 h-3.5 text-[#9E8057]" /> Giờ mở cửa:
                      </span>
                      <strong className="text-gray-900">{facility.operating_hours}</strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-gray-500">
                        <Users className="w-3.5 h-3.5 text-[#9E8057]" /> Sức chứa:
                      </span>
                      <strong className="text-gray-900">{facility.current_occupancy} / {facility.max_capacity} người</strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Hạn mức tháng:</span>
                      <strong className="text-gray-900">{facility.max_quota_per_month} lượt/căn</strong>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-gray-500">Biểu phí:</span>
                      <span className="text-[#9E8057] font-semibold">{facility.pricing}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 pt-0">
                <div className="w-full py-2 bg-gray-100 border border-gray-300 text-center text-[11px] uppercase tracking-wider font-semibold text-gray-700">
                  Tích Hợp Trong Cổng Cư Dân
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
