'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useRef } from 'react';

export type Language = 'vi' | 'en';

// =============================================================================
// DANH SÁCH TỪ ĐIỂN SONG NGỮ (VIỆT - ANH) ĐẦY ĐỦ CHO TOÀN BỘ PROJECT SKYLINE
// Cấu trúc: [Tiếng Việt, English, Key bổ sung (nếu có)]
// =============================================================================
const RAW_TRANSLATIONS: Array<[string, string, string?]> = [
  // --- THƯƠNG HIỆU & ĐIỀU HƯỚNG ---
  ['Chung Cư Thông Minh Skyline', 'Skyline Smart Residence', 'brand.name'],
  ['Chuẩn Mực Sống Thượng Lưu Tích Hợp AI', 'Luxury AI-Powered Living', 'brand.slogan'],
  ['Đường Dây Nóng Kỹ Thuật: 1900 8899', 'Technical Hotline: 1900 8899', 'brand.hotline'],
  ['SKYLINE SMART RESIDENCE', 'SKYLINE SMART RESIDENCE'],
  ['The Tropical Beverly Solari', 'The Tropical Beverly Solari'],
  ['Phân Khu Beverly Solari', 'Beverly Solari Precinct'],
  ['Tòa BS-07, Phân Khu Beverly Solari', 'Tower BS-07, Beverly Solari Precinct'],
  ['Tòa BS-08, Phân Khu Beverly Solari', 'Tower BS-08, Beverly Solari Precinct'],
  ['Tòa BS-09, Phân Khu Beverly Solari', 'Tower BS-09, Beverly Solari Precinct'],
  ['Tòa BS-10, Phân Khu Beverly Solari', 'Tower BS-10, Beverly Solari Precinct'],
  ['Trang Chủ', 'Home', 'nav.home'],
  ['Tổng Quan', 'Overview', 'nav.about'],
  ['Triết Lý Thiết Kế', 'Concept', 'nav.concept'],
  ['Mặt Bằng Căn Hộ', 'Floor Plans', 'nav.apartments'],
  ['Tiện Ích 5 Sao', '5-Star Amenities', 'nav.amenities'],
  ['Lõi Công Nghệ AI', 'AI Technology', 'nav.services'],
  ['Đăng Nhập', 'Sign In', 'nav.login'],
  ['Đăng Xuất', 'Sign Out', 'nav.logout'],
  ['Cổng Cư Dân', 'Resident Portal', 'nav.portal'],
  ['Cổng Thông Tin', 'Resident Portal'],
  ['Bảng Điều Khiển', 'Dashboard', 'nav.dashboard'],
  ['Bật Chế độ Sáng', 'Switch to Light Mode', 'nav.theme_light'],
  ['Bật Chế độ Tối', 'Switch to Dark Mode', 'nav.theme_dark'],

  // --- VAI TRÒ & PHÂN QUYỀN ---
  ['Ban Quản Lý', 'Management Board', 'role.admin'],
  ['Chủ Hộ', 'Apartment Owner', 'role.owner'],
  ['Khách Thuê', 'Tenant', 'role.tenant'],
  ['Thành Viên Gia Đình', 'Family Member', 'role.family'],
  ['Kỹ Thuật Viên', 'Technician', 'role.technician'],
  ['Nhân Sự Ban Quản Lý', 'Staff', 'role.staff'],
  ['Cư Dân', 'Resident', 'role.resident'],
  ['BAN QUẢN LÝ', 'MANAGEMENT'],
  ['CHỦ HỘ', 'OWNER'],
  ['KHÁCH THUÊ', 'TENANT'],
  ['CƯ DÂN', 'RESIDENT'],
  ['KỸ THUẬT VIÊN', 'TECHNICIAN'],
  ['Ban Quản Lý Chung Cư Skyline', 'Skyline Residence Management Board'],
  ['Ban Quản Lý Skyline', 'Skyline Management'],
  ['BQL Chung Cư', 'Management Board'],
  ['Chủ Hộ Căn Hộ', 'Apartment Owner'],
  ['Người Nhà Căn Hộ', 'Family Member'],
  ['Phân Hệ Cư Dân', 'Resident Portal'],

  // --- LANDING PAGE: HERO SECTION ---
  ['Kiến Trúc Đương Đại Tích Hợp Lõi AI', 'Contemporary Architecture with AI Core'],
  ['Nơi Chuẩn Mực Kiến Trúc Gặp Gỡ', 'Where Architectural Standards Meet'],
  ['Trí Tuệ Nhân Tạo 4.0', 'Artificial Intelligence 4.0'],
  ['Khám Phá Căn Hộ', 'Explore Apartments'],
  ['Đặt Lịch Tham Quan', 'Schedule a Tour'],
  ['Trải Nghiệm Chuẩn Sống Thượng Lưu', 'Experience Luxury Living'],
  ['Hệ Sinh Thái Đỉnh Cao', 'Premier Ecosystem'],
  ['Xem Chi Tiết Căn Hộ', 'View Apartment Details'],
  ['Khám Phá Tiện Ích', 'Explore Amenities'],
  ['Liên Hệ Ngay', 'Contact Now'],
  ['Căn Hộ BS-07 - The Tropical', 'Apartment BS-07 - The Tropical'],
  ['4.000+ Cư Dân Thượng Lưu', '4,000+ Elite Residents'],
  ['99.8% Tỷ Lệ Hài Lòng', '99.8% Satisfaction Rate'],
  ['24/7 AI Giám Sát', '24/7 AI Monitoring'],

  // --- LANDING PAGE: ABOUT & CONCEPT ---
  ['Triết Lý Thiết Kế & Không Gian', 'Design Philosophy & Space'],
  ['Sự Giao Thoa Giữa Nghệ Thuật Kiến Trúc Tối Giản Và Vận Hành Số Hóa', 'Intersection of Minimalist Architecture & Digital Operations'],
  ['Quyền Tự Trị Căn Hộ', 'Apartment Autonomy'],
  ['Chủ hộ toàn quyền cấp phát FaceID và quản lý thành viên cư trú.', 'Owners have full authority to grant FaceID and manage resident members.'],
  ['An Ninh Đa Lớp 24/7', '24/7 Multi-Layer Security'],
  ['Phân tầng thang máy bảo mật và camera Vision AI quét biển số xe tự động.', 'Secure elevator zoning and Vision AI cameras for automated license plate scanning.'],

  // --- LANDING PAGE: AMENITIES & FACILITIES ---
  ['Đặc Quyền Nghỉ Dưỡng 5 Sao', '5-Star Resort Privileges'],
  ['Hệ Thống Tiện Ích Đỉnh Cao', 'Premier Amenities System'],
  ['Từ hồ bơi vô cực tầng chân mây đến khu BBQ panoramic — toàn bộ 8 đại tiện ích vận hành tự động 24/7, ra vào bằng FaceID sinh trắc học, không cần vé giấy.', 'From cloud-level infinity pool to panoramic BBQ area — all 8 major amenities operate automatically 24/7 with FaceID biometrics, no paper tickets needed.'],
  ['Hồ bơi vô cực chân mây', 'Cloud Infinity Pool'],
  ['Phòng Gym Technogym', 'Technogym Fitness Center'],
  ['Vườn nướng BBQ ngoài trời', 'Outdoor BBQ Garden'],
  ['Sân Tennis tiêu chuẩn', 'Championship Tennis Court'],
  ['Phòng xông hơi Sauna VIP', 'VIP Sauna & Spa'],
  ['Sảnh đón khách 5 sao', '5-Star Luxury Lobby'],
  ['Khu vui chơi trẻ em', 'Kids Playground'],
  ['Bãi đỗ xe thông minh 2 tầng hầm', '2-Level Smart Underground Parking'],
  ['Giờ mở cửa', 'Opening Hours'],
  ['Chi phí', 'Cost'],
  ['Miễn phí cho cư dân', 'Complimentary for Residents'],
  ['Đặt tiện ích', 'Book Amenity'],

  // --- LANDING PAGE: SMART TECH & SERVICES ---
  ['Công Nghệ Đột Phá', 'Breakthrough Technology'],
  ['Hệ Sinh Thái Thông Minh Toàn Diện', 'Comprehensive Smart Ecosystem'],
  ['Nhận diện khuôn mặt 3D tại mọi điểm chạm', '3D facial recognition at all touchpoints'],
  ['Điều khiển căn hộ thông minh từ xa qua IoT', 'Remote smart home control via IoT'],
  ['Trợ lý ảo AI Concierge giải đáp cư dân 24/7', 'AI Concierge virtual assistant for 24/7 resident inquiries'],
  ['Hệ thống PCCC thông minh và cảm biến nhiệt tự động', 'Smart fire safety and automated thermal sensors'],
  ['Dịch Vụ Đặc Quyền', 'Exclusive Services'],
  ['Chuẩn Mực Phục Vụ Chu Đáo 24/7', '24/7 Thoughtful Service Standards'],
  ['Lễ tân & CSKH 24/7', '24/7 Concierge & Reception'],
  ['Bảo trì kỹ thuật tốc hành', 'Express Technical Maintenance'],
  ['An ninh tuần tra 24/7', '24/7 Security Patrols'],
  ['Dịch vụ dọn dẹp vệ sinh theo yêu cầu', 'On-demand housekeeping services'],

  // --- FOOTER LANDING ---
  ['Bản quyền thuộc về', 'Copyright by'],
  ['Đã đăng ký bản quyền.', 'All rights reserved.'],
  ['Chính sách bảo mật', 'Privacy Policy'],
  ['Điều khoản dịch vụ', 'Terms of Service'],
  ['Quy chế quản lý tòa nhà', 'Building Management Regulations'],

  // --- MODAL ĐĂNG NHẬP (LOGIN MODAL) ---
  ['Đăng Nhập Tài Khoản', 'Account Sign In'],
  ['Chọn Vai Trò Đăng Nhập', 'Select Login Role'],
  ['Cư Dân / Chủ Hộ', 'Resident / Owner'],
  ['Ban Quản Lý (Admin)', 'Management Board (Admin)'],
  ['Kỹ Thuật Viên (KTV)', 'Technician'],
  ['Tài Khoản', 'Account'],
  ['Tên đăng nhập / Email', 'Username / Email'],
  ['Mật Khẩu', 'Password'],
  ['Mật khẩu', 'Password'],
  ['Ghi Nhớ Đăng Nhập', 'Remember Me'],
  ['Quên Mật Khẩu?', 'Forgot Password?'],
  ['Đăng Nhập Bằng FaceID', 'Sign In with FaceID'],
  ['Đăng Nhập Bằng Mã OTP', 'Sign In with OTP'],
  ['Đăng Nhập Ngay', 'Sign In Now'],
  ['Vui lòng nhập tên đăng nhập hoặc email', 'Please enter username or email'],
  ['Vui lòng nhập mật khẩu', 'Please enter password'],
  ['Đổi Mật Khẩu', 'Change Password'],
  ['Mật khẩu hiện tại', 'Current password'],
  ['Mật khẩu mới', 'New password'],
  ['Xác nhận mật khẩu mới', 'Confirm new password'],
  ['Cập Nhật Mật Khẩu', 'Update Password'],

  // --- PORTAL SIDEBAR TABS ---
  ['Hồ Sơ & Xác Thực', 'Profile & e-KYC'],
  ['Hồ Sơ', 'Profile'],
  ['Hồ Sơ Cư Dân', 'Resident Profile'],
  ['Hồ Sơ Cá Nhân & e-KYC', 'Personal Profile & e-KYC'],
  ['Thành Viên', 'Family Members'],
  ['Nhà Thông Minh', 'Smart Home'],
  ['Tiện Ích', 'Amenities'],
  ['Dịch Vụ', 'Services'],
  ['Hóa Đơn', 'Billing'],
  ['Hóa Đơn & Tài Chính', 'Finance & Billing'],
  ['Hóa Đơn Tiện Ích', 'Utility Bills'],
  ['Báo Hỏng', 'Service Tickets'],
  ['Báo Hỏng & Kỹ Thuật', 'Repairs & Maintenance'],
  ['Hỗ Trợ Kỹ Thuật', 'Technical Support'],
  ['Biểu Quyết', 'Voting'],
  ['Biểu Quyết Cư Dân', 'Resident Voting'],
  ['Trợ Lý AI', 'AI Assistant'],
  ['Căn Hộ', 'Apartment'],
  ['Xác Thực Cư Dân', 'Resident Verification'],
  ['Khách Thăm', 'Visitors'],
  ['Khách Đến Thăm', 'Visitor Passes'],
  ['Sửa Chữa', 'Repairs & Tasks'],
  ['Thiết Bị', 'Devices'],
  ['Bãi Đỗ Xe', 'Parking'],
  ['Khảo Sát', 'Surveys'],
  ['Thẻ Cư Dân', 'Resident Pass'],
  ['Sổ Tay Cư Dân', 'Resident Handbook'],
  ['Quản Lý Căn Hộ', 'Apartment Management'],
  ['Quản Lý Cư Dân', 'Resident Management'],
  ['Điều Phối Kỹ Thuật', 'Technical Dispatch'],
  ['Trung Tâm Hóa Đơn', 'Billing Studio'],
  ['Giám Sát Thiết Bị', 'Device Health'],
  ['Kiểm Soát Ra Vào', 'Access Control'],

  // --- TOPBAR & TÌM KIẾM ---
  ['TÌM NHANH', 'QUICK SEARCH'],
  ['Tìm kiếm...', 'Search...'],
  ['Gợi ý tìm kiếm', 'Search Suggestions'],
  ['Tìm nhanh dịch vụ', 'Quick search services'],
  ['Thông Báo Thời Gian Thực', 'Real-time Notifications'],
  ['Thông Báo', 'Notifications'],
  ['Hotline An Ninh & Khẩn Cấp 24/7', '24/7 Emergency & Security Hotline'],
  ['Vị trí:', 'Location:'],
  ['Vị trí', 'Location'],
  ['Số điện thoại:', 'Phone Number:'],
  ['Số CCCD:', 'Citizen ID:'],
  ['2 Mới', '2 New'],

  // --- TRẠNG THÁI (STATUSES & BADGES) ---
  ['Đang Hoạt Động', 'Active', 'status.active'],
  ['Đang Chờ Phê Duyệt', 'Pending Approval', 'status.pending'],
  ['Chờ Chủ Hộ Xác Nhận', 'Pending Owner Confirmation', 'status.pending_owner'],
  ['Đã Kích Hoạt Quyền Ra Vào', 'Access Granted', 'status.approved'],
  ['Cần Cập Nhật / Chụp Lại', 'Resubmission Required', 'status.rejected'],
  ['Bản Nháp Chưa Gửi', 'Draft', 'status.draft'],
  ['Đã Xác Thực Căn Cước', 'Identity Verified', 'status.verified'],
  ['Chờ Duyệt', 'Pending'],
  ['Đã Duyệt', 'Approved'],
  ['Đã Phê Duyệt', 'Approved'],
  ['Từ Chối', 'Rejected'],
  ['Đã Từ Chối', 'Rejected'],
  ['Hoàn Thành', 'Completed'],
  ['Đã Hoàn Tất', 'Completed'],
  ['Đang Xử Lý', 'In Progress'],
  ['Đã Hủy', 'Cancelled'],
  ['Chưa Thanh Toán', 'Unpaid'],
  ['Đã Thanh Toán', 'Paid'],
  ['Quá Hạn', 'Overdue'],
  ['Đã Kích Hoạt', 'Activated'],
  ['Đã Xác Thực', 'Verified'],
  ['Chưa Xác Thực', 'Unverified'],
  ['Hợp Lệ', 'Valid'],
  ['Hết Hạn', 'Expired'],
  ['Bản Nháp', 'Draft'],

  // --- THAO TÁC & NÚT BẤM (ACTIONS & BUTTONS) ---
  ['Gửi Ban Quản Lý Duyệt', 'Submit to Management'],
  ['Gửi Lại Ban Quản Lý Duyệt', 'Resubmit to Management'],
  ['Gửi Yêu Cầu', 'Submit Request'],
  ['Xác Nhận & Kích Hoạt', 'Approve & Activate'],
  ['Xác Nhận Ngay', 'Confirm Now'],
  ['Xác Nhận', 'Confirm'],
  ['Yêu Cầu Bổ Sung', 'Request Rescan'],
  ['Kiểm Tra Đối Chiếu', 'Inspect & Compare'],
  ['Tạm Khóa / Thu Hồi Quyền', 'Revoke Access'],
  ['Làm Mới', 'Refresh'],
  ['Cập nhật', 'Update'],
  ['Đóng', 'Close'],
  ['Lưu Thay Đổi', 'Save Changes'],
  ['Lưu lại', 'Save'],
  ['Hủy Bỏ', 'Cancel'],
  ['Hủy', 'Cancel'],
  ['Quay Lại', 'Go Back'],
  ['Tiếp Tục', 'Continue'],
  ['Xem Chi Tiết', 'View Details'],
  ['Chi Tiết', 'Details'],
  ['Chỉnh Sửa', 'Edit'],
  ['Xóa', 'Delete'],
  ['Thêm Mới', 'Add New'],
  ['Thêm Thành Viên', 'Add Family Member'],
  ['Tạo Mã Khách', 'Create Visitor Pass'],
  ['Thanh Toán Ngay', 'Pay Now'],
  ['Tải Hóa Đơn', 'Download Bill'],
  ['Tạo Yêu Cầu Mới', 'Create New Ticket'],
  ['Tham Gia Biểu Quyết', 'Vote Now'],
  ['Đặt Tiện Ích', 'Book Amenity'],
  ['Xem tất cả', 'View All'],
  ['Bật', 'On'],
  ['Tắt', 'Off'],

  // --- RESIDENT HOME (TRANG CHỦ CƯ DÂN) ---
  ['Xin Chào,', 'Welcome,'],
  ['Thời tiết:', 'Weather:'],
  ['Độ ẩm:', 'Humidity:'],
  ['Chất lượng không khí (AQI):', 'Air Quality (AQI):'],
  ['Phím tắt nhanh', 'Quick Shortcuts'],
  ['Thanh toán hóa đơn', 'Pay Utility Bills'],
  ['Quét FaceID ra vào', 'FaceID Gate Access'],
  ['Báo hỏng kỹ thuật', 'Report Maintenance'],
  ['Tạo mã khách ra vào', 'Create Visitor Pass'],
  ['Ngữ cảnh nhà thông minh', 'Smart Home Scenes'],
  ['Ngữ Cảnh Nhanh:', 'Quick Scenes:'],
  ['Về nhà', 'Welcome Home'],
  ['Về Nhà', 'Welcome Home'],
  ['Đi ngủ', 'Good Night'],
  ['Đi Ngủ', 'Good Night'],
  ['Ra ngoài', 'Leaving Home'],
  ['Ra Ngoài', 'Leaving Home'],
  ['Xem Phim', 'Cinema Mode'],
  ['Ăn Tối', 'Dining Mode'],
  ['Nắng nhẹ', 'Mild Sunshine'],
  ['Không khí sạch', 'Clean Air'],
  ['Độ ẩm', 'Humidity'],
  ['e-KYC Đã Xác Thực', 'e-KYC Verified'],
  ['FaceID Đã Kích Hoạt', 'FaceID Activated'],
  ['FaceID: Chờ Chủ Hộ Duyệt', 'FaceID: Pending Owner'],
  ['FaceID: Chờ BQL Phê Duyệt', 'FaceID: Pending Management'],
  ['Quét FaceID Của Bạn', 'Scan Your FaceID'],
  ['Tạo QR Đón Khách', 'Create Guest QR'],
  ['Tạo mã QR cho khách quét mở sảnh và thang máy.', 'Create QR code for guests to open lobby & elevators.'],
  ['Báo Hỏng & Sửa Chữa', 'Report Issues & Repairs'],
  ['Gửi yêu cầu kiểm tra và sửa chữa thiết bị căn hộ.', 'Submit inspection and repair requests for apartment devices.'],
  ['Hóa Đơn Dịch Vụ', 'Service Bills'],
  ['Thanh toán tiền điện, nước và phí quản lý.', 'Pay electricity, water, and management fees.'],
  ['Tiện Ích Cư Dân', 'Resident Amenities'],
  ['Đặt lịch sử dụng hồ bơi, phòng gym và BBQ.', 'Book swimming pool, gym, and BBQ area.'],
  ['Thẻ Cư Dân Điện Tử', 'Digital Resident Card'],
  ['Chạm để lật thẻ • Dùng mở cổng sảnh & thang máy', 'Tap to flip card • Used for lobby & elevator access'],
  ['Hóa đơn gần nhất', 'Recent Bills'],
  ['Thông báo từ Ban Quản Lý', 'Announcements from Management'],
  ['Chưa có thông báo mới', 'No new announcements'],
  ['Bật đèn • ĐH 24°C • Mở rèm', 'Lights On • AC 24°C • Open Curtains'],
  ['Tắt điện • Khóa cửa • Đóng rèm', 'Lights Off • Lock Door • Close Curtains'],
  ['ĐH 26°C • Khóa cửa • Đóng rèm', 'AC 26°C • Lock Door • Close Curtains'],
  ['ĐH 23°C • Đèn 15% • Đóng rèm', 'AC 23°C • Dim 15% • Close Curtains'],
  ['Bật đèn bếp • View phố', 'Kitchen Lights • City View'],

  // --- XÁC THỰC E-KYC (CCCD & FACEID) ---
  ['Hồ Sơ Cư Dân & Định Danh Số', 'Resident Profile & Digital Identity'],
  ['Nhận Diện Khuôn Mặt (FaceID)', 'FaceID Biometric Recognition'],
  ['Quét Khuôn Mặt Ngay', 'Scan Face Now'],
  ['Chụp Lại Khuôn Mặt', 'Rescan Face'],
  ['Xác Thực Độ Sống Người Thật', 'Liveness Anti-Spoofing Check'],
  ['Thu Thập Mẫu Khuôn Mặt', 'FaceID Enrollment'],
  ['Quét Thẻ Căn Cước Công Dân', 'Scan Citizen ID Card'],
  ['Chụp Lại Căn Cước', 'Rescan ID Card'],
  ['Mặt Trước Thẻ CCCD', 'Front Side ID Card'],
  ['Mặt Sau Thẻ CCCD', 'Back Side ID Card'],
  ['Số Căn Cước Công Dân', 'Citizen ID Number'],
  ['Số CCCD', 'Citizen ID'],
  ['Ngày Cấp', 'Issued Date'],
  ['Nơi Cấp', 'Issued Place'],
  ['Họ và Tên', 'Full Name'],
  ['Họ tên', 'Full name'],
  ['Số Điện Thoại', 'Phone Number'],
  ['Số điện thoại', 'Phone number'],
  ['Email', 'Email'],
  ['Địa chỉ', 'Address'],
  ['Địa Chỉ Thường Trú', 'Permanent Address'],
  ['Ngày Sinh', 'Date of Birth'],
  ['Ngày sinh', 'Date of birth'],
  ['Giới Tính', 'Gender'],
  ['Giới tính', 'Gender'],
  ['Nam', 'Male'],
  ['Nữ', 'Female'],
  ['Quốc Tịch', 'Nationality'],
  ['Mối Quan Hệ', 'Relationship'],
  ['Chủ hộ', 'Apartment Owner'],
  ['Vợ', 'Wife'],
  ['Chồng', 'Husband'],
  ['Con', 'Child'],
  ['Bố', 'Father'],
  ['Mẹ', 'Mother'],
  ['Người thuê', 'Tenant'],

  // --- CĂN HỘ & TÒA NHÀ ---
  ['Mã Căn Hộ', 'Apartment Code'],
  ['Số Căn Hộ', 'Apartment Number'],
  ['Tòa Nhà', 'Building'],
  ['Tầng', 'Floor'],
  ['Diện Tích', 'Area'],
  ['Phòng Ngủ', 'Bedrooms'],
  ['Phòng Tắm', 'Bathrooms'],

  // --- NHÀ THÔNG MINH (SMART HOME) ---
  ['Phòng Khách', 'Living Room'],
  ['Phòng Ngủ Master', 'Master Bedroom'],
  ['Phòng Bếp', 'Kitchen'],
  ['Ban Công', 'Balcony'],
  ['Đèn Phòng Khách', 'Living Room Light'],
  ['Máy Lạnh', 'Air Conditioner'],
  ['Rèm Cửa', 'Smart Curtains'],
  ['Bình Nước Nóng', 'Water Heater'],
  ['Bật tất cả', 'Turn All On'],
  ['Tắt tất cả', 'Turn All Off'],

  // --- HÓA ĐƠN & TÀI CHÍNH (FINANCE & BILLING) ---
  ['Hóa Đơn & Thanh Toán Tiện Ích', 'Utility Bills & Payments'],
  ['Tổng tiền cần thanh toán', 'Total Amount Due'],
  ['Hóa đơn tháng này', 'Current Month Bill'],
  ['Điện Sinh Hoạt', 'Residential Electricity'],
  ['Nước Sinh Hoạt', 'Residential Water'],
  ['Phí Quản Lý Vận Hành', 'Building Management Fee'],
  ['Phí Đỗ Xe & Gửi Xe', 'Parking & Vehicle Fee'],
  ['Phí Sử Dụng Tiện Ích Đặt Trước', 'Reserved Facility Usage Fee'],
  ['Giặt Ủi & Giặt Hấp Cao Cấp', 'Premium Laundry & Dry Cleaning'],
  ['Giúp Việc & Dọn Dẹp Căn Hộ', 'Housekeeping & Apartment Cleaning'],
  ['Thuê Huấn Luyện Viên PT Bơi/Gym', 'Personal Trainer (PT) Swim/Gym'],
  ['Chăm Sóc & Rửa Xe Hầm B2', 'Car Care & Wash Basement B2'],
  ['Phí Dịch Vụ Cư Dân', 'Resident Service Fees'],
  ['Tiền điện', 'Electricity Fee'],
  ['Tiền nước', 'Water Fee'],
  ['Phí quản lý vận hành', 'Management Fee'],
  ['Phí gửi xe ô tô', 'Car Parking Fee'],
  ['Phí gửi xe máy', 'Motorbike Parking Fee'],
  ['Trạng thái thanh toán', 'Payment Status'],
  ['Thanh toán qua VietQR', 'Pay via VietQR'],
  ['Thanh toán qua VNPay', 'Pay via VNPay'],
  ['Quét mã QR để thanh toán nhanh', 'Scan QR code for instant payment'],
  ['Lịch sử thanh toán', 'Payment History'],
  ['Tải biên lai', 'Download Receipt'],
  ['Tải hóa đơn VAT', 'Download VAT Invoice'],

  // --- BÁO HỎNG & GÓP Ý (TICKET SERVICE) ---
  ['Hỗ Trợ Kỹ Thuật & Tiếp Nhận Ý Kiến', 'Technical Support & Feedback'],
  ['Báo Hỏng Kỹ Thuật', 'Technical Repair'],
  ['Góp Ý & BQL', 'Management Feedback'],
  ['Gợi Ý Sự Cố Nhanh', 'Quick Repair Presets'],
  ['Khu vực', 'Area'],
  ['Mức độ khẩn cấp', 'Urgency Level'],
  ['Khẩn cấp', 'High Urgency'],
  ['Bình thường', 'Normal'],
  ['Thời gian mong muốn', 'Preferred Time Slot'],
  ['Càng sớm càng tốt (< 30 phút)', 'As soon as possible (< 30 mins)'],
  ['Sáng nay (08:30 - 11:30)', 'This morning (08:30 - 11:30)'],
  ['Chiều nay (13:30 - 17:00)', 'This afternoon (13:30 - 17:00)'],
  ['Tối nay (17:30 - 20:30)', 'This evening (17:30 - 20:30)'],
  ['Mô tả chi tiết sự cố', 'Detailed Issue Description'],
  ['Đính kèm ảnh hiện trường', 'Attach Site Photo'],
  ['Gửi Yêu Cầu Sửa Chữa', 'Submit Repair Request'],
  ['Gửi Góp Ý Đến BQL', 'Submit Feedback to Management'],
  ['Kỹ thuật viên phụ trách', 'Assigned Technician'],
  ['Ảnh hiện trường', 'Site Photo'],
  ['Ảnh nghiệm thu', 'Resolution Photo'],
  ['Chấm Điểm KTV', 'Rate Technician'],
  ['Đánh Giá Chất Lượng Dịch Vụ Kỹ Thuật', 'Technical Service Quality Rating'],
  ['Ban Quản Lý đang kiểm tra hiện trường & lập phương án giải quyết', 'Management is inspecting the site and formulating a solution'],
  ['Chuyên trách: Đội ngũ CSKH & Vận hành tòa nhà', 'Handled by: Customer Care & Building Operations Team'],
  ['Cam kết: Trong 24 giờ', 'Committed: Within 24 hours'],
  ['Cam kết: 45 phút', 'Committed: 45 minutes'],
  ['BQL Phản Hồi', 'Management Reply'],
  ['Đổi KTV', 'Change Tech'],
  ['Nghiệm Thu', 'Inspect & Resolve'],
  ['✓ AI Nghiệm Thu Đạt Chuẩn', '✓ AI Verified: Quality Met'],
  ['⚠️ AI Cảnh Báo: Ảnh Nghi Ngờ', '⚠️ AI Warning: Suspicious Photo'],
  ['⏳ AI Đánh Giá: Chưa Triệt Để', '⏳ AI Assessment: Incomplete'],
  ['AI Thẩm Định: Hiện trường đạt chuẩn kỹ thuật Skyline', 'AI Audit: Site meets Skyline engineering standards'],
  ['Hệ thống Giám sát KTV', 'Technician Oversight System'],
  ['BQL Skyline Audit', 'Skyline Management Audit'],
  ['Đối chiếu ảnh', 'Compare Photos'],
  ['Xem ảnh', 'View Photos'],

  // --- KHÁCH THĂM & RA VÀO (VISITOR PASS) ---
  ['Cấp Mã Khách Ra Vào Tòa Nhà', 'Issue Visitor Access Pass'],
  ['Tên Khách', 'Guest Name'],
  ['Biển Số Xe', 'License Plate'],
  ['Thời Gian Đến', 'Arrival Time'],
  ['Thời Gian Hết Hạn', 'Expiry Time'],
  ['Mục Đích Đến', 'Purpose of Visit'],
  ['Mã PIN Ra Vào', 'Access PIN'],
  ['Mã QR Ra Vào', 'Access QR Code'],
  ['Chia Sẻ Mã Khách', 'Share Guest Pass'],
  ['Tạo Mã Khách Ngay', 'Create Visitor Pass Now'],

  // --- BIỂU QUYẾT & KHẢO SÁT (VOTING & SURVEYS) ---
  ['Biểu Quyết & Lấy Ý Kiến Cư Dân', 'Resident Voting & Surveys'],
  ['Hội nghị nhà chung cư thường niên', 'Annual Apartment Owners Meeting'],
  ['Thời gian biểu quyết', 'Voting Period'],
  ['Tỷ lệ tham gia', 'Participation Rate'],
  ['Tán thành', 'Approve'],
  ['Không tán thành', 'Disapprove'],
  ['Ý kiến khác', 'Other Opinion'],
  ['Gửi Phiếu Biểu Quyết', 'Submit Vote'],

  // --- SỔ TAY CƯ DÂN (RESIDENT HANDBOOK) ---
  ['Sổ Tay Cư Dân Điện Tử', 'Digital Resident Handbook'],
  ['Nội quy chung cư', 'Building Regulations'],
  ['Quy định sử dụng thang máy', 'Elevator Guidelines'],
  ['Hướng dẫn an toàn PCCC', 'Fire Safety Instructions'],
  ['Quy định phân loại rác thải', 'Waste Sorting Regulations'],
  ['Danh bạ liên hệ khẩn cấp', 'Emergency Contact Directory'],

  // --- BAN QUẢN LÝ (ADMIN KANBAN & DISPATCH) ---
  ['Bảng Điều Phối Kỹ Thuật (Kanban)', 'Technical Dispatch Kanban Board'],
  ['Chờ Tiếp Nhận', 'Pending Dispatch'],
  ['Đã Xử Lý Xong', 'Completed'],
  ['AI Tự Động Phân Công', 'AI Auto-Dispatch'],
  ['Duyệt Đề Xuất AI', 'Approve AI Recommendation'],
  ['Phân công KTV', 'Assign Technician'],
  ['Nghiệm Thu & Đóng Phiếu', 'Inspect & Close Ticket'],
  ['Phản Hồi Cư Dân', 'Reply to Resident'],
  ['Biên bản nghiệm thu kỹ thuật', 'Technical Inspection Report'],
  ['Thù lao kỹ thuật viên', 'Technician Payroll'],
  ['In Phiếu Chi Lương', 'Print Payroll Slip'],
];

