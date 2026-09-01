// ============================================================================
// DATA STORE & TYPE DEFINITIONS - SKYLINE SMART RESIDENCE (SRS COMPLIANT)
// ============================================================================

export type UserRole = 'ADMIN' | 'OWNER' | 'TENANT' | 'TECHNICIAN' | 'RECEPTIONIST';

export interface User {
  id: string;
  role: UserRole;
  username: string; // Số điện thoại
  full_name: string;
  phone?: string;
  email?: string;
  id_card_no?: string; // [AI OCR]
  id_card_number?: string;
  face_vector?: string; // [AI Vision]
  emergency_phone?: string;
  avatar_url?: string;
  ui_language: 'vi' | 'en';
  apartment_code?: string;
  relationship?: 'Owner' | 'Family' | 'Tenant';
}

export interface Block {
  id: number;
  block_code: string;
  total_floors: number;
  manager_id: string;
}

export interface SmartWidget {
  id: string;
  name: string;
  type: 'light' | 'ac' | 'door' | 'curtain' | 'sensor';
  status: 'on' | 'off' | number;
  x: number; // percentage
  y: number; // percentage
}

export interface Apartment {
  id: string;
  block_id: number;
  block_code: string;
  floor_number: number;
  apt_code: string;
  apt_type: 'Studio' | '1PN' | '2PN' | '3PN' | 'Duplex';
  wall_area: number; // Diện tích tim tường (m2)
  clear_area: number; // Diện tích thông thủy (m2)
  legal_status: 'SPA' | 'Pink_Book';
  status: 'Đang trống' | 'Đã bàn giao' | 'Đang bảo trì';
  price_vnd: number;
  bedrooms: number;
  bathrooms: number;
  thumbnail_url: string;
  floor_plan_url: string;
  smart_widgets: SmartWidget[];
}

export interface BillDetail {
  id: string;
  bill_id: string;
  service_type: 'Electricity' | 'Water' | 'Management_Fee' | 'Parking';
  usage?: number; // kWh or m3
  unit_price?: number;
  total_line_amount: number;
  ai_anomaly?: boolean; // AI phát hiện bất thường > 50%
  anomaly_reason?: string;
}

export interface Bill {
  id: string;
  apartment_id: string;
  apt_code: string;
  owner_name: string;
  billing_month: string;
  due_date: string;
  total_amount: number;
  status: 'Draft' | 'Unpaid' | 'Partial' | 'Paid' | 'Overdue';
  status_color: string;
  payment_qr_url: string;
  invoice_pdf_url: string;
  details: BillDetail[];
  has_ai_anomaly: boolean;
  created_at: string;
}

export interface ServiceRequest {
  id: string;
  apartment_id: string;
  apt_code: string;
  resident_name: string;
  resident_phone: string;
  content: string;
  ai_category: 'Điện' | 'Nước' | 'Vệ sinh' | 'An ninh' | 'Khác';
  ai_priority: 1 | 2 | 3; // 1: Khẩn cấp, 2: Cao, 3: Bình thường
  priority_color: string;
  sla_deadline: string; // ISO String
  sla_minutes_left: number;
  status: 'Open' | 'Assigned' | 'In_Progress' | 'Resolved';
  assigned_technician?: string;
  before_image: string;
  after_image: string;
  created_at: string;
  updated_at: string;
}

export interface Device {
  id: string;
  name: string;
  category: 'Thang máy' | 'Máy bơm' | 'Hệ thống PCCC' | 'Trạm biến áp' | 'Barrier';
  location: string;
  health_score: number; // 0 - 100 [AI]
  predict_date: string; // [AI Dự báo hỏng hóc]
  last_maintenance: string;
  status: 'Hoạt động tốt' | 'Cần kiểm tra' | 'Cảnh báo hỏng';
}

