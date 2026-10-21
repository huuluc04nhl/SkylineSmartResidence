'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useRef } from 'react';
import { TRANSLATIONS_DATA } from './translationsData';

export type Language = 'vi' | 'en';

// =============================================================================
// CORE KEY DICTIONARY & GLOSSARY
// =============================================================================
export const KEY_DICTIONARY: Record<string, Record<Language, string>> = {
  'nav.home': { vi: 'Trang Chủ', en: 'Home' },
  'nav.about': { vi: 'Tổng Quan', en: 'Overview' },
  'nav.concept': { vi: 'Triết Lý Thiết Kế', en: 'Concept' },
  'nav.apartments': { vi: 'Mặt Bằng Căn Hộ', en: 'Apartment Layout' },
  'nav.amenities': { vi: 'Tiện Ích 5 Sao', en: '5-Star Amenities' },
  'nav.services': { vi: 'Lõi Công Nghệ AI', en: 'AI Technology' },
  'nav.login': { vi: 'Đăng Nhập', en: 'Sign In' },
  'nav.logout': { vi: 'Đăng Xuất', en: 'Sign Out' },
  'nav.portal': { vi: 'Cổng Cư Dân', en: 'Resident Portal' },
  'nav.dashboard': { vi: 'Vào Bảng Điều Khiển', en: 'Go to Dashboard' },
  'role.admin': { vi: 'Ban Quản Lý', en: 'Management Board' },
  'role.owner': { vi: 'Chủ Hộ Căn Hộ', en: 'Apartment Owner' },
  'role.tenant': { vi: 'Người Nhà', en: 'Family Member' },
  'role.family': { vi: 'Người Nhà Căn Hộ', en: 'Family Member' },
  'role.technician': { vi: 'Kỹ Thuật Viên', en: 'Technician' },
  'role.staff': { vi: 'Nhân Sự Ban Quản Lý', en: 'Staff' },
  'role.resident': { vi: 'Cư Dân', en: 'Resident' },
  'ADMIN': { vi: 'Ban Quản Lý', en: 'Management Board' },
  'OWNER': { vi: 'Chủ Hộ', en: 'Apartment Owner' },
  'TENANT': { vi: 'Người Nhà', en: 'Family Member' },
  'FAMILY': { vi: 'Người Nhà', en: 'Family Member' },
  'TECHNICIAN': { vi: 'Kỹ Thuật Viên', en: 'Technician' },
  'Chủ Hộ': { vi: 'Chủ Hộ', en: 'Apartment Owner' },
  'Chủ Hộ Căn Hộ': { vi: 'Chủ Hộ Căn Hộ', en: 'Apartment Owner' },
  'Chủ Hộ (Master)': { vi: 'Chủ Hộ (Master)', en: 'Apartment Owner (Master)' },
  'Người Nhà': { vi: 'Người Nhà', en: 'Family Member' },
  'Người Nhà Căn Hộ': { vi: 'Người Nhà Căn Hộ', en: 'Family Member' },
  'Thành Viên': { vi: 'Người Nhà', en: 'Family Member' },
  'Khách Thuê': { vi: 'Người Nhà', en: 'Family Member' },
  'Ban Quản Lý': { vi: 'Ban Quản Lý', en: 'Management Board' },
  'Kỹ Thuật Viên': { vi: 'Kỹ Thuật Viên', en: 'Technician' },
  'Cư Dân': { vi: 'Cư Dân', en: 'Resident' },
  'Diễn Đàn & Biểu Quyết': { vi: 'Diễn Đàn & Biểu Quyết', en: 'Forum & Voting' },
  'Diễn Đàn Cư Dân': { vi: 'Diễn Đàn Cư Dân', en: 'Resident Forum' },
  'Diễn Đàn': { vi: 'Diễn Đàn', en: 'Community Forum' },
  'Biểu Quyết': { vi: 'Biểu Quyết', en: 'Voting & Surveys' },
  'Phân Hệ Cư Dân': { vi: 'Phân Hệ Cư Dân', en: 'Resident Portal' },
  'Đổi Mật Khẩu': { vi: 'Đổi Mật Khẩu', en: 'Change Password' },
  'Đổi Mật Khẩu Cá Nhân': { vi: 'Đổi Mật Khẩu Cá Nhân', en: 'Change Personal Password' },
  'Hồ Sơ Cư Dân': { vi: 'Hồ Sơ Cư Dân', en: 'Resident Profile' },
  'Hồ Sơ Cá Nhân & e-KYC': { vi: 'Hồ Sơ Cá Nhân & e-KYC', en: 'Personal Profile & e-KYC' },
  'Đăng Xuất Tài Khoản': { vi: 'Đăng Xuất Tài Khoản', en: 'Sign Out Account' },
  'Đăng Xuất': { vi: 'Đăng Xuất', en: 'Sign Out' },
  '1PN': { vi: '1 Phòng Ngủ', en: '1 Bedroom' },
  '2PN': { vi: '2 Phòng Ngủ', en: '2 Bedrooms' },
  '3PN': { vi: '3 Phòng Ngủ', en: '3 Bedrooms' },
  'DUPLEX': { vi: 'Duplex Thông Tầng', en: 'Duplex Penthouse' },
  'Studio': { vi: 'Căn Hộ Studio', en: 'Studio Apartment' },
  'CỔNG TỰ ĐỘNG': { vi: 'CỔNG TỰ ĐỘNG', en: 'AUTOMATED TURNSTILE' },
  'CẦN ĐẶT LỊCH': { vi: 'CẦN ĐẶT LỊCH', en: 'BOOKING REQUIRED' },
  'Mật độ hiện tại:': { vi: 'Mật độ hiện tại:', en: 'Current Density:' },
  'Môi trường:': { vi: 'Môi trường:', en: 'Environment:' },
  'Biểu phí:': { vi: 'Biểu phí:', en: 'Fee Schedule:' },
  'Xem thông số căn hộ': { vi: 'Xem thông số căn hộ', en: 'View Apartment Specs' },
  'Mở Chi Tiết Căn Hộ': { vi: 'Mở Chi Tiết Căn Hộ', en: 'Open Apartment Details' },
  'Chi Tiết': { vi: 'Chi Tiết', en: 'Details' },
  '1 chưa nộp': { vi: '1 chưa nộp', en: '1 unpaid' },
  'chưa nộp': { vi: 'chưa nộp', en: 'unpaid' },
  'Chủ hộ:': { vi: 'Chủ hộ:', en: 'Owner:' },
  'Biểu Quyết & Khảo Sát': { vi: 'Biểu Quyết & Khảo Sát', en: 'Voting & Surveys' },
  'Biểu Quyết & Poll': { vi: 'Biểu Quyết & Khảo Sát', en: 'Voting & Surveys' },
  'Tất Cả Bài Viết': { vi: 'Tất Cả Bài Viết', en: 'All Posts' },
  'Thông Báo BQL': { vi: 'Thông Báo BQL', en: 'Management Notices' },
  'Rao Vặt & Đồ Cũ': { vi: 'Rao Vặt & Đồ Cũ', en: 'Classifieds & Flea Market' },
  'Thảo Luận Cư Dân': { vi: 'Thảo Luận Cư Dân', en: 'Resident Discussion' },
  'Báo Cáo Cảm Xúc AI': { vi: 'Báo Cáo Cảm Xúc AI', en: 'AI Sentiment Report' },
  'Đăng Bài / Tạo Thăm Dò': { vi: 'Đăng Bài / Tạo Thăm Dò', en: 'Create Post / Poll' },
  'Tổng Bài Viết': { vi: 'Tổng Bài Viết', en: 'Total Posts' },
  'Biểu Quyết Đang Mở': { vi: 'Biểu Quyết Đang Mở', en: 'Active Polls' },
  'Lượt Thảo Luận': { vi: 'Lượt Thảo Luận', en: 'Total Comments' },
  'AI Cảm Xúc Hài Lòng': { vi: 'AI Cảm Xúc Hài Lòng', en: 'AI Sentiment Satisfaction' },
  'Cộng Đồng Cư Dân 5 Sao • The Tropical Beverly Solari': { vi: 'Cộng Đồng Cư Dân 5 Sao • The Tropical Beverly Solari', en: '5-Star Resident Community • The Tropical Beverly Solari' },
  'Diễn Đàn & Biểu Quyết Cư Dân SKYLINE': { vi: 'Diễn Đàn & Biểu Quyết Cư Dân SKYLINE', en: 'SKYLINE Resident Forum & Voting' },
  '18 (Tốt)': { vi: '18 (Tốt)', en: '18 (Good)' },
  'An Toàn': { vi: 'An Toàn', en: 'Secure' },
  'Đang Mở': { vi: 'Đang Mở', en: 'Open' },
  'Nhiệt Độ': { vi: 'Nhiệt Độ', en: 'Temperature' },
  'Chất Lượng AQI': { vi: 'Chất Lượng AQI', en: 'Air Quality (AQI)' },
  'Khóa Cửa': { vi: 'Khóa Cửa', en: 'Door Lock' },
  'Điện Năng': { vi: 'Điện Năng', en: 'Energy Usage' },
  'Ngữ Cảnh 1-Chạm': { vi: 'Ngữ Cảnh 1-Chạm', en: '1-Touch Scenes' },
  'Chạm để kích hoạt tức thì': { vi: 'Chạm để kích hoạt tức thì', en: 'Tap for instant activation' },
  'Về Nhà': { vi: 'Về Nhà', en: 'Arrive Home' },
  'Đi Ngủ': { vi: 'Đi Ngủ', en: 'Bedtime' },
  'Đi Vắng': { vi: 'Đi Vắng', en: 'Away' },
  'Xem Phim': { vi: 'Xem Phim', en: 'Cinema Mode' },
  'Đèn bật, AC 24°C, mở rèm': { vi: 'Đèn bật, AC 24°C, mở rèm', en: 'Lights ON, AC 24°C, curtains open' },
  'AC 26°C, rèm đóng, khóa': { vi: 'AC 26°C, rèm đóng, khóa', en: 'AC 26°C, curtains closed, locked' },
  'Ngắt điện, khóa 2 lớp': { vi: 'Ngắt điện, khóa 2 lớp', en: 'Power off, dual deadbolt locked' },
  'Đèn vàng dịu, rèm kín': { vi: 'Đèn vàng dịu, rèm kín', en: 'Warm ambient lights, curtains drawn' },
  '1. Thông Tin Cá Nhân': { vi: '1. Thông Tin Cá Nhân', en: '1. Personal Profile' },
  '2. Căn Cước & FaceID': { vi: '2. Căn Cước & FaceID', en: '2. ID & FaceID' },
  '3. Đổi Mật Khẩu': { vi: '3. Đổi Mật Khẩu', en: '3. Change Password' },
  'Thông Tin Cá Nhân': { vi: 'Thông Tin Cá Nhân', en: 'Personal Profile' },
  'Căn Cước & FaceID': { vi: 'Căn Cước & FaceID', en: 'ID & FaceID' },
  'Chờ BQL Duyệt': { vi: 'Chờ BQL Duyệt', en: 'Pending Management Review' },
  'Chờ Chủ Hộ Duyệt': { vi: 'Chờ Chủ Hộ Duyệt', en: 'Pending Owner Approval' },
  'FaceID Kích Hoạt': { vi: 'FaceID Kích Hoạt', en: 'FaceID Activated' },
  'Đã Xác Thực Căn Cước ✓': { vi: 'Đã Xác Thực Căn Cước ✓', en: 'Citizen ID Verified ✓' },
  'Yêu Cầu Chụp Lại': { vi: 'Yêu Cầu Chụp Lại', en: 'Reshoot Required' },
  'Chưa Gửi Hồ Sơ': { vi: 'Chưa Gửi Hồ Sơ', en: 'Dossier Not Submitted' },
  'Căn Cước (CCCD) & Khuôn Mặt': { vi: 'Căn Cước (CCCD) & Khuôn Mặt', en: 'National ID (CCCD) & Face Biometrics' },
  'Sinh Trắc FaceID (4 Bước)': { vi: 'Sinh Trắc FaceID (4 Bước)', en: 'FaceID Biometrics (4 Steps)' },
  '1. Thẻ Căn Cước Công Dân (CCCD)': { vi: '1. Thẻ Căn Cước Công Dân (CCCD)', en: '1. Citizen Identity Card (CCCD)' },
  'Đổi Ảnh Thẻ': { vi: 'Đổi Ảnh Thẻ', en: 'Change Card Photo' },
  'Chụp / Tải Ảnh Thẻ': { vi: 'Chụp / Tải Ảnh Thẻ', en: 'Capture / Upload Card' },
  'Xem Thẻ': { vi: 'Xem Thẻ', en: 'View Card' },
  'BQL Đã Phê Duyệt': { vi: 'BQL Đã Phê Duyệt', en: 'Management Approved' },
  'Đã Kích Hoạt 4/4 Mẫu': { vi: 'Đã Kích Hoạt 4/4 Mẫu', en: 'Activated 4/4 Samples' },
  'Đã Kích Hoạt Quyền FaceID': { vi: 'Đã Kích Hoạt Quyền FaceID', en: 'FaceID Access Activated' },
  'Thẻ Cư Dân Đã Kích Hoạt': { vi: 'Thẻ Cư Dân Đã Kích Hoạt', en: 'Resident Pass Activated' },
  'Thẻ Cư Dân Điện Tử Skyline': { vi: 'Thẻ Cư Dân Điện Tử Skyline', en: 'Skyline Digital Resident Pass' },
  'Tốc độ mở cửa:': { vi: 'Tốc độ mở cửa:', en: 'Door Opening Speed:' },
  'Quyền áp dụng:': { vi: 'Quyền áp dụng:', en: 'Permission to Apply:' },
  'Sảnh đón, thang máy, đăng nhập': { vi: 'Sảnh đón, thang máy, đăng nhập', en: 'Lobby gates, elevators, sign-in' },
  'Instant Update': { vi: 'Cập nhật tức thì', en: 'Instant Update' },
  'Cập nhật tức thì': { vi: 'Cập nhật tức thì', en: 'Instant Update' },
  'Nhận diện AI tự động': { vi: 'Nhận diện AI tự động', en: 'Automated AI Detection' },
  'Số Điện Thoại': { vi: 'Số Điện Thoại', en: 'Phone Number' },
  'Biển Số Xe': { vi: 'Biển Số Xe', en: 'License Plate' },
  'Ghi Chú Căn Hộ': { vi: 'Ghi Chú Căn Hộ', en: 'Apartment Notes' },
  '& Lưu Ý Cho BQL': { vi: '& Lưu Ý Cho BQL', en: '& BQL Remarks' },
  'Liên Hệ (Nhận OTP)': { vi: 'Liên Hệ (Nhận OTP)', en: '(Receive OTP)' },
  'Nhận Hóa Đơn & Thông Báo': { vi: 'Nhận Hóa Đơn & Thông Báo', en: '(Bills & Notices)' },
  'Thường Trú': { vi: 'Thường Trú', en: 'Permanent' },
  'Đăng Ký (Tự Động Mở Cổng Hầm B1)': { vi: 'Đăng Ký (Tự Động Mở Cổng Hầm B1)', en: '(Auto B1 Gate Opening)' },
  'Căn Trống': { vi: 'Căn Trống', en: 'Vacant' },
  'Đã Ở': { vi: 'Đã Ở', en: 'Occupied' },
  'Bảo Trì': { vi: 'Bảo Trì', en: 'Maintenance' },
  'Tài Chính • Kế Toán': { vi: 'Tài Chính • Kế Toán', en: 'Finance & Accounting' },
  'Tài Chính • Căn': { vi: 'Tài Chính • Căn', en: 'Finance • Apartment' },
  'Sổ Cái Thu Phí Dịch Vụ': { vi: 'Sổ Cái Thu Phí Dịch Vụ', en: 'Service Fee Ledger' },
  'căn hộ đã nộp': { vi: 'căn hộ đã nộp', en: 'paid apartments' },
  'căn hộ chưa nộp': { vi: 'căn hộ chưa nộp', en: 'unpaid apartments' },
  'Thông Tin Cá Nhân & Định Danh': { vi: 'Thông Tin Cá Nhân & Định Danh', en: 'Personal Profile & Identification' },
  'Hồ sơ định danh pháp lý và bảo mật tài khoản': { vi: 'Hồ sơ định danh pháp lý và bảo mật tài khoản', en: 'Legal identity profile and account security' },
  'Đổi Ảnh': { vi: 'Đổi Ảnh', en: 'Change Photo' },
  'Chưa cập nhật họ tên': { vi: 'Chưa cập nhật họ tên', en: 'Full name not updated' },
  'Chưa có': { vi: 'Chưa có', en: 'None' },
  'SĐT': { vi: 'SĐT', en: 'Phone' },
  'Biển': { vi: 'Biển', en: 'Plate' },
  'Chạm ảnh để đổi ảnh đại diện cá nhân • Mở cửa sảnh dùng FaceID ở Tab 2': { vi: 'Chạm ảnh để đổi ảnh đại diện cá nhân • Mở cửa sảnh dùng FaceID ở Tab 2', en: 'Tap photo to change personal avatar • Use FaceID at Tab 2 for lobby access' },
  'Chạm ảnh để đổi avatar cá nhân': { vi: 'Chạm ảnh để đổi avatar cá nhân', en: 'Tap photo to change avatar' },
  'Đang tải thông tin hồ sơ...': { vi: 'Đang tải thông tin hồ sơ...', en: 'Loading profile data...' },
  'Nhà Thông Minh • App Cư Dân': { vi: 'Nhà Thông Minh • App Cư Dân', en: 'Smart Home • Resident App' },
  'Chung Cư BS-07': { vi: 'Chung Cư BS-07', en: 'BS-07 Residence' },
  'Tầng 30': { vi: 'Tầng 30', en: 'Floor 30' },
  'Trực Tuyến 24/7': { vi: 'Trực Tuyến 24/7', en: 'Online 24/7' },
  'Thiết Bị & Phòng': { vi: 'Thiết Bị & Phòng', en: 'Devices & Rooms' },
  'Thiết Bị': { vi: 'Thiết Bị', en: 'Devices' },
  'Cửa & Chuông Hình': { vi: 'Cửa & Chuông Hình', en: 'Doors & Video Intercom' },
  'Tự Động Hóa & An Toàn': { vi: 'Tự Động Hóa & An Toàn', en: 'Automation & Security' },
  'Tự Động': { vi: 'Tự Động', en: 'Automation' },
  'Cuộc Thăm Dò & Biểu Quyết Tòa Nhà': { vi: 'Cuộc Thăm Dò & Biểu Quyết Tòa Nhà', en: 'Building Polls & Voting' },
  'Chủ Hộ (Owner Only)': { vi: 'Chủ Hộ (Owner Only)', en: 'Apartment Owner (Owner Only)' },
  'Toàn Thể Cư Dân': { vi: 'Toàn Thể Cư Dân', en: 'All Residents' },
  'Đã biểu quyết': { vi: 'Đã biểu quyết', en: 'Voted' },
  'căn': { vi: 'căn', en: 'units' },
  'Hạn': { vi: 'Hạn', en: 'Deadline' },
  'phiếu': { vi: 'phiếu', en: 'votes' },
  'đã bỏ phiếu thành công (bấm phương án khác để đổi ý kiến).': { vi: 'đã bỏ phiếu thành công (bấm phương án khác để đổi ý kiến).', en: 'successfully voted (tap another option to change vote).' },
  'Lúc': { vi: 'Lúc', en: 'At' },
  'Đã Thích': { vi: 'Đã Thích', en: 'Liked' },
  'Thích': { vi: 'Thích', en: 'Like' },
  'Thảo luận': { vi: 'Thảo luận', en: 'Discuss' },
  'AI: Vi Phạm Tiêu Chuẩn': { vi: 'AI: Vi Phạm Tiêu Chuẩn', en: 'AI: Community Guidelines Violation' },
  'AI: Cần Lưu Tâm': { vi: 'AI: Cần Lưu Tâm', en: 'AI: Caution Advised' },
  'AI: Chuẩn Văn Minh': { vi: 'AI: Chuẩn Văn Minh', en: 'AI: Civilized Standard' },
  'Cảm xúc': { vi: 'Cảm xúc', en: 'Sentiment' },
  'Điểm Nóng BQL': { vi: 'Điểm Nóng BQL', en: 'Management Priority' },
  'Ghim Quan Trọng': { vi: 'Ghim Quan Trọng', en: 'Pinned' },
  'Kỳ thu phí:': { vi: 'Kỳ thu phí:', en: 'Billing Cycle:' },
  'Hạn chót thanh toán:': { vi: 'Hạn chót thanh toán:', en: 'Payment Due Date:' },
  'Đơn vị quản lý thu:': { vi: 'Đơn vị quản lý thu:', en: 'Management Office:' },
  'Ban Quản Lý Chung Cư Skyline Smart Residence': { vi: 'Ban Quản Lý Chung Cư Skyline Smart Residence', en: 'Skyline Smart Residence Management Office' },
  'Tổng Số Tiền Cần Thanh Toán': { vi: 'Tổng Số Tiền Cần Thanh Toán', en: 'Total Amount Due' },
  '✓ Đã Thanh Toán Hoàn Tất': { vi: '✓ Đã Thanh Toán Hoàn Tất', en: '✓ Payment Completed' },
  'Chi Phí Định Kỳ & Chỉ Số': { vi: 'Chi Phí Định Kỳ & Chỉ Số', en: 'Recurring Fees & Meter Readings' },
  'Tạm tính': { vi: 'Tạm tính', en: 'Subtotal' },
  'Biến động bất thường': { vi: 'Biến động bất thường', en: 'Abnormal surge' },
  'Chỉ số': { vi: 'Chỉ số', en: 'Reading' },
  'Đơn giá': { vi: 'Đơn giá', en: 'Unit price' },
  'Dịch Vụ Đời Sống & Tiện Ích': { vi: 'Dịch Vụ Đời Sống & Tiện Ích', en: 'Living Services & Amenities' },
  'Dịch Vụ Cư Dân': { vi: 'Dịch Vụ Cư Dân', en: 'Resident Services' },
  'Số lượng': { vi: 'Số lượng', en: 'Quantity' },
  'gói': { vi: 'gói', en: 'package' },
  'xe': { vi: 'xe', en: 'vehicle' },
  'Ngày': { vi: 'Ngày', en: 'Date' },
  'Đang Xuất PDF...': { vi: 'Đang Xuất PDF...', en: 'Exporting PDF...' },
  'Xuất Hóa Đơn PDF': { vi: 'Xuất Hóa Đơn PDF', en: 'Export Invoice PDF' },
  'Đang xuất...': { vi: 'Đang xuất...', en: 'Exporting...' },
  'In Hóa Đơn': { vi: 'In Hóa Đơn', en: 'Print Invoice' },
  'Xuất CSV': { vi: 'Xuất CSV', en: 'Export CSV' },
  'In Báo Cáo': { vi: 'In Báo Cáo', en: 'Print Report' },
  'In': { vi: 'In', en: 'Print' },
  'Đã Ghi Thu ✓': { vi: 'Đã Ghi Thu ✓', en: 'Payment Recorded ✓' },
  'Duyệt Gạch Nợ': { vi: 'Duyệt Gạch Nợ', en: 'Approve Payment' },
  'Kế Toán Duyệt': { vi: 'Kế Toán Duyệt', en: 'Accounting Approval' },
  'Tiêu Thụ Tăng Vọt': { vi: 'Tiêu Thụ Tăng Vọt', en: 'Surge in Consumption' },
  'Biến Động Bất Thường': { vi: 'Biến Động Bất Thường', en: 'Abnormal Fluctuation' },
  'Cảnh Báo Tiêu Thụ Bất Thường (> 50%)': { vi: 'Cảnh Báo Tiêu Thụ Bất Thường (> 50%)', en: 'Abnormal Consumption Alert (> 50%)' },
  '1. Chờ Tiếp Nhận': { vi: '1. Chờ Tiếp Nhận', en: '1. Pending Assignment' },
  '2. Đang Xử Lý': { vi: '2. Đang Xử Lý', en: '2. In Progress' },
  '3. Đã Xử Lý Xong': { vi: '3. Đã Xử Lý Xong', en: '3. Completed' },
  'AI Phân Công 24/7': { vi: 'AI Phân Công 24/7', en: '24/7 AI Dispatch' },
  'Bảng Tin Chung Cư': { vi: 'Bảng Tin Chung Cư', en: 'Community Bulletin Board' },
  'Nhận Diện Khuôn Mặt Cư Dân': { vi: 'Nhận Diện Khuôn Mặt Cư Dân', en: 'Resident FaceID Recognition' },
  'Lật Thẻ': { vi: 'Lật Thẻ', en: 'Flip Card' },
  'Kiểm Tra': { vi: 'Kiểm Tra', en: 'Inspect' },
  'Xác Nhận': { vi: 'Xác Nhận', en: 'Approve' },
  'Báo Chụp Lại': { vi: 'Báo Chụp Lại', en: 'Retake' },
  'Trạng thái hồ sơ:': { vi: 'Trạng thái hồ sơ:', en: 'Profile Status:' },
  'ĐÃ KÍCH HOẠT QUYỀN RA VÀO': { vi: 'ĐÃ KÍCH HOẠT QUYỀN RA VÀO', en: 'ACCESS PERMISSION ACTIVATED' },
  'CẦN BỔ SUNG HỒ SƠ': { vi: 'CẦN BỔ SUNG HỒ SƠ', en: 'DOCUMENTS REQUIRED' },
  'ĐANG CHỜ PHÊ DUYỆT': { vi: 'ĐANG CHỜ PHÊ DUYỆT', en: 'PENDING APPROVAL' },
  'Tạm Khóa / Thu Hồi': { vi: 'Tạm Khóa / Thu Hồi', en: 'Suspend / Revoke' },
  'Yêu Cầu Bổ Sung': { vi: 'Yêu Cầu Bổ Sung', en: 'Request Updates' },
  'Xác Nhận & Kích Hoạt Quyền Ra Vào': { vi: 'Xác Nhận & Kích Hoạt Quyền Ra Vào', en: 'Approve & Activate Access' },
  'Phê Duyệt Lại Hồ Sơ': { vi: 'Phê Duyệt Lại Hồ Sơ', en: 'Re-approve Profile' },
  'Họ và Tên:': { vi: 'Họ và Tên:', en: 'Full Name:' },
  'Căn Hộ & Vai Trò:': { vi: 'Căn Hộ & Vai Trò:', en: 'Unit & Role:' },
  'Ngày Sinh:': { vi: 'Ngày Sinh:', en: 'Date of Birth:' },
  'Ngày Cấp & Nơi Cấp:': { vi: 'Ngày Cấp & Nơi Cấp:', en: 'Issue Date & Place:' },
  'Số Điện Thoại:': { vi: 'Số Điện Thoại:', en: 'Phone Number:' },
  'Đã Thanh Toán ✓': { vi: 'Đã Thanh Toán ✓', en: 'Paid ✓' },
  'Chờ Thu': { vi: 'Chờ Thu', en: 'Pending' },
  'Xin Chào': { vi: 'Xin Chào', en: 'Welcome' },
  'Tòa văn phòng': { vi: 'Tòa văn phòng', en: 'Office Tower' },
  'Tòa chung cư': { vi: 'Tòa chung cư', en: 'Residential Tower' },
  'Tòa tháp': { vi: 'Tòa tháp', en: 'Tower' },
  'Tòa nhà BS-07': { vi: 'Tòa nhà BS-07', en: 'Tower BS-07' },
  'Tòa The Tropical': { vi: 'Tòa The Tropical', en: 'The Tropical Tower' },
  'Phòng kỹ thuật': { vi: 'Phòng kỹ thuật', en: 'Technical Room' },
  'Phòng sinh hoạt': { vi: 'Phòng sinh hoạt', en: 'Community Lounge' },
  'Khu sinh hoạt': { vi: 'Khu sinh hoạt', en: 'Community Lounge' },
  'Khu vui chơi': { vi: 'Khu vui chơi', en: 'Playground Area' },
  'Khu thương mại': { vi: 'Khu thương mại', en: 'Commercial Center' },
  'Ô đỗ xe': { vi: 'Ô đỗ xe', en: 'Parking Slot' },
  'Chưa có dữ liệu': { vi: 'Chưa có dữ liệu', en: 'No Data Available' },
  'Lịch sử ra vào': { vi: 'Lịch sử ra vào', en: 'Access Control History' },
  'Danh sách cư dân': { vi: 'Danh sách cư dân', en: 'Resident List' },
  'Điện': { vi: 'Điện', en: 'Electricity' },
  'Nước': { vi: 'Nước', en: 'Water' },
  'Vệ sinh': { vi: 'Vệ sinh', en: 'Sanitation' },
  'Nhà hàng': { vi: 'Nhà hàng', en: 'Dining' },
  'Khác': { vi: 'Khác', en: 'Other' },
  'Xông hơi': { vi: 'Xông hơi', en: 'Sauna' },
  'lần': { vi: 'lần', en: 'times' },
  'tháng': { vi: 'tháng', en: 'month' },
  'Tiền Điện Sinh Hoạt': { vi: 'Tiền Điện Sinh Hoạt', en: 'Residential Electricity Fee' },
  'Phí Gửi Xe Căn Hộ': { vi: 'Phí Gửi Xe Căn Hộ', en: 'Apartment Parking Fee' },
  'Cáp Quang Internet VNPT Fiber 300Mbps': { vi: 'Cáp Quang Internet VNPT Fiber 300Mbps', en: 'VNPT Fiber 300Mbps High-Speed Internet' },
  'Miễn phí theo Thẻ cư dân': { vi: 'Miễn phí theo Thẻ cư dân', en: 'Complimentary with Resident Card' },
  'Chưa cập nhật': { vi: 'Chưa cập nhật', en: 'Not updated' },
  'KHÁCH ĐANG Ở TRONG TÒA NHÀ': { vi: 'KHÁCH ĐANG Ở TRONG TÒA NHÀ', en: 'GUEST CURRENTLY IN BUILDING' },
  'KHÁCH ĐÃ RỜI TÒA NHÀ': { vi: 'KHÁCH ĐÃ RỜI TÒA NHÀ', en: 'GUEST HAS LEFT BUILDING' },
  'Quy Chế Chung Cư': { vi: 'Quy Chế Chung Cư', en: 'Building Regulations' },
  'Tiện Ích & Dịch Vụ': { vi: 'Tiện Ích & Dịch Vụ', en: 'Amenities & Services' },
  'Cơ Điện & Nước': { vi: 'Cơ Điện & Nước', en: 'MEP (Mechanical, Electrical, Plumbing)' },
  'Điện Lạnh & Kỹ Thuật Tòa Nhà': { vi: 'Điện Lạnh & Kỹ Thuật Tòa Nhà', en: 'HVAC & Facilities Engineering' },
  'Vệ Sinh & Cảnh Quan Chung Cư': { vi: 'Vệ Sinh & Cảnh Quan Chung Cư', en: 'Housekeeping & Landscaping' },
  'Có mặt trong vòng 30 phút': { vi: 'Có mặt trong vòng 30 phút', en: 'On-site within 30 minutes' },
  'Khách Thăm Nhà': { vi: 'Khách Thăm Nhà', en: 'Home Visitor' },
  'Đóng góp Quỹ Bảo trì': { vi: 'Đóng góp Quỹ Bảo trì', en: 'Maintenance Fund Contribution' },
  'Ý kiến Cải tạo': { vi: 'Ý kiến Cải tạo', en: 'Renovation Proposal' },
  'Sân thể thao': { vi: 'Sân thể thao', en: 'Sports Court' },
  'Không đồng ý, giữ nguyên hiện trạng': { vi: 'Không đồng ý, giữ nguyên hiện trạng', en: 'Disagree, maintain current status' },
  'Ban Quản Trị & Kỹ Thuật Tòa Nhà': { vi: 'Ban Quản Trị & Kỹ Thuật Tòa Nhà', en: 'Building Management & Engineering Board' },
  'Ban Quản Trị Tòa Nhà': { vi: 'Ban Quản Trị Tòa Nhà', en: 'Building Management Board' },
  'Bộ Phận Vận Hành Ban Quản Lý': { vi: 'Bộ Phận Vận Hành Ban Quản Lý', en: 'Management Operations Department' },
  'Hội Nghị Nhà Chung Cư': { vi: 'Hội Nghị Nhà Chung Cư', en: 'Apartment Owners Assembly' },
  'Biểu quyết Thông qua Phương án Nâng cấp Hệ thống Kiểm soát Xe Tự Động Hầm B1 - B2': { vi: 'Biểu quyết Thông qua Phương án Nâng cấp Hệ thống Kiểm soát Xe Tự Động Hầm B1 - B2', en: 'Vote on Upgrading Automated Parking Access System at Basement B1 - B2' },
  'Lấy ý kiến Điều chỉnh Giờ giấc Hoạt động Khu Thể Thao & Tiện Ích Nội Khu The Tropical': { vi: 'Lấy ý kiến Điều chỉnh Giờ giấc Hoạt động Khu Thể Thao & Tiện Ích Nội Khu The Tropical', en: 'Survey on Adjusting Operating Hours of Sports Court & Tropical Amenities' },
  'Hội nghị Nhà Chung Cư: Lựa chọn Đơn vị Quản lý Vận hành Chung Cư BS-07 Giai đoạn 2026 - 2028': { vi: 'Hội nghị Nhà Chung Cư: Lựa chọn Đơn vị Quản lý Vận hành Chung Cư BS-07 Giai đoạn 2026 - 2028', en: 'Apartment Assembly: Selecting Property Management Operator for BS-07 (2026 - 2028)' },
  'Thông qua Chủ trương Bố trí Khu Sạc Xe Điện Thông Minh An Toàn PCCC tại Hầm B1': { vi: 'Thông qua Chủ trương Bố trí Khu Sạc Xe Điện Thông Minh An Toàn PCCC tại Hầm B1', en: 'Approve Policy for Fire-Safe Smart EV Charging Station at Basement B1' },
  'Công ty Quản Lý Bất Động Sản Skyline Living Pro (Giá thầu: 11.000 đ/m²)': { vi: 'Công ty Quản Lý Bất Động Sản Skyline Living Pro (Giá thầu: 11.000 đ/m²)', en: 'Skyline Living Pro Property Management (Bid: 11,000 VND/m²)' },
  'Tập đoàn Quản lý Bất động sản Savills Việt Nam (Giá thầu: 14.500 đ/m²)': { vi: 'Tập đoàn Quản lý Bất động sản Savills Việt Nam (Giá thầu: 14.500 đ/m²)', en: 'Savills Vietnam Property Management (Bid: 14,500 VND/m²)' },
  'Công ty Cổ phần Dịch vụ Đô thị CBRE Property (Giá thầu: 13.800 đ/m²)': { vi: 'Công ty Cổ phần Dịch vụ Đô thị CBRE Property (Giá thầu: 13.800 đ/m²)', en: 'CBRE Property Urban Services JSC (Bid: 13,800 VND/m²)' },
  'Đồng ý phương án nâng cấp (Dự toán 150 triệu VNĐ từ Quỹ Bảo trì)': { vi: 'Đồng ý phương án nâng cấp (Dự toán 150 triệu VNĐ từ Quỹ Bảo trì)', en: 'Approve upgrade proposal (Est. 150M VND from Maintenance Fund)' },
  'Không đồng ý, giữ nguyên hiện trạng kiểm soát thủ công': { vi: 'Không đồng ý, giữ nguyên hiện trạng kiểm soát thủ công', en: 'Disagree, maintain manual access control' },
  'Đồng ý nhưng yêu cầu điều chỉnh giảm dự toán xuống dưới 120 triệu VNĐ': { vi: 'Đồng ý nhưng yêu cầu điều chỉnh giảm dự toán xuống dưới 120 triệu VNĐ', en: 'Approve with request to lower estimate under 120M VND' },
  'Nhất trí kéo dài mở cửa đến 22:30 tất cả các ngày trong tuần': { vi: 'Nhất trí kéo dài mở cửa đến 22:30 tất cả các ngày trong tuần', en: 'Agree to extend opening hours to 22:30 all week' },
  'Chỉ kéo dài đến 22:30 vào các ngày cuối tuần (Thứ Sáu, Thứ Bảy, Chủ Nhật)': { vi: 'Chỉ kéo dài đến 22:30 vào các ngày cuối tuần (Thứ Sáu, Thứ Bảy, Chủ Nhật)', en: 'Extend to 22:30 only on weekends (Fri, Sat, Sun)' },
  'Giữ nguyên khung giờ đóng cửa lúc 21:30 để đảm bảo yên tĩnh cho cư dân các tầng thấp': { vi: 'Giữ nguyên khung giờ đóng cửa lúc 21:30 để đảm bảo yên tĩnh cho cư dân các tầng thấp', en: 'Keep 21:30 closing time to preserve quiet hours for lower floors' },
  'Nhất trí thông qua phương án lắp đặt trạm sạc theo tiêu chuẩn an toàn PCCC': { vi: 'Nhất trí thông qua phương án lắp đặt trạm sạc theo tiêu chuẩn an toàn PCCC', en: 'Agree to approve fire-safe EV charging station installation' },
  'Đồng ý nhưng yêu cầu chuyển trạm sạc ra khu vực sân thoáng ngoài trời': { vi: 'Đồng ý nhưng yêu cầu chuyển trạm sạc ra khu vực sân thoáng ngoài trời', en: 'Agree but request moving charging station to outdoor area' },
  'Không đồng ý lắp đặt trạm sạc xe điện trong hầm': { vi: 'Không đồng ý lắp đặt trạm sạc xe điện trong hầm', en: 'Disagree with installing EV charging station in basement' },
  'Lê Văn Kỹ Thuật': { vi: 'Lê Văn Kỹ Thuật', en: 'Le Van Ky Thuat' },
  'Trần Quốc Bảo': { vi: 'Trần Quốc Bảo', en: 'Tran Quoc Bao' },
  'Phạm Minh Tuấn': { vi: 'Phạm Minh Tuấn', en: 'Pham Minh Tuan' },
  'Tiếp: Chìa Khóa & Điện Nước →': { vi: 'Tiếp: Chìa Khóa & Điện Nước →', en: 'Next: Keys & Utilities →' },
  'Lumière Boulevard & Masteri Centre Point': { vi: 'Lumière Boulevard & Masteri Centre Point', en: 'Lumiere Boulevard & Masteri Centre Point' },
  'Đang Chờ Ban Quản Lý Đối Soát & Phê Duyệt': { vi: 'Đang Chờ Ban Quản Lý Đối Soát & Phê Duyệt', en: 'Pending Management Verification & Approval' },
  'Để nhận diện khuôn mặt chính thức khi đăng nhập (không còn là bản mẫu thử nghiệm), hệ thống Skyline yêu cầu thu thập toàn vẹn 4 góc chụp theo chuẩn e-KYC ngân hàng:': { vi: 'Để nhận diện khuôn mặt chính thức khi đăng nhập (không còn là bản mẫu thử nghiệm), hệ thống Skyline yêu cầu thu thập toàn vẹn 4 góc chụp theo chuẩn e-KYC ngân hàng:', en: 'For official FaceID login recognition, Skyline requires 4 comprehensive camera angles meeting banking e-KYC standards:' },
  'Gõ câu hỏi bất kỳ, Trợ lý AI sẽ trích dẫn điều khoản chính xác theo quy chuẩn chung cư The Tropical.': { vi: 'Gõ câu hỏi bất kỳ, Trợ lý AI sẽ trích dẫn điều khoản chính xác theo quy chuẩn chung cư The Tropical.', en: 'Ask any question and the AI Concierge will quote the exact regulations according to The Tropical building standards.' },
  'Gõ câu hỏi bất kỳ, Skyline AI Concierge sẽ trích dẫn điều khoản chính xác theo quy chuẩn chung cư The Tropical.': { vi: 'Gõ câu hỏi bất kỳ, Skyline AI Concierge sẽ trích dẫn điều khoản chính xác theo quy chuẩn chung cư The Tropical.', en: 'Ask any question and Skyline AI Concierge will quote the exact regulations according to The Tropical building standards.' },
  'AI Concierge': { vi: 'AI Concierge', en: 'AI Concierge' },
  'Skyline AI Concierge': { vi: 'Skyline AI Concierge', en: 'Skyline AI Concierge' },
  '1. Chọn tiện ích muốn đặt:': { vi: '1. Chọn tiện ích muốn đặt:', en: '1. Select amenity to book:' },
  'Chưa có mã PIN tạm thời nào. Bấm nút trên để tạo nhanh.': { vi: 'Chưa có mã PIN tạm thời nào. Bấm nút trên để tạo nhanh.', en: 'No temporary PIN yet. Click the button above to generate one quickly.' },
  'Xác Thực Căn Cước Công Dân & Kích Hoạt Quyền Ra Vào': { vi: 'Xác Thực Căn Cước Công Dân & Kích Hoạt Quyền Ra Vào', en: 'Citizen ID Verification & Access Rights Activation' },
  'Xác Thực Căn Cước Công Dân &amp; Kích Hoạt Quyền Ra Vào': { vi: 'Xác Thực Căn Cước Công Dân &amp; Kích Hoạt Quyền Ra Vào', en: 'Citizen ID Verification & Access Rights Activation' },
  'Đón Tiếp & Kiểm Tra Khách Thăm': { vi: 'Đón Tiếp & Kiểm Tra Khách Thăm', en: 'Visitor Reception & Security Check' },
  'Đón Tiếp &amp; Kiểm Tra Khách Thăm': { vi: 'Đón Tiếp &amp; Kiểm Tra Khách Thăm', en: 'Visitor Reception & Security Check' },
  'Kiểm Tra Mã QR & Tra Cứu PIN': { vi: 'Kiểm Tra Mã QR & Tra Cứu PIN', en: 'Verify QR Code & Search PIN' },
  'Kiểm Tra Mã QR &amp; Tra Cứu PIN': { vi: 'Kiểm Tra Mã QR &amp; Tra Cứu PIN', en: 'Verify QR Code & Search PIN' },
  'Chờ Xác Thực': { vi: 'Chờ Xác Thực', en: 'Awaiting Verification' },
  'Cần Bổ Sung': { vi: 'Cần Bổ Sung', en: 'Resubmission Required' },
  'Đã Kích Hoạt': { vi: 'Đã Kích Hoạt', en: 'Access Granted' },
  'Đang Kích Hoạt': { vi: 'Đang Kích Hoạt', en: 'Access Granted' },
  'Đang Ở Trong': { vi: 'Đang Ở Trong', en: 'Currently Inside' },
  'Đang Trong Tòa Nhà': { vi: 'Đang Trong Tòa Nhà', en: 'Currently Inside' },
  'Chờ Khách Đến': { vi: 'Chờ Khách Đến', en: 'Waiting for Guest Arrival' },
  'Đã Rời Đi': { vi: 'Đã Rời Đi', en: 'Checked Out' },
  'Quá Hạn': { vi: 'Quá Hạn', en: 'Overdue' },
  'Cấp:': { vi: 'Cấp:', en: 'Issued:' },
  'Cấp': { vi: 'Cấp', en: 'Issued' },
  'Ngày cấp:': { vi: 'Ngày cấp:', en: 'Date of Issue:' },
  'Chốt:': { vi: 'Chốt:', en: 'Checkpoint:' },
  'Chốt': { vi: 'Chốt', en: 'Checkpoint' },
  'Chốt kiểm soát an ninh': { vi: 'Chốt kiểm soát an ninh', en: 'Security Checkpoint' },
  'Sảnh Tiếp Tân Tầng 1 (Chung Cư Skyline)': { vi: 'Sảnh Tiếp Tân Tầng 1 (Chung Cư Skyline)', en: 'First Floor Reception Hall (Skyline Residence)' },
  'Thẻ QR': { vi: 'Thẻ QR', en: 'QR Pass' },
  'Xem Thẻ QR': { vi: 'Xem Thẻ QR', en: 'View QR Pass' },
  'Cấp Thẻ Tại Quầy': { vi: 'Cấp Thẻ Tại Quầy', en: 'Issue Pass at Counter' },
  'Làm Sạch Dữ Liệu': { vi: 'Làm Sạch Dữ Liệu', en: 'Clear Data' },
  'Đang Xác Thực Tài Khoản...': { vi: 'Đang Xác Thực Tài Khoản...', en: 'Authenticating Account...' },
  'Đăng Nhập Hệ Thống': { vi: 'Đăng Nhập Hệ Thống', en: 'Sign In to System' },
  'Đang đối soát sinh trắc học FaceID...': { vi: 'Đang đối soát sinh trắc học FaceID...', en: 'Verifying FaceID biometrics...' },
  'Đang kết nối camera...': { vi: 'Đang kết nối camera...', en: 'Connecting to camera...' },
  'Căn khuôn mặt vào khung elip': { vi: 'Căn khuôn mặt vào khung elip', en: 'Align face within oval frame' },
  'Nhận diện sinh trắc học thành công!': { vi: 'Nhận diện sinh trắc học thành công!', en: 'Biometric recognition successful!' },
  'Đăng Nhập Thành Công!': { vi: 'Đăng Nhập Thành Công!', en: 'Login Successful!' },
  'Đăng nhập thành công!': { vi: 'Đăng nhập thành công!', en: 'Login Successful!' },
  'Đang Xác Thực OTP...': { vi: 'Đang Xác Thực OTP...', en: 'Verifying OTP...' },
  'Xác Thực OTP & Đăng Nhập': { vi: 'Xác Thực OTP & Đăng Nhập', en: 'Verify OTP & Sign In' },
  'Xác Thực OTP &amp; Đăng Nhập': { vi: 'Xác Thực OTP & Đăng Nhập', en: 'Verify OTP & Sign In' },
  'Đang Nhận Diện Sinh Trắc Học...': { vi: 'Đang Nhận Diện Sinh Trắc Học...', en: 'Biometric Recognition in Progress...' },
  'Bắt Đầu Quét FaceID': { vi: 'Bắt Đầu Quét FaceID', en: 'Start FaceID Scan' },
  'Quét Lại Khuôn Mặt': { vi: 'Quét Lại Khuôn Mặt', en: 'Rescan Face' },
  'Chọn Ảnh Để Quét FaceID': { vi: 'Chọn Ảnh Để Quét FaceID', en: 'Select Photo for FaceID' },
  'Xác thực thành công': { vi: 'Xác thực thành công', en: 'Authentication successful' },
  'Đang Đồng Bộ Dữ Liệu...': { vi: 'Đang Đồng Bộ Dữ Liệu...', en: 'Syncing Data...' },
  'Đang Đồng Bộ Dữ Liệu Căn Hộ...': { vi: 'Đang Đồng Bộ Dữ Liệu Căn Hộ...', en: 'Syncing Apartment Data...' },
  'Chào mừng Quản trị viên Ban Quản Lý:': { vi: 'Chào mừng Quản trị viên Ban Quản Lý:', en: 'Welcome Management Administrator:' },
  'Chào mừng Quản trị viên Ban Quản Lý': { vi: 'Chào mừng Quản trị viên Ban Quản Lý', en: 'Welcome Management Administrator' },
  'Chào mừng Kỹ thuật viên:': { vi: 'Chào mừng Kỹ thuật viên:', en: 'Welcome Technician:' },
  'Chào mừng Kỹ thuật viên': { vi: 'Chào mừng Kỹ thuật viên', en: 'Welcome Technician' },
  'Chào mừng Chủ hộ': { vi: 'Chào mừng Chủ hộ', en: 'Welcome Apartment Owner' },
  'Chào mừng Cư dân': { vi: 'Chào mừng Cư dân', en: 'Welcome Resident' },
  'Cổng SKYLINE Smart Residence': { vi: 'Cổng SKYLINE Smart Residence', en: 'SKYLINE Smart Residence Portal' },
  'Cổng đăng nhập hệ thống dành cho Cư Dân & Ban Quản Lý': { vi: 'Cổng đăng nhập hệ thống dành cho Cư Dân & Ban Quản Lý', en: 'System login portal for Residents & Management' },
  'Cổng đăng nhập hệ thống dành cho Cư Dân &amp; Ban Quản Lý': { vi: 'Cổng đăng nhập hệ thống dành cho Cư Dân & Ban Quản Lý', en: 'System login portal for Residents & Management' },
  'Email / Mật Khẩu': { vi: 'Email / Mật Khẩu', en: 'Email / Password' },
  'SĐT & Mã OTP': { vi: 'SĐT & Mã OTP', en: 'Phone & OTP Code' },
  'SĐT &amp; Mã OTP': { vi: 'SĐT & Mã OTP', en: 'Phone & OTP Code' },
  'FaceID AI': { vi: 'FaceID AI', en: 'FaceID AI' },
  'Email / Tài Khoản:': { vi: 'Email / Tài Khoản:', en: 'Email / Account:' },
  'Cư dân & Quản lý': { vi: 'Cư dân & Quản lý', en: 'Resident & Management' },
  'Cư dân &amp; Quản lý': { vi: 'Cư dân & Quản lý', en: 'Resident & Management' },
  'Bảo mật hệ thống': { vi: 'Bảo mật hệ thống', en: 'System Security' },
  'Số Điện Thoại Cư Dân:': { vi: 'Số Điện Thoại Cư Dân:', en: 'Resident Phone Number:' },
  'Đã đăng ký': { vi: 'Đã đăng ký', en: 'Registered' },
  'Gửi Mã OTP': { vi: 'Gửi Mã OTP', en: 'Send OTP Code' },
  'Mã OTP có hiệu lực trong 60 giây.': { vi: 'Mã OTP có hiệu lực trong 60 giây.', en: 'OTP code is valid for 60 seconds.' },
  'Nhập mã OTP 6 chữ số:': { vi: 'Nhập mã OTP 6 chữ số:', en: 'Enter 6-digit OTP code:' },
  'Tải Ảnh Chân Dung': { vi: 'Tải Ảnh Chân Dung', en: 'Upload Portrait Photo' },
  'Tải Ảnh': { vi: 'Tải Ảnh', en: 'Upload Photo' },
  'Đổi ảnh': { vi: 'Đổi ảnh', en: 'Change Photo' },
  'Thử lại Camera': { vi: 'Thử lại Camera', en: 'Retry Camera' },
  'Bấm vào đây để chọn ảnh khuôn mặt': { vi: 'Bấm vào đây để chọn ảnh khuôn mặt', en: 'Click here to select portrait image' },
  'Hỗ trợ định dạng ảnh rõ nét (JPG, PNG, WebP)': { vi: 'Hỗ trợ định dạng ảnh rõ nét (JPG, PNG, WebP)', en: 'Supports clear image formats (JPG, PNG, WebP)' },
  'KHỚP': { vi: 'KHỚP', en: 'MATCH' },
  'Mẫu': { vi: 'Mẫu', en: 'Sample' },
  'Căn': { vi: 'Căn', en: 'Unit' },
  'Nghiệm Thu': { vi: 'Nghiệm Thu', en: 'Resolve' },
  'Đổi KTV': { vi: 'Đổi KTV', en: 'Change Tech' },
  'Phản Hồi': { vi: 'Phản Hồi', en: 'Feedback' },
  'BQL Phản Hồi': { vi: 'BQL Phản Hồi', en: 'Management Reply' },
  'Xem Chi Tiết': { vi: 'Xem Chi Tiết', en: 'View Details' },
  'Đã Kích Hoạt Quyền Ra Vào': { vi: 'Đã Kích Hoạt Quyền Ra Vào', en: 'Access Granted' },
  'Cam kết:': { vi: 'Cam kết:', en: 'SLA:' },
  'Trong 24 giờ': { vi: 'Trong 24 giờ', en: 'Within 24h' },
  '45 phút': { vi: '45 phút', en: '45 mins' },
  'Duyệt KTV': { vi: 'Duyệt KTV', en: 'Approve Tech' },
  'Chỉ Định KTV': { vi: 'Chỉ Định KTV', en: 'Assign Tech' },
  'AI Tự Động Phân Công:': { vi: 'AI Tự Động Phân Công:', en: 'AI Auto Dispatch:' },
  'Đúng chuyên môn Điện Lạnh & Kỹ Thuật Tòa Nhà': { vi: 'Đúng chuyên môn Điện Lạnh & Kỹ Thuật Tòa Nhà', en: 'Qualified in HVAC & Building Engineering' },
  'Đúng chuyên môn Điện Lạnh &amp; Kỹ Thuật Tòa Nhà': { vi: 'Đúng chuyên môn Điện Lạnh & Kỹ Thuật Tòa Nhà', en: 'Qualified in HVAC & Building Engineering' },
  'Đang rảnh trực ban': { vi: 'Đang rảnh trực ban', en: 'On Duty (Available)' },
  'Thu hồi': { vi: 'Thu hồi', en: 'Recall' },
  '21 Căn hộ • 6 Thang máy khách • 2 Thang thoát hiểm': { vi: '21 Căn hộ • 6 Thang máy khách • 2 Thang thoát hiểm', en: '21 Apartments • 6 Passenger Lifts • 2 Emergency Exits' },
  'Sơ Đồ BIM 3 Cánh': { vi: 'Sơ Đồ BIM 3 Cánh', en: '3-Wing BIM Model' },
  'Bản Vẽ Thiết Kế': { vi: 'Bản Vẽ Thiết Kế', en: 'Architectural Blueprint' },
  'Tất Cả (21)': { vi: 'Tất Cả (21)', en: 'All (21)' },
  'Cánh Bắc (5)': { vi: 'Cánh Bắc (5)', en: 'North Wing (5)' },
  'Cánh Nam (5)': { vi: 'Cánh Nam (5)', en: 'South Wing (5)' },
  'Cánh Tây (11)': { vi: 'Cánh Tây (11)', en: 'West Wing (11)' },
  'Cánh Bắc': { vi: 'Cánh Bắc', en: 'North Wing' },

  // --- Mobile App, Resident Services, Facility Pass & Smart Home Additions ---
  'Ngôn ngữ hiển thị:': { vi: 'Ngôn ngữ hiển thị:', en: 'Display Language:' },
  'Ngôn ngữ hiển thị': { vi: 'Ngôn ngữ hiển thị', en: 'Display Language' },
  'Tất Cả Dịch Vụ & Tiện Ích': { vi: 'Tất Cả Dịch Vụ & Tiện Ích', en: 'All Services & Amenities' },
  'Tất Cả Dịch Vụ &amp; Tiện Ích': { vi: 'Tất Cả Dịch Vụ & Tiện Ích', en: 'All Services & Amenities' },
  'Căn Hộ & Thiết Bị': { vi: 'Căn Hộ & Thiết Bị', en: 'Apartment & Devices' },
  'Căn Hộ &amp; Thiết Bị': { vi: 'Căn Hộ & Thiết Bị', en: 'Apartment & Devices' },
  'Smart Home 3D': { vi: 'Smart Home 3D', en: '3D Smart Home' },
  'Điều khiển đèn, rèm, camera & chuông hình': { vi: 'Điều khiển đèn, rèm, camera & chuông hình', en: 'Control lights, curtains, camera & intercom' },
  'Camera Cửa Căn Hộ': { vi: 'Camera Cửa Căn Hộ', en: 'Apartment Door Camera' },
  'Xem trực tiếp chuông hình & mở khóa từ xa': { vi: 'Xem trực tiếp chuông hình & mở khóa từ xa', en: 'Live intercom video & remote unlock' },
  'Sổ Tay Cư Dân': { vi: 'Sổ Tay Cư Dân', en: 'Resident Handbook' },
  'Nội quy tòa nhà, kỹ thuật & danh bạ khẩn cấp': { vi: 'Nội quy tòa nhà, kỹ thuật & danh bạ khẩn cấp', en: 'Building rules, technical guides & emergency contacts' },
  'Tiện Ích & Đời Sống': { vi: 'Tiện Ích & Đời Sống', en: 'Amenities & Living' },
  'Tiện Ích &amp; Đời Sống': { vi: 'Tiện Ích & Đời Sống', en: 'Amenities & Living' },
  'Tiện Ích Nội Khu': { vi: 'Tiện Ích Nội Khu', en: 'Community Amenities' },
  'Đặt chỗ Sky Pool, BBQ Garden, Gym & Sauna VIP': { vi: 'Đặt chỗ Sky Pool, BBQ Garden, Gym & Sauna VIP', en: 'Book Sky Pool, BBQ Garden, Gym & VIP Sauna' },
  'Hạn mức BBQ': { vi: 'Hạn mức BBQ', en: 'BBQ Quota' },
  'Hạn Mức BBQ Tháng': { vi: 'Hạn Mức BBQ Tháng', en: 'Monthly BBQ Quota' },
  'Dịch Vụ Căn Hộ': { vi: 'Dịch Vụ Căn Hộ', en: 'In-Room Services' },
  'Dọn dẹp phòng, giặt ủi, rửa xe & spa tại gia': { vi: 'Dọn dẹp phòng, giặt ủi, rửa xe & spa tại gia', en: 'Housekeeping, laundry, car wash & home spa' },
  'Hóa Đơn & Tài Chính': { vi: 'Hóa Đơn & Tài Chính', en: 'Bills & Finance' },
  'Hóa Đơn &amp; Tài Chính': { vi: 'Hóa Đơn & Tài Chính', en: 'Bills & Finance' },
  'Thanh toán phí dịch vụ, điện, nước qua VietQR': { vi: 'Thanh toán phí dịch vụ, điện, nước qua VietQR', en: 'Pay utilities, electricity, water via VietQR' },
  'Chỉ dành cho Chủ Hộ': { vi: 'Chỉ dành cho Chủ Hộ', en: 'Apartment Owner Only' },
  'Báo Hỏng Kỹ Thuật': { vi: 'Báo Hỏng Kỹ Thuật', en: 'Technical Maintenance' },
  'Gửi yêu cầu sửa chữa NKS 24/7 trực tuyến': { vi: 'Gửi yêu cầu sửa chữa NKS 24/7 trực tuyến', en: 'Submit 24/7 NKS repair requests online' },
  'An Ninh & Ra Vào': { vi: 'An Ninh & Ra Vào', en: 'Security & Access' },
  'An Ninh &amp; Ra Vào': { vi: 'An Ninh & Ra Vào', en: 'Security & Access' },
  'Mã QR Đón Khách': { vi: 'Mã QR Đón Khách', en: 'Visitor QR Code' },
  'Tạo mã QR hoặc mã PIN cho khách và shipper': { vi: 'Tạo mã QR hoặc mã PIN cho khách và shipper', en: 'Generate QR or PIN passes for visitors & delivery' },
  '1-Chạm': { vi: '1-Chạm', en: '1-Tap' },
  'Thẻ Cư Dân 3D': { vi: 'Thẻ Cư Dân 3D', en: '3D Resident Card' },
  'Thẻ NFC mạ vàng mở cổng sảnh & thang máy': { vi: 'Thẻ NFC mạ vàng mở cổng sảnh & thang máy', en: 'Gold-plated NFC card for lobby & elevator access' },
  'Hồ Sơ & FaceID e-KYC': { vi: 'Hồ Sơ & FaceID e-KYC', en: 'Profile & FaceID e-KYC' },
  'Hồ Sơ &amp; FaceID e-KYC': { vi: 'Hồ Sơ & FaceID e-KYC', en: 'Profile & FaceID e-KYC' },
  'Quét CCCD chip & đăng ký FaceID ra vào': { vi: 'Quét CCCD chip & đăng ký FaceID ra vào', en: 'Scan chip Citizen ID & register FaceID access' },
  'Cộng Đồng & Hỗ Trợ': { vi: 'Cộng Đồng & Hỗ Trợ', en: 'Community & Support' },
  'Cộng Đồng &amp; Hỗ Trợ': { vi: 'Cộng Đồng & Hỗ Trợ', en: 'Community & Support' },
  'Thành Viên Gia Đình': { vi: 'Thành Viên Gia Đình', en: 'Family Members' },
  'Quản lý người nhà, biển số xe & bảo lãnh FaceID': { vi: 'Quản lý người nhà, biển số xe & bảo lãnh FaceID', en: 'Manage family members, vehicle plates & FaceID approvals' },
  'Khảo Sát & Biểu Quyết': { vi: 'Khảo Sát & Biểu Quyết', en: 'Surveys & Voting' },
  'Khảo Sát &amp; Biểu Quyết': { vi: 'Khảo Sát & Biểu Quyết', en: 'Surveys & Voting' },
  'Lấy ý kiến BQT, biểu quyết cư dân trực tuyến': { vi: 'Lấy ý kiến BQT, biểu quyết cư dân trực tuyến', en: 'Board consultations & online resident voting' },
  'Trợ Lý AI Concierge': { vi: 'Trợ Lý AI Concierge', en: 'Skyline AI Concierge' },
  'Hỏi đáp quy chế tòa nhà, thủ tục & tư vấn 24/7': { vi: 'Hỏi đáp quy chế tòa nhà, thủ tục & tư vấn 24/7', en: '24/7 guidance on building regulations & procedures' },
  'Tìm kiếm tiện ích, dịch vụ, sửa chữa...': { vi: 'Tìm kiếm tiện ích, dịch vụ, sửa chữa...', en: 'Search amenities, services, maintenance...' },
  'Không tìm thấy tính năng phù hợp với từ khóa': { vi: 'Không tìm thấy tính năng phù hợp với từ khóa', en: 'No features matching keyword' },
  'Chế độ hiển thị không gian:': { vi: 'Chế độ hiển thị không gian:', en: 'Space display mode:' },
  'Chế độ hiển thị không gian': { vi: 'Chế độ hiển thị không gian', en: 'Space display mode' },
  'Bảng Thẻ Nhanh': { vi: 'Bảng Thẻ Nhanh', en: 'Quick Cards Board' },
  'Mô Hình 3D Xoay Lật': { vi: 'Mô Hình 3D Xoay Lật', en: '3D Interactive Model' },
  'Mô Hình 3D': { vi: 'Mô Hình 3D', en: '3D Model' },
  'Nhật Ký Mở Cửa Căn Hộ': { vi: 'Nhật Ký Mở Cửa Căn Hộ', en: 'Apartment Door Logs' },
  'Nhật Ký Mở Cửa Căn Hộ Gần Đây': { vi: 'Nhật Ký Mở Cửa Căn Hộ Gần Đây', en: 'Recent Apartment Door Logs' },
  'Ngắt Mic': { vi: 'Ngắt Mic', en: 'Mute Mic' },
  'Đàm Thoại': { vi: 'Đàm Thoại', en: 'Intercom Talk' },
  'Chụp Ảnh': { vi: 'Chụp Ảnh', en: 'Capture Snapshot' },
  'Khu vực cửa chính an toàn': { vi: 'Khu vực cửa chính an toàn', en: 'Main door area secure' },
  'Đang đàm thoại 2 chiều...': { vi: 'Đang đàm thoại 2 chiều...', en: '2-way intercom active...' },
  '1. Danh Mục Tiện Ích': { vi: '1. Danh Mục Tiện Ích', en: '1. Amenities Catalog' },
  '2. Đặt Chỗ & Vé Vào': { vi: '2. Đặt Chỗ & Vé Vào', en: '2. Bookings & Tickets' },
  '2. Đặt Chỗ &amp; Vé Vào': { vi: '2. Đặt Chỗ & Vé Vào', en: '2. Bookings & Tickets' },
  '3. Nhật Ký Ra Vào': { vi: '3. Nhật Ký Ra Vào', en: '3. Access Control Logs' },
  'Vào Cửa Tiện Ích (Check-in)': { vi: 'Vào Cửa Tiện Ích (Check-in)', en: 'Amenity Entry (Check-in)' },
  'Đăng Ký Đặt Lịch Giữ Chỗ': { vi: 'Đăng Ký Đặt Lịch Giữ Chỗ', en: 'Reserve Amenity Slot' },
  'Hủy Lịch & Hoàn Tiền': { vi: 'Hủy Lịch & Hoàn Tiền', en: 'Cancel & Refund' },
  'Hủy Lịch &amp; Hoàn Tiền': { vi: 'Hủy Lịch & Hoàn Tiền', en: 'Cancel & Refund' },
  'Hủy Lịch & Hoàn Tiền (Bận Đột Xuất)': { vi: 'Hủy Lịch & Hoàn Tiền (Bận Đột Xuất)', en: 'Cancel & Refund (Sudden Conflict)' },
  'Quẹt Vé Vào Cổng Ngay': { vi: 'Quẹt Vé Vào Cổng Ngay', en: 'Scan Ticket at Turnstile' },
  'Giữ Lại Lịch Đặt': { vi: 'Giữ Lại Lịch Đặt', en: 'Keep Booking' },
  'Xác Nhận Hủy & Hoàn Tiền': { vi: 'Xác Nhận Hủy & Hoàn Tiền', en: 'Confirm Cancellation & Refund' },
  'Xác Nhận Hủy &amp; Hoàn Tiền': { vi: 'Xác Nhận Hủy & Hoàn Tiền', en: 'Confirm Cancellation & Refund' },
  'Đang Xử Lý Hoàn Tiền...': { vi: 'Đang Xử Lý Hoàn Tiền...', en: 'Processing Refund...' },
  'Xác Nhận Đặt Giữ Chỗ & Tạo Vé QR': { vi: 'Xác Nhận Đặt Giữ Chỗ & Tạo Vé QR', en: 'Confirm Reservation & Generate QR Ticket' },
  'Xác Nhận Đặt Giữ Chỗ &amp; Tạo Vé QR': { vi: 'Xác Nhận Đặt Giữ Chỗ & Tạo Vé QR', en: 'Confirm Reservation & Generate QR Ticket' },
  'Quẹt Thẻ Cư Dân': { vi: 'Quẹt Thẻ Cư Dân', en: 'Tap Resident Card' },
  'Chạm thẻ vào máy quét': { vi: 'Chạm thẻ vào máy quét', en: 'Tap card on scanner' },
  'Nhận Diện Khuôn Mặt': { vi: 'Nhận Diện Khuôn Mặt', en: 'Face Recognition' },
  'Nhìn vào camera': { vi: 'Nhìn vào camera', en: 'Look directly at camera' },
  'Mở Cửa Vào Tiện Ích': { vi: 'Mở Cửa Vào Tiện Ích', en: 'Open Amenity Turnstile' },
  'Đang Mở Cửa Vào Tiện Ích...': { vi: 'Đang Mở Cửa Vào Tiện Ích...', en: 'Opening Amenity Turnstile...' },
  'Thẻ Cư Dân Kim Loại Mạ Vàng Căn': { vi: 'Thẻ Cư Dân Kim Loại Mạ Vàng Căn', en: 'Gold-plated Metal Resident Card Unit' },
  'Yêu Cầu Hoàn Tiền Khi Bận Đột Xuất': { vi: 'Yêu Cầu Hoàn Tiền Khi Bận Đột Xuất', en: 'Refund Request for Sudden Schedule Conflict' },
  'Danh Mục Dịch Vụ': { vi: 'Danh Mục Dịch Vụ', en: 'Services Catalog' },
  'Lịch Sử & Đơn Hàng': { vi: 'Lịch Sử & Đơn Hàng', en: 'History & Orders' },
  'Lịch Sử &amp; Đơn Hàng': { vi: 'Lịch Sử & Đơn Hàng', en: 'History & Orders' },
  'Bảng Giá Gói Dịch Vụ:': { vi: 'Bảng Giá Gói Dịch Vụ:', en: 'Service Package Pricing:' },
  'Đã gồm VAT & Phí dịch vụ': { vi: 'Đã gồm VAT & Phí dịch vụ', en: 'VAT & Service fees included' },
  'Đã gồm VAT &amp; Phí dịch vụ': { vi: 'Đã gồm VAT & Phí dịch vụ', en: 'VAT & Service fees included' },
  'Đặt Gói Này': { vi: 'Đặt Gói Này', en: 'Book This Package' },
  'Đặt Lịch Dịch Vụ Nhanh': { vi: 'Đặt Lịch Dịch Vụ Nhanh', en: 'Quick Service Booking' },
  'Gộp Vào Hóa Đơn Tháng': { vi: 'Gộp Vào Hóa Đơn Tháng', en: 'Add to Monthly Bill' },
  'Sẽ cộng vào Hóa Đơn Căn Hộ': { vi: 'Sẽ cộng vào Hóa Đơn Căn Hộ', en: 'Will be added to Apartment Bill' },
  'Thanh toán khi nghiệm thu': { vi: 'Thanh toán khi nghiệm thu', en: 'Pay upon inspection' },
  'Xác Nhận Đặt Lịch': { vi: 'Xác Nhận Đặt Lịch', en: 'Confirm Booking' },
  'Hủy Đơn Này': { vi: 'Hủy Đơn Này', en: 'Cancel This Order' },
  'Chưa Có Đơn Đặt Dịch Vụ Nào': { vi: 'Chưa Có Đơn Đặt Dịch Vụ Nào', en: 'No Service Orders Yet' },
  'Khám Phá Dịch Vụ Ngay': { vi: 'Khám Phá Dịch Vụ Ngay', en: 'Explore Services Now' },
  'Tổng chi phí:': { vi: 'Tổng chi phí:', en: 'Total Price:' },
  'Thời gian hẹn:': { vi: 'Thời gian hẹn:', en: 'Appointment Time:' },
  'Khối lượng:': { vi: 'Khối lượng:', en: 'Quantity:' },
  'Nhân viên phụ trách:': { vi: 'Nhân viên phụ trách:', en: 'Assigned Staff:' },
  'Đội Dịch Vụ BQL': { vi: 'Đội Dịch Vụ BQL', en: 'Management Service Team' },
  'Yêu Cầu Đặc Biệt / Ghi Chú:': { vi: 'Yêu Cầu Đặc Biệt / Ghi Chú:', en: 'Special Requests / Notes:' },
  'Hình Thức Thanh Toán:': { vi: 'Hình Thức Thanh Toán:', en: 'Payment Method:' },
  'Khung Giờ Phục Vụ / Đón Đồ:': { vi: 'Khung Giờ Phục Vụ / Đón Đồ:', en: 'Service Time Slot / Pickup:' },
  'Ngày Phục Vụ:': { vi: 'Ngày Phục Vụ:', en: 'Service Date:' },
  'Dịch Vụ Theo Yêu Cầu': { vi: 'Dịch Vụ Theo Yêu Cầu', en: 'On-Demand Services' },
  'Đặt dịch vụ tận phòng: dọn dẹp, giặt ủi, rửa xe, giao đồ ăn và trị liệu spa.': { vi: 'Đặt dịch vụ tận phòng: dọn dẹp, giặt ủi, rửa xe, giao đồ ăn và trị liệu spa.', en: 'In-room booking: housekeeping, laundry, car wash, food delivery, and spa therapies.' },
  'Đặc Quyền Cư Dân SKYLINE': { vi: 'Đặc Quyền Cư Dân SKYLINE', en: 'SKYLINE Resident Privileges' },
  'Thẻ Cư Dân Điện Tử': { vi: 'Thẻ Cư Dân Điện Tử', en: 'Digital Resident Pass' },
  'Chạm để lật thẻ • Dùng mở cổng sảnh & thang máy': { vi: 'Chạm để lật thẻ • Dùng mở cổng sảnh & thang máy', en: 'Tap to flip card • Use to unlock lobby & elevators' },
  'Tạo QR Đón Khách': { vi: 'Tạo QR Đón Khách', en: 'Create Visitor QR' },
  'Quẹt FaceID Của Bạn': { vi: 'Quẹt FaceID Của Bạn', en: 'Scan Your FaceID' },
  'e-KYC Đã Xác Thực': { vi: 'e-KYC Đã Xác Thực', en: 'e-KYC Verified' },
  'Xác Nhận Ngay': { vi: 'Xác Nhận Ngay', en: 'Confirm Now' },
  'Ngữ Cảnh Nhanh:': { vi: 'Ngữ Cảnh Nhanh:', en: 'Quick Scenes:' },
  'Ra Ngoài': { vi: 'Ra Ngoài', en: 'Away' },
  'Ăn Tối': { vi: 'Ăn Tối', en: 'Dining' },
  'Cánh Nam': { vi: 'Cánh Nam', en: 'South Wing' },
  'Cánh Tây': { vi: 'Cánh Tây', en: 'West Wing' },
  'Doanh Thu Sàn Tầng:': { vi: 'Doanh Thu Sàn Tầng:', en: 'Floor Revenue:' },
  'Lấp Đầy:': { vi: 'Lấp Đầy:', en: 'Occupancy:' },
  'Lấp đầy:': { vi: 'Lấp đầy:', en: 'Occupancy:' },
  'LÕI THANG MÁY & SẢNH CHỜ TẦNG': { vi: 'LÕI THANG MÁY & SẢNH CHỜ TẦNG', en: 'ELEVATOR CORE & FLOOR LOBBY' },
  'THANG PCCC & HÀNG': { vi: 'THANG PCCC & HÀNG', en: 'FIRE & SERVICE ELEVATOR' },
  'Phòng đệm áp suất': { vi: 'Phòng đệm áp suất', en: 'Pressurized Antechamber' },
  'THOÁT HIỂM 1': { vi: 'THOÁT HIỂM 1', en: 'FIRE EXIT 1' },
  'THOÁT HIỂM 2': { vi: 'THOÁT HIỂM 2', en: 'FIRE EXIT 2' },
  'SẢNH CHỜ THANG MÁY (2.4m)': { vi: 'SẢNH CHỜ THANG MÁY (2.4m)', en: 'ELEVATOR LOBBY (2.4m)' },
  'PHÒNG RÁC HÚT CHÂN KHÔNG': { vi: 'PHÒNG RÁC HÚT CHÂN KHÔNG', en: 'VACUUM REFUSE ROOM' },
  'HỘP KỸ THUẬT ĐIỆN - NƯỚC': { vi: 'HỘP KỸ THUẬT ĐIỆN - NƯỚC', en: 'MEP TECHNICAL RISER' },
  'HÀNH LANG TÂY (1.8m)': { vi: 'HÀNH LANG TÂY (1.8m)', en: 'WEST CORRIDOR (1.8m)' },
  'HÀNH LANG BẮC (1.8m)': { vi: 'HÀNH LANG BẮC (1.8m)', en: 'NORTH CORRIDOR (1.8m)' },
  'HÀNH LANG NAM (1.8m)': { vi: 'HÀNH LANG NAM (1.8m)', en: 'SOUTH CORRIDOR (1.8m)' },
  'BỐ TRÍ MẶT BẰNG KHÔNG GIAN': { vi: 'BỐ TRÍ MẶT BẰNG KHÔNG GIAN', en: 'SPACE LAYOUT & CONFIGURATION' },
  'Phòng Khách & Bếp:': { vi: 'Phòng Khách & Bếp:', en: 'Living Room & Kitchen:' },
  'Phòng Ngủ Master:': { vi: 'Phòng Ngủ Master:', en: 'Master Bedroom:' },
  'Phòng Ngủ Phụ & WC:': { vi: 'Phòng Ngủ Phụ & WC:', en: 'Secondary Bedroom & WC:' },
  'Logia & Giặt Phơi:': { vi: 'Logia & Giặt Phơi:', en: 'Loggia & Laundry:' },
  'Hướng Ban Công:': { vi: 'Hướng Ban Công:', en: 'Balcony Facing:' },
  'Tầm Nhìn (View):': { vi: 'Tầm Nhìn (View):', en: 'View Orientation:' },
  'Chiếu Sáng Tự Nhiên:': { vi: 'Chiếu Sáng Tự Nhiên:', en: 'Natural Daylight:' },
  'TIÊU THỤ NĂNG LƯỢNG & DOANH THU CĂN': { vi: 'TIÊU THỤ NĂNG LƯỢNG & DOANH THU CĂN', en: 'ENERGY CONSUMPTION & UNIT REVENUE' },
  'Doanh Thu Phí BQL Thu Về:': { vi: 'Doanh Thu Phí BQL Thu Về:', en: 'Management Fee Revenue:' },
  'Giá Cho Thuê Tham Chiếu:': { vi: 'Giá Cho Thuê Tham Chiếu:', en: 'Reference Rental Price:' },
  'Suất Sinh Lời Cho Thuê:': { vi: 'Suất Sinh Lời Cho Thuê:', en: 'Rental Yield:' },
  'Xem Hóa Đơn & Tiêu Thụ': { vi: 'Xem Hóa Đơn & Tiêu Thụ', en: 'View Invoices & Consumption' },
  'Hồ Sơ Căn': { vi: 'Hồ Sơ Căn', en: 'Unit Profile' },
  'ĐÃ CÓ CƯ DÂN': { vi: 'ĐÃ CÓ CƯ DÂN', en: 'OCCUPIED' },
  'CÓ CƯ DÂN': { vi: 'CÓ CƯ DÂN', en: 'OCCUPIED' },
  'NHÀ TRỐNG': { vi: 'NHÀ TRỐNG', en: 'VACANT' },
  'Đang chọn': { vi: 'Đang chọn', en: 'Selected' },
  'Căn phụ': { vi: 'Căn phụ', en: 'Secondary unit' },
  '1. Phối Cảnh & Thông Số': { vi: '1. Phối Cảnh & Thông Số', en: '1. 3D View & Specs' },
  'Phối Cảnh & Thông Số': { vi: 'Phối Cảnh & Thông Số', en: '3D View & Specs' },
  '2. Cư Dân & Nhân Khẩu': { vi: '2. Cư Dân & Nhân Khẩu', en: '2. Residents & Occupants' },
  'Cư Dân & Nhân Khẩu': { vi: 'Cư Dân & Nhân Khẩu', en: 'Residents & Occupants' },
  '3. Xe Cộ & Thẻ Hầm': { vi: '3. Xe Cộ & Thẻ Hầm', en: '3. Vehicles & Parking Passes' },
  'Xe Cộ & Thẻ Hầm': { vi: 'Xe Cộ & Thẻ Hầm', en: 'Vehicles & Parking Passes' },
  '4. Phí Quản Lý & Hóa Đơn': { vi: '4. Phí Quản Lý & Hóa Đơn', en: '4. Management Fees & Invoices' },
  'Phí Quản Lý & Hóa Đơn': { vi: 'Phí Quản Lý & Hóa Đơn', en: 'Management Fees & Invoices' },
  '5. Lịch Sử Kỹ Thuật': { vi: '5. Lịch Sử Kỹ Thuật', en: '5. Technical & Maintenance History' },
  'Lịch Sử Kỹ Thuật': { vi: 'Lịch Sử Kỹ Thuật', en: 'Technical & Maintenance History' },
  '1. Kiến Trúc & Vị Trí': { vi: '1. Kiến Trúc & Vị Trí', en: '1. Architecture & Location' },
  'Kiến Trúc & Vị Trí': { vi: 'Kiến Trúc & Vị Trí', en: 'Architecture & Location' },
  '2. Hạ Tầng IoT & PCCC': { vi: '2. Hạ Tầng IoT & PCCC', en: '2. IoT & Fire Safety' },
  'Hạ Tầng IoT & PCCC': { vi: 'Hạ Tầng IoT & PCCC', en: 'IoT & Fire Safety' },
  '3. Tài Chính & Pháp Lý': { vi: '3. Tài Chính & Pháp Lý', en: '3. Finance & Legal' },
  'Tài Chính & Pháp Lý': { vi: 'Tài Chính & Pháp Lý', en: 'Finance & Legal' },
  '1. Thông Tin Chủ Hộ & Cư Dân': { vi: '1. Thông Tin Chủ Hộ & Cư Dân', en: '1. Owner & Resident Info' },
  'Thông Tin Chủ Hộ & Cư Dân': { vi: 'Thông Tin Chủ Hộ & Cư Dân', en: 'Owner & Resident Info' },
  '1. Thông Tin Chủ Hộ Nhận Nhà': { vi: '1. Thông Tin Chủ Hộ Nhận Nhà', en: '1. New Owner Handover Info' },
  'Thông Tin Chủ Hộ Nhận Nhà': { vi: 'Thông Tin Chủ Hộ Nhận Nhà', en: 'New Owner Handover Info' },
  '2. Bàn Giao Chìa Khóa & Điện Nước': { vi: '2. Bàn Giao Chìa Khóa & Điện Nước', en: '2. Keys & Utilities Handover' },
  'Bàn Giao Chìa Khóa & Điện Nước': { vi: 'Bàn Giao Chìa Khóa & Điện Nước', en: 'Keys & Utilities Handover' },
  '1. Phối Cảnh & Mặt Bằng': { vi: '1. Phối Cảnh & Mặt Bằng', en: '1. 3D Model & Floor Plan' },
  'Phối Cảnh & Mặt Bằng': { vi: 'Phối Cảnh & Mặt Bằng', en: '3D Model & Floor Plan' },
  '2. Thiết Bị Bàn Giao': { vi: '2. Thiết Bị Bàn Giao', en: '2. Handover Equipment' },
  'Thiết Bị Bàn Giao': { vi: 'Thiết Bị Bàn Giao', en: 'Handover Equipment' },
  '3. Cẩm Nang & Hotline': { vi: '3. Cẩm Nang & Hotline', en: '3. Handbook & Hotline' },
  'Cẩm Nang & Hotline': { vi: 'Cẩm Nang & Hotline', en: 'Handbook & Hotline' },
  'Tải Ảnh Từ Máy': { vi: 'Tải Ảnh Từ Máy', en: 'Upload From Device' },
  'Chụp Bằng Camera': { vi: 'Chụp Bằng Camera', en: 'Take Photo With Camera' },
  'Bộ Sưu Tập Cư Dân VIP': { vi: 'Bộ Sưu Tập Cư Dân VIP', en: 'VIP Resident Presets' },
  'Có Sẵn': { vi: 'Có Sẵn', en: 'Available' },
  'Tra Cứu': { vi: 'Tra Cứu', en: 'Search' },
  'Nhập Mới': { vi: 'Nhập Mới', en: 'New Entry' },
  'Tất Cả': { vi: 'Tất Cả', en: 'All' },
  'Cổng Vào Tiện Ích:': { vi: 'Cổng Vào Tiện Ích:', en: 'Facility Turnstile Gate:' },
  'Chọn cách mở cửa để vào tiện ích:': { vi: 'Chọn cách mở cửa để vào tiện ích:', en: 'Choose method to unlock turnstile:' },
  'Thẻ cư dân chính của căn hộ': { vi: 'Thẻ cư dân chính của căn hộ', en: 'Primary resident card of the unit' },
  'Khuôn mặt cư dân đã kích hoạt': { vi: 'Khuôn mặt cư dân đã kích hoạt', en: 'Resident face already activated' },
  'Hồ Sơ Căn Hộ • Chung Cư Skyline': { vi: 'Hồ Sơ Căn Hộ • Chung Cư Skyline', en: 'Apartment Profile • Skyline Residence' },
  'Phối Cảnh Không Gian Nội Thất Căn Hộ': { vi: 'Phối Cảnh Không Gian Nội Thất Căn Hộ', en: 'Apartment Interior 3D Perspective' },
  'Phối cảnh phòng khách, phòng ngủ Master, bếp, ban công': { vi: 'Phối cảnh phòng khách, phòng ngủ Master, bếp, ban công', en: 'Perspective of living room, master bedroom, kitchen, balcony' },
  'KHỞI TẠO KHÔNG GIAN BQL • CHUNG CƯ SKYLINE': { vi: 'KHỞI TẠO KHÔNG GIAN BQL • CHUNG CƯ SKYLINE', en: 'CREATE MANAGEMENT SPACE • SKYLINE RESIDENCE' },
  'The Tropical • Mặt Bằng Phân Khu': { vi: 'The Tropical • Mặt Bằng Phân Khu', en: 'The Tropical • Zone Master Plan' },
  'Thành Phố Biển Hồ • 8 Đại Tiện Ích': { vi: 'Thành Phố Biển Hồ • 8 Đại Tiện Ích', en: 'Lake City • 8 Grand Amenities' },
  'Vinhomes Grand Park • Quy Hoạch 271 ha': { vi: 'Vinhomes Grand Park • Quy Hoạch 271 ha', en: 'Vinhomes Grand Park • 271 ha Master Plan' },
  'Bản vẽ kiến trúc 4 khối tháp & 23 tiện ích nội khu': { vi: 'Bản vẽ kiến trúc 4 khối tháp & 23 tiện ích nội khu', en: 'Architectural drawings of 4 towers & 23 internal amenities' },
  'Bán kính 1km kết nối biển hồ & các đại tiện ích': { vi: 'Bán kính 1km kết nối biển hồ & các đại tiện ích', en: '1km radius connecting to the lake & grand amenities' },
  'Tổng thể 271 ha • Công viên 36 ha • Vincom Mega Mall': { vi: 'Tổng thể 271 ha • Công viên 36 ha • Vincom Mega Mall', en: 'Overall 271 ha • 36 ha Park • Vincom Mega Mall' },
  'Ghim: BẬT': { vi: 'Ghim: BẬT', en: 'Pins: ON' },
  'Bản Vẽ Sạch': { vi: 'Bản Vẽ Sạch', en: 'Clean Blueprint' },
  'Đặt lại 100%': { vi: 'Đặt lại 100%', en: 'Reset 100%' },
  'Tiện Ích Biển Hồ': { vi: 'Tiện Ích Biển Hồ', en: 'Lake Amenities' },
  'Đại Đô Thị': { vi: 'Đại Đô Thị', en: 'Mega City' },
  'SẢNH ĐÓN': { vi: 'SẢNH ĐÓN', en: 'MAIN LOBBY' },
  'SẢNH TRỆT / G': { vi: 'SẢNH TRỆT / G', en: 'GROUND LOBBY / G' },
  'PHÂN KHU TẦNG CAO': { vi: 'PHÂN KHU TẦNG CAO', en: 'HIGH FLOOR ZONE' },
  'PHÂN KHU TẦNG TRUNG': { vi: 'PHÂN KHU TẦNG TRUNG', en: 'MID FLOOR ZONE' },
  'KHỐI ĐẾ THƯƠNG MẠI': { vi: 'KHỐI ĐẾ THƯƠNG MẠI', en: 'COMMERCIAL PODIUM' },
  'PHÂN KHU TẦNG THẤP': { vi: 'PHÂN KHU TẦNG THẤP', en: 'LOW FLOOR ZONE' },
  'Trục thang máy sảnh': { vi: 'Trục thang máy sảnh', en: 'Lobby elevator core' },
  '4 Thang khách + 1 Thang PCCC': { vi: '4 Thang khách + 1 Thang PCCC', en: '4 Passenger Lifts + 1 Fire Safety Lift' },
  'Sảnh đón tiếp tân & Kiểm soát FaceID': { vi: 'Sảnh đón tiếp tân & Kiểm soát FaceID', en: 'Reception lobby & FaceID control' },
  'Tầm nhìn: View Sông & Panorama thoáng đãng': { vi: 'Tầm nhìn: View Sông & Panorama thoáng đãng', en: 'View: River View & Open Panorama' },
  'Tầm nhìn: View Toàn cảnh nội khu & Hồ bơi': { vi: 'Tầm nhìn: View Toàn cảnh nội khu & Hồ bơi', en: 'View: Internal Amenities & Pool View' },
  'Tầm nhìn: View Mảng xanh & Tiện ích tầng thấp': { vi: 'Tầm nhìn: View Mảng xanh & Tiện ích tầng thấp', en: 'View: Greenery & Low-level Amenities' },
  'ĐÃ Ở': { vi: 'ĐÃ Ở', en: 'OCCUPIED' },
  'Ở': { vi: 'Ở', en: 'Occupied' },
  'Chuyển Tầng:': { vi: 'Chuyển Tầng:', en: 'Change Floor:' },
  'Chuyển Tầng': { vi: 'Chuyển Tầng', en: 'Change Floor' },
  'Đóng [✕]': { vi: 'Đóng [✕]', en: 'Close [✕]' },
  'Đóng': { vi: 'Đóng', en: 'Close' },
  'Quét Căn Cước Công Dân (2 Mặt)': { vi: 'Quét Căn Cước Công Dân (2 Mặt)', en: 'Citizen ID Card Scanner (2 Sides)' },
  'Trợ Lý OCR Nhận Diện Pháp Lý & Tự Động Điền Hồ Sơ Cư Dân': { vi: 'Trợ Lý OCR Nhận Diện Pháp Lý & Tự Động Điền Hồ Sơ Cư Dân', en: 'Legal OCR Assistant & Auto-fill Resident Profile' },
  'MẶT TRƯỚC (Front)': { vi: 'MẶT TRƯỚC (Front)', en: 'FRONT SIDE' },
  'MẶT SAU (Back)': { vi: 'MẶT SAU (Back)', en: 'BACK SIDE' },
  'Lật Mặt Thẻ 3D': { vi: 'Lật Mặt Thẻ 3D', en: '3D Flip Card' },
  'Đang hiển thị:': { vi: 'Đang hiển thị:', en: 'Currently showing:' },
  'Đã Tải Lên Thành Công': { vi: 'Đã Tải Lên Thành Công', en: 'Successfully Uploaded' },
  'Chưa Có Ảnh Chụp': { vi: 'Chưa Có Ảnh Chụp', en: 'No Photo Uploaded' },
  'Bấm hoặc kéo thả ảnh chụp thật': { vi: 'Bấm hoặc kéo thả ảnh chụp thật', en: 'Click or drag and drop real photo' },
  'Chụp rõ nét 4 góc, đủ ánh sáng, không bị lóa': { vi: 'Chụp rõ nét 4 góc, đủ ánh sáng, không bị lóa', en: 'Capture all 4 corners clearly, sufficient lighting, no glare' },
  'Thay Ảnh Mặt Trước': { vi: 'Thay Ảnh Mặt Trước', en: 'Change Front Photo' },
  'Thay Ảnh Mặt Sau': { vi: 'Thay Ảnh Mặt Sau', en: 'Change Back Photo' },
  'Tải Ảnh Mặt Trước': { vi: 'Tải Ảnh Mặt Trước', en: 'Upload Front Photo' },
  'Tải Ảnh Mặt Sau': { vi: 'Tải Ảnh Mặt Sau', en: 'Upload Back Photo' },
  'Tải Lên Cả 2 Mặt Để Kích Hoạt OCR': { vi: 'Tải Lên Cả 2 Mặt Để Kích Hoạt OCR', en: 'Upload Both Sides to Enable OCR' },
  'Bắt Đầu Đọc Thông Tin Thẻ Tự Động': { vi: 'Bắt Đầu Đọc Thông Tin Thẻ Tự Động', en: 'Start Automatic Card Data Scan' },
  'Đang Quét OCR & Trích Xuất Dữ Liệu...': { vi: 'Đang Quét OCR & Trích Xuất Dữ Liệu...', en: 'Scanning OCR & Extracting Data...' },
  'Quét Lại Từ Đầu': { vi: 'Quét Lại Từ Đầu', en: 'Scan Again from Beginning' },
  'Hoàn Tất & Lưu Hồ Sơ': { vi: 'Hoàn Tất & Lưu Hồ Sơ', en: 'Complete & Save Profile' },
  'Chưa Nhận Diện': { vi: 'Chưa Nhận Diện', en: 'Not Yet Detected' },
  'Đang Quét AI': { vi: 'Đang Quét AI', en: 'AI Scanning' },
  'Đã Quét Thành Công': { vi: 'Đã Quét Thành Công', en: 'Scanned Successfully' },
  'Cần Quét Lại': { vi: 'Cần Quét Lại', en: 'Needs Rescan' },
  'Dữ Liệu Pháp Lý Trích Xuất Từ CCCD': { vi: 'Dữ Liệu Pháp Lý Trích Xuất Từ CCCD', en: 'Legal Data Extracted from Citizen ID' },
  'Số CCCD (12 số):': { vi: 'Số CCCD (12 số):', en: 'Citizen ID No (12 digits):' },
  'Quê quán:': { vi: 'Quê quán:', en: 'Place of Origin:' },
  'Nơi thường trú:': { vi: 'Nơi thường trú:', en: 'Permanent Residence:' },
  'Thu Thập Dữ Liệu Khuôn Mặt e-KYC Chuẩn Ngân Hàng': { vi: 'Thu Thập Dữ Liệu Khuôn Mặt e-KYC Chuẩn Ngân Hàng', en: 'Bank-Grade e-KYC Face Biometric Enrollment' },
  'Chụp 4 góc đa chiều (Chính diện, Nghiêng trái, Nghiêng phải, Hơi ngẩng) để kích hoạt FaceID chính thức.': { vi: 'Chụp 4 góc đa chiều (Chính diện, Nghiêng trái, Nghiêng phải, Hơi ngẩng) để kích hoạt FaceID chính thức.', en: 'Capture 4 multi-dimensional angles (Front, Left, Right, Tilt up) for official FaceID activation.' },
  'Đổi Góc Chụp': { vi: 'Đổi Góc Chụp', en: 'Change Angle' },
  'Xem Lại': { vi: 'Xem Lại', en: 'Review' },
  'Đạt chuẩn e-KYC': { vi: 'Đạt chuẩn e-KYC', en: 'Meets e-KYC standards' },
  'Đủ ánh sáng': { vi: 'Đủ ánh sáng', en: 'Good lighting' },
  'Không lóa': { vi: 'Không lóa', en: 'No glare' },
  'Không đeo kính râm': { vi: 'Không đeo kính râm', en: 'No sunglasses' },
  'Vui lòng căn chỉnh khuôn mặt vào giữa khung hình, giữ thẳng đầu.': { vi: 'Vui lòng căn chỉnh khuôn mặt vào giữa khung hình, giữ thẳng đầu.', en: 'Please align your face in the center of the frame and keep your head straight.' },
  'Góc Chính Diện (0°)': { vi: 'Góc Chính Diện (0°)', en: 'Front Angle (0°)' },
  'Nghiêng Trái (30°)': { vi: 'Nghiêng Trái (30°)', en: 'Turn Left (30°)' },
  'Nghiêng Phải (30°)': { vi: 'Nghiêng Phải (30°)', en: 'Turn Right (30°)' },
  'Hơi Ngẩng Nhẹ (15°)': { vi: 'Hơi Ngẩng Nhẹ (15°)', en: 'Slightly Tilt Up (15°)' },
  'Chụp Góc Này': { vi: 'Chụp Góc Này', en: 'Capture This Angle' },
  'Chụp Lại Góc Này': { vi: 'Chụp Lại Góc Này', en: 'Retake This Angle' },
  'Bộ Sưu Tập 4 Góc Khuôn Mặt e-KYC': { vi: 'Bộ Sưu Tập 4 Góc Khuôn Mặt e-KYC', en: '4-Angle e-KYC Face Dossier' },
  'Hoàn Tất Đăng Ký Sinh Trắc Học': { vi: 'Hoàn Tất Đăng Ký Sinh Trắc Học', en: 'Complete Biometric Enrollment' },
  'Đang Lưu Trữ Dữ Liệu Sinh Trắc Học...': { vi: 'Đang Lưu Trữ Dữ Liệu Sinh Trắc Học...', en: 'Saving Biometric Data...' },
  'Hồ Sơ Ảnh Chụp CCCD Thật (e-KYC)': { vi: 'Hồ Sơ Ảnh Chụp CCCD Thật (e-KYC)', en: 'Actual ID Card Dossier (e-KYC)' },
  'Mặt Trước': { vi: 'Mặt Trước', en: 'Front Side' },
  'Mặt Sau': { vi: 'Mặt Sau', en: 'Back Side' },
  'Tải Ảnh Chụp Thật': { vi: 'Tải Ảnh Chụp Thật', en: 'Upload Actual Photo' },
  'Đóng Cửa Sổ': { vi: 'Đóng Cửa Sổ', en: 'Close Window' },
  'Chỉ hiển thị bản gốc ảnh chụp thật do cư dân cung cấp khi đăng ký e-KYC.': { vi: 'Chỉ hiển thị bản gốc ảnh chụp thật do cư dân cung cấp khi đăng ký e-KYC.', en: 'Only original photo files uploaded by resident during e-KYC registration are shown.' },
  'Cư dân chưa tải lên ảnh chụp thật cho mặt này của thẻ Căn cước công dân. Hệ thống tuyệt đối không tự tạo ảnh giả mạo.': { vi: 'Cư dân chưa tải lên ảnh chụp thật cho mặt này của thẻ Căn cước công dân. Hệ thống tuyệt đối không tự tạo ảnh giả mạo.', en: 'Resident has not uploaded the actual photo for this side of the ID card. The system strictly does not synthesize fake images.' },
  'HOTLINE KỸ THUẬT 24/7': { vi: 'HOTLINE KỸ THUẬT 24/7', en: '24/7 TECHNICAL HOTLINE' },
  'Xem tất cả dịch vụ & sự cố': { vi: 'Xem tất cả dịch vụ & sự cố', en: 'View all services & issues' },
  'Thông báo hệ thống': { vi: 'Thông báo hệ thống', en: 'System notifications' },
  'Chưa có thông báo mới': { vi: 'Chưa có thông báo mới', en: 'No new notifications' },
  'Quản Lý Cư Dân • Căn Hộ Đang Sinh Sống': { vi: 'Quản Lý Cư Dân • Căn Hộ Đang Sinh Sống', en: 'Resident Management • Occupied Unit' },
  'Bàn Giao Căn Hộ • Đón Cư Dân Mới': { vi: 'Bàn Giao Căn Hộ • Đón Cư Dân Mới', en: 'Apartment Handover • Welcoming New Resident' },
  'Thông Tin Cư Dân Căn Hộ': { vi: 'Thông Tin Cư Dân Căn Hộ', en: 'Resident Profile for Unit' },
  'Bàn Giao Căn Hộ': { vi: 'Bàn Giao Căn Hộ', en: 'Handover Apartment' },
  'Họ và tên chủ hộ': { vi: 'Họ và tên chủ hộ', en: 'Owner Full Name' },
  'Số điện thoại liên hệ': { vi: 'Số điện thoại liên hệ', en: 'Contact Phone Number' },
  'Dùng làm tài khoản đăng nhập Cổng Cư Dân': { vi: 'Dùng làm tài khoản đăng nhập Cổng Cư Dân', en: 'Used as Resident Portal login account' },
  'Số CCCD / Hộ chiếu (12 số)': { vi: 'Số CCCD / Hộ chiếu (12 số)', en: 'Citizen ID / Passport No (12 digits)' },
  'Dùng để xác thực danh tính cư dân': { vi: 'Dùng để xác thực danh tính cư dân', en: 'Used for resident identity verification' },
  'Email nhận thông báo & hóa đơn': { vi: 'Email nhận thông báo & hóa đơn', en: 'Notification & Invoice Email' },
  'Địa chỉ thường trú / Quê quán': { vi: 'Địa chỉ thường trú / Quê quán', en: 'Permanent Residence / Place of Origin' },
  'Ảnh đại diện cư dân': { vi: 'Ảnh đại diện cư dân', en: 'Resident Avatar Photo' },
  'Hình ảnh nhận diện trên ứng dụng và hệ thống an ninh': { vi: 'Hình ảnh nhận diện trên ứng dụng và hệ thống an ninh', en: 'Identification portrait on app and security system' },
  'Mã biên bản:': { vi: 'Mã biên bản:', en: 'Protocol code:' },
  'BAN QUẢN LÝ LƯU TRỮ': { vi: 'BAN QUẢN LÝ LƯU TRỮ', en: 'MANAGEMENT ARCHIVE' },
  'Ngày bàn giao': { vi: 'Ngày bàn giao', en: 'Handover Date' },
  'Nhân viên BQL phụ trách bàn giao': { vi: 'Nhân viên BQL phụ trách bàn giao', en: 'Handover Officer' },
  'Số lượng chìa khóa': { vi: 'Số lượng chìa khóa', en: 'Physical Keys Count' },
  'Khóa cửa chính, khóa phòng, khóa hòm thư': { vi: 'Khóa cửa chính, khóa phòng, khóa hòm thư', en: 'Main door key, room keys, mailbox key' },
  'Số thẻ thang máy / thẻ từ': { vi: 'Số thẻ thang máy / thẻ từ', en: 'Elevator & Access Cards Count' },
  'Thẻ sử dụng thang máy và các tiện ích tòa nhà': { vi: 'Thẻ sử dụng thang máy và các tiện ích tòa nhà', en: 'Cards for elevator and building amenities access' },
  'Số điện ban đầu (kWh)': { vi: 'Số điện ban đầu (kWh)', en: 'Initial Electric Meter (kWh)' },
  'Mốc bắt đầu tính tiền điện tháng đầu tiên': { vi: 'Mốc bắt đầu tính tiền điện tháng đầu tiên', en: 'Baseline for first month electricity bill' },
  'Số nước ban đầu (m³)': { vi: 'Số nước ban đầu (m³)', en: 'Initial Water Meter (m³)' },
  'Mốc bắt đầu tính tiền nước sinh hoạt': { vi: 'Mốc bắt đầu tính tiền nước sinh hoạt', en: 'Baseline for first month water consumption bill' },
  'Ghi chú & tình trạng căn hộ khi bàn giao': { vi: 'Ghi chú & tình trạng căn hộ khi bàn giao', en: 'Handover Notes & Apartment Condition' },
  'Kích hoạt tài khoản Cổng Cư Dân tự động': { vi: 'Kích hoạt tài khoản Cổng Cư Dân tự động', en: 'Automatic Resident Portal Account Activation' },
  '← Quay Lại Thông Tin Cư Dân': { vi: '← Quay Lại Thông Tin Cư Dân', en: '← Back to Resident Profile' },
  'Lưu Thông Tin Cư Dân': { vi: 'Lưu Thông Tin Cư Dân', en: 'Save Resident Profile' },
  'Hoàn Tất Bàn Giao & Cấp Quyền': { vi: 'Hoàn Tất Bàn Giao & Cấp Quyền', en: 'Complete Handover & Grant Access' },
  'Đang lưu thông tin...': { vi: 'Đang lưu thông tin...', en: 'Saving details...' },
  'SKYLINE SMART RESIDENCE • BAN QUẢN LÝ': { vi: 'SKYLINE SMART RESIDENCE • BAN QUẢN LÝ', en: 'SKYLINE SMART RESIDENCE • MANAGEMENT' },
  'CẬP NHẬT HỒ SƠ CƯ DÂN THÀNH CÔNG': { vi: 'CẬP NHẬT HỒ SƠ CƯ DÂN THÀNH CÔNG', en: 'RESIDENT PROFILE UPDATED SUCCESSFULLY' },
  'BÀN GIAO CĂN HỘ THÀNH CÔNG': { vi: 'BÀN GIAO CĂN HỘ THÀNH CÔNG', en: 'APARTMENT HANDOVER COMPLETED' },
  'Mã Biên Bản:': { vi: 'Mã Biên Bản:', en: 'Protocol Code:' },
  'ĐÃ CẬP NHẬT THÔNG TIN CHỦ HỘ': { vi: 'ĐÃ CẬP NHẬT THÔNG TIN CHỦ HỘ', en: 'OWNER INFO UPDATED' },
  'ĐÃ HOÀN TẤT THỦ TỤC BÀN GIAO': { vi: 'ĐÃ HOÀN TẤT THỦ TỤC BÀN GIAO', en: 'HANDOVER PROCEDURE COMPLETED' },
  'ĐÃ KÍCH HOẠT TÀI KHOẢN CƯ DÂN': { vi: 'ĐÃ KÍCH HOẠT TÀI KHOẢN CƯ DÂN', en: 'RESIDENT ACCOUNT ACTIVATED' },
  'CĂN HỘ & VỊ TRÍ:': { vi: 'CĂN HỘ & VỊ TRÍ:', en: 'APARTMENT & LOCATION:' },
  'CHỦ HỘ:': { vi: 'CHỦ HỘ:', en: 'OWNER:' },
  'CHÌA KHÓA & THẺ TỪ:': { vi: 'CHÌA KHÓA & THẺ TỪ:', en: 'KEYS & RFID CARDS:' },
  'CHỈ SỐ BAN ĐẦU:': { vi: 'CHỈ SỐ BAN ĐẦU:', en: 'INITIAL METERS:' },
  'Đã bàn giao đầy đủ': { vi: 'Đã bàn giao đầy đủ', en: 'Fully handed over' },
  'Phụ trách:': { vi: 'Phụ trách:', en: 'Officer:' },
  'Tài Khoản Đăng Nhập Cổng Cư Dân Sẵn Sàng': { vi: 'Tài Khoản Đăng Nhập Cổng Cư Dân Sẵn Sàng', en: 'Resident Portal Login Account Ready' },
  'VAI TRÒ: CHỦ HỘ': { vi: 'VAI TRÒ: CHỦ HỘ', en: 'ROLE: OWNER' },
  'Tên đăng nhập (Số điện thoại):': { vi: 'Tên đăng nhập (Số điện thoại):', en: 'Username (Phone Number):' },
  'Số CCCD định danh:': { vi: 'Số CCCD định danh:', en: 'National ID Number:' },
  'Mật khẩu mặc định:': { vi: 'Mật khẩu mặc định:', en: 'Default Password:' },
  'Sao Chép Thông Tin Để Gửi Cư Dân': { vi: 'Sao Chép Thông Tin Để Gửi Cư Dân', en: 'Copy Credentials to Send to Resident' },
  '✓ Đã Sao Chép Thông Tin!': { vi: '✓ Đã Sao Chép Thông Tin!', en: '✓ Credentials Copied!' },
  'In Biên Bản (PDF)': { vi: 'In Biên Bản (PDF)', en: 'Print Protocol (PDF)' },
  'Chủ Sở Hữu / Chủ Hộ Đang Sinh Sống': { vi: 'Chủ Sở Hữu / Chủ Hộ Đang Sinh Sống', en: 'Primary Owner / Currently Living' },
  'e-KYC Đã Xác Thực ✓': { vi: 'e-KYC Đã Xác Thực ✓', en: 'e-KYC Verified ✓' },
  'Thu Hồi / Cư Dân Chuyển Đi': { vi: 'Thu Hồi / Cư Dân Chuyển Đi', en: 'Revoke / Resident Relocation' },
  'Ngày Bàn Giao:': { vi: 'Ngày Bàn Giao:', en: 'Handover Date:' },
  'Nơi Cấp:': { vi: 'Nơi Cấp:', en: 'Issue Place:' },
  'Hồ Sơ Biên Bản Bàn Giao Căn Hộ': { vi: 'Hồ Sơ Biên Bản Bàn Giao Căn Hộ', en: 'Apartment Handover Protocol Dossier' },
  '✓ ĐÃ NGHIỆM THU': { vi: '✓ ĐÃ NGHIỆM THU', en: '✓ ACCEPTED' },
  'Mã Biên Bản BQL:': { vi: 'Mã Biên Bản BQL:', en: 'Management Protocol Code:' },
  'Cán Bộ Bàn Giao:': { vi: 'Cán Bộ Bàn Giao:', en: 'Handover Officer:' },
  'Chìa Khóa Cơ & Thẻ Từ:': { vi: 'Chìa Khóa Cơ & Thẻ Từ:', en: 'Keys & RFID Cards:' },
  'Chỉ Số Bàn Giao Ban Đầu:': { vi: 'Chỉ Số Bàn Giao Ban Đầu:', en: 'Initial Handover Meters:' },
  'Ghi chú hiện trạng nghiệm thu:': { vi: 'Ghi chú hiện trạng nghiệm thu:', en: 'Handover inspection notes:' },
  'Xác Nhận Thu Hồi Căn Hộ': { vi: 'Xác Nhận Thu Hồi Căn Hộ', en: 'Confirm Revoking Apartment' },
  'Chuyển Về Căn Trống?': { vi: 'Chuyển Về Căn Trống?', en: 'Reset to Vacant?' },
  'Danh Sách Nhân Khẩu Cùng Cư Trú': { vi: 'Danh Sách Nhân Khẩu Cùng Cư Trú', en: 'Co-occupants & Family Members List' },
  'Chưa đăng ký thêm thành viên gia đình.': { vi: 'Chưa đăng ký thêm thành viên gia đình.', en: 'No family members registered yet.' },
  'Căn Hộ Hiện Đang Trống': { vi: 'Căn Hộ Hiện Đang Trống', en: 'Apartment is Currently Vacant' },
  'Bàn Giao Chìa Khóa Cho Chủ Hộ Mới': { vi: 'Bàn Giao Chìa Khóa Cho Chủ Hộ Mới', en: 'Handover Keys to New Owner' },
  'Danh Sách Phương Tiện Đăng Ký Đậu Tầng Hầm (B1/B2)': { vi: 'Danh Sách Phương Tiện Đăng Ký Đậu Tầng Hầm (B1/B2)', en: 'Basement (B1/B2) Parking Vehicle Registry' },
  'Căn hộ chưa đăng ký phương tiện đậu tại tầng hầm.': { vi: 'Căn hộ chưa đăng ký phương tiện đậu tại tầng hầm.', en: 'No registered vehicles for basement parking.' },
  'Kỳ Phí Quản Lý & Dịch Vụ': { vi: 'Kỳ Phí Quản Lý & Dịch Vụ', en: 'Management Fee & Service Period' },
  'Đổi Thành Chưa Nộp': { vi: 'Đổi Thành Chưa Nộp', en: 'Mark as Unpaid' },
  'Xác Nhận Đã Thu Tiền': { vi: 'Xác Nhận Đã Thu Tiền', en: 'Confirm Payment' },
  'Phí quản lý vận hành chung cư': { vi: 'Phí quản lý vận hành chung cư', en: 'Building operational management fee' },
  'Phí trông giữ phương tiện tầng hầm': { vi: 'Phí trông giữ phương tiện tầng hầm', en: 'Basement vehicle parking fee' },
  'Phí dịch vụ tiện ích phát sinh': { vi: 'Phí dịch vụ tiện ích phát sinh', en: 'Incidental utility service fees' },
  'Tổng Cộng Cần Thu': { vi: 'Tổng Cộng Cần Thu', en: 'Total Due' },
  'Hạn nộp định kỳ:': { vi: 'Hạn nộp định kỳ:', en: 'Due date:' },
  'Ngày nộp gần nhất:': { vi: 'Ngày nộp gần nhất:', en: 'Last payment date:' },
  'Chưa phát sinh bảng kê hóa đơn cho căn hộ này.': { vi: 'Chưa phát sinh bảng kê hóa đơn cho căn hộ này.', en: 'No billing invoices generated yet for this apartment.' },
  'Nhật Ký Kiểm Tra Kỹ Thuật & Bảo Trì Định Kỳ': { vi: 'Nhật Ký Kiểm Tra Kỹ Thuật & Bảo Trì Định Kỳ', en: 'Technical Inspection & Maintenance Log' },
  'Chưa ghi nhận lịch sử bảo trì cho căn hộ này.': { vi: 'Chưa ghi nhận lịch sử bảo trì cho căn hộ này.', en: 'No maintenance history recorded for this apartment.' },
  'Mã định danh:': { vi: 'Mã định danh:', en: 'ID Code:' },
  'Đóng Hồ Sơ': { vi: 'Đóng Hồ Sơ', en: 'Close Dossier' },
  'Cập Nhật Thông Tin Không Gian': { vi: 'Cập Nhật Thông Tin Không Gian', en: 'Update Space & Specifications' },
  'Chỉnh Sửa Căn Hộ': { vi: 'Chỉnh Sửa Căn Hộ', en: 'Edit Apartment' },
  'Trạng Thái Căn Hộ': { vi: 'Trạng Thái Căn Hộ', en: 'Apartment Status' },
  'Loại Căn Hộ': { vi: 'Loại Căn Hộ', en: 'Apartment Type' },
  'Thông Thủy (m²)': { vi: 'Thông Thủy (m²)', en: 'Net Usable (m²)' },
  'Tim Tường (m²)': { vi: 'Tim Tường (m²)', en: 'Gross Area (m²)' },
  'Phòng Ngủ': { vi: 'Phòng Ngủ', en: 'Bedrooms' },
  'Phòng Tắm': { vi: 'Phòng Tắm', en: 'Bathrooms' },
  'Hướng Ban Công': { vi: 'Hướng Ban Công', en: 'Balcony Facing' },
  'Định Giá Căn Hộ (Tỷ VNĐ)': { vi: 'Định Giá Căn Hộ (Tỷ VNĐ)', en: 'Valuation (Billion VND)' },
  'Ghi Chú Kỹ Thuật': { vi: 'Ghi Chú Kỹ Thuật', en: 'Technical Notes & Description' },
  'Xóa Căn Hộ Này': { vi: 'Xóa Căn Hộ Này', en: 'Delete This Unit' },
  'Lưu Thay Đổi': { vi: 'Lưu Thay Đổi', en: 'Save Changes' },
  // e-KYC Verification & Appraisal Modal
  'Đối Chiếu Khuôn Mặt Cư Dân & Thẻ Căn Cước:': { vi: 'Đối Chiếu Khuôn Mặt Cư Dân & Thẻ Căn Cước:', en: 'Resident Facial & ID Card Matching:' },
  'Đối Chiếu Khuôn Mặt Cư Dân &amp; Thẻ Căn Cước:': { vi: 'Đối Chiếu Khuôn Mặt Cư Dân & Thẻ Căn Cước:', en: 'Resident Facial & ID Card Matching:' },
  'Đối Chiếu Khuôn Mặt Cư Dân & Thẻ Căn Cước': { vi: 'Đối Chiếu Khuôn Mặt Cư Dân & Thẻ Căn Cước', en: 'Resident Facial & ID Card Matching' },
  'Đối Chiếu Khuôn Mặt Cư Dân &amp; Thẻ Căn Cước': { vi: 'Đối Chiếu Khuôn Mặt Cư Dân & Thẻ Căn Cước', en: 'Resident Facial & ID Card Matching' },
  'Hệ Thống Thẩm Định BQL • Căn Hộ': { vi: 'Hệ Thống Thẩm Định BQL • Căn Hộ', en: 'Management System Appraisal • Apartment' },
  '✓ ĐÃ KÍCH HOẠT HỆ THỐNG': { vi: '✓ ĐÃ KÍCH HOẠT HỆ THỐNG', en: '✓ SYSTEM ACTIVATED' },
  '⚠ YÊU CẦU CẬP NHẬT': { vi: '⚠ YÊU CẦU CẬP NHẬT', en: '⚠ UPDATE REQUIRED' },
  '⏳ CHỜ THẨM ĐỊNH': { vi: '⏳ CHỜ THẨM ĐỊNH', en: '⏳ PENDING APPRAISAL' },
  'Được Chủ Hộ Bảo Lãnh': { vi: 'Được Chủ Hộ Bảo Lãnh', en: 'Owner Sponsored' },
  'Phê duyệt thành công!': { vi: 'Phê duyệt thành công!', en: 'Approval Successful!' },
  'Đã kích hoạt sinh trắc học FaceID và nạp dữ liệu nhận diện vào Camera AI cổng Barrier và Thang máy toà nhà.': { vi: 'Đã kích hoạt sinh trắc học FaceID và nạp dữ liệu nhận diện vào Camera AI cổng Barrier và Thang máy toà nhà.', en: 'FaceID biometrics activated and recognition data loaded to AI barrier gate and building elevators.' },
  'Thời gian thực': { vi: 'Thời gian thực', en: 'Real-time' },
  'Hồ Sơ Đã Bị Từ Chối / Yêu Cầu Cung Cấp Lại': { vi: 'Hồ Sơ Đã Bị Từ Chối / Yêu Cầu Cung Cấp Lại', en: 'Dossier Rejected / Resubmission Required' },
  'Lý do từ chối gửi cư dân:': { vi: 'Lý do từ chối gửi cư dân:', en: 'Rejection reason sent to resident:' },
  'Ảnh chụp CCCD không đạt tiêu chuẩn rõ nét.': { vi: 'Ảnh chụp CCCD không đạt tiêu chuẩn rõ nét.', en: 'Citizen ID photo does not meet clarity standards.' },
  'Xử lý lúc:': { vi: 'Xử lý lúc:', en: 'Processed at:' },
  'Bởi:': { vi: 'Bởi:', en: 'By:' },
  'Ảnh Chân Dung Nhận Diện:': { vi: 'Ảnh Chân Dung Nhận Diện:', en: 'Facial Portrait Photo:' },
  'Độ Trùng Khớp:': { vi: 'Độ Trùng Khớp:', en: 'Match Rate:' },
  'CHÂN DUNG CHÍNH DIỆN': { vi: 'CHÂN DUNG CHÍNH DIỆN', en: 'FRONT FACIAL PORTRAIT' },
  'Bộ Mẫu Thu Thập 4 Góc Mặt:': { vi: 'Bộ Mẫu Thu Thập 4 Góc Mặt:', en: '4-Angle Face Enrollment Set:' },
  'Liveness 100%': { vi: 'Liveness 100%', en: 'Liveness 100%' },
  'Chính diện': { vi: 'Chính diện', en: 'Front' },
  'Trái (-25°)': { vi: 'Trái (-25°)', en: 'Left (-25°)' },
  'Phải (+25°)': { vi: 'Phải (+25°)', en: 'Right (+25°)' },
  'Dữ liệu nhận diện khuôn mặt đã sẵn sàng kích hoạt quyền ra vào sảnh & thang máy': { vi: 'Dữ liệu nhận diện khuôn mặt đã sẵn sàng kích hoạt quyền ra vào sảnh & thang máy', en: 'Face biometric data ready to activate lobby & elevator access' },
  'Ảnh chân dung chụp trực tiếp từ thiết bị': { vi: 'Ảnh chân dung chụp trực tiếp từ thiết bị', en: 'Portrait photo captured directly from device' },
  'Thẻ Căn Cước Công Dân:': { vi: 'Thẻ Căn Cước Công Dân:', en: 'Citizen ID Card:' },
  'Mặt trước CCCD': { vi: 'Mặt trước CCCD', en: 'Citizen ID Front' },
  'Mặt sau CCCD': { vi: 'Mặt sau CCCD', en: 'Citizen ID Back' },
  'Chưa Tải Ảnh Mặt Trước CCCD': { vi: 'Chưa Tải Ảnh Mặt Trước CCCD', en: 'Front ID Photo Not Uploaded' },
  'Chưa Tải Ảnh Mặt Sau CCCD': { vi: 'Chưa Tải Ảnh Mặt Sau CCCD', en: 'Back ID Photo Not Uploaded' },
  'Số CCCD:': { vi: 'Số CCCD:', en: 'Citizen ID No:' },
  'Chưa cung cấp': { vi: 'Chưa cung cấp', en: 'Not provided' },
  'MẶT TRƯỚC (CÓ ẢNH & SỐ ĐỊNH DANH)': { vi: 'MẶT TRƯỚC (CÓ ẢNH & SỐ ĐỊNH DANH)', en: 'FRONT (PHOTO & CITIZEN ID NO)' },
  'MẶT TRƯỚC (CÓ ẢNH &amp; SỐ ĐỊNH DANH)': { vi: 'MẶT TRƯỚC (CÓ ẢNH & SỐ ĐỊNH DANH)', en: 'FRONT (PHOTO & CITIZEN ID NO)' },
  'MẶT SAU (CHIP ĐIỆN TỬ & VÂN TAY)': { vi: 'MẶT SAU (CHIP ĐIỆN TỬ & VÂN TAY)', en: 'BACK (CHIP & FINGERPRINT)' },
  'MẶT SAU (CHIP ĐIỆN TỬ &amp; VÂN TAY)': { vi: 'MẶT SAU (CHIP ĐIỆN TỬ & VÂN TAY)', en: 'BACK (CHIP & FINGERPRINT)' },
  'Nhấp vào ảnh để phóng to toàn màn hình': { vi: 'Nhấp vào ảnh để phóng to toàn màn hình', en: 'Click image to expand fullscreen' },
  '✓ Mặt trước Đầy Đủ': { vi: '✓ Mặt trước Đầy Đủ', en: '✓ Front Complete' },
  '⚠ Chưa Có Mặt Trước': { vi: '⚠ Chưa Có Mặt Trước', en: '⚠ Front Missing' },
  '✓ Mặt Sau Đầy Đủ': { vi: '✓ Mặt Sau Đầy Đủ', en: '✓ Back Complete' },
  '⚠ Chưa Có Mặt Sau': { vi: '⚠ Chưa Có Mặt Sau', en: '⚠ Back Missing' },
  'Đạt Tiêu Chuẩn Xác Thực & Đủ Điều Kiện Kích Hoạt Quyền Ra Vào': { vi: 'Đạt Tiêu Chuẩn Xác Thực & Đủ Điều Kiện Kích Hoạt Quyền Ra Vào', en: 'Verification Standard Met & Eligible for Access Activation' },
  'Đạt Tiêu Chuẩn Xác Thực &amp; Đủ Điều Kiện Kích Hoạt Quyền Ra Vào': { vi: 'Đạt Tiêu Chuẩn Xác Thực & Đủ Điều Kiện Kích Hoạt Quyền Ra Vào', en: 'Verification Standard Met & Eligible for Access Activation' },
  'Cần Kiểm Tra: Ảnh Khuôn Mặt Chưa Khớp Hoặc Thẻ CCCD Mờ': { vi: 'Cần Kiểm Tra: Ảnh Khuôn Mặt Chưa Khớp Hoặc Thẻ CCCD Mờ', en: 'Needs Review: Face Mismatch or Blurry ID' },
  'Ảnh khuôn mặt trùng khớp với chân dung trên CCCD': { vi: 'Ảnh khuôn mặt trùng khớp với chân dung trên CCCD', en: 'Face portrait matches Citizen ID photo' },
  'Thẻ CCCD hợp lệ': { vi: 'Thẻ CCCD hợp lệ', en: 'Valid Citizen ID card' },
  'Vui lòng kiểm tra lại ảnh thẻ CCCD hoặc yêu cầu cư dân nộp lại chân dung rõ nét.': { vi: 'Vui lòng kiểm tra lại ảnh thẻ CCCD hoặc yêu cầu cư dân nộp lại chân dung rõ nét.', en: 'Please review ID card photo or request resident to resubmit a sharp portrait.' },
  'Độ Khớp:': { vi: 'Độ Khớp:', en: 'Match Rate:' },
  'Bảng Đối Chiếu Thông Tin Khai Báo & Trích Xuất Thẻ:': { vi: 'Bảng Đối Chiếu Thông Tin Khai Báo & Trích Xuất Thẻ:', en: 'Declared Info & ID Extraction Comparison:' },
  'Bảng Đối Chiếu Thông Tin Khai Báo &amp; Trích Xuất Thẻ:': { vi: 'Bảng Đối Chiếu Thông Tin Khai Báo & Trích Xuất Thẻ:', en: 'Declared Info & ID Extraction Comparison:' },
  'Căn Hộ &amp; Vai Trò:': { vi: 'Căn Hộ & Vai Trò:', en: 'Apartment & Role:' },
  'Ngày Cấp &amp; Nơi Cấp:': { vi: 'Ngày Cấp & Nơi Cấp:', en: 'Issue Date & Place:' },
  'Xác Nhận &amp; Kích Hoạt Quyền Ra Vào': { vi: 'Xác Nhận & Kích Hoạt Quyền Ra Vào', en: 'Confirm & Activate Access' },
  'Yêu Cầu Cư Dân Cập Nhật Lại Hồ Sơ': { vi: 'Yêu Cầu Cư Dân Cập Nhật Lại Hồ Sơ', en: 'Request Resident to Update Dossier' },
  'Chọn hoặc nhập lý do cần bổ sung (Gửi thông báo tới cư dân):': { vi: 'Chọn hoặc nhập lý do cần bổ sung (Gửi thông báo tới cư dân):', en: 'Select or enter reason for update (Sent to resident):' },
  'Ảnh chụp CCCD bị mờ/lóa sáng/mất góc': { vi: 'Ảnh chụp CCCD bị mờ/lóa sáng/mất góc', en: 'ID photo is blurry/glared/cropped' },
  'Số CCCD không trùng khớp hồ sơ': { vi: 'Số CCCD không trùng khớp hồ sơ', en: 'ID number does not match registration' },
  'Ảnh chân dung chưa trùng khớp ảnh CCCD': { vi: 'Ảnh chân dung chưa trùng khớp ảnh CCCD', en: 'Portrait does not match ID card photo' },
  'Chưa cung cấp đủ 2 mặt thẻ CCCD': { vi: 'Chưa cung cấp đủ 2 mặt thẻ CCCD', en: 'Missing one or both sides of ID card' },
  'Thẻ CCCD đã hết hạn sử dụng': { vi: 'Thẻ CCCD đã hết hạn sử dụng', en: 'Citizen ID card has expired' },
  'Ghi chú chi tiết lý do gửi cư dân...': { vi: 'Ghi chú chi tiết lý do gửi cư dân...', en: 'Detailed notes sent to resident...' },
  'Xác Nhận Từ Chối': { vi: 'Xác Nhận Từ Chối', en: 'Confirm Rejection' },
  'Tạm Khóa / Thu Hồi Quyền Ra Vào FaceID': { vi: 'Tạm Khóa / Thu Hồi Quyền Ra Vào FaceID', en: 'Suspend / Revoke FaceID Access' },
  'Hành động này sẽ tạm khóa hoặc hủy quyền nhận diện khuôn mặt của cư dân tại sảnh đón và thang máy toà nhà.': { vi: 'Hành động này sẽ tạm khóa hoặc hủy quyền nhận diện khuôn mặt của cư dân tại sảnh đón và thang máy toà nhà.', en: 'This action will suspend or revoke resident facial recognition access at lobby and building elevators.' },
  'Lý do thu hồi quyền:': { vi: 'Lý do thu hồi quyền:', en: 'Revocation reason:' },
  'Hết thời hạn hợp đồng thuê / Chuyển nơi cư trú': { vi: 'Hết thời hạn hợp đồng thuê / Chuyển nơi cư trú', en: 'Lease expired / Relocated' },
  'Ban Quản Lý tạm thu hồi để đối soát lại hồ sơ': { vi: 'Ban Quản Lý tạm thu hồi để đối soát lại hồ sơ', en: 'Management temporary suspension for auditing' },
  'Phát hiện thông tin CCCD có sai lệch': { vi: 'Phát hiện thông tin CCCD có sai lệch', en: 'Discrepancy detected in ID information' },
  'Vi phạm quy định vận hành an ninh toà nhà': { vi: 'Vi phạm quy định vận hành an ninh toà nhà', en: 'Violation of building security regulations' },
  'Xác Nhận Thu Hồi': { vi: 'Xác Nhận Thu Hồi', en: 'Confirm Revocation' },
  'Xác Thực Cư Dân • Ban Quản Lý': { vi: 'Xác Thực Cư Dân • Ban Quản Lý', en: 'Resident Verification • Management' },
  'Kiểm tra và đối chiếu căn cước công dân với khuôn mặt cư dân trước khi kích hoạt quyền ra vào thang máy và sảnh đón.': { vi: 'Kiểm tra và đối chiếu căn cước công dân với khuôn mặt cư dân trước khi kích hoạt quyền ra vào thang máy và sảnh đón.', en: 'Inspect and match citizen ID card against resident facial portrait before activating lift and lobby access.' },
  'Làm Mới': { vi: 'Làm Mới', en: 'Refresh' },
  'Tổng Hồ Sơ Tiếp Nhận': { vi: 'Tổng Hồ Sơ Tiếp Nhận', en: 'Total Received Profiles' },
  'Đang Chờ Xác Thực': { vi: 'Đang Chờ Xác Thực', en: 'Pending Verification' },
  'Cần Cập Nhật / Chụp Lại': { vi: 'Cần Cập Nhật / Chụp Lại', en: 'Needs Update / Reshot' },
  'Tìm theo Căn hộ (CH-06), Tên, CCCD...': { vi: 'Tìm theo Căn hộ (CH-06), Tên, CCCD...', en: 'Search by Apartment (CH-06), Name, ID...' },
  'Không tìm thấy hồ sơ cư dân nào': { vi: 'Không tìm thấy hồ sơ cư dân nào', en: 'No resident profiles found' },
  'Hồ sơ gửi từ cư dân sẽ tự động xuất hiện tại đây theo thời gian thực.': { vi: 'Hồ sơ gửi từ cư dân sẽ tự động xuất hiện tại đây theo thời gian thực.', en: 'Resident submissions will appear here automatically in real time.' },
  'Kiểm Tra Đối Chiếu Chi Tiết': { vi: 'Kiểm Tra Đối Chiếu Chi Tiết', en: 'Detailed Verification Inspection' },
  'Xem mặt trước CCCD': { vi: 'Xem mặt trước CCCD', en: 'View ID Front' },
  'Xem mặt sau CCCD': { vi: 'Xem mặt sau CCCD', en: 'View ID Back' },
  'Trước': { vi: 'Trước', en: 'Front' },
  'Sau': { vi: 'Sau', en: 'Back' },
  'Cần Cập Nhật Lại': { vi: 'Cần Cập Nhật Lại', en: 'Needs Resubmission' },
  'Nộp lúc:': { vi: 'Nộp lúc:', en: 'Submitted at:' },
  'SĐT:': { vi: 'SĐT:', en: 'Phone:' },
  'Căn Hộ:': { vi: 'Căn Hộ:', en: 'Apartment:' },
  'hero.desc_auth': {
    vi: 'Dự án căn hộ hạng sang SKYLINE Smart Residence tại cụm 4 chung cư The Tropical (BS-07, BS-08, BS-09, BS-10) kiến tạo chuẩn sống tự động hóa hoàn chỉnh: Định danh sinh trắc học FaceID <0.5s, giám sát an ninh Vision AI và hệ thống dự báo bảo trì thông minh.',
    en: 'Luxury apartment project SKYLINE Smart Residence at 4 towers of The Tropical (BS-07, BS-08, BS-09, BS-10) pioneers complete automated living: FaceID biometrics <0.5s, Vision AI security monitoring, and predictive maintenance.'
  },
  'hero.desc_unauth': {
    vi: 'Dự án căn hộ hạng sang SKYLINE Smart Residence tại cụm 4 chung cư The Tropical (BS-07, BS-08, BS-09, BS-10) — định danh sinh trắc học FaceID, giám sát Vision AI và trợ lý ảo AI Concierge 24/7.',
    en: 'Luxury apartment project SKYLINE Smart Residence at 4 towers of The Tropical (BS-07, BS-08, BS-09, BS-10) — biometric FaceID access, Vision AI security, and 24/7 AI Concierge.'
  }
};

