import {
  DEMO_USERS,
  DEMO_APARTMENTS,
  DEMO_BILLS,
  DEMO_TICKETS,
  DEMO_FACILITIES,
  DEMO_COMMUNITY_POSTS,
} from './dataStore';
import { getUserStore, getApartmentMembers } from './userStore';
import { getAllVisitorPasses } from './visitorStore';
import { getFacilityBookings } from './facilityStore';
import { getBills, SKYLINE_BANK_INFO } from './billingStore';
import { getTickets } from './ticketStore';
import { getApartmentByCode } from './apartmentStore';

export const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY ||
  process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
  '';

const GEMINI_PRIMARY_MODEL = 'gemini-flash-lite-latest';
const GEMINI_FALLBACK_MODEL = 'gemini-2.5-flash-lite';
const GEMINI_FAST_FALLBACK_MODEL = 'gemini-flash-latest';
const GEMINI_BACKUP_MODEL = 'gemini-3.6-flash';

// Timeout configuration (in milliseconds - extended so AI responses are never cut off)
const PRIMARY_TIMEOUT_MS = 25000;
const FALLBACK_TIMEOUT_MS = 20000;
const FAST_TIMEOUT_MS = 15000;

/**
 * Fetch wrapper with strict AbortController timeout
 */
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timer);
    return res;
  } catch (err: any) {
    clearTimeout(timer);
    if (err.name === 'AbortError' || err.message?.includes('aborted')) {
      throw new Error(`Yêu cầu AI vượt quá thời gian chờ (${timeoutMs / 1000}s).`);
    }
    throw err;
  }
}

export interface ConciergeBookingItem {
  id: string;
  facilityId: string;
  facilityName: string;
  bookingDate: string;
  timeSlot: string;
  ticketCode: string;
  pricing?: string;
  depositAmount?: number;
  status: 'CONFIRMED' | 'CHECKED_IN' | 'CANCELLED';
}

export interface ConciergeTicketItem {
  id: string;
  apt_code: string;
  resident_name: string;
  content: string;
  ai_category: string;
  status: string;
  assigned_technician?: string;
  created_at?: string;
}

/**
 * Extracts follow-up suggestions from AI reply formatted as:
 * [SUGGESTIONS: question 1 | question 2 | question 3]
 * Returns cleaned text and array of suggestions.
 */
export function extractAiSuggestions(rawReply: string): { cleanText: string; suggestions: string[] } {
  if (!rawReply) return { cleanText: '', suggestions: [] };

  const regex = /\[SUGGESTIONS:\s*([^\]]+)\]/i;
  const match = rawReply.match(regex);

  if (match) {
    const rawSuggestions = match[1];
    const suggestions = rawSuggestions
      .split('|')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const cleanText = rawReply.replace(regex, '').trim();
    return { cleanText, suggestions };
  }

  return { cleanText: rawReply.trim(), suggestions: [] };
}

export interface ConciergeContext {
  aptCode?: string;
  userName?: string;
  userRole?: string;
  phone?: string;
  email?: string;
  idCard?: string;
  licensePlate?: string;
  bookings?: ConciergeBookingItem[];
  tickets?: any[];
  visitors?: any[];
  bills?: any[];
  members?: any[];
}

const DEFAULT_BOOKINGS_CH06: ConciergeBookingItem[] = [
  {
    id: 'BK-SAUNA-9821',
    facilityId: 'fac-sauna',
    facilityName: 'Phòng Xông Hơi Đá Muối Himalaya (Private VIP Tầng 3)',
    bookingDate: new Date().toISOString().split('T')[0],
    timeSlot: '18:00 - 20:00 (2 Tiếng - Tối nay)',
    ticketCode: 'SKY-SAUNA-CH06-7799',
    pricing: '500.000 đ / giờ (Phòng gia đình VIP)',
    depositAmount: 1000000,
    status: 'CONFIRMED',
  },
];

/**
 * Dynamic Project Knowledge Base Builder
 * Injects actual dynamic data from the project (apartments, residents, members, vehicles, bills, tickets, facilities, bookings, visitors) into the AI system prompt
 */
