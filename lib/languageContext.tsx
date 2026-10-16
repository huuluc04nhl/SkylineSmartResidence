'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useRef } from 'react';
import { TRANSLATIONS_DATA } from './translationsData';

export type Language = 'vi' | 'en';

// =============================================================================
// FAST LOOKUP MAPS (O(1))
// =============================================================================
const VI_TO_EN_MAP = new Map<string, string>();
const EN_TO_VI_MAP = new Map<string, string>();

for (const [vi, en] of TRANSLATIONS_DATA) {
  const cleanVi = vi.trim();
  const cleanEn = en.trim();
  if (cleanVi && cleanEn) {
    VI_TO_EN_MAP.set(cleanVi.toLowerCase(), cleanEn);
    EN_TO_VI_MAP.set(cleanEn.toLowerCase(), cleanVi);
  }
}

// =============================================================================
// SAFE WHITESPACE & CHARACTER PRESERVATION HELPER
// =============================================================================
function preserveWhitespace(original: string, translated: string): string {
  if (!original) return translated;
  const match = original.match(/^(\s*)([\s\S]*?)(\s*)$/);
  if (!match) return translated;
  return match[1] + translated + match[3];
}

// =============================================================================
// STRUCTURAL & PATTERN TRANSLATION ENGINE
// =============================================================================
export function translateString(text: string, targetLang: Language): string {
  if (!text || typeof text !== 'string') return text;
  const trimmed = text.trim();
  if (!trimmed) return text;

  const lower = trimmed.toLowerCase();

  // 1. Direct O(1) Dictionary Lookup
  if (targetLang === 'en' && VI_TO_EN_MAP.has(lower)) {
    const translated = VI_TO_EN_MAP.get(lower)!;
    return preserveWhitespace(text, matchCase(trimmed, translated));
  }
  if (targetLang === 'vi' && EN_TO_VI_MAP.has(lower)) {
    const translated = EN_TO_VI_MAP.get(lower)!;
    return preserveWhitespace(text, matchCase(trimmed, translated));
  }

  // 1b. Multi-part Delimiters: " • ", " | ", " - ", "\n"
  for (const sep of [' • ', ' | ', ' - ', '\n']) {
    if (trimmed.includes(sep)) {
      const parts = trimmed.split(sep);
      let changed = false;
      const translatedParts = parts.map(p => {
        const trans = translateString(p, targetLang);
        if (trans !== p) changed = true;
        return trans;
      });
      if (changed) {
        return preserveWhitespace(text, translatedParts.join(sep));
      }
    }
  }

  // 1c. Multi-Sentence Paragraphs (period + space)
  if (trimmed.includes('. ') && !trimmed.match(/^\d+\.\s/)) {
    const sentences = trimmed.split(/(?<=\.)\s+/);
    if (sentences.length > 1) {
      let anyChanged = false;
      const transSentences = sentences.map(s => {
        const trans = translateString(s, targetLang);
        if (trans !== s) anyChanged = true;
        return trans;
      });
      if (anyChanged) {
        return preserveWhitespace(text, transSentences.join(' '));
      }
    }
  }

  // 2. Structural Patterns
  // Quotes: "...", '...'
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    const q = trimmed[0];
    const inner = trimmed.slice(1, -1);
    const trans = translateString(inner, targetLang);
    return preserveWhitespace(text, `${q}${trans}${q}`);
  }

  // Bullets & List markers: "* ", "- ", "+ ", "• "
  for (const b of ['* ', '- ', '+ ', '• ']) {
    if (trimmed.startsWith(b)) {
      const inner = trimmed.slice(b.length);
      const trans = translateString(inner, targetLang);
      return preserveWhitespace(text, `${b}${trans}`);
    }
  }

  // Numbered prefixes: "1. ", "2. ", "10) "
  const numPrefix = trimmed.match(/^(\d+[\.\)]\s*)(.*)$/);
  if (numPrefix) {
    const prefix = numPrefix[1];
    const rest = numPrefix[2];
    const trans = translateString(rest, targetLang);
    return preserveWhitespace(text, `${prefix}${trans}`);
  }

  // Parentheses: "(Chính thức)", "(Chưa có)"
  if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
    const inner = trimmed.slice(1, -1);
    const trans = translateString(inner, targetLang);
    return preserveWhitespace(text, `(${trans})`);
  }

  // Time slot: "06:00 - 08:00 (Sáng sớm bình minh)"
  const timeSlot = trimmed.match(/^(\d{2}:\d{2}\s*-\s*\d{2}:\d{2})\s*\((.*)\)$/);
  if (timeSlot) {
    const timeRange = timeSlot[1];
    const desc = translateString(timeSlot[2], targetLang);
    return preserveWhitespace(text, `${timeRange} (${desc})`);
  }

  // Duration: "1 Giờ (Gặp nhanh)", "24 Giờ (Cả ngày)"
  const duration = trimmed.match(/^(\d+)\s*Giờ\s*\((.*)\)$/i);
  if (duration && targetLang === 'en') {
    const hours = duration[1];
    const desc = translateString(duration[2], targetLang);
    return preserveWhitespace(text, `${hours} ${parseInt(hours) === 1 ? 'Hour' : 'Hours'} (${desc})`);
  }

  // Key-Value with colon: "Trạng thái: Đang xử lý"
  if (trimmed.includes(':') && !trimmed.includes('http') && !trimmed.match(/\d{2}:\d{2}/)) {
    const idx = trimmed.indexOf(':');
    const label = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim();
    if (label.length > 0) {
      const transLabel = translateString(label, targetLang);
      const transVal = val.length > 0 ? translateString(val, targetLang) : '';
      const combined = val.length > 0 ? `${transLabel}: ${transVal}` : `${transLabel}:`;
      return preserveWhitespace(text, combined);
    }
  }

  // 3. Domain Templates (EN)
  if (targetLang === 'en') {
    // Apartments & Towers: "Căn BS-07", "Căn hộ BS-07.08 Tòa BS-07"
    let m = trimmed.match(/^(?:Căn hộ|Căn)\s+([A-Za-z0-9\.\-_]+)(.*)$/i);
    if (m) {
      const code = m[1];
      const rest = m[2] ? ' ' + translateString(m[2], 'en') : '';
      return preserveWhitespace(text, `Apartment ${code}${rest}`.trim());
    }

    m = trimmed.match(/^Tòa\s+([A-Za-z0-9\.\-_]+)(.*)$/i);
    if (m) {
      const code = m[1];
      const rest = m[2] ? ' ' + translateString(m[2], 'en') : '';
      return preserveWhitespace(text, `Tower ${code}${rest}`.trim());
    }

    m = trimmed.match(/^Tầng\s+(\d+)(.*)$/i);
    if (m) {
      const fl = m[1];
      const rest = m[2] ? ' ' + translateString(m[2], 'en') : '';
      return preserveWhitespace(text, `Floor ${fl}${rest}`.trim());
    }

    m = trimmed.match(/^Phòng\s+([A-Za-z0-9\.\-_]+)(.*)$/i);
    if (m) {
      const room = m[1];
      const rest = m[2] ? ' ' + translateString(m[2], 'en') : '';
      return preserveWhitespace(text, `Room ${room}${rest}`.trim());
    }

    m = trimmed.match(/^Khu\s+([A-Za-z0-9\.\-_]+)(.*)$/i);
    if (m) {
      const zone = m[1];
      const rest = m[2] ? ' ' + translateString(m[2], 'en') : '';
      return preserveWhitespace(text, `Zone ${zone}${rest}`.trim());
    }

    m = trimmed.match(/^Ô\s+([A-Za-z0-9\.\-_]+)(.*)$/i);
    if (m) {
      const slot = m[1];
      const rest = m[2] ? ' ' + translateString(m[2], 'en') : '';
      return preserveWhitespace(text, `Slot ${slot}${rest}`.trim());
    }

    // Relative Time Templates
    m = trimmed.match(/^(\d+)\s+ngày trước$/i);
    if (m) return preserveWhitespace(text, `${m[1]} ${parseInt(m[1]) === 1 ? 'day ago' : 'days ago'}`);

    m = trimmed.match(/^(\d+)\s+giờ trước$/i);
    if (m) return preserveWhitespace(text, `${m[1]} ${parseInt(m[1]) === 1 ? 'hour ago' : 'hours ago'}`);

    m = trimmed.match(/^(\d+)\s+phút trước$/i);
    if (m) return preserveWhitespace(text, `${m[1]} ${parseInt(m[1]) === 1 ? 'minute ago' : 'minutes ago'}`);

    // Counters: "2 người", "4 phòng ngủ", "2 phòng tắm"
    m = trimmed.match(/^(\d+)\s+người$/i);
    if (m) return preserveWhitespace(text, `${m[1]} ${parseInt(m[1]) === 1 ? 'person' : 'people'}`);

    m = trimmed.match(/^(\d+)\s+phòng ngủ$/i);
    if (m) return preserveWhitespace(text, `${m[1]} ${parseInt(m[1]) === 1 ? 'bedroom' : 'bedrooms'}`);

    m = trimmed.match(/^(\d+)\s+phòng tắm$/i);
    if (m) return preserveWhitespace(text, `${m[1]} ${parseInt(m[1]) === 1 ? 'bathroom' : 'bathrooms'}`);

    // Status chips with counter: "Tất cả (12)", "Đang xử lý (3)"
    m = trimmed.match(/^([^\(\)]+)\s*\(([0-9]+)\)$/);
    if (m) {
      const base = translateString(m[1].trim(), 'en');
      return preserveWhitespace(text, `${base} (${m[2]})`);
    }

    // Common prefixes: "Danh sách...", "Lịch sử...", "Chi tiết...", "Quản lý..."
    const prefixMap: Array<[string, string]> = [
      ['Danh sách', 'List of'],
      ['Lịch sử', 'History of'],
      ['Chi tiết', 'Details of'],
      ['Quản lý', 'Management of'],
      ['Thông tin', 'Information of'],
      ['Không có', 'No'],
      ['Chưa có', 'No']
    ];
    for (const [pVi, pEn] of prefixMap) {
      if (trimmed.startsWith(pVi + ' ')) {
        const rest = trimmed.slice(pVi.length + 1).trim();
        const transRest = translateString(rest, 'en');
        return preserveWhitespace(text, `${pEn} ${transRest}`);
      }
    }

    // Currencies: "1.500.000 đ" -> "1,500,000 VND"
    m = trimmed.match(/^([0-9\.,]+)\s*(đ|VNĐ|vnd)$/i);
    if (m) {
      return preserveWhitespace(text, `${m[1]} VND`);
    }

    // Prices in Billion: "2.31 Tỷ", "Từ 3.2 Tỷ"
    m = trimmed.match(/^(Từ\s+)?([0-9\.,]+)\s*Tỷ$/i);
    if (m) {
      const prefix = m[1] ? 'From ' : '';
      return preserveWhitespace(text, `${prefix}${m[2]} Billion VND`);
    }

    // Price per m²: "~ 55.0 tr/m²", "55.0 tr/m²"
    m = trimmed.match(/^([~≈]\s*)?([0-9\.,]+)\s*tr\/m²$/i);
    if (m) {
      const prefix = m[1] || '';
      return preserveWhitespace(text, `${prefix}${m[2]}M VND/m²`);
    }

    // Unit Areas: "54.8 m² tim tường", "Tim tường: 54.8 m²"
    m = trimmed.match(/^([0-9\.,]+)\s*m²\s*tim tường$/i);
    if (m) return preserveWhitespace(text, `${m[1]} m² Gross Built Area`);

    m = trimmed.match(/^Tim tường:\s*([0-9\.,]+)\s*m²$/i);
    if (m) return preserveWhitespace(text, `Gross Area: ${m[1]} m²`);

    m = trimmed.match(/^([0-9\.,]+)\s*m²\s*thông thủy$/i);
    if (m) return preserveWhitespace(text, `${m[1]} m² Net Usable Area`);

    // Management fee: "Phí QL: 12.500 đ/m²"
    m = trimmed.match(/^Phí QL:\s*([0-9\.,]+)\s*(?:đ|VND)\/m²$/i);
    if (m) return preserveWhitespace(text, `Management Fee: ${m[1]} VND/m²`);

    // Room configurations: "1 PN • 1 WC", "2 PN • 1 WC"
    m = trimmed.match(/^(\d+)\s*PN\s*•\s*(\d+)\s*WC$/i);
    if (m) return preserveWhitespace(text, `${m[1]} Bed • ${m[2]} Bath`);

    // Month & Year: "Tháng 08/2026" -> "August 2026"
    m = trimmed.match(/^Tháng\s+(\d{1,2})\/(\d{4})$/i);
    if (m) {
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const monthIdx = parseInt(m[1], 10) - 1;
      if (monthIdx >= 0 && monthIdx < 12) {
        return preserveWhitespace(text, `${monthNames[monthIdx]} ${m[2]}`);
      }
      return preserveWhitespace(text, `Month ${m[1]}/${m[2]}`);
    }
  }

  // 4. Reverse Domain Templates (VI)
  if (targetLang === 'vi') {
    // Month & Year: "August 2026" -> "Tháng 08/2026"
    let m = trimmed.match(/^(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})$/i);
    if (m) {
      const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
      const monthIdx = monthNames.indexOf(m[1].toLowerCase()) + 1;
      const padMonth = monthIdx < 10 ? `0${monthIdx}` : `${monthIdx}`;
      return preserveWhitespace(text, `Tháng ${padMonth}/${m[2]}`);
    }
    m = trimmed.match(/^Apartment\s+([A-Za-z0-9\.\-_]+)(.*)$/i);
    if (m) {
      const code = m[1];
      const rest = m[2] ? ' ' + translateString(m[2], 'vi') : '';
      return preserveWhitespace(text, `Căn hộ ${code}${rest}`.trim());
    }

    m = trimmed.match(/^Tower\s+([A-Za-z0-9\.\-_]+)(.*)$/i);
    if (m) {
      const code = m[1];
      const rest = m[2] ? ' ' + translateString(m[2], 'vi') : '';
      return preserveWhitespace(text, `Tòa ${code}${rest}`.trim());
    }

    m = trimmed.match(/^Floor\s+(\d+)(.*)$/i);
    if (m) {
      const fl = m[1];
      const rest = m[2] ? ' ' + translateString(m[2], 'vi') : '';
      return preserveWhitespace(text, `Tầng ${fl}${rest}`.trim());
    }

    m = trimmed.match(/^Room\s+([A-Za-z0-9\.\-_]+)(.*)$/i);
    if (m) {
      const room = m[1];
      const rest = m[2] ? ' ' + translateString(m[2], 'vi') : '';
      return preserveWhitespace(text, `Phòng ${room}${rest}`.trim());
    }

    m = trimmed.match(/^Zone\s+([A-Za-z0-9\.\-_]+)(.*)$/i);
    if (m) {
      const zone = m[1];
      const rest = m[2] ? ' ' + translateString(m[2], 'vi') : '';
      return preserveWhitespace(text, `Khu ${zone}${rest}`.trim());
    }

    m = trimmed.match(/^Slot\s+([A-Za-z0-9\.\-_]+)(.*)$/i);
    if (m) {
      const slot = m[1];
      const rest = m[2] ? ' ' + translateString(m[2], 'vi') : '';
      return preserveWhitespace(text, `Ô ${slot}${rest}`.trim());
    }

    m = trimmed.match(/^(\d+)\s+days?\s+ago$/i);
    if (m) return preserveWhitespace(text, `${m[1]} ngày trước`);

    m = trimmed.match(/^(\d+)\s+hours?\s+ago$/i);
    if (m) return preserveWhitespace(text, `${m[1]} giờ trước`);

    m = trimmed.match(/^(\d+)\s+minutes?\s+ago$/i);
    if (m) return preserveWhitespace(text, `${m[1]} phút trước`);

    m = trimmed.match(/^(\d+)\s+(?:people|person)$/i);
    if (m) return preserveWhitespace(text, `${m[1]} người`);

    m = trimmed.match(/^(\d+)\s+bedrooms?$/i);
    if (m) return preserveWhitespace(text, `${m[1]} phòng ngủ`);

    m = trimmed.match(/^(\d+)\s+bathrooms?$/i);
    if (m) return preserveWhitespace(text, `${m[1]} phòng tắm`);

    // Status chips with counter: "All (12)", "Pending (3)"
    m = trimmed.match(/^([^\(\)]+)\s*\(([0-9]+)\)$/);
    if (m) {
      const base = translateString(m[1].trim(), 'vi');
      return preserveWhitespace(text, `${base} (${m[2]})`);
    }

    const reversePrefixMap: Array<[string, string]> = [
      ['List of', 'Danh sách'],
      ['History of', 'Lịch sử'],
      ['Details of', 'Chi tiết'],
      ['Management of', 'Quản lý'],
      ['Information of', 'Thông tin'],
      ['No', 'Không có']
    ];
    for (const [pEn, pVi] of reversePrefixMap) {
      if (trimmed.startsWith(pEn + ' ')) {
        const rest = trimmed.slice(pEn.length + 1).trim();
        const transRest = translateString(rest, 'vi');
        return preserveWhitespace(text, `${pVi} ${transRest}`);
      }
    }

    // Reverse Prices in Billion
    m = trimmed.match(/^(From\s+)?([0-9\.,]+)\s*Billion\s*VND$/i);
    if (m) {
      const prefix = m[1] ? 'Từ ' : '';
      return preserveWhitespace(text, `${prefix}${m[2]} Tỷ`);
    }

    // Reverse Price per m²
    m = trimmed.match(/^([~≈]\s*)?([0-9\.,]+)\s*M\s*VND\/m²$/i);
    if (m) {
      const prefix = m[1] || '';
      return preserveWhitespace(text, `${prefix}${m[2]} tr/m²`);
    }

    // Reverse Unit Areas
    m = trimmed.match(/^([0-9\.,]+)\s*m²\s*Gross\s*(?:Built\s*)?Area$/i);
    if (m) return preserveWhitespace(text, `${m[1]} m² tim tường`);

    m = trimmed.match(/^Gross\s*Area:\s*([0-9\.,]+)\s*m²$/i);
    if (m) return preserveWhitespace(text, `Tim tường: ${m[1]} m²`);

    m = trimmed.match(/^([0-9\.,]+)\s*m²\s*Net\s*(?:Usable\s*)?Area$/i);
    if (m) return preserveWhitespace(text, `${m[1]} m² thông thủy`);

    // Reverse Management Fee
    m = trimmed.match(/^Management\s*Fee:\s*([0-9\.,]+)\s*VND\/m²$/i);
    if (m) return preserveWhitespace(text, `Phí QL: ${m[1]} đ/m²`);

    // Reverse Room configuration
    m = trimmed.match(/^(\d+)\s*Bed\s*•\s*(\d+)\s*Bath$/i);
    if (m) return preserveWhitespace(text, `${m[1]} PN • ${m[2]} WC`);

    m = trimmed.match(/^([0-9\.,]+)\s*VND$/i);
    if (m) {
      return preserveWhitespace(text, `${m[1]} đ`);
    }
  }

  return text;
}

