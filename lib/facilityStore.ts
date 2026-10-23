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

const FACILITY_LOGS_PREFIX = 'skyline_facility_logs_v2_';
const FACILITY_BOOKINGS_PREFIX = 'skyline_facility_bookings_v2_';
const FACILITY_GLOBAL_BOOKINGS_KEY = 'skyline_facility_global_bookings_v3';
const CARDS_PREFIX = 'skyline_resident_cards_v2_';

export interface FacilityLimitRule {
  facilityId: string;
  facilityName: string;
  maxSlotsPerTime: number; // Số lượt đặt tối đa cho 1 khung giờ trong toàn tòa nhà
  maxGuests: number;
  isPrivate: boolean; // Phòng riêng biệt hoàn toàn
  description: string;
}

export const FACILITY_LIMIT_RULES: Record<string, FacilityLimitRule> = {
  'fac-sauna': {
    facilityId: 'fac-sauna',
    facilityName: 'Phòng Xông Hơi Đá Muối VIP',
    maxSlotsPerTime: 1, // 1 phòng VIP gia đình duy nhất / khung giờ
    maxGuests: 6,
    isPrivate: true,
    description: 'Phòng VIP gia đình riêng tư khép kín (Giới hạn: 1 lượt đặt / khung giờ)'
  },
  'fac-bbq': {
    facilityId: 'fac-bbq',
    facilityName: 'Vườn Tiệc Nướng BBQ Sân Thượng',
    maxSlotsPerTime: 3, // 3 bếp nướng Weber A, B, C độc lập tại tầng 25
    maxGuests: 20,
    isPrivate: false,
    description: '3 cụm bếp nướng Weber độc lập (Giới hạn: 3 lượt đặt / ca tiệc)'
  },
  'fac-sports-malibu': {
    facilityId: 'fac-sports-malibu',
    facilityName: 'Sân Thể Thao Malibu (Tennis & Bóng Rổ)',
    maxSlotsPerTime: 2, // 1 sân Tennis + 1 sân Bóng rổ
    maxGuests: 12,
    isPrivate: false,
    description: '1 Sân Tennis + 1 Sân Bóng Rổ (Giới hạn: 2 lượt đặt / khung giờ)'
  },
  'fac-cabana': {
    facilityId: 'fac-cabana',
    facilityName: 'Chòi Nghỉ Cabana Ven Hồ Bơi Resort',
    maxSlotsPerTime: 4, // 4 chòi nghỉ 01, 02, 03, 04
    maxGuests: 8,
    isPrivate: false,
    description: '4 Chòi nghỉ Cabana view hồ (Giới hạn: 4 lượt đặt / khung giờ)'
  },
  'fac-yoga': {
    facilityId: 'fac-yoga',
    facilityName: 'Sân Yoga Ngoài Trời & Thiền Tĩnh',
    maxSlotsPerTime: 6, // 6 thảm thiền
    maxGuests: 6,
    isPrivate: false,
    description: 'Khuôn viên tĩnh lặng (Giới hạn: 6 lượt đặt / khung giờ)'
  },
  'fac-multipurpose-lawn': {
    facilityId: 'fac-multipurpose-lawn',
    facilityName: 'Sân Cỏ Đa Năng Y-01 Malibu',
    maxSlotsPerTime: 1, // Sân bóng đá mini / Pickleball độc quyền 1 nhóm
    maxGuests: 20,
    isPrivate: true,
    description: 'Sân cỏ bóng đá mini / Pickleball (Giới hạn: 1 lượt đặt / khung giờ)'
  }
};

/**
 * Phân tích khoảng thời gian bắt đầu và kết thúc (tính theo phút trong ngày)
 */
export function parseTimeSlotRange(slotStr: string): { startMin: number; endMin: number } | null {
  if (!slotStr) return null;
  const match = slotStr.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const startMin = parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
  const endMin = parseInt(match[3], 10) * 60 + parseInt(match[4], 10);
  return { startMin, endMin };
}

/**
 * Kiểm tra 2 khung giờ có bị giao cắt / trùng lặp thời gian hay không
 */
