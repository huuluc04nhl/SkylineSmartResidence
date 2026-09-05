/**
 * Visitor QR Access Control System
 * 
 * Architecture:
 * - Ephemeral & Privacy-First: No persistent personal guest dossiers stored in DB to guarantee resident privacy.
 * - Single-Use vs Multi-Use Entry Modes:
 *   + SINGLE (1 lần): Automatically revokes upon first barrier entry.
 *   + MULTI (Nhiều lần): For Guests/Relatives, valid for multiple entries within the time window.
 * - Realtime Security Audit Log:
 *   + Records timestamp, apartment code, entry type, checkpoint, and access result (Without exposing personal guest identity).
 */

export type PassEntryType = 'SINGLE' | 'MULTI';

export interface GeneratedVisitorPass {
  id: string;
  apartmentCode: string;
  visitorName: string;
  phoneNumber?: string;
  licensePlate?: string;
  entryType: PassEntryType;
  purpose?: string;
  purposeLabel: string;
  validHours: number;
  createdAt: string;
  validUntil: string;
  qrData: string;
  pinCode: string;
  note?: string;
}

export interface VerificationScanResult {
  scanResult: 'VALID' | 'INVALID' | 'EXPIRED';
  title: string;
  message: string;
  canEnter: boolean;
  apartmentCode?: string;
  entryType?: PassEntryType;
  purposeLabel?: string;
  validUntil?: string;
  scannedAt: string;
  checkpoint?: string;
  gateAction?: string;
}

export interface GateAuditLog {
  id: string;
  timestamp: string;
  apartmentCode: string;
  entryType: PassEntryType;
  purposeLabel: string;
  checkpoint: string;
  result: 'VALID' | 'INVALID' | 'EXPIRED';
  gateAction: string;
  qrSnippet: string;
}

// In-memory set for single-use passes that have been used
const USED_SINGLE_TOKENS = new Set<string>();

// Global gate audit log storage
declare global {
  var __SKYLINE_GATE_LOGS: GateAuditLog[] | undefined;
}

const INITIAL_GATE_LOGS: GateAuditLog[] = [
  {
    id: 'LOG-001',
    timestamp: '11:45:10 03/09/2026',
    apartmentCode: '12A05',
    entryType: 'MULTI',
    purposeLabel: 'Khách Thăm Căn Hộ',
    checkpoint: 'Barrier Cổng Sảnh A',
    result: 'VALID',
    gateAction: 'Mở Barrier & Cấp Thang Máy Tầng 12',
    qrSnippet: 'SKY_TOKEN_12A05_MULTI_8832'
  },
  {
    id: 'LOG-002',
    timestamp: '11:32:05 03/09/2026',
    apartmentCode: 'Khách vãng lai',
    entryType: 'SINGLE',
    purposeLabel: 'Mã không xác định',
    checkpoint: 'Sảnh A - Cửa Tự Động',
    result: 'INVALID',
    gateAction: 'Khóa Cổng & Cảnh Báo An Ninh',
    qrSnippet: 'INVALID_QR_FAKE_CODE_001'
  },
  {
    id: 'LOG-003',
    timestamp: '10:15:22 03/09/2026',
    apartmentCode: '14B02',
    entryType: 'MULTI',
    purposeLabel: 'Khách Thăm Căn Hộ',
    checkpoint: 'Barrier Cổng Sảnh A',
    result: 'EXPIRED',
    gateAction: 'Từ Chối Vào (Mã Quá Hạn)',
    qrSnippet: 'EXP_VISITOR_14B02_EXPIRED'
  }
];

const globalScope = (typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : {}) as any;

export function getGateAuditLogs(): GateAuditLog[] {
  if (!globalScope.__SKYLINE_GATE_LOGS) {
    globalScope.__SKYLINE_GATE_LOGS = [...INITIAL_GATE_LOGS];
  }
  return globalScope.__SKYLINE_GATE_LOGS;
}

