import { NextResponse } from 'next/server';
import { buildVnpayPaymentUrl } from '@/lib/vnpay';
import { getBills } from '@/lib/billingStore';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { billId, bankCode, returnUrl } = body;

    if (!billId) {
      return NextResponse.json(
        { success: false, message: 'Thiếu mã hóa đơn billId.' },
        { status: 400 }
      );
    }

    const bills = getBills();
    const bill = bills.find(b => b.id === billId);
    
    // Nếu hóa đơn đã thanh toán
    if (bill && bill.status === 'Paid') {
      return NextResponse.json(
        { success: false, message: 'Hóa đơn này đã được thanh toán hoàn tất trước đó.' },
        { status: 400 }
      );
    }

    const amount = bill ? bill.total_amount : 1500000;
    const aptCode = bill ? bill.apt_code : 'CANHO';

    // Lấy IP client từ headers
    const forwarded = req.headers.get('x-forwarded-for');
    const ipAddr = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';

    // Lấy domain hiện tại (ưu tiên origin client, host header, hoặc Vercel production)
    const host = req.headers.get('host');
    const proto = req.headers.get('x-forwarded-proto') || 'https';
    const hostOrigin = host ? `${proto}://${host}` : null;

    const origin = req.headers.get('origin') 
      || hostOrigin
      || process.env.NEXT_PUBLIC_BASE_URL 
      || 'https://skyline-smart-residence.vercel.app';

    const computedReturnUrl = returnUrl || `${origin}/api/billing/vnpay-return`;

    const paymentUrl = buildVnpayPaymentUrl({
      billId,
      amount,
      orderInfo: `Thanh toan phi toa nha Skyline can ${aptCode} ky ${bill?.billing_month || 'T08/2026'}`,
      ipAddr,
      bankCode: bankCode || undefined,
      returnUrl: computedReturnUrl,
    });

    return NextResponse.json({
      success: true,
      paymentUrl,
      billId,
      amount,
    });
  } catch (error: any) {
    console.error('Lỗi khởi tạo thanh toán VNPAY:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Lỗi tạo liên kết thanh toán VNPAY.' },
      { status: 500 }
    );
  }
}
