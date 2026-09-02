'use client';

import React from 'react';
import { Eye, Shield, Cpu, Activity, Zap, MessageSquare, Car, FileCheck } from 'lucide-react';

export default function SmartTechSection() {
  const features = [
    {
      icon: Eye,
      code: 'An Ninh & FaceID',
      title: 'Vision AI & FaceID Sinh Trắc Học',
      desc: 'Mở sảnh đón và tự động bấm tầng thang máy với độ trễ < 0.5s. Camera AI giám sát phát hiện ngay lập tức khói lửa hoặc xô xát.',
    },
    {
      icon: Activity,
      code: 'Bảo Trì Dự Đoán',
      title: 'Chấm Điểm Tình Trạng Thiết Bị & Dự Báo',
      desc: 'AI tổng hợp dữ liệu IoT để tính điểm Health Score cho thang máy, máy bơm và tự động phát lệnh bảo trì trước khi hỏng hóc.',
    },
    {
      icon: Zap,
      code: 'Năng Lượng Thông Minh',
      title: 'AI Energy & Cảnh Báo Rò Rỉ Nước',
      desc: 'Học thói quen sinh hoạt và phát cảnh báo lập tức nếu phát hiện nước chảy liên tục vào khung giờ 2h - 4h sáng, chống ngập nhà.',
    },
    {
      icon: Car,
      code: 'Bãi Xe Tự Động',
      title: 'Bãi Đỗ Xe Thông Minh ALPR',
      desc: 'Nhận diện biển số xe tốc độ cao trong mọi điều kiện ánh sáng, kiểm soát sức chứa hầm tự động đóng/mở barrier an toàn.',
    },
    {
      icon: MessageSquare,
      code: 'Trợ Lý Ảo 24/7',
      title: 'Trợ Lý Ảo Skyline AI Concierge 24/7',
      desc: 'Đọc hiểu toàn bộ Sổ tay cư dân và Nội quy tòa nhà để giải đáp thắc mắc tức thời và chuyển tiếp Ban Quản Lý khi cần.',
    },
    {
      icon: FileCheck,
      code: 'Rà Soát Tài Chính',
      title: 'Smart Billing & Rà Soát Hóa Đơn Tự Động',
      desc: 'Tự động phát hiện các căn hộ có chi phí điện nước biến động bất thường trước ngày phát hành để bộ phận quản lý rà soát.',
    },
  ];

  return (
    <section id="smart-tech" className="py-24 bg-[#0D1117] text-white border-b border-[#222B35]">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="max-w-3xl mb-16 space-y-4">
          <div className="text-[11px] uppercase tracking-[0.25em] text-[#C5A880] font-semibold">
            Công Nghệ Tự Động Hóa
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif text-[#FAFAFA]">
            Hệ Sinh Thái Công Nghệ Thông Minh Vận Hành Tòa Nhà
          </h2>
          <p className="text-gray-400 text-sm sm:text-base font-light">
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
                className="border border-[#222B35] bg-[#121820] p-6 space-y-4 hover:border-[#C5A880] transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2.5 bg-[#1C2533] border border-[#2D3748] text-[#C5A880]">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500">
                    {feat.code}
                  </span>
                </div>

                <h3 className="font-serif text-lg text-white font-semibold group-hover:text-[#C5A880] transition-colors">
                  {feat.title}
                </h3>

                <p className="text-xs text-gray-400 font-light leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
