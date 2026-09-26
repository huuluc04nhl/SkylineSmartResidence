'use client';

import React from 'react';
import Link from 'next/link';
import { Eye, Shield, Cpu, Activity, Zap, MessageSquare, Car, FileCheck, Sparkles, ArrowRight } from 'lucide-react';
import { useTheme } from '@/lib/themeContext';
import { useAuth } from '@/lib/authContext';

export default function SmartTechSection() {
  const { theme } = useTheme();
  const { currentUser, isAuthenticated } = useAuth();
  const isDark = theme === 'dark';

  const features = [
    {
      icon: Eye,
      code: 'An Ninh & FaceID',
      title: 'Vision AI & FaceID Sinh Trắc Học',
      desc: 'Mở sảnh đón và tự động bấm tầng thang máy với độ trễ < 0.5s. Camera AI giám sát phát hiện ngay lập tức khói lửa hoặc xô xát.',
      href: isAuthenticated
        ? currentUser?.role === 'ADMIN'
          ? '/portal?tab=admin-ekyc'
          : '/portal?tab=resident-profile'
        : '/portal',
      actionText: 'Xác thực FaceID'
    },
    {
      icon: Activity,
      code: 'Bảo Trì Dự Đoán',
      title: 'Chấm Điểm Tình Trạng Thiết Bị & Dự Báo',
      desc: 'AI tổng hợp dữ liệu IoT để tính điểm Health Score cho thang máy, máy bơm và tự động phát lệnh bảo trì trước khi hỏng hóc.',
      href: isAuthenticated
        ? currentUser?.role === 'ADMIN' || currentUser?.role === 'TECHNICIAN'
          ? '/portal?tab=admin-devices'
          : '/portal?tab=resident-tickets'
        : '/portal',
      actionText: 'Giám sát kỹ thuật'
    },
    {
      icon: Zap,
      code: 'Năng Lượng Thông Minh',
      title: 'AI Energy & Cảnh Báo Rò Rỉ Nước',
      desc: 'Học thói quen sinh hoạt và phát cảnh báo lập tức nếu phát hiện nước chảy liên tục vào khung giờ 2h - 4h sáng, chống ngập nhà.',
      href: isAuthenticated ? '/portal?tab=resident-smarthome' : '/portal',
      actionText: 'Điều khiển Smart Home'
    },
    {
      icon: Car,
      code: 'Bãi Xe Tự Động',
      title: 'Bãi Đỗ Xe Thông Minh Tự Động',
      desc: 'Nhận diện biển số xe tốc độ cao trong mọi điều kiện ánh sáng, kiểm soát sức chứa hầm tự động đóng/mở barrier an toàn.',
      href: isAuthenticated
        ? currentUser?.role === 'ADMIN'
          ? '/portal?tab=admin-parking'
          : '/portal?tab=resident-home'
        : '/portal',
      actionText: 'Quản lý phương tiện'
    },
    {
      icon: MessageSquare,
      code: 'Trợ Lý Ảo 24/7',
      title: 'Trợ Lý Ảo Skyline AI Concierge 24/7',
      desc: 'Đọc hiểu toàn bộ Sổ tay cư dân và Nội quy tòa nhà để giải đáp thắc mắc tức thời và chuyển tiếp Ban Quản Lý khi cần.',
      href: isAuthenticated ? '/portal?tab=resident-ai-assistant' : '/portal',
      actionText: 'Hỏi đáp Trợ lý AI'
    },
    {
      icon: FileCheck,
      code: 'Rà Soát Tài Chính',
      title: 'Smart Billing & Rà Soát Hóa Đơn Tự Động',
      desc: 'Tự động phát hiện các căn hộ có chi phí điện nước biến động bất thường trước ngày phát hành để bộ phận quản lý rà soát.',
      href: isAuthenticated
        ? currentUser?.role === 'ADMIN'
          ? '/portal?tab=admin-billing'
          : '/portal?tab=resident-finance'
        : '/portal',
      actionText: 'Tra cứu hóa đơn'
    },
  ];

  return (
    <section id="smart-tech" className={`py-20 sm:py-24 border-b scroll-mt-20 relative overflow-hidden transition-colors duration-300 ${
      isDark 
        ? 'bg-[#0D1117] text-white border-[#1E293B]' 
        : 'bg-[#F8FAFC] text-gray-900 border-gray-200'
    }`}>
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="max-w-3xl mb-14 sm:mb-16 space-y-3">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-none text-[11px] font-mono uppercase tracking-[0.2em] ${
            isDark 
              ? 'bg-[#161F2E] border border-[#C5A880]/40 text-[#C5A880]' 
              : 'bg-white border border-[#C5A880]/60 text-amber-800 shadow-sm'
          }`}>
            <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
            <span>Công Nghệ Tự Động Hóa</span>
          </div>
          <h2 className={`text-3xl sm:text-4xl font-serif font-bold tracking-tight ${
            isDark ? 'text-[#FAFAFA]' : 'text-[#0D1117]'
          }`}>
            Hệ Sinh Thái Công Nghệ Thông Minh Vận Hành Tòa Nhà
          </h2>
          <p className={`text-sm sm:text-base font-light ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Số hóa toàn diện từ quản lý vận hành, bảo dưỡng dự đoán, quản lý năng lượng đến an ninh thông minh.
          </p>
        </div>

        {/* Tech Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className={`p-6 space-y-4 rounded-none transition-all duration-300 group hover:-translate-y-1 ${
                  isDark 
                    ? 'border border-[#222B35] bg-[#121820] hover:border-[#C5A880] shadow-xl' 
                    : 'border border-gray-200 bg-white hover:border-[#C5A880] shadow-md hover:shadow-xl'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`p-2.5 rounded-none border ${
                    isDark 
                      ? 'bg-[#1C2533] border-[#2D3748] text-[#C5A880]' 
                      : 'bg-amber-50 border-amber-200 text-amber-800'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-[10px] font-mono uppercase tracking-wider ${
                    isDark ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    {feat.code}
                  </span>
                </div>

                <h3 className={`font-serif text-lg font-bold transition-colors ${
                  isDark 
                    ? 'text-white group-hover:text-[#C5A880]' 
                    : 'text-gray-900 group-hover:text-[#9E8057]'
                }`}>
                  {feat.title}
                </h3>

                <p className={`text-xs font-light leading-relaxed ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {feat.desc}
                </p>

                <div className={`pt-3 border-t flex items-center justify-between text-[11px] font-mono ${
                  isDark ? 'border-[#1E293B] text-[#C5A880]' : 'border-gray-100 text-amber-800'
                }`}>
                  <Link
                    href={feat.href}
                    className="inline-flex items-center gap-1 font-semibold hover:underline transition-colors"
                  >
                    <span>{feat.actionText}</span>
                    <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Hệ Thống AI</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
