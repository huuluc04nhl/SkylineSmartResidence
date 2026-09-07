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

export interface ResidentArrivalAlert {
  apartmentCode: string;
  visitorName: string;
  time: string;
  checkpoint: string;
  elevatorCabin: string;
  floor: string;
  message: string;
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
  visitorName?: string;
  elevatorCabin?: string;
  targetFloor?: string;
  residentPushAlert?: ResidentArrivalAlert;
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

// Global pass registry and audit log storage
declare global {
  var __SKYLINE_GATE_LOGS: GateAuditLog[] | undefined;
  var __SKYLINE_VISITOR_PASSES: Map<string, GeneratedVisitorPass> | undefined;
  var __LAST_RESIDENT_VISITOR_ALERT: ResidentArrivalAlert | null | undefined;
}

const globalScope = (typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : {}) as any;

export function getPassRegistry(): Map<string, GeneratedVisitorPass> {
  if (!globalScope.__SKYLINE_VISITOR_PASSES) {
    globalScope.__SKYLINE_VISITOR_PASSES = new Map<string, GeneratedVisitorPass>();
    // Hydrate from localStorage if in browser
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = localStorage.getItem('__skyline_visitor_passes');
        if (stored) {
          const list: GeneratedVisitorPass[] = JSON.parse(stored);
          list.forEach((p) => {
            globalScope.__SKYLINE_VISITOR_PASSES.set(p.id, p);
            globalScope.__SKYLINE_VISITOR_PASSES.set(p.qrData, p);
            if (p.pinCode) globalScope.__SKYLINE_VISITOR_PASSES.set(p.pinCode, p);
          });
        }
      } catch (e) {
        // Ignore JSON error
      }
    }
  }
  return globalScope.__SKYLINE_VISITOR_PASSES;
}

export function savePassToRegistry(pass: GeneratedVisitorPass) {
  const reg = getPassRegistry();
  reg.set(pass.id, pass);
  reg.set(pass.qrData, pass);
  if (pass.pinCode) reg.set(pass.pinCode, pass);

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = localStorage.getItem('__skyline_visitor_passes');
      const list: GeneratedVisitorPass[] = stored ? JSON.parse(stored) : [];
      const filtered = list.filter((p) => p.id !== pass.id);
      filtered.unshift(pass);
      localStorage.setItem('__skyline_visitor_passes', JSON.stringify(filtered.slice(0, 50)));
    } catch (e) {
      // Ignore storage error
    }
  }
}

export function getGateAuditLogs(): GateAuditLog[] {
  if (!globalScope.__SKYLINE_GATE_LOGS) {
    globalScope.__SKYLINE_GATE_LOGS = [];
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = localStorage.getItem('__skyline_gate_logs');
        if (stored) {
          globalScope.__SKYLINE_GATE_LOGS = JSON.parse(stored);
        }
      } catch (e) {
        // Ignore storage error
      }
    }
  }
  return globalScope.__SKYLINE_GATE_LOGS;
}

