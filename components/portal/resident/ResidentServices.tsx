'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Shirt, 
  Sparkle, 
  Dumbbell, 
  Car, 
  Clock, 
  MapPin, 
  Star, 
  Calendar, 
  CheckCircle2, 
  X, 
  CreditCard, 
  Receipt, 
  UserCheck, 
  Phone, 
  Plus, 
  Minus, 
  ChevronRight, 
  History, 
  AlertCircle, 
  Info,
  ShieldCheck,
  Building,
  Check
} from 'lucide-react';
import { User } from '@/lib/dataStore';
import { 
  RESIDENT_SERVICES_CATALOG, 
  ResidentServiceItem, 
  ServicePackageOption, 
  ServiceBooking, 
  ServiceCategory, 
  getResidentBookings, 
  createResidentBooking, 
  cancelResidentBooking 
} from '@/lib/residentServiceStore';

interface ResidentServicesProps {
  currentUser: User;
  onNavigateModule?: (moduleId: string) => void;
}

export default function ResidentServices({ currentUser, onNavigateModule }: ResidentServicesProps) {
  const aptCode = currentUser.apartment_code || '12A05';
  const userName = currentUser.full_name || (currentUser as any)?.fullname || 'Cư Dân';
  const userPhone = currentUser.phone || '0901234567';

  const [activeTab, setActiveTab] = useState<'CATALOG' | 'HISTORY'>('CATALOG');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | ServiceCategory>('ALL');
  const [bookings, setBookings] = useState<ServiceBooking[]>([]);

  // Booking Modal State
  const [selectedService, setSelectedService] = useState<ResidentServiceItem | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<ServicePackageOption | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [scheduledDate, setScheduledDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [scheduledTimeSlot, setScheduledTimeSlot] = useState<string>('09:00 - 10:30');
  const [notes, setNotes] = useState<string>('');
  const [paymentChoice, setPaymentChoice] = useState<'ADD_TO_BILL' | 'PAY_NOW'>('ADD_TO_BILL');
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState<string | null>(null);

  const refreshBookings = () => {
    const list = getResidentBookings(aptCode);
    setBookings(list);
  };

  useEffect(() => {
    refreshBookings();
    const handleUpdate = () => refreshBookings();
    window.addEventListener('skyline_services_updated', handleUpdate);
    return () => window.removeEventListener('skyline_services_updated', handleUpdate);
  }, [aptCode]);

  const filteredServices = selectedCategory === 'ALL'
    ? RESIDENT_SERVICES_CATALOG
    : RESIDENT_SERVICES_CATALOG.filter(s => s.category === selectedCategory);

  const handleOpenBooking = (service: ResidentServiceItem, pkg?: ServicePackageOption) => {
    setSelectedService(service);
    setSelectedPackage(pkg || service.packages[0]);
    setQuantity(1);
    setNotes('');
    setPaymentChoice('ADD_TO_BILL');
  };

  const handleConfirmBooking = () => {
    if (!selectedService || !selectedPackage) return;

    const newBooking = createResidentBooking({
      aptCode,
      residentName: userName,
      residentPhone: userPhone,
      serviceId: selectedService.id,
      packageId: selectedPackage.id,
      quantity,
      scheduledDate,
      scheduledTimeSlot,
      notes,
      paymentChoice,
    });

    if (newBooking) {
      setSelectedService(null);
      setSelectedPackage(null);
      refreshBookings();
      setActiveTab('HISTORY');
      setBookingSuccessMsg(
        paymentChoice === 'ADD_TO_BILL'
          ? `Đặt thành công mã #${newBooking.bookingCode}! Chi phí ${newBooking.totalPrice.toLocaleString('vi-VN')} đ đã được tự động ghi nhận vào Hóa Đơn tháng này của Căn ${aptCode}.`
          : `Đặt thành công mã #${newBooking.bookingCode}! Nhân viên phụ trách sẽ liên hệ xác nhận giờ hẹn.`
      );
      setTimeout(() => setBookingSuccessMsg(null), 8000);
    }
  };

  const handleCancel = (bookingId: string) => {
    if (confirm('Bạn có chắc chắn muốn hủy đơn dịch vụ này không?')) {
      cancelResidentBooking(bookingId);
      refreshBookings();
    }
  };

  return (
    <div className="space-y-6 w-full animate-fadeIn select-none">
      {/* ------------------------------------------------------------- */}
      {/* 1. HEADER CHÍNH DỊCH VỤ CƯ DÂN                                */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222B35] pb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" /> Dịch Vụ Đời Sống 5 Sao • Căn Hộ {aptCode}
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl text-white font-bold mt-1 tracking-wide">
            Dịch Vụ Đời Sống & Tiện Ích Căn Hộ
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Đặt lịch giặt ủi cao cấp, giúp việc theo giờ, thuê Huấn luyện viên cá nhân PT Bơi/Gym và chăm sóc xe hầm B2. Tự động gộp chi phí vào hóa đơn hàng tháng.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-[#121820] p-1 border border-[#222B35] flex-shrink-0">
          <button
            onClick={() => setActiveTab('CATALOG')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeTab === 'CATALOG'
                ? 'bg-[#C5A880] text-[#0D1117] shadow-lg'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Danh Mục Dịch Vụ
          </button>

          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeTab === 'HISTORY'
                ? 'bg-[#C5A880] text-[#0D1117] shadow-lg'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" /> Lịch Sử & Đơn Hàng ({bookings.length})
          </button>
        </div>
      </div>

      {/* Thông báo thành công */}
      {bookingSuccessMsg && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-500 text-emerald-200 text-xs flex items-center justify-between gap-3 animate-fadeIn shadow-lg">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>{bookingSuccessMsg}</span>
          </div>
          {onNavigateModule && (
            <button
              onClick={() => onNavigateModule('resident-finance')}
              className="px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded text-[11px] whitespace-nowrap transition-colors"
            >
              Xem Hóa Đơn Ngay →
            </button>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. TAB 1: DANH MỤC DỊCH VỤ                                     */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'CATALOG' && (
        <div className="space-y-6">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3.5 py-1.5 font-semibold transition-all whitespace-nowrap border ${
                selectedCategory === 'ALL'
                  ? 'bg-[#C5A880] text-[#0D1117] border-[#C5A880] font-bold shadow'
                  : 'bg-[#121820] border-[#222B35] text-gray-300 hover:text-white'
              }`}
            >
              Tất Cả Dịch Vụ
            </button>

            <button
              onClick={() => setSelectedCategory('LAUNDRY')}
              className={`px-3.5 py-1.5 font-semibold transition-all whitespace-nowrap border flex items-center gap-1.5 ${
                selectedCategory === 'LAUNDRY'
                  ? 'bg-[#C5A880] text-[#0D1117] border-[#C5A880] font-bold shadow'
                  : 'bg-[#121820] border-[#222B35] text-gray-300 hover:text-white'
              }`}
            >
              <Shirt className="w-3.5 h-3.5" /> Giặt Ủi & Hấp
            </button>

            <button
              onClick={() => setSelectedCategory('HOUSEKEEPING')}
              className={`px-3.5 py-1.5 font-semibold transition-all whitespace-nowrap border flex items-center gap-1.5 ${
                selectedCategory === 'HOUSEKEEPING'
                  ? 'bg-[#C5A880] text-[#0D1117] border-[#C5A880] font-bold shadow'
                  : 'bg-[#121820] border-[#222B35] text-gray-300 hover:text-white'
              }`}
            >
              <Sparkle className="w-3.5 h-3.5" /> Giúp Việc & Dọn Dẹp
            </button>

            <button
              onClick={() => setSelectedCategory('PERSONAL_TRAINER')}
              className={`px-3.5 py-1.5 font-semibold transition-all whitespace-nowrap border flex items-center gap-1.5 ${
                selectedCategory === 'PERSONAL_TRAINER'
                  ? 'bg-[#C5A880] text-[#0D1117] border-[#C5A880] font-bold shadow'
                  : 'bg-[#121820] border-[#222B35] text-gray-300 hover:text-white'
              }`}
            >
              <Dumbbell className="w-3.5 h-3.5" /> Thuê PT Bơi & Gym
            </button>

            <button
              onClick={() => setSelectedCategory('CAR_CARE')}
              className={`px-3.5 py-1.5 font-semibold transition-all whitespace-nowrap border flex items-center gap-1.5 ${
                selectedCategory === 'CAR_CARE'
                  ? 'bg-[#C5A880] text-[#0D1117] border-[#C5A880] font-bold shadow'
                  : 'bg-[#121820] border-[#222B35] text-gray-300 hover:text-white'
              }`}
            >
              <Car className="w-3.5 h-3.5" /> Chăm Sóc Xe Hầm B2
            </button>
          </div>

          {/* Grid of Services */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredServices.map((service) => (
              <div 
                key={service.id} 
                className="bg-[#121820] border border-[#222B35] hover:border-[#C5A880]/70 transition-all flex flex-col justify-between overflow-hidden shadow-xl group"
              >
                <div>
                  {/* Service Header Image & Badges */}
                  <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-[#0A0E14]">
                    <img 
                      src={service.imageUrl} 
                      alt={service.name}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#121820] via-[#121820]/40 to-transparent" />

                    {/* Badge */}
                    {service.badge && (
                      <span className="absolute top-3 left-3 px-2.5 py-1 bg-[#C5A880] text-[#0D1117] text-[10px] font-bold uppercase tracking-wider shadow">
                        {service.badge}
                      </span>
                    )}

                    {/* Rating & Review */}
                    <div className="absolute top-3 right-3 px-2.5 py-1 bg-[#0D1117]/80 backdrop-blur-md border border-[#2D3748] text-amber-400 text-xs font-bold flex items-center gap-1 shadow">
                      <Star className="w-3 h-3 fill-amber-400" />
                      <span>{service.rating}</span>
                      <span className="text-gray-400 font-normal">({service.reviewCount})</span>
                    </div>

                    {/* Service Name & Location on bottom of image */}
                    <div className="absolute bottom-3 left-4 right-4">
                      <h3 className="font-serif text-xl sm:text-2xl font-bold text-white tracking-wide drop-shadow">
                        {service.name}
                      </h3>
                      <div className="flex items-center gap-4 text-xs text-gray-300 mt-1 drop-shadow">
                        <span className="flex items-center gap-1 text-[#C5A880]">
                          <MapPin className="w-3 h-3" /> {service.location}
                        </span>
                        <span className="flex items-center gap-1 text-gray-400">
                          <Clock className="w-3 h-3" /> {service.operatingHours}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="p-4 sm:p-5 space-y-4">
                    <p className="text-xs text-gray-300 leading-relaxed">
                      {service.description}
                    </p>

                    {/* Package Options */}
                    <div className="space-y-2.5">
                      <div className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold flex items-center justify-between">
                        <span>Bảng Giá Gói Dịch Vụ:</span>
                        <span className="text-[10px] text-[#C5A880] font-normal">Đã gồm VAT & Phí dịch vụ</span>
                      </div>

                      <div className="divide-y divide-[#222B35] border border-[#222B35] bg-[#161B22]/60">
                        {service.packages.map((pkg) => (
                          <div 
                            key={pkg.id} 
                            className="p-3 flex items-center justify-between gap-3 hover:bg-[#1A222D] transition-colors"
                          >
                            <div className="space-y-0.5">
                              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                <span>{pkg.name}</span>
                              </div>
                              <div className="text-[11px] text-gray-400">
                                {pkg.description}
                              </div>
                              {pkg.estimatedDuration && (
                                <div className="text-[10px] text-[#C5A880] font-mono">
                                  Thời gian: {pkg.estimatedDuration}
                                </div>
                              )}
                            </div>

                            <div className="text-right flex-shrink-0">
                              <div className="font-mono font-bold text-sm text-[#C5A880]">
                                {pkg.unitPrice.toLocaleString('vi-VN')} đ
                                <span className="text-[10px] text-gray-400 font-normal">/{pkg.unit}</span>
                              </div>
                              <button
                                onClick={() => handleOpenBooking(service, pkg)}
                                className="mt-1 px-2.5 py-1 bg-[#121820] hover:bg-[#C5A880] text-gray-200 hover:text-[#0D1117] border border-[#2D3748] hover:border-[#C5A880] text-[10.5px] font-bold transition-all flex items-center gap-1 ml-auto shadow-sm"
                              >
                                Đặt Gói Này <ChevronRight className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="p-4 sm:p-5 pt-0">
                  <button
                    onClick={() => handleOpenBooking(service)}
                    className="w-full py-2.5 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-colors shadow-lg flex items-center justify-center gap-2"
                  >
                    <Calendar className="w-4 h-4" /> Đặt Lịch Dịch Vụ Nhanh
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. TAB 2: LỊCH SỬ & TIẾN ĐỘ ĐƠN HÀNG                          */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'HISTORY' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-gray-400 pb-2 border-b border-[#222B35]">
            <span>Danh sách đơn đặt dịch vụ của Căn hộ <strong className="text-white font-mono">{aptCode}</strong></span>
            <span className="font-mono text-[#C5A880]">Tổng cộng: {bookings.length} đơn</span>
          </div>

          {bookings.length === 0 ? (
            <div className="p-12 text-center bg-[#121820] border border-[#222B35] space-y-3">
              <History className="w-10 h-10 text-gray-500 mx-auto" />
              <div className="text-white font-serif text-lg font-bold">Chưa Có Đơn Đặt Dịch Vụ Nào</div>
              <p className="text-xs text-gray-400 max-w-md mx-auto">
                Quý cư dân chưa đặt dịch vụ nào trong hệ thống. Hãy chọn các dịch vụ tiện ích như Giặt ủi, Dọn dẹp nhà hay Thuê PT thể thao để trải nghiệm cuộc sống tiện nghi.
              </p>
              <button
                onClick={() => setActiveTab('CATALOG')}
                className="px-5 py-2.5 bg-[#C5A880] text-[#0D1117] text-xs font-bold uppercase tracking-wider hover:bg-white transition-all shadow"
              >
                Khám Phá Dịch Vụ Ngay
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((b) => (
                <div 
                  key={b.id} 
                  className="p-4 sm:p-5 bg-[#121820] border border-[#222B35] hover:border-[#2D3748] transition-all space-y-3 shadow-md"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#222B35] pb-3">
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 bg-[#161B22] border border-[#C5A880]/60 text-[#C5A880] font-mono text-xs font-bold">
                        #{b.bookingCode}
                      </span>
                      <div>
                        <h4 className="font-bold text-white text-sm flex items-center gap-2">
                          <span>{b.packageName}</span>
                          <span className="text-xs text-gray-400 font-normal">({b.serviceName})</span>
                        </h4>
                        <div className="text-[11px] text-gray-400 mt-0.5">
                          Tạo lúc: {new Date(b.createdAt).toLocaleString('vi-VN')}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase font-mono ${
                        b.status === 'COMPLETED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-500' :
                        b.status === 'IN_PROGRESS' ? 'bg-cyan-950 text-cyan-300 border border-cyan-500' :
                        b.status === 'CONFIRMED' ? 'bg-amber-950 text-amber-300 border border-amber-500' :
                        'bg-red-950 text-red-300 border border-red-500'
                      }`}>
                        {b.status === 'COMPLETED' ? '✓ Đã Hoàn Thành' :
                         b.status === 'IN_PROGRESS' ? 'Đang Phục Vụ' :
                         b.status === 'CONFIRMED' ? 'Đã Tiếp Nhận & Xác Nhận' : 'Đã Hủy'}
                      </span>

                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase font-mono ${
                        b.paymentChoice === 'ADD_TO_BILL' 
                          ? 'bg-purple-950/80 border border-purple-500 text-purple-300' 
                          : 'bg-emerald-950/80 border border-emerald-500 text-emerald-300'
                      }`}>
                        {b.paymentChoice === 'ADD_TO_BILL' ? 'Gộp Vào Hóa Đơn' : 'Thanh Toán Ngay'}
                      </span>
                    </div>
                  </div>

                  {/* Booking Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-[#161B22]/50 p-3 border border-[#222B35]">
                    <div>
                      <span className="text-gray-400 block text-[11px]">Thời gian hẹn:</span>
                      <strong className="text-white font-mono">
                        {b.scheduledTimeSlot} • {new Date(b.scheduledDate).toLocaleDateString('vi-VN')}
                      </strong>
                    </div>

                    <div>
                      <span className="text-gray-400 block text-[11px]">Khối lượng:</span>
                      <strong className="text-white">
                        {b.quantity} {b.unit} × {b.unitPrice.toLocaleString('vi-VN')} đ
                      </strong>
                    </div>

                    <div>
                      <span className="text-gray-400 block text-[11px]">Tổng chi phí:</span>
                      <strong className="text-[#C5A880] font-mono text-sm">
                        {b.totalPrice.toLocaleString('vi-VN')} đ
                      </strong>
                    </div>

                    <div>
                      <span className="text-gray-400 block text-[11px]">Nhân viên phụ trách:</span>
                      <strong className="text-gray-200">
                        {b.assignedStaff || 'Đội Dịch Vụ BQL'}
                      </strong>
                    </div>
                  </div>

                  {/* Notes & Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs pt-1">
                    <div className="text-gray-400 italic text-[11px]">
                      {b.notes ? `* Yêu cầu đặc biệt: "${b.notes}"` : '* Không có yêu cầu đặc biệt.'}
                    </div>

                    {b.status === 'CONFIRMED' && (
                      <button
                        onClick={() => handleCancel(b.id)}
                        className="px-3 py-1 bg-red-950/50 hover:bg-red-900 border border-red-800 text-red-300 text-[11px] font-semibold transition-colors self-end sm:self-auto"
                      >
                        Hủy Đơn Này
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. MODAL ĐẶT LỊCH DỊCH VỤ                                      */}
      {/* ------------------------------------------------------------- */}
      {selectedService && selectedPackage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121820] border border-[#C5A880] max-w-xl w-full p-6 space-y-5 shadow-2xl animate-scaleUp max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#222B35] pb-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-[#C5A880] font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-[#C5A880]" /> Đặt Lịch Dịch Vụ Skyline
                </div>
                <h3 className="font-serif text-xl font-bold text-white mt-0.5">
                  {selectedService.name}
                </h3>
              </div>

              <button
                onClick={() => setSelectedService(null)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-4 text-xs">
              {/* Package Selector */}
              <div className="space-y-1.5">
                <label className="text-gray-300 font-semibold block">Chọn Gói Dịch Vụ:</label>
                <div className="grid grid-cols-1 gap-2">
                  {selectedService.packages.map((pkg) => (
                    <div
                      key={pkg.id}
                      onClick={() => setSelectedPackage(pkg)}
                      className={`p-3 border cursor-pointer transition-all flex items-center justify-between ${
                        selectedPackage.id === pkg.id
                          ? 'bg-[#161B22] border-[#C5A880] shadow'
                          : 'bg-[#0D1117] border-[#222B35] hover:border-[#2D3748]'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-white flex items-center gap-2">
                          <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                            selectedPackage.id === pkg.id ? 'border-[#C5A880] bg-[#C5A880]' : 'border-gray-500'
                          }`}>
                            {selectedPackage.id === pkg.id && <Check className="w-2.5 h-2.5 text-[#0D1117]" />}
                          </span>
                          <span>{pkg.name}</span>
                        </div>
                        <div className="text-[11px] text-gray-400 mt-0.5 pl-5.5">
                          {pkg.description}
                        </div>
                      </div>
                      <div className="font-mono font-bold text-[#C5A880] text-sm flex-shrink-0">
                        {pkg.unitPrice.toLocaleString('vi-VN')} đ<span className="text-[10px] text-gray-400 font-normal">/{pkg.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-gray-300 font-semibold block">
                    Số lượng ({selectedPackage.unit}):
                  </label>
                  <div className="flex items-center border border-[#2D3748] bg-[#0D1117]">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-2 text-gray-400 hover:text-white border-r border-[#2D3748]"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full text-center bg-transparent text-white font-mono font-bold focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-3 py-2 text-gray-400 hover:text-white border-l border-[#2D3748]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Date Picker */}
                <div className="space-y-1.5">
                  <label className="text-gray-300 font-semibold block">Ngày Phục Vụ:</label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full p-2 bg-[#0D1117] border border-[#2D3748] text-white focus:outline-none focus:border-[#C5A880] font-mono text-xs"
                  />
                </div>
              </div>

              {/* Time Slot Picker */}
              <div className="space-y-1.5">
                <label className="text-gray-300 font-semibold block">Khung Giờ Phục Vụ / Đón Đồ:</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    '08:00 - 09:30',
                    '09:30 - 11:00',
                    '14:00 - 15:30',
                    '16:00 - 17:30',
                    '17:30 - 19:00',
                    '19:00 - 20:30',
                  ].map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setScheduledTimeSlot(slot)}
                      className={`p-2 border text-center text-xs font-mono transition-all ${
                        scheduledTimeSlot === slot
                          ? 'bg-[#C5A880] text-[#0D1117] font-bold border-[#C5A880]'
                          : 'bg-[#0D1117] border-[#2D3748] text-gray-300 hover:text-white'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-gray-300 font-semibold block">Yêu Cầu Đặc Biệt / Ghi Chú:</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ví dụ: Nhận đồ tại cửa căn hộ 12A05, có veston đắt tiền cần giặt khô gấp..."
                  className="w-full p-2.5 bg-[#0D1117] border border-[#2D3748] text-white focus:outline-none focus:border-[#C5A880] text-xs resize-none"
                />
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-2 pt-2 border-t border-[#222B35]">
                <label className="text-gray-300 font-semibold block">Hình Thức Thanh Toán:</label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Option 1: ADD_TO_BILL */}
                  <div
                    onClick={() => setPaymentChoice('ADD_TO_BILL')}
                    className={`p-3 border cursor-pointer transition-all space-y-1 ${
                      paymentChoice === 'ADD_TO_BILL'
                        ? 'bg-[#161B22] border-[#C5A880] shadow'
                        : 'bg-[#0D1117] border-[#222B35] hover:border-[#2D3748]'
                    }`}
                  >
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <Receipt className="w-3.5 h-3.5 text-[#C5A880]" />
                      <span>Gộp Vào Hóa Đơn Tháng</span>
                    </div>
                    <p className="text-[10px] text-gray-400">
                      Tự động ghi nhận vào hóa đơn Căn {aptCode}. Thanh toán tập trung 1 lần qua VNPAY / VietQR cuối tháng.
                    </p>
                  </div>

                  {/* Option 2: PAY_NOW */}
                  <div
                    onClick={() => setPaymentChoice('PAY_NOW')}
                    className={`p-3 border cursor-pointer transition-all space-y-1 ${
                      paymentChoice === 'PAY_NOW'
                        ? 'bg-[#161B22] border-[#C5A880] shadow'
                        : 'bg-[#0D1117] border-[#222B35] hover:border-[#2D3748]'
                    }`}
                  >
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Thanh Toán Trực Tiếp</span>
                    </div>
                    <p className="text-[10px] text-gray-400">
                      Thanh toán tiền mặt cho nhân viên hoặc quét QR tại chỗ khi nghiệm thu dịch vụ.
                    </p>
                  </div>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="p-3.5 bg-[#0D1117] border border-[#2D3748] flex items-center justify-between">
                <div>
                  <span className="text-gray-400 text-[11px] block">Tổng Chi Phí Dịch Vụ:</span>
                  <span className="text-gray-300 font-mono text-xs">
                    {quantity} {selectedPackage.unit} × {selectedPackage.unitPrice.toLocaleString('vi-VN')} đ
                  </span>
                </div>

                <div className="text-right">
                  <div className="font-serif text-xl font-bold text-[#C5A880]">
                    {(selectedPackage.unitPrice * quantity).toLocaleString('vi-VN')} đ
                  </div>
                  <div className="text-[10px] text-emerald-400 font-semibold">
                    {paymentChoice === 'ADD_TO_BILL' ? 'Sẽ cộng vào Hóa Đơn Căn Hộ' : 'Thanh toán khi nghiệm thu'}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#222B35]">
              <button
                type="button"
                onClick={() => setSelectedService(null)}
                className="px-4 py-2 border border-gray-700 hover:border-gray-500 text-gray-300 text-xs transition-colors"
              >
                Hủy Bỏ
              </button>

              <button
                type="button"
                onClick={handleConfirmBooking}
                className="px-5 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-colors shadow-lg flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> Xác Nhận Đặt Lịch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
