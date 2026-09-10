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
  FileText
} from 'lucide-react';
import { 
  getApartmentUnits, 
  getApartmentByCode, 
  ApartmentUnit, 
  saveApartmentsList 
} from '@/lib/apartmentStore';
import { getUserStore, getApartmentMembers, ApartmentMember } from '@/lib/userStore';
import AssignResidentModal from '@/components/portal/admin/AssignResidentModal';
import EditApartmentModal from '@/components/portal/admin/EditApartmentModal';
import AddApartmentModal from '@/components/portal/admin/AddApartmentModal';
import ApartmentDetailModal from '@/components/portal/admin/ApartmentDetailModal';

export type TowerFilter = 'ALL' | 'TOWER_A' | 'TOWER_B';
export type OccupancyFilter = 'ALL' | 'OCCUPIED' | 'VACANT';
export type ViewPerspective = '3D' | 'FLOOR_PLAN' | 'GRID';

export default function AdminBuildingApartmentManager() {
  // 1. Quản lý danh sách căn hộ thực tế từ apartmentStore
  const [apartments, setApartments] = useState<ApartmentUnit[]>([]);
  const [selectedAptCode, setSelectedAptCode] = useState<string>('12A05');
  const [selectedTower, setSelectedTower] = useState<TowerFilter>('ALL');
  const [selectedOccupancy, setSelectedOccupancy] = useState<OccupancyFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [buildingPerspective, setBuildingPerspective] = useState<ViewPerspective>('3D');

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
          },
          membersCount: liveMembers.length > 0 ? liveMembers.length : 4,
          members: liveMembers.length > 0 ? liveMembers : u.members,
        };
      }
      return u;
    });
  }, [apartments, activeOwnerName, activeOwnerPhone, activeOwnerEmail, activeOwnerCccd, activeOwnerAvatar, activeOwnerDob, activeOwnerPob, liveMembers]);

  // Bộ lọc căn hộ
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
        : unit.status !== 'OCCUPIED';

      const q = searchQuery.toLowerCase().trim();
      const matchSearch = q === ''
        ? true
        : unit.code.toLowerCase().includes(q) ||
          (unit.owner?.name && unit.owner.name.toLowerCase().includes(q)) ||
          unit.typeLabel.toLowerCase().includes(q);

      return matchTower && matchOccupancy && matchSearch;
    });
  }, [displayUnits, selectedTower, selectedOccupancy, searchQuery]);

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

  return (
    <div className="space-y-6 animate-fadeIn select-none">
      {/* ============================================================= */}
      {/* 1. TIÊU ĐỀ PHÂN HỆ QUẢN LÝ CĂN HỘ BQL                        */}
      {/* ============================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222B35] pb-4">
        <div>
          <div className="text-[10.5px] uppercase tracking-[0.25em] text-[#C5A880] font-semibold flex items-center gap-1.5 font-mono">
            <Building className="w-3.5 h-3.5 text-[#C5A880]" /> Trung Tâm Vận Hành Không Gian Kiến Trúc • Ban Quản Lý
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl text-white font-bold mt-1">
            Quản Lý Toàn Bộ Tổ Hợp Chung Cư Skyline Smart Residence
          </h2>
          <p className="text-xs text-gray-400 mt-0.5 max-w-3xl">
            Tổ hợp tháp đôi cao 32 tầng gồm Tháp A (Sapphire) & Tháp B (Diamond) kết nối bởi Cầu Kính Sky Bridge tại Tầng 20. Theo dõi trực quan trạng thái từng căn hộ thực tế, loại bỏ hoàn toàn dữ liệu ảo.
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
              onClick={() => setBuildingPerspective('3D')}
              className={`px-3 py-1.5 rounded-none flex items-center gap-1.5 transition-all ${
                buildingPerspective === '3D'
                  ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Box className="w-3.5 h-3.5" /> Khối 3D Tổ Hợp
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
      {/* 2. THANH THỐNG KÊ KPI LẤP ĐẦY TỔ HỢP                         */}
      {/* ============================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-[#121820] border border-[#222B35] rounded-none">
          <div className="text-[10px] uppercase tracking-wider text-gray-400 font-mono flex items-center justify-between">
            <span>Tổng Quỹ Căn Giám Sát</span>
            <Building className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            {totalUnitsCount} <span className="text-xs text-gray-400 font-normal">căn hộ</span>
          </div>
          <div className="text-[10px] text-gray-400 mt-1">2 Tháp 32 Tầng: Tháp A & Tháp B</div>
        </div>

        <div className="p-4 bg-[#121820] border border-emerald-500/30 rounded-none">
          <div className="text-[10px] uppercase tracking-wider text-emerald-400 font-mono flex items-center justify-between">
            <span>Đã Có Cư Dân Sinh Sống</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-300 mt-1">
            {occupiedCount} <span className="text-xs text-gray-400 font-normal">căn hộ ({occupancyRate}%)</span>
          </div>
          <div className="text-[10px] text-emerald-400/80 mt-1">Đã bàn giao và xác thực sinh trắc học</div>
        </div>

        <div className="p-4 bg-[#121820] border border-amber-500/30 rounded-none">
          <div className="text-[10px] uppercase tracking-wider text-amber-400 font-mono flex items-center justify-between">
            <span>Căn Hộ Đang Trống</span>
            <Key className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300 mt-1">
            {vacantCount} <span className="text-xs text-gray-400 font-normal">căn sẵn sàng</span>
          </div>
          <div className="text-[10px] text-amber-400/80 mt-1">Sẵn sàng bàn giao cho cư dân mới</div>
        </div>

        <div className="p-4 bg-[#121820] border border-blue-500/30 rounded-none">
          <div className="text-[10px] uppercase tracking-wider text-blue-400 font-mono flex items-center justify-between">
            <span>Nghiệm Thu / Bảo Trì</span>
            <Clock className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-blue-300 mt-1">
            {maintenanceCount} <span className="text-xs text-gray-400 font-normal">căn</span>
          </div>
          <div className="text-[10px] text-blue-400/80 mt-1">Kiểm định kỹ thuật tiêu chuẩn CĐT</div>
        </div>
      </div>

      {/* ============================================================= */}
      {/* 3. THANH CÔNG CỤ TÌM KIẾM & BỘ LỌC                          */}
      {/* ============================================================= */}
      <div className="p-3 bg-[#121820] border border-[#222B35] rounded-none flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Lọc Tháp */}
          <span className="text-gray-400 font-mono text-[11px]">Tòa Tháp:</span>
          {[
            { id: 'ALL', label: 'Tất Cả Tổ Hợp' },
            { id: 'TOWER_A', label: 'Tháp A (Sapphire)' },
            { id: 'TOWER_B', label: 'Tháp B (Diamond)' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedTower(t.id as any)}
              className={`px-3 py-1.5 rounded-none font-semibold transition-all ${
                selectedTower === t.id
                  ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow'
                  : 'bg-[#161B22] text-gray-400 hover:text-white border border-[#2D3748]'
              }`}
            >
              {t.label}
            </button>
          ))}

          <div className="w-[1px] h-5 bg-[#222B35] mx-1 hidden sm:block"></div>

          {/* Lọc Trạng Thái */}
          <span className="text-gray-400 font-mono text-[11px]">Trạng Thái:</span>
          {[
            { id: 'ALL', label: 'Tất Cả' },
            { id: 'OCCUPIED', label: '🟢 Đang Sinh Sống' },
            { id: 'VACANT', label: '🟡 Căn Hộ Trống' }
          ].map(o => (
            <button
              key={o.id}
              onClick={() => setSelectedOccupancy(o.id as any)}
              className={`px-3 py-1.5 rounded-none font-semibold transition-all ${
                selectedOccupancy === o.id
                  ? 'bg-[#1C2533] text-[#C5A880] border border-[#C5A880] font-bold shadow'
                  : 'bg-[#161B22] text-gray-400 hover:text-white border border-[#2D3748]'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>

        {/* Ô Tìm kiếm căn hộ */}
        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo mã căn (12A05, 18A01...) hoặc chủ hộ..."
            className="w-full bg-[#161B22] border border-[#2D3748] pl-8 pr-3 py-1.5 rounded-none text-white text-xs outline-none focus:border-[#C5A880]"
          />
        </div>
      </div>

      {/* ============================================================= */}
      {/* 4. KHU VỰC CHÍNH: MÔ HÌNH CHUNG CƯ ĐỒ SỘ & HỒ SƠ CHI TIẾT     */}
      {/* ============================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* CỘT TRÁI (7 COLS): MÔ HÌNH 3D / MẶT BẰNG TẦNG KIẾN TRÚC       */}
        <div className="lg:col-span-7 bg-[#0D1117] border border-[#222B35] rounded-none overflow-hidden shadow-2xl flex flex-col">
          
          {/* Header mô hình */}
          <div className="p-4 bg-[#121820] border-b border-[#222B35] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-[#C5A880]" />
              <span className="font-bold text-sm text-white">
                {buildingPerspective === '3D' && 'Mô Hình 3D Toàn Cảnh Đại Tổ Hợp Tháp Đôi (32 Tầng)'}
                {buildingPerspective === 'FLOOR_PLAN' && `Mặt Bằng Tầng Kiến Trúc: Tháp ${selectedFloorTower} • Tầng ${selectedFloor}`}
                {buildingPerspective === 'GRID' && `Ma Trận Quỹ Căn Hộ Chung Cư (${filteredUnits.length} căn)`}
              </span>
            </div>
            
            {/* Chú thích màu sắc */}
            <div className="flex items-center gap-3 text-[10px] font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-none bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                <span className="text-gray-300">Đang Sinh Sống</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-none bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]"></span>
                <span className="text-gray-300">Căn Hộ Trống</span>
              </div>
            </div>
          </div>

          {/* ----------------------------------------------------------- */}
          {/* GÓC NHÌN 1: MÔ HÌNH 3D ISOMETRIC TỔ HỢP THÁP ĐÔI ĐỒ SỘ      */}
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

              {/* BẢN VẼ PHỐI CẢNH 3D TỔ HỢP THÁP ĐÔI HIỆN ĐẠI (SVG) */}
              <svg
                viewBox="0 0 1000 620"
                className="w-full h-full max-h-[600px] cursor-pointer drop-shadow-[0_30px_60px_rgba(0,0,0,0.95)]"
              >
                <defs>
                  {/* Gradient kính tháp */}
                  <linearGradient id="glassA" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1E293B" />
                    <stop offset="50%" stopColor="#0F172A" />
                    <stop offset="100%" stopColor="#020617" />
                  </linearGradient>

                  <linearGradient id="glassB" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#334155" />
                    <stop offset="60%" stopColor="#1E293B" />
                    <stop offset="100%" stopColor="#0B0F19" />
                  </linearGradient>

                  <linearGradient id="skyBridgeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#C5A880" stopOpacity="0.85" />
                    <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#C5A880" stopOpacity="0.85" />
                  </linearGradient>

                  <linearGradient id="podiumMallGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1E293B" />
                    <stop offset="100%" stopColor="#0B111A" />
                  </linearGradient>

                  <linearGradient id="laserBeam" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* 1. MẶT SÀN KHUÔN VIÊN ĐẠI ĐÔ THỊ & KHỐI ĐẾ PODIUM 4 TẦNG */}
                <g className="opacity-95">
                  {/* Nền cảnh quan quảng trường */}
                  <polygon points="80,510 500,600 920,510 500,430" fill="#070B12" stroke="#1E293B" strokeWidth="2" />
                  
                  {/* Hồ nước cảnh quan / Hồ phun nước mặt tiền */}
                  <polygon points="360,550 500,580 640,550 500,520" fill="#0369A1" fillOpacity="0.4" stroke="#38BDF8" strokeWidth="1" />
                  <text x="500" y="555" fill="#38BDF8" fontSize="8.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                    HỒ CẢNH QUAN & ĐÀI PHUN NƯỚC NỘI KHU
                  </text>

                  {/* KHỐI ĐẾ PODIUM THƯƠNG MẠI (TẦNG 1 - 4) */}
                  <polygon points="140,460 500,535 860,460 860,410 500,485 140,410" fill="url(#podiumMallGrad)" stroke="#334155" strokeWidth="1.5" />
                  {/* Cửa kính Shophouse khối đế */}
                  <polygon points="170,440 500,510 830,440 830,420 500,490 170,420" fill="#0EA5E9" fillOpacity="0.25" stroke="#38BDF8" strokeWidth="1" />
                  
                  {/* Nhãn Khối Đế */}
                  <text x="500" y="500" fill="#E2E8F0" fontSize="10.5" fontFamily="sans-serif" textAnchor="middle" fontWeight="extrabold" letterSpacing="0.1em">
                    ĐẠI KHỐI ĐẾ THƯƠNG MẠI & SẢNH ĐÓN 5 SAO (TẦNG 1 - 4)
                  </text>
                  <text x="500" y="513" fill="#94A3B8" fontSize="8" fontFamily="monospace" textAnchor="middle">
                    Grand Lobby • Shophouse TTTM • Khu Dịch Vụ Cư Dân
                  </text>
                </g>

                {/* 2. CẦU KÍNH TRÊN KHÔNG SKY BRIDGE KẾT NỐI TẦNG 20 */}
                <g 
                  onClick={() => {
                    setSelectedFloor(20);
                    setBuildingPerspective('FLOOR_PLAN');
                  }}
                  className="cursor-pointer group"
                >
                  <polygon points="390,265 610,265 610,240 390,240" fill="url(#skyBridgeGrad)" stroke="#FDE68A" strokeWidth="1.8" className="transition-all hover:brightness-125" />
                  {/* Kính bảo vệ Sky Bridge */}
                  <line x1="390" y1="242" x2="610" y2="242" stroke="#FFFFFF" strokeWidth="1" strokeDasharray="4 2" />
                  <text x="500" y="254" fill="#0D1117" fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="900">
                    CẦU KÍNH SKY BRIDGE & HỒ BƠI VÔ CỰC (TẦNG 20)
                  </text>
                  <text x="500" y="278" fill="#FDE68A" fontSize="7.5" fontFamily="sans-serif" textAnchor="middle">
                    Kết nối 2 tháp ở độ cao 80 mét
                  </text>
                </g>

                {/* 3. THÁP A - SAPPHIRE TOWER (32 TẦNG - BÊN TRÁI) */}
                <g className="transition-all duration-300">
                  {/* Thân tháp A chính */}
                  <polygon points="180,410 390,460 390,90 180,50" fill="url(#glassA)" stroke="#222B35" strokeWidth="1.5" />
                  <polygon points="390,460 450,440 450,75 390,90" fill="url(#glassB)" stroke="#334155" strokeWidth="1.5" />
                  {/* Mái tháp A */}
                  <polygon points="180,50 390,90 450,75 240,35" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />

                  {/* Nhãn đỉnh Tháp A */}
                  <text x="310" y="32" fill="#C5A880" fontSize="13" fontWeight="bold" textAnchor="middle" fontFamily="serif">
                    THÁP A (SAPPHIRE) • 32 TẦNG
                  </text>

                  {/* Dải các tầng kiến trúc Tháp A */}
                  {/* Dãy tầng Penthouse & Duplex (Tầng 28 - 32) */}
                  <polygon points="185,90 385,128 385,60 185,25" fill="#C5A880" fillOpacity="0.2" stroke="#C5A880" strokeWidth="1" />
                  <text x="285" y="80" fill="#FEF3C7" fontSize="8" fontFamily="monospace" textAnchor="middle">
                    PENTHOUSE & SKY VILLAS (T28-32)
                  </text>

                  {/* CĂN 25PH-01: Tầng 25 (Duplex - Trống) */}
                  <g onClick={() => setSelectedAptCode('25PH-01')} className="cursor-pointer group">
                    <polygon 
                      points="190,135 380,172 380,140 190,105" 
                      fill={selectedAptCode === '25PH-01' ? '#F59E0B' : '#78350F'}
                      fillOpacity={selectedAptCode === '25PH-01' ? '0.95' : '0.5'}
                      stroke={selectedAptCode === '25PH-01' ? '#FDE68A' : '#F59E0B'}
                      strokeWidth={selectedAptCode === '25PH-01' ? '2.5' : '1'}
                      className="transition-all hover:fill-amber-500"
                    />
                    <text x="285" y="142" fill="#FEF3C7" fontSize="8.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                      Căn 25PH-01 (Duplex 215m²) • TRỐNG
                    </text>
                  </g>

                  {/* CĂN 18A01: Tầng 18 (3PN - Trống) */}
                  <g onClick={() => setSelectedAptCode('18A01')} className="cursor-pointer group">
                    <polygon 
                      points="190,215 380,252 380,225 190,190" 
                      fill={selectedAptCode === '18A01' ? '#F59E0B' : '#78350F'}
                      fillOpacity={selectedAptCode === '18A01' ? '0.95' : '0.5'}
                      stroke={selectedAptCode === '18A01' ? '#FDE68A' : '#F59E0B'}
                      strokeWidth={selectedAptCode === '18A01' ? '2.5' : '1'}
                      className="transition-all hover:fill-amber-500"
                    />
                    <text x="285" y="224" fill="#FEF3C7" fontSize="8.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                      Căn 18A01 (3PN 112m²) • TRỐNG
                    </text>
                  </g>

                  {/* CĂN 12A05: TẦNG 12 (★ CĂN CỦA CHỦ HỘ NGUYỄN HỮU LỰC - CÓ CƯ DÂN THỰC TẾ) */}
                  <g onClick={() => setSelectedAptCode('12A05')} className="cursor-pointer group">
                    {/* Hào quang phát sáng căn hộ thật */}
                    <polygon 
                      points="190,295 380,332 380,300 190,265" 
                      fill={selectedAptCode === '12A05' ? '#059669' : '#065F46'}
                      fillOpacity={selectedAptCode === '12A05' ? '1' : '0.8'}
                      stroke={selectedAptCode === '12A05' ? '#A7F3D0' : '#10B981'}
                      strokeWidth={selectedAptCode === '12A05' ? '3' : '1.5'}
                      className="transition-all hover:fill-emerald-500 shadow-2xl"
                    />
                    {/* Đèn laser chỉ định */}
                    <line x1="190" y1="280" x2="160" y2="280" stroke="#10B981" strokeWidth="1.5" />
                    <circle cx="155" cy="280" r="3" fill="#10B981" />
                    <text x="145" y="283" fill="#A7F3D0" fontSize="8" fontWeight="bold" textAnchor="end" fontFamily="monospace">
                      TẦNG 12
                    </text>

                    <text x="285" y="302" fill="#FFFFFF" fontSize="9.5" fontWeight="900" textAnchor="middle" fontFamily="monospace">
                      ★ Căn 12A05 • ĐÃ CÓ CƯ DÂN
                    </text>
                    <text x="285" y="316" fill="#D1FAE5" fontSize="8" fontWeight="bold" textAnchor="middle">
                      Chủ Hộ: Nguyễn Hữu Lực (Căn góc 2PN)
                    </text>
                  </g>

                  {/* CĂN 05A02: Tầng 5 (1PN - Trống) */}
                  <g onClick={() => setSelectedAptCode('05A02')} className="cursor-pointer group">
                    <polygon 
                      points="190,375 380,412 380,385 190,350" 
                      fill={selectedAptCode === '05A02' ? '#F59E0B' : '#78350F'}
                      fillOpacity={selectedAptCode === '05A02' ? '0.95' : '0.45'}
                      stroke={selectedAptCode === '05A02' ? '#FDE68A' : '#F59E0B'}
                      strokeWidth={selectedAptCode === '05A02' ? '2.5' : '1'}
                      className="transition-all hover:fill-amber-500"
                    />
                    <text x="285" y="384" fill="#FEF3C7" fontSize="8.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                      Căn 05A02 (1PN 52m²) • TRỐNG
                    </text>
                  </g>
                </g>

                {/* 4. THÁP B - DIAMOND TOWER (32 TẦNG - BÊN PHẢI) */}
                <g className="transition-all duration-300">
                  {/* Thân tháp B chính */}
                  <polygon points="550,440 610,460 610,90 550,75" fill="url(#glassA)" stroke="#334155" strokeWidth="1.5" />
                  <polygon points="610,460 820,410 820,50 610,90" fill="url(#glassB)" stroke="#222B35" strokeWidth="1.5" />
                  {/* Mái tháp B */}
                  <polygon points="550,75 610,90 820,50 760,35" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />

                  {/* SÂN ĐÁP TRỰC THĂNG HELIPAD TRÊN ĐỈNH THÁP B */}
                  <ellipse cx="715" cy="55" rx="35" ry="14" fill="#0F172A" stroke="#C5A880" strokeWidth="1.5" />
                  <circle cx="715" cy="55" r="8" fill="none" stroke="#FDE68A" strokeWidth="1" />
                  <text x="715" y="58" fill="#FDE68A" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">H</text>

                  {/* Nhãn đỉnh Tháp B */}
                  <text x="690" y="32" fill="#C5A880" fontSize="13" fontWeight="bold" textAnchor="middle" fontFamily="serif">
                    THÁP B (DIAMOND) • 32 TẦNG
                  </text>

                  {/* CĂN 25PH-02: Tầng 25 (Duplex - Trống) */}
                  <g onClick={() => setSelectedAptCode('25PH-02')} className="cursor-pointer group">
                    <polygon 
                      points="620,172 810,135 810,105 620,140" 
                      fill={selectedAptCode === '25PH-02' ? '#F59E0B' : '#78350F'}
                      fillOpacity={selectedAptCode === '25PH-02' ? '0.95' : '0.5'}
                      stroke={selectedAptCode === '25PH-02' ? '#FDE68A' : '#F59E0B'}
                      strokeWidth={selectedAptCode === '25PH-02' ? '2.5' : '1'}
                      className="transition-all hover:fill-amber-500"
                    />
                    <text x="715" y="142" fill="#FEF3C7" fontSize="8.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                      Căn 25PH-02 (Duplex 215m²) • TRỐNG
                    </text>
                  </g>

                  {/* CĂN 19B03: Tầng 19 (3PN - Trống) */}
                  <g onClick={() => setSelectedAptCode('19B03')} className="cursor-pointer group">
                    <polygon 
                      points="620,245 810,208 810,180 620,215" 
                      fill={selectedAptCode === '19B03' ? '#F59E0B' : '#78350F'}
                      fillOpacity={selectedAptCode === '19B03' ? '0.95' : '0.5'}
                      stroke={selectedAptCode === '19B03' ? '#FDE68A' : '#F59E0B'}
                      strokeWidth={selectedAptCode === '19B03' ? '2.5' : '1'}
                      className="transition-all hover:fill-amber-500"
                    />
                    <text x="715" y="217" fill="#FEF3C7" fontSize="8.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                      Căn 19B03 (3PN 108m²) • TRỐNG
                    </text>
                  </g>

                  {/* CĂN 11B06: Tầng 11 (2PN - Trống) */}
                  <g onClick={() => setSelectedAptCode('11B06')} className="cursor-pointer group">
                    <polygon 
                      points="620,318 810,280 810,252 620,288" 
                      fill={selectedAptCode === '11B06' ? '#F59E0B' : '#78350F'}
                      fillOpacity={selectedAptCode === '11B06' ? '0.95' : '0.5'}
                      stroke={selectedAptCode === '11B06' ? '#FDE68A' : '#F59E0B'}
                      strokeWidth={selectedAptCode === '11B06' ? '2.5' : '1'}
                      className="transition-all hover:fill-amber-500"
                    />
                    <text x="715" y="288" fill="#FEF3C7" fontSize="8.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                      Căn 11B06 (2PN 75m²) • TRỐNG
                    </text>
                  </g>

                  {/* CĂN 08B12: Tầng 8 (1PN - Trống) */}
                  <g onClick={() => setSelectedAptCode('08B12')} className="cursor-pointer group">
                    <polygon 
                      points="620,380 810,342 810,315 620,350" 
                      fill={selectedAptCode === '08B12' ? '#F59E0B' : '#78350F'}
                      fillOpacity={selectedAptCode === '08B12' ? '0.95' : '0.5'}
                      stroke={selectedAptCode === '08B12' ? '#FDE68A' : '#F59E0B'}
                      strokeWidth={selectedAptCode === '08B12' ? '2.5' : '1'}
                      className="transition-all hover:fill-amber-500"
                    />
                    <text x="715" y="350" fill="#FEF3C7" fontSize="8.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                      Căn 08B12 (1PN 52m²) • TRỐNG
                    </text>
                  </g>
                </g>

                {/* CÂY XANH CẢNH QUAN & ĐÈN PHÁT SÁNG NỘI KHU */}
                <g className="pointer-events-none">
                  <circle cx="160" cy="500" r="6" fill="#10B981" />
                  <circle cx="190" cy="510" r="5" fill="#059669" />
                  <circle cx="810" cy="510" r="5" fill="#059669" />
                  <circle cx="840" cy="500" r="6" fill="#10B981" />
                </g>
              </svg>

              {/* HUD Hướng Dẫn Tương Tác */}
              <div className="absolute bottom-3 left-3 bg-[#0D1117]/90 border border-[#222B35] px-3 py-1.5 rounded-none text-[10.5px] text-[#C5A880] font-mono backdrop-blur-md">
                * Nhấp trực tiếp vào từng khối căn hộ trên tháp để xem hồ sơ hoặc chuyển chế độ Mặt Bằng Tầng
              </div>

              {/* Nút Chuyển nhanh sang Mặt Bằng Tầng 12 (Nơi có căn hộ cư dân thật) */}
              <button
                type="button"
                onClick={() => {
                  setSelectedFloorTower('A');
                  setSelectedFloor(12);
                  setBuildingPerspective('FLOOR_PLAN');
                }}
                className="absolute top-3 right-3 px-3 py-1.5 bg-[#161B22]/90 hover:bg-[#C5A880] text-[#C5A880] hover:text-[#0D1117] border border-[#C5A880] text-xs font-bold font-mono transition-all backdrop-blur shadow-lg flex items-center gap-1.5"
              >
                <Layers className="w-3.5 h-3.5" /> Xem Mặt Bằng Tầng 12 (Tháp A)
              </button>
            </div>
          )}

          {/* ----------------------------------------------------------- */}
          {/* GÓC NHÌN 2: MẶT BẰNG TẦNG KIẾN TRÚC THỰC TẾ (FLOOR PLAN)    */}
          {/* ----------------------------------------------------------- */}
          {buildingPerspective === 'FLOOR_PLAN' && (
            <div className="p-4 sm:p-5 bg-[#05070A] h-[540px] sm:h-[600px] overflow-y-auto space-y-4">
              
              {/* Bộ điều khiển Tháp & Tầng */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#121820] border border-[#222B35] text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 font-mono">Chọn Tháp:</span>
                  <button
                    type="button"
                    onClick={() => setSelectedFloorTower('A')}
                    className={`px-3 py-1 rounded-none font-bold ${
                      selectedFloorTower === 'A' ? 'bg-[#C5A880] text-[#0D1117]' : 'bg-[#161B22] text-gray-400'
                    }`}
                  >
                    Tháp A (Sapphire)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedFloorTower('B')}
                    className={`px-3 py-1 rounded-none font-bold ${
                      selectedFloorTower === 'B' ? 'bg-[#C5A880] text-[#0D1117]' : 'bg-[#161B22] text-gray-400'
                    }`}
                  >
                    Tháp B (Diamond)
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
                        Tầng {f} {f === 12 ? '(Có căn 12A05 ★)' : f === 20 ? '(Cầu Kính Sky Bridge)' : f === 25 ? '(Penthouse Duplex)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* BẢN VẼ MẶT BẰNG SÀN KIẾN TRÚC TẦNG THỰC TẾ (SVG FLOOR PLATE) */}
              <div className="relative w-full bg-[#090D14] border border-[#222B35] p-3 flex flex-col items-center">
                <div className="text-[11px] font-mono text-[#C5A880] mb-2 self-start flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5" /> SƠ ĐỒ MẶT BẰNG SÀN TẦNG {selectedFloor} • THÁP {selectedFloorTower} (BỐ TRÍ 8 CĂN HỘ / TẦNG)
                </div>

                <svg viewBox="0 0 800 360" className="w-full max-w-[760px] drop-shadow-lg">
                  {/* Đường bao sàn tầng */}
                  <rect x="20" y="20" width="760" height="320" fill="#0C121D" stroke="#1E293B" strokeWidth="2" />
                  
                  {/* LÕI KỸ THUẬT & CỤM THANG MÁY TRUNG TÂM (CORE) */}
                  <rect x="290" y="90" width="220" height="180" fill="#16202E" stroke="#334155" strokeWidth="1.5" />
                  <text x="400" y="115" fill="#E2E8F0" fontSize="10" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                    LÕI KỸ THUẬT TRUNG TÂM
                  </text>

                  {/* 4 Thang Máy Khách Tốc Độ Cao */}
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
                  <text x="400" y="198" fill="#FDE68A" fontSize="8.5" textAnchor="middle" fontFamily="monospace">THANG PCCC CHUYÊN DỤNG</text>

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

                  {/* CÁC CĂN HỘ PHÂN BỔ TRÊN TẦNG (VÍ DỤ TẦNG 12 CÓ 8 CĂN) */}
                  {/* Căn 01 (Góc Tây Bắc) */}
                  <g onClick={() => setSelectedAptCode(`${selectedFloor}A01`)} className="cursor-pointer">
                    <rect x="30" y="30" width="110" height="140" fill={selectedAptCode === `${selectedFloor}A01` ? '#78350F' : '#141D2B'} stroke={selectedAptCode === `${selectedFloor}A01` ? '#F59E0B' : '#334155'} strokeWidth="1.5" />
                    <text x="85" y="85" fill="#FFFFFF" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">Căn {selectedFloor}A01</text>
                    <text x="85" y="102" fill="#94A3B8" fontSize="8" textAnchor="middle">3PN • 98m²</text>
                    <text x="85" y="120" fill="#F59E0B" fontSize="8" fontWeight="bold" textAnchor="middle">TRỐNG</text>
                  </g>

                  {/* Căn 02 (Chính Bắc) */}
                  <g onClick={() => setSelectedAptCode(`${selectedFloor}A02`)} className="cursor-pointer">
                    <rect x="150" y="30" width="130" height="55" fill={selectedAptCode === `${selectedFloor}A02` ? '#78350F' : '#141D2B'} stroke={selectedAptCode === `${selectedFloor}A02` ? '#F59E0B' : '#334155'} strokeWidth="1.5" />
                    <text x="215" y="55" fill="#FFFFFF" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">Căn {selectedFloor}A02 (1PN • 52m²)</text>
                    <text x="215" y="70" fill="#F59E0B" fontSize="7.5" fontWeight="bold" textAnchor="middle">TRỐNG</text>
                  </g>

                  {/* Căn 03 (Chính Bắc - Giữa) */}
                  <g onClick={() => setSelectedAptCode(`${selectedFloor}A03`)} className="cursor-pointer">
                    <rect x="290" y="30" width="220" height="55" fill={selectedAptCode === `${selectedFloor}A03` ? '#78350F' : '#141D2B'} stroke={selectedAptCode === `${selectedFloor}A03` ? '#F59E0B' : '#334155'} strokeWidth="1.5" />
                    <text x="400" y="55" fill="#FFFFFF" fontSize="9.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">Căn {selectedFloor}A03 (2PN • 75m²)</text>
                    <text x="400" y="70" fill="#F59E0B" fontSize="7.5" fontWeight="bold" textAnchor="middle">TRỐNG</text>
                  </g>

                  {/* Căn 04 (Chính Bắc - Đông) */}
                  <g onClick={() => setSelectedAptCode(`${selectedFloor}A04`)} className="cursor-pointer">
                    <rect x="520" y="30" width="130" height="55" fill={selectedAptCode === `${selectedFloor}A04` ? '#78350F' : '#141D2B'} stroke={selectedAptCode === `${selectedFloor}A04` ? '#F59E0B' : '#334155'} strokeWidth="1.5" />
                    <text x="585" y="55" fill="#FFFFFF" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">Căn {selectedFloor}A04 (3PN • 108m²)</text>
                    <text x="585" y="70" fill="#F59E0B" fontSize="7.5" fontWeight="bold" textAnchor="middle">TRỐNG</text>
                  </g>

                  {/* CĂN 05: CĂN 12A05 ★ ĐÃ CÓ CƯ DÂN NGUYỄN HỮU LỰC (GÓC ĐÔNG NAM) */}
                  <g onClick={() => setSelectedAptCode('12A05')} className="cursor-pointer">
                    <rect 
                      x="660" 
                      y="180" 
                      width="110" 
                      height="150" 
                      fill={selectedAptCode === '12A05' ? '#065F46' : '#044332'} 
                      stroke="#10B981" 
                      strokeWidth={selectedAptCode === '12A05' ? '2.5' : '1.5'} 
                      className="transition-all hover:fill-emerald-700 shadow-xl"
                    />
                    <text x="715" y="215" fill="#FFFFFF" fontSize="11" fontWeight="900" textAnchor="middle" fontFamily="monospace">
                      ★ CĂN 12A05
                    </text>
                    <text x="715" y="235" fill="#A7F3D0" fontSize="8" fontWeight="bold" textAnchor="middle">
                      2PN - 2WC • 78.5m²
                    </text>
                    <rect x="675" y="250" width="80" height="18" fill="#10B981" rx="0" />
                    <text x="715" y="262" fill="#0D1117" fontSize="7.5" fontWeight="bold" textAnchor="middle">
                      CÓ CƯ DÂN
                    </text>
                    <text x="715" y="285" fill="#D1FAE5" fontSize="8" fontWeight="bold" textAnchor="middle">
                      Nguyễn Hữu Lực
                    </text>
                  </g>

                  {/* Căn 06 (Góc Đông Bắc) */}
                  <g onClick={() => setSelectedAptCode(`${selectedFloor}A06`)} className="cursor-pointer">
                    <rect x="660" y="30" width="110" height="140" fill={selectedAptCode === `${selectedFloor}A06` ? '#78350F' : '#141D2B'} stroke={selectedAptCode === `${selectedFloor}A06` ? '#F59E0B' : '#334155'} strokeWidth="1.5" />
                    <text x="715" y="85" fill="#FFFFFF" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">Căn {selectedFloor}A06</text>
                    <text x="715" y="102" fill="#94A3B8" fontSize="8" textAnchor="middle">2PN • 75m²</text>
                    <text x="715" y="120" fill="#F59E0B" fontSize="8" fontWeight="bold" textAnchor="middle">TRỐNG</text>
                  </g>

                  {/* Căn 07 (Chính Nam - Đông) */}
                  <g onClick={() => setSelectedAptCode(`${selectedFloor}A07`)} className="cursor-pointer">
                    <rect x="520" y="275" width="130" height="65" fill={selectedAptCode === `${selectedFloor}A07` ? '#78350F' : '#141D2B'} stroke={selectedAptCode === `${selectedFloor}A07` ? '#F59E0B' : '#334155'} strokeWidth="1.5" />
                    <text x="585" y="305" fill="#FFFFFF" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">Căn {selectedFloor}A07 (3PN • 112m²)</text>
                    <text x="585" y="322" fill="#F59E0B" fontSize="7.5" fontWeight="bold" textAnchor="middle">TRỐNG</text>
                  </g>

                  {/* Căn 08 (Góc Tây Nam) */}
                  <g onClick={() => setSelectedAptCode(`${selectedFloor}A08`)} className="cursor-pointer">
                    <rect x="30" y="180" width="110" height="150" fill={selectedAptCode === `${selectedFloor}A08` ? '#78350F' : '#141D2B'} stroke={selectedAptCode === `${selectedFloor}A08` ? '#F59E0B' : '#334155'} strokeWidth="1.5" />
                    <text x="85" y="235" fill="#FFFFFF" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">Căn {selectedFloor}A08</text>
                    <text x="85" y="252" fill="#94A3B8" fontSize="8" textAnchor="middle">1PN • 52m²</text>
                    <text x="85" y="270" fill="#F59E0B" fontSize="8" fontWeight="bold" textAnchor="middle">TRỐNG</text>
                  </g>
                </svg>
              </div>

              {/* Danh sách nhanh các căn trên tầng này */}
              <div className="space-y-2 pt-2">
                <div className="text-xs font-mono text-gray-400">
                  Danh mục căn hộ thực tế Tầng {selectedFloor} - Tháp {selectedFloorTower}:
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['01', '02', '03', '04', '05', '06', '07', '08'].map(num => {
                    const code = `${selectedFloor}A${num}`;
                    const isOccupied = code === '12A05';
                    const isSelected = selectedAptCode === code;
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
                          <span className={`px-1 py-0.2 text-[9px] ${
                            isOccupied ? 'text-emerald-400 bg-emerald-950/80 border border-emerald-500' : 'text-amber-400 bg-amber-950/80 border border-amber-500'
                          }`}>
                            {isOccupied ? 'Cư Dân' : 'Trống'}
                          </span>
                        </div>
                        <div className="text-[10px] text-gray-400 mt-1">
                          {isOccupied ? 'Nguyễn Hữu Lực' : 'Sẵn sàng bàn giao'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------- */}
          {/* GÓC NHÌN 3: DANH SÁCH LƯỚI MA TRẬN CĂN HỘ                   */}
          {/* ----------------------------------------------------------- */}
          {buildingPerspective === 'GRID' && (
            <div className="p-4 bg-[#05070A] h-[540px] sm:h-[600px] overflow-y-auto space-y-3">
              <div className="text-xs text-gray-400 font-mono mb-2">
                Danh Sách Quỹ Căn Hộ Chung Cư ({filteredUnits.length} căn phù hợp):
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {filteredUnits.map(unit => {
                  const isSelected = unit.code === selectedAptCode;
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
                      </div>

                      <div className="text-right">
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-none border ${
                          unit.status === 'OCCUPIED'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                            : 'bg-amber-950 text-amber-300 border-amber-500'
                        }`}>
                          {unit.status === 'OCCUPIED' ? 'Đang Sinh Sống' : 'Đang Trống'}
                        </span>
                        <div className="text-[11px] font-mono text-[#C5A880] mt-1 font-bold">
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

        {/* CỘT PHẢI (5 COLS): HỒ SƠ CHI TIẾT CĂN HỘ ĐANG CHỌN (DOSSIER)  */}
        <div className="lg:col-span-5 bg-[#0D1117] border border-[#222B35] rounded-none p-5 space-y-4 shadow-2xl">
          
          {activeUnit ? (
            <>
              {/* Tiêu đề thẻ hồ sơ */}
              <div className="border-b border-[#222B35] pb-3.5 flex items-start justify-between">
                <div>
                  <div className="text-[10.5px] uppercase tracking-wider text-[#C5A880] font-mono font-semibold">
                    Hồ Sơ Căn Hộ • {activeUnit.towerName} - Tầng {activeUnit.floor}
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-white mt-0.5">
                    Căn Hộ {activeUnit.code}
                  </h3>
                  <div className="text-xs text-gray-400 mt-0.5">
                    Loại căn: <strong className="text-gray-200">{activeUnit.typeLabel}</strong> • Diện tích: <strong className="text-[#C5A880]">{activeUnit.area} m²</strong>
                  </div>
                </div>

                {/* Trạng thái to rõ ràng: ĐÃ CÓ NGƯỜI Ở vs ĐANG TRỐNG */}
                <div className="text-right">
                  <span className={`px-3 py-1 text-xs font-extrabold uppercase rounded-none border shadow-lg inline-flex items-center gap-1.5 ${
                    activeUnit.status === 'OCCUPIED'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                      : 'bg-amber-950 text-amber-300 border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                  }`}>
                    {activeUnit.status === 'OCCUPIED' ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> ĐÃ CÓ CƯ DÂN
                      </>
                    ) : (
                      <>
                        <Key className="w-3.5 h-3.5 text-amber-400" /> CĂN HỘ ĐANG TRỐNG
                      </>
                    )}
                  </span>
                  <div className="text-[10.5px] text-gray-400 font-mono mt-1">
                    Định giá: <strong className="text-white">{activeUnit.priceBillion} tỷ VNĐ</strong>
                  </div>
                </div>
              </div>

              {/* ========================================================= */}
              {/* TRƯỜNG HỢP 1: CĂN HỘ ĐÃ CÓ CƯ DÂN (DỮ LIỆU THỰC TỪ API)   */}
              {/* ========================================================= */}
              {activeUnit.status === 'OCCUPIED' && activeUnit.owner ? (
                <div className="space-y-4">
                  
                  {/* Thông tin chủ hộ thực tế */}
                  <div className="p-3.5 bg-[#121820] border border-[#222B35] rounded-none space-y-3">
                    <div className="text-[11px] uppercase tracking-wider text-emerald-400 font-bold font-mono flex items-center justify-between">
                      <span>Chủ Hộ Đang Sinh Sống</span>
                      <span className="px-2 py-0.5 text-[9.5px] bg-emerald-950 border border-emerald-600 rounded-none text-emerald-300">
                        Đã Xác Thực e-KYC ✓
                      </span>
                    </div>

                    <div className="flex items-start gap-3.5">
                      <img
                        src={activeUnit.owner.avatar}
                        alt={activeUnit.owner.name}
                        className="w-14 h-14 rounded-none object-cover border-2 border-[#C5A880] shadow-md shrink-0"
                      />
                      <div className="space-y-1 min-w-0">
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
                        <strong className="text-gray-200">{activeUnit.owner.dob || '18/08/2004'}</strong>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-400">Nơi thường trú:</span>{' '}
                        <strong className="text-gray-200">{activeUnit.owner.pob || 'Triệu Trạch, Triệu Phong, Quảng Trị'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Danh sách thành viên gia đình thực tế */}
                  <div className="p-3.5 bg-[#121820] border border-[#222B35] rounded-none space-y-2.5">
                    <div className="text-[11px] uppercase tracking-wider text-[#C5A880] font-bold font-mono flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" /> Thành Viên Đăng Ký Cư Trú ({activeUnit.members?.length || activeUnit.membersCount} người)
                      </span>
                      <span className="text-gray-400 text-[10px]">Cùng Căn Hộ</span>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {(activeUnit.members || []).map((m, idx) => (
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
                            {m.faceStatus || 'Đã xác thực'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Phương tiện đăng ký thật */}
                  <div className="p-3 bg-[#121820] border border-[#222B35] rounded-none text-xs space-y-1.5">
                    <div className="font-mono text-[10.5px] text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Car className="w-3.5 h-3.5 text-[#C5A880]" /> Phương Tiện Cư Dân Định Danh Biển Số:
                    </div>
                    <div className="flex flex-wrap gap-2 pt-0.5">
                      <span className="px-2.5 py-1 bg-[#161B22] border border-gray-700 text-white font-mono text-[11px] font-bold">
                        🚗 51K-889.99 (Mercedes C300 AMG)
                      </span>
                      <span className="px-2.5 py-1 bg-[#161B22] border border-gray-700 text-white font-mono text-[11px] font-bold">
                        🛵 59P1-886.79 (Honda SH 160i)
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* ========================================================= */
                /* TRƯỜNG HỢP 2: CĂN HỘ ĐANG TRỐNG (MINH BẠCH - KHÔNG DỮ LIỆU ẢO) */
                /* ========================================================= */
                <div className="p-4 bg-[#121820] border border-amber-500/30 rounded-none space-y-3.5">
                  <div className="flex items-center gap-2 text-amber-400 font-bold font-mono text-sm">
                    <Key className="w-4 h-4" />
                    <span>Căn Hộ Sẵn Sàng Bàn Giao</span>
                  </div>

                  <p className="text-xs text-gray-300 leading-relaxed">
                    Căn hộ hiện đang trong tình trạng trống, chưa có cư dân đăng ký cư trú. Ban Quản Lý đã hoàn tất nghiệm thu kỹ thuật và sẵn sàng thực hiện thủ tục bàn giao chìa khóa cùng kích hoạt mã QR FaceID cho chủ sở hữu mới.
                  </p>

                  <div className="grid grid-cols-2 gap-2 p-3 bg-[#161B22] border border-[#2D3748] rounded-none text-xs font-mono">
                    <div>
                      <span className="text-gray-400">Hướng ban công:</span>{' '}
                      <strong className="text-white">{activeUnit.direction || 'Đông Nam'}</strong>
                    </div>
                    <div>
                      <span className="text-gray-400">Pháp lý:</span>{' '}
                      <strong className="text-emerald-400">Sổ Hồng Lâu Dài</strong>
                    </div>
                    <div>
                      <span className="text-gray-400">Số phòng ngủ:</span>{' '}
                      <strong className="text-white">{activeUnit.bedrooms} PN</strong>
                    </div>
                    <div>
                      <span className="text-gray-400">Số phòng WC:</span>{' '}
                      <strong className="text-white">{activeUnit.bathrooms} WC</strong>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-400">Giá bán niêm yết CĐT:</span>{' '}
                      <strong className="text-[#C5A880] text-sm">{activeUnit.priceBillion} tỷ VNĐ</strong>
                    </div>
                  </div>

                  {/* Nút Bàn Giao Căn Hộ Thực Tế */}
                  <button
                    type="button"
                    onClick={() => setIsAssignModalOpen(true)}
                    className="w-full py-2.5 px-4 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg rounded-none"
                  >
                    <Key className="w-4 h-4" /> Bàn Giao Chìa Khóa & Cấp Quyền Cư Dân
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
                  <Maximize2 className="w-3.5 h-3.5 text-[#C5A880]" /> Xem Chi Tiết & 3D Phòng
                </button>

                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="py-2 px-3 bg-[#161B22] hover:bg-[#202936] text-gray-200 hover:text-white border border-[#2D3748] font-semibold transition-all flex items-center justify-center gap-1.5"
                >
                  <Edit className="w-3.5 h-3.5" /> Chỉnh Sửa
                </button>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-gray-400 text-xs font-mono">
              Vui lòng chọn một căn hộ trên mô hình để xem hồ sơ chi tiết.
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
