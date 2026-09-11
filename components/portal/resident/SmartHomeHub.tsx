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
  ToggleRight
} from 'lucide-react';
import { User, UserRole } from '@/lib/dataStore';
import { getApartmentByCode } from '@/lib/apartmentStore';
import { 
  getSmartHomeState, 
  saveSmartHomeState, 
  applyScene, 
  getAutomationRules, 
  toggleAutomationRule, 
  SmartHomeState, 
  AutomationRule, 
  SceneType 
} from '@/lib/smartHomeStore';
import ApartmentModel3DViewer from '@/components/portal/shared/ApartmentModel3DViewer';

interface SmartHomeHubProps {
  currentUser: User;
}

export default function SmartHomeHub({ currentUser }: SmartHomeHubProps) {
  const isOwner = currentUser.role === 'OWNER';
  const aptCode = currentUser.apartment_code || '12A05';
  const aptUnit = getApartmentByCode(aptCode);
  const aptArea = aptUnit ? aptUnit.area : 78.5;
  const aptType = aptUnit ? aptUnit.typeLabel : '2PN - 2WC';

  // Smart Home State từ Storage Store
  const [smartState, setSmartState] = useState<SmartHomeState>(() => getSmartHomeState(aptCode));
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>(() => getAutomationRules(aptCode));
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const {
    lights,
    acTemp,
    acPower,
    curtainsOpen,
    doorLocked: masterDoorLocked,
    mainPowerActive,
    waterLeakSensorActive,
    fireSensorActive,
    activeScene
  } = smartState;

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
    if (!isOwner) {
      showToast('⚠️ Chỉ Chủ Hộ mới có quyền đóng/mở khóa Master Door FaceID.');
      return;
    }
    const updated = saveSmartHomeState(aptCode, { doorLocked: !smartState.doorLocked });
    setSmartState(updated);
    showToast(updated.doorLocked ? '🔒 Đã khóa chốt an toàn FaceID cửa chính.' : '🔓 Đã mở chốt khóa cửa chính FaceID.');
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

      {/* Main Grid: Device Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Everyday Living Devices (Accessible to Both) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="text-xs uppercase tracking-wider text-[#C5A880] font-bold flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5" /> Thiết Bị Chiếu Sáng & Không Khí (Sinh Hoạt)
          </div>

          {/* Lights Subgrid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-[#121820] border border-[#222B35] flex items-center justify-between rounded">
              <div>
                <div className="text-xs font-semibold text-white">Đèn Phòng Khách</div>
                <div className="text-[10px] text-gray-400">{lights.livingRoom ? 'Đang sáng 100%' : 'Đã tắt'}</div>
              </div>
              <button
                onClick={() => handleToggleLight('livingRoom')}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                  lights.livingRoom ? 'bg-[#C5A880]' : 'bg-gray-700'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${lights.livingRoom ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="p-4 bg-[#121820] border border-[#222B35] flex items-center justify-between rounded">
              <div>
                <div className="text-xs font-semibold text-white">Đèn Phòng Ngủ Master</div>
                <div className="text-[10px] text-gray-400">{lights.bedroomMaster ? 'Đang sáng' : 'Đã tắt'}</div>
              </div>
              <button
                onClick={() => handleToggleLight('bedroomMaster')}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                  lights.bedroomMaster ? 'bg-[#C5A880]' : 'bg-gray-700'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${lights.bedroomMaster ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="p-4 bg-[#121820] border border-[#222B35] flex items-center justify-between rounded">
              <div>
                <div className="text-xs font-semibold text-white">Đèn Bếp & Bar</div>
                <div className="text-[10px] text-gray-400">{lights.kitchen ? 'Đang sáng' : 'Đã tắt'}</div>
              </div>
              <button
                onClick={() => handleToggleLight('kitchen')}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                  lights.kitchen ? 'bg-[#C5A880]' : 'bg-gray-700'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${lights.kitchen ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="p-4 bg-[#121820] border border-[#222B35] flex items-center justify-between rounded">
              <div>
                <div className="text-xs font-semibold text-white">Rèm Cửa Ban Công</div>
                <div className="text-[10px] text-gray-400">{curtainsOpen ? 'Đang mở (100%)' : 'Đã đóng kín'}</div>
              </div>
              <button
                onClick={handleToggleCurtains}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors rounded ${
                  curtainsOpen ? 'bg-[#C5A880] text-[#0D1117]' : 'bg-gray-800 text-gray-300'
                }`}
              >
                {curtainsOpen ? 'Đóng Rèm' : 'Mở Rèm'}
              </button>
            </div>
          </div>

          {/* AC Climate Control */}
          <div className="p-4 bg-[#121820] border border-[#222B35] space-y-3 rounded">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wind className="w-4 h-4 text-[#C5A880]" />
                <span className="text-xs font-semibold text-white">Điều Hòa Trung Tâm Daikin Inverter</span>
              </div>
              <button
                onClick={handleToggleAC}
                className={`px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold rounded ${
                  acPower ? 'bg-emerald-950 text-emerald-300 border border-emerald-500' : 'bg-red-950 text-red-300 border border-red-500'
                }`}
              >
                {acPower ? 'Đang Bật' : 'Đã Tắt'}
              </button>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-2xl font-mono font-bold text-white">{acTemp}°C</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleChangeTemp(-1)}
                  className="w-8 h-8 bg-[#161B22] border border-gray-600 text-white font-bold hover:border-[#C5A880] rounded"
                >
                  -
                </button>
                <button
                  onClick={() => handleChangeTemp(1)}
                  className="w-8 h-8 bg-[#161B22] border border-gray-600 text-white font-bold hover:border-[#C5A880] rounded"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Master Security & Sensitive Sensors */}
        <div className="lg:col-span-5 space-y-4">
          <div className="text-xs uppercase tracking-wider text-[#C5A880] font-bold flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" /> An Ninh & Cảm Biến Nhạy Cảm
            </span>
            {!isOwner && (
              <span className="text-[10px] text-amber-400 font-mono">Bảo Vệ Bởi Chủ Hộ</span>
            )}
          </div>

          {/* Master FaceID Door Lock */}
          <div className={`p-4 border transition-all rounded ${
            isOwner ? 'bg-[#121820] border-[#222B35]' : 'bg-[#161B22]/60 border-amber-900/40 relative'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#C5A880]" />
                <div>
                  <div className="text-xs font-semibold text-white">Khóa Cửa Chính FaceID Master</div>
                  <div className="text-[10px] text-gray-400">{masterDoorLocked ? 'Đang khóa chốt an toàn' : 'Đang mở khóa'}</div>
                </div>
              </div>

              {isOwner ? (
                <button
                  onClick={handleToggleDoor}
                  className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded ${
                    masterDoorLocked ? 'bg-[#C5A880] text-[#0D1117]' : 'bg-red-600 text-white'
                  }`}
                >
                  {masterDoorLocked ? 'Mở Khóa' : 'Khóa Chốt'}
                </button>
              ) : (
                <div className="p-1.5 bg-amber-950/80 border border-amber-500/50 text-amber-400 text-[10px] font-mono flex items-center gap-1 rounded">
                  <LockKeyhole className="w-3 h-3" /> Khóa Chủ Hộ
                </div>
              )}
            </div>
          </div>

          {/* AI Night Water Leakage Sensor */}
          <div className={`p-4 border transition-all rounded ${
            isOwner ? 'bg-[#121820] border-[#222B35]' : 'bg-[#161B22]/60 border-amber-900/40'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-blue-400" />
                <div>
                  <div className="text-xs font-semibold text-white">Cảm Biến AI Rò Rỉ Nước Đêm (2h-4h)</div>
                  <div className="text-[10px] text-emerald-400">Trạng thái: An toàn (0.00 L/h)</div>
                </div>
              </div>
              {isOwner ? (
                <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-500 text-[10px] font-mono rounded">
                  ACTIVE
                </span>
              ) : (
                <LockKeyhole className="w-3.5 h-3.5 text-amber-400" />
              )}
            </div>
          </div>

          {/* Fire & Smoke Alarm PCCC */}
          <div className={`p-4 border transition-all rounded ${
            isOwner ? 'bg-[#121820] border-[#222B35]' : 'bg-[#161B22]/60 border-amber-900/40'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-red-400" />
                <div>
                  <div className="text-xs font-semibold text-white">Cảm Biến Khói PCCC & Gas Tòa Nhà</div>
                  <div className="text-[10px] text-emerald-400">Nồng độ CO: 0.0 ppm (Bình thường)</div>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-500 text-[10px] font-mono rounded">
                24/7 AUTO
              </span>
            </div>
          </div>

          {/* Main Circuit Breaker (Owner Exclusive) */}
          {isOwner ? (
            <div className="p-4 bg-[#121820] border border-[#222B35] flex items-center justify-between rounded">
              <div className="flex items-center gap-2">
                <Power className="w-4 h-4 text-[#C5A880]" />
                <div>
                  <div className="text-xs font-semibold text-white">Aptomat Điện Tổng Căn Hộ</div>
                  <div className="text-[10px] text-gray-400">Nguồn 220V - 40A Tải an toàn</div>
                </div>
              </div>
              <button
                onClick={() => {
                  const updated = saveSmartHomeState(aptCode, { mainPowerActive: !mainPowerActive });
                  setSmartState(updated);
                  showToast(updated.mainPowerActive ? '⚡ Đã cấp lại nguồn điện tổng căn hộ.' : '⚠️ Đã ngắt nguồn điện tổng căn hộ.');
                }}
                className={`px-3 py-1 text-xs font-bold uppercase rounded ${
                  mainPowerActive ? 'bg-emerald-900 text-emerald-200 border border-emerald-500' : 'bg-red-600 text-white'
                }`}
              >
                {mainPowerActive ? 'BẬT (ON)' : 'NGẮT (OFF)'}
              </button>
            </div>
          ) : (
            <div className="p-3 bg-amber-950/40 border border-amber-900/60 text-[11px] text-amber-300 flex items-start gap-2 rounded">
              <LockKeyhole className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-amber-400" />
              <span>
                <strong>Cơ chế bảo vệ:</strong> Nguồn điện tổng và hệ thống cảm biến kỹ thuật chỉ thuộc quyền quản lý của Chủ sở hữu (Owner).
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
