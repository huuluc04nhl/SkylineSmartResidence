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
  AlertTriangle,
  Check,
  X,
  Printer,
  ChevronRight,
  TrendingUp,
  FileText,
  BadgeCheck,
  RefreshCw,
  SlidersHorizontal,
  PhoneCall,
  Trash2,
  MessageSquare,
  HelpCircle,
  Send,
  MessageCircle,
  Plus,
  Search,
  LayoutGrid,
  List
} from 'lucide-react';
import { 
  getTickets, 
  getTechnicians, 
  syncTicketsWithServer,
  deleteTicketAsync,
  createTicketAsync,
  assignTechnicianToTicket, 
  resolveTicket, 
  rejectTicketResolution,
  adminRespondToTicket,
  aiAnswerTicket,
  getTechnicianPayroll, 
  ExtendedServiceRequest, 
  TechnicianProfile,
  TechnicianPayrollSummary 
} from '@/lib/ticketStore';
import { getApartmentUnits, ApartmentUnit } from '@/lib/apartmentStore';
import { 
  isAutoDispatchEnabled, 
  autoDispatchSingleTicket, 
  autoDispatchAllPendingTickets,
  autoResolveSingleTicketWithAI,
  autoResolveAllInProgressTicketsWithAI,
  generateAiResolutionNotes,
  generateAiInspectionImage
} from '@/lib/aiDispatchService';
import { 
  generateSuggestedAdminReply, 
  classifyTicket 
} from '@/lib/ticketClassification';
import { fileToBase64 } from '@/lib/imageUtils';
import { useLanguage } from '@/lib/languageContext';

