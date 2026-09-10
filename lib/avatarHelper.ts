/**
 * SKYLINE SMART RESIDENCE - NKS API AVATAR HELPER
 * Ensures all avatar displays across Sidebar, Topbar Dropdown, Profile, and Modals
 * strictly resolve and format 100% official NKS API avatar URLs.
 */

export function formatApiAvatarUrl(rawAvatar?: string | null): string {
  if (!rawAvatar || typeof rawAvatar !== 'string') {
    return 'https://data.nks.vn/storage/users/default.png';
  }

  const trimmed = rawAvatar.trim();
  if (!trimmed) {
    return 'https://data.nks.vn/storage/users/default.png';
  }

  // Base64 data image from FaceID scan
  if (trimmed.startsWith('data:image/')) {
    return trimmed;
  }

  // Normalize double slashes often returned by NKS API (https://data.nks.vn//storage/...)
  let cleaned = trimmed.replace(/data\.nks\.vn\/\/+/g, 'data.nks.vn/');

  // Format relative paths
  if (cleaned.startsWith('storage/')) {
    cleaned = `https://data.nks.vn/${cleaned}`;
  } else if (cleaned.startsWith('/storage/')) {
    cleaned = `https://data.nks.vn${cleaned}`;
  } else if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = `https://data.nks.vn/${cleaned}`;
  }

  // Ensure no duplicate slashes in URL path after protocol
  cleaned = cleaned.replace(/([^:])\/{2,}/g, '$1/');

  return cleaned;
}

/**
 * Get user avatar prioritizing live API fields and local session overrides
 */
export function getUserApiAvatar(user?: any): string {
  if (!user) {
    return 'https://data.nks.vn/storage/users/default.png';
  }

  const userKey = user.phone || user.email || user.username || user.id || '';

  if (typeof window !== 'undefined' && userKey) {
    const cached = localStorage.getItem('skyline_user_avatar_' + userKey);
    if (cached) {
      return formatApiAvatarUrl(cached);
    }
  }

  const candidate = user.avatar_url || user.avatar || user.avatarUrl;
  return formatApiAvatarUrl(candidate);
}
