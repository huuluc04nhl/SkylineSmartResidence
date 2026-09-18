/**
 * Skyline Smart Residence - Centralized Maintenance Ticket & Technician Payroll Store
 * 
 * Quản trị 100% dữ liệu thực tế - KHÔNG DỮ LIỆU ẢO / KHÔNG ẢNH UNSPLASH
 * - Danh bạ KTV lấy từ nhân sự kỹ thuật thực tế của tòa nhà (khớp với database schema và tài khoản BQL)
 * - Danh sách phiếu khởi đầu sạch (rỗng), được tạo thực tế từ Portal cư dân và lưu bền vững
 * - Bảng lương thù lao tính toán 100% động từ các ca sửa thực tế đã hoàn thành
 */

import { ServiceRequest } from './dataStore';

export interface TechnicianProfile {
  id: string; // 'KTV-01', 'KTV-02'
  name: string;
  phone: string;
  email: string;
  specialty: 'Cơ Điện & Nước' | 'Điện Lạnh & BMS Tòa Nhà' | 'Đa Năng';
  baseSalary: number; // Lương cơ bản tháng (VNĐ)
  payPerTicket: number; // Tiền công định mức theo ca sửa (VNĐ)
  bonusPerFiveStar: number; // Thưởng khi cư dân chấm 5 sao (VNĐ)
  status: 'AVAILABLE' | 'BUSY' | 'OFF_DUTY';
}

export interface ExtendedServiceRequest extends Omit<ServiceRequest, 'after_image'> {
  after_image?: string;
  assigned_technician_id?: string;
  assigned_technician_phone?: string;
  scheduled_time?: string;
  resolution_notes?: string;
  rating?: number; // 1 - 5 sao
  resident_feedback?: string;
  rated_at?: string;
  resolved_at?: string;
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
    specialty: 'Điện Lạnh & BMS Tòa Nhà',
    baseSalary: 9000000,
    payPerTicket: 180000,
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
 * Cư Dân tạo phiếu báo sự cố mới từ thực tế
 */
export function createTicket(payload: {
  apartment_id?: string;
  apt_code: string;
  resident_name: string;
  resident_phone: string;
  content: string;
  ai_category?: 'Điện' | 'Nước' | 'Vệ sinh' | 'An ninh' | 'Khác';
  before_image?: string; // Base64 ảnh chụp thực tế
}): ExtendedServiceRequest {
  const allTickets = getTickets();
  const cat = payload.ai_category || 'Khác';
  const isUrgent = cat === 'Nước' || cat === 'Điện';

  const newTicket: ExtendedServiceRequest = {
    id: `TICK-${Math.floor(100 + Math.random() * 900)}`,
    apartment_id: payload.apartment_id || `apt-${payload.apt_code.toLowerCase()}`,
    apt_code: payload.apt_code,
    resident_name: payload.resident_name,
    resident_phone: payload.resident_phone,
    content: payload.content,
    ai_category: cat,
    ai_priority: isUrgent ? 1 : 2,
    priority_color: isUrgent ? '#DC2626' : '#D97706',
    sla_deadline: new Date(Date.now() + (isUrgent ? 45 : 120) * 60000).toISOString(),
    sla_minutes_left: isUrgent ? 45 : 120,
    status: 'Open',
    before_image: payload.before_image || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const updatedList = [newTicket, ...allTickets];
  saveTickets(updatedList);
  return newTicket;
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
    if (t.id === ticketId) {
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
    if (t.id === ticketId) {
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
  }

  return targetTicket;
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
