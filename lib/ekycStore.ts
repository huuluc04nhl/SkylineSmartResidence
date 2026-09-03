/**
 * e-KYC Resident Identity Verification & FaceID Access Store
 * 
 * Synchronizes resident e-KYC submissions (CCCD OCR & FaceID photos)
 * with Ban Quản Lý (BQL) approval desk in real-time.
 */

export type EkycStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'VERIFIED';

export interface EkycRequest {
  id: string;
  userId: string;
  fullName: string;
  roleLabel: string;
  apartmentCode: string;
  phone: string;
  email?: string;
  idCardNo: string;
  idDate: string;
  idPlace: string;
  dob?: string;
  pob?: string;
  faceScore: number;
  avatarUrl: string;
  idCardFrontUrl: string;
  idCardBackUrl: string;
  submittedAt: string;
  status: EkycStatus;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

const STORAGE_KEY = 'skyline_ekyc_requests_v2';

export const INITIAL_EKYC_REQUESTS: EkycRequest[] = [
  {
    id: 'EKYC-120',
    userId: 'user-owner-1',
    fullName: 'Nguyễn Hữu Lực',
    roleLabel: 'Chủ Hộ (Căn 12A05)',
    apartmentCode: '12A05',
    phone: '0364967082',
    email: 'huuluc04@gmail.com',
    idCardNo: '067204000961',
    idDate: '2022-08-18',
    idPlace: 'Cục Cảnh sát QLHC về TTXH',
    dob: '2004-08-18',
    pob: 'Triệu Trạch, Triệu Phong, Quảng Trị',
    faceScore: 99.4,
    avatarUrl: 'https://data.nks.vn/storage/users/202609021654232258.jpg',
    idCardFrontUrl: 'https://images.unsplash.com/photo-1578852612716-854e527abf2e?w=600',
    idCardBackUrl: 'https://images.unsplash.com/photo-1578852612716-854e527abf2e?w=600',
    submittedAt: '02/09/2026 14:30',
    status: 'APPROVED',
    reviewedAt: '02/09/2026 15:10',
    reviewedBy: 'BQL Trực Ban (Admin)',
  },
  {
    id: 'EKYC-121',
    userId: 'user-tenant-1',
    fullName: 'Nguyễn Hữu Nhựt',
    roleLabel: 'Người Nhà (Căn 12A05)',
    apartmentCode: '12A05',
    phone: '0917795211',
    email: 'nguyenhuunhut1309@gmail.com',
    idCardNo: '079198005678',
    idDate: '2023-01-10',
    idPlace: 'Cục Cảnh sát QLHC về TTXH',
    dob: '2004-09-02',
    faceScore: 98.6,
    avatarUrl: 'https://data.nks.vn/storage/users/202607191405195335.jpg',
    idCardFrontUrl: 'https://images.unsplash.com/photo-1578852612716-854e527abf2e?w=600',
    idCardBackUrl: 'https://images.unsplash.com/photo-1578852612716-854e527abf2e?w=600',
    submittedAt: '03/09/2026 09:15',
    status: 'PENDING',
  },
  {
    id: 'EKYC-122',
    userId: 'user-member-1',
    fullName: 'Nguyễn Văn Cường',
    roleLabel: 'Người Nhà (Căn 12A05)',
    apartmentCode: '12A05',
    phone: '0325524482',
    email: 'vanncuong1614@gmail.com',
    idCardNo: '074204001708',
    idDate: '2022-11-20',
    idPlace: 'Cục Cảnh sát QLHC về TTXH',
    dob: '2004-01-16',
    pob: 'Tỉnh Thanh Hóa',
    faceScore: 97.8,
    avatarUrl: 'https://data.nks.vn/storage/users/202608301345022366.jpg',
    idCardFrontUrl: 'https://images.unsplash.com/photo-1578852612716-854e527abf2e?w=600',
    idCardBackUrl: 'https://images.unsplash.com/photo-1578852612716-854e527abf2e?w=600',
    submittedAt: '03/09/2026 10:45',
    status: 'PENDING',
  }
];

// In-memory fallback
let inMemoryRequests: EkycRequest[] = [...INITIAL_EKYC_REQUESTS];

export function getEkycRequests(): EkycRequest[] {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_EKYC_REQUESTS));
    } catch (e) {
      console.warn('e-KYC localStorage read error', e);
    }
  }
  return inMemoryRequests;
}

