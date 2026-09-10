import { EnrolledFaceProfile, FaceBiometricSamples, extractFaceDescriptorFromBase64 } from './biometricFaceEngine';
export type { EnrolledFaceProfile, FaceBiometricSamples } from './biometricFaceEngine';

const LOCAL_STORAGE_KEY = 'skyline_enrolled_faces_v1';

// Server-side global memory store
declare global {
  // eslint-disable-next-line no-var
  var __SKYLINE_ENROLLED_FACES: Record<string, EnrolledFaceProfile> | undefined;
}

/**
 * Khởi tạo danh sách khuôn mặt đã đăng ký
 */
function getServerStore(): Record<string, EnrolledFaceProfile> {
  if (!global.__SKYLINE_ENROLLED_FACES) {
    global.__SKYLINE_ENROLLED_FACES = {};
  }
  return global.__SKYLINE_ENROLLED_FACES;
}

/**
 * Lấy toàn bộ danh sách FaceID đã đăng ký (đồng bộ cả LocalStorage & Server Store)
 */
export function getAllEnrolledFaceProfiles(): EnrolledFaceProfile[] {
  const serverStore = getServerStore();
  const list: EnrolledFaceProfile[] = Object.values(serverStore);

  // Nếu ở client browser, hợp nhất từ LocalStorage
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const clientProfiles: EnrolledFaceProfile[] = JSON.parse(raw);
        if (Array.isArray(clientProfiles)) {
          clientProfiles.forEach(cp => {
            if (!list.some(p => p.userId === cp.userId)) {
              list.push(cp);
            }
          });
        }
      }
    } catch (e) {
      console.warn('Lỗi đọc LocalStorage enrolled faces:', e);
    }
  }

  return list;
}

/**
 * Lấy hồ sơ FaceID của một người dùng theo userId
 */
export function getEnrolledFaceProfile(userId: string): EnrolledFaceProfile | null {
  if (!userId) return null;

  // 1. Kiểm tra client localStorage
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const clientProfiles: EnrolledFaceProfile[] = JSON.parse(raw);
        const found = clientProfiles.find(p => p.userId === userId || p.phone === userId);
        if (found) return found;
      }
    } catch (e) {
      console.warn('Lỗi đọc client profile:', e);
    }
  }

  // 2. Kiểm tra server store
  const serverStore = getServerStore();
  return serverStore[userId] || null;
}

/**
 * Lưu trữ hoặc cập nhật hồ sơ FaceID đã đăng ký
 */
export function saveEnrolledFaceProfile(profile: EnrolledFaceProfile): void {
  if (!profile || !profile.userId) return;

  // 1. Lưu vào server store
  const serverStore = getServerStore();
  serverStore[profile.userId] = profile;

  // 2. Lưu vào client localStorage
  if (typeof window !== 'undefined') {
    try {
      let existing: EnrolledFaceProfile[] = [];
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        existing = JSON.parse(raw);
      }
      const idx = existing.findIndex(p => p.userId === profile.userId);
      if (idx >= 0) {
        existing[idx] = profile;
      } else {
        existing.push(profile);
      }
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existing));

      // Phát event thông báo UI cập nhật tức thời
      window.dispatchEvent(new CustomEvent('skyline_faceid_enrolled', { detail: profile }));
    } catch (e) {
      console.warn('Lỗi ghi LocalStorage enrolled faces:', e);
    }
  }
}

/**
 * Xóa hồ sơ FaceID (thu hồi quyền FaceID)
 */
export function removeEnrolledFaceProfile(userId: string): void {
  const serverStore = getServerStore();
  delete serverStore[userId];

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const existing: EnrolledFaceProfile[] = JSON.parse(raw);
        const filtered = existing.filter(p => p.userId !== userId);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
        window.dispatchEvent(new CustomEvent('skyline_faceid_enrolled', { detail: { userId, removed: true } }));
      }
    } catch (e) {
      console.warn('Lỗi xóa FaceID khỏi LocalStorage:', e);
    }
  }
}
