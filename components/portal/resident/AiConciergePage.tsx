'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Sparkles, 
  Send, 
  RefreshCw, 
  Zap, 
  Building, 
  CreditCard, 
  ShieldCheck, 
  Wrench, 
  Waves, 
  Cpu, 
  MessageSquare, 
  FileText, 
  CheckCircle2,
  Clock,
  ChevronRight,
  HelpCircle,
  ThumbsUp,
  Share2,
  Bookmark,
  Copy,
  Check
} from 'lucide-react';
import { User as UserType } from '@/lib/dataStore';
import AiMessageFormatter from '@/components/portal/shared/AiMessageFormatter';

interface AiMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  ragSource?: string;
  suggestions?: string[];
  actionButton?: { label: string; moduleId: string };
}

interface AiConciergePageProps {
  currentUser: UserType;
  onNavigateModule?: (moduleId: string) => void;
}

const KNOWLEDGE_CATEGORIES = [
  {
    category: '🏊 Tiện Ích Hồ Bơi & Phòng Gym',
    prompts: [
      'Hồ bơi vô cực mở cửa từ mấy giờ đến mấy giờ?',
      'Cách đăng ký sử dụng tiện ích trên ứng dụng',
      'Hạn mức số lượt sử dụng hồ bơi miễn phí mỗi tháng',
    ]
  },
  {
    category: '💳 Hóa Đơn & Tiền Điện Nước Sinh Hoạt',
    prompts: [
      'Xem hóa đơn sinh hoạt tháng này của căn hộ',
      'Cảnh báo lưu lượng nước ban đêm nghĩa là gì?',
      'Hướng dẫn các hình thức thanh toán phí tiện lợi',
    ]
  },
  {
    category: '🔧 Báo Hỏng & Hỗ Trợ Kỹ Thuật Nhanh',
    prompts: [
      'Báo hỏng rò rỉ nước khẩn cấp cần thợ lên ngay',
      'Bao lâu thì kỹ thuật viên có mặt tại căn hộ?',
      'Quy định về thời gian thi công, khoan đục',
    ]
  },
  {
    category: '🛡️ Cửa Thông Minh & An Toàn Căn Hộ',
    prompts: [
      'Cách cài đặt nhận diện khuôn mặt cho người thân',
      'Thủ tục đăng ký vé gửi xe ô tô tại tầng hầm',
      'Cách tạo mã đón bạn bè lên chơi căn hộ',
    ]
  }
];