export interface Vehicle {
  id: string;
  apartment_id: string;
  apt_code: string;
  owner_name: string;
  license_plate: string;
  vehicle_type: 'Ô tô' | 'Xe máy';
  priority_level: number;
  registered_at: string;
}

export interface VisitorLog {
  id: string;
  apartment_id: string;
  apt_code: string;
  host_name: string;
  visitor_name: string;
  visitor_phone: string;
  purpose: string;
  valid_from: string;
  valid_to: string;
  qr_invite_code: string;
  check_in_time?: string;
  status: 'Chờ đến' | 'Đã check-in' | 'Hết hạn';
}

export interface SecurityAlert {
  id: string;
  alert_type: 'Fire' | 'Violence' | 'Fall' | 'Crowd' | 'Intrusion';
  title: string;
  location: string;
  camera_id: string;
  snapshot_url: string;
  confidence: number; // 0.95 = 95%
  created_at: string;
  status: 'New' | 'Investigating' | 'Resolved';
}

export interface Facility {
  id: string;
  name: string;
  category: 'Gym' | 'BBQ' | 'Hồ bơi' | 'Sân Tennis' | 'Phòng sinh hoạt';
  max_quota_per_month: number;
  hero_image_url: string;
  rating_score: number; // 5.0
  operating_hours: string;
  pricing: string;
  current_occupancy: number;
  max_capacity: number;
}

export interface FacilityBooking {
  id: string;
  facility_id: string;
  facility_name: string;
  apartment_id: string;
  apt_code: string;
  resident_name: string;
  booking_date: string;
  time_slot: string;
  guests_count: number;
  status: 'Confirmed' | 'Pending' | 'Cancelled';
}

export interface CommunityPost {
  id: string;
  author_name: string;
  author_role: 'BQL' | 'Cư dân' | 'Kỹ thuật';
  apt_code?: string;
  title: string;
  content: string;
  ai_moderation: 'Clean' | 'Toxic' | 'Pending';
  ai_sentiment: number; // -1.0 to 1.0 (Positive / Negative)
  tags: string[];
  likes: number;
  comments_count: number;
  is_pinned?: boolean;
  created_at: string;
}

export interface Survey {
  id: string;
  title: string;
  description: string;
  legal_type: 'Bầu Ban Quản Trị' | 'Đóng góp Quỹ Bảo trì' | 'Ý kiến Cải tạo';
  deadline: string;
  is_owner_only: boolean;
  total_votes: number;
  options: { id: string; text: string; votes: number }[];
  user_voted?: string;
}

// ============================================================================
// MOCK DATA STORE
// ============================================================================

export const DEMO_USERS: User[] = [
  {
    id: 'user-admin-1',
    role: 'ADMIN',
    username: '0901888999',
    phone: '0901888999',
    email: 'nks.manager01@gmail.com',
    full_name: 'Nguyễn Văn Quản Trị (Trưởng BQL)',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    ui_language: 'vi',
    emergency_phone: '19001088',
  },
  {
    id: 'user-owner-1',
    role: 'OWNER',
    username: '0903112233',
    phone: '0903112233',
    email: 'huuluc04@gmail.com',
    full_name: 'Nguyễn Hữu Lực (Chủ hộ)',
    id_card_no: '079201009876',
    face_vector: 'VEC-512-FACE-001-OK',
    emergency_phone: '0912345678',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    ui_language: 'vi',
    apartment_code: '12A05',
    relationship: 'Owner',
  },
  {
    id: 'user-tenant-1',
    role: 'TENANT',
    username: '0908776655',
    phone: '0908776655',
    email: 'nguyenhuunhut1309@gmail.com',
    full_name: 'Trần Thị Mai (Thành viên gia đình)',
    id_card_no: '079302008765',
    face_vector: 'VEC-512-FACE-002-OK',
    emergency_phone: '0988776655',
    avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    ui_language: 'vi',
    apartment_code: '12A05',
    relationship: 'Family',
  },
  {
    id: 'user-tech-1',
    role: 'TECHNICIAN',
    username: '0905667788',
    phone: '0905667788',
    email: 'nks.driver01@gmail.com',
    full_name: 'Lê Văn Kỹ Thuật (Kỹ sư điện nước)',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    ui_language: 'vi',
    emergency_phone: '0905667788',
  },
];

