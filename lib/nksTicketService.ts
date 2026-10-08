/**
 * Skyline Smart Residence - NKS SCRMAI Ticket API Service
 * 
 * Tích hợp 100% chuẩn tài liệu NKS SCRMAI API (Google Docs):
 * - Base URL: https://sdata.io.vn/wp-json/scrmai/v1
 * - Token: 01KWKATNQGB5TWXYDPJ671X3X1
 * - Endpoints:
 *   + POST /skyline/tickets: Lấy danh sách phản hồi / tickets (lọc theo phone, system=skyline)
 *   + POST /skyline/ticket: Lấy thông tin chi tiết 1 phản hồi theo id
 *   + POST /skyline/tickets/create: Cư dân tạo phản hồi / ticket mới lên hệ thống
 */

import type { ExtendedServiceRequest } from './ticketStore';
import { classifyTicket } from './ticketClassification';

export const NKS_TICKET_API_BASE_URL = 'https://sdata.io.vn/wp-json/scrmai/v1';
export const NKS_TICKET_API_TOKEN = '01KWKATNQGB5TWXYDPJ671X3X1';

export interface NksTicket {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  status: 'publish' | 'pending' | 'resolved' | string;
  created_at: string;
  updated_at: string;
  fullname: string;
  phone: string;
  email: string;
  service: string; // e.g. "Điện nước", "Kỹ thuật", "Hồ bơi", "Nhà hàng", "Vệ sinh", "An ninh"
  subject: string;
  description: string;
  image: string | false;
  system: string;
  reply?: string; // Phản hồi từ BQL / AI
  engineername?: string; // Tên kỹ thuật viên xử lý (nếu có)
}

export interface NksCreateTicketPayload {
  fullname: string;
  phone: string;
  email: string;
  service: string;
  subject: string;
  description: string;
  image?: string;
  system?: string;
}

export interface NksCreateTicketResponse {
  success: boolean;
  id?: number;
  message?: string;
}

export interface NksUpdateTicketPayload {
  id: number | string;
  reply?: string; // Phản hồi từ BQL hoặc AI
  engineername?: string; // Tên kỹ thuật viên xử lý (nếu có)
}

export interface NksUpdateTicketResponse {
  success: boolean;
  message?: string;
}

const STORAGE_KEY_NKS_TICKETS = 'nks_cached_tickets_v1';

/**
 * 1. Lấy danh sách Tickets từ NKS SCRMAI API
 * POST /skyline/tickets
 */
export async function fetchNksTickets(phone?: string): Promise<NksTicket[]> {
  const isBrowser = typeof window !== 'undefined';
  try {
    const url = isBrowser ? '/api/tickets?action=FETCH_NKS' + (phone ? `&phone=${encodeURIComponent(phone)}` : '') : `${NKS_TICKET_API_BASE_URL}/skyline/tickets`;
    
    if (isBrowser) {
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          try {
            localStorage.setItem(STORAGE_KEY_NKS_TICKETS, JSON.stringify(json.data));
          } catch {
            // Bộ nhớ đầy, không cần cache
          }
          return json.data;
        }
      }
    } else {
      const payload: Record<string, any> = { system: 'skyline' };
      if (phone && phone.trim()) {
        payload.phone = phone.trim();
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NKS_TICKET_API_TOKEN}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        cache: 'no-store',
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          return json.data;
        }
      }
    }
  } catch (err) {
    console.warn('Lỗi kết nối NKS Tickets API:', err);
  }

  // Fallback cache
  if (isBrowser) {
    const cached = localStorage.getItem(STORAGE_KEY_NKS_TICKETS);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch { /* ignore */ }
    }
  }

  return [];
}

/**
 * 2. Lấy thông tin chi tiết 1 Ticket theo ID từ NKS SCRMAI API
 * POST /skyline/ticket
 */