// =============================================================================
// FAST LOOKUP MAPS (O(1))
// =============================================================================
const VI_TO_EN_MAP = new Map<string, string>();
const EN_TO_VI_MAP = new Map<string, string>();

for (const [vi, en] of TRANSLATIONS_DATA) {
  const cleanVi = vi.trim();
  const cleanEn = en.trim();
  if (cleanVi && cleanEn) {
    VI_TO_EN_MAP.set(cleanVi.toLowerCase(), cleanEn);
    EN_TO_VI_MAP.set(cleanEn.toLowerCase(), cleanVi);
    if (cleanVi.includes('&amp;')) {
      const uVi = cleanVi.replace(/&amp;/g, '&');
      const uEn = cleanEn.replace(/&amp;/g, '&');
      VI_TO_EN_MAP.set(uVi.toLowerCase(), uEn);
      EN_TO_VI_MAP.set(uEn.toLowerCase(), uVi);
    }
    if (cleanVi.includes('&') && !cleanVi.includes('&amp;')) {
      const aVi = cleanVi.replace(/&/g, '&amp;');
      const aEn = cleanEn.replace(/&/g, '&amp;');
      VI_TO_EN_MAP.set(aVi.toLowerCase(), aEn);
      EN_TO_VI_MAP.set(aEn.toLowerCase(), aVi);
    }
  }
}

