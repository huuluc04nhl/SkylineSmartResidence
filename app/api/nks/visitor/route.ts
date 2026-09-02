import { NextResponse } from 'next/server';
import { 
  getVisitorPassesFromStorage, 
  INITIAL_VISITOR_PASSES,
  createVisitorPass, 
  approveVisitorPass, 
  rejectVisitorPass, 
  verifyVisitorQr,
  VisitorPass
} from '@/lib/visitorStore';

// In-memory fallback if server-side
let inMemoryPasses: VisitorPass[] = [...INITIAL_VISITOR_PASSES];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const aptCode = searchParams.get('aptCode');

  let passes = inMemoryPasses;
  if (aptCode) {
    passes = passes.filter(p => p.apartmentCode === aptCode);
  }

  return NextResponse.json({
    success: true,
    passes,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'CREATE') {
      const { apartmentCode, hostName, visitorName, visitorPhone, licensePlate, purpose, validHours } = body;
      const id = `PASS-${Date.now().toString().slice(-4)}`;
      const now = new Date();
      const validUntil = new Date(now.getTime() + (validHours || 2) * 3600 * 1000);
      const qrData = `SKYLINE_PASS_${apartmentCode}_${id}_${Date.now()}`;

      const purposeMap: Record<string, string> = {
        VISITOR: 'Khách Thăm Nhà',
        DELIVERY: 'Giao Hàng Shipper',
        TECH: 'Bảo Trì Riêng',
        OTHER: 'Khác',
      };

      const newPass: VisitorPass = {
        id,
        apartmentCode: apartmentCode || '12A05',
        hostName: hostName || 'Nguyễn Hữu Lực',
        visitorName,
        visitorPhone,
        licensePlate: licensePlate || '',
        purpose: purpose || 'VISITOR',
        purposeLabel: purposeMap[purpose] || 'Khách Thăm',
        validHours: validHours || 2,
        createdAt: now.toISOString(),
        validUntil: validUntil.toISOString(),
        qrData,
        status: 'PENDING_APPROVAL',
        statusMessage: 'Chờ Ban Quản Lý Xem Xét & Phê Duyệt',
      };

      inMemoryPasses = [newPass, ...inMemoryPasses];

      return NextResponse.json({
        success: true,
        message: 'Đã gửi yêu cầu đón khách tới Ban Quản Lý',
        pass: newPass,
        passes: inMemoryPasses,
      });
    }

    if (action === 'APPROVE') {
      const { id, approver } = body;
      const pass = inMemoryPasses.find(p => p.id === id);
      if (!pass) {
        return NextResponse.json({ success: false, message: 'Không tìm thấy mã khách' }, { status: 404 });
      }

      pass.status = 'APPROVED';
      pass.approvedAt = new Date().toISOString();
      pass.approvedBy = approver || 'Ban Quản Lý Skyline';
      pass.statusMessage = 'BQL Đã Phê Duyệt • Hợp Lệ';

      return NextResponse.json({
        success: true,
        message: 'Đã phê duyệt mã đón khách',
        pass,
        passes: inMemoryPasses,
      });
    }

    if (action === 'REJECT') {
      const { id, reason } = body;
      const pass = inMemoryPasses.find(p => p.id === id);
      if (!pass) {
        return NextResponse.json({ success: false, message: 'Không tìm thấy mã khách' }, { status: 404 });
      }

      pass.status = 'REJECTED';
      pass.rejectedReason = reason || 'Thông tin không hợp lệ';
      pass.statusMessage = 'BQL Từ Chối Cấp Quyền Ra Vào';

      return NextResponse.json({
        success: true,
        message: 'Đã từ chối mã đón khách',
        pass,
        passes: inMemoryPasses,
      });
    }

    if (action === 'VERIFY_SCAN') {
      const { qrCode } = body;
      const result = verifyVisitorQr(qrCode);
      return NextResponse.json({
        success: true,
        ...result,
      });
    }

    return NextResponse.json({ success: false, message: 'Action không hợp lệ' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
