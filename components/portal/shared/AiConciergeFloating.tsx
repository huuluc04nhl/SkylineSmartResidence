'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Sparkles, 
  Send, 
  X, 
  Minus,
  Minimize2, 
  Maximize2, 
  RefreshCw, 
  Zap, 
  Copy, 
  Check, 
  ArrowDown, 
  Waves, 
  CreditCard, 
  Wrench, 
  ShieldCheck, 
  PhoneCall,
  Flame,
  ChevronRight,
  ChevronUp,
  Eye,
  EyeOff,
  Info
} from 'lucide-react';
import { User as UserType } from '@/lib/dataStore';
import { getFacilityBookings } from '@/lib/facilityStore';
import { getBills } from '@/lib/billingStore';
import { getTickets } from '@/lib/ticketStore';
import { getAllVisitorPasses } from '@/lib/visitorStore';
import { getApartmentMembers } from '@/lib/userStore';
import AiMessageFormatter from './AiMessageFormatter';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  suggestions?: string[];
  actionLink?: { label: string; moduleId: string };
  isCopied?: boolean;
}

interface AiConciergeFloatingProps {
  currentUser: UserType;
  isOpen: boolean;
  onToggle: () => void;
  onNavigateModule?: (moduleId: string) => void;
}

function parseSuggestionsFromReply(rawReply: string): { cleanText: string; suggestions: string[] } {
  if (!rawReply) return { cleanText: '', suggestions: [] };
  const regex = /\[SUGGESTIONS:\s*([^\]]+)\]/i;
  const match = rawReply.match(regex);
  if (match) {
    const rawSuggestions = match[1];
    const suggestions = rawSuggestions
      .split('|')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    const cleanText = rawReply.replace(regex, '').trim();
    return { cleanText, suggestions };
  }
  return { cleanText: rawReply.trim(), suggestions: [] };
}