// Index KEY_DICTIONARY into lookup maps with highest priority
for (const [key, obj] of Object.entries(KEY_DICTIONARY)) {
  const cleanVi = obj.vi?.trim();
  const cleanEn = obj.en?.trim();
  if (cleanVi && cleanEn) {
    VI_TO_EN_MAP.set(cleanVi.toLowerCase(), cleanEn);
    EN_TO_VI_MAP.set(cleanEn.toLowerCase(), cleanVi);
    VI_TO_EN_MAP.set(key.toLowerCase(), cleanEn);
    EN_TO_VI_MAP.set(key.toLowerCase(), cleanVi);
    if (cleanVi.includes('&amp;')) {
      VI_TO_EN_MAP.set(cleanVi.replace(/&amp;/g, '&').toLowerCase(), cleanEn.replace(/&amp;/g, '&'));
      EN_TO_VI_MAP.set(cleanEn.replace(/&amp;/g, '&').toLowerCase(), cleanVi.replace(/&amp;/g, '&'));
    }
    if (cleanVi.includes('&') && !cleanVi.includes('&amp;')) {
      VI_TO_EN_MAP.set(cleanVi.replace(/&/g, '&amp;').toLowerCase(), cleanEn.replace(/&/g, '&amp;'));
      EN_TO_VI_MAP.set(cleanEn.replace(/&/g, '&amp;').toLowerCase(), cleanVi.replace(/&/g, '&amp;'));
    }
  }
}

