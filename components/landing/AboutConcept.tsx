'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import { useTheme } from '@/lib/themeContext';
import { useAuth } from '@/lib/authContext';

export default function AboutConcept() {
  const { theme } = useTheme();
  const { currentUser, isAuthenticated } = useAuth();
  const isDark = theme === 'dark';

  return (
    <section id="concept" className={`py-20 sm:py-24 border-b scroll-mt-20 relative overflow-hidden transition-colors duration-300 ${
      isDark 
        ? 'bg-[#0D1117] text-white border-[#1E293B]' 
        : 'bg-white text-gray-900 border-gray-200'
    }`}>
      {/* Background glow tinh tế */}
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-[#C5A880]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="max-w-3xl mb-14 sm:mb-16 space-y-3">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-none text-[11px] font-mono uppercase tracking-[0.2em] ${
            isDark 
              ? 'bg-[#161F2E] border border-[#C5A880]/40 text-[#C5A880]' 
              : 'bg-amber-50 border border-[#C5A880]/60 text-amber-900 shadow-sm'
          }`}>
            <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
            <span>Triết Lý Thiết Kế &amp; Không Gian</span>
          </div>
          <h2 className={`text-3xl sm:text-4xl font-serif leading-tight font-bold tracking-tight ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Sự Giao Thoa Giữa Nghệ Thuật Kiến Trúc Tối Giản Và Vận Hành Số Hóa
          </h2>
          <div className="w-16 h-0.5 bg-[#C5A880]"></div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <div className={`lg:col-span-6 space-y-6 font-light leading-relaxed ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>
            <p className="text-base sm:text-lg">
              Lấy cảm hứng từ phong cách kiến trúc căn hộ cao cấp quốc tế bên bờ sông, 
              <strong className={isDark ? 'text-white' : 'text-gray-900'}> SKYLINE Smart Residence</strong> tập trung vào hình khối sắc nét, 
              tỷ lệ không gian mở thoáng đãng và đón trọn ánh sáng tự nhiên cùng gió sông mát lành.
            </p>
            <p className={`text-sm sm:text-base ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Điểm đột phá của dự án là việc tích hợp một <strong className="text-[#C5A880]">Lõi Trí Tuệ Nhân Tạo (AI Core)</strong> chạy ngầm 
              trong toàn bộ hạ tầng kỹ thuật. Cư dân không còn phải chờ đợi bảo dưỡng thủ công hay gặp phiền toái 
              với các thủ tục giấy tờ: mọi yêu cầu hỗ trợ, kiểm soát ra vào, hóa đơn và an ninh đều được tự động hóa 
              với độ chính xác gần như tuyệt đối.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className={`p-4 rounded-none border-l-4 border-l-[#C5A880] space-y-1 shadow-lg transition-colors ${
                isDark 
                  ? 'bg-[#121824] border border-[#1E293B]' 
                  : 'bg-slate-50 border border-gray-200'
              }`}>
                <div className={`font-serif text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Quyền Tự Trị Căn Hộ
                </div>
                <div className={`text-xs font-light ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Chủ hộ toàn quyền cấp phát FaceID và quản lý thành viên cư trú.
                </div>
              </div>
              <div className={`p-4 rounded-none border-l-4 border-l-[#C5A880] space-y-1 shadow-lg transition-colors ${
                isDark 
                  ? 'bg-[#121824] border border-[#1E293B]' 
                  : 'bg-slate-50 border border-gray-200'
              }`}>
                <div className={`font-serif text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  An Ninh Đa Lớp 24/7
                </div>
                <div className={`text-xs font-light ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Phân tầng thang máy bảo mật và camera Vision AI quét biển số xe tự động.
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className={`relative border p-2 sm:p-3 rounded-none shadow-2xl overflow-hidden group transition-colors ${
              isDark 
                ? 'border-[#C5A880]/40 bg-[#121824]' 
                : 'border-gray-200 bg-slate-100'
            }`}>
              <img
                src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80"
                alt="Skyline Luxury Architecture"
                className="w-full h-[360px] sm:h-[400px] object-cover rounded-none transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 pointer-events-none rounded-none bg-gradient-to-t from-black/75 via-transparent to-transparent" />

              <div className={`absolute bottom-5 left-5 right-5 sm:right-auto p-4 border rounded-none max-w-sm backdrop-blur-md shadow-2xl transition-colors ${
                isDark 
                  ? 'bg-[#0A0E17]/95 text-white border-[#C5A880]/60' 
                  : 'bg-white/95 text-gray-900 border-gray-200 shadow-xl'
              }`}>
                <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#C5A880] font-semibold">
                  {isAuthenticated && currentUser ? 'Căn Hộ Thực Tế 12A05' : 'Căn Hộ Mẫu Thực Tế'}
                </div>
                <div className={`text-sm font-serif mt-1 font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  2PN Tiêu Chuẩn • Ban Công Hướng Sông
                </div>
                <div className={`text-xs font-light mt-0.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {isAuthenticated && currentUser 
                    ? `Tầng 12A • Chung Cư Skyline • Cư dân: ${currentUser.full_name}`
                    : 'Tầng 12A • Chung Cư Skyline • Tiêu Chuẩn Bàn Giao 5 Sao'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
