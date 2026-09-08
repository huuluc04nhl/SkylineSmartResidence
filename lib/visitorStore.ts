/**
 * Visitor QR Management System - Skyline Smart Residence
 * 
 * Flow:
 * - Resident creates visitor pass with Host details (Apartment, Host Name, Host Phone)
 *   and Visitor details (Visitor Name, Phone, Vehicle/License Plate, Validity window).
 * - BQL/Receptionist scans the QR code or looks up by PIN/Pass ID.
 * - System displays:
 *   1. Basic information of Apartment Owner (Chủ hộ): Name, Phone, Apartment, Tower.
 *   2. Basic information of Visitor (Khách thăm): Name, Phone, License Plate, Valid Period, Status.
 * - Receptionist can confirm Check-in and Check-out.
 * - Cleaned: No AI voice synthesis, no elevator destination locking.
 */

export type PassEntryType = 'SINGLE' | 'MULTI';
export type VisitorPassStatus = 'ACTIVE' | 'CHECKED_IN' | 'COMPLETED' | 'EXPIRED';

export interface GeneratedVisitorPass {
  id: string;
  apartmentCode: string;
  // Host Info
  hostName: string;
  hostPhone: string;
  towerName?: string;
  // Guest Info
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
  status: VisitorPassStatus;
  checkedInAt?: string;
  checkedOutAt?: string;
}

export interface VerificationScanResult {
  scanResult: 'VALID' | 'INVALID' | 'EXPIRED';
  title: string;
  message: string;
  canEnter: boolean;
  scannedAt: string;
  checkpoint?: string;
  // Chủ Hộ Info
  host?: {
    apartmentCode: string;
    hostName: string;
    hostPhone: string;
    towerName: string;
  };
  // Khách Thăm Info
  visitor?: {
    passId: string;
    visitorName: string;
    phoneNumber?: string;
    licensePlate?: string;
    validHours: number;
    createdAt: string;
    validUntil: string;
    status: VisitorPassStatus;
    checkedInAt?: string;
    checkedOutAt?: string;
    pinCode: string;
  };
}

export interface GateAuditLog {
  id: string;
  timestamp: string;
  apartmentCode: string;
  hostName?: string;
  visitorName?: string;
  licensePlate?: string;
  action: 'SCAN' | 'CHECK_IN' | 'CHECK_OUT';
  result: 'VALID' | 'INVALID' | 'EXPIRED';
  note: string;
}

// In-memory global store
declare global {
  var __SKYLINE_VISITOR_PASSES_MAP: Map<string, GeneratedVisitorPass> | undefined;
  var __SKYLINE_VISITOR_LOGS: GateAuditLog[] | undefined;
}

const globalScope = (typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : {}) as any;

export function getPassRegistry(): Map<string, GeneratedVisitorPass> {
  if (!globalScope.__SKYLINE_VISITOR_PASSES_MAP) {
    globalScope.__SKYLINE_VISITOR_PASSES_MAP = new Map<string, GeneratedVisitorPass>();
    // Hydrate from localStorage if in browser
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = localStorage.getItem('__skyline_visitor_passes');
        if (stored) {
          const list: GeneratedVisitorPass[] = JSON.parse(stored);
          list.forEach((p) => {
            globalScope.__SKYLINE_VISITOR_PASSES_MAP!.set(p.id, p);
            globalScope.__SKYLINE_VISITOR_PASSES_MAP!.set(p.qrData, p);
            if (p.pinCode) globalScope.__SKYLINE_VISITOR_PASSES_MAP!.set(p.pinCode, p);
          });
        }
      } catch (e) {
        // Ignore storage error
      }
    }
  }
  return globalScope.__SKYLINE_VISITOR_PASSES_MAP!;
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
      localStorage.setItem('__skyline_visitor_passes', JSON.stringify(filtered.slice(0, 100)));
    } catch (e) {
      // Ignore storage error
    }
  }
}

export function getAllVisitorPasses(): GeneratedVisitorPass[] {
  const reg = getPassRegistry();
  const seenIds = new Set<string>();
  const passes: GeneratedVisitorPass[] = [];

  reg.forEach((pass) => {
    if (!seenIds.has(pass.id)) {
      seenIds.add(pass.id);
      // Auto update status if expired
      const now = Date.now();
      const isExpired = now > new Date(pass.validUntil).getTime();
      if (isExpired && pass.status === 'ACTIVE') {
        pass.status = 'EXPIRED';
      }
      passes.push(pass);
    }
  });

  return passes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getGateAuditLogs(): GateAuditLog[] {
  if (!globalScope.__SKYLINE_VISITOR_LOGS) {
    globalScope.__SKYLINE_VISITOR_LOGS = [];
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = localStorage.getItem('__skyline_visitor_logs');
        if (stored) {
          globalScope.__SKYLINE_VISITOR_LOGS = JSON.parse(stored);
        }
      } catch (e) {
        // Ignore storage error
      }
    }
  }
  return globalScope.__SKYLINE_VISITOR_LOGS!;
}

