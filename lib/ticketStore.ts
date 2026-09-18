/**
 * Skyline Smart Residence - Centralized Maintenance Ticket & Technician Payroll Store
 * 
 * Lưu trữ và quản trị 2 chiều phiếu báo hỏng cư dân và điều phối kỹ thuật BQL:
 * - Phân công kỹ thuật viên theo chuyên môn (Điện, Nước, Lạnh, Đa năng)
 * - Tự động tính toán công việc và bảng lương thù lao theo số ca sửa + thưởng 5 sao
 * - Lưu trữ dữ liệu bền vững (localStorage + file server .skyline_tickets.json)
 */

import { ServiceRequest, DEMO_TICKETS } from './dataStore';

export interface TechnicianProfile {
  id: string; // 'KTV-01', 'KTV-02', etc.
  name: string;
  phone: string;
  specialty: 'Điện' | 'Nước' | 'Điện Lạnh' | 'Đa Năng';
  baseSalary: number; // Lương cơ bản tháng (VNĐ)
  payPerTicket: number; // Định mức công theo ca hoàn tất (VNĐ)
  bonusPerFiveStar: number; // Thưởng khi cư dân chấm 5 sao (VNĐ)
  status: 'AVAILABLE' | 'BUSY' | 'OFF_DUTY';
  avatar?: string;
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

const TICKETS_STORAGE_KEY = 'skyline_service_tickets_v1';
const TECHNICIANS_STORAGE_KEY = 'skyline_technicians_v1';

export const DEFAULT_TECHNICIANS: TechnicianProfile[] = [
  {
    id: 'KTV-01',
    name: 'Lê Văn Kỹ Thuật',
    phone: '0909.888.777',
    specialty: 'Nước',
    baseSalary: 8500000,
    payPerTicket: 150000,
    bonusPerFiveStar: 50000,
    status: 'AVAILABLE',
  },
  {
    id: 'KTV-02',
    name: 'Trần Văn Điện',
    phone: '0912.334.455',
    specialty: 'Điện',
    baseSalary: 9000000,
    payPerTicket: 180000,
    bonusPerFiveStar: 50000,
    status: 'AVAILABLE',
  },
  {
    id: 'KTV-03',
    name: 'Nguyễn Văn Thợ',
    phone: '0988.776.655',
    specialty: 'Đa Năng',
    baseSalary: 8000000,
    payPerTicket: 150000,
    bonusPerFiveStar: 50000,
    status: 'AVAILABLE',
  },
  {
    id: 'KTV-04',
    name: 'Phạm Hữu Lạnh',
    phone: '0933.221.199',
    specialty: 'Điện Lạnh',
    baseSalary: 9500000,
    payPerTicket: 200000,
    bonusPerFiveStar: 60000,
    status: 'AVAILABLE',
  }
];

export const INITIAL_TICKETS: ExtendedServiceRequest[] = [
  {
    id: 'TICK-102',
    apartment_id: 'apt-12a05',
    apt_code: '12A05',
    resident_name: 'Nguyễn Hữu Lực',
    resident_phone: '0364967082',
    content: 'Vòi sen nhà tắm master bị rò rỉ nước liên tục khi khóa van chính.',
    ai_category: 'Nước',
    ai_priority: 1,
    priority_color: '#DC2626',
    sla_deadline: new Date(Date.now() + 45 * 60000).toISOString(),
    sla_minutes_left: 45,
    status: 'In_Progress',
    assigned_technician_id: 'KTV-01',
    assigned_technician: 'Lê Văn Kỹ Thuật',
    assigned_technician_phone: '0909.888.777',
    scheduled_time: 'Trong vòng 30 phút',
    before_image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop&q=80',
    created_at: new Date(Date.now() - 30 * 60000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'TICK-099',
    apartment_id: 'apt-12a05',
    apt_code: '12A05',
    resident_name: 'Nguyễn Hữu Lực',
    resident_phone: '0364967082',
    content: 'Aptomat nguồn điều hòa phòng khách thỉnh thoảng tự nhảy khi dùng nhiều thiết bị.',
    ai_category: 'Điện',
    ai_priority: 2,
    priority_color: '#D97706',
    sla_deadline: new Date(Date.now() + 180 * 60000).toISOString(),
    sla_minutes_left: 180,
    status: 'Assigned',
    assigned_technician_id: 'KTV-02',
    assigned_technician: 'Trần Văn Điện',
    assigned_technician_phone: '0912.334.455',
    scheduled_time: '14:30 chiều nay',
    before_image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80',
    created_at: new Date(Date.now() - 120 * 60000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'TICK-088',
    apartment_id: 'apt-12a05',
    apt_code: '12A05',
    resident_name: 'Nguyễn Hữu Lực',
    resident_phone: '0364967082',
    content: 'Thay ron đệm cách âm cửa kính ban công bị xẹp rách do gió lớn.',
    ai_category: 'Khác',
    ai_priority: 3,
    priority_color: '#16A34A',
    sla_deadline: new Date(Date.now() - 24 * 3600000).toISOString(),
    sla_minutes_left: 0,
    status: 'Resolved',
    assigned_technician_id: 'KTV-03',
    assigned_technician: 'Nguyễn Văn Thợ',
    assigned_technician_phone: '0988.776.655',
    before_image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80',
    after_image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&auto=format&fit=crop&q=80',
    resolution_notes: 'Đã thay mới toàn bộ nẹp ron cao su EPDM 3 lớp, chống ồn và cách âm hoàn hảo.',
    rating: 5,
    resident_feedback: 'Thợ làm việc rất nhanh và lịch sự, lau dọn sạch sẽ sau khi sửa!',
    created_at: new Date(Date.now() - 48 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 24 * 3600000).toISOString(),
    resolved_at: new Date(Date.now() - 24 * 3600000).toISOString(),
  }
];

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
  let allTickets: ExtendedServiceRequest[] = INITIAL_TICKETS;
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(TICKETS_STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(INITIAL_TICKETS));
        allTickets = INITIAL_TICKETS;
      } else {
        const parsed = JSON.parse(raw);
        allTickets = Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_TICKETS;
      }
    } catch {
      allTickets = INITIAL_TICKETS;
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
 * Cư Dân tạo phiếu báo sự cố mới
 */
export function createTicket(payload: {
  apartment_id?: string;
  apt_code: string;
  resident_name: string;
  resident_phone: string;
  content: string;
  ai_category?: 'Điện' | 'Nước' | 'Vệ sinh' | 'An ninh' | 'Khác';
  before_image: string; // Base64
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
    before_image: payload.before_image,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const updatedList = [newTicket, ...allTickets];
  saveTickets(updatedList);
  return newTicket;
}

/**
 * Ban Quản Lý phân công Kỹ thuật viên
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
 * Ban Quản Lý nghiệm thu và đóng phiếu sau khi KTV sửa xong
 */
export function resolveTicket(
  ticketId: string,
  afterImage: string, // Base64
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
        resolution_notes: resolutionNotes || 'Đã sửa chữa và kiểm tra vận hành hoàn tất.',
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
        resident_feedback: feedback?.trim() || 'Cư dân rất hài lòng với dịch vụ.',
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
 * Tính toán Bảng Lương Thù Lao tự động cho toàn bộ Kỹ thuật viên
 */
export function getTechnicianPayroll(): TechnicianPayrollSummary[] {
  const techs = getTechnicians();
  const allTickets = getTickets();

  return techs.map(tech => {
    // Lọc các phiếu mà KTV này đã giải quyết xong
    const techResolvedTickets = allTickets.filter(
      t => t.assigned_technician_id === tech.id && t.status === 'Resolved'
    );

    const completedCount = techResolvedTickets.length;
    const fiveStarCount = techResolvedTickets.filter(t => t.rating === 5).length;
    
    // Tính điểm đánh giá trung bình
    const ratedTickets = techResolvedTickets.filter(t => typeof t.rating === 'number' && t.rating > 0);
    const sumRating = ratedTickets.reduce((acc, t) => acc + (t.rating || 0), 0);
    const averageRating = ratedTickets.length > 0 ? Number((sumRating / ratedTickets.length).toFixed(1)) : 5.0;

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
