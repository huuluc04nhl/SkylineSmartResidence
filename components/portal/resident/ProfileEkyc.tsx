'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  User as UserIcon, 
  ShieldCheck, 
  ScanFace, 
  CreditCard, 
  Camera, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Save, 
  Users, 
  UserPlus, 
  Trash2, 
  Car, 
  FileText, 
  Building, 
  RefreshCw, 
  Lock,
  Smartphone,
  Mail,
  Calendar,
  MapPin,
  Globe,
  Scan,
  Zap,
  ArrowRight,
  Clock,
  XCircle,
  Upload,
  KeyRound,
  Eye,
  EyeOff,
  X,
  Check
} from 'lucide-react';
import { User } from '@/lib/dataStore';
import ResidentSmartCard from './ResidentSmartCard';
import { 
  nksGetUserInfo, 
  nksUpdateInfo, 
  nksUpdateCccd, 
  nksUpdateAvatar, 
  nksUpdatePassword,
  nksGetFamilyMembers,
  nksAddFamilyMember,
  nksRemoveFamilyMember,
  nksGetEnrolledFaceProfile
} from '@/lib/nksApiClient';
import { useAuth } from '@/lib/authContext';
import CccdOcrScannerModal from './CccdOcrScannerModal';
import AvatarEditorModal from './AvatarEditorModal';
import CccdCardViewer from '@/components/portal/shared/CccdCardViewer';
import { OcrCccdResult, formatToDateInput, formatToDisplayDate, formatToApiDate } from '@/lib/ocrParser';
import { 
  getEkycForUser, 
  getEkycRequests,
  saveEkycRequests,
  submitEkycRequest, 
  updateEkycCardImages, 
  EkycRequest 
} from '@/lib/ekycStore';
import { validateCccdCard, verifyFaceWithCccd } from '@/lib/ekycValidator';
import BankFaceEnrollModal from './BankFaceEnrollModal';
import { getEnrolledFaceProfile, EnrolledFaceProfile } from '@/lib/faceEnrollStore';
import AccountPasswordSection from '@/components/portal/shared/AccountPasswordSection';

interface ProfileEkycProps {
  currentUser: User;
}

