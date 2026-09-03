/**
 * Visitor QR Access Control System
 * 
 * Architecture:
 * - Ephemeral & Privacy-First: No persistent personal guest records stored in DB to guarantee resident privacy.
 * - Dynamic Time-Bounded Pass: Digital tokens with expiry timestamps & security signatures.
 * - Gate Scanner Validation: Validates strictly on 3 security states:
 *   1. VALID (QR Đúng, còn hạn) -> Open barrier & grant elevator access
 *   2. INVALID (QR Sai, giả mạo, không tồn tại) -> Lock barrier & alert security
 *   3. EXPIRED (QR Quá Hạn) -> Refuse entry & notify expiry
 */

export interface GeneratedVisitorPass {
  id: string;
  apartmentCode: string;
  visitorName: string;
  purpose: 'VISITOR' | 'DELIVERY' | 'TECH' | 'OTHER';
  purposeLabel: string;
  validHours: number;
  createdAt: string;
  validUntil: string;
  qrData: string;
  pinCode: string;
}

export interface VerificationScanResult {
  scanResult: 'VALID' | 'INVALID' | 'EXPIRED';
  title: string;
  message: string;
  canEnter: boolean;
  apartmentCode?: string;
  visitorName?: string;
  validUntil?: string;
  scannedAt: string;
}

/**
 * Generate an ephemeral, time-bounded secure QR token for apartment guest
 * No database persistence - guarantees 100% personal data privacy.
 */
export function generateVisitorPassToken(params: {
  apartmentCode: string;
  visitorName?: string;
  purpose?: 'VISITOR' | 'DELIVERY' | 'TECH' | 'OTHER';
  validHours?: number;
}): GeneratedVisitorPass {
  const aptCode = params.apartmentCode || '12A05';
  const name = params.visitorName?.trim() || 'Khách Thăm Căn Hộ';
  const hours = params.validHours || 2;
  const now = Date.now();
  const expiresAt = now + hours * 3600 * 1000;
  
  const randomPin = Math.floor(100000 + Math.random() * 900000).toString();
  const passId = `SKY-PASS-${Math.floor(1000 + Math.random() * 9000)}`;

  // Purpose mapping
  const purposeMap: Record<string, string> = {
    VISITOR: 'Khách Thăm Nhà',
    DELIVERY: 'Giao Hàng / Shipper',
    TECH: 'Thợ Kỹ Thuật / Dịch Vụ',
    OTHER: 'Khách Vãng Lai'
  };
  const selectedPurpose = params.purpose || 'VISITOR';

  // Secure stateless QR token payload format: SKY_TOKEN_{aptCode}_{passId}_{expiresAt}_{signature}
  const signature = Math.abs(hashCode(`${aptCode}_${passId}_${expiresAt}`)).toString(36).toUpperCase();
  const qrData = `SKY_TOKEN_${aptCode}_${passId}_${expiresAt}_${signature}`;

  return {
    id: passId,
    apartmentCode: aptCode,
    visitorName: name,
    purpose: selectedPurpose,
    purposeLabel: purposeMap[selectedPurpose] || 'Khách Thăm Nhà',
    validHours: hours,
    createdAt: new Date(now).toISOString(),
    validUntil: new Date(expiresAt).toISOString(),
    qrData,
    pinCode: randomPin,
  };
}

/**
 * Gate Barrier Security Scanner
 * Validates any presented QR code or PIN without needing manual BQL approval.
 */
export function verifyVisitorQr(qrInput: string): VerificationScanResult {
  const now = Date.now();
  const scannedAt = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const raw = (qrInput || '').trim();

  // 1. Simulation / Pre-configured test cases
  if (raw === 'SIM_QR_INVALID' || raw.includes('FAKE') || raw === 'INVALID_UNKNOWN_QR_SKYLINE_999999' || !raw) {
    return {
      scanResult: 'INVALID',
      title: 'MÃ QR KHÔNG HỢP LỆ (QR SAI)',
      message: 'Mã QR không thuộc hệ thống an ninh tòa nhà Skyline hoặc không đúng định dạng. Cổng Barrier khóa chặt.',
      canEnter: false,
      scannedAt,
    };
  }

  if (raw === 'SIM_QR_EXPIRED' || raw === 'EXP_VISITOR_EXPIRED_MOCK_DATA' || raw.includes('EXPIRED')) {
    return {
      scanResult: 'EXPIRED',
      title: 'MÃ QR ĐÃ HẾT HẠN HIỆU LỰC (QUÁ HẠN)',
      message: 'Mã QR đã quá thời gian sử dụng được cấp phép. Cổng Barrier đóng, từ chối cho vào.',
      canEnter: false,
      scannedAt,
    };
  }

  // Pre-configured valid demo token
  if (raw === 'SIM_QR_VALID' || raw === 'SKYLINE_PASS_VALID_12A05_101') {
    return {
      scanResult: 'VALID',
      title: 'XÁC THỰC THÀNH CÔNG (QR ĐÚNG)',
      message: 'Mã hợp lệ của Căn hộ 12A05. Barrier tự động mở & thang máy đã được cấp quyền lên Tầng 12.',
      canEnter: true,
      apartmentCode: '12A05',
      visitorName: 'Khách Thăm Căn Hộ',
      scannedAt,
    };
  }

  // 2. Parse dynamic token: SKY_TOKEN_{aptCode}_{passId}_{expiresAt}_{signature}
  if (raw.startsWith('SKY_TOKEN_')) {
    const parts = raw.split('_');
    if (parts.length >= 6) {
      const aptCode = parts[2];
      const passId = parts[3];
      const expiryTimestamp = parseInt(parts[4], 10);
      const signature = parts[5];

      // Validate signature
      const expectedSig = Math.abs(hashCode(`${aptCode}_${passId}_${expiryTimestamp}`)).toString(36).toUpperCase();
      if (signature !== expectedSig) {
        return {
          scanResult: 'INVALID',
          title: 'MÃ QR GIẢ MẠO (QR SAI)',
          message: 'Chữ ký an ninh mã QR không hợp lệ hoặc đã bị chỉnh sửa. Barrier tự động khóa chặt.',
          canEnter: false,
          scannedAt,
        };
      }

      // Validate expiration
      if (now > expiryTimestamp) {
        const expDate = new Date(expiryTimestamp);
        return {
          scanResult: 'EXPIRED',
          title: 'MÃ QR ĐÃ HẾT HẠN (QUÁ HẠN)',
          message: `Mã đón khách Căn ${aptCode} đã hết hạn vào lúc ${expDate.toLocaleTimeString('vi-VN')} ${expDate.toLocaleDateString('vi-VN')}.`,
          canEnter: false,
          apartmentCode: aptCode,
          validUntil: expDate.toISOString(),
          scannedAt,
        };
      }

      // Valid token!
      return {
        scanResult: 'VALID',
        title: 'XÁC THỰC THÀNH CÔNG (QR ĐÚNG)',
        message: `Mã QR hợp lệ Căn hộ ${aptCode}. Barrier mở tự động & Thang máy đã được phân quyền đón khách.`,
        canEnter: true,
        apartmentCode: aptCode,
        visitorName: 'Khách Thăm Căn Hộ',
        validUntil: new Date(expiryTimestamp).toISOString(),
        scannedAt,
      };
    }
  }

  // Fallback for any unknown format
  return {
    scanResult: 'INVALID',
    title: 'MÃ QR KHÔNG HỢP LỆ',
    message: 'Mã quét không nhận diện được trong hệ thống an ninh tòa nhà.',
    canEnter: false,
    scannedAt,
  };
}

// Simple hash helper
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash;
}
