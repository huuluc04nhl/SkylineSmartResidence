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
  Info,
  AlertTriangle,
  RotateCcw,
  Receipt,
  Coins
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
  cancelFacilityBookingWithRefund,
  calculateRefundEstimate,
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
      name: 'Hồ Bơi Vô Cực Chân Mây',
      category: 'SPORTS',
      location: 'Tầng 25 (Sân Thượng)',
      hours: '06:00 - 22:00',
      density: '18% (Thoáng)',
      temp: '28°C • Nước lọc ozone',
      image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600&auto=format&fit=crop&q=80',
      icon: Waves,
      accessType: 'FREE_ENTRY',
      accessBadge: 'Vào Tự Do (NFC / FaceID)',
      price: 'Miễn phí theo Thẻ cư dân'
    },
    {
      id: 'fac-gym',
      name: 'Phòng Gym Technogym',
      category: 'SPORTS',
      location: 'Tầng 3 (Khu Thể Thao)',
      hours: 'Mở cửa 24/7',
      density: '38% (Bình thường)',
      temp: '22°C • Điều hòa ion',
      image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=80',
      icon: Dumbbell,
      accessType: 'FREE_ENTRY',
      accessBadge: 'Vào Tự Do 24/7',
      price: 'Miễn phí theo Thẻ cư dân'
    },
    {
      id: 'fac-sauna',
      name: 'Phòng Xông Hơi Đá Muối',
      category: 'WELLNESS',
      location: 'Tầng 3 (Khu Chăm Sóc Sức Khỏe)',
      hours: '08:00 - 22:00 (Theo giờ đặt)',
      density: 'Phòng riêng gia đình',
      temp: '48°C • Tinh dầu thảo mộc',
      image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&auto=format&fit=crop&q=80',
      icon: Flame,
      accessType: 'BOOKING_REQUIRED',
      accessBadge: 'Đặt Giữ Chỗ (Phòng VIP)',
      price: '500.000 đ / giờ (Phòng gia đình VIP)'
    },
    {
      id: 'fac-kids',
      name: 'Khu Vui Chơi Trẻ Em',
      category: 'WELLNESS',
      location: 'Tầng 1 (Sảnh Tòa A)',
      hours: '07:00 - 21:00',
      density: '30% (Vừa)',
      temp: '24°C • Sàn kháng khuẩn',
      image: 'https://images.unsplash.com/photo-1566454544259-f4b94c3d758c?w=600&auto=format&fit=crop&q=80',
      icon: Smile,
      accessType: 'FREE_ENTRY',
      accessBadge: 'Vào Tự Do (Trẻ Em)',
      price: 'Miễn phí theo Thẻ cư dân'
    },
    {
      id: 'fac-bbq',
      name: 'Vườn Tiệc Nướng BBQ Sân Thượng',
      category: 'PARTY',
      location: 'Tầng 25 (Khu Vườn Nhật)',
      hours: '17:00 - 23:00 (Theo ca)',
      density: 'Sẵn sàng 4/6 khu bếp',
      temp: 'Gió trời tự nhiên',
      image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
      icon: UtensilsCrossed,
      accessType: 'BOOKING_REQUIRED',
      accessBadge: 'Đăng Ký Theo Ca',
      price: '600.000 đ / ca tiệc (Set bếp Weber & dọn dẹp)'
    },
  ];

  // Dữ liệu thực tế từ Store (Không dữ liệu ảo)
  const [accessLogs, setAccessLogs] = useState<FacilityCheckinLog[]>(() => getFacilityCheckinLogs(aptCode));
  const [bookings, setBookings] = useState<FacilityBooking[]>(() => getFacilityBookings(aptCode));
  const [quota, setQuota] = useState(() => getFacilityMonthlyQuota(aptCode));

  // State Form đặt chỗ
  const todayStr = new Date().toISOString().split('T')[0];
  const [bookingFacilityId, setBookingFacilityId] = useState('fac-sauna');
  const [bookingDate, setBookingDate] = useState(todayStr);
  const [bookingTimeSlot, setBookingTimeSlot] = useState('18:00 - 20:00 (Buổi tối - Giờ đẹp)');
  const [bookingGuestCount, setBookingGuestCount] = useState(2);
  const [bookingDurationHours, setBookingDurationHours] = useState(2);
  const [bookingPaymentMethod, setBookingPaymentMethod] = useState('Trừ vào hóa đơn sinh hoạt tháng tới');
  const [bookingNotes, setBookingNotes] = useState('');
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState<string | null>(null);

  // State Modal Hoàn Tiền Khi Bận Đột Xuất
  const [refundModalBooking, setRefundModalBooking] = useState<FacilityBooking | null>(null);
  const [refundReason, setRefundReason] = useState('Bận đột xuất không thể sắp xếp tham gia');
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);
  const [refundResultAlert, setRefundResultAlert] = useState<{ type: 'success' | 'warning' | 'error'; message: string } | null>(null);

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
      const methodText = turnstileMethod === 'NFC' ? 'Thẻ Cư Dân' : 'Nhận Diện Khuôn Mặt';
      
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

  // Tạo đặt chỗ mới (hỗ trợ phòng xông hơi riêng tư và thanh toán giữ chỗ)
  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault();
    const fac = amenitiesList.find(f => f.id === bookingFacilityId) || amenitiesList[2];
    const isPrivate = fac.id === 'fac-sauna';
    const depositAmount = isPrivate ? bookingDurationHours * 500000 : (fac.id === 'fac-bbq' ? 600000 : 0);
    const pricingText = isPrivate 
      ? `${(bookingDurationHours * 500000).toLocaleString('vi-VN')} đ (${bookingDurationHours} tiếng phòng VIP)` 
      : fac.price;

    const { bookings: updated, newBooking } = createFacilityBooking(
      aptCode,
      fac.id,
      fac.name,
      bookingDate,
      bookingTimeSlot,
      userName,
      pricingText,
      bookingGuestCount,
      bookingNotes,
      bookingDurationHours,
      depositAmount,
      isPrivate,
      bookingPaymentMethod
    );
    setBookings(updated);
    setQuota(getFacilityMonthlyQuota(aptCode));
    setBookingNotes('');
    setBookingSuccessMsg(
      `🎉 Đặt chỗ thành công! Mã vé điện tử: [${newBooking.ticketCode}]. ` +
      (depositAmount > 0 
        ? `Đã xác nhận thanh toán giữ chỗ ${depositAmount.toLocaleString('vi-VN')} đ (${bookingPaymentMethod}). ` 
        : '') +
      `Quý cư dân có thể quẹt vé QR tại cổng hoặc hủy hoàn tiền nếu có việc bận đột xuất.`
    );
    setTimeout(() => setBookingSuccessMsg(null), 8000);
  };

  // Mở modal hoàn tiền khi bận đột xuất
  const handleOpenRefundModal = (booking: FacilityBooking) => {
    setRefundModalBooking(booking);
    setRefundReason('Bận việc gia đình đột xuất không thể tham gia');
  };

  // Xác nhận xử lý hoàn tiền
  const handleConfirmRefund = () => {
    if (!refundModalBooking) return;
    setIsProcessingRefund(true);

    setTimeout(() => {
      const res = cancelFacilityBookingWithRefund(aptCode, refundModalBooking.id, refundReason);
      setBookings(res.bookings);
      setQuota(getFacilityMonthlyQuota(aptCode));
      setIsProcessingRefund(false);
      setRefundModalBooking(null);
      setRefundResultAlert({
        type: res.refundRate > 0 ? 'success' : 'warning',
        message: res.message
      });
      setTimeout(() => setRefundResultAlert(null), 8000);
    }, 600);
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
      <div className="p-5 bg-gradient-to-r from-[#121820] via-[#161F2C] to-[#121820] border border-[#2A374A] rounded-none shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-[11px] uppercase tracking-[0.2em] text-[#C5A880] font-bold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#C5A880]" />
            <span>Tiện Ích 5 Sao • Căn Hộ {aptCode}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-white flex items-center gap-2">
            <span>Tiện Ích Cư Dân & Cổng Tự Động</span>
          </h2>
          <p className="text-xs text-gray-400 font-mono flex flex-wrap items-center gap-2">
            <span>Chủ Hộ: <strong className="text-white">{userName}</strong></span>
            <span className="text-gray-600">•</span>
            <span className="text-emerald-400">Gym & Hồ bơi: Miễn phí</span>
            <span className="text-gray-600">•</span>
            <span>Mở cổng 0.28s</span>
          </p>
        </div>

        {/* Quick Actions & Metrics */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="h-11 px-3.5 bg-[#0D1117] border border-[#2A374A] rounded-none text-xs flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="leading-tight">
              <div className="text-[9px] uppercase tracking-wider text-gray-400 font-mono">Hạn Mức BBQ Tháng</div>
              <div className="font-mono font-bold text-[#C5A880] text-xs">{quota.remaining} / {quota.max} lượt</div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowSmartCardModal(true)}
            className="h-11 px-4 bg-[#1A2332] hover:bg-[#253247] border border-[#C5A880]/50 hover:border-[#C5A880] text-white text-xs font-bold uppercase rounded-none transition-all flex items-center gap-2 shadow-md"
          >
            <CreditCard className="w-4 h-4 text-[#C5A880] shrink-0" />
            <span>Thẻ Cư Dân 3D</span>
          </button>
        </div>
      </div>

      {/* ============================================================= */}
      {/* 2. THANH ĐIỀU HƯỚNG 3 CHỨC NĂNG (WORKFLOW TABS)               */}
      {/* ============================================================= */}
      <div className="flex items-center gap-2 border-b border-[#222B35] pb-2 overflow-x-auto">
        {/* Chức năng 1 */}
        <button
          type="button"
          onClick={() => setActiveTab('DISCOVER')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-none transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'DISCOVER'
              ? 'bg-[#C5A880] text-[#0D1117] shadow-lg'
              : 'bg-[#121820] text-gray-400 hover:text-white border border-[#222B35]'
          }`}
        >
          <DoorOpen className="w-4 h-4" />
          <span>1. Danh Mục Tiện Ích (5)</span>
        </button>

        {/* Chức năng 2 */}
        <button
          type="button"
          onClick={() => setActiveTab('BOOKING')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-none transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'BOOKING'
              ? 'bg-[#C5A880] text-[#0D1117] shadow-lg'
              : 'bg-[#121820] text-gray-400 hover:text-white border border-[#222B35]'
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          <span>2. Đặt Chỗ & Vé Vào ({bookings.filter(b => b.status === 'CONFIRMED').length})</span>
        </button>

        {/* Chức năng 3 */}
        <button
          type="button"
          onClick={() => setActiveTab('LOGS')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-none transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'LOGS'
              ? 'bg-[#C5A880] text-[#0D1117] shadow-lg'
              : 'bg-[#121820] text-gray-400 hover:text-white border border-[#222B35]'
          }`}
        >
          <History className="w-4 h-4" />
          <span>3. Nhật Ký Ra Vào ({accessLogs.length})</span>
        </button>
      </div>

      {/* ============================================================= */}
      {/* CHỨC NĂNG 1: KHÁM PHÁ TIỆN ÍCH & CHECK-IN CỔNG TURNSTILE      */}
      {/* ============================================================= */}
      {activeTab === 'DISCOVER' && (
        <div className="space-y-4">
          {/* Bộ lọc loại tiện ích */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#121820] p-3 border border-[#222B35] rounded-none">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button
                type="button"
                onClick={() => setFilterCategory('ALL')}
                className={`px-3 py-1.5 text-xs font-bold rounded-none transition-colors ${
                  filterCategory === 'ALL' ? 'bg-[#C5A880] text-[#0D1117]' : 'bg-[#161D26] text-gray-400 hover:text-white'
                }`}
              >
                Tất Cả (5)
              </button>
              <button
                type="button"
                onClick={() => setFilterCategory('SPORTS')}
                className={`px-3 py-1.5 text-xs font-bold rounded-none transition-colors ${
                  filterCategory === 'SPORTS' ? 'bg-[#C5A880] text-[#0D1117]' : 'bg-[#161D26] text-gray-400 hover:text-white'
                }`}
              >
                Thể Thao & Hồ Bơi (2)
              </button>
              <button
                type="button"
                onClick={() => setFilterCategory('WELLNESS')}
                className={`px-3 py-1.5 text-xs font-bold rounded-none transition-colors ${
                  filterCategory === 'WELLNESS' ? 'bg-[#C5A880] text-[#0D1117]' : 'bg-[#161D26] text-gray-400 hover:text-white'
                }`}
              >
                Sức Khỏe & Trẻ Em (2)
              </button>
              <button
                type="button"
                onClick={() => setFilterCategory('PARTY')}
                className={`px-3 py-1.5 text-xs font-bold rounded-none transition-colors ${
                  filterCategory === 'PARTY' ? 'bg-[#C5A880] text-[#0D1117]' : 'bg-[#161D26] text-gray-400 hover:text-white'
                }`}
              >
                Tiệc Nướng BBQ (1)
              </button>
            </div>

            <div className="text-[11px] text-gray-400 font-mono hidden sm:block">
              * Quẹt thẻ hoặc nhìn vào camera nhận diện để mở cửa
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
                  className="bg-[#121820] border border-[#222B35] hover:border-[#C5A880]/60 transition-all rounded-none overflow-hidden flex flex-col justify-between group shadow-lg"
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
                    <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-sm border border-[#222B35] px-2.5 py-1 text-[10px] text-white flex items-center gap-1.5 font-mono rounded-none">
                      <Clock className="w-3 h-3 text-[#C5A880]" />
                      <span>{fac.hours}</span>
                    </div>

                    {/* Badge Quyền Truy Cập */}
                    <div className="absolute top-3 right-3">
                      <span className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase rounded-none border ${
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
                      <div className="grid grid-cols-2 gap-2 text-[11px] bg-[#0D1117] p-2.5 rounded-none border border-[#1F2937]">
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
                          className="w-full py-2.5 px-3 bg-gradient-to-r from-[#C5A880] to-[#E2D4BF] hover:from-[#d5b991] hover:to-white text-[#0D1117] text-xs font-bold uppercase rounded-none transition-all flex items-center justify-center gap-2 shadow-md"
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
                          className="w-full py-2.5 px-3 bg-[#1A2332] hover:bg-[#253247] border border-amber-500/50 hover:border-amber-400 text-amber-300 text-xs font-bold uppercase rounded-none transition-all flex items-center justify-center gap-2 shadow-md"
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Bên Trái: Form Đăng Ký Đặt Chỗ (6 Cột - Cân Xứng) */}
          <div className="lg:col-span-6">
            <form onSubmit={handleCreateBooking} className="p-4 sm:p-5 bg-[#121820] border border-[#2A374A] rounded-none space-y-3.5 shadow-xl">
              <div className="border-b border-[#222B35] pb-2.5">
                <div className="text-[10px] uppercase tracking-[0.2em] text-[#C5A880] font-bold">
                  Dịch Vụ Tiện Ích Đặt Trước • Căn Hộ {aptCode}
                </div>
                <h3 className="font-serif text-lg text-white font-bold">
                  Đăng Ký Đặt Chỗ Tiện Ích VIP
                </h3>
              </div>

              {bookingSuccessMsg && (
                <div className="p-3 bg-emerald-950 border border-emerald-500 text-emerald-200 text-xs rounded-none leading-relaxed animate-fadeIn">
                  {bookingSuccessMsg}
                </div>
              )}

              {/* Bước 1: Tiện ích */}
              <div className="space-y-1">
                <label className="text-[10.5px] text-gray-300 font-semibold uppercase block">
                  1. Chọn tiện ích muốn đặt:
                </label>
                <select
                  value={bookingFacilityId}
                  onChange={(e) => setBookingFacilityId(e.target.value)}
                  className="w-full bg-[#161D26] border border-[#2A374A] p-2.5 text-white text-xs rounded-none focus:outline-none focus:border-[#C5A880]"
                >
                  <option value="fac-sauna">Phòng Xông Hơi Đá Muối Himalaya (VIP Tầng 3) • 500.000 đ/giờ</option>
                  <option value="fac-bbq">Vườn Tiệc Nướng BBQ Panoramic (Sân Thượng Tầng 25) • 600.000 đ/ca</option>
                </select>
              </div>

              {/* Thông báo phòng riêng tư VIP nếu chọn Xông hơi */}
              {bookingFacilityId === 'fac-sauna' && (
                <div className="p-2.5 bg-gradient-to-r from-[#C5A880]/15 to-transparent border-l-2 border-[#C5A880] rounded-none space-y-1 text-xs text-gray-200 animate-fadeIn">
                  <div className="font-bold text-[#C5A880] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Dịch Vụ Phòng Riêng Tư Gia Đình VIP</span>
                  </div>
                  <div className="text-[11px] text-gray-300 leading-relaxed">
                    Khép kín 100%, được bật lò gia nhiệt đá muối Himalaya, chuẩn bị khăn bông cao cấp và tinh dầu thảo mộc tự nhiên theo đúng giờ hẹn.
                  </div>
                </div>
              )}

              {/* Chọn số tiếng sử dụng nếu là phòng xông hơi riêng tư */}
              {bookingFacilityId === 'fac-sauna' && (
                <div className="space-y-1">
                  <label className="text-[10.5px] text-gray-300 font-semibold uppercase block">
                    Số tiếng đặt phòng VIP:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setBookingDurationHours(h)}
                        className={`py-2 px-2 text-xs font-bold rounded-none transition-all flex flex-col items-center justify-center gap-0.5 border ${
                          bookingDurationHours === h
                            ? 'bg-[#C5A880] text-[#0D1117] border-[#C5A880] shadow'
                            : 'bg-[#161D26] text-gray-300 border-[#2A374A] hover:border-[#C5A880]/60'
                        }`}
                      >
                        <span>{h} Tiếng</span>
                        <span className="text-[10px] font-mono font-normal">{(h * 500000).toLocaleString('vi-VN')} đ</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Bước 2: Ngày & Giờ */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[10.5px] text-gray-300 font-semibold uppercase block">
                    2. Ngày đặt:
                  </label>
                  <input
                    type="date"
                    min={todayStr}
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full bg-[#161D26] border border-[#2A374A] p-2 text-white text-xs rounded-none focus:outline-none focus:border-[#C5A880]"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10.5px] text-gray-300 font-semibold uppercase block">
                    Khung giờ:
                  </label>
                  <select
                    value={bookingTimeSlot}
                    onChange={(e) => setBookingTimeSlot(e.target.value)}
                    className="w-full bg-[#161D26] border border-[#2A374A] p-2 text-white text-xs rounded-none focus:outline-none focus:border-[#C5A880]"
                  >
                    <option>08:00 - 10:00 (Buổi sáng thư giãn)</option>
                    <option>10:00 - 12:00 (Trưa thanh tịnh)</option>
                    <option>14:00 - 16:00 (Đầu giờ chiều)</option>
                    <option>16:00 - 18:00 (Hoàng hôn)</option>
                    <option>18:00 - 20:00 (Buổi tối - Giờ đẹp)</option>
                    <option>20:00 - 22:00 (Phục hồi thể lực đêm)</option>
                  </select>
                </div>
              </div>

              {/* Chọn phương thức thanh toán giữ chỗ nếu là phòng xông hơi */}
              {bookingFacilityId === 'fac-sauna' && (
                <div className="space-y-1">
                  <label className="text-[10.5px] text-gray-300 font-semibold uppercase block">
                    Phương thức thanh toán giữ chỗ:
                  </label>
                  <select
                    value={bookingPaymentMethod}
                    onChange={(e) => setBookingPaymentMethod(e.target.value)}
                    className="w-full bg-[#161D26] border border-[#2A374A] p-2 text-white text-xs rounded-none focus:outline-none focus:border-[#C5A880]"
                  >
                    <option value="Trừ vào hóa đơn sinh hoạt tháng tới">Trừ vào hóa đơn sinh hoạt tháng tới của căn hộ</option>
                    <option value="Quét mã QR chuyển khoản ngân hàng">Quét mã QR chuyển khoản ngân hàng BQL</option>
                    <option value="Trừ vào số dư ví cư dân">Trừ vào số dư ví cư dân</option>
                  </select>
                </div>
              )}

              {/* Bước 3: Số người & Ghi chú */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[10.5px] text-gray-300 font-semibold uppercase block">
                    3. Số người tham gia:
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={bookingFacilityId === 'fac-sauna' ? 6 : 20}
                    value={bookingGuestCount}
                    onChange={(e) => setBookingGuestCount(Number(e.target.value))}
                    className="w-full bg-[#161D26] border border-[#2A374A] p-2 text-white text-xs rounded-none focus:outline-none focus:border-[#C5A880]"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10.5px] text-gray-300 font-semibold uppercase block">
                    Người đại diện đặt:
                  </label>
                  <input
                    type="text"
                    value={userName}
                    disabled
                    className="w-full bg-[#0D1117] border border-[#2A374A] p-2 text-gray-400 text-xs rounded-none cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10.5px] text-gray-300 font-semibold uppercase block">
                  Ghi chú yêu cầu phục vụ (tùy chọn):
                </label>
                <input
                  type="text"
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  placeholder={bookingFacilityId === 'fac-sauna' ? 'VD: Cần thêm khăn nhung, tinh dầu sả chanh...' : 'VD: Cần 2 bếp nướng Weber, dụng cụ BBQ...'}
                  className="w-full bg-[#161D26] border border-[#2A374A] p-2 text-white text-xs rounded-none focus:outline-none focus:border-[#C5A880]"
                />
              </div>

              {/* Chi phí & Chính sách hoàn tiền minh bạch khi bận đột xuất */}
              <div className="p-3 bg-[#0D1117] border border-[#222B35] rounded-none space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 font-medium">Chi phí đặt giữ chỗ:</span>
                  <span className="text-[#C5A880] font-bold text-sm font-mono">
                    {bookingFacilityId === 'fac-sauna'
                      ? `${(bookingDurationHours * 500000).toLocaleString('vi-VN')} đ (${bookingDurationHours} tiếng phòng VIP)`
                      : '600.000 đ / ca tiệc (Set bếp Weber & nhân viên)'}
                  </span>
                </div>

                <div className="pt-2 border-t border-[#1F2937] space-y-1 text-[11px] leading-relaxed">
                  <div className="text-[#C5A880] font-bold flex items-center gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Chính sách hoàn tiền khi có việc bận đột xuất:</span>
                  </div>
                  <div className="space-y-0.5 text-gray-300">
                    <div className="flex items-start gap-1.5 text-emerald-400">
                      <span className="font-bold">✓</span>
                      <span><strong>Trước giờ hẹn &gt; 30 phút:</strong> Hoàn trả <strong>100%</strong> tiền giữ chỗ.</span>
                    </div>
                    <div className="flex items-start gap-1.5 text-amber-300">
                      <span className="font-bold">⚡</span>
                      <span><strong>Cận giờ (trong 30 phút):</strong> Hoàn trả <strong>50%</strong> (50% bù đắp chi phí chuẩn bị).</span>
                    </div>
                    <div className="flex items-start gap-1.5 text-gray-400">
                      <span className="font-bold">✕</span>
                      <span><strong>Quá giờ hẹn bắt đầu:</strong> Không hoàn tiền do tiện ích đã khóa giữ chỗ.</span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#C5A880] hover:bg-[#d5b991] text-[#0D1117] text-xs font-bold uppercase rounded-none transition-colors flex items-center justify-center gap-2 shadow-lg"
              >
                <Check className="w-4 h-4" />
                <span>Xác Nhận Đặt Giữ Chỗ & Tạo Vé QR</span>
              </button>
            </form>
          </div>

          {/* Bên Phải: Quản Lý Vé Điện Tử Của Căn Hộ (6 Cột - Cân Xứng) */}
          <div className="lg:col-span-6 space-y-3.5">
            {/* Thông báo kết quả hoàn tiền nếu có */}
            {refundResultAlert && (
              <div className={`p-3 rounded-none border text-xs leading-relaxed animate-fadeIn flex items-center justify-between gap-3 ${
                refundResultAlert.type === 'success'
                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
                  : 'bg-amber-950/80 border-amber-500 text-amber-200'
              }`}>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{refundResultAlert.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setRefundResultAlert(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="p-4 sm:p-5 bg-[#121820] border border-[#2A374A] rounded-none space-y-3.5 shadow-xl">
              <div className="flex items-center justify-between border-b border-[#222B35] pb-2.5">
                <div className="text-xs uppercase tracking-wider text-[#C5A880] font-bold flex items-center gap-2">
                  <QrCode className="w-4 h-4" /> 
                  <span>Ví Vé Điện Tử Tiện Ích Căn Hộ {aptCode} ({bookings.length} Vé)</span>
                </div>
                <div className="text-[11px] text-gray-400 font-mono">
                  Quét vé tại cổng tiện ích
                </div>
              </div>

              {bookings.length === 0 ? (
                <div className="p-8 text-center bg-[#0D1117] border border-[#222B35] rounded-none space-y-2">
                  <div className="w-10 h-10 rounded-none bg-[#161D26] border border-[#2A374A] flex items-center justify-center mx-auto text-gray-400">
                    <Calendar className="w-5 h-5 text-[#C5A880]" />
                  </div>
                  <div className="text-xs font-bold text-white">Chưa có vé đặt chỗ nào</div>
                  <div className="text-[11px] text-gray-400 max-w-sm mx-auto leading-relaxed">
                    Hãy điền thông tin bên trái để đăng ký Phòng xông hơi VIP hoặc Vườn tiệc nướng BBQ Panoramic cho gia đình.
                  </div>
                </div>
              ) : (
                <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
                  {bookings.map((b) => {
                    const isConfirmed = b.status === 'CONFIRMED';
                    const isCheckedIn = b.status === 'CHECKED_IN';
                    const isCancelled = b.status === 'CANCELLED';

                    return (
                      <div 
                        key={b.id}
                        className={`p-3.5 bg-[#0D1117] border rounded-none space-y-2.5 transition-all ${
                          isConfirmed ? 'border-[#2A374A]' : isCheckedIn ? 'border-emerald-500/40 bg-emerald-950/10' : 'border-gray-800 opacity-70'
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

                            {/* Thông tin phòng riêng tư & số tiền đặt giữ chỗ */}
                            {(b.isPrivate || b.facilityId === 'fac-sauna' || b.depositAmount) && (
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                <span className="px-2 py-0.5 bg-[#C5A880]/15 text-[#C5A880] text-[9.5px] font-bold rounded-none">
                                  👑 TIỆN ÍCH VIP • {b.durationHours ? `${b.durationHours} TIẾNG` : 'THEO CA'}
                                </span>
                                <span className="text-[10px] text-gray-300 font-mono">
                                  Đã giữ chỗ: <strong className="text-[#C5A880]">{(b.depositAmount || 1000000).toLocaleString('vi-VN')} đ</strong>
                                </span>
                              </div>
                            )}
                          </div>

                          <span className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded-none uppercase border shrink-0 ${
                            isConfirmed 
                              ? 'bg-amber-950 text-amber-300 border-amber-500/40' 
                              : isCheckedIn
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                                : 'bg-gray-800 text-gray-400 border-gray-600'
                          }`}>
                            {isConfirmed ? 'ĐÃ XÁC NHẬN' : isCheckedIn ? '✓ ĐÃ CHECK-IN' : '✕ ĐÃ HỦY LỊCH'}
                          </span>
                        </div>

                        {/* Mã QR & Code Strip */}
                        <div className="p-2.5 bg-[#161D26] border border-[#222B35] rounded-none flex items-center justify-between gap-3">
                          <div className="space-y-0.5">
                            <div className="text-[9px] text-gray-400 uppercase font-mono">Mã Vé Điện Tử Check-in:</div>
                            <div className="text-sm font-mono font-bold text-[#C5A880]">{b.ticketCode}</div>
                            <div className="text-[10px] text-gray-400">
                              {isCancelled ? 'Vé này đã được hủy và thanh lý' : 'Xuất trình tại đầu đọc mã QR cổng vào tiện ích'}
                            </div>
                          </div>

                          <div className={`p-1 bg-white rounded-none shrink-0 shadow ${isCancelled ? 'opacity-30' : ''}`}>
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=${b.ticketCode}`}
                              alt="Ticket QR"
                              className="w-14 h-14 object-contain"
                            />
                          </div>
                        </div>

                        {/* Chi tiết hoàn tiền nếu vé đã hủy */}
                        {isCancelled && (
                          <div className="p-2.5 bg-[#141B24] border border-[#222B35] rounded-none text-xs space-y-1">
                            <div className="flex items-center gap-1.5 font-semibold">
                              {b.refundRate && b.refundRate > 0 ? (
                                <span className="text-emerald-400 flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Đã hoàn tiền {b.refundRate}% (+{(b.refundAmount || 0).toLocaleString('vi-VN')} đ)</span>
                                </span>
                              ) : (
                                <span className="text-gray-400 flex items-center gap-1">
                                  <XCircle className="w-3.5 h-3.5 text-gray-500" />
                                  <span>Không áp dụng hoàn tiền</span>
                                </span>
                              )}
                            </div>
                            {b.refundNote && (
                              <div className="text-[10.5px] text-gray-400 leading-relaxed">
                                {b.refundNote}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex items-center justify-between pt-1">
                          {isConfirmed ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenRefundModal(b)}
                                className="px-2.5 py-1.5 bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-red-300 text-xs font-semibold rounded-none transition-colors flex items-center gap-1.5 shadow-sm"
                              >
                                <RotateCcw className="w-3.5 h-3.5 text-red-400" />
                                <span>Hủy Lịch & Hoàn Tiền (Bận Đột Xuất)</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleCheckinTicket(b.ticketCode)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-none transition-colors flex items-center gap-1.5 shadow"
                              >
                                <DoorOpen className="w-3.5 h-3.5" /> Quẹt Vé Vào Cổng Ngay
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] text-gray-500 italic">
                              {isCheckedIn ? 'Vé đã được sử dụng thành công.' : 'Lịch đặt đã được thanh lý theo quy chế.'}
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
        <div className="p-4 sm:p-5 bg-[#121820] border border-[#2A374A] rounded-none space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#222B35] pb-3">
            <div>
              <div className="text-xs uppercase tracking-wider text-[#C5A880] font-bold flex items-center gap-2">
                <History className="w-4 h-4" />
                <span>Nhật Ký Ra Vào Tiện Ích Thời Gian Thực Căn Hộ {aptCode}</span>
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5">
                Dữ liệu ghi nhận tự động theo thời gian thực khi cư dân qua cổng tiện ích
              </div>
            </div>

            {/* Filter by facility */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button
                type="button"
                onClick={() => setLogFilter('ALL')}
                className={`px-2.5 py-1 text-[11px] font-mono rounded-none font-bold transition-colors ${
                  logFilter === 'ALL' ? 'bg-[#C5A880] text-[#0D1117]' : 'bg-[#161D26] text-gray-400 hover:text-white'
                }`}
              >
                Tất Cả ({accessLogs.length})
              </button>
              <button
                type="button"
                onClick={() => setLogFilter('fac-pool')}
                className={`px-2.5 py-1 text-[11px] font-mono rounded-none font-bold transition-colors ${
                  logFilter === 'fac-pool' ? 'bg-cyan-600 text-white' : 'bg-[#161D26] text-gray-400 hover:text-white'
                }`}
              >
                Hồ Bơi
              </button>
              <button
                type="button"
                onClick={() => setLogFilter('fac-gym')}
                className={`px-2.5 py-1 text-[11px] font-mono rounded-none font-bold transition-colors ${
                  logFilter === 'fac-gym' ? 'bg-blue-600 text-white' : 'bg-[#161D26] text-gray-400 hover:text-white'
                }`}
              >
                Gym
              </button>
              <button
                type="button"
                onClick={() => setLogFilter('fac-bbq')}
                className={`px-2.5 py-1 text-[11px] font-mono rounded-none font-bold transition-colors ${
                  logFilter === 'fac-bbq' ? 'bg-amber-600 text-white' : 'bg-[#161D26] text-gray-400 hover:text-white'
                }`}
              >
                BBQ
              </button>
            </div>
          </div>

          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center bg-[#0D1117] border border-[#222B35] rounded-none space-y-2">
              <div className="w-10 h-10 rounded-none bg-[#161D26] border border-[#2A374A] flex items-center justify-center mx-auto text-gray-400">
                <History className="w-5 h-5 text-[#C5A880]" />
              </div>
              <div className="text-xs font-bold text-white">Chưa có lượt ra vào tiện ích nào</div>
              <div className="text-[11px] text-gray-400 max-w-sm mx-auto leading-relaxed">
                Khi cư dân quẹt thẻ hoặc dùng nhận diện khuôn mặt qua cổng tại Hồ bơi, Gym, BBQ, hệ thống sẽ tự động hiển thị nhật ký tại đây.
              </div>
            </div>
          ) : (
            <div className="divide-y divide-[#222B35] max-h-[460px] overflow-y-auto pr-1">
              {filteredLogs.map((log) => (
                <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-none bg-emerald-950 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">{log.facilityName}</div>
                      <div className="text-[11px] text-gray-400">
                        Cư dân: <strong className="text-gray-200">{log.userName}</strong> ({log.role}) • Xác thực: <span className="text-[#C5A880]">{log.method === 'NFC_CARD' ? 'Thẻ Cư Dân' : 'Nhận Diện Khuôn Mặt'}</span>
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
      {/* MODAL 1: CỔNG VÀO TIỆN ÍCH THÔNG MINH (QUẸT THẺ / KHUÔN MẶT) */}
      {/* ============================================================= */}
      {turnstileModalFac && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fadeIn p-4">
          <div className="bg-[#121820] border-2 border-[#C5A880] rounded-none shadow-2xl max-w-md w-full overflow-hidden space-y-4">
            {/* Modal Header */}
            <div className="p-4 bg-[#161F2C] border-b border-[#2A374A] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DoorOpen className="w-5 h-5 text-[#C5A880]" />
                <div>
                  <h4 className="font-serif text-sm font-bold text-white">
                    Cổng Vào Tiện Ích: {turnstileModalFac.name}
                  </h4>
                  <div className="text-[10px] text-gray-400 font-mono">{turnstileModalFac.location}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTurnstileModalFac(null)}
                className="p-1 text-gray-400 hover:text-white rounded-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-center">
              {turnstileSuccessMsg ? (
                <div className="p-4 bg-emerald-950/90 border border-emerald-500 text-emerald-300 rounded-none text-xs font-mono space-y-2 animate-fadeIn">
                  <DoorOpen className="w-8 h-8 text-emerald-400 mx-auto animate-bounce" />
                  <div className="font-bold">{turnstileSuccessMsg}</div>
                </div>
              ) : (
                <>
                  <div className="text-xs text-gray-300 leading-relaxed">
                    Chọn cách mở cửa để vào tiện ích:
                  </div>

                  {/* Method Switcher */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setTurnstileMethod('NFC')}
                      className={`p-3 rounded-none border text-xs font-bold transition-all flex flex-col items-center gap-2 ${
                        turnstileMethod === 'NFC'
                          ? 'bg-blue-950/80 border-blue-500 text-blue-300 ring-1 ring-blue-400'
                          : 'bg-[#161D26] border-[#2A374A] text-gray-400 hover:text-white'
                      }`}
                    >
                      <CreditCard className="w-6 h-6" />
                      <span>Quẹt Thẻ Cư Dân</span>
                      <span className="text-[9px] font-mono font-normal">Chạm thẻ vào máy quét</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTurnstileMethod('FACE_ID')}
                      className={`p-3 rounded-none border text-xs font-bold transition-all flex flex-col items-center gap-2 ${
                        turnstileMethod === 'FACE_ID'
                          ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 ring-1 ring-cyan-400'
                          : 'bg-[#161D26] border-[#2A374A] text-gray-400 hover:text-white'
                      }`}
                    >
                      <ScanFace className="w-6 h-6" />
                      <span>Nhận Diện Khuôn Mặt</span>
                      <span className="text-[9px] font-mono font-normal">Nhìn vào camera</span>
                    </button>
                  </div>

                  {/* Visual Card / Biometric Preview */}
                  <div className="p-3 bg-[#0D1117] border border-[#222B35] rounded-none text-xs font-mono text-gray-300 space-y-1">
                    <div className="text-white font-bold">{userName} (Căn {aptCode})</div>
                    <div className="text-[10px] text-gray-400">
                      {turnstileMethod === 'NFC' ? 'Thẻ cư dân chính của căn hộ' : 'Khuôn mặt cư dân đã kích hoạt'}
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    type="button"
                    onClick={handleExecuteTurnstileCheckin}
                    disabled={isTurnstileScanning}
                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-xs font-bold uppercase tracking-wider rounded-none transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    {isTurnstileScanning ? (
                      <>
                        <Wifi className="w-4 h-4 animate-spin rotate-90" />
                        <span>Đang Mở Cửa Vào Tiện Ích...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Mở Cửa Vào Tiện Ích</span>
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
          <div className="bg-[#121820] border-2 border-[#C5A880] rounded-none shadow-2xl max-w-lg w-full overflow-hidden space-y-4">
            <div className="p-4 bg-[#161F2C] border-b border-[#2A374A] flex items-center justify-between">
              <div className="text-xs uppercase tracking-[0.2em] text-[#C5A880] font-bold flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#C5A880]" />
                <span>Thẻ Cư Dân Kim Loại Mạ Vàng Căn {aptCode}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowSmartCardModal(false)}
                className="p-1 text-gray-400 hover:text-white rounded-none"
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
      {/* ============================================================= */}
      {/* MODAL 3: HỦY LỊCH TIỆN ÍCH & HOÀN TIỀN KHI BẬN ĐỘT XUẤT       */}
      {/* ============================================================= */}
      {refundModalBooking && (() => {
        const refundEstimate = calculateRefundEstimate(refundModalBooking);
        const isFull = refundEstimate.policyTier === 'FULL_100';
        const isPartial = refundEstimate.policyTier === 'PARTIAL_50';
        const isNone = refundEstimate.policyTier === 'NO_REFUND_0';

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md animate-fadeIn p-4">
            <div className="bg-[#121820] border border-[#C5A880] rounded-none shadow-2xl max-w-md w-full overflow-hidden space-y-4">
              {/* Header */}
              <div className="p-4 bg-[#161F2C] border-b border-[#2A374A] flex items-center justify-between">
                <div className="text-xs uppercase tracking-[0.15em] text-[#C5A880] font-bold flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-[#C5A880]" />
                  <span>Yêu Cầu Hoàn Tiền Khi Bận Đột Xuất</span>
                </div>
                <button
                  type="button"
                  onClick={() => setRefundModalBooking(null)}
                  disabled={isProcessingRefund}
                  className="p-1 text-gray-400 hover:text-white rounded-none"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4 text-xs">
                {/* Thông tin vé đặt */}
                <div className="p-3 bg-[#0D1117] border border-[#222B35] rounded-none space-y-1.5">
                  <div className="text-white font-bold text-sm flex items-center justify-between">
                    <span>{refundModalBooking.facilityName}</span>
                    <span className="text-[10px] text-[#C5A880] font-mono">{refundModalBooking.ticketCode}</span>
                  </div>
                  <div className="text-gray-300">
                    Thời gian hẹn: <strong className="text-white">{refundModalBooking.bookingDate} ({refundModalBooking.timeSlot})</strong>
                  </div>
                  <div className="text-gray-400">
                    Số tiền đã đặt giữ chỗ: <strong className="text-[#C5A880]">{(refundModalBooking.depositAmount || 500000).toLocaleString('vi-VN')} VNĐ</strong> ({refundModalBooking.paymentMethod || 'Hóa đơn tháng tới'})
                  </div>
                </div>

                {/* Phân tích tỷ lệ hoàn tiền thời gian thực */}
                <div className={`p-4 rounded-none border space-y-2 ${
                  isFull 
                    ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200' 
                    : isPartial 
                      ? 'bg-amber-950/40 border-amber-500/60 text-amber-200' 
                      : 'bg-gray-900 border-gray-700 text-gray-300'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                      {isFull && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      {isPartial && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                      {isNone && <XCircle className="w-4 h-4 text-gray-400" />}
                      <span>{refundEstimate.title}</span>
                    </span>
                    <span className={`px-2 py-0.5 rounded-none font-mono font-bold text-xs ${
                      isFull ? 'bg-emerald-600 text-white' : isPartial ? 'bg-amber-600 text-white' : 'bg-gray-700 text-gray-300'
                    }`}>
                      HOÀN {refundEstimate.refundRate}%
                    </span>
                  </div>

                  <div className="text-[11px] leading-relaxed opacity-90">
                    {refundEstimate.reason}
                  </div>

                  <div className="pt-2 border-t border-white/10 flex items-center justify-between font-mono">
                    <span className="text-gray-400">Số tiền hoàn trả về căn hộ:</span>
                    <span className={`text-base font-bold ${
                      isFull ? 'text-emerald-400' : isPartial ? 'text-amber-400' : 'text-gray-400'
                    }`}>
                      +{refundEstimate.refundAmount.toLocaleString('vi-VN')} VNĐ
                    </span>
                  </div>
                </div>

                {/* Chọn hoặc nhập lý do bận */}
                <div className="space-y-1.5">
                  <label className="text-[10.5px] text-gray-300 font-semibold uppercase block">
                    Lý do hủy lịch (tùy chọn):
                  </label>
                  <select
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    className="w-full bg-[#161D26] border border-[#2A374A] p-2 text-white text-xs rounded-none focus:outline-none focus:border-[#C5A880]"
                  >
                    <option value="Bận việc gia đình đột xuất không thể tham gia">Bận việc gia đình đột xuất</option>
                    <option value="Lịch công tác / đi xa phát sinh ngoài dự kiến">Lịch công tác / đi xa đột xuất</option>
                    <option value="Sức khỏe không đảm bảo, cần nghỉ ngơi">Sức khỏe không đảm bảo, cần nghỉ ngơi</option>
                    <option value="Thay đổi kế hoạch khác cùng bạn bè/người thân">Thay đổi kế hoạch khác</option>
                  </select>
                </div>

                <div className="text-[10.5px] text-gray-400 italic">
                  * Số tiền hoàn trả sẽ được Ban Quản Lý tự động kết chuyển và giảm trừ trực tiếp vào hóa đơn sinh hoạt kỳ kế tiếp của căn hộ {aptCode}.
                </div>

                {/* Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setRefundModalBooking(null)}
                    disabled={isProcessingRefund}
                    className="py-2.5 px-3 bg-[#161D26] hover:bg-[#1E2633] text-gray-300 text-xs font-bold rounded-none border border-[#2A374A] transition-colors"
                  >
                    Giữ Lại Lịch Đặt
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmRefund}
                    disabled={isProcessingRefund}
                    className="py-2.5 px-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-xs font-bold rounded-none transition-all flex items-center justify-center gap-1.5 shadow-lg"
                  >
                    {isProcessingRefund ? (
                      <>
                        <Wifi className="w-3.5 h-3.5 animate-spin rotate-90" />
                        <span>Đang Xử Lý Hoàn Tiền...</span>
                      </>
                    ) : (
                      <>
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Xác Nhận Hủy & Hoàn Tiền</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
