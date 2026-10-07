'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Wrench, 
  Clock, 
  Sparkles, 
  Plus, 
  CheckCircle2, 
  Sliders, 
  Eye, 
  Camera, 
  Upload, 
  Star, 
  Phone, 
  AlertCircle, 
  X, 
  Check, 
  MessageSquare,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
  BadgeCheck,
  HelpCircle,
  Send,
  Zap,
  Droplets,
  MapPin,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { User as UserType } from '@/lib/dataStore';
import { 
  getTickets, 
  createTicket, 
  createTicketAsync,
  syncTicketsWithServer,
  rateTicket, 
  ExtendedServiceRequest 
} from '@/lib/ticketStore';
import { TicketCategoryType } from '@/lib/ticketClassification';
import { fileToBase64 } from '@/lib/imageUtils';

export interface RepairPreset {
  id: string;
  label: string;
  category: 'Nước' | 'Điện' | 'Khác';
  area: string;
  urgency: 'HIGH' | 'NORMAL';
  title: string;
  description: string;
  icon: string;
}

export const COMMON_REPAIR_PRESETS: RepairPreset[] = [
  {
    id: 'leakage',
    label: 'Rò rỉ vòi nước / Bồn rửa',
    category: 'Nước',
    area: 'Gian bếp',
    urgency: 'HIGH',
    title: 'Rò rỉ vòi nước bồn rửa chén',
    description: 'Vòi nước nóng lạnh tại bồn rửa chén bị hỏng gioăng cao su, nước rỉ liên tục xuống sàn tủ bếp, đã khóa tạm van nhưng vẫn rỉ.',
    icon: '🚰',
  },
  {
    id: 'electrical',
    label: 'Chập điện / Nhảy Aptomat',
    category: 'Điện',
    area: 'Phòng khách',
    urgency: 'HIGH',
    title: 'Nhảy Aptomat tổng / Mất điện',
    description: 'Aptomat tổng bị nhảy liên tục khi bật thiết bị điện, có hiện tượng chập chờn nguồn điện, cần KTV đến kiểm tra an toàn khẩn cấp.',
    icon: '⚡',
  },
  {
    id: 'ac',
    label: 'Điều hòa chảy nước / Không mát',
    category: 'Khác',
    area: 'Phòng ngủ',
    urgency: 'NORMAL',
    title: 'Điều hòa rò rỉ nước / Thổi gió không lạnh',
    description: 'Dàn lạnh điều hòa chảy nước nhỏ giọt xuống sàn gỗ và độ lạnh kém, cần KTV kiểm tra thông ống xả và kiểm tra gas.',
    icon: '❄️',
  },
  {
    id: 'drainage',
    label: 'Nghẹt cống / Thoát sàn trào',
    category: 'Nước',
    area: 'Phòng tắm / WC',
    urgency: 'HIGH',
    title: 'Nghẹt cống thoát sàn nhà tắm',
    description: 'Ống thoát sàn phòng tắm thoát nước rất chậm và ứ đọng, có nguy cơ tràn nước ra ngoài sàn khi tắm giặt.',
    icon: '🚽',
  },
  {
    id: 'door_lock',
    label: 'Kẹt khóa cửa vân tay / Khóa từ',
    category: 'Khác',
    area: 'Cửa ra vào',
    urgency: 'HIGH',
    title: 'Khóa cửa thông minh không nhận vân tay',
    description: 'Khóa cửa điện tử báo lỗi đèn đỏ liên tục, không nhận diện vân tay hoặc thẻ từ, cần KTV hỗ trợ kiểm tra nguồn pin & bo mạch.',
    icon: '🔐',
  },
  {
    id: 'lighting',
    label: 'Cháy đèn / Đèn chập chờn',
    category: 'Điện',
    area: 'Phòng khách',
    urgency: 'NORMAL',
    title: 'Đèn chiếu sáng chập chờn / Cháy bóng',
    description: 'Hệ thống đèn downlight âm trần bị nhấp nháy liên tục và 2 bóng không sáng, cần kiểm tra chấn lưu (driver) và thay bóng.',
    icon: '💡',
  },
];

export const REPAIR_AREAS = [
  'Gian bếp',
  'Phòng tắm / WC',
  'Phòng khách',
  'Phòng ngủ',
  'Ban công / Lô gia',
  'Cửa ra vào',
];

export const PREFERRED_TIME_SLOTS = [
  'Càng sớm càng tốt (< 30 phút)',
  'Sáng nay (08:30 - 11:30)',
  'Chiều nay (13:30 - 17:00)',
  'Tối nay (17:30 - 20:30)',
];

interface TicketServiceProps {
  currentUser?: UserType;
}

