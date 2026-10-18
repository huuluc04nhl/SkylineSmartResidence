'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ShieldAlert, 
  Sparkles, 
  ArrowLeft, 
  Lock, 
  RefreshCw,
  SlidersHorizontal,
  Home,
  KeyRound,
  QrCode,
  CreditCard,
  Wrench,
  Building,
  LayoutDashboard,
  KanbanSquare
} from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { useLanguage } from '@/lib/languageContext';
import { UserRole } from '@/lib/dataStore';

// Shell & Nav
import Topbar from '@/components/portal/Topbar';
import Sidebar from '@/components/portal/Sidebar';
import LoginModal from '@/components/landing/LoginModal';

// Admin Core Modules (Includes Tech Desk)
import AdminDashboard from '@/components/portal/admin/AdminDashboard';
import AdminBuildingApartmentManager from '@/components/portal/admin/AdminBuildingApartmentManager';
import EkycApproval from '@/components/portal/admin/EkycApproval';
import KanbanBoard from '@/components/portal/admin/KanbanBoard';
import BillingStudio from '@/components/portal/admin/BillingStudio';
import DeviceHealth from '@/components/portal/admin/DeviceHealth';
import SmartParking from '@/components/portal/admin/SmartParking';
import SurveysVoting from '@/components/portal/resident/SurveysVoting';
import AdminVisitorControl from '@/components/portal/admin/AdminVisitorControl';

// Resident Core Modules
import ResidentHome from '@/components/portal/resident/ResidentHome';
import ProfileEkyc from '@/components/portal/resident/ProfileEkyc';
import SmartHomeHub from '@/components/portal/resident/SmartHomeHub';
import SmartFacilityPass from '@/components/portal/resident/SmartFacilityPass';
import TicketService from '@/components/portal/resident/TicketService';
import FinanceBilling from '@/components/portal/resident/FinanceBilling';
import FamilyMembers from '@/components/portal/resident/FamilyMembers';
import VisitorQrModal from '@/components/portal/resident/VisitorQrModal';
import AiConciergePage from '@/components/portal/resident/AiConciergePage';
import ResidentServices from '@/components/portal/resident/ResidentServices';
import ResidentHandbook from '@/components/portal/resident/ResidentHandbook';

// Floating Luxury AI Concierge Widget
import AiConciergeFloating from '@/components/portal/shared/AiConciergeFloating';

function PortalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser, isLoading, login, logout } = useAuth();
  const { language, t } = useLanguage();

  const [activeModule, setActiveModule] = useState<string>('resident-home');
  const [isVisitorModalOpen, setIsVisitorModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);

  // Auto-route to the appropriate screen according to role
  useEffect(() => {
    if (currentUser) {
      let tabParam = searchParams.get('tab');
      const actionParam = searchParams.get('action');

      // Aliases for seamless linking
      if (tabParam === 'finance' || tabParam === 'billing' || tabParam === 'resident-billing') {
        tabParam = 'resident-finance';
      }
      if (tabParam === 'resident-request' || tabParam === 'tickets') tabParam = 'resident-tickets';
      if (tabParam === 'admin-building') tabParam = 'admin-apartments';
      if (tabParam === 'admin-visitor') tabParam = 'admin-visitors';

      // Check if visitor pass action is requested
      if (actionParam === 'visitor' || tabParam === 'resident-visitor') {
        setIsVisitorModalOpen(true);
        setActiveModule('resident-home');
        return;
      }

      if (currentUser.role === 'ADMIN') {
        if (tabParam && tabParam.startsWith('admin-')) {
          setActiveModule(tabParam);
        } else {
          setActiveModule('admin-dashboard');
        }
      } else if (currentUser.role === 'TECHNICIAN') {
        if (tabParam && tabParam.startsWith('admin-')) {
          setActiveModule(tabParam);
        } else {
          setActiveModule('admin-kanban');
        }
      } else {
        // OWNER or TENANT (Family)
        if (tabParam && tabParam.startsWith('resident-')) {
          setActiveModule(tabParam);
        } else {
          setActiveModule('resident-home');
        }
      }
    }
  }, [currentUser, searchParams]);

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0E14] flex items-center justify-center text-white">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-[#C5A880] animate-spin mx-auto" />
          <div className="font-serif text-lg tracking-wider text-[#C5A880]">
            {t('Đang Đồng Bộ Dữ Liệu Căn Hộ...')}
          </div>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated State
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0A0E14] flex items-center justify-center p-4 text-white">
        <div className="max-w-md w-full p-8 bg-[#121820] border border-[#C5A880] shadow-2xl text-center space-y-6">
          <div className="w-14 h-14 bg-[#161B22] border border-[#C5A880] flex items-center justify-center mx-auto text-[#C5A880]">
            <Lock className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h2 className="font-serif text-2xl font-bold">{t('Yêu Cầu Đăng Nhập')}</h2>
            <p className="text-xs text-gray-400">
              {t('Vui lòng đăng nhập tài khoản Cư Dân hoặc Ban Quản Lý để truy cập hệ thống SKYLINE.')}
            </p>
          </div>
          <div className="space-y-3 pt-2">
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="w-full py-3 bg-[#C5A880] hover:bg-white text-[#0D1117] font-bold text-xs uppercase tracking-wider transition-colors shadow-lg"
            >
              {t('Đăng Nhập Tài Khoản (Email / SĐT)')}
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full py-2 text-gray-400 hover:text-white text-xs flex items-center justify-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> {t('Quay Lại Trang Chủ')}
            </button>
          </div>
        </div>

        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
        />
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const handleSelectModule = (modId: string) => {
    setActiveModule(modId);
  };

  const handleSemanticSearchSelect = (targetModuleId: string) => {
    // Check permission boundary before switching
    if (currentUser.role === 'TENANT' && (targetModuleId === 'resident-finance' || targetModuleId === 'resident-surveys' || targetModuleId === 'resident-family')) {
      setActiveModule(targetModuleId); // Will render Access Denied Screen inside viewport
      return;
    }
    setActiveModule(targetModuleId);
  };

  return (
    <div key={language} className="min-h-screen w-full bg-[#0A0E14] flex flex-col select-none overflow-x-hidden">
      {/* Topbar Header (Fixed Top) */}
      <Topbar
        currentUser={currentUser}
        onSemanticSearchSelect={handleSemanticSearchSelect}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
      />

      {/* Main Container: Fixed Left Sidebar + Responsive Margin Content */}
      <div className="flex-1 flex min-w-0 pt-16">
        {/* Left Sidebar (Fixed on Desktop) */}
        <Sidebar
          currentUser={currentUser}
          activeModule={activeModule}
          onSelectModule={handleSelectModule}
          onLogout={handleLogout}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Right Main Content Viewport with Dynamic Margin for Fixed Sidebar */}
        <main
          key={`${language}-${activeModule}`}
          className={`flex-1 min-w-0 p-3 sm:p-5 lg:p-8 pb-24 md:pb-8 overflow-y-auto overflow-x-hidden bg-[#0A0E14] text-white transition-all duration-300 ease-in-out ${
            isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'
          }`}
        >
          <div className="w-full max-w-7xl mx-auto space-y-4 sm:space-y-6">
            {/* 1. ADMIN & TECHNICIAN ROLE MODULES */}
            {(currentUser.role === 'ADMIN' || currentUser.role === 'TECHNICIAN') && (
              <>
                {activeModule === 'admin-dashboard' && <AdminDashboard />}
                {activeModule === 'admin-apartments' && <AdminBuildingApartmentManager />}
                {activeModule === 'admin-ekyc' && <EkycApproval />}
                {activeModule === 'admin-visitors' && <AdminVisitorControl />}
                {activeModule === 'admin-kanban' && <KanbanBoard />}
                {activeModule === 'admin-billing' && <BillingStudio />}
                {activeModule === 'admin-devices' && <DeviceHealth />}
                {activeModule === 'admin-parking' && <SmartParking />}
                {activeModule === 'admin-community' && <SurveysVoting currentUser={currentUser} />}
              </>
            )}

            {/* ------------------------------------------------------------- */}
            {/* 2. RESIDENT MODULES (OWNER & CƯ DÂN GIA ĐÌNH)                 */}
            {/* ------------------------------------------------------------- */}
            {(currentUser.role === 'OWNER' || currentUser.role === 'TENANT') && (
              <>
                {/* Shared Resident Features */}
                {activeModule === 'resident-home' && (
                  <ResidentHome
                    currentUser={currentUser}
                    onNavigate={(modId) => handleSelectModule(modId)}
                    onOpenVisitorModal={() => setIsVisitorModalOpen(true)}
                  />
                )}
                {activeModule === 'resident-profile' && <ProfileEkyc currentUser={currentUser} />}
                {activeModule === 'resident-smarthome' && <SmartHomeHub currentUser={currentUser} />}
                {activeModule === 'resident-handbook' && (
                  <ResidentHandbook 
                    currentUser={currentUser} 
                    onNavigate={(modId) => handleSelectModule(modId)} 
                  />
                )}
                {activeModule === 'resident-facilities' && (
                  <SmartFacilityPass 
                    currentUser={currentUser} 
                    onNavigateModule={(modId) => handleSelectModule(modId)} 
                  />
                )}
                {activeModule === 'resident-services' && (
                  <ResidentServices
                    currentUser={currentUser}
                    onNavigateModule={(modId) => handleSelectModule(modId)}
                  />
                )}
                {activeModule === 'resident-tickets' && <TicketService currentUser={currentUser} />}
                {activeModule === 'resident-family' && <FamilyMembers currentUser={currentUser} />}
                {activeModule === 'resident-ai-assistant' && (
                  <AiConciergePage
                    currentUser={currentUser}
                    onNavigateModule={(modId) => handleSelectModule(modId)}
                  />
                )}

                {/* Strictly Owner Only Features */}
                {currentUser.role === 'OWNER' && (
                  <>
                    {activeModule === 'resident-finance' && <FinanceBilling currentUser={currentUser} />}
                    {activeModule === 'resident-surveys' && <SurveysVoting currentUser={currentUser} />}
                  </>
                )}

                {/* Resident Member Limited Warning if attempting to access Owner-only features */}
                {currentUser.role === 'TENANT' && (activeModule === 'resident-finance' || activeModule === 'resident-surveys') && (
                  <div className="p-10 bg-[#121820] border border-[#C5A880]/80 text-center space-y-4 max-w-2xl mx-auto my-12 shadow-2xl animate-fadeIn">
                    <ShieldAlert className="w-12 h-12 text-[#C5A880] mx-auto" />
                    <h3 className="font-serif text-xl font-bold text-white">
                      {t('Tính Năng Dành Riêng Cho Chủ Hộ Đứng Tên')}
                    </h3>
                    <div className="p-4 bg-[#161B22] border border-[#222B35] text-xs text-gray-300 space-y-2 text-left">
                      <p>
                        <strong>{t('Quy định Phân quyền Cư dân Tòa nhà:')}</strong>
                      </p>
                      <p className="text-gray-400">
                        • {t('Quyền Tài chính (Hóa đơn, thanh toán), Quyền Tự trị (Thêm/xóa thành viên) và Quyền Biểu quyết pháp lý (Bầu BQT, Đóng quỹ) thuộc độc quyền của Chủ hộ (Owner).', 'Financial Rights (Billing, Payments), Governance (Add/Remove members), and Voting Rights belong exclusively to the Apartment Owner.')}
                      </p>
                      <p className="text-gray-400">
                        • {t('Tài khoản Người nhà / Thành viên gia đình được cấp quyền sinh hoạt tiện ích (Mã QR ra vào, FaceID, Smart Home phòng riêng, Quẹt thẻ tiện ích Sky Pool/Gym, Báo hỏng, Chatbot AI).', 'Family member accounts are granted amenity privileges (Entry QR pass, FaceID, Smart Home private room control, Sky Pool/Gym pass, Maintenance tickets, AI Chatbot).')}
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveModule('resident-home')}
                      className="px-6 py-2.5 bg-[#C5A880] text-[#0D1117] text-xs font-bold uppercase tracking-wider hover:bg-white transition-colors shadow-lg"
                    >
                      {t('Quay Lại Trang Chủ Cư Dân')}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* NATIVE MOBILE BOTTOM APP BAR (DÀNH CHO ĐIỆN THOẠI & TABLET)  */}
      {/* ------------------------------------------------------------- */}
      {(currentUser.role === 'OWNER' || currentUser.role === 'TENANT') && (
        <nav 
          aria-label="Mobile Navigation"
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0E131B]/95 border-t border-[#C5A880]/30 backdrop-blur-xl px-2 py-1 flex items-center justify-around shadow-[0_-8px_25px_rgba(0,0,0,0.85)] select-none"
        >
          {/* Tab 1: Trang chủ */}
          <button
            type="button"
            onClick={() => handleSelectModule('resident-home')}
            className={`flex flex-col items-center justify-center py-1 px-2 transition-all active:scale-95 ${
              activeModule === 'resident-home' ? 'text-[#C5A880]' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Home className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-medium leading-tight">{t('Trang Chủ')}</span>
          </button>

          {/* Tab 2: Tiện ích / Thẻ */}
          <button
            type="button"
            onClick={() => handleSelectModule('resident-facilities')}
            className={`flex flex-col items-center justify-center py-1 px-2 transition-all active:scale-95 ${
              activeModule === 'resident-facilities' ? 'text-[#C5A880]' : 'text-gray-400 hover:text-white'
            }`}
          >
            <KeyRound className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-medium leading-tight">{t('Tiện Ích')}</span>
          </button>

          {/* Tab 3: CENTER GOLD ACTION - MÃ QR KHÁCH (RA VÀO SẢNH & THANG MÁY) */}
          <button
            type="button"
            onClick={() => setIsVisitorModalOpen(true)}
            className="flex flex-col items-center justify-center -mt-5 group active:scale-90 transition-transform"
          >
            <div className="w-12 h-12 bg-[#C5A880] group-hover:bg-white text-[#0D1117] flex items-center justify-center shadow-xl shadow-[#C5A880]/30 border-2 border-[#0A0E14] transition-all">
              <QrCode className="w-6 h-6 text-[#0D1117]" />
            </div>
            <span className="text-[9.5px] font-bold text-[#C5A880] mt-0.5 leading-tight">{t('Mã QR')}</span>
          </button>

          {/* Tab 4: Hóa Đơn (Chủ Hộ) hoặc Báo Hỏng (Người Nhà) */}
          <button
            type="button"
            onClick={() => handleSelectModule(currentUser.role === 'OWNER' ? 'resident-finance' : 'resident-tickets')}
            className={`flex flex-col items-center justify-center py-1 px-2 transition-all active:scale-95 ${
              (activeModule === 'resident-finance' || activeModule === 'resident-tickets') ? 'text-[#C5A880]' : 'text-gray-400 hover:text-white'
            }`}
          >
            {currentUser.role === 'OWNER' ? (
              <>
                <CreditCard className="w-5 h-5 mb-0.5" />
                <span className="text-[10px] font-medium leading-tight">{t('Hóa Đơn')}</span>
              </>
            ) : (
              <>
                <Wrench className="w-5 h-5 mb-0.5" />
                <span className="text-[10px] font-medium leading-tight">{t('Báo Hỏng')}</span>
              </>
            )}
          </button>

          {/* Tab 5: Menu Mở Rộng Tất Cả Tính Năng */}
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(true)}
            className="flex flex-col items-center justify-center py-1 px-2 text-gray-400 hover:text-white transition-all active:scale-95"
          >
            <SlidersHorizontal className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-medium leading-tight">{t('Tất Cả')}</span>
          </button>
        </nav>
      )}

      {/* Floating High-Tech AI Concierge Chatbot Widget (Always on Top with Expanding Animation) */}
      <AiConciergeFloating
        currentUser={currentUser}
        isOpen={isAiChatOpen}
        onToggle={() => setIsAiChatOpen(!isAiChatOpen)}
        onNavigateModule={(modId) => handleSelectModule(modId)}
      />

      {/* Shared Visitor QR Generation Modal */}
      <VisitorQrModal
        isOpen={isVisitorModalOpen}
        onClose={() => setIsVisitorModalOpen(false)}
        apartmentCode={currentUser.apartment_code || 'CH-06'}
        currentUser={currentUser}
      />
    </div>
  );
}

export default function PortalPage() {
  const { t } = useLanguage();
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A0E14] flex items-center justify-center text-white">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-[#C5A880] animate-spin mx-auto" />
          <div className="font-serif text-lg tracking-wider text-[#C5A880]">
            {t('Đang Đồng Bộ Dữ Liệu...')}
          </div>
        </div>
      </div>
    }>
      <PortalContent />
    </Suspense>
  );
}
