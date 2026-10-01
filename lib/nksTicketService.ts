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
          localStorage.setItem(STORAGE_KEY_NKS_TICKETS, JSON.stringify(json.data));
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
 * 4. Chuyển đổi dữ liệu NKS Ticket sang chuẩn ExtendedServiceRequest của Skyline
 * Giữ nguyên trạng thái điều phối KTV, nghiệm thu và đánh giá nếu đã lưu cục bộ
 */
export function nksTicketToServiceRequest(
  nks: NksTicket, 
  existingLocalTicket?: ExtendedServiceRequest
): ExtendedServiceRequest {
  // Trích xuất mã căn hộ hoặc vị trí phát sinh sự cố từ tiêu đề, nội dung hoặc dịch vụ
  let aptCode = '';
  const text = `${nks.subject || ''} ${nks.description || ''} ${nks.title || ''}`;
  const aptMatch = text.match(/\b([A-Za-z]?\d{1,2}[A-Za-z]\d{1,2}|A\d{3,4}|B\d{3,4}|CH-\d{2})\b/i);
  if (aptMatch) {
    aptCode = aptMatch[1].toUpperCase();
  } else if (text.toLowerCase().includes('block 07') || text.toLowerCase().includes('block 7')) {
    aptCode = 'Block 07';
  } else if (nks.service?.toLowerCase().includes('hồ bơi') || text.toLowerCase().includes('hồ bơi')) {
    aptCode = 'Tiện ích Hồ Bơi';
  } else if (nks.service?.toLowerCase().includes('nhà hàng') || text.toLowerCase().includes('nhà hàng')) {
    aptCode = 'Khu Nhà Hàng';
  } else if (existingLocalTicket?.apt_code) {
    aptCode = existingLocalTicket.apt_code;
  } else if (nks.phone === '0364967082' || nks.fullname?.toLowerCase().includes('lực')) {
    aptCode = '12A05';
  } else {
    aptCode = nks.service ? `Khu ${nks.service}` : 'Tòa Nhà';
  }

  // Phân loại hạng mục sự cố
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

  const isUrgent = cat === 'Điện' || cat === 'Nước';
  const img = typeof nks.image === 'string' && nks.image.trim() ? nks.image : '';

  // Trạng thái đồng bộ
  let status: 'Open' | 'In_Progress' | 'Resolved' | 'Assigned' | 'Cancelled' = 'Open';
  if (existingLocalTicket) {
    status = existingLocalTicket.status;
  } else if (nks.status === 'resolved' || nks.status === 'closed') {
    status = 'Resolved';
  } else if (nks.status === 'pending') {
    status = 'In_Progress';
  }

  const actualName = nks.fullname?.trim() || existingLocalTicket?.resident_name || 'Cư dân';
  const actualPhone = nks.phone?.trim() || existingLocalTicket?.resident_phone || '';

  return {
    id: String(nks.id),
    nks_id: nks.id,
    apartment_id: `apt-${aptCode.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    apt_code: existingLocalTicket?.apt_code || aptCode,
    resident_name: actualName,
    resident_phone: actualPhone,
    content: nks.description || nks.subject || nks.title,
    ai_category: cat,
    ai_priority: isUrgent ? 1 : 2,
    priority_color: isUrgent ? '#DC2626' : '#D97706',
    sla_deadline: new Date(Date.now() + (isUrgent ? 45 : 120) * 60000).toISOString(),
    sla_minutes_left: isUrgent ? 45 : 120,
    status: status,
    before_image: img || existingLocalTicket?.before_image || '',
    created_at: nks.created_at || existingLocalTicket?.created_at || new Date().toISOString(),
    updated_at: nks.updated_at || existingLocalTicket?.updated_at || new Date().toISOString(),
    // Giữ nguyên các trường phân công KTV & đánh giá cục bộ
    after_image: existingLocalTicket?.after_image,
    assigned_technician_id: existingLocalTicket?.assigned_technician_id,
    assigned_technician: existingLocalTicket?.assigned_technician,
    assigned_technician_phone: existingLocalTicket?.assigned_technician_phone,
    scheduled_time: existingLocalTicket?.scheduled_time,
    resolution_notes: existingLocalTicket?.resolution_notes,
    rating: existingLocalTicket?.rating,
    resident_feedback: existingLocalTicket?.resident_feedback,
    rated_at: existingLocalTicket?.rated_at,
    resolved_at: existingLocalTicket?.resolved_at,
  };
}
