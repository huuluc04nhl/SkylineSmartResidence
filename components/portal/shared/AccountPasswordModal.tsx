'use client';

import React from 'react';
import { X, KeyRound } from 'lucide-react';
import { User } from '@/lib/dataStore';
import AccountPasswordSection from './AccountPasswordSection';

interface AccountPasswordModalProps {
  currentUser: User;
  isOpen: boolean;
  onClose: () => void;
}

export default function AccountPasswordModal({
  currentUser,
  isOpen,
  onClose,
}: AccountPasswordModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn select-none">
      <div 
        className="relative w-full max-w-4xl bg-[#0D1117] border border-[#C5A880] shadow-2xl rounded-none flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#121820] border-b border-[#222B35] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-[#161D26] border border-[#C5A880]/50 text-[#C5A880]">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-white tracking-wide">
                Đổi Mật Khẩu Tài Khoản Cá Nhân
              </h3>
              <p className="text-[11px] text-gray-400">
                Toàn quyền thay đổi mật khẩu và sử dụng trình tạo mật khẩu tự động an toàn
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-[#1E2631] transition-colors rounded-none border border-transparent hover:border-[#2D3748]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <AccountPasswordSection
            currentUser={currentUser}
            isModal={true}
            onSuccess={() => {
              // Can automatically close after a short delay or stay open for feedback
            }}
          />
        </div>
      </div>
    </div>
  );
}
