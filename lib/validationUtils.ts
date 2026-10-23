/**
 * Skyline Smart Residence — Validation Utilities
 * Centralized formatting and traps for phone numbers & citizen identity cards (CCCD).
 */

/**
 * Traps and cleans phone number input:
 * - Strips all non-digit characters.
 * - Converts international +84 / 84 prefix to standard 0.
 * - Restricts to max 10 digits.
 */
export function cleanPhoneNumber(value: string): string {
  if (!value) return '';
  let cleaned = value.trim().replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+84')) {
    cleaned = '0' + cleaned.slice(3);
  } else if (cleaned.startsWith('84') && cleaned.length > 9) {
    cleaned = '0' + cleaned.slice(2);
  }
  // Strip any remaining non-digit
  cleaned = cleaned.replace(/\D/g, '');
  return cleaned.slice(0, 10);
}

/**
 * Validates Vietnamese mobile phone numbers:
 * Must be exactly 10 digits and start with standard VN telco prefixes (03, 05, 07, 08, 09).
 */
export function isValidPhoneNumber(value: string): boolean {
  if (!value) return false;
  const cleaned = cleanPhoneNumber(value);
  return /^0[35789]\d{8}$/.test(cleaned);
}

/**
 * Returns user-friendly validation error for phone number (bilingual: VI / EN).
 */
export function getPhoneValidationError(value: string, isEn: boolean = false): string | null {
  if (!value || !value.trim()) {
    return isEn ? 'Please enter a contact phone number.' : 'Vui lòng nhập số điện thoại liên hệ.';
  }
  const cleaned = cleanPhoneNumber(value);
  if (cleaned.length < 10) {
    return isEn
      ? `Phone number must be exactly 10 digits (currently ${cleaned.length} digits).`
      : `Số điện thoại phải đủ 10 chữ số (hiện có ${cleaned.length} số).`;
  }
  if (!isValidPhoneNumber(cleaned)) {
    return isEn
      ? 'Invalid phone number (must start with prefix 03, 05, 07, 08 or 09).'
      : 'Số điện thoại không hợp lệ (phải bắt đầu bằng đầu số 03, 05, 07, 08 hoặc 09).';
  }
  return null;
}

/**
 * Traps and cleans CCCD / Citizen Identity Card input:
 * - Strips all non-digit characters.
 * - Restricts to max 12 digits.
 */
export function cleanCccdNumber(value: string): string {
  if (!value) return '';
  return value.replace(/\D/g, '').slice(0, 12);
}

/**
 * Validates Vietnamese 12-digit Citizen Identity Card (CCCD):
 * Must be exactly 12 numeric digits.
 */
export function isValidCccdNumber(value: string): boolean {
  if (!value) return false;
  const cleaned = cleanCccdNumber(value);
  return /^\d{12}$/.test(cleaned);
}

/**
 * Returns user-friendly validation error for CCCD (bilingual: VI / EN).
 */
export function getCccdValidationError(value: string, isEn: boolean = false): string | null {
  if (!value || !value.trim()) {
    return isEn ? 'Please enter a 12-digit Citizen Identity Card (CCCD).' : 'Vui lòng nhập số Căn Cước Công Dân (CCCD).';
  }
  const cleaned = cleanCccdNumber(value);
  if (cleaned.length !== 12) {
    return isEn
      ? `Citizen ID number must be exactly 12 digits (currently ${cleaned.length} digits).`
      : `Số CCCD phải gồm đúng 12 chữ số theo quy định (hiện có ${cleaned.length} số).`;
  }
  return null;
}
