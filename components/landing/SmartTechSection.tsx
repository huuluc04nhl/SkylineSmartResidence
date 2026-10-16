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
import { useLanguage } from '@/lib/languageContext';

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
  const { t, isEn, language } = useLanguage();
  const isDark = theme === 'dark';

  const [activeSlot, setActiveSlot] = useState<string>('morning');

  const milestones: DayMilestone[] = [
    {
      id: 'morning',
      timeSlot: '06:30',
      timeLabel: '06:30 AM',
      periodName: isEn ? 'Fresh Start & Touchless Departure' : 'Khởi Đầu & Xuất Hành Không Chạm',
      headline: isEn ? 'Natural Awakening & Smart Commuting' : 'Thức Giấc Tự Nhiên & Di Chuyển Thông Minh',
      story: isEn 
        ? 'Curtains open 45° automatically to welcome natural sunlight. Central AC shifts to Fresh Air filtration. As residents enter the Tower BS-07 lobby, Vision AI cameras identify faces in <0.5s to unlock doors, and basement barriers scan license plates hands-free.'
        : 'Rèm tự động mở góc 45° đón ánh nắng tự nhiên. Điều hòa trung tâm chuyển chế độ lọc khí tươi Fresh Air. Khi cư dân bước xuống sảnh chung cư BS-07, camera Vision AI định danh khuôn mặt <0.5s để mở cửa sảnh và hệ thống barrier hầm đỗ xe tự động quét biển số xe mà không cần hạ kính.',
      icon: Sun,
      techSpecs: [
        { label: isEn ? 'FaceID Recognition Speed' : 'Tốc Độ Định Danh FaceID', value: isEn ? '< 0.5 Seconds' : '< 0.5 Giây' },
        { label: isEn ? 'License Plate Accuracy' : 'Chính Xác Biển Số Xe', value: '99.8% Vision AI' },
        { label: isEn ? 'Smart Home Scene' : 'Kịch Bản Smart Home', value: 'Auto Morning Scene' }
      ],
      portalTab: 'resident-smarthome',
      actionText: isEn ? 'Experience Smart Home Living' : 'Trải Nghiệm Smart Home Căn Hộ',
      visualWidget: {
        badge: isEn ? 'BASEMENT BIOMETRIC IDENTIFICATION' : 'ĐỊNH DANH SINH TRẮC HỌC TẦNG HẦM',
        title: isEn ? 'Automated Parking Barrier & Elevators' : 'Barrier Xe & Thang Máy Tự Động',
        subtitle: isEn ? 'Tower BS-07 • Basement B1-B2 The Tropical' : 'Chung cư BS-07 • Hầm B1-B2 The Tropical',
        statusColor: 'emerald',
        details: [
          { icon: ScanFace, text: isEn ? 'Resident FaceID: Recognition Successful (99.8%)' : 'FaceID Cư Dân: Nhận diện thành công (99.8%)' },
          { icon: Car, text: isEn ? 'License Plate 51K-889.99: Matched Resident Card' : 'Biển số 51K-889.99: Khớp thẻ xe cư dân' },
          { icon: Building2, text: isEn ? 'Elevator Dispatched: Lobby Floor 1 → Floor 30' : 'Thang máy đón sẵn: Sảnh Tầng 1 → Tầng 30' }
        ]
      }
    },
    {
      id: 'noon',
      timeSlot: '12:00',
      timeLabel: '12:00 PM',
      periodName: isEn ? 'Midday Comfort & Leisure Amenities' : 'Tiện Nghi & Nghỉ Dưỡng Giữa Trưa',
      headline: isEn ? '5-Star Service & One-Touch Amenity Booking' : 'Dịch Vụ 5 Sao & Đặt Chỗ Tiện Ích Một Chạm',
      story: isEn 
        ? 'During a busy day, residents can effortlessly book dining tables at 1st-floor restaurants or reserve Sky BBQ grill slots & VIP sauna rooms on amenity floors. Skyline AI Concierge 24/7 automatically verifies apartment quota, generates QR ticket passes, and confirms reservations instantaneously.'
        : 'Giữa ngày bận rộn, cư dân dễ dàng đặt bàn tại nhà hàng ẩm thực tầng 1 hoặc giữ chỗ ca nướng BBQ chân mây & phòng xông hơi VIP tầng tiện ích. Trợ lý ảo Skyline AI Concierge 24/7 tự động kiểm tra hạn mức quota căn hộ, xuất mã vé QR và xác nhận lịch tức thì.',
      icon: Utensils,
      techSpecs: [
        { label: isEn ? 'Amenity Quota Allowance' : 'Hạn Mức Quota Tiện Ích', value: isEn ? 'Complimentary Monthly' : 'Miễn Phí Hàng Tháng' },
        { label: isEn ? 'Booking Confirmation' : 'Xác Nhận Đặt Chỗ', value: isEn ? 'Realtime Instant' : 'Thời Gian Thực (Realtime)' },
        { label: isEn ? 'Cancellation & Reschedule' : 'Hủy & Đổi Lịch', value: isEn ? '100% Deposit Refund' : 'Hoàn 100% Giữ Chỗ' }
      ],
      portalTab: 'resident-facilities',
      actionText: isEn ? 'Explore Amenity Booking' : 'Khám Phá Đặt Chỗ Tiện Ích',
      visualWidget: {
        badge: isEn ? 'DIGITAL AMENITY PASS SYSTEM' : 'HỆ THỐNG VÉ ĐIỆN TỬ TIỆN ÍCH',
        title: isEn ? 'Sky BBQ Garden Pass' : 'Vé Vườn Nướng BBQ Chân Mây',
        subtitle: isEn ? 'High Floor The Tropical • Beverly Solari' : 'Tầng cao The Tropical • Phân khu Beverly Solari',
        statusColor: 'amber',
        details: [
          { icon: QrCode, text: isEn ? 'QR Check-in Pass: TROPICAL-BBQ-2026' : 'Mã QR Check-in: TROPICAL-BBQ-2026' },
          { icon: Clock, text: isEn ? 'Reserved Time Window: 18:00 - 21:30' : 'Khung giờ giữ chỗ: 18:00 - 21:30' },
          { icon: CheckCircle2, text: isEn ? 'Quota Allowance: Approved for Unit CH-06' : 'Hạn mức: Đã cấp quyền sử dụng cho Căn CH-06' }
        ]
      }
    },
    {
      id: 'evening',
      timeSlot: '18:30',
      timeLabel: '06:30 PM',
      periodName: isEn ? 'Elite Hospitality & Multi-Layer Security' : 'Tiếp Đón Thượng Lưu & An Ninh Đa Lớp',
      headline: isEn ? 'Welcoming Guests & Remote Door Access' : 'Đón Bạn Bè & Quản Lý Cửa Căn Hộ Từ Xa',
      story: isEn 
        ? 'When friends or partners visit, residents generate guest QR passes or 24-hour PIN codes. As guests ring the smart Doorbell at the lobby, live video streams directly to mobile, enabling remote lobby and elevator unlock.'
        : 'Khi bạn bè hoặc đối tác đến thăm, chủ hộ chủ động cấp mã QR khách thăm hoặc mã PIN tạm thời có hiệu lực 24 giờ. Khi khách bấm chuông hình thông minh Doorbell tại sảnh chung cư, video trực tiếp lập tức truyền về điện thoại để chủ hộ mở cửa sảnh và thang máy đón khách từ xa.',
      icon: KeyRound,
      techSpecs: [
        { label: isEn ? 'Visitor QR Code' : 'Mã QR Khách Thăm', value: 'SHA-256 Encrypted' },
        { label: isEn ? 'Smart Doorbell' : 'Chuông Hình Doorbell', value: '1080P HD Video Call' },
        { label: isEn ? 'Multi-Layer Protection' : 'Bảo Vệ Đa Lớp', value: isEn ? 'Elevator Floor Access Control' : 'Phân Tầng Thang Máy' }
      ],
      portalTab: 'resident-smarthome',
      actionText: isEn ? 'Generate Guest Pass & Door Control' : 'Tạo Thẻ Khách & Quản Lý Cửa',
      visualWidget: {
        badge: isEn ? 'SMART LOBBY L1 DOORBELL' : 'CHUÔNG HÌNH THÔNG MINH SẢNH L1',
        title: isEn ? 'Grant Visitor Access Authorization' : 'Cấp Quyền Đón Khách Thăm',
        subtitle: isEn ? 'Tower BS-07 Lobby Door → Apartment CH-06' : 'Cửa sảnh chung cư BS-07 → Căn hộ CH-06',
        statusColor: 'emerald',
        details: [
          { icon: QrCode, text: isEn ? 'Guest Pass: Scan QR code at arrival barrier' : 'Thẻ Khách: Quét mã QR tại barrier đón' },
          { icon: KeyRound, text: isEn ? 'Temporary OTP PIN: 889922 (Valid 4 hours)' : 'Mã PIN OTP tạm thời: 889922 (Hiệu lực 4 giờ)' },
          { icon: Eye, text: isEn ? 'Lobby Security Camera: Verified valid visitor' : 'Camera an ninh sảnh: Xác nhận khách hợp lệ' }
        ]
      }
    },
    {
      id: 'night',
      timeSlot: '23:00',
      timeLabel: '11:00 PM',
      periodName: isEn ? 'Peaceful Sleep & Risk Screening' : 'An Tâm Giấc Ngủ & Tầm Soát Rủi Ro',
      headline: isEn ? 'Nighttime Security & Energy Leak Detection' : 'An Ninh Ban Đêm & Dự Báo Rò Rỉ Năng Lượng',
      story: isEn 
        ? 'Night scenario activates automatically: deadbolt secured against tampering, non-essential power disconnected to optimize energy. The AI Core continuously monitors smart water meters to detect leak anomalies between 2 AM - 4 AM, while thermal cameras scan for fire & smoke 24/7.'
        : 'Kịch bản ban đêm tự động kích hoạt: khóa chốt an toàn chống cạy cửa, ngắt các nguồn điện không cần thiết để tối ưu hóa năng lượng. Lõi AI liên tục theo dõi đồng hồ nước thông minh để phát hiện rò rỉ bất thường vào khung giờ 2h - 4h sáng, đồng thời camera nhiệt tòa nhà quét tầm soát khói lửa 24/7.',
      icon: Moon,
      techSpecs: [
        { label: isEn ? 'Water Leak Warning' : 'Cảnh Báo Rò Rỉ Nước', value: isEn ? 'Detected within 15 mins' : 'Phát Hiện Sau 15 Phút' },
        { label: isEn ? 'Energy Efficiency' : 'Tiết Kiệm Năng Lượng', value: isEn ? '-20% Power Usage' : '-20% Điện Tiêu Thụ' },
        { label: isEn ? 'NKS Technical Response' : 'Ứng Trực Kỹ Thuật NKS', value: isEn ? 'On-site in 15 - 60 mins' : 'Có Mặt 15 - 60 Phút' }
      ],
      portalTab: 'resident-tickets',
      actionText: isEn ? 'Request NKS Technical Service' : 'Yêu Cầu Hỗ Trợ Kỹ Thuật NKS',
      visualWidget: {
        badge: isEn ? 'INFRASTRUCTURE & NIGHT SECURITY' : 'GIÁM SÁT HẠ TẦNG & AN NINH ĐÊM',
        title: isEn ? 'Energy & Safety Core Monitoring' : 'Lõi Giám Sát Năng Lượng & An Toàn',
        subtitle: isEn ? 'Smart operation system across 4 towers of The Tropical' : 'Hệ thống vận hành thông minh 4 chung cư The Tropical',
        statusColor: 'emerald',
        details: [
          { icon: Droplets, text: isEn ? 'Night water flow: Normal (0 leaks)' : 'Lưu lượng nước đêm: Bình thường (0 rò rỉ)' },
          { icon: Zap, text: isEn ? 'Power consumption: Optimized Standby Mode' : 'Điện năng tiêu thụ: Chế độ Standby tối ưu' },
          { icon: ShieldCheck, text: isEn ? 'Smoke & thermal sensors: 100% Online' : 'Cảm biến khói & nhiệt: Trực tuyến 100%' }
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
    <section id="smart-tech" key={language} className={`py-20 sm:py-24 border-b scroll-mt-20 relative overflow-hidden transition-colors duration-300 ${
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
            <span>{t('Chu Trình Tự Động Hóa 24/7', '24/7 Automation Lifecycle')}</span>
          </div>
          <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-serif font-bold tracking-tight ${
            isDark ? 'text-[#FAFAFA]' : 'text-[#0D1117]'
          }`}>
            {t('Một Ngày Trải Nghiệm Chuẩn Sống Đẳng Cấp Cùng Lõi AI', 'A Day of Luxury Living Powered by AI Core')}
          </h2>
          <p className={`text-sm sm:text-base font-light leading-relaxed ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {t(
              'Không chỉ là những thiết bị công nghệ rời rạc, Skyline liên kết toàn diện hạ tầng từ căn hộ thông minh đến hệ thống quản trị vận hành 4 chung cư The Tropical trong từng khoảnh khắc nhịp sống của cư dân.',
              'Beyond isolated smart gadgets, Skyline seamlessly integrates infrastructure from smart apartments to the 4-tower management system of The Tropical throughout every resident moment.'
            )}
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
                    {t(m.periodName)}
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
                    {t('Khung Giờ', 'Timeslot')} {current.timeLabel} • {t(current.periodName)}
                  </div>
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-serif font-bold text-white leading-snug">
                    {t(current.headline)}
                  </h3>
                </div>
              </div>

              <p className="text-sm sm:text-base text-gray-300 font-light leading-relaxed">
                {t(current.story)}
              </p>

              {/* Technical Spec Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {current.techSpecs.map((spec, sIdx) => (
                  <div 
                    key={sIdx}
                    className="p-3 bg-[#141B24] border border-white/5 rounded-none space-y-1"
                  >
                    <div className="text-[10px] text-gray-400 uppercase font-mono tracking-wider">
                      {t(spec.label)}
                    </div>
                    <div className="text-sm sm:text-base font-serif font-bold text-[#C5A880]">
                      {t(spec.value)}
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
                  <span>{t(current.actionText)}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <span className="text-[11px] text-gray-400 font-mono hidden sm:inline">
                  {t('Tích hợp 4 chung cư The Tropical', 'Integrated across 4 towers of The Tropical')}
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
                      {t(current.visualWidget.badge)}
                    </div>
                    <div className="text-sm font-serif font-bold text-white mt-0.5">
                      {t(current.visualWidget.title)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-[10px] font-mono font-bold rounded-none">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-none animate-pulse"></span>
                    <span>{t('TRỰC TUYẾN', 'ONLINE')}</span>
                  </div>
                </div>

                <div className="text-xs text-gray-400 font-light">
                  {t(current.visualWidget.subtitle)}
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
                        <span className="leading-relaxed">{t(item.text)}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Footer Security Badge */}
                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-400 font-mono">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    {t('Mã hóa bảo mật 256-bit', '256-bit Secure Encryption')}
                  </span>
                  <span>{t('Lõi AI Skyline 4.0', 'Skyline AI 4.0 Core')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
