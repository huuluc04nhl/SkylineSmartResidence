export type VisitorPassStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'USED';

export interface VisitorPass {
  id: string;
  apartmentCode: string;
  hostName: string;
  hostPhone?: string;
  visitorName: string;
  visitorPhone: string;
  licensePlate?: string;
  purpose: 'VISITOR' | 'DELIVERY' | 'TECH' | 'OTHER';
  purposeLabel: string;
  validHours: number;
  createdAt: string;
  validUntil: string;
  qrData: string;
  status: VisitorPassStatus;
  statusMessage?: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectedReason?: string;
  checkedInAt?: string;
}

const STORAGE_KEY = 'skyline_visitor_passes_v2';

export const INITIAL_VISITOR_PASSES: VisitorPass[] = [
  {
    id: 'PASS-101',
    apartmentCode: '12A05',
    hostName: 'Nguyễn Hữu Lực',
    hostPhone: '0903112233',
    visitorName: 'Anh Trần Quốc Bảo (Khách thăm gia đình)',
    visitorPhone: '0918223344',
    licensePlate: '51K-988.23',
    purpose: 'VISITOR',
    purposeLabel: 'Khách Thăm Nhà',
    validHours: 4,
    createdAt: new Date().toISOString(),
    validUntil: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
    qrData: 'SKYLINE_PASS_VALID_12A05_101',
    status: 'APPROVED',
    approvedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    approvedBy: 'BQL Trực Ban (Lễ Tân Sảnh A)',
    statusMessage: 'BQL Đã Phê Duyệt • Sẵn Sàng Quét Vào Cổng',
  },
  {
    id: 'PASS-102',
    apartmentCode: '12A05',
    hostName: 'Nguyễn Hữu Lực',
    hostPhone: '0903112233',
    visitorName: 'Shipper Nguyễn Hùng (Shopee Food Giao Hàng)',
    visitorPhone: '0933445566',
    licensePlate: '59X1-778.99',
    purpose: 'DELIVERY',
    purposeLabel: 'Giao Hàng Shipper',
    validHours: 1,
    createdAt: new Date().toISOString(),
    validUntil: new Date(Date.now() + 1 * 3600 * 1000).toISOString(),
    qrData: 'SKYLINE_PASS_PENDING_12A05_102',
    status: 'PENDING_APPROVAL',
    statusMessage: 'Chờ Ban Quản Lý Xem Xét & Phê Duyệt',
  },
  {
    id: 'PASS-103',
    apartmentCode: '12A05',
    hostName: 'Nguyễn Hữu Lực',
    hostPhone: '0903112233',
    visitorName: 'Chị Lê Thị Tuyết (Tiệc Tối Qua)',
    visitorPhone: '0977112233',
    purpose: 'VISITOR',
    purposeLabel: 'Khách Thăm Nhà',
    validHours: 2,
    createdAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    validUntil: new Date(Date.now() - 34 * 3600 * 1000).toISOString(),
    qrData: 'SKYLINE_PASS_EXPIRED_12A05_103',
    status: 'EXPIRED',
    approvedAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    approvedBy: 'BQL Trực Ban',
    statusMessage: 'Mã QR Đã Hết Hạn Hiệu Lực (Quá 24h)',
  },
  {
    id: 'PASS-104',
    apartmentCode: '14B02',
    hostName: 'Lê Văn An',
    hostPhone: '0901234567',
    visitorName: 'Khách Vãng Lai Không Rõ Mục Đích',
    visitorPhone: '0988000999',
    purpose: 'OTHER',
    purposeLabel: 'Mục Đích Khác',
    validHours: 1,
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    validUntil: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    qrData: 'SKYLINE_PASS_REJECTED_14B02_104',
    status: 'REJECTED',
    rejectedReason: 'Không rõ thông tin nhân thân và mục đích lên căn hộ',
    statusMessage: 'BQL Từ Chối Cấp Quyền Ra Vào',
  }
];

