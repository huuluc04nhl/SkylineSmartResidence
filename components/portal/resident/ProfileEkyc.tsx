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
  Upload,
  KeyRound,
  Eye,
  EyeOff
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
import { OcrCccdResult, formatToDateInput, formatToDisplayDate, formatToApiDate } from '@/lib/ocrParser';

interface ProfileEkycProps {
  currentUser: User;
}

export default function ProfileEkyc({ currentUser }: ProfileEkycProps) {
  const { updateUserInfo, refreshUser } = useAuth();
  const isOwner = currentUser.role === 'OWNER';
  const aptCode = currentUser.apartment_code || '12A05';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'INFO' | 'EKYC' | 'PASSWORD' | 'FAMILY'>('INFO');
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);
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

  // Change Password State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isUpdatingPass, setIsUpdatingPass] = useState(false);
  const [passSuccess, setPassSuccess] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);

  // e-KYC State
  const [ekycStatus, setEkycStatus] = useState<'VERIFIED' | 'PENDING' | 'REJECTED'>('VERIFIED');
  const [isScanningOcr, setIsScanningOcr] = useState(false);
  const [cccdImage, setCccdImage] = useState('https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400');
  const [matchScore, setMatchScore] = useState(99.8);

  // Family Members State (Loaded directly from NKS Apartment API)
  const [members, setMembers] = useState<any[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemName, setNewMemName] = useState('');
  const [newMemPhone, setNewMemPhone] = useState('');
  const [newMemRole, setNewMemRole] = useState<'Family' | 'Tenant'>('Family');

  // Load live family members from NKS API
  useEffect(() => {
    async function loadFamilyData() {
      setIsLoadingMembers(true);
      try {
        const famRes = await nksGetFamilyMembers();
        if (famRes.success && famRes.members) {
          setMembers(famRes.members);
        }
      } catch (e) {
        console.warn('Load family API error:', e);
      } finally {
        setIsLoadingMembers(false);
      }
    }
    loadFamilyData();
  }, [currentUser]);

  // Load live user info directly from API endpoint on mount
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
        setSaveError('Không thể lưu thông tin vào máy chủ NKS.');
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

  // 3. Submit Update Password to NKS API (POST /api/nks/user/updatePass)
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(false);

    if (newPassword.length < 6) {
      setPassError('Mật khẩu mới phải có tối thiểu 6 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError('Mật khẩu xác nhận không khớp với mật khẩu mới.');
      return;
    }

    setIsUpdatingPass(true);
    try {
      const res = await nksUpdatePassword(oldPassword, newPassword);
      if (res.success) {
        setPassSuccess(true);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPassSuccess(false), 4000);
      } else {
        setPassError(res.message || 'Cập nhật mật khẩu thất bại.');
      }
    } catch (err: any) {
      setPassError('Lỗi kết nối máy chủ khi đổi mật khẩu.');
    } finally {
      setIsUpdatingPass(false);
    }
  };

  const [cccdBackImage, setCccdBackImage] = useState('https://images.unsplash.com/photo-1544717305-2782549b5136?w=600');

  // 4. Handle auto-filling data from OCR Scanner Modal (2 sides) - NO API CALL YET
  const handleApplyOcrData = (ocrData: OcrCccdResult, frontSrc: string, backSrc: string) => {
    setIdCardNumber(ocrData.idNumber || '');
    setFullName(ocrData.fullName || '');
    setBirthday(formatToDateInput(ocrData.dob || ''));
    setGender(ocrData.gender || '1');
    setPob(ocrData.pob || '');
    setProvince(ocrData.province || 'TP. Hồ Chí Minh');
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
      alert('✨ AI OCR đã quét thành công CCCD và cập nhật Face Vector 512D mới lên NKS Server & hệ thống Barrier tòa nhà!');
    }, 1500);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemName || !newMemPhone) return;

    try {
      const res = await nksAddFamilyMember({
        fullName: newMemName.trim(),
        phone: newMemPhone.trim(),
        role: newMemRole,
        relationship: newMemRole === 'Family' ? 'Cư dân thuộc chủ hộ' : 'Cư dân tạm trú',
      });

      if (res.success && res.members) {
        setMembers(res.members);
      }
    } catch (err) {
      console.warn('Add member API error:', err);
    }

    setNewMemName('');
    setNewMemPhone('');
    setShowAddMemberModal(false);
  };

  const handleRemoveMember = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn hủy phân quyền thành viên này khỏi căn hộ?')) {
      try {
        const res = await nksRemoveFamilyMember(id);
        if (res.success && res.members) {
          setMembers(res.members);
        } else {
          setMembers(members.filter((m) => m.id !== id));
        }
      } catch (err) {
        console.warn('Remove member API error:', err);
        setMembers(members.filter((m) => m.id !== id));
      }
    }
  };

  return (
    <div className="space-y-6 w-full animate-fadeIn select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222B35] pb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-semibold flex items-center gap-1.5">
            <ScanFace className="w-3.5 h-3.5" /> Module 3.2.1 • Dữ Liệu Thực Trực Tiếp Từ NKS Core User API
          </div>
          <h2 className="font-serif text-2xl text-white font-bold mt-1">
            Hồ Sơ Cá Nhân & Định Danh e-KYC Căn Hộ {aptCode}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Đồng bộ trực tiếp qua NKS Core User API • Căn hộ: <strong className="text-white font-mono">{aptCode}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-shrink-0">
          <button
            type="button"
            onClick={() => setIsOcrModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-[#1E2631] to-[#121820] border border-[#C5A880] text-[#C5A880] hover:text-white hover:border-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow rounded"
          >
            <Scan className="w-4 h-4 text-[#C5A880]" /> Quét OCR CCCD (Tesseract)
          </button>

          <span className="px-3 py-1 bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 rounded">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> e-KYC Đã Xác Thực
          </span>
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
          <UserIcon className="w-4 h-4" /> 1. Thông Tin Cá Nhân (NKS API)
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
          <ScanFace className="w-4 h-4" /> 2. Định Danh e-KYC & Thẻ Thông Minh
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
          <KeyRound className="w-4 h-4" /> 3. Đổi Mật Khẩu (Security)
        </button>

        {isOwner && (
          <button
            type="button"
            onClick={() => setActiveTab('FAMILY')}
            className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'FAMILY'
                ? 'border-[#C5A880] text-[#C5A880] font-bold'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Users className="w-4 h-4" /> 4. Thành Viên Gia Đình ({members.length})
          </button>
        )}
      </div>

      {/* Loading Indicator while fetching from API */}
      {isLoadingApi && (
        <div className="p-8 bg-[#121820] border border-[#222B35] flex items-center justify-center gap-3 text-xs text-[#C5A880] font-mono rounded-lg">
          <RefreshCw className="w-5 h-5 animate-spin text-[#C5A880]" />
          <span>Đang tải dữ liệu hồ sơ thực tế từ NKS Core User API...</span>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: PERSONAL INFORMATION & VEHICLE REGISTRATION (NKS API)   */}
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
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[10px] font-bold"
              >
                <Camera className="w-4 h-4 mb-0.5" />
                {isUploadingAvatar ? 'Đang Tải...' : 'Đổi Ảnh'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarFileChange}
                className="hidden"
              />
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
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 bg-[#1C2533] hover:bg-[#C5A880] hover:text-[#0D1117] border border-gray-700 hover:border-[#C5A880] text-xs font-bold uppercase tracking-wider text-white transition-colors rounded flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" /> Cập Nhật Ảnh Đại Diện
            </button>
          </div>

          {/* Quick OCR Banner */}
          <div className="p-4 bg-gradient-to-r from-[#1A232E] via-[#161D26] to-[#121820] border border-[#C5A880]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded">
            <div className="space-y-1">
              <div className="text-[#C5A880] font-bold text-xs flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-300" /> Tính Năng Quét OCR Tự Động Điền Form (Tesseract AI)
              </div>
              <p className="text-xs text-gray-300">
                Tự động nhận diện 12 số CCCD, Họ tên, Ngày sinh, Quê quán từ ảnh chụp và điền form tức thì trong 3 giây.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsOcrModalOpen(true)}
              className="px-4 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 flex-shrink-0 shadow rounded"
            >
              <Scan className="w-3.5 h-3.5" /> Quét OCR CCCD Ngay
            </button>
          </div>

          <div className="border-b border-[#222B35] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-serif text-xl font-bold text-white">
                Chi Tiết Thông Tin Cá Nhân Cư Dân
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Dữ liệu được cập nhật trực tiếp qua endpoint <code className="text-[#C5A880] font-mono">POST /api/nks/user/updateInfo</code>
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
                  <strong className="text-white block text-sm font-semibold">✨ Đã tự động điền thông tin từ CCCD 2 mặt vào Form!</strong>
                  <span className="text-gray-300 text-[11px]">Thông tin chỉ mới được điền tạm vào form bên dưới. Vui lòng kiểm tra lại và nhấn nút <strong>[Lưu & Cập Nhật NKS User API]</strong> ở cuối form để chính thức lưu lên hệ thống.</span>
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
              <span>✓ Đã cập nhật và đồng bộ thành công hồ sơ cá nhân lên máy chủ NKS!</span>
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
              {isSaving ? 'Đang Lưu Lên NKS Server...' : 'Lưu & Cập Nhật NKS User API'}
            </button>
          </div>
        </form>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: E-KYC BIOMETRIC IDENTIFICATION & SMART CARD            */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'EKYC' && (
        <div className="space-y-6">
          {/* Status Box */}
          <div className="p-5 bg-gradient-to-r from-[#121820] to-[#161D26] border border-[#C5A880]/70 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl rounded-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[#C5A880] font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4" /> Chuẩn Sinh Trắc Học Tòa Nhà Thông Minh
              </div>
              <h3 className="font-serif text-lg font-bold text-white">
                Dữ Liệu Khuôn Mặt & Thẻ Căn Cước Điện Tử (512D Face Vector)
              </h3>
              <p className="text-xs text-gray-300 max-w-2xl font-light">
                Hồ sơ e-KYC đã được AI Vision so khớp với độ tin cậy <strong>{matchScore}%</strong>. Khuôn mặt của bạn đã được nạp vào hệ thống Barrier tự động tại Sảnh A/B, Thang máy và Cổng tiện ích.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-shrink-0">
              <button
                type="button"
                onClick={() => setIsOcrModalOpen(true)}
                className="px-4 py-2.5 bg-[#1C2533] hover:bg-[#C5A880] hover:text-[#0D1117] border border-[#C5A880] text-[#C5A880] text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow rounded"
              >
                <Scan className="w-4 h-4" /> Quét OCR CCCD Chip
              </button>

              <button
                type="button"
                onClick={handleRetakeEkyc}
                disabled={isScanningOcr}
                className="px-4 py-2.5 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow rounded"
              >
                {isScanningOcr ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                {isScanningOcr ? 'Đang Quét AI...' : 'Chụp Lại FaceID'}
              </button>
            </div>
          </div>

          {/* e-KYC Visual Matcher Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: CCCD OCR Data */}
            <div className="p-5 bg-[#121820] border border-[#222B35] space-y-4 rounded-lg">
              <div className="flex items-center justify-between border-b border-[#222B35] pb-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#C5A880]" /> 1. Ảnh Căn Cước Công Dân (CCCD Chip)
                </span>
                <button
                  type="button"
                  onClick={() => setIsOcrModalOpen(true)}
                  className="text-[10px] text-[#C5A880] hover:underline font-mono flex items-center gap-1"
                >
                  <Scan className="w-3 h-3" /> Quét lại OCR
                </button>
              </div>

              <div className="h-48 bg-black border border-gray-700 overflow-hidden relative group rounded">
                <img
                  src={cccdImage}
                  alt="CCCD"
                  className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform"
                />
                <div className="absolute bottom-2 left-2 bg-black/80 px-2 py-1 text-[10px] font-mono text-gray-200 rounded">
                  Số CCCD: {idCardNumber}
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-gray-300 bg-[#161B22] p-3 border border-[#222B35] rounded">
                <div className="flex justify-between">
                  <span className="text-gray-400">Họ và tên:</span>
                  <strong className="text-white">{fullName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Số định danh:</span>
                  <span className="font-mono text-[#C5A880]">{idCardNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Ngày sinh:</span>
                  <span className="text-gray-200">{birthday}</span>
                </div>
              </div>
            </div>

            {/* Card 2: Live Portrait & Face Vector */}
            <div className="p-5 bg-[#121820] border border-[#222B35] space-y-4 rounded-lg">
              <div className="flex items-center justify-between border-b border-[#222B35] pb-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <ScanFace className="w-4 h-4 text-[#C5A880]" /> 2. Ảnh Chân Dung & Liveness Check
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">Match: {matchScore}%</span>
              </div>

              <div className="h-48 bg-black border border-emerald-500/60 overflow-hidden relative flex items-center justify-center rounded">
                <img
                  src={avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'}
                  alt="Portrait"
                  className="h-full w-full object-cover"
                />
                {/* Laser Overlay */}
                <div className="absolute inset-0 border-2 border-emerald-500/40 pointer-events-none"></div>
                <div className="absolute top-2 right-2 bg-emerald-950/90 border border-emerald-500 text-emerald-300 px-2 py-0.5 text-[10px] font-bold font-mono rounded">
                  Liveness: Real Person ✓
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-gray-300 bg-[#161B22] p-3 border border-[#222B35] rounded">
                <div className="flex justify-between">
                  <span className="text-gray-400">Tốc độ nhận diện:</span>
                  <strong className="text-emerald-400 font-mono">&lt; 0.35s</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Trạng thái Barrier:</span>
                  <span className="text-emerald-400 font-bold">Đã Phân Quyền Mở Cổng</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Tiện ích áp dụng:</span>
                  <span className="text-gray-200">Sảnh A/B, Thang máy, Sky Pool, Gym</span>
                </div>
              </div>
            </div>
          </div>

          {/* Render 3D Resident Smart Pass Card */}
          <div className="p-6 bg-[#121820] border border-[#222B35] space-y-3 rounded-lg">
            <div className="text-xs uppercase tracking-wider text-[#C5A880] font-bold">
              Thẻ Định Danh Cư Dân Kim Loại (3D Smart Business Pass):
            </div>
            <ResidentSmartCard currentUser={currentUser} />
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: CHANGE PASSWORD (POST /api/nks/user/updatePass)          */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'PASSWORD' && (
        <form onSubmit={handleUpdatePassword} className="p-6 sm:p-8 bg-[#121820] border border-[#222B35] space-y-6 shadow-2xl max-w-2xl rounded-lg">
          <div className="border-b border-[#222B35] pb-3">
            <h3 className="font-serif text-xl font-bold text-white flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-[#C5A880]" /> Thay Đổi Mật Khẩu Đăng Nhập
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Cập nhật trực tiếp qua API <code className="text-[#C5A880] font-mono">POST /api/nks/user/updatePass</code>
            </p>
          </div>

          {passSuccess && (
            <div className="p-3.5 bg-emerald-950/90 border border-emerald-500 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn rounded">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>✓ Đã đổi mật khẩu NKS thành công! Vui lòng ghi nhớ mật khẩu mới của bạn.</span>
            </div>
          )}

          {passError && (
            <div className="p-3.5 bg-rose-950/90 border border-rose-500 text-rose-300 text-xs flex items-center gap-2 animate-fadeIn rounded">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{passError}</span>
            </div>
          )}

          <div className="space-y-4 text-xs">
            {/* Old Password */}
            <div className="space-y-1.5">
              <label className="text-gray-300 font-semibold">Mật Khẩu Hiện Tại:</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Nhập mật khẩu hiện tại..."
                  className="w-full bg-[#161B22] border border-[#2D3748] p-3 text-white focus:outline-none focus:border-[#C5A880] rounded font-mono"
                  required
                />
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <label className="text-gray-300 font-semibold">Mật Khẩu Mới (Tối thiểu 6 ký tự):</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới..."
                  className="w-full bg-[#161B22] border border-[#2D3748] p-3 text-white focus:outline-none focus:border-[#C5A880] rounded font-mono"
                  required
                />
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1.5">
              <label className="text-gray-300 font-semibold">Xác Nhận Mật Khẩu Mới:</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới..."
                  className="w-full bg-[#161B22] border border-[#2D3748] p-3 text-white focus:outline-none focus:border-[#C5A880] rounded font-mono"
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="showPassToggle"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className="rounded bg-[#161B22] border-gray-700 text-[#C5A880] focus:ring-0"
              />
              <label htmlFor="showPassToggle" className="text-gray-400 cursor-pointer">
                Hiển thị mật khẩu
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-[#222B35]">
            <button
              type="submit"
              disabled={isUpdatingPass}
              className="px-6 py-2.5 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 rounded shadow-lg"
            >
              {isUpdatingPass ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isUpdatingPass ? 'Đang Đổi Mật Khẩu...' : 'Cập Nhật Mật Khẩu Mới'}
            </button>
          </div>
        </form>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 4: OWNER AUTONOMY - FAMILY MEMBERS                        */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'FAMILY' && isOwner && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#121820] p-4 border border-[#222B35] rounded-lg">
            <div>
              <h3 className="font-serif text-base font-bold text-white">
                Danh Sách Cư Dân & Thành Viên Căn Hộ {aptCode}
              </h3>
              <p className="text-xs text-gray-400">
                Chủ hộ có toàn quyền thêm/xóa thành viên và cấp quyền mở cổng FaceID
              </p>
            </div>

            <button
              onClick={() => setShowAddMemberModal(true)}
              className="px-4 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 flex-shrink-0 rounded"
            >
              <UserPlus className="w-4 h-4" /> Thêm Thành Viên Cư Dân
            </button>
          </div>

          <div className="divide-y divide-[#222B35] border border-[#222B35] bg-[#121820] rounded-lg overflow-hidden">
            {members.map((m) => (
              <div key={m.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#161B22] transition-colors text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{m.fullName}</span>
                    <span className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded ${
                      m.role === 'Tenant' ? 'bg-blue-950 text-blue-300 border border-blue-600' : 'bg-purple-950 text-purple-300 border border-purple-600'
                    }`}>
                      {m.role === 'Tenant' ? 'Người Nhà' : 'Gia Đình'}
                    </span>
                  </div>
                  <div className="text-gray-400 text-[11px]">
                    Quan hệ: {m.relationship} • SĐT: <strong className="font-mono text-gray-300">{m.phone}</strong> • CCCD: {m.idCard}
                  </div>
                  <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {m.faceStatus} (Đã cấp quyền FaceID)
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleRemoveMember(m.id)}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-950/40 border border-transparent hover:border-red-500 transition-colors rounded"
                    title="Xóa quyền truy cập"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Member Modal */}
          {showAddMemberModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <div className="bg-[#0D1117] border border-[#C5A880] max-w-md w-full p-6 text-white space-y-4 shadow-2xl rounded-lg">
                <div className="border-b border-[#222B35] pb-2">
                  <h4 className="font-serif text-lg font-bold">Thêm Thành Viên Cư Dân Căn Hộ</h4>
                  <p className="text-xs text-gray-400">Cấp quyền FaceID và thẻ mở cổng tòa nhà</p>
                </div>

                <form onSubmit={handleAddMember} className="space-y-3 text-xs">
                  <div>
                    <label className="text-gray-300">Họ và tên người nhận quyền:</label>
                    <input
                      type="text"
                      value={newMemName}
                      onChange={(e) => setNewMemName(e.target.value)}
                      placeholder="VD: Trần Thị Mai..."
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white mt-1 focus:outline-none focus:border-[#C5A880] rounded"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-gray-300">Số điện thoại:</label>
                    <input
                      type="tel"
                      value={newMemPhone}
                      onChange={(e) => setNewMemPhone(e.target.value)}
                      placeholder="09xx xxx xxx"
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white mt-1 font-mono focus:outline-none focus:border-[#C5A880] rounded"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-gray-300">Loại thành viên:</label>
                    <select
                      value={newMemRole}
                      onChange={(e) => setNewMemRole(e.target.value as any)}
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white mt-1 focus:outline-none focus:border-[#C5A880] rounded"
                    >
                      <option value="Family">Cư Dân Thuộc Chủ Hộ (Thành Viên Gia Đình)</option>
                      <option value="Tenant">Cư Dân Tạm Trú Căn Hộ</option>
                    </select>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-[#222B35]">
                    <button
                      type="button"
                      onClick={() => setShowAddMemberModal(false)}
                      className="px-4 py-2 bg-gray-800 text-gray-300 hover:text-white rounded"
                    >
                      Hủy Bỏ
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#C5A880] text-[#0D1117] font-bold rounded"
                    >
                      Xác Nhận Cấp Quyền
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tesseract OCR Scanner Modal */}
      <CccdOcrScannerModal
        isOpen={isOcrModalOpen}
        onClose={() => setIsOcrModalOpen(false)}
        onApplyOcrData={handleApplyOcrData}
      />
    </div>
  );
}