export default function AiConciergePage({ currentUser, onNavigateModule }: AiConciergePageProps) {
  const aptCode = currentUser.apartment_code || '12A05';
  const residentName = currentUser.full_name || (currentUser as any)?.fullname || 'Nguyễn Hữu Lực';

  const [messages, setMessages] = useState<AiMessage[]>([
    {
      id: 'm-0',
      sender: 'ai',
      text: `Kính chào Quý cư dân **${residentName}** (Căn **${aptCode}**)! 

Tôi là **Trợ lý ảo Skyline**, luôn sẵn sàng hỗ trợ Quý vị tra cứu thông tin tòa nhà, xem lịch hoạt động của hồ bơi, phòng gym, giải đáp biểu phí sinh hoạt hoặc tiếp nhận các yêu cầu kỹ thuật khẩn cấp bất cứ lúc nào ạ!`,
      timestamp: '08:00',
      ragSource: 'Sổ tay hướng dẫn cư dân Skyline Smart Residence',
      suggestions: [
        'Hồ bơi vô cực mở cửa từ mấy giờ đến mấy giờ?',
        'Xem hóa đơn sinh hoạt tháng này của căn hộ',
        'Cách cài đặt nhận diện khuôn mặt cho người thân',
        'Báo hỏng rò rỉ nước khẩn cấp cần thợ lên ngay'
      ]
    }
  ]);

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleCopyMessage = async (msgId: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(msgId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isTyping) return;

    const userMsg: AiMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    // Prepare history for Gemini API
    const historyPayload = newMessages.slice(-6).map((m) => ({
      role: (m.sender === 'user' ? 'user' : 'model') as 'user' | 'model',
      text: m.text,
    }));

    try {
      const response = await fetch('/api/ai/concierge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
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

      // Contextual action button & suggestions based on query
      let actionButton: { label: string; moduleId: string } | undefined = undefined;
      let suggestions: string[] = [];
      const lower = query.toLowerCase();

      if (lower.includes('hồ bơi') || lower.includes('pool') || lower.includes('gym') || lower.includes('tiện ích') || lower.includes('tennis') || lower.includes('pickleball')) {
        actionButton = { label: 'Mở Thẻ & Đăng Ký Tiện Ích', moduleId: 'resident-facilities' };
        suggestions = ['Giờ mở cửa Hồ bơi vô cực?', 'Đặt sân Pickleball tầng 38', 'Hạn mức lượt sử dụng tiện ích'];
      } else if (lower.includes('hóa đơn') || lower.includes('tiền') || lower.includes('nước') || lower.includes('thanh toán') || lower.includes('phí')) {
        actionButton = { label: 'Xem & Thanh Toán Hóa Đơn', moduleId: 'resident-finance' };
        suggestions = ['Biểu phí gửi xe ô tô, xe máy', 'Hạn thanh toán phí dịch vụ hàng tháng', 'Cách thanh toán chuyển khoản'];
      } else if (lower.includes('sửa') || lower.includes('hỏng') || lower.includes('kỹ thuật') || lower.includes('sự cố')) {
        actionButton = { label: 'Yêu Cầu Hỗ Trợ Kỹ Thuật (Hỗ Trợ Trong 60 Phút)', moduleId: 'resident-tickets' };
        suggestions = ['Thời gian kỹ thuật viên có mặt?', 'Hotline hỗ trợ kỹ thuật tòa nhà'];
      } else if (lower.includes('faceid') || lower.includes('cửa') || lower.includes('thẻ') || lower.includes('người nhà') || lower.includes('khóa')) {
        actionButton = { label: 'Quản Lý Khóa Cửa & Thẻ Cư Dân', moduleId: 'resident-smarthome' };
        suggestions = ['Cách cài đặt nhận diện khuôn mặt', 'Thêm thành viên căn hộ', 'Tạo mã số cho khách'];
      }

      const aiMsg: AiMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: aiReply,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        ragSource: 'Sổ tay hướng dẫn cư dân Skyline Smart Residence',
        actionButton,
        suggestions,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      console.error('Error sending query to Gemini:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: 'Không thể kết nối đến máy chủ AI. Quý cư dân vui lòng kiểm tra kết nối hoặc liên hệ Hotline BQL 1900 8899.',
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          ragSource: 'Sổ tay cư dân',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleAction = (modId: string) => {
    if (onNavigateModule) {
      onNavigateModule(modId);
    }
  };

  return (
    <div className="space-y-6 w-full animate-fadeIn select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222B35] pb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-semibold flex items-center gap-1.5">
            <Bot className="w-4 h-4 text-[#C5A880]" /> Trợ Lý Ảo Thông Minh • Phục Vụ Cư Dân 24/7
          </div>
          <h2 className="font-serif text-2xl text-white font-bold mt-1 flex items-center gap-2.5">
            Trợ Lý Ảo Skyline AI Concierge 24/7
            <span className="px-2 py-0.5 bg-[#C5A880] text-[#0D1117] text-[10px] font-mono font-bold uppercase rounded">
              AI Assistant
            </span>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Hỗ trợ tra cứu quy định tòa nhà, phân tích rò rỉ hóa đơn, đặt lịch tiện ích và giải đáp thắc mắc cho Căn <strong className="text-white font-mono">{aptCode}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-[#121820] border border-emerald-500/80 text-emerald-300 text-xs font-mono font-bold flex items-center gap-1.5 shadow">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Hệ Thống Trực Tuyến 24/7
          </span>
        </div>
      </div>

      {/* Main Chat Layout: Left Knowledge Topics + Right Chat Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Knowledge Categories (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-4 bg-[#121820] border border-[#222B35] space-y-3">
            <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#C5A880]" /> Danh Mục Tri Thức Thường Gặp:
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Bấm vào bất kỳ câu hỏi nào dưới đây để AI tự động tra cứu trong sổ tay vận hành:
            </p>

            <div className="space-y-3 pt-1">
              {KNOWLEDGE_CATEGORIES.map((cat, catIdx) => (
                <div key={catIdx} className="space-y-1.5">
                  <div className="text-[11px] font-bold text-[#C5A880]">
                    {cat.category}
                  </div>
                  <div className="space-y-1">
                    {cat.prompts.map((p, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => handleSendMessage(p)}
                        className="w-full text-left text-[11px] p-2 bg-[#161B22] hover:bg-[#1C2533] border border-[#222B35] hover:border-[#C5A880] text-gray-300 hover:text-white transition-all flex items-center justify-between group rounded"
                      >
                        <span className="truncate pr-2">{p}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-[#C5A880] flex-shrink-0 transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Security & Accuracy Card */}
          <div className="p-4 bg-[#161B22] border border-[#222B35] text-[11px] text-gray-400 space-y-2">
            <div className="text-white font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Bảo Mật & Thông Tin Chính Xác
            </div>
            <p className="leading-relaxed">
              Mọi cuộc trò chuyện đều được bảo mật an toàn riêng tư. Nội dung giải đáp được đối soát và cập nhật liên tục theo quy chế mới nhất từ Ban Quản Lý Tòa Nhà.
            </p>
          </div>
        </div>

        {/* Right Full Chat Screen (8 Cols) */}
        <div className="lg:col-span-8 bg-[#0D1117] border border-[#222B35] flex flex-col h-[650px] shadow-2xl overflow-hidden rounded">
          {/* Chat Topbar */}
          <div className="p-3.5 bg-gradient-to-r from-[#161D26] via-[#121820] to-[#0D1117] border-b border-[#222B35] flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-[#1C2533] border border-[#C5A880] flex items-center justify-center text-[#C5A880]">
                  <Bot className="w-4 h-4" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-[#0D1117]"></span>
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>Skyline AI Assistant</span>
                  <span className="px-1.5 py-0.2 bg-emerald-950 border border-emerald-500 text-emerald-300 text-[9px] font-mono font-bold uppercase">
                    Live
                  </span>
                </div>
                <div className="text-[10px] text-gray-400">
                  Căn hộ {aptCode} • Chủ hộ: {residentName}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setMessages([messages[0]]);
              }}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-[#1C2533] border border-gray-700 transition-colors text-[10px] flex items-center gap-1 rounded"
              title="Làm mới đoạn hội thoại"
            >
              <RefreshCw className="w-3 h-3" /> Làm mới
            </button>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-[#0A0D12]">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'} space-y-1.5`}
              >
                <div
                  className={`max-w-[85%] p-4 text-xs leading-relaxed rounded ${
                    m.sender === 'user'
                      ? 'bg-[#C5A880] text-[#0D1117] font-medium shadow-md'
                      : 'bg-[#121820] border border-[#222B35] text-gray-200 shadow-inner space-y-2.5'
                  }`}
                >
                  <AiMessageFormatter content={m.text} isUser={m.sender === 'user'} />

                  {/* Copy Button & Timestamp (Only for AI messages) */}
                  {m.sender === 'ai' && (
                    <div className="pt-2 border-t border-[#222B35] flex items-center justify-between text-[10px] text-gray-400">
                      {m.ragSource ? (
                        <div className="flex items-center gap-1.5 font-mono text-[9px] text-gray-400">
                          <Bookmark className="w-3 h-3 text-[#C5A880] flex-shrink-0" />
                          <span className="truncate">{m.ragSource}</span>
                        </div>
                      ) : (
                        <span className="text-[9px] text-gray-500 font-mono">{m.timestamp}</span>
                      )}

                      <button
                        type="button"
                        onClick={() => handleCopyMessage(m.id, m.text)}
                        className="hover:text-white flex items-center gap-1 px-1.5 py-0.5 hover:bg-[#1C2533] rounded transition-colors text-gray-400 ml-2 flex-shrink-0"
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

                  {/* Action Link Button */}
                  {m.actionButton && (
                    <button
                      type="button"
                      onClick={() => handleAction(m.actionButton!.moduleId)}
                      className="w-full py-2 px-3.5 bg-[#1C2533] hover:bg-[#C5A880] hover:text-[#0D1117] border border-[#C5A880] text-[#C5A880] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors rounded shadow"
                    >
                      <Zap className="w-3.5 h-3.5" /> {m.actionButton.label} →
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

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-[#0D1117] border-t border-[#222B35] flex items-center gap-2 flex-shrink-0"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Nhập câu hỏi (VD: 'hồ bơi', 'tiền nước rò rỉ', 'sửa ống nước', 'faceid')..."
              className="flex-1 bg-[#161B22] border border-[#2D3748] p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#C5A880] transition-colors rounded"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || isTyping}
              className={`px-5 py-3 border transition-all flex items-center gap-1.5 rounded font-bold text-xs uppercase tracking-wider ${
                inputText.trim() && !isTyping
                  ? 'bg-[#C5A880] text-[#0D1117] border-[#C5A880] hover:bg-white shadow'
                  : 'bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed'
              }`}
            >
              <span>Gửi</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
