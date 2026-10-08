/**
 * Skyline Smart Residence - Resident Services Store
 * Quản lý danh mục & đơn đặt dịch vụ đời sống cao cấp cho Cư Dân:
 * - Giặt ủi & Giặt hấp cao cấp (Giao nhận tận cửa)
 * - Cho thuê người giúp việc & Dọn dẹp căn hộ theo giờ
 * - Thuê Huấn luyện viên cá nhân PT Bơi lội (Sky Pool Tầng 25) & PT Gym (Tầng 3)
 * - Chăm sóc xe & Rửa xe cao cấp tại Hầm B2
 * - Spa & Wellness (Massage thư giãn, Chăm sóc da mặt, Xông hơi trị liệu)
 * - Nhà Hàng & Suất Ăn (Skyline Kitchen & Café, Giao suất ăn tận căn hộ)
 * - Di Chuyển Thông Minh (Xe điện buggey nội khu, Đưa đón sân bay VIP, Vé tháng VinBus)
 * 
 * Lưu ý: Các tiện ích không gian (Hồ bơi, Gym, Sân Tennis/Bóng rổ, Yoga, Vườn BBQ) 
 * được quản lý riêng biệt tại SmartFacilityPass (Tiện Ích & Thẻ Thông Minh).
 */

import { addServiceChargeToBill } from './billingStore';

export type ServiceCategory =
  | 'LAUNDRY'
  | 'HOUSEKEEPING'
  | 'PERSONAL_TRAINER'
  | 'CAR_CARE'
  | 'SPA_WELLNESS'
  | 'RESTAURANT'
  | 'TRANSPORT';

export interface ServicePackageOption {
  id: string;
  name: string;
  unit: string;
  unitPrice: number;
  description: string;
  estimatedDuration?: string;
}

export interface ResidentServiceItem {
  id: string;
  name: string;
  category: ServiceCategory;
  tagline: string;
  description: string;
  rating: number;
  reviewCount: number;
  location: string;
  imageUrl: string;
  badge?: string;
  packages: ServicePackageOption[];
  operatingHours: string;
}

export interface ServiceBooking {
  id: string;
  bookingCode: string;
  aptCode: string;
  residentName: string;
  residentPhone: string;
  serviceId: string;
  serviceName: string;
  category: ServiceCategory;
  packageName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTimeSlot: string;
  notes?: string;
  paymentChoice: 'ADD_TO_BILL' | 'PAY_NOW';
  paymentStatus: 'PENDING_BILL' | 'PAID';
  status: 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  assignedStaff?: string;
  staffPhone?: string;
  createdAt: string;
}

const STORAGE_KEY = 'skyline_resident_services_v1';

