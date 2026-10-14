'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useRef } from 'react';

export type Language = 'vi' | 'en';

// BỘ TỪ ĐIỂN DỊCH THUẬT TOÀN DIỆN CHO DỰ ÁN SKYLINE SMART RESIDENCE
export const DICTIONARY: Record<string, { vi: string; en: string }> = {
  // --- Điều hướng & Tiêu đề chính ---
  'nav.home': { vi: 'Trang Chủ', en: 'Home' },
  'nav.about': { vi: 'Giới Thiệu', en: 'About' },
  'nav.apartments': { vi: 'Căn Hộ', en: 'Apartments' },
  'nav.amenities': { vi: 'Tiện Ích', en: 'Amenities' },
  'nav.services': { vi: 'Dịch Vụ', en: 'Services' },
  'nav.login': { vi: 'Đăng Nhập', en: 'Sign In' },
  'nav.logout': { vi: 'Đăng Xuất', en: 'Sign Out' },
  'nav.portal': { vi: 'Cổng Thông Tin', en: 'Portal' },
  'nav.dashboard': { vi: 'Bảng Điều Khiển', en: 'Dashboard' },
  'nav.theme_light': { vi: 'Bật Chế độ Sáng', en: 'Switch to Light Mode' },
  'nav.theme_dark': { vi: 'Bật Chế độ Tối', en: 'Switch to Dark Mode' },

  // --- Landing page sections ---
  'Tổng Quan': { vi: 'Tổng Quan', en: 'Overview' },
  'Mặt Bằng Căn Hộ': { vi: 'Mặt Bằng Căn Hộ', en: 'Floor Plans' },
  'Tiện Ích 5 Sao': { vi: 'Tiện Ích 5 Sao', en: '5-Star Amenities' },
  'Lõi Công Nghệ AI': { vi: 'Lõi Công Nghệ AI', en: 'AI Technology Core' },
  'Hệ Sinh Thái Đỉnh Cao': { vi: 'Hệ Sinh Thái Đỉnh Cao', en: 'Premier Ecosystem' },
  'Trải Nghiệm Chuẩn Sống Thượng Lưu': { vi: 'Trải Nghiệm Chuẩn Sống Thượng Lưu', en: 'Experience Luxury Living' },
  'Xem Chi Tiết Căn Hộ': { vi: 'Xem Chi Tiết Căn Hộ', en: 'View Apartment Details' },
  'Khám Phá Tiện Ích': { vi: 'Khám Phá Tiện Ích', en: 'Explore Amenities' },
  'Đặt Lịch Tham Quan': { vi: 'Đặt Lịch Tham Quan', en: 'Schedule a Tour' },
  'Liên Hệ Ngay': { vi: 'Liên Hệ Ngay', en: 'Contact Now' },

  // --- Phân quyền & Vai trò ---
  'role.admin': { vi: 'Ban Quản Lý', en: 'Management Board' },
  'role.owner': { vi: 'Chủ Hộ', en: 'Apartment Owner' },
  'role.tenant': { vi: 'Khách Thuê', en: 'Tenant' },
  'role.family': { vi: 'Thành Viên Gia Đình', en: 'Family Member' },
  'role.technician': { vi: 'Kỹ Thuật Viên', en: 'Technician' },
  'role.staff': { vi: 'Nhân Sự Ban Quản Lý', en: 'Staff' },
  'role.resident': { vi: 'Cư Dân', en: 'Resident' },
  'BAN QUẢN LÝ': { vi: 'BAN QUẢN LÝ', en: 'MANAGEMENT' },
  'CHỦ HỘ': { vi: 'CHỦ HỘ', en: 'OWNER' },
  'KHÁCH THUÊ': { vi: 'KHÁCH THUÊ', en: 'TENANT' },
  'CƯ DÂN': { vi: 'CƯ DÂN', en: 'RESIDENT' },
  'KỸ THUẬT VIÊN': { vi: 'KỸ THUẬT VIÊN', en: 'TECHNICIAN' },

  // --- Sidebar Menu Tabs (Resident / Admin / Technician) ---
  'Trang Chủ': { vi: 'Trang Chủ', en: 'Home' },
  'Hồ Sơ': { vi: 'Hồ Sơ', en: 'Profile' },
  'Hồ Sơ Cư Dân': { vi: 'Hồ Sơ Cư Dân', en: 'Resident Profile' },
  'Thành Viên': { vi: 'Thành Viên', en: 'Family Members' },
  'Nhà Thông Minh': { vi: 'Nhà Thông Minh', en: 'Smart Home' },
  'Tiện Ích': { vi: 'Tiện Ích', en: 'Amenities' },
  'Dịch Vụ': { vi: 'Dịch Vụ', en: 'Services' },
  'Hóa Đơn': { vi: 'Hóa Đơn', en: 'Billing' },
  'Hóa Đơn Tiện Ích': { vi: 'Hóa Đơn Tiện Ích', en: 'Utility Bills' },
  'Báo Hỏng': { vi: 'Báo Hỏng', en: 'Service Tickets' },
  'Hỗ Trợ Kỹ Thuật': { vi: 'Hỗ Trợ Kỹ Thuật', en: 'Technical Support' },
  'Biểu Quyết': { vi: 'Biểu Quyết', en: 'Voting' },
  'Biểu Quyết Cư Dân': { vi: 'Biểu Quyết Cư Dân', en: 'Resident Voting' },
  'Trợ Lý AI': { vi: 'Trợ Lý AI', en: 'AI Assistant' },
  'Căn Hộ': { vi: 'Căn Hộ', en: 'Apartments' },
  'Xác Thực Cư Dân': { vi: 'Xác Thực Cư Dân', en: 'Resident Verification' },
  'Khách Thăm': { vi: 'Khách Thăm', en: 'Visitors' },
  'Khách Đến Thăm': { vi: 'Khách Đến Thăm', en: 'Visitor Passes' },
  'Sửa Chữa': { vi: 'Sửa Chữa', en: 'Repairs & Tasks' },
  'Thiết Bị': { vi: 'Thiết Bị', en: 'Devices' },
  'Bãi Đỗ Xe': { vi: 'Bãi Đỗ Xe', en: 'Parking' },
  'Khảo Sát': { vi: 'Khảo Sát', en: 'Surveys' },
  'Thẻ Cư Dân': { vi: 'Thẻ Cư Dân', en: 'Resident Pass' },
  'Sổ Tay Cư Dân': { vi: 'Sổ Tay Cư Dân', en: 'Resident Handbook' },

  // --- Topbar & Tìm kiếm & Thông báo ---
  'TÌM NHANH': { vi: 'TÌM NHANH', en: 'QUICK SEARCH' },
  'Tìm kiếm...': { vi: 'Tìm kiếm...', en: 'Search...' },
  'Gợi ý tìm kiếm': { vi: 'Gợi ý tìm kiếm', en: 'Search Suggestions' },
  'Thông Báo Thời Gian Thực': { vi: 'Thông Báo Thời Gian Thực', en: 'Real-time Notifications' },
  'Thông Báo': { vi: 'Thông Báo', en: 'Notifications' },
  'Đổi Mật Khẩu': { vi: 'Đổi Mật Khẩu', en: 'Change Password' },
  'Đăng Xuất': { vi: 'Đăng Xuất', en: 'Sign Out' },
  'Đường Dây Nóng Kỹ Thuật: 1900 8899': { vi: 'Đường Dây Nóng Kỹ Thuật: 1900 8899', en: 'Technical Hotline: 1900 8899' },
  'Hotline An Ninh & Khẩn Cấp 24/7': { vi: 'Hotline An Ninh & Khẩn Cấp 24/7', en: '24/7 Emergency & Security Hotline' },

  // --- Trạng thái (Statuses & Badges) ---
  'status.active': { vi: 'Đang Hoạt Động', en: 'Active' },
  'status.pending': { vi: 'Đang Chờ Phê Duyệt', en: 'Pending Approval' },
  'status.pending_owner': { vi: 'Chờ Chủ Hộ Xác Nhận', en: 'Pending Owner Confirmation' },
  'status.approved': { vi: 'Đã Kích Hoạt Quyền Ra Vào', en: 'Access Granted' },
  'status.rejected': { vi: 'Cần Cập Nhật / Chụp Lại', en: 'Resubmission Required' },
  'status.draft': { vi: 'Bản Nháp Chưa Gửi', en: 'Draft' },
  'status.verified': { vi: 'Đã Xác Thực Căn Cước', en: 'Identity Verified' },

  'Đang Hoạt Động': { vi: 'Đang Hoạt Động', en: 'Active' },
  'Đang Chờ Phê Duyệt': { vi: 'Đang Chờ Phê Duyệt', en: 'Pending Approval' },
  'Chờ Chủ Hộ Xác Nhận': { vi: 'Chờ Chủ Hộ Xác Nhận', en: 'Pending Owner Confirmation' },
  'Chờ Duyệt': { vi: 'Chờ Duyệt', en: 'Pending' },
  'Đã Duyệt': { vi: 'Đã Duyệt', en: 'Approved' },
  'Đã Phê Duyệt': { vi: 'Đã Phê Duyệt', en: 'Approved' },
  'Từ Chối': { vi: 'Từ Chối', en: 'Rejected' },
  'Đã Từ Chối': { vi: 'Đã Từ Chối', en: 'Rejected' },
  'Hoàn Thành': { vi: 'Hoàn Thành', en: 'Completed' },
  'Đang Xử Lý': { vi: 'Đang Xử Lý', en: 'In Progress' },
  'Đã Hủy': { vi: 'Đã Hủy', en: 'Cancelled' },
  'Chưa Thanh Toán': { vi: 'Chưa Thanh Toán', en: 'Unpaid' },
  'Đã Thanh Toán': { vi: 'Đã Thanh Toán', en: 'Paid' },
  'Quá Hạn': { vi: 'Quá Hạn', en: 'Overdue' },
  'Đã Kích Hoạt': { vi: 'Đã Kích Hoạt', en: 'Activated' },
  'Đã Xác Thực': { vi: 'Đã Xác Thực', en: 'Verified' },
  'Chưa Xác Thực': { vi: 'Chưa Xác Thực', en: 'Unverified' },
  'Bản Nháp': { vi: 'Bản Nháp', en: 'Draft' },
  'Hợp Lệ': { vi: 'Hợp Lệ', en: 'Valid' },
  'Hết Hạn': { vi: 'Hết Hạn', en: 'Expired' },

  // --- Thao tác & Nút bấm (Actions) ---
  'Gửi Ban Quản Lý Duyệt': { vi: 'Gửi Ban Quản Lý Duyệt', en: 'Submit to Management' },
  'Gửi Lại Ban Quản Lý Duyệt': { vi: 'Gửi Lại Ban Quản Lý Duyệt', en: 'Resubmit to Management' },
  'Gửi Yêu Cầu': { vi: 'Gửi Yêu Cầu', en: 'Submit Request' },
  'Xác Nhận & Kích Hoạt': { vi: 'Xác Nhận & Kích Hoạt', en: 'Approve & Activate' },
  'Xác Nhận': { vi: 'Xác Nhận', en: 'Confirm' },
  'Yêu Cầu Bổ Sung': { vi: 'Yêu Cầu Bổ Sung', en: 'Request Rescan' },
  'Kiểm Tra Đối Chiếu': { vi: 'Kiểm Tra Đối Chiếu', en: 'Inspect & Compare' },
  'Tạm Khóa / Thu Hồi Quyền': { vi: 'Tạm Khóa / Thu Hồi Quyền', en: 'Revoke Access' },
  'Làm Mới': { vi: 'Làm Mới', en: 'Refresh' },
  'Đóng': { vi: 'Đóng', en: 'Close' },
  'Lưu Thay Đổi': { vi: 'Lưu Thay Đổi', en: 'Save Changes' },
  'Lưu lại': { vi: 'Lưu lại', en: 'Save' },
  'Hủy Bỏ': { vi: 'Hủy Bỏ', en: 'Cancel' },
  'Hủy': { vi: 'Hủy', en: 'Cancel' },
  'Quay Lại': { vi: 'Quay Lại', en: 'Go Back' },
  'Tiếp Tục': { vi: 'Tiếp Tục', en: 'Continue' },
  'Xem Chi Tiết': { vi: 'Xem Chi Tiết', en: 'View Details' },
  'Chi Tiết': { vi: 'Chi Tiết', en: 'Details' },
  'Chỉnh Sửa': { vi: 'Chỉnh Sửa', en: 'Edit' },
  'Xóa': { vi: 'Xóa', en: 'Delete' },
  'Thêm Mới': { vi: 'Thêm Mới', en: 'Add New' },
  'Thêm Thành Viên': { vi: 'Thêm Thành Viên', en: 'Add Family Member' },
  'Tạo Mã Khách': { vi: 'Tạo Mã Khách', en: 'Create Visitor Pass' },
  'Thanh Toán Ngay': { vi: 'Thanh Toán Ngay', en: 'Pay Now' },
  'Tải Hóa Đơn': { vi: 'Tải Hóa Đơn', en: 'Download Bill' },
  'Tạo Yêu Cầu Mới': { vi: 'Tạo Yêu Cầu Mới', en: 'Create New Ticket' },
  'Tham Gia Biểu Quyết': { vi: 'Tham Gia Biểu Quyết', en: 'Vote Now' },
  'Đặt Tiện Ích': { vi: 'Đặt Tiện Ích', en: 'Book Amenity' },
  'Bật': { vi: 'Bật', en: 'On' },
  'Tắt': { vi: 'Tắt', en: 'Off' },

  // --- Xác thực & e-KYC (FaceID & CCCD) ---
  'Nhận Diện Khuôn Mặt (FaceID)': { vi: 'Nhận Diện Khuôn Mặt (FaceID)', en: 'FaceID Biometric Recognition' },
  'Quét Khuôn Mặt Ngay': { vi: 'Quét Khuôn Mặt Ngay', en: 'Scan Face Now' },
  'Chụp Lại Khuôn Mặt': { vi: 'Chụp Lại Khuôn Mặt', en: 'Rescan Face' },
  'Xác Thực Độ Sống Người Thật': { vi: 'Xác Thực Độ Sống Người Thật', en: 'Liveness Anti-Spoofing Check' },
  'Thu Thập Mẫu Khuôn Mặt': { vi: 'Thu Thập Mẫu Khuôn Mặt', en: 'FaceID Enrollment' },
  'Quét Thẻ Căn Cước Công Dân': { vi: 'Quét Thẻ Căn Cước Công Dân', en: 'Scan Citizen ID Card' },
  'Chụp Lại Căn Cước': { vi: 'Chụp Lại Căn Cước', en: 'Rescan ID Card' },
  'Mặt Trước Thẻ CCCD': { vi: 'Mặt Trước Thẻ CCCD', en: 'Front Side ID Card' },
  'Mặt Sau Thẻ CCCD': { vi: 'Mặt Sau Thẻ CCCD', en: 'Back Side ID Card' },
  'Số Căn Cước Công Dân': { vi: 'Số Căn Cước Công Dân', en: 'Citizen ID Number' },
  'Số CCCD': { vi: 'Số CCCD', en: 'Citizen ID' },
  'Ngày Cấp': { vi: 'Ngày Cấp', en: 'Issued Date' },
  'Nơi Cấp': { vi: 'Nơi Cấp', en: 'Issued Place' },
  'Họ và Tên': { vi: 'Họ và Tên', en: 'Full Name' },
  'Họ tên': { vi: 'Họ tên', en: 'Full name' },
  'Số Điện Thoại': { vi: 'Số Điện Thoại', en: 'Phone Number' },
  'Số điện thoại': { vi: 'Số điện thoại', en: 'Phone number' },
  'Email': { vi: 'Email', en: 'Email' },
  'Địa chỉ': { vi: 'Địa chỉ', en: 'Address' },
  'Ngày Sinh': { vi: 'Ngày Sinh', en: 'Date of Birth' },
  'Ngày sinh': { vi: 'Ngày sinh', en: 'Date of birth' },
  'Giới Tính': { vi: 'Giới Tính', en: 'Gender' },
  'Giới tính': { vi: 'Giới tính', en: 'Gender' },
  'Nam': { vi: 'Nam', en: 'Male' },
  'Nữ': { vi: 'Nữ', en: 'Female' },
  'Quốc Tịch': { vi: 'Quốc Tịch', en: 'Nationality' },
  'Mối Quan Hệ': { vi: 'Mối Quan Hệ', en: 'Relationship' },
  'Chủ hộ': { vi: 'Chủ hộ', en: 'Apartment Owner' },
  'Vợ': { vi: 'Vợ', en: 'Wife' },
  'Chồng': { vi: 'Chồng', en: 'Husband' },
  'Con': { vi: 'Con', en: 'Child' },
  'Bố': { vi: 'Bố', en: 'Father' },
  'Mẹ': { vi: 'Mẹ', en: 'Mother' },
  'Người thuê': { vi: 'Người thuê', en: 'Tenant' },

  // --- Căn hộ & Tòa nhà ---
  'Mã Căn Hộ': { vi: 'Mã Căn Hộ', en: 'Apartment Code' },
  'Số Căn Hộ': { vi: 'Số Căn Hộ', en: 'Apartment Number' },
  'Tòa Nhà': { vi: 'Tòa Nhà', en: 'Building' },
  'Tầng': { vi: 'Tầng', en: 'Floor' },
  'Diện Tích': { vi: 'Diện Tích', en: 'Area' },
  'Phòng Ngủ': { vi: 'Phòng Ngủ', en: 'Bedrooms' },
  'Phòng Tắm': { vi: 'Phòng Tắm', en: 'Bathrooms' },

  // --- Nhà thông minh (Smart Home) ---
  'Phòng Khách': { vi: 'Phòng Khách', en: 'Living Room' },
  'Phòng Ngủ Master': { vi: 'Phòng Ngủ Master', en: 'Master Bedroom' },
  'Phòng Bếp': { vi: 'Phòng Bếp', en: 'Kitchen' },
  'Ban Công': { vi: 'Ban Công', en: 'Balcony' },
  'Đèn Phòng Khách': { vi: 'Đèn Phòng Khách', en: 'Living Room Light' },
  'Máy Lạnh': { vi: 'Máy Lạnh', en: 'Air Conditioner' },
  'Rèm Cửa': { vi: 'Rèm Cửa', en: 'Smart Curtains' },
  'Bình Nước Nóng': { vi: 'Bình Nước Nóng', en: 'Water Heater' },
  'Khóa Cửa Điện Tử': { vi: 'Khóa Cửa Điện Tử', en: 'Smart Lock' },
  'Cảm Biến Khói': { vi: 'Cảm Biến Khói', en: 'Smoke Sensor' },
  'Cảm Biến Chuyển Động': { vi: 'Cảm Biến Chuyển Động', en: 'Motion Sensor' },
  'Nhiệt Độ': { vi: 'Nhiệt Độ', en: 'Temperature' },
  'Độ Ẩm': { vi: 'Độ Ẩm', en: 'Humidity' },
  'Chất Lượng Không Khí': { vi: 'Chất Lượng Không Khí', en: 'Air Quality' },

  // --- Tiện ích & Dịch vụ (Facilities) ---
  'Hồ Bơi Vô Cực': { vi: 'Hồ Bơi Vô Cực', en: 'Infinity Pool' },
  'Phòng Gym & Yoga': { vi: 'Phòng Gym & Yoga', en: 'Gym & Yoga' },
  'Khu Vườn BBQ': { vi: 'Khu Vườn BBQ', en: 'BBQ Garden' },
  'Sân Tennis': { vi: 'Sân Tennis', en: 'Tennis Court' },
  'Khu Vui Chơi Trẻ Em': { vi: 'Khu Vui Chơi Trẻ Em', en: 'Kids Playground' },
  'Phòng Sinh Hoạt Cộng Đồng': { vi: 'Phòng Sinh Hoạt Cộng Đồng', en: 'Community Hall' },
  'Phòng Xông Hơi VIP': { vi: 'Phòng Xông Hơi VIP', en: 'VIP Sauna Room' },
  'Giờ Mở Cửa': { vi: 'Giờ Mở Cửa', en: 'Opening Hours' },
  'Đặt Chỗ Ngay': { vi: 'Đặt Chỗ Ngay', en: 'Book Now' },
  'Số Lượng Khách': { vi: 'Số Lượng Khách', en: 'Number of Guests' },
  'Khung Giờ': { vi: 'Khung Giờ', en: 'Time Slot' },
  'Ngày Đặt': { vi: 'Ngày Đặt', en: 'Booking Date' },

  // --- Tài chính & Hóa đơn (Billing) ---
  'Phí Quản Lý': { vi: 'Phí Quản Lý', en: 'Management Fee' },
  'Tiền Điện': { vi: 'Tiền Điện', en: 'Electricity Bill' },
  'Tiền Nước': { vi: 'Tiền Nước', en: 'Water Bill' },
  'Phí Gửi Xe Ô Tô': { vi: 'Phí Gửi Xe Ô Tô', en: 'Car Parking Fee' },
  'Phí Gửi Xe Máy': { vi: 'Phí Gửi Xe Máy', en: 'Motorbike Parking Fee' },
  'Tổng Tiền Cần Thanh Toán': { vi: 'Tổng Tiền Cần Thanh Toán', en: 'Total Amount Due' },
  'Tổng Thanh Toán': { vi: 'Tổng Thanh Toán', en: 'Total Payment' },
  'Tổng Cộng': { vi: 'Tổng Cộng', en: 'Grand Total' },
  'Hạn Thanh Toán': { vi: 'Hạn Thanh Toán', en: 'Payment Due Date' },
  'Kỳ Thu': { vi: 'Kỳ Thu', en: 'Billing Cycle' },
  'Mã Giao Dịch': { vi: 'Mã Giao Dịch', en: 'Transaction ID' },
  'Phương Thức Thanh Toán': { vi: 'Phương Thức Thanh Toán', en: 'Payment Method' },
  'Quét Mã QR VNPay': { vi: 'Quét Mã QR VNPay', en: 'Scan VNPay QR' },
  'Chuyển Khoản Ngân Hàng': { vi: 'Chuyển Khoản Ngân Hàng', en: 'Bank Transfer' },
  'Lịch Sử Giao Dịch': { vi: 'Lịch Sử Giao Dịch', en: 'Transaction History' },

  // --- Báo hỏng & Kỹ thuật (Tickets) ---
  'Tiêu Đề Sự Cố': { vi: 'Tiêu Đề Sự Cố', en: 'Issue Title' },
  'Mô Tả Chi Tiết': { vi: 'Mô Tả Chi Tiết', en: 'Detailed Description' },
  'Khu Vực': { vi: 'Khu Vực', en: 'Area / Location' },
  'Mức Độ Ưu Tiên': { vi: 'Mức Độ Ưu Tiên', en: 'Priority' },
  'Khẩn Cấp': { vi: 'Khẩn Cấp', en: 'Urgent' },
  'Cao': { vi: 'Cao', en: 'High' },
  'Bình Thường': { vi: 'Bình Thường', en: 'Normal' },
  'Thấp': { vi: 'Thấp', en: 'Low' },
  'Kỹ Thuật Phụ Trách': { vi: 'Kỹ Thuật Phụ Trách', en: 'Assigned Technician' },
  'Thời Gian Tiếp Nhận': { vi: 'Thời Gian Tiếp Nhận', en: 'Received Time' },

  // --- Khách thăm & Ra vào (Visitor) ---
  'Tên Khách': { vi: 'Tên Khách', en: 'Guest Name' },
  'Biển Số Xe': { vi: 'Biển Số Xe', en: 'License Plate' },
  'Thời Gian Đến': { vi: 'Thời Gian Đến', en: 'Arrival Time' },
  'Thời Gian Hết Hạn': { vi: 'Thời Gian Hết Hạn', en: 'Expiry Time' },
  'Mục Đích Đến': { vi: 'Mục Đích Đến', en: 'Purpose of Visit' },
  'Mã PIN Ra Vào': { vi: 'Mã PIN Ra Vào', en: 'Access PIN' },
  'Mã QR Ra Vào': { vi: 'Mã QR Ra Vào', en: 'Access QR Code' },
  'Chia Sẻ Mã Khách': { vi: 'Chia Sẻ Mã Khách', en: 'Share Guest Pass' },

  // --- Đăng nhập & Xác thực tài khoản ---
  'Tài Khoản': { vi: 'Tài Khoản', en: 'Account' },
  'Mật Khẩu': { vi: 'Mật Khẩu', en: 'Password' },
  'Mật Khẩu Hiện Tại': { vi: 'Mật Khẩu Hiện Tại', en: 'Current Password' },
  'Mật Khẩu Mới': { vi: 'Mật Khẩu Mới', en: 'New Password' },
  'Xác Nhận Mật Khẩu Mới': { vi: 'Xác Nhận Mật Khẩu Mới', en: 'Confirm New Password' },
  'Quên Mật Khẩu?': { vi: 'Quên Mật Khẩu?', en: 'Forgot Password?' },
  'Ghi Nhớ Đăng Nhập': { vi: 'Ghi Nhớ Đăng Nhập', en: 'Remember Me' },
  'Đăng Nhập Bằng FaceID': { vi: 'Đăng Nhập Bằng FaceID', en: 'Sign In with FaceID' },
  'Đăng Nhập Bằng Mã OTP': { vi: 'Đăng Nhập Bằng Mã OTP', en: 'Sign In with OTP' },
  'Đăng Nhập Tài Khoản': { vi: 'Đăng Nhập Tài Khoản', en: 'Account Login' },
  'Vui lòng nhập tên đăng nhập hoặc email': { vi: 'Vui lòng nhập tên đăng nhập hoặc email', en: 'Please enter username or email' },
  'Vui lòng nhập mật khẩu': { vi: 'Vui lòng nhập mật khẩu', en: 'Please enter password' },

  // --- Chung cư & Hotline ---
  'brand.name': { vi: 'Chung Cư Thông Minh Skyline', en: 'Skyline Smart Residence' },
  'brand.hotline': { vi: 'Đường Dây Nóng Kỹ Thuật: 1900 8899', en: 'Technical Hotline: 1900 8899' },
  'Chung Cư Thông Minh Skyline': { vi: 'Chung Cư Thông Minh Skyline', en: 'Skyline Smart Residence' },
  'Tòa BS-07, Phân Khu Beverly Solari': { vi: 'Tòa BS-07, Phân Khu Beverly Solari', en: 'Tower BS-07, Beverly Solari Precinct' },
  'Bản quyền thuộc về': { vi: 'Bản quyền thuộc về', en: 'Copyright by' },
  'Đã đăng ký bản quyền.': { vi: 'Đã đăng ký bản quyền.', en: 'All rights reserved.' },
};

