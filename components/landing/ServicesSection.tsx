'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  Wrench, 
  PhoneCall, 
  Clock, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Shirt, 
  Sparkle, 
  Car, 
  Activity, 
  HeartHandshake, 
  Utensils, 
  Compass, 
  ChevronRight,
  BadgeCheck,
  Zap,
  Building2
} from 'lucide-react';
import { useTheme } from '@/lib/themeContext';
import { useAuth } from '@/lib/authContext';
import { RESIDENT_SERVICES_CATALOG, ResidentServiceItem } from '@/lib/residentServiceStore';

export default function ServicesSection() {
  const { theme } = useTheme();
  const { currentUser, isAuthenticated } = useAuth();
  const isDark = theme === 'dark';

  const [selectedServiceId, setSelectedServiceId] = useState<string>(RESIDENT_SERVICES_CATALOG[0]?.id || 'srv-cleaning');

  const selectedService = RESIDENT_SERVICES_CATALOG.find(s => s.id === selectedServiceId) || RESIDENT_SERVICES_CATALOG[0];

  const servicesPortalUrl = isAuthenticated
    ? currentUser?.role === 'ADMIN'
      ? '/portal?tab=admin-services'
      : '/portal?tab=resident-services'
    : '/portal';

  const ticketPortalUrl = isAuthenticated
    ? currentUser?.role === 'ADMIN'
      ? '/portal?tab=admin-kanban'
      : '/portal?tab=resident-tickets'
    : '/portal';

  // Biểu tượng tương ứng với từng danh mục dịch vụ
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'HOUSEKEEPING':
        return Sparkle;
      case 'LAUNDRY':
        return Shirt;
      case 'CAR_CARE':
        return Car;
      case 'PERSONAL_TRAINER':
        return Activity;
      case 'SPA_WELLNESS':
        return HeartHandshake;
      case 'RESTAURANT':
        return Utensils;
      case 'TRANSPORT':
        return Compass;
      default:
        return Sparkles;
    }
  };

  return (
    <section id="services" className={`py-20 sm:py-24 border-b scroll-mt-20 relative overflow-hidden transition-colors duration-300 ${
      isDark 
        ? 'bg-[#0E131B] text-white border-[#1E293B]' 
        : 'bg-slate-50 text-gray-900 border-gray-200'
    }`}>
      {/* Background glow tinh tế */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#C5A880]/5 rounded-none blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <div className="max-w-3xl mb-14 sm:mb-16 space-y-3">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-none text-[11px] font-mono uppercase tracking-[0.2em] ${
            isDark 
              ? 'bg-[#141B24] border border-[#C5A880]/40 text-[#C5A880]' 
              : 'bg-white border border-[#C5A880]/60 text-amber-800 shadow-sm'
          }`}>
            <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
            <span>Hệ Sinh Thái Dịch Vụ Cư Dân 5 Sao</span>
          </div>
          <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-serif font-bold tracking-tight ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Dịch Vụ Quản Gia & Kỹ Thuật NKS Túc Trực 24/7
          </h2>
          <p className={`text-sm sm:text-base font-light leading-relaxed ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Đặc quyền chuẩn sống thảnh thơi tại 4 chung cư The Tropical (BS-07, BS-08, BS-09, BS-10). Từ dọn dẹp, giặt là, chăm sóc xe đến đội ngũ kỹ thuật NKS thường trực xử lý sự cố trong 15 phút, tất cả đều được vận hành chuẩn hóa trên ứng dụng di động.
          </p>
        </div>

        {/* 1. MẢNG DỊCH VỤ QUẢN GIA ĐỜI SỐNG (LIFESTYLE CONCIERGE) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
          {/* Cột trái: Danh sách các mảng dịch vụ (Tab selector) */}
          <div className="lg:col-span-5 space-y-2">
            <div className="text-[11px] font-mono uppercase tracking-widest text-[#C5A880] mb-3 flex items-center gap-2">
              <BadgeCheck className="w-4 h-4" />
              <span>Danh Mục Quản Gia Cá Nhân Hóa</span>
            </div>

            <div className="space-y-2">
              {RESIDENT_SERVICES_CATALOG.map((service: ResidentServiceItem) => {
                const IconComponent = getCategoryIcon(service.category);
                const isSelected = service.id === selectedServiceId;

                return (
                  <button
                    key={service.id}
                    onClick={() => setSelectedServiceId(service.id)}
                    className={`w-full text-left p-4 rounded-none border transition-all cursor-pointer flex items-center justify-between group ${
                      isSelected
                        ? isDark
                          ? 'bg-[#141B24] border-[#C5A880] shadow-lg'
                          : 'bg-white border-[#C5A880] shadow-md'
                        : isDark
                          ? 'bg-[#0A0E14] border-[#1E293B] hover:border-[#C5A880]/50 hover:bg-[#121822]'
                          : 'bg-white/70 border-gray-200 hover:border-[#C5A880]/60 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={`w-10 h-10 rounded-none flex items-center justify-center shrink-0 border transition-colors ${
                        isSelected
                          ? 'bg-[#C5A880] text-[#0A0E14] border-[#C5A880]'
                          : isDark
                            ? 'bg-[#141B24] text-[#C5A880] border-[#1E293B] group-hover:border-[#C5A880]/50'
                            : 'bg-slate-100 text-[#9E8057] border-gray-200'
                      }`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className={`text-sm font-semibold truncate ${
                            isSelected 
                              ? isDark ? 'text-white' : 'text-gray-900' 
                              : isDark ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            {service.name}
                          </h4>
                          {service.badge && (
                            <span className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono uppercase bg-[#C5A880]/15 text-[#C5A880] border border-[#C5A880]/30 rounded-none">
                              {service.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 truncate mt-0.5 font-light">
                          {service.tagline}
                        </p>
                      </div>
                    </div>

                    <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${
                      isSelected ? 'text-[#C5A880] translate-x-1' : 'text-gray-500 group-hover:text-gray-300'
                    }`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cột phải: Chi tiết dịch vụ được chọn & Các gói cước niêm yết */}
          <div className="lg:col-span-7">
            {selectedService && (
              <div className={`p-6 sm:p-8 border rounded-none h-full flex flex-col justify-between ${
                isDark 
                  ? 'bg-[#0A0E14] border-[#C5A880]/30 shadow-2xl' 
                  : 'bg-white border-gray-200 shadow-xl'
              }`}>
                <div className="space-y-6">
                  {/* Service Hero Info */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gray-700/40">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-[#C5A880]/20 text-[#C5A880] border border-[#C5A880]/40 rounded-none">
                          {selectedService.location}
                        </span>
                        <span className="text-[10px] font-mono text-gray-400">
                          {selectedService.operatingHours}
                        </span>
                      </div>
                      <h3 className={`text-2xl font-serif font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {selectedService.name}
                      </h3>
                      <p className={`text-xs sm:text-sm mt-1.5 leading-relaxed font-light ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {selectedService.description}
                      </p>
                    </div>

                    <div className="sm:text-right shrink-0">
                      <div className="text-2xl font-serif font-bold text-[#C5A880]">
                        ⭐ {selectedService.rating.toFixed(2)}
                      </div>
                      <div className="text-[10px] font-mono uppercase text-gray-400">
                        {selectedService.reviewCount} lượt đánh giá 5★
                      </div>
                    </div>
                  </div>

                  {/* Bảng giá các gói dịch vụ tiêu biểu */}
                  <div className="space-y-3">
                    <div className="text-xs font-mono uppercase tracking-wider text-gray-400 flex items-center justify-between">
                      <span>Bảng Giá Niêm Yết & Hạng Mục</span>
                      <span className="text-[#C5A880]">Cộng vào Hóa Đơn Tháng hoặc Trả Ngay</span>
                    </div>

                    <div className="space-y-2.5">
                      {selectedService.packages.map((pkg) => (
                        <div
                          key={pkg.id}
                          className={`p-3.5 border rounded-none flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            isDark 
                              ? 'bg-[#141B24]/70 border-[#1E293B]' 
                              : 'bg-slate-50 border-gray-200'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="font-semibold text-sm flex items-center gap-2">
                              <span className={isDark ? 'text-white' : 'text-gray-900'}>{pkg.name}</span>
                              {pkg.estimatedDuration && (
                                <span className="text-[10px] font-mono text-[#C5A880] flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {pkg.estimatedDuration}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                              {pkg.description}
                            </p>
                          </div>

                          <div className="sm:text-right shrink-0">
                            <div className="font-mono font-bold text-[#C5A880] text-sm sm:text-base">
                              {pkg.unitPrice === 0 ? 'Miễn Phí Đặt Bàn' : `${pkg.unitPrice.toLocaleString('vi-VN')} đ / ${pkg.unit}`}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-6 mt-6 border-t border-gray-700/40 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-gray-400 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Nhân viên có hồ sơ e-KYC minh bạch, bảo hiểm trách nhiệm</span>
                  </div>

                  <Link
                    href={servicesPortalUrl}
                    className="w-full sm:w-auto px-6 py-3 bg-[#C5A880] hover:bg-white text-[#0A0E14] font-mono text-xs uppercase tracking-widest font-bold transition-colors flex items-center justify-center gap-2 rounded-none shadow-lg cursor-pointer"
                  >
                    <span>Đặt Lịch Trên App Resident</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2. MẢNG KỸ THUẬT NKS TÚC TRỰC 24/7 (24/7 TECHNICAL ASSISTANCE) */}
        <div className={`p-8 sm:p-10 border rounded-none relative overflow-hidden ${
          isDark 
            ? 'bg-[#0A0E14] border-[#C5A880]/50 shadow-2xl' 
            : 'bg-white border-[#C5A880]/60 shadow-xl'
        }`}>
          {/* Subtle High-Tech Grid pattern */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#C5A880]/5 pointer-events-none rounded-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            {/* Cột trái: Cam kết dịch vụ kỹ thuật */}
            <div className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 text-[11px] font-mono uppercase tracking-widest rounded-none">
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Cam Kết SLA Kỹ Thuật 24/7</span>
              </div>

              <h3 className={`text-2xl sm:text-3xl font-serif font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Đội Ngũ Kỹ Sư NKS Thường Trực — Có Mặt Sau 15 Phút
              </h3>

              <p className={`text-xs sm:text-sm leading-relaxed max-w-3xl font-light ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Hệ thống kỹ thuật căn hộ thông minh tại 4 chung cư The Tropical được bảo bọc bởi trạm kỹ thuật NKS đặt ngay tại tầng hầm và cụm kỹ thuật BS-07. Mọi sự cố về điện sinh hoạt, rò rỉ nước ngầm, khóa cửa FaceID hay điều hòa không khí đều được tiếp nhận và xử lý cấp tốc.
              </p>

              {/* 3 Trụ cột SLA */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3">
                <div className={`p-3.5 border rounded-none ${isDark ? 'bg-[#141B24] border-[#1E293B]' : 'bg-slate-50 border-gray-200'}`}>
                  <div className="text-xl font-serif font-bold text-emerald-400">15 Phút</div>
                  <div className="text-xs font-semibold mt-0.5">Sự Cố Khẩn Cấp</div>
                  <div className="text-[11px] text-gray-400 mt-1 font-light">Rò rỉ ống nước, mất điện, kẹt khóa cửa thông minh.</div>
                </div>

                <div className={`p-3.5 border rounded-none ${isDark ? 'bg-[#141B24] border-[#1E293B]' : 'bg-slate-50 border-gray-200'}`}>
                  <div className="text-xl font-serif font-bold text-[#C5A880]">60 Phút</div>
                  <div className="text-xs font-semibold mt-0.5">Sửa Chữa Tiêu Chuẩn</div>
                  <div className="text-[11px] text-gray-400 mt-1 font-light">Bảo dưỡng điều hòa, thay lọc nước, kiểm tra thiết bị IoT.</div>
                </div>

                <div className={`p-3.5 border rounded-none ${isDark ? 'bg-[#141B24] border-[#1E293B]' : 'bg-slate-50 border-gray-200'}`}>
                  <div className="text-xl font-serif font-bold text-sky-400">Minh Bạch</div>
                  <div className="text-xs font-semibold mt-0.5">Theo Dõi Trên App</div>
                  <div className="text-[11px] text-gray-400 mt-1 font-light">Xem ảnh trước/sau sửa chữa, ký nhận điện tử & bảo hành.</div>
                </div>
              </div>
            </div>

            {/* Cột phải: Hotline 1900 8899 & Nút hành động tạo Ticket */}
            <div className={`lg:col-span-4 p-6 border rounded-none text-center space-y-4 ${
              isDark ? 'bg-[#141B24] border-[#C5A880]/40' : 'bg-slate-100 border-[#C5A880]/60'
            }`}>
              <div className="w-12 h-12 mx-auto bg-[#C5A880]/20 border border-[#C5A880] flex items-center justify-center text-[#C5A880] rounded-none">
                <PhoneCall className="w-6 h-6 animate-pulse" />
              </div>

              <div>
                <div className="text-[11px] font-mono uppercase tracking-widest text-gray-400">
                  Hotline Kỹ Thuật 24/7 (Miễn Phí)
                </div>
                <div className="text-3xl font-serif font-bold text-[#C5A880] tracking-wider mt-1">
                  1900 8899
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Bộ phận Kỹ thuật & Quản gia The Tropical
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <Link
                  href={ticketPortalUrl}
                  className="w-full py-3 bg-[#C5A880] hover:bg-white text-[#0A0E14] font-mono text-xs uppercase tracking-wider font-bold transition-colors flex items-center justify-center gap-2 rounded-none shadow-md cursor-pointer"
                >
                  <Wrench className="w-4 h-4" />
                  <span>Tạo Yêu Cầu Kỹ Thuật (Ticket)</span>
                </Link>

                <p className="text-[10px] text-gray-400 font-mono">
                  Hỗ trợ cả cư dân chủ hộ và khách thuê dài hạn
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