// =============================================================================
// XÂY DỰNG TỪ ĐIỂN VÀ ÁNH XẠ 2 CHIỀU ĐỂ KHÔNG BAO GIỜ BỊ LỖI DUPLICATE KEY
// =============================================================================
export const DICTIONARY: Record<string, { vi: string; en: string }> = {};
const VI_TO_EN_MAP = new Map<string, string>();
const EN_TO_VI_MAP = new Map<string, string>();

RAW_TRANSLATIONS.forEach(([vi, en, key]) => {
  const viClean = vi.trim();
  const enClean = en.trim();

  DICTIONARY[viClean] = { vi: viClean, en: enClean };
  if (key) {
    DICTIONARY[key.trim()] = { vi: viClean, en: enClean };
  }

  VI_TO_EN_MAP.set(viClean.toLowerCase(), enClean);
  EN_TO_VI_MAP.set(enClean.toLowerCase(), viClean);
});

// Sắp xếp các cụm từ theo chiều dài giảm dần (từ dài nhất đến ngắn nhất)
// Đảm bảo các cụm từ ghép luôn được dịch trước từ đơn
const SORTED_VI_PHRASES: Array<{ vi: string; en: string }> = Array.from(VI_TO_EN_MAP.entries())
  .filter(([vi]) => vi.length >= 3)
  .map(([vi, en]) => ({ vi, en }))
  .sort((a, b) => b.vi.length - a.vi.length);

