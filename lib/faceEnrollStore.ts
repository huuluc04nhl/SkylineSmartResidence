import { EnrolledFaceProfile, FaceBiometricSamples, extractFaceDescriptorFromBase64 } from './biometricFaceEngine';
export type { EnrolledFaceProfile, FaceBiometricSamples } from './biometricFaceEngine';

const LOCAL_STORAGE_KEY = 'skyline_enrolled_faces_v1';

// Server-side global memory store
declare global {
  // eslint-disable-next-line no-var
  var __SKYLINE_ENROLLED_FACES: Record<string, EnrolledFaceProfile> | undefined;
}

/**
 * Đọc dữ liệu bền vững từ file .skyline_faces.json trên Server Node.js
 */
function loadProfilesFromFile(): Record<string, EnrolledFaceProfile> {
  if (typeof window !== 'undefined') return {};
  try {
    // Dynamic require để không bị phân tích tĩnh trên client browser bundle
    const req = eval('require');
    const fs = req('fs');
    const path = req('path');
    const filePath = path.join(process.cwd(), '.skyline_faces.json');
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {
    // Không log lỗi nếu chạy trên môi trường edge/browser
  }
  return {};
}

/**
 * Ghi dữ liệu bền vững ra file .skyline_faces.json trên Server Node.js
 */
function saveProfilesToFile(store: Record<string, EnrolledFaceProfile>): void {
  if (typeof window !== 'undefined') return;
  try {
    const req = eval('require');
    const fs = req('fs');
    const path = req('path');
    const filePath = path.join(process.cwd(), '.skyline_faces.json');
    fs.writeFileSync(filePath, JSON.stringify(store, null, 2), 'utf-8');
  } catch (e) {
    // Không log lỗi nếu chạy trên môi trường edge/browser
  }
}

/**
 * Khởi tạo danh sách khuôn mặt đã đăng ký trên server
 */
function getServerStore(): Record<string, EnrolledFaceProfile> {
  if (!global.__SKYLINE_ENROLLED_FACES) {
    global.__SKYLINE_ENROLLED_FACES = loadProfilesFromFile();
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
            if (!list.some(p => p.userId === cp.userId || (cp.phone && p.phone === cp.phone))) {
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
 * Lấy hồ sơ FaceID của một người dùng theo userId hoặc phone
 */
export function getEnrolledFaceProfile(userId: string): EnrolledFaceProfile | null {
  if (!userId) return null;
  const cleanId = userId.toLowerCase().trim();

  // 1. Kiểm tra client localStorage
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const clientProfiles: EnrolledFaceProfile[] = JSON.parse(raw);
        const found = clientProfiles.find(p => 
          (p.userId && p.userId.toLowerCase().trim() === cleanId) || 
          (p.phone && p.phone.toLowerCase().trim() === cleanId)
        );
        if (found) return found;
      }
    } catch (e) {
      console.warn('Lỗi đọc client profile:', e);
    }
  }

  // 2. Kiểm tra server store
  const serverStore = getServerStore();
  if (serverStore[userId]) return serverStore[userId];

  // Tìm kiếm theo phone hoặc userId
  const found = Object.values(serverStore).find(p => 
    (p.userId && p.userId.toLowerCase().trim() === cleanId) || 
    (p.phone && p.phone.toLowerCase().trim() === cleanId)
  );
  return found || null;
}

/**
 * Lưu trữ hoặc cập nhật hồ sơ FaceID đã đăng ký
 */
export function saveEnrolledFaceProfile(profile: EnrolledFaceProfile): void {
  if (!profile || !profile.userId) return;

  // 1. Lưu vào server store và ghi ra file bền vững
  const serverStore = getServerStore();
  serverStore[profile.userId] = profile;
  if (profile.phone) {
    serverStore[profile.phone] = profile;
  }
  saveProfilesToFile(serverStore);

  // 2. Lưu vào client localStorage
  if (typeof window !== 'undefined') {
    try {
      let existing: EnrolledFaceProfile[] = [];
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        existing = JSON.parse(raw);
      }
      const idx = existing.findIndex(p => p.userId === profile.userId || (profile.phone && p.phone === profile.phone));
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
 * Cập nhật trạng thái phê duyệt FaceID (ACTIVE / PENDING / REVOKED)
 */
export function updateEnrolledFaceStatus(userId: string, status: 'ACTIVE' | 'PENDING' | 'REVOKED'): EnrolledFaceProfile | null {
  const profile = getEnrolledFaceProfile(userId);
  if (!profile) return null;

  profile.status = status;
  saveEnrolledFaceProfile(profile);
  return profile;
}

/**
 * Xóa hồ sơ FaceID (thu hồi quyền FaceID)
 */
export function removeEnrolledFaceProfile(userId: string): void {
  const serverStore = getServerStore();
  delete serverStore[userId];
  saveProfilesToFile(serverStore);

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const existing: EnrolledFaceProfile[] = JSON.parse(raw);
        const filtered = existing.filter(p => p.userId !== userId && p.phone !== userId);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
        window.dispatchEvent(new CustomEvent('skyline_faceid_enrolled', { detail: { userId, removed: true } }));
      }
    } catch (e) {
      console.warn('Lỗi xóa FaceID khỏi LocalStorage:', e);
    }
  }
}
