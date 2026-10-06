'use client';

import { ExtendedBill } from '@/lib/billingStore';
import { Device } from '@/lib/dataStore';

/**
 * Tiện ích xuất file PDF chất lượng cao cho Chung cư Skyline Smart Residence
 * Sử dụng html2canvas + jsPDF chạy an toàn trên client-side
 */

interface InvoicePdfOptions {
  bill: ExtendedBill;
  residentName: string;
  aptCode: string;
}

interface MaintenancePdfOptions {
  device: Device;
  ticketId?: string;
  assignedTechnician?: string;
  priority?: string;
  scheduledDate?: string;
  notes?: string;
}

/**
 * Xuất Hóa Đơn Dịch Vụ & Tiện Ích Căn Hộ ra file PDF
 */
export async function exportInvoicePdf({ bill, residentName, aptCode }: InvoicePdfOptions): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  try {
    const { jsPDF } = await import('jspdf');
    const html2canvas = (await import('html2canvas')).default;

    // Tạo container DOM chuẩn hóa A4 để render mẫu hóa đơn
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '794px'; // Chuẩn A4 ở 96 DPI
    container.style.minHeight = '1123px';
    container.style.backgroundColor = '#ffffff';
    container.style.color = '#111827';
    container.style.fontFamily = "'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
    container.style.padding = '40px 48px';
    container.style.boxSizing = 'border-box';
    container.style.zIndex = '-9999';

    const isPaid = bill.status === 'Paid';
    const subtotal = bill.details?.reduce((sum, d) => sum + (d.total_line_amount || 0), 0) || bill.total_amount;
    const vatAmount = Math.round(subtotal * 0.1);
    const finalTotal = subtotal + vatAmount;

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #C5A880; padding-bottom: 20px; margin-bottom: 24px;">
        <div>
          <div style="font-size: 20px; font-weight: 800; color: #0D1117; letter-spacing: 1px; text-transform: uppercase;">
            SKYLINE SMART RESIDENCE
          </div>
          <div style="font-size: 11px; color: #6B7280; margin-top: 4px;">
            Ban Quản Lý Tòa Nhà Chung Cư Cao Cấp Skyline
          </div>
          <div style="font-size: 11px; color: #6B7280;">
            Đường Nguyễn Hữu Thọ, Phường Tân Hưng, Quận 7, TP. Hồ Chí Minh
          </div>
          <div style="font-size: 11px; color: #6B7280;">
            Hotline: 1900 8888 • Email: bql@skyline.residence.vn
          </div>
        </div>
        <div style="text-align: right;">
          <div style="display: inline-block; padding: 6px 14px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; border: 2px solid ${isPaid ? '#16A34A' : '#DC2626'}; color: ${isPaid ? '#16A34A' : '#DC2626'}; background: ${isPaid ? '#F0FDF4' : '#FEF2F2'};">
            ${isPaid ? 'ĐÃ THANH TOÁN (PAID)' : 'CHỜ THANH TOÁN (UNPAID)'}
          </div>
          <div style="font-size: 11px; color: #4B5563; margin-top: 6px; font-family: monospace;">
            Số HĐ: <strong>${bill.id}</strong>
          </div>
          <div style="font-size: 11px; color: #4B5563;">
            Ngày lập: ${bill.created_at ? new Date(bill.created_at).toLocaleDateString('vi-VN') : '25/08/2026'}
          </div>
        </div>
      </div>

      <div style="text-align: center; margin-bottom: 28px;">
        <h1 style="font-size: 22px; font-weight: 800; color: #111827; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">
          HÓA ĐƠN DỊCH VỤ & TIỆN ÍCH CĂN HỘ
        </h1>
        <div style="font-size: 13px; color: #C5A880; font-weight: 600; margin-top: 4px;">
          KỲ THANH TOÁN: ${bill.billing_month.toUpperCase()}
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; background: #F9FAFB; padding: 16px 20px; border: 1px solid #E5E7EB; margin-bottom: 24px; font-size: 12px;">
        <div>
          <div style="color: #6B7280; font-size: 10px; text-transform: uppercase; font-weight: 700; margin-bottom: 4px;">Thông Tin Cư Dân:</div>
          <div>Căn hộ: <strong style="color: #111827; font-size: 13px;">Căn ${aptCode}</strong></div>
          <div>Chủ sở hữu / Đại diện: <strong style="color: #111827;">${residentName}</strong></div>
          <div>Tòa nhà: <strong>Tháp BS-07 Skyline Residence</strong></div>
        </div>
        <div>
          <div style="color: #6B7280; font-size: 10px; text-transform: uppercase; font-weight: 700; margin-bottom: 4px;">Thông Tin Thanh Toán:</div>
          <div>Phương thức: <strong>${bill.payment_method || 'VNPAY Sandbox Gateway'}</strong></div>
          <div>Mã giao dịch / Chuẩn chi: <strong style="font-family: monospace; color: #005BAA;">#${bill.transaction_ref || 'CHƯA PHÁT HÀNH'}</strong></div>
          <div>Thời gian ghi nhận: <strong>${bill.paid_at ? new Date(bill.paid_at).toLocaleString('vi-VN') : 'Chờ thanh toán'}</strong></div>
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 12px;">
        <thead>
          <tr style="background: #111827; color: #ffffff; text-transform: uppercase; font-size: 11px;">
            <th style="padding: 10px 12px; text-align: center; width: 40px;">STT</th>
            <th style="padding: 10px 12px; text-align: left;">Hạng Mục Dịch Vụ</th>
            <th style="padding: 10px 12px; text-align: center; width: 90px;">Chỉ Số / Lượng</th>
            <th style="padding: 10px 12px; text-align: center; width: 60px;">ĐVT</th>
            <th style="padding: 10px 12px; text-align: right; width: 110px;">Đơn Giá (đ)</th>
            <th style="padding: 10px 12px; text-align: right; width: 130px;">Thành Tiền (đ)</th>
          </tr>
        </thead>
        <tbody>
          ${bill.details.map((item, idx) => `
            <tr style="border-bottom: 1px solid #E5E7EB; background: ${idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB'};">
              <td style="padding: 10px 12px; text-align: center; color: #6B7280;">${idx + 1}</td>
              <td style="padding: 10px 12px;">
                <strong style="color: #111827;">${item.service_name || item.service_type}</strong>
                ${item.booking_ref ? `<div style="font-size: 10px; color: #9CA3AF; font-family: monospace;">Mã đơn: ${item.booking_ref}</div>` : ''}
              </td>
              <td style="padding: 10px 12px; text-align: center; font-family: monospace;">${item.usage || 1}</td>
              <td style="padding: 10px 12px; text-align: center; color: #4B5563;">${item.unit || 'tháng'}</td>
              <td style="padding: 10px 12px; text-align: right; font-family: monospace;">${(item.unit_price || item.total_line_amount).toLocaleString('vi-VN')}</td>
              <td style="padding: 10px 12px; text-align: right; font-weight: 700; font-family: monospace; color: #111827;">${item.total_line_amount.toLocaleString('vi-VN')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="display: flex; justify-content: flex-end; margin-bottom: 30px;">
        <div style="width: 320px; font-size: 12px; border: 1px solid #E5E7EB; padding: 14px; background: #F9FAFB;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span style="color: #6B7280;">Tạm tính dịch vụ:</span>
            <span style="font-family: monospace; font-weight: 600;">${subtotal.toLocaleString('vi-VN')} đ</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; border-bottom: 1px solid #E5E7EB; padding-bottom: 6px;">
            <span style="color: #6B7280;">Thuế GTGT (VAT 10%):</span>
            <span style="font-family: monospace; font-weight: 600;">${vatAmount.toLocaleString('vi-VN')} đ</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: 800; color: #0D1117;">
            <span>TỔNG CỘNG:</span>
            <span style="color: #C5A880; font-family: monospace;">${bill.total_amount.toLocaleString('vi-VN')} đ</span>
          </div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB; font-size: 12px; text-align: center;">
        <div>
          <div style="font-weight: 700; text-transform: uppercase; color: #4B5563;">Đại Diện Cư Dân / Người Thanh Toán</div>
          <div style="font-size: 11px; color: #9CA3AF; margin-top: 4px;">(Ký và ghi rõ họ tên)</div>
          <div style="height: 60px;"></div>
          <div style="font-weight: 700; color: #111827;">${residentName}</div>
        </div>
        <div>
          <div style="font-weight: 700; text-transform: uppercase; color: #4B5563;">Ban Quản Lý Chung Cư Skyline</div>
          <div style="font-size: 11px; color: #9CA3AF; margin-top: 4px;">(Ký điện tử & đóng dấu số)</div>
          <div style="height: 60px; display: flex; align-items: center; justify-content: center;">
            <div style="display: inline-block; border: 2px dashed #16A34A; color: #16A34A; padding: 4px 12px; font-size: 11px; font-weight: 700; transform: rotate(-4deg); background: #F0FDF4;">
              ✓ ĐÃ XÁC NHẬN BQL SKYLINE
            </div>
          </div>
          <div style="font-weight: 700; color: #111827;">Kế Toán Trưởng Ban Quản Lý</div>
        </div>
      </div>

      <div style="margin-top: 40px; font-size: 10px; color: #9CA3AF; text-align: center; border-top: 1px solid #F3F4F6; padding-top: 12px;">
        Hóa đơn điện tử này được trích xuất tự động từ Hệ thống Quản lý Vận hành Chung cư Skyline Smart Residence.
      </div>
    `;

    document.body.appendChild(container);

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    document.body.removeChild(container);

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`HoaDon_Skyline_Can_${aptCode}_${bill.billing_month.replace(/\//g, '_')}.pdf`);
    return true;
  } catch (err) {
    console.error('Lỗi khi xuất PDF hóa đơn:', err);
    return false;
  }
}

