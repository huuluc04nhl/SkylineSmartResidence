'use client';

import React from 'react';
import { 
  Home, 
  Waves, 
  CreditCard, 
  Bot, 
  Menu, 
  LayoutDashboard, 
  Building, 
  Wrench, 
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { UserRole, User as UserType } from '@/lib/dataStore';
import { useLanguage } from '@/lib/languageContext';

interface BottomNavProps {
  currentUser: UserType;
  activeModule: string;
  onSelectModule: (moduleId: string) => void;
  onOpenAiChat: () => void;
  onOpenMenu: () => void;
}

export default function BottomNav({
  currentUser,
  activeModule,
  onSelectModule,
  onOpenAiChat,
  onOpenMenu,
}: BottomNavProps) {
  const { t } = useLanguage();
  const isAdminOrTech = currentUser.role === 'ADMIN' || currentUser.role === 'TECHNICIAN';
  const isOwner = currentUser.role === 'OWNER';

  return (
    <nav 
      aria-label="Mobile Navigation Bar"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0B1017]/95 border-t border-[#222E3E] backdrop-blur-xl pb-[max(0.35rem,env(safe-area-inset-bottom))] select-none shadow-[0_-10px_25px_rgba(0,0,0,0.8)]"
    >
      <div className="grid grid-cols-5 h-14 items-center">
        {isAdminOrTech ? (
          // ================= STAFF / ADMIN NAVIGATION =================
          <>
            {/* 1. Tổng quan */}
            <button
              type="button"
              onClick={() => onSelectModule(currentUser.role === 'ADMIN' ? 'admin-dashboard' : 'admin-kanban')}
              className={`relative flex flex-col items-center justify-center h-full w-full py-1 transition-all active:scale-95 ${
                activeModule === 'admin-dashboard' ? 'text-[#C5A880]' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {activeModule === 'admin-dashboard' && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#C5A880] shadow-[0_0_8px_#C5A880]" />
              )}
              <LayoutDashboard className="w-4 h-4 mb-1" />
              <span className="text-[10px] font-medium tracking-tight truncate max-w-[56px]">
                {t('Tổng Quan')}
              </span>
            </button>

            {/* 2. Tòa nhà 3D */}
            <button
              type="button"
              onClick={() => onSelectModule('admin-apartments')}
              className={`relative flex flex-col items-center justify-center h-full w-full py-1 transition-all active:scale-95 ${
                activeModule === 'admin-apartments' ? 'text-[#C5A880]' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {activeModule === 'admin-apartments' && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#C5A880] shadow-[0_0_8px_#C5A880]" />
              )}
              <Building className="w-4 h-4 mb-1" />
              <span className="text-[10px] font-medium tracking-tight truncate max-w-[56px]">
                {t('Tòa Nhà')}
              </span>
            </button>

            {/* 3. Phiếu Kỹ Thuật (Kanban) */}
            <button
              type="button"
              onClick={() => onSelectModule('admin-kanban')}
              className={`relative flex flex-col items-center justify-center h-full w-full py-1 transition-all active:scale-95 ${
                activeModule === 'admin-kanban' ? 'text-[#C5A880]' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {activeModule === 'admin-kanban' && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#C5A880] shadow-[0_0_8px_#C5A880]" />
              )}
              <Wrench className="w-4 h-4 mb-1" />
              <span className="text-[10px] font-medium tracking-tight truncate max-w-[56px]">
                {t('Kỹ Thuật')}
              </span>
            </button>

            {/* 4. Khách / An ninh */}
            <button
              type="button"
              onClick={() => onSelectModule('admin-visitors')}
              className={`relative flex flex-col items-center justify-center h-full w-full py-1 transition-all active:scale-95 ${
                activeModule === 'admin-visitors' ? 'text-[#C5A880]' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {activeModule === 'admin-visitors' && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#C5A880] shadow-[0_0_8px_#C5A880]" />
              )}
              <ShieldCheck className="w-4 h-4 mb-1" />
              <span className="text-[10px] font-medium tracking-tight truncate max-w-[56px]">
                {t('An Ninh')}
              </span>
            </button>

            {/* 5. Menu đầy đủ */}
            <button
              type="button"
              onClick={onOpenMenu}
              className="relative flex flex-col items-center justify-center h-full w-full py-1 text-gray-400 hover:text-white transition-all active:scale-95"
            >
              <Menu className="w-4 h-4 mb-1" />
              <span className="text-[10px] font-medium tracking-tight truncate max-w-[56px]">
                {t('Danh Mục')}
              </span>
            </button>
          </>
        ) : (
          // ================= RESIDENT / OWNER / TENANT NAVIGATION =================
          <>
            {/* 1. Trang chủ */}
            <button
              type="button"
              onClick={() => onSelectModule('resident-home')}
              className={`relative flex flex-col items-center justify-center h-full w-full py-1 transition-all active:scale-95 ${
                activeModule === 'resident-home' ? 'text-[#C5A880]' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {activeModule === 'resident-home' && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#C5A880] shadow-[0_0_8px_#C5A880]" />
              )}
              <Home className="w-4 h-4 mb-1" />
              <span className="text-[10px] font-medium tracking-tight truncate max-w-[56px]">
                {t('Trang Chủ')}
              </span>
            </button>

            {/* 2. Tiện ích */}
            <button
              type="button"
              onClick={() => onSelectModule('resident-facilities')}
              className={`relative flex flex-col items-center justify-center h-full w-full py-1 transition-all active:scale-95 ${
                activeModule === 'resident-facilities' ? 'text-[#C5A880]' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {activeModule === 'resident-facilities' && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#C5A880] shadow-[0_0_8px_#C5A880]" />
              )}
              <Waves className="w-4 h-4 mb-1" />
              <span className="text-[10px] font-medium tracking-tight truncate max-w-[56px]">
                {t('Tiện Ích')}
              </span>
            </button>

            {/* 3. NÚT TRUNG TÂM: TRỢ LÝ AI CONCIERGE (App Style Hero Button) */}
            <button
              type="button"
              onClick={onOpenAiChat}
              className="relative flex flex-col items-center justify-center h-full w-full py-1 group active:scale-95"
            >
              <div className="w-9 h-9 -mt-3 bg-gradient-to-br from-[#C5A880] to-[#9E8057] text-[#0A0E14] flex items-center justify-center shadow-[0_0_15px_rgba(197,168,128,0.5)] border border-[#F3E5AB]">
                <Bot className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </div>
              <span className="text-[9px] font-bold text-[#C5A880] tracking-tight mt-0.5 truncate max-w-[56px]">
                AI 24/7
              </span>
            </button>

            {/* 4. Hóa đơn (Owner) / Kỹ thuật (Tenant) */}
            {isOwner ? (
              <button
                type="button"
                onClick={() => onSelectModule('resident-finance')}
                className={`relative flex flex-col items-center justify-center h-full w-full py-1 transition-all active:scale-95 ${
                  activeModule === 'resident-finance' ? 'text-[#C5A880]' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {activeModule === 'resident-finance' && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#C5A880] shadow-[0_0_8px_#C5A880]" />
                )}
                <CreditCard className="w-4 h-4 mb-1" />
                <span className="text-[10px] font-medium tracking-tight truncate max-w-[56px]">
                  {t('Hóa Đơn')}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onSelectModule('resident-tickets')}
                className={`relative flex flex-col items-center justify-center h-full w-full py-1 transition-all active:scale-95 ${
                  activeModule === 'resident-tickets' ? 'text-[#C5A880]' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {activeModule === 'resident-tickets' && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#C5A880] shadow-[0_0_8px_#C5A880]" />
                )}
                <Wrench className="w-4 h-4 mb-1" />
                <span className="text-[10px] font-medium tracking-tight truncate max-w-[56px]">
                  {t('Sửa Chữa')}
                </span>
              </button>
            )}

            {/* 5. Menu đầy đủ */}
            <button
              type="button"
              onClick={onOpenMenu}
              className="relative flex flex-col items-center justify-center h-full w-full py-1 text-gray-400 hover:text-white transition-all active:scale-95"
            >
              <Menu className="w-4 h-4 mb-1" />
              <span className="text-[10px] font-medium tracking-tight truncate max-w-[56px]">
                {t('Menu')}
              </span>
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
