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
  Activity, 
  CheckCircle2, 
  AlertTriangle,
  Sliders,
  Users,
  EyeOff,
  Box,
  Calendar,
  Clock,
  Check,
  ToggleLeft,
  ToggleRight,
  Video,
  Mic,
  MicOff,
  Bell,
  DoorClosed,
  DoorOpen,
  Copy,
  Trash2,
  ShieldAlert,
  RefreshCw,
  UserCheck,
  ScanFace,
  Scan,
  Radio,
  Camera,
  PhoneCall,
  PhoneOff,
  Battery,
  BatteryCharging,
  Wifi,
  History,
  KeyRound,
  Shield,
  Volume2,
  Plus,
  Play,
  CreditCard,
  LayoutGrid,
  ArrowRight
} from 'lucide-react';
import { User, UserRole } from '@/lib/dataStore';
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

interface SmartHomeHubProps {
  currentUser: User;
}

export default function SmartHomeHub({ currentUser }: SmartHomeHubProps) {
  const isOwner = currentUser.role === 'OWNER';
  const aptCode = currentUser.apartment_code || '12A05';
  const aptFloor = aptCode.replace(/[^0-9]/g, '').slice(0, 2) || '12';
  const aptUnit = getApartmentByCode(aptCode);
  const aptArea = aptUnit ? aptUnit.area : 78.5;
  const aptType = aptUnit ? aptUnit.typeLabel : '2PN - 2WC';

  // Smart Home State từ Storage Store
  const [smartState, setSmartState] = useState<SmartHomeState>(() => getSmartHomeState(aptCode));
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>(() => getAutomationRules(aptCode));
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Dữ liệu thực tế: Hồ sơ FaceID của cư dân hiện tại & Thẻ Cư Dân thành viên gia đình
  const [faceProfile, setFaceProfile] = useState<EnrolledFaceProfile | null>(null);
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);

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

    window.addEventListener('skyline_face_enrolled', loadRealData);
    window.addEventListener('skyline_ekyc_updated', loadRealData);
    return () => {
      window.removeEventListener('skyline_face_enrolled', loadRealData);
      window.removeEventListener('skyline_ekyc_updated', loadRealData);
    };
  }, [currentUser]);

  const hasFaceEnrolled = !!(faceProfile && faceProfile.samples && Object.keys(faceProfile.samples).length > 0);
  const faceSamplesCount = faceProfile?.samples ? Object.keys(faceProfile.samples).length : 0;
  const isFaceApproved = faceProfile?.status === 'ACTIVE';
  const isFacePending = faceProfile?.status === 'PENDING';

  // Trạng thái tương tác chuyên biệt cho Hệ Thống Cửa Thông Minh (Smart Door)
  const [isIntercomActive, setIsIntercomActive] = useState(false);
  const [isScanningFace, setIsScanningFace] = useState(false);
  const [faceScanProgress, setFaceScanProgress] = useState(0);
  const [faceScanSuccess, setFaceScanSuccess] = useState(false);
  const [activeLogFilter, setActiveLogFilter] = useState<'ALL' | 'FACE_ID' | 'PIN_OTP' | 'NFC_CARD' | 'AUTO_LOCK'>('ALL');
  const [newPinLabel, setNewPinLabel] = useState('');
  const [newPinDuration, setNewPinDuration] = useState<number>(60);
  const [isCreatingPin, setIsCreatingPin] = useState(false);
  const [copiedPinId, setCopiedPinId] = useState<string | null>(null);
  const [cameraTime, setCameraTime] = useState('');
  const [snapshotFlash, setSnapshotFlash] = useState(false);
  const [snapshotCount, setSnapshotCount] = useState(0);
  const [isMotionAlertActive, setIsMotionAlertActive] = useState(false);
  const [smartDoorTab, setSmartDoorTab] = useState<'LIVE_CONTROL' | 'CREDENTIALS' | 'LOGS' | 'ALL'>('LIVE_CONTROL');

  const {
    lights,
    acTemp,
    acPower,
    curtainsOpen,
    doorLocked: masterDoorLocked,
    doorAjar = false,
    doorAutoLock = true,
    doorBatteryLevel = 94,
    doorNightLatch = false,
    doorAntiTamper = true,
    guestPins = [],
    doorAccessLogs = [],
    mainPowerActive,
    waterLeakSensorActive,
    fireSensorActive,
    activeScene
  } = smartState;

  // Cập nhật đồng hồ thời gian thực cho màn hình chuông cửa
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCameraTime(
        now.toLocaleTimeString('vi-VN', { hour12: false }) + `.${Math.floor(now.getMilliseconds() / 100)}`
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 100);
    return () => clearInterval(timer);
  }, []);

  // Cơ chế Tự Động Khóa Chốt An Toàn Sau 5s (Auto-Lock 5s)
  useEffect(() => {
    if (!smartState.doorLocked && smartState.doorAutoLock) {
      const timer = setTimeout(() => {
        const updated = saveSmartHomeState(aptCode, { doorLocked: true });
        setSmartState(updated);
        addDoorAccessLog(aptCode, {
          userName: 'Hệ Thống Khóa Tự Động',
          role: 'Smart Door Auto-Lock',
          method: 'AUTO_LOCK',
          status: 'SUCCESS',
          detail: 'Tự động gài chốt an toàn 3 tầng sau 5 giây mở cửa (Skyline Auto-Secure)'
        });
        showToast('🔒 Cửa Thông Minh đã tự động gài chốt an toàn sau 5 giây.');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [smartState.doorLocked, smartState.doorAutoLock, aptCode]);

  // Lắng nghe sự kiện đồng bộ toàn hệ thống
  useEffect(() => {
    const onUpdateState = (e: any) => {
      if (e.detail) setSmartState(e.detail);
    };
    const onUpdateRules = (e: any) => {
      if (e.detail) setAutomationRules(e.detail);
    };
    window.addEventListener('skyline_smarthome_update', onUpdateState);
    window.addEventListener('skyline_automation_rules_update', onUpdateRules);
    return () => {
      window.removeEventListener('skyline_smarthome_update', onUpdateState);
      window.removeEventListener('skyline_automation_rules_update', onUpdateRules);
    };
  }, [aptCode]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleToggleLight = (room: 'livingRoom' | 'bedroomMaster' | 'kitchen' | 'balcony') => {
    const nextLights = { ...smartState.lights, [room]: !smartState.lights[room] };
    const updated = saveSmartHomeState(aptCode, { lights: nextLights, activeScene: 'NONE' });
    setSmartState(updated);
    const roomName = room === 'livingRoom' ? 'Phòng khách' : room === 'bedroomMaster' ? 'Phòng ngủ Master' : room === 'kitchen' ? 'Bếp' : 'Ban công';
    showToast(`⚡ Đã chuyển trạng thái đèn: ${roomName} (${nextLights[room] ? 'Bật' : 'Tắt'})`);
  };

  const handleToggleDoor = () => {
    const nextLocked = !smartState.doorLocked;
    const updated = saveSmartHomeState(aptCode, { doorLocked: nextLocked });
    setSmartState(updated);
    addDoorAccessLog(aptCode, {
      userName: currentUser.full_name || (isOwner ? 'Lê Văn An' : 'Cư Dân'),
      role: isOwner ? 'Chủ Hộ (Master)' : 'Người Nhà',
      method: 'REMOTE_APP',
      status: 'SUCCESS',
      detail: nextLocked ? 'Khóa chốt an toàn thủ công từ Portal' : 'Mở chốt cửa an toàn thủ công từ Portal'
    });
    showToast(nextLocked ? '🔒 Đã khóa chốt an toàn Cửa Thông Minh.' : '🔓 Đã mở chốt Cửa Thông Minh (Sẽ tự khóa sau 5s nếu bật Auto-Lock).');
  };

  // Đảo trạng thái cánh cửa từ tính (Đang khép kín <-> Mở hé)
  const handleToggleDoorAjar = () => {
    const nextAjar = !smartState.doorAjar;
    const updated = saveSmartHomeState(aptCode, { doorAjar: nextAjar });
    setSmartState(updated);
    if (nextAjar) {
      showToast('⚠️ Cảm biến từ tính: Cánh cửa vật lý đang mở hé! Hệ thống phát chuông nhắc nhở.');
    } else {
      showToast('✓ Cảm biến từ tính: Cánh cửa đã khép kín 100%.');
    }
  };

  // Bật/tắt Auto-Lock
  const handleToggleAutoLock = () => {
    const nextVal = !smartState.doorAutoLock;
    const updated = saveSmartHomeState(aptCode, { doorAutoLock: nextVal });
    setSmartState(updated);
    showToast(nextVal ? '✓ Đã BẬT chế độ tự động khóa chốt sau 5 giây.' : '⚠️ Đã TẮT tự động khóa chốt sau 5s.');
  };

  // Bật/tắt Chốt ban đêm
  const handleToggleNightLatch = () => {
    const nextVal = !smartState.doorNightLatch;
    const updated = saveSmartHomeState(aptCode, { doorNightLatch: nextVal });
    setSmartState(updated);
    showToast(nextVal ? '🌙 Đã kích hoạt chốt riêng tư ban đêm (Night Latch).' : '☀️ Đã mở chốt riêng tư ban đêm.');
  };

  // Bật/tắt Chống cạy phá
  const handleToggleAntiTamper = () => {
    const nextVal = !smartState.doorAntiTamper;
    const updated = saveSmartHomeState(aptCode, { doorAntiTamper: nextVal });
    setSmartState(updated);
    showToast(nextVal ? '🛡️ Cảm biến gia tốc & rung chấn chống cạy phá: ĐANG BẢO VỆ 24/7.' : '⚠️ Đã tạm dừng cảnh báo cạy phá.');
  };

  // Mô phỏng quét FaceID 3D
  const handleSimulateFaceScan = () => {
    if (isScanningFace) return;
    if (!hasFaceEnrolled) {
      showToast(`⚠️ Cư dân ${currentUser.full_name} chưa có mẫu FaceID! Vui lòng vào trang Định Danh & e-KYC để quét 4 mẫu khuôn mặt.`);
      return;
    }
    if (isFacePending) {
      showToast(`⏳ Hồ sơ FaceID (4 mẫu quét) của cư dân ${currentUser.full_name} đang chờ Ban Quản Lý phê duyệt!`);
      return;
    }

    setIsScanningFace(true);
    setFaceScanSuccess(false);
    setFaceScanProgress(20);

    setTimeout(() => setFaceScanProgress(55), 350);
    setTimeout(() => setFaceScanProgress(85), 750);
    setTimeout(() => {
      setFaceScanProgress(100);
      setFaceScanSuccess(true);
      setTimeout(() => {
        setIsScanningFace(false);
        setFaceScanProgress(0);
        setFaceScanSuccess(false);
        const updated = saveSmartHomeState(aptCode, { doorLocked: false });
        setSmartState(updated);
        addDoorAccessLog(aptCode, {
          userName: currentUser.full_name || 'Cư Dân',
          role: isOwner ? 'Chủ Hộ (Master)' : 'Người Nhà',
          method: 'FACE_ID',
          status: 'SUCCESS',
          detail: `Nhận diện sinh trắc học AI camera 3D (Độ khớp 99.4%) • Cửa đã mở chốt`
        });
        showToast(`👤 FaceID nhận diện thành công: ${currentUser.full_name} (Độ khớp 99.4%). Đã mở chốt cửa!`);
      }, 700);
    }, 1100);
  };

  // Tạo mã PIN khách mới
  const handleCreatePin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const label = newPinLabel.trim() || 'Mã Khách Tạm Thời';
    const { state: updated, newPin } = createGuestPin(
      aptCode, 
      label, 
      newPinDuration,
      currentUser.full_name || (isOwner ? 'Chủ Hộ' : 'Cư Dân'),
      isOwner ? 'Chủ Hộ (Master)' : 'Người Nhà'
    );
    setSmartState(updated);
    setNewPinLabel('');
    setIsCreatingPin(false);
    showToast(`🔢 Đã tạo mã PIN khách tạm thời: [${newPin.pin}] (Hạn dùng ${newPinDuration} phút)`);
  };

  // Sao chép mã PIN
  const handleCopyPin = (pin: string, id: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(pin.replace(/\s+/g, ''));
    }
    setCopiedPinId(id);
    showToast(`📋 Đã sao chép mã PIN khách [${pin}] vào bộ nhớ tạm.`);
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
    showToast('🗑️ Đã hủy và vô hiệu hóa mã PIN khách tạm thời.');
  };

  // Bật/tắt đàm thoại 2 chiều với chuông cửa
  const handleToggleIntercom = () => {
    setIsIntercomActive(prev => {
      const next = !prev;
      if (next) {
        showToast('🎙️ Đã kết nối đàm thoại 2 chiều với chuông hình ngoài cửa.');
      } else {
        showToast('🔇 Đã ngắt đàm thoại intercom với khách.');
      }
      return next;
    });
  };

  // Mở cửa nhanh cho khách từ màn hình camera
  const handleDoorbellUnlockForGuest = () => {
    const updated = saveSmartHomeState(aptCode, { doorLocked: false });
    setSmartState(updated);
    addDoorAccessLog(aptCode, {
      userName: currentUser.full_name || 'Chủ Hộ',
      role: isOwner ? 'Chủ Hộ' : 'Cư Dân',
      method: 'REMOTE_APP',
      status: 'SUCCESS',
      detail: 'Mở chốt khóa từ xa qua màn hình Chuông Hình AI cho khách vào nhà'
    });
    showToast('🚪 Đã mở chốt khóa cửa từ xa cho khách vào nhà!');
  };

  // Chụp ảnh snapshot từ camera
  const handleTakeSnapshot = () => {
    setSnapshotFlash(true);
    setSnapshotCount(prev => prev + 1);
    setTimeout(() => setSnapshotFlash(false), 250);
    addDoorAccessLog(aptCode, {
      userName: currentUser.full_name || 'Chủ Hộ',
      role: 'Giám Sát An Ninh',
      method: 'REMOTE_APP',
      status: 'SUCCESS',
      detail: `Chụp ảnh lưu trữ chuông cửa #${snapshotCount + 1} (Góc 160° HDR sảnh căn hộ)`
    });
    showToast('📸 Đã lưu ảnh chụp camera chuông cửa vào nhật ký an ninh!');
  };

  const handleToggleCurtains = () => {
    const updated = saveSmartHomeState(aptCode, { curtainsOpen: !smartState.curtainsOpen });
    setSmartState(updated);
    showToast(updated.curtainsOpen ? '☀️ Đang mở rèm ban công đón ánh sáng tự nhiên.' : '🌘 Đang đóng rèm ban công cách nhiệt.');
  };

  const handleToggleAC = () => {
    const updated = saveSmartHomeState(aptCode, { acPower: !smartState.acPower });
    setSmartState(updated);
    showToast(updated.acPower ? `❄️ Đã bật điều hòa Daikin Inverter (${updated.acTemp}°C).` : '❄️ Đã tắt điều hòa trung tâm.');
  };

  const handleChangeTemp = (delta: number) => {
    const nextTemp = Math.max(16, Math.min(30, smartState.acTemp + delta));
    const updated = saveSmartHomeState(aptCode, { acTemp: nextTemp });
    setSmartState(updated);
    showToast(`🌡️ Đã điều chỉnh nhiệt độ điều hòa: ${nextTemp}°C`);
  };

  // Kích hoạt Ngữ Cảnh 1-Chạm
  const handleTriggerScene = (scene: SceneType) => {
    if (scene === 'AWAY' && !isOwner) {
      showToast('⚠️ Chỉ Chủ Hộ mới có quyền kích hoạt chế độ "Đi Vắng" (Tắt toàn bộ hệ thống điện căn hộ).');
      return;
    }
    const { state: nextState, message } = applyScene(aptCode, scene);
    setSmartState(nextState);
    showToast(message);
  };

  // Kích hoạt / Tạm dừng Quy Tắc Tự Động Hóa
  const handleToggleRule = (ruleId: string) => {
    const nextRules = toggleAutomationRule(aptCode, ruleId);
    setAutomationRules(nextRules);
    const target = nextRules.find(r => r.id === ruleId);
    if (target?.enabled) {
      showToast(`✓ Đã kích hoạt kịch bản tự động hóa: "${target.title}"`);
    } else {
      showToast(`⏸️ Đã tạm dừng kịch bản tự động hóa: "${target?.title}"`);
    }
  };

  return (
    <div className="space-y-6 w-full animate-fadeIn select-none">
      {/* Header & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222B35] pb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-semibold flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5" /> Điều Khiển Thiết Bị Thông Minh • Sơ Đồ Kỹ Thuật Số
          </div>
          <h2 className="font-serif text-2xl text-white font-bold mt-1">
            Trung Tâm Điều Khiển & Không Gian Căn Hộ {aptCode}
          </h2>
        </div>

        {/* Role Badge Indicator */}
        <div className="flex items-center gap-2">
          {isOwner ? (
            <span className="px-3 py-1 bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 rounded shadow">
              <ShieldCheck className="w-3.5 h-3.5" /> Toàn Quyền Quản Trị Master (Chủ Hộ)
            </span>
          ) : (
            <span className="px-3 py-1 bg-amber-950/80 border border-amber-500 text-amber-300 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 rounded shadow">
              <LockKeyhole className="w-3.5 h-3.5" /> Quyền Cư Dân Thuộc Chủ Hộ (Gia Đình)
            </span>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="p-3.5 bg-[#121E2A] border border-[#C5A880] text-[#C5A880] text-xs font-medium flex items-center gap-2 animate-fadeIn shadow-lg rounded">
          <Sparkles className="w-4 h-4 text-[#C5A880] flex-shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Environment IoT Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-[#121820] border border-[#222B35] flex items-center justify-between rounded">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-gray-400">Nhiệt Độ Phòng</div>
            <div className="text-xl font-mono font-bold text-white mt-0.5">{acTemp}.5 °C</div>
          </div>
          <Thermometer className="w-6 h-6 text-[#C5A880]" />
        </div>

        <div className="p-3.5 bg-[#121820] border border-[#222B35] flex items-center justify-between rounded">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-gray-400">Độ Ẩm Không Khí</div>
            <div className="text-xl font-mono font-bold text-blue-400 mt-0.5">58 %</div>
          </div>
          <Droplets className="w-6 h-6 text-blue-400" />
        </div>

        <div className="p-3.5 bg-[#121820] border border-[#222B35] flex items-center justify-between rounded">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-gray-400">Chất Lượng AQI</div>
            <div className="text-xl font-mono font-bold text-emerald-400 mt-0.5">18 (Trong Lành)</div>
          </div>
          <Wind className="w-6 h-6 text-emerald-400" />
        </div>

        <div className="p-3.5 bg-[#121820] border border-[#222B35] flex items-center justify-between rounded">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-gray-400">Điện Năng Tức Thời</div>
            <div className="text-xl font-mono font-bold text-[#C5A880] mt-0.5">1.38 kW/h</div>
          </div>
          <Zap className="w-6 h-6 text-[#C5A880]" />
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SƠ ĐỒ PHỐI CẢNH & MẶT BẰNG KỸ THUẬT TƯƠNG TÁC THỰC TẾ       */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-xs uppercase tracking-wider text-[#C5A880] font-bold flex items-center gap-1.5">
            <Box className="w-3.5 h-3.5" /> Sơ Đồ Phối Cảnh & Mặt Bằng Kỹ Thuật Số Căn Hộ:
          </div>
          <span className="text-[10px] text-gray-400 font-mono">
            * Đồng bộ 1:1 theo thời gian thực với thiết bị IoT căn hộ
          </span>
        </div>

        <ApartmentModel3DViewer
          apartmentCode={aptCode}
          apartmentType={aptType}
          clearArea={aptArea}
          lights={lights}
          acPower={acPower}
          acTemp={acTemp}
          curtainsOpen={curtainsOpen}
          doorLocked={masterDoorLocked}
          waterLeakActive={waterLeakSensorActive}
          onToggleLight={handleToggleLight}
          onToggleDoor={handleToggleDoor}
          onToggleCurtains={handleToggleCurtains}
          onToggleAC={handleToggleAC}
          onChangeTemp={handleChangeTemp}
          interactive={true}
        />
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. THANH NGỮ CẢNH TỰ ĐỘNG HÓA 1-CHẠM (SCENE AUTOMATION)      */}
      {/* ------------------------------------------------------------- */}
      <div className="p-4 sm:p-5 bg-[#121820] border border-[#222B35] space-y-3 rounded shadow-xl">
        <div className="flex items-center justify-between">
          <div className="text-xs uppercase tracking-wider text-[#C5A880] font-bold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Ngữ Cảnh Tự Động Hóa 1-Chạm (Scene Automation):
          </div>
          <span className="text-[10px] text-gray-400 font-mono">
            {isOwner ? '* Áp dụng tức thì cho toàn bộ thiết bị' : '* Người nhà kích hoạt ngữ cảnh sinh hoạt'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {/* 1. VỀ NHÀ */}
          <button
            type="button"
            onClick={() => handleTriggerScene('WELCOME')}
            className={`p-3 border text-left transition-all rounded ${
              activeScene === 'WELCOME'
                ? 'bg-[#1C2533] border-[#C5A880] text-white ring-1 ring-[#C5A880] shadow-md'
                : 'bg-[#0D1117] border-[#222B35] text-gray-400 hover:border-gray-500 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <Sun className="w-4 h-4 text-amber-400" />
              {activeScene === 'WELCOME' && <CheckCircle2 className="w-3.5 h-3.5 text-[#C5A880]" />}
            </div>
            <div className="font-semibold text-xs text-white mt-2">Về Nhà (Welcome)</div>
            <div className="text-[10px] text-gray-400">Bật đèn, ĐH 24°C, mở rèm</div>
          </button>

          {/* 2. ĐI VẮNG */}
          <button
            type="button"
            onClick={() => handleTriggerScene('AWAY')}
            className={`p-3 border text-left transition-all rounded ${
              activeScene === 'AWAY'
                ? 'bg-[#1C2533] border-[#C5A880] text-white ring-1 ring-[#C5A880] shadow-md'
                : 'bg-[#0D1117] border-[#222B35] text-gray-400 hover:border-gray-500 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <Power className="w-4 h-4 text-red-400" />
              {activeScene === 'AWAY' && <CheckCircle2 className="w-3.5 h-3.5 text-[#C5A880]" />}
            </div>
            <div className="font-semibold text-xs text-white mt-2">Đi Vắng (Away)</div>
            <div className="text-[10px] text-gray-400">Tắt hết điện, khóa FaceID</div>
          </button>

          {/* 3. ĐI NGỦ */}
          <button
            type="button"
            onClick={() => handleTriggerScene('SLEEP')}
            className={`p-3 border text-left transition-all rounded ${
              activeScene === 'SLEEP'
                ? 'bg-[#1C2533] border-[#C5A880] text-white ring-1 ring-[#C5A880] shadow-md'
                : 'bg-[#0D1117] border-[#222B35] text-gray-400 hover:border-gray-500 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <Moon className="w-4 h-4 text-blue-400" />
              {activeScene === 'SLEEP' && <CheckCircle2 className="w-3.5 h-3.5 text-[#C5A880]" />}
            </div>
            <div className="font-semibold text-xs text-white mt-2">Đi Ngủ (Sleep)</div>
            <div className="text-[10px] text-gray-400">AC 26°C, khóa an toàn</div>
          </button>

          {/* 4. XEM PHIM */}
          <button
            type="button"
            onClick={() => handleTriggerScene('CINEMA')}
            className={`p-3 border text-left transition-all rounded ${
              activeScene === 'CINEMA'
                ? 'bg-[#1C2533] border-[#C5A880] text-white ring-1 ring-[#C5A880] shadow-md'
                : 'bg-[#0D1117] border-[#222B35] text-gray-400 hover:border-gray-500 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <Tv className="w-4 h-4 text-purple-400" />
              {activeScene === 'CINEMA' && <CheckCircle2 className="w-3.5 h-3.5 text-[#C5A880]" />}
            </div>
            <div className="font-semibold text-xs text-white mt-2">Xem Phim (Cinema)</div>
            <div className="text-[10px] text-gray-400">Đóng rèm, AC 23°C, đèn 15%</div>
          </button>

          {/* 5. ĂN TỐI & TIỆC */}
          <button
            type="button"
            onClick={() => handleTriggerScene('DINING')}
            className={`p-3 border text-left transition-all rounded col-span-2 sm:col-span-1 ${
              activeScene === 'DINING'
                ? 'bg-[#1C2533] border-[#C5A880] text-white ring-1 ring-[#C5A880] shadow-md'
                : 'bg-[#0D1117] border-[#222B35] text-gray-400 hover:border-gray-500 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              {activeScene === 'DINING' && <CheckCircle2 className="w-3.5 h-3.5 text-[#C5A880]" />}
            </div>
            <div className="font-semibold text-xs text-white mt-2">Ăn Tối (Dining)</div>
            <div className="text-[10px] text-gray-400">Sáng bếp, mở rèm view phố</div>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. LẬP LỊCH & KỊCH BẢN TỰ ĐỘNG HÓA 24/7 (AUTOMATION RULES)    */}
      {/* ------------------------------------------------------------- */}
      <div className="p-4 sm:p-5 bg-[#121820] border border-[#222B35] space-y-4 rounded shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#222B35] pb-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-[#C5A880] font-bold flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#C5A880]" /> Lập Lịch & Kịch Bản Tự Động Hóa 24/7 (Automation Schedules & AI Sensors)
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Hệ thống tự động điều phối thiết bị theo khung giờ sinh hoạt thực tế và cảm biến an toàn môi trường.
            </p>
          </div>
          <span className="px-2.5 py-0.5 bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-[10.5px] font-mono rounded self-start sm:self-auto">
            {automationRules.filter(r => r.enabled).length}/{automationRules.length} Đang Kích Hoạt
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {automationRules.map((rule) => {
            const isRuleActive = rule.enabled;
            return (
              <div 
                key={rule.id}
                className={`p-3.5 border transition-all rounded flex flex-col justify-between gap-2.5 ${
                  isRuleActive 
                    ? 'bg-[#161D26] border-[#2D3A4B]' 
                    : 'bg-[#0E131A] border-[#1C2533] opacity-60'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded flex items-center justify-center text-xs font-bold ${
                        rule.icon === 'sun' ? 'bg-amber-950/80 text-amber-400 border border-amber-500/40' :
                        rule.icon === 'moon' ? 'bg-indigo-950/80 text-indigo-400 border border-indigo-500/40' :
                        rule.icon === 'shield' ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40' :
                        rule.icon === 'droplet' ? 'bg-blue-950/80 text-blue-400 border border-blue-500/40' :
                        'bg-teal-950/80 text-teal-400 border border-teal-500/40'
                      }`}>
                        {rule.icon === 'sun' && <Sun className="w-3.5 h-3.5" />}
                        {rule.icon === 'moon' && <Moon className="w-3.5 h-3.5" />}
                        {rule.icon === 'shield' && <ShieldCheck className="w-3.5 h-3.5" />}
                        {rule.icon === 'droplet' && <Droplets className="w-3.5 h-3.5" />}
                        {rule.icon === 'wind' && <Wind className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <h4 className="font-semibold text-xs text-white leading-tight">{rule.title}</h4>
                        <div className="text-[10px] text-[#C5A880] font-mono">{rule.triggerLabel}</div>
                      </div>
                    </div>

                    {/* Toggle Switch */}
                    <button
                      type="button"
                      onClick={() => handleToggleRule(rule.id)}
                      className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                        isRuleActive ? 'bg-emerald-600' : 'bg-gray-700'
                      }`}
                      title={isRuleActive ? 'Bấm để tạm dừng' : 'Bấm để kích hoạt'}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transition-transform ${isRuleActive ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  <p className="text-[11px] text-gray-300 leading-relaxed line-clamp-2">
                    {rule.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#222B35] flex items-center justify-between text-[10px] font-mono text-gray-400">
                  <span className="truncate max-w-[180px] text-gray-300">{rule.actionSummary}</span>
                  <span className={isRuleActive ? 'text-emerald-400 font-bold' : 'text-gray-500'}>
                    {isRuleActive ? 'BẬT' : 'TẮT'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================================= */}
      {/* TRUNG TÂM CỬA THÔNG MINH - SINGLE UNIFIED COMMAND CENTER BOX */}
      {/* ============================================================= */}
      <div className="bg-[#121820] border border-[#2A374A] rounded-xl shadow-2xl overflow-hidden mt-6">
        {/* 1. INTEGRATED BOX HEADER: Nhận diện & Trạng thái phần cứng */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#161F2C] via-[#121820] to-[#161F2C] border-b border-[#2A374A] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-[11px] uppercase tracking-[0.2em] text-[#C5A880] font-bold flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${masterDoorLocked ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-ping'}`} />
              <DoorClosed className="w-4 h-4 text-[#C5A880]" />
              <span>Skyline Smart Door Command Center</span>
            </div>
            <h3 className="text-lg sm:text-xl font-serif font-bold text-white flex items-center gap-2">
              <span>Kiểm Soát Ra Vào & Chốt An Toàn Cửa Chính Căn Hộ {aptCode}</span>
            </h3>
            <p className="text-xs text-gray-400 flex flex-wrap items-center gap-2 font-mono">
              <span>Model: Skyline Vision S900 Pro AI</span>
              <span className="text-gray-600">•</span>
              <span className="text-emerald-400">Matter & Zigbee 3.0 AES-256</span>
              <span className="text-gray-600">•</span>
              <span>Cảm biến sinh trắc học 3D</span>
            </p>
          </div>

          {/* Quick Hardware Status Indicators */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Chốt Khóa */}
            <div className={`px-3 py-1.5 rounded text-xs font-mono font-bold flex items-center gap-2 border ${
              masterDoorLocked 
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40' 
                : 'bg-amber-950/80 text-amber-300 border-amber-500/40 animate-pulse'
            }`}>
              {masterDoorLocked ? <Lock className="w-3.5 h-3.5" /> : <DoorOpen className="w-3.5 h-3.5" />}
              <span>{masterDoorLocked ? 'CHỐT ĐANG KHÓA' : 'CHỐT ĐANG MỞ'}</span>
            </div>

            {/* Cảm biến cánh cửa */}
            <div className={`px-3 py-1.5 rounded text-xs font-mono font-bold flex items-center gap-2 border ${
              doorAjar 
                ? 'bg-red-950/80 text-red-300 border-red-500/40 animate-bounce' 
                : 'bg-[#0D1117] text-gray-300 border-[#2A374A]'
            }`}>
              {doorAjar ? <AlertTriangle className="w-3.5 h-3.5 text-red-400" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{doorAjar ? 'CÁNH HÉ MỞ' : 'CÁNH ĐÓNG KÍN'}</span>
            </div>

            {/* Pin Khóa */}
            <div className="px-3 py-1.5 bg-[#0D1117] border border-[#2A374A] rounded text-xs flex items-center gap-1.5">
              <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-gray-400 text-[10px]">Pin:</span>
              <span className="font-mono font-bold text-emerald-300 text-xs">{doorBatteryLevel}%</span>
            </div>

            {/* An ninh AI */}
            <div className="px-3 py-1.5 bg-[#0D1117] border border-[#2A374A] rounded text-xs flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#C5A880]" />
              <span className="font-mono font-bold text-[#C5A880] text-xs">24/7 BẢO VỆ</span>
            </div>
          </div>
        </div>

        {/* 2. WORKFLOW SEGMENTED TABS: Phân định rõ từng luồng tương tác */}
        <div className="px-4 sm:px-5 pt-3 bg-[#0D1219] border-b border-[#222B35] flex items-center justify-between gap-3 overflow-x-auto">
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Luồng 1: Giám Sát & Điều Khiển Trực Tiếp */}
            <button
              type="button"
              onClick={() => setSmartDoorTab('LIVE_CONTROL')}
              className={`px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-t-lg transition-all flex items-center gap-2 border-t-2 ${
                smartDoorTab === 'LIVE_CONTROL'
                  ? 'bg-[#121820] text-white border-[#C5A880] shadow-md'
                  : 'text-gray-400 hover:text-white border-transparent hover:bg-[#161D26]'
              }`}
            >
              <Video className="w-4 h-4 text-[#C5A880]" />
              <span>1. Giám Sát Camera & Điều Khiển Khóa</span>
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping ml-0.5" />
            </button>

            {/* Luồng 2: Quản Lý Phương Thức Ra Vào */}
            <button
              type="button"
              onClick={() => setSmartDoorTab('CREDENTIALS')}
              className={`px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-t-lg transition-all flex items-center gap-2 border-t-2 ${
                smartDoorTab === 'CREDENTIALS'
                  ? 'bg-[#121820] text-white border-cyan-400 shadow-md'
                  : 'text-gray-400 hover:text-white border-transparent hover:bg-[#161D26]'
              }`}
            >
              <KeyRound className="w-4 h-4 text-cyan-400" />
              <span>2. Quản Lý Phương Thức Ra Vào</span>
              <span className={`px-1.5 py-0.2 text-[9px] font-mono rounded font-normal ${
                isFaceApproved ? 'bg-emerald-950 text-emerald-300' : 'bg-gray-800 text-gray-400'
              }`}>
                {isFaceApproved ? 'FaceID Sẵn Sàng' : '3 Phương Thức'}
              </span>
            </button>

            {/* Luồng 3: Nhật Ký Ra Vào Thời Gian Thực */}
            <button
              type="button"
              onClick={() => setSmartDoorTab('LOGS')}
              className={`px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-t-lg transition-all flex items-center gap-2 border-t-2 ${
                smartDoorTab === 'LOGS'
                  ? 'bg-[#121820] text-white border-indigo-400 shadow-md'
                  : 'text-gray-400 hover:text-white border-transparent hover:bg-[#161D26]'
              }`}
            >
              <History className="w-4 h-4 text-indigo-400" />
              <span>3. Nhật Ký Ra Vào Thời Gian Thực</span>
              {doorAccessLogs.length > 0 && (
                <span className="px-1.5 py-0.2 text-[9px] font-mono rounded bg-indigo-950 text-indigo-300 font-bold">
                  {doorAccessLogs.length}
                </span>
              )}
            </button>
          </div>

          {/* Toggle "Xem Tất Cả Luồng" */}
          <button
            type="button"
            onClick={() => setSmartDoorTab(prev => prev === 'ALL' ? 'LIVE_CONTROL' : 'ALL')}
            className={`px-3 py-1.5 text-xs font-mono rounded transition-colors flex items-center gap-1.5 shrink-0 mb-1 border ${
              smartDoorTab === 'ALL'
                ? 'bg-[#C5A880] text-[#0D1117] border-[#C5A880] font-bold'
                : 'bg-[#161D26] text-gray-400 hover:text-white border-[#2A374A]'
            }`}
            title="Hiển thị tất cả các luồng đồng thời trong 1 Box"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{smartDoorTab === 'ALL' ? 'Thu Gọn Theo Luồng' : 'Xem Tất Cả Luồng'}</span>
          </button>
        </div>

        {/* 3. WORKFLOW BODY: Toàn bộ nội dung tích hợp bên trong 1 Box duy nhất */}
        <div className="p-5 sm:p-6 space-y-6">
          {/* ========================================================= */}
          {/* LUỒNG 1: GIÁM SÁT CAMERA & ĐIỀU KHIỂN CHỐT KHÓA TRỰC TIẾP */}
          {/* ========================================================= */}
          {(smartDoorTab === 'LIVE_CONTROL' || smartDoorTab === 'ALL') && (
            <div className="space-y-5">
              {smartDoorTab === 'ALL' && (
                <div className="flex items-center gap-2 pb-2 border-b border-[#222B35]">
                  <Video className="w-4 h-4 text-[#C5A880]" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#C5A880]">
                    Luồng 1: Giám Sát Camera & Điều Khiển Chốt Khóa Trực Tiếp
                  </h4>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* 1.1. Màn Hình Chuông Hình AI Góc Rộng (7 Cột) */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-[#222B35]/60">
                    <div className="text-xs uppercase tracking-wider text-gray-300 font-bold flex items-center gap-2">
                      <Video className="w-4 h-4 text-[#C5A880]" /> Chuông Hình Thông Minh AI (Video Doorbell)
                    </div>
                    <span className="flex items-center gap-1.5 text-[10px] text-red-400 font-mono font-bold">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> LIVE 2K HDR
                    </span>
                  </div>

                  {/* Camera Frame */}
                  <div className={`relative aspect-[16/9] w-full bg-[#0A0E14] border-2 rounded-lg overflow-hidden flex flex-col justify-between p-3.5 transition-all select-none shadow-inner ${
                    snapshotFlash ? 'brightness-200 duration-75' : 'duration-300'
                  } ${isIntercomActive ? 'border-cyan-500 shadow-cyan-950/40 shadow-lg' : 'border-[#222B35]'}`}>
                    {/* Simulated Hallway Background */}
                    <div className="absolute inset-0 pointer-events-none opacity-40">
                      <svg className="w-full h-full" viewBox="0 0 480 270" preserveAspectRatio="none">
                        <polygon points="0,0 160,80 320,80 480,0" fill="#0E1624" />
                        <polygon points="0,270 160,190 320,190 480,270" fill="#0A0F18" />
                        <polygon points="0,0 160,80 160,190 0,270" fill="#111B2A" />
                        <polygon points="480,0 320,80 320,190 480,270" fill="#111B2A" />
                        <rect x="210" y="90" width="60" height="95" fill="#1B283A" stroke="#C5A880" strokeWidth="1" />
                        <rect x="230" y="102" width="20" height="8" rx="2" fill="#C5A880" />
                        <text x="240" y="108" fill="#0D1117" fontSize="5" fontWeight="bold" textAnchor="middle">{aptCode}</text>
                        <circle cx="240" cy="140" r="45" stroke="#00FFFF" strokeWidth="0.5" strokeDasharray="3 3" fill="none" opacity="0.4" />
                        <circle cx="240" cy="140" r="85" stroke="#00FFFF" strokeWidth="0.5" strokeDasharray="4 4" fill="none" opacity="0.2" />
                      </svg>
                    </div>

                    {/* Top Screen HUD Overlay */}
                    <div className="relative z-10 flex items-start justify-between text-[11px] font-mono text-gray-300">
                      <div className="space-y-0.5">
                        <div className="text-white font-bold flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                          <span>CAM-01 • SẢNH CĂN HỘ {aptCode} (TẦNG {aptFloor})</span>
                        </div>
                        <div className="text-[10px] text-gray-400">GÓC SIÊU RỘNG 160° HDR • BAN ĐÊM HỒNG NGOẠI</div>
                      </div>

                      <div className="text-right space-y-0.5">
                        <div className="text-emerald-400 font-bold">{cameraTime || '11:25:00.0'}</div>
                        <div className="text-[10px] text-gray-400">AI MOTION: YÊN TĨNH</div>
                      </div>
                    </div>

                    {/* Center HUD: AI Detection & Audio Wave Visualizer */}
                    <div className="relative z-10 flex flex-col items-center justify-center space-y-2 pointer-events-none">
                      {isIntercomActive && (
                        <div className="p-2.5 bg-[#0D1117]/90 border border-cyan-500/70 rounded-lg flex items-center gap-3 animate-fadeIn shadow-lg">
                          <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse" />
                          <span className="text-xs font-mono font-bold text-cyan-300">
                            ĐANG KẾT NỐI ĐÀM THOẠI 2 CHIỀU...
                          </span>
                          <div className="flex items-center gap-1 h-4">
                            <div className="w-1 bg-cyan-400 h-2 animate-bounce" />
                            <div className="w-1 bg-cyan-400 h-4 animate-bounce" style={{ animationDelay: '0.15s' }} />
                            <div className="w-1 bg-cyan-400 h-3 animate-bounce" style={{ animationDelay: '0.3s' }} />
                            <div className="w-1 bg-cyan-400 h-4 animate-bounce" style={{ animationDelay: '0.2s' }} />
                          </div>
                        </div>
                      )}

                      <div className="w-16 h-16 border border-dashed border-cyan-500/30 rounded-lg flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-cyan-400/60" />
                      </div>
                    </div>

                    {/* Bottom Screen HUD Overlay */}
                    <div className="relative z-10 flex items-center justify-between text-[10px] font-mono text-gray-400 bg-[#0D1117]/80 px-2 py-1 rounded border border-[#1F2937]/50 backdrop-blur-sm">
                      <span className="text-emerald-400 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> MÃ HÓA AN TOÀN TẦNG CAO (AES-256)
                      </span>
                      <span>ẢNH ĐÃ CHỤP: {snapshotCount}</span>
                    </div>
                  </div>

                  {/* Camera Action Control Toolbar */}
                  <div className="grid grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={handleToggleIntercom}
                      className={`py-2.5 px-3 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2 border ${
                        isIntercomActive 
                          ? 'bg-cyan-950 text-cyan-300 border-cyan-500 shadow-md shadow-cyan-900/30 ring-1 ring-cyan-500' 
                          : 'bg-[#161D26] hover:bg-[#1F2937] text-gray-300 hover:text-white border-[#2A374A]'
                      }`}
                    >
                      {isIntercomActive ? (
                        <>
                          <MicOff className="w-4 h-4 text-cyan-400 animate-pulse" /> Tắt Đàm Thoại
                        </>
                      ) : (
                        <>
                          <Mic className="w-4 h-4 text-cyan-400" /> Đàm Thoại 2 Chiều
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleDoorbellUnlockForGuest}
                      className="py-2.5 px-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-900/30"
                    >
                      <DoorOpen className="w-4 h-4" /> Mở Cho Khách
                    </button>

                    <button
                      type="button"
                      onClick={handleTakeSnapshot}
                      className="py-2.5 px-3 bg-[#161D26] hover:bg-[#1F2937] border border-[#2A374A] text-gray-300 hover:text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Camera className="w-4 h-4 text-[#C5A880]" /> Chụp Ảnh Sự Kiện
                    </button>
                  </div>
                </div>

                {/* 1.2. Bảng Điều Khiển Chốt Khóa 3 Tầng & Cảm Biến Cánh Cửa (5 Cột) */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-[#222B35]/60">
                    <div className="text-xs uppercase tracking-wider text-gray-300 font-bold flex items-center gap-2">
                      <Lock className="w-4 h-4 text-[#C5A880]" /> Điều Khiển Chốt Khóa & Cảm Biến Cánh
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded border ${
                      masterDoorLocked 
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50' 
                        : 'bg-amber-950/80 text-amber-300 border-amber-500/50 animate-pulse'
                    }`}>
                      {masterDoorLocked ? 'CHỐT KHÓA' : 'CHỐT MỞ'}
                    </span>
                  </div>

                  {/* Trực quan trạng thái chốt */}
                  <div className="p-3.5 bg-[#0D1117] border border-[#1F2937] rounded-lg flex items-center gap-3.5">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 transition-all shadow-lg ${
                      masterDoorLocked 
                        ? 'bg-gradient-to-br from-emerald-900 to-emerald-950 text-emerald-400 border-2 border-emerald-500 shadow-emerald-900/30' 
                        : 'bg-gradient-to-br from-amber-600 to-red-700 text-white border-2 border-amber-400 shadow-amber-900/40 animate-pulse'
                    }`}>
                      {masterDoorLocked ? (
                        <Lock className="w-7 h-7" />
                      ) : (
                        <DoorOpen className="w-7 h-7" />
                      )}
                    </div>

                    <div className="space-y-0.5 flex-1">
                      <div className="text-xs font-bold text-white">
                        {masterDoorLocked ? 'Cửa Chính Đã Khóa Chốt An Toàn' : 'Chốt Cửa Chính Đang Mở'}
                      </div>
                      <div className="text-[10.5px] text-gray-400 leading-snug">
                        {masterDoorLocked 
                          ? 'Chốt thép tôi cứng 3 tầng gài khít khuôn cửa.'
                          : doorAutoLock 
                            ? 'Chốt mở. Tự động gài an toàn sau 5s.'
                            : 'Chốt đang mở tự do (Chế độ mở thủ công).'}
                      </div>
                    </div>
                  </div>

                  {/* Cảm Biến Cánh Cửa Từ Tính */}
                  <div className={`p-3 border rounded-lg transition-all flex items-center justify-between gap-2.5 ${
                    doorAjar 
                      ? 'bg-red-950/40 border-red-500 text-red-200 shadow-md shadow-red-950/30' 
                      : 'bg-[#161D26] border-[#2A374A] text-gray-300'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded flex items-center justify-center shrink-0 font-bold ${
                        doorAjar ? 'bg-red-900/80 text-red-300 animate-bounce' : 'bg-emerald-950/80 text-emerald-400'
                      }`}>
                        {doorAjar ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white">
                          {doorAjar ? 'CẢNH BÁO: Cánh Cửa Đang Mở Hé!' : 'Cánh Cửa Đang Đóng Kín 100%'}
                        </div>
                        <div className="text-[9.5px] text-gray-400">
                          {doorAjar ? 'Cửa chưa khép khít vào khuôn' : 'Cảm biến từ tính xác nhận khép kín'}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleToggleDoorAjar}
                      className="px-2.5 py-1 bg-[#222B35] hover:bg-[#2F3D4D] text-[10px] font-mono text-gray-300 hover:text-white rounded transition-colors shrink-0"
                      title="Mô phỏng đóng hoặc mở hé cánh cửa vật lý"
                    >
                      {doorAjar ? 'Đóng Kín' : 'Mô Phỏng Hé'}
                    </button>
                  </div>

                  {/* Nút bấm chính 1-chạm: MỞ / KHÓA CHỐT */}
                  <button
                    type="button"
                    onClick={handleToggleDoor}
                    className={`w-full py-3 px-4 font-bold text-xs tracking-wider uppercase rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg ${
                      masterDoorLocked 
                        ? 'bg-gradient-to-r from-[#C5A880] to-[#E2D4BF] hover:from-[#d5b991] hover:to-white text-[#0D1117] shadow-[#C5A880]/20' 
                        : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-red-900/40'
                    }`}
                  >
                    {masterDoorLocked ? (
                      <>
                        <DoorOpen className="w-4 h-4" /> Mở Chốt Khóa Cửa
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" /> Khóa Chốt Ngay
                      </>
                    )}
                  </button>

                  {/* 3 Toggle Cài Đặt An Toàn */}
                  <div className="space-y-2 pt-2 border-t border-[#222B35]">
                    {/* Toggle 1: Tự động khóa sau 5s */}
                    <div className="p-2 bg-[#0D1117] border border-[#222B35] rounded flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="text-[11px] font-medium text-white flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-[#C5A880]" /> Tự Động Khóa Chốt Sau 5 Giây
                        </div>
                        <div className="text-[9.5px] text-gray-400">Tự gài chốt tránh quên khóa</div>
                      </div>
                      <button
                        type="button"
                        onClick={handleToggleAutoLock}
                        className={`w-9 h-5 rounded-full transition-colors relative p-0.5 shrink-0 ${
                          doorAutoLock ? 'bg-emerald-600' : 'bg-gray-700'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${doorAutoLock ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    {/* Toggle 2: Chốt ban đêm */}
                    <div className="p-2 bg-[#0D1117] border border-[#222B35] rounded flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="text-[11px] font-medium text-white flex items-center gap-1.5">
                          <Moon className="w-3 h-3 text-blue-400" /> Chốt Riêng Tư Ban Đêm (Night Latch)
                        </div>
                        <div className="text-[9.5px] text-gray-400">Chặn mở từ bên ngoài qua PIN / Thẻ</div>
                      </div>
                      <button
                        type="button"
                        onClick={handleToggleNightLatch}
                        className={`w-9 h-5 rounded-full transition-colors relative p-0.5 shrink-0 ${
                          doorNightLatch ? 'bg-indigo-600' : 'bg-gray-700'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${doorNightLatch ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    {/* Toggle 3: Còi chống cạy phá */}
                    <div className="p-2 bg-[#0D1117] border border-[#222B35] rounded flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="text-[11px] font-medium text-white flex items-center gap-1.5">
                          <ShieldAlert className="w-3 h-3 text-red-400" /> Cảm Biến AI Chống Cạy Phá (Anti-Tamper)
                        </div>
                        <div className="text-[9.5px] text-gray-400">Hú còi & báo động khẩn khi có rung lắc</div>
                      </div>
                      <button
                        type="button"
                        onClick={handleToggleAntiTamper}
                        className={`w-9 h-5 rounded-full transition-colors relative p-0.5 shrink-0 ${
                          doorAntiTamper ? 'bg-red-600' : 'bg-gray-700'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${doorAntiTamper ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dải Gateway Chuyển Luồng Nhanh (Quick Workflow Navigator) */}
              <div className="p-3.5 bg-[#0D1117] border border-[#222B35] rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-4 text-gray-300">
                  <div className="flex items-center gap-1.5">
                    <ScanFace className="w-3.5 h-3.5 text-cyan-400" />
                    <span>FaceID:</span>
                    <span className={`font-mono font-bold ${isFaceApproved ? 'text-emerald-400' : isFacePending ? 'text-amber-400' : 'text-gray-400'}`}>
                      {isFaceApproved ? 'Đã kích hoạt' : isFacePending ? 'Chờ BQL duyệt' : 'Chưa đăng ký'}
                    </span>
                  </div>
                  <span className="text-gray-700 hidden sm:inline">•</span>
                  <div className="flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    <span>Mã PIN Khách:</span>
                    <span className="font-mono font-bold text-amber-300">{guestPins.length} đang hiệu lực</span>
                  </div>
                  <span className="text-gray-700 hidden sm:inline">•</span>
                  <div className="flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                    <span>Thẻ NFC:</span>
                    <span className="font-mono font-bold text-blue-300">{1 + familyMembers.length} thẻ</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setSmartDoorTab('CREDENTIALS')}
                    className="px-2.5 py-1 bg-[#161D26] hover:bg-[#222B35] border border-cyan-500/30 hover:border-cyan-500/60 text-cyan-300 rounded text-[11px] font-bold flex items-center gap-1 transition-colors"
                  >
                    <span>Quản Lý Phương Thức</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSmartDoorTab('LOGS')}
                    className="px-2.5 py-1 bg-[#161D26] hover:bg-[#222B35] border border-indigo-500/30 hover:border-indigo-500/60 text-indigo-300 rounded text-[11px] font-bold flex items-center gap-1 transition-colors"
                  >
                    <span>Lịch Sử ({doorAccessLogs.length})</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* LUỒNG 2: QUẢN LÝ PHƯƠNG THỨC XÁC THỰC RA VÀO              */}
          {/* ========================================================= */}
          {(smartDoorTab === 'CREDENTIALS' || smartDoorTab === 'ALL') && (
            <div className={`space-y-4 ${smartDoorTab === 'ALL' ? 'pt-6 border-t border-[#222B35]' : ''}`}>
              <div className="flex items-center justify-between pb-2 border-b border-[#222B35]/60">
                <div className="text-xs uppercase tracking-wider text-[#C5A880] font-bold flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-cyan-400" /> 
                  <span>Luồng 2: Quản Lý Phương Thức Xác Thực Ra Vào Cửa Chính</span>
                </div>
                <div className="text-[11px] text-gray-400 font-mono">
                  Bảo mật cấp độ cao Matter 1.2
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 2.1. Sinh Trắc Học FaceID AI 3D */}
                <div className="p-4 bg-[#161D26] border border-[#2A374A] rounded-lg space-y-3 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shrink-0">
                          <ScanFace className="w-4 h-4" />
                        </div>
                        <div className="text-xs font-bold text-white">FaceID AI 3D</div>
                      </div>

                      <span className={`px-2 py-0.5 text-[10px] font-mono rounded font-bold border ${
                        isFaceApproved 
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                          : isFacePending
                            ? 'bg-amber-950 text-amber-300 border-amber-500/40'
                            : 'bg-gray-800 text-gray-400 border-gray-600'
                      }`}>
                        {isFaceApproved ? 'ĐÃ KÍCH HOẠT' : isFacePending ? 'CHỜ DUYỆT' : 'CHƯA ĐĂNG KÝ'}
                      </span>
                    </div>

                    <div className="text-[11px] text-gray-300 leading-relaxed">
                      {hasFaceEnrolled 
                        ? `${faceSamplesCount}/4 mẫu khuôn mặt 3D của ${currentUser.full_name} đã sẵn sàng.`
                        : `Chưa có mẫu FaceID của cư dân ${currentUser.full_name}. Vui lòng hoàn tất eKYC.`}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSimulateFaceScan}
                    disabled={isScanningFace || !isFaceApproved}
                    className={`w-full py-2 px-3 border text-xs font-bold rounded transition-colors flex items-center justify-center gap-2 ${
                      isFaceApproved 
                        ? 'bg-[#0D1117] hover:bg-[#1A2332] border-cyan-500/40 text-cyan-300 hover:text-cyan-200'
                        : 'bg-[#0D1117] border-gray-700 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {isScanningFace ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Đang Quét Khuôn Mặt 3D...
                      </>
                    ) : isFaceApproved ? (
                      <>
                        <Scan className="w-3.5 h-3.5 text-cyan-400" /> Quét FaceID Mở Cửa Ngay
                      </>
                    ) : isFacePending ? (
                      <>
                        <Clock className="w-3.5 h-3.5 text-amber-400" /> Hồ Sơ Đang Chờ BQL Phê Duyệt
                      </>
                    ) : (
                      <>
                        <ScanFace className="w-3.5 h-3.5 text-gray-500" /> Chưa Đăng Ký FaceID (eKYC)
                      </>
                    )}
                  </button>
                </div>

                {/* 2.2. Mã Số Khách Tạm Thời (Guest PIN OTP) */}
                <div className="p-4 bg-[#161D26] border border-[#2A374A] rounded-lg space-y-3 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-amber-950 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div className="text-xs font-bold text-white">Mã PIN Khách Tạm Thời</div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsCreatingPin(prev => !prev)}
                        className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-[#0D1117] text-[10px] font-bold uppercase rounded transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> {isCreatingPin ? 'Đóng' : 'Tạo Mới'}
                      </button>
                    </div>

                    <div className="text-[11px] text-gray-300">
                      Mã số OTP dùng 1 lần hoặc có thời hạn dành cho Shipper, Khách tới thăm.
                    </div>
                  </div>

                  <div className="text-[11px] font-mono text-amber-300/90">
                    {guestPins.length > 0 ? `${guestPins.length} mã đang hoạt động` : 'Chưa có mã nào'}
                  </div>
                </div>

                {/* 2.3. Thẻ Cư Dân NFC / RFID */}
                <div className="p-4 bg-[#161D26] border border-[#2A374A] rounded-lg space-y-3 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-blue-950 border border-blue-500/40 text-blue-400 flex items-center justify-center shrink-0">
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <div className="text-xs font-bold text-white">Thẻ Cư Dân NFC / RFID</div>
                      </div>

                      <span className="px-2 py-0.5 bg-blue-950 text-blue-300 border border-blue-500/40 text-[10px] font-mono rounded font-bold">
                        {1 + familyMembers.length} THẺ HOẠT ĐỘNG
                      </span>
                    </div>

                    <div className="text-[11px] text-gray-300 leading-relaxed">
                      {familyMembers.length > 0 
                        ? `Gồm 1 thẻ Chủ Hộ (${currentUser.full_name}) và ${familyMembers.length} thẻ thành viên gia đình.`
                        : `Gồm 1 thẻ Chủ Hộ (${currentUser.full_name}) được mã hóa chip bảo mật.`}
                    </div>
                  </div>

                  <div className="text-[10px] text-gray-400 font-mono">
                    Tần số: 13.56MHz Mifare Desfire EV3
                  </div>
                </div>
              </div>

              {/* Form Tạo Mã PIN Mới (Nếu mở) */}
              {isCreatingPin && (
                <form onSubmit={handleCreatePin} className="p-4 bg-[#0D1117] border border-[#222B35] rounded-lg space-y-3 animate-fadeIn">
                  <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <KeyRound className="w-3.5 h-3.5" /> Thiết Lập Mã PIN Khách Tạm Thời
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-gray-400 uppercase font-semibold block mb-1">
                        Ghi chú người dùng mã:
                      </label>
                      <input
                        type="text"
                        value={newPinLabel}
                        onChange={(e) => setNewPinLabel(e.target.value)}
                        placeholder="VD: Shipper Shopee, Bạn thân, v.v."
                        className="w-full px-2.5 py-1.5 bg-[#161D26] border border-[#2A374A] text-white text-xs rounded focus:outline-none focus:border-[#C5A880]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-400 uppercase font-semibold block mb-1">
                        Thời hạn hiệu lực:
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setNewPinDuration(15)}
                          className={`py-1.5 text-[10px] font-mono font-bold rounded border ${
                            newPinDuration === 15 
                              ? 'bg-amber-950 text-amber-300 border-amber-500' 
                              : 'bg-[#161D26] text-gray-400 border-[#2A374A]'
                          }`}
                        >
                          15 Phút
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewPinDuration(60)}
                          className={`py-1.5 text-[10px] font-mono font-bold rounded border ${
                            newPinDuration === 60 
                              ? 'bg-amber-950 text-amber-300 border-amber-500' 
                              : 'bg-[#161D26] text-gray-400 border-[#2A374A]'
                          }`}
                        >
                          1 Giờ
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewPinDuration(1440)}
                          className={`py-1.5 text-[10px] font-mono font-bold rounded border ${
                            newPinDuration === 1440 
                              ? 'bg-amber-950 text-amber-300 border-amber-500' 
                              : 'bg-[#161D26] text-gray-400 border-[#2A374A]'
                          }`}
                        >
                          24 Giờ
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCreatingPin(false)}
                      className="px-3 py-1.5 bg-[#161D26] hover:bg-[#222B35] text-gray-300 text-xs rounded transition-colors"
                    >
                      Hủy Bỏ
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-[#C5A880] hover:bg-[#d5b991] text-[#0D1117] text-xs font-bold uppercase rounded transition-colors"
                    >
                      Xác Nhận Tạo Mã PIN OTP
                    </button>
                  </div>
                </form>
              )}

              {/* Danh Sách Mã PIN Đang Hoạt Động */}
              {guestPins.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    Danh Sách Mã PIN Khách Đang Hiệu Lực ({guestPins.length}):
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {guestPins.map((item) => (
                      <div 
                        key={item.id}
                        className="p-3 bg-[#0D1117] border border-[#222B35] rounded-lg flex items-center justify-between gap-2"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-base font-mono font-bold text-amber-400 tracking-wider">
                              {item.pin}
                            </span>
                            <span className="px-1.5 py-0.2 bg-amber-950/80 text-amber-300 border border-amber-500/40 text-[9px] font-mono rounded">
                              OTP
                            </span>
                          </div>
                          <div className="text-[11px] text-gray-300 truncate max-w-[170px]">
                            {item.label}
                          </div>
                          <div className="text-[9.5px] text-gray-500 font-mono">
                            Hết hạn: {item.expiresAt}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleCopyPin(item.pin, item.id)}
                            className="p-1.5 bg-[#161D26] hover:bg-[#222B35] text-gray-300 hover:text-white rounded border border-[#2A374A] transition-colors"
                            title="Sao chép mã PIN"
                          >
                            {copiedPinId === item.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRevokePin(item.id)}
                            className="p-1.5 bg-[#161D26] hover:bg-red-950 text-gray-400 hover:text-red-400 rounded border border-[#2A374A] hover:border-red-500/50 transition-colors"
                            title="Thu hồi / Hủy mã"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* LUỒNG 3: NHẬT KÝ RA VÀO THỜI GIAN THỰC                     */}
          {/* ========================================================= */}
          {(smartDoorTab === 'LOGS' || smartDoorTab === 'ALL') && (
            <div className={`space-y-4 ${smartDoorTab === 'ALL' ? 'pt-6 border-t border-[#222B35]' : ''}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#222B35]/60">
                <div className="text-xs uppercase tracking-wider text-[#C5A880] font-bold flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-400" /> 
                  <span>Luồng 3: Nhật Ký Ra Vào Cửa Thời Gian Thực (Access Activity Logs)</span>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                  <button
                    type="button"
                    onClick={() => setActiveLogFilter('ALL')}
                    className={`px-2 py-1 text-[10px] font-mono rounded font-bold transition-colors ${
                      activeLogFilter === 'ALL' 
                        ? 'bg-[#C5A880] text-[#0D1117]' 
                        : 'bg-[#161D26] text-gray-400 hover:text-white'
                    }`}
                  >
                    Tất Cả ({doorAccessLogs.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveLogFilter('FACE_ID')}
                    className={`px-2 py-1 text-[10px] font-mono rounded font-bold transition-colors ${
                      activeLogFilter === 'FACE_ID' 
                        ? 'bg-cyan-600 text-white' 
                        : 'bg-[#161D26] text-gray-400 hover:text-white'
                    }`}
                  >
                    FaceID
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveLogFilter('PIN_OTP')}
                    className={`px-2 py-1 text-[10px] font-mono rounded font-bold transition-colors ${
                      activeLogFilter === 'PIN_OTP' 
                        ? 'bg-amber-600 text-white' 
                        : 'bg-[#161D26] text-gray-400 hover:text-white'
                    }`}
                  >
                    Mã PIN
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveLogFilter('NFC_CARD')}
                    className={`px-2 py-1 text-[10px] font-mono rounded font-bold transition-colors ${
                      activeLogFilter === 'NFC_CARD' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-[#161D26] text-gray-400 hover:text-white'
                    }`}
                  >
                    Thẻ NFC
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveLogFilter('AUTO_LOCK')}
                    className={`px-2 py-1 text-[10px] font-mono rounded font-bold transition-colors ${
                      activeLogFilter === 'AUTO_LOCK' 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-[#161D26] text-gray-400 hover:text-white'
                    }`}
                  >
                    Tự Khóa
                  </button>
                </div>
              </div>

              {/* Timeline Items */}
              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {doorAccessLogs.filter(item => activeLogFilter === 'ALL' || item.method === activeLogFilter).length === 0 ? (
                  <div className="p-8 text-center bg-[#0D1117] border border-[#222B35] rounded-lg space-y-2 animate-fadeIn">
                    <div className="w-10 h-10 rounded-full bg-[#161D26] border border-[#2A374A] flex items-center justify-center mx-auto text-gray-400">
                      <History className="w-5 h-5 text-[#C5A880]" />
                    </div>
                    <div className="text-xs font-bold text-white">Chưa có nhật ký ra vào nào</div>
                    <div className="text-[11px] text-gray-400 max-w-sm mx-auto leading-relaxed">
                      Nhật ký sẽ tự động ghi lại mỗi khi cư dân mở chốt khóa, quét FaceID, sử dụng mã OTP khách hoặc khi hệ thống tự động khóa an toàn.
                    </div>
                  </div>
                ) : (
                  doorAccessLogs
                    .filter(item => activeLogFilter === 'ALL' || item.method === activeLogFilter)
                    .map((log) => {
                    const isSuccess = log.status === 'SUCCESS';
                    return (
                      <div 
                        key={log.id}
                        className="p-3 bg-[#0D1117] border border-[#222B35] rounded-lg transition-all hover:border-[#2F3D4D] space-y-1.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {/* Method Icon Badge */}
                            <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 text-xs ${
                              log.method === 'FACE_ID' ? 'bg-cyan-950 text-cyan-400 border border-cyan-500/40' :
                              log.method === 'PIN_OTP' ? 'bg-amber-950 text-amber-400 border border-amber-500/40' :
                              log.method === 'NFC_CARD' ? 'bg-blue-950 text-blue-400 border border-blue-500/40' :
                              log.method === 'AUTO_LOCK' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' :
                              'bg-purple-950 text-purple-400 border border-purple-500/40'
                            }`}>
                              {log.method === 'FACE_ID' && <ScanFace className="w-3.5 h-3.5" />}
                              {log.method === 'PIN_OTP' && <KeyRound className="w-3.5 h-3.5" />}
                              {log.method === 'NFC_CARD' && <CreditCard className="w-3.5 h-3.5" />}
                              {log.method === 'AUTO_LOCK' && <Lock className="w-3.5 h-3.5" />}
                              {log.method === 'REMOTE_APP' && <Shield className="w-3.5 h-3.5" />}
                            </div>

                            <div>
                              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                <span>{log.userName}</span>
                                <span className="text-[10px] text-gray-400 font-normal">({log.role})</span>
                              </div>
                              <div className="text-[9.5px] font-mono text-gray-500">
                                {log.timestamp}
                              </div>
                            </div>
                          </div>

                          <span className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded uppercase border ${
                            isSuccess 
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40' 
                              : 'bg-red-950 text-red-300 border-red-500/40'
                          }`}>
                            {isSuccess ? '✓ THÀNH CÔNG' : '✕ TỪ CHỐI'}
                          </span>
                        </div>

                        <p className="text-[11px] text-gray-300 pl-8 leading-relaxed">
                          {log.detail}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================= */}
      {/* 3D FACEID SCANNER HUD SIMULATION MODAL                         */}
      {/* ============================================================= */}
      {isScanningFace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="p-6 bg-[#0E1520] border-2 border-cyan-500 rounded-xl shadow-2xl max-w-md w-full mx-4 text-center space-y-4">
            <div className="text-xs uppercase tracking-[0.25em] text-cyan-400 font-mono font-bold flex items-center justify-center gap-2">
              <ScanFace className="w-4 h-4 animate-spin" /> SKYLINE BIOMETRIC AI VISION SCANNER
            </div>

            {/* Target Crosshairs & 3D Laser Beam */}
            <div className="relative w-48 h-48 mx-auto border-2 border-dashed border-cyan-500/50 rounded-full flex items-center justify-center overflow-hidden bg-cyan-950/20 shadow-lg shadow-cyan-500/20">
              <div className="w-36 h-36 rounded-full border border-cyan-400/40 flex items-center justify-center">
                <ScanFace className="w-20 h-20 text-cyan-300 animate-pulse" />
              </div>

              {/* Laser Scanning Beam */}
              <div 
                className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] transition-all duration-300"
                style={{ top: `${faceScanProgress}%` }}
              />

              {/* 4 Corner Markers */}
              <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-400" />
              <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-cyan-400" />
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-cyan-400" />
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-400" />
            </div>

            {/* Progress & Verification Status */}
            <div className="space-y-2">
              <div className="text-sm font-bold text-white">
                {faceScanSuccess 
                  ? '✓ XÁC THỰC THÀNH CÔNG!' 
                  : `Đang quét nhận diện khuôn mặt 3D AI (${faceScanProgress}%)...`}
              </div>
              <div className="w-full bg-[#16202E] h-2 rounded-full overflow-hidden border border-[#2A374A]">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300"
                  style={{ width: `${faceScanProgress}%` }}
                />
              </div>
              <div className="text-[11px] font-mono text-cyan-300">
                {faceScanSuccess 
                  ? `Khớp 99.4% • Cư Dân: ${currentUser.full_name || 'Lê Văn An'} (Chủ Hộ)`
                  : 'Đối soát 4 góc quét AI (Chính diện, Nghiêng trái, Nghiêng phải, Cười)'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Icon trợ giúp thẻ tín dụng / NFC nếu lucide không có sẵn CreditCardIcon
function CreditCardIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      {...props} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
  );
}
