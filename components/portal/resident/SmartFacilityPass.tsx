'use client';

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  QrCode, 
  ScanFace, 
  CheckCircle2, 
  Sparkles, 
  Star, 
  Users, 
  Clock, 
  ShieldCheck, 
  Waves, 
  Dumbbell, 
  Flame, 
  Smile, 
  UtensilsCrossed, 
  History,
  DoorOpen,
  CalendarCheck,
  Calendar,
  XCircle,
  Plus,
  ArrowRight,
  Check,
  Wifi,
  Eye,
  X,
  Radio,
  SlidersHorizontal,
  Info
} from 'lucide-react';
import { User } from '@/lib/dataStore';
import SkylineLogo from '@/components/shared/SkylineLogo';
import ResidentSmartCard from './ResidentSmartCard';
import { 
  getFacilityCheckinLogs, 
  addFacilityCheckinLog, 
  getFacilityBookings, 
  createFacilityBooking, 
  cancelFacilityBooking,
  checkinWithTicket,
  getFacilityMonthlyQuota,
  FacilityCheckinLog,
  FacilityBooking
} from '@/lib/facilityStore';

interface SmartFacilityPassProps {
  currentUser: User;
}

export default function SmartFacilityPass({ currentUser }: SmartFacilityPassProps) {
  const aptCode = currentUser.apartment_code || '12A05';
  const isOwner = currentUser.role === 'OWNER';
  const userName = currentUser?.full_name || (currentUser as any)?.fullname || 'Cư Dân';

  // 3 Chức năng rõ ràng
  const [activeTab, setActiveTab] = useState<'DISCOVER' | 'BOOKING' | 'LOGS'>('DISCOVER');
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'SPORTS' | 'WELLNESS' | 'PARTY'>('ALL');
  const [logFilter, setLogFilter] = useState<'ALL' | 'fac-pool' | 'fac-gym' | 'fac-sauna' | 'fac-kids' | 'fac-bbq'>('ALL');

  // Modal State
  const [showSmartCardModal, setShowSmartCardModal] = useState(false);
  const [turnstileModalFac, setTurnstileModalFac] = useState<any | null>(null);
  const [turnstileMethod, setTurnstileMethod] = useState<'NFC' | 'FACE_ID'>('NFC');
  const [isTurnstileScanning, setIsTurnstileScanning] = useState(false);
  const [turnstileSuccessMsg, setTurnstileSuccessMsg] = useState<string | null>(null);

  // Danh mục 5 tiện ích chính với dữ liệu quy chế minh bạch
  const amenitiesList = [
    {
      id: 'fac-pool',
      name: 'Hồ Bơi Vô Cực Chân Mây (Panoramic Sky Pool)',
      category: 'SPORTS',
      location: 'Tầng 25 (Sân Thượng Tòa Chung Cư)',
      hours: '06:00 - 22:00',
      density: '18% (Thoáng đãng)',
      temp: '28°C • Nước lọc ozone',
      image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600&auto=format&fit=crop&q=80',
      icon: Waves,
      accessType: 'FREE_ENTRY',
      accessBadge: 'VÀO TỰ DO (THẺ NFC / FACEID)',
      price: 'Miễn phí theo Thẻ cư dân'
    },
    {
      id: 'fac-gym',
      name: 'Trung Tâm Thể Hình Đẳng Cấp Technogym',
      category: 'SPORTS',
      location: 'Tầng 3 (Khu Tiện Ích Thể Thao)',
      hours: 'Mở cửa 24/7',
      density: '38% (Bình thường)',
      temp: '22°C • Điều hòa ion âm',
      image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=80',
      icon: Dumbbell,
      accessType: 'FREE_ENTRY',
      accessBadge: 'VÀO TỰ DO (24/7)',
      price: 'Miễn phí theo Thẻ cư dân'
    },
    {
      id: 'fac-sauna',
      name: 'Phòng Xông Hơi Đá Muối Himalaya & Jacuzzi',
      category: 'WELLNESS',
      location: 'Tầng 3 (Khu Chăm Sóc Sức Khỏe VIP)',
      hours: '08:00 - 21:30',
      density: '15% (Rất vắng)',
      temp: '45°C • Tinh dầu thảo mộc',
      image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&auto=format&fit=crop&q=80',
      icon: Flame,
      accessType: 'FREE_ENTRY',
      accessBadge: 'VÀO TỰ DO (THẺ NFC)',
      price: 'Miễn phí theo Thẻ cư dân'
    },
    {
      id: 'fac-kids',
      name: 'Khu Vui Chơi Trẻ Em Sky Kids Zone',
      category: 'WELLNESS',
      location: 'Tầng 1 (Sảnh Thương Mại Tòa A)',
      hours: '07:00 - 21:00',
      density: '30% (Vừa)',
      temp: '24°C • Sàn đệm kháng khuẩn',
      image: 'https://images.unsplash.com/photo-1566454544259-f4b94c3d758c?w=600&auto=format&fit=crop&q=80',
      icon: Smile,
      accessType: 'FREE_ENTRY',
      accessBadge: 'VÀO TỰ DO (CÓ NGƯỜI LỚN)',
      price: 'Miễn phí cho cư dân'
    },
    {
      id: 'fac-bbq',
      name: 'Vườn Nướng Sky BBQ Panoramic Sân Thượng',
      category: 'PARTY',
      location: 'Tầng 25 (Khu Vườn Nhật Bản)',
      hours: '17:00 - 23:00 (Theo ca)',
      density: 'Sẵn sàng 4/6 chòi nướng',
      temp: 'Gió trời tự nhiên',
      image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
      icon: UtensilsCrossed,
      accessType: 'BOOKING_REQUIRED',
      accessBadge: 'ĐĂNG KÝ TRƯỚC THEO CA',
      price: '200.000 đ / lượt (Phí dọn dẹp vệ sinh)'
    },
  ];

  // Dữ liệu thực tế từ Store (Không dữ liệu ảo)
  const [accessLogs, setAccessLogs] = useState<FacilityCheckinLog[]>(() => getFacilityCheckinLogs(aptCode));
  const [bookings, setBookings] = useState<FacilityBooking[]>(() => getFacilityBookings(aptCode));
  const [quota, setQuota] = useState(() => getFacilityMonthlyQuota(aptCode));

  // State Form đặt chỗ
  const todayStr = new Date().toISOString().split('T')[0];
  const [bookingFacilityId, setBookingFacilityId] = useState('fac-bbq');
  const [bookingDate, setBookingDate] = useState(todayStr);
  const [bookingTimeSlot, setBookingTimeSlot] = useState('18:00 - 20:00 (Buổi tối)');
  const [bookingGuestCount, setBookingGuestCount] = useState(4);
  const [bookingNotes, setBookingNotes] = useState('');
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const handleLogAdded = () => setAccessLogs(getFacilityCheckinLogs(aptCode));
    const handleBooked = () => {
      setBookings(getFacilityBookings(aptCode));
      setQuota(getFacilityMonthlyQuota(aptCode));
    };

    window.addEventListener('skyline_facility_log_added', handleLogAdded);
    window.addEventListener('skyline_facility_booked', handleBooked);

    return () => {
      window.removeEventListener('skyline_facility_log_added', handleLogAdded);
      window.removeEventListener('skyline_facility_booked', handleBooked);
    };
  }, [aptCode]);

  // Xử lý xác nhận check-in qua cổng Turnstile
  const handleExecuteTurnstileCheckin = () => {
    if (!turnstileModalFac || isTurnstileScanning) return;
    setIsTurnstileScanning(true);

    setTimeout(() => {
      setIsTurnstileScanning(false);
      const methodText = turnstileMethod === 'NFC' ? 'Thẻ Cư Dân NFC' : 'FaceID AI 3D';
      
      // Ghi log thực tế vào Store
      const updated = addFacilityCheckinLog(aptCode, {
        facilityId: turnstileModalFac.id,
        facilityName: turnstileModalFac.name,
        userName: userName,
        role: isOwner ? 'Chủ Hộ (Master)' : 'Người Nhà',
        method: turnstileMethod === 'NFC' ? 'NFC_CARD' : 'FACE_ID',
        cardUid: `NFC-SKY-${aptCode}-01`,
        status: 'SUCCESS',
        detail: `Xác thực thành công bằng ${methodText} tại cổng kiểm soát ${turnstileModalFac.name} (${turnstileModalFac.location}) • Cổng mở 0.3s`
      });
      setAccessLogs(updated);

      setTurnstileSuccessMsg(`🎉 BÍP! Cổng kiểm soát ${turnstileModalFac.name} đã mở tự động (0.28s). Xin chào cư dân ${userName}!`);
      setTimeout(() => {
        setTurnstileSuccessMsg(null);
        setTurnstileModalFac(null);
      }, 2500);
    }, 700);
  };

  // Quẹt vé điện tử QR để vào cửa
  const handleCheckinTicket = (ticketCode: string) => {
    const result = checkinWithTicket(aptCode, ticketCode);
    if (result.success) {
      alert(`✓ ${result.message}`);
      setBookings(getFacilityBookings(aptCode));
      setAccessLogs(getFacilityCheckinLogs(aptCode));
    } else {
      alert(`⚠️ ${result.message}`);
    }
  };

  // Tạo đặt chỗ mới
  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault();
    const fac = amenitiesList.find(f => f.id === bookingFacilityId) || amenitiesList[4];
    const { bookings: updated, newBooking } = createFacilityBooking(
      aptCode,
      fac.id,
      fac.name,
      bookingDate,
      bookingTimeSlot,
      userName,
      fac.price,
      bookingGuestCount,
      bookingNotes
    );
    setBookings(updated);
    setQuota(getFacilityMonthlyQuota(aptCode));
    setBookingNotes('');
    setBookingSuccessMsg(`🎉 Đặt chỗ thành công! Mã vé điện tử: [${newBooking.ticketCode}]. Bạn có thể quẹt vé tại cổng khi đến giờ sử dụng.`);
    setTimeout(() => setBookingSuccessMsg(null), 6000);
  };

  // Hủy đặt chỗ
  const handleCancelBooking = (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn hủy lịch đặt tiện ích này không? Lượt quota sẽ được hoàn lại.')) return;
    const updated = cancelFacilityBooking(aptCode, id);
    setBookings(updated);
    setQuota(getFacilityMonthlyQuota(aptCode));
  };

  const filteredAmenities = amenitiesList.filter(item => {
    if (filterCategory === 'ALL') return true;
    return item.category === filterCategory;
  });

  const filteredLogs = accessLogs.filter(log => {
    if (logFilter === 'ALL') return true;
    return log.facilityId === logFilter;
  });

  return (
    <div className="space-y-6 w-full animate-fadeIn">
      {/* ============================================================= */}
      {/* 1. HEADER CHÍNH: ĐỊNH DANH & THỐNG KÊ QUYỀN LỢI THỰC TẾ       */}
      {/* ============================================================= */}
      <div className="p-5 bg-gradient-to-r from-[#121820] via-[#161F2C] to-[#121820] border border-[#2A374A] rounded-xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-[11px] uppercase tracking-[0.2em] text-[#C5A880] font-bold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#C5A880]" />
            <span>Trung Tâm Dịch Vụ & Tiện Ích 5 Sao Căn Hộ {aptCode}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-white flex items-center gap-2">
            <span>Hệ Thống Tiện Ích Cư Dân & Cổng Kiểm Soát Turnstile AI</span>
          </h2>
          <p className="text-xs text-gray-400 font-mono flex flex-wrap items-center gap-2">
            <span>Chủ Hộ: <strong className="text-white">{userName}</strong></span>
            <span className="text-gray-600">•</span>
            <span className="text-emerald-400">Gym & Hồ bơi: Miễn phí không giới hạn</span>
            <span className="text-gray-600">•</span>
            <span>Cổng Barrier 0.28s</span>
          </p>
        </div>

        {/* Quick Actions & Metrics */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="px-3.5 py-2 bg-[#0D1117] border border-[#2A374A] rounded-lg text-xs flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="text-[9px] uppercase tracking-wider text-gray-400 font-mono">Quota BBQ Tháng</div>
              <div className="font-mono font-bold text-[#C5A880]">{quota.remaining} / {quota.max} lượt</div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowSmartCardModal(true)}
            className="px-3.5 py-2 bg-[#1A2332] hover:bg-[#253247] border border-[#C5A880]/50 hover:border-[#C5A880] text-white text-xs font-bold uppercase rounded-lg transition-all flex items-center gap-2 shadow-md"
          >
            <CreditCard className="w-4 h-4 text-[#C5A880]" />
            <span>Thẻ Cư Dân VIP 3D</span>
          </button>
        </div>
      </div>

      {/* ============================================================= */}
      {/* 2. THANH ĐIỀU HƯỚNG 3 CHỨC NĂNG RÕ RÀNG (WORKFLOW TABS)       */}
      {/* ============================================================= */}
      <div className="flex items-center gap-2 border-b border-[#222B35] pb-2 overflow-x-auto">
        {/* Chức năng 1 */}
        <button
          type="button"
          onClick={() => setActiveTab('DISCOVER')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'DISCOVER'
              ? 'bg-[#C5A880] text-[#0D1117] shadow-lg'
              : 'bg-[#121820] text-gray-400 hover:text-white border border-[#222B35]'
          }`}
        >
          <DoorOpen className="w-4 h-4" />
          <span>1. Danh Mục Tiện Ích & Cổng Vào Tự Động (5)</span>
        </button>

        {/* Chức năng 2 */}
        <button
          type="button"
          onClick={() => setActiveTab('BOOKING')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'BOOKING'
              ? 'bg-[#C5A880] text-[#0D1117] shadow-lg'
              : 'bg-[#121820] text-gray-400 hover:text-white border border-[#222B35]'
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          <span>2. Đăng Ký Đặt Chỗ & Vé Điện Tử ({bookings.filter(b => b.status === 'CONFIRMED').length})</span>
        </button>

        {/* Chức năng 3 */}
        <button
          type="button"
          onClick={() => setActiveTab('LOGS')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'LOGS'
              ? 'bg-[#C5A880] text-[#0D1117] shadow-lg'
              : 'bg-[#121820] text-gray-400 hover:text-white border border-[#222B35]'
          }`}
        >
          <History className="w-4 h-4" />
          <span>3. Nhật Ký Ra Vào Tiện Ích ({accessLogs.length})</span>
        </button>
      </div>

      {/* ============================================================= */}
      {/* CHỨC NĂNG 1: KHÁM PHÁ TIỆN ÍCH & CHECK-IN CỔNG TURNSTILE      */}
      {/* ============================================================= */}
      {activeTab === 'DISCOVER' && (
        <div className="space-y-5">
          {/* Bộ lọc loại tiện ích */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#121820] p-3 border border-[#222B35] rounded-lg">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button
                type="button"
                onClick={() => setFilterCategory('ALL')}
                className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${
                  filterCategory === 'ALL' ? 'bg-[#C5A880] text-[#0D1117]' : 'bg-[#161D26] text-gray-400 hover:text-white'
                }`}
              >
                Tất Cả (5)
              </button>
              <button
                type="button"
                onClick={() => setFilterCategory('SPORTS')}
                className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${
                  filterCategory === 'SPORTS' ? 'bg-[#C5A880] text-[#0D1117]' : 'bg-[#161D26] text-gray-400 hover:text-white'
                }`}
              >
                Thể Thao & Hồ Bơi (2)
              </button>
              <button
                type="button"
                onClick={() => setFilterCategory('WELLNESS')}
                className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${
                  filterCategory === 'WELLNESS' ? 'bg-[#C5A880] text-[#0D1117]' : 'bg-[#161D26] text-gray-400 hover:text-white'
                }`}
              >
                Sức Khỏe & Trẻ Em (2)
              </button>
              <button
                type="button"
                onClick={() => setFilterCategory('PARTY')}
                className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${
                  filterCategory === 'PARTY' ? 'bg-[#C5A880] text-[#0D1117]' : 'bg-[#161D26] text-gray-400 hover:text-white'
                }`}
              >
                Tiệc Nướng BBQ (1)
              </button>
            </div>

            <div className="text-[11px] text-gray-400 font-mono hidden sm:block">
              * Quẹt thẻ NFC hoặc quét FaceID tại cổng barrier để vào cửa
            </div>
          </div>

          {/* Lưới hiển thị các tiện ích */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredAmenities.map((fac) => {
              const Icon = fac.icon;
              const isFreeEntry = fac.accessType === 'FREE_ENTRY';

              return (
                <div
                  key={fac.id}
                  className="bg-[#121820] border border-[#222B35] hover:border-[#C5A880]/60 transition-all rounded-xl overflow-hidden flex flex-col justify-between group shadow-lg"
                >
                  {/* Image & Badges */}
                  <div className="relative h-44 overflow-hidden">
                    <img
                      src={fac.image}
                      alt={fac.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#121820] via-[#121820]/30 to-transparent" />

                    {/* Badge Giờ Hoạt Động */}
                    <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-sm border border-[#222B35] px-2.5 py-1 text-[10px] text-white flex items-center gap-1.5 font-mono rounded">
                      <Clock className="w-3 h-3 text-[#C5A880]" />
                      <span>{fac.hours}</span>
                    </div>

                    {/* Badge Quyền Truy Cập */}
                    <div className="absolute top-3 right-3">
                      <span className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase rounded border ${
                        isFreeEntry 
                          ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50' 
                          : 'bg-amber-950/90 text-amber-300 border-amber-500/50'
                      }`}>
                        {isFreeEntry ? 'CỔNG TỰ ĐỘNG' : 'CẦN ĐẶT LỊCH'}
                      </span>
                    </div>

                    {/* Tên & Vị trí */}
                    <div className="absolute bottom-2.5 left-3.5 right-3 text-white">
                      <div className="text-sm font-bold font-serif flex items-center gap-1.5">
                        <Icon className="w-4 h-4 text-[#C5A880] shrink-0" />
                        <span className="line-clamp-1">{fac.name}</span>
                      </div>
                      <div className="text-[10.5px] text-gray-300 font-mono mt-0.5">
                        {fac.location}
                      </div>
                    </div>
                  </div>

                  {/* Body Thông số chi tiết */}
                  <div className="p-4 space-y-3.5 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-[11px] bg-[#0D1117] p-2.5 rounded border border-[#1F2937]">
                        <div>
                          <div className="text-[9.5px] text-gray-400 uppercase">Mật độ hiện tại:</div>
                          <div className="font-semibold text-emerald-400 mt-0.5 flex items-center gap-1">
                            <Users className="w-3 h-3" /> {fac.density}
                          </div>
                        </div>
                        <div>
                          <div className="text-[9.5px] text-gray-400 uppercase">Môi trường:</div>
                          <div className="font-semibold text-gray-200 mt-0.5">{fac.temp}</div>
                        </div>
                      </div>

                      <div className="text-[11px] text-gray-400 flex items-center justify-between pt-1">
                        <span>Biểu phí:</span>
                        <strong className="text-[#C5A880]">{fac.price}</strong>
                      </div>
                    </div>

                    {/* Nút hành động rõ ràng theo loại tiện ích */}
                    <div className="pt-2 border-t border-[#1F2937]">
                      {isFreeEntry ? (
                        <button
                          type="button"
                          onClick={() => {
                            setTurnstileModalFac(fac);
                            setTurnstileSuccessMsg(null);
                          }}
                          className="w-full py-2.5 px-3 bg-gradient-to-r from-[#C5A880] to-[#E2D4BF] hover:from-[#d5b991] hover:to-white text-[#0D1117] text-xs font-bold uppercase rounded-lg transition-all flex items-center justify-center gap-2 shadow-md"
                        >
                          <DoorOpen className="w-4 h-4" />
                          <span>Vào Cửa Tiện Ích (Check-in)</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setBookingFacilityId(fac.id);
                            setActiveTab('BOOKING');
                          }}
                          className="w-full py-2.5 px-3 bg-[#1A2332] hover:bg-[#253247] border border-amber-500/50 hover:border-amber-400 text-amber-300 text-xs font-bold uppercase rounded-lg transition-all flex items-center justify-center gap-2 shadow-md"
                        >
                          <CalendarCheck className="w-4 h-4 text-amber-400" />
                          <span>Đăng Ký Đặt Lịch Giữ Chỗ</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* CHỨC NĂNG 2: ĐẶT CHỖ TIỆN ÍCH & VÉ ĐIỆN TỬ QR                   */}
      {/* ============================================================= */}
      {activeTab === 'BOOKING' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Bên Trái: Form Đăng Ký Đặt Chỗ (5 Cột) */}
          <div className="lg:col-span-5">
            <form onSubmit={handleCreateBooking} className="p-5 bg-[#121820] border border-[#2A374A] rounded-xl space-y-4 shadow-xl">
              <div className="border-b border-[#222B35] pb-3">
                <div className="text-[10px] uppercase tracking-[0.2em] text-[#C5A880] font-bold">
                  Quy Trình 3 Bước Đơn Giản
                </div>
                <h3 className="font-serif text-lg text-white font-bold">
                  Đăng Ký Đặt Chỗ Tiện Ích Riêng Tư
                </h3>
              </div>

              {bookingSuccessMsg && (
                <div className="p-3 bg-emerald-950 border border-emerald-500 text-emerald-200 text-xs rounded leading-relaxed animate-fadeIn">
                  {bookingSuccessMsg}
                </div>
              )}

              {/* Bước 1: Tiện ích */}
              <div className="space-y-1.5">
                <label className="text-[10.5px] text-gray-300 font-semibold uppercase block">
                  1. Chọn tiện ích muốn sử dụng:
                </label>
                <select
                  value={bookingFacilityId}
                  onChange={(e) => setBookingFacilityId(e.target.value)}
                  className="w-full bg-[#161D26] border border-[#2A374A] p-2.5 text-white text-xs rounded focus:outline-none focus:border-[#C5A880]"
                >
                  <option value="fac-bbq">Vườn Nướng Sky BBQ Panoramic (Tầng 25)</option>
                  <option value="fac-pool">Chòi Nghỉ Hồ Bơi Vô Cực (Tầng 25)</option>
                  <option value="fac-sauna">Phòng Xông Hơi VIP Riêng Tư (Tầng 3)</option>
                </select>
              </div>

              {/* Bước 2: Ngày & Giờ */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10.5px] text-gray-300 font-semibold uppercase block">
                    2. Ngày đặt:
                  </label>
                  <input
                    type="date"
                    min={todayStr}
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full bg-[#161D26] border border-[#2A374A] p-2 text-white text-xs rounded focus:outline-none focus:border-[#C5A880]"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10.5px] text-gray-300 font-semibold uppercase block">
                    Khung giờ:
                  </label>
                  <select
                    value={bookingTimeSlot}
                    onChange={(e) => setBookingTimeSlot(e.target.value)}
                    className="w-full bg-[#161D26] border border-[#2A374A] p-2 text-white text-xs rounded focus:outline-none focus:border-[#C5A880]"
                  >
                    <option>06:00 - 08:00 (Sáng sớm)</option>
                    <option>16:00 - 18:00 (Buổi chiều)</option>
                    <option>18:00 - 20:00 (Buổi tối - Giờ đẹp)</option>
                    <option>20:00 - 22:00 (Đêm muộn)</option>
                  </select>
                </div>
              </div>

              {/* Bước 3: Số người & Ghi chú */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10.5px] text-gray-300 font-semibold uppercase block">
                    3. Số người tham gia:
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={bookingGuestCount}
                    onChange={(e) => setBookingGuestCount(Number(e.target.value))}
                    className="w-full bg-[#161D26] border border-[#2A374A] p-2 text-white text-xs rounded focus:outline-none focus:border-[#C5A880]"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10.5px] text-gray-300 font-semibold uppercase block">
                    Người đại diện đặt:
                  </label>
                  <input
                    type="text"
                    value={userName}
                    disabled
                    className="w-full bg-[#0D1117] border border-[#2A374A] p-2 text-gray-400 text-xs rounded cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10.5px] text-gray-300 font-semibold uppercase block">
                  Ghi chú yêu cầu đặc biệt (tùy chọn):
                </label>
                <input
                  type="text"
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  placeholder="VD: Cần 2 bếp nướng, chuẩn bị thêm bàn ghế..."
                  className="w-full bg-[#161D26] border border-[#2A374A] p-2 text-white text-xs rounded focus:outline-none focus:border-[#C5A880]"
                />
              </div>

              <div className="p-3 bg-[#0D1117] border border-[#222B35] rounded flex items-center justify-between text-xs">
                <span className="text-gray-400">Biểu phí vệ sinh:</span>
                <span className="text-[#C5A880] font-bold">
                  {bookingFacilityId === 'fac-bbq' ? '200.000 đ / lượt' : 'Miễn phí cho cư dân'}
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#C5A880] hover:bg-[#d5b991] text-[#0D1117] text-xs font-bold uppercase rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg"
              >
                <Check className="w-4 h-4" />
                <span>Xác Nhận Đặt Chỗ & Tạo Vé QR</span>
              </button>
            </form>
          </div>

          {/* Bên Phải: Quản Lý Vé Điện Tử Của Căn Hộ (7 Cột) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-5 bg-[#121820] border border-[#2A374A] rounded-xl space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-[#222B35] pb-3">
                <div className="text-xs uppercase tracking-wider text-[#C5A880] font-bold flex items-center gap-2">
                  <QrCode className="w-4 h-4" /> 
                  <span>Ví Vé Điện Tử Tiện Ích Căn Hộ {aptCode} ({bookings.length} Vé)</span>
                </div>
                <div className="text-[11px] text-gray-400 font-mono">
                  Quẹt vé QR trực tiếp tại cổng
                </div>
              </div>

              {bookings.length === 0 ? (
                <div className="p-8 text-center bg-[#0D1117] border border-[#222B35] rounded-lg space-y-2">
                  <div className="w-10 h-10 rounded-full bg-[#161D26] border border-[#2A374A] flex items-center justify-center mx-auto text-gray-400">
                    <Calendar className="w-5 h-5 text-[#C5A880]" />
                  </div>
                  <div className="text-xs font-bold text-white">Chưa có vé đặt chỗ nào</div>
                  <div className="text-[11px] text-gray-400 max-w-sm mx-auto leading-relaxed">
                    Hãy điền form bên trái để đăng ký Vườn nướng Sky BBQ hoặc Chòi nghỉ Hồ bơi cho gia đình.
                  </div>
                </div>
              ) : (
                <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                  {bookings.map((b) => {
                    const isConfirmed = b.status === 'CONFIRMED';
                    const isCheckedIn = b.status === 'CHECKED_IN';

                    return (
                      <div 
                        key={b.id}
                        className={`p-4 bg-[#0D1117] border rounded-lg space-y-3 transition-all ${
                          isConfirmed ? 'border-[#2A374A]' : isCheckedIn ? 'border-emerald-500/40 bg-emerald-950/10' : 'border-gray-800 opacity-60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-bold text-white flex items-center gap-2">
                              <span>{b.facilityName}</span>
                              {isCheckedIn && (
                                <span className="text-[10px] text-emerald-400 font-mono font-normal">
                                  (Đã quét vé vào cửa)
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-gray-300 mt-0.5">
                              Ngày: <strong className="text-white">{b.bookingDate}</strong> • Khung: <strong className="text-white">{b.timeSlot}</strong>
                            </div>
                            <div className="text-[10px] text-gray-400">
                              Người đặt: {b.bookerName} • Số lượng: {b.guestCount || 2} người {b.notes ? `• Ghi chú: ${b.notes}` : ''}
                            </div>
                          </div>

                          <span className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded uppercase border ${
                            isConfirmed 
                              ? 'bg-amber-950 text-amber-300 border-amber-500/40' 
                              : isCheckedIn
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                                : 'bg-gray-800 text-gray-400 border-gray-600'
                          }`}>
                            {isConfirmed ? 'ĐÃ XÁC NHẬN' : isCheckedIn ? '✓ ĐÃ CHECK-IN' : '✕ ĐÃ HỦY'}
                          </span>
                        </div>

                        {/* Mã QR & Code Strip */}
                        <div className="p-3 bg-[#161D26] border border-[#222B35] rounded flex items-center justify-between gap-3">
                          <div className="space-y-0.5">
                            <div className="text-[9px] text-gray-400 uppercase font-mono">Mã Vé Điện Tử Check-in:</div>
                            <div className="text-sm font-mono font-bold text-[#C5A880]">{b.ticketCode}</div>
                            <div className="text-[10px] text-gray-400">Xuất trình tại đầu đọc mã QR cổng Barrier</div>
                          </div>

                          <div className="p-1 bg-white rounded shrink-0 shadow">
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=${b.ticketCode}`}
                              alt="Ticket QR"
                              className="w-14 h-14 object-contain"
                            />
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center justify-between pt-1">
                          {isConfirmed ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleCancelBooking(b.id)}
                                className="text-xs text-red-400 hover:text-red-300 font-semibold transition-colors flex items-center gap-1"
                              >
                                <XCircle className="w-3.5 h-3.5" /> Hủy Đặt Chỗ
                              </button>

                              <button
                                type="button"
                                onClick={() => handleCheckinTicket(b.ticketCode)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded transition-colors flex items-center gap-1.5 shadow"
                              >
                                <DoorOpen className="w-3.5 h-3.5" /> Quẹt Vé Vào Cổng Ngay
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] text-gray-500 italic">
                              {isCheckedIn ? 'Vé đã được sử dụng thành công.' : 'Lịch đặt đã bị hủy.'}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* CHỨC NĂNG 3: NHẬT KÝ SỬ DỤNG TIỆN ÍCH THỜI GIAN THỰC          */}
      {/* ============================================================= */}
      {activeTab === 'LOGS' && (
        <div className="p-5 bg-[#121820] border border-[#2A374A] rounded-xl space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#222B35] pb-3">
            <div>
              <div className="text-xs uppercase tracking-wider text-[#C5A880] font-bold flex items-center gap-2">
                <History className="w-4 h-4" />
                <span>Nhật Ký Ra Vào Tiện Ích Thời Gian Thực Căn Hộ {aptCode}</span>
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5">
                Dữ liệu kiểm soát tự động từ hệ thống Turnstile & Barrier thông minh (Không có dữ liệu ảo)
              </div>
            </div>

            {/* Filter by facility */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button
                type="button"
                onClick={() => setLogFilter('ALL')}
                className={`px-2.5 py-1 text-[11px] font-mono rounded font-bold transition-colors ${
                  logFilter === 'ALL' ? 'bg-[#C5A880] text-[#0D1117]' : 'bg-[#161D26] text-gray-400 hover:text-white'
                }`}
              >
                Tất Cả ({accessLogs.length})
              </button>
              <button
                type="button"
                onClick={() => setLogFilter('fac-pool')}
                className={`px-2.5 py-1 text-[11px] font-mono rounded font-bold transition-colors ${
                  logFilter === 'fac-pool' ? 'bg-cyan-600 text-white' : 'bg-[#161D26] text-gray-400 hover:text-white'
                }`}
              >
                Hồ Bơi
              </button>
              <button
                type="button"
                onClick={() => setLogFilter('fac-gym')}
                className={`px-2.5 py-1 text-[11px] font-mono rounded font-bold transition-colors ${
                  logFilter === 'fac-gym' ? 'bg-blue-600 text-white' : 'bg-[#161D26] text-gray-400 hover:text-white'
                }`}
              >
                Gym
              </button>
              <button
                type="button"
                onClick={() => setLogFilter('fac-bbq')}
                className={`px-2.5 py-1 text-[11px] font-mono rounded font-bold transition-colors ${
                  logFilter === 'fac-bbq' ? 'bg-amber-600 text-white' : 'bg-[#161D26] text-gray-400 hover:text-white'
                }`}
              >
                BBQ
              </button>
            </div>
          </div>

          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center bg-[#0D1117] border border-[#222B35] rounded-lg space-y-2">
              <div className="w-10 h-10 rounded-full bg-[#161D26] border border-[#2A374A] flex items-center justify-center mx-auto text-gray-400">
                <History className="w-5 h-5 text-[#C5A880]" />
              </div>
              <div className="text-xs font-bold text-white">Chưa có lượt ra vào tiện ích nào</div>
              <div className="text-[11px] text-gray-400 max-w-sm mx-auto leading-relaxed">
                Khi cư dân sử dụng Thẻ NFC hoặc FaceID qua cổng kiểm soát tại Hồ bơi, Gym, BBQ, hệ thống sẽ tự động ghi lại lịch sử ở đây.
              </div>
            </div>
          ) : (
            <div className="divide-y divide-[#222B35] max-h-[460px] overflow-y-auto pr-1">
              {filteredLogs.map((log) => (
                <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">{log.facilityName}</div>
                      <div className="text-[11px] text-gray-400">
                        Cư dân: <strong className="text-gray-200">{log.userName}</strong> ({log.role}) • Xác thực: <span className="text-[#C5A880]">{log.method === 'NFC_CARD' ? 'Thẻ Cư Dân NFC' : 'FaceID AI 3D'}</span>
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                        {log.detail}
                      </div>
                    </div>
                  </div>

                  <div className="text-right sm:shrink-0 font-mono text-[11px]">
                    <div className="text-[#C5A880] font-bold">{log.timestamp}</div>
                    <div className="text-[9.5px] text-emerald-400 uppercase">✓ CỔNG MỞ THÀNH CÔNG</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 1: CHECK-IN CỔNG TURNSTILE THÔNG MINH (QUẸT THẺ / FACE) */}
      {/* ============================================================= */}
      {turnstileModalFac && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fadeIn p-4">
          <div className="bg-[#121820] border-2 border-[#C5A880] rounded-xl shadow-2xl max-w-md w-full overflow-hidden space-y-4">
            {/* Modal Header */}
            <div className="p-4 bg-[#161F2C] border-b border-[#2A374A] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DoorOpen className="w-5 h-5 text-[#C5A880]" />
                <div>
                  <h4 className="font-serif text-sm font-bold text-white">
                    Cổng Kiểm Soát Turnstile AI: {turnstileModalFac.name}
                  </h4>
                  <div className="text-[10px] text-gray-400 font-mono">{turnstileModalFac.location}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTurnstileModalFac(null)}
                className="p-1 text-gray-400 hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-center">
              {turnstileSuccessMsg ? (
                <div className="p-4 bg-emerald-950/90 border border-emerald-500 text-emerald-300 rounded-lg text-xs font-mono space-y-2 animate-fadeIn">
                  <DoorOpen className="w-8 h-8 text-emerald-400 mx-auto animate-bounce" />
                  <div className="font-bold">{turnstileSuccessMsg}</div>
                </div>
              ) : (
                <>
                  <div className="text-xs text-gray-300 leading-relaxed">
                    Chọn phương thức xác thực để mở cổng Barrier tự động:
                  </div>

                  {/* Method Switcher */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setTurnstileMethod('NFC')}
                      className={`p-3 rounded-lg border text-xs font-bold transition-all flex flex-col items-center gap-2 ${
                        turnstileMethod === 'NFC'
                          ? 'bg-blue-950/80 border-blue-500 text-blue-300 ring-1 ring-blue-400'
                          : 'bg-[#161D26] border-[#2A374A] text-gray-400 hover:text-white'
                      }`}
                    >
                      <CreditCard className="w-6 h-6" />
                      <span>Thẻ Cư Dân NFC</span>
                      <span className="text-[9px] font-mono font-normal">Chạm đầu đọc RFID</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTurnstileMethod('FACE_ID')}
                      className={`p-3 rounded-lg border text-xs font-bold transition-all flex flex-col items-center gap-2 ${
                        turnstileMethod === 'FACE_ID'
                          ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 ring-1 ring-cyan-400'
                          : 'bg-[#161D26] border-[#2A374A] text-gray-400 hover:text-white'
                      }`}
                    >
                      <ScanFace className="w-6 h-6" />
                      <span>FaceID AI 3D</span>
                      <span className="text-[9px] font-mono font-normal">Quét camera AI</span>
                    </button>
                  </div>

                  {/* Visual Card / Biometric Preview */}
                  <div className="p-3 bg-[#0D1117] border border-[#222B35] rounded-lg text-xs font-mono text-gray-300 space-y-1">
                    <div className="text-white font-bold">{userName} (Căn {aptCode})</div>
                    <div className="text-[10px] text-gray-400">
                      {turnstileMethod === 'NFC' ? `Mã chip NFC: NFC-SKY-${aptCode}-01` : 'Nhận diện khuôn mặt eKYC Skyline'}
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    type="button"
                    onClick={handleExecuteTurnstileCheckin}
                    disabled={isTurnstileScanning}
                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    {isTurnstileScanning ? (
                      <>
                        <Wifi className="w-4 h-4 animate-spin rotate-90" />
                        <span>Đang Xác Thực Qua Cổng...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Xác Nhận Check-in Mở Cổng</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 2: XEM THẺ CƯ DÂN KIM LOẠI VIP 3D                       */}
      {/* ============================================================= */}
      {showSmartCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md animate-fadeIn p-4">
          <div className="bg-[#121820] border-2 border-[#C5A880] rounded-xl shadow-2xl max-w-lg w-full overflow-hidden space-y-4">
            <div className="p-4 bg-[#161F2C] border-b border-[#2A374A] flex items-center justify-between">
              <div className="text-xs uppercase tracking-[0.2em] text-[#C5A880] font-bold flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#C5A880]" />
                <span>Thẻ Cư Dân Kim Loại Mạ Vàng Căn {aptCode}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowSmartCardModal(false)}
                className="p-1 text-gray-400 hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <ResidentSmartCard 
                currentUser={currentUser} 
                onTapSuccess={(fac) => {
                  alert(`🎉 Cổng ${fac} đã mở tự động cho cư dân Căn ${aptCode}!`);
                  setAccessLogs(getFacilityCheckinLogs(aptCode));
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
