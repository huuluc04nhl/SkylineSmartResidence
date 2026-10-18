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
  Info,
  Minus,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { User as UserType } from '@/lib/dataStore';
import { getBills } from '@/lib/billingStore';
import { getTickets } from '@/lib/ticketStore';
import { getAllVisitorPasses } from '@/lib/visitorStore';
import { getApartmentMembers } from '@/lib/userStore';
import { getFacilityBookings, createFacilityBooking, cancelFacilityBookingWithRefund, FacilityBooking } from '@/lib/facilityStore';
import { useLanguage } from '@/lib/languageContext';
import AiMessageFormatter from './AiMessageFormatter';
import FacilityPassCard from './FacilityPassCard';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  suggestions?: string[];
  actionLink?: { label: string; moduleId: string };
  isCopied?: boolean;
  facilityBooking?: FacilityBooking;
  cancelledBooking?: {
    bookingId: string;
    ticketCode?: string;
    facilityName?: string;
    refundAmount: number;
    refundRate: number;
  };
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

function getDynamicSuggestions(userQuestion: string, aiResponse: string, isEnglish?: boolean): string[] {
  const combined = (userQuestion + ' ' + aiResponse).toLowerCase();

  // 1. Facilities requiring reservation / booking
  if (
    (combined.includes('tiện ích') || combined.includes('dịch vụ') || combined.includes('amenit') || combined.includes('facilit')) &&
    (combined.includes('đặt trước') || combined.includes('hẹn trước') || combined.includes('đăng ký') || combined.includes('giữ chỗ') || combined.includes('tính phí') || combined.includes('book') || combined.includes('reserve'))
  ) {
    return isEnglish ? [
      '🧖 VIP Sauna Tier 3 price list',
      '🍖 Book panoramic BBQ party on 25th floor',
      '💳 Cancellation policy & 100% refund',
      '🏊 Which amenities are completely free?'
    ] : [
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
    combined.includes('không cần đặt') ||
    combined.includes('free') ||
    combined.includes('open access')
  ) {
    return isEnglish ? [
      '⏰ Infinity Pool 25th Floor opening hours',
      '🏋️ Is Technogym Gym open 24/7?',
      '🧖 Which amenities need advance booking?',
      '🛝 Sky Kids play area guidelines'
    ] : [
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
    combined.includes('tòa') ||
    combined.includes('block') ||
    combined.includes('beverly solari') ||
    combined.includes('tropical') ||
    combined.includes('tầng hầm') ||
    combined.includes('tower') ||
    combined.includes('scale') ||
    combined.includes('floor')
  ) {
    return isEnglish ? [
      '🏢 How many floors do BS-07, BS-08, BS-09, BS-10 have?',
      '🏠 Floor area of CH-06 and CH-01 in m²?',
      '🍽️ Restaurant opening hours on 1st floor?',
      '🏊 Does tropical resort pool need booking?'
    ] : [
      '🏢 Tòa BS-07, BS-08, BS-09, BS-10 có bao nhiêu tầng?',
      '🏠 Căn hộ CH-06 và CH-01 diện tích bao nhiêu m²?',
      '🍽️ Dịch vụ nhà hàng tầng 1 mở cửa lúc mấy giờ?',
      '🏊 Cụm bể bơi nhiệt đới resort có cần đặt trước không?'
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
    return isEnglish ? [
      '🧖 Which amenities need advance reservation?',
      '⏰ Pool & Gym opening hours',
      '🍖 BBQ Garden pricing 25th floor',
      '🎫 Check my booked amenity tickets'
    ] : [
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
    combined.includes('booking') ||
    combined.includes('ticket')
  ) {
    return isEnglish ? [
      '🔄 How to cancel booking & get 100% refund',
      '🍖 Book additional BBQ slot on 25th floor',
      '🎟️ Check visitor guest passes for today',
      '🏊 Cloud pool operating schedule'
    ] : [
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
    combined.includes('thẻ khách') ||
    combined.includes('guest')
  ) {
    return isEnglish ? [
      '📱 How to generate QR code & PIN for guests',
      '🚗 Where can visitors park their cars?',
      '🚪 Remote door unlocking via video intercom',
      '🔑 Generate guest OTP door unlock code'
    ] : [
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
    combined.includes('nợ') ||
    combined.includes('bill') ||
    combined.includes('utility') ||
    combined.includes('payment')
  ) {
    return isEnglish ? [
      '💧 What is my electricity and water bill this month?',
      '🔧 Progress of apartment maintenance tickets',
      '🚗 Monthly parking fee for cars & motorbikes',
      '💳 How to pay via Management VietQR'
    ] : [
      '💧 Tiền điện nước tháng này của căn hộ là bao nhiêu?',
      '🔧 Tiến độ các phiếu sửa chữa kỹ thuật của căn hộ',
      '🚗 Biểu phí gửi xe ô tô & xe máy',
      '💳 Hướng dẫn thanh toán quét mã VietQR BQL'
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
    combined.includes('phiếu') ||
    combined.includes('repair') ||
    combined.includes('fix') ||
    combined.includes('leak')
  ) {
    return isEnglish ? [
      '⏱️ When will technician arrive at my unit?',
      '📞 Emergency technical hotline 1900 8899',
      '🔧 Status of current repair request',
      '🔊 Allowed hours for drilling and construction'
    ] : [
      '⏱️ Kỹ thuật viên khi nào có mặt tại căn hộ?',
      '📞 Hotline kỹ thuật khẩn cấp 1900 8899',
      '🔧 Phiếu sửa chữa của căn hộ xử lý tới đâu rồi?',
      '🔊 Giờ thi công khoan đục được phép'
    ];
  }

  // 9. Smart Door Lock / FaceID
  if (
    combined.includes('cửa') || 
    combined.includes('khóa') || 
    combined.includes('faceid') || 
    combined.includes('thẻ') || 
    combined.includes('chuông') ||
    combined.includes('lock') ||
    combined.includes('door')
  ) {
    return isEnglish ? [
      '📷 FaceID registration instructions',
      '🔑 Create temporary passcodes for guests',
      '💳 Register or report lost resident card',
      '🛡️ Smart anti-tamper security alert'
    ] : [
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
    combined.includes('biển số') ||
    combined.includes('member') ||
    combined.includes('family') ||
    combined.includes('parking')
  ) {
    return isEnglish ? [
      '➕ How to add family members to unit',
      '🚗 Where is assigned parking slot in basement?',
      '📷 FaceID setup for resident entry',
      '💳 Monthly vehicle parking rates'
    ] : [
      '➕ Cách đăng ký thêm thành viên căn hộ',
      '🚗 Vị trí đỗ xe ô tô cố định ở hầm nào?',
      '📷 Cài đặt nhận diện khuôn mặt FaceID',
      '💳 Biểu phí gửi xe hàng tháng'
    ];
  }

  // Default fallback suggestions
  return isEnglish ? [
    '🏢 Overview of The Tropical & Beverly Solari towers',
    '🏠 Which tower, floor & area is my apartment?',
    '🍽️ How do restaurant, pool & cleaning services work?',
    '💳 View this month’s utility bill'
  ] : [
    '🏢 Quy mô các tòa The Tropical & Beverly Solari',
    '🏠 Căn hộ của tôi ở tòa nào, tầng mấy, diện tích bao nhiêu?',
    '🍽️ Dịch vụ nhà hàng, hồ bơi & vệ sinh hoạt động thế nào?',
    '💳 Xem hóa đơn sinh hoạt tháng này'
  ];
}

export default function AiConciergeFloating({
  currentUser,
  isOpen,
  onToggle,
  onNavigateModule,
}: AiConciergeFloatingProps) {
  const { t, isEn, language } = useLanguage();
  const aptCode = currentUser.apartment_code || 'CH-06';
  const residentName = currentUser.full_name || (currentUser as any)?.fullname || 'Trần Hữu Lực';

  // Window view state: 'compact' (~375px) or 'expanded' (~520px), plus 'minimized' (dock bar)
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsMinimized(false);
    }
  }, [isOpen]);

  const getInitialAiMessage = (english: boolean): Message => ({
    id: 'm-initial',
    sender: 'ai',
    text: english
      ? `Greetings Resident **${residentName}** (Unit **${aptCode}** - Tower The Tropical BS-07, 30th Floor)!\n\nI am **Skyline AI Concierge**, dedicated to supporting you 24/7 at The Tropical Complex (Beverly Solari):\n* 🏢 **Apartment & Tower Scale:** Details on 4 towers BS-07 (34 fl.), BS-08 (39 fl.), BS-09 (34 fl.), BS-10 (34 fl.).\n* 🍽️ **5-Star Amenities:** Resort Pool hours, 1st Fl. Restaurant, 24/7 Gym & VIP Sauna.\n* 💳 **Bills & Rates:** Inquire electricity, water, management fees & periodic vehicle parking.\n* 🛠️ **NKS Technical Support:** Prompt issue reception with on-duty technicians arriving within 15 - 60 minutes.\n\nFeel free to tap a suggestion below or type your question directly!`
      : `Kính chào Quý cư dân **${residentName}** (Căn **${aptCode}** - Tòa The Tropical BS-07, Tầng 30)!\n\nTôi là **Skyline AI Concierge**, luôn đồng hành và hỗ trợ Quý vị 24/7 tại Khu Phức Hợp The Tropical (Beverly Solari):\n* 🏢 **Tra cứu căn hộ & quy mô tòa nhà:** Thông tin 4 chung cư BS-07 (34 tầng), BS-08 (39 tầng), BS-09 (34 tầng), BS-10 (34 tầng).\n* 🍽️ **Dịch vụ tiện ích 5 sao:** Giờ mở cửa Cụm Bể bơi Resort, Nhà hàng ẩm thực tầng 1, Gym 24/7 & Phòng xông hơi VIP.\n* 💳 **Hóa đơn & Biểu phí:** Tra cứu tiền điện, nước, phí quản lý & tiền gửi xe định kỳ.\n* 🛠️ **Hỗ trợ kỹ thuật NKS:** Tiếp nhận sự cố với KTV túc trực có mặt trong 15 - 60 phút.\n\nQuý cư dân có thể chọn câu hỏi gợi ý bên dưới hoặc nhập câu hỏi trực tiếp nhé!`,
    timestamp: '08:00',
    suggestions: english
      ? [
          '🏢 Overview of The Tropical & Beverly Solari towers',
          '🏠 Which tower, floor & area is my apartment?',
          '🍽️ How do restaurant, pool & cleaning services work?',
          '💳 View this month’s utility bill'
        ]
      : [
          '🏢 Quy mô các tòa The Tropical & Beverly Solari',
          '🏠 Căn hộ của tôi ở tòa nào, tầng mấy, diện tích bao nhiêu?',
          '🍽️ Dịch vụ nhà hàng, hồ bơi & vệ sinh hoạt động thế nào?',
          '💳 Xem hóa đơn sinh hoạt tháng này'
        ]
  });

  const [messages, setMessages] = useState<Message[]>([getInitialAiMessage(isEn)]);

  // Synchronize initial greeting when language toggles
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === 'm-initial') {
        return [getInitialAiMessage(isEn)];
      }
      return prev;
    });
  }, [isEn, residentName, aptCode]);

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
    scrollToBottom(false);
  }, [messages, isTyping]);

  // Monitor scroll to show jump-to-bottom button
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isFarFromBottom = scrollHeight - scrollTop - clientHeight > 100;
    setShowScrollBottom(isFarFromBottom);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
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
        text: isEn
          ? `Conversation has been refreshed! Ready to assist resident **${residentName}** (Unit **${aptCode}** - Tower BS-07, 30th Floor).`
          : `Đoạn hội thoại đã được làm mới! Tôi sẵn sàng lắng nghe mọi yêu cầu tra cứu từ Quý cư dân **${residentName}** (Căn **${aptCode}** - Tòa BS-07, Tầng 30).`,
        timestamp: new Date().toLocaleTimeString(isEn ? 'en-US' : 'vi-VN', { hour: '2-digit', minute: '2-digit' }),
        suggestions: isEn
          ? [
              '🏢 Overview of The Tropical & Beverly Solari towers',
              '🏠 Which tower, floor & area is my apartment?',
              '🍽️ How do restaurant, pool & cleaning services work?',
              '💳 View this month’s utility bill'
            ]
          : [
              '🏢 Quy mô các tòa The Tropical & Beverly Solari',
              '🏠 Căn hộ của tôi ở tòa nào, tầng mấy, diện tích bao nhiêu?',
              '🍽️ Dịch vụ nhà hàng, hồ bơi & vệ sinh hoạt động thế nào?',
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
          language: isEn ? 'en' : 'vi',
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
        aiReply = data.fallbackReply || data.error || (isEn ? 'The system is currently busy. Please try again in a moment or contact Management Hotline 1900 8899.' : 'Dạ, hệ thống đang bận. Quý cư dân vui lòng thử lại sau giây lát hoặc liên hệ Hotline BQL 1900 8899.');
      }

      // If suggestions weren't supplied directly in data.suggestions, parse from text
      if (suggestions.length === 0) {
        const parsed = parseSuggestionsFromReply(aiReply);
        aiReply = parsed.cleanText;
        suggestions = parsed.suggestions.length > 0 ? parsed.suggestions : getDynamicSuggestions(text, aiReply, isEn);
      }

      // Contextual action link & smart dynamic suggestions (Messenger style)
      let actionLink: { label: string; moduleId: string } | undefined = undefined;
      const lower = (text + ' ' + aiReply).toLowerCase();

      if (lower.includes('hồ bơi') || lower.includes('pool') || lower.includes('gym') || lower.includes('tiện ích') || lower.includes('tennis') || lower.includes('pickleball') || lower.includes('xông hơi') || lower.includes('sauna') || lower.includes('bbq') || lower.includes('vé')) {
        actionLink = { label: isEn ? 'Open Pass & Book Amenities' : 'Mở Thẻ & Đặt Tiện Ích', moduleId: 'resident-facilities' };
      } else if (lower.includes('hóa đơn') || lower.includes('tiền') || lower.includes('nợ') || lower.includes('thanh toán') || lower.includes('phí') || lower.includes('bill') || lower.includes('invoice')) {
        actionLink = { label: isEn ? 'View & Pay Bills' : 'Xem & Thanh Toán Hóa Đơn', moduleId: 'resident-finance' };
      } else if (lower.includes('sửa') || lower.includes('rò rỉ') || lower.includes('hỏng') || lower.includes('ống nước') || lower.includes('sự cố') || lower.includes('kỹ thuật') || lower.includes('repair') || lower.includes('leak')) {
        actionLink = { label: isEn ? 'Request Maintenance (Help in 60 Mins)' : 'Yêu Cầu Sửa Chữa (Hỗ Trợ Trong 60 Phút)', moduleId: 'resident-tickets' };
      } else if (lower.includes('faceid') || lower.includes('người nhà') || lower.includes('cửa') || lower.includes('khóa') || lower.includes('thẻ') || lower.includes('lock') || lower.includes('card')) {
        actionLink = { label: isEn ? 'Manage Door Locks & Resident Pass' : 'Quản Lý Khóa Cửa & Thẻ Cư Dân', moduleId: 'resident-smarthome' };
      }

      // Automated Action Execution (Facility Booking & Cancellation)
      let facilityBooking: FacilityBooking | undefined = undefined;
      let cancelledBooking: { bookingId: string; ticketCode?: string; facilityName?: string; refundAmount: number; refundRate: number } | undefined = undefined;

      if (data.action && data.action.type === 'BOOK_FACILITY') {
        try {
          const booked = createFacilityBooking(
            aptCode,
            data.action.facilityId || 'bbq',
            data.action.facilityName || 'Vườn Tiệc Nướng BBQ Panoramic Tầng 25',
            data.action.bookingDate || new Date().toISOString().split('T')[0],
            data.action.timeSlot || '18:00 - 21:00',
            residentName,
            data.action.pricing || '600.000 đ/ca',
            data.action.guestCount || 4,
            data.action.notes || 'Đặt tự động qua AI Concierge',
            1,
            data.action.depositAmount || 600000,
            data.action.facilityId === 'sauna'
          );
          facilityBooking = booked.newBooking;
        } catch (err) {
          console.error('Failed to auto-create facility booking:', err);
        }
      } else if (data.action && data.action.type === 'CANCEL_BOOKING') {
        try {
          const allB = getFacilityBookings(aptCode);
          const reqId = data.action.bookingId;
          const target = allB.find(b => b.id === reqId || b.ticketCode === reqId || b.status === 'CONFIRMED') || allB[0];
          if (target) {
            const cancelRes = cancelFacilityBookingWithRefund(aptCode, target.id, data.action.reason || 'Cư dân hủy qua AI');
            cancelledBooking = {
              bookingId: target.id,
              ticketCode: target.ticketCode,
              facilityName: target.facilityName,
              refundAmount: cancelRes.refundAmount,
              refundRate: cancelRes.refundRate,
            };
          }
        } catch (err) {
          console.error('Failed to auto-cancel booking:', err);
        }
      }

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: aiReply,
        timestamp: new Date().toLocaleTimeString(isEn ? 'en-US' : 'vi-VN', { hour: '2-digit', minute: '2-digit' }),
        suggestions,
        actionLink,
        facilityBooking,
        cancelledBooking,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      console.error('Concierge floating error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: isEn
            ? 'Unable to connect to AI server. Please try again later or contact Management Hotline **1900 8899**.'
            : 'Không thể kết nối đến máy chủ AI. Quý cư dân vui lòng thử lại hoặc liên hệ Hotline BQL **1900 8899**.',
          timestamp: new Date().toLocaleTimeString(isEn ? 'en-US' : 'vi-VN', { hour: '2-digit', minute: '2-digit' }),
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
    <div className="pointer-events-none fixed inset-0 z-50 select-none">
      {/* ------------------------------------------------------------- */}
      {/* 1. FLOATING LUXURY TRIGGER BUTTON (When Closed)               */}
      {/* ------------------------------------------------------------- */}
      {!isOpen && (
        <div className="pointer-events-auto fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-30 sm:z-50 flex items-center gap-2.5 transition-all duration-300">
          {/* Ambient Tooltip Pill (Desktop/Tablet) with Frosted Glass Blur & Gentle Translucency */}
          <button
            type="button"
            onClick={onToggle}
            className="hidden sm:flex items-center gap-2.5 px-3.5 py-2 bg-[#0E131B]/65 hover:bg-[#141B24]/90 text-[#C5A880] hover:text-white text-xs font-medium shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_15px_rgba(197,168,128,0.12)] backdrop-blur-xl rounded-none transition-all duration-300 opacity-80 hover:opacity-100 group border border-[#C5A880]/30 hover:border-[#C5A880]/60 active:scale-95 relative overflow-hidden"
          >
            {/* Subtle frosted glass ambient glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-[#C5A880]/10 via-transparent to-[#C5A880]/10 blur-sm pointer-events-none group-hover:opacity-100 opacity-50 transition-opacity" />

            <span className="w-2 h-2 rounded-none bg-emerald-400 animate-pulse relative z-10"></span>
            <span className="transition-colors relative z-10 tracking-wide">{isEn ? 'Ask Skyline AI 24/7' : 'Hỏi Skyline AI 24/7'}</span>
            <span className="px-1.5 py-0.5 bg-emerald-950/60 backdrop-blur-md text-emerald-400 text-[9px] font-mono font-bold rounded-none border border-emerald-500/40 relative z-10">
              24/7
            </span>
          </button>

          {/* Luxury Sharp AI Trigger Button with Frosted Glass Blur */}
          <button
            type="button"
            onClick={onToggle}
            aria-label={isEn ? "Open Skyline AI Assistant" : "Mở Trợ Lý Ảo Skyline AI"}
            className="group relative w-12 h-12 sm:w-13 sm:h-13 bg-gradient-to-br from-[#222C3A]/80 via-[#141B24]/80 to-[#0A0E14]/80 backdrop-blur-xl text-[#C5A880] hover:text-white rounded-none flex items-center justify-center transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-[0_10px_35px_rgba(0,0,0,0.7),0_0_20px_rgba(197,168,128,0.2)] border border-[#C5A880]/40 hover:border-[#C5A880]/70 opacity-90 hover:opacity-100"
          >
            <Bot className="w-5 h-5 sm:w-6 sm:h-6 relative z-10 transition-transform group-hover:rotate-12 duration-200" />
            <Sparkles className="w-3 h-3 text-amber-300 absolute top-1.5 right-1.5 animate-bounce" />
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-none border-2 border-[#0A0E14] flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-none bg-white animate-ping"></span>
            </span>
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. MINIMIZED FLOATING DOCK BAR (Compact Non-Obtrusive Pill)   */}
      {/* ------------------------------------------------------------- */}
      {isOpen && isMinimized && (
        <div className="pointer-events-auto fixed bottom-20 right-3 left-3 sm:left-auto sm:bottom-5 sm:right-5 z-30 sm:z-50 flex items-center justify-between gap-3 px-3 py-2 sm:px-4 sm:py-2.5 bg-[#0E131B]/75 hover:bg-[#0E131B]/90 text-white border border-[#C5A880]/40 shadow-[0_15px_40px_rgba(0,0,0,0.75)] backdrop-blur-xl rounded-none transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 sm:w-auto sm:min-w-[280px] max-w-full">
          <button
            type="button"
            onClick={() => setIsMinimized(false)}
            className="flex items-center gap-2.5 text-left flex-1 min-w-0 group"
            title={isEn ? "Click to reopen chat window" : "Nhấn để mở lại cửa sổ chat"}
          >
            <div className="relative flex-shrink-0">
              <div className="w-7 h-7 bg-[#1C2533] text-[#C5A880] flex items-center justify-center rounded-none border border-[#C5A880]/30 group-hover:bg-[#C5A880] group-hover:text-[#0A0E14] transition-colors">
                <Bot className="w-4 h-4" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-none animate-pulse"></span>
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-white group-hover:text-[#C5A880] transition-colors truncate flex items-center gap-1.5">
                <span>Skyline AI Concierge</span>
                <span className="text-[9px] font-mono font-normal text-[#C5A880] bg-[#16202D] px-1 py-0.2 rounded-none border border-[#C5A880]/20">
                  {aptCode}
                </span>
              </div>
              <div className="text-[10px] text-gray-400 truncate flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-none bg-emerald-400"></span>
                <span>{isEn ? 'Online • Click to reopen' : 'Đang trực tuyến • Nhấn mở lại'}</span>
              </div>
            </div>
          </button>

          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              type="button"
              onClick={() => setIsMinimized(false)}
              className="p-1.5 text-[#C5A880] hover:text-white hover:bg-white/10 rounded-none transition-colors border-0"
              title={isEn ? "Restore chat window" : "Mở lại cửa sổ chat"}
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onToggle}
              className="p-1.5 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-none transition-colors border-0"
              title={isEn ? "Close completely" : "Đóng hoàn toàn"}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. ACTIVE CHATBOX WINDOW (Optimized for Mobile/Tablet/Desktop) */}
      {/* ------------------------------------------------------------- */}
      {isOpen && !isMinimized && (
        <div
          className={`pointer-events-auto fixed inset-0 sm:inset-auto sm:bottom-5 sm:right-5 md:bottom-6 md:right-6 z-50 bg-[#0E131B]/98 sm:border sm:border-[#C5A880]/30 shadow-[0_25px_70px_rgba(0,0,0,0.95),0_0_50px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden backdrop-blur-2xl origin-bottom-right transition-all duration-300 ease-out animate-in fade-in-0 zoom-in-95 rounded-none ${
            isExpanded
              ? 'w-full h-full sm:w-[480px] md:w-[500px] lg:w-[520px] sm:h-[600px] sm:max-h-[85vh]'
              : 'w-full h-full sm:w-[350px] md:w-[365px] lg:w-[380px] sm:h-[490px] md:h-[510px] sm:max-h-[min(540px,78vh)]'
          }`}
        >
          {/* Top Window Header */}
          <div className="p-3 sm:p-3.5 bg-[#141B24] flex items-center justify-between text-white flex-shrink-0 border-b border-white/5 sm:border-0 rounded-none">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              {/* Mobile Back / Minimize Button */}
              <button
                type="button"
                onClick={() => setIsMinimized(true)}
                className="sm:hidden p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-none border-0"
                title={isEn ? "Minimize to screen bottom" : "Thu nhỏ xuống đáy màn hình"}
              >
                <ChevronDown className="w-5 h-5" />
              </button>

              <div className="relative flex-shrink-0">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-none bg-gradient-to-tr from-[#C5A880]/20 to-[#C5A880]/35 flex items-center justify-center text-[#C5A880] shadow-sm border border-[#C5A880]/20">
                  <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-none border-2 border-[#141B24]"></span>
              </div>

              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-serif font-bold text-white flex items-center gap-1.5 sm:gap-2 leading-tight truncate">
                  <span className="truncate">Skyline AI Concierge</span>
                  <span className="px-1.5 py-0.2 bg-emerald-950/80 text-emerald-400 text-[8px] sm:text-[9px] font-mono font-bold uppercase rounded-none border border-emerald-500/30 flex-shrink-0">
                    24/7
                  </span>
                </div>
                <div className="text-[10px] sm:text-[11px] text-gray-400 font-light flex items-center gap-1.5 mt-0.5 truncate">
                  <span className="w-1.5 h-1.5 rounded-none bg-emerald-400 animate-pulse flex-shrink-0"></span>
                  <span className="truncate">{isEn ? <>Unit <strong className="text-white font-mono">{aptCode}</strong> • Tower BS-07</> : <>Căn <strong className="text-white font-mono">{aptCode}</strong> • Tòa BS-07</>}</span>
                </div>
              </div>
            </div>

            {/* Header Control Buttons */}
            <div className="flex items-center gap-0.5 sm:gap-1 text-gray-400 flex-shrink-0">
              <button
                type="button"
                onClick={handleResetChat}
                className="p-1.5 sm:p-2 hover:bg-white/10 text-gray-400 hover:text-white rounded-none transition-colors border-0"
                title={isEn ? "Refresh conversation" : "Làm mới cuộc trò chuyện"}
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>

              {/* Minimize button (Desktop/Tablet) */}
              <button
                type="button"
                onClick={() => setIsMinimized(true)}
                className="hidden sm:block p-1.5 sm:p-2 hover:bg-white/10 text-gray-400 hover:text-white rounded-none transition-colors border-0"
                title={isEn ? "Minimize dock bar (unobtrusive)" : "Thu nhỏ thanh dock (không che màn hình)"}
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              {/* Expand toggle (sm+ only) */}
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="hidden sm:block p-1.5 sm:p-2 hover:bg-white/10 text-gray-400 hover:text-white rounded-none transition-colors border-0"
                title={isExpanded ? (isEn ? 'Minimize size' : 'Thu nhỏ kích thước') : (isEn ? 'Expand size' : 'Mở rộng kích thước')}
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>

              {/* Close button */}
              <button
                type="button"
                onClick={onToggle}
                className="p-1.5 sm:p-2 hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 rounded-none transition-colors border-0"
                title={isEn ? "Close chat window" : "Đóng cửa sổ chat"}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Conversation Stream - Spacious & Clean (Messenger Style) */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 p-3 sm:p-3.5 overflow-y-auto space-y-3.5 bg-[#0A0E14] text-xs relative"
          >
            {/* Message Bubbles */}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'} space-y-1 animate-chat-bubble`}
              >
                <div
                  className={`relative ${
                    m.sender === 'user'
                      ? 'max-w-[85%] sm:max-w-[82%] p-3 text-xs sm:text-[13px] leading-relaxed rounded-none bg-gradient-to-r from-[#C5A880] to-[#B39366] text-[#0B0F15] font-medium shadow-md border-0'
                      : 'max-w-[92%] sm:max-w-[88%] p-3 sm:p-3.5 text-xs sm:text-[13px] leading-relaxed rounded-none bg-[#141B24] text-gray-200 shadow-sm border border-white/5 space-y-2'
                  }`}
                >
                  {/* Message Content */}
                  <AiMessageFormatter content={m.text} isUser={m.sender === 'user'} />

                  {/* Automated Facility Booking Pass Card (If Action Triggered) */}
                  {(m.facilityBooking || m.cancelledBooking) && (
                    <FacilityPassCard
                      booking={m.facilityBooking}
                      cancelled={m.cancelledBooking}
                      isEn={isEn}
                      onOpenDetails={() => handleActionClick('resident-facilities')}
                    />
                  )}

                  {/* Context Action Link (If Present) */}
                  {m.actionLink && (
                    <button
                      type="button"
                      onClick={() => handleActionClick(m.actionLink!.moduleId)}
                      className="mt-2 w-full py-2 px-3 bg-gradient-to-r from-[#C5A880] to-[#B59569] hover:from-white hover:to-white text-[#0B0F15] font-bold text-[11px] sm:text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all rounded-none shadow border-0"
                    >
                      <Zap className="w-3 h-3" /> {m.actionLink.label} →
                    </button>
                  )}

                  {/* Copy Button (Only for AI messages) */}
                  {m.sender === 'ai' && (
                    <div className="pt-1.5 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-400">
                      <span className="font-mono text-[9px] text-gray-500">
                        {m.timestamp} • {isEn ? 'Skyline Assistant' : 'Trợ lý Skyline'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyMessage(m.id, m.text)}
                        className="hover:text-white flex items-center gap-1 px-1.5 py-0.5 hover:bg-white/5 rounded-none transition-colors text-gray-400 border-0"
                        title={isEn ? "Copy reply" : "Sao chép nội dung câu trả lời"}
                      >
                        {copiedMessageId === m.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400 text-[9px]">{isEn ? 'Copied' : 'Đã chép'}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span className="text-[9px]">{isEn ? 'Copy' : 'Sao chép'}</span>
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

                {/* Contextual Follow-up Question Suggestions */}
                {m.suggestions && m.suggestions.length > 0 && (
                  <div className="flex flex-col gap-1.5 pt-1 max-w-full animate-in fade-in duration-200">
                    <div className="flex items-center gap-1.5 text-[11px] text-[#C5A880] font-medium px-0.5">
                      <Sparkles className="w-3 h-3 text-[#C5A880] flex-shrink-0" />
                      <span>{isEn ? 'Suggested Next Questions:' : 'Gợi ý câu hỏi tiếp theo:'}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {m.suggestions.map((sug, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSendMessage(sug)}
                          disabled={isTyping}
                          className="text-[11px] sm:text-xs px-2.5 py-1.5 bg-[#16202D] hover:bg-[#212E40] text-gray-300 hover:text-[#C5A880] transition-all rounded-none text-left flex items-center justify-between gap-1.5 border border-[#C5A880]/20 hover:border-[#C5A880]/50 shadow-sm group active:scale-[0.98]"
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
              <div className="flex items-center gap-2.5 p-2.5 sm:p-3 bg-[#141B24] rounded-none w-fit animate-chat-bubble shadow-sm border border-white/5">
                <div className="flex items-center gap-1 text-[#C5A880]">
                  <span className="w-1.5 h-1.5 rounded-none bg-[#C5A880] animate-typing-dot-1"></span>
                  <span className="w-1.5 h-1.5 rounded-none bg-amber-400 animate-typing-dot-2"></span>
                  <span className="w-1.5 h-1.5 rounded-none bg-emerald-400 animate-typing-dot-3"></span>
                </div>
                <span className="text-[11px] sm:text-xs text-gray-300 font-mono">
                  {isEn ? 'Skyline Assistant is looking up information...' : 'Trợ lý Skyline đang tra cứu thông tin...'}
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
              className="absolute bottom-20 right-4 sm:right-6 z-10 px-3 py-1.5 bg-[#1C2533] hover:bg-[#C5A880] hover:text-[#0D1117] text-white text-[11px] sm:text-xs font-semibold rounded-none shadow-2xl flex items-center gap-1.5 transition-all transform hover:scale-105 border border-[#C5A880]/30"
            >
              <ArrowDown className="w-3 h-3" />
              <span>{isEn ? 'New messages' : 'Tin nhắn mới'}</span>
            </button>
          )}

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-2.5 sm:p-3 bg-[#0E131B] flex flex-col gap-1.5 flex-shrink-0 border-t border-white/5 sm:border-0 rounded-none pb-[max(0.75rem,env(safe-area-inset-bottom))]"
          >
            <div className="flex items-end gap-2 bg-[#141B24] shadow-inner transition-colors p-1.5 sm:p-2 pl-2.5 sm:pl-3 rounded-none border border-white/5 focus-within:border-[#C5A880]/50">
              <textarea
                ref={textareaRef}
                rows={1}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isEn ? "Enter question (Enter to submit)..." : "Nhập câu hỏi (Enter để gửi)..."}
                disabled={isTyping}
                className="flex-1 bg-transparent text-xs text-white placeholder-gray-500 focus:outline-none resize-none max-h-24 leading-relaxed py-1 sm:py-1.5 rounded-none"
              />

              {inputText.trim() && (
                <button
                  type="button"
                  onClick={() => setInputText('')}
                  className="text-gray-500 hover:text-white p-1 mb-1 border-0 rounded-none"
                  title={isEn ? "Clear text" : "Xóa chữ"}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="submit"
                disabled={!inputText.trim() || isTyping}
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-none transition-all flex items-center justify-center font-bold flex-shrink-0 border-0 ${
                  inputText.trim() && !isTyping
                    ? 'bg-[#C5A880] text-[#0D1117] hover:bg-white shadow transform active:scale-95'
                    : 'bg-[#1A222F] text-gray-500 cursor-not-allowed'
                }`}
                title={isEn ? "Send message" : "Gửi tin nhắn"}
              >
                <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>

            {/* Disclaimer & Shortcuts */}
            <div className="flex items-center justify-between text-[10px] text-gray-500 px-1">
              <span className="flex items-center gap-1.5 truncate">
                <ShieldCheck className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                <span className="truncate">{isEn ? 'Privacy Policy • Skyline Operating Regulations' : 'Bảo mật riêng tư • Quy chế vận hành Skyline'}</span>
              </span>
              <span className="hidden sm:inline text-[9px] font-mono text-gray-500 flex-shrink-0">{isEn ? 'Enter ↵ to Send' : 'Enter ↵ gửi'}</span>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