const SORTED_EN_PHRASES: Array<{ vi: string; en: string }> = Array.from(EN_TO_VI_MAP.entries())
  .filter(([en]) => en.length >= 3)
  .map(([en, vi]) => ({ vi, en }))
  .sort((a, b) => b.en.length - a.en.length);

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Hàm dịch thuật an toàn 100%:
 * 1. Khớp nguyên văn cả chuỗi (Exact match) trước tiên.
 * 2. Nếu là câu dài: tìm và thay thế theo ranh giới từ (Word boundaries),
 *    dùng Tokenizer trung gian để chống lặp từ hoặc cắt cụt chữ (như "Việt Nam" -> "Việt Male").
 */
export function translateSentence(text: string, targetLang: Language): string {
  if (!text || !text.trim()) return text;
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  // 1. Exact Match ưu tiên hàng đầu
  if (targetLang === 'en') {
    if (VI_TO_EN_MAP.has(lower)) {
      const match = VI_TO_EN_MAP.get(lower)!;
      return text.replace(trimmed, match);
    }
  } else {
    if (EN_TO_VI_MAP.has(lower)) {
      const match = EN_TO_VI_MAP.get(lower)!;
      return text.replace(trimmed, match);
    }
  }

  // 2. Tokenized Phrase Replacement theo ranh giới từ an toàn
  let current = text;
  const tokens: string[] = [];
  let tokenIdx = 0;

  const phraseList = targetLang === 'en' ? SORTED_VI_PHRASES : SORTED_EN_PHRASES;

  for (const item of phraseList) {
    const sourcePhrase = targetLang === 'en' ? item.vi : item.en;
    const targetPhrase = targetLang === 'en' ? item.en : item.vi;

    if (sourcePhrase.length < 3) continue;

    if (current.toLowerCase().includes(sourcePhrase.toLowerCase())) {
      // Dùng Regex biên từ (boundary) để tránh thay thế cụm từ nằm trong từ khác
      const regex = new RegExp(`(^|[^a-zA-Z0-9À-ỹ])(${escapeRegExp(sourcePhrase)})([^a-zA-Z0-9À-ỹ]|$)`, 'gi');
      if (regex.test(current)) {
        current = current.replace(regex, (match, prefix, _matchedWord, suffix) => {
          const token = `__SKYLINE_TOKEN_${tokenIdx}__`;
          tokens[tokenIdx] = targetPhrase;
          tokenIdx++;
          return `${prefix}${token}${suffix}`;
        });
      }
    }
  }

  // Giải mã Token sau khi đã duyệt toàn bộ danh sách phrase
  for (let i = 0; i < tokenIdx; i++) {
    current = current.split(`__SKYLINE_TOKEN_${i}__`).join(tokens[i]);
  }

  return current;
}

