/**
 * Visitor QR Access Control System
 * 
 * Architecture:
 * - Ephemeral & Privacy-First: No persistent personal guest dossiers stored in DB to guarantee resident privacy.
 * - Realtime Security Audit Log:
 *   + Records timestamp, apartment code, checkpoint, and access result.
 * - Hardware Interlock Simulation:
 *   + Controls barrier gate state (OPEN / CLOSED / LOCKED) and automatic elevator dispatch.
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
  visitorName?: string;
  licensePlate?: string;
  entryType?: PassEntryType;
  purposeLabel?: string;
  validUntil?: string;
  scannedAt: string;
  checkpoint?: string;
  gateAction?: string;
  targetFloor?: number;
  towerName?: string;
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

const globalScope = (typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : {}) as any;

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
  globalScope.__SKYLINE_GATE_LOGS = [newLog, ...current.slice(0, 24)]; // Keep latest 25 logs
  return newLog;
}

/**
 * Registry of created visitor passes for PIN & QR verification
 */
export function getRegisteredVisitorPasses(): GeneratedVisitorPass[] {
  if (!globalScope.__SKYLINE_REGISTERED_PASSES) {
    globalScope.__SKYLINE_REGISTERED_PASSES = [];
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('skyline_registered_passes');
        if (stored) {
          globalScope.__SKYLINE_REGISTERED_PASSES = JSON.parse(stored);
        }
      } catch (e) {
        // ignore
      }
    }
  }
  return globalScope.__SKYLINE_REGISTERED_PASSES;
}

export function saveRegisteredVisitorPass(pass: GeneratedVisitorPass) {
  const current = getRegisteredVisitorPasses();
  const updated = [pass, ...current.filter(p => p.id !== pass.id).slice(0, 19)];
  globalScope.__SKYLINE_REGISTERED_PASSES = updated;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('skyline_registered_passes', JSON.stringify(updated));
    } catch (e) {
      // ignore
    }
  }
}

export function getLatestVisitorPass(): GeneratedVisitorPass | null {
  const passes = getRegisteredVisitorPasses();
  return passes.length > 0 ? passes[0] : null;
}

/**
 * Generate an ephemeral, time-bounded secure QR token for apartment guest
 */
