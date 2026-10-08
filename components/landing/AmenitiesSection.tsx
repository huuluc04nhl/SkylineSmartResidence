'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { DEMO_FACILITIES, Facility } from '@/lib/dataStore';
import { 
  Star, 
  Clock, 
  Users, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Waves, 
  Dumbbell, 
  Flame, 
  UtensilsCrossed, 
  Smile, 
  Layers,
  MapPin,
  ShieldCheck
} from 'lucide-react';
import { useTheme } from '@/lib/themeContext';
import { useAuth } from '@/lib/authContext';

type FacilityFilter = 'ALL' | 'POOL' | 'FITNESS' | 'SPA' | 'DINING' | 'KIDS';

export default function AmenitiesSection() {
  const { theme } = useTheme();
  const { currentUser, isAuthenticated } = useAuth();
  const isDark = theme === 'dark';

  const [activeFilter, setActiveFilter] = useState<FacilityFilter>('ALL');

  const facilityPortalUrl = isAuthenticated
    ? currentUser?.role === 'ADMIN'
      ? '/portal?tab=admin-facilities'
      : '/portal?tab=resident-facilities'
    : '/portal';

  // Lọc tiện ích theo nhóm
  const filteredFacilities = useMemo(() => {
    if (activeFilter === 'ALL') return DEMO_FACILITIES;
    if (activeFilter === 'POOL') return DEMO_FACILITIES.filter(f => f.category === 'Hồ bơi');
    if (activeFilter === 'FITNESS') return DEMO_FACILITIES.filter(f => f.category === 'Gym' || f.category === 'Sân thể thao');
    if (activeFilter === 'SPA') return DEMO_FACILITIES.filter(f => f.category === 'Xông hơi');
    if (activeFilter === 'DINING') return DEMO_FACILITIES.filter(f => f.category === 'BBQ' || f.category === 'Nhà hàng');
    if (activeFilter === 'KIDS') return DEMO_FACILITIES.filter(f => f.category === 'Khu trẻ em');
    return DEMO_FACILITIES;
  }, [activeFilter]);

  const categories = [
    { id: 'ALL' as FacilityFilter, label: 'Tất Cả Tiện Ích', icon: Layers, count: DEMO_FACILITIES.length },
    { id: 'POOL' as FacilityFilter, label: 'Hồ Bơi Chân Mây & Resort', icon: Waves, count: DEMO_FACILITIES.filter(f => f.category === 'Hồ bơi').length },
    { id: 'FITNESS' as FacilityFilter, label: 'Gym 24/7 & Thể Thao', icon: Dumbbell, count: DEMO_FACILITIES.filter(f => f.category === 'Gym' || f.category === 'Sân thể thao').length },
    { id: 'SPA' as FacilityFilter, label: 'Xông Hơi Đá Muối VIP', icon: Flame, count: DEMO_FACILITIES.filter(f => f.category === 'Xông hơi').length },
    { id: 'DINING' as FacilityFilter, label: 'Ẩm Thực & Tiệc BBQ', icon: UtensilsCrossed, count: DEMO_FACILITIES.filter(f => f.category === 'BBQ' || f.category === 'Nhà hàng').length },
    { id: 'KIDS' as FacilityFilter, label: 'Khu Trẻ Em Sky Kids', icon: Smile, count: DEMO_FACILITIES.filter(f => f.category === 'Khu trẻ em').length },
  ];

  return (
    <section id="amenities" className={`py-20 sm:py-24 border-b scroll-mt-20 relative overflow-hidden transition-colors duration-300 ${
      isDark 
        ? 'bg-[#0A0E14] text-white border-[#1E293B]' 
        : 'bg-white text-gray-900 border-gray-200'
    }`}>
      {/* Background glow tinh tế */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#C5A880]/5 rounded-none blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-[#C5A880]/5 rounded-none blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 sm:mb-16">
          <div className="max-w-3xl space-y-3">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-none text-[11px] font-mono uppercase tracking-[0.2em] ${
              isDark 
                ? 'bg-[#141B24] border border-[#C5A880]/40 text-[#C5A880]' 
                : 'bg-slate-100 border border-[#C5A880]/60 text-amber-800'
            }`}>
              <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>Đặc Quyền Nghỉ Dưỡng 5 Sao</span>
            </div>
            <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-serif font-bold tracking-tight ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Hệ Thống Tiện Ích Đỉnh Cao The Tropical
            </h2>
            <p className={`text-sm sm:text-base font-light leading-relaxed ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Tổ hợp 8 đại tiện ích phân bổ từ Công viên nhiệt đới nội khu, Tầng 3 Thể thao & Wellness đến Tầng Tiện ích Chân mây. Toàn bộ ra vào tự động qua công nghệ nhận diện khuôn mặt FaceID và hạn mức thẻ cư dân thông minh.
            </p>
          </div>

          {/* Quick Metrics Badge */}
          <div className={`p-4 border rounded-none flex items-center gap-5 shrink-0 ${
            isDark ? 'bg-[#0E131B] border-[#1E293B]' : 'bg-slate-50 border-gray-200'
          }`}>
            <div className="border-r pr-4 border-gray-700/50">
              <div className="text-xl sm:text-2xl font-serif font-bold text-[#C5A880]">08+</div>
              <div className="text-[10px] font-mono uppercase text-gray-400">Đại tiện ích</div>
            </div>
            <div className="border-r pr-4 border-gray-700/50">
              <div className="text-xl sm:text-2xl font-serif font-bold text-emerald-400">100%</div>
              <div className="text-[10px] font-mono uppercase text-gray-400">FaceID tự động</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-serif font-bold text-sky-400">24/7</div>
              <div className="text-[10px] font-mono uppercase text-gray-400">Gym & An ninh</div>
            </div>
          </div>
        </div>

        {/* Category Filters Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-10 no-scrollbar">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeFilter === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveFilter(cat.id)}
                className={`px-4 py-2.5 text-xs font-mono uppercase tracking-wider flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer rounded-none border ${
                  isActive
                    ? isDark
                      ? 'bg-[#C5A880] text-[#0A0E14] font-bold border-[#C5A880] shadow-lg shadow-[#C5A880]/10'
                      : 'bg-[#C5A880] text-black font-bold border-[#C5A880]'
                    : isDark
                      ? 'bg-[#0E131B] text-gray-300 border-[#1E293B] hover:border-[#C5A880]/50 hover:text-white'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-[#C5A880] hover:text-gray-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? (isDark ? 'text-[#0A0E14]' : 'text-black') : 'text-[#C5A880]'}`} />
                <span>{cat.label}</span>
                <span className={`px-1.5 py-0.2 text-[10px] rounded-none font-bold ${
                  isActive 
                    ? isDark ? 'bg-black/20 text-[#0A0E14]' : 'bg-black/10 text-black' 
                    : isDark ? 'bg-[#141B24] text-gray-400' : 'bg-slate-100 text-gray-600'
                }`}>
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Facilities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredFacilities.map((facility: Facility) => {
            const occupancyPct = Math.round((facility.current_occupancy / facility.max_capacity) * 100);

            return (
              <div
                key={facility.id}
                className={`rounded-none overflow-hidden shadow-xl flex flex-col justify-between group transition-all duration-300 hover:-translate-y-1 ${
                  isDark
                    ? 'border border-[#1E293B] hover:border-[#C5A880]/70 bg-[#0E131B]'
                    : 'border border-gray-200 hover:border-[#C5A880] bg-white shadow-md'
                }`}
              >
                <div>
                  {/* Image Hero Container */}
                  <div className="relative h-52 sm:h-56 overflow-hidden">
                    <img
                      src={facility.hero_image_url}
                      alt={facility.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className={`absolute inset-0 pointer-events-none ${
                      isDark 
                        ? 'bg-gradient-to-t from-[#0E131B] via-transparent to-transparent' 
                        : 'bg-gradient-to-t from-white/90 via-transparent to-transparent'
                    }`} />

                    {/* Star Rating Badge */}
                    <div className="absolute top-3 right-3 bg-[#0A0E14]/90 text-[#C5A880] px-2.5 py-1 text-xs font-mono font-bold flex items-center gap-1 border border-[#C5A880]/50 rounded-none backdrop-blur-md shadow-md">
                      <Star className="w-3.5 h-3.5 fill-[#C5A880]" />
                      <span>{facility.rating_score.toFixed(1)}</span>
                    </div>

                    {/* Category Label */}
                    <div className={`absolute bottom-3 left-3 px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest rounded-none backdrop-blur-md border ${
                      isDark 
                        ? 'bg-[#0A0E14]/90 border-gray-700 text-gray-200' 
                        : 'bg-white/90 border-gray-200 text-gray-800 shadow-sm'
                    }`}>
                      {facility.category}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-3.5">
                    <h3 className={`font-serif text-base sm:text-lg font-bold transition-colors leading-snug line-clamp-2 min-h-[3rem] ${
                      isDark 
                        ? 'text-white group-hover:text-[#C5A880]' 
                        : 'text-gray-900 group-hover:text-[#9E8057]'
                    }`}>
                      {facility.name}
                    </h3>

                    {/* Occupancy Indicator */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Hiện tại:</span>
                        <span className={`font-bold ${occupancyPct > 80 ? 'text-rose-400' : 'text-[#C5A880]'}`}>
                          {facility.current_occupancy} / {facility.max_capacity} người ({occupancyPct}%)
                        </span>
                      </div>
                      <div className={`w-full h-1.5 overflow-hidden rounded-none ${isDark ? 'bg-[#141B24]' : 'bg-gray-200'}`}>
                        <div 
                          className={`h-full transition-all duration-500 ${occupancyPct > 80 ? 'bg-rose-500' : 'bg-[#C5A880]'}`}
                          style={{ width: `${Math.min(100, occupancyPct)}%` }}
                        />
                      </div>
                    </div>

                    {/* Specifications List */}
                    <div className={`space-y-2 text-xs border-t pt-3 ${
                      isDark ? 'text-gray-300 border-[#1E293B]' : 'text-gray-600 border-gray-100'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className={`flex items-center gap-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          <Clock className="w-3.5 h-3.5 text-[#C5A880]" /> Giờ mở cửa:
                        </span>
                        <strong className={`font-mono text-[11px] ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {facility.operating_hours}
                        </strong>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className={`flex items-center gap-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          <ShieldCheck className="w-3.5 h-3.5 text-[#C5A880]" /> Hạn mức căn:
                        </span>
                        <strong className={`font-mono text-[11px] ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {facility.max_quota_per_month} lượt/tháng
                        </strong>
                      </div>

                      <div className="pt-1 border-t border-dashed border-gray-700/40">
                        <div className="text-[10px] text-gray-400 uppercase font-mono mb-0.5">Biểu phí áp dụng:</div>
                        <div className="text-[#C5A880] font-semibold text-xs truncate">
                          {facility.pricing}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Action Button */}
                <Link
                  href={facilityPortalUrl}
                  className={`p-3.5 border-t flex items-center justify-center gap-2 text-[11px] font-mono uppercase tracking-wider font-semibold transition-colors cursor-pointer group-hover:bg-[#C5A880] group-hover:text-[#0A0E14] ${
                    isDark 
                      ? 'bg-[#141B24] border-[#1E293B] text-[#C5A880]' 
                      : 'bg-slate-50 border-gray-100 text-amber-800'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 group-hover:text-[#0A0E14]" />
                  <span>Đặt Chỗ / Đăng Ký Quota</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            );
          })}
        </div>

        {/* Bottom Banner - FaceID & Smart Access Rule */}
        <div className={`mt-14 p-6 sm:p-8 border rounded-none flex flex-col md:flex-row items-center justify-between gap-6 ${
          isDark 
            ? 'bg-[#0E131B] border-[#C5A880]/30' 
            : 'bg-amber-50/50 border-[#C5A880]/50'
        }`}>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[#C5A880]/15 border border-[#C5A880]/40 flex items-center justify-center text-[#C5A880] shrink-0 rounded-none">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className={`text-base sm:text-lg font-serif font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Cơ Chế Kiểm Soát Ra Vào Sinh Trắc Học Tự Động
              </h4>
              <p className={`text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Cư dân 4 chung cư The Tropical chỉ cần quét FaceID tại cửa kiểm soát hồ bơi, gym hoặc mở mã QR trên ứng dụng Skyline Resident để qua cổng. Không cần xếp hàng, không cần vé giấy, đảm bảo tính riêng tư và an toàn tuyệt đối.
              </p>
            </div>
          </div>

          <Link
            href={facilityPortalUrl}
            className="px-6 py-3 bg-[#C5A880] hover:bg-white text-[#0A0E14] font-mono text-xs uppercase tracking-widest font-bold transition-colors whitespace-nowrap rounded-none shrink-0 shadow-lg"
          >
            Quản Lý Thẻ & Quota Căn Hộ
          </Link>
        </div>
      </div>
    </section>
  );
}
