'use client';

import React, { useState } from 'react';
import { 
  KeyRound, 
  Lock, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Copy, 
  Check, 
  Wand2, 
  SlidersHorizontal, 
  RefreshCw, 
  User as UserIcon, 
  Building,
  CheckCheck
} from 'lucide-react';
import { User } from '@/lib/dataStore';
import { getUserApiAvatar } from '@/lib/avatarHelper';
import { nksUpdatePassword } from '@/lib/nksApiClient';

interface AccountPasswordSectionProps {
  currentUser: User;
  onSuccess?: () => void;
  isModal?: boolean;
}

export default function AccountPasswordSection({
  currentUser,
  onSuccess,
  isModal = false,
}: AccountPasswordSectionProps) {
  const aptCode = currentUser.apartment_code || '12A05';
  const isAdmin = currentUser.role === 'ADMIN';
  const isOwner = currentUser.role === 'OWNER';

  // Form Inputs
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Visibility Toggles
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & Feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Password Generator State
  const [genLength, setGenLength] = useState<number>(14);
  const [genUppercase, setGenUppercase] = useState<boolean>(true);
  const [genLowercase, setGenLowercase] = useState<boolean>(true);
  const [genNumbers, setGenNumbers] = useState<boolean>(true);
  const [genSymbols, setGenSymbols] = useState<boolean>(true);
  const [showGenOptions, setShowGenOptions] = useState<boolean>(false);
  const [lastGeneratedPassword, setLastGeneratedPassword] = useState<string>('');
  const [copiedNotice, setCopiedNotice] = useState<boolean>(false);

  // Generate Cryptographically Strong Password
  const generateSecurePassword = (
    length = genLength,
    options = {
      uppercase: genUppercase,
      lowercase: genLowercase,
      numbers: genNumbers,
      symbols: genSymbols,
    }
  ) => {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower = 'abcdefghjkmnpqrstuvwxyz';
    const nums = '23456789';
    const syms = '!@#$%^&*()-_=+[]{}|;:,.<>?';

    let pool = '';
    const guaranteed: string[] = [];

    if (options.uppercase) {
      pool += upper;
      guaranteed.push(upper[Math.floor(Math.random() * upper.length)]);
    }
    if (options.lowercase) {
      pool += lower;
      guaranteed.push(lower[Math.floor(Math.random() * lower.length)]);
    }
    if (options.numbers) {
      pool += nums;
      guaranteed.push(nums[Math.floor(Math.random() * nums.length)]);
    }
    if (options.symbols) {
      pool += syms;
      guaranteed.push(syms[Math.floor(Math.random() * syms.length)]);
    }

    if (!pool) {
      pool = lower + nums;
      guaranteed.push(nums[0]);
    }

    const remaining = Math.max(0, length - guaranteed.length);
    const chars = [...guaranteed];
    for (let i = 0; i < remaining; i++) {
      chars.push(pool[Math.floor(Math.random() * pool.length)]);
    }

    // Shuffle using Fisher-Yates
    for (let i = chars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }

    return chars.join('');
  };

  // Trigger Generator & Auto-Fill
  const handleGenerate = (customLength?: number) => {
    const pwd = generateSecurePassword(customLength || genLength);
    setLastGeneratedPassword(pwd);
    setNewPassword(pwd);
    setConfirmPassword(pwd);
    setShowNewPassword(true);
    setShowConfirmPassword(true);
    setErrorMessage(null);
  };

  // Copy to Clipboard
  const handleCopy = async (text: string) => {
    if (!text) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setCopiedNotice(true);
        setTimeout(() => setCopiedNotice(false), 3000);
      }
    } catch (e) {
      console.warn('Copy failed:', e);
    }
  };

  // Password Strength Meter
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'Chưa nhập', color: 'bg-gray-600 text-gray-400' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/\d/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) return { score: 25, label: 'Yếu', color: 'bg-rose-500 text-rose-400' };
    if (score <= 3) return { score: 50, label: 'Trung bình', color: 'bg-amber-500 text-amber-400' };
    if (score <= 4) return { score: 75, label: 'Khá mạnh', color: 'bg-blue-500 text-blue-400' };
    return { score: 100, label: 'Rất an toàn', color: 'bg-emerald-500 text-emerald-400' };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  // Handle Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    if (!oldPassword.trim()) {
      setErrorMessage('Vui lòng nhập mật khẩu hiện tại để xác thực chủ tài khoản.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('Mật khẩu mới phải có độ dài tối thiểu 6 ký tự (khuyến nghị từ 8 ký tự trở lên).');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp với mật khẩu mới đã nhập.');
      return;
    }

    if (oldPassword === newPassword) {
      setErrorMessage('Mật khẩu mới không được trùng với mật khẩu hiện tại.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await nksUpdatePassword(oldPassword, newPassword, {
        confirmPass: confirmPassword,
        targetUserId: currentUser.id,
        targetUsername: currentUser.username || currentUser.phone || currentUser.email,
      });

      setSuccessMessage(
        res.message || 'Đổi mật khẩu tài khoản thành công! Mật khẩu mới có hiệu lực ngay lập tức trên toàn hệ thống.'
      );
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setLastGeneratedPassword('');

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Không thể cập nhật mật khẩu. Vui lòng kiểm tra lại mật khẩu hiện tại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`space-y-6 animate-fadeIn ${isModal ? '' : 'w-full'}`}>
      {/* Top Banner: Sovereign Account Identification */}
      <div className="p-5 sm:p-6 bg-[#121820] border border-[#222B35] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xl rounded-none">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-none overflow-hidden border-2 border-[#C5A880] flex-shrink-0 bg-[#0E131A] shadow-md">
            <img
              src={getUserApiAvatar(currentUser)}
              alt={currentUser.full_name || currentUser.username}
              onError={(e) => {
                e.currentTarget.src = 'https://data.nks.vn/storage/users/default.png';
              }}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#C5A880] font-mono uppercase tracking-wider font-bold">
                Tài Khoản Tự Chủ • Quyền Đổi Mật Khẩu Cá Nhân
              </span>
            </div>
            <h2 className="font-serif text-lg sm:text-xl font-bold text-white tracking-wide truncate">
              {currentUser.full_name || currentUser.username || 'Người Dùng Skyline'}
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
              <span className="font-mono text-gray-300">
                {currentUser.email || currentUser.phone || currentUser.username}
              </span>
              <span>•</span>
              <span className="text-[#C5A880] font-medium">
                {isAdmin 
                  ? 'Ban Quản Lý Tòa Nhà' 
                  : isOwner 
                  ? `Chủ Hộ Căn Hộ (Căn ${aptCode})` 
                  : `Cư Dân Thành Viên (Căn ${aptCode})`}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="px-3 py-1.5 bg-[#161D26] border border-emerald-500/50 text-emerald-300 text-xs font-semibold rounded-none flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Mã Hóa NKS 256-bit
          </span>
        </div>
      </div>

      {/* Feedback Banners */}
      {successMessage && (
        <div className="p-4 bg-emerald-950/90 border border-emerald-500 text-emerald-200 text-xs flex items-center justify-between gap-3 animate-fadeIn shadow-xl rounded-none">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-400 hover:text-white text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-950/90 border border-rose-500 text-rose-200 text-xs flex items-center justify-between gap-3 animate-fadeIn shadow-xl rounded-none">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-400 hover:text-white text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* TOOL: SMART PASSWORD GENERATOR (TRÌNH TẠO MẬT KHẨU AN TOÀN)   */}
      {/* ============================================================== */}
      <div className="p-5 sm:p-6 bg-gradient-to-br from-[#161D26] via-[#121820] to-[#0D1117] border border-[#C5A880]/40 shadow-2xl rounded-none space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222B35] pb-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-[#C5A880] text-xs font-mono uppercase tracking-wider font-bold">
              <Wand2 className="w-4 h-4 text-[#C5A880]" /> Trình Tạo Mật Khẩu Ngẫu Nhiên An Toàn (Password Generator)
            </div>
            <p className="text-xs text-gray-400">
              Sinh mật khẩu ngẫu nhiên đạt chuẩn an ninh cao nhất, tự động điền vào ô mật khẩu mới theo ý bạn.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowGenOptions(!showGenOptions)}
              className="px-3 py-1.5 bg-[#161B22] hover:bg-[#1E2631] border border-[#2D3748] text-gray-300 hover:text-white text-xs font-semibold rounded-none flex items-center gap-1.5 transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>{showGenOptions ? 'Thu Gọn Tùy Chỉnh' : 'Tùy Chỉnh Nâng Cao'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleGenerate()}
              className="px-4 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider rounded-none flex items-center gap-2 transition-all shadow active:scale-[0.99]"
            >
              <Sparkles className="w-4 h-4" /> Tạo Mật Khẩu Ngẫu Nhiên
            </button>
          </div>
        </div>

        {/* Generated Password Showcase Bar */}
        {lastGeneratedPassword && (
          <div className="p-4 bg-[#0A0E14] border border-[#C5A880] flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-none animate-fadeIn">
            <div className="space-y-1">
              <div className="text-[10px] text-gray-400 uppercase font-mono tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Mật khẩu ngẫu nhiên vừa được tạo (Độ an toàn: 100% Rất An Toàn):</span>
              </div>
              <div className="text-base sm:text-lg font-mono font-bold text-white tracking-widest break-all select-all">
                {lastGeneratedPassword}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => handleCopy(lastGeneratedPassword)}
                className="px-4 py-2 bg-[#161D26] hover:bg-[#202936] text-white border border-[#2D3748] hover:border-[#C5A880] text-xs font-semibold rounded-none flex items-center gap-2 transition-colors"
              >
                {copiedNotice ? (
                  <>
                    <CheckCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-300">Đã Sao Chép!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-[#C5A880]" />
                    <span>Sao Chép Mật Khẩu</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleGenerate()}
                title="Sinh lại chuỗi ngẫu nhiên khác"
                className="p-2 bg-[#161D26] hover:bg-[#202936] text-gray-300 hover:text-white border border-[#2D3748] rounded-none transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Collapsible Advanced Generator Settings */}
        {showGenOptions && (
          <div className="p-4 bg-[#121820] border border-[#222B35] space-y-4 rounded-none animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300 flex items-center gap-2">
                  Độ Dài Mật Khẩu: <span className="text-[#C5A880] font-mono font-bold text-sm">{genLength} ký tự</span>
                </label>
                <div className="text-[11px] text-gray-500">
                  Khuyến nghị độ dài từ 12 đến 16 ký tự để đảm bảo an toàn tối đa.
                </div>
              </div>

              <div className="w-full sm:w-64 flex items-center gap-3">
                <span className="text-[10px] text-gray-400 font-mono">8</span>
                <input
                  type="range"
                  min={8}
                  max={24}
                  value={genLength}
                  onChange={(e) => {
                    const len = Number(e.target.value);
                    setGenLength(len);
                    if (lastGeneratedPassword) handleGenerate(len);
                  }}
                  className="w-full h-1.5 bg-[#1E2631] rounded-none cursor-pointer accent-[#C5A880]"
                />
                <span className="text-[10px] text-gray-400 font-mono">24</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[#222B35] text-xs">
              <label className="flex items-center gap-2 text-gray-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={genUppercase}
                  onChange={(e) => setGenUppercase(e.target.checked)}
                  className="rounded-none accent-[#C5A880] cursor-pointer"
                />
                <span>Chữ Hoa (A - Z)</span>
              </label>

              <label className="flex items-center gap-2 text-gray-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={genLowercase}
                  onChange={(e) => setGenLowercase(e.target.checked)}
                  className="rounded-none accent-[#C5A880] cursor-pointer"
                />
                <span>Chữ Thường (a - z)</span>
              </label>

              <label className="flex items-center gap-2 text-gray-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={genNumbers}
                  onChange={(e) => setGenNumbers(e.target.checked)}
                  className="rounded-none accent-[#C5A880] cursor-pointer"
                />
                <span>Chữ Số (0 - 9)</span>
              </label>

              <label className="flex items-center gap-2 text-gray-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={genSymbols}
                  onChange={(e) => setGenSymbols(e.target.checked)}
                  className="rounded-none accent-[#C5A880] cursor-pointer"
                />
                <span>Ký Tự Đặc Biệt (!@#$)</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Main Form & Policy Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Input Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 p-6 sm:p-8 bg-[#121820] border border-[#222B35] space-y-6 shadow-2xl rounded-none">
          {/* Section Subheading */}
          <div className="border-b border-[#222B35] pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#C5A880]" /> Biểu Mẫu Thay Đổi Mật Khẩu
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Bạn có toàn quyền đặt mật khẩu bất kỳ theo ý muốn hoặc sử dụng mật khẩu được tạo tự động ở trên.
            </p>
          </div>

          {/* 1. Old Password */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-gray-400" /> Mật Khẩu Hiện Tại <span className="text-rose-400">*</span>
              </span>
            </label>
            <div className="relative">
              <input
                type={showOldPassword ? 'text' : 'password'}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Nhập mật khẩu hiện tại của bạn..."
                required
                className="w-full bg-[#161B22] border border-[#2D3748] p-3 pr-10 text-white text-xs focus:outline-none focus:border-[#C5A880] transition-colors rounded-none font-mono"
              />
              <button
                type="button"
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                tabIndex={-1}
              >
                {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="text-[11px] text-gray-500">
              Xác thực quyền sở hữu tài khoản trước khi thực hiện đổi mật khẩu mới.
            </div>
          </div>

          {/* 2. New Password */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-[#C5A880]" /> Mật Khẩu Mới <span className="text-rose-400">*</span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleGenerate()}
                  className="text-[11px] text-[#C5A880] hover:text-white flex items-center gap-1 font-semibold transition-colors"
                >
                  <Sparkles className="w-3 h-3" /> Tạo Tự Động
                </button>

                {newPassword && (
                  <span className={`text-[10px] font-mono font-bold ${passwordStrength.color.split(' ')[1]}`}>
                    • {passwordStrength.label}
                  </span>
                )}
              </div>
            </div>

            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới hoặc bấm Tạo Tự Động..."
                required
                minLength={6}
                className="w-full bg-[#161B22] border border-[#2D3748] p-3 pr-10 text-white text-xs focus:outline-none focus:border-[#C5A880] transition-colors rounded-none font-mono"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                tabIndex={-1}
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Password Strength Indicator Bar */}
            {newPassword && (
              <div className="space-y-1 pt-1">
                <div className="w-full h-1.5 bg-[#161B22] border border-[#222B35] overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${passwordStrength.color.split(' ')[0]}`}
                    style={{ width: `${passwordStrength.score}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* 3. Confirm New Password */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-gray-400" /> Nhập Lại Mật Khẩu Mới <span className="text-rose-400">*</span>
              </span>
              {confirmPassword && (
                <span className={`text-[10px] font-mono font-bold ${newPassword === confirmPassword ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {newPassword === confirmPassword ? '✓ Khớp mật khẩu' : '✕ Chưa khớp'}
                </span>
              )}
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Xác nhận lại mật khẩu mới..."
                required
                minLength={6}
                className={`w-full bg-[#161B22] border p-3 pr-10 text-white text-xs focus:outline-none transition-colors rounded-none font-mono ${
                  confirmPassword && newPassword !== confirmPassword
                    ? 'border-rose-500 focus:border-rose-400'
                    : 'border-[#2D3748] focus:border-[#C5A880]'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#222B35]">
            <button
              type="button"
              onClick={() => {
                setOldPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setLastGeneratedPassword('');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className="w-full sm:w-auto px-5 py-2.5 bg-[#161B22] hover:bg-[#1E2631] text-gray-300 hover:text-white text-xs font-semibold rounded-none border border-[#2D3748] transition-colors"
            >
              Xóa Nhập Lại
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-8 py-3 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xl rounded-none active:scale-[0.99] disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Đang Cập Nhật Mật Khẩu...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" /> Lưu Mật Khẩu Mới
                </>
              )}
            </button>
          </div>
        </form>

        {/* Right: Security Guidelines & Sync Status */}
        <div className="lg:col-span-5 space-y-6">
          {/* Policy Checklist Card */}
          <div className="p-6 bg-[#121820] border border-[#222B35] space-y-4 shadow-xl rounded-none">
            <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider border-b border-[#222B35] pb-3">
              <ShieldCheck className="w-4 h-4 text-[#C5A880]" /> Tiêu Chuẩn Bảo Mật Khuyến Nghị
            </div>
            <div className="space-y-3 text-xs">
              <div className={`flex items-center gap-2.5 ${newPassword.length >= 8 ? 'text-emerald-400' : 'text-gray-400'}`}>
                <Check className={`w-3.5 h-3.5 ${newPassword.length >= 8 ? 'text-emerald-400' : 'text-gray-500'}`} />
                <span>Độ dài từ 8 ký tự trở lên (tối thiểu 6 ký tự)</span>
              </div>
              <div className={`flex items-center gap-2.5 ${/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword) ? 'text-emerald-400' : 'text-gray-400'}`}>
                <Check className={`w-3.5 h-3.5 ${/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword) ? 'text-emerald-400' : 'text-gray-500'}`} />
                <span>Kết hợp chữ in hoa (A-Z) và chữ thường (a-z)</span>
              </div>
              <div className={`flex items-center gap-2.5 ${/\d/.test(newPassword) ? 'text-emerald-400' : 'text-gray-400'}`}>
                <Check className={`w-3.5 h-3.5 ${/\d/.test(newPassword) ? 'text-emerald-400' : 'text-gray-500'}`} />
                <span>Chứa ít nhất một chữ số (0-9)</span>
              </div>
              <div className={`flex items-center gap-2.5 ${/[^A-Za-z0-9]/.test(newPassword) ? 'text-emerald-400' : 'text-gray-400'}`}>
                <Check className={`w-3.5 h-3.5 ${/[^A-Za-z0-9]/.test(newPassword) ? 'text-emerald-400' : 'text-gray-500'}`} />
                <span>Ký tự đặc biệt (!@#$%^&*)</span>
              </div>
            </div>
          </div>

          {/* Sync Notice */}
          <div className="p-5 bg-[#161D26] border border-[#222B35] space-y-3 text-xs rounded-none">
            <div className="flex items-center gap-2 text-[#C5A880] font-semibold text-[11px] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" /> Tự Động Đồng Bộ Hệ Thống
            </div>
            <p className="text-gray-300 leading-relaxed text-[11.5px]">
              Sau khi cập nhật thành công, mật khẩu mới của bạn sẽ có hiệu lực đồng bộ trên toàn bộ nền tảng:
            </p>
            <ul className="space-y-1.5 text-gray-400 text-[11px] pl-4 list-disc">
              <li>Cổng dịch vụ số Skyline Web Portal</li>
              <li>Ứng dụng cư dân Skyline Smart Resident Mobile App</li>
              <li>Hệ thống khóa thông minh &amp; xác thực danh tính FaceID</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