// =============================================================================
// REACT CONTEXT & HOOK
// =============================================================================
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (keyOrText: string, fallback?: string) => string;
  isMounted: boolean;
  isEn: boolean;
  isVi: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('vi');
  const [isMounted, setIsMounted] = useState(false);
  const isTranslatingRef = useRef(false);
  const originalNodesMap = useRef<WeakMap<Node, string>>(new WeakMap());

  useEffect(() => {
    setIsMounted(true);
    try {
      const saved = localStorage.getItem('skyline_language') as Language | null;
      if (saved === 'en' || saved === 'vi') {
        setLanguageState(saved);
        applyDocumentLang(saved);
      } else {
        setLanguageState('vi');
        applyDocumentLang('vi');
      }
    } catch {
      setLanguageState('vi');
      applyDocumentLang('vi');
    }
  }, []);

  const applyDocumentLang = (lang: Language) => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
      document.documentElement.setAttribute('data-lang', lang);
    }
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('skyline_language', lang);
    } catch {}
    applyDocumentLang(lang);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('skyline_language_changed', { detail: { language: lang } }));
    }
  };

  const toggleLanguage = () => {
    const next = language === 'vi' ? 'en' : 'vi';
    setLanguage(next);
  };

  /**
   * Hàm dịch trực tiếp theo key hoặc plain text trong React
   */
  const t = (keyOrText: string, fallback?: string): string => {
    if (!keyOrText) return '';
    const trimmed = keyOrText.trim();
    const lower = trimmed.toLowerCase();

    // 1. Kiểm tra key trực tiếp trong DICTIONARY
    if (DICTIONARY[keyOrText] && DICTIONARY[keyOrText][language]) {
      return DICTIONARY[keyOrText][language];
    }
    if (DICTIONARY[trimmed] && DICTIONARY[trimmed][language]) {
      return DICTIONARY[trimmed][language];
    }

    // 2. Tra cứu 2 chiều
    if (language === 'en') {
      if (VI_TO_EN_MAP.has(lower)) {
        return VI_TO_EN_MAP.get(lower)!;
      }
    } else {
      if (EN_TO_VI_MAP.has(lower)) {
        return EN_TO_VI_MAP.get(lower)!;
      }
    }

    // 3. Dịch cụm từ hoặc trả fallback
    const result = translateSentence(trimmed, language);
    if (result !== trimmed) return result;

    return fallback || keyOrText;
  };

  // ===========================================================================
  // TỰ ĐỘNG DỊCH THUẬT TOÀN DIỆN TRÊN DOM (ĐẢM BẢO HOẠT ĐỘNG CHO TOÀN BỘ PROJECT)
  // ===========================================================================
  useEffect(() => {
    if (typeof window === 'undefined' || !isMounted) return;

    let debounceTimer: any = null;

    const processTextNode = (node: Node) => {
      if (!node || node.nodeType !== Node.TEXT_NODE) return;
      const currentVal = node.nodeValue || '';
      if (!currentVal.trim()) return;

      // Bỏ qua các thẻ code, script, style, pre, svg
      const parent = node.parentElement;
      if (!parent) return;
      const tag = parent.tagName.toLowerCase();
      if (tag === 'script' || tag === 'style' || tag === 'code' || tag === 'pre' || tag === 'svg') {
        return;
      }

      // Tránh can thiệp khi người dùng đang trực tiếp gõ vào ô nhập liệu
      if (document.activeElement && (document.activeElement === parent || parent.contains(document.activeElement))) {
        if (tag === 'textarea' || tag === 'input' || parent.isContentEditable) {
          return;
        }
      }

      // Lưu trữ giá trị gốc tiếng Việt lần đầu tiên gặp node
      if (!originalNodesMap.current.has(node)) {
        originalNodesMap.current.set(node, currentVal);
      }

      if (language === 'en') {
        const baseText = originalNodesMap.current.get(node) || currentVal;
        const translated = translateSentence(baseText, 'en');
        if (translated !== node.nodeValue) {
          node.nodeValue = translated;
        }
      } else {
        // Khôi phục lại tiếng Việt
        const original = originalNodesMap.current.get(node);
        if (original && node.nodeValue !== original) {
          node.nodeValue = original;
        } else if (!original) {
          const translatedBack = translateSentence(currentVal, 'vi');
          if (translatedBack !== node.nodeValue) {
            node.nodeValue = translatedBack;
          }
        }
      }
    };

    const processAttributes = (el: HTMLElement) => {
      if (!el || !el.getAttribute) return;

      // Placeholder
      const placeholder = el.getAttribute('placeholder');
      if (placeholder) {
        if (language === 'en') {
          if (!el.getAttribute('data-orig-placeholder')) {
            el.setAttribute('data-orig-placeholder', placeholder);
          }
          const translated = translateSentence(placeholder, 'en');
          if (translated !== placeholder) el.setAttribute('placeholder', translated);
        } else {
          const orig = el.getAttribute('data-orig-placeholder');
          if (orig) el.setAttribute('placeholder', orig);
          else {
            const translatedBack = translateSentence(placeholder, 'vi');
            el.setAttribute('placeholder', translatedBack);
          }
        }
      }

      // Title
      const title = el.getAttribute('title');
      if (title) {
        if (language === 'en') {
          if (!el.getAttribute('data-orig-title')) {
            el.setAttribute('data-orig-title', title);
          }
          const translated = translateSentence(title, 'en');
          if (translated !== title) el.setAttribute('title', translated);
        } else {
          const orig = el.getAttribute('data-orig-title');
          if (orig) el.setAttribute('title', orig);
          else {
            const translatedBack = translateSentence(title, 'vi');
            el.setAttribute('title', translatedBack);
          }
        }
      }
    };

    const walkAndTranslate = (root: Node) => {
      if (isTranslatingRef.current) return;
      isTranslatingRef.current = true;

      try {
        const walker = document.createTreeWalker(
          root,
          NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
          null
        );

        let currentNode = walker.nextNode();
        while (currentNode) {
          if (currentNode.nodeType === Node.TEXT_NODE) {
            processTextNode(currentNode);
          } else if (currentNode.nodeType === Node.ELEMENT_NODE) {
            processAttributes(currentNode as HTMLElement);
          }
          currentNode = walker.nextNode();
        }
      } finally {
        isTranslatingRef.current = false;
      }
    };

    // Quét toàn bộ DOM khi thay đổi ngôn ngữ
    walkAndTranslate(document.body);

    // Lắng nghe các thành phần động (Modal, Tab chuyển đổi, Tooltip)
    const observer = new MutationObserver((mutations) => {
      if (isTranslatingRef.current) return;

      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        for (const mutation of mutations) {
          if (mutation.type === 'characterData' && mutation.target) {
            processTextNode(mutation.target);
          } else if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((added) => {
              walkAndTranslate(added);
            });
          }
        }
      }, 40);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      clearTimeout(debounceTimer);
      observer.disconnect();
    };
  }, [language, isMounted]);

  const value = useMemo(
    () => ({ 
      language, 
      setLanguage, 
      toggleLanguage, 
      t, 
      isMounted,
      isEn: language === 'en',
      isVi: language === 'vi'
    }),
    [language, isMounted]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