export async function fetchNksTicketDetail(id: number): Promise<NksTicket | null> {
  try {
    const res = await fetch(`${NKS_TICKET_API_BASE_URL}/skyline/ticket`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NKS_TICKET_API_TOKEN}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id }),
      cache: 'no-store',
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    }
  } catch (err) {
    console.warn(`Lỗi lấy chi tiết NKS Ticket #${id}:`, err);
  }
  return null;
}

/**
 * 3. Tạo mới phản hồi / ticket từ Cư Dân lên NKS SCRMAI API
 * POST /skyline/tickets/create
 */
export async function createNksTicket(payload: NksCreateTicketPayload): Promise<NksCreateTicketResponse> {
  try {
    const bodyObj = {
      fullname: payload.fullname.trim(),
      phone: payload.phone.trim(),
      email: payload.email?.trim() || 'resident@skyline.vn',
      service: payload.service?.trim() || 'Kỹ thuật',
      subject: payload.subject.trim(),
      description: payload.description.trim(),
      image: payload.image || '',
      system: 'skyline',
    };

    const res = await fetch(`${NKS_TICKET_API_BASE_URL}/skyline/tickets/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NKS_TICKET_API_TOKEN}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodyObj),
      cache: 'no-store',
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.id) {
        return { success: true, id: json.id };
      }
    }
    return { success: false, message: 'NKS API trả về phản hồi không thành công.' };
  } catch (err: any) {
    console.warn('Lỗi tạo NKS Ticket:', err);
    return { success: false, message: err?.message || 'Lỗi kết nối NKS API.' };
  }
}

/**
 * 4. Cập nhật phản hồi (reply) và kỹ thuật viên xử lý (engineername) lên NKS SCRMAI API
 * POST /skyline/ticket/update
 * Chấp nhận: id, reply (phản hồi từ BQL / AI), engineername (tên kỹ thuật viên xử lý - nếu có)
 */
export async function updateNksTicket(payload: NksUpdateTicketPayload): Promise<NksUpdateTicketResponse> {
  try {
    const numericId = typeof payload.id === 'string'
      ? Number(payload.id.replace('TICK-', ''))
      : payload.id;

    if (isNaN(numericId) || numericId <= 0) {
      return { success: false, message: 'Mã số ticket không hợp lệ.' };
    }

    const form = new URLSearchParams();
    form.append('id', String(numericId));

    if (payload.reply !== undefined && payload.reply !== null) {
      form.append('reply', String(payload.reply).trim());
    }
    if (payload.engineername !== undefined && payload.engineername !== null) {
      form.append('engineername', String(payload.engineername).trim());
    }

    const res = await fetch(`${NKS_TICKET_API_BASE_URL}/skyline/ticket/update`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NKS_TICKET_API_TOKEN}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
      cache: 'no-store',
    });

    if (res.ok) {
      const json = await res.json().catch(() => ({}));
      if (json.success === true) {
        return { success: true };
      }
    }
    return { success: false, message: 'NKS API cập nhật vé không thành công.' };
  } catch (err: any) {
    console.warn(`Lỗi cập nhật NKS Ticket #${payload.id}:`, err);
    return { success: false, message: err?.message || 'Lỗi kết nối NKS API.' };
  }
}

/**
 * 5. Xóa phiếu phản hồi / ticket trên hệ thống NKS SCRMAI API
 * POST /skyline/ticket/delete
 */
export async function deleteNksTicket(id: number): Promise<boolean> {
  try {
    const res = await fetch(`${NKS_TICKET_API_BASE_URL}/skyline/ticket/delete`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NKS_TICKET_API_TOKEN}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id }),
      cache: 'no-store',
    });
    if (res.ok) {
      const json = await res.json().catch(() => ({}));
      return json.success === true;
    }
  } catch (err) {
    console.warn(`Lỗi xóa NKS Ticket #${id}:`, err);
  }
  return false;
}

/**
 * 6. Chuyển đổi dữ liệu NKS Ticket sang chuẩn ExtendedServiceRequest của Skyline
 * Giữ nguyên trạng thái điều phối KTV, nghiệm thu và đánh giá nếu đã lưu cục bộ,
 * đồng thời đồng bộ hai trường mới nhất từ NKS: reply và engineername.
 */