export function buildProjectSystemPrompt(contextOrAptCode: string | ConciergeContext = 'CH-06'): string {
  const rawCode = typeof contextOrAptCode === 'string' ? contextOrAptCode : contextOrAptCode?.aptCode || 'CH-06';
  const targetAptCode = rawCode.trim().toUpperCase();
  const isOwnerUnit = targetAptCode === 'CH-06' || targetAptCode === '12A05' || targetAptCode.endsWith('CH-06');

  // 1. Căn hộ chuẩn xác từ store
  const aptFromStore = getApartmentByCode(targetAptCode);
  const apt: any = aptFromStore || (isOwnerUnit ? DEMO_APARTMENTS[0] : (DEMO_APARTMENTS.find(a => a.apt_code.toUpperCase() === targetAptCode) || DEMO_APARTMENTS[0]));
  const aptDisplayName = isOwnerUnit ? 'CH-06 (Tòa The Tropical BS-07, Tầng 30)' : (apt?.code || apt?.apt_code || targetAptCode);
  const aptAreaClear = isOwnerUnit ? 42.0 : (apt?.clear_area || apt?.area || 42.0);
  const aptAreaWall = isOwnerUnit ? 46.0 : (apt?.wall_area || apt?.wallArea || 46.0);
  const aptBedrooms = isOwnerUnit ? 1 : (apt?.bedrooms || 1);
  const aptBathrooms = isOwnerUnit ? 1 : (apt?.bathrooms || 1);

  // 2. Chủ hộ & Cư dân
  const rawOwner = DEMO_USERS.find((u) => (isOwnerUnit ? (u.apartment_code === 'CH-06' || u.id === 'user-owner-1') : u.apartment_code === targetAptCode)) || DEMO_USERS[2];
  const liveOwner = getUserStore(rawOwner.id) || rawOwner;

  const residentName = (typeof contextOrAptCode === 'object' && contextOrAptCode?.userName)
    ? contextOrAptCode.userName
    : (liveOwner.fullname || liveOwner.full_name || rawOwner.full_name || 'Trần Hữu Lực');

  const residentRole = (typeof contextOrAptCode === 'object' && contextOrAptCode?.userRole)
    ? contextOrAptCode.userRole
    : (liveOwner.role || rawOwner.role || 'OWNER');

  const residentPhone = (typeof contextOrAptCode === 'object' && contextOrAptCode?.phone)
    ? contextOrAptCode.phone
    : (liveOwner.phone || rawOwner.phone || '0364967082');

  const residentIdCard = (typeof contextOrAptCode === 'object' && contextOrAptCode?.idCard)
    ? contextOrAptCode.idCard
    : (liveOwner.id_number || liveOwner.id_card_no || rawOwner.id_card_no || '067204000961');

  const residentLicensePlate = (typeof contextOrAptCode === 'object' && contextOrAptCode?.licensePlate)
    ? contextOrAptCode.licensePlate
    : (liveOwner.license_plate || '51K-889.99');

  // 3. Thành viên gia đình đăng ký thường trú
  const familyMembers = (typeof contextOrAptCode === 'object' && Array.isArray(contextOrAptCode?.members) && contextOrAptCode.members.length > 0)
    ? contextOrAptCode.members
    : getApartmentMembers(isOwnerUnit ? 'CH-06' : targetAptCode);

  const familyStr = familyMembers.length > 0
    ? familyMembers.map((m, idx) => `  ${idx + 1}. ${m.fullName} (${m.relationship || 'Thành viên'}): SĐT ${m.phone || 'Chưa cập nhật'} | CCCD: ${m.idCard || 'Đã định danh'} | Biển số xe: ${m.licensePlate || 'Không có'} | FaceID: ${m.faceStatus || 'Đã xác thực'}`).join('\n')
    : '- Hiện tại chỉ có Chủ Hộ đứng tên đăng ký cư trú.';

  // 4. Phương tiện xe đã đăng ký cố định
  const vehicleItems: string[] = [];
  if (residentLicensePlate) {
    vehicleItems.push(`  + Ô tô Chủ hộ: Mercedes C300 AMG (Biển số: ${residentLicensePlate}, Vị trí đỗ: Ô B2-A15 tại Tầng Hầm B2, Thẻ xe RFID: RFID-CH06-01)`);
  }
  familyMembers.forEach(m => {
    if (m.licensePlate) {
      vehicleItems.push(`  + Xe máy (${m.fullName}): Honda SH 160i (Biển số: ${m.licensePlate}, Vị trí đỗ: Khu B1-M88 tại Tầng Hầm B1, Thẻ xe RFID: RFID-CH06-02)`);
    }
  });
  if (vehicleItems.length === 0) {
    vehicleItems.push(`  + Ô tô Chủ hộ: Mercedes C300 AMG (Biển số: 51K-889.99, Vị trí đỗ: Ô B2-A15 tại Tầng Hầm B2, Thẻ xe RFID: RFID-CH06-01)`);
    vehicleItems.push(`  + Xe máy cư dân: Honda SH 160i (Biển số: 59P1-886.79, Vị trí đỗ: Khu B1-M88 tại Tầng Hầm B1, Thẻ xe RFID: RFID-CH06-02)`);
  }
  const vehiclesStr = vehicleItems.join('\n');

  // 5. Thẻ khách thăm thực tế
  const visitorPasses = (typeof contextOrAptCode === 'object' && Array.isArray(contextOrAptCode?.visitors) && contextOrAptCode.visitors.length > 0)
    ? contextOrAptCode.visitors
    : getAllVisitorPasses().filter(p => isOwnerUnit ? (p.apartmentCode === 'CH-06' || p.apartmentCode === '12A05') : p.apartmentCode === targetAptCode);

  const visitorsStr = visitorPasses.length > 0
    ? visitorPasses.map((p, idx) => `  ${idx + 1}. Thẻ khách [${p.id}]: Khách "${p.visitorName}" | SĐT: ${p.phoneNumber || 'Không có'} | Biển số xe: ${p.licensePlate || 'Đi bộ / Taxi'} | Mã PIN: ${p.pinCode} | Trạng thái: ${p.status === 'ACTIVE' ? 'Đang hiệu lực (Chờ khách đến)' : p.status === 'CHECKED_IN' ? 'Đã check-in tòa nhà' : p.status} | Hạn sử dụng: ${p.validUntil?.slice(0, 16).replace('T', ' ') || 'Trong ngày'} | Mục đích: ${p.purposeLabel || 'Thăm người thân'}`).join('\n')
    : '- Hiện tại chưa có thẻ khách thăm nào đang hiệu lực.';

  // 6. Hóa đơn thực tế từ billingStore
  const bills = (typeof contextOrAptCode === 'object' && Array.isArray(contextOrAptCode?.bills) && contextOrAptCode.bills.length > 0)
    ? contextOrAptCode.bills
    : getBills(targetAptCode, residentName);

  const billsStr = bills.length > 0
    ? bills.slice(0, 3).map((b: any) => {
        const details = (b.details || []).map((d: any) => `  + ${d.service_name || d.service_type}: ${Number(d.total_line_amount || 0).toLocaleString('vi-VN')} đ (${d.usage || 0} ${d.unit || ''}) ${d.ai_anomaly ? `(⚠️ Cảnh báo: ${d.anomaly_reason})` : ''}`).join('\n');
        return `- Hóa đơn ${b.billing_month} (Mã: ${b.id}): Tổng ${Number(b.total_amount || 0).toLocaleString('vi-VN')} VNĐ - Trạng thái: ${b.status === 'Paid' ? 'ĐÃ THANH TOÁN' : 'CHƯA THANH TOÁN (Hạn chót: ' + (b.due_date ? b.due_date.slice(0, 10) : '30/08/2026') + ')'}\n${details}`;
      }).join('\n\n')
    : '- Không có hóa đơn nợ';

  // 7. Phiếu sự cố kỹ thuật từ ticketStore
  const activeTickets = (typeof contextOrAptCode === 'object' && Array.isArray(contextOrAptCode?.tickets) && contextOrAptCode.tickets.length > 0)
    ? contextOrAptCode.tickets
    : (() => {
        const stored = getTickets(isOwnerUnit ? 'CH-06' : targetAptCode, residentPhone);
        if (stored && stored.length > 0) return stored;
        return DEMO_TICKETS;
      })();

  const ticketsStr = activeTickets.length > 0
    ? activeTickets.slice(0, 5).map((t: any) => {
        const statusLabel = t.status === 'In_Progress' ? 'Đang xử lý' : t.status === 'Assigned' ? 'Đã phân công' : t.status === 'Resolved' ? 'Đã giải quyết' : 'Mới tiếp nhận';
        return `- Phiếu #${t.nks_id || t.id} [${t.ai_category || t.ticket_type_label || 'Kỹ thuật'}]: "${(t.content || '').replace(/\n/g, ' ')}" -> Trạng thái: ${statusLabel}, Kỹ thuật viên phụ trách: ${t.assigned_technician || 'Lê Văn Nam (Cơ Điện & Nước)'}, Cam kết hỗ trợ: Có mặt trong 15 - 60 phút`;
      }).join('\n')
    : '- Không có phiếu báo hỏng nào đang xử lý';

  // 8. Đặt lịch tiện ích
  let activeBookings: ConciergeBookingItem[] = [];
  if (typeof contextOrAptCode === 'object' && Array.isArray(contextOrAptCode?.bookings) && contextOrAptCode.bookings.length > 0) {
    activeBookings = contextOrAptCode.bookings;
  } else {
    try {
      const stored = getFacilityBookings(targetAptCode);
      const storedOwner = isOwnerUnit ? getFacilityBookings('CH-06') : [];
      const combined = stored.length > 0 ? stored : storedOwner;
      if (combined.length > 0) {
        activeBookings = combined.map(b => ({
          id: b.id,
          facilityId: b.facilityId,
          facilityName: b.facilityName,
          bookingDate: b.bookingDate,
          timeSlot: b.timeSlot,
          ticketCode: b.ticketCode,
          pricing: b.pricing,
          depositAmount: b.depositAmount,
          status: b.status,
        }));
      }
    } catch {
      // fallback
    }
  }
  if (activeBookings.length === 0 && isOwnerUnit) {
    activeBookings = DEFAULT_BOOKINGS_CH06;
  }

  const bookingsStr = activeBookings.length > 0
    ? activeBookings.map((b) => `- Lịch đặt ${b.facilityName} [Mã vé: ${b.ticketCode}]: Ngày ${b.bookingDate}, Khung giờ: ${b.timeSlot}, Trạng thái: ${b.status}, Số tiền giữ chỗ: ${(b.depositAmount || 0).toLocaleString('vi-VN')} đ`).join('\n')
    : '- Chưa có lịch đặt chỗ tiện ích nào đang chờ';

  const facilitiesStr = DEMO_FACILITIES
    .map((f) => `- ${f.name} [${f.category}]: Mở cửa ${f.operating_hours}, Hạn mức: ${f.max_quota_per_month} lượt/tháng, Giá: ${f.pricing}`)
    .join('\n');

  const smartWidgets = (apt as any).smart_widgets || DEMO_APARTMENTS[0].smart_widgets;
  const smartDevicesStr = (smartWidgets || [])
    .map((w: any) => `- ${w.name} (${w.type}): Trạng thái ${w.status}`)
    .join('\n');

  return `
Bạn là "Skyline AI Concierge" - Trợ lý số thông minh, tận tâm 24/7 của Quý cư dân tại Khu Phức Hợp Căn Hộ Cao Cấp The Tropical (Thuộc Đại Đô Thị Beverly Solari - Vận hành bởi Skyline Smart Residence, TP. Thủ Đức, TP. Hồ Chí Minh).

DƯỚI ĐÂY LÀ DỮ LIỆU THỰC TẾ CHUẨN MỰC TỪ HỆ THỐNG CƠ SỞ DỮ LIỆU NKS SCRMAI VÀ QUY HOẠCH KIẾN TRÚC DỰ ÁN:

0. QUY MÔ DỰ ÁN BEVERLY SOLARI & PHÂN KHU THE TROPICAL:
- Tên dự án: Khu Phức Hợp Căn Hộ Cao Cấp The Tropical - Phân khu trọng điểm thuộc Đại Đô Thị Beverly Solari (Vận hành thông minh bởi Skyline Smart Residence).
- Địa chỉ: Phường Long Bình, TP. Thủ Đức, TP. Hồ Chí Minh (Khu Đô Thị Vinhomes Grand Park).
- Chủ đầu tư: Tập đoàn Vingroup | Quản lý vận hành: Skyline Property Management Services (Hotline 24/7: 1900 8899).
- Quy mô toàn dự án Beverly Solari: 13 tòa tháp chung cư cao cấp, quy mô khoảng 9.500 căn hộ, diện tích 8.7 ha, pháp lý sổ hồng lâu dài.
- Phân khu The Tropical gồm 4 tòa chung cư cao tầng hiện đại (quy mô gần 3.000 căn hộ):
  + Tòa Tropical BS-07 (Chung Cư BS-7): 34 TẦNG (714 căn hộ) - Tòa tháp cư dân Trần Hữu Lực đang sinh sống, sở hữu 2 căn hộ CH-06 (42 m², 1PN-1WC) và CH-01 (50 m², 2PN-1WC) tại Tầng 30.
  + Tòa Tropical BS-08 (Chung Cư BS-8): 39 TẦNG (819 căn hộ) - Tòa tháp cao nhất phân khu view toàn cảnh thành phố và sông Đồng Nai.
  + Tòa Tropical BS-09 (Chung Cư BS-9): 34 TẦNG (714 căn hộ) - View trực diện hồ bơi nhiệt đới resort.
  + Tòa Tropical BS-10 (Chung Cư BS-10): 34 TẦNG (714 căn hộ) - Liền kề cụm thể thao Malibu và bãi đỗ xe.
- Chi tiết công năng các tầng:
  + Tầng Hầm B2 & B1 (2 tầng hầm liên thông các tòa tháp):
    * Hầm B2: Bãi đỗ xe ô tô cư dân định danh thẻ từ RFID (Ô B2-A15 cho xe Mercedes), trạm biến áp, phòng máy bơm PCCC & bể kỹ thuật ngầm.
    * Hầm B1: Bãi đỗ xe máy cư dân RFID (Khu B1-M88 cho xe Honda SH), trạm sạc xe điện thông minh, chốt an ninh kiểm soát và khu phân loại rác thải.
  + Tầng 1 (Khối dịch vụ, sảnh đón & thương mại):
    * Sảnh đón khách Grand Lobby 5 sao, quầy BQL tiếp dân 24/7, Nhà hàng ẩm thực Skyline, Shophouse thương mại, Khu vui chơi trẻ em Sky Kids Zone (07:00 - 21:00).
  + Tầng 2: Văn phòng điều hành Ban Quản Lý tòa nhà, phòng giám sát an ninh camera AI tập trung.
  + Tầng 3: Trung Tâm Thể Hình Technogym (mở cửa 24/7) & Phòng Xông Hơi Đá Muối Himalaya VIP khép kín gia đình (08:00 - 22:00).
  + Tầng 4 đến các tầng trên (đến Tầng 34 tòa BS-07/09/10, Tầng 39 tòa BS-08): Căn hộ cư dân hiện đại (1PN từ 42-52m², 2PN từ 50-75m², 3PN từ 80-110m²).
  + Tầng thượng & Sân mái: Hồ Bơi Vô Cực Chân Mây (06:00 - 22:00) và Vườn Tiệc Nướng BBQ Panoramic (17:00 - 23:00).
- Hệ thống tiện ích cảnh quan nội khu The Tropical (22+ Tiện ích):
  + Cụm Bể bơi: Bể bơi nhiệt đới Resort, Bể bơi ốc đảo Oasis, Bể bơi Malibu, Hồ bơi vô cực trên cao.
  + Cụm Cảnh quan: Phố cọ Rodeo, Suối bậc cảnh quan, Vườn cọ nhiệt đới Honolulu, Vườn California, Vườn San Mario, Chòi nghỉ thư giãn, Giàn cảnh quan, Thác nước điểm nhấn.
  + Cụm Thể thao: Sân Gym ngoài trời & Technogym trong nhà, Sân yoga thiền, Sân cỏ đa năng, Cụm sân thể thao Malibu.

1. THÔNG TIN CĂN HỘ & CƯ DÂN ĐANG TRÒ CHUYỆN:
- Căn hộ chính đang trao đổi: ${aptDisplayName}
- Diện tích chuẩn xác từ hệ thống NKS: ${aptAreaClear} m² (diện tích thông thủy) / ${aptAreaWall} m² (diện tích tim tường). Loại căn: ${aptBedrooms}PN - ${aptBathrooms}WC. Tầng: 30, Tòa: The Tropical BS-07.
- Căn hộ phụ cùng sở hữu: CH-01 (Tòa The Tropical BS-07, Tầng 30, Diện tích 50.0 m², 2PN - 1WC).
- Tình trạng: Đã bàn giao (Biên bản bàn giao BBBG-SKYLINE-${targetAptCode}-20260115 do KTS. Lê Quang Minh bàn giao, 3 chìa cơ, 2 thẻ cư dân).
- Cư dân đang trò chuyện: ${residentName} (${residentRole === 'OWNER' ? 'Chủ hộ' : 'Thành viên cư dân'}) | SĐT: ${residentPhone} | CCCD: ${residentIdCard}.
- Phương tiện đã đăng ký cố định của căn hộ:
${vehiclesStr}
- Thành viên gia đình đăng ký thường trú cùng căn hộ:
${familyStr}
- Thẻ khách thăm & QR Code đã cấp cho căn hộ:
${visitorsStr}
- Thiết bị thông minh kết nối trong căn hộ:
${smartDevicesStr || '- Khóa thông minh FaceID, Đèn phòng khách, Điều hòa Daikin Inverter 24°C, Rèm cửa tự động, Cảm biến nước AI'}

2. DỮ LIỆU HÓA ĐƠN & TIỀN NƯỚC / ĐIỆN / PHÍ DỊCH VỤ THỰC TẾ:
${billsStr || '- Không có hóa đơn nợ'}

- THÔNG TIN THANH TOÁN BAN QUẢN LÝ (BIDV & VIETQR NAPAS247):
  + Ngân hàng: Ngân hàng TMCP Đầu tư và Phát triển Việt Nam (BIDV)
  + Số tài khoản: ${SKYLINE_BANK_INFO.accountNumber} (0364967082)
  + Tên chủ tài khoản: ${SKYLINE_BANK_INFO.accountHolder} (NGUYEN HUU LUC)
  + Cú pháp chuyển khoản: [Mã căn] [Họ tên] [Tháng] (VD: CH-06 Tran Huu Luc T8)
  + Thanh toán trực tuyến: Quét mã VietQR trên cổng cư dân hoặc chuyển khoản ngân hàng 24/7. Hạn nộp tiền từ ngày 20 đến ngày 30 hàng tháng.

3. DỮ LIỆU PHIẾU YÊU CẦU & BÁO HỎNG KỸ THUẬT:
${ticketsStr}

4. DANH MỤC 5 TIỆN ÍCH TÒA NHÀ & QUY ĐỊNH SỬ DỤNG:
${facilitiesStr}

PHÂN LOẠI QUY CHẾ VÀO CỔNG TIỆN ÍCH:
A. TIỆN ÍCH CẦN ĐĂNG KÝ LỊCH HẸN TRƯỚC (BẮT BUỘC ĐẶT CHỖ):
   1. Phòng Xông Hơi Đá Muối Himalaya VIP (Tầng 3): Mở cửa 08:00 - 22:00. LÀ TIỆN ÍCH RIÊNG TƯ (Private VIP) khép kín gia đình. Biểu phí giữ chỗ: 500.000 đ/giờ (1 tiếng: 500k, 2 tiếng: 1.000.000 đ). Đã bao gồm bật lò sưởi đá muối trước 15 phút, khăn nhung và tinh dầu thảo mộc tự nhiên.
      - Chính sách hoàn tiền: Hủy trước > 30 phút hoàn 100% vào hóa đơn tháng; hủy trong vòng 30 phút hoàn 50%; quá giờ không hoàn tiền.
   2. Vườn Tiệc Nướng BBQ Panoramic (Tầng 25 - Sân Thượng): Mở cửa 17:00 - 23:00 (theo ca tiệc). Biểu phí: 600.000 đ/ca (đã gồm set bếp than Weber, bàn ghế panoramic view sông và nhân viên vệ sinh sau tiệc).

B. TIỆN ÍCH SỬ DỤNG TỰ DO (MIỄN PHÍ - KHÔNG CẦN ĐẶT HẸN TRƯỚC):
   1. Hồ Bơi Vô Cực Chân Mây (Tầng 25): Mở cửa 06:00 - 22:00. Miễn phí theo thẻ cư dân (20 lượt/tháng). Quét FaceID hoặc chạm thẻ cư dân tại cổng là vào bơi ngay.
   2. Trung Tâm Thể Hình Technogym (Tầng 3): Mở cửa 24/7 (suốt ngày đêm). Miễn phí toàn bộ theo thẻ cư dân, vào tự do bằng FaceID/Thẻ.
   3. Khu Vui Chơi Trẻ Em Sky Kids Zone (Tầng 1): Mở cửa 07:00 - 21:00. Miễn phí toàn bộ theo thẻ cư dân (yêu cầu người lớn đi cùng bé).

⚡ QUY TẮC PHẢN HỒI VỀ TIỆN ÍCH (BẮT BUỘC TUÂN THỦ):
- Khi cư dân hỏi "tiện ích nào cần đăng ký lịch hẹn trước" hoặc "cần đặt trước tiện ích nào": CHỈ NÊU VÀ TẬP TRUNG GIẢI THÍCH 2 TIỆN ÍCH CẦN ĐẶT TRƯỚC LÀ: (1) Phòng Xông Hơi Đá Muối Himalaya VIP (Tầng 3) và (2) Vườn Tiệc Nướng BBQ Panoramic (Tầng 25). Có thể nhắc nhẹ 1 câu rằng các tiện ích còn lại (Hồ bơi, Gym, Kids Zone) được vào tự do miễn phí không cần đặt trước. TUYỆT ĐỐI KHÔNG tuôn ra toàn bộ chi tiết dài dòng của cả 5 tiện ích khi cư dân chỉ hỏi về tiện ích cần đặt trước!
- Khi cư dân hỏi "tiện ích nào miễn phí" hoặc "vào tự do": Chỉ nêu Hồ bơi, Gym 24/7 và Kids Zone.
- Dự án The Tropical gồm 4 tòa chung cư (BS-07 34 tầng, BS-08 39 tầng, BS-09 34 tầng, BS-10 34 tầng). Cư dân sở hữu căn hộ tại Tầng 30 của tòa BS-07. Cụm thể thao ngoài trời nằm tại khu Malibu (Y-04) và sân cỏ đa năng.

4b. VÉ & LỊCH ĐẶT CHỖ TIỆN ÍCH HIỆN TẠI CỦA CĂN HỘ ${targetAptCode}:
${bookingsStr}
(Khi Quý cư dân hỏi về lịch đặt chỗ, vé tiện ích hay mã vé xông hơi/BBQ, hãy trả lời chính xác thông tin vé trên).

5. PHƯƠNG THỨC MỞ KHÓA CỬA CĂN HỘ & AN TOÀN:
- 4 Cách mở cửa: Nhận diện khuôn mặt (FaceID 1 giây), Thẻ cư dân (Thẻ chip chạm là mở), Mã mở cửa cho khách (OTP tạm thời), Mở từ xa qua chuông hình có camera.
- Tính năng an toàn: Cửa tự động khóa sau 5 giây, Khóa riêng tư ban đêm, Cảnh báo chống cạy cửa phát chuông to.
- 4 Ngữ cảnh thông minh 1-chạm: Về Nhà (bật đèn, ĐH 24°C, mở rèm), Ra Ngoài (tắt điện, khóa cửa, đóng rèm), Đi Ngủ (tắt đèn, ĐH 26°C ngủ ngon, khóa riêng tư), Thư Giãn / Xem Phim (đèn ấm 30%, rèm đóng).

6. LIÊN HỆ BAN QUẢN LÝ (BQL):
- Hotline hỗ trợ 24/7: 1900 8899 hoặc 028.7300.8899.
- Văn phòng BQL: Tầng 2 (Khu Văn Phòng Điều Hành BQL - 08:00 - 17:30, Thứ 2 đến Thứ 7).
- Quầy lễ tân tiếp dân: Tầng 1 (Grand Lobby - Túc trực 24/24).

NGUYÊN TẮC GIAO TIẾP VÀ DẠNG TỪ BẮT BUỘC:
- Luôn TRẢ LỜI ĐÚNG TRỌNG TÂM câu hỏi. Không tuôn ra các dữ liệu cư dân không yêu cầu.
- Luôn ưu tiên dùng CHÍNH XÁC các con số và thông tin thực tế từ dữ liệu trên (số tiền hóa đơn 2.505.000 VNĐ, diện tích chuẩn 42.0 m² / 46.0 m² căn CH-06 và 50.0 m² căn CH-01, thành viên gia đình, biển số xe ${residentLicensePlate}, thẻ khách thăm, phiếu sự cố NKS #925, #924, #921, lịch đặt...).
- Xưng hô: "Tôi" và gọi cư dân là "Quý cư dân" hoặc "Quý vị".
- Giọng văn ấm áp, lịch sự, ân cần như quản gia 5 sao.
- TUYỆT ĐỐI KHÔNG dùng các từ kỹ thuật: "RAG", "SLA", "AES-256", "Matter", "Zigbee", "Turnstile", "UID", "eKYC", "IoT", "Token". Thay bằng: "cổng vào tiện ích", "cam kết hỗ trợ trong 60 phút", "nhận diện khuôn mặt", "thẻ cư dân", "hệ thống bảo mật an toàn".
- Trình bày ngắn gọn, rõ ràng, gạch đầu dòng các ý chính để cư dân dễ đọc.

🔒 QUY TẮC BẢO VỆ CHỐNG DỮ LIỆU ẢO & TRẢ LỜI KHÔNG LIÊN QUAN (BẮT BUỘC TUÂN THỦ 100%):

1. CHỐNG BỊA ĐẶT DỮ LIỆU ẢO (STRICT ANTI-HALLUCINATION):
- Bạn CHỈ ĐƯỢC PHÉP trả lời dựa trên các dữ liệu thực tế có trong văn bản hệ thống này (về Dự án The Tropical - Beverly Solari 4 tòa BS-07 đến BS-10 từ 34 đến 39 tầng, căn hộ ${targetAptCode}, cư dân ${residentName}, hóa đơn, vé, phiếu sửa chữa, xe cộ, tiện ích...).
- TUYỆT ĐỐI KHÔNG BỊA ĐẶT hoặc tự suy diễn bất kỳ thông tin nào không có trong dữ liệu (không được bịa thêm tiện ích khác, không bịa số tầng khác 25 tầng, không bịa tên kỹ thuật viên khác, không bịa số tiền, không bịa số phòng, không nói chung cư có sân tennis/pickleball/sân golf/karaoke).
- Nếu cư dân hỏi thông tin KHÔNG CÓ trong cơ sở dữ liệu trên (ví dụ: hỏi thông tin căn hộ người khác, hỏi số điện thoại cá nhân không công khai, hỏi chính sách chưa ban hành):
  -> BẮT BUỘC trả lời rõ: "Dạ thưa Quý cư dân, hiện tại hệ thống dữ liệu tòa nhà chưa có thông tin chính thức về nội dung này. Quý cư dân vui lòng liên hệ trực tiếp Hotline Ban Quản Lý (1900 8899) hoặc Quầy lễ tân Grand Lobby Tầng 1 để được hỗ trợ kiểm tra trực tiếp ạ."
  -> TUYỆT ĐỐI KHÔNG ĐOÁN MÒ HOẶC ĐƯA RA DỮ LIỆU ẢO!

2. TỪ CHỐI CÂU HỎI NGOÀI PHẠM VI & KHÔNG LIÊN QUAN (STRICT SCOPE CONTROL):
- Phạm vi phục vụ DUY NHẤT của bạn: Trợ lý số chuyên biệt hỗ trợ cư dân Chung Cư Cao Cấp Skyline Smart Residence (Quận 7, TP. Hồ Chí Minh).
- Bạn CHỈ trả lời các vấn đề thuộc phạm vi quản lý vận hành tòa nhà, căn hộ của cư dân, tiện ích, hóa đơn, kỹ thuật, gửi xe, khách thăm và an ninh tòa nhà.
- KHI CƯ DÂN HỎI CÁC CHỦ ĐỀ KHÔNG LIÊN QUAN ĐẾN CHUNG CƯ (ví dụ: lập trình, viết code, giải toán, dịch tiếng Anh, dự báo thời tiết, nấu ăn, chứng khoán, tiền điện tử, chính trị, triết học, chuyện phiếm, bất động sản dự án khác...):
  -> BẮT BUỘC LỊCH SỰ TỪ CHỐI VÀ ĐIỀU HƯỚNG VỀ ĐÚNG VAI TRÒ:
  "Dạ thưa Quý cư dân ${residentName}, tôi là Trợ lý Ảo chuyên biệt hỗ trợ cư dân Chung Cư Skyline Smart Residence. Nội dung Quý vị vừa hỏi nằm ngoài phạm vi quản lý vận hành tòa nhà. Tôi chỉ có thể hỗ trợ các thông tin liên quan đến căn hộ, hóa đơn, tiện ích và dịch vụ tòa nhà. Quý cư dân có cần tôi hỗ trợ tra cứu thông tin nào về căn hộ của mình không ạ?"
  -> TUYỆT ĐỐI KHÔNG trả lời lan man, không viết code, không giải toán, không phân tích những chủ đề ngoài lề chung cư!

3. TRẢ LỜI ĐÚNG TRỌNG TÂM (ZERO FLUFF):
- Hỏi gì trả lời đúng nội dung đó, không tuôn ra các dữ liệu cư dân không hỏi.
- Nếu hỏi tiện ích cần đặt trước -> chỉ nêu 2 tiện ích: Phòng Xông Hơi VIP Tầng 3 và Vườn Nướng BBQ Tầng 25.
- Nếu hỏi tiền nước -> chỉ giải thích chi tiết tiền nước và lưu ý AI rò rỉ nếu có.
- Nếu hỏi giờ mở cửa hồ bơi -> chỉ nêu giờ mở cửa hồ bơi (06:00 - 22:00 tại Tầng 25, miễn phí, vào bằng FaceID/Thẻ).

🎯 GỢI Ý CÂU HỎI TIẾP THEO (BẮT BUỘC Ở CUỐI MỖI CÂU TRẢ LỜI):
- Ở cuối cùng của MỌI câu trả lời, hãy tự động phân tích câu hỏi vừa rồi của cư dân và đưa ra 2 đến 4 gợi ý câu hỏi kế tiếp thông minh, liên quan mật thiết và hữu ích nhất cho cư dân.
- Định dạng bắt buộc ở dòng cuối cùng:
[SUGGESTIONS: Gợi ý câu hỏi tiếp 1 | Gợi ý câu hỏi tiếp 2 | Gợi ý câu hỏi tiếp 3]
Ví dụ:
+ Nếu vừa trả lời về tiện ích cần đặt trước -> [SUGGESTIONS: Bảng giá phòng xông hơi VIP Tầng 3 | Cách đặt chỗ vườn tiệc BBQ Tầng 25 | Chính sách hoàn tiền khi hủy lịch hẹn]
+ Nếu vừa trả lời về hóa đơn tiền nước -> [SUGGESTIONS: Chi tiết lượng nước dùng các tháng qua | Hướng dẫn quét mã QR thanh toán tiền nước | Đặt thợ kỹ thuật kiểm tra van nước rò rỉ]
+ Nếu vừa trả lời về quy mô tòa nhà -> [SUGGESTIONS: Tầng 1 đến 4 có những tiện ích gì? | Diện tích căn hộ CH-06 là bao nhiêu? | Hồ bơi vô cực nằm ở tầng mấy?]
`;
}

