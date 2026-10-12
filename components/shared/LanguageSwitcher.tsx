'use client';

import React from 'react';
import { useLanguage } from '@/lib/languageContext';
import { Globe } from 'lucide-react';

interface LanguageSwitcherProps {
  className?: string;
  showIcon?: boolean;
}

export default function LanguageSwitcher({ className = '', showIcon = true }: LanguageSwitcherProps) {
  const { language, setLanguage, isMounted } = useLanguage();

  if (!isMounted) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs border border-[#222B35] bg-[#121820] text-gray-400 font-mono rounded-none ${className}`}>
        <span>VI</span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1 border border-[#2A3441] bg-[#0E131B] p-0.5 rounded-none shadow-sm ${className}`}>
      {showIcon && <Globe className="w-3.5 h-3.5 text-[#C5A880] ml-1.5 mr-0.5 flex-shrink-0" />}
      
      <button
        type="button"
        onClick={() => setLanguage('vi')}
        className={`px-2 py-0.5 text-[11px] font-bold font-mono transition-all rounded-none cursor-pointer ${
          language === 'vi'
            ? 'bg-[#C5A880] text-[#0A0E14] shadow'
            : 'text-gray-400 hover:text-white hover:bg-[#161D26]'
        }`}
        title="Chuyển sang Tiếng Việt"
      >
        VI
      </button>

      <span className="text-gray-600 text-[10px]">|</span>

      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`px-2 py-0.5 text-[11px] font-bold font-mono transition-all rounded-none cursor-pointer ${
          language === 'en'
            ? 'bg-[#C5A880] text-[#0A0E14] shadow'
            : 'text-gray-400 hover:text-white hover:bg-[#161D26]'
        }`}
        title="Switch to English"
      >
        EN
      </button>
    </div>
  );
}
