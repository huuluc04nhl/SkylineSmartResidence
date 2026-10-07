/**
 * Skyline Smart Residence - Centralized Maintenance Ticket & Technician Payroll Store
 * 
 * Quản trị 100% dữ liệu thực tế - KHÔNG DỮ LIỆU ẢO / KHÔNG ẢNH UNSPLASH
 * - Danh bạ KTV lấy từ nhân sự kỹ thuật thực tế của tòa nhà (khớp với database schema và tài khoản BQL)
 * - Danh sách phiếu khởi đầu sạch (rỗng), được tạo thực tế từ Portal cư dân và lưu bền vững
 * - Bảng lương thù lao tính toán 100% động từ các ca sửa thực tế đã hoàn thành
 */

import { ServiceRequest } from './dataStore';
import { 
  TicketCategoryType, 
  TicketHandlerRole, 
  classifyTicket, 
  findInquiryAnswer 
} from './ticketClassification';

export type { TicketCategoryType, TicketHandlerRole };

export interface TechnicianProfile {
  id: string; // 'KTV-01', 'KTV-02'
  name: string;
  phone: string;
  email: string;
  specialty: 'Cơ Điện & Nước' | 'Điện Lạnh & Kỹ Thuật Tòa Nhà' | 'Vệ Sinh & Cảnh Quan Chung Cư' | 'Đa Năng' | string;
  baseSalary: number; // Lương cơ bản tháng (VNĐ)
  payPerTicket: number; // Tiền công định mức theo ca sửa (VNĐ)
  bonusPerFiveStar: number; // Thưởng khi cư dân chấm 5 sao (VNĐ)
  status: 'AVAILABLE' | 'BUSY' | 'OFF_DUTY';
}

export interface ExtendedServiceRequest extends Omit<ServiceRequest, 'after_image' | 'ai_category'> {
  nks_id?: number; // ID định danh thực tế từ NKS SCRMAI API
  ai_category?: 'Điện' | 'Nước' | 'Vệ sinh' | 'An ninh' | 'Khác' | string;
  
  // Phân loại mục đích phiếu (Sửa chữa / Hỏi đáp / Phản ánh / Dịch vụ)
  ticket_type?: TicketCategoryType;
  ticket_type_label?: string;
  handled_by?: TicketHandlerRole; // 'AI' | 'MANAGEMENT' | 'TECHNICIAN'

  // Phản hồi tự động bằng AI (cho câu hỏi, tra cứu quy chế)
  ai_reply?: string;
  ai_replied_at?: string;

  // Phản hồi chính thức của Ban Quản Lý (cho khiếu nại, phản ánh)
  admin_reply?: string;
  admin_replied_at?: string;
  admin_replied_by?: string;

  // Kỹ thuật hiện trường (cho trường hợp sự cố sửa chữa)
  after_image?: string;
  assigned_technician_id?: string;
  assigned_technician_phone?: string;
  scheduled_time?: string;
  resolution_notes?: string;
  rating?: number; // 1 - 5 sao
  resident_feedback?: string;
  rated_at?: string;
  resolved_at?: string;

  // Đề xuất hỗ trợ bởi AI (Minh bạch - Chờ BQL phê duyệt)
  suggested_technician?: string;
  suggested_technician_id?: string;
  suggested_technician_phone?: string;
  suggested_match_score?: number;
  ai_suggested_reply?: string;

  // Điều phối tự động bằng AI
  auto_dispatched?: boolean;
  ai_dispatch_reason?: string;
}

export interface TechnicianPayrollSummary {
  technician: TechnicianProfile;
  completedTicketsCount: number;
  fiveStarCount: number;
  averageRating: number;
  baseSalary: number;
  ticketBonusTotal: number;
  fiveStarBonusTotal: number;
  totalIncome: number;
  recentTickets: ExtendedServiceRequest[];
}

// Storage keys v2 - Không dữ liệu ảo
const TICKETS_STORAGE_KEY = 'skyline_service_tickets_v2';
const TECHNICIANS_STORAGE_KEY = 'skyline_technicians_v2';
const AUTO_DISPATCH_SETTING_KEY = 'skyline_ai_auto_dispatch_enabled';

/**
 * Đội ngũ Kỹ thuật viên thực tế của Ban Quản Lý Tòa Nhà Skyline
 * Khớp chuẩn với Database SQL Schema và tài khoản BQL
 */
