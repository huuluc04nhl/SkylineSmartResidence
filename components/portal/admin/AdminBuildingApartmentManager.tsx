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

export type TowerFilter = 'ALL' | 'TOWER_A' | 'TOWER_B';
export type OccupancyFilter = 'ALL' | 'OCCUPIED' | 'VACANT' | 'MAINTENANCE';
export type ApartmentTypeFilter = 'ALL' | '1PN' | '2PN' | '3PN' | 'DUPLEX_PENTHOUSE';
export type FloorRangeFilter = 'ALL' | 'LOW' | 'MID' | 'HIGH';
export type ViewPerspective = 'BUILDING_ELEVATION' | 'FLOOR_PLAN' | 'GRID';

export default function AdminBuildingApartmentManager() {
  // 1. Quản lý danh sách căn hộ thực tế từ apartmentStore
  const [apartments, setApartments] = useState<ApartmentUnit[]>([]);
  const [selectedAptCode, setSelectedAptCode] = useState<string>('12A05');
  const [selectedTower, setSelectedTower] = useState<TowerFilter>('ALL');
  const [selectedOccupancy, setSelectedOccupancy] = useState<OccupancyFilter>('ALL');
  const [selectedType, setSelectedType] = useState<ApartmentTypeFilter>('ALL');
  const [selectedFloorRange, setSelectedFloorRange] = useState<FloorRangeFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [buildingPerspective, setBuildingPerspective] = useState<ViewPerspective>('BUILDING_ELEVATION');
  const [elevationTowerTab, setElevationTowerTab] = useState<'ALL' | 'A' | 'B'>('ALL');

  // Điều khiển Floor Plan View (Mặt Bằng Tầng)
  const [selectedFloorTower, setSelectedFloorTower] = useState<'A' | 'B'>('A');
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
  const activeOwnerName = ownerData?.fullname || ownerData?.full_name || 'Nguyễn Hữu Lực';
  const activeOwnerPhone = (activeOwnerName === 'Nguyễn Hữu Lực' || !ownerData?.phone || ownerData?.phone === '0901888999')
    ? '0364967082'
    : ownerData.phone;
  const activeOwnerEmail = (activeOwnerName === 'Nguyễn Hữu Lực' || !ownerData?.email || ownerData?.email?.includes('manager'))
    ? 'huuluc04@gmail.com'
    : ownerData.email;
  const activeOwnerCccd = (activeOwnerName === 'Nguyễn Hữu Lực' || !ownerData?.id_number)
    ? '067204000961'
    : (ownerData.id_number || ownerData.id_card_no || '067204000961');
  const activeOwnerAvatar = ownerData?.avatar_url || 'https://data.nks.vn/storage/users/202609021654232258.jpg';
  const activeOwnerDob = ownerData?.dob || '18/08/2004';
  const activeOwnerPob = ownerData?.pob || 'Triệu Trạch, Triệu Phong, Quảng Trị';

  // Danh sách căn hộ hiển thị, gộp thông tin thực tế cho 12A05
  const displayUnits = useMemo(() => {
    return apartments.map(u => {
      if (u.code === '12A05') {
        return {
          ...u,
          status: 'OCCUPIED' as const,
          statusLabel: 'Đang Sinh Sống',
          owner: {
            name: activeOwnerName,
            phone: activeOwnerPhone,
            email: activeOwnerEmail,
            cccd: activeOwnerCccd,
            avatar: activeOwnerAvatar,
            eKycApproved: true,
            handoverDate: '15/01/2026',
            dob: activeOwnerDob,
            pob: activeOwnerPob,
            handoverProtocol: u.owner?.handoverProtocol || u.handoverProtocol,
          } as ApartmentResidentOwner,
          handoverProtocol: u.owner?.handoverProtocol || u.handoverProtocol,
          membersCount: liveMembers.length > 0 ? liveMembers.length : 4,
          members: liveMembers.length > 0 ? liveMembers : u.members,
        };
      }
      return u;
    });
  }, [apartments, activeOwnerName, activeOwnerPhone, activeOwnerEmail, activeOwnerCccd, activeOwnerAvatar, activeOwnerDob, activeOwnerPob, liveMembers]);

  // Bộ lọc căn hộ đa tiêu chí & tìm kiếm thông minh
  const filteredUnits = useMemo(() => {
    return displayUnits.filter(unit => {
      const matchTower = selectedTower === 'ALL' 
        ? true 
        : selectedTower === 'TOWER_A' 
        ? unit.tower === 'A' 
        : unit.tower === 'B';

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
      if (!q) return matchTower && matchOccupancy && matchType && matchFloorRange;

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

      return matchTower && matchOccupancy && matchType && matchFloorRange && matchSearch;
    });
  }, [displayUnits, selectedTower, selectedOccupancy, selectedType, selectedFloorRange, searchQuery]);

  // Danh sách gợi ý tìm kiếm tức thì (Live Instant Search Dropdown)
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
    setSelectedFloorTower(unit.tower);
    setSelectedFloor(unit.floor);
    setIsSearchFocused(false);
  };

  const isAnyFilterActive = 
    selectedTower !== 'ALL' || 
    selectedOccupancy !== 'ALL' || 
    selectedType !== 'ALL' || 
    selectedFloorRange !== 'ALL' || 
    searchQuery.trim() !== '';

  const resetAllFilters = () => {
    setSelectedTower('ALL');
    setSelectedOccupancy('ALL');
    setSelectedType('ALL');
    setSelectedFloorRange('ALL');
    setSearchQuery('');
  };

  // Căn hộ đang được chọn làm tiêu điểm hồ sơ
  const activeUnit = displayUnits.find(u => u.code === selectedAptCode) || displayUnits[0] || null;

  // Thống kê toàn tổ hợp chung cư
  const totalUnitsCount = displayUnits.length;
  const occupiedCount = displayUnits.filter(u => u.status === 'OCCUPIED').length;
  const vacantCount = displayUnits.filter(u => u.status === 'VACANT').length;
  const maintenanceCount = displayUnits.filter(u => u.status === 'MAINTENANCE').length;
  const occupancyRate = totalUnitsCount > 0 ? Math.round((occupiedCount / totalUnitsCount) * 100) : 0;

  // Danh sách các căn hộ thuộc tầng đang chọn trong Floor Plan View
  const floorUnits = useMemo(() => {
    return displayUnits.filter(u => u.tower === selectedFloorTower && u.floor === selectedFloor);
  }, [displayUnits, selectedFloorTower, selectedFloor]);

  // Danh sách các tầng thực tế của Tòa A và Tòa B (sắp xếp giảm dần từ tầng cao nhất xuống)
  const towerAFloors = useMemo(() => {
    const floors = Array.from(new Set(displayUnits.filter(u => u.tower === 'A').map(u => u.floor)));
    return floors.sort((a, b) => b - a);
  }, [displayUnits]);

  const towerBFloors = useMemo(() => {
    const floors = Array.from(new Set(displayUnits.filter(u => u.tower === 'B').map(u => u.floor)));
    return floors.sort((a, b) => b - a);
  }, [displayUnits]);

  return (
    <div className="space-y-6 animate-fadeIn select-none">
      {/* ============================================================= */}
      {/* 1. TIÊU ĐỀ HỆ THỐNG QUẢN LÝ CĂN HỘ BQL                        */}
      {/* ============================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222B35] pb-4">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-[#C5A880] font-semibold flex items-center gap-1.5 font-mono">
            <Building className="w-3.5 h-3.5 text-[#C5A880]" /> HỆ THỐNG QUẢN LÝ TÒA NHÀ • BAN QUẢN LÝ SKYLINE
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl text-white font-bold mt-1">
            Quản Lý Căn Hộ & Cư Dân Chung Cư
          </h2>
          <p className="text-xs text-gray-400 mt-0.5 max-w-3xl">
            Sơ đồ thực tế Tòa A và Tòa B theo từng tầng. Theo dõi trực quan tình trạng căn hộ, chủ nhà, nhân khẩu, xe cộ và bàn giao thực tế (không có dữ liệu ảo).
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

          <div className="flex bg-[#121820] p-1 border border-[#222B35] rounded-none text-xs font-semibold">
            <button
              type="button"
              onClick={() => setBuildingPerspective('BUILDING_ELEVATION')}
              className={`px-3 py-1.5 rounded-none flex items-center gap-1.5 transition-all ${
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
              className={`px-3 py-1.5 rounded-none flex items-center gap-1.5 transition-all ${
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
              className={`px-3 py-1.5 rounded-none flex items-center gap-1.5 transition-all ${
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
          <div className="text-[11px] text-gray-400 mt-1">Bao gồm cả Tòa A và Tòa B</div>
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
            <span>Chưa Có Người Ở (Nhà Trống)</span>
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
      {/* 3. THANH CÔNG CỤ TÌM KIẾM & BỘ LỌC ĐA TIÊU CHÍ              */}
      {/* ============================================================= */}
      <div className="p-4 bg-[#121820] border border-[#222B35] rounded-none space-y-3 text-xs">
        {/* Hàng 1: Ô Tìm Kiếm Thông Minh & Bộ Đếm / Nút Reset */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Ô Tìm kiếm căn hộ có Instant Dropdown */}
          <div className="relative flex-1 max-w-2xl">
            <div className="relative">
              <Search className="w-4 h-4 text-[#C5A880] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 250)}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm theo mã căn (12A05, 12A01...), tên chủ nhà, số điện thoại, số căn cước, tầng..."
                className="w-full bg-[#161B22] border border-[#2D3748] pl-9 pr-8 py-2 rounded-none text-white text-xs placeholder:text-gray-500 outline-none focus:border-[#C5A880] transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-0.5"
                  title="Xóa tìm kiếm"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Instant Search Matches Dropdown */}
            {isSearchFocused && searchQuery.trim() !== '' && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#0F141C] border border-[#C5A880]/50 shadow-2xl z-50 divide-y divide-[#1F2937] max-h-72 overflow-y-auto">
                <div className="px-3 py-1.5 bg-[#161F2C] text-[10px] font-mono text-[#C5A880] uppercase tracking-wider flex items-center justify-between">
                  <span>Gợi Ý Trùng Khớp ({instantSearchMatches.length} căn hộ)</span>
                  <span className="text-gray-400">Bấm để chọn căn & chuyển tầng</span>
                </div>
                {instantSearchMatches.length === 0 ? (
                  <div className="p-4 text-center text-gray-400 text-xs">
                    Không tìm thấy căn hộ phù hợp với từ khóa &ldquo;{searchQuery}&rdquo;
                  </div>
                ) : (
                  instantSearchMatches.map(u => (
                    <div
                      key={u.code}
                      onMouseDown={() => handleSelectSearchResult(u)}
                      className={`p-2.5 hover:bg-[#1C2533] cursor-pointer flex items-center justify-between transition-colors ${
                        selectedAptCode === u.code ? 'bg-[#1C2533] border-l-2 border-[#C5A880]' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-bold text-white text-sm bg-[#161B22] px-2 py-0.5 border border-[#2D3748]">
                          {u.code}
                        </span>
                        <div>
                          <div className="text-white text-xs font-semibold flex items-center gap-1.5">
                            <span>{u.owner?.name ? u.owner.name : 'Nhà Trống (Chưa có người ở)'}</span>
                            {u.owner?.phone && (
                              <span className="text-[10px] text-gray-400 font-mono">({u.owner.phone})</span>
                            )}
                          </div>
                          <div className="text-[10px] text-gray-400">
                            Tòa {u.tower} • Tầng {u.floor} • {u.typeLabel} • Hướng ban công {u.direction}
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 font-mono ${
                          u.status === 'OCCUPIED'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                            : u.status === 'MAINTENANCE'
                            ? 'bg-blue-950 text-blue-300 border border-blue-800/60'
                            : 'bg-amber-950 text-amber-300 border border-amber-800/60'
                        }`}>
                          {u.status === 'OCCUPIED' ? 'Đã Có Người Ở' : u.status === 'MAINTENANCE' ? 'Nghiệm Thu' : 'Nhà Trống'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Bộ Đếm Kết Quả & Nút Reset */}
          <div className="flex items-center gap-3 self-end md:self-center">
            <div className="text-[11px] font-mono text-gray-300 bg-[#161B22] px-3 py-1.5 border border-[#2D3748] flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>Tìm thấy:</span>
              <strong className="text-[#C5A880] font-bold">{filteredUnits.length}</strong>
              <span className="text-gray-500">/ {displayUnits.length} căn</span>
            </div>

            {isAnyFilterActive && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2B1D1D] hover:bg-[#3D2525] text-rose-300 border border-rose-800/60 transition-colors font-semibold text-xs"
                title="Xóa toàn bộ các tiêu chí lọc để xem lại tất cả"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Đặt Lại Bộ Lọc</span>
              </button>
            )}
          </div>
        </div>

        {/* Hàng 2: Nhóm Lọc Tòa Nhà & Trạng Thái */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#1C2533]">
          <span className="text-gray-400 font-mono text-[11px] min-w-[70px]">Tòa Nhà:</span>
          {[
            { id: 'ALL', label: 'Tất Cả Tòa' },
            { id: 'TOWER_A', label: 'Tòa A' },
            { id: 'TOWER_B', label: 'Tòa B' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedTower(t.id as any)}
              className={`px-3 py-1 rounded-none font-semibold transition-all ${
                selectedTower === t.id
                  ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow'
                  : 'bg-[#161B22] text-gray-400 hover:text-white border border-[#2D3748]'
              }`}
            >
              {t.label}
            </button>
          ))}

          <div className="w-[1px] h-4 bg-[#222B35] mx-1 hidden sm:block"></div>

          <span className="text-gray-400 font-mono text-[11px] min-w-[70px]">Trạng Thái:</span>
          {[
            { id: 'ALL', label: 'Tất Cả' },
            { id: 'OCCUPIED', label: '🟢 Đã Có Người Ở' },
            { id: 'VACANT', label: '🟡 Chưa Có Người Ở' },
            { id: 'MAINTENANCE', label: '🔵 Đang Nghiệm Thu' }
          ].map(o => (
            <button
              key={o.id}
              onClick={() => setSelectedOccupancy(o.id as any)}
              className={`px-3 py-1 rounded-none font-semibold transition-all ${
                selectedOccupancy === o.id
                  ? 'bg-[#1C2533] text-[#C5A880] border border-[#C5A880] font-bold shadow'
                  : 'bg-[#161B22] text-gray-400 hover:text-white border border-[#2D3748]'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>

        {/* Hàng 3: Nhóm Lọc Loại Căn & Khoảng Tầng */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#1C2533]">
          <span className="text-gray-400 font-mono text-[11px] min-w-[70px]">Loại Căn:</span>
          {[
            { id: 'ALL', label: 'Tất Cả Loại Căn' },
            { id: '1PN', label: '1 Phòng Ngủ (1PN)' },
            { id: '2PN', label: '2 Phòng Ngủ (2PN)' },
            { id: '3PN', label: '3 Phòng Ngủ (3PN)' },
            { id: 'DUPLEX_PENTHOUSE', label: 'Căn Lớn / Thông Tầng' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedType(t.id as any)}
              className={`px-3 py-1 rounded-none font-semibold transition-all ${
                selectedType === t.id
                  ? 'bg-[#2A374A] text-sky-200 border border-sky-400 font-bold shadow'
                  : 'bg-[#161B22] text-gray-400 hover:text-white border border-[#2D3748]'
              }`}
            >
              {t.label}
            </button>
          ))}

          <div className="w-[1px] h-4 bg-[#222B35] mx-1 hidden sm:block"></div>

          <span className="text-gray-400 font-mono text-[11px] min-w-[70px]">Khoảng Tầng:</span>
          {[
            { id: 'ALL', label: 'Tất Cả Các Tầng' },
            { id: 'LOW', label: 'Tầng 1 - 10 (Tầng Thấp)' },
            { id: 'MID', label: 'Tầng 11 - 20 (Tầng Trung)' },
            { id: 'HIGH', label: 'Tầng 21 Trở Lên (Tầng Cao)' }
          ].map(r => (
            <button
              key={r.id}
              onClick={() => setSelectedFloorRange(r.id as any)}
              className={`px-3 py-1 rounded-none font-semibold transition-all ${
                selectedFloorRange === r.id
                  ? 'bg-[#2E281F] text-amber-200 border border-amber-500 font-bold shadow'
                  : 'bg-[#161B22] text-gray-400 hover:text-white border border-[#2D3748]'
              }`}
            >
              {r.label}
            </button>
          ))}
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
                {buildingPerspective === 'BUILDING_ELEVATION' && 'Sơ Đồ Tòa Nhà Thực Tế Theo Từng Tầng (Tòa A & Tòa B)'}
                {buildingPerspective === 'FLOOR_PLAN' && `Sơ Đồ Mặt Bằng Tầng: Tòa ${selectedFloorTower} • Tầng ${selectedFloor}`}
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
          {/* GÓC NHÌN 1: SƠ ĐỒ TOÀN CẢNH TÒA NHÀ THỰC TẾ THEO CÁC TẦNG   */}
          {/* ----------------------------------------------------------- */}
          {buildingPerspective === 'BUILDING_ELEVATION' && (
            <div className="p-4 bg-[#05070A] h-[640px] overflow-y-auto space-y-4">
              {/* Bộ điều khiển chọn tòa & hướng dẫn */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-[#121820] border border-[#222B35] text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 font-mono text-[11px]">Xem Tòa:</span>
                  {[
                    { id: 'ALL', label: 'Cả 2 Tòa (Tòa A & B)' },
                    { id: 'A', label: 'Chỉ Xem Tòa A' },
                    { id: 'B', label: 'Chỉ Xem Tòa B' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setElevationTowerTab(tab.id as any)}
                      className={`px-3 py-1 rounded-none font-bold transition-all ${
                        elevationTowerTab === tab.id
                          ? 'bg-[#C5A880] text-[#0D1117] shadow'
                          : 'bg-[#161B22] text-gray-400 hover:text-white border border-[#2D3748]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="text-[11px] text-[#C5A880] font-mono">
                  * Nhấp vào ô căn hộ để xem đầy đủ hồ sơ chi tiết bên phải
                </div>
              </div>

              {/* KHỐI HIỂN THỊ CÁC TÒA NHÀ THỰC TẾ */}
              <div className={`grid gap-4 ${elevationTowerTab === 'ALL' ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'}`}>
                
                {/* 1. TÒA A (32 TẦNG) */}
                {(elevationTowerTab === 'ALL' || elevationTowerTab === 'A') && (
                  <div className="bg-[#0B0F17] border border-[#222B35] p-3 rounded-none flex flex-col space-y-3">
                    {/* Đỉnh Tòa A */}
                    <div className="p-2.5 bg-gradient-to-r from-[#161F2C] to-[#0F1722] border-b-2 border-[#C5A880] flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold font-serif text-white flex items-center gap-1.5">
                          <Building className="w-4 h-4 text-[#C5A880]" />
                          <span>TÒA A (32 TẦNG)</span>
                        </div>
                        <div className="text-[10px] text-gray-400">
                          Mặt trước hướng Đông Nam • {displayUnits.filter(u => u.tower === 'A').length} căn hộ trong hệ thống
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 bg-[#161B22] border border-[#2D3748] text-[#C5A880] font-mono font-semibold">
                        Tầng 1 - 32
                      </span>
                    </div>

                    {/* Tầng Mái Sân Thượng Tòa A */}
                    <div className="p-2 bg-[#121822] border border-[#1E293B] text-[10.5px] text-gray-400 font-mono text-center flex items-center justify-center gap-2">
                      <Sparkles className="w-3 h-3 text-[#C5A880]" />
                      <span>TẦNG MÁI • SÂN THƯỢNG & KHU KỸ THUẬT TÒA NHÀ</span>
                    </div>

                    {/* Danh sách các tầng của Tòa A */}
                    <div className="space-y-2">
                      {towerAFloors.map(floor => {
                        const unitsOnFloor = displayUnits.filter(u => u.tower === 'A' && u.floor === floor);
                        return (
                          <div key={`A-F${floor}`} className="p-2 bg-[#0E141E] border border-[#1F2937] space-y-1.5 hover:border-gray-600 transition-colors">
                            <div className="flex items-center justify-between text-[11px] font-mono">
                              <span className="text-white font-bold flex items-center gap-1.5">
                                <Layers className="w-3 h-3 text-[#C5A880]" />
                                TẦNG {floor} {floor === 12 ? '★ (Có Căn 12A05)' : ''}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedFloorTower('A');
                                  setSelectedFloor(floor);
                                  setBuildingPerspective('FLOOR_PLAN');
                                }}
                                className="text-[10px] text-[#C5A880] hover:text-white hover:underline flex items-center gap-1"
                              >
                                Xem mặt bằng tầng ➜
                              </button>
                            </div>

                            {/* Dãy các căn hộ trên tầng này */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                              {unitsOnFloor.map(unit => {
                                const isSelected = selectedAptCode === unit.code;
                                const isMatchedFilter = filteredUnits.some(f => f.code === unit.code);

                                return (
                                  <div
                                    key={unit.code}
                                    onClick={() => setSelectedAptCode(unit.code)}
                                    className={`p-1.5 border transition-all cursor-pointer select-none relative ${
                                      isSelected
                                        ? 'bg-[#1C2533] border-[#C5A880] ring-1 ring-[#C5A880] shadow-md z-10'
                                        : 'bg-[#141B26] border-[#222E3E] hover:border-gray-500'
                                    } ${!isMatchedFilter ? 'opacity-30' : 'opacity-100'}`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="text-[11px] font-bold font-mono text-white">
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

                                    <div className="text-[9.5px] text-gray-400 mt-0.5 truncate">
                                      {unit.typeLabel.split('-')[0].trim()} • {unit.area}m²
                                    </div>

                                    <div className="text-[9px] font-semibold mt-1 truncate">
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

                    {/* Tầng 1 - Sảnh chính Tòa A */}
                    <div className="p-2.5 bg-[#121820] border border-[#222B35] text-[10.5px] font-mono text-center text-gray-300">
                      TẦNG 1: SẢNH ĐÓN CƯ DÂN • QUẦY LỄ TÂN • VĂN PHÒNG BQL • HẦM XE B1-B2
                    </div>
                  </div>
                )}

                {/* 2. TÒA B (32 TẦNG) */}
                {(elevationTowerTab === 'ALL' || elevationTowerTab === 'B') && (
                  <div className="bg-[#0B0F17] border border-[#222B35] p-3 rounded-none flex flex-col space-y-3">
                    {/* Đỉnh Tòa B */}
                    <div className="p-2.5 bg-gradient-to-r from-[#161F2C] to-[#0F1722] border-b-2 border-[#C5A880] flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold font-serif text-white flex items-center gap-1.5">
                          <Building className="w-4 h-4 text-[#C5A880]" />
                          <span>TÒA B (32 TẦNG)</span>
                        </div>
                        <div className="text-[10px] text-gray-400">
                          Mặt trước hướng Tây Nam • {displayUnits.filter(u => u.tower === 'B').length} căn hộ trong hệ thống
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 bg-[#161B22] border border-[#2D3748] text-[#C5A880] font-mono font-semibold">
                        Tầng 1 - 32
                      </span>
                    </div>

                    {/* Tầng Mái Sân Thượng Tòa B */}
                    <div className="p-2 bg-[#121822] border border-[#1E293B] text-[10.5px] text-gray-400 font-mono text-center flex items-center justify-center gap-2">
                      <Sparkles className="w-3 h-3 text-[#C5A880]" />
                      <span>TẦNG MÁI • SÂN THƯỢNG & KHU KỸ THUẬT TÒA NHÀ</span>
                    </div>

                    {/* Danh sách các tầng của Tòa B */}
                    <div className="space-y-2">
                      {towerBFloors.map(floor => {
                        const unitsOnFloor = displayUnits.filter(u => u.tower === 'B' && u.floor === floor);
                        return (
                          <div key={`B-F${floor}`} className="p-2 bg-[#0E141E] border border-[#1F2937] space-y-1.5 hover:border-gray-600 transition-colors">
                            <div className="flex items-center justify-between text-[11px] font-mono">
                              <span className="text-white font-bold flex items-center gap-1.5">
                                <Layers className="w-3 h-3 text-[#C5A880]" />
                                TẦNG {floor}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedFloorTower('B');
                                  setSelectedFloor(floor);
                                  setBuildingPerspective('FLOOR_PLAN');
                                }}
                                className="text-[10px] text-[#C5A880] hover:text-white hover:underline flex items-center gap-1"
                              >
                                Xem mặt bằng tầng ➜
                              </button>
                            </div>

                            {/* Dãy các căn hộ trên tầng này */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                              {unitsOnFloor.map(unit => {
                                const isSelected = selectedAptCode === unit.code;
                                const isMatchedFilter = filteredUnits.some(f => f.code === unit.code);

                                return (
                                  <div
                                    key={unit.code}
                                    onClick={() => setSelectedAptCode(unit.code)}
                                    className={`p-1.5 border transition-all cursor-pointer select-none relative ${
                                      isSelected
                                        ? 'bg-[#1C2533] border-[#C5A880] ring-1 ring-[#C5A880] shadow-md z-10'
                                        : 'bg-[#141B26] border-[#222E3E] hover:border-gray-500'
                                    } ${!isMatchedFilter ? 'opacity-30' : 'opacity-100'}`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="text-[11px] font-bold font-mono text-white">
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

                                    <div className="text-[9.5px] text-gray-400 mt-0.5 truncate">
                                      {unit.typeLabel.split('-')[0].trim()} • {unit.area}m²
                                    </div>

                                    <div className="text-[9px] font-semibold mt-1 truncate">
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

                    {/* Tầng 1 - Sảnh chính Tòa B */}
                    <div className="p-2.5 bg-[#121820] border border-[#222B35] text-[10.5px] font-mono text-center text-gray-300">
                      TẦNG 1: SẢNH ĐÓN CƯ DÂN • QUẦY LỄ TÂN • VĂN PHÒNG BQL • HẦM XE B1-B2
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------- */}
          {/* GÓC NHÌN 2: SƠ ĐỒ MẶT BẰNG TẦNG THỰC TẾ (FLOOR PLAN)        */}
          {/* ----------------------------------------------------------- */}
          {buildingPerspective === 'FLOOR_PLAN' && (
            <div className="p-4 sm:p-5 bg-[#05070A] h-[640px] overflow-y-auto space-y-4">
              
              {/* Bộ điều khiển Tòa & Tầng */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#121820] border border-[#222B35] text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 font-mono">Chọn Tòa:</span>
                  <button
                    type="button"
                    onClick={() => setSelectedFloorTower('A')}
                    className={`px-3 py-1 rounded-none font-bold ${
                      selectedFloorTower === 'A' ? 'bg-[#C5A880] text-[#0D1117]' : 'bg-[#161B22] text-gray-400'
                    }`}
                  >
                    Tòa A
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedFloorTower('B')}
                    className={`px-3 py-1 rounded-none font-bold ${
                      selectedFloorTower === 'B' ? 'bg-[#C5A880] text-[#0D1117]' : 'bg-[#161B22] text-gray-400'
                    }`}
                  >
                    Tòa B
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-gray-400 font-mono">Chọn Tầng:</span>
                  <select
                    value={selectedFloor}
                    onChange={(e) => setSelectedFloor(Number(e.target.value))}
                    className="bg-[#161B22] border border-[#2D3748] px-2.5 py-1 text-white font-mono text-xs outline-none"
                  >
                    {[4, 5, 8, 10, 11, 12, 15, 16, 18, 19, 20, 22, 25].map(f => (
                      <option key={f} value={f}>
                        Tầng {f} {f === 12 ? '(Có căn 12A05 ★)' : f === 25 ? '(Căn lớn / Thông tầng)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Thông báo gợi ý chuyển tầng nhanh nếu căn đang chọn không nằm ở tầng hiện tại */}
              {activeUnit && (activeUnit.tower !== selectedFloorTower || activeUnit.floor !== selectedFloor) && (
                <div className="p-2.5 bg-[#C5A880]/10 border border-[#C5A880]/40 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-amber-200">
                    <Sparkles className="w-4 h-4 text-[#C5A880] shrink-0" />
                    <span>
                      Bạn đang chọn xem hồ sơ căn <strong className="text-white font-mono">{activeUnit.code}</strong> (Tòa {activeUnit.tower} • Tầng {activeUnit.floor}), nhưng sơ đồ mặt bằng đang hiển thị Tòa {selectedFloorTower} • Tầng {selectedFloor}.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFloorTower(activeUnit.tower);
                      setSelectedFloor(activeUnit.floor);
                    }}
                    className="px-2.5 py-1 bg-[#C5A880] hover:bg-[#d8bb93] text-[#0D1117] font-bold text-[11px] shrink-0 transition-colors"
                  >
                    Chuyển Tới Tầng {activeUnit.floor} (Tòa {activeUnit.tower}) →
                  </button>
                </div>
              )}

              {/* BẢN VẼ MẶT BẰNG SÀN KIẾN TRÚC TẦNG THỰC TẾ (SVG FLOOR PLATE) */}
              <div className="relative w-full bg-[#090D14] border border-[#222B35] p-3 flex flex-col items-center">
                <div className="text-[11px] font-mono text-[#C5A880] mb-2 self-start flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5" /> SƠ ĐỒ MẶT BẰNG SÀN TẦNG {selectedFloor} • TÒA {selectedFloorTower} (BỐ TRÍ 8 CĂN HỘ / TẦNG)
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

                  {/* Hành lang thông thoáng tiêu chuẩn 1.8m */}
                  <rect x="150" y="90" width="130" height="180" fill="#0B1017" stroke="#1E293B" strokeDasharray="3 3" />
                  <rect x="520" y="90" width="130" height="180" fill="#0B1017" stroke="#1E293B" strokeDasharray="3 3" />
                  <text x="215" y="185" fill="#475569" fontSize="9" textAnchor="middle" fontFamily="monospace">HÀNH LANG TÂY</text>
                  <text x="585" y="185" fill="#475569" fontSize="9" textAnchor="middle" fontFamily="monospace">HÀNH LANG ĐÔNG</text>

                  {/* CÁC CĂN HỘ PHÂN BỔ TRÊN TẦNG (ĐỒNG BỘ THEO TÒA VÀ TẦNG) */}
                  {(() => {
                    const getFloorUnitMeta = (numStr: string) => {
                      const code = `${selectedFloor}${selectedFloorTower}${numStr}`;
                      const found = apartments.find(u => u.code.toLowerCase() === code.toLowerCase());
                      const isOccupied = found?.status === 'OCCUPIED';
                      const isSelected = selectedAptCode === code;
                      const ownerName = found?.owner?.name || '';
                      return { code, found, isOccupied, isSelected, ownerName };
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
                          <text x="400" y="68" fill={u03.isOccupied ? '#10B981' : '#F59E0B'} fontSize="7.5" fontWeight="bold" textAnchor="middle">
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

                        {/* Căn 05 */}
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
                  Danh mục căn hộ Tầng {selectedFloor} - Tòa {selectedFloorTower}:
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['01', '02', '03', '04', '05', '06', '07', '08'].map(num => {
                    const code = `${selectedFloor}${selectedFloorTower}${num}`;
                    const found = apartments.find(u => u.code.toLowerCase() === code.toLowerCase());
                    const isOccupied = found?.status === 'OCCUPIED';
                    const isSelected = selectedAptCode === code;
                    const ownerName = found?.owner?.name || '';

                    return (
                      <button
                        key={code}
                        type="button"
                        onClick={() => setSelectedAptCode(code)}
                        className={`p-2.5 rounded-none border text-left transition-all ${
                          isSelected
                            ? 'bg-[#1C2533] border-[#C5A880] ring-1 ring-[#C5A880]'
                            : 'bg-[#121820] border-[#222B35] hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-mono font-bold text-white">
                          <span>{code}</span>
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

        {/* CỘT PHẢI (5 COLS): THÔNG TIN CHI TIẾT CĂN HỘ (HỒ SƠ THỰC TẾ) */}
        <div className="lg:col-span-5 bg-[#0D1117] border border-[#222B35] rounded-none p-5 space-y-4 shadow-2xl">
          
          {activeUnit ? (
            <>
              {/* Tiêu đề thẻ thông tin */}
              <div className="border-b border-[#222B35] pb-3.5 flex items-start justify-between">
                <div>
                  <div className="text-[10.5px] uppercase tracking-wider text-[#C5A880] font-mono font-semibold">
                    HỒ SƠ CĂN HỘ • {activeUnit.towerName} - TẦNG {activeUnit.floor}
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-white mt-0.5">
                    Căn Hộ {activeUnit.code}
                  </h3>
                  <div className="text-xs text-gray-400 mt-0.5">
                    Loại căn: <strong className="text-gray-200">{activeUnit.typeLabel}</strong> • Diện tích: <strong className="text-[#C5A880]">{activeUnit.area} m²</strong>
                  </div>
                </div>

                {/* Trạng thái thực tế rõ ràng */}
                <div className="text-right">
                  <span className={`px-3 py-1 text-xs font-extrabold uppercase rounded-none border shadow-lg inline-flex items-center gap-1.5 ${
                    activeUnit.status === 'OCCUPIED'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                      : activeUnit.status === 'MAINTENANCE'
                      ? 'bg-blue-950 text-blue-300 border-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.3)]'
                      : 'bg-amber-950 text-amber-300 border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                  }`}>
                    {activeUnit.status === 'OCCUPIED' ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> ĐÃ CÓ NGƯỜI Ở
                      </>
                    ) : activeUnit.status === 'MAINTENANCE' ? (
                      <>
                        <Wrench className="w-3.5 h-3.5 text-blue-400" /> ĐANG BẢO TRÌ / NGHIỆM THU
                      </>
                    ) : (
                      <>
                        <Key className="w-3.5 h-3.5 text-amber-400" /> CHƯA CÓ NGƯỜI Ở
                      </>
                    )}
                  </span>
                  <div className="text-[10.5px] text-gray-400 font-mono mt-1">
                    Giá CĐT: <strong className="text-white">{activeUnit.priceBillion} tỷ VNĐ</strong>
                  </div>
                </div>
              </div>

              {/* Thông số kỹ thuật căn hộ thực tế */}
              <div className="p-3 bg-[#121820] border border-[#222B35] rounded-none text-xs">
                <div className="text-[10.5px] uppercase tracking-wider text-[#C5A880] font-mono font-bold mb-2 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" /> Thông Số Kỹ Thuật Căn Hộ
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div>
                    <span className="text-gray-400">Diện tích thông thủy:</span>{' '}
                    <strong className="text-white">{activeUnit.area} m²</strong>
                  </div>
                  <div>
                    <span className="text-gray-400">Diện tích tim tường:</span>{' '}
                    <strong className="text-white">{Math.round(activeUnit.area * 1.08)} m²</strong>
                  </div>
                  <div>
                    <span className="text-gray-400">Bố trí phòng:</span>{' '}
                    <strong className="text-gray-200">{activeUnit.bedrooms} Phòng Ngủ • {activeUnit.bathrooms} Vệ Sinh</strong>
                  </div>
                  <div>
                    <span className="text-gray-400">Hướng ban công:</span>{' '}
                    <strong className="text-gray-200">{activeUnit.direction || 'Đông Nam'}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400">Pháp lý sở hữu:</span>{' '}
                    <strong className="text-emerald-400">Sổ hồng lâu dài</strong>
                  </div>
                  <div>
                    <span className="text-gray-400">Phí quản lý tòa nhà:</span>{' '}
                    <strong className="text-amber-300">
                      {new Intl.NumberFormat('vi-VN').format(Math.round(activeUnit.area * 18000))} đ/tháng
                    </strong>
                  </div>
                </div>
              </div>

              {/* ========================================================= */}
              {/* TRƯỜNG HỢP 1: CĂN HỘ ĐÃ CÓ NGƯỜI Ở (DỮ LIỆU THỰC TẾ)      */}
              {/* ========================================================= */}
              {activeUnit.status === 'OCCUPIED' && activeUnit.owner ? (
                <div className="space-y-3.5">
                  
                  {/* Thông tin chủ hộ thực tế */}
                  <div className="p-3.5 bg-[#121820] border border-[#222B35] rounded-none space-y-3">
                    <div className="text-[11px] uppercase tracking-wider text-emerald-400 font-bold font-mono flex items-center justify-between">
                      <span>Thông Tin Chủ Hộ</span>
                      <span className="px-2 py-0.5 text-[9.5px] bg-emerald-950 border border-emerald-600 rounded-none text-emerald-300">
                        Đã Đối Chiếu Căn Cước & Khuôn Mặt ✓
                      </span>
                    </div>

                    <div className="flex items-start gap-3.5">
                      <img
                        src={activeUnit.owner.avatar}
                        alt={activeUnit.owner.name}
                        className="w-14 h-14 rounded-none object-cover border-2 border-[#C5A880] shadow-md shrink-0"
                      />
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="font-serif text-lg font-bold text-white truncate">
                          {activeUnit.owner.name}
                        </div>
                        <div className="text-xs text-gray-300 font-mono flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-[#C5A880]" />
                          <span>{activeUnit.owner.phone}</span>
                        </div>
                        <div className="text-xs text-gray-400 font-mono truncate flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-gray-500" />
                          <span>{activeUnit.owner.email}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#222B35] text-[11px] font-mono">
                      <div>
                        <span className="text-gray-400">Số CCCD:</span>{' '}
                        <strong className="text-white">{activeUnit.owner.cccd}</strong>
                      </div>
                      <div>
                        <span className="text-gray-400">Ngày sinh:</span>{' '}
                        <strong className="text-gray-200">{activeUnit.owner.dob || 'Chưa cập nhật'}</strong>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-400">Nơi thường trú:</span>{' '}
                        <strong className="text-gray-200">{activeUnit.owner.pob || 'TP. Hồ Chí Minh'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Biên Bản Bàn Giao Nhà */}
                  {(activeUnit.handoverProtocol || activeUnit.owner.handoverProtocol) && (
                    <div className="p-3 bg-[#121820] border border-[#C5A880]/50 rounded-none text-xs space-y-2">
                      <div className="font-mono text-[10.5px] text-[#C5A880] uppercase tracking-wider flex items-center justify-between font-bold">
                        <span className="flex items-center gap-1.5">
                          <FileCheck2 className="w-3.5 h-3.5 text-[#C5A880]" /> Biên Bản Bàn Giao Căn Hộ
                        </span>
                        <span className="px-1.5 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-500 text-[9.5px]">
                          ĐÃ BÀN GIAO XONG
                        </span>
                      </div>

                      <div className="p-2 bg-[#161B22] border border-[#222B35] text-[11px] font-mono space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Mã Biên Bản:</span>
                          <span className="text-[#C5A880] font-bold">
                            {activeUnit.handoverProtocol?.protocolCode || activeUnit.owner.handoverProtocol?.protocolCode || `BBBG-${activeUnit.code}`}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Ngày Bàn Giao:</span>
                          <span className="text-white">
                            {activeUnit.handoverProtocol?.handoverDate || activeUnit.owner.handoverProtocol?.handoverDate || activeUnit.owner.handoverDate || '15/01/2026'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Bàn Giao Chìa Khóa & Thẻ:</span>
                          <span className="text-emerald-400 font-bold">
                            {activeUnit.handoverProtocol?.keysCount ?? 3} chìa khóa • {activeUnit.handoverProtocol?.cardsCount ?? 2} thẻ thang máy
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Chỉ Số Đồng Hồ Khi Nhận:</span>
                          <span className="text-amber-400 font-bold">
                            ⚡ {activeUnit.handoverProtocol?.initialElectricMeter ?? 12.5} kWh • 💧 {activeUnit.handoverProtocol?.initialWaterMeter ?? 1.2} m³
                          </span>
                        </div>
                        <div className="text-[10px] text-gray-400 pt-1 border-t border-[#222B35] truncate">
                          Đại diện Ban Quản Lý bàn giao: {activeUnit.handoverProtocol?.handoverOfficer || activeUnit.owner.handoverProtocol?.handoverOfficer || 'Kỹ sư Ban Quản Lý Skyline'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Danh sách thành viên gia đình thực tế */}
                  <div className="p-3.5 bg-[#121820] border border-[#222B35] rounded-none space-y-2.5">
                    <div className="text-[11px] uppercase tracking-wider text-[#C5A880] font-bold font-mono flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" /> Thành Viên Cùng Cư Trú ({activeUnit.members?.length || activeUnit.membersCount || 0} người)
                      </span>
                      <span className="text-gray-400 text-[10px]">Cùng Căn Hộ</span>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {activeUnit.members && activeUnit.members.length > 0 ? (
                        activeUnit.members.map((m, idx) => (
                          <div key={m.id || idx} className="p-2 bg-[#161B22] border border-[#2D3748] rounded-none flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={m.avatarUrl || 'https://data.nks.vn/storage/users/default.png'}
                                alt={m.fullName}
                                className="w-8 h-8 rounded-none object-cover border border-[#C5A880]/50"
                              />
                              <div>
                                <div className="font-bold text-white">{m.fullName}</div>
                                <div className="text-[10.5px] text-gray-400">{m.relationship} • SĐT: {m.phone}</div>
                              </div>
                            </div>
                            <span className="px-1.5 py-0.5 text-[9.5px] font-mono bg-emerald-950/80 border border-emerald-500 text-emerald-300">
                              {m.faceStatus || 'Đã có khuôn mặt'}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-3 text-gray-500 italic text-[11px]">
                          Chưa đăng ký thêm nhân khẩu người thân
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Phương tiện đăng ký thật */}
                  <div className="p-3 bg-[#121820] border border-[#222B35] rounded-none text-xs space-y-1.5">
                    <div className="font-mono text-[10.5px] text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Car className="w-3.5 h-3.5 text-[#C5A880]" /> Xe Đăng Ký Gửi Dưới Hầm:
                    </div>
                    {activeUnit.vehicles && activeUnit.vehicles.length > 0 ? (
                      <div className="flex flex-wrap gap-2 pt-0.5">
                        {activeUnit.vehicles.map((v) => (
                          <span key={v.id} className="px-2.5 py-1 bg-[#161B22] border border-gray-700 text-white font-mono text-[11px] font-bold">
                            {v.type === 'CAR' ? '🚗' : '🛵'} {v.plate} ({v.brand || v.cardNo})
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[11px] text-gray-500 italic">Chưa đăng ký phương tiện đậu hầm</div>
                    )}
                  </div>
                </div>
              ) : activeUnit.status === 'MAINTENANCE' ? (
                /* ========================================================= */
                /* TRƯỜNG HỢP 2: CĂN HỘ ĐANG BẢO TRÌ / NGHIỆM THU            */
                /* ========================================================= */
                <div className="p-4 bg-[#121820] border border-blue-500/40 rounded-none space-y-3.5">
                  <div className="flex items-center gap-2 text-blue-400 font-bold font-mono text-sm">
                    <Wrench className="w-4 h-4" />
                    <span>Căn Hộ Đang Nghiệm Thu Kỹ Thuật</span>
                  </div>

                  <p className="text-xs text-gray-300 leading-relaxed">
                    Căn hộ đang được đội ngũ kỹ thuật của Ban Quản Lý kiểm tra tổng thể hệ thống điều hòa nhiệt độ, độ kín khít cửa sổ kính chống ồn và hệ thống van cấp nước trước khi bàn giao cho cư dân.
                  </p>

                  <div className="p-3 bg-[#161B22] border border-[#2D3748] rounded-none text-xs font-mono space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Đơn vị phụ trách:</span>
                      <strong className="text-white">Tổ Kỹ Thuật Tòa Nhà</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Tiến độ nghiệm thu:</span>
                      <strong className="text-blue-300">Đã đạt 85% tiêu chuẩn</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Thời gian dự kiến hoàn thành:</span>
                      <strong className="text-amber-400">Trong vòng 2 ngày làm việc</strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(true)}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg rounded-none"
                  >
                    <Wrench className="w-4 h-4" /> Cập Nhật Tình Trạng Nghiệm Thu
                  </button>
                </div>
              ) : (
                /* ========================================================= */
                /* TRƯỜNG HỢP 3: CĂN HỘ ĐANG TRỐNG (CHUẨN XÁC - KHÔNG ẢO)    */
                /* ========================================================= */
                <div className="p-4 bg-[#121820] border border-amber-500/40 rounded-none space-y-3.5">
                  <div className="flex items-center gap-2 text-amber-400 font-bold font-mono text-sm">
                    <Key className="w-4 h-4" />
                    <span>Căn Hộ Đang Trống (Chưa Có Người Ở)</span>
                  </div>

                  <p className="text-xs text-gray-300 leading-relaxed">
                    Căn hộ hiện đang để trống, chưa có cư dân nhận bàn giao. Ban Quản Lý đã hoàn tất nghiệm thu hoàn thiện xây dựng, kiểm tra an toàn điện, cấp thoát nước và đầu phun chữa cháy PCCC đạt chuẩn quy chuẩn. Căn hộ sẵn sàng để bàn giao chìa khóa và cấp tài khoản cho cư dân mới.
                  </p>

                  <div className="p-3 bg-[#161B22] border border-[#2D3748] rounded-none text-xs font-mono space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Tình trạng nhà:</span>
                      <strong className="text-emerald-400">Sẵn sàng nhận nhà ngay</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Đầu chờ thiết bị:</span>
                      <strong className="text-white">Đã sẵn sàng chuông hình & báo động</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Giá bán niêm yết CĐT:</span>
                      <strong className="text-[#C5A880] text-sm">{activeUnit.priceBillion} tỷ VNĐ</strong>
                    </div>
                  </div>

                  {/* Nút Bàn Giao Căn Hộ Thực Tế */}
                  <button
                    type="button"
                    onClick={() => setIsAssignModalOpen(true)}
                    className="w-full py-2.5 px-4 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg rounded-none"
                  >
                    <Key className="w-4 h-4" /> Bàn Giao Căn Hộ & Cấp Tài Khoản Cư Dân
                  </button>
                </div>
              )}

              {/* Các thao tác mở rộng BQL */}
              <div className="pt-2 border-t border-[#222B35] flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setIsDetailModalOpen(true)}
                  className="flex-1 py-2 px-3 bg-[#161B22] hover:bg-[#202936] text-gray-200 hover:text-white border border-[#2D3748] font-semibold transition-all flex items-center justify-center gap-1.5"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-[#C5A880]" /> Xem Bản Vẽ Mặt Bằng
                </button>

                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="py-2 px-3 bg-[#161B22] hover:bg-[#202936] text-gray-200 hover:text-white border border-[#2D3748] font-semibold transition-all flex items-center justify-center gap-1.5"
                >
                  <Edit className="w-3.5 h-3.5" /> Chỉnh Sửa Thông Tin
                </button>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-gray-400 text-xs font-mono">
              Vui lòng chọn một căn hộ trên mô hình tòa nhà để xem thông tin chi tiết.
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
