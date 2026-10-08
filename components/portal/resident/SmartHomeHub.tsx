'use client';

import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Zap, 
  Droplets, 
  Lock, 
  LockKeyhole, 
  ShieldCheck, 
  Flame, 
  Power, 
  Sun, 
  Moon, 
  Tv, 
  Sparkles, 
  Thermometer, 
  Wind, 
  CheckCircle2, 
  AlertTriangle,
  Clock, 
  Video, 
  Mic, 
  MicOff, 
  Bell, 
  DoorClosed, 
  DoorOpen, 
  Copy, 
  Trash2, 
  ShieldAlert, 
  Camera, 
  BatteryCharging, 
  History, 
  KeyRound, 
  Plus, 
  CreditCard,
  Layers,
  ChevronRight,
  Maximize2,
  Sliders,
  Check,
  Building
} from 'lucide-react';
import { User } from '@/lib/dataStore';
import { getApartmentByCode } from '@/lib/apartmentStore';
import { 
  getSmartHomeState, 
  saveSmartHomeState, 
  applyScene, 
  getAutomationRules, 
  toggleAutomationRule, 
  createGuestPin,
  revokeGuestPin,
  addDoorAccessLog,
  SmartHomeState, 
  AutomationRule, 
  SceneType,
  GuestPin,
  SmartDoorAccessLog
} from '@/lib/smartHomeStore';
import ApartmentModel3DViewer from '@/components/portal/shared/ApartmentModel3DViewer';
import { getEnrolledFaceProfile, EnrolledFaceProfile } from '@/lib/faceEnrollStore';
import { nksGetFamilyMembers } from '@/lib/nksApiClient';
import { 
  getResidentCards, 
  toggleCardStatus, 
  markCardUsed, 
  CardState 
} from '@/lib/facilityStore';

interface SmartHomeHubProps {
  currentUser: User;
}

type AppTab = 'DEVICES' | 'DOOR_ACCESS' | 'AUTOMATION';

/**
 * 🎛️ Reusable Luxury Toggle Switch Component: Thống nhất 100% kích thước & hiệu ứng
 */