export function getVisitorPassesFromStorage(): VisitorPass[] {
  if (typeof window === 'undefined') return INITIAL_VISITOR_PASSES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_VISITOR_PASSES));
      return INITIAL_VISITOR_PASSES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_VISITOR_PASSES;
  }
}

export function saveVisitorPassesToStorage(passes: VisitorPass[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(passes));
  } catch (e) {
    console.error('Failed to save visitor passes:', e);
  }
}

/**
 * 1. Cư Dân tạo mã đón khách (trạng thái ban đầu: PENDING_APPROVAL)
 */
export function createVisitorPass(data: {
  apartmentCode: string;
  hostName: string;
  hostPhone?: string;
  visitorName: string;
  visitorPhone: string;
  licensePlate?: string;
  purpose: 'VISITOR' | 'DELIVERY' | 'TECH' | 'OTHER';
  validHours: number;
}): VisitorPass {
  const passes = getVisitorPassesFromStorage();
  const id = `PASS-${Date.now().toString().slice(-4)}`;
  const purposeMap: Record<string, string> = {
    VISITOR: 'Khách Thăm Nhà',
    DELIVERY: 'Giao Hàng Shipper',
    TECH: 'Bảo Trì Riêng',
    OTHER: 'Khác',
  };

  const now = new Date();
  const validUntil = new Date(now.getTime() + data.validHours * 3600 * 1000);
  const qrData = `SKYLINE_PASS_${data.apartmentCode}_${id}_${Date.now()}`;

  const newPass: VisitorPass = {
    id,
    apartmentCode: data.apartmentCode,
    hostName: data.hostName,
    hostPhone: data.hostPhone || '',
    visitorName: data.visitorName,
    visitorPhone: data.visitorPhone,
    licensePlate: data.licensePlate || '',
    purpose: data.purpose,
    purposeLabel: purposeMap[data.purpose] || 'Khách Thăm',
    validHours: data.validHours,
    createdAt: now.toISOString(),
    validUntil: validUntil.toISOString(),
    qrData,
    status: 'PENDING_APPROVAL',
    statusMessage: 'Chờ Ban Quản Lý Xem Xét & Phê Duyệt',
  };

  const updated = [newPass, ...passes];
  saveVisitorPassesToStorage(updated);
  return newPass;
}

/**
 * 2. Ban Quản Lý duyệt yêu cầu
 */
export function approveVisitorPass(id: string, approver = 'Ban Quản Lý Skyline'): VisitorPass | null {
  const passes = getVisitorPassesFromStorage();
  const pass = passes.find(p => p.id === id);
  if (!pass) return null;

  pass.status = 'APPROVED';
  pass.approvedAt = new Date().toISOString();
  pass.approvedBy = approver;
  pass.statusMessage = 'BQL Đã Phê Duyệt • Hợp Lệ';

  saveVisitorPassesToStorage(passes);
  return pass;
}

/**
 * 3. Ban Quản Lý từ chối yêu cầu
 */
export function rejectVisitorPass(id: string, reason = 'Thông tin chưa đầy đủ hoặc không hợp lệ'): VisitorPass | null {
  const passes = getVisitorPassesFromStorage();
  const pass = passes.find(p => p.id === id);
  if (!pass) return null;

  pass.status = 'REJECTED';
  pass.rejectedReason = reason;
  pass.statusMessage = 'BQL Từ Chối Cấp Quyền Ra Vào';

  saveVisitorPassesToStorage(passes);
  return pass;
}

export interface VerificationScanResult {
  scanResult: 'VALID' | 'INVALID' | 'EXPIRED';
  title: string;
  message: string;
  canEnter: boolean;
  pass?: VisitorPass;
  scannedAt: string;
}

/**
 * 4. Máy Quét Barrier Tại Cổng Sảnh (Gate Security Scanner)
 * Xử lý chính xác 3 trường hợp:
 * - QR ĐÚNG (APPROVED & còn thời hạn) -> Cho vào, mở Barrier, phân quyền thang máy
 * - QR SAI (Không tồn tại, mã giả, hoặc PENDING chưa duyệt, hoặc REJECTED) -> Khóa barrier
 * - QR HẾT HẠN (Quá giờ hiệu lực hoặc EXPIRED) -> Khóa barrier, thông báo hết hạn
 */
