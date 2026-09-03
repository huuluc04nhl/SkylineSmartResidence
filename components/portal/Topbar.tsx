'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Bell, 
  Shield, 
  User, 
  Sparkles, 
  ChevronDown, 
  Check, 
  Home, 
  Menu, 
  X,
  LogOut,
  Clock,
  PhoneCall,
  Flame,
  Radio,
  SlidersHorizontal,
  ArrowRight
} from 'lucide-react';
import { UserRole, User as UserType } from '@/lib/dataStore';
import SkylineLogo from '@/components/shared/SkylineLogo';
import { useAuth } from '@/lib/authContext';

interface TopbarProps {
  currentUser: UserType;
  onSemanticSearchSelect?: (action: string) => void;
  onToggleMobileSidebar?: () => void;
}

export default function Topbar({ 
  currentUser, 
  onSemanticSearchSelect,
  onToggleMobileSidebar
}: TopbarProps) {
  const router = useRouter();
  const { logout } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  // Live real-time clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
        ' • ' +
        now.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Semantic search examples mapped from SRS Module 3.2.8
  const semanticSuggestions = [
    { query: 'nhà bị rò rỉ nước', action: 'resident-tickets', label: 'Tạo yêu cầu sửa chữa ống nước (Ưu tiên Cao - SLA 1h)' },
    { query: 'hóa đơn tháng 8', action: 'resident-finance', label: 'Xem chi tiết nợ & Hóa đơn điện nước tháng 08/2026' },
    { query: 'quẹt thẻ hồ bơi', action: 'resident-facilities', label: 'Mở thẻ tiện ích 1-chạm Sky Pool & Gym' },
    { query: 'điều khiển smart home', action: 'resident-smarthome', label: 'Mở trung tâm Smart Home Master căn 12A05' },
    { query: 'cảnh báo camera khói lửa', action: 'admin-dashboard', label: 'Mở Bản đồ An ninh Live Alert (Hầm B1)' },
    { query: 'báo cáo bất thường điện nước', action: 'admin-billing', label: 'Rà soát hóa đơn bôi đỏ bất thường AI (>50%)' },
  ];

  const filteredSuggestions = searchQuery.trim() === ''
    ? semanticSuggestions
    : semanticSuggestions.filter(s => s.query.toLowerCase().includes(searchQuery.toLowerCase()) || s.label.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleSelectSuggestion = (action: string) => {
    if (onSemanticSearchSelect) {
      onSemanticSearchSelect(action);
    }
    setShowSearchSuggestions(false);
    setSearchQuery('');
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const isOwner = currentUser.role === 'OWNER';
  const isAdmin = currentUser.role === 'ADMIN';
  const userName = currentUser.full_name || (currentUser as any)?.fullname || 'Cư Dân';

  return (
    <header className="h-16 bg-[#0D1117] border-b border-[#222B35] px-4 sm:px-6 flex items-center justify-between text-white fixed top-0 left-0 right-0 z-40 select-none shadow-md">
      {/* Left: Mobile Menu Trigger + Brand / Home Link */}
      <div className="flex items-center gap-3 sm:gap-6">
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className="md:hidden p-2 text-gray-300 hover:text-[#C5A880] focus:outline-none"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <Link href="/" className="group flex-shrink-0">
          <SkylineLogo variant="full" size="sm" theme="dark" />
        </Link>

        {/* Live System Time */}
        <div className="hidden xl:flex items-center gap-2 text-[11px] text-gray-400 font-mono pl-4 border-l border-[#222B35]">
          <Clock className="w-3.5 h-3.5 text-[#C5A880]" />
          <span>{currentTime || '08:30:00 • 28/08/2026'}</span>
        </div>
      </div>

      {/* Center: Module Smart Search (Semantic NLP) */}
      <div className="relative max-w-xs md:max-w-md w-full hidden sm:block mx-4">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="AI Smart Search (VD: 'rò nước', 'hóa đơn', 'hồ bơi')..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchSuggestions(true);
            }}
            onFocus={() => setShowSearchSuggestions(true)}
            className="w-full bg-[#161B22] border border-[#2D3748] text-xs text-white pl-10 pr-16 py-2 focus:outline-none focus:border-[#C5A880] transition-colors placeholder-gray-500"
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-mono text-gray-400 bg-[#222B35] px-1.5 py-0.5 border border-gray-600">
            AI NLP
          </span>
        </div>

        {/* Semantic Suggestions Dropdown */}
        {showSearchSuggestions && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-[#121820] border border-[#C5A880]/60 p-2 shadow-2xl z-50">
            <div className="flex items-center justify-between px-2 py-1 text-[10px] uppercase tracking-wider text-[#C5A880] font-semibold border-b border-[#222B35]">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Gợi ý hiểu ngữ nghĩa (Semantic RAG)
              </span>
              <button
                onClick={() => setShowSearchSuggestions(false)}
                className="text-gray-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>
            <div className="space-y-1 mt-1 max-h-56 overflow-y-auto">
              {filteredSuggestions.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectSuggestion(item.action)}
                  className="p-2 hover:bg-[#1E2631] cursor-pointer text-xs flex items-center justify-between text-gray-200 hover:text-[#C5A880] transition-colors"
                >
                  <span className="truncate">{item.label}</span>
                  <span className="text-[10px] text-gray-500 font-mono ml-2 flex-shrink-0">→ Mở</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right: Hotline Alert, Notifications & User Badge */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Emergency Hotline Button */}
        <a
          href="tel:19001088"
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-red-950/60 border border-red-500/80 text-red-300 text-[11px] font-mono hover:bg-red-900 transition-colors"
          title="Hotline An Ninh & Khẩn Cấp 24/7"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
          <PhoneCall className="w-3 h-3 text-red-400" />
          <span>1900 1088</span>
        </a>

        {/* Notification Icon */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-gray-400 hover:text-[#C5A880] relative transition-colors"
            aria-label="Thông báo"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-[#121820] border border-[#2D3748] p-4 shadow-2xl z-50 text-xs space-y-3">
              <div className="flex items-center justify-between border-b border-[#222B35] pb-2">
                <span className="font-semibold text-white uppercase tracking-wider text-[11px]">Thông Báo Thời Gian Thực</span>
                <span className="text-[10px] text-[#C5A880] font-mono">2 Mới</span>
              </div>
              <div className="space-y-2">
                <div className="p-2 bg-[#1C2533] border-l-2 border-red-500 space-y-0.5">
                  <div className="text-red-400 font-semibold text-[11px] flex items-center gap-1">
                    <Flame className="w-3 h-3" /> [Camera AI] Khói mỏng Hầm B1
                  </div>
                  <div className="text-gray-400 text-[10px]">Độ tin cậy: 96% • Vừa ghi nhận</div>
                </div>
                <div className="p-2 bg-[#1C2533] border-l-2 border-[#C5A880] space-y-0.5">
                  <div className="text-[#C5A880] font-semibold text-[11px]">Hóa đơn T08 đã phát hành</div>
                  <div className="text-gray-400 text-[10px]">Căn 12A05: 2.465.000 đ • Hạn: 30/08</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Authentic User Profile Menu (No Fake Role Switcher) */}
        <div className="relative">
          <button
            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
            className="px-2.5 sm:px-3 py-1.5 bg-[#161B22] border border-[#2D3748] hover:border-[#C5A880] text-xs flex items-center gap-2 text-gray-200 transition-colors shadow rounded"
          >
            <div className="w-6 h-6 rounded-full overflow-hidden border border-[#C5A880]/60 flex-shrink-0 bg-[#0E131A]">
              <img
                src={currentUser.avatar_url ? currentUser.avatar_url.replace('data.nks.vn//', 'data.nks.vn/') : 'https://data.nks.vn/storage/users/default.png'}
                alt={userName}
                onError={(e) => {
                  e.currentTarget.src = 'https://data.nks.vn/storage/users/default.png';
                }}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-[11px] font-bold text-white truncate max-w-[120px] leading-tight">
                {userName}
              </div>
              <div className="text-[9px] text-[#C5A880] font-mono uppercase font-bold tracking-wider">
                {isAdmin ? 'Ban Quản Lý' : isOwner ? `Căn ${currentUser.apartment_code || '12A05'} (Chủ Hộ)` : `Căn ${currentUser.apartment_code || '12A05'} (Người Nhà)`}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-1" />
          </button>

          {showRoleDropdown && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-[#121820] border border-[#C5A880] p-3 shadow-2xl z-50 space-y-3 rounded-lg animate-fadeIn">
              {/* Profile Summary Header */}
              <div className="flex items-center gap-3 pb-3 border-b border-[#222B35]">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-[#C5A880] flex-shrink-0 bg-[#0E131A]">
                  <img
                    src={currentUser.avatar_url ? currentUser.avatar_url.replace('data.nks.vn//', 'data.nks.vn/') : 'https://data.nks.vn/storage/users/default.png'}
                    alt={userName}
                    onError={(e) => {
                      e.currentTarget.src = 'https://data.nks.vn/storage/users/default.png';
                    }}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white text-xs truncate">{userName}</div>
                  <div className="text-[10px] text-gray-400 truncate">{currentUser.email || currentUser.username}</div>
                  <div className="mt-1">
                    <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded border ${
                      isAdmin 
                        ? 'bg-purple-950 text-purple-300 border-purple-600' 
                        : isOwner 
                        ? 'bg-amber-950 text-amber-300 border-amber-600' 
                        : 'bg-blue-950 text-blue-300 border-blue-600'
                    }`}>
                      {isAdmin ? '🛡️ Ban Quản Lý' : isOwner ? '👑 Chủ Hộ Căn Hộ' : '👤 Người Nhà Căn Hộ'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Account Quick Details */}
              <div className="space-y-1.5 text-[11px] text-gray-300 bg-[#161D26] p-2.5 rounded border border-[#222B35]">
                <div className="flex justify-between">
                  <span className="text-gray-400">Vị trí căn:</span>
                  <span className="font-mono font-bold text-white">{currentUser.apartment_code || '12A05'}</span>
                </div>
                {currentUser.phone && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Số điện thoại:</span>
                    <span className="font-mono text-gray-200">{currentUser.phone}</span>
                  </div>
                )}
                {currentUser.id_card_no && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Số CCCD:</span>
                    <span className="font-mono text-[#C5A880]">{currentUser.id_card_no}</span>
                  </div>
                )}
              </div>

              {/* Quick Navigation to Profile (if Resident) */}
              {!isAdmin && onSemanticSearchSelect && (
                <button
                  type="button"
                  onClick={() => {
                    onSemanticSearchSelect('resident-profile');
                    setShowRoleDropdown(false);
                  }}
                  className="w-full py-2 px-2.5 bg-[#1C2533] hover:bg-[#253245] text-white text-xs font-semibold rounded flex items-center justify-between border border-[#2D3748] transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#C5A880]" /> Hồ Sơ Cá Nhân & FaceID
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                </button>
              )}

              {/* Logout Button */}
              <div className="pt-2 border-t border-[#222B35]">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full p-2 text-left text-xs text-rose-400 hover:bg-rose-950/50 flex items-center gap-2 transition-colors font-semibold rounded"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Đăng Xuất Tài Khoản
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
