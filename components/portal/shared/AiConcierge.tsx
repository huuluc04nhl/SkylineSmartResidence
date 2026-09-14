'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, UserCheck, PhoneCall, ChevronDown, Zap, ShieldCheck } from 'lucide-react';

interface ChatMessageItem {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  time: string;
  isError?: boolean;
}

export default function AiConcierge() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMsg, setInputMsg] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessageItem[]>([
    {
      id: '1',
      sender: 'ai',
      text: 'Kính chào Quý cư dân! Tôi là Trợ lý ảo Skyline AI Concierge 24/7 (vận hành bởi Google Gemini). Tôi sẵn sàng giải đáp mọi thắc mắc về nội quy, biểu phí, đăng ký xe, tiện ích hồ bơi/gym hoặc hệ thống khóa thông minh!',
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isTyping, isOpen]);

  const quickPrompts = [
    'Biểu phí quản lý & gửi xe tháng này',
    'Giờ mở cửa Hồ bơi & Gym',
    'Phòng xông hơi đá muối VIP',
    'Cách mở cửa Smart Door bằng FaceID & Thẻ NFC',
    'Hotline Ban Quản Lý khẩn cấp',
  ];

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputMsg).trim();
    if (!text || isTyping) return;

    const userMsgTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessageItem = {
      id: String(Date.now()),
      sender: 'user',
      text,
      time: userMsgTime,
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputMsg('');
    setIsTyping(true);

    // Prepare history for Gemini API
    const historyPayload = newMessages
      .filter((m) => !m.isError)
      .slice(-6)
      .map((m) => ({
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
          aptCode: '12A05',
          userName: 'Nguyễn Hữu Lực',
          userRole: 'OWNER',
        }),
      });

      const data = await response.json();

      let replyText = '';
      let isError = false;

      if (response.ok && data.success && data.reply) {
        replyText = data.reply;
      } else {
        replyText = data.fallbackReply || data.error || 'Hệ thống đang bận, Quý cư dân vui lòng thử lại sau giây lát.';
        isError = !data.success;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          sender: 'ai',
          text: replyText,
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          isError,
        },
      ]);
    } catch (err: any) {
      console.error('Concierge API error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          sender: 'ai',
          text: 'Không thể kết nối đến máy chủ AI. Quý cư dân vui lòng kiểm tra kết nối mạng hoặc liên hệ Hotline BQL 1900 8899.',
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          isError: true,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Robot FAB Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 p-3.5 bg-gradient-to-br from-[#242F3E] via-[#161F2C] to-[#0D1117] text-[#C5A880] shadow-[0_10px_35px_rgba(0,0,0,0.9),0_0_20px_rgba(197,168,128,0.2)] hover:text-white transition-all flex items-center gap-2 font-semibold text-xs uppercase tracking-wider group rounded-none border-0"
          title="Trợ lý ảo Skyline AI"
        >
          <div className="relative">
            <Bot className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-none bg-emerald-500 animate-ping"></span>
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-none bg-emerald-500"></span>
          </div>
          <span className="hidden sm:inline font-bold">Skyline AI</span>
          <span className="px-2 py-0.5 text-[9px] bg-emerald-950/80 text-emerald-400 font-mono font-bold tracking-normal rounded-none border-0">
            24/7
          </span>
        </button>
      )}

      {/* Bottom Sheet Drawer Modal */}
      {isOpen && (
        <div className="fixed inset-x-3 bottom-3 sm:inset-x-auto sm:right-6 sm:bottom-6 z-50 w-auto sm:w-full sm:max-w-md bg-[#0D1117]/98 text-white shadow-[0_25px_70px_rgba(0,0,0,0.95)] flex flex-col h-[520px] sm:h-[560px] animate-in fade-in slide-in-from-bottom-5 duration-200 rounded-none overflow-hidden border-0">
          {/* Header */}
          <div className="p-3.5 bg-gradient-to-r from-[#18212C] via-[#121820] to-[#0D1117] flex items-center justify-between border-0 rounded-none">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-[#242F3E] to-[#0D1117] flex items-center justify-center text-[#C5A880] shadow-inner rounded-none border-0">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="font-serif text-sm font-bold text-white flex items-center gap-1.5">
                  Skyline AI Concierge
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-none bg-emerald-950/80 text-[9px] text-emerald-400 font-sans font-medium border-0">
                    <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                    Trực Tuyến
                  </span>
                </div>
                <div className="text-[10px] text-gray-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-none bg-emerald-400 animate-pulse"></span>
                  Trợ lý thông minh căn hộ 24/7
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-gray-400 hover:text-white transition-colors rounded-none border-0"
                title="Đóng cửa sổ"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs bg-[#0A0D12] scroll-smooth">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[88%] p-3 text-xs space-y-1 rounded-none shadow-md border-0 ${
                    m.sender === 'user'
                      ? 'bg-[#C5A880] text-[#0D1117] font-medium'
                      : m.isError
                      ? 'bg-rose-950/45 text-rose-200'
                      : 'bg-[#161B22] text-gray-200'
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
                  <div
                    className={`text-[9px] text-right pt-1 ${
                      m.sender === 'user' ? 'text-[#0D1117]/70 font-semibold' : 'text-gray-500'
                    }`}
                  >
                    {m.time}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="p-3 bg-[#161E28] text-gray-300 text-[11px] flex items-center gap-2.5 rounded-none border-0 shadow">
                  <Sparkles className="w-4 h-4 text-[#C5A880] animate-spin" />
                  <span>Trợ lý Skyline đang tra cứu dữ liệu cư dân...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="p-2 bg-[#121820] flex items-center gap-2 overflow-x-auto no-scrollbar border-0 rounded-none">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt)}
                disabled={isTyping}
                className="whitespace-nowrap px-2.5 py-1.5 bg-[#161B22] hover:bg-[#1C2533] text-[10px] text-gray-300 hover:text-white transition-colors disabled:opacity-50 rounded-none border-0"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-[#121820] flex items-center gap-2 border-0 rounded-none"
          >
            <input
              type="text"
              placeholder="Nhập câu hỏi của Quý cư dân..."
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              disabled={isTyping}
              className="flex-1 bg-[#161B22] text-xs text-white px-3 py-2.5 focus:outline-none disabled:opacity-50 placeholder-gray-500 rounded-none border-0"
            />
            <button
              type="submit"
              disabled={!inputMsg.trim() || isTyping}
              className="p-2.5 bg-[#C5A880] text-[#0D1117] hover:bg-white transition-colors disabled:opacity-40 font-bold rounded-none border-0"
              title="Gửi câu hỏi"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
