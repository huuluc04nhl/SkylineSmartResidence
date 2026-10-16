'use client';

import React from 'react';
import { useLanguage } from '@/lib/languageContext';

interface LanguageSwitcherProps {
  className?: string;
  variant?: 'floating' | 'inline';
  showIcon?: boolean;
}

// Vietnam National Flag (Tỷ lệ chuẩn 30x20, nền đỏ sao vàng năm cánh)
export function FlagVietnam({ className = "w-5 h-3.5" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 30 20" 
      className={`rounded-none flex-shrink-0 shadow-sm border border-black/20 ${className}`} 
      aria-hidden="true"
    >
      <rect width="30" height="20" fill="#DA251D" />
      <polygon
        points="15,4 16.5,8.8 21.6,8.8 17.5,11.8 19,16.5 15,13.6 11,16.5 12.5,11.8 8.4,8.8 13.5,8.8"
        fill="#FFFF00"
      />
    </svg>
  );
}

// United Kingdom National Flag / Union Jack (Vương Quốc Anh)
export function FlagUK({ className = "w-5 h-3.5" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 60 30" 
      className={`rounded-none flex-shrink-0 shadow-sm border border-black/20 ${className}`} 
      aria-hidden="true"
    >
      <clipPath id="uk-clip-global">
        <path d="M0,0 v30 h60 v-30 z" />
      </clipPath>
      <rect width="60" height="30" fill="#012169" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#FFFFFF" strokeWidth="6" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="2" clipPath="url(#uk-clip-global)" />
      <path d="M30,0 v30 M0,15 h60" stroke="#FFFFFF" strokeWidth="10" />
      <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
    </svg>
  );
}

export default function LanguageSwitcher({ 
  className = '', 
  variant = 'floating' 
}: LanguageSwitcherProps) {
  const { language, setLanguage, isMounted } = useLanguage();

  if (!isMounted) return null;

  if (variant === 'floating') {
    return (
      <aside 
        aria-label="Language selector"
        className={`fixed bottom-5 left-5 sm:bottom-6 sm:left-6 z-40 flex items-center gap-1.5 p-1.5 bg-[#0E131B]/95 backdrop-blur-xl border border-[#C5A880]/40 shadow-[0_10px_35px_rgba(0,0,0,0.85),0_0_15px_rgba(197,168,128,0.15)] rounded-none transition-all duration-300 hover:border-[#C5A880] ${className}`}
      >
        {/* Tiếng Việt */}
        <button
          type="button"
          onClick={() => setLanguage('vi')}
          className={`p-1.5 sm:p-2 transition-all rounded-none cursor-pointer active:scale-95 flex items-center justify-center ${
            language === 'vi'
              ? 'bg-[#1C2533] border border-[#C5A880] shadow-[0_0_12px_rgba(197,168,128,0.25)] opacity-100'
              : 'opacity-50 hover:opacity-100 hover:bg-[#141B24] border border-transparent'
          }`}
          title="Tiếng Việt"
          aria-label="Chuyển sang Tiếng Việt"
        >
          <FlagVietnam className="w-5 h-3.5 sm:w-6 sm:h-4" />
        </button>

        {/* English */}
        <button
          type="button"
          onClick={() => setLanguage('en')}
          className={`p-1.5 sm:p-2 transition-all rounded-none cursor-pointer active:scale-95 flex items-center justify-center ${
            language === 'en'
              ? 'bg-[#1C2533] border border-[#C5A880] shadow-[0_0_12px_rgba(197,168,128,0.25)] opacity-100'
              : 'opacity-50 hover:opacity-100 hover:bg-[#141B24] border border-transparent'
          }`}
          title="English"
          aria-label="Switch to English"
        >
          <FlagUK className="w-5 h-3.5 sm:w-6 sm:h-4" />
        </button>
      </aside>
    );
  }

  // Inline Variant (if needed in footers / settings)
  return (
    <div className={`inline-flex items-center gap-1 border border-[#2A3441] bg-[#0E131B] p-1 rounded-none shadow-sm ${className}`}>
      <button
        type="button"
        onClick={() => setLanguage('vi')}
        className={`p-1 sm:p-1.5 transition-all rounded-none cursor-pointer flex items-center justify-center ${
          language === 'vi'
            ? 'bg-[#1C2533] border border-[#C5A880] shadow-sm opacity-100'
            : 'opacity-50 hover:opacity-100 hover:bg-[#161D26] border border-transparent'
        }`}
        title="Tiếng Việt"
        aria-label="Tiếng Việt"
      >
        <FlagVietnam className="w-4 h-2.5 sm:w-5 sm:h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`p-1 sm:p-1.5 transition-all rounded-none cursor-pointer flex items-center justify-center ${
          language === 'en'
            ? 'bg-[#1C2533] border border-[#C5A880] shadow-sm opacity-100'
            : 'opacity-50 hover:opacity-100 hover:bg-[#161D26] border border-transparent'
        }`}
        title="English"
        aria-label="English"
      >
        <FlagUK className="w-4 h-2.5 sm:w-5 sm:h-3.5" />
      </button>
    </div>
  );
}
