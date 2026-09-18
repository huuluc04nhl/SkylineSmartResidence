/**
 * Skyline Smart Residence - Image to Base64 Processing Utility
 * Chuẩn hóa và đồng bộ hóa chuyển đổi hình ảnh sang Base64 theo đặc tả NKS API:
 * "* Công cụ chuyển đổi Image to Base 64"
 */

import { FaceBiometricSamples } from './biometricFaceEngine';

/**
 * Chuyển đổi File hoặc Blob hình ảnh thành chuỗi Base64 Data URL
 */
export function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('Tệp hình ảnh không hợp lệ.'));
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Không thể đọc dữ liệu hình ảnh dạng chuỗi Base64.'));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Chuyển đổi một URL hình ảnh (cục bộ hoặc từ xa) sang chuỗi Base64 Data URL
 */
export async function imageUrlToBase64(url: string): Promise<string> {
  if (!url || typeof url !== 'string') {
    throw new Error('URL hình ảnh không hợp lệ.');
  }

  // Nếu đã là Base64 Data URL
  if (url.startsWith('data:image/')) {
    return url;
  }

  // Nếu là base64 trơn (chưa có header data:image/jpeg;base64,)
  if (/^[A-Za-z0-9+/=]{100,}$/.test(url.trim())) {
    return `data:image/jpeg;base64,${url.trim()}`;
  }

  // Fetch dữ liệu ảnh từ URL và chuyển thành Base64
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Không thể tải hình ảnh từ URL: ${url} (HTTP ${response.status})`);
  }
  const blob = await response.blob();
  return fileToBase64(blob);
}

/**
 * Chuyển đổi HTMLCanvasElement sang chuỗi Base64 Data URL
 */
export function canvasToBase64(
  canvas: HTMLCanvasElement, 
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg',
  quality = 0.92
): string {
  if (!canvas) {
    throw new Error('Canvas không tồn tại.');
  }
  return canvas.toDataURL(mimeType, quality);
}

/**
 * Chuẩn hóa đầu vào ảnh bất kỳ sang định dạng Base64 Data URL chuẩn
 */
export async function convertImageToBase64(
  input: File | Blob | HTMLCanvasElement | string
): Promise<string> {
  if (!input) {
    throw new Error('Dữ liệu hình ảnh trống.');
  }

  if (typeof window !== 'undefined') {
    if (input instanceof File || input instanceof Blob) {
      return fileToBase64(input);
    }
    if (typeof HTMLCanvasElement !== 'undefined' && input instanceof HTMLCanvasElement) {
      return canvasToBase64(input);
    }
  }

  if (typeof input === 'string') {
    return imageUrlToBase64(input);
  }

  throw new Error('Định dạng hình ảnh đầu vào không được hỗ trợ.');
}

export interface RawFaceBiometricSamples {
  front?: string | null;
  left?: string | null;
  right?: string | null;
  smile?: string | null;
}

/**
 * Chuẩn hóa toàn bộ 4 mẫu khuôn mặt sinh trắc học sang Base64
 * (Chính diện, Nghiêng trái, Nghiêng phải, Cười/Liveness)
 */
export async function normalizeBiometricSamplesToBase64(
  samples: RawFaceBiometricSamples
): Promise<FaceBiometricSamples> {
  if (!samples.front || !samples.left || !samples.right || !samples.smile) {
    throw new Error('Yêu cầu đầy đủ 4 mẫu góc mặt: front, left, right, smile.');
  }

  const [frontB64, leftB64, rightB64, smileB64] = await Promise.all([
    convertImageToBase64(samples.front),
    convertImageToBase64(samples.left),
    convertImageToBase64(samples.right),
    convertImageToBase64(samples.smile),
  ]);

  return {
    front: frontB64,
    left: leftB64,
    right: rightB64,
    smile: smileB64,
  };
}

/**
 * Trích xuất phần chuỗi Base64 nguyên bản (bỏ tiền tố data:image/...;base64,)
 */
export function getRawBase64(base64WithHeader: string): string {
  if (!base64WithHeader || typeof base64WithHeader !== 'string') return '';
  return base64WithHeader.replace(/^data:image\/\w+;base64,/, '');
}