function getDynamicSuggestions(userQuestion: string, aiResponse: string): string[] {
  const combined = (userQuestion + ' ' + aiResponse).toLowerCase();

  // 1. Facilities requiring reservation / booking
  if (
    (combined.includes('tiện ích') || combined.includes('dịch vụ')) &&
    (combined.includes('đặt trước') || combined.includes('hẹn trước') || combined.includes('đăng ký') || combined.includes('giữ chỗ') || combined.includes('tính phí'))
  ) {
    return [
      '🧖 Bảng giá xông hơi VIP Tầng 3',
      '🍖 Đặt tiệc BBQ panoramic Tầng 25',
      '💳 Chính sách hủy & hoàn 100% cọc',
      '🏊 Tiện ích nào hoàn toàn miễn phí?'
    ];
  }

  // 2. Free / Open Access Facilities
  if (
    combined.includes('miễn phí') || 
    combined.includes('tự do') || 
    combined.includes('không cần đặt')
  ) {
    return [
      '⏰ Giờ mở cửa Hồ bơi Tầng 25',
      '🏋️ Phòng Gym Technogym 24/7',
      '🧖 Tiện ích nào cần đăng ký trước?',
      '🛝 Quy định khu vui chơi Sky Kids'
    ];
  }

  // 3. Scale, building floors, apartments per floor
  if (
    combined.includes('bao nhiêu tầng') || 
    combined.includes('bao nhiêu căn') || 
    combined.includes('quy mô') || 
    combined.includes('mỗi tầng') || 
    combined.includes('1 tầng') ||
    combined.includes('tòa') ||
    combined.includes('block') ||
    combined.includes('beverly solari') ||
    combined.includes('tropical') ||
    combined.includes('tầng hầm')
  ) {
    return [
      '🏢 Tòa BS-07, BS-08, BS-09, BS-10 bao nhiêu tầng?',
      '🏠 Căn hộ CH-06 và CH-01 diện tích bao nhiêu m²?',
      '🍽️ Nhà hàng tầng 1 mở cửa lúc mấy giờ?',
      '🏊 Bể bơi resort có cần đặt trước?'
    ];
  }

  // 4. General Facilities
  if (
    combined.includes('hồ bơi') || 
    combined.includes('pool') || 
    combined.includes('gym') || 
    combined.includes('technogym') || 
    combined.includes('tiện ích') || 
    combined.includes('xông hơi') || 
    combined.includes('sauna') || 
    combined.includes('bbq')
  ) {
    return [
      '🧖 Tiện ích nào cần hẹn trước?',
      '⏰ Giờ mở cửa Hồ bơi & Gym',
      '🍖 Bảng giá tiệc BBQ Tầng 25',
      '🎫 Kiểm tra vé tiện ích của tôi'
    ];
  }

  // 5. Bookings / Tickets
  if (
    combined.includes('lịch đặt') || 
    combined.includes('đã đặt') || 
    combined.includes('vé') || 
    combined.includes('mã vé') || 
    combined.includes('booking')
  ) {
    return [
      '🔄 Cách hủy vé & hoàn tiền cọc',
      '🍖 Đặt thêm ca nướng BBQ tầng 25',
      '🎟️ Kiểm tra thẻ khách thăm hôm nay',
      '🏊 Giờ mở cửa hồ bơi chân mây'
    ];
  }

  // 6. Visitors / Guest passes
  if (
    combined.includes('khách') || 
    combined.includes('visitor') || 
    combined.includes('thăm') || 
    combined.includes('mã pin') || 
    combined.includes('thẻ khách')
  ) {
    return [
      '📱 Tạo mã QR & PIN gửi khách',
      '🚗 Khách thăm đỗ xe ở đâu?',
      '🚪 Mở cửa căn hộ từ xa',
      '🔑 Tạo mã OTP mở khóa cửa'
    ];
  }

  // 7. Bills, Finance, Electricity, Water
  if (
    combined.includes('hóa đơn') || 
    combined.includes('tiền') || 
    combined.includes('phí') || 
    combined.includes('thanh toán') || 
    combined.includes('nước') || 
    combined.includes('điện') || 
    combined.includes('nợ')
  ) {
    return [
      '💧 Tiền điện nước tháng này của tôi?',
      '🔧 Tiến độ các phiếu sửa chữa',
      '🚗 Biểu phí gửi xe ô tô & xe máy',
      '💳 Hướng dẫn quét mã VietQR BQL'
    ];
  }

  // 8. Maintenance / Repair
  if (
    combined.includes('sửa') || 
    combined.includes('hỏng') || 
    combined.includes('rò rỉ') || 
    combined.includes('kỹ thuật') || 
    combined.includes('sự cố') || 
    combined.includes('thợ') || 
    combined.includes('phiếu')
  ) {
    return [
      '⏱️ KTV khi nào có mặt tại căn hộ?',
      '📞 Hotline kỹ thuật khẩn cấp 1900 8899',
      '🔧 Phiếu sửa chữa xử lý tới đâu?',
      '🔊 Giờ thi công khoan đục được phép'
    ];
  }

  // 9. Smart Door Lock / FaceID
  if (
    combined.includes('cửa') || 
    combined.includes('khóa') || 
    combined.includes('faceid') || 
    combined.includes('thẻ') || 
    combined.includes('chuông')
  ) {
    return [
      '📷 Cài FaceID cho người nhà',
      '🔑 Tạo mã tạm thời cho khách',
      '💳 Đăng ký hoặc báo mất thẻ cư dân',
      '🛡️ Cảnh báo chống cạy cửa thông minh'
    ];
  }

  // 10. Family members / Profile / Parking
  if (
    combined.includes('người nhà') || 
    combined.includes('thành viên') || 
    combined.includes('chủ hộ') || 
    combined.includes('xe') || 
    combined.includes('biển số')
  ) {
    return [
      '➕ Cách đăng ký thêm thành viên',
      '🚗 Vị trí đỗ xe ô tô cố định ở đâu?',
      '📷 Cài đặt nhận diện khuôn mặt FaceID',
      '💳 Biểu phí gửi xe hàng tháng'
    ];
  }

  // Default fallback suggestions
  return [
    '🏢 Quy mô các tòa The Tropical',
    '🏠 Thông tin căn hộ & diện tích của tôi',
    '🍽️ Dịch vụ nhà hàng & hồ bơi',
    '💳 Xem hóa đơn sinh hoạt tháng này'
  ];
}

