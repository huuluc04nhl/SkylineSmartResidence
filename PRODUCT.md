# PRODUCT.md — Durable Product Truth: Skyline Smart Residence

## 1. Product Identity & Purpose
* **Product Name:** SKYLINE Smart Residence (Khu Phức Hợp The Tropical - Beverly Solari).
* **Mission:** Nền tảng quản lý vận hành chung cư cao cấp và trợ lý căn hộ thông minh 24/7 tích hợp AI cho Cư dân & Ban Quản Lý.
* **Core Modules:**
  - **Dành cho Cư dân (Owner & Tenant):** Điều khiển Smart Home Hub (đèn, rèm, FaceID, mã PIN mở cửa), Đặt lịch tiện ích 5 sao (Hồ bơi vô cực, Vườn nướng BBQ tầng 25, Sauna VIP), Tra cứu & Thanh toán hóa đơn VietQR/VNPay, Tạo mã QR đón khách thăm, Gửi phiếu phản ánh kỹ thuật NKS túc trực 24/7.
  - **Dành cho BQL (Admin & Technician):** Bảng Kanban điều phối kỹ thuật, Quản lý tòa nhà và căn hộ (BS-07, BS-08, BS-09, BS-10), Phê duyệt eKYC cư dân, Giám sát an ninh khách ra vào, Giám sát sức khỏe thiết bị IoT.
  - **Trợ lý ảo AI Concierge:** Tích hợp mô hình AI Google Gemini với dữ liệu sổ tay cư dân thời gian thực.

## 2. Operating Constraints
* **Platform:** Web application (Next.js 14 App Router, React 18, TypeScript, TailwindCSS).
* **Responsive Targets:** Mobile (iPhone, Samsung Galaxy), Tablet (iPad 10.2", iPad Air/Pro), Desktop (1080p, 1440p, 4K).
* **Offline / Mock Resilience:** Hoạt động ổn định với mock stores và localStorage khi chưa kết nối cơ sở dữ liệu ngoài.
