'use client';

import React, { useState, useMemo } from 'react';
import { 
  X, 
  Building, 
  Check, 
  Plus, 
  AlertCircle, 
  Layers, 
  Compass,
  FileText,
  Zap,
  Droplets,
  Key,
  ShieldCheck,
  Coins,
  TrendingUp,
  SlidersHorizontal,
  Home,
  Sun,
  Wind,
  Sparkles
} from 'lucide-react';
import { 
  ApartmentUnit, 
  ApartmentType, 
  ApartmentStatus, 
  addApartmentUnit 
} from '@/lib/apartmentStore';

interface AddApartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newUnit: ApartmentUnit) => void;
}

type TabType = 'ARCHITECTURE' | 'IOT_TECHNICAL' | 'FINANCE_LEGAL';

export default function AddApartmentModal({
  isOpen,
  onClose,
  onSuccess
}: AddApartmentModalProps) {
  // Tab điều hướng form
  const [activeTab, setActiveTab] = useState<TabType>('ARCHITECTURE');

  // 1. Kiến trúc & Vị trí
  const [floor, setFloor] = useState<number>(12);
  const [unitSlot, setUnitSlot] = useState<string>('06');
  const [code, setCode] = useState<string>('12A06');
  const [towerSide, setTowerSide] = useState<'LEFT' | 'RIGHT'>('LEFT');
  const [type, setType] = useState<ApartmentType>('2PN');
  const [area, setArea] = useState<number>(78.5);
  const [wallArea, setWallArea] = useState<number>(83.2);
  const [bedrooms, setBedrooms] = useState<number>(2);
  const [bathrooms, setBathrooms] = useState<number>(2);
  const [direction, setDirection] = useState('Đông Nam');
  const [mainDoorDirection, setMainDoorDirection] = useState('Tây Bắc');
  const [viewDescription, setViewDescription] = useState('View Sông Sài Gòn & Hồ Bơi Nội Khu');

  // 2. Hạ tầng IoT & Kỹ thuật PCCC
  const [electricMeterId, setElectricMeterId] = useState('EM-12A06-IoT');
  const [waterMeterId, setWaterMeterId] = useState('WM-12A06-SKY');
  const [initialElectric, setInitialElectric] = useState<number>(12.5);
  const [initialWater, setInitialWater] = useState<number>(1.2);
  const [hasSprinkler, setHasSprinkler] = useState<boolean>(true);
  const [hasSmokeSensor, setHasSmokeSensor] = useState<boolean>(true);
  const [hasIntercom, setHasIntercom] = useState<boolean>(true);

  // 3. Tài chính, Pháp lý & Bàn giao
  const [priceBillion, setPriceBillion] = useState<number>(4.85);
  const [estimatedRentPrice, setEstimatedRentPrice] = useState<number>(19500000);
  const [managementUnitPrice, setManagementUnitPrice] = useState<number>(18000);
  const [legalStatus, setLegalStatus] = useState<'Sổ hồng lâu dài' | 'Hợp đồng mua bán SPA'>('Sổ hồng lâu dài');
  const [finishingStandard, setFinishingStandard] = useState('Hoàn thiện cao cấp Full nội thất 5 sao');
  const [keysCount, setKeysCount] = useState<number>(3);
  const [cardsCount, setCardsCount] = useState<number>(2);
  const [status, setStatus] = useState<ApartmentStatus>('VACANT');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Tự động tính phí quản lý
  const calculatedMonthlyFee = useMemo(() => {
    return Math.round(area * managementUnitPrice);
  }, [area, managementUnitPrice]);

  // Tỷ suất sinh lời cho thuê ước tính (%/năm)
  const calculatedRentalYield = useMemo(() => {
    if (!priceBillion || priceBillion <= 0) return 0;
    return (((estimatedRentPrice * 12) / (priceBillion * 1000000000)) * 100).toFixed(1);
  }, [estimatedRentPrice, priceBillion]);

  if (!isOpen) return null;

  // Khi thay đổi Tầng hoặc Số căn -> Tự gợi ý mã căn & mã đồng hồ IoT
  const handleFloorChange = (newFloor: number, newSlot?: string) => {
    setFloor(newFloor);
    const slot = newSlot !== undefined ? newSlot : unitSlot;
    const floorPrefix = newFloor < 10 ? `0${newFloor}` : `${newFloor}`;
    const generatedCode = newFloor === 25 ? `25PH-${slot}` : `${floorPrefix}A${slot}`;
    setCode(generatedCode);
    setElectricMeterId(`EM-${generatedCode}-IoT`);
    setWaterMeterId(`WM-${generatedCode}-SKY`);
  };

  const handleSlotChange = (newSlot: string) => {
    setUnitSlot(newSlot);
    handleFloorChange(floor, newSlot);
  };

  // Khi chọn loại căn hộ -> Tự động điền các thông số kỹ thuật & định giá chuẩn
  const handleTypeChange = (selectedType: ApartmentType) => {
    setType(selectedType);
    if (selectedType === '1PN') {
      setArea(52.0);
      setWallArea(56.4);
      setBedrooms(1);
      setBathrooms(1);
      setPriceBillion(3.20);
      setEstimatedRentPrice(13500000);
    } else if (selectedType === '2PN') {
      setArea(78.5);
      setWallArea(83.2);
      setBedrooms(2);
      setBathrooms(2);
      setPriceBillion(4.85);
      setEstimatedRentPrice(19500000);
    } else if (selectedType === '3PN') {
      setArea(112.0);
      setWallArea(119.5);
      setBedrooms(3);
      setBathrooms(3);
      setPriceBillion(7.60);
      setEstimatedRentPrice(28000000);
    } else if (selectedType === 'DUPLEX_PENTHOUSE') {
      setArea(215.0);
      setWallArea(232.0);
      setBedrooms(4);
      setBathrooms(4);
      setPriceBillion(18.50);
      setEstimatedRentPrice(65000000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setError('Vui lòng nhập mã căn hộ hợp lệ.');
      setActiveTab('ARCHITECTURE');
      return;
    }

    let typeLabel = '2 Phòng Ngủ - 2WC';
    if (type === '1PN') typeLabel = '1 Phòng Ngủ - 1WC';
    if (type === '3PN') typeLabel = '3 Phòng Ngủ - 3WC';
    if (type === 'DUPLEX_PENTHOUSE') typeLabel = 'Duplex Penthouse';

    let statusLabel = 'Căn Hộ Trống';
    if (status === 'OCCUPIED') statusLabel = 'Đang Sinh Sống';
    if (status === 'MAINTENANCE') statusLabel = 'Đang Nghiệm Thu Kỹ Thuật';
    if (status === 'HANDOVER_PENDING') statusLabel = 'Chờ Bàn Giao Cư Dân';

    const newUnit: ApartmentUnit = {
      code: cleanCode,
      tower: 'A',
      towerName: 'Chung Cư Skyline',
      floor: Number(floor),
      type,
      typeLabel,
      area: Number(area),
      wallArea: Number(wallArea),
      bedrooms: Number(bedrooms),
      bathrooms: Number(bathrooms),
      direction,
      mainDoorDirection,
      priceBillion: Number(priceBillion),
      status,
      statusLabel,
      membersCount: 0,
      vehicles: [],
      billing: {
        monthlyFee: calculatedMonthlyFee,
        parkingFee: 0,
        serviceFee: 0,
        totalAmount: calculatedMonthlyFee,
        status: 'PAID',
        period: 'Tháng 09/2026',
        dueDate: '30/09/2026'
      },
      handoverProtocol: {
        protocolCode: `BBBG-SKYLINE-${cleanCode}`,
        handoverDate: new Date().toLocaleDateString('vi-VN'),
        handoverOfficer: 'Ban Quản Lý Chung Cư Skyline',
        keysCount: Number(keysCount),
        cardsCount: Number(cardsCount),
        initialElectricMeter: Number(initialElectric),
        initialWaterMeter: Number(initialWater),
        notes: `Nghiệm thu căn hộ ${cleanCode}: ${finishingStandard}. Pháp lý: ${legalStatus}. PCCC: Đạt chuẩn QCVN 06.`
      },
      description: description.trim() || `Căn hộ ${cleanCode} (${typeLabel} • ${area}m²) tầm view ${viewDescription} tại Chung Cư Skyline.`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const success = addApartmentUnit(newUnit);
    if (!success) {
      setError(`Mã căn hộ "${cleanCode}" đã tồn tại trong hệ thống. Vui lòng chọn mã khác.`);
      setActiveTab('ARCHITECTURE');
      return;
    }

    onSuccess(newUnit);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-4xl bg-[#090D14] border border-[#C5A880]/80 shadow-2xl flex flex-col max-h-[92vh] text-white rounded-none overflow-hidden">
        
        {/* ============================================================= */}
        {/* 1. HEADER MODAL                                               */}
        {/* ============================================================= */}
        <div className="p-4 sm:p-5 bg-[#101620] border-b border-[#222B35] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-[#C5A880]/20 border border-[#C5A880] flex items-center justify-center">
              <Plus className="w-5 h-5 text-[#C5A880]" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-[#C5A880] font-mono font-semibold flex items-center gap-1.5">
                <Building className="w-3 h-3" /> KHỞI TẠO KHÔNG GIAN BQL • CHUNG CƯ SKYLINE
              </div>
              <h2 className="font-serif text-lg sm:text-xl font-bold text-white mt-0.5">
                Thêm Căn Hộ Mới Vào Cơ Sở Dữ Liệu
              </h2>
            </div>
          </div>

          <button 
            type="button" 
            onClick={onClose} 
            className="p-1.5 text-gray-400 hover:text-white hover:bg-rose-950/60 border border-transparent hover:border-rose-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ============================================================= */}
        {/* 2. THANH TAB CHUYỂN PHÂN ĐOẠN FORM                           */}
        {/* ============================================================= */}
        <div className="flex border-b border-[#222B35] bg-[#0C121B] text-xs font-mono">
          <button
            type="button"
            onClick={() => setActiveTab('ARCHITECTURE')}
            className={`flex-1 py-2.5 px-4 text-center transition-all border-b-2 flex items-center justify-center gap-2 ${
              activeTab === 'ARCHITECTURE'
                ? 'border-[#C5A880] text-[#C5A880] bg-[#16202D] font-bold'
                : 'border-transparent text-gray-400 hover:text-white hover:bg-[#121822]'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>1. Kiến Trúc & Vị Trí</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('IOT_TECHNICAL')}
            className={`flex-1 py-2.5 px-4 text-center transition-all border-b-2 flex items-center justify-center gap-2 ${
              activeTab === 'IOT_TECHNICAL'
                ? 'border-[#C5A880] text-[#C5A880] bg-[#16202D] font-bold'
                : 'border-transparent text-gray-400 hover:text-white hover:bg-[#121822]'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>2. Hạ Tầng IoT & PCCC</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('FINANCE_LEGAL')}
            className={`flex-1 py-2.5 px-4 text-center transition-all border-b-2 flex items-center justify-center gap-2 ${
              activeTab === 'FINANCE_LEGAL'
                ? 'border-[#C5A880] text-[#C5A880] bg-[#16202D] font-bold'
                : 'border-transparent text-gray-400 hover:text-white hover:bg-[#121822]'
            }`}
          >
            <Coins className="w-3.5 h-3.5 text-emerald-400" />
            <span>3. Tài Chính & Pháp Lý</span>
          </button>
        </div>

        {/* Thông báo lỗi nếu có */}
        {error && (
          <div className="mx-5 mt-3 p-3 bg-rose-950/80 border border-rose-600 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* ============================================================= */}
        {/* 3. NỘI DUNG FORM CHÍNH                                        */}
        {/* ============================================================= */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs font-mono">
          
          {/* ----------------------------------------------------------- */}
          {/* PHẦN 1: KIẾN TRÚC & VỊ TRÍ                                 */}
          {/* ----------------------------------------------------------- */}
          {activeTab === 'ARCHITECTURE' && (
            <div className="space-y-4">
              {/* Tòa nhà & Tầng & Số căn */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3 bg-[#121822] border border-[#222B35]">
                <div>
                  <label className="block text-gray-400 mb-1">Tòa Nhà:</label>
                  <div className="px-3 py-2 bg-[#161F2C] border border-[#2B394E] text-[#C5A880] font-bold text-xs">
                    Chung Cư Skyline (25 Tầng)
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Chọn Tầng (1-25):</label>
                  <select
                    value={floor}
                    onChange={(e) => handleFloorChange(Number(e.target.value))}
                    className="w-full bg-[#161F2C] border border-[#2D3748] px-3 py-2 text-white outline-none focus:border-[#C5A880]"
                  >
                    {[25, 24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(f => (
                      <option key={f} value={f}>
                        Tầng {f} {f === 25 ? '(Penthouse)' : f === 12 ? '(Tầng căn 12A05)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Vị Trí Căn Trên Sàn:</label>
                  <select
                    value={unitSlot}
                    onChange={(e) => handleSlotChange(e.target.value)}
                    className="w-full bg-[#161F2C] border border-[#2D3748] px-3 py-2 text-white outline-none focus:border-[#C5A880]"
                  >
                    {['01', '02', '03', '04', '05', '06', '07', '08'].map(s => (
                      <option key={s} value={s}>Căn số {s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">
                    Mã Căn Hộ <span className="text-rose-400">*</span>:
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setCode(val);
                      setElectricMeterId(`EM-${val}-IoT`);
                      setWaterMeterId(`WM-${val}-SKY`);
                    }}
                    placeholder="VD: 12A06"
                    className="w-full bg-[#161F2C] border border-[#C5A880] px-3 py-2 text-white font-bold tracking-wider outline-none focus:ring-1 focus:ring-[#C5A880]"
                    required
                  />
                </div>
              </div>

              {/* Loại hình căn hộ (4 nút chọn nhanh) */}
              <div className="space-y-1.5">
                <label className="block text-gray-300 font-semibold">Loại Hình Căn Hộ Chuẩn:</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: '1PN', label: '1PN - 1WC', area: '52 m²', price: '3.20 tỷ' },
                    { id: '2PN', label: '2PN - 2WC', area: '78.5 m²', price: '4.85 tỷ' },
                    { id: '3PN', label: '3PN - 3WC', area: '112 m²', price: '7.60 tỷ' },
                    { id: 'DUPLEX_PENTHOUSE', label: 'Penthouse', area: '215 m²', price: '18.50 tỷ' }
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleTypeChange(t.id as any)}
                      className={`p-2.5 text-left border transition-all ${
                        type === t.id
                          ? 'bg-[#1C2533] text-[#C5A880] border-[#C5A880] ring-1 ring-[#C5A880]'
                          : 'bg-[#121820] text-gray-300 border-[#222B35] hover:border-gray-600'
                      }`}
                    >
                      <div className="font-bold text-white text-xs">{t.label}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{t.area} • {t.price}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Diện tích & Cơ cấu phòng */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Diện Tích Thông Thủy (m²):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={area}
                    onChange={(e) => setArea(Number(e.target.value))}
                    className="w-full bg-[#161F2C] border border-[#2D3748] px-3 py-2 text-white outline-none focus:border-[#C5A880]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Diện Tích Tim Tường (m²):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={wallArea}
                    onChange={(e) => setWallArea(Number(e.target.value))}
                    className="w-full bg-[#161F2C] border border-[#2D3748] px-3 py-2 text-white outline-none focus:border-[#C5A880]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Số Phòng Ngủ:</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={bedrooms}
                    onChange={(e) => setBedrooms(Number(e.target.value))}
                    className="w-full bg-[#161F2C] border border-[#2D3748] px-3 py-2 text-white outline-none focus:border-[#C5A880]"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Số Phòng Vệ Sinh:</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={bathrooms}
                    onChange={(e) => setBathrooms(Number(e.target.value))}
                    className="w-full bg-[#161F2C] border border-[#2D3748] px-3 py-2 text-white outline-none focus:border-[#C5A880]"
                  />
                </div>
              </div>

              {/* Hướng & Tầm nhìn */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Hướng Ban Công Chính:</label>
                  <select
                    value={direction}
                    onChange={(e) => setDirection(e.target.value)}
                    className="w-full bg-[#161F2C] border border-[#2D3748] px-3 py-2 text-white outline-none focus:border-[#C5A880]"
                  >
                    <option value="Đông Nam">Đông Nam (Đón gió mát, view sông)</option>
                    <option value="Đông Bắc">Đông Bắc (Nắng sớm dịu mát)</option>
                    <option value="Tây Nam">Tây Nam (Ấm áp, view thành phố)</option>
                    <option value="Tây Bắc">Tây Bắc (View công viên nội khu)</option>
                    <option value="Chính Nam">Chính Nam</option>
                    <option value="Chính Bắc">Chính Bắc</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Hướng Cửa Chính (Phong Thủy):</label>
                  <select
                    value={mainDoorDirection}
                    onChange={(e) => setMainDoorDirection(e.target.value)}
                    className="w-full bg-[#161F2C] border border-[#2D3748] px-3 py-2 text-white outline-none focus:border-[#C5A880]"
                  >
                    <option value="Tây Bắc">Tây Bắc</option>
                    <option value="Tây Nam">Tây Nam</option>
                    <option value="Đông Bắc">Đông Bắc</option>
                    <option value="Đông Nam">Đông Nam</option>
                    <option value="Chính Nam">Chính Nam</option>
                    <option value="Chính Bắc">Chính Bắc</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Tầm Nhìn (View):</label>
                  <input
                    type="text"
                    value={viewDescription}
                    onChange={(e) => setViewDescription(e.target.value)}
                    placeholder="VD: View Sông Sài Gòn, Landmark 81..."
                    className="w-full bg-[#161F2C] border border-[#2D3748] px-3 py-2 text-white outline-none focus:border-[#C5A880]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------- */}
          {/* PHẦN 2: HẠ TẦNG IOT ĐO LƯỜNG & AN TOÀN PCCC                */}
          {/* ----------------------------------------------------------- */}
          {activeTab === 'IOT_TECHNICAL' && (
            <div className="space-y-4">
              <div className="p-3 bg-gradient-to-r from-[#141F2D] to-[#0E1622] border border-[#2B394E] space-y-1">
                <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" /> HỆ THỐNG ĐO LƯỜNG ĐIỆN & NƯỚC THÔNG MINH IOT
                </div>
                <div className="text-[11px] text-gray-400">
                  Mỗi căn hộ tại Chung Cư Skyline được tích hợp đồng hồ điện tử và công tơ nước thông minh tự động truyền số liệu về BQL.
                </div>
              </div>

              {/* Đồng hồ điện & nước */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Điện IoT */}
                <div className="p-3 bg-[#121822] border border-[#222B35] space-y-2">
                  <div className="text-amber-300 font-bold flex items-center gap-1.5 text-xs">
                    <Zap className="w-3.5 h-3.5 text-amber-400" /> Đồng Hồ Điện Tử Thông Minh
                  </div>
                  <div>
                    <label className="block text-gray-400 text-[10.5px] mb-1">Mã Thiết Bị IoT (Electric Meter ID):</label>
                    <input
                      type="text"
                      value={electricMeterId}
                      onChange={(e) => setElectricMeterId(e.target.value)}
                      className="w-full bg-[#161F2C] border border-[#2D3748] px-3 py-1.5 text-white font-mono outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-[10.5px] mb-1">Chỉ Số Khởi Điểm Nghiệm Thu (kWh):</label>
                    <input
                      type="number"
                      step="0.1"
                      value={initialElectric}
                      onChange={(e) => setInitialElectric(Number(e.target.value))}
                      className="w-full bg-[#161F2C] border border-[#2D3748] px-3 py-1.5 text-white font-mono outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* Nước IoT */}
                <div className="p-3 bg-[#121822] border border-[#222B35] space-y-2">
                  <div className="text-cyan-300 font-bold flex items-center gap-1.5 text-xs">
                    <Droplets className="w-3.5 h-3.5 text-cyan-400" /> Đồng Hồ Nước Sinh Hoạt IoT
                  </div>
                  <div>
                    <label className="block text-gray-400 text-[10.5px] mb-1">Mã Thiết Bị IoT (Water Meter ID):</label>
                    <input
                      type="text"
                      value={waterMeterId}
                      onChange={(e) => setWaterMeterId(e.target.value)}
                      className="w-full bg-[#161F2C] border border-[#2D3748] px-3 py-1.5 text-white font-mono outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-[10.5px] mb-1">Chỉ Số Nước Khởi Điểm (m³):</label>
                    <input
                      type="number"
                      step="0.1"
                      value={initialWater}
                      onChange={(e) => setInitialWater(Number(e.target.value))}
                      className="w-full bg-[#161F2C] border border-[#2D3748] px-3 py-1.5 text-white font-mono outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>
              </div>

              {/* An toàn PCCC & Smart Living */}
              <div className="p-3 bg-[#121822] border border-[#222B35] space-y-2">
                <div className="text-[#C5A880] font-bold flex items-center gap-1.5 text-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> TIÊU CHUẨN AN TOÀN PCCC & THIẾT BỊ BÀN GIAO
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
                  <label className="p-2 bg-[#161F2C] border border-[#26354A] flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasSprinkler}
                      onChange={(e) => setHasSprinkler(e.target.checked)}
                      className="accent-[#C5A880]"
                    />
                    <span className="text-gray-200">Đầu Phun Sprinkler Tự Động</span>
                  </label>

                  <label className="p-2 bg-[#161F2C] border border-[#26354A] flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasSmokeSensor}
                      onChange={(e) => setHasSmokeSensor(e.target.checked)}
                      className="accent-[#C5A880]"
                    />
                    <span className="text-gray-200">Cảm Biến Khói Thông Minh</span>
                  </label>

                  <label className="p-2 bg-[#161F2C] border border-[#26354A] flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasIntercom}
                      onChange={(e) => setHasIntercom(e.target.checked)}
                      className="accent-[#C5A880]"
                    />
                    <span className="text-gray-200">Chuông Hình Video Intercom</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------- */}
          {/* PHẦN 3: TÀI CHÍNH, PHÁP LÝ & BÀN GIAO                       */}
          {/* ----------------------------------------------------------- */}
          {activeTab === 'FINANCE_LEGAL' && (
            <div className="space-y-4">
              {/* Định giá bán & Cho thuê */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-[#121822] border border-[#222B35]">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Giá Bán CĐT (Tỷ VNĐ):</label>
                  <input
                    type="number"
                    step="0.05"
                    value={priceBillion}
                    onChange={(e) => setPriceBillion(Number(e.target.value))}
                    className="w-full bg-[#161F2C] border border-[#2D3748] px-3 py-2 text-[#C5A880] font-bold outline-none focus:border-[#C5A880]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Giá Cho Thuê Tham Chiếu (VNĐ/tháng):</label>
                  <input
                    type="number"
                    step="500000"
                    value={estimatedRentPrice}
                    onChange={(e) => setEstimatedRentPrice(Number(e.target.value))}
                    className="w-full bg-[#161F2C] border border-[#2D3748] px-3 py-2 text-emerald-400 font-bold outline-none focus:border-emerald-400"
                  />
                  <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                    <TrendingUp className="w-2.5 h-2.5 text-emerald-400" /> Yield: ~{calculatedRentalYield}%/năm
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Phí Quản Lý Tòa Nhà (Dự kiến):</label>
                  <div className="px-3 py-2 bg-[#161F2C] border border-[#2B394E] text-amber-300 font-bold text-xs">
                    {new Intl.NumberFormat('vi-VN').format(calculatedMonthlyFee)} đ/tháng
                  </div>
                  <div className="text-[9.5px] text-gray-400 mt-1">Đơn giá: 18.000 đ/m² thông thủy</div>
                </div>
              </div>

              {/* Pháp lý & Bàn giao chìa khóa */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Pháp Lý Sở Hữu:</label>
                  <select
                    value={legalStatus}
                    onChange={(e) => setLegalStatus(e.target.value as any)}
                    className="w-full bg-[#161F2C] border border-[#2D3748] px-3 py-2 text-white outline-none focus:border-[#C5A880]"
                  >
                    <option value="Sổ hồng lâu dài">Sổ hồng lâu dài (Vĩnh viễn)</option>
                    <option value="Hợp đồng mua bán SPA">Hợp đồng mua bán SPA</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Số Chìa Khóa Cơ:</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={keysCount}
                    onChange={(e) => setKeysCount(Number(e.target.value))}
                    className="w-full bg-[#161F2C] border border-[#2D3748] px-3 py-2 text-white outline-none focus:border-[#C5A880]"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Số Thẻ Thang Máy Phân Tầng:</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={cardsCount}
                    onChange={(e) => setCardsCount(Number(e.target.value))}
                    className="w-full bg-[#161F2C] border border-[#2D3748] px-3 py-2 text-white outline-none focus:border-[#C5A880]"
                  />
                </div>
              </div>

              {/* Tiêu chuẩn hoàn thiện & Trạng thái khởi tạo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Tiêu Chuẩn Hoàn Thiện:</label>
                  <select
                    value={finishingStandard}
                    onChange={(e) => setFinishingStandard(e.target.value)}
                    className="w-full bg-[#161F2C] border border-[#2D3748] px-3 py-2 text-white outline-none focus:border-[#C5A880]"
                  >
                    <option value="Hoàn thiện cao cấp Full nội thất 5 sao">Hoàn thiện cao cấp Full nội thất 5 sao</option>
                    <option value="Hoàn thiện liền tường cao cấp (Bếp & WC)">Hoàn thiện liền tường cao cấp (Bếp & WC)</option>
                    <option value="Bàn giao thô (Tự do thiết kế)">Bàn giao thô (Tự do thiết kế)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Trạng Thái Khởi Tạo:</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-[#161F2C] border border-[#2D3748] px-3 py-2 text-white outline-none focus:border-[#C5A880]"
                  >
                    <option value="VACANT">Căn Hộ Trống (Sẵn sàng bàn giao)</option>
                    <option value="MAINTENANCE">Đang Nghiệm Thu Kỹ Thuật / Bảo Trì</option>
                    <option value="HANDOVER_PENDING">Chờ Bàn Giao Cư Dân</option>
                  </select>
                </div>
              </div>

              {/* Ghi chú mô tả */}
              <div>
                <label className="block text-gray-300 font-semibold mb-1">Ghi Chú Kỹ Thuật / Mô Tả Căn Hộ:</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Ghi chú chi tiết về trang thiết bị nội thất, tầm view hoặc các lưu ý bảo dưỡng..."
                  className="w-full bg-[#161F2C] border border-[#2D3748] px-3 py-2 text-white outline-none focus:border-[#C5A880]"
                />
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* 4. CHÂN FORM & NÚT LƯU                                       */}
          {/* ============================================================= */}
          <div className="pt-3 border-t border-[#222B35] flex items-center justify-between gap-3">
            <div className="text-gray-400 text-[11px]">
              Đang xem mục: <span className="text-[#C5A880] font-bold">
                {activeTab === 'ARCHITECTURE' ? '1. Kiến Trúc & Vị Trí' : activeTab === 'IOT_TECHNICAL' ? '2. Hạ Tầng IoT & PCCC' : '3. Tài Chính & Pháp Lý'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-[#161F2C] hover:bg-[#222E3E] text-gray-300 hover:text-white border border-[#2D3748] font-semibold transition-colors"
              >
                Hủy Bỏ
              </button>

              <button
                type="submit"
                className="px-6 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-lg"
              >
                <Plus className="w-4 h-4" />
                <span>Lưu Căn Hộ Mới</span>
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}
