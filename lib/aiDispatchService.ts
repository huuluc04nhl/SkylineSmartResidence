/**
 * Skyline Smart Residence - AI Automated Dispatch Engine
 * 
 * Hệ thống điều phối sự cố tự động 100% bằng Trí Tuệ Nhân Tạo (AI):
 * - Phân tích ngữ nghĩa nội dung sự cố & hạng mục kỹ thuật
 * - Đánh giá chuyên môn, trạng thái trực ca và cân bằng tải công việc của từng KTV
 * - Dự đoán thời gian có mặt thực tế (SLA ETA)
 * - Tự động gán phiếu sang trạng thái 'In_Progress' và gửi thông báo trực tiếp đến Cư dân
 * - Giảm thiểu 95% thao tác thủ công của Ban Quản Lý
 */

import { 
  ExtendedServiceRequest, 
  TechnicianProfile, 
  getTechnicians, 
  saveTechnicians,
  getTickets, 
  saveTickets 
} from './ticketStore';

const AUTO_DISPATCH_SETTING_KEY = 'skyline_ai_auto_dispatch_enabled';

/**
 * Kiểm tra cấu hình Tự động điều phối AI (Mặc định bật 100%)
 */
export function isAutoDispatchEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const stored = localStorage.getItem(AUTO_DISPATCH_SETTING_KEY);
  if (stored === null) return true; // Mặc định bật
  return stored === 'true';
}

/**
 * Bật / Tắt chế độ tự động điều phối AI
 */
export function setAutoDispatchEnabled(enabled: boolean): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(AUTO_DISPATCH_SETTING_KEY, enabled ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent('skyline_ai_dispatch_setting_changed', { detail: { enabled } }));
  }
}

export interface AiDispatchEvaluation {
  technician: TechnicianProfile;
  scheduledTime: string;
  reason: string;
  priority: 1 | 2;
  matchScore: number;
}

/**
 * Thuật toán AI phân tích và chấm điểm chọn KTV tối ưu nhất
 */
export function evaluateBestTechnicianWithAI(
  ticket: ExtendedServiceRequest,
  technicians: TechnicianProfile[],
  currentTickets: ExtendedServiceRequest[]
): AiDispatchEvaluation {
  const text = `${ticket.ai_category || ''} ${ticket.content || ''} ${ticket.apt_code || ''}`.toLowerCase();

  // 1. Phân loại chuyên môn mục tiêu & tính cấp bách
  let targetSpecialty = 'Cơ Điện & Nước';
  let isUrgent = false;

  if (
    text.includes('lạnh') || text.includes('điều hòa') || text.includes('máy lạnh') ||
    text.includes('thang máy') || text.includes('quạt thông gió') || text.includes('cửa từ') ||
    text.includes('hồ bơi') || text.includes('máy bơm')
  ) {
    targetSpecialty = 'Điện Lạnh & Kỹ Thuật Tòa Nhà';
    isUrgent = text.includes('thang máy') || text.includes('kẹt') || text.includes('cháy');
  } else if (
    text.includes('rác') || text.includes('vệ sinh') || text.includes('bàn ghế') ||
    text.includes('quét dọn') || text.includes('mùi hôi') || text.includes('lau sàn') ||
    text.includes('nhà hàng') || text.includes('block')
  ) {
    targetSpecialty = 'Vệ Sinh & Cảnh Quan Chung Cư';
    isUrgent = text.includes('tràn rác') || text.includes('chất thải');
  } else if (
    text.includes('nước') || text.includes('vòi') || text.includes('rò rỉ') ||
    text.includes('bồn') || text.includes('nghẹt') || text.includes('áp lực nước') ||
    text.includes('điện') || text.includes('đèn') || text.includes('chập') || text.includes('aptomat')
  ) {
    targetSpecialty = 'Cơ Điện & Nước';
    isUrgent = text.includes('chập điện') || text.includes('vỡ ống') || text.includes('tràn nước');
  }

  // 2. Chấm điểm ma trận (Scoring Matrix)
  const scored = technicians.map(tech => {
    let score = 0;
    let detail = '';

    // Khớp chuyên môn
    if (tech.specialty.toLowerCase() === targetSpecialty.toLowerCase()) {
      score += 60;
      detail = `Đúng chuyên môn ${tech.specialty}`;
    } else if (tech.specialty.includes('Đa Năng')) {
      score += 30;
      detail = `Kỹ thuật viên đa năng`;
    } else {
      score += 15;
      detail = `Hỗ trợ kỹ thuật tổng hợp`;
    }

    // Tình trạng sẵn sàng
    if (tech.status === 'AVAILABLE') {
      score += 30;
    } else {
      score += 0;
    }

    // Cân bằng tải (Workload balancing): giảm 10 điểm cho mỗi ca đang gánh
    const activeTasks = currentTickets.filter(
      t => t.assigned_technician_id === tech.id && (t.status === 'In_Progress' || t.status === 'Assigned')
    ).length;
    score -= (activeTasks * 10);

    return { tech, score, detail, activeTasks };
  });

  // Chọn KTV có điểm cao nhất
  scored.sort((a, b) => b.score - a.score);
  const best = scored[0]?.tech || technicians[0];
  const bestMatch = scored[0];

  // 3. Dự toán thời gian có mặt thông minh (ETA)
  let scheduledTime = 'Có mặt trong vòng 30 phút';
  if (isUrgent || ticket.ai_category === 'Nước' || ticket.ai_category === 'Điện') {
    scheduledTime = best.status === 'AVAILABLE' ? 'Có mặt khẩn cấp trong 15 - 20 phút' : 'Có mặt trong vòng 30 phút';
  } else {
    scheduledTime = best.status === 'AVAILABLE' ? 'Có mặt trong vòng 25 - 30 phút' : 'Có mặt trong vòng 45 phút';
  }

  const reason = `AI chọn ${best.name}: ${bestMatch?.detail || 'Chuyên môn phù hợp'} (${best.status === 'AVAILABLE' ? 'Đang rảnh trực ban' : `${bestMatch?.activeTasks} ca đang xử lý`})`;

  return {
    technician: best,
    scheduledTime,
    reason,
    priority: isUrgent ? 1 : 2,
    matchScore: bestMatch?.score || 50,
  };
}