export function verifyVisitorQr(qrInput: string): VerificationScanResult {
  const passes = getVisitorPassesFromStorage();
  const now = new Date();
  const scannedAt = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // Special Demo Case 1: Hardcoded or Simulated Invalid Code
  if (qrInput === 'SIM_QR_INVALID' || qrInput.includes('FAKE') || !qrInput.trim()) {
    return {
      scanResult: 'INVALID',
      title: 'MÃ QR KHÔNG HỢP LỆ (QR SAI)',
      message: 'Mã QR không tồn tại trong hệ thống tòa nhà hoặc giả mạo. Barrier tự động khóa chặt.',
      canEnter: false,
      scannedAt,
    };
  }

  // Find pass by qrData or ID
  const pass = passes.find(p => p.qrData === qrInput || p.id === qrInput);

  if (!pass) {
    return {
      scanResult: 'INVALID',
      title: 'MÃ QR KHÔNG HỢP LỆ (QR SAI)',
      message: 'Không tìm thấy thông tin đăng ký mã khách này trong cơ sở dữ liệu tòa nhà.',
      canEnter: false,
      scannedAt,
    };
  }

  // Case: Pass is still PENDING_APPROVAL
  if (pass.status === 'PENDING_APPROVAL') {
    return {
      scanResult: 'INVALID',
      title: 'MÃ CHƯA ĐƯỢC PHÊ DUYỆT (QR SAI)',
      message: `Mã đón khách của Căn ${pass.apartmentCode} đang ở trạng thái [Chờ BQL Duyệt]. Vui lòng chờ Ban Quản Lý phê duyệt trước khi vào sảnh.`,
      canEnter: false,
      pass,
      scannedAt,
    };
  }

  // Case: Pass was REJECTED
  if (pass.status === 'REJECTED') {
    return {
      scanResult: 'INVALID',
      title: 'MÃ ĐÃ BỊ TỪ CHỐI (QR SAI)',
      message: `Yêu cầu vào tòa nhà đã bị Ban Quản Lý từ chối (${pass.rejectedReason || 'Không đáp ứng an ninh'}).`,
      canEnter: false,
      pass,
      scannedAt,
    };
  }

  // Case: Pass is EXPIRED
  const expiryDate = new Date(pass.validUntil);
  if (pass.status === 'EXPIRED' || now > expiryDate) {
    // Update store to EXPIRED if not already
    pass.status = 'EXPIRED';
    saveVisitorPassesToStorage(passes);

    return {
      scanResult: 'EXPIRED',
      title: 'MÃ QR ĐÃ HẾT HẠN HIỆU LỰC',
      message: `Mã đón khách đã hết hạn lúc ${expiryDate.toLocaleTimeString('vi-VN')} ngày ${expiryDate.toLocaleDateString('vi-VN')}. Vui lòng liên hệ chủ hộ Căn ${pass.apartmentCode} để tạo mã mới.`,
      canEnter: false,
      pass,
      scannedAt,
    };
  }

  // Case: Pass is APPROVED & Still Valid -> QR ĐÚNG!
  if (pass.status === 'APPROVED') {
    pass.checkedInAt = now.toISOString();
    saveVisitorPassesToStorage(passes);

    return {
      scanResult: 'VALID',
      title: 'XÁC THỰC THÀNH CÔNG (QR ĐÚNG)',
      message: `Mã hợp lệ đã được BQL duyệt! Chào mừng ${pass.visitorName} đến thăm Căn hộ ${pass.apartmentCode}. Barrier đã mở tự động & Thang máy đã được phân quyền đón khách.`,
      canEnter: true,
      pass,
      scannedAt,
    };
  }

  // Fallback
  return {
    scanResult: 'INVALID',
    title: 'MÃ QR KHÔNG THỂ XÁC THỰC',
    message: 'Trạng thái mã không xác định. Vui lòng liên hệ quầy lễ tân sảnh.',
    canEnter: false,
    pass,
    scannedAt,
  };
}
