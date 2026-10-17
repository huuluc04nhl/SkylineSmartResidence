'use client';

import React, { useState, useEffect } from 'react';
import { DEMO_DEVICES, Device } from '@/lib/dataStore';
import { getTechnicians, createTicketAsync, TechnicianProfile } from '@/lib/ticketStore';
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
  Cpu,
  Plus,
  Search,
  Filter,
  LayoutGrid,
  List,
  Edit,
  Trash2,
  SlidersHorizontal,
  Server,
  Zap,
  Flame,
  Wind,
  Shield,
  Layers
} from 'lucide-react';
import { exportMaintenanceTicketPdf } from '@/lib/pdfExport';
import { useLanguage } from '@/lib/languageContext';

const STORAGE_KEY = 'skyline_bms_devices';

function getStoredDevices(): Device[] {
  if (typeof window === 'undefined') return DEMO_DEVICES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn('Lỗi đọc skyline_bms_devices:', err);
  }
  return DEMO_DEVICES;
}

function saveStoredDevices(devices: Device[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(devices));
  } catch (err) {
    console.warn('Lỗi lưu skyline_bms_devices:', err);
  }
}

export default function DeviceHealth() {
  const { t, isEn } = useLanguage();
  const [devices, setDevices] = useState<Device[]>([]);
  const [technicians, setTechnicians] = useState<TechnicianProfile[]>([]);
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [healthFilter, setHealthFilter] = useState<'ALL' | 'HEALTHY' | 'WARNING'>('ALL');
  const [viewMode, setViewMode] = useState<'GRID' | 'TABLE'>('GRID');

  // Modals state
  const [selectedDeviceForHistory, setSelectedDeviceForHistory] = useState<Device | null>(null);
  const [selectedDeviceForMaintenance, setSelectedDeviceForMaintenance] = useState<Device | null>(null);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form thêm / sửa thiết bị
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<Device['category']>('Thang máy');
  const [formLocation, setFormLocation] = useState('Trục Lõi Tòa BS-07');
  const [formHealthScore, setFormHealthScore] = useState(95);
  const [formPredictDate, setFormPredictDate] = useState('2026-12-30');
  const [formLastMaintenance, setFormLastMaintenance] = useState('2026-09-01');
  const [formStatus, setFormStatus] = useState<Device['status']>('Hoạt động tốt');

  // Form tạo phiếu bảo trì
  const [selectedTechId, setSelectedTechId] = useState('');
  const [techName, setTechName] = useState('Lê Văn Kỹ Thuật (Kỹ Sư Trưởng BMS)');
  const [priority, setPriority] = useState<'Cấp bách' | 'Cao' | 'Bình thường'>('Cao');
  const [scheduledDate, setScheduledDate] = useState('');
  const [notes, setNotes] = useState('');
  const [syncToKanban, setSyncToKanban] = useState(true);
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

  useEffect(() => {
    setDevices(getStoredDevices());
    const techs = getTechnicians();
    setTechnicians(techs);
    if (techs.length > 0) {
      setSelectedTechId(techs[0].id);
      setTechName(`${techs[0].name} (${techs[0].specialty})`);
    }
  }, []);

  // Mở modal tạo phiếu bảo trì
  const handleOpenMaintenanceModal = (device: Device) => {
    setSelectedDeviceForMaintenance(device);
    setScheduledDate(device.predict_date);
    setPriority(device.health_score < 70 ? 'Cấp bách' : device.health_score < 85 ? 'Cao' : 'Bình thường');
    setNotes(
      isEn
        ? `Preventive maintenance based on AI recommendations: Calibrate technical parameters, clean machine room and check safety of ${device.name}.`
        : `Bảo dưỡng dự phòng theo khuyến nghị AI: Căn chỉnh thông số kỹ thuật, vệ sinh buồng máy và kiểm tra an toàn hệ thống ${device.name}.`
    );
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
        t('Xuất File PDF Thành Công!', 'PDF Exported Successfully!'),
        t(`Đã xuất Lệnh Bảo Trì Kỹ Thuật cho hệ thống ${device.name} ra file PDF.`, `Technical Maintenance Work Order for ${device.name} has been exported to PDF.`)
      );
    } else {
      showToast(t('Lỗi Xuất File', 'Export Error'), t('Không thể tạo file PDF. Vui lòng thử lại.', 'Unable to generate PDF file. Please try again.'), 'info');
    }
  };

  // Xác nhận tạo phiếu vào hệ thống
  const handleSaveMaintenanceTicket = async (device: Device) => {
    if (syncToKanban) {
      try {
        await createTicketAsync({
          apt_code: device.location.includes('BS-') ? device.location.split(' ')[0] : 'Kỹ Thuật BMS',
          resident_name: t('Ban Quản Lý Tòa Nhà', 'Property Management Board'),
          resident_phone: '1900 8899',
          content: `[BMS PREVENTIVE WORK ORDER] ${device.name} (${device.location}). Scope: ${notes}`,
          ticket_type: 'REPAIR',
          ticket_type_label: t('Bảo Trì Định Kỳ Thiết Bị', 'Preventive Equipment Maintenance'),
          ai_category: device.category === 'Máy bơm' ? 'Nước' : device.category === 'Trạm biến áp' ? 'Điện' : 'Khác',
        });
      } catch (e) {
        console.warn('Lỗi đồng bộ ticket vào Kanban:', e);
      }
    }

    showToast(
      t('Khởi Tạo Phiếu Bảo Trì Thành Công!', 'Maintenance Ticket Created!'),
      t(
        `Đã phân công "${techName}" xử lý bảo trì cho thiết bị ${device.name} vào ngày ${scheduledDate || device.predict_date}${syncToKanban ? ' (Đã đồng bộ lên Kanban điều phối)' : ''}.`,
        `Assigned "${techName}" to maintain ${device.name} on ${scheduledDate || device.predict_date}${syncToKanban ? ' (Synced to Dispatch Kanban)' : ''}.`
      )
    );
    setSelectedDeviceForMaintenance(null);
  };

  // Quét radar chẩn đoán toàn bộ thiết bị
  const handleScanAll = () => {
    setIsScanning(true);
    setTimeout(() => {
      const updated = devices.map(d => {
        const delta = (Math.random() * 2 - 1) * 0.5;
        const newScore = Math.min(100, Math.max(50, +(d.health_score + delta).toFixed(1)));
        const newStatus: Device['status'] = newScore >= 80 ? 'Hoạt động tốt' : newScore >= 60 ? 'Cần kiểm tra' : 'Cảnh báo hỏng';
        return {
          ...d,
          health_score: newScore,
          status: newStatus
        };
      });
      setDevices(updated);
      saveStoredDevices(updated);
      setIsScanning(false);
      showToast(
        t('Hoàn Tất Quét Chẩn Đoán BMS IoT', 'IoT BMS Diagnostic Completed'),
        t(`Đã đồng bộ dữ liệu telemetrics thời gian thực cho ${devices.length} trạm thiết bị. Hệ thống vận hành ổn định.`, `Synchronized real-time telemetrics for ${devices.length} equipment stations. All systems normal.`)
      );
    }, 1200);
  };

  // Mở modal Thêm Thiết Bị
  const handleOpenAddModal = () => {
    setFormName('');
    setFormCategory('Thang máy');
    setFormLocation('Tòa BS-07');
    setFormHealthScore(98);
    setFormPredictDate(new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0]);
    setFormLastMaintenance(new Date().toISOString().split('T')[0]);
    setFormStatus('Hoạt động tốt');
    setIsAddModalOpen(true);
  };

  // Mở modal Sửa Thiết Bị
  const handleOpenEditModal = (device: Device) => {
    setEditingDevice(device);
    setFormName(device.name);
    setFormCategory(device.category);
    setFormLocation(device.location);
    setFormHealthScore(device.health_score);
    setFormPredictDate(device.predict_date);
    setFormLastMaintenance(device.last_maintenance);
    setFormStatus(device.status);
  };

  // Lưu Thêm Mới
  const handleSaveAddDevice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert(t('Vui lòng nhập tên thiết bị!', 'Please enter equipment name!'));
      return;
    }
    const newDev: Device = {
      id: `dev-${Date.now().toString().slice(-4)}`,
      name: formName.trim(),
      category: formCategory,
      location: formLocation.trim() || 'Tòa BS-07',
      health_score: Number(formHealthScore) || 90,
      predict_date: formPredictDate || '2026-12-30',
      last_maintenance: formLastMaintenance || new Date().toISOString().split('T')[0],
      status: formStatus,
    };
    const nextList = [newDev, ...devices];
    setDevices(nextList);
    saveStoredDevices(nextList);
    setIsAddModalOpen(false);
    showToast(t('Đã Thêm Thiết Bị!', 'Equipment Added!'), t(`Thiết bị "${newDev.name}" đã được ghi nhận vào hệ thống quản lý hạ tầng.`, `Equipment "${newDev.name}" has been recorded into the BMS system.`));
  };

  // Lưu Chỉnh Sửa
  const handleSaveEditDevice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDevice || !formName.trim()) return;

    const updatedList = devices.map(d => {
      if (d.id === editingDevice.id) {
        return {
          ...d,
          name: formName.trim(),
          category: formCategory,
          location: formLocation.trim(),
          health_score: Number(formHealthScore),
          predict_date: formPredictDate,
          last_maintenance: formLastMaintenance,
          status: formStatus,
        };
      }
      return d;
    });

    setDevices(updatedList);
    saveStoredDevices(updatedList);
    setEditingDevice(null);
    showToast(t('Cập Nhật Thành Công!', 'Updated Successfully!'), t(`Đã lưu các thay đổi cho thiết bị #${editingDevice.id.toUpperCase()}.`, `Saved changes for equipment #${editingDevice.id.toUpperCase()}.`));
  };

  // Xóa Thiết Bị
  const handleDeleteDevice = (device: Device) => {
    if (!window.confirm(t(`Xác nhận xóa hoặc thanh lý thiết bị "${device.name}" khỏi hệ thống BMS?`, `Confirm deleting equipment "${device.name}" from BMS registry?`))) {
      return;
    }
    const filtered = devices.filter(d => d.id !== device.id);
    setDevices(filtered);
    saveStoredDevices(filtered);
    showToast(t('Đã Xóa Thiết Bị', 'Equipment Deleted'), t(`Thiết bị #${device.id.toUpperCase()} đã được gỡ khỏi danh sách quản lý.`, `Equipment #${device.id.toUpperCase()} removed from registry.`), 'info');
  };

  // Reset về demo ban đầu nếu cần
  const handleResetDemo = () => {
    if (!window.confirm(t('Khôi phục danh sách thiết bị về mặc định ban đầu của tòa nhà?', 'Restore equipment registry to default Tropical specifications?'))) return;
    setDevices(DEMO_DEVICES);
    saveStoredDevices(DEMO_DEVICES);
    showToast(t('Đã Khôi Phục', 'Restored'), t('Đã tải lại cấu hình thiết bị chuẩn hạ tầng The Tropical.', 'Reloaded standard The Tropical facility specifications.'));
  };

  // Filtered devices
  const filteredDevices = devices.filter(d => {
    const matchesSearch = 
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCat = categoryFilter === 'ALL' || d.category === categoryFilter;
    const matchesHealth = 
      healthFilter === 'ALL' ||
      (healthFilter === 'HEALTHY' && d.health_score >= 80) ||
      (healthFilter === 'WARNING' && d.health_score < 80);

    return matchesSearch && matchesCat && matchesHealth;
  });

  // KPI calculations
  const totalCount = devices.length;
  const healthyCount = devices.filter(d => d.health_score >= 80).length;
  const warningCount = devices.filter(d => d.health_score < 80).length;
  const avgHealth = totalCount > 0 ? (devices.reduce((acc, d) => acc + d.health_score, 0) / totalCount).toFixed(1) : '100';

  const categories = [
    { key: 'ALL', label: t('Tất Cả Danh Mục', 'All Categories') },
    { key: 'Thang máy', label: t('Thang máy', 'Elevator') },
    { key: 'Máy bơm', label: t('Máy bơm', 'Water Pump') },
    { key: 'Hệ thống PCCC', label: t('Hệ thống PCCC', 'Fire Safety') },
    { key: 'Trạm biến áp', label: t('Trạm biến áp', 'Transformer & Gen') },
    { key: 'Barrier', label: t('Barrier & An ninh', 'Barrier & Security') },
    { key: 'Thông gió & Hút khói', label: t('Thông gió & Hút khói', 'Ventilation & Smoke') }
  ];

  const getStatusBadge = (status: Device['status'], isDanger: boolean, isWarning: boolean) => {
    const label = status === 'Hoạt động tốt' 
      ? t('Hoạt động tốt', 'Normal') 
      : status === 'Cần kiểm tra' 
      ? t('Cần kiểm tra', 'Inspect') 
      : t('Cảnh báo hỏng', 'Warning');

    return (
      <span className={`px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider shrink-0 rounded-none ${
        isDanger ? 'bg-red-950 text-red-400 border border-red-500' :
        isWarning ? 'bg-amber-950 text-amber-400 border border-amber-500' :
        'bg-emerald-950 text-emerald-400 border border-emerald-500'
      }`}>
        {label}
      </span>
    );
  };

  return (
    <div className="space-y-6 relative animate-fadeIn">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 max-w-md bg-[#161B22] border border-[#C5A880] p-4 shadow-2xl animate-fadeIn flex items-start justify-between gap-3 text-white rounded-none">
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

      {/* Header & Main Control Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#222B35] pb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-semibold flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" /> {t('Hạ Tầng Kỹ Thuật • BMS IoT Toàn Tòa', 'Technical Infrastructure • Facility BMS IoT')}
          </div>
          <h2 className="font-serif text-2xl text-white font-bold mt-1">
            {t('Quản Lý Thiết Bị & Sức Khỏe BMS', 'Equipment Management & BMS Health')}
          </h2>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={handleScanAll}
            disabled={isScanning}
            className="px-3.5 py-2 bg-[#161B22] border border-[#2D3748] hover:border-[#C5A880] text-gray-200 text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 rounded-none"
            title={t('Quét dữ liệu cảm biến IoT thời gian thực', 'Scan real-time IoT sensor telemetry')}
          >
            {isScanning ? (
              <RefreshCw className="w-3.5 h-3.5 text-[#C5A880] animate-spin" />
            ) : (
              <Cpu className="w-3.5 h-3.5 text-[#C5A880]" />
            )}
            <span>{isScanning ? t('Đang Chẩn Đoán...', 'Diagnosing...') : t('Chẩn Đoán Radar IoT', 'IoT Radar Diagnosis')}</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-3.5 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 rounded-none shadow"
          >
            <Plus className="w-4 h-4" />
            <span>{t('Thêm Thiết Bị', 'Add Equipment')}</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-[#121820] border border-[#222B35] space-y-1 rounded-none">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>{t('Tổng Trạm Thiết Bị', 'Total Equipment')}</span>
            <Server className="w-4 h-4 text-[#C5A880]" />
          </div>
          <div className="font-serif text-2xl font-bold text-white mt-1">
            {totalCount} <span className="text-xs font-sans text-gray-500 font-normal">{t('cụm', 'units')}</span>
          </div>
          <div className="text-[10px] text-gray-400 font-mono">{t('Bao gồm 4 tòa BS-07 - BS-10', 'Covering 4 towers BS-07 - BS-10')}</div>
        </div>

        <div className="p-4 bg-[#121820] border border-emerald-500/30 space-y-1 rounded-none">
          <div className="flex items-center justify-between text-xs text-emerald-400">
            <span>{t('Vận Hành Ổn Định', 'Operating Normally')}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-serif text-2xl font-bold text-emerald-400 mt-1">
            {healthyCount} <span className="text-xs font-sans text-emerald-500/80 font-normal">{t('trạm', 'units')}</span>
          </div>
          <div className="text-[10px] text-emerald-500 font-mono">{t('Điểm sức khỏe AI ≥ 80%', 'AI Health Score ≥ 80%')}</div>
        </div>

        <div className="p-4 bg-[#121820] border border-amber-500/30 space-y-1 rounded-none">
          <div className="flex items-center justify-between text-xs text-amber-400">
            <span>{t('Cần Bảo Dưỡng / Cảnh Báo', 'Maintenance / Warning')}</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="font-serif text-2xl font-bold text-amber-400 mt-1">
            {warningCount} <span className="text-xs font-sans text-amber-500/80 font-normal">{t('trạm', 'units')}</span>
          </div>
          <div className="text-[10px] text-amber-500 font-mono">{t('Khuyến nghị lập lịch bảo trì', 'Maintenance recommended')}</div>
        </div>

        <div className="p-4 bg-[#121820] border border-[#222B35] space-y-1 rounded-none">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>{t('Chỉ Số Sức Khỏe AI Toàn Khu', 'System-wide AI Health Score')}</span>
            <Activity className="w-4 h-4 text-[#C5A880]" />
          </div>
          <div className="font-serif text-2xl font-bold text-[#C5A880] mt-1 font-mono">
            {avgHealth} <span className="text-xs font-sans text-gray-400 font-normal">/ 100</span>
          </div>
          <div className="text-[10px] text-gray-400 font-mono">{t('Đánh giá theo chuẩn BMS Otis & Schneider', 'Rated by Otis & Schneider standards')}</div>
        </div>
      </div>

      {/* Search & Category Filter Toolbar */}
      <div className="p-3.5 bg-[#121820] border border-[#222B35] flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-none">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder={t('Tìm theo tên thiết bị, mã thiết bị (#DEV-01), vị trí...', 'Search by equipment name, ID (#DEV-01), location...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#161B22] border border-[#2D3748] text-xs text-white pl-9 pr-3 py-2 focus:outline-none focus:border-[#C5A880] rounded-none"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={healthFilter}
            onChange={(e: any) => setHealthFilter(e.target.value)}
            className="bg-[#161B22] border border-[#2D3748] text-xs text-gray-300 py-2 px-2.5 focus:outline-none focus:border-[#C5A880] rounded-none"
          >
            <option value="ALL">{t('Mọi trạng thái sức khỏe', 'All Health Statuses')}</option>
            <option value="HEALTHY">{t('Hoạt động tốt (≥ 80%)', 'Operating Well (≥ 80%)')}</option>
            <option value="WARNING">{t('Cần bảo dưỡng (< 80%)', 'Maintenance Needed (< 80%)')}</option>
          </select>

          {/* View Toggle */}
          <div className="flex items-center border border-[#2D3748] bg-[#161B22]">
            <button
              onClick={() => setViewMode('GRID')}
              className={`p-2 transition-colors ${viewMode === 'GRID' ? 'bg-[#C5A880] text-[#0D1117]' : 'text-gray-400 hover:text-white'}`}
              title={t('Dạng Lưới Thẻ IoT', 'IoT Grid View')}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('TABLE')}
              className={`p-2 transition-colors ${viewMode === 'TABLE' ? 'bg-[#C5A880] text-[#0D1117]' : 'text-gray-400 hover:text-white'}`}
              title={t('Dạng Bảng Kiểm Kê', 'Inventory Table View')}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setCategoryFilter(cat.key)}
            className={`px-3 py-1.5 border whitespace-nowrap text-xs transition-colors rounded-none ${
              categoryFilter === cat.key
                ? 'bg-[#C5A880] text-[#0D1117] border-[#C5A880] font-bold'
                : 'bg-[#121820] border-[#222B35] text-gray-300 hover:border-gray-500'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Main Content: GRID VIEW */}
      {viewMode === 'GRID' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDevices.map((device) => {
            const isDanger = device.health_score < 60;
            const isWarning = device.health_score >= 60 && device.health_score < 80;

            return (
              <div
                key={device.id}
                className="p-4 bg-[#121820] border border-[#222B35] hover:border-[#C5A880]/60 space-y-3.5 transition-colors shadow-lg rounded-none relative"
              >
                {/* Header card */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 bg-[#1C2533] border border-gray-700 text-gray-300 text-[10px] uppercase font-mono">
                        #{device.id.toUpperCase()}
                      </span>
                      <span className="text-[11px] text-[#C5A880] font-medium truncate">
                        {device.category}
                      </span>
                    </div>
                    <h3 className="font-serif text-base text-white font-bold mt-1 line-clamp-1" title={device.name}>
                      {device.name}
                    </h3>
                    <div className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1 truncate">
                      <span>{t('Vị trí:', 'Location:')}</span>
                      <span className="text-gray-300">{device.location}</span>
                    </div>
                  </div>

                  {getStatusBadge(device.status, isDanger, isWarning)}
                </div>

                {/* AI Health Score Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400 flex items-center gap-1">
                      <Activity className="w-3.5 h-3.5 text-[#C5A880]" /> {t('Sức khỏe AI:', 'AI Health:')}
                    </span>
                    <strong className={`font-mono text-sm ${
                      isDanger ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {device.health_score.toFixed(1)} / 100
                    </strong>
                  </div>

                  <div className="w-full h-2 bg-[#1C2533] border border-[#2D3748] overflow-hidden rounded-none">
                    <div
                      className={`h-full transition-all duration-700 ${
                        isDanger ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${device.health_score}%` }}
                    ></div>
                  </div>
                </div>

                {/* Live Telemetrics mini strip */}
                <div className="grid grid-cols-3 gap-1.5 p-2 bg-[#0E131B] border border-[#222B35] font-mono text-center text-[10px]">
                  <div>
                    <span className="text-gray-500 block text-[9px]">{t('RUNG ĐỘNG', 'VIBRATION')}</span>
                    <span className="text-emerald-400 font-bold">1.2 mm/s</span>
                  </div>
                  <div className="border-x border-[#222B35]">
                    <span className="text-gray-500 block text-[9px]">{t('NHIỆT ĐỘ', 'TEMP')}</span>
                    <span className="text-amber-400 font-bold">42.5 °C</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[9px]">{t('DÒNG TẢI', 'CURRENT')}</span>
                    <span className="text-white font-bold">18.6 A</span>
                  </div>
                </div>

                {/* Maintenance details */}
                <div className="p-2.5 bg-[#161B22] border border-[#222B35] space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" /> {t('Dự báo bảo dưỡng:', 'Forecasted Maint:')}
                    </span>
                    <strong className="text-[#C5A880] font-mono">{device.predict_date}</strong>
                  </div>
                  <div className="flex justify-between text-gray-400 text-[11px]">
                    <span>{t('Bảo trì gần nhất:', 'Last Maint:')}</span>
                    <span className="font-mono text-gray-300">{device.last_maintenance}</span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-2 border-t border-[#1E2630] flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditModal(device)}
                      className="p-1.5 text-gray-400 hover:text-white border border-[#222B35] hover:border-[#C5A880] rounded-none transition-colors"
                      title={t('Sửa thông số thiết bị', 'Edit equipment details')}
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteDevice(device)}
                      className="p-1.5 text-gray-400 hover:text-rose-400 border border-[#222B35] hover:border-rose-500 rounded-none transition-colors"
                      title={t('Xóa thiết bị', 'Delete equipment')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => setSelectedDeviceForHistory(device)}
                      className="px-2.5 py-1.5 bg-[#1C2533] border border-gray-700 hover:border-gray-400 text-xs text-gray-200 transition-colors flex items-center gap-1 rounded-none"
                    >
                      <FileText className="w-3 h-3 text-[#C5A880]" />
                      <span>{t('Lý Lịch', 'Dossier')}</span>
                    </button>
                    <button 
                      onClick={() => handleOpenMaintenanceModal(device)}
                      className="px-3 py-1.5 bg-[#C5A880] text-[#0D1117] text-xs font-bold uppercase tracking-wider hover:bg-white transition-colors flex items-center gap-1 rounded-none shadow"
                    >
                      <Wrench className="w-3 h-3" />
                      <span>{t('Lập Phiếu Bảo Trì', 'Issue Ticket')}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Content: TABLE VIEW */}
      {viewMode === 'TABLE' && (
        <div className="overflow-x-auto bg-[#121820] border border-[#222B35] rounded-none">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-[#0E131B] text-[10px] uppercase font-mono tracking-wider text-gray-400 border-b border-[#222B35]">
              <tr>
                <th className="p-3">{t('Mã', 'ID')}</th>
                <th className="p-3">{t('Tên Thiết Bị & Vị Trí', 'Equipment & Location')}</th>
                <th className="p-3">{t('Danh Mục', 'Category')}</th>
                <th className="p-3">{t('Sức Khỏe AI', 'AI Health')}</th>
                <th className="p-3">{t('Dự Báo Bảo Dưỡng', 'Maintenance Due')}</th>
                <th className="p-3">{t('Trạng Thái', 'Status')}</th>
                <th className="p-3 text-right">{t('Thao Tác', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2630]">
              {filteredDevices.map((device) => {
                const isDanger = device.health_score < 60;
                const isWarning = device.health_score >= 60 && device.health_score < 80;

                return (
                  <tr key={device.id} className="hover:bg-[#161B22] transition-colors">
                    <td className="p-3 font-mono text-gray-400">
                      #{device.id.toUpperCase()}
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-white">{device.name}</div>
                      <div className="text-[11px] text-gray-400">{device.location}</div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-[#1C2533] border border-gray-700 text-gray-300 text-[10px] uppercase font-mono">
                        {device.category}
                      </span>
                    </td>
                    <td className="p-3 font-mono">
                      <span className={`font-bold ${isDanger ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {device.health_score.toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[#C5A880]">
                      {device.predict_date}
                    </td>
                    <td className="p-3">
                      {getStatusBadge(device.status, isDanger, isWarning)}
                    </td>
                    <td className="p-3 text-right space-x-1">
                      <button
                        onClick={() => setSelectedDeviceForHistory(device)}
                        className="px-2 py-1 bg-[#1C2533] hover:bg-[#2D3748] text-[11px] text-gray-300 rounded-none border border-gray-700"
                        title={t('Xem lý lịch', 'View dossier')}
                      >
                        {t('Lý Lịch', 'Dossier')}
                      </button>
                      <button
                        onClick={() => handleOpenMaintenanceModal(device)}
                        className="px-2 py-1 bg-[#C5A880] hover:bg-white text-[11px] text-[#0D1117] font-bold rounded-none"
                        title={t('Lập phiếu bảo trì', 'Issue ticket')}
                      >
                        {t('Bảo Trì', 'Ticket')}
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(device)}
                        className="px-2 py-1 bg-transparent hover:bg-[#1E2630] text-[11px] text-gray-400 hover:text-white rounded-none border border-transparent hover:border-gray-700"
                      >
                        {t('Sửa', 'Edit')}
                      </button>
                      <button
                        onClick={() => handleDeleteDevice(device)}
                        className="px-2 py-1 bg-transparent hover:bg-rose-950 text-[11px] text-gray-400 hover:text-rose-400 rounded-none border border-transparent hover:border-rose-700"
                      >
                        {t('Xóa', 'Delete')}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {filteredDevices.length === 0 && (
        <div className="p-12 text-center bg-[#121820] border border-[#222B35] space-y-3 rounded-none">
          <Server className="w-10 h-10 text-gray-500 mx-auto" />
          <div className="text-white font-semibold">{t('Không tìm thấy thiết bị phù hợp', 'No matching equipment found')}</div>
          <p className="text-xs text-gray-400">{t('Hãy thử tìm kiếm từ khóa khác hoặc bấm khôi phục danh sách mặc định.', 'Try another keyword or restore default equipment list.')}</p>
          <button
            onClick={handleResetDemo}
            className="px-3.5 py-1.5 bg-[#161B22] border border-[#C5A880] text-[#C5A880] text-xs font-semibold rounded-none hover:bg-[#C5A880] hover:text-[#0D1117] transition-colors"
          >
            {t('Khôi Phục Danh Mục Chuẩn The Tropical', 'Restore The Tropical Standard Registry')}
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 1: XEM HỒ SƠ LÝ LỊCH VẬN HÀNH THIẾT BỊ                  */}
      {/* ------------------------------------------------------------- */}
      {selectedDeviceForHistory && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#121820] border border-[#C5A880] max-w-2xl w-full p-5 sm:p-6 space-y-4 shadow-2xl animate-fadeIn text-white max-h-[90vh] overflow-y-auto rounded-none">
            <div className="flex items-center justify-between border-b border-[#222B35] pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#C5A880]" />
                <h3 className="font-serif text-lg font-bold text-white">
                  {t('Hồ Sơ Lý Lịch Kỹ Thuật', 'Technical Dossier')} • {selectedDeviceForHistory.category}
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
              <div className="p-3.5 bg-[#161B22] border border-[#2D3748] space-y-2 rounded-none">
                <div className="font-bold text-sm text-[#C5A880]">{selectedDeviceForHistory.name}</div>
                <div className="grid grid-cols-2 gap-2 text-gray-300">
                  <div>{t('Mã thiết bị:', 'Equipment ID:')} <span className="font-mono text-white">#{selectedDeviceForHistory.id.toUpperCase()}</span></div>
                  <div>{t('Vị trí:', 'Location:')} <span className="text-white">{selectedDeviceForHistory.location}</span></div>
                  <div>{t('Năm đưa vào vận hành:', 'Commissioning Year:')} <span className="text-white">2024</span></div>
                  <div>{t('Tiêu chuẩn kỹ thuật:', 'Technical Standard:')} <span className="text-emerald-400 font-mono">ISO 9001:2015 / TCVN</span></div>
                  <div>{t('Trạng thái hiện tại:', 'Current Status:')} <span className="text-emerald-400 font-bold">{selectedDeviceForHistory.status}</span></div>
                  <div>{t('Chu kỳ kiểm định:', 'Inspection Interval:')} <span className="text-white font-mono">{t('03 tháng/lần', 'Every 3 months')}</span></div>
                </div>
              </div>

              {/* Thông số cảm biến IoT thời gian thực */}
              <div className="space-y-2">
                <div className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Gauge className="w-4 h-4 text-cyan-400" />
                  <span>{t('Dữ Liệu Cảm Biến IoT Trực Tuyến (Telemetrics)', 'Real-time IoT Telemetrics')}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
                  <div className="p-2.5 bg-[#0D1520] border border-[#222B35] text-center rounded-none">
                    <div className="text-[10px] text-gray-400 font-sans">{t('Độ Rung Động', 'Vibration')}</div>
                    <div className="font-bold text-emerald-400 text-sm mt-0.5">1.3 mm/s</div>
                    <div className="text-[9px] text-gray-500 font-sans">{t('Tiêu chuẩn < 2.8', 'Standard < 2.8')}</div>
                  </div>
                  <div className="p-2.5 bg-[#0D1520] border border-[#222B35] text-center rounded-none">
                    <div className="text-[10px] text-gray-400 font-sans">{t('Nhiệt Độ Cuộn Dây', 'Coil Temp')}</div>
                    <div className="font-bold text-amber-400 text-sm mt-0.5">43.8 °C</div>
                    <div className="text-[9px] text-gray-500 font-sans">{t('Ngưỡng < 65°C', 'Threshold < 65°C')}</div>
                  </div>
                  <div className="p-2.5 bg-[#0D1520] border border-[#222B35] text-center rounded-none">
                    <div className="text-[10px] text-gray-400 font-sans">{t('Dòng Tải 3 Pha', '3-Phase Current')}</div>
                    <div className="font-bold text-white text-sm mt-0.5">18.2 A</div>
                    <div className="text-[9px] text-gray-500 font-sans">{t('Định mức 25A', 'Rated 25A')}</div>
                  </div>
                  <div className="p-2.5 bg-[#0D1520] border border-[#222B35] text-center rounded-none">
                    <div className="text-[10px] text-gray-400 font-sans">{t('Điểm Sức Khỏe AI', 'AI Health Score')}</div>
                    <div className="font-bold text-[#C5A880] text-sm mt-0.5">{selectedDeviceForHistory.health_score.toFixed(1)}/100</div>
                    <div className="text-[9px] text-emerald-400 font-sans">{t('Vận hành tốt', 'Normal')}</div>
                  </div>
                </div>
              </div>

              {/* Lịch sử bảo trì quá khứ */}
              <div className="space-y-2">
                <div className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>{t('Nhật Ký Các Đợt Bảo Trì Gần Nhất', 'Recent Maintenance Logs')}</span>
                </div>
                <div className="space-y-1.5">
                  <div className="p-2.5 bg-[#161B22] border border-[#222B35] flex items-center justify-between rounded-none">
                    <div>
                      <div className="font-semibold text-white">{selectedDeviceForHistory.last_maintenance} • {t('Bảo dưỡng định kỳ Q3/2026', 'Routine Maintenance Q3/2026')}</div>
                      <div className="text-[11px] text-gray-400">{t('Siết ốc bu lông chân đế, bổ sung mỡ bôi trơn bạc đạn, kiểm tra dây curoa.', 'Tightened base bolts, relubricated bearings, inspected drive belt.')}</div>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-500 text-emerald-400 text-[10px] font-bold rounded-none">
                      {t('HOÀN TẤT', 'COMPLETED')}
                    </span>
                  </div>
                  <div className="p-2.5 bg-[#161B22] border border-[#222B35] flex items-center justify-between rounded-none">
                    <div>
                      <div className="font-semibold text-white">2026-05-18 • {t('Kiểm tra an toàn điện & PCCC định kỳ Q2/2026', 'Electrical & Fire Safety Check Q2/2026')}</div>
                      <div className="text-[11px] text-gray-400">{t('Đo điện trở tiếp địa rò & thử tải chuyển mạch tự động ATS.', 'Measured ground resistance and tested ATS automatic transfer switch load.')}</div>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-500 text-emerald-400 text-[10px] font-bold rounded-none">
                      {t('HOÀN TẤT', 'COMPLETED')}
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
                className="px-4 py-2 bg-[#1C2533] border border-[#2D3748] hover:border-[#C5A880] text-gray-200 text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 rounded-none"
              >
                {isExportingPdf ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5 text-[#C5A880]" />}
                <span>{isExportingPdf ? t('Đang Xuất PDF...', 'Exporting PDF...') : t('Xuất Hồ Sơ Kỹ Thuật PDF', 'Export Technical Dossier PDF')}</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedDeviceForHistory(null)}
                className="px-5 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-colors shadow rounded-none"
              >
                {t('Đóng', 'Close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 2: TẠO PHIẾU BẢO TRÌ DỰ PHÒNG THEO AI DỰ BÁO           */}
      {/* ------------------------------------------------------------- */}
      {selectedDeviceForMaintenance && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#121820] border border-[#C5A880] max-w-xl w-full p-5 sm:p-6 space-y-4 shadow-2xl animate-fadeIn text-white rounded-none max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#222B35] pb-3">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-[#C5A880]" />
                <h3 className="font-serif text-lg font-bold text-white">
                  {t('Lập Phiếu Bảo Trì Dự Phòng', 'Issue Preventive Maintenance Ticket')}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedDeviceForMaintenance(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-[#161B22] border border-[#2D3748] text-xs space-y-1 rounded-none">
              <div>{t('Thiết bị chỉ định:', 'Target Equipment:')} <strong className="text-white text-sm">{selectedDeviceForMaintenance.name}</strong></div>
              <div>{t('Vị trí:', 'Location:')} <span className="text-gray-300">{selectedDeviceForMaintenance.location}</span></div>
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <span className="text-gray-400">{t('Điểm sức khỏe:', 'Health Score:')}</span>
                <strong className="text-emerald-400 font-mono">{selectedDeviceForMaintenance.health_score.toFixed(1)}/100</strong>
                <span className="text-gray-400 ml-2">{t('AI đề xuất:', 'AI Recommendation:')}</span>
                <strong className="text-[#C5A880] font-mono">{selectedDeviceForMaintenance.predict_date}</strong>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-400 mb-1">{t('Kỹ thuật viên phụ trách:', 'Assigned Technician:')}</label>
                {technicians.length > 0 ? (
                  <select
                    value={selectedTechId}
                    onChange={(e) => {
                      setSelectedTechId(e.target.value);
                      const f = technicians.find(t => t.id === e.target.value);
                      if (f) setTechName(`${f.name} (${f.specialty})`);
                    }}
                    className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white focus:outline-none focus:border-[#C5A880] rounded-none"
                  >
                    {technicians.map((tItem) => (
                      <option key={tItem.id} value={tItem.id}>
                        {tItem.name} • {tItem.specialty} ({tItem.phone})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={techName}
                    onChange={(e) => setTechName(e.target.value)}
                    className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white focus:outline-none focus:border-[#C5A880] rounded-none"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1">{t('Mức độ ưu tiên:', 'Priority Level:')}</label>
                  <select
                    value={priority}
                    onChange={(e: any) => setPriority(e.target.value)}
                    className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white focus:outline-none focus:border-[#C5A880] rounded-none"
                  >
                    <option value="Bình thường">{t('Bình thường (Định kỳ)', 'Normal (Routine)')}</option>
                    <option value="Cao">{t('Cao (Khuyến nghị AI)', 'High (AI Suggested)')}</option>
                    <option value="Cấp bách">{t('Cấp bách (Cảnh báo rung/nhiệt)', 'Urgent (Temp/Vibration Alert)')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 mb-1">{t('Ngày dự kiến thực hiện:', 'Scheduled Date:')}</label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white focus:outline-none focus:border-[#C5A880] rounded-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 mb-1">{t('Nội dung chỉ đạo & Checklist kỹ thuật:', 'Technical Scope & Checklist:')}</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white focus:outline-none focus:border-[#C5A880] rounded-none resize-none leading-relaxed"
                />
              </div>

              {/* Sync to Kanban Checkbox */}
              <label className="flex items-center gap-2 cursor-pointer pt-1 text-xs text-[#C5A880] hover:text-white select-none">
                <input
                  type="checkbox"
                  checked={syncToKanban}
                  onChange={(e) => setSyncToKanban(e.target.checked)}
                  className="rounded-none bg-[#0E131B] border-gray-600 text-[#C5A880] focus:ring-0 w-3.5 h-3.5"
                />
                <span>{t('Đồng bộ tạo lệnh vào Trung Tâm Điều Phối Kỹ Thuật (Kanban BQL)', 'Sync ticket to Management Technical Kanban')}</span>
              </label>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-[#222B35] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleExportPdf(selectedDeviceForMaintenance)}
                disabled={isExportingPdf}
                className="px-3.5 py-2 bg-[#1C2533] border border-[#2D3748] hover:border-[#C5A880] text-gray-200 text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 rounded-none"
              >
                {isExportingPdf ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5 text-[#C5A880]" />}
                <span>{isExportingPdf ? t('Đang Xuất...', 'Exporting...') : t('Tải File PDF', 'Download PDF')}</span>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDeviceForMaintenance(null)}
                  className="px-3 py-2 border border-gray-700 text-xs text-gray-400 hover:text-white rounded-none"
                >
                  {t('Hủy', 'Cancel')}
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveMaintenanceTicket(selectedDeviceForMaintenance)}
                  className="px-5 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-colors shadow flex items-center gap-1.5 rounded-none"
                >
                  <Check className="w-4 h-4" /> {t('Xác Nhận Lưu Phiếu', 'Confirm & Save Ticket')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 3: THÊM MỚI THIẾT BỊ                                   */}
      {/* ------------------------------------------------------------- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <form 
            onSubmit={handleSaveAddDevice} 
            className="bg-[#121820] border border-[#C5A880] max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl animate-fadeIn text-white rounded-none max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-[#222B35] pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#C5A880]" />
                <h3 className="font-serif text-lg font-bold text-white">
                  {t('Thêm Thiết Bị Hạ Tầng BMS Mới', 'Add New BMS Infrastructure Equipment')}
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-400 mb-1 font-semibold">{t('Tên thiết bị / Hệ thống:', 'Equipment / System Name:')}</label>
                <input
                  type="text"
                  placeholder={t('VD: Cụm Máy Bơm Nước Thải Wilo Hầm B2', 'e.g. Wilo Sewage Pump Submersible Station B2')}
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white focus:outline-none focus:border-[#C5A880] rounded-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">{t('Phân loại:', 'Category:')}</label>
                  <select
                    value={formCategory}
                    onChange={(e: any) => setFormCategory(e.target.value)}
                    className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white focus:outline-none focus:border-[#C5A880] rounded-none"
                  >
                    <option value="Thang máy">{t('Thang máy', 'Elevator')}</option>
                    <option value="Máy bơm">{t('Máy bơm', 'Water Pump')}</option>
                    <option value="Hệ thống PCCC">{t('Hệ thống PCCC', 'Fire Safety')}</option>
                    <option value="Trạm biến áp">{t('Trạm biến áp', 'Transformer & Gen')}</option>
                    <option value="Barrier">{t('Barrier & An ninh', 'Barrier & Security')}</option>
                    <option value="Thông gió & Hút khói">{t('Thông gió & Hút khói', 'Ventilation & Smoke')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">{t('Trạng thái ban đầu:', 'Initial Status:')}</label>
                  <select
                    value={formStatus}
                    onChange={(e: any) => setFormStatus(e.target.value)}
                    className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white focus:outline-none focus:border-[#C5A880] rounded-none"
                  >
                    <option value="Hoạt động tốt">{t('Hoạt động tốt', 'Normal Operation')}</option>
                    <option value="Cần kiểm tra">{t('Cần kiểm tra', 'Inspection Needed')}</option>
                    <option value="Cảnh báo hỏng">{t('Cảnh báo hỏng', 'Warning / Fault')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 mb-1 font-semibold">{t('Vị trí lắp đặt:', 'Installation Location:')}</label>
                <input
                  type="text"
                  placeholder={t('VD: Tòa BS-08 (Tầng B2 -> Tầng 30)', 'e.g. Tower BS-08 (Basement B2 to Floor 30)')}
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white focus:outline-none focus:border-[#C5A880] rounded-none"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">{t('Điểm sức khỏe (0-100):', 'Health Score (0-100):')}</label>
                  <input
                    type="number"
                    min={10}
                    max={100}
                    value={formHealthScore}
                    onChange={(e) => setFormHealthScore(Number(e.target.value))}
                    className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white focus:outline-none focus:border-[#C5A880] rounded-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">{t('Bảo trì gần nhất:', 'Last Maintenance:')}</label>
                  <input
                    type="date"
                    value={formLastMaintenance}
                    onChange={(e) => setFormLastMaintenance(e.target.value)}
                    className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white focus:outline-none focus:border-[#C5A880] rounded-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">{t('Dự báo bảo dưỡng:', 'Forecasted Maint:')}</label>
                  <input
                    type="date"
                    value={formPredictDate}
                    onChange={(e) => setFormPredictDate(e.target.value)}
                    className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white focus:outline-none focus:border-[#C5A880] rounded-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#222B35] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 border border-gray-700 text-xs text-gray-300 hover:text-white rounded-none"
              >
                {t('Hủy', 'Cancel')}
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-colors rounded-none shadow"
              >
                {t('Lưu Thiết Bị', 'Save Equipment')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 4: CHỈNH SỬA THÔNG SỐ THIẾT BỊ                          */}
      {/* ------------------------------------------------------------- */}
      {editingDevice && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <form 
            onSubmit={handleSaveEditDevice} 
            className="bg-[#121820] border border-[#C5A880] max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl animate-fadeIn text-white rounded-none max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-[#222B35] pb-3">
              <div className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-[#C5A880]" />
                <h3 className="font-serif text-lg font-bold text-white">
                  {t('Chỉnh Sửa Thiết Bị', 'Edit Equipment')} #{editingDevice.id.toUpperCase()}
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setEditingDevice(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-400 mb-1 font-semibold">{t('Tên thiết bị:', 'Equipment Name:')}</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white focus:outline-none focus:border-[#C5A880] rounded-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">{t('Phân loại:', 'Category:')}</label>
                  <select
                    value={formCategory}
                    onChange={(e: any) => setFormCategory(e.target.value)}
                    className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white focus:outline-none focus:border-[#C5A880] rounded-none"
                  >
                    <option value="Thang máy">{t('Thang máy', 'Elevator')}</option>
                    <option value="Máy bơm">{t('Máy bơm', 'Water Pump')}</option>
                    <option value="Hệ thống PCCC">{t('Hệ thống PCCC', 'Fire Safety')}</option>
                    <option value="Trạm biến áp">{t('Trạm biến áp', 'Transformer & Gen')}</option>
                    <option value="Barrier">{t('Barrier & An ninh', 'Barrier & Security')}</option>
                    <option value="Thông gió & Hút khói">{t('Thông gió & Hút khói', 'Ventilation & Smoke')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">{t('Trạng thái:', 'Status:')}</label>
                  <select
                    value={formStatus}
                    onChange={(e: any) => setFormStatus(e.target.value)}
                    className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white focus:outline-none focus:border-[#C5A880] rounded-none"
                  >
                    <option value="Hoạt động tốt">{t('Hoạt động tốt', 'Normal Operation')}</option>
                    <option value="Cần kiểm tra">{t('Cần kiểm tra', 'Inspection Needed')}</option>
                    <option value="Cảnh báo hỏng">{t('Cảnh báo hỏng', 'Warning / Fault')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 mb-1 font-semibold">{t('Vị trí lắp đặt:', 'Installation Location:')}</label>
                <input
                  type="text"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white focus:outline-none focus:border-[#C5A880] rounded-none"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">{t('Điểm sức khỏe:', 'Health Score:')}</label>
                  <input
                    type="number"
                    min={10}
                    max={100}
                    value={formHealthScore}
                    onChange={(e) => setFormHealthScore(Number(e.target.value))}
                    className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white focus:outline-none focus:border-[#C5A880] rounded-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">{t('Bảo trì gần nhất:', 'Last Maintenance:')}</label>
                  <input
                    type="date"
                    value={formLastMaintenance}
                    onChange={(e) => setFormLastMaintenance(e.target.value)}
                    className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white focus:outline-none focus:border-[#C5A880] rounded-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">{t('Dự báo bảo dưỡng:', 'Forecasted Maint:')}</label>
                  <input
                    type="date"
                    value={formPredictDate}
                    onChange={(e) => setFormPredictDate(e.target.value)}
                    className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white focus:outline-none focus:border-[#C5A880] rounded-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#222B35] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingDevice(null)}
                className="px-4 py-2 border border-gray-700 text-xs text-gray-300 hover:text-white rounded-none"
              >
                {t('Hủy', 'Cancel')}
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-colors rounded-none shadow"
              >
                {t('Cập Nhật', 'Update')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
