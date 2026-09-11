'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Building2,
  Droplets,
  Coins,
  TrendingUp,
  Gauge,
  Minimize2,
  Sun,
  Wind,
  Download,
  Send,
  ArrowUpRight,
  Activity
} from 'lucide-react';
import { 
  getApartmentUnits, 
  getApartmentByCode, 
  ApartmentUnit, 
  ApartmentResidentOwner,
  ApartmentType,
  ApartmentStatus,
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

// Danh sách các khối căn hộ kiến trúc hiển thị trên mô hình 3D (25 tầng chung cư Skyline)
export const BUILDING_3D_UNITS: {
  code: string;
  floor: number;
  side: 'LEFT' | 'RIGHT';
  type: ApartmentType;
  defaultStatus: ApartmentStatus;
  area: number;
  defaultName?: string;
}[] = [
  // Tầng 25 (Penthouse)
  { code: '25PH-01', floor: 25, side: 'LEFT', type: 'DUPLEX_PENTHOUSE', defaultStatus: 'VACANT', area: 215, defaultName: 'Nhà Trống' },
  { code: '25PH-02', floor: 25, side: 'RIGHT', type: 'DUPLEX_PENTHOUSE', defaultStatus: 'VACANT', area: 215, defaultName: 'Nhà Trống' },
  // Tầng 24
  { code: '24A01', floor: 24, side: 'LEFT', type: '3PN', defaultStatus: 'VACANT', area: 112, defaultName: 'Nhà Trống' },
  { code: '24A02', floor: 24, side: 'RIGHT', type: '2PN', defaultStatus: 'VACANT', area: 78.5, defaultName: 'Nhà Trống' },
  // Tầng 23
  { code: '23A01', floor: 23, side: 'LEFT', type: '3PN', defaultStatus: 'VACANT', area: 112, defaultName: 'Nhà Trống' },
  { code: '23A02', floor: 23, side: 'RIGHT', type: '2PN', defaultStatus: 'VACANT', area: 75, defaultName: 'Nhà Trống' },
  // Tầng 22
  { code: '22A01', floor: 22, side: 'LEFT', type: '3PN', defaultStatus: 'VACANT', area: 112, defaultName: 'Nhà Trống' },
  { code: '22A02', floor: 22, side: 'RIGHT', type: '2PN', defaultStatus: 'VACANT', area: 75, defaultName: 'Nhà Trống' },
  // Tầng 21
  { code: '21A01', floor: 21, side: 'LEFT', type: '2PN', defaultStatus: 'VACANT', area: 78.5, defaultName: 'Nhà Trống' },
  { code: '21A02', floor: 21, side: 'RIGHT', type: '1PN', defaultStatus: 'VACANT', area: 52, defaultName: 'Nhà Trống' },
  // Tầng 20
  { code: '20A01', floor: 20, side: 'LEFT', type: '2PN', defaultStatus: 'VACANT', area: 78.5, defaultName: 'Nhà Trống' },
  { code: '20A02', floor: 20, side: 'RIGHT', type: '3PN', defaultStatus: 'VACANT', area: 112, defaultName: 'Nhà Trống' },
  // Tầng 19
  { code: '19A01', floor: 19, side: 'LEFT', type: '3PN', defaultStatus: 'VACANT', area: 108, defaultName: 'Nhà Trống' },
  { code: '19A02', floor: 19, side: 'RIGHT', type: '2PN', defaultStatus: 'VACANT', area: 75, defaultName: 'Nhà Trống' },
  // Tầng 18
  { code: '18A01', floor: 18, side: 'LEFT', type: '3PN', defaultStatus: 'VACANT', area: 112, defaultName: 'Nhà Trống' },
  { code: '18A02', floor: 18, side: 'RIGHT', type: '2PN', defaultStatus: 'VACANT', area: 75, defaultName: 'Nhà Trống' },
  // Tầng 17
  { code: '17A01', floor: 17, side: 'LEFT', type: '2PN', defaultStatus: 'VACANT', area: 78.5, defaultName: 'Nhà Trống' },
  { code: '17A02', floor: 17, side: 'RIGHT', type: '1PN', defaultStatus: 'VACANT', area: 52, defaultName: 'Nhà Trống' },
  // Tầng 16
  { code: '16A01', floor: 16, side: 'LEFT', type: '2PN', defaultStatus: 'VACANT', area: 75, defaultName: 'Nhà Trống' },
  { code: '16A02', floor: 16, side: 'RIGHT', type: '3PN', defaultStatus: 'VACANT', area: 108, defaultName: 'Nhà Trống' },
  // Tầng 15
  { code: '15A01', floor: 15, side: 'LEFT', type: '3PN', defaultStatus: 'VACANT', area: 108, defaultName: 'Nhà Trống' },
  { code: '15A04', floor: 15, side: 'RIGHT', type: '2PN', defaultStatus: 'VACANT', area: 78.5, defaultName: 'Nhà Trống' },
  // Tầng 14
  { code: '14A01', floor: 14, side: 'LEFT', type: '2PN', defaultStatus: 'VACANT', area: 75, defaultName: 'Nhà Trống' },
  { code: '14A02', floor: 14, side: 'RIGHT', type: '2PN', defaultStatus: 'VACANT', area: 78.5, defaultName: 'Nhà Trống' },
  // Tầng 12 (Căn 12A05 là căn cư dân thật Nguyễn Hữu Lực)
  { code: '12A05', floor: 12, side: 'LEFT', type: '2PN', defaultStatus: 'OCCUPIED', area: 78.5, defaultName: 'Nguyễn Hữu Lực' },
  { code: '12A04', floor: 12, side: 'RIGHT', type: '3PN', defaultStatus: 'VACANT', area: 108, defaultName: 'Nhà Trống' },
  // Tầng 11
  { code: '11A01', floor: 11, side: 'LEFT', type: '2PN', defaultStatus: 'VACANT', area: 75, defaultName: 'Nhà Trống' },
  { code: '11A02', floor: 11, side: 'RIGHT', type: '1PN', defaultStatus: 'VACANT', area: 52, defaultName: 'Nhà Trống' },
  // Tầng 10 (Căn 10A03 đang nghiệm thu kỹ thuật BQL)
  { code: '10A01', floor: 10, side: 'LEFT', type: '2PN', defaultStatus: 'VACANT', area: 75, defaultName: 'Nhà Trống' },
  { code: '10A03', floor: 10, side: 'RIGHT', type: '2PN', defaultStatus: 'MAINTENANCE', area: 78.5, defaultName: 'Nghiệm Thu BQL' },
  // Tầng 9
  { code: '09A01', floor: 9, side: 'LEFT', type: '2PN', defaultStatus: 'VACANT', area: 78.5, defaultName: 'Nhà Trống' },
  { code: '09A02', floor: 9, side: 'RIGHT', type: '1PN', defaultStatus: 'VACANT', area: 52, defaultName: 'Nhà Trống' },
  // Tầng 8
  { code: '08A01', floor: 8, side: 'LEFT', type: '3PN', defaultStatus: 'VACANT', area: 108, defaultName: 'Nhà Trống' },
  { code: '08A02', floor: 8, side: 'RIGHT', type: '1PN', defaultStatus: 'VACANT', area: 52, defaultName: 'Nhà Trống' },
  // Tầng 7
  { code: '07A01', floor: 7, side: 'LEFT', type: '2PN', defaultStatus: 'VACANT', area: 75, defaultName: 'Nhà Trống' },
  { code: '07A02', floor: 7, side: 'RIGHT', type: '2PN', defaultStatus: 'VACANT', area: 78.5, defaultName: 'Nhà Trống' },
  // Tầng 6
  { code: '06A01', floor: 6, side: 'LEFT', type: '1PN', defaultStatus: 'VACANT', area: 52, defaultName: 'Nhà Trống' },
  { code: '06A02', floor: 6, side: 'RIGHT', type: '1PN', defaultStatus: 'VACANT', area: 52, defaultName: 'Nhà Trống' },
  // Tầng 5
  { code: '05A02', floor: 5, side: 'LEFT', type: '1PN', defaultStatus: 'VACANT', area: 52, defaultName: 'Nhà Trống' },
  { code: '05A01', floor: 5, side: 'RIGHT', type: '2PN', defaultStatus: 'VACANT', area: 75, defaultName: 'Nhà Trống' },
  // Tầng 4
  { code: '04A01', floor: 4, side: 'LEFT', type: '2PN', defaultStatus: 'VACANT', area: 75, defaultName: 'Nhà Trống' },
  { code: '04A02', floor: 4, side: 'RIGHT', type: '1PN', defaultStatus: 'VACANT', area: 52, defaultName: 'Nhà Trống' }
];

// Helper tính toán chỉ số tiêu thụ hàng tháng & dòng tiền thu nhập căn hộ
export function getApartmentFinancialMetrics(unit: ApartmentUnit | null) {
  if (!unit) return null;
  const isOccupied = unit.status === 'OCCUPIED';
  const isMaintenance = unit.status === 'MAINTENANCE';
  const area = unit.area || 75;

  // 1. Phí quản lý tòa nhà tiêu chuẩn Skyline (18.000 đ/m²)
  const managementFee = Math.round(area * 18000);

  // 2. Phí phương tiện hầm gửi xe
  const vehicles = unit.vehicles || [];
  let parkingFee = 0;
  if (vehicles.length > 0) {
    vehicles.forEach(v => {
      if (v.type === 'CAR') parkingFee += 1200000;
      else if (v.type === 'MOTORBIKE') parkingFee += 120000;
      else parkingFee += 50000;
    });
  } else if (isOccupied) {
    // Cư dân căn hộ 12A05 (Nguyễn Hữu Lực) có 1 ô tô + 1 xe máy
    parkingFee = unit.code === '12A05' ? 1320000 : 120000;
  }

  // 3. Tiêu thụ điện sinh hoạt
  let electricKwh = 0;
  let electricCost = 0;
  let waterM3 = 0;
  let waterCost = 0;

  if (isOccupied) {
    electricKwh = unit.code === '12A05' ? 285 : Math.round(180 + (area * 1.4));
    // Đơn giá điện lực bậc thang trung bình ~3.100 đ/kWh
    electricCost = Math.round(electricKwh * 3100);
    waterM3 = unit.code === '12A05' ? 18 : Math.max(12, Math.round(area * 0.22));
    waterCost = Math.round(waterM3 * 18000);
  } else if (isMaintenance) {
    electricKwh = 35;
    electricCost = Math.round(electricKwh * 3100);
    waterM3 = 2;
    waterCost = Math.round(waterM3 * 18000);
  } else {
    // Căn hộ trống duy trì cảm biến & hệ thống chiếu sáng bảo dưỡng
    electricKwh = 8;
    electricCost = Math.round(electricKwh * 3100);
    waterM3 = 0;
    waterCost = 0;
  }

  // Tổng doanh thu BQL thu về từ căn hộ
  const totalBqlRevenue = managementFee + parkingFee + (isOccupied ? (electricCost + waterCost) : 0);

  // Giá trị khai thác cho thuê tham chiếu thị trường (Rental Benchmark)
  let estimatedRentalPrice = 19500000;
  if (unit.type === '1PN') estimatedRentalPrice = 13500000;
  else if (unit.type === '2PN') estimatedRentalPrice = 19500000;
  else if (unit.type === '3PN') estimatedRentalPrice = 28000000;
  else if (unit.type === 'DUPLEX_PENTHOUSE') estimatedRentalPrice = 65000000;

  // Tỷ suất sinh lời cho thuê (%/năm)
  const propertyValue = (unit.priceBillion || 4.5) * 1000000000;
  const rentalYield = ((estimatedRentalPrice * 12) / propertyValue * 100).toFixed(1);

  return {
    isOccupied,
    isMaintenance,
    area,
    managementFee,
    parkingFee,
    electricKwh,
    electricCost,
    waterM3,
    waterCost,
    totalBqlRevenue,
    estimatedRentalPrice,
    rentalYield,
    paymentStatus: isOccupied ? (unit.billing?.status || 'PAID') : 'PAID_BY_DEVELOPER',
    meterElectricId: `EM-${unit.code}-IoT`,
    meterWaterId: `WM-${unit.code}-SKY`,
    lastSync: '12/09/2026 00:30'
  };
}

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
  const [detailTab, setDetailTab] = useState<'OVERVIEW' | 'FINANCIAL' | 'TECHNICAL'>('OVERVIEW');

  // Điều khiển Floor Plan View (Mặt Bằng Tầng & Chế độ Mở Rộng)
  const [selectedFloor, setSelectedFloor] = useState<number>(12);
  const [hoveredUnitCode, setHoveredUnitCode] = useState<string | null>(null);
  const [isFloorPlanExpanded, setIsFloorPlanExpanded] = useState<boolean>(false);
  const [floorFilterStatus, setFloorFilterStatus] = useState<'ALL' | 'OCCUPIED' | 'VACANT'>('ALL');
  const [billToastMessage, setBillToastMessage] = useState<string | null>(null);

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

  // Hàm kiểm tra căn hộ có khớp với bộ lọc đa tiêu chí hay không (dùng để highlight/dim trên mô hình 3D)
  const checkUnitMatchesFilter = useCallback((code: string, floor: number, type: string, status: string, ownerName?: string) => {
    const matchOccupancy = selectedOccupancy === 'ALL'
      ? true
      : selectedOccupancy === 'OCCUPIED'
      ? status === 'OCCUPIED'
      : selectedOccupancy === 'VACANT'
      ? status === 'VACANT'
      : status === 'MAINTENANCE';

    const matchType = selectedType === 'ALL'
      ? true
      : selectedType === '1PN'
      ? (type === '1PN' || type.includes('1PN'))
      : selectedType === '2PN'
      ? (type === '2PN' || type.includes('2PN'))
      : selectedType === '3PN'
      ? (type === '3PN' || type.includes('3PN'))
      : (type === 'DUPLEX_PENTHOUSE' || type.toLowerCase().includes('duplex') || type.toLowerCase().includes('penthouse'));

    const matchFloorRange = selectedFloorRange === 'ALL'
      ? true
      : selectedFloorRange === 'LOW'
      ? (floor >= 1 && floor <= 10)
      : selectedFloorRange === 'MID'
      ? (floor >= 11 && floor <= 20)
      : (floor >= 21);

    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchOccupancy && matchType && matchFloorRange;

    const matchSearch = 
      code.toLowerCase().includes(q) ||
      (ownerName && ownerName.toLowerCase().includes(q)) ||
      type.toLowerCase().includes(q) ||
      `tầng ${floor}`.toLowerCase().includes(q) ||
      `tang ${floor}`.toLowerCase().includes(q) ||
      (q.startsWith('tầng ') && floor === parseInt(q.replace('tầng ', ''))) ||
      (q.startsWith('tang ') && floor === parseInt(q.replace('tang ', '')));

    return matchOccupancy && matchType && matchFloorRange && matchSearch;
  }, [selectedOccupancy, selectedType, selectedFloorRange, searchQuery]);

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
              <Box className="w-3.5 h-3.5" /> Toàn Cảnh Tòa Nhà
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
      {/* 3. THANH CÔNG CỤ TÌM KIẾM & BỘ LỌC ĐIỀU KHIỂN THÔNG MINH       */}
      {/* ============================================================= */}
      <div className="p-3 bg-[#121820] border border-[#222B35] rounded-none flex flex-col gap-2.5 shadow-lg">
        {/* HÀNG 1: Ô TÌM KIẾM THÔNG MINH + BỘ ĐẾM KẾT QUẢ + NÚT ĐẶT LẠI */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Ô Tìm kiếm căn hộ với Instant Dropdown */}
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-3.5 h-3.5 text-[#C5A880] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 250)}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm mã căn (12A05), tầng, chủ nhà (Lực)..."
              className="w-full bg-[#161B22] border border-[#2D3748] pl-9 pr-8 py-1.5 rounded-none text-white text-xs placeholder:text-gray-500 outline-none focus:border-[#C5A880] transition-colors"
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

            {/* Instant Search Matches Dropdown */}
            {isSearchFocused && searchQuery.trim() !== '' && (
              <div className="absolute top-full left-0 mt-1.5 w-80 bg-[#0F141C] border border-[#C5A880]/50 shadow-2xl z-50 divide-y divide-[#1F2937] max-h-64 overflow-y-auto">
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
                            Tầng {u.floor} • {u.typeLabel}
                          </div>
                        </div>
                      </div>
                      <span className={`text-[9px] px-1.5 py-0.5 font-mono shrink-0 ${
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

          {/* Bộ Đếm Kết Quả & Nút Reset Bộ Lọc */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="text-xs font-mono text-gray-300 bg-[#161B22] px-3 py-1.5 border border-[#2D3748] flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>Hiển thị: <strong className="text-white">{filteredUnits.length}</strong> / {displayUnits.length} căn</span>
            </div>

            {isAnyFilterActive && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2B1D1D] hover:bg-[#3D2525] text-rose-300 border border-rose-800/60 transition-colors font-semibold text-xs"
                title="Đặt lại toàn bộ tiêu chí lọc"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Đặt Lại Bộ Lọc</span>
              </button>
            )}
          </div>
        </div>

        {/* HÀNG 2: CÁC NHÓM TIÊU CHÍ LỌC THIẾT KẾ CÔNG THÁI HỌC (KHÔNG CUỘN NGANG) */}
        <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-[#1C2533] text-xs">
          {/* Nhóm 1: Trạng Thái Căn Hộ */}
          <div className="flex items-center gap-1">
            <span className="text-gray-400 font-mono text-[11px] mr-1">Tình Trạng:</span>
            {[
              { id: 'ALL', label: `Tất Cả (${totalUnitsCount})` },
              { id: 'OCCUPIED', label: `🟢 Đã Có Người Ở (${occupiedCount})` },
              { id: 'VACANT', label: `🟡 Chưa Có Người Ở (${vacantCount})` },
              { id: 'MAINTENANCE', label: `🔵 Nghiệm Thu (${maintenanceCount})` }
            ].map(o => (
              <button
                key={o.id}
                onClick={() => setSelectedOccupancy(o.id as any)}
                className={`px-2.5 py-1 text-xs font-semibold transition-all ${
                  selectedOccupancy === o.id
                    ? 'bg-[#1C2533] text-[#C5A880] border border-[#C5A880] shadow font-bold'
                    : 'text-gray-400 hover:text-white bg-[#161B22]/60 hover:bg-[#161B22] border border-transparent'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>

          <div className="hidden md:block w-[1px] h-5 bg-[#222B35]"></div>

          {/* Nhóm 2: Loại Phòng Ngủ */}
          <div className="flex items-center gap-1">
            <span className="text-gray-400 font-mono text-[11px] mr-1">Loại Căn:</span>
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
                className={`px-2.5 py-1 text-xs font-semibold transition-all ${
                  selectedType === t.id
                    ? 'bg-[#2A374A] text-sky-200 border border-sky-400 shadow font-bold'
                    : 'text-gray-400 hover:text-white bg-[#161B22]/60 hover:bg-[#161B22] border border-transparent'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="hidden lg:block w-[1px] h-5 bg-[#222B35]"></div>

          {/* Nhóm 3: Khoảng Tầng */}
          <div className="flex items-center gap-1">
            <span className="text-gray-400 font-mono text-[11px] mr-1">Tầng:</span>
            {[
              { id: 'ALL', label: 'Tất Cả' },
              { id: 'LOW', label: 'Thấp (1-10)' },
              { id: 'MID', label: 'Trung (11-20)' },
              { id: 'HIGH', label: 'Cao (21-25)' }
            ].map(r => (
              <button
                key={r.id}
                onClick={() => setSelectedFloorRange(r.id as any)}
                className={`px-2.5 py-1 text-xs font-semibold transition-all ${
                  selectedFloorRange === r.id
                    ? 'bg-[#2E281F] text-amber-200 border border-amber-500 shadow font-bold'
                    : 'text-gray-400 hover:text-white bg-[#161B22]/60 hover:bg-[#161B22] border border-transparent'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ============================================================= */}
      {/* 4. KHU VỰC CHÍNH: SƠ ĐỒ TÒA NHÀ & HỒ SƠ CHI TIẾT CĂN HỘ       */}
      {/* ============================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* CỘT TRÁI (7 COLS): SƠ ĐỒ TÒA NHÀ / MẶT BẰNG TẦNG / DANH SÁCH */}
        <div className="lg:col-span-7 bg-[#0D1117] border border-[#222B35] rounded-none overflow-hidden shadow-2xl flex flex-col">
          
          {/* Header mô hình */}
          <div className="p-4 bg-[#121820] border-b border-[#222B35] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-[#C5A880]" />
              <span className="font-bold text-sm text-white">
                {buildingPerspective === '3D' && 'Toàn Cảnh Kiến Trúc Chung Cư Skyline (25 Tầng)'}
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
          {/* GÓC NHÌN 1: MÔ HÌNH KHỐI 3D KIẾN TRÚC TÒA NHÀ BỰ HƠN THỰC TẾ*/}
          {/* ĐA KHỐI CĂN HỘ TỪNG TẦNG - 100% CĂN TRỐNG THẬT (KHÔNG DỮ LIỆU ẢO) */}
          {/* TƯƠNG TÁC VISUAL FILTERING ĐỒNG BỘ THEO BỘ LỌC              */}
          {/* ----------------------------------------------------------- */}
          {buildingPerspective === '3D' && (
            <div className="relative w-full h-[640px] sm:h-[720px] bg-[#05070A] overflow-hidden flex items-center justify-center select-none">
              {/* Lưới tọa độ không gian kiến trúc số */}
              <div 
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  backgroundImage: 'linear-gradient(to right, #1E293B 1px, transparent 1px), linear-gradient(to bottom, #1E293B 1px, transparent 1px)',
                  backgroundSize: '24px 24px'
                }}
              />

              {/* BẢN VẼ PHỐI CẢNH 3D CHUNG CƯ SKYLINE BỀ THẾ (SVG ISOMETRIC) */}
              <svg
                viewBox="0 0 1000 680"
                className="w-full h-full cursor-default drop-shadow-[0_30px_60px_rgba(0,0,0,0.95)]"
              >
                <defs>
                  {/* Animation Keyframes cho con trỏ laser và bảng callout hiển thị từ từ */}
                  <style>{`
                    @keyframes laserDrawPath {
                      0% {
                        stroke-dashoffset: 340;
                        opacity: 0;
                      }
                      20% {
                        opacity: 1;
                      }
                      100% {
                        stroke-dashoffset: 0;
                        opacity: 1;
                      }
                    }

                    @keyframes calloutSlideIn {
                      0% {
                        opacity: 0;
                        transform: translateY(12px) scale(0.95);
                      }
                      100% {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                      }
                    }

                    @keyframes pingRing {
                      0% {
                        r: 3.5;
                        opacity: 1;
                        stroke-width: 2.5;
                      }
                      70% {
                        opacity: 0.5;
                      }
                      100% {
                        r: 20;
                        opacity: 0;
                        stroke-width: 0.5;
                      }
                    }

                    .anim-laser-line {
                      stroke-dasharray: 340;
                      stroke-dashoffset: 340;
                      animation: laserDrawPath 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                    }

                    .anim-callout-card {
                      animation: calloutSlideIn 0.5s 0.18s cubic-bezier(0.16, 1, 0.3, 1) both;
                    }

                    .anim-ping-pulse {
                      animation: pingRing 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
                    }
                  `}</style>

                  {/* Filter viền phát sáng khi chọn căn hộ */}
                  <filter id="unitGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>

                  {/* Gradient kính mặt tiền Đông Nam (Mặt Trái) */}
                  <linearGradient id="skylineGlassL" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1E293B" />
                    <stop offset="50%" stopColor="#0F172A" />
                    <stop offset="100%" stopColor="#050B14" />
                  </linearGradient>

                  {/* Gradient kính mặt tiền Tây Nam (Mặt Phải) */}
                  <linearGradient id="skylineGlassR" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#334155" />
                    <stop offset="60%" stopColor="#1E293B" />
                    <stop offset="100%" stopColor="#0A101D" />
                  </linearGradient>

                  {/* Gradient khối đế tiếp tân */}
                  <linearGradient id="podiumMallGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1E293B" />
                    <stop offset="60%" stopColor="#0F172A" />
                    <stop offset="100%" stopColor="#080C14" />
                  </linearGradient>
                </defs>

                {/* 1. KHUÔN VIÊN MẶT ĐẤT & SẢNH ĐÓN TẦNG 1 */}
                <g className="opacity-95">
                  {/* Nền cảnh quan sân vườn */}
                  <polygon points="80,555 500,635 920,555 500,475" fill="#070B12" stroke="#1E293B" strokeWidth="2" />
                  {/* Hồ nước sinh thái & đài phun nước */}
                  <polygon points="320,590 500,622 680,590 500,558" fill="#0369A1" fillOpacity="0.35" stroke="#38BDF8" strokeWidth="1" />
                  <text x="500" y="593" fill="#38BDF8" fontSize="8.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                    HỒ NƯỚC CẢNH QUAN & ĐÀI PHUN NƯỚC NỘI KHU
                  </text>

                  {/* KHỐI SẢNH ĐÓN & DỊCH VỤ CƯ DÂN (TẦNG 1) - MỞ RỘNG BỀ THẾ */}
                  <polygon points="200,500 500,545 800,500 800,440 500,485 200,440" fill="url(#podiumMallGrad)" stroke="#334155" strokeWidth="1.8" />
                  <polygon points="220,485 500,528 780,485 780,455 500,498 220,455" fill="#0EA5E9" fillOpacity="0.2" stroke="#38BDF8" strokeWidth="1" />
                  <text x="500" y="488" fill="#E2E8F0" fontSize="11" fontFamily="sans-serif" textAnchor="middle" fontWeight="extrabold" letterSpacing="0.1em">
                    SẢNH ĐÓN TIẾP TÂN & KHU DỊCH VỤ CƯ DÂN (TẦNG 1)
                  </text>
                  <text x="500" y="506" fill="#94A3B8" fontSize="8.5" fontFamily="monospace" textAnchor="middle">
                    Lễ Tân 24/7 • Ban Quản Lý • Sảnh Chờ Sang Trọng • Lối Xuống Hầm Xe B1-B2
                  </text>
                </g>

                {/* 2. THÂN THÁP CHUNG CƯ SKYLINE (25 TẦNG VƯƠN CAO BỰ HƠN BỀ THẾ) */}
                <g className="transition-all duration-300">
                  {/* Mặt Trái (Hướng Đông Nam - rộng 270px) */}
                  <polygon points="230,440 500,485 500,104 230,68" fill="url(#skylineGlassL)" stroke="#222B35" strokeWidth="2.5" />
                  {/* Mặt Phải (Hướng Tây Nam - rộng 270px) */}
                  <polygon points="500,485 770,440 770,68 500,104" fill="url(#skylineGlassR)" stroke="#334155" strokeWidth="2.5" />
                  {/* Mái Tháp (Sân Thượng Helipad) */}
                  <polygon points="230,68 500,104 770,68 500,32" fill="#1E293B" stroke="#475569" strokeWidth="2" />

                  {/* Sân đáp trực thăng Helipad trên đỉnh tháp */}
                  <ellipse cx="500" cy="68" rx="65" ry="20" fill="#0F172A" stroke="#C5A880" strokeWidth="1.8" />
                  <circle cx="500" cy="68" r="12" fill="none" stroke="#FDE68A" strokeWidth="1.5" />
                  <text x="500" y="73" fill="#FDE68A" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">H</text>

                  {/* Đèn báo tín hiệu hàng không nhấp nháy trên đỉnh */}
                  <circle cx="500" cy="22" r="3.5" fill="#EF4444" className="animate-pulse" />
                  <line x1="500" y1="22" x2="500" y2="32" stroke="#64748B" strokeWidth="1.5" />

                  {/* Tiêu đề Đỉnh Tòa Nhà */}
                  <text x="500" y="16" fill="#C5A880" fontSize="14" fontWeight="bold" textAnchor="middle" fontFamily="serif" letterSpacing="0.05em">
                    CHUNG CƯ SKYLINE (25 TẦNG CĂN HỘ)
                  </text>

                  {/* RENDER ĐẦY ĐỦ CÁC KHỐI CĂN HỘ KIẾN TRÚC (TỪ TẦNG 4 ĐẾN TẦNG 25) */}
                  {BUILDING_3D_UNITS.map(b => {
                    const liveUnit = displayUnits.find(u => u.code === b.code);
                    const actualStatus = liveUnit ? liveUnit.status : b.defaultStatus;
                    const actualOwnerName = b.code === '12A05' ? activeOwnerName : (liveUnit?.owner?.name || b.defaultName || 'Nhà Trống');
                    const isSelected = selectedAptCode === b.code;
                    const isHovered = hoveredUnitCode === b.code;
                    
                    // Kiểm tra xem căn có thỏa mãn bộ lọc hiện hành hay không
                    const isMatched = checkUnitMatchesFilter(b.code, b.floor, b.type, actualStatus, actualOwnerName);

                    // Tọa độ hình học chính xác cho khối căn hộ
                    const yBase = 472 - (b.floor - 4) * 17.52;
                    const h = b.floor === 25 ? 24 : 14.5;
                    
                    // Tọa độ 4 góc của đa giác isometric
                    const pts = b.side === 'LEFT'
                      ? `${248},${(yBase - 33 - h).toFixed(1)} ${494},${(yBase - 1 - h).toFixed(1)} ${494},${(yBase - 1).toFixed(1)} ${248},${(yBase - 33).toFixed(1)}`
                      : `${506},${(yBase - 1 - h).toFixed(1)} ${752},${(yBase - 33 - h).toFixed(1)} ${752},${(yBase - 33).toFixed(1)} ${506},${(yBase - 1).toFixed(1)}`;
                    
                    const textX = b.side === 'LEFT' ? 371 : 629;
                    const textY = (yBase - 17 - h / 2 + 3.5).toFixed(1);

                    // Màu sắc theo trạng thái thực tế
                    let fillColor = '#B45309';
                    let strokeColor = '#F59E0B';
                    let textColor = '#FEF3C7';

                    if (actualStatus === 'OCCUPIED') {
                      fillColor = isSelected ? '#059669' : '#065F46';
                      strokeColor = isSelected ? '#34D399' : '#10B981';
                      textColor = '#D1FAE5';
                    } else if (actualStatus === 'MAINTENANCE') {
                      fillColor = isSelected ? '#0284C7' : '#0369A1';
                      strokeColor = isSelected ? '#7DD3FC' : '#38BDF8';
                      textColor = '#E0F2FE';
                    } else {
                      // Căn hộ trống (chuẩn theo yêu cầu người dùng)
                      fillColor = isSelected ? '#D97706' : '#78350F';
                      strokeColor = isSelected ? '#FDE68A' : '#F59E0B';
                      textColor = '#FEF3C7';
                    }

                    // Tương tác phản hồi Bộ Lọc: Căn khớp thì sáng rõ, căn không khớp thì mờ đục
                    let opacityVal = 0.85;
                    if (isAnyFilterActive) {
                      opacityVal = isMatched ? 1 : 0.12;
                    } else if (isSelected || isHovered || b.code === '12A05') {
                      opacityVal = 1;
                    }

                    return (
                      <g
                        key={b.code}
                        onClick={() => {
                          setSelectedAptCode(b.code);
                          setSelectedFloor(b.floor);
                        }}
                        onMouseEnter={() => setHoveredUnitCode(b.code)}
                        onMouseLeave={() => setHoveredUnitCode(null)}
                        className="cursor-pointer transition-opacity duration-300"
                        style={{ opacity: opacityVal }}
                      >
                        <polygon
                          points={pts}
                          fill={fillColor}
                          fillOpacity={isSelected ? 0.98 : (isHovered ? 0.9 : (actualStatus === 'OCCUPIED' ? 0.88 : 0.55))}
                          stroke={isSelected ? '#FFFFFF' : (isHovered ? '#FDE68A' : strokeColor)}
                          strokeWidth={isSelected ? 2.5 : (isHovered ? 2 : 1)}
                          filter={isSelected ? 'url(#unitGlow)' : undefined}
                          className="transition-all duration-200"
                        />
                        
                        {/* Nhãn căn hộ trên mặt kính tòa nhà */}
                        <text
                          x={textX}
                          y={textY}
                          fill={isSelected ? '#FFFFFF' : textColor}
                          fontSize={b.floor === 25 ? '8.5' : '7.5'}
                          fontWeight={isSelected || b.code === '12A05' ? '900' : 'bold'}
                          textAnchor="middle"
                          fontFamily="monospace"
                          pointerEvents="none"
                        >
                          {b.code} {actualStatus === 'OCCUPIED' ? '★ ĐÃ Ở' : (actualStatus === 'MAINTENANCE' ? '• KỸ THUẬT' : '• TRỐNG')}
                        </text>
                      </g>
                    );
                  })}

                  {/* =================================================================== */}
                  {/* CON TRỎ HOẠT HỌA ĐỘNG (ANIMATED POINTER & CALLOUT) HIỂN THỊ TỪ TỪ   */}
                  {/* KHI CLICK VÀO BẤT KỲ CĂN HỘ NÀO TRÊN MÔ HÌNH CHUNG CƯ              */}
                  {/* =================================================================== */}
                  {(() => {
                    // 1. Tìm khối căn hộ tương ứng trên mô hình 3D
                    let activeTargetBlock = BUILDING_3D_UNITS.find(b => b.code === selectedAptCode);
                    if (!activeTargetBlock) {
                      const targetFloor = activeUnit?.floor || 12;
                      const numStr = selectedAptCode.replace(/\D/g, '').slice(-2);
                      const num = parseInt(numStr || '1', 10);
                      const fallbackSide: 'LEFT' | 'RIGHT' = num % 2 === 1 ? 'LEFT' : 'RIGHT';
                      activeTargetBlock = BUILDING_3D_UNITS.find(b => b.floor === targetFloor && b.side === fallbackSide)
                        || BUILDING_3D_UNITS.find(b => b.floor === targetFloor)
                        || {
                          code: selectedAptCode,
                          floor: Math.max(4, Math.min(25, targetFloor)),
                          side: fallbackSide,
                          type: (activeUnit?.type || '2PN') as ApartmentType,
                          defaultStatus: (activeUnit?.status || 'VACANT') as ApartmentStatus,
                          area: activeUnit?.area || 75
                        };
                    }

                    const curFloor = Math.max(4, Math.min(25, activeTargetBlock.floor));
                    const curSide = activeTargetBlock.side;
                    const curYBase = 472 - (curFloor - 4) * 17.52;
                    const curH = curFloor === 25 ? 24 : 14.5;

                    // Mép tường ngoài tòa nhà (nơi tia laser đi ra ngoài không gian)
                    // Tại mép ngoài x = 248 (LEFT) hoặc x = 752 (RIGHT), Y đáy khối căn hộ là curYBase - 33
                    const wallX = curSide === 'LEFT' ? 248 : 752;
                    const wallY = Number((curYBase - 33 - (curH / 2)).toFixed(1));

                    // ĐIỂM CHẤM MỤC TIÊU (TARGET PIN DOT): NẰM NGAY TRÊN BỀ MẶT CĂN HỘ ĐƯỢC CHỌN
                    // Điểm đặt cách mép tường 67px (nằm trong phần thân căn hộ, ngay cạnh nhãn mã căn)
                    // Độ dốc mặt phẳng isometric chuẩn: 32px trên 246px chiều ngang
                    const pinDist = 67;
                    const pinX = curSide === 'LEFT' ? (wallX + pinDist) : (wallX - pinDist);
                    const pinY = Number((wallY + (32 / 246) * pinDist).toFixed(1));

                    // Điểm khuỷu tay bẻ góc ngang ngoài không gian
                    const elbowX = curSide === 'LEFT' ? (wallX - 24) : (wallX + 24);
                    const elbowY = wallY;

                    // Bảng Holographic Callout định vị ở lề trái hoặc lề phải
                    const cardW = 192;
                    const cardH = 74;
                    const cardX = curSide === 'LEFT' ? 14 : 794;
                    const dockX = curSide === 'LEFT' ? (cardX + cardW) : cardX;
                    const targetCardY = Math.max(48, Math.min(480, Math.round(wallY - cardH / 2)));
                    const dockY = targetCardY + cardH / 2;

                    // Đường vẽ tia laser: Từ tâm căn hộ (pin) -> mép tường (wall) -> khuỷu ngoài (elbow) -> bảng callout (dock)
                    const laserPath = `M ${pinX} ${pinY} L ${wallX} ${wallY} L ${elbowX} ${elbowY} L ${dockX} ${dockY}`;

                    const isCurOccupied = activeUnit?.status === 'OCCUPIED' || selectedAptCode === '12A05';
                    const isCurMaint = activeUnit?.status === 'MAINTENANCE' || selectedAptCode === '10A03';
                    const themeNeon = isCurOccupied ? '#10B981' : isCurMaint ? '#38BDF8' : '#F59E0B';
                    const themeBg = isCurOccupied ? '#064E3B' : isCurMaint ? '#082F49' : '#1C1917';
                    const themeBorder = isCurOccupied ? '#34D399' : isCurMaint ? '#7DD3FC' : '#FDE68A';
                    const themeText = isCurOccupied ? '#D1FAE5' : isCurMaint ? '#BAE6FD' : '#FEF3C7';

                    return (
                      <g key={`dynamic-pointer-${selectedAptCode}`} className="pointer-events-none">
                        {/* 1. ĐIỂM CHẤM NEO MỤC TIÊU NẰM CHÍNH XÁC TRÊN CĂN HỘ ĐƯỢC CHỌN */}
                        <circle cx={pinX} cy={pinY} r="4.5" fill={themeNeon} filter="url(#unitGlow)" />
                        <circle cx={pinX} cy={pinY} r="14" fill="none" stroke={themeNeon} strokeWidth="1.6" className="anim-ping-pulse" />
                        <circle cx={pinX} cy={pinY} r="1.8" fill="#FFFFFF" />

                        {/* 2. Đường tia laser bắn từ căn hộ sang bảng callout (vẽ từ từ dần dần) */}
                        <path
                          d={laserPath}
                          fill="none"
                          stroke={themeNeon}
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="anim-laser-line"
                          filter="url(#unitGlow)"
                        />
                        {/* Hạt photon tại mép tường & hạt neo tại bảng callout */}
                        <circle cx={wallX} cy={wallY} r="2.5" fill={themeNeon} />
                        <circle cx={dockX} cy={dockY} r="3.5" fill={themeBorder} />

                        {/* 3. Bảng Callout Holographic xuất hiện từ từ dần dần */}
                        <g className="anim-callout-card">
                          <rect
                            x={cardX}
                            y={targetCardY}
                            width={cardW}
                            height={cardH}
                            fill={themeBg}
                            fillOpacity="0.96"
                            stroke={themeBorder}
                            strokeWidth="1.8"
                            rx="4"
                            filter="url(#unitGlow)"
                          />

                          {/* Dòng 1: Header mã căn + số tầng */}
                          <circle cx={cardX + 14} cy={targetCardY + 16} r="3.5" fill={themeNeon} />
                          <text
                            x={cardX + 24}
                            y={targetCardY + 20}
                            fill="#FFFFFF"
                            fontSize="10"
                            fontWeight="900"
                            fontFamily="monospace"
                          >
                            CĂN {activeUnit?.code || selectedAptCode} • TẦNG {curFloor}
                          </text>

                          {/* Dòng 2: Tình trạng sinh động */}
                          <text
                            x={cardX + 14}
                            y={targetCardY + 36}
                            fill={themeText}
                            fontSize="8.5"
                            fontWeight="bold"
                          >
                            {isCurOccupied
                              ? `★ CƯ DÂN: ${activeOwnerName}`
                              : isCurMaint
                              ? '★ ĐANG NGHIỆM THU KỸ THUẬT'
                              : '★ NHÀ TRỐNG • SẴN SÀNG Ở'}
                          </text>

                          {/* Dòng 3: Diện tích & Hướng */}
                          <text
                            x={cardX + 14}
                            y={targetCardY + 50}
                            fill="#CBD5E1"
                            fontSize="7.5"
                            fontFamily="monospace"
                          >
                            {activeUnit?.typeLabel || `${activeTargetBlock.type}`} • {activeUnit?.area || activeTargetBlock.area}m² • Hướng {activeUnit?.direction || (curSide === 'LEFT' ? 'Đông Nam' : 'Tây Nam')}
                          </text>

                          {/* Dòng 4: Chỉ báo hiển thị */}
                          <text
                            x={cardX + 14}
                            y={targetCardY + 65}
                            fill={themeNeon}
                            fontSize="7.5"
                            fontWeight="semibold"
                          >
                            ✦ Đang hiển thị hồ sơ chi tiết bên phải
                          </text>
                        </g>

                        {/* Điểm nhận diện căn 12A05 (Nguyễn Hữu Lực) nếu đang chọn căn khác */}
                        {selectedAptCode !== '12A05' && (
                          <g>
                            <circle cx="248" cy="292" r="3.5" fill="#10B981" />
                            <rect x="135" y="280" width="105" height="22" fill="#064E3B" fillOpacity="0.88" stroke="#10B981" strokeWidth="1" rx="2" />
                            <text x="187" y="294" fill="#D1FAE5" fontSize="7.5" fontWeight="bold" textAnchor="middle">
                              ★ 12A05: {activeOwnerName}
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })()}
                </g>

                {/* THẺ QUAN SÁT TỨC THÌ KHI CHỌN XEM CĂN HỘ KHÁC */}
                {hoveredUnitCode && hoveredUnitCode !== selectedAptCode && (
                  <g className="pointer-events-none">
                    {(() => {
                      const hUnit = displayUnits.find(u => u.code === hoveredUnitCode);
                      return (
                        <g>
                          <rect x="735" y="25" width="245" height="42" fill="#0D1117" fillOpacity="0.94" stroke="#C5A880" strokeWidth="1.2" rx="3" />
                          <text x="748" y="42" fill="#C5A880" fontSize="9.5" fontWeight="bold" fontFamily="monospace">
                            ✦ XEM NHANH: CĂN {hoveredUnitCode} (Tầng {hUnit?.floor || 12})
                          </text>
                          <text x="748" y="56" fill="#94A3B8" fontSize="8" fontFamily="sans-serif">
                            {hUnit?.status === 'OCCUPIED' ? '🟢 Đã có người ở' : hUnit?.status === 'MAINTENANCE' ? '🔵 Nghiệm thu kỹ thuật' : '🟡 Nhà trống (Sẵn sàng bàn giao)'} • Nhấp để xem hồ sơ
                          </text>
                        </g>
                      );
                    })()}
                  </g>
                )}

                {/* BẢNG CHỈ DẪN TƯƠNG TÁC GÓC TRÁI TRÊN */}
                <rect x="20" y="25" width="220" height="42" fill="#0D1117" fillOpacity="0.9" stroke="#222B35" strokeWidth="1" rx="2" />
                <text x="30" y="42" fill="#C5A880" fontSize="9.5" fontWeight="bold" fontFamily="monospace">
                  TOÀN CẢNH CHUNG CƯ SKYLINE
                </text>
                <text x="30" y="56" fill="#94A3B8" fontSize="8" fontFamily="sans-serif">
                  Tòa nhà 25 tầng • Nhấp chọn căn để định vị thông tin
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
          {buildingPerspective === 'FLOOR_PLAN' && (() => {
            // Tính toán tổng số liệu tầng hiện tại
            const floorUnits = ['01', '02', '03', '04', '05', '06', '07', '08'].map(num => {
              const targetCode = (selectedFloor === 12 && num === '05') ? '12A05' : `${selectedFloor > 9 ? selectedFloor : '0' + selectedFloor}${num}`;
              const found = apartments.find(u => 
                u.code.toLowerCase() === targetCode.toLowerCase() ||
                u.code.toLowerCase() === `${selectedFloor}A${num}`.toLowerCase() ||
                u.code.toLowerCase() === `${selectedFloor}B${num}`.toLowerCase()
              );
              return found || {
                code: targetCode,
                status: (selectedFloor === 12 && num === '05') ? 'OCCUPIED' : 'VACANT',
                area: 75,
                priceBillion: 4.5
              } as ApartmentUnit;
            });

            const floorOccupiedCount = floorUnits.filter(u => u.status === 'OCCUPIED').length;
            const floorTotalRevenue = floorUnits.reduce((sum, u) => {
              const fin = getApartmentFinancialMetrics(u);
              return sum + (fin ? fin.totalBqlRevenue : 0);
            }, 0);
            const floorTotalElectric = floorUnits.reduce((sum, u) => {
              const fin = getApartmentFinancialMetrics(u);
              return sum + (fin ? fin.electricKwh : 0);
            }, 0);
            const floorTotalWater = floorUnits.reduce((sum, u) => {
              const fin = getApartmentFinancialMetrics(u);
              return sum + (fin ? fin.waterM3 : 0);
            }, 0);

            return (
              <div className="p-4 sm:p-5 bg-[#05070A] h-[640px] overflow-y-auto space-y-3">
                
                {/* Bộ điều khiển Tầng & Nút Mở Rộng */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 bg-[#121820] border border-[#222B35] text-xs">
                  <div className="flex items-center gap-2.5 flex-wrap">
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
                        ★ Tầng 12 (12A05)
                      </button>
                    )}
                  </div>

                  {/* Nút Mở Rộng Không Gian Mặt Bằng Toàn Cảnh */}
                  <button
                    type="button"
                    onClick={() => setIsFloorPlanExpanded(true)}
                    className="px-3 py-1.5 bg-[#C5A880]/15 hover:bg-[#C5A880] text-[#C5A880] hover:text-[#0D1117] border border-[#C5A880]/60 font-bold text-xs font-mono transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Mở Rộng Mặt Bằng Chi Tiết ⛶</span>
                  </button>
                </div>

                {/* Thanh KPI Tóm Tắt Dòng Tiền & Tiêu Thụ Toàn Tầng {selectedFloor} */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 bg-gradient-to-r from-[#101722] via-[#121A26] to-[#101722] border border-[#253244] text-[11px] font-mono">
                  <div className="p-1.5 bg-[#16202D] border border-[#2B394E]">
                    <div className="text-[9.5px] text-gray-400">Doanh Thu Tầng {selectedFloor}:</div>
                    <div className="text-xs sm:text-sm font-bold text-emerald-400 mt-0.5">
                      {new Intl.NumberFormat('vi-VN').format(floorTotalRevenue)} <span className="text-[9px] text-gray-400">đ/th</span>
                    </div>
                  </div>
                  <div className="p-1.5 bg-[#16202D] border border-[#2B394E]">
                    <div className="text-[9.5px] text-gray-400">Điện Tiêu Thụ Sàn:</div>
                    <div className="text-xs sm:text-sm font-bold text-amber-300 mt-0.5 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-400" /> {floorTotalElectric} kWh
                    </div>
                  </div>
                  <div className="p-1.5 bg-[#16202D] border border-[#2B394E]">
                    <div className="text-[9.5px] text-gray-400">Nước Tiêu Thụ Sàn:</div>
                    <div className="text-xs sm:text-sm font-bold text-cyan-300 mt-0.5 flex items-center gap-1">
                      <Droplets className="w-3 h-3 text-cyan-400" /> {floorTotalWater} m³
                    </div>
                  </div>
                  <div className="p-1.5 bg-[#16202D] border border-[#2B394E]">
                    <div className="text-[9.5px] text-gray-400">Lấp Đầy Cư Dân:</div>
                    <div className="text-xs sm:text-sm font-bold text-white mt-0.5">
                      {floorOccupiedCount}/8 căn <span className="text-[9.5px] text-gray-400">({Math.round((floorOccupiedCount / 8) * 100)}%)</span>
                    </div>
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
                    const fin = getApartmentFinancialMetrics(found || {
                      code: codeToUse,
                      status: isOccupied ? 'OCCUPIED' : 'VACANT',
                      area: 75,
                      priceBillion: 4.5
                    } as ApartmentUnit);

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
                        {/* Tiêu thụ điện & doanh thu BQL */}
                        <div className="mt-1.5 pt-1.5 border-t border-[#1E293B] flex items-center justify-between text-[9.5px] font-mono">
                          <span className="text-amber-300 flex items-center gap-0.5">
                            <Zap className="w-2.5 h-2.5" /> {fin ? fin.electricKwh : 0} kWh
                          </span>
                          <span className="text-emerald-400 font-bold">
                            {fin ? (fin.totalBqlRevenue / 1000000).toFixed(1) + ' tr' : '0 tr'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}

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

                {/* 3. Thanh chuyển Tab tinh gọn (3 Tab: Cư dân, Tiêu thụ & Doanh thu, Kỹ thuật) */}
                <div className="flex border-b border-[#222B35] text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setDetailTab('OVERVIEW')}
                    className={`pb-2 px-2.5 transition-colors border-b-2 ${
                      detailTab === 'OVERVIEW'
                        ? 'border-[#C5A880] text-[#C5A880]'
                        : 'border-transparent text-gray-400 hover:text-white'
                    }`}
                  >
                    {activeUnit.status === 'OCCUPIED' ? '👤 Chủ Hộ' : '🔑 Hiện Trạng'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailTab('FINANCIAL')}
                    className={`pb-2 px-2.5 transition-colors border-b-2 flex items-center gap-1 ${
                      detailTab === 'FINANCIAL'
                        ? 'border-[#C5A880] text-[#C5A880]'
                        : 'border-transparent text-gray-400 hover:text-white'
                    }`}
                  >
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    <span>Tiêu Thụ & Doanh Thu</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailTab('TECHNICAL')}
                    className={`pb-2 px-2.5 transition-colors border-b-2 ${
                      detailTab === 'TECHNICAL'
                        ? 'border-[#C5A880] text-[#C5A880]'
                        : 'border-transparent text-gray-400 hover:text-white'
                    }`}
                  >
                    ⚙️ Kỹ Thuật & PCCC
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

                {/* 4.5. Nội dung Tab 2: Tiêu Thụ Hàng Tháng & Doanh Thu / Dòng Tiền */}
                {detailTab === 'FINANCIAL' && (() => {
                  const fin = getApartmentFinancialMetrics(activeUnit);
                  if (!fin) return null;

                  return (
                    <div className="space-y-2.5 text-xs font-mono">
                      {/* Thông báo thao tác thu phí */}
                      {billToastMessage && (
                        <div className="p-2 bg-emerald-950 border border-emerald-500 text-emerald-300 text-[11px] flex items-center justify-between">
                          <span>{billToastMessage}</span>
                          <button onClick={() => setBillToastMessage(null)} className="text-gray-400 hover:text-white ml-2">✕</button>
                        </div>
                      )}

                      {/* 1. KHỐI TỔNG HỢP DOANH THU BQL & GIÁ TRỊ KHAI THÁC */}
                      <div className="p-2.5 bg-gradient-to-br from-[#16202E] to-[#0E1520] border border-[#2A374A] space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-gray-200 flex items-center gap-1.5 font-bold">
                            <Coins className="w-3.5 h-3.5 text-amber-400" /> THU NHẬP & DÒNG TIỀN TỪ CĂN HỘ
                          </span>
                          <span className={`px-2 py-0.5 text-[9.5px] font-bold border ${
                            fin.isOccupied 
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-500' 
                              : 'bg-amber-950 text-amber-300 border-amber-600'
                          }`}>
                            {fin.isOccupied ? '✓ ĐÃ ĐÓNG ĐỦ' : 'CĐT BẢO DƯỠNG'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-[#232F42]">
                          <div>
                            <div className="text-[9.5px] text-gray-400">Doanh Thu Phí BQL Thu Về:</div>
                            <div className="text-sm sm:text-base font-bold text-emerald-400 mt-0.5">
                              {new Intl.NumberFormat('vi-VN').format(fin.totalBqlRevenue)} <span className="text-[10px] text-gray-400">đ/th</span>
                            </div>
                            <div className="text-[9px] text-gray-400">~{((fin.totalBqlRevenue * 12) / 1000000).toFixed(1)} triệu đ/năm</div>
                          </div>
                          <div>
                            <div className="text-[9.5px] text-gray-400">Giá Thuê Tham Chiếu:</div>
                            <div className="text-sm sm:text-base font-bold text-amber-300 mt-0.5">
                              {new Intl.NumberFormat('vi-VN').format(fin.estimatedRentalPrice)} <span className="text-[10px] text-gray-400">đ/th</span>
                            </div>
                            <div className="text-[9px] text-emerald-400 flex items-center gap-1">
                              <TrendingUp className="w-2.5 h-2.5" /> Lợi suất: {fin.rentalYield}% / năm
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 2. CHỈ SỐ TIÊU THỤ NĂNG LƯỢNG HÀNG THÁNG (ĐIỆN - NƯỚC) */}
                      <div className="p-2.5 bg-[#121820] border border-[#222B35] space-y-2">
                        <div className="flex items-center justify-between text-[11px] pb-1 border-b border-[#222B35]">
                          <span className="text-[#C5A880] font-bold flex items-center gap-1.5">
                            <Gauge className="w-3.5 h-3.5" /> TIÊU THỤ HÀNG THÁNG (KỲ GẦN NHẤT)
                          </span>
                          <span className="text-[9px] text-gray-400">Đồng hồ IoT</span>
                        </div>

                        {/* Tiêu thụ Điện */}
                        <div className="p-2 bg-[#161B22] border border-[#2D3748] space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-amber-300 font-bold flex items-center gap-1 text-[10.5px]">
                              <Zap className="w-3 h-3 text-amber-400" /> Điện Sinh Hoạt ({fin.meterElectricId})
                            </span>
                            <span className="text-amber-300 font-bold text-xs">
                              {new Intl.NumberFormat('vi-VN').format(fin.electricCost)} đ
                            </span>
                          </div>
                          <div className="flex items-baseline justify-between text-[11px]">
                            <span className="font-bold text-white text-sm">{fin.electricKwh} <span className="text-[10px] text-gray-400 font-normal">kWh</span></span>
                            <span className="text-[9px] text-gray-400">{fin.electricKwh > 300 ? '⚠️ Cao hơn tb' : '✓ Tiêu thụ chuẩn'}</span>
                          </div>
                          {/* Thanh đo */}
                          <div className="w-full bg-gray-800 h-1.5 overflow-hidden">
                            <div 
                              className="bg-amber-400 h-full transition-all duration-500" 
                              style={{ width: `${Math.min(100, Math.round((fin.electricKwh / 350) * 100))}%` }}
                            />
                          </div>
                        </div>

                        {/* Tiêu thụ Nước */}
                        <div className="p-2 bg-[#161B22] border border-[#2D3748] space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-cyan-300 font-bold flex items-center gap-1 text-[10.5px]">
                              <Droplets className="w-3 h-3 text-cyan-400" /> Nước Sinh Hoạt ({fin.meterWaterId})
                            </span>
                            <span className="text-cyan-300 font-bold text-xs">
                              {new Intl.NumberFormat('vi-VN').format(fin.waterCost)} đ
                            </span>
                          </div>
                          <div className="flex items-baseline justify-between text-[11px]">
                            <span className="font-bold text-white text-sm">{fin.waterM3} <span className="text-[10px] text-gray-400 font-normal">m³</span></span>
                            <span className="text-[9px] text-emerald-400">Áp lực ống: 2.8 bar ✓</span>
                          </div>
                          {/* Thanh đo */}
                          <div className="w-full bg-gray-800 h-1.5 overflow-hidden">
                            <div 
                              className="bg-cyan-400 h-full transition-all duration-500" 
                              style={{ width: `${Math.min(100, Math.round((fin.waterM3 / 25) * 100))}%` }}
                            />
                          </div>
                        </div>

                        {/* Chi tiết phí dịch vụ & xe */}
                        <div className="pt-1 space-y-1 text-[10.5px] text-gray-300">
                          <div className="flex justify-between py-0.5 border-b border-[#1E293B]">
                            <span className="text-gray-400">• Phí quản lý tòa nhà ({fin.area} m² x 18k):</span>
                            <span className="font-bold text-white">{new Intl.NumberFormat('vi-VN').format(fin.managementFee)} đ</span>
                          </div>
                          <div className="flex justify-between py-0.5 border-b border-[#1E293B]">
                            <span className="text-gray-400">• Phí gửi xe tầng hầm ({activeUnit.vehicles?.length || (fin.isOccupied ? 2 : 0)} xe):</span>
                            <span className="font-bold text-white">{new Intl.NumberFormat('vi-VN').format(fin.parkingFee)} đ</span>
                          </div>
                        </div>
                      </div>

                      {/* 3. NÚT TƯƠNG TÁC NHANH */}
                      <div className="grid grid-cols-2 gap-2 pt-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            setBillToastMessage(`✓ Đã trích xuất biên lai phiếu thu căn hộ ${activeUnit.code} thành công.`);
                            setTimeout(() => setBillToastMessage(null), 3500);
                          }}
                          className="py-2 px-2 bg-[#16202E] hover:bg-[#1E2B3E] text-gray-200 hover:text-white border border-[#2D3B4E] font-semibold text-[10.5px] transition-all flex items-center justify-center gap-1"
                        >
                          <Download className="w-3 h-3 text-[#C5A880]" /> Xuất Phiếu Thu
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setBillToastMessage(`✓ Đã gửi tin nhắn nhắc phí & hóa đơn tới chủ căn hộ ${activeUnit.code}.`);
                            setTimeout(() => setBillToastMessage(null), 3500);
                          }}
                          className="py-2 px-2 bg-[#162B22] hover:bg-[#1E3B2F] text-emerald-300 hover:text-emerald-200 border border-emerald-600/50 font-semibold text-[10.5px] transition-all flex items-center justify-center gap-1"
                        >
                          <Send className="w-3 h-3 text-emerald-400" /> Nhắc Phí Tự Động
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* 5. Nội dung Tab 3: Thông số kỹ thuật & phí */}
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

      {/* ============================================================= */}
      {/* 6. MODAL MỞ RỘNG KHÔNG GIAN MẶT BẰNG TOÀN CẢNH (DEEP-DIVE)     */}
      {/* ============================================================= */}
      {isFloorPlanExpanded && (() => {
        // Danh sách 8 căn của tầng đang chọn
        const floorExpandedUnits = ['01', '02', '03', '04', '05', '06', '07', '08'].map(num => {
          const targetCode = (selectedFloor === 12 && num === '05') ? '12A05' : `${selectedFloor > 9 ? selectedFloor : '0' + selectedFloor}${num}`;
          const found = apartments.find(u => 
            u.code.toLowerCase() === targetCode.toLowerCase() ||
            u.code.toLowerCase() === `${selectedFloor}A${num}`.toLowerCase() ||
            u.code.toLowerCase() === `${selectedFloor}B${num}`.toLowerCase()
          );
          return found || {
            code: targetCode,
            floor: selectedFloor,
            status: (selectedFloor === 12 && num === '05') ? 'OCCUPIED' : 'VACANT',
            area: (num === '01' || num === '04' || num === '07') ? 108 : (num === '02' || num === '08') ? 52 : 78.5,
            priceBillion: 4.5,
            direction: (num === '05' || num === '06') ? 'Đông Nam' : (num === '01' || num === '02') ? 'Tây Bắc' : 'Đông Bắc',
            bedrooms: (num === '01' || num === '04' || num === '07') ? 3 : (num === '02' || num === '08') ? 1 : 2,
            bathrooms: (num === '02' || num === '08') ? 1 : 2,
            typeLabel: (num === '01' || num === '04' || num === '07') ? '3 Phòng Ngủ' : (num === '02' || num === '08') ? '1 Phòng Ngủ' : '2 Phòng Ngủ',
            owner: (selectedFloor === 12 && num === '05') ? activeUnit?.owner : undefined
          } as ApartmentUnit;
        });

        // Căn hộ đang được xem chi tiết trong modal mở rộng
        const currentExpandedUnit = floorExpandedUnits.find(u => u.code === selectedAptCode) || floorExpandedUnits[0];
        const currentFin = getApartmentFinancialMetrics(currentExpandedUnit);

        // Tổng số liệu tầng
        const totalExpRevenue = floorExpandedUnits.reduce((sum, u) => sum + (getApartmentFinancialMetrics(u)?.totalBqlRevenue || 0), 0);
        const totalExpElectric = floorExpandedUnits.reduce((sum, u) => sum + (getApartmentFinancialMetrics(u)?.electricKwh || 0), 0);
        const totalExpWater = floorExpandedUnits.reduce((sum, u) => sum + (getApartmentFinancialMetrics(u)?.waterM3 || 0), 0);
        const occupiedExpCount = floorExpandedUnits.filter(u => u.status === 'OCCUPIED').length;

        return (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 text-white animate-fadeIn select-none">
            <div className="relative w-full h-[95vh] max-w-7xl bg-[#090D14] border border-[#C5A880]/80 shadow-2xl flex flex-col overflow-hidden">
              
              {/* Header Modal Mở Rộng */}
              <div className="p-3 sm:p-4 bg-[#101620] border-b border-[#222B35] flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-none bg-[#C5A880]/20 border border-[#C5A880] flex items-center justify-center">
                    <Layers className="w-4 h-4 text-[#C5A880]" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-serif font-bold text-white tracking-wide flex items-center gap-2">
                      <span>MẶT BẰNG KIẾN TRÚC TOÀN CẢNH • TẦNG {selectedFloor}</span>
                      <span className="text-[10px] px-2 py-0.5 bg-[#C5A880]/20 text-[#C5A880] border border-[#C5A880]/40 font-mono font-normal">
                        CHUNG CƯ SKYLINE RESIDENCE
                      </span>
                    </h2>
                    <div className="text-[10.5px] text-gray-400 font-mono mt-0.5">
                      1.280 m² sàn • 8 Căn hộ • 4 Thang khách tốc độ cao • 1 Thang PCCC có phòng đệm • 2 Buồng thoát hiểm áp suất dương
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsFloorPlanExpanded(false)}
                  className="px-3 py-1.5 bg-[#161B22] hover:bg-rose-950 text-gray-300 hover:text-rose-200 border border-[#2D3748] hover:border-rose-500 text-xs font-mono transition-all flex items-center gap-1.5"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>Thu Nhỏ (Đóng) [✕]</span>
                </button>
              </div>

              {/* Thanh Điều Khiển Tầng Nhanh & Lọc Trực Tiếp */}
              <div className="p-2.5 sm:p-3 bg-[#121820] border-b border-[#222B35] flex flex-wrap items-center justify-between gap-3 text-xs">
                {/* Chọn tầng nhanh */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-gray-400 font-mono text-[11px]">Chuyển Tầng:</span>
                  {[25, 22, 20, 19, 18, 16, 15, 12, 11, 10, 8, 5, 4].map(fl => (
                    <button
                      key={fl}
                      type="button"
                      onClick={() => {
                        setSelectedFloor(fl);
                        if (fl === 12) setSelectedAptCode('12A05');
                      }}
                      className={`px-2 py-1 text-[11px] font-mono transition-all border ${
                        selectedFloor === fl
                          ? 'bg-[#C5A880] text-[#0D1117] font-bold border-[#C5A880] shadow'
                          : 'bg-[#161B22] text-gray-300 border-[#2D3748] hover:border-gray-500'
                      }`}
                    >
                      {fl === 12 ? 'T12 ★' : `T${fl}`}
                    </button>
                  ))}
                </div>

                {/* Bộ lọc trạng thái trực tiếp trên mặt bằng */}
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 font-mono text-[11px]">Lọc Căn:</span>
                  <button
                    type="button"
                    onClick={() => setFloorFilterStatus('ALL')}
                    className={`px-2 py-1 text-[10.5px] font-mono border ${
                      floorFilterStatus === 'ALL'
                        ? 'bg-[#1F2937] text-white border-[#C5A880]'
                        : 'bg-[#161B22] text-gray-400 border-transparent hover:text-white'
                    }`}
                  >
                    Tất Cả (8)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFloorFilterStatus('OCCUPIED')}
                    className={`px-2 py-1 text-[10.5px] font-mono border ${
                      floorFilterStatus === 'OCCUPIED'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                        : 'bg-[#161B22] text-emerald-400/80 border-transparent hover:text-emerald-300'
                    }`}
                  >
                    ✓ Có Cư Dân ({occupiedExpCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFloorFilterStatus('VACANT')}
                    className={`px-2 py-1 text-[10.5px] font-mono border ${
                      floorFilterStatus === 'VACANT'
                        ? 'bg-amber-950 text-amber-300 border-amber-500'
                        : 'bg-[#161B22] text-amber-400/80 border-transparent hover:text-amber-300'
                    }`}
                  >
                    Chưa Ở ({8 - occupiedExpCount})
                  </button>
                </div>
              </div>

              {/* Thống kê nhanh dòng tiền & tiêu thụ tầng mở rộng */}
              <div className="px-3 sm:px-4 py-2 bg-[#0C121B] border-b border-[#1E293B] grid grid-cols-4 gap-2 text-[11px] font-mono text-center">
                <div className="p-1 bg-[#121A26] border border-[#222E3E]">
                  <span className="text-gray-400 text-[10px]">Doanh Thu Sàn Tầng:</span>
                  <div className="text-emerald-400 font-bold">{new Intl.NumberFormat('vi-VN').format(totalExpRevenue)} đ/th</div>
                </div>
                <div className="p-1 bg-[#121A26] border border-[#222E3E]">
                  <span className="text-gray-400 text-[10px]">Điện Tiêu Thụ:</span>
                  <div className="text-amber-300 font-bold">⚡ {totalExpElectric} kWh</div>
                </div>
                <div className="p-1 bg-[#121A26] border border-[#222E3E]">
                  <span className="text-gray-400 text-[10px]">Nước Tiêu Thụ:</span>
                  <div className="text-cyan-300 font-bold">💧 {totalExpWater} m³</div>
                </div>
                <div className="p-1 bg-[#121A26] border border-[#222E3E]">
                  <span className="text-gray-400 text-[10px]">Lấp Đầy:</span>
                  <div className="text-white font-bold">{occupiedExpCount}/8 Căn ({Math.round((occupiedExpCount / 8) * 100)}%)</div>
                </div>
              </div>

              {/* Thân Modal: 2 Cột (Trái: Sơ đồ mặt bằng chi tiết 70% | Phải: Thẻ kiến trúc không gian & Tiêu thụ 30%) */}
              <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
                
                {/* CỘT TRÁI: SƠ ĐỒ MẶT BẰNG SVG CHI TIẾT CAO CẤP */}
                <div className="lg:col-span-8 p-3 sm:p-5 bg-[#05080E] flex flex-col items-center justify-center overflow-auto border-r border-[#1E293B]">
                  <div className="w-full max-w-[850px] relative">
                    <svg viewBox="0 0 820 370" className="w-full drop-shadow-2xl">
                      {/* Đường bao sàn xây dựng */}
                      <rect x="15" y="15" width="790" height="340" fill="#0C131F" stroke="#1E293B" strokeWidth="2" />
                      
                      {/* LÕI GIAO THÔNG VÀ KỸ THUẬT TRUNG TÂM */}
                      <rect x="290" y="85" width="240" height="195" fill="#141E2D" stroke="#334155" strokeWidth="1.5" />
                      <text x="410" y="105" fill="#E2E8F0" fontSize="10" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                        LÕI GIAO THÔNG & HẠ TẦNG KỸ THUẬT
                      </text>

                      {/* 4 Thang máy khách Mitsubishi 3.5 m/s */}
                      <rect x="305" y="118" width="45" height="42" fill="#0F172A" stroke="#38BDF8" strokeWidth="1" />
                      <text x="327" y="138" fill="#38BDF8" fontSize="8" textAnchor="middle" fontFamily="monospace">THANG 1</text>
                      <text x="327" y="150" fill="#94A3B8" fontSize="6.5" textAnchor="middle">3.5 m/s</text>

                      <rect x="358" y="118" width="45" height="42" fill="#0F172A" stroke="#38BDF8" strokeWidth="1" />
                      <text x="380" y="138" fill="#38BDF8" fontSize="8" textAnchor="middle" fontFamily="monospace">THANG 2</text>
                      <text x="380" y="150" fill="#94A3B8" fontSize="6.5" textAnchor="middle">3.5 m/s</text>

                      <rect x="418" y="118" width="45" height="42" fill="#0F172A" stroke="#38BDF8" strokeWidth="1" />
                      <text x="440" y="138" fill="#38BDF8" fontSize="8" textAnchor="middle" fontFamily="monospace">THANG 3</text>
                      <text x="440" y="150" fill="#94A3B8" fontSize="6.5" textAnchor="middle">3.5 m/s</text>

                      <rect x="470" y="118" width="45" height="42" fill="#0F172A" stroke="#38BDF8" strokeWidth="1" />
                      <text x="492" y="138" fill="#38BDF8" fontSize="8" textAnchor="middle" fontFamily="monospace">THANG 4</text>
                      <text x="492" y="150" fill="#94A3B8" fontSize="6.5" textAnchor="middle">3.5 m/s</text>

                      {/* Thang hàng PCCC & Sảnh đệm áp suất dương */}
                      <rect x="340" y="170" width="140" height="32" fill="#1E293B" stroke="#F59E0B" strokeWidth="1" />
                      <text x="410" y="189" fill="#FDE68A" fontSize="8.5" textAnchor="middle" fontFamily="monospace">
                        THANG HÀNG & CHUYÊN DỤNG PCCC
                      </text>

                      {/* 2 Buồng Thang Thoát Hiểm Chống Khói */}
                      <rect x="305" y="212" width="105" height="38" fill="#0F172A" stroke="#10B981" strokeWidth="1" />
                      <text x="357" y="231" fill="#10B981" fontSize="7.5" textAnchor="middle" fontFamily="monospace">THOÁT HIỂM 1</text>
                      <text x="357" y="242" fill="#6EE7B7" fontSize="6.5" textAnchor="middle">Áp suất dương</text>

                      <rect x="420" y="212" width="95" height="38" fill="#0F172A" stroke="#10B981" strokeWidth="1" />
                      <text x="467" y="231" fill="#10B981" fontSize="7.5" textAnchor="middle" fontFamily="monospace">THOÁT HIỂM 2</text>
                      <text x="467" y="242" fill="#6EE7B7" fontSize="6.5" textAnchor="middle">Chống khói</text>

                      {/* Phòng gom rác tự động & Kỹ thuật điện nước */}
                      <rect x="305" y="255" width="105" height="20" fill="#1A2230" stroke="#64748B" strokeWidth="0.8" />
                      <text x="357" y="268" fill="#94A3B8" fontSize="7" textAnchor="middle" fontFamily="monospace">GOM RÁC HÚT CHÂN KHÔNG</text>

                      <rect x="420" y="255" width="95" height="20" fill="#1A2230" stroke="#64748B" strokeWidth="0.8" />
                      <text x="467" y="268" fill="#94A3B8" fontSize="7" textAnchor="middle" fontFamily="monospace">KỸ THUẬT ĐIỆN - NƯỚC</text>

                      {/* Hành lang đón gió đối lưu Đông - Tây */}
                      <rect x="145" y="85" width="135" height="195" fill="#0B1017" stroke="#1E293B" strokeDasharray="3 3" />
                      <rect x="540" y="85" width="135" height="195" fill="#0B1017" stroke="#1E293B" strokeDasharray="3 3" />
                      <text x="212" y="185" fill="#64748B" fontSize="9" textAnchor="middle" fontFamily="monospace">HÀNH LANG TÂY (1.8m)</text>
                      <text x="607" y="185" fill="#64748B" fontSize="9" textAnchor="middle" fontFamily="monospace">HÀNH LANG ĐÔNG (1.8m)</text>

                      {/* 8 CĂN HỘ TRÊN MẶT BẰNG MỞ RỘNG */}
                      {floorExpandedUnits.map(unit => {
                        const isSelected = unit.code === selectedAptCode;
                        const isOcc = unit.status === 'OCCUPIED';
                        const isDimmed = (floorFilterStatus === 'OCCUPIED' && !isOcc) || (floorFilterStatus === 'VACANT' && isOcc);
                        const unitNum = unit.code.slice(-2);

                        // Tọa độ tương ứng từng căn
                        let coords = { x: 25, y: 25, w: 110, h: 145 };
                        if (unitNum === '02') coords = { x: 145, y: 25, w: 135, h: 52 };
                        else if (unitNum === '03') coords = { x: 290, y: 25, w: 240, h: 52 };
                        else if (unitNum === '04') coords = { x: 540, y: 25, w: 135, h: 52 };
                        else if (unitNum === '05' || unit.code === '12A05') coords = { x: 685, y: 180, w: 110, h: 165 };
                        else if (unitNum === '06') coords = { x: 685, y: 25, w: 110, h: 145 };
                        else if (unitNum === '07') coords = { x: 540, y: 290, w: 135, h: 55 };
                        else if (unitNum === '08') coords = { x: 25, y: 180, w: 110, h: 165 };

                        const fin = getApartmentFinancialMetrics(unit);

                        return (
                          <g
                            key={unit.code}
                            onClick={() => setSelectedAptCode(unit.code)}
                            className="cursor-pointer transition-all duration-200"
                            style={{ opacity: isDimmed ? 0.25 : 1 }}
                          >
                            <rect
                              x={coords.x}
                              y={coords.y}
                              width={coords.w}
                              height={coords.h}
                              fill={isOcc ? (isSelected ? '#065F46' : '#044332') : (isSelected ? '#78350F' : '#131A26')}
                              stroke={isSelected ? '#F59E0B' : (isOcc ? '#10B981' : '#334155')}
                              strokeWidth={isSelected ? '3' : '1.5'}
                              className="hover:brightness-125 transition-all"
                            />

                            {/* Mã căn & Loại căn */}
                            <text
                              x={coords.x + coords.w / 2}
                              y={coords.y + (coords.h > 100 ? 30 : 22)}
                              fill="#FFFFFF"
                              fontSize={coords.h > 100 ? 11 : 9.5}
                              fontWeight="bold"
                              fontFamily="monospace"
                              textAnchor="middle"
                            >
                              CĂN {unit.code}
                            </text>

                            <text
                              x={coords.x + coords.w / 2}
                              y={coords.y + (coords.h > 100 ? 46 : 37)}
                              fill={isOcc ? '#A7F3D0' : '#94A3B8'}
                              fontSize={coords.h > 100 ? 8.5 : 7.5}
                              textAnchor="middle"
                            >
                              {unit.typeLabel} • {unit.area}m²
                            </text>

                            {/* Badge trạng thái */}
                            <rect
                              x={coords.x + coords.w / 2 - 40}
                              y={coords.y + (coords.h > 100 ? 58 : 39)}
                              width={80}
                              height={15}
                              fill={isOcc ? '#10B981' : '#B45309'}
                              style={{ display: coords.h > 100 ? 'block' : 'none' }}
                            />
                            <text
                              x={coords.x + coords.w / 2}
                              y={coords.y + (coords.h > 100 ? 69 : 49)}
                              fill={isOcc ? '#0D1117' : '#FFFFFF'}
                              fontSize="7.5"
                              fontWeight="bold"
                              textAnchor="middle"
                              style={{ display: coords.h > 100 ? 'block' : 'none' }}
                            >
                              {isOcc ? 'CÓ CƯ DÂN' : 'NHÀ TRỐNG'}
                            </text>

                            {/* Tiêu thụ & thu nhập nhỏ gọn */}
                            {coords.h > 100 && (
                              <text
                                x={coords.x + coords.w / 2}
                                y={coords.y + 90}
                                fill="#FDE68A"
                                fontSize="7.5"
                                fontWeight="bold"
                                textAnchor="middle"
                                fontFamily="monospace"
                              >
                                ⚡ {fin?.electricKwh} kWh • {fin ? (fin.totalBqlRevenue / 1000000).toFixed(1) + ' tr' : ''}
                              </text>
                            )}

                            {/* Chủ hộ */}
                            {isOcc && coords.h > 100 && (
                              <text
                                x={coords.x + coords.w / 2}
                                y={coords.y + 115}
                                fill="#D1FAE5"
                                fontSize="8"
                                fontWeight="bold"
                                textAnchor="middle"
                              >
                                {unit.owner?.name || 'Nguyễn Hữu Lực'}
                              </text>
                            )}
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                  <div className="text-[11px] text-gray-400 font-mono mt-3 flex items-center gap-4">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-emerald-500 inline-block"></span> Đã có cư dân</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#131A26] border border-gray-600 inline-block"></span> Nhà trống sẵn sàng bàn giao</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-amber-500 inline-block"></span> Căn đang chọn hiển thị chi tiết</span>
                  </div>
                </div>

                {/* CỘT PHẢI: THẺ MỞ RỘNG KIẾN TRÚC KHÔNG GIAN & TIÊU THỤ HÀNG THÁNG */}
                <div className="lg:col-span-4 p-4 bg-[#0D121B] flex flex-col justify-between overflow-y-auto space-y-3">
                  <div className="space-y-3">
                    {/* Header căn hộ */}
                    <div className="pb-2.5 border-b border-[#222B35] flex items-start justify-between">
                      <div>
                        <div className="text-[10px] text-[#C5A880] font-mono font-semibold uppercase">
                          CHI TIẾT MỞ RỘNG • TẦNG {currentExpandedUnit.floor}
                        </div>
                        <h3 className="text-xl font-serif font-bold text-white mt-0.5">
                          Căn Hộ {currentExpandedUnit.code}
                        </h3>
                      </div>
                      <span className={`px-2 py-0.5 text-[10px] font-bold border ${
                        currentExpandedUnit.status === 'OCCUPIED'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                          : 'bg-amber-950 text-amber-300 border-amber-500'
                      }`}>
                        {currentExpandedUnit.status === 'OCCUPIED' ? 'CÓ CƯ DÂN' : 'NHÀ TRỐNG'}
                      </span>
                    </div>

                    {/* 1. Phân Bổ Kiến Trúc Không Gian Phòng Ốc */}
                    <div className="p-2.5 bg-[#121822] border border-[#222B35] space-y-2">
                      <div className="text-[11px] font-bold text-[#C5A880] flex items-center gap-1.5">
                        <Home className="w-3.5 h-3.5" /> BỐ TRÍ MẶT BẰNG KHÔNG GIAN
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 text-[10.5px] font-mono">
                        <div className="p-1.5 bg-[#161F2C]">
                          <span className="text-gray-400">Phòng Khách & Bếp:</span>
                          <div className="text-white font-bold">{Math.round(currentExpandedUnit.area * 0.45)} m²</div>
                        </div>
                        <div className="p-1.5 bg-[#161F2C]">
                          <span className="text-gray-400">Phòng Ngủ Master:</span>
                          <div className="text-white font-bold">{Math.round(currentExpandedUnit.area * 0.28)} m²</div>
                        </div>
                        <div className="p-1.5 bg-[#161F2C]">
                          <span className="text-gray-400">Phòng Ngủ Phụ & WC:</span>
                          <div className="text-white font-bold">{Math.round(currentExpandedUnit.area * 0.2)} m²</div>
                        </div>
                        <div className="p-1.5 bg-[#161F2C]">
                          <span className="text-gray-400">Logia & Giặt Phơi:</span>
                          <div className="text-white font-bold">{Math.round(currentExpandedUnit.area * 0.07)} m²</div>
                        </div>
                      </div>

                      {/* Vi khí hậu & view nhìn */}
                      <div className="pt-1 border-t border-[#1F2A38] text-[10.5px] font-mono space-y-1">
                        <div className="flex justify-between text-gray-300">
                          <span className="text-gray-400 flex items-center gap-1"><Sun className="w-3 h-3 text-amber-400" /> Hướng Ban Công:</span>
                          <strong className="text-[#C5A880]">{currentExpandedUnit.direction || 'Đông Nam'}</strong>
                        </div>
                        <div className="flex justify-between text-gray-300">
                          <span className="text-gray-400 flex items-center gap-1"><Wind className="w-3 h-3 text-cyan-400" /> Tầm Nhìn (View):</span>
                          <strong className="text-white truncate max-w-[150px]">Sông Sài Gòn & Hồ Bơi</strong>
                        </div>
                        <div className="flex justify-between text-gray-300">
                          <span className="text-gray-400">Chiếu Sáng Tự Nhiên:</span>
                          <strong className="text-emerald-400">94% diện tích sàn</strong>
                        </div>
                      </div>
                    </div>

                    {/* 2. Tiêu Thụ Hàng Tháng & Thu Nhập Căn Này */}
                    <div className="p-2.5 bg-[#121822] border border-[#222B35] space-y-2 text-xs font-mono">
                      <div className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                        <Coins className="w-3.5 h-3.5 text-amber-400" /> TIÊU THỤ NĂNG LƯỢNG & DOANH THU CĂN
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                        <div className="p-1.5 bg-[#161F2C] border border-[#26354A]">
                          <div className="text-gray-400 flex items-center gap-1">
                            <Zap className="w-3 h-3 text-amber-400" /> Điện Tiêu Thụ:
                          </div>
                          <div className="text-white font-bold mt-0.5">{currentFin?.electricKwh} kWh</div>
                          <div className="text-[9.5px] text-amber-300">{new Intl.NumberFormat('vi-VN').format(currentFin?.electricCost || 0)} đ</div>
                        </div>

                        <div className="p-1.5 bg-[#161F2C] border border-[#26354A]">
                          <div className="text-gray-400 flex items-center gap-1">
                            <Droplets className="w-3 h-3 text-cyan-400" /> Nước Tiêu Thụ:
                          </div>
                          <div className="text-white font-bold mt-0.5">{currentFin?.waterM3} m³</div>
                          <div className="text-[9.5px] text-cyan-300">{new Intl.NumberFormat('vi-VN').format(currentFin?.waterCost || 0)} đ</div>
                        </div>
                      </div>

                      <div className="pt-1 border-t border-[#1F2A38] space-y-1 text-[10.5px]">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Doanh Thu Phí BQL Thu Về:</span>
                          <strong className="text-emerald-400">{new Intl.NumberFormat('vi-VN').format(currentFin?.totalBqlRevenue || 0)} đ/tháng</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Giá Cho Thuê Tham Chiếu:</span>
                          <strong className="text-amber-300">{new Intl.NumberFormat('vi-VN').format(currentFin?.estimatedRentalPrice || 0)} đ/tháng</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Suất Sinh Lời Cho Thuê:</span>
                          <strong className="text-emerald-400">{currentFin?.rentalYield}% / năm</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Nút hành động */}
                  <div className="pt-2 border-t border-[#222B35] flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsFloorPlanExpanded(false);
                        setSelectedAptCode(currentExpandedUnit.code);
                        setDetailTab('FINANCIAL');
                      }}
                      className="flex-1 py-2 px-3 bg-[#C5A880] hover:bg-white text-[#0D1117] font-bold text-xs font-mono transition-all flex items-center justify-center gap-1.5"
                    >
                      <Coins className="w-3.5 h-3.5" /> Xem Hóa Đơn & Tiêu Thụ
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsFloorPlanExpanded(false);
                        setSelectedAptCode(currentExpandedUnit.code);
                        setIsDetailModalOpen(true);
                      }}
                      className="py-2 px-3 bg-[#161F2C] hover:bg-[#202B3C] text-white border border-[#2D3748] font-bold text-xs font-mono transition-all"
                    >
                      Hồ Sơ Căn
                    </button>
                  </div>
                </div>

              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}