function LuxurySwitch({
  checked,
  onChange,
  activeColor = 'bg-[#C5A880]',
  ariaLabel
}: {
  checked: boolean;
  onChange: () => void;
  activeColor?: string;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={onChange}
      className={`relative inline-flex items-center h-6 w-11 border cursor-pointer select-none transition-colors duration-200 rounded-none shrink-0 ${
        checked ? `${activeColor} border-[#C5A880]` : 'bg-[#161D26] border-[#2D3748]'
      }`}
    >
      <span
        className={`absolute top-[2px] bottom-[2px] w-4 flex items-center justify-center transition-all duration-200 ease-in-out rounded-none shadow-sm ${
          checked
            ? 'left-[22px] bg-[#0D1117] text-[#C5A880]'
            : 'left-[2px] bg-gray-400 text-[#0D1117]'
        }`}
      />
    </button>
  );
}

export default function SmartHomeHub({ currentUser }: SmartHomeHubProps) {
  const isOwner = currentUser.role === 'OWNER';
  const aptCode = currentUser.apartment_code || 'CH-06';
  const aptUnit = getApartmentByCode(aptCode);
  const aptArea = aptUnit ? aptUnit.area : 42.0;
  const aptType = aptUnit ? aptUnit.typeLabel : '1PN - 1WC';

  // State chính từ SmartHomeStore
  const [smartState, setSmartState] = useState<SmartHomeState>(() => getSmartHomeState(aptCode));
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>(() => getAutomationRules(aptCode));
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // App Navigation Segment Tab
  const [activeTab, setActiveTab] = useState<AppTab>('DEVICES');
  const [is3dMode, setIs3dMode] = useState<boolean>(false);

  // Dữ liệu Thẻ & FaceID
  const [faceProfile, setFaceProfile] = useState<EnrolledFaceProfile | null>(null);
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [residentCards, setResidentCards] = useState<CardState[]>([]);
  const [tappingCardUid, setTappingCardUid] = useState<string | null>(null);

  // Chuông hình & Khóa cửa tương tác
  const [isIntercomActive, setIsIntercomActive] = useState(false);
  const [snapshotCount, setSnapshotCount] = useState(0);
  const [isMotionAlertActive, setIsMotionAlertActive] = useState(false);
  const [cameraTime, setCameraTime] = useState('');
  const [copiedPinId, setCopiedPinId] = useState<string | null>(null);
  const [activeLogFilter, setActiveLogFilter] = useState<'ALL' | 'FACE_ID' | 'PIN_OTP' | 'NFC_CARD'>('ALL');

  // Lắng nghe dữ liệu
  useEffect(() => {
    const loadRealData = () => {
      const profile = getEnrolledFaceProfile(currentUser.id) || 
                      getEnrolledFaceProfile(currentUser.username) || 
                      (currentUser.phone ? getEnrolledFaceProfile(currentUser.phone) : null);
      setFaceProfile(profile);
    };
    loadRealData();

    nksGetFamilyMembers().then(res => {
      if (res.success && res.members) {
        setFamilyMembers(res.members);
      }
    }).catch(() => {});

    const defaultCards: CardState[] = [
      {
        cardUid: `NFC-SKY-${aptCode}-01`,
        holderName: currentUser.full_name || (currentUser as any)?.fullname || 'Trần Hữu Lực',
        role: isOwner ? 'Chủ Hộ (Master)' : 'Người Nhà',
        isOwner: true,
        status: 'ACTIVE'
      }
    ];
    setResidentCards(getResidentCards(aptCode, defaultCards));

    const onCardsUpdated = (e: any) => {
      if (e.detail) setResidentCards(e.detail);
    };
    window.addEventListener('skyline_cards_updated', onCardsUpdated);

    // Đồng hồ camera
    const timer = setInterval(() => {
      const now = new Date();
      setCameraTime(now.toLocaleTimeString('vi-VN', { hour12: false }) + ' • 1080p HD');
    }, 1000);

    return () => {
      window.removeEventListener('skyline_cards_updated', onCardsUpdated);
      clearInterval(timer);
    };
  }, [currentUser, aptCode, isOwner]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const {
    lights,
    acPower,
    acTemp,
    curtainsOpen,
    doorLocked: masterDoorLocked,
    doorAjar,
    waterLeakSensorActive,
    activeScene,
    doorBatteryLevel = 96,
    guestPins = [],
    doorAccessLogs = []
  } = smartState;

  // Kích hoạt Ngữ Cảnh Nhanh
  const handleTriggerScene = (scene: SceneType) => {
    if (scene === 'AWAY' && !isOwner) {
      showToast('⚠️ Chỉ Chủ Hộ mới có quyền kích hoạt chế độ "Đi Vắng" (Tắt toàn bộ hệ thống điện).');
      return;
    }
    const { state: nextState, message } = applyScene(aptCode, scene);
    setSmartState(nextState);
    showToast(message);
  };

  // Toggle Đèn phòng
  const handleToggleLight = (roomKey: keyof typeof smartState.lights) => {
    const nextVal = !lights[roomKey];
    const nextLights = { ...lights, [roomKey]: nextVal };
    const updated = saveSmartHomeState(aptCode, { lights: nextLights });
    setSmartState(updated);
    const roomNames: Record<string, string> = {
      livingRoom: 'Phòng Khách',
      bedroomMaster: 'Phòng Ngủ Master',
      kitchen: 'Gian Bếp',
      balcony: 'Ban Công'
    };
    showToast(`💡 Đèn ${roomNames[roomKey] || roomKey}: ${nextVal ? 'ĐÃ BẬT' : 'ĐÃ TẮT'}`);
  };

  // Toggle Điều Hòa
  const handleToggleAC = () => {
    const nextAC = !acPower;
    const updated = saveSmartHomeState(aptCode, { acPower: nextAC });
    setSmartState(updated);
    showToast(`❄️ Điều hòa Daikin VRV: ${nextAC ? `BẬT (${acTemp}°C)` : 'TẮT'}`);
  };

  // Tăng giảm nhiệt độ AC
  const handleChangeTemp = (delta: number) => {
    const nextTemp = Math.min(Math.max(acTemp + delta, 18), 30);
    const updated = saveSmartHomeState(aptCode, { acTemp: nextTemp, acPower: true });
    setSmartState(updated);
    showToast(`🌡️ Nhiệt độ điều hòa: ${nextTemp}°C`);
  };

  // Toggle Rèm
  const handleToggleCurtains = () => {
    const nextCurtains = !curtainsOpen;
    const updated = saveSmartHomeState(aptCode, { curtainsOpen: nextCurtains });
    setSmartState(updated);
    showToast(`🪟 Rèm cửa tự động: ${nextCurtains ? 'ĐANG MỞ ĐÓN SÁNG' : 'ĐANG ĐÓNG KÍN'}`);
  };

  // Toggle Khóa Cửa
  const handleToggleDoor = () => {
    const nextLocked = !masterDoorLocked;
    const updated = saveSmartHomeState(aptCode, { doorLocked: nextLocked });
    setSmartState(updated);

    addDoorAccessLog(aptCode, {
      userName: currentUser.full_name || (isOwner ? 'Trần Hữu Lực' : 'Cư Dân'),
      role: isOwner ? 'Chủ Hộ (Master)' : 'Người Nhà',
      method: 'REMOTE_APP',
      status: 'SUCCESS',
      detail: nextLocked 
        ? 'Chủ hộ bấm khóa chốt an toàn qua App Cư Dân' 
        : 'Chủ hộ bấm mở chốt từ xa qua App Cư Dân'
    });

    showToast(nextLocked ? '🔒 Cửa chính: ĐÃ KHÓA CHỐT AN TOÀN' : '🔓 Cửa chính: ĐÃ MỞ CHỐT TỪ XA');
  };

  // Tạo mã PIN khách 1-chạm (OTP)
  const handleQuickCreatePin = (durationMinutes: number, label: string) => {
    const { state: updated, newPin } = createGuestPin(
      aptCode, 
      label, 
      durationMinutes,
      currentUser.full_name || (isOwner ? 'Chủ Hộ' : 'Cư Dân'),
      isOwner ? 'Chủ Hộ (Master)' : 'Người Nhà'
    );
    setSmartState(updated);
    showToast(`🔢 Đã tạo mã OTP: [${newPin.pin}] (Hạn dùng ${durationMinutes} phút cho ${label})`);
  };

  // Sao chép mã PIN
  const handleCopyPin = (pin: string, id: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(pin.replace(/\s+/g, ''));
    }
    setCopiedPinId(id);
    showToast(`📋 Đã sao chép mã PIN [${pin}] vào bộ nhớ tạm.`);
    setTimeout(() => setCopiedPinId(null), 2500);
  };

  // Thu hồi mã PIN
  const handleRevokePin = (pinId: string) => {
    const updated = revokeGuestPin(
      aptCode, 
      pinId,
      currentUser.full_name || (isOwner ? 'Chủ Hộ' : 'Cư Dân'),
      isOwner ? 'Chủ Hộ (Master)' : 'Người Nhà'
    );
    setSmartState(updated);
    showToast('🗑️ Đã hủy mã PIN khách thành công.');
  };

  // Quẹt thẻ NFC vật lý
  const handleSimulateTapCard = (card: CardState) => {
    if (tappingCardUid) return;
    setTappingCardUid(card.cardUid);

    setTimeout(() => {
      setTappingCardUid(null);
      if (card.status === 'LOCKED') {
        addDoorAccessLog(aptCode, {
          userName: card.holderName,
          role: card.role,
          method: 'NFC_CARD',
          status: 'DENIED',
          detail: `Từ chối mở cửa: Thẻ NFC (${card.cardUid}) đang bị TẠM KHÓA an toàn`
        });
        showToast(`❌ TỪ CHỐI: Thẻ NFC (${card.cardUid}) đang bị TẠM KHÓA!`);
        return;
      }

      const updated = saveSmartHomeState(aptCode, { doorLocked: false });
      setSmartState(updated);
      setResidentCards(markCardUsed(aptCode, card.cardUid));

      addDoorAccessLog(aptCode, {
        userName: card.holderName,
        role: card.role,
        method: 'NFC_CARD',
        status: 'SUCCESS',
        detail: `Quẹt thẻ NFC Mifare EV3 (${card.cardUid}) tại đầu đọc khóa • Đã mở chốt`
      });

      showToast(`💳 [BÍP] Thẻ NFC hợp lệ: ${card.holderName} (${card.cardUid})! Đã mở cửa.`);
    }, 550);
  };

  // Toggle Khóa / Mở thẻ NFC
  const handleToggleCardLock = (cardUid: string, holderName: string) => {
    const updated = toggleCardStatus(aptCode, cardUid);
    setResidentCards(updated);
    const target = updated.find(c => c.cardUid === cardUid);
    showToast(target?.status === 'LOCKED' 
      ? `🔒 Đã TẠM KHÓA thẻ NFC (${holderName})!` 
      : `🔓 Đã KÍCH HOẠT lại thẻ NFC (${holderName}).`);
  };

  // Bật/tắt Intercom đàm thoại
  const handleToggleIntercom = () => {
    setIsIntercomActive(prev => {
      const next = !prev;
      showToast(next ? '🎙️ Đã bật đàm thoại 2 chiều với chuông cửa.' : '🔇 Đã ngắt đàm thoại intercom.');
      return next;
    });
  };

  // Chụp ảnh snapshot
  const handleSnapshot = () => {
    setSnapshotCount(prev => prev + 1);
    showToast(`📸 Đã lưu ảnh khách viếng thăm #${snapshotCount + 1} vào bộ nhớ an toàn.`);
  };

  // Toggle Quy tắc tự động hóa
  const handleToggleRule = (ruleId: string) => {
    const nextRules = toggleAutomationRule(aptCode, ruleId);
    setAutomationRules(nextRules);
    const target = nextRules.find(r => r.id === ruleId);
    showToast(target?.enabled 
      ? `✓ Đã kích hoạt: "${target.title}"` 
      : `⏸️ Đã tạm dừng: "${target?.title}"`);
  };

  // Lọc log ra vào
  const filteredLogs = doorAccessLogs.filter(log => {
    if (activeLogFilter === 'ALL') return true;
    return log.method === activeLogFilter;
  });

  return (
    <div className="space-y-5 w-full animate-fadeIn select-none">
      {/* 1. APP HEADER: Thanh trạng thái căn hộ thông minh */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-[#161F2C] via-[#121820] to-[#0D1117] border border-[#C5A880]/70 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-bold flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-[#C5A880]" /> Nhà Thông Minh • App Cư Dân
          </div>
          <h2 className="font-serif text-xl sm:text-2xl text-white font-bold mt-1 tracking-wide">
            Căn Hộ {aptCode} • Chung Cư BS-07
          </h2>
          <p className="text-xs text-gray-300 mt-1 flex flex-wrap items-center gap-2 font-mono">
            <span>Tầng 30</span>
            <span className="text-gray-500">•</span>
            <span>{aptArea} m² ({aptType})</span>
            <span className="text-gray-500">•</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Trực Tuyến 24/7
            </span>
          </p>
        </div>

        {/* 4 Chỉ số nhanh (App Status Chips) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="px-3 py-2 bg-[#0D1117] border border-[#222B35] flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-[#C5A880] shrink-0" />
            <div>
              <div className="text-[9px] uppercase text-gray-400">Nhiệt Độ</div>
              <div className="text-xs font-mono font-bold text-white">{acTemp}.5 °C</div>
            </div>
          </div>

          <div className="px-3 py-2 bg-[#0D1117] border border-[#222B35] flex items-center gap-2">
            <Wind className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <div className="text-[9px] uppercase text-gray-400">Chất Lượng AQI</div>
              <div className="text-xs font-mono font-bold text-emerald-400">18 (Tốt)</div>
            </div>
          </div>

          <div className="px-3 py-2 bg-[#0D1117] border border-[#222B35] flex items-center gap-2">
            <Lock className={`w-4 h-4 shrink-0 ${masterDoorLocked ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}`} />
            <div>
              <div className="text-[9px] uppercase text-gray-400">Khóa Cửa</div>
              <div className={`text-xs font-mono font-bold ${masterDoorLocked ? 'text-emerald-400' : 'text-amber-400'}`}>
                {masterDoorLocked ? 'An Toàn' : 'Đang Mở'}
              </div>
            </div>
          </div>

          <div className="px-3 py-2 bg-[#0D1117] border border-[#222B35] flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#C5A880] shrink-0" />
            <div>
              <div className="text-[9px] uppercase text-gray-400">Điện Năng</div>
              <div className="text-xs font-mono font-bold text-[#C5A880]">1.38 kW/h</div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="p-3 bg-[#121E2A] border border-[#C5A880] text-[#C5A880] text-xs font-medium flex items-center gap-2 animate-fadeIn shadow-lg">
          <Sparkles className="w-4 h-4 text-[#C5A880] flex-shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 2. QUICK SCENES BAR: 4 Ngữ Cảnh 1-Chạm Chuẩn App (Thống nhất Button Style) */}
      <div className="p-3.5 bg-[#121820] border border-[#222B35] shadow-lg">
        <div className="text-[10px] uppercase tracking-wider text-gray-400 font-mono mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[#C5A880] font-bold">
            <Sparkles className="w-3.5 h-3.5" /> Ngữ Cảnh 1-Chạm
          </span>
          <span>Chạm để kích hoạt tức thì</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Về Nhà */}
          <button
            type="button"
            onClick={() => handleTriggerScene('WELCOME')}
            className={`p-3 border text-left transition-all flex items-center gap-2.5 active:scale-[0.98] ${
              activeScene === 'WELCOME'
                ? 'bg-[#1C2533] border-[#C5A880] text-white ring-1 ring-[#C5A880] shadow-md'
                : 'bg-[#0D1117] hover:bg-[#161D26] border-[#222B35] hover:border-[#C5A880]/50 text-gray-300'
            }`}
          >
            <Sun className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="truncate">
              <div className="text-xs font-bold text-white">Về Nhà</div>
              <div className="text-[10px] text-gray-400 truncate">Đèn bật, AC 24°C, mở rèm</div>
            </div>
          </button>

          {/* Đi Ngủ */}
          <button
            type="button"
            onClick={() => handleTriggerScene('SLEEP')}
            className={`p-3 border text-left transition-all flex items-center gap-2.5 active:scale-[0.98] ${
              activeScene === 'SLEEP'
                ? 'bg-[#1C2533] border-[#C5A880] text-white ring-1 ring-[#C5A880] shadow-md'
                : 'bg-[#0D1117] hover:bg-[#161D26] border-[#222B35] hover:border-[#C5A880]/50 text-gray-300'
            }`}
          >
            <Moon className="w-4 h-4 text-indigo-400 shrink-0" />
            <div className="truncate">
              <div className="text-xs font-bold text-white">Đi Ngủ</div>
              <div className="text-[10px] text-gray-400 truncate">AC 26°C, rèm đóng, khóa an toàn</div>
            </div>
          </button>

          {/* Đi Vắng */}
          <button
            type="button"
            onClick={() => handleTriggerScene('AWAY')}
            className={`p-3 border text-left transition-all flex items-center gap-2.5 active:scale-[0.98] ${
              activeScene === 'AWAY'
                ? 'bg-[#1C2533] border-[#C5A880] text-white ring-1 ring-[#C5A880] shadow-md'
                : 'bg-[#0D1117] hover:bg-[#161D26] border-[#222B35] hover:border-[#C5A880]/50 text-gray-300'
            }`}
          >
            <Power className="w-4 h-4 text-red-400 shrink-0" />
            <div className="truncate">
              <div className="text-xs font-bold text-white">Đi Vắng</div>
              <div className="text-[10px] text-gray-400 truncate">Ngắt điện, khóa cửa 2 lớp</div>
            </div>
          </button>

          {/* Xem Phim */}
          <button
            type="button"
            onClick={() => handleTriggerScene('CINEMA')}
            className={`p-3 border text-left transition-all flex items-center gap-2.5 active:scale-[0.98] ${
              activeScene === 'CINEMA'
                ? 'bg-[#1C2533] border-[#C5A880] text-white ring-1 ring-[#C5A880] shadow-md'
                : 'bg-[#0D1117] hover:bg-[#161D26] border-[#222B35] hover:border-[#C5A880]/50 text-gray-300'
            }`}
          >
            <Tv className="w-4 h-4 text-purple-400 shrink-0" />
            <div className="truncate">
              <div className="text-xs font-bold text-white">Xem Phim</div>
              <div className="text-[10px] text-gray-400 truncate">Đèn vàng dịu, rèm đóng kín</div>
            </div>
          </button>
        </div>
      </div>

      {/* 3. APP SEGMENTED TABS: 3 Luồng Điều Khiển Rõ Ràng (Thống nhất Button Style) */}
      <div className="flex items-center gap-1.5 border-b border-[#2A374A] pb-1 overflow-x-auto no-scrollbar whitespace-nowrap">
        <button
          type="button"
          onClick={() => setActiveTab('DEVICES')}
          className={`h-10 px-3.5 sm:px-4 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 shrink-0 active:scale-95 ${
            activeTab === 'DEVICES'
              ? 'border-[#C5A880] text-[#C5A880] bg-[#161D26]'
              : 'border-transparent text-gray-400 hover:text-white hover:bg-[#121820]'
          }`}
        >
          <Cpu className="w-4 h-4 text-[#C5A880]" />
          <span>Thiết Bị & Phòng</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('DOOR_ACCESS')}
          className={`h-10 px-3.5 sm:px-4 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 shrink-0 active:scale-95 ${
            activeTab === 'DOOR_ACCESS'
              ? 'border-[#C5A880] text-[#C5A880] bg-[#161D26]'
              : 'border-transparent text-gray-400 hover:text-white hover:bg-[#121820]'
          }`}
        >
          <DoorClosed className="w-4 h-4 text-cyan-400" />
          <span>Cửa & Chuông Hình</span>
          {!masterDoorLocked && <span className="w-2 h-2 rounded-none bg-amber-400 animate-ping ml-1" />}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('AUTOMATION')}
          className={`h-10 px-3.5 sm:px-4 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 shrink-0 active:scale-95 ${
            activeTab === 'AUTOMATION'
              ? 'border-[#C5A880] text-[#C5A880] bg-[#161D26]'
              : 'border-transparent text-gray-400 hover:text-white hover:bg-[#121820]'
          }`}
        >
          <Clock className="w-4 h-4 text-emerald-400" />
          <span>Tự Động Hóa & An Toàn</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 bg-emerald-950 text-emerald-300">
            {automationRules.filter(r => r.enabled).length}/{automationRules.length}
          </span>
        </button>
      </div>

      {/* ============================================================= */}
      {/* TAB 1: THIẾT BỊ THEO PHÒNG (DEVICES & ROOMS)                 */}
      {/* ============================================================= */}
      {activeTab === 'DEVICES' && (
        <div className="space-y-4">
          {/* Nút Toggle Bật/Tắt Chế Độ 3D Xoay Lật (Thống nhất Button Style) */}
          <div className="flex items-center justify-between p-3 bg-[#121820] border border-[#222B35]">
            <div className="text-xs text-gray-300 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#C5A880]" />
              <span>Chế độ hiển thị không gian căn hộ:</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIs3dMode(false)}
                className={`h-8 px-3.5 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 ${
                  !is3dMode 
                    ? 'bg-[#C5A880] text-[#0D1117] shadow-sm' 
                    : 'bg-[#161D26] hover:bg-[#1C2533] border border-[#2D3A4B] text-gray-300 hover:text-white'
                }`}
              >
                Bảng Thẻ Nhanh
              </button>
              <button
                type="button"
                onClick={() => setIs3dMode(true)}
                className={`h-8 px-3.5 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 ${
                  is3dMode 
                    ? 'bg-[#C5A880] text-[#0D1117] shadow-sm' 
                    : 'bg-[#161D26] hover:bg-[#1C2533] border border-[#2D3A4B] text-gray-300 hover:text-white'
                }`}
              >
                <Maximize2 className="w-3.5 h-3.5" /> Mô Hình 3D Xoay Lật
              </button>
            </div>
          </div>

          {/* Khi Bật Chế Độ 3D */}
          {is3dMode && (
            <div className="animate-fadeIn space-y-2">
              <ApartmentModel3DViewer
                apartmentCode={aptCode}
                apartmentType={aptType}
                clearArea={aptArea}
                lights={lights}
                acPower={acPower}
                acTemp={acTemp}
                curtainsOpen={curtainsOpen}
                doorLocked={masterDoorLocked}
                doorAjar={doorAjar}
                waterLeakActive={waterLeakSensorActive}
                onToggleLight={handleToggleLight}
                onToggleDoor={handleToggleDoor}
                onToggleDoorAjar={() => {}}
                onToggleCurtains={handleToggleCurtains}
                onToggleAC={handleToggleAC}
                onChangeTemp={handleChangeTemp}
                interactive={true}
              />
            </div>
          )}

          {/* Bảng Điều Khiển Nhanh Từng Phòng (Cards với LuxurySwitch thống nhất) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. PHÒNG KHÁCH */}
            <div className="p-4 bg-[#121820] border border-[#222B35] space-y-3.5">
              <div className="flex items-center justify-between border-b border-[#1C2533] pb-2">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Sun className="w-4 h-4 text-amber-400" /> Phòng Khách & Ban Công
                </h3>
                <span className="text-[10px] font-mono text-[#C5A880]">Khu Vực Chính</span>
              </div>

              {/* Đèn Phòng Khách */}
              <div className="flex items-center justify-between p-3 bg-[#0D1117] border border-[#1C2533]">
                <div>
                  <div className="text-xs font-bold text-white">Đèn Chùm Thông Minh</div>
                  <div className="text-[10px] text-gray-400 font-mono">Dimmable 0 - 100%</div>
                </div>
                <LuxurySwitch
                  checked={lights.livingRoom}
                  onChange={() => handleToggleLight('livingRoom')}
                  ariaLabel="Bật tắt đèn phòng khách"
                />
              </div>

              {/* Điều Hòa Daikin VRV */}
              <div className="p-3 bg-[#0D1117] border border-[#1C2533] space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white">Điều Hòa Daikin VRV-S Multi</div>
                    <div className="text-[10px] text-sky-400 font-mono">Công nghệ lọc Ion Streamer 99%</div>
                  </div>
                  <LuxurySwitch
                    checked={acPower}
                    onChange={handleToggleAC}
                    activeColor="bg-sky-500"
                    ariaLabel="Bật tắt điều hòa Daikin"
                  />
                </div>

                {acPower && (
                  <div className="pt-2 flex items-center justify-between border-t border-[#1C2533]">
                    <span className="text-xs text-gray-400">Nhiệt độ cài đặt:</span>
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleChangeTemp(-1)}
                        className="w-8 h-8 bg-[#161D26] hover:bg-[#C5A880] hover:text-[#0D1117] border border-[#2D3A4B] text-gray-200 font-bold text-sm transition-all flex items-center justify-center active:scale-95 shadow-sm"
                        title="Giảm nhiệt độ"
                      >
                        -
                      </button>
                      <span className="font-mono text-base font-bold text-sky-400 min-w-[50px] text-center">{acTemp}°C</span>
                      <button
                        type="button"
                        onClick={() => handleChangeTemp(1)}
                        className="w-8 h-8 bg-[#161D26] hover:bg-[#C5A880] hover:text-[#0D1117] border border-[#2D3A4B] text-gray-200 font-bold text-sm transition-all flex items-center justify-center active:scale-95 shadow-sm"
                        title="Tăng nhiệt độ"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Rèm Cửa Tự Động */}
              <div className="flex items-center justify-between p-3 bg-[#0D1117] border border-[#1C2533]">
                <div>
                  <div className="text-xs font-bold text-white">Rèm Cửa Kính Panorama</div>
                  <div className="text-[10px] text-gray-400 font-mono">
                    {curtainsOpen ? 'Đang Mở 100%' : 'Đang Đóng Kín'}
                  </div>
                </div>
                <LuxurySwitch
                  checked={curtainsOpen}
                  onChange={handleToggleCurtains}
                  activeColor="bg-amber-500"
                  ariaLabel="Đóng mở rèm cửa kính panorama"
                />
              </div>
            </div>

            {/* 2. PHÒNG NGỦ MASTER */}
            <div className="p-4 bg-[#121820] border border-[#222B35] space-y-3.5">
              <div className="flex items-center justify-between border-b border-[#1C2533] pb-2">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Moon className="w-4 h-4 text-indigo-400" /> Phòng Ngủ Master
                </h3>
                <span className="text-[10px] font-mono text-indigo-400">Không Gian Nghỉ Ngơi</span>
              </div>

              {/* Đèn Phòng Ngủ */}
              <div className="flex items-center justify-between p-3 bg-[#0D1117] border border-[#1C2533]">
                <div>
                  <div className="text-xs font-bold text-white">Đèn Ngủ Ấm Áp</div>
                  <div className="text-[10px] text-gray-400 font-mono">Ánh sáng vàng 2700K dịu mắt</div>
                </div>
                <LuxurySwitch
                  checked={lights.bedroomMaster}
                  onChange={() => handleToggleLight('bedroomMaster')}
                  ariaLabel="Bật tắt đèn phòng ngủ"
                />
              </div>

              {/* Gian Bếp */}
              <div className="flex items-center justify-between p-3 bg-[#0D1117] border border-[#1C2533]">
                <div>
                  <div className="text-xs font-bold text-white">Đèn Gian Bếp & Bàn Ăn</div>
                  <div className="text-[10px] text-gray-400 font-mono">Bếp Hafele cảm ứng an toàn</div>
                </div>
                <LuxurySwitch
                  checked={lights.kitchen}
                  onChange={() => handleToggleLight('kitchen')}
                  ariaLabel="Bật tắt đèn gian bếp"
                />
              </div>

              {/* Ban Công */}
              <div className="flex items-center justify-between p-3 bg-[#0D1117] border border-[#1C2533]">
                <div>
                  <div className="text-xs font-bold text-white">Đèn Ban Công Sinh Thái</div>
                  <div className="text-[10px] text-gray-400 font-mono">View công viên The Tropical</div>
                </div>
                <LuxurySwitch
                  checked={lights.balcony}
                  onChange={() => handleToggleLight('balcony')}
                  ariaLabel="Bật tắt đèn ban công"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 2: CỬA & CHUÔNG HÌNH THÔNG MINH (DOOR & ACCESS)           */}
      {/* ============================================================= */}
      {activeTab === 'DOOR_ACCESS' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Cột Trái (7 Cột): Chuông Hình Live & Nút Mở Khóa */}
            <div className="lg:col-span-7 space-y-4">
              {/* Màn hình Chuông Hình Video AI */}
              <div className="bg-[#0D1117] border border-[#222B35] p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <Video className="w-4 h-4 text-[#C5A880]" />
                    <span>Chuông Hình Camera Ngoài Cửa</span>
                    <span className="w-2 h-2 rounded-none bg-red-500 animate-ping" />
                  </div>
                  <span className="text-[10px] font-mono text-gray-400">{cameraTime}</span>
                </div>

                {/* Viewport Camera Góc Rộng Giả Lập */}
                <div className="relative aspect-video bg-gradient-to-br from-[#121A24] via-[#0E151E] to-[#0A0E14] border border-[#2A374A] flex flex-col items-center justify-center overflow-hidden">
                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-black/70 text-[9px] font-mono text-emerald-400 border border-emerald-500/40">
                    LIVE • SẢNH TẦNG 30 CHUNG CƯ BS-07
                  </div>

                  {isMotionAlertActive && (
                    <div className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-red-950/80 text-[9px] font-mono text-red-300 border border-red-500 animate-pulse">
                      PHÁT HIỆN CHUYỂN ĐỘNG
                    </div>
                  )}

                  {/* Minh họa người ngoài cửa */}
                  <div className="flex flex-col items-center gap-1.5 opacity-80">
                    <div className="w-16 h-16 rounded-none border-2 border-[#C5A880]/60 flex items-center justify-center bg-[#16202C]">
                      <Video className="w-7 h-7 text-[#C5A880]" />
                    </div>
                    <span className="text-[11px] font-mono text-gray-300">
                      {isIntercomActive ? '🎙️ Đang đàm thoại 2 chiều...' : 'Khu vực cửa chính an toàn'}
                    </span>
                  </div>

                  {/* Nút Thao Tác Chuông Hình (Thống nhất Button Style) */}
                  <div className="absolute bottom-2.5 inset-x-2.5 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={handleToggleIntercom}
                      className={`h-8 px-3.5 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 ${
                        isIntercomActive 
                          ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse' 
                          : 'bg-[#161D26] hover:bg-[#C5A880] hover:text-[#0D1117] border border-[#2D3A4B] text-gray-200'
                      }`}
                    >
                      {isIntercomActive ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                      <span>{isIntercomActive ? 'Ngắt Mic' : 'Đàm Thoại'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSnapshot}
                      className="h-8 px-3.5 bg-[#161D26] hover:bg-[#C5A880] hover:text-[#0D1117] border border-[#2D3A4B] text-gray-200 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                    >
                      <Camera className="w-3.5 h-3.5 text-[#C5A880]" />
                      <span>Chụp Ảnh ({snapshotCount})</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Nút Lớn Điều Khiển Chốt Khóa 1-Chạm (Thống nhất CTA Button Style) */}
              <div className="p-4 bg-[#121820] border border-[#222B35] flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <DoorClosed className="w-4 h-4 text-[#C5A880]" />
                    <span>Khóa Thông Minh Skyline FaceID v4.2</span>
                  </div>
                  <div className="text-[11px] text-gray-400 font-mono">
                    Pin khóa: <span className="text-emerald-400 font-bold">{doorBatteryLevel}%</span> • Tín hiệu: Sóng mạnh
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleToggleDoor}
                  className={`h-10 px-4 sm:px-5 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md active:scale-95 border shrink-0 w-full sm:w-auto ${
                    masterDoorLocked
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400/40'
                      : 'bg-amber-600 hover:bg-amber-500 text-white border-amber-400/40 animate-pulse'
                  }`}
                >
                  {masterDoorLocked ? <Lock className="w-4 h-4" /> : <DoorOpen className="w-4 h-4" />}
                  <span>{masterDoorLocked ? 'Đang Khóa • Chạm Để Mở' : 'Đang Mở • Chạm Để Khóa'}</span>
                </button>
              </div>
            </div>

            {/* Cột Phải (5 Cột): Mã PIN Khách Tức Thì (OTP) & Thẻ NFC */}
            <div className="lg:col-span-5 space-y-4">
              {/* Cấp mã PIN Khách 1-Chạm */}
              <div className="p-4 bg-[#121820] border border-[#222B35] space-y-3">
                <div className="flex items-center justify-between border-b border-[#1C2533] pb-2">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-white flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-cyan-400" /> Cấp Mã Khách / Shipper (OTP)
                  </h3>
                  <span className="text-[9px] font-mono text-emerald-400">1-Chạm Tự Hủy</span>
                </div>

                {/* 3 Nút Chọn Nhanh Thời Lượng (Thống nhất Button Style) */}
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickCreatePin(15, 'Giao Hàng Shipper')}
                    className="p-2 sm:p-2.5 bg-[#0D1117] hover:bg-[#161D26] hover:border-[#C5A880] border border-[#222B35] text-left transition-all active:scale-[0.98]"
                  >
                    <div className="text-[11px] sm:text-xs font-bold text-white">15 Phút</div>
                    <div className="text-[8.5px] sm:text-[9px] text-[#C5A880] truncate">Shipper</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickCreatePin(60, 'Bạn Bè Viếng Thăm')}
                    className="p-2 sm:p-2.5 bg-[#0D1117] hover:bg-[#161D26] hover:border-[#C5A880] border border-[#222B35] text-left transition-all active:scale-[0.98]"
                  >
                    <div className="text-[11px] sm:text-xs font-bold text-white">1 Giờ</div>
                    <div className="text-[8.5px] sm:text-[9px] text-cyan-400 truncate">Bạn bè</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickCreatePin(1440, 'Khách Ở Lại Qua Đêm')}
                    className="p-2 sm:p-2.5 bg-[#0D1117] hover:bg-[#161D26] hover:border-[#C5A880] border border-[#222B35] text-left transition-all active:scale-[0.98]"
                  >
                    <div className="text-[11px] sm:text-xs font-bold text-white">24 Giờ</div>
                    <div className="text-[8.5px] sm:text-[9px] text-indigo-400 truncate">Qua đêm</div>
                  </button>
                </div>

                {/* Danh sách mã PIN đang có hiệu lực */}
                <div className="space-y-2 pt-1">
                  <div className="text-[10px] text-gray-400 font-mono">Mã PIN đang hoạt động ({guestPins.length}):</div>
                  {guestPins.length === 0 ? (
                    <div className="p-3 text-center bg-[#0D1117] text-[11px] text-gray-500 font-mono border border-[#1C2533]">
                      Chưa có mã PIN tạm thời nào. Bấm nút trên để tạo nhanh.
                    </div>
                  ) : (
                    guestPins.map(pin => (
                      <div key={pin.id} className="p-2.5 bg-[#0D1117] border border-[#2A374A] flex items-center justify-between">
                        <div>
                          <div className="text-xs font-mono font-bold text-white flex items-center gap-2">
                            <span className="text-amber-300 tracking-widest">{pin.pin}</span>
                            <span className="text-[10px] font-sans text-gray-400">({pin.label})</span>
                          </div>
                          <div className="text-[9px] text-emerald-400 font-mono">
                            Hết hạn: {new Date(pin.expiresAt).toLocaleTimeString('vi-VN', { hour12: false })}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCopyPin(pin.pin, pin.id)}
                            className="w-7 h-7 bg-[#161D26] hover:bg-[#C5A880] hover:text-[#0D1117] border border-[#2D3A4B] text-gray-300 transition-all flex items-center justify-center active:scale-95 shadow-sm"
                            title="Sao chép mã gửi khách"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRevokePin(pin.id)}
                            className="w-7 h-7 bg-[#161D26] hover:bg-red-950 hover:border-red-500 hover:text-red-300 border border-[#2D3A4B] text-gray-400 transition-all flex items-center justify-center active:scale-95 shadow-sm"
                            title="Hủy mã ngay"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Thẻ Cư Dân NFC Gia Đình (Thống nhất Button Style) */}
              <div className="p-4 bg-[#121820] border border-[#222B35] space-y-2.5">
                <div className="flex items-center justify-between border-b border-[#1C2533] pb-2">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-white flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-400" /> Thẻ Cư Dân NFC Mifare EV3
                  </h3>
                  <span className="text-[10px] font-mono text-gray-400">{residentCards.length} Thẻ</span>
                </div>

                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {residentCards.map(card => (
                    <div key={card.cardUid} className="p-2 bg-[#0D1117] border border-[#1C2533] flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span>{card.holderName}</span>
                          <span className="text-[9px] font-mono text-gray-400">({card.role})</span>
                        </div>
                        <div className="text-[10px] text-gray-500 font-mono">{card.cardUid}</div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSimulateTapCard(card)}
                          className="h-7 px-2.5 bg-[#161D26] hover:bg-[#C5A880] hover:text-[#0D1117] border border-[#2D3A4B] text-[#C5A880] font-mono text-[11px] font-semibold transition-all flex items-center justify-center active:scale-95"
                        >
                          Quẹt Thử
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleCardLock(card.cardUid, card.holderName)}
                          className={`h-7 px-2.5 font-mono text-[11px] transition-all flex items-center justify-center active:scale-95 border ${
                            card.status === 'LOCKED' 
                              ? 'bg-red-950/80 border-red-500 text-red-200' 
                              : 'bg-[#161D26] hover:bg-red-950 hover:border-red-500 hover:text-red-300 border-[#2D3A4B] text-gray-300'
                          }`}
                        >
                          {card.status === 'LOCKED' ? 'Bị Khóa' : 'Tạm Khóa'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Lịch Sử Ra Vào (Door Access Log Feed) */}
          <div className="p-4 bg-[#121820] border border-[#222B35] space-y-3">
            <div className="flex items-center justify-between border-b border-[#1C2533] pb-2">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#C5A880]" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-white">
                  Nhật Ký Mở Cửa Căn Hộ Gần Đây
                </h3>
              </div>

              {/* Lọc phương thức (Thống nhất Segmented Pill Style) */}
              <div className="flex items-center gap-1">
                {(['ALL', 'FACE_ID', 'NFC_CARD', 'PIN_OTP'] as const).map(flt => (
                  <button
                    key={flt}
                    type="button"
                    onClick={() => setActiveLogFilter(flt)}
                    className={`h-6 px-2.5 text-[10px] font-mono transition-all flex items-center justify-center ${
                      activeLogFilter === flt 
                        ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow-sm' 
                        : 'bg-[#0D1117] hover:bg-[#1C2533] border border-[#222B35] text-gray-400 hover:text-white'
                    }`}
                  >
                    {flt}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {filteredLogs.slice(0, 8).map(log => (
                <div key={log.id} className="p-2 bg-[#0D1117] border border-[#1C2533] flex items-center justify-between text-xs">
                  <div className="space-y-0.5 truncate pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white truncate">{log.userName}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 bg-[#1C2533] text-gray-300">
                        {log.method}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-400 truncate">{log.detail}</div>
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono whitespace-nowrap">
                    {log.timestamp}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 3: TỰ ĐỘNG HÓA & AN TOÀN (AUTOMATIONS & SAFETY)          */}
      {/* ============================================================= */}
      {activeTab === 'AUTOMATION' && (
        <div className="space-y-4">
          {/* Danh Sách Kịch Bản Tự Động Hóa 24/7 (Sử dụng LuxurySwitch thống nhất) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {automationRules.map(rule => (
              <div 
                key={rule.id}
                className={`p-3.5 border transition-all flex flex-col justify-between gap-2.5 ${
                  rule.enabled ? 'bg-[#121820] border-[#2A374A]' : 'bg-[#0E131A] border-[#1C2533] opacity-60'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{rule.title}</span>
                    <LuxurySwitch
                      checked={rule.enabled}
                      onChange={() => handleToggleRule(rule.id)}
                      activeColor="bg-emerald-600"
                      ariaLabel={`Bật tắt kịch bản ${rule.title}`}
                    />
                  </div>
                  <div className="text-[10px] text-[#C5A880] font-mono">{rule.triggerLabel}</div>
                  <p className="text-[11px] text-gray-400 line-clamp-2">{rule.description}</p>
                </div>

                <div className="pt-2 border-t border-[#1C2533] flex items-center justify-between text-[10px] font-mono text-gray-400">
                  <span className="truncate max-w-[170px]">{rule.actionSummary}</span>
                  <span className={rule.enabled ? 'text-emerald-400 font-bold' : 'text-gray-500'}>
                    {rule.enabled ? 'BẬT' : 'TẮT'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Cảm Biến An Toàn & Ngắt Van Nước Tự Động */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-[#121820] border border-[#222B35] space-y-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 text-sky-400">
                <Droplets className="w-4 h-4 text-sky-400" />
                Cảm Biến Tràn Nước & Van Điện Từ
              </h4>
              <p className="text-xs text-gray-300 font-light leading-relaxed">
                Được lắp đặt tại sàn bếp và phòng tắm căn hộ CH-06. Khi phát hiện rò rỉ nước, hệ thống tự động phát còi báo và đóng van cấp nước tổng hành lang trong 3 giây.
              </p>
              <div className="pt-2 flex items-center justify-between text-xs font-mono">
                <span className="text-emerald-400 font-bold">✓ Van Nước: Đang Mở Bình Thường</span>
                <span className="text-gray-500">Cảm biến AI 24/7</span>
              </div>
            </div>

            <div className="p-4 bg-[#121820] border border-[#222B35] space-y-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 text-amber-400">
                <Flame className="w-4 h-4 text-amber-400" />
                Đầu Báo Khói & Báo Cháy PCCC
              </h4>
              <p className="text-xs text-gray-300 font-light leading-relaxed">
                Kết nối trực tiếp với Trung tâm Điều hành An Ninh PCCC chung cư The Tropical. Khi có báo động, còi báo tầng 30 sẽ kích hoạt và chỉ dẫn cư dân ra thang bộ thoát hiểm.
              </p>
              <div className="pt-2 flex items-center justify-between text-xs font-mono">
                <span className="text-emerald-400 font-bold">✓ PCCC: Kết Nối BQL Chuẩn 100%</span>
                <span className="text-gray-500">Thang bộ tầng 30</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
