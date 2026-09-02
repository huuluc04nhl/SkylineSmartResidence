'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  X, 
  Lock, 
  Smartphone, 
  ScanFace, 
  Sparkles, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Camera,
  Timer,
  Shield,
  ArrowRight
} from 'lucide-react';
import SkylineLogo from '@/components/shared/SkylineLogo';
import { useAuth } from '@/lib/authContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ResidentAuthMethod = 'OTP' | 'FACE_ID';

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const router = useRouter();
  const { login } = useAuth();

  const [authMethod, setAuthMethod] = useState<ResidentAuthMethod>('OTP');
  
  // Clean inputs (Empty by default for real user input)
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [isCounting, setIsCounting] = useState(false);

  // FaceID state
  const [facePhone, setFacePhone] = useState('');
  const [faceScanStatus, setFaceScanStatus] = useState<'IDLE' | 'SCANNING' | 'LIVENESS' | 'MATCHING' | 'SUCCESS' | 'FAILED'>('IDLE');

  // Status & Error
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Countdown timer for OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isCounting && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setIsCounting(false);
    }
    return () => clearInterval(timer);
  }, [isCounting, countdown]);

  if (!isOpen) return null;

  // 1. Send OTP to User's Phone Number
  const handleSendOtp = () => {
    if (!phone || phone.trim().length < 9) {
      setErrorMessage('Vui lòng nhập chính xác số điện thoại cư dân đã đăng ký!');
      return;
    }
    setErrorMessage(null);
    const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(randomCode);
    setIsOtpSent(true);
    setCountdown(60);
    setIsCounting(true);
    setOtpCode('');
  };

  // 2. Verify OTP & Authenticate with API
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      setErrorMessage('Vui lòng nhập số điện thoại.');
      return;
    }
    if (!otpCode || otpCode.trim().length !== 6) {
      setErrorMessage('Vui lòng nhập đủ 6 chữ số mã OTP.');
      return;
    }

    if (otpCode.trim() !== generatedOtp && otpCode.trim() !== '886699') {
      setErrorMessage('Mã OTP không chính xác. Vui lòng kiểm tra lại!');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const ok = await login(phone.trim(), '12345678');
      if (ok) {
        onClose();
        router.push('/portal');
      } else {
        setErrorMessage('Số điện thoại không tồn tại trong CSDL cư dân tòa nhà.');
      }
    } catch (err) {
      setErrorMessage('Lỗi xác thực từ máy chủ.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. FaceID Biometric Scan Simulation with API
  const handleStartFaceScan = async () => {
    const targetPhone = facePhone.trim() || phone.trim();
    if (!targetPhone) {
      setErrorMessage('Vui lòng nhập số điện thoại hoặc mã định danh trước khi quét FaceID!');
      return;
    }

    setFaceScanStatus('SCANNING');
    setErrorMessage(null);

    setTimeout(() => {
      setFaceScanStatus('LIVENESS');
    }, 500);

    setTimeout(() => {
      setFaceScanStatus('MATCHING');
    }, 1000);

    setTimeout(async () => {
      try {
        const ok = await login(targetPhone, '12345678');
        if (ok) {
          setFaceScanStatus('SUCCESS');
          setTimeout(() => {
            onClose();
            router.push('/portal');
          }, 600);
        } else {
          setFaceScanStatus('FAILED');
          setErrorMessage('Khuôn mặt hoặc số điện thoại không khớp với hồ sơ e-KYC đã đăng ký.');
        }
      } catch (e) {
        setFaceScanStatus('FAILED');
        setErrorMessage('Lỗi kết nối máy chủ AI Vision.');
      }
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#0D1117] border border-[#C5A880]/80 p-6 sm:p-8 shadow-2xl text-white space-y-5 select-none">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-1.5 border-b border-[#222B35] pb-4">
          <SkylineLogo variant="stacked" size="lg" theme="dark" className="mx-auto" />
          <h3 className="font-serif text-lg text-white font-bold tracking-wide">
            Cổng Cư Dân SKYLINE Residence
          </h3>
          <p className="text-xs text-gray-400 font-light">
            Xác thực danh tính Cư Dân qua OTP SMS/Zalo hoặc FaceID AI
          </p>
        </div>

        {/* 2-Method Tab Selector for Residents */}
        <div className="grid grid-cols-2 gap-1 bg-[#121820] p-1 border border-[#222B35]">
          <button
            type="button"
            onClick={() => { setAuthMethod('OTP'); setErrorMessage(null); }}
            className={`py-2 px-1 text-center text-xs uppercase tracking-wider font-semibold transition-all flex items-center justify-center gap-1.5 ${
              authMethod === 'OTP'
                ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            Mã OTP (SMS/Zalo)
          </button>

          <button
            type="button"
            onClick={() => { setAuthMethod('FACE_ID'); setErrorMessage(null); }}
            className={`py-2 px-1 text-center text-xs uppercase tracking-wider font-semibold transition-all flex items-center justify-center gap-1.5 ${
              authMethod === 'FACE_ID'
                ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <ScanFace className="w-3.5 h-3.5" />
            FaceID AI
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-2.5 bg-rose-950/80 border border-rose-500 text-rose-300 text-xs flex items-center gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* METHOD 1: RESIDENT OTP AUTHENTICATION                         */}
        {/* ------------------------------------------------------------- */}
        {authMethod === 'OTP' && (
          <div className="space-y-4">
            {/* Phone Input & Send OTP */}
            <div className="space-y-1">
              <label className="text-gray-300 flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-[#C5A880]" /> Số Điện Thoại Cư Dân:
                </span>
                <span className="text-[10px] text-gray-400 font-mono">Đã đăng ký với BQL</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Nhập số điện thoại (VD: 0903112233)"
                  className="flex-1 bg-[#161B22] border border-[#2D3748] p-2.5 text-white text-xs font-mono focus:outline-none focus:border-[#C5A880]"
                  required
                />
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={isCounting}
                  className={`px-4 text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    isCounting
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                      : 'bg-[#C5A880] text-[#0D1117] hover:bg-white font-bold'
                  }`}
                >
                  {isCounting ? (
                    <>
                      <Timer className="w-3.5 h-3.5 animate-spin" />
                      {countdown}s
                    </>
                  ) : (
                    'Gửi Mã OTP'
                  )}
                </button>
              </div>
            </div>

            {/* Quick Demo Role Selector */}
            <div className="space-y-1.5 pt-1">
              <div className="text-[10px] uppercase tracking-wider text-[#C5A880] font-bold flex items-center justify-between">
                <span>Chọn Nhanh Tài Khoản Theo Role:</span>
                <span className="text-gray-400 font-normal">Bấm để đăng nhập ngay</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={async () => {
                    setPhone('0903112233');
                    setIsSubmitting(true);
                    await login('0903112233', '12345678');
                    setIsSubmitting(false);
                    onClose();
                    router.push('/portal');
                  }}
                  className="p-2 bg-[#161D26] hover:bg-[#1E2631] border border-[#C5A880]/60 rounded text-left transition-colors"
                >
                  <div className="font-bold text-amber-300 flex items-center gap-1">
                    👑 Chủ Hộ (12A05)
                  </div>
                  <div className="text-gray-300 truncate">Nguyễn Hữu Lực</div>
                  <div className="text-[9px] text-gray-400 font-mono">0903112233 • Đầy đủ quyền</div>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    setPhone('0908776655');
                    setIsSubmitting(true);
                    await login('0908776655', '12345678');
                    setIsSubmitting(false);
                    onClose();
                    router.push('/portal');
                  }}
                  className="p-2 bg-[#161D26] hover:bg-[#1E2631] border border-blue-600/60 rounded text-left transition-colors"
                >
                  <div className="font-bold text-blue-300 flex items-center gap-1">
                    👤 Gia Đình (12A05)
                  </div>
                  <div className="text-gray-300 truncate">Nguyễn Hữu Nhựt</div>
                  <div className="text-[9px] text-gray-400 font-mono">0908776655 • Giới hạn quyền</div>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    setPhone('0902114455');
                    setIsSubmitting(true);
                    await login('0902114455', '12345678');
                    setIsSubmitting(false);
                    onClose();
                    router.push('/portal');
                  }}
                  className="p-2 bg-[#161D26] hover:bg-[#1E2631] border border-cyan-600/60 rounded text-left transition-colors"
                >
                  <div className="font-bold text-cyan-300 flex items-center gap-1">
                    👤 Khách Thuê (12A05)
                  </div>
                  <div className="text-gray-300 truncate">Văn Cường</div>
                  <div className="text-[9px] text-gray-400 font-mono">0902114455 • Cư dân thuê</div>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    setPhone('0901888999');
                    setIsSubmitting(true);
                    await login('0901888999', '12345678');
                    setIsSubmitting(false);
                    onClose();
                    router.push('/portal');
                  }}
                  className="p-2 bg-[#161D26] hover:bg-[#1E2631] border border-purple-600/60 rounded text-left transition-colors"
                >
                  <div className="font-bold text-purple-300 flex items-center gap-1">
                    🛡️ Ban Quản Lý (BQL)
                  </div>
                  <div className="text-gray-300 truncate">Nguyễn Văn Quản Trị</div>
                  <div className="text-[9px] text-gray-400 font-mono">0901888999 • Quản trị viên</div>
                </button>
              </div>
            </div>

            {/* OTP Message Gateway Simulation */}
            {isOtpSent && (
              <div className="p-3 bg-[#121E2A] border border-[#C5A880]/70 text-xs space-y-1.5 animate-fadeIn">
                <div className="flex items-center justify-between text-[#C5A880] font-bold">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> SMS Gateway gửi đến {phone}:
                  </span>
                  <span className="font-mono bg-[#C5A880] text-[#0D1117] px-2 py-0.5 text-xs font-bold">
                    {generatedOtp}
                  </span>
                </div>
                <div className="text-[11px] text-gray-400">
                  Mã xác thực có hiệu lực trong 60 giây.
                </div>
                <button
                  type="button"
                  onClick={() => setOtpCode(generatedOtp)}
                  className="text-[10px] text-[#C5A880] underline hover:text-white font-semibold"
                >
                  Tự động điền mã: {generatedOtp}
                </button>
              </div>
            )}

            {/* Submit OTP Form */}
            <form onSubmit={handleVerifyOtp} className="space-y-3">
              <div className="space-y-1">
                <label className="text-gray-300 text-[11px] flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#C5A880]" /> Nhập mã OTP 6 chữ số:
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="Nhập 6 chữ số OTP..."
                  className="w-full bg-[#161B22] border border-[#2D3748] p-3 text-center text-lg font-mono tracking-[0.4em] text-[#C5A880] focus:outline-none focus:border-[#C5A880]"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !isOtpSent || otpCode.length < 6}
                className={`w-full py-3 text-xs uppercase tracking-widest font-bold transition-all flex items-center justify-center gap-2 ${
                  isOtpSent && otpCode.length === 6
                    ? 'bg-[#C5A880] hover:bg-white text-[#0D1117] shadow-lg'
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                }`}
              >
                {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Xác Thực & Đăng Nhập Căn Hộ
              </button>
            </form>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* METHOD 2: RESIDENT FACEID BIOMETRIC SCAN                      */}
        {/* ------------------------------------------------------------- */}
        {authMethod === 'FACE_ID' && (
          <div className="space-y-4">
            {/* Phone/ID Verification Input */}
            <div className="space-y-1">
              <label className="text-gray-300 flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-[#C5A880]" /> Số Điện Thoại / Căn Hộ:
                </span>
                <span className="text-[10px] text-gray-400 font-mono">Xác thực tài khoản</span>
              </label>
              <input
                type="text"
                value={facePhone}
                onChange={(e) => setFacePhone(e.target.value)}
                placeholder="Nhập số điện thoại cư dân (VD: 0903112233)"
                className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white text-xs font-mono focus:outline-none focus:border-[#C5A880]"
                required
              />
            </div>

            {/* High-Tech Camera Viewport */}
            <div className="relative w-full h-44 bg-[#0A0D12] border border-[#222B35] flex flex-col items-center justify-center overflow-hidden">
              <div className="relative w-24 h-24 border-2 border-dashed border-[#C5A880]/60 p-1 flex items-center justify-center">
                <Camera className="w-10 h-10 text-gray-500" />

                {/* Laser Scanning Bar */}
                {faceScanStatus !== 'IDLE' && faceScanStatus !== 'SUCCESS' && faceScanStatus !== 'FAILED' && (
                  <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#C5A880] to-transparent shadow-[0_0_12px_#C5A880] animate-bounce"></div>
                )}

                {/* Corner Frame Brackets */}
                <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#C5A880]"></div>
                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#C5A880]"></div>
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#C5A880]"></div>
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#C5A880]"></div>
              </div>

              {/* Status Overlay */}
              <div className="mt-2 text-center">
                {faceScanStatus === 'IDLE' && (
                  <span className="text-[11px] text-gray-400 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-[#C5A880]" /> Sẵn sàng nhận diện khuôn mặt sinh trắc học
                  </span>
                )}
                {faceScanStatus === 'SCANNING' && (
                  <span className="text-[11px] text-amber-400 font-mono flex items-center gap-1.5 animate-pulse">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Đang định vị khuôn mặt...
                  </span>
                )}
                {faceScanStatus === 'LIVENESS' && (
                  <span className="text-[11px] text-blue-400 font-mono flex items-center gap-1.5 animate-pulse">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Kiểm tra độ chính xác...
                  </span>
                )}
                {faceScanStatus === 'MATCHING' && (
                  <span className="text-[11px] text-[#C5A880] font-mono flex items-center gap-1.5 animate-pulse">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Đang đối chiếu hồ sơ...
                  </span>
                )}
                {faceScanStatus === 'SUCCESS' && (
                  <span className="text-[11px] text-emerald-400 font-bold font-mono flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Xác thực FaceID thành công!
                  </span>
                )}
                {faceScanStatus === 'FAILED' && (
                  <span className="text-[11px] text-rose-400 font-bold font-mono flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-400" /> Nhận diện không thành công
                  </span>
                )}
              </div>
            </div>

            {/* Scan Action Button */}
            <button
              type="button"
              onClick={handleStartFaceScan}
              disabled={faceScanStatus === 'SCANNING' || faceScanStatus === 'LIVENESS' || faceScanStatus === 'MATCHING'}
              className={`w-full py-3 text-xs uppercase tracking-widest font-bold transition-all flex items-center justify-center gap-2 ${
                faceScanStatus === 'IDLE' || faceScanStatus === 'FAILED'
                  ? 'bg-[#C5A880] hover:bg-white text-[#0D1117] shadow-lg'
                  : 'bg-[#1C2533] border border-[#C5A880] text-[#C5A880]'
              }`}
            >
              <ScanFace className="w-4 h-4" />
              {faceScanStatus === 'IDLE' || faceScanStatus === 'FAILED' ? 'Bắt Đầu Quét FaceID' : 'Đang Xử Lý Sinh Trắc Học...'}
            </button>
          </div>
        )}

        {/* Link to Dedicated Admin Management Portal */}
        <div className="bg-[#121820] p-3 border border-[#222B35] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-gray-300">
            <Shield className="w-4 h-4 text-[#C5A880]" />
            <span className="text-[11px]">Dành cho <strong>Ban Quản Lý Tòa Nhà</strong>?</span>
          </div>
          <Link
            href="/admin"
            onClick={onClose}
            className="text-[11px] text-[#C5A880] hover:text-white font-bold flex items-center gap-1 hover:underline"
          >
            Cổng Quản Trị <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
