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
  durationHours?: number; // Số tiếng đặt (1, 2, 3 tiếng...)
  depositAmount?: number; // Số tiền giữ chỗ (150.000 đ, 300.000 đ...)
  isPrivate?: boolean; // Phòng riêng tư
  paymentMethod?: string;
  refundRate?: number; // 100, 50, 0
  refundAmount?: number; // Số tiền hoàn thực tế
  refundNote?: string;
  cancelledAt?: string;
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

const DEFAULT_DEMO_BOOKINGS: Record<string, FacilityBooking[]> = {
  '12A05': [
    {
      id: 'BK-SAUNA-9821',
      aptCode: '12A05',
      facilityId: 'fac-sauna',
      facilityName: 'Phòng Xông Hơi Đá Muối Himalaya (Private VIP)',
      bookingDate: new Date(Date.now() + 3600000 * 4).toISOString().split('T')[0],
      timeSlot: '18:00 - 20:00 (2 Tiếng - Tối nay)',
      bookerName: 'Nguyễn Hữu Lực',
      guestCount: 2,
      durationHours: 2,
      depositAmount: 300000,
      pricing: '150.000 đ / giờ',
      isPrivate: true,
      paymentMethod: 'Trừ vào hóa đơn sinh hoạt tháng tới',
      notes: 'Gia đình 2 người, chuẩn bị trước tinh dầu sả chanh',
      ticketCode: 'SKY-SAUNA-12A05-7799',
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
    },
  ],
};

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
 * Lấy danh sách đặt chỗ tiện ích của căn hộ (kèm dữ liệu mẫu riêng tư nếu chưa có)
 */
export function getFacilityBookings(aptCode: string): FacilityBooking[] {
  const stored = getStorageItem<FacilityBooking[] | null>(`${FACILITY_BOOKINGS_PREFIX}${aptCode}`, null);
  if (stored && Array.isArray(stored)) return stored;
  const initial = DEFAULT_DEMO_BOOKINGS[aptCode] || [];
  setStorageItem(`${FACILITY_BOOKINGS_PREFIX}${aptCode}`, initial);
  return initial;
}

/**
 * Tính toán tỷ lệ hoàn tiền và số tiền ước tính theo quy chế minh bạch
 * - Hủy trước giờ hẹn (>= 30 phút): Hoàn trả 100%
 * - Hủy cận giờ (< 30 phút trước giờ hẹn): Hoàn trả 50% (bù đắp chi phí bật lò xông đá muối & tinh dầu thảo mộc)
 * - Quá giờ hẹn: Không hoàn trả (0%) do phòng riêng tư đã được giữ suốt khung giờ
 */
export function calculateRefundEstimate(booking: FacilityBooking): {
  refundRate: number;
  refundAmount: number;
  diffMinutes: number;
  policyTier: 'FULL_100' | 'PARTIAL_50' | 'NO_REFUND_0';
  title: string;
  reason: string;
} {
  const deposit = booking.depositAmount || (booking.pricing.includes('200.000') ? 200000 : booking.pricing.includes('150.000') ? 150000 : 0);

  // Phân tích thời gian bắt đầu
  let startTime = new Date();
  try {
    const timeMatch = booking.timeSlot.match(/(\d{1,2}):(\d{2})/);
    if (timeMatch && booking.bookingDate) {
      const [_, h, m] = timeMatch;
      startTime = new Date(`${booking.bookingDate}T${h.padStart(2, '0')}:${m}:00`);
    }
  } catch {
    startTime = new Date(Date.now() + 3600000);
  }

  const now = new Date();
  const diffMinutes = Math.round((startTime.getTime() - now.getTime()) / (1000 * 60));

  if (diffMinutes >= 30) {
    return {
      refundRate: 100,
      refundAmount: deposit,
      diffMinutes,
      policyTier: 'FULL_100',
      title: 'Hoàn Tiền 100% (Hủy Trước Giờ Hẹn > 30 Phút)',
      reason: 'Quý cư dân báo hủy sớm trước giờ hẹn ít nhất 30 phút, hệ thống tự động hoàn lại 100% số tiền đã đặt giữ chỗ vào hóa đơn sinh hoạt tháng tới.',
    };
  }

  if (diffMinutes >= 0 && diffMinutes < 30) {
    const halfAmount = Math.round(deposit * 0.5);
    return {
      refundRate: 50,
      refundAmount: halfAmount,
      diffMinutes,
      policyTier: 'PARTIAL_50',
      title: 'Hỗ Trợ Hoàn Tiền 50% (Hủy Sát Giờ Hẹn < 30 Phút)',
      reason: 'Quý cư dân yêu cầu hủy trong vòng nửa giờ sát giờ hẹn. Ban Quản Lý hỗ trợ hoàn lại 50% số tiền giữ chỗ; 50% còn lại dùng để bù đắp chi phí gia nhiệt lò đá muối & tinh dầu đã chuẩn bị sẵn.',
    };
  }

  return {
    refundRate: 0,
    refundAmount: 0,
    diffMinutes,
    policyTier: 'NO_REFUND_0',
    title: 'Không Hoàn Trả (Đã Quá Khung Giờ Đặt Chỗ)',
    reason: 'Khung giờ phòng riêng tư đã bắt đầu hoặc kết thúc, hệ thống đã khóa phòng riêng phục vụ căn hộ của Quý cư dân nên không thể áp dụng hoàn trả.',
  };
}

