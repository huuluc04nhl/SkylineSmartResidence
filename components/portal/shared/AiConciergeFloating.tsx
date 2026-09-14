'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Sparkles, 
  Send, 
  X, 
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
  Info
} from 'lucide-react';
import { User as UserType } from '@/lib/dataStore';
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

function getDynamicSuggestions(userQuestion: string, aiResponse: string): string[] {
  const combined = (userQuestion + ' ' + aiResponse).toLowerCase();

  if (combined.includes('hồ bơi') || combined.includes('pool') || combined.includes('gym') || combined.includes('tiện ích') || combined.includes('pickleball') || combined.includes('tennis')) {
    return [
      '⏰ Giờ mở cửa Hồ bơi & Gym',
      '🏊 Quy định trang phục hồ bơi',
      '🏸 Cách đặt sân Pickleball tầng 38',
      '🎫 Hạn mức lượt dùng tiện ích'
    ];
  }

  if (combined.includes('hóa đơn') || combined.includes('tiền') || combined.includes('phí') || combined.includes('thanh toán') || combined.includes('nợ') || combined.includes('chuyển khoản')) {
    return [
      '🚗 Biểu phí gửi xe ô tô & xe máy',
      '💳 Hướng dẫn chuyển khoản BQL',
      '📅 Hạn đóng tiền dịch vụ hàng tháng',
      '📄 Tra cứu chi tiết tiền nước'
    ];
  }

  if (combined.includes('sửa') || combined.includes('hỏng') || combined.includes('rò rỉ') || combined.includes('kỹ thuật') || combined.includes('ống nước') || combined.includes('điện') || combined.includes('sự cố')) {
    return [
      '⏱️ Cam kết thợ hỗ trợ trong 60 phút',
      '📞 Hotline kỹ thuật khẩn cấp 1900 8899',
      '🔧 Đặt lịch thợ lên căn hộ',
      '🔊 Giờ thi công khoan đục cho phép'
    ];
  }

  if (combined.includes('cửa') || combined.includes('khóa') || combined.includes('faceid') || combined.includes('thẻ') || combined.includes('mã') || combined.includes('khuôn mặt') || combined.includes('chuông')) {
    return [
      '📷 Hướng dẫn cài FaceID mở cửa',
      '🔑 Tạo mã số tạm thời cho khách',
      '💳 Đăng ký hoặc báo mất thẻ cư dân',
      '🛡️ Cảnh báo chống cạy cửa'
    ];
  }

  return [
    '🏊 Tiện ích hồ bơi & phòng gym',
    '💳 Hóa đơn & Biểu phí tháng này',
    '🔧 Báo hỏng kỹ thuật khẩn cấp',
    '🔑 Hướng dẫn mở khóa cửa thông minh'
  ];
}

