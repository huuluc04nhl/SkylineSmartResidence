/**
 * Store quản lý Tiện Ích Chung Cư Skyline (Skyline Smart Facility Store)
 * Lưu trữ thực tế không dữ liệu ảo: Check-in bằng Thẻ/FaceID & Lịch sử Đặt chỗ tiện ích
 */

export interface FacilityCheckinLog {
  id: string;
  facilityId: string;
  facilityName: string;
  userName: string;
  role: string;
  method: 'NFC_CARD' | 'FACE_ID';
  cardUid?: string;
  status: 'SUCCESS' | 'DENIED';
  timestamp: string;
  detail: string;
}

export interface FacilityBooking {
  id: string;
  aptCode: string;
  facilityId: string;
  facilityName: string;
  bookingDate: string; // YYYY-MM-DD
  timeSlot: string;
  bookerName: string;
  guestCount?: number;
  notes?: string;
  ticketCode: string;
  pricing: string;
  status: 'CONFIRMED' | 'CHECKED_IN' | 'CANCELLED';
  createdAt: string;
}

export interface CardState {
  cardUid: string;
  holderName: string;
  role: string;
  isOwner: boolean;
  status: 'ACTIVE' | 'LOCKED';
  lastUsed?: string;
}

const FACILITY_LOGS_PREFIX = 'skyline_facility_logs_';
const FACILITY_BOOKINGS_PREFIX = 'skyline_facility_bookings_';
const CARDS_PREFIX = 'skyline_resident_cards_';

function getStorageItem<T>(key: string, defaultVal: T): T {
  if (typeof window === 'undefined') return defaultVal;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultVal;
    return JSON.parse(raw);
  } catch {
    return defaultVal;
  }
}

function setStorageItem<T>(key: string, val: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (err) {
    console.error('Failed to set facility storage:', err);
  }
}

/**
 * Lấy lịch sử check-in tiện ích của căn hộ (Mặc định sạch, không dữ liệu ảo)
 */
export function getFacilityCheckinLogs(aptCode: string): FacilityCheckinLog[] {
  return getStorageItem<FacilityCheckinLog[]>(`${FACILITY_LOGS_PREFIX}${aptCode}`, []);
}

/**
 * Ghi nhận lượt check-in thực tế khi cư dân quẹt thẻ / FaceID tại cổng tiện ích
 */
