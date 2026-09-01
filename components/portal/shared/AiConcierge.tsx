'use client';

import React, { useState } from 'react';
import { Bot, X, Send, Sparkles, UserCheck, PhoneCall, ChevronDown } from 'lucide-react';

export default function AiConcierge() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMsg, setInputMsg] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: '1',
      sender: 'ai',
      text: 'Kính chào Quý cư dân! Tôi là Trợ lý ảo Skyline AI Concierge 24/7. Tôi có thể giúp gì cho Quý vị về nội quy, biểu phí, đăng ký xe hoặc đặt tiện ích?',
      time: '18:10',
    },
  ]);

  const quickPrompts = [
    'Biểu phí quản lý tháng 08/2026',
    'Quy định giờ mở cửa Hồ bơi vô cực',
    'Thủ tục đăng ký vé gửi xe ô tô',
    'Gặp trực tiếp Lễ tân tòa nhà',
  ];

  const handleSend = (textToSend?: string) => {
    const text = textToSend || inputMsg;
    if (!text.trim()) return;

    const userMsg = {
      id: String(Date.now()),
      sender: 'user',
      text: text,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMsg('');
    setIsTyping(true);

    // AI RAG Response simulation
    setTimeout(() => {
      let replyText = 'Tôi đã tra cứu trong Sổ tay cư dân SKYLINE. Yêu cầu của bạn đã được ghi nhận.';
      if (text.includes('phí') || text.includes('hóa đơn')) {
        replyText = 'Theo biểu phí chuẩn: Phí quản lý là 10.000 đ/m² thông thủy, Nước sinh hoạt 18.000 đ/m³, Xe ô tô 1.400.000 đ/tháng. Hóa đơn tháng 08 của bạn có hạn thanh toán đến 30/08.';
      } else if (text.includes('Hồ bơi') || text.includes('giờ')) {
        replyText = 'Hồ bơi vô cực Skyline Horizon Pool mở cửa hàng ngày từ 06:00 - 21:00. Mỗi căn hộ được miễn phí 20 lượt/tháng.';
      } else if (text.includes('Lễ tân')) {
        replyText = 'Đang kết nối đoạn chat này tới màn hình làm việc của Lễ tân trực ca tại Sảnh Tháp A. Lễ tân sẽ phản hồi bạn trong 30 giây!';
      }

      setMessages(prev => [
        ...prev,
        {
          id: String(Date.now() + 1),
          sender: 'ai',
          text: replyText,
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <>
      {/* Floating Robot FAB Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 p-3.5 bg-[#0D1117] border-2 border-[#C5A880] text-[#C5A880] shadow-2xl hover:bg-[#C5A880] hover:text-[#0D1117] transition-all flex items-center gap-2 font-semibold text-xs uppercase tracking-wider"
          title="Trợ lý ảo Skyline AI"
        >
          <Bot className="w-5 h-5" />
          <span className="hidden sm:inline">Skyline AI Concierge</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        </button>
      )}

      {/* Bottom Sheet Drawer Modal */}
      {isOpen && (
        <div className="fixed inset-x-3 bottom-3 sm:inset-x-auto sm:right-6 sm:bottom-6 z-50 w-auto sm:w-full sm:max-w-md bg-[#0D1117] border border-[#C5A880] text-white shadow-2xl flex flex-col h-[480px] sm:h-[520px]">
          {/* Header */}
          <div className="p-4 bg-[#121820] border-b border-[#222B35] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#1C2533] border border-[#C5A880] flex items-center justify-center text-[#C5A880]">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="font-serif text-sm font-bold text-white flex items-center gap-1.5">
                  Skyline AI Concierge <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                </div>
                <div className="text-[10px] text-gray-400 font-light">Tự động trả lời qua RAG Sổ tay cư dân</div>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs bg-[#0A0E14]">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3 text-xs space-y-1 ${
                    m.sender === 'user'
                      ? 'bg-[#C5A880] text-[#0D1117] font-medium'
                      : 'bg-[#161B22] border border-[#222B35] text-gray-200'
                  }`}
                >
                  <p className="leading-relaxed">{m.text}</p>
                  <div className={`text-[9px] text-right ${m.sender === 'user' ? 'text-[#0D1117]/70' : 'text-gray-500'}`}>
                    {m.time}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="p-2.5 bg-[#161B22] border border-[#222B35] text-gray-400 text-[11px] flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#C5A880] animate-spin" />
                  <span>AI đang tra cứu Sổ tay tòa nhà...</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Prompts */}
          <div className="p-2.5 bg-[#121820] border-t border-[#222B35] flex items-center gap-2 overflow-x-auto">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt)}
                className="whitespace-nowrap px-2.5 py-1 bg-[#161B22] hover:bg-[#1C2533] border border-gray-700 hover:border-[#C5A880] text-[10px] text-gray-300 transition-colors"
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
            className="p-3 bg-[#121820] border-t border-[#222B35] flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Nhập câu hỏi của bạn..."
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              className="flex-1 bg-[#161B22] border border-[#2D3748] text-xs text-white px-3 py-2 focus:outline-none focus:border-[#C5A880]"
            />
            <button
              type="submit"
              className="p-2 bg-[#C5A880] text-[#0D1117] hover:bg-white transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