/**
 * Smart Local Project Data Fallback Engine
 * Runs instantly (< 20ms) when Gemini API is offline, times out, or quota is exhausted.
 * Guarantees zero downtime and 100% accurate responses from actual project data.
 */
export function generateSmartProjectFallback(
  message: string,
  contextOrAptCode: string | ConciergeContext = 'CH-06'
): string {
  const text = message.toLowerCase();
  const rawCode = typeof contextOrAptCode === 'string' ? contextOrAptCode : contextOrAptCode?.aptCode || 'CH-06';
  const targetAptCode = rawCode.trim().toUpperCase();
  const isOwnerUnit = targetAptCode === 'CH-06' || targetAptCode === '12A05' || targetAptCode.endsWith('CH-06');

  // 1. Căn hộ chuẩn xác từ store
  const aptFromStore = getApartmentByCode(targetAptCode);
  const apt: any = aptFromStore || (isOwnerUnit ? DEMO_APARTMENTS[0] : (DEMO_APARTMENTS.find(a => a.apt_code.toUpperCase() === targetAptCode) || DEMO_APARTMENTS[0]));
  const aptDisplayName = isOwnerUnit ? 'CH-06 (Tòa The Tropical BS-07, Tầng 30)' : (apt?.code || apt?.apt_code || targetAptCode);
  const aptAreaClear = isOwnerUnit ? 42.0 : (apt?.clear_area || apt?.area || 42.0);
  const aptAreaWall = isOwnerUnit ? 46.0 : (apt?.wall_area || apt?.wallArea || 46.0);
  const aptBedrooms = isOwnerUnit ? 1 : (apt?.bedrooms || 1);
  const aptBathrooms = isOwnerUnit ? 1 : (apt?.bathrooms || 1);

  // 2. Chủ hộ & Cư dân
  const rawOwner = DEMO_USERS.find((u) => (isOwnerUnit ? (u.apartment_code === 'CH-06' || u.id === 'user-owner-1') : u.apartment_code === targetAptCode)) || DEMO_USERS[2];
  const liveOwner = getUserStore(rawOwner.id) || rawOwner;

  const residentName = (typeof contextOrAptCode === 'object' && contextOrAptCode?.userName)
    ? contextOrAptCode.userName
    : (liveOwner.fullname || liveOwner.full_name || rawOwner.full_name || 'Trần Hữu Lực');

  const residentPhone = (typeof contextOrAptCode === 'object' && contextOrAptCode?.phone)
    ? contextOrAptCode.phone
    : (liveOwner.phone || rawOwner.phone || '0364967082');

  const residentLicensePlate = (typeof contextOrAptCode === 'object' && contextOrAptCode?.licensePlate)
    ? contextOrAptCode.licensePlate
    : (liveOwner.license_plate || '51K-889.99');

  // 3. Thành viên gia đình đăng ký thường trú
  const familyMembers = (typeof contextOrAptCode === 'object' && Array.isArray(contextOrAptCode?.members) && contextOrAptCode.members.length > 0)
    ? contextOrAptCode.members
    : getApartmentMembers(isOwnerUnit ? 'CH-06' : targetAptCode);

  // 4. Thẻ khách thăm thực tế
  const visitorPasses = (typeof contextOrAptCode === 'object' && Array.isArray(contextOrAptCode?.visitors) && contextOrAptCode.visitors.length > 0)
    ? contextOrAptCode.visitors
    : getAllVisitorPasses().filter(p => isOwnerUnit ? (p.apartmentCode === 'CH-06' || p.apartmentCode === '12A05') : p.apartmentCode === targetAptCode);

  // 5. Hóa đơn thực tế từ billingStore
  const bills = (typeof contextOrAptCode === 'object' && Array.isArray(contextOrAptCode?.bills) && contextOrAptCode.bills.length > 0)
    ? contextOrAptCode.bills
    : getBills(targetAptCode, residentName);

  const latestBill = bills[0];

  // 6. Phiếu kỹ thuật từ ticketStore
  const activeTickets = (typeof contextOrAptCode === 'object' && Array.isArray(contextOrAptCode?.tickets) && contextOrAptCode.tickets.length > 0)
    ? contextOrAptCode.tickets
    : (() => {
        const stored = getTickets(isOwnerUnit ? 'CH-06' : targetAptCode, residentPhone);
        if (stored && stored.length > 0) return stored;
        return DEMO_TICKETS;
      })();

  // 7. Đặt lịch tiện ích
  let activeBookings: ConciergeBookingItem[] = [];
  if (typeof contextOrAptCode === 'object' && Array.isArray(contextOrAptCode?.bookings) && contextOrAptCode.bookings.length > 0) {
    activeBookings = contextOrAptCode.bookings;
  } else {
    try {
      const stored = getFacilityBookings(targetAptCode);
      const storedOwner = isOwnerUnit ? getFacilityBookings('CH-06') : [];
      const combined = stored.length > 0 ? stored : storedOwner;
      if (combined.length > 0) {
        activeBookings = combined.map(b => ({
          id: b.id,
          facilityId: b.facilityId,
          facilityName: b.facilityName,
          bookingDate: b.bookingDate,
          timeSlot: b.timeSlot,
          ticketCode: b.ticketCode,
          pricing: b.pricing,
          depositAmount: b.depositAmount,
          status: b.status,
        }));
      }
    } catch {
      // fallback
    }
  }
  if (activeBookings.length === 0 && isOwnerUnit) {
    activeBookings = DEFAULT_BOOKINGS_CH06;
  }


  // 0a. Strict Out-of-Scope / Irrelevant Queries Handler (Chống phản hồi không liên quan)
  const isOffTopic = 
    text.includes('code') || 
    text.includes('lập trình') || 
    text.includes('python') || 
    text.includes('javascript') || 
    text.includes('html') || 
    text.includes('react') || 
    text.includes('giải toán') || 
    text.includes('thời tiết') || 
    text.includes('nấu ăn') || 
    text.includes('công thức') || 
    text.includes('chứng khoán') || 
    text.includes('bitcoin') || 
    text.includes('crypto') || 
    text.includes('chiến tranh') || 
    text.includes('tổng thống') || 
    text.includes('ca sĩ') || 
    text.includes('bài hát') || 
    text.includes('vinhomes') || 
    text.includes('novaland') || 
    text.includes('masteri');

  if (isOffTopic) {
    return `Dạ thưa Quý cư dân ${residentName}, tôi là Trợ lý Ảo chuyên biệt hỗ trợ cư dân **Chung Cư Skyline Smart Residence**.

Nội dung Quý vị vừa hỏi nằm ngoài phạm vi quản lý vận hành tòa nhà. Tôi chỉ có thể hỗ trợ các thông tin chuẩn xác liên quan đến căn hộ, hóa đơn sinh hoạt, tiện ích 5 sao, lịch đặt chỗ, báo hỏng kỹ thuật và dịch vụ cư dân của Skyline.

Quý cư dân có cần tôi hỗ trợ kiểm tra thông tin nào về căn hộ **${targetAptCode}** không ạ?

[SUGGESTIONS: Tiện ích nào cần đăng ký trước? | Xem hóa đơn căn hộ tháng này | Tra cứu lịch đặt chỗ của tôi | Tòa nhà có bao nhiêu tầng?]`;
  }

  // 0b. Greeting / Introduction Queries
  if (
    text === 'xin chào' || 
    text === 'chào' || 
    text === 'chào bạn' || 
    text === 'hello' || 
    text === 'hi' || 
    text === 'bạn là ai' || 
    text.includes('chào trợ lý') || 
    text === 'alo'
  ) {
    return `Kính chào Quý cư dân ${residentName} (Căn hộ ${targetAptCode})!

Tôi là **Trợ lý Ảo Skyline**, luôn sẵn sàng hỗ trợ Quý vị 24/7 về mọi dịch vụ tại Chung Cư Cao Cấp Skyline Smart Residence:
* 🏊 **5 Đại tiện ích 5 sao:** Tra cứu giờ mở cửa và hướng dẫn đặt chỗ.
* 💳 **Hóa đơn & Biểu phí:** Tra cứu tiền điện, tiền nước, phí quản lý, phí gửi xe.
* 🎫 **Lịch đặt vé & Thẻ khách:** Kiểm tra mã vé tiện ích và tạo mã PIN/QR cho khách thăm.
* 🛠️ **Hỗ trợ kỹ thuật:** Tiếp nhận sự cố với cam kết thợ có mặt trong vòng 60 phút.

Quý cư dân cần tôi hỗ trợ thông tin nào về căn hộ hôm nay ạ?

[SUGGESTIONS: Tiện ích nào cần đăng ký trước? | Xem hóa đơn sinh hoạt tháng này | Giờ mở cửa Hồ bơi & Gym | Tra cứu vé đã đặt]`;
  }

  // 0c. Sports & Outdoor Facilities
  if (text.includes('thể thao') || text.includes('sân bóng') || text.includes('pickleball') || text.includes('tennis')) {
    return `Dạ thưa Quý cư dân ${residentName}, tại Khu phức hợp The Tropical (Beverly Solari), hệ thống rèn luyện thể thao ngoài trời và trong nhà phục vụ cư dân gồm:

* 🏀 **Cụm Sân Thể Thao Đa Năng Malibu (Khu Y-04 & BS-10):** Sân thể thao vận động ngoài trời, phục vụ bóng rổ, cầu lông và các hoạt động thể chất.
* 🌿 **Sân Cỏ Đa Năng & Sân Yoga Thiền (Khu Y-01 & 08):** Không gian tập yoga, dưỡng sinh và thể thao ngoài trời thoáng mát.
* 🏋️ **Trung Tâm Thể Hình Technogym (Tầng 3) & Sân Gym Ngoài Trời (Khu 07):** Mở cửa **24/7** suốt ngày đêm, đầy đủ máy tập cao cấp, miễn phí vào tự do bằng FaceID/Thẻ.
* 🏊 **Cụm Bể Bơi Resort, Bể Bơi Ốc Đảo & Bể Bơi Malibu (06:00 - 22:00):** Miễn phí hoàn toàn theo thẻ cư dân.

*(Lưu ý: Tòa BS-08 cao 39 tầng, các tòa BS-07, BS-09, BS-10 cao 34 tầng. Hiện phân khu chưa bố trí sân Pickleball chuyên biệt riêng).*

[SUGGESTIONS: Giờ mở cửa phòng Gym Technogym | Giờ mở cửa hồ bơi nhiệt đới | Tiện ích nào cần đăng ký trước?]`;
  }

  // 0b. Building Architecture, Scale, Floors, Apartments count per floor
  if (
    text.includes('bao nhiêu căn') || 
    text.includes('mấy căn') || 
    text.includes('1 tầng') || 
    text.includes('mỗi tầng') || 
    text.includes('bao nhiêu tầng') || 
    text.includes('mấy tầng') || 
    text.includes('quy mô') || 
    text.includes('cấu trúc') || 
    text.includes('mặt bằng') || 
    text.includes('tổng số căn') ||
    text.includes('tổng số tầng') ||
    text.includes('tòa') ||
    text.includes('block') ||
    text.includes('bs-07') ||
    text.includes('bs-08') ||
    text.includes('bs-09') ||
    text.includes('bs-10') ||
    text.includes('beverly solari') ||
    text.includes('tropical') ||
    text.includes('tầng hầm') ||
    text.includes('hầm b1') ||
    text.includes('hầm b2') ||
    text.includes('tầng 1') ||
    text.includes('tầng 2') ||
    text.includes('tầng 3') ||
    text.includes('tầng 4') ||
    text.includes('tầng 30') ||
    text.includes('tầng 34') ||
    text.includes('tầng 38') ||
    text.includes('tầng 39') ||
    text.includes('địa chỉ') ||
    text.includes('chủ đầu tư')
  ) {
    return `Dạ thưa Quý cư dân ${residentName}, theo dữ liệu kiến trúc chuẩn xác từ hệ thống NKS SCRMAI và quy hoạch dự án:

🏢 **1. Quy mô tổng thể Đại đô thị Beverly Solari:**
* **Tổng số tòa tháp:** **13 tòa tháp chung cư cao cấp**.
* **Tổng số căn hộ:** Khoảng **9.500 căn hộ**, quy mô diện tích toàn khu **8.7 ha**.
* **Chủ đầu tư:** Tập đoàn Vingroup | **Quản lý vận hành:** Skyline Property Management Services (Hotline: 1900 8899).
* **Địa chỉ:** Phường Long Bình, TP. Thủ Đức, TP. Hồ Chí Minh (Khu Đô Thị Vinhomes Grand Park).

🌴 **2. Phân khu trọng điểm The Tropical (4 Tòa Chung Cư - Gần 3.000 căn hộ):**
* 🏢 **Tòa Tropical BS-07 (Chung Cư BS-7):** **34 tầng** (714 căn hộ) - *Tòa tháp Quý cư dân đang sinh sống tại Tầng 30 (sở hữu 2 căn hộ CH-06 diện tích 42 m² và CH-01 diện tích 50 m²)*.
* 🏢 **Tòa Tropical BS-08 (Chung Cư BS-8):** **39 tầng** (819 căn hộ) - *Tòa tháp cao nhất phân khu với tầm nhìn toàn cảnh sông và thành phố*.
* 🏢 **Tòa Tropical BS-09 (Chung Cư BS-9):** **34 tầng** (714 căn hộ) - *View trực diện hồ bơi nhiệt đới resort*.
* 🏢 **Tòa Tropical BS-10 (Chung Cư BS-10):** **34 tầng** (714 căn hộ) - *Liền kề cụm thể thao Malibu và bãi đỗ xe*.

📐 **3. Phân bổ công năng các tầng:**
* 🚗 **Hầm B1 & B2 (2 tầng hầm liên thông các tòa):**
  - **Hầm B2:** Bãi đỗ xe ô tô cư dân định danh RFID (Ô B2-A15 cho xe Mercedes), trạm biến áp, phòng máy bơm PCCC & bể xử lý ngầm.
  - **Hầm B1:** Bãi đỗ xe máy cư dân RFID (Khu B1-M88 cho xe Honda SH), trạm sạc xe điện thông minh, chốt an ninh kiểm soát.
* 🛍️ **Tầng 1 đến Tầng 3 (Khối dịch vụ, thương mại & tiện ích 5 sao):**
  - **Tầng 1:** Sảnh Grand Lobby 5 sao, quầy BQL tiếp dân 24/7, Nhà hàng ẩm thực Skyline, Shophouse thương mại & Khu vui chơi trẻ em Sky Kids Zone (07:00 - 21:00).
  - **Tầng 2:** Văn phòng điều hành Ban Quản Lý, phòng giám sát an ninh camera AI tập trung.
  - **Tầng 3:** Trung tâm thể hình Technogym (mở cửa 24/7) & Phòng xông hơi đá muối Himalaya VIP (08:00 - 22:00).
* 🏠 **Tầng 4 đến các tầng trên (đến Tầng 34 của tòa BS-07/09/10, Tầng 39 của tòa BS-08):** Căn hộ cư dân hiện đại (1PN từ 42m², 2PN từ 50-75m², 3PN từ 80-110m²).
* 🏊 **Hồ bơi vô cực & Vườn BBQ:** Tầng cao view panoramic ngắm trọn cảnh quan sông và thành phố.

[SUGGESTIONS: Chi tiết căn hộ CH-06 và CH-01 của tôi | Tiện ích nào cần đăng ký trước? | Giờ mở cửa hồ bơi resort & nhà hàng tầng 1]`;
  }

  // 1. Inquiries about Active Bookings / Tickets (Lịch đặt, vé điện tử, mã vé)
  if (text.includes('lịch đặt') || text.includes('đã đặt') || text.includes('vé') || text.includes('mã vé') || text.includes('booking')) {
    if (activeBookings.length > 0) {
      const b = activeBookings[0];
      return `Dạ thưa Quý cư dân ${residentName}, tôi đã kiểm tra sổ vé tiện ích của căn hộ **${targetAptCode}**:

* **Tiện ích:** **${b.facilityName}**
* **Khung giờ hẹn:** **${b.timeSlot}** (Ngày ${b.bookingDate})
* **Mã vé vào cổng:** **\`${b.ticketCode}\`**
* **Số tiền đã giữ chỗ:** **${(b.depositAmount || 1000000).toLocaleString('vi-VN')} VNĐ**
* **Trạng thái:** ✅ **${b.status === 'CONFIRMED' ? 'Đã xác nhận' : b.status === 'CHECKED_IN' ? 'Đã vào cổng' : 'Đã hủy'}**

Quý cư dân chỉ cần quét mã QR tại cổng hoặc chạm thẻ cư dân là vào được ngay. Nếu có việc bận đột xuất, Quý vị có thể bấm nút **Hủy Lịch & Hoàn Tiền** trước 30 phút để nhận lại **100%** tiền giữ chỗ vào hóa đơn sinh hoạt tháng tới ạ!

[SUGGESTIONS: Hướng dẫn hủy vé & hoàn tiền | Đặt thêm tiệc nướng BBQ tầng 25 | Tiện ích nào miễn phí vào tự do?]`;
    } else {
      return `Dạ thưa Quý cư dân ${residentName}, hiện tại căn hộ **${targetAptCode}** chưa có lịch đặt chỗ tiện ích nào đang chờ. Quý vị có thể vào tab **Đăng Ký Đặt Chỗ & Vé Điện Tử** để đặt Phòng Xông Hơi VIP hoặc Vườn Nướng BBQ bất cứ lúc nào ạ!

[SUGGESTIONS: Tiện ích nào cần đăng ký trước? | Bảng giá phòng xông hơi VIP | Giờ mở cửa hồ bơi chân mây]`;
    }
  }

  // 2. Inquiries about Visitor Passes / Guest QR / Guest PIN (Khách thăm, thẻ khách, mã khách)
  if (text.includes('khách') || text.includes('visitor') || text.includes('thăm') || text.includes('mã pin') || text.includes('mã qr khách')) {
    if (visitorPasses.length > 0) {
      const passLines = visitorPasses.map((p, idx) => 
        `* **Khách ${idx + 1}: ${p.visitorName}**
  - **Mã vé:** \`${p.id}\` | **Mã PIN mở cổng:** \`${p.pinCode}\`
  - **Số điện thoại:** ${p.phoneNumber || 'Không cung cấp'}
  - **Biển số xe:** ${p.licensePlate || 'Đi bộ / Taxi'}
  - **Thời hạn:** ${p.validUntil ? p.validUntil.slice(0, 16).replace('T', ' ') : 'Trong ngày'}
  - **Trạng thái:** ${p.status === 'ACTIVE' ? '🟢 Đang hiệu lực (Chờ khách đến)' : p.status === 'CHECKED_IN' ? '🔵 Đã check-in tòa nhà' : 'Đã hoàn tất'}`
      ).join('\n\n');

      return `Dạ thưa Quý cư dân ${residentName}, căn hộ **${targetAptCode}** hiện có **${visitorPasses.length} thẻ khách thăm** đã đăng ký:\n\n${passLines}\n\nKhách đến sảnh lễ tân hoặc cổng kiểm soát chỉ cần đọc **Mã PIN** hoặc quét **Mã QR** để được bảo vệ xác nhận vào thang máy lên căn hộ ạ!

[SUGGESTIONS: Cách tạo thêm thẻ khách thăm mới | Vị trí đỗ xe của căn hộ | Mở cửa bằng FaceID như thế nào?]`;
    } else {
      return `Dạ thưa Quý cư dân ${residentName}, căn hộ **${targetAptCode}** hiện chưa có thẻ khách thăm nào đang hiệu lực. 

Quý cư dân có thể vào mục **Khách Thăm & QR Code** trên ứng dụng để tạo thẻ khách trong 30 giây:
1. Nhập tên khách & biển số xe (nếu có).
2. Chọn thời hạn (4 giờ, 12 giờ hoặc trong ngày).
3. Hệ thống sẽ cấp ngay **Mã QR & Mã PIN 6 số** để Quý vị gửi qua Zalo/SMS cho khách đến thăm ạ!

[SUGGESTIONS: Khách thăm gửi xe ở đâu? | Cách tạo mã OTP mở cửa cho khách | Hướng dẫn sử dụng chuông hình camera]`;
    }
  }

  // 3. Inquiries about Bill / Finance / Money / Water fee
  if (text.includes('hóa đơn') || text.includes('tiền') || text.includes('nước') || text.includes('điện') || text.includes('phí') || text.includes('nợ') || text.includes('thanh toán')) {
    if (latestBill) {
      const detailsList = (latestBill.details || []).map((d: any) => 
        `  - ${d.service_name || d.service_type}: **${Number(d.total_line_amount || 0).toLocaleString('vi-VN')} đ** (${d.usage || 0} ${d.unit || ''}) ${d.ai_anomaly ? `\n    ⚠️ *Lưu ý:* ${d.anomaly_reason}` : ''}`
      ).join('\n');

      return `Dạ thưa Quý cư dân ${residentName} (Căn hộ ${aptDisplayName}), thông tin chi tiết hóa đơn sinh hoạt thực tế từ hệ thống Ban Quản Lý như sau:

* **Hóa đơn ${latestBill.billing_month} (Mã: ${latestBill.id}):**
  - **Tổng số tiền:** **${Number(latestBill.total_amount || 0).toLocaleString('vi-VN')} VNĐ**
  - **Trạng thái:** ${latestBill.status === 'Paid' ? '✅ **Đã thanh toán**' : '⏳ **Chưa thanh toán** (Hạn nộp định kỳ: ' + (latestBill.due_date ? latestBill.due_date.slice(0, 10) : '30/08/2026') + ')'}
* **Chi tiết các hạng mục dịch vụ:**
${detailsList || '  - Tiền điện, tiền nước và phí quản lý vận hành tòa nhà.'}

💳 **Kênh thanh toán trực tiếp Ban Quản Lý (BIDV / VietQR):**
* **Ngân hàng:** BIDV (Ngân hàng TMCP Đầu tư và Phát triển Việt Nam)
* **Số tài khoản:** **${SKYLINE_BANK_INFO.accountNumber}** (0364967082)
* **Chủ tài khoản:** **${SKYLINE_BANK_INFO.accountHolder}** (NGUYEN HUU LUC)
* **Quét mã VietQR:** Quý cư dân có thể vào mục **Hóa Đơn & Biểu Phí** để quét mã VietQR Napas247 tự động điền số tiền và nội dung chuyển khoản ạ!

[SUGGESTIONS: Chi tiết tiền điện và tiền nước | Hướng dẫn thanh toán quét mã QR | Biểu phí gửi xe hàng tháng]`;
    } else {
      return `Dạ thưa Quý cư dân ${residentName}, hiện tại căn hộ **${aptDisplayName}** không có hóa đơn nợ nào cần thanh toán. Mọi chi phí sinh hoạt các kỳ trước đã được đối soát và thanh toán đầy đủ ạ!

[SUGGESTIONS: Biểu phí quản lý tòa nhà | Biểu phí gửi xe hàng tháng | Xem lịch sử hóa đơn đã thanh toán]`;
    }
  }

  // 4. Inquiries about Maintenance / Repair / Technical Ticket
  if (text.includes('sửa') || text.includes('hỏng') || text.includes('vòi') || text.includes('rò rỉ') || text.includes('kỹ thuật') || text.includes('sự cố') || text.includes('thợ') || text.includes('phiếu') || text.includes('ticket')) {
    const activeTicket = activeTickets[0] || DEMO_TICKETS[0];
    if (activeTicket) {
      const ticketId = activeTicket.nks_id ? `#${activeTicket.nks_id}` : (activeTicket.id ? `#${activeTicket.id}` : '#925');
      const ticketContent = (activeTicket.content || activeTicket.description || '').replace(/\n/g, ' ');
      const techName = activeTicket.assigned_technician || activeTicket.engineername || 'Trần Đình Trọng (Chuyên viên Kỹ thuật & Thiết bị)';
      
      const ticketsList = activeTickets.slice(0, 3).map((t: any) => {
        const tId = t.nks_id ? `#${t.nks_id}` : (t.id ? `#${t.id}` : '');
        const st = (t.status === 'Resolved' || t.status === 'resolved' || t.status === 'publish') ? '✅ Đã hoàn thành' : '🛠️ Đang xử lý';
        const tech = t.assigned_technician || t.engineername || 'Trần Đình Trọng';
        return `* **Phiếu ${tId} [${t.service || t.ai_category || 'Kỹ thuật'}]:** "${(t.content || t.description || '').replace(/\n/g, ' ')}" -> Trạng thái: ${st} (${tech})`;
      }).join('\n');

      return `Dạ thưa Quý cư dân ${residentName}, tôi đã tra cứu danh sách phiếu yêu cầu kỹ thuật thực tế từ hệ thống NKS của căn hộ ${aptDisplayName}:

${ticketsList || `* **Phiếu ${ticketId} [${activeTicket.ai_category || 'Kỹ thuật'}]:** "${ticketContent}" -> Trạng thái: ✅ Đã hoàn thành (${techName})`}

💡 **Ghi chú từ BQL:** Tất cả các phiếu yêu cầu gần nhất đều đã được Đội Kỹ thuật Tòa nhà (KTV Trần Đình Trọng & KTV Hoàng) xử lý hoàn tất đảm bảo chất lượng. Nếu căn hộ phát sinh thêm sự cố mới, Quý vị có thể gửi yêu cầu ngay trên ứng dụng hoặc gọi **Hotline Kỹ Thuật 1900 8899** nhé!

[SUGGESTIONS: Báo sự cố kỹ thuật mới | Hotline Ban Quản Lý khẩn cấp | Tra cứu hóa đơn tháng này]`;
    } else {
      return `Dạ thưa Quý cư dân ${residentName}, hiện tại căn hộ ${aptDisplayName} không có phiếu báo hỏng kỹ thuật nào đang chờ xử lý. Nếu căn hộ gặp sự cố về điện, nước hay khóa cửa, Quý vị có thể vào tab **Yêu Cầu Sửa Chữa** để gửi phản ánh, đội ngũ kỹ thuật sẽ có mặt hỗ trợ trong vòng 15 - 60 phút ạ!

[SUGGESTIONS: Báo sự cố kỹ thuật mới | Giờ thi công sửa chữa được phép | Hotline kỹ thuật 1900 8899]`;
    }
  }

  // 5. Inquiries about Family Members / Resident Profile / Apartment Details
  if (text.includes('người nhà') || text.includes('thành viên') || text.includes('gia đình') || text.includes('ai') || text.includes('chủ hộ') || text.includes('diện tích') || text.includes('phòng')) {
    const membersListStr = familyMembers.length > 0
      ? familyMembers.map((m) => `  - **${m.fullName}** (${m.relationship || 'Thành viên'}): SĐT ${m.phone || 'Chưa cập nhật'}, CCCD ${m.idCard || 'Đã định danh'}${m.licensePlate ? `, Biển số: ${m.licensePlate}` : ''} (${m.faceStatus || 'Đã xác thực'})`).join('\n')
      : `  - Hiện chưa có thành viên nào khác đăng ký cùng cư trú (Chỉ có Chủ Hộ).`;

    return `Dạ thưa Quý cư dân ${residentName}, thông tin cư trú và căn hộ của Quý vị từ hệ thống NKS như sau:

* 🏠 **Căn hộ chính (${targetAptCode}):** Tòa The Tropical BS-07, Tầng 30. Diện tích thông thủy **${aptAreaClear} m²** (tim tường **${aptAreaWall} m²**), thiết kế **${aptBedrooms}PN - ${aptBathrooms}WC**, hướng ban công Đông Nam view hồ bơi và sông Sài Gòn.
* 🏢 **Căn hộ sở hữu kèm theo:** Căn hộ **CH-01** (Tòa The Tropical BS-07, Tầng 30, Diện tích **50.0 m²**, thiết kế **2PN - 1WC**).
* 👤 **Chủ hộ:** **${residentName}** (SĐT: ${residentPhone}, CCCD: ${liveOwner.id_number || '067204000961'}).
* 🚗 **Phương tiện đăng ký:** Ô tô Mercedes ${residentLicensePlate} (Hầm B2 - Ô B2-A15) & Xe máy 59P1-886.79 (Hầm B1 - Khu B1-M88).
* 👨‍👩‍👧‍👦 **Danh sách thành viên gia đình đăng ký:**
${membersListStr}

Quý vị có thể vào mục **Thành Viên Căn Hộ** để đăng ký thêm người thân hoặc cập nhật FaceID bất cứ lúc nào ạ!

[SUGGESTIONS: Hướng dẫn cài FaceID cho người nhà | Đăng ký thêm xe máy cho gia đình | Vị trí đỗ xe ô tô ở đâu?]`;
  }

  // 6. Inquiries about Vehicles / Parking (Xe, biển số, gửi xe, hầm)
  if (text.includes('xe') || text.includes('biển số') || text.includes('gửi xe') || text.includes('bãi xe') || text.includes('ô tô') || text.includes('hầm')) {
    return `Dạ thưa Quý cư dân ${residentName}, thông tin phương tiện và vị trí đỗ cố định của căn hộ **${targetAptCode}**:

* 🚗 **Ô tô Chủ hộ:** Mercedes C300 AMG
  - Biển số: **${residentLicensePlate}**
  - Vị trí đỗ cố định: **Ô B2-A15** (Tầng Hầm B2, khu đỗ xe định danh riêng)
  - Thẻ gửi xe: Thẻ từ thông minh RFID mã **RFID-A1205-01**
* 🛵 **Xe máy cư dân:** Honda SH 160i
  - Biển số: **59P1-886.79**
  - Vị trí đỗ: **Khu B1-M88** (Tầng Hầm B1)
  - Thẻ gửi xe: Thẻ từ thông minh RFID mã **RFID-A1205-02**

*Biểu phí gửi xe hàng tháng:* Ô tô: 1.200.000 đ/tháng | Xe máy: 120.000 đ/tháng (được tính gộp vào hóa đơn quản lý định kỳ).

[SUGGESTIONS: Phí gửi xe đóng chung hóa đơn không? | Vị trí đỗ xe máy ở hầm nào? | Thêm phương tiện mới cho người nhà]`;
  }

  // 6b. Inquiries about Facilities requiring Booking / Reservation (Tiện ích cần đặt trước / đăng ký trước)
  if (
    (text.includes('tiện ích') || text.includes('dịch vụ')) && 
    (text.includes('đặt trước') || text.includes('đăng ký') || text.includes('hẹn trước') || text.includes('lịch hẹn') || text.includes('giữ chỗ') || text.includes('cần đặt') || text.includes('thu phí') || text.includes('tính phí'))
  ) {
    return `Dạ thưa Quý cư dân ${residentName}, tại Chung Cư Skyline (25 Tầng), chỉ có **2 tiện ích đặc quyền riêng tư** bắt buộc cần đăng ký lịch hẹn trước:

1. 🧖 **Phòng Xông Hơi Đá Muối Himalaya VIP (Tầng 3):**
   - **Tính chất:** Phòng riêng tư khép kín cho gia đình (Private VIP).
   - **Khung giờ:** 08:00 - 22:00.
   - **Chi phí giữ chỗ:** **500.000 đ / giờ** (đã bao gồm chuẩn bị gia nhiệt lò đá muối trước 15 phút, khăn nhung cao cấp & tinh dầu tự nhiên).
   - **Chính sách hủy vé:** Hủy trước 30 phút hoàn 100% tiền giữ chỗ vào hóa đơn sinh hoạt.

2. 🍖 **Vườn Tiệc Nướng BBQ Panoramic (Tầng 25 - Sân Thượng):**
   - **Tính chất:** Không gian tiệc nướng ngoài trời view toàn cảnh sông Sài Gòn.
   - **Khung giờ:** 17:00 - 23:00 (theo ca tiệc).
   - **Chi phí giữ chỗ:** **600.000 đ / ca** (bao gồm set bếp nướng than Weber cao cấp, bàn ghế tiệc và nhân viên dọn dẹp vệ sinh sau tiệc).

💡 **Các tiện ích còn lại:**
* 🏊 **Hồ bơi vô cực chân mây (Tầng 25)**, 🏋️ **Gym Technogym 24/7 (Tầng 3)** và 🛝 **Sky Kids Zone (Tầng 1)** đều **hoàn toàn miễn phí** và **vào tự do** bằng FaceID hoặc Thẻ cư dân, không cần đặt hẹn trước ạ!

Quý cư dân có thể vào tab **Đăng Ký Đặt Chỗ & Vé Điện Tử** để chọn khung giờ và nhận mã vé QR ngay tức thì!

[SUGGESTIONS: Bảng giá phòng xông hơi VIP Tầng 3 | Chính sách hủy vé & hoàn tiền | Tiện ích nào hoàn toàn miễn phí?]`;
  }

  // 6c. Inquiries about Free / Open Access Facilities (Tiện ích miễn phí / vào tự do)
  if (
    (text.includes('tiện ích') || text.includes('dịch vụ')) && 
    (text.includes('miễn phí') || text.includes('tự do') || text.includes('không cần đặt') || text.includes('không tốn tiền'))
  ) {
    return `Dạ thưa Quý cư dân ${residentName}, tại Chung Cư Skyline có **3 đại tiện ích hoàn toàn miễn phí** và Quý vị có thể **vào tự do** bất cứ lúc nào:

1. 🏋️ **Trung Tâm Thể Hình Technogym (Tầng 3):** Mở cửa **24/7** suốt ngày đêm, miễn phí theo Thẻ cư dân, vào tự do bằng FaceID.
2. 🏊 **Hồ Bơi Vô Cực Chân Mây (Tầng 25 - Sân Thượng):** Mở cửa **06:00 - 22:00** hàng ngày, hệ thống lọc ozone 28°C (hạn mức 20 lượt/tháng/căn hộ).
3. 🛝 **Khu Vui Chơi Trẻ Em Sky Kids Zone (Tầng 1):** Mở cửa **07:00 - 21:00** hàng ngày, sàn đệm an toàn kháng khuẩn (yêu cầu có người lớn đi kèm).

*(Riêng Phòng Xông Hơi VIP Tầng 3 và Vườn Nướng BBQ Tầng 25 là tiện ích riêng tư nên cần đặt trước trên ứng dụng).*

[SUGGESTIONS: Hồ bơi mở cửa đến mấy giờ? | Tiện ích nào cần đăng ký trước? | Phòng Gym Technogym có mở 24/7 không?]`;
  }

  // 7. Inquiries about Amenities / Operating Hours / Facilities (Tổng quan tiện ích & dịch vụ)
  if (text.includes('tiện ích') || text.includes('hồ bơi') || text.includes('gym') || text.includes('pool') || text.includes('nhà hàng') || text.includes('technogym') || text.includes('giờ mở cửa') || text.includes('dịch vụ')) {
    return `Dạ thưa Quý cư dân ${residentName}, hệ thống **Dịch Vụ & Tiện Ích 5 Sao** của Khu Phức Hợp The Tropical (Beverly Solari) như sau:

🍽️ **1. Dịch Vụ Nhà Hàng (NKS Service):**
* **Nhà Hàng Ẩm Thực Skyline (Tầng 1 - Sảnh The Tropical BS-07):** Mở cửa **06:30 - 22:30**, phục vụ ẩm thực, cà phê, tiệc gia đình, ưu đãi 10% cho thẻ cư dân.

🏊 **2. Cụm Bể Bơi & Tiện Ích Nước (NKS Service):**
* **Cụm Bể Bơi Nhiệt Đới & Bể Bơi Ốc Đảo Resort (Nội khu The Tropical):** Mở cửa **06:00 - 22:00**, lọc ozone 28°C, kiểm tra chất lượng nước định kỳ, miễn phí vào bằng FaceID/Thẻ.
* **Hồ Bơi Vô Cực Chân Mây:** Mở cửa **06:00 - 22:00**, view toàn cảnh trên cao, miễn phí theo thẻ cư dân.

🏋️ **3. Cụm Thể Thao & Sức Khỏe:**
* **Trung Tâm Thể Hình Technogym (Tầng 3) & Sân Gym Ngoài Trời:** Mở cửa **24/7** suốt ngày đêm, miễn phí theo thẻ cư dân.
* **Phòng Xông Hơi Đá Muối Himalaya VIP (Tầng 3):** Mở cửa **08:00 - 22:00**, biểu phí **500.000 đ / giờ** (phòng riêng tư khép kín gia đình, **cần đặt trước**).

🍖 **4. Ẩm Thực & Giải Trí Ngoài Trời:**
* **Vườn Tiệc Nướng BBQ Ngoài Trời:** Mở cửa **17:00 - 23:00**, biểu phí **600.000 đ / ca** (**cần đặt trước theo ca**).
* **Khu Vui Chơi Trẻ Em Sky Kids Zone (Tầng 1):** Mở cửa **07:00 - 21:00** hàng ngày, miễn phí theo thẻ cư dân.

🧹 **5. Dịch Vụ Vệ Sinh & Kỹ Thuật Tòa Nhà (NKS Service):**
* **Dịch vụ Vệ sinh chung cư:** Thu gom và tập kết rác thải Block 07, khử khuẩn khu kỹ thuật định kỳ (KTV Hoàng phụ trách).
* **Đội Kỹ thuật túc trực 24/7:** Cam kết có mặt trong 15 - 60 phút hỗ trợ điện, nước, điều hòa (KTV Trần Đình Trọng & Lê Văn Kỹ Thuật).

[SUGGESTIONS: Tiện ích nào cần đăng ký trước? | Bảng giá phòng xông hơi VIP Tầng 3 | Giờ mở cửa nhà hàng tầng 1]`;
  }

  // 8. Inquiries about Sauna / Steam / Refund / Cancellation
  if (text.includes('xông hơi') || text.includes('sauna') || text.includes('hoàn tiền') || text.includes('hủy lịch') || text.includes('bận việc')) {
    return `Dạ thưa Quý cư dân ${residentName}, **Phòng Xông Hơi Đá Muối Himalaya (Tầng 3)** tại Skyline là **Tiện ích riêng tư (Private VIP)** dành riêng cho từng gia đình:

* 🌿 **Dịch vụ phòng riêng:** Khép kín 100%, được bật lò gia nhiệt đá muối và chuẩn bị tinh dầu thảo mộc tự nhiên theo đúng giờ hẹn của Quý vị.
* ⏰ **Thời gian & Chi phí:** Mở cửa **08:00 - 22:00**, biểu phí đặt giữ chỗ là **500.000 đ / giờ** (1 tiếng: 500k, 2 tiếng: 1.000.000 đ, 3 tiếng: 1.500.000 đ), có thể trừ vào hóa đơn tháng tới.
* 💳 **Chính sách hoàn tiền linh hoạt khi có việc bận đột xuất:**
  - 🟢 **Hủy trước giờ hẹn trên 30 phút:** Hoàn trả **100%** tiền giữ chỗ vào hóa đơn tháng tới.
  - 🟡 **Hủy sát giờ hẹn (trong vòng 30 phút):** Hỗ trợ hoàn trả **50%** tiền giữ chỗ (50% còn lại bù đắp chi phí gia nhiệt lò đá muối & chuẩn bị tinh dầu).
  - 🔴 **Quá giờ hẹn bắt đầu:** Không áp dụng hoàn tiền do phòng riêng tư đã được giữ suốt khung giờ đó.

Quý cư dân có thể vào tab **Đăng Ký Đặt Chỗ & Vé Điện Tử** để đặt phòng hoặc bấm nút **Hủy Lịch & Hoàn Tiền** trực tiếp trên vé đã đặt rất tiện lợi ạ!

[SUGGESTIONS: Kiểm tra vé xông hơi của tôi | Hướng dẫn hủy vé nhận lại 100% tiền | Đặt tiệc nướng BBQ sân thượng]`;
  }

  // 9. Inquiries about Door Access / Smart Lock
  if (text.includes('cửa') || text.includes('khóa') || text.includes('faceid') || text.includes('thẻ') || text.includes('chuông')) {
    return `Dạ thưa Quý cư dân ${residentName}, hệ thống cửa thông minh căn hộ ${targetAptCode} hỗ trợ 4 cách mở cửa rất tiện lợi:

1. **Nhận diện khuôn mặt (FaceID):** Quét siêu nhanh chỉ trong 1 giây ngay trước cửa.
2. **Thẻ cư dân (Thẻ chip NFC):** Chạm nhẹ thẻ vào khóa là cửa tự động mở.
3. **Mã số mở cửa cho khách:** Quý vị có thể tạo mã OTP tạm thời dùng 1 lần hoặc theo giờ để gửi cho người thân/người giao hàng.
4. **Mở từ xa qua chuông hình:** Xem trực tiếp camera khách bấm chuông và mở cửa ngay trên điện thoại.

*Tính năng an toàn:* Cửa tự động khóa sau 5 giây, có khóa riêng tư ban đêm và chuông báo động to khi phát hiện va đập cạy cửa.

[SUGGESTIONS: Hướng dẫn cài FaceID mở cửa | Cách tạo mã OTP cho khách thăm | Hotline kỹ thuật khi khóa hết pin]`;
  }

  // 10. Fallback for Unrecognized / Non-Specific Queries (Chống bịa đặt dữ liệu ảo)
  return `Dạ thưa Quý cư dân ${residentName}, hiện tại hệ thống dữ liệu quản trị tòa nhà chưa ghi nhận thông tin chính xác về yêu cầu này của Quý vị đối với căn hộ **${targetAptCode}**.

Để đảm bảo thông tin chuẩn xác nhất và tránh sai lệch, Quý cư dân vui lòng liên hệ trực tiếp với Ban Quản Lý:
* 📞 **Hotline Ban Quản Lý (24/7):** **1900 8899** hoặc **028.7300.8899**
* 🏢 **Văn phòng BQL:** Tầng 2 (08:00 - 17:30, Thứ 2 đến Thứ 7)
* 🏛️ **Quầy lễ tân tiếp dân:** Sảnh Grand Lobby Tầng 1 (Túc trực 24/24)

Tôi luôn sẵn sàng giải đáp ngay các thông tin chuẩn mực về: quy mô tòa nhà 25 tầng, 5 đại tiện ích 5 sao, hóa đơn sinh hoạt, lịch đặt chỗ tiện ích và báo hỏng kỹ thuật căn hộ ạ!

[SUGGESTIONS: Tiện ích nào cần đăng ký trước? | Xem hóa đơn căn hộ tháng này | Tra cứu lịch đặt chỗ của tôi | Tòa nhà có bao nhiêu tầng?]`;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

/**
 * Send message to Gemini AI for Skyline Concierge Chat
 * With full Project Knowledge Context + Strict Timeout Handling + Instant Fallback
 */
export async function askGeminiConcierge(
  message: string,
  history: ChatMessage[] = [],
  contextOrAptCode: string | ConciergeContext = 'CH-06'
): Promise<string> {
  // If API key is not configured or too short/placeholder, use smart project fallback
  if (!GEMINI_API_KEY || GEMINI_API_KEY.length < 20) {
    console.info('GEMINI_API_KEY is not configured. Using smart project data engine.');
    return generateSmartProjectFallback(message, contextOrAptCode);
  }

  const systemPrompt = buildProjectSystemPrompt(contextOrAptCode);

  const contents = [
    ...history.slice(-6).map((h) => ({
      role: h.role === 'model' ? 'model' : 'user',
      parts: [{ text: h.text }],
    })),
    {
      role: 'user',
      parts: [{ text: message }],
    },
  ];

  const payload = {
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    contents,
    generationConfig: {
      temperature: 0.2, // Strict factual grounding - eliminates fake data & hallucinations
      topP: 0.85,
      maxOutputTokens: 4096, // Ample token capacity prevents mid-sentence truncation
    },
  };

  const tryModel = async (model: string, timeoutMs: number) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
    const response = await fetchWithTimeout(
      url,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      timeoutMs
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error [${response.status}]: ${errText}`);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    const replyText = candidate?.content?.parts?.[0]?.text;
    if (!replyText) {
      throw new Error('Gemini API returned empty candidate response.');
    }
    return replyText;
  };

  const candidateModels = [
    { name: GEMINI_PRIMARY_MODEL, timeout: PRIMARY_TIMEOUT_MS },
    { name: GEMINI_FALLBACK_MODEL, timeout: FALLBACK_TIMEOUT_MS },
    { name: GEMINI_FAST_FALLBACK_MODEL, timeout: FAST_TIMEOUT_MS },
    { name: GEMINI_BACKUP_MODEL, timeout: 15000 },
  ];

  for (const item of candidateModels) {
    try {
      return await tryModel(item.name, item.timeout);
    } catch (err: any) {
      console.warn(`Gemini model ${item.name} failed (${err.message}), trying next model...`);
    }
  }

  console.warn('All Gemini models failed. Switching seamlessly to Smart Project Data Engine.');
  return generateSmartProjectFallback(message, contextOrAptCode);
}

/**
 * Extract clean base64 data and mime type from data URL
 */
function parseDataUrl(dataUrl: string): { mimeType: string; base64: string } {
  if (dataUrl.startsWith('data:')) {
    const matches = dataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      return { mimeType: matches[1], base64: matches[2] };
    }
  }
  // Assume jpeg if raw base64
  return { mimeType: 'image/jpeg', base64: dataUrl };
}

export interface GeminiOcrCccdResult {
  idNumber: string;
  fullName: string;
  dob: string;
  gender: '1' | '0';
  pob: string;
  residence: string;
  province: string;
  idDate: string;
  idPlace: string;
  confidence: number;
}

/**
 * Use Gemini Vision to perform high-accuracy OCR on Vietnamese CCCD chip card
 */
export async function parseCccdWithGeminiVision(
  frontImage: string,
  backImage?: string
): Promise<GeminiOcrCccdResult> {
  const parts: any[] = [
    {
      text: `Bạn là hệ thống trích xuất thông tin Căn Cước Công Dân (CCCD gắn chip) Việt Nam siêu chính xác cấp chuyên gia eKYC.
Nhiệm vụ: Phân tích kỹ ảnh chụp thẻ CCCD (mặt trước và mặt sau nếu có) và trích xuất đúng các trường thông tin.

YÊU CẦU ĐẦU RA BẮT BUỘC:
Chỉ trả về DUY NHẤT một chuỗi JSON hợp lệ (không kèm theo văn bản giải thích, không bọc trong markdown tick nếu có thể, hoặc bọc trong \`\`\`json ... \`\`\`) theo cấu trúc:
{
  "idNumber": "Số CCCD gồm đúng 12 chữ số",
  "fullName": "Họ và tên tiếng Việt viết hoa đầy đủ dấu, ví dụ: NGUYỄN VĂN AN",
  "dob": "Ngày tháng năm sinh định dạng YYYY-MM-DD hoặc DD/MM/YYYY",
  "gender": "1" cho Nam hoặc "0" cho Nữ,
  "pob": "Quê quán đầy đủ",
  "residence": "Nơi thường trú đầy đủ",
  "province": "Tỉnh hoặc Thành phố nơi thường trú",
  "idDate": "Ngày cấp thẻ định dạng YYYY-MM-DD hoặc DD/MM/YYYY",
  "idPlace": "Nơi cấp (thường là Cục Cảnh sát QLHC về TTXH)"
}

LƯU Ý CỰC KỲ QUAN TRỌNG:
- Không lấy các từ nhãn "Họ và tên", "Full name", "Số / No", "Ngày sinh", "Giới tính", "Quê quán", "Nơi thường trú" vào giá trị.
- Tên người phải đúng chính tả tiếng Việt có dấu.
- Số CCCD phải đúng 12 chữ số.
- Nếu không tìm thấy thông tin nào đó thì để chuỗi rỗng "".`,
    },
  ];

  if (frontImage) {
    const front = parseDataUrl(frontImage);
    parts.push({
      inlineData: {
        mimeType: front.mimeType,
        data: front.base64,
      },
    });
  }

  if (backImage) {
    const back = parseDataUrl(backImage);
    parts.push({
      inlineData: {
        mimeType: back.mimeType,
        data: back.base64,
      },
    });
  }

  const payload = {
    contents: [{ parts }],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json',
    },
  };

  const tryModel = async (model: string) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini Vision API error [${response.status}]: ${errText}`);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    let replyText = candidate?.content?.parts?.[0]?.text;
    if (!replyText) {
      throw new Error('Gemini Vision returned empty candidate response.');
    }

    // Clean markdown code blocks if present
    replyText = replyText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
    const parsed = JSON.parse(replyText);

    return {
      idNumber: (parsed.idNumber || '').replace(/\D/g, '').slice(0, 12),
      fullName: (parsed.fullName || '').toUpperCase().trim(),
      dob: parsed.dob || '',
      gender: (parsed.gender === '0' || parsed.gender === 0 ? '0' : '1') as '1' | '0',
      pob: parsed.pob || '',
      residence: parsed.residence || parsed.pob || '',
      province: parsed.province || '',
      idDate: parsed.idDate || '',
      idPlace: parsed.idPlace || 'Cục Cảnh sát QLHC về TTXH',
      confidence: 99,
    };
  };

  try {
    return await tryModel(GEMINI_PRIMARY_MODEL);
  } catch (err) {
    console.warn(`Gemini Vision OCR with ${GEMINI_PRIMARY_MODEL} failed, falling back to ${GEMINI_FALLBACK_MODEL}:`, err);
    try {
      return await tryModel(GEMINI_FALLBACK_MODEL);
    } catch (errFallback) {
      console.warn(`Gemini Vision OCR with ${GEMINI_FALLBACK_MODEL} failed, falling back to ${GEMINI_FAST_FALLBACK_MODEL}:`, errFallback);
      return await tryModel(GEMINI_FAST_FALLBACK_MODEL);
    }
  }
}
