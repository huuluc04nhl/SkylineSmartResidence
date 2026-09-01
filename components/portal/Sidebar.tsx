'use client';

import React from 'react';
import { 
  LayoutDashboard, 
  Building, 
  UserCheck, 
  KanbanSquare, 
  Receipt, 
  Activity, 
  Car, 
  CalendarCheck, 
  MessageSquareQuote, 
  QrCode, 
  Cpu, 
  CreditCard, 
  Wrench, 
  Vote, 
  Users, 
  Bot, 
  Shield, 
  User, 
  LogOut,
  Sparkles,
  Waves,
  X
} from 'lucide-react';
import { UserRole, User as UserType } from '@/lib/dataStore';

interface SidebarProps {
  currentUser: UserType;
  activeModule: string;
  onSelectModule: (moduleId: string) => void;
  onLogout: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

/**
 * 🍔 Custom SVG: Hamburger nguyên vẹn & Hamburger bị cắn (Bitten Hamburger)
 */
function HamburgerBittenIcon({ isCollapsed }: { isCollapsed: boolean }) {
  if (!isCollapsed) {
    // 🍔 Normal Full Hamburger (Expanded)
    return (
      <svg
        className="w-3.5 h-3.5 transition-all duration-300 transform group-hover:scale-110"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    );
  }

  // 🍔 "Hamburger Bị Cắn" (Bitten Hamburger with bite mark notch on the right)
  return (
    <svg
      className="w-3.5 h-3.5 transition-all duration-300 transform group-hover:scale-110"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Top line with bite cut */}
      <path d="M 3 6 L 16.5 6" />
      {/* Middle line with deep bite cut */}
      <path d="M 3 12 L 10.5 12" />
      {/* Bottom line with bite cut */}
      <path d="M 3 18 L 15.5 18" />
      {/* Bite notch curve indicator */}
      <path
        d="M 16.5 6 C 12 9, 12 15, 15.5 18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="2 1.5"
        className="opacity-70"
      />
    </svg>
  );
}

