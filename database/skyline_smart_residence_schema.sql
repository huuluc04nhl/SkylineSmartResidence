-- ============================================================================
-- CHUNG CƯ CAO CẤP SKYLINE SMART RESIDENCE (QUẬN 7, TP. HỒ CHÍ MINH)
-- HỆ CƠ SỞ DỮ LIỆU POSTGRESQL CHUẨN MỰC TRỌN BỘ 25 TẦNG & 2 TẦNG HẦM
-- Mục đích: Thiết kế cơ sở dữ liệu quan hệ hoàn chỉnh (DDL + DML) để sinh sơ đồ ERD
-- ============================================================================

-- Bật extension hỗ trợ UUID nếu cần
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Xóa bảng cũ theo thứ tự ràng buộc khóa ngoại
DROP TABLE IF EXISTS ai_chat_messages CASCADE;
DROP TABLE IF EXISTS ai_chat_conversations CASCADE;
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
DROP TABLE IF EXISTS smart_devices CASCADE;
DROP TABLE IF EXISTS apartment_members CASCADE;
DROP TABLE IF EXISTS apartments CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS floors CASCADE;
DROP TABLE IF EXISTS condominiums CASCADE;

-- ============================================================================
-- 1. BẢNG THÔNG TIN TỔNG THỂ CHUNG CƯ (CONDOMINIUMS)
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

COMMENT ON TABLE condominiums IS 'Thông tin pháp lý và quy chuẩn của Chung Cư Skyline Smart Residence';

