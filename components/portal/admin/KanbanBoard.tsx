'use client';

import React, { useState } from 'react';
import { DEMO_TICKETS, ServiceRequest } from '@/lib/dataStore';
import { Clock, User, Phone, Wrench, CheckCircle2, ArrowRight, Eye, Sparkles, Filter, Upload, Camera, ShieldCheck } from 'lucide-react';

export default function KanbanBoard() {
  const [tickets, setTickets] = useState<ServiceRequest[]>(DEMO_TICKETS);
  const [selectedTicket, setSelectedTicket] = useState<ServiceRequest | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [uploadedAfterPreview, setUploadedAfterPreview] = useState<string | null>(null);

  const moveTicketStatus = (ticketId: string, newStatus: ServiceRequest['status']) => {
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        return { 
          ...t, 
          status: newStatus, 
          updated_at: new Date().toISOString(),
          after_image: uploadedAfterPreview || t.after_image 
        };
      }
      return t;
    }));
  };

  const handleSimulatePhotoUpload = () => {
    setIsUploadingPhoto(true);
    setTimeout(() => {
      setUploadedAfterPreview('https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&auto=format&fit=crop&q=80');
      setIsUploadingPhoto(false);
    }, 600);
  };

  const openTickets = tickets.filter(t => t.status === 'Open');
  const inProgressTickets = tickets.filter(t => t.status === 'In_Progress' || t.status === 'Assigned');
  const resolvedTickets = tickets.filter(t => t.status === 'Resolved');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222B35] pb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-semibold flex items-center gap-1.5">
            <Wrench className="w-3.5 h-3.5" /> Vận Hành & Điều Phối Kỹ Thuật Hiện Trường
          </div>
          <h2 className="font-serif text-2xl text-white font-bold mt-1">
            Bảng Điều Phối Sự Cố & Giám Sát Tiến Độ Kỹ Thuật
          </h2>
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-300">
          <span>Tổng số phiếu: <strong className="text-white font-mono">{tickets.length}</strong></span>
          <span className="text-amber-400 font-medium">• Đang xử lý: {inProgressTickets.length}</span>
          <span className="text-emerald-400 font-medium">• Đã hoàn tất: {resolvedTickets.length}</span>
        </div>
      </div>

      {/* 3 Kanban Columns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Open / Chờ tiếp nhận */}
        <div className="bg-[#121820] border border-[#222B35] flex flex-col justify-between">
          <div className="p-4 border-b border-[#222B35] flex items-center justify-between bg-[#161B22]">
            <span className="text-xs uppercase tracking-wider font-semibold text-gray-300 flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-blue-500 rounded-none"></span>
              Chờ Tiếp Nhận ({openTickets.length})
            </span>
            <span className="text-[10px] font-mono text-gray-500">Mới gửi từ App Cư dân</span>
          </div>

          <div className="p-4 space-y-4 min-h-[420px] overflow-y-auto">
            {openTickets.length === 0 ? (
              <div className="text-xs text-gray-500 italic text-center py-12">
                Không có phiếu chờ tiếp nhận
              </div>
            ) : (
              openTickets.map((ticket) => renderTicketCard(ticket))
            )}
          </div>
        </div>

        {/* Column 2: In Progress / Đang xử lý */}
        <div className="bg-[#121820] border border-[#222B35] flex flex-col justify-between">
          <div className="p-4 border-b border-[#222B35] flex items-center justify-between bg-[#161B22]">
            <span className="text-xs uppercase tracking-wider font-semibold text-amber-300 flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-amber-500 rounded-none"></span>
              Đang Xử Lý & Kỹ Thuật Viên ({inProgressTickets.length})
            </span>
            <span className="text-[10px] font-mono text-amber-400/80">SLA Countdown Active</span>
          </div>

          <div className="p-4 space-y-4 min-h-[420px] overflow-y-auto">
            {inProgressTickets.map((ticket) => renderTicketCard(ticket))}
          </div>
        </div>

        {/* Column 3: Resolved / Hoàn tất */}
        <div className="bg-[#121820] border border-[#222B35] flex flex-col justify-between">
          <div className="p-4 border-b border-[#222B35] flex items-center justify-between bg-[#161B22]">
            <span className="text-xs uppercase tracking-wider font-semibold text-emerald-300 flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-none"></span>
              Đã Xử Lý & Nghiệm Thu ({resolvedTickets.length})
            </span>
            <span className="text-[10px] font-mono text-emerald-400/80">Ảnh Trước - Sau ✓</span>
          </div>

          <div className="p-4 space-y-4 min-h-[420px] overflow-y-auto">
            {resolvedTickets.map((ticket) => renderTicketCard(ticket))}
          </div>
        </div>
      </div>

      {/* Ticket Detail & Field Tech Photo Upload Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-[#0D1117] border border-[#C5A880] max-w-2xl w-full p-6 text-white space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#222B35] pb-3">
              <div>
                <span className="text-xs text-[#C5A880] font-mono font-bold">MÃ PHIẾU SỰ CỐ: {selectedTicket.id}</span>
                <h3 className="font-serif text-lg font-bold text-white">Căn {selectedTicket.apt_code} - {selectedTicket.resident_name}</h3>
              </div>
              <button onClick={() => { setSelectedTicket(null); setUploadedAfterPreview(null); }} className="text-gray-400 hover:text-white text-sm">✕ Đóng</button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-[#121820] p-3.5 border border-[#222B35]">
              <div><strong>Nội dung:</strong> <span className="text-gray-300">{selectedTicket.content}</span></div>
              <div><strong>Phân loại AI:</strong> <span className="text-[#C5A880] font-semibold">{selectedTicket.ai_category}</span></div>
              <div><strong>Độ ưu tiên:</strong> <span className="text-red-400 font-bold">Mức {selectedTicket.ai_priority}</span></div>
              <div><strong>Kỹ thuật viên phụ trách:</strong> <span className="text-gray-200">{selectedTicket.assigned_technician || 'Lê Văn Kỹ Thuật (Ca trực)'}</span></div>
            </div>

            {/* Before-After Photo Comparison & Field Tech Upload */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs uppercase tracking-wider font-semibold text-[#C5A880]">
                <span>Ảnh Nghiệm Thu Trước & Sau Khi Sửa Chữa:</span>
                <button
                  type="button"
                  onClick={handleSimulatePhotoUpload}
                  disabled={isUploadingPhoto}
                  className="text-[10px] text-white bg-[#1C2533] border border-[#C5A880]/60 px-2 py-1 flex items-center gap-1 hover:bg-[#C5A880] hover:text-[#0D1117] transition-all"
                >
                  <Camera className="w-3 h-3" /> {isUploadingPhoto ? 'Đang tải ảnh...' : 'Kỹ thuật viên tải ảnh Sau (After)'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] text-gray-400 mb-1">Hiện trạng lúc cư dân gửi báo hỏng (Before):</div>
                  <img src={selectedTicket.before_image} alt="Before" className="h-40 w-full object-cover border border-gray-700" />
                </div>
                <div>
                  <div className="text-[10px] text-emerald-400 mb-1 font-semibold">Kết quả hoàn thành sửa chữa (After):</div>
                  <img 
                    src={uploadedAfterPreview || selectedTicket.after_image} 
                    alt="After" 
                    className="h-40 w-full object-cover border border-emerald-500 shadow-md" 
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-3 border-t border-[#222B35]">
              <div className="text-[11px] text-gray-400 font-mono">
                SLA Cam kết: <span className="text-amber-400 font-bold">{selectedTicket.sla_minutes_left} phút</span>
              </div>

              <div className="flex gap-2">
                {selectedTicket.status === 'Open' && (
                  <button
                    onClick={() => {
                      moveTicketStatus(selectedTicket.id, 'In_Progress');
                      setSelectedTicket(null);
                    }}
                    className="px-4 py-2 bg-[#C5A880] text-[#0D1117] text-xs font-bold uppercase tracking-wider"
                  >
                    Nhận Việc & Xuất Phát Hiện Trường
                  </button>
                )}

                {selectedTicket.status !== 'Resolved' && (
                  <button
                    onClick={() => {
                      moveTicketStatus(selectedTicket.id, 'Resolved');
                      setSelectedTicket(null);
                      setUploadedAfterPreview(null);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Nghiệm Thu & Đóng Phiếu
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function renderTicketCard(ticket: ServiceRequest) {
    return (
      <div
        key={ticket.id}
        className="p-4 bg-[#161B22] border hover:border-[#C5A880] transition-all space-y-3 text-xs shadow-md"
        style={{ borderLeftColor: ticket.priority_color, borderLeftWidth: '4px' }}
      >
        <div className="flex items-center justify-between">
          <span className="font-mono text-[#C5A880] font-bold">{ticket.id}</span>
          <span className="px-2 py-0.5 bg-[#1C2533] border border-gray-700 text-gray-300 font-mono text-[10px]">
            Căn {ticket.apt_code}
          </span>
        </div>

        <p className="text-gray-200 text-xs line-clamp-2">
          {ticket.content}
        </p>

        <div className="space-y-1 pt-2 border-t border-[#222B35] text-[11px] text-gray-400">
          <div className="flex justify-between">
            <span>Phân loại AI:</span>
            <strong className="text-white">{ticket.ai_category}</strong>
          </div>
          <div className="flex justify-between">
            <span>Hạn chót SLA:</span>
            <span className="text-amber-400 font-mono font-semibold">
              {ticket.sla_minutes_left > 0 ? `Còn ${ticket.sla_minutes_left} phút` : 'Đã hoàn tất'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Kỹ thuật viên:</span>
            <span className="text-gray-300">{ticket.assigned_technician || 'Lê Văn Kỹ Thuật'}</span>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between gap-2">
          <button
            onClick={() => setSelectedTicket(ticket)}
            className="text-[11px] text-[#C5A880] hover:underline flex items-center gap-1"
          >
            <Eye className="w-3.5 h-3.5" /> Chi Tiết & Tải Ảnh
          </button>

          {ticket.status === 'Open' && (
            <button
              onClick={() => moveTicketStatus(ticket.id, 'In_Progress')}
              className="px-2.5 py-1 bg-[#C5A880] text-[#0D1117] text-[10px] font-bold uppercase tracking-wider"
            >
              Nhận Việc →
            </button>
          )}

          {ticket.status === 'In_Progress' && (
            <button
              onClick={() => moveTicketStatus(ticket.id, 'Resolved')}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider"
            >
              Hoàn Tất ✓
            </button>
          )}
        </div>
      </div>
    );
  }
}
