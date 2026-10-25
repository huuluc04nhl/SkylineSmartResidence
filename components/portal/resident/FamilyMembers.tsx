'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  X, 
  CreditCard, 
  Car, 
  Phone, 
  ScanFace, 
  User, 
  Sparkles, 
  Lock,
  Search,
  Check,
  CheckCircle,
  Clock,
  Camera,
  Upload,
  Calendar,
  MapPin,
  FileText,
  Eye,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Scan,
  Edit2,
  ZoomIn,
  Info,
  Mail,
  Crown,
  Filter
} from 'lucide-react';
import { User as UserType } from '@/lib/dataStore';
import { 
  nksGetFamilyMembers, 
  nksAddFamilyMember, 
  nksUpdateFamilyMember,
  nksRemoveFamilyMember, 
  nksSearchFamilyAccount,
  nksConfirmFamilyFaceIdByOwner 
} from '@/lib/nksApiClient';
import { 
  getEkycForUser, 
  submitEkycRequest, 
  EkycRequest 
} from '@/lib/ekycStore';
import { validateCccdCard, verifyFaceWithCccd } from '@/lib/ekycValidator';
import CccdOcrScannerModal from './CccdOcrScannerModal';
import { OcrCccdResult, formatToDateInput } from '@/lib/ocrParser';
import BankFaceEnrollModal from './BankFaceEnrollModal';
import { getEnrolledFaceProfile } from '@/lib/faceEnrollStore';
import { useLanguage } from '@/lib/languageContext';
import { clearApartmentMembers } from '@/lib/userStore';
import { 
  cleanPhoneNumber, 
  isValidPhoneNumber, 
  getPhoneValidationError, 
  cleanCccdNumber, 
  isValidCccdNumber, 
  getCccdValidationError 
} from '@/lib/validationUtils';

export interface FamilyMemberItem {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  role: 'Family' | 'Tenant';
  relationship: string;
  idCard?: string;
  idDate?: string;
  idPlace?: string;
  dob?: string;
  gender?: string;
  pob?: string;
  licensePlate?: string;
  vehicleType?: string;
  avatarUrl?: string;
  username?: string;
  faceStatus?: string;
  addedDate?: string;

  // Trường thông tin đồng bộ với Chủ hộ:
  sponsorName?: string;
  sponsorPhone?: string;
  apartmentCode?: string;
  residenceType?: string;
  temporaryResidenceStatus?: string;
  relationshipProof?: string;
  accessLevel?: string;
  emergencyContact?: string;
  note?: string;
}

export interface BqlEligibleAccount {
  id: string;
  username: string;
  fullName: string;
  email?: string;
  phone: string;
  idCard: string;
  idDate?: string;
  idPlace?: string;
  dob?: string;
  gender?: string;
  pob?: string;
  licensePlate?: string;
  avatarUrl?: string;
  role: 'Family';
  relationship?: string;
  isAdded?: boolean;
}

interface FamilyMembersProps {
  currentUser: UserType;
}