-- ============================================================================
-- 2. BẢNG TRỌN BỘ 25 TẦNG VÀ 2 TẦNG HẦM (FLOORS)
-- ============================================================================
CREATE TABLE floors (
    floor_number INT PRIMARY KEY, -- -2: Hầm B2, -1: Hầm B1, 1..25: Tầng 1 đến 25
    floor_code VARCHAR(20) UNIQUE NOT NULL, -- B2, B1, T1, T2, ..., T12A, ..., T25
    floor_name VARCHAR(150) NOT NULL,
    floor_type VARCHAR(50) NOT NULL CHECK (floor_type IN ('BASEMENT', 'COMMERCIAL_AMENITY', 'RESIDENTIAL', 'ROOFTOP_AMENITY')),
    floor_function TEXT NOT NULL, -- Công năng chi tiết của từng tầng theo đúng sườn kiến trúc
    units_count INT DEFAULT 0, -- Số căn hộ trên tầng
    condo_id INT NOT NULL REFERENCES condominiums(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE floors IS 'Sườn dữ liệu chuẩn xác trọn bộ 25 tầng nổi và 2 tầng hầm của chung cư';

-- ============================================================================
-- ============================================================================
-- 3. BẢNG CĂN HỘ CHUNG CƯ (APARTMENTS)
-- ============================================================================
CREATE TABLE apartments (
    id VARCHAR(50) PRIMARY KEY,
    apt_code VARCHAR(20) UNIQUE NOT NULL, -- Ví dụ: 12A05, 25PH-01
    floor_number INT NOT NULL REFERENCES floors(floor_number) ON DELETE RESTRICT,
    apt_type VARCHAR(30) NOT NULL CHECK (apt_type IN ('1PN', '2PN', '3PN', 'DUPLEX_PENTHOUSE')),
    type_label VARCHAR(100) NOT NULL,
    wall_area NUMERIC(6, 2) NOT NULL, -- Diện tích tim tường (m2)
    clear_area NUMERIC(6, 2) NOT NULL, -- Diện tích thông thủy (m2)
    bedrooms INT NOT NULL DEFAULT 2,
    bathrooms INT NOT NULL DEFAULT 2,
    balcony_direction VARCHAR(50) DEFAULT 'Đông Nam',
    main_door_direction VARCHAR(50) DEFAULT 'Tây Bắc',
    price_billion NUMERIC(6, 2) NOT NULL, -- Giá căn hộ (tỷ VNĐ)
    price_vnd NUMERIC(15, 2) NOT NULL, -- Giá quy đổi ra VNĐ
    status VARCHAR(50) DEFAULT 'Đã bàn giao' CHECK (status IN ('Đã bàn giao', 'Đang trống', 'Đang bảo trì', 'Đang nghiệm thu')),
    owner_id VARCHAR(50), -- Khóa ngoại trỏ về users(id) được liên kết sau khi tạo bảng users
    handover_date DATE,
    handover_protocol VARCHAR(100), -- Mã biên bản bàn giao
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE apartments IS 'Thông tin các căn hộ chung cư phân bổ trên các tầng từ tầng 5 đến tầng 25';

-- ============================================================================
-- 4. BẢNG TÀI KHOẢN NGƯỜI DÙNG & CƯ DÂN (USERS)
-- ============================================================================
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'OWNER', 'TENANT', 'TECHNICIAN', 'RECEPTIONIST')),
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    id_card_no VARCHAR(20), -- CCCD gắn chip 12 chữ số
    id_date DATE,
    id_place VARCHAR(150),
    dob DATE,
    pob VARCHAR(150),
    gender SMALLINT DEFAULT 1 CHECK (gender IN (0, 1)), -- 1: Nam, 0: Nữ
    avatar_url TEXT,
    license_plate VARCHAR(30),
    apartment_code VARCHAR(20) REFERENCES apartments(apt_code) ON DELETE SET NULL, -- Căn hộ thường trú
    relationship VARCHAR(50) DEFAULT 'Owner',
    emergency_phone VARCHAR(20),
    face_vector TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE users IS 'Quản lý cư dân, chủ hộ, ban quản lý, kỹ thuật viên và lễ tân';

-- Thiết lập ràng buộc khóa ngoại chủ sở hữu từ apartments về users
ALTER TABLE apartments ADD CONSTRAINT fk_apartment_owner 
FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL;


-- ============================================================================
-- 5. BẢNG THÀNH VIÊN GIA ĐÌNH CĂN HỘ (APARTMENT_MEMBERS)
-- ============================================================================
CREATE TABLE apartment_members (
    id VARCHAR(50) PRIMARY KEY,
    apartment_code VARCHAR(20) NOT NULL REFERENCES apartments(apt_code) ON DELETE CASCADE,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    id_card VARCHAR(20),
    relationship VARCHAR(50) NOT NULL, -- 'Em trai', 'Vợ', 'Chồng', 'Con', 'Người thân'
    role VARCHAR(20) DEFAULT 'Family',
    license_plate VARCHAR(30),
    face_status VARCHAR(50) DEFAULT 'Đã xác thực',
    avatar_url TEXT,
    added_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE apartment_members IS 'Thành viên cùng sinh sống và đăng ký thường trú trong căn hộ';

-- ============================================================================
-- 6. BẢNG THIẾT BỊ NHÀ THÔNG MINH IOT (SMART_DEVICES)
-- ============================================================================
CREATE TABLE smart_devices (
    id VARCHAR(50) PRIMARY KEY,
    apartment_code VARCHAR(20) NOT NULL REFERENCES apartments(apt_code) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    device_type VARCHAR(50) NOT NULL CHECK (device_type IN ('light', 'ac', 'door', 'curtain', 'sensor')),
    status VARCHAR(50) NOT NULL DEFAULT 'off',
    location_x NUMERIC(5, 2) DEFAULT 0,
    location_y NUMERIC(5, 2) DEFAULT 0,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE smart_devices IS 'Hệ sinh thái thiết bị IoT thông minh trong căn hộ';

-- ============================================================================
-- 7. BẢNG BÃI ĐỖ XE THÔNG MINH (PARKING_SLOTS)
-- ============================================================================
CREATE TABLE parking_slots (
    id VARCHAR(50) PRIMARY KEY,
    slot_code VARCHAR(30) UNIQUE NOT NULL, -- Ví dụ: Ô B2-A15, Khu B1-M88
    floor_number INT NOT NULL REFERENCES floors(floor_number) ON DELETE RESTRICT, -- -2: Hầm B2, -1: Hầm B1
    vehicle_type VARCHAR(20) NOT NULL CHECK (vehicle_type IN ('CAR', 'MOTORCYCLE')),
    apartment_code VARCHAR(20) REFERENCES apartments(apt_code) ON DELETE SET NULL,
    assigned_user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    assigned_license_plate VARCHAR(30),
    rfid_card_code VARCHAR(50) UNIQUE,
    status VARCHAR(30) DEFAULT 'OCCUPIED' CHECK (status IN ('VACANT', 'OCCUPIED', 'RESERVED')),
    monthly_fee NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE parking_slots IS 'Vị trí đỗ xe định danh tại 2 tầng hầm B1 và B2 của chung cư';

-- ============================================================================
-- 8. BẢNG 5 TIỆN ÍCH 5 SAO CHUNG CƯ (FACILITIES)
-- ============================================================================
CREATE TABLE facilities (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('Hồ bơi', 'Gym', 'Xông hơi', 'Khu trẻ em', 'BBQ')),
    floor_number INT NOT NULL REFERENCES floors(floor_number) ON DELETE RESTRICT,
    location_detail VARCHAR(100) NOT NULL, -- Tầng 25 (Sân Thượng), Tầng 3, Tầng 1
    operating_hours VARCHAR(50) NOT NULL, -- 06:00 - 22:00, 24/7
    pricing VARCHAR(150) NOT NULL,
    max_quota_per_month INT DEFAULT 20,
    rating_score NUMERIC(3, 1) DEFAULT 5.0,
    current_occupancy INT DEFAULT 0,
    max_capacity INT DEFAULT 40,
    hero_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE facilities IS 'Danh mục 5 tiện ích 5 sao độc quyền của chung cư Skyline gồm 25 tầng';

-- ============================================================================
-- 9. BẢNG ĐẶT CHỖ TIỆN ÍCH (FACILITY_BOOKINGS)
-- ============================================================================
CREATE TABLE facility_bookings (
    id VARCHAR(50) PRIMARY KEY,
    apartment_code VARCHAR(20) NOT NULL REFERENCES apartments(apt_code) ON DELETE CASCADE,
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

COMMENT ON TABLE facility_bookings IS 'Sổ vé điện tử đặt chỗ tiện ích riêng tư (Xông hơi VIP Tầng 3, Tiệc nướng BBQ Tầng 25)';

-- ============================================================================
-- 10. BẢNG LỊCH SỬ VÀO TIỆN ÍCH (FACILITY_ACCESS_LOGS)
-- ============================================================================
CREATE TABLE facility_access_logs (
    id VARCHAR(50) PRIMARY KEY,
    facility_id VARCHAR(50) NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    apartment_code VARCHAR(20) REFERENCES apartments(apt_code) ON DELETE SET NULL,
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
-- 11. BẢNG THẺ KHÁCH THĂM (VISITOR_PASSES)
-- ============================================================================
CREATE TABLE visitor_passes (
    id VARCHAR(50) PRIMARY KEY, -- Mã thẻ: SKY-PASS-8107
    apartment_code VARCHAR(20) NOT NULL REFERENCES apartments(apt_code) ON DELETE CASCADE,
    host_user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    host_name VARCHAR(150) NOT NULL,
    host_phone VARCHAR(20) NOT NULL,
    visitor_name VARCHAR(150) NOT NULL,
    visitor_phone VARCHAR(20),
    license_plate VARCHAR(30),
    entry_type VARCHAR(20) DEFAULT 'SINGLE' CHECK (entry_type IN ('SINGLE', 'MULTI')),
    purpose_label VARCHAR(150) DEFAULT 'Thăm người thân',
    valid_hours INT DEFAULT 4,
    qr_data TEXT NOT NULL,
    pin_code VARCHAR(10) NOT NULL, -- Mã PIN 6 chữ số
    status VARCHAR(30) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CHECKED_IN', 'COMPLETED', 'EXPIRED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
    checked_in_at TIMESTAMP WITH TIME ZONE,
    checked_out_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE visitor_passes IS 'Thẻ khách thăm cấp mã QR và PIN mở cổng thang máy tự động';

-- ============================================================================
-- 12. BẢNG NHẬT KÝ RA VÀO CỔNG KHÁCH (VISITOR_GATE_LOGS)
-- ============================================================================
CREATE TABLE visitor_gate_logs (
    id VARCHAR(50) PRIMARY KEY,
    pass_id VARCHAR(50) REFERENCES visitor_passes(id) ON DELETE SET NULL,
    apartment_code VARCHAR(20) NOT NULL REFERENCES apartments(apt_code) ON DELETE CASCADE,
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
-- 13. BẢNG HÓA ĐƠN DỊCH VỤ SINH HOẠT (BILLS)
-- ============================================================================
CREATE TABLE bills (
    id VARCHAR(50) PRIMARY KEY,
    apartment_code VARCHAR(20) NOT NULL REFERENCES apartments(apt_code) ON DELETE CASCADE,
    owner_name VARCHAR(150) NOT NULL,
    billing_month VARCHAR(30) NOT NULL, -- Tháng 08/2026
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    status VARCHAR(30) DEFAULT 'Unpaid' CHECK (status IN ('Draft', 'Unpaid', 'Paid', 'Overdue')),
    payment_qr_url TEXT,
    has_ai_anomaly BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE bills IS 'Hóa đơn tổng hợp điện, nước, phí quản lý và gửi xe hàng tháng';

-- ============================================================================
-- 14. BẢNG CHI TIẾT DỊCH VỤ HÓA ĐƠN (BILL_DETAILS)
-- ============================================================================
CREATE TABLE bill_details (
    id VARCHAR(50) PRIMARY KEY,
    bill_id VARCHAR(50) NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    service_type VARCHAR(50) NOT NULL CHECK (service_type IN ('Electricity', 'Water', 'Management_Fee', 'Parking')),
    usage NUMERIC(10, 2), -- kWh, m3, m2, số lượng xe
    unit_price NUMERIC(12, 2),
    total_line_amount NUMERIC(15, 2) NOT NULL,
    ai_anomaly BOOLEAN DEFAULT FALSE,
    anomaly_reason TEXT
);

COMMENT ON TABLE bill_details IS 'Bóc tách chi tiết từng dòng hóa đơn và cảnh báo AI phát hiện rò rỉ nước';

-- ============================================================================
-- 15. BẢNG PHIẾU BÁO HỎNG & KỸ THUẬT (SERVICE_TICKETS)
-- ============================================================================
CREATE TABLE service_tickets (
    id VARCHAR(50) PRIMARY KEY, -- TICK-102
    apartment_code VARCHAR(20) NOT NULL REFERENCES apartments(apt_code) ON DELETE CASCADE,
    resident_name VARCHAR(150) NOT NULL,
    resident_phone VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    ai_category VARCHAR(50) NOT NULL CHECK (ai_category IN ('Điện', 'Nước', 'Vệ sinh', 'An ninh', 'Khác')),
    ai_priority INT DEFAULT 2, -- 1: Khẩn cấp, 2: Tiêu chuẩn
    priority_color VARCHAR(20) DEFAULT '#D97706',
    sla_deadline TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'Open' CHECK (status IN ('Open', 'Assigned', 'In_Progress', 'Resolved')),
    assigned_technician_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    assigned_technician_name VARCHAR(150),
    before_image TEXT,
    after_image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE service_tickets IS 'Yêu cầu sửa chữa của cư dân với cam kết có mặt trong 15 - 60 phút';

-- ============================================================================
-- 16. BẢNG BẢNG TIN TÒA NHÀ (COMMUNITY_POSTS)
-- ============================================================================
CREATE TABLE community_posts (
    id VARCHAR(50) PRIMARY KEY,
    author_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    author_name VARCHAR(150) NOT NULL,
    author_role VARCHAR(50) DEFAULT 'BQL',
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'Thông báo',
    pin_to_top BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE community_posts IS 'Thông báo và tin tức vận hành từ Ban Quản Lý chung cư';

-- ============================================================================
-- 17. BẢNG BIỂU QUYẾT & KHẢO SÁT CƯ DÂN (SURVEYS)
-- ============================================================================
CREATE TABLE surveys (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    legal_type VARCHAR(50) DEFAULT 'Bầu Ban Quản Trị',
    status VARCHAR(30) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED')),
    start_date DATE,
    end_date DATE,
    total_votes INT DEFAULT 0,
    quorum_percent NUMERIC(5, 2) DEFAULT 50.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE survey_votes (
    id VARCHAR(50) PRIMARY KEY,
    survey_id VARCHAR(50) NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
    apartment_code VARCHAR(20) NOT NULL REFERENCES apartments(apt_code) ON DELETE CASCADE,
    voter_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    option_chosen VARCHAR(50) NOT NULL CHECK (option_chosen IN ('AGREE', 'DISAGREE', 'ABSTAIN')),
    voted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_survey_apartment UNIQUE (survey_id, apartment_code)
);

COMMENT ON TABLE survey_votes IS 'Mỗi căn hộ chỉ được biểu quyết 01 phiếu duy nhất theo luật nhà ở';

-- ============================================================================
-- 18. BẢNG HỘI THOẠI SKYLINE AI CONCIERGE (AI_CHAT_CONVERSATIONS)
-- ============================================================================
CREATE TABLE ai_chat_conversations (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    apartment_code VARCHAR(20) REFERENCES apartments(apt_code) ON DELETE CASCADE,
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


-- ============================================================================
-- DỮ LIỆU MẪU CHUẨN XÁC: TRỌN BỘ 25 TẦNG VÀ 2 TẦNG HẦM CỦA CHUNG CƯ
-- ============================================================================

-- 1. Nạp Thông Tin Chung Cư
INSERT INTO condominiums (
    id, condo_code, condo_name, address, total_floors, basement_floors, total_apartments, investor, management_company, hotline, handover_year, description
) VALUES (
    1, 'SKYLINE_RESIDENCE', 'Chung Cư Cao Cấp Skyline Smart Residence',
    'Số 12A Nguyễn Thị Thập, Phường Tân Phú, Quận 7, TP. Hồ Chí Minh',
    25, 2, 240, 'Skyline Group Corporation', 'Skyline Property Management Services',
    '1900 8899', 2026,
    'Tổ hợp chung cư thông minh 5 sao cao 25 tầng hiện đại bậc nhất Quận 7 với hệ thống Smart Home, nhận diện FaceID và 5 đại tiện ích đặc quyền.'
);

-- 2. Nạp Trọn Bộ 27 Mặt Bằng Tầng (2 Tầng Hầm + 25 Tầng Nổi)
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
(13, 'T12A', 'Tầng 12A - Căn Hộ Thông Minh Cư Dân Thực Tế', 'RESIDENTIAL', 'Khu căn hộ thông minh trung tâm, trong đó Căn 12A05 là căn hộ cư dân thực tế của Chủ hộ Nguyễn Hữu Lực.', 10, 1),
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
(25, 'T25', 'Tầng 25 - Sân Thượng Panoramic, Hồ Bơi Vô Cực, BBQ & Penthouse', 'ROOFTOP_AMENITY', 'Đại tiện ích Hồ Bơi Vô Cực Chân Mây (06:00 - 22:00), Vườn Tiệc Nướng BBQ Panoramic (17:00 - 23:00) và Tuyệt phẩm 2 căn Duplex Penthouse 5 sao (25PH-01, 25PH-02).', 2, 1);

-- 3. Nạp Dữ Liệu Căn Hộ Chuẩn Xác Trải Dài Trọn Bộ Tất Cả Các Tầng Căn Hộ (Tầng 5 -> Tầng 25)
INSERT INTO apartments (
    id, apt_code, floor_number, apt_type, type_label, wall_area, clear_area, bedrooms, bathrooms, 
    balcony_direction, main_door_direction, price_billion, price_vnd, status, owner_id, handover_date, handover_protocol, description
) VALUES 
-- ============================================================================
-- TẦNG 25: TUYỆT PHẨM DUPLEX PENTHOUSE (2 CĂN HỘ ĐẶC QUYỀN SÂN THƯỢNG)
-- ============================================================================
('apt-25ph01', '25PH-01', 25, 'DUPLEX_PENTHOUSE', 'Duplex Penthouse 5 Sao', 232.0, 215.0, 4, 4, 'Đông Nam', 'Tây Bắc', 18.50, 18500000000, 'Đang trống', NULL, NULL, NULL, 'Tuyệt tác Penthouse thông tầng tầng 25, hồ bơi riêng Sky Garden và thang máy đặc quyền.'),
('apt-25ph02', '25PH-02', 25, 'DUPLEX_PENTHOUSE', 'Duplex Penthouse 5 Sao', 232.0, 215.0, 4, 4, 'Tây Nam', 'Đông Bắc', 18.20, 18200000000, 'Đang trống', NULL, NULL, NULL, 'Penthouse tầng 25 hướng hoàng hôn, sân thượng Sky Lounge 45m2 ngắm trọn thành phố.'),

-- ============================================================================
-- TẦNG 22 - 24: PHÂN KHU SKY SUITE CAO CẤP (TẦM NHÌN TRIỆU ĐÔ ÔM TRỌN SÔNG)
-- ============================================================================
-- Tầng 24 (Áp mái Sky Suite)
('apt-24a01', '24A01', 24, '3PN', '3 Phòng Ngủ - 3WC', 119.5, 112.0, 3, 3, 'Đông Nam', 'Tây Bắc', 8.50, 8500000000, 'Đang trống', NULL, NULL, NULL, 'Căn hộ 3PN cao cấp áp mái tầng 24 với tầm nhìn triệu đô ôm trọn sông Sài Gòn.'),
('apt-24a02', '24A02', 24, '2PN', '2 Phòng Ngủ - 2WC', 83.2, 78.5, 2, 2, 'Tây Nam', 'Đông Bắc', 5.60, 5600000000, 'Đang trống', NULL, NULL, NULL, 'Căn 2PN tầng cao thoáng đãng đón gió tự nhiên, hoàn thiện nội thất cơ bản cao cấp.'),
('apt-24a03', '24A03', 24, '3PN', '3 Phòng Ngủ - 3WC', 115.8, 108.0, 3, 3, 'Đông Bắc', 'Tây Nam', 8.20, 8200000000, 'Đang trống', NULL, NULL, NULL, 'Căn hộ 3PN Sky Suite góc view công viên và hồ bơi chân mây.'),
('apt-24a04', '24A04', 24, '2PN', '2 Phòng Ngủ - 2WC', 79.8, 75.0, 2, 2, 'Tây Bắc', 'Đông Nam', 5.40, 5400000000, 'Đang trống', NULL, NULL, NULL, 'Căn 2PN Sky Suite đón trọn ánh hoàng hôn tuyệt đẹp của thành phố.'),

-- Tầng 23 (Sky Suite Tầng Cao)
('apt-23a01', '23A01', 23, '3PN', '3 Phòng Ngủ - 3WC', 119.5, 112.0, 3, 3, 'Đông Nam', 'Tây Bắc', 8.30, 8300000000, 'Đang trống', NULL, NULL, NULL, 'Căn 3PN góc 2 mặt thoáng, ban công kính Low-E tràn viền ngắm toàn cảnh thành phố.'),
('apt-23a02', '23A02', 23, '2PN', '2 Phòng Ngủ - 2WC', 79.8, 75.0, 2, 2, 'Tây Nam', 'Đông Bắc', 5.30, 5300000000, 'Đang trống', NULL, NULL, NULL, 'Căn hộ 2PN Sky Suite tầng 23 hướng gió sông thanh mát.'),
('apt-23a03', '23A03', 23, '3PN', '3 Phòng Ngủ - 3WC', 115.8, 108.0, 3, 3, 'Đông Bắc', 'Tây Nam', 8.00, 8000000000, 'Đang trống', NULL, NULL, NULL, 'Căn hộ 3PN Sky Suite tầng cao đón trọn bình minh sông Sài Gòn.'),
('apt-23a04', '23A04', 23, '2PN', '2 Phòng Ngủ - 2WC', 83.2, 78.5, 2, 2, 'Tây Bắc', 'Đông Nam', 5.50, 5500000000, 'Đang trống', NULL, NULL, NULL, 'Căn 2PN Sky Suite thiết kế nội thất sang trọng đẳng cấp.'),

-- Tầng 22 (Sky Suite Tầng Cao)
('apt-22a01', '22A01', 22, '3PN', '3 Phòng Ngủ - 3WC', 119.5, 112.0, 3, 3, 'Đông Nam', 'Tây Bắc', 8.10, 8100000000, 'Đang trống', NULL, NULL, NULL, 'Căn hộ Sky Suite tầng 22 đẳng cấp, thang máy riêng và sảnh đệm cao cấp.'),
('apt-22a02', '22A02', 22, '2PN', '2 Phòng Ngủ - 2WC', 79.8, 75.0, 2, 2, 'Tây Nam', 'Đông Bắc', 5.20, 5200000000, 'Đang trống', NULL, NULL, NULL, 'Căn 2PN tầng 22 view trực diện sông và cầu Phú Mỹ lung linh ban đêm.'),
('apt-22a03', '22A03', 22, '3PN', '3 Phòng Ngủ - 3WC', 115.8, 108.0, 3, 3, 'Đông Bắc', 'Tây Nam', 7.90, 7900000000, 'Đang trống', NULL, NULL, NULL, 'Căn 3PN Sky Suite với hệ thống kính cách âm và rèm thông minh.'),
('apt-22a04', '22A04', 22, '2PN', '2 Phòng Ngủ - 2WC', 83.2, 78.5, 2, 2, 'Tây Bắc', 'Đông Nam', 5.40, 5400000000, 'Đang trống', NULL, NULL, NULL, 'Căn 2PN Sky Suite bố trí logia thư giãn ngắm thành phố.'),

-- ============================================================================
-- TẦNG 5 - 21: PHÂN KHU CĂN HỘ TIÊU CHUẨN (1PN, 2PN, 3PN)
-- ============================================================================
-- Tầng 21
('apt-21a01', '21A01', 21, '2PN', '2 Phòng Ngủ - 2WC', 83.2, 78.5, 2, 2, 'Đông Nam', 'Tây Bắc', 5.10, 5100000000, 'Đang trống', NULL, NULL, NULL, 'Căn 2PN tầng cao đón gió lành tự nhiên.'),
('apt-21a02', '21A02', 21, '1PN', '1 Phòng Ngủ - 1WC', 56.4, 52.0, 1, 1, 'Tây Nam', 'Đông Bắc', 3.35, 3350000000, 'Đang trống', NULL, NULL, NULL, 'Căn 1PN cao cấp tầng 21 thích hợp cho chuyên gia trẻ.'),
('apt-21a03', '21A03', 21, '2PN', '2 Phòng Ngủ - 2WC', 79.8, 75.0, 2, 2, 'Đông Bắc', 'Tây Nam', 4.90, 4900000000, 'Đang trống', NULL, NULL, NULL, 'Căn 2PN thiết kế hiện đại view thoáng.'),
('apt-21a04', '21A04', 21, '3PN', '3 Phòng Ngủ - 3WC', 115.8, 108.0, 3, 3, 'Tây Bắc', 'Đông Nam', 7.50, 7500000000, 'Đang trống', NULL, NULL, NULL, 'Căn 3PN rộng thoáng view bao quát Quận 7.'),

-- Tầng 20 (Có căn 20B01 gia đình đa thế hệ)
('apt-20a01', '20A01', 20, '2PN', '2 Phòng Ngủ - 2WC', 83.2, 78.5, 2, 2, 'Đông Nam', 'Tây Bắc', 5.00, 5000000000, 'Đang trống', NULL, NULL, NULL, 'Căn hộ 2PN tầng 20 ban công đón nắng mai mát mẻ.'),
('apt-20a02', '20A02', 20, '3PN', '3 Phòng Ngủ - 3WC', 119.5, 112.0, 3, 3, 'Tây Nam', 'Đông Bắc', 7.40, 7400000000, 'Đang trống', NULL, NULL, NULL, 'Căn hộ 3PN căn góc sang trọng hoàn thiện cao cấp.'),
('apt-20b01', '20B01', 20, '3PN', '3 Phòng Ngủ - 3WC', 115.8, 108.2, 3, 3, 'Nam', 'Bắc', 7.20, 7200000000, 'Đã bàn giao', NULL, '2026-02-10', 'BBBG-SKYLINE-20B01-20260210', 'Căn hộ 3PN rộng rãi diện tích thông thủy 108.2 m2 dành cho gia đình đa thế hệ.'),
('apt-20a04', '20A04', 20, '1PN', '1 Phòng Ngủ - 1WC', 56.4, 52.0, 1, 1, 'Bắc', 'Nam', 3.30, 3300000000, 'Đang trống', NULL, NULL, NULL, 'Căn hộ 1PN ấm cúng thiết kế thông minh đa năng.'),

-- Tầng 19
('apt-19a01', '19A01', 19, '3PN', '3 Phòng Ngủ - 3WC', 115.8, 108.0, 3, 3, 'Đông Nam', 'Tây Bắc', 7.10, 7100000000, 'Đang trống', NULL, NULL, NULL, 'Căn hộ 3PN tầng 19 view panorama ngắm trọn mảng xanh công viên.'),
('apt-19a02', '19A02', 19, '2PN', '2 Phòng Ngủ - 2WC', 79.8, 75.0, 2, 2, 'Tây Nam', 'Đông Bắc', 4.85, 4850000000, 'Đang trống', NULL, NULL, NULL, 'Căn 2PN vuông vức, bố trí công năng hoàn hảo.'),
('apt-19a03', '19A03', 19, '2PN', '2 Phòng Ngủ - 2WC', 83.2, 78.5, 2, 2, 'Đông Bắc', 'Tây Nam', 4.95, 4950000000, 'Đang trống', NULL, NULL, NULL, 'Căn 2PN không gian mở kết nối ban công.'),
('apt-19a04', '19A04', 19, '1PN', '1 Phòng Ngủ - 1WC', 56.4, 52.0, 1, 1, 'Tây Bắc', 'Đông Nam', 3.25, 3250000000, 'Đang trống', NULL, NULL, NULL, 'Căn 1PN tối ưu chi phí vận hành cho cư dân trẻ.'),

-- Tầng 18 (Có căn 18A01 3PN diện tích lớn)
('apt-18a01', '18A01', 18, '3PN', '3 Phòng Ngủ - 3WC', 119.5, 112.0, 3, 3, 'Đông Nam', 'Tây Bắc', 7.60, 7600000000, 'Đang trống', NULL, NULL, NULL, 'Căn hộ 3PN mẫu tầng 18 view công viên nội khu và sông Sài Gòn.'),
('apt-18a02', '18A02', 18, '2PN', '2 Phòng Ngủ - 2WC', 79.8, 75.0, 2, 2, 'Tây Nam', 'Đông Bắc', 4.80, 4800000000, 'Đang trống', NULL, NULL, NULL, 'Căn hộ 2PN đón gió tự nhiên, nội thất bàn giao chuẩn Châu Âu.'),
('apt-18a03', '18A03', 18, '2PN', '2 Phòng Ngủ - 2WC', 83.2, 78.5, 2, 2, 'Đông Bắc', 'Tây Nam', 4.90, 4900000000, 'Đang trống', NULL, NULL, NULL, 'Căn 2PN ánh sáng tự nhiên tràn ngập khắp phòng khách.'),
('apt-18a04', '18A04', 18, '1PN', '1 Phòng Ngủ - 1WC', 56.4, 52.0, 1, 1, 'Tây Bắc', 'Đông Nam', 3.25, 3250000000, 'Đang trống', NULL, NULL, NULL, 'Căn 1PN thông minh, logia giặt phơi tách biệt.'),

-- Tầng 17
('apt-17a01', '17A01', 17, '2PN', '2 Phòng Ngủ - 2WC', 83.2, 78.5, 2, 2, 'Đông Nam', 'Tây Bắc', 4.85, 4850000000, 'Đang trống', NULL, NULL, NULL, 'Căn 2PN tầng 17 không gian thoáng đãng.'),
('apt-17a02', '17A02', 17, '1PN', '1 Phòng Ngủ - 1WC', 56.4, 52.0, 1, 1, 'Tây Nam', 'Đông Bắc', 3.20, 3200000000, 'Đang trống', NULL, NULL, NULL, 'Căn 1PN nhỏ gọn, tinh tế hiện đại.'),
('apt-17a03', '17A03', 17, '2PN', '2 Phòng Ngủ - 2WC', 79.8, 75.0, 2, 2, 'Đông Bắc', 'Tây Nam', 4.75, 4750000000, 'Đang trống', NULL, NULL, NULL, 'Căn 2PN ban công rộng ngắm toàn cảnh hồ bơi nội khu.'),
('apt-17a04', '17A04', 17, '3PN', '3 Phòng Ngủ - 3WC', 115.8, 108.0, 3, 3, 'Tây Bắc', 'Đông Nam', 7.00, 7000000000, 'Đang trống', NULL, NULL, NULL, 'Căn 3PN gia đình 3 thế hệ với phòng master tiện nghi.'),

-- Tầng 16
('apt-16a01', '16A01', 16, '2PN', '2 Phòng Ngủ - 2WC', 79.8, 75.0, 2, 2, 'Đông Nam', 'Tây Bắc', 4.75, 4750000000, 'Đang trống', NULL, NULL, NULL, 'Căn 2PN tầm nhìn khoáng đạt tầng 16.'),
('apt-16a02', '16A02', 16, '3PN', '3 Phòng Ngủ - 3WC', 115.8, 108.0, 3, 3, 'Tây Nam', 'Đông Bắc', 6.95, 6950000000, 'Đang trống', NULL, NULL, NULL, 'Căn 3PN góc view thoáng mát quanh năm.'),
('apt-16a03', '16A03', 16, '2PN', '2 Phòng Ngủ - 2WC', 83.2, 78.5, 2, 2, 'Đông Bắc', 'Tây Nam', 4.80, 4800000000, 'Đang trống', NULL, NULL, NULL, 'Căn 2PN vuông vức, nội thất cơ bản cao cấp.'),
('apt-16a04', '16A04', 16, '1PN', '1 Phòng Ngủ - 1WC', 56.4, 52.0, 1, 1, 'Tây Bắc', 'Đông Nam', 3.15, 3150000000, 'Đang trống', NULL, NULL, NULL, 'Căn 1PN ấm cúng, thiết kế thông minh.'),

-- Tầng 15
('apt-15a01', '15A01', 15, '3PN', '3 Phòng Ngủ - 3WC', 115.8, 108.0, 3, 3, 'Đông Nam', 'Tây Bắc', 6.90, 6900000000, 'Đang trống', NULL, NULL, NULL, 'Căn 3PN tầng 15 view trung tâm thương mại và đại lộ.'),
('apt-15a02', '15A02', 15, '1PN', '1 Phòng Ngủ - 1WC', 56.4, 52.0, 1, 1, 'Tây Nam', 'Đông Bắc', 3.15, 3150000000, 'Đang trống', NULL, NULL, NULL, 'Căn 1PN trang bị thiết bị vệ sinh Kohler cao cấp.'),
('apt-15a03', '15A03', 15, '2PN', '2 Phòng Ngủ - 2WC', 79.8, 75.0, 2, 2, 'Đông Bắc', 'Tây Nam', 4.70, 4700000000, 'Đang trống', NULL, NULL, NULL, 'Căn 2PN đón gió nhẹ nhàng hướng Đông Bắc.'),
('apt-15a04', '15A04', 15, '2PN', '2 Phòng Ngủ - 2WC', 83.2, 78.5, 2, 2, 'Tây Bắc', 'Đông Nam', 4.80, 4800000000, 'Đang trống', NULL, NULL, NULL, 'Căn 2PN view hồ cảnh quan và quảng trường nội khu.'),

-- Tầng 14
('apt-14a01', '14A01', 14, '2PN', '2 Phòng Ngủ - 2WC', 79.8, 75.0, 2, 2, 'Đông Nam', 'Tây Bắc', 4.70, 4700000000, 'Đang trống', NULL, NULL, NULL, 'Căn hộ 2PN tầng 14 thiết kế hiện đại sang trọng.'),
('apt-14a02', '14A02', 14, '2PN', '2 Phòng Ngủ - 2WC', 83.2, 78.5, 2, 2, 'Tây Nam', 'Đông Bắc', 4.75, 4750000000, 'Đang trống', NULL, NULL, NULL, 'Căn 2PN thoáng mát, cửa sổ kính Low-E an toàn.'),
('apt-14a03', '14A03', 14, '1PN', '1 Phòng Ngủ - 1WC', 56.4, 52.0, 1, 1, 'Đông Bắc', 'Tây Nam', 3.10, 3100000000, 'Đang trống', NULL, NULL, NULL, 'Căn 1PN tối ưu ánh sáng cho không gian làm việc.'),
('apt-14a04', '14A04', 14, '3PN', '3 Phòng Ngủ - 3WC', 115.8, 108.0, 3, 3, 'Tây Bắc', 'Đông Nam', 6.85, 6850000000, 'Đang trống', NULL, NULL, NULL, 'Căn 3PN gia đình rộng rãi, phòng khách nối liền bếp mở.'),

-- Tầng 12A (Mặt bằng tầng 13: Căn mẫu 12A05 thực tế của Chủ hộ Nguyễn Hữu Lực)
('apt-12a01', '12A01', 13, '2PN', '2 Phòng Ngủ - 2WC', 83.2, 78.5, 2, 2, 'Đông Nam', 'Tây Bắc', 4.80, 4800000000, 'Đang trống', NULL, NULL, NULL, 'Căn 2PN tầng 12A thiết kế chuẩn phong thủy hiện đại.'),
('apt-12a02', '12A02', 13, '1PN', '1 Phòng Ngủ - 1WC', 56.4, 52.0, 1, 1, 'Tây Nam', 'Đông Bắc', 3.20, 3200000000, 'Đã bàn giao', NULL, '2026-01-20', 'BBBG-SKYLINE-12A02-20260120', 'Căn 1PN tầng 12A đã bàn giao cho cư dân.'),
('apt-12a03', '12A03', 13, '2PN', '2 Phòng Ngủ - 2WC', 79.8, 75.0, 2, 2, 'Đông Bắc', 'Tây Nam', 4.75, 4750000000, 'Đang trống', NULL, NULL, NULL, 'Căn 2PN view hướng công viên xanh mát.'),
('apt-12a04', '12A04', 13, '3PN', '3 Phòng Ngủ - 3WC', 115.8, 108.0, 3, 3, 'Tây Bắc', 'Đông Nam', 6.80, 6800000000, 'Đang trống', NULL, NULL, NULL, 'Căn 3PN đối diện căn 12A05 trên mô hình kiến trúc 3D.'),
('apt-12a05', '12A05', 13, '2PN', '2 Phòng Ngủ - 2WC', 83.2, 78.5, 2, 2, 'Đông Nam', 'Tây Bắc', 4.85, 4850000000, 'Đã bàn giao', NULL, '2026-01-15', 'BBBG-SKYLINE-12A05-20260115', 'Căn hộ thông minh kiểu mẫu 12A05 của Chủ hộ Nguyễn Hữu Lực tích hợp FaceID, IoT Daikin và cảm biến rò rỉ nước AI.'),
('apt-12a06', '12A06', 13, '1PN', '1 Phòng Ngủ - 1WC', 56.4, 52.1, 1, 1, 'Đông Bắc', 'Tây Nam', 3.20, 3200000000, 'Đã bàn giao', NULL, '2026-01-18', 'BBBG-SKYLINE-12A06-20260118', 'Căn 1PN cao cấp tầng 12A tối ưu diện tích cho chuyên gia độc thân.'),

-- Tầng 12 (Mặt bằng tầng 12 tiêu chuẩn)
('apt-1201', '12-01', 12, '2PN', '2 Phòng Ngủ - 2WC', 79.8, 75.0, 2, 2, 'Đông Nam', 'Tây Bắc', 4.65, 4650000000, 'Đang trống', NULL, NULL, NULL, 'Căn hộ 2PN tầng 12 không gian yên tĩnh tiêu chuẩn Châu Âu.'),
('apt-1202', '12-02', 12, '2PN', '2 Phòng Ngủ - 2WC', 83.2, 78.5, 2, 2, 'Tây Nam', 'Đông Bắc', 4.70, 4700000000, 'Đang trống', NULL, NULL, NULL, 'Căn hộ 2PN đón gió tự nhiên từ sông Sài Gòn.'),
('apt-1203', '12-03', 12, '1PN', '1 Phòng Ngủ - 1WC', 56.4, 52.0, 1, 1, 'Đông Bắc', 'Tây Nam', 3.05, 3050000000, 'Đang trống', NULL, NULL, NULL, 'Căn 1PN thông minh tiện nghi cho người độc thân.'),
('apt-1204', '12-04', 12, '3PN', '3 Phòng Ngủ - 3WC', 115.8, 108.0, 3, 3, 'Tây Bắc', 'Đông Nam', 6.75, 6750000000, 'Đang trống', NULL, NULL, NULL, 'Căn 3PN gia đình view thoáng rộng nội khu.'),

-- Tầng 11
('apt-11a01', '11A01', 11, '2PN', '2 Phòng Ngủ - 2WC', 79.8, 75.0, 2, 2, 'Đông Nam', 'Tây Bắc', 4.60, 4600000000, 'Đang trống', NULL, NULL, NULL, 'Căn 2PN tầng 11 vị trí đẹp đón trọn ánh sáng mai.'),
('apt-11a02', '11A02', 11, '1PN', '1 Phòng Ngủ - 1WC', 56.4, 52.0, 1, 1, 'Tây Nam', 'Đông Bắc', 3.05, 3050000000, 'Đang trống', NULL, NULL, NULL, 'Căn 1PN tầng 11 ấm cúng, vật liệu bàn giao cao cấp.'),
('apt-11a03', '11A03', 11, '2PN', '2 Phòng Ngủ - 2WC', 83.2, 78.5, 2, 2, 'Đông Bắc', 'Tây Nam', 4.65, 4650000000, 'Đang trống', NULL, NULL, NULL, 'Căn 2PN thiết kế mở thoáng mát quanh năm.'),
('apt-11a04', '11A04', 11, '3PN', '3 Phòng Ngủ - 3WC', 115.8, 108.0, 3, 3, 'Tây Bắc', 'Đông Nam', 6.70, 6700000000, 'Đang trống', NULL, NULL, NULL, 'Căn 3PN diện tích lớn đón ánh sáng tự nhiên.'),

-- Tầng 10 (Có căn 10A03 đang nghiệm thu kỹ thuật BQL)
('apt-10a01', '10A01', 10, '2PN', '2 Phòng Ngủ - 2WC', 79.8, 75.0, 2, 2, 'Đông Nam', 'Tây Bắc', 4.55, 4550000000, 'Đang trống', NULL, NULL, NULL, 'Căn hộ 2PN tầng 10 thiết kế chuẩn mực Châu Âu.'),
('apt-10a02', '10A02', 10, '1PN', '1 Phòng Ngủ - 1WC', 56.4, 52.0, 1, 1, 'Tây Nam', 'Đông Bắc', 3.00, 3000000000, 'Đã bàn giao', NULL, '2026-01-22', 'BBBG-SKYLINE-10A02-20260122', 'Căn 1PN đã bàn giao chìa khóa cho cư dân.'),
('apt-10a03', '10A03', 10, '2PN', '2 Phòng Ngủ - 2WC', 79.8, 75.0, 2, 2, 'Tây Nam', 'Đông Bắc', 4.60, 4600000000, 'Đang nghiệm thu', NULL, NULL, NULL, 'Căn hộ 2PN tầng 10 đang trong giai đoạn nghiệm thu chất lượng kỹ thuật trước bàn giao.'),
('apt-10a04', '10A04', 10, '3PN', '3 Phòng Ngủ - 3WC', 115.8, 108.0, 3, 3, 'Tây Bắc', 'Đông Nam', 6.65, 6650000000, 'Đang trống', NULL, NULL, NULL, 'Căn 3PN đón gió Đông Nam mát mẻ.'),

-- Tầng 09
('apt-09a01', '09A01', 9, '2PN', '2 Phòng Ngủ - 2WC', 83.2, 78.5, 2, 2, 'Đông Nam', 'Tây Bắc', 4.50, 4500000000, 'Đang trống', NULL, NULL, NULL, 'Căn 2PN tầng 9 view công viên và hồ nước.'),
('apt-09a02', '09A02', 9, '1PN', '1 Phòng Ngủ - 1WC', 56.4, 52.0, 1, 1, 'Tây Nam', 'Đông Bắc', 2.95, 2950000000, 'Đang trống', NULL, NULL, NULL, 'Căn 1PN thiết kế thông minh tinh tế.'),
('apt-09a03', '09A03', 9, '2PN', '2 Phòng Ngủ - 2WC', 79.8, 75.0, 2, 2, 'Đông Bắc', 'Tây Nam', 4.45, 4450000000, 'Đang trống', NULL, NULL, NULL, 'Căn 2PN đón ánh sáng tự nhiên đầy đủ.'),
('apt-09a04', '09A04', 9, '3PN', '3 Phòng Ngủ - 3WC', 115.8, 108.0, 3, 3, 'Tây Bắc', 'Đông Nam', 6.60, 6600000000, 'Đang trống', NULL, NULL, NULL, 'Căn 3PN gia đình rộng rãi tiện nghi.'),

-- Tầng 08
('apt-08a01', '08A01', 8, '3PN', '3 Phòng Ngủ - 3WC', 115.8, 108.0, 3, 3, 'Đông Nam', 'Tây Bắc', 6.55, 6550000000, 'Đang trống', NULL, NULL, NULL, 'Căn hộ 3PN tầng 8 đón gió trong lành.'),
('apt-08a02', '08A02', 8, '1PN', '1 Phòng Ngủ - 1WC', 56.4, 52.0, 1, 1, 'Tây Nam', 'Đông Bắc', 2.95, 2950000000, 'Đang trống', NULL, NULL, NULL, 'Căn hộ 1PN diện tích thông thủy 52m2 tiện nghi.'),
('apt-08a03', '08A03', 8, '2PN', '2 Phòng Ngủ - 2WC', 79.8, 75.0, 2, 2, 'Đông Bắc', 'Tây Nam', 4.40, 4400000000, 'Đang trống', NULL, NULL, NULL, 'Căn 2PN vuông vức, bố trí hợp lý.'),
('apt-08a04', '08A04', 8, '2PN', '2 Phòng Ngủ - 2WC', 83.2, 78.5, 2, 2, 'Tây Bắc', 'Đông Nam', 4.45, 4450000000, 'Đang trống', NULL, NULL, NULL, 'Căn 2PN view khu vui chơi trẻ em và lối dạo bộ.'),

-- Tầng 07
('apt-07a01', '07A01', 7, '2PN', '2 Phòng Ngủ - 2WC', 79.8, 75.0, 2, 2, 'Đông Nam', 'Tây Bắc', 4.35, 4350000000, 'Đang trống', NULL, NULL, NULL, 'Căn 2PN tầng 7 hướng sông thoáng mát quanh năm.'),
('apt-07a02', '07A02', 7, '2PN', '2 Phòng Ngủ - 2WC', 83.2, 78.5, 2, 2, 'Tây Nam', 'Đông Bắc', 4.40, 4400000000, 'Đang trống', NULL, NULL, NULL, 'Căn 2PN đón gió tự nhiên nội khu.'),
('apt-07a03', '07A03', 7, '1PN', '1 Phòng Ngủ - 1WC', 56.4, 52.0, 1, 1, 'Đông Bắc', 'Tây Nam', 2.90, 2900000000, 'Đang trống', NULL, NULL, NULL, 'Căn 1PN cao cấp tầng 7 phù hợp chuyên gia làm việc.'),
('apt-07a04', '07A04', 7, '3PN', '3 Phòng Ngủ - 3WC', 115.8, 108.0, 3, 3, 'Tây Bắc', 'Đông Nam', 6.50, 6500000000, 'Đang trống', NULL, NULL, NULL, 'Căn 3PN tầng 7 rộng rãi, logia thoáng mát.'),

-- Tầng 06
('apt-06a01', '06A01', 6, '1PN', '1 Phòng Ngủ - 1WC', 56.4, 52.0, 1, 1, 'Đông Nam', 'Tây Bắc', 2.90, 2900000000, 'Đang trống', NULL, NULL, NULL, 'Căn 1PN tầng 6 view công viên xanh mát.'),
('apt-06a02', '06A02', 6, '1PN', '1 Phòng Ngủ - 1WC', 56.4, 52.0, 1, 1, 'Tây Nam', 'Đông Bắc', 2.90, 2900000000, 'Đang trống', NULL, NULL, NULL, 'Căn 1PN thiết kế mở hiện đại.'),
('apt-06a03', '06A03', 6, '2PN', '2 Phòng Ngủ - 2WC', 79.8, 75.0, 2, 2, 'Đông Bắc', 'Tây Nam', 4.30, 4300000000, 'Đang trống', NULL, NULL, NULL, 'Căn 2PN tầng 6 không gian thoáng đãng.'),
('apt-06a04', '06A04', 6, '2PN', '2 Phòng Ngủ - 2WC', 83.2, 78.5, 2, 2, 'Tây Bắc', 'Đông Nam', 4.35, 4350000000, 'Đang trống', NULL, NULL, NULL, 'Căn 2PN view khu vườn dạo bộ.'),

-- Tầng 05 (Tầng khởi đầu căn hộ, kết nối vườn treo tầng 4)
('apt-05a01', '05A01', 5, '2PN', '2 Phòng Ngủ - 2WC', 78.5, 73.2, 2, 2, 'Đông Nam', 'Tây Bắc', 4.20, 4200000000, 'Đang trống', NULL, NULL, NULL, 'Căn hộ 2PN tầng 5 đón gió nội khu và kết nối nhanh chóng với khu vườn tiện ích tầng 4.'),
('apt-05a02', '05A02', 5, '1PN', '1 Phòng Ngủ - 1WC', 56.4, 52.0, 1, 1, 'Tây Nam', 'Đông Bắc', 2.85, 2850000000, 'Đang trống', NULL, NULL, NULL, 'Căn hộ 1PN tầng 5 di chuyển thuận tiện tới khu tiện ích thể thao tầng 3 và 4.'),
('apt-05a03', '05A03', 5, '2PN', '2 Phòng Ngủ - 2WC', 79.8, 75.0, 2, 2, 'Đông Bắc', 'Tây Nam', 4.25, 4250000000, 'Đang trống', NULL, NULL, NULL, 'Căn 2PN tầng 5 view mảng xanh và vườn dạo bộ.'),
('apt-05a04', '05A04', 5, '3PN', '3 Phòng Ngủ - 3WC', 115.8, 108.0, 3, 3, 'Tây Bắc', 'Đông Nam', 6.40, 6400000000, 'Đang trống', NULL, NULL, NULL, 'Căn hộ 3PN tầng 5 diện tích lớn, thiết kế mở sang trọng.');


-- 4. Nạp Tài Khoản Người Dùng & Cư Dân (Users - liên kết khóa ngoại apartment_code về căn hộ đã nạp)
INSERT INTO users (
    id, username, role, full_name, phone, email, id_card_no, id_date, id_place, dob, pob, gender, apartment_code, license_plate
) VALUES 
('user-manager-1', 'nks.manager01@gmail.com', 'ADMIN', 'Nguyễn Hữu Lực (Trưởng BQL)', '0908899899', 'manager@skyline.vn', '079204000888', '2021-05-10', 'Cục Cảnh sát QLHC về TTXH', '1988-04-12', 'TP. Hồ Chí Minh', 1, NULL, NULL),
('user-owner-1', '0364967082', 'OWNER', 'Nguyễn Hữu Lực', '0364967082', 'huuluc04nhl@gmail.com', '067204000961', '2022-08-15', 'Cục Cảnh sát QLHC về TTXH', '2004-11-02', 'Đắk Nông', 1, '12A05', '51K-889.99'),
('user-tech-1', '0909888777', 'TECHNICIAN', 'Lê Văn Kỹ Thuật', '0909888777', 'tech.skyline@gmail.com', '079201009988', '2020-03-20', 'Cục Cảnh sát QLHC về TTXH', '1992-07-25', 'Hà Nội', 1, NULL, NULL),
('user-recep-1', '0901234567', 'RECEPTIONIST', 'Trần Thị Thu Thảo', '0901234567', 'reception.skyline@gmail.com', '079302008877', '2022-11-10', 'Cục Cảnh sát QLHC về TTXH', '1998-09-18', 'Đà Nẵng', 0, NULL, NULL);

-- 5. Cập Nhật Chủ Sở Hữu Căn Hộ 12A05 (Gắn kết quan hệ 2 chiều hoàn chỉnh)
UPDATE apartments 
SET owner_id = 'user-owner-1' 
WHERE apt_code = '12A05';

-- 6. Nạp Thành Viên Gia Đình Căn 12A05
INSERT INTO apartment_members (
    id, apartment_code, user_id, full_name, phone, id_card, relationship, role, license_plate, face_status
) VALUES 
('mem-1', '12A05', NULL, 'Nguyễn Hữu Nhựt', '0917795211', '079198005678', 'Em Trai / Người Nhà', 'Family', '59P1-886.79', 'Đã xác thực'),
('mem-2', '12A05', NULL, 'Nguyễn Văn Cường', '0325524482', '074204001708', 'Người Thân Cùng Căn Hộ', 'Family', NULL, 'Đã xác thực'),
('mem-3', '12A05', NULL, 'Lê Đức Hải', '0977758215', '070204001704', 'Thành Viên Gia Đình', 'Family', NULL, 'Đã xác thực'),
('mem-4', '12A05', NULL, 'Vũ Cát Thịnh', '0909262626', '079201002626', 'Thành Viên Gia Đình', 'Family', NULL, 'Chờ duyệt FaceID');

-- 7. Nạp Thiết Bị Thông Minh Nhà 12A05
INSERT INTO smart_devices (id, apartment_code, name, device_type, status, location_x, location_y) VALUES 
('dev-lock-01', '12A05', 'Khóa Thông Minh FaceID Cửa Chính', 'door', 'locked', 15.5, 85.0),
('dev-light-01', '12A05', 'Hệ Thống Đèn Phòng Khách Luxury', 'light', 'on', 45.0, 50.0),
('dev-ac-01', '12A05', 'Điều Hòa Daikin Inverter 24°C', 'ac', '24', 60.0, 30.0),
('dev-curtain-01', '12A05', 'Rèm Cửa Tự Động Ban Công', 'curtain', 'open', 85.0, 50.0),
('dev-sensor-01', '12A05', 'Cảm Biến Dòng Chảy & Rò Rỉ Nước AI', 'sensor', 'active', 25.0, 20.0);

-- 8. Nạp Chỗ Đỗ Xe Định Danh Tại Hầm B1 & B2
INSERT INTO parking_slots (id, slot_code, floor_number, vehicle_type, apartment_code, assigned_user_id, assigned_license_plate, rfid_card_code, status, monthly_fee) VALUES 
('slot-b2-a15', 'Ô B2-A15', -2, 'CAR', '12A05', 'user-owner-1', '51K-889.99', 'RFID-A1205-01', 'OCCUPIED', 1200000),
('slot-b1-m88', 'Khu B1-M88', -1, 'MOTORCYCLE', '12A05', 'user-owner-1', '59P1-886.79', 'RFID-A1205-02', 'OCCUPIED', 120000);

-- 9. Nạp 5 Tiện Ích 5 Sao Gắn Với Các Tầng Chuẩn Mực
INSERT INTO facilities (id, name, category, floor_number, location_detail, operating_hours, pricing, max_quota_per_month, rating_score, current_occupancy, max_capacity, hero_image_url) VALUES 
('fac-1', 'Hồ Bơi Vô Cực Chân Mây (Skyline Horizon Pool)', 'Hồ bơi', 25, 'Tầng 25 (Sân Thượng Chung Cư)', '06:00 - 22:00', 'Miễn phí theo Thẻ cư dân (20 lượt/tháng)', 20, 4.9, 14, 40, 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800'),
('fac-3', 'Trung Tâm Thể Hình Technogym (Fitness & Yoga)', 'Gym', 3, 'Tầng 3 (Khu Thể Thao Đa Năng)', 'Mở cửa 24/7', 'Miễn phí theo Thẻ cư dân', 30, 5.0, 8, 35, 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800'),
('fac-sauna', 'Phòng Xông Hơi Đá Muối Himalaya (Private VIP)', 'Xông hơi', 3, 'Tầng 3 (Khu Chăm Sóc Sức Khỏe Riêng Tư)', '08:00 - 22:00', '500.000 đ / giờ (Phòng gia đình VIP)', 10, 5.0, 1, 4, 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800'),
('fac-kids', 'Khu Vui Chơi Trẻ Em Sky Kids Zone', 'Khu trẻ em', 1, 'Tầng 1 (Sảnh Thương Mại Tòa Chung Cư)', '07:00 - 21:00', 'Miễn phí theo Thẻ cư dân (Có người lớn đi kèm)', 30, 4.9, 6, 25, 'https://images.unsplash.com/photo-1566454544259-f4b94c3d758c?w=800'),
('fac-2', 'Vườn Tiệc Nướng BBQ Panoramic', 'BBQ', 25, 'Tầng 25 (Sân Thượng Khu Vườn Nhật Bản)', '17:00 - 23:00', '600.000 đ / ca (Bao gồm set bếp Weber & dọn dẹp)', 4, 4.8, 2, 6, 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800');

-- 10. Nạp Lịch Đặt Chỗ Tiện Ích Phòng Xông Hơi VIP
INSERT INTO facility_bookings (
    id, apartment_code, facility_id, booker_id, booker_name, ticket_code, 
    booking_date, time_slot, guest_count, duration_hours, deposit_amount, pricing, payment_method, status, notes
) VALUES (
    'BK-SAUNA-9821', '12A05', 'fac-sauna', 'user-owner-1', 'Nguyễn Hữu Lực', 'SKY-SAUNA-12A05-7799', 
    CURRENT_DATE, '18:00 - 20:00 (2 Tiếng - Tối nay)', 2, 2, 1000000, '500.000 đ / giờ', 
    'Trừ vào hóa đơn sinh hoạt tháng tới', 'CONFIRMED', 'Gia đình 2 người, chuẩn bị trước tinh dầu sả chanh'
);

-- 11. Nạp Thẻ Khách Thăm & QR Code
INSERT INTO visitor_passes (
    id, apartment_code, host_user_id, host_name, host_phone, visitor_name, visitor_phone, license_plate, 
    entry_type, purpose_label, valid_hours, qr_data, pin_code, status, valid_until
) VALUES (
    'SKY-PASS-8107', '12A05', 'user-owner-1', 'Nguyễn Hữu Lực', '0364967082', 'Trần Minh Tuấn', '0988776655', '51G-123.45', 
    'SINGLE', 'Giao hàng nội thất cao cấp', 8, 'SKYLINE_VISITOR_SKY-PASS-8107_135565', '135565', 'ACTIVE', CURRENT_TIMESTAMP + INTERVAL '8 hours'
);

-- 12. Nạp Hóa Đơn & Cảnh Báo AI Nước Tầng 12A
INSERT INTO bills (id, apartment_code, owner_name, billing_month, due_date, total_amount, status, payment_qr_url, has_ai_anomaly) VALUES 
('bill-2026-08-12a05', '12A05', 'Nguyễn Hữu Lực', 'Tháng 08/2026', '2026-08-30 23:59:59+07', 2465000, 'Unpaid', 'https://api.qrserver.com/v1/create-qr-code/?data=VNPAY_SKYLINE_12A05_2465000', TRUE),
('bill-2026-07-12a05', '12A05', 'Nguyễn Hữu Lực', 'Tháng 07/2026', '2026-07-30 23:59:59+07', 2150000, 'Paid', 'https://api.qrserver.com/v1/create-qr-code/?data=VNPAY_SKYLINE_12A05_PAID', FALSE);

INSERT INTO bill_details (id, bill_id, service_type, usage, unit_price, total_line_amount, ai_anomaly, anomaly_reason) VALUES 
('bd-01', 'bill-2026-08-12a05', 'Electricity', 340, 3200, 1088000, FALSE, NULL),
('bd-02', 'bill-2026-08-12a05', 'Water', 28, 18000, 504000, TRUE, 'Tăng vọt 115% so với tháng trước. AI ghi nhận dòng chảy liên tục 2h-4h sáng nghi rò rỉ nhẹ van xả bồn cầu.'),
('bd-03', 'bill-2026-08-12a05', 'Management_Fee', 73.2, 10000, 732000, FALSE, NULL),
('bd-04', 'bill-2026-08-12a05', 'Parking', 1, 141000, 141000, FALSE, NULL);

-- 13. Nạp Phiếu Báo Hỏng Kỹ Thuật
INSERT INTO service_tickets (
    id, apartment_code, resident_name, resident_phone, content, ai_category, ai_priority, 
    priority_color, sla_deadline, status, assigned_technician_id, assigned_technician_name
) VALUES (
    'TICK-102', '12A05', 'Nguyễn Hữu Lực', '0364967082', 'Vòi xịt toilet phòng ngủ master rỉ nước liên tục ra sàn', 
    'Nước', 1, '#DC2626', CURRENT_TIMESTAMP + INTERVAL '1 hour', 'In_Progress', 'user-tech-1', 'Lê Văn Kỹ Thuật'
);

-- 14. Nạp Thông Báo BQL & Biểu Quyết
INSERT INTO community_posts (id, author_id, author_name, author_role, title, content, category, pin_to_top) VALUES 
('post-1', 'user-manager-1', 'Ban Quản Lý Chung Cư SKYLINE', 'BQL', 'Thông báo lịch bảo dưỡng định kỳ hệ thống thang máy', 'Kính gửi Quý cư dân, BQL xin thông báo lịch bảo trì định kỳ cụm thang máy Schindler vào khung giờ 09:00 - 11:30 ngày 30/08/2026.', 'Bảo trì', TRUE);

INSERT INTO surveys (id, title, description, legal_type, status, start_date, end_date, total_votes, quorum_percent) VALUES 
('sur-01', 'Biểu quyết Phương án Nâng cấp Hệ thống Kiểm soát Xe Tự Động Hầm B2', 'Chiến dịch lấy ý kiến hợp pháp của các Chủ sở hữu căn hộ về việc trích Quỹ bảo trì để nâng cấp camera đọc biển số tự động tốc độ cao tại Hầm B2.', 'Bầu Ban Quản Trị', 'OPEN', '2026-08-01', '2026-08-31', 142, 65.50);


-- ============================================================================
-- KẾT THÚC SCRIPT DDL & DML POSTGRESQL CHUẨN MỰC
-- ============================================================================