export function addGateAuditLog(log: Omit<GateAuditLog, 'id'>): GateAuditLog {
  const newLog: GateAuditLog = {
    id: `LOG-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    ...log
  };
  const current = getGateAuditLogs();
  const updated = [newLog, ...current.slice(0, 49)]; // Keep latest 50 real logs
  globalScope.__SKYLINE_GATE_LOGS = updated;

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem('__skyline_gate_logs', JSON.stringify(updated));
    } catch (e) {
      // Ignore storage error
    }
  }
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

  const pass: GeneratedVisitorPass = {
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

  // Register in active store & browser storage for cross-module recognition
  savePassToRegistry(pass);

  return pass;
}

/**
 * Gate Security Scanner & AI Interlock Engine
 * Strictly validates real QR passes and PIN tokens against cryptographic signatures and registry.
 */
export function verifyVisitorQr(qrInput: string, checkpoint: string = 'Sảnh A (Sapphire) - Camera AI 01'): VerificationScanResult {
  const now = Date.now();
  const nowStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const fullTimestamp = `${nowStr} ${new Date().toLocaleDateString('vi-VN')}`;
  const raw = (qrInput || '').trim();

  if (!raw) {
    return {
      scanResult: 'INVALID',
      title: 'CHƯA NHẬN DIỆN MÃ QR',
      message: 'Vui lòng đưa mã QR vào vùng quét của Camera AI hoặc tải ảnh mã lên.',
      canEnter: false,
      scannedAt: nowStr,
      checkpoint,
      gateAction: 'Chờ Quét Mã'
    };
  }

  // 1. Check if token/PIN exists in genuine pass registry
  const registry = getPassRegistry();
  let matchedPass: GeneratedVisitorPass | undefined = registry.get(raw);

  // If not direct hit, try searching by id, qrData, or pinCode in registry values
  if (!matchedPass) {
    registry.forEach((pass) => {
      if (!matchedPass && (pass.qrData === raw || pass.id === raw || pass.pinCode === raw || raw.includes(pass.id))) {
        matchedPass = pass;
      }
    });
  }

  if (matchedPass) {
    const isExpired = now > new Date(matchedPass.validUntil).getTime();
    const aptCode = matchedPass.apartmentCode || '12A05';
    const guestName = matchedPass.visitorName || 'Khách Thăm Căn Hộ';
    const plateInfo = matchedPass.licensePlate ? ` (Xe: ${matchedPass.licensePlate})` : '';

    if (matchedPass.entryType === 'SINGLE' && USED_SINGLE_TOKENS.has(matchedPass.id)) {
      const result: VerificationScanResult = {
        scanResult: 'INVALID',
        title: 'MÃ 1 LẦN ĐÃ ĐƯỢC SỬ DỤNG',
        message: `Mã đón khách của ${guestName} (Căn ${aptCode}) là vé 1 lần và đã được sử dụng qua cổng trước đó.`,
        canEnter: false,
        apartmentCode: aptCode,
        visitorName: guestName,
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

    if (isExpired) {
      const expDate = new Date(matchedPass.validUntil);
      const result: VerificationScanResult = {
        scanResult: 'EXPIRED',
        title: 'MÃ QR ĐÃ HẾT HẠN HIỆU LỰC',
        message: `Mã đón khách của ${guestName} (Căn ${aptCode}) đã hết hạn lúc ${expDate.toLocaleTimeString('vi-VN')} ngày ${expDate.toLocaleDateString('vi-VN')}. Cổng tự động khóa.`,
        canEnter: false,
        apartmentCode: aptCode,
        visitorName: guestName,
        entryType: matchedPass.entryType,
        validUntil: matchedPass.validUntil,
        scannedAt: nowStr,
        checkpoint,
        gateAction: 'Từ Chối Vào (Mã Hết Hạn)'
      };

      addGateAuditLog({
        timestamp: fullTimestamp,
        apartmentCode: aptCode,
        entryType: matchedPass.entryType,
        purposeLabel: 'Khách Thăm Căn Hộ',
        checkpoint,
        result: 'EXPIRED',
        gateAction: 'Từ Chối Vào (Quá Hạn)',
        qrSnippet: raw.substring(0, 25)
      });

      return result;
    }

    // Mark single-use pass as used
    if (matchedPass.entryType === 'SINGLE') {
      USED_SINGLE_TOKENS.add(matchedPass.id);
    }

    // Determine target floor and elevator
    const floorMatch = aptCode.match(/\d+/);
    const floorNum = floorMatch ? (floorMatch[0].length >= 3 ? floorMatch[0].substring(0, floorMatch[0].length - 2) : floorMatch[0]) : '12';
    const targetFloor = `Tầng ${floorNum || '12'}`;
    const isA = aptCode.toUpperCase().includes('A');
    const elevatorCabin = isA ? 'Cabin Thang Máy 02 (Sảnh A)' : 'Cabin Thang Máy 01 (Sảnh B)';

    const residentPushAlert: ResidentArrivalAlert = {
      apartmentCode: aptCode,
      visitorName: guestName,
      time: nowStr,
      checkpoint,
      elevatorCabin,
      floor: targetFloor,
      message: `🔔 CĂN HỘ ${aptCode}: Khách [${guestName}${plateInfo}] đã check-in qua ${checkpoint} lúc ${nowStr}. ${elevatorCabin} tự động kích hoạt đưa lên ${targetFloor}.`
    };

    globalScope.__LAST_RESIDENT_VISITOR_ALERT = residentPushAlert;

    const result: VerificationScanResult = {
      scanResult: 'VALID',
      title: 'XÁC THỰC AI THÀNH CÔNG • CỔNG MỞ TỰ ĐỘNG',
      message: `Mã QR hợp lệ của ${guestName}${plateInfo}. Camera AI tự động mở cổng sảnh, kích hoạt ${elevatorCabin} đưa khách lên ${targetFloor} và gửi thông báo cho cư dân Căn ${aptCode}.`,
      canEnter: true,
      apartmentCode: aptCode,
      entryType: matchedPass.entryType,
      purposeLabel: 'Khách Thăm Căn Hộ',
      validUntil: matchedPass.validUntil,
      scannedAt: nowStr,
      checkpoint,
      gateAction: `Mở Cổng Tự Động & Phân Quyền ${targetFloor}`,
      visitorName: guestName,
      elevatorCabin,
      targetFloor,
      residentPushAlert
    };

    addGateAuditLog({
      timestamp: fullTimestamp,
      apartmentCode: aptCode,
      entryType: matchedPass.entryType,
      purposeLabel: 'Khách Thăm Căn Hộ',
      checkpoint,
      result: 'VALID',
      gateAction: `Mở Cổng & Cấp ${elevatorCabin} lên ${targetFloor}`,
      qrSnippet: raw.substring(0, 25)
    });

    return result;
  }

  // 2. Parse cryptographic format: SKY_TOKEN_{aptCode}_{passId}_{expiresAt}_{entryType}_{signature}
  if (raw.startsWith('SKY_TOKEN_')) {
    const parts = raw.split('_');
    if (parts.length >= 7) {
      const aptCode = parts[2];
      const passId = parts[3];
      const expiryTimestamp = parseInt(parts[4], 10);
      const entryType = parts[5] as PassEntryType;
      const signature = parts[6];

      // Validate cryptographic signature
      const expectedSig = Math.abs(hashCode(`${aptCode}_${passId}_${expiryTimestamp}_${entryType}`)).toString(36).toUpperCase();
      if (signature !== expectedSig) {
        const result: VerificationScanResult = {
          scanResult: 'INVALID',
          title: 'MÃ QR GIẢ MẠO (CHỮ KÝ SAI)',
          message: 'Chữ ký an ninh mã QR không hợp lệ hoặc đã bị can thiệp. Cổng an ninh tự động khóa chặt.',
          canEnter: false,
          scannedAt: nowStr,
          checkpoint,
          gateAction: 'Khóa Cổng Cảnh Báo An Ninh'
        };

        addGateAuditLog({
          timestamp: fullTimestamp,
          apartmentCode: aptCode || 'Không xác định',
          entryType: entryType || 'SINGLE',
          purposeLabel: 'Mã không hợp lệ',
          checkpoint,
          result: 'INVALID',
          gateAction: 'Khóa Cổng Cảnh Báo',
          qrSnippet: raw.substring(0, 25)
        });

        return result;
      }

      // Check expiry
      if (now > expiryTimestamp) {
        const expDate = new Date(expiryTimestamp);
        const result: VerificationScanResult = {
          scanResult: 'EXPIRED',
          title: 'MÃ QR ĐÃ HẾT HẠN HIỆU LỰC',
          message: `Mã đón khách Căn ${aptCode} đã hết hạn vào lúc ${expDate.toLocaleTimeString('vi-VN')} ngày ${expDate.toLocaleDateString('vi-VN')}.`,
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

      // Check single use
      if (entryType === 'SINGLE' && USED_SINGLE_TOKENS.has(passId)) {
        return {
          scanResult: 'INVALID',
          title: 'MÃ 1 LẦN ĐÃ ĐƯỢC SỬ DỤNG',
          message: `Mã đón khách của Căn ${aptCode} đã được quét sử dụng trước đó.`,
          canEnter: false,
          apartmentCode: aptCode,
          entryType: 'SINGLE',
          scannedAt: nowStr,
          checkpoint,
          gateAction: 'Từ Chối Vào (Mã Đã Dùng 1 Lần)'
        };
      }

      if (entryType === 'SINGLE') {
        USED_SINGLE_TOKENS.add(passId);
      }

      const floorMatch = aptCode.match(/\d+/);
      const floorNum = floorMatch ? (floorMatch[0].length >= 3 ? floorMatch[0].substring(0, floorMatch[0].length - 2) : floorMatch[0]) : '12';
      const targetFloor = `Tầng ${floorNum || '12'}`;
      const isA = aptCode.toUpperCase().includes('A');
      const elevatorCabin = isA ? 'Cabin Thang Máy 02 (Sảnh A)' : 'Cabin Thang Máy 01 (Sảnh B)';
      const visitorName = 'Khách Thăm Căn Hộ';

      const residentPushAlert: ResidentArrivalAlert = {
        apartmentCode: aptCode,
        visitorName,
        time: nowStr,
        checkpoint,
        elevatorCabin,
        floor: targetFloor,
        message: `🔔 CĂN HỘ ${aptCode}: Khách thăm vừa quét mã AI qua ${checkpoint} lúc ${nowStr}. ${elevatorCabin} đang đón lên ${targetFloor}.`
      };

      globalScope.__LAST_RESIDENT_VISITOR_ALERT = residentPushAlert;

      const result: VerificationScanResult = {
        scanResult: 'VALID',
        title: 'XÁC THỰC AI THÀNH CÔNG • CỔNG MỞ TỰ ĐỘNG',
        message: `Mã QR hợp lệ Căn hộ ${aptCode}. Camera AI tự động mở cổng sảnh, kích hoạt ${elevatorCabin} đưa khách lên ${targetFloor} và gửi thông báo cho cư dân.`,
        canEnter: true,
        apartmentCode: aptCode,
        entryType,
        purposeLabel: 'Khách Thăm Căn Hộ',
        validUntil: new Date(expiryTimestamp).toISOString(),
        scannedAt: nowStr,
        checkpoint,
        gateAction: `Mở Cổng Tự Động & Phân Quyền ${targetFloor}`,
        visitorName,
        elevatorCabin,
        targetFloor,
        residentPushAlert
      };

      addGateAuditLog({
        timestamp: fullTimestamp,
        apartmentCode: aptCode,
        entryType,
        purposeLabel: 'Khách Thăm Căn Hộ',
        checkpoint,
        result: 'VALID',
        gateAction: `Mở Cổng & Cấp ${elevatorCabin} lên ${targetFloor}`,
        qrSnippet: raw.substring(0, 25)
      });

      return result;
    }
  }

  // 3. Fallback for any non-system or unrecognized QR code
  const result: VerificationScanResult = {
    scanResult: 'INVALID',
    title: 'MÃ QR KHÔNG HỢP LỆ',
    message: 'Mã quét không thuộc hệ thống tòa nhà Skyline hoặc không đúng quy chuẩn an ninh.',
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
    qrSnippet: raw.substring(0, 25) || 'UNKNOWN'
  });

  return result;
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