// =============================================================================
// SAFE WHITESPACE & CHARACTER PRESERVATION HELPER
// =============================================================================
function preserveWhitespace(original: string, translated: string): string {
  if (!original) return translated;
  const match = original.match(/^(\s*)([\s\S]*?)(\s*)$/);
  if (!match) return translated;
  return match[1] + translated + match[3];
}

// =============================================================================
// STRUCTURAL & PATTERN TRANSLATION ENGINE
// =============================================================================
export function translateString(text: string, targetLang: Language): string {
  if (!text || typeof text !== 'string') return text;
  const trimmed = text.trim();
  if (!trimmed) return text;

  const lower = trimmed.toLowerCase();

  // 1. Direct O(1) Dictionary Lookup
  if (targetLang === 'en' && VI_TO_EN_MAP.has(lower)) {
    const translated = VI_TO_EN_MAP.get(lower)!;
    return preserveWhitespace(text, matchCase(trimmed, translated));
  }
  if (targetLang === 'vi' && EN_TO_VI_MAP.has(lower)) {
    const translated = EN_TO_VI_MAP.get(lower)!;
    return preserveWhitespace(text, matchCase(trimmed, translated));
  }

  // 1b. Multi-part Delimiters: " • ", " | ", " - ", " & ", " &amp; ", " và ", "\n"
  for (const sep of [' • ', ' | ', ' - ', ' & ', ' &amp; ', ' và ', '\n']) {
    if (trimmed.includes(sep)) {
      const parts = trimmed.split(sep);
      let changed = false;
      const translatedParts = parts.map(p => {
        const trans = translateString(p, targetLang);
        if (trans !== p) changed = true;
        return trans;
      });
      // CRITICAL: Prevent hybrid half-Vietnamese half-English outputs
      const vnCharRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
      const hasRemainingVn = targetLang === 'en' && translatedParts.some(p => vnCharRegex.test(p));
      if (changed && !hasRemainingVn) {
        return preserveWhitespace(text, translatedParts.join(sep));
      }
    }
  }

  // 1c. Multi-Sentence Paragraphs (period + space)
  if (trimmed.includes('. ') && !trimmed.match(/^\d+\.\s/)) {
    const sentences = trimmed.split(/(?<=\.)\s+/);
    if (sentences.length > 1) {
      let anyChanged = false;
      const transSentences = sentences.map(s => {
        const trans = translateString(s, targetLang);
        if (trans !== s) anyChanged = true;
        return trans;
      });
      const vnCharRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
      const hasRemainingVn = targetLang === 'en' && transSentences.some(s => vnCharRegex.test(s));
      if (anyChanged && !hasRemainingVn) {
        return preserveWhitespace(text, transSentences.join(' '));
      }
    }
  }

  // 2. Structural Patterns
  // Quotes: "...", '...'
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    const q = trimmed[0];
    const inner = trimmed.slice(1, -1);
    const trans = translateString(inner, targetLang);
    return preserveWhitespace(text, `${q}${trans}${q}`);
  }

  // Bullets, emojis & List markers: "* ", "- ", "+ ", "• ", "🟢 ", "🟡 ", "⚪ ", "🔴 "
  for (const b of ['* ', '- ', '+ ', '• ', '🟢 ', '🟡 ', '⚪ ', '🔴 ', '🔵 ', '✨ ', '🏛️ ', '🗑️ ', '💳 ', '📜 ']) {
    if (trimmed.startsWith(b)) {
      const inner = trimmed.slice(b.length);
      const trans = translateString(inner, targetLang);
      return preserveWhitespace(text, `${b}${trans}`);
    }
  }

  // Universal trailing parentheses: "Unit CH-06 (Chủ Hộ)", "Căn CH-06 (Chủ Hộ)", "Nguyễn Văn A (Chủ Hộ)", "Có Sẵn (3)", "Hồ Bơi (Miễn phí)"
  const trailingParen = trimmed.match(/^(.*?)\s*\(([^)]+)\)$/);
  if (trailingParen && !trimmed.startsWith('(')) {
    const mainPhrase = trailingParen[1].trim();
    const parenContent = trailingParen[2].trim();
    if (mainPhrase.length > 0 && parenContent.length > 0) {
      const transMain = translateString(mainPhrase, targetLang);
      const transParen = translateString(parenContent, targetLang);
      if (transMain !== mainPhrase || transParen !== parenContent) {
        return preserveWhitespace(text, `${transMain} (${transParen})`);
      }
    }
  }

  // Numbered prefixes: "1. ", "2. ", "10) "
  const numPrefix = trimmed.match(/^(\d+[\.\)]\s*)(.*)$/);
  if (numPrefix) {
    const prefix = numPrefix[1];
    const rest = numPrefix[2];
    const trans = translateString(rest, targetLang);
    return preserveWhitespace(text, `${prefix}${trans}`);
  }

  // Parentheses: "(Chính thức)", "(Chưa có)", "(Chủ Hộ)"
  if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
    const inner = trimmed.slice(1, -1).trim();
    const parenMap: Record<string, string> = {
      'chủ hộ': 'Owner',
      'người nhà': 'Family Member',
      'khách thuê': 'Family Member',
      'cư dân': 'Resident',
      'ban quản lý': 'Management Board',
      'kỹ thuật viên': 'Technician',
      'chính thức': 'Official',
      'tạm thời': 'Temporary',
      'chưa có': 'None',
      'đang ở': 'Occupied',
      'đã ở': 'Occupied',
      'căn trống': 'Vacant'
    };
    if (targetLang === 'en' && parenMap[inner.toLowerCase()]) {
      return preserveWhitespace(text, `(${parenMap[inner.toLowerCase()]})`);
    }
    const trans = translateString(inner, targetLang);
    return preserveWhitespace(text, `(${trans})`);
  }

  // Time slot: "06:00 - 08:00 (Sáng sớm bình minh)"
  const timeSlot = trimmed.match(/^(\d{2}:\d{2}\s*-\s*\d{2}:\d{2})\s*\((.*)\)$/);
  if (timeSlot) {
    const timeRange = timeSlot[1];
    const desc = translateString(timeSlot[2], targetLang);
    return preserveWhitespace(text, `${timeRange} (${desc})`);
  }

  // Duration: "1 Giờ (Gặp nhanh)", "24 Giờ (Cả ngày)"
  const duration = trimmed.match(/^(\d+)\s*Giờ\s*\((.*)\)$/i);
  if (duration && targetLang === 'en') {
    const hours = duration[1];
    const desc = translateString(duration[2], targetLang);
    return preserveWhitespace(text, `${hours} ${parseInt(hours) === 1 ? 'Hour' : 'Hours'} (${desc})`);
  }

  // Key-Value with colon: "Trạng thái: Đang xử lý"
  if (trimmed.includes(':') && !trimmed.includes('http') && !trimmed.match(/\d{2}:\d{2}/)) {
    const idx = trimmed.indexOf(':');
    const label = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim();
    if (label.length > 0) {
      const transLabel = translateString(label, targetLang);
      const transVal = val.length > 0 ? translateString(val, targetLang) : '';
      const combined = val.length > 0 ? `${transLabel}: ${transVal}` : `${transLabel}:`;
      return preserveWhitespace(text, combined);
    }
  }

  // 3. Domain Templates (EN)
  if (targetLang === 'en') {
    // Apartments: "Căn BS-07", "Căn hộ BS-07.08", "Căn CH-06 (Chủ Hộ)"
    let m = trimmed.match(/^(?:Căn hộ|Căn)\s+([A-Za-z0-9\.\-_]+)(.*)$/i);
    if (m && (/\d/.test(m[1]) || /^[A-Z]{1,3}-\d+/i.test(m[1]))) {
      const code = m[1];
      const rest = m[2] ? ' ' + translateString(m[2].trim(), 'en') : '';
      return preserveWhitespace(text, `Apartment ${code}${rest}`.trim());
    }

    m = trimmed.match(/^(?:Chủ Hộ Căn|Chủ Hộ)\s+([A-Za-z0-9\.\-_]+)(.*)$/i);
    if (m && (/\d/.test(m[1]) || /^[A-Z]{1,3}-\d+/i.test(m[1]))) {
      const code = m[1];
      const rest = m[2] ? ' ' + translateString(m[2].trim(), 'en') : '';
      return preserveWhitespace(text, `Apartment Owner ${code}${rest}`.trim());
    }

    m = trimmed.match(/^(?:Người Nhà Căn)\s+([A-Za-z0-9\.\-_]+)(.*)$/i);
    if (m && (/\d/.test(m[1]) || /^[A-Z]{1,3}-\d+/i.test(m[1]))) {
      const code = m[1];
      const rest = m[2] ? ' ' + translateString(m[2].trim(), 'en') : '';
      return preserveWhitespace(text, `Family Member ${code}${rest}`.trim());
    }

    m = trimmed.match(/^(?:Khách Thuê Căn)\s+([A-Za-z0-9\.\-_]+)(.*)$/i);
    if (m && (/\d/.test(m[1]) || /^[A-Z]{1,3}-\d+/i.test(m[1]))) {
      const code = m[1];
      const rest = m[2] ? ' ' + translateString(m[2].trim(), 'en') : '';
      return preserveWhitespace(text, `Family Member ${code}${rest}`.trim());
    }

    m = trimmed.match(/^Tòa\s+([A-Za-z0-9\.\-_]+)(.*)$/i);
    if (m && (/\d/.test(m[1]) || /^[A-D]$/i.test(m[1]) || /^(?:The\s+Tropical|Tropical|Sapphire|Diamond|Ruby)$/i.test(m[1] + m[2]))) {
      const code = m[1];
      const rest = m[2] ? ' ' + translateString(m[2].trim(), 'en') : '';
      return preserveWhitespace(text, `Tower ${code}${rest}`.trim());
    }

    m = trimmed.match(/^Tầng\s+(\d+|[A-Z0-9]+)(.*)$/i);
    if (m && (/\d/.test(m[1]) || /^(?:G|B1|B2|B3|M|L)$/i.test(m[1]))) {
      const fl = m[1];
      const rest = m[2] ? ' ' + translateString(m[2].trim(), 'en') : '';
      return preserveWhitespace(text, `Floor ${fl}${rest}`.trim());
    }

    m = trimmed.match(/^Phòng\s+([A-Za-z0-9\.\-_]+)(.*)$/i);
    if (m && /\d/.test(m[1])) {
      const room = m[1];
      const rest = m[2] ? ' ' + translateString(m[2].trim(), 'en') : '';
      return preserveWhitespace(text, `Room ${room}${rest}`.trim());
    }

    m = trimmed.match(/^Khu\s+([A-Za-z0-9\.\-_]+)(.*)$/i);
    if (m && (/^[A-Z0-9]$/i.test(m[1]) || /^\d+$/.test(m[1]))) {
      const zone = m[1];
      const rest = m[2] ? ' ' + translateString(m[2].trim(), 'en') : '';
      return preserveWhitespace(text, `Zone ${zone}${rest}`.trim());
    }

    m = trimmed.match(/^Ô\s+([A-Za-z0-9\.\-_]+)(.*)$/i);
    if (m && (/\d/.test(m[1]) || /^[A-Z]-\d+/i.test(m[1]))) {
      const slot = m[1];
      const rest = m[2] ? ' ' + translateString(m[2].trim(), 'en') : '';
      return preserveWhitespace(text, `Slot ${slot}${rest}`.trim());
    }

    // Relative Time Templates
    m = trimmed.match(/^(\d+)\s+ngày trước$/i);
    if (m) return preserveWhitespace(text, `${m[1]} ${parseInt(m[1]) === 1 ? 'day ago' : 'days ago'}`);

    m = trimmed.match(/^(\d+)\s+giờ trước$/i);
    if (m) return preserveWhitespace(text, `${m[1]} ${parseInt(m[1]) === 1 ? 'hour ago' : 'hours ago'}`);

    m = trimmed.match(/^(\d+)\s+phút trước$/i);
    if (m) return preserveWhitespace(text, `${m[1]} ${parseInt(m[1]) === 1 ? 'minute ago' : 'minutes ago'}`);

    // Counters: "2 người", "4 phòng ngủ", "2 phòng tắm"
    m = trimmed.match(/^(\d+)\s+người$/i);
    if (m) return preserveWhitespace(text, `${m[1]} ${parseInt(m[1]) === 1 ? 'person' : 'people'}`);

    m = trimmed.match(/^(\d+)\s+phòng ngủ$/i);
    if (m) return preserveWhitespace(text, `${m[1]} ${parseInt(m[1]) === 1 ? 'bedroom' : 'bedrooms'}`);

    m = trimmed.match(/^(\d+)\s+phòng tắm$/i);
    if (m) return preserveWhitespace(text, `${m[1]} ${parseInt(m[1]) === 1 ? 'bathroom' : 'bathrooms'}`);

    // Status chips with counter: "Tất cả (12)", "Đang xử lý (3)"
    m = trimmed.match(/^([^\(\)]+)\s*\(([0-9]+)\)$/);
    if (m) {
      const base = translateString(m[1].trim(), 'en');
      return preserveWhitespace(text, `${base} (${m[2]})`);
    }

    // AI Auto Dispatch reasoning: "AI chọn Trần Văn Kỹ Thuật: Đúng chuyên môn..."
    m = trimmed.match(/^AI chọn\s+([^:]+):\s*(.*)$/i);
    if (m) {
      const techName = m[1].trim();
      const reasonRest = translateString(m[2].trim(), 'en');
      return preserveWhitespace(text, `AI selected ${techName}: ${reasonRest}`);
    }

    // Dynamic pattern for floor occupancy: "ĐÃ Ở: 3/21", "Ở: 3/21 CĂN", "Ở: 3/21"
    m = trimmed.match(/^(?:ĐÃ Ở|Ở):\s*(\d+\/\d+)(?:\s*CĂN)?$/i);
    if (m) {
      return preserveWhitespace(text, targetLang === 'en' ? `OCCUPIED: ${m[1]}` : `ĐÃ Ở: ${m[1]}`);
    }

    // Dynamic pattern for "Mặt Bằng Tầng 30" -> "Floor 30 Floorplan"
    m = trimmed.match(/^Mặt Bằng Tầng\s+(\d+|[A-Z0-9]+)(.*)$/i);
    if (m && targetLang === 'en') {
      const fl = m[1];
      const rest = m[2] ? ' ' + translateString(m[2].trim(), 'en') : '';
      return preserveWhitespace(text, `Floor ${fl} Floorplan${rest}`.trim());
    }

    // Dynamic pattern for "LÕI THANG MÁY & SẢNH CHỜ TẦNG 30"
    m = trimmed.match(/^LÕI THANG MÁY & SẢNH CHỜ TẦNG\s+(\d+|[A-Z0-9]+)$/i);
    if (m && targetLang === 'en') {
      return preserveWhitespace(text, `ELEVATOR CORE & FLOOR ${m[1]} LOBBY`);
    }

    // Dynamic pattern for "CHI TIẾT MỞ RỘNG • TẦNG 30"
    m = trimmed.match(/^CHI TIẾT MỞ RỘNG • TẦNG\s+(\d+|[A-Z0-9]+)$/i);
    if (m && targetLang === 'en') {
      return preserveWhitespace(text, `EXPANDED DETAILS • FLOOR ${m[1]}`);
    }

    // Dynamic pattern for "XEM NHANH: TẦNG X (...)"
    m = trimmed.match(/^XEM NHANH:\s*TẦNG\s+(\d+)\s*\((.*)\)$/i);
    if (m && targetLang === 'en') {
      const desc = translateString(m[2], 'en');
      return preserveWhitespace(text, `QUICK VIEW: FLOOR ${m[1]} (${desc})`);
    }

    // Common prefixes: "Danh sách...", "Lịch sử...", "Chi tiết...", "Quản lý..."
    const prefixMap: Array<[string, string]> = [
      ['Danh sách', 'List of'],
      ['Lịch sử', 'History of'],
      ['Chi tiết', 'Details of'],
      ['Quản lý', 'Management of'],
      ['Thông tin', 'Information of'],
      ['Không có', 'No'],
      ['Chưa có', 'No']
    ];
    for (const [pVi, pEn] of prefixMap) {
      if (trimmed.startsWith(pVi + ' ')) {
        const rest = trimmed.slice(pVi.length + 1).trim();
        const transRest = translateString(rest, 'en');
        const vnCharRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
        if (transRest !== rest && !vnCharRegex.test(transRest)) {
          return preserveWhitespace(text, `${pEn} ${transRest}`);
        }
      }
    }

    // Currencies: "1.500.000 đ" -> "1,500,000 VND"
    m = trimmed.match(/^([0-9\.,]+)\s*(đ|VNĐ|vnd)$/i);
    if (m) {
      return preserveWhitespace(text, `${m[1]} VND`);
    }

    // Prices in Billion: "2.31 Tỷ", "Từ 3.2 Tỷ"
    m = trimmed.match(/^(Từ\s+)?([0-9\.,]+)\s*Tỷ$/i);
    if (m) {
      const prefix = m[1] ? 'From ' : '';
      return preserveWhitespace(text, `${prefix}${m[2]} Billion VND`);
    }

    // Price per m²: "~ 55.0 tr/m²", "55.0 tr/m²"
    m = trimmed.match(/^([~≈]\s*)?([0-9\.,]+)\s*tr\/m²$/i);
    if (m) {
      const prefix = m[1] || '';
      return preserveWhitespace(text, `${prefix}${m[2]}M VND/m²`);
    }

    // Unit Areas: "54.8 m² tim tường", "Tim tường: 54.8 m²"
    m = trimmed.match(/^([0-9\.,]+)\s*m²\s*tim tường$/i);
    if (m) return preserveWhitespace(text, `${m[1]} m² Gross Built Area`);

    m = trimmed.match(/^Tim tường:\s*([0-9\.,]+)\s*m²$/i);
    if (m) return preserveWhitespace(text, `Gross Area: ${m[1]} m²`);

    m = trimmed.match(/^([0-9\.,]+)\s*m²\s*thông thủy$/i);
    if (m) return preserveWhitespace(text, `${m[1]} m² Net Usable Area`);

    // Management fee: "Phí QL: 12.500 đ/m²"
    m = trimmed.match(/^Phí QL:\s*([0-9\.,]+)\s*(?:đ|VND)\/m²$/i);
    if (m) return preserveWhitespace(text, `Management Fee: ${m[1]} VND/m²`);

    // Room configurations: "1 PN • 1 WC", "2 PN • 1 WC"
    m = trimmed.match(/^(\d+)\s*PN\s*•\s*(\d+)\s*WC$/i);
    if (m) return preserveWhitespace(text, `${m[1]} Bed • ${m[2]} Bath`);

    // Month & Year: "Tháng 08/2026" -> "August 2026"
    m = trimmed.match(/^Tháng\s+(\d{1,2})\/(\d{4})$/i);
    if (m) {
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const monthIdx = parseInt(m[1], 10) - 1;
      if (monthIdx >= 0 && monthIdx < 12) {
        return preserveWhitespace(text, `${monthNames[monthIdx]} ${m[2]}`);
      }
      return preserveWhitespace(text, `Month ${m[1]}/${m[2]}`);
    }
  }

  // 4. Reverse Domain Templates (VI)
  if (targetLang === 'vi') {
    // Month & Year: "August 2026" -> "Tháng 08/2026"
    let m = trimmed.match(/^(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})$/i);
    if (m) {
      const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
      const monthIdx = monthNames.indexOf(m[1].toLowerCase()) + 1;
      const padMonth = monthIdx < 10 ? `0${monthIdx}` : `${monthIdx}`;
      return preserveWhitespace(text, `Tháng ${padMonth}/${m[2]}`);
    }
    m = trimmed.match(/^Apartment\s+([A-Za-z0-9\.\-_]+)(.*)$/i);
    if (m) {
      const code = m[1];
      const rest = m[2] ? ' ' + translateString(m[2], 'vi') : '';
      return preserveWhitespace(text, `Căn hộ ${code}${rest}`.trim());
    }

    m = trimmed.match(/^Tower\s+([A-Za-z0-9\.\-_]+)(.*)$/i);
    if (m) {
      const code = m[1];
      const rest = m[2] ? ' ' + translateString(m[2], 'vi') : '';
      return preserveWhitespace(text, `Tòa ${code}${rest}`.trim());
    }

    m = trimmed.match(/^Floor\s+(\d+)(.*)$/i);
    if (m) {
      const fl = m[1];
      const rest = m[2] ? ' ' + translateString(m[2], 'vi') : '';
      return preserveWhitespace(text, `Tầng ${fl}${rest}`.trim());
    }

    m = trimmed.match(/^Room\s+([A-Za-z0-9\.\-_]+)(.*)$/i);
    if (m) {
      const room = m[1];
      const rest = m[2] ? ' ' + translateString(m[2], 'vi') : '';
      return preserveWhitespace(text, `Phòng ${room}${rest}`.trim());
    }

    m = trimmed.match(/^Zone\s+([A-Za-z0-9\.\-_]+)(.*)$/i);
    if (m) {
      const zone = m[1];
      const rest = m[2] ? ' ' + translateString(m[2], 'vi') : '';
      return preserveWhitespace(text, `Khu ${zone}${rest}`.trim());
    }

    m = trimmed.match(/^Slot\s+([A-Za-z0-9\.\-_]+)(.*)$/i);
    if (m) {
      const slot = m[1];
      const rest = m[2] ? ' ' + translateString(m[2], 'vi') : '';
      return preserveWhitespace(text, `Ô ${slot}${rest}`.trim());
    }

    m = trimmed.match(/^(\d+)\s+days?\s+ago$/i);
    if (m) return preserveWhitespace(text, `${m[1]} ngày trước`);

    m = trimmed.match(/^(\d+)\s+hours?\s+ago$/i);
    if (m) return preserveWhitespace(text, `${m[1]} giờ trước`);

    m = trimmed.match(/^(\d+)\s+minutes?\s+ago$/i);
    if (m) return preserveWhitespace(text, `${m[1]} phút trước`);

    m = trimmed.match(/^(\d+)\s+(?:people|person)$/i);
    if (m) return preserveWhitespace(text, `${m[1]} người`);

    m = trimmed.match(/^(\d+)\s+bedrooms?$/i);
    if (m) return preserveWhitespace(text, `${m[1]} phòng ngủ`);

    m = trimmed.match(/^(\d+)\s+bathrooms?$/i);
    if (m) return preserveWhitespace(text, `${m[1]} phòng tắm`);

    // Status chips with counter: "All (12)", "Pending (3)"
    m = trimmed.match(/^([^\(\)]+)\s*\(([0-9]+)\)$/);
    if (m) {
      const base = translateString(m[1].trim(), 'vi');
      return preserveWhitespace(text, `${base} (${m[2]})`);
    }

    const reversePrefixMap: Array<[string, string]> = [
      ['List of', 'Danh sách'],
      ['History of', 'Lịch sử'],
      ['Details of', 'Chi tiết'],
      ['Management of', 'Quản lý'],
      ['Information of', 'Thông tin'],
      ['No', 'Không có']
    ];
    for (const [pEn, pVi] of reversePrefixMap) {
      if (trimmed.startsWith(pEn + ' ')) {
        const rest = trimmed.slice(pEn.length + 1).trim();
        const transRest = translateString(rest, 'vi');
        if (transRest !== rest) {
          return preserveWhitespace(text, `${pVi} ${transRest}`);
        }
      }
    }

    // Reverse Prices in Billion
    m = trimmed.match(/^(From\s+)?([0-9\.,]+)\s*Billion\s*VND$/i);
    if (m) {
      const prefix = m[1] ? 'Từ ' : '';
      return preserveWhitespace(text, `${prefix}${m[2]} Tỷ`);
    }

    // Reverse Price per m²
    m = trimmed.match(/^([~≈]\s*)?([0-9\.,]+)\s*M\s*VND\/m²$/i);
    if (m) {
      const prefix = m[1] || '';
      return preserveWhitespace(text, `${prefix}${m[2]} tr/m²`);
    }

    // Reverse Unit Areas
    m = trimmed.match(/^([0-9\.,]+)\s*m²\s*Gross\s*(?:Built\s*)?Area$/i);
    if (m) return preserveWhitespace(text, `${m[1]} m² tim tường`);

    m = trimmed.match(/^Gross\s*Area:\s*([0-9\.,]+)\s*m²$/i);
    if (m) return preserveWhitespace(text, `Tim tường: ${m[1]} m²`);

    m = trimmed.match(/^([0-9\.,]+)\s*m²\s*Net\s*(?:Usable\s*)?Area$/i);
    if (m) return preserveWhitespace(text, `${m[1]} m² thông thủy`);

    // Reverse Management Fee
    m = trimmed.match(/^Management\s*Fee:\s*([0-9\.,]+)\s*VND\/m²$/i);
    if (m) return preserveWhitespace(text, `Phí QL: ${m[1]} đ/m²`);

    // Reverse Room configuration
    m = trimmed.match(/^(\d+)\s*Bed\s*•\s*(\d+)\s*Bath$/i);
    if (m) return preserveWhitespace(text, `${m[1]} PN • ${m[2]} WC`);

    m = trimmed.match(/^([0-9\.,]+)\s*VND$/i);
    if (m) {
      return preserveWhitespace(text, `${m[1]} đ`);
    }
  }

  return text;
}

