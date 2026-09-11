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
  Maximize2,
  Check,
  RefreshCw,
  Compass,
  FileText,
  FileCheck2,
  Zap,
  RotateCcw,
  X,
  SlidersHorizontal,
  Wrench,
  Building2
} from 'lucide-react';
import { 
  getApartmentUnits, 
  getApartmentByCode, 
  ApartmentUnit, 
  ApartmentResidentOwner,
  saveApartmentsList 
} from '@/lib/apartmentStore';
import { getUserStore, getApartmentMembers, ApartmentMember } from '@/lib/userStore';
import AssignResidentModal from '@/components/portal/admin/AssignResidentModal';
import EditApartmentModal from '@/components/portal/admin/EditApartmentModal';
import AddApartmentModal from '@/components/portal/admin/AddApartmentModal';
import ApartmentDetailModal from '@/components/portal/admin/ApartmentDetailModal';

export type OccupancyFilter = 'ALL' | 'OCCUPIED' | 'VACANT' | 'MAINTENANCE';
export type ApartmentTypeFilter = 'ALL' | '1PN' | '2PN' | '3PN' | 'DUPLEX_PENTHOUSE';
export type FloorRangeFilter = 'ALL' | 'LOW' | 'MID' | 'HIGH';
export type ViewPerspective = '3D' | 'BUILDING_ELEVATION' | 'FLOOR_PLAN' | 'GRID';

