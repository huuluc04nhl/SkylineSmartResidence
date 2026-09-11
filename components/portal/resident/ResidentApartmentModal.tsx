'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Building, 
  Sparkles, 
  Layers, 
  ShieldCheck, 
  Cpu, 
  Wind, 
  Sun, 
  Lock, 
  Flame, 
  PhoneCall, 
  Wrench, 
  CheckCircle2, 
  FileText, 
  Compass, 
  Maximize2,
  Tv,
  Wifi,
  Droplets,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import ApartmentModel3DViewer from '@/components/portal/shared/ApartmentModel3DViewer';
import { getSmartHomeState, saveSmartHomeState } from '@/lib/smartHomeStore';
import { getApartmentByCode } from '@/lib/apartmentStore';
import { useAuth } from '@/lib/authContext';

interface ResidentApartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  apartmentCode?: string;
  onNavigateToSmartHome?: () => void;
}

type TabType = '3D_VIEWER' | 'EQUIPMENTS' | 'HANDBOOK';

export default function ResidentApartmentModal({
  isOpen,
  onClose,
  apartmentCode = '12A05',
  onNavigateToSmartHome
}: ResidentApartmentModalProps) {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('3D_VIEWER');
  const [smartState, setSmartState] = useState(() => getSmartHomeState(apartmentCode));

  const aptData = getApartmentByCode(apartmentCode);

  // Lắng nghe cập nhật Smart Home
  useEffect(() => {
    const handleUpdate = () => {
      setSmartState({ ...getSmartHomeState(apartmentCode) });
    };
    window.addEventListener('skyline_smarthome_update', handleUpdate);
    return () => window.removeEventListener('skyline_smarthome_update', handleUpdate);
  }, [apartmentCode]);

  if (!isOpen) return null;

  // Toggle đèn từng phòng
  const handleToggleLight = (room: 'livingRoom' | 'bedroomMaster' | 'kitchen' | 'balcony') => {
    const nextLights = {
      ...smartState.lights,
      [room]: !smartState.lights[room]
    };
    saveSmartHomeState(apartmentCode, { lights: nextLights });
  };

  // Toggle AC
  const handleToggleAC = () => {
    saveSmartHomeState(apartmentCode, { acPower: !smartState.acPower });
  };

  // Thay đổi nhiệt độ AC
  const handleChangeTemp = (delta: number) => {
    const nextTemp = Math.min(Math.max(smartState.acTemp + delta, 18), 30);
    saveSmartHomeState(apartmentCode, { acTemp: nextTemp });
  };

  // Toggle Rèm
  const handleToggleCurtains = () => {
    saveSmartHomeState(apartmentCode, { curtainsOpen: !smartState.curtainsOpen });
  };

  // Toggle Khóa
  const handleToggleDoor = () => {
    saveSmartHomeState(apartmentCode, { doorLocked: !smartState.doorLocked });
  };

  // Danh mục trang thiết bị bàn giao cao cấp chuẩn 5 sao
  const PREMIUM_EQUIPMENTS = [
    {
      id: 'eq-1',
      name: 'Khóa Cửa Thông Minh FaceID Skyline v4.2',
      brand: 'Skyline SmartSec / Nhập khẩu Đức',
      location: 'Cửa chính căn hộ',
      specs: 'Nhận diện khuôn mặt 3D AI trong 0.2s, thẻ từ NFC, mã số ảo chống nhìn trộm, kết nối mã hóa bảo mật BQL.',
      status: smartState.doorLocked ? 'Đang Khóa Chốt An Toàn' : 'Đang Mở Khóa',
      warranty: 'Bảo hành 36 tháng (Đến 08/2029)',
      icon: Lock,
      color: '#10B981'
    },
    {
      id: 'eq-2',
      name: 'Hệ Thống Điều Hòa Trung Tâm Multi-Split Inverter',
      brand: 'Daikin VRV-S Multi / Nhật Bản',
      location: 'Phòng Khách, PN Master, PN 2',
      specs: 'Gas R32 tiết kiệm điện 65%, công nghệ lọc ion Streamer diệt 99% vi khuẩn, điều khiển nhiệt độ độc lập từng phòng.',
      status: smartState.acPower ? `Đang Bật (${smartState.acTemp}°C)` : 'Đang Tắt Chờ',
      warranty: 'Bảo hành chính hãng 5 năm máy nén',
      icon: Wind,
      color: '#0284C7'
    },
    {
      id: 'eq-3',
      name: 'Hệ Thống Rèm Cửa Tự Động Thông Minh',
      brand: 'Aqara Zigbee 3.0 / Động cơ siêu êm',
      location: 'Ban công sinh thái & PN Master',
      specs: 'Động cơ kéo rèm chịu tải 50kg, độ ồn < 25dB, tự động đóng khi trời nắng gắt và mở lúc bình minh.',
      status: smartState.curtainsOpen ? 'Đang Mở Đón Ánh Sáng' : 'Đang Đóng Chắn Sáng',
      warranty: 'Bảo hành 24 tháng',
      icon: Sun,
      color: '#F59E0B'
    },
    {
      id: 'eq-4',
      name: 'Bếp Từ Đôi & Hút Mùi Cảm Ứng Âm Tủ',
      brand: 'Bosch Series 8 / CHLB Đức',
      location: 'Khu vực bếp & bàn ăn',
      specs: 'Mặt kính gốm thủy tinh Schott Ceran chịu nhiệt 1000°C, chức năng PowerBoost gia nhiệt nhanh, cảm biến tự ngắt an toàn.',
      status: 'Sẵn sàng sử dụng 220V',
      warranty: 'Bảo hành 36 tháng',
      icon: Flame,
      color: '#EF4444'
    },
    {
      id: 'eq-5',
      name: 'Thiết Bị Vệ Sinh Thông Minh & Buồng Tắm Kính',
      brand: 'Kohler & TOTO Neorest / Mỹ - Nhật',
      location: 'WC Master & WC Chung',
      specs: 'Bồn cầu thông minh tự đóng mở nắp & sưởi ấm nắp ngồi, sen cây điều nhiệt âm tường mạ Chrome chống bám cặn, kính cường lực 12mm.',
      status: 'Hệ thống cấp thoát nước ổn định (6.2 Bar)',
      warranty: 'Bảo hành 5 năm',
      icon: Droplets,
      color: '#06B6D4'
    },
    {
      id: 'eq-6',
      name: 'Hệ Kính Hộp 3 Lớp Low-E Cách Âm Chống UV',
      brand: 'Eurowindow / Kính Saint-Gobain Pháp',
      location: 'Toàn bộ cửa sổ và vách kính căn hộ',
      specs: 'Kính Low-E cản nhiệt 95%, cản tia UV 99%, cách âm 45dB triệt tiêu tiếng ồn đô thị, khung nhôm cầu cách nhiệt.',
      status: 'Đạt chuẩn an toàn bão cấp 14',
      warranty: 'Bảo hành kết cấu 10 năm',
      icon: ShieldCheck,
      color: '#8B5CF6'
    },
    {
      id: 'eq-7',
      name: 'Hạ Tầng Mạng FTTH Cáp Quang & Wi-Fi 6 Mesh',
      brand: 'Skyline GigaFiber & Cisco Mesh',
      location: 'Tủ điện âm tường & trần thạch cao',
      specs: 'Đường truyền 1 Gbps không giới hạn băng thông, thiết bị phát Wi-Fi 6 phủ sóng 100% căn hộ không góc chết.',
      status: 'Kết nối liên tục 100% Online',
      warranty: 'Hỗ trợ kỹ thuật 24/7',
      icon: Wifi,
      color: '#EC4899'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl bg-[#0D1117] border border-[#C5A880]/80 shadow-[0_25px_70px_rgba(0,0,0,0.9)] flex flex-col max-h-[94vh] overflow-hidden text-white rounded-none">
        
        {/* ============================================================= */}
        {/* 1. HEADER SỔ TAY CĂN HỘ THƯỢNG LƯU                            */}
        {/* ============================================================= */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#161D26] via-[#121820] to-[#0D1117] border-b border-[#222B35] flex items-start justify-between gap-4 select-none">
          <div>
            <div className="flex items-center gap-2 text-[10px] sm:text-[10.5px] uppercase tracking-[0.2em] text-[#C5A880] font-mono font-bold">
              <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>Sổ Tay Căn Hộ • SKYLINE LUXURY RESIDENCE</span>
              <span>•</span>
              <span>Tầng 12</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 mt-1.5">
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-wide">
                Căn Hộ {apartmentCode}
              </h2>
              
              <span className="px-2.5 py-0.5 text-xs bg-[#1C2533] text-[#C5A880] border border-[#C5A880]/40 font-semibold">
                Loại Căn: 2PN - 2WC
              </span>

              <span className="px-2.5 py-0.5 text-xs bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 font-mono font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Diện Tích Thông Thủy: 78.5 m²
              </span>

              <span className="text-xs text-gray-300 hidden md:inline">
                Chủ Hộ: <strong className="text-white">{currentUser?.full_name || 'Trần Hữu Lực'}</strong>
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-[#1C2533] border border-transparent hover:border-gray-700 transition-colors"
            title="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ============================================================= */}
        {/* 2. THANH CHUYỂN ĐỔI TAB TRẢI NGHIỆM SỐ CƯ DÂN                  */}
        {/* ============================================================= */}
        <div className="flex items-center gap-1 px-4 sm:px-5 bg-[#0A0E17] border-b border-[#222B35] overflow-x-auto text-xs font-mono select-none">
          <button
            type="button"
            onClick={() => setActiveTab('3D_VIEWER')}
            className={`py-3 px-3.5 whitespace-nowrap font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === '3D_VIEWER'
                ? 'border-[#C5A880] text-[#C5A880] bg-[#161D26]'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-[#121820]'
            }`}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>1. Phối Cảnh & Kích Thước Phòng</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('EQUIPMENTS')}
            className={`py-3 px-3.5 whitespace-nowrap font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'EQUIPMENTS'
                ? 'border-[#C5A880] text-[#C5A880] bg-[#161D26]'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-[#121820]'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>2. Thiết Bị Bàn Giao Cao Cấp ({PREMIUM_EQUIPMENTS.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('HANDBOOK')}
            className={`py-3 px-3.5 whitespace-nowrap font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'HANDBOOK'
                ? 'border-[#C5A880] text-[#C5A880] bg-[#161D26]'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-[#121820]'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>3. Cẩm Nang Căn Hộ & Hotline 24/7</span>
          </button>
        </div>

        {/* ============================================================= */}
        {/* 3. NỘI DUNG CHÍNH CỦA TỪNG TAB                                */}
        {/* ============================================================= */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4">
          
          {/* ----------------------------------------------------------- */}
          {/* TAB 1: PHỐI CẢNH 3D & KÍCH THƯỚC PHÒNG                      */}
          {/* ----------------------------------------------------------- */}
          {activeTab === '3D_VIEWER' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Thẻ mô tả nhanh không gian */}
              <div className="p-3 bg-[#121820] border border-[#222B35] flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                  <span className="text-gray-300">
                    Hướng Cửa Chính: <strong className="text-white">Tây Bắc</strong> • Hướng Ban Công: <strong className="text-[#C5A880]">Đông Nam (Đón gió mát & view sông Sài Gòn)</strong>
                  </span>
                </div>
                <span className="text-[11px] text-[#C5A880] font-mono">
                  ✨ Chạm vào từng phòng để xem kích thước thực tế & điều khiển thiết bị
                </span>
              </div>

              {/* Viewer Mô Hình Không Gian 3D Thông Minh */}
              <ApartmentModel3DViewer
                apartmentCode={apartmentCode}
                apartmentType="2PN - 2WC"
                clearArea={78.5}
                lights={smartState.lights}
                acPower={smartState.acPower}
                acTemp={smartState.acTemp}
                curtainsOpen={smartState.curtainsOpen}
                doorLocked={smartState.doorLocked}
                waterLeakActive={false}
                onToggleLight={handleToggleLight}
                onToggleDoor={handleToggleDoor}
                onToggleCurtains={handleToggleCurtains}
                onToggleAC={handleToggleAC}
                onChangeTemp={handleChangeTemp}
                interactive={true}
              />

              {/* Bảng tổng hợp diện tích chuẩn kiến trúc */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                {[
                  { name: 'Phòng Khách & Ăn', area: '24.5 m²', dim: '5.60m x 4.40m' },
                  { name: 'Phòng Ngủ Master', area: '16.5 m²', dim: '4.60m x 3.60m' },
                  { name: 'Phòng Ngủ 2', area: '11.8 m²', dim: '3.50m x 3.40m' },
                  { name: 'Khu Bếp Nấu', area: '7.5 m²', dim: '3.00m x 2.50m' },
                  { name: 'Ban Công Sinh Thái', area: '6.7 m²', dim: '4.50m x 1.50m' },
                  { name: 'WC Master', area: '4.2 m²', dim: '2.20m x 1.90m' },
                  { name: 'WC Chung', area: '3.8 m²', dim: '2.00m x 1.90m' },
                  { name: 'Sảnh Đón Cửa Vào', area: '3.5 m²', dim: '1.90m x 1.80m' },
                ].map((item, idx) => (
                  <div key={idx} className="p-2.5 bg-[#121820] border border-[#222B35] rounded-none space-y-0.5">
                    <div className="text-[11px] text-gray-400 font-medium truncate">{item.name}</div>
                    <div className="text-sm font-bold text-white font-mono">{item.area}</div>
                    <div className="text-[10px] text-[#C5A880] font-mono">{item.dim}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------- */}
          {/* TAB 2: THIẾT BỊ BÀN GIAO CAO CẤP                             */}
          {/* ----------------------------------------------------------- */}
          {activeTab === 'EQUIPMENTS' && (
            <div className="space-y-3 animate-fadeIn">
              <div className="p-3 bg-[#121820] border border-[#222B35] text-xs text-gray-300 flex items-center justify-between">
                <span>Danh mục trang thiết bị hoàn thiện & bàn giao chính thức cho chủ sở hữu căn hộ <strong>{apartmentCode}</strong>.</span>
                <span className="text-emerald-400 font-mono text-[11px] hidden sm:inline">Tiêu chuẩn bàn giao 5 sao ✓</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {PREMIUM_EQUIPMENTS.map((eq) => {
                  const Icon = eq.icon;
                  return (
                    <div 
                      key={eq.id}
                      className="p-3.5 bg-[#121820] border border-[#222B35] hover:border-[#C5A880]/60 transition-all space-y-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div 
                            className="w-8 h-8 rounded-none border border-[#2D3748] flex items-center justify-center bg-[#161B22]"
                            style={{ color: eq.color }}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-white text-xs sm:text-sm">{eq.name}</h4>
                            <div className="text-[10px] text-gray-400 font-mono">{eq.brand}</div>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 bg-[#161B22] border border-[#2D3748] text-gray-300 whitespace-nowrap">
                          {eq.location}
                        </span>
                      </div>

                      <p className="text-[11px] text-gray-300 leading-relaxed font-light">
                        {eq.specs}
                      </p>

                      <div className="pt-1.5 border-t border-[#1C2533] flex items-center justify-between text-[10.5px] font-mono">
                        <span className="text-emerald-400 font-semibold">{eq.status}</span>
                        <span className="text-gray-400">{eq.warranty}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------- */}
          {/* TAB 3: CẨM NANG CĂN HỘ & HOTLINE HỖ TRỢ 24/7                 */}
          {/* ----------------------------------------------------------- */}
          {activeTab === 'HANDBOOK' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Hotline Khẩn Cấp BQL & Kỹ Thuật Tòa Nhà */}
              <div className="p-4 bg-gradient-to-r from-[#1C2533] to-[#121820] border border-[#C5A880]/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PhoneCall className="w-5 h-5 text-amber-400" />
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        Đường Dây Nóng Kỹ Thuật & Dịch Vụ Cư Dân 24/7
                      </h3>
                      <p className="text-[11px] text-gray-300">
                        Đội ngũ kỹ sư tòa nhà túc trực thường trực, hỗ trợ xử lý kỹ thuật trong vòng 10 phút.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <div className="p-2.5 bg-[#0D1117] border border-[#222B35] space-y-0.5">
                    <span className="text-[10px] text-gray-400 uppercase font-mono">Tổng Đài Ban Quản Lý</span>
                    <div className="text-base font-bold text-[#C5A880] font-mono">1900 8899 (Phím 1)</div>
                    <span className="text-[10px] text-emerald-400">Trực 24/7 đối soát</span>
                  </div>

                  <div className="p-2.5 bg-[#0D1117] border border-[#222B35] space-y-0.5">
                    <span className="text-[10px] text-gray-400 uppercase font-mono">Hỗ Trợ Kỹ Thuật & Điện Nước</span>
                    <div className="text-base font-bold text-sky-400 font-mono">028 7300 9988</div>
                    <span className="text-[10px] text-sky-400">Kỹ sư tầng trực tiếp</span>
                  </div>

                  <div className="p-2.5 bg-[#0D1117] border border-[#222B35] space-y-0.5">
                    <span className="text-[10px] text-gray-400 uppercase font-mono">Lễ Tân & Dịch Vụ Tiện Ích</span>
                    <div className="text-base font-bold text-emerald-400 font-mono">028 7300 9989</div>
                    <span className="text-[10px] text-gray-400">Sảnh đón tầng 1</span>
                  </div>
                </div>
              </div>

              {/* Cẩm nang an toàn điện nước & thiết bị */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-4 bg-[#121820] border border-[#222B35] space-y-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 text-amber-300">
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    Vị Trí Van Khóa Nước & Tủ Điện Tổng
                  </h4>
                  <ul className="text-xs text-gray-300 space-y-1.5 list-disc pl-4 font-light leading-relaxed">
                    <li><strong>Tủ Aptomat Điện Tổng:</strong> Nằm ở sảnh đón cửa vào, phía sau tủ giày âm tường. Aptomat chống giật tự ngắt RCBO an toàn.</li>
                    <li><strong>Van Cấp Nước Sạch Tổng:</strong> Đặt trong hộp kỹ thuật cạnh cửa chính bên ngoài hành lang tầng 12. Khi có sự cố rò rỉ, hệ thống AI sẽ tự động đóng van điện từ trong 3 giây.</li>
                    <li><strong>Đầu Báo Cháy & Khói Thông Minh:</strong> Bố trí tại phòng khách và 2 phòng ngủ, kết nối trực tiếp với trung tâm PCCC tòa nhà.</li>
                  </ul>
                </div>

                <div className="p-4 bg-[#121820] border border-[#222B35] space-y-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 text-sky-300">
                    <CheckCircle2 className="w-4 h-4 text-sky-400" />
                    Quy Chuẩn Sử Dụng Căn Hộ & Ban Công
                  </h4>
                  <ul className="text-xs text-gray-300 space-y-1.5 list-disc pl-4 font-light leading-relaxed">
                    <li><strong>Ban Công Sinh Thái:</strong> Thiết kế lan can kính an toàn cao 1.4m. Tuyệt đối không treo đồ nặng quá tải hoặc xả rác qua ban công.</li>
                    <li><strong>Thiết Kế Nội Thất:</strong> Mọi hoạt động khoan đục hoặc thay đổi kết cấu tường chịu lực cần đăng ký trước với BQL để bảo đảm an toàn tĩnh tải.</li>
                    <li><strong>Bảo Hiểm Tòa Nhà:</strong> Toàn bộ căn hộ được chủ đầu tư mua bảo hiểm cháy nổ và rủi ro tài sản trọn gói đến năm 2030.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ============================================================= */}
        {/* 4. FOOTER                                                     */}
        {/* ============================================================= */}
        <div className="p-3 sm:p-4 bg-[#0A0E17] border-t border-[#222B35] flex items-center justify-between text-xs text-gray-400">
          <span className="font-mono text-[11px] text-gray-400">
            Mã định danh sổ số: <strong className="text-white">SKYLINE-12A05-TITLED</strong>
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#161B22] hover:bg-[#C5A880] hover:text-[#0D1117] text-[#C5A880] border border-[#C5A880]/50 font-bold text-xs uppercase tracking-wider transition-all"
          >
            Đóng Sổ Tay
          </button>
        </div>

      </div>
    </div>
  );
}