export default function TicketService({ currentUser }: TicketServiceProps) {
  const aptCode = currentUser?.apartment_code || 'CH-06';
  const residentName = currentUser?.full_name || (currentUser as any)?.fullname || 'Trần Hữu Lực';
  const residentPhone = currentUser?.phone || '0364967082';

  const [tickets, setTickets] = useState<ExtendedServiceRequest[]>([]);
  const [sliderPos, setSliderPos] = useState<number>(50); // 50% for before-after slider
  const [selectedComparisonTicketId, setSelectedComparisonTicketId] = useState<string>('');
  
  // Create Form State: REPAIR (Báo hỏng) | INQUIRY (Hỏi đáp) | FEEDBACK (Góp ý/Khiếu nại)
  const [ticketPurpose, setTicketPurpose] = useState<'REPAIR' | 'INQUIRY' | 'FEEDBACK'>('REPAIR');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [content, setContent] = useState('');
  const [aiDetectedCat, setAiDetectedCat] = useState<'Điện' | 'Nước' | 'Khác'>('Nước');
  
  // Chi tiết mở rộng cho phần BÁO HỎNG (REPAIR)
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [selectedArea, setSelectedArea] = useState<string>('Gian bếp');
  const [urgencyLevel, setUrgencyLevel] = useState<'HIGH' | 'NORMAL'>('HIGH');
  const [preferredTime, setPreferredTime] = useState<string>('Càng sớm càng tốt (< 30 phút)');
  const [contactPhone, setContactPhone] = useState<string>(residentPhone);

  const [attachedImageBase64, setAttachedImageBase64] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdSuccessMsg, setCreatedSuccessMsg] = useState<string | null>(null);
  const [createdTicketResult, setCreatedTicketResult] = useState<ExtendedServiceRequest | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Rating Modal State
  const [ratingModalTicket, setRatingModalTicket] = useState<ExtendedServiceRequest | null>(null);
  const [selectedRating, setSelectedRating] = useState<number>(5);
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [rateSuccessMsg, setRateSuccessMsg] = useState<string | null>(null);

  const refreshTicketList = () => {
    const list = getTickets(aptCode);
    setTickets(list);
  };

  const handleRefreshSync = async () => {
    setIsSyncing(true);
    try {
      await syncTicketsWithServer(aptCode, residentPhone);
      refreshTicketList();
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    refreshTicketList();
    // Đồng bộ trực tiếp từ NKS API ngầm khi mở tab
    syncTicketsWithServer(aptCode, residentPhone).then(() => {
      refreshTicketList();
    });

    const handleUpdate = () => refreshTicketList();
    window.addEventListener('skyline_tickets_updated', handleUpdate);
    return () => window.removeEventListener('skyline_tickets_updated', handleUpdate);
  }, [aptCode, residentPhone]);

  // Chọn ticket so sánh: các phiếu đã giải quyết (Resolved) có cả 2 ảnh thật (trước & sau)
  const comparisonTickets = tickets.filter(t => t.status === 'Resolved' && t.before_image && t.after_image);
  const activeComparisonTicket = comparisonTickets.find(t => t.id === selectedComparisonTicketId) 
    || comparisonTickets[0];

  const handleApplyPreset = (preset: RepairPreset) => {
    setSelectedPresetId(preset.id);
    setContent(preset.description);
    setSelectedArea(preset.area);
    setAiDetectedCat(preset.category);
    setUrgencyLevel(preset.urgency);
  };

  const handleContentChange = (text: string) => {
    setContent(text);
    setSelectedPresetId(null);
    const lower = text.toLowerCase();
    if (lower.includes('nước') || lower.includes('vòi') || lower.includes('rỉ') || lower.includes('nghẹt') || lower.includes('bồn') || lower.includes('cống') || lower.includes('tràn')) {
      setAiDetectedCat('Nước');
      setUrgencyLevel('HIGH');
    } else if (lower.includes('điện') || lower.includes('đèn') || lower.includes('aptomat') || lower.includes('chập') || lower.includes('ổ cắm') || lower.includes('mất điện')) {
      setAiDetectedCat('Điện');
      setUrgencyLevel('HIGH');
    } else {
      setAiDetectedCat('Khác');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn tệp hình ảnh hợp lệ (JPG, PNG).');
      return;
    }

    setIsUploadingImage(true);
    try {
      const base64 = await fileToBase64(file);
      setAttachedImageBase64(base64);
    } catch (err) {
      console.warn('Lỗi đọc ảnh:', err);
      alert('Không thể đọc file ảnh. Vui lòng thử lại.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const beforeImage = attachedImageBase64 || '';

    try {
      let finalCategory = 'Kỹ thuật';
      let typeLabel = 'Sự Cố Kỹ Thuật';

      if (ticketPurpose === 'INQUIRY') {
        finalCategory = 'Hỏi đáp';
        typeLabel = 'Hỏi Đáp & Trợ Giúp';
      } else if (ticketPurpose === 'FEEDBACK') {
        finalCategory = 'Phản ánh';
        typeLabel = 'Phản Ánh & Khiếu Nại';
      } else {
        finalCategory = aiDetectedCat;
        typeLabel = 'Sự Cố Kỹ Thuật';
      }

      // Xây dựng nội dung đầy đủ cho kỹ thuật viên
      const fullContent = ticketPurpose === 'REPAIR'
        ? `${content.trim()}${selectedArea ? `\n• Khu vực: ${selectedArea}` : ''}${urgencyLevel === 'HIGH' ? '\n• Mức độ: Khẩn cấp (Cần KTV có mặt sớm)' : ''}\n• Khung giờ hẹn: ${preferredTime}\n• SĐT liên hệ tại căn: ${contactPhone.trim() || residentPhone}`
        : content.trim();

      const newTicket = await createTicketAsync({
        apt_code: aptCode,
        resident_name: residentName,
        resident_phone: contactPhone.trim() || residentPhone,
        content: fullContent,
        ai_category: finalCategory,
        before_image: beforeImage,
        ticket_type: ticketPurpose,
        ticket_type_label: typeLabel,
      });

      setCreatedTicketResult(newTicket);
      setContent('');
      setAttachedImageBase64('');
      setSelectedPresetId(null);
      setShowCreateForm(false);
      const ticketDisplayId = newTicket.nks_id ? `#${newTicket.nks_id}` : `#${newTicket.id}`;
      
      if (ticketPurpose === 'INQUIRY') {
        setCreatedSuccessMsg(`⚡ Trợ lý AI đã giải đáp tức thì cho phiếu ${ticketDisplayId} (không cần chờ BQL)!`);
      } else if (ticketPurpose === 'FEEDBACK') {
        setCreatedSuccessMsg(`Ban Quản Lý đã tiếp nhận ý kiến ${ticketDisplayId} và đang thụ lý! (Trạng thái: Chờ BQL xác nhận)`);
      } else {
        const techName = newTicket.assigned_technician;
        setCreatedSuccessMsg(
          techName
            ? `Sự cố kỹ thuật ${ticketDisplayId} đã được phân bổ cho KTV ${techName} (${newTicket.scheduled_time || 'Có mặt trong vòng 30 - 45 phút'})!`
            : `Yêu cầu sửa chữa ${ticketDisplayId} đã được tiếp nhận và chuyển tới Đội ngũ Kỹ Thuật!`
        );
      }

      setTimeout(() => setCreatedSuccessMsg(null), 8000);
      refreshTicketList();
    } catch (err) {
      console.error('Lỗi gửi ticket:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitRating = () => {
    if (!ratingModalTicket) return;
    rateTicket(ratingModalTicket.id, selectedRating, feedbackText);
    setRatingModalTicket(null);
    setSelectedRating(5);
    setFeedbackText('');
    setRateSuccessMsg('Cảm ơn Quý cư dân đã gửi đánh giá dịch vụ kỹ thuật!');
    setTimeout(() => setRateSuccessMsg(null), 3000);
  };

  return (
    <div className="space-y-8 w-full animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222B35] pb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-semibold flex items-center gap-1.5">
            <Wrench className="w-3.5 h-3.5" /> Dịch Vụ Cư Dân • Căn {aptCode}
          </div>
          <h2 className="font-serif text-2xl text-white font-bold mt-1">
            Yêu Cầu, Hỏi Đáp & Sửa Chữa
          </h2>
        </div>

        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-lg"
        >
          <Plus className="w-4 h-4" /> Gửi Yêu Cầu Mới
        </button>
      </div>

      {/* Thẻ Kết Quả Xử Lý Tinh Gọn (AI Tự Động / KTV Phân Bổ / BQL Xác Nhận) */}
      {createdTicketResult && (
        <div className="p-4 bg-[#121A22] border border-[#C5A880] text-white shadow-xl animate-fadeIn space-y-2.5 relative">
          <div className="flex items-center justify-between pb-2 border-b border-[#222B35]">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${
                createdTicketResult.ticket_type === 'INQUIRY'
                  ? 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]'
                  : createdTicketResult.ticket_type === 'REPAIR'
                    ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                    : 'bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.8)]'
              }`} />
              <span className="font-bold text-xs uppercase tracking-wider text-white">
                {createdTicketResult.ticket_type === 'INQUIRY'
                  ? 'Trợ Lý AI Phản Hồi 24/7'
                  : createdTicketResult.ticket_type === 'REPAIR'
                    ? 'Đã Phân Bổ Kỹ Thuật Viên'
                    : 'Đã Tiếp Nhận Phiếu (Chờ BQL)'}
              </span>
              <span className="text-[11px] text-[#C5A880] font-mono">
                #{createdTicketResult.nks_id || createdTicketResult.id} • Căn {createdTicketResult.apt_code}
              </span>
            </div>
            <button
              onClick={() => setCreatedTicketResult(null)}
              className="text-gray-400 hover:text-white text-xs px-2 py-0.5 border border-gray-700 hover:border-gray-500 transition-colors"
            >
              ✕ Đóng
            </button>
          </div>

          {/* Nội dung kết quả theo luồng */}
          {createdTicketResult.ticket_type === 'INQUIRY' ? (
            <div className="p-3 bg-sky-950/30 border border-sky-500/30 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-sky-300 font-semibold text-[11px]">
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                Câu trả lời tự động:
              </div>
              <p className="text-gray-200 text-xs whitespace-pre-line leading-relaxed">
                {createdTicketResult.ai_reply || 'Hệ thống đã ghi nhận và phản hồi câu hỏi của Quý cư dân.'}
              </p>
            </div>
          ) : createdTicketResult.ticket_type === 'REPAIR' ? (
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#161F2B] border border-[#2D3A4B] text-xs">
              <div className="flex items-center gap-2.5">
                <Wrench className="w-4 h-4 text-[#C5A880] flex-shrink-0" />
                <div>
                  <div className="font-bold text-white text-xs flex items-center gap-2">
                    <span>{createdTicketResult.assigned_technician || 'KTV Ca Trực Skyline'}</span>
                    <span className="text-[10px] px-1.5 py-0.2 bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                      Có mặt trong {createdTicketResult.scheduled_time || '30 - 45 phút'}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-400 mt-0.5">
                    Chuyên môn: {createdTicketResult.ai_category || 'Cơ Điện & Nước'}
                  </div>
                </div>
              </div>
              <div>
                {createdTicketResult.assigned_technician_phone ? (
                  <a
                    href={`tel:${createdTicketResult.assigned_technician_phone}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#C5A880] text-[#0D1117] hover:bg-white font-mono font-bold text-xs transition-colors shadow"
                  >
                    <Phone className="w-3 h-3" /> Gọi KTV: {createdTicketResult.assigned_technician_phone}
                  </a>
                ) : (
                  <a
                    href="tel:0909888777"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#C5A880] text-[#0D1117] hover:bg-white font-mono font-bold text-xs transition-colors shadow"
                  >
                    <Phone className="w-3 h-3" /> Hotline BQL: 0909.888.777
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div className="p-3 bg-rose-950/20 border border-rose-500/30 text-xs text-gray-300 flex items-start gap-2">
              <Clock className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>Phiếu đã được chuyển tới Ban Quản Lý. BQL sẽ xác minh hiện trường và phản hồi trong thời gian sớm nhất.</span>
            </div>
          )}
        </div>
      )}

      {createdSuccessMsg && !createdTicketResult && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{createdSuccessMsg}</span>
        </div>
      )}

      {rateSuccessMsg && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
          <Sparkles className="w-4 h-4 text-yellow-400 flex-shrink-0" />
          <span>{rateSuccessMsg}</span>
        </div>
      )}

      {/* Form Tạo Phiếu Tinh Gọn & Tối Ưu Thông Tin */}
      {showCreateForm && (
        <form onSubmit={handleCreateTicket} className="p-5 bg-[#121820] border border-[#C5A880] space-y-3.5 shadow-2xl animate-fadeIn">
          <div className="flex items-center justify-between border-b border-[#222B35] pb-2.5 text-xs">
            <span className="font-serif font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-[#C5A880]" /> Tạo Phiếu Yêu Cầu • Căn {aptCode}
            </span>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Chọn Loại Yêu Cầu: 3 Tab Tinh Gọn */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#0F141C] border border-[#222B35]">
            <button
              type="button"
              onClick={() => setTicketPurpose('REPAIR')}
              className={`py-2 px-2 text-center text-xs transition-all flex items-center justify-center gap-1.5 ${
                ticketPurpose === 'REPAIR'
                  ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" /> Báo Hỏng Sửa Chữa
            </button>
            <button
              type="button"
              onClick={() => setTicketPurpose('INQUIRY')}
              className={`py-2 px-2 text-center text-xs transition-all flex items-center justify-center gap-1.5 ${
                ticketPurpose === 'INQUIRY'
                  ? 'bg-sky-500 text-black font-bold shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> Hỏi Đáp AI (24/7)
            </button>
            <button
              type="button"
              onClick={() => setTicketPurpose('FEEDBACK')}
              className={`py-2 px-2 text-center text-xs transition-all flex items-center justify-center gap-1.5 ${
                ticketPurpose === 'FEEDBACK'
                  ? 'bg-rose-600 text-white font-bold shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" /> Góp Ý & Phản Ánh
            </button>
          </div>

          {/* Gợi Ý Nhanh 1 Chạm (Chỉ hiện khi Báo Hỏng) */}
          {ticketPurpose === 'REPAIR' && (
            <div className="space-y-1.5 pt-0.5">
              <div className="text-[11px] text-gray-400 flex items-center justify-between">
                <span className="flex items-center gap-1 text-amber-300 font-medium">
                  <Zap className="w-3 h-3 text-amber-400" /> Gợi ý sự cố nhanh:
                </span>
                <span className="text-[10px] text-gray-500">Chạm để tự điền nội dung</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_REPAIR_PRESETS.map((p) => {
                  const isSelected = selectedPresetId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleApplyPreset(p)}
                      className={`px-2.5 py-1 text-xs border transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-amber-950/70 border-[#C5A880] text-amber-200 font-semibold shadow'
                          : 'bg-[#161B22] border-[#2D3748] text-gray-300 hover:border-gray-500 hover:text-white'
                      }`}
                    >
                      <span>{p.icon}</span>
                      <span>{p.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Chi Tiết Báo Hỏng: Vị Trí, Giờ Hẹn, Mức Độ & SĐT */}
          {ticketPurpose === 'REPAIR' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
              {/* Vị trí sự cố */}
              <div className="space-y-1">
                <label className="text-[11px] text-gray-300 font-medium flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#C5A880]" /> Vị trí phòng:
                </label>
                <div className="flex flex-wrap gap-1">
                  {REPAIR_AREAS.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setSelectedArea(a)}
                      className={`px-2 py-0.5 text-[11px] border transition-colors ${
                        selectedArea === a
                          ? 'bg-[#C5A880] text-[#0D1117] font-bold border-[#C5A880]'
                          : 'bg-[#161B22] text-gray-400 border-[#2D3748] hover:text-white'
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              {/* Khung giờ đón thợ */}
              <div className="space-y-1">
                <label className="text-[11px] text-gray-300 font-medium flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#C5A880]" /> Giờ hẹn tiếp thợ:
                </label>
                <select
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                  className="w-full bg-[#161B22] border border-[#2D3748] text-xs text-white p-1.5 focus:outline-none focus:border-[#C5A880]"
                >
                  {PREFERRED_TIME_SLOTS.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mức độ cấp bách */}
              <div className="space-y-1">
                <label className="text-[11px] text-gray-300 font-medium flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-400" /> Mức độ ưu tiên:
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setUrgencyLevel('HIGH')}
                    className={`py-1 text-xs border text-center transition-all ${
                      urgencyLevel === 'HIGH'
                        ? 'bg-rose-950/60 border-rose-500 text-rose-200 font-bold'
                        : 'bg-[#161B22] border-[#2D3748] text-gray-400 hover:text-white'
                    }`}
                  >
                    ⚡ Khẩn cấp (&lt; 45p)
                  </button>
                  <button
                    type="button"
                    onClick={() => setUrgencyLevel('NORMAL')}
                    className={`py-1 text-xs border text-center transition-all ${
                      urgencyLevel === 'NORMAL'
                        ? 'bg-amber-950/60 border-amber-500 text-amber-200 font-bold'
                        : 'bg-[#161B22] border-[#2D3748] text-gray-400 hover:text-white'
                    }`}
                  >
                    ⏱ Tiêu chuẩn (trong ngày)
                  </button>
                </div>
              </div>

              {/* SĐT liên hệ */}
              <div className="space-y-1">
                <label className="text-[11px] text-gray-300 font-medium flex items-center gap-1">
                  <Phone className="w-3 h-3 text-[#C5A880]" /> SĐT người ở nhà:
                </label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="Nhập SĐT tiếp thợ..."
                  className="w-full bg-[#161B22] border border-[#2D3748] text-xs text-white p-1.5 focus:outline-none focus:border-[#C5A880]"
                />
              </div>
            </div>
          )}

          {/* Ô Nhập Nội Dung Chi Tiết */}
          <div className="space-y-1">
            <label className="text-xs text-gray-300 font-medium">
              {ticketPurpose === 'INQUIRY'
                ? 'Nội dung câu hỏi:'
                : ticketPurpose === 'FEEDBACK'
                  ? 'Nội dung góp ý / phản ánh:'
                  : 'Mô tả hiện tượng hư hỏng:'}
            </label>
            <textarea
              rows={2}
              placeholder={
                ticketPurpose === 'INQUIRY'
                  ? 'VD: Giờ mở cửa hồ bơi, phòng gym, đăng ký thẻ cư dân...'
                  : ticketPurpose === 'FEEDBACK'
                    ? 'VD: Vệ sinh khu vực hành lang, tiếng ồn giờ nghỉ trưa...'
                    : 'VD: Vòi nước bồn rửa chén rò rỉ dưới gầm tủ, nhảy aptomat...'
              }
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              className="w-full bg-[#161B22] border border-[#2D3748] text-xs text-white p-2.5 focus:outline-none focus:border-[#C5A880] placeholder-gray-500 resize-none"
              required
            />
          </div>

          {/* Đính Kèm Ảnh & Hành Động */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#222B35]">
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage}
                className="px-2.5 py-1.5 bg-[#161B22] border border-[#2D3748] hover:border-[#C5A880] text-gray-300 hover:text-white text-xs flex items-center gap-1.5 transition-colors"
              >
                <Camera className="w-3.5 h-3.5 text-[#C5A880]" />
                {isUploadingImage ? 'Đang đọc ảnh...' : attachedImageBase64 ? 'Đổi ảnh' : 'Đính kèm ảnh'}
              </button>
              {attachedImageBase64 && (
                <div className="flex items-center gap-1.5">
                  <img
                    src={attachedImageBase64}
                    alt="Preview"
                    className="w-7 h-7 object-cover border border-[#C5A880]"
                  />
                  <button
                    type="button"
                    onClick={() => setAttachedImageBase64('')}
                    className="text-gray-400 hover:text-rose-400 text-xs px-1"
                    title="Gỡ ảnh"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-3.5 py-1.5 border border-gray-700 text-xs text-gray-300 hover:text-white transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors shadow flex items-center gap-1.5 disabled:opacity-60 ${
                  ticketPurpose === 'INQUIRY'
                    ? 'bg-sky-500 hover:bg-sky-400 text-black'
                    : ticketPurpose === 'FEEDBACK'
                      ? 'bg-rose-600 hover:bg-rose-500 text-white'
                      : 'bg-[#C5A880] hover:bg-white text-[#0D1117]'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Đang gửi...
                  </>
                ) : ticketPurpose === 'INQUIRY' ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Hỏi Trợ Lý AI
                  </>
                ) : ticketPurpose === 'FEEDBACK' ? (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Gửi Ban Quản Lý
                  </>
                ) : (
                  <>
                    <Wrench className="w-3.5 h-3.5" />
                    Gửi Yêu Cầu Sửa Chữa
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Feature Highlight: Interactive Before - After Comparison Slider */}
      <div className="bg-[#121820] border border-[#222B35] p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222B35] pb-3">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[#C5A880] font-semibold flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" /> Nghiệm Thu Hình Ảnh Kỹ Thuật
            </div>
            <h3 className="font-serif text-lg text-white font-bold mt-0.5">
              Hình Ảnh Đối Chiếu Trước & Sau Khi Sửa Chữa
            </h3>
          </div>

          {/* Ticket Selector if multiple resolved tickets with photos */}
          {comparisonTickets.length > 1 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-400">Xem phiếu:</span>
              <select
                value={activeComparisonTicket?.id || ''}
                onChange={(e) => setSelectedComparisonTicketId(e.target.value)}
                className="bg-[#161B22] border border-[#2D3748] text-white text-xs px-2.5 py-1 focus:outline-none focus:border-[#C5A880]"
              >
                {comparisonTickets.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.id} - {t.ai_category} (Nghiệm thu {new Date(t.resolved_at || t.updated_at).toLocaleDateString('vi-VN')})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {activeComparisonTicket ? (
          <div className="space-y-4">
            {/* Draggable Interactive Slider Container */}
            <div className="relative h-64 sm:h-80 bg-black border border-gray-700 overflow-hidden select-none">
              {/* After Image (Full background) */}
              <img
                src={activeComparisonTicket.after_image}
                alt="Sau khi sửa"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute top-3 right-3 bg-emerald-950/90 border border-emerald-500 text-emerald-300 px-2.5 py-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider z-10 shadow-lg">
                Sau Khi Sửa Xong ✓
              </div>

              {/* Before Image (Clipped by sliderPos percentage) */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
              >
                <img
                  src={activeComparisonTicket.before_image}
                  alt="Hiện trạng lúc báo"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 bg-red-950/90 border border-red-500 text-red-300 px-2.5 py-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider z-10 shadow-lg">
                  Hiện Trạng Lúc Cư Dân Báo
                </div>
              </div>

              {/* Vertical Divider Line */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white shadow-2xl z-20 pointer-events-none"
                style={{ left: `${sliderPos}%` }}
              />

              {/* Range Slider Control */}
              <input
                type="range"
                min="2"
                max="98"
                value={sliderPos}
                onChange={(e) => setSliderPos(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
              />

              {/* Draggable Vertical Divider Handle */}
              <div
                className="absolute top-1/2 -translate-y-1/2 pointer-events-none z-20 flex items-center justify-center -translate-x-1/2"
                style={{ left: `${sliderPos}%` }}
              >
                <div className="w-8 h-8 bg-white border-2 border-[#0D1117] text-[#0D1117] flex items-center justify-center text-xs font-bold shadow-2xl">
                  ↔
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-gray-400 gap-2">
              <span>* Kéo thanh trượt ngang để đối chiếu chất lượng thi công trước và sau của kỹ thuật viên.</span>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[#C5A880]">Mã phiếu: {activeComparisonTicket.id}</span>
                {activeComparisonTicket.resolution_notes && (
                  <span className="text-gray-300 italic">"{activeComparisonTicket.resolution_notes}"</span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-12 px-6 text-center border border-dashed border-[#2D3748] bg-[#161B22]/40 space-y-2.5">
            <div className="w-10 h-10 rounded-none bg-[#1C2533] border border-[#2D3748] text-[#C5A880] flex items-center justify-center mx-auto">
              <Sliders className="w-5 h-5" />
            </div>
            <div className="text-xs text-gray-300 font-semibold">Chưa có phiếu sửa chữa nào được nghiệm thu kèm hình ảnh</div>
            <p className="text-[11px] text-gray-500 max-w-md mx-auto leading-relaxed">
              Công cụ đối chiếu hình ảnh Trước / Sau sẽ tự động kích hoạt ngay khi Kỹ thuật viên hoàn tất sửa chữa và tải lên ảnh nghiệm thu thực tế cho phiếu sự cố của căn hộ.
            </p>
          </div>
        )}
      </div>

      {/* Tickets List */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs uppercase tracking-wider text-gray-400 font-semibold border-b border-[#222B35] pb-2">
          <div className="flex items-center gap-2">
            <span>Danh Sách Yêu Cầu Căn Hộ {aptCode} ({tickets.length})</span>
            <span className="px-2 py-0.5 bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-[10px] font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Kết Nối Trực Tuyến
            </span>
          </div>
          <button 
            onClick={handleRefreshSync} 
            disabled={isSyncing}
            className="text-gray-400 hover:text-white flex items-center gap-1.5 text-[11px] disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-[#C5A880]' : ''}`} />
            {isSyncing ? 'Đang cập nhật...' : 'Cập nhật'}
          </button>
        </div>

        {tickets.length === 0 ? (
          <div className="p-8 bg-[#121820] border border-[#222B35] text-center text-gray-400 text-xs">
            Hiện căn hộ {aptCode} chưa có yêu cầu sửa chữa nào.
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((t) => {
              const isFeedback = t.ticket_type === 'FEEDBACK';
              const isInquiry = t.ticket_type === 'INQUIRY';
              const isRepair = !isFeedback && !isInquiry;

              return (
                <div 
                  key={t.id} 
                  className={`p-4 bg-[#121820] border transition-all space-y-3 text-xs ${
                    t.status === 'Resolved' 
                      ? 'border-emerald-500/40 bg-gradient-to-r from-[#121820] to-[#0d1e15]' 
                      : t.status === 'In_Progress'
                        ? 'border-amber-500/40 bg-gradient-to-r from-[#121820] to-[#1e1a0f]'
                        : isFeedback
                          ? 'border-rose-500/40'
                          : isInquiry
                            ? 'border-sky-500/40'
                            : 'border-[#222B35]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[#C5A880] font-bold text-sm">
                        {t.nks_id ? `#${t.nks_id}` : `#${t.id.replace('TICK-', '')}`}
                      </span>
                      
                      {isFeedback ? (
                        <span className="px-2 py-0.5 bg-rose-950 text-rose-300 border border-rose-500 text-[10px] font-bold">
                          📢 Góp Ý & Phản Ánh
                        </span>
                      ) : isInquiry ? (
                        <span className="px-2 py-0.5 bg-sky-950 text-sky-300 border border-sky-500 text-[10px] font-bold">
                          💬 Hỏi Đáp • AI 24/7
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 bg-[#1C2533] border border-gray-700 text-gray-300 text-[10px] font-mono">
                          🔧 {t.ai_category}
                        </span>
                      )}

                      <span className="text-[11px] text-gray-400">
                        {new Date(t.created_at).toLocaleString('vi-VN')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 font-semibold text-[10px] uppercase tracking-wider flex items-center gap-1.5 ${
                        t.status === 'Resolved' 
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-600' 
                          : t.status === 'In_Progress' || t.status === 'Assigned'
                            ? 'bg-amber-950 text-amber-400 border border-amber-600 animate-pulse'
                            : isFeedback
                              ? 'bg-rose-950 text-rose-400 border border-rose-600'
                              : 'bg-blue-950 text-blue-400 border border-blue-600'
                      }`}>
                        {isInquiry ? (
                          t.status === 'Resolved' ? <>✓ AI Đã Giải Đáp Tức Thì</> : <>⏳ Chờ BQL Xác Nhận</>
                        ) : isFeedback ? (
                          t.status === 'Resolved' ? <>✓ BQL Đã Phản Hồi</> : <>⏳ BQL Đang Thụ Lý</>
                        ) : (
                          t.status === 'Resolved' 
                            ? <>✓ Đã Nghiệm Thu Xong</> 
                            : t.status === 'In_Progress' || t.status === 'Assigned'
                              ? <>⏱ KTV Đang Xử Lý</>
                              : <>⏳ Chờ BQL Tiếp Nhận</>
                        )}
                      </span>

                      {/* Nút Đánh giá 5 sao cho KTV nếu phiếu sửa chữa đã hoàn tất */}
                      {isRepair && t.status === 'Resolved' && (
                        <button
                          onClick={() => {
                            setRatingModalTicket(t);
                            setSelectedRating(t.rating || 5);
                            setFeedbackText(t.resident_feedback || '');
                          }}
                          className="px-2.5 py-1 bg-yellow-500/20 hover:bg-yellow-500 text-yellow-300 hover:text-[#0D1117] border border-yellow-500/40 text-[10px] font-bold transition-all flex items-center gap-1"
                        >
                          <Star className="w-3 h-3 fill-current" />
                          {t.rating ? `${t.rating} ⭐ (Xem Đánh Giá)` : 'Chấm Điểm KTV'}
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-gray-200 text-xs leading-relaxed">{t.content}</p>

                  {/* THÔNG TIN KTV CHO PHIẾU BÁO HỎNG */}
                  {isRepair && (t.assigned_technician || t.suggested_technician) && (
                    <div className="p-2.5 bg-[#161F2B] border border-[#2D3A4B] flex items-center justify-between text-xs flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Wrench className="w-3.5 h-3.5 text-amber-400" />
                        {t.assigned_technician ? (
                          <span>KTV Phụ trách: <strong className="text-white">{t.assigned_technician}</strong></span>
                        ) : (
                          <span className="text-gray-300">
                            KTV AI đề xuất: <strong className="text-amber-300">{t.suggested_technician}</strong>{' '}
                            <span className="text-[10px] text-gray-400">(Chờ BQL duyệt ca trực)</span>
                          </span>
                        )}
                      </div>
                      {t.scheduled_time && (
                        <span className="text-gray-400 text-[11px] font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#C5A880]" /> {t.scheduled_time}
                        </span>
                      )}
                    </div>
                  )}

                  {/* GỢI Ý THAM KHẢO CỦA AI NẾU LÀ CÂU HỎI VÀ ĐANG CHỜ BQL */}
                  {isInquiry && t.ai_suggested_reply && !t.admin_reply && !t.ai_reply && (
                    <div className="p-3 bg-sky-950/30 border border-sky-500/30 space-y-1">
                      <div className="text-[11px] font-bold text-sky-300 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-sky-400" /> Gợi Ý Nhanh Từ Trợ Lý AI:
                        </span>
                        <span className="text-[10px] text-amber-400 font-normal">Đang chờ BQL xác nhận chính thức</span>
                      </div>
                      <p className="text-gray-300 text-xs whitespace-pre-line leading-relaxed">
                        {t.ai_suggested_reply}
                      </p>
                    </div>
                  )}

                  {/* CÂU TRẢ LỜI CỦA AI NẾU ĐÃ CHÍNH THỨC GIẢI ĐÁP */}
                  {isInquiry && t.ai_reply && (
                    <div className="p-3 bg-sky-950/40 border border-sky-500/40 space-y-1">
                      <div className="text-[11px] font-bold text-sky-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-sky-400" /> 
                        Giải Đáp Từ Trợ Lý AI Skyline (Tự Động 24/7):
                      </div>
                      <p className="text-gray-200 text-xs whitespace-pre-line leading-relaxed">
                        {t.ai_reply}
                      </p>
                    </div>
                  )}

                  {/* PHẢN HỒI TỪ BQL NẾU CÓ HOẶC LÀ FEEDBACK */}
                  {(isFeedback || t.admin_reply) && (
                    t.admin_reply ? (
                      <div className="p-3 bg-rose-950/40 border border-rose-500/40 space-y-1">
                        <div className="text-[11px] font-bold text-rose-300 flex items-center gap-1.5">
                          <BadgeCheck className="w-3.5 h-3.5 text-rose-400" />
                          Phản hồi chính thức từ {t.admin_replied_by || 'Ban Quản Lý Skyline'}:
                        </div>
                        <p className="text-gray-200 text-xs italic leading-relaxed">
                          "{t.admin_reply}"
                        </p>
                        {t.admin_replied_at && (
                          <div className="text-[10px] text-gray-400 text-right">
                            {new Date(t.admin_replied_at).toLocaleTimeString('vi-VN')} {new Date(t.admin_replied_at).toLocaleDateString('vi-VN')}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-2.5 bg-[#161B22] border border-[#222B35] text-[11px] text-gray-400 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Ban Quản Lý đang xác minh và kiểm tra hiện trường để gửi văn bản phản hồi.</span>
                      </div>
                    )
                  )}

                  {/* ẢNH HIỆN TRƯỜNG & NGHIỆM THU */}
                  {(t.before_image || t.after_image) && (
                    <div className="flex items-center gap-4 pt-1">
                      {t.before_image && (
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                          <img 
                            src={t.before_image} 
                            alt="Ảnh lúc báo" 
                            className="w-10 h-10 object-cover border border-red-500/40"
                          />
                          <span>Ảnh hiện trường</span>
                        </div>
                      )}
                      {t.after_image && (
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                          <img 
                            src={t.after_image} 
                            alt="Ảnh nghiệm thu" 
                            className="w-10 h-10 object-cover border border-emerald-500/40"
                          />
                          <span className="text-emerald-400 font-medium">Ảnh nghiệm thu</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* FOOTER BAR: TUỲ THEO LOẠI TICKET */}
                  <div className="pt-2 border-t border-[#222B35] flex flex-wrap items-center justify-between gap-3 text-[11px]">
                    {isInquiry ? (
                      <span className="text-sky-300 font-medium flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-sky-400" />
                        Trợ lý AI tự động hỗ trợ 24/7 • Cần gặp trực tiếp: 0364 967 082
                      </span>
                    ) : isFeedback ? (
                      <span className="text-rose-300 font-medium flex items-center gap-1.5">
                        <MessageSquare className="w-3 h-3 text-rose-400" />
                        Chuyên viên CSKH & Ban Quản Lý chịu trách nhiệm thụ lý
                      </span>
                    ) : (
                      <>
                        <div className="flex items-center gap-4 text-gray-400">
                          <span>
                            Kỹ thuật viên phụ trách: {' '}
                            <strong className="text-white">
                              {t.assigned_technician || 'Ban Quản Lý đang điều phối'}
                            </strong>
                          </span>

                          {t.assigned_technician_phone && (
                            <a 
                              href={`tel:${t.assigned_technician_phone}`} 
                              className="text-[#C5A880] hover:underline flex items-center gap-1"
                            >
                              <Phone className="w-3 h-3" /> {t.assigned_technician_phone}
                            </a>
                          )}
                        </div>

                        {t.scheduled_time && (
                          <span className="text-amber-400 font-mono">
                            Hẹn đến: {t.scheduled_time}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5-Star Rating Modal */}
      {ratingModalTicket && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121820] border border-[#C5A880] max-w-md w-full p-6 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#222B35] pb-3">
              <div className="flex items-center gap-2 text-white font-serif font-bold">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <span>Đánh Giá Chất Lượng Dịch Vụ Kỹ Thuật</span>
              </div>
              <button 
                onClick={() => setRatingModalTicket(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-[#161B22] border border-[#222B35] text-xs space-y-1">
              <div>Phiếu xử lý: <strong className="text-[#C5A880] font-mono">{ratingModalTicket.id}</strong></div>
              <div>Kỹ thuật viên: <strong className="text-white">{ratingModalTicket.assigned_technician || 'Kỹ thuật viên chung cư'}</strong></div>
            </div>

            {/* Interactive Stars */}
            <div className="space-y-1 text-center py-2">
              <div className="text-xs text-gray-300">Quý cư dân hài lòng với thái độ và kết quả sửa chữa chứ?</div>
              <div className="flex items-center justify-center gap-2 pt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setSelectedRating(star)}
                    className="p-1 transition-transform hover:scale-125 focus:outline-none"
                  >
                    <Star 
                      className={`w-7 h-7 ${
                        star <= selectedRating 
                          ? 'text-yellow-400 fill-yellow-400' 
                          : 'text-gray-600'
                      }`} 
                    />
                  </button>
                ))}
              </div>
              <div className="text-[11px] font-mono text-[#C5A880] font-bold pt-1">
                {selectedRating === 5 ? '⭐⭐⭐⭐⭐ Xuất sắc (+50.000đ thưởng KTV)' :
                 selectedRating === 4 ? '⭐⭐⭐⭐ Rất tốt' :
                 selectedRating === 3 ? '⭐⭐⭐ Bình thường' :
                 selectedRating === 2 ? '⭐⭐ Cần cải thiện' : '⭐ Không hài lòng'}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-300">Ý kiến nhận xét thêm (Tùy chọn):</label>
              <textarea
                rows={2}
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="VD: Kỹ thuật viên rất chu đáo, dọn dẹp sạch sẽ sau khi sửa..."
                className="w-full bg-[#161B22] border border-[#2D3748] text-xs text-white p-2.5 focus:outline-none focus:border-[#C5A880]"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRatingModalTicket(null)}
                className="px-4 py-2 border border-gray-700 text-xs text-gray-300"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleSubmitRating}
                className="px-5 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-colors shadow-lg"
              >
                Gửi Đánh Giá
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