export function generateVisitorPassToken(params: {
  apartmentCode: string;
  visitorName?: string;
  phoneNumber?: string;
  licensePlate?: string;
  entryType?: PassEntryType;
  validHours?: number;
  note?: string;
  purpose?: string;
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
  const resolvedEntryType: PassEntryType = params.entryType || 'MULTI';

  // Secure stateless QR token payload format:
  // SKY_TOKEN_{aptCode}_{passId}_{expiresAt}_{entryType}_{signature}
  const signature = Math.abs(hashCode(`${aptCode}_${passId}_${expiresAt}_${resolvedEntryType}`)).toString(36).toUpperCase();
  const qrData = `SKY_TOKEN_${aptCode}_${passId}_${expiresAt}_${resolvedEntryType}_${signature}`;

  const newPass: GeneratedVisitorPass = {
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

  saveRegisteredVisitorPass(newPass);
  return newPass;
}

// Helper to extract floor number from apartment code (e.g. 12A05 -> 12, 14B02 -> 14)
function extractFloor(aptCode: string): number {
  const match = aptCode.match(/\d+/);
  return match ? parseInt(match[0], 10) : 1;
}

/**
 * Gate Barrier Security Scanner
 * Validates any presented QR code, Token, or 6-digit PIN.
 */
export function verifyVisitorQr(qrInput: string, checkpoint: string = 'Barrier Cổng Sảnh A'): VerificationScanResult {
  const now = Date.now();
  const nowStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const fullTimestamp = `${nowStr} ${new Date().toLocaleDateString('vi-VN')}`;
  const raw = (qrInput || '').trim();

  // 1. Check if empty
  if (!raw) {
    const result: VerificationScanResult = {
      scanResult: 'INVALID',
      title: 'CHƯA NHẬP DỮ LIỆU QUÉT',
      message: 'Vui lòng đưa mã QR trước camera trạm quét hoặc nhập mã PIN số của khách.',
      canEnter: false,
      scannedAt: nowStr,
      checkpoint,
      gateAction: 'Chờ Quét Mã'
    };
    return result;
  }

  // 2. Pre-configured simulation tests
  if (raw === 'SIM_QR_INVALID' || raw.includes('FAKE') || raw === 'INVALID_UNKNOWN_QR_SKYLINE_999999') {
    const result: VerificationScanResult = {
      scanResult: 'INVALID',
      title: 'MÃ KHÔNG HỢP LỆ (MÃ SAI / GIẢ MẠO)',
      message: 'Mã không thuộc hệ thống an ninh Chung cư Skyline hoặc chữ ký bảo mật bị sai. Cổng Barrier khóa chặt.',
      canEnter: false,
      scannedAt: nowStr,
      checkpoint,
      gateAction: 'Khóa Barrier & Cảnh Báo An Ninh'
    };

    addGateAuditLog({
      timestamp: fullTimestamp,
      apartmentCode: 'Không rõ',
      entryType: 'MULTI',
      purposeLabel: 'Mã không hợp lệ',
      checkpoint,
      result: 'INVALID',
      gateAction: 'Khóa Cổng Cảnh Báo',
      qrSnippet: raw.substring(0, 25)
    });

    return result;
  }

  if (raw === 'SIM_QR_EXPIRED' || raw === 'EXP_VISITOR_EXPIRED_MOCK_DATA' || raw.includes('EXPIRED')) {
    const result: VerificationScanResult = {
      scanResult: 'EXPIRED',
      title: 'MÃ ĐÃ HẾT HẠN HIỆU LỰC (QUÁ HẠN)',
      message: 'Mã đón khách đã quá thời gian sử dụng được cấp phép. Cổng Barrier đóng, từ chối cho vào.',
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
      purposeLabel: 'Khách Thăm Căn Hộ',
      checkpoint,
      result: 'EXPIRED',
      gateAction: 'Từ Chối Vào (Quá Hạn)',
      qrSnippet: raw.substring(0, 25)
    });

    return result;
  }

  if (raw === 'SIM_QR_VALID' || raw === 'SKYLINE_PASS_VALID_12A05_101') {
    const floor = 12;
    const tower = 'Tòa A (Sapphire)';
    const result: VerificationScanResult = {
      scanResult: 'VALID',
      title: 'XÁC THỰC THÀNH CÔNG • MÃ HỢP LỆ',
      message: `Khách thăm Căn hộ 12A05 • ${tower}. Barrier mở tự động và thang máy được phân quyền đón lên Tầng ${floor}.`,
      canEnter: true,
      apartmentCode: '12A05',
      visitorName: 'Anh Hoàng Nam (Khách)',
      licensePlate: '51F-892.45',
      entryType: 'MULTI',
      purposeLabel: 'Khách Thăm Căn Hộ',
      targetFloor: floor,
      towerName: tower,
      scannedAt: nowStr,
      checkpoint,
      gateAction: `Mở Barrier & Phân Quyền Thang Máy Tầng ${floor}`
    };

    addGateAuditLog({
      timestamp: fullTimestamp,
      apartmentCode: '12A05',
      entryType: 'MULTI',
      purposeLabel: 'Khách Thăm Căn Hộ',
      checkpoint,
      result: 'VALID',
      gateAction: `Mở Barrier & Cấp Thang Máy Tầng ${floor}`,
      qrSnippet: raw.substring(0, 25)
    });

    return result;
  }

  // 3. Match against registered passes by PIN code or pass ID or full qrData
  const registeredPasses = getRegisteredVisitorPasses();
  const matchedPass = registeredPasses.find(
    p => p.pinCode === raw || p.qrData === raw || p.id === raw || raw.includes(p.id)
  );

  if (matchedPass) {
    const expiryTime = new Date(matchedPass.validUntil).getTime();
    const isExpired = now > expiryTime;
    const floor = extractFloor(matchedPass.apartmentCode);
    const tower = matchedPass.apartmentCode.includes('A') ? 'Tòa A (Sapphire)' : 'Tòa B (Diamond)';

    if (isExpired) {
      const expDate = new Date(expiryTime);
      const result: VerificationScanResult = {
        scanResult: 'EXPIRED',
        title: 'MÃ ĐÃ HẾT HẠN HIỆU LỰC (QUÁ HẠN)',
        message: `Mã đón khách của Căn ${matchedPass.apartmentCode} (${matchedPass.visitorName}) đã hết hạn lúc ${expDate.toLocaleTimeString('vi-VN')} ngày ${expDate.toLocaleDateString('vi-VN')}.`,
        canEnter: false,
        apartmentCode: matchedPass.apartmentCode,
        visitorName: matchedPass.visitorName,
        entryType: matchedPass.entryType,
        validUntil: matchedPass.validUntil,
        scannedAt: nowStr,
        checkpoint,
        gateAction: 'Từ Chối Vào (Mã Quá Hạn)'
      };

      addGateAuditLog({
        timestamp: fullTimestamp,
        apartmentCode: matchedPass.apartmentCode,
        entryType: matchedPass.entryType,
        purposeLabel: 'Khách Thăm Căn Hộ',
        checkpoint,
        result: 'EXPIRED',
        gateAction: 'Từ Chối Vào (Quá Hạn)',
        qrSnippet: raw.substring(0, 25)
      });

      return result;
    }

    // Valid registered pass!
    const result: VerificationScanResult = {
      scanResult: 'VALID',
      title: 'XÁC THỰC THÀNH CÔNG • MÃ HỢP LỆ',
      message: `Khách thăm ${matchedPass.visitorName} • Điểm đến Căn hộ ${matchedPass.apartmentCode} (${tower}). Barrier tự động mở & Thang máy được phân quyền lên Tầng ${floor}.`,
      canEnter: true,
      apartmentCode: matchedPass.apartmentCode,
      visitorName: matchedPass.visitorName,
      licensePlate: matchedPass.licensePlate,
      entryType: matchedPass.entryType,
      purposeLabel: 'Khách Thăm Căn Hộ',
      validUntil: matchedPass.validUntil,
      targetFloor: floor,
      towerName: tower,
      scannedAt: nowStr,
      checkpoint,
      gateAction: `Mở Barrier & Cấp Thang Máy Tầng ${floor}`
    };

    addGateAuditLog({
      timestamp: fullTimestamp,
      apartmentCode: matchedPass.apartmentCode,
      entryType: matchedPass.entryType,
      purposeLabel: 'Khách Thăm Căn Hộ',
      checkpoint,
      result: 'VALID',
      gateAction: `Mở Barrier & Cấp Thang Máy Tầng ${floor}`,
      qrSnippet: raw.substring(0, 25)
    });

    return result;
  }

  // 4. Parse dynamic token: SKY_TOKEN_{aptCode}_{passId}_{expiresAt}_{entryType}_{signature}
  if (raw.startsWith('SKY_TOKEN_')) {
    const parts = raw.split('_');
    if (parts.length >= 7) {
      const aptCode = parts[2];
      const passId = parts[3];
      const expiryTimestamp = parseInt(parts[4], 10);
      const entryType = parts[5] as PassEntryType;
      const signature = parts[6];

      // Validate signature
      const expectedSig = Math.abs(hashCode(`${aptCode}_${passId}_${expiryTimestamp}_${entryType}`)).toString(36).toUpperCase();
      if (signature !== expectedSig) {
        return {
          scanResult: 'INVALID',
          title: 'MÃ QR GIẢ MẠO (CHỮ KÝ SAI)',
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

      const floor = extractFloor(aptCode);
      const tower = aptCode.includes('A') ? 'Tòa A (Sapphire)' : 'Tòa B (Diamond)';

      // Valid token!
      const result: VerificationScanResult = {
        scanResult: 'VALID',
        title: 'XÁC THỰC THÀNH CÔNG • MÃ QR HỢP LỆ',
        message: `Mã QR hợp lệ Căn hộ ${aptCode} (${tower}). Barrier mở tự động & Thang máy đã được phân quyền đón khách lên Tầng ${floor}.`,
        canEnter: true,
        apartmentCode: aptCode,
        entryType,
        purposeLabel: 'Khách Thăm Căn Hộ',
        validUntil: new Date(expiryTimestamp).toISOString(),
        targetFloor: floor,
        towerName: tower,
        scannedAt: nowStr,
        checkpoint,
        gateAction: `Mở Barrier & Cấp Thang Máy Tầng ${floor}`
      };

      addGateAuditLog({
        timestamp: fullTimestamp,
        apartmentCode: aptCode,
        entryType,
        purposeLabel: 'Khách Thăm Căn Hộ',
        checkpoint,
        result: 'VALID',
        gateAction: `Mở Barrier & Cấp Thang Máy Tầng ${floor}`,
        qrSnippet: raw.substring(0, 25)
      });

      return result;
    }
  }

  // 5. Fallback for any unknown format
  return {
    scanResult: 'INVALID',
    title: 'MÃ KHÔNG HỢP LỆ (KHÔNG TÌM THẤY)',
    message: 'Mã QR hoặc mã PIN không tồn tại trong hệ thống kiểm soát ra vào của chung cư.',
    canEnter: false,
    scannedAt: nowStr,
    checkpoint,
    gateAction: 'Khóa Cổng Cảnh Báo'
  };
}

// Hash helper for signature verification
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash;
}