export const DEMO_APARTMENTS: Apartment[] = [
  {
    id: 'apt-12a05',
    block_id: 1,
    block_code: 'Tòa A - Sapphire',
    floor_number: 12,
    apt_code: '12A05',
    apt_type: '2PN',
    wall_area: 78.5,
    clear_area: 73.2,
    legal_status: 'Pink_Book',
    status: 'Đã bàn giao',
    price_vnd: 4850000000,
    bedrooms: 2,
    bathrooms: 2,
    thumbnail_url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80',
    floor_plan_url: 'https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?w=800&auto=format&fit=crop&q=80',
    smart_widgets: [
      { id: 'w-1', name: 'Đèn phòng khách', type: 'light', status: 'on', x: 35, y: 40 },
      { id: 'w-2', name: 'Điều hòa Daikin Inverter', type: 'ac', status: 24, x: 55, y: 30 },
      { id: 'w-3', name: 'Khóa cửa thông minh FaceID', type: 'door', status: 'on', x: 15, y: 80 },
      { id: 'w-4', name: 'Rèm cửa tự động', type: 'curtain', status: 'on', x: 80, y: 45 },
      { id: 'w-5', name: 'Cảm biến rò rỉ nước AI', type: 'sensor', status: 'on', x: 70, y: 75 },
    ],
  },
  {
    id: 'apt-18a01',
    block_id: 1,
    block_code: 'Tòa A - Sapphire',
    floor_number: 18,
    apt_code: '18A01',
    apt_type: '3PN',
    wall_area: 112.0,
    clear_area: 104.5,
    legal_status: 'SPA',
    status: 'Đang trống',
    price_vnd: 7600000000,
    bedrooms: 3,
    bathrooms: 3,
    thumbnail_url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&auto=format&fit=crop&q=80',
    floor_plan_url: 'https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?w=800&auto=format&fit=crop&q=80',
    smart_widgets: [],
  },
  {
    id: 'apt-25p01',
    block_id: 1,
    block_code: 'Tòa A - Sapphire',
    floor_number: 25,
    apt_code: '25PH-01',
    apt_type: 'Duplex',
    wall_area: 215.0,
    clear_area: 198.0,
    legal_status: 'SPA',
    status: 'Đang trống',
    price_vnd: 18500000000,
    bedrooms: 4,
    bathrooms: 4,
    thumbnail_url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop&q=80',
    floor_plan_url: 'https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?w=800&auto=format&fit=crop&q=80',
    smart_widgets: [],
  },
  {
    id: 'apt-08b12',
    block_id: 2,
    block_code: 'Tòa B - Diamond',
    floor_number: 8,
    apt_code: '08B12',
    apt_type: '1PN',
    wall_area: 52.0,
    clear_area: 48.6,
    legal_status: 'Pink_Book',
    status: 'Đã bàn giao',
    price_vnd: 3200000000,
    bedrooms: 1,
    bathrooms: 1,
    thumbnail_url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=80',
    floor_plan_url: 'https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?w=800&auto=format&fit=crop&q=80',
    smart_widgets: [],
  },
];

