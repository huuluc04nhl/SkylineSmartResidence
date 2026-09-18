import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { 
  ExtendedServiceRequest, 
  INITIAL_TICKETS, 
  DEFAULT_TECHNICIANS, 
  TechnicianProfile 
} from '@/lib/ticketStore';

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
 * GET /api/tickets?aptCode=12A05
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const aptCode = searchParams.get('aptCode');
    const data = readServerData();

    let tickets = data.tickets;
    if (aptCode) {
      const clean = aptCode.trim().toUpperCase();
      tickets = tickets.filter(t => t.apt_code.trim().toUpperCase() === clean);
    }

    return NextResponse.json({
      success: true,
      tickets,
      technicians: data.technicians,
    });
  } catch (error: any) {
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

    // 2. Cư Dân tạo phiếu mới
    if (action === 'CREATE' && ticket) {
      data.tickets.unshift(ticket);
      data.updatedAt = new Date().toISOString();
      writeServerData(data);
      return NextResponse.json({ success: true, ticket });
    }

    // 3. Phân công Kỹ thuật viên
    if (action === 'ASSIGN' && body.ticketId && technicianId) {
      const tech = data.technicians.find(t => t.id === technicianId);
      if (!tech) {
        return NextResponse.json({ success: false, message: 'Không tìm thấy kỹ thuật viên.' }, { status: 404 });
      }
      data.tickets = data.tickets.map(t => {
        if (t.id === body.ticketId) {
          return {
            ...t,
            status: 'In_Progress',
            assigned_technician_id: tech.id,
            assigned_technician: tech.name,
            assigned_technician_phone: tech.phone,
            scheduled_time: scheduledTime || 'Có mặt trong vòng 30 phút',
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
        if (t.id === body.ticketId) {
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

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Lỗi xử lý phiếu.' },
      { status: 500 }
    );
  }
}
