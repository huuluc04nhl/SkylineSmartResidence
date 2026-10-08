'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Sun, 
  Utensils, 
  KeyRound, 
  Moon, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Eye, 
  Activity, 
  Zap, 
  Car, 
  Clock, 
  CheckCircle2, 
  Layers, 
  ScanFace,
  QrCode,
  Droplets,
  Building2
} from 'lucide-react';
import { useTheme } from '@/lib/themeContext';
import { useAuth } from '@/lib/authContext';

interface DayMilestone {
  id: string;
  timeSlot: string;
  timeLabel: string;
  periodName: string;
  headline: string;
  story: string;
  icon: any;
  techSpecs: { label: string; value: string }[];
  portalTab: string;
  actionText: string;
  visualWidget: {
    badge: string;
    title: string;
    subtitle: string;
    statusColor: string;
    details: { icon: any; text: string }[];
  };
}

export default function SmartTechSection() {
  const { theme } = useTheme();
  const { currentUser, isAuthenticated } = useAuth();
  const isDark = theme === 'dark';

  const [activeSlot, setActiveSlot] = useState<string>('morning');

  const milestones: DayMilestone[] = [
    {
      id: 'morning',
      timeSlot: '06:30',
      timeLabel: '06:30 AM',
      periodName: 'Khởi Đầu & Xuất Hành Không Chạm',
      headline: 'Thức Giấc Tự Nhiên & Di Chuyển Thông Minh',
      story: 'Rèm tự động mở góc 45° đón ánh nắng tự nhiên. Điều hòa trung tâm chuyển chế độ lọc khí tươi Fresh Air. Khi cư dân bước xuống sảnh chung cư BS-07, camera Vision AI định danh khuôn mặt <0.5s để mở cửa sảnh và hệ thống barrier hầm đỗ xe tự động quét biển số xe mà không cần hạ kính.',
      icon: Sun,
      techSpecs: [
        { label: 'Tốc Độ Định Danh FaceID', value: '< 0.5 Giây' },
        { label: 'Chính Xác Biển Số Xe', value: '99.8% Vision AI' },
        { label: 'Kịch Bản Smart Home', value: 'Auto Morning Scene' }
      ],
      portalTab: 'resident-smarthome',
      actionText: 'Trải Nghiệm Smart Home Căn Hộ',
      visualWidget: {
        badge: 'ĐỊNH DANH SINH TRẮC HỌC TẦNG HẦM',
        title: 'Barrier Xe & Thang Máy Tự Động',
        subtitle: 'Chung cư BS-07 • Hầm B1-B2 The Tropical',
        statusColor: 'emerald',
        details: [
          { icon: ScanFace, text: 'FaceID Cư Dân: Nhận diện thành công (99.8%)' },
          { icon: Car, text: 'Biển số 51K-889.99: Khớp thẻ xe cư dân' },
          { icon: Building2, text: 'Thang máy đón sẵn: Sảnh Tầng 1 → Tầng 30' }
        ]
      }
    },
    {
      id: 'noon',
      timeSlot: '12:00',
      timeLabel: '12:00 PM',
      periodName: 'Tiện Nghi & Nghỉ Dưỡng Giữa Trưa',
      headline: 'Dịch Vụ 5 Sao & Đặt Chỗ Tiện Ích Một Chạm',
      story: 'Giữa ngày bận rộn, cư dân dễ dàng đặt bàn tại nhà hàng ẩm thực tầng 1 hoặc giữ chỗ ca nướng BBQ chân mây & phòng xông hơi VIP tầng tiện ích. Trợ lý ảo Skyline AI Concierge 24/7 tự động kiểm tra hạn mức quota căn hộ, xuất mã vé QR và xác nhận lịch tức thì.',
      icon: Utensils,
      techSpecs: [
        { label: 'Hạn Mức Quota Tiện Ích', value: 'Miễn Phí Hàng Tháng' },
        { label: 'Xác Nhận Đặt Chỗ', value: 'Thời Gian Thực (Realtime)' },
        { label: 'Hủy & Đổi Lịch', value: 'Hoàn 100% Giữ Chỗ' }
      ],
      portalTab: 'resident-facilities',
      actionText: 'Khám Phá Đặt Chỗ Tiện Ích',
      visualWidget: {
        badge: 'HỆ THỐNG VÉ ĐIỆN TỬ TIỆN ÍCH',
        title: 'Vé Vườn Nướng BBQ Chân Mây',
        subtitle: 'Tầng cao The Tropical • Phân khu Beverly Solari',
        statusColor: 'amber',
        details: [
          { icon: QrCode, text: 'Mã QR Check-in: TROPICAL-BBQ-2026' },
          { icon: Clock, text: 'Khung giờ giữ chỗ: 18:00 - 21:30' },
          { icon: CheckCircle2, text: 'Hạn mức: Đã cấp quyền sử dụng cho Căn CH-06' }
        ]
      }
    },
    {
      id: 'evening',
      timeSlot: '18:30',
      timeLabel: '06:30 PM',
      periodName: 'Tiếp Đón Thượng Lưu & An Ninh Đa Lớp',
      headline: 'Đón Bạn Bè & Quản Lý Cửa Căn Hộ Từ Xa',
      story: 'Khi bạn bè hoặc đối tác đến thăm, chủ hộ chủ động cấp mã QR khách thăm hoặc mã PIN tạm thời có hiệu lực 24 giờ. Khi khách bấm chuông hình thông minh Doorbell tại sảnh chung cư, video trực tiếp lập tức truyền về điện thoại để chủ hộ mở cửa sảnh và thang máy đón khách từ xa.',
      icon: KeyRound,
      techSpecs: [
        { label: 'Mã QR Khách Thăm', value: 'Mã Hóa SHA-256' },
        { label: 'Chuông Hình Doorbell', value: 'Video Call HD 1080P' },
        { label: 'Bảo Vệ Đa Lớp', value: 'Phân Tầng Thang Máy' }
      ],
      portalTab: 'resident-smarthome',
      actionText: 'Tạo Thẻ Khách & Quản Lý Cửa',
      visualWidget: {
        badge: 'CHUÔNG HÌNH THÔNG MINH SẢNH L1',
        title: 'Cấp Quyền Đón Khách Thăm',
        subtitle: 'Cửa sảnh chung cư BS-07 → Căn hộ CH-06',
        statusColor: 'emerald',
        details: [
          { icon: QrCode, text: 'Thẻ Khách: Quét mã QR tại barrier đón' },
          { icon: KeyRound, text: 'Mã PIN OTP tạm thời: 889922 (Hiệu lực 4 giờ)' },
          { icon: Eye, text: 'Camera an ninh sảnh: Xác nhận khách hợp lệ' }
        ]
      }
    },
    {
      id: 'night',
      timeSlot: '23:00',
      timeLabel: '11:00 PM',
      periodName: 'An Tâm Giấc Ngủ & Tầm Soát Rủi Ro',
      headline: 'An Ninh Ban Đêm & Dự Báo Rò Rỉ Năng Lượng',
      story: 'Kịch bản ban đêm tự động kích hoạt: khóa chốt an toàn chống cạy cửa, ngắt các nguồn điện không cần thiết để tối ưu hóa năng lượng. Lõi AI liên tục theo dõi đồng hồ nước thông minh để phát hiện rò rỉ bất thường vào khung giờ 2h - 4h sáng, đồng thời camera nhiệt tòa nhà quét tầm soát khói lửa 24/7.',
      icon: Moon,
      techSpecs: [
        { label: 'Cảnh Báo Rò Rỉ Nước', value: 'Phát Hiện Sau 15 Phút' },
        { label: 'Tiết Kiệm Năng Lượng', value: '-20% Điện Tiêu Thụ' },
        { label: 'Ứng Trực Kỹ Thuật NKS', value: 'Có Mặt 15 - 60 Phút' }
      ],
      portalTab: 'resident-tickets',
      actionText: 'Yêu Cầu Hỗ Trợ Kỹ Thuật NKS',
      visualWidget: {
        badge: 'GIÁM SÁT HẠ TẦNG & AN NINH ĐÊM',
        title: 'Lõi Giám Sát Năng Lượng & An Toàn',
        subtitle: 'Hệ thống vận hành thông minh 4 chung cư The Tropical',
        statusColor: 'emerald',
        details: [
          { icon: Droplets, text: 'Lưu lượng nước đêm: Bình thường (0 rò rỉ)' },
          { icon: Zap, text: 'Điện năng tiêu thụ: Chế độ Standby tối ưu' },
          { icon: ShieldCheck, text: 'Cảm biến khói & nhiệt: Trực tuyến 100%' }
        ]
      }
    }
  ];

  const current = milestones.find((m) => m.id === activeSlot) || milestones[0];
  const CurrentIcon = current.icon;

  const handlePortalRedirect = (tab: string) => {
    if (isAuthenticated) {
      return `/portal?tab=${tab}`;
    }
    return '/portal';
  };

  return (
    <section id="smart-tech" className={`py-20 sm:py-24 border-b scroll-mt-20 relative overflow-hidden transition-colors duration-300 ${
      isDark ? 'bg-[#0A0E14] text-white border-[#1E293B]' : 'bg-[#F8FAFC] text-gray-900 border-gray-200'
    }`}>
      {/* Background Subtle Gradient */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#C5A880]/5 rounded-none blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <div className="max-w-3xl mb-12 sm:mb-16 space-y-3">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-none text-[11px] font-mono uppercase tracking-[0.2em] ${
            isDark 
              ? 'bg-[#161F2E] border border-[#C5A880]/40 text-[#C5A880]' 
              : 'bg-white border border-[#C5A880]/60 text-amber-800 shadow-sm'
          }`}>
            <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
            <span>Chu Trình Tự Động Hóa 24/7</span>
          </div>
          <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-serif font-bold tracking-tight ${
            isDark ? 'text-[#FAFAFA]' : 'text-[#0D1117]'
          }`}>
            Một Ngày Trải Nghiệm Chuẩn Sống Đẳng Cấp Cùng Lõi AI
          </h2>
          <p className={`text-sm sm:text-base font-light leading-relaxed ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Không chỉ là những thiết bị công nghệ rời rạc, Skyline liên kết toàn diện hạ tầng từ căn hộ thông minh đến hệ thống quản trị 
            vận hành 4 chung cư The Tropical trong từng khoảnh khắc nhịp sống của cư dân.
          </p>
        </div>

        {/* 1. TIMELINE INTERACTIVE SELECTOR TABS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 mb-8 sm:mb-10">
          {milestones.map((m) => {
            const Icon = m.icon;
            const isActive = m.id === activeSlot;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setActiveSlot(m.id)}
                className={`p-3.5 sm:p-4 text-left transition-all duration-300 rounded-none border flex flex-col justify-between group cursor-pointer ${
                  isActive
                    ? 'bg-[#141B24] border-[#C5A880] shadow-[0_10px_25px_rgba(0,0,0,0.6)] text-white'
                    : isDark
                      ? 'bg-[#0E131B]/80 border-[#222B35] hover:border-[#C5A880]/50 text-gray-400 hover:text-white'
                      : 'bg-white border-gray-200 hover:border-[#C5A880] text-gray-600 hover:text-gray-900 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-none border ${
                    isActive
                      ? 'bg-[#C5A880] text-[#0A0E14] border-[#C5A880]'
                      : 'bg-black/30 border-white/10 text-[#C5A880]'
                  }`}>
                    {m.timeSlot}
                  </span>
                  <Icon className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-[#C5A880]' : 'text-gray-500 group-hover:text-[#C5A880]'
                  }`} />
                </div>
                <div>
                  <div className={`text-xs sm:text-sm font-serif font-bold truncate ${
                    isActive ? 'text-white' : 'text-gray-300'
                  }`}>
                    {m.periodName}
                  </div>
                  <div className="text-[11px] text-gray-500 font-light truncate mt-0.5">
                    {m.timeLabel}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* 2. ACTIVE STAGE SHOWCASE (2 Columns: Story & High-Tech Widget) */}
        <div className={`border p-6 sm:p-8 lg:p-10 rounded-none shadow-2xl transition-all duration-500 ${
          isDark 
            ? 'border-[#C5A880]/30 bg-[#0E131B] text-white' 
            : 'border-gray-200 bg-white shadow-xl'
        }`}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left: Narrative & Specifications */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#16202D] border border-[#C5A880]/40 flex items-center justify-center text-[#C5A880] rounded-none shadow">
                  <CurrentIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-widest text-[#C5A880] font-bold">
                    Khung Giờ {current.timeLabel} • {current.periodName}
                  </div>
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-serif font-bold text-white leading-snug">
                    {current.headline}
                  </h3>
                </div>
              </div>

              <p className="text-sm sm:text-base text-gray-300 font-light leading-relaxed">
                {current.story}
              </p>

              {/* Technical Spec Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {current.techSpecs.map((spec, sIdx) => (
                  <div 
                    key={sIdx}
                    className="p-3 bg-[#141B24] border border-white/5 rounded-none space-y-1"
                  >
                    <div className="text-[10px] text-gray-400 uppercase font-mono tracking-wider">
                      {spec.label}
                    </div>
                    <div className="text-sm sm:text-base font-serif font-bold text-[#C5A880]">
                      {spec.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA Link */}
              <div className="pt-2 flex items-center gap-4">
                <Link
                  href={handlePortalRedirect(current.portalTab)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C5A880] hover:bg-white text-[#0A0E14] text-xs uppercase font-bold tracking-wider transition-all rounded-none shadow hover:shadow-lg active:scale-95"
                >
                  <span>{current.actionText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <span className="text-[11px] text-gray-400 font-mono hidden sm:inline">
                  Tích hợp 4 chung cư The Tropical
                </span>
              </div>
            </div>

            {/* Right: High-Tech Telemetry Mockup Frame */}
            <div className="lg:col-span-5">
              <div className="border border-[#C5A880]/35 bg-[#141B24] p-5 sm:p-6 rounded-none shadow-2xl space-y-5 relative overflow-hidden">
                {/* Ambient glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#C5A880]/10 rounded-none blur-2xl pointer-events-none" />

                {/* Widget Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <div className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#C5A880]">
                      {current.visualWidget.badge}
                    </div>
                    <div className="text-sm font-serif font-bold text-white mt-0.5">
                      {current.visualWidget.title}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-[10px] font-mono font-bold rounded-none">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-none animate-pulse"></span>
                    <span>TRỰC TUYẾN</span>
                  </div>
                </div>

                <div className="text-xs text-gray-400 font-light">
                  {current.visualWidget.subtitle}
                </div>

                {/* Detail Status Rows */}
                <div className="space-y-2.5">
                  {current.visualWidget.details.map((item, dIdx) => {
                    const ItemIcon = item.icon;
                    return (
                      <div 
                        key={dIdx}
                        className="flex items-start gap-2.5 p-3 bg-[#0E131B] border border-white/5 rounded-none text-xs text-gray-300"
                      >
                        <ItemIcon className="w-4 h-4 text-[#C5A880] flex-shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{item.text}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Footer Security Badge */}
                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-400 font-mono">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Mã hóa bảo mật 256-bit
                  </span>
                  <span>Lõi AI Skyline 4.0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