export const DEMO_BILLS: Bill[] = [
  {
    id: 'bill-2026-08-12a05',
    apartment_id: 'apt-12a05',
    apt_code: '12A05',
    owner_name: 'Nguyễn Hữu Lực',
    billing_month: 'Tháng 08/2026',
    due_date: '2026-08-30T23:59:59',
    total_amount: 2465000,
    status: 'Unpaid',
    status_color: '#D97706',
    payment_qr_url: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=VNPAY_SKYLINE_12A05_2465000',
    invoice_pdf_url: '#',
    has_ai_anomaly: true,
    created_at: '2026-08-05T08:00:00',
    details: [
      {
        id: 'bd-1',
        bill_id: 'bill-2026-08-12a05',
        service_type: 'Electricity',
        usage: 340,
        unit_price: 3200,
        total_line_amount: 1088000,
      },
      {
        id: 'bd-2',
        bill_id: 'bill-2026-08-12a05',
        service_type: 'Water',
        usage: 28,
        unit_price: 18000,
        total_line_amount: 504000,
        ai_anomaly: true,
        anomaly_reason: 'Tăng vọt 115% so với tháng trước. AI ghi nhận dòng chảy 2h-4h sáng nghi rò rỉ.',
      },
      {
        id: 'bd-3',
        bill_id: 'bill-2026-08-12a05',
        service_type: 'Management_Fee',
        usage: 73.2,
        unit_price: 10000,
        total_line_amount: 732000,
      },
      {
        id: 'bd-4',
        bill_id: 'bill-2026-08-12a05',
        service_type: 'Parking',
        usage: 1,
        total_line_amount: 141000,
      },
    ],
  },
  {
    id: 'bill-2026-08-08b12',
    apartment_id: 'apt-08b12',
    apt_code: '08B12',
    owner_name: 'Trần Minh Tuấn',
    billing_month: 'Tháng 08/2026',
    due_date: '2026-08-30T23:59:59',
    total_amount: 6750000,
    status: 'Unpaid',
    status_color: '#DC2626',
    payment_qr_url: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=VNPAY_SKYLINE_08B12_6750000',
    invoice_pdf_url: '#',
    has_ai_anomaly: true,
    created_at: '2026-08-05T08:00:00',
    details: [
      {
        id: 'bd-11',
        bill_id: 'bill-2026-08-08b12',
        service_type: 'Electricity',
        usage: 1420,
        unit_price: 3200,
        total_line_amount: 4544000,
        ai_anomaly: true,
        anomaly_reason: 'BẤT THƯỜNG: Tiêu thụ điện tăng +180% so với định mức 1PN.',
      },
      {
        id: 'bd-12',
        bill_id: 'bill-2026-08-08b12',
        service_type: 'Water',
        usage: 12,
        unit_price: 18000,
        total_line_amount: 216000,
      },
      {
        id: 'bd-13',
        bill_id: 'bill-2026-08-08b12',
        service_type: 'Management_Fee',
        usage: 48.6,
        unit_price: 10000,
        total_line_amount: 486000,
      },
      {
        id: 'bd-14',
        bill_id: 'bill-2026-08-08b12',
        service_type: 'Parking',
        usage: 1,
        total_line_amount: 1504000,
      },
    ],
  },
];