function matchCase(source: string, target: string): string {
  if (!source || !target) return target;
  if (source === source.toUpperCase() && /[a-zA-ZÀ-ỹ]/.test(source) && source.length > 1) {
    return target.toUpperCase();
  }
  const firstLetterMatch = source.match(/[a-zA-ZÀ-ỹ]/);
  if (firstLetterMatch && firstLetterMatch[0] === firstLetterMatch[0].toUpperCase()) {
    const targetLetterMatch = target.match(/[a-zA-Z]/);
    if (targetLetterMatch && targetLetterMatch.index !== undefined) {
      const idx = targetLetterMatch.index;
      return target.slice(0, idx) + target.charAt(idx).toUpperCase() + target.slice(idx + 1);
    }
  }
  return target;
}

// =============================================================================
// REACT CONTEXT & PROVIDER
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
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('skyline_language') as Language | null;
        if (saved === 'en' || saved === 'vi') return saved;
      } catch {}
    }
    return 'vi';
  });
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
   * Direct translation helper in React components
   */
  const t = (keyOrText: string, fallback?: string): string => {
    if (!keyOrText) return fallback || '';
    const trimmed = keyOrText.trim();

    // 1. Direct key dictionary lookup (e.g. 'nav.dashboard', 'role.admin')
    if (KEY_DICTIONARY[trimmed]) {
      return KEY_DICTIONARY[trimmed][language];
    }
    if (trimmed.includes('&') && KEY_DICTIONARY[trimmed.replace(/&/g, '&amp;')]) {
      return KEY_DICTIONARY[trimmed.replace(/&/g, '&amp;')][language];
    }
    if (trimmed.includes('&amp;') && KEY_DICTIONARY[trimmed.replace(/&amp;/g, '&')]) {
      return KEY_DICTIONARY[trimmed.replace(/&amp;/g, '&')][language];
    }
    if (trimmed.endsWith(':')) {
      const withoutColon = trimmed.slice(0, -1).trim();
      if (KEY_DICTIONARY[withoutColon]) {
        return KEY_DICTIONARY[withoutColon][language] + ':';
      }
    } else if (KEY_DICTIONARY[trimmed + ':']) {
      const withColon = KEY_DICTIONARY[trimmed + ':'][language];
      return withColon.endsWith(':') ? withColon.slice(0, -1).trim() : withColon;
    }

    const vnCharRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

    // 2. Target English
    if (language === 'en') {
      // If fallback is explicitly provided in English (no Vietnamese diacritics), use it
      if (fallback && !vnCharRegex.test(fallback) && !fallback.includes('.') && fallback !== trimmed) {
        return fallback;
      }
      const trans = translateString(trimmed, 'en');
      if (trans !== trimmed && !vnCharRegex.test(trans)) return trans;
      if (fallback && fallback !== trimmed) {
        const transFallback = translateString(fallback, 'en');
        if (transFallback !== fallback && !vnCharRegex.test(transFallback)) return transFallback;
      }
      return trans || fallback || keyOrText;
    }

    // 3. Target Vietnamese
    if (fallback && vnCharRegex.test(fallback) && (trimmed.includes('.') || trimmed.includes('_') || /^[a-z]+$/.test(trimmed))) {
      return fallback;
    }
    if (trimmed.includes('.') || trimmed.includes('_') || /^[a-z]+$/.test(trimmed)) {
      return fallback || keyOrText;
    }

    const viTrans = translateString(trimmed, 'vi');
    return viTrans || fallback || keyOrText;
  };

  // ===========================================================================
  // AUTOMATED HIGH-FIDELITY PROJECT-WIDE DOM TRANSLATION
  // ===========================================================================
  useEffect(() => {
    if (typeof window === 'undefined' || !isMounted) return;

    let debounceTimer: any = null;

    const processTextNode = (node: Node) => {
      if (!node || node.nodeType !== Node.TEXT_NODE) return;
      const currentVal = node.nodeValue || '';
      if (!currentVal.trim()) return;

      // Ignore code, script, style, pre, svg tags
      const parent = node.parentElement;
      if (!parent) return;
      const tag = parent.tagName.toLowerCase();
      if (tag === 'script' || tag === 'style' || tag === 'code' || tag === 'pre' || tag === 'svg') {
        return;
      }

      // Do not alter active input / textarea while typing
      if (document.activeElement && (document.activeElement === parent || parent.contains(document.activeElement))) {
        if (tag === 'textarea' || tag === 'input' || parent.isContentEditable) {
          return;
        }
      }

      // Save baseline in originalNodesMap on first encounter
      if (!originalNodesMap.current.has(node)) {
        originalNodesMap.current.set(node, currentVal);
      }

      const baseText = originalNodesMap.current.get(node) || currentVal;

      if (language === 'en') {
        const translated = translateString(baseText, 'en');
        if (translated !== node.nodeValue) {
          node.nodeValue = translated;
        }
      } else {
        // Restore pristine Vietnamese
        const viText = originalNodesMap.current.has(node) ? originalNodesMap.current.get(node)! : translateString(baseText, 'vi');
        if (viText !== node.nodeValue) {
          node.nodeValue = viText;
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
            const viPlaceholder = translateString(placeholder, 'vi');
            el.setAttribute('data-orig-placeholder', viPlaceholder);
          }
          const basePlaceholder = el.getAttribute('data-orig-placeholder') || placeholder;
          const translated = translateString(basePlaceholder, 'en');
          if (translated !== placeholder) el.setAttribute('placeholder', translated);
        } else {
          const orig = el.getAttribute('data-orig-placeholder');
          if (orig) el.setAttribute('placeholder', orig);
          else {
            const translatedBack = translateString(placeholder, 'vi');
            el.setAttribute('placeholder', translatedBack);
          }
        }
      }

      // Title
      const title = el.getAttribute('title');
      if (title) {
        if (language === 'en') {
          if (!el.getAttribute('data-orig-title')) {
            const viTitle = translateString(title, 'vi');
            el.setAttribute('data-orig-title', viTitle);
          }
          const baseTitle = el.getAttribute('data-orig-title') || title;
          const translated = translateString(baseTitle, 'en');
          if (translated !== title) el.setAttribute('title', translated);
        } else {
          const orig = el.getAttribute('data-orig-title');
          if (orig) el.setAttribute('title', orig);
          else {
            const translatedBack = translateString(title, 'vi');
            el.setAttribute('title', translatedBack);
          }
        }
      }

      // Aria-Label
      const ariaLabel = el.getAttribute('aria-label');
      if (ariaLabel) {
        if (language === 'en') {
          if (!el.getAttribute('data-orig-aria')) {
            const viAria = translateString(ariaLabel, 'vi');
            el.setAttribute('data-orig-aria', viAria);
          }
          const baseAria = el.getAttribute('data-orig-aria') || ariaLabel;
          const translated = translateString(baseAria, 'en');
          if (translated !== ariaLabel) el.setAttribute('aria-label', translated);
        } else {
          const orig = el.getAttribute('data-orig-aria');
          if (orig) el.setAttribute('aria-label', orig);
          else {
            const translatedBack = translateString(ariaLabel, 'vi');
            el.setAttribute('aria-label', translatedBack);
          }
        }
      }
    };

    const walkAndTranslate = (root: Node) => {
      if (isTranslatingRef.current || !root) return;
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

    // Scan DOM upon language switch or mount
    walkAndTranslate(document.body);
    // Scheduled backup walks for async hydrated data & route/tab transitions
    const backupTimer1 = setTimeout(() => walkAndTranslate(document.body), 100);
    const backupTimer2 = setTimeout(() => walkAndTranslate(document.body), 350);
    const backupTimer3 = setTimeout(() => walkAndTranslate(document.body), 800);

    // Dynamic Observer for Modals, Tabs, Tooltips, Accordions
    const pendingNodes = new Set<Node>();

    const processPendingQueue = () => {
      if (isTranslatingRef.current) {
        debounceTimer = setTimeout(processPendingQueue, 25);
        return;
      }
      if (pendingNodes.size === 0) return;

      const nodesToProcess = Array.from(pendingNodes);
      pendingNodes.clear();

      for (const target of nodesToProcess) {
        if (!target.isConnected) continue;
        if (target.nodeType === Node.TEXT_NODE) {
          const newText = (target as Text).nodeValue || '';
          if (newText.trim()) {
            if (language === 'vi') {
              originalNodesMap.current.set(target, newText);
            } else {
              const viBaseline = translateString(newText, 'vi');
              originalNodesMap.current.set(target, viBaseline);
              processTextNode(target);
            }
          }
        } else if (target.nodeType === Node.ELEMENT_NODE) {
          walkAndTranslate(target);
        }
      }
    };

    const observer = new MutationObserver((mutations) => {
      if (isTranslatingRef.current) return;

      for (const mutation of mutations) {
        if (mutation.type === 'characterData' && mutation.target) {
          pendingNodes.add(mutation.target);
        } else if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((added) => {
            pendingNodes.add(added);
          });
        }
      }

      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(processPendingQueue, 20);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    const handleTabOrRouteTransition = () => {
      setTimeout(() => walkAndTranslate(document.body), 60);
      setTimeout(() => walkAndTranslate(document.body), 250);
    };

    window.addEventListener('popstate', handleTabOrRouteTransition);
    document.addEventListener('click', handleTabOrRouteTransition, { passive: true });

    return () => {
      clearTimeout(debounceTimer);
      clearTimeout(backupTimer1);
      clearTimeout(backupTimer2);
      clearTimeout(backupTimer3);
      window.removeEventListener('popstate', handleTabOrRouteTransition);
      document.removeEventListener('click', handleTabOrRouteTransition);
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
