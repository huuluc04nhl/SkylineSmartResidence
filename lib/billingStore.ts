/**
 * Skyline Smart Residence - Centralized Billing & Payment Store
 * 
 * Quản trị dữ liệu hóa đơn sinh hoạt 2 chiều thực tế giữa Ban Quản Lý và Cư Dân:
 * - Tạo và phát hành hóa đơn theo căn hộ
 * - Sinh mã VietQR chuẩn Napas247 tự động điền số tài khoản, số tiền và nội dung chuyển khoản
 * - Đồng bộ trạng thái gạch nợ thời gian thực (Unpaid -> Paid)
 */

import { Bill, BillDetail, DEMO_BILLS } from './dataStore';

export interface ExtendedBill extends Bill {
  payment_method?: 'VNPAY' | 'MOMO' | 'VIETQR' | 'BANK_TRANSFER';
  transaction_ref?: string;
  paid_at?: string;
  bank_code?: string;
}

const BILLS_STORAGE_KEY = 'skyline_bills_v4';

// Cấu hình tài khoản ngân hàng Ban Quản Lý Tòa Nhà Skyline (BIDV)
export const SKYLINE_BANK_INFO = {
  bankName: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam (BIDV)',
  bankShortName: 'BIDV',
  bankBin: 'BIDV', // BIDV Napas BIN
  accountNumber: '0364967082',
  accountHolder: 'NGUYEN HUU LUC',
  branch: 'Chi nhánh TP. Hồ Chí Minh',
};

// Cấu hình ví điện tử MoMo
export const SKYLINE_MOMO_INFO = {
  phoneNumber: '0364967082',
  receiverName: 'NGUYEN HUU LUC',
};

/**
 * Sinh URL mã VietQR chuẩn Napas247 quét được bằng mọi app ngân hàng Việt Nam
 */
export function generateVietQrUrl(params: {
  amount: number;
  transferNote: string;
  bankBin?: string;
  accountNumber?: string;
}): string {
  const bin = params.bankBin || SKYLINE_BANK_INFO.bankBin;
  const acc = params.accountNumber || SKYLINE_BANK_INFO.accountNumber;
  const amount = Math.max(0, Math.round(params.amount));
  const note = encodeURIComponent(params.transferNote.trim());
  const accountName = encodeURIComponent(SKYLINE_BANK_INFO.accountHolder);

  return `https://img.vietqr.io/image/${bin}-${acc}-compact2.png?amount=${amount}&addInfo=${note}&accountName=${accountName}`;
}

export const INITIAL_BILLS: Bill[] = [
  ...DEMO_BILLS,
];

function notifyBillingUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('skyline_billing_updated'));
  }
}

/**
 * Lấy toàn bộ danh sách hóa đơn
 */
let serverMemoryBills: ExtendedBill[] = [...INITIAL_BILLS];

export function getBills(aptCode?: string, overrideOwnerName?: string): ExtendedBill[] {
  let allBills: ExtendedBill[] = serverMemoryBills;
  if (typeof window !== 'undefined') {
    try {
      // Dọn dẹp cache cũ chứa dữ liệu ảo
      localStorage.removeItem('skyline_bills_v1');
      localStorage.removeItem('skyline_bills_v2');
      localStorage.removeItem('skyline_bills_v3');

      const raw = localStorage.getItem(BILLS_STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(BILLS_STORAGE_KEY, JSON.stringify(INITIAL_BILLS));
        allBills = INITIAL_BILLS;
      } else {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Lọc bỏ triệt để các hóa đơn ảo và làm sạch chi tiết
          allBills = parsed
            .filter((b: ExtendedBill) => b.id !== 'bill-2026-08-08a02' && b.id !== 'bill-2026-08-18a01')
            .map((bill: ExtendedBill) => {
              const cleanDetails = (bill.details || [])
                .filter((d: any) => 
                  d.id !== 'bd-5' && d.id !== 'bd-6' && 
                  d.booking_ref !== 'SRV-LAUN-1201' && d.booking_ref !== 'SRV-PTSW-1202'
                )
                .map((d: any) => ({
                  ...d,
                  ai_anomaly: false,
                  anomaly_reason: undefined,
                }));
              const cleanTotal = cleanDetails.reduce((s: number, d: any) => s + (d.total_line_amount || 0), 0);
              return {
                ...bill,
                has_ai_anomaly: false,
                total_amount: cleanTotal > 0 ? cleanTotal : bill.total_amount,
                details: cleanDetails,
              };
            });

          // Đảm bảo các hóa đơn chuẩn luôn hiện diện
          const existingIds = new Set(allBills.map(b => b.id));
          for (const initBill of INITIAL_BILLS) {
            if (!existingIds.has(initBill.id)) {
              allBills.push(initBill);
            }
          }
        } else {
          allBills = INITIAL_BILLS;
        }
      }
    } catch {
      allBills = INITIAL_BILLS;
    }
  }

  // Đồng bộ tên chủ hộ thực tế nếu được truyền vào
  if (overrideOwnerName && overrideOwnerName.trim()) {
    allBills = allBills.map(b => {
      const bCode = b.apt_code.trim().toUpperCase();
      const isTarget = aptCode && (
        bCode === aptCode.trim().toUpperCase() || 
        ((bCode === 'CH-06' || bCode === '12A05') && (aptCode.toUpperCase() === 'CH-06' || aptCode.toUpperCase() === '12A05'))
      );
      if (isTarget) {
        return { ...b, owner_name: overrideOwnerName.trim() };
      }
      return b;
    });
  }

  if (aptCode) {
    const clean = aptCode.trim().toUpperCase();
    const isOwnerTarget = clean === 'CH-06' || clean === '12A05' || clean.endsWith('CH-06');
    return allBills.filter(b => {
      const bCode = b.apt_code.trim().toUpperCase();
      if (isOwnerTarget) {
        return bCode === 'CH-06' || bCode === '12A05' || bCode.endsWith('CH-06');
      }
      return bCode === clean;
    });
  }
  return allBills;
}