export default function AdminBuildingApartmentManager() {
  // 1. Quản lý danh sách căn hộ thực tế từ apartmentStore
  const [apartments, setApartments] = useState<ApartmentUnit[]>([]);
  const [selectedAptCode, setSelectedAptCode] = useState<string>('12A05');
  const [selectedOccupancy, setSelectedOccupancy] = useState<OccupancyFilter>('ALL');
  const [selectedType, setSelectedType] = useState<ApartmentTypeFilter>('ALL');
  const [selectedFloorRange, setSelectedFloorRange] = useState<FloorRangeFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [buildingPerspective, setBuildingPerspective] = useState<ViewPerspective>('3D');
  const [detailTab, setDetailTab] = useState<'OVERVIEW' | 'TECHNICAL'>('OVERVIEW');

  // Điều khiển Floor Plan View (Mặt Bằng Tầng)
  const [selectedFloor, setSelectedFloor] = useState<number>(12);

  // Modals state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // 2. Dữ liệu thực tế cho cư dân căn hộ 12A05 từ API & userStore
  const initialOwner = getUserStore('user-owner-1');
  const initialMembers = getApartmentMembers('12A05');
  const [liveOwner, setLiveOwner] = useState<any>(null);
  const [liveMembers, setLiveMembers] = useState<ApartmentMember[]>(initialMembers);

  // Hàm tải danh sách căn hộ từ kho
  const reloadApartments = () => {
    const list = getApartmentUnits();
    setApartments(list);
  };

  // Lắng nghe thay đổi từ storage
  useEffect(() => {
    reloadApartments();

    const handleUpdate = () => {
      reloadApartments();
    };

    window.addEventListener('skyline_apartments_updated', handleUpdate);
    return () => {
      window.removeEventListener('skyline_apartments_updated', handleUpdate);
    };
  }, []);

  // Đồng bộ thông tin thực tế của chủ hộ 12A05 từ API NKS
  useEffect(() => {
    let isMounted = true;
    async function syncRealResident() {
      try {
        const famRes = await fetch('/api/nks/user/family?aptCode=12A05');
        if (famRes.ok) {
          const famData = await famRes.json();
          if (famData.success && Array.isArray(famData.members) && famData.members.length > 0) {
            if (isMounted) setLiveMembers(famData.members);
          }
        }

        const userRes = await fetch('/api/nks/user');
        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData.user && isMounted) {
            if (userData.user.role === 'OWNER' && (userData.user.apartment_code === '12A05' || !userData.user.role?.includes('ADMIN'))) {
              setLiveOwner(userData.user);
            }
          }
        }
      } catch (err) {
        console.warn('API sync warning:', err);
      }
    }
    syncRealResident();
    return () => { isMounted = false; };
  }, []);

  // Thông tin chủ hộ 12A05 chuẩn thực tế
  const isActualResident = 
    liveOwner && 
    liveOwner.role === 'OWNER' && 
    liveOwner.apartment_code === '12A05' &&
    !liveOwner.email?.includes('manager') &&
    !liveOwner.full_name?.includes('Quản Trị');

  const ownerData = isActualResident ? liveOwner : initialOwner;

  const activeOwnerName = isActualResident 
    ? (liveOwner.full_name || liveOwner.fullname || 'Nguyễn Hữu Lực')
    : (initialOwner?.full_name || 'Nguyễn Hữu Lực');

  const activeOwnerPhone = isActualResident 
    ? (liveOwner.phone || '0364967082') 
    : (initialOwner?.phone || '0364967082');

  const activeOwnerEmail = isActualResident 
    ? (liveOwner.email || 'huuluc04@gmail.com') 
    : (initialOwner?.email || 'huuluc04@gmail.com');

  const activeOwnerCccd = isActualResident 
    ? (liveOwner.cccd || liveOwner.idCard || liveOwner.id_card_no || '067204000961') 
    : ((initialOwner as any)?.cccd || initialOwner?.id_card_no || '067204000961');

  const activeOwnerAvatar = isActualResident 
    ? (liveOwner.avatar_url || liveOwner.avatar || 'https://data.nks.vn/storage/users/202609021654232258.jpg') 
    : (initialOwner?.avatar_url || 'https://data.nks.vn/storage/users/202609021654232258.jpg');

  const activeOwnerDob = isActualResident 
    ? (liveOwner.dob || liveOwner.birthday || '18/08/2004') 
    : (initialOwner?.dob || '18/08/2004');

  const activeOwnerPob = isActualResident 
    ? (liveOwner.pob || liveOwner.address || 'Triệu Trạch, Triệu Phong, Quảng Trị') 
    : (initialOwner?.pob || (initialOwner as any)?.address || 'Triệu Trạch, Triệu Phong, Quảng Trị');

  // Danh sách căn hộ hiển thị với dữ liệu người thật được cập nhật
  const displayUnits = useMemo(() => {
    return apartments.map(u => {
      if (u.code === '12A05') {
        return {
          ...u,
          towerName: 'Chung Cư Skyline',
          owner: {
            ...u.owner,
            name: activeOwnerName,
            phone: activeOwnerPhone,
            email: activeOwnerEmail,
            cccd: activeOwnerCccd,
            avatar: activeOwnerAvatar,
            dob: activeOwnerDob,
            pob: activeOwnerPob,
            eKycApproved: true
          },
          members: liveMembers,
          membersCount: liveMembers.length
        };
      }
      return {
        ...u,
        towerName: 'Chung Cư Skyline'
      };
    });
  }, [apartments, activeOwnerName, activeOwnerPhone, activeOwnerEmail, activeOwnerCccd, activeOwnerAvatar, activeOwnerDob, activeOwnerPob, liveMembers]);

  // Bộ lọc căn hộ đa tiêu chí & tìm kiếm thông minh
  const filteredUnits = useMemo(() => {
    return displayUnits.filter(unit => {
      const matchOccupancy = selectedOccupancy === 'ALL'
        ? true
        : selectedOccupancy === 'OCCUPIED'
        ? unit.status === 'OCCUPIED'
        : selectedOccupancy === 'VACANT'
        ? unit.status === 'VACANT'
        : unit.status === 'MAINTENANCE';

      const matchType = selectedType === 'ALL'
        ? true
        : selectedType === '1PN'
        ? (unit.type === '1PN' || unit.typeLabel.includes('1PN'))
        : selectedType === '2PN'
        ? (unit.type === '2PN' || unit.typeLabel.includes('2PN'))
        : selectedType === '3PN'
        ? (unit.type === '3PN' || unit.typeLabel.includes('3PN'))
        : (unit.type === 'DUPLEX_PENTHOUSE' || unit.typeLabel.toLowerCase().includes('duplex') || unit.typeLabel.toLowerCase().includes('penthouse'));

      const matchFloorRange = selectedFloorRange === 'ALL'
        ? true
        : selectedFloorRange === 'LOW'
        ? (unit.floor >= 1 && unit.floor <= 10)
        : selectedFloorRange === 'MID'
        ? (unit.floor >= 11 && unit.floor <= 20)
        : (unit.floor >= 21);

      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchOccupancy && matchType && matchFloorRange;

      // Hỗ trợ tìm: mã căn, tên chủ hộ, sđt, cccd, email, loại căn, hướng, số tầng ("tầng 12", "tang 12", "12")
      const matchSearch = 
        unit.code.toLowerCase().includes(q) ||
        (unit.owner?.name && unit.owner.name.toLowerCase().includes(q)) ||
        (unit.owner?.phone && unit.owner.phone.includes(q)) ||
        (unit.owner?.cccd && unit.owner.cccd.includes(q)) ||
        (unit.owner?.email && unit.owner.email.toLowerCase().includes(q)) ||
        unit.typeLabel.toLowerCase().includes(q) ||
        (unit.direction && unit.direction.toLowerCase().includes(q)) ||
        `tầng ${unit.floor}`.toLowerCase().includes(q) ||
        `tang ${unit.floor}`.toLowerCase().includes(q) ||
        (q.startsWith('tầng ') && unit.floor === parseInt(q.replace('tầng ', ''))) ||
        (q.startsWith('tang ') && unit.floor === parseInt(q.replace('tang ', '')));

      return matchOccupancy && matchType && matchFloorRange && matchSearch;
    });
  }, [displayUnits, selectedOccupancy, selectedType, selectedFloorRange, searchQuery]);

  // Danh sách gợi ý tìm kiếm tức thì
  const instantSearchMatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return displayUnits.filter(u => {
      return (
        u.code.toLowerCase().includes(q) ||
        (u.owner?.name && u.owner.name.toLowerCase().includes(q)) ||
        (u.owner?.phone && u.owner.phone.includes(q)) ||
        (u.owner?.cccd && u.owner.cccd.includes(q)) ||
        (u.owner?.email && u.owner.email.toLowerCase().includes(q)) ||
        u.typeLabel.toLowerCase().includes(q) ||
        (u.direction && u.direction.toLowerCase().includes(q))
      );
    }).slice(0, 6);
  }, [displayUnits, searchQuery]);

  const handleSelectSearchResult = (unit: ApartmentUnit) => {
    setSelectedAptCode(unit.code);
    setSelectedFloor(unit.floor);
    setIsSearchFocused(false);
  };

  const isAnyFilterActive = 
    selectedOccupancy !== 'ALL' || 
    selectedType !== 'ALL' || 
    selectedFloorRange !== 'ALL' || 
    searchQuery.trim() !== '';

  const resetAllFilters = () => {
    setSelectedOccupancy('ALL');
    setSelectedType('ALL');
    setSelectedFloorRange('ALL');
    setSearchQuery('');
  };

  // Căn hộ đang được chọn làm tiêu điểm hồ sơ
  const activeUnit = displayUnits.find(u => u.code === selectedAptCode) || displayUnits[0] || null;

  // Thống kê toàn tòa chung cư
  const totalUnitsCount = displayUnits.length;
  const occupiedCount = displayUnits.filter(u => u.status === 'OCCUPIED').length;
  const vacantCount = displayUnits.filter(u => u.status === 'VACANT').length;
  const maintenanceCount = displayUnits.filter(u => u.status === 'MAINTENANCE').length;
  const occupancyRate = totalUnitsCount > 0 ? Math.round((occupiedCount / totalUnitsCount) * 100) : 0;

  // Danh sách các tầng thực tế của tòa nhà chung cư (sắp xếp giảm dần từ tầng cao nhất xuống)
  const buildingFloors = useMemo(() => {
    const floors = Array.from(new Set(displayUnits.map(u => u.floor)));
    return floors.sort((a, b) => b - a);
  }, [displayUnits]);

  // Danh sách các căn hộ thuộc tầng đang chọn trong Floor Plan View
  const floorUnits = useMemo(() => {
    return displayUnits.filter(u => u.floor === selectedFloor);
  }, [displayUnits, selectedFloor]);

  return (
    <div className="space-y-6 animate-fadeIn select-none">
      {/* ============================================================= */}
      {/* 1. TIÊU ĐỀ HỆ THỐNG QUẢN LÝ CĂN HỘ BQL                        */}
      {/* ============================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222B35] pb-4">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-[#C5A880] font-semibold flex items-center gap-1.5 font-mono">
            <Building className="w-3.5 h-3.5 text-[#C5A880]" /> BAN QUẢN LÝ CHUNG CƯ SKYLINE
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl text-white font-bold mt-1">
            Quản Lý Căn Hộ Chung Cư Skyline
          </h2>
          <p className="text-xs text-gray-400 mt-0.5 max-w-3xl">
            Sơ đồ toàn bộ các tầng trong tòa nhà chung cư Skyline. Quản lý căn hộ, chủ nhà, người ở cùng, phương tiện và nhận bàn giao nhà thực tế.
          </p>
        </div>

        {/* Nút hành động & Chuyển góc nhìn */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-1.5 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider rounded-none transition-all flex items-center gap-1.5 shadow-lg active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" /> Thêm Căn Hộ
          </button>

          <div className="flex bg-[#121820] p-1 border border-[#222B35] rounded-none text-xs font-semibold overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setBuildingPerspective('3D')}
              className={`px-3 py-1.5 rounded-none flex items-center gap-1.5 transition-all shrink-0 ${
                buildingPerspective === '3D'
                  ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Box className="w-3.5 h-3.5" /> Khối 3D Tòa Nhà
            </button>
            <button
              type="button"
              onClick={() => setBuildingPerspective('BUILDING_ELEVATION')}
              className={`px-3 py-1.5 rounded-none flex items-center gap-1.5 transition-all shrink-0 ${
                buildingPerspective === 'BUILDING_ELEVATION'
                  ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Building className="w-3.5 h-3.5" /> Sơ Đồ Tòa Nhà
            </button>
            <button
              type="button"
              onClick={() => setBuildingPerspective('FLOOR_PLAN')}
              className={`px-3 py-1.5 rounded-none flex items-center gap-1.5 transition-all shrink-0 ${
                buildingPerspective === 'FLOOR_PLAN'
                  ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Mặt Bằng Tầng
            </button>
            <button
              type="button"
              onClick={() => setBuildingPerspective('GRID')}
              className={`px-3 py-1.5 rounded-none flex items-center gap-1.5 transition-all shrink-0 ${
                buildingPerspective === 'GRID'
                  ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Home className="w-3.5 h-3.5" /> Danh Sách Căn
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================= */}
      {/* 2. THANH THỐNG KÊ TÌNH HÌNH CĂN HỘ THỰC TẾ                    */}
      {/* ============================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-[#121820] border border-[#222B35] rounded-none">
          <div className="text-[11px] uppercase tracking-wider text-gray-400 font-mono flex items-center justify-between">
            <span>Tổng Số Căn Hộ</span>
            <Building className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            {totalUnitsCount} <span className="text-xs text-gray-400 font-normal">căn</span>
          </div>
          <div className="text-[11px] text-gray-400 mt-1">Tòa nhà 25 tầng chung cư Skyline</div>
        </div>

        <div className="p-4 bg-[#121820] border border-emerald-500/30 rounded-none">
          <div className="text-[11px] uppercase tracking-wider text-emerald-400 font-mono flex items-center justify-between">
            <span>Đã Có Người Ở</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-300 mt-1">
            {occupiedCount} <span className="text-xs text-gray-400 font-normal">căn ({occupancyRate}%)</span>
          </div>
          <div className="text-[11px] text-emerald-400/80 mt-1">Đã nhận bàn giao & đang sinh sống</div>
        </div>

        <div className="p-4 bg-[#121820] border border-amber-500/30 rounded-none">
          <div className="text-[11px] uppercase tracking-wider text-amber-400 font-mono flex items-center justify-between">
            <span>Nhà Trống (Chưa Có Người Ở)</span>
            <Key className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300 mt-1">
            {vacantCount} <span className="text-xs text-gray-400 font-normal">căn</span>
          </div>
          <div className="text-[11px] text-amber-400/80 mt-1">Nhà trống sẵn sàng đón cư dân mới</div>
        </div>

        <div className="p-4 bg-[#121820] border border-blue-500/30 rounded-none">
          <div className="text-[11px] uppercase tracking-wider text-blue-400 font-mono flex items-center justify-between">
            <span>Đang Sửa Chữa / Nghiệm Thu</span>
            <Clock className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-blue-300 mt-1">
            {maintenanceCount} <span className="text-xs text-gray-400 font-normal">căn</span>
          </div>
          <div className="text-[11px] text-blue-400/80 mt-1">Đang kiểm tra kỹ thuật trước bàn giao</div>
        </div>
      </div>

      {/* ============================================================= */}
      {/* 3. THANH CÔNG CỤ TÌM KIẾM & BỘ LỌC THON GỌN (CUỘN NGANG)      */}
      {/* ============================================================= */}
      <div className="p-2.5 bg-[#121820] border border-[#222B35] rounded-none flex items-center gap-3 text-xs shadow-lg">
        {/* Ô Tìm kiếm căn hộ thon gọn với Instant Dropdown */}
        <div className="relative w-44 sm:w-56 shrink-0">
          <Search className="w-3.5 h-3.5 text-[#C5A880] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 250)}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm mã căn, chủ nhà..."
            className="w-full bg-[#161B22] border border-[#2D3748] pl-8 pr-7 py-1.5 rounded-none text-white text-xs placeholder:text-gray-500 outline-none focus:border-[#C5A880] transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-0.5"
              title="Xóa tìm kiếm"
            >
              <X className="w-3 h-3" />
            </button>
          )}

          {/* Instant Search Matches Dropdown */}
          {isSearchFocused && searchQuery.trim() !== '' && (
            <div className="absolute top-full left-0 mt-1.5 w-72 sm:w-80 bg-[#0F141C] border border-[#C5A880]/50 shadow-2xl z-50 divide-y divide-[#1F2937] max-h-64 overflow-y-auto">
              <div className="px-3 py-1 bg-[#161F2C] text-[10px] font-mono text-[#C5A880] uppercase tracking-wider flex items-center justify-between">
                <span>Khớp ({instantSearchMatches.length} căn)</span>
                <span className="text-gray-400 text-[9px]">Nhấp chọn</span>
              </div>
              {instantSearchMatches.length === 0 ? (
                <div className="p-3 text-center text-gray-400 text-xs">
                  Không tìm thấy căn &ldquo;{searchQuery}&rdquo;
                </div>
              ) : (
                instantSearchMatches.map(u => (
                  <div
                    key={u.code}
                    onMouseDown={() => handleSelectSearchResult(u)}
                    className={`p-2 hover:bg-[#1C2533] cursor-pointer flex items-center justify-between transition-colors ${
                      selectedAptCode === u.code ? 'bg-[#1C2533] border-l-2 border-[#C5A880]' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white text-xs bg-[#161B22] px-1.5 py-0.5 border border-[#2D3748]">
                        {u.code}
                      </span>
                      <div className="min-w-0">
                        <div className="text-white text-xs font-semibold truncate">
                          {u.owner?.name ? u.owner.name : 'Nhà Trống'}
                        </div>
                        <div className="text-[10px] text-gray-400 truncate">
                          Tòa {u.tower} • Tầng {u.floor} • {u.typeLabel}
                        </div>
                      </div>
                    </div>
                    <span className={`text-[9px] px-1.5 py-0.2 font-mono shrink-0 ${
                      u.status === 'OCCUPIED'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                        : u.status === 'MAINTENANCE'
                        ? 'bg-blue-950 text-blue-300 border border-blue-800/60'
                        : 'bg-amber-950 text-amber-300 border border-amber-800/60'
                    }`}>
                      {u.status === 'OCCUPIED' ? 'Đã Ở' : u.status === 'MAINTENANCE' ? 'Nghiệm Thu' : 'Trống'}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Vạch kẻ phân cách */}
        <div className="w-[1px] h-6 bg-[#222B35] shrink-0"></div>

        {/* VÙNG CON LĂN NGANG ĐỂ LƯỚT TỪNG TIÊU CHÍ LỌC (HORIZONTAL SCROLL) */}
        <div 
          onWheel={(e) => {
            if (e.deltaY !== 0) {
              e.currentTarget.scrollLeft += e.deltaY;
            }
          }}
          className="flex-1 flex items-center gap-2.5 overflow-x-auto no-scrollbar scroll-smooth py-0.5"
        >
          {/* Nhóm Lọc Trạng Thái */}
          <div className="flex items-center gap-1 shrink-0 bg-[#161B22] p-1 border border-[#2D3748]">
            <span className="text-gray-400 font-mono text-[10.5px] px-1">Trạng Thái:</span>
            {[
              { id: 'ALL', label: 'Tất Cả' },
              { id: 'OCCUPIED', label: '🟢 Đã Có Người Ở' },
              { id: 'VACANT', label: '🟡 Chưa Có Người Ở' },
              { id: 'MAINTENANCE', label: '🔵 Nghiệm Thu' }
            ].map(o => (
              <button
                key={o.id}
                onClick={() => setSelectedOccupancy(o.id as any)}
                className={`px-2 py-0.5 text-xs font-semibold rounded-none transition-all ${
                  selectedOccupancy === o.id
                    ? 'bg-[#1C2533] text-[#C5A880] border border-[#C5A880] font-bold shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>

          {/* Nhóm Lọc Loại Căn */}
          <div className="flex items-center gap-1 shrink-0 bg-[#161B22] p-1 border border-[#2D3748]">
            <span className="text-gray-400 font-mono text-[10.5px] px-1">Loại:</span>
            {[
              { id: 'ALL', label: 'Tất Cả' },
              { id: '1PN', label: '1PN' },
              { id: '2PN', label: '2PN' },
              { id: '3PN', label: '3PN' },
              { id: 'DUPLEX_PENTHOUSE', label: 'Căn Lớn' }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedType(t.id as any)}
                className={`px-2 py-0.5 text-xs font-semibold rounded-none transition-all ${
                  selectedType === t.id
                    ? 'bg-[#2A374A] text-sky-200 border border-sky-400 font-bold shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Nhóm Lọc Khoảng Tầng */}
          <div className="flex items-center gap-1 shrink-0 bg-[#161B22] p-1 border border-[#2D3748]">
            <span className="text-gray-400 font-mono text-[10.5px] px-1">Tầng:</span>
            {[
              { id: 'ALL', label: 'Tất Cả' },
              { id: 'LOW', label: 'Thấp (1-10)' },
              { id: 'MID', label: 'Trung (11-20)' },
              { id: 'HIGH', label: 'Cao (21+)' }
            ].map(r => (
              <button
                key={r.id}
                onClick={() => setSelectedFloorRange(r.id as any)}
                className={`px-2 py-0.5 text-xs font-semibold rounded-none transition-all ${
                  selectedFloorRange === r.id
                    ? 'bg-[#2E281F] text-amber-200 border border-amber-500 font-bold shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Vạch kẻ phân cách */}
        <div className="w-[1px] h-6 bg-[#222B35] shrink-0"></div>

        {/* Bộ Đếm Kết Quả & Nút Reset */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-[11px] font-mono text-gray-300 bg-[#161B22] px-2.5 py-1 border border-[#2D3748] hidden xl:flex items-center gap-1.5">
            <SlidersHorizontal className="w-3 h-3 text-[#C5A880]" />
            <span>{filteredUnits.length}/{displayUnits.length} căn</span>
          </div>

          {isAnyFilterActive && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="flex items-center gap-1 px-2.5 py-1 bg-[#2B1D1D] hover:bg-[#3D2525] text-rose-300 border border-rose-800/60 transition-colors font-semibold text-xs"
              title="Đặt lại bộ lọc"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Đặt Lại</span>
            </button>
          )}
        </div>
      </div>

      {/* ============================================================= */}
      {/* 4. KHU VỰC CHÍNH: SƠ ĐỒ TÒA NHÀ & HỒ SƠ CHI TIẾT CĂN HỘ       */}
      {/* ============================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* CỘT TRÁI (7 COLS): SƠ ĐỒ TÒA NHÀ / MẶT BẰNG TẦNG / DANH SÁCH */}
        <div className="lg:col-span-7 bg-[#0D1117] border border-[#222B35] rounded-none overflow-hidden shadow-2xl flex flex-col">
          
          {/* Header mô hình */}
          <div className="p-4 bg-[#121820] border-b border-[#222B35] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-[#C5A880]" />
              <span className="font-bold text-sm text-white">
                {buildingPerspective === '3D' && 'Mô Hình Khối 3D Tòa Nhà Chung Cư Skyline'}
                {buildingPerspective === 'BUILDING_ELEVATION' && 'Sơ Đồ Các Tầng Chung Cư Skyline (25 Tầng)'}
                {buildingPerspective === 'FLOOR_PLAN' && `Sơ Đồ Mặt Bằng Sàn Tầng ${selectedFloor}`}
                {buildingPerspective === 'GRID' && `Danh Sách Căn Hộ Chung Cư (${filteredUnits.length} căn)`}
              </span>
            </div>
            
            {/* Chú thích màu sắc */}
            <div className="flex items-center gap-3 text-[10.5px] font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                <span className="text-gray-300">Đã Có Người Ở</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]"></span>
                <span className="text-gray-300">Chưa Có Người Ở</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]"></span>
                <span className="text-gray-300">Nghiệm Thu</span>
              </div>
            </div>
          </div>

          {/* ----------------------------------------------------------- */}
          {/* GÓC NHÌN 1: MÔ HÌNH KHỐI 3D KIẾN TRÚC TÒA NHÀ THỰC TẾ       */}
          {/* ----------------------------------------------------------- */}
          {buildingPerspective === '3D' && (
            <div className="relative w-full h-[540px] sm:h-[600px] bg-[#05070A] overflow-hidden flex items-center justify-center">
              {/* Lưới tọa độ không gian kiến trúc */}
              <div 
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  backgroundImage: 'linear-gradient(to right, #1E293B 1px, transparent 1px), linear-gradient(to bottom, #1E293B 1px, transparent 1px)',
                  backgroundSize: '24px 24px'
                }}
              />

              {/* BẢN VẼ PHỐI CẢNH 3D 1 TÒA NHÀ CHUNG CƯ SKYLINE DUY NHẤT (SVG) */}
              <svg
                viewBox="0 0 1000 620"
                className="w-full h-full max-h-[600px] cursor-pointer drop-shadow-[0_30px_60px_rgba(0,0,0,0.95)]"
              >
                <defs>
                  {/* Gradient kính mặt tiền tháp */}
                  <linearGradient id="skylineGlassL" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1E293B" />
                    <stop offset="50%" stopColor="#0F172A" />
                    <stop offset="100%" stopColor="#050B14" />
                  </linearGradient>

                  <linearGradient id="skylineGlassR" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#334155" />
                    <stop offset="60%" stopColor="#1E293B" />
                    <stop offset="100%" stopColor="#0A101D" />
                  </linearGradient>

                  <linearGradient id="podiumMallGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1E293B" />
                    <stop offset="100%" stopColor="#0B111A" />
                  </linearGradient>
                </defs>

                {/* 1. KHUÔN VIÊN MẶT ĐẤT & SẢNH ĐÓN TẦNG 1 */}
                <g className="opacity-95">
                  <polygon points="100,530 500,605 900,530 500,455" fill="#070B12" stroke="#1E293B" strokeWidth="2" />
                  <polygon points="370,565 500,590 630,565 500,540" fill="#0369A1" fillOpacity="0.4" stroke="#38BDF8" strokeWidth="1" />
                  <text x="500" y="568" fill="#38BDF8" fontSize="8.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                    HỒ NƯỚC CẢNH QUAN & ĐÀI PHUN NƯỚC NỘI KHU
                  </text>

                  {/* KHỐI SẢNH ĐÓN & DỊCH VỤ CƯ DÂN (TẦNG 1) */}
                  <polygon points="260,480 500,530 740,480 740,425 500,475 260,425" fill="url(#podiumMallGrad)" stroke="#334155" strokeWidth="1.5" />
                  <polygon points="280,465 500,512 720,465 720,438 500,485 280,438" fill="#0EA5E9" fillOpacity="0.25" stroke="#38BDF8" strokeWidth="1" />
                  <text x="500" y="475" fill="#E2E8F0" fontSize="10.5" fontFamily="sans-serif" textAnchor="middle" fontWeight="extrabold" letterSpacing="0.1em">
                    SẢNH ĐÓN TIẾP TÂN & KHU DỊCH VỤ CƯ DÂN (TẦNG 1)
                  </text>
                  <text x="500" y="492" fill="#94A3B8" fontSize="8" fontFamily="monospace" textAnchor="middle">
                    Sảnh Đón Cư Dân • Quầy Lễ Tân • Văn Phòng BQL Tòa Nhà • Lối Xuống Hầm Xe B1-B2
                  </text>
                </g>

                {/* 2. THÂN THÁP CHUNG CƯ SKYLINE (25 TẦNG VƯƠN CAO CHÍNH GIỮA) */}
                <g className="transition-all duration-300">
                  {/* Mặt Trái (Hướng Đông Nam) */}
                  <polygon points="340,425 500,475 500,85 340,40" fill="url(#skylineGlassL)" stroke="#222B35" strokeWidth="2" />
                  {/* Mặt Phải (Hướng Tây Nam) */}
                  <polygon points="500,475 660,425 660,40 500,85" fill="url(#skylineGlassR)" stroke="#334155" strokeWidth="2" />
                  {/* Mái Tháp (Sân Thượng) */}
                  <polygon points="340,40 500,85 660,40 500,5" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />

                  {/* Vòng vương miện kiến trúc trên đỉnh tháp */}
                  <ellipse cx="500" cy="45" rx="55" ry="18" fill="#0F172A" stroke="#C5A880" strokeWidth="1.5" />
                  <circle cx="500" cy="45" r="10" fill="none" stroke="#FDE68A" strokeWidth="1.2" />
                  <text x="500" y="49" fill="#FDE68A" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">H</text>

                  {/* Nhãn Đỉnh Tòa Nhà */}
                  <text x="500" y="24" fill="#C5A880" fontSize="13" fontWeight="bold" textAnchor="middle" fontFamily="serif">
                    CHUNG CƯ SKYLINE (25 TẦNG CĂN HỘ)
                  </text>

                  {/* CĂN 25PH-01: TẦNG 25 (Căn lớn Penthouse - Trống) */}
                  <g onClick={() => { setSelectedAptCode('25PH-01'); setSelectedFloor(25); }} className="cursor-pointer group">
                    <polygon 
                      points="350,110 490,148 490,118 350,82" 
                      fill={selectedAptCode === '25PH-01' ? '#F59E0B' : '#78350F'}
                      fillOpacity={selectedAptCode === '25PH-01' ? '0.95' : '0.55'}
                      stroke={selectedAptCode === '25PH-01' ? '#FDE68A' : '#F59E0B'}
                      strokeWidth={selectedAptCode === '25PH-01' ? '2.5' : '1'}
                      className="transition-all hover:fill-amber-500"
                    />
                    <text x="420" y="117" fill="#FEF3C7" fontSize="8.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                      Căn 25PH-01 (Căn Lớn 215m²) • NHÀ TRỐNG
                    </text>
                  </g>

                  {/* CĂN 18A01: TẦNG 18 (3PN 112m² - Trống) */}
                  <g onClick={() => { setSelectedAptCode('18A01'); setSelectedFloor(18); }} className="cursor-pointer group">
                    <polygon 
                      points="350,195 490,233 490,205 350,168" 
                      fill={selectedAptCode === '18A01' ? '#F59E0B' : '#78350F'}
                      fillOpacity={selectedAptCode === '18A01' ? '0.95' : '0.5'}
                      stroke={selectedAptCode === '18A01' ? '#FDE68A' : '#F59E0B'}
                      strokeWidth={selectedAptCode === '18A01' ? '2.5' : '1'}
                      className="transition-all hover:fill-amber-500"
                    />
                    <text x="420" y="204" fill="#FEF3C7" fontSize="8.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                      Căn 18A01 (3PN 112m²) • NHÀ TRỐNG
                    </text>
                  </g>

                  {/* CĂN 12A05: TẦNG 12 (CĂN CHỦ NHÀ NGUYỄN HỮU LỰC - THỰC TẾ ĐANG Ở) */}
                  <g onClick={() => { setSelectedAptCode('12A05'); setSelectedFloor(12); }} className="cursor-pointer group">
                    <polygon 
                      points="350,280 490,318 490,285 350,248" 
                      fill={selectedAptCode === '12A05' ? '#059669' : '#065F46'}
                      fillOpacity={selectedAptCode === '12A05' ? '1' : '0.85'}
                      stroke={selectedAptCode === '12A05' ? '#A7F3D0' : '#10B981'}
                      strokeWidth={selectedAptCode === '12A05' ? '3' : '1.8'}
                      className="transition-all hover:fill-emerald-500 shadow-2xl"
                    />
                    {/* Laser chỉ dẫn sang bảng chú thích chủ hộ */}
                    <line x1="350" y1="265" x2="220" y2="265" stroke="#10B981" strokeWidth="2" />
                    <circle cx="215" cy="265" r="4" fill="#10B981" />
                    
                    {/* Bảng chú thích căn 12A05 bên trái */}
                    <rect x="30" y="244" width="180" height="42" fill="#064E3B" fillOpacity="0.9" stroke="#34D399" strokeWidth="1.5" />
                    <text x="120" y="259" fill="#FFFFFF" fontSize="9" fontWeight="900" textAnchor="middle" fontFamily="monospace">
                      ★ CĂN 12A05 • ĐÃ CÓ NGƯỜI Ở
                    </text>
                    <text x="120" y="274" fill="#D1FAE5" fontSize="8" fontWeight="bold" textAnchor="middle">
                      Chủ Hộ: Nguyễn Hữu Lực (2PN 78.5m²)
                    </text>

                    <text x="420" y="287" fill="#FFFFFF" fontSize="9.5" fontWeight="900" textAnchor="middle" fontFamily="monospace">
                      ★ Căn 12A05 • ĐÃ Ở
                    </text>
                    <text x="420" y="302" fill="#D1FAE5" fontSize="8" fontWeight="bold" textAnchor="middle">
                      Nguyễn Hữu Lực (Tầng 12)
                    </text>
                  </g>

                  {/* CĂN 10A03: TẦNG 10 (2PN 75m² - Trống) */}
                  <g onClick={() => { setSelectedAptCode('10A03'); setSelectedFloor(10); }} className="cursor-pointer group">
                    <polygon 
                      points="510,328 650,290 650,260 510,298" 
                      fill={selectedAptCode === '10A03' ? '#F59E0B' : '#78350F'}
                      fillOpacity={selectedAptCode === '10A03' ? '0.95' : '0.5'}
                      stroke={selectedAptCode === '10A03' ? '#FDE68A' : '#F59E0B'}
                      strokeWidth={selectedAptCode === '10A03' ? '2.5' : '1'}
                      className="transition-all hover:fill-amber-500"
                    />
                    <text x="580" y="295" fill="#FEF3C7" fontSize="8.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                      Căn 10A03 (2PN 75m²) • NHÀ TRỐNG
                    </text>
                  </g>

                  {/* CĂN 05A02: TẦNG 5 (1PN 52m² - Trống) */}
                  <g onClick={() => { setSelectedAptCode('05A02'); setSelectedFloor(5); }} className="cursor-pointer group">
                    <polygon 
                      points="350,370 490,408 490,380 350,342" 
                      fill={selectedAptCode === '05A02' ? '#F59E0B' : '#78350F'}
                      fillOpacity={selectedAptCode === '05A02' ? '0.95' : '0.45'}
                      stroke={selectedAptCode === '05A02' ? '#FDE68A' : '#F59E0B'}
                      strokeWidth={selectedAptCode === '05A02' ? '2.5' : '1'}
                      className="transition-all hover:fill-amber-500"
                    />
                    <text x="420" y="380" fill="#FEF3C7" fontSize="8.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                      Căn 05A02 (1PN 52m²) • NHÀ TRỐNG
                    </text>
                  </g>
                </g>

                {/* Hướng dẫn tương tác */}
                <rect x="20" y="20" width="220" height="34" fill="#0D1117" fillOpacity="0.85" stroke="#222B35" strokeWidth="1" />
                <text x="30" y="35" fill="#C5A880" fontSize="9" fontWeight="bold" fontFamily="monospace">
                  MÔ HÌNH 3D CHUNG CƯ SKYLINE
                </text>
                <text x="30" y="47" fill="#94A3B8" fontSize="8" fontFamily="sans-serif">
                  Nhấp vào từng căn để xem chi tiết bên phải
                </text>
              </svg>
            </div>
          )}

          {/* ----------------------------------------------------------- */}
          {/* GÓC NHÌN 2: SƠ ĐỒ TOÀN CẢNH TÒA NHÀ THỰC TẾ THEO CÁC TẦNG   */}
          {/* ----------------------------------------------------------- */}
          {buildingPerspective === 'BUILDING_ELEVATION' && (
            <div className="p-4 bg-[#05070A] h-[640px] overflow-y-auto space-y-4">
              {/* Tiêu đề & hướng dẫn */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-[#121820] border border-[#222B35] text-xs">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-[#C5A880]" />
                  <span className="text-white font-bold font-serif">CHUNG CƯ SKYLINE (25 TẦNG CĂN HỘ)</span>
                  <span className="text-gray-400 font-mono text-[11px]">
                    • Tổng cộng {displayUnits.length} căn hộ trong hệ thống
                  </span>
                </div>

                <div className="text-[11px] text-[#C5A880] font-mono">
                  * Nhấp vào ô căn hộ để xem đầy đủ hồ sơ chi tiết bên phải
                </div>
              </div>

              {/* KHỐI HIỂN THỊ CÁC TẦNG CỦA CHUNG CƯ SKYLINE (1 TÒA DUY NHẤT) */}
              <div className="bg-[#0B0F17] border border-[#222B35] p-3 rounded-none flex flex-col space-y-3">
                {/* Tầng Mái Sân Thượng */}
                <div className="p-2.5 bg-[#121822] border border-[#1E293B] text-[11px] text-gray-300 font-mono text-center flex items-center justify-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
                  <span className="font-bold">TẦNG MÁI • SÂN THƯỢNG & KHU KỸ THUẬT TÒA NHÀ SKYLINE</span>
                </div>

                {/* Danh sách các tầng từ cao xuống thấp */}
                <div className="space-y-2.5">
                  {buildingFloors.map(floor => {
                    const unitsOnFloor = displayUnits.filter(u => u.floor === floor);
                    const isFloor12 = floor === 12;

                    return (
                      <div 
                        key={`Floor-${floor}`} 
                        className={`p-2.5 bg-[#0E141E] border transition-colors space-y-2 ${
                          isFloor12 ? 'border-[#10B981]/60 bg-[#064E3B]/10' : 'border-[#1F2937] hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-white font-bold flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-[#C5A880]" />
                            TẦNG {floor} {isFloor12 ? '★ (Căn 12A05 - Nguyễn Hữu Lực)' : ''}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedFloor(floor);
                              setBuildingPerspective('FLOOR_PLAN');
                            }}
                            className="text-[10.5px] text-[#C5A880] hover:text-white hover:underline flex items-center gap-1 font-semibold"
                          >
                            Xem mặt bằng tầng ➜
                          </button>
                        </div>

                        {/* Dãy các căn hộ trên tầng này */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {unitsOnFloor.map(unit => {
                            const isSelected = selectedAptCode === unit.code;
                            const isMatchedFilter = filteredUnits.some(f => f.code === unit.code);

                            return (
                              <div
                                key={unit.code}
                                onClick={() => setSelectedAptCode(unit.code)}
                                className={`p-2 border transition-all cursor-pointer select-none relative ${
                                  isSelected
                                    ? 'bg-[#1C2533] border-[#C5A880] ring-1 ring-[#C5A880] shadow-md z-10'
                                    : 'bg-[#141B26] border-[#222E3E] hover:border-gray-500'
                                } ${!isMatchedFilter ? 'opacity-30' : 'opacity-100'}`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold font-mono text-white">
                                    {unit.code}
                                  </span>
                                  <span
                                    className={`w-2 h-2 rounded-full ${
                                      unit.status === 'OCCUPIED'
                                        ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
                                        : unit.status === 'MAINTENANCE'
                                        ? 'bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.8)]'
                                        : 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]'
                                    }`}
                                    title={
                                      unit.status === 'OCCUPIED'
                                        ? 'Đã có người ở'
                                        : unit.status === 'MAINTENANCE'
                                        ? 'Đang nghiệm thu'
                                        : 'Chưa có người ở'
                                    }
                                  />
                                </div>

                                <div className="text-[10px] text-gray-400 mt-0.5 truncate">
                                  {unit.typeLabel.split('-')[0].trim()} • {unit.area}m²
                                </div>

                                <div className="text-[9.5px] font-semibold mt-1 truncate">
                                  {unit.status === 'OCCUPIED' ? (
                                    <span className="text-emerald-300 font-bold">
                                      {unit.owner?.name || 'Đã có cư dân'}
                                    </span>
                                  ) : unit.status === 'MAINTENANCE' ? (
                                    <span className="text-blue-300">Nghiệm thu</span>
                                  ) : (
                                    <span className="text-amber-300/80">Nhà trống</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Tầng 1 - Sảnh chính */}
                <div className="p-3 bg-[#121820] border border-[#222B35] text-[11px] font-mono text-center text-gray-300">
                  TẦNG 1: SẢNH ĐÓN CƯ DÂN • QUẦY LỄ TÂN • VĂN PHÒNG BAN QUẢN LÝ • LỐI XUỐNG HẦM XE B1-B2
                </div>
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------- */}
          {/* GÓC NHÌN 3: SƠ ĐỒ MẶT BẰNG TẦNG THỰC TẾ (FLOOR PLAN)        */}
          {/* ----------------------------------------------------------- */}
          {buildingPerspective === 'FLOOR_PLAN' && (
            <div className="p-4 sm:p-5 bg-[#05070A] h-[640px] overflow-y-auto space-y-4">
              
              {/* Bộ điều khiển Tầng */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#121820] border border-[#222B35] text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="text-gray-300 font-mono font-semibold flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#C5A880]" /> Chọn Tầng:
                  </span>
                  <select
                    value={selectedFloor}
                    onChange={(e) => setSelectedFloor(Number(e.target.value))}
                    className="bg-[#161B22] border border-[#2D3748] px-3 py-1.5 text-white font-mono text-xs outline-none focus:border-[#C5A880]"
                  >
                    {[25, 22, 20, 19, 18, 16, 15, 12, 11, 10, 8, 5, 4].map(f => (
                      <option key={f} value={f}>
                        Tầng {f} {f === 12 ? '(Có căn 12A05 ★)' : f === 25 ? '(Căn lớn Penthouse)' : ''}
                      </option>
                    ))}
                  </select>

                  {selectedFloor !== 12 && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFloor(12);
                        setSelectedAptCode('12A05');
                      }}
                      className="px-2.5 py-1 bg-[#162B22] hover:bg-[#1E3B2F] text-emerald-300 border border-emerald-600/60 font-semibold text-xs transition-colors"
                    >
                      ★ Nhảy tới Tầng 12 (Căn 12A05)
                    </button>
                  )}
                </div>

                <div className="text-xs text-gray-400 font-mono">
                  Bố trí chuẩn: 8 căn hộ / tầng
                </div>
              </div>

              {/* Thông báo gợi ý chuyển tầng nhanh nếu căn đang chọn không nằm ở tầng hiện tại */}
              {activeUnit && activeUnit.floor !== selectedFloor && (
                <div className="p-2.5 bg-[#C5A880]/10 border border-[#C5A880]/40 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-amber-200">
                    <Sparkles className="w-4 h-4 text-[#C5A880] shrink-0" />
                    <span>
                      Bạn đang xem hồ sơ căn <strong className="text-white font-mono">{activeUnit.code}</strong> (Tầng {activeUnit.floor}), nhưng sơ đồ đang hiển thị Tầng {selectedFloor}.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedFloor(activeUnit.floor)}
                    className="px-2.5 py-1 bg-[#C5A880] hover:bg-[#d8bb93] text-[#0D1117] font-bold text-[11px] shrink-0 transition-colors"
                  >
                    Chuyển Tới Tầng {activeUnit.floor} →
                  </button>
                </div>
              )}

              {/* BẢN VẼ MẶT BẰNG SÀN KIẾN TRÚC TẦNG THỰC TẾ (SVG FLOOR PLATE) */}
              <div className="relative w-full bg-[#090D14] border border-[#222B35] p-3 flex flex-col items-center">
                <div className="text-[11px] font-mono text-[#C5A880] mb-2 self-start flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5" /> SƠ ĐỒ MẶT BẰNG SÀN TẦNG {selectedFloor} • CHUNG CƯ SKYLINE (BỐ TRÍ 8 CĂN HỘ / TẦNG)
                </div>

                <svg viewBox="0 0 800 360" className="w-full max-w-[760px] drop-shadow-lg">
                  {/* Đường bao sàn tầng */}
                  <rect x="20" y="20" width="760" height="320" fill="#0C121D" stroke="#1E293B" strokeWidth="2" />
                  
                  {/* KHU THANG MÁY & THANG BỘ TRUNG TÂM */}
                  <rect x="290" y="90" width="220" height="180" fill="#16202E" stroke="#334155" strokeWidth="1.5" />
                  <text x="400" y="115" fill="#E2E8F0" fontSize="10" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                    KHU THANG MÁY & THANG BỘ
                  </text>

                  {/* 4 Thang Máy Khách */}
                  <rect x="310" y="130" width="40" height="40" fill="#0F172A" stroke="#38BDF8" strokeWidth="1" />
                  <text x="330" y="153" fill="#38BDF8" fontSize="8" textAnchor="middle" fontFamily="monospace">THANG 1</text>

                  <rect x="355" y="130" width="40" height="40" fill="#0F172A" stroke="#38BDF8" strokeWidth="1" />
                  <text x="375" y="153" fill="#38BDF8" fontSize="8" textAnchor="middle" fontFamily="monospace">THANG 2</text>

                  <rect x="405" y="130" width="40" height="40" fill="#0F172A" stroke="#38BDF8" strokeWidth="1" />
                  <text x="425" y="153" fill="#38BDF8" fontSize="8" textAnchor="middle" fontFamily="monospace">THANG 3</text>

                  <rect x="450" y="130" width="40" height="40" fill="#0F172A" stroke="#38BDF8" strokeWidth="1" />
                  <text x="470" y="153" fill="#38BDF8" fontSize="8" textAnchor="middle" fontFamily="monospace">THANG 4</text>

                  {/* Thang Hàng & PCCC */}
                  <rect x="340" y="180" width="120" height="30" fill="#1E293B" stroke="#F59E0B" strokeWidth="1" />
                  <text x="400" y="198" fill="#FDE68A" fontSize="8.5" textAnchor="middle" fontFamily="monospace">THANG HÀNG & PCCC</text>

                  {/* 2 Buồng Thang Thoát Hiểm */}
                  <rect x="300" y="220" width="90" height="35" fill="#0F172A" stroke="#10B981" strokeWidth="1" />
                  <text x="345" y="241" fill="#10B981" fontSize="7.5" textAnchor="middle" fontFamily="monospace">THOÁT HIỂM 1</text>

                  <rect x="410" y="220" width="90" height="35" fill="#0F172A" stroke="#10B981" strokeWidth="1" />
                  <text x="455" y="241" fill="#10B981" fontSize="7.5" textAnchor="middle" fontFamily="monospace">THOÁT HIỂM 2</text>

                  {/* Hành lang thông thoáng tiêu chuẩn */}
                  <rect x="150" y="90" width="130" height="180" fill="#0B1017" stroke="#1E293B" strokeDasharray="3 3" />
                  <rect x="520" y="90" width="130" height="180" fill="#0B1017" stroke="#1E293B" strokeDasharray="3 3" />
                  <text x="215" y="185" fill="#475569" fontSize="9" textAnchor="middle" fontFamily="monospace">HÀNH LANG TÂY</text>
                  <text x="585" y="185" fill="#475569" fontSize="9" textAnchor="middle" fontFamily="monospace">HÀNH LANG ĐÔNG</text>

                  {/* CÁC CĂN HỘ PHÂN BỔ TRÊN TẦNG */}
                  {(() => {
                    const getFloorUnitMeta = (numStr: string) => {
                      // Nếu là tầng 12 căn số 5 thì chính là 12A05
                      const targetCode = (selectedFloor === 12 && numStr === '05') ? '12A05' : `${selectedFloor > 9 ? selectedFloor : '0' + selectedFloor}${numStr}`;
                      const found = apartments.find(u => 
                        u.code.toLowerCase() === targetCode.toLowerCase() ||
                        u.code.toLowerCase() === `${selectedFloor}A${numStr}`.toLowerCase() ||
                        u.code.toLowerCase() === `${selectedFloor}B${numStr}`.toLowerCase()
                      );
                      const isOccupied = found?.status === 'OCCUPIED';
                      const codeToUse = found?.code || targetCode;
                      const isSelected = selectedAptCode === codeToUse;
                      const ownerName = found?.owner?.name || '';
                      return { code: codeToUse, found, isOccupied, isSelected, ownerName };
                    };
                    const u01 = getFloorUnitMeta('01');
                    const u02 = getFloorUnitMeta('02');
                    const u03 = getFloorUnitMeta('03');
                    const u04 = getFloorUnitMeta('04');
                    const u05 = getFloorUnitMeta('05');
                    const u06 = getFloorUnitMeta('06');
                    const u07 = getFloorUnitMeta('07');
                    const u08 = getFloorUnitMeta('08');

                    return (
                      <>
                        {/* Căn 01 */}
                        <g onClick={() => setSelectedAptCode(u01.code)} className="cursor-pointer">
                          <rect 
                            x="30" y="30" width="110" height="140" 
                            fill={u01.isOccupied ? (u01.isSelected ? '#065F46' : '#044332') : (u01.isSelected ? '#78350F' : '#141D2B')} 
                            stroke={u01.isOccupied ? '#10B981' : (u01.isSelected ? '#F59E0B' : '#334155')} 
                            strokeWidth={u01.isSelected ? '2.5' : '1.5'} 
                          />
                          <text x="85" y="70" fill="#FFFFFF" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">Căn {u01.code}</text>
                          <text x="85" y="86" fill={u01.isOccupied ? '#A7F3D0' : '#94A3B8'} fontSize="8" textAnchor="middle">3PN • 98m²</text>
                          <rect x="45" y="96" width="80" height="16" fill={u01.isOccupied ? '#10B981' : '#B45309'} />
                          <text x="85" y="108" fill={u01.isOccupied ? '#0D1117' : '#FFFFFF'} fontSize="7.5" fontWeight="bold" textAnchor="middle">
                            {u01.isOccupied ? 'CÓ CƯ DÂN' : 'NHÀ TRỐNG'}
                          </text>
                          <text x="85" y="128" fill={u01.isOccupied ? '#D1FAE5' : '#94A3B8'} fontSize="7.5" fontWeight="bold" textAnchor="middle">
                            {u01.isOccupied ? u01.ownerName : 'Chưa bàn giao'}
                          </text>
                        </g>

                        {/* Căn 02 */}
                        <g onClick={() => setSelectedAptCode(u02.code)} className="cursor-pointer">
                          <rect 
                            x="150" y="30" width="130" height="55" 
                            fill={u02.isOccupied ? (u02.isSelected ? '#065F46' : '#044332') : (u02.isSelected ? '#78350F' : '#141D2B')} 
                            stroke={u02.isOccupied ? '#10B981' : (u02.isSelected ? '#F59E0B' : '#334155')} 
                            strokeWidth={u02.isSelected ? '2.5' : '1.5'} 
                          />
                          <text x="215" y="52" fill="#FFFFFF" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">Căn {u02.code} (1PN • 52m²)</text>
                          <text x="215" y="68" fill={u02.isOccupied ? '#10B981' : '#F59E0B'} fontSize="7.5" fontWeight="bold" textAnchor="middle">
                            {u02.isOccupied ? `CÓ CƯ DÂN: ${u02.ownerName}` : 'NHÀ TRỐNG'}
                          </text>
                        </g>

                        {/* Căn 03 */}
                        <g onClick={() => setSelectedAptCode(u03.code)} className="cursor-pointer">
                          <rect 
                            x="290" y="30" width="220" height="55" 
                            fill={u03.isOccupied ? (u03.isSelected ? '#065F46' : '#044332') : (u03.isSelected ? '#78350F' : '#141D2B')} 
                            stroke={u03.isOccupied ? '#10B981' : (u03.isSelected ? '#F59E0B' : '#334155')} 
                            strokeWidth={u03.isSelected ? '2.5' : '1.5'} 
                          />
                          <text x="400" y="52" fill="#FFFFFF" fontSize="9.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">Căn {u03.code} (2PN • 75m²)</text>
                          <text x="400" y="68" fill={u02.isOccupied ? '#10B981' : '#F59E0B'} fontSize="7.5" fontWeight="bold" textAnchor="middle">
                            {u03.isOccupied ? `CÓ CƯ DÂN: ${u03.ownerName}` : 'NHÀ TRỐNG'}
                          </text>
                        </g>

                        {/* Căn 04 */}
                        <g onClick={() => setSelectedAptCode(u04.code)} className="cursor-pointer">
                          <rect 
                            x="520" y="30" width="130" height="55" 
                            fill={u04.isOccupied ? (u04.isSelected ? '#065F46' : '#044332') : (u04.isSelected ? '#78350F' : '#141D2B')} 
                            stroke={u04.isOccupied ? '#10B981' : (u04.isSelected ? '#F59E0B' : '#334155')} 
                            strokeWidth={u04.isSelected ? '2.5' : '1.5'} 
                          />
                          <text x="585" y="52" fill="#FFFFFF" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">Căn {u04.code} (3PN • 108m²)</text>
                          <text x="585" y="68" fill={u04.isOccupied ? '#10B981' : '#F59E0B'} fontSize="7.5" fontWeight="bold" textAnchor="middle">
                            {u04.isOccupied ? `CÓ CƯ DÂN: ${u04.ownerName}` : 'NHÀ TRỐNG'}
                          </text>
                        </g>

                        {/* Căn 05 (Căn 12A05 khi ở tầng 12) */}
                        <g onClick={() => setSelectedAptCode(u05.code)} className="cursor-pointer">
                          <rect 
                            x="660" 
                            y="180" 
                            width="110" 
                            height="150" 
                            fill={u05.isOccupied ? (u05.isSelected ? '#065F46' : '#044332') : (u05.isSelected ? '#78350F' : '#141D2B')} 
                            stroke={u05.isOccupied ? '#10B981' : (u05.isSelected ? '#F59E0B' : '#334155')} 
                            strokeWidth={u05.isSelected ? '2.5' : '1.5'} 
                            className="transition-all hover:opacity-90 shadow-xl"
                          />
                          <text x="715" y="212" fill="#FFFFFF" fontSize="10.5" fontWeight="900" textAnchor="middle" fontFamily="monospace">
                            CĂN {u05.code}
                          </text>
                          <text x="715" y="230" fill={u05.isOccupied ? '#A7F3D0' : '#94A3B8'} fontSize="8" fontWeight="bold" textAnchor="middle">
                            2PN - 2WC • 78.5m²
                          </text>
                          <rect x="675" y="244" width="80" height="17" fill={u05.isOccupied ? '#10B981' : '#B45309'} rx="0" />
                          <text x="715" y="256" fill={u05.isOccupied ? '#0D1117' : '#FFFFFF'} fontSize="7.5" fontWeight="bold" textAnchor="middle">
                            {u05.isOccupied ? 'CÓ CƯ DÂN' : 'NHÀ TRỐNG'}
                          </text>
                          <text x="715" y="280" fill={u05.isOccupied ? '#D1FAE5' : '#FCD34D'} fontSize="8" fontWeight="bold" textAnchor="middle">
                            {u05.isOccupied ? u05.ownerName : 'Chưa bàn giao'}
                          </text>
                        </g>

                        {/* Căn 06 */}
                        <g onClick={() => setSelectedAptCode(u06.code)} className="cursor-pointer">
                          <rect 
                            x="660" y="30" width="110" height="140" 
                            fill={u06.isOccupied ? (u06.isSelected ? '#065F46' : '#044332') : (u06.isSelected ? '#78350F' : '#141D2B')} 
                            stroke={u06.isOccupied ? '#10B981' : (u06.isSelected ? '#F59E0B' : '#334155')} 
                            strokeWidth={u06.isSelected ? '2.5' : '1.5'} 
                          />
                          <text x="715" y="75" fill="#FFFFFF" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">Căn {u06.code}</text>
                          <text x="715" y="92" fill={u06.isOccupied ? '#A7F3D0' : '#94A3B8'} fontSize="8" textAnchor="middle">2PN • 75m²</text>
                          <rect x="675" y="102" width="80" height="16" fill={u06.isOccupied ? '#10B981' : '#B45309'} />
                          <text x="715" y="114" fill={u06.isOccupied ? '#0D1117' : '#FFFFFF'} fontSize="7.5" fontWeight="bold" textAnchor="middle">
                            {u06.isOccupied ? 'CÓ CƯ DÂN' : 'NHÀ TRỐNG'}
                          </text>
                          <text x="715" y="132" fill={u06.isOccupied ? '#D1FAE5' : '#94A3B8'} fontSize="7.5" fontWeight="bold" textAnchor="middle">
                            {u06.isOccupied ? u06.ownerName : 'Chưa bàn giao'}
                          </text>
                        </g>

                        {/* Căn 07 */}
                        <g onClick={() => setSelectedAptCode(u07.code)} className="cursor-pointer">
                          <rect 
                            x="520" y="275" width="130" height="65" 
                            fill={u07.isOccupied ? (u07.isSelected ? '#065F46' : '#044332') : (u07.isSelected ? '#78350F' : '#141D2B')} 
                            stroke={u07.isOccupied ? '#10B981' : (u07.isSelected ? '#F59E0B' : '#334155')} 
                            strokeWidth={u07.isSelected ? '2.5' : '1.5'} 
                          />
                          <text x="585" y="300" fill="#FFFFFF" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">Căn {u07.code} (3PN • 112m²)</text>
                          <text x="585" y="318" fill={u07.isOccupied ? '#10B981' : '#F59E0B'} fontSize="7.5" fontWeight="bold" textAnchor="middle">
                            {u07.isOccupied ? `CÓ CƯ DÂN: ${u07.ownerName}` : 'NHÀ TRỐNG'}
                          </text>
                        </g>

                        {/* Căn 08 */}
                        <g onClick={() => setSelectedAptCode(u08.code)} className="cursor-pointer">
                          <rect 
                            x="30" y="180" width="110" height="150" 
                            fill={u08.isOccupied ? (u08.isSelected ? '#065F46' : '#044332') : (u08.isSelected ? '#78350F' : '#141D2B')} 
                            stroke={u08.isOccupied ? '#10B981' : (u08.isSelected ? '#F59E0B' : '#334155')} 
                            strokeWidth={u08.isSelected ? '2.5' : '1.5'} 
                          />
                          <text x="85" y="225" fill="#FFFFFF" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">Căn {u08.code}</text>
                          <text x="85" y="242" fill={u08.isOccupied ? '#A7F3D0' : '#94A3B8'} fontSize="8" textAnchor="middle">1PN • 52m²</text>
                          <rect x="45" y="254" width="80" height="16" fill={u08.isOccupied ? '#10B981' : '#B45309'} />
                          <text x="85" y="266" fill={u08.isOccupied ? '#0D1117' : '#FFFFFF'} fontSize="7.5" fontWeight="bold" textAnchor="middle">
                            {u08.isOccupied ? 'CÓ CƯ DÂN' : 'NHÀ TRỐNG'}
                          </text>
                          <text x="85" y="286" fill={u08.isOccupied ? '#D1FAE5' : '#94A3B8'} fontSize="7.5" fontWeight="bold" textAnchor="middle">
                            {u08.isOccupied ? u08.ownerName : 'Chưa bàn giao'}
                          </text>
                        </g>
                      </>
                    );
                  })()}
                </svg>
              </div>

              {/* Danh sách nhanh các căn trên tầng này */}
              <div className="space-y-2 pt-2">
                <div className="text-xs font-mono text-gray-400">
                  Danh mục căn hộ Tầng {selectedFloor} (Chung Cư Skyline):
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['01', '02', '03', '04', '05', '06', '07', '08'].map(num => {
                    const targetCode = (selectedFloor === 12 && num === '05') ? '12A05' : `${selectedFloor > 9 ? selectedFloor : '0' + selectedFloor}${num}`;
                    const found = apartments.find(u => 
                      u.code.toLowerCase() === targetCode.toLowerCase() ||
                      u.code.toLowerCase() === `${selectedFloor}A${num}`.toLowerCase() ||
                      u.code.toLowerCase() === `${selectedFloor}B${num}`.toLowerCase()
                    );
                    const isOccupied = found?.status === 'OCCUPIED';
                    const codeToUse = found?.code || targetCode;
                    const isSelected = selectedAptCode === codeToUse;
                    const ownerName = found?.owner?.name || '';

                    return (
                      <button
                        key={codeToUse}
                        type="button"
                        onClick={() => setSelectedAptCode(codeToUse)}
                        className={`p-2.5 rounded-none border text-left transition-all ${
                          isSelected
                            ? 'bg-[#1C2533] border-[#C5A880] ring-1 ring-[#C5A880]'
                            : 'bg-[#121820] border-[#222B35] hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-mono font-bold text-white">
                          <span>{codeToUse}</span>
                          <span className={`px-1.5 py-0.5 text-[9px] ${
                            isOccupied ? 'text-emerald-400 bg-emerald-950/80 border border-emerald-500' : 'text-amber-400 bg-amber-950/80 border border-amber-500'
                          }`}>
                            {isOccupied ? 'Đã Ở' : 'Trống'}
                          </span>
                        </div>
                        <div className="text-[10px] text-gray-400 mt-1 truncate">
                          {isOccupied ? ownerName || 'Đã có cư dân' : 'Sẵn sàng bàn giao'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------- */}
          {/* GÓC NHÌN 3: DANH SÁCH LƯỚI TẤT CẢ CĂN HỘ                    */}
          {/* ----------------------------------------------------------- */}
          {buildingPerspective === 'GRID' && (
            <div className="p-4 bg-[#05070A] h-[540px] sm:h-[600px] overflow-y-auto space-y-3">
              <div className="text-xs text-gray-400 font-mono mb-2 flex items-center justify-between">
                <span>Danh Sách Căn Hộ ({filteredUnits.length} căn phù hợp):</span>
                <span className="text-[11px] text-[#C5A880]">Nhấn vào từng ô để xem chi tiết bên phải</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {filteredUnits.map(unit => {
                  const isSelected = unit.code === selectedAptCode;
                  const isOccupied = unit.status === 'OCCUPIED';
                  const isMaint = unit.status === 'MAINTENANCE';

                  return (
                    <div
                      key={unit.code}
                      onClick={() => setSelectedAptCode(unit.code)}
                      className={`p-3 rounded-none border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#1C2533] border-[#C5A880] ring-1 ring-[#C5A880] shadow-xl'
                          : 'bg-[#121820] border-[#222B35] hover:border-gray-600'
                      }`}
                    >
                      <div>
                        <div className="font-serif text-base font-bold text-white flex items-center gap-2">
                          <span>Căn {unit.code}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-none bg-[#161B22] border border-gray-700 text-[#C5A880] font-sans">
                            {unit.typeLabel}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {unit.towerName} • Tầng {unit.floor} • {unit.area} m²
                        </div>
                        {isOccupied && unit.owner?.name && (
                          <div className="text-[11px] text-emerald-400 mt-1 font-medium truncate">
                            👤 {unit.owner.name}
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-none border ${
                          isOccupied
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                            : isMaint
                            ? 'bg-blue-950 text-blue-300 border-blue-500'
                            : 'bg-amber-950 text-amber-300 border-amber-500'
                        }`}>
                          {isOccupied ? 'Đã Có Người Ở' : isMaint ? 'Đang Nghiệm Thu' : 'Chưa Có Người Ở'}
                        </span>
                        <div className="text-[11px] font-mono text-[#C5A880] mt-1.5 font-bold">
                          {unit.priceBillion} tỷ VNĐ
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* CỘT PHẢI (5 COLS): THÔNG TIN CHI TIẾT CĂN HỘ (GỌN GÀNG, DỄ TƯƠNG TÁC) */}
        <div className="lg:col-span-5 bg-[#0D1117] border border-[#222B35] rounded-none p-4 shadow-2xl h-[540px] sm:h-[600px] flex flex-col justify-between overflow-hidden">
          
          {activeUnit ? (
            <div className="flex flex-col h-full justify-between">
              <div className="space-y-3 overflow-y-auto pr-1 no-scrollbar flex-1">
                {/* 1. Tiêu đề & Trạng thái căn */}
                <div className="border-b border-[#222B35] pb-2.5 flex items-start justify-between">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-[#C5A880] font-mono font-semibold">
                      {activeUnit.towerName} • TẦNG {activeUnit.floor}
                    </div>
                    <h3 className="font-serif text-xl sm:text-2xl font-bold text-white mt-0.5">
                      Căn Hộ {activeUnit.code}
                    </h3>
                  </div>

                  {/* Trạng thái thực tế */}
                  <span className={`px-2.5 py-1 text-[11px] font-bold uppercase rounded-none border inline-flex items-center gap-1.5 ${
                    activeUnit.status === 'OCCUPIED'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                      : activeUnit.status === 'MAINTENANCE'
                      ? 'bg-blue-950 text-blue-300 border-blue-500'
                      : 'bg-amber-950 text-amber-300 border-amber-500'
                  }`}>
                    {activeUnit.status === 'OCCUPIED' ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> ĐÃ CÓ NGƯỜI Ở
                      </>
                    ) : activeUnit.status === 'MAINTENANCE' ? (
                      <>
                        <Wrench className="w-3.5 h-3.5 text-blue-400" /> NGHIỆM THU
                      </>
                    ) : (
                      <>
                        <Key className="w-3.5 h-3.5 text-amber-400" /> NHÀ TRỐNG
                      </>
                    )}
                  </span>
                </div>

                {/* 2. Thanh 4 thông số chính nhanh gọn */}
                <div className="grid grid-cols-4 gap-1.5 p-2 bg-[#121820] border border-[#222B35] text-center font-mono">
                  <div className="p-1 bg-[#161B22]">
                    <div className="text-[9.5px] text-gray-400">Diện Tích</div>
                    <div className="text-xs font-bold text-white mt-0.5">{activeUnit.area} m²</div>
                  </div>
                  <div className="p-1 bg-[#161B22]">
                    <div className="text-[9.5px] text-gray-400">Phòng</div>
                    <div className="text-xs font-bold text-gray-200 mt-0.5">{activeUnit.bedrooms}PN - {activeUnit.bathrooms}WC</div>
                  </div>
                  <div className="p-1 bg-[#161B22]">
                    <div className="text-[9.5px] text-gray-400">Hướng Ban Công</div>
                    <div className="text-xs font-bold text-[#C5A880] mt-0.5">{activeUnit.direction || 'Đông Nam'}</div>
                  </div>
                  <div className="p-1 bg-[#161B22]">
                    <div className="text-[9.5px] text-gray-400">Giá CĐT</div>
                    <div className="text-xs font-bold text-emerald-400 mt-0.5">{activeUnit.priceBillion} tỷ</div>
                  </div>
                </div>

                {/* 3. Thanh chuyển Tab tinh gọn */}
                <div className="flex border-b border-[#222B35] text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setDetailTab('OVERVIEW')}
                    className={`pb-2 px-3 transition-colors border-b-2 ${
                      detailTab === 'OVERVIEW'
                        ? 'border-[#C5A880] text-[#C5A880]'
                        : 'border-transparent text-gray-400 hover:text-white'
                    }`}
                  >
                    {activeUnit.status === 'OCCUPIED' ? '👤 Chủ Hộ & Bàn Giao' : '🔑 Hiện Trạng Căn Hộ'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailTab('TECHNICAL')}
                    className={`pb-2 px-3 transition-colors border-b-2 ${
                      detailTab === 'TECHNICAL'
                        ? 'border-[#C5A880] text-[#C5A880]'
                        : 'border-transparent text-gray-400 hover:text-white'
                    }`}
                  >
                    ⚙️ Thông Số Kỹ Thuật & Phí
                  </button>
                </div>

                {/* 4. Nội dung Tab 1: Tổng quan cư dân / hiện trạng */}
                {detailTab === 'OVERVIEW' && (
                  <div className="space-y-2.5">
                    {activeUnit.status === 'OCCUPIED' && activeUnit.owner ? (
                      <>
                        {/* Chủ hộ súc tích */}
                        <div className="p-2.5 bg-[#121820] border border-[#222B35] flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={activeUnit.owner.avatar}
                              alt={activeUnit.owner.name}
                              className="w-10 h-10 rounded-none object-cover border border-[#C5A880] shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="font-bold text-white text-sm truncate">{activeUnit.owner.name}</div>
                              <div className="text-[11px] text-gray-300 font-mono flex items-center gap-2">
                                <span>📞 {activeUnit.owner.phone}</span>
                                <span>• CCCD: {activeUnit.owner.cccd}</span>
                              </div>
                            </div>
                          </div>
                          <span className="text-[9.5px] px-1.5 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-600 font-mono">
                            Đã Đối Chiếu ✓
                          </span>
                        </div>

                        {/* Tóm tắt bàn giao */}
                        <div className="p-2.5 bg-[#121820] border border-[#222B35] text-[11px] font-mono space-y-1">
                          <div className="flex items-center justify-between text-gray-400">
                            <span>Biên bản bàn giao:</span>
                            <strong className="text-[#C5A880]">BBBG-{activeUnit.code}</strong>
                          </div>
                          <div className="flex items-center justify-between text-gray-400">
                            <span>Chìa khóa & thẻ từ:</span>
                            <strong className="text-white">3 chìa khóa • 2 thẻ thang máy</strong>
                          </div>
                          <div className="flex items-center justify-between text-gray-400">
                            <span>Chỉ số khi nhận:</span>
                            <strong className="text-amber-400">⚡ 12.5 kWh • 💧 1.2 m³</strong>
                          </div>
                        </div>

                        {/* Nhân khẩu & xe gọn */}
                        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                          <div className="p-2 bg-[#121820] border border-[#222B35]">
                            <div className="text-gray-400 text-[10px]">Cùng Cư Trú:</div>
                            <div className="text-white font-bold mt-0.5">
                              {activeUnit.members?.length || activeUnit.membersCount || 0} người thân
                            </div>
                          </div>
                          <div className="p-2 bg-[#121820] border border-[#222B35]">
                            <div className="text-gray-400 text-[10px]">Xe Đăng Ký Gửi Hầm:</div>
                            <div className="text-emerald-400 font-bold mt-0.5 truncate">
                              {activeUnit.vehicles && activeUnit.vehicles.length > 0
                                ? activeUnit.vehicles.map(v => v.plate).join(', ')
                                : 'Chưa đăng ký'}
                            </div>
                          </div>
                        </div>
                      </>
                    ) : activeUnit.status === 'MAINTENANCE' ? (
                      <div className="p-3 bg-[#121820] border border-blue-500/40 space-y-2">
                        <div className="flex items-center gap-1.5 text-blue-400 font-bold text-xs font-mono">
                          <Wrench className="w-3.5 h-3.5" /> Căn Hộ Đang Nghiệm Thu Kỹ Thuật
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed">
                          Tổ kỹ thuật BQL đang kiểm tra điều hòa trung tâm, cửa sổ kính cách âm và van cấp nước. Tiến độ đạt 85%, sẵn sàng bàn giao trong 2 ngày.
                        </p>
                        <button
                          type="button"
                          onClick={() => setIsEditModalOpen(true)}
                          className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase transition-all"
                        >
                          Cập Nhật Tình Trạng
                        </button>
                      </div>
                    ) : (
                      <div className="p-3 bg-[#121820] border border-amber-500/40 space-y-2.5">
                        <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs font-mono">
                          <Key className="w-3.5 h-3.5" /> Căn Hộ Đang Trống (Chưa Có Người Ở)
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed">
                          Căn hộ đã hoàn tất nghiệm thu hoàn thiện xây dựng, an toàn điện nước và đầu phun chữa cháy PCCC đạt chuẩn an toàn. Sẵn sàng bàn giao cho cư dân mới.
                        </p>
                        <button
                          type="button"
                          onClick={() => setIsAssignModalOpen(true)}
                          className="w-full py-2.5 px-3 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow"
                        >
                          <Key className="w-4 h-4" /> Bàn Giao Căn Hộ & Cấp Tài Khoản
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* 5. Nội dung Tab 2: Thông số kỹ thuật & phí */}
                {detailTab === 'TECHNICAL' && (
                  <div className="p-3 bg-[#121820] border border-[#222B35] space-y-2 text-xs font-mono">
                    <div className="flex items-center justify-between pb-1.5 border-b border-[#222B35]">
                      <span className="text-gray-400">Diện tích thông thủy:</span>
                      <strong className="text-white">{activeUnit.area} m²</strong>
                    </div>
                    <div className="flex items-center justify-between pb-1.5 border-b border-[#222B35]">
                      <span className="text-gray-400">Diện tích tim tường:</span>
                      <strong className="text-white">{Math.round(activeUnit.area * 1.08)} m²</strong>
                    </div>
                    <div className="flex items-center justify-between pb-1.5 border-b border-[#222B35]">
                      <span className="text-gray-400">Phí quản lý tòa nhà:</span>
                      <strong className="text-amber-300">
                        {new Intl.NumberFormat('vi-VN').format(Math.round(activeUnit.area * 18000))} đ/tháng (18.000 đ/m²)
                      </strong>
                    </div>
                    <div className="flex items-center justify-between pb-1.5 border-b border-[#222B35]">
                      <span className="text-gray-400">Pháp lý sở hữu:</span>
                      <strong className="text-emerald-400">Sổ hồng lâu dài</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Đầu chờ thiết bị:</span>
                      <strong className="text-gray-200">Chuông hình & Báo khói PCCC</strong>
                    </div>
                  </div>
                )}
              </div>

              {/* 6. Chân thẻ: Nút hành động nhanh */}
              <div className="pt-2.5 border-t border-[#222B35] flex items-center gap-2 text-xs shrink-0">
                <button
                  type="button"
                  onClick={() => setIsDetailModalOpen(true)}
                  className="flex-1 py-2 px-3 bg-[#161B22] hover:bg-[#202936] text-gray-200 hover:text-white border border-[#2D3748] font-semibold transition-all flex items-center justify-center gap-1.5"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-[#C5A880]" /> Mặt Bằng
                </button>

                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="py-2 px-3 bg-[#161B22] hover:bg-[#202936] text-gray-200 hover:text-white border border-[#2D3748] font-semibold transition-all flex items-center justify-center gap-1.5"
                >
                  <Edit className="w-3.5 h-3.5" /> Sửa
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400 text-xs font-mono my-auto">
              Vui lòng chọn một căn hộ trên mô hình để xem thông tin chi tiết.
            </div>
          )}

        </div>
      </div>

      {/* ============================================================= */}
      {/* 5. CÁC MODAL QUẢN LÝ BQL TÍCH HỢP                           */}
      {/* ============================================================= */}
      {/* Modal Bàn Giao Cư Dân Mới */}
      {isAssignModalOpen && activeUnit && (
        <AssignResidentModal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          unit={activeUnit}
          onSuccess={() => {
            reloadApartments();
          }}
        />
      )}

      {/* Modal Chỉnh Sửa Thông Số Căn Hộ */}
      {isEditModalOpen && activeUnit && (
        <EditApartmentModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          unit={activeUnit}
          onSuccess={() => {
            reloadApartments();
          }}
        />
      )}

      {/* Modal Thêm Căn Hộ Mới */}
      {isAddModalOpen && (
        <AddApartmentModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={(newUnit) => {
            reloadApartments();
            setSelectedAptCode(newUnit.code);
          }}
        />
      )}

      {/* Modal Xem 3D Nội Thất & Chi Tiết */}
      {isDetailModalOpen && activeUnit && (
        <ApartmentDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          unit={activeUnit}
          onEditUnit={() => {
            setIsDetailModalOpen(false);
            setIsEditModalOpen(true);
          }}
          onAssignResident={() => {
            setIsDetailModalOpen(false);
            setIsAssignModalOpen(true);
          }}
          onRefresh={() => reloadApartments()}
        />
      )}
    </div>
  );
}
