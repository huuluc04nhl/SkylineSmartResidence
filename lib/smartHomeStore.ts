// ============================================================================
// SMART HOME STORE & SCENE AUTOMATION - SKYLINE RESIDENCE (SRS COMPLIANT)
// Quản lý trạng thái thiết bị thực tế, Ngữ cảnh 1-chạm & Kịch bản tự động hóa
// ============================================================================

export type SceneType = 'WELCOME' | 'AWAY' | 'SLEEP' | 'CINEMA' | 'DINING' | 'NONE';

export interface SmartHomeState {
  apartmentCode: string;
  lights: {
    livingRoom: boolean;
    bedroomMaster: boolean;
    kitchen: boolean;
    balcony: boolean;
  };
  acPower: boolean;
  acTemp: number;
  curtainsOpen: boolean;
  doorLocked: boolean;
  mainPowerActive: boolean;
  waterLeakSensorActive: boolean;
  fireSensorActive: boolean;
  activeScene: SceneType;
  lastUpdated: string;
}

export interface AutomationRule {
  id: string;
  title: string;
  triggerTime: string; // e.g. "06:30"
  triggerType: 'TIME' | 'SENSOR' | 'CLIMATE';
  triggerLabel: string;
  description: string;
  actionSummary: string;
  enabled: boolean;
  repeatDays: string; // e.g. "Hàng ngày", "T2 - T6"
  icon: 'sun' | 'moon' | 'shield' | 'droplet' | 'wind';
}

const DEFAULT_STATE: SmartHomeState = {
  apartmentCode: '12A05',
  lights: {
    livingRoom: true,
    bedroomMaster: true,
    kitchen: true,
    balcony: false
  },
  acPower: true,
  acTemp: 24,
  curtainsOpen: true,
  doorLocked: true,
  mainPowerActive: true,
  waterLeakSensorActive: true,
  fireSensorActive: true,
  activeScene: 'WELCOME',
  lastUpdated: new Date().toISOString()
};

const DEFAULT_RULES: AutomationRule[] = [
  {
    id: 'rule_morning',
    title: 'Bình Minh Thức Giấc & Nắng Sớm',
    triggerTime: '06:30',
    triggerType: 'TIME',
    triggerLabel: 'Hẹn giờ 06:30 sáng',
    description: 'Tự động mở rèm ban công đón ánh sáng tự nhiên, tắt điều hòa và tắt đèn phòng ngủ.',
    actionSummary: 'Mở rèm 100% • Tắt Đèn PN Master • Tắt AC',
    enabled: true,
    repeatDays: 'Hàng ngày',
    icon: 'sun'
  },
  {
    id: 'rule_sunset',
    title: 'Hoàng Hôn & Chiếu Sáng Chào Đón',
    triggerTime: '18:30',
    triggerType: 'TIME',
    triggerLabel: 'Hẹn giờ 18:30 chiều',
    description: 'Tự động bật hệ thống đèn phòng khách và đèn bếp đón các thành viên trở về nhà.',
    actionSummary: 'Bật Đèn PK 100% • Bật Đèn Bếp • Bật AC 24°C',
    enabled: true,
    repeatDays: 'Hàng ngày',
    icon: 'moon'
  },
  {
    id: 'rule_night_secure',
    title: 'An Ninh Chốt Khóa Đêm & Chế Độ Ngủ',
    triggerTime: '23:00',
    triggerType: 'TIME',
    triggerLabel: 'Hẹn giờ 23:00 đêm',
    description: 'Tự động kiểm tra chốt an toàn FaceID cửa chính, đóng kín rèm và chuyển điều hòa sang 26°C.',
    actionSummary: 'Khóa Chốt FaceID • Đóng Rèm • AC 26°C (Sleep) • Tắt Đèn PK',
    enabled: true,
    repeatDays: 'Hàng ngày',
    icon: 'shield'
  },
  {
    id: 'rule_water_guard',
    title: 'AI Canh Gác Rò Rỉ Nước Ban Đêm',
    triggerTime: '02:00 - 04:00',
    triggerType: 'SENSOR',
    triggerLabel: 'Cảm biến lưu lượng AI đêm',
    description: 'Tự động giám sát lưu lượng dòng chảy van cấp nước. Cảnh báo khẩn nếu có thất thoát vòi rửa.',
    actionSummary: 'Quét lưu lượng 0.00 L/h • Cảnh báo loa Hub & App',
    enabled: true,
    repeatDays: 'Khung giờ ngủ sâu (02:00 - 04:00)',
    icon: 'droplet'
  },
  {
    id: 'rule_air_clean',
    title: 'Tự Động Lọc Không Khí Daikin Khi Bụi Mịn Tăng',
    triggerTime: 'AQI > 50',
    triggerType: 'CLIMATE',
    triggerLabel: 'Cảm biến chất lượng không khí AQI',
    description: 'Khi phát hiện mật độ bụi mịn trong nhà vượt mức 50, tự động kích hoạt chế độ lọc ion Streamer.',
    actionSummary: 'Tăng tốc độ quạt gió • Bật phát ion Streamer Daikin',
    enabled: true,
    repeatDays: 'Tự động kích hoạt 24/7',
    icon: 'wind'
  }
];

