/**
 * Resilient WebRTC Camera Stream Helper
 * Supports Progressive Multi-tier Constraints Fallback & Actionable Diagnostics
 */

export interface CameraDiagnosticResult {
  stream?: MediaStream;
  error?: string;
  isBlockedByPermission?: boolean;
  isNotSecureContext?: boolean;
  isOccupiedByAnotherApp?: boolean;
  isNotFound?: boolean;
}

/**
 * Attempt to acquire camera stream with resilient progressive fallbacks
 */
export async function getResilientCameraStream(): Promise<MediaStream> {
  if (typeof window === 'undefined') {
    throw new Error('Môi trường trình duyệt không hỗ trợ WebRTC.');
  }

  // 1. Check Secure Context (HTTPS or localhost)
  // Modern browsers strictly disable navigator.mediaDevices on unsecure HTTP (e.g. http://192.168.1.x:3000)
  if (window.isSecureContext === false) {
    throw new Error(
      'Trình duyệt chỉ cho phép bật Camera trên kết nối bảo mật (HTTPS) hoặc http://localhost. ' +
      'Nếu bạn đang mở qua địa chỉ IP mạng LAN (VD: 192.168.x.x), trình duyệt sẽ chặn camera. ' +
      'Vui lòng truy cập qua http://localhost:3000 hoặc dùng tính năng Tải Ảnh.'
    );
  }

  if (!navigator?.mediaDevices?.getUserMedia) {
    throw new Error(
      'Trình duyệt không hỗ trợ WebRTC MediaDevices API. ' +
      'Vui lòng cập nhật Google Chrome, Microsoft Edge hoặc Safari phiên bản mới nhất.'
    );
  }

  // 2. Tier 1: Front camera with ideal 640x480 (non-strict facingMode)
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: { ideal: 'user' },
      },
      audio: false,
    });
    return stream;
  } catch (err1: any) {
    console.warn('Camera Tier 1 failed, trying Tier 2 (no facingMode)...', err1);
  }

  // 3. Tier 2: Without facingMode constraint (essential for USB webcams & virtual cams)
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
      },
      audio: false,
    });
    return stream;
  } catch (err2: any) {
    console.warn('Camera Tier 2 failed, trying Tier 3 (pure video:true)...', err2);
  }

  // 4. Tier 3: Pure basic constraint without resolution limits
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });
    return stream;
  } catch (err3: any) {
    console.error('All camera tiers failed:', err3);
    const errName = err3?.name || '';
    const errMessage = err3?.message || '';

    if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
      throw new Error(
        'Quyền truy cập Camera bị chặn: Vui lòng nhấp vào biểu tượng 🔒 hoặc 📷 trên thanh địa chỉ URL của trình duyệt ➔ Chọn "Cho phép (Allow)" cho Máy ảnh rồi thử lại.'
      );
    }

    if (errName === 'NotReadableError' || errName === 'TrackStartError') {
      throw new Error(
        'Camera đang bị ứng dụng khác chiếm giữ: Vui lòng tắt các phần mềm đang dùng webcam (Zoom, Teams, Zalo, OBS, Camera Windows...) hoặc tab trình duyệt khác rồi thử lại.'
      );
    }

    if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
      throw new Error(
        'Không tìm thấy thiết bị Camera nào trên máy tính. Bạn có thể cắm webcam hoặc chuyển sang chế độ Tải Ảnh.'
      );
    }

    if (errName === 'OverconstrainedError') {
      throw new Error(
        'Camera phần cứng không đáp ứng thông số phân giải. Hãy thử kết nối lại.'
      );
    }

    throw new Error(
      errMessage || 'Không thể kết nối đến thiết bị Camera. Vui lòng kiểm tra quyền hoặc chuyển sang chế độ tải ảnh.'
    );
  }
}
