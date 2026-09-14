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

const TOPIC_SUGGESTIONS = [
  {
    category: '🏊 Tiện ích',
    prompts: [
      'Giờ mở cửa Hồ bơi vô cực & Gym?',
      'Cách đặt sân Pickleball tầng 38',
      'Hạn mức lượt sử dụng tiện ích mỗi tháng',
    ],
  },
  {
    category: '💳 Biểu phí & Hóa đơn',
    prompts: [
      'Biểu phí quản lý & gửi xe ô tô, xe máy',
      'Hạn chót thanh toán hóa đơn hàng tháng',
      'Cách thanh toán hóa đơn qua chuyển khoản',
    ],
  },
  {
    category: '🔧 Kỹ thuật & Báo hỏng',
    prompts: [
      'Báo hỏng rò rỉ nước khẩn cấp (Hỗ trợ trong 60 phút)',
      'Bao lâu thì kỹ thuật viên có mặt hỗ trợ?',
      'Quy định thi công và khoan đục tiếng ồn',
    ],
  },
  {
    category: '🛡️ Khóa Cửa & An Toàn',
    prompts: [
      'Cách cài đặt nhận diện khuôn mặt mở cửa',
      'Tạo mã mở cửa tạm thời cho khách đến chơi',
      'Làm thế nào khi đánh rơi thẻ cư dân?',
    ],
  },
];

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
  const [activeCategory, setActiveCategory] = useState<string>('🏊 Tiện ích');

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
        'Giờ mở cửa Hồ bơi vô cực & Gym?',
        'Biểu phí quản lý & gửi xe tháng này',
        'Cách mở cửa bằng khuôn mặt & Thẻ cư dân',
        'Báo hỏng rò rỉ nước khẩn cấp (Hỗ trợ trong 60 phút)'
      ]
    },
  ]);

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
        }),
      });

      const data = await response.json();
      let aiReply = '';
      if (response.ok && data.success && data.reply) {
        aiReply = data.reply;
      } else {
        aiReply = data.fallbackReply || data.error || 'Dạ, hệ thống đang bận. Quý cư dân vui lòng thử lại sau giây lát hoặc liên hệ Hotline BQL 1900 8899.';
      }

      let suggestions: string[] = [];
      let actionLink: { label: string; moduleId: string } | undefined = undefined;
      const lower = text.toLowerCase();

      if (lower.includes('hồ bơi') || lower.includes('pool') || lower.includes('gym') || lower.includes('tiện ích') || lower.includes('tennis') || lower.includes('pickleball')) {
        actionLink = { label: 'Mở Thẻ & Đặt Tiện Ích', moduleId: 'resident-facilities' };
        suggestions = ['Hạn mức lượt sử dụng hồ bơi', 'Cách đặt chỗ sân Pickleball tầng 38', 'Giờ mở cửa phòng Gym'];
      } else if (lower.includes('hóa đơn') || lower.includes('tiền') || lower.includes('nợ') || lower.includes('thanh toán') || lower.includes('phí')) {
        actionLink = { label: 'Xem & Thanh Toán Hóa Đơn', moduleId: 'resident-finance' };
        suggestions = ['Biểu phí gửi xe ô tô, xe máy', 'Hạn chót thanh toán phí dịch vụ', 'Cách chuyển khoản'];
      } else if (lower.includes('sửa') || lower.includes('rò rỉ') || lower.includes('hỏng') || lower.includes('ống nước') || lower.includes('sự cố') || lower.includes('kỹ thuật')) {
        actionLink = { label: 'Yêu Cầu Sửa Chữa (Hỗ Trợ Trong 60 Phút)', moduleId: 'resident-tickets' };
        suggestions = ['Tra cứu tiến độ sửa chữa', 'Hotline kỹ thuật khẩn cấp 1900 8899'];
      } else if (lower.includes('faceid') || lower.includes('người nhà') || lower.includes('cửa') || lower.includes('khóa') || lower.includes('thẻ')) {
        actionLink = { label: 'Quản Lý Khóa Cửa & Thẻ Cư Dân', moduleId: 'resident-smarthome' };
        suggestions = ['Cài đặt nhận diện khuôn mặt', 'Tạo mã mở cửa cho khách', 'Khóa thẻ cư dân khi làm rơi'];
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
          {/* Ambient Tooltip Pill */}
          <button
            type="button"
            onClick={onToggle}
            className="hidden sm:flex items-center gap-2 px-3.5 py-2 bg-[#0D1117]/95 border border-[#C5A880]/70 text-[#C5A880] text-xs font-semibold shadow-2xl backdrop-blur-md rounded transition-all hover:bg-[#161B22] hover:border-[#C5A880] group"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="group-hover:text-white transition-colors">Hỏi Skyline AI 24/7</span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[9px] font-mono">
              Gemini 2.5
            </span>
          </button>

          {/* Luxury Circular AI Trigger Button with Ambient Aura */}
          <button
            type="button"
            onClick={onToggle}
            aria-label="Mở Trợ Lý Ảo Skyline AI"
            className="group relative w-14 h-14 bg-gradient-to-br from-[#1E2631] via-[#121820] to-[#0D1117] border-2 border-[#C5A880] text-[#C5A880] hover:text-white hover:border-white rounded-full flex items-center justify-center animate-pulse-aura transition-all duration-300 transform hover:scale-105 shadow-2xl"
          >
            <Bot className="w-7 h-7 relative z-10 transition-transform group-hover:rotate-12 duration-200" />
            <Sparkles className="w-3.5 h-3.5 text-amber-300 absolute top-2 right-2 animate-bounce" />
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#0D1117] flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
            </span>
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. EXPANDED FLOATING CHAT WINDOW (Ultra High-Tech Luxury)     */}
      {/* ------------------------------------------------------------- */}
      {isOpen && (
        <div
          className={`pointer-events-auto absolute bottom-4 right-4 sm:bottom-6 sm:right-6 bg-[#0D1117]/95 border border-[#C5A880]/70 shadow-[0_20px_60px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden backdrop-blur-xl origin-bottom-right transition-all duration-300 ease-out animate-in fade-in-0 zoom-in-95 rounded-sm ${
            isExpanded
              ? 'w-[560px] max-w-[calc(100vw-32px)] h-[720px] max-h-[88vh]'
              : 'w-[420px] max-w-[calc(100vw-32px)] h-[580px] max-h-[82vh]'
          }`}
        >
          {/* Top Window Header */}
          <div className="p-3.5 bg-gradient-to-r from-[#161D26] via-[#121820] to-[#0D1117] border-b border-[#222B35] flex items-center justify-between text-white flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1C2533] to-[#0D1117] border border-[#C5A880] flex items-center justify-center text-[#C5A880] shadow-inner">
                  <Bot className="w-5 h-5" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#0D1117]"></span>
              </div>

              <div>
                <div className="text-xs font-bold text-white flex items-center gap-2 leading-tight">
                  <span className="font-serif tracking-wide">Skyline AI Concierge</span>
                  <span className="px-1.5 py-0.5 bg-gradient-to-r from-amber-950 to-emerald-950 border border-amber-500/40 text-[#C5A880] text-[9px] font-mono font-bold uppercase rounded flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-[#C5A880]" /> Gemini 2.5
                  </span>
                </div>
                <div className="text-[10px] text-gray-400 font-light flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Trực tuyến 24/7 • Căn <strong className="text-white font-mono">{aptCode}</strong>
                </div>
              </div>
            </div>

            {/* Header Control Buttons */}
            <div className="flex items-center gap-1 text-gray-400">
              <button
                type="button"
                onClick={handleResetChat}
                className="p-1.5 hover:text-white hover:bg-[#1C2533] transition-colors rounded"
                title="Làm mới cuộc trò chuyện"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="hidden sm:block p-1.5 hover:text-white hover:bg-[#1C2533] transition-colors rounded"
                title={isExpanded ? 'Thu nhỏ cửa sổ' : 'Mở rộng toàn màn hình'}
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={onToggle}
                className="p-1.5 hover:text-rose-400 hover:bg-rose-950/40 transition-colors rounded"
                title="Đóng cửa sổ chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Category Chips Bar */}
          <div className="px-3 py-2 bg-[#121820] border-b border-[#222B35] flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-shrink-0">
            {TOPIC_SUGGESTIONS.map((topic, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveCategory(topic.category)}
                className={`whitespace-nowrap px-2.5 py-1 text-[10px] rounded transition-all flex items-center gap-1 ${
                  activeCategory === topic.category
                    ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow-sm'
                    : 'bg-[#161B22] hover:bg-[#1C2533] text-gray-300 border border-[#2D3748]'
                }`}
              >
                <span>{topic.category}</span>
              </button>
            ))}
          </div>

          {/* Conversation Stream */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#0A0D12] text-xs relative"
          >
            {/* Quick Prompts under Active Category */}
            <div className="p-2.5 bg-[#121820]/90 border border-[#222B35] rounded space-y-1.5 mb-2">
              <div className="text-[10px] uppercase font-bold text-[#C5A880] flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-[#C5A880]" /> Câu hỏi nhanh về {activeCategory}:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {TOPIC_SUGGESTIONS.find((t) => t.category === activeCategory)?.prompts.map((p, pIdx) => (
                  <button
                    key={pIdx}
                    type="button"
                    onClick={() => handleSendMessage(p)}
                    disabled={isTyping}
                    className="text-[10px] px-2.5 py-1 bg-[#161B22] hover:bg-[#1C2533] border border-[#2D3748] hover:border-[#C5A880] text-gray-300 hover:text-white transition-colors rounded text-left flex items-center gap-1"
                  >
                    <span>{p}</span>
                    <ChevronRight className="w-2.5 h-2.5 text-gray-500" />
                  </button>
                ))}
              </div>
            </div>

            {/* Message Bubbles */}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'} space-y-1 animate-chat-bubble`}
              >
                <div
                  className={`relative max-w-[88%] p-3.5 text-xs rounded shadow-md group ${
                    m.sender === 'user'
                      ? 'bg-[#C5A880] text-[#0D1117] font-medium rounded-tr-none'
                      : 'bg-[#161B22] border border-[#222B35] text-gray-200 rounded-tl-none space-y-2'
                  }`}
                >
                  {/* Message Content */}
                  <AiMessageFormatter content={m.text} isUser={m.sender === 'user'} />

                  {/* Context Action Link (If Present) */}
                  {m.actionLink && (
                    <button
                      type="button"
                      onClick={() => handleActionClick(m.actionLink!.moduleId)}
                      className="mt-2.5 w-full py-2 px-3.5 bg-[#1C2533] hover:bg-[#C5A880] hover:text-[#0D1117] border border-[#C5A880] text-[#C5A880] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors rounded shadow"
                    >
                      <Zap className="w-3.5 h-3.5" /> {m.actionLink.label} →
                    </button>
                  )}

                  {/* Copy Button (Only for AI messages) */}
                  {m.sender === 'ai' && (
                    <div className="pt-2 border-t border-[#222B35]/80 flex items-center justify-between text-[10px] text-gray-400">
                      <span className="font-mono text-[9px] text-gray-500">
                        {m.timestamp} • Gemini 2.5
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyMessage(m.id, m.text)}
                        className="hover:text-white flex items-center gap-1 px-1.5 py-0.5 hover:bg-[#1C2533] rounded transition-colors text-gray-400"
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
                        className="text-[10px] px-2.5 py-1 bg-[#121820] hover:bg-[#1C2533] border border-[#2D3748] hover:border-[#C5A880] text-gray-300 hover:text-[#C5A880] transition-colors rounded text-left flex items-center gap-1"
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
              <div className="flex items-center gap-3 p-3 bg-[#161B22] border border-[#222B35] rounded w-fit animate-chat-bubble shadow-md">
                <div className="flex items-center gap-1 text-[#C5A880]">
                  <span className="w-2 h-2 rounded-full bg-[#C5A880] animate-typing-dot-1"></span>
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-typing-dot-2"></span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-typing-dot-3"></span>
                </div>
                <span className="text-xs text-gray-300 font-mono">
                  Google Gemini 2.5 Flash đang tra cứu Sổ tay Cư dân...
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
              className="absolute bottom-20 right-6 z-10 px-3 py-1.5 bg-[#1C2533] hover:bg-[#C5A880] hover:text-[#0D1117] border border-[#C5A880] text-white text-[11px] font-semibold rounded-full shadow-2xl flex items-center gap-1.5 transition-all transform hover:scale-105"
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
            className="p-3 bg-[#0D1117] border-t border-[#222B35] flex flex-col gap-2 flex-shrink-0"
          >
            <div className="flex items-end gap-2 bg-[#161B22] border border-[#2D3748] focus-within:border-[#C5A880] transition-colors p-2 rounded">
              <textarea
                ref={textareaRef}
                rows={1}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhập câu hỏi (Enter để gửi, Shift+Enter xuống dòng)..."
                disabled={isTyping}
                className="flex-1 bg-transparent text-xs text-white placeholder-gray-500 focus:outline-none resize-none max-h-24 leading-relaxed scrollbar-none"
              />

              {inputText.trim() && (
                <button
                  type="button"
                  onClick={() => setInputText('')}
                  className="text-gray-500 hover:text-white p-1"
                  title="Xóa chữ"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="submit"
                disabled={!inputText.trim() || isTyping}
                className={`p-2 transition-all flex items-center justify-center rounded font-bold ${
                  inputText.trim() && !isTyping
                    ? 'bg-[#C5A880] text-[#0D1117] hover:bg-white shadow'
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                }`}
                title="Gửi tin nhắn"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            {/* Disclaimer & Shortcuts */}
            <div className="flex items-center justify-between text-[9px] text-gray-500 px-1 font-mono">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                Bảo mật riêng tư an toàn • Sổ tay hướng dẫn cư dân Skyline
              </span>
              <span className="hidden sm:inline">Phím tắt: Enter ↵</span>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