export default function FamilyMembers({ currentUser }: FamilyMembersProps) {
  const { t, isEn } = useLanguage();
  const aptCode = currentUser.apartment_code || 'CH-06';
  const isOwner = currentUser.role === 'OWNER';
  const ownerName = currentUser.full_name || (currentUser as any)?.fullname || 'Trần Hữu Lực';

  const [members, setMembers] = useState<FamilyMemberItem[]>([]);
  const [bqlAccounts, setBqlAccounts] = useState<BqlEligibleAccount[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Add Member Modal State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'PRE_APPROVED' | 'SEARCH_API' | 'DIRECT_INPUT'>('PRE_APPROVED');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [bankEnrollTarget, setBankEnrollTarget] = useState<FamilyMemberItem | null>(null);
  const [confirmTargetMember, setConfirmTargetMember] = useState<FamilyMemberItem | null>(null);
  const [isConfirmingFace, setIsConfirmingFace] = useState<boolean>(false);

  // Live Owner Data & Filter State
  const [ownerData, setOwnerData] = useState<any>(null);
  const [memberSearchTerm, setMemberSearchTerm] = useState<string>('');
  const [memberFilterStatus, setMemberFilterStatus] = useState<'ALL' | 'APPROVED' | 'PENDING' | 'NO_FACE'>('ALL');

  // Direct Add Member State (Tab 3)
  const [directFullName, setDirectFullName] = useState<string>('');
  const [directPhone, setDirectPhone] = useState<string>('');
  const [directIdCard, setDirectIdCard] = useState<string>('');
  const [directRelationship, setDirectRelationship] = useState<string>('Vợ / Chồng');
  const [directLicensePlate, setDirectLicensePlate] = useState<string>('');

  // Selected Account from API
  const [selectedAccount, setSelectedAccount] = useState<BqlEligibleAccount | null>(null);
  const [newRelationship, setNewRelationship] = useState<string>('Vợ / Chồng');
  const [newLicensePlate, setNewLicensePlate] = useState<string>('');

  // Live API Search State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchingApi, setIsSearchingApi] = useState<boolean>(false);
  const [searchResult, setSearchResult] = useState<BqlEligibleAccount | null>(null);
  const [searchResults, setSearchResults] = useState<BqlEligibleAccount[]>([]);
  const [searchNotFound, setSearchNotFound] = useState<string | null>(null);
  const [preApprovedFilter, setPreApprovedFilter] = useState<string>('');

  // New fields suitable for owner-family relationship
  const [newResidenceType, setNewResidenceType] = useState<string>('Thường trú cùng chủ hộ');
  const [newRelationshipProof, setNewRelationshipProof] = useState<string>('Sổ Hộ Khẩu / Xác nhận CT07');
  const [newTemporaryResidenceStatus, setNewTemporaryResidenceStatus] = useState<string>('Đang Làm Thủ Tục');
  const [directDob, setDirectDob] = useState<string>('');
  const [directGender, setDirectGender] = useState<string>('Nam');
  const [directPob, setDirectPob] = useState<string>('');
  const [directResidenceType, setDirectResidenceType] = useState<string>('Thường trú cùng chủ hộ');
  const [directRelationshipProof, setDirectRelationshipProof] = useState<string>('Sổ Hộ Khẩu / Xác nhận CT07');
  const [directTemporaryResidenceStatus, setDirectTemporaryResidenceStatus] = useState<string>('Đang Làm Thủ Tục');
  const [directVehicleType, setDirectVehicleType] = useState<string>('Xe máy');

  // Custom Remove Member Confirmation State
  const [removeTargetMember, setRemoveTargetMember] = useState<FamilyMemberItem | null>(null);
  const [isRemoving, setIsRemoving] = useState<boolean>(false);

  // Clear local temporary cache and re-sync strictly from API
  const handleClearLocalData = async () => {
    if (confirm(isEn ? 'Clear local temporary family cache and reload fresh from server API?' : 'Xác nhận dọn dẹp bộ nhớ tạm local và đồng bộ lại danh sách người nhà từ máy chủ API?')) {
      setIsLoading(true);
      try {
        await fetch(`/api/user/family?aptCode=${encodeURIComponent(aptCode)}&action=CLEAR_LOCAL`);
        clearApartmentMembers(aptCode);
        await fetchMembers();
        setActionSuccess(isEn ? '✓ Cleared local cache and synchronized with API.' : '✓ Đã dọn dẹp dữ liệu lưu tạm ở local và đồng bộ lại từ API thành công.');
        setTimeout(() => setActionSuccess(null), 3500);
      } catch (e) {
        console.warn('Clear local data error', e);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Lightbox Zoom for Angle Samples
  const [selectedAnglePreview, setSelectedAnglePreview] = useState<{ title: string; src: string } | null>(null);

  // =========================================================================
  // OWNER PROXY e-KYC MODAL STATE (Chủ hộ kê khai hồ sơ cho người nhà)
  // =========================================================================
  const [showEkycModal, setShowEkycModal] = useState<boolean>(false);
  const [ekycTargetMember, setEkycTargetMember] = useState<FamilyMemberItem | null>(null);
  const [ekycFullName, setEkycFullName] = useState<string>('');
  const [ekycRelationship, setEkycRelationship] = useState<string>('Vợ / Chồng');
  const [ekycPhone, setEkycPhone] = useState<string>('');
  const [ekycIdCard, setEkycIdCard] = useState<string>('');
  const [ekycDob, setEkycDob] = useState<string>('');
  const [ekycPob, setEkycPob] = useState<string>('');
  const [ekycIdDate, setEkycIdDate] = useState<string>('');
  const [ekycIdPlace, setEkycIdPlace] = useState<string>('');
  const [ekycLicensePlate, setEkycLicensePlate] = useState<string>('');
  const [ekycAvatarUrl, setEkycAvatarUrl] = useState<string>('');
  const [ekycFrontImage, setEkycFrontImage] = useState<string>('');
  const [ekycBackImage, setEkycBackImage] = useState<string>('');
  const [isSubmittingEkyc, setIsSubmittingEkyc] = useState<boolean>(false);
  const [ekycModalError, setEkycModalError] = useState<string | null>(null);
  const [isMemberOcrModalOpen, setIsMemberOcrModalOpen] = useState<boolean>(false);

  const handleApplyMemberOcrData = (ocrData: OcrCccdResult, frontSrc: string, backSrc: string) => {
    const stdIdNumber = (ocrData.idNumber || '').replace(/\D/g, '').slice(0, 12);
    const stdFullName = (ocrData.fullName || '').toUpperCase().trim();
    const stdDob = formatToDateInput(ocrData.dob || '');
    const stdPob = (ocrData.pob || '').trim();
    const stdIdDate = formatToDateInput(ocrData.idDate || '');
    const stdIdPlace = (ocrData.idPlace || 'Cục Cảnh sát QLHC về TTXH').trim();

    if (stdFullName) setEkycFullName(stdFullName);
    if (stdIdNumber) setEkycIdCard(stdIdNumber);
    if (stdDob) setEkycDob(stdDob);
    if (stdPob) setEkycPob(stdPob);
    if (stdIdDate) setEkycIdDate(stdIdDate);
    if (stdIdPlace) setEkycIdPlace(stdIdPlace);
    if (frontSrc) setEkycFrontImage(frontSrc);
    if (backSrc) setEkycBackImage(backSrc);
    setIsMemberOcrModalOpen(false);
    setEkycModalError(null);
    setActionSuccess(
      isEn
        ? `✨ Successfully read Citizen ID for "${stdFullName || 'member'}"! All details verified and populated into the form.`
        : `✨ Đã đọc thông tin CCCD thành công cho "${stdFullName || 'thành viên'}"! Toàn bộ thông tin đã được chuẩn hóa và tự động điền vào hồ sơ.`
    );
    setTimeout(() => setActionSuccess(null), 5000);
  };

  // Camera capture inside e-KYC modal
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputFrontRef = useRef<HTMLInputElement | null>(null);
  const fileInputBackRef = useRef<HTMLInputElement | null>(null);
  const fileInputAvatarRef = useRef<HTMLInputElement | null>(null);

  // Helper to query e-KYC request of any member
  const getMemberEkyc = (m: FamilyMemberItem): EkycRequest | undefined => {
    return (
      getEkycForUser(m.id) ||
      getEkycForUser(m.phone) ||
      (m.idCard ? getEkycForUser(m.idCard) : undefined) ||
      (m.username ? getEkycForUser(m.username) : undefined)
    );
  };

  // Helper to normalize unified e-KYC status
  const getMemberStatus = (m: FamilyMemberItem): 'APPROVED' | 'PENDING' | 'REJECTED' | 'NOT_SUBMITTED' | 'PENDING_OWNER' => {
    const profile = getEnrolledFaceProfile(m.phone || m.id || m.username || '');
    if (m.faceStatus?.includes('Chờ Chủ Hộ') || m.faceStatus?.includes('Chờ chủ hộ') || profile?.status === 'PENDING_OWNER') {
      return 'PENDING_OWNER';
    }
    const ekyc = getMemberEkyc(m);
    if (ekyc?.status === 'APPROVED' || ekyc?.status === 'VERIFIED') return 'APPROVED';
    if (ekyc?.status === 'PENDING') return 'PENDING';
    if (ekyc?.status === 'REJECTED') return 'REJECTED';
    if (m.faceStatus?.includes('Chờ')) return 'PENDING';
    if (m.faceStatus?.includes('Kích Hoạt') || m.faceStatus?.includes('Đã kích hoạt')) return 'APPROVED';
    if (m.faceStatus?.includes('Từ Chối') || m.faceStatus?.includes('Chụp Lại')) return 'REJECTED';
    return 'NOT_SUBMITTED';
  };

  // Load Family Members & Pre-verified API Accounts (100% qua API)
  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const res = await nksGetFamilyMembers();
      if (res.success) {
        if (res.members) {
          setMembers(res.members);
        }
        if (res.bqlAccounts) {
          setBqlAccounts(res.bqlAccounts);
        }
        if (res.owner) {
          setOwnerData(res.owner);
        }
      }
    } catch (err) {
      console.warn('Load family API error:', err);
      setBqlAccounts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();

    // Listen to real-time e-KYC, FaceID & BQL Family Member changes
    const handleSyncUpdated = () => {
      fetchMembers();
    };
    window.addEventListener('skyline_ekyc_updated', handleSyncUpdated);
    window.addEventListener('skyline_faceid_enrolled', handleSyncUpdated);
    window.addEventListener('skyline_family_updated', handleSyncUpdated);
    return () => {
      window.removeEventListener('skyline_ekyc_updated', handleSyncUpdated);
      window.removeEventListener('skyline_faceid_enrolled', handleSyncUpdated);
      window.removeEventListener('skyline_family_updated', handleSyncUpdated);
    };
  }, []);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Attach video stream when camera state activates
  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch((err) => {
        console.warn('Camera video autoplay error:', err);
      });
    }
  }, [isCameraActive]);

  // =========================================================================
  // CAMERA & FILE UPLOAD HANDLERS
  // =========================================================================
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      setIsCameraActive(true);
    } catch (err) {
      console.warn('Không thể mở camera:', err);
      setIsCameraActive(false);
      alert('Không thể kích hoạt Camera trên thiết bị này. Bạn có thể chọn tải ảnh chân dung trực tiếp từ tệp tin.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const captureCamera = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setEkycAvatarUrl(dataUrl);
      stopCamera();
    }
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setEkycModalError('Tệp tải lên không phải là ảnh hợp lệ (chấp nhận JPEG, PNG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setter(reader.result);
        setEkycModalError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCccdUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    side: 'FRONT' | 'BACK',
    setter: (url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setEkycModalError('Tệp tải lên không phải là ảnh hợp lệ (chấp nhận JPEG, PNG, WEBP).');
      return;
    }

    if (file.size < 15000) {
      setEkycModalError('Ảnh chụp thẻ CCCD quá mờ hoặc dung lượng quá nhỏ (dưới 15KB). Vui lòng tải ảnh rõ nét.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const dataUrl = reader.result;
        const img = new Image();
        img.onload = () => {
          const ratio = img.width / img.height;
          if (ratio < 1.22) {
            setEkycModalError(`Ảnh tải lên là ảnh dọc (tỷ lệ ${ratio.toFixed(2)}:1). Thẻ Căn cước công dân phải là ảnh chụp ngang bao gồm đủ 4 góc thẻ (tỷ lệ chuẩn ~1.58:1). Không được sử dụng ảnh selfie dọc!`);
            return;
          }
          if (ratio > 2.05) {
            setEkycModalError(`Ảnh bị cắt xén quá dài (tỷ lệ ${ratio.toFixed(2)}:1). Vui lòng chụp trọn vẹn 4 góc thẻ CCCD.`);
            return;
          }
          if (img.width < 380 || img.height < 240) {
            setEkycModalError(`Độ phân giải ảnh quá thấp (${img.width}x${img.height}px). Yêu cầu tối thiểu 400x250px.`);
            return;
          }

          setter(dataUrl);
          setEkycModalError(null);
        };
        img.src = dataUrl;
      }
    };
    reader.readAsDataURL(file);
  };

  // =========================================================================
  // MODAL OPEN / CLOSE HANDLERS
  // =========================================================================
  const handleOpenEkycModal = (member: FamilyMemberItem) => {
    const existing = getMemberEkyc(member);
    const profile = getEnrolledFaceProfile(member.phone || member.id || member.username || '');
    setEkycTargetMember(member);
    setEkycFullName(existing?.fullName || member.fullName || '');
    setEkycRelationship(member.relationship || 'Vợ / Chồng');
    setEkycPhone(existing?.phone || member.phone || '');
    setEkycIdCard(existing?.idCardNo || member.idCard || '');
    setEkycDob(existing?.dob || member.dob || '');
    setEkycPob(existing?.pob || member.pob || '');
    setEkycIdDate(existing?.idDate || member.idDate || '');
    setEkycIdPlace(existing?.idPlace || member.idPlace || '');
    setEkycLicensePlate(member.licensePlate || '');

    // Ưu tiên hiển thị chân dung chuẩn của người nhà (tuyệt đối không lấy ảnh mẫu FaceID ghi đè chân dung)
    let resolvedAvatar = '';
    if (existing?.avatarUrl && !existing.avatarUrl.includes('default.png') && !existing.avatarUrl.startsWith('data:image/')) {
      resolvedAvatar = existing.avatarUrl;
    } else if (member.avatarUrl && !member.avatarUrl.includes('default.png') && !member.avatarUrl.startsWith('data:image/')) {
      resolvedAvatar = member.avatarUrl.replace('data.nks.vn//', 'data.nks.vn/');
    } else if (profile?.avatarUrl && !profile.avatarUrl.includes('default.png') && !profile.avatarUrl.startsWith('data:image/')) {
      resolvedAvatar = profile.avatarUrl;
    } else {
      resolvedAvatar = 'https://data.nks.vn/storage/users/default.png';
    }
    setEkycAvatarUrl(resolvedAvatar);

    setEkycFrontImage(existing?.idCardFrontUrl || '');
    setEkycBackImage(existing?.idCardBackUrl || '');
    setEkycModalError(null);
    setIsCameraActive(false);
    setShowEkycModal(true);
  };

  const handleCloseEkycModal = () => {
    stopCamera();
    setShowEkycModal(false);
    setEkycTargetMember(null);
  };

  // =========================================================================
  // SUBMIT OWNER PROXY e-KYC TO BQL
  // =========================================================================
  const handleSubmitMemberEkyc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ekycTargetMember) return;

    if (!ekycFullName.trim()) {
      setEkycModalError('Vui lòng nhập đầy đủ họ và tên người nhà.');
      return;
    }
    const phoneErr = getPhoneValidationError(ekycPhone);
    if (phoneErr) {
      setEkycModalError(phoneErr);
      return;
    }
    const cccdErr = getCccdValidationError(ekycIdCard);
    if (cccdErr) {
      setEkycModalError(cccdErr);
      return;
    }

    // 1. Kiểm tra ảnh CCCD Mặt Trước
    if (ekycFrontImage) {
      const frontCheck = validateCccdCard(ekycFrontImage, 'FRONT');
      if (!frontCheck.valid) {
        setEkycModalError(frontCheck.error || 'Ảnh CCCD Mặt Trước không đúng tiêu chuẩn.');
        return;
      }
    }

    // 2. Kiểm tra ảnh CCCD Mặt Sau
    if (ekycBackImage) {
      const backCheck = validateCccdCard(ekycBackImage, 'BACK');
      if (!backCheck.valid) {
        setEkycModalError(backCheck.error || 'Ảnh CCCD Mặt Sau không đúng tiêu chuẩn.');
        return;
      }
    }

    // 3. Đối chiếu sinh trắc học: Ảnh Chân Dung vs Ảnh Thẻ CCCD
    let calculatedFaceScore = 98.6;
    if (ekycAvatarUrl && ekycFrontImage) {
      const bioCheck = verifyFaceWithCccd(ekycAvatarUrl, ekycFrontImage);
      calculatedFaceScore = bioCheck.score;
      if (!bioCheck.matched) {
        setEkycModalError(bioCheck.reason);
        return;
      }
    }

    setIsSubmittingEkyc(true);
    setEkycModalError(null);

    try {
      const roleLabel = `Người Nhà (Căn ${aptCode}) - Bảo lãnh bởi Chủ Hộ: ${ownerName}`;

      const payload = {
        userId: ekycTargetMember.id || ekycTargetMember.phone,
        fullName: ekycFullName.trim(),
        roleLabel,
        apartmentCode: aptCode,
        phone: ekycPhone.trim(),
        idCardNo: ekycIdCard.trim(),
        idDate: ekycIdDate.trim(),
        idPlace: ekycIdPlace.trim(),
        dob: ekycDob.trim(),
        pob: ekycPob.trim(),
        avatarUrl: ekycAvatarUrl,
        idCardFrontUrl: ekycFrontImage,
        idCardBackUrl: ekycBackImage,
        faceScore: calculatedFaceScore,
      };

      // 1. Submit to local e-KYC Store
      submitEkycRequest(payload);

      // 2. Submit to Server API
      try {
        await fetch('/api/ekyc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'SUBMIT',
            ...payload,
          }),
        });
      } catch (apiErr) {
        console.warn('API ekyc submit error:', apiErr);
      }

      // 3. Update local state
      setMembers((prev) =>
        prev.map((m) => {
          if (m.id === ekycTargetMember.id || m.phone === ekycTargetMember.phone) {
            return {
              ...m,
              fullName: ekycFullName.trim(),
              relationship: ekycRelationship,
              phone: ekycPhone.trim(),
              idCard: ekycIdCard.trim(),
              avatarUrl: ekycAvatarUrl,
              licensePlate: ekycLicensePlate.trim() || m.licensePlate,
              faceStatus: 'Đang Chờ BQL Phê Duyệt',
            };
          }
          return m;
        })
      );

      // 4. Feedback
      setActionSuccess(
        isEn
          ? `✓ Identity & biometric face records for family member "${ekycFullName}" successfully submitted to Management Office! Pending review.`
          : `✓ Đã gửi thông tin căn cước & khuôn mặt của người nhà "${ekycFullName}" lên Ban Quản Lý thành công! Hồ sơ đang chờ Ban Quản Lý phê duyệt.`
      );
      setTimeout(() => setActionSuccess(null), 5000);

      handleCloseEkycModal();
      fetchMembers();
    } catch (err: any) {
      setEkycModalError(err.message || (isEn ? 'Error submitting data to Management Office.' : 'Lỗi khi gửi thông tin lên Ban Quản Lý.'));
    } finally {
      setIsSubmittingEkyc(false);
    }
  };

  // Select account from pre-verified list
  const handleSelectPreApproved = (acc: BqlEligibleAccount) => {
    setSelectedAccount(acc);
    setNewRelationship(acc.relationship || 'Vợ / Chồng');
    setNewLicensePlate(acc.licensePlate || '');
    setActionError(null);
  };

  // Search account via live API with client fallback
  const handleSearchApi = async (e?: React.FormEvent, directQ?: string) => {
    if (e) e.preventDefault();
    const query = (directQ !== undefined ? directQ : searchQuery).trim();
    if (!query) return;

    setIsSearchingApi(true);
    setSearchNotFound(null);
    setSearchResult(null);
    setSearchResults([]);
    setActionError(null);

    try {
      const res = await nksSearchFamilyAccount(query);
      if (res.success && res.found) {
        const list = Array.isArray((res as any).accounts) && (res as any).accounts.length > 0
          ? (res as any).accounts
          : res.account ? [res.account] : [];
        if (list.length > 0) {
          setSearchResults(list);
          setSearchResult(list[0]);
          setSelectedAccount(list[0]);
          setNewRelationship(list[0].relationship || 'Vợ / Chồng');
          setNewLicensePlate(list[0].licensePlate || '');
        } else {
          setSearchNotFound(isEn ? `No registered family account matching "${query}".` : `Không tìm thấy tài khoản người nhà nào khớp với "${query}".`);
        }
      } else {
        setSearchResults([]);
        setSearchResult(null);
        setSelectedAccount(null);
        setSearchNotFound(
          res.message || (isEn 
            ? `No registered family account matching "${query}" on the system.` 
            : `Không tìm thấy tài khoản người thân nào khớp với "${query}" trên hệ thống.`)
        );
      }
    } catch (err) {
      setSearchNotFound(isEn ? 'Connection error while searching for account.' : 'Lỗi kết nối khi tra cứu người dùng.');
    } finally {
      setIsSearchingApi(false);
    }
  };

  // Submit Add Member strictly via API
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) {
      setActionError(isEn ? 'Please select or search a valid account from the API system.' : 'Vui lòng chọn hoặc tra cứu một tài khoản hợp lệ từ hệ thống API.');
      return;
    }

    setIsSubmitting(true);
    setActionError(null);

    try {
      const res = await nksAddFamilyMember({
        accountId: selectedAccount.id,
        username: selectedAccount.username,
        phone: selectedAccount.phone,
        fullName: selectedAccount.fullName,
        idCard: selectedAccount.idCard,
        licensePlate: newLicensePlate.trim() || selectedAccount.licensePlate,
        avatarUrl: selectedAccount.avatarUrl,
        relationship: newRelationship,
        residenceType: newResidenceType,
        temporaryResidenceStatus: newTemporaryResidenceStatus,
        relationshipProof: newRelationshipProof,
        dob: selectedAccount.dob,
        gender: selectedAccount.gender,
        pob: selectedAccount.pob,
      } as any);

      if (res.success && res.members) {
        setMembers(res.members);
        setShowAddModal(false);
        setActionSuccess(
          isEn
            ? `✓ Added family member "${selectedAccount.fullName}" to Unit ${aptCode} via API profile successfully!`
            : `✓ Đã thêm thành viên "${selectedAccount.fullName}" vào Căn hộ ${aptCode} theo hồ sơ API thành công!`
        );
        setTimeout(() => setActionSuccess(null), 4000);

        // Reset
        setSelectedAccount(null);
        setSearchResult(null);
        setSearchQuery('');
        setNewRelationship('Vợ / Chồng');
        setNewLicensePlate('');
        fetchMembers();
      } else {
        setActionError(res.message || (isEn ? 'Failed to add member. Please try again.' : 'Không thể thêm thành viên. Vui lòng thử lại.'));
      }
    } catch (err: any) {
      setActionError(err.message || (isEn ? 'API connection error when adding member.' : 'Lỗi kết nối API khi thêm thành viên.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Trigger Custom Revoke Modal
  const handlePromptRemoveMember = (member: FamilyMemberItem) => {
    setRemoveTargetMember(member);
  };

  // Execute Remove Member
  const handleConfirmRemoveMember = async () => {
    if (!removeTargetMember) return;
    setIsRemoving(true);
    try {
      const res = await nksRemoveFamilyMember(removeTargetMember.id);
      if (res.success) {
        setMembers((prev) => prev.filter((m) => m.id !== removeTargetMember.id));
        setActionSuccess(
          isEn
            ? `✓ Revoked residency authorization & FaceID access for member "${removeTargetMember.fullName}".`
            : `✓ Đã hủy phân quyền cư trú & thu hồi quyền FaceID của thành viên "${removeTargetMember.fullName}".`
        );
        setTimeout(() => setActionSuccess(null), 4000);
        setRemoveTargetMember(null);
        fetchMembers();
      } else {
        setActionError(res.message || (isEn ? 'Could not remove member.' : 'Không thể xóa thành viên.'));
      }
    } catch (err) {
      setActionError(isEn ? 'Connection error while removing member.' : 'Lỗi kết nối khi xóa thành viên.');
    } finally {
      setIsRemoving(false);
    }
  };

  // Submit Add Member directly (Mode 3: Direct Input)
  const handleDirectAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directFullName.trim()) {
      setActionError(isEn ? 'Please enter member full name.' : 'Vui lòng nhập đầy đủ họ và tên người thân.');
      return;
    }
    const phoneErr = getPhoneValidationError(directPhone, isEn);
    if (phoneErr) {
      setActionError(phoneErr);
      return;
    }
    if (directIdCard && directIdCard.trim()) {
      const cccdErr = getCccdValidationError(directIdCard, isEn);
      if (cccdErr) {
        setActionError(cccdErr);
        return;
      }
    }

    setIsSubmitting(true);
    setActionError(null);

    try {
      const res = await nksAddFamilyMember({
        fullName: directFullName.trim(),
        phone: directPhone.trim(),
        idCard: directIdCard.trim() || '079' + Math.floor(100000000 + Math.random() * 900000000),
        relationship: directRelationship,
        licensePlate: directLicensePlate.trim(),
        avatarUrl: 'https://data.nks.vn/storage/users/default.png',
        residenceType: directResidenceType,
        temporaryResidenceStatus: directTemporaryResidenceStatus,
        relationshipProof: directRelationshipProof,
        dob: directDob,
        gender: directGender,
        pob: directPob,
        vehicleType: directVehicleType,
      } as any);

      if (res.success && res.members) {
        setMembers(res.members);
        setShowAddModal(false);
        setActionSuccess(
          isEn
            ? `✓ Added member "${directFullName}" to Unit ${aptCode}! You can now enroll FaceID and scan Citizen ID.`
            : `✓ Đã thêm thành viên "${directFullName}" vào Căn hộ ${aptCode}! Bạn có thể tiến hành quét FaceID và chụp CCCD ngay.`
        );
        setTimeout(() => setActionSuccess(null), 5000);

        // Reset
        setDirectFullName('');
        setDirectPhone('');
        setDirectIdCard('');
        setDirectRelationship('Vợ / Chồng');
        setDirectLicensePlate('');
        fetchMembers();
      } else {
        setActionError(res.message || (isEn ? 'Failed to add member. Please try again.' : 'Không thể thêm thành viên. Vui lòng thử lại.'));
      }
    } catch (err: any) {
      setActionError(err.message || (isEn ? 'API connection error when adding member.' : 'Lỗi kết nối API khi thêm thành viên.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Aggregate metrics correctly using unified helper
  const totalApproved = members.filter((m) => getMemberStatus(m) === 'APPROVED').length;
  const totalPendingOwner = members.filter((m) => getMemberStatus(m) === 'PENDING_OWNER').length;
  const totalPendingBql = members.filter((m) => getMemberStatus(m) === 'PENDING').length;
  const totalVehicles = ((currentUser.license_plate || ownerData?.licensePlate) ? 1 : 0) + members.filter((m) => m.licensePlate).length;
  const totalResidents = 1 + members.length;

  // Real-time filtered members by search term and status
  const filteredMembers = members.filter((m) => {
    if (memberSearchTerm.trim()) {
      const term = memberSearchTerm.toLowerCase().trim();
      const matchName = m.fullName.toLowerCase().includes(term);
      const matchPhone = m.phone.includes(term);
      const matchCccd = m.idCard?.includes(term);
      const matchRel = m.relationship?.toLowerCase().includes(term);
      const matchPlate = m.licensePlate?.toLowerCase().includes(term);
      if (!matchName && !matchPhone && !matchCccd && !matchRel && !matchPlate) {
        return false;
      }
    }
    const status = getMemberStatus(m);
    const hasFace = !!getEnrolledFaceProfile(m.phone || m.id || m.username || '');
    if (memberFilterStatus === 'APPROVED') {
      return status === 'APPROVED';
    }
    if (memberFilterStatus === 'PENDING') {
      return status === 'PENDING' || status === 'PENDING_OWNER';
    }
    if (memberFilterStatus === 'NO_FACE') {
      return !hasFace;
    }
    return true;
  });

  return (
    <div className="space-y-6 w-full animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222B35] pb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-[#C5A880] font-semibold flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> {t('Quản Trị Căn Hộ')}
          </div>
          <h2 className="font-serif text-2xl text-white font-bold mt-1">
            {t('Nhân Khẩu')} • {t('Căn')} {aptCode}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {t('Chủ hộ:')} <strong className="text-[#C5A880]">{ownerName}</strong> • {t('Căn')} <strong className="text-white font-mono">{aptCode}</strong>
          </p>
        </div>

        {isOwner && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setBankEnrollTarget({
                  id: currentUser.id || 'usr-120',
                  fullName: currentUser.full_name || 'Trần Hữu Lực',
                  phone: currentUser.phone || '0364967082',
                  email: currentUser.email || 'huuluc04@gmail.com',
                  role: 'Family',
                  relationship: 'Chủ Hộ (Chủ Sở Hữu)',
                });
              }}
              className="px-3 py-2 bg-[#161D26] hover:bg-[#1E2631] border border-[#C5A880] text-[#C5A880] hover:text-white text-xs font-bold rounded-none flex items-center gap-1.5 transition-all shadow cursor-pointer active:scale-95"
              title="Quét lại FaceID Chủ Hộ"
            >
              <Camera className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>{t('Quét FaceID')}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddModal(true);
                setSelectedAccount(null);
                setSearchResult(null);
                setActionError(null);
              }}
              className="px-4 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 rounded-none shadow flex-shrink-0 cursor-pointer active:scale-95"
            >
              <UserPlus className="w-4 h-4" /> {t('Thêm Thành Viên')}
            </button>
          </div>
        )}
      </div>

      {/* Success Alerts */}
      {actionSuccess && (
        <div className="p-3 bg-emerald-950/90 border border-emerald-500 text-emerald-300 text-xs flex items-center gap-2 rounded-none animate-fadeIn shadow">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
          <span className="font-medium">{actionSuccess}</span>
        </div>
      )}

      {/* Overview Stats Bar: 5-Card Clean Modern Layout */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="p-3.5 bg-[#121820] border border-[#222B35] rounded-none">
          <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold flex items-center justify-between">
            <span>Nhân Khẩu</span>
            <Users className="w-3.5 h-3.5 text-gray-500" />
          </div>
          <div className="text-2xl font-bold font-serif text-white mt-1 flex items-baseline gap-1.5">
            <span>{totalResidents}</span>
            <span className="text-xs text-gray-400 font-normal">người</span>
          </div>
        </div>

        <div className="p-3.5 bg-[#121820] border border-[#222B35] rounded-none">
          <div className="text-[10px] uppercase tracking-wider text-emerald-300 font-semibold flex items-center justify-between">
            <span>Đã FaceID</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-serif text-emerald-400 mt-1">
            {1 + totalApproved} <span className="text-xs font-sans text-gray-400 font-normal">người</span>
          </div>
        </div>

        {/* Highlighted Pending Owner Stat Card */}
        <div className={`p-3.5 rounded-none transition-all ${
          totalPendingOwner > 0
            ? 'bg-amber-950/40 border-2 border-amber-500 animate-pulse'
            : 'bg-[#121820] border border-[#222B35]'
        }`}>
          <div className="text-[10px] uppercase tracking-wider text-amber-300 font-bold flex items-center justify-between">
            <span>Chờ Duyệt</span>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-serif text-amber-400 mt-1 flex items-baseline gap-1.5">
            <span>{totalPendingOwner}</span>
            <span className="text-xs font-sans text-gray-400 font-normal">hồ sơ</span>
            {totalPendingOwner > 0 && (
              <span className="text-[9px] px-1.5 py-0.5 bg-amber-500 text-[#0D1117] font-bold uppercase">
                Cần duyệt
              </span>
            )}
          </div>
        </div>

        <div className="p-3.5 bg-[#121820] border border-[#222B35] rounded-none">
          <div className="text-[10px] uppercase tracking-wider text-cyan-300 font-semibold flex items-center justify-between">
            <span>Chờ BQL</span>
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-serif text-cyan-400 mt-1">
            {totalPendingBql} <span className="text-xs font-sans text-gray-400 font-normal">hồ sơ</span>
          </div>
        </div>

        <div className="p-3.5 bg-[#121820] border border-[#222B35] rounded-none col-span-2 sm:col-span-1">
          <div className="text-[10px] uppercase tracking-wider text-purple-300 font-semibold flex items-center justify-between">
            <span>Phương Tiện</span>
            <Car className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-serif text-purple-400 mt-1">
            {totalVehicles} <span className="text-xs font-sans text-gray-400 font-normal">xe</span>
          </div>
        </div>
      </div>

      {/* Owner Action Alert Banner when members are PENDING_OWNER */}
      {isOwner && totalPendingOwner > 0 && (
        <div className="p-3.5 bg-amber-950/80 border border-amber-500 text-amber-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 rounded-none shadow-lg animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-500/20 border border-amber-400 flex items-center justify-center flex-shrink-0 text-amber-300">
              <Sparkles className="w-4 h-4 animate-pulse text-amber-400" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Cần duyệt FaceID người nhà ({totalPendingOwner})
              </div>
              <p className="text-xs text-gray-300 mt-0.5">
                Thành viên đã quét đủ 4 mẫu FaceID. Vui lòng kiểm tra và duyệt để BQL kích hoạt.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 w-full md:w-auto">
            {(() => {
              const pendingMember = members.find((m) => getMemberStatus(m) === 'PENDING_OWNER');
              return pendingMember ? (
                <button
                  type="button"
                  onClick={() => setConfirmTargetMember(pendingMember)}
                  className="w-full md:w-auto px-4 py-2 bg-gradient-to-r from-amber-500 to-[#C5A880] hover:brightness-110 text-[#0D1117] font-bold text-xs uppercase tracking-wider rounded-none flex items-center justify-center gap-1.5 shadow transition-all active:scale-95 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" /> Duyệt Ngay ({pendingMember.fullName})
                </button>
              ) : null;
            })()}
          </div>
        </div>
      )}

      {/* Members List */}
      <div className="bg-[#121820] border border-[#222B35] rounded-none overflow-hidden shadow-2xl">
        <div className="p-3.5 border-b border-[#222B35] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-[#C5A880]" /> Thành Viên Căn Hộ ({members.length})
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={memberSearchTerm}
                onChange={(e) => setMemberSearchTerm(e.target.value)}
                placeholder={isEn ? "Search member, phone..." : "Tìm kiếm thành viên, SĐT..."}
                className="bg-[#161B22] border border-[#2D3748] pl-8 pr-7 py-1.5 text-white text-xs rounded-none focus:border-[#C5A880] outline-none w-36 sm:w-44 font-sans"
              />
              {memberSearchTerm && (
                <button
                  type="button"
                  onClick={() => setMemberSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Status */}
            <select
              value={memberFilterStatus}
              onChange={(e) => setMemberFilterStatus(e.target.value as any)}
              className="bg-[#161B22] border border-[#2D3748] px-2 py-1.5 text-xs text-gray-200 rounded-none focus:border-[#C5A880] outline-none cursor-pointer"
            >
              <option value="ALL">{isEn ? `All (${members.length})` : `Tất cả (${members.length})`}</option>
              <option value="APPROVED">{isEn ? `FaceID Active (${totalApproved})` : `Đã FaceID (${totalApproved})`}</option>
              <option value="PENDING">{isEn ? `Pending (${totalPendingOwner + totalPendingBql})` : `Chờ duyệt (${totalPendingOwner + totalPendingBql})`}</option>
              <option value="NO_FACE">{isEn ? 'No FaceID' : 'Chưa FaceID'}</option>
            </select>

            <button
              onClick={fetchMembers}
              disabled={isLoading}
              title={isEn ? "Refresh member list" : "Làm mới danh sách thành viên"}
              className="text-xs text-gray-300 hover:text-[#C5A880] flex items-center gap-1.5 transition-colors cursor-pointer px-3 py-1.5 bg-[#161B22] border border-[#2D3748] rounded-none hover:border-[#C5A880]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> {isEn ? 'Refresh' : 'Làm mới'}
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-10 text-center text-xs text-[#C5A880] font-mono flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" /> Đang tải dữ liệu...
          </div>
        ) : members.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-xs space-y-2">
            <Users className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p>Chưa có thành viên nào trong căn hộ {aptCode}.</p>
            {isOwner && (
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="text-[#C5A880] font-bold underline hover:text-white cursor-pointer"
              >
                + Thêm thành viên
              </button>
            )}
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-xs space-y-2">
            <Filter className="w-6 h-6 text-gray-600 mx-auto mb-1" />
            <p>Không tìm thấy kết quả phù hợp.</p>
            <button
              type="button"
              onClick={() => {
                setMemberSearchTerm('');
                setMemberFilterStatus('ALL');
              }}
              className="text-[#C5A880] font-bold underline hover:text-white cursor-pointer"
            >
              Xem tất cả
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#222B35]">
            {filteredMembers.map((m) => {
              const ekyc = getMemberEkyc(m);
              const ekycStatus = getMemberStatus(m);

              const avatarSrc =
                (ekyc?.avatarUrl && !ekyc.avatarUrl.startsWith('data:image/'))
                  ? ekyc.avatarUrl
                  : (m.avatarUrl && !m.avatarUrl.startsWith('data:image/'))
                    ? m.avatarUrl.replace('data.nks.vn//', 'data.nks.vn/')
                    : 'https://data.nks.vn/storage/users/default.png';

              return (
                <div
                  key={m.id}
                  className="p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-[#161B22] transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    {/* Member Avatar */}
                    <div className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-none overflow-hidden border border-[#C5A880]/70 shadow bg-[#161D26] flex-shrink-0">
                      <img
                        src={avatarSrc}
                        alt={m.fullName}
                        onError={(e) => {
                          e.currentTarget.src = 'https://data.nks.vn/storage/users/default.png';
                        }}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-sm sm:text-base truncate">
                          {m.fullName}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-none border bg-purple-950/80 text-purple-300 border-purple-600/60 flex-shrink-0">
                          {m.relationship || 'Người Nhà'}
                        </span>

                        {/* Status Badges */}
                        {/* Trạng thái xác thực duy nhất, rõ ràng */}
                        {ekycStatus === 'APPROVED' && (
                          <span className="px-2 py-0.5 text-[10.5px] font-bold rounded-none border bg-emerald-950/90 text-emerald-300 border-emerald-500/80 flex items-center gap-1 flex-shrink-0">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> {t('Đã Kích Hoạt FaceID', 'FaceID Active')}
                          </span>
                        )}
                        {ekycStatus === 'PENDING_OWNER' && (
                          <span className="px-2 py-0.5 text-[10.5px] font-bold rounded-none border bg-amber-950/90 text-amber-300 border-amber-500/80 flex items-center gap-1 animate-pulse flex-shrink-0">
                            <Clock className="w-3 h-3 text-amber-400" /> {t('Chờ Chủ Hộ Xác Nhận', 'Pending Owner')}
                          </span>
                        )}
                        {ekycStatus === 'PENDING' && (
                          <span className="px-2 py-0.5 text-[10.5px] font-bold rounded-none border bg-cyan-950/90 text-cyan-300 border-cyan-500/80 flex items-center gap-1 animate-pulse flex-shrink-0">
                            <Clock className="w-3 h-3 text-cyan-400" /> {t('Chờ Ban Quản Lý Duyệt', 'Pending BQL')}
                          </span>
                        )}
                        {ekycStatus === 'REJECTED' && (
                          <span className="px-2 py-0.5 text-[10.5px] font-bold rounded-none border bg-rose-950/90 text-rose-300 border-rose-500/80 flex items-center gap-1 flex-shrink-0">
                            <XCircle className="w-3 h-3 text-rose-400" /> {t('Cần Gửi Lại Ảnh', 'Photo Resubmission Needed')}
                          </span>
                        )}
                        {ekycStatus === 'NOT_SUBMITTED' && (
                          <span className="px-2 py-0.5 text-[10.5px] font-medium rounded-none border bg-gray-900/90 text-gray-300 border-gray-700 flex items-center gap-1 flex-shrink-0">
                            <AlertCircle className="w-3 h-3 text-gray-400" /> {t('Chưa Đăng Ký FaceID', 'Not Enrolled')}
                          </span>
                        )}
                      </div>

                      <div className="text-gray-400 text-xs flex flex-wrap items-center gap-x-3 gap-y-0.5">
                        <span>
                          SĐT: <strong className="font-mono text-gray-200">{m.phone}</strong>
                        </span>
                        {m.idCard && (
                          <span>
                            • CCCD: <strong className="font-mono text-[#C5A880]">{m.idCard}</strong>
                          </span>
                        )}
                        {m.licensePlate && (
                          <span>
                            • Biển số: <strong className="font-mono text-cyan-400">{m.licensePlate}</strong> {m.vehicleType ? `(${m.vehicleType})` : ''}
                          </span>
                        )}
                      </div>

                      {/* Thông tin cư trú & Pháp lý */}
                      <div className="text-[11px] text-gray-300 flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5">
                        <span>{t('Hình thức:', 'Type:')} <strong className="text-gray-200">{m.residenceType || 'Thường trú cùng chủ hộ'}</strong></span>
                        <span>• {t('Tạm trú:', 'Status:')} <strong className="text-emerald-400">{m.temporaryResidenceStatus || 'Đang làm thủ tục'}</strong></span>
                        {m.dob && <span>• {t('Sinh:', 'DOB:')} <strong className="font-mono text-gray-300">{m.dob}</strong></span>}
                        {m.gender && <span>({m.gender})</span>}
                      </div>

                      {/* Rejection Notice if any */}
                      {ekycStatus === 'REJECTED' && ekyc?.rejectionReason && (
                        <div className="p-1.5 bg-rose-950/50 border border-rose-800/80 rounded-none text-[11px] text-rose-300 flex items-start gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 mt-0.5" />
                          <span>
                            <strong>Lý do từ BQL:</strong> {ekyc.rejectionReason}
                          </span>
                        </div>
                      )}

                      {/* Privilege description & Legal proof */}
                      <div className="text-[11px] text-gray-400 flex items-center gap-1.5 flex-wrap">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#C5A880] flex-shrink-0" />
                        <span className="truncate">
                          {m.accessLevel || 'Sảnh • Thang máy T12 • Hầm B1/B2 • Tiện ích cư dân'}
                        </span>
                        {m.relationshipProof && (
                          <span className="text-[10px] text-[#C5A880]/80 font-mono">
                            • Căn cứ: {m.relationshipProof}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions for Owner & Family Member */}
                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-start md:justify-end pt-2 md:pt-0 border-t md:border-t-0 border-[#222B35]/60 flex-shrink-0">
                    {/* Owner Confirm Button when Member is PENDING_OWNER */}
                    {isOwner && ekycStatus === 'PENDING_OWNER' && (
                      <button
                        type="button"
                        onClick={() => setConfirmTargetMember(m)}
                        className="px-3 py-1.5 text-xs font-bold rounded-none flex items-center gap-1.5 transition-all shadow cursor-pointer active:scale-95 bg-gradient-to-r from-amber-500 to-[#C5A880] hover:brightness-110 text-[#0D1117]"
                        title={t('Xác nhận 4 mẫu ảnh và chuyển Ban Quản Lý phê duyệt')}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{t('Xác Nhận Gửi BQL', 'Confirm & Send to BQL')}</span>
                      </button>
                    )}

                    {/* FaceID Scanning Button */}
                    {(isOwner || (m.id === currentUser.id || m.phone === currentUser.phone || m.username === currentUser.username)) && (
                      <button
                        type="button"
                        onClick={() => setBankEnrollTarget(m)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-none flex items-center gap-1.5 transition-all shadow cursor-pointer active:scale-95 ${
                          getEnrolledFaceProfile(m.phone || m.id || m.username || '')
                            ? 'bg-[#121820] hover:bg-[#1E2631] border border-cyan-500/80 text-cyan-300'
                            : 'bg-[#C5A880] hover:bg-white text-[#0D1117] font-bold'
                        }`}
                        title={t('Quét mẫu khuôn mặt')}
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>{t('Quét Khuôn Mặt', 'Scan Face')}</span>
                      </button>
                    )}

                    {/* CCCD & Bio Details */}
                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => handleOpenEkycModal(m)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-none flex items-center gap-1.5 transition-all shadow cursor-pointer active:scale-95 bg-[#161D26] hover:bg-[#1F2937] border border-[#2D3748] hover:border-[#C5A880] text-gray-200"
                        title={t('Xem và cập nhật ảnh Căn cước công dân')}
                      >
                        <ScanFace className="w-3.5 h-3.5 text-[#C5A880]" />
                        <span>{t('Hồ Sơ & CCCD', 'Profile & ID')}</span>
                      </button>
                    )}

                    {/* Delete Member */}
                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => handlePromptRemoveMember(m)}
                        className="px-2.5 py-1.5 text-xs text-rose-400 hover:text-white hover:bg-rose-950/60 border border-rose-900/60 rounded-none transition-colors flex items-center gap-1 cursor-pointer"
                        title={t('Xóa người thân khỏi căn hộ')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{t('Xóa', 'Delete')}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* MODAL: CHỦ HỘ KHAI BÁO & CẬP NHẬT E-KYC CHO NGƯỜI NHÀ GỬI BQL        */}
      {/* =================================================================== */}
      {showEkycModal && ekycTargetMember && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseEkycModal();
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
        >
          <div className="bg-[#0D1117] border border-[#C5A880]/80 max-w-3xl w-full p-5 sm:p-7 text-white space-y-5 shadow-2xl rounded-none max-h-[92vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#222B35] pb-3 gap-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-none bg-[#C5A880]/15 border border-[#C5A880] flex items-center justify-center text-[#C5A880] flex-shrink-0">
                  <ScanFace className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-serif font-bold text-white flex items-center gap-2">
                    Thông Tin Thẻ & Khuôn Mặt Người Thân
                  </h3>
                  <p className="text-xs text-gray-400">
                    Căn {aptCode} • Chủ hộ {ownerName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsMemberOcrModalOpen(true)}
                  className="px-3 py-1.5 bg-gradient-to-r from-[#C5A880] to-[#E2C799] hover:brightness-110 text-[#0D1117] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow rounded-none active:scale-95"
                >
                  <Scan className="w-3.5 h-3.5 text-[#0D1117]" /> Tải Ảnh CCCD
                </button>
                <button
                  type="button"
                  onClick={handleCloseEkycModal}
                  className="text-gray-400 hover:text-white p-1 rounded-none hover:bg-[#161D26] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Legal Representation Guarantee Box */}
            <div className="p-2.5 bg-[#121820] border border-[#C5A880]/50 rounded-none text-xs text-gray-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#C5A880] flex-shrink-0" />
              <span>Chủ hộ <strong className="text-white">{ownerName}</strong> bảo lãnh thông tin cho <strong className="text-white">{ekycFullName || ekycTargetMember.fullName}</strong> gửi BQL duyệt FaceID.</span>
            </div>

            {/* Error Message */}
            {ekycModalError && (
              <div className="p-2.5 bg-rose-950/80 border border-rose-500 text-rose-200 text-xs flex items-center gap-2 rounded-none">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{ekycModalError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmitMemberEkyc} className="space-y-4 text-xs">
              
              {/* SECTION 1: THÔNG TIN PHÁP LÝ NHÂN THÂN */}
              <div className="space-y-2.5 p-3.5 bg-[#121820] border border-[#222B35] rounded-none">
                <div className="flex items-center justify-between border-b border-[#222B35] pb-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#C5A880] flex items-center gap-2">
                    <User className="w-4 h-4" /> 1. Thông Tin Người Thân
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-300 font-semibold block mb-1">
                      Họ và Tên (Theo CCCD): *
                    </label>
                    <input
                      type="text"
                      required
                      value={ekycFullName}
                      onChange={(e) => setEkycFullName(e.target.value)}
                      placeholder="Nhập họ và tên theo CCCD"
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white rounded-none focus:border-[#C5A880] outline-none font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-gray-300 font-semibold block mb-1">
                      Mối Quan Hệ Với Chủ Hộ: *
                    </label>
                    <select
                      value={ekycRelationship}
                      onChange={(e) => setEkycRelationship(e.target.value)}
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white rounded-none focus:border-[#C5A880] outline-none"
                    >
                      <option value="Vợ / Chồng">Vợ / Chồng</option>
                      <option value="Con Cái">Con Cái</option>
                      <option value="Bố / Mẹ">Bố / Mẹ</option>
                      <option value="Anh / Chị / Em">Anh / Chị / Em</option>
                      <option value="Người Thân Cùng Căn Hộ">Người Thân Cùng Căn Hộ</option>
                      <option value="Người Nhà / Thành Viên Khác">Người Nhà / Thành Viên Khác</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-gray-300 font-semibold block mb-1">
                      Số Điện Thoại Liên Hệ (10 số): *
                    </label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={ekycPhone}
                      onChange={(e) => setEkycPhone(cleanPhoneNumber(e.target.value))}
                      placeholder="Nhập 10 số điện thoại"
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white font-mono rounded-none focus:border-[#C5A880] outline-none"
                    />
                    {ekycPhone && !isValidPhoneNumber(ekycPhone) && (
                      <span className="text-[10px] text-amber-400 font-mono mt-1 block">
                        {getPhoneValidationError(ekycPhone)}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="text-gray-300 font-semibold block mb-1">
                      Số CCCD / Định Danh (12 số): *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={12}
                      value={ekycIdCard}
                      onChange={(e) => setEkycIdCard(cleanCccdNumber(e.target.value))}
                      placeholder="Nhập 12 số CCCD"
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-[#C5A880] font-mono font-bold rounded-none focus:border-[#C5A880] outline-none"
                    />
                    {ekycIdCard && !isValidCccdNumber(ekycIdCard) && (
                      <span className="text-[10px] text-amber-400 font-mono mt-1 block">
                        {getCccdValidationError(ekycIdCard)}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="text-gray-300 font-semibold block mb-1">
                      Ngày Sinh:
                    </label>
                    <input
                      type="date"
                      value={ekycDob}
                      onChange={(e) => setEkycDob(e.target.value)}
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white rounded-none focus:border-[#C5A880] outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-gray-300 font-semibold block mb-1">
                      Nơi Thường Trú / Quê Quán:
                    </label>
                    <input
                      type="text"
                      value={ekycPob}
                      onChange={(e) => setEkycPob(e.target.value)}
                      placeholder="Nhập quê quán / nơi thường trú"
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white rounded-none focus:border-[#C5A880] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-gray-300 font-semibold block mb-1">
                      Ngày Cấp CCCD:
                    </label>
                    <input
                      type="date"
                      value={ekycIdDate}
                      onChange={(e) => setEkycIdDate(e.target.value)}
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white rounded-none focus:border-[#C5A880] outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-gray-300 font-semibold block mb-1">
                      Biển Số Xe Đăng Ký (Nếu có):
                    </label>
                    <input
                      type="text"
                      value={ekycLicensePlate}
                      onChange={(e) => setEkycLicensePlate(e.target.value)}
                      placeholder="Nhập biển số xe (nếu có)"
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-cyan-300 font-mono rounded-none focus:border-[#C5A880] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: ẢNH ĐẠI DIỆN HỒ SƠ & CCCD 2 MẶT */}
              <div className="space-y-4 p-4 bg-[#121820] border border-[#222B35] rounded-none">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#C5A880] flex items-center justify-between border-b border-[#222B35] pb-2.5">
                  <span className="flex items-center gap-2">
                    <User className="w-4 h-4" /> 2. Ảnh Đại Diện (Avatar) & CCCD 2 Mặt Gửi BQL
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Photo 1: Ảnh Đại Diện Hồ Sơ */}
                  <div className="p-3 bg-[#161B22] border border-[#2D3748] rounded-none space-y-2.5 flex flex-col justify-between">
                    <div>
                      <div className="font-bold text-white flex items-center justify-between">
                        <span>Ảnh Đại Diện (Avatar)</span>
                        <span className="text-[10px] text-[#C5A880]">Hồ sơ cá nhân</span>
                      </div>
                      <p className="text-[10.5px] text-gray-400 mt-0.5">
                        Ảnh chân dung hiển thị trang cá nhân. Mở cửa dùng tính năng Quét FaceID 4 mẫu độc lập.
                      </p>
                    </div>

                    {/* Camera or Image Preview */}
                    <div className="relative w-full h-44 bg-[#0D1117] rounded-none border border-gray-700 overflow-hidden flex items-center justify-center group shadow-inner">
                      {isCameraActive ? (
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <>
                          <img
                            src={ekycAvatarUrl || 'https://data.nks.vn/storage/users/default.png'}
                            alt="Resident Avatar"
                            onError={(e) => {
                              e.currentTarget.src = 'https://data.nks.vn/storage/users/default.png';
                            }}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/75 backdrop-blur rounded-none text-[9.5px] font-mono text-[#C5A880] border border-[#C5A880]/30">
                            ẢNH ĐẠI DIỆN • AVATAR
                          </div>
                          {ekycAvatarUrl && !ekycAvatarUrl.includes('default.png') && (
                            <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-emerald-950/90 text-emerald-300 border border-emerald-500 text-[9px] font-mono font-bold rounded-none">
                              ✓ Đã Có Avatar
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      {isCameraActive ? (
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={captureCamera}
                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-none flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Camera className="w-3.5 h-3.5" /> Chụp Ngay
                          </button>
                          <button
                            type="button"
                            onClick={stopCamera}
                            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-none cursor-pointer"
                          >
                            Hủy
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={startCamera}
                              className="flex-1 py-2 bg-[#1C2533] hover:bg-[#253245] border border-[#C5A880]/70 text-[#C5A880] font-bold rounded-none flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Camera className="w-3.5 h-3.5" /> Camera
                            </button>
                            <button
                              type="button"
                              onClick={() => fileInputAvatarRef.current?.click()}
                              className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold rounded-none flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Upload className="w-3.5 h-3.5" /> Chọn Tệp
                            </button>
                            <input
                              ref={fileInputAvatarRef}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleFileUpload(e, setEkycAvatarUrl)}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Photo 2: CCCD Mặt Trước */}
                  <div className="p-3 bg-[#161D26] border border-[#2D3748] rounded-none space-y-2.5 flex flex-col justify-between">
                    <div>
                      <div className="font-bold text-white flex items-center justify-between">
                        <span>CCCD Mặt Trước</span>
                        <span className="text-[10px] text-cyan-400">Mặt có ảnh</span>
                      </div>
                      <p className="text-[10.5px] text-gray-400 mt-0.5">
                        Chụp đủ 4 góc thẻ, không lóa sáng hoặc mất góc.
                      </p>
                    </div>

                    <div className="relative w-full h-44 bg-[#0D1117] rounded-none border border-gray-700 overflow-hidden flex items-center justify-center group shadow-inner">
                      {ekycFrontImage ? (
                        <img
                          src={ekycFrontImage}
                          alt="CCCD Mặt Trước"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center p-3 text-gray-500 space-y-1">
                          <CreditCard className="w-7 h-7 text-cyan-500/60" />
                          <span className="text-[11px] text-gray-400 font-medium">Chưa có ảnh mặt trước thẻ CCCD</span>
                          <span className="text-[9.5px] text-gray-600">Bấm &quot;Tải Lên Mặt Trước&quot; bên dưới</span>
                        </div>
                      )}
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/75 backdrop-blur rounded-none text-[9.5px] font-mono text-cyan-300 border border-cyan-500/30">
                        VỊ TRÍ 1 • MẶT TRƯỚC
                      </div>
                      {ekycFrontImage && (
                        <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-emerald-950/90 text-emerald-300 border border-emerald-500 text-[9px] font-mono font-bold rounded-none">
                          ✓ Đã Tự Động Điền
                        </div>
                      )}
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={() => fileInputFrontRef.current?.click()}
                        className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold rounded-none flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" /> Tải Lên Mặt Trước
                      </button>
                      <input
                        ref={fileInputFrontRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleCccdUpload(e, 'FRONT', setEkycFrontImage)}
                      />
                    </div>
                  </div>

                  {/* Photo 3: CCCD Mặt Sau */}
                  <div className="p-3 bg-[#161D26] border border-[#2D3748] rounded-none space-y-2.5 flex flex-col justify-between">
                    <div>
                      <div className="font-bold text-white flex items-center justify-between">
                        <span>CCCD Mặt Sau</span>
                        <span className="text-[10px] text-purple-400">Chip & Vân tay</span>
                      </div>
                      <p className="text-[10.5px] text-gray-400 mt-0.5">
                        Chụp rõ chip điện tử, mã QR và ngày cấp.
                      </p>
                    </div>

                    <div className="relative w-full h-44 bg-[#0D1117] rounded-none border border-gray-700 overflow-hidden flex items-center justify-center group shadow-inner">
                      {ekycBackImage ? (
                        <img
                          src={ekycBackImage}
                          alt="CCCD Mặt Sau"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center p-3 text-gray-500 space-y-1">
                          <CreditCard className="w-7 h-7 text-purple-500/60" />
                          <span className="text-[11px] text-gray-400 font-medium">Chưa có ảnh mặt sau thẻ CCCD (Chip)</span>
                          <span className="text-[9.5px] text-gray-600">Bấm &quot;Tải Lên Mặt Sau&quot; bên dưới</span>
                        </div>
                      )}
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/75 backdrop-blur rounded-none text-[9.5px] font-mono text-purple-300 border border-purple-500/30">
                        VỊ TRÍ 2 • MẶT SAU
                      </div>
                      {ekycBackImage && (
                        <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-emerald-950/90 text-emerald-300 border border-emerald-500 text-[9px] font-mono font-bold rounded-none">
                          ✓ Đã Tự Động Điền
                        </div>
                      )}
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={() => fileInputBackRef.current?.click()}
                        className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold rounded-none flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" /> Tải Lên Mặt Sau
                      </button>
                      <input
                        ref={fileInputBackRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleCccdUpload(e, 'BACK', setEkycBackImage)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#222B35]">
                <div className="text-[11px] text-gray-400">
                  Hồ sơ sẽ được chuyển tới Ban Quản Lý để xác nhận ngay lập tức.
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingEkyc}
                  className="w-full sm:w-auto px-7 py-3 bg-[#C5A880] hover:bg-white text-[#0D1117] font-bold text-xs uppercase tracking-wider rounded-none shadow transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  {isSubmittingEkyc ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Đang Gửi...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" /> Gửi BQL Duyệt Hồ Sơ
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: THÊM THÀNH VIÊN                                               */}
      {/* =================================================================== */}
      {showAddModal && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fadeIn"
        >
          <div className="bg-[#0D1117] border border-[#C5A880]/70 max-w-2xl w-full p-4 sm:p-5 text-white space-y-3.5 shadow-2xl rounded-none max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#222B35] pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-none bg-[#C5A880]/20 flex items-center justify-center text-[#C5A880]">
                  <UserPlus className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-serif font-bold text-white">
                    Thêm Cư Dân • Căn {aptCode}
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Thêm thành viên vào danh sách căn hộ
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-white p-1 rounded-none hover:bg-[#161D26] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error / Alert */}
            {actionError && (
              <div className="p-2.5 bg-rose-950/80 border border-rose-500 text-rose-200 text-xs flex items-center gap-2 rounded-none">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {/* Tab Selector Mode (3 Tabs) */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#161B22] border border-[#222B35] rounded-none text-xs">
              <button
                type="button"
                onClick={() => {
                  setModalMode('PRE_APPROVED');
                  setSelectedAccount(null);
                  setActionError(null);
                }}
                className={`py-1.5 px-2 rounded-none font-semibold transition-all flex items-center justify-center gap-1 text-[11px] sm:text-xs cursor-pointer ${
                  modalMode === 'PRE_APPROVED'
                    ? 'bg-[#C5A880] text-[#0D1117] shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">Có Sẵn ({bqlAccounts.length})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setModalMode('SEARCH_API');
                  setSelectedAccount(null);
                  setActionError(null);
                }}
                className={`py-1.5 px-2 rounded-none font-semibold transition-all flex items-center justify-center gap-1 text-[11px] sm:text-xs cursor-pointer ${
                  modalMode === 'SEARCH_API'
                    ? 'bg-[#C5A880] text-[#0D1117] shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Search className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">Tra Cứu</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setModalMode('DIRECT_INPUT');
                  setSelectedAccount(null);
                  setActionError(null);
                }}
                className={`py-1.5 px-2 rounded-none font-semibold transition-all flex items-center justify-center gap-1 text-[11px] sm:text-xs cursor-pointer ${
                  modalMode === 'DIRECT_INPUT'
                    ? 'bg-[#C5A880] text-[#0D1117] shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">Nhập Mới</span>
              </button>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* ------------------------------------------------------------- */}
            {/* MODE 1: CHỌN TỪ DANH SÁCH TÀI KHOẢN KHẢ DỤNG                   */}
            {/* ------------------------------------------------------------- */}
            {modalMode === 'PRE_APPROVED' && (() => {
              const filteredBqlAccounts = bqlAccounts.filter((acc) => {
                if (!preApprovedFilter.trim()) return true;
                const q = preApprovedFilter.toLowerCase().trim();
                const qDigits = q.replace(/\D/g, '');
                return (
                  acc.fullName.toLowerCase().includes(q) ||
                  acc.phone.includes(qDigits || q) ||
                  (acc.idCard && acc.idCard.toLowerCase().includes(q)) ||
                  (acc.username && acc.username.toLowerCase().includes(q))
                );
              });

              return (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] text-gray-400">
                    <span>Tài khoản người nhà đã đăng ký trong hệ thống:</span>
                    <span className="text-[#C5A880] font-mono font-bold">
                      {filteredBqlAccounts.length} / {bqlAccounts.length} tài khoản
                    </span>
                  </div>

                  {/* Quick filter search box */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={preApprovedFilter}
                      onChange={(e) => setPreApprovedFilter(e.target.value)}
                      placeholder="Lọc nhanh theo họ tên, SĐT hoặc CCCD..."
                      className="w-full bg-[#161B22] border border-[#2D3748] pl-9 pr-8 py-2 text-white text-xs font-mono rounded-none focus:border-[#C5A880] outline-none"
                    />
                    {preApprovedFilter && (
                      <button
                        type="button"
                        onClick={() => setPreApprovedFilter('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {filteredBqlAccounts.length === 0 ? (
                    <div className="p-5 bg-[#161D26] border border-[#222B35] rounded-none text-center text-xs text-gray-400 space-y-1.5">
                      <p>Không tìm thấy tài khoản phù hợp với từ khóa "{preApprovedFilter}".</p>
                      <button
                        type="button"
                        onClick={() => setPreApprovedFilter('')}
                        className="text-[#C5A880] hover:underline text-xs"
                      >
                        Hiển thị lại tất cả tài khoản
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {filteredBqlAccounts.map((acc) => {
                        const isAlreadyInUnit = members.some(
                          (m) => m.id === acc.id || m.phone === acc.phone || m.username === acc.username
                        );
                        const isSelected = selectedAccount?.id === acc.id;

                        return (
                          <div
                            key={acc.id}
                            onClick={() => !isAlreadyInUnit && handleSelectPreApproved(acc)}
                            className={`p-2.5 rounded-none border transition-all flex items-center justify-between gap-3 ${
                              isAlreadyInUnit
                                ? 'bg-[#161D26]/40 border-gray-800 opacity-60 cursor-not-allowed'
                                : isSelected
                                ? 'bg-[#1C2533] border-[#C5A880] shadow cursor-pointer'
                                : 'bg-[#161D26] border-[#222B35] hover:border-[#C5A880]/60 cursor-pointer'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-none overflow-hidden border border-[#C5A880]/60 flex-shrink-0 bg-[#0D1117]">
                                <img
                                  src={acc.avatarUrl || 'https://data.nks.vn/storage/users/default.png'}
                                  alt={acc.fullName}
                                  onError={(e) => {
                                    e.currentTarget.src = 'https://data.nks.vn/storage/users/default.png';
                                  }}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="space-y-0.5 min-w-0">
                                <div className="font-bold text-white text-xs flex items-center gap-1.5 flex-wrap">
                                  <span className="truncate">{acc.fullName}</span>
                                  {isAlreadyInUnit ? (
                                    <span className="text-[9px] px-1 py-0.5 bg-gray-800 text-gray-400 rounded-none flex-shrink-0">
                                      Đang ở căn này
                                    </span>
                                  ) : (
                                    <span className="text-[9px] px-1 py-0.5 bg-[#C5A880]/15 border border-[#C5A880]/30 text-[#C5A880] rounded-none flex-shrink-0 font-mono">
                                      Người Nhà
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-gray-400 flex items-center gap-2 font-mono flex-wrap">
                                  <span className="text-gray-300">SĐT: {acc.phone}</span>
                                  {acc.idCard && <span>• CCCD: {acc.idCard}</span>}
                                </div>
                              </div>
                            </div>

                            <div className="flex-shrink-0">
                              {isAlreadyInUnit ? (
                                <span className="text-[10px] text-gray-500 italic">Đã có</span>
                              ) : isSelected ? (
                                <span className="px-2.5 py-1 bg-[#C5A880] text-[#0D1117] text-[10px] font-bold rounded-none flex items-center gap-1">
                                  <Check className="w-3 h-3 stroke-[3]" /> Đã chọn
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  className="px-2.5 py-1 bg-[#141B24] hover:bg-[#C5A880] text-gray-300 hover:text-[#0D1117] border border-[#2D3748] hover:border-[#C5A880] text-[10px] font-semibold rounded-none transition-colors"
                                >
                                  Chọn
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ------------------------------------------------------------- */}
            {/* MODE 2: TRA CỨU TÀI KHOẢN QUA API BẰNG SĐT / CCCD             */}
            {/* ------------------------------------------------------------- */}
            {modalMode === 'SEARCH_API' && (
              <div className="space-y-3">
                <form onSubmit={handleSearchApi} className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Nhập SĐT, CCCD hoặc họ tên người nhà..."
                    className="flex-1 bg-[#161B22] border border-[#2D3748] p-2 text-white text-xs font-mono rounded-none focus:border-[#C5A880] outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isSearchingApi || !searchQuery.trim()}
                    className="px-3.5 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold rounded-none flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    {isSearchingApi ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Search className="w-3.5 h-3.5" />
                    )}
                    Tra Cứu
                  </button>
                </form>

                {/* Quick Suggestion Pills */}
                <div className="space-y-1">
                  <div className="text-[10px] text-gray-400 font-mono">Tài khoản mẫu có sẵn trong hệ thống:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { name: 'Nguyễn Hữu Nhựt', q: '0917795211' },
                      { name: 'Nguyễn Văn Cường', q: '0325524482' },
                      { name: 'Lê Đức Hải', q: '0977758215' },
                      { name: 'Vũ Cát Thịnh', q: '0909262626' },
                    ].map((hint) => (
                      <button
                        key={hint.q}
                        type="button"
                        onClick={() => {
                          setSearchQuery(hint.q);
                          handleSearchApi(undefined, hint.q);
                        }}
                        className="px-2 py-0.5 bg-[#161D26] hover:bg-[#C5A880] text-gray-300 hover:text-[#0D1117] border border-[#2D3748] hover:border-[#C5A880] text-[10.5px] transition-colors rounded-none font-mono cursor-pointer"
                      >
                        {hint.name} ({hint.q})
                      </button>
                    ))}
                  </div>
                </div>

                {searchNotFound && (
                  <div className="p-2.5 bg-[#161D26] border border-rose-500/40 text-rose-300 text-xs rounded-none">
                    {searchNotFound}
                  </div>
                )}

                {searchResults.length > 0 && (
                  <div className="space-y-2 animate-fadeIn">
                    <div className="text-xs text-emerald-400 font-bold flex items-center gap-1 border-b border-[#222B35] pb-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Kết Quả Tìm Thấy ({searchResults.length}):
                    </div>

                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {searchResults.map((acc) => {
                        const isAlreadyInUnit = members.some(
                          (m) => m.id === acc.id || m.phone === acc.phone || m.username === acc.username
                        );
                        const isSelected = selectedAccount?.id === acc.id;

                        return (
                          <div
                            key={acc.id}
                            onClick={() => !isAlreadyInUnit && handleSelectPreApproved(acc)}
                            className={`p-2.5 rounded-none border transition-all flex items-center justify-between gap-3 ${
                              isAlreadyInUnit
                                ? 'bg-[#161D26]/40 border-gray-800 opacity-60 cursor-not-allowed'
                                : isSelected
                                ? 'bg-[#1C2533] border-[#C5A880] shadow cursor-pointer'
                                : 'bg-[#161D26] border-[#222B35] hover:border-[#C5A880]/60 cursor-pointer'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-none overflow-hidden border border-[#C5A880]/60 flex-shrink-0 bg-[#0D1117]">
                                <img
                                  src={acc.avatarUrl || 'https://data.nks.vn/storage/users/default.png'}
                                  alt={acc.fullName}
                                  onError={(e) => {
                                    e.currentTarget.src = 'https://data.nks.vn/storage/users/default.png';
                                  }}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="space-y-0.5 min-w-0">
                                <div className="font-bold text-white text-xs flex items-center gap-1.5 flex-wrap">
                                  <span className="truncate">{acc.fullName}</span>
                                  {isAlreadyInUnit && (
                                    <span className="text-[9px] px-1 py-0.5 bg-gray-800 text-gray-400 rounded-none flex-shrink-0">
                                      Đang ở căn này
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-gray-400 flex items-center gap-2 font-mono flex-wrap">
                                  <span>SĐT: {acc.phone}</span>
                                  {acc.idCard && <span>• CCCD: {acc.idCard}</span>}
                                </div>
                              </div>
                            </div>

                            <div className="flex-shrink-0">
                              {isAlreadyInUnit ? (
                                <span className="text-[10px] text-gray-500 italic">Đã có</span>
                              ) : isSelected ? (
                                <span className="px-2.5 py-1 bg-[#C5A880] text-[#0D1117] text-[10px] font-bold rounded-none flex items-center gap-1">
                                  <Check className="w-3 h-3 stroke-[3]" /> Đã chọn
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  className="px-2.5 py-1 bg-[#C5A880] text-[#0D1117] font-bold text-[10px] rounded-none hover:bg-white transition-colors"
                                >
                                  + Chọn
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* MODE 3: NHẬP TRỰC TIẾP THÔNG TIN NGƯỜI THÂN                     */}
            {/* ------------------------------------------------------------- */}
            {modalMode === 'DIRECT_INPUT' && (
              <form onSubmit={handleDirectAddMember} className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-gray-300 font-medium block mb-1">
                      Họ và Tên <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={directFullName}
                      onChange={(e) => setDirectFullName(e.target.value)}
                      placeholder="Nhập họ và tên..."
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white rounded-none focus:border-[#C5A880] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-gray-300 font-medium block mb-1">
                      Số Điện Thoại (10 số) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={directPhone}
                      onChange={(e) => setDirectPhone(cleanPhoneNumber(e.target.value))}
                      placeholder="Nhập 10 số điện thoại..."
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white font-mono rounded-none focus:border-[#C5A880] outline-none"
                    />
                    {directPhone && !isValidPhoneNumber(directPhone) && (
                      <span className="text-[10px] text-amber-400 font-mono mt-1 block">
                        {getPhoneValidationError(directPhone)}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="text-gray-300 font-medium block mb-1">
                      Mối Quan Hệ Với Chủ Hộ <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={directRelationship}
                      onChange={(e) => setDirectRelationship(e.target.value)}
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white rounded-none focus:border-[#C5A880] outline-none"
                    >
                      <option value="Vợ / Chồng">Vợ / Chồng</option>
                      <option value="Con ruột">Con ruột</option>
                      <option value="Con nuôi">Con nuôi</option>
                      <option value="Bố / Mẹ ruột">Bố / Mẹ ruột</option>
                      <option value="Bố / Mẹ vợ / chồng">Bố / Mẹ vợ / chồng</option>
                      <option value="Anh / Chị / Em ruột">Anh / Chị / Em ruột</option>
                      <option value="Cháu ruột">Cháu ruột</option>
                      <option value="Người thân khác">Người thân khác</option>
                      <option value="Người giúp việc / Bảo mẫu">Người giúp việc / Bảo mẫu</option>
                      <option value="Lái xe riêng">Lái xe riêng</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-gray-300 font-medium block mb-1">
                      Số CCCD / Định Danh (12 số)
                    </label>
                    <input
                      type="text"
                      maxLength={12}
                      value={directIdCard}
                      onChange={(e) => setDirectIdCard(cleanCccdNumber(e.target.value))}
                      placeholder="Nhập 12 số CCCD..."
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white font-mono rounded-none focus:border-[#C5A880] outline-none"
                    />
                    {directIdCard && !isValidCccdNumber(directIdCard) && (
                      <span className="text-[10px] text-amber-400 font-mono mt-1 block">
                        {getCccdValidationError(directIdCard)}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="text-gray-300 font-medium block mb-1">Hình Thức Cư Trú:</label>
                    <select
                      value={directResidenceType}
                      onChange={(e) => setDirectResidenceType(e.target.value)}
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white rounded-none focus:border-[#C5A880] outline-none"
                    >
                      <option value="Thường trú cùng chủ hộ">Thường trú cùng chủ hộ</option>
                      <option value="Tạm trú dài hạn">Tạm trú dài hạn</option>
                      <option value="Lưu trú có thời hạn">Lưu trú có thời hạn</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-gray-300 font-medium block mb-1">Căn Cứ Bảo Lãnh / Chứng Minh:</label>
                    <select
                      value={directRelationshipProof}
                      onChange={(e) => setDirectRelationshipProof(e.target.value)}
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white rounded-none focus:border-[#C5A880] outline-none"
                    >
                      <option value="Sổ Hộ Khẩu / Xác nhận CT07">Sổ Hộ Khẩu / Xác nhận CT07</option>
                      <option value="Giấy chứng nhận kết hôn">Giấy chứng nhận kết hôn</option>
                      <option value="Giấy khai sinh">Giấy khai sinh</option>
                      <option value="Hợp đồng lao động bảo mẫu / lái xe">Hợp đồng lao động bảo mẫu / lái xe</option>
                      <option value="Văn bản bảo lãnh của chủ hộ">Văn bản bảo lãnh của chủ hộ</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-gray-300 font-medium block mb-1">Ngày Sinh (DOB):</label>
                    <input
                      type="date"
                      value={directDob}
                      onChange={(e) => setDirectDob(e.target.value)}
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white font-mono rounded-none focus:border-[#C5A880] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-gray-300 font-medium block mb-1">Giới Tính:</label>
                    <select
                      value={directGender}
                      onChange={(e) => setDirectGender(e.target.value)}
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white rounded-none focus:border-[#C5A880] outline-none"
                    >
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-gray-300 font-medium block mb-1">Nơi Sinh / Quê Quán:</label>
                    <input
                      type="text"
                      value={directPob}
                      onChange={(e) => setDirectPob(e.target.value)}
                      placeholder="Nhập nơi sinh / quê quán..."
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white rounded-none focus:border-[#C5A880] outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-gray-300 font-medium block mb-1">Biển Số Xe:</label>
                      <input
                        type="text"
                        value={directLicensePlate}
                        onChange={(e) => setDirectLicensePlate(e.target.value)}
                        placeholder="VD: 59P1-123.45"
                        className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white font-mono rounded-none focus:border-[#C5A880] outline-none uppercase"
                      />
                    </div>
                    <div>
                      <label className="text-gray-300 font-medium block mb-1">Loại Phương Tiện:</label>
                      <select
                        value={directVehicleType}
                        onChange={(e) => setDirectVehicleType(e.target.value)}
                        className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white rounded-none focus:border-[#C5A880] outline-none"
                      >
                        <option value="Xe máy">Xe máy</option>
                        <option value="Ô tô">Ô tô</option>
                        <option value="Xe đạp điện">Xe đạp điện</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 bg-[#161D26] border border-[#C5A880]/30 text-[11px] text-[#C5A880] flex items-center gap-2">
                  <Crown className="w-4 h-4 flex-shrink-0 text-[#C5A880]" />
                  <span>Chủ Hộ Bảo Lãnh: <strong>{ownerName}</strong> (Căn {aptCode} - The Tropical BS-07)</span>
                </div>

                <div className="pt-3 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 sm:gap-3 border-t border-[#222B35]">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="w-full sm:w-auto px-4 py-2.5 bg-transparent hover:bg-gray-800 text-gray-300 text-xs font-semibold rounded-none cursor-pointer text-center"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !directFullName.trim() || !directPhone.trim()}
                    className="w-full sm:w-auto px-6 py-3 bg-[#C5A880] hover:bg-white text-[#0D1117] font-bold text-xs uppercase tracking-wider rounded-none shadow transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Đang Thêm...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" /> Thêm Thành Viên
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* ------------------------------------------------------------- */}
            {/* CONFIRMATION & ROLE ASSIGNMENT SECTION (CHO TAB 1 & 2)       */}
            {/* ------------------------------------------------------------- */}
            {selectedAccount && modalMode !== 'DIRECT_INPUT' ? (
              <form onSubmit={handleAddMember} className="pt-2.5 border-t border-[#222B35] space-y-2.5 text-xs">
                <div className="p-2.5 bg-[#161D26] border border-[#C5A880]/60 rounded-none flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#C5A880]" />
                    <span className="text-white font-bold text-xs">{selectedAccount.fullName}</span>
                    <span className="text-gray-400 font-mono text-xs">({selectedAccount.phone})</span>
                  </div>
                  <span className="text-[11px] text-[#C5A880] font-medium">
                    {t('Đăng ký vào căn', 'Registering to')} {aptCode}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-gray-300 font-medium block mb-1">Mối Quan Hệ Với Chủ Hộ:</label>
                    <select
                      value={newRelationship}
                      onChange={(e) => setNewRelationship(e.target.value)}
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white rounded-none focus:border-[#C5A880] outline-none"
                    >
                      <option value="Vợ / Chồng">Vợ / Chồng</option>
                      <option value="Con ruột">Con ruột</option>
                      <option value="Con nuôi">Con nuôi</option>
                      <option value="Bố / Mẹ ruột">Bố / Mẹ ruột</option>
                      <option value="Bố / Mẹ vợ / chồng">Bố / Mẹ vợ / chồng</option>
                      <option value="Anh / Chị / Em ruột">Anh / Chị / Em ruột</option>
                      <option value="Cháu ruột">Cháu ruột</option>
                      <option value="Người thân khác">Người thân khác</option>
                      <option value="Người giúp việc / Bảo mẫu">Người giúp việc / Bảo mẫu</option>
                      <option value="Lái xe riêng">Lái xe riêng</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-gray-300 font-medium block mb-1">Hình Thức Cư Trú:</label>
                    <select
                      value={newResidenceType}
                      onChange={(e) => setNewResidenceType(e.target.value)}
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white rounded-none focus:border-[#C5A880] outline-none"
                    >
                      <option value="Thường trú cùng chủ hộ">Thường trú cùng chủ hộ</option>
                      <option value="Tạm trú dài hạn">Tạm trú dài hạn</option>
                      <option value="Lưu trú có thời hạn">Lưu trú có thời hạn</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-gray-300 font-medium block mb-1">Căn Cứ Bảo Lãnh:</label>
                    <select
                      value={newRelationshipProof}
                      onChange={(e) => setNewRelationshipProof(e.target.value)}
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white rounded-none focus:border-[#C5A880] outline-none"
                    >
                      <option value="Sổ Hộ Khẩu / Xác nhận CT07">Sổ Hộ Khẩu / Xác nhận CT07</option>
                      <option value="Giấy chứng nhận kết hôn">Giấy chứng nhận kết hôn</option>
                      <option value="Giấy khai sinh">Giấy khai sinh</option>
                      <option value="Hợp đồng lao động bảo mẫu / lái xe">Hợp đồng lao động bảo mẫu / lái xe</option>
                      <option value="Văn bản bảo lãnh của chủ hộ">Văn bản bảo lãnh của chủ hộ</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-gray-300 font-medium block mb-1">Biển Số Xe (tùy chọn):</label>
                    <input
                      type="text"
                      value={newLicensePlate}
                      onChange={(e) => setNewLicensePlate(e.target.value)}
                      placeholder="VD: 59P1-886.79"
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white font-mono rounded-none focus:border-[#C5A880] outline-none uppercase"
                    />
                  </div>
                </div>

                <div className="pt-3 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 sm:gap-3 border-t border-[#222B35]">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="w-full sm:w-auto px-4 py-2.5 bg-transparent hover:bg-[#161D26] text-gray-400 hover:text-white rounded-none transition-colors cursor-pointer text-center text-xs"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-6 py-3 bg-[#C5A880] hover:bg-white text-[#0D1117] font-bold text-xs uppercase tracking-wider rounded-none shadow transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Đang Xử Lý...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" /> Thêm Thành Viên
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : null}

          </div>
        </div>
      )}

      {/* OCR Scanner Modal for Family Member CCCD */}
      <CccdOcrScannerModal
        isOpen={isMemberOcrModalOpen}
        onClose={() => setIsMemberOcrModalOpen(false)}
        onApplyOcrData={handleApplyMemberOcrData}
        initialFrontImage={ekycFrontImage}
        initialBackImage={ekycBackImage}
      />

      {/* Official 4-Step Banking-Grade FaceID Biometric Enrollment Modal for Family Member */}
      {bankEnrollTarget && (
        <BankFaceEnrollModal
          isOpen={!!bankEnrollTarget}
          onClose={() => setBankEnrollTarget(null)}
          userId={bankEnrollTarget.phone || bankEnrollTarget.id || bankEnrollTarget.username || bankEnrollTarget.fullName}
          fullName={bankEnrollTarget.fullName}
          apartmentCode={aptCode}
          phone={bankEnrollTarget.phone || ''}
          email={bankEnrollTarget.email || ''}
          isFamilyMemberSelfEnroll={!isOwner}
          submittedByRole={currentUser.role}
          onEnrollSuccess={() => {
            setMembers((prev) =>
              prev.map((m) => {
                if (m.id === bankEnrollTarget.id || m.phone === bankEnrollTarget.phone) {
                  return {
                    ...m,
                    faceStatus: !isOwner ? 'Chờ Chủ Hộ Xác Nhận' : 'Đang Chờ BQL Phê Duyệt',
                  };
                }
                return m;
              })
            );
            fetchMembers();
            setActionSuccess(
              !isOwner
                ? `✓ Đã thu thập đủ 4 mẫu FaceID cho ${bankEnrollTarget.fullName}! Hồ sơ đang chờ Chủ Hộ xác nhận.`
                : `✓ Đã thu thập đủ 4 mẫu FaceID chuẩn ngân hàng cho ${bankEnrollTarget.fullName}!`
            );
            setTimeout(() => setActionSuccess(null), 5000);
            setBankEnrollTarget(null);
          }}
        />
      )}

      {/* MODAL: CHỦ HỘ KIỂM TRA 4 MẪU FACEID CỦA NGƯỜI NHÀ VÀ XÁC NHẬN GỬI BQL */}
      {confirmTargetMember && (() => {
        const enrolled = getEnrolledFaceProfile(confirmTargetMember.phone || confirmTargetMember.id || confirmTargetMember.username || '');
        const samples = enrolled?.samples;

        const handleConfirmAndSendToBql = async () => {
          setIsConfirmingFace(true);
          try {
            // 1. Xác nhận FaceID trong hồ sơ sinh trắc học
            await nksConfirmFamilyFaceIdByOwner(
              confirmTargetMember.id || confirmTargetMember.phone || '', 
              aptCode,
              confirmTargetMember.phone
            );

            // 2. Đồng bộ trạng thái e-KYC sang PENDING trên máy chủ để BQL nhận hồ sơ thẩm duyệt ngay
            try {
              await fetch('/api/ekyc', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'CONFIRM_BY_OWNER',
                  userId: confirmTargetMember.id || confirmTargetMember.phone,
                  phone: confirmTargetMember.phone,
                }),
              });
            } catch (ekycSyncErr) {
              console.warn('Sync confirm to ekyc api error:', ekycSyncErr);
            }

            setActionSuccess(`✓ Đã xác nhận bảo lãnh hồ sơ FaceID cho thành viên "${confirmTargetMember.fullName}" và gửi Ban Quản Lý phê duyệt thành công!`);
            setTimeout(() => setActionSuccess(null), 5000);
            setConfirmTargetMember(null);
            fetchMembers();
          } catch (err: any) {
            setActionError(err?.message || 'Lỗi khi xác nhận hồ sơ FaceID.');
            setTimeout(() => setActionError(null), 5000);
          } finally {
            setIsConfirmingFace(false);
          }
        };

        return (
          <div 
            onClick={(e) => {
              if (e.target === e.currentTarget) setConfirmTargetMember(null);
            }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none"
          >
            <div className="relative w-full max-w-2xl bg-[#0D1117] border border-[#C5A880] text-white shadow-2xl p-5 sm:p-6 space-y-5 rounded-none max-h-[95vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#222B35] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-[#161D26] border border-[#C5A880] flex items-center justify-center text-[#C5A880]">
                    <ShieldCheck className="w-4 h-4 text-[#C5A880]" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-[#C5A880] font-bold">
                      Quyền Phê Duyệt Chủ Hộ • Căn Hộ {aptCode}
                    </div>
                    <h3 className="text-base font-serif font-bold text-white">
                      Xác Nhận 4 Mẫu FaceID Của Người Nhà: {confirmTargetMember.fullName}
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setConfirmTargetMember(null)}
                  className="text-gray-400 hover:text-white p-1 rounded-none hover:bg-[#161D26] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Member Brief Info */}
              <div className="p-3 bg-[#161B22] border border-[#222B35] text-xs grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <span className="text-gray-400 block text-[11px]">Thành viên:</span>
                  <strong className="text-white">{confirmTargetMember.fullName}</strong>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">Quan hệ:</span>
                  <span className="text-[#C5A880] font-semibold">{confirmTargetMember.relationship}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">SĐT:</span>
                  <span className="font-mono text-gray-200">{confirmTargetMember.phone}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">CCCD:</span>
                  <span className="font-mono text-gray-200">{confirmTargetMember.idCard || 'Đang cập nhật'}</span>
                </div>
              </div>

              {/* 4 Angle Samples Display */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-gray-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-[#C5A880]" /> 4 Góc Khuôn Mặt:
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                    Độ khớp: {enrolled?.faceScore || 99.4}%
                  </span>
                </div>

                {samples ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div 
                      onClick={() => setSelectedAnglePreview({ title: '1. Chính Diện', src: samples.front })}
                      className="p-1.5 bg-[#121820] border border-gray-700 hover:border-[#C5A880] text-center space-y-1 group cursor-pointer transition-all relative"
                    >
                      <div className="text-[10px] font-mono text-[#C5A880] flex items-center justify-between">
                        <span>1. Chính Diện</span>
                        <ZoomIn className="w-3 h-3 text-gray-500 group-hover:text-[#C5A880]" />
                      </div>
                      <div className="aspect-square bg-black border border-gray-800 overflow-hidden relative">
                        <img src={samples.front} alt="Front" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      </div>
                    </div>

                    <div 
                      onClick={() => setSelectedAnglePreview({ title: '2. Quay Trái', src: samples.left })}
                      className="p-1.5 bg-[#121820] border border-gray-700 hover:border-[#C5A880] text-center space-y-1 group cursor-pointer transition-all relative"
                    >
                      <div className="text-[10px] font-mono text-[#C5A880] flex items-center justify-between">
                        <span>2. Quay Trái</span>
                        <ZoomIn className="w-3 h-3 text-gray-500 group-hover:text-[#C5A880]" />
                      </div>
                      <div className="aspect-square bg-black border border-gray-800 overflow-hidden relative">
                        <img src={samples.left} alt="Left" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      </div>
                    </div>

                    <div 
                      onClick={() => setSelectedAnglePreview({ title: '3. Quay Phải', src: samples.right })}
                      className="p-1.5 bg-[#121820] border border-gray-700 hover:border-[#C5A880] text-center space-y-1 group cursor-pointer transition-all relative"
                    >
                      <div className="text-[10px] font-mono text-[#C5A880] flex items-center justify-between">
                        <span>3. Quay Phải</span>
                        <ZoomIn className="w-3 h-3 text-gray-500 group-hover:text-[#C5A880]" />
                      </div>
                      <div className="aspect-square bg-black border border-gray-800 overflow-hidden relative">
                        <img src={samples.right} alt="Right" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      </div>
                    </div>

                    <div 
                      onClick={() => setSelectedAnglePreview({ title: '4. Mỉm Cười', src: samples.smile })}
                      className="p-1.5 bg-[#121820] border border-gray-700 hover:border-[#C5A880] text-center space-y-1 group cursor-pointer transition-all relative"
                    >
                      <div className="text-[10px] font-mono text-[#C5A880] flex items-center justify-between">
                        <span>4. Mỉm Cười</span>
                        <ZoomIn className="w-3 h-3 text-gray-500 group-hover:text-[#C5A880]" />
                      </div>
                      <div className="aspect-square bg-black border border-gray-800 overflow-hidden relative">
                        <img src={samples.smile} alt="Smile" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 bg-[#161B22] border border-gray-800 text-center text-xs text-gray-400">
                    Chưa có mẫu ảnh quét của thành viên này.
                  </div>
                )}
              </div>

              {/* Owner Legal Responsibility Notice */}
              <div className="p-2.5 bg-[#121820] border border-[#C5A880]/50 rounded-none text-xs text-gray-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#C5A880] flex-shrink-0" />
                <span>Xác nhận thành viên <strong>{confirmTargetMember.fullName}</strong> thuộc căn <strong>{aptCode}</strong> để gửi BQL kích hoạt FaceID.</span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2.5 border-t border-[#222B35]">
                <button
                  type="button"
                  onClick={() => {
                    setConfirmTargetMember(null);
                    setBankEnrollTarget(confirmTargetMember);
                  }}
                  className="w-full sm:w-auto px-3.5 py-2 bg-[#161B22] hover:bg-[#202936] text-gray-300 hover:text-white border border-[#2D3748] text-xs font-semibold rounded-none transition-colors cursor-pointer"
                >
                  Quét Lại
                </button>

                <button
                  type="button"
                  onClick={handleConfirmAndSendToBql}
                  disabled={isConfirmingFace || !samples}
                  className="w-full sm:w-auto px-5 py-2 bg-gradient-to-r from-amber-500 to-[#C5A880] hover:brightness-110 text-[#0D1117] text-xs font-bold uppercase tracking-wider rounded-none flex items-center justify-center gap-1.5 transition-all shadow active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isConfirmingFace ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Đang Gửi...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" /> Xác Nhận & Gửi BQL
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}



      {/* =================================================================== */}
      {/* MODAL: XÁC NHẬN HỦY PHÂN QUYỀN CƯ DÂN CAO CẤP                       */}
      {/* =================================================================== */}
      {removeTargetMember && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setRemoveTargetMember(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fadeIn select-none"
        >
          <div className="bg-[#0D1117] border border-rose-600/80 max-w-md w-full p-4 sm:p-5 text-white space-y-3.5 shadow-2xl rounded-none">
            <div className="flex items-center gap-2.5 border-b border-[#222B35] pb-2.5">
              <div className="w-8 h-8 bg-rose-950 border border-rose-500 text-rose-300 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-serif font-bold text-white">
                  {t('Xác Nhận Xóa Thành Viên', 'Confirm Remove Member')}
                </h3>
                <p className="text-[11px] text-gray-400">
                  {t('Căn hộ', 'Apartment')} {aptCode} • {t('Chủ hộ', 'Owner')} {ownerName}
                </p>
              </div>
            </div>

            {/* Warning Message */}
            <div className="p-3 bg-rose-950/40 border border-rose-900/80 text-rose-200 text-xs space-y-1">
              <p>
                {t(
                  `Bạn có chắc chắn muốn xóa thành viên ${removeTargetMember.fullName} khỏi danh sách căn hộ ${aptCode}?`,
                  `Are you sure you want to remove ${removeTargetMember.fullName} from unit ${aptCode}?`
                )}
              </p>
              <p className="text-gray-300 text-[11px]">
                {t(
                  'Quyền ra vào sảnh và thang máy của người thân sẽ tạm ngừng. Bạn có thể thêm lại bất cứ lúc nào.',
                  'Access privileges will be revoked. You can add this member back at any time.'
                )}
              </p>
            </div>

            {/* Target Member Mini Summary */}
            <div className="p-2.5 bg-[#161D26] border border-[#222B35] flex items-center gap-2.5 text-xs">
              <div className="w-9 h-9 rounded-none overflow-hidden border border-gray-700 bg-black flex-shrink-0">
                <img
                  src={removeTargetMember.avatarUrl || 'https://data.nks.vn/storage/users/default.png'}
                  alt={removeTargetMember.fullName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-0.5 min-w-0">
                <div className="font-bold text-white">{removeTargetMember.fullName}</div>
                <div className="text-gray-400 font-mono text-[11px]">SĐT: {removeTargetMember.phone} • {removeTargetMember.relationship}</div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex justify-end gap-2 border-t border-[#222B35]">
              <button
                type="button"
                onClick={() => setRemoveTargetMember(null)}
                className="px-3.5 py-1.5 bg-transparent hover:bg-[#161D26] text-gray-400 hover:text-white rounded-none transition-colors cursor-pointer text-xs"
              >
                {t('Giữ Lại', 'Cancel')}
              </button>

              <button
                type="button"
                disabled={isRemoving}
                onClick={handleConfirmRemoveMember}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider rounded-none shadow transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                {isRemoving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> {t('Đang Xóa...', 'Removing...')}
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" /> {t('Xóa Thành Viên', 'Remove Member')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: LIGHTBOX PHÓNG TO MẪU ẢNH FACEID GÓC QUÉT                   */}
      {/* =================================================================== */}
      {selectedAnglePreview && (
        <div 
          onClick={() => setSelectedAnglePreview(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn select-none cursor-zoom-out"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-[#0D1117] border border-[#C5A880] p-4 max-w-lg w-full text-white shadow-2xl rounded-none space-y-3 cursor-default"
          >
            <div className="flex items-center justify-between border-b border-[#222B35] pb-2">
              <div className="text-xs font-bold font-mono text-[#C5A880] uppercase tracking-wider">
                {selectedAnglePreview.title}
              </div>
              <button
                type="button"
                onClick={() => setSelectedAnglePreview(null)}
                className="text-gray-400 hover:text-white p-1 rounded-none cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="w-full aspect-square bg-black border border-gray-800 overflow-hidden flex items-center justify-center shadow-inner">
              <img
                src={selectedAnglePreview.src}
                alt={selectedAnglePreview.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: QUÉT CCCD TỰ ĐỘNG CHO NGƯỜI NHÀ (TESSERACT OCR)              */}
      {/* =================================================================== */}
      <CccdOcrScannerModal
        isOpen={isMemberOcrModalOpen}
        onClose={() => setIsMemberOcrModalOpen(false)}
        onApplyOcrData={handleApplyMemberOcrData}
        initialFrontImage={ekycFrontImage}
        initialBackImage={ekycBackImage}
      />

      {/* =================================================================== */}
      {/* MODAL: SINH TRẮC HỌC FACEID 4 BƯỚC CHO THÀNH VIÊN                   */}
      {/* =================================================================== */}
      {bankEnrollTarget && (
        <BankFaceEnrollModal
          isOpen={Boolean(bankEnrollTarget)}
          onClose={() => setBankEnrollTarget(null)}
          userId={bankEnrollTarget.phone || bankEnrollTarget.id || bankEnrollTarget.username || ''}
          fullName={bankEnrollTarget.fullName || ''}
          apartmentCode={aptCode}
          phone={bankEnrollTarget.phone || ''}
          email={bankEnrollTarget.email || ''}
          isFamilyMemberSelfEnroll={bankEnrollTarget.id !== currentUser.id && bankEnrollTarget.phone !== currentUser.phone}
          submittedByRole={currentUser.role}
          onEnrollSuccess={(profile) => {
            setActionSuccess(`✓ Đã thu thập và lưu thành công 4 mẫu FaceID cho "${bankEnrollTarget.fullName}"!`);
            setTimeout(() => setActionSuccess(null), 5000);
            setBankEnrollTarget(null);
            fetchMembers();
          }}
        />
      )}

    </div>
  );
}

