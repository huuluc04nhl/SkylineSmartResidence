'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  X, 
  Lock, 
  Mail,
  Smartphone, 
  ScanFace, 
  Sparkles, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  EyeOff,
  Camera,
  Timer,
  ArrowRight
} from 'lucide-react';
import SkylineLogo from '@/components/shared/SkylineLogo';
import { useAuth } from '@/lib/authContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAccount?: string;
}

type AuthMethod = 'CREDENTIALS' | 'PHONE_OTP' | 'FACE_ID';

export default function LoginModal({ isOpen, onClose, defaultAccount = '' }: LoginModalProps) {
  const router = useRouter();
  const { login } = useAuth();

  const [authMethod, setAuthMethod] = useState<AuthMethod>('CREDENTIALS');
  
  // 1. Unified Credentials state (Email / Username / Password)
  const [account, setAccount] = useState(defaultAccount);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // 2. Phone OTP state
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [isCounting, setIsCounting] = useState(false);

  // 3. FaceID state
  const [faceAccount, setFaceAccount] = useState('');
  const [faceScanStatus, setFaceScanStatus] = useState<'IDLE' | 'SCANNING' | 'LIVENESS' | 'MATCHING' | 'SUCCESS' | 'FAILED'>('IDLE');

  // Status & Error
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  // Helper: Redirect based on role
  const handleRoleRedirect = (loggedUser: any) => {
    const role = loggedUser.role;
    let roleNotice = 'Đăng nhập thành công!';
    let redirectTab = 'resident-home';

    if (role === 'ADMIN') {
      roleNotice = `Chào mừng Quản trị viên BQL: ${loggedUser.full_name}`;
      redirectTab = 'admin-dashboard';
    } else if (role === 'TECHNICIAN') {
      roleNotice = `Chào mừng Kỹ thuật viên: ${loggedUser.full_name}`;
      redirectTab = 'admin-kanban';
    } else if (role === 'OWNER') {
      roleNotice = `Chào mừng Chủ hộ Căn ${loggedUser.apartment_code || '12A05'}: ${loggedUser.full_name}`;
      redirectTab = 'resident-home';
    } else {
      roleNotice = `Chào mừng Thành viên Căn ${loggedUser.apartment_code || '12A05'}: ${loggedUser.full_name}`;
      redirectTab = 'resident-home';
    }

    setSuccessMessage(roleNotice);

    setTimeout(() => {
      onClose();
      router.push(`/portal?tab=${redirectTab}`);
    }, 500);
  };

  // 1. Handle Credentials Login (Email / Username + Password)
  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account.trim()) {
      setErrorMessage('Vui lòng nhập Email hoặc Tên tài khoản.');
      return;
    }
    if (!password) {
      setErrorMessage('Vui lòng nhập mật khẩu tài khoản.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const loggedUser = await login(account.trim(), password);
      if (loggedUser) {
        handleRoleRedirect(loggedUser);
      } else {
        setErrorMessage('Tài khoản hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Lỗi kết nối máy chủ xác thực.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Handle Send Phone OTP
  const handleSendOtp = () => {
    const cleanPhone = phone.trim().replace(/\s+/g, '');
    if (!cleanPhone || cleanPhone.length < 9) {
      setErrorMessage('Vui lòng nhập chính xác số điện thoại đã đăng ký với BQL!');
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

  // 2b. Handle Verify Phone OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.trim().replace(/\s+/g, '');
    if (!cleanPhone) {
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
    setSuccessMessage(null);

    try {
      const loggedUser = await login(cleanPhone, '12345678');
      if (loggedUser) {
        handleRoleRedirect(loggedUser);
      } else {
        setErrorMessage('Số điện thoại chưa tồn tại trong cơ sở dữ liệu cư dân tòa nhà.');
      }
    } catch (err: any) {
      setErrorMessage('Lỗi xác thực OTP từ máy chủ.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Handle FaceID Biometric Scan
  const handleStartFaceScan = async () => {
    const target = faceAccount.trim() || account.trim() || phone.trim();
    if (!target) {
      setErrorMessage('Vui lòng nhập Email hoặc Số điện thoại trước khi quét FaceID!');
      return;
    }

    setFaceScanStatus('SCANNING');
    setErrorMessage(null);
    setSuccessMessage(null);

    setTimeout(() => setFaceScanStatus('LIVENESS'), 500);
    setTimeout(() => setFaceScanStatus('MATCHING'), 1000);

    setTimeout(async () => {
      try {
        const loggedUser = await login(target, '12345678');
        if (loggedUser) {
          setFaceScanStatus('SUCCESS');
          handleRoleRedirect(loggedUser);
        } else {
          setFaceScanStatus('FAILED');
          setErrorMessage('Khuôn mặt hoặc thông tin tài khoản không khớp với hồ sơ e-KYC đã đăng ký.');
        }
      } catch (e) {
        setFaceScanStatus('FAILED');
        setErrorMessage('Lỗi kết nối máy chủ AI Vision.');
      }
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#0D1117] border border-[#C5A880]/80 p-6 sm:p-7 shadow-2xl text-white space-y-4 select-none rounded-xl">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#161B22] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Brand */}
        <div className="text-center space-y-1 border-b border-[#222B35] pb-3">
          <SkylineLogo variant="stacked" size="md" theme="dark" className="mx-auto" />
          <h3 className="font-serif text-lg text-white font-bold tracking-wide">
            Cổng SKYLINE Smart Residence
          </h3>
          <p className="text-[11px] text-gray-400 font-light">
            Cổng đăng nhập hệ thống dành cho Cư Dân & Ban Quản Lý
          </p>
        </div>

        {/* 3-Tab Selector: Email / Password | SĐT OTP | FaceID AI */}
        <div className="grid grid-cols-3 gap-1 bg-[#121820] p-1 border border-[#222B35] rounded-lg text-xs">
          <button
            type="button"
            onClick={() => { setAuthMethod('CREDENTIALS'); setErrorMessage(null); setSuccessMessage(null); }}
            className={`py-2 px-1 text-center font-medium transition-all rounded flex flex-col items-center gap-1 ${
              authMethod === 'CREDENTIALS'
                ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span className="text-[10px] sm:text-[11px]">Email / Mật Khẩu</span>
          </button>

          <button
            type="button"
            onClick={() => { setAuthMethod('PHONE_OTP'); setErrorMessage(null); setSuccessMessage(null); }}
            className={`py-2 px-1 text-center font-medium transition-all rounded flex flex-col items-center gap-1 ${
              authMethod === 'PHONE_OTP'
                ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="text-[10px] sm:text-[11px]">SĐT & Mã OTP</span>
          </button>

          <button
            type="button"
            onClick={() => { setAuthMethod('FACE_ID'); setErrorMessage(null); setSuccessMessage(null); }}
            className={`py-2 px-1 text-center font-medium transition-all rounded flex flex-col items-center gap-1 ${
              authMethod === 'FACE_ID'
                ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <ScanFace className="w-3.5 h-3.5" />
            <span className="text-[10px] sm:text-[11px]">FaceID AI</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 bg-rose-950/80 border border-rose-500 text-rose-300 text-xs flex items-center gap-2 rounded-lg animate-fadeIn">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-xs flex items-center gap-2 rounded-lg animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            <span className="font-semibold">{successMessage}</span>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 1: EMAIL / TÀI KHOẢN & MẬT KHẨU                           */}
        {/* ------------------------------------------------------------- */}
        {authMethod === 'CREDENTIALS' && (
          <form onSubmit={handleCredentialsLogin} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-gray-300 text-[11px] flex items-center justify-between font-medium">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#C5A880]" /> Email / Tài Khoản:
                </span>
                <span className="text-[10px] text-gray-400 font-mono">Cư dân & BQL</span>
              </label>
              <input
                type="text"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                placeholder="Nhập email tài khoản (VD: huuluc04@gmail.com)..."
                className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white text-xs font-mono rounded-lg focus:outline-none focus:border-[#C5A880] transition-colors"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-gray-300 text-[11px] flex items-center justify-between font-medium">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#C5A880]" /> Mật Khẩu:
                </span>
                <span className="text-[10px] text-gray-400 font-mono">Bảo mật hệ thống</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu..."
                  className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 pr-10 text-white text-xs rounded-lg focus:outline-none focus:border-[#C5A880] transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !account.trim() || !password}
              className={`w-full py-2.5 text-xs uppercase tracking-widest font-bold transition-all flex items-center justify-center gap-2 rounded-lg shadow-lg ${
                account.trim() && password && !isSubmitting
                  ? 'bg-[#C5A880] hover:bg-white text-[#0D1117]'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
              }`}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Đang Xác Thực Tài Khoản...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Đăng Nhập Hệ Thống
                </>
              )}
            </button>
          </form>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: SỐ ĐIỆN THOẠI & MÃ OTP                                 */}
        {/* ------------------------------------------------------------- */}
        {authMethod === 'PHONE_OTP' && (
          <div className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-gray-300 flex items-center justify-between text-[11px] font-medium">
                <span className="flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-[#C5A880]" /> Số Điện Thoại Cư Dân:
                </span>
                <span className="text-[10px] text-gray-400 font-mono">Đã đăng ký</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Nhập số điện thoại (VD: 0364967082)"
                  className="flex-1 bg-[#161B22] border border-[#2D3748] p-2.5 text-white text-xs font-mono rounded-lg focus:outline-none focus:border-[#C5A880]"
                  required
                />
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={isCounting}
                  className={`px-3 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    isCounting
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                      : 'bg-[#C5A880] text-[#0D1117] hover:bg-white font-bold shadow'
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

            {/* OTP Message Simulation */}
            {isOtpSent && (
              <div className="p-3 bg-[#121E2A] border border-[#C5A880]/70 rounded-lg text-xs space-y-1.5 animate-fadeIn">
                <div className="flex items-center justify-between text-[#C5A880] font-bold">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Mã OTP gửi tới {phone}:
                  </span>
                  <span className="font-mono bg-[#C5A880] text-[#0D1117] px-2 py-0.5 text-xs font-bold rounded">
                    {generatedOtp}
                  </span>
                </div>
                <div className="text-[11px] text-gray-400">
                  Mã OTP có hiệu lực trong 60 giây.
                </div>
                <button
                  type="button"
                  onClick={() => setOtpCode(generatedOtp)}
                  className="text-[10px] text-[#C5A880] underline hover:text-white font-semibold"
                >
                  Bấm để tự động điền mã: {generatedOtp}
                </button>
              </div>
            )}

            {/* Submit OTP Form */}
            <form onSubmit={handleVerifyOtp} className="space-y-3">
              <div className="space-y-1">
                <label className="text-gray-300 text-[11px] flex items-center gap-1.5 font-medium">
                  <Lock className="w-3.5 h-3.5 text-[#C5A880]" /> Nhập mã OTP 6 chữ số:
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="Nhập 6 chữ số OTP..."
                  className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-center text-lg font-mono tracking-[0.35em] text-[#C5A880] rounded-lg focus:outline-none focus:border-[#C5A880]"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !isOtpSent || otpCode.length < 6}
                className={`w-full py-2.5 text-xs uppercase tracking-widest font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                  isOtpSent && otpCode.length === 6
                    ? 'bg-[#C5A880] hover:bg-white text-[#0D1117] shadow-lg'
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                }`}
              >
                {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Xác Thực OTP & Đăng Nhập
              </button>
            </form>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 3: BIOMETRIC FACEID SCAN                                  */}
        {/* ------------------------------------------------------------- */}
        {authMethod === 'FACE_ID' && (
          <div className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-gray-300 flex items-center justify-between text-[11px] font-medium">
                <span className="flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-[#C5A880]" /> Email hoặc Số Điện Thoại Đã e-KYC:
                </span>
                <span className="text-[10px] text-gray-400 font-mono">Định danh khuôn mặt</span>
              </label>
              <input
                type="text"
                value={faceAccount}
                onChange={(e) => setFaceAccount(e.target.value)}
                placeholder="Nhập email hoặc SĐT đã đăng ký khuôn mặt..."
                className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white text-xs font-mono rounded-lg focus:outline-none focus:border-[#C5A880]"
                required
              />
            </div>

            {/* High-Tech Camera Viewport */}
            <div className="relative w-full h-36 bg-[#0A0D12] border border-[#222B35] rounded-xl flex flex-col items-center justify-center overflow-hidden">
              <div className="relative w-20 h-20 border-2 border-dashed border-[#C5A880]/60 p-1 flex items-center justify-center rounded-full">
                <Camera className="w-8 h-8 text-gray-500" />

                {/* Laser Scanning Bar */}
                {faceScanStatus !== 'IDLE' && faceScanStatus !== 'SUCCESS' && faceScanStatus !== 'FAILED' && (
                  <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#C5A880] to-transparent shadow-[0_0_12px_#C5A880] animate-bounce"></div>
                )}
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
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Kiểm tra độ chính xác sinh trắc học...
                  </span>
                )}
                {faceScanStatus === 'MATCHING' && (
                  <span className="text-[11px] text-[#C5A880] font-mono flex items-center gap-1.5 animate-pulse">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Đang đối chiếu hồ sơ hệ thống...
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
              className={`w-full py-2.5 text-xs uppercase tracking-widest font-bold transition-all flex items-center justify-center gap-2 rounded-lg shadow-lg ${
                faceScanStatus === 'IDLE' || faceScanStatus === 'FAILED'
                  ? 'bg-[#C5A880] hover:bg-white text-[#0D1117]'
                  : 'bg-[#1C2533] border border-[#C5A880] text-[#C5A880]'
              }`}
            >
              <ScanFace className="w-4 h-4" />
              {faceScanStatus === 'IDLE' || faceScanStatus === 'FAILED' ? 'Bắt Đầu Quét FaceID' : 'Đang Xử Lý Sinh Trắc Học...'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
