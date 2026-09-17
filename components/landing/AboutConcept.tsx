'use client';

import React from 'react';
import { Compass, Shield, Cpu, Sparkles } from 'lucide-react';

export default function AboutConcept() {
  return (
    <section id="concept" className="py-20 sm:py-24 bg-[#0D1117] text-white border-b border-[#1E293B] scroll-mt-20 relative overflow-hidden">
      {/* Background glow tinh tế */}
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-[#C5A880]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="max-w-3xl mb-14 sm:mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#161F2E] border border-[#C5A880]/40 rounded text-[11px] font-mono uppercase tracking-[0.2em] text-[#C5A880]">
            <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
            <span>Triết Lý Thiết Kế &amp; Không Gian</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif text-white leading-tight font-bold tracking-tight">
            Sự Giao Thoa Giữa Nghệ Thuật Kiến Trúc Tối Giản Và Vận Hành Số Hóa
          </h2>
          <div className="w-16 h-0.5 bg-[#C5A880]"></div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <div className="lg:col-span-6 space-y-6 text-gray-300 font-light leading-relaxed">
            <p className="text-base sm:text-lg">
              Lấy cảm hứng từ phong cách kiến trúc căn hộ cao cấp quốc tế bên bờ sông, 
              <strong className="text-white"> SKYLINE Smart Residence</strong> tập trung vào hình khối sắc nét, 
              tỷ lệ không gian mở thoáng đãng và đón trọn ánh sáng tự nhiên cùng gió sông mát lành.
            </p>
            <p className="text-sm sm:text-base text-gray-400">
              Điểm đột phá của dự án là việc tích hợp một <strong className="text-[#C5A880]">Lõi Trí Tuệ Nhân Tạo (AI Core)</strong> chạy ngầm 
              trong toàn bộ hạ tầng kỹ thuật. Cư dân không còn phải chờ đợi bảo dưỡng thủ công hay gặp phiền toái 
              với các thủ tục giấy tờ: mọi yêu cầu hỗ trợ, kiểm soát ra vào, hóa đơn và an ninh đều được tự động hóa 
              với độ chính xác gần như tuyệt đối.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-[#121824] border border-[#1E293B] rounded-xl border-l-4 border-l-[#C5A880] space-y-1 shadow-lg">
                <div className="font-serif text-base text-white font-semibold">Quyền Tự Trị Căn Hộ</div>
                <div className="text-xs text-gray-400 font-light">Chủ hộ toàn quyền cấp phát FaceID và quản lý thành viên cư trú.</div>
              </div>
              <div className="p-4 bg-[#121824] border border-[#1E293B] rounded-xl border-l-4 border-l-[#C5A880] space-y-1 shadow-lg">
                <div className="font-serif text-base text-white font-semibold">An Ninh Đa Lớp 24/7</div>
                <div className="text-xs text-gray-400 font-light">Phân tầng thang máy bảo mật và camera Vision AI quét biển số xe tự động.</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative border border-[#C5A880]/40 p-2 sm:p-3 bg-[#121824] rounded-2xl shadow-2xl overflow-hidden group">
              <img
                src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80"
                alt="Skyline Luxury Architecture"
                className="w-full h-[360px] sm:h-[400px] object-cover rounded-xl transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E17]/90 via-transparent to-transparent pointer-events-none rounded-xl" />

              <div className="absolute bottom-5 left-5 right-5 sm:right-auto bg-[#0A0E17]/95 text-white p-4 border border-[#C5A880]/60 rounded-xl max-w-sm backdrop-blur-md shadow-2xl">
                <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#C5A880] font-semibold">Căn Hộ Thực Tế 12A05</div>
                <div className="text-sm font-serif mt-1 font-bold text-white">2PN Tiêu Chuẩn • Ban Công Hướng Sông</div>
                <div className="text-xs text-gray-300 font-light mt-0.5">Tầng 12A Tháp A • Cư dân: Nguyễn Hữu Lực</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