function matchCase(source: string, target: string): string {
  if (!source || !target) return target;
  if (source === source.toUpperCase() && source.length > 1) return target.toUpperCase();
  if (source[0] === source[0].toUpperCase()) {
    return target.charAt(0).toUpperCase() + target.slice(1);
  }
  return target;
}

// =============================================================================
// REACT CONTEXT & PROVIDER
// =============================================================================
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (keyOrText: string, fallback?: string) => string;
  isMounted: boolean;
  isEn: boolean;
  isVi: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('skyline_language') as Language | null;
        if (saved === 'en' || saved === 'vi') return saved;
      } catch {}
    }
    return 'vi';
  });
  const [isMounted, setIsMounted] = useState(false);
  const isTranslatingRef = useRef(false);
  const originalNodesMap = useRef<WeakMap<Node, string>>(new WeakMap());

  useEffect(() => {
    setIsMounted(true);
    try {
      const saved = localStorage.getItem('skyline_language') as Language | null;
      if (saved === 'en' || saved === 'vi') {
        setLanguageState(saved);
        applyDocumentLang(saved);
      } else {
        setLanguageState('vi');
        applyDocumentLang('vi');
      }
    } catch {
      setLanguageState('vi');
      applyDocumentLang('vi');
    }
  }, []);

  const applyDocumentLang = (lang: Language) => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
      document.documentElement.setAttribute('data-lang', lang);
    }
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('skyline_language', lang);
    } catch {}
    applyDocumentLang(lang);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('skyline_language_changed', { detail: { language: lang } }));
    }
  };