export function isTimeSlotOverlap(slotA: string, slotB: string): boolean {
  if (!slotA || !slotB) return false;
  const rangeA = parseTimeSlotRange(slotA);
  const rangeB = parseTimeSlotRange(slotB);
  if (!rangeA || !rangeB) {
    return slotA.trim().slice(0, 13) === slotB.trim().slice(0, 13);
  }
  return Math.max(rangeA.startMin, rangeB.startMin) < Math.min(rangeA.endMin, rangeB.endMin);
}

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
 * Lấy toàn bộ danh sách đặt chỗ của toàn bộ tòa nhà (Shared Registry)
 */
export function getAllFacilityBookings(): FacilityBooking[] {
  let list = getStorageItem<FacilityBooking[]>(FACILITY_GLOBAL_BOOKINGS_KEY, []);
  if (!Array.isArray(list)) list = [];
  return list;
}

/**
 * Lưu toàn bộ danh sách đặt chỗ của tòa nhà
 */
export function saveAllFacilityBookings(all: FacilityBooking[]): void {
  setStorageItem(FACILITY_GLOBAL_BOOKINGS_KEY, all);
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
 * Lấy danh sách đặt chỗ tiện ích của căn hộ (Khởi đầu sạch, đồng bộ Shared Registry)
 */
export function getFacilityBookings(aptCode: string): FacilityBooking[] {
  const all = getAllFacilityBookings();
  const cleanApt = (aptCode || '').trim().toUpperCase();
  const aptBookings = all.filter(b => (b.aptCode || '').trim().toUpperCase() === cleanApt);

  // Đồng bộ legacy key nếu có
  const legacy = getStorageItem<FacilityBooking[] | null>(`${FACILITY_BOOKINGS_PREFIX}${aptCode}`, null);
  if (legacy && Array.isArray(legacy) && legacy.length > 0) {
    let hasNew = false;
    const merged = [...all];
    legacy.forEach(legItem => {
      if (!merged.some(m => m.id === legItem.id || m.ticketCode === legItem.ticketCode)) {
        merged.push(legItem);
        hasNew = true;
      }
    });
    if (hasNew) {
      saveAllFacilityBookings(merged);
      return merged.filter(b => (b.aptCode || '').trim().toUpperCase() === cleanApt);
    }
  }

  return aptBookings;
}

/**
 * BẪY LỖI & KIỂM TRA ĐẶT CHỖ HỢP LỆ (Validation Trap)
 * 1. Không thể đặt cho ngày trong quá khứ hoặc khung giờ đã qua
 * 2. 1 Căn hộ KHÔNG THỂ đặt trùng lặp cùng một tiện ích trong cùng khung giờ
 * 3. 1 Căn hộ KHÔNG THỂ đặt 2 tiện ích khác nhau bị trùng/giao cắt thời gian
 * 4. Giới hạn sức chứa tiện ích (VIP Sauna max 1, BBQ max 3, Malibu max 2, Cabana max 4,...)
 * 5. Giới hạn hạn mức quota tháng
 */
export function validateBookingRequest({
  aptCode,
  facilityId,
  bookingDate,
  timeSlot,
}: {
  aptCode: string;
  facilityId: string;
  bookingDate: string;
  timeSlot: string;
  bookerName?: string;
}): {
  valid: boolean;
  error?: string;
  bookedCount: number;
  maxSlots: number;
  remainingSlots: number;
} {
  const limitRule = FACILITY_LIMIT_RULES[facilityId] || {
    facilityId,
    facilityName: 'Tiện ích',
    maxSlotsPerTime: 2,
    maxGuests: 10,
    isPrivate: false,
    description: 'Tiện ích chung cư (Tối đa 2 lượt / khung giờ)'
  };

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // 1. Kiểm tra ngày đặt
  if (bookingDate < todayStr) {
    return {
      valid: false,
      error: 'Không thể đặt lịch cho ngày đã qua trong quá khứ.',
      bookedCount: 0,
      maxSlots: limitRule.maxSlotsPerTime,
      remainingSlots: limitRule.maxSlotsPerTime
    };
  }

  // Nếu là ngày hôm nay, kiểm tra giờ bắt đầu có qua chưa
  if (bookingDate === todayStr) {
    const range = parseTimeSlotRange(timeSlot);
    if (range) {
      const currentMin = now.getHours() * 60 + now.getMinutes();
      if (currentMin >= range.startMin) {
        return {
          valid: false,
          error: `Khung giờ ${timeSlot} hôm nay đã bắt đầu hoặc kết thúc. Quý cư dân vui lòng chọn khung giờ kế tiếp.`,
          bookedCount: 0,
          maxSlots: limitRule.maxSlotsPerTime,
          remainingSlots: limitRule.maxSlotsPerTime
        };
      }
    }
  }

  const allBuildingBookings = getAllFacilityBookings();
  const cleanApt = (aptCode || '').trim().toUpperCase();

  // 2. Bẫy lỗi Căn Hộ Đặt Duplicate (Cùng tiện ích hoặc tiện ích khác trong cùng khung giờ)
  const residentActiveBookings = allBuildingBookings.filter(b => 
    b.status === 'CONFIRMED' && 
    (b.aptCode || '').trim().toUpperCase() === cleanApt &&
    b.bookingDate === bookingDate
  );

  // a) Trùng chính tiện ích này
  const duplicateSame = residentActiveBookings.find(b => 
    b.facilityId === facilityId && isTimeSlotOverlap(b.timeSlot, timeSlot)
  );
  if (duplicateSame) {
    return {
      valid: false,
      error: `Căn hộ ${aptCode} đã có phiếu đặt đang có hiệu lực cho [${limitRule.facilityName}] vào khung giờ [${duplicateSame.timeSlot}] ngày ${bookingDate}. Hệ thống không cho phép đặt trùng lặp (duplicate).`,
      bookedCount: 1,
      maxSlots: limitRule.maxSlotsPerTime,
      remainingSlots: 0
    };
  }

  // b) Trùng khung giờ với một tiện ích khác (1 cư dân không thể phân thân ở 2 nơi cùng lúc)
  const conflictOther = residentActiveBookings.find(b => 
    isTimeSlotOverlap(b.timeSlot, timeSlot)
  );
  if (conflictOther) {
    return {
      valid: false,
      error: `Căn hộ ${aptCode} đã có lịch đặt tiện ích khác [${conflictOther.facilityName}] vào khung giờ [${conflictOther.timeSlot}] cùng ngày ${bookingDate}. Mỗi căn hộ chỉ có thể giữ chỗ một tiện ích trong cùng một khung thời gian.`,
      bookedCount: 1,
      maxSlots: limitRule.maxSlotsPerTime,
      remainingSlots: 0
    };
  }

  // 3. Bẫy lỗi Giới Hạn Sức Chứa Toàn Tòa Nhà (Kín Chỗ / Overlapping capacity)
  const activeBookingsForFacility = allBuildingBookings.filter(b =>
    b.status === 'CONFIRMED' &&
    b.facilityId === facilityId &&
    b.bookingDate === bookingDate &&
    isTimeSlotOverlap(b.timeSlot, timeSlot)
  );

  const bookedCount = activeBookingsForFacility.length;
  const remainingSlots = Math.max(0, limitRule.maxSlotsPerTime - bookedCount);

  if (bookedCount >= limitRule.maxSlotsPerTime) {
    return {
      valid: false,
      error: `Tiện ích [${limitRule.facilityName}] đã KÍN CHỖ (đạt giới hạn tối đa ${limitRule.maxSlotsPerTime} lượt đặt của tòa nhà) trong khung giờ [${timeSlot}] ngày ${bookingDate}. Quý cư dân vui lòng chọn khung giờ khác.`,
      bookedCount,
      maxSlots: limitRule.maxSlotsPerTime,
      remainingSlots: 0
    };
  }

  // 4. Kiểm tra Hạn mức Quota tháng
  const quota = getFacilityMonthlyQuota(aptCode);
  if (quota.remaining <= 0) {
    return {
      valid: false,
      error: `Căn hộ ${aptCode} đã sử dụng hết hạn mức tiện ích tháng này (${quota.max} lượt).`,
      bookedCount,
      maxSlots: limitRule.maxSlotsPerTime,
      remainingSlots
    };
  }

  return {
    valid: true,
    bookedCount,
    maxSlots: limitRule.maxSlotsPerTime,
    remainingSlots
  };
}

/**
 * Tra cứu trạng thái số chỗ còn lại của 1 khung giờ tiện ích (Dùng để hiển thị giao diện)
 */
export function getFacilitySlotStatus(
  facilityId: string,
  bookingDate: string,
  timeSlot: string,
  currentAptCode?: string
): {
  bookedCount: number;
  maxSlots: number;
  remainingSlots: number;
  isFull: boolean;
  isUserBooked: boolean;
  isPast: boolean;
  statusBadge: string;
} {
  const limitRule = FACILITY_LIMIT_RULES[facilityId] || {
    maxSlotsPerTime: 2,
    facilityName: 'Tiện ích'
  };

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  let isPast = bookingDate < todayStr;
  if (bookingDate === todayStr) {
    const range = parseTimeSlotRange(timeSlot);
    if (range && (now.getHours() * 60 + now.getMinutes()) >= range.startMin) {
      isPast = true;
    }
  }

  const allBookings = getAllFacilityBookings();
  const activeBookings = allBookings.filter(b =>
    b.status === 'CONFIRMED' &&
    b.facilityId === facilityId &&
    b.bookingDate === bookingDate &&
    isTimeSlotOverlap(b.timeSlot, timeSlot)
  );

  const cleanApt = (currentAptCode || '').trim().toUpperCase();
  const isUserBooked = cleanApt ? allBookings.some(b => 
    b.status === 'CONFIRMED' &&
    (b.aptCode || '').trim().toUpperCase() === cleanApt &&
    b.bookingDate === bookingDate &&
    isTimeSlotOverlap(b.timeSlot, timeSlot)
  ) : false;

  const bookedCount = activeBookings.length;
  const remainingSlots = Math.max(0, limitRule.maxSlotsPerTime - bookedCount);
  const isFull = bookedCount >= limitRule.maxSlotsPerTime;

  let statusBadge = '';
  if (isPast) {
    statusBadge = 'Đã qua giờ';
  } else if (isUserBooked) {
    statusBadge = 'Căn của bạn đã đặt';
  } else if (isFull) {
    statusBadge = `Đã kín chỗ (0/${limitRule.maxSlotsPerTime})`;
  } else {
    statusBadge = `Còn ${remainingSlots}/${limitRule.maxSlotsPerTime} chỗ`;
  }

  return {
    bookedCount,
    maxSlots: limitRule.maxSlotsPerTime,
    remainingSlots,
    isFull,
    isUserBooked,
    isPast,
    statusBadge
  };
}

/**
 * Tính toán tỷ lệ hoàn tiền và số tiền ước tính theo quy chế minh bạch
 */
export function calculateRefundEstimate(booking: FacilityBooking): {
  refundRate: number;
  refundAmount: number;
  diffMinutes: number;
  policyTier: 'FULL_100' | 'PARTIAL_50' | 'NO_REFUND_0';
  title: string;
  reason: string;
} {
  const deposit = booking.depositAmount || (booking.pricing.includes('600.000') ? 600000 : booking.pricing.includes('1.000.000') ? 1000000 : booking.pricing.includes('500.000') ? 500000 : 500000);

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

export interface CreateBookingResult {
  success: boolean;
  error?: string;
  bookings: FacilityBooking[];
  newBooking?: FacilityBooking;
}

/**
 * Tạo mới đặt chỗ tiện ích thực tế - Có bẫy lỗi trùng giờ, duplicate và giới hạn sức chứa
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
): CreateBookingResult {
  // 1. Chạy bẫy lỗi (Validation Trap)
  const validation = validateBookingRequest({
    aptCode,
    facilityId,
    bookingDate,
    timeSlot,
    bookerName,
  });

  if (!validation.valid) {
    return {
      success: false,
      error: validation.error,
      bookings: getFacilityBookings(aptCode),
    };
  }

  const allCurrent = getAllFacilityBookings();
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

  const updatedAll = [newBooking, ...allCurrent];
  saveAllFacilityBookings(updatedAll);

  // Cập nhật legacy store cho căn hộ
  const aptList = updatedAll.filter(b => (b.aptCode || '').trim().toUpperCase() === (aptCode || '').trim().toUpperCase());
  setStorageItem(`${FACILITY_BOOKINGS_PREFIX}${aptCode}`, aptList);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('skyline_facility_booked', { detail: newBooking }));
  }

  return { success: true, bookings: aptList, newBooking };
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

  const allCurrent = getAllFacilityBookings();
  const updatedAll = allCurrent.map(b => b.ticketCode === ticketCode ? { ...b, status: 'CHECKED_IN' as const } : b);
  saveAllFacilityBookings(updatedAll);

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

  const allCurrent = getAllFacilityBookings();
  const updatedAll = allCurrent.map(b => {
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
  saveAllFacilityBookings(updatedAll);

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