export default function ProfileEkyc({ currentUser }: ProfileEkycProps) {
  const { updateUserInfo, refreshUser } = useAuth();
  const isOwner = currentUser.role === 'OWNER';
  const aptCode = currentUser.apartment_code || 'CH-06';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'INFO' | 'EKYC' | 'PASSWORD'>('INFO');
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isCardViewerOpen, setIsCardViewerOpen] = useState(false);
  const [isBankEnrollOpen, setIsBankEnrollOpen] = useState(false);
  const [enrolledFaceProfile, setEnrolledFaceProfile] = useState<EnrolledFaceProfile | null>(null);
  const [isLoadingApi, setIsLoadingApi] = useState(true);
  const [ocrFilledNotice, setOcrFilledNotice] = useState(false);

  // Form State (Populated 100% directly from API response)
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<'1' | '0'>('1');
  const [idCardNumber, setIdCardNumber] = useState('');
  const [idDate, setIdDate] = useState('');
  const [idPlace, setIdPlace] = useState('');
  const [birthday, setBirthday] = useState('');
  const [pob, setPob] = useState('');
  const [province, setProvince] = useState('');
  const [intro, setIntro] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Status & Feedback
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // e-KYC State
  const [ekycStatus, setEkycStatus] = useState<'VERIFIED' | 'PENDING' | 'REJECTED' | 'DRAFT' | 'PENDING_OWNER'>('DRAFT');
  const [isEditingLegal, setIsEditingLegal] = useState(false);
  const [currentEkyc, setCurrentEkyc] = useState<EkycRequest | null>(null);
  const [isScanningOcr, setIsScanningOcr] = useState(false);
  const [cccdImage, setCccdImage] = useState('');
  const [cccdBackImage, setCccdBackImage] = useState('');
  const [matchScore, setMatchScore] = useState(99.8);

  // Load live user info directly from API endpoint on mount & sync e-KYC status
  useEffect(() => {
    async function loadApiUserData() {
      setIsLoadingApi(true);
      try {
        const apiUser = await nksGetUserInfo();
        if (apiUser) {
          setFullName(apiUser.fullname || apiUser.full_name || '');
          setPhone(apiUser.phone || apiUser.username || '');
          setEmail(apiUser.email || '');
          setGender(apiUser.gender !== undefined ? (apiUser.gender.toString() as '1' | '0') : '1');
          setIdCardNumber(apiUser.id_number || (apiUser as any).id_card_no || (apiUser as any).id_card_number || '');
          setIdDate(formatToDateInput(apiUser.id_date || ''));
          setIdPlace(apiUser.id_place || '');
          setBirthday(formatToDateInput(apiUser.dob || (apiUser as any).formatedDob || ''));
          setPob(apiUser.pob || '');
          setProvince(apiUser.province || '');
          setIntro(apiUser.intro || '');
          setLicensePlate(apiUser.license_plate || '');
          setAvatarUrl(apiUser.avatar_url || apiUser.avatar || '');
        } else {
          // Fallback to currentUser if offline
          setFullName(currentUser.full_name || '');
          setPhone(currentUser.phone || currentUser.username || '');
          setEmail(currentUser.email || '');
          setIdCardNumber(currentUser.id_card_no || (currentUser as any).id_number || '');
          setBirthday(currentUser.dob ? formatToDateInput(currentUser.dob) : '');
          setPob(currentUser.pob || '');
          setAvatarUrl(currentUser.avatar_url || '');
        }
      } catch (err) {
        console.warn('Failed to fetch live API user info:', err);
      } finally {
        setIsLoadingApi(false);
      }
    }

    loadApiUserData();

    const userKey = currentUser.phone || currentUser.email || currentUser.username || currentUser.id;

    // Check persistent resident localStorage for real uploaded CCCD images
    if (typeof window !== 'undefined') {
      const savedFront = localStorage.getItem('skyline_cccd_front_' + userKey);
      const savedBack = localStorage.getItem('skyline_cccd_back_' + userKey);
      if (savedFront) setCccdImage(savedFront);
      if (savedBack) setCccdBackImage(savedBack);
    }

    // Synchronize live e-KYC status with BQL approval center (Local + Server)
    const syncEkycStatus = async () => {
      const userRecord = getEkycForUser(userKey);
      if (userRecord) {
        setCurrentEkyc(userRecord);
        setEkycStatus(userRecord.status === 'APPROVED' ? 'VERIFIED' : userRecord.status);
        if (userRecord.idCardFrontUrl) setCccdImage(userRecord.idCardFrontUrl);
        if (userRecord.idCardBackUrl) setCccdBackImage(userRecord.idCardBackUrl);
        if (userRecord.faceScore) setMatchScore(userRecord.faceScore);
      } else {
        setEkycStatus('DRAFT');
      }

      // Kéo dữ liệu thời gian thực từ API máy chủ để phản ánh tức thì quyết định Phê Duyệt / Từ Chối của BQL
      try {
        const res = await fetch(`/api/ekyc?userId=${encodeURIComponent(userKey)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.ekyc) {
            const serverEkyc: EkycRequest = data.ekyc;
            setCurrentEkyc(serverEkyc);
            setEkycStatus(serverEkyc.status === 'APPROVED' ? 'VERIFIED' : serverEkyc.status);
            if (serverEkyc.idCardFrontUrl) setCccdImage(serverEkyc.idCardFrontUrl);
            if (serverEkyc.idCardBackUrl) setCccdBackImage(serverEkyc.idCardBackUrl);
            if (serverEkyc.faceScore) setMatchScore(serverEkyc.faceScore);

            // Đồng bộ bộ nhớ đệm client
            const allReqs: EkycRequest[] = getEkycRequests();
            const idx = allReqs.findIndex((r: EkycRequest) => r.id === serverEkyc.id || r.userId === serverEkyc.userId);
            if (idx >= 0) {
              allReqs[idx] = serverEkyc;
            } else {
              allReqs.unshift(serverEkyc);
            }
            saveEkycRequests(allReqs);
          }
        }
      } catch (err) {
        console.warn('Sync ekyc status from server error:', err);
      }
    };

    syncEkycStatus();
    window.addEventListener('skyline_ekyc_updated', syncEkycStatus);

    // Synchronize FaceID enrolled biometric profile (Local + Remote Server API)
    const syncEnrolledFace = () => {
      const p = getEnrolledFaceProfile(userKey);
      if (p) setEnrolledFaceProfile(p);

      // Tự động kéo từ máy chủ API để đồng bộ mẫu vừa quét trên Mobile sang Desktop
      nksGetEnrolledFaceProfile(userKey).then(remoteP => {
        if (remoteP) {
          setEnrolledFaceProfile(remoteP);
        }
      });
    };
    syncEnrolledFace();
    window.addEventListener('skyline_faceid_enrolled', syncEnrolledFace);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncEkycStatus();
        syncEnrolledFace();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('skyline_ekyc_updated', syncEkycStatus);
      window.removeEventListener('skyline_faceid_enrolled', syncEnrolledFace);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [currentUser]);

  // 1. Submit Update Profile Info to NKS API (POST /api/nks/user/updateInfo + updateCccd)
  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);
    setSavedSuccess(false);

    try {
      const parts = fullName.trim().split(' ');
      const firstname = parts.slice(-1)[0] || '';
      const lastname = parts.slice(0, -1).join(' ') || '';

      const res = await nksUpdateInfo({
        username: currentUser?.username || currentUser?.email || phone.trim(),
        firstname,
        lastname,
        fullname: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        gender: gender === '1' ? 1 : 0,
        dob: formatToDateInput(birthday),
        pob: pob || '',
        id_number: idCardNumber.trim(),
        id_date: formatToDateInput(idDate),
        id_place: idPlace,
        province: province,
        intro: intro,
        license_plate: licensePlate,
      });

      // Also synchronize CCCD card images to NKS Server
      try {
        await nksUpdateCccd({
          number: idCardNumber.trim(),
          date: idDate,
          place: idPlace,
          front: cccdImage,
          back: cccdBackImage,
        });
      } catch (cccdErr) {
        console.warn('Sync CCCD on save error:', cccdErr);
      }

      if (res.success && res.user) {
        // Synchronize state across active session and components immediately
        updateUserInfo({
          ...res.user as any,
          id_card_no: idCardNumber.trim(),
          dob: formatToApiDate(birthday),
          pob: pob || '',
        });

        // Real-time synchronization across entire portal shell
        await refreshUser();

        // Update local state directly with returned API payload (replacing old data)
        setFullName(res.user.fullname || res.user.full_name || fullName);
        setPhone(res.user.phone || phone);
        setEmail(res.user.email || email);
        setIdCardNumber(res.user.id_number || idCardNumber);
        setLicensePlate(res.user.license_plate || licensePlate);
        setPob(res.user.pob || '');
        if (res.user.dob) setBirthday(formatToApiDate(res.user.dob));
        if (res.user.id_date) setIdDate(formatToApiDate(res.user.id_date));
        if (res.user.id_place) setIdPlace(res.user.id_place);

        setSavedSuccess(true);
        setOcrFilledNotice(false);
        setTimeout(() => setSavedSuccess(false), 4000);
      } else {
        setSaveError('Không thể lưu thông tin. Vui lòng thử lại sau.');
      }
    } catch (err: any) {
      console.warn('NKS save info error', err);
      setSaveError('Lỗi kết nối máy chủ khi cập nhật thông tin.');
    } finally {
      setIsSaving(false);
    }
  };

  // 2. Submit Update Avatar to NKS API (POST /api/nks/user/updateAvatar)
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Data = event.target?.result as string;
        setAvatarUrl(base64Data);

        const res = await nksUpdateAvatar(base64Data);
        if (res.success) {
          updateUserInfo({ avatar_url: base64Data });
          await refreshUser();
          setSavedSuccess(true);
          setTimeout(() => setSavedSuccess(false), 3000);
        }
        setIsUploadingAvatar(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error uploading avatar:', err);
      setIsUploadingAvatar(false);
    }
  };

  // 2. Handle auto-filling data from OCR Scanner Modal (2 sides)
  const handleApplyOcrData = (ocrData: OcrCccdResult, frontSrc: string, backSrc: string) => {
    const userKey = currentUser.phone || currentUser.email || currentUser.username || currentUser.id;

    setIdCardNumber(ocrData.idNumber || '');
    setFullName(ocrData.fullName || '');
    setBirthday(formatToDateInput(ocrData.dob || ''));
    setGender(ocrData.gender || '1');
    setPob(ocrData.pob || '');
    setProvince(ocrData.province || 'Thành phố Hồ Chí Minh');
    setIdDate(formatToDateInput(ocrData.idDate || ''));
    setIdPlace(ocrData.idPlace || 'Cục Cảnh sát QLHC về TTXH');

    if (frontSrc) {
      setCccdImage(frontSrc);
      if (typeof window !== 'undefined') {
        localStorage.setItem('skyline_cccd_front_' + userKey, frontSrc);
      }
    }
    if (backSrc) {
      setCccdBackImage(backSrc);
      if (typeof window !== 'undefined') {
        localStorage.setItem('skyline_cccd_back_' + userKey, backSrc);
      }
    }

    updateEkycCardImages(userKey, frontSrc, backSrc);

    nksUpdateCccd({
      front: frontSrc,
      back: backSrc,
      number: ocrData.idNumber || idCardNumber,
      date: ocrData.idDate || idDate,
      place: ocrData.idPlace || idPlace,
    }).catch(e => console.warn('Sync CCCD error:', e));

    // Switch to tab 1 (Thông tin cá nhân) so the user can review all fields
    setActiveTab('EKYC');
    setIsEditingLegal(true);

    setEkycFeedback({
      type: 'success',
      message: 'Đã trích xuất và lưu độc lập thông tin 2 mặt thẻ CCCD thành công! Khi hoàn tất đủ cả CCCD và FaceID 4 mẫu, bạn nhấn nút "Gửi Ban Quản Lý Xác Nhận Chốt Hồ Sơ" ở Bước 3.'
    });

    // Display clear notice that data is auto-filled and ready to be saved
    setOcrFilledNotice(true);
    setTimeout(() => setOcrFilledNotice(false), 10000);
  };

  // Feedback notification for e-KYC
  const [ekycFeedback, setEkycFeedback] = useState<{ type: 'success' | 'warning' | 'error'; message: string } | null>(null);

  const handleSubmitEkycToBql = async () => {
    setEkycFeedback(null);

    // 1. Kiểm tra điều kiện Căn cước công dân (Đã lưu riêng)
    if (!idCardNumber.trim() || !cccdImage || !cccdBackImage) {
      setEkycFeedback({
        type: 'warning',
        message: 'Vui lòng hoàn tất quét thẻ Căn cước công dân (đủ 2 mặt trước/sau và 12 số CCCD) trước khi chốt hồ sơ gửi Ban Quản Lý.'
      });
      return;
    }

    // 2. Kiểm tra điều kiện FaceID 4 mẫu (Đã lưu riêng)
    if (!enrolledFaceProfile || !enrolledFaceProfile.samples?.front) {
      setEkycFeedback({
        type: 'warning',
        message: 'Vui lòng hoàn tất thu thập đủ 4 góc mẫu FaceID (chuẩn e-KYC ngân hàng) trước khi chốt hồ sơ gửi Ban Quản Lý.'
      });
      return;
    }

    const currentAvatar = avatarUrl || currentUser.avatar_url || '';
    const faceSamples = enrolledFaceProfile.samples;

    setIsScanningOcr(true);
    try {
      const reqPayload = {
        userId: currentUser.id || currentUser.username || currentUser.phone || 'resident-user',
        fullName: fullName.trim() || currentUser.full_name,
        roleLabel: isOwner ? `Chủ Hộ (Căn ${aptCode})` : `Người Nhà (Căn ${aptCode})`,
        apartmentCode: aptCode,
        phone: phone.trim() || currentUser.phone || '',
        email: email.trim() || currentUser.email || '',
        idCardNo: idCardNumber.trim(),
        idDate: idDate,
        idPlace: idPlace,
        dob: birthday,
        pob: pob,
        avatarUrl: currentAvatar,
        idCardFrontUrl: cccdImage,
        idCardBackUrl: cccdBackImage || '',
        faceSamples,
        faceScore: enrolledFaceProfile?.faceScore || 99.4,
      };

      const req = submitEkycRequest(reqPayload);
      setCurrentEkyc(req);
      setEkycStatus('PENDING');
      setIsEditingLegal(false);

      // Đồng bộ tới máy chủ cho Ban Quản Lý thẩm định tức thì
      try {
        const res = await fetch('/api/ekyc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'SUBMIT',
            ...reqPayload,
          }),
        });
        const resJson = await res.json().catch(() => ({}));
        if (!res.ok) {
          console.warn('Server sync message:', resJson?.message);
        }
      } catch (apiErr) {
        console.warn('Sync ekyc submit API error:', apiErr);
      }

      // Phát sự kiện đồng bộ thời gian thực cho BQL
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('skyline_ekyc_updated', { detail: req }));
        window.dispatchEvent(new CustomEvent('skyline_faceid_enrolled', { detail: enrolledFaceProfile }));
      }

      setEkycFeedback({
        type: 'success',
        message: 'Đã gửi toàn bộ hồ sơ (Căn cước công dân 2 mặt & 4 mẫu FaceID) tới Ban Quản Lý thành công! Ban Quản Lý sẽ tiến hành đối soát và phê duyệt kích hoạt quyền ra vào chung cư.'
      });
    } finally {
      setIsScanningOcr(false);
    }
  };

  return (
    <div className="space-y-6 w-full animate-fadeIn select-none">
      {/* Header */}
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-[#222B35] pb-3 sm:pb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.25em] text-[#C5A880] font-semibold flex items-center gap-1.5 truncate">
            <ScanFace className="w-3.5 h-3.5 shrink-0" /> Skyline Smart Residence • {isOwner ? 'Chủ Hộ' : 'Thành Viên'}
          </div>
          <h2 className="font-serif text-lg sm:text-2xl text-white font-bold mt-0.5 sm:mt-1 truncate">
            Thông Tin Cá Nhân & Định Danh
          </h2>
          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1 sm:line-clamp-none">
            Căn hộ: <strong className="text-white font-mono">{aptCode}</strong> • Hồ sơ định danh pháp lý và bảo mật tài khoản
          </p>
        </div>

        {/* Cụm Trạng Thái Căn Cước & e-KYC */}
        {isOwner ? (
          <div className="flex items-center gap-2 flex-shrink-0">
            {ekycStatus === 'VERIFIED' && (
              <span className="px-2.5 sm:px-3 py-1 bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 rounded-none">
                <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
                <span><span className="hidden sm:inline">Đã Xác Thực </span>Căn Cước ✓</span>
              </span>
            )}

            {ekycStatus === 'PENDING' && (
              <span className="px-2.5 sm:px-3 py-1 bg-amber-950/80 border border-amber-500 text-amber-300 text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 rounded-none animate-pulse">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
                <span>Chờ BQL Duyệt</span>
              </span>
            )}

            {ekycStatus === 'REJECTED' && (
              <span className="px-2.5 sm:px-3 py-1 bg-rose-950/80 border border-rose-500 text-rose-300 text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 rounded-none">
                <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400 shrink-0" />
                <span>Yêu Cầu Chụp Lại</span>
              </span>
            )}

            {ekycStatus === 'DRAFT' && (
              <span className="px-2.5 sm:px-3 py-1 bg-[#161D26] border border-gray-600 text-gray-300 text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 rounded-none">
                <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#C5A880] shrink-0" />
                <span>Chưa Gửi Hồ Sơ</span>
              </span>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
            <span className="px-2.5 sm:px-3 py-1 bg-[#161D26] border border-purple-500/50 text-purple-300 text-[11px] sm:text-xs font-semibold rounded-none flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400 shrink-0" /> Thành Viên
            </span>

            {enrolledFaceProfile?.status === 'ACTIVE' && (
              <span className="px-2.5 sm:px-3 py-1 bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 rounded-none">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" /> FaceID Kích Hoạt
              </span>
            )}

            {enrolledFaceProfile?.status === 'PENDING_OWNER' && (
              <span className="px-2.5 sm:px-3 py-1 bg-amber-950/80 border border-amber-500 text-amber-300 text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 rounded-none animate-pulse">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" /> Chờ Chủ Hộ Duyệt
              </span>
            )}

            {enrolledFaceProfile?.status === 'PENDING' && (
              <span className="px-2.5 sm:px-3 py-1 bg-cyan-950/80 border border-cyan-500 text-cyan-300 text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 rounded-none animate-pulse">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400 shrink-0" /> Chờ BQL Duyệt
              </span>
            )}

            {!enrolledFaceProfile && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('EKYC');
                  setIsBankEnrollOpen(true);
                }}
                className="px-3 py-1.5 bg-[#C5A880] hover:bg-white text-[#0D1117] text-[11px] sm:text-xs font-bold uppercase tracking-wider rounded-none flex items-center gap-1.5 transition-all shadow"
              >
                <Camera className="w-3.5 h-3.5" /> Đăng Ký FaceID
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tab Navigation - App-like segmented bar */}
      <div className="flex overflow-x-auto no-scrollbar border-b border-[#222B35] text-[11px] sm:text-xs font-semibold uppercase tracking-wider gap-1 sm:gap-2 whitespace-nowrap">
        <button
          type="button"
          onClick={() => setActiveTab('INFO')}
          className={`pb-2.5 sm:pb-3 px-2.5 sm:px-4 flex items-center gap-1.5 sm:gap-2 border-b-2 transition-colors shrink-0 active:scale-95 ${
            activeTab === 'INFO'
              ? 'border-[#C5A880] text-[#C5A880] font-bold'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <UserIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span>1. <span className="hidden sm:inline">Thông Tin </span>Cá Nhân</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('EKYC')}
          className={`pb-2.5 sm:pb-3 px-2.5 sm:px-4 flex items-center gap-1.5 sm:gap-2 border-b-2 transition-colors shrink-0 active:scale-95 ${
            activeTab === 'EKYC'
              ? 'border-[#C5A880] text-[#C5A880] font-bold'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <ScanFace className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span>2. <span className="hidden sm:inline">Căn Cước & </span>FaceID</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('PASSWORD')}
          className={`pb-2.5 sm:pb-3 px-2.5 sm:px-4 flex items-center gap-1.5 sm:gap-2 border-b-2 transition-colors shrink-0 active:scale-95 ${
            activeTab === 'PASSWORD'
              ? 'border-[#C5A880] text-[#C5A880] font-bold'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span>3. <span className="hidden sm:inline">Đổi </span>Mật Khẩu</span>
        </button>
      </div>

      {/* Loading Indicator while fetching from API */}
      {isLoadingApi && (
        <div className="p-8 bg-[#121820] border border-[#222B35] flex items-center justify-center gap-3 text-xs text-[#C5A880] font-mono rounded-none">
          <RefreshCw className="w-5 h-5 animate-spin text-[#C5A880]" />
          <span>Đang tải thông tin hồ sơ...</span>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: PERSONAL INFORMATION & VEHICLE REGISTRATION             */}
      {/* ------------------------------------------------------------- */}
      {!isLoadingApi && activeTab === 'INFO' && (
        <form onSubmit={handleSaveInfo} className="p-4 sm:p-8 bg-[#121820] border border-[#222B35] space-y-4 sm:space-y-6 shadow-2xl rounded-none">
          {/* Avatar & Fast Profile Header */}
          <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-[#161D26] border border-[#222B35] rounded-none">
            {/* Clickable Avatar Circle */}
            <div
              onClick={() => setIsAvatarModalOpen(true)}
              className="relative group cursor-pointer shrink-0"
              title="Nhấp vào đây để đổi ảnh đại diện hoặc tùy chỉnh ảnh"
            >
              <img
                src={avatarUrl || currentUser.avatar_url || 'https://data.nks.vn/storage/users/default.png'}
                alt="Avatar"
                className="w-20 h-20 rounded-full object-cover border-2 border-[#C5A880] group-hover:border-white shadow-lg transition-all group-hover:brightness-90"
              />
              <div
                className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[10px] font-bold"
              >
                <Camera className="w-4 h-4 mb-0.5 text-[#C5A880]" />
                Đổi Ảnh
              </div>
            </div>

            <div className="space-y-1 text-center sm:text-left flex-1">
              <div className="text-white font-bold text-lg flex items-center justify-center sm:justify-start gap-2">
                <span>{fullName || 'Chưa cập nhật họ tên'}</span>
                <span className="px-2 py-0.5 text-[10px] bg-[#C5A880] text-[#0D1117] font-bold uppercase rounded-none">
                  {currentUser.role}
                </span>
              </div>
              <div className="text-xs text-gray-400 font-mono">
                Căn hộ: <strong className="text-white">{aptCode}</strong> • SĐT: <strong className="text-gray-300">{phone || 'Chưa có'}</strong> • Biển số: <strong className="text-[#C5A880]">{licensePlate || 'Chưa đăng ký'}</strong>
              </div>
              <div className="text-[11px] text-[#C5A880]/90 flex items-center justify-center sm:justify-start gap-1 pt-0.5">
                <Camera className="w-3 h-3 text-[#C5A880]" />
                <span>Nhấp trực tiếp vào ảnh đại diện để đổi ảnh hoặc chỉnh sửa</span>
              </div>
            </div>
          </div>

          {/* Feedback Alerts */}
          {ocrFilledNotice && (
            <div className="p-4 bg-amber-950/90 border-2 border-amber-500 text-amber-200 text-xs flex items-center justify-between gap-3 animate-fadeIn shadow-2xl rounded-none">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-amber-300 flex-shrink-0 animate-pulse" />
                <div>
                  <strong className="text-white block text-sm font-semibold">✨ Đã trích xuất thông tin từ CCCD vào biểu mẫu!</strong>
                  <span className="text-gray-300 text-[11px]">Vui lòng kiểm tra lại thông tin và nhấn nút <strong>[Lưu Thay Đổi Thông Tin Liên Hệ]</strong> ở cuối biểu mẫu để lưu dữ liệu.</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOcrFilledNotice(false)}
                className="px-2 py-1 bg-black/40 hover:bg-black/80 text-amber-300 hover:text-white text-[11px] font-bold rounded-none transition-colors"
              >
                Đã Hiểu
              </button>
            </div>
          )}

          {savedSuccess && (
            <div className="p-3.5 bg-emerald-950/90 border border-emerald-500 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn shadow-lg rounded-none">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>✓ Đã cập nhật thành công thông tin hồ sơ cá nhân!</span>
            </div>
          )}

          {saveError && (
            <div className="p-3.5 bg-rose-950/90 border border-rose-500 text-rose-300 text-xs flex items-center gap-2 animate-fadeIn rounded-none">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          {/* ========================================================= */}
          {/* KHỐI 1: THÔNG TIN CĂN HỘ & CƯ DÂN                         */}
          {/* ========================================================= */}
          <div className="p-4 sm:p-6 bg-[#161D26] border border-[#2D3748] rounded-none space-y-4 sm:space-y-5 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222B35] pb-3 sm:pb-4">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-[#C5A880] font-bold flex items-center gap-1.5 font-mono">
                  <Building className="w-3.5 h-3.5" /> Không Gian Cư Trú
                </div>
                <h3 className="font-serif text-base sm:text-lg font-bold text-white mt-0.5">
                  1. Thông Tin Căn Hộ & Cư Dân
                </h3>
              </div>
              <span className="px-2.5 py-1 bg-[#121820] text-[#C5A880] border border-[#263140] text-xs font-mono rounded-none">
                Căn hộ {aptCode} • The Tropical
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 text-xs">
              {/* Field: Mã Căn Hộ */}
              <div className="space-y-1.5">
                <label className="text-gray-300 flex items-center justify-between font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-[#C5A880]" /> Căn Hộ Cư Trú:
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> Cố định
                  </span>
                </label>
                <input
                  type="text"
                  value={`Căn hộ ${aptCode} • Chung cư Skyline Smart Residence`}
                  readOnly
                  className="w-full bg-[#0D1117] border border-[#263140] p-2.5 sm:p-3 text-white font-semibold rounded-none cursor-not-allowed select-all"
                />
              </div>

              {/* Field: Tư Cách Cư Trú */}
              <div className="space-y-1.5">
                <label className="text-gray-300 flex items-center justify-between font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#C5A880]" /> Tư Cách Cư Trú:
                  </span>
                  <span className="text-[10px] text-[#C5A880] font-mono flex items-center gap-1">
                    <ShieldCheck className="w-2.5 h-2.5" /> BQL xác nhận
                  </span>
                </label>
                <input
                  type="text"
                  value={isOwner ? 'Chủ Sở Hữu Căn Hộ (Chính Chủ)' : 'Thành Viên Gia Đình (Được Bảo Lãnh)'}
                  readOnly
                  className="w-full bg-[#0D1117] border border-[#263140] p-2.5 sm:p-3 text-[#C5A880] font-semibold rounded-none cursor-not-allowed"
                />
              </div>

              {/* Field: Họ và Tên */}
              <div className="space-y-1.5">
                <label className="text-gray-300 flex items-center gap-1.5 font-semibold">
                  <UserIcon className="w-3.5 h-3.5 text-[#C5A880]" /> Họ và Tên:
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 sm:p-3 text-white font-semibold focus:outline-none focus:border-[#C5A880] transition-colors rounded-none"
                  required
                />
              </div>

              {/* Field: Giới Tính */}
              <div className="space-y-1.5">
                <label className="text-gray-300 flex items-center gap-1.5 font-semibold">
                  <UserIcon className="w-3.5 h-3.5 text-[#C5A880]" /> Giới Tính:
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as '1' | '0')}
                  className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 sm:p-3 text-white focus:outline-none focus:border-[#C5A880] transition-colors rounded-none"
                >
                  <option value="1">Nam</option>
                  <option value="0">Nữ</option>
                </select>
              </div>

              {/* Field: Ngày Sinh */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-gray-300 flex items-center gap-1.5 font-semibold">
                  <Calendar className="w-3.5 h-3.5 text-[#C5A880]" /> Ngày Sinh:
                </label>
                <input
                  type="date"
                  value={formatToApiDate(birthday)}
                  onChange={(e) => setBirthday(e.target.value)}
                  className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 sm:p-3 font-mono text-white focus:outline-none focus:border-[#C5A880] transition-colors rounded-none"
                />
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* KHỐI 2: THÔNG TIN LIÊN HỆ & PHƯƠNG TIỆN                   */}
          {/* ========================================================= */}
          <div className="p-4 sm:p-6 bg-[#161D26] border border-[#2D3748] rounded-none space-y-4 sm:space-y-5 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222B35] pb-3 sm:pb-4">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-[#C5A880] font-bold flex items-center gap-1.5 font-mono">
                  <Smartphone className="w-3.5 h-3.5" /> Liên Hệ & Phương Tiện
                </div>
                <h3 className="font-serif text-base sm:text-lg font-bold text-white mt-0.5">
                  2. Thông Tin Liên Hệ & Phương Tiện
                </h3>
              </div>
              <span className="px-2.5 py-1 bg-[#121820] text-gray-300 border border-[#263140] text-xs font-mono rounded-none">
                Cập nhật tức thì
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-5 text-xs">
              {/* Field: Số Điện Thoại */}
              <div className="space-y-1.5">
                <label className="text-gray-300 flex items-center gap-1.5 font-semibold">
                  <Smartphone className="w-3.5 h-3.5 text-[#C5A880]" /> Số Điện Thoại <span className="hidden sm:inline">Liên Hệ (Nhận OTP)</span>:
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Nhập số điện thoại..."
                  className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 sm:p-3 text-white font-mono focus:outline-none focus:border-[#C5A880] transition-colors rounded-none"
                  required
                />
              </div>

              {/* Field: Email */}
              <div className="space-y-1.5">
                <label className="text-gray-300 flex items-center gap-1.5 font-semibold">
                  <Mail className="w-3.5 h-3.5 text-[#C5A880]" /> Email <span className="hidden sm:inline">Nhận Hóa Đơn & Thông Báo</span>:
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Nhập địa chỉ email..."
                  className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 sm:p-3 text-white font-mono focus:outline-none focus:border-[#C5A880] transition-colors rounded-none"
                  required
                />
              </div>

              {/* Field: Tỉnh / Thành Phố */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-gray-300 flex items-center gap-1.5 font-semibold">
                  <Globe className="w-3.5 h-3.5 text-[#C5A880]" /> Tỉnh / Thành Phố <span className="hidden sm:inline">Thường Trú</span>:
                </label>
                <input
                  type="text"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  placeholder="Nhập tỉnh thành..."
                  className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 sm:p-3 text-white focus:outline-none focus:border-[#C5A880] transition-colors rounded-none"
                />
              </div>

              {/* Field: Biển Số Xe */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-gray-300 flex items-center justify-between font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Car className="w-3.5 h-3.5 text-[#C5A880]" /> Biển Số Xe <span className="hidden sm:inline">Đăng Ký (Tự Động Mở Cổng Hầm B1)</span>:
                  </span>
                  <span className="text-[10px] text-[#C5A880] font-mono">Nhận diện AI tự động</span>
                </label>
                <input
                  type="text"
                  value={licensePlate}
                  onChange={(e) => setLicensePlate(e.target.value)}
                  className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 sm:p-3 text-[#C5A880] font-mono font-bold focus:outline-none focus:border-[#C5A880] transition-colors rounded-none"
                  placeholder="VD: 51K-889.99"
                />
              </div>

              {/* Field: Tiểu Sử / Ghi Chú Căn Hộ */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-gray-300 flex items-center gap-1.5 font-semibold">
                  <FileText className="w-3.5 h-3.5 text-[#C5A880]" /> Ghi Chú Căn Hộ <span className="hidden sm:inline">& Lưu Ý Cho BQL</span>:
                </label>
                <textarea
                  rows={2}
                  value={intro}
                  onChange={(e) => setIntro(e.target.value)}
                  placeholder="Ví dụ: Căn hộ có trẻ nhỏ, vui lòng gọi điện trước khi bấm chuông hoặc giao bưu phẩm..."
                  className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 sm:p-3 text-white focus:outline-none focus:border-[#C5A880] transition-colors rounded-none resize-none"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 sm:pt-4 border-t border-[#222B35]">
              <div className="text-[11px] text-gray-400 hidden sm:block">
                Nhấn lưu để đồng bộ thông tin liên hệ và biển số xe ngay lập tức.
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full sm:w-auto px-8 py-3 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xl rounded-none active:scale-[0.99] cursor-pointer"
              >
                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isSaving ? 'Đang Lưu...' : 'Lưu Thay Đổi Thông Tin'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: E-KYC BIOMETRIC IDENTIFICATION & SMART CARD             */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'EKYC' && (
        <div className="space-y-6">
          {/* Feedback Toast Notification */}
          {ekycFeedback && (
            <div className={`p-4 border text-xs font-semibold flex items-center justify-between gap-3 rounded-none animate-fadeIn shadow-xl ${
              ekycFeedback.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500 text-emerald-200'
                : ekycFeedback.type === 'warning'
                ? 'bg-amber-950/90 border-amber-500 text-amber-200'
                : 'bg-rose-950/90 border-rose-500 text-rose-200'
            }`}>
              <div className="flex items-center gap-2.5">
                {ekycFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                )}
                <span>{ekycFeedback.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setEkycFeedback(null)}
                className="text-gray-400 hover:text-white p-1 rounded-none hover:bg-black/30"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Header & Trạng Thái e-KYC Tinh Gọn */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 p-3.5 sm:p-4 bg-[#161D26] border border-[#2D3748] rounded-none shadow">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-[#C5A880] font-bold flex items-center gap-1.5 font-mono">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" /> e-KYC • Căn Hộ {aptCode}
              </div>
              <h3 className="font-serif text-base sm:text-lg font-bold text-white mt-0.5 truncate">
                Căn Cước (CCCD) & FaceID
              </h3>
              <p className="text-xs text-gray-400 line-clamp-1 sm:line-clamp-none mt-0.5">
                Dữ liệu định danh pháp lý và sinh trắc học cấp quyền mở cửa chung cư.
              </p>
            </div>

            {/* Trạng thái duyệt tổng thể */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {ekycStatus === 'VERIFIED' ? (
                <span className="px-2.5 sm:px-3 py-1 bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 rounded-none shadow-sm">
                  <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" /> Đã Phê Duyệt
                </span>
              ) : ekycStatus === 'PENDING' ? (
                <span className="px-2.5 sm:px-3 py-1 bg-amber-950/80 border border-amber-500 text-amber-300 text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 rounded-none animate-pulse">
                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" /> Chờ BQL Duyệt
                </span>
              ) : ekycStatus === 'REJECTED' ? (
                <span className="px-2.5 sm:px-3 py-1 bg-rose-950/80 border border-rose-500 text-rose-300 text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 rounded-none">
                  <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400 shrink-0" /> Yêu Cầu Chụp Lại
                </span>
              ) : (
                <span className="px-2.5 sm:px-3 py-1 bg-[#121820] border border-gray-600 text-gray-300 text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 rounded-none">
                  <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#C5A880] shrink-0" /> Chưa Gửi Hồ Sơ
                </span>
              )}
            </div>
          </div>

          {/* ========================================================= */}
          {/* KHỐI 1: THẺ CĂN CƯỚC CÔNG DÂN (CCCD 2 MẶT)                */}
          {/* ========================================================= */}
          <div className="p-4 sm:p-5 bg-[#121820] border border-[#222B35] space-y-3 sm:space-y-4 rounded-none shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222B35] pb-3">
              <div>
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#C5A880]" /> 1. Thẻ Căn Cước Công Dân (CCCD)
                </span>
                <span className="text-[11px] text-gray-400 block mt-0.5 hidden sm:block">
                  Quét camera hoặc tải lên ảnh 2 mặt để hệ thống tự động trích xuất thông tin pháp lý.
                </span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsOcrModalOpen(true)}
                  className="w-full sm:w-auto h-9 sm:h-8 px-3.5 bg-[#1E2631] hover:bg-[#C5A880] hover:text-[#0D1117] border border-[#C5A880] text-[#C5A880] text-xs font-bold uppercase tracking-wider rounded-none flex items-center justify-center gap-1.5 transition-all shadow cursor-pointer"
                >
                  <Scan className="w-3.5 h-3.5 shrink-0" />
                  <span>{cccdImage ? 'Quét Lại CCCD' : 'Quét Thẻ CCCD'}</span>
                </button>

                {cccdImage && (
                  <button
                    type="button"
                    onClick={() => setIsCardViewerOpen(true)}
                    className="w-full sm:w-auto h-9 sm:h-8 px-3 bg-[#161B22] hover:bg-[#1C2533] border border-gray-700 text-gray-300 hover:text-white text-xs font-medium rounded-none flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#C5A880] shrink-0" />
                    <span>Xem Thẻ</span>
                  </button>
                )}
              </div>
            </div>

            {/* Thông tin pháp lý trích xuất */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 text-xs">
              <div className="p-2.5 sm:p-3 bg-[#161B22] border border-[#263140] space-y-1">
                <span className="text-gray-400 block text-[11px]">Số CCCD (12 số):</span>
                <input
                  type="text"
                  value={idCardNumber}
                  onChange={(e) => setIdCardNumber(e.target.value)}
                  placeholder="Chưa quét số CCCD"
                  className="w-full bg-transparent text-emerald-300 font-mono font-bold focus:outline-none"
                />
              </div>

              <div className="p-2.5 sm:p-3 bg-[#161B22] border border-[#263140] space-y-1">
                <span className="text-gray-400 block text-[11px]">Nơi Cấp & Ngày Cấp:</span>
                <input
                  type="text"
                  value={`${idPlace || ''} ${idDate ? `• ${idDate}` : ''}`.trim() || 'Chưa cập nhật'}
                  onChange={(e) => setIdPlace(e.target.value)}
                  placeholder="Nơi cấp / ngày cấp"
                  className="w-full bg-transparent text-gray-200 focus:outline-none"
                />
              </div>

              <div className="p-2.5 sm:p-3 bg-[#161B22] border border-[#263140] space-y-1">
                <span className="text-gray-400 block text-[11px]">Quê Quán / Nơi Sinh:</span>
                <input
                  type="text"
                  value={pob || 'Chưa cập nhật'}
                  onChange={(e) => setPob(e.target.value)}
                  placeholder="Quê quán"
                  className="w-full bg-transparent text-gray-200 focus:outline-none"
                />
              </div>
            </div>

            {/* 2 Vị trí ảnh CCCD */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-1">
              {/* Mặt trước */}
              <div className="p-2.5 sm:p-3 bg-[#0E131B] border border-[#263140] rounded-none space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400"></span> Mặt Trước (Ảnh Chân Dung)
                  </span>
                  <span className="text-[10px] text-cyan-300 font-mono">Vị Trí 1</span>
                </div>
                <div className="relative w-full h-32 sm:h-40 rounded-none overflow-hidden border border-gray-800 bg-[#0A0E14] flex items-center justify-center">
                  {cccdImage ? (
                    <img src={cccdImage} alt="CCCD Mặt Trước" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-3 text-gray-500 space-y-1">
                      <CreditCard className="w-6 h-6 text-cyan-500/50" />
                      <span className="text-xs text-gray-400">Chưa có ảnh mặt trước</span>
                      <span className="text-[10px] text-gray-600 hidden sm:inline">Bấm &quot;Quét Thẻ CCCD&quot; ở trên</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Mặt sau */}
              <div className="p-2.5 sm:p-3 bg-[#0E131B] border border-[#263140] rounded-none space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span> Mặt Sau (Chip Điện Tử)
                  </span>
                  <span className="text-[10px] text-amber-300 font-mono">Vị Trí 2</span>
                </div>
                <div className="relative w-full h-32 sm:h-40 rounded-none overflow-hidden border border-gray-800 bg-[#0A0E14] flex items-center justify-center">
                  {cccdBackImage ? (
                    <img src={cccdBackImage} alt="CCCD Mặt Sau" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-3 text-gray-500 space-y-1">
                      <CreditCard className="w-6 h-6 text-amber-500/50" />
                      <span className="text-xs text-gray-400">Chưa có ảnh mặt sau</span>
                      <span className="text-[10px] text-gray-600 hidden sm:inline">Bấm &quot;Quét Thẻ CCCD&quot; ở trên</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>


          {/* e-KYC Visual Matcher & Smart Pass Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Biometric FaceID Bank-Grade 4-Step Card */}
            <div className="p-4 sm:p-5 bg-[#121820] border border-[#222B35] space-y-3 sm:space-y-4 rounded-none flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-[#222B35] pb-2 mb-3 sm:mb-4">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <ScanFace className="w-4 h-4 text-[#C5A880]" /> Sinh Trắc Học FaceID (4 Bước)
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsBankEnrollOpen(true)}
                    className="h-8 sm:h-7 px-3 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider rounded-none flex items-center gap-1.5 transition-all shadow"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{enrolledFaceProfile ? 'Quét Lại' : 'Quét FaceID'}</span>
                  </button>
                </div>

                {enrolledFaceProfile ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      {enrolledFaceProfile.status === 'PENDING_OWNER' ? (
                        <div className="font-semibold text-amber-400 flex items-center gap-1.5 truncate">
                          <Clock className="w-3.5 h-3.5 animate-pulse shrink-0" /> 4 Mẫu • Chờ Chủ Hộ Xác Nhận
                        </div>
                      ) : enrolledFaceProfile.status === 'PENDING' ? (
                        <div className="font-semibold text-cyan-400 flex items-center gap-1.5 truncate">
                          <Clock className="w-3.5 h-3.5 animate-pulse shrink-0" /> Chờ BQL Phê Duyệt
                        </div>
                      ) : (
                        <div className="font-semibold text-emerald-400 flex items-center gap-1.5 truncate">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Đã Kích Hoạt 4/4 Mẫu
                        </div>
                      )}
                      <span className="text-[10px] font-mono text-gray-400 shrink-0">
                        {new Date(enrolledFaceProfile.enrolledAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>

                    {/* 4 Angle Samples Gallery */}
                    <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                      <div className="space-y-1">
                        <div className={`relative aspect-square border ${enrolledFaceProfile.status === 'PENDING' ? 'border-amber-500/60' : 'border-emerald-500/60'} bg-black overflow-hidden group`}>
                          <img 
                            src={enrolledFaceProfile.samples.front} 
                            alt="Chính diện" 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                          />
                          <span className="absolute bottom-0 inset-x-0 bg-black/80 text-white text-[8.5px] sm:text-[9px] font-mono text-center py-0.5">
                            1. Thẳng
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className={`relative aspect-square border ${enrolledFaceProfile.status === 'PENDING' ? 'border-amber-500/60' : 'border-emerald-500/60'} bg-black overflow-hidden group`}>
                          <img 
                            src={enrolledFaceProfile.samples.left} 
                            alt="Quay trái" 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                          />
                          <span className="absolute bottom-0 inset-x-0 bg-black/80 text-white text-[8.5px] sm:text-[9px] font-mono text-center py-0.5">
                            2. Trái
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className={`relative aspect-square border ${enrolledFaceProfile.status === 'PENDING' ? 'border-amber-500/60' : 'border-emerald-500/60'} bg-black overflow-hidden group`}>
                          <img 
                            src={enrolledFaceProfile.samples.right} 
                            alt="Quay phải" 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                          />
                          <span className="absolute bottom-0 inset-x-0 bg-black/80 text-white text-[8.5px] sm:text-[9px] font-mono text-center py-0.5">
                            3. Phải
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className={`relative aspect-square border ${enrolledFaceProfile.status === 'PENDING' ? 'border-amber-500/60' : 'border-emerald-500/60'} bg-black overflow-hidden group`}>
                          <img 
                            src={enrolledFaceProfile.samples.smile} 
                            alt="Mỉm cười" 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                          />
                          <span className="absolute bottom-0 inset-x-0 bg-black/80 text-white text-[8.5px] sm:text-[9px] font-mono text-center py-0.5">
                            4. Cười
                          </span>
                        </div>
                      </div>
                    </div>

                    {enrolledFaceProfile.status === 'PENDING_OWNER' ? (
                      <div className="p-2.5 bg-amber-950/40 border border-amber-500/40 text-[11px] text-amber-200 space-y-1">
                        <div className="font-semibold flex items-center gap-1.5 text-amber-300">
                          <Clock className="w-3.5 h-3.5 shrink-0" /> Chờ Chủ Hộ Căn Hộ Xác Nhận
                        </div>
                        <p className="text-gray-300 text-[10.5px] line-clamp-2 sm:line-clamp-none">
                          Hồ sơ 4 góc mặt đã được lưu. Chủ hộ căn hộ {aptCode} sẽ kiểm tra và xác nhận bảo lãnh để BQL kích hoạt FaceID.
                        </p>
                      </div>
                    ) : enrolledFaceProfile.status === 'PENDING' ? (
                      <div className="p-2.5 bg-cyan-950/40 border border-cyan-500/40 text-[11px] text-cyan-200 space-y-1">
                        <div className="font-semibold flex items-center gap-1.5 text-cyan-300">
                          <Clock className="w-3.5 h-3.5 shrink-0" /> Đang Chờ Ban Quản Lý Phê Duyệt
                        </div>
                        <p className="text-gray-300 text-[10.5px] line-clamp-2 sm:line-clamp-none">
                          Hồ sơ 4 mẫu quét sinh trắc học đã gửi lên hệ thống quản trị của BQL để đối soát và kích hoạt quyền mở cửa.
                        </p>
                      </div>
                    ) : (
                      <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/40 text-[11px] text-emerald-200 space-y-1">
                        <div className="font-semibold flex items-center gap-1.5 text-emerald-300">
                          <ShieldCheck className="w-3.5 h-3.5 shrink-0" /> Đã Kích Hoạt Quyền FaceID
                        </div>
                        <p className="text-gray-300 text-[10.5px] line-clamp-2 sm:line-clamp-none">
                          Hồ sơ sinh trắc học 4 vector đa góc đã được duyệt hợp lệ. Bạn có thể sử dụng FaceID tại cửa sảnh và màn hình đăng nhập.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3.5 sm:p-4 bg-[#161D26] border border-amber-500/60 space-y-2.5 sm:space-y-3">
                    <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                      <AlertCircle className="w-4 h-4 shrink-0" /> Chưa Thu Thập Mẫu FaceID
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed hidden sm:block">
                      Để nhận diện khuôn mặt chính thức khi đăng nhập và mở cửa sảnh đón, hệ thống Skyline yêu cầu thu thập 4 góc chụp chuẩn e-KYC:
                    </p>
                    <div className="grid grid-cols-2 gap-1.5 sm:gap-2 text-[10.5px] sm:text-[11px] text-gray-300">
                      <div className="p-1.5 sm:p-2 bg-[#0D1117] border border-gray-800">1. Nhìn thẳng</div>
                      <div className="p-1.5 sm:p-2 bg-[#0D1117] border border-gray-800">2. Quay trái 30°</div>
                      <div className="p-1.5 sm:p-2 bg-[#0D1117] border border-gray-800">3. Quay phải 30°</div>
                      <div className="p-1.5 sm:p-2 bg-[#0D1117] border border-gray-800">4. Mỉm cười</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsBankEnrollOpen(true)}
                      className="w-full py-2.5 sm:py-2.5 bg-gradient-to-r from-[#C5A880] to-[#E2C799] hover:brightness-110 text-[#0D1117] text-xs font-bold uppercase tracking-wider rounded-none flex items-center justify-center gap-2 transition-all shadow"
                    >
                      <Camera className="w-4 h-4 text-[#0D1117]" /> Bắt Đầu Quét Mặt 4 Bước
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-2 text-xs text-gray-300 bg-[#161B22] p-3 sm:p-3.5 border border-[#222B35] rounded-none mt-3 sm:mt-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Tốc độ mở cửa:</span>
                  <strong className="text-emerald-400 font-mono">&lt; 0.5s (Tức thì)</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Trạng thái:</span>
                  <span className={
                    enrolledFaceProfile?.status === 'ACTIVE' 
                      ? 'text-emerald-400 font-bold' 
                      : enrolledFaceProfile?.status === 'PENDING_OWNER'
                      ? 'text-amber-400 font-bold'
                      : enrolledFaceProfile?.status === 'PENDING'
                      ? 'text-cyan-400 font-bold'
                      : 'text-gray-400 font-bold'
                  }>
                    {enrolledFaceProfile?.status === 'ACTIVE' 
                      ? 'Đã Kích Hoạt ✓' 
                      : enrolledFaceProfile?.status === 'PENDING_OWNER'
                      ? 'Chờ Chủ Hộ ⏳'
                      : enrolledFaceProfile?.status === 'PENDING'
                      ? 'Chờ BQL Duyệt ⏳'
                      : 'Chưa Thu Thập'}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-gray-400 shrink-0">Quyền áp dụng:</span>
                  <span className="text-gray-200 text-right truncate max-w-[170px] sm:max-w-none">
                    Sảnh đón, thang máy, đăng nhập
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Biển số xe:</span>
                  <strong className="text-[#C5A880] font-mono">{licensePlate || '51K-889.99'}</strong>
                </div>
              </div>
            </div>

            {/* Render 3D Resident Smart Pass Card */}
            <div className="p-4 sm:p-5 bg-[#121820] border border-[#222B35] space-y-3 sm:space-y-4 rounded-none flex flex-col justify-between">
              <div>
                <div className="border-b border-[#222B35] pb-2 mb-3 sm:mb-4 flex items-center justify-between">
                  <span className="text-xs font-bold text-[#C5A880] uppercase tracking-wider flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#C5A880]" /> Thẻ Cư Dân Điện Tử Skyline
                  </span>
                </div>
                <ResidentSmartCard currentUser={currentUser} />
              </div>

              <div className="p-3 bg-[#161B22] border border-[#222B35] rounded-none text-[11px] text-gray-400 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Thẻ Cư Dân Đã Kích Hoạt
                </span>
                <span className="font-mono text-gray-400 text-[10px]">SKY-{aptCode}-PASS</span>
              </div>
            </div>
          </div>

          {/* =================================================================== */}
          {/* BƯỚC 3: XÁC NHẬN CHỐT 2 THÔNG TIN (CCCD & FACEID) GỬI BAN QUẢN LÝ    */}
          {/* =================================================================== */}
          <div className="p-4 sm:p-6 bg-gradient-to-r from-[#161D26] via-[#121820] to-[#0D1117] border border-[#C5A880] rounded-none space-y-3.5 sm:space-y-4 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-[#222B35] pb-3 sm:pb-4">
              <div className="space-y-0.5 sm:space-y-1">
                <div className="text-[10px] uppercase tracking-wider text-[#C5A880] font-bold flex items-center gap-1.5 font-mono">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" /> Bước 3: Đồng Bộ & Chốt Hồ Sơ e-KYC
                </div>
                <h3 className="font-serif text-base sm:text-lg font-bold text-white truncate">
                  Xác Nhận & Gửi Ban Quản Lý (CCCD & FaceID)
                </h3>
                <p className="text-xs text-gray-400 max-w-2xl leading-relaxed hidden sm:block">
                  Khi bạn quét CCCD hoặc FaceID, mỗi thông tin đã được tự động lưu độc lập. Sau khi hoàn tất cả 2 mục, nhấn nút bên dưới để chốt hồ sơ gửi Ban Quản Lý thẩm định và kích hoạt quyền ra vào chung cư.
                </p>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {ekycStatus === 'VERIFIED' ? (
                  <span className="px-2.5 sm:px-3 py-1 bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 rounded-none shadow-sm">
                    <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" /> BQL Đã Phê Duyệt
                  </span>
                ) : ekycStatus === 'PENDING' ? (
                  <span className="px-2.5 sm:px-3 py-1 bg-amber-950/80 border border-amber-500 text-amber-300 text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 rounded-none animate-pulse">
                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" /> Chờ BQL Phê Duyệt
                  </span>
                ) : ekycStatus === 'REJECTED' ? (
                  <span className="px-2.5 sm:px-3 py-1 bg-rose-950/80 border border-rose-500 text-rose-300 text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 rounded-none">
                    <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400 shrink-0" /> Cần Cập Nhật Lại
                  </span>
                ) : (
                  <span className="px-2.5 sm:px-3 py-1 bg-[#161B22] border border-gray-600 text-gray-300 text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 rounded-none">
                    <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#C5A880] shrink-0" /> Chưa Chốt Gửi BQL
                  </span>
                )}
              </div>
            </div>

            {/* Checklist 2 điều kiện độc lập cần có */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 text-xs">
              {/* Check 1: Thẻ CCCD */}
              <div className={`p-2.5 sm:p-3 border flex items-center justify-between gap-2 rounded-none transition-colors ${
                idCardNumber.trim() && cccdImage && cccdBackImage
                  ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-200'
                  : 'bg-[#161B22] border-amber-500/50 text-amber-200'
              }`}>
                <div className="flex items-center gap-2 min-w-0">
                  {idCardNumber.trim() && cccdImage && cccdBackImage ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <span className="font-bold block text-white truncate">1. Căn Cước Công Dân</span>
                    <span className="text-[10.5px] text-gray-400 truncate block">
                      {idCardNumber.trim() && cccdImage && cccdBackImage
                        ? `Đã lưu riêng (${idCardNumber.slice(0, 4)}...${idCardNumber.slice(-3)})`
                        : 'Chưa đủ 2 mặt thẻ CCCD'}
                    </span>
                  </div>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 uppercase font-bold rounded-none shrink-0 ${
                  idCardNumber.trim() && cccdImage && cccdBackImage
                    ? 'bg-emerald-900/60 text-emerald-300'
                    : 'bg-amber-900/60 text-amber-300'
                }`}>
                  {idCardNumber.trim() && cccdImage && cccdBackImage ? 'Sẵn sàng ✓' : 'Chưa đủ'}
                </span>
              </div>

              {/* Check 2: FaceID */}
              <div className={`p-2.5 sm:p-3 border flex items-center justify-between gap-2 rounded-none transition-colors ${
                enrolledFaceProfile?.samples?.front
                  ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-200'
                  : 'bg-[#161B22] border-amber-500/50 text-amber-200'
              }`}>
                <div className="flex items-center gap-2 min-w-0">
                  {enrolledFaceProfile?.samples?.front ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <span className="font-bold block text-white truncate">2. Sinh Trắc Học FaceID</span>
                    <span className="text-[10.5px] text-gray-400 truncate block">
                      {enrolledFaceProfile?.samples?.front
                        ? 'Đã lưu riêng bộ 4 góc mẫu'
                        : 'Chưa thu thập đủ 4 mẫu'}
                    </span>
                  </div>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 uppercase font-bold rounded-none shrink-0 ${
                  enrolledFaceProfile?.samples?.front
                    ? 'bg-emerald-900/60 text-emerald-300'
                    : 'bg-amber-900/60 text-amber-300'
                }`}>
                  {enrolledFaceProfile?.samples?.front ? 'Sẵn sàng ✓' : 'Chưa đủ'}
                </span>
              </div>
            </div>

            {/* Chốt hồ sơ Button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="text-[11px] text-gray-400 hidden sm:block">
                Ban Quản Lý sẽ nhận được thông báo ngay lập tức để thẩm định đối soát hình ảnh.
              </div>

              <button
                type="button"
                onClick={handleSubmitEkycToBql}
                disabled={isScanningOcr}
                className="w-full sm:w-auto px-8 py-3 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xl rounded-none active:scale-[0.99] flex-shrink-0 cursor-pointer"
              >
                {isScanningOcr ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                {isScanningOcr
                  ? 'Đang Gửi Chốt Hồ Sơ...'
                  : ekycStatus === 'VERIFIED'
                  ? 'Gửi Cập Nhật Lại Cho Ban Quản Lý'
                  : ekycStatus === 'REJECTED'
                  ? 'Gửi Lại Ban Quản Lý Thẩm Định'
                  : ekycStatus === 'PENDING'
                  ? 'Gửi Lại / Cập Nhật Chốt Hồ Sơ'
                  : 'Gửi Ban Quản Lý Xác Nhận Chốt Hồ Sơ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: ACCOUNT PASSWORD MANAGEMENT (ĐỔI MẬT KHẨU TÀI KHOẢN)    */}
      {/* ------------------------------------------------------------- */}
      {!isLoadingApi && activeTab === 'PASSWORD' && (
        <div className="space-y-6 animate-fadeIn">
          <AccountPasswordSection currentUser={currentUser} />
        </div>
      )}

      {/* Tesseract OCR Scanner Modal */}
      <CccdOcrScannerModal
        isOpen={isOcrModalOpen}
        onClose={() => setIsOcrModalOpen(false)}
        onApplyOcrData={handleApplyOcrData}
        initialFrontImage={cccdImage}
        initialBackImage={cccdBackImage}
      />

      {/* Avatar Studio Editor Modal */}
      <AvatarEditorModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        currentAvatarUrl={avatarUrl}
        onAvatarUpdated={async (newAvatarUrl) => {
          setAvatarUrl(newAvatarUrl);
          updateUserInfo({ avatar_url: newAvatarUrl, avatar: newAvatarUrl } as any);
          const userKey = currentUser.phone || currentUser.email || currentUser.username || currentUser.id;
          if (typeof window !== 'undefined') {
            localStorage.setItem('skyline_user_avatar_' + userKey, newAvatarUrl);
            window.dispatchEvent(new CustomEvent('skyline_avatar_updated', { detail: { avatar: newAvatarUrl } }));
          }
          await refreshUser();
          setSavedSuccess(true);
          setTimeout(() => setSavedSuccess(false), 3000);
        }}
      />

      {/* Exact Resident CCCD Card Viewer (Front & Back) */}
      <CccdCardViewer
        isOpen={isCardViewerOpen}
        onClose={() => setIsCardViewerOpen(false)}
        fullName={fullName || currentUser.full_name}
        idCardNo={idCardNumber || currentUser.id_card_no || '067204000961'}
        apartmentCode={aptCode}
        frontImage={cccdImage}
        backImage={cccdBackImage}
        idDate={idDate || '18/08/2022'}
        idPlace={idPlace || 'Cục Cảnh sát QLHC về TTXH'}
        dob={birthday || '18/08/2004'}
        gender={gender === '1' ? 'Nam' : 'Nữ'}
        pob={pob || 'Quảng Trị'}
        avatarUrl={avatarUrl || currentUser.avatar_url || ''}
        allowUpload={true}
        onUpdateImages={(front, back) => {
          const userKey = currentUser.phone || currentUser.email || currentUser.username || currentUser.id;
          if (front) {
            setCccdImage(front);
            if (typeof window !== 'undefined') {
              localStorage.setItem('skyline_cccd_front_' + userKey, front);
            }
          }
          if (back) {
            setCccdBackImage(back);
            if (typeof window !== 'undefined') {
              localStorage.setItem('skyline_cccd_back_' + userKey, back);
            }
          }
          updateEkycCardImages(userKey, front, back);
          nksUpdateCccd({
            front,
            back,
            number: idCardNumber,
            date: idDate,
            place: idPlace,
          }).catch(e => console.warn('Sync CCCD error:', e));
        }}
      />

      {/* Official 4-Step Banking-Grade FaceID Biometric Enrollment Modal */}
      <BankFaceEnrollModal
        isOpen={isBankEnrollOpen}
        onClose={() => setIsBankEnrollOpen(false)}
        userId={currentUser.phone || currentUser.email || currentUser.username || currentUser.id}
        fullName={fullName || currentUser.full_name}
        apartmentCode={aptCode}
        phone={phone || currentUser.phone || ''}
        email={currentUser.email || ''}
        isFamilyMemberSelfEnroll={!isOwner}
        submittedByRole={currentUser.role}
        onEnrollSuccess={(profile) => {
          setEnrolledFaceProfile(profile);
          setIsEditingLegal(true);
          setEkycFeedback({
            type: 'success',
            message: 'Đã lưu độc lập 4 góc mẫu FaceID vào thiết bị và hệ thống! Khi đã có đủ cả CCCD và FaceID, vui lòng nhấn "Gửi Ban Quản Lý Xác Nhận Chốt Hồ Sơ" ở Bước 3.',
          });
          // TUYỆT ĐỐI KHÔNG cập nhật / ghi đè ảnh chân dung cá nhân (avatar) từ mẫu FaceID
          // Ảnh chân dung cư dân được giữ nguyên vẹn từ thẻ CCCD hoặc mục Đổi Avatar riêng biệt.
        }}
      />
    </div>
  );
}
