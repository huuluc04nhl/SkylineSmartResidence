'use client';

import React, { useState, useEffect } from 'react';
import { DEMO_FACILITIES, Facility, User } from '@/lib/dataStore';
import { CalendarCheck, Clock, Users, CheckCircle2, Star, ShieldCheck, QrCode } from 'lucide-react';
import { 
  createFacilityBooking, 
  getFacilityMonthlyQuota, 
  getFacilityBookings,
  FacilityBooking 
} from '@/lib/facilityStore';

interface FacilityBookProps {
  currentUser?: User;
}

export default function FacilityBook({ currentUser }: FacilityBookProps) {
  const aptCode = currentUser?.apartment_code || '12A05';
  const userName = currentUser?.full_name || (currentUser as any)?.fullname || 'Cư Dân';

  const [selectedFacility, setSelectedFacility] = useState<Facility>(DEMO_FACILITIES[0]);
  const [bookingDate, setBookingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot] = useState('18:00 - 20:00 (Buổi tối)');
  const [guestCount, setGuestCount] = useState(2);
  const [quota, setQuota] = useState(() => getFacilityMonthlyQuota(aptCode));
  const [createdTicket, setCreatedTicket] = useState<FacilityBooking | null>(null);

  useEffect(() => {
    setQuota(getFacilityMonthlyQuota(aptCode));
  }, [aptCode]);

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (quota.remaining <= 0) {
      alert('Căn hộ của Quý cư dân đã sử dụng hết hạn mức tiện ích trong tháng!');
      return;
    }

    const { newBooking } = createFacilityBooking(
      aptCode,
      selectedFacility.id,
      selectedFacility.name,
      bookingDate,
      timeSlot,
      userName,
      selectedFacility.pricing,
      guestCount,
      'Đặt qua cổng cư dân',
      2,
      0,
      false,
      'Miễn phí theo hạn mức sinh hoạt'
    );

    setCreatedTicket(newBooking);
    setQuota(getFacilityMonthlyQuota(aptCode));
  };

  return (
    <div className="space-y-6 w-full animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222B35] pb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-semibold">
            Tiện Ích Cao Cấp • Dành Cho Cư Dân
          </div>
          <h2 className="font-serif text-2xl text-white font-bold mt-1">
            Đặt Chỗ Tiện Ích Đặc Quyền
          </h2>
        </div>

        <div className="text-xs text-gray-300">
          Hạn Mức Tháng Căn {aptCode}:{' '}
          <strong className="text-[#C5A880] font-mono">
            {quota.remaining} / {quota.max} lượt còn lại
          </strong>
        </div>
      </div>

      {createdTicket && (
        <div className="p-4 bg-emerald-950 border border-emerald-500 text-emerald-300 text-xs space-y-2 animate-fadeIn">
          <div className="flex items-center gap-2 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>Đặt chỗ thành công! Mã vé điện tử: {createdTicket.ticketCode}</span>
          </div>
          <p className="text-gray-300 text-xs">
            Tiện ích: <strong>{createdTicket.facilityName}</strong> • Ngày: <strong>{createdTicket.bookingDate}</strong> • Khung giờ: <strong>{createdTicket.timeSlot}</strong>.
            Vé đã được lưu vào hệ thống kiểm soát ra vào của Ban Quản Lý.
          </p>
        </div>
      )}

      {/* Facilities Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {DEMO_FACILITIES.map((f) => {
          const isSelected = selectedFacility.id === f.id;
          return (
            <div
              key={f.id}
              onClick={() => setSelectedFacility(f)}
              className={`p-4 bg-[#121820] border cursor-pointer transition-all space-y-3 ${
                isSelected ? 'border-[#C5A880] ring-1 ring-[#C5A880]' : 'border-[#222B35] hover:border-gray-600'
              }`}
            >
              <div className="relative h-28 overflow-hidden bg-black">
                <img src={f.hero_image_url} alt={f.name} className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2 bg-black/80 px-2 py-0.5 text-[10px] text-[#C5A880] flex items-center gap-1">
                  <Star className="w-3 h-3 fill-[#C5A880]" /> {f.rating_score}
                </div>
              </div>
              <h4 className="font-serif text-sm font-bold text-white line-clamp-1">{f.name}</h4>
              <div className="text-[11px] text-gray-400">Hạn mức: {f.max_quota_per_month} lượt/tháng</div>
            </div>
          );
        })}
      </div>

      {/* Booking Form */}
      <form onSubmit={handleBooking} className="p-6 bg-[#121820] border border-[#222B35] space-y-4">
        <h3 className="font-serif text-lg font-bold text-white border-b border-[#222B35] pb-2">
          Xác Nhận Đặt Chỗ: {selectedFacility.name}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="space-y-1.5">
            <label className="text-gray-400">Chọn ngày sử dụng:</label>
            <input
              type="date"
              value={bookingDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setBookingDate(e.target.value)}
              className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white focus:outline-none focus:border-[#C5A880]"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-gray-400">Khung giờ đặt:</label>
            <select
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
              className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white focus:outline-none focus:border-[#C5A880]"
            >
              <option>06:00 - 08:00 (Sáng sớm)</option>
              <option>16:00 - 18:00 (Buổi chiều)</option>
              <option>18:00 - 20:00 (Buổi tối - Giờ đẹp)</option>
              <option>20:00 - 22:00 (Đêm muộn)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-gray-400">Số lượng người tham gia:</label>
            <input
              type="number"
              min={1}
              max={10}
              value={guestCount}
              onChange={(e) => setGuestCount(Number(e.target.value))}
              className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white focus:outline-none focus:border-[#C5A880]"
              required
            />
          </div>
        </div>

        <div className="p-3 bg-[#161B22] border border-[#222B35] flex items-center justify-between text-xs">
          <span className="text-gray-400">Biểu phí áp dụng:</span>
          <span className="text-[#C5A880] font-bold">{selectedFacility.pricing}</span>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-colors shadow-lg"
          >
            Xác Nhận Đặt Tiện Ích
          </button>
        </div>
      </form>
    </div>
  );
}
