import { NextResponse } from 'next/server';
import { 
  generateVisitorPassToken, 
  verifyVisitorQr 
} from '@/lib/visitorStore';

/**
 * GET /api/nks/visitor
 * Returns a health check and verification instructions.
 * (No persistent guest lists stored to preserve resident privacy).
 */
export async function GET(request: Request) {
  return NextResponse.json({
    success: true,
    message: 'Skyline Secure Visitor Access Gateway (Zero-Dossier Privacy Enabled)',
  });
}

/**
 * POST /api/nks/visitor
 * Generate ephemeral token or verify scanned QR code at barrier.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    // 1. Generate ephemeral QR token
    if (action === 'GENERATE' || action === 'CREATE') {
      const { apartmentCode, visitorName, purpose, validHours } = body;
      const pass = generateVisitorPassToken({
        apartmentCode: apartmentCode || '12A05',
        visitorName: visitorName || 'Khách Thăm Nhà',
        purpose: purpose || 'VISITOR',
        validHours: validHours || 2,
      });

      return NextResponse.json({
        success: true,
        message: 'Mã QR đón khách được tạo thành công và có hiệu lực ngay lập tức.',
        pass,
      });
    }

    // 2. Verify scanned QR code at gate barrier
    if (action === 'VERIFY' || action === 'VERIFY_SCAN') {
      const { qrCode } = body;
      const result = verifyVisitorQr(qrCode || '');
      return NextResponse.json({
        success: true,
        ...result,
      });
    }

    return NextResponse.json({ success: false, message: 'Hành động không hợp lệ' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
