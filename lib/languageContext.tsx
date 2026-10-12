'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type Language = 'vi' | 'en';

export const DICTIONARY: Record<string, { vi: string; en: string }> = {
  // Điều hướng chính
  'nav.home': { vi: 'Trang Chủ', en: 'Home' },
  'nav.about': { vi: 'Giới Thiệu', en: 'About' },
  'nav.apartments': { vi: 'Căn Hộ', en: 'Apartments' },
  'nav.amenities': { vi: 'Tiện Ích', en: 'Amenities' },
  'nav.services': { vi: 'Dịch Vụ', en: 'Services' },
  'nav.login': { vi: 'Đăng Nhập', en: 'Sign In' },
  'nav.logout': { vi: 'Đăng Xuất', en: 'Sign Out' },
  'nav.portal': { vi: 'Cổng Thông Tin', en: 'Portal' },
  'nav.dashboard': { vi: 'Bảng Điều Khiển', en: 'Dashboard' },

  // Phân quyền & Vai trò
  'role.admin': { vi: 'Ban Quản Lý', en: 'Management Board' },
  'role.owner': { vi: 'Chủ Hộ', en: 'Apartment Owner' },
  'role.tenant': { vi: 'Khách Thuê', en: 'Tenant' },
  'role.family': { vi: 'Thành Viên Gia Đình', en: 'Family Member' },
  'role.technician': { vi: 'Kỹ Thuật Viên', en: 'Technician' },
  'role.staff': { vi: 'Nhân Sự Ban Quản Lý', en: 'Staff' },

  // Trạng thái thẩm định & e-KYC
  'status.active': { vi: 'Đang Hoạt Động', en: 'Active' },
  'status.pending': { vi: 'Đang Chờ Phê Duyệt', en: 'Pending Approval' },
  'status.pending_owner': { vi: 'Chờ Chủ Hộ Xác Nhận', en: 'Pending Owner Confirmation' },
  'status.approved': { vi: 'Đã Kích Hoạt Quyền Ra Vào', en: 'Access Granted' },
  'status.rejected': { vi: 'Cần Cập Nhật / Chụp Lại', en: 'Resubmission Required' },
  'status.draft': { vi: 'Bản Nháp Chưa Gửi', en: 'Draft' },
  'status.verified': { vi: 'Đã Xác Thực Căn Cước', en: 'Identity Verified' },

  // Xác thực sinh trắc học & Căn cước
  'faceid.title': { vi: 'Nhận Diện Khuôn Mặt (FaceID)', en: 'FaceID Biometric Recognition' },
  'faceid.scan': { vi: 'Quét Khuôn Mặt Ngay', en: 'Scan Face Now' },
  'faceid.liveness': { vi: 'Xác Thực Độ Sống Người Thật', en: 'Liveness Anti-Spoofing Check' },
  'faceid.enroll': { vi: 'Thu Thập Mẫu Khuôn Mặt', en: 'FaceID Enrollment' },
  'cccd.scan': { vi: 'Quét Thẻ Căn Cước Công Dân', en: 'Scan Citizen ID Card' },
  'cccd.front': { vi: 'Mặt Trước Thẻ CCCD', en: 'Front Side ID Card' },
  'cccd.back': { vi: 'Mặt Sau Thẻ CCCD', en: 'Back Side ID Card' },
  'cccd.number': { vi: 'Số Căn Cước Công Dân', en: 'Citizen ID Number' },
  'cccd.issued_date': { vi: 'Ngày Cấp', en: 'Issued Date' },
  'cccd.issued_place': { vi: 'Nơi Cấp', en: 'Issued Place' },

  // Thao tác gửi & phê duyệt
  'action.submit_bql': { vi: 'Gửi Ban Quản Lý Duyệt', en: 'Submit to Management' },
  'action.resubmit_bql': { vi: 'Gửi Lại Ban Quản Lý Duyệt', en: 'Resubmit to Management' },
  'action.approve': { vi: 'Xác Nhận & Kích Hoạt', en: 'Approve & Activate' },
  'action.reject': { vi: 'Yêu Cầu Bổ Sung', en: 'Request Rescan' },
  'action.inspect': { vi: 'Kiểm Tra Đối Chiếu', en: 'Inspect & Compare' },
  'action.revoke': { vi: 'Tạm Khóa / Thu Hồi Quyền', en: 'Revoke Access' },
  'action.refresh': { vi: 'Làm Mới', en: 'Refresh' },
  'action.close': { vi: 'Đóng', en: 'Close' },
  'action.save': { vi: 'Lưu Thay Đổi', en: 'Save Changes' },
  'action.cancel': { vi: 'Hủy Bỏ', en: 'Cancel' },

  // Thông báo phản hồi
  'notice.submit_success': { 
    vi: 'Hồ sơ căn cước công dân và mẫu FaceID đã được gửi tới Ban Quản Lý thành công!', 
    en: 'Citizen ID and FaceID samples submitted to Management Board successfully!' 
  },
  'notice.approve_success': {
    vi: 'Đã phê duyệt hồ sơ và kích hoạt quyền ra vào thành công!',
    en: 'Profile approved and access rights granted successfully!'
  },
  'notice.reject_success': {
    vi: 'Đã gửi thông báo yêu cầu cư dân chụp lại / cập nhật hồ sơ.',
    en: 'Notification sent requesting resident to resubmit profile.'
  },

  // Cổng cư dân & BQL
  'portal.apartment': { vi: 'Căn Hộ', en: 'Apartment' },
  'portal.building': { vi: 'Tòa Nhà', en: 'Building' },
  'portal.smarthome': { vi: 'Nhà Thông Minh', en: 'Smart Home' },
  'portal.utility': { vi: 'Hóa Đơn Tiện Ích', en: 'Utility Bills' },
  'portal.visitor': { vi: 'Khách Đến Thăm', en: 'Visitor Passes' },
  'portal.tickets': { vi: 'Hỗ Trợ Kỹ Thuật', en: 'Technical Support' },
  'portal.surveys': { vi: 'Biểu Quyết Cư Dân', en: 'Resident Voting' },
  'portal.profile': { vi: 'Hồ Sơ Cư Dân', en: 'Resident Profile' },
  'portal.search': { vi: 'Tìm kiếm căn hộ, tiện ích, dịch vụ...', en: 'Search apartments, amenities, services...' },

  // Chung cư
  'brand.name': { vi: 'Chung Cư Thông Minh Skyline', en: 'Skyline Smart Residence' },
  'brand.hotline': { vi: 'Đường Dây Nóng Kỹ Thuật: 1900 8899', en: 'Technical Hotline: 1900 8899' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string) => string;
  isMounted: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('vi');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const saved = localStorage.getItem('skyline_language') as Language | null;
      if (saved === 'en' || saved === 'vi') {
        setLanguageState(saved);
        applyLanguage(saved);
      } else {
        // Mặc định thuần Tiếng Việt
        setLanguageState('vi');
        applyLanguage('vi');
      }
    } catch {
      setLanguageState('vi');
      applyLanguage('vi');
    }
  }, []);

  const applyLanguage = (lang: Language) => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('skyline_language', lang);
    } catch {}
    applyLanguage(lang);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('skyline_language_changed', { detail: { language: lang } }));
    }
  };

  const toggleLanguage = () => {
    const next = language === 'vi' ? 'en' : 'vi';
    setLanguage(next);
  };

  const t = (key: string, fallback?: string): string => {
    const entry = DICTIONARY[key];
    if (entry && entry[language]) {
      return entry[language];
    }
    return fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t, isMounted }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