export function nksTicketToServiceRequest(
  nks: NksTicket, 
  existingLocalTicket?: ExtendedServiceRequest
): ExtendedServiceRequest {
  // Trích xuất mã căn hộ hoặc vị trí phát sinh sự cố từ dữ liệu NKS API (tiêu đề, nội dung hoặc dịch vụ)
  let aptCode = '';
  const text = `${nks.subject || ''} ${nks.description || ''} ${nks.title || ''}`;
  if (existingLocalTicket?.apt_code) {
    aptCode = existingLocalTicket.apt_code;
  } else {
    const bracketMatch = text.match(/\[(?:Căn|Phòng|Apt)\s+([^\]]+)\]/i);
    const codeMatch = text.match(/\b([A-Za-z]?\d{1,2}[A-Za-z]\d{1,2}|[A-Za-z]-\d{2,4}|CH-\d{2,4})\b/i);
    
    if (bracketMatch && bracketMatch[1]) {
      aptCode = bracketMatch[1].trim().toUpperCase();
    } else if (codeMatch && codeMatch[1]) {
      aptCode = codeMatch[1].trim().toUpperCase();
    } else if (text.toLowerCase().includes('block 07') || text.toLowerCase().includes('block 7')) {
      aptCode = 'Block 07';
    } else if (nks.service?.toLowerCase().includes('hồ bơi') || text.toLowerCase().includes('hồ bơi')) {
      aptCode = 'Tiện ích Hồ Bơi';
    } else if (nks.service?.toLowerCase().includes('nhà hàng') || text.toLowerCase().includes('nhà hàng')) {
      aptCode = 'Khu Nhà Hàng';
    } else {
      aptCode = nks.service ? `Khu ${nks.service}` : 'Tòa Nhà';
    }
  }

  // Phân loại mục đích & trách nhiệm xử lý
  const classification = classifyTicket(
    nks.description || nks.subject || nks.title, 
    nks.service, 
    nks.subject
  );

  // Phân loại hạng mục sự cố kỹ thuật
  const s = (nks.service || '').toLowerCase();
  const textLower = text.toLowerCase();
  let cat: 'Điện' | 'Nước' | 'Vệ sinh' | 'An ninh' | 'Khác' = 'Khác';
  if (s.includes('nước') || textLower.includes('nước') || textLower.includes('vòi') || textLower.includes('bồn')) {
    cat = 'Nước';
  } else if (s.includes('điện') || textLower.includes('điện') || textLower.includes('đèn') || textLower.includes('chập')) {
    cat = 'Điện';
  } else if (s.includes('vệ sinh')) {
    cat = 'Vệ sinh';
  } else if (s.includes('an ninh')) {
    cat = 'An ninh';
  }

  const isUrgent = classification.urgent || cat === 'Điện' || cat === 'Nước';
  const img = typeof nks.image === 'string' && nks.image.trim() ? nks.image : '';

  // Đồng bộ hai trường mới từ API NKS: reply và engineername
  const remoteReply = typeof nks.reply === 'string' && nks.reply.trim() ? nks.reply.trim() : undefined;
  const remoteEngineer = typeof nks.engineername === 'string' && nks.engineername.trim() ? nks.engineername.trim() : undefined;

  // Trạng thái đồng bộ từ NKS API theo 3 luồng rõ ràng:
  // 1. Phản hồi tự động AI (INQUIRY): Resolved tức thì mà không cần qua BQL
  // 2. Sự cố kỹ thuật (REPAIR): In_Progress khi phân bổ KTV
  // 3. Phản ánh / Góp ý (FEEDBACK): Open chờ BQL xác nhận & phản hồi
  let status: 'Open' | 'In_Progress' | 'Resolved' | 'Assigned' | 'Cancelled' = 'Open';
  if (existingLocalTicket) {
    status = existingLocalTicket.status;
    if (remoteReply && remoteReply.trim() && status === 'Open') {
      status = 'Resolved';
    }
  } else if (nks.status === 'resolved' || nks.status === 'closed' || (remoteReply && remoteReply.trim())) {
    status = 'Resolved';
  } else if (remoteEngineer && remoteEngineer.trim()) {
    status = 'In_Progress';
  } else if (classification.type === 'INQUIRY' && classification.suggestedAiReply) {
    // Luồng 1: Hỏi đáp tra cứu tiện ích - AI tự động phản hồi không cần qua BQL
    status = 'Resolved';
  } else {
    // Luồng 3: FEEDBACK / Khiếu nại - Chờ BQL xác nhận
    status = 'Open';
  }

  const actualName = nks.fullname?.trim() || existingLocalTicket?.resident_name || 'Cư dân';
  const actualPhone = nks.phone?.trim() || existingLocalTicket?.resident_phone || '';

  const ticketType = existingLocalTicket?.ticket_type || classification.type;
  const handlerRole = existingLocalTicket?.handled_by || classification.handledBy;

  // Lấy câu trả lời AI cho câu hỏi
  const resolvedAiReply = existingLocalTicket?.ai_reply || (ticketType === 'INQUIRY' ? classification.suggestedAiReply : undefined);

  return {
    id: String(nks.id),
    nks_id: nks.id,
    apartment_id: `apt-${aptCode.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    apt_code: existingLocalTicket?.apt_code || aptCode,
    resident_name: actualName,
    resident_phone: actualPhone,
    content: nks.description || nks.subject || nks.title,
    ticket_type: ticketType,
    ticket_type_label: classification.typeLabel,
    handled_by: handlerRole,
    ai_category: cat,
    ai_priority: isUrgent ? 1 : 2,
    priority_color: isUrgent ? '#DC2626' : '#D97706',
    sla_deadline: new Date(Date.now() + (isUrgent ? 45 : 120) * 60000).toISOString(),
    sla_minutes_left: isUrgent ? 45 : 120,
    status: status,
    // AI tự động giải đáp nếu là câu hỏi
    ai_reply: resolvedAiReply,
    ai_replied_at: existingLocalTicket?.ai_replied_at || (ticketType === 'INQUIRY' ? (nks.created_at || new Date().toISOString()) : undefined),
    ai_suggested_reply: existingLocalTicket?.ai_suggested_reply || classification.suggestedAiReply,
    // Phản hồi chính thức từ BQL / Hệ thống NKS
    admin_reply: existingLocalTicket?.admin_reply || remoteReply,
    admin_replied_at: existingLocalTicket?.admin_replied_at || (remoteReply ? nks.updated_at || nks.created_at : undefined),
    admin_replied_by: existingLocalTicket?.admin_replied_by || (remoteReply ? 'Ban Quản Lý Skyline' : undefined),
    before_image: img || existingLocalTicket?.before_image || '',
    created_at: nks.created_at || existingLocalTicket?.created_at || new Date().toISOString(),
    updated_at: nks.updated_at || existingLocalTicket?.updated_at || new Date().toISOString(),
    // Giữ nguyên các trường phân công KTV & đánh giá cục bộ + đồng bộ engineername từ NKS
    after_image: existingLocalTicket?.after_image,
    assigned_technician_id: existingLocalTicket?.assigned_technician_id,
    assigned_technician: existingLocalTicket?.assigned_technician || remoteEngineer,
    assigned_technician_phone: existingLocalTicket?.assigned_technician_phone,
    scheduled_time: existingLocalTicket?.scheduled_time,
    resolution_notes: existingLocalTicket?.resolution_notes || remoteReply,
    rating: existingLocalTicket?.rating,
    resident_feedback: existingLocalTicket?.resident_feedback,
    rated_at: existingLocalTicket?.rated_at,
    resolved_at: existingLocalTicket?.resolved_at,
  };
}
