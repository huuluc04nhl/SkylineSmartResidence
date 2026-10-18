'use client';

import React from 'react';
import { Calendar, Clock, Users, QrCode, CheckCircle2, XCircle, ArrowUpRight, Flame, Sparkles } from 'lucide-react';
import { FacilityBooking } from '@/lib/facilityStore';

interface FacilityPassCardProps {
  booking?: FacilityBooking;
  cancelled?: {
    bookingId: string;
    ticketCode?: string;
    facilityName?: string;
    refundAmount: number;
    refundRate: number;
  };
  onOpenDetails?: () => void;
  isEn?: boolean;
}

export default function FacilityPassCard({
  booking,
  cancelled,
  onOpenDetails,
  isEn = false
}: FacilityPassCardProps) {
  if (cancelled) {
    return (
      <div className="mt-2.5 p-3.5 bg-gradient-to-br from-[#1E1719] via-[#161215] to-[#0D0A0C] border border-rose-500/40 rounded-none shadow-xl text-xs space-y-2.5 animate-fadeIn">
        <div className="flex items-center justify-between border-b border-rose-500/20 pb-2">
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-rose-400" />
            <span className="font-bold text-rose-200 tracking-wide uppercase text-[11px]">
              {isEn ? 'Facility Pass Revoked & Refunded' : 'Đã Hủy Vé & Hoàn Tiền Tiện Ích'}
            </span>
          </div>
          <span className="px-2 py-0.5 bg-rose-950/80 text-rose-300 font-mono text-[9px] font-bold border border-rose-500/30">
            {cancelled.refundRate}% REFUND
          </span>
        </div>

        <div className="space-y-1">
          <div className="text-white font-semibold text-xs flex items-center justify-between">
            <span>{cancelled.facilityName || (isEn ? 'Reserved Facility' : 'Tiện Ích Đã Đặt')}</span>
            <span className="text-emerald-400 font-mono font-bold">
              +{cancelled.refundAmount.toLocaleString('vi-VN')} đ
            </span>
          </div>
          <div className="text-[10.5px] text-gray-400 font-mono flex items-center justify-between">
            <span>Ticket: {cancelled.ticketCode || cancelled.bookingId}</span>
            <span className="text-gray-400">{isEn ? 'Credited to next bill' : 'Trừ vào hóa đơn tháng tới'}</span>
          </div>
        </div>
      </div>
    );
  }

  if (!booking) return null;

  return (
    <div className="mt-2.5 p-3.5 bg-gradient-to-br from-[#1C2533] via-[#141B24] to-[#0A0E14] border border-[#C5A880]/60 rounded-none shadow-2xl text-xs space-y-3 relative overflow-hidden animate-fadeIn">
      {/* Luxury ambient gold accent */}
      <div className="absolute top-0 right-0 w-28 h-28 bg-[#C5A880]/10 blur-2xl pointer-events-none" />

      {/* Card Header */}
      <div className="flex items-center justify-between border-b border-[#C5A880]/20 pb-2.5 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#C5A880]/20 text-[#C5A880] flex items-center justify-center border border-[#C5A880]/40">
            <QrCode className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-[0.2em] text-[#C5A880] font-bold font-mono">
              SKYLINE RESIDENTIAL PASS
            </div>
            <div className="text-xs font-bold text-white leading-tight font-serif">
              {booking.facilityName}
            </div>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-950/80 text-emerald-400 text-[9px] font-mono font-bold border border-emerald-500/30">
          <CheckCircle2 className="w-2.5 h-2.5" />
          {isEn ? 'CONFIRMED' : 'ĐÃ XÁC NHẬN'}
        </span>
      </div>

      {/* Booking Grid details */}
      <div className="grid grid-cols-2 gap-2 text-[11px] relative z-10">
        <div className="p-2 bg-[#0E131B]/80 border border-white/5 space-y-1">
          <span className="text-gray-400 text-[10px] flex items-center gap-1">
            <Calendar className="w-3 h-3 text-[#C5A880]" /> {isEn ? 'Date' : 'Ngày đặt'}
          </span>
          <span className="font-mono text-white font-bold block">{booking.bookingDate}</span>
        </div>

        <div className="p-2 bg-[#0E131B]/80 border border-white/5 space-y-1">
          <span className="text-gray-400 text-[10px] flex items-center gap-1">
            <Clock className="w-3 h-3 text-[#C5A880]" /> {isEn ? 'Time Slot' : 'Khung giờ'}
          </span>
          <span className="font-mono text-white font-bold block">{booking.timeSlot}</span>
        </div>

        <div className="p-2 bg-[#0E131B]/80 border border-white/5 space-y-1">
          <span className="text-gray-400 text-[10px] flex items-center gap-1">
            <Users className="w-3 h-3 text-[#C5A880]" /> {isEn ? 'Guests' : 'Số khách'}
          </span>
          <span className="text-white font-medium block">
            {booking.guestCount || 2} {isEn ? 'persons' : 'người'}
          </span>
        </div>

        <div className="p-2 bg-[#0E131B]/80 border border-white/5 space-y-1">
          <span className="text-gray-400 text-[10px] flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#C5A880]" /> {isEn ? 'Deposit' : 'Giữ chỗ'}
          </span>
          <span className="text-emerald-400 font-mono font-bold block">
            {(booking.depositAmount || 0).toLocaleString('vi-VN')} đ
          </span>
        </div>
      </div>

      {/* Ticket Barcode & Code */}
      <div className="pt-2 border-t border-white/10 flex items-center justify-between relative z-10">
        <div>
          <div className="text-[9px] text-gray-500 font-mono uppercase">{isEn ? 'Smart Ticket Code' : 'Mã Vé Điện Tử'}</div>
          <div className="text-xs font-mono font-bold text-[#C5A880] tracking-wider">
            {booking.ticketCode}
          </div>
        </div>

        {onOpenDetails && (
          <button
            type="button"
            onClick={onOpenDetails}
            className="px-2.5 py-1.5 bg-[#C5A880] hover:bg-white text-[#0A0E14] font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 transition-all rounded-none shadow border-0"
          >
            <span>{isEn ? 'Open Pass' : 'Xem Thẻ'}</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}
