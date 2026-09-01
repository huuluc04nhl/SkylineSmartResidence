'use client';

import React from 'react';

export interface SkylineLogoProps {
  variant?: 'full' | 'stacked' | 'icon-only' | 'text-only';
  theme?: 'dark' | 'light' | 'gold-only';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export default function SkylineLogo({
  variant = 'full',
  theme = 'dark',
  size = 'md',
  className = '',
}: SkylineLogoProps) {
  // Scale dimensions based on size prop
  const iconDimensions = {
    sm: { w: 28, h: 28, textMain: 'text-sm', textSub: 'text-[8px]', gap: 'gap-2.5' },
    md: { w: 38, h: 38, textMain: 'text-lg', textSub: 'text-[9.5px]', gap: 'gap-3.5' },
    lg: { w: 52, h: 52, textMain: 'text-2xl', textSub: 'text-[11px]', gap: 'gap-4' },
    xl: { w: 68, h: 68, textMain: 'text-3xl', textSub: 'text-[13px]', gap: 'gap-5' },
  }[size];

  // Color tokens based on theme
  const textColorMain = theme === 'light' ? 'text-[#0D1117]' : 'text-[#FAFAFA]';
  const textGoldAccent = '#C5A880';
  const textSubColor = theme === 'light' ? 'text-[#717E8E]' : 'text-[#A0AEC0]';

  // SVG Architectural Emblem
  const IconMark = (
    <svg
      width={iconDimensions.w}
      height={iconDimensions.h}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0 transition-transform duration-300 group-hover:scale-105"
    >
      <defs>
        {/* Luxury Gold Metallic Linear Gradient */}
        <linearGradient id="skylineGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#DFBA87" />
          <stop offset="35%" stopColor="#C5A880" />
          <stop offset="70%" stopColor="#E9D5B5" />
          <stop offset="100%" stopColor="#9E8057" />
        </linearGradient>

        {/* Deep Gold for Shadow Facets */}
        <linearGradient id="skylineGoldDark" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#A8865B" />
          <stop offset="100%" stopColor="#7A5E38" />
        </linearGradient>

        {/* Soft Ambient Glow */}
        <filter id="goldGlow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#C5A880" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* Outer Precision Geometric Frame */}
      <rect
        x="3"
        y="3"
        width="94"
        height="94"
        stroke="url(#skylineGoldGrad)"
        strokeWidth="1.5"
        fill="none"
        opacity="0.85"
      />
      <rect
        x="7"
        y="7"
        width="86"
        height="86"
        stroke="url(#skylineGoldGrad)"
        strokeWidth="0.5"
        fill="none"
        opacity="0.4"
      />

      {/* Architectural Skyscraper Composition */}
      <g filter="url(#goldGlow)">
        {/* Left Tower (Tháp Sapphire - West Wing) */}
        <path
          d="M 22 84 L 22 40 L 38 30 L 38 84 Z"
          fill="url(#skylineGoldDark)"
        />
        <path
          d="M 22 40 L 38 30 L 38 84 L 35 84 L 35 34 L 22 42 Z"
          fill="url(#skylineGoldGrad)"
        />
        {/* Vertical Architectural Slits (Left) */}
        <line x1="28" y1="46" x2="28" y2="78" stroke="#121820" strokeWidth="1.2" />
        <line x1="32" y1="40" x2="32" y2="78" stroke="#121820" strokeWidth="1.2" />

        {/* Center Tower (Tháp Trung Tâm - Central Spire) */}
        <path
          d="M 42 84 L 42 20 L 58 12 L 58 84 Z"
          fill="url(#skylineGoldGrad)"
        />
        <path
          d="M 50 16.5 L 58 12 L 58 84 L 50 84 Z"
          fill="url(#skylineGoldDark)"
          opacity="0.6"
        />
        {/* Central Spire Crown Accent */}
        <polygon points="50,6 48,13 52,13" fill="url(#skylineGoldGrad)" />
        {/* Vertical Architectural Slits (Center) */}
        <line x1="46" y1="26" x2="46" y2="80" stroke="#121820" strokeWidth="1.2" />
        <line x1="50" y1="22" x2="50" y2="80" stroke="#121820" strokeWidth="1.2" />
        <line x1="54" y1="26" x2="54" y2="80" stroke="#121820" strokeWidth="1.2" />

        {/* Right Tower (Tháp Diamond - East Wing) */}
        <path
          d="M 62 84 L 62 36 L 78 45 L 78 84 Z"
          fill="url(#skylineGoldGrad)"
        />
        <path
          d="M 70 40.5 L 78 45 L 78 84 L 70 84 Z"
          fill="url(#skylineGoldDark)"
          opacity="0.5"
        />
        {/* Vertical Architectural Slits (Right) */}
        <line x1="67" y1="42" x2="67" y2="78" stroke="#121820" strokeWidth="1.2" />
        <line x1="72" y1="48" x2="72" y2="78" stroke="#121820" strokeWidth="1.2" />

        {/* Base Foundation Bar */}
        <line x1="16" y1="84" x2="84" y2="84" stroke="url(#skylineGoldGrad)" strokeWidth="2" />
      </g>
    </svg>
  );

  // Typography Composition
  const TextMark = (
    <div className="flex flex-col justify-center select-none">
      {/* Brand Name */}
      <div
        className={`font-serif font-semibold tracking-[0.28em] uppercase ${iconDimensions.textMain} ${textColorMain} leading-none`}
        style={{
          fontFamily: 'var(--font-serif), "Playfair Display", Georgia, serif',
          textShadow: theme === 'dark' ? '0 1px 2px rgba(0,0,0,0.6)' : 'none',
        }}
      >
        <span className="text-[#C5A880]">S</span>KYLINE
      </div>

      {/* Subtitle / Category */}
      <div
        className={`font-sans tracking-[0.38em] uppercase font-medium mt-1.5 ${iconDimensions.textSub} ${textSubColor} leading-none flex items-center gap-2`}
        style={{ fontFamily: 'var(--font-sans), "Plus Jakarta Sans", sans-serif' }}
      >
        <span className="w-2.5 h-[1px] bg-[#C5A880]/70 inline-block"></span>
        <span className="text-[#C5A880] font-semibold tracking-[0.38em]">Smart Residence</span>
      </div>
    </div>
  );

  // Layout Variants
  if (variant === 'icon-only') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        {IconMark}
      </div>
    );
  }

  if (variant === 'text-only') {
    return <div className={className}>{TextMark}</div>;
  }

  if (variant === 'stacked') {
    return (
      <div className={`inline-flex flex-col items-center text-center gap-3 ${className}`}>
        {IconMark}
        {TextMark}
      </div>
    );
  }

  // Default: 'full' (Horizontal)
  return (
    <div className={`inline-flex items-center ${iconDimensions.gap} ${className} group`}>
      {IconMark}
      {TextMark}
    </div>
  );
}