export function saveEkycRequests(requests: EkycRequest[]): void {
  inMemoryRequests = requests;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
      // Dispatch storage event for real-time reactive sync across browser tabs
      window.dispatchEvent(new Event('skyline_ekyc_updated'));
    } catch (e) {
      console.warn('e-KYC localStorage write error', e);
    }
  }
}

/**
 * Find the latest e-KYC record for a specific resident by phone, email, or user ID
 */
export function getEkycForUser(userIdentifier: string): EkycRequest | undefined {
  const requests = getEkycRequests();
  const clean = (userIdentifier || '').toLowerCase().trim();
  return requests.find(r => 
    r.userId.toLowerCase() === clean || 
    r.phone.toLowerCase() === clean || 
    (r.email && r.email.toLowerCase() === clean) ||
    r.idCardNo === clean
  );
}

/**
 * Resident submits or updates their e-KYC dossier
 */
export function submitEkycRequest(data: {
  userId: string;
  fullName: string;
  roleLabel?: string;
  apartmentCode?: string;
  phone: string;
  email?: string;
  idCardNo: string;
  idDate?: string;
  idPlace?: string;
  dob?: string;
  pob?: string;
  avatarUrl: string;
  idCardFrontUrl?: string;
  idCardBackUrl?: string;
  faceScore?: number;
}): EkycRequest {
  const requests = getEkycRequests();
  const existingIdx = requests.findIndex(r => 
    r.userId === data.userId || 
    r.phone === data.phone || 
    (data.email && r.email === data.email) ||
    (data.idCardNo && r.idCardNo === data.idCardNo)
  );

  const now = new Date();
  const submittedAt = `${now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ${now.toLocaleDateString('vi-VN')}`;

  const newRequest: EkycRequest = {
    id: existingIdx >= 0 ? requests[existingIdx].id : `EKYC-${Date.now().toString().slice(-4)}`,
    userId: data.userId,
    fullName: data.fullName,
    roleLabel: data.roleLabel || 'Cư Dân Căn Hộ',
    apartmentCode: data.apartmentCode || '12A05',
    phone: data.phone,
    email: data.email,
    idCardNo: data.idCardNo,
    idDate: data.idDate || '',
    idPlace: data.idPlace || 'Cục Cảnh sát QLHC về TTXH',
    dob: data.dob || '',
    pob: data.pob || '',
    faceScore: data.faceScore || Math.floor(960 + Math.random() * 38) / 10,
    avatarUrl: data.avatarUrl ? data.avatarUrl.replace('data.nks.vn//', 'data.nks.vn/') : 'https://data.nks.vn/storage/users/default.png',
    idCardFrontUrl: data.idCardFrontUrl || 'https://images.unsplash.com/photo-1578852612716-854e527abf2e?w=600',
    idCardBackUrl: data.idCardBackUrl || 'https://images.unsplash.com/photo-1578852612716-854e527abf2e?w=600',
    submittedAt,
    status: 'PENDING',
  };

  let updatedList: EkycRequest[];
  if (existingIdx >= 0) {
    updatedList = [...requests];
    updatedList[existingIdx] = newRequest;
  } else {
    updatedList = [newRequest, ...requests];
  }

  saveEkycRequests(updatedList);
  return newRequest;
}

/**
 * BQL approves resident's e-KYC dossier -> Activates FaceID and barrier access
 */
export function approveEkycRequest(id: string, approverName: string = 'Ban Quản Lý Skyline'): EkycRequest | null {
  const requests = getEkycRequests();
  const req = requests.find(r => r.id === id);
  if (!req) return null;

  const now = new Date();
  req.status = 'APPROVED';
  req.reviewedAt = `${now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ${now.toLocaleDateString('vi-VN')}`;
  req.reviewedBy = approverName;
  delete req.rejectionReason;

  saveEkycRequests(requests);
  return req;
}

/**
 * BQL rejects resident's e-KYC dossier with specific feedback
 */
export function rejectEkycRequest(id: string, reason: string, approverName: string = 'Ban Quản Lý Skyline'): EkycRequest | null {
  const requests = getEkycRequests();
  const req = requests.find(r => r.id === id);
  if (!req) return null;

  const now = new Date();
  req.status = 'REJECTED';
  req.reviewedAt = `${now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ${now.toLocaleDateString('vi-VN')}`;
  req.reviewedBy = approverName;
  req.rejectionReason = reason || 'Ảnh chụp CCCD hoặc khuôn mặt không đạt tiêu chuẩn độ nét.';

  saveEkycRequests(requests);
  return req;
}