export default function AiConciergeFloating({
  currentUser,
  isOpen,
  onToggle,
  onNavigateModule,
}: AiConciergeFloatingProps) {
  const aptCode = currentUser.apartment_code || 'CH-06';
  const residentName = currentUser.full_name || (currentUser as any)?.fullname || 'Trần Hữu Lực';

  // Window states:
  // - isMinimized: collapsed to sleek bottom dock bar (does NOT obscure screen)
  // - isExpanded: expanded wide view (540px)
  // - isPeeking: translucent peek mode (opacity-35 so background is visible)
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPeeking, setIsPeeking] = useState(false);

  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-initial',
      sender: 'ai',
      text: `Kính chào Quý cư dân **${residentName}** (Căn **${aptCode}** - BS-07 Tầng 30)! 

Tôi là **Trợ lý ảo Skyline**, túc trực 24/7 đồng hành cùng Quý cư dân tại The Tropical (Beverly Solari):
* 🏢 **Quy mô tòa nhà:** BS-07 (34T), BS-08 (39T), BS-09 (34T), BS-10 (34T).
* 🍽️ **Tiện ích 5 sao:** Cụm Bể bơi Resort, Nhà hàng T1, Gym 24/7 & Sauna VIP.
* 💳 **Hóa đơn:** Tra cứu tiền điện nước, phí quản lý & tiền gửi xe.
* 🛠️ **Hỗ trợ NKS:** Kỹ thuật viên túc trực có mặt sau 15 - 60 phút.

Quý cư dân có thể chọn câu hỏi gợi ý bên dưới hoặc nhắn tin trực tiếp!`,
      timestamp: '08:00',
      suggestions: [
        '🏢 Quy mô các tòa The Tropical',
        '🏠 Thông tin căn hộ của tôi',
        '🍽️ Dịch vụ nhà hàng & hồ bơi',
        '💳 Xem hóa đơn sinh hoạt tháng này'
      ]
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // When opened from parent, ensure minimized is reset to false
  useEffect(() => {
    if (isOpen) {
      setIsMinimized(false);
    }
  }, [isOpen]);

  // Auto focus input when window is open and not minimized
  useEffect(() => {
    if (isOpen && !isMinimized) {
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isMinimized]);

  // Global keyboard shortcut: Esc minimizes to dock (or closes if already minimized)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isOpen) {
          if (!isMinimized) {
            setIsMinimized(true);
          } else {
            onToggle();
          }
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen, isMinimized, onToggle]);

  // Auto scroll to bottom
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    scrollToBottom(false);
  }, [messages, isTyping]);

  // Monitor scroll to show jump-to-bottom button
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isFarFromBottom = scrollHeight - scrollTop - clientHeight > 100;
    setShowScrollBottom(isFarFromBottom);
  };

  // Copy message text to clipboard
  const handleCopyMessage = async (msgId: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(msgId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Reset conversation
  const handleResetChat = () => {
    setMessages([
      {
        id: 'm-initial',
        sender: 'ai',
        text: `Đoạn hội thoại đã được làm mới! Tôi sẵn sàng lắng nghe mọi yêu cầu tra cứu từ Quý cư dân ${residentName} (Căn ${aptCode} - Tòa BS-07, Tầng 30).`,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        suggestions: [
          '🏢 Quy mô các tòa The Tropical',
          '🏠 Thông tin căn hộ của tôi',
          '🍽️ Dịch vụ nhà hàng & hồ bơi',
          '💳 Xem hóa đơn sinh hoạt tháng này'
        ]
      }
    ]);
  };

  // Send message to Gemini API
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isTyping) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    const historyPayload = newMessages.slice(-6).map((m) => ({
      role: (m.sender === 'user' ? 'user' : 'model') as 'user' | 'model',
      text: m.text,
    }));

    try {
      const bookings = typeof window !== 'undefined' ? getFacilityBookings(aptCode) : [];
      const bills = typeof window !== 'undefined' ? getBills(aptCode) : [];
      const tickets = typeof window !== 'undefined' ? getTickets(aptCode) : [];
      const visitors = typeof window !== 'undefined' ? getAllVisitorPasses() : [];
      const members = typeof window !== 'undefined' ? getApartmentMembers(aptCode) : [];

      const response = await fetch('/api/ai/concierge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: historyPayload,
          aptCode,
          userName: residentName,
          userRole: currentUser?.role,
          phone: currentUser?.phone,
          licensePlate: currentUser?.license_plate,
          idCard: currentUser?.id_card_no,
          bookings,
          bills,
          tickets,
          visitors,
          members,
        }),
      });

      const data = await response.json();
      let aiReply = '';
      let suggestions: string[] = [];

      if (response.ok && data.success && data.reply) {
        aiReply = data.reply;
        if (data.suggestions && Array.isArray(data.suggestions) && data.suggestions.length > 0) {
          suggestions = data.suggestions;
        }
      } else {
        aiReply = data.fallbackReply || data.error || 'Dạ, hệ thống đang bận. Quý cư dân vui lòng thử lại sau giây lát hoặc liên hệ Hotline BQL 1900 8899.';
      }

      // If suggestions weren't supplied directly in data.suggestions, parse from text
      if (suggestions.length === 0) {
        const parsed = parseSuggestionsFromReply(aiReply);
        aiReply = parsed.cleanText;
        suggestions = parsed.suggestions.length > 0 ? parsed.suggestions : getDynamicSuggestions(text, aiReply);
      }

      // Contextual action link & smart dynamic suggestions
      let actionLink: { label: string; moduleId: string } | undefined = undefined;
      const lower = (text + ' ' + aiReply).toLowerCase();

      if (lower.includes('hồ bơi') || lower.includes('pool') || lower.includes('gym') || lower.includes('tiện ích') || lower.includes('tennis') || lower.includes('pickleball') || lower.includes('xông hơi') || lower.includes('sauna') || lower.includes('bbq') || lower.includes('vé')) {
        actionLink = { label: 'Mở Thẻ & Đặt Tiện Ích', moduleId: 'resident-facilities' };
      } else if (lower.includes('hóa đơn') || lower.includes('tiền') || lower.includes('nợ') || lower.includes('thanh toán') || lower.includes('phí')) {
        actionLink = { label: 'Xem & Thanh Toán Hóa Đơn', moduleId: 'resident-finance' };
      } else if (lower.includes('sửa') || lower.includes('rò rỉ') || lower.includes('hỏng') || lower.includes('ống nước') || lower.includes('sự cố') || lower.includes('kỹ thuật')) {
        actionLink = { label: 'Yêu Cầu Sửa Chữa (KTV Có Mặt Sau 15 - 60 Phút)', moduleId: 'resident-tickets' };
      } else if (lower.includes('faceid') || lower.includes('người nhà') || lower.includes('cửa') || lower.includes('khóa') || lower.includes('thẻ')) {
        actionLink = { label: 'Quản Lý Khóa Cửa & Thẻ Cư Dân', moduleId: 'resident-smarthome' };
      }

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: aiReply,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        suggestions,
        actionLink,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      console.error('Concierge floating error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: 'Không thể kết nối đến máy chủ AI. Quý cư dân vui lòng thử lại hoặc liên hệ Hotline BQL **1900 8899**.',
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleActionClick = (modId: string) => {
    if (onNavigateModule) {
      onNavigateModule(modId);
    }
  };

  // Keyboard shortcut: Enter to send, Shift+Enter for newline
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const latestMessage = messages[messages.length - 1];
  const latestSnippet = latestMessage 
    ? (latestMessage.sender === 'user' 
        ? `Bạn: ${latestMessage.text}` 
        : `AI: ${latestMessage.text.replace(/[*#_`]/g, '').trim().slice(0, 50)}...`)
    : `Sẵn sàng hỗ trợ Căn ${aptCode}`;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden select-none">
      {/* ------------------------------------------------------------- */}
      {/* 1. FLOATING LUXURY LAUNCHER (When completely Closed)          */}
      {/* ------------------------------------------------------------- */}
      {!isOpen && (
        <div className="pointer-events-auto absolute bottom-4 right-4 sm:bottom-6 sm:right-6 flex items-center gap-3 transition-all duration-300">
          {/* Ambient Tooltip Pill */}
          <button
            type="button"
            onClick={onToggle}
            className="hidden sm:flex items-center gap-2.5 px-4 py-2 bg-[#0E131B]/95 text-[#C5A880] text-xs font-medium shadow-[0_8px_30px_rgba(0,0,0,0.7)] backdrop-blur-xl rounded-none transition-all hover:bg-[#161F2C] hover:text-white group border border-[#C5A880]/20 active:scale-95"
          >
            <span className="w-2 h-2 rounded-none bg-emerald-400 animate-pulse"></span>
            <span className="group-hover:text-white transition-colors">Hỏi Skyline AI 24/7</span>
            <span className="px-2 py-0.5 bg-emerald-950/80 text-emerald-400 text-[9px] font-mono font-bold rounded-none border border-emerald-800/40">
              24/7
            </span>
          </button>

          {/* Luxury AI Trigger Button */}
          <button
            type="button"
            onClick={onToggle}
            aria-label="Mở Trợ Lý Ảo Skyline AI"
            className="group relative w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-[#222C3A] via-[#141B24] to-[#0A0E14] text-[#C5A880] hover:text-white rounded-none flex items-center justify-center transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-[0_12px_40px_rgba(0,0,0,0.85),0_0_24px_rgba(197,168,128,0.25)] border border-[#C5A880]/30"
          >
            <Bot className="w-6 h-6 sm:w-7 sm:h-7 relative z-10 transition-transform group-hover:rotate-12 duration-200" />
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-300 absolute top-1.5 right-1.5 sm:top-2 sm:right-2 animate-bounce" />
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-emerald-500 rounded-none border-2 border-[#0A0E14] flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-none bg-white animate-ping"></span>
            </span>
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. DOCKED MINI BAR (When Minimized: 0% screen obstruction)     */}
      {/* ------------------------------------------------------------- */}
      {isOpen && isMinimized && (
        <div className="pointer-events-auto absolute bottom-3 right-3 sm:bottom-6 sm:right-6 z-50 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div
            onClick={() => setIsMinimized(false)}
            role="button"
            tabIndex={0}
            title="Nhấn để mở lại cửa sổ chat (Esc)"
            className="group flex items-center gap-3 px-3.5 py-2.5 bg-[#0E131B]/95 hover:bg-[#151D28] border border-[#C5A880]/40 text-white shadow-[0_12px_40px_rgba(0,0,0,0.85),0_0_20px_rgba(197,168,128,0.15)] backdrop-blur-xl rounded-none transition-all duration-200 cursor-pointer w-[calc(100vw-24px)] sm:w-[380px] select-none"
          >
            <div className="relative flex-shrink-0">
              <div className="w-8 h-8 rounded-none bg-gradient-to-tr from-[#C5A880]/20 to-[#C5A880]/40 flex items-center justify-center text-[#C5A880] border border-[#C5A880]/30">
                <Bot className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-none border border-[#0E131B]"></span>
            </div>

            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white truncate font-serif">Skyline AI</span>
                {isTyping ? (
                  <span className="text-[9px] text-[#C5A880] animate-pulse font-mono font-medium">Đang trả lời...</span>
                ) : (
                  <span className="px-1.5 py-0.2 bg-emerald-950/80 text-emerald-400 text-[8px] font-mono font-bold uppercase rounded-none border border-emerald-800/40">
                    Trực tuyến
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-400 truncate font-light mt-0.5">
                {latestSnippet}
              </p>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setIsMinimized(false)}
                className="p-1.5 hover:bg-white/10 text-[#C5A880] hover:text-white rounded-none transition-colors border-0"
                title="Mở rộng chatbox"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onToggle}
                className="p-1.5 hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 rounded-none transition-colors border-0"
                title="Đóng hẳn"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. ACTIVE CHAT WINDOW (Compact, Non-Intrusive, Peek-Capable)   */}
      {/* ------------------------------------------------------------- */}
      {isOpen && !isMinimized && (
        <div
          className={`pointer-events-auto absolute bottom-2 right-2 sm:bottom-6 sm:right-6 bg-[#0E131B]/95 shadow-[0_20px_60px_rgba(0,0,0,0.95),0_0_30px_rgba(197,168,128,0.12)] border border-[#C5A880]/30 flex flex-col overflow-hidden backdrop-blur-2xl origin-bottom-right transition-all duration-300 ease-out animate-in fade-in-0 zoom-in-95 rounded-none ${
            isPeeking 
              ? 'opacity-35 hover:opacity-100' 
              : 'opacity-100'
          } ${
            isExpanded
              ? 'w-[540px] max-w-[calc(100vw-16px)] sm:max-w-[calc(100vw-32px)] h-[min(680px,88dvh)]'
              : 'w-[375px] sm:w-[395px] max-w-[calc(100vw-16px)] sm:max-w-[calc(100vw-32px)] h-[min(510px,80dvh)]'
          }`}
        >
          {/* Top Window Header */}
          <div className="px-3.5 py-3 bg-[#141B24] border-b border-[#C5A880]/20 flex items-center justify-between text-white flex-shrink-0 rounded-none">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-9 h-9 rounded-none bg-gradient-to-tr from-[#C5A880]/20 to-[#C5A880]/35 flex items-center justify-center text-[#C5A880] border border-[#C5A880]/30 shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-none border border-[#141B24]"></span>
              </div>

              <div>
                <div className="text-xs font-serif font-bold text-white flex items-center gap-1.5 leading-tight">
                  <span>Skyline AI Concierge</span>
                  <span className="px-1.5 py-0.2 bg-emerald-950/80 text-emerald-400 text-[8px] font-mono font-bold uppercase rounded-none border border-emerald-800/40">
                    24/7
                  </span>
                </div>
                <div className="text-[10px] text-gray-400 font-light flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-none bg-emerald-400 animate-pulse"></span>
                  Căn <strong className="text-white font-mono">{aptCode}</strong> • Tòa BS-07
                </div>
              </div>
            </div>

            {/* Header Control Actions */}
            <div className="flex items-center gap-0.5 text-gray-400">
              {/* Peek / Translucency Mode */}
              <button
                type="button"
                onClick={() => setIsPeeking(!isPeeking)}
                className={`p-1.5 rounded-none transition-colors border-0 ${
                  isPeeking 
                    ? 'bg-[#C5A880]/25 text-[#C5A880]' 
                    : 'hover:bg-white/10 text-gray-400 hover:text-white'
                }`}
                title={isPeeking ? 'Tắt nhìn xuyên (Hiện rõ)' : 'Nhìn xuyên (Giảm độ che khuất màn hình)'}
              >
                {isPeeking ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>

              {/* Minimize to dock bar */}
              <button
                type="button"
                onClick={() => setIsMinimized(true)}
                className="p-1.5 hover:bg-white/10 text-gray-400 hover:text-white rounded-none transition-colors border-0"
                title="Thu nhỏ thành thanh dock (Esc)"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              {/* Expand / Compact size */}
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="hidden sm:block p-1.5 hover:bg-white/10 text-gray-400 hover:text-white rounded-none transition-colors border-0"
                title={isExpanded ? 'Kích thước tiêu chuẩn' : 'Mở rộng cửa sổ'}
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>

              {/* Reset Conversation */}
              <button
                type="button"
                onClick={handleResetChat}
                className="p-1.5 hover:bg-white/10 text-gray-400 hover:text-white rounded-none transition-colors border-0"
                title="Làm mới cuộc trò chuyện"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>

              {/* Close */}
              <button
                type="button"
                onClick={onToggle}
                className="p-1.5 hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 rounded-none transition-colors border-0"
                title="Đóng cửa sổ (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Conversation Stream */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 p-3.5 overflow-y-auto space-y-3.5 bg-[#0A0E14] text-xs relative"
          >
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'} space-y-1.5 animate-chat-bubble`}
              >
                <div
                  className={`relative ${
                    m.sender === 'user'
                      ? 'max-w-[85%] p-3 text-[12.5px] leading-relaxed rounded-none bg-gradient-to-r from-[#C5A880] to-[#B39366] text-[#0B0F15] font-medium shadow-md border-0'
                      : 'max-w-[90%] p-3.5 text-[12.5px] leading-relaxed rounded-none bg-[#141B24] text-gray-200 border border-[#C5A880]/15 shadow-sm space-y-2'
                  }`}
                >
                  {/* Message Content */}
                  <AiMessageFormatter content={m.text} isUser={m.sender === 'user'} />

                  {/* Context Action Link */}
                  {m.actionLink && (
                    <button
                      type="button"
                      onClick={() => handleActionClick(m.actionLink!.moduleId)}
                      className="mt-2 w-full py-2 px-3 bg-gradient-to-r from-[#C5A880] to-[#B59569] hover:from-white hover:to-white text-[#0B0F15] font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all rounded-none shadow border-0"
                    >
                      <Zap className="w-3 h-3" /> {m.actionLink.label} →
                    </button>
                  )}

                  {/* Copy Button (Only for AI messages) */}
                  {m.sender === 'ai' && (
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-400">
                      <span className="font-mono text-[9px] text-gray-500">
                        {m.timestamp} • Trợ lý Skyline
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyMessage(m.id, m.text)}
                        className="hover:text-white flex items-center gap-1 px-2 py-0.5 hover:bg-white/5 rounded-none transition-colors text-gray-400 border-0"
                        title="Sao chép nội dung câu trả lời"
                      >
                        {copiedMessageId === m.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400 text-[9px]">Đã chép</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span className="text-[9px]">Sao chép</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {m.sender === 'user' && (
                  <span className="text-[9px] text-gray-500 font-mono px-1">
                    {m.timestamp}
                  </span>
                )}

                {/* Horizontal Scrollable Quick Suggestions (Saves massive vertical space) */}
                {m.suggestions && m.suggestions.length > 0 && (
                  <div className="w-full max-w-full pt-1 animate-in fade-in duration-200">
                    <div className="flex items-center gap-1 text-[10px] text-[#C5A880] font-medium mb-1 px-0.5">
                      <Sparkles className="w-2.5 h-2.5 text-[#C5A880]" />
                      <span>Gợi ý câu hỏi nhanh:</span>
                    </div>
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 scroll-smooth max-w-full">
                      {m.suggestions.map((sug, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSendMessage(sug)}
                          disabled={isTyping}
                          className="text-[11px] px-2.5 py-1 bg-[#16202D] hover:bg-[#223042] text-gray-300 hover:text-[#C5A880] transition-all rounded-none whitespace-nowrap flex items-center gap-1.5 border border-[#C5A880]/20 hover:border-[#C5A880]/50 shadow-sm flex-shrink-0 group active:scale-95"
                        >
                          <span>{sug}</span>
                          <ChevronRight className="w-2.5 h-2.5 text-[#C5A880]/70 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* AI Typing Indicator */}
            {isTyping && (
              <div className="flex items-center gap-2.5 p-2.5 bg-[#141B24] border border-[#C5A880]/20 rounded-none w-fit animate-chat-bubble shadow-sm">
                <div className="flex items-center gap-1 text-[#C5A880]">
                  <span className="w-1.5 h-1.5 rounded-none bg-[#C5A880] animate-typing-dot-1"></span>
                  <span className="w-1.5 h-1.5 rounded-none bg-amber-400 animate-typing-dot-2"></span>
                  <span className="w-1.5 h-1.5 rounded-none bg-emerald-400 animate-typing-dot-3"></span>
                </div>
                <span className="text-[11px] text-gray-300 font-mono">
                  Trợ lý Skyline đang tra cứu...
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Floating Jump to Bottom Button */}
          {showScrollBottom && (
            <button
              type="button"
              onClick={() => scrollToBottom()}
              className="absolute bottom-20 right-5 z-10 px-3 py-1 bg-[#1C2533] hover:bg-[#C5A880] hover:text-[#0D1117] text-white text-[11px] font-semibold rounded-none shadow-2xl flex items-center gap-1.5 transition-all transform hover:scale-105 border border-[#C5A880]/30"
            >
              <ArrowDown className="w-3 h-3" />
              <span>Tin nhắn mới</span>
            </button>
          )}

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-[#0E131B] border-t border-[#C5A880]/20 flex flex-col gap-1.5 flex-shrink-0 rounded-none"
          >
            <div className="flex items-end gap-2 bg-[#141B24] border border-[#C5A880]/25 shadow-inner transition-colors p-2 pl-2.5 rounded-none focus-within:border-[#C5A880]/70">
              <textarea
                ref={textareaRef}
                rows={1}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhập câu hỏi (Enter để gửi, Shift+Enter xuống dòng)..."
                disabled={isTyping}
                className="flex-1 bg-transparent text-xs text-white placeholder-gray-500 focus:outline-none resize-none max-h-20 leading-relaxed scrollbar-none py-1 rounded-none"
              />

              {inputText.trim() && (
                <button
                  type="button"
                  onClick={() => setInputText('')}
                  className="text-gray-500 hover:text-white p-1 mb-0.5 border-0 rounded-none"
                  title="Xóa nội dung nhập"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="submit"
                disabled={!inputText.trim() || isTyping}
                className={`w-8 h-8 rounded-none transition-all flex items-center justify-center font-bold flex-shrink-0 border-0 ${
                  inputText.trim() && !isTyping
                    ? 'bg-[#C5A880] text-[#0D1117] hover:bg-white shadow transform hover:scale-105 active:scale-95'
                    : 'bg-[#1A222F] text-gray-500 cursor-not-allowed'
                }`}
                title="Gửi câu hỏi"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Interaction Tips & Shortcuts */}
            <div className="flex items-center justify-between text-[9.5px] text-gray-500 px-1">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                Bảo mật dữ liệu cư dân 100%
              </span>
              <span className="hidden sm:inline text-[9px] font-mono text-gray-500">
                Esc: Thu nhỏ • Enter ↵ gửi
              </span>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
