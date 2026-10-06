-- ============================================================================
-- CHUNG CƯ CAO CẤP SKYLINE SMART RESIDENCE & THE TROPICAL (BEVERLY SOLARI)
-- HỆ CƠ SỞ DỮ LIỆU POSTGRESQL CHUẨN MỰC TOÀN DIỆN (DDL + DML + ANALYTIC VIEWS)
-- Đồng bộ 100% dữ liệu thực tế từ codebase:
-- - Cư dân & Ban Quản Lý (userStore.ts, dataStore.ts)
-- - Căn hộ & Khối nhà (apartmentStore.ts, nksProjectService.ts)
-- - Kỹ thuật viên & Phiếu bảo trì phân loại AI/BQL/KTV (ticketStore.ts, ticketClassification.ts)
-- - Thiết bị Smart Home, Kịch bản tự động hóa & Khóa cửa FaceID (smartHomeStore.ts)
-- - Quản lý Khách thăm QR & Nhật ký an ninh (visitorStore.ts)
-- - Hóa đơn dịch vụ & Phát hiện rò rỉ nước AI (billingStore.ts, dataStore.ts)
-- - Biểu quyết & Lấy ý kiến cư dân hợp pháp (votingStore.ts)
-- ============================================================================

-- Bật extension hỗ trợ UUID nếu cần
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- XÓA BẢNG VÀ VIEW CŨ THEO THỨ TỰ RÀNG BUỘC KHÓA NGOẠI
-- ============================================================================
DROP VIEW IF EXISTS v_apartment_billing_overview CASCADE;
DROP VIEW IF EXISTS v_ticket_classification_analytics CASCADE;
DROP VIEW IF EXISTS v_technician_payroll_report CASCADE;

DROP TABLE IF EXISTS ai_chat_messages CASCADE;
DROP TABLE IF EXISTS ai_chat_conversations CASCADE;
DROP TABLE IF EXISTS voting_records CASCADE;
DROP TABLE IF EXISTS voting_options CASCADE;
DROP TABLE IF EXISTS voting_topics CASCADE;
DROP TABLE IF EXISTS survey_votes CASCADE;
DROP TABLE IF EXISTS surveys CASCADE;
DROP TABLE IF EXISTS community_posts CASCADE;
DROP TABLE IF EXISTS bill_details CASCADE;
DROP TABLE IF EXISTS bills CASCADE;
DROP TABLE IF EXISTS visitor_gate_logs CASCADE;
DROP TABLE IF EXISTS visitor_passes CASCADE;
DROP TABLE IF EXISTS facility_access_logs CASCADE;
DROP TABLE IF EXISTS facility_bookings CASCADE;
DROP TABLE IF EXISTS facilities CASCADE;
DROP TABLE IF EXISTS parking_slots CASCADE;
DROP TABLE IF EXISTS service_tickets CASCADE;
DROP TABLE IF EXISTS technicians CASCADE;
DROP TABLE IF EXISTS smart_door_access_logs CASCADE;
DROP TABLE IF EXISTS smart_guest_pins CASCADE;
DROP TABLE IF EXISTS smart_automation_rules CASCADE;
DROP TABLE IF EXISTS smart_devices CASCADE;
DROP TABLE IF EXISTS apartment_members CASCADE;
DROP TABLE IF EXISTS apartments CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS blocks CASCADE;
DROP TABLE IF EXISTS floors CASCADE;
DROP TABLE IF EXISTS condominiums CASCADE;