export default function AiConciergeFloating({
  currentUser,
  isOpen,
  onToggle,
  onNavigateModule,
}: AiConciergeFloatingProps) {
  const aptCode = currentUser.apartment_code || '12A05';
  const residentName = currentUser.full_name || (currentUser as any)?.fullname || 'Nguyễn Hữu Lực';

  // Window view state: 'normal' (420px) or 'expanded' (560px)
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-initial',
      sender: 'ai',
      text: `Kính chào Quý cư dân **${residentName}** (Căn **${aptCode}**)! 

Tôi là **Trợ lý ảo Skyline**, luôn đồng hành và hỗ trợ Quý vị 24/7. 

Tôi có thể giúp Quý cư dân:
* Tra cứu biểu phí quản lý tòa nhà, hóa đơn điện nước & phí gửi xe.
* Xem giờ mở cửa & hạn mức hồ bơi vô cực, phòng gym, sân pickleball.
* Tiếp nhận báo hỏng kỹ thuật với cam kết thợ có mặt hỗ trợ trong vòng 60 phút.
* Hướng dẫn mở cửa thông minh bằng khuôn mặt, thẻ cư dân hoặc mã số cho khách.

Quý cư dân có thể bấm vào các câu hỏi gợi ý bên dưới hoặc nhập câu hỏi trực tiếp nhé!`,
      timestamp: '08:00',
      suggestions: [
        '🏊 Giờ mở cửa Hồ bơi & Gym',
        '💳 Biểu phí quản lý & gửi xe tháng này',
        '🔑 Cách mở cửa bằng khuôn mặt & Thẻ',
        '🔧 Báo hỏng cần thợ hỗ trợ gấp'
      ]
    },
  ]);

  // Contextual Messenger-style Quick Replies from the latest AI response
  const latestAiMessage = [...messages].reverse().find((m) => m.sender === 'ai');
  const latestAiSuggestions = latestAiMessage?.suggestions || [];

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      // Focus textarea on open
      setTimeout(() => textareaRef.current?.focus(), 250);
    }
  }, [messages, isTyping, isOpen]);

  // Handle scroll listener to show scroll-to-bottom FAB
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    setShowScrollBottom(distanceFromBottom > 140);
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
        id: `m-${Date.now()}`,
        sender: 'ai',
        text: `Đoạn hội thoại đã được làm mới! Tôi sẵn sàng lắng nghe mọi yêu cầu tra cứu từ Quý cư dân ${residentName} (Căn ${aptCode}).`,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        suggestions: [
          'Biểu phí quản lý & gửi xe tháng này',
          'Giờ mở cửa Hồ bơi & Gym',
          'Sân Pickleball tầng 38',
          'Hotline Ban Quản Lý khẩn cấp'
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
      const response = await fetch('/api/ai/concierge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: historyPayload,
          aptCode,
        }),
      });

      const data = await response.json();
      let aiReply = '';
      if (response.ok && data.success && data.reply) {
        aiReply = data.reply;
      } else {
        aiReply = data.fallbackReply || data.error || 'Dạ, hệ thống đang bận. Quý cư dân vui lòng thử lại sau giây lát hoặc liên hệ Hotline BQL 1900 8899.';
      }

      // Contextual action link & smart dynamic suggestions (Messenger style)
      const suggestions = getDynamicSuggestions(text, aiReply);
      let actionLink: { label: string; moduleId: string } | undefined = undefined;
      const lower = (text + ' ' + aiReply).toLowerCase();

      if (lower.includes('hồ bơi') || lower.includes('pool') || lower.includes('gym') || lower.includes('tiện ích') || lower.includes('tennis') || lower.includes('pickleball')) {
        actionLink = { label: 'Mở Thẻ & Đặt Tiện Ích', moduleId: 'resident-facilities' };
      } else if (lower.includes('hóa đơn') || lower.includes('tiền') || lower.includes('nợ') || lower.includes('thanh toán') || lower.includes('phí')) {
        actionLink = { label: 'Xem & Thanh Toán Hóa Đơn', moduleId: 'resident-finance' };
      } else if (lower.includes('sửa') || lower.includes('rò rỉ') || lower.includes('hỏng') || lower.includes('ống nước') || lower.includes('sự cố') || lower.includes('kỹ thuật')) {
        actionLink = { label: 'Yêu Cầu Sửa Chữa (Hỗ Trợ Trong 60 Phút)', moduleId: 'resident-tickets' };
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

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden select-none">
      {/* ------------------------------------------------------------- */}
      {/* 1. FLOATING LUXURY TRIGGER BUTTON (When Closed)               */}
      {/* ------------------------------------------------------------- */}
      {!isOpen && (
        <div className="pointer-events-auto absolute bottom-6 right-6 flex items-center gap-3 transition-all duration-300">
          {/* Ambient Tooltip Pill (Borderless Sharp Glass) */}
          <button
            type="button"
            onClick={onToggle}
            className="hidden sm:flex items-center gap-2.5 px-4 py-2 bg-[#0E131B]/95 text-[#C5A880] text-xs font-medium shadow-[0_8px_30px_rgba(0,0,0,0.7)] backdrop-blur-xl rounded-none transition-all hover:bg-[#161F2C] hover:text-white group border-0"
          >
            <span className="w-2 h-2 rounded-none bg-emerald-400 animate-pulse"></span>
            <span className="group-hover:text-white transition-colors">Hỏi Skyline AI 24/7</span>
            <span className="px-2 py-0.5 bg-emerald-950/80 text-emerald-400 text-[9px] font-mono font-bold rounded-none border-0">
              24/7
            </span>
          </button>

          {/* Luxury Sharp AI Trigger Button (Borderless with Ambient Glow) */}
          <button
            type="button"
            onClick={onToggle}
            aria-label="Mở Trợ Lý Ảo Skyline AI"
            className="group relative w-14 h-14 bg-gradient-to-br from-[#222C3A] via-[#141B24] to-[#0A0E14] text-[#C5A880] hover:text-white rounded-none flex items-center justify-center transition-all duration-300 transform hover:scale-105 shadow-[0_12px_40px_rgba(0,0,0,0.85),0_0_24px_rgba(197,168,128,0.25)] border-0"
          >
            <Bot className="w-7 h-7 relative z-10 transition-transform group-hover:rotate-12 duration-200" />
            <Sparkles className="w-3.5 h-3.5 text-amber-300 absolute top-2 right-2 animate-bounce" />
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-none border-2 border-[#0A0E14] flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-none bg-white animate-ping"></span>
            </span>
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. EXPANDED FLOATING CHAT WINDOW (Borderless Sharp Luxury)    */}
      {/* ------------------------------------------------------------- */}
      {isOpen && (
        <div
          className={`pointer-events-auto absolute bottom-4 right-4 sm:bottom-6 sm:right-6 bg-[#0E131B]/98 shadow-[0_25px_70px_rgba(0,0,0,0.95),0_0_50px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden backdrop-blur-2xl origin-bottom-right transition-all duration-300 ease-out animate-in fade-in-0 zoom-in-95 rounded-none border-0 ${
            isExpanded
              ? 'w-[560px] max-w-[calc(100vw-32px)] h-[720px] max-h-[88vh]'
              : 'w-[420px] max-w-[calc(100vw-32px)] h-[580px] max-h-[82vh]'
          }`}
        >
          {/* Top Window Header - Seamless Luxury Surface */}
          <div className="p-4 bg-[#141B24] flex items-center justify-between text-white flex-shrink-0 border-0 rounded-none">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-none bg-gradient-to-tr from-[#C5A880]/20 to-[#C5A880]/35 flex items-center justify-center text-[#C5A880] shadow-sm border-0">
                  <Bot className="w-5 h-5" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-none border-2 border-[#141B24]"></span>
              </div>

              <div>
                <div className="text-sm font-serif font-bold text-white flex items-center gap-2 leading-tight">
                  <span>Skyline AI Concierge</span>
                  <span className="px-2 py-0.5 bg-emerald-950/80 text-emerald-400 text-[9px] font-mono font-bold uppercase rounded-none border-0">
                    Trực Tuyến
                  </span>
                </div>
                <div className="text-[11px] text-gray-400 font-light flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-none bg-emerald-400 animate-pulse"></span>
                  Hỗ trợ 24/7 • Căn <strong className="text-white font-mono">{aptCode}</strong>
                </div>
              </div>
            </div>

            {/* Header Control Buttons (Minimalist Ghost) */}
            <div className="flex items-center gap-1 text-gray-400">
              <button
                type="button"
                onClick={handleResetChat}
                className="p-2 hover:bg-white/10 text-gray-400 hover:text-white rounded-none transition-colors border-0"
                title="Làm mới cuộc trò chuyện"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="hidden sm:block p-2 hover:bg-white/10 text-gray-400 hover:text-white rounded-none transition-colors border-0"
                title={isExpanded ? 'Thu nhỏ cửa sổ' : 'Mở rộng toàn màn hình'}
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={onToggle}
                className="p-2 hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 rounded-none transition-colors border-0"
                title="Đóng cửa sổ chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Conversation Stream - Spacious & Clean (Messenger Style) */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#0A0E14] text-xs relative"
          >
            {/* Message Bubbles */}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'} space-y-1.5 animate-chat-bubble`}
              >
                <div
                  className={`relative ${
                    m.sender === 'user'
                      ? 'max-w-[85%] p-3.5 text-[13px] leading-relaxed rounded-none bg-gradient-to-r from-[#C5A880] to-[#B39366] text-[#0B0F15] font-medium shadow-md border-0'
                      : 'max-w-[88%] p-4 text-[13px] leading-relaxed rounded-none bg-[#141B24] text-gray-200 shadow-sm border-0 space-y-2'
                  }`}
                >
                  {/* Message Content */}
                  <AiMessageFormatter content={m.text} isUser={m.sender === 'user'} />

                  {/* Context Action Link (If Present) */}
                  {m.actionLink && (
                    <button
                      type="button"
                      onClick={() => handleActionClick(m.actionLink!.moduleId)}
                      className="mt-2.5 w-full py-2.5 px-4 bg-gradient-to-r from-[#C5A880] to-[#B59569] hover:from-white hover:to-white text-[#0B0F15] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all rounded-none shadow border-0"
                    >
                      <Zap className="w-3.5 h-3.5" /> {m.actionLink.label} →
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

                {/* Sub-suggestions */}
                {m.suggestions && m.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1 max-w-[90%]">
                    {m.suggestions.map((sug, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendMessage(sug)}
                        disabled={isTyping}
                        className="text-xs px-3.5 py-1.5 bg-[#16202D] hover:bg-[#212E40] text-gray-300 hover:text-[#C5A880] transition-colors rounded-none text-left flex items-center gap-1 border-0 shadow-sm"
                      >
                        <span>{sug}</span>
                        <ChevronRight className="w-2.5 h-2.5 text-[#C5A880]/60" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* AI Waveform Typing Indicator */}
            {isTyping && (
              <div className="flex items-center gap-3 p-3.5 bg-[#141B24] rounded-none w-fit animate-chat-bubble shadow-sm border-0">
                <div className="flex items-center gap-1 text-[#C5A880]">
                  <span className="w-2 h-2 rounded-none bg-[#C5A880] animate-typing-dot-1"></span>
                  <span className="w-2 h-2 rounded-none bg-amber-400 animate-typing-dot-2"></span>
                  <span className="w-2 h-2 rounded-none bg-emerald-400 animate-typing-dot-3"></span>
                </div>
                <span className="text-xs text-gray-300 font-mono">
                  Trợ lý Skyline đang tra cứu Sổ tay Cư dân...
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
              className="absolute bottom-20 right-6 z-10 px-3.5 py-1.5 bg-[#1C2533] hover:bg-[#C5A880] hover:text-[#0D1117] text-white text-xs font-semibold rounded-none shadow-2xl flex items-center gap-1.5 transition-all transform hover:scale-105 border-0"
            >
              <ArrowDown className="w-3 h-3" />
              <span>Tin nhắn mới</span>
            </button>
          )}

          {/* Messenger-style Contextual Quick Replies Drawer (Above Input) */}
          {latestAiSuggestions.length > 0 && !isTyping && (
            <div className="px-3.5 py-2 bg-[#101721] flex items-center gap-1.5 overflow-x-auto no-scrollbar border-0 rounded-none flex-shrink-0 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <span className="text-[10px] text-[#C5A880] uppercase font-bold flex items-center gap-1 flex-shrink-0 pr-1">
                <Sparkles className="w-3 h-3 text-[#C5A880]" /> Gợi ý:
              </span>
              {latestAiSuggestions.map((sug, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(sug)}
                  className="whitespace-nowrap px-3 py-1 bg-[#18212D] hover:bg-[#C5A880] hover:text-[#0D1117] text-gray-200 text-xs font-medium transition-all rounded-none border-0 shadow-sm flex items-center gap-1 flex-shrink-0"
                >
                  <span>{sug}</span>
                </button>
              ))}
            </div>
          )}

          {/* Input Footer - Modern Floating Capsule */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3.5 bg-[#0E131B] flex flex-col gap-2 flex-shrink-0 border-0 rounded-none"
          >
            <div className="flex items-end gap-2 bg-[#141B24] shadow-inner transition-colors p-2 pl-3 rounded-none border-0 focus-within:ring-1 focus-within:ring-[#C5A880]/40">
              <textarea
                ref={textareaRef}
                rows={1}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhập câu hỏi (Enter để gửi, Shift+Enter xuống dòng)..."
                disabled={isTyping}
                className="flex-1 bg-transparent text-xs text-white placeholder-gray-500 focus:outline-none resize-none max-h-24 leading-relaxed scrollbar-none py-1.5 rounded-none"
              />

              {inputText.trim() && (
                <button
                  type="button"
                  onClick={() => setInputText('')}
                  className="text-gray-500 hover:text-white p-1 mb-1 border-0 rounded-none"
                  title="Xóa chữ"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="submit"
                disabled={!inputText.trim() || isTyping}
                className={`w-9 h-9 rounded-none transition-all flex items-center justify-center font-bold flex-shrink-0 border-0 ${
                  inputText.trim() && !isTyping
                    ? 'bg-[#C5A880] text-[#0D1117] hover:bg-white shadow transform hover:scale-105 active:scale-95'
                    : 'bg-[#1A222F] text-gray-500 cursor-not-allowed'
                }`}
                title="Gửi tin nhắn"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            {/* Disclaimer & Shortcuts */}
            <div className="flex items-center justify-between text-[10px] text-gray-500 px-2">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                Bảo mật riêng tư 100% • Quy chế vận hành Skyline
              </span>
              <span className="hidden sm:inline text-[9px] font-mono text-gray-600">Enter ↵ để gửi</span>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
