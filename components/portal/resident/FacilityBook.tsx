'use client';

import React, { useState } from 'react';
import { DEMO_FACILITIES, Facility } from '@/lib/dataStore';
import { CalendarCheck, Clock, Users, CheckCircle2, Star, ShieldCheck } from 'lucide-react';

export default function FacilityBook() {
  const [selectedFacility, setSelectedFacility] = useState<Facility>(DEMO_FACILITIES[0]);
  const [bookingDate, setBookingDate] = useState('2026-08-28');
  const [timeSlot, setTimeSlot] = useState('18:00 - 20:00');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingSuccess(true);
    setTimeout(() => setBookingSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 w-full animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222B35] pb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-semibold">
            Module 3.2.5 (SRS Specification)
          </div>
          <h2 className="font-serif text-2xl text-white font-bold mt-1">
            Đặt Chỗ Tiện Ích Chung (Facility Booking)
          </h2>
        </div>

        <div className="text-xs text-gray-300">
          Quota Tháng Căn 12A05: <strong className="text-[#C5A880] font-mono">18 / 20 lượt còn lại</strong>
        </div>
      </div>

      {bookingSuccess && (
        <div className="p-4 bg-emerald-950 border border-emerald-500 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> Đặt chỗ thành công! Mã xác nhận vé điện tử đã được ghi nhận vào thẻ cư dân của bạn.
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
              <div className="relative h-28 overflow-hidden">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5">
            <label className="text-gray-400">Chọn ngày sử dụng:</label>
            <input
              type="date"
              value={bookingDate}
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
              <option>18:00 - 20:00 (Buổi tối - Giờ cao điểm)</option>
              <option>20:00 - 22:00 (Đêm muộn)</option>
            </select>
          </div>
        </div>

        <div className="p-3 bg-[#161B22] border border-[#222B35] flex items-center justify-between text-xs">
          <span className="text-gray-400">Biểu phí áp dụng:</span>
          <span className="text-[#C5A880] font-bold">{selectedFacility.pricing}</span>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-colors"
          >
            Xác Nhận Đặt Tiện Ích
          </button>
        </div>
      </form>
    </div>
  );
}