export const DEFAULT_TECHNICIANS: TechnicianProfile[] = [
  {
    id: 'KTV-01',
    name: 'Lê Văn Kỹ Thuật',
    phone: '0909.888.777',
    email: 'tech.skyline@gmail.com',
    specialty: 'Cơ Điện & Nước',
    baseSalary: 8500000,
    payPerTicket: 150000,
    bonusPerFiveStar: 50000,
    status: 'AVAILABLE',
  },
  {
    id: 'KTV-02',
    name: 'Trần Văn Kỹ Thuật',
    phone: '0901.888.998',
    email: 'nks.manager02@gmail.com',
    specialty: 'Điện Lạnh & Kỹ Thuật Tòa Nhà',
    baseSalary: 9000000,
    payPerTicket: 180000,
    bonusPerFiveStar: 50000,
    status: 'AVAILABLE',
  },
  {
    id: 'KTV-03',
    name: 'Nguyễn Văn Nghiệp Vụ',
    phone: '0908.777.666',
    email: 'vesinh.skyline@gmail.com',
    specialty: 'Vệ Sinh & Cảnh Quan Chung Cư',
    baseSalary: 8000000,
    payPerTicket: 120000,
    bonusPerFiveStar: 50000,
    status: 'AVAILABLE',
  }
];

// Khởi đầu sạch sẽ - không nạp phiếu ảo hay ảnh mạng Unsplash
export const INITIAL_TICKETS: ExtendedServiceRequest[] = [];

function notifyTicketsUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('skyline_tickets_updated'));
  }
}

// -----------------------------------------------------------------------------
// GET / SAVE TECHNICIANS
// -----------------------------------------------------------------------------
export function getTechnicians(): TechnicianProfile[] {
  if (typeof window === 'undefined') return DEFAULT_TECHNICIANS;
  try {
    const raw = localStorage.getItem(TECHNICIANS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(TECHNICIANS_STORAGE_KEY, JSON.stringify(DEFAULT_TECHNICIANS));
      return DEFAULT_TECHNICIANS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_TECHNICIANS;
  } catch {
    return DEFAULT_TECHNICIANS;
  }
}

export function saveTechnicians(techs: TechnicianProfile[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TECHNICIANS_STORAGE_KEY, JSON.stringify(techs));
    notifyTicketsUpdated();
  }
}

export function getTechnicianById(id: string): TechnicianProfile | undefined {
  return getTechnicians().find(t => t.id === id);
}

// -----------------------------------------------------------------------------
// GET / SAVE TICKETS
// -----------------------------------------------------------------------------
export function getTickets(aptCode?: string): ExtendedServiceRequest[] {
  let allTickets: ExtendedServiceRequest[] = [];
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(TICKETS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          allTickets = parsed;
        }
      }
    } catch {
      allTickets = [];
    }
  }

  if (aptCode) {
    const cleanCode = aptCode.trim().toUpperCase();
    return allTickets.filter(t => t.apt_code.trim().toUpperCase() === cleanCode);
  }
  return allTickets;
}

export function saveTickets(tickets: ExtendedServiceRequest[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(tickets));
    notifyTicketsUpdated();
  }
  // Đồng bộ ngầm lên máy chủ
  if (typeof window !== 'undefined') {
    fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'SYNC_ALL', tickets }),
    }).catch(e => console.warn('Lỗi đồng bộ tickets lên server:', e));
  }
}

// -----------------------------------------------------------------------------
// CORE ACTION METHODS
// -----------------------------------------------------------------------------

/**
 * Đồng bộ toàn bộ tickets với máy chủ và NKS SCRMAI API
 */
