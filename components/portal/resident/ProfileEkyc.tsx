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
  nksRemoveFamilyMember
} from '@/lib/nksApiClient';
import { useAuth } from '@/lib/authContext';
import CccdOcrScannerModal from './CccdOcrScannerModal';
import AvatarEditorModal from './AvatarEditorModal';
import CccdCardViewer from '@/components/portal/shared/CccdCardViewer';
import { OcrCccdResult, formatToDateInput, formatToDisplayDate, formatToApiDate } from '@/lib/ocrParser';
import { 
  getEkycForUser, 
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
  const aptCode = currentUser.apartment_code || '12A05';
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
  const [ekycStatus, setEkycStatus] = useState<'VERIFIED' | 'PENDING' | 'REJECTED' | 'DRAFT'>('DRAFT');
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

    // Synchronize live e-KYC status with BQL approval center
    const syncEkycStatus = () => {
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
    };

    syncEkycStatus();
    window.addEventListener('skyline_ekyc_updated', syncEkycStatus);

    // Synchronize FaceID enrolled biometric profile
    const syncEnrolledFace = () => {
      const p = getEnrolledFaceProfile(userKey);
      setEnrolledFaceProfile(p);
    };
    syncEnrolledFace();
    window.addEventListener('skyline_faceid_enrolled', syncEnrolledFace);

    return () => {
      window.removeEventListener('skyline_ekyc_updated', syncEkycStatus);
      window.removeEventListener('skyline_faceid_enrolled', syncEnrolledFace);
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
    setActiveTab('INFO');

    // Display clear notice that data is auto-filled and ready to be saved
    setOcrFilledNotice(true);
    setTimeout(() => setOcrFilledNotice(false), 10000);
  };

  const handleRetakeEkyc = async () => {
    setIsScanningOcr(true);
    try {
      await nksUpdateCccd({
        number: idCardNumber,
        date: idDate,
        place: idPlace,
        front: cccdImage,
      });
      await nksUpdateAvatar(avatarUrl);
    } catch (err) {
      console.warn('NKS ekyc error', err);
    }

    setTimeout(() => {
      setIsScanningOcr(false);
      setMatchScore(99.9);
      setEkycStatus('VERIFIED');
      alert('✨ Đã kích hoạt nhận diện khuôn mặt (FaceID) và phân quyền mở sảnh đón, thang máy thành công!');
    }, 1200);
  };

  const handleSubmitEkycToBql = async () => {
    if (!idCardNumber.trim()) {
      alert('Vui lòng quét thẻ CCCD hoặc nhập số Căn cước công dân trước khi gửi hồ sơ duyệt!');
      return;
    }
    if (!cccdImage) {
      alert('Vui lòng quét hoặc tải lên ảnh Mặt Trước của thẻ Căn cước công dân!');
      return;
    }
    if (!cccdBackImage) {
      alert('Vui lòng quét hoặc tải lên thêm ảnh Mặt Sau thẻ CCCD (có chip điện tử) để Ban Quản Lý có đầy đủ cơ sở thẩm định!');
      return;
    }

    const currentAvatar = avatarUrl || currentUser.avatar_url || enrolledFaceProfile?.samples?.front || '';
    if (!currentAvatar && !enrolledFaceProfile) {
      alert('Vui lòng thực hiện bước "Quét Mẫu FaceID" bằng camera hoặc tải ảnh chân dung trước khi gửi hồ sơ duyệt!');
      return;
    }

    const faceSamples = enrolledFaceProfile?.samples || {
      front: currentAvatar,
    };

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
        faceScore: enrolledFaceProfile?.faceScore || 98.6,
      };

      const req = submitEkycRequest(reqPayload);
      setCurrentEkyc(req);
      setEkycStatus('PENDING');
      setIsEditingLegal(false);

      // Synchronize to server API endpoint for real-time BQL processing
      try {
        const res = await fetch('/api/nks/ekyc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'SUBMIT',
            ...reqPayload,
          }),
        });
        const resJson = await res.json();
        if (!res.ok) {
          console.warn('Server sync message:', resJson?.message);
        }
      } catch (apiErr) {
        console.warn('Sync ekyc submit API error:', apiErr);
      }

      alert('✨ Hồ sơ định danh kèm ảnh CCCD 2 mặt và mẫu khuôn mặt FaceID đã được gửi tới Ban Quản Lý thành công!\nBan Quản Lý sẽ tiến hành thẩm định và phê duyệt cấp quyền mở cửa, thang máy cho quý cư dân.');
    } finally {
      setIsScanningOcr(false);
    }
  };

  return (
    <div className="space-y-6 w-full animate-fadeIn select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222B35] pb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-semibold flex items-center gap-1.5">
            <ScanFace className="w-3.5 h-3.5" /> Skyline Smart Residence • {isOwner ? 'Chủ Hộ Căn Hộ' : 'Thành Viên Cư Dân'}
          </div>
          <h2 className="font-serif text-2xl text-white font-bold mt-1">
            {isOwner 
              ? 'Hồ Sơ Cá Nhân, Thẻ e-KYC & Đổi Mật Khẩu' 
              : 'Hồ Sơ Cá Nhân Thành Viên & Đổi Mật Khẩu'}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {isOwner
              ? `Căn hộ: ${aptCode} • Quản lý hồ sơ chủ hộ, thẻ e-KYC, cấp quyền và đổi mật khẩu các tài khoản`
              : `Căn hộ: ${aptCode} • Thông tin cá nhân và thay đổi mật khẩu đăng nhập của thành viên`}
          </p>
        </div>

        {/* Cụm Nút e-KYC & Trạng Thái */}
        {isOwner ? (
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => setIsOcrModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-[#1E2631] to-[#121820] border border-[#C5A880] text-[#C5A880] hover:text-white hover:border-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow rounded-none"
            >
              <Scan className="w-4 h-4 text-[#C5A880]" /> Tự Động Quét Căn Cước
            </button>

            {ekycStatus === 'VERIFIED' && (
              <span className="px-3 py-1 bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 rounded-none">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Thẻ e-KYC Đã Xác Thực
              </span>
            )}

            {ekycStatus === 'PENDING' && (
              <span className="px-3 py-1 bg-amber-950/80 border border-amber-500 text-amber-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 rounded-none animate-pulse">
                <Clock className="w-4 h-4 text-amber-400" /> Đang Chờ BQL Duyệt
              </span>
            )}

            {ekycStatus === 'REJECTED' && (
              <span className="px-3 py-1 bg-rose-950/80 border border-rose-500 text-rose-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 rounded-none">
                <XCircle className="w-4 h-4 text-rose-400" /> BQL Yêu Cầu Chụp Lại
              </span>
            )}

            {ekycStatus === 'DRAFT' && (
              <span className="px-3 py-1 bg-[#161D26] border border-gray-600 text-gray-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 rounded-none">
                <AlertCircle className="w-4 h-4 text-[#C5A880]" /> Chưa Gửi Hồ Sơ
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="px-3 py-1.5 bg-[#161D26] border border-purple-500/50 text-purple-300 text-xs font-semibold rounded-none flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" /> Thành Viên Căn Hộ (Chủ Hộ Cấp Quyền)
            </span>
          </div>
        )}
      </div>

      {/* Tab Navigation: HIỂN THỊ CHO TẤT CẢ CÁC TÀI KHOẢN */}
      <div className="flex flex-wrap border-b border-[#222B35] text-xs font-semibold uppercase tracking-wider gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('INFO')}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'INFO'
              ? 'border-[#C5A880] text-[#C5A880] font-bold'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <UserIcon className="w-4 h-4" /> 1. Thông Tin Cá Nhân
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('EKYC')}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'EKYC'
              ? 'border-[#C5A880] text-[#C5A880] font-bold'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <ScanFace className="w-4 h-4" /> 2. Định Danh e-KYC & FaceID Sinh Trắc Học
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('PASSWORD')}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'PASSWORD'
              ? 'border-[#C5A880] text-[#C5A880] font-bold'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <KeyRound className="w-4 h-4" /> {isOwner ? '3. Đổi Mật Khẩu Các Tài Khoản' : '3. Đổi Mật Khẩu Tài Khoản'}
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
        <form onSubmit={handleSaveInfo} className="p-6 sm:p-8 bg-[#121820] border border-[#222B35] space-y-6 shadow-2xl rounded-none">
          {/* Avatar & Fast Profile Header */}
          <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-[#161D26] border border-[#222B35] rounded-none">
            {/* Avatar with Upload Trigger */}
            <div className="relative group">
              <img
                src={avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'}
                alt="Avatar"
                className="w-20 h-20 rounded-full object-cover border-2 border-[#C5A880] shadow-lg"
              />
              <button
                type="button"
                onClick={() => setIsAvatarModalOpen(true)}
                className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[10px] font-bold cursor-pointer"
                title="Chỉnh sửa & Cắt ảnh tự do"
              >
                <Camera className="w-4 h-4 mb-0.5" />
                Đổi Ảnh
              </button>
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
            </div>

            <button
              type="button"
              onClick={() => setIsAvatarModalOpen(true)}
              className="px-4 py-2.5 bg-[#1C2533] hover:bg-[#C5A880] hover:text-[#0D1117] border border-gray-700 hover:border-[#C5A880] text-xs font-bold uppercase tracking-wider text-white transition-all rounded-none flex items-center gap-2 shadow"
            >
              <Upload className="w-3.5 h-3.5 text-[#C5A880]" /> Tùy Chỉnh & Đổi Avatar
            </button>
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
          {/* KHỐI 1: THÔNG TIN CĂN HỘ & PHÁP LÝ ĐỊNH DANH (BQL QUẢN LÝ) */}
          {/* ========================================================= */}
          <div className="p-6 bg-[#161D26] border border-[#2D3748] rounded-none space-y-5 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222B35] pb-4">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-[#C5A880] font-bold flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5" /> Khối Thông Tin Bắt Buộc • Ban Quản Lý Quản Lý
                </div>
                <h3 className="font-serif text-lg font-bold text-white mt-0.5">
                  1. Thông Tin Căn Hộ & Pháp Lý Định Danh Cư Trú
                </h3>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                {ekycStatus === 'VERIFIED' ? (
                  <span className="px-3 py-1 bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 rounded-none shadow-sm">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> Đã Xác Thực e-KYC Bởi BQL
                  </span>
                ) : ekycStatus === 'PENDING' ? (
                  <span className="px-3 py-1 bg-amber-950/80 border border-amber-500 text-amber-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 rounded-none animate-pulse">
                    <Clock className="w-4 h-4 text-amber-400" /> Đang Chờ BQL Phê Duyệt
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-rose-950/80 border border-rose-500 text-rose-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 rounded-none">
                    <AlertCircle className="w-4 h-4 text-rose-400" /> Chưa Hoàn Tất e-KYC
                  </span>
                )}
              </div>
            </div>

            {/* Business Logic Notice Banner */}
            <div className={`p-4 rounded-none text-xs leading-relaxed flex items-start gap-3 border ${
              ekycStatus === 'VERIFIED'
                ? 'bg-[#0E1B15] border-emerald-500/40 text-emerald-200'
                : 'bg-[#1C1A14] border-amber-500/40 text-amber-200'
            }`}>
              <Lock className="w-4 h-4 text-[#C5A880] mt-0.5 flex-shrink-0" />
              <div>
                <strong className="text-white block font-semibold mb-0.5">
                  Quy định an ninh & pháp lý cư trú tòa nhà Skyline:
                </strong>
                {ekycStatus === 'VERIFIED' ? (
                  <span>
                    Thông tin định danh gắn liền với Hợp đồng sở hữu căn hộ và quyền sinh trắc học FaceID ra vào cửa/thang máy. Cư dân không thể tự ý chỉnh sửa để chống giả mạo hồ sơ căn hộ. Nếu cần đính chính hoặc cấp đổi thẻ CCCD mới, vui lòng bấm nút <strong>[Yêu Cầu Cập Nhật CCCD Mới]</strong> bên dưới để gửi BQL duyệt lại.
                  </span>
                ) : (
                  <span>
                    Hồ sơ định danh chưa được phê duyệt. Vui lòng quét thẻ CCCD thật và gửi hồ sơ để BQL đối chiếu, kích hoạt thẻ cư dân và quyền mở cửa FaceID.
                  </span>
                )}
              </div>
            </div>

            {/* Legal Identity Fields Grid (Locked / Read-Only when Verified) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Field: Mã Căn Hộ */}
              <div className="space-y-1.5">
                <label className="text-gray-400 flex items-center justify-between font-medium">
                  <span className="flex items-center gap-1.5 text-gray-300">
                    <Building className="w-3.5 h-3.5 text-[#C5A880]" /> Căn Hộ Cư Trú:
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> Khóa cố định
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={`Căn hộ ${aptCode} • Chung cư Skyline Smart Residence`}
                    readOnly
                    className="w-full bg-[#0D1117] border border-[#263140] p-3 text-white font-semibold rounded-none cursor-not-allowed select-all"
                  />
                  <Lock className="w-3.5 h-3.5 text-gray-500 absolute right-3 top-3.5" />
                </div>
                <div className="text-[10.5px] text-gray-500">Cố định theo hợp đồng mua bán / sở hữu căn hộ.</div>
              </div>

              {/* Field: Tư Cách Cư Trú */}
              <div className="space-y-1.5">
                <label className="text-gray-400 flex items-center justify-between font-medium">
                  <span className="flex items-center gap-1.5 text-gray-300">
                    <Users className="w-3.5 h-3.5 text-[#C5A880]" /> Tư Cách Cư Trú:
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> BQL xác nhận
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={isOwner ? 'Chủ Sở Hữu Căn Hộ (Chính Chủ)' : 'Thành Viên Gia Đình (Được Bảo Lãnh)'}
                    readOnly
                    className="w-full bg-[#0D1117] border border-[#263140] p-3 text-[#C5A880] font-semibold rounded-none cursor-not-allowed"
                  />
                  <ShieldCheck className="w-3.5 h-3.5 text-[#C5A880] absolute right-3 top-3.5" />
                </div>
                <div className="text-[10.5px] text-gray-500">Quyền quản trị không gian sống và bảo lãnh người thân.</div>
              </div>

              {/* Field: Họ và Tên Pháp Lý */}
              <div className="space-y-1.5">
                <label className="text-gray-400 flex items-center justify-between font-medium">
                  <span className="flex items-center gap-1.5 text-gray-300">
                    <UserIcon className="w-3.5 h-3.5 text-[#C5A880]" /> Họ và Tên Pháp Lý:
                  </span>
                  {ekycStatus === 'VERIFIED' && !isEditingLegal && (
                    <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> Khớp CCCD đã duyệt
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => {
                      if (ekycStatus !== 'VERIFIED' || isEditingLegal) setFullName(e.target.value);
                    }}
                    readOnly={ekycStatus === 'VERIFIED' && !isEditingLegal}
                    className={`w-full p-3 font-semibold rounded-none transition-colors ${
                      ekycStatus === 'VERIFIED' && !isEditingLegal
                        ? 'bg-[#0D1117] border border-[#263140] text-white cursor-not-allowed'
                        : 'bg-[#161B22] border border-[#2D3748] text-white focus:outline-none focus:border-[#C5A880]'
                    }`}
                  />
                  {ekycStatus === 'VERIFIED' && !isEditingLegal && (
                    <Lock className="w-3.5 h-3.5 text-gray-500 absolute right-3 top-3.5" />
                  )}
                </div>
                <div className="text-[10.5px] text-gray-500">Tên định danh in trên Căn cước công dân.</div>
              </div>

              {/* Field: Số Căn Cước Công Dân (12 số) */}
              <div className="space-y-1.5">
                <label className="text-gray-400 flex items-center justify-between font-medium">
                  <span className="flex items-center gap-1.5 text-gray-300">
                    <CreditCard className="w-3.5 h-3.5 text-[#C5A880]" /> Số CCCD (12 Chữ Số):
                  </span>
                  {ekycStatus === 'VERIFIED' && !isEditingLegal && (
                    <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                      <ShieldCheck className="w-2.5 h-2.5" /> Đã xác thực
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={idCardNumber}
                    onChange={(e) => {
                      if (ekycStatus !== 'VERIFIED' || isEditingLegal) setIdCardNumber(e.target.value);
                    }}
                    readOnly={ekycStatus === 'VERIFIED' && !isEditingLegal}
                    className={`w-full p-3 font-mono font-bold rounded-none transition-colors ${
                      ekycStatus === 'VERIFIED' && !isEditingLegal
                        ? 'bg-[#0D1117] border border-[#263140] text-emerald-300 cursor-not-allowed tracking-wider'
                        : 'bg-[#161B22] border border-[#2D3748] text-white focus:outline-none focus:border-[#C5A880]'
                    }`}
                  />
                  {ekycStatus === 'VERIFIED' && !isEditingLegal && (
                    <Lock className="w-3.5 h-3.5 text-gray-500 absolute right-3 top-3.5" />
                  )}
                </div>
                <div className="text-[10.5px] text-gray-500">Số định danh cá nhân đã khai báo với Công an khu vực.</div>
              </div>

              {/* Field: Ngày Sinh */}
              <div className="space-y-1.5">
                <label className="text-gray-400 flex items-center justify-between font-medium">
                  <span className="flex items-center gap-1.5 text-gray-300">
                    <Calendar className="w-3.5 h-3.5 text-[#C5A880]" /> Ngày Sinh:
                  </span>
                  {ekycStatus === 'VERIFIED' && !isEditingLegal && (
                    <span className="text-[10px] text-gray-500 font-mono">Đã khóa</span>
                  )}
                </label>
                <input
                  type="date"
                  value={formatToApiDate(birthday)}
                  onChange={(e) => {
                    if (ekycStatus !== 'VERIFIED' || isEditingLegal) setBirthday(e.target.value);
                  }}
                  readOnly={ekycStatus === 'VERIFIED' && !isEditingLegal}
                  className={`w-full p-3 font-mono rounded-none transition-colors ${
                    ekycStatus === 'VERIFIED' && !isEditingLegal
                      ? 'bg-[#0D1117] border border-[#263140] text-gray-300 cursor-not-allowed'
                      : 'bg-[#161B22] border border-[#2D3748] text-white focus:outline-none focus:border-[#C5A880]'
                  }`}
                />
              </div>

              {/* Field: Ngày Cấp & Nơi Cấp */}
              <div className="space-y-1.5">
                <label className="text-gray-400 flex items-center justify-between font-medium">
                  <span className="flex items-center gap-1.5 text-gray-300">
                    <MapPin className="w-3.5 h-3.5 text-[#C5A880]" /> Nơi Cấp & Ngày Cấp:
                  </span>
                  {ekycStatus === 'VERIFIED' && !isEditingLegal && (
                    <span className="text-[10px] text-gray-500 font-mono">Đã khóa</span>
                  )}
                </label>
                <input
                  type="text"
                  value={`${idPlace || 'Cục CS QLHC về TTXH'} ${idDate ? `• ${formatToApiDate(idDate)}` : ''}`}
                  onChange={(e) => {
                    if (ekycStatus !== 'VERIFIED' || isEditingLegal) setIdPlace(e.target.value);
                  }}
                  readOnly={ekycStatus === 'VERIFIED' && !isEditingLegal}
                  className={`w-full p-3 rounded-none transition-colors ${
                    ekycStatus === 'VERIFIED' && !isEditingLegal
                      ? 'bg-[#0D1117] border border-[#263140] text-gray-300 cursor-not-allowed'
                      : 'bg-[#161B22] border border-[#2D3748] text-white focus:outline-none focus:border-[#C5A880]'
                  }`}
                />
              </div>
            </div>

            {/* 2 VỊ TRÍ ẢNH THẺ CCCD (MẶT TRƯỚC & MẶT SAU) - TỰ ĐỘNG ĐIỀN KHI QUÉT */}
            <div className="space-y-3 pt-4 border-t border-[#222B35]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-gray-300 font-semibold flex items-center gap-1.5 text-xs">
                  <CreditCard className="w-4 h-4 text-[#C5A880]" /> 2 Vị Trí Ảnh Thẻ Căn Cước Công Dân (Tự Động Điền Sau Khi Quét):
                </span>
                <span className="text-[11px] font-mono">
                  {cccdImage ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Đã Tự Động Điền 2 Mặt Thẻ CCCD ✓
                    </span>
                  ) : (
                    <span className="text-gray-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[#C5A880]" /> Tự động điền sau khi quét thẻ
                    </span>
                  )}
                </span>
              </div>

              {/* 2 Card Image Upload Slots (Front & Back) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Vị trí 1: CCCD Mặt Trước */}
                <div className="p-3 bg-[#121820] border border-[#2D3748] rounded-none space-y-2 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-400"></span> Mặt Trước (Có Ảnh & 12 Số CCCD)
                    </span>
                    <span className="text-[10px] text-cyan-300 font-mono px-2 py-0.5 bg-cyan-950/80 border border-cyan-500/30 rounded-none">
                      Vị Trí 1
                    </span>
                  </div>

                  <div className="relative w-full h-44 sm:h-48 rounded-none overflow-hidden border border-gray-700 bg-[#0A0E14] flex items-center justify-center group shadow-inner">
                    <img
                      src={cccdImage || 'https://images.unsplash.com/photo-1578852612716-854e527abf2e?w=600'}
                      alt="CCCD Mặt Trước"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/75 backdrop-blur rounded-none text-[9.5px] font-mono text-cyan-300 border border-cyan-500/30">
                      MẶT TRƯỚC (FRONT)
                    </div>
                    {cccdImage && (
                      <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-emerald-950/90 text-emerald-300 border border-emerald-500 text-[9px] font-mono font-bold rounded-none">
                        ✓ Tự Động Đọc Từ Thẻ
                      </div>
                    )}
                  </div>

                  <div className="text-[10.5px] text-gray-400 flex items-center justify-between">
                    <span>Trạng thái: <strong className="text-gray-200">{cccdImage ? 'Đã có ảnh mặt trước' : 'Chờ quét'}</strong></span>
                    <span className="text-gray-500 font-mono text-[10px]">Tự động trích xuất từ thẻ</span>
                  </div>
                </div>

                {/* Vị trí 2: CCCD Mặt Sau */}
                <div className="p-3 bg-[#121820] border border-[#2D3748] rounded-none space-y-2 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-400"></span> Mặt Sau (Chip Điện Tử & Ngày Cấp)
                    </span>
                    <span className="text-[10px] text-purple-300 font-mono px-2 py-0.5 bg-purple-950/80 border border-purple-500/30 rounded-none">
                      Vị Trí 2
                    </span>
                  </div>

                  <div className="relative w-full h-44 sm:h-48 rounded-none overflow-hidden border border-gray-700 bg-[#0A0E14] flex items-center justify-center group shadow-inner">
                    <img
                      src={cccdBackImage || cccdImage || 'https://images.unsplash.com/photo-1578852612716-854e527abf2e?w=600'}
                      alt="CCCD Mặt Sau"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/75 backdrop-blur rounded-none text-[9.5px] font-mono text-purple-300 border border-purple-500/30">
                      MẶT SAU (BACK)
                    </div>
                    {cccdBackImage && (
                      <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-emerald-950/90 text-emerald-300 border border-emerald-500 text-[9px] font-mono font-bold rounded-none">
                        ✓ Tự Động Đọc Từ Thẻ
                      </div>
                    )}
                  </div>

                  <div className="text-[10.5px] text-gray-400 flex items-center justify-between">
                    <span>Trạng thái: <strong className="text-gray-200">{cccdBackImage ? 'Đã có ảnh mặt sau' : 'Chờ quét'}</strong></span>
                    <span className="text-gray-500 font-mono text-[10px]">Tự động trích xuất từ thẻ</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons for Legal Block */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#222B35]">
              <div className="text-[11px] text-gray-400">
                {ekycStatus === 'VERIFIED' && !isEditingLegal
                  ? 'Hồ sơ đã được Ban Quản Lý phê duyệt chính thức.'
                  : ekycStatus === 'PENDING'
                  ? 'Hồ sơ đang chờ Ban Quản Lý phê duyệt.'
                  : ekycStatus === 'REJECTED'
                  ? 'BQL yêu cầu chỉnh sửa/chụp lại hồ sơ.'
                  : 'Vui lòng hoàn tất thông tin và gửi Ban Quản Lý duyệt.'}
              </div>

              <div className="flex items-center gap-2.5">
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => setIsCardViewerOpen(true)}
                    className="px-3.5 py-1.5 bg-[#1C2533] hover:bg-[#2A374A] border border-gray-700 text-gray-300 hover:text-white text-xs font-semibold rounded-none flex items-center gap-1.5 transition-all"
                  >
                    <Eye className="w-3.5 h-3.5" /> Xem Ảnh Thẻ CCCD
                  </button>
                )}

                {isOwner && ekycStatus === 'VERIFIED' && (
                  <button
                    type="button"
                    onClick={() => setIsEditingLegal(!isEditingLegal)}
                    className="px-3.5 py-1.5 bg-[#1C2533] hover:bg-[#2A374A] border border-[#C5A880]/60 text-[#C5A880] hover:text-white text-xs font-semibold rounded-none flex items-center gap-1.5 transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> {isEditingLegal ? 'Đóng Chỉnh Sửa' : 'Cập Nhật CCCD Mới'}
                  </button>
                )}

                {isOwner && (ekycStatus !== 'VERIFIED' || isEditingLegal) && (
                  <button
                    type="button"
                    onClick={handleSubmitEkycToBql}
                    disabled={isScanningOcr}
                    className="px-4 py-1.5 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold rounded-none flex items-center gap-1.5 transition-all shadow active:scale-95"
                  >
                    {isScanningOcr ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                    {ekycStatus === 'REJECTED' ? 'Gửi Lại BQL Phê Duyệt' : 'Gửi BQL Duyệt e-KYC'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* KHỐI 2: THÔNG TIN LIÊN HỆ & ĐĂNG KÝ TIỆN ÍCH (CƯ DÂN TỰ CHỦ) */}
          {/* ========================================================= */}
          <div className="p-6 bg-[#161D26] border border-[#2D3748] rounded-none space-y-5 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222B35] pb-4">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-[#C5A880] font-bold flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5" /> Tiện Ích Sinh Hoạt • Cư Dân Tự Do Cập Nhật
                </div>
                <h3 className="font-serif text-lg font-bold text-white mt-0.5">
                  2. Thông Tin Liên Hệ & Đăng Ký Tiện Ích Căn Hộ
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Thông tin dùng để nhận thông báo phí quản lý, bưu phẩm sảnh đón và đồng bộ hệ thống bãi xe hầm B1
                </p>
              </div>

              <span className="px-2.5 py-1 bg-[#121820] text-gray-300 border border-[#263140] text-xs rounded-none font-mono">
                Cập nhật tức thì
              </span>
            </div>

            {/* Editable Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              {/* Field: Số Điện Thoại */}
              <div className="space-y-1.5">
                <label className="text-gray-300 flex items-center gap-1.5 font-semibold">
                  <Smartphone className="w-3.5 h-3.5 text-[#C5A880]" /> Số Điện Thoại Liên Hệ (Nhận OTP):
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Nhập số điện thoại..."
                  className="w-full bg-[#161B22] border border-[#2D3748] p-3 text-white font-mono focus:outline-none focus:border-[#C5A880] transition-colors rounded-none"
                  required
                />
                <div className="text-[10.5px] text-gray-500">
                  Dùng để đăng nhập, nhận mã OTP và cuộc gọi khẩn cấp từ Ban Quản Lý.
                </div>
              </div>

              {/* Field: Email */}
              <div className="space-y-1.5">
                <label className="text-gray-300 flex items-center gap-1.5 font-semibold">
                  <Mail className="w-3.5 h-3.5 text-[#C5A880]" /> Email Nhận Hóa Đơn & Thông Báo:
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Nhập địa chỉ email..."
                  className="w-full bg-[#161B22] border border-[#2D3748] p-3 text-white font-mono focus:outline-none focus:border-[#C5A880] transition-colors rounded-none"
                  required
                />
                <div className="text-[10.5px] text-gray-500">
                  Nhận hóa đơn điện, nước, phí quản lý định kỳ và văn bản từ Ban Quản Lý.
                </div>
              </div>

              {/* Field: Giới Tính */}
              <div className="space-y-1.5">
                <label className="text-gray-300 flex items-center gap-1.5 font-semibold">
                  <UserIcon className="w-3.5 h-3.5 text-[#C5A880]" /> Giới Tính:
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as '1' | '0')}
                  className="w-full bg-[#161B22] border border-[#2D3748] p-3 text-white focus:outline-none focus:border-[#C5A880] transition-colors rounded-none"
                >
                  <option value="1">Nam</option>
                  <option value="0">Nữ</option>
                </select>
                <div className="text-[10.5px] text-gray-500">Thông tin danh xưng khi gửi thông báo.</div>
              </div>

              {/* Field: Tỉnh / Thành Phố */}
              <div className="space-y-1.5">
                <label className="text-gray-300 flex items-center gap-1.5 font-semibold">
                  <Globe className="w-3.5 h-3.5 text-[#C5A880]" /> Tỉnh / Thành Phố Thường Trú:
                </label>
                <input
                  type="text"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  placeholder="Nhập tỉnh thành..."
                  className="w-full bg-[#161B22] border border-[#2D3748] p-3 text-white focus:outline-none focus:border-[#C5A880] transition-colors rounded-none"
                />
                <div className="text-[10.5px] text-gray-500">Địa bàn thường trú của cư dân.</div>
              </div>

              {/* Field: Biển Số Xe */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-gray-300 flex items-center justify-between font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Car className="w-3.5 h-3.5 text-[#C5A880]" /> Biển Số Xe Đăng Ký (Tự Động Mở Cổng Hầm B1):
                  </span>
                  <span className="text-[10px] text-[#C5A880] font-mono">Tự động nhận diện biển số</span>
                </label>
                <input
                  type="text"
                  value={licensePlate}
                  onChange={(e) => setLicensePlate(e.target.value)}
                  className="w-full bg-[#161B22] border border-[#2D3748] p-3 text-[#C5A880] font-mono font-bold focus:outline-none focus:border-[#C5A880] transition-colors rounded-none"
                  placeholder="VD: 51K-889.99"
                />
                <div className="text-[10.5px] text-gray-400">
                  Hệ thống camera AI tại cổng barie hầm B1/B2 sẽ tự động nhận diện biển số này để mở barie không cần quẹt thẻ vật lý.
                </div>
              </div>

              {/* Field: Tiểu Sử / Ghi Chú Căn Hộ */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-gray-300 flex items-center gap-1.5 font-semibold">
                  <FileText className="w-3.5 h-3.5 text-[#C5A880]" /> Ghi Chú Căn Hộ & Lưu Ý Cho BQL:
                </label>
                <textarea
                  rows={2}
                  value={intro}
                  onChange={(e) => setIntro(e.target.value)}
                  placeholder="Ví dụ: Căn hộ có trẻ nhỏ, vui lòng gọi điện trước khi bấm chuông hoặc giao bưu phẩm..."
                  className="w-full bg-[#161B22] border border-[#2D3748] p-3 text-white focus:outline-none focus:border-[#C5A880] transition-colors rounded-none resize-none"
                />
                <div className="text-[10.5px] text-gray-500">
                  Ghi chú nội bộ hiển thị trên phần mềm tiếp đón lễ tân và trực ban kỹ thuật.
                </div>
              </div>

              {/* Quick Security & Password Change Card */}
              <div className="md:col-span-2 p-4 bg-[#161D26] border border-[#222B35] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-none">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 text-white font-semibold text-xs">
                    <KeyRound className="w-3.5 h-3.5 text-[#C5A880]" /> Mật Khẩu Đăng Nhập & Bảo Mật Tài Khoản
                  </div>
                  <div className="text-[11px] text-gray-400">
                    Bạn có thể cập nhật mật khẩu mới cho tài khoản cá nhân hoặc các tài khoản thành viên trực thuộc.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('PASSWORD')}
                  className="px-4 py-2 bg-[#1C2533] hover:bg-[#2B394E] border border-[#C5A880]/60 text-[#C5A880] hover:text-white text-xs font-bold uppercase tracking-wider rounded-none flex items-center gap-1.5 transition-colors flex-shrink-0"
                >
                  <Lock className="w-3.5 h-3.5" /> Đổi Mật Khẩu →
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-[#222B35]">
              <div className="text-[11px] text-gray-400">
                Nhấn lưu để đồng bộ thông tin liên hệ và biển số xe ngay lập tức.
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="px-8 py-3 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xl rounded-none active:scale-[0.99]"
              >
                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isSaving ? 'Đang Lưu Thông Tin...' : 'Lưu Thay Đổi Thông Tin Liên Hệ'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: E-KYC BIOMETRIC IDENTIFICATION & SMART CARD (CHỦ HỘ)   */}
      {/* ------------------------------------------------------------- */}
      {isOwner && activeTab === 'EKYC' && (
        <div className="space-y-6">
          {/* Status Box & BQL Sync Banner */}
          <div className={`p-5 border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl rounded-none ${
            ekycStatus === 'PENDING'
              ? 'bg-gradient-to-r from-[#1A1810] to-[#121820] border-amber-500/80'
              : ekycStatus === 'REJECTED'
              ? 'bg-gradient-to-r from-[#201014] to-[#121820] border-rose-500/80'
              : ekycStatus === 'VERIFIED'
              ? 'bg-gradient-to-r from-[#0E1A16] to-[#121820] border-emerald-500/70'
              : 'bg-gradient-to-r from-[#121820] to-[#161D26] border-[#C5A880]/70'
          }`}>
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                {ekycStatus === 'DRAFT' && (
                  <span className="text-gray-300 flex items-center gap-1.5 font-mono">
                    <AlertCircle className="w-4 h-4 text-[#C5A880]" /> Chưa Gửi Hồ Sơ Định Danh Cho BQL
                  </span>
                )}
                {ekycStatus === 'PENDING' && (
                  <span className="text-amber-400 flex items-center gap-1.5 font-mono">
                    <Clock className="w-4 h-4 animate-pulse" /> Đang Chờ Ban Quản Lý Phê Duyệt
                  </span>
                )}
                {ekycStatus === 'REJECTED' && (
                  <span className="text-rose-400 flex items-center gap-1.5 font-mono">
                    <XCircle className="w-4 h-4" /> BQL Yêu Cầu Chụp Lại / Bổ Sung Hồ Sơ
                  </span>
                )}
                {ekycStatus === 'VERIFIED' && (
                  <span className="text-emerald-400 flex items-center gap-1.5 font-mono">
                    <CheckCircle2 className="w-4 h-4" /> Đã Phê Duyệt & Kích Hoạt Quyền FaceID
                  </span>
                )}
              </div>

              <h3 className="font-serif text-lg font-bold text-white">
                Định Danh Khuôn Mặt & Thẻ Cư Dân Thông Minh
              </h3>

              <div className="text-xs text-gray-300 max-w-2xl font-light space-y-1">
                {ekycStatus === 'DRAFT' && (
                  <p>Quý cư dân vui lòng tải lên đầy đủ ảnh 2 mặt thẻ CCCD và thu thập mẫu FaceID 4 bước, sau đó bấm nút &quot;Gửi Hồ Sơ Cho BQL Duyệt&quot; để được cấp quyền mở cửa, thang máy và sảnh đón.</p>
                )}
                {ekycStatus === 'PENDING' && (
                  <p>Hồ sơ định danh kèm ảnh CCCD 2 mặt và mẫu FaceID đã gửi đến Ban Quản Lý lúc <strong className="text-white font-mono">{currentEkyc?.submittedAt || 'hôm nay'}</strong>. Nhân sự BQL đang thẩm định đối chiếu trước khi kích hoạt phân quyền tòa nhà.</p>
                )}
                {ekycStatus === 'REJECTED' && (
                  <div className="p-2.5 bg-rose-950/70 border border-rose-500/60 text-rose-200 text-xs rounded-none space-y-0.5">
                    <strong className="block text-rose-300">Lý do từ chối từ Ban Quản Lý:</strong>
                    <span>&quot;{currentEkyc?.rejectionReason || 'Ảnh chụp không đạt tiêu chuẩn độ nét hoặc thiếu ảnh thẻ CCCD.'}&quot;</span>
                  </div>
                )}
                {ekycStatus === 'VERIFIED' && (
                  <p>Hồ sơ định danh đã được Ban Quản Lý phê duyệt {currentEkyc?.reviewedAt ? `lúc ${currentEkyc.reviewedAt}` : ''} ({currentEkyc?.reviewedBy || 'Ban Quản Lý Skyline'}). Quyền mở cửa sảnh đón, thang máy và các tiện ích đặc quyền tòa nhà đã được kích hoạt thành công.</p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
              <button
                type="button"
                onClick={() => setIsCardViewerOpen(true)}
                className="px-3.5 py-2.5 bg-[#161B22] hover:bg-[#1C2533] border border-[#C5A880] text-[#C5A880] text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow rounded-none"
              >
                <Eye className="w-4 h-4" /> Xem Ảnh Thẻ CCCD
              </button>

              {ekycStatus === 'VERIFIED' ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingLegal(true);
                    setActiveTab('INFO');
                  }}
                  className="px-4 py-2.5 bg-[#1C2533] hover:bg-[#2A374A] border border-[#C5A880] text-[#C5A880] hover:text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow rounded-none"
                >
                  <RefreshCw className="w-4 h-4" /> Cập Nhật Lại CCCD / FaceID
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitEkycToBql}
                  disabled={isScanningOcr}
                  className="px-5 py-2.5 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg rounded-none active:scale-[0.99]"
                >
                  {isScanningOcr ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  {isScanningOcr ? 'Đang Gửi Hồ Sơ...' : ekycStatus === 'REJECTED' ? 'Gửi Lại BQL Phê Duyệt' : ekycStatus === 'PENDING' ? 'Cập Nhật / Gửi Lại Hồ Sơ' : 'Gửi Hồ Sơ Cho BQL Duyệt'}
                </button>
              )}
            </div>
          </div>

          {/* e-KYC Visual Matcher & Smart Pass Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Biometric FaceID Bank-Grade 4-Step Card */}
            <div className="p-5 bg-[#121820] border border-[#222B35] space-y-4 rounded-none flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-[#222B35] pb-2 mb-4">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <ScanFace className="w-4 h-4 text-[#C5A880]" /> Sinh Trắc Học FaceID (Chuẩn Ngân Hàng 4 Bước)
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsBankEnrollOpen(true)}
                    className="px-3 py-1.5 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider rounded-none flex items-center gap-1.5 transition-all shadow"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    {enrolledFaceProfile ? 'Quét Lại 4 Mẫu' : 'Quét Mẫu FaceID 4 Bước'}
                  </button>
                </div>

                {enrolledFaceProfile ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" /> Đã Kích Hoạt 4/4 Mẫu Toàn Vẹn (128-D Vector)
                      </div>
                      <span className="text-[10px] font-mono text-gray-400">
                        Thu thập: {new Date(enrolledFaceProfile.enrolledAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>

                    {/* 4 Angle Samples Gallery */}
                    <div className="grid grid-cols-4 gap-2">
                      <div className="space-y-1">
                        <div className="relative aspect-square border border-emerald-500/60 bg-black overflow-hidden group">
                          <img 
                            src={enrolledFaceProfile.samples.front} 
                            alt="Chính diện" 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                          />
                          <span className="absolute bottom-0 inset-x-0 bg-black/80 text-emerald-300 text-[9px] font-mono text-center py-0.5">
                            1. Thẳng
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="relative aspect-square border border-emerald-500/60 bg-black overflow-hidden group">
                          <img 
                            src={enrolledFaceProfile.samples.left} 
                            alt="Quay trái" 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                          />
                          <span className="absolute bottom-0 inset-x-0 bg-black/80 text-emerald-300 text-[9px] font-mono text-center py-0.5">
                            2. Trái
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="relative aspect-square border border-emerald-500/60 bg-black overflow-hidden group">
                          <img 
                            src={enrolledFaceProfile.samples.right} 
                            alt="Quay phải" 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                          />
                          <span className="absolute bottom-0 inset-x-0 bg-black/80 text-emerald-300 text-[9px] font-mono text-center py-0.5">
                            3. Phải
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="relative aspect-square border border-emerald-500/60 bg-black overflow-hidden group">
                          <img 
                            src={enrolledFaceProfile.samples.smile} 
                            alt="Mỉm cười" 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                          />
                          <span className="absolute bottom-0 inset-x-0 bg-black/80 text-emerald-300 text-[9px] font-mono text-center py-0.5">
                            4. Cười
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/40 text-[11px] text-emerald-200 space-y-1">
                      <div className="font-semibold flex items-center gap-1.5 text-emerald-300">
                        <ShieldCheck className="w-3.5 h-3.5" /> Sẵn Sàng Đăng Nhập Khuôn Mặt & Ra Vào Căn Hộ
                      </div>
                      <p className="text-gray-300 text-[10.5px]">
                        Hồ sơ sinh trắc học gồm 4 vector đặc trưng đa góc đã được lưu trữ an toàn. Bạn có thể sử dụng tính năng &quot;Quét Khuôn Mặt (FaceID)&quot; tại màn hình đăng nhập để xác thực tức thì.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-[#161D26] border border-amber-500/60 space-y-3">
                    <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                      <AlertCircle className="w-4 h-4" /> Chưa Kích Hoạt FaceID • Cần Thu Thập Đủ 4 Mẫu
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      Để nhận diện khuôn mặt chính thức khi đăng nhập (không còn là bản mẫu thử nghiệm), hệ thống Skyline yêu cầu thu thập toàn vẹn 4 góc chụp theo chuẩn e-KYC ngân hàng:
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-300">
                      <div className="p-2 bg-[#0D1117] border border-gray-800">1. Nhìn thẳng chính diện</div>
                      <div className="p-2 bg-[#0D1117] border border-gray-800">2. Quay mặt sang trái 30°</div>
                      <div className="p-2 bg-[#0D1117] border border-gray-800">3. Quay mặt sang phải 30°</div>
                      <div className="p-2 bg-[#0D1117] border border-gray-800">4. Mỉm cười xác thực cử động</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsBankEnrollOpen(true)}
                      className="w-full py-2.5 bg-gradient-to-r from-[#C5A880] to-[#E2C799] hover:brightness-110 text-[#0D1117] text-xs font-bold uppercase tracking-wider rounded-none flex items-center justify-center gap-2 transition-all shadow"
                    >
                      <Camera className="w-4 h-4 text-[#0D1117]" /> Bắt Đầu Quét Mặt 4 Bước Ngay
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-2 text-xs text-gray-300 bg-[#161B22] p-3.5 border border-[#222B35] rounded-none mt-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Tốc độ mở cửa / login:</span>
                  <strong className="text-emerald-400 font-mono">&lt; 0.35 giây (Chuẩn 1:N AI)</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Trạng thái xác thực FaceID:</span>
                  <span className={enrolledFaceProfile ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                    {enrolledFaceProfile ? 'Đã Kích Hoạt Chính Thức ✓' : 'Chưa Thu Thập Mẫu'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Quyền áp dụng:</span>
                  <span className="text-gray-200">Đăng nhập FaceID, Barrier Sảnh A/B, Thang máy Tầng 12</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Biển số xe:</span>
                  <strong className="text-[#C5A880] font-mono">{licensePlate || '51K-889.99'}</strong>
                </div>
              </div>
            </div>

            {/* Render 3D Resident Smart Pass Card */}
            <div className="p-5 bg-[#121820] border border-[#222B35] space-y-4 rounded-none flex flex-col justify-between">
              <div>
                <div className="border-b border-[#222B35] pb-2 mb-4">
                  <span className="text-xs font-bold text-[#C5A880] uppercase tracking-wider flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#C5A880]" /> Thẻ Định Danh Cư Dân Kim Loại (3D Smart Business Pass)
                  </span>
                </div>
                <ResidentSmartCard currentUser={currentUser} />
              </div>

              <div className="p-3 bg-[#161B22] border border-[#222B35] rounded-none text-[11px] text-gray-400 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Thẻ Điện Tử Đã Kích Hoạt NFC / RFID
                </span>
                <span className="font-mono text-gray-400">Mã thẻ: SKY-12A05-PASS</span>
              </div>
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
        onEnrollSuccess={(profile) => {
          setEnrolledFaceProfile(profile);
          if (profile.samples.front) {
            setAvatarUrl(profile.samples.front);
            updateUserInfo({ avatar_url: profile.samples.front, avatar: profile.samples.front } as any);
            const userKey = currentUser.phone || currentUser.email || currentUser.username || currentUser.id;
            if (typeof window !== 'undefined') {
              localStorage.setItem('skyline_user_avatar_' + userKey, profile.samples.front);
              window.dispatchEvent(new CustomEvent('skyline_avatar_updated', { detail: { avatar: profile.samples.front } }));
            }
          }
        }}
      />
    </div>
  );
}