/**
 * Lấy chi tiết hóa đơn theo ID
 */
export function getBillById(id: string): ExtendedBill | undefined {
  return getBills().find(b => b.id === id);
}

/**
 * Lưu danh sách hóa đơn
 */
export function saveBills(bills: ExtendedBill[]): void {
  serverMemoryBills = bills;
  if (typeof window !== 'undefined') {
    localStorage.setItem(BILLS_STORAGE_KEY, JSON.stringify(bills));
    notifyBillingUpdated();
  }
}

/**
 * Cư Dân thực hiện thanh toán trực tuyến (VNPAY / MOMO / VIETQR)
 */
export function payBill(
  billId: string, 
  method: 'VNPAY' | 'MOMO' | 'VIETQR' = 'VNPAY',
  transactionRef?: string,
  bankCode?: string
): ExtendedBill | null {
  const allBills = getBills();
  let updatedBill: ExtendedBill | null = null;

  const nextList = allBills.map(b => {
    if (b.id === billId) {
      const transId = transactionRef || (method === 'VNPAY' 
        ? `VNP${Date.now().toString().slice(-8)}` 
        : `MM${Date.now().toString().slice(-8)}`);

      updatedBill = {
        ...b,
        status: 'Paid' as const,
        status_color: '#16A34A',
        payment_method: method,
        transaction_ref: transId,
        paid_at: new Date().toISOString(),
        bank_code: bankCode || (method === 'VNPAY' ? 'VNPAY_GATEWAY' : 'MOMO_WALLET'),
      };
      return updatedBill;
    }
    return b;
  });

  if (updatedBill) {
    saveBills(nextList);
  }

  return updatedBill;
}

/**
 * Ban Quản Lý duyệt gạch nợ sau khi kế toán kiểm tra tài khoản
 */
export function confirmPaidByAdmin(billId: string, notes?: string): ExtendedBill | null {
  const allBills = getBills();
  let target: ExtendedBill | null = null;

  const nextList = allBills.map(b => {
    if (b.id === billId) {
      target = {
        ...b,
        status: 'Paid' as const,
        status_color: '#16A34A',
        payment_method: 'BANK_TRANSFER',
        transaction_ref: `BQL-REC-${Date.now().toString().slice(-6)}`,
        paid_at: new Date().toISOString(),
      };
      return target;
    }
    return b;
  });

  if (target) {
    saveBills(nextList);
  }

  return target;
}

/**
 * Ban Quản Lý phát hành hóa đơn đồng loạt kỳ mới
 */
export function publishAllBills(): void {
  const allBills = getBills();
  const nextList = allBills.map(b => {
    if (b.status === 'Draft') {
      return { ...b, status: 'Unpaid' as const, status_color: '#D97706' };
    }
    return b;
  });
  saveBills(nextList);
}

/**
 * Thêm một mục chi phí dịch vụ phát sinh (Giặt ủi, Giúp việc, PT, Chăm sóc xe) vào hóa đơn chưa thanh toán của căn hộ
 */
export function addServiceChargeToBill(
  aptCode: string,
  serviceDetail: Omit<BillDetail, 'id' | 'bill_id'>
): ExtendedBill | null {
  const allBills = getBills();
  const cleanApt = aptCode.trim().toUpperCase();

  // Tìm hóa đơn chưa thanh toán (Unpaid) của căn hộ, nếu không có thì lấy hóa đơn gần nhất
  let targetBill = allBills.find(b => b.apt_code.trim().toUpperCase() === cleanApt && b.status === 'Unpaid');
  if (!targetBill) {
    targetBill = allBills.find(b => b.apt_code.trim().toUpperCase() === cleanApt);
  }
  if (!targetBill) return null;

  const newDetailId = `bd-srv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const newDetail: BillDetail = {
    ...serviceDetail,
    id: newDetailId,
    bill_id: targetBill.id,
  };

  const updatedDetails = [...targetBill.details, newDetail];
  const newTotal = updatedDetails.reduce((sum, d) => sum + (d.total_line_amount || 0), 0);

  const updatedBill: ExtendedBill = {
    ...targetBill,
    total_amount: newTotal,
    payment_qr_url: generateVietQrUrl({
      amount: newTotal,
      transferNote: `SKYLINE ${cleanApt} ${targetBill.billing_month.replace(/\s+/g, '')}`,
    }),
    details: updatedDetails,
  };

  const nextList = allBills.map(b => b.id === targetBill!.id ? updatedBill : b);
  saveBills(nextList);

  return updatedBill;
}