export function addFacilityCheckinLog(
  aptCode: string,
  logData: Omit<FacilityCheckinLog, 'id' | 'timestamp'>
): FacilityCheckinLog[] {
  const current = getFacilityCheckinLogs(aptCode);
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} ${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

  const newLog: FacilityCheckinLog = {
    ...logData,
    id: `fac_log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: timeStr
  };

  const updated = [newLog, ...current].slice(0, 50); // Giữ 50 log gần nhất
  setStorageItem(`${FACILITY_LOGS_PREFIX}${aptCode}`, updated);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('skyline_facility_log_added', { detail: newLog }));
  }

  return updated;
}

/**
 * Lấy danh sách đặt chỗ tiện ích của căn hộ
 */
export function getFacilityBookings(aptCode: string): FacilityBooking[] {
  return getStorageItem<FacilityBooking[]>(`${FACILITY_BOOKINGS_PREFIX}${aptCode}`, []);
}

/**
 * Tạo mới đặt chỗ tiện ích thực tế
 */
export function createFacilityBooking(
  aptCode: string,
  facilityId: string,
  facilityName: string,
  bookingDate: string,
  timeSlot: string,
  bookerName: string,
  pricing: string,
  guestCount: number = 2,
  notes: string = ''
): { bookings: FacilityBooking[]; newBooking: FacilityBooking } {
  const current = getFacilityBookings(aptCode);
  const ticketNum = Math.floor(1000 + Math.random() * 9000);
  const newBooking: FacilityBooking = {
    id: `BK-${Date.now().toString().slice(-6)}`,
    aptCode,
    facilityId,
    facilityName,
    bookingDate,
    timeSlot,
    bookerName,
    guestCount,
    notes,
    pricing,
    ticketCode: `SKY-PASS-${aptCode}-${ticketNum}`,
    status: 'CONFIRMED',
    createdAt: new Date().toISOString()
  };

  const updated = [newBooking, ...current];
  setStorageItem(`${FACILITY_BOOKINGS_PREFIX}${aptCode}`, updated);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('skyline_facility_booked', { detail: newBooking }));
  }

  return { bookings: updated, newBooking };
}

/**
 * Quẹt vé điện tử QR để check-in tại cổng tiện ích
 */
export function checkinWithTicket(aptCode: string, ticketCode: string): { success: boolean; message: string; booking?: FacilityBooking } {
  const current = getFacilityBookings(aptCode);
  const booking = current.find(b => b.ticketCode === ticketCode);

  if (!booking) {
    return { success: false, message: 'Mã vé không tồn tại trên hệ thống.' };
  }
  if (booking.status === 'CANCELLED') {
    return { success: false, message: 'Vé này đã bị hủy trước đó.' };
  }
  if (booking.status === 'CHECKED_IN') {
    return { success: true, message: 'Vé đã được check-in trước đó. Cổng barrier mở tự động.', booking };
  }

  const updated = current.map(b => b.ticketCode === ticketCode ? { ...b, status: 'CHECKED_IN' as const } : b);
  setStorageItem(`${FACILITY_BOOKINGS_PREFIX}${aptCode}`, updated);

  // Ghi log check-in
  addFacilityCheckinLog(aptCode, {
    facilityId: booking.facilityId,
    facilityName: booking.facilityName,
    userName: booking.bookerName,
    role: 'Cư Dân',
    method: 'NFC_CARD',
    cardUid: ticketCode,
    status: 'SUCCESS',
    detail: `Check-in bằng Mã Vé Điện Tử QR (${ticketCode}) tại cổng ${booking.facilityName} • Cổng mở 0.3s`
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('skyline_facility_booked', { detail: { ticketCode, status: 'CHECKED_IN' } }));
  }

  return { success: true, message: `Check-in vé thành công! Xin chào ${booking.bookerName}. Chúc bạn có thời gian vui vẻ tại ${booking.facilityName}.`, booking: { ...booking, status: 'CHECKED_IN' } };
}

/**
 * Hủy đặt chỗ tiện ích
 */
export function cancelFacilityBooking(aptCode: string, bookingId: string): FacilityBooking[] {
  const current = getFacilityBookings(aptCode);
  const updated = current.map(b => b.id === bookingId ? { ...b, status: 'CANCELLED' as const } : b);
  setStorageItem(`${FACILITY_BOOKINGS_PREFIX}${aptCode}`, updated);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('skyline_facility_booked', { detail: { id: bookingId, status: 'CANCELLED' } }));
  }

  return updated;
}

/**
 * Tính hạn mức quota thực tế trong tháng hiện tại của căn hộ
 */
export function getFacilityMonthlyQuota(aptCode: string, maxQuota: number = 20): { used: number; remaining: number; max: number } {
  const bookings = getFacilityBookings(aptCode);
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const activeInMonth = bookings.filter(b => {
    if (b.status === 'CANCELLED') return false;
    const d = new Date(b.bookingDate);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const used = activeInMonth.length;
  const remaining = Math.max(0, maxQuota - used);
  return { used, remaining, max: maxQuota };
}

/**
 * Quản lý danh sách Thẻ Cư Dân NFC vật lý theo căn hộ (Lưu trữ thực tế, có thể Khóa/Mở thẻ)
 */
export function getResidentCards(aptCode: string, defaultCards: CardState[]): CardState[] {
  const saved = getStorageItem<CardState[] | null>(`${CARDS_PREFIX}${aptCode}`, null);
  if (!saved || saved.length === 0) {
    setStorageItem(`${CARDS_PREFIX}${aptCode}`, defaultCards);
    return defaultCards;
  }
  return saved;
}

/**
 * Chuyển trạng thái Thẻ (Đang hoạt động <-> Khóa thẻ khi mất)
 */
export function toggleCardStatus(aptCode: string, cardUid: string): CardState[] {
  const current = getStorageItem<CardState[]>(`${CARDS_PREFIX}${aptCode}`, []);
  const updated = current.map(c => {
    if (c.cardUid === cardUid) {
      return {
        ...c,
        status: (c.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE') as 'ACTIVE' | 'LOCKED'
      };
    }
    return c;
  });
  setStorageItem(`${CARDS_PREFIX}${aptCode}`, updated);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('skyline_cards_updated', { detail: updated }));
  }
  return updated;
}

/**
 * Cập nhật thời gian sử dụng gần nhất của thẻ
 */
export function markCardUsed(aptCode: string, cardUid: string): CardState[] {
  const current = getStorageItem<CardState[]>(`${CARDS_PREFIX}${aptCode}`, []);
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} ${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}`;
  const updated = current.map(c => c.cardUid === cardUid ? { ...c, lastUsed: timeStr } : c);
  setStorageItem(`${CARDS_PREFIX}${aptCode}`, updated);
  return updated;
}
