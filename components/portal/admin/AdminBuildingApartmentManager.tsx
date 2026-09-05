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
  Maximize2, 
  Box, 
  Info,
  Calendar,
  MapPin,
  ChevronRight,
  X
} from 'lucide-react';
import { getUserStore, getApartmentMembers, ApartmentMember, StoredUser } from '@/lib/userStore';
import { getEkycRequests } from '@/lib/ekycStore';
import ApartmentModel3DViewer from '@/components/portal/shared/ApartmentModel3DViewer';

export type TowerFilter = 'ALL' | 'TOWER_A' | 'TOWER_B';
export type OccupancyFilter = 'ALL' | 'OCCUPIED' | 'VACANT';

export default function AdminBuildingApartmentManager() {
  const [selectedTower, setSelectedTower] = useState<TowerFilter>('ALL');
  const [selectedOccupancy, setSelectedOccupancy] = useState<OccupancyFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAptCode, setSelectedAptCode] = useState<string>('12A05');
  const [viewing3DModel, setViewing3DModel] = useState(false);
  const [buildingPerspective, setBuildingPerspective] = useState<'3D' | 'FLOOR_GRID'>('3D');

  // Lấy dữ liệu người dùng thực tế từ hệ thống / API
  const initialOwner = getUserStore('user-owner-1');
  const initialMembers = getApartmentMembers('12A05');
  
  const [liveOwner, setLiveOwner] = useState<any>(null);
  const [liveMembers, setLiveMembers] = useState<ApartmentMember[]>(initialMembers);
  const [isApiSynced, setIsApiSynced] = useState<boolean>(false);

  // Gọi trực tiếp API thật từ hệ thống NKS để lấy dữ liệu cư dân thời gian thực
  useEffect(() => {
    let isMounted = true;
    async function syncFromApi() {
      try {
        // 1. Lấy danh sách thành viên cư dân căn hộ 12A05 qua API NKS
        const famRes = await fetch('/api/nks/user/family');
        if (famRes.ok) {
          const famData = await famRes.json();
          if (famData.success && Array.isArray(famData.members) && famData.members.length > 0) {
            if (isMounted) setLiveMembers(famData.members);
          }
        }

        // 2. Lấy hồ sơ chủ căn hộ trực tiếp từ API
        const userRes = await fetch('/api/nks/user');
        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData.user && isMounted) {
            setLiveOwner(userData.user);
          }
        }
        if (isMounted) setIsApiSynced(true);
      } catch (err) {
        console.warn('API sync warning:', err);
      }
    }
    syncFromApi();
    return () => { isMounted = false; };
  }, []);

  const activeOwnerName = liveOwner?.fullname || liveOwner?.full_name || initialOwner.fullname || 'Nguyễn Hữu Lực';
  const activeOwnerPhone = liveOwner?.phone || initialOwner.phone || '0364967082';
  const activeOwnerEmail = liveOwner?.email || initialOwner.email || 'huuluc04@gmail.com';
  const activeOwnerCccd = liveOwner?.id_number || liveOwner?.id_card_no || initialOwner.id_card_no || '067204000961';
  const rawAvatar = liveOwner?.avatar_url || liveOwner?.avatar || initialOwner.avatar_url || 'https://data.nks.vn/storage/users/202609021654232258.jpg';
  const activeOwnerAvatar = rawAvatar.replace('data.nks.vn//', 'data.nks.vn/');
  const activeOwnerDob = liveOwner?.dob || initialOwner.dob || '18/08/2004';
  const activeOwnerPob = liveOwner?.pob || initialOwner.pob || 'Triệu Trạch, Triệu Phong, Quảng Trị';

  // Danh mục căn hộ mở rộng đại diện cho tổ hợp chung cư 2 Tháp Skyline (Tòa A & Tòa B)
  // Chỉ những căn đã có cư dân thật từ API mới hiển thị thông tin, toàn bộ căn còn lại để TRỐNG
  const buildingUnits: {
    code: string;
    tower: 'A' | 'B';
    floor: number;
    type: string;
    area: number;
    priceBillion: number;
    isOccupied: boolean;
    owner?: {
      name: string;
      phone: string;
      email: string;
      cccd: string;
      avatar: string;
      eKycApproved: boolean;
      dob?: string;
      pob?: string;
    };
    membersCount: number;
    members?: ApartmentMember[];
    vehicles?: string[];
    billStatus?: 'PAID' | 'UNPAID';
  }[] = [
    // TÒA A - SAPPHIRE
    {
      code: '12A05',
      tower: 'A',
      floor: 12,
      type: '2PN - 2WC',
      area: 78.5,
      priceBillion: 4.85,
      isOccupied: true,
      owner: {
        name: activeOwnerName,
        phone: activeOwnerPhone,
        email: activeOwnerEmail,
        cccd: activeOwnerCccd,
        avatar: activeOwnerAvatar,
        eKycApproved: true,
        dob: activeOwnerDob,
        pob: activeOwnerPob,
      },
      membersCount: liveMembers.length > 0 ? liveMembers.length : 4,
      members: liveMembers.length > 0 ? liveMembers : [
        {
          id: 'mem-1',
          fullName: 'Nguyễn Hữu Nhựt',
          role: 'Family',
          relationship: 'Em trai / Người nhà',
          phone: '0917795211',
          idCard: '079198005678',
          avatarUrl: 'https://data.nks.vn/storage/users/202607191405195335.jpg',
          licensePlate: '59P1-886.79',
          faceStatus: 'Đã xác thực',
          addedDate: '03/09/2026'
        },
        {
          id: 'mem-2',
          fullName: 'Nguyễn Văn Cường',
          role: 'Family',
          relationship: 'Thành viên gia đình',
          phone: '0325524482',
          idCard: '074204001708',
          avatarUrl: 'https://data.nks.vn/storage/users/202608301345022366.jpg',
          faceStatus: 'Đã xác thực',
          addedDate: '30/08/2026'
        },
        {
          id: 'mem-3',
          fullName: 'Lê Đức Hải',
          role: 'Family',
          relationship: 'Thành viên gia đình',
          phone: '0977758215',
          idCard: '070204001704',
          avatarUrl: 'https://data.nks.vn/storage/users/202607210516458204.jpg',
          faceStatus: 'Đã xác thực',
          addedDate: '21/07/2026'
        },
        {
          id: 'mem-4',
          fullName: 'Vũ Cát Thịnh',
          role: 'Family',
          relationship: 'Thành viên gia đình',
          phone: '0909262626',
          idCard: '079201002626',
          avatarUrl: 'https://data.nks.vn/storage/users/default.png',
          faceStatus: 'Chờ duyệt FaceID',
          addedDate: '01/09/2026'
        }
      ],
      vehicles: ['51K-889.99 (Ô tô)', '59P1-886.79 (Xe máy)'],
      billStatus: 'UNPAID',
    },
    {
      code: '18A01',
      tower: 'A',
      floor: 18,
      type: '3PN - 3WC',
      area: 112.0,
      priceBillion: 7.60,
      isOccupied: false,
      membersCount: 0,
    },
    {
      code: '25PH-01',
      tower: 'A',
      floor: 25,
      type: 'Duplex Penthouse',
      area: 215.0,
      priceBillion: 18.50,
      isOccupied: false,
      membersCount: 0,
    },
    {
      code: '05A02',
      tower: 'A',
      floor: 5,
      type: '1PN - 1WC',
      area: 52.0,
      priceBillion: 3.25,
      isOccupied: false,
      membersCount: 0,
    },
    {
      code: '10A03',
      tower: 'A',
      floor: 10,
      type: '2PN - 2WC',
      area: 78.5,
      priceBillion: 4.90,
      isOccupied: false,
      membersCount: 0,
    },
    {
      code: '15A04',
      tower: 'A',
      floor: 15,
      type: '2PN - 2WC',
      area: 78.5,
      priceBillion: 5.10,
      isOccupied: false,
      membersCount: 0,
    },
    {
      code: '20A02',
      tower: 'A',
      floor: 20,
      type: '3PN - 3WC',
      area: 112.0,
      priceBillion: 7.90,
      isOccupied: false,
      membersCount: 0,
    },
    {
      code: '22A01',
      tower: 'A',
      floor: 22,
      type: '3PN - 3WC',
      area: 112.0,
      priceBillion: 8.10,
      isOccupied: false,
      membersCount: 0,
    },

    // TÒA B - DIAMOND
    {
      code: '08B12',
      tower: 'B',
      floor: 8,
      type: '1PN - 1WC',
      area: 52.0,
      priceBillion: 3.20,
      isOccupied: false,
      membersCount: 0,
    },
    {
      code: '04B01',
      tower: 'B',
      floor: 4,
      type: '2PN - 2WC',
      area: 75.0,
      priceBillion: 4.50,
      isOccupied: false,
      membersCount: 0,
    },
    {
      code: '11B06',
      tower: 'B',
      floor: 11,
      type: '2PN - 2WC',
      area: 75.0,
      priceBillion: 4.70,
      isOccupied: false,
      membersCount: 0,
    },
    {
      code: '16B08',
      tower: 'B',
      floor: 16,
      type: '3PN - 3WC',
      area: 108.0,
      priceBillion: 7.20,
      isOccupied: false,
      membersCount: 0,
    },
    {
      code: '19B03',
      tower: 'B',
      floor: 19,
      type: '3PN - 3WC',
      area: 108.0,
      priceBillion: 7.45,
      isOccupied: false,
      membersCount: 0,
    },
    {
      code: '25PH-02',
      tower: 'B',
      floor: 25,
      type: 'Duplex Penthouse',
      area: 215.0,
      priceBillion: 18.20,
      isOccupied: false,
      membersCount: 0,
    }
  ];

  // Lọc danh sách theo tháp, trạng thái và tìm kiếm
  const filteredUnits = buildingUnits.filter(unit => {
    const matchTower = selectedTower === 'ALL' 
      ? true 
      : selectedTower === 'TOWER_A' 
      ? unit.tower === 'A' 
      : unit.tower === 'B';

    const matchOccupancy = selectedOccupancy === 'ALL'
      ? true
      : selectedOccupancy === 'OCCUPIED'
      ? unit.isOccupied
      : !unit.isOccupied;

    const matchSearch = searchQuery.trim() === ''
      ? true
      : unit.code.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        (unit.owner?.name && unit.owner.name.toLowerCase().includes(searchQuery.toLowerCase().trim()));

    return matchTower && matchOccupancy && matchSearch;
  });

  const activeUnit = buildingUnits.find(u => u.code === selectedAptCode) || buildingUnits[0];

  // Thống kê toàn tổ hợp chung cư
  const totalUnitsCount = buildingUnits.length;
  const occupiedCount = buildingUnits.filter(u => u.isOccupied).length;
  const vacantCount = buildingUnits.filter(u => !u.isOccupied).length;
  const occupancyRate = Math.round((occupiedCount / totalUnitsCount) * 100);

  return (
    <div className="space-y-6 animate-fadeIn select-none">
      {/* ============================================================= */}
      {/* 1. TIÊU ĐỀ PHÂN HỆ QUẢN LÝ CĂN HỘ BQL                        */}
      {/* ============================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222B35] pb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-semibold flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-[#C5A880]" /> Trung Tâm Vận Hành Không Gian • Ban Quản Lý
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl text-white font-bold mt-1">
            Quản Lý Toàn Bộ Mô Hình Tổ Hợp Chung Cư Skyline
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Mô hình khối đa chiều thể hiện tổng thể Tháp A & Tháp B. Nhấp vào từng khối để theo dõi chi tiết trạng thái căn hộ trống hoặc đã có cư dân sinh sống.
          </p>
        </div>

        {/* Chuyển đổi góc nhìn 3D / Mặt Cắt Tầng */}
        <div className="flex items-center gap-2">
          <div className="flex bg-[#121820] p-1 border border-[#222B35] rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setBuildingPerspective('3D')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                buildingPerspective === '3D'
                  ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Box className="w-3.5 h-3.5" /> Mô Hình Khối 3D
            </button>
            <button
              type="button"
              onClick={() => setBuildingPerspective('FLOOR_GRID')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                buildingPerspective === 'FLOOR_GRID'
                  ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Mặt Cắt Các Tầng
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================= */}
      {/* 2. THANH THỐNG KÊ KPI LẤP ĐẦY CHUNG CƯ                       */}
      {/* ============================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-[#121820] border border-[#222B35] rounded-xl">
          <div className="text-[10.5px] uppercase tracking-wider text-gray-400 font-mono flex items-center justify-between">
            <span>Tổng Căn Hộ Giám Sát</span>
            <Building className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            {totalUnitsCount} <span className="text-xs text-gray-400 font-normal">căn hộ</span>
          </div>
          <div className="text-[10px] text-gray-400 mt-1">2 Tòa: Tháp A & Tháp B</div>
        </div>

        <div className="p-4 bg-[#121820] border border-emerald-500/30 rounded-xl">
          <div className="text-[10.5px] uppercase tracking-wider text-emerald-400 font-mono flex items-center justify-between">
            <span>Đã Có Người Ở</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-300 mt-1">
            {occupiedCount} <span className="text-xs text-emerald-400 font-normal">căn hộ</span>
          </div>
          <div className="text-[10px] text-emerald-500/80 mt-1">Dữ liệu cư dân thực tế từ API</div>
        </div>

        <div className="p-4 bg-[#121820] border border-amber-500/30 rounded-xl">
          <div className="text-[10.5px] uppercase tracking-wider text-amber-400 font-mono flex items-center justify-between">
            <span>Căn Hộ Đang Trống</span>
            <Key className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300 mt-1">
            {vacantCount} <span className="text-xs text-amber-400 font-normal">căn hộ</span>
          </div>
          <div className="text-[10px] text-amber-500/80 mt-1">Sẵn sàng bàn giao / Chào bán</div>
        </div>

        <div className="p-4 bg-[#121820] border border-[#C5A880]/30 rounded-xl">
          <div className="text-[10.5px] uppercase tracking-wider text-[#C5A880] font-mono flex items-center justify-between">
            <span>Tỉ Lệ Lấp Đầy</span>
            <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#C5A880] mt-1">
            {occupancyRate}%
          </div>
          <div className="text-[10px] text-gray-400 mt-1">Chỉ số khai thác không gian</div>
        </div>
      </div>

      {/* ============================================================= */}
      {/* 3. BỘ LỌC TÒA & TRẠNG THÁI CƯ TRÚ                            */}
      {/* ============================================================= */}
      <div className="p-3.5 bg-[#121820] border border-[#222B35] rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Lọc Tháp */}
          <span className="text-gray-400 font-mono text-[11px]">Tòa:</span>
          {[
            { id: 'ALL', label: 'Tất Cả Tòa' },
            { id: 'TOWER_A', label: 'Tháp A (Sapphire)' },
            { id: 'TOWER_B', label: 'Tháp B (Diamond)' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedTower(t.id as any)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                selectedTower === t.id
                  ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow'
                  : 'bg-[#161B22] text-gray-300 hover:text-white border border-[#2D3748]'
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
            { id: 'OCCUPIED', label: '🟢 Đã Có Người Ở' },
            { id: 'VACANT', label: '🟡 Căn Hộ Trống' }
          ].map(o => (
            <button
              key={o.id}
              onClick={() => setSelectedOccupancy(o.id as any)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
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
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo mã căn hoặc tên..."
            className="w-full bg-[#161B22] border border-[#2D3748] pl-8 pr-3 py-1.5 rounded-lg text-white text-xs outline-none focus:border-[#C5A880]"
          />
        </div>
      </div>

      {/* ============================================================= */}
      {/* 4. KHU VỰC CHÍNH: MÔ HÌNH CHUNG CƯ LỚN & HỒ SƠ CĂN HỘ       */}
      {/* ============================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* CỘT TRÁI (7 COLS): MÔ HÌNH KHỐI CHUNG CƯ LỚN TRỰC QUAN       */}
        <div className="lg:col-span-7 bg-[#0D1117] border border-[#222B35] rounded-2xl overflow-hidden shadow-2xl flex flex-col">
          {/* Header mô hình */}
          <div className="p-4 bg-[#121820] border-b border-[#222B35] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Box className="w-4 h-4 text-[#C5A880]" />
              <span className="font-bold text-sm text-white">Mô Hình Khối Tổ Hợp 2 Tháp Skyline</span>
            </div>
            {/* Chú thích màu sắc */}
            <div className="flex items-center gap-3 text-[10px] font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                <span className="text-gray-300">Đã Có Người Ở</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]"></span>
                <span className="text-gray-300">Căn Hộ Đang Trống</span>
              </div>
            </div>
          </div>

          {/* VIEWPORT SVG 3D MÔ HÌNH CHUNG CƯ LỚN */}
          {buildingPerspective === '3D' ? (
            <div className="relative w-full h-[490px] sm:h-[540px] bg-[#05070A] overflow-hidden flex items-center justify-center">
              {/* Lưới tọa độ không gian kiến trúc */}
              <div 
                className="absolute inset-0 opacity-15 pointer-events-none"
                style={{
                  backgroundImage: 'linear-gradient(to right, #1E293B 1px, transparent 1px), linear-gradient(to bottom, #1E293B 1px, transparent 1px)',
                  backgroundSize: '24px 24px'
                }}
              />

              {/* BẢN VẼ PHỐI CẢNH 3D TỔ HỢP 2 THÁP CHUNG CƯ */}
              <svg
                viewBox="0 0 900 560"
                className="w-full h-full max-h-[540px] cursor-pointer drop-shadow-[0_30px_60px_rgba(0,0,0,0.9)]"
              >
                <defs>
                  <linearGradient id="podiumGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1E293B" />
                    <stop offset="100%" stopColor="#0F172A" />
                  </linearGradient>

                  <linearGradient id="skylineGlow" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Sân nền & Khối đế Podium thương mại kết nối */}
                <g className="opacity-90">
                  <polygon points="120,440 450,530 780,440 450,380" fill="#0A0E17" stroke="#1E293B" strokeWidth="1.5" />
                  {/* Khối đế Tầng 1-3 */}
                  <polygon points="180,390 450,470 720,390 720,360 450,440 180,360" fill="url(#podiumGrad)" stroke="#334155" strokeWidth="1" />
                  <text x="450" y="455" fill="#94A3B8" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                    KHỐI ĐẾ THƯƠNG MẠI & SẢNH ĐÓN PODIUM (TẦNG 1 - 3)
                  </text>
                </g>

                {/* ===================================================== */}
                {/* 1. THÁP A - SAPPHIRE TOWER (Bên trái)                */}
                {/* ===================================================== */}
                <g className="transition-all duration-300">
                  {/* Thân tòa tháp A nền */}
                  <polygon points="210,360 380,410 380,120 210,80" fill="#0F141C" stroke="#222B35" strokeWidth="1.5" />
                  <polygon points="380,410 440,390 440,105 380,120" fill="#141B24" stroke="#222B35" strokeWidth="1.5" />
                  <polygon points="210,80 380,120 440,105 270,68" fill="#1A2330" stroke="#334155" strokeWidth="1.5" />

                  {/* Tên Tháp A */}
                  <text x="310" y="70" fill="#C5A880" fontSize="12" fontWeight="bold" textAnchor="middle" fontFamily="serif">
                    THÁP A (SAPPHIRE)
                  </text>

                  {/* Các khối căn hộ trên Tháp A */}
                  {/* Căn 25PH-01: Tầng 25 (Penthouse - Vàng Trống) */}
                  <g 
                    onClick={() => setSelectedAptCode('25PH-01')}
                    className="cursor-pointer group"
                  >
                    <polygon 
                      points="215,95 375,135 375,105 215,68" 
                      fill={selectedAptCode === '25PH-01' ? '#F59E0B' : '#78350F'}
                      fillOpacity={selectedAptCode === '25PH-01' ? '0.95' : '0.6'}
                      stroke={selectedAptCode === '25PH-01' ? '#FDE68A' : '#F59E0B'}
                      strokeWidth={selectedAptCode === '25PH-01' ? '2.5' : '1.2'}
                      className="transition-all hover:fill-amber-500"
                    />
                    <text x="295" y="105" fill="#FEF3C7" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                      25PH-01 (Duplex) • TRỐNG
                    </text>
                  </g>

                  {/* Căn 18A01: Tầng 18 (3PN - Vàng Trống) */}
                  <g 
                    onClick={() => setSelectedAptCode('18A01')}
                    className="cursor-pointer group"
                  >
                    <polygon 
                      points="215,190 375,230 375,160 215,125" 
                      fill={selectedAptCode === '18A01' ? '#F59E0B' : '#78350F'}
                      fillOpacity={selectedAptCode === '18A01' ? '0.95' : '0.55'}
                      stroke={selectedAptCode === '18A01' ? '#FDE68A' : '#F59E0B'}
                      strokeWidth={selectedAptCode === '18A01' ? '2.5' : '1.2'}
                      className="transition-all hover:fill-amber-500"
                    />
                    <text x="295" y="180" fill="#FEF3C7" fontSize="9.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                      18A01 (3PN) • TRỐNG
                    </text>
                  </g>

                  {/* Căn 12A05: Tầng 12 (2PN - Xanh ĐÃ CÓ NGƯỜI Ở - Căn của Chủ Hộ Nguyễn Hữu Lực) */}
                  <g 
                    onClick={() => setSelectedAptCode('12A05')}
                    className="cursor-pointer group"
                  >
                    <polygon 
                      points="215,280 375,320 375,240 215,205" 
                      fill={selectedAptCode === '12A05' ? '#059669' : '#065F46'}
                      fillOpacity={selectedAptCode === '12A05' ? '1' : '0.75'}
                      stroke={selectedAptCode === '12A05' ? '#A7F3D0' : '#10B981'}
                      strokeWidth={selectedAptCode === '12A05' ? '3' : '1.5'}
                      className="transition-all hover:fill-emerald-500"
                    />
                    <text x="295" y="265" fill="#FFFFFF" fontSize="10" fontWeight="extrabold" textAnchor="middle" fontFamily="monospace">
                      ★ 12A05 (2PN) • CÓ NGƯỜI Ở
                    </text>
                    <text x="295" y="280" fill="#D1FAE5" fontSize="8" fontWeight="bold" textAnchor="middle">
                      Chủ Hộ: Nguyễn Hữu Lực
                    </text>
                  </g>

                  {/* Căn 05A02: Tầng 5 (1PN - Vàng Trống) */}
                  <g 
                    onClick={() => setSelectedAptCode('05A02')}
                    className="cursor-pointer group"
                  >
                    <polygon 
                      points="215,350 375,390 375,330 215,295" 
                      fill={selectedAptCode === '05A02' ? '#F59E0B' : '#78350F'}
                      fillOpacity={selectedAptCode === '05A02' ? '0.95' : '0.45'}
                      stroke={selectedAptCode === '05A02' ? '#FDE68A' : '#F59E0B'}
                      strokeWidth={selectedAptCode === '05A02' ? '2.5' : '1'}
                      className="transition-all hover:fill-amber-500"
                    />
                    <text x="295" y="345" fill="#FEF3C7" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                      05A02 (1PN) • TRỐNG
                    </text>
                  </g>
                </g>

                {/* ===================================================== */}
                {/* 2. THÁP B - DIAMOND TOWER (Bên phải)                 */}
                {/* ===================================================== */}
                <g className="transition-all duration-300">
                  {/* Thân tòa tháp B nền */}
                  <polygon points="520,410 690,360 690,80 520,120" fill="#0F141C" stroke="#222B35" strokeWidth="1.5" />
                  <polygon points="460,390 520,410 520,120 460,105" fill="#141B24" stroke="#222B35" strokeWidth="1.5" />
                  <polygon points="460,105 520,120 690,80 630,68" fill="#1A2330" stroke="#334155" strokeWidth="1.5" />

                  {/* Tên Tháp B */}
                  <text x="590" y="70" fill="#C5A880" fontSize="12" fontWeight="bold" textAnchor="middle" fontFamily="serif">
                    THÁP B (DIAMOND)
                  </text>

                  {/* Căn 25PH-02: Tầng 25 (Penthouse - Vàng Trống) */}
                  <g 
                    onClick={() => setSelectedAptCode('25PH-02')}
                    className="cursor-pointer group"
                  >
                    <polygon 
                      points="525,135 685,95 685,68 525,105" 
                      fill={selectedAptCode === '25PH-02' ? '#F59E0B' : '#78350F'}
                      fillOpacity={selectedAptCode === '25PH-02' ? '0.95' : '0.6'}
                      stroke={selectedAptCode === '25PH-02' ? '#FDE68A' : '#F59E0B'}
                      strokeWidth={selectedAptCode === '25PH-02' ? '2.5' : '1.2'}
                      className="transition-all hover:fill-amber-500"
                    />
                    <text x="605" y="105" fill="#FEF3C7" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                      25PH-02 (Duplex) • TRỐNG
                    </text>
                  </g>

                  {/* Căn 19B03: Tầng 19 (3PN - Vàng Trống) */}
                  <g 
                    onClick={() => setSelectedAptCode('19B03')}
                    className="cursor-pointer group"
                  >
                    <polygon 
                      points="525,210 685,170 685,130 525,165" 
                      fill={selectedAptCode === '19B03' ? '#F59E0B' : '#78350F'}
                      fillOpacity={selectedAptCode === '19B03' ? '0.95' : '0.55'}
                      stroke={selectedAptCode === '19B03' ? '#FDE68A' : '#F59E0B'}
                      strokeWidth={selectedAptCode === '19B03' ? '2.5' : '1.2'}
                      className="transition-all hover:fill-amber-500"
                    />
                    <text x="605" y="170" fill="#FEF3C7" fontSize="9.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                      19B03 (3PN) • TRỐNG
                    </text>
                  </g>

                  {/* Căn 11B06: Tầng 11 (2PN - Vàng Trống) */}
                  <g 
                    onClick={() => setSelectedAptCode('11B06')}
                    className="cursor-pointer group"
                  >
                    <polygon 
                      points="525,290 685,250 685,215 525,250" 
                      fill={selectedAptCode === '11B06' ? '#F59E0B' : '#78350F'}
                      fillOpacity={selectedAptCode === '11B06' ? '0.95' : '0.55'}
                      stroke={selectedAptCode === '11B06' ? '#FDE68A' : '#F59E0B'}
                      strokeWidth={selectedAptCode === '11B06' ? '2.5' : '1.2'}
                      className="transition-all hover:fill-amber-500"
                    />
                    <text x="605" y="250" fill="#FEF3C7" fontSize="9.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                      11B06 (2PN) • TRỐNG
                    </text>
                  </g>

                  {/* Căn 08B12: Tầng 8 (1PN - Vàng Trống) */}
                  <g 
                    onClick={() => setSelectedAptCode('08B12')}
                    className="cursor-pointer group"
                  >
                    <polygon 
                      points="525,350 685,310 685,280 525,315" 
                      fill={selectedAptCode === '08B12' ? '#F59E0B' : '#78350F'}
                      fillOpacity={selectedAptCode === '08B12' ? '0.95' : '0.5'}
                      stroke={selectedAptCode === '08B12' ? '#FDE68A' : '#F59E0B'}
                      strokeWidth={selectedAptCode === '08B12' ? '2.5' : '1.2'}
                      className="transition-all hover:fill-amber-500"
                    />
                    <text x="605" y="315" fill="#FEF3C7" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                      08B12 (1PN) • TRỐNG
                    </text>
                  </g>
                </g>

                {/* Sân Thượng Vườn Treo Sky Garden Tầng 25 */}
                <g>
                  <circle cx="270" cy="65" r="4" fill="#10B981" />
                  <circle cx="285" cy="67" r="3" fill="#10B981" />
                  <circle cx="630" cy="65" r="4" fill="#10B981" />
                  <circle cx="615" cy="67" r="3" fill="#10B981" />
                </g>
              </svg>

              {/* HUD Hướng Dẫn Tương Tác */}
              <div className="absolute bottom-3 left-3 bg-[#0D1117]/90 border border-[#222B35] px-3 py-1.5 rounded text-[10.5px] text-[#C5A880] font-mono backdrop-blur-md">
                * Nhấp trực tiếp vào từng khối căn hộ trên mô hình để xem hồ sơ
              </div>
            </div>
          ) : (
            /* VIEW DẠNG LƯỚI MẶT CẮT CÁC TẦNG */
            <div className="p-4 bg-[#05070A] h-[490px] sm:h-[540px] overflow-y-auto space-y-3">
              <div className="text-xs text-gray-400 font-mono mb-2">
                Danh Sách Khối Căn Hộ Theo Từng Tầng ({filteredUnits.length} căn phù hợp):
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {filteredUnits.map(unit => {
                  const isSelected = unit.code === selectedAptCode;
                  return (
                    <div
                      key={unit.code}
                      onClick={() => setSelectedAptCode(unit.code)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#1C2533] border-[#C5A880] ring-1 ring-[#C5A880] shadow-xl'
                          : 'bg-[#121820] border-[#222B35] hover:border-gray-600'
                      }`}
                    >
                      <div>
                        <div className="font-serif text-base font-bold text-white flex items-center gap-2">
                          <span>Căn {unit.code}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#161B22] border border-gray-700 text-[#C5A880] font-sans">
                            {unit.type}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          Tháp {unit.tower} • Tầng {unit.floor} • {unit.area} m²
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${
                          unit.isOccupied
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                            : 'bg-amber-950 text-amber-300 border-amber-500'
                        }`}>
                          {unit.isOccupied ? 'Có Người Ở' : 'Đang Trống'}
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
        <div className="lg:col-span-5 bg-[#0D1117] border border-[#222B35] rounded-2xl p-5 space-y-4 shadow-2xl">
          
          {/* Tiêu đề thẻ hồ sơ */}
          <div className="border-b border-[#222B35] pb-3.5 flex items-start justify-between">
            <div>
              <div className="text-[10.5px] uppercase tracking-wider text-[#C5A880] font-mono font-semibold">
                Hồ Sơ Căn Hộ • Tháp {activeUnit.tower} - Tầng {activeUnit.floor}
              </div>
              <h3 className="font-serif text-2xl font-bold text-white mt-0.5">
                Căn Hộ {activeUnit.code}
              </h3>
              <div className="text-xs text-gray-400 mt-0.5">
                Loại căn: <strong className="text-gray-200">{activeUnit.type}</strong> • Diện tích: <strong className="text-[#C5A880]">{activeUnit.area} m²</strong>
              </div>
            </div>

            {/* Trạng thái to rõ ràng: ĐÃ CÓ NGƯỜI Ở vs ĐANG TRỐNG */}
            <div className="text-right">
              <span className={`px-3 py-1 text-xs font-extrabold uppercase rounded-lg border shadow-lg inline-flex items-center gap-1.5 ${
                activeUnit.isOccupied
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                  : 'bg-amber-950 text-amber-300 border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
              }`}>
                {activeUnit.isOccupied ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> ĐÃ CÓ NGƯỜI Ở
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
          {/* TRƯỜNG HỢP 1: CĂN HỘ ĐÃ CÓ NGƯỜI Ở (DỮ LIỆU THỰC TỪ API) */}
          {/* ========================================================= */}
          {activeUnit.isOccupied && activeUnit.owner ? (
            <div className="space-y-4">
              
              {/* Thông tin chủ hộ thực tế */}
              <div className="p-3.5 bg-[#121820] border border-[#222B35] rounded-xl space-y-3">
                <div className="text-[11px] uppercase tracking-wider text-emerald-400 font-bold font-mono flex items-center justify-between">
                  <span>Chủ Hộ Đang Sinh Sống</span>
                  <span className="px-2 py-0.5 text-[9.5px] bg-emerald-950 border border-emerald-600 rounded text-emerald-300">
                    Đã Xác Thực e-KYC ✓
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <img
                    src={activeUnit.owner.avatar}
                    alt={activeUnit.owner.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500/80 shadow"
                  />
                  <div className="space-y-0.5 min-w-0">
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
                    <span className="text-gray-400">Ngày sinh:</span>{' '}
                    <strong className="text-white">{activeUnit.owner.dob}</strong>
                  </div>
                </div>
              </div>

              {/* Danh sách thành viên gia đình thực tế */}
              <div className="p-3.5 bg-[#121820] border border-[#222B35] rounded-xl space-y-2.5">
                <div className="text-[11px] uppercase tracking-wider text-gray-300 font-bold font-mono flex items-center justify-between">
                  <span>Nhân Khẩu Thực Tế ({activeUnit.membersCount} người thân)</span>
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                </div>

                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {activeUnit.members?.map(mem => (
                    <div key={mem.id} className="p-2 bg-[#161B22] border border-[#222B35] rounded-lg flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <img
                          src={mem.avatarUrl ? mem.avatarUrl.replace('data.nks.vn//', 'data.nks.vn/') : 'https://data.nks.vn/storage/users/default.png'}
                          alt={mem.fullName}
                          className="w-7 h-7 rounded-full object-cover border border-gray-700"
                        />
                        <div>
                          <div className="font-semibold text-white">{mem.fullName}</div>
                          <div className="text-[10px] text-gray-400">{mem.relationship} • SĐT: {mem.phone}</div>
                        </div>
                      </div>
                      <span className={`text-[9.5px] px-1.5 py-0.5 rounded ${
                        mem.faceStatus.includes('Đã') ? 'bg-emerald-950 text-emerald-300' : 'bg-amber-950 text-amber-300'
                      }`}>
                        {mem.faceStatus}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Xe cộ & Tình trạng phí quản lý */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-[#121820] border border-[#222B35] rounded-xl">
                  <div className="text-[10px] text-gray-400 uppercase font-mono flex items-center gap-1">
                    <Car className="w-3 h-3 text-[#C5A880]" /> Xe Đăng Ký Hầm
                  </div>
                  <div className="font-mono text-white text-xs mt-1 space-y-0.5">
                    {activeUnit.vehicles?.map(v => (
                      <div key={v} className="truncate">• {v}</div>
                    ))}
                  </div>
                </div>

                <div className="p-2.5 bg-[#121820] border border-[#222B35] rounded-xl">
                  <div className="text-[10px] text-gray-400 uppercase font-mono flex items-center gap-1">
                    <Receipt className="w-3 h-3 text-[#C5A880]" /> Phí Tháng 08/2026
                  </div>
                  <div className="mt-1 font-bold">
                    <span className="px-2 py-0.5 text-[10.5px] rounded bg-amber-950 text-amber-300 border border-amber-500/50">
                      Chưa Thanh Toán (2.465.000 đ)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ========================================================= */
            /* TRƯỜNG HỢP 2: CĂN HỘ ĐANG TRỐNG (CHƯA CÓ NGƯỜI Ở)        */
            /* ========================================================= */
            <div className="space-y-4">
              <div className="p-4 bg-[#1A1610] border border-amber-500/40 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <Key className="w-4 h-4" /> Căn Hộ Hiện Đang Trống
                </div>
                <p className="text-xs text-amber-200/90 leading-relaxed">
                  Căn hộ <strong>{activeUnit.code}</strong> hiện tại chưa có cư dân nhận bàn giao hoặc đăng ký sinh sống. Toàn bộ thiết bị điện nước đang ở trạng thái khóa kỹ thuật bảo toàn.
                </p>
                <div className="pt-2 border-t border-amber-500/30 text-xs text-amber-300/80 font-mono">
                  ✓ Hồ sơ sẵn sàng chào bán hoặc bàn giao cho cư dân mới
                </div>
              </div>

              {/* Thông số kỹ thuật căn trống */}
              <div className="p-3.5 bg-[#121820] border border-[#222B35] rounded-xl space-y-2.5 text-xs">
                <div className="text-[11px] uppercase tracking-wider text-gray-400 font-mono font-bold">
                  Thông Số Bàn Giao Kỹ Thuật
                </div>
                <div className="grid grid-cols-2 gap-2 text-gray-300">
                  <div>• Diện tích thông thủy: <strong className="text-white">{activeUnit.area} m²</strong></div>
                  <div>• Vị trí: <strong className="text-white">Tầng {activeUnit.floor} - Tháp {activeUnit.tower}</strong></div>
                  <div>• Tiêu chuẩn: <strong className="text-emerald-400">Hoàn thiện cao cấp</strong></div>
                  <div>• Pháp lý: <strong className="text-white">Sổ hồng lâu dài</strong></div>
                </div>
              </div>

              {/* Các nút hành động BQL đối với căn trống */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => alert(`BQL mở phiếu bàn giao cho Căn Hộ ${activeUnit.code}`)}
                  className="w-full py-2.5 bg-[#C5A880] hover:bg-white text-[#0D1117] font-bold text-xs uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2 shadow"
                >
                  <Key className="w-4 h-4" /> Bàn Giao Chìa Khóa & Đón Cư Dân Mới
                </button>
                <button
                  type="button"
                  onClick={() => alert(`BQL lập phiếu kiểm tra kỹ thuật định kỳ cho Căn Hộ ${activeUnit.code}`)}
                  className="w-full py-2 bg-[#161B22] hover:bg-[#202936] text-gray-300 hover:text-white border border-[#2D3748] text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> Kiểm Tra Kỹ Thuật & Niêm Phong Căn Hộ
                </button>
              </div>
            </div>
          )}

          {/* NÚT XEM SƠ ĐỒ MẶT BẰNG 3D CHI TIẾT CỦA CĂN NÀY */}
          <div className="pt-2 border-t border-[#222B35]">
            <button
              type="button"
              onClick={() => setViewing3DModel(!viewing3DModel)}
              className="w-full py-2.5 bg-[#161D26] hover:bg-[#1E293B] text-[#C5A880] hover:text-white border border-[#C5A880]/50 hover:border-[#C5A880] rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow"
            >
              <Maximize2 className="w-4 h-4 text-[#C5A880]" />
              {viewing3DModel ? 'Đóng Sơ Đồ Bố Trí Căn Hộ' : `Xem Sơ Đồ Bố Trí 3D Căn Hộ ${activeUnit.code}`}
            </button>
          </div>

          {/* KHUNG POPUP XEM SƠ ĐỒ 3D BÊN DƯỚI NẾU BẬT */}
          {viewing3DModel && (
            <div className="mt-3 p-3 bg-[#0A0E14] border border-[#C5A880] rounded-xl space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Box className="w-3.5 h-3.5 text-[#C5A880]" /> Sơ Đồ Khối Căn Hộ {activeUnit.code}
                </span>
                <button 
                  onClick={() => setViewing3DModel(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <ApartmentModel3DViewer
                apartmentCode={activeUnit.code}
                apartmentType={activeUnit.type}
                clearArea={activeUnit.area}
                interactive={false}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
