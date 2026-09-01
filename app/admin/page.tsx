'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Shield, 
  Lock, 
  KeyRound, 
  Building, 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Cpu,
  Server,
  Radio,
  FileText
} from 'lucide-react';
import SkylineLogo from '@/components/shared/SkylineLogo';
import { useAuth } from '@/lib/authContext';

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage('Vui lòng nhập đầy đủ Email và Mật khẩu quản trị.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const ok = await login(email.trim(), password);
      if (ok) {
        router.push('/portal');
      } else {
        setErrorMessage('Tài khoản hoặc mật khẩu Ban Quản Lý không chính xác.');
      }
    } catch (err) {
      setErrorMessage('Lỗi kết nối đến máy chủ quản trị NKS.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070A0E] text-white flex flex-col justify-between relative overflow-hidden font-sans select-none">
      {/* Background Architectural Glow & Grid Lines */}
      <div className="absolute inset-0 bg-[radial-gradient(#C5A880_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none"></div>
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#C5A880]/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-900/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Bar Header */}
      <header className="p-6 border-b border-[#1C2533] flex items-center justify-between relative z-10 max-w-7xl mx-auto w-full">
        <Link 
          href="/" 
          className="flex items-center gap-2 text-xs text-gray-400 hover:text-white uppercase tracking-wider font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-[#C5A880]" />
          Về Trang Chủ Cư Dân
        </Link>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-widest">
            BMS Network Online
          </span>
        </div>
      </header>

      {/* Main Admin Login Card Container */}
      <main className="flex-1 flex items-center justify-center p-4 relative z-10 my-8">
        <div className="w-full max-w-lg bg-[#0D1117] border-2 border-[#C5A880]/80 shadow-2xl p-8 sm:p-10 space-y-6">
          {/* Header Brand */}
          <div className="text-center space-y-3 border-b border-[#222B35] pb-6">
            <SkylineLogo variant="stacked" size="lg" theme="dark" className="mx-auto" />
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#1C2533] border border-[#C5A880] text-[#C5A880] text-[10px] uppercase font-mono font-bold tracking-widest">
              <Shield className="w-3.5 h-3.5" /> Management & Operations Console
            </div>
            <h1 className="font-serif text-2xl text-white font-bold tracking-wide">
              Cổng Điều Hành Ban Quản Lý
            </h1>
            <p className="text-xs text-gray-400 font-light">
              Xác thực định danh nhân sự vận hành tòa nhà SKYLINE Smart Residence
            </p>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="p-3 bg-rose-950/90 border border-rose-500 text-rose-300 text-xs flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Admin Credentials Form */}
          <form onSubmit={handleAdminLogin} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-gray-300 flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 font-semibold">
                  <Building className="w-4 h-4 text-[#C5A880]" /> Email Quản Trị Viên BQL:
                </span>
                <span className="text-[10px] text-gray-400 font-mono">NKS Manager API</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nks.manager01@gmail.com"
                className="w-full bg-[#161B22] border border-[#2D3748] p-3 text-white text-xs font-mono focus:outline-none focus:border-[#C5A880] transition-colors"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-gray-300 flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 font-semibold">
                  <Lock className="w-4 h-4 text-[#C5A880]" /> Mật Khẩu Quản Trị Cấp Cao:
                </span>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-[#C5A880] hover:underline flex items-center gap-1"
                >
                  {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  {showPassword ? 'Ẩn' : 'Hiện'} mật khẩu
                </button>
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu quản trị..."
                className="w-full bg-[#161B22] border border-[#2D3748] p-3 text-white text-xs font-mono focus:outline-none focus:border-[#C5A880] transition-colors"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs uppercase tracking-widest font-bold transition-all flex items-center justify-center gap-2 mt-4 shadow-2xl"
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <KeyRound className="w-4 h-4" />
              )}
              {isSubmitting ? 'Đang Xác Thực Quyền Quản Trị...' : 'Đăng Nhập Trung Tâm Điều Hành'}
            </button>
          </form>

          {/* Security Protocols Notice */}
          <div className="border-t border-[#222B35] pt-4 grid grid-cols-3 gap-2 text-center text-[10px] text-gray-400 font-mono">
            <div className="p-2 bg-[#121820] border border-[#222B35]">
              <Cpu className="w-3.5 h-3.5 text-[#C5A880] mx-auto mb-1" />
              <span>SOC Sentinel</span>
            </div>
            <div className="p-2 bg-[#121820] border border-[#222B35]">
              <Server className="w-3.5 h-3.5 text-[#C5A880] mx-auto mb-1" />
              <span>NKS Core API</span>
            </div>
            <div className="p-2 bg-[#121820] border border-[#222B35]">
              <Radio className="w-3.5 h-3.5 text-[#C5A880] mx-auto mb-1" />
              <span>AES-256 Auth</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-[11px] text-gray-500 border-t border-[#1C2533] relative z-10">
        © 2026 SKYLINE Smart Residence • Cổng thông tin nội bộ dành riêng cho Ban Quản Lý và Đội ngũ Kỹ thuật.
      </footer>
    </div>
  );
}
