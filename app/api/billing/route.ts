import { NextResponse } from 'next/server';
import { getBills, payBill, confirmPaidByAdmin, publishAllBills, generateVietQrUrl, SKYLINE_BANK_INFO } from '@/lib/billingStore';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const aptCode = searchParams.get('aptCode') || undefined;
    const bills = getBills(aptCode);

    return NextResponse.json({
      success: true,
      bills,
      bankInfo: SKYLINE_BANK_INFO,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Lỗi tải danh sách hóa đơn.' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action, billId, method, transactionCode, notes } = body;

    if (action === 'PAY' && billId) {
      const updated = payBill(billId, method, transactionCode);
      return NextResponse.json({ success: !!updated, bill: updated });
    }

    if (action === 'CONFIRM_PAID' && billId) {
      const updated = confirmPaidByAdmin(billId, notes);
      return NextResponse.json({ success: !!updated, bill: updated });
    }

    if (action === 'PUBLISH_ALL') {
      publishAllBills();
      return NextResponse.json({ success: true, message: 'Đã phát hành toàn bộ hóa đơn.' });
    }

    return NextResponse.json({ success: false, message: 'Hành động không hợp lệ.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Lỗi xử lý hóa đơn.' },
      { status: 500 }
    );
  }
}
