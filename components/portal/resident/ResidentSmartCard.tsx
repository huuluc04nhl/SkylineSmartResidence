'use client';

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Wifi, 
  RotateCw, 
  QrCode, 
  Sparkles, 
  CreditCard, 
  Waves, 
  CheckCircle2, 
  Lock, 
  KeyRound,
  Building,
  User as UserIcon
} from 'lucide-react';
import SkylineLogo from '@/components/shared/SkylineLogo';
import { User } from '@/lib/dataStore';

interface ResidentSmartCardProps {
  currentUser: User;
  onTapSuccess?: (facilityName: string) => void;
  className?: string;
}

export default function ResidentSmartCard({ 
  currentUser, 
  onTapSuccess,
  className = '' 
}: ResidentSmartCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isTapping, setIsTapping] = useState(false);
  const [tapMessage, setTapMessage] = useState<string | null>(null);

  const isOwner = currentUser.role === 'OWNER';
  const aptCode = currentUser.apartment_code || '12A05';
  const cardNumber = isOwner ? '9988 • 2405 • 8899 • 12A5' : '9988 • 2405 • 7766 • 12A5';
  const expiryDate = isOwner ? '12/35 (Chủ Hộ Vĩnh Viễn)' : '12/35 (Người Nhà Căn 12A05)';
  const cardHolder = (currentUser?.full_name || (currentUser as any)?.fullname || 'NGUYỄN HỮU LỰC').toUpperCase();
  const cardType = isOwner ? 'DIAMOND OWNER PASS' : 'RESIDENT FAMILY PASS';

  const handleSimulateTap = () => {
    setIsTapping(true);
    setTapMessage('📡 Đang chạm thẻ NFC vào đầu đọc Barrier...');

    setTimeout(() => {
      setIsTapping(false);
      setTapMessage('✓ BÍP! Cổng Barrier & Thang Máy Tầng 12 Đã Mở (0.28s)');
      if (onTapSuccess) {
        onTapSuccess('Cổng Sảnh Tháp Sapphire');
      }
      setTimeout(() => setTapMessage(null), 3500);
    }, 900);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 3D Perspective Card Container */}
      <div className="relative mx-auto max-w-sm sm:max-w-md w-full h-56 sm:h-64 [perspective:1000px] select-none group">
        <div
          onClick={() => setIsFlipped(!isFlipped)}
          className={`relative w-full h-full duration-700 [transform-style:preserve-3d] cursor-pointer transition-transform ${
            isFlipped ? '[transform:rotateY(180deg)]' : ''
          }`}
        >
          {/* ----------------------------------------------------------- */}
          {/* MẶT TRƯỚC: THẺ KIM LOẠI ĐEN - VÀNG ÁNH KIM VIP (FRONT)      */}
          {/* ----------------------------------------------------------- */}
          <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] rounded-none border border-[#C5A880] bg-gradient-to-br from-[#161B22] via-[#0D1117] to-[#080B10] p-5 sm:p-6 text-white shadow-2xl flex flex-col justify-between overflow-hidden">
            {/* Hologram metallic sheen effect */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#C5A880]/10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-[#C5A880]/15 rounded-full blur-2xl pointer-events-none"></div>
            <div className="absolute inset-0 bg-[radial-gradient(#C5A880_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none"></div>

            {/* Top Bar: Brand Logo + Contactless NFC Icon */}
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                <SkylineLogo variant="icon-only" size="sm" theme="dark" />
                <div>
                  <div className="font-serif text-xs sm:text-sm font-bold tracking-[0.2em] text-[#C5A880]">
                    SKYLINE
                  </div>
                  <div className="text-[8px] uppercase tracking-widest text-gray-400 font-mono">
                    SMART RESIDENCE
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-[#C5A880]/20 border border-[#C5A880] text-[#C5A880] text-[9px] font-mono font-bold tracking-widest uppercase">
                  {cardType}
                </span>
                <Wifi className="w-4 h-4 text-[#C5A880] rotate-90" />
              </div>
            </div>

            {/* Middle Bar: Gold EMV Chip & Biometric FaceID badge */}
            <div className="flex items-center justify-between relative z-10 my-1">
              {/* Metallic Gold EMV Chip */}
              <div className="w-11 h-8 bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-300 rounded-[3px] border border-amber-300 p-1 flex flex-col justify-between shadow-md">
                <div className="h-[1px] bg-amber-800/60 w-full"></div>
                <div className="h-[1px] bg-amber-800/60 w-full"></div>
                <div className="h-[1px] bg-amber-800/60 w-full"></div>
              </div>

              <div className="text-right">
                <div className="text-[9px] text-gray-400 font-mono uppercase">Căn Hộ Định Danh</div>
                <div className="font-serif text-lg sm:text-xl font-bold text-white tracking-wider">
                  Căn {aptCode}
                </div>
              </div>
            </div>

            {/* Card Number */}
            <div className="font-mono text-sm sm:text-base font-bold tracking-[0.25em] text-[#C5A880] relative z-10 drop-shadow">
              {cardNumber}
            </div>

            {/* Bottom Bar: Resident Name + Expiry + Flip Hint */}
            <div className="flex items-end justify-between border-t border-[#222B35] pt-2 relative z-10 text-[10px] font-mono">
              <div>
                <div className="text-gray-400 text-[8px] uppercase">Chủ Thẻ / Resident</div>
                <div className="font-bold text-white tracking-wider text-xs truncate max-w-[170px]">
                  {cardHolder}
                </div>
              </div>

              <div className="text-right">
                <div className="text-gray-400 text-[8px] uppercase">Thời Hạn / Valid Thru</div>
                <div className="text-gray-200 font-semibold">{expiryDate}</div>
              </div>
            </div>
          </div>

          {/* ----------------------------------------------------------- */}
          {/* MẶT SAU: DẢI TỪ TÍNH + MÃ QR SINH TRẮC HỌC (BACK)          */}
          {/* ----------------------------------------------------------- */}
          <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-none border border-[#C5A880] bg-[#0A0E14] text-white shadow-2xl flex flex-col justify-between overflow-hidden">
            {/* Magnetic Stripe */}
            <div className="w-full h-10 sm:h-12 bg-[#000000] border-t border-b border-[#222B35] mt-3"></div>

            {/* Back Content */}
            <div className="px-5 pb-4 space-y-2 text-xs flex-1 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-4 pt-1">
                {/* Dynamic QR Code for Turnstiles */}
                <div className="p-1.5 bg-white border border-gray-400 flex-shrink-0">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=SKYLINE_CARD_${aptCode}_${currentUser.role}_${cardNumber}`}
                    alt="Card QR"
                    className="w-16 h-16 sm:w-18 sm:h-18 object-contain"
                  />
                </div>

                <div className="space-y-1 text-[10px] text-gray-300 font-mono flex-1">
                  <div className="text-[#C5A880] font-bold uppercase text-[11px]">
                    Xác Thực Sinh Trắc Học FaceID
                  </div>
                  <div>Phân Tầng: <strong>Tầng 12 & Sky Pool T25</strong></div>
                  <div>Bảo Mật: <strong>Mã Hóa AES-256 + RFID</strong></div>
                  <div>Hotline BQL 24/7: <strong>1900 8899 66</strong></div>
                </div>
              </div>

              {/* Digital Signature & Terms */}
              <div className="border-t border-[#222B35] pt-2 flex items-center justify-between text-[9px] text-gray-400 font-mono">
                <span>Chữ ký điện tử BQL SKYLINE</span>
                <span className="text-[#C5A880] font-bold">VERIFIED VIP PASS</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Controls & Tap Simulator */}
      <div className="max-w-sm sm:max-w-md mx-auto space-y-2">
        <div className="flex items-center justify-between gap-2">
          {/* Button 1: Flip Card */}
          <button
            type="button"
            onClick={() => setIsFlipped(!isFlipped)}
            className="flex-1 py-2 bg-[#121820] hover:bg-[#1C2533] border border-[#222B35] hover:border-[#C5A880] text-gray-300 hover:text-white text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
          >
            <RotateCw className="w-3.5 h-3.5 text-[#C5A880]" />
            Lật {isFlipped ? 'Mặt Trước' : 'Mặt Sau'}
          </button>

          {/* Button 2: Quẹt Thẻ 1-Chạm NFC */}
          <button
            type="button"
            onClick={handleSimulateTap}
            disabled={isTapping}
            className="flex-1 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-lg"
          >
            <Wifi className="w-3.5 h-3.5 rotate-90" />
            {isTapping ? 'Đang Quẹt Thẻ...' : 'Quẹt Thẻ NFC 1-Chạm'}
          </button>
        </div>

        {/* Tap Feedback Notification */}
        {tapMessage && (
          <div className="p-2.5 bg-emerald-950/90 border border-emerald-500 text-emerald-300 text-xs font-mono text-center animate-fadeIn flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{tapMessage}</span>
          </div>
        )}

        <div className="text-center text-[10px] text-gray-400 font-light">
          * Thẻ cư dân điện tử chuẩn kim loại tích hợp RFID/NFC & FaceID mở cổng tự động trong <strong>0.28 giây</strong>.
        </div>
      </div>
    </div>
  );
}
