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
  Eye,
  ArrowRight,
  Flame, 
  Crown,
  ScanFace,
  Camera,
  AlertCircle
} from 'lucide-react';
import { getApartmentByCode } from '@/lib/apartmentStore';
import { applyScene, getSmartHomeState, SceneType } from '@/lib/smartHomeStore';
import ResidentApartmentModal from './ResidentApartmentModal';
import { getEnrolledFaceProfile, getAllEnrolledFaceProfiles } from '@/lib/faceEnrollStore';

interface ResidentHomeProps {
  currentUser: UserType;
  onNavigate: (moduleId: string) => void;
  onOpenVisitorModal: () => void;
}

export default function ResidentHome({ currentUser, onNavigate, onOpenVisitorModal }: ResidentHomeProps) {
  const isOwner = currentUser.role === 'OWNER';
  const aptCode = currentUser.apartment_code || '12A05';

  const [activeScene, setActiveScene] = useState<SceneType>(() => getSmartHomeState(aptCode).activeScene);
  const [sceneMessage, setSceneMessage] = useState<string | null>(null);
  const [isAptDetailOpen, setIsAptDetailOpen] = useState(false);
  const [pendingConfirmCount, setPendingConfirmCount] = useState(0);
  const [userFaceStatus, setUserFaceStatus] = useState<'NONE' | 'PENDING_OWNER' | 'PENDING' | 'ACTIVE'>('NONE');

  const checkFaceStatuses = () => {
    const p = getEnrolledFaceProfile(currentUser.phone || currentUser.id || currentUser.username || '');
    if (p) {
      if (p.status === 'ACTIVE') setUserFaceStatus('ACTIVE');
      else if (p.status === 'PENDING_OWNER') setUserFaceStatus('PENDING_OWNER');
      else if (p.status === 'PENDING') setUserFaceStatus('PENDING');
      else setUserFaceStatus('NONE');
    } else {
      setUserFaceStatus('NONE');
    }

    if (isOwner) {
      try {
        const allProfiles = getAllEnrolledFaceProfiles();
        const count = allProfiles.filter(prof => 
          prof.apartmentCode === aptCode && 
          prof.status === 'PENDING_OWNER' && 
          prof.userId !== currentUser.id && 
          prof.phone !== currentUser.phone
        ).length;
        setPendingConfirmCount(count);
      } catch (e) {
        // ignore
      }
    }
  };

  useEffect(() => {
    checkFaceStatuses();
    const handleFaceUpdate = () => checkFaceStatuses();
    window.addEventListener('skyline_faceid_enrolled', handleFaceUpdate);
    return () => window.removeEventListener('skyline_faceid_enrolled', handleFaceUpdate);
  }, [aptCode, isOwner, currentUser]);

  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail?.activeScene) {
        setActiveScene(e.detail.activeScene);
      }
    };
    window.addEventListener('skyline_smarthome_update', handleUpdate);
    return () => window.removeEventListener('skyline_smarthome_update', handleUpdate);
  }, [aptCode]);

  const handleActivateScene = (scene: SceneType) => {
    const { state, message } = applyScene(aptCode, scene);
    setActiveScene(state.activeScene);
    setSceneMessage(message);
    setTimeout(() => setSceneMessage(null), 3000);
  };

  const userName = currentUser?.full_name || (currentUser as any)?.fullname || 'Cư Dân SKYLINE';

  return (
    <div className="space-y-6 w-full animate-fadeIn">
      {/* Top Welcome & Environmental Widget Header */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-[#161D26] via-[#121820] to-[#0D1117] border border-[#C5A880]/70 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-2xl">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-bold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Không Gian Cư Dân • SKYLINE RESIDENCE
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl text-white font-bold mt-1 tracking-wide">
            Xin Chào, {userName}
          </h2>
          <div className="text-xs text-gray-300 mt-2.5 flex flex-wrap items-center gap-2">
            {/* Căn Hộ & Nút Sổ Tay */}
            <div className="h-8 flex items-center gap-1.5 bg-[#161B22] border border-[#2D3748] px-2.5 shadow-sm">
              <span className="text-gray-400 text-[11px]">Căn:</span>
              <strong className="text-white font-mono text-xs">{aptCode}</strong>
              <button
                type="button"
                onClick={() => setIsAptDetailOpen(true)}
                className="ml-1 h-5 px-2 bg-[#0D1117] hover:bg-[#C5A880] hover:text-[#0D1117] text-[#C5A880] border border-[#C5A880]/50 text-[10.5px] font-semibold transition-all flex items-center gap-1 shadow-sm"
                title="Mở sổ tay căn hộ & phối cảnh 3D"
              >
                <Eye className="w-3 h-3" /> Sổ Tay 3D
              </button>
            </div>

            {/* Vai Trò */}
            <div className="h-8 flex items-center gap-1.5 px-2.5 bg-[#C5A880]/15 border border-[#C5A880]/50 text-[#C5A880] text-[11px] font-semibold shadow-sm">
              <Crown className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>{isOwner ? 'Chủ Hộ' : 'Thành Viên'}</span>
            </div>

            {/* Trạng Thái e-KYC (Chủ Hộ) */}
            {isOwner && (
              <div className="h-8 flex items-center gap-1.5 px-2.5 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[11px] font-mono font-medium shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>e-KYC Đã Xác Thực</span>
              </div>
            )}

            {/* Trạng Thái FaceID Cho Thành Viên Người Nhà */}
            {!isOwner && (
              <>
                {userFaceStatus === 'ACTIVE' && (
                  <div className="h-8 flex items-center gap-1.5 px-2.5 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[11px] font-mono font-medium shadow-sm">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>FaceID Đã Kích Hoạt</span>
                  </div>
                )}
                {userFaceStatus === 'PENDING_OWNER' && (
                  <div className="h-8 flex items-center gap-1.5 px-2.5 bg-amber-950/60 border border-amber-500/40 text-amber-300 text-[11px] font-mono font-medium shadow-sm animate-pulse">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>FaceID: Chờ Chủ Hộ Duyệt</span>
                  </div>
                )}
                {userFaceStatus === 'PENDING' && (
                  <div className="h-8 flex items-center gap-1.5 px-2.5 bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-[11px] font-mono font-medium shadow-sm animate-pulse">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>FaceID: Chờ BQL Phê Duyệt</span>
                  </div>
                )}
                {userFaceStatus === 'NONE' && (
                  <button
                    type="button"
                    onClick={() => onNavigate('resident-profile')}
                    className="h-8 flex items-center gap-1.5 px-2.5 bg-[#C5A880] hover:bg-white text-[#0D1117] text-[11px] font-bold shadow-sm transition-all cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Quét FaceID Của Bạn</span>
                  </button>
                )}
              </>
            )}
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

      {/* Alert Banner for Owner when family members are waiting for FaceID confirmation */}
      {isOwner && pendingConfirmCount > 0 && (
        <div className="p-4 bg-gradient-to-r from-amber-950/80 via-[#1A1810] to-[#121820] border border-amber-500/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-500/20 border border-amber-500 flex items-center justify-center text-amber-300 flex-shrink-0">
              <ScanFace className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-amber-300">
                Có {pendingConfirmCount} Hồ Sơ FaceID Người Nhà Đang Chờ Bạn Xác Nhận
              </div>
              <p className="text-xs text-gray-300 mt-0.5">
                Thành viên trong căn hộ đã hoàn tất quét 4 góc FaceID. Vui lòng kiểm tra và xác nhận bảo lãnh để chuyển tới Ban Quản Lý phê duyệt.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('resident-family')}
            className="px-4 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-all shadow-lg flex-shrink-0 cursor-pointer active:scale-95 flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4" /> Xem & Xác Nhận Ngay
          </button>
        </div>
      )}

      {/* 1-Tap Smart Home Scene Shortcuts Bar */}
      <div className="p-4 bg-[#121820] border border-[#222B35] space-y-2.5 shadow-lg">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-wider text-[#C5A880] font-bold flex items-center gap-1.5">
            <Home className="w-3.5 h-3.5" /> Ngữ Cảnh Thông Minh:
          </span>
          {sceneMessage && (
            <span className="text-xs font-mono text-emerald-400 animate-fadeIn">
              {sceneMessage}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2">
          <button
            type="button"
            onClick={() => handleActivateScene('WELCOME')}
            className={`p-2.5 text-left border transition-all text-xs flex items-center justify-between ${
              activeScene === 'WELCOME'
                ? 'bg-[#1C2533] border-[#C5A880] text-white ring-1 ring-[#C5A880]'
                : 'bg-[#161B22] border-[#222B35] text-gray-400 hover:border-gray-500 hover:text-white'
            }`}
          >
            <div>
              <div className="font-bold text-[11px] text-white flex items-center gap-1.5">
                <SunMedium className="w-3.5 h-3.5 text-amber-400" /> Về Nhà
              </div>
              <div className="text-[10px] text-gray-400">Bật đèn • ĐH 24°C • Mở rèm</div>
            </div>
            {activeScene === 'WELCOME' && <span className="w-2 h-2 rounded-full bg-[#C5A880]"></span>}
          </button>

          <button
            type="button"
            onClick={() => handleActivateScene('AWAY')}
            className={`p-2.5 text-left border transition-all text-xs flex items-center justify-between ${
              activeScene === 'AWAY'
                ? 'bg-[#1C2533] border-[#C5A880] text-white ring-1 ring-[#C5A880]'
                : 'bg-[#161B22] border-[#222B35] text-gray-400 hover:border-gray-500 hover:text-white'
            }`}
          >
            <div>
              <div className="font-bold text-[11px] text-white flex items-center gap-1.5">
                <Home className="w-3.5 h-3.5 text-blue-400" /> Ra Ngoài
              </div>
              <div className="text-[10px] text-gray-400">Tắt điện • Khóa cửa • Đóng rèm</div>
            </div>
            {activeScene === 'AWAY' && <span className="w-2 h-2 rounded-full bg-[#C5A880]"></span>}
          </button>

          <button
            type="button"
            onClick={() => handleActivateScene('SLEEP')}
            className={`p-2.5 text-left border transition-all text-xs flex items-center justify-between ${
              activeScene === 'SLEEP'
                ? 'bg-[#1C2533] border-[#C5A880] text-white ring-1 ring-[#C5A880]'
                : 'bg-[#161B22] border-[#222B35] text-gray-400 hover:border-gray-500 hover:text-white'
            }`}
          >
            <div>
              <div className="font-bold text-[11px] text-white flex items-center gap-1.5">
                <Moon className="w-3.5 h-3.5 text-indigo-400" /> Đi Ngủ
              </div>
              <div className="text-[10px] text-gray-400">ĐH 26°C • Khóa cửa • Đóng rèm</div>
            </div>
            {activeScene === 'SLEEP' && <span className="w-2 h-2 rounded-full bg-[#C5A880]"></span>}
          </button>

          <button
            type="button"
            onClick={() => handleActivateScene('CINEMA')}
            className={`p-2.5 text-left border transition-all text-xs flex items-center justify-between ${
              activeScene === 'CINEMA'
                ? 'bg-[#1C2533] border-[#C5A880] text-white ring-1 ring-[#C5A880]'
                : 'bg-[#161B22] border-[#222B35] text-gray-400 hover:border-gray-500 hover:text-white'
            }`}
          >
            <div>
              <div className="font-bold text-[11px] text-white flex items-center gap-1.5">
                <Tv className="w-3.5 h-3.5 text-rose-400" /> Xem Phim
              </div>
              <div className="text-[10px] text-gray-400">ĐH 23°C • Đèn 15% • Đóng rèm</div>
            </div>
            {activeScene === 'CINEMA' && <span className="w-2 h-2 rounded-full bg-[#C5A880]"></span>}
          </button>

          <button
            type="button"
            onClick={() => handleActivateScene('DINING')}
            className={`p-2.5 text-left border transition-all text-xs flex items-center justify-between col-span-2 sm:col-span-4 lg:col-span-1 ${
              activeScene === 'DINING'
                ? 'bg-[#1C2533] border-[#C5A880] text-white ring-1 ring-[#C5A880]'
                : 'bg-[#161B22] border-[#222B35] text-gray-400 hover:border-gray-500 hover:text-white'
            }`}
          >
            <div>
              <div className="font-bold text-[11px] text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Ăn Tối
              </div>
              <div className="text-[10px] text-gray-400">Bật đèn bếp • View phố</div>
            </div>
            {activeScene === 'DINING' && <span className="w-2 h-2 rounded-full bg-[#C5A880]"></span>}
          </button>
        </div>
      </div>

      {/* Main Grid: VIP 3D Card on Left (Chỉ hiển thị cho Chủ Hộ), Quick Business Action Cards on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: 3D Flip Smart Business Card & Tap Simulator (CHỦ HỘ ONLY) */}
        {isOwner && (
          <div className="lg:col-span-5 bg-[#121820] border border-[#222B35] p-5 space-y-4 shadow-2xl">
            <div className="border-b border-[#222B35] pb-2 text-left">
              <div className="text-[10px] uppercase tracking-[0.2em] text-[#C5A880] font-bold">
                Thẻ Cư Dân Điện Tử
              </div>
              <p className="text-xs text-gray-400">
                Nhấp để lật thẻ xem 2 mặt • Quẹt thẻ mở cổng sảnh & thang máy
              </p>
            </div>

            <ResidentSmartCard currentUser={currentUser} />
          </div>
        )}

        {/* Right Column: Quick Action Grid & Notification Snippets */}
        <div className={`${isOwner ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-6`}>
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
                Tạo mã QR gửi khách qua Zalo để tự quét mở sảnh đón và thang máy.
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
                <span>Báo Hỏng & Sửa Chữa</span>
                <ArrowRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-amber-400" />
              </div>
              <p className="text-[11px] text-gray-400">
                Tiếp nhận sự cố kỹ thuật, cử kỹ thuật viên xử lý trong 60 phút.
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
                  <span>Hóa Đơn Dịch Vụ</span>
                  <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 px-1.5 py-0.5 border border-emerald-500">2.465.000 đ</span>
                </div>
                <p className="text-[11px] text-gray-400">
                  Thanh toán trực tuyến VietQR, MoMo, VNPay 24/7 đối soát tức thì.
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
                <span>Tiện Ích Cư Dân</span>
                <ArrowRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-blue-400" />
              </div>
              <p className="text-[11px] text-gray-400">
                Mở cổng Hồ bơi chân mây Tầng 25, Gym Technogym, Sauna, BBQ.
              </p>
            </div>
          </div>

          {/* Official Newsfeed Stream */}
          <div className="bg-[#121820] border border-[#222B35] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#222B35] pb-3">
              <span className="text-xs uppercase tracking-wider text-[#C5A880] font-semibold flex items-center gap-2">
                <Building className="w-4 h-4" /> Bảng Tin Tòa Nhà
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">Chính Thức BQL ✓</span>
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

      {/* Modal Sổ Tay Căn Hộ Thượng Lưu Của Cư Dân */}
      <ResidentApartmentModal
        isOpen={isAptDetailOpen}
        onClose={() => setIsAptDetailOpen(false)}
        apartmentCode={aptCode}
        onNavigateToSmartHome={() => onNavigate('resident-smarthome')}
      />
    </div>
  );
}
