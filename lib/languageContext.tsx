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
  'role.tenant': { vi: 'Khách Thuê', en: 'Tenant' },
  'role.family': { vi: 'Người Nhà Căn Hộ', en: 'Family Member' },
  'role.technician': { vi: 'Kỹ Thuật Viên', en: 'Technician' },
  'role.staff': { vi: 'Nhân Sự Ban Quản Lý', en: 'Staff' },
  'role.resident': { vi: 'Cư Dân', en: 'Resident' },
  'ADMIN': { vi: 'Ban Quản Lý', en: 'Management Board' },
  'OWNER': { vi: 'Chủ Hộ', en: 'Apartment Owner' },
  'TENANT': { vi: 'Khách Thuê', en: 'Tenant' },
  'FAMILY': { vi: 'Người Nhà', en: 'Family Member' },
  'TECHNICIAN': { vi: 'Kỹ Thuật Viên', en: 'Technician' },
  'Chủ Hộ': { vi: 'Chủ Hộ', en: 'Apartment Owner' },
  'Người Nhà': { vi: 'Người Nhà', en: 'Family Member' },
  'Khách Thuê': { vi: 'Khách Thuê', en: 'Tenant' },
  'Ban Quản Lý': { vi: 'Ban Quản Lý', en: 'Management Board' },
  'Kỹ Thuật Viên': { vi: 'Kỹ Thuật Viên', en: 'Technician' },
  'Căn Trống': { vi: 'Căn Trống', en: 'Vacant' },
  'Đã Ở': { vi: 'Đã Ở', en: 'Occupied' },
  'Bảo Trì': { vi: 'Bảo Trì', en: 'Maintenance' },
  'Tài Chính • Kế Toán': { vi: 'Tài Chính • Kế Toán', en: 'Finance & Accounting' },
  'Tài Chính • Căn': { vi: 'Tài Chính • Căn', en: 'Finance • Apartment' },
  'Sổ Cái Thu Phí Dịch Vụ': { vi: 'Sổ Cái Thu Phí Dịch Vụ', en: 'Service Fee Ledger' },
  'căn hộ đã nộp': { vi: 'căn hộ đã nộp', en: 'paid apartments' },
  'căn hộ chưa nộp': { vi: 'căn hộ chưa nộp', en: 'unpaid apartments' },
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
  'Gõ câu hỏi bất kỳ, Trợ lý AI sẽ trích dẫn điều khoản chính xác theo quy chuẩn chung cư The Tropical.': { vi: 'Gõ câu hỏi bất kỳ, Trợ lý AI sẽ trích dẫn điều khoản chính xác theo quy chuẩn chung cư The Tropical.', en: 'Ask any question and the AI Assistant will quote the exact regulations according to The Tropical building standards.' },
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
  }
}

// Index KEY_DICTIONARY into lookup maps with highest priority
for (const [key, obj] of Object.entries(KEY_DICTIONARY)) {
  const cleanVi = obj.vi?.trim();
  const cleanEn = obj.en?.trim();
  if (cleanVi && cleanEn) {
    VI_TO_EN_MAP.set(cleanVi.toLowerCase(), cleanEn);
    EN_TO_VI_MAP.set(cleanEn.toLowerCase(), cleanVi);
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

  // 1b. Multi-part Delimiters: " • ", " | ", " - ", "\n"
  for (const sep of [' • ', ' | ', ' - ', '\n']) {
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
      'khách thuê': 'Tenant',
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

    // 2. Target English
    if (language === 'en') {
      if (fallback && !fallback.includes('.') && fallback !== trimmed) {
        return fallback;
      }
      const trans = translateString(trimmed, 'en');
      if (trans !== trimmed) return trans;
      return fallback || keyOrText;
    }

    // 3. Target Vietnamese
    if (trimmed.includes('.') || trimmed.includes('_') || /^[a-z]+$/.test(trimmed)) {
      return fallback || keyOrText;
    }

    const viTrans = translateString(trimmed, 'vi');
    return viTrans || keyOrText;
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