/**
 * Tạo mới đặt chỗ tiện ích thực tế (hỗ trợ phòng riêng tư và tính số giờ)
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
  notes: string = '',
  durationHours: number = 1,
  depositAmount: number = 0,
  isPrivate: boolean = false,
  paymentMethod: string = 'Trừ vào hóa đơn sinh hoạt tháng tới'
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
    durationHours,
    depositAmount,
    isPrivate,
    paymentMethod,
    ticketCode: `SKY-PASS-${aptCode}-${ticketNum}`,
    status: 'CONFIRMED',
    createdAt: new Date().toISOString(),
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
 * Hủy đặt chỗ tiện ích & Thực hiện chính sách hoàn tiền tự động khi bận đột xuất
 */
export function cancelFacilityBookingWithRefund(
  aptCode: string,
  bookingId: string,
  reason = 'Bận việc gia đình đột xuất'
): {
  bookings: FacilityBooking[];
  cancelledBooking?: FacilityBooking;
  refundRate: number;
  refundAmount: number;
  message: string;
} {
  const current = getFacilityBookings(aptCode);
  const target = current.find(b => b.id === bookingId);

  if (!target) {
    return {
      bookings: current,
      refundRate: 0,
      refundAmount: 0,
      message: 'Không tìm thấy thông tin lịch đặt này.',
    };
  }

  const refundCalc = calculateRefundEstimate(target);
  const nowStr = new Date().toISOString();

  const updated = current.map(b => {
    if (b.id !== bookingId) return b;
    return {
      ...b,
      status: 'CANCELLED' as const,
      refundRate: refundCalc.refundRate,
      refundAmount: refundCalc.refundAmount,
      refundNote: `${refundCalc.title}: ${refundCalc.reason} (Lý do: ${reason})`,
      cancelledAt: nowStr,
    };
  });

  setStorageItem(`${FACILITY_BOOKINGS_PREFIX}${aptCode}`, updated);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('skyline_facility_booked', {
        detail: { id: bookingId, status: 'CANCELLED', refundAmount: refundCalc.refundAmount },
      })
    );
  }

  const cancelledBooking = updated.find(b => b.id === bookingId);
  const msg =
    refundCalc.refundRate > 0
      ? `Đã hủy lịch thành công! Hệ thống xác nhận hoàn lại ${refundCalc.refundRate}% (${refundCalc.refundAmount.toLocaleString('vi-VN')} đ) vào hóa đơn tháng tới của căn hộ.`
      : `Đã hủy lịch đặt chỗ. Do quá giờ hẹn bắt đầu nên không áp dụng hoàn tiền theo quy chế.`;

  return {
    bookings: updated,
    cancelledBooking,
    refundRate: refundCalc.refundRate,
    refundAmount: refundCalc.refundAmount,
    message: msg,
  };
}

/**
 * Hủy đặt chỗ tiện ích (hàm tương thích ngược)
 */
export function cancelFacilityBooking(aptCode: string, bookingId: string): FacilityBooking[] {
  return cancelFacilityBookingWithRefund(aptCode, bookingId).bookings;
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