const STORAGE_STATE_KEY = 'skyline_smarthome_state_';
const STORAGE_RULES_KEY = 'skyline_smarthome_rules_';

export function getSmartHomeState(aptCode: string = '12A05'): SmartHomeState {
  if (typeof window === 'undefined') return { ...DEFAULT_STATE, apartmentCode: aptCode };
  try {
    const raw = localStorage.getItem(`${STORAGE_STATE_KEY}${aptCode}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading smart home state:', e);
  }
  return { ...DEFAULT_STATE, apartmentCode: aptCode };
}

export function saveSmartHomeState(aptCode: string, patch: Partial<SmartHomeState>): SmartHomeState {
  const current = getSmartHomeState(aptCode);
  const updated: SmartHomeState = {
    ...current,
    ...patch,
    apartmentCode: aptCode,
    lastUpdated: new Date().toISOString()
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`${STORAGE_STATE_KEY}${aptCode}`, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('skyline_smarthome_update', { detail: updated }));
    } catch (e) {
      console.error('Error saving smart home state:', e);
    }
  }

  return updated;
}

export function applyScene(aptCode: string, scene: SceneType): { state: SmartHomeState; message: string } {
  const current = getSmartHomeState(aptCode);
  let patch: Partial<SmartHomeState> = { activeScene: scene };
  let message = '';

  switch (scene) {
    case 'WELCOME':
      patch = {
        activeScene: 'WELCOME',
        lights: { livingRoom: true, bedroomMaster: true, kitchen: true, balcony: true },
        acPower: true,
        acTemp: 24,
        curtainsOpen: true,
        doorLocked: false // Mở chốt đón cư dân
      };
      message = '🏡 Đã kích hoạt [Ngữ Cảnh Về Nhà]: Bật đèn đón, mở rèm ban công, điều hòa 24°C và mở chốt cửa an toàn.';
      break;

    case 'AWAY':
      patch = {
        activeScene: 'AWAY',
        lights: { livingRoom: false, bedroomMaster: false, kitchen: false, balcony: false },
        acPower: false,
        curtainsOpen: false,
        doorLocked: true
      };
      message = '🚪 Đã kích hoạt [Ngữ Cảnh Ra Ngoài]: Tắt toàn bộ đèn, tắt điều hòa, đóng rèm và chốt khóa FaceID.';
      break;

    case 'SLEEP':
      patch = {
        activeScene: 'SLEEP',
        lights: { livingRoom: false, bedroomMaster: false, kitchen: false, balcony: false },
        acPower: true,
        acTemp: 26,
        curtainsOpen: false,
        doorLocked: true
      };
      message = '🌙 Đã kích hoạt [Ngữ Cảnh Đi Ngủ]: Tắt toàn bộ đèn, điều hòa duy trì 26°C êm dịu, đóng rèm và khóa an toàn.';
      break;

    case 'CINEMA':
      patch = {
        activeScene: 'CINEMA',
        lights: { livingRoom: false, bedroomMaster: false, kitchen: false, balcony: true },
        acPower: true,
        acTemp: 23,
        curtainsOpen: false
      };
      message = '🎬 Đã kích hoạt [Ngữ Cảnh Xem Phim]: Giảm ánh sáng 85%, đóng kín rèm và bật điều hòa mát lạnh 23°C.';
      break;

    case 'DINING':
      patch = {
        activeScene: 'DINING',
        lights: { livingRoom: true, bedroomMaster: false, kitchen: true, balcony: true },
        acPower: true,
        acTemp: 23,
        curtainsOpen: true
      };
      message = '🍽️ Đã kích hoạt [Ngữ Cảnh Ăn Tối & Tiệc]: Bật sáng khu bếp và bàn ăn, mở rèm ngắm cảnh đêm, điều hòa 23°C.';
      break;

    default:
      patch = { activeScene: 'NONE' };
      message = 'Đã khôi phục chế độ tùy chỉnh thủ công.';
  }

  const updated = saveSmartHomeState(aptCode, patch);
  return { state: updated, message };
}

export function getAutomationRules(aptCode: string = '12A05'): AutomationRule[] {
  if (typeof window === 'undefined') return DEFAULT_RULES;
  try {
    const raw = localStorage.getItem(`${STORAGE_RULES_KEY}${aptCode}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading automation rules:', e);
  }
  return DEFAULT_RULES;
}

export function toggleAutomationRule(aptCode: string, ruleId: string): AutomationRule[] {
  const rules = getAutomationRules(aptCode);
  const updated = rules.map(r => r.id === ruleId ? { ...r, enabled: !r.enabled } : r);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`${STORAGE_RULES_KEY}${aptCode}`, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('skyline_automation_rules_update', { detail: updated }));
    } catch (e) {
      console.error('Error saving automation rules:', e);
    }
  }
  return updated;
}
