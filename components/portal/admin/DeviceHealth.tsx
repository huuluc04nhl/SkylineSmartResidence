'use client';

import React, { useState } from 'react';
import { DEMO_DEVICES, Device } from '@/lib/dataStore';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Wrench, 
  Calendar, 
  Sparkles, 
  FileText, 
  Download, 
  X, 
  ShieldCheck, 
  Gauge, 
  Clock, 
  Radio, 
  Check, 
  RefreshCw,
  Cpu
} from 'lucide-react';
import { exportMaintenanceTicketPdf } from '@/lib/pdfExport';

export default function DeviceHealth() {
  const [devices, setDevices] = useState<Device[]>(DEMO_DEVICES);
  const [selectedDeviceForHistory, setSelectedDeviceForHistory] = useState<Device | null>(null);
  const [selectedDeviceForMaintenance, setSelectedDeviceForMaintenance] = useState<Device | null>(null);
  
  // State form tạo phiếu bảo trì
  const [techName, setTechName] = useState('Lê Văn Kỹ Thuật (Kỹ Sư Trưởng BMS)');
  const [priority, setPriority] = useState<'Cấp bách' | 'Cao' | 'Bình thường'>('Cao');
  const [scheduledDate, setScheduledDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // Toast thông báo
  const [toast, setToast] = useState<{
    show: boolean;
    title: string;
    message: string;
    type: 'success' | 'info';
  } | null>(null);

  const showToast = (title: string, message: string, type: 'success' | 'info' = 'success') => {
    setToast({ show: true, title, message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Mở modal tạo phiếu bảo trì
  const handleOpenMaintenanceModal = (device: Device) => {
    setSelectedDeviceForMaintenance(device);
    setScheduledDate(device.predict_date);
    setPriority(device.health_score < 70 ? 'Cấp bách' : device.health_score < 85 ? 'Cao' : 'Bình thường');
    setNotes(`Bảo dưỡng dự phòng theo khuyến nghị AI: Căn chỉnh thông số kỹ thuật và tra dầu bôi trơn hệ thống ${device.name}.`);
  };

  // Xuất phiếu PDF từ modal
  const handleExportPdf = async (device: Device) => {
    setIsExportingPdf(true);
    const success = await exportMaintenanceTicketPdf({
      device,
      assignedTechnician: techName,
      priority,
      scheduledDate: scheduledDate || device.predict_date,
      notes: notes || undefined,
    });
    setIsExportingPdf(false);

    if (success) {
      showToast(
        'Xuất File PDF Thành Công!',
        `Đã xuất Lệnh Bảo Trì Kỹ Thuật cho hệ thống ${device.name} ra file PDF.`
      );
    } else {
      showToast('Lỗi Xuất File', 'Không thể tạo file PDF. Vui lòng thử lại.', 'info');
    }
  };

  // Xác nhận tạo phiếu vào hệ thống
  const handleSaveTicket = (device: Device) => {
    showToast(
      'Khởi Tạo Phiếu Bảo Trì Thành Công!',
      `Đã phân công kỹ sư "${techName}" xử lý bảo trì cho thiết bị ${device.name} vào ngày ${scheduledDate || device.predict_date}.`
    );
    setSelectedDeviceForMaintenance(null);
  };

  // Quét radar chẩn đoán toàn bộ thiết bị
  const handleScanAll = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      showToast(
        'Hoàn Tất Quét Chẩn Đoán BMS IoT',
        `Đã đồng bộ thời gian thực ${devices.length} trạm cảm biến. Toàn bộ thiết bị đang hoạt động ổn định.`
      );
    }, 1200);
  };

  return (
    <div className="space-y-6 relative">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 max-w-md bg-[#161B22] border-2 border-[#C5A880] p-4 shadow-2xl animate-fadeIn flex items-start justify-between gap-3 text-white">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-serif text-sm font-bold text-[#C5A880] uppercase tracking-wider">
                {toast.title}
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">{toast.message}</p>
            </div>
          </div>
          <button 
            onClick={() => setToast(null)}
            className="text-gray-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222B35] pb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-semibold flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" /> Hạ Tầng Chung Cư • IoT & Giám Sát Kỹ Thuật
          </div>
          <h2 className="font-serif text-2xl text-white font-bold mt-1">
            Giám Sát Hạ Tầng Kỹ Thuật & Dự Báo Bảo Trì
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleScanAll}
            disabled={isScanning}
            className="px-3.5 py-2 bg-[#161B22] border border-[#2D3748] hover:border-[#C5A880] text-gray-200 text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5"
          >
            {isScanning ? (
              <RefreshCw className="w-3.5 h-3.5 text-[#C5A880] animate-spin" />
            ) : (
              <Cpu className="w-3.5 h-3.5 text-[#C5A880]" />
            )}
            <span>{isScanning ? 'Đang Chẩn Đoán...' : 'Chẩn Đoán Toàn Bộ IoT'}</span>
          </button>

          <span className="hidden md:inline-block px-3 py-2 bg-[#121820] border border-[#2D3748] text-xs text-[#C5A880]">
            BMS IoT: {devices.length} Hệ Thống Kỹ Thuật (Tháp BS-07)
          </span>
        </div>
      </div>

      {/* Grid of Devices */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {devices.map((device) => {
          const isDanger = device.health_score < 60;
          const isWarning = device.health_score >= 60 && device.health_score < 80;

          return (
            <div
              key={device.id}
              className="p-5 bg-[#121820] border border-[#222B35] space-y-4 hover:border-[#C5A880] transition-colors shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2 py-0.5 bg-[#1C2533] border border-gray-700 text-gray-300 text-[10px] uppercase font-mono">
                    {device.category}
                  </span>
                  <h3 className="font-serif text-lg text-white font-bold mt-1">
                    {device.name}
                  </h3>
                  <div className="text-xs text-gray-400 mt-0.5">{device.location}</div>
                </div>

                <span className={`px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${
                  isDanger ? 'bg-red-950 text-red-400 border border-red-500' :
                  isWarning ? 'bg-amber-950 text-amber-400 border border-amber-500' :
                  'bg-emerald-950 text-emerald-400 border border-emerald-500'
                }`}>
                  {device.status}
                </span>
              </div>

              {/* Health Score Gauge */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400 flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-[#C5A880]" /> Điểm sức khỏe AI (Health Score):
                  </span>
                  <strong className={`font-mono text-sm ${
                    isDanger ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {device.health_score.toFixed(1)} / 100
                  </strong>
                </div>

                <div className="w-full h-2.5 bg-[#1C2533] border border-[#2D3748] overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 ${
                      isDanger ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${device.health_score}%` }}
                  ></div>
                </div>
              </div>

              {/* Maintenance Prediction info */}
              <div className="p-3 bg-[#161B22] border border-[#222B35] space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" /> AI Dự Báo Ngày Cần Bảo Dưỡng:
                  </span>
                  <strong className="text-[#C5A880] font-mono">{device.predict_date}</strong>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Lần bảo trì gần nhất:</span>
                  <span className="font-mono">{device.last_maintenance}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex justify-end gap-2">
                <button 
                  onClick={() => setSelectedDeviceForHistory(device)}
                  className="px-3 py-1.5 bg-[#1C2533] border border-gray-700 hover:border-gray-400 text-xs text-gray-200 transition-colors flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-[#C5A880]" />
                  <span>Xem Lý Lịch</span>
                </button>
                <button 
                  onClick={() => handleOpenMaintenanceModal(device)}
                  className="px-3.5 py-1.5 bg-[#C5A880] text-[#0D1117] text-xs font-bold uppercase tracking-wider hover:bg-white transition-colors flex items-center gap-1.5 shadow"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Tạo Phiếu Bảo Trì Dự Phòng</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODAL 1: XEM HỒ SƠ LÝ LỊCH VẬN HÀNH THIẾT BỊ                  */}
      {/* ------------------------------------------------------------- */}
      {selectedDeviceForHistory && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121820] border border-[#C5A880] max-w-2xl w-full p-6 space-y-5 shadow-2xl animate-fadeIn text-white max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#222B35] pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#C5A880]" />
                <h3 className="font-serif text-lg font-bold text-white">
                  Hồ Sơ Lý Lịch Kỹ Thuật • {selectedDeviceForHistory.category}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedDeviceForHistory(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Thông số định danh */}
              <div className="p-4 bg-[#161B22] border border-[#2D3748] space-y-2">
                <div className="font-bold text-sm text-[#C5A880]">{selectedDeviceForHistory.name}</div>
                <div className="grid grid-cols-2 gap-2 text-gray-300">
                  <div>Mã thiết bị: <span className="font-mono text-white">#{selectedDeviceForHistory.id.toUpperCase()}</span></div>
                  <div>Vị trí: <span className="text-white">{selectedDeviceForHistory.location}</span></div>
                  <div>Năm đưa vào vận hành: <span className="text-white">2024</span></div>
                  <div>Tiêu chuẩn kỹ thuật: <span className="text-emerald-400 font-mono">ISO 9001:2015 / TCVN</span></div>
                  <div>Trạng thái hiện tại: <span className="text-emerald-400 font-bold">{selectedDeviceForHistory.status}</span></div>
                  <div>Chu kỳ kiểm định: <span className="text-white font-mono">03 tháng/lần</span></div>
                </div>
              </div>

              {/* Thông số cảm biến IoT thời gian thực */}
              <div className="space-y-2">
                <div className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Gauge className="w-4 h-4 text-cyan-400" />
                  <span>Dữ Liệu Cảm Biến IoT Trực Tuyến (Telemetrics)</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
                  <div className="p-2.5 bg-[#0D1520] border border-[#222B35] text-center">
                    <div className="text-[10px] text-gray-400 font-sans">Độ Rung Động</div>
                    <div className="font-bold text-emerald-400 text-sm mt-0.5">1.3 mm/s</div>
                    <div className="text-[9px] text-gray-500 font-sans">Tiêu chuẩn &lt; 2.8</div>
                  </div>
                  <div className="p-2.5 bg-[#0D1520] border border-[#222B35] text-center">
                    <div className="text-[10px] text-gray-400 font-sans">Nhiệt Độ Cuộn Dây</div>
                    <div className="font-bold text-amber-400 text-sm mt-0.5">43.8 °C</div>
                    <div className="text-[9px] text-gray-500 font-sans">Ngưỡng &lt; 65°C</div>
                  </div>
                  <div className="p-2.5 bg-[#0D1520] border border-[#222B35] text-center">
                    <div className="text-[10px] text-gray-400 font-sans">Dòng Tải 3 Pha</div>
                    <div className="font-bold text-white text-sm mt-0.5">18.2 A</div>
                    <div className="text-[9px] text-gray-500 font-sans">Định mức 25A</div>
                  </div>
                  <div className="p-2.5 bg-[#0D1520] border border-[#222B35] text-center">
                    <div className="text-[10px] text-gray-400 font-sans">Điểm Sức Khỏe AI</div>
                    <div className="font-bold text-[#C5A880] text-sm mt-0.5">{selectedDeviceForHistory.health_score.toFixed(1)}/100</div>
                    <div className="text-[9px] text-emerald-400 font-sans">Vận hành tốt</div>
                  </div>
                </div>
              </div>

              {/* Lịch sử bảo trì quá khứ */}
              <div className="space-y-2">
                <div className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Nhật Ký Các Đợt Bảo Trì Gần Nhất</span>
                </div>
                <div className="space-y-1.5">
                  <div className="p-2.5 bg-[#161B22] border border-[#222B35] flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white">{selectedDeviceForHistory.last_maintenance} • Bảo dưỡng định kỳ Q3/2026</div>
                      <div className="text-[11px] text-gray-400">Siết ốc bu lông chân đế, bổ sung mỡ bôi trơn bạc đạn, kiểm tra dây curoa.</div>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-500 text-emerald-400 text-[10px] font-bold">
                      HOÀN TẤT
                    </span>
                  </div>
                  <div className="p-2.5 bg-[#161B22] border border-[#222B35] flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white">2026-05-18 • Kiểm tra an toàn điện & PCCC định kỳ Q2/2026</div>
                      <div className="text-[11px] text-gray-400">Đo điện trở tiếp địa rò & thử tải chuyển mạch tự động ATS.</div>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-500 text-emerald-400 text-[10px] font-bold">
                      HOÀN TẤT
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions modal */}
            <div className="pt-3 border-t border-[#222B35] flex justify-between items-center">
              <button
                type="button"
                onClick={() => handleExportPdf(selectedDeviceForHistory)}
                disabled={isExportingPdf}
                className="px-4 py-2 bg-[#1C2533] border border-[#2D3748] hover:border-[#C5A880] text-gray-200 text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5"
              >
                {isExportingPdf ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5 text-[#C5A880]" />}
                <span>{isExportingPdf ? 'Đang Xuất PDF...' : 'Xuất Hồ Sơ Kỹ Thuật PDF'}</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedDeviceForHistory(null)}
                className="px-5 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-colors shadow"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 2: TẠO PHIẾU BẢO TRÌ DỰ PHÒNG THEO AI DỰ BÁO           */}
      {/* ------------------------------------------------------------- */}
      {selectedDeviceForMaintenance && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121820] border border-[#C5A880] max-w-xl w-full p-6 space-y-4 shadow-2xl animate-fadeIn text-white">
            <div className="flex items-center justify-between border-b border-[#222B35] pb-3">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-[#C5A880]" />
                <h3 className="font-serif text-lg font-bold text-white">
                  Lập Phiếu Bảo Trì Dự Phòng
                </h3>
              </div>
              <button 
                onClick={() => setSelectedDeviceForMaintenance(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-[#161B22] border border-[#2D3748] text-xs space-y-1">
              <div>Thiết bị chỉ định: <strong className="text-white text-sm">{selectedDeviceForMaintenance.name}</strong></div>
              <div>Vị trí: <span className="text-gray-300">{selectedDeviceForMaintenance.location}</span></div>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-gray-400">Điểm sức khỏe:</span>
                <strong className="text-emerald-400 font-mono">{selectedDeviceForMaintenance.health_score.toFixed(1)}/100</strong>
                <span className="text-gray-400 ml-3">AI đề xuất bảo dưỡng:</span>
                <strong className="text-[#C5A880] font-mono">{selectedDeviceForMaintenance.predict_date}</strong>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-400 mb-1">Kỹ thuật viên phụ trách:</label>
                <input
                  type="text"
                  value={techName}
                  onChange={(e) => setTechName(e.target.value)}
                  className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white focus:outline-none focus:border-[#C5A880]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1">Mức độ ưu tiên:</label>
                  <select
                    value={priority}
                    onChange={(e: any) => setPriority(e.target.value)}
                    className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white focus:outline-none focus:border-[#C5A880]"
                  >
                    <option value="Bình thường">Bình thường (Định kỳ)</option>
                    <option value="Cao">Cao (Khuyến nghị AI)</option>
                    <option value="Cấp bách">Cấp bách (Cảnh báo rung/nhiệt)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 mb-1">Ngày dự kiến thực hiện:</label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white focus:outline-none focus:border-[#C5A880]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Nội dung chỉ đạo & Checklist kỹ thuật:</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white focus:outline-none focus:border-[#C5A880]"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-[#222B35] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleExportPdf(selectedDeviceForMaintenance)}
                disabled={isExportingPdf}
                className="px-3.5 py-2 bg-[#1C2533] border border-[#2D3748] hover:border-[#C5A880] text-gray-200 text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5"
              >
                {isExportingPdf ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5 text-[#C5A880]" />}
                <span>{isExportingPdf ? 'Đang Xuất...' : 'Tải File PDF'}</span>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDeviceForMaintenance(null)}
                  className="px-3 py-2 border border-gray-700 text-xs text-gray-400 hover:text-white"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveTicket(selectedDeviceForMaintenance)}
                  className="px-5 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-colors shadow flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Xác Nhận Lưu Phiếu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