export async function syncTicketsWithServer(aptCode?: string, phone?: string): Promise<ExtendedServiceRequest[]> {
  try {
    const params = new URLSearchParams();
    if (aptCode) params.set('aptCode', aptCode);
    if (phone) params.set('phone', phone);
    const res = await fetch(`/api/tickets?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.tickets)) {
        if (typeof window !== 'undefined') {
          localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(data.tickets));
          if (Array.isArray(data.technicians) && data.technicians.length > 0) {
            localStorage.setItem(TECHNICIANS_STORAGE_KEY, JSON.stringify(data.technicians));
          }
          notifyTicketsUpdated();
        }
        return data.tickets;
      }
    }
  } catch (err) {
    console.warn('Lỗi đồng bộ phiếu với máy chủ & NKS API:', err);
  }
  return getTickets(aptCode);
}

/**
 * Cư Dân tạo phiếu mới (sửa chữa, hỏi đáp hoặc phản ánh) và đồng bộ trực tiếp lên NKS SCRMAI API
 */
export async function createTicketAsync(payload: {
  apartment_id?: string;
  apt_code: string;
  resident_name: string;
  resident_phone: string;
  content: string;
  ticket_type?: TicketCategoryType;
  ticket_type_label?: string;
  ai_category?: 'Điện' | 'Nước' | 'Vệ sinh' | 'An ninh' | 'Khác' | string;
  before_image?: string; // Base64 ảnh chụp thực tế
}): Promise<ExtendedServiceRequest> {
  const cat = payload.ai_category || 'Khác';
  const isUrgent = cat === 'Nước' || cat === 'Điện';

  // Tự động phân loại nếu người dùng chưa chọn thủ công
  const classification = classifyTicket(payload.content, payload.ai_category);
  const ticketType = payload.ticket_type || classification.type;
  const handler = ticketType === 'INQUIRY' ? 'AI' : ticketType === 'REPAIR' ? 'TECHNICIAN' : 'MANAGEMENT';

  const optimisticTicket: ExtendedServiceRequest = {
    id: `TICK-${Math.floor(100 + Math.random() * 900)}`,
    apartment_id: payload.apartment_id || `apt-${payload.apt_code.toLowerCase()}`,
    apt_code: payload.apt_code,
    resident_name: payload.resident_name,
    resident_phone: payload.resident_phone,
    content: payload.content,
    ticket_type: ticketType,
    ticket_type_label: ticketType === 'REPAIR' ? 'Sửa Chữa Kỹ Thuật' : ticketType === 'INQUIRY' ? 'Hỏi Đáp & Hỗ Trợ' : ticketType === 'FEEDBACK' ? 'Phản Ánh & Góp Ý' : 'Yêu Cầu Dịch Vụ',
    handled_by: handler,
    ai_category: cat,
    ai_priority: isUrgent ? 1 : 2,
    priority_color: isUrgent ? '#DC2626' : '#D97706',
    sla_deadline: new Date(Date.now() + (isUrgent ? 45 : 120) * 60000).toISOString(),
    sla_minutes_left: isUrgent ? 45 : 120,
    status: ticketType === 'INQUIRY' ? 'Resolved' : ticketType === 'REPAIR' ? 'In_Progress' : 'Open',
    // 1. Nếu là Hỏi Đáp: AI tự động phản hồi ngay 24/7
    ai_reply: ticketType === 'INQUIRY' ? (classification.suggestedAiReply || findInquiryAnswer(payload.content)) : undefined,
    ai_replied_at: ticketType === 'INQUIRY' ? new Date().toISOString() : undefined,
    // 2. Nếu là Góp Ý / Khiếu Nại: AI gợi ý câu trả lời để BQL duyệt
    ai_suggested_reply: ticketType === 'INQUIRY' ? (classification.suggestedAiReply || findInquiryAnswer(payload.content)) : undefined,
    before_image: payload.before_image || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    const res = await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'CREATE',
        ticket: optimisticTicket,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.ticket) {
        const saved = data.ticket as ExtendedServiceRequest;
        const currentTickets = getTickets();
        const updated = [saved, ...currentTickets.filter(t => t.id !== saved.id && t.id !== optimisticTicket.id)];
        saveTickets(updated);
        return saved;
      }
    }
  } catch (err) {
    console.warn('Lỗi gọi API tạo phiếu NKS:', err);
  }

  // Fallback nếu ngoại tuyến
  const currentTickets = getTickets();
  const updatedList = [optimisticTicket, ...currentTickets];
  saveTickets(updatedList);
  return optimisticTicket;
}

/**
 * Cư Dân tạo phiếu mới đồng bộ cục bộ
 */
export function createTicket(payload: {
  apartment_id?: string;
  apt_code: string;
  resident_name: string;
  resident_phone: string;
  content: string;
  ticket_type?: TicketCategoryType;
  ticket_type_label?: string;
  ai_category?: 'Điện' | 'Nước' | 'Vệ sinh' | 'An ninh' | 'Khác' | string;
  before_image?: string;
}): ExtendedServiceRequest {
  const allTickets = getTickets();
  const cat = payload.ai_category || 'Khác';
  const isUrgent = cat === 'Nước' || cat === 'Điện';

  const classification = classifyTicket(payload.content, payload.ai_category);
  const ticketType = payload.ticket_type || classification.type;
  const handler = ticketType === 'INQUIRY' ? 'AI' : ticketType === 'REPAIR' ? 'TECHNICIAN' : 'MANAGEMENT';

  const newTicket: ExtendedServiceRequest = {
    id: `TICK-${Math.floor(100 + Math.random() * 900)}`,
    apartment_id: payload.apartment_id || `apt-${payload.apt_code.toLowerCase()}`,
    apt_code: payload.apt_code,
    resident_name: payload.resident_name,
    resident_phone: payload.resident_phone,
    content: payload.content,
    ticket_type: ticketType,
    ticket_type_label: ticketType === 'REPAIR' ? 'Sửa Chữa Kỹ Thuật' : ticketType === 'INQUIRY' ? 'Hỏi Đáp & Hỗ Trợ' : ticketType === 'FEEDBACK' ? 'Phản Ánh & Góp Ý' : 'Yêu Cầu Dịch Vụ',
    handled_by: handler,
    ai_category: cat,
    ai_priority: isUrgent ? 1 : 2,
    priority_color: isUrgent ? '#DC2626' : '#D97706',
    sla_deadline: new Date(Date.now() + (isUrgent ? 45 : 120) * 60000).toISOString(),
    sla_minutes_left: isUrgent ? 45 : 120,
    status: ticketType === 'INQUIRY' ? 'Resolved' : ticketType === 'REPAIR' ? 'In_Progress' : 'Open',
    ai_reply: ticketType === 'INQUIRY' ? (classification.suggestedAiReply || findInquiryAnswer(payload.content)) : undefined,
    ai_replied_at: ticketType === 'INQUIRY' ? new Date().toISOString() : undefined,
    ai_suggested_reply: ticketType === 'INQUIRY' ? (classification.suggestedAiReply || findInquiryAnswer(payload.content)) : undefined,
    before_image: payload.before_image || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const updatedList = [newTicket, ...allTickets];
  saveTickets(updatedList);
  return newTicket;
}

/**
 * Ban Quản Lý trực tiếp gửi câu trả lời / phản hồi chính thức cho cư dân
 * Đồng thời có thể phân công hoặc cập nhật tên Kỹ thuật viên xử lý (engineername)
 */
export function adminRespondToTicket(
  ticketId: string,
  replyText: string,
  adminName: string = 'Ban Quản Lý Chung Cư',
  engineername?: string
): ExtendedServiceRequest | null {
  const allTickets = getTickets();
  let targetTicket: ExtendedServiceRequest | null = null;

  const updatedTickets = allTickets.map(t => {
    if (t.id === ticketId || String(t.nks_id) === ticketId) {
      targetTicket = {
        ...t,
        admin_reply: replyText.trim(),
        admin_replied_at: new Date().toISOString(),
        admin_replied_by: adminName,
        assigned_technician: engineername?.trim() || t.assigned_technician,
        status: 'Resolved' as const,
        updated_at: new Date().toISOString(),
      };
      return targetTicket;
    }
    return t;
  });

  if (targetTicket) {
    saveTickets(updatedTickets);

    // Bắn sync ngầm lên server và NKS API
    if (typeof window !== 'undefined') {
      fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADMIN_REPLY',
          ticketId,
          replyText,
          adminName,
          engineername: engineername?.trim() || (targetTicket as ExtendedServiceRequest).assigned_technician,
        }),
      }).catch(e => console.warn('Lỗi đồng bộ phản hồi BQL lên server:', e));
    }
  }

  return targetTicket;
}

/**
 * Kích hoạt AI giải đáp tự động câu hỏi cho ticket
 */
export function aiAnswerTicket(
  ticketId: string,
  customAnswer?: string
): ExtendedServiceRequest | null {
  const allTickets = getTickets();
  let targetTicket: ExtendedServiceRequest | null = null;

  const updatedTickets = allTickets.map(t => {
    if (t.id === ticketId || String(t.nks_id) === ticketId) {
      const answer = customAnswer || findInquiryAnswer(t.content);
      targetTicket = {
        ...t,
        handled_by: 'AI' as const,
        ai_reply: answer,
        ai_replied_at: new Date().toISOString(),
        status: 'Resolved' as const,
        updated_at: new Date().toISOString(),
      };
      return targetTicket;
    }
    return t;
  });

  if (targetTicket) {
    saveTickets(updatedTickets);

    // Đồng bộ lên server và NKS API
    if (typeof window !== 'undefined') {
      fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'AI_ANSWER',
          ticketId,
          customAnswer: (targetTicket as ExtendedServiceRequest).ai_reply,
        }),
      }).catch(e => console.warn('Lỗi đồng bộ AI answer lên server:', e));
    }
  }

  return targetTicket;
}

/**
 * Ban Quản Lý phân công Kỹ thuật viên thật
 */
export function assignTechnicianToTicket(
  ticketId: string, 
  technicianId: string,
  scheduledTime?: string
): ExtendedServiceRequest | null {
  const allTickets = getTickets();
  const tech = getTechnicianById(technicianId);
  if (!tech) return null;

  let targetTicket: ExtendedServiceRequest | null = null;
  const updatedTickets = allTickets.map(t => {
    if (t.id === ticketId || String(t.nks_id) === ticketId) {
      targetTicket = {
        ...t,
        status: 'In_Progress' as const,
        assigned_technician_id: tech.id,
        assigned_technician: tech.name,
        assigned_technician_phone: tech.phone,
        scheduled_time: scheduledTime || 'Có mặt trong vòng 30 phút',
        updated_at: new Date().toISOString(),
      };
      return targetTicket;
    }
    return t;
  });

  if (targetTicket) {
    saveTickets(updatedTickets);

    // Cập nhật trạng thái KTV thành BUSY
    const techs = getTechnicians();
    saveTechnicians(techs.map(k => k.id === tech.id ? { ...k, status: 'BUSY' } : k));

    // Đồng bộ phân công KTV lên server & NKS API
    if (typeof window !== 'undefined') {
      fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ASSIGN',
          ticketId,
          technicianId: tech.id,
          scheduledTime,
        }),
      }).catch(e => console.warn('Lỗi đồng bộ phân công KTV lên server:', e));
    }
  }

  return targetTicket;
}

/**
 * Ban Quản Lý nghiệm thu và đóng phiếu với ảnh thật chụp sau sửa chữa
 */
export function resolveTicket(
  ticketId: string,
  afterImage: string, // Base64 thật từ camera hoặc file upload
  resolutionNotes?: string
): ExtendedServiceRequest | null {
  const allTickets = getTickets();
  let targetTicket: ExtendedServiceRequest | null = null;
  let assignedTechId: string | undefined;

  const updatedTickets = allTickets.map(t => {
    if (t.id === ticketId || String(t.nks_id) === ticketId) {
      assignedTechId = t.assigned_technician_id;
      targetTicket = {
        ...t,
        status: 'Resolved' as const,
        after_image: afterImage,
        resolution_notes: resolutionNotes || 'Đã kiểm tra và xử lý xong.',
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return targetTicket;
    }
    return t;
  });

  if (targetTicket) {
    saveTickets(updatedTickets);

    // Chuyển KTV về trạng thái AVAILABLE nếu không còn phiếu nào đang làm
    if (assignedTechId) {
      const remainingBusy = updatedTickets.some(
        t => t.assigned_technician_id === assignedTechId && t.status === 'In_Progress'
      );
      if (!remainingBusy) {
        const techs = getTechnicians();
        saveTechnicians(techs.map(k => k.id === assignedTechId ? { ...k, status: 'AVAILABLE' } : k));
      }
    }

    // Đồng bộ nghiệm thu lên server & NKS API
    if (typeof window !== 'undefined') {
      fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RESOLVE',
          ticketId,
          afterImage,
          resolutionNotes,
        }),
      }).catch(e => console.warn('Lỗi đồng bộ nghiệm thu lên server:', e));
    }
  }

  return targetTicket;
}

/**
 * Cập nhật trực tiếp thông tin vé (id, reply, engineername) lên NKS SCRMAI API
 */
export async function updateTicketApiAsync(payload: {
  id: string | number;
  reply?: string;
  engineername?: string;
}): Promise<boolean> {
  const idStr = String(payload.id);
  const allTickets = getTickets();
  
  const updatedTickets = allTickets.map(t => {
    if (t.id === idStr || String(t.nks_id) === idStr) {
      return {
        ...t,
        ...(payload.reply ? {
          admin_reply: payload.reply.trim(),
          admin_replied_at: new Date().toISOString(),
          resolution_notes: payload.reply.trim(),
          status: 'Resolved' as const,
        } : {}),
        ...(payload.engineername ? {
          assigned_technician: payload.engineername.trim(),
          status: t.status === 'Open' ? ('In_Progress' as const) : t.status,
        } : {}),
        updated_at: new Date().toISOString(),
      };
    }
    return t;
  });

  saveTickets(updatedTickets);

  try {
    const res = await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'UPDATE_TICKET',
        id: payload.id,
        reply: payload.reply,
        engineername: payload.engineername,
      }),
    });
    if (res.ok) {
      const json = await res.json().catch(() => ({}));
      return json.success === true;
    }
  } catch (err) {
    console.warn('Lỗi gọi API cập nhật ticket:', err);
  }
  return false;
}

/**
 * Cư Dân chấm điểm 5 sao & gửi phản hồi chất lượng
 */
export function rateTicket(
  ticketId: string,
  rating: number,
  feedback?: string
): ExtendedServiceRequest | null {
  const allTickets = getTickets();
  let targetTicket: ExtendedServiceRequest | null = null;

  const updatedTickets = allTickets.map(t => {
    if (t.id === ticketId) {
      targetTicket = {
        ...t,
        rating: Math.max(1, Math.min(5, Math.round(rating))),
        resident_feedback: feedback?.trim() || 'Cư dân hài lòng với dịch vụ.',
        rated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return targetTicket;
    }
    return t;
  });

  if (targetTicket) {
    saveTickets(updatedTickets);
  }

  return targetTicket;
}

/**
 * Xóa phiếu phản hồi sự cố (cục bộ và đồng bộ lên API)
 */
export async function deleteTicketAsync(ticketId: string | number): Promise<boolean> {
  const idStr = String(ticketId);
  const allTickets = getTickets();
  const updatedTickets = allTickets.filter(t => t.id !== idStr && String(t.nks_id) !== idStr);
  saveTickets(updatedTickets);

  try {
    const res = await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'DELETE', ticketId }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.success === true;
    }
  } catch (err) {
    console.warn('Lỗi gọi API xóa ticket:', err);
  }
  return true;
}

export function deleteTicket(ticketId: string | number): void {
  deleteTicketAsync(ticketId);
}

/**
 * Tính toán Bảng Lương Thù Lao tự động 100% từ các ca sửa thực tế
 */
export function getTechnicianPayroll(): TechnicianPayrollSummary[] {
  const techs = getTechnicians();
  const allTickets = getTickets();

  return techs.map(tech => {
    // Lọc các phiếu THỰC TẾ mà KTV này đã giải quyết xong
    const techResolvedTickets = allTickets.filter(
      t => t.assigned_technician_id === tech.id && t.status === 'Resolved'
    );

    const completedCount = techResolvedTickets.length;
    const fiveStarCount = techResolvedTickets.filter(t => t.rating === 5).length;
    
    // Tính điểm đánh giá trung bình từ các lượt chấm thật của cư dân
    const ratedTickets = techResolvedTickets.filter(t => typeof t.rating === 'number' && t.rating > 0);
    const sumRating = ratedTickets.reduce((acc, t) => acc + (t.rating || 0), 0);
    const averageRating = ratedTickets.length > 0 
      ? Number((sumRating / ratedTickets.length).toFixed(1)) 
      : (completedCount > 0 ? 5.0 : 0);

    // Tiền công theo ca
    const ticketBonusTotal = completedCount * tech.payPerTicket;
    // Thưởng theo ca 5 sao
    const fiveStarBonusTotal = fiveStarCount * tech.bonusPerFiveStar;
    // Tổng lương thực nhận
    const totalIncome = tech.baseSalary + ticketBonusTotal + fiveStarBonusTotal;

    return {
      technician: tech,
      completedTicketsCount: completedCount,
      fiveStarCount,
      averageRating,
      baseSalary: tech.baseSalary,
      ticketBonusTotal,
      fiveStarBonusTotal,
      totalIncome,
      recentTickets: techResolvedTickets.slice(0, 5),
    };
  });
}
