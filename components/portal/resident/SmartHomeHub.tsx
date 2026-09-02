'use client';

import React, { useState } from 'react';
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
  Box
} from 'lucide-react';
import { User, UserRole, DEMO_APARTMENTS } from '@/lib/dataStore';
import ApartmentModel3DViewer from '@/components/portal/shared/ApartmentModel3DViewer';

interface SmartHomeHubProps {
  currentUser: User;
}

export default function SmartHomeHub({ currentUser }: SmartHomeHubProps) {
  const isOwner = currentUser.role === 'OWNER';
  const aptCode = currentUser.apartment_code || '12A05';

  // Smart Home State
  const [activeScene, setActiveScene] = useState<'AWAY' | 'CINEMA' | 'SLEEP' | 'WELCOME' | 'NONE'>('NONE');
  const [lights, setLights] = useState({
    livingRoom: true,
    bedroomMaster: true,
    kitchen: true,
    balcony: false,
  });
  const [acTemp, setAcTemp] = useState(24);
  const [acPower, setAcPower] = useState(true);
  const [curtainsOpen, setCurtainsOpen] = useState(true);
  const [masterDoorLocked, setMasterDoorLocked] = useState(true);
  const [mainPowerActive, setMainPowerActive] = useState(true);
  const [waterLeakSensorActive, setWaterLeakSensorActive] = useState(true);
  const [fireSensorActive, setFireSensorActive] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleToggleLight = (room: 'livingRoom' | 'bedroomMaster' | 'kitchen' | 'balcony') => {
    setLights(prev => {
      const next = { ...prev, [room]: !prev[room] };
      showToast(`⚡ Đã chuyển trạng thái đèn: ${room === 'livingRoom' ? 'Phòng khách' : room === 'bedroomMaster' ? 'Phòng ngủ' : room === 'kitchen' ? 'Bếp' : 'Ban công'}`);
      return next;
    });
  };

  const handleToggleDoor = () => {
    if (!isOwner) {
      showToast('⚠️ Chỉ Chủ Hộ mới có quyền đóng/mở khóa Master Door.');
      return;
    }
    setMasterDoorLocked(!masterDoorLocked);
    showToast(masterDoorLocked ? '🔓 Đã mở chốt khóa cửa chính FaceID.' : '🔒 Đã khóa chốt an toàn FaceID.');
  };

  const handleToggleCurtains = () => {
    setCurtainsOpen(!curtainsOpen);
    showToast(curtainsOpen ? '🌘 Đang đóng rèm cửa ban công.' : '☀️ Đang mở rèm đón ánh sáng tự nhiên.');
  };

  // Scene Automation Trigger
  const handleTriggerScene = (scene: 'AWAY' | 'CINEMA' | 'SLEEP' | 'WELCOME') => {
    setActiveScene(scene);

    if (scene === 'AWAY') {
      if (!isOwner) {
        showToast('⚠️ Chỉ Chủ Hộ mới có quyền kích hoạt chế độ "Đi Vắng" (Tắt toàn bộ hệ thống điện căn hộ).');
        return;
      }
      setLights({ livingRoom: false, bedroomMaster: false, kitchen: false, balcony: false });
      setAcPower(false);
      setCurtainsOpen(false);
      setMasterDoorLocked(true);
      showToast('🛡️ Đã kích hoạt [Chế Độ Đi Vắng]: Tắt toàn bộ đèn, tắt điều hòa, đóng rèm và kích hoạt khóa FaceID.');
    } else if (scene === 'CINEMA') {
      setLights({ livingRoom: false, bedroomMaster: false, kitchen: false, balcony: true });
      setAcTemp(23);
      setAcPower(true);
      setCurtainsOpen(false);
      showToast('🎬 Đã kích hoạt [Chế Độ Xem Phim]: Giảm ánh sáng 80%, đóng rèm và đặt điều hòa 23°C.');
    } else if (scene === 'SLEEP') {
      setLights({ livingRoom: false, bedroomMaster: false, kitchen: false, balcony: false });
      setAcTemp(26);
      setAcPower(true);
      setCurtainsOpen(false);
      setMasterDoorLocked(true);
      showToast('🌙 Đã kích hoạt [Chế Độ Đi Ngủ]: Khóa cửa an toàn, tắt toàn bộ đèn và giữ nhiệt độ 26°C.');
    } else if (scene === 'WELCOME') {
      setLights({ livingRoom: true, bedroomMaster: true, kitchen: true, balcony: true });
      setAcTemp(24);
      setAcPower(true);
      setCurtainsOpen(true);
      showToast('✨ Đã kích hoạt [Chế Độ Tiếp Khách]: Bật đèn đón, mở rèm ban công và lọc không khí.');
    }
  };

  return (
    <div className="space-y-6 w-full animate-fadeIn select-none">
      {/* Header & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222B35] pb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-semibold flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5" /> Điều Khiển Thiết Bị Thông Minh • Mô Hình Số 3D
          </div>
          <h2 className="font-serif text-2xl text-white font-bold mt-1">
            Trung Tâm Điều Khiển & Mô Hình 3D Căn Hộ {aptCode}
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
      {/* DIGITAL TWIN 3D / 2D INTERACTIVE SIMULATION MODEL CANVAS     */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-xs uppercase tracking-wider text-[#C5A880] font-bold flex items-center gap-1.5">
            <Box className="w-3.5 h-3.5" /> Mô Hình Digital Twin 3D / 2D Tương Tác Trực Tuyến:
          </div>
          <span className="text-[10px] text-gray-400 font-mono">
            * Đồng bộ 1:1 theo thời gian thực với thiết bị IoT căn hộ
          </span>
        </div>

        <ApartmentModel3DViewer
          apartmentCode={aptCode}
          apartmentType="2PN - 2WC (Master Suite)"
          clearArea={78.5}
          lights={lights}
          acPower={acPower}
          acTemp={acTemp}
          curtainsOpen={curtainsOpen}
          doorLocked={masterDoorLocked}
          waterLeakActive={waterLeakSensorActive}
          onToggleLight={handleToggleLight}
          onToggleDoor={handleToggleDoor}
          onToggleCurtains={handleToggleCurtains}
          interactive={true}
        />
      </div>

      {/* 1-Click Scenes Automation Strip */}
      <div className="p-5 bg-[#121820] border border-[#222B35] space-y-3 rounded">
        <div className="flex items-center justify-between">
          <div className="text-xs uppercase tracking-wider text-[#C5A880] font-bold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Ngữ Cảnh Tự Động Hóa 1-Chạm (Scene Automation):
          </div>
          {!isOwner && (
            <span className="text-[10px] text-gray-400 italic">
              * Người nhà kích hoạt ngữ cảnh sinh hoạt
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            onClick={() => handleTriggerScene('AWAY')}
            className={`p-3 border text-left transition-all rounded ${
              activeScene === 'AWAY'
                ? 'bg-[#1C2533] border-[#C5A880] text-white ring-1 ring-[#C5A880]'
                : 'bg-[#0D1117] border-[#222B35] text-gray-400 hover:border-gray-500'
            }`}
          >
            <div className="flex items-center justify-between">
              <Power className="w-4 h-4 text-red-400" />
              {activeScene === 'AWAY' && <CheckCircle2 className="w-3.5 h-3.5 text-[#C5A880]" />}
            </div>
            <div className="font-semibold text-xs text-white mt-2">Đi Vắng (Away)</div>
            <div className="text-[10px] text-gray-400">Tắt hết điện, khóa cửa</div>
          </button>

          <button
            onClick={() => handleTriggerScene('CINEMA')}
            className={`p-3 border text-left transition-all rounded ${
              activeScene === 'CINEMA'
                ? 'bg-[#1C2533] border-[#C5A880] text-white ring-1 ring-[#C5A880]'
                : 'bg-[#0D1117] border-[#222B35] text-gray-400 hover:border-gray-500'
            }`}
          >
            <div className="flex items-center justify-between">
              <Tv className="w-4 h-4 text-purple-400" />
              {activeScene === 'CINEMA' && <CheckCircle2 className="w-3.5 h-3.5 text-[#C5A880]" />}
            </div>
            <div className="font-semibold text-xs text-white mt-2">Xem Phim (Cinema)</div>
            <div className="text-[10px] text-gray-400">Đóng rèm, ánh sáng 20%</div>
          </button>

          <button
            onClick={() => handleTriggerScene('SLEEP')}
            className={`p-3 border text-left transition-all rounded ${
              activeScene === 'SLEEP'
                ? 'bg-[#1C2533] border-[#C5A880] text-white ring-1 ring-[#C5A880]'
                : 'bg-[#0D1117] border-[#222B35] text-gray-400 hover:border-gray-500'
            }`}
          >
            <div className="flex items-center justify-between">
              <Moon className="w-4 h-4 text-blue-400" />
              {activeScene === 'SLEEP' && <CheckCircle2 className="w-3.5 h-3.5 text-[#C5A880]" />}
            </div>
            <div className="font-semibold text-xs text-white mt-2">Đi Ngủ (Sleep)</div>
            <div className="text-[10px] text-gray-400">AC 26°C, khóa an toàn</div>
          </button>

          <button
            onClick={() => handleTriggerScene('WELCOME')}
            className={`p-3 border text-left transition-all rounded ${
              activeScene === 'WELCOME'
                ? 'bg-[#1C2533] border-[#C5A880] text-white ring-1 ring-[#C5A880]'
                : 'bg-[#0D1117] border-[#222B35] text-gray-400 hover:border-gray-500'
            }`}
          >
            <div className="flex items-center justify-between">
              <Sun className="w-4 h-4 text-amber-400" />
              {activeScene === 'WELCOME' && <CheckCircle2 className="w-3.5 h-3.5 text-[#C5A880]" />}
            </div>
            <div className="font-semibold text-xs text-white mt-2">Tiếp Khách (Welcome)</div>
            <div className="text-[10px] text-gray-400">Mở rèm, bật đèn đón</div>
          </button>
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
                onClick={() => {
                  setAcPower(!acPower);
                  showToast(acPower ? '❄️ Đã tắt điều hòa trung tâm.' : '❄️ Đã bật điều hòa Daikin Inverter.');
                }}
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
                  onClick={() => setAcTemp(t => Math.max(16, t - 1))}
                  className="w-8 h-8 bg-[#161B22] border border-gray-600 text-white font-bold hover:border-[#C5A880] rounded"
                >
                  -
                </button>
                <button
                  onClick={() => setAcTemp(t => Math.min(30, t + 1))}
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
                  setMainPowerActive(!mainPowerActive);
                  showToast(mainPowerActive ? '⚠️ Đã ngắt nguồn điện tổng căn hộ.' : '⚡ Đã cấp lại nguồn điện tổng.');
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