-- ============================================================================
-- 1. BẢNG THÔNG TIN TỔNG THỂ DỰ ÁN CHUNG CƯ (CONDOMINIUMS)
-- ============================================================================
CREATE TABLE condominiums (
    id SERIAL PRIMARY KEY,
    condo_code VARCHAR(50) UNIQUE NOT NULL DEFAULT 'SKYLINE_RESIDENCE',
    condo_name VARCHAR(150) NOT NULL,
    address VARCHAR(255) NOT NULL,
    total_floors INT NOT NULL DEFAULT 25,
    basement_floors INT NOT NULL DEFAULT 2,
    total_apartments INT NOT NULL DEFAULT 240,
    investor VARCHAR(150) NOT NULL,
    management_company VARCHAR(150) NOT NULL,
    hotline VARCHAR(50) DEFAULT '1900 8899',
    handover_year INT DEFAULT 2026,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE condominiums IS 'Thông tin pháp lý và quy chuẩn của Dự án Chung Cư Skyline Smart Residence';

-- ============================================================================
-- 2. BẢNG KHỐI NHÀ / TÒA NHÀ (BLOCKS) - Đồng bộ NKS SCRMAI API
-- ============================================================================
CREATE TABLE blocks (
    id INT PRIMARY KEY, -- 880, 883, 886, 889 (NKS ID)
    condo_id INT NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE,
    block_code VARCHAR(30) UNIQUE NOT NULL, -- BS-07, BS-08, BS-09, BS-10
    block_name VARCHAR(150) NOT NULL,
    total_floors INT NOT NULL DEFAULT 34,
    manager_name VARCHAR(150) DEFAULT 'Nguyễn Văn Quản Trị (Trưởng BQL)',
    manager_phone VARCHAR(20) DEFAULT '0901888999',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE blocks IS 'Khối nhà/tòa chung cư theo chuẩn dữ liệu NKS SCRMAI API (The Tropical BS-07 đến BS-10)';

-- ============================================================================
-- 3. BẢNG MẶT BẰNG TẦNG (FLOORS) - TRỌN BỘ 25 TẦNG NỔI & 2 TẦNG HẦM
-- ============================================================================
CREATE TABLE floors (
    floor_number INT PRIMARY KEY, -- -2: Hầm B2, -1: Hầm B1, 1..25: Tầng 1 đến 25
    floor_code VARCHAR(20) UNIQUE NOT NULL, -- B2, B1, T1, T2, ..., T12A, ..., T25
    floor_name VARCHAR(150) NOT NULL,
    floor_type VARCHAR(50) NOT NULL CHECK (floor_type IN ('BASEMENT', 'COMMERCIAL_AMENITY', 'RESIDENTIAL', 'ROOFTOP_AMENITY')),
    floor_function TEXT NOT NULL,
    units_count INT DEFAULT 0,
    condo_id INT NOT NULL REFERENCES condominiums(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE floors IS 'Sườn dữ liệu chuẩn xác trọn bộ 25 tầng nổi và 2 tầng hầm của chung cư';

-- ============================================================================
-- 4. BẢNG CĂN HỘ CHUNG CƯ (APARTMENTS)
-- ============================================================================
CREATE TABLE apartments (
    id VARCHAR(50) PRIMARY KEY, -- apt-12a05, apt-ch06, apt-25ph01
    apt_code VARCHAR(30) UNIQUE NOT NULL, -- 12A05, CH-06, 25PH-01, 18A01...
    block_id INT REFERENCES blocks(id) ON DELETE SET NULL,
    tower_code VARCHAR(20) DEFAULT 'A', -- Tháp A, Tháp B
    floor_number INT NOT NULL REFERENCES floors(floor_number) ON DELETE RESTRICT,
    wing VARCHAR(20) DEFAULT 'SOUTH' CHECK (wing IN ('NORTH', 'SOUTH', 'WEST', 'CENTRAL')),
    apt_type VARCHAR(30) NOT NULL CHECK (apt_type IN ('STUDIO', '1PN', '2PN', '3PN', 'DUPLEX_PENTHOUSE')),
    type_label VARCHAR(100) NOT NULL,
    wall_area NUMERIC(6, 2) NOT NULL, -- Diện tích tim tường (m2)
    clear_area NUMERIC(6, 2) NOT NULL, -- Diện tích thông thủy (m2)
    bedrooms INT NOT NULL DEFAULT 2,
    bathrooms INT NOT NULL DEFAULT 2,
    balcony_direction VARCHAR(100) DEFAULT 'Đông Nam',
    main_door_direction VARCHAR(100) DEFAULT 'Tây Bắc',
    price_billion NUMERIC(6, 2) NOT NULL,
    price_vnd NUMERIC(15, 2) NOT NULL,
    legal_status VARCHAR(50) DEFAULT 'Pink_Book', -- Sổ hồng / SPA
    status VARCHAR(50) DEFAULT 'Đã bàn giao' CHECK (status IN ('Đã bàn giao', 'Đang trống', 'Đang bảo trì', 'Đang nghiệm thu')),
    owner_id VARCHAR(50), -- Khóa ngoại trỏ về users(id)
    handover_date DATE,
    handover_protocol VARCHAR(100),
    nks_id INT, -- ID định danh từ NKS API
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE apartments IS 'Thông tin chi tiết các căn hộ chung cư phân bổ từ tầng 5 đến tầng 25';

-- ============================================================================
-- 5. BẢNG TÀI KHOẢN NGƯỜI DÙNG & CƯ DÂN (USERS)
-- ============================================================================
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY, -- user-owner-1, user-manager-1, user-tech-1...
    username VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('ADMIN', 'OWNER', 'TENANT', 'TECHNICIAN', 'RECEPTIONIST')),
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    password_hash VARCHAR(255) DEFAULT '12345678',
    id_card_no VARCHAR(20), -- CCCD gắn chip 12 chữ số
    id_date DATE,
    id_place VARCHAR(150),
    dob DATE,
    pob VARCHAR(150),
    gender SMALLINT DEFAULT 1 CHECK (gender IN (0, 1)), -- 1: Nam, 0: Nữ
    avatar_url TEXT,
    license_plate VARCHAR(30),
    apartment_code VARCHAR(30) REFERENCES apartments(apt_code) ON DELETE SET NULL,
    relationship VARCHAR(50) DEFAULT 'Owner', -- Owner, Family, Tenant, Staff
    emergency_phone VARCHAR(20),
    face_vector TEXT, -- Vector nhận diện FaceID
    ekyc_approved BOOLEAN DEFAULT TRUE,
    ui_language VARCHAR(10) DEFAULT 'vi',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE users IS 'Quản lý tài khoản cư dân, chủ hộ, ban quản lý, kỹ thuật viên và lễ tân';

-- Thiết lập ràng buộc khóa ngoại chủ sở hữu từ apartments về users
ALTER TABLE apartments ADD CONSTRAINT fk_apartment_owner 
FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL;

-- ============================================================================
-- 6. BẢNG THÀNH VIÊN GIA ĐÌNH CĂN HỘ (APARTMENT_MEMBERS)
-- ============================================================================
CREATE TABLE apartment_members (
    id VARCHAR(50) PRIMARY KEY,
    apartment_code VARCHAR(30) NOT NULL REFERENCES apartments(apt_code) ON DELETE CASCADE,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    id_card VARCHAR(20),
    relationship VARCHAR(100) NOT NULL, -- 'Em trai', 'Vợ', 'Chồng', 'Con', 'Người thân'
    role VARCHAR(30) DEFAULT 'Family',
    license_plate VARCHAR(30),
    face_status VARCHAR(50) DEFAULT 'Đã xác thực',
    avatar_url TEXT,
    added_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE apartment_members IS 'Thành viên cùng sinh sống và đăng ký thường trú trong căn hộ';

-- ============================================================================
-- 7. BẢNG HỒ SƠ & BẢNG LƯƠNG KỸ THUẬT VIÊN (TECHNICIANS) - ticketStore.ts
-- ============================================================================
CREATE TABLE technicians (
    id VARCHAR(30) PRIMARY KEY, -- KTV-01, KTV-02, KTV-03
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    specialty VARCHAR(150) NOT NULL, -- Cơ Điện & Nước, Điện Lạnh, Vệ Sinh...
    base_salary NUMERIC(12, 2) NOT NULL DEFAULT 8500000, -- Lương cơ bản tháng
    pay_per_ticket NUMERIC(12, 2) NOT NULL DEFAULT 150000, -- Tiền công/phiếu
    bonus_per_fivestar NUMERIC(12, 2) NOT NULL DEFAULT 50000, -- Thưởng 5 sao/phiếu
    status VARCHAR(30) DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'BUSY', 'OFF_DUTY')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE technicians IS 'Hồ sơ nhân sự kỹ thuật tòa nhà và cơ chế tính lương thù lao theo ca sửa';

-- ============================================================================
-- 8. BẢNG THIẾT BỊ NHÀ THÔNG MINH IOT (SMART_DEVICES) - smartHomeStore.ts
-- ============================================================================
CREATE TABLE smart_devices (
    id VARCHAR(50) PRIMARY KEY,
    apartment_code VARCHAR(30) NOT NULL REFERENCES apartments(apt_code) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    device_type VARCHAR(50) NOT NULL CHECK (device_type IN ('light', 'ac', 'door', 'curtain', 'sensor')),
    status VARCHAR(50) NOT NULL DEFAULT 'off',
    set_value NUMERIC(5, 1) DEFAULT 0, -- Giá trị thiết lập (24°C, v.v.)
    location_x NUMERIC(5, 2) DEFAULT 0,
    location_y NUMERIC(5, 2) DEFAULT 0,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE smart_devices IS 'Hệ sinh thái thiết bị IoT thông minh trong căn hộ';

-- ============================================================================
-- 9. BẢNG KỊCH BẢN TỰ ĐỘNG HÓA THÔNG MINH (SMART_AUTOMATION_RULES)
-- ============================================================================
CREATE TABLE smart_automation_rules (
    id VARCHAR(50) PRIMARY KEY,
    apartment_code VARCHAR(30) NOT NULL REFERENCES apartments(apt_code) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    trigger_time VARCHAR(50) NOT NULL,
    trigger_type VARCHAR(30) NOT NULL CHECK (trigger_type IN ('TIME', 'SENSOR', 'CLIMATE')),
    trigger_label VARCHAR(150) NOT NULL,
    description TEXT,
    action_summary TEXT NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    repeat_days VARCHAR(100) DEFAULT 'Hàng ngày',
    icon VARCHAR(30) DEFAULT 'sun',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE smart_automation_rules IS 'Các kịch bản tự động hóa thông minh (Bình minh, Hoàng hôn, Khóa đêm, Rò rỉ nước AI)';

-- ============================================================================
-- 10. BẢNG MÃ PIN TẠM THỜI MỞ CỬA CHO KHÁCH (SMART_GUEST_PINS)
-- ============================================================================
CREATE TABLE smart_guest_pins (
    id VARCHAR(50) PRIMARY KEY,
    apartment_code VARCHAR(30) NOT NULL REFERENCES apartments(apt_code) ON DELETE CASCADE,
    pin_code VARCHAR(10) NOT NULL,
    label VARCHAR(150) NOT NULL,
    created_by VARCHAR(150) DEFAULT 'Chủ Hộ (Master)',
    status VARCHAR(30) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXPIRED', 'REVOKED')),
    max_uses INT DEFAULT 5,
    used_count INT DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE smart_guest_pins IS 'Mã PIN OTP tạm thời cấp cho khách vào căn hộ';

-- ============================================================================
-- 11. BẢNG NHẬT KÝ MỞ KHÓA THÔNG MINH (SMART_DOOR_ACCESS_LOGS)
-- ============================================================================
CREATE TABLE smart_door_access_logs (
    id VARCHAR(50) PRIMARY KEY,
    apartment_code VARCHAR(30) NOT NULL REFERENCES apartments(apt_code) ON DELETE CASCADE,
    user_name VARCHAR(150) NOT NULL,
    role VARCHAR(50) DEFAULT 'Chủ hộ',
    method VARCHAR(30) NOT NULL CHECK (method IN ('FACE_ID', 'PIN_OTP', 'NFC_CARD', 'REMOTE_APP', 'PHYSICAL_KEY', 'AUTO_LOCK')),
    status VARCHAR(30) NOT NULL CHECK (status IN ('SUCCESS', 'DENIED')),
    detail TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE smart_door_access_logs IS 'Lịch sử mở cửa căn hộ bằng FaceID, PIN hoặc App di động';

-- ============================================================================
-- 12. BẢNG BÃI ĐỖ XE THÔNG MINH (PARKING_SLOTS)
-- ============================================================================
CREATE TABLE parking_slots (
    id VARCHAR(50) PRIMARY KEY,
    slot_code VARCHAR(30) UNIQUE NOT NULL, -- Ô B2-A15, Khu B1-M88
    floor_number INT NOT NULL REFERENCES floors(floor_number) ON DELETE RESTRICT,
    vehicle_type VARCHAR(20) NOT NULL CHECK (vehicle_type IN ('CAR', 'MOTORCYCLE')),
    apartment_code VARCHAR(30) REFERENCES apartments(apt_code) ON DELETE SET NULL,
    assigned_user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    assigned_license_plate VARCHAR(30),
    rfid_card_code VARCHAR(50) UNIQUE,
    status VARCHAR(30) DEFAULT 'OCCUPIED' CHECK (status IN ('VACANT', 'OCCUPIED', 'RESERVED')),
    monthly_fee NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE parking_slots IS 'Vị trí đỗ xe định danh tại 2 tầng hầm B1 và B2 của chung cư';

-- ============================================================================
-- 13. BẢNG 5 TIỆN ÍCH 5 SAO CHUNG CƯ (FACILITIES)
-- ============================================================================
CREATE TABLE facilities (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('Hồ bơi', 'Gym', 'Xông hơi', 'Khu trẻ em', 'BBQ')),
    floor_number INT NOT NULL REFERENCES floors(floor_number) ON DELETE RESTRICT,
    location_detail VARCHAR(150) NOT NULL,
    operating_hours VARCHAR(50) NOT NULL,
    pricing VARCHAR(150) NOT NULL,
    max_quota_per_month INT DEFAULT 20,
    rating_score NUMERIC(3, 1) DEFAULT 5.0,
    current_occupancy INT DEFAULT 0,
    max_capacity INT DEFAULT 40,
    hero_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE facilities IS 'Danh mục 5 đại tiện ích 5 sao độc quyền của chung cư Skyline';

-- ============================================================================
-- 14. BẢNG ĐẶT CHỖ TIỆN ÍCH (FACILITY_BOOKINGS)
-- ============================================================================
CREATE TABLE facility_bookings (
    id VARCHAR(50) PRIMARY KEY,
    apartment_code VARCHAR(30) NOT NULL REFERENCES apartments(apt_code) ON DELETE CASCADE,
    facility_id VARCHAR(50) NOT NULL REFERENCES facilities(id) ON DELETE RESTRICT,
    booker_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    booker_name VARCHAR(150) NOT NULL,
    ticket_code VARCHAR(100) UNIQUE NOT NULL,
    booking_date DATE NOT NULL,
    time_slot VARCHAR(100) NOT NULL,
    guest_count INT DEFAULT 1,
    duration_hours INT DEFAULT 1,
    deposit_amount NUMERIC(15, 2) DEFAULT 0,
    pricing VARCHAR(100),
    payment_method VARCHAR(100),
    status VARCHAR(30) DEFAULT 'CONFIRMED' CHECK (status IN ('CONFIRMED', 'CHECKED_IN', 'CANCELLED')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE facility_bookings IS 'Sổ vé điện tử đặt chỗ tiện ích riêng tư (Xông hơi VIP, BBQ Panorama)';

-- ============================================================================
-- 15. BẢNG LỊCH SỬ VÀO TIỆN ÍCH (FACILITY_ACCESS_LOGS)
-- ============================================================================
CREATE TABLE facility_access_logs (
    id VARCHAR(50) PRIMARY KEY,
    facility_id VARCHAR(50) NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    apartment_code VARCHAR(30) REFERENCES apartments(apt_code) ON DELETE SET NULL,
    user_name VARCHAR(150) NOT NULL,
    user_role VARCHAR(50),
    method VARCHAR(30) NOT NULL CHECK (method IN ('NFC_CARD', 'FACE_ID')),
    card_uid VARCHAR(100),
    status VARCHAR(30) NOT NULL CHECK (status IN ('SUCCESS', 'DENIED')),
    scanned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

COMMENT ON TABLE facility_access_logs IS 'Nhật ký nhận diện FaceID hoặc quẹt thẻ từ vào cổng tiện ích';

-- ============================================================================
-- 16. BẢNG THẺ KHÁCH THĂM (VISITOR_PASSES) - visitorStore.ts
-- ============================================================================
CREATE TABLE visitor_passes (
    id VARCHAR(50) PRIMARY KEY, -- SKY-PASS-8492, SKY-PASS-6521
    apartment_code VARCHAR(30) NOT NULL REFERENCES apartments(apt_code) ON DELETE CASCADE,
    host_user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    host_name VARCHAR(150) NOT NULL,
    host_phone VARCHAR(20) NOT NULL,
    tower_name VARCHAR(100) DEFAULT 'Tropical BS-07',
    visitor_name VARCHAR(150) NOT NULL,
    visitor_phone VARCHAR(20),
    license_plate VARCHAR(30),
    entry_type VARCHAR(20) DEFAULT 'SINGLE' CHECK (entry_type IN ('SINGLE', 'MULTI')),
    purpose VARCHAR(50) DEFAULT 'VISITOR',
    purpose_label VARCHAR(150) DEFAULT 'Khách Thăm Căn Hộ',
    valid_hours INT DEFAULT 4,
    qr_data TEXT NOT NULL,
    pin_code VARCHAR(10) NOT NULL,
    status VARCHAR(30) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CHECKED_IN', 'COMPLETED', 'EXPIRED')),
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
    checked_in_at VARCHAR(100),
    checked_out_at VARCHAR(100)
);

COMMENT ON TABLE visitor_passes IS 'Thẻ khách thăm cấp mã QR và PIN mở cổng thang máy tự động';

-- ============================================================================
-- 17. BẢNG NHẬT KÝ RA VÀO CỔNG KHÁCH (VISITOR_GATE_LOGS)
-- ============================================================================
CREATE TABLE visitor_gate_logs (
    id VARCHAR(50) PRIMARY KEY,
    pass_id VARCHAR(50) REFERENCES visitor_passes(id) ON DELETE SET NULL,
    apartment_code VARCHAR(30) NOT NULL REFERENCES apartments(apt_code) ON DELETE CASCADE,
    host_name VARCHAR(150),
    visitor_name VARCHAR(150),
    license_plate VARCHAR(30),
    action VARCHAR(30) NOT NULL CHECK (action IN ('SCAN', 'CHECK_IN', 'CHECK_OUT')),
    result VARCHAR(30) NOT NULL CHECK (result IN ('VALID', 'INVALID', 'EXPIRED')),
    scanned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    checkpoint VARCHAR(100) DEFAULT 'Sảnh Lễ Tân / Chốt An Ninh',
    notes TEXT
);

COMMENT ON TABLE visitor_gate_logs IS 'Nhật ký kiểm soát an ninh khách đến thăm căn hộ';

-- ============================================================================
-- 18. BẢNG HÓA ĐƠN DỊCH VỤ SINH HOẠT (BILLS) - dataStore.ts
-- ============================================================================
CREATE TABLE bills (
    id VARCHAR(50) PRIMARY KEY, -- bill-2026-08-12a05
    apartment_code VARCHAR(30) NOT NULL REFERENCES apartments(apt_code) ON DELETE CASCADE,
    owner_name VARCHAR(150) NOT NULL,
    billing_month VARCHAR(30) NOT NULL, -- Tháng 08/2026
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    status VARCHAR(30) DEFAULT 'Unpaid' CHECK (status IN ('Draft', 'Unpaid', 'Partial', 'Paid', 'Overdue')),
    payment_qr_url TEXT,
    has_ai_anomaly BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE bills IS 'Hóa đơn tổng hợp điện, nước, phí quản lý, gửi xe và internet hàng tháng';

-- ============================================================================
-- 19. BẢNG CHI TIẾT DỊCH VỤ HÓA ĐƠN (BILL_DETAILS) - dataStore.ts
-- ============================================================================
CREATE TABLE bill_details (
    id VARCHAR(50) PRIMARY KEY,
    bill_id VARCHAR(50) NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    service_type VARCHAR(50) NOT NULL, -- Electricity, Water, Management_Fee, Parking, Internet
    service_name VARCHAR(150) NOT NULL,
    usage NUMERIC(10, 2), -- kWh, m3, m2, số lượng xe
    unit VARCHAR(30) DEFAULT 'lần', -- kWh, m³, m², xe, tháng
    unit_price NUMERIC(12, 2),
    total_line_amount NUMERIC(15, 2) NOT NULL,
    ai_anomaly BOOLEAN DEFAULT FALSE,
    anomaly_reason TEXT
);

COMMENT ON TABLE bill_details IS 'Bóc tách chi tiết từng dòng dịch vụ và cảnh báo AI phát hiện rò rỉ nước';

-- ============================================================================
-- 20. BẢNG PHIẾU BÁO HỎNG & KỸ THUẬT (SERVICE_TICKETS) - ticketStore.ts
-- Phân loại mục đích rõ ràng: REPAIR (KTV) | INQUIRY (AI 24/7) | FEEDBACK (BQL)
-- ============================================================================
CREATE TABLE service_tickets (
    id VARCHAR(50) PRIMARY KEY, -- TICK-102, TICK-099, TICK-INQ-01, TICK-FB-01
    apartment_code VARCHAR(30) NOT NULL REFERENCES apartments(apt_code) ON DELETE CASCADE,
    resident_name VARCHAR(150) NOT NULL,
    resident_phone VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    ai_category VARCHAR(50) NOT NULL CHECK (ai_category IN ('Điện', 'Nước', 'Vệ sinh', 'An ninh', 'Khác')),
    ai_priority INT DEFAULT 2 CHECK (ai_priority IN (1, 2, 3)), -- 1: Khẩn cấp, 2: Tiêu chuẩn, 3: Bình thường
    priority_color VARCHAR(20) DEFAULT '#D97706',
    sla_deadline TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'Open' CHECK (status IN ('Open', 'Assigned', 'In_Progress', 'Resolved')),
    
    -- Phân loại đối tượng xử lý
    ticket_type VARCHAR(50) NOT NULL DEFAULT 'REPAIR' CHECK (ticket_type IN ('REPAIR', 'INQUIRY', 'FEEDBACK', 'SERVICE_REQUEST')),
    handled_by VARCHAR(50) NOT NULL DEFAULT 'TECHNICIAN' CHECK (handled_by IN ('AI', 'MANAGEMENT', 'TECHNICIAN')),
    
    -- Phản hồi tự động bằng AI (dành cho câu hỏi, quy chế)
    ai_reply TEXT,
    ai_replied_at TIMESTAMP WITH TIME ZONE,

    -- Phản hồi của Ban Quản Lý (dành cho phản ánh, khiếu nại)
    admin_reply TEXT,
    admin_replied_at TIMESTAMP WITH TIME ZONE,
    admin_replied_by VARCHAR(150) DEFAULT 'Ban Quản Lý Chung Cư Skyline',

    -- Kỹ thuật hiện trường (dành cho sự cố sửa chữa)
    assigned_technician_id VARCHAR(30) REFERENCES technicians(id) ON DELETE SET NULL,
    assigned_technician_name VARCHAR(150),
    assigned_technician_phone VARCHAR(20),
    scheduled_time TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    resident_feedback TEXT,
    rated_at TIMESTAMP WITH TIME ZONE,
    
    before_image TEXT,
    after_image TEXT,
    nks_id INT, -- Ánh xạ phiếu hệ thống NKS SCRMAI
    auto_dispatched BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE service_tickets IS 'Phiếu yêu cầu cư dân phân loại 3 kênh: AI 24/7 (Inquiry), BQL (Feedback), KTV (Repair)';

-- ============================================================================
-- 21. BẢNG BẢNG TIN TÒA NHÀ (COMMUNITY_POSTS) - dataStore.ts
-- ============================================================================
CREATE TABLE community_posts (
    id VARCHAR(50) PRIMARY KEY,
    author_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    author_name VARCHAR(150) NOT NULL,
    author_role VARCHAR(50) DEFAULT 'BQL',
    apt_code VARCHAR(30) REFERENCES apartments(apt_code) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'Thông báo',
    ai_moderation VARCHAR(30) DEFAULT 'Clean',
    ai_sentiment NUMERIC(3, 2) DEFAULT 0.85,
    tags TEXT[], -- ['Bảo trì', 'Thang máy']
    likes INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE community_posts IS 'Thông báo và tin tức vận hành từ Ban Quản Lý và cư dân';

-- ============================================================================
-- 22. BẢNG BIỂU QUYẾT & LẤY Ý KIẾN CƯ DÂN (VOTING_TOPICS) - votingStore.ts
-- ============================================================================
CREATE TABLE voting_topics (
    id VARCHAR(50) PRIMARY KEY, -- vote-01, vote-02, vote-03, vote-04
    code VARCHAR(30) UNIQUE NOT NULL, -- BQ-2026-01
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    legal_type VARCHAR(50) NOT NULL CHECK (legal_type IN ('Bầu Ban Quản Trị', 'Đóng góp Quỹ Bảo trì', 'Ý kiến Cải tạo', 'Quy Chế Chung Cư', 'Tiện Ích & Dịch Vụ')),
    created_by VARCHAR(150) NOT NULL DEFAULT 'Ban Quản Trị & Kỹ Thuật Tòa Nhà',
    deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(30) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED')),
    is_owner_only BOOLEAN DEFAULT TRUE,
    total_eligible_apartments INT DEFAULT 200,
    total_votes INT DEFAULT 0,
    summary_report TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE voting_options (
    id VARCHAR(50) PRIMARY KEY, -- opt-1-1, opt-1-2
    topic_id VARCHAR(50) NOT NULL REFERENCES voting_topics(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    votes_count INT DEFAULT 0
);

CREATE TABLE voting_records (
    id VARCHAR(50) PRIMARY KEY,
    topic_id VARCHAR(50) NOT NULL REFERENCES voting_topics(id) ON DELETE CASCADE,
    apartment_code VARCHAR(30) NOT NULL REFERENCES apartments(apt_code) ON DELETE CASCADE,
    voter_name VARCHAR(150) NOT NULL,
    option_id VARCHAR(50) NOT NULL REFERENCES voting_options(id) ON DELETE CASCADE,
    voted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_voting_apartment UNIQUE (topic_id, apartment_code)
);

COMMENT ON TABLE voting_topics IS 'Cuộc biểu quyết hợp pháp lấy ý kiến cư dân và chủ sở hữu căn hộ';
COMMENT ON TABLE voting_records IS 'Mỗi căn hộ chỉ được biểu quyết 01 phiếu duy nhất theo quy định';

-- ============================================================================
-- 23. BẢNG HỘI THOẠI SKYLINE AI CONCIERGE (AI_CHAT_CONVERSATIONS)
-- ============================================================================
CREATE TABLE ai_chat_conversations (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    apartment_code VARCHAR(30) REFERENCES apartments(apt_code) ON DELETE CASCADE,
    summary VARCHAR(255),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE ai_chat_messages (
    id VARCHAR(50) PRIMARY KEY,
    conversation_id VARCHAR(50) NOT NULL REFERENCES ai_chat_conversations(id) ON DELETE CASCADE,
    sender VARCHAR(20) NOT NULL CHECK (sender IN ('user', 'ai')),
    text TEXT NOT NULL,
    is_fallback BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE ai_chat_conversations IS 'Lịch sử hỏi đáp giữa cư dân và trợ lý ảo Skyline AI Concierge 24/7';

-- ============================================================================
-- CÁC CHỈ MỤC TỐI ƯU HÓA TRUY VẤN (INDEXES)
-- ============================================================================
CREATE INDEX idx_apartments_floor ON apartments(floor_number);
CREATE INDEX idx_apartments_owner ON apartments(owner_id);
CREATE INDEX idx_apartments_block ON apartments(block_id);
CREATE INDEX idx_members_apt ON apartment_members(apartment_code);
CREATE INDEX idx_devices_apt ON smart_devices(apartment_code);
CREATE INDEX idx_parking_apt ON parking_slots(apartment_code);
CREATE INDEX idx_parking_floor ON parking_slots(floor_number);
CREATE INDEX idx_facilities_floor ON facilities(floor_number);
CREATE INDEX idx_bookings_apt ON facility_bookings(apartment_code);
CREATE INDEX idx_bookings_fac ON facility_bookings(facility_id);
CREATE INDEX idx_passes_apt ON visitor_passes(apartment_code);
CREATE INDEX idx_bills_apt ON bills(apartment_code);
CREATE INDEX idx_tickets_apt ON service_tickets(apartment_code);
CREATE INDEX idx_tickets_ktv ON service_tickets(assigned_technician_id);
CREATE INDEX idx_tickets_type ON service_tickets(ticket_type);

-- ============================================================================
-- DỮ LIỆU MẪU CHUẨN XÁC: THÔNG TIN DỰ ÁN, TÒA NHÀ & TẦNG
-- ============================================================================

-- 1. Nạp Thông Tin Dự Án Chung Cư
INSERT INTO condominiums (
    id, condo_code, condo_name, address, total_floors, basement_floors, total_apartments, investor, management_company, hotline, handover_year, description
) VALUES (
    1, 'SKYLINE_RESIDENCE', 'Chung Cư Cao Cấp Skyline Smart Residence',
    'Số 12A Nguyễn Thị Thập, Phường Tân Phú, Quận 7, TP. Hồ Chí Minh',
    25, 2, 240, 'Skyline Group Corporation', 'Skyline Property Management Services',
    '1900 8899', 2026,
    'Tổ hợp chung cư thông minh 5 sao cao 25 tầng hiện đại bậc nhất Quận 7 với hệ thống Smart Home, nhận diện FaceID và 5 đại tiện ích đặc quyền.'
);

-- 2. Nạp Danh Sách Khối Nhà (Blocks) - The Tropical (Beverly Solari) khớp NKS API
INSERT INTO blocks (id, condo_id, block_code, block_name, total_floors, manager_name, manager_phone) VALUES
(880, 1, 'BS-07', 'Chung Cư Tropical BS-07', 34, 'Nguyễn Văn Quản Trị (Trưởng BQL)', '0901888999'),
(883, 1, 'BS-08', 'Chung Cư Tropical BS-08', 39, 'Nguyễn Văn Quản Trị (Trưởng BQL)', '0901888999'),
(886, 1, 'BS-09', 'Chung Cư Tropical BS-09', 34, 'Nguyễn Văn Quản Trị (Trưởng BQL)', '0901888999'),
(889, 1, 'BS-10', 'Chung Cư Tropical BS-10', 34, 'Nguyễn Văn Quản Trị (Trưởng BQL)', '0901888999');

-- 3. Nạp Trọn Bộ 27 Mặt Bằng Tầng (2 Tầng Hầm + 25 Tầng Nổi)
INSERT INTO floors (floor_number, floor_code, floor_name, floor_type, floor_function, units_count, condo_id) VALUES
(-2, 'B2', 'Tầng Hầm B2 - Bãi Đỗ Xe Ô Tô Định Danh', 'BASEMENT', 'Bãi đỗ xe ô tô cư dân định danh RFID, trạm biến áp trung thế, phòng máy bơm PCCC & bể xử lý kỹ thuật ngầm.', 0, 1),
(-1, 'B1', 'Tầng Hầm B1 - Bãi Đỗ Xe Máy & Trạm Sạc Xe Điện', 'BASEMENT', 'Bãi đỗ xe máy cư dân RFID, trạm sạc xe điện thông minh, chốt bảo vệ an ninh và khu phân loại rác trung tâm.', 0, 1),
(1,  'T1', 'Tầng 1 - Sảnh Đón Khách Grand Lobby & Sky Kids', 'COMMERCIAL_AMENITY', 'Sảnh lễ tân đón khách 5 sao, quầy BQL tiếp dân, Khu Vui Chơi Trẻ Em Sky Kids Zone (07:00 - 21:00) và Shophouse thương mại.', 0, 1),
(2,  'T2', 'Tầng 2 - Khối Thương Mại & Văn Phòng Điều Hành', 'COMMERCIAL_AMENITY', 'Khu văn phòng điều hành BQL tòa nhà, phòng giám sát an ninh camera AI tập trung và shophouse dịch vụ tiện ích.', 0, 1),
(3,  'T3', 'Tầng 3 - Khu Tiện Ích Thể Thao & Chăm Sóc Sức Khỏe', 'COMMERCIAL_AMENITY', 'Trung Tâm Thể Hình Technogym mở cửa 24/7 suốt ngày đêm và Phòng Xông Hơi Đá Muối Himalaya VIP khép kín gia đình (08:00 - 22:00).', 0, 1),
(4,  'T4', 'Tầng 4 - Sinh Hoạt Cộng Đồng & Vườn Treo Thảo Mộc', 'COMMERCIAL_AMENITY', 'Hội trường sinh hoạt cộng đồng, thư viện số cư dân, không gian làm việc Co-working và vườn treo thư giãn.', 0, 1),
(5,  'T5', 'Tầng 5 - Tầng Căn Hộ Khởi Đầu', 'RESIDENTIAL', 'Khu căn hộ ở tiêu chuẩn 5 sao với thiết kế 1PN, 2PN, 3PN đón ánh sáng tự nhiên.', 10, 1),
(6,  'T6', 'Tầng 6 - Căn Hộ Cư Dân Cao Cấp', 'RESIDENTIAL', 'Khu căn hộ ở tiêu chuẩn view công viên nội khu và hồ cảnh quan.', 10, 1),
(7,  'T7', 'Tầng 7 - Căn Hộ Cư Dân Cao Cấp', 'RESIDENTIAL', 'Khu căn hộ ở tiêu chuẩn hướng sông thoáng mát.', 10, 1),
(8,  'T8', 'Tầng 8 - Căn Hộ Cư Dân Cao Cấp', 'RESIDENTIAL', 'Khu căn hộ ở tiêu chuẩn 2PN và 3PN view toàn cảnh.', 10, 1),
(9,  'T9', 'Tầng 9 - Căn Hộ Cư Dân Cao Cấp', 'RESIDENTIAL', 'Khu căn hộ ở tiêu chuẩn đón gió tự nhiên Đông Nam.', 10, 1),
(10, 'T10', 'Tầng 10 - Căn Hộ Cư Dân (Đang Nghiệm Thu Kỹ Thuật)', 'RESIDENTIAL', 'Khu căn hộ cư dân, bao gồm Căn 10A03 đang trong giai đoạn nghiệm thu kỹ thuật bàn giao.', 10, 1),
(11, 'T11', 'Tầng 11 - Căn Hộ Cư Dân Cao Cấp', 'RESIDENTIAL', 'Khu căn hộ ở cao cấp hoàn thiện nội thất chuẩn 5 sao.', 10, 1),
(12, 'T12', 'Tầng 12 - Căn Hộ Cư Dân Cao Cấp', 'RESIDENTIAL', 'Khu căn hộ ở cao cấp yên tĩnh, cách âm 3 lớp tiêu chuẩn Châu Âu.', 10, 1),
(13, 'T12A', 'Tầng 12A - Căn Hộ Thông Minh Cư Dân Thực Tế', 'RESIDENTIAL', 'Khu căn hộ thông minh trung tâm, trong đó Căn 12A05 là căn hộ cư dân thực tế của Chủ hộ Trần Hữu Lực.', 10, 1),
(14, 'T14', 'Tầng 14 - Căn Hộ Cư Dân Cao Cấp', 'RESIDENTIAL', 'Khu căn hộ ở tầng trung thoáng mát, view sông Sài Gòn.', 10, 1),
(15, 'T15', 'Tầng 15 - Căn Hộ Cư Dân Cao Cấp', 'RESIDENTIAL', 'Khu căn hộ ở cao cấp thiết kế tối ưu hóa diện tích.', 10, 1),
(16, 'T16', 'Tầng 16 - Căn Hộ Cư Dân Cao Cấp', 'RESIDENTIAL', 'Khu căn hộ ở cao cấp tầm nhìn không giới hạn.', 10, 1),
(17, 'T17', 'Tầng 17 - Căn Hộ Cư Dân Cao Cấp', 'RESIDENTIAL', 'Khu căn hộ ở cao cấp đón trọn ánh sáng ban mai.', 10, 1),
(18, 'T18', 'Tầng 18 - Căn Hộ Cư Dân Cao Cấp', 'RESIDENTIAL', 'Khu căn hộ ở cao cấp view hoàng hôn thành phố.', 10, 1),
(19, 'T19', 'Tầng 19 - Căn Hộ Cư Dân Cao Cấp', 'RESIDENTIAL', 'Khu căn hộ ở cao cấp tầng cao thoáng đãng.', 10, 1),
(20, 'T20', 'Tầng 20 - Căn Hộ 3PN Gia Đình Đa Thế Hệ', 'RESIDENTIAL', 'Khu căn hộ cao cấp diện tích lớn, tiêu biểu Căn 20B01 (3PN - 108.2 m2).', 10, 1),
(21, 'T21', 'Tầng 21 - Căn Hộ Cư Dân Tầng Cao', 'RESIDENTIAL', 'Khu căn hộ ở tầng cao yên tĩnh, view nhìn triệu đô.', 10, 1),
(22, 'T22', 'Tầng 22 - Căn Hộ Cư Dân Sky Suite', 'RESIDENTIAL', 'Khu căn hộ cao cấp Sky Suite tầng 22 (Căn 22A01 3PN, 22A02 2PN).', 8, 1),
(23, 'T23', 'Tầng 23 - Căn Hộ Cư Dân Sky Suite Tầng Cao', 'RESIDENTIAL', 'Khu căn hộ cao cấp Sky Suite tầng 23 (Căn 23A01 3PN, 23A02 2PN).', 8, 1),
(24, 'T24', 'Tầng 24 - Căn Hộ Áp Mái Cao Cấp', 'RESIDENTIAL', 'Khu căn hộ áp mái sang trọng tầng 24 với tầm nhìn triệu đô ôm trọn sông Sài Gòn (Căn 24A01, 24A02).', 8, 1),
(25, 'T25', 'Tầng 25 - Sân Thượng Panoramic, Hồ Bơi Vô Cực, BBQ & Penthouse', 'ROOFTOP_AMENITY', 'Đại tiện ích Hồ Bơi Vô Cực Chân Mây (06:00 - 22:00), Vườn Tiệc Nướng BBQ Panoramic (17:00 - 23:00) và Tuyệt phẩm Duplex Penthouse 5 sao (25PH-01, 25PH-02).', 2, 1);

-- ============================================================================
-- DỮ LIỆU MẪU CĂN HỘ CHUẨN XÁC THEO CODEBASE & NKS CAD
-- ============================================================================
INSERT INTO apartments (
    id, apt_code, block_id, tower_code, floor_number, wing, apt_type, type_label, wall_area, clear_area, bedrooms, bathrooms, 
    balcony_direction, main_door_direction, price_billion, price_vnd, status, owner_id, handover_date, handover_protocol, nks_id, description
) VALUES 
-- Tầng 25: Duplex Penthouse Sân Thượng
('apt-25ph01', '25PH-01', 880, 'A', 25, 'CENTRAL', 'DUPLEX_PENTHOUSE', 'Duplex Penthouse 5 Sao', 232.0, 215.0, 4, 4, 'Đông Nam', 'Tây Bắc', 18.50, 18500000000, 'Đang trống', NULL, NULL, NULL, 9901, 'Tuyệt tác Penthouse thông tầng tầng 25, hồ bơi riêng Sky Garden và thang máy đặc quyền.'),
('apt-25ph02', '25PH-02', 880, 'A', 25, 'CENTRAL', 'DUPLEX_PENTHOUSE', 'Duplex Penthouse 5 Sao', 232.0, 215.0, 4, 4, 'Tây Nam', 'Đông Bắc', 18.20, 18200000000, 'Đang trống', NULL, NULL, NULL, 9902, 'Penthouse tầng 25 hướng hoàng hôn, sân thượng Sky Lounge 45m2 ngắm trọn thành phố.'),

-- Tầng 24: Sky Suite Áp Mái
('apt-24a01', '24A01', 880, 'A', 24, 'NORTH', '3PN', '3 Phòng Ngủ - 3WC', 119.5, 112.0, 3, 3, 'Đông Nam', 'Tây Bắc', 8.50, 8500000000, 'Đang trống', NULL, NULL, NULL, NULL, 'Căn hộ 3PN cao cấp áp mái tầng 24 với tầm nhìn triệu đô ôm trọn sông Sài Gòn.'),
('apt-24a02', '24A02', 880, 'A', 24, 'NORTH', '2PN', '2 Phòng Ngủ - 2WC', 83.2, 78.5, 2, 2, 'Tây Nam', 'Đông Bắc', 5.60, 5600000000, 'Đang trống', NULL, NULL, NULL, NULL, 'Căn 2PN tầng cao thoáng đãng đón gió tự nhiên, hoàn thiện nội thất cơ bản cao cấp.'),

-- Tầng 20: Gia Đình Đa Thế Hệ
('apt-20b01', '20B01', 880, 'A', 20, 'SOUTH', '3PN', '3 Phòng Ngủ - 3WC', 115.8, 108.2, 3, 3, 'Nam', 'Bắc', 7.20, 7200000000, 'Đã bàn giao', NULL, '2026-02-10', 'BBBG-SKYLINE-20B01-20260210', NULL, 'Căn hộ 3PN rộng rãi diện tích thông thủy 108.2 m2 dành cho gia đình đa thế hệ.'),

-- Tầng 18: Căn hộ 3PN Mẫu Tầng Cao
('apt-18a01', '18A01', 880, 'A', 18, 'NORTH', '3PN', '3 Phòng Ngủ - 3WC', 119.5, 112.0, 3, 3, 'Đông Nam', 'Tây Bắc', 7.60, 7600000000, 'Đang trống', NULL, NULL, NULL, NULL, 'Căn hộ 3PN mẫu tầng 18 view công viên nội khu và sông Sài Gòn.'),

-- Tầng 12A: Căn hộ Thực Tế của Chủ hộ Trần Hữu Lực (Khớp hoàn toàn với app)
('apt-12a05', '12A05', 880, 'A', 13, 'SOUTH', '2PN', '2 Phòng Ngủ - 2WC', 83.2, 78.5, 2, 2, 'Đông Nam', 'Tây Bắc', 4.85, 4850000000, 'Đã bàn giao', NULL, '2026-01-15', 'BBBG-SKYLINE-12A05-20260115', 8801, 'Căn hộ thông minh kiểu mẫu 12A05 của Chủ hộ Trần Hữu Lực tích hợp FaceID, IoT Daikin và cảm biến rò rỉ nước AI.'),
('apt-ch06', 'CH-06', 880, 'A', 13, 'SOUTH', '1PN', '1PN View Hồ Bơi (Căn Chủ Hộ NKS)', 45.0, 42.0, 1, 1, 'Đông Nam', 'Tây Nam', 3.40, 3400000000, 'Đã bàn giao', NULL, '2026-09-21', 'BBBG-TROPICAL-CH06-20260921', 8806, 'Căn hộ định danh theo mã NKS SCRMAI của Chủ hộ Trần Hữu Lực tại Tòa Tropical BS-07.'),

-- Tầng 10: Căn đang nghiệm thu BQL
('apt-10a03', '10A03', 880, 'A', 10, 'NORTH', '2PN', '2 Phòng Ngủ - 2WC', 79.8, 75.0, 2, 2, 'Tây Nam', 'Đông Bắc', 4.60, 4600000000, 'Đang nghiệm thu', NULL, NULL, NULL, NULL, 'Căn hộ 2PN tầng 10 đang trong giai đoạn nghiệm thu kỹ thuật trước bàn giao.'),

-- Tầng 08: Căn hộ 1PN mẫu
('apt-08a02', '08A02', 880, 'A', 8, 'NORTH', '1PN', '1 Phòng Ngủ - 1WC', 56.4, 52.0, 1, 1, 'Tây Nam', 'Đông Bắc', 2.95, 2950000000, 'Đang trống', NULL, NULL, NULL, NULL, 'Căn hộ 1PN diện tích thông thủy 52m2 tiện nghi đón gió.');

-- ============================================================================
-- DỮ LIỆU MẪU TÀI KHOẢN NGƯỜI DÙNG & CƯ DÂN (USERS)
-- ============================================================================
INSERT INTO users (
    id, username, role, full_name, phone, email, password_hash, id_card_no, id_date, id_place, dob, pob, gender, apartment_code, relationship, license_plate
) VALUES 
-- 1. Quản lý Tòa Nhà (Trưởng BQL)
('user-manager-1', 'nks.manager01@gmail.com', 'ADMIN', 'Nguyễn Văn Quản Trị (Trưởng BQL)', '0901888999', 'nks.manager01@gmail.com', 'admin123', '079204000888', '2021-05-10', 'Cục Cảnh sát QLHC về TTXH', '1988-04-12', 'TP. Hồ Chí Minh', 1, NULL, 'Staff', NULL),

-- 2. Chủ Hộ Thực Tế: Trần Hữu Lực (Căn 12A05 / CH-06)
('user-owner-1', '0364967082', 'OWNER', 'Trần Hữu Lực', '0364967082', 'huuluc04nhl@gmail.com', '12345678', '067204000961', '2022-08-15', 'Cục Cảnh sát QLHC về TTXH', '2004-08-18', 'Triệu Trạch, Triệu Phong, Quảng Trị', 1, '12A05', 'Owner', '51K-889.99'),

-- 3. Kỹ Thuật Viên 1: Lê Văn Kỹ Thuật (Cơ Điện & Nước)
('user-tech-1', '0909888777', 'TECHNICIAN', 'Lê Văn Kỹ Thuật', '0909888777', 'tech.skyline@gmail.com', '12345678', '079201009988', '2020-03-20', 'Cục Cảnh sát QLHC về TTXH', '1992-07-25', 'Hà Nội', 1, NULL, 'Staff', NULL),

-- 4. Kỹ Thuật Viên 2: Trần Văn Kỹ Thuật (Điện Lạnh & Kỹ Thuật Tòa Nhà)
('user-tech-2', '0901888998', 'TECHNICIAN', 'Trần Văn Kỹ Thuật', '0901888998', 'nks.manager02@gmail.com', '12345678', '079201009999', '2020-05-18', 'Cục Cảnh sát QLHC về TTXH', '1990-09-12', 'Đà Nẵng', 1, NULL, 'Staff', NULL),

-- 5. Lễ Tân Tòa Nhà: Trần Thị Thu Thảo
('user-recep-1', '0901234567', 'RECEPTIONIST', 'Trần Thị Thu Thảo', '0901234567', 'reception.skyline@gmail.com', '12345678', '079302008877', '2022-11-10', 'Cục Cảnh sát QLHC về TTXH', '1998-09-18', 'Đà Nẵng', 0, NULL, 'Staff', NULL),

-- 6. Cư Dân Người Thuê / Thành Viên: Nguyễn Hữu Nhựt
('user-tenant-1', '0917795211', 'TENANT', 'Nguyễn Hữu Nhựt', '0917795211', 'nguyenhuunhut1309@gmail.com', '12345678', '079198005678', '2022-09-02', 'Cục Cảnh sát QLHC về TTXH', '2004-09-02', 'TP. Hồ Chí Minh', 1, '12A05', 'Family', '59P1-886.79');

-- Cập nhật chủ sở hữu căn hộ 12A05 và CH-06
UPDATE apartments SET owner_id = 'user-owner-1' WHERE apt_code IN ('12A05', 'CH-06');

-- ============================================================================
-- DỮ LIỆU MẪU THÀNH VIÊN GIA ĐÌNH CĂN 12A05 (APARTMENT_MEMBERS)
-- ============================================================================
INSERT INTO apartment_members (
    id, apartment_code, user_id, full_name, phone, id_card, relationship, role, license_plate, face_status
) VALUES 
('mem-1', '12A05', 'user-tenant-1', 'Nguyễn Hữu Nhựt', '0917795211', '079198005678', 'Em Trai / Người Nhà', 'Family', '59P1-886.79', 'Đã xác thực'),
('mem-2', '12A05', NULL, 'Nguyễn Văn Cường', '0325524482', '074204001708', 'Người Thân Cùng Căn Hộ', 'Family', NULL, 'Đã xác thực'),
('mem-3', '12A05', NULL, 'Lê Đức Hải', '0977758215', '070204001704', 'Thành Viên Gia Đình', 'Family', NULL, 'Đã xác thực'),
('mem-4', '12A05', NULL, 'Vũ Cát Thịnh', '0909262626', '079201002626', 'Thành Viên Gia Đình', 'Family', NULL, 'Chờ duyệt FaceID');

-- ============================================================================
-- DỮ LIỆU MẪU ĐỘI NGŨ KỸ THUẬT VIÊN THỰC TẾ (TECHNICIANS) - ticketStore.ts
-- ============================================================================
INSERT INTO technicians (
    id, user_id, name, phone, email, specialty, base_salary, pay_per_ticket, bonus_per_fivestar, status
) VALUES 
('KTV-01', 'user-tech-1', 'Lê Văn Kỹ Thuật', '0909.888.777', 'tech.skyline@gmail.com', 'Cơ Điện & Nước', 8500000, 150000, 50000, 'AVAILABLE'),
('KTV-02', 'user-tech-2', 'Trần Văn Kỹ Thuật', '0901.888.998', 'nks.manager02@gmail.com', 'Điện Lạnh & Kỹ Thuật Tòa Nhà', 9000000, 180000, 50000, 'AVAILABLE'),
('KTV-03', NULL, 'Nguyễn Văn Nghiệp Vụ', '0908.777.666', 'vesinh.skyline@gmail.com', 'Vệ Sinh & Cảnh Quan Chung Cư', 8000000, 120000, 50000, 'AVAILABLE');

-- ============================================================================
-- DỮ LIỆU MẪU THIẾT BỊ NHÀ THÔNG MINH IOT (SMART_DEVICES) - smartHomeStore.ts
-- ============================================================================
INSERT INTO smart_devices (id, apartment_code, name, device_type, status, set_value, location_x, location_y) VALUES 
('dev-lock-01', '12A05', 'Khóa Thông Minh FaceID Cửa Chính', 'door', 'locked', 0, 15.5, 85.0),
('dev-light-01', '12A05', 'Hệ Thống Đèn Phòng Khách Luxury', 'light', 'on', 100, 45.0, 50.0),
('dev-light-02', '12A05', 'Đèn Phòng Ngủ Master', 'light', 'on', 80, 70.0, 35.0),
('dev-light-03', '12A05', 'Đèn Không Gian Bếp', 'light', 'on', 100, 30.0, 65.0),
('dev-ac-01', '12A05', 'Điều Hòa Daikin Inverter Inverter 24°C', 'ac', 'on', 24.0, 60.0, 30.0),
('dev-curtain-01', '12A05', 'Rèm Cửa Tự Động Ban Công', 'curtain', 'open', 100, 85.0, 50.0),
('dev-sensor-01', '12A05', 'Cảm Biến Dòng Chảy & Rò Rỉ Nước AI', 'sensor', 'active', 0, 25.0, 20.0),
('dev-sensor-02', '12A05', 'Cảm Biến Bụi Mịn & Chất Lượng Không Khí AQI Daikin Streamer', 'sensor', 'active', 32, 50.0, 45.0);

-- ============================================================================
-- DỮ LIỆU MẪU KỊCH BẢN TỰ ĐỘNG HÓA THÔNG MINH (SMART_AUTOMATION_RULES)
-- ============================================================================
INSERT INTO smart_automation_rules (
    id, apartment_code, title, trigger_time, trigger_type, trigger_label, description, action_summary, enabled, repeat_days, icon
) VALUES 
('rule_morning', '12A05', 'Bình Minh Thức Giấc & Nắng Sớm', '06:30', 'TIME', 'Hẹn giờ 06:30 sáng', 'Tự động mở rèm ban công đón ánh sáng tự nhiên, tắt điều hòa và tắt đèn phòng ngủ.', 'Mở rèm 100% • Tắt Đèn PN Master • Tắt AC', TRUE, 'Hàng ngày', 'sun'),
('rule_sunset', '12A05', 'Hoàng Hôn & Chiếu Sáng Chào Đón', '18:30', 'TIME', 'Hẹn giờ 18:30 chiều', 'Tự động bật hệ thống đèn phòng khách và đèn bếp đón các thành viên trở về nhà.', 'Bật Đèn PK 100% • Bật Đèn Bếp • Bật AC 24°C', TRUE, 'Hàng ngày', 'moon'),
('rule_night_secure', '12A05', 'An Ninh Chốt Khóa Đêm & Chế Độ Ngủ', '23:00', 'TIME', 'Hẹn giờ 23:00 đêm', 'Tự động kiểm tra chốt an toàn FaceID cửa chính, đóng kín rèm và chuyển điều hòa sang 26°C.', 'Khóa Chốt FaceID • Đóng Rèm • AC 26°C (Sleep) • Tắt Đèn PK', TRUE, 'Hàng ngày', 'shield'),
('rule_water_guard', '12A05', 'AI Canh Gác Rò Rỉ Nước Ban Đêm', '02:00 - 04:00', 'SENSOR', 'Cảm biến lưu lượng AI đêm', 'Tự động giám sát lưu lượng dòng chảy van cấp nước. Cảnh báo khẩn nếu có thất thoát vòi rửa.', 'Quét lưu lượng 0.00 L/h • Cảnh báo loa Hub & App', TRUE, 'Khung giờ ngủ sâu (02:00 - 04:00)', 'droplet'),
('rule_air_clean', '12A05', 'Tự Động Lọc Không Khí Daikin Khi Bụi Mịn Tăng', 'AQI > 50', 'CLIMATE', 'Cảm biến chất lượng không khí AQI', 'Khi phát hiện mật độ bụi mịn trong nhà vượt mức 50, tự động kích hoạt chế độ lọc ion Streamer.', 'Tăng tốc độ quạt gió • Bật phát ion Streamer Daikin', TRUE, 'Tự động kích hoạt 24/7', 'wind');

-- ============================================================================
-- DỮ LIỆU MẪU MÃ PIN TẠM VÀ NHẬT KÝ MỞ CỬA CĂN 12A05
-- ============================================================================
INSERT INTO smart_guest_pins (id, apartment_code, pin_code, label, created_by, status, max_uses, used_count, expires_at) VALUES 
('pin-01', '12A05', '482910', 'Shipper Giao Hàng Shopee', 'Trần Hữu Lực', 'ACTIVE', 1, 0, CURRENT_TIMESTAMP + INTERVAL '2 hours'),
('pin-02', '12A05', '718293', 'Khách Bạn Thân Cuối Tuần', 'Trần Hữu Lực', 'ACTIVE', 5, 2, CURRENT_TIMESTAMP + INTERVAL '24 hours');

INSERT INTO smart_door_access_logs (id, apartment_code, user_name, role, method, status, detail, timestamp) VALUES 
('log-01', '12A05', 'Trần Hữu Lực', 'Chủ hộ', 'FACE_ID', 'SUCCESS', 'Nhận diện khuôn mặt FaceID 3D độ khớp 99.8%', CURRENT_TIMESTAMP - INTERVAL '30 minutes'),
('log-02', '12A05', 'Nguyễn Hữu Nhựt', 'Thành viên', 'NFC_CARD', 'SUCCESS', 'Quẹt thẻ cư dân Skyline RFID chip mifare', CURRENT_TIMESTAMP - INTERVAL '2 hours'),
('log-03', '12A05', 'Người lạ', 'Khách', 'PIN_OTP', 'DENIED', 'Nhập sai mã PIN khách 3 lần liên tiếp, kích hoạt còi cảnh báo', CURRENT_TIMESTAMP - INTERVAL '1 day');

-- ============================================================================
-- DỮ LIỆU MẪU CHỖ ĐỖ XE ĐỊNH DANH HẦM B1 & B2 (PARKING_SLOTS)
-- ============================================================================
INSERT INTO parking_slots (id, slot_code, floor_number, vehicle_type, apartment_code, assigned_user_id, assigned_license_plate, rfid_card_code, status, monthly_fee) VALUES 
('slot-b2-a15', 'Ô B2-A15', -2, 'CAR', '12A05', 'user-owner-1', '51K-889.99', 'RFID-A1205-01', 'OCCUPIED', 1200000),
('slot-b1-m88', 'Khu B1-M88', -1, 'MOTORCYCLE', '12A05', 'user-owner-1', '59P1-886.79', 'RFID-A1205-02', 'OCCUPIED', 120000),
('slot-b2-a16', 'Ô B2-A16', -2, 'CAR', NULL, NULL, NULL, NULL, 'VACANT', 1200000),
('slot-b1-m89', 'Khu B1-M89', -1, 'MOTORCYCLE', NULL, NULL, NULL, NULL, 'VACANT', 120000);

-- ============================================================================
-- DỮ LIỆU MẪU 5 ĐẠI TIỆN ÍCH 5 SAO CHUNG CƯ (FACILITIES)
-- ============================================================================
INSERT INTO facilities (id, name, category, floor_number, location_detail, operating_hours, pricing, max_quota_per_month, rating_score, current_occupancy, max_capacity, hero_image_url) VALUES 
('fac-1', 'Hồ Bơi Vô Cực Chân Mây (Skyline Horizon Pool)', 'Hồ bơi', 25, 'Tầng 25 (Sân Thượng Chung Cư)', '06:00 - 22:00', 'Miễn phí theo Thẻ cư dân (20 lượt/tháng)', 20, 4.9, 14, 40, 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800'),
('fac-3', 'Trung Tâm Thể Hình Technogym (Fitness & Yoga)', 'Gym', 3, 'Tầng 3 (Khu Thể Thao Đa Năng)', 'Mở cửa 24/7', 'Miễn phí theo Thẻ cư dân', 30, 5.0, 8, 35, 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800'),
('fac-sauna', 'Phòng Xông Hơi Đá Muối Himalaya (Private VIP)', 'Xông hơi', 3, 'Tầng 3 (Khu Chăm Sóc Sức Khỏe Riêng Tư)', '08:00 - 22:00', '500.000 đ / giờ (Phòng gia đình VIP)', 10, 5.0, 1, 4, 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800'),
('fac-kids', 'Khu Vui Chơi Trẻ Em Sky Kids Zone', 'Khu trẻ em', 1, 'Tầng 1 (Sảnh Thương Mại Tòa Chung Cư)', '07:00 - 21:00', 'Miễn phí theo Thẻ cư dân (Có người lớn đi kèm)', 30, 4.9, 6, 25, 'https://images.unsplash.com/photo-1566454544259-f4b94c3d758c?w=800'),
('fac-2', 'Vườn Tiệc Nướng BBQ Panoramic', 'BBQ', 25, 'Tầng 25 (Sân Thượng Khu Vườn Nhật Bản)', '17:00 - 23:00', '600.000 đ / ca (Bao gồm set bếp Weber & dọn dẹp)', 4, 4.8, 2, 6, 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800');

-- Đặt chỗ tiện ích
INSERT INTO facility_bookings (
    id, apartment_code, facility_id, booker_id, booker_name, ticket_code, 
    booking_date, time_slot, guest_count, duration_hours, deposit_amount, pricing, payment_method, status, notes
) VALUES (
    'BK-SAUNA-9821', '12A05', 'fac-sauna', 'user-owner-1', 'Trần Hữu Lực', 'SKY-SAUNA-12A05-7799', 
    CURRENT_DATE, '18:00 - 20:00 (2 Tiếng - Tối nay)', 2, 2, 1000000, '500.000 đ / giờ', 
    'Trừ vào hóa đơn sinh hoạt tháng tới', 'CONFIRMED', 'Gia đình 2 người, chuẩn bị trước tinh dầu sả chanh'
);

-- ============================================================================
-- DỮ LIỆU MẪU THẺ KHÁCH THĂM QR & NHẬT KÝ AN NINH (VISITOR_PASSES) - visitorStore.ts
-- ============================================================================
INSERT INTO visitor_passes (
    id, apartment_code, host_user_id, host_name, host_phone, tower_name, visitor_name, visitor_phone, license_plate, 
    entry_type, purpose, purpose_label, valid_hours, qr_data, pin_code, status, note, valid_until, checked_in_at
) VALUES 
('SKY-PASS-8492', 'CH-06', 'user-owner-1', 'Trần Hữu Lực', '0364967082', 'Tropical BS-07', 'Trần Quốc Bảo', '0903123456', '51G-888.88', 
 'MULTI', 'VISITOR', 'Khách Thăm Căn Hộ', 8, '{"skyline_pass":true,"passId":"SKY-PASS-8492","aptCode":"CH-06","hostName":"Trần Hữu Lực","visitorName":"Trần Quốc Bảo"}', '849201', 'CHECKED_IN', 'Khách đối tác công việc lên căn CH-06 (Tòa BS-07)', CURRENT_TIMESTAMP + INTERVAL '6 hours', '10:15 02/10/2026'),

('SKY-PASS-6521', 'CH-06', 'user-owner-1', 'Trần Hữu Lực', '0364967082', 'Tropical BS-07', 'Phạm Minh Tuấn', '0918765432', '59P1-999.99', 
 'MULTI', 'VISITOR', 'Khách Thăm Căn Hộ', 4, '{"skyline_pass":true,"passId":"SKY-PASS-6521","aptCode":"CH-06","hostName":"Trần Hữu Lực","visitorName":"Phạm Minh Tuấn"}', '652190', 'ACTIVE', 'Bạn bè đến thăm gia đình', CURRENT_TIMESTAMP + INTERVAL '3.5 hours', NULL),

('SKY-PASS-8107', '12A05', 'user-owner-1', 'Trần Hữu Lực', '0364967082', 'Chung Cư Skyline', 'Trần Minh Tuấn', '0988776655', '51G-123.45', 
 'SINGLE', 'DELIVERY', 'Giao hàng nội thất cao cấp', 8, '{"skyline_pass":true,"passId":"SKY-PASS-8107","aptCode":"12A05","hostName":"Trần Hữu Lực","visitorName":"Trần Minh Tuấn"}', '135565', 'ACTIVE', 'Giao đồ nội thất ban công', CURRENT_TIMESTAMP + INTERVAL '8 hours', NULL);

INSERT INTO visitor_gate_logs (id, pass_id, apartment_code, host_name, visitor_name, license_plate, action, result, checkpoint, notes) VALUES 
('vgl-01', 'SKY-PASS-8492', 'CH-06', 'Trần Hữu Lực', 'Trần Quốc Bảo', '51G-888.88', 'CHECK_IN', 'VALID', 'Cổng Barrier Hầm B1', 'Khách đối tác đã check-in thành công qua mã QR');

-- ============================================================================
-- DỮ LIỆU MẪU HÓA ĐƠN & CHI TIẾT DỊCH VỤ (BILLS & BILL_DETAILS) - dataStore.ts
-- ============================================================================
INSERT INTO bills (id, apartment_code, owner_name, billing_month, due_date, total_amount, status, payment_qr_url, has_ai_anomaly, created_at, paid_at) VALUES 
('bill-2026-08-12a05', '12A05', 'Trần Hữu Lực', 'Tháng 08/2026', '2026-08-30 23:59:59+07', 2505000, 'Unpaid', 'https://api.qrserver.com/v1/create-qr-code/?data=VNPAY_SKYLINE_12A05_2505000', TRUE, '2026-08-05 08:00:00+07', NULL),
('bill-2026-07-12a05', '12A05', 'Trần Hữu Lực', 'Tháng 07/2026', '2026-07-30 23:59:59+07', 2370000, 'Paid', 'https://api.qrserver.com/v1/create-qr-code/?data=VNPAY_SKYLINE_12A05_PAID_07', FALSE, '2026-07-05 08:00:00+07', '2026-07-28 14:20:00+07'),
('bill-2026-06-12a05', '12A05', 'Trần Hữu Lực', 'Tháng 06/2026', '2026-06-30 23:59:59+07', 2391000, 'Paid', 'https://api.qrserver.com/v1/create-qr-code/?data=VNPAY_SKYLINE_12A05_PAID_06', FALSE, '2026-06-05 08:00:00+07', '2026-06-25 09:15:00+07'),
('bill-2026-05-12a05', '12A05', 'Trần Hữu Lực', 'Tháng 05/2026', '2026-05-30 23:59:59+07', 2163000, 'Paid', 'https://api.qrserver.com/v1/create-qr-code/?data=VNPAY_SKYLINE_12A05_PAID_05', FALSE, '2026-05-05 08:00:00+07', '2026-05-27 16:40:00+07');

-- Chi tiết hóa đơn Tháng 08/2026 (Có phát hiện rò rỉ nước AI)
INSERT INTO bill_details (id, bill_id, service_type, service_name, usage, unit, unit_price, total_line_amount, ai_anomaly, anomaly_reason) VALUES 
('bd-08-1', 'bill-2026-08-12a05', 'Electricity', 'Tiền Điện Sinh Hoạt', 340, 'kWh', 3200, 1088000, FALSE, NULL),
('bd-08-2', 'bill-2026-08-12a05', 'Water', 'Tiền Nước Sinh Hoạt', 18, 'm³', 18000, 324000, TRUE, 'Tăng 115% so với chu kỳ trước. Cảm biến AI phát hiện dòng chảy ngầm ban đêm khung giờ 02:00 - 04:00.'),
('bd-08-3', 'bill-2026-08-12a05', 'Management_Fee', 'Phí Quản Lý Vận Hành', 73.2, 'm²', 10000, 732000, FALSE, NULL),
('bd-08-4', 'bill-2026-08-12a05', 'Parking', 'Phí Gửi Xe Căn Hộ', 1, 'xe', 141000, 141000, FALSE, NULL),
('bd-08-5', 'bill-2026-08-12a05', 'Internet', 'Cáp Quang Internet VNPT Fiber 300Mbps', 1, 'tháng', 220000, 220000, FALSE, NULL);

-- Chi tiết hóa đơn Tháng 07/2026
INSERT INTO bill_details (id, bill_id, service_type, service_name, usage, unit, unit_price, total_line_amount, ai_anomaly, anomaly_reason) VALUES 
('bd-07-1', 'bill-2026-07-12a05', 'Electricity', 'Tiền Điện Sinh Hoạt', 280, 'kWh', 3200, 896000, FALSE, NULL),
('bd-07-2', 'bill-2026-07-12a05', 'Water', 'Tiền Nước Sinh Hoạt', 18, 'm³', 18000, 324000, FALSE, NULL),
('bd-07-3', 'bill-2026-07-12a05', 'Management_Fee', 'Phí Quản Lý Vận Hành', 73.2, 'm²', 10000, 732000, FALSE, NULL),
('bd-07-4', 'bill-2026-07-12a05', 'Parking', 'Phí Gửi Xe Căn Hộ', 1, 'xe', 198000, 198000, FALSE, NULL),
('bd-07-5', 'bill-2026-07-12a05', 'Internet', 'Cáp Quang Internet VNPT Fiber 300Mbps', 1, 'tháng', 220000, 220000, FALSE, NULL);

-- ============================================================================
-- DỮ LIỆU MẪU PHIẾU BÁO HỎNG & KỸ THUẬT (SERVICE_TICKETS)
-- Phân loại chuẩn 3 luồng: REPAIR (KTV) | INQUIRY (AI 24/7) | FEEDBACK (BQL)
-- ============================================================================
INSERT INTO service_tickets (
    id, apartment_code, resident_name, resident_phone, content, ai_category, ai_priority, priority_color, 
    sla_deadline, status, ticket_type, handled_by, ai_reply, ai_replied_at, admin_reply, admin_replied_at, 
    admin_replied_by, assigned_technician_id, assigned_technician_name, assigned_technician_phone, 
    rating, resident_feedback, rated_at, before_image, after_image, nks_id, auto_dispatched, created_at, resolved_at
) VALUES 
-- 1. Phiếu Sửa Chữa Khẩn Cấp (KTV Hiện Trường)
('TICK-102', '12A05', 'Trần Hữu Lực', '0364967082', 
 'Vòi sen nhà tắm master bị rỉ nước liên tục khi khóa van chính, nghi ngờ hỏng đệm cao su hoặc nứt cổ van.', 
 'Nước', 1, '#DC2626', CURRENT_TIMESTAMP + INTERVAL '45 minutes', 'In_Progress', 
 'REPAIR', 'TECHNICIAN', NULL, NULL, NULL, NULL, 'Ban Quản Lý Chung Cư Skyline', 
 'KTV-01', 'Lê Văn Kỹ Thuật', '0909.888.777', NULL, NULL, NULL, 
 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800', 
 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800', 
 102, TRUE, '2026-08-26 17:00:00+07', NULL),

-- 2. Phiếu Sửa Chữa Đang Điều Phối
('TICK-099', '12A05', 'Trần Hữu Lực', '0364967082', 
 'Aptomat nguồn điều hòa phòng khách thỉnh thoảng tự nhảy khi bật chế độ làm lạnh nhanh.', 
 'Điện', 2, '#D97706', CURRENT_TIMESTAMP + INTERVAL '18 hours', 'Assigned', 
 'REPAIR', 'TECHNICIAN', NULL, NULL, NULL, NULL, 'Ban Quản Lý Chung Cư Skyline', 
 'KTV-01', 'Lê Văn Kỹ Thuật', '0909.888.777', NULL, NULL, NULL, 
 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800', NULL, 99, FALSE, '2026-08-26 14:20:00+07', NULL),

-- 3. Phiếu Sửa Chữa Đã Hoàn Thành & Chấm 5 Sao
('TICK-088', '12A05', 'Trần Hữu Lực', '0364967082', 
 'Thay ron đệm cách âm cửa chính ban công bị co ngót do thời tiết.', 
 'Khác', 3, '#16A34A', '2026-08-25 18:00:00+07', 'Resolved', 
 'REPAIR', 'TECHNICIAN', NULL, NULL, NULL, NULL, 'Ban Quản Lý Chung Cư Skyline', 
 'KTV-01', 'Lê Văn Kỹ Thuật', '0909.888.777', 
 5, 'Kỹ thuật viên đến đúng giờ, thao tác nhanh nhẹn và dọn dẹp sạch sẽ.', '2026-08-25 16:30:00+07', 
 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800', 
 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800', 
 88, FALSE, '2026-08-24 09:00:00+07', '2026-08-25 16:00:00+07'),

-- 4. Phiếu Hỏi Đáp Tự Động Giải Đáp Bằng AI 24/7 (Inquiry)
('TICK-INQ-01', '12A05', 'Trần Hữu Lực', '0364967082', 
 'Cho tôi hỏi quy định và thủ tục đăng ký thêm 1 xe máy điện dưới hầm B1 cần những giấy tờ gì và biểu phí ra sao?', 
 'Khác', 3, '#16A34A', NULL, 'Resolved', 
 'INQUIRY', 'AI', 
 'Chào Quý cư dân, Skyline AI xin giải đáp: Thủ tục đăng ký xe máy điện tại Hầm B1 gồm (1) Căn cước công dân của chủ hộ/thành viên, (2) Giấy đăng ký xe (Cà vẹt). Biểu phí niêm yết: 120.000 VNĐ/tháng (đã bao gồm vị trí sạc thông minh tự ngắt nguồn an toàn PCCC). Quý cư dân có thể gửi ảnh giấy tờ trực tiếp qua app để được duyệt tự động trong 15 phút.', 
 CURRENT_TIMESTAMP, NULL, NULL, 'Ban Quản Lý Chung Cư Skyline', NULL, NULL, NULL, 5, 'AI phản hồi rất nhanh và đúng trọng tâm.', CURRENT_TIMESTAMP, NULL, NULL, 105, FALSE, '2026-08-26 15:00:00+07', '2026-08-26 15:00:05+07'),

-- 5. Phiếu Phản Ánh Cần BQL Phê Duyệt & Phản Hồi (Feedback)
('TICK-FB-01', '12A05', 'Trần Hữu Lực', '0364967082', 
 'Phản ánh căn hộ tầng trên thi công khoan đục tường ngoài khung giờ quy định (12:30 trưa) gây ảnh hưởng giấc ngủ trưa của gia đình.', 
 'An ninh', 2, '#D97706', CURRENT_TIMESTAMP + INTERVAL '2 hours', 'Resolved', 
 'FEEDBACK', 'MANAGEMENT', NULL, NULL, 
 'Kính gửi Quý cư dân căn hộ 12A05, Ban Quản Lý Chung Cư Skyline đã tiếp nhận phản ánh. Đội an ninh tòa nhà đã lên kiểm tra thực tế, lập biên bản nhắc nhở nhà thầu thi công căn hộ tầng trên và yêu cầu dừng toàn bộ hoạt động gây tiếng ồn trong khung giờ nghỉ trưa (11:30 - 13:30) theo đúng Nội quy Chung cư.', 
 CURRENT_TIMESTAMP, 'Ban Quản Lý Chung Cư Skyline', NULL, NULL, NULL, 5, 'BQL xử lý rất kịp thời và thỏa đáng.', CURRENT_TIMESTAMP, NULL, NULL, 106, FALSE, '2026-08-26 12:45:00+07', '2026-08-26 13:10:00+07');

-- ============================================================================
-- DỮ LIỆU MẪU BẢNG TIN TÒA NHÀ (COMMUNITY_POSTS) - dataStore.ts
-- ============================================================================
INSERT INTO community_posts (
    id, author_id, author_name, author_role, apt_code, title, content, category, ai_moderation, ai_sentiment, tags, likes, comments_count, is_pinned, created_at
) VALUES 
('post-1', 'user-manager-1', 'Ban Quản Lý Tòa Nhà SKYLINE', 'BQL', NULL, 
 'Thông báo lịch bảo dưỡng định kỳ hệ thống thang máy Otis Tòa BS-07', 
 'Ban Quản lý xin thông báo kế hoạch kiểm tra kỹ thuật định kỳ thang máy số 02 vào ngày 28/08/2026 từ 09:00 - 11:30. Kính mong Quý cư dân sử dụng thang số 01 và 03 trong thời gian trên.', 
 'Bảo trì', 'Clean', 0.85, ARRAY['Bảo trì', 'Thông báo BQL', 'Thang máy'], 42, 5, TRUE, '2026-08-25 10:00:00+07'),

('post-2', 'user-owner-1', 'Trần Hữu Lực (Căn 12A05)', 'Cư dân', '12A05', 
 'Trao đổi lại bộ bàn ghế đọc sách ban công bằng gỗ sồi còn mới 95%', 
 'Gia đình mình vừa thay đổi nội thất nên muốn nhượng lại bộ bàn ghế ban công gọn nhẹ cho bác nào có nhu cầu, có thể qua xem trực tiếp tại căn 12A05.', 
 'Cộng đồng', 'Clean', 0.92, ARRAY['Rao vặt', 'Nội thất', 'Cộng đồng'], 18, 3, FALSE, '2026-08-26 11:30:00+07');

-- ============================================================================
-- DỮ LIỆU MẪU BIỂU QUYẾT & LẤY Ý KIẾN CƯ DÂN (VOTING_TOPICS) - votingStore.ts
-- ============================================================================
INSERT INTO voting_topics (
    id, code, title, description, legal_type, created_by, deadline, status, is_owner_only, total_eligible_apartments, total_votes, summary_report, created_at
) VALUES 
('vote-01', 'BQ-2026-01', 
 'Biểu quyết Thông qua Phương án Nâng cấp Hệ thống Kiểm soát Xe Tự Động Hầm B1 - B2', 
 'Chiến dịch lấy ý kiến hợp pháp của các Chủ sở hữu căn hộ về việc trích Quỹ Bảo trì để trang bị camera AI LPR đọc biển số tự động tốc độ cao và mở rộng làn xe máy giờ cao điểm tại Hầm B1/B2 Tòa BS-07. Dự toán thực hiện: 150.000.000 VNĐ theo báo giá cạnh tranh.', 
 'Đóng góp Quỹ Bảo trì', 'Ban Quản Trị & Kỹ Thuật Tòa Nhà', '2026-10-15 23:59:59+07', 'OPEN', TRUE, 200, 1, 
 'Hệ thống kiểm soát xe hiện tại vào giờ cao điểm thường ùn ứ 3-5 phút. Việc nâng cấp cảm biến RFID tầm xa và camera AI giúp giải phóng xe trong dưới 0.3s/lượt.', '2026-08-20 08:00:00+07'),

('vote-02', 'BQ-2026-02', 
 'Lấy ý kiến Điều chỉnh Giờ giấc Hoạt động Khu Thể Thao & Tiện Ích Nội Khu The Tropical', 
 'Theo đề xuất của cư dân về việc tăng thời gian tập luyện buổi tối, Ban Quản Lý xin ý kiến biểu quyết kéo dài giờ hoạt động sân thể thao và tiện ích nội khu đến 22:30 hàng ngày.', 
 'Quy Chế Chung Cư', 'Bộ Phận Vận Hành Ban Quản Lý', '2026-10-20 23:59:59+07', 'OPEN', FALSE, 200, 0, 
 'Đội bảo vệ cam kết tuần tra kiểm soát tiếng ồn sau 22:00 nhằm đảm bảo không gian yên tĩnh và nghỉ ngơi cho các tầng căn hộ xung quanh.', '2026-09-01 08:00:00+07'),

('vote-03', 'BQ-2026-03', 
 'Hội nghị Nhà Chung Cư: Lựa chọn Đơn vị Quản lý Vận hành Chung Cư Giai đoạn 2026 - 2028', 
 'Biểu quyết lựa chọn đơn vị trúng thầu cung cấp dịch vụ quản lý vận hành tòa nhà tiêu chuẩn cao cấp giữa các nhà thầu đã vượt qua vòng thẩm định hồ sơ năng lực.', 
 'Bầu Ban Quản Trị', 'Hội Nghị Nhà Chung Cư', '2026-10-30 23:59:59+07', 'OPEN', TRUE, 200, 0, 
 'Toàn bộ hồ sơ đề xuất kỹ thuật, cam kết SLA bảo trì và báo cáo tài chính của 3 đơn vị đã được niêm yết công khai.', '2026-09-05 09:00:00+07');

-- Tùy chọn biểu quyết
INSERT INTO voting_options (id, topic_id, option_text, votes_count) VALUES 
('opt-1-1', 'vote-01', 'Đồng ý phương án nâng cấp (Dự toán 150 triệu VNĐ từ Quỹ Bảo trì)', 1),
('opt-1-2', 'vote-01', 'Không đồng ý, giữ nguyên hiện trạng kiểm soát thủ công', 0),
('opt-1-3', 'vote-01', 'Đồng ý nhưng yêu cầu điều chỉnh giảm dự toán xuống dưới 120 triệu VNĐ', 0),

('opt-2-1', 'vote-02', 'Nhất trí kéo dài mở cửa đến 22:30 tất cả các ngày trong tuần', 0),
('opt-2-2', 'vote-02', 'Chỉ kéo dài đến 22:30 vào các ngày cuối tuần (Thứ Sáu, Thứ Bảy, Chủ Nhật)', 0),
('opt-2-3', 'vote-02', 'Giữ nguyên khung giờ đóng cửa lúc 21:30 để đảm bảo yên tĩnh', 0),

('opt-3-1', 'vote-03', 'Công ty Quản Lý Bất Động Sản Skyline Living Pro (Giá thầu: 11.000 đ/m²)', 0),
('opt-3-2', 'vote-03', 'Tập đoàn Quản lý Bất động sản Savills Việt Nam (Giá thầu: 14.500 đ/m²)', 0),
('opt-3-3', 'vote-03', 'Công ty Cổ phần Dịch vụ Đô thị CBRE Property (Giá thầu: 13.800 đ/m²)', 0);

-- Bản ghi lá phiếu của Chủ hộ Trần Hữu Lực căn 12A05
INSERT INTO voting_records (id, topic_id, apartment_code, voter_name, option_id, voted_at) VALUES 
('vr-01', 'vote-01', '12A05', 'Trần Hữu Lực', 'opt-1-1', CURRENT_TIMESTAMP - INTERVAL '2 days');

-- ============================================================================
-- DỮ LIỆU MẪU HỘI THOẠI SKYLINE AI CONCIERGE (AI_CHAT_CONVERSATIONS)
-- ============================================================================
INSERT INTO ai_chat_conversations (id, user_id, apartment_code, summary, started_at) VALUES 
('conv-01', 'user-owner-1', '12A05', 'Hỏi đáp biểu phí gửi xe và đặt lịch phòng xông hơi VIP', CURRENT_TIMESTAMP - INTERVAL '2 days');

INSERT INTO ai_chat_messages (id, conversation_id, sender, text, sent_at) VALUES 
('msg-01', 'conv-01', 'user', 'Phòng xông hơi đá muối Himalaya mở cửa đến mấy giờ và giá thế nào em?', CURRENT_TIMESTAMP - INTERVAL '2 days'),
('msg-02', 'conv-01', 'ai', 'Dạ chào Anh Lực! Phòng xông hơi đá muối Himalaya VIP tại Tầng 3 mở cửa từ 08:00 đến 22:00 hàng ngày. Giá dịch vụ dành riêng cho cư dân là 500.000 đ/giờ cho phòng gia đình riêng tư. Anh có muốn em đặt chỗ tối nay luôn không ạ?', CURRENT_TIMESTAMP - INTERVAL '2 days');

-- ============================================================================
-- CÁC VIEW BÁO CÁO PHÂN TÍCH NGHIỆP VỤ (ANALYTIC VIEWS)
-- ============================================================================

-- 1. Báo cáo Bảng Lương & Thù Lao Kỹ Thuật Viên Thực Tế
CREATE OR REPLACE VIEW v_technician_payroll_report AS
SELECT 
    t.id AS technician_id,
    t.name AS technician_name,
    t.phone,
    t.specialty,
    t.base_salary,
    COUNT(st.id) FILTER (WHERE st.status = 'Resolved') AS completed_tickets_count,
    COUNT(st.id) FILTER (WHERE st.status = 'Resolved' AND st.rating = 5) AS five_star_count,
    COALESCE(ROUND(AVG(st.rating) FILTER (WHERE st.status = 'Resolved'), 1), 5.0) AS avg_rating,
    (COUNT(st.id) FILTER (WHERE st.status = 'Resolved') * t.pay_per_ticket) AS ticket_bonus_total,
    (COUNT(st.id) FILTER (WHERE st.status = 'Resolved' AND st.rating = 5) * t.bonus_per_fivestar) AS five_star_bonus_total,
    (t.base_salary 
     + (COUNT(st.id) FILTER (WHERE st.status = 'Resolved') * t.pay_per_ticket)
     + (COUNT(st.id) FILTER (WHERE st.status = 'Resolved' AND st.rating = 5) * t.bonus_per_fivestar)) AS total_income
FROM technicians t
LEFT JOIN service_tickets st ON t.id = st.assigned_technician_id
GROUP BY t.id, t.name, t.phone, t.specialty, t.base_salary, t.pay_per_ticket, t.bonus_per_fivestar;

COMMENT ON VIEW v_technician_payroll_report IS 'Báo cáo tính lương thù lao động của KTV theo ca sửa và thưởng 5 sao';

-- 2. Báo cáo Phân Loại Ticket (Tỷ lệ xử lý giữa AI, Ban Quản Lý và Kỹ Thuật Viên)
CREATE OR REPLACE VIEW v_ticket_classification_analytics AS
SELECT 
    ticket_type,
    handled_by,
    COUNT(*) AS total_tickets,
    COUNT(*) FILTER (WHERE status = 'Resolved') AS resolved_tickets,
    ROUND(COUNT(*) FILTER (WHERE status = 'Resolved') * 100.0 / NULLIF(COUNT(*), 0), 1) AS resolution_rate_percent,
    COALESCE(ROUND(AVG(rating) FILTER (WHERE rating IS NOT NULL), 1), 5.0) AS avg_satisfaction_rating
FROM service_tickets
GROUP BY ticket_type, handled_by;

COMMENT ON VIEW v_ticket_classification_analytics IS 'Thống kê phân loại ticket theo vai trò xử lý: AI 24/7 vs BQL vs KTV';

-- 3. Báo cáo Tổng Quan Doanh Thu Phí Căn Hộ Theo Tháng
CREATE OR REPLACE VIEW v_apartment_billing_overview AS
SELECT 
    b.billing_month,
    COUNT(b.id) AS total_bills,
    SUM(b.total_amount) AS total_revenue,
    SUM(CASE WHEN b.status = 'Paid' THEN b.total_amount ELSE 0 END) AS collected_revenue,
    SUM(CASE WHEN b.status = 'Unpaid' THEN b.total_amount ELSE 0 END) AS outstanding_revenue,
    COUNT(b.id) FILTER (WHERE b.has_ai_anomaly = TRUE) AS ai_anomaly_count
FROM bills b
GROUP BY b.billing_month
ORDER BY b.billing_month DESC;

COMMENT ON VIEW v_apartment_billing_overview IS 'Báo cáo thu phí dịch vụ căn hộ và tỷ lệ cảnh báo rò rỉ nước AI';

-- ============================================================================
-- KẾT THÚC SCRIPT DDL, DML & ANALYTIC VIEWS CHUẨN MỰC SKYLINE SMART RESIDENCE
-- ============================================================================