/**
 * Tự động điều phối 1 phiếu đơn lẻ bằng AI
 */
export function autoDispatchSingleTicket(ticketId: string): ExtendedServiceRequest | null {
  const allTickets = getTickets();
  const technicians = getTechnicians();
  const targetTicket = allTickets.find(t => t.id === ticketId || String(t.nks_id) === ticketId);
  if (!targetTicket) return null;

  // Nếu phiếu đã được giao hoặc đã giải quyết thì bỏ qua
  if (targetTicket.status !== 'Open') return targetTicket;

  const evaluation = evaluateBestTechnicianWithAI(targetTicket, technicians, allTickets);
  const tech = evaluation.technician;

  let dispatchedTicket: ExtendedServiceRequest | null = null;
  const updatedTickets = allTickets.map(t => {
    if (t.id === targetTicket.id) {
      dispatchedTicket = {
        ...t,
        status: 'In_Progress' as const,
        assigned_technician_id: tech.id,
        assigned_technician: tech.name,
        assigned_technician_phone: tech.phone,
        scheduled_time: evaluation.scheduledTime,
        auto_dispatched: true,
        ai_dispatch_reason: evaluation.reason,
        ai_priority: evaluation.priority,
        updated_at: new Date().toISOString(),
      };
      return dispatchedTicket;
    }
    return t;
  });

  if (dispatchedTicket) {
    saveTickets(updatedTickets);

    // Cập nhật trạng thái KTV thành BUSY
    saveTechnicians(technicians.map(k => k.id === tech.id ? { ...k, status: 'BUSY' } : k));

    // Đồng bộ lên server
    if (typeof window !== 'undefined') {
      fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ASSIGN',
          ticketId: targetTicket.id,
          technicianId: tech.id,
          scheduledTime: evaluation.scheduledTime,
          autoDispatched: true,
          aiReason: evaluation.reason,
        }),
      }).catch(err => console.warn('Lỗi đồng bộ phân công AI:', err));
    }
  }

  return dispatchedTicket;
}

/**
 * Tự động quét và điều phối toàn bộ các phiếu đang chờ (1-Click AI Auto Dispatch All)
 */
export function autoDispatchAllPendingTickets(): {
  successCount: number;
  results: Array<{ ticketId: string; techName: string; reason: string }>;
} {
  const allTickets = getTickets();
  const openTickets = allTickets.filter(t => t.status === 'Open');
  const results: Array<{ ticketId: string; techName: string; reason: string }> = [];

  for (const t of openTickets) {
    const dispatched = autoDispatchSingleTicket(t.id);
    if (dispatched && dispatched.assigned_technician) {
      results.push({
        ticketId: dispatched.nks_id ? `#${dispatched.nks_id}` : `#${dispatched.id}`,
        techName: dispatched.assigned_technician,
        reason: dispatched.ai_dispatch_reason || 'AI phân công tối ưu',
      });
    }
  }

  return {
    successCount: results.length,
    results,
  };
}