// Chuẩn bị danh sách phrase dịch thuật tối ưu hóa theo độ dài giảm dần
const TRANSLATION_PAIRS: Array<{ vi: string; en: string }> = Object.values(DICTIONARY)
  .filter((item) => item.vi && item.en && item.vi !== item.en)
  .sort((a, b) => b.vi.length - a.vi.length);

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (keyOrText: string, fallback?: string) => string;
  isMounted: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('vi');
  const [isMounted, setIsMounted] = useState(false);
  const originalNodesMap = useRef<WeakMap<Node, string>>(new WeakMap());
  const isTranslatingRef = useRef(false);

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

  // Hàm dịch trực tiếp theo key hoặc phrase
  const t = (keyOrText: string, fallback?: string): string => {
    if (!keyOrText) return '';
    const trimmed = keyOrText.trim();

    // 1. Check exact key in DICTIONARY
    if (DICTIONARY[keyOrText] && DICTIONARY[keyOrText][language]) {
      return DICTIONARY[keyOrText][language];
    }

    // 2. Check exact trimmed text in DICTIONARY
    if (DICTIONARY[trimmed] && DICTIONARY[trimmed][language]) {
      return DICTIONARY[trimmed][language];
    }

    // 3. Reverse search if language is 'vi' but user passed English or vice versa
    for (const entry of Object.values(DICTIONARY)) {
      if (entry.vi.toLowerCase() === trimmed.toLowerCase()) {
        return language === 'en' ? entry.en : entry.vi;
      }
      if (entry.en.toLowerCase() === trimmed.toLowerCase()) {
        return language === 'vi' ? entry.vi : entry.en;
      }
    }

    return fallback || keyOrText;
  };

  // Live non-destructive DOM translation engine
  useEffect(() => {
    if (typeof window === 'undefined' || !isMounted) return;

    const translateTextContent = (text: string): string => {
      const trimmed = text.trim();
      if (!trimmed) return text;

      // 1. Direct match in dictionary
      if (DICTIONARY[trimmed]) {
        const translated = DICTIONARY[trimmed].en;
        return text.replace(trimmed, translated);
      }

      // 2. Phrase matching from sorted phrases
      let result = text;
      for (const pair of TRANSLATION_PAIRS) {
        if (result.includes(pair.vi)) {
          result = result.split(pair.vi).join(pair.en);
        }
      }
      return result;
    };

    const processNode = (node: Node) => {
      if (!node) return;

      // Skip script, style, code, pre tags
      const parentName = node.parentElement?.tagName?.toLowerCase();
      if (parentName === 'script' || parentName === 'style' || parentName === 'code' || parentName === 'pre') {
        return;
      }

      // Process Text Node
      if (node.nodeType === Node.TEXT_NODE) {
        const currentVal = node.nodeValue || '';
        if (!currentVal.trim()) return;

        if (language === 'en') {
          if (!originalNodesMap.current.has(node)) {
            originalNodesMap.current.set(node, currentVal);
          }
          const translated = translateTextContent(currentVal);
          if (translated !== currentVal) {
            node.nodeValue = translated;
          }
        } else {
          // Restore original Vietnamese text
          if (originalNodesMap.current.has(node)) {
            const original = originalNodesMap.current.get(node);
            if (original && node.nodeValue !== original) {
              node.nodeValue = original;
            }
          }
        }
      }

      // Process input/button placeholder & title attributes
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const placeholder = el.getAttribute('placeholder');
        if (placeholder) {
          if (language === 'en') {
            if (!el.getAttribute('data-orig-placeholder')) {
              el.setAttribute('data-orig-placeholder', placeholder);
            }
            const translated = translateTextContent(placeholder);
            if (translated !== placeholder) el.setAttribute('placeholder', translated);
          } else {
            const orig = el.getAttribute('data-orig-placeholder');
            if (orig) el.setAttribute('placeholder', orig);
          }
        }

        const title = el.getAttribute('title');
        if (title) {
          if (language === 'en') {
            if (!el.getAttribute('data-orig-title')) {
              el.setAttribute('data-orig-title', title);
            }
            const translated = translateTextContent(title);
            if (translated !== title) el.setAttribute('title', translated);
          } else {
            const orig = el.getAttribute('data-orig-title');
            if (orig) el.setAttribute('title', orig);
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
          processNode(currentNode);
          currentNode = walker.nextNode();
        }
      } finally {
        isTranslatingRef.current = false;
      }
    };

    // Initial translation pass on current page DOM
    walkAndTranslate(document.body);

    // Setup MutationObserver for dynamic React components, modals, and tabs
    const observer = new MutationObserver((mutations) => {
      if (isTranslatingRef.current) return;

      for (const mutation of mutations) {
        if (mutation.type === 'characterData' && mutation.target) {
          processNode(mutation.target);
        } else if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((added) => {
            walkAndTranslate(added);
          });
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      observer.disconnect();
    };
  }, [language, isMounted]);

  const value = useMemo(
    () => ({ language, setLanguage, toggleLanguage, t, isMounted }),
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