export default function Sidebar({ 
  currentUser, 
  activeModule, 
  onSelectModule, 
  onLogout,
  isCollapsed,
  onToggleCollapse,
  isOpenMobile = false,
  onCloseMobile
}: SidebarProps) {
  const role = currentUser.role;

  // Define Navigation Items for ADMIN & RESIDENT (Owner/Tenant)
  const getNavItems = () => {
    switch (role) {
      case 'ADMIN':
        return [
          { id: 'admin-dashboard', label: '1. Trung Tâm Vận Hành (KPI)', shortLabel: 'Trung Tâm KPI', icon: LayoutDashboard },
          { id: 'admin-apartments', label: '2. Quản Lý Căn Hộ (Spaces)', shortLabel: 'Căn Hộ', icon: Building },
          { id: 'admin-ekyc', label: '3. Duyệt Hồ Sơ e-KYC', shortLabel: 'Duyệt e-KYC', icon: UserCheck },
          { id: 'admin-kanban', label: '4. Điều Phối Sự Cố (SLA)', shortLabel: 'Sự Cố SLA', icon: KanbanSquare },
          { id: 'admin-billing', label: '5. Studio Hóa Đơn AI', shortLabel: 'Hóa Đơn AI', icon: Receipt },
          { id: 'admin-devices', label: '6. Sức Khỏe Thiết Bị IoT', shortLabel: 'Thiết Bị IoT', icon: Activity },
          { id: 'admin-parking', label: '7. Bãi Đỗ Xe Thông Minh (ALPR)', shortLabel: 'Bãi Xe ALPR', icon: Car },
          { id: 'admin-facilities', label: '8. Quản Lý Tiện Ích 5 Sao', shortLabel: 'Tiện Ích', icon: CalendarCheck },
          { id: 'admin-community', label: '9. Cảm Xúc Cộng Đồng AI', shortLabel: 'Cộng Đồng', icon: MessageSquareQuote },
        ];

      case 'OWNER':
        return [
          { id: 'resident-home', label: 'Trang Chủ & Mã QR Động', shortLabel: 'Trang Chủ QR', icon: QrCode },
          { id: 'resident-profile', label: 'Hồ Sơ Cá Nhân & e-KYC', shortLabel: 'Hồ Sơ e-KYC', icon: UserCheck },
          { id: 'resident-smarthome', label: 'Smart Home Master (12A05)', shortLabel: 'Smart Home', icon: Cpu },
          { id: 'resident-facilities', label: 'Quẹt Thẻ Tiện Ích (Sky Pool)', shortLabel: 'Sky Pool/Gym', icon: Waves },
          { id: 'resident-finance', label: 'Tài Chính & Hóa Đơn AI', shortLabel: 'Tài Chính', icon: CreditCard },
          { id: 'resident-tickets', label: 'Báo Hỏng & Nghiệm Thu', shortLabel: 'Báo Hỏng', icon: Wrench },
          { id: 'resident-surveys', label: 'Biểu Quyết BQT (Chủ Hộ)', shortLabel: 'Biểu Quyết', icon: Vote },
          { id: 'resident-family', label: 'Quản Lý Cư Dân & e-KYC', shortLabel: 'Quản Lý Cư Dân', icon: Users },
          { id: 'resident-ai-assistant', label: 'Trợ Lý Ảo Skyline AI', shortLabel: 'Skyline AI', icon: Bot },
        ];

      case 'TENANT':
        return [
          { id: 'resident-home', label: 'Trang Chủ & Mã QR Động', shortLabel: 'Trang Chủ QR', icon: QrCode },
          { id: 'resident-profile', label: 'Hồ Sơ Cá Nhân & e-KYC', shortLabel: 'Hồ Sơ e-KYC', icon: UserCheck },
          { id: 'resident-smarthome', label: 'Smart Home Phòng (12A05)', shortLabel: 'Smart Home', icon: Cpu },
          { id: 'resident-facilities', label: 'Quẹt Thẻ Tiện Ích (Sky Pool)', shortLabel: 'Sky Pool/Gym', icon: Waves },
          { id: 'resident-tickets', label: 'Báo Hỏng Hóc (Ticketing)', shortLabel: 'Báo Hỏng', icon: Wrench },
          { id: 'resident-ai-assistant', label: 'Trợ Lý Ảo Skyline AI', shortLabel: 'Skyline AI', icon: Bot },
        ];

      default:
        return [];
    }
  };

  const navItems = getNavItems();

  const handleItemClick = (modId: string) => {
    onSelectModule(modId);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const sidebarContent = (
    <aside 
      className={`${
        isCollapsed ? 'w-20' : 'w-64'
      } transition-all duration-300 ease-in-out bg-[#0D1117] border-r border-[#222B35] text-white flex flex-col justify-between h-full select-none relative shadow-2xl`}
    >
      {/* ------------------------------------------------------------- */}
      {/* HAMBURGER & HAMBURGER BỊ CẮN TOGGLE BUTTON (On Border Seam)   */}
      {/* ------------------------------------------------------------- */}
      <button
        type="button"
        onClick={onToggleCollapse}
        className="group hidden md:flex absolute -right-3.5 top-5 z-50 w-7 h-7 rounded-full bg-[#121820] border-2 border-[#C5A880] text-[#C5A880] hover:bg-[#C5A880] hover:text-[#0D1117] shadow-[0_2px_12px_rgba(0,0,0,0.85)] items-center justify-center transition-all duration-200 cursor-pointer transform hover:scale-110"
        title={isCollapsed ? 'Mở rộng Menu (Hamburger Bị Cắn 🍔)' : 'Thu gọn Menu (Hamburger Nguyên Vẹn 🍔)'}
        aria-label="Toggle Sidebar Hamburger"
      >
        <HamburgerBittenIcon isCollapsed={isCollapsed} />
      </button>

      {/* ------------------------------------------------------------- */}
      {/* TOP USER PROFILE HEADER                                       */}
      {/* ------------------------------------------------------------- */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className={`p-3.5 border-b border-[#222B35] bg-[#121820]/90 transition-all ${
          isCollapsed ? 'flex flex-col items-center py-3' : 'flex items-center justify-between'
        }`}>
          {!isCollapsed ? (
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="relative flex-shrink-0">
                <img
                  src={currentUser.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt="Avatar"
                  className="w-10 h-10 object-cover border border-[#C5A880]/70 rounded shadow-md"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0D1117]"></span>
              </div>

              <div className="overflow-hidden">
                <div className="text-xs font-semibold text-white truncate max-w-[130px] leading-tight">
                  {currentUser.full_name || (currentUser as any)?.fullname || 'Cư Dân SKYLINE'}
                </div>
                <div className="text-[10px] text-[#C5A880] font-mono uppercase font-bold tracking-wider mt-0.5 truncate">
                  {role === 'ADMIN' ? 'BQL Tòa Nhà' : role === 'OWNER' ? `Căn ${currentUser.apartment_code || '12A05'} (Chủ Hộ)` : `Căn ${currentUser.apartment_code || '12A05'} (Người Nhà)`}
                </div>
              </div>
            </div>
          ) : (
            <div className="relative group cursor-pointer flex flex-col items-center" onClick={onToggleCollapse}>
              <div className="relative">
                <img
                  src={currentUser.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt="Avatar"
                  className="w-9 h-9 object-cover border border-[#C5A880] rounded shadow-md"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#0D1117]"></span>
              </div>

              {/* Flyout Tooltip when collapsed on Avatar */}
              <div className="fixed left-20 top-20 ml-2 px-3 py-2 bg-[#0D1117] text-white text-xs whitespace-nowrap border border-[#C5A880] shadow-2xl z-50 pointer-events-none hidden group-hover:block animate-fadeIn rounded">
                <div className="font-bold text-white">{currentUser.full_name || 'Cư Dân'}</div>
                <div className="text-[10px] text-[#C5A880] font-mono">{role === 'ADMIN' ? 'BQL Tòa Nhà' : `Căn ${currentUser.apartment_code || '12A05'}`}</div>
              </div>
            </div>
          )}

          {/* Mobile Close Button */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden text-gray-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* NAVIGATION ITEMS LIST                                        */}
        {/* ------------------------------------------------------------- */}
        <nav className="flex-1 p-2 space-y-1.5 overflow-y-auto overflow-x-hidden">
          {!isCollapsed && (
            <div className="px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-gray-400 font-semibold truncate">
              {role === 'ADMIN' ? 'Ban Quản Lý' : 'Phân Hệ Cư Dân'}
            </div>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;

            return (
              <div key={item.id} className="relative group">
                {isCollapsed ? (
                  /* Collapsed Icon-Only Button */
                  <button
                    type="button"
                    onClick={() => handleItemClick(item.id)}
                    className={`w-11 h-11 mx-auto flex items-center justify-center rounded-lg transition-all relative ${
                      isActive
                        ? 'bg-[#C5A880]/15 text-[#C5A880] border border-[#C5A880]/70 shadow-[0_0_15px_rgba(197,168,128,0.25)]'
                        : 'text-gray-400 hover:text-white hover:bg-[#161B22]'
                    }`}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-[#C5A880]' : 'text-gray-400 group-hover:text-white'}`} />

                    {/* Fixed-Position Floating Flyout Tooltip */}
                    <div className="fixed left-20 ml-2 px-3 py-1.5 bg-[#0D1117] text-white text-xs font-semibold whitespace-nowrap border border-[#C5A880] shadow-[0_10px_25px_rgba(0,0,0,0.9)] z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 rounded flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-[#C5A880]' : 'bg-gray-500'}`}></span>
                      <span>{item.label}</span>
                    </div>
                  </button>
                ) : (
                  /* Expanded Button with Full Text */
                  <button
                    type="button"
                    onClick={() => handleItemClick(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs text-left transition-all border-l-2 font-medium rounded-r ${
                      isActive
                        ? 'bg-[#1C2533] border-[#C5A880] text-[#C5A880] font-bold shadow-sm'
                        : 'border-transparent text-gray-300 hover:bg-[#161B22] hover:text-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[#C5A880]' : 'text-gray-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* FOOTER AREA                                                   */}
      {/* ------------------------------------------------------------- */}
      <div className={`p-3 border-t border-[#222B35] bg-[#121820]/60 space-y-2 ${
        isCollapsed ? 'flex flex-col items-center' : ''
      }`}>
        {!isCollapsed ? (
          <>
            <div className="text-[10px] text-gray-400 font-mono space-y-0.5 px-1">
              <div className="flex items-center justify-between">
                <span>Trạng thái:</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Online FaceID
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="w-full py-2 bg-[#161B22] hover:bg-red-950/80 border border-gray-700 hover:border-red-500 text-gray-300 hover:text-red-300 text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 rounded"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>Đăng Xuất</span>
            </button>
          </>
        ) : (
          <div className="relative group">
            <button
              type="button"
              onClick={onLogout}
              className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#161B22] hover:bg-red-950/80 border border-gray-800 hover:border-red-500 text-gray-400 hover:text-red-300 transition-colors"
              title="Đăng Xuất"
            >
              <LogOut className="w-4 h-4 text-rose-400" />
            </button>

            {/* Logout Tooltip */}
            <div className="fixed left-20 bottom-5 ml-2 px-2.5 py-1 bg-red-950 text-red-200 text-xs font-semibold whitespace-nowrap border border-red-600 shadow-xl z-50 pointer-events-none hidden group-hover:block animate-fadeIn rounded">
              Đăng Xuất
            </div>
          </div>
        )}
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Fixed Persistent Sidebar */}
      <div className="hidden md:block">
        <div className={`fixed top-16 left-0 bottom-0 z-30 ${isCollapsed ? 'w-20' : 'w-64'} transition-all duration-300 ease-in-out`}>
          {sidebarContent}
        </div>
      </div>

      {/* Mobile Slide-Over Drawer with Backdrop */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          {/* Drawer */}
          <div className="relative z-10 w-64 max-w-[80vw] h-full bg-[#0D1117] shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