export function addGateAuditLog(log: Omit<GateAuditLog, 'id'>): GateAuditLog {
  const newLog: GateAuditLog = {
    id: `LOG-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    ...log
  };
  const current = getGateAuditLogs();
  const updated = [newLog, ...current.slice(0, 99)];
  globalScope.__SKYLINE_VISITOR_LOGS = updated;

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem('__skyline_visitor_logs', JSON.stringify(updated));
    } catch (e) {
      // Ignore storage error
    }
  }
  return newLog;
}

/**
 * Generate an ephemeral, time-bounded secure QR pass for apartment guest
 */
export function generateVisitorPassToken(params: {
  apartmentCode: string;
  hostName?: string;
  hostPhone?: string;
  visitorName?: string;
  phoneNumber?: string;
  licensePlate?: string;
  entryType?: PassEntryType;
  validHours?: number;
  note?: string;
}): GeneratedVisitorPass {
  const aptCode = params.apartmentCode || '12A05';
  const hostName = params.hostName?.trim() || `Chủ hộ Căn ${aptCode}`;
  const hostPhone = params.hostPhone?.trim() || '';
  const towerName = aptCode.includes('A') ? 'Tòa A (Sapphire)' : 'Tòa B (Diamond)';

  const visitorName = params.visitorName?.trim() || 'Khách Thăm Nhà';
  const phone = params.phoneNumber?.trim() || '';
  const plate = params.licensePlate?.trim().toUpperCase() || '';
  const hours = params.validHours || 4;
  const now = Date.now();
  const expiresAt = now + hours * 3600 * 1000;
  
  const randomPin = Math.floor(100000 + Math.random() * 900000).toString();
  const passId = `SKY-PASS-${Math.floor(1000 + Math.random() * 9000)}`;
  const resolvedEntryType: PassEntryType = params.entryType || 'MULTI';

  const signature = Math.abs(hashCode(`${aptCode}_${passId}_${expiresAt}_${resolvedEntryType}`)).toString(36).toUpperCase();
  
  // Compact JSON Payload in QR Code
  const qrPayload = {
    skyline_pass: true,
    passId,
    aptCode,
    tower: towerName,
    hostName,
    hostPhone,
    visitorName,
    phone,
    plate,
    expiresAt,
    pin: randomPin,
    sig: signature
  };
  const qrData = JSON.stringify(qrPayload);

  const pass: GeneratedVisitorPass = {
    id: passId,
    apartmentCode: aptCode,
    hostName,
    hostPhone,
    towerName,
    visitorName,
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
    status: 'ACTIVE',
  };

  savePassToRegistry(pass);

  addGateAuditLog({
    timestamp: `${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ${new Date().toLocaleDateString('vi-VN')}`,
    apartmentCode: aptCode,
    hostName,
    visitorName,
    licensePlate: plate,
    action: 'SCAN',
    result: 'VALID',
    note: `Chủ hộ tạo mã đón khách [${visitorName}] hiệu lực ${hours} giờ.`
  });

  return pass;
}

/**
 * Verify a presented QR code string, JSON string, PIN or passId
 */
export function verifyVisitorQr(qrInput: string, checkpoint: string = 'Sảnh Lễ Tân / Chốt An Ninh'): VerificationScanResult {
  const now = Date.now();
  const nowStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const fullTimestamp = `${nowStr} ${new Date().toLocaleDateString('vi-VN')}`;
  const raw = (qrInput || '').trim();

  if (!raw) {
    return {
      scanResult: 'INVALID',
      title: 'CHƯA NHẬN DIỆN ĐƯỢC MÃ QR',
      message: 'Vui lòng đưa mã QR vào vùng quét của camera hoặc tải ảnh mã lên.',
      canEnter: false,
      scannedAt: nowStr,
      checkpoint,
    };
  }

  // 1. Try parsing if raw is JSON string
  let parsedFromJson: any = null;
  if (raw.startsWith('{') && raw.endsWith('}')) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed.skyline_pass || parsed.passId) {
        parsedFromJson = parsed;
      }
    } catch (e) {
      // Not JSON
    }
  }

  const registry = getPassRegistry();
  let matchedPass: GeneratedVisitorPass | undefined = undefined;

  // Search by JSON passId, or exact match in registry
  if (parsedFromJson?.passId) {
    matchedPass = registry.get(parsedFromJson.passId);
  }

  if (!matchedPass) {
    matchedPass = registry.get(raw);
  }

  // Search by loop
  if (!matchedPass) {
    registry.forEach((pass) => {
      if (!matchedPass) {
        if (pass.qrData === raw || pass.id === raw || pass.pinCode === raw || raw.includes(pass.id) || (pass.pinCode && raw.includes(pass.pinCode))) {
          matchedPass = pass;
        }
      }
    });
  }

  // If found in active registry
  if (matchedPass) {
    const isExpired = now > new Date(matchedPass.validUntil).getTime();
    if (isExpired && matchedPass.status === 'ACTIVE') {
      matchedPass.status = 'EXPIRED';
      savePassToRegistry(matchedPass);
    }

    const towerName = matchedPass.towerName || (matchedPass.apartmentCode.includes('A') ? 'Tòa A (Sapphire)' : 'Tòa B (Diamond)');

    if (matchedPass.status === 'EXPIRED' || isExpired) {
      const expDate = new Date(matchedPass.validUntil);
      const result: VerificationScanResult = {
        scanResult: 'EXPIRED',
        title: 'MÃ ĐÓN KHÁCH ĐÃ HẾT HẠN',
        message: `Mã QR đón khách [${matchedPass.visitorName}] của Căn hộ ${matchedPass.apartmentCode} đã hết hạn lúc ${expDate.toLocaleTimeString('vi-VN')} ngày ${expDate.toLocaleDateString('vi-VN')}.`,
        canEnter: false,
        scannedAt: nowStr,
        checkpoint,
        host: {
          apartmentCode: matchedPass.apartmentCode,
          hostName: matchedPass.hostName || 'Chủ hộ Căn ' + matchedPass.apartmentCode,
          hostPhone: matchedPass.hostPhone || 'Chưa cập nhật',
          towerName,
        },
        visitor: {
          passId: matchedPass.id,
          visitorName: matchedPass.visitorName,
          phoneNumber: matchedPass.phoneNumber,
          licensePlate: matchedPass.licensePlate,
          validHours: matchedPass.validHours,
          createdAt: matchedPass.createdAt,
          validUntil: matchedPass.validUntil,
          status: 'EXPIRED',
          checkedInAt: matchedPass.checkedInAt,
          checkedOutAt: matchedPass.checkedOutAt,
          pinCode: matchedPass.pinCode,
        }
      };

      addGateAuditLog({
        timestamp: fullTimestamp,
        apartmentCode: matchedPass.apartmentCode,
        hostName: matchedPass.hostName,
        visitorName: matchedPass.visitorName,
        licensePlate: matchedPass.licensePlate,
        action: 'SCAN',
        result: 'EXPIRED',
        note: `Quét mã quá hạn của khách [${matchedPass.visitorName}].`
      });

      return result;
    }

    // Valid pass!
    const result: VerificationScanResult = {
      scanResult: 'VALID',
      title: matchedPass.status === 'CHECKED_IN' ? 'KHÁCH ĐÃ CHECK-IN (ĐANG Ở TRONG TÒA NHÀ)' : 'XÁC THỰC MÃ HỢP LỆ • ĐỦ ĐIỀU KIỆN VÀO',
      message: `Mã QR hợp lệ do Chủ hộ [${matchedPass.hostName}] (Căn ${matchedPass.apartmentCode}) cấp cho Khách [${matchedPass.visitorName}].`,
      canEnter: true,
      scannedAt: nowStr,
      checkpoint,
      host: {
        apartmentCode: matchedPass.apartmentCode,
        hostName: matchedPass.hostName || 'Chủ hộ Căn ' + matchedPass.apartmentCode,
        hostPhone: matchedPass.hostPhone || 'Chưa cập nhật',
        towerName,
      },
      visitor: {
        passId: matchedPass.id,
        visitorName: matchedPass.visitorName,
        phoneNumber: matchedPass.phoneNumber,
        licensePlate: matchedPass.licensePlate,
        validHours: matchedPass.validHours,
        createdAt: matchedPass.createdAt,
        validUntil: matchedPass.validUntil,
        status: matchedPass.status,
        checkedInAt: matchedPass.checkedInAt,
        checkedOutAt: matchedPass.checkedOutAt,
        pinCode: matchedPass.pinCode,
      }
    };

    addGateAuditLog({
      timestamp: fullTimestamp,
      apartmentCode: matchedPass.apartmentCode,
      hostName: matchedPass.hostName,
      visitorName: matchedPass.visitorName,
      licensePlate: matchedPass.licensePlate,
      action: 'SCAN',
      result: 'VALID',
      note: `Xác thực thông tin khách [${matchedPass.visitorName}] đến Căn ${matchedPass.apartmentCode}.`
    });

    return result;
  }

  // 2. If pass came from parsed JSON but was created on another client/session
  if (parsedFromJson && parsedFromJson.skyline_pass) {
    const isExpired = now > parsedFromJson.expiresAt;
    const aptCode = parsedFromJson.aptCode || '12A05';
    const towerName = parsedFromJson.tower || (aptCode.includes('A') ? 'Tòa A (Sapphire)' : 'Tòa B (Diamond)');

    // Reconstruct pass and add to registry
    const reconstructedPass: GeneratedVisitorPass = {
      id: parsedFromJson.passId || `SKY-PASS-${Math.floor(1000 + Math.random() * 9000)}`,
      apartmentCode: aptCode,
      hostName: parsedFromJson.hostName || `Chủ hộ Căn ${aptCode}`,
      hostPhone: parsedFromJson.hostPhone || '',
      towerName,
      visitorName: parsedFromJson.visitorName || 'Khách Thăm Nhà',
      phoneNumber: parsedFromJson.phone || '',
      licensePlate: parsedFromJson.plate || '',
      entryType: 'MULTI',
      purpose: 'VISITOR',
      purposeLabel: 'Khách Thăm Căn Hộ',
      validHours: 4,
      createdAt: new Date(now).toISOString(),
      validUntil: new Date(parsedFromJson.expiresAt).toISOString(),
      qrData: raw,
      pinCode: parsedFromJson.pin || '123456',
      status: isExpired ? 'EXPIRED' : 'ACTIVE',
    };
    savePassToRegistry(reconstructedPass);

    return verifyVisitorQr(reconstructedPass.id, checkpoint);
  }

  // 3. Fallback: Not recognized
  const result: VerificationScanResult = {
    scanResult: 'INVALID',
    title: 'MÃ QR KHÔNG TỒN TẠI HOẶC KHÔNG HỢP LỆ',
    message: 'Mã quét không thuộc hệ thống Skyline Smart Residence hoặc đã bị chỉnh sửa sai lệch.',
    canEnter: false,
    scannedAt: nowStr,
    checkpoint,
  };

  addGateAuditLog({
    timestamp: fullTimestamp,
    apartmentCode: 'Chưa xác định',
    action: 'SCAN',
    result: 'INVALID',
    note: `Quét mã không hợp lệ: ${raw.substring(0, 30)}...`
  });

  return result;
}

/**
 * Receptionist / Security confirms visitor check-in
 */
export function checkInVisitorPass(passId: string): GeneratedVisitorPass | null {
  const reg = getPassRegistry();
  let target: GeneratedVisitorPass | undefined = reg.get(passId);

  if (!target) {
    reg.forEach((p) => {
      if (p.id === passId) target = p;
    });
  }

  if (!target) return null;

  const nowStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const fullTimestamp = `${nowStr} ${new Date().toLocaleDateString('vi-VN')}`;

  target.status = 'CHECKED_IN';
  target.checkedInAt = fullTimestamp;
  savePassToRegistry(target);

  addGateAuditLog({
    timestamp: fullTimestamp,
    apartmentCode: target.apartmentCode,
    hostName: target.hostName,
    visitorName: target.visitorName,
    licensePlate: target.licensePlate,
    action: 'CHECK_IN',
    result: 'VALID',
    note: `Lễ tân xác nhận khách [${target.visitorName}] đã vào chung cư lên Căn ${target.apartmentCode}.`
  });

  return target;
}

/**
 * Receptionist / Security confirms visitor check-out
 */
export function checkOutVisitorPass(passId: string): GeneratedVisitorPass | null {
  const reg = getPassRegistry();
  let target: GeneratedVisitorPass | undefined = reg.get(passId);

  if (!target) {
    reg.forEach((p) => {
      if (p.id === passId) target = p;
    });
  }

  if (!target) return null;

  const nowStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const fullTimestamp = `${nowStr} ${new Date().toLocaleDateString('vi-VN')}`;

  target.status = 'COMPLETED';
  target.checkedOutAt = fullTimestamp;
  savePassToRegistry(target);

  addGateAuditLog({
    timestamp: fullTimestamp,
    apartmentCode: target.apartmentCode,
    hostName: target.hostName,
    visitorName: target.visitorName,
    licensePlate: target.licensePlate,
    action: 'CHECK_OUT',
    result: 'VALID',
    note: `Lễ tân ghi nhận khách [${target.visitorName}] rời chung cư.`
  });

  return target;
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