export default function KanbanBoard() {
  const { t, isEn, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'KANBAN' | 'PAYROLL'>('KANBAN');
  const [tickets, setTickets] = useState<ExtendedServiceRequest[]>([]);
  const [technicians, setTechnicians] = useState<TechnicianProfile[]>([]);
  const [payrollList, setPayrollList] = useState<TechnicianPayrollSummary[]>([]);

  // Category Filter: ALL | REPAIR | FEEDBACK
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'REPAIR' | 'FEEDBACK'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'KANBAN' | 'LIST'>('KANBAN');

  // BQL Direct Ticket Intake Modal States (Hotline 1900 8899)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [apartmentUnits, setApartmentUnits] = useState<ApartmentUnit[]>([]);
  const [newAptCode, setNewAptCode] = useState<string>('CH-06');
  const [newResidentName, setNewResidentName] = useState<string>('');
  const [newResidentPhone, setNewResidentPhone] = useState<string>('');
  const [newCategory, setNewCategory] = useState<'Điện' | 'Nước' | 'Vệ sinh' | 'An ninh' | 'Khác'>('Điện');
  const [newTicketType, setNewTicketType] = useState<'REPAIR' | 'FEEDBACK'>('REPAIR');
  const [newContent, setNewContent] = useState<string>('');
  const [isSubmittingNewTicket, setIsSubmittingNewTicket] = useState<boolean>(false);

  // AI Auto-Dispatch States
  const [isAutoDispatching, setIsAutoDispatching] = useState<boolean>(false);

  // Modals State
  const [assigningTicket, setAssigningTicket] = useState<ExtendedServiceRequest | null>(null);
  const [selectedTechId, setSelectedTechId] = useState<string>('KTV-01');
  const [scheduledTimeInput, setScheduledTimeInput] = useState<string>('Có mặt trong vòng 30 phút');

  // Modal BQL Phản Hồi Cư Dân (cho FEEDBACK, INQUIRY & Cập nhật KTV)
  const [feedbackReplyTicket, setFeedbackReplyTicket] = useState<ExtendedServiceRequest | null>(null);
  const [feedbackReplyContent, setFeedbackReplyContent] = useState<string>('');
  const [replyEngineerName, setReplyEngineerName] = useState<string>('');
  const [isGeneratingAiReply, setIsGeneratingAiReply] = useState<boolean>(false);
  const feedbackReplyAdminName = 'Ban Quản Lý Chung Cư Skyline';

  const handleGenerateAiAdminReply = async () => {
    if (!feedbackReplyTicket) return;
    setIsGeneratingAiReply(true);
    try {
      const res = await fetch('/api/ai/ticket-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'GENERATE_ADMIN_REPLY',
          content: feedbackReplyTicket.content,
          category: feedbackReplyTicket.ai_category,
          residentName: feedbackReplyTicket.resident_name,
          aptCode: feedbackReplyTicket.apt_code,
          engineerName: replyEngineerName.trim() || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.reply) {
          setFeedbackReplyContent(data.reply);
          return;
        }
      }
    } catch (err) {
      console.warn('AI reply API lỗi, dùng smart local fallback:', err);
    } finally {
      setIsGeneratingAiReply(false);
    }
    // Fallback tức thì nếu API bận/timeout
    const draft = generateSuggestedAdminReply(
      feedbackReplyTicket.content,
      feedbackReplyTicket.ai_category,
      feedbackReplyTicket.resident_name,
      feedbackReplyTicket.apt_code,
      replyEngineerName.trim() || undefined
    );
    setFeedbackReplyContent(draft);
  };

  const [resolvingTicket, setResolvingTicket] = useState<ExtendedServiceRequest | null>(null);
  const [afterImageBase64, setAfterImageBase64] = useState<string>('');
  const [resolutionNotes, setResolutionNotes] = useState<string>('');
  const [isReadingAfterImage, setIsReadingAfterImage] = useState(false);
  const [isVerifyingAfterImage, setIsVerifyingAfterImage] = useState(false);
  const [allowOverrideVerification, setAllowOverrideVerification] = useState(false);
  const [aiVerificationResult, setAiVerificationResult] = useState<{
    status: 'VERIFIED' | 'SUSPICIOUS' | 'INCOMPLETE';
    confidence_score: number;
    verification_title: string;
    verification_detail: string;
    is_genuine: boolean;
    risk_warning?: string;
  } | null>(null);
  const afterFileInputRef = useRef<HTMLInputElement>(null);

  const [inspectingTicket, setInspectingTicket] = useState<ExtendedServiceRequest | null>(null);
  const [viewingPayrollTech, setViewingPayrollTech] = useState<TechnicianPayrollSummary | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const refreshAllData = () => {
    setTickets(getTickets());
    setTechnicians(getTechnicians());
    setPayrollList(getTechnicianPayroll());
  };

  const handleSyncNks = async () => {
    setIsSyncing(true);
    try {
      await syncTicketsWithServer();
      refreshAllData();
      setActionSuccessMsg('Đã cập nhật danh sách sự cố mới nhất từ hệ thống tiếp nhận!');
      setTimeout(() => setActionSuccessMsg(null), 3000);
    } catch (err) {
      console.warn('Lỗi cập nhật dữ liệu sự cố:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteTicket = async (ticket: ExtendedServiceRequest) => {
    const code = ticket.nks_id ? `#${ticket.nks_id}` : `#${ticket.id}`;
    if (!window.confirm(`Bạn có chắc muốn xóa phiếu ${code}?`)) {
      return;
    }
    await deleteTicketAsync(ticket.nks_id || ticket.id);
    refreshAllData();
    setActionSuccessMsg(`Đã xóa phiếu ${code}.`);
    setTimeout(() => setActionSuccessMsg(null), 3000);
  };


  const handleOneClickAutoDispatch = () => {
    setIsAutoDispatching(true);
    try {
      const res = autoDispatchAllPendingTickets();
      refreshAllData();
      if (res.successCount > 0) {
        setActionSuccessMsg(`AI đã phân công ${res.successCount} phiếu sự cố.`);
      } else {
        setActionSuccessMsg('Không còn phiếu nào đang chờ tiếp nhận.');
      }
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } finally {
      setIsAutoDispatching(false);
    }
  };

  const [isAutoResolving, setIsAutoResolving] = useState(false);

  const handleAutoDispatchOne = (ticketId: string) => {
    const res = autoDispatchSingleTicket(ticketId);
    if (res && res.assigned_technician) {
      refreshAllData();
      setActionSuccessMsg(`Đã phân công ${res.assigned_technician} cho phiếu #${res.nks_id || res.id}.`);
      setTimeout(() => setActionSuccessMsg(null), 3500);
    }
  };

  const handleAiAutoResolveSingle = (ticket: ExtendedServiceRequest) => {
    const res = autoResolveSingleTicketWithAI(ticket.id);
    if (res) {
      refreshAllData();
      setActionSuccessMsg(`Đã nghiệm thu phiếu #${res.nks_id || res.id.replace('TICK-', '')}.`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    }
  };

  const handleAiAutoResolveAll = () => {
    if (inProgressTickets.length === 0) return;
    setIsAutoResolving(true);
    try {
      const res = autoResolveAllInProgressTicketsWithAI();
      refreshAllData();
      if (res.successCount > 0) {
        setActionSuccessMsg(`Đã nghiệm thu ${res.successCount} phiếu sự cố.`);
      } else {
        setActionSuccessMsg('Không có phiếu nào đang chờ nghiệm thu.');
      }
      setTimeout(() => setActionSuccessMsg(null), 4500);
    } finally {
      setIsAutoResolving(false);
    }
  };

  const handleVerifyResolutionImage = async (afterB64: string, ticket: ExtendedServiceRequest, notesText?: string) => {
    if (!afterB64) return;
    setIsVerifyingAfterImage(true);
    try {
      const res = await fetch('/api/ai/ticket-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'VERIFY_RESOLUTION_IMAGE',
          afterImage: afterB64,
          beforeImage: ticket.before_image || undefined,
          issueDescription: ticket.content || '',
          area: ticket.area || ticket.ai_category || '',
          technicianNotes: notesText || resolutionNotes || ''
        })
      });
      if (res.ok) {
        const data = await res.json();
        const v = data.verification || (data.confidence_score ? data : null);
        if (data.success && v) {
          setAiVerificationResult({
            status: v.status || 'VERIFIED',
            confidence_score: v.confidence_score ?? v.score ?? 92,
            verification_title: v.verification_title ?? v.title ?? 'Đã kiểm định hiện trường đạt chuẩn',
            verification_detail: v.verification_detail ?? v.detail ?? '',
            is_genuine: v.is_genuine ?? true,
            risk_warning: v.risk_warning,
          });
          return;
        }
      }
    } catch (err) {
      console.warn('AI verification API error, relying on local verification:', err);
    } finally {
      setIsVerifyingAfterImage(false);
    }
  };

  const handleOpenResolveModal = (ticket: ExtendedServiceRequest) => {
    setResolvingTicket(ticket);
    setAfterImageBase64('');
    setResolutionNotes(generateAiResolutionNotes(ticket));
    setAiVerificationResult(null);
    setAllowOverrideVerification(false);
  };

  useEffect(() => {
    refreshAllData();

    // Nạp danh sách căn hộ thực tế của tòa nhà để phục vụ BQL tiếp nhận sự cố
    try {
      const units = getApartmentUnits();
      if (units && units.length > 0) {
        setApartmentUnits(units);
        setNewAptCode(units[0].code);
        setNewResidentName(units[0].owner?.name || '');
        setNewResidentPhone(units[0].owner?.phone || '');
      }
    } catch (e) {
      console.warn('Lỗi load danh sách căn hộ:', e);
    }

    // Tự động đồng bộ live dữ liệu từ máy chủ & NKS API (Tuyệt đối không tự ý chuyển trạng thái vé)
    syncTicketsWithServer().then(() => {
      refreshAllData();
    });

    const handleUpdate = () => {
      refreshAllData();
    };
    window.addEventListener('skyline_tickets_updated', handleUpdate);
    return () => window.removeEventListener('skyline_tickets_updated', handleUpdate);
  }, []);

  const handleAptCodeChange = (code: string) => {
    setNewAptCode(code);
    const unit = apartmentUnits.find(u => u.code === code);
    if (unit?.owner) {
      setNewResidentName(unit.owner.name || '');
      setNewResidentPhone(unit.owner.phone || '');
    }
  };

  const handleCreateTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) {
      alert('Vui lòng nhập mô tả sự cố hoặc yêu cầu!');
      return;
    }
    setIsSubmittingNewTicket(true);
    try {
      const res = await createTicketAsync({
        apt_code: newAptCode || 'CH-06',
        resident_name: newResidentName || 'Cư dân Skyline',
        resident_phone: newResidentPhone || '1900 8899',
        content: newContent.trim(),
        ticket_type: newTicketType,
        ai_category: newCategory,
      });
      refreshAllData();
      setIsCreateModalOpen(false);
      setNewContent('');
      setActionSuccessMsg(`Đã tiếp nhận sự cố thành công! Phiếu #${res.nks_id || res.id} đã được đưa vào hàng đợi.`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Lỗi tiếp nhận sự cố:', err);
      alert('Có lỗi khi tạo phiếu sự cố. Vui lòng kiểm tra lại.');
    } finally {
      setIsSubmittingNewTicket(false);
    }
  };

  // Counts for Category Badges
  const repairCount = tickets.filter(t => (t.ticket_type || 'REPAIR') === 'REPAIR').length;
  const feedbackCount = tickets.filter(t => t.ticket_type !== 'REPAIR').length;

  // Filter lists for 3 Kanban columns based on active category filter AND keyword search
  const filteredTickets = tickets.filter(t => {
    if (categoryFilter !== 'ALL') {
      const isRep = (t.ticket_type || 'REPAIR') === 'REPAIR';
      if (categoryFilter === 'REPAIR' && !isRep) return false;
      if (categoryFilter === 'FEEDBACK' && isRep) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchApt = (t.apt_code || '').toLowerCase().includes(q);
      const matchName = (t.resident_name || '').toLowerCase().includes(q);
      const matchPhone = (t.resident_phone || '').toLowerCase().includes(q);
      const matchContent = (t.content || '').toLowerCase().includes(q);
      const matchId = (t.id || '').toLowerCase().includes(q);
      const matchNks = t.nks_id ? String(t.nks_id).includes(q) : false;
      const matchTech = (t.assigned_technician || '').toLowerCase().includes(q);
      const matchCat = (t.ai_category || '').toLowerCase().includes(q);
      if (!matchApt && !matchName && !matchPhone && !matchContent && !matchId && !matchNks && !matchTech && !matchCat) {
        return false;
      }
    }

    return true;
  });

  const openTickets = filteredTickets
    .filter(t => t.status === 'Open')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Priority for In-Progress: Urgent repairs (REPAIR) first, then by latest updates
  const inProgressTickets = filteredTickets
    .filter(t => t.status === 'In_Progress' || t.status === 'Assigned')
    .sort((a, b) => {
      if (a.ticket_type === 'REPAIR' && b.ticket_type !== 'REPAIR') return -1;
      if (a.ticket_type !== 'REPAIR' && b.ticket_type === 'REPAIR') return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const resolvedTickets = filteredTickets
    .filter(t => t.status === 'Resolved')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Handle BQL official response to resident feedback / inquiry & update engineer
  const handleConfirmAdminReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackReplyTicket || !feedbackReplyContent.trim()) return;

    adminRespondToTicket(
      feedbackReplyTicket.id, 
      feedbackReplyContent.trim(), 
      feedbackReplyAdminName,
      replyEngineerName.trim() || undefined
    );
    refreshAllData();
    setActionSuccessMsg(`Đã gửi phản hồi và cập nhật KTV cho phiếu #${feedbackReplyTicket.nks_id || feedbackReplyTicket.id}!`);
    setTimeout(() => setActionSuccessMsg(null), 4000);
    setFeedbackReplyTicket(null);
    setFeedbackReplyContent('');
    setReplyEngineerName('');
  };

  // AI auto answer inquiry
  const handleAiAutoAnswerInquiry = (ticket: ExtendedServiceRequest) => {
    const res = aiAnswerTicket(ticket.id);
    if (res) {
      refreshAllData();
      setActionSuccessMsg(`AI đã hoàn tất giải đáp thông tin cho phiếu #${res.nks_id || res.id}!`);
      setTimeout(() => setActionSuccessMsg(null), 3500);
    }
  };

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

  // Ban Quản Lý bấm 1 chạm DUYỆT ĐỀ XUẤT ĐIỀU PHỐI KTV CỦA AI
  const handleApproveAiRecommendation = (ticket: ExtendedServiceRequest) => {
    let techId = ticket.suggested_technician_id;
    if (!techId && ticket.suggested_technician) {
      const found = technicians.find(t => t.name.toLowerCase().includes((ticket.suggested_technician || '').toLowerCase()));
      if (found) techId = found.id;
    }
    if (!techId && technicians.length > 0) {
      techId = technicians[0].id;
    }

    if (techId) {
      const res = assignTechnicianToTicket(
        ticket.id, 
        techId, 
        ticket.scheduled_time || 'Trong vòng 30 - 45 phút'
      );
      if (res) {
        refreshAllData();
        setActionSuccessMsg(`BQL đã duyệt phân công KTV ${res.assigned_technician} xử lý phiếu #${res.nks_id || res.id}!`);
        setTimeout(() => setActionSuccessMsg(null), 4000);
      }
    }
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
      if (resolvingTicket) {
        handleVerifyResolutionImage(b64, resolvingTicket, resolutionNotes);
      }
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

    const isProblematic = aiVerificationResult && (aiVerificationResult.status === 'SUSPICIOUS' || aiVerificationResult.status === 'INCOMPLETE');
    if (isProblematic && !allowOverrideVerification) {
      alert('AI cảnh báo chất lượng ảnh hoặc kết quả sửa chữa chưa đạt chuẩn! Vui lòng chọn "Từ Chối & Yêu Cầu Sửa Lại" hoặc tích chọn duyệt ngoại lệ nếu đã thẩm định thực tế.');
      return;
    }

    const res = resolveTicket(
      resolvingTicket.id, 
      afterImageBase64, 
      resolutionNotes.trim(), 
      aiVerificationResult || undefined
    );
    if (res) {
      setActionSuccessMsg(`Đã nghiệm thu và hoàn tất phiếu #${res.id}. Hệ thống tự động ghi nhận thù lao cho KTV!`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    }
    setResolvingTicket(null);
    setAfterImageBase64('');
    setResolutionNotes('');
    setAiVerificationResult(null);
    setAllowOverrideVerification(false);
  };

  // Handle rejecting ticket resolution (send back to technician for rework)
  const handleRejectResolution = () => {
    if (!resolvingTicket) return;
    const defaultReason = aiVerificationResult?.risk_warning || aiVerificationResult?.verification_detail || 'Ảnh nghiệm thu không đạt chuẩn kỹ thuật, yêu cầu kiểm tra và xử lý lại.';
    rejectTicketResolution(resolvingTicket.id, defaultReason);
    refreshAllData();
    setActionSuccessMsg(`Đã từ chối nghiệm thu #${resolvingTicket.nks_id || resolvingTicket.id}. Yêu cầu KTV khắc phục lại!`);
    setTimeout(() => setActionSuccessMsg(null), 4000);
    setResolvingTicket(null);
    setAfterImageBase64('');
    setResolutionNotes('');
    setAiVerificationResult(null);
    setAllowOverrideVerification(false);
  };

  // Calculations for Payroll KPIs
  const totalFund = payrollList.reduce((acc, p) => acc + p.totalIncome, 0);
  const totalCompletedMonth = tickets.filter(t => t.status === 'Resolved').length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Sub-Navigation Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#222B35] pb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-semibold flex items-center gap-1.5">
            <Wrench className="w-3.5 h-3.5" /> {t('Quản Lý & Vận Hành', 'Operations & Management')}
          </div>
          <h2 className="font-serif text-2xl text-white font-bold mt-1">
            {t('Trung Tâm Xử Lý Yêu Cầu Cư Dân', 'Resident Service Request Center')}
          </h2>
        </div>

        {/* Unified Static Toolbar */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {/* Nút BQL Tiếp Nhận Sự Cố Trực Tiếp (Hotline 1900 8899) */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3.5 py-1.5 bg-[#C5A880] hover:bg-[#E2C9A5] text-[#0A0E14] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-md rounded-none"
            title={t('Ban Quản Lý trực tiếp tiếp nhận sự cố kỹ thuật từ Hotline 1900 8899 hoặc cư dân báo trực tiếp')}
          >
            <Plus className="w-3.5 h-3.5 text-[#0A0E14] stroke-[2.5]" />
            <span>{t('Tiếp Nhận Sự Cố', 'New Incident Intake')}</span>
          </button>

          {/* Nút Làm Mới Dữ Liệu */}
          <button
            onClick={handleSyncNks}
            disabled={isSyncing}
            className="px-3 py-1.5 bg-[#121820] hover:bg-[#161B22] border border-[#222B35] hover:border-[#C5A880]/50 text-xs font-semibold text-gray-300 hover:text-white flex items-center gap-1.5 transition-colors disabled:opacity-50"
            title={t('Cập nhật danh sách yêu cầu thực tế mới nhất từ cư dân', 'Refresh latest resident service requests')}
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#C5A880] ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? t('Đang cập nhật...', 'Updating...') : t('Làm mới', 'Refresh')}</span>
          </button>

          {/* Tab Switcher: KANBAN vs PAYROLL */}
          <div className="flex items-center bg-[#0D1117] p-1 border border-[#222B35]">
            <button
              onClick={() => setActiveTab('KANBAN')}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                activeTab === 'KANBAN'
                  ? 'bg-[#C5A880] text-[#0D1117] shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>{t('Yêu Cầu & Sự Cố', 'Requests & Incidents')}</span>
              <span className={`text-[10px] px-1.5 py-0.2 font-mono font-bold ${
                activeTab === 'KANBAN' ? 'bg-[#0D1117]/20 text-[#0D1117]' : 'bg-[#161B22] text-gray-400'
              }`}>
                {tickets.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('PAYROLL')}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                activeTab === 'PAYROLL'
                  ? 'bg-[#C5A880] text-[#0D1117] shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>{t('KTV & Thù Lao', 'Technicians & Payroll')}</span>
              <span className={`text-[10px] px-1.5 py-0.2 font-mono font-bold ${
                activeTab === 'PAYROLL' ? 'bg-[#0D1117]/20 text-[#0D1117]' : 'bg-[#161B22] text-gray-400'
              }`}>
                {payrollList.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="p-3.5 bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* TAB 1: KANBAN BOARD */}
      {activeTab === 'KANBAN' && (
        <div className="space-y-5">
          {/* Search & Category Filter Toolbar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-[#0E131B] p-2 border border-[#1E2630]">
            {/* Category Filter Pills (Clean Luxury, No Horiz Scrollbar, No Rainbow Colors) */}
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              <span className="text-gray-400 text-[11px] font-semibold uppercase tracking-wider pr-1">
                {t('Phân loại:', 'Filter:')}
              </span>

              <button
                onClick={() => setCategoryFilter('ALL')}
                className={`px-3 py-1.5 text-xs transition-colors rounded-none font-medium flex items-center gap-1.5 ${
                  categoryFilter === 'ALL'
                    ? 'bg-[#C5A880] text-[#0A0E14] font-semibold'
                    : 'bg-[#141B24] text-gray-400 hover:text-white border border-[#222B35]'
                }`}
              >
                <span>{t('Tất Cả', 'All')}</span>
                <span className="font-mono text-[10px] opacity-75">{tickets.length}</span>
              </button>

              <button
                onClick={() => setCategoryFilter('REPAIR')}
                className={`px-3 py-1.5 text-xs transition-colors rounded-none font-medium flex items-center gap-1.5 ${
                  categoryFilter === 'REPAIR'
                    ? 'bg-[#C5A880] text-[#0A0E14] font-semibold'
                    : 'bg-[#141B24] text-gray-400 hover:text-white border border-[#222B35]'
                }`}
              >
                <Wrench className="w-3 h-3 opacity-80" />
                <span>{t('Sửa Chữa', 'Repairs')}</span>
                <span className="font-mono text-[10px] opacity-75">{repairCount}</span>
              </button>

              <button
                onClick={() => setCategoryFilter('FEEDBACK')}
                className={`px-3 py-1.5 text-xs transition-colors rounded-none font-medium flex items-center gap-1.5 ${
                  categoryFilter === 'FEEDBACK'
                    ? 'bg-[#C5A880] text-[#0A0E14] font-semibold'
                    : 'bg-[#141B24] text-gray-400 hover:text-white border border-[#222B35]'
                }`}
              >
                <MessageSquare className="w-3 h-3 opacity-80" />
                <span>{t('Phản Ánh & Ý Kiến', 'Feedback & Requests')}</span>
                <span className="font-mono text-[10px] opacity-75">{feedbackCount}</span>
              </button>
            </div>

            {/* Keyword Search Input & View Mode Toggle */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="relative w-48 sm:w-60">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('Tìm căn hộ, cư dân, KTV...', 'Search apt, resident, tech...')}
                  className="w-full pl-8 pr-7 py-1.5 bg-[#0A0E14] border border-[#222B35] focus:border-[#C5A880] text-xs text-white placeholder-gray-500 rounded-none outline-none transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center border border-[#222B35] bg-[#0A0E14] p-0.5 shrink-0">
                <button
                  onClick={() => setViewMode('KANBAN')}
                  className={`px-2.5 py-1 text-xs font-medium flex items-center gap-1.5 rounded-none transition-colors whitespace-nowrap ${
                    viewMode === 'KANBAN'
                      ? 'bg-[#C5A880] text-[#0A0E14] font-semibold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  title={t('Chế độ bảng Kanban', 'Kanban Board View')}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>{t('Bảng', 'Board')}</span>
                </button>
                <button
                  onClick={() => setViewMode('LIST')}
                  className={`px-2.5 py-1 text-xs font-medium flex items-center gap-1.5 rounded-none transition-colors whitespace-nowrap ${
                    viewMode === 'LIST'
                      ? 'bg-[#C5A880] text-[#0A0E14] font-semibold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  title={t('Chế độ danh sách / bảng chi tiết', 'Table/List View')}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>{t('Danh Sách', 'List')}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Operations Progression Ribbon (Quiet, Luxury, Minimal) */}
          <div className="bg-[#0E131B] border border-[#1E2630] px-3.5 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#C5A880] rounded-none"></span>
              <span className="font-semibold text-gray-300 uppercase tracking-wider text-[11px]">
                {t('Tiến Trình Nghiệp Vụ', 'Operations Pipeline')}
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-1.5 text-gray-400">
                <span>1. {t('Tiếp nhận:', 'Intake:')}</span>
                <span className="text-white font-bold">{openTickets.length}</span>
              </div>
              <span className="text-gray-600 hidden sm:inline">/</span>
              <div className="flex items-center gap-1.5 text-gray-400">
                <span>2. {t('Hiện trường:', 'In Progress:')}</span>
                <span className="text-amber-400 font-bold">{inProgressTickets.length}</span>
              </div>
              <span className="text-gray-600 hidden sm:inline">/</span>
              <div className="flex items-center gap-1.5 text-gray-400">
                <span>3. {t('Đã nghiệm thu:', 'Closed:')}</span>
                <span className="text-emerald-400 font-bold">{resolvedTickets.length}</span>
              </div>
            </div>
          </div>

          {/* Main Requests View (Kanban Board vs Structured List) */}
          {viewMode === 'KANBAN' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1: Chờ tiếp nhận */}
            <div className="bg-[#121820] border border-[#222B35] flex flex-col shadow-xl">
              <div className="p-3.5 border-b border-[#222B35] flex items-center justify-between bg-[#161B22]">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 bg-blue-500 shrink-0"></span>
                  <span className="text-xs uppercase tracking-wider font-semibold text-gray-200 whitespace-nowrap">
                    {t('1. Chờ Tiếp Nhận', '1. Pending Assignment')}
                  </span>
                  <span className="px-1.5 py-0.5 bg-blue-950/80 border border-blue-500/40 text-blue-300 font-mono text-[10px] font-bold shrink-0">
                    {openTickets.length}
                  </span>
                </div>

                <span className="text-[10px] font-mono text-[#C5A880] bg-[#141B24] border border-[#C5A880]/30 px-2 py-0.5 flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                  <span className="w-1.5 h-1.5 bg-[#C5A880] rounded-none animate-ping shrink-0"></span>
                  <span>{t('AI Phân Công 24/7', 'AI Auto-Dispatch 24/7')}</span>
                </span>
              </div>

              <div className="p-4 space-y-3.5 flex-1 min-h-[420px] overflow-y-auto flex flex-col justify-start">
                {openTickets.length === 0 ? (
                  <div className="text-xs text-gray-500 italic text-center py-16">
                    Không có phiếu nào đang chờ tiếp nhận.
                  </div>
                ) : (
                  openTickets.map((ticket) => {
                    const isFeedback = ticket.ticket_type !== 'REPAIR';
                    const isRepair = !isFeedback;

                    return (
                      <div 
                        key={ticket.id} 
                        className="group p-3.5 bg-[#0E131B] border border-[#1E2630] hover:border-[#C5A880]/50 transition-colors space-y-2.5 rounded-none"
                      >
                        {/* Header: ID, Time, Unit & Actions */}
                        <div className="flex items-center justify-between gap-1 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[#C5A880] font-bold">
                              {ticket.nks_id ? `#${ticket.nks_id}` : `#${ticket.id.replace('TICK-', '')}`}
                            </span>
                            <span className="text-[10px] text-gray-500 font-mono">
                              {new Date(ticket.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[10px] px-1.5 py-0.5 bg-[#141B24] border border-[#222B35] text-gray-300">
                              {ticket.apt_code.startsWith('Khu') || ticket.apt_code.startsWith('Block') || ticket.apt_code.startsWith('Tiện') ? ticket.apt_code : `Căn ${ticket.apt_code}`}
                            </span>
                            <button
                              onClick={() => handleDeleteTicket(ticket)}
                              className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-rose-400 p-0.5 transition-opacity"
                              title={t('Xóa phiếu')}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Resident Name & Phone */}
                        <div className="text-xs text-gray-300 font-medium flex items-center justify-between">
                          <span className="text-white">{ticket.resident_name}</span>
                          {ticket.resident_phone && (
                            <span className="font-mono text-gray-500 text-[11px]">{ticket.resident_phone}</span>
                          )}
                        </div>

                        {/* Issue Content & Inline Photo */}
                        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                          {ticket.content}
                        </p>

                        {ticket.before_image && (
                          <div className="flex items-center gap-2 pt-0.5">
                            <img 
                              src={ticket.before_image} 
                              alt="Before" 
                              className="w-10 h-10 object-cover border border-[#222B35] cursor-pointer hover:border-[#C5A880] transition-colors"
                              onClick={() => setInspectingTicket(ticket)}
                            />
                            <span className="text-[11px] text-gray-500">{t('Ảnh hiện trường')}</span>
                          </div>
                        )}

                        {/* Operational Details (Clean Text Line, Zero Boxes) */}
                        {isRepair && ticket.suggested_technician && (
                          <div className="flex items-center justify-between text-[11px] text-gray-400 pt-0.5">
                            <span className="flex items-center gap-1.5 text-gray-300 truncate">
                              <Sparkles className="w-3 h-3 text-[#C5A880] shrink-0" />
                              <span className="truncate">{t('Gợi ý:')} <strong className="text-white font-medium">{ticket.suggested_technician}</strong></span>
                            </span>
                            <span className="text-[10px] text-gray-500 font-mono shrink-0 ml-2">ETA 30p</span>
                          </div>
                        )}

                        {isFeedback && (ticket.ai_suggested_reply || ticket.admin_reply) && (
                          <div className="text-[11px] text-gray-400 italic line-clamp-1 pt-0.5">
                            <span className="text-gray-300 not-italic font-medium">{t('Dự thảo:')} </span>"{ticket.admin_reply || ticket.ai_suggested_reply}"
                          </div>
                        )}

                        {/* Card Actions */}
                        <div className="pt-2 border-t border-[#1E2630] flex items-center justify-between flex-wrap gap-2">
                          <span className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
                            <Clock className="w-3 h-3 text-blue-400/80" />
                            <span>{t('Chờ phân công')}</span>
                          </span>

                          <div className="flex items-center gap-1.5">
                            {isFeedback ? (
                              <button
                                onClick={() => {
                                  setFeedbackReplyTicket(ticket);
                                  setFeedbackReplyContent(ticket.admin_reply || ticket.ai_suggested_reply || generateSuggestedAdminReply(ticket.content, ticket.ai_category, ticket.resident_name, ticket.apt_code));
                                  setReplyEngineerName(ticket.assigned_technician || '');
                                }}
                                className="h-7 px-2.5 bg-[#C5A880] hover:bg-[#E2C9A5] text-[#0A0E14] text-xs font-semibold rounded-none transition-colors flex items-center gap-1 shadow"
                              >
                                <MessageSquare className="w-3 h-3 text-[#0A0E14]" />
                                <span>{t('Phản Hồi / Đáp Lại')}</span>
                              </button>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                {ticket.suggested_technician && (
                                  <button
                                    onClick={() => handleApproveAiRecommendation(ticket)}
                                    className="h-7 px-2.5 bg-[#C5A880] hover:bg-[#E2C9A5] text-[#0A0E14] text-xs font-semibold rounded-none transition-colors flex items-center gap-1"
                                    title={t('Duyệt phân công KTV theo đề xuất của AI')}
                                  >
                                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                    <span>{t('Duyệt KTV')}</span>
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setAssigningTicket(ticket);
                                    setSelectedTechId(ticket.suggested_technician_id || 'KTV-01');
                                  }}
                                  className="h-7 px-2 bg-transparent hover:bg-[#141B24] border border-[#222B35] hover:border-[#C5A880] text-gray-400 hover:text-white text-xs font-medium rounded-none transition-colors flex items-center gap-1"
                                  title={t('Chỉ định hoặc thay đổi thợ KTV phụ trách')}
                                >
                                  <Users className="w-3 h-3 text-gray-400" />
                                  <span>{ticket.suggested_technician ? t('Đổi') : t('Chỉ Định')}</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Column 2: Đang xử lý */}
            <div className="bg-[#121820] border border-[#222B35] flex flex-col shadow-xl">
              <div className="p-3.5 border-b border-[#222B35] flex items-center justify-between bg-[#161B22]">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 bg-amber-400 rounded-none animate-pulse shrink-0"></span>
                  <span className="text-xs uppercase tracking-wider font-semibold text-white whitespace-nowrap">
                    {t('2. Đang Xử Lý', '2. In Progress')}
                  </span>
                  <span className="px-1.5 py-0.5 bg-amber-950/80 border border-amber-500/40 text-amber-300 font-mono text-[10px] font-bold shrink-0">
                    {inProgressTickets.length}
                  </span>
                </div>

                <span className="text-[10px] font-mono text-amber-300 bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                  <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse shrink-0"></span>
                  <span>{t('Hiện Trường', 'On-Site')}</span>
                </span>
              </div>

              <div className="p-4 space-y-3.5 flex-1 min-h-[420px] overflow-y-auto flex flex-col justify-start">
                {inProgressTickets.length === 0 ? (
                  <div className="text-xs text-gray-500 italic text-center py-16">
                    Không có phiếu nào đang xử lý.
                  </div>
                ) : (
                  inProgressTickets.map((ticket) => {
                    const isFeedback = ticket.ticket_type !== 'REPAIR';

                    return (
                      <div 
                        key={ticket.id} 
                        className="group p-3.5 bg-[#0E131B] border border-[#1E2630] hover:border-[#C5A880]/50 transition-colors space-y-2.5 rounded-none"
                      >
                        {/* Header: ID, Time, Badge & Actions */}
                        <div className="flex items-center justify-between gap-1 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[#C5A880] font-bold">
                              {ticket.nks_id ? `#${ticket.nks_id}` : `#${ticket.id.replace('TICK-', '')}`}
                            </span>
                            <span className="text-[10px] text-gray-500 font-mono">
                              {new Date(ticket.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 bg-[#141B24] text-gray-300 border border-[#222B35] text-[10px] font-mono">
                              {ticket.ai_category || (isFeedback ? 'Ý Kiến' : 'Kỹ Thuật')}
                            </span>
                            <button
                              onClick={() => handleDeleteTicket(ticket)}
                              className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-rose-400 p-0.5 transition-opacity"
                              title={t('Xóa phiếu')}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Apartment & Resident Info */}
                        <div className="text-xs text-gray-300 font-medium flex items-center justify-between">
                          <span className="text-white font-semibold">
                            {ticket.apt_code.startsWith('Khu') || ticket.apt_code.startsWith('Block') || ticket.apt_code.startsWith('Tiện') ? ticket.apt_code : `Căn ${ticket.apt_code}`} • {ticket.resident_name}
                          </span>
                          {ticket.resident_phone && (
                            <span className="font-mono text-gray-500 text-[11px] font-normal">{ticket.resident_phone}</span>
                          )}
                        </div>

                        {/* Issue Content */}
                        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                          {ticket.content}
                        </p>

                        {/* Rework Reason Alert (if previously rejected) */}
                        {ticket.rework_reason && (
                          <div className="text-[11px] text-rose-300 bg-rose-950/50 border border-rose-500/40 p-1.5 flex items-start gap-1.5 leading-relaxed rounded-none">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-semibold text-rose-400">{t('Yêu Cầu Làm Lại:')} </span>
                              <span>{ticket.rework_reason}</span>
                            </div>
                          </div>
                        )}

                        {/* Operational Status (Clean Line, Zero Boxes) */}
                        {isFeedback ? (
                          <div className="flex items-center gap-1.5 text-[11px] text-gray-400 pt-0.5">
                            <MessageSquare className="w-3 h-3 text-[#C5A880] shrink-0" />
                            <span className="truncate">{t('BQL CSKH đang kiểm tra & xử lý hiện trường')}</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between text-[11px] text-gray-400 pt-0.5">
                            <span className="flex items-center gap-1.5 text-gray-300 truncate">
                              <Wrench className="w-3 h-3 text-[#C5A880] shrink-0" />
                              <span className="truncate text-white font-medium">{ticket.assigned_technician || t('KTV Chưa Chỉ Định')}</span>
                              {ticket.assigned_technician_phone && (
                                <span className="text-[10px] text-gray-500 font-mono">({ticket.assigned_technician_phone})</span>
                              )}
                            </span>
                            <span className="text-[10px] text-gray-500 font-mono shrink-0 ml-2">{ticket.scheduled_time || 'SLA 45p'}</span>
                          </div>
                        )}

                        {/* Card Actions */}
                        <div className="pt-2 border-t border-[#1E2630] flex items-center justify-between flex-wrap gap-2">
                          <span className="text-[10px] text-amber-400 font-mono flex items-center gap-1.5 px-2 py-0.5 bg-amber-950/40 border border-amber-500/30">
                            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse shrink-0"></span>
                            <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                            <span>{isFeedback ? t('24h') : t('SLA 45p')}</span>
                          </span>

                          <div className="flex items-center gap-1.5">
                            {isFeedback ? (
                              <button
                                onClick={() => {
                                  setFeedbackReplyTicket(ticket);
                                  setFeedbackReplyContent(ticket.admin_reply || generateSuggestedAdminReply(ticket.content, ticket.ai_category));
                                  setReplyEngineerName(ticket.assigned_technician || '');
                                }}
                                className="h-7 px-2.5 bg-[#141B24] hover:bg-[#1E2631] border border-[#222B35] text-gray-300 hover:text-white text-xs font-medium rounded-none transition-colors flex items-center gap-1"
                              >
                                <Send className="w-3 h-3 text-[#C5A880]" />
                                <span>{t('Phản Hồi')}</span>
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleOpenResolveModal(ticket)}
                                  className="h-7 px-2.5 bg-[#10B981]/20 hover:bg-[#10B981]/30 border border-[#10B981]/50 text-[#10B981] text-xs font-medium rounded-none transition-colors flex items-center gap-1"
                                  title={t('BQL nghiệm thu và ghi nhận hồ sơ kỹ thuật')}
                                >
                                  <Check className="w-3.5 h-3.5 shrink-0" />
                                  <span>{t('Nghiệm Thu')}</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setAssigningTicket(ticket);
                                    setSelectedTechId(ticket.assigned_technician_id || 'KTV-01');
                                  }}
                                  className="h-7 px-2 bg-transparent hover:bg-[#141B24] border border-[#222B35] hover:border-[#C5A880] text-gray-400 hover:text-white text-xs font-medium rounded-none transition-colors flex items-center gap-1"
                                  title={t('Đổi KTV')}
                                >
                                  <Users className="w-3 h-3 text-gray-400 shrink-0" />
                                  <span>{t('Đổi')}</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setFeedbackReplyTicket(ticket);
                                    setFeedbackReplyContent(ticket.admin_reply || generateSuggestedAdminReply(ticket.content, ticket.ai_category));
                                    setReplyEngineerName(ticket.assigned_technician || '');
                                  }}
                                  className="h-7 px-2 bg-transparent hover:bg-[#141B24] border border-[#222B35] hover:border-[#C5A880] text-gray-400 hover:text-white text-xs font-medium rounded-none transition-colors flex items-center gap-1"
                                  title={t('Ghi chú / phản hồi cư dân')}
                                >
                                  <MessageSquare className="w-3 h-3 text-gray-400 shrink-0" />
                                  <span>{t('Phản Hồi')}</span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Column 3: Đã nghiệm thu / Đã đóng */}
            <div className="bg-[#121820] border border-[#222B35] flex flex-col shadow-xl">
              <div className="p-3.5 border-b border-[#222B35] flex items-center justify-between bg-[#161B22]">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-none shrink-0"></span>
                  <span className="text-xs uppercase tracking-wider font-semibold text-gray-200 whitespace-nowrap">
                    {t('3. Đã Xử Lý Xong', '3. Audited & Closed')}
                  </span>
                  <span className="px-1.5 py-0.5 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-mono text-[10px] font-bold shrink-0">
                    {resolvedTickets.length}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>{t('Hoàn Tất', 'Completed')}</span>
                </span>
              </div>

              <div className="p-4 space-y-3.5 flex-1 min-h-[420px] overflow-y-auto flex flex-col justify-start">
                {resolvedTickets.length === 0 ? (
                  <div className="text-xs text-gray-500 italic text-center py-16">
                    Chưa có phiếu hoàn thành.
                  </div>
                ) : (
                  resolvedTickets.map((ticket) => {
                    const isFeedback = ticket.ticket_type !== 'REPAIR';

                    return (
                      <div 
                        key={ticket.id} 
                        className="group p-3.5 bg-[#0E131B] border border-[#1E2630] hover:border-[#C5A880]/50 transition-colors space-y-2.5 rounded-none"
                      >
                        {/* Header: ID, Time, Badge & Actions */}
                        <div className="flex items-center justify-between gap-1 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[#C5A880] font-bold">
                              {ticket.nks_id ? `#${ticket.nks_id}` : `#${ticket.id.replace('TICK-', '')}`}
                            </span>
                            <span className="text-[10px] text-gray-500 font-mono">
                              {new Date(ticket.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {ticket.rating ? (
                              <span className="px-1.5 py-0.5 bg-[#141B24] text-amber-400 border border-[#222B35] text-[10px] font-mono flex items-center gap-1">
                                <Star className="w-3 h-3 fill-current text-amber-400" /> {ticket.rating}★
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 text-[10px] font-mono">
                                {t('Đã Nghiệm Thu')}
                              </span>
                            )}
                            <button
                              onClick={() => handleDeleteTicket(ticket)}
                              className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-rose-400 p-0.5 transition-opacity"
                              title={t('Xóa phiếu')}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Apartment & Resident Info */}
                        <div className="text-xs text-gray-300 font-medium flex items-center justify-between">
                          <span className="text-white font-semibold">
                            {ticket.apt_code.startsWith('Khu') || ticket.apt_code.startsWith('Block') || ticket.apt_code.startsWith('Tiện') ? ticket.apt_code : `Căn ${ticket.apt_code}`} • {ticket.resident_name}
                          </span>
                          {ticket.resident_phone && (
                            <span className="font-mono text-gray-500 text-[11px] font-normal">{ticket.resident_phone}</span>
                          )}
                        </div>

                        {/* Issue Content */}
                        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                          {ticket.content}
                        </p>

                        {/* Feedback Response Summary (Subtle Line, No Boxes) */}
                        {isFeedback && ticket.admin_reply && (
                          <div className="text-[11px] text-gray-400 italic line-clamp-1 pt-0.5">
                            <span className="text-gray-300 not-italic font-medium">{t('BQL: ')}</span>"{ticket.admin_reply}"
                          </div>
                        )}

                        {/* Repair Resolution & Visual Inspection (Clean Inline Preview, Zero Boxes) */}
                        {!isFeedback && (ticket.before_image || ticket.after_image || ticket.ai_verification || ticket.resolution_notes) && (
                          <div className="flex items-center justify-between gap-2 pt-0.5">
                            <div className="flex items-center gap-1.5">
                              {ticket.before_image && (
                                <img 
                                  src={ticket.before_image} 
                                  alt="Before" 
                                  className="w-8 h-8 object-cover border border-[#222B35] cursor-pointer hover:border-[#C5A880] transition-colors"
                                  onClick={() => setInspectingTicket(ticket)}
                                  title={t('Trước sửa')}
                                />
                              )}
                              {ticket.after_image && (
                                <img 
                                  src={ticket.after_image} 
                                  alt="After" 
                                  className="w-8 h-8 object-cover border border-[#10B981]/50 cursor-pointer hover:border-[#10B981] transition-colors"
                                  onClick={() => setInspectingTicket(ticket)}
                                  title={t('Sau sửa')}
                                />
                              )}
                              {ticket.resolution_notes && (
                                <span className="text-[11px] text-gray-400 italic line-clamp-1 max-w-[140px]">
                                  "{ticket.resolution_notes}"
                                </span>
                              )}
                            </div>

                            {ticket.ai_verification ? (
                              <span className="text-[10px] font-mono text-emerald-400/90 flex items-center gap-1 shrink-0">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                <span>AI {ticket.ai_verification.confidence_score}%</span>
                              </span>
                            ) : (
                              <span className="text-[10px] text-emerald-400/90 font-mono flex items-center gap-1 shrink-0">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>{t('Đã lưu')}</span>
                              </span>
                            )}
                          </div>
                        )}

                        {/* Card Footer */}
                        <div className="pt-2 border-t border-[#1E2630] flex items-center justify-between text-[11px] text-gray-400">
                          <span className="truncate text-gray-500">
                            KTV: <span className="text-gray-300 font-medium">{ticket.assigned_technician || 'Kỹ thuật viên'}</span>
                          </span>
                          <button
                            onClick={() => setInspectingTicket(ticket)}
                            className="h-6 px-2.5 bg-transparent hover:bg-[#141B24] border border-[#222B35] hover:border-[#C5A880] text-[#C5A880] text-[10px] font-medium rounded-none transition-colors flex items-center gap-1"
                          >
                            <FileText className="w-3 h-3" />
                            <span>{t('Biên Bản')}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        ) : (
            /* STRUCTURED TABLE / LIST VIEW */
            <div className="bg-[#121820] border border-[#222B35] shadow-xl overflow-hidden rounded-none">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-300">
                  <thead className="bg-[#161B22] border-b border-[#222B35] text-[11px] text-gray-400 uppercase tracking-wider font-mono">
                    <tr>
                      <th className="py-3 px-3.5 whitespace-nowrap">{t('Mã Vé & Ngày', 'Ticket ID & Date')}</th>
                      <th className="py-3 px-3.5 whitespace-nowrap">{t('Căn Hộ & Cư Dân', 'Unit & Resident')}</th>
                      <th className="py-3 px-3.5 whitespace-nowrap">{t('Phân Loại', 'Category')}</th>
                      <th className="py-3 px-3.5 min-w-[240px] max-w-[320px]">{t('Nội Dung Sự Cố', 'Incident Description')}</th>
                      <th className="py-3 px-3.5 whitespace-nowrap">{t('Kỹ Thuật Viên', 'Technician')}</th>
                      <th className="py-3 px-3.5 whitespace-nowrap">{t('Tiến Độ', 'Stage & SLA')}</th>
                      <th className="py-3 px-3.5 text-right whitespace-nowrap">{t('Thao Tác BQL', 'Actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#222B35]/60">
                    {filteredTickets.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-gray-500 italic">
                          {t('Không có yêu cầu nào phù hợp với bộ lọc hiện tại.', 'No service requests match the current filters.')}
                        </td>
                      </tr>
                    ) : (
                      filteredTickets.map((ticket) => {
                        const isFeedback = ticket.ticket_type !== 'REPAIR';

                        return (
                          <tr key={ticket.id} className="hover:bg-[#161B22]/70 transition-colors">
                            <td className="py-3 px-3.5 whitespace-nowrap font-mono">
                              <div className="text-[#C5A880] font-bold">
                                {ticket.nks_id ? `#${ticket.nks_id}` : `#${ticket.id.replace('TICK-', '')}`}
                              </div>
                              <div className="text-[10px] text-gray-400">
                                {new Date(ticket.created_at).toLocaleDateString('vi-VN')} {new Date(ticket.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </td>
                            <td className="py-3 px-3.5 whitespace-nowrap">
                              <div className="font-semibold text-white">
                                {ticket.apt_code.startsWith('Khu') || ticket.apt_code.startsWith('Block') || ticket.apt_code.startsWith('Tiện') ? ticket.apt_code : `Căn ${ticket.apt_code}`}
                              </div>
                              <div className="text-[11px] text-gray-400">
                                {ticket.resident_name} {ticket.resident_phone ? `(${ticket.resident_phone})` : ''}
                              </div>
                            </td>
                            <td className="py-3 px-3.5 whitespace-nowrap">
                              {isFeedback ? (
                                <span className="px-2 py-0.5 bg-rose-950/80 text-rose-300 border border-rose-500/60 text-[10px] font-bold">
                                  {t('Phản Ánh')}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-[#0E131B] text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold">
                                  🔧 {ticket.ai_category}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3.5 max-w-[320px]">
                              <p className="line-clamp-2 text-xs text-gray-200 leading-relaxed">
                                {ticket.content}
                              </p>
                              {ticket.before_image && (
                                <button
                                  onClick={() => setInspectingTicket(ticket)}
                                  className="text-[10px] text-[#C5A880] hover:underline mt-0.5 inline-flex items-center gap-1"
                                >
                                  {t('Xem ảnh hiện trường')}
                                </button>
                              )}
                            </td>
                            <td className="py-3 px-3.5 whitespace-nowrap">
                              {ticket.assigned_technician ? (
                                <div>
                                  <div className="font-semibold text-white flex items-center gap-1.5">
                                    <Wrench className="w-3.5 h-3.5 text-amber-400" />
                                    <span>{ticket.assigned_technician}</span>
                                  </div>
                                  {ticket.assigned_technician_phone && (
                                    <div className="text-[10px] text-gray-400 font-mono">
                                      {ticket.assigned_technician_phone}
                                    </div>
                                  )}
                                </div>
                              ) : ticket.suggested_technician ? (
                                <div className="text-[11px] text-[#C5A880]">
                                  <span className="flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    <span>AI: {ticket.suggested_technician} ({ticket.suggested_match_score || 95}%)</span>
                                  </span>
                                </div>
                              ) : (
                                <span className="text-gray-500 italic text-[11px]">{t('Chưa chỉ định')}</span>
                              )}
                            </td>
                            <td className="py-3 px-3.5 whitespace-nowrap">
                              {ticket.status === 'Open' ? (
                                <span className="px-2 py-0.5 bg-[#141B24] border border-[#222B35] text-blue-300 text-[10px] font-mono">
                                  {t('1. Tiếp Nhận')}
                                </span>
                              ) : ticket.status === 'In_Progress' || ticket.status === 'Assigned' ? (
                                <span className="px-2 py-0.5 bg-[#141B24] border border-[#222B35] text-amber-300 text-[10px] font-mono">
                                  {t('2. Đang Xử Lý')}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] text-[10px] font-mono">
                                  {t('3. Nghiệm Thu')}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3.5 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                {ticket.status === 'Open' && (
                                  <>
                                    {isFeedback ? (
                                      <button
                                        onClick={() => {
                                          setFeedbackReplyTicket(ticket);
                                          setFeedbackReplyContent(ticket.admin_reply || ticket.ai_suggested_reply || generateSuggestedAdminReply(ticket.content, ticket.ai_category, ticket.resident_name, ticket.apt_code));
                                          setReplyEngineerName(ticket.assigned_technician || '');
                                        }}
                                        className="h-6 px-2.5 bg-[#C5A880] hover:bg-[#E2C9A5] text-[#0A0E14] text-[11px] font-semibold rounded-none transition-colors flex items-center gap-1"
                                      >
                                        <MessageSquare className="w-3 h-3 text-[#0A0E14]" />
                                        <span>{t('Phản Hồi')}</span>
                                      </button>
                                    ) : (
                                      <>
                                        {ticket.suggested_technician && (
                                          <button
                                            onClick={() => handleApproveAiRecommendation(ticket)}
                                            className="h-6 px-2 bg-[#C5A880] hover:bg-[#E2C9A5] text-[#0A0E14] text-[11px] font-semibold rounded-none transition-colors"
                                            title={t('Duyệt KTV')}
                                          >
                                            <Check className="w-3 h-3 inline mr-1 stroke-[2.5]" />
                                            {t('Duyệt KTV')}
                                          </button>
                                        )}
                                        <button
                                          onClick={() => {
                                            setAssigningTicket(ticket);
                                            setSelectedTechId(ticket.suggested_technician_id || 'KTV-01');
                                          }}
                                          className="h-6 px-2 bg-transparent hover:bg-[#141B24] border border-[#222B35] hover:border-[#C5A880] text-gray-300 hover:text-white text-[11px] rounded-none transition-colors"
                                        >
                                          {t('Chỉ Định')}
                                        </button>
                                      </>
                                    )}
                                  </>
                                )}
                                {(ticket.status === 'In_Progress' || ticket.status === 'Assigned') && (
                                  <>
                                    <button
                                      onClick={() => handleOpenResolveModal(ticket)}
                                      className="h-6 px-2 bg-[#10B981]/20 hover:bg-[#10B981]/30 border border-[#10B981]/50 text-[#10B981] text-[11px] font-medium rounded-none transition-colors"
                                      title={t('BQL nghiệm thu')}
                                    >
                                      <Check className="w-3 h-3 inline mr-1" />
                                      {t('Nghiệm Thu')}
                                    </button>
                                    <button
                                      onClick={() => {
                                        setAssigningTicket(ticket);
                                        setSelectedTechId(ticket.assigned_technician_id || 'KTV-01');
                                      }}
                                      className="h-6 px-2 bg-transparent hover:bg-[#141B24] border border-[#222B35] hover:border-[#C5A880] text-gray-300 hover:text-white text-[11px] rounded-none transition-colors"
                                    >
                                      {t('Đổi KTV')}
                                    </button>
                                    <button
                                      onClick={() => {
                                        setFeedbackReplyTicket(ticket);
                                        setFeedbackReplyContent(ticket.admin_reply || generateSuggestedAdminReply(ticket.content, ticket.ai_category));
                                        setReplyEngineerName(ticket.assigned_technician || '');
                                      }}
                                      className="h-6 px-2 bg-transparent hover:bg-[#141B24] border border-[#222B35] hover:border-[#C5A880] text-gray-300 hover:text-white text-[11px] rounded-none transition-colors"
                                    >
                                      {t('Phản Hồi')}
                                    </button>
                                  </>
                                )}
                                {ticket.status === 'Resolved' && (
                                  <button
                                    onClick={() => setInspectingTicket(ticket)}
                                    className="h-6 px-2.5 bg-transparent hover:bg-[#141B24] border border-[#222B35] hover:border-[#C5A880] text-[#C5A880] text-[11px] font-medium rounded-none transition-colors flex items-center gap-1"
                                  >
                                    <FileText className="w-3 h-3" />
                                    <span>{t('Hồ Sơ')}</span>
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteTicket(ticket)}
                                  className="text-gray-500 hover:text-rose-400 p-1 transition-colors"
                                  title={t('Xóa phiếu')}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
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
                  Bảng Lương & Thù Lao Kỹ Thuật Viên Chung Cư (Tháng Này)
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
      {/* MODAL 0: BQL TIẾP NHẬN SỰ CỐ MỚI (HOTLINE 1900 8899)                      */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateTicketSubmit} className="bg-[#0E131B] border border-[#C5A880]/60 max-w-xl w-full p-6 space-y-4 shadow-2xl rounded-none animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#222B35] pb-3">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-[#C5A880] font-semibold flex items-center gap-1.5">
                  <PhoneCall className="w-3.5 h-3.5" /> Hotline 1900 8899 • Trực Ban Kỹ Thuật
                </div>
                <h3 className="font-serif text-lg font-bold text-white mt-0.5">
                  {t('Tiếp Nhận Sự Cố & Yêu Cầu Kỹ Thuật', 'Incident Intake & Maintenance Request')}
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Căn hộ */}
            <div className="space-y-1.5">
              <label className="text-xs text-gray-300 font-semibold flex items-center justify-between">
                <span>{t('Căn Hộ Báo Sự Cố:', 'Apartment Unit:')}</span>
                <span className="text-[10px] text-[#C5A880] font-mono">* Tự động nhận diện hồ sơ cư dân</span>
              </label>
              <select
                value={newAptCode}
                onChange={(e) => handleAptCodeChange(e.target.value)}
                className="w-full bg-[#141B24] border border-[#222B35] focus:border-[#C5A880] text-xs text-white p-2.5 rounded-none outline-none font-mono"
              >
                {apartmentUnits.length > 0 ? (
                  apartmentUnits.map((u) => (
                    <option key={u.code} value={u.code}>
                      Căn {u.code} — Tòa {u.towerName} {u.owner?.name ? `(${u.owner.name})` : ''}
                    </option>
                  ))
                ) : (
                  <option value="CH-06">Căn CH-06 — Tòa BS-07</option>
                )}
              </select>
            </div>

            {/* Thông tin người báo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-gray-400">{t('Họ Tên Cư Dân / Người Báo:', 'Resident Name:')}</label>
                <input
                  type="text"
                  value={newResidentName}
                  onChange={(e) => setNewResidentName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="w-full bg-[#141B24] border border-[#222B35] focus:border-[#C5A880] text-xs text-white p-2 rounded-none outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-400">{t('Số Điện Thoại Liên Hệ:', 'Phone Number:')}</label>
                <input
                  type="text"
                  value={newResidentPhone}
                  onChange={(e) => setNewResidentPhone(e.target.value)}
                  placeholder="0912 345 678"
                  className="w-full bg-[#141B24] border border-[#222B35] focus:border-[#C5A880] text-xs text-white p-2 rounded-none outline-none font-mono"
                />
              </div>
            </div>

            {/* Mục đích & Hạng mục */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-gray-400">{t('Mục Đích Yêu Cầu:', 'Request Purpose:')}</label>
                <select
                  value={newTicketType}
                  onChange={(e) => setNewTicketType(e.target.value as any)}
                  className="w-full bg-[#141B24] border border-[#222B35] focus:border-[#C5A880] text-xs text-white p-2 rounded-none outline-none"
                >
                  <option value="REPAIR">🔧 {t('Sự Cố Kỹ Thuật (Cần KTV Sửa)', 'Technical Repair')}</option>
                  <option value="FEEDBACK">📢 {t('Phản Ánh & Ý Kiến (BQL Đáp Lại)', 'Resident Feedback')}</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-400">{t('Hạng Mục Kỹ Thuật:', 'Category:')}</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full bg-[#141B24] border border-[#222B35] focus:border-[#C5A880] text-xs text-white p-2 rounded-none outline-none"
                >
                  <option value="Điện">⚡ Điện dân dụng / Thiết bị</option>
                  <option value="Nước">💧 Cấp thoát nước / Thiết bị vệ sinh</option>
                  <option value="Vệ sinh">🧹 Vệ sinh hành lang / Môi trường</option>
                  <option value="An ninh">🛡️ An ninh / Thẻ từ ra vào</option>
                  <option value="Khác">📦 Khác / Cơ sở hạ tầng</option>
                </select>
              </div>
            </div>

            {/* Nội dung chi tiết */}
            <div className="space-y-1">
              <label className="text-xs text-gray-300 font-semibold">{t('Nội Dung Mô Tả Sự Cố / Hiện Trường:', 'Incident Description:')}</label>
              <textarea
                rows={3}
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder={t('Ví dụ: Cư dân báo rò rỉ van cấp nước máy giặt tràn ra sàn ban công, cần thợ kiểm tra gấp...', 'e.g., Water valve leaking, urgent check needed...')}
                className="w-full bg-[#141B24] border border-[#222B35] focus:border-[#C5A880] text-xs text-white p-2.5 rounded-none outline-none leading-relaxed"
                required
              />
            </div>

            {/* AI Assistant Info */}
            <div className="p-3 bg-[#141B24] border border-[#C5A880]/30 text-xs flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-[#C5A880] shrink-0 mt-0.5" />
              <div className="text-[11px] text-gray-300 leading-relaxed">
                <span className="font-semibold text-[#C5A880]">{t('Cơ Chế Phân Bổ AI Tự Động:')}</span>{' '}
                {t('Phiếu sẽ tức thì được đưa vào cột "1. Chờ Tiếp Nhận" kèm phân tích chấm điểm KTV tối ưu. Ban Quản Lý chỉ cần 1 chạm duyệt đề xuất hoặc linh hoạt chỉ định thợ khác.')}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#222B35]">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 border border-gray-700 text-xs text-gray-300 hover:text-white rounded-none"
              >
                {t('Hủy', 'Cancel')}
              </button>
              <button
                type="submit"
                disabled={isSubmittingNewTicket}
                className="px-5 py-2 bg-[#C5A880] hover:bg-[#E2C9A5] text-[#0A0E14] text-xs font-bold uppercase tracking-wider transition-colors shadow-lg flex items-center gap-1.5 rounded-none disabled:opacity-50"
              >
                <Plus className="w-4 h-4 text-[#0A0E14] stroke-[2.5]" />
                <span>{isSubmittingNewTicket ? t('Đang Tiếp Nhận...', 'Submitting...') : t('Tiếp Nhận & Đưa Vào Hàng Đợi', 'Confirm & Queue Incident')}</span>
              </button>
            </div>
          </form>
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <form 
            onSubmit={handleConfirmResolve} 
            className="bg-[#121820] border border-[#C5A880] max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl animate-fadeIn rounded-none"
          >
            {/* Modal Header (Fixed) */}
            <div className="flex items-center justify-between border-b border-[#222B35] px-5 py-3.5 shrink-0 bg-[#0E131B]">
              <h3 className="font-serif text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Nghiệm Thu & Đóng Phiếu #{resolvingTicket.id}</span>
              </h3>
              <button 
                type="button"
                onClick={() => {
                  setResolvingTicket(null);
                  setAllowOverrideVerification(false);
                }}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="overflow-y-auto px-5 py-3.5 space-y-3 flex-1 text-xs">
              {/* Ticket Info Compact */}
              <div className="p-2.5 bg-[#161B22] border border-[#222B35] space-y-1 text-xs leading-relaxed rounded-none">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <span>Căn hộ: <strong className="text-white">Căn {resolvingTicket.apt_code} ({resolvingTicket.resident_name})</strong></span>
                  <span className="text-gray-400 font-mono text-[11px]">KTV: <strong className="text-[#C5A880]">{resolvingTicket.assigned_technician}</strong></span>
                </div>
                <div className="text-gray-400 line-clamp-2">
                  <span className="text-gray-500">Nội dung:</span> {resolvingTicket.content}
                </div>
              </div>

              {/* Upload After Image */}
              <div className="space-y-1.5">
                <label className="text-xs text-gray-300 font-semibold flex items-center justify-between">
                  <span>Tải Ảnh Nghiệm Thu:</span>
                  <span className="text-[10px] text-gray-500 font-mono">* Gửi cư dân</span>
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
                    className="px-3 py-1.5 bg-[#161B22] border border-[#2D3748] hover:border-[#C5A880] text-gray-300 hover:text-white text-xs flex items-center gap-2 transition-colors rounded-none"
                  >
                    <Camera className="w-3.5 h-3.5 text-[#C5A880]" />
                    {isReadingAfterImage ? 'Đang nạp ảnh...' : afterImageBase64 ? 'Đổi Ảnh Nghiệm Thu' : 'Chụp / Chọn Ảnh Sửa Xong'}
                  </button>

                  {afterImageBase64 ? (
                    <div className="flex items-center gap-2">
                      <img 
                        src={afterImageBase64} 
                        alt="After Preview" 
                        className="w-8 h-8 object-cover border border-emerald-500"
                      />
                      <span className="text-xs text-emerald-400 font-medium">Đã nạp ảnh ✓</span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-amber-400 font-medium">* Cần ảnh chụp sau sửa</span>
                  )}
                </div>
              </div>

              {/* Resolution Notes with AI recognition badge */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-gray-300 font-semibold">Ghi Chú Kỹ Thuật Khi Bàn Giao:</label>
                  <span className="text-[10px] text-[#C5A880] font-mono flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#C5A880]" /> Đã tự động nhận diện
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="VD: Đã thay gioăng cao su van xả, kiểm tra áp lực nước 2.5 bar ổn định..."
                  className="w-full bg-[#161B22] border border-[#2D3748] text-xs text-white p-2.5 focus:outline-none focus:border-[#C5A880] rounded-none resize-none leading-relaxed"
                  required
                />
              </div>

              {/* AI Verification Loading */}
              {isVerifyingAfterImage && (
                <div className="p-2.5 bg-[#0E131B] border border-[#C5A880]/40 text-xs flex items-center gap-2.5 text-[#C5A880] rounded-none">
                  <RefreshCw className="w-4 h-4 text-[#C5A880] animate-spin shrink-0" />
                  <div>
                    <div className="font-semibold text-[#C5A880]">AI Đang Thẩm Định Ảnh Nghiệm Thu...</div>
                    <div className="text-[10px] text-gray-400">Đối chiếu hiện trường trước &amp; sau sửa</div>
                  </div>
                </div>
              )}

              {/* AI Verification Status Card (Unified Anti-Slop, No Nested Duplicate Boxes) */}
              {!isVerifyingAfterImage && aiVerificationResult && (
                <div className={`p-2.5 border text-xs space-y-1.5 rounded-none ${
                  aiVerificationResult.status === 'VERIFIED'
                    ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-200'
                    : aiVerificationResult.status === 'SUSPICIOUS'
                      ? 'bg-rose-950/30 border-rose-500/50 text-rose-200'
                      : 'bg-amber-950/30 border-amber-500/50 text-amber-200'
                }`}>
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5">
                      {aiVerificationResult.status === 'VERIFIED' ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="text-emerald-300">✓ AI Thẩm Định: Ảnh Đạt Chuẩn ({aiVerificationResult.confidence_score}%)</span>
                        </>
                      ) : aiVerificationResult.status === 'SUSPICIOUS' ? (
                        <>
                          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                          <span className="text-rose-300">⚠️ Cảnh Báo AI: Ảnh Không Khớp ({aiVerificationResult.confidence_score}%)</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                          <span className="text-amber-300">⏳ AI: Chưa Khắc Phục Triệt Để ({aiVerificationResult.confidence_score}%)</span>
                        </>
                      )}
                    </span>
                    {afterImageBase64 && (
                      <button
                        type="button"
                        onClick={() => handleVerifyResolutionImage(afterImageBase64, resolvingTicket, resolutionNotes)}
                        className="text-[10px] text-gray-400 hover:text-white underline"
                      >
                        Thẩm định lại
                      </button>
                    )}
                  </div>

                  <div className="text-[11px] font-medium leading-relaxed">
                    {aiVerificationResult.verification_title}
                  </div>
                  {aiVerificationResult.verification_detail && (
                    <div className="text-[10px] text-gray-300 leading-relaxed">
                      {aiVerificationResult.verification_detail}
                    </div>
                  )}
                  {aiVerificationResult.risk_warning && (
                    <div className="text-[10px] bg-rose-950/70 border border-rose-500/40 p-1.5 text-rose-200 font-medium rounded-none">
                      Rủi ro: {aiVerificationResult.risk_warning}
                    </div>
                  )}

                  {/* Manual Override Option inside AI Card */}
                  {(aiVerificationResult.status === 'SUSPICIOUS' || aiVerificationResult.status === 'INCOMPLETE') && (
                    <div className="pt-2 border-t border-rose-500/30 flex items-center justify-between gap-2">
                      <label className="flex items-center gap-2 cursor-pointer text-[11px] text-amber-300 hover:text-amber-200 select-none">
                        <input
                          type="checkbox"
                          checked={allowOverrideVerification}
                          onChange={(e) => setAllowOverrideVerification(e.target.checked)}
                          className="rounded-none bg-[#0E131B] border-gray-600 text-[#C5A880] focus:ring-0 w-3.5 h-3.5"
                        />
                        <span>Tôi đã kiểm tra thực tế, chịu trách nhiệm duyệt ngoại lệ</span>
                      </label>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer (Sticky Bottom, Never Cut Off) */}
            <div className="border-t border-[#222B35] px-5 py-3 bg-[#0E131B] shrink-0 flex items-center justify-between gap-2">
              <div>
                {aiVerificationResult && (aiVerificationResult.status === 'SUSPICIOUS' || aiVerificationResult.status === 'INCOMPLETE') && (
                  <button
                    type="button"
                    onClick={handleRejectResolution}
                    className="px-3 py-1.5 bg-rose-950 hover:bg-rose-900 border border-rose-500/60 text-rose-200 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 rounded-none transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-rose-400" />
                    <span>Từ Chối & Yêu Cầu Sửa Lại</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setResolvingTicket(null);
                    setAllowOverrideVerification(false);
                  }}
                  className="px-3.5 py-1.5 border border-gray-700 text-xs text-gray-300 hover:text-white rounded-none transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={Boolean(
                    isVerifyingAfterImage ||
                    !afterImageBase64 ||
                    (aiVerificationResult && (aiVerificationResult.status === 'SUSPICIOUS' || aiVerificationResult.status === 'INCOMPLETE') && !allowOverrideVerification)
                  )}
                  className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-none transition-colors shadow ${
                    (aiVerificationResult && (aiVerificationResult.status === 'SUSPICIOUS' || aiVerificationResult.status === 'INCOMPLETE') && !allowOverrideVerification) || isVerifyingAfterImage || !afterImageBase64
                      ? 'bg-emerald-950/40 border border-emerald-800/40 text-emerald-400/40 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  Xác Nhận Nghiệm Thu
                </button>
              </div>
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
                <span className="text-[10px] text-[#C5A880] font-mono uppercase font-bold tracking-wider">BAN QUẢN LÝ CHUNG CƯ</span>
                <h3 className="font-serif text-lg font-bold text-white">Phiếu Thù Lao Kỹ Thuật Viên</h3>
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
              <span>Xác nhận: <strong>Ban Quản Lý Chung Cư</strong></span>
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

              {/* AI Verification Report */}
              {inspectingTicket.ai_verification && (
                <div className={`p-3 border text-xs space-y-1.5 ${
                  inspectingTicket.ai_verification.status === 'VERIFIED'
                    ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200'
                    : inspectingTicket.ai_verification.status === 'SUSPICIOUS'
                      ? 'bg-rose-950/40 border-rose-500/60 text-rose-200'
                      : 'bg-amber-950/40 border-amber-500/60 text-amber-200'
                }`}>
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5">
                      {inspectingTicket.ai_verification.status === 'VERIFIED' ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="text-emerald-300">✓ AI Thẩm Định: Ảnh Đạt Chuẩn ({inspectingTicket.ai_verification.confidence_score}%)</span>
                        </>
                      ) : inspectingTicket.ai_verification.status === 'SUSPICIOUS' ? (
                        <>
                          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                          <span className="text-rose-300">⚠️ CẢNH BÁO AI: Ảnh Nghi Ngờ Không Khớp Hiện Trường ({inspectingTicket.ai_verification.confidence_score}%)</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                          <span className="text-amber-300">⏳ AI Nhận Định: Chưa Khắc Phục Triệt Để ({inspectingTicket.ai_verification.confidence_score}%)</span>
                        </>
                      )}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">BQL Audit System</span>
                  </div>
                  <div className="text-[11px] font-medium leading-relaxed">
                    {inspectingTicket.ai_verification.verification_title}
                  </div>
                  {inspectingTicket.ai_verification.verification_detail && (
                    <div className="text-[10px] text-gray-300 leading-relaxed">
                      {inspectingTicket.ai_verification.verification_detail}
                    </div>
                  )}
                  {inspectingTicket.ai_verification.risk_warning && (
                    <div className="text-[10px] bg-rose-950/80 border border-rose-500/50 p-2 text-rose-200 font-semibold">
                      Lưu ý rủi ro: {inspectingTicket.ai_verification.risk_warning}
                    </div>
                  )}
                </div>
              )}
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

      {/* ========================================================================= */}
      {/* MODAL 5: BAN QUẢN LÝ PHẢN HỒI Ý KIẾN / KHIẾU NẠI CƯ DÂN                  */}
      {/* ========================================================================= */}
      {feedbackReplyTicket && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121820] border border-[#C5A880] max-w-xl w-full p-6 text-white space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#222B35] pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-rose-400" />
                <h3 className="font-serif text-base font-bold text-white">
                  Phản Hồi Chính Thức Từ Ban Quản Lý
                </h3>
              </div>
              <button 
                onClick={() => setFeedbackReplyTicket(null)} 
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-[#161B22] border border-[#222B35] space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Mã yêu cầu:</span>
                <strong className="text-[#C5A880] font-mono">
                  {feedbackReplyTicket.nks_id ? `#${feedbackReplyTicket.nks_id}` : `#${feedbackReplyTicket.id}`}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Cư dân:</span>
                <span className="text-white font-semibold">{feedbackReplyTicket.resident_name} • Căn {feedbackReplyTicket.apt_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Hạng mục:</span>
                <span className="text-rose-300 font-bold">{feedbackReplyTicket.ai_category || 'Phản ánh dịch vụ'}</span>
              </div>
              <div className="pt-1 text-gray-300 border-t border-[#222B35]">
                <span className="text-gray-400 font-medium">Nội dung phản ánh:</span> "{feedbackReplyTicket.content}"
              </div>
            </div>

            {/* AI Assistant Suggested Draft */}
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs text-gray-300 font-semibold flex-shrink-0">Nội dung phản hồi cư dân:</label>
              <button
                type="button"
                onClick={handleGenerateAiAdminReply}
                disabled={isGeneratingAiReply}
                className="text-[11px] px-2.5 py-1 bg-[#141B24] border border-[#C5A880]/40 hover:border-[#C5A880] text-[#C5A880] hover:text-white flex items-center gap-1.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex-shrink-0 rounded-none"
                title="AI Gemini soạn thảo phản hồi thông minh, phù hợp ngữ cảnh từng yêu cầu cụ thể"
              >
                {isGeneratingAiReply ? (
                  <><RefreshCw className="w-3.5 h-3.5 text-[#C5A880] animate-spin" /><span>Đang soạn...</span></>
                ) : (
                  <><Sparkles className="w-3.5 h-3.5 text-[#C5A880]" /><span>AI Soạn Thảo Thông Minh</span></>
                )}
              </button>
            </div>

            <form onSubmit={handleConfirmAdminReply} className="space-y-4">
              <textarea
                rows={5}
                value={feedbackReplyContent}
                onChange={(e) => setFeedbackReplyContent(e.target.value)}
                placeholder="Nhập nội dung phản hồi, xin lỗi hoặc giải pháp xử lý từ BQL..."
                className="w-full bg-[#161B22] border border-[#2D3748] text-xs text-white p-3 focus:outline-none focus:border-[#C5A880] leading-relaxed rounded-none"
                required
              />

              {/* Kỹ thuật viên xử lý (engineername) */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs text-gray-300 font-semibold flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-amber-400" />
                  <span>KTV phụ trách</span>
                  <span className="text-[10px] text-gray-500 font-normal italic">(tuỳ chọn)</span>
                </label>
                <div className="flex gap-2 items-stretch">
                  {technicians.length > 0 && (
                    <select
                      value={replyEngineerName}
                      onChange={(e) => setReplyEngineerName(e.target.value)}
                      className="bg-[#161B22] border border-[#2D3748] text-xs text-gray-300 px-2 py-2 focus:outline-none focus:border-[#C5A880] min-w-0 w-[160px] flex-shrink-0 rounded-none"
                    >
                      <option value="">-- Chọn KTV --</option>
                      {technicians.map(k => (
                        <option key={k.id} value={k.name}>{k.name}</option>
                      ))}
                    </select>
                  )}
                  <input
                    type="text"
                    value={replyEngineerName}
                    onChange={(e) => setReplyEngineerName(e.target.value)}
                    placeholder="Hoặc nhập tên KTV thủ công..."
                    className="flex-1 min-w-0 bg-[#161B22] border border-[#2D3748] text-xs text-white px-3 py-2 focus:outline-none focus:border-[#C5A880] rounded-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5 text-xs text-gray-400 pt-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="flex-shrink-0">Đơn vị ký duyệt:</span>
                  <div className="px-2.5 py-1 bg-[#161B22] border border-[#2D3748] text-white font-medium flex items-center gap-1.5 select-none flex-shrink-0 rounded-none">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#C5A880]" />
                    <span className="whitespace-nowrap">Ban Quản Lý Chung Cư Skyline</span>
                    <span className="text-[10px] text-emerald-400 font-mono font-bold whitespace-nowrap">(Chính thức)</span>
                  </div>
                </div>
                <span className="text-[10px] text-gray-500 italic">* Chữ ký số tự động gắn kèm khi gửi văn bản</span>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#222B35]">
                <button
                  type="button"
                  onClick={() => setFeedbackReplyTicket(null)}
                  className="px-4 py-2 border border-gray-700 text-xs text-gray-300 hover:text-white rounded-none"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-950/80 hover:bg-rose-900 border border-rose-500/70 text-rose-200 text-xs font-bold uppercase tracking-wider transition-colors shadow-lg flex items-center gap-1.5 rounded-none"
                >
                  <Send className="w-3.5 h-3.5 text-rose-400" />
                  <span>Gửi Phản Hồi Cho Cư Dân</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
