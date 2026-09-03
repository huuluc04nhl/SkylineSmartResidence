'use client';

import React, { useState } from 'react';
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
  Shield,
  ArrowRight,
  UserCheck
} from 'lucide-react';
import SkylineLogo from '@/components/shared/SkylineLogo';
import { useAuth } from '@/lib/authContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAccount?: string;
}

type AuthMethod = 'CREDENTIALS' | 'FACE_ID';

export default function LoginModal({ isOpen, onClose, defaultAccount = '' }: LoginModalProps) {
  const router = useRouter();
  const { login } = useAuth();

  const [authMethod, setAuthMethod] = useState<AuthMethod>('CREDENTIALS');
  
  // Unified credentials state
  const [account, setAccount] = useState(defaultAccount);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // FaceID state
  const [facePhone, setFacePhone] = useState('');
  const [faceScanStatus, setFaceScanStatus] = useState<'IDLE' | 'SCANNING' | 'LIVENESS' | 'MATCHING' | 'SUCCESS' | 'FAILED'>('IDLE');

  // Status & Error
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // 1. Unified Credentials Login (Email / Phone / Username + Password)
  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account.trim()) {
      setErrorMessage('Vui lòng nhập Email, Số điện thoại hoặc Tên tài khoản.');
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
      } else {
        setErrorMessage('Tài khoản hoặc mật khẩu không chính xác. Vui lòng thử lại.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Lỗi kết nối máy chủ xác thực.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. FaceID Biometric Scan Simulation
  const handleStartFaceScan = async () => {
    const target = facePhone.trim() || account.trim();
    if (!target) {
      setErrorMessage('Vui lòng nhập Email hoặc Số điện thoại trước khi quét FaceID!');
      return;
    }

    setFaceScanStatus('SCANNING');
    setErrorMessage(null);
    setSuccessMessage(null);

    setTimeout(() => {
      setFaceScanStatus('LIVENESS');
    }, 500);

    setTimeout(() => {
      setFaceScanStatus('MATCHING');
    }, 1000);

    setTimeout(async () => {
      try {
        const loggedUser = await login(target, '12345678');
        if (loggedUser) {
          setFaceScanStatus('SUCCESS');
          const redirectTab = (loggedUser.role === 'ADMIN') 
            ? 'admin-dashboard' 
            : (loggedUser.role === 'TECHNICIAN')
            ? 'admin-kanban'
            : 'resident-home';

          setTimeout(() => {
            onClose();
            router.push(`/portal?tab=${redirectTab}`);
          }, 600);
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
      <div className="relative w-full max-w-md bg-[#0D1117] border border-[#C5A880]/80 p-6 sm:p-8 shadow-2xl text-white space-y-5 select-none rounded-xl">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#161B22] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Brand */}
        <div className="text-center space-y-1.5 border-b border-[#222B35] pb-4">
          <SkylineLogo variant="stacked" size="lg" theme="dark" className="mx-auto" />
          <h3 className="font-serif text-lg text-white font-bold tracking-wide">
            Hệ Thống SKYLINE Smart Residence
          </h3>
          <p className="text-xs text-gray-400 font-light">
            Cổng đăng nhập thống nhất dành cho Cư Dân & Ban Quản Lý
          </p>
        </div>

        {/* 2-Method Tab Selector: Account / Password vs FaceID AI */}
        <div className="grid grid-cols-2 gap-1 bg-[#121820] p-1 border border-[#222B35] rounded-lg">
          <button
            type="button"
            onClick={() => { setAuthMethod('CREDENTIALS'); setErrorMessage(null); }}
            className={`py-2 px-1 text-center text-xs uppercase tracking-wider font-semibold transition-all flex items-center justify-center gap-1.5 rounded ${
              authMethod === 'CREDENTIALS'
                ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            Tài Khoản & Mật Khẩu
          </button>

          <button
            type="button"
            onClick={() => { setAuthMethod('FACE_ID'); setErrorMessage(null); }}
            className={`py-2 px-1 text-center text-xs uppercase tracking-wider font-semibold transition-all flex items-center justify-center gap-1.5 rounded ${
              authMethod === 'FACE_ID'
                ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <ScanFace className="w-3.5 h-3.5" />
            FaceID AI Sinh Trắc
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
        {/* METHOD 1: UNIFIED ACCOUNT & PASSWORD LOGIN                    */}
        {/* ------------------------------------------------------------- */}
        {authMethod === 'CREDENTIALS' && (
          <form onSubmit={handleCredentialsLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-gray-300 text-[11px] flex items-center justify-between font-medium">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#C5A880]" /> Email / Số Điện Thoại / Tài Khoản:
                </span>
                <span className="text-[10px] text-gray-400 font-mono">Cư dân & BQL</span>
              </label>
              <input
                type="text"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                placeholder="Nhập email hoặc số điện thoại..."
                className="w-full bg-[#161B22] border border-[#2D3748] p-3 text-white text-xs font-mono rounded-lg focus:outline-none focus:border-[#C5A880] transition-colors"
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
                  className="w-full bg-[#161B22] border border-[#2D3748] p-3 pr-10 text-white text-xs rounded-lg focus:outline-none focus:border-[#C5A880] transition-colors"
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
              className={`w-full py-3 text-xs uppercase tracking-widest font-bold transition-all flex items-center justify-center gap-2 rounded-lg shadow-lg ${
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
        {/* METHOD 2: BIOMETRIC FACEID SCAN                               */}
        {/* ------------------------------------------------------------- */}
        {authMethod === 'FACE_ID' && (
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-gray-300 flex items-center justify-between text-[11px] font-medium">
                <span className="flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-[#C5A880]" /> Email hoặc Số Điện Thoại Đã e-KYC:
                </span>
                <span className="text-[10px] text-gray-400 font-mono">Định danh khuôn mặt</span>
              </label>
              <input
                type="text"
                value={facePhone}
                onChange={(e) => setFacePhone(e.target.value)}
                placeholder="Nhập email hoặc SĐT đã đăng ký khuôn mặt..."
                className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white text-xs font-mono rounded-lg focus:outline-none focus:border-[#C5A880]"
                required
              />
            </div>

            {/* High-Tech Camera Viewport */}
            <div className="relative w-full h-44 bg-[#0A0D12] border border-[#222B35] rounded-xl flex flex-col items-center justify-center overflow-hidden">
              <div className="relative w-24 h-24 border-2 border-dashed border-[#C5A880]/60 p-1 flex items-center justify-center rounded-full">
                <Camera className="w-10 h-10 text-gray-500" />

                {/* Laser Scanning Bar */}
                {faceScanStatus !== 'IDLE' && faceScanStatus !== 'SUCCESS' && faceScanStatus !== 'FAILED' && (
                  <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#C5A880] to-transparent shadow-[0_0_12px_#C5A880] animate-bounce"></div>
                )}
              </div>

              {/* Status Overlay */}
              <div className="mt-3 text-center">
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
              className={`w-full py-3 text-xs uppercase tracking-widest font-bold transition-all flex items-center justify-center gap-2 rounded-lg shadow-lg ${
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
