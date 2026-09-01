'use client';

import React from 'react';
import { Compass, Shield, Cpu, Sparkles } from 'lucide-react';

export default function AboutConcept() {
  return (
    <section id="concept" className="py-24 bg-white border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="max-w-3xl mb-16 space-y-4">
          <div className="text-[11px] uppercase tracking-[0.25em] text-[#9E8057] font-semibold">
            Triết Lý Thiết Kế & Không Gian
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif text-[#0D1117] leading-tight">
            Sự Giao Thoa Giữa Nghệ Thuật Kiến Trúc Tối Giản Và Vận Hành Số Hóa
          </h2>
          <div className="w-16 h-0.5 bg-[#C5A880]"></div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6 text-gray-700 font-light leading-relaxed">
            <p className="text-base sm:text-lg">
              Lấy cảm hứng từ phong cách kiến trúc đơn vị bất động sản độc bản quốc tế, 
              <strong> SKYLINE Smart Residence</strong> tập trung vào hình khối sắc nét, 
              tỷ lệ không gian mở thoáng đãng và tối ưu ánh sáng tự nhiên cho từng góc sống.
            </p>
            <p className="text-sm sm:text-base text-gray-600">
              Điểm đột phá của dự án là việc tích hợp một <strong>Lõi Trí Tuệ Nhân Tạo (AI Core)</strong> chạy ngầm 
              trong toàn bộ hạ tầng kỹ thuật. Cư dân không còn phải chờ đợi bảo dưỡng thủ công hay gặp phiền toái 
              với các thủ tục giấy tờ: mọi yêu cầu hỗ trợ, kiểm soát ra vào, hóa đơn và an ninh đều được tự động hóa 
              với độ chính xác gần như tuyệt đối.
            </p>

            <div className="grid grid-cols-2 gap-6 pt-4">
              <div className="border-l-2 border-[#C5A880] pl-4 space-y-1">
                <div className="font-serif text-lg text-[#0D1117] font-semibold">Quyền Tự Trị Căn Hộ</div>
                <div className="text-xs text-gray-500">Chủ hộ toàn quyền cấp phát FaceID và quản lý khách thuê.</div>
              </div>
              <div className="border-l-2 border-[#C5A880] pl-4 space-y-1">
                <div className="font-serif text-lg text-[#0D1117] font-semibold">An Ninh Đa Lớp</div>
                <div className="text-xs text-gray-500">Phân tầng thang máy và nhận diện biển số ALPR tự động.</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative border border-[#E2E8F0] p-3 bg-[#F8FAFC]">
              <img
                src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1000&auto=format&fit=crop&q=80"
                alt="Skyline Luxury Architecture"
                className="w-full h-[380px] object-cover"
              />
              <div className="absolute bottom-6 left-6 bg-[#0D1117]/90 text-white p-4 border border-[#C5A880]/60 max-w-xs">
                <div className="text-[10px] uppercase tracking-[0.2em] text-[#C5A880]">Không Gian Mẫu 12A05</div>
                <div className="text-sm font-serif mt-0.5">Căn hộ thông minh 2PN hướng Đông Nam</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