export const DEMO_TICKETS: ServiceRequest[] = [
  {
    id: 'TICK-102',
    apartment_id: 'apt-12a05',
    apt_code: '12A05',
    resident_name: 'Nguyễn Hữu Lực',
    resident_phone: '0903112233',
    content: 'Vòi sen nhà tắm master bị rỉ nước liên tục khi khóa van chính.',
    ai_category: 'Nước',
    ai_priority: 1,
    priority_color: '#DC2626',
    sla_deadline: '2026-08-26T20:30:00',
    sla_minutes_left: 45,
    status: 'In_Progress',
    assigned_technician: 'Lê Văn Kỹ Thuật',
    before_image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop&q=80',
    after_image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&auto=format&fit=crop&q=80',
    created_at: '2026-08-26T17:00:00',
    updated_at: '2026-08-26T17:45:00',
  },
  {
    id: 'TICK-099',
    apartment_id: 'apt-12a05',
    apt_code: '12A05',
    resident_name: 'Nguyễn Hữu Lực',
    resident_phone: '0903112233',
    content: 'Aptomat nguồn điều hòa phòng khách thỉnh thoảng tự nhảy.',
    ai_category: 'Điện',
    ai_priority: 2,
    priority_color: '#D97706',
    sla_deadline: '2026-08-27T12:00:00',
    sla_minutes_left: 1080,
    status: 'Assigned',
    assigned_technician: 'Lê Văn Kỹ Thuật',
    before_image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80',
    after_image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80',
    created_at: '2026-08-26T14:20:00',
    updated_at: '2026-08-26T14:40:00',
  },
  {
    id: 'TICK-088',
    apartment_id: 'apt-08b12',
    apt_code: '08B12',
    resident_name: 'Trần Minh Tuấn',
    resident_phone: '0908776655',
    content: 'Thay ron đệm cách âm cửa chính ban công.',
    ai_category: 'Khác',
    ai_priority: 3,
    priority_color: '#16A34A',
    sla_deadline: '2026-08-25T18:00:00',
    sla_minutes_left: 0,
    status: 'Resolved',
    assigned_technician: 'Nguyễn Văn Thợ',
    before_image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80',
    after_image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80',
    created_at: '2026-08-24T09:00:00',
    updated_at: '2026-08-25T16:00:00',
  },
];

export const DEMO_DEVICES: Device[] = [
  {
    id: 'dev-1',
    name: 'Thang máy Schindler Tòa A - Số 01',
    category: 'Thang máy',
    location: 'Trục Tháp A (Tầng B2 -> 25)',
    health_score: 94.5,
    predict_date: '2026-11-15',
    last_maintenance: '2026-08-01',
    status: 'Hoạt động tốt',
  },
  {
    id: 'dev-2',
    name: 'Thang máy Schindler Tòa A - Số 02',
    category: 'Thang máy',
    location: 'Trục Tháp A (Tầng B2 -> 25)',
    health_score: 68.2,
    predict_date: '2026-09-02',
    last_maintenance: '2026-07-10',
    status: 'Cần kiểm tra',
  },
  {
    id: 'dev-3',
    name: 'Cụm Bơm Cấp Nước Sinh Hoạt Biến Tần Grundfos',
    category: 'Máy bơm',
    location: 'Phòng Kỹ thuật Tầng B2',
    health_score: 51.0,
    predict_date: '2026-08-29',
    last_maintenance: '2026-06-15',
    status: 'Cảnh báo hỏng',
  },
  {
    id: 'dev-4',
    name: 'Hệ thống Báo Cháy & Chữa Cháy Tự Động Hochiki',
    category: 'Hệ thống PCCC',
    location: 'Toàn bộ Tòa A & B',
    health_score: 99.0,
    predict_date: '2027-01-20',
    last_maintenance: '2026-08-15',
    status: 'Hoạt động tốt',
  },
];

export const DEMO_SECURITY_ALERTS: SecurityAlert[] = [
  {
    id: 'alert-01',
    alert_type: 'Fire',
    title: 'Camera AI phát hiện khói mỏng bất thường',
    location: 'Hầm B1 - Khu đỗ xe Ô tô ô số 42-45',
    camera_id: 'CAM-B1-08',
    snapshot_url: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=800&auto=format&fit=crop&q=80',
    confidence: 0.96,
    created_at: '2026-08-26T17:48:10',
    status: 'New',
  },
  {
    id: 'alert-02',
    alert_type: 'Crowd',
    title: 'Tập trung đông người ngoài khung giờ quy định',
    location: 'Sảnh chính Tòa A (Tầng 1)',
    camera_id: 'CAM-LOBBY-01',
    snapshot_url: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&auto=format&fit=crop&q=80',
    confidence: 0.88,
    created_at: '2026-08-26T16:20:00',
    status: 'Resolved',
  },
];

