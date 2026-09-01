'use client';

import React, { useState } from 'react';
import { DEMO_TICKETS, ServiceRequest } from '@/lib/dataStore';
import { Wrench, Clock, Sparkles, Plus, CheckCircle2, Sliders, Eye } from 'lucide-react';

export default function TicketService() {
  const [tickets, setTickets] = useState<ServiceRequest[]>(DEMO_TICKETS);
  const [sliderPos, setSliderPos] = useState<number>(50); // 50% for before-after slider
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [content, setContent] = useState('');
  const [aiDetectedCat, setAiDetectedCat] = useState<'Điện' | 'Nước' | 'Khác'>('Nước');
  const [createdSuccess, setCreatedSuccess] = useState(false);

  // Active ticket for Before/After Slider demonstration
  const activeComparisonTicket = tickets[0];

  const handleContentChange = (text: string) => {
    setContent(text);
    // AI NLP Auto-categorization simulation
    if (text.toLowerCase().includes('nước') || text.toLowerCase().includes('vòi') || text.toLowerCase().includes('rỉ')) {
      setAiDetectedCat('Nước');
    } else if (text.toLowerCase().includes('điện') || text.toLowerCase().includes('đèn') || text.toLowerCase().includes('aptomat')) {
      setAiDetectedCat('Điện');
    } else {
      setAiDetectedCat('Khác');
    }
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const newTicket: ServiceRequest = {
      id: `TICK-${Math.floor(100 + Math.random() * 900)}`,
      apartment_id: 'apt-12a05',
      apt_code: '12A05',
      resident_name: 'Nguyễn Hữu Lực',
      resident_phone: '0903112233',
      content: content,
      ai_category: aiDetectedCat,
      ai_priority: aiDetectedCat === 'Nước' ? 1 : 2,
      priority_color: aiDetectedCat === 'Nước' ? '#DC2626' : '#D97706',
      sla_deadline: new Date(Date.now() + 3600000).toISOString(),
      sla_minutes_left: 60,
      status: 'Open',
      before_image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800',
      after_image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setTickets([newTicket, ...tickets]);
    setContent('');
    setShowCreateForm(false);
    setCreatedSuccess(true);
    setTimeout(() => setCreatedSuccess(false), 3000);
  };

  return (
    <div className="space-y-8 w-full animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222B35] pb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-semibold">
            Module 3.2.2 (SRS Specification)
          </div>
          <h2 className="font-serif text-2xl text-white font-bold mt-1">
            Yêu Cầu Hỗ Trợ & Nghiệm Thu Trước - Sau (Ticketing)
          </h2>
        </div>

        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Báo Sự Cố Mới
        </button>
      </div>

      {createdSuccess && (
        <div className="p-3 bg-emerald-950 border border-emerald-500 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> Phiếu yêu cầu đã được tiếp nhận và phân công vào hàng đợi Kanban BQL!
        </div>
      )}

      {/* Create Ticket Form */}
      {showCreateForm && (
        <form onSubmit={handleCreateTicket} className="p-6 bg-[#121820] border border-[#C5A880] space-y-4">
          <div className="flex items-center justify-between border-b border-[#222B35] pb-2 text-xs">
            <span className="font-serif font-bold text-white uppercase tracking-wider">Tạo Phiếu Phản Ánh Kỹ Thuật</span>
            <span className="text-gray-400">Cam kết phản hồi &lt; 15 phút</span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-gray-300">Mô tả chi tiết sự cố:</label>
            <textarea
              rows={3}
              placeholder="VD: Vòi sen nhà tắm master bị rò rỉ nước, cần kỹ thuật kiểm tra gấp..."
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              className="w-full bg-[#161B22] border border-[#2D3748] text-xs text-white p-3 focus:outline-none focus:border-[#C5A880]"
              required
            />
          </div>

          {/* AI NLP Indicator */}
          <div className="p-3 bg-[#161B22] border border-[#222B35] flex items-center justify-between text-xs">
            <span className="text-gray-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" /> AI Phân loại tự động:
            </span>
            <span className="px-2 py-0.5 bg-[#1C2533] border border-[#C5A880] text-[#C5A880] font-mono font-bold">
              {aiDetectedCat} (Độ ưu tiên: {aiDetectedCat === 'Nước' ? 'Khẩn Cấp' : 'Bình Thường'})
            </span>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 bg-transparent border border-gray-700 text-xs text-gray-300"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#C5A880] text-[#0D1117] text-xs font-bold uppercase tracking-wider"
            >
              Gửi Yêu Cầu
            </button>
          </div>
        </form>
      )}

      {/* Feature Highlight: Interactive Before - After Comparison Slider */}
      <div className="bg-[#121820] border border-[#222B35] p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#222B35] pb-3">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[#C5A880] font-semibold flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" /> Tính Năng UI Đặc Thù (SRS Mục 4 & 5)
            </div>
            <h3 className="font-serif text-lg text-white font-bold mt-0.5">
              Thanh Trượt So Sánh Hình Ảnh Nghiệm Thu (Before / After Comparison)
            </h3>
          </div>
          <span className="text-xs font-mono text-gray-400">Phiếu: {activeComparisonTicket.id}</span>
        </div>

        {/* Draggable Interactive Slider Container */}
        <div className="relative h-64 sm:h-80 bg-black border border-gray-700 overflow-hidden select-none">
          {/* After Image (Full background) */}
          <img
            src={activeComparisonTicket.after_image}
            alt="After"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute top-3 right-3 bg-emerald-950/90 border border-emerald-500 text-emerald-300 px-2.5 py-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider z-10">
            Sau Khi Sửa Xong ✓
          </div>

          {/* Before Image (Clipped by sliderPos percentage) */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
          >
            <img
              src={activeComparisonTicket.before_image}
              alt="Before"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute top-3 left-3 bg-red-950/90 border border-red-500 text-red-300 px-2.5 py-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider z-10">
              Hiện Trạng Trước Khi Sửa
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

        <div className="flex justify-between items-center text-xs text-gray-400">
          <span>* Kéo thanh trượt ngang để đối chiếu chất lượng thi công của đội ngũ kỹ thuật.</span>
          <span className="font-mono text-[#C5A880]">Vị trí trượt: {sliderPos}%</span>
        </div>
      </div>

      {/* Tickets List */}
      <div className="space-y-3">
        <div className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
          Lịch Sử Yêu Cầu Căn 12A05:
        </div>

        <div className="space-y-3">
          {tickets.map((t) => (
            <div key={t.id} className="p-4 bg-[#121820] border border-[#222B35] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[#C5A880] font-bold">{t.id}</span>
                <span className={`px-2 py-0.5 font-semibold text-[10px] uppercase ${
                  t.status === 'Resolved' ? 'bg-emerald-950 text-emerald-400 border border-emerald-600' : 'bg-amber-950 text-amber-400 border border-amber-600'
                }`}>
                  {t.status === 'Resolved' ? 'Đã Nghiệm Thu Xong' : 'Đang Xử Lý (Kỹ Thuật)'}
                </span>
              </div>
              <p className="text-gray-200">{t.content}</p>
              <div className="flex justify-between text-[11px] text-gray-500 pt-1 border-t border-[#222B35]">
                <span>Phân loại AI: <strong className="text-gray-300">{t.ai_category}</strong></span>
                <span>Kỹ thuật viên: <strong className="text-gray-300">{t.assigned_technician || 'Đang điều phối'}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
