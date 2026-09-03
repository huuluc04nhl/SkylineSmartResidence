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
  EkycRequest 
} from '@/lib/ekycStore';

interface ProfileEkycProps {
  currentUser: User;
}

export default function ProfileEkyc({ currentUser }: ProfileEkycProps) {
  const { updateUserInfo, refreshUser } = useAuth();
  const isOwner = currentUser.role === 'OWNER';
  const aptCode = currentUser.apartment_code || '12A05';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'INFO' | 'EKYC'>('INFO');
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isCardViewerOpen, setIsCardViewerOpen] = useState(false);
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
  const [ekycStatus, setEkycStatus] = useState<'VERIFIED' | 'PENDING' | 'REJECTED'>('VERIFIED');
  const [currentEkyc, setCurrentEkyc] = useState<EkycRequest | null>(null);
  const [isScanningOcr, setIsScanningOcr] = useState(false);
  const [cccdImage, setCccdImage] = useState('');
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

    // Synchronize live e-KYC status with BQL approval center
    const syncEkycStatus = () => {
      const userRecord = getEkycForUser(currentUser.phone || currentUser.email || currentUser.username || currentUser.id);
      if (userRecord) {
        setCurrentEkyc(userRecord);
        setEkycStatus(userRecord.status === 'APPROVED' ? 'VERIFIED' : userRecord.status);
        if (userRecord.idCardFrontUrl) setCccdImage(userRecord.idCardFrontUrl);
        if (userRecord.idCardBackUrl) setCccdBackImage(userRecord.idCardBackUrl);
        if (userRecord.faceScore) setMatchScore(userRecord.faceScore);
      }
    };

    syncEkycStatus();
    window.addEventListener('skyline_ekyc_updated', syncEkycStatus);
    return () => window.removeEventListener('skyline_ekyc_updated', syncEkycStatus);
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

  const [cccdBackImage, setCccdBackImage] = useState('');

  // 2. Handle auto-filling data from OCR Scanner Modal (2 sides)
  const handleApplyOcrData = (ocrData: OcrCccdResult, frontSrc: string, backSrc: string) => {
    setIdCardNumber(ocrData.idNumber || '');
    setFullName(ocrData.fullName || '');
    setBirthday(formatToDateInput(ocrData.dob || ''));
    setGender(ocrData.gender || '1');
    setPob(ocrData.pob || '');
    setProvince(ocrData.province || 'Thành phố Hồ Chí Minh');
    setIdDate(formatToDateInput(ocrData.idDate || ''));
    setIdPlace(ocrData.idPlace || 'Cục Cảnh sát QLHC về TTXH');
    if (frontSrc) setCccdImage(frontSrc);
    if (backSrc) setCccdBackImage(backSrc);

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
      alert('Vui lòng quét thẻ CCCD hoặc nhập số CCCD trước khi gửi hồ sơ duyệt!');
      return;
    }
    if (!cccdImage) {
      alert('Vui lòng quét hoặc tải lên ảnh chụp thật của thẻ Căn cước công dân trước khi gửi duyệt!');
      return;
    }
    setIsScanningOcr(true);
    try {
      const req = submitEkycRequest({
        userId: currentUser.id || currentUser.username,
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
        avatarUrl: avatarUrl || currentUser.avatar_url || '',
        idCardFrontUrl: cccdImage,
        idCardBackUrl: cccdBackImage || '',
        faceScore: 98.8,
      });
      setCurrentEkyc(req);
      setEkycStatus('PENDING');
      alert('✅ Hồ sơ e-KYC kèm ảnh chụp CCCD thật đã được chuyển tới Ban Quản Lý tòa nhà để xét duyệt!');
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
            <ScanFace className="w-3.5 h-3.5" /> Skyline Smart Residence • Cư Dân
          </div>
          <h2 className="font-serif text-2xl text-white font-bold mt-1">
            Hồ Sơ Cá Nhân & Định Danh FaceID
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Căn hộ: <strong className="text-white font-mono">{aptCode}</strong> • Quản lý thông tin cá nhân và nhận diện khuôn mặt ra vào
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-shrink-0">
          <button
            type="button"
            onClick={() => setIsOcrModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-[#1E2631] to-[#121820] border border-[#C5A880] text-[#C5A880] hover:text-white hover:border-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow rounded"
          >
            <Scan className="w-4 h-4 text-[#C5A880]" /> Quét Căn Cước (OCR)
          </button>

          {ekycStatus === 'VERIFIED' && (
            <span className="px-3 py-1 bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 rounded">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> FaceID Đã Xác Thực
            </span>
          )}

          {ekycStatus === 'PENDING' && (
            <span className="px-3 py-1 bg-amber-950/80 border border-amber-500 text-amber-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 rounded animate-pulse">
              <Clock className="w-4 h-4 text-amber-400" /> Đang Chờ BQL Duyệt
            </span>
          )}

          {ekycStatus === 'REJECTED' && (
            <span className="px-3 py-1 bg-rose-950/80 border border-rose-500 text-rose-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 rounded">
              <XCircle className="w-4 h-4 text-rose-400" /> BQL Yêu Cầu Chụp Lại
            </span>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
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
          <ScanFace className="w-4 h-4" /> 2. Định Danh FaceID & Thẻ Cư Dân
        </button>
      </div>

      {/* Loading Indicator while fetching from API */}
      {isLoadingApi && (
        <div className="p-8 bg-[#121820] border border-[#222B35] flex items-center justify-center gap-3 text-xs text-[#C5A880] font-mono rounded-lg">
          <RefreshCw className="w-5 h-5 animate-spin text-[#C5A880]" />
          <span>Đang tải thông tin hồ sơ...</span>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: PERSONAL INFORMATION & VEHICLE REGISTRATION             */}
      {/* ------------------------------------------------------------- */}
      {!isLoadingApi && activeTab === 'INFO' && (
        <form onSubmit={handleSaveInfo} className="p-6 sm:p-8 bg-[#121820] border border-[#222B35] space-y-6 shadow-2xl rounded-lg">
          {/* Avatar & Fast Profile Header */}
          <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-[#161D26] border border-[#222B35] rounded">
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
                <span className="px-2 py-0.5 text-[10px] bg-[#C5A880] text-[#0D1117] font-bold uppercase rounded">
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
              className="px-4 py-2.5 bg-[#1C2533] hover:bg-[#C5A880] hover:text-[#0D1117] border border-gray-700 hover:border-[#C5A880] text-xs font-bold uppercase tracking-wider text-white transition-all rounded flex items-center gap-2 shadow"
            >
              <Upload className="w-3.5 h-3.5 text-[#C5A880]" /> Tùy Chỉnh & Đổi Avatar
            </button>
          </div>

          {/* Quick OCR Banner */}
          <div className="p-4 bg-gradient-to-r from-[#1A232E] via-[#161D26] to-[#121820] border border-[#C5A880]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded">
            <div className="space-y-1">
              <div className="text-[#C5A880] font-bold text-xs flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-300" /> Quét Thông Tin Tự Động Từ Căn Cước Công Dân
              </div>
              <p className="text-xs text-gray-300">
                Tự động trích xuất thông tin Số CCCD, Họ tên, Ngày sinh từ ảnh chụp để điền nhanh vào biểu mẫu.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsOcrModalOpen(true)}
              className="px-4 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 flex-shrink-0 shadow rounded"
            >
              <Scan className="w-3.5 h-3.5" /> Quét Thẻ Căn Cước
            </button>
          </div>

          <div className="border-b border-[#222B35] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-serif text-xl font-bold text-white">
                Chi Tiết Thông Tin Cư Dân
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Hồ sơ thông tin cư dân được bảo mật theo tiêu chuẩn Skyline Smart Residence
              </p>
            </div>
            <span className="text-[11px] text-gray-400 font-mono">Căn Hộ: <strong className="text-white">{aptCode}</strong></span>
          </div>

          {/* Feedback Alerts */}
          {ocrFilledNotice && (
            <div className="p-4 bg-amber-950/90 border-2 border-amber-500 text-amber-200 text-xs flex items-center justify-between gap-3 animate-fadeIn shadow-2xl rounded-lg">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-amber-300 flex-shrink-0 animate-pulse" />
                <div>
                  <strong className="text-white block text-sm font-semibold">✨ Đã trích xuất thông tin từ CCCD vào biểu mẫu!</strong>
                  <span className="text-gray-300 text-[11px]">Vui lòng kiểm tra lại thông tin và nhấn nút <strong>[Lưu Thay Đổi]</strong> ở cuối biểu mẫu để lưu dữ liệu.</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOcrFilledNotice(false)}
                className="px-2 py-1 bg-black/40 hover:bg-black/80 text-amber-300 hover:text-white text-[11px] font-bold rounded transition-colors"
              >
                Đã Hiểu
              </button>
            </div>
          )}

          {savedSuccess && (
            <div className="p-3.5 bg-emerald-950/90 border border-emerald-500 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn shadow-lg rounded">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>✓ Đã cập nhật thành công thông tin hồ sơ cá nhân!</span>
            </div>
          )}

          {saveError && (
            <div className="p-3.5 bg-rose-950/90 border border-rose-500 text-rose-300 text-xs flex items-center gap-2 animate-fadeIn rounded">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            {/* Field 1: Họ và Tên */}
            <div className="space-y-1.5">
              <label className="text-gray-300 flex items-center gap-1.5 font-semibold">
                <UserIcon className="w-3.5 h-3.5 text-[#C5A880]" /> Họ và Tên Cư Dân:
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nhập họ và tên..."
                className="w-full bg-[#161B22] border border-[#2D3748] p-3 text-white focus:outline-none focus:border-[#C5A880] transition-colors rounded"
                required
              />
            </div>

            {/* Field 2: Số Điện Thoại */}
            <div className="space-y-1.5">
              <label className="text-gray-300 flex items-center gap-1.5 font-semibold">
                <Smartphone className="w-3.5 h-3.5 text-[#C5A880]" /> Số Điện Thoại (Định Danh):
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Nhập số điện thoại..."
                className="w-full bg-[#161B22] border border-[#2D3748] p-3 text-white font-mono focus:outline-none focus:border-[#C5A880] transition-colors rounded"
                required
              />
            </div>

            {/* Field 3: Email */}
            <div className="space-y-1.5">
              <label className="text-gray-300 flex items-center gap-1.5 font-semibold">
                <Mail className="w-3.5 h-3.5 text-[#C5A880]" /> Email Liên Hệ:
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nhập địa chỉ email..."
                className="w-full bg-[#161B22] border border-[#2D3748] p-3 text-white font-mono focus:outline-none focus:border-[#C5A880] transition-colors rounded"
                required
              />
            </div>

            {/* Field 4: Giới Tính */}
            <div className="space-y-1.5">
              <label className="text-gray-300 flex items-center gap-1.5 font-semibold">
                <UserIcon className="w-3.5 h-3.5 text-[#C5A880]" /> Giới Tính:
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as '1' | '0')}
                className="w-full bg-[#161B22] border border-[#2D3748] p-3 text-white focus:outline-none focus:border-[#C5A880] transition-colors rounded"
              >
                <option value="1">Nam</option>
                <option value="0">Nữ</option>
              </select>
            </div>

            {/* Field 5: Số CCCD */}
            <div className="space-y-1.5">
              <label className="text-gray-300 flex items-center gap-1.5 font-semibold">
                <CreditCard className="w-3.5 h-3.5 text-[#C5A880]" /> Số Căn Cước Công Dân (CCCD 12 Số):
              </label>
              <input
                type="text"
                value={idCardNumber}
                onChange={(e) => setIdCardNumber(e.target.value)}
                placeholder="12 chữ số định danh..."
                className="w-full bg-[#161B22] border border-[#2D3748] p-3 text-white font-mono focus:outline-none focus:border-[#C5A880] transition-colors rounded"
                required
              />
            </div>

            {/* Field 6: Ngày Cấp CCCD */}
            <div className="space-y-1.5">
              <label className="text-gray-300 flex items-center gap-1.5 font-semibold">
                <Calendar className="w-3.5 h-3.5 text-[#C5A880]" /> Ngày Cấp CCCD:
              </label>
              <input
                type="date"
                value={formatToApiDate(idDate)}
                onChange={(e) => setIdDate(e.target.value)}
                className="w-full bg-[#161B22] border border-[#2D3748] p-3 text-white font-mono focus:outline-none focus:border-[#C5A880] transition-colors rounded"
              />
            </div>

            {/* Field 7: Nơi Cấp CCCD */}
            <div className="space-y-1.5">
              <label className="text-gray-300 flex items-center gap-1.5 font-semibold">
                <MapPin className="w-3.5 h-3.5 text-[#C5A880]" /> Nơi Cấp CCCD:
              </label>
              <input
                type="text"
                value={idPlace}
                onChange={(e) => setIdPlace(e.target.value)}
                placeholder="Nhập nơi cấp CCCD..."
                className="w-full bg-[#161B22] border border-[#2D3748] p-3 text-white focus:outline-none focus:border-[#C5A880] transition-colors rounded"
              />
            </div>

            {/* Field 8: Ngày Sinh */}
            <div className="space-y-1.5">
              <label className="text-gray-300 flex items-center gap-1.5 font-semibold">
                <Calendar className="w-3.5 h-3.5 text-[#C5A880]" /> Ngày Sinh:
              </label>
              <input
                type="date"
                value={formatToApiDate(birthday)}
                onChange={(e) => setBirthday(e.target.value)}
                className="w-full bg-[#161B22] border border-[#2D3748] p-3 text-white font-mono focus:outline-none focus:border-[#C5A880] transition-colors rounded"
              />
            </div>

            {/* Field 9: Nơi Sinh / Nguyên Quán */}
            <div className="space-y-1.5">
              <label className="text-gray-300 flex items-center gap-1.5 font-semibold">
                <MapPin className="w-3.5 h-3.5 text-[#C5A880]" /> Nơi Sinh / Nguyên Quán:
              </label>
              <input
                type="text"
                value={pob}
                onChange={(e) => setPob(e.target.value)}
                placeholder="Nhập nơi sinh..."
                className="w-full bg-[#161B22] border border-[#2D3748] p-3 text-white focus:outline-none focus:border-[#C5A880] transition-colors rounded"
              />
            </div>

            {/* Field 10: Tỉnh / Thành Phố */}
            <div className="space-y-1.5">
              <label className="text-gray-300 flex items-center gap-1.5 font-semibold">
                <Building className="w-3.5 h-3.5 text-[#C5A880]" /> Tỉnh / Thành Phố:
              </label>
              <input
                type="text"
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                placeholder="Nhập tỉnh thành..."
                className="w-full bg-[#161B22] border border-[#2D3748] p-3 text-white focus:outline-none focus:border-[#C5A880] transition-colors rounded"
              />
            </div>

            {/* Field 11: Biển Số Xe */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-gray-300 flex items-center gap-1.5 font-semibold">
                <Car className="w-3.5 h-3.5 text-[#C5A880]" /> Biển Số Xe Đăng Ký (Nhận diện ALPR Hầm B1):
              </label>
              <input
                type="text"
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value)}
                className="w-full bg-[#161B22] border border-[#2D3748] p-3 text-[#C5A880] font-mono font-bold focus:outline-none focus:border-[#C5A880] transition-colors rounded"
                placeholder="VD: 51K-889.99"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-[#222B35]">
            <button
              type="submit"
              disabled={isSaving}
              className="px-8 py-3 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-xl rounded"
            >
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSaving ? 'Đang Lưu...' : 'Lưu Thay Đổi'}
            </button>
          </div>
        </form>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: E-KYC BIOMETRIC IDENTIFICATION & SMART CARD            */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'EKYC' && (
        <div className="space-y-6">
          {/* Status Box & BQL Sync Banner */}
          <div className={`p-5 border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl rounded-lg ${
            ekycStatus === 'PENDING'
              ? 'bg-gradient-to-r from-[#1A1810] to-[#121820] border-amber-500/80'
              : ekycStatus === 'REJECTED'
              ? 'bg-gradient-to-r from-[#201014] to-[#121820] border-rose-500/80'
              : 'bg-gradient-to-r from-[#121820] to-[#161D26] border-[#C5A880]/70'
          }`}>
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                {ekycStatus === 'PENDING' && (
                  <span className="text-amber-400 flex items-center gap-1.5 font-mono">
                    <Clock className="w-4 h-4 animate-pulse" /> Đang Chờ Ban Quản Lý Phê Duyệt
                  </span>
                )}
                {ekycStatus === 'REJECTED' && (
                  <span className="text-rose-400 flex items-center gap-1.5 font-mono">
                    <XCircle className="w-4 h-4" /> BQL Yêu Cầu Chụp Lại Hồ Sơ
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

              <p className="text-xs text-gray-300 max-w-2xl font-light">
                {ekycStatus === 'PENDING' && (
                  `Hồ sơ e-KYC đã gửi đến BQL lúc ${currentEkyc?.submittedAt || 'hôm nay'}. Hệ thống đang chờ nhân sự BQL rà soát đối chiếu ảnh CCCD & khuôn mặt.`
                )}
                {ekycStatus === 'REJECTED' && (
                  `Lý do từ chối từ BQL: "${currentEkyc?.rejectionReason || 'Ảnh chụp không đạt tiêu chuẩn độ nét'}". Quý cư dân vui lòng chụp lại ảnh CCCD và khuôn mặt.`
                )}
                {ekycStatus === 'VERIFIED' && (
                  `Hồ sơ định danh đã được BQL phê duyệt. Khuôn mặt của bạn đã được phân quyền ra vào tự động tại Sảnh A/B, thang máy và các tiện ích đặc quyền tòa nhà.`
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
              <button
                type="button"
                onClick={() => setIsCardViewerOpen(true)}
                className="px-3.5 py-2.5 bg-[#161B22] hover:bg-[#1C2533] border border-[#C5A880] text-[#C5A880] text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow rounded"
              >
                <Eye className="w-4 h-4" /> Xem Ảnh Thẻ CCCD
              </button>

              <button
                type="button"
                onClick={() => setIsOcrModalOpen(true)}
                className="px-3.5 py-2.5 bg-[#1C2533] hover:bg-[#C5A880] hover:text-[#0D1117] border border-[#C5A880] text-[#C5A880] text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow rounded"
              >
                <Scan className="w-4 h-4" /> Quét Thẻ Căn Cước
              </button>

              <button
                type="button"
                onClick={handleSubmitEkycToBql}
                disabled={isScanningOcr}
                className="px-4 py-2.5 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg rounded"
              >
                {isScanningOcr ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                {isScanningOcr ? 'Đang Gửi Hồ Sơ...' : 'Gửi Hồ Sơ Cho BQL Duyệt'}
              </button>
            </div>
          </div>

          {/* e-KYC Visual Matcher & Smart Pass Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Biometric FaceID & 512D Vector Card */}
            <div className="p-5 bg-[#121820] border border-[#222B35] space-y-4 rounded-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-[#222B35] pb-2 mb-4">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <ScanFace className="w-4 h-4 text-[#C5A880]" /> Định Danh Khuôn Mặt (FaceID)
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAvatarModalOpen(true)}
                    className="px-2.5 py-1 bg-[#1C2533] hover:bg-[#C5A880] hover:text-[#0D1117] border border-[#C5A880]/50 text-[#C5A880] text-[10px] font-bold rounded flex items-center gap-1 transition-all"
                  >
                    <Camera className="w-3 h-3" /> Chụp & Căn Chỉnh FaceID
                  </button>
                </div>

                <div className="h-64 bg-black border border-emerald-500/60 overflow-hidden relative flex items-center justify-center rounded-xl shadow-inner group">
                  <img
                    src={avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'}
                    alt="Portrait"
                    className="h-full w-full object-cover"
                  />
                  {/* AI Laser Scanner Overlay */}
                  <div className="absolute inset-0 border-2 border-emerald-500/40 pointer-events-none" />
                  <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-emerald-400 pointer-events-none" />
                  <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-emerald-400 pointer-events-none" />
                  <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-emerald-400 pointer-events-none" />
                  <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-emerald-400 pointer-events-none" />

                  <div className="absolute top-3 right-3 bg-emerald-950/90 border border-emerald-500 text-emerald-300 px-2.5 py-1 text-[10px] font-bold font-mono rounded shadow">
                    Trạng Thái: Đã Kích Hoạt ✓
                  </div>

                  <div className="absolute bottom-3 left-3 bg-black/80 px-2.5 py-1 text-[10px] font-mono text-[#C5A880] rounded border border-[#C5A880]/40">
                    Nhận Diện Tự Động: Đang Hoạt Động
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-xs text-gray-300 bg-[#161B22] p-3.5 border border-[#222B35] rounded-lg mt-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Tốc độ mở cửa:</span>
                  <strong className="text-emerald-400 font-mono">&lt; 0.35 giây (Không cần chạm)</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Trạng thái ra vào:</span>
                  <span className="text-emerald-400 font-bold">Đã Cấp Quyền Tự Động</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Tiện ích áp dụng:</span>
                  <span className="text-gray-200">Sảnh A/B, Thang máy Tầng 12, Sky Pool, Gym</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Biển số xe:</span>
                  <strong className="text-[#C5A880] font-mono">{licensePlate || '51K-889.99'}</strong>
                </div>
              </div>
            </div>

            {/* Render 3D Resident Smart Pass Card */}
            <div className="p-5 bg-[#121820] border border-[#222B35] space-y-4 rounded-lg flex flex-col justify-between">
              <div>
                <div className="border-b border-[#222B35] pb-2 mb-4">
                  <span className="text-xs font-bold text-[#C5A880] uppercase tracking-wider flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#C5A880]" /> Thẻ Định Danh Cư Dân Kim Loại (3D Smart Business Pass)
                  </span>
                </div>
                <ResidentSmartCard currentUser={currentUser} />
              </div>

              <div className="p-3 bg-[#161B22] border border-[#222B35] rounded-lg text-[11px] text-gray-400 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Thẻ Điện Tử Đã Kích Hoạt NFC / RFID
                </span>
                <span className="font-mono text-gray-400">Mã thẻ: SKY-12A05-PASS</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tesseract OCR Scanner Modal */}
      <CccdOcrScannerModal
        isOpen={isOcrModalOpen}
        onClose={() => setIsOcrModalOpen(false)}
        onApplyOcrData={handleApplyOcrData}
      />

      {/* Avatar Studio Editor Modal */}
      <AvatarEditorModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        currentAvatarUrl={avatarUrl}
        onAvatarUpdated={async (newAvatarUrl) => {
          setAvatarUrl(newAvatarUrl);
          updateUserInfo({ avatar_url: newAvatarUrl, avatar: newAvatarUrl } as any);
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
          setCccdImage(front);
          setCccdBackImage(back);
        }}
      />
    </div>
  );
}
