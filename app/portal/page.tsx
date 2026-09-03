'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ShieldAlert, 
  Sparkles, 
  ArrowLeft, 
  Lock, 
  RefreshCw,
  SlidersHorizontal 
} from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { UserRole } from '@/lib/dataStore';

// Shell & Nav
import Topbar from '@/components/portal/Topbar';
import Sidebar from '@/components/portal/Sidebar';
import LoginModal from '@/components/landing/LoginModal';

// Admin Core Modules (Includes Tech Desk)
import AdminDashboard from '@/components/portal/admin/AdminDashboard';
import FloorPlanExplorer from '@/components/landing/FloorPlanExplorer';
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

// Floating Luxury AI Concierge Widget
import AiConciergeFloating from '@/components/portal/shared/AiConciergeFloating';

function PortalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser, isLoading, login, logout } = useAuth();

  const [activeModule, setActiveModule] = useState<string>('resident-home');
  const [isVisitorModalOpen, setIsVisitorModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);

  // Auto-route to the appropriate screen according to role on mount or role change
  useEffect(() => {
    if (currentUser) {
      const tabParam = searchParams.get('tab');
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
  }, [currentUser?.role]);

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0E14] flex items-center justify-center text-white">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-[#C5A880] animate-spin mx-auto" />
          <div className="font-serif text-lg tracking-wider text-[#C5A880]">
            Đang Đồng Bộ Dữ Liệu Căn Hộ...
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
            <h2 className="font-serif text-2xl font-bold">Yêu Cầu Đăng Nhập</h2>
            <p className="text-xs text-gray-400">
              Vui lòng đăng nhập tài khoản Cư Dân hoặc Ban Quản Lý để truy cập hệ thống SKYLINE.
            </p>
          </div>
          <div className="space-y-3 pt-2">
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="w-full py-3 bg-[#C5A880] hover:bg-white text-[#0D1117] font-bold text-xs uppercase tracking-wider transition-colors shadow-lg"
            >
              Đăng Nhập Tài Khoản (Email / SĐT)
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full py-2 text-gray-400 hover:text-white text-xs flex items-center justify-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Quay Lại Trang Chủ
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

  // Handle Switch Role / Account via Server API
  const handleSwitchRole = async (newRoleOrUser: string) => {
    const loggedUser = await login(newRoleOrUser, '12345678');
    if (loggedUser) {
      let targetTab = 'resident-home';
      if (loggedUser.role === 'ADMIN') {
        targetTab = 'admin-dashboard';
      } else if (loggedUser.role === 'TECHNICIAN') {
        targetTab = 'admin-kanban';
      } else {
        targetTab = 'resident-home';
      }
      setActiveModule(targetTab);
      router.replace(`/portal?tab=${targetTab}`);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const handleSelectModule = (modId: string) => {
    setActiveModule(modId);
    router.replace(`/portal?tab=${modId}`);
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
    <div className="min-h-screen w-full bg-[#0A0E14] flex flex-col select-none overflow-x-hidden">
      {/* Topbar Header (Fixed Top) */}
      <Topbar
        currentUser={currentUser}
        onSwitchRole={handleSwitchRole}
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
          className={`flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto overflow-x-hidden bg-[#0A0E14] text-white transition-all duration-300 ease-in-out ${
            isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'
          }`}
        >
          <div className="w-full max-w-7xl mx-auto space-y-6">
            {/* ------------------------------------------------------------- */}
            {/* 1. ADMIN ROLE MODULES                                         */}
            {/* ------------------------------------------------------------- */}
            {currentUser.role === 'ADMIN' && (
              <>
                {activeModule === 'admin-dashboard' && <AdminDashboard />}
                {activeModule === 'admin-apartments' && <FloorPlanExplorer />}
                {activeModule === 'admin-ekyc' && <EkycApproval />}
                {activeModule === 'admin-visitors' && <AdminVisitorControl />}
                {activeModule === 'admin-kanban' && <KanbanBoard />}
                {activeModule === 'admin-billing' && <BillingStudio />}
                {activeModule === 'admin-devices' && <DeviceHealth />}
                {activeModule === 'admin-parking' && <SmartParking />}
                {activeModule === 'admin-facilities' && <SmartFacilityPass currentUser={currentUser} />}
                {activeModule === 'admin-community' && <SurveysVoting />}
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
                {activeModule === 'resident-facilities' && <SmartFacilityPass currentUser={currentUser} />}
                {activeModule === 'resident-tickets' && <TicketService />}
                {activeModule === 'resident-ai-assistant' && (
                  <AiConciergePage
                    currentUser={currentUser}
                    onNavigateModule={(modId) => handleSelectModule(modId)}
                  />
                )}

                {/* Strictly Owner Only Features */}
                {currentUser.role === 'OWNER' && (
                  <>
                    {activeModule === 'resident-finance' && <FinanceBilling />}
                    {activeModule === 'resident-surveys' && <SurveysVoting />}
                    {activeModule === 'resident-family' && <FamilyMembers currentUser={currentUser} />}
                  </>
                )}

                {/* Resident Member Limited Warning if attempting to access Owner-only features */}
                {currentUser.role === 'TENANT' && (activeModule === 'resident-finance' || activeModule === 'resident-surveys' || activeModule === 'resident-family') && (
                  <div className="p-10 bg-[#121820] border border-[#C5A880]/80 text-center space-y-4 max-w-2xl mx-auto my-12 shadow-2xl animate-fadeIn">
                    <ShieldAlert className="w-12 h-12 text-[#C5A880] mx-auto" />
                    <h3 className="font-serif text-xl font-bold text-white">
                      Tính Năng Dành Riêng Cho Chủ Hộ Đứng Tên
                    </h3>
                    <div className="p-4 bg-[#161B22] border border-[#222B35] text-xs text-gray-300 space-y-2 text-left">
                      <p>
                        <strong>Quy định Phân quyền Cư dân Tòa nhà:</strong>
                      </p>
                      <p className="text-gray-400">
                        • Quyền Tài chính (Hóa đơn, thanh toán), Quyền Tự trị (Thêm/xóa thành viên) và Quyền Biểu quyết pháp lý (Bầu BQT, Đóng quỹ) <strong>thuộc độc quyền của Chủ hộ (Owner)</strong>.
                      </p>
                      <p className="text-gray-400">
                        • Tài khoản Người nhà / Thành viên gia đình được cấp quyền sinh hoạt tiện ích (Mã QR ra vào, FaceID, Smart Home phòng riêng, Quẹt thẻ tiện ích Sky Pool/Gym, Báo hỏng, Chatbot AI).
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveModule('resident-home')}
                      className="px-6 py-2.5 bg-[#C5A880] text-[#0D1117] text-xs font-bold uppercase tracking-wider hover:bg-white transition-colors shadow-lg"
                    >
                      Quay Lại Trang Chủ Cư Dân
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

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
        apartmentCode={currentUser.apartment_code || '12A05'}
        currentUser={currentUser}
      />
    </div>
  );
}

export default function PortalPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A0E14] flex items-center justify-center text-white">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-[#C5A880] animate-spin mx-auto" />
          <div className="font-serif text-lg tracking-wider text-[#C5A880]">
            Đang Đồng Bộ Dữ Liệu...
          </div>
        </div>
      </div>
    }>
      <PortalContent />
    </Suspense>
  );
}
