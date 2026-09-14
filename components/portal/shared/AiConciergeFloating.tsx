'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Sparkles, 
  Send, 
  X, 
  Minimize2, 
  Maximize2, 
  MessageSquare, 
  Mic, 
  CornerDownLeft, 
  HelpCircle,
  Clock,
  Shield,
  ThumbsUp,
  RefreshCw,
  Zap,
  Building
} from 'lucide-react';
import { User as UserType } from '@/lib/dataStore';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  suggestions?: string[];
  actionLink?: { label: string; moduleId: string };
}

interface AiConciergeFloatingProps {
  currentUser: UserType;
  isOpen: boolean;
  onToggle: () => void;
  onNavigateModule?: (moduleId: string) => void;
}

export default function AiConciergeFloating({
  currentUser,
  isOpen,
  onToggle,
  onNavigateModule
}: AiConciergeFloatingProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-1',
      sender: 'ai',
      text: `Dạ xin chào Quý cư dân ${currentUser?.full_name || 'Nguyễn Hữu Lực'} (Căn ${currentUser.apartment_code || '12A05'})! Tôi là Skyline AI Concierge. Tôi có thể hỗ trợ tra cứu quy định tòa nhà, dịch vụ tiện ích Sky Pool/Gym, hóa đơn, hoặc hỗ trợ báo sự cố kỹ thuật giúp bạn ạ!`,
      timestamp: '08:30',
      suggestions: [
        'Hồ bơi Sky Pool mở cửa mấy giờ?',
        'Hóa đơn tháng này của căn tôi?',
        'Cách cấp quyền FaceID cho người nhà',
        'Báo sửa ống nước khẩn cấp'
      ]
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // AI Knowledge Retrieval Logic (Google Gemini 2.5 Flash)
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isTyping) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
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
        aiReply = data.fallbackReply || data.error || 'Dạ, hệ thống đang bận. Quý cư dân vui lòng thử lại sau giây lát.';
      }

      let suggestions: string[] = [];
      let actionLink: { label: string; moduleId: string } | undefined = undefined;
      const lower = text.toLowerCase();

      if (lower.includes('hồ bơi') || lower.includes('pool') || lower.includes('gym') || lower.includes('tiện ích')) {
        actionLink = { label: 'Mở Thẻ Tiện Ích Sky Pool', moduleId: 'resident-facilities' };
        suggestions = ['Cách đặt chỗ sân Pickleball tầng 38', 'Hạn mức lượt sử dụng hồ bơi'];
      } else if (lower.includes('hóa đơn') || lower.includes('tiền') || lower.includes('nợ') || lower.includes('thanh toán')) {
        actionLink = { label: 'Xem Chi Tiết & Thanh Toán Hóa Đơn', moduleId: 'resident-finance' };
        suggestions = ['Biểu phí gửi xe ô tô, xe máy', 'Thanh toán trực tuyến'];
      } else if (lower.includes('sửa') || lower.includes('rò rỉ') || lower.includes('hỏng') || lower.includes('ống nước') || lower.includes('sự cố')) {
        actionLink = { label: 'Tạo Phiếu Kỹ Thuật (SLA 60p)', moduleId: 'resident-tickets' };
        suggestions = ['Tra cứu tiến độ sửa chữa', 'Gọi hotline kỹ thuật 1900 8899'];
      } else if (lower.includes('faceid') || lower.includes('người nhà') || lower.includes('cửa') || lower.includes('khóa')) {
        actionLink = { label: 'Quản Lý Cửa Thông Minh & Thẻ', moduleId: 'resident-home' };
        suggestions = ['Đăng ký FaceID cho người nhà', 'Tạo mã PIN khách tạm thời'];
      }

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: aiReply,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        suggestions,
        actionLink
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      console.error('Concierge floating error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: 'Không thể kết nối đến máy chủ AI. Quý cư dân vui lòng thử lại hoặc liên hệ Hotline BQL 1900 8899.',
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

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden select-none">
      {/* ------------------------------------------------------------- */}
      {/* 1. FLOATING ACTION TRIGGER BUTTON (When Closed)              */}
      {/* ------------------------------------------------------------- */}
      {!isOpen && (
        <div className="pointer-events-auto absolute bottom-5 right-5 flex items-center gap-2 transition-all duration-300 animate-fadeIn">
          {/* Tooltip Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#0D1117]/95 border border-[#C5A880]/70 text-[#C5A880] text-xs font-semibold shadow-2xl backdrop-blur-md rounded">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Hỏi Skyline AI</span>
          </div>

          {/* Luxury Circular AI Trigger Button */}
          <button
            type="button"
            onClick={onToggle}
            aria-label="Mở Trợ Lý Ảo Skyline AI"
            className="group relative w-12 h-12 bg-gradient-to-br from-[#1E2631] via-[#121820] to-[#0D1117] border-2 border-[#C5A880] text-[#C5A880] hover:text-white hover:border-white rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(197,168,128,0.35)] transition-all duration-300 transform hover:scale-105"
          >
            <Bot className="w-6 h-6 relative z-10 transition-transform group-hover:rotate-12" />
            <Sparkles className="w-3 h-3 text-amber-300 absolute top-1.5 right-1.5" />
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. EXPANDED FLOATING CHAT WINDOW (Expanding Animation)        */}
      {/* ------------------------------------------------------------- */}
      {isOpen && (
        <div className="pointer-events-auto absolute bottom-4 right-4 sm:bottom-5 sm:right-5 w-[380px] max-w-[calc(100vw-32px)] h-[540px] max-h-[82vh] bg-[#0D1117] border-2 border-[#C5A880] shadow-[0_15px_50px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden origin-bottom-right transition-all duration-300 ease-out transform scale-100 opacity-100 rounded">
          {/* Window Header */}
          <div className="p-3 bg-gradient-to-r from-[#161D26] via-[#121820] to-[#0D1117] border-b border-[#222B35] flex items-center justify-between text-white flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-7 h-7 rounded-full bg-[#1C2533] border border-[#C5A880] flex items-center justify-center text-[#C5A880]">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border border-[#0D1117]"></span>
              </div>

              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5 leading-tight">
                  <span>Skyline AI Concierge</span>
                  <span className="px-1.5 py-0.2 bg-[#C5A880] text-[#0D1117] text-[8px] font-mono font-bold uppercase rounded">
                    RAG v2.4
                  </span>
                </div>
                <div className="text-[10px] text-gray-400 font-light">
                  Trực tuyến 24/7 • Căn {currentUser.apartment_code || '12A05'}
                </div>
              </div>
            </div>

            {/* Header Controls */}
            <div className="flex items-center gap-1 text-gray-400">
              <button
                type="button"
                onClick={onToggle}
                className="p-1 hover:text-white hover:bg-[#1C2533] transition-colors rounded"
                title="Thu nhỏ thành icon"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={onToggle}
                className="p-1 hover:text-rose-400 hover:bg-rose-950/40 transition-colors rounded"
                title="Đóng"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Conversation Stream */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-[#0A0D12] text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'} space-y-1`}
              >
                <div
                  className={`max-w-[85%] p-3 text-xs leading-relaxed rounded ${
                    m.sender === 'user'
                      ? 'bg-[#C5A880] text-[#0D1117] font-medium shadow-md'
                      : 'bg-[#121820] border border-[#222B35] text-gray-200 shadow-inner'
                  }`}
                >
                  <p>{m.text}</p>

                  {/* Context Action Link (If Present) */}
                  {m.actionLink && (
                    <button
                      type="button"
                      onClick={() => handleActionClick(m.actionLink!.moduleId)}
                      className="mt-2.5 w-full py-1.5 px-3 bg-[#1C2533] hover:bg-[#C5A880] hover:text-[#0D1117] border border-[#C5A880] text-[#C5A880] font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors rounded"
                    >
                      <Zap className="w-3 h-3" /> {m.actionLink.label} →
                    </button>
                  )}
                </div>

                <span className="text-[9px] text-gray-500 font-mono px-1">
                  {m.timestamp}
                </span>

                {/* Quick Prompts Suggestions */}
                {m.suggestions && m.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1 max-w-[90%]">
                    {m.suggestions.map((sug, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendMessage(sug)}
                        className="text-[10px] px-2.5 py-1 bg-[#161B22] hover:bg-[#1C2533] border border-[#2D3748] hover:border-[#C5A880] text-gray-300 hover:text-[#C5A880] transition-colors rounded text-left"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* AI Typing Indicator */}
            {isTyping && (
              <div className="flex items-center gap-2 text-gray-400 text-[11px] p-2 bg-[#121820] border border-[#222B35] w-fit rounded">
                <RefreshCw className="w-3 h-3 animate-spin text-[#C5A880]" />
                <span className="font-mono">Skyline AI đang xử lý...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Controls */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-2.5 bg-[#0D1117] border-t border-[#222B35] flex items-center gap-2 flex-shrink-0"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Nhập câu hỏi..."
              className="flex-1 bg-[#161B22] border border-[#2D3748] p-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#C5A880] transition-colors rounded"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || isTyping}
              className={`p-2 border transition-all flex items-center justify-center rounded ${
                inputText.trim() && !isTyping
                  ? 'bg-[#C5A880] text-[#0D1117] border-[#C5A880] hover:bg-white shadow'
                  : 'bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed'
              }`}
              title="Gửi câu hỏi"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
