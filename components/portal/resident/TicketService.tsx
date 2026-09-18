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
  RefreshCw
} from 'lucide-react';
import { User as UserType } from '@/lib/dataStore';
import { 
  getTickets, 
  createTicket, 
  rateTicket, 
  ExtendedServiceRequest 
} from '@/lib/ticketStore';
import { fileToBase64 } from '@/lib/imageUtils';

interface TicketServiceProps {
  currentUser?: UserType;
}

export default function TicketService({ currentUser }: TicketServiceProps) {
  const aptCode = currentUser?.apartment_code || '12A05';
  const residentName = currentUser?.full_name || (currentUser as any)?.fullname || 'Nguyễn Hữu Lực';
  const residentPhone = currentUser?.phone || '0364967082';

  const [tickets, setTickets] = useState<ExtendedServiceRequest[]>([]);
  const [sliderPos, setSliderPos] = useState<number>(50); // 50% for before-after slider
  const [selectedComparisonTicketId, setSelectedComparisonTicketId] = useState<string>('');
  
  // Create Form State
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [content, setContent] = useState('');
  const [aiDetectedCat, setAiDetectedCat] = useState<'Điện' | 'Nước' | 'Khác'>('Nước');
  const [attachedImageBase64, setAttachedImageBase64] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [createdSuccessMsg, setCreatedSuccessMsg] = useState<string | null>(null);
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

  useEffect(() => {
    refreshTicketList();
    const handleUpdate = () => refreshTicketList();
    window.addEventListener('skyline_tickets_updated', handleUpdate);
    return () => window.removeEventListener('skyline_tickets_updated', handleUpdate);
  }, [aptCode]);

  // Chọn ticket so sánh: các phiếu đã giải quyết (Resolved) có cả 2 ảnh thật (trước & sau)
  const comparisonTickets = tickets.filter(t => t.status === 'Resolved' && t.before_image && t.after_image);
  const activeComparisonTicket = comparisonTickets.find(t => t.id === selectedComparisonTicketId) 
    || comparisonTickets[0];

  const handleContentChange = (text: string) => {
    setContent(text);
    const lower = text.toLowerCase();
    if (lower.includes('nước') || lower.includes('vòi') || lower.includes('rỉ') || lower.includes('nghẹt') || lower.includes('bồn')) {
      setAiDetectedCat('Nước');
    } else if (lower.includes('điện') || lower.includes('đèn') || lower.includes('aptomat') || lower.includes('chập') || lower.includes('ổ cắm')) {
      setAiDetectedCat('Điện');
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

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    // Sử dụng ảnh thật cư dân đính kèm nếu có, tuyệt đối không dùng ảnh mạng giả lập
    const beforeImage = attachedImageBase64 || '';

    const newTicket = createTicket({
      apt_code: aptCode,
      resident_name: residentName,
      resident_phone: residentPhone,
      content: content.trim(),
      ai_category: aiDetectedCat,
      before_image: beforeImage,
    });

    setContent('');
    setAttachedImageBase64('');
    setShowCreateForm(false);
    setCreatedSuccessMsg(`Yêu cầu #${newTicket.id} đã được gửi tới Ban Quản Lý và đang chờ tiếp nhận!`);
    setTimeout(() => setCreatedSuccessMsg(null), 4000);
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
            <Wrench className="w-3.5 h-3.5" /> Hỗ Trợ Kỹ Thuật • Căn Hộ {aptCode}
          </div>
          <h2 className="font-serif text-2xl text-white font-bold mt-1">
            Báo Hỏng & Đề Nghị Sửa Chữa
          </h2>
        </div>

        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-lg"
        >
          <Plus className="w-4 h-4" /> Báo Sự Cố Mới
        </button>
      </div>

      {createdSuccessMsg && (
        <div className="p-3.5 bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{createdSuccessMsg}</span>
        </div>
      )}

      {rateSuccessMsg && (
        <div className="p-3.5 bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
          <Sparkles className="w-4 h-4 text-yellow-400 flex-shrink-0" />
          <span>{rateSuccessMsg}</span>
        </div>
      )}

      {/* Create Ticket Form */}
      {showCreateForm && (
        <form onSubmit={handleCreateTicket} className="p-6 bg-[#121820] border border-[#C5A880] space-y-4 shadow-2xl animate-fadeIn">
          <div className="flex items-center justify-between border-b border-[#222B35] pb-2 text-xs">
            <span className="font-serif font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-[#C5A880]" /> Tạo Phiếu Báo Sự Cố Căn Hộ {aptCode}
            </span>
            <span className="text-gray-400">Kỹ thuật viên có mặt trong 15 - 45 phút</span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-gray-300 font-medium">Mô tả chi tiết hiện trạng hỏng hóc:</label>
            <textarea
              rows={3}
              placeholder="VD: Vòi sen nhà tắm master bị rò rỉ nước liên tục, nước tràn ra sàn phòng vệ sinh..."
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              className="w-full bg-[#161B22] border border-[#2D3748] text-xs text-white p-3 focus:outline-none focus:border-[#C5A880] placeholder-gray-500"
              required
            />
          </div>

          {/* AI NLP Indicator */}
          <div className="p-3 bg-[#161B22] border border-[#222B35] flex items-center justify-between text-xs">
            <span className="text-gray-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" /> AI tự động phân loại:
            </span>
            <span className="px-2.5 py-0.5 bg-[#1C2533] border border-[#C5A880] text-[#C5A880] font-mono font-bold">
              {aiDetectedCat} (Mức độ: {aiDetectedCat === 'Nước' ? 'Khẩn Cấp (SLA 45p)' : 'Bình Thường (SLA 120p)'})
            </span>
          </div>

          {/* Attach Before Photo (Image -> Base64) */}
          <div className="space-y-2 pt-1">
            <label className="text-xs text-gray-300 font-medium flex items-center justify-between">
              <span>Đính kèm hình ảnh hiện trường sự cố:</span>
              <span className="text-[11px] text-gray-400 font-mono">* Tự động chuyển đổi Base64 đồng bộ BQL</span>
            </label>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage}
                className="px-3.5 py-2 bg-[#161B22] border border-[#2D3748] hover:border-[#C5A880] text-gray-300 hover:text-white text-xs flex items-center gap-2 transition-colors"
              >
                <Camera className="w-3.5 h-3.5 text-[#C5A880]" />
                {isUploadingImage ? 'Đang đọc ảnh...' : attachedImageBase64 ? 'Đổi Ảnh Khác' : 'Chụp / Tải Ảnh Hiện Trường'}
              </button>

              {attachedImageBase64 && (
                <div className="flex items-center gap-2">
                  <img
                    src={attachedImageBase64}
                    alt="Preview"
                    className="w-10 h-10 object-cover border border-[#C5A880]"
                  />
                  <span className="text-xs text-emerald-400 font-medium">Đã đính kèm ảnh ✓</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[#222B35]">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 bg-transparent border border-gray-700 text-xs text-gray-300 hover:text-white"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-colors shadow-lg"
            >
              Gửi Tới BQL Ngay
            </button>
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
              Hình Ảnh Trước & Sau Sửa Chữa (Before / After)
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
              Công cụ đối chiếu chất lượng Before/After sẽ tự động kích hoạt ngay khi Kỹ thuật viên hoàn tất sửa chữa và tải lên ảnh nghiệm thu thực tế cho phiếu sự cố của căn hộ.
            </p>
          </div>
        )}
      </div>

      {/* Tickets List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs uppercase tracking-wider text-gray-400 font-semibold border-b border-[#222B35] pb-2">
          <span>Danh Sách Yêu Cầu Căn Hộ {aptCode} ({tickets.length}):</span>
          <button onClick={refreshTicketList} className="text-gray-400 hover:text-white flex items-center gap-1 text-[11px]">
            <RefreshCw className="w-3 h-3" /> Làm mới
          </button>
        </div>

        {tickets.length === 0 ? (
          <div className="p-8 bg-[#121820] border border-[#222B35] text-center text-gray-400 text-xs">
            Hiện căn hộ {aptCode} chưa có yêu cầu sửa chữa nào.
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((t) => (
              <div 
                key={t.id} 
                className={`p-4 bg-[#121820] border transition-all space-y-3 text-xs ${
                  t.status === 'Resolved' 
                    ? 'border-emerald-500/40 bg-gradient-to-r from-[#121820] to-[#0d1e15]' 
                    : t.status === 'In_Progress'
                      ? 'border-amber-500/40 bg-gradient-to-r from-[#121820] to-[#1e1a0f]'
                      : 'border-[#222B35]'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[#C5A880] font-bold text-sm">{t.id}</span>
                    <span className="px-2 py-0.5 bg-[#1C2533] border border-gray-700 text-gray-300 text-[10px] font-mono">
                      {t.ai_category}
                    </span>
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
                          : 'bg-blue-950 text-blue-400 border border-blue-600'
                    }`}>
                      {t.status === 'Resolved' ? (
                        <>✓ Đã Nghiệm Thu Xong</>
                      ) : t.status === 'In_Progress' || t.status === 'Assigned' ? (
                        <>⏱ KTV Đang Xử Lý</>
                      ) : (
                        <>⏳ Chờ BQL Tiếp Nhận</>
                      )}
                    </span>

                    {/* Nút Đánh giá 5 sao cho KTV nếu phiếu đã hoàn tất */}
                    {t.status === 'Resolved' && (
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

                {/* Technician & Action Status Bar */}
                <div className="pt-2 border-t border-[#222B35] flex flex-wrap items-center justify-between gap-3 text-[11px]">
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
                </div>
              </div>
            ))}
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
              <div>Kỹ thuật viên: <strong className="text-white">{ratingModalTicket.assigned_technician || 'Kỹ thuật viên tòa nhà'}</strong></div>
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