/**
 * Xuất Phiếu Yêu Cầu & Kế Hoạch Bảo Trì Kỹ Thuật IoT ra file PDF
 */
export async function exportMaintenanceTicketPdf(options: MaintenancePdfOptions): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  try {
    const { jsPDF } = await import('jspdf');
    const html2canvas = (await import('html2canvas')).default;

    const { device, ticketId, assignedTechnician, priority, scheduledDate, notes } = options;
    const finalTicketId = ticketId || `MT-${device.id.toUpperCase()}-${Date.now().toString().slice(-6)}`;
    const techName = assignedTechnician || 'Lê Văn Kỹ Thuật (Kỹ Sư Trưởng BMS)';
    const dateStr = scheduledDate || device.predict_date;
    const priorityLevel = priority || (device.health_score < 70 ? 'Cấp bách' : 'Bình thường');

    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '794px';
    container.style.minHeight = '1123px';
    container.style.backgroundColor = '#ffffff';
    container.style.color = '#111827';
    container.style.fontFamily = "'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
    container.style.padding = '40px 48px';
    container.style.boxSizing = 'border-box';
    container.style.zIndex = '-9999';

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #C5A880; padding-bottom: 20px; margin-bottom: 24px;">
        <div>
          <div style="font-size: 20px; font-weight: 800; color: #0D1117; letter-spacing: 1px; text-transform: uppercase;">
            SKYLINE SMART RESIDENCE
          </div>
          <div style="font-size: 11px; color: #6B7280; margin-top: 4px;">
            Phòng Kỹ Thuật & Giám Sát Hạ Tầng BMS IoT
          </div>
          <div style="font-size: 11px; color: #6B7280;">
            Chung Cư Cao Cấp Tháp BS-07 Skyline
          </div>
        </div>
        <div style="text-align: right;">
          <div style="display: inline-block; padding: 6px 14px; font-size: 12px; font-weight: 700; text-transform: uppercase; border: 2px solid #005BAA; color: #005BAA; background: #EFF6FF;">
            PHIẾU BẢO TRÌ DỰ PHÒNG AI
          </div>
          <div style="font-size: 11px; color: #4B5563; margin-top: 6px; font-family: monospace;">
            Mã phiếu: <strong>#${finalTicketId}</strong>
          </div>
          <div style="font-size: 11px; color: #4B5563;">
            Ngày lập phiếu: ${new Date().toLocaleDateString('vi-VN')}
          </div>
        </div>
      </div>

      <div style="text-align: center; margin-bottom: 28px;">
        <h1 style="font-size: 22px; font-weight: 800; color: #111827; margin: 0; text-transform: uppercase;">
          LỆNH BẢO DƯỠNG & KIỂM TRA HẠ TẦNG KỸ THUẬT
        </h1>
        <div style="font-size: 13px; color: #C5A880; font-weight: 600; margin-top: 4px;">
          KẾ HOẠCH DỰ BÁO BẢO TRÌ BỞI HỆ THỐNG AI HEALTH SCORE
        </div>
      </div>

      <div style="background: #F9FAFB; padding: 18px 20px; border: 1px solid #E5E7EB; margin-bottom: 24px; font-size: 12px;">
        <div style="font-size: 13px; font-weight: 800; color: #111827; text-transform: uppercase; border-bottom: 1px solid #E5E7EB; padding-bottom: 6px; margin-bottom: 12px;">
          1. Thông Tin Thiết Bị & Vị Trí Vận Hành
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>Tên hệ thống/thiết bị: <strong style="color: #005BAA;">${device.name}</strong></div>
          <div>Phân loại hệ thống: <strong>${device.category}</strong></div>
          <div>Vị trí lắp đặt: <strong>${device.location}</strong></div>
          <div>Trạng thái hiện thời: <strong style="color: #16A34A;">${device.status}</strong></div>
          <div>Lần bảo trì gần nhất: <strong>${device.last_maintenance}</strong></div>
          <div>Ngày AI đề xuất bảo dưỡng: <strong style="color: #DC2626;">${dateStr}</strong></div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;">
        <div style="border: 1px solid #E5E7EB; padding: 16px; background: #FFFFFF;">
          <div style="font-size: 12px; font-weight: 700; color: #111827; margin-bottom: 8px;">
            ĐIỂM SỨC KHỎE AI (HEALTH SCORE)
          </div>
          <div style="display: flex; align-items: baseline; gap: 8px; margin-bottom: 10px;">
            <span style="font-size: 32px; font-weight: 800; font-family: monospace; color: ${device.health_score < 70 ? '#DC2626' : device.health_score < 85 ? '#D97706' : '#16A34A'};">
              ${device.health_score.toFixed(1)}
            </span>
            <span style="font-size: 14px; color: #6B7280;">/ 100 điểm</span>
          </div>
          <div style="font-size: 11px; color: #4B5563; line-height: 1.5;">
            • Phân tích rung động cảm biến: <strong>Bình thường (1.4 mm/s)</strong><br />
            • Nhiệt độ vận hành cuộn dây: <strong>44.5°C</strong><br />
            • Cảnh báo hao mòn bạc đạn / vòng bi: <strong>Mức độ nhẹ</strong>
          </div>
        </div>

        <div style="border: 1px solid #E5E7EB; padding: 16px; background: #FFFFFF;">
          <div style="font-size: 12px; font-weight: 700; color: #111827; margin-bottom: 8px;">
            THÔNG TIN PHÂN CÔNG THỰC HIỆN
          </div>
          <div style="font-size: 12px; line-height: 1.8;">
            <div>Kỹ thuật viên phụ trách: <strong>${techName}</strong></div>
            <div>Mức độ ưu tiên: <strong style="color: #DC2626;">${priorityLevel}</strong></div>
            <div>Dự kiến hoàn thành: <strong>Trong ngày ${dateStr}</strong></div>
            <div>Vật tư dự phòng: <strong>Dầu mỡ bôi trơn, lọc gió công nghiệp</strong></div>
          </div>
        </div>
      </div>

      <div style="border: 1px solid #E5E7EB; padding: 16px; background: #F9FAFB; margin-bottom: 24px; font-size: 12px;">
        <div style="font-size: 13px; font-weight: 800; color: #111827; text-transform: uppercase; margin-bottom: 10px;">
          2. Các Hạng Mục Kiểm Tra & Bảo Dưỡng Bắt Buộc (Checklist)
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
          <thead>
            <tr style="background: #E5E7EB; color: #374151;">
              <th style="padding: 8px; text-align: center; width: 40px;">STT</th>
              <th style="padding: 8px; text-align: left;">Hạng Mục Kỹ Thuật</th>
              <th style="padding: 8px; text-align: left;">Tiêu Chuẩn Đạt</th>
              <th style="padding: 8px; text-align: center; width: 80px;">Kết Quả</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #E5E7EB;">
              <td style="padding: 8px; text-align: center;">1</td>
              <td style="padding: 8px;">Kiểm tra điện áp 3 pha và dòng tải định mức động cơ</td>
              <td style="padding: 8px;">380V ± 5%, Dòng lệch pha &lt; 5%</td>
              <td style="padding: 8px; text-align: center; color: #16A34A; font-weight: 700;">[ ] ĐẠT</td>
            </tr>
            <tr style="border-bottom: 1px solid #E5E7EB;">
              <td style="padding: 8px; text-align: center;">2</td>
              <td style="padding: 8px;">Đo kiểm rung động vỏ máy và nhiệt độ hộp số/bạc đạn</td>
              <td style="padding: 8px;">Rung &lt; 2.8 mm/s, Nhiệt độ &lt; 65°C</td>
              <td style="padding: 8px; text-align: center; color: #16A34A; font-weight: 700;">[ ] ĐẠT</td>
            </tr>
            <tr style="border-bottom: 1px solid #E5E7EB;">
              <td style="padding: 8px; text-align: center;">3</td>
              <td style="padding: 8px;">Tra bổ sung mỡ bôi trơn chuyên dụng và siết bu lông chân đế</td>
              <td style="padding: 8px;">Đúng chủng loại mỡ, lực siết đạt chuẩn</td>
              <td style="padding: 8px; text-align: center; color: #16A34A; font-weight: 700;">[ ] ĐẠT</td>
            </tr>
            <tr style="border-bottom: 1px solid #E5E7EB;">
              <td style="padding: 8px; text-align: center;">4</td>
              <td style="padding: 8px;">Kiểm tra tiếp địa an toàn PCCC và rơ-le chống rò điện</td>
              <td style="padding: 8px;">Điện trở tiếp địa &lt; 4 Ohm, Rơ-le phản hồi &lt; 0.1s</td>
              <td style="padding: 8px; text-align: center; color: #16A34A; font-weight: 700;">[ ] ĐẠT</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style="border: 1px solid #E5E7EB; padding: 12px 16px; margin-bottom: 24px; font-size: 12px; background: #FFFFFF;">
        <span style="font-weight: 700; color: #4B5563;">Ghi chú / Chỉ đạo của Trưởng BQL:</span>
        <div style="color: #111827; margin-top: 4px; font-style: italic;">
          ${notes || 'Yêu cầu kỹ thuật viên thi công trong khung giờ thấp điểm (09:30 - 11:30 hoặc 14:00 - 16:30), đặt biển cảnh báo khu vực kỹ thuật và ghi nhận nhật ký BMS sau khi hoàn tất.'}
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 24px; padding-top: 20px; border-top: 1px solid #E5E7EB; font-size: 12px; text-align: center;">
        <div>
          <div style="font-weight: 700; text-transform: uppercase; color: #4B5563;">Kỹ Thuật Viên Thi Công</div>
          <div style="font-size: 11px; color: #9CA3AF; margin-top: 4px;">(Ký và ghi rõ họ tên)</div>
          <div style="height: 50px;"></div>
          <div style="font-weight: 700; color: #111827;">${techName}</div>
        </div>
        <div>
          <div style="font-weight: 700; text-transform: uppercase; color: #4B5563;">Kỹ Sư Trưởng / Trưởng Ban Quản Lý</div>
          <div style="font-size: 11px; color: #9CA3AF; margin-top: 4px;">(Phê duyệt kế hoạch)</div>
          <div style="height: 50px;"></div>
          <div style="font-weight: 700; color: #111827;">Kỹ Sư Trưởng Quản Trị BMS</div>
        </div>
      </div>
    `;

    document.body.appendChild(container);

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    document.body.removeChild(container);

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`PhieuBaoTri_${device.category.replace(/\s+/g, '_')}_${device.id}.pdf`);
    return true;
  } catch (err) {
    console.error('Lỗi khi xuất PDF phiếu bảo trì:', err);
    return false;
  }
}
