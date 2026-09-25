'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  getApartmentUnits, 
  getApartmentByCode, 
  syncApartmentsFromNksApi,
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

export type BuildingColorTone = 'GOLD_LUXURY';

// Danh sách các khối căn hộ kiến trúc hiển thị trên mô hình 3D (hỗ trợ tối đa 39 tầng phân khu The Tropical - Block BS-07, BS-08, BS-09, BS-10 từ NKS API)
export const BUILDING_3D_UNITS: {
  code: string;
  floor: number;
  side: 'LEFT' | 'RIGHT';
  type: ApartmentType;
  defaultStatus: ApartmentStatus;
  area: number;
  defaultName?: string;
}[] = (() => {
  const list: any[] = [];
  for (let fl = 39; fl >= 1; fl--) {
    if (fl === 30) {
      list.push({ code: 'CH-06', floor: 30, side: 'LEFT', type: '1PN', defaultStatus: 'OCCUPIED', area: 42, defaultName: 'Trần Hữu Lực' });
      list.push({ code: 'CH-01', floor: 30, side: 'RIGHT', type: '2PN', defaultStatus: 'OCCUPIED', area: 50, defaultName: 'Trần Hữu Lực' });
    } else if (fl === 20) {
      list.push({ code: '20-CH-06', floor: 20, side: 'LEFT', type: '1PN', defaultStatus: 'OCCUPIED', area: 42, defaultName: 'Chủ Hộ (0364967080)' });
      list.push({ code: '20-CH-01', floor: 20, side: 'RIGHT', type: '2PN', defaultStatus: 'VACANT', area: 60, defaultName: 'Căn Hộ Trống' });
    } else {
      list.push({ code: `${fl}-CH-06`, floor: fl, side: 'LEFT', type: '1PN', defaultStatus: 'VACANT', area: 42, defaultName: 'Căn Hộ Trống' });
      list.push({ code: `${fl}-CH-01`, floor: fl, side: 'RIGHT', type: '2PN', defaultStatus: 'VACANT', area: 60, defaultName: 'Căn Hộ Trống' });
    }
  }
  return list;
})();

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
    const isOwnerTarget = unit.code === 'CH-06' || unit.code.endsWith('CH-06') || (unit.floor === 30 && (unit.code === 'CH-01' || unit.code.endsWith('CH-01')));
    parkingFee = isOwnerTarget ? 1320000 : 120000;
  }

  // 3. Tiêu thụ điện sinh hoạt
  let electricKwh = 0;
  let electricCost = 0;
  let waterM3 = 0;
  let waterCost = 0;

  if (isOccupied) {
    const isOwnerTarget = unit.code === 'CH-06' || unit.code.endsWith('CH-06') || (unit.floor === 30 && (unit.code === 'CH-01' || unit.code.endsWith('CH-01')));
    electricKwh = isOwnerTarget ? 285 : Math.round(180 + (area * 1.4));
    // Đơn giá điện lực bậc thang trung bình ~3.100 đ/kWh
    electricCost = Math.round(electricKwh * 3100);
    waterM3 = isOwnerTarget ? 18 : Math.max(12, Math.round(area * 0.22));
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
  // 1. Quản lý danh sách căn hộ thực tế từ apartmentStore & NKS API
  const [apartments, setApartments] = useState<ApartmentUnit[]>([]);
  const [selectedAptCode, setSelectedAptCode] = useState<string>('CH-06');
  const [selectedBlock, setSelectedBlock] = useState<'BS-07' | 'BS-08' | 'BS-09' | 'BS-10'>('BS-07');
  const buildingColorTone: BuildingColorTone = 'GOLD_LUXURY';
  const [isSyncingApi, setIsSyncingApi] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const [selectedOccupancy, setSelectedOccupancy] = useState<OccupancyFilter>('ALL');
  const [selectedType, setSelectedType] = useState<ApartmentTypeFilter>('ALL');
  const [selectedFloorRange, setSelectedFloorRange] = useState<FloorRangeFilter>('ALL');
  const [isOnlyOwnerUnits, setIsOnlyOwnerUnits] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [buildingPerspective, setBuildingPerspective] = useState<ViewPerspective>('3D');
  const [detailTab, setDetailTab] = useState<'OVERVIEW' | 'FINANCIAL' | 'TECHNICAL'>('OVERVIEW');

  // Điều khiển Floor Plan View (Mặt Bằng Tầng & Chế độ Mở Rộng) - Mặc định tầng 30 của chủ hộ
  const [selectedFloor, setSelectedFloor] = useState<number>(30);
  const [hoveredUnitCode, setHoveredUnitCode] = useState<string | null>(null);
  const [hoveredFloor, setHoveredFloor] = useState<number | null>(null);
  const [buildingTheme, setBuildingTheme] = useState<'NIGHT' | 'DAY'>('NIGHT');
  const [isFloorPlanExpanded, setIsFloorPlanExpanded] = useState<boolean>(false);
  const [floorFilterStatus, setFloorFilterStatus] = useState<'ALL' | 'OCCUPIED' | 'VACANT'>('ALL');
  const [billToastMessage, setBillToastMessage] = useState<string | null>(null);

  // Modals state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // 2. Dữ liệu thực tế cho cư dân căn hộ CH-06 từ API & userStore
  const initialOwner = getUserStore('user-owner-1');
  const initialMembers = getApartmentMembers('CH-06');
  const [liveOwner, setLiveOwner] = useState<any>(null);
  const [liveMembers, setLiveMembers] = useState<ApartmentMember[]>(initialMembers);

  // Hàm tải danh sách căn hộ từ kho theo block
  const reloadApartments = (bCode: string = selectedBlock) => {
    const list = getApartmentUnits(bCode);
    setApartments(list);
  };

  // Chuyển đổi giữa 4 Block tòa nhà từ NKS API
  const handleSwitchBlock = async (blockCode: 'BS-07' | 'BS-08' | 'BS-09' | 'BS-10') => {
    setSelectedBlock(blockCode);
    const maxFloors = blockCode === 'BS-08' ? 39 : 34;
    if (selectedFloor > maxFloors) {
      setSelectedFloor(maxFloors);
    }
    // Load local block units immediately for instant UI responsiveness
    const localUnits = getApartmentUnits(blockCode);
    setApartments(localUnits);

    setIsSyncingApi(true);
    try {
      const units = await syncApartmentsFromNksApi(blockCode);
      setApartments(units);
      const bTitle = blockCode === 'BS-08' 
        ? 'Tropical BS-08 (39 Tầng)' 
        : blockCode === 'BS-09' 
        ? 'Tropical BS-09 (34 Tầng)' 
        : blockCode === 'BS-10' 
        ? 'Tropical BS-10 (34 Tầng)' 
        : 'Tropical BS-07 (34 Tầng)';
      setSyncMessage(`Đã chuyển sang ${bTitle}`);
      setTimeout(() => setSyncMessage(null), 3500);
    } catch (e) {
      console.warn('Switch block error:', e);
    } finally {
      setIsSyncingApi(false);
    }
  };

  // Lắng nghe thay đổi từ storage
  useEffect(() => {
    reloadApartments(selectedBlock);

    const handleUpdate = (e: any) => {
      if (e?.detail?.blockCode && e.detail.blockCode !== selectedBlock) {
        return;
      }
      reloadApartments(selectedBlock);
    };

    window.addEventListener('skyline_apartments_updated', handleUpdate);
    return () => {
      window.removeEventListener('skyline_apartments_updated', handleUpdate);
    };
  }, [selectedBlock]);

  // Đồng bộ thông tin thực tế của chủ hộ CH-06 từ API NKS
  useEffect(() => {
    let isMounted = true;
    async function syncRealResident() {
      try {
        const famRes = await fetch('/api/user/family?aptCode=CH-06');
        if (famRes.ok) {
          const famData = await famRes.json();
          if (famData.success && Array.isArray(famData.members) && famData.members.length > 0) {
            if (isMounted) setLiveMembers(famData.members);
          }
        }

        const userRes = await fetch('/api/user');
        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData.user && isMounted) {
            if (userData.user.role === 'OWNER' && (userData.user.apartment_code === 'CH-06' || userData.user.apartment_code === '12A05' || !userData.user.role?.includes('ADMIN'))) {
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

  // Thông tin chủ hộ CH-06 chuẩn thực tế
  const isActualResident = 
    liveOwner && 
    liveOwner.role === 'OWNER' && 
    (liveOwner.apartment_code === 'CH-06' || liveOwner.apartment_code === '12A05') &&
    !liveOwner.email?.includes('manager') &&
    !liveOwner.full_name?.includes('Quản Trị');

  const ownerData = isActualResident ? liveOwner : initialOwner;

  const activeOwnerName = isActualResident 
    ? (liveOwner.full_name || liveOwner.fullname || 'Trần Hữu Lực')
    : (initialOwner?.full_name || 'Trần Hữu Lực');

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

  const currentBlockConfig = useMemo(() => {
    switch (selectedBlock) {
      case 'BS-08':
        return { name: 'Tropical BS-08', floors: 39, badge: 'Tháp Biểu Tượng (39 Tầng)' };
      case 'BS-09':
        return { name: 'Tropical BS-09', floors: 34, badge: 'Tháp View Công Viên (34 Tầng)' };
      case 'BS-10':
        return { name: 'Tropical BS-10', floors: 34, badge: 'Tháp Quảng Trường (34 Tầng)' };
      default:
        return { name: 'Tropical BS-07', floors: 34, badge: 'Tòa Cư Dân Chính (34 Tầng)' };
    }
  }, [selectedBlock]);

  const currentBlockName = currentBlockConfig.name;
  const currentTotalFloors = currentBlockConfig.floors;

  // Danh sách căn hộ hiển thị với dữ liệu người thật được cập nhật từ NKS API
  const displayUnits = useMemo(() => {
    return apartments.map(u => {
      const isOwnerPrimary = u.code === 'CH-06' || (u.floor === 30 && u.code.includes('CH-06')) || u.code === '12A05';
      const isOwnerSecondary = u.floor === 30 && (u.code === 'CH-01' || u.code.includes('CH-01'));

      if (isOwnerPrimary) {
        return {
          ...u,
          towerName: currentBlockName,
          status: 'OCCUPIED' as ApartmentStatus,
          statusLabel: 'Đã Bàn Giao (Căn Hộ Chính Chủ)',
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

      if (isOwnerSecondary) {
        return {
          ...u,
          towerName: currentBlockName,
          status: 'OCCUPIED' as ApartmentStatus,
          statusLabel: 'Đã Bàn Giao (Căn Phụ Cùng Chủ Hộ)',
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
          }
        };
      }

      return {
        ...u,
        towerName: currentBlockName
      };
    });
  }, [apartments, activeOwnerName, activeOwnerPhone, activeOwnerEmail, activeOwnerCccd, activeOwnerAvatar, activeOwnerDob, activeOwnerPob, liveMembers, currentBlockName]);

  // Bộ lọc căn hộ đa tiêu chí & tìm kiếm thông minh
  const filteredUnits = useMemo(() => {
    return displayUnits.filter(unit => {
      // 1. Lọc theo chủ hộ chính (Trần Hữu Lực)
      if (isOnlyOwnerUnits) {
        const isOwner = unit.owner?.phone === activeOwnerPhone || 
          unit.owner?.name?.toLowerCase().includes('lực') ||
          unit.code === 'CH-06' || 
          (unit.floor === 30 && (unit.code === 'CH-01' || unit.code.includes('CH-01') || unit.code === 'CH-06' || unit.code.includes('CH-06')));
        if (!isOwner) return false;
      }

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
  }, [displayUnits, selectedOccupancy, selectedType, selectedFloorRange, searchQuery, isOnlyOwnerUnits, activeOwnerPhone]);

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
    isOnlyOwnerUnits ||
    searchQuery.trim() !== '';

  const resetAllFilters = () => {
    setSelectedOccupancy('ALL');
    setSelectedType('ALL');
    setSelectedFloorRange('ALL');
    setIsOnlyOwnerUnits(false);
    setSearchQuery('');
  };

  // Bộ tra cứu O(1) phục vụ lọc thống nhất trên toàn bộ hệ thống (3D, Mặt Đứng, Mặt Bằng, Lưới)
  const matchingUnitCodesSet = useMemo(() => {
    return new Set(filteredUnits.map(u => u.code.toUpperCase()));
  }, [filteredUnits]);

  const matchingFloorsSet = useMemo(() => {
    return new Set(filteredUnits.map(u => u.floor));
  }, [filteredUnits]);

  // Hàm kiểm tra thống nhất căn hộ có khớp bộ lọc hay không trên toàn bộ giao diện
  const isUnitMatchingFilter = useCallback((unitCode: string, floor?: number) => {
    if (!isAnyFilterActive) return true;
    const clean = unitCode.toUpperCase();
    if (matchingUnitCodesSet.has(clean)) return true;
    return filteredUnits.some(f => 
      f.code.toUpperCase() === clean || 
      f.code.toUpperCase().endsWith(`-${clean}`) || 
      clean.endsWith(`-${f.code.toUpperCase()}`) ||
      (floor !== undefined && f.floor === floor && (clean.includes(f.code.toUpperCase()) || f.code.toUpperCase().includes(clean)))
    );
  }, [isAnyFilterActive, matchingUnitCodesSet, filteredUnits]);

  // Căn hộ đang được chọn làm tiêu điểm hồ sơ (ưu tiên căn chủ hộ tầng 30)
  const activeUnit = useMemo(() => {
    return (
      displayUnits.find(u => u.code === selectedAptCode && u.floor === selectedFloor) ||
      displayUnits.find(u => u.code === selectedAptCode) ||
      displayUnits.find(u => u.floor === selectedFloor && (u.code === 'CH-06' || u.code.endsWith('CH-06'))) ||
      displayUnits.find(u => u.floor === selectedFloor) ||
      displayUnits[0] ||
      null
    );
  }, [displayUnits, selectedAptCode, selectedFloor]);

  // Cấu hình Tone màu sang trọng mặc định (Hoàng Gia Gold) cho phối cảnh BIM 3D
  const toneConfig = useMemo(() => ({
    GOLD_LUXURY: {
      id: 'GOLD_LUXURY' as BuildingColorTone,
      label: 'Hoàng Gia Gold',
      containerBg: buildingTheme === 'NIGHT' ? 'bg-[#040711]' : 'bg-[#091122]',
      gridLineColor: buildingTheme === 'NIGHT' ? '#1E293B' : '#C5A880',
      glassL: buildingTheme === 'NIGHT' ? ['#172033', '#0F1626', '#060A13'] : ['#22324F', '#152136', '#0B1322'],
      glassR: buildingTheme === 'NIGHT' ? ['#2D3D5A', '#1C293E', '#0B1320'] : ['#3A5074', '#25354F', '#111D30'],
      borderBuilding: '#C5A880',
      roofColor: '#172033',
      crownColor: '#D4AF37',
      titleColor: '#E6CA9E',
      laserBeamColor: '#C5A880',
      podiumGrad: ['#1A253A', '#0F1726', '#070C15'],
      accentTag: 'bg-[#C5A880] text-black',
      mullionColor: '#C5A880',
    },
  }), [buildingTheme]);

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
          <div className="text-[11px] uppercase tracking-wider text-[#C5A880] font-semibold font-mono">
            THE TROPICAL • BEVERLY SOLARI
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl text-white font-bold mt-0.5 flex items-center gap-2">
            Sơ Đồ Tầng & Căn Hộ
            <span className="text-xs px-2.5 py-1 bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 font-mono font-normal">
              100% LIVE NKS API
            </span>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Trung tâm giám sát mặt bằng trực quan & quản lý kỹ thuật vận hành theo thời gian thực.
          </p>
        </div>

        {/* Nút hành động BQL */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider rounded-none transition-all shadow-lg active:scale-95"
          >
            Thêm Căn Hộ Mới
          </button>
        </div>
      </div>

      {/* ============================================================= */}
      {/* TRUNG TÂM ĐIỀU HÀNH BQL: KHỐI THÁP, KPI THỰC TẾ & BỘ LỌC TẬP TRUNG */}
      {/* ============================================================= */}
      <div className="bg-[#0B121D] border border-[#22344B] p-2.5 sm:p-3 space-y-2.5 shadow-lg">
        {/* HÀNG 1: CHỌN KHỐI THÁP + 4 CHỈ SỐ KPI BQL + ĐỒNG BỘ NKS API */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#1A283B]">
          {/* Chọn Khối Tháp */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-mono text-gray-400 mr-1">Khối Tháp:</span>
            {[
              { code: 'BS-07', name: 'BS-07', floors: 34 },
              { code: 'BS-08', name: 'BS-08', floors: 39, highlight: true },
              { code: 'BS-09', name: 'BS-09', floors: 34 },
              { code: 'BS-10', name: 'BS-10', floors: 34 },
            ].map(b => {
              const isCurrent = selectedBlock === b.code;
              return (
                <button
                  key={b.code}
                  type="button"
                  onClick={() => handleSwitchBlock(b.code as any)}
                  className={`px-2.5 py-1 text-xs font-mono transition-all flex items-center gap-1.5 border ${
                    isCurrent
                      ? 'bg-[#C5A880] text-black border-[#C5A880] font-bold shadow'
                      : 'bg-[#121B27] text-gray-300 border-[#1E2D42] hover:border-[#385175] hover:text-white'
                  }`}
                >
                  <span>{b.name}</span>
                  <span className={`text-[10px] px-1 ${isCurrent ? 'bg-black/20 text-black font-bold' : 'bg-[#152132] text-cyan-300'}`}>
                    {b.floors}T
                  </span>
                  {b.highlight && !isCurrent && (
                    <span className="text-[9px] px-1 bg-amber-500/20 text-amber-300 border border-amber-500/30">Top</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* 4 Chỉ Số KPI BQL & Đồng bộ API (Tích hợp click lọc nhanh) */}
          <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
            <button
              type="button"
              onClick={() => setSelectedOccupancy('ALL')}
              className={`px-2.5 py-1 border transition-all cursor-pointer ${
                selectedOccupancy === 'ALL'
                  ? 'bg-[#1C2533] border-[#C5A880] text-white shadow-sm ring-1 ring-[#C5A880]/60'
                  : 'bg-[#121820] border-[#222B35] text-gray-300 hover:border-gray-500'
              }`}
              title="Xem toàn bộ căn hộ"
            >
              <span className="text-gray-400">Tổng: </span>
              <strong className="text-white font-bold">{totalUnitsCount}</strong>
            </button>
            <button
              type="button"
              onClick={() => setSelectedOccupancy(selectedOccupancy === 'OCCUPIED' ? 'ALL' : 'OCCUPIED')}
              className={`px-2.5 py-1 border transition-all cursor-pointer ${
                selectedOccupancy === 'OCCUPIED'
                  ? 'bg-emerald-950 border-emerald-400 text-emerald-200 ring-1 ring-emerald-400 shadow-sm'
                  : 'bg-[#121820] border-emerald-500/40 text-emerald-300 hover:border-emerald-400'
              }`}
              title="Lọc nhanh các căn hộ Đã Có Người Ở"
            >
              <span className="text-gray-400">Đã Ở: </span>
              <strong className="font-bold">{occupiedCount} ({occupancyRate}%)</strong>
            </button>
            <button
              type="button"
              onClick={() => setSelectedOccupancy(selectedOccupancy === 'VACANT' ? 'ALL' : 'VACANT')}
              className={`px-2.5 py-1 border transition-all cursor-pointer ${
                selectedOccupancy === 'VACANT'
                  ? 'bg-amber-950 border-amber-400 text-amber-200 ring-1 ring-amber-400 shadow-sm'
                  : 'bg-[#121820] border-amber-500/40 text-amber-300 hover:border-amber-400'
              }`}
              title="Lọc nhanh các Căn Hộ Trống"
            >
              <span className="text-gray-400">Trống: </span>
              <strong className="font-bold">{vacantCount}</strong>
            </button>
            <button
              type="button"
              onClick={() => setSelectedOccupancy(selectedOccupancy === 'MAINTENANCE' ? 'ALL' : 'MAINTENANCE')}
              className={`px-2.5 py-1 border transition-all cursor-pointer ${
                selectedOccupancy === 'MAINTENANCE'
                  ? 'bg-blue-950 border-blue-400 text-blue-200 ring-1 ring-blue-400 shadow-sm'
                  : 'bg-[#121820] border-blue-500/40 text-blue-300 hover:border-blue-400'
              }`}
              title="Lọc nhanh các căn Nghiệm Thu / Bảo Trì"
            >
              <span className="text-gray-400">Nghiệm Thu: </span>
              <strong className="font-bold">{maintenanceCount}</strong>
            </button>

            <div className="h-4 w-[1px] bg-[#1E2E44] hidden sm:block" />

            {/* Trạng thái NKS API Live & Nút Đồng Bộ */}
            {syncMessage && (
              <span className="text-xs text-emerald-400 font-mono animate-fadeIn bg-emerald-950/60 px-2 py-0.5 border border-emerald-700/50">
                {syncMessage}
              </span>
            )}
            <button
              type="button"
              onClick={async () => {
                setIsSyncingApi(true);
                const units = await syncApartmentsFromNksApi(selectedBlock);
                setApartments(units);
                setIsSyncingApi(false);
                setSyncMessage('Đã đồng bộ NKS API!');
                setTimeout(() => setSyncMessage(null), 3000);
              }}
              disabled={isSyncingApi}
              className="px-3 py-1 bg-[#1A2638] hover:bg-[#23354E] text-[#C5A880] hover:text-white text-xs font-semibold border border-[#2D4363] transition-all disabled:opacity-50"
              title="Đồng bộ dữ liệu từ NKS SCRMAI API"
            >
              <span>{isSyncingApi ? 'Đang đồng bộ...' : 'Đồng Bộ NKS API'}</span>
            </button>
          </div>
        </div>

        {/* HÀNG 2: BỘ LỌC TÌM KIẾM CĂN HỘ TẬP TRUNG */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs">
          {/* Nhóm trái: Ô tìm kiếm thông minh */}
          <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-sm">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 250)}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm căn (CH-06), tầng (T30), cư dân (Lực)..."
                className="w-full bg-[#161B22] border border-[#2D3748] px-2.5 py-1 text-white text-xs placeholder:text-gray-500 outline-none focus:border-[#C5A880] transition-colors font-mono"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white font-mono text-xs"
                  title="Xóa tìm kiếm"
                >
                  ✕
                </button>
              )}

              {/* Instant Search Matches Dropdown */}
              {isSearchFocused && searchQuery.trim() !== '' && (
                <div className="absolute top-full left-0 mt-1.5 w-84 bg-[#0F141C] border border-[#C5A880]/50 shadow-2xl z-50 divide-y divide-[#1F2937] max-h-64 overflow-y-auto">
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
                            <div className="text-white text-xs font-semibold truncate flex items-center gap-1">
                              <span>{u.owner?.name ? u.owner.name : 'Nhà Trống'}</span>
                              {(u.code === 'CH-06' || (u.floor === 30 && u.code === 'CH-01')) && (
                                <span className="text-[9px] px-1 bg-amber-500/20 text-amber-300">Chủ Hộ</span>
                              )}
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

            {/* Nút lọc nhanh riêng Căn Chủ Hộ (Trần Hữu Lực) */}
            <button
              type="button"
              onClick={() => {
                const next = !isOnlyOwnerUnits;
                setIsOnlyOwnerUnits(next);
                if (next) {
                  if (selectedBlock !== 'BS-07') handleSwitchBlock('BS-07');
                  setSelectedFloor(30);
                  setSelectedAptCode('CH-06');
                }
              }}
              className={`px-2.5 py-1 text-xs font-semibold font-mono transition-all shrink-0 border ${
                isOnlyOwnerUnits
                  ? 'bg-[#C5A880] text-black border-[#C5A880] font-bold shadow'
                  : 'text-amber-300 bg-[#292015] hover:bg-[#3D2F1E] border-amber-600/40'
              }`}
              title="Lọc nhanh 2 căn chủ hộ của Trần Hữu Lực (CH-06 & CH-01 Tầng 30)"
            >
              <span>Căn Chủ Hộ (2)</span>
            </button>
          </div>

          {/* Nhóm giữa: Nút chọn Tình trạng */}
          <div className="flex items-center gap-1 font-mono">
            {[
              { id: 'ALL', label: 'Tất Cả' },
              { id: 'OCCUPIED', label: 'Đã Ở' },
              { id: 'VACANT', label: 'Trống' },
              { id: 'MAINTENANCE', label: 'Nghiệm Thu' }
            ].map(o => (
              <button
                key={o.id}
                onClick={() => setSelectedOccupancy(o.id as any)}
                className={`px-2.5 py-1 text-xs transition-all border ${
                  selectedOccupancy === o.id
                    ? 'bg-[#1C2533] text-[#C5A880] border-[#C5A880] font-bold shadow'
                    : 'text-gray-400 hover:text-white bg-[#161B22]/70 border-transparent hover:bg-[#161B22]'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>

          {/* Nhóm phải: Select Loại Căn + Select Tầng + Số lượng & Reset */}
          <div className="flex items-center gap-2 font-mono flex-wrap">
            {/* Select Loại Căn */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="bg-[#161B22] border border-[#2D3748] text-xs text-gray-200 px-2 py-1 outline-none focus:border-[#C5A880]"
              title="Lọc theo loại phòng ngủ"
            >
              <option value="ALL">Mọi loại căn</option>
              <option value="1PN">1 Phòng Ngủ</option>
              <option value="2PN">2 Phòng Ngủ</option>
              <option value="3PN">3 Phòng Ngủ</option>
              <option value="DUPLEX_PENTHOUSE">Căn Lớn / Duplex</option>
            </select>

            {/* Select Tầng */}
            <select
              value={selectedFloorRange}
              onChange={(e) => setSelectedFloorRange(e.target.value as any)}
              className="bg-[#161B22] border border-[#2D3748] text-xs text-gray-200 px-2 py-1 outline-none focus:border-[#C5A880]"
              title="Lọc theo khoảng tầng"
            >
              <option value="ALL">Mọi tầng</option>
              <option value="LOW">Thấp (1-10)</option>
              <option value="MID">Trung (11-20)</option>
              <option value="HIGH">Cao (21-{currentTotalFloors})</option>
            </select>

            {/* Đếm số căn */}
            <div className="text-[11px] text-gray-300 bg-[#161B22] px-2 py-1 border border-[#2D3748] hidden sm:block">
              <strong className="text-white">{filteredUnits.length}</strong>/{displayUnits.length}
            </div>

            {/* Nút Đặt lại khi có bộ lọc hoạt động */}
            {isAnyFilterActive && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="px-2.5 py-1 bg-[#2B1D1D] hover:bg-[#3D2525] text-rose-300 border border-rose-800/60 text-xs font-semibold transition-all active:scale-95"
                title="Đặt lại toàn bộ tiêu chí lọc"
              >
                <span>Đặt Lại</span>
              </button>
            )}
          </div>
        </div>

        {/* HÀNG PHỤ: TIÊU CHÍ ĐANG LỌC (CHỈ HIỆN KHI CÓ LỌC) */}
        {isAnyFilterActive && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-[#1C2533] text-[11px] font-mono">
            <span className="text-gray-400 text-[10px]">Đang lọc:</span>
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 bg-[#1F2A38] text-white border border-[#2D3E54]">
                &ldquo;{searchQuery}&rdquo;
                <button type="button" onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-white">✕</button>
              </span>
            )}
            {isOnlyOwnerUnits && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 bg-amber-950 text-amber-300 border border-amber-700/60 font-bold">
                Căn Chủ Hộ (Trần Hữu Lực)
                <button type="button" onClick={() => setIsOnlyOwnerUnits(false)} className="text-amber-400 hover:text-white">✕</button>
              </span>
            )}
            {selectedOccupancy !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 bg-[#1A2533] text-[#C5A880] border border-[#2F4259]">
                {selectedOccupancy === 'OCCUPIED' ? 'Đã ở' : selectedOccupancy === 'VACANT' ? 'Trống' : 'Nghiệm thu'}
                <button type="button" onClick={() => setSelectedOccupancy('ALL')} className="text-gray-400 hover:text-white">✕</button>
              </span>
            )}
            {selectedType !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 bg-[#1A2533] text-sky-300 border border-[#2F4259]">
                {selectedType}
                <button type="button" onClick={() => setSelectedType('ALL')} className="text-gray-400 hover:text-white">✕</button>
              </span>
            )}
            {selectedFloorRange !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 bg-[#1A2533] text-amber-300 border border-[#2F4259]">
                Tầng: {selectedFloorRange === 'LOW' ? '1-10' : selectedFloorRange === 'MID' ? '11-20' : `21-${currentTotalFloors}`}
                <button type="button" onClick={() => setSelectedFloorRange('ALL')} className="text-gray-400 hover:text-white">✕</button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* ============================================================= */}
      {/* 4. KHU VỰC CHÍNH: SƠ ĐỒ TÒA NHÀ & HỒ SƠ CHI TIẾT CĂN HỘ       */}
      {/* ============================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* CỘT TRÁI (7 COLS): SƠ ĐỒ TÒA NHÀ / MẶT BẰNG TẦNG / DANH SÁCH */}
        <div className="lg:col-span-7 bg-[#0D1117] border border-[#222B35] rounded-none overflow-hidden shadow-2xl flex flex-col">
          
          {/* THANH ĐIỀU HÀNH GÓC NHÌN DUY NHẤT (SINGLE UNIFIED VIEWPORT TOOLBAR) */}
          <div className="px-3 py-2 bg-[#0E1520] border-b border-[#222B35] flex items-center justify-between gap-2.5 text-xs">
            {/* 4 Tab Chuyển Đổi Góc Nhìn */}
            <div className="flex bg-[#070B11] p-0.5 border border-[#1E2A38] text-xs font-semibold shrink-0">
              <button
                type="button"
                onClick={() => setBuildingPerspective('3D')}
                className={`px-3 py-1 transition-all ${
                  buildingPerspective === '3D'
                    ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                3D (BIM)
              </button>
              <button
                type="button"
                onClick={() => setBuildingPerspective('BUILDING_ELEVATION')}
                className={`px-3 py-1 transition-all ${
                  buildingPerspective === 'BUILDING_ELEVATION'
                    ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Mặt Đứng
              </button>
              <button
                type="button"
                onClick={() => setBuildingPerspective('FLOOR_PLAN')}
                className={`px-3 py-1 transition-all ${
                  buildingPerspective === 'FLOOR_PLAN'
                    ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Mặt Bằng
              </button>
              <button
                type="button"
                onClick={() => setBuildingPerspective('GRID')}
                className={`px-3 py-1 transition-all ${
                  buildingPerspective === 'GRID'
                    ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Lưới Căn
              </button>
            </div>

            {/* BÊN PHẢI: BỘ CÔNG CỤ THEO NGỮ CẢNH TƯƠNG ỨNG CỦA TỪNG VIEW */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {buildingPerspective === '3D' && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#141E2B] border border-[#233345] text-[11px] font-mono shrink-0">
                    <span className="text-gray-400">Đang chiếu:</span>
                    <strong className="text-white">T{selectedFloor}</strong>
                    <span className="text-gray-600">•</span>
                    <strong className="text-[#C5A880]">{activeUnit?.code || selectedAptCode}</strong>
                  </div>

                  {/* Chế độ Ngày / Đêm dạng text thanh lịch */}
                  <button
                    type="button"
                    onClick={() => setBuildingTheme(buildingTheme === 'NIGHT' ? 'DAY' : 'NIGHT')}
                    className="px-2.5 py-1 bg-[#141E2B] hover:bg-[#1E2E40] border border-[#233345] text-white text-[11px] font-mono transition-all shrink-0"
                    title={buildingTheme === 'NIGHT' ? 'Chuyển sang chế độ Ban Ngày' : 'Chuyển sang chế độ Ban Đêm'}
                  >
                    <span>{buildingTheme === 'NIGHT' ? 'Chế độ: Đêm' : 'Chế độ: Ngày'}</span>
                  </button>
                </div>
              )}

              {buildingPerspective === 'BUILDING_ELEVATION' && (
                <div className="flex items-center gap-1 font-mono text-[11px]">
                  <span className="text-gray-400 hidden md:inline">Vùng:</span>
                  {(['ALL', 'HIGH', 'MID', 'LOW'] as FloorRangeFilter[]).map((fr) => (
                    <button
                      key={fr}
                      type="button"
                      onClick={() => setSelectedFloorRange(fr)}
                      className={`px-2 py-0.5 border transition-all ${
                        selectedFloorRange === fr
                          ? 'bg-[#C5A880] text-black font-bold border-[#C5A880]'
                          : 'bg-[#141E2B] text-gray-300 border-[#233345] hover:text-white'
                      }`}
                    >
                      {fr === 'ALL' ? 'Tất Cả' : fr === 'HIGH' ? 'Cao' : fr === 'MID' ? 'Trung' : 'Hạ'}
                    </button>
                  ))}
                </div>
              )}

              {buildingPerspective === 'FLOOR_PLAN' && (
                <div className="flex items-center gap-2 font-mono text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-400 text-[11px] hidden sm:inline">Tầng:</span>
                    <select
                      value={selectedFloor}
                      onChange={(e) => setSelectedFloor(Number(e.target.value))}
                      className="bg-[#141E2B] border border-[#233345] px-2 py-0.5 text-white font-mono text-[11px] outline-none focus:border-[#C5A880]"
                    >
                      {buildingFloors.map(f => (
                        <option key={f} value={f}>
                          Tầng {f} {f === 30 ? '(Căn chủ hộ)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsFloorPlanExpanded(true)}
                    className="px-2.5 py-0.5 bg-[#C5A880]/15 hover:bg-[#C5A880] text-[#C5A880] hover:text-black border border-[#C5A880]/60 font-bold text-[11px] font-mono transition-all"
                  >
                    <span>Mở Rộng</span>
                  </button>
                </div>
              )}

              {buildingPerspective === 'GRID' && (
                <div className="text-[11px] font-mono text-[#C5A880] px-2.5 py-0.5 bg-[#141E2B] border border-[#233345]">
                  {filteredUnits.length}/{displayUnits.length} căn
                </div>
              )}
            </div>
          </div>

          {/* ----------------------------------------------------------- */}
          {/* GÓC NHÌN 1: MÔ HÌNH KHỐI 3D KIẾN TRÚC TÒA NHÀ BỰ HƠN THỰC TẾ*/}
          {/* ----------------------------------------------------------- */}
          {buildingPerspective === '3D' && (() => {
            const curTone = toneConfig.GOLD_LUXURY;
            const floorStep = (472 - 90) / (currentTotalFloors - 1);
            const rulerLevels = currentTotalFloors === 39 
              ? [39, 35, 30, 25, 20, 15, 10, 5, 1] 
              : [34, 30, 25, 20, 15, 10, 5, 1];

            return (
              <div className={`relative w-full h-[660px] sm:h-[760px] ${curTone.containerBg} overflow-hidden flex flex-col select-none transition-colors duration-500`}>
                {/* Lưới tọa độ kiến trúc số */}
                <div 
                  className="absolute inset-0 opacity-15 pointer-events-none"
                  style={{
                    backgroundImage: `linear-gradient(to right, ${curTone.gridLineColor} 1px, transparent 1px), linear-gradient(to bottom, ${curTone.gridLineColor} 1px, transparent 1px)`,
                    backgroundSize: '24px 24px'
                  }}
                />

                {/* BẢN VẼ PHỐI CẢNH 3D CHUNG CƯ ISOMETRIC CHUẨN KIẾN TRÚC */}
                <div className="relative flex-1 w-full h-full flex items-center justify-center">
                  <svg
                    viewBox="0 0 1000 680"
                    className="w-full h-full cursor-default drop-shadow-[0_30px_60px_rgba(0,0,0,0.95)]"
                  >
                    <defs>
                      <style>{`
                        @keyframes laserDrawPath {
                          0% { stroke-dashoffset: 340; opacity: 0; }
                          20% { opacity: 1; }
                          100% { stroke-dashoffset: 0; opacity: 1; }
                        }
                        @keyframes calloutSlideIn {
                          0% { opacity: 0; transform: translateY(12px) scale(0.95); }
                          100% { opacity: 1; transform: translateY(0) scale(1); }
                        }
                        @keyframes pingRing {
                          0% { r: 3.5; opacity: 1; stroke-width: 2.5; }
                          70% { opacity: 0.5; }
                          100% { r: 20; opacity: 0; stroke-width: 0.5; }
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

                      <filter id="unitGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3.5" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>

                      {/* Gradient kính ban đêm vs ban ngày theo Tone Màu được chọn */}
                      <linearGradient id="skylineGlassL" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={curTone.glassL[0]} />
                        <stop offset="50%" stopColor={curTone.glassL[1]} />
                        <stop offset="100%" stopColor={curTone.glassL[2]} />
                      </linearGradient>

                      <linearGradient id="skylineGlassR" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={curTone.glassR[0]} />
                        <stop offset="60%" stopColor={curTone.glassR[1]} />
                        <stop offset="100%" stopColor={curTone.glassR[2]} />
                      </linearGradient>

                      {/* Gradient khối đế tiếp tân */}
                      <linearGradient id="podiumMallGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={curTone.podiumGrad[0]} />
                        <stop offset="60%" stopColor={curTone.podiumGrad[1]} />
                        <stop offset="100%" stopColor={curTone.podiumGrad[2]} />
                      </linearGradient>

                      {/* Gradient phát sáng cửa sổ phòng cư dân tầng 30 */}
                      <linearGradient id="warmWindowGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#059669" />
                        <stop offset="50%" stopColor="#10B981" />
                        <stop offset="100%" stopColor="#34D399" />
                      </linearGradient>
                    </defs>

                    {/* THƯỚC ĐO CAO ĐỘ CÁC TẦNG BÊN TRÁI & PHẢI (LEVEL RULER) */}
                    <g className="opacity-70 font-mono text-[9px]">
                      {rulerLevels.map(fl => {
                        const yPos = 472 - (fl - 1) * floorStep - 25;
                        const is30 = fl === 30;
                        const is20 = fl === 20;

                        return (
                          <g key={`level-ruler-${fl}`} className="pointer-events-none">
                            <line x1="160" y1={yPos} x2="225" y2={yPos} stroke={is30 ? '#10B981' : is20 ? '#38BDF8' : '#334155'} strokeWidth={is30 ? 2 : 1} strokeDasharray={is30 ? 'none' : '3 3'} />
                            <circle cx="225" cy={yPos} r={is30 ? 3.5 : 2} fill={is30 ? '#10B981' : is20 ? '#38BDF8' : '#475569'} />
                            <rect x="95" y={yPos - 9} width="60" height="18" fill={is30 ? '#064E3B' : is20 ? '#082F49' : '#0B121D'} stroke={is30 ? '#10B981' : is20 ? '#38BDF8' : '#1E2D42'} strokeWidth="1" />
                            <text x="125" y={yPos + 3.5} fill={is30 ? '#34D399' : is20 ? '#7DD3FC' : '#94A3B8'} fontWeight="bold" textAnchor="middle">
                              TẦNG {fl}
                            </text>

                            {/* Nhãn bên phải */}
                            <line x1="775" y1={yPos} x2="840" y2={yPos} stroke={is30 ? '#10B981' : is20 ? '#38BDF8' : '#334155'} strokeWidth={is30 ? 2 : 1} strokeDasharray={is30 ? 'none' : '3 3'} />
                            <circle cx="775" cy={yPos} r={is30 ? 3.5 : 2} fill={is30 ? '#10B981' : is20 ? '#38BDF8' : '#475569'} />
                          </g>
                        );
                      })}
                    </g>

                    {/* 1. KHUÔN VIÊN MẶT ĐẤT & SẢNH ĐÓN TẦNG 1 */}
                    <g className="opacity-95">
                      <polygon points="60,575 500,665 940,575 500,485" fill="#070B12" stroke="#1E293B" strokeWidth="2" />

                      {/* Khối Sảnh Đón Tiếp Tân Hoàng Gia (Tầng 1) */}
                      <polygon points="180,555 500,605 820,555 820,490 500,540 180,490" fill="url(#podiumMallGrad)" stroke={curTone.borderBuilding} strokeWidth="1.8" />
                      <polygon points="210,540 500,586 790,540 790,505 500,551 210,505" fill="#0EA5E9" fillOpacity="0.2" stroke="#38BDF8" strokeWidth="1.2" />
                      
                      <text x="500" y="546" fill="#F8FAFC" fontSize="11" fontFamily="sans-serif" textAnchor="middle" fontWeight="900" letterSpacing="0.08em">
                        ĐẠI SẢNH ĐÓN TIẾP TÂN & KHU DỊCH VỤ CƯ DÂN (TẦNG 1)
                      </text>
                      <text x="500" y="566" fill="#94A3B8" fontSize="8.5" fontFamily="monospace" textAnchor="middle">
                        Lễ Tân 24/7 • Ban Quản Lý • Hầm Để Xe Thông Minh B1 - B2
                      </text>

                      {/* Hồ nước sinh thái */}
                      <polygon points="300,612 500,646 700,612 500,578" fill="#0369A1" fillOpacity="0.35" stroke="#38BDF8" strokeWidth="1" />
                      <text x="500" y="616" fill="#38BDF8" fontSize="8.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                        HỒ CẢNH QUAN & QUẢNG TRƯỜNG NỘI KHU THE TROPICAL
                      </text>
                    </g>

                    {/* 2. THÂN THÁP CHUNG CƯ (TỐI ĐA 39 TẦNG TÙY BLOCK) */}
                    <g className="transition-all duration-300">
                      {/* Mặt Trái (Hướng Đông Nam) */}
                      <polygon points="230,475 500,520 500,68 230,38" fill="url(#skylineGlassL)" stroke={curTone.borderBuilding} strokeWidth="2" />
                      {/* Mặt Phải (Hướng Tây Nam) */}
                      <polygon points="500,520 770,475 770,38 500,68" fill="url(#skylineGlassR)" stroke={curTone.borderBuilding} strokeWidth="2" />
                      
                      {/* Nan lam kiến trúc đứng (Architectural Mullions) tạo chiều sâu cho tòa tháp */}
                      <line x1="320" y1="48" x2="320" y2="489" stroke={curTone.mullionColor} strokeWidth="0.8" opacity="0.4" />
                      <line x1="410" y1="58" x2="410" y2="505" stroke={curTone.mullionColor} strokeWidth="0.8" opacity="0.4" />
                      <line x1="590" y1="58" x2="590" y2="505" stroke={curTone.mullionColor} strokeWidth="0.8" opacity="0.4" />
                      <line x1="680" y1="48" x2="680" y2="489" stroke={curTone.mullionColor} strokeWidth="0.8" opacity="0.4" />

                      {/* Mái Tháp (Sân Thượng Helipad) */}
                      <polygon points="230,38 500,68 770,38 500,16" fill={curTone.roofColor} stroke={curTone.borderBuilding} strokeWidth="2" />

                      {/* Sân đáp trực thăng Helipad trên đỉnh tháp */}
                      <ellipse cx="500" cy="54" rx="65" ry="18" fill="#0F172A" stroke={curTone.borderBuilding} strokeWidth="1.8" />
                      <circle cx="500" cy="54" r="11" fill="none" stroke={curTone.crownColor} strokeWidth="1.5" />
                      <text x="500" y="58" fill={curTone.crownColor} fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">H</text>

                      {/* Đèn báo tín hiệu hàng không nhấp nháy trên đỉnh */}
                      <circle cx="500" cy="12" r="3.5" fill="#EF4444" className="animate-pulse" />
                      <line x1="500" y1="12" x2="500" y2="22" stroke="#64748B" strokeWidth="1.5" />

                      {/* Tiêu đề Đỉnh Tòa Nhà */}
                      <text x="500" y="8" fill={curTone.titleColor} fontSize="12" fontWeight="bold" textAnchor="middle" fontFamily="serif" letterSpacing="0.05em">
                        {currentBlockName.toUpperCase()} ({currentTotalFloors} TẦNG) • THE TROPICAL
                      </text>

                      {/* RENDER CÁC TẦNG THỰC TẾ THEO BLOCK TỪ NKS API */}
                      {BUILDING_3D_UNITS.filter(b => b.floor <= currentTotalFloors).map(b => {
                        const liveUnit = displayUnits.find(u => 
                          u.code === b.code || 
                          (u.floor === b.floor && (u.code.endsWith(b.code) || b.code.endsWith(u.code)))
                        );
                        const actualStatus = liveUnit ? liveUnit.status : 'VACANT';
                        const actualOwnerName = (b.code === 'CH-06' || b.floor === 30) && b.side === 'LEFT' ? activeOwnerName : (liveUnit?.owner?.name || b.defaultName || 'Nhà Trống');
                        const isSelected = selectedAptCode === b.code || (selectedFloor === b.floor && (selectedAptCode === b.code || selectedAptCode.endsWith(b.code) || b.code.endsWith(selectedAptCode)));
                        const isHovered = hoveredUnitCode === b.code || (hoveredFloor === b.floor && (hoveredUnitCode?.endsWith(b.code) || b.code.endsWith(hoveredUnitCode || '')));
                        
                        // Lọc theo bộ lọc thống nhất toàn hệ thống
                        const isMatchedFilter = isUnitMatchingFilter(b.code, b.floor);

                        // Tọa độ hình học chính xác cho khối căn hộ
                        const yBase = 472 - (b.floor - 1) * floorStep;
                        const h = b.floor === currentTotalFloors ? 13 : 9.5;
                        
                        const pts = b.side === 'LEFT'
                          ? `${248},${(yBase - 33 - h).toFixed(1)} ${494},${(yBase - 1 - h).toFixed(1)} ${494},${(yBase - 1).toFixed(1)} ${248},${(yBase - 33).toFixed(1)}`
                          : `${506},${(yBase - 1 - h).toFixed(1)} ${752},${(yBase - 33 - h).toFixed(1)} ${752},${(yBase - 33).toFixed(1)} ${506},${(yBase - 1).toFixed(1)}`;
                        
                        // Màu sắc theo trạng thái thực tế 100% từ NKS API
                        let fillColor = buildingTheme === 'NIGHT' ? '#0F172A' : '#0369A1';
                        let strokeColor = buildingTheme === 'NIGHT' ? '#1E293B' : '#0284C7';
                        let fillOpacity = 0.55;

                        if (actualStatus === 'OCCUPIED') {
                          fillColor = isSelected ? '#059669' : '#065F46';
                          strokeColor = isSelected ? '#34D399' : '#10B981';
                          fillOpacity = isSelected ? 0.98 : 0.85;
                        } else if (actualStatus === 'MAINTENANCE') {
                          fillColor = isSelected ? '#0284C7' : '#075985';
                          strokeColor = isSelected ? '#7DD3FC' : '#38BDF8';
                          fillOpacity = isSelected ? 0.95 : 0.8;
                        } else {
                          fillColor = isSelected ? '#B45309' : (buildingTheme === 'NIGHT' ? '#141E2B' : '#0A2540');
                          strokeColor = isSelected ? '#F59E0B' : (buildingTheme === 'NIGHT' ? '#1E2D42' : '#0E3A66');
                          fillOpacity = isSelected ? 0.9 : 0.55;
                        }

                        // Độ sáng tối trực quan đồng bộ 100% với bộ lọc
                        let opacityVal = isMatchedFilter ? (isSelected || isHovered ? 1 : 0.9) : 0.12;

                        return (
                          <g
                            key={b.code}
                            onClick={() => {
                              setSelectedAptCode(b.code);
                              setSelectedFloor(b.floor);
                            }}
                            onMouseEnter={() => {
                              setHoveredUnitCode(b.code);
                              setHoveredFloor(b.floor);
                            }}
                            onMouseLeave={() => {
                              setHoveredUnitCode(null);
                              setHoveredFloor(null);
                            }}
                            className="cursor-pointer transition-all duration-200"
                            style={{ opacity: opacityVal }}
                          >
                            <polygon
                              points={pts}
                              fill={fillColor}
                              fillOpacity={fillOpacity}
                              stroke={isSelected ? '#FFFFFF' : (isHovered ? '#FDE68A' : strokeColor)}
                              strokeWidth={isSelected ? 2.2 : (isHovered ? 1.8 : 0.8)}
                              filter={isSelected || (b.floor === 30 && actualStatus === 'OCCUPIED') ? 'url(#unitGlow)' : undefined}
                            />

                            {/* Ánh đèn phòng ấm cúng cho tầng 30 có cư dân ở ban đêm */}
                            {b.floor === 30 && buildingTheme === 'NIGHT' && (
                              <line
                                x1={b.side === 'LEFT' ? 290 : 540}
                                y1={yBase - 18}
                                x2={b.side === 'LEFT' ? 450 : 710}
                                y2={yBase - 8}
                                stroke="#FDE68A"
                                strokeWidth="1.5"
                                strokeDasharray="4 2"
                                opacity="0.8"
                                className="animate-pulse"
                              />
                            )}

                            {/* Điểm nhấn Pin vàng định vị Căn Hộ Chủ Hộ Tầng 30 */}
                            {b.floor === 30 && b.code === 'CH-06' && (
                              <g className="pointer-events-none">
                                <circle cx={b.side === 'LEFT' ? 370 : 630} cy={yBase - 18} r="6" fill="#F59E0B" className="animate-ping opacity-75" />
                                <circle cx={b.side === 'LEFT' ? 370 : 630} cy={yBase - 18} r="3" fill="#FDE68A" stroke="#B45309" strokeWidth="1" />
                                <rect x={b.side === 'LEFT' ? 315 : 575} y={yBase - 33} width="112" height="13" fill="#0B131E" fillOpacity="0.92" stroke="#F59E0B" strokeWidth="0.8" rx="2" />
                                <text x={b.side === 'LEFT' ? 371 : 631} y={yBase - 23.5} fill="#FDE68A" fontSize="7" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                                  CĂN CHỦ HỘ (LỰC)
                                </text>
                              </g>
                            )}
                          </g>
                        );
                      })}

                      {/* =================================================================== */}
                      {/* CON TRỎ LASER VÀ BẢNG CALLOUT HOLOGRAPHIC ĐỊNH VỊ CHÍNH XÁC CĂN HỘ  */}
                      {/* =================================================================== */}
                      {(() => {
                        let activeTargetBlock = BUILDING_3D_UNITS.find(b => b.code === selectedAptCode);
                        if (!activeTargetBlock) {
                          const targetFloor = activeUnit?.floor || 30;
                          const numStr = selectedAptCode.replace(/\D/g, '').slice(-2);
                          const num = parseInt(numStr || '1', 10);
                          const fallbackSide: 'LEFT' | 'RIGHT' = num % 2 === 1 ? 'LEFT' : 'RIGHT';
                          activeTargetBlock = BUILDING_3D_UNITS.find(b => b.floor === targetFloor && b.side === fallbackSide)
                            || BUILDING_3D_UNITS.find(b => b.floor === targetFloor)
                            || {
                              code: selectedAptCode,
                              floor: Math.max(1, Math.min(currentTotalFloors, targetFloor)),
                              side: fallbackSide,
                              type: (activeUnit?.type || '2PN') as ApartmentType,
                              defaultStatus: (activeUnit?.status || 'VACANT') as ApartmentStatus,
                              area: activeUnit?.area || 75
                            };
                        }

                        const curFloor = Math.max(1, Math.min(currentTotalFloors, activeTargetBlock.floor));
                        const curSide = activeTargetBlock.side;
                        const curYBase = 472 - (curFloor - 1) * floorStep;
                        const curH = curFloor === currentTotalFloors ? 13 : 9.5;

                        const wallX = curSide === 'LEFT' ? 248 : 752;
                        const wallY = Number((curYBase - 33 - (curH / 2)).toFixed(1));

                        const pinDist = 67;
                        const pinX = curSide === 'LEFT' ? (wallX + pinDist) : (wallX - pinDist);
                        const pinY = Number((wallY + (32 / 246) * pinDist).toFixed(1));

                        const elbowX = curSide === 'LEFT' ? (wallX - 24) : (wallX + 24);
                        const elbowY = wallY;

                        const cardW = 205;
                        const cardH = 82;
                        const cardX = curSide === 'LEFT' ? 14 : 780;
                        const dockX = curSide === 'LEFT' ? (cardX + cardW) : cardX;
                        const targetCardY = Math.max(48, Math.min(480, Math.round(wallY - cardH / 2)));
                        const dockY = targetCardY + cardH / 2;

                        const laserPath = `M ${pinX} ${pinY} L ${wallX} ${wallY} L ${elbowX} ${elbowY} L ${dockX} ${dockY}`;

                        const isCurOccupied = activeUnit?.status === 'OCCUPIED' || curFloor === 30;
                        const isCurMaint = activeUnit?.status === 'MAINTENANCE' || curFloor === 20;
                        const themeNeon = isCurOccupied ? '#10B981' : isCurMaint ? '#38BDF8' : curTone.laserBeamColor;
                        const themeBg = isCurOccupied ? '#064E3B' : isCurMaint ? '#082F49' : '#1C1917';
                        const themeBorder = isCurOccupied ? '#34D399' : isCurMaint ? '#7DD3FC' : curTone.borderBuilding;
                        const themeText = isCurOccupied ? '#D1FAE5' : isCurMaint ? '#BAE6FD' : curTone.titleColor;

                        return (
                          <g key={`dynamic-pointer-${selectedAptCode}`} className="pointer-events-none">
                            <circle cx={pinX} cy={pinY} r="4.5" fill={themeNeon} filter="url(#unitGlow)" />
                            <circle cx={pinX} cy={pinY} r="14" fill="none" stroke={themeNeon} strokeWidth="1.6" className="anim-ping-pulse" />
                            <circle cx={pinX} cy={pinY} r="1.8" fill="#FFFFFF" />

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
                            <circle cx={wallX} cy={wallY} r="2.5" fill={themeNeon} />
                            <circle cx={dockX} cy={dockY} r="3.5" fill={themeBorder} />

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

                              <text
                                x={cardX + 14}
                                y={targetCardY + 36}
                                fill={themeText}
                                fontSize="8.5"
                                fontWeight="bold"
                              >
                                {curFloor === 30 && (selectedAptCode === 'CH-06' || activeUnit?.code === 'CH-06')
                                  ? `CHỦ HỘ: ${activeOwnerName} (0364967082)`
                                  : curFloor === 30 && (selectedAptCode === 'CH-01' || activeUnit?.code === 'CH-01')
                                  ? `CĂN PHỤ CHỦ HỘ: ${activeOwnerName}`
                                  : isCurOccupied
                                  ? `CƯ DÂN: ${activeOwnerName}`
                                  : isCurMaint
                                  ? 'ĐANG NGHIỆM THU KỸ THUẬT'
                                  : 'NHÀ TRỐNG • SẴN SÀNG Ở'}
                              </text>

                              <text
                                x={cardX + 14}
                                y={targetCardY + 50}
                                fill="#CBD5E1"
                                fontSize="7.5"
                                fontFamily="monospace"
                              >
                                {activeUnit?.typeLabel || `${activeTargetBlock.type}`} • {activeUnit?.area || activeTargetBlock.area}m² • Hướng {activeUnit?.direction || (curSide === 'LEFT' ? 'Đông Nam' : 'Tây Nam')}
                              </text>

                              <text
                                x={cardX + 14}
                                y={targetCardY + 68}
                                fill={themeNeon}
                                fontSize="7.5"
                                fontWeight="semibold"
                              >
                                Nhấp Mặt Bằng Tầng để xem 8 căn chi tiết
                              </text>
                            </g>
                          </g>
                        );
                      })()}
                    </g>

                    {/* THẺ QUAN SÁT TỨC THÌ KHI HOVER CĂN HỘ KHÁC */}
                    {hoveredUnitCode && hoveredUnitCode !== selectedAptCode && (
                      <g className="pointer-events-none">
                        {(() => {
                          const hUnit = displayUnits.find(u => u.code === hoveredUnitCode);
                          return (
                            <g>
                              <rect x="735" y="25" width="245" height="42" fill="#0D1117" fillOpacity="0.94" stroke={curTone.borderBuilding} strokeWidth="1.2" rx="3" />
                              <text x="748" y="42" fill={curTone.titleColor} fontSize="9.5" fontWeight="bold" fontFamily="monospace">
                                XEM NHANH: CĂN {hoveredUnitCode} (Tầng {hUnit?.floor || hoveredFloor || 30})
                              </text>
                              <text x="748" y="56" fill="#94A3B8" fontSize="8" fontFamily="sans-serif">
                                {hUnit?.status === 'OCCUPIED' ? 'Đã có người ở' : hUnit?.status === 'MAINTENANCE' ? 'Nghiệm thu kỹ thuật' : 'Nhà trống (Sẵn sàng bàn giao)'} • Nhấp để định vị
                              </text>
                            </g>
                          );
                        })()}
                      </g>
                    )}
                  </svg>
                </div>
              </div>
            );
          })()}

          {/* ----------------------------------------------------------- */}
          {/* GÓC NHÌN 2: SƠ ĐỒ TOÀN CẢNH TÒA NHÀ THỰC TẾ THEO CÁC TẦNG   */}
          {/* ----------------------------------------------------------- */}
          {buildingPerspective === 'BUILDING_ELEVATION' && (() => {
            const displayedElevationFloors = buildingFloors.filter(floor => {
              if (selectedFloorRange === 'HIGH' && floor < 21) return false;
              if (selectedFloorRange === 'MID' && (floor < 11 || floor > 20)) return false;
              if (selectedFloorRange === 'LOW' && floor > 10) return false;

              // Khi có bộ lọc khác, chỉ hiển thị tầng có căn hộ thỏa mãn
              if (isAnyFilterActive && (selectedOccupancy !== 'ALL' || selectedType !== 'ALL' || isOnlyOwnerUnits || searchQuery.trim() !== '')) {
                return matchingFloorsSet.has(floor);
              }
              return true;
            });

            return (
              <div className="p-4 bg-[#05070A] h-[640px] overflow-y-auto space-y-4">
                {/* KHỐI HIỂN THỊ CÁC TẦNG CỦA TÒA NHÀ */}
                <div className="bg-[#0B0F17] border border-[#222B35] p-3 rounded-none flex flex-col space-y-3">
                  {/* Tầng Mái Sân Thượng */}
                  {(selectedFloorRange === 'ALL' || selectedFloorRange === 'HIGH') && (
                    <div className="p-2.5 bg-[#121822] border border-[#1E293B] text-[11px] text-gray-300 font-mono text-center">
                      <span className="font-bold">TẦNG MÁI • SÂN THƯỢNG HELIPAD & KHU KỸ THUẬT TÒA {currentBlockName.toUpperCase()}</span>
                    </div>
                  )}

                  {/* Danh sách các tầng từ cao xuống thấp */}
                  <div className="space-y-2.5">
                    {displayedElevationFloors.map(floor => {
                      const unitsOnFloor = displayUnits.filter(u => u.floor === floor);
                      const isFloor30 = floor === 30;

                      return (
                        <div 
                          key={`Floor-${floor}`} 
                          className={`p-2.5 bg-[#0E141E] border transition-colors space-y-2 ${
                            isFloor30 ? 'border-[#10B981]/60 bg-[#064E3B]/10' : 'border-[#1F2937] hover:border-gray-600'
                          }`}
                        >
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-white font-bold">
                            TẦNG {floor} {isFloor30 ? '(Căn Chủ Hộ)' : ''}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedFloor(floor);
                              setBuildingPerspective('FLOOR_PLAN');
                            }}
                            className="text-[10.5px] text-[#C5A880] hover:text-white hover:underline font-semibold"
                          >
                            Xem mặt bằng tầng
                          </button>
                        </div>

                        {/* Dãy các căn hộ trên tầng này */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {unitsOnFloor.map(unit => {
                            const isSelected = selectedAptCode === unit.code;
                            const isMatchedFilter = isUnitMatchingFilter(unit.code, floor);
                            const isOwnerPrimary = floor === 30 && (unit.code === 'CH-06' || unit.code.endsWith('CH-06'));
                            const isOwnerSecondary = floor === 30 && (unit.code === 'CH-01' || unit.code.endsWith('CH-01'));

                            return (
                              <div
                                key={unit.code}
                                onClick={() => setSelectedAptCode(unit.code)}
                                className={`p-2 border transition-all cursor-pointer select-none relative ${
                                  isSelected
                                    ? 'bg-[#1C2533] border-[#C5A880] ring-1 ring-[#C5A880] shadow-md z-10'
                                    : isOwnerPrimary
                                    ? 'bg-[#15231B] border-[#F59E0B] shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                                    : isOwnerSecondary
                                    ? 'bg-[#101F2D] border-cyan-500/60'
                                    : 'bg-[#141B26] border-[#222E3E] hover:border-gray-500'
                                } ${!isMatchedFilter ? 'opacity-25 pointer-events-none' : 'opacity-100'}`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold font-mono text-white">
                                      {unit.code}
                                    </span>
                                    {isOwnerPrimary && (
                                      <span className="text-[8.5px] px-1 bg-amber-500/25 text-amber-300 font-bold border border-amber-500/50 font-mono">
                                        CHỦ HỘ
                                      </span>
                                    )}
                                    {isOwnerSecondary && (
                                      <span className="text-[8.5px] px-1 bg-cyan-950 text-cyan-300 font-bold border border-cyan-700/60 font-mono">
                                        CĂN PHỤ
                                      </span>
                                    )}
                                  </div>
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
                                  {isOwnerPrimary ? (
                                    <span className="text-amber-300 font-bold">
                                      {activeOwnerName} (Chính Chủ)
                                    </span>
                                  ) : isOwnerSecondary ? (
                                    <span className="text-cyan-300 font-bold">
                                      {activeOwnerName} (Căn Phụ)
                                    </span>
                                  ) : unit.status === 'OCCUPIED' ? (
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
          );
        })()}

          {/* ----------------------------------------------------------- */}
          {/* GÓC NHÌN 3: SƠ ĐỒ MẶT BẰNG TẦNG THỰC TẾ (FLOOR PLAN)        */}
          {/* ----------------------------------------------------------- */}
          {buildingPerspective === 'FLOOR_PLAN' && (() => {
            // Tính toán tổng số liệu tầng hiện tại từ dữ liệu thực tế displayUnits
            const floorUnits = ['01', '02', '03', '04', '05', '06', '07', '08'].map(num => {
              const chCode = `CH-${num}`;
              const targetCode = selectedFloor === 30 ? chCode : `${selectedFloor}-${chCode}`;
              const found = displayUnits.find(u => 
                u.floor === selectedFloor && (
                  u.code.toUpperCase() === chCode ||
                  u.code.toUpperCase() === targetCode ||
                  u.code.toUpperCase().endsWith(chCode) ||
                  (selectedFloor === 30 && u.code === chCode)
                )
              );
              return found || {
                code: targetCode,
                tower: selectedBlock === 'BS-10' ? 'B' : 'A',
                towerName: currentBlockName,
                floor: selectedFloor,
                type: (num === '01' || num === '08' || num === '04' || num === '05') ? '2PN' : '1PN',
                typeLabel: (num === '01' || num === '08' || num === '04' || num === '05') ? '2 Phòng Ngủ - 1WC' : '1 Phòng Ngủ - 1WC',
                status: 'VACANT',
                statusLabel: 'Căn Hộ Trống',
                area: (num === '01' || num === '08') ? 60 : 42,
                priceBillion: 3.2
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
                    <div className="text-xs sm:text-sm font-bold text-amber-300 mt-0.5">
                      {floorTotalElectric} kWh
                    </div>
                  </div>
                  <div className="p-1.5 bg-[#16202D] border border-[#2B394E]">
                    <div className="text-[9.5px] text-gray-400">Nước Tiêu Thụ Sàn:</div>
                    <div className="text-xs sm:text-sm font-bold text-cyan-300 mt-0.5">
                      {floorTotalWater} m³
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
                  <div className="text-amber-200">
                    <span>
                      Bạn đang xem hồ sơ căn <strong className="text-white font-mono">{activeUnit.code}</strong> (Tầng {activeUnit.floor}), nhưng sơ đồ đang hiển thị Tầng {selectedFloor}.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedFloor(activeUnit.floor)}
                    className="px-2.5 py-1 bg-[#C5A880] hover:bg-[#d8bb93] text-[#0D1117] font-bold text-[11px] shrink-0 transition-colors"
                  >
                    Chuyển Tới Tầng {activeUnit.floor}
                  </button>
                </div>
              )}

              {/* BẢN VẼ MẶT BẰNG SÀN KIẾN TRÚC TẦNG THỰC TẾ (SVG FLOOR PLATE) */}
              <div className="relative w-full bg-[#090D14] border border-[#222B35] p-3 flex flex-col items-center">
                <div className="text-[11px] font-mono text-[#C5A880] mb-2 self-start">
                  SƠ ĐỒ MẶT BẰNG SÀN TẦNG {selectedFloor} • CHUNG CƯ SKYLINE (BỐ TRÍ 8 CĂN HỘ / TẦNG)
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
                      const chCode = `CH-${numStr}`;
                      const targetCode = selectedFloor === 30 ? chCode : `${selectedFloor}-${chCode}`;
                      const found = displayUnits.find(u => 
                        u.floor === selectedFloor && (
                          u.code.toUpperCase() === chCode ||
                          u.code.toUpperCase() === targetCode ||
                          u.code.toUpperCase().endsWith(chCode) ||
                          (selectedFloor === 30 && u.code === chCode)
                        )
                      );
                      const isOccupied = found?.status === 'OCCUPIED' || (selectedFloor === 30 && (numStr === '06' || numStr === '01' || numStr === '08'));
                      const codeToUse = found?.code || targetCode;
                      const isSelected = selectedAptCode === codeToUse || (selectedAptCode === 'CH-06' && codeToUse.includes('CH-06') && selectedFloor === 30);
                      const isOwnerLuc = selectedFloor === 30 && (numStr === '06' || numStr === '01');
                      const ownerName = isOwnerLuc ? activeOwnerName : (found?.owner?.name || '');
                      const isMatched = isUnitMatchingFilter(codeToUse, selectedFloor);
                      return { code: codeToUse, found, isOccupied, isSelected, isOwnerLuc, ownerName, isMatched };
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
                        <g onClick={() => setSelectedAptCode(u01.code)} className="cursor-pointer transition-opacity" style={{ opacity: u01.isMatched ? 1 : 0.25 }}>
                          <rect 
                            x="30" y="30" width="110" height="140" 
                            fill={selectedFloor === 30 ? (u01.isSelected ? '#065F46' : '#0A2538') : (u01.isOccupied ? (u01.isSelected ? '#065F46' : '#044332') : (u01.isSelected ? '#78350F' : '#141D2B'))} 
                            stroke={selectedFloor === 30 ? '#0284C7' : (u01.isOccupied ? '#10B981' : (u01.isSelected ? '#F59E0B' : '#334155'))} 
                            strokeWidth={selectedFloor === 30 ? '2.5' : (u01.isSelected ? '2.5' : '1.5')} 
                          />
                          {selectedFloor === 30 && (
                            <rect x="36" y="33" width="98" height="14" fill="#0284C7" />
                          )}
                          {selectedFloor === 30 && (
                            <text x="85" y="43.5" fill="#FFFFFF" fontSize="7.5" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">
                              CĂN PHỤ CHỦ HỘ
                            </text>
                          )}
                          <text x="85" y={selectedFloor === 30 ? "67" : "70"} fill="#FFFFFF" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">Căn {u01.code}</text>
                          <text x="85" y={selectedFloor === 30 ? "83" : "86"} fill={u01.isOccupied ? '#A7F3D0' : '#94A3B8'} fontSize="8" textAnchor="middle">2PN • 50m²</text>
                          <rect x="45" y={selectedFloor === 30 ? "94" : "96"} width="80" height="16" fill={u01.isOccupied ? '#10B981' : '#B45309'} />
                          <text x="85" y={selectedFloor === 30 ? "106" : "108"} fill={u01.isOccupied ? '#0D1117' : '#FFFFFF'} fontSize="7.5" fontWeight="bold" textAnchor="middle">
                            {u01.isOccupied ? 'CÓ CƯ DÂN' : 'NHÀ TRỐNG'}
                          </text>
                          <text x="85" y={selectedFloor === 30 ? "125" : "128"} fill={selectedFloor === 30 ? '#7DD3FC' : (u01.isOccupied ? '#D1FAE5' : '#94A3B8')} fontSize="7.5" fontWeight="bold" textAnchor="middle">
                            {selectedFloor === 30 ? activeOwnerName : (u01.isOccupied ? u01.ownerName : 'Chưa bàn giao')}
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
                            fill={selectedFloor === 30 ? (u06.isSelected ? '#065F46' : '#142E20') : (u06.isOccupied ? (u06.isSelected ? '#065F46' : '#044332') : (u06.isSelected ? '#78350F' : '#141D2B'))} 
                            stroke={selectedFloor === 30 ? '#F59E0B' : (u06.isOccupied ? '#10B981' : (u06.isSelected ? '#F59E0B' : '#334155'))} 
                            strokeWidth={selectedFloor === 30 ? '2.5' : (u06.isSelected ? '2.5' : '1.5')} 
                          />
                          {selectedFloor === 30 && (
                            <rect x="666" y="33" width="98" height="14" fill="#F59E0B" />
                          )}
                          {selectedFloor === 30 && (
                            <text x="715" y="43.5" fill="#000000" fontSize="7.5" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">
                              CĂN CHỦ HỘ
                            </text>
                          )}
                          <text x="715" y={selectedFloor === 30 ? "67" : "75"} fill="#FFFFFF" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">Căn {u06.code}</text>
                          <text x="715" y={selectedFloor === 30 ? "83" : "92"} fill={u06.isOccupied ? '#A7F3D0' : '#94A3B8'} fontSize="8" textAnchor="middle">1PN • 42m²</text>
                          <rect x="675" y={selectedFloor === 30 ? "94" : "102"} width="80" height="16" fill={u06.isOccupied ? '#10B981' : '#B45309'} />
                          <text x="715" y={selectedFloor === 30 ? "106" : "114"} fill={u06.isOccupied ? '#0D1117' : '#FFFFFF'} fontSize="7.5" fontWeight="bold" textAnchor="middle">
                            {u06.isOccupied ? 'CÓ CƯ DÂN' : 'NHÀ TRỐNG'}
                          </text>
                          <text x="715" y={selectedFloor === 30 ? "125" : "132"} fill={selectedFloor === 30 ? '#FDE68A' : (u06.isOccupied ? '#D1FAE5' : '#94A3B8')} fontSize="7.5" fontWeight="bold" textAnchor="middle">
                            {selectedFloor === 30 ? activeOwnerName : (u06.isOccupied ? u06.ownerName : 'Chưa bàn giao')}
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
                  Danh mục 8 căn hộ Tầng {selectedFloor} • Khối Tháp {selectedBlock} ({currentBlockName}):
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['01', '02', '03', '04', '05', '06', '07', '08'].map(num => {
                    const chCode = `CH-${num}`;
                    const targetCode = selectedFloor === 30 ? chCode : `${selectedFloor}-${chCode}`;
                    const found = displayUnits.find(u => 
                      u.floor === selectedFloor && (
                        u.code.toUpperCase() === chCode ||
                        u.code.toUpperCase() === targetCode ||
                        u.code.toUpperCase().endsWith(chCode)
                      )
                    );
                    const isOccupied = found?.status === 'OCCUPIED' || (selectedFloor === 30 && (num === '06' || num === '01' || num === '08'));
                    const codeToUse = found?.code || targetCode;
                    const isSelected = selectedAptCode === codeToUse || (selectedFloor === 30 && selectedAptCode === 'CH-06' && codeToUse.includes('CH-06'));
                    const isOwnerLuc = selectedFloor === 30 && (num === '06' || num === '01');
                    const ownerName = isOwnerLuc ? activeOwnerName : (found?.owner?.name || '');
                    const isMatched = isUnitMatchingFilter(codeToUse, selectedFloor);
                    const fin = getApartmentFinancialMetrics(found || {
                      code: codeToUse,
                      status: isOccupied ? 'OCCUPIED' : 'VACANT',
                      area: (num === '01' || num === '08') ? 60 : 42,
                      priceBillion: 3.2
                    } as ApartmentUnit);

                    return (
                      <button
                        key={codeToUse}
                        type="button"
                        onClick={() => setSelectedAptCode(codeToUse)}
                        className={`p-2.5 rounded-none border text-left transition-all ${
                          isSelected
                            ? 'bg-[#1C2533] border-[#C5A880] ring-1 ring-[#C5A880]'
                            : isOwnerLuc
                            ? 'bg-[#15231B] border-[#F59E0B]/70'
                            : 'bg-[#121820] border-[#222B35] hover:border-gray-600'
                        } ${!isMatched ? 'opacity-30' : 'opacity-100'}`}
                      >
                        <div className="flex items-center justify-between text-xs font-mono font-bold text-white">
                          <div className="flex items-center gap-1.5">
                            <span>{codeToUse}</span>
                            {num === '06' && selectedFloor === 30 && (
                              <span className="text-[8.5px] px-1 bg-amber-500/25 text-amber-300 font-bold border border-amber-500/50">
                                CHỦ HỘ
                              </span>
                            )}
                            {num === '01' && selectedFloor === 30 && (
                              <span className="text-[8.5px] px-1 bg-cyan-950 text-cyan-300 font-bold border border-cyan-700/60">
                                CĂN PHỤ
                              </span>
                            )}
                          </div>
                          <span className={`px-1.5 py-0.5 text-[9px] ${
                            isOccupied ? 'text-emerald-400 bg-emerald-950/80 border border-emerald-500' : 'text-amber-400 bg-amber-950/80 border border-amber-500'
                          }`}>
                            {isOccupied ? 'Đã Ở' : 'Trống'}
                          </span>
                        </div>
                        <div className="text-[10px] text-gray-400 mt-1 truncate">
                          {isOwnerLuc ? `${activeOwnerName} (Chính Chủ)` : (isOccupied ? ownerName || 'Đã có cư dân' : 'Sẵn sàng bàn giao')}
                        </div>
                        {/* Tiêu thụ điện & doanh thu BQL */}
                        <div className="mt-1.5 pt-1.5 border-t border-[#1E293B] flex items-center justify-between text-[9.5px] font-mono">
                          <span className="text-amber-300">
                            {fin ? fin.electricKwh : 0} kWh
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
                            {unit.owner.name}
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
                          {isOccupied ? 'Đã Ở' : isMaint ? 'Nghiệm Thu' : 'Trống'}
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
        <div className="lg:col-span-5 bg-[#0D1117] border border-[#222B35] rounded-none p-4 shadow-2xl min-h-[660px] sm:min-h-[760px] flex flex-col justify-between overflow-hidden">
          
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
                  <span className={`px-2.5 py-1 text-[11px] font-bold uppercase rounded-none border ${
                    activeUnit.status === 'OCCUPIED'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                      : activeUnit.status === 'MAINTENANCE'
                      ? 'bg-blue-950 text-blue-300 border-blue-500'
                      : 'bg-amber-950 text-amber-300 border-amber-500'
                  }`}>
                    {activeUnit.status === 'OCCUPIED' ? 'ĐÃ CÓ NGƯỜI Ở' : activeUnit.status === 'MAINTENANCE' ? 'NGHIỆM THU' : 'NHÀ TRỐNG'}
                  </span>
                </div>

                {/* 2. Thanh 4 thông số chính nhanh gọn */}
                <div className="grid grid-cols-4 gap-1.5 p-2 bg-[#121820] border border-[#222B35] text-center font-mono">
                  <div className="p-1 bg-[#161B22]">
                    <div className="text-[9.5px] text-gray-400">Diện Tích</div>
                    <div className="text-xs font-bold text-white mt-0.5">{activeUnit.area} m²</div>
                  </div>
                  <div className="p-1 bg-[#161B22]">
                    <div className="text-[9.5px] text-gray-400">Bố Trí</div>
                    <div className="text-xs font-bold text-gray-200 mt-0.5">{activeUnit.bedrooms}PN • {activeUnit.bathrooms}WC</div>
                  </div>
                  <div className="p-1 bg-[#161B22]">
                    <div className="text-[9.5px] text-gray-400">Hướng Ban Công</div>
                    <div className="text-xs font-bold text-[#C5A880] mt-0.5">{activeUnit.direction || 'Đông Nam'}</div>
                  </div>
                  <div className="p-1 bg-[#161B22]">
                    <div className="text-[9.5px] text-gray-400">Giá Niêm Yết</div>
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
                    {activeUnit.status === 'OCCUPIED' ? 'Hồ Sơ Cư Dân' : 'Hiện Trạng'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailTab('FINANCIAL')}
                    className={`pb-2 px-2.5 transition-colors border-b-2 ${
                      detailTab === 'FINANCIAL'
                        ? 'border-[#C5A880] text-[#C5A880]'
                        : 'border-transparent text-gray-400 hover:text-white'
                    }`}
                  >
                    Năng Lượng & Chi Phí
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
                    Kỹ Thuật & Pháp Lý
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
                                <span>ĐT: {activeUnit.owner.phone}</span>
                                <span>• CCCD: {activeUnit.owner.cccd}</span>
                              </div>
                            </div>
                          </div>
                          <span className="text-[9.5px] px-1.5 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-600 font-mono">
                            Đã Đối Chiếu
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
                            <strong className="text-amber-400">12.5 kWh • 1.2 m³</strong>
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
                        <div className="text-blue-400 font-bold text-xs font-mono">
                          Căn Hộ Đang Nghiệm Thu Kỹ Thuật
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
                        <div className="text-amber-400 font-bold text-xs font-mono">
                          Căn Hộ Trống (Sẵn Sàng Bàn Giao)
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed">
                          Căn hộ đã hoàn tất nghiệm thu hoàn thiện xây dựng, an toàn điện nước và đầu phun chữa cháy PCCC đạt chuẩn an toàn. Sẵn sàng bàn giao cho cư dân mới.
                        </p>
                        <button
                          type="button"
                          onClick={() => setIsAssignModalOpen(true)}
                          className="w-full py-2.5 px-3 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center shadow"
                        >
                          Bàn Giao Căn Hộ & Cấp Tài Khoản
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
                          <span className="text-gray-200 font-bold">
                            DÒNG TIỀN & DOANH THU CĂN HỘ
                          </span>
                          <span className={`px-2 py-0.5 text-[9.5px] font-bold border ${
                            fin.isOccupied 
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-500' 
                              : 'bg-amber-950 text-amber-300 border-amber-600'
                          }`}>
                            {fin.isOccupied ? 'ĐÃ ĐÓNG ĐỦ' : 'CĐT BẢO DƯỠNG'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-[#232F42]">
                          <div>
                            <div className="text-[9.5px] text-gray-400">Doanh Thu Phí BQL:</div>
                            <div className="text-sm sm:text-base font-bold text-emerald-400 mt-0.5">
                              {new Intl.NumberFormat('vi-VN').format(fin.totalBqlRevenue)} <span className="text-[10px] text-gray-400">đ/th</span>
                            </div>
                            <div className="text-[9px] text-gray-400">~{((fin.totalBqlRevenue * 12) / 1000000).toFixed(1)} triệu đ/năm</div>
                          </div>
                          <div>
                            <div className="text-[9.5px] text-gray-400">Giá Thuê Ước Tính:</div>
                            <div className="text-sm sm:text-base font-bold text-amber-300 mt-0.5">
                              {new Intl.NumberFormat('vi-VN').format(fin.estimatedRentalPrice)} <span className="text-[10px] text-gray-400">đ/th</span>
                            </div>
                            <div className="text-[9px] text-emerald-400">
                              Lợi suất: {fin.rentalYield}% / năm
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 2. CHỈ SỐ TIÊU THỤ NĂNG LƯỢNG HÀNG THÁNG (ĐIỆN - NƯỚC) */}
                      <div className="p-2.5 bg-[#121820] border border-[#222B35] space-y-2">
                        <div className="flex items-center justify-between text-[11px] pb-1 border-b border-[#222B35]">
                          <span className="text-[#C5A880] font-bold">
                            TIÊU THỤ HÀNG THÁNG (KỲ GẦN NHẤT)
                          </span>
                          <span className="text-[9px] text-gray-400">Đồng hồ IoT</span>
                        </div>

                        {/* Tiêu thụ Điện */}
                        <div className="p-2 bg-[#161B22] border border-[#2D3748] space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-amber-300 font-bold text-[10.5px]">
                              Điện Sinh Hoạt ({fin.meterElectricId})
                            </span>
                            <span className="text-amber-300 font-bold text-xs">
                              {new Intl.NumberFormat('vi-VN').format(fin.electricCost)} đ
                            </span>
                          </div>
                          <div className="flex items-baseline justify-between text-[11px]">
                            <span className="font-bold text-white text-sm">{fin.electricKwh} <span className="text-[10px] text-gray-400 font-normal">kWh</span></span>
                            <span className="text-[9px] text-gray-400">{fin.electricKwh > 300 ? 'Cao hơn trung bình' : 'Tiêu thụ chuẩn'}</span>
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
                            <span className="text-cyan-300 font-bold text-[10.5px]">
                              Nước Sinh Hoạt ({fin.meterWaterId})
                            </span>
                            <span className="text-cyan-300 font-bold text-xs">
                              {new Intl.NumberFormat('vi-VN').format(fin.waterCost)} đ
                            </span>
                          </div>
                          <div className="flex items-baseline justify-between text-[11px]">
                            <span className="font-bold text-white text-sm">{fin.waterM3} <span className="text-[10px] text-gray-400 font-normal">m³</span></span>
                            <span className="text-[9px] text-emerald-400">Áp lực ống: 2.8 bar</span>
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
                            setBillToastMessage(`Đã trích xuất biên lai phiếu thu căn hộ ${activeUnit.code} thành công.`);
                            setTimeout(() => setBillToastMessage(null), 3500);
                          }}
                          className="py-2 px-2 bg-[#16202E] hover:bg-[#1E2B3E] text-gray-200 hover:text-white border border-[#2D3B4E] font-semibold text-[10.5px] transition-all flex items-center justify-center"
                        >
                          Xuất Phiếu Thu
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setBillToastMessage(`Đã gửi tin nhắn nhắc phí & hóa đơn tới chủ căn hộ ${activeUnit.code}.`);
                            setTimeout(() => setBillToastMessage(null), 3500);
                          }}
                          className="py-2 px-2 bg-[#162B22] hover:bg-[#1E3B2F] text-emerald-300 hover:text-emerald-200 border border-emerald-600/50 font-semibold text-[10.5px] transition-all flex items-center justify-center"
                        >
                          Gửi Thông Báo Phí
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
                      <strong className="text-emerald-400">Sổ hồng lâu dài (Đã cấp)</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Hệ thống kỹ thuật:</span>
                      <strong className="text-gray-200">Smart Intercom & Báo khói PCCC tự động</strong>
                    </div>
                  </div>
                )}
              </div>

              {/* 6. Chân thẻ: Nút hành động nhanh */}
              <div className="pt-2.5 border-t border-[#222B35] flex items-center gap-2 text-xs shrink-0">
                <button
                  type="button"
                  onClick={() => setIsDetailModalOpen(true)}
                  className="flex-1 py-2 px-3 bg-[#161B22] hover:bg-[#202936] text-gray-200 hover:text-white border border-[#2D3748] font-semibold transition-all flex items-center justify-center"
                >
                  Mặt Bằng Sàn
                </button>

                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="py-2 px-3 bg-[#161B22] hover:bg-[#202936] text-gray-200 hover:text-white border border-[#2D3748] font-semibold transition-all flex items-center justify-center"
                >
                  Chỉnh Sửa
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
          const targetCode = (selectedFloor === 30 && (num === '06' || num === '01'))
            ? `CH-${num}`
            : (selectedFloor === 12 && num === '05') ? '12A05' : `${selectedFloor > 9 ? selectedFloor : '0' + selectedFloor}${num}`;
          const found = apartments.find(u => 
            u.code.toLowerCase() === targetCode.toLowerCase() ||
            (selectedFloor === 30 && u.code.toLowerCase() === `ch-${num}`.toLowerCase()) ||
            u.code.toLowerCase() === `${selectedFloor}A${num}`.toLowerCase() ||
            u.code.toLowerCase() === `${selectedFloor}B${num}`.toLowerCase()
          );
          return found || {
            code: targetCode,
            floor: selectedFloor,
            status: (selectedFloor === 30 && (num === '06' || num === '01')) || (selectedFloor === 12 && num === '05') ? 'OCCUPIED' : 'VACANT',
            area: num === '06' && selectedFloor === 30 ? 42 : num === '01' && selectedFloor === 30 ? 50 : (num === '01' || num === '04' || num === '07') ? 108 : (num === '02' || num === '08') ? 52 : 78.5,
            priceBillion: num === '06' && selectedFloor === 30 ? 3.4 : num === '01' && selectedFloor === 30 ? 4.1 : 4.5,
            direction: (num === '05' || num === '06') ? 'Đông Nam' : (num === '01' || num === '02') ? 'Tây Bắc' : 'Đông Bắc',
            bedrooms: num === '06' && selectedFloor === 30 ? 1 : num === '01' && selectedFloor === 30 ? 2 : (num === '01' || num === '04' || num === '07') ? 3 : (num === '02' || num === '08') ? 1 : 2,
            bathrooms: (num === '02' || num === '08' || (num === '06' && selectedFloor === 30)) ? 1 : 2,
            typeLabel: num === '06' && selectedFloor === 30 ? '1 Phòng Ngủ' : num === '01' && selectedFloor === 30 ? '2 Phòng Ngủ' : (num === '01' || num === '04' || num === '07') ? '3 Phòng Ngủ' : (num === '02' || num === '08') ? '1 Phòng Ngủ' : '2 Phòng Ngủ',
            owner: (selectedFloor === 30 && (num === '06' || num === '01')) ? (apartments.find(a => a.code === `CH-${num}`)?.owner || activeUnit?.owner) : (selectedFloor === 12 && num === '05') ? activeUnit?.owner : undefined
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

                <button
                  type="button"
                  onClick={() => setIsFloorPlanExpanded(false)}
                  className="px-3 py-1.5 bg-[#161B22] hover:bg-rose-950 text-gray-300 hover:text-rose-200 border border-[#2D3748] hover:border-rose-500 text-xs font-mono transition-all"
                >
                  <span>Thu Nhỏ (Đóng) [✕]</span>
                </button>
              </div>

              {/* Thanh Điều Khiển Tầng Nhanh & Lọc Trực Tiếp */}
              <div className="p-2.5 sm:p-3 bg-[#121820] border-b border-[#222B35] flex flex-wrap items-center justify-between gap-3 text-xs">
                {/* Chọn tầng nhanh */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-gray-400 font-mono text-[11px]">Chuyển Tầng:</span>
                  {[30, 25, 20, 18, 15, 12, 10, 8, 5, 2, 1].map(fl => (
                    <button
                      key={fl}
                      type="button"
                      onClick={() => {
                        setSelectedFloor(fl);
                        if (fl === 30) setSelectedAptCode('CH-06');
                      }}
                      className={`px-2 py-1 text-[11px] font-mono transition-all border ${
                        selectedFloor === fl
                          ? 'bg-[#C5A880] text-[#0D1117] font-bold border-[#C5A880] shadow'
                          : 'bg-[#161B22] text-gray-300 border-[#2D3748] hover:border-gray-500'
                      }`}
                    >
                      {fl === 30 ? 'T30 (Chủ Hộ)' : `T${fl}`}
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
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500 font-bold'
                        : 'bg-[#161B22] text-emerald-400/80 border-transparent hover:text-emerald-300'
                    }`}
                  >
                    Đã Ở ({occupiedExpCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFloorFilterStatus('VACANT')}
                    className={`px-2 py-1 text-[10.5px] font-mono border ${
                      floorFilterStatus === 'VACANT'
                        ? 'bg-amber-950 text-amber-300 border-amber-500 font-bold'
                        : 'bg-[#161B22] text-amber-400/80 border-transparent hover:text-amber-300'
                    }`}
                  >
                    Căn Trống ({8 - occupiedExpCount})
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
                  <div className="text-amber-300 font-bold">{totalExpElectric} kWh</div>
                </div>
                <div className="p-1 bg-[#121A26] border border-[#222E3E]">
                  <span className="text-gray-400 text-[10px]">Nước Tiêu Thụ:</span>
                  <div className="text-cyan-300 font-bold">{totalExpWater} m³</div>
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
                                {fin?.electricKwh} kWh • {fin ? (fin.totalBqlRevenue / 1000000).toFixed(1) + ' tr' : ''}
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
                                {unit.owner?.name || 'Trần Hữu Lực'}
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
                      <div className="text-[11px] font-bold text-[#C5A880]">
                        BỐ TRÍ MẶT BẰNG KHÔNG GIAN
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
                          <span className="text-gray-400">Hướng Ban Công:</span>
                          <strong className="text-[#C5A880]">{currentExpandedUnit.direction || 'Đông Nam'}</strong>
                        </div>
                        <div className="flex justify-between text-gray-300">
                          <span className="text-gray-400">Tầm Nhìn (View):</span>
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
                      <div className="text-[11px] font-bold text-amber-300">
                        TIÊU THỤ NĂNG LƯỢNG & DOANH THU CĂN
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                        <div className="p-1.5 bg-[#161F2C] border border-[#26354A]">
                          <div className="text-gray-400">
                            Điện Tiêu Thụ:
                          </div>
                          <div className="text-white font-bold mt-0.5">{currentFin?.electricKwh} kWh</div>
                          <div className="text-[9.5px] text-amber-300">{new Intl.NumberFormat('vi-VN').format(currentFin?.electricCost || 0)} đ</div>
                        </div>

                        <div className="p-1.5 bg-[#161F2C] border border-[#26354A]">
                          <div className="text-gray-400">
                            Nước Tiêu Thụ:
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
                      className="flex-1 py-2 px-3 bg-[#C5A880] hover:bg-white text-[#0D1117] font-bold text-xs font-mono transition-all flex items-center justify-center"
                    >
                      Xem Hóa Đơn & Tiêu Thụ
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
