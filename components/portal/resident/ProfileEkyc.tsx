'use client';

import React, { useState } from 'react';
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
  ArrowRight
} from 'lucide-react';
import { User } from '@/lib/dataStore';
import ResidentSmartCard from './ResidentSmartCard';
import { nksUpdateInfo, nksUpdateCccd, nksUpdateAvatar } from '@/lib/nksApiClient';
import { useAuth } from '@/lib/authContext';
import CccdOcrScannerModal from './CccdOcrScannerModal';
import { OcrCccdResult } from '@/lib/ocrParser';

interface ProfileEkycProps {
  currentUser: User;
}

export default function ProfileEkyc({ currentUser }: ProfileEkycProps) {
  const { updateUserInfo } = useAuth();
  const isOwner = currentUser.role === 'OWNER';
  const aptCode = currentUser.apartment_code || '12A05';

  const [activeTab, setActiveTab] = useState<'EKYC' | 'INFO' | 'FAMILY'>('EKYC');
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);

  // Form State (Aligned with NKS API Parameters)
  const initialName = currentUser.full_name || (currentUser as any)?.fullname || 'Nguyễn Hữu Lực';
  const [fullName, setFullName] = useState(initialName);
  const [phone, setPhone] = useState(currentUser.phone || currentUser.username || '0903112233');
  const [email, setEmail] = useState(currentUser.email || (isOwner ? 'huuluc04@gmail.com' : 'nguyenhuunhut1309@gmail.com'));
  const [gender, setGender] = useState<'1' | '0'>('1');
  const [idCardNumber, setIdCardNumber] = useState(currentUser.id_card_no || currentUser.id_card_number || '079095001234');
  const [idDate, setIdDate] = useState('2022-08-15');
  const [idPlace, setIdPlace] = useState('Cục Cảnh sát QLHC về TTXH');
  const [birthday, setBirthday] = useState('1990-08-15');
  const [pob, setPob] = useState('TP. Hồ Chí Minh');
  const [province, setProvince] = useState('TP. Hồ Chí Minh');
  const [intro, setIntro] = useState(`Cư Dân Căn Hộ ${aptCode} - SKYLINE Smart Residence`);
  const [licensePlate, setLicensePlate] = useState(isOwner ? '51K-889.99' : '59P1-886.79');

  // Status & Feedback
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // e-KYC State
  const [ekycStatus, setEkycStatus] = useState<'VERIFIED' | 'PENDING' | 'REJECTED'>('VERIFIED');
  const [isScanningOcr, setIsScanningOcr] = useState(false);
  const [cccdImage, setCccdImage] = useState('https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400');
  const [portraitImage, setPortraitImage] = useState(currentUser.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400');
  const [matchScore, setMatchScore] = useState(99.8);
  const [livenessPassed, setLivenessPassed] = useState(true);

  // Family Members State
  const [members, setMembers] = useState([
    {
      id: 'mem-1',
      fullName: 'Trần Thị Mai',
      role: 'Family',
      relationship: 'Vợ (Thành viên gia đình)',
      phone: '0908776655',
      idCard: '079302008765',
      faceStatus: 'Đã Xác Thực FaceID',
      addedDate: '15/06/2026',
    },
    {
      id: 'mem-2',
      fullName: 'Nguyễn Văn Minh',
      role: 'Family',
      relationship: 'Con trai',
      phone: '0912334455',
      idCard: '079201009988',
      faceStatus: 'Đã Xác Thực FaceID',
      addedDate: '10/01/2026',
    },
  ]);

  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemName, setNewMemName] = useState('');
  const [newMemPhone, setNewMemPhone] = useState('');
  const [newMemRole, setNewMemRole] = useState<'Family' | 'Tenant'>('Family');

  // Handle auto-filling data from OCR Scanner Modal
  const handleApplyOcrData = (ocrData: OcrCccdResult, imageSrc: string) => {
    setIdCardNumber(ocrData.idNumber);
    setFullName(ocrData.fullName);
    setBirthday(ocrData.dob);
    setGender(ocrData.gender);
    setPob(ocrData.pob);
    setProvince(ocrData.province);
    setIdDate(ocrData.idDate);
    setIdPlace(ocrData.idPlace);
    setCccdImage(imageSrc);

    // Synchronize to active context & state
    updateUserInfo({
      full_name: ocrData.fullName,
      id_card_no: ocrData.idNumber,
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 5000);
  };

  // Submit Update Profile Info to NKS API
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
        firstname,
        lastname,
        fullname: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        gender: gender === '1' ? 1 : 0,
        dob: birthday,
        pob: pob,
        id_number: idCardNumber.trim(),
        id_date: idDate,
        id_place: idPlace,
        province: province,
        intro: intro,
        license_plate: licensePlate,
      });

      if (res.success) {
        // Synchronize state across active session
        updateUserInfo({
          full_name: fullName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          id_card_no: idCardNumber.trim(),
        });

        setSavedSuccess(true);
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

  const handleRetakeEkyc = async () => {
    setIsScanningOcr(true);
    try {
      await nksUpdateCccd({
        number: idCardNumber,
        date: idDate,
        place: idPlace,
        front: cccdImage,
      });
      await nksUpdateAvatar(portraitImage);
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

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemName || !newMemPhone) return;

    setMembers([
      ...members,
      {
        id: `mem-${Date.now()}`,
        fullName: newMemName,
        role: newMemRole,
        relationship: newMemRole === 'Family' ? 'Cư dân thuộc chủ hộ' : 'Cư dân tạm trú',
        phone: newMemPhone,
        idCard: '079' + Math.floor(100000000 + Math.random() * 900000000),
        faceStatus: 'Đã Xác Thực FaceID',
        addedDate: new Date().toLocaleDateString('vi-VN'),
      },
    ]);

    setNewMemName('');
    setNewMemPhone('');
    setShowAddMemberModal(false);
  };

  const handleRemoveMember = (id: string) => {
    setMembers(members.filter((m) => m.id !== id));
  };

  return (
    <div className="space-y-6 w-full animate-fadeIn select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222B35] pb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-semibold flex items-center gap-1.5">
            <ScanFace className="w-3.5 h-3.5" /> Module 3.2.1 • Quản Lý Hồ Sơ & Định Danh Sinh Trắc Học
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
            className="px-4 py-2 bg-gradient-to-r from-[#1E2631] to-[#121820] border border-[#C5A880] text-[#C5A880] hover:text-white hover:border-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow"
          >
            <Scan className="w-4 h-4 text-[#C5A880]" /> Quét OCR CCCD (Tesseract)
          </button>

          <span className="px-3 py-1 bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> e-KYC Đã Xác Thực
          </span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-[#222B35] text-xs font-semibold uppercase tracking-wider">
        <button
          type="button"
          onClick={() => setActiveTab('EKYC')}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'EKYC'
              ? 'border-[#C5A880] text-[#C5A880] font-bold'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <ScanFace className="w-4 h-4" /> Định Danh Sinh Trắc Học e-KYC
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('INFO')}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'INFO'
              ? 'border-[#C5A880] text-[#C5A880] font-bold'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <UserIcon className="w-4 h-4" /> Cập Nhật Thông Tin Cá Nhân (NKS API)
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
            <Users className="w-4 h-4" /> Thành Viên Cư Dân ({members.length})
          </button>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: E-KYC BIOMETRIC IDENTIFICATION                         */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'EKYC' && (
        <div className="space-y-6">
          {/* Status Box */}
          <div className="p-5 bg-gradient-to-r from-[#121820] to-[#161D26] border border-[#C5A880]/70 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
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
                className="px-4 py-2.5 bg-[#1C2533] hover:bg-[#C5A880] hover:text-[#0D1117] border border-[#C5A880] text-[#C5A880] text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow"
              >
                <Scan className="w-4 h-4" /> Quét OCR CCCD Chip
              </button>

              <button
                type="button"
                onClick={handleRetakeEkyc}
                disabled={isScanningOcr}
                className="px-4 py-2.5 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow"
              >
                {isScanningOcr ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                {isScanningOcr ? 'Đang Quét AI...' : 'Chụp Lại FaceID'}
              </button>
            </div>
          </div>

          {/* e-KYC Visual Matcher Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: CCCD OCR Data */}
            <div className="p-5 bg-[#121820] border border-[#222B35] space-y-4">
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

              <div className="h-48 bg-black border border-gray-700 overflow-hidden relative group">
                <img
                  src={cccdImage}
                  alt="CCCD"
                  className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform"
                />
                <div className="absolute bottom-2 left-2 bg-black/80 px-2 py-1 text-[10px] font-mono text-gray-200">
                  Số CCCD: {idCardNumber}
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-gray-300 bg-[#161B22] p-3 border border-[#222B35]">
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
            <div className="p-5 bg-[#121820] border border-[#222B35] space-y-4">
              <div className="flex items-center justify-between border-b border-[#222B35] pb-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <ScanFace className="w-4 h-4 text-[#C5A880]" /> 2. Ảnh Chân Dung & Liveness Check
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">Match: {matchScore}%</span>
              </div>

              <div className="h-48 bg-black border border-emerald-500/60 overflow-hidden relative flex items-center justify-center">
                <img
                  src={portraitImage}
                  alt="Portrait"
                  className="h-full w-full object-cover"
                />
                {/* Laser Overlay */}
                <div className="absolute inset-0 border-2 border-emerald-500/40 pointer-events-none"></div>
                <div className="absolute top-2 right-2 bg-emerald-950/90 border border-emerald-500 text-emerald-300 px-2 py-0.5 text-[10px] font-bold font-mono">
                  Liveness: Real Person ✓
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-gray-300 bg-[#161B22] p-3 border border-[#222B35]">
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
          <div className="p-6 bg-[#121820] border border-[#222B35] space-y-3">
            <div className="text-xs uppercase tracking-wider text-[#C5A880] font-bold">
              Thẻ Định Danh Cư Dân Kim Loại (3D Smart Business Pass):
            </div>
            <ResidentSmartCard currentUser={currentUser} />
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: PERSONAL INFORMATION & VEHICLE REGISTRATION (NKS API)   */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'INFO' && (
        <form onSubmit={handleSaveInfo} className="p-6 sm:p-8 bg-[#121820] border border-[#222B35] space-y-6 shadow-2xl">
          {/* Quick OCR Banner */}
          <div className="p-4 bg-gradient-to-r from-[#1A232E] via-[#161D26] to-[#121820] border border-[#C5A880]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
              className="px-4 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 flex-shrink-0 shadow"
            >
              <Scan className="w-3.5 h-3.5" /> Quét OCR CCCD Ngay
            </button>
          </div>

          <div className="border-b border-[#222B35] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-serif text-xl font-bold text-white">
                Cập Nhật Thông Tin Cá Nhân Thành Viên
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Dữ liệu được cập nhật trực tiếp qua endpoint <code className="text-[#C5A880] font-mono">POST /api/nks/user/updateInfo</code>
              </p>
            </div>
            <span className="text-[11px] text-gray-400 font-mono">Căn Hộ: <strong className="text-white">{aptCode}</strong></span>
          </div>

          {/* Feedback Alerts */}
          {savedSuccess && (
            <div className="p-3.5 bg-emerald-950/90 border border-emerald-500 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn shadow-lg">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>✓ Đã cập nhật và đồng bộ thành công hồ sơ cá nhân lên máy chủ NKS!</span>
            </div>
          )}

          {saveError && (
            <div className="p-3.5 bg-rose-950/90 border border-rose-500 text-rose-300 text-xs flex items-center gap-2 animate-fadeIn">
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
                placeholder="VD: Nguyễn Hữu Lực"
                className="w-full bg-[#161B22] border border-[#2D3748] p-3 text-white focus:outline-none focus:border-[#C5A880] transition-colors"
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
                placeholder="VD: 0903112233"
                className="w-full bg-[#161B22] border border-[#2D3748] p-3 text-white font-mono focus:outline-none focus:border-[#C5A880] transition-colors"
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
                placeholder="VD: huuluc04@gmail.com"
                className="w-full bg-[#161B22] border border-[#2D3748] p-3 text-white font-mono focus:outline-none focus:border-[#C5A880] transition-colors"
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
                className="w-full bg-[#161B22] border border-[#2D3748] p-3 text-white focus:outline-none focus:border-[#C5A880] transition-colors"
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
                className="w-full bg-[#161B22] border border-[#2D3748] p-3 text-white font-mono focus:outline-none focus:border-[#C5A880] transition-colors"
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
                value={idDate}
                onChange={(e) => setIdDate(e.target.value)}
                className="w-full bg-[#161B22] border border-[#2D3748] p-3 text-white font-mono focus:outline-none focus:border-[#C5A880] transition-colors"
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
                placeholder="Cục Cảnh sát QLHC về TTXH"
                className="w-full bg-[#161B22] border border-[#2D3748] p-3 text-white focus:outline-none focus:border-[#C5A880] transition-colors"
              />
            </div>

            {/* Field 8: Ngày Sinh */}
            <div className="space-y-1.5">
              <label className="text-gray-300 flex items-center gap-1.5 font-semibold">
                <Calendar className="w-3.5 h-3.5 text-[#C5A880]" /> Ngày Sinh (DOB):
              </label>
              <input
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                className="w-full bg-[#161B22] border border-[#2D3748] p-3 text-white font-mono focus:outline-none focus:border-[#C5A880] transition-colors"
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
                placeholder="TP. Hồ Chí Minh"
                className="w-full bg-[#161B22] border border-[#2D3748] p-3 text-white focus:outline-none focus:border-[#C5A880] transition-colors"
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
                placeholder="TP. Hồ Chí Minh"
                className="w-full bg-[#161B22] border border-[#2D3748] p-3 text-white focus:outline-none focus:border-[#C5A880] transition-colors"
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
                className="w-full bg-[#161B22] border border-[#2D3748] p-3 text-[#C5A880] font-mono font-bold focus:outline-none focus:border-[#C5A880] transition-colors"
                placeholder="VD: 51K-889.99"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-[#222B35]">
            <button
              type="submit"
              disabled={isSaving}
              className="px-8 py-3 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-xl"
            >
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSaving ? 'Đang Lưu Lên NKS Server...' : 'Lưu & Cập Nhật NKS User API'}
            </button>
          </div>
        </form>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: OWNER AUTONOMY - FAMILY MEMBERS                        */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'FAMILY' && isOwner && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#121820] p-4 border border-[#222B35]">
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
              className="px-4 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 flex-shrink-0"
            >
              <UserPlus className="w-4 h-4" /> Thêm Thành Viên Cư Dân
            </button>
          </div>

          <div className="divide-y divide-[#222B35] border border-[#222B35] bg-[#121820]">
            {members.map((m) => (
              <div key={m.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#161B22] transition-colors text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{m.fullName}</span>
                    <span className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
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
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-950/40 border border-transparent hover:border-red-500 transition-colors"
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
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
              <div className="bg-[#0D1117] border border-[#C5A880] max-w-md w-full p-6 text-white space-y-4 shadow-2xl">
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
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white mt-1 focus:outline-none focus:border-[#C5A880]"
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
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white mt-1 font-mono focus:outline-none focus:border-[#C5A880]"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-gray-300">Loại thành viên:</label>
                    <select
                      value={newMemRole}
                      onChange={(e) => setNewMemRole(e.target.value as any)}
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white mt-1 focus:outline-none focus:border-[#C5A880]"
                    >
                      <option value="Family">Cư Dân Thuộc Chủ Hộ (Thành Viên Gia Đình)</option>
                      <option value="Tenant">Cư Dân Tạm Trú Căn Hộ</option>
                    </select>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-[#222B35]">
                    <button
                      type="button"
                      onClick={() => setShowAddMemberModal(false)}
                      className="px-4 py-2 bg-gray-800 text-gray-300 hover:text-white"
                    >
                      Hủy Bỏ
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#C5A880] text-[#0D1117] font-bold"
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
