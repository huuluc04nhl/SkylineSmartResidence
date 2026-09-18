import { NextResponse } from 'next/server';
import { verifyVnpayChecksum } from '@/lib/vnpay';
import { getBills, payBill } from '@/lib/billingStore';

export const dynamic = 'force-dynamic';

/**
 * Xử lý IPN (Instant Payment Notification - Server-to-Server) theo chuẩn VNPAY
 */
async function handleIpn(queryParams: Record<string, string>) {
  try {
    const { isValid } = verifyVnpayChecksum(queryParams);

    // 1. Kiểm tra chữ ký bảo mật
    if (!isValid) {
      return NextResponse.json({ RspCode: '97', Message: 'Invalid Checksum' }, { status: 200 });
    }

    const vnp_TxnRef = queryParams['vnp_TxnRef'] || '';
    const vnp_Amount = queryParams['vnp_Amount'] ? (parseInt(queryParams['vnp_Amount'], 10) / 100) : 0;
    const vnp_ResponseCode = queryParams['vnp_ResponseCode'];
    const vnp_TransactionStatus = queryParams['vnp_TransactionStatus'];
    const vnp_TransactionNo = queryParams['vnp_TransactionNo'] || `VNP${Date.now().toString().slice(-8)}`;
    const vnp_BankCode = queryParams['vnp_BankCode'] || 'VNPAY';

    const billId = vnp_TxnRef.includes('_') ? vnp_TxnRef.split('_')[0] : vnp_TxnRef;

    const bills = getBills();
    const bill = bills.find(b => b.id === billId);

    // 2. Kiểm tra đơn hàng có tồn tại không
    if (!bill) {
      return NextResponse.json({ RspCode: '01', Message: 'Order not found' }, { status: 200 });
    }

    // 3. Kiểm tra số tiền có khớp không
    if (Math.round(bill.total_amount) !== Math.round(vnp_Amount)) {
      return NextResponse.json({ RspCode: '04', Message: 'Invalid amount' }, { status: 200 });
    }

    // 4. Kiểm tra trạng thái đơn hàng (nếu đã thanh toán trước đó)
    if (bill.status === 'Paid') {
      return NextResponse.json({ RspCode: '02', Message: 'Order already confirmed' }, { status: 200 });
    }

    // 5. Cập nhật gạch nợ thành công
    if (vnp_ResponseCode === '00' && (vnp_TransactionStatus === undefined || vnp_TransactionStatus === '00')) {
      payBill(billId, 'VNPAY', vnp_TransactionNo, vnp_BankCode);
      return NextResponse.json({ RspCode: '00', Message: 'Confirm Success' }, { status: 200 });
    }

    // Trường hợp giao dịch thất bại từ phía cổng
    return NextResponse.json({ RspCode: '00', Message: 'Confirm Success' }, { status: 200 });
  } catch (error: any) {
    console.error('Lỗi IPN VNPAY:', error);
    return NextResponse.json({ RspCode: '99', Message: 'Unknow error' }, { status: 200 });
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const queryParams: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    queryParams[key] = value;
  });
  return handleIpn(queryParams);
}

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const queryParams: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });

    const body = await req.json().catch(() => ({}));
    const merged = { ...queryParams, ...body };
    return handleIpn(merged);
  } catch (err) {
    return NextResponse.json({ RspCode: '99', Message: 'Unknow error' }, { status: 200 });
  }
}