export const RESIDENT_SERVICES_CATALOG: ResidentServiceItem[] = [
  // 1. GIẶT ỦI & GIẶT HẤP
  {
    id: 'srv-laundry',
    name: 'Giặt Ủi & Giặt Hấp Cao Cấp',
    category: 'LAUNDRY',
    tagline: 'Nhận & giao đồ tận cửa căn hộ trong 24h',
    description: 'Quy trình giặt sấy công nghệ Nhật Bản, bảo vệ sợi vải, dung môi giặt hấp hữu cơ sinh học cao cấp không mùi hóa chất.',
    rating: 4.9,
    reviewCount: 142,
    location: 'Sảnh Đón & Tầng B1',
    imageUrl: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?w=600&auto=format&fit=crop&q=80',
    badge: 'Giao Nhận Tận Cửa',
    operatingHours: '07:30 - 21:30 Hàng Ngày',
    packages: [
      {
        id: 'pkg-laundry-wash',
        name: 'Giặt Sấy Thơm & Gấp Gọn',
        unit: 'kg',
        unitPrice: 20000,
        description: 'Phân loại màu sắc, sấy khô mềm mại, tiệt trùng tia UV.',
        estimatedDuration: 'Giao sau 12 giờ',
      },
      {
        id: 'pkg-laundry-dryclean-suit',
        name: 'Giặt Hấp Veston & Trang Phục Cao Cấp',
        unit: 'bộ',
        unitPrice: 80000,
        description: 'Giặt khô bằng dung môi Hydrocarbon hữu cơ chuyên dụng, ủi hơi form chuẩn.',
        estimatedDuration: 'Giao sau 24 giờ',
      },
      {
        id: 'pkg-laundry-bedding',
        name: 'Giặt Hấp Chăn Ga Gối & Topper',
        unit: 'bộ',
        unitPrice: 120000,
        description: 'Khử khuẩn mạt bụi, thơm hương lavender tự nhiên.',
        estimatedDuration: 'Giao sau 24 giờ',
      },
    ],
  },

  // 2. GIÚP VIỆC & DỌN DẸP THEO GIỜ
  {
    id: 'srv-cleaning',
    name: 'Cho Thuê Giúp Việc & Dọn Dẹp Nhà',
    category: 'HOUSEKEEPING',
    tagline: 'Nhân viên kiểm định lý lịch e-KYC, tay nghề 5 sao',
    description: 'Dịch vụ buồng phòng tiêu chuẩn khách sạn 5 sao. Nhân viên mang đầy đủ hóa chất sinh học tẩy rửa, máy hút bụi chuyên dụng.',
    rating: 5.0,
    reviewCount: 218,
    location: 'Đội Buồng Phòng Skyline',
    imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop&q=80',
    badge: 'Được Đặt Nhiều Nhất',
    operatingHours: '08:00 - 20:00 Hàng Ngày',
    packages: [
      {
        id: 'pkg-clean-2h',
        name: 'Dọn Dẹp Tiêu Chuẩn (Ca 2 Giờ)',
        unit: 'ca',
        unitPrice: 180000,
        description: 'Lau dọn phòng khách, phòng ngủ, nhà vệ sinh, rửa chén bát và gom rác.',
        estimatedDuration: '2 giờ làm việc',
      },
      {
        id: 'pkg-clean-3h',
        name: 'Dọn Dẹp Chuyên Sâu (Ca 3 Giờ)',
        unit: 'ca',
        unitPrice: 260000,
        description: 'Dọn toàn diện căn hộ 2-3 phòng ngủ, lau cửa kính, hút bụi sofa & ban công.',
        estimatedDuration: '3 giờ làm việc',
      },
      {
        id: 'pkg-clean-postparty',
        name: 'Tổng Vệ Sinh Sau Tiệc / Tiệc BBQ',
        unit: 'lần',
        unitPrice: 450000,
        description: 'Dọn sạch vết dầu mỡ bếp, gom rửa đồ tiệc, khử mùi thức ăn và làm sáng bóng sàn nhà.',
        estimatedDuration: '3.5 - 4 giờ',
      },
      {
        id: 'pkg-clean-sofa-steam',
        name: 'Giặt Ghế Sofa Hơi Nước Nóng Diệt Khuẩn',
        unit: 'bộ',
        unitPrice: 350000,
        description: 'Công nghệ hơi nước nóng 140°C diệt 99.9% vi khuẩn, bọ rệp và nấm mốc nệm/sofa.',
        estimatedDuration: '1.5 giờ',
      },
    ],
  },

  // 3. THUÊ PT BƠI & PT GYM
  {
    id: 'srv-pt-sports',
    name: 'Thuê Huấn Luyện Viên Cá Nhân (PT)',
    category: 'PERSONAL_TRAINER',
    tagline: 'Kèm riêng 1-1 tại Hồ bơi Tầng 25 & Gym Tầng 3',
    description: 'Đội ngũ HLV có chứng chỉ quốc tế ACE / NASM / Cử nhân TDTT. Lộ trình cá nhân hóa cho trẻ em, người lớn, chỉnh dáng bơi & tăng cơ giảm mỡ.',
    rating: 4.95,
    reviewCount: 96,
    location: 'Hồ Bơi Tầng 25 & Gym Tầng 3',
    imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&auto=format&fit=crop&q=80',
    badge: 'Chuyên Gia 1-Kèm-1',
    operatingHours: '06:00 - 21:00 Hàng Ngày',
    packages: [
      {
        id: 'pkg-pt-swim-single',
        name: 'PT Bơi Lội Kèm Riêng (1 Buổi 60 Phút)',
        unit: 'buổi',
        unitPrice: 350000,
        description: 'Kèm trực tiếp tại Hồ bơi vô cực Tầng 25: học bơi ếch/sải/ngửa, chỉnh kỹ thuật thở nước & an toàn bơi.',
        estimatedDuration: '60 phút',
      },
      {
        id: 'pkg-pt-swim-10',
        name: 'Gói PT Bơi Lội Cấp Tốc (10 Buổi)',
        unit: 'khóa',
        unitPrice: 3150000,
        description: 'Cam kết biết bơi chuẩn kỹ thuật sau 10 buổi. Tiết kiệm 10% so với học lẻ.',
        estimatedDuration: '10 buổi (60 phút/buổi)',
      },
      {
        id: 'pkg-pt-gym-single',
        name: 'PT Gym Technogym (1 Buổi 60 Phút)',
        unit: 'buổi',
        unitPrice: 300000,
        description: 'Đo chỉ số InBody miễn phí, hướng dẫn kỹ thuật tập máy an toàn, lên giáo trình dinh dưỡng.',
        estimatedDuration: '60 phút',
      },
      {
        id: 'pkg-pt-gym-10',
        name: 'Gói PT Gym Giảm Mỡ / Tăng Cơ (10 Buổi)',
        unit: 'khóa',
        unitPrice: 2700000,
        description: 'Lộ trình siết cơ hoặc tăng cân khoa học theo sát tiến độ hàng tuần.',
        estimatedDuration: '10 buổi (60 phút/buổi)',
      },
    ],
  },

  // 4. CHĂM SÓC & RỬA XE HẦM B2
  {
    id: 'srv-car-detailing',
    name: 'Chăm Sóc & Rửa Xe Thông Minh',
    category: 'CAR_CARE',
    tagline: 'Rửa bọt tuyết & hút bụi nội thất tại Hầm B2',
    description: 'Khu vực dịch vụ chăm sóc xe thông minh tại Hầm B2. Tiện lợi nhận và trả xe ngay vị trí đỗ của cư dân.',
    rating: 4.88,
    reviewCount: 84,
    location: 'Khu Vực Kỹ Thuật Hầm B2',
    imageUrl: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=600&auto=format&fit=crop&q=80',
    badge: 'Tiện Lợi Dưới Hầm',
    operatingHours: '07:00 - 19:30 Hàng Ngày',
    packages: [
      {
        id: 'pkg-car-moto',
        name: 'Rửa Xe Máy Bọt Tuyết & Dưỡng Lốp',
        unit: 'xe',
        unitPrice: 30000,
        description: 'Rửa gầm, xịt bọt tuyết bóng sơn và phủ dưỡng chống oxy hóa lốp xe.',
        estimatedDuration: '25 phút',
      },
      {
        id: 'pkg-car-auto-standard',
        name: 'Rửa Ô Tô & Hút Bụi Nội Thất (Sedan/Hatchback)',
        unit: 'xe',
        unitPrice: 100000,
        description: 'Rửa ngoại thất sạch bóng, hút bụi sàn ghế, khử khuẩn điều hòa bằng tinh dầu sả chanh.',
        estimatedDuration: '45 phút',
      },
      {
        id: 'pkg-car-auto-suv',
        name: 'Rửa Ô Tô SUV / 7 Chỗ Chuyên Sâu',
        unit: 'xe',
        unitPrice: 130000,
        description: 'Rửa sạch gầm, vệ sinh khoang hành lý, lau dưỡng da nội thất chuyên dụng.',
        estimatedDuration: '60 phút',
      },
    ],
  },

  // 5. SPA & WELLNESS — Phòng Xông Hơi Đá Muối & Massage Cao Cấp Tầng 3
  {
    id: 'srv-spa-wellness',
    name: 'Spa & Wellness Cao Cấp',
    category: 'SPA_WELLNESS',
    tagline: 'Massage thư giãn & xông hơi muối đá tầng 3',
    description: 'Trải nghiệm thư giãn 5 sao ngay trong khuôn viên Skyline. Đội ngũ chuyên viên spa được đào tạo bài bản tại Thái Lan, sử dụng tinh dầu hữu cơ thiên nhiên và đá nóng Himalaya.',
    rating: 4.97,
    reviewCount: 163,
    location: 'Tầng 3 (Khu Wellness & Spa)',
    imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&auto=format&fit=crop&q=80',
    badge: 'Được Yêu Thích Nhất',
    operatingHours: '09:00 - 21:00 Hàng Ngày',
    packages: [
      {
        id: 'pkg-spa-massage-60',
        name: 'Massage Thư Giãn Toàn Thân (60 Phút)',
        unit: 'lần',
        unitPrice: 450000,
        description: 'Kết hợp kỹ thuật massage Thụy Điển & Balinese, giảm căng cơ, cải thiện tuần hoàn máu.',
        estimatedDuration: '60 phút',
      },
      {
        id: 'pkg-spa-massage-90',
        name: 'Massage Đá Nóng Himalaya Cao Cấp (90 Phút)',
        unit: 'lần',
        unitPrice: 680000,
        description: 'Đá nóng basalt kết hợp tinh dầu sả gừng giải độc, phục hồi năng lượng sâu cơ bắp sau ngày dài.',
        estimatedDuration: '90 phút',
      },
      {
        id: 'pkg-spa-sauna-family',
        name: 'Xông Hơi Đá Muối Phòng Gia Đình (2 Người)',
        unit: 'ca',
        unitPrice: 550000,
        description: 'Phòng xông riêng tư cho cặp đôi/gia đình. Đá muối Himalaya 48°C, tinh dầu thảo mộc khử độc.',
        estimatedDuration: '60 phút/ca',
      },
      {
        id: 'pkg-spa-facial',
        name: 'Chăm Sóc Da Mặt Chuyên Sâu (Facial Treatment)',
        unit: 'lần',
        unitPrice: 380000,
        description: 'Làm sạch sâu lỗ chân lông, đắp mặt nạ collagen thủy phân, tăng độ ẩm và đàn hồi da.',
        estimatedDuration: '60 phút',
      },
    ],
  },

  // 6. NHÀ HÀNG & SUẤT ĂN — Skyline Kitchen & Giao Tận Căn Hộ
  {
    id: 'srv-restaurant',
    name: 'Nhà Hàng & Giao Suất Ăn Tận Cửa',
    category: 'RESTAURANT',
    tagline: 'Đặt bàn nhà hàng Skyline & giao cơm bếp Việt tận căn hộ',
    description: 'Nhà hàng Skyline Kitchen & Café phục vụ ẩm thực Á-Âu tinh tế ngay tầng 1. Giao suất ăn đóng gói tươi nóng từ bếp trưởng chuyên nghiệp, giao trong 30 phút, đúng giờ tận cửa căn hộ.',
    rating: 4.88,
    reviewCount: 211,
    location: 'Tầng 1 (Skyline Kitchen & Café)',
    imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&auto=format&fit=crop&q=80',
    badge: 'Giao Trong 30 Phút',
    operatingHours: '06:30 - 22:00 Hàng Ngày',
    packages: [
      {
        id: 'pkg-rest-combo-lunch',
        name: 'Combo Cơm Phần Trưa Bếp Việt (1 Người)',
        unit: 'phần',
        unitPrice: 85000,
        description: 'Cơm trắng + 1 món mặn + canh + tráng miệng. Giao nóng đến cửa căn hộ trong 30 phút.',
        estimatedDuration: 'Giao trong 30 phút',
      },
      {
        id: 'pkg-rest-dim-sum',
        name: 'Set Dim Sum Sáng (2 Người)',
        unit: 'set',
        unitPrice: 160000,
        description: 'Trà Tàu nóng + 5 loại bánh dim sum đặc trưng Hồng Kông từ bếp trưởng 5 sao.',
        estimatedDuration: 'Giao trong 25 phút',
      },
      {
        id: 'pkg-rest-book-table',
        name: 'Đặt Bàn Nhà Hàng (Tối đa 6 người)',
        unit: 'bàn',
        unitPrice: 0,
        description: 'Đặt bàn ưu tiên tại nhà hàng Skyline Kitchen. Miễn phí giữ chỗ. Menu A-la-carte tại chỗ.',
        estimatedDuration: 'Liên hệ xác nhận khung giờ',
      },
      {
        id: 'pkg-rest-amenities-basket',
        name: 'Giỏ Quà Trái Cây Cao Cấp & Bánh Ngọt Tầng Cao',
        unit: 'giỏ',
        unitPrice: 280000,
        description: 'Hoa quả nhập khẩu Hàn Quốc tươi, bánh Macaron & Éclair từ bếp bánh của nhà hàng. Phù hợp tặng quà cư dân mới.',
        estimatedDuration: 'Giao trong 45 phút',
      },
    ],
  },

  // 7. DI CHUYỂN THÔNG MINH — VinBus, Xe điện, Đưa đón sân bay
  {
    id: 'srv-transport',
    name: 'Di Chuyển Thông Minh Nội Khu',
    category: 'TRANSPORT',
    tagline: 'VinBus điện, xe buggey nội khu & đưa đón sân bay Tân Sơn Nhất',
    description: 'Dịch vụ di chuyển xanh – thông minh trong và ngoài Vinhomes Grand Park. Từ xe buggey điện kết nối nội khu đến đặt xe đưa đón sân bay Tân Sơn Nhất tiêu chuẩn VIP.',
    rating: 4.82,
    reviewCount: 129,
    location: 'Sảnh Đón Tầng 1 / Trạm VinBus Nội Khu',
    imageUrl: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=600&auto=format&fit=crop&q=80',
    badge: 'Di Chuyển Xanh',
    operatingHours: '05:30 - 23:30 Hàng Ngày',
    packages: [
      {
        id: 'pkg-trans-buggy-intra',
        name: 'Xe Buggey Điện Nội Khu (1 Chiều)',
        unit: 'chuyến',
        unitPrice: 20000,
        description: 'Đưa đón trong phạm vi Vinhomes Grand Park: Vincom Mega Mall, Bến xe điện, Vinmec, Vinschool.',
        estimatedDuration: '10 - 20 phút',
      },
      {
        id: 'pkg-trans-airport',
        name: 'Đưa Đón Sân Bay Tân Sơn Nhất (Ô Tô 4 Chỗ)',
        unit: 'chuyến',
        unitPrice: 350000,
        description: 'Đặt lịch trước 2 giờ. Lái xe chuyên nghiệp trang phục lịch sự, xe sạch & đúng giờ.',
        estimatedDuration: '45 - 60 phút (tùy giờ cao điểm)',
      },
      {
        id: 'pkg-trans-airport-suv',
        name: 'Đưa Đón Sân Bay VIP (SUV 7 Chỗ)',
        unit: 'chuyến',
        unitPrice: 480000,
        description: 'Dịch vụ cao cấp xe Innova/Fortuner, hỗ trợ hành lý, theo dõi chuyến bay & đón đúng cửa xuất.',
        estimatedDuration: '45 - 60 phút',
      },
      {
        id: 'pkg-trans-vinbus-monthly',
        name: 'Vé Tháng VinBus Điện D4 (Trung Tâm TP)',
        unit: 'thẻ/tháng',
        unitPrice: 230000,
        description: 'Vé tháng VinBus tuyến D4 kết nối trực tiếp Quận 1, Bến Thành & các tiện ích Vinhomes.',
        estimatedDuration: 'Hiệu lực 30 ngày',
      },
    ],
  },
];

