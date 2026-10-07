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
  updateNksTicket,
  deleteNksTicket,
  nksTicketToServiceRequest,
  NksTicket
} from '@/lib/nksTicketService';
import { evaluateBestTechnicianWithAI } from '@/lib/aiDispatchService';
import { 
  classifyTicket, 
  findInquiryAnswer, 
  generateSuggestedAdminReply 
} from '@/lib/ticketClassification';

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

      // Phân loại mục đích của ticket (REPAIR | INQUIRY | FEEDBACK | SERVICE_REQUEST)
      const ticketCategory = t.ticket_type || t.ai_category || body.ai_category || 'Kỹ thuật';
      const classification = classifyTicket(
        t.content || body.content || '',
        ticketCategory,
        t.subject || t.title || body.subject || ''
      );

      // Nếu cư dân đã chỉ định rõ mục đích lúc tạo phiếu thì ưu tiên
      const finalCategoryType = t.ticket_type || classification.type;
      const finalCategoryLabel = t.ticket_type_label || classification.typeLabel;
      const finalHandledBy = classification.handledBy;

      const newId = nksResult.success && nksResult.id ? String(nksResult.id) : (t.id || `TICK-${Math.floor(100 + Math.random() * 900)}`);

      let suggestedTech = undefined;
      let scheduledTime = undefined;
      let aiReason = undefined;
      let matchScore = undefined;
      let aiSuggestedReplyText: string | undefined = undefined;

      // 1. Nếu là Hỏi Đáp (INQUIRY) -> AI soạn thảo bản thảo phản hồi gợi ý (chờ BQL xác nhận hoặc gửi)
      if (finalCategoryType === 'INQUIRY') {
        aiSuggestedReplyText = findInquiryAnswer(t.content || body.content || '');
      } 
      // 2. Nếu là Sự Cố Kỹ Thuật (REPAIR) -> AI phân tích và ĐỀ XUẤT KTV tối ưu (chờ BQL phê duyệt)
      else if (finalCategoryType === 'REPAIR') {
        if (data.technicians && data.technicians.length > 0) {
          const evalResult = evaluateBestTechnicianWithAI(
            { ...t, id: newId },
            data.technicians,
            data.tickets
          );
          suggestedTech = evalResult.technician;
          scheduledTime = evalResult.scheduledTime;
          aiReason = evalResult.reason;
          matchScore = evalResult.matchScore;
        }
      }

      // NGUYÊN TẮC MINH BẠCH: Mọi ticket mới tạo BẮT BUỘC khởi đầu ở trạng thái 'Open' (Chờ BQL tiếp nhận & xác nhận)
      // AI chỉ đóng vai trò Trợ lý phân tích & đề xuất, KHÔNG tự ý đóng phiếu hay gán chính thức khi chưa qua BQL.
      const newTicket: ExtendedServiceRequest = {
        ...t,
        id: newId,
        nks_id: nksResult.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'Open', // Chờ BQL tiếp nhận & xác nhận
        ticket_type: finalCategoryType,
        ticket_type_label: finalCategoryLabel,
        handled_by: finalHandledBy,
        ai_suggested_reply: aiSuggestedReplyText,
        // Các trường đề xuất của AI (Minh bạch trên Admin Kanban)
        suggested_technician: suggestedTech?.name,
        suggested_technician_id: suggestedTech?.id,
        suggested_technician_phone: suggestedTech?.phone,
        suggested_match_score: matchScore,
        ai_dispatch_reason: aiReason,
        scheduled_time: scheduledTime,
        // Chưa gán chính thức KTV cho đến khi BQL bấm Duyệt / Phân bổ
        assigned_technician: undefined,
        assigned_technician_id: undefined,
        assigned_technician_phone: undefined,
        auto_dispatched: false,
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
      let targetTicket: ExtendedServiceRequest | undefined;
      data.tickets = data.tickets.map(t => {
        if (t.id === body.ticketId || String(t.nks_id) === String(body.ticketId)) {
          targetTicket = {
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
          return targetTicket;
        }
        return t;
      });

      // Đồng bộ phân công KTV lên NKS API
      const nksIdNum = targetTicket?.nks_id || Number(String(body.ticketId).replace('TICK-', ''));
      if (!isNaN(nksIdNum) && nksIdNum > 0) {
        await updateNksTicket({
          id: nksIdNum,
          engineername: tech.name,
          reply: targetTicket?.admin_reply || targetTicket?.ai_reply,
        });
      }

      data.updatedAt = new Date().toISOString();
      writeServerData(data);
      return NextResponse.json({ success: true, message: `Đã phân công ${tech.name} xử lý phiếu.` });
    }

    // 4. Nghiệm thu hoàn tất
    if (action === 'RESOLVE' && body.ticketId && afterImage) {
      let targetTicket: ExtendedServiceRequest | undefined;
      const notes = resolutionNotes || 'Đã sửa chữa và bàn giao xong.';
      data.tickets = data.tickets.map(t => {
        if (t.id === body.ticketId || String(t.nks_id) === String(body.ticketId)) {
          targetTicket = {
            ...t,
            status: 'Resolved',
            after_image: afterImage,
            resolution_notes: notes,
            resolved_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          return targetTicket;
        }
        return t;
      });

      // Đồng bộ biên bản nghiệm thu & KTV lên NKS API
      const nksIdNum = targetTicket?.nks_id || Number(String(body.ticketId).replace('TICK-', ''));
      if (!isNaN(nksIdNum) && nksIdNum > 0) {
        await updateNksTicket({
          id: nksIdNum,
          reply: notes,
          engineername: targetTicket?.assigned_technician,
        });
      }

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

    // 6. Ban Quản Lý (BQL) phản hồi ý kiến / phản ánh / thắc mắc của cư dân
    if (action === 'ADMIN_REPLY' && body.ticketId && body.replyText) {
      const ticketIdStr = String(body.ticketId);
      const adminName = body.adminName || 'Ban Quản Lý Skyline';
      let found = false;
      let targetTicket: ExtendedServiceRequest | undefined;

      data.tickets = data.tickets.map(t => {
        if (t.id === ticketIdStr || String(t.nks_id) === ticketIdStr) {
          found = true;
          targetTicket = {
            ...t,
            admin_reply: String(body.replyText).trim(),
            admin_replied_at: new Date().toISOString(),
            admin_replied_by: adminName,
            assigned_technician: body.engineername || t.assigned_technician,
            status: 'Resolved',
            updated_at: new Date().toISOString(),
          };
          return targetTicket;
        }
        return t;
      });

      if (!found) {
        return NextResponse.json({ success: false, message: 'Không tìm thấy phiếu yêu cầu.' }, { status: 404 });
      }

      // Đồng bộ nội dung phản hồi BQL và tên KTV lên NKS API
      const nksIdNum = targetTicket?.nks_id || Number(ticketIdStr.replace('TICK-', ''));
      if (!isNaN(nksIdNum) && nksIdNum > 0) {
        await updateNksTicket({
          id: nksIdNum,
          reply: String(body.replyText).trim(),
          engineername: body.engineername || targetTicket?.assigned_technician,
        });
      }

      data.updatedAt = new Date().toISOString();
      writeServerData(data);
      return NextResponse.json({ success: true, message: 'Đã gửi phản hồi chính thức từ Ban Quản Lý tới cư dân.' });
    }

    // 7. AI tự động trả lời / cập nhật câu trả lời thông minh
    if (action === 'AI_ANSWER' && body.ticketId) {
      const ticketIdStr = String(body.ticketId);
      let targetTicket: ExtendedServiceRequest | undefined;
      data.tickets = data.tickets.map(t => {
        if (t.id === ticketIdStr || String(t.nks_id) === ticketIdStr) {
          const answer = body.customAnswer || findInquiryAnswer(t.content);
          targetTicket = {
            ...t,
            ai_reply: answer,
            ai_replied_at: new Date().toISOString(),
            status: 'Resolved',
            updated_at: new Date().toISOString(),
          };
          return targetTicket;
        }
        return t;
      });

      // Đồng bộ câu trả lời AI lên NKS API
      const nksIdNum = targetTicket?.nks_id || Number(ticketIdStr.replace('TICK-', ''));
      if (!isNaN(nksIdNum) && nksIdNum > 0) {
        await updateNksTicket({
          id: nksIdNum,
          reply: targetTicket?.ai_reply,
          engineername: targetTicket?.assigned_technician,
        });
      }

      data.updatedAt = new Date().toISOString();
      writeServerData(data);
      return NextResponse.json({ success: true, message: 'AI đã cập nhật câu trả lời giải đáp cho cư dân.' });
    }

    // 8. Cập nhật trực tiếp vé (id, reply, engineername) lên NKS SCRMAI API
    if ((action === 'UPDATE' || action === 'UPDATE_TICKET') && (body.id || body.ticketId)) {
      const rawId = body.id || body.ticketId;
      const ticketIdStr = String(rawId);
      const replyVal = body.reply !== undefined && body.reply !== null ? String(body.reply).trim() : undefined;
      const engineerVal = body.engineername !== undefined && body.engineername !== null ? String(body.engineername).trim() : undefined;

      let found = false;
      data.tickets = data.tickets.map(t => {
        if (t.id === ticketIdStr || String(t.nks_id) === ticketIdStr) {
          found = true;
          return {
            ...t,
            ...(replyVal ? {
              admin_reply: replyVal,
              admin_replied_at: new Date().toISOString(),
              resolution_notes: replyVal,
              status: 'Resolved',
            } : {}),
            ...(engineerVal ? {
              assigned_technician: engineerVal,
              status: t.status === 'Open' ? 'In_Progress' : t.status,
            } : {}),
            updated_at: new Date().toISOString(),
          };
        }
        return t;
      });

      const nksIdNum = Number(ticketIdStr.replace('TICK-', ''));
      if (!isNaN(nksIdNum) && nksIdNum > 0) {
        await updateNksTicket({
          id: nksIdNum,
          reply: replyVal,
          engineername: engineerVal,
        });
      }

      data.updatedAt = new Date().toISOString();
      writeServerData(data);
      return NextResponse.json({ 
        success: true, 
        message: 'Đã cập nhật vé lên hệ thống NKS SCRMAI thành công.' 
      });
    }

    // 9. Xóa phiếu trên NKS API và cơ sở dữ liệu
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