export const DEMO_FACILITIES: Facility[] = [
  {
    id: 'fac-1',
    name: 'Hồ Bơi Vô Cực Chân Mây (Skyline Horizon Pool)',
    category: 'Hồ bơi',
    max_quota_per_month: 20,
    hero_image_url: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=800&auto=format&fit=crop&q=80',
    rating_score: 4.9,
    operating_hours: '06:00 - 21:00',
    pricing: 'Miễn phí cho cư dân',
    current_occupancy: 14,
    max_capacity: 40,
  },
  {
    id: 'fac-2',
    name: 'Vườn BBQ Sân Thượng Panoramic Sky Garden',
    category: 'BBQ',
    max_quota_per_month: 4,
    hero_image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
    rating_score: 4.8,
    operating_hours: '17:00 - 22:30',
    pricing: '200.000 đ / lượt (Phí vệ sinh)',
    current_occupancy: 2,
    max_capacity: 5,
  },
  {
    id: 'fac-3',
    name: 'Phòng Tập Technogym Thượng Lưu (Fitness & Yoga)',
    category: 'Gym',
    max_quota_per_month: 30,
    hero_image_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80',
    rating_score: 5.0,
    operating_hours: '05:30 - 22:00',
    pricing: 'Miễn phí cho cư dân',
    current_occupancy: 8,
    max_capacity: 25,
  },
];

export const DEMO_COMMUNITY_POSTS: CommunityPost[] = [
  {
    id: 'post-1',
    author_name: 'Ban Quản Lý Tòa Nhà SKYLINE',
    author_role: 'BQL',
    title: 'Thông báo lịch bảo dưỡng định kỳ hệ thống thang máy Tháp A',
    content: 'Ban Quản lý xin thông báo kế hoạch kiểm tra kỹ thuật định kỳ thang máy số 02 vào ngày 28/08/2026 từ 09:00 - 11:30. Kính mong Quý cư dân sử dụng thang số 01 và 03 trong thời gian trên.',
    ai_moderation: 'Clean',
    ai_sentiment: 0.85,
    tags: ['Bảo trì', 'Thông báo BQL', 'Thang máy'],
    likes: 42,
    comments_count: 5,
    is_pinned: true,
    created_at: '2026-08-25T10:00:00',
  },
  {
    id: 'post-2',
    author_name: 'Nguyễn Hữu Lực (Căn 12A05)',
    author_role: 'Cư dân',
    apt_code: '12A05',
    title: 'Trao đổi lại bộ bàn ghế đọc sách ban công bằng gỗ sồi còn mới 95%',
    content: 'Gia đình mình vừa thay đổi nội thất nên muốn nhượng lại bộ bàn ghế ban công gọn nhẹ cho bác nào có nhu cầu, có thể qua xem trực tiếp tại căn 12A05.',
    ai_moderation: 'Clean',
    ai_sentiment: 0.92,
    tags: ['Rao vặt', 'Nội thất', 'Cộng đồng'],
    likes: 18,
    comments_count: 3,
    created_at: '2026-08-26T11:30:00',
  },
];

export const DEMO_SURVEYS: Survey[] = [
  {
    id: 'sur-01',
    title: 'Biểu quyết Thông qua Phương án Nâng cấp Hệ thống Kiểm soát Xe Thông minh ALPR Hầm B2',
    description: 'Chiến dịch lấy ý kiến hợp pháp của các Chủ sở hữu căn hộ về việc trích Quỹ Bảo trì để nâng cấp camera AI ALPR tốc độ cao.',
    legal_type: 'Bầu Ban Quản Trị',
    deadline: '2026-09-10T23:59:59',
    is_owner_only: true,
    total_votes: 182,
    options: [
      { id: 'opt-1', text: 'Đồng ý phương án nâng cấp (Dự toán 150 triệu)', votes: 146 },
      { id: 'opt-2', text: 'Không đồng ý, giữ nguyên hiện trạng', votes: 24 },
      { id: 'opt-3', text: 'Ý kiến khác', votes: 12 },
    ],
    user_voted: 'opt-1',
  },
];