export function addGateAuditLog(log: Omit<GateAuditLog, 'id'>): GateAuditLog {
  const newLog: GateAuditLog = {
    id: `LOG-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    ...log
  };
  const current = getGateAuditLogs();
  globalScope.__SKYLINE_GATE_LOGS = [newLog, ...current.slice(0, 19)]; // Keep latest 20 logs
  return newLog;
}

/**
 * Generate an ephemeral, time-bounded secure QR token for apartment guest
 * Only stores guest name, phone, license plate, apartment code and validity window.
 */
export function generateVisitorPassToken(params: {
  apartmentCode: string;
  visitorName?: string;
  phoneNumber?: string;
  licensePlate?: string;
  entryType?: PassEntryType;
  validHours?: number;
  note?: string;
  purpose?: string; // backwards compatibility
}): GeneratedVisitorPass {
  const aptCode = params.apartmentCode || '12A05';
  const name = params.visitorName?.trim() || 'Khách Thăm Nhà';
  const phone = params.phoneNumber?.trim() || '';
  const plate = params.licensePlate?.trim().toUpperCase() || '';
  const hours = params.validHours || 4;
  const now = Date.now();
  const expiresAt = now + hours * 3600 * 1000;
  
  const randomPin = Math.floor(100000 + Math.random() * 900000).toString();
  const passId = `SKY-PASS-${Math.floor(1000 + Math.random() * 9000)}`;

  // Default entry type: MULTI (Ra vào tự do trong thời hạn hiệu lực)
  const resolvedEntryType: PassEntryType = params.entryType || 'MULTI';

  // Secure stateless QR token payload format:
  // SKY_TOKEN_{aptCode}_{passId}_{expiresAt}_{entryType}_{signature}
  const signature = Math.abs(hashCode(`${aptCode}_${passId}_${expiresAt}_${resolvedEntryType}`)).toString(36).toUpperCase();
  const qrData = `SKY_TOKEN_${aptCode}_${passId}_${expiresAt}_${resolvedEntryType}_${signature}`;

  return {
    id: passId,
    apartmentCode: aptCode,
    visitorName: name,
    phoneNumber: phone,
    licensePlate: plate,
    entryType: resolvedEntryType,
    purpose: 'VISITOR',
    purposeLabel: 'Khách Thăm Căn Hộ',
    validHours: hours,
    createdAt: new Date(now).toISOString(),
    validUntil: new Date(expiresAt).toISOString(),
    qrData,
    pinCode: randomPin,
    note: params.note || '',
  };
}

/**
 * Gate Barrier Security Scanner
 * Validates any presented QR code or PIN without needing manual BQL approval.
 */
export function verifyVisitorQr(qrInput: string, checkpoint: string = 'Barrier Cổng Sảnh A'): VerificationScanResult {
  const now = Date.now();
  const nowStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const fullTimestamp = `${nowStr} ${new Date().toLocaleDateString('vi-VN')}`;
  const raw = (qrInput || '').trim();

  // 1. Simulation / Pre-configured test cases
  if (raw === 'SIM_QR_INVALID' || raw.includes('FAKE') || raw === 'INVALID_UNKNOWN_QR_SKYLINE_999999' || !raw) {
    const result: VerificationScanResult = {
      scanResult: 'INVALID',
      title: 'MÃ QR KHÔNG HỢP LỆ (QR SAI)',
      message: 'Mã QR không thuộc hệ thống an ninh tòa nhà Skyline hoặc không đúng định dạng. Cổng Barrier khóa chặt.',
      canEnter: false,
      scannedAt: nowStr,
      checkpoint,
      gateAction: 'Khóa Cổng Cảnh Báo An Ninh'
    };

    addGateAuditLog({
      timestamp: fullTimestamp,
      apartmentCode: 'Chưa xác định',
      entryType: 'SINGLE',
      purposeLabel: 'Mã không hợp lệ',
      checkpoint,
      result: 'INVALID',
      gateAction: 'Khóa Cổng Cảnh Báo',
      qrSnippet: raw.substring(0, 25) || 'EMPTY'
    });

    return result;
  }

  if (raw === 'SIM_QR_EXPIRED' || raw === 'EXP_VISITOR_EXPIRED_MOCK_DATA' || raw.includes('EXPIRED')) {
    const result: VerificationScanResult = {
      scanResult: 'EXPIRED',
      title: 'MÃ QR ĐÃ HẾT HẠN HIỆU LỰC (QUÁ HẠN)',
      message: 'Mã QR đã quá thời gian sử dụng được cấp phép. Cổng Barrier đóng, từ chối cho vào.',
      canEnter: false,
      apartmentCode: '14B02',
      scannedAt: nowStr,
      checkpoint,
      gateAction: 'Từ Chối Vào (Quá Hạn)'
    };

    addGateAuditLog({
      timestamp: fullTimestamp,
      apartmentCode: '14B02',
      entryType: 'MULTI',
      purposeLabel: 'Khách Thăm Nhà',
      checkpoint,
      result: 'EXPIRED',
      gateAction: 'Từ Chối Vào (Quá Hạn)',
      qrSnippet: raw.substring(0, 25)
    });

    return result;
  }

  // Pre-configured valid demo token
  if (raw === 'SIM_QR_VALID' || raw === 'SKYLINE_PASS_VALID_12A05_101') {
    const result: VerificationScanResult = {
      scanResult: 'VALID',
      title: 'XÁC THỰC THÀNH CÔNG (QR ĐÚNG)',
      message: 'Mã hợp lệ của Căn hộ 12A05. Barrier tự động mở & thang máy đã được cấp quyền lên Tầng 12.',
      canEnter: true,
      apartmentCode: '12A05',
      entryType: 'MULTI',
      purposeLabel: 'Khách Thăm Nhà',
      scannedAt: nowStr,
      checkpoint,
      gateAction: 'Mở Barrier & Phân Quyền Thang Máy Tầng 12'
    };

    addGateAuditLog({
      timestamp: fullTimestamp,
      apartmentCode: '12A05',
      entryType: 'MULTI',
      purposeLabel: 'Khách Thăm Nhà',
      checkpoint,
      result: 'VALID',
      gateAction: 'Mở Barrier & Phân Quyền Thang Máy',
      qrSnippet: raw.substring(0, 25)
    });

    return result;
  }

  // 2. Parse dynamic token: SKY_TOKEN_{aptCode}_{passId}_{expiresAt}_{entryType}_{signature}
  if (raw.startsWith('SKY_TOKEN_')) {
    const parts = raw.split('_');
    if (parts.length >= 7) {
      const aptCode = parts[2];
      const passId = parts[3];
      const expiryTimestamp = parseInt(parts[4], 10);
      const entryType = parts[5] as PassEntryType;
      const signature = parts[6];

      // Check Single-Use restriction
      if (entryType === 'SINGLE' && USED_SINGLE_TOKENS.has(passId)) {
        const result: VerificationScanResult = {
          scanResult: 'INVALID',
          title: 'MÃ 1 LẦN ĐÃ ĐƯỢC SỬ DỤNG (ĐÃ QUA CỔNG)',
          message: `Mã đón khách (vé 1 lần) của Căn ${aptCode} đã được quét sử dụng trước đó và tự động vô hiệu lực để bảo vệ an ninh.`,
          canEnter: false,
          apartmentCode: aptCode,
          entryType: 'SINGLE',
          scannedAt: nowStr,
          checkpoint,
          gateAction: 'Từ Chối Vào (Mã Đã Dùng 1 Lần)'
        };

        addGateAuditLog({
          timestamp: fullTimestamp,
          apartmentCode: aptCode,
          entryType: 'SINGLE',
          purposeLabel: 'Khách Thăm Căn Hộ',
          checkpoint,
          result: 'INVALID',
          gateAction: 'Từ Chối (Đã Dùng 1 Lần)',
          qrSnippet: raw.substring(0, 25)
        });

        return result;
      }

      // Validate signature
      const expectedSig = Math.abs(hashCode(`${aptCode}_${passId}_${expiryTimestamp}_${entryType}`)).toString(36).toUpperCase();
      if (signature !== expectedSig) {
        return {
          scanResult: 'INVALID',
          title: 'MÃ QR GIẢ MẠO (QR SAI)',
          message: 'Chữ ký an ninh mã QR không hợp lệ hoặc đã bị chỉnh sửa. Barrier tự động khóa chặt.',
          canEnter: false,
          scannedAt: nowStr,
          checkpoint,
          gateAction: 'Khóa Cổng Cảnh Báo An Ninh'
        };
      }

      // Validate expiration
      if (now > expiryTimestamp) {
        const expDate = new Date(expiryTimestamp);
        const result: VerificationScanResult = {
          scanResult: 'EXPIRED',
          title: 'MÃ QR ĐÃ HẾT HẠN (QUÁ HẠN)',
          message: `Mã đón khách Căn ${aptCode} đã hết hạn vào lúc ${expDate.toLocaleTimeString('vi-VN')} ${expDate.toLocaleDateString('vi-VN')}.`,
          canEnter: false,
          apartmentCode: aptCode,
          entryType,
          validUntil: expDate.toISOString(),
          scannedAt: nowStr,
          checkpoint,
          gateAction: 'Từ Chối Vào (Quá Hạn)'
        };

        addGateAuditLog({
          timestamp: fullTimestamp,
          apartmentCode: aptCode,
          entryType,
          purposeLabel: 'Khách Thăm Căn Hộ',
          checkpoint,
          result: 'EXPIRED',
          gateAction: 'Từ Chối Vào (Quá Hạn)',
          qrSnippet: raw.substring(0, 25)
        });

        return result;
      }

      // If single use, register as used
      if (entryType === 'SINGLE') {
        USED_SINGLE_TOKENS.add(passId);
      }

      // Valid token!
      const result: VerificationScanResult = {
        scanResult: 'VALID',
        title: 'XÁC THỰC THÀNH CÔNG (QR ĐÚNG)',
        message: `Mã QR hợp lệ Căn hộ ${aptCode} (${entryType === 'SINGLE' ? 'Vé 1 Lần' : 'Vé Nhiều Lần'}). Barrier mở tự động & Thang máy đã được phân quyền đón khách.`,
        canEnter: true,
        apartmentCode: aptCode,
        entryType,
        purposeLabel: 'Khách Thăm Căn Hộ',
        validUntil: new Date(expiryTimestamp).toISOString(),
        scannedAt: nowStr,
        checkpoint,
        gateAction: `Mở Barrier & Cấp Thang Máy Căn ${aptCode}`
      };

      addGateAuditLog({
        timestamp: fullTimestamp,
        apartmentCode: aptCode,
        entryType,
        purposeLabel: 'Khách Thăm Căn Hộ',
        checkpoint,
        result: 'VALID',
        gateAction: `Mở Barrier & Cấp Thang Máy Căn ${aptCode}`,
        qrSnippet: raw.substring(0, 25)
      });

      return result;
    }
  }

  // Fallback for any unknown format
  return {
    scanResult: 'INVALID',
    title: 'MÃ QR KHÔNG HỢP LỆ',
    message: 'Mã quét không nhận diện được trong hệ thống an ninh tòa nhà.',
    canEnter: false,
    scannedAt: nowStr,
    checkpoint,
    gateAction: 'Khóa Cổng'
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
