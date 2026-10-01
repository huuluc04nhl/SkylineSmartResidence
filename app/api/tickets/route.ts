import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { 
  ExtendedServiceRequest, 
  INITIAL_TICKETS, 
  DEFAULT_TECHNICIANS, 
  TechnicianProfile 
} from '@/lib/ticketStore';
import { 
  fetchNksTickets, 
  createNksTicket, 
  deleteNksTicket,
  nksTicketToServiceRequest,
  NksTicket
} from '@/lib/nksTicketService';
import { evaluateBestTechnicianWithAI } from '@/lib/aiDispatchService';

const TICKETS_FILE = path.join(process.cwd(), '.skyline_tickets.json');

interface ServerStorageData {
  tickets: ExtendedServiceRequest[];
  technicians: TechnicianProfile[];
  updatedAt: string;
}

function readServerData(): ServerStorageData {
  try {
    if (fs.existsSync(TICKETS_FILE)) {
      const raw = fs.readFileSync(TICKETS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.tickets)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Lỗi đọc file .skyline_tickets.json:', e);
  }
  return {
    tickets: INITIAL_TICKETS,
    technicians: DEFAULT_TECHNICIANS,
    updatedAt: new Date().toISOString(),
  };
}

function writeServerData(data: ServerStorageData) {
  try {
    fs.writeFileSync(TICKETS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Lỗi ghi file .skyline_tickets.json:', e);
  }
}

/**
 * GET /api/tickets?aptCode=12A05&phone=0364967082
 * Tự động đồng bộ live với NKS SCRMAI API
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const aptCode = searchParams.get('aptCode');
    const phone = searchParams.get('phone');
    const action = searchParams.get('action');

    // Nếu yêu cầu trực tiếp danh sách thô từ NKS SCRMAI API
    if (action === 'FETCH_NKS') {
      const nksList = await fetchNksTickets(phone || undefined);
      return NextResponse.json({ success: true, data: nksList });
    }

    const data = readServerData();
    let nksTickets: NksTicket[] = [];

    try {
      // Gọi trực tiếp NKS SCRMAI API
      nksTickets = await fetchNksTickets(phone || undefined);
    } catch (apiErr) {
      console.warn('Không thể kết nối NKS API, sử dụng dữ liệu lưu cục bộ:', apiErr);
    }

    // Merge NKS tickets với local technician assignment & resolution notes
    const localMap = new Map<string, ExtendedServiceRequest>();
    data.tickets.forEach(t => {
      localMap.set(t.id, t);
      if (t.nks_id) {
        localMap.set(String(t.nks_id), t);
      }
    });

    const mergedList: ExtendedServiceRequest[] = [];
    const processedNksIds = new Set<number>();

    // 1. Chuyển đổi và merge toàn bộ tickets thực tế từ NKS
    if (Array.isArray(nksTickets) && nksTickets.length > 0) {
      for (const nks of nksTickets) {
        processedNksIds.add(nks.id);
        const existingLocal = localMap.get(String(nks.id));
        const unified = nksTicketToServiceRequest(nks, existingLocal);
        mergedList.push(unified);
      }
    }

    // 2. Giữ lại các phiếu cục bộ chưa kịp đồng bộ hoặc được tạo offline
    for (const localT of data.tickets) {
      if (localT.nks_id && processedNksIds.has(localT.nks_id)) {
        continue;
      }
      if (processedNksIds.has(Number(localT.id))) {
        continue;
      }
      mergedList.push(localT);
    }

    // Sắp xếp theo ngày tạo mới nhất lên đầu
    mergedList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Cập nhật lại kho lưu trữ server
    data.tickets = mergedList;
    data.updatedAt = new Date().toISOString();
    writeServerData(data);

    let filtered = mergedList;
    if (aptCode) {
      const clean = aptCode.trim().toUpperCase();
      filtered = filtered.filter(t => t.apt_code.trim().toUpperCase() === clean);
    }

    return NextResponse.json({
      success: true,
      tickets: filtered,
      technicians: data.technicians,
      nksConnected: Array.isArray(nksTickets) && nksTickets.length > 0,
      totalCount: mergedList.length,
    });
  } catch (error: any) {
    console.error('Lỗi GET /api/tickets:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Lỗi tải danh sách phiếu.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tickets
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action, tickets, ticket, technicianId, scheduledTime, afterImage, resolutionNotes, rating, feedback } = body;
    const data = readServerData();

    // 1. Đồng bộ toàn bộ mảng từ client
    if (action === 'SYNC_ALL' && Array.isArray(tickets)) {
      data.tickets = tickets;
      data.updatedAt = new Date().toISOString();
      writeServerData(data);
      return NextResponse.json({ success: true, count: tickets.length });
    }

    // 2. Cư Dân tạo phiếu mới -> Gửi trực tiếp lên NKS SCRMAI API
    if (action === 'CREATE' && (ticket || body.content)) {
      const t = ticket || body;
      
      // Gọi NKS SCRMAI API với thông tin tài khoản cư dân thực tế
      const residentFullName = (t.resident_name || body.resident_name || 'Cư dân Skyline').trim();
      const residentPhoneNumber = (t.resident_phone || body.resident_phone || '').trim();
      const residentEmail = (t.email || body.email || 'resident@skyline.vn').trim();
      const apt = (t.apt_code || body.apt_code || '12A05').trim();
      const category = t.ai_category || body.ai_category || 'Kỹ thuật';

      const nksResult = await createNksTicket({
        fullname: residentFullName,
        phone: residentPhoneNumber,
        email: residentEmail,
        service: category,
        subject: `[Căn ${apt}] ${category} - ${residentFullName}`,
        description: t.content || body.content || '',
        image: t.before_image || body.before_image || '',
        system: 'skyline',
      });

      const newId = nksResult.success && nksResult.id ? String(nksResult.id) : (t.id || `TICK-${Math.floor(100 + Math.random() * 900)}`);

      // Tự động phân công thông minh bằng AI ngay khi tiếp nhận
      let assignedTech = undefined;
      let scheduledTime = undefined;
      let aiReason = undefined;
      let ticketStatus: 'Open' | 'In_Progress' = 'Open';

      if (data.technicians && data.technicians.length > 0) {
        const evalResult = evaluateBestTechnicianWithAI(
          { ...t, id: newId },
          data.technicians,
          data.tickets
        );
        assignedTech = evalResult.technician;
        scheduledTime = evalResult.scheduledTime;
        aiReason = evalResult.reason;
        ticketStatus = 'In_Progress';
      }

      const newTicket: ExtendedServiceRequest = {
        ...t,
        id: newId,
        nks_id: nksResult.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: ticketStatus,
        assigned_technician_id: assignedTech?.id,
        assigned_technician: assignedTech?.name,
        assigned_technician_phone: assignedTech?.phone,
        scheduled_time: scheduledTime,
        auto_dispatched: true,
        ai_dispatch_reason: aiReason,
      };

      // Thêm vào danh sách local
      data.tickets = [newTicket, ...data.tickets.filter(item => item.id !== newId)];
      data.updatedAt = new Date().toISOString();
      writeServerData(data);

      return NextResponse.json({ 
        success: true, 
        ticket: newTicket,
        nksId: nksResult.id,
        nksSuccess: nksResult.success 
      });
    }

    // 3. Phân công Kỹ thuật viên (Thủ công hoặc AI)
    if (action === 'ASSIGN' && body.ticketId && technicianId) {
      const tech = data.technicians.find(t => t.id === technicianId);
      if (!tech) {
        return NextResponse.json({ success: false, message: 'Không tìm thấy kỹ thuật viên.' }, { status: 404 });
      }
      data.tickets = data.tickets.map(t => {
        if (t.id === body.ticketId || String(t.nks_id) === String(body.ticketId)) {
          return {
            ...t,
            status: 'In_Progress',
            assigned_technician_id: tech.id,
            assigned_technician: tech.name,
            assigned_technician_phone: tech.phone,
            scheduled_time: scheduledTime || 'Có mặt trong vòng 30 phút',
            auto_dispatched: Boolean(body.autoDispatched),
            ai_dispatch_reason: body.aiReason || t.ai_dispatch_reason,
            updated_at: new Date().toISOString(),
          };
        }
        return t;
      });
      data.updatedAt = new Date().toISOString();
      writeServerData(data);
      return NextResponse.json({ success: true, message: `Đã phân công ${tech.name} xử lý phiếu.` });
    }

    // 4. Nghiệm thu hoàn tất
    if (action === 'RESOLVE' && body.ticketId && afterImage) {
      data.tickets = data.tickets.map(t => {
        if (t.id === body.ticketId || String(t.nks_id) === String(body.ticketId)) {
          return {
            ...t,
            status: 'Resolved',
            after_image: afterImage,
            resolution_notes: resolutionNotes || 'Đã sửa chữa và bàn giao xong.',
            resolved_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        }
        return t;
      });
      data.updatedAt = new Date().toISOString();
      writeServerData(data);
      return NextResponse.json({ success: true, message: 'Đã nghiệm thu và đóng phiếu thành công.' });
    }

    // 5. Cư dân chấm điểm 5 sao
    if (action === 'RATE' && body.ticketId && typeof rating === 'number') {
      data.tickets = data.tickets.map(t => {
        if (t.id === body.ticketId) {
          return {
            ...t,
            rating: Math.max(1, Math.min(5, Math.round(rating))),
            resident_feedback: feedback || '',
            rated_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        }
        return t;
      });
      data.updatedAt = new Date().toISOString();
      writeServerData(data);
      return NextResponse.json({ success: true, message: 'Đã ghi nhận đánh giá của cư dân.' });
    }

    // 6. Xóa phiếu trên NKS API và cơ sở dữ liệu
    if (action === 'DELETE' && body.ticketId) {
      const ticketIdStr = String(body.ticketId);
      const numId = Number(ticketIdStr.replace('TICK-', ''));
      if (!isNaN(numId) && numId > 0) {
        await deleteNksTicket(numId);
      }
      data.tickets = data.tickets.filter(t => t.id !== ticketIdStr && String(t.nks_id) !== ticketIdStr);
      data.updatedAt = new Date().toISOString();
      writeServerData(data);
      return NextResponse.json({ success: true, message: 'Đã xóa phiếu thành công.' });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Lỗi xử lý phiếu.' },
      { status: 500 }
    );
  }
}