// Known dot-notation and role keys
const KEY_DICTIONARY: Record<string, Record<Language, string>> = {
  'nav.home': { vi: 'Trang Chủ', en: 'Home' },
  'nav.about': { vi: 'Tổng Quan', en: 'Overview' },
  'nav.concept': { vi: 'Triết Lý Thiết Kế', en: 'Concept' },
  'nav.apartments': { vi: 'Mặt Bằng Căn Hộ', en: 'Apartment Layout' },
  'nav.amenities': { vi: 'Tiện Ích 5 Sao', en: '5-Star Amenities' },
  'nav.services': { vi: 'Lõi Công Nghệ AI', en: 'AI Technology' },
  'nav.login': { vi: 'Đăng Nhập', en: 'Sign In' },
  'nav.logout': { vi: 'Đăng Xuất', en: 'Sign Out' },
  'nav.portal': { vi: 'Cổng Cư Dân', en: 'Resident Portal' },
  'nav.dashboard': { vi: 'Vào Bảng Điều Khiển', en: 'Go to Dashboard' },
  'role.admin': { vi: 'Ban Quản Lý', en: 'Management Board' },
  'role.owner': { vi: 'Chủ Hộ Căn Hộ', en: 'Apartment Owner' },
  'role.tenant': { vi: 'Khách Thuê', en: 'Tenant' },
  'role.family': { vi: 'Người Nhà Căn Hộ', en: 'Family Member' },
  'role.technician': { vi: 'Kỹ Thuật Viên', en: 'Technician' },
  'role.staff': { vi: 'Nhân Sự Ban Quản Lý', en: 'Staff' },
  'role.resident': { vi: 'Cư Dân', en: 'Resident' },
  'ADMIN': { vi: 'Ban Quản Lý', en: 'Management Board' },
  'OWNER': { vi: 'Chủ Hộ', en: 'Owner' },
  'TENANT': { vi: 'Khách Thuê', en: 'Tenant' },
  'FAMILY': { vi: 'Người Nhà', en: 'Family Member' },
  'TECHNICIAN': { vi: 'Kỹ Thuật Viên', en: 'Technician' },
  'hero.desc_auth': {
    vi: 'Dự án căn hộ hạng sang SKYLINE Smart Residence tại cụm 4 chung cư The Tropical (BS-07, BS-08, BS-09, BS-10) kiến tạo chuẩn sống tự động hóa hoàn chỉnh: Định danh sinh trắc học FaceID <0.5s, giám sát an ninh Vision AI và hệ thống dự báo bảo trì thông minh.',
    en: 'Luxury apartment project SKYLINE Smart Residence at 4 towers of The Tropical (BS-07, BS-08, BS-09, BS-10) pioneers complete automated living: FaceID biometrics <0.5s, Vision AI security monitoring, and predictive maintenance.'
  },
  'hero.desc_unauth': {
    vi: 'Dự án căn hộ hạng sang SKYLINE Smart Residence tại cụm 4 chung cư The Tropical (BS-07, BS-08, BS-09, BS-10) — định danh sinh trắc học FaceID, giám sát Vision AI và trợ lý ảo AI Concierge 24/7.',
    en: 'Luxury apartment project SKYLINE Smart Residence at 4 towers of The Tropical (BS-07, BS-08, BS-09, BS-10) — biometric FaceID access, Vision AI security, and 24/7 AI Concierge.'
  }
};

  const toggleLanguage = () => {
    const next = language === 'vi' ? 'en' : 'vi';
    setLanguage(next);
  };

  /**
   * Direct translation helper in React components
   */
  const t = (keyOrText: string, fallback?: string): string => {
    if (!keyOrText) return fallback || '';
    const trimmed = keyOrText.trim();

    // 1. Direct key dictionary lookup (e.g. 'nav.dashboard', 'role.admin')
    if (KEY_DICTIONARY[trimmed]) {
      return KEY_DICTIONARY[trimmed][language];
    }

    // 2. Target English
    if (language === 'en') {
      const trans = translateString(trimmed, 'en');
      if (trans !== trimmed) return trans;
      if (fallback) {
        const fbTrans = translateString(fallback.trim(), 'en');
        return fbTrans;
      }
      return keyOrText;
    }

    // 3. Target Vietnamese
    if (fallback) {
      if (trimmed.includes('.') || trimmed.includes('_') || /^[a-z]+$/.test(trimmed)) {
        return fallback;
      }
    }
    const back = translateString(trimmed, 'vi');
    if (back !== trimmed) return back;
    return fallback || keyOrText;
  };

  // ===========================================================================
  // AUTOMATED HIGH-FIDELITY PROJECT-WIDE DOM TRANSLATION
  // ===========================================================================
  useEffect(() => {
    if (typeof window === 'undefined' || !isMounted) return;

    let debounceTimer: any = null;

    const processTextNode = (node: Node) => {
      if (!node || node.nodeType !== Node.TEXT_NODE) return;
      const currentVal = node.nodeValue || '';
      if (!currentVal.trim()) return;

      // Ignore code, script, style, pre, svg tags
      const parent = node.parentElement;
      if (!parent) return;
      const tag = parent.tagName.toLowerCase();
      if (tag === 'script' || tag === 'style' || tag === 'code' || tag === 'pre' || tag === 'svg') {
        return;
      }

      // Do not alter active input / textarea while typing
      if (document.activeElement && (document.activeElement === parent || parent.contains(document.activeElement))) {
        if (tag === 'textarea' || tag === 'input' || parent.isContentEditable) {
          return;
        }
      }

      // Save baseline in originalNodesMap on first encounter
      if (!originalNodesMap.current.has(node)) {
        originalNodesMap.current.set(node, currentVal);
      }

      const baseText = originalNodesMap.current.get(node) || currentVal;

      if (language === 'en') {
        const translated = translateString(baseText, 'en');
        if (translated !== node.nodeValue) {
          node.nodeValue = translated;
        }
      } else {
        // Restore pristine Vietnamese
        const viText = originalNodesMap.current.has(node) ? originalNodesMap.current.get(node)! : translateString(baseText, 'vi');
        if (viText !== node.nodeValue) {
          node.nodeValue = viText;
        }
      }
    };

    const processAttributes = (el: HTMLElement) => {
      if (!el || !el.getAttribute) return;

      // Placeholder
      const placeholder = el.getAttribute('placeholder');
      if (placeholder) {
        if (language === 'en') {
          if (!el.getAttribute('data-orig-placeholder')) {
            const viPlaceholder = translateString(placeholder, 'vi');
            el.setAttribute('data-orig-placeholder', viPlaceholder);
          }
          const basePlaceholder = el.getAttribute('data-orig-placeholder') || placeholder;
          const translated = translateString(basePlaceholder, 'en');
          if (translated !== placeholder) el.setAttribute('placeholder', translated);
        } else {
          const orig = el.getAttribute('data-orig-placeholder');
          if (orig) el.setAttribute('placeholder', orig);
          else {
            const translatedBack = translateString(placeholder, 'vi');
            el.setAttribute('placeholder', translatedBack);
          }
        }
      }

      // Title
      const title = el.getAttribute('title');
      if (title) {
        if (language === 'en') {
          if (!el.getAttribute('data-orig-title')) {
            const viTitle = translateString(title, 'vi');
            el.setAttribute('data-orig-title', viTitle);
          }
          const baseTitle = el.getAttribute('data-orig-title') || title;
          const translated = translateString(baseTitle, 'en');
          if (translated !== title) el.setAttribute('title', translated);
        } else {
          const orig = el.getAttribute('data-orig-title');
          if (orig) el.setAttribute('title', orig);
          else {
            const translatedBack = translateString(title, 'vi');
            el.setAttribute('title', translatedBack);
          }
        }
      }

      // Aria-Label
      const ariaLabel = el.getAttribute('aria-label');
      if (ariaLabel) {
        if (language === 'en') {
          if (!el.getAttribute('data-orig-aria')) {
            const viAria = translateString(ariaLabel, 'vi');
            el.setAttribute('data-orig-aria', viAria);
          }
          const baseAria = el.getAttribute('data-orig-aria') || ariaLabel;
          const translated = translateString(baseAria, 'en');
          if (translated !== ariaLabel) el.setAttribute('aria-label', translated);
        } else {
          const orig = el.getAttribute('data-orig-aria');
          if (orig) el.setAttribute('aria-label', orig);
          else {
            const translatedBack = translateString(ariaLabel, 'vi');
            el.setAttribute('aria-label', translatedBack);
          }
        }
      }
    };

    const walkAndTranslate = (root: Node) => {
      if (isTranslatingRef.current || !root) return;
      isTranslatingRef.current = true;

      try {
        const walker = document.createTreeWalker(
          root,
          NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
          null
        );

        let currentNode = walker.nextNode();
        while (currentNode) {
          if (currentNode.nodeType === Node.TEXT_NODE) {
            processTextNode(currentNode);
          } else if (currentNode.nodeType === Node.ELEMENT_NODE) {
            processAttributes(currentNode as HTMLElement);
          }
          currentNode = walker.nextNode();
        }
      } finally {
        isTranslatingRef.current = false;
      }
    };

    // Scan DOM upon language switch or mount
    walkAndTranslate(document.body);
    // Scheduled backup walks for async hydrated data & route/tab transitions
    const backupTimer1 = setTimeout(() => walkAndTranslate(document.body), 100);
    const backupTimer2 = setTimeout(() => walkAndTranslate(document.body), 350);
    const backupTimer3 = setTimeout(() => walkAndTranslate(document.body), 800);

    // Dynamic Observer for Modals, Tabs, Tooltips, Accordions
    const pendingNodes = new Set<Node>();

    const processPendingQueue = () => {
      if (isTranslatingRef.current) {
        debounceTimer = setTimeout(processPendingQueue, 25);
        return;
      }
      if (pendingNodes.size === 0) return;

      const nodesToProcess = Array.from(pendingNodes);
      pendingNodes.clear();

      for (const target of nodesToProcess) {
        if (!target.isConnected) continue;
        if (target.nodeType === Node.TEXT_NODE) {
          const newText = (target as Text).nodeValue || '';
          if (newText.trim()) {
            if (language === 'vi') {
              originalNodesMap.current.set(target, newText);
            } else {
              if (!originalNodesMap.current.has(target)) {
                originalNodesMap.current.set(target, newText);
              }
              processTextNode(target);
            }
          }
        } else if (target.nodeType === Node.ELEMENT_NODE) {
          walkAndTranslate(target);
        }
      }
    };

    const observer = new MutationObserver((mutations) => {
      if (isTranslatingRef.current) return;

      for (const mutation of mutations) {
        if (mutation.type === 'characterData' && mutation.target) {
          pendingNodes.add(mutation.target);
        } else if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((added) => {
            pendingNodes.add(added);
          });
        }
      }

      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(processPendingQueue, 20);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      clearTimeout(debounceTimer);
      clearTimeout(backupTimer1);
      clearTimeout(backupTimer2);
      clearTimeout(backupTimer3);
      observer.disconnect();
    };
  }, [language, isMounted]);

  const value = useMemo(
    () => ({ 
      language, 
      setLanguage, 
      toggleLanguage, 
      t, 
      isMounted,
      isEn: language === 'en',
      isVi: language === 'vi'
    }),
    [language, isMounted]
  );

  return (
    <LanguageContext.Provider value={value}>
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
