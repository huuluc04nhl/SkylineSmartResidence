'use client';

import React, { useState, useEffect } from 'react';
import { User as UserType, DEMO_COMMUNITY_POSTS } from '@/lib/dataStore';
import ResidentSmartCard from './ResidentSmartCard';
import { 
  QrCode, 
  UserCheck, 
  Wrench, 
  CreditCard, 
  CalendarCheck, 
  Sparkles, 
  Send, 
  ShieldCheck, 
  Clock, 
  CheckCircle2,
  Users,
  Building,
  KeyRound,
  SunMedium,
  Wind,
  Droplets,
  Home,
  Moon,
  Tv,
  AlertTriangle,
  ArrowRight,
  Flame
} from 'lucide-react';

interface ResidentHomeProps {
  currentUser: UserType;
  onNavigate: (moduleId: string) => void;
  onOpenVisitorModal: () => void;
}

export default function ResidentHome({ currentUser, onNavigate, onOpenVisitorModal }: ResidentHomeProps) {
  const isOwner = currentUser.role === 'OWNER';
  const [activeScene, setActiveScene] = useState<'HOME' | 'AWAY' | 'NIGHT' | 'CINEMA'>('HOME');
  const [sceneMessage, setSceneMessage] = useState<string | null>(null);

  const handleActivateScene = (scene: 'HOME' | 'AWAY' | 'NIGHT' | 'CINEMA', name: string) => {
    setActiveScene(scene);
    setSceneMessage(`✓ Đã kích hoạt ngữ cảnh thông minh: "${name}"`);
    setTimeout(() => setSceneMessage(null), 3000);
  };

  const userName = currentUser?.full_name || (currentUser as any)?.fullname || 'Cư Dân SKYLINE';
  const aptCode = currentUser.apartment_code || '12A05';

  return (
    <div className="space-y-6 w-full animate-fadeIn">
      {/* Top Welcome & Environmental Widget Header */}
      <div className="p-6 bg-gradient-to-r from-[#161D26] via-[#121820] to-[#0D1117] border border-[#C5A880]/70 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-bold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Không Gian Cư Dân Thượng Lưu • SKYLINE RESIDENCE
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl text-white font-bold mt-1 tracking-wide">
            Xin Chào, {userName}
          </h2>
          <div className="text-xs text-gray-400 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>Căn Hộ: <strong className="text-white font-mono text-sm">Căn {aptCode}</strong></span>
            <span>•</span>
            <span>Vai Trò: <strong className="text-[#C5A880]">{isOwner ? 'Chủ Hộ (Full Access)' : 'Người Nhà Căn 12A05 (Thành Viên Gia Đình)'}</strong></span>
            <span>•</span>
            <span className="text-emerald-400 font-mono flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> FaceID Sinh Trắc Học Đã Kích Hoạt
            </span>
          </div>
        </div>

        {/* Live Weather & Indoor Air Quality Widget */}
        <div className="flex items-center gap-4 bg-[#0D1117]/80 border border-[#222B35] p-3 text-xs font-mono flex-shrink-0">
          <div className="flex items-center gap-2 pr-4 border-r border-[#222B35]">
            <SunMedium className="w-5 h-5 text-amber-400" />
            <div>
              <div className="text-white font-bold text-sm">28°C</div>
              <div className="text-[10px] text-gray-400">Nắng nhẹ</div>
            </div>
          </div>

          <div className="flex items-center gap-2 pr-4 border-r border-[#222B35]">
            <Wind className="w-5 h-5 text-emerald-400" />
            <div>
              <div className="text-emerald-400 font-bold text-sm">AQI 32</div>
              <div className="text-[10px] text-gray-400">Không khí sạch</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Droplets className="w-5 h-5 text-blue-400" />
            <div>
              <div className="text-white font-bold text-sm">65%</div>
              <div className="text-[10px] text-gray-400">Độ ẩm</div>
            </div>
          </div>
        </div>
      </div>

      {/* 1-Tap Smart Home Scene Shortcuts Bar */}
      <div className="p-4 bg-[#121820] border border-[#222B35] space-y-2.5 shadow-lg">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-wider text-[#C5A880] font-bold flex items-center gap-1.5">
            <Home className="w-3.5 h-3.5" /> Ngữ Cảnh Tự Động Hóa 1-Chạm (Smart Automation Scenes):
          </span>
          {sceneMessage && (
            <span className="text-xs font-mono text-emerald-400 animate-fadeIn">
              {sceneMessage}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => handleActivateScene('HOME', 'Về Nhà - All Lights & AC ON')}
            className={`p-2.5 text-left border transition-all text-xs flex items-center justify-between ${
              activeScene === 'HOME'
                ? 'bg-[#1C2533] border-[#C5A880] text-white ring-1 ring-[#C5A880]'
                : 'bg-[#161B22] border-[#222B35] text-gray-400 hover:border-gray-500 hover:text-white'
            }`}
          >
            <div>
              <div className="font-bold text-[11px] text-white flex items-center gap-1.5">
                <SunMedium className="w-3.5 h-3.5 text-amber-400" /> 🏡 Về Nhà
              </div>
              <div className="text-[10px] text-gray-400">Đèn Bật • ĐH 24°C • Mở Rèm</div>
            </div>
            {activeScene === 'HOME' && <span className="w-2 h-2 rounded-full bg-[#C5A880]"></span>}
          </button>

          <button
            type="button"
            onClick={() => handleActivateScene('AWAY', 'Ra Ngoài - Tắt Hết Thiết Bị & Khóa Cửa')}
            className={`p-2.5 text-left border transition-all text-xs flex items-center justify-between ${
              activeScene === 'AWAY'
                ? 'bg-[#1C2533] border-[#C5A880] text-white ring-1 ring-[#C5A880]'
                : 'bg-[#161B22] border-[#222B35] text-gray-400 hover:border-gray-500 hover:text-white'
            }`}
          >
            <div>
              <div className="font-bold text-[11px] text-white flex items-center gap-1.5">
                <Home className="w-3.5 h-3.5 text-blue-400" /> 🚪 Ra Ngoài
              </div>
              <div className="text-[10px] text-gray-400">Tắt Đèn • Khóa FaceID • Bật Cam</div>
            </div>
            {activeScene === 'AWAY' && <span className="w-2 h-2 rounded-full bg-[#C5A880]"></span>}
          </button>

          <button
            type="button"
            onClick={() => handleActivateScene('NIGHT', 'Đi Ngủ - Tắt Đèn Chính & Cảm Biến Đêm')}
            className={`p-2.5 text-left border transition-all text-xs flex items-center justify-between ${
              activeScene === 'NIGHT'
                ? 'bg-[#1C2533] border-[#C5A880] text-white ring-1 ring-[#C5A880]'
                : 'bg-[#161B22] border-[#222B35] text-gray-400 hover:border-gray-500 hover:text-white'
            }`}
          >
            <div>
              <div className="font-bold text-[11px] text-white flex items-center gap-1.5">
                <Moon className="w-3.5 h-3.5 text-indigo-400" /> 🌙 Đi Ngủ
              </div>
              <div className="text-[10px] text-gray-400">ĐH 26°C • Đóng Rèm • Đèn Ngủ</div>
            </div>
            {activeScene === 'NIGHT' && <span className="w-2 h-2 rounded-full bg-[#C5A880]"></span>}
          </button>

          <button
            type="button"
            onClick={() => handleActivateScene('CINEMA', 'Thư Giãn / Xem Phim')}
            className={`p-2.5 text-left border transition-all text-xs flex items-center justify-between ${
              activeScene === 'CINEMA'
                ? 'bg-[#1C2533] border-[#C5A880] text-white ring-1 ring-[#C5A880]'
                : 'bg-[#161B22] border-[#222B35] text-gray-400 hover:border-gray-500 hover:text-white'
            }`}
          >
            <div>
              <div className="font-bold text-[11px] text-white flex items-center gap-1.5">
                <Tv className="w-3.5 h-3.5 text-rose-400" /> 🎬 Xem Phim
              </div>
              <div className="text-[10px] text-gray-400">Ánh Sáng 15% • Đóng Rèm</div>
            </div>
            {activeScene === 'CINEMA' && <span className="w-2 h-2 rounded-full bg-[#C5A880]"></span>}
          </button>
        </div>
      </div>

      {/* Main Grid: VIP 3D Card on Left, Quick Business Action Cards on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: 3D Flip Smart Business Card & Tap Simulator */}
        <div className="lg:col-span-5 bg-[#121820] border border-[#222B35] p-5 space-y-4 shadow-2xl">
          <div className="border-b border-[#222B35] pb-2 text-left">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#C5A880] font-bold">
              Thẻ Cư Dân Kim Loại Mạ Vàng (VIP NFC Pass)
            </div>
            <p className="text-xs text-gray-400">
              Nhấp vào thẻ để lật xem 2 mặt hoặc quẹt mở Barrier 0.28s
            </p>
          </div>

          <ResidentSmartCard currentUser={currentUser} />
        </div>

        {/* Right Column: Quick Action Grid & Notification Snippets */}
        <div className="lg:col-span-7 space-y-6">
          {/* Quick Actions 4-Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Action 1: QR Đón Khách */}
            <div
              onClick={onOpenVisitorModal}
              className="p-4 bg-[#121820] border border-[#222B35] hover:border-[#C5A880] cursor-pointer transition-all space-y-2 group shadow-md"
            >
              <div className="w-9 h-9 bg-[#1C2533] border border-[#2D3748] flex items-center justify-center text-[#C5A880] group-hover:bg-[#C5A880] group-hover:text-[#0D1117] transition-colors">
                <Users className="w-4 h-4" />
              </div>
              <div className="font-serif text-sm font-bold text-white group-hover:text-[#C5A880] flex items-center justify-between">
                <span>Tạo QR Đón Khách</span>
                <ArrowRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-[#C5A880]" />
              </div>
              <p className="text-[11px] text-gray-400">
                Gửi mã QR có hạn giờ qua Zalo để khách tự quét mở cổng sảnh & thang máy.
              </p>
            </div>

            {/* Action 2: Báo Hỏng Hóc */}
            <div
              onClick={() => onNavigate('resident-tickets')}
              className="p-4 bg-[#121820] border border-[#222B35] hover:border-[#C5A880] cursor-pointer transition-all space-y-2 group shadow-md"
            >
              <div className="w-9 h-9 bg-[#1C2533] border border-[#2D3748] flex items-center justify-center text-amber-400 group-hover:bg-amber-500 group-hover:text-[#0D1117] transition-colors">
                <Wrench className="w-4 h-4" />
              </div>
              <div className="font-serif text-sm font-bold text-white group-hover:text-amber-400 flex items-center justify-between">
                <span>Báo Hỏng Hóc (Ticketing)</span>
                <ArrowRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-amber-400" />
              </div>
              <p className="text-[11px] text-gray-400">
                AI NLP tự phân loại sự cố, gán mức ưu tiên P1 và đếm ngược hạn SLA 60 phút.
              </p>
            </div>

            {/* Action 3: Hóa Đơn Điện Nước (Owner Only) */}
            {isOwner && (
              <div
                onClick={() => onNavigate('resident-finance')}
                className="p-4 bg-[#121820] border border-[#222B35] hover:border-[#C5A880] cursor-pointer transition-all space-y-2 group shadow-md"
              >
                <div className="w-9 h-9 bg-[#1C2533] border border-[#2D3748] flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-[#0D1117] transition-colors">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div className="font-serif text-sm font-bold text-white group-hover:text-emerald-400 flex items-center justify-between">
                  <span>Hóa Đơn Tháng 08/2026</span>
                  <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 px-1.5 py-0.5 border border-emerald-500">2.465.000 đ</span>
                </div>
                <p className="text-[11px] text-gray-400">
                  Thanh toán đa kênh VNPay, MoMo, VietQR 24/7 đối soát tự động.
                </p>
              </div>
            )}

            {/* Action 4: Tiện Ích 5 Sao */}
            <div
              onClick={() => onNavigate('resident-facilities')}
              className="p-4 bg-[#121820] border border-[#222B35] hover:border-[#C5A880] cursor-pointer transition-all space-y-2 group shadow-md"
            >
              <div className="w-9 h-9 bg-[#1C2533] border border-[#2D3748] flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-[#0D1117] transition-colors">
                <CalendarCheck className="w-4 h-4" />
              </div>
              <div className="font-serif text-sm font-bold text-white group-hover:text-blue-400 flex items-center justify-between">
                <span>Quẹt Thẻ Tiện Ích 5 Sao</span>
                <ArrowRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-blue-400" />
              </div>
              <p className="text-[11px] text-gray-400">
                Chạm mở cổng Hồ bơi Sky Pool Tầng 25, Gym Technogym, Sauna muối Himalaya.
              </p>
            </div>
          </div>

          {/* Official Newsfeed Stream */}
          <div className="bg-[#121820] border border-[#222B35] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#222B35] pb-3">
              <span className="text-xs uppercase tracking-wider text-[#C5A880] font-semibold flex items-center gap-2">
                <Building className="w-4 h-4" /> Bảng Tin Tòa Nhà (Newsfeed Nội Bộ)
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">Đã kiểm duyệt AI ✓</span>
            </div>

            <div className="space-y-3">
              {DEMO_COMMUNITY_POSTS.map((post) => (
                <div key={post.id} className="p-3.5 bg-[#161B22] border border-[#222B35] space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">{post.author_name}</span>
                    <span className="text-[10px] text-gray-400 font-mono">{post.created_at}</span>
                  </div>
                  <h4 className="font-semibold text-gray-200">{post.title}</h4>
                  <p className="text-gray-400 text-[11px] font-light leading-relaxed">{post.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
