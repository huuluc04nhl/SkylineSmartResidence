'use client';

import React, { useState, useEffect } from 'react';
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
  Compass
} from 'lucide-react';
import { getUserStore, getApartmentMembers, ApartmentMember } from '@/lib/userStore';
import { 
  ApartmentUnit, 
  ApartmentType, 
  ApartmentStatus, 
  getApartmentUnits, 
  saveApartmentsList, 
  updateApartmentBillingStatus,
  evictApartmentResident
} from '@/lib/apartmentStore';
import ApartmentDetailModal from './ApartmentDetailModal';
import AddApartmentModal from './AddApartmentModal';
import EditApartmentModal from './EditApartmentModal';
import AssignResidentModal from './AssignResidentModal';

export type TowerFilter = 'ALL' | 'TOWER_A' | 'TOWER_B';
export type OccupancyFilter = 'ALL' | 'OCCUPIED' | 'VACANT' | 'MAINTENANCE';
export type ApartmentTypeFilter = 'ALL' | '1PN' | '2PN' | '3PN' | 'DUPLEX_PENTHOUSE';
export type ViewMode = 'TABLE' | 'CARDS' | '3D' | 'FLOOR_GRID';

export default function AdminBuildingApartmentManager() {
  const [units, setUnits] = useState<ApartmentUnit[]>(() => getApartmentUnits());
  const [selectedTower, setSelectedTower] = useState<TowerFilter>('ALL');
  const [selectedOccupancy, setSelectedOccupancy] = useState<OccupancyFilter>('ALL');
  const [selectedType, setSelectedType] = useState<ApartmentTypeFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('TABLE');
  
  // Modals state
  const [selectedDetailUnit, setSelectedDetailUnit] = useState<ApartmentUnit | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const [selectedEditUnit, setSelectedEditUnit] = useState<ApartmentUnit | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [selectedAssignUnit, setSelectedAssignUnit] = useState<ApartmentUnit | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Selected apartment code for 3D model & sidebar dossier
  const [activeCodeIn3D, setActiveCodeIn3D] = useState<string>('12A05');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const refreshUnits = () => {
    const fresh = getApartmentUnits();
    setUnits([...fresh]);
    if (selectedDetailUnit) {
      const updatedCurrent = fresh.find(u => u.code === selectedDetailUnit.code);
      if (updatedCurrent) setSelectedDetailUnit(updatedCurrent);
    }
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
  const filteredUnits = units.filter(unit => {
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

  // Thống kê KPI
  const totalUnits = units.length;
  const occupiedUnits = units.filter(u => u.status === 'OCCUPIED').length;
  const vacantUnits = units.filter(u => u.status === 'VACANT').length;
  const maintenanceUnits = units.filter(u => u.status === 'MAINTENANCE').length;
  const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

  // Active unit for 3D View
  const active3DUnit = units.find(u => u.code === activeCodeIn3D) || units[0];

  return (
    <div className="space-y-6 animate-fadeIn select-none">
      
      {/* ============================================================= */}
      {/* 1. TIÊU ĐỀ & NÚT THAO TÁC                                     */}
      {/* ============================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222B35] pb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-semibold flex items-center gap-1.5 font-mono">
            <Building className="w-3.5 h-3.5" /> Quản Trị Không Gian Căn Hộ • Ban Quản Lý
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl text-white font-bold mt-1">
            Danh Sách & Quản Lý Căn Hộ Skyline
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Giám sát trạng thái cư trú, hồ sơ chủ hộ, hợp đồng bàn giao, phương tiện đăng ký và sơ đồ mặt bằng 3D toàn bộ Tòa A & Tòa B.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Nút thêm căn hộ */}
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] font-bold text-xs uppercase tracking-wider rounded-none transition-all flex items-center gap-1.5 shadow-lg active:scale-95"
          >
            <Plus className="w-4 h-4" /> Thêm Căn Hộ Mới
          </button>
        </div>
      </div>

      {/* Toast alert message */}
      {toastMessage && (
        <div className="p-3 bg-emerald-950/90 border border-emerald-500/80 text-emerald-200 text-xs font-semibold flex items-center justify-between shadow-lg animate-fadeIn">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {toastMessage}
          </span>
          <button type="button" onClick={() => setToastMessage(null)} className="text-emerald-400 hover:text-white">
            <span className="text-xs">✕</span>
          </button>
        </div>
      )}

      {/* ============================================================= */}
      {/* 2. THANH THỐNG KÊ KPI LẤP ĐẦY                                 */}
      {/* ============================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-[#121820] border border-[#222B35] rounded-none">
          <div className="text-[10px] uppercase tracking-wider text-gray-400 font-mono flex items-center justify-between">
            <span>Tổng Căn Hộ Giám Sát</span>
            <Building className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            {totalUnits} <span className="text-xs text-gray-400 font-normal">căn</span>
          </div>
          <div className="text-[10px] text-gray-400 mt-1">Tòa A (Sapphire) & Tòa B (Diamond)</div>
        </div>

        <div className="p-4 bg-[#121820] border border-emerald-500/40 rounded-none">
          <div className="text-[10px] uppercase tracking-wider text-emerald-400 font-mono flex items-center justify-between">
            <span>Đang Sinh Sống (Có Người)</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-300 mt-1">
            {occupiedUnits} <span className="text-xs text-emerald-400 font-normal">căn ({occupancyRate}%)</span>
          </div>
          <div className="text-[10px] text-emerald-400/80 mt-1">Dữ liệu chủ hộ & nhân khẩu thực tế</div>
        </div>

        <div className="p-4 bg-[#121820] border border-amber-500/40 rounded-none">
          <div className="text-[10px] uppercase tracking-wider text-amber-400 font-mono flex items-center justify-between">
            <span>Căn Hộ Đang Trống</span>
            <Key className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300 mt-1">
            {vacantUnits} <span className="text-xs text-amber-400 font-normal">căn</span>
          </div>
          <div className="text-[10px] text-amber-400/80 mt-1">Sẵn sàng bàn giao đón cư dân</div>
        </div>

        <div className="p-4 bg-[#121820] border border-purple-500/40 rounded-none">
          <div className="text-[10px] uppercase tracking-wider text-purple-400 font-mono flex items-center justify-between">
            <span>Đang Bảo Trì / Sửa Chữa</span>
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-purple-300 mt-1">
            {maintenanceUnits} <span className="text-xs text-purple-400 font-normal">căn</span>
          </div>
          <div className="text-[10px] text-purple-400/80 mt-1">Đang hoàn thiện nội thất kỹ thuật</div>
        </div>
      </div>

      {/* ============================================================= */}
      {/* 3. BỘ LỌC ĐA TIÊU CHÍ & THANH ĐIỀU HƯỚNG GÓC NHÌN            */}
      {/* ============================================================= */}
      <div className="p-4 bg-[#121820] border border-[#222B35] rounded-none space-y-3 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Chuyển đổi 4 Chế độ hiển thị */}
          <div className="flex bg-[#0D1117] p-1 border border-[#222B35] rounded-none">
            <button
              type="button"
              onClick={() => setViewMode('TABLE')}
              className={`px-3 py-1.5 rounded-none font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'TABLE'
                  ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" /> Bảng Quản Trị ({filteredUnits.length})
            </button>

            <button
              type="button"
              onClick={() => setViewMode('CARDS')}
              className={`px-3 py-1.5 rounded-none font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'CARDS'
                  ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Lưới Thẻ Căn Hộ
            </button>

            <button
              type="button"
              onClick={() => setViewMode('3D')}
              className={`px-3 py-1.5 rounded-none font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === '3D'
                  ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Box className="w-3.5 h-3.5" /> Phối Cảnh Khối 3D
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
          </div>

          {/* Ô tìm kiếm tức thời */}
          <div className="relative flex-1 max-w-xs min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo mã căn, tên chủ hộ, CCCD..."
              className="w-full bg-[#161B22] border border-[#2D3748] pl-8 pr-3 py-1.5 rounded-none text-white text-xs outline-none focus:border-[#C5A880]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

        </div>

        {/* Dòng bộ lọc chi tiết: Tòa, Trạng thái, Loại căn */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#222B35]">
          
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
                  ? 'bg-[#1C2533] text-[#C5A880] border-[#C5A880] font-bold'
                  : 'bg-[#161B22] text-gray-400 border-[#2D3748] hover:text-white'
              }`}
            >
              {o.label}
            </button>
          ))}

          <div className="w-[1px] h-4 bg-[#2D3748] mx-1 hidden sm:block" />

          {/* Lọc Loại căn */}
          <span className="text-gray-400 font-mono text-[11px]">Loại:</span>
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
                  ? 'bg-[#1C2533] text-[#C5A880] border-[#C5A880] font-bold'
                  : 'bg-[#161B22] text-gray-400 border-[#2D3748] hover:text-white'
              }`}
            >
              {tp.label}
            </button>
          ))}

        </div>
      </div>

      {/* ============================================================= */}
      {/* 4. HIỂN THỊ DỮ LIỆU CĂN HỘ THEO 4 VIEW CHẾ ĐỘ                 */}
      {/* ============================================================= */}

      {/* ------------------------------------------------------------- */}
      {/* VIEW 1: BẢNG QUẢN TRỊ CĂN HỘ (DATA TABLE CHUYÊN NGHIỆP)       */}
      {/* ------------------------------------------------------------- */}
      {viewMode === 'TABLE' && (
        <div className="bg-[#0D1117] border border-[#222B35] overflow-x-auto shadow-2xl animate-fadeIn">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#121820] text-gray-400 font-mono uppercase text-[10.5px] border-b border-[#222B35]">
                <th className="py-3 px-3">Mã Căn</th>
                <th className="py-3 px-3">Tòa / Tầng</th>
                <th className="py-3 px-3">Phân Loại</th>
                <th className="py-3 px-3">Diện Tích</th>
                <th className="py-3 px-3">Trạng Thái</th>
                <th className="py-3 px-3">Chủ Hộ Hiện Tại</th>
                <th className="py-3 px-3 text-center">Nhân Khẩu</th>
                <th className="py-3 px-3 text-center">Phương Tiện</th>
                <th className="py-3 px-3">Phí Quản Lý</th>
                <th className="py-3 px-3 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2633] text-gray-300">
              {filteredUnits.length > 0 ? (
                filteredUnits.map((unit) => {
                  const isOccupied = unit.status === 'OCCUPIED';
                  return (
                    <tr 
                      key={unit.code} 
                      className="hover:bg-[#161D26] transition-colors group cursor-pointer"
                      onClick={() => {
                        setSelectedDetailUnit(unit);
                        setIsDetailModalOpen(true);
                      }}
                    >
                      {/* Mã căn */}
                      <td className="py-3 px-3">
                        <div className="font-serif font-bold text-white text-sm group-hover:text-[#C5A880] transition-colors flex items-center gap-1.5">
                          <span>{unit.code}</span>
                          {unit.code === '12A05' && (
                            <span className="text-[9px] px-1 py-0.2 bg-[#C5A880] text-[#0D1117] font-bold font-mono">
                              Chính Chủ
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-gray-500 font-mono">
                          {unit.priceBillion} Tỷ VNĐ
                        </div>
                      </td>

                      {/* Tòa / Tầng */}
                      <td className="py-3 px-3 font-mono">
                        <div className="font-semibold text-gray-200">
                          {unit.tower === 'A' ? 'Tòa A (Sapphire)' : 'Tòa B (Diamond)'}
                        </div>
                        <div className="text-[10.5px] text-gray-400">Tầng {unit.floor}</div>
                      </td>

                      {/* Phân loại */}
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 bg-[#161B22] border border-[#2D3748] text-[#C5A880] font-semibold text-[11px] whitespace-nowrap">
                          {unit.typeLabel}
                        </span>
                        <div className="text-[10px] text-gray-500 mt-0.5">Hướng: {unit.direction}</div>
                      </td>

                      {/* Diện tích */}
                      <td className="py-3 px-3 font-mono">
                        <div className="text-white font-bold">{unit.area} m²</div>
                        <div className="text-[10px] text-gray-500">Tim: {unit.wallArea} m²</div>
                      </td>

                      {/* Trạng thái */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-none border shadow-sm inline-flex items-center gap-1 font-mono ${
                          unit.status === 'OCCUPIED'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                            : unit.status === 'MAINTENANCE'
                            ? 'bg-purple-950 text-purple-300 border-purple-500'
                            : 'bg-amber-950 text-amber-300 border-amber-500'
                        }`}>
                          {unit.status === 'OCCUPIED' ? '● Đang Ở' : unit.status === 'MAINTENANCE' ? '● Bảo Trì' : '○ Căn Trống'}
                        </span>
                      </td>

                      {/* Chủ hộ */}
                      <td className="py-3 px-3">
                        {isOccupied && unit.owner ? (
                          <div className="flex items-center gap-2">
                            <img
                              src={unit.owner.avatar?.replace('data.nks.vn//', 'data.nks.vn/') || 'https://data.nks.vn/storage/users/default.png'}
                              alt={unit.owner.name}
                              className="w-7 h-7 object-cover border border-[#2D3748] flex-shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="font-bold text-white text-xs truncate">{unit.owner.name}</div>
                              <div className="text-[10.5px] text-gray-400 font-mono">{unit.owner.phone}</div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-500 italic text-[11px]">— Chưa có cư dân —</span>
                        )}
                      </td>

                      {/* Nhân khẩu */}
                      <td className="py-3 px-3 text-center font-mono">
                        <span className="px-2 py-0.5 bg-[#161B22] border border-[#222B35] text-gray-300">
                          {unit.membersCount} người
                        </span>
                      </td>

                      {/* Phương tiện */}
                      <td className="py-3 px-3 text-center font-mono">
                        <span className="px-2 py-0.5 bg-[#161B22] border border-[#222B35] text-gray-300">
                          {unit.vehicles?.length || 0} xe
                        </span>
                      </td>

                      {/* Phí quản lý */}
                      <td className="py-3 px-3 font-mono whitespace-nowrap">
                        {unit.billing ? (
                          <div>
                            <div className="font-bold text-white text-xs">
                              {unit.billing.totalAmount.toLocaleString('vi-VN')} đ
                            </div>
                            <span className={`text-[9.5px] px-1.5 py-0.2 font-semibold ${
                              unit.billing.status === 'PAID' ? 'text-emerald-400' : 'text-amber-400'
                            }`}>
                              {unit.billing.status === 'PAID' ? '✓ Đã Nộp' : 'Chưa Thu'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-[11px]">0 đ</span>
                        )}
                      </td>

                      {/* Thao tác */}
                      <td className="py-3 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDetailUnit(unit);
                              setIsDetailModalOpen(true);
                            }}
                            title="Xem chi tiết hồ sơ & mô hình 3D"
                            className="p-1.5 bg-[#161B22] hover:bg-[#C5A880] hover:text-[#0D1117] text-gray-300 transition-colors border border-[#2D3748]"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedEditUnit(unit);
                              setIsEditModalOpen(true);
                            }}
                            title="Sửa thông số căn hộ"
                            className="p-1.5 bg-[#161B22] hover:bg-white hover:text-[#0D1117] text-gray-300 transition-colors border border-[#2D3748]"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {!isOccupied ? (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedAssignUnit(unit);
                                setIsAssignModalOpen(true);
                              }}
                              title="Bàn giao chìa khóa cho chủ hộ mới"
                              className="px-2 py-1 bg-[#C5A880] hover:bg-white text-[#0D1117] font-bold text-[10.5px] uppercase transition-colors"
                            >
                              Bàn Giao
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Xác nhận thu hồi căn hộ ${unit.code} về trạng thái trống?`)) {
                                  evictApartmentResident(unit.code);
                                  showToast(`✓ Đã thu hồi căn hộ ${unit.code} về trạng thái trống.`);
                                  refreshUnits();
                                }
                              }}
                              title="Thu hồi căn hộ khi cư dân chuyển đi"
                              className="px-2 py-1 bg-[#161B22] hover:bg-rose-950 text-gray-400 hover:text-rose-300 border border-[#2D3748] text-[10.5px] transition-colors"
                            >
                              Thu Hồi
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-gray-500 font-mono">
                    Không tìm thấy căn hộ nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* VIEW 2: LƯỚI THẺ CĂN HỘ (CARD GRID VIEW)                      */}
      {/* ------------------------------------------------------------- */}
      {viewMode === 'CARDS' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fadeIn">
          {filteredUnits.map(unit => {
            const isOccupied = unit.status === 'OCCUPIED';
            return (
              <div
                key={unit.code}
                onClick={() => {
                  setSelectedDetailUnit(unit);
                  setIsDetailModalOpen(true);
                }}
                className="bg-[#0D1117] border border-[#222B35] hover:border-[#C5A880]/70 p-4 transition-all duration-300 cursor-pointer shadow-xl flex flex-col justify-between space-y-3 group"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-mono text-[10px] text-gray-400 uppercase">
                        {unit.towerName} • Tầng {unit.floor}
                      </div>
                      <h3 className="font-serif text-2xl font-bold text-white group-hover:text-[#C5A880] transition-colors mt-0.5">
                        Căn Hộ {unit.code}
                      </h3>
                    </div>

                    <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-none border font-mono ${
                      unit.status === 'OCCUPIED'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                        : unit.status === 'MAINTENANCE'
                        ? 'bg-purple-950 text-purple-300 border-purple-500'
                        : 'bg-amber-950 text-amber-300 border-amber-500'
                    }`}>
                      {unit.statusLabel}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#222B35] text-xs font-mono">
                    <div>
                      <span className="text-gray-500">Phân Loại:</span>
                      <div className="text-white font-semibold font-sans">{unit.typeLabel}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Diện Tích:</span>
                      <div className="text-[#C5A880] font-bold">{unit.area} m²</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Hướng Ban Công:</span>
                      <div className="text-gray-300 font-sans">{unit.direction}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Định Giá:</span>
                      <div className="text-white font-bold">{unit.priceBillion} Tỷ VNĐ</div>
                    </div>
                  </div>

                  {/* Cư dân / Tình trạng */}
                  <div className="mt-3 p-2.5 bg-[#121820] border border-[#222B35] text-xs">
                    {isOccupied && unit.owner ? (
                      <div className="flex items-center gap-2.5">
                        <img
                          src={unit.owner.avatar?.replace('data.nks.vn//', 'data.nks.vn/') || 'https://data.nks.vn/storage/users/default.png'}
                          alt={unit.owner.name}
                          className="w-8 h-8 object-cover border border-[#2D3748]"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-white text-xs truncate">{unit.owner.name}</div>
                          <div className="text-[10.5px] text-gray-400 font-mono">{unit.owner.phone} • {unit.membersCount} người</div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-400 italic text-[11px] flex items-center justify-between">
                        <span>Căn hộ đang trống</span>
                        <span className="text-amber-400 font-bold font-mono">Sẵn Sàng</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#222B35] text-xs" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDetailUnit(unit);
                      setIsDetailModalOpen(true);
                    }}
                    className="text-[#C5A880] hover:text-white font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" /> Xem Hồ Sơ 3D
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedEditUnit(unit);
                      setIsEditModalOpen(true);
                    }}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* VIEW 3: PHỐI CẢNH 3D TÒA THÁP SKYLINE                         */}
      {/* ------------------------------------------------------------- */}
      {viewMode === '3D' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fadeIn">
          {/* Viewport SVG 3D */}
          <div className="lg:col-span-8 bg-[#0D1117] border border-[#222B35] shadow-2xl flex flex-col overflow-hidden">
            <div className="p-4 bg-[#121820] border-b border-[#222B35] flex items-center justify-between">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <Box className="w-4 h-4 text-[#C5A880]" /> Mô Hình Khối 3D Tổ Hợp Chung Cư Skyline
              </span>
              <div className="flex items-center gap-3 text-[10px] font-mono">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-500" /> Đang Ở</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-amber-400" /> Đang Trống</span>
              </div>
            </div>

            <div className="relative w-full h-[520px] bg-[#05070A] overflow-hidden flex items-center justify-center">
              <svg viewBox="0 0 900 560" className="w-full h-full max-h-[520px] cursor-pointer drop-shadow-[0_30px_60px_rgba(0,0,0,0.9)]">
                <defs>
                  <linearGradient id="podiumGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1E293B" />
                    <stop offset="100%" stopColor="#0F172A" />
                  </linearGradient>
                </defs>

                {/* Khối đế */}
                <g className="opacity-90">
                  <polygon points="120,440 450,530 780,440 450,380" fill="#0A0E17" stroke="#1E293B" strokeWidth="1.5" />
                  <polygon points="180,390 450,470 720,390 720,360 450,440 180,360" fill="url(#podiumGrad)" stroke="#334155" strokeWidth="1" />
                  <text x="450" y="455" fill="#94A3B8" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                    KHỐI ĐẾ THƯƠNG MẠI & SẢNH ĐÓN PODIUM (TẦNG 1 - 3)
                  </text>
                </g>

                {/* TÒA A - SAPPHIRE */}
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
                    fill={activeCodeIn3D === '25PH-01' ? '#F59E0B' : '#78350F'}
                    stroke={activeCodeIn3D === '25PH-01' ? '#FDE68A' : '#F59E0B'}
                    strokeWidth={activeCodeIn3D === '25PH-01' ? '2.5' : '1.2'}
                    onClick={() => setActiveCodeIn3D('25PH-01')}
                    className="cursor-pointer transition-all hover:fill-amber-500"
                  />
                  <text x="295" y="105" fill="#FEF3C7" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                    25PH-01 (Duplex)
                  </text>

                  {/* 18A01 */}
                  <polygon 
                    points="215,190 375,230 375,160 215,125" 
                    fill={activeCodeIn3D === '18A01' ? '#F59E0B' : '#78350F'}
                    stroke={activeCodeIn3D === '18A01' ? '#FDE68A' : '#F59E0B'}
                    strokeWidth={activeCodeIn3D === '18A01' ? '2.5' : '1.2'}
                    onClick={() => setActiveCodeIn3D('18A01')}
                    className="cursor-pointer transition-all hover:fill-amber-500"
                  />
                  <text x="295" y="180" fill="#FEF3C7" fontSize="9.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                    18A01 (3PN)
                  </text>

                  {/* 12A05 */}
                  <polygon 
                    points="215,280 375,320 375,240 215,205" 
                    fill={activeCodeIn3D === '12A05' ? '#059669' : '#065F46'}
                    stroke={activeCodeIn3D === '12A05' ? '#A7F3D0' : '#10B981'}
                    strokeWidth={activeCodeIn3D === '12A05' ? '3' : '1.5'}
                    onClick={() => setActiveCodeIn3D('12A05')}
                    className="cursor-pointer transition-all hover:fill-emerald-500"
                  />
                  <text x="295" y="265" fill="#FFFFFF" fontSize="10" fontWeight="extrabold" textAnchor="middle" fontFamily="monospace">
                    ★ 12A05 (2PN) • ĐANG Ở
                  </text>

                  {/* 05A02 */}
                  <polygon 
                    points="215,350 375,390 375,330 215,295" 
                    fill={activeCodeIn3D === '05A02' ? '#059669' : '#065F46'}
                    stroke={activeCodeIn3D === '05A02' ? '#A7F3D0' : '#10B981'}
                    strokeWidth={activeCodeIn3D === '05A02' ? '2.5' : '1'}
                    onClick={() => setActiveCodeIn3D('05A02')}
                    className="cursor-pointer transition-all hover:fill-emerald-500"
                  />
                  <text x="295" y="345" fill="#FFFFFF" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                    05A02 (1PN) • ĐANG Ở
                  </text>
                </g>

                {/* TÒA B - DIAMOND */}
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
                    fill={activeCodeIn3D === '25PH-02' ? '#F59E0B' : '#78350F'}
                    stroke={activeCodeIn3D === '25PH-02' ? '#FDE68A' : '#F59E0B'}
                    strokeWidth={activeCodeIn3D === '25PH-02' ? '2.5' : '1.2'}
                    onClick={() => setActiveCodeIn3D('25PH-02')}
                    className="cursor-pointer transition-all hover:fill-amber-500"
                  />
                  <text x="605" y="105" fill="#FEF3C7" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                    25PH-02 (Duplex)
                  </text>

                  {/* 19B03 */}
                  <polygon 
                    points="525,210 685,170 685,130 525,165" 
                    fill={activeCodeIn3D === '19B03' ? '#059669' : '#065F46'}
                    stroke={activeCodeIn3D === '19B03' ? '#A7F3D0' : '#10B981'}
                    strokeWidth={activeCodeIn3D === '19B03' ? '2.5' : '1.2'}
                    onClick={() => setActiveCodeIn3D('19B03')}
                    className="cursor-pointer transition-all hover:fill-emerald-500"
                  />
                  <text x="605" y="170" fill="#FFFFFF" fontSize="9.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                    19B03 (3PN) • ĐANG Ở
                  </text>

                  {/* 11B06 */}
                  <polygon 
                    points="525,290 685,250 685,215 525,250" 
                    fill={activeCodeIn3D === '11B06' ? '#059669' : '#065F46'}
                    stroke={activeCodeIn3D === '11B06' ? '#A7F3D0' : '#10B981'}
                    strokeWidth={activeCodeIn3D === '11B06' ? '2.5' : '1.2'}
                    onClick={() => setActiveCodeIn3D('11B06')}
                    className="cursor-pointer transition-all hover:fill-emerald-500"
                  />
                  <text x="605" y="250" fill="#FFFFFF" fontSize="9.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                    11B06 (2PN) • ĐANG Ở
                  </text>

                  {/* 08B12 */}
                  <polygon 
                    points="525,350 685,310 685,280 525,315" 
                    fill={activeCodeIn3D === '08B12' ? '#F59E0B' : '#78350F'}
                    stroke={activeCodeIn3D === '08B12' ? '#FDE68A' : '#F59E0B'}
                    strokeWidth={activeCodeIn3D === '08B12' ? '2.5' : '1.2'}
                    onClick={() => setActiveCodeIn3D('08B12')}
                    className="cursor-pointer transition-all hover:fill-amber-500"
                  />
                  <text x="605" y="315" fill="#FEF3C7" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                    08B12 (1PN) • TRỐNG
                  </text>
                </g>
              </svg>

              <div className="absolute bottom-3 left-3 bg-[#0D1117]/90 border border-[#222B35] px-3 py-1.5 text-[10.5px] text-[#C5A880] font-mono backdrop-blur-md">
                * Nhấp trực tiếp vào từng khối căn hộ trên mô hình để xem hồ sơ
              </div>
            </div>
          </div>

          {/* Dossier tóm tắt của căn hộ đang chọn trong 3D */}
          <div className="lg:col-span-4 bg-[#0D1117] border border-[#222B35] p-5 space-y-4 shadow-2xl">
            <div className="border-b border-[#222B35] pb-3 flex items-start justify-between">
              <div>
                <div className="text-[10px] text-[#C5A880] uppercase font-mono">
                  {active3DUnit.towerName} • Tầng {active3DUnit.floor}
                </div>
                <h3 className="font-serif text-2xl font-bold text-white mt-0.5">
                  Căn Hộ {active3DUnit.code}
                </h3>
              </div>
              <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-none border ${
                active3DUnit.status === 'OCCUPIED' ? 'bg-emerald-950 text-emerald-300 border-emerald-500' : 'bg-amber-950 text-amber-300 border-amber-500'
              }`}>
                {active3DUnit.statusLabel}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2 bg-[#121820] border border-[#222B35]">
                <span className="text-gray-500 text-[10px]">Loại Căn:</span>
                <div className="text-white font-sans font-semibold">{active3DUnit.typeLabel}</div>
              </div>
              <div className="p-2 bg-[#121820] border border-[#222B35]">
                <span className="text-gray-500 text-[10px]">Diện Tích:</span>
                <div className="text-[#C5A880] font-bold">{active3DUnit.area} m²</div>
              </div>
            </div>

            {active3DUnit.status === 'OCCUPIED' && active3DUnit.owner ? (
              <div className="p-3 bg-[#121820] border border-emerald-500/50 space-y-2 text-xs">
                <div className="text-emerald-400 font-bold text-[11px] font-mono">Chủ Hộ Sinh Sống:</div>
                <div className="flex items-center gap-2.5">
                  <img
                    src={active3DUnit.owner.avatar?.replace('data.nks.vn//', 'data.nks.vn/') || 'https://data.nks.vn/storage/users/default.png'}
                    alt={active3DUnit.owner.name}
                    className="w-10 h-10 object-cover border border-[#2D3748]"
                  />
                  <div>
                    <div className="font-bold text-white text-sm">{active3DUnit.owner.name}</div>
                    <div className="text-gray-400 font-mono text-[11px]">{active3DUnit.owner.phone}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-[#1A1610] border border-amber-500/40 text-xs text-amber-200">
                Căn hộ hiện đang trống, sẵn sàng bàn giao cho cư dân mới.
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setSelectedDetailUnit(active3DUnit);
                setIsDetailModalOpen(true);
              }}
              className="w-full py-2.5 bg-[#C5A880] hover:bg-white text-[#0D1117] font-bold text-xs uppercase tracking-wider transition-colors shadow flex items-center justify-center gap-2"
            >
              <Eye className="w-4 h-4" /> Mở Toàn Bộ Hồ Sơ 3D
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* VIEW 4: MẶT CẮT CÁC TẦNG (FLOOR GRID VIEW)                    */}
      {/* ------------------------------------------------------------- */}
      {viewMode === 'FLOOR_GRID' && (
        <div className="bg-[#0D1117] border border-[#222B35] p-5 space-y-4 animate-fadeIn">
          <div className="text-xs text-gray-400 font-mono">
            Mặt Cắt Không Gian Các Tầng ({filteredUnits.length} căn hộ phù hợp):
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredUnits.map(unit => (
              <div
                key={unit.code}
                onClick={() => {
                  setSelectedDetailUnit(unit);
                  setIsDetailModalOpen(true);
                }}
                className="p-3 bg-[#121820] border border-[#222B35] hover:border-[#C5A880] transition-colors cursor-pointer flex items-center justify-between"
              >
                <div>
                  <div className="font-serif font-bold text-white text-base flex items-center gap-2">
                    <span>Căn {unit.code}</span>
                    <span className="text-[10px] px-1.5 py-0.2 bg-[#161B22] border border-gray-700 text-[#C5A880] font-sans">
                      {unit.typeLabel}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {unit.towerName} • Tầng {unit.floor} • {unit.area} m²
                  </div>
                </div>

                <div className="text-right">
                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-none border ${
                    unit.status === 'OCCUPIED' ? 'bg-emerald-950 text-emerald-300 border-emerald-500' : 'bg-amber-950 text-amber-300 border-amber-500'
                  }`}>
                    {unit.status === 'OCCUPIED' ? 'Đang Ở' : 'Căn Trống'}
                  </span>
                  <div className="text-[11px] font-mono text-[#C5A880] mt-1 font-bold">
                    {unit.priceBillion} tỷ VNĐ
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* 5. MODALS                                                     */}
      {/* ============================================================= */}

      {/* Modal 1: Chi tiết căn hộ toàn diện */}
      <ApartmentDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        unit={selectedDetailUnit}
        onEditUnit={(u) => {
          setSelectedEditUnit(u);
          setIsEditModalOpen(true);
        }}
        onAssignResident={(u) => {
          setSelectedAssignUnit(u);
          setIsAssignModalOpen(true);
        }}
        onRefresh={refreshUnits}
      />

      {/* Modal 2: Thêm căn hộ mới */}
      <AddApartmentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={(newUnit) => {
          showToast(`✓ Đã thêm thành công căn hộ mới ${newUnit.code} vào hệ thống!`);
          refreshUnits();
        }}
      />

      {/* Modal 3: Chỉnh sửa căn hộ */}
      <EditApartmentModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        unit={selectedEditUnit}
        onSuccess={() => {
          showToast('✓ Đã cập nhật thành công thông tin căn hộ!');
          refreshUnits();
        }}
      />

      {/* Modal 4: Bàn giao căn hộ cho cư dân mới */}
      <AssignResidentModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        unit={selectedAssignUnit}
        onSuccess={() => {
          showToast('✓ Đã bàn giao chìa khóa và kích hoạt quyền cư dân thành công!');
          refreshUnits();
        }}
      />

    </div>
  );
}
