import { NextResponse } from 'next/server';
import { verifyVnpayChecksum } from '@/lib/vnpay';
import { payBill } from '@/lib/billingStore';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const queryParams: Record<string, string> = {};
    
    url.searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });

    const { isValid, params } = verifyVnpayChecksum(queryParams);

    const vnp_ResponseCode = queryParams['vnp_ResponseCode'];
    const vnp_TxnRef = queryParams['vnp_TxnRef'] || '';
    const vnp_TransactionNo = queryParams['vnp_TransactionNo'] || `VNP${Date.now().toString().slice(-8)}`;
    const vnp_BankCode = queryParams['vnp_BankCode'] || 'VNPAY';
    const vnp_Amount = queryParams['vnp_Amount'] ? (parseInt(queryParams['vnp_Amount'], 10) / 100) : 0;

    // Tách billId từ vnp_TxnRef (billId_timestamp)
    const billId = vnp_TxnRef.includes('_') ? vnp_TxnRef.split('_')[0] : vnp_TxnRef;

    const baseUrl = url.origin;

    if (!isValid) {
      console.error('Cảnh báo: Sai mã kiểm tra chữ ký VNPAY (Checksum mismatch)');
      return NextResponse.redirect(
        `${baseUrl}/portal?tab=finance&vnp_status=invalid_checksum&billId=${encodeURIComponent(billId)}`
      );
    }

    if (vnp_ResponseCode === '00') {
      // Thanh toán thành công, thực hiện gạch nợ tự động
      if (billId) {
        payBill(billId, 'VNPAY', vnp_TransactionNo, vnp_BankCode);
      }

      return NextResponse.redirect(
        `${baseUrl}/portal?tab=finance&vnp_status=success&billId=${encodeURIComponent(billId)}&transId=${encodeURIComponent(vnp_TransactionNo)}&amount=${vnp_Amount}&bank=${encodeURIComponent(vnp_BankCode)}`
      );
    } else {
      // Giao dịch không thành công hoặc người dùng hủy
      return NextResponse.redirect(
        `${baseUrl}/portal?tab=finance&vnp_status=failed&code=${encodeURIComponent(vnp_ResponseCode || '99')}&billId=${encodeURIComponent(billId)}`
      );
    }
  } catch (error: any) {
    console.error('Lỗi xử lý VNPAY Return URL:', error);
    const origin = new URL(req.url).origin;
    return NextResponse.redirect(`${origin}/portal?tab=finance&vnp_status=error`);
  }
}
