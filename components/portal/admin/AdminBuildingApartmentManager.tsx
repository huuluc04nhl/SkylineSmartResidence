'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building, 
  Layers, 
  Users, 
  UserCheck, 
  Home, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Search, 
  Filter, 
  Eye, 
  Key, 
  ShieldCheck, 
  Sparkles, 
  Car, 
  Receipt, 
  Phone, 
  Mail, 
  CreditCard, 
  Box, 
  Info,
  Calendar,
  MapPin,
  ChevronRight,
  Plus,
  Edit,
  UserPlus,
  Table as TableIcon,
  LayoutGrid,
  Check,
  RefreshCw,
  Trash2,
  DollarSign,
  Compass,
  X,
  Download,
  RotateCcw,
  Wrench,
  ArrowRightLeft
} from 'lucide-react';
import { getUserStore, getApartmentMembers, ApartmentMember } from '@/lib/userStore';
import { 
  ApartmentUnit, 
  ApartmentType, 
  ApartmentStatus, 
  ApartmentResidentOwner,
  getApartmentUnits, 
  getApartmentByCode,
  saveApartmentsList, 
  updateApartmentUnit,
  deleteApartmentUnit,
  assignApartmentResident,
  evictApartmentResident,
  updateApartmentBillingStatus,
  resetApartmentsToDefault
} from '@/lib/apartmentStore';
import AddApartmentModal from './AddApartmentModal';
import EditApartmentModal from './EditApartmentModal';
import AssignResidentModal from './AssignResidentModal';

export type TowerFilter = 'ALL' | 'TOWER_A' | 'TOWER_B';
export type OccupancyFilter = 'ALL' | 'OCCUPIED' | 'VACANT' | 'MAINTENANCE';
export type ApartmentTypeFilter = 'ALL' | '1PN' | '2PN' | '3PN' | 'DUPLEX_PENTHOUSE';
export type ViewMode = '3D' | 'FLOOR_GRID' | 'TABLE';

