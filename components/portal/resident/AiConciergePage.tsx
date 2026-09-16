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
import { getFacilityBookings } from '@/lib/facilityStore';
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
      'Biểu phí phòng xông hơi đá muối VIP tầng 3',
      'Tôi đã đặt vé tiện ích nào chưa?',
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
      '🧖 Bảng giá phòng xông hơi VIP Tầng 3',
      '🍖 Đặt tiệc nướng BBQ panoramic Tầng 25',
      '💳 Chính sách hủy vé & hoàn tiền 100%',
      '🏊 Các tiện ích nào hoàn toàn miễn phí?'
    ];
  }

  // 2. Free / Open Access Facilities
  if (
    combined.includes('miễn phí') || 
    combined.includes('tự do') || 
    combined.includes('không cần đặt')
  ) {
    return [
      '⏰ Giờ mở cửa Hồ bơi vô cực Tầng 25',
      '🏋️ Phòng Gym Technogym có mở 24/7 không?',
      '🧖 Tiện ích nào cần đăng ký lịch hẹn trước?',
      '🛝 Quy định khu vui chơi trẻ em Sky Kids'
    ];
  }

  // 3. Scale, building floors, apartments per floor
  if (
    combined.includes('bao nhiêu tầng') || 
    combined.includes('bao nhiêu căn') || 
    combined.includes('quy mô') || 
    combined.includes('mỗi tầng') || 
    combined.includes('1 tầng') ||
    combined.includes('tầng hầm') ||
    combined.includes('tầng 25')
  ) {
    return [
      '🏊 Hồ bơi vô cực nằm ở tầng mấy?',
      '🛍️ Tầng 1 đến Tầng 4 có những tiện ích gì?',
      '🏠 Căn hộ 12A05 diện tích bao nhiêu m²?',
      '🧖 Tiện ích nào cần đăng ký trước?'
    ];
  }

  // 4. General Facilities (hồ bơi, gym, xông hơi, bbq)
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
      '🧖 Tiện ích nào cần đăng ký lịch hẹn trước?',
      '⏰ Giờ mở cửa Hồ bơi & Phòng gym',
      '🍖 Bảng giá đặt vườn BBQ Tầng 25',
      '🎫 Kiểm tra vé tiện ích đã đặt của tôi'
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
      '🔄 Hướng dẫn hủy vé & hoàn 100% tiền giữ chỗ',
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
      '📱 Cách tạo mã QR & PIN gửi cho khách',
      '🚗 Khách thăm đỗ xe ở đâu?',
      '🚪 Mở cửa căn hộ từ xa qua chuông hình',
      '🔑 Tạo mã OTP mở khóa cửa cho khách'
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
      '💧 Tại sao tiền nước tháng này tăng cao?',
      '🔧 Báo thợ kiểm tra van nước rò rỉ',
      '🚗 Biểu phí gửi xe ô tô & xe máy',
      '💳 Hướng dẫn thanh toán quét mã QR BQL'
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
      '⏱️ Kỹ thuật viên khi nào có mặt tại căn hộ?',
      '📞 Hotline kỹ thuật khẩn cấp 1900 8899',
      '💧 Tra cứu cảnh báo rò rỉ nước AI',
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
      '📷 Hướng dẫn cài FaceID cho người nhà',
      '🔑 Tạo mã số tạm thời cho khách đến chơi',
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
      '➕ Cách đăng ký thêm thành viên căn hộ',
      '🚗 Vị trí đỗ xe ô tô cố định ở hầm nào?',
      '📷 Cài đặt nhận diện khuôn mặt FaceID',
      '💳 Biểu phí gửi xe hàng tháng'
    ];
  }

  // Default fallback suggestions
  return [
    '🧖 Tiện ích nào cần đăng ký trước?',
    '🏊 Giờ mở cửa Hồ bơi & Phòng gym',
    '💳 Hóa đơn điện nước & Phí quản lý tháng này',
    '🏢 Tòa nhà có tất cả bao nhiêu tầng?'
  ];
}

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
        '🧖 Tiện ích nào cần đăng ký trước?',
        '🏊 Giờ mở cửa Hồ bơi & Gym',
        '💳 Hóa đơn sinh hoạt tháng này',
        '🏢 Tòa nhà có bao nhiêu tầng?',
      ],
      actionButton: {
        label: 'Xem Tiện Ích',
        moduleId: 'resident-facilities'
      }
    }
  ]);

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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
      const bookings = typeof window !== 'undefined' ? getFacilityBookings(aptCode) : [];
      const response = await fetch('/api/ai/concierge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: historyPayload,
          aptCode,
          userName: residentName,
          userRole: currentUser?.role,
          phone: currentUser?.phone,
          licensePlate: currentUser?.license_plate,
          idCard: currentUser?.id_card_no,
          bookings,
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
        aiReply = data.fallbackReply || data.error || 'Dạ, hệ thống đang bận. Quý cư dân vui lòng thử lại sau giây lát.';
      }

      // If suggestions weren't supplied directly in data.suggestions, parse from text
      if (suggestions.length === 0) {
        const parsed = parseSuggestionsFromReply(aiReply);
        aiReply = parsed.cleanText;
        suggestions = parsed.suggestions.length > 0 ? parsed.suggestions : getDynamicSuggestions(query, aiReply);
      }

      // Contextual action button
      let actionButton: { label: string; moduleId: string } | undefined = undefined;
      const lower = (query + ' ' + aiReply).toLowerCase();

      if (lower.includes('hồ bơi') || lower.includes('pool') || lower.includes('gym') || lower.includes('tiện ích') || lower.includes('tennis') || lower.includes('pickleball')) {
        actionButton = { label: 'Mở Thẻ & Đăng Ký Tiện Ích', moduleId: 'resident-facilities' };
      } else if (lower.includes('hóa đơn') || lower.includes('tiền') || lower.includes('nước') || lower.includes('thanh toán') || lower.includes('phí')) {
        actionButton = { label: 'Xem & Thanh Toán Hóa Đơn', moduleId: 'resident-finance' };
      } else if (lower.includes('sửa') || lower.includes('hỏng') || lower.includes('kỹ thuật') || lower.includes('sự cố')) {
        actionButton = { label: 'Yêu Cầu Hỗ Trợ Kỹ Thuật (Hỗ Trợ Trong 60 Phút)', moduleId: 'resident-tickets' };
      } else if (lower.includes('faceid') || lower.includes('cửa') || lower.includes('thẻ') || lower.includes('người nhà') || lower.includes('khóa')) {
        actionButton = { label: 'Quản Lý Khóa Cửa & Thẻ Cư Dân', moduleId: 'resident-smarthome' };
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
                        className="w-full text-left text-[11px] p-2 bg-[#161B22] hover:bg-[#1C2533] border border-[#222B35] hover:border-[#C5A880] text-gray-300 hover:text-white transition-all flex items-center justify-between group rounded-none"
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
          <div className="p-4 bg-[#161B22] border border-[#222B35] text-[11px] text-gray-400 space-y-2 rounded-none">
            <div className="text-white font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Bảo Mật & Thông Tin Chính Xác
            </div>
            <p className="leading-relaxed">
              Mọi cuộc trò chuyện đều được bảo mật an toàn riêng tư. Nội dung giải đáp được đối soát và cập nhật liên tục theo quy chế mới nhất từ Ban Quản Lý Tòa Nhà.
            </p>
          </div>
        </div>

        {/* Right Full Chat Screen (8 Cols) - Borderless Sharp Luxury */}
        <div className="lg:col-span-8 bg-[#0D1219] shadow-2xl overflow-hidden rounded-none border-0 flex flex-col h-[650px]">
          {/* Chat Topbar */}
          <div className="p-4 bg-[#141B24] flex items-center justify-between flex-shrink-0 border-0 rounded-none">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-9 h-9 rounded-none bg-gradient-to-tr from-[#C5A880]/20 to-[#C5A880]/35 flex items-center justify-center text-[#C5A880] border-0">
                  <Bot className="w-4 h-4" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-none border-2 border-[#141B24]"></span>
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>Skyline AI Assistant</span>
                  <span className="px-2 py-0.5 bg-emerald-950/80 text-emerald-400 text-[9px] font-mono font-bold uppercase rounded-none border-0">
                    Live
                  </span>
                </div>
                <div className="text-[11px] text-gray-400">
                  Căn hộ {aptCode} • Chủ hộ: {residentName}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setMessages([messages[0]]);
              }}
              className="p-2 hover:bg-white/10 text-gray-400 hover:text-white rounded-none transition-colors text-xs flex items-center gap-1.5 border-0"
              title="Làm mới đoạn hội thoại"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Làm mới
            </button>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-[#0A0E14]">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'} space-y-1.5`}
              >
                <div
                  className={`relative ${
                    m.sender === 'user'
                      ? 'max-w-[85%] p-3.5 text-[13px] leading-relaxed rounded-none bg-gradient-to-r from-[#C5A880] to-[#B39366] text-[#0B0F15] font-medium shadow-md border-0'
                      : 'max-w-[88%] p-4 text-[13px] leading-relaxed rounded-none bg-[#141B24] text-gray-200 shadow-sm border-0 space-y-2'
                  }`}
                >
                  <AiMessageFormatter content={m.text} isUser={m.sender === 'user'} />

                  {/* Copy Button & Timestamp (Only for AI messages) */}
                  {m.sender === 'ai' && (
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-400">
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
                        onClick={() => handleCopy(m.id, m.text)}
                        className="hover:text-white flex items-center gap-1 px-2 py-0.5 hover:bg-white/5 transition-colors text-gray-400 ml-2 flex-shrink-0 rounded-none border-0"
                        title="Sao chép nội dung câu trả lời"
                      >
                        {copiedId === m.id ? (
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
                      className="mt-2.5 w-full py-2.5 px-4 bg-gradient-to-r from-[#C5A880] to-[#B59569] hover:from-white hover:to-white text-[#0B0F15] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all rounded-none shadow border-0"
                    >
                      <Zap className="w-3.5 h-3.5" /> {m.actionButton.label} →
                    </button>
                  )}
                </div>

                <span className="text-[9px] text-gray-500 font-mono px-1">
                  {m.timestamp}
                </span>

                {/* Contextual Follow-up Question Suggestions */}
                {m.suggestions && m.suggestions.length > 0 && (
                  <div className="flex flex-col gap-1.5 pt-1.5 max-w-[95%] animate-in fade-in duration-200">
                    <div className="flex items-center gap-1.5 text-[11px] text-[#C5A880] font-medium px-0.5">
                      <Sparkles className="w-3 h-3 text-[#C5A880]" />
                      <span>Gợi ý câu hỏi tiếp theo:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {m.suggestions.map((sug, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSendMessage(sug)}
                          disabled={isTyping}
                          className="text-xs px-3 py-1.5 bg-[#16202D] hover:bg-[#212E40] text-gray-300 hover:text-[#C5A880] transition-all rounded-none text-left flex items-center gap-1.5 border border-[#C5A880]/15 hover:border-[#C5A880]/40 shadow-sm group"
                        >
                          <span className="group-hover:translate-x-0.5 transition-transform">{sug}</span>
                          <ChevronRight className="w-2.5 h-2.5 text-[#C5A880]/60 group-hover:text-[#C5A880] transition-colors flex-shrink-0" />
                        </button>
                      ))}
                    </div>
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

          {/* Input Box - Borderless Sharp Layout */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3.5 bg-[#0E131B] flex items-center gap-2 flex-shrink-0 border-0 rounded-none"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Nhập câu hỏi (VD: 'hồ bơi', 'tiền nước rò rỉ', 'sửa ống nước', 'faceid')..."
              className="flex-1 bg-[#141B24] p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#C5A880]/40 transition-colors rounded-none border-0"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || isTyping}
              className={`px-5 py-3 rounded-none font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 border-0 ${
                inputText.trim() && !isTyping
                  ? 'bg-[#C5A880] text-[#0D1117] hover:bg-white shadow'
                  : 'bg-[#1A222F] text-gray-500 cursor-not-allowed'
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
