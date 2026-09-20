'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, 
  User, 
  Phone, 
  Wrench, 
  CheckCircle2, 
  ArrowRight, 
  Eye, 
  Sparkles, 
  Filter, 
  Upload, 
  Camera, 
  ShieldCheck,
  Star,
  DollarSign,
  Users,
  Award,
  Calendar,
  AlertCircle,
  Check,
  X,
  Printer,
  ChevronRight,
  TrendingUp,
  FileText,
  BadgeCheck,
  RefreshCw,
  SlidersHorizontal,
  PhoneCall
} from 'lucide-react';
import { 
  getTickets, 
  getTechnicians, 
  assignTechnicianToTicket, 
  resolveTicket, 
  getTechnicianPayroll, 
  ExtendedServiceRequest, 
  TechnicianProfile,
  TechnicianPayrollSummary 
} from '@/lib/ticketStore';
import { fileToBase64 } from '@/lib/imageUtils';

export default function KanbanBoard() {
  const [activeTab, setActiveTab] = useState<'KANBAN' | 'PAYROLL'>('KANBAN');
  const [tickets, setTickets] = useState<ExtendedServiceRequest[]>([]);
  const [technicians, setTechnicians] = useState<TechnicianProfile[]>([]);
  const [payrollList, setPayrollList] = useState<TechnicianPayrollSummary[]>([]);

  // Modals State
  const [assigningTicket, setAssigningTicket] = useState<ExtendedServiceRequest | null>(null);
  const [selectedTechId, setSelectedTechId] = useState<string>('KTV-01');
  const [scheduledTimeInput, setScheduledTimeInput] = useState<string>('Có mặt trong vòng 30 phút');

  const [resolvingTicket, setResolvingTicket] = useState<ExtendedServiceRequest | null>(null);
  const [afterImageBase64, setAfterImageBase64] = useState<string>('');
  const [resolutionNotes, setResolutionNotes] = useState<string>('');
  const [isReadingAfterImage, setIsReadingAfterImage] = useState(false);
  const afterFileInputRef = useRef<HTMLInputElement>(null);

  const [inspectingTicket, setInspectingTicket] = useState<ExtendedServiceRequest | null>(null);
  const [viewingPayrollTech, setViewingPayrollTech] = useState<TechnicianPayrollSummary | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const refreshAllData = () => {
    setTickets(getTickets());
    setTechnicians(getTechnicians());
    setPayrollList(getTechnicianPayroll());
  };

  useEffect(() => {
    refreshAllData();
    const handleUpdate = () => refreshAllData();
    window.addEventListener('skyline_tickets_updated', handleUpdate);
    return () => window.removeEventListener('skyline_tickets_updated', handleUpdate);
  }, []);

  // Filter lists for 3 Kanban columns
  const openTickets = tickets.filter(t => t.status === 'Open');
  const inProgressTickets = tickets.filter(t => t.status === 'In_Progress' || t.status === 'Assigned');
  const resolvedTickets = tickets.filter(t => t.status === 'Resolved');

  // Handle assigning tech
  const handleConfirmAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningTicket || !selectedTechId) return;

    const res = assignTechnicianToTicket(assigningTicket.id, selectedTechId, scheduledTimeInput);
    if (res) {
      setActionSuccessMsg(`Đã phân công KTV ${res.assigned_technician} xử lý phiếu #${res.id}!`);
      setTimeout(() => setActionSuccessMsg(null), 3500);
    }
    setAssigningTicket(null);
  };

  // Handle uploading after image
  const handleAfterFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn tệp hình ảnh hợp lệ (JPG, PNG).');
      return;
    }

    setIsReadingAfterImage(true);
    try {
      const b64 = await fileToBase64(file);
      setAfterImageBase64(b64);
    } catch (err) {
      alert('Không thể đọc file ảnh. Vui lòng thử lại.');
    } finally {
      setIsReadingAfterImage(false);
    }
  };

  // Handle resolving ticket
  const handleConfirmResolve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingTicket) return;

    if (!afterImageBase64) {
      alert('Vui lòng chụp hoặc tải ảnh hiện trường sau khi sửa chữa để nghiệm thu!');
      return;
    }

    if (!resolutionNotes.trim()) {
      alert('Vui lòng nhập ghi chú kỹ thuật khi nghiệm thu bàn giao!');
      return;
    }

    const res = resolveTicket(resolvingTicket.id, afterImageBase64, resolutionNotes.trim());
    if (res) {
      setActionSuccessMsg(`Đã nghiệm thu và hoàn tất phiếu #${res.id}. Hệ thống tự động ghi nhận thù lao cho KTV!`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    }
    setResolvingTicket(null);
    setAfterImageBase64('');
    setResolutionNotes('');
  };

  // Calculations for Payroll KPIs
  const totalFund = payrollList.reduce((acc, p) => acc + p.totalIncome, 0);
  const totalCompletedMonth = tickets.filter(t => t.status === 'Resolved').length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Sub-Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222B35] pb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-semibold flex items-center gap-1.5">
            <Wrench className="w-3.5 h-3.5" /> Quản Trị Kỹ Thuật • Ban Quản Lý Skyline
          </div>
          <h2 className="font-serif text-2xl text-white font-bold mt-1">
            Điều Phối Sự Cố & Phân Công Kỹ Thuật Viên
          </h2>
        </div>

        {/* Tab Switcher: KANBAN vs PAYROLL */}
        <div className="flex items-center gap-2 bg-[#121820] p-1 border border-[#222B35]">
          <button
            onClick={() => setActiveTab('KANBAN')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeTab === 'KANBAN'
                ? 'bg-[#C5A880] text-[#0D1117] shadow-lg'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" /> Bảng Theo Dõi Sự Cố ({tickets.length})
          </button>

          <button
            onClick={() => setActiveTab('PAYROLL')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeTab === 'PAYROLL'
                ? 'bg-[#C5A880] text-[#0D1117] shadow-lg'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5" /> Danh Sách Kỹ Thuật Viên & Thù Lao ({technicians.length})
          </button>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="p-3.5 bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: KANBAN BOARD (3 COLUMNS)                                          */}
      {/* ========================================================================= */}
      {activeTab === 'KANBAN' && (
        <div className="space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-[#121820] border border-blue-500/40 flex items-center justify-between">
              <div>
                <div className="text-gray-400 text-xs">Chờ Tiếp Nhận</div>
                <div className="text-2xl font-bold font-mono text-blue-400 mt-0.5">{openTickets.length}</div>
              </div>
              <div className="w-9 h-9 bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Clock className="w-4 h-4" />
              </div>
            </div>

            <div className="p-4 bg-[#121820] border border-amber-500/40 flex items-center justify-between">
              <div>
                <div className="text-gray-400 text-xs">KTV Đang Xử Lý</div>
                <div className="text-2xl font-bold font-mono text-amber-400 mt-0.5">{inProgressTickets.length}</div>
              </div>
              <div className="w-9 h-9 bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Wrench className="w-4 h-4" />
              </div>
            </div>

            <div className="p-4 bg-[#121820] border border-emerald-500/40 flex items-center justify-between">
              <div>
                <div className="text-gray-400 text-xs">Đã Nghiệm Thu Xong</div>
                <div className="text-2xl font-bold font-mono text-emerald-400 mt-0.5">{resolvedTickets.length}</div>
              </div>
              <div className="w-9 h-9 bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* 3 Kanban Columns Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1: Chờ tiếp nhận */}
            <div className="bg-[#121820] border border-[#222B35] flex flex-col justify-between shadow-xl">
              <div className="p-4 border-b border-[#222B35] flex items-center justify-between bg-[#161B22]">
                <span className="text-xs uppercase tracking-wider font-semibold text-gray-300 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-blue-500 rounded-none"></span>
                  1. Chờ Tiếp Nhận ({openTickets.length})
                </span>
                <span className="text-[10px] font-mono text-blue-400">Mới gửi từ Cư dân</span>
              </div>

              <div className="p-4 space-y-4 min-h-[420px] overflow-y-auto">
                {openTickets.length === 0 ? (
                  <div className="text-xs text-gray-500 italic text-center py-16">
                    Không có phiếu nào đang chờ tiếp nhận.
                  </div>
                ) : (
                  openTickets.map((ticket) => (
                    <div 
                      key={ticket.id} 
                      className="p-4 bg-[#161B22] border border-[#2D3748] hover:border-blue-400 transition-all space-y-3 shadow-md group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[#C5A880] font-bold text-xs">{ticket.id}</span>
                        <span className="px-2 py-0.5 bg-red-950 text-red-300 border border-red-500 text-[10px] font-mono font-bold">
                          {ticket.ai_category} • Mức {ticket.ai_priority}
                        </span>
                      </div>

                      <div className="text-xs text-white font-semibold">
                        Căn {ticket.apt_code} • {ticket.resident_name} ({ticket.resident_phone})
                      </div>

                      <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed">
                        {ticket.content}
                      </p>

                      {ticket.before_image && (
                        <div className="flex items-center gap-2 pt-1">
                          <img 
                            src={ticket.before_image} 
                            alt="Before" 
                            className="w-12 h-12 object-cover border border-gray-700 cursor-pointer hover:opacity-80"
                            onClick={() => setInspectingTicket(ticket)}
                          />
                          <span className="text-[11px] text-gray-400">Ảnh hiện trường cư dân chụp</span>
                        </div>
                      )}

                      <div className="pt-2 border-t border-[#222B35] flex items-center justify-between">
                        <span className="text-[10px] text-gray-500 font-mono">
                          {new Date(ticket.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </span>

                        <button
                          onClick={() => {
                            setAssigningTicket(ticket);
                            setSelectedTechId('KTV-01');
                          }}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1 shadow"
                        >
                          <Users className="w-3.5 h-3.5" /> Phân Công KTV
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Column 2: Đang xử lý */}
            <div className="bg-[#121820] border border-[#222B35] flex flex-col justify-between shadow-xl">
              <div className="p-4 border-b border-[#222B35] flex items-center justify-between bg-[#161B22]">
                <span className="text-xs uppercase tracking-wider font-semibold text-amber-300 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-amber-500 rounded-none animate-pulse"></span>
                  2. KTV Đang Xử Lý ({inProgressTickets.length})
                </span>
                <span className="text-[10px] font-mono text-amber-400">Cam Kết Có Mặt</span>
              </div>

              <div className="p-4 space-y-4 min-h-[420px] overflow-y-auto">
                {inProgressTickets.length === 0 ? (
                  <div className="text-xs text-gray-500 italic text-center py-16">
                    Không có phiếu nào đang xử lý.
                  </div>
                ) : (
                  inProgressTickets.map((ticket) => (
                    <div 
                      key={ticket.id} 
                      className="p-4 bg-[#161B22] border border-amber-500/50 hover:border-amber-400 transition-all space-y-3 shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[#C5A880] font-bold text-xs">{ticket.id}</span>
                        <span className="px-2 py-0.5 bg-amber-950 text-amber-300 border border-amber-500 text-[10px] font-mono font-bold">
                          {ticket.ai_category}
                        </span>
                      </div>

                      <div className="text-xs text-white font-semibold">
                        Căn {ticket.apt_code} • {ticket.resident_name}
                      </div>

                      <p className="text-xs text-gray-300 line-clamp-2">
                        {ticket.content}
                      </p>

                      {/* Tech Info Box */}
                      <div className="p-2.5 bg-[#121820] border border-[#2D3748] text-xs space-y-1">
                        <div className="flex items-center justify-between text-gray-300">
                          <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                            <Wrench className="w-3 h-3" /> {ticket.assigned_technician || 'Chưa chỉ định'}
                          </span>
                          <span className="font-mono text-[11px] text-gray-400">{ticket.scheduled_time || 'Đang di chuyển'}</span>
                        </div>
                        {ticket.assigned_technician_phone && (
                          <div className="text-[11px] text-gray-400 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-[#C5A880]" /> SĐT thợ: <span className="font-mono text-white">{ticket.assigned_technician_phone}</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-[#222B35] flex items-center justify-between">
                        <span className="text-[10px] text-amber-400 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Cam kết xử lý: {ticket.ai_category === 'Nước' || ticket.ai_category === 'Điện' ? 'Trong 45 phút' : 'Trong 2 giờ'}
                        </span>

                        <button
                          onClick={() => {
                            setResolvingTicket(ticket);
                            setAfterImageBase64('');
                          }}
                          className="px-3 py-1.5 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1 shadow"
                        >
                          <Check className="w-3.5 h-3.5" /> Nghiệm Thu Xong
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Column 3: Đã nghiệm thu */}
            <div className="bg-[#121820] border border-[#222B35] flex flex-col justify-between shadow-xl">
              <div className="p-4 border-b border-[#222B35] flex items-center justify-between bg-[#161B22]">
                <span className="text-xs uppercase tracking-wider font-semibold text-emerald-300 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-none"></span>
                  3. Đã Nghiệm Thu Xong ({resolvedTickets.length})
                </span>
                <span className="text-[10px] font-mono text-emerald-400">Đã Lưu Bảng Lương</span>
              </div>

              <div className="p-4 space-y-4 min-h-[420px] overflow-y-auto">
                {resolvedTickets.length === 0 ? (
                  <div className="text-xs text-gray-500 italic text-center py-16">
                    Chưa có phiếu hoàn thành.
                  </div>
                ) : (
                  resolvedTickets.map((ticket) => (
                    <div 
                      key={ticket.id} 
                      className="p-4 bg-[#161B22] border border-emerald-500/40 hover:border-emerald-400 transition-all space-y-3 shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[#C5A880] font-bold text-xs">{ticket.id}</span>
                        <div className="flex items-center gap-1">
                          {ticket.rating ? (
                            <span className="px-2 py-0.5 bg-yellow-950 text-yellow-300 border border-yellow-500 text-[10px] font-bold flex items-center gap-0.5">
                              <Star className="w-3 h-3 fill-current text-yellow-400" /> {ticket.rating} ⭐
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-400 italic">Chờ cư dân chấm</span>
                          )}
                        </div>
                      </div>

                      <div className="text-xs text-white font-semibold">
                        Căn {ticket.apt_code} • {ticket.resident_name}
                      </div>

                      <p className="text-xs text-gray-300 line-clamp-2">
                        {ticket.content}
                      </p>

                      {/* Before / After Mini Preview */}
                      <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-400">
                        {ticket.before_image && (
                          <div>
                            <div className="mb-1">Trước sửa:</div>
                            <img 
                              src={ticket.before_image} 
                              alt="Before" 
                              className="w-full h-16 object-cover border border-red-500/40"
                            />
                          </div>
                        )}
                        {ticket.after_image && (
                          <div>
                            <div className="mb-1">Sau sửa:</div>
                            <img 
                              src={ticket.after_image} 
                              alt="After" 
                              className="w-full h-16 object-cover border border-emerald-500/40"
                            />
                          </div>
                        )}
                      </div>

                      {ticket.resolution_notes && (
                        <div className="text-[11px] text-emerald-300/90 italic bg-emerald-950/30 p-2 border border-emerald-500/30">
                          "{ticket.resolution_notes}"
                        </div>
                      )}

                      <div className="pt-2 border-t border-[#222B35] flex items-center justify-between text-[10px] text-gray-400">
                        <span>KTV: <strong className="text-white">{ticket.assigned_technician || 'Kỹ thuật viên'}</strong></span>
                        <span className="text-emerald-400 font-mono">
                          +{(technicians.find(tc => tc.id === ticket.assigned_technician_id)?.payPerTicket || 150000).toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: TECHNICIAN PROFILES & PAYROLL SUMMARY                             */}
      {/* ========================================================================= */}
      {activeTab === 'PAYROLL' && (
        <div className="space-y-6 animate-fadeIn">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 bg-[#121820] border border-[#222B35] space-y-1">
              <div className="text-xs text-gray-400 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#C5A880]" /> Đội Ngũ KTV Trực Ca
              </div>
              <div className="text-2xl font-bold font-mono text-white mt-1">
                {technicians.length} <span className="text-xs text-gray-400 font-normal">Kỹ thuật viên</span>
              </div>
              <div className="text-[11px] text-emerald-400 pt-1">100% Đã được cấp thẻ nghiệp vụ</div>
            </div>

            <div className="p-5 bg-[#121820] border border-[#222B35] space-y-1">
              <div className="text-xs text-gray-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Tổng Ca Sửa Đã Nghiệm Thu
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                {totalCompletedMonth} <span className="text-xs text-gray-400 font-normal">ca trong tháng</span>
              </div>
              <div className="text-[11px] text-gray-400 pt-1">
                {totalCompletedMonth > 0 ? '100% đúng quy trình nghiệm thu thực tế' : 'Chưa có ca nào hoàn tất'}
              </div>
            </div>

            <div className="p-5 bg-[#121820] border border-[#222B35] space-y-1">
              <div className="text-xs text-gray-400 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-yellow-400" /> Tổng Quỹ Lương & Thù Lao Tháng
              </div>
              <div className="text-2xl font-bold font-mono text-[#C5A880] mt-1">
                {totalFund.toLocaleString('vi-VN')} <span className="text-xs text-gray-400 font-normal">VNĐ</span>
              </div>
              <div className="text-[11px] text-[#C5A880] pt-1">Bao gồm lương cơ bản + công ca + thưởng 5⭐</div>
            </div>
          </div>

          {/* Payroll Table */}
          <div className="bg-[#121820] border border-[#222B35] space-y-4 p-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222B35] pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#C5A880]" />
                  Bảng Lương & Thù Lao Kỹ Thuật Viên Tòa Nhà (Tháng Này)
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Công thức: <strong>Tổng Lương = Lương Cứng + (Số ca sửa × Tiền công) + (Số ca 5⭐ × Thưởng 50.000đ)</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-[#161B22] border border-[#2D3748] hover:border-[#C5A880] text-gray-200 text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" /> In Phiếu Lương
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-[#161B22] text-[#C5A880] uppercase tracking-wider font-semibold border-b border-[#222B35] text-[11px]">
                  <tr>
                    <th className="p-3">Mã & Họ Tên KTV</th>
                    <th className="p-3">Chuyên Môn</th>
                    <th className="p-3">Trạng Thái</th>
                    <th className="p-3 text-center">Ca Đã Sửa</th>
                    <th className="p-3 text-center">Đánh Giá ⭐</th>
                    <th className="p-3 text-right">Lương Cơ Bản</th>
                    <th className="p-3 text-right">Tiền Công Ca</th>
                    <th className="p-3 text-right">Thưởng 5⭐</th>
                    <th className="p-3 text-right text-[#C5A880]">Tổng Lương Thực Nhận</th>
                    <th className="p-3 text-center">Chi Tiết</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#222B35]">
                  {payrollList.map((item) => (
                    <tr key={item.technician.id} className="hover:bg-[#161B22]/60 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-white text-xs">{item.technician.name}</div>
                        <div className="text-[10px] text-gray-400 font-mono">{item.technician.id} • {item.technician.phone}</div>
                      </td>

                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-[#1C2533] border border-gray-700 text-gray-200 text-[10px] font-semibold">
                          {item.technician.specialty}
                        </span>
                      </td>

                      <td className="p-3">
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          item.technician.status === 'AVAILABLE' 
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-600' 
                            : 'bg-amber-950 text-amber-400 border border-amber-600'
                        }`}>
                          {item.technician.status === 'AVAILABLE' ? 'Đang Rảnh' : 'Đang Xử Lý Ca'}
                        </span>
                      </td>

                      <td className="p-3 text-center font-mono font-bold text-white">
                        {item.completedTicketsCount}
                      </td>

                      <td className="p-3 text-center">
                        <span className="text-yellow-400 font-bold font-mono">
                          {item.averageRating} ⭐
                        </span>
                        <div className="text-[10px] text-gray-400">({item.fiveStarCount} lượt 5⭐)</div>
                      </td>

                      <td className="p-3 text-right font-mono text-gray-300">
                        {item.baseSalary.toLocaleString('vi-VN')} đ
                      </td>

                      <td className="p-3 text-right font-mono text-emerald-400">
                        +{item.ticketBonusTotal.toLocaleString('vi-VN')} đ
                      </td>

                      <td className="p-3 text-right font-mono text-yellow-400">
                        +{item.fiveStarBonusTotal.toLocaleString('vi-VN')} đ
                      </td>

                      <td className="p-3 text-right font-mono font-bold text-sm text-[#C5A880]">
                        {item.totalIncome.toLocaleString('vi-VN')} đ
                      </td>

                      <td className="p-3 text-center">
                        <button
                          onClick={() => setViewingPayrollTech(item)}
                          className="px-2.5 py-1 bg-[#1C2533] hover:bg-[#C5A880] hover:text-[#0D1117] text-[#C5A880] border border-[#2D3748] text-[11px] font-semibold transition-all"
                        >
                          Xem Phiếu
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: PHÂN CÔNG KỸ THUẬT VIÊN                                         */}
      {/* ========================================================================= */}
      {assigningTicket && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleConfirmAssign} className="bg-[#121820] border border-[#C5A880] max-w-lg w-full p-6 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#222B35] pb-3">
              <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-[#C5A880]" />
                Phân Công Kỹ Thuật Viên Xử Lý Phiếu #{assigningTicket.id}
              </h3>
              <button 
                type="button"
                onClick={() => setAssigningTicket(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-[#161B22] border border-[#222B35] text-xs space-y-1.5">
              <div><strong>Căn hộ:</strong> <span className="text-[#C5A880] font-bold">Căn {assigningTicket.apt_code} ({assigningTicket.resident_name})</span></div>
              <div><strong>Nội dung:</strong> <span className="text-gray-200">{assigningTicket.content}</span></div>
              <div><strong>Hạng mục:</strong> <span className="text-amber-400 font-semibold">{assigningTicket.ai_category}</span></div>
            </div>

            {/* Select Technician */}
            <div className="space-y-2">
              <label className="text-xs text-gray-300 font-semibold">Chọn Kỹ Thuật Viên Phụ Trách Trực Ca:</label>
              <div className="space-y-2">
                {technicians.map((tech) => (
                  <label
                    key={tech.id}
                    className={`p-3 border flex items-center justify-between cursor-pointer transition-all ${
                      selectedTechId === tech.id
                        ? 'border-[#C5A880] bg-[#1C2533]'
                        : 'border-[#222B35] hover:border-gray-600 bg-[#161B22]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="tech"
                        checked={selectedTechId === tech.id}
                        onChange={() => setSelectedTechId(tech.id)}
                        className="accent-[#C5A880]"
                      />
                      <div>
                        <div className="text-xs font-bold text-white">{tech.name} ({tech.id})</div>
                        <div className="text-[10px] text-gray-400">Chuyên môn: {tech.specialty} • SĐT: {tech.phone}</div>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 text-[10px] font-bold ${
                      tech.status === 'AVAILABLE' 
                        ? 'text-emerald-400 bg-emerald-950/80 border border-emerald-500/60' 
                        : 'text-amber-400 bg-amber-950/80 border border-amber-500/60'
                    }`}>
                      {tech.status === 'AVAILABLE' ? 'Đang Rảnh' : 'Đang Xử Lý Ca'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-gray-300 font-semibold">Thời Gian Hẹn Cư Dân Có Mặt:</label>
              <input
                type="text"
                value={scheduledTimeInput}
                onChange={(e) => setScheduledTimeInput(e.target.value)}
                placeholder="VD: Có mặt trong vòng 20 phút..."
                className="w-full bg-[#161B22] border border-[#2D3748] text-xs text-white p-2.5 focus:outline-none focus:border-[#C5A880]"
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#222B35]">
              <button
                type="button"
                onClick={() => setAssigningTicket(null)}
                className="px-4 py-2 border border-gray-700 text-xs text-gray-300"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-colors shadow-lg"
              >
                Xác Nhận & Báo Cư Dân
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: NGHIỆM THU & TẢI ẢNH HOÀN TẤT                                    */}
      {/* ========================================================================= */}
      {resolvingTicket && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleConfirmResolve} className="bg-[#121820] border border-[#C5A880] max-w-lg w-full p-6 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#222B35] pb-3">
              <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Nghiệm Thu & Đóng Phiếu #{resolvingTicket.id}
              </h3>
              <button 
                type="button"
                onClick={() => setResolvingTicket(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-[#161B22] border border-[#222B35] text-xs space-y-1">
              <div>Căn hộ: <strong className="text-white">Căn {resolvingTicket.apt_code} ({resolvingTicket.resident_name})</strong></div>
              <div>KTV phụ trách: <strong className="text-[#C5A880]">{resolvingTicket.assigned_technician}</strong></div>
              <div>Nội dung báo: <span className="text-gray-300">{resolvingTicket.content}</span></div>
            </div>

            {/* Upload After Image */}
            <div className="space-y-2">
              <label className="text-xs text-gray-300 font-semibold flex items-center justify-between">
                <span>Tải Ảnh Nghiệm Thu Sau Khi Sửa Xong:</span>
                <span className="text-[11px] text-gray-400 font-mono">* Ảnh được lưu và gửi trực tiếp đến cư dân</span>
              </label>

              <input
                type="file"
                ref={afterFileInputRef}
                onChange={handleAfterFileChange}
                accept="image/*"
                className="hidden"
              />

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => afterFileInputRef.current?.click()}
                  disabled={isReadingAfterImage}
                  className="px-3.5 py-2 bg-[#161B22] border border-[#2D3748] hover:border-[#C5A880] text-gray-300 hover:text-white text-xs flex items-center gap-2 transition-colors"
                >
                  <Camera className="w-3.5 h-3.5 text-[#C5A880]" />
                  {isReadingAfterImage ? 'Đang nạp ảnh...' : afterImageBase64 ? 'Đổi Ảnh Nghiệm Thu' : 'Chụp / Chọn Ảnh Sửa Xong'}
                </button>

                {afterImageBase64 ? (
                  <div className="flex items-center gap-2">
                    <img 
                      src={afterImageBase64} 
                      alt="After Preview" 
                      className="w-10 h-10 object-cover border border-emerald-500"
                    />
                    <span className="text-xs text-emerald-400 font-medium">Đã tải ảnh nghiệm thu ✓</span>
                  </div>
                ) : (
                  <span className="text-[11px] text-amber-400 font-medium">* Bắt buộc đính kèm ảnh chụp hiện trường thực tế để hoàn tất nghiệm thu</span>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-gray-300 font-semibold">Ghi Chú Kỹ Thuật Khi Bàn Giao:</label>
              <textarea
                rows={2}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="VD: Đã thay gioăng cao su van xả, kiểm tra áp lực nước 2.5 bar ổn định..."
                className="w-full bg-[#161B22] border border-[#2D3748] text-xs text-white p-2.5 focus:outline-none focus:border-[#C5A880]"
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#222B35]">
              <button
                type="button"
                onClick={() => setResolvingTicket(null)}
                className="px-4 py-2 border border-gray-700 text-xs text-gray-300"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-lg"
              >
                Xác Nhận Nghiệm Thu & Đóng Phiếu
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: XEM CHI TIẾT PHIẾU LƯƠNG KỸ THUẬT VIÊN                           */}
      {/* ========================================================================= */}
      {viewingPayrollTech && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0D1117] border border-[#C5A880] max-w-xl w-full p-6 text-white space-y-5 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#222B35] pb-3">
              <div>
                <span className="text-[10px] text-[#C5A880] font-mono uppercase font-bold tracking-wider">BAN QUẢN LÝ SKYLINE SMART RESIDENCE</span>
                <h3 className="font-serif text-lg font-bold text-white">Phiếu Quyết Toán Lương & Thù Lao Kỹ Thuật</h3>
              </div>
              <button onClick={() => setViewingPayrollTech(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <div className="p-4 bg-[#121820] border border-[#222B35] space-y-2 text-xs">
              <div className="flex justify-between">
                <span>Họ và tên:</span>
                <strong className="text-white text-sm">{viewingPayrollTech.technician.name}</strong>
              </div>
              <div className="flex justify-between">
                <span>Mã số KTV / Chuyên môn:</span>
                <span className="font-mono text-[#C5A880]">{viewingPayrollTech.technician.id} • {viewingPayrollTech.technician.specialty}</span>
              </div>
              <div className="flex justify-between">
                <span>Số điện thoại:</span>
                <span className="font-mono text-gray-300">{viewingPayrollTech.technician.phone}</span>
              </div>
              <div className="flex justify-between">
                <span>Đánh giá trung bình cư dân:</span>
                <span className="text-yellow-400 font-bold">{viewingPayrollTech.averageRating} ⭐ ({viewingPayrollTech.fiveStarCount} ca 5 sao)</span>
              </div>
            </div>

            {/* Breakdown lines */}
            <div className="space-y-2 text-xs border-t border-b border-[#222B35] py-3">
              <div className="flex justify-between text-gray-300">
                <span>1. Lương cứng cơ bản tháng:</span>
                <span className="font-mono">{viewingPayrollTech.baseSalary.toLocaleString('vi-VN')} đ</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>2. Tiền công theo ca hoàn tất ({viewingPayrollTech.completedTicketsCount} ca × {viewingPayrollTech.technician.payPerTicket.toLocaleString('vi-VN')}đ):</span>
                <span className="font-mono text-emerald-400">+{viewingPayrollTech.ticketBonusTotal.toLocaleString('vi-VN')} đ</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>3. Tiền thưởng cư dân chấm 5⭐ ({viewingPayrollTech.fiveStarCount} ca × {viewingPayrollTech.technician.bonusPerFiveStar.toLocaleString('vi-VN')}đ):</span>
                <span className="font-mono text-yellow-400">+{viewingPayrollTech.fiveStarBonusTotal.toLocaleString('vi-VN')} đ</span>
              </div>

              <div className="flex justify-between pt-2 border-t border-[#222B35] text-sm">
                <span className="font-bold text-white">TỔNG THỰC LĨNH THÁNG NÀY:</span>
                <span className="font-bold font-mono text-base text-[#C5A880]">
                  {viewingPayrollTech.totalIncome.toLocaleString('vi-VN')} đ
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>Xác nhận: <strong>Ban Quản Lý Tòa Nhà</strong></span>
              <button 
                onClick={() => window.print()} 
                className="px-4 py-2 bg-[#C5A880] text-[#0D1117] text-xs font-bold uppercase tracking-wider hover:bg-white"
              >
                In Phiếu Chi Lương
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: XEM ẢNH HIỆN TRƯỜNG CỦA PHIẾU                                    */}
      {/* ========================================================================= */}
      {inspectingTicket && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121820] border border-[#C5A880] max-w-2xl w-full p-6 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#222B35] pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#C5A880]" />
                <h3 className="font-serif text-base font-bold text-white">
                  Ảnh Hiện Trường Phiếu #{inspectingTicket.id} - Căn {inspectingTicket.apt_code}
                </h3>
              </div>
              <button onClick={() => setInspectingTicket(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3">
              <div className="text-xs text-gray-300">
                <strong>Mô tả cư dân:</strong> {inspectingTicket.content}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {inspectingTicket.before_image && (
                  <div className="space-y-1">
                    <span className="text-[11px] text-red-400 font-semibold">Ảnh hiện trường lúc báo:</span>
                    <img 
                      src={inspectingTicket.before_image} 
                      alt="Hiện trường" 
                      className="w-full h-56 object-cover border border-red-500/50"
                    />
                  </div>
                )}

                {inspectingTicket.after_image && (
                  <div className="space-y-1">
                    <span className="text-[11px] text-emerald-400 font-semibold">Ảnh nghiệm thu sau khi sửa:</span>
                    <img 
                      src={inspectingTicket.after_image} 
                      alt="Nghiệm thu" 
                      className="w-full h-56 object-cover border border-emerald-500/50"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#222B35]">
              <button 
                onClick={() => setInspectingTicket(null)}
                className="px-4 py-1.5 bg-[#161B22] border border-[#2D3748] text-gray-300 hover:text-white text-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
