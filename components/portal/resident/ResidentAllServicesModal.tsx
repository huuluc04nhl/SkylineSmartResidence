'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Sparkles,
  Home,
  Camera,
  BookOpen,
  CalendarCheck,
  CreditCard,
  Wrench,
  QrCode,
  ShieldCheck,
  Users,
  Vote,
  LogOut,
  ChevronRight,
  ShieldAlert,
  Headphones
} from 'lucide-react';
import { User as UserType } from '@/lib/dataStore';
import { useLanguage } from '@/lib/languageContext';
import LanguageSwitcher from '@/components/shared/LanguageSwitcher';

interface ResidentAllServicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserType;
  onNavigate: (moduleId: string) => void;
  onOpenVisitorModal: () => void;
  onLogout: () => void;
}

interface ServiceItem {
  id: string;
  label: string;
  desc: string;
  icon: any;
  iconColor: string;
  badge?: string;
  ownerOnly?: boolean;
  action: () => void;
}

interface ServiceCategory {
  title: string;
  items: ServiceItem[];
}

export default function ResidentAllServicesModal({
  isOpen,
  onClose,
  currentUser,
  onNavigate,
  onOpenVisitorModal,
  onLogout
}: ResidentAllServicesModalProps) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');

  const isOwner = currentUser.role === 'OWNER';
  const aptCode = currentUser.apartment_code || 'CH-06';

  const categories: ServiceCategory[] = useMemo(() => {
    return [
      {
        title: t('Căn Hộ & Thiết Bị'),
        items: [
          {
            id: 'resident-smarthome',
            label: t('Smart Home 3D'),
            desc: t('Điều khiển đèn, rèm, camera & chuông hình'),
            icon: Home,
            iconColor: 'text-cyan-400',
            action: () => {
              onNavigate('resident-smarthome');
              onClose();
            }
          },
          {
            id: 'resident-smarthome-camera',
            label: t('Camera Cửa Căn Hộ'),
            desc: t('Xem trực tiếp chuông hình & mở khóa từ xa'),
            icon: Camera,
            iconColor: 'text-blue-400',
            action: () => {
              onNavigate('resident-smarthome');
              onClose();
            }
          },
          {
            id: 'resident-handbook',
            label: t('Sổ Tay Cư Dân'),
            desc: t('Nội quy tòa nhà, kỹ thuật & danh bạ khẩn cấp'),
            icon: BookOpen,
            iconColor: 'text-emerald-400',
            action: () => {
              onNavigate('resident-handbook');
              onClose();
            }
          }
        ]
      },
      {
        title: t('Tiện Ích & Đời Sống'),
        items: [
          {
            id: 'resident-facilities',
            label: t('Tiện Ích Nội Khu'),
            desc: t('Đặt chỗ Sky Pool, BBQ Garden, Gym & Sauna VIP'),
            icon: CalendarCheck,
            iconColor: 'text-amber-400',
            badge: t('Hạn mức BBQ'),
            action: () => {
              onNavigate('resident-facilities');
              onClose();
            }
          },
          {
            id: 'resident-services',
            label: t('Dịch Vụ Căn Hộ'),
            desc: t('Dọn dẹp phòng, giặt ủi, rửa xe & spa tại gia'),
            icon: Sparkles,
            iconColor: 'text-rose-400',
            action: () => {
              onNavigate('resident-services');
              onClose();
            }
          },
          {
            id: 'resident-finance',
            label: t('Hóa Đơn & Tài Chính'),
            desc: isOwner ? t('Thanh toán phí dịch vụ, điện, nước qua VietQR') : t('Chỉ dành cho Chủ Hộ'),
            icon: CreditCard,
            iconColor: 'text-emerald-400',
            ownerOnly: true,
            action: () => {
              if (isOwner) {
                onNavigate('resident-finance');
                onClose();
              }
            }
          },
          {
            id: 'resident-tickets',
            label: t('Báo Hỏng Kỹ Thuật'),
            desc: t('Gửi yêu cầu sửa chữa NKS 24/7 trực tuyến'),
            icon: Wrench,
            iconColor: 'text-amber-500',
            action: () => {
              onNavigate('resident-tickets');
              onClose();
            }
          }
        ]
      },
      {
        title: t('An Ninh & Ra Vào'),
        items: [
          {
            id: 'visitor-qr',
            label: t('Mã QR Đón Khách'),
            desc: t('Tạo mã QR hoặc mã PIN cho khách và shipper'),
            icon: QrCode,
            iconColor: 'text-[#C5A880]',
            badge: '1-Chạm',
            action: () => {
              onClose();
              onOpenVisitorModal();
            }
          },
          {
            id: 'resident-facilities-card',
            label: t('Thẻ Cư Dân 3D'),
            desc: t('Thẻ NFC mạ vàng mở cổng sảnh & thang máy'),
            icon: ShieldCheck,
            iconColor: 'text-[#C5A880]',
            action: () => {
              onNavigate('resident-facilities');
              onClose();
            }
          },
          {
            id: 'resident-profile',
            label: t('Hồ Sơ & FaceID e-KYC'),
            desc: t('Quét CCCD chip & đăng ký FaceID ra vào'),
            icon: Camera,
            iconColor: 'text-cyan-400',
            action: () => {
              onNavigate('resident-profile');
              onClose();
            }
          }
        ]
      },
      {
        title: t('Cộng Đồng & Hỗ Trợ'),
        items: [
          {
            id: 'resident-family',
            label: t('Thành Viên Gia Đình'),
            desc: t('Quản lý người nhà, biển số xe & bảo lãnh FaceID'),
            icon: Users,
            iconColor: 'text-purple-400',
            action: () => {
              onNavigate('resident-family');
              onClose();
            }
          },
          {
            id: 'resident-surveys',
            label: t('Khảo Sát & Biểu Quyết'),
            desc: isOwner ? t('Lấy ý kiến BQT, biểu quyết cư dân trực tuyến') : t('Chỉ dành cho Chủ Hộ'),
            icon: Vote,
            iconColor: 'text-indigo-400',
            ownerOnly: true,
            action: () => {
              if (isOwner) {
                onNavigate('resident-surveys');
                onClose();
              }
            }
          },
          {
            id: 'resident-ai-assistant',
            label: t('Trợ Lý AI Concierge'),
            desc: t('Hỏi đáp quy chế tòa nhà, thủ tục & tư vấn 24/7'),
            icon: Headphones,
            iconColor: 'text-[#C5A880]',
            badge: 'AI',
            action: () => {
              onNavigate('resident-ai-assistant');
              onClose();
            }
          }
        ]
      }
    ];
  }, [t, isOwner, onNavigate, onClose, onOpenVisitorModal]);

  // Filtered categories based on search
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase().trim();
    return categories
      .map(cat => ({
        ...cat,
        items: cat.items.filter(
          item =>
            item.label.toLowerCase().includes(q) ||
            item.desc.toLowerCase().includes(q)
        )
      }))
      .filter(cat => cat.items.length > 0);
  }, [categories, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-fadeIn select-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Bottom Sheet Container (Full Mobile App Experience) */}
      <div 
        className="relative z-10 w-full sm:max-w-xl max-h-[90dvh] sm:max-h-[85vh] bg-[#0E131B] border-t sm:border border-[#C5A880]/30 shadow-[0_-12px_40px_rgba(0,0,0,0.9)] flex flex-col rounded-none animate-slideInUp overflow-hidden"
      >
        {/* Grab Handle bar for Mobile Gestures */}
        <div className="pt-2.5 pb-1 flex justify-center sm:hidden">
          <div className="w-12 h-1 bg-[#3A4659] rounded-none" />
        </div>

        {/* Sheet Header */}
        <div className="p-4 sm:p-5 border-b border-[#222B35] flex items-center justify-between bg-[#121820]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#1A2332] border border-[#C5A880]/50 text-[#C5A880] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-base sm:text-lg font-bold text-white tracking-wide">
                {t('Tất Cả Dịch Vụ & Tiện Ích')}
              </h3>
              <p className="text-[11px] text-gray-400 font-mono">
                {t('Căn')} <strong className="text-[#C5A880]">{aptCode}</strong> • {isOwner ? t('Chủ Hộ') : t('Thành Viên')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#1C2533] border border-[#2D3A4B] transition-colors active:scale-95"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Real-time Search Input */}
        <div className="p-3 sm:p-4 bg-[#0A0E14] border-b border-[#222B35]">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('Tìm kiếm tiện ích, dịch vụ, sửa chữa...')}
              className="w-full h-10 pl-9 pr-8 bg-[#121820] border border-[#2A374A] focus:border-[#C5A880] text-xs text-white placeholder-gray-500 focus:outline-none transition-colors rounded-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Categories List */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-5 pb-8 sm:pb-5">
          {filteredCategories.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-xs space-y-2">
              <Search className="w-8 h-8 text-gray-600 mx-auto" />
              <p>{t('Không tìm thấy tính năng phù hợp với từ khóa')} "{searchQuery}"</p>
            </div>
          ) : (
            filteredCategories.map((cat, catIdx) => (
              <div key={catIdx} className="space-y-2.5">
                <div className="text-[10.5px] uppercase tracking-wider text-[#C5A880] font-bold font-mono flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#C5A880]" />
                  <span>{cat.title}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {cat.items.map((item) => {
                    const Icon = item.icon;
                    const isDisabled = item.ownerOnly && !isOwner;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={item.action}
                        disabled={isDisabled}
                        className={`p-3 border text-left transition-all flex items-center gap-3 relative rounded-none ${
                          isDisabled
                            ? 'bg-[#121820]/50 border-[#222B35] opacity-50 cursor-not-allowed'
                            : 'bg-[#121820] hover:bg-[#1A2332] border-[#222B35] hover:border-[#C5A880]/70 active:scale-[0.98]'
                        }`}
                      >
                        <div className={`w-10 h-10 bg-[#0A0E14] border border-[#222B35] flex items-center justify-center shrink-0 ${item.iconColor}`}>
                          <Icon className="w-5 h-5" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-white truncate">
                              {item.label}
                            </span>
                            {item.badge && (
                              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 bg-[#C5A880]/20 text-[#C5A880] border border-[#C5A880]/40 shrink-0">
                                {item.badge}
                              </span>
                            )}
                            {isDisabled && (
                              <span className="text-[9px] font-mono text-amber-400 flex items-center gap-0.5 shrink-0">
                                <ShieldAlert className="w-2.5 h-2.5" /> Chủ hộ
                              </span>
                            )}
                          </div>
                          <p className="text-[10.5px] text-gray-400 truncate mt-0.5">
                            {item.desc}
                          </p>
                        </div>

                        <ChevronRight className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}

          {/* Quick Language Switcher & Logout at the bottom */}
          <div className="pt-3 border-t border-[#222B35] space-y-2.5">
            <div className="flex items-center justify-between p-2.5 bg-[#121820] border border-[#222B35]">
              <span className="text-xs text-gray-300 font-medium">
                {t('Ngôn ngữ hiển thị:')}
              </span>
              <LanguageSwitcher variant="inline" />
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="w-full h-10 px-4 bg-[#161D26] hover:bg-red-950/60 border border-red-500/30 hover:border-red-500 text-red-300 text-xs font-semibold transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t('Đăng Xuất Tài Khoản')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