export default function AdminBuildingApartmentManager() {
  const [units, setUnits] = useState<ApartmentUnit[]>(() => getApartmentUnits());
  const [selectedTower, setSelectedTower] = useState<TowerFilter>('ALL');
  const [selectedOccupancy, setSelectedOccupancy] = useState<OccupancyFilter>('ALL');
  const [selectedType, setSelectedType] = useState<ApartmentTypeFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // MẶC ĐỊNH LÀ 3D MÔ HÌNH TRỰC QUAN KẾT HỢP HỒ SƠ BÊN PHẢI THEO ĐÚNG YÊU CẦU NGƯỜI DÙNG
  const [viewMode, setViewMode] = useState<ViewMode>('3D');
  
  // Mã căn hộ đang chọn hiển thị hồ sơ bên phải (Mặc định 12A05)
  const [activeAptCode, setActiveAptCode] = useState<string>('12A05');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // Modal phụ: Thêm thành viên vào căn hộ
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [memberForm, setMemberForm] = useState({
    fullName: '',
    relationship: 'Thành viên gia đình',
    phone: '',
    idCard: '',
    licensePlate: ''
  });

  // Modal phụ: Đổi trạng thái nhanh
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<ApartmentStatus>('OCCUPIED');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const refreshUnits = () => {
    const fresh = getApartmentUnits();
    setUnits([...fresh]);
  };

  // Đồng bộ thời gian thực từ local events
  useEffect(() => {
    const handleStorageUpdate = () => {
      refreshUnits();
    };

    window.addEventListener('skyline_apartments_updated', handleStorageUpdate);
    return () => {
      window.removeEventListener('skyline_apartments_updated', handleStorageUpdate);
    };
  }, []);

  // Lấy dữ liệu API thực tế cho căn 12A05 của Nguyễn Hữu Lực
  useEffect(() => {
    let isMounted = true;
    async function syncApiForUnit12A05() {
      try {
        const famRes = await fetch('/api/nks/user/family?aptCode=12A05');
        let realMembers: ApartmentMember[] = [];
        if (famRes.ok) {
          const famData = await famRes.json();
          if (famData.success && Array.isArray(famData.members) && famData.members.length > 0) {
            realMembers = famData.members;
          }
        }

        const userRes = await fetch('/api/nks/user');
        let realOwner: any = null;
        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData.user && userData.user.role === 'OWNER' && !userData.user.role?.includes('ADMIN')) {
            realOwner = userData.user;
          }
        }

        if (isMounted && (realMembers.length > 0 || realOwner)) {
          setUnits(prev => {
            const copy = [...prev];
            const idx = copy.findIndex(u => u.code === '12A05');
            if (idx !== -1) {
              const current = copy[idx];
              if (realOwner && current.owner) {
                current.owner.name = realOwner.fullname || realOwner.full_name || current.owner.name;
                current.owner.phone = realOwner.phone || current.owner.phone;
                current.owner.email = realOwner.email || current.owner.email;
                if (realOwner.avatar_url || realOwner.avatar) {
                  current.owner.avatar = (realOwner.avatar_url || realOwner.avatar).replace('data.nks.vn//', 'data.nks.vn/');
                }
              }
              if (realMembers.length > 0) {
                current.members = realMembers;
                current.membersCount = realMembers.length;
              }
            }
            return copy;
          });
        }
      } catch (e) {
        console.warn('API sync warning for 12A05:', e);
      }
    }

    syncApiForUnit12A05();
    return () => { isMounted = false; };
  }, []);

  // Bộ lọc danh sách căn hộ
  const filteredUnits = useMemo(() => {
    return units.filter(unit => {
      const matchTower = selectedTower === 'ALL' 
        ? true 
        : selectedTower === 'TOWER_A' 
        ? unit.tower === 'A' 
        : unit.tower === 'B';

      const matchOccupancy = selectedOccupancy === 'ALL'
        ? true
        : unit.status === selectedOccupancy;

      const matchType = selectedType === 'ALL'
        ? true
        : unit.type === selectedType;

      const query = searchQuery.toLowerCase().trim();
      const matchSearch = query === ''
        ? true
        : unit.code.toLowerCase().includes(query) ||
          (unit.owner?.name && unit.owner.name.toLowerCase().includes(query)) ||
          (unit.owner?.phone && unit.owner.phone.includes(query)) ||
          (unit.owner?.cccd && unit.owner.cccd.includes(query)) ||
          unit.typeLabel.toLowerCase().includes(query);

      return matchTower && matchOccupancy && matchType && matchSearch;
    });
  }, [units, selectedTower, selectedOccupancy, selectedType, searchQuery]);

  // Căn hộ hiện đang xem chi tiết ở cột phải Dossier
  const activeUnit = useMemo(() => {
    return units.find(u => u.code === activeAptCode) || units[0] || null;
  }, [units, activeAptCode]);

  // Thống kê KPI
  const totalUnits = units.length;
  const occupiedUnits = units.filter(u => u.status === 'OCCUPIED').length;
  const vacantUnits = units.filter(u => u.status === 'VACANT').length;
  const maintenanceUnits = units.filter(u => u.status === 'MAINTENANCE').length;
  const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

  // Xử lý đổi trạng thái thanh toán hóa đơn
  const handleToggleBilling = () => {
    if (!activeUnit || !activeUnit.billing) return;
    const nextStatus = activeUnit.billing.status === 'PAID' ? 'UNPAID' : 'PAID';
    updateApartmentBillingStatus(activeUnit.code, nextStatus);
    showToast(nextStatus === 'PAID' ? `✓ Đã xác nhận thu phí quản lý căn hộ ${activeUnit.code}` : `✓ Đã đánh dấu căn hộ ${activeUnit.code} chưa đóng phí.`);
    refreshUnits();
  };

  // Xử lý thu hồi căn hộ về trống
  const handleEvictResident = () => {
    if (!activeUnit) return;
    if (confirm(`Xác nhận thu hồi căn hộ ${activeUnit.code} về trạng thái trống? Toàn bộ danh sách cư dân sẽ được lưu trữ vào lịch sử.`)) {
      evictApartmentResident(activeUnit.code);
      showToast(`✓ Đã thu hồi căn hộ ${activeUnit.code} về trạng thái Căn Trống.`);
      refreshUnits();
    }
  };

  // Xóa căn hộ khỏi hệ thống
  const handleDeleteApartment = () => {
    if (!activeUnit) return;
    if (confirm(`Bạn có chắc chắn muốn xóa căn hộ ${activeUnit.code} khỏi cơ sở dữ liệu tòa nhà không?`)) {
      deleteApartmentUnit(activeUnit.code);
      showToast(`✓ Đã xóa căn hộ ${activeUnit.code}.`);
      refreshUnits();
    }
  };

  // Lưu thành viên mới vào căn hộ
  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUnit) return;
    if (!memberForm.fullName.trim() || !memberForm.phone.trim()) {
      alert('Vui lòng nhập họ tên và số điện thoại người thân.');
      return;
    }

    const newMem: ApartmentMember = {
      id: `mem-${Date.now()}`,
      fullName: memberForm.fullName.trim(),
      role: 'Family',
      relationship: memberForm.relationship,
      phone: memberForm.phone.trim(),
      idCard: memberForm.idCard.trim(),
      licensePlate: memberForm.licensePlate.trim(),
      faceStatus: 'Đã xác thực',
      avatarUrl: 'https://data.nks.vn/storage/users/default.png',
      addedDate: new Date().toLocaleDateString('vi-VN')
    };

    const currentMembers = activeUnit.members || [];
    const updatedMembers = [...currentMembers, newMem];

    updateApartmentUnit(activeUnit.code, {
      members: updatedMembers,
      membersCount: updatedMembers.length
    });

    setIsAddMemberModalOpen(false);
    setMemberForm({ fullName: '', relationship: 'Thành viên gia đình', phone: '', idCard: '', licensePlate: '' });
    showToast(`✓ Đã thêm thành viên ${newMem.fullName} vào căn hộ ${activeUnit.code}.`);
    refreshUnits();
  };

  // Xóa thành viên
  const handleRemoveMember = (memId: string) => {
    if (!activeUnit) return;
    const currentMembers = activeUnit.members || [];
    const updatedMembers = currentMembers.filter(m => m.id !== memId);
    updateApartmentUnit(activeUnit.code, {
      members: updatedMembers,
      membersCount: updatedMembers.length
    });
    showToast(`✓ Đã xóa người thân khỏi căn hộ ${activeUnit.code}.`);
    refreshUnits();
  };

  // Đổi trạng thái căn hộ nhanh
  const handleSaveStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUnit) return;

    let label = 'Đang Sinh Sống';
    if (newStatus === 'VACANT') label = 'Căn Hộ Trống';
    if (newStatus === 'MAINTENANCE') label = 'Đang Sửa Chữa / Bảo Trì';
    if (newStatus === 'HANDOVER_PENDING') label = 'Chờ Bàn Giao';

    updateApartmentUnit(activeUnit.code, {
      status: newStatus,
      statusLabel: label
    });

    setIsStatusModalOpen(false);
    showToast(`✓ Đã đổi trạng thái căn hộ ${activeUnit.code} sang ${label}.`);
    refreshUnits();
  };

  // Xuất file CSV danh sách căn hộ
  const handleExportCSV = () => {
    const headers = ['Mã Căn', 'Tòa', 'Tầng', 'Loại Căn', 'Diện Tích Thông Thủy (m2)', 'Trạng Thái', 'Chủ Hộ', 'SĐT Chủ Hộ', 'CCCD', 'Nhân Khẩu', 'Định Giá (Tỷ)', 'Phí Quản Lý'];
    const rows = filteredUnits.map(u => [
      u.code,
      u.towerName,
      u.floor,
      `"${u.typeLabel}"`,
      u.area,
      `"${u.statusLabel}"`,
      `"${u.owner?.name || 'Chưa có'}"`,
      u.owner?.phone || '',
      u.owner?.cccd || '',
      u.membersCount,
      u.priceBillion,
      u.billing?.status === 'PAID' ? 'Đã Nộp' : `Còn Nợ (${u.billing?.totalAmount?.toLocaleString('vi-VN') || 0} đ)`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `danh_sach_can_ho_skyline_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('✓ Đã xuất báo cáo danh sách căn hộ thành công.');
  };

  return (
    <div className="space-y-6 animate-fadeIn select-none">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-[#121820] border-2 border-[#C5A880] px-4 py-2.5 text-xs text-[#C5A880] font-bold shadow-2xl flex items-center gap-2 animate-slideDown">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ============================================================= */}
      {/* 1. HEADER: TIÊU ĐỀ & CÁC NÚT ĐIỀU HƯỚNG TỔNG THỂ             */}
      {/* ============================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#222B35] pb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-semibold flex items-center gap-1.5 font-mono">
            <Building className="w-3.5 h-3.5" /> Quản Trị Không Gian Căn Hộ • Ban Quản Lý
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl text-white font-bold mt-1">
            Quản Lý Căn Hộ & Mô Hình Không Gian Skyline
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Mô hình hóa toàn bộ căn hộ Tòa A & Tòa B, theo dõi thực trạng cư trú, quản lý bàn giao chìa khóa, nhân khẩu và hồ sơ kỹ thuật.
          </p>
        </div>

        {/* Nút hành động nhanh: Thêm căn hộ & Xuất dữ liệu & Chuyển góc nhìn */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] font-bold text-xs uppercase tracking-wider rounded-none transition-all flex items-center gap-1.5 shadow active:scale-95"
          >
            <Plus className="w-4 h-4" /> Thêm Căn Hộ Mới
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-2 bg-[#161B22] hover:bg-[#222B35] text-gray-200 border border-[#2D3748] text-xs font-semibold rounded-none transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-[#C5A880]" /> Xuất Báo Cáo
          </button>

          {/* Chuyển đổi 3 góc nhìn: 3D Mô Hình, Mặt Cắt Tầng, Bảng Quản Trị */}
          <div className="flex bg-[#121820] p-1 border border-[#222B35] rounded-none text-xs">
            <button
              type="button"
              onClick={() => setViewMode('3D')}
              className={`px-3 py-1.5 rounded-none font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === '3D'
                  ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Box className="w-3.5 h-3.5" /> Mô Hình 3D
            </button>
            <button
              type="button"
              onClick={() => setViewMode('FLOOR_GRID')}
              className={`px-3 py-1.5 rounded-none font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'FLOOR_GRID'
                  ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Mặt Cắt Tầng
            </button>
            <button
              type="button"
              onClick={() => setViewMode('TABLE')}
              className={`px-3 py-1.5 rounded-none font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'TABLE'
                  ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" /> Bảng Dữ Liệu
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================= */}
      {/* 2. THANH THỐNG KÊ KPI LẤP ĐẦY                                 */}
      {/* ============================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-[#121820] border border-[#222B35] rounded-none">
          <div className="text-[10px] uppercase tracking-wider text-gray-400 font-mono flex items-center justify-between">
            <span>Tổng Căn Giám Sát</span>
            <Building className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            {totalUnits} <span className="text-xs text-gray-400 font-normal">căn</span>
          </div>
          <div className="text-[10px] text-gray-400 mt-0.5">Tòa A & Tòa B Skyline</div>
        </div>

        <div className="p-3.5 bg-[#121820] border border-emerald-500/40 rounded-none">
          <div className="text-[10px] uppercase tracking-wider text-emerald-400 font-mono flex items-center justify-between">
            <span>Đang Sinh Sống</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-300 mt-1">
            {occupiedUnits} <span className="text-xs text-emerald-400 font-normal">căn ({occupancyRate}%)</span>
          </div>
          <div className="text-[10px] text-emerald-400/80 mt-0.5">Cư dân & chủ sở hữu thực tế</div>
        </div>

        <div className="p-3.5 bg-[#121820] border border-amber-500/40 rounded-none">
          <div className="text-[10px] uppercase tracking-wider text-amber-400 font-mono flex items-center justify-between">
            <span>Căn Hộ Đang Trống</span>
            <Key className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300 mt-1">
            {vacantUnits} <span className="text-xs text-amber-400 font-normal">căn</span>
          </div>
          <div className="text-[10px] text-amber-400/80 mt-0.5">Sẵn sàng bàn giao đón cư dân</div>
        </div>

        <div className="p-3.5 bg-[#121820] border border-purple-500/40 rounded-none">
          <div className="text-[10px] uppercase tracking-wider text-purple-400 font-mono flex items-center justify-between">
            <span>Bảo Trì / Hoàn Thiện</span>
            <Wrench className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-purple-300 mt-1">
            {maintenanceUnits} <span className="text-xs text-purple-400 font-normal">căn</span>
          </div>
          <div className="text-[10px] text-purple-400/80 mt-0.5">Đang bảo dưỡng kỹ thuật</div>
        </div>
      </div>

      {/* ============================================================= */}
      {/* 3. THANH BỘ LỌC ĐA TIÊU CHÍ & Ô TÌM KIẾM                      */}
      {/* ============================================================= */}
      <div className="p-3.5 bg-[#121820] border border-[#222B35] rounded-none flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Lọc Tòa */}
          <span className="text-gray-400 font-mono text-[11px]">Tòa:</span>
          {[
            { id: 'ALL', label: 'Tất Cả' },
            { id: 'TOWER_A', label: 'Tòa A (Sapphire)' },
            { id: 'TOWER_B', label: 'Tòa B (Diamond)' }
          ].map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedTower(t.id as any)}
              className={`px-2.5 py-1 text-[11px] font-semibold transition-all border ${
                selectedTower === t.id
                  ? 'bg-[#C5A880] text-[#0D1117] border-[#C5A880] font-bold shadow'
                  : 'bg-[#161B22] text-gray-300 border-[#2D3748] hover:border-gray-500'
              }`}
            >
              {t.label}
            </button>
          ))}

          <div className="w-[1px] h-4 bg-[#2D3748] mx-1 hidden sm:block" />

          {/* Lọc Trạng thái */}
          <span className="text-gray-400 font-mono text-[11px]">Trạng Thái:</span>
          {[
            { id: 'ALL', label: 'Tất Cả' },
            { id: 'OCCUPIED', label: '🟢 Đang Ở' },
            { id: 'VACANT', label: '🟡 Căn Trống' },
            { id: 'MAINTENANCE', label: '🟣 Bảo Trì' }
          ].map(o => (
            <button
              key={o.id}
              type="button"
              onClick={() => setSelectedOccupancy(o.id as any)}
              className={`px-2.5 py-1 text-[11px] font-semibold transition-all border ${
                selectedOccupancy === o.id
                  ? 'bg-[#1C2533] text-[#C5A880] border-[#C5A880] font-bold shadow'
                  : 'bg-[#161B22] text-gray-400 border-[#2D3748] hover:text-white'
              }`}
            >
              {o.label}
            </button>
          ))}

          <div className="w-[1px] h-4 bg-[#2D3748] mx-1 hidden sm:block" />

          {/* Lọc Loại căn */}
          <span className="text-gray-400 font-mono text-[11px]">Loại Căn:</span>
          {[
            { id: 'ALL', label: 'Tất Cả' },
            { id: '1PN', label: '1PN' },
            { id: '2PN', label: '2PN' },
            { id: '3PN', label: '3PN' },
            { id: 'DUPLEX_PENTHOUSE', label: 'Penthouse' }
          ].map(tp => (
            <button
              key={tp.id}
              type="button"
              onClick={() => setSelectedType(tp.id as any)}
              className={`px-2.5 py-1 text-[11px] font-semibold transition-all border ${
                selectedType === tp.id
                  ? 'bg-[#1C2533] text-[#C5A880] border-[#C5A880] font-bold shadow'
                  : 'bg-[#161B22] text-gray-400 border-[#2D3748] hover:text-white'
              }`}
            >
              {tp.label}
            </button>
          ))}
        </div>

        {/* Ô tìm kiếm tức thời */}
        <div className="relative min-w-[240px] flex-1 sm:flex-initial">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo mã căn, tên chủ hộ, CCCD..."
            className="w-full bg-[#161B22] border border-[#2D3748] pl-8 pr-3 py-1.5 rounded-none text-white text-xs outline-none focus:border-[#C5A880]"
          />
        </div>
      </div>

      {/* ============================================================= */}
      {/* 4. GIAO DIỆN CHÍNH: BÊN TRÁI MÔ HÌNH/BẢNG - BÊN PHẢI HỒ SƠ     */}
      {/* ============================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ----------------------------------------------------------- */}
        {/* CỘT TRÁI (7 COLS): MÔ HÌNH 3D / MẶT CẮT / BẢNG DỮ LIỆU       */}
        {/* ----------------------------------------------------------- */}
        <div className="lg:col-span-7 bg-[#0D1117] border border-[#222B35] rounded-none overflow-hidden shadow-2xl flex flex-col">
          
          {/* Header thanh mô hình */}
          <div className="p-3.5 bg-[#121820] border-b border-[#222B35] flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Box className="w-4 h-4 text-[#C5A880]" />
              <span className="font-bold text-sm text-white">
                {viewMode === '3D' && 'Mô Hình Khối 3D Tổ Hợp Chung Cư Skyline'}
                {viewMode === 'FLOOR_GRID' && 'Mặt Cắt Không Gian Theo Tầng'}
                {viewMode === 'TABLE' && 'Bảng Thống Kê Chi Tiết Căn Hộ'}
              </span>
              <span className="text-[11px] font-mono text-[#C5A880]">
                ({filteredUnits.length} căn phù hợp)
              </span>
            </div>

            {/* Chú thích màu sắc */}
            <div className="flex items-center gap-3 text-[10px] font-mono">
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                <span className="text-gray-300">Đang Ở</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                <span className="text-gray-300">Đang Trống</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                <span className="text-gray-300">Bảo Trì</span>
              </div>
            </div>
          </div>

          {/* VIEW 1: MÔ HÌNH KHỐI 3D TRỰC QUAN */}
          {viewMode === '3D' && (
            <div className="relative w-full h-[520px] bg-[#05070A] overflow-hidden flex items-center justify-center">
              <div 
                className="absolute inset-0 opacity-15 pointer-events-none"
                style={{
                  backgroundImage: 'linear-gradient(to right, #1E293B 1px, transparent 1px), linear-gradient(to bottom, #1E293B 1px, transparent 1px)',
                  backgroundSize: '24px 24px'
                }}
              />

              <svg viewBox="0 0 900 560" className="w-full h-full max-h-[520px] cursor-pointer drop-shadow-[0_30px_60px_rgba(0,0,0,0.9)]">
                <defs>
                  <linearGradient id="podiumGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1E293B" />
                    <stop offset="100%" stopColor="#0F172A" />
                  </linearGradient>
                </defs>

                {/* Sân nền & Khối đế Podium */}
                <g className="opacity-90">
                  <polygon points="120,440 450,530 780,440 450,380" fill="#0A0E17" stroke="#1E293B" strokeWidth="1.5" />
                  <polygon points="180,390 450,470 720,390 720,360 450,440 180,360" fill="url(#podiumGrad)" stroke="#334155" strokeWidth="1" />
                  <text x="450" y="455" fill="#94A3B8" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                    KHỐI ĐẾ THƯƠNG MẠI & SẢNH ĐÓN PODIUM (TẦNG 1 - 3)
                  </text>
                </g>

                {/* 1. TÒA A - SAPPHIRE */}
                <g>
                  <polygon points="210,360 380,410 380,120 210,80" fill="#0F141C" stroke="#222B35" strokeWidth="1.5" />
                  <polygon points="380,410 440,390 440,105 380,120" fill="#141B24" stroke="#222B35" strokeWidth="1.5" />
                  <polygon points="210,80 380,120 440,105 270,68" fill="#1A2330" stroke="#334155" strokeWidth="1.5" />
                  <text x="310" y="70" fill="#C5A880" fontSize="12" fontWeight="bold" textAnchor="middle" fontFamily="serif">
                    TÒA A (SAPPHIRE)
                  </text>

                  {/* 25PH-01 */}
                  <polygon 
                    points="215,95 375,135 375,105 215,68" 
                    fill={activeAptCode === '25PH-01' ? '#F59E0B' : '#78350F'}
                    stroke={activeAptCode === '25PH-01' ? '#FDE68A' : '#F59E0B'}
                    strokeWidth={activeAptCode === '25PH-01' ? '3' : '1.2'}
                    onClick={() => setActiveAptCode('25PH-01')}
                    className="cursor-pointer transition-all hover:fill-amber-500"
                  />
                  <text x="295" y="105" fill="#FEF3C7" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                    25PH-01 (Duplex)
                  </text>

                  {/* 18A01 */}
                  <polygon 
                    points="215,190 375,230 375,160 215,125" 
                    fill={activeAptCode === '18A01' ? '#F59E0B' : '#78350F'}
                    stroke={activeAptCode === '18A01' ? '#FDE68A' : '#F59E0B'}
                    strokeWidth={activeAptCode === '18A01' ? '3' : '1.2'}
                    onClick={() => setActiveAptCode('18A01')}
                    className="cursor-pointer transition-all hover:fill-amber-500"
                  />
                  <text x="295" y="180" fill="#FEF3C7" fontSize="9.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                    18A01 (3PN)
                  </text>

                  {/* 12A05: ĐANG Ở (NGUYỄN HỮU LỰC) */}
                  <polygon 
                    points="215,280 375,320 375,240 215,205" 
                    fill={activeAptCode === '12A05' ? '#059669' : '#065F46'}
                    stroke={activeAptCode === '12A05' ? '#A7F3D0' : '#10B981'}
                    strokeWidth={activeAptCode === '12A05' ? '3.5' : '1.5'}
                    onClick={() => setActiveAptCode('12A05')}
                    className="cursor-pointer transition-all hover:fill-emerald-500"
                  />
                  <text x="295" y="265" fill="#FFFFFF" fontSize="10.5" fontWeight="extrabold" textAnchor="middle" fontFamily="monospace">
                    ★ 12A05 (2PN) • ĐANG Ở
                  </text>

                  {/* 05A02 */}
                  <polygon 
                    points="215,350 375,390 375,330 215,295" 
                    fill={activeAptCode === '05A02' ? '#059669' : '#065F46'}
                    stroke={activeAptCode === '05A02' ? '#A7F3D0' : '#10B981'}
                    strokeWidth={activeAptCode === '05A02' ? '3' : '1.2'}
                    onClick={() => setActiveAptCode('05A02')}
                    className="cursor-pointer transition-all hover:fill-emerald-500"
                  />
                  <text x="295" y="345" fill="#FFFFFF" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                    05A02 (1PN) • ĐANG Ở
                  </text>
                </g>

                {/* 2. TÒA B - DIAMOND */}
                <g>
                  <polygon points="520,410 690,360 690,80 520,120" fill="#0F141C" stroke="#222B35" strokeWidth="1.5" />
                  <polygon points="460,390 520,410 520,120 460,105" fill="#141B24" stroke="#222B35" strokeWidth="1.5" />
                  <polygon points="460,105 520,120 690,80 630,68" fill="#1A2330" stroke="#334155" strokeWidth="1.5" />
                  <text x="590" y="70" fill="#C5A880" fontSize="12" fontWeight="bold" textAnchor="middle" fontFamily="serif">
                    TÒA B (DIAMOND)
                  </text>

                  {/* 25PH-02 */}
                  <polygon 
                    points="525,135 685,95 685,68 525,105" 
                    fill={activeAptCode === '25PH-02' ? '#F59E0B' : '#78350F'}
                    stroke={activeAptCode === '25PH-02' ? '#FDE68A' : '#F59E0B'}
                    strokeWidth={activeAptCode === '25PH-02' ? '3' : '1.2'}
                    onClick={() => setActiveAptCode('25PH-02')}
                    className="cursor-pointer transition-all hover:fill-amber-500"
                  />
                  <text x="605" y="105" fill="#FEF3C7" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                    25PH-02 (Duplex)
                  </text>

                  {/* 19B03 */}
                  <polygon 
                    points="525,210 685,170 685,130 525,165" 
                    fill={activeAptCode === '19B03' ? '#059669' : '#065F46'}
                    stroke={activeAptCode === '19B03' ? '#A7F3D0' : '#10B981'}
                    strokeWidth={activeAptCode === '19B03' ? '3' : '1.2'}
                    onClick={() => setActiveAptCode('19B03')}
                    className="cursor-pointer transition-all hover:fill-emerald-500"
                  />
                  <text x="605" y="170" fill="#FFFFFF" fontSize="9.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                    19B03 (3PN) • ĐANG Ở
                  </text>

                  {/* 11B06 */}
                  <polygon 
                    points="525,290 685,250 685,215 525,250" 
                    fill={activeAptCode === '11B06' ? '#059669' : '#065F46'}
                    stroke={activeAptCode === '11B06' ? '#A7F3D0' : '#10B981'}
                    strokeWidth={activeAptCode === '11B06' ? '3' : '1.2'}
                    onClick={() => setActiveAptCode('11B06')}
                    className="cursor-pointer transition-all hover:fill-emerald-500"
                  />
                  <text x="605" y="250" fill="#FFFFFF" fontSize="9.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                    11B06 (2PN) • ĐANG Ở
                  </text>

                  {/* 08B12 */}
                  <polygon 
                    points="525,350 685,310 685,280 525,315" 
                    fill={activeAptCode === '08B12' ? '#F59E0B' : '#78350F'}
                    stroke={activeAptCode === '08B12' ? '#FDE68A' : '#F59E0B'}
                    strokeWidth={activeAptCode === '08B12' ? '3' : '1.2'}
                    onClick={() => setActiveAptCode('08B12')}
                    className="cursor-pointer transition-all hover:fill-amber-500"
                  />
                  <text x="605" y="315" fill="#FEF3C7" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                    08B12 (1PN) • TRỐNG
                  </text>
                </g>
              </svg>

              <div className="absolute bottom-3 left-3 bg-[#0D1117]/90 border border-[#222B35] px-3 py-1.5 text-[10.5px] text-[#C5A880] font-mono backdrop-blur-md flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Nhấp vào từng khối căn hộ trên mô hình để mở hồ sơ bên phải ngay lập tức</span>
              </div>
            </div>
          )}

          {/* VIEW 2: MẶT CẮT PHÂN TẦNG */}
          {viewMode === 'FLOOR_GRID' && (
            <div className="p-4 bg-[#05070A] h-[520px] overflow-y-auto space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {filteredUnits.map(unit => {
                  const isSelected = unit.code === activeAptCode;
                  return (
                    <div
                      key={unit.code}
                      onClick={() => setActiveAptCode(unit.code)}
                      className={`p-3 rounded-none border transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                        isSelected
                          ? 'bg-[#1C2533] border-[#C5A880] ring-1 ring-[#C5A880] shadow-xl'
                          : 'bg-[#121820] border-[#222B35] hover:border-gray-500'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-serif text-base font-bold text-white flex items-center gap-2">
                            <span>Căn {unit.code}</span>
                            <span className="text-[10px] px-1.5 py-0.2 bg-[#161B22] border border-gray-700 text-[#C5A880] font-sans font-semibold">
                              {unit.typeLabel}
                            </span>
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {unit.towerName} • Tầng {unit.floor} • {unit.area} m²
                          </div>
                        </div>

                        <span className={`px-2 py-0.5 text-[9.5px] font-bold uppercase rounded-none border font-mono ${
                          unit.status === 'OCCUPIED'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                            : unit.status === 'MAINTENANCE'
                            ? 'bg-purple-950 text-purple-300 border-purple-500'
                            : 'bg-amber-950 text-amber-300 border-amber-500'
                        }`}>
                          {unit.statusLabel}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-[#222B35] flex items-center justify-between text-xs">
                        <div className="text-gray-300 truncate max-w-[170px]">
                          {unit.owner ? (
                            <span className="flex items-center gap-1">
                              <UserCheck className="w-3 h-3 text-emerald-400" />
                              <strong className="text-white">{unit.owner.name}</strong>
                            </span>
                          ) : (
                            <span className="text-gray-500 italic">Chưa có cư dân</span>
                          )}
                        </div>
                        <div className="font-mono text-[#C5A880] font-bold">
                          {unit.priceBillion} tỷ VNĐ
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW 3: BẢNG DỮ LIỆU */}
          {viewMode === 'TABLE' && (
            <div className="bg-[#05070A] h-[520px] overflow-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#121820] text-gray-400 font-mono text-[10.5px] uppercase border-b border-[#222B35] sticky top-0 z-10">
                  <tr>
                    <th className="p-2.5">Mã Căn</th>
                    <th className="p-2.5">Tòa / Tầng</th>
                    <th className="p-2.5">Phân Loại</th>
                    <th className="p-2.5">Diện Tích</th>
                    <th className="p-2.5">Trạng Thái</th>
                    <th className="p-2.5">Chủ Hộ</th>
                    <th className="p-2.5">Định Giá</th>
                    <th className="p-2.5 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222B35]">
                  {filteredUnits.map(unit => {
                    const isSelected = unit.code === activeAptCode;
                    return (
                      <tr 
                        key={unit.code}
                        onClick={() => setActiveAptCode(unit.code)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-[#1C2533]' : 'hover:bg-[#121820]'
                        }`}
                      >
                        <td className="p-2.5 font-bold text-white font-mono">{unit.code}</td>
                        <td className="p-2.5 text-gray-300">Tòa {unit.tower} - Tầng {unit.floor}</td>
                        <td className="p-2.5 text-gray-300">{unit.typeLabel}</td>
                        <td className="p-2.5 text-gray-300">{unit.area} m²</td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-none border font-mono ${
                            unit.status === 'OCCUPIED'
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                              : unit.status === 'MAINTENANCE'
                              ? 'bg-purple-950 text-purple-300 border-purple-500'
                              : 'bg-amber-950 text-amber-300 border-amber-500'
                          }`}>
                            {unit.statusLabel}
                          </span>
                        </td>
                        <td className="p-2.5 font-semibold text-white">
                          {unit.owner?.name || <span className="text-gray-500 italic">Trống</span>}
                        </td>
                        <td className="p-2.5 font-mono text-[#C5A880] font-bold">{unit.priceBillion} tỷ</td>
                        <td className="p-2.5 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveAptCode(unit.code);
                            }}
                            className="px-2 py-1 bg-[#161B22] hover:bg-[#C5A880] hover:text-[#0D1117] text-gray-300 text-[10.5px] rounded-none border border-[#2D3748] transition-colors"
                          >
                            Xem Hồ Sơ
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

        </div>

        {/* ----------------------------------------------------------- */}
        {/* CỘT PHẢI (5 COLS): HỒ SƠ CĂN HỘ CHI TIẾT (DOSSIER PANEL)   */}
        {/* THAO TÁC TRỰC TIẾP KHÔNG CẦN POPUP RƯỜM RÀ                  */}
        {/* ----------------------------------------------------------- */}
        <div className="lg:col-span-5 bg-[#0D1117] border border-[#222B35] rounded-none p-5 space-y-4 shadow-2xl">
          {activeUnit ? (
            <>
              {/* Header hồ sơ căn hộ */}
              <div className="border-b border-[#222B35] pb-4 flex items-start justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-[#C5A880] font-mono font-semibold flex items-center gap-1.5">
                    <MapPin className="w-3 h-3" /> {activeUnit.towerName} • Tầng {activeUnit.floor} • Hướng {activeUnit.direction}
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-white mt-1">
                    Căn Hộ {activeUnit.code}
                  </h3>
                  <div className="text-xs text-gray-400 mt-0.5">
                    Loại: <strong className="text-white">{activeUnit.typeLabel}</strong> ({activeUnit.bedrooms}PN - {activeUnit.bathrooms}WC) • Thông thủy: <strong className="text-[#C5A880] font-mono">{activeUnit.area} m²</strong> (Tim: {activeUnit.wallArea} m²)
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <span className={`px-3 py-1 text-xs font-extrabold uppercase rounded-none border inline-flex items-center gap-1.5 font-mono ${
                    activeUnit.status === 'OCCUPIED'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                      : activeUnit.status === 'MAINTENANCE'
                      ? 'bg-purple-950 text-purple-300 border-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                      : 'bg-amber-950 text-amber-300 border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                  }`}>
                    {activeUnit.status === 'OCCUPIED' && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {activeUnit.status === 'VACANT' && <Key className="w-3.5 h-3.5" />}
                    {activeUnit.status === 'MAINTENANCE' && <Wrench className="w-3.5 h-3.5" />}
                    {activeUnit.statusLabel}
                  </span>
                  <div className="text-[10.5px] text-gray-400 font-mono">
                    Định giá: <strong className="text-[#C5A880]">{activeUnit.priceBillion} tỷ VNĐ</strong>
                  </div>
                </div>
              </div>

              {/* Thanh công cụ thao tác BQL trực tiếp */}
              <div className="flex items-center gap-2 flex-wrap border-b border-[#222B35] pb-3 text-xs">
                <button
                  type="button"
                  onClick={() => setIsStatusModalOpen(true)}
                  className="px-2.5 py-1.5 bg-[#161B22] hover:bg-[#202936] text-gray-300 hover:text-white border border-[#2D3748] rounded-none transition-colors flex items-center gap-1"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 text-[#C5A880]" /> Đổi Trạng Thái
                </button>

                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="px-2.5 py-1.5 bg-[#161B22] hover:bg-[#202936] text-gray-300 hover:text-white border border-[#2D3748] rounded-none transition-colors flex items-center gap-1"
                >
                  <Edit className="w-3.5 h-3.5 text-[#C5A880]" /> Sửa Căn Hộ
                </button>

                {activeUnit.status === 'OCCUPIED' ? (
                  <button
                    type="button"
                    onClick={handleEvictResident}
                    className="px-2.5 py-1.5 bg-amber-950/70 hover:bg-amber-900 border border-amber-600/70 text-amber-200 rounded-none transition-colors flex items-center gap-1"
                  >
                    <Key className="w-3.5 h-3.5 text-amber-400" /> Thu Hồi Căn
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAssignModalOpen(true)}
                    className="px-2.5 py-1.5 bg-[#C5A880] hover:bg-white text-[#0D1117] font-bold rounded-none transition-colors flex items-center gap-1 shadow"
                  >
                    <Key className="w-3.5 h-3.5" /> Bàn Giao Chìa Khóa
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleDeleteApartment}
                  className="px-2 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 rounded-none transition-colors ml-auto flex items-center gap-1"
                  title="Xóa căn hộ"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* ------------------------------------------------------- */}
              {/* TRƯỜNG HỢP 1: CĂN HỘ ĐÃ CÓ NGƯỜI Ở                      */}
              {/* ------------------------------------------------------- */}
              {activeUnit.status === 'OCCUPIED' && activeUnit.owner ? (
                <div className="space-y-4">
                  
                  {/* Thẻ Chủ Hộ */}
                  <div className="p-3.5 bg-[#121820] border border-[#222B35] rounded-none space-y-3">
                    <div className="text-[11px] uppercase tracking-wider text-emerald-400 font-bold font-mono flex items-center justify-between">
                      <span>Chủ Hộ Đang Sinh Sống</span>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 text-[9.5px] bg-emerald-950 border border-emerald-600 rounded-none text-emerald-300 font-mono">
                          Đã Xác Thực e-KYC ✓
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsAssignModalOpen(true)}
                          className="px-2 py-0.5 text-[9.5px] bg-[#161B22] hover:bg-[#222B35] border border-gray-600 rounded-none text-gray-300 transition-colors"
                        >
                          Đổi Chủ Hộ
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <img
                        src={activeUnit.owner.avatar?.replace('data.nks.vn//', 'data.nks.vn/') || 'https://data.nks.vn/storage/users/default.png'}
                        alt={activeUnit.owner.name}
                        className="w-12 h-12 rounded-none object-cover border-2 border-emerald-500/80 shadow"
                      />
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <div className="font-bold text-white text-base truncate">
                          {activeUnit.owner.name}
                        </div>
                        <div className="text-xs text-gray-300 flex items-center gap-2">
                          <Phone className="w-3 h-3 text-[#C5A880]" /> {activeUnit.owner.phone}
                        </div>
                        <div className="text-xs text-gray-400 flex items-center gap-2 truncate">
                          <Mail className="w-3 h-3 text-[#C5A880]" /> {activeUnit.owner.email}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#222B35] text-xs">
                      <div>
                        <span className="text-gray-400">Số CCCD:</span>{' '}
                        <strong className="text-white font-mono">{activeUnit.owner.cccd}</strong>
                      </div>
                      <div>
                        <span className="text-gray-400">Bàn giao ngày:</span>{' '}
                        <strong className="text-white font-mono">{activeUnit.owner.handoverDate || '15/06/2026'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Danh sách thành viên cùng căn hộ (Nhân khẩu) */}
                  <div className="p-3.5 bg-[#121820] border border-[#222B35] rounded-none space-y-2.5">
                    <div className="text-[11px] uppercase tracking-wider text-gray-300 font-bold font-mono flex items-center justify-between">
                      <span>Nhân Khẩu Thực Tế ({activeUnit.members?.length || 0} người thân)</span>
                      <button
                        type="button"
                        onClick={() => setIsAddMemberModalOpen(true)}
                        className="px-2 py-0.5 bg-[#C5A880] hover:bg-white text-[#0D1117] text-[10px] font-bold uppercase rounded-none transition-colors flex items-center gap-1"
                      >
                        <UserPlus className="w-3 h-3" /> Thêm Người Thân
                      </button>
                    </div>

                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                      {activeUnit.members && activeUnit.members.length > 0 ? (
                        activeUnit.members.map(mem => (
                          <div key={mem.id} className="p-2 bg-[#161B22] border border-[#222B35] rounded-none flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <img
                                src={mem.avatarUrl ? mem.avatarUrl.replace('data.nks.vn//', 'data.nks.vn/') : 'https://data.nks.vn/storage/users/default.png'}
                                alt={mem.fullName}
                                className="w-7 h-7 rounded-none object-cover border border-gray-700 shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="font-semibold text-white truncate">{mem.fullName}</div>
                                <div className="text-[10px] text-gray-400 truncate">{mem.relationship} • SĐT: {mem.phone}</div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className={`text-[9px] px-1.5 py-0.2 rounded-none font-mono ${
                                mem.faceStatus?.includes('Đã') ? 'bg-emerald-950 text-emerald-300' : 'bg-amber-950 text-amber-300'
                              }`}>
                                {mem.faceStatus || 'Đã xác thực'}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveMember(mem.id)}
                                className="text-gray-500 hover:text-rose-400 p-0.5"
                                title="Xóa khỏi căn hộ"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-3 text-xs text-gray-500 italic">
                          Chưa đăng ký thêm nhân khẩu cùng căn hộ
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Xe cộ & Phí dịch vụ */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-[#121820] border border-[#222B35] rounded-none space-y-1">
                      <div className="text-[10px] text-gray-400 uppercase font-mono flex items-center gap-1">
                        <Car className="w-3 h-3 text-[#C5A880]" /> Xe Đăng Ký ({activeUnit.vehicles?.length || 0})
                      </div>
                      <div className="font-mono text-white text-xs space-y-0.5">
                        {activeUnit.vehicles && activeUnit.vehicles.length > 0 ? (
                          activeUnit.vehicles.map(v => (
                            <div key={v.id} className="truncate">• {v.plate} ({v.type === 'CAR' ? 'Ô tô' : 'Xe máy'})</div>
                          ))
                        ) : (
                          <span className="text-gray-500 italic">Chưa đăng ký xe</span>
                        )}
                      </div>
                    </div>

                    <div className="p-2.5 bg-[#121820] border border-[#222B35] rounded-none space-y-1">
                      <div className="text-[10px] text-gray-400 uppercase font-mono flex items-center justify-between">
                        <span className="flex items-center gap-1"><Receipt className="w-3 h-3 text-[#C5A880]" /> Phí Quản Lý</span>
                        <button
                          type="button"
                          onClick={handleToggleBilling}
                          className="text-[9.5px] text-[#C5A880] hover:underline"
                        >
                          Đổi trạng thái
                        </button>
                      </div>
                      <div className="mt-1">
                        {activeUnit.billing?.status === 'UNPAID' ? (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-none bg-amber-950 text-amber-300 border border-amber-500/50 block text-center font-mono">
                            Còn nợ: {activeUnit.billing.totalAmount.toLocaleString('vi-VN')} đ
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-none bg-emerald-950 text-emerald-300 border border-emerald-500/50 block text-center font-mono">
                            Đã thanh toán đủ ✓
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* ------------------------------------------------------- */
                /* TRƯỜNG HỢP 2: CĂN HỘ ĐANG TRỐNG HOẶC BẢO TRÌ           */
                /* ------------------------------------------------------- */
                <div className="space-y-4">
                  <div className={`p-4 rounded-none space-y-2 border ${
                    activeUnit.status === 'VACANT' 
                      ? 'bg-[#1A1610] border-amber-500/50 text-amber-200' 
                      : 'bg-[#191024] border-purple-500/50 text-purple-200'
                  }`}>
                    <div className="flex items-center gap-2 font-bold text-sm">
                      {activeUnit.status === 'VACANT' ? <Key className="w-4 h-4 text-amber-400" /> : <Wrench className="w-4 h-4 text-purple-400" />}
                      <span>{activeUnit.statusLabel}</span>
                    </div>

                    <p className="text-xs leading-relaxed opacity-90">
                      {activeUnit.description || (
                        activeUnit.status === 'VACANT'
                          ? `Căn hộ ${activeUnit.code} hiện đang trong kho trống quản lý của BQL. Toàn bộ thiết bị điện nước, khóa thông minh và cảm biến đã được niêm phong an toàn, sẵn sàng bàn giao cho cư dân mới.`
                          : `Căn hộ ${activeUnit.code} đang trong quá trình bảo dưỡng kỹ thuật hoặc sửa chữa định kỳ trước khi tiếp nhận cư dân sinh sống.`
                      )}
                    </p>

                    <div className="pt-2 border-t border-white/10 text-xs font-mono">
                      ✓ Giá chào bán / bàn giao dự kiến: <strong className="text-white">{activeUnit.priceBillion} Tỷ VNĐ</strong>
                    </div>
                  </div>

                  {/* Thông số kỹ thuật */}
                  <div className="p-3.5 bg-[#121820] border border-[#222B35] rounded-none space-y-2 text-xs">
                    <div className="text-[10.5px] uppercase tracking-wider text-gray-400 font-mono font-bold">
                      Thông Số Bàn Giao & Hồ Sơ Kỹ Thuật
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-gray-300">
                      <div>• Tòa: <strong className="text-white">{activeUnit.towerName}</strong></div>
                      <div>• Tầng: <strong className="text-white">Tầng {activeUnit.floor}</strong></div>
                      <div>• Diện tích thông thủy: <strong className="text-white">{activeUnit.area} m²</strong></div>
                      <div>• Diện tích tim tường: <strong className="text-white">{activeUnit.wallArea} m²</strong></div>
                      <div>• Hướng ban công: <strong className="text-white">{activeUnit.direction}</strong></div>
                      <div>• Số phòng: <strong className="text-emerald-400">{activeUnit.bedrooms}PN - {activeUnit.bathrooms}WC</strong></div>
                    </div>
                  </div>

                  {/* Nút hành động BQL trực tiếp */}
                  <div className="space-y-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAssignModalOpen(true)}
                      className="w-full py-2.5 bg-[#C5A880] hover:bg-white text-[#0D1117] font-bold text-xs uppercase tracking-wider rounded-none transition-colors flex items-center justify-center gap-2 shadow"
                    >
                      <Key className="w-4 h-4" /> Bàn Giao Căn Hộ & Cấp Quyền Cư Dân
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsEditModalOpen(true)}
                      className="w-full py-2 bg-[#161B22] hover:bg-[#202936] text-gray-300 hover:text-white border border-[#2D3748] text-xs font-semibold rounded-none transition-colors flex items-center justify-center gap-2"
                    >
                      <Edit className="w-3.5 h-3.5 text-[#C5A880]" /> Cập Nhật Thông Số Kỹ Thuật Căn Hộ
                    </button>
                  </div>
                </div>
              )}

            </>
          ) : (
            <div className="text-center py-16 text-gray-500 text-xs">
              Vui lòng chọn một căn hộ trên mô hình hoặc danh sách để xem hồ sơ.
            </div>
          )}
        </div>

      </div>

      {/* ============================================================= */}
      {/* MODAL 1: THÊM CĂN HỘ MỚI (ADD APARTMENT)                     */}
      {/* ============================================================= */}
      <AddApartmentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={(newUnit) => {
          showToast(`✓ Đã thêm mới thành công căn hộ ${newUnit.code} vào tổ hợp!`);
          setActiveAptCode(newUnit.code);
          refreshUnits();
        }}
      />

      {/* ============================================================= */}
      {/* MODAL 2: CHỈNH SỬA THÔNG TIN CĂN HỘ (EDIT APARTMENT)          */}
      {/* ============================================================= */}
      <EditApartmentModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        unit={activeUnit}
        onSuccess={() => {
          showToast(`✓ Đã cập nhật thành công thông tin căn hộ ${activeUnit?.code}!`);
          refreshUnits();
        }}
      />

      {/* ============================================================= */}
      {/* MODAL 3: BÀN GIAO CĂN HỘ CHO CƯ DÂN MỚI                       */}
      {/* ============================================================= */}
      <AssignResidentModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        unit={activeUnit}
        onSuccess={() => {
          showToast(`✓ Đã bàn giao chìa khóa và kích hoạt quyền cư dân cho căn ${activeUnit?.code}!`);
          refreshUnits();
        }}
      />

      {/* ============================================================= */}
      {/* MODAL 4: THÊM THÀNH VIÊN / NGƯỜI THÂN VÀO CĂN HỘ              */}
      {/* ============================================================= */}
      {isAddMemberModalOpen && activeUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn select-none">
          <div className="relative w-full max-w-md bg-[#0D1117] border-2 border-[#C5A880] p-6 shadow-2xl text-white space-y-4 rounded-none">
            <div className="flex items-center justify-between border-b border-[#222B35] pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#C5A880]" />
                <h3 className="font-serif text-lg font-bold text-white">
                  Thêm Nhân Khẩu Căn Hộ {activeUnit.code}
                </h3>
              </div>
              <button onClick={() => setIsAddMemberModalOpen(false)} className="text-gray-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-400 mb-1 font-mono">Họ và Tên Cư Dân *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Nguyễn Văn Nam"
                  value={memberForm.fullName}
                  onChange={(e) => setMemberForm({ ...memberForm, fullName: e.target.value })}
                  className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white rounded-none focus:border-[#C5A880]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1 font-mono">Mối Quan Hệ *</label>
                  <select
                    value={memberForm.relationship}
                    onChange={(e) => setMemberForm({ ...memberForm, relationship: e.target.value })}
                    className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white rounded-none focus:border-[#C5A880]"
                  >
                    <option value="Vợ / Chồng">Vợ / Chồng</option>
                    <option value="Con cái">Con cái</option>
                    <option value="Bố / Mẹ">Bố / Mẹ</option>
                    <option value="Anh / Chị / Em">Anh / Chị / Em</option>
                    <option value="Khách thuê">Khách thuê</option>
                    <option value="Thành viên gia đình">Thành viên gia đình</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 mb-1 font-mono">Số Điện Thoại *</label>
                  <input
                    type="text"
                    required
                    placeholder="09..."
                    value={memberForm.phone}
                    onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })}
                    className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white font-mono rounded-none focus:border-[#C5A880]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1 font-mono">Số CCCD (Nếu có)</label>
                  <input
                    type="text"
                    placeholder="079..."
                    value={memberForm.idCard}
                    onChange={(e) => setMemberForm({ ...memberForm, idCard: e.target.value })}
                    className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white font-mono rounded-none focus:border-[#C5A880]"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1 font-mono">Biển Số Xe (Nếu có)</label>
                  <input
                    type="text"
                    placeholder="59P1-123.45"
                    value={memberForm.licensePlate}
                    onChange={(e) => setMemberForm({ ...memberForm, licensePlate: e.target.value })}
                    className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white font-mono rounded-none focus:border-[#C5A880]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#222B35]">
                <button
                  type="button"
                  onClick={() => setIsAddMemberModalOpen(false)}
                  className="px-4 py-2 bg-[#161B22] text-gray-300 hover:text-white border border-[#2D3748] rounded-none transition-colors"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] font-bold uppercase tracking-wider rounded-none transition-colors"
                >
                  Lưu Nhân Khẩu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 5: ĐỔI NHANH TRẠNG THÁI CĂN HỘ                          */}
      {/* ============================================================= */}
      {isStatusModalOpen && activeUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn select-none">
          <div className="relative w-full max-w-sm bg-[#0D1117] border-2 border-[#C5A880] p-5 shadow-2xl text-white space-y-4 rounded-none">
            <div className="flex items-center justify-between border-b border-[#222B35] pb-3">
              <h3 className="font-serif text-base font-bold text-white flex items-center gap-1.5">
                <ArrowRightLeft className="w-4 h-4 text-[#C5A880]" />
                <span>Đổi Trạng Thái Căn {activeUnit.code}</span>
              </h3>
              <button onClick={() => setIsStatusModalOpen(false)} className="text-gray-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStatus} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-400 mb-1 font-mono">Chọn Trạng Thái Mới</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white rounded-none focus:border-[#C5A880]"
                >
                  <option value="OCCUPIED">🟢 Đang sinh sống (Có người ở)</option>
                  <option value="VACANT">🟡 Căn hộ đang trống</option>
                  <option value="MAINTENANCE">🟣 Đang sửa chữa / Bảo trì</option>
                  <option value="HANDOVER_PENDING">🔵 Chờ bàn giao</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#222B35]">
                <button
                  type="button"
                  onClick={() => setIsStatusModalOpen(false)}
                  className="px-3 py-1.5 bg-[#161B22] text-gray-300 rounded-none border border-[#2D3748]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#C5A880] text-[#0D1117] font-bold rounded-none hover:bg-white"
                >
                  Cập Nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