// Danh sách đơn đặt dịch vụ ban đầu hoàn toàn sạch, không có dữ liệu ảo/mẫu
const INITIAL_DEMO_BOOKINGS: ServiceBooking[] = [];

function notifyServicesUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('skyline_services_updated'));
  }
}

/**
 * Lấy toàn bộ danh sách đơn đặt dịch vụ thực tế
 */
export function getResidentBookings(aptCode?: string): ServiceBooking[] {
  let list: ServiceBooking[] = [];
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // Lọc bỏ bất kỳ dữ liệu mẫu nào nếu có trong cache
          list = parsed.filter(b => b && b.bookingCode && !b.bookingCode.includes('LAUN-1201') && !b.bookingCode.includes('PTSW-1202'));
        }
      }
    } catch {
      list = [];
    }
  }

  if (aptCode) {
    const clean = aptCode.trim().toUpperCase();
    return list.filter(b => b.aptCode.trim().toUpperCase() === clean);
  }
  return list;
}

/**
 * Lưu danh sách đơn đặt dịch vụ
 */
export function saveResidentBookings(bookings: ServiceBooking[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
    notifyServicesUpdated();
  }
}

/**
 * Tạo mới đơn đặt dịch vụ
 */
export function createResidentBooking(params: {
  aptCode: string;
  residentName: string;
  residentPhone: string;
  serviceId: string;
  packageId: string;
  quantity: number;
  scheduledDate: string;
  scheduledTimeSlot: string;
  notes?: string;
  paymentChoice: 'ADD_TO_BILL' | 'PAY_NOW';
}): ServiceBooking | null {
  const service = RESIDENT_SERVICES_CATALOG.find(s => s.id === params.serviceId);
  if (!service) return null;

  const pkg = service.packages.find(p => p.id === params.packageId);
  if (!pkg) return null;

  const codePrefix = service.category === 'LAUNDRY' ? 'LAUN' :
                     service.category === 'HOUSEKEEPING' ? 'CLEAN' :
                     service.category === 'PERSONAL_TRAINER' ? 'PT' :
                     service.category === 'CAR_CARE' ? 'CAR' :
                     service.category === 'SPA_WELLNESS' ? 'SPA' :
                     service.category === 'RESTAURANT' ? 'REST' : 'TRANS';

  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const bookingCode = `SRV-${codePrefix}-${randomNum}`;
  const totalPrice = pkg.unitPrice * Math.max(1, params.quantity);

  // Chỉ định nhân viên phụ trách tự động theo ca
  let assignedStaff = 'Đội Dịch Vụ Cư Dân Skyline';
  let staffPhone = '1900 8899';
  if (service.category === 'LAUNDRY') {
    assignedStaff = 'Lê Thị Thu (Trưởng nhóm giặt ủi BQL)';
    staffPhone = '0908 112 233';
  } else if (service.category === 'HOUSEKEEPING') {
    assignedStaff = 'Trần Thị Mỹ Duyên (Chuyên viên buồng phòng)';
    staffPhone = '0912 334 455';
  } else if (service.category === 'PERSONAL_TRAINER') {
    assignedStaff = 'HLV Phan Minh Hải (Chứng chỉ ACE Tầng 25)';
    staffPhone = '0933 445 566';
  } else if (service.category === 'CAR_CARE') {
    assignedStaff = 'Nguyễn Văn Đạt (Kỹ thuật viên rửa xe B2)';
    staffPhone = '0944 556 677';
  } else if (service.category === 'SPA_WELLNESS') {
    assignedStaff = 'Chuyên viên Spa Nguyễn Thị Lan Anh (Tầng 3)';
    staffPhone = '0955 667 788';
  } else if (service.category === 'RESTAURANT') {
    assignedStaff = 'Bếp Trưởng Skyline Kitchen (Tầng 1)';
    staffPhone = '0977 889 900';
  } else if (service.category === 'TRANSPORT') {
    assignedStaff = 'Điều Phối Viên Di Chuyển Nội Khu';
    staffPhone = '0988 990 011';
  }

  const newBooking: ServiceBooking = {
    id: `srv-bk-${Date.now()}`,
    bookingCode,
    aptCode: params.aptCode,
    residentName: params.residentName,
    residentPhone: params.residentPhone,
    serviceId: service.id,
    serviceName: service.name,
    category: service.category,
    packageName: pkg.name,
    quantity: Math.max(1, params.quantity),
    unit: pkg.unit,
    unitPrice: pkg.unitPrice,
    totalPrice,
    scheduledDate: params.scheduledDate,
    scheduledTimeSlot: params.scheduledTimeSlot,
    notes: params.notes || '',
    paymentChoice: params.paymentChoice,
    paymentStatus: params.paymentChoice === 'ADD_TO_BILL' ? 'PENDING_BILL' : 'PAID',
    status: 'CONFIRMED',
    assignedStaff,
    staffPhone,
    createdAt: new Date().toISOString(),
  };

  const currentList = getResidentBookings();
  const nextList = [newBooking, ...currentList];
  saveResidentBookings(nextList);

  // Nếu chọn "Gộp vào hóa đơn", tự động chèn vào hóa đơn chưa thanh toán của căn hộ
  if (params.paymentChoice === 'ADD_TO_BILL') {
    const serviceType = service.category === 'LAUNDRY' ? 'Laundry' :
                        service.category === 'HOUSEKEEPING' ? 'Housekeeping' :
                        service.category === 'PERSONAL_TRAINER' ? 'Personal_Trainer' :
                        service.category === 'CAR_CARE' ? 'Car_Care' :
                        service.category === 'SPA_WELLNESS' ? 'Spa' :
                        service.category === 'RESTAURANT' ? 'Dining' : 'Transport';

    addServiceChargeToBill(params.aptCode, {
      service_type: serviceType,
      service_name: `${pkg.name} (${service.name})`,
      usage: params.quantity,
      unit: pkg.unit,
      unit_price: pkg.unitPrice,
      total_line_amount: totalPrice,
      order_date: new Date().toLocaleDateString('vi-VN'),
      booking_ref: bookingCode,
    });
  }

  return newBooking;
}

/**
 * Hủy đơn đặt dịch vụ
 */
export function cancelResidentBooking(bookingId: string): boolean {
  const currentList = getResidentBookings();
  let found = false;
  const nextList = currentList.map(b => {
    if (b.id === bookingId && (b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS')) {
      found = true;
      return { ...b, status: 'CANCELLED' as const };
    }
    return b;
  });

  if (found) {
    saveResidentBookings(nextList);
  }
  return found;
}
