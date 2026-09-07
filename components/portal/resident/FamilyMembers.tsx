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
  RotateCcw
} from 'lucide-react';
import { User as UserType } from '@/lib/dataStore';
import { 
  nksGetFamilyMembers, 
  nksAddFamilyMember, 
  nksRemoveFamilyMember, 
  nksSearchFamilyAccount 
} from '@/lib/nksApiClient';
import { 
  getEkycForUser, 
  submitEkycRequest, 
  EkycRequest 
} from '@/lib/ekycStore';

export interface FamilyMemberItem {
  id: string;
  fullName: string;
  phone: string;
  role: 'Family' | 'Tenant';
  relationship: string;
  idCard?: string;
  licensePlate?: string;
  avatarUrl?: string;
  username?: string;
  faceStatus?: string;
  addedDate?: string;
}

export interface BqlEligibleAccount {
  id: string;
  username: string;
  fullName: string;
  phone: string;
  idCard: string;
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
  const aptCode = currentUser.apartment_code || '12A05';
  const isOwner = currentUser.role === 'OWNER';
  const ownerName = currentUser.full_name || 'Nguyễn Hữu Lực';

  const [members, setMembers] = useState<FamilyMemberItem[]>([]);
  const [bqlAccounts, setBqlAccounts] = useState<BqlEligibleAccount[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Add Member Modal State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'PRE_APPROVED' | 'SEARCH_API'>('PRE_APPROVED');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Selected Account from API
  const [selectedAccount, setSelectedAccount] = useState<BqlEligibleAccount | null>(null);
  const [newRelationship, setNewRelationship] = useState<string>('Vợ / Chồng');
  const [newLicensePlate, setNewLicensePlate] = useState<string>('');

  // Live API Search State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchingApi, setIsSearchingApi] = useState<boolean>(false);
  const [searchResult, setSearchResult] = useState<BqlEligibleAccount | null>(null);
  const [searchNotFound, setSearchNotFound] = useState<string | null>(null);

  // =========================================================================
  // OWNER PROXY e-KYC MODAL STATE (Chủ hộ kê khai hồ sơ cho người nhà)
  // =========================================================================
  const [showEkycModal, setShowEkycModal] = useState<boolean>(false);
  const [ekycTargetMember, setEkycTargetMember] = useState<FamilyMemberItem | null>(null);
  const [ekycFullName, setEkycFullName] = useState<string>('');
  const [ekycRelationship, setEkycRelationship] = useState<string>('Vợ / Chồng');
  const [ekycPhone, setEkycPhone] = useState<string>('');
  const [ekycIdCard, setEkycIdCard] = useState<string>('');
  const [ekycDob, setEkycDob] = useState<string>('2004-09-02');
  const [ekycPob, setEkycPob] = useState<string>('TP. Hồ Chí Minh');
  const [ekycIdDate, setEkycIdDate] = useState<string>('2022-08-15');
  const [ekycIdPlace, setEkycIdPlace] = useState<string>('Cục Cảnh sát QLHC về TTXH');
  const [ekycLicensePlate, setEkycLicensePlate] = useState<string>('');
  const [ekycAvatarUrl, setEkycAvatarUrl] = useState<string>('');
  const [ekycFrontImage, setEkycFrontImage] = useState<string>('');
  const [ekycBackImage, setEkycBackImage] = useState<string>('');
  const [isSubmittingEkyc, setIsSubmittingEkyc] = useState<boolean>(false);
  const [ekycModalError, setEkycModalError] = useState<string | null>(null);

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
  const getMemberStatus = (m: FamilyMemberItem): 'APPROVED' | 'PENDING' | 'REJECTED' | 'NOT_SUBMITTED' => {
    const ekyc = getMemberEkyc(m);
    if (ekyc?.status === 'APPROVED' || ekyc?.status === 'VERIFIED') return 'APPROVED';
    if (ekyc?.status === 'PENDING') return 'PENDING';
    if (ekyc?.status === 'REJECTED') return 'REJECTED';
    if (m.faceStatus?.includes('Chờ')) return 'PENDING';
    if (m.faceStatus?.includes('Kích Hoạt') || m.faceStatus?.includes('Đã kích hoạt')) return 'APPROVED';
    if (m.faceStatus?.includes('Từ Chối') || m.faceStatus?.includes('Chụp Lại')) return 'REJECTED';
    return 'NOT_SUBMITTED';
  };

  // Load Family Members & Pre-verified API Accounts
  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const res = await nksGetFamilyMembers();
      if (res.success && res.members) {
        setMembers(res.members);
      }
      if (res.bqlAccounts) {
        setBqlAccounts(res.bqlAccounts);
      }
    } catch (err) {
      console.warn('Load family API error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();

    // Listen to real-time e-KYC changes (when BQL approves/rejects)
    const handleEkycUpdated = () => {
      fetchMembers();
    };
    window.addEventListener('skyline_ekyc_updated', handleEkycUpdated);
    return () => window.removeEventListener('skyline_ekyc_updated', handleEkycUpdated);
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

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setter(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // =========================================================================
  // MODAL OPEN / CLOSE HANDLERS
  // =========================================================================
  const handleOpenEkycModal = (member: FamilyMemberItem) => {
    const existing = getMemberEkyc(member);
    setEkycTargetMember(member);
    setEkycFullName(existing?.fullName || member.fullName || '');
    setEkycRelationship(member.relationship || 'Vợ / Chồng');
    setEkycPhone(existing?.phone || member.phone || '');
    setEkycIdCard(existing?.idCardNo || member.idCard || '');
    setEkycDob(existing?.dob || '2004-09-02');
    setEkycPob(existing?.pob || 'TP. Hồ Chí Minh');
    setEkycIdDate(existing?.idDate || '2022-08-15');
    setEkycIdPlace(existing?.idPlace || 'Cục Cảnh sát QLHC về TTXH');
    setEkycLicensePlate(member.licensePlate || '');
    setEkycAvatarUrl(
      existing?.avatarUrl ||
        member.avatarUrl ||
        'https://data.nks.vn/storage/users/default.png'
    );
    setEkycFrontImage(
      existing?.idCardFrontUrl ||
        'https://images.unsplash.com/photo-1578852612716-854e527abf2e?w=600'
    );
    setEkycBackImage(
      existing?.idCardBackUrl ||
        'https://images.unsplash.com/photo-1578852612716-854e527abf2e?w=600'
    );
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
    if (!ekycPhone.trim()) {
      setEkycModalError('Vui lòng nhập số điện thoại liên hệ của người nhà.');
      return;
    }
    if (!ekycIdCard.trim() || ekycIdCard.trim().length < 9) {
      setEkycModalError('Số CCCD không hợp lệ (yêu cầu từ 9 đến 12 chữ số).');
      return;
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
        faceScore: 98.6,
      };

      // 1. Submit to local e-KYC Store
      submitEkycRequest(payload);

      // 2. Submit to Server API
      try {
        await fetch('/api/nks/ekyc', {
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
        `✓ Đã gửi hồ sơ e-KYC & FaceID của người nhà "${ekycFullName}" lên Ban Quản Lý thành công! Hồ sơ đang chờ BQL thẩm định.`
      );
      setTimeout(() => setActionSuccess(null), 5000);

      handleCloseEkycModal();
      fetchMembers();
    } catch (err: any) {
      setEkycModalError(err.message || 'Lỗi khi gửi hồ sơ e-KYC lên BQL.');
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

  // Search account via live API
  const handleSearchApi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearchingApi(true);
    setSearchNotFound(null);
    setSearchResult(null);
    setActionError(null);

    try {
      const res = await nksSearchFamilyAccount(searchQuery.trim());
      if (res.success && res.found && res.account) {
        setSearchResult(res.account);
      } else {
        setSearchNotFound(
          res.message ||
            `Không tìm thấy tài khoản nào khớp với "${searchQuery}" trên hệ thống API.`
        );
      }
    } catch (err) {
      setSearchNotFound('Lỗi kết nối khi tra cứu API người dùng.');
    } finally {
      setIsSearchingApi(false);
    }
  };

  // Submit Add Member strictly via API
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) {
      setActionError('Vui lòng chọn hoặc tra cứu một tài khoản hợp lệ từ hệ thống API.');
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
      });

      if (res.success && res.members) {
        setMembers(res.members);
        setShowAddModal(false);
        setActionSuccess(
          `✓ Đã thêm thành viên "${selectedAccount.fullName}" vào Căn hộ ${aptCode} theo hồ sơ API thành công!`
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
        setActionError(res.message || 'Không thể thêm thành viên. Vui lòng thử lại.');
      }
    } catch (err: any) {
      setActionError(err.message || 'Lỗi kết nối API khi thêm thành viên.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Remove Member
  const handleRemoveMember = async (id: string, name: string) => {
    if (
      !confirm(
        `Bạn có chắc muốn hủy phân quyền và xóa thành viên "${name}" khỏi căn hộ ${aptCode}?`
      )
    ) {
      return;
    }

    try {
      const res = await nksRemoveFamilyMember(id);
      if (res.success) {
        setMembers((prev) => prev.filter((m) => m.id !== id));
        setActionSuccess(`✓ Đã hủy phân quyền thành viên "${name}".`);
        setTimeout(() => setActionSuccess(null), 3000);
        fetchMembers();
      } else {
        alert(res.message || 'Không thể xóa thành viên.');
      }
    } catch (err) {
      alert('Lỗi kết nối khi xóa thành viên.');
    }
  };

  // Aggregate metrics correctly using unified helper
  const totalApproved = members.filter((m) => getMemberStatus(m) === 'APPROVED').length;
  const totalPending = members.filter((m) => getMemberStatus(m) === 'PENDING').length;

  return (
    <div className="space-y-6 w-full animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222B35] pb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-semibold flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> Quyền Quản Trị Căn Hộ • Ban Quản Lý & Chủ Hộ
          </div>
          <h2 className="font-serif text-2xl text-white font-bold mt-1">
            Quản Lý Cư Dân & Thành Viên Căn Hộ {aptCode}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Căn hộ: <strong className="text-white font-mono">{aptCode}</strong> • Chủ hộ{' '}
            <strong className="text-[#C5A880]">{ownerName}</strong> trực tiếp kê khai, nộp e-KYC và bảo lãnh FaceID cho người nhà
          </p>
        </div>

        {isOwner && (
          <button
            type="button"
            onClick={() => {
              setShowAddModal(true);
              setSelectedAccount(null);
              setSearchResult(null);
              setActionError(null);
            }}
            className="px-5 py-2.5 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 rounded-lg shadow-lg flex-shrink-0 cursor-pointer active:scale-95"
          >
            <UserPlus className="w-4 h-4" /> Thêm Thành Viên Mới
          </button>
        )}
      </div>

      {/* Success Alerts */}
      {actionSuccess && (
        <div className="p-3.5 bg-emerald-950/90 border border-emerald-500 text-emerald-300 text-xs flex items-center gap-2 rounded-lg animate-fadeIn shadow-lg">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
          <span className="font-medium">{actionSuccess}</span>
        </div>
      )}

      {/* Overview Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-[#121820] border border-[#222B35] rounded-xl">
          <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
            Thành Viên Đang Cư Trú
          </div>
          <div className="text-2xl font-bold font-serif text-white mt-1 flex items-baseline gap-2">
            <span>{members.length}</span>
            <span className="text-xs text-gray-400 font-normal">/ 6 người tối đa</span>
          </div>
        </div>

        <div className="p-4 bg-[#121820] border border-[#222B35] rounded-xl">
          <div className="text-[10px] uppercase tracking-wider text-emerald-300 font-semibold">
            Đã Kích Hoạt FaceID
          </div>
          <div className="text-2xl font-bold font-serif text-emerald-400 mt-1">
            {totalApproved} người
          </div>
        </div>

        <div className="p-4 bg-[#121820] border border-[#222B35] rounded-xl">
          <div className="text-[10px] uppercase tracking-wider text-amber-300 font-semibold">
            Chờ BQL Thẩm Định e-KYC
          </div>
          <div className="text-2xl font-bold font-serif text-amber-400 mt-1">
            {totalPending} hồ sơ
          </div>
        </div>

        <div className="p-4 bg-[#121820] border border-[#222B35] rounded-xl">
          <div className="text-[10px] uppercase tracking-wider text-cyan-300 font-semibold">
            Phương Tiện Đăng Ký
          </div>
          <div className="text-2xl font-bold font-serif text-cyan-400 mt-1">
            {members.filter((m) => m.licensePlate).length} xe
          </div>
        </div>
      </div>

      {/* Members List */}
      <div className="bg-[#121820] border border-[#222B35] rounded-xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-[#222B35] flex items-center justify-between">
          <div className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-[#C5A880]" /> Danh Sách Người Nhà Căn Hộ ({members.length})
          </div>
          <button
            onClick={fetchMembers}
            disabled={isLoading}
            className="text-xs text-gray-400 hover:text-[#C5A880] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Làm mới
          </button>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xs text-[#C5A880] font-mono flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" /> Đang tải danh sách thành viên...
          </div>
        ) : members.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-xs space-y-2">
            <Users className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p>Chưa có thành viên nào được thêm vào Căn hộ {aptCode}.</p>
            {isOwner && (
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="text-[#C5A880] font-bold underline hover:text-white cursor-pointer"
              >
                + Thêm thành viên đầu tiên
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-[#222B35]">
            {members.map((m) => {
              const ekyc = getMemberEkyc(m);
              const ekycStatus = getMemberStatus(m);

              const avatarSrc =
                ekyc?.avatarUrl ||
                (m.avatarUrl
                  ? m.avatarUrl.replace('data.nks.vn//', 'data.nks.vn/')
                  : 'https://data.nks.vn/storage/users/default.png');

              return (
                <div
                  key={m.id}
                  className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#161B22] transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-4 min-w-0">
                    {/* Member Avatar: Strictly constrained width & height */}
                    <div className="w-14 h-14 min-w-[56px] min-h-[56px] rounded-full overflow-hidden border-2 border-[#C5A880]/70 shadow-md bg-[#161D26] flex-shrink-0">
                      <img
                        src={avatarSrc}
                        alt={m.fullName}
                        onError={(e) => {
                          e.currentTarget.src = 'https://data.nks.vn/storage/users/default.png';
                        }}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-base truncate">
                          {m.fullName}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded border bg-purple-950/80 text-purple-300 border-purple-600/60 flex-shrink-0">
                          {m.relationship || 'Người Nhà / Gia Đình'}
                        </span>

                        {/* e-KYC Status Badges */}
                        {ekycStatus === 'APPROVED' && (
                          <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border bg-emerald-950/90 text-emerald-300 border-emerald-500/80 flex items-center gap-1 shadow-sm flex-shrink-0">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Đã Kích Hoạt FaceID
                          </span>
                        )}
                        {ekycStatus === 'PENDING' && (
                          <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border bg-amber-950/90 text-amber-300 border-amber-500/80 flex items-center gap-1 shadow-sm animate-pulse flex-shrink-0">
                            <Clock className="w-3 h-3 text-amber-400" /> Đang Chờ BQL Phê Duyệt
                          </span>
                        )}
                        {ekycStatus === 'REJECTED' && (
                          <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border bg-rose-950/90 text-rose-300 border-rose-500/80 flex items-center gap-1 shadow-sm flex-shrink-0">
                            <XCircle className="w-3 h-3 text-rose-400" /> BQL Yêu Cầu Chụp Lại
                          </span>
                        )}
                        {ekycStatus === 'NOT_SUBMITTED' && (
                          <span className="px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider rounded border bg-gray-800 text-gray-300 border-gray-600 flex items-center gap-1 flex-shrink-0">
                            <AlertCircle className="w-3 h-3 text-gray-400" /> Chưa Khai Báo e-KYC
                          </span>
                        )}
                      </div>

                      <div className="text-gray-400 text-xs flex flex-wrap items-center gap-x-3 gap-y-1">
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
                            • Biển số xe: <strong className="font-mono text-cyan-400">{m.licensePlate}</strong>
                          </span>
                        )}
                      </div>

                      {/* Rejection Notice if any */}
                      {ekycStatus === 'REJECTED' && ekyc?.rejectionReason && (
                        <div className="p-2 bg-rose-950/50 border border-rose-800/80 rounded-lg text-[11px] text-rose-300 flex items-start gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 mt-0.5" />
                          <span>
                            <strong>Lý do từ BQL:</strong> {ekyc.rejectionReason}
                          </span>
                        </div>
                      )}

                      {/* Privilege description */}
                      <div className="text-[11px] text-gray-400 flex items-center gap-1.5 pt-0.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#C5A880] flex-shrink-0" />
                        <span className="truncate">
                          Phân quyền: Sảnh A/B • Thang máy Tầng 12 • Hầm gửi xe B1/B2
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions for Owner */}
                  <div className="flex items-center gap-2.5 w-full md:w-auto justify-start md:justify-end pt-2 md:pt-0 border-t md:border-t-0 border-[#222B35]/60 flex-shrink-0">
                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => handleOpenEkycModal(m)}
                        className={`px-3.5 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shadow cursor-pointer active:scale-95 ${
                          ekycStatus === 'APPROVED'
                            ? 'bg-[#161D26] hover:bg-[#1F2937] border border-[#C5A880]/80 text-[#C5A880]'
                            : ekycStatus === 'PENDING'
                            ? 'bg-amber-950/80 hover:bg-amber-900 border border-amber-500/80 text-amber-300'
                            : ekycStatus === 'REJECTED'
                            ? 'bg-rose-950 hover:bg-rose-900 border border-rose-500 text-rose-200 animate-pulse'
                            : 'bg-[#C5A880] hover:bg-white text-[#0D1117]'
                        }`}
                      >
                        <ScanFace className="w-4 h-4" />
                        <span>
                          {ekycStatus === 'APPROVED'
                            ? 'Cập Nhật e-KYC'
                            : ekycStatus === 'PENDING'
                            ? 'Xem / Sửa e-KYC'
                            : ekycStatus === 'REJECTED'
                            ? 'Chụp Lại e-KYC'
                            : 'Khai Báo e-KYC Gửi BQL'}
                        </span>
                      </button>
                    )}

                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(m.id, m.fullName)}
                        className="px-3 py-2 text-xs text-rose-400 hover:text-white hover:bg-rose-950/60 border border-rose-900/60 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                        title="Hủy quyền thành viên"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Hủy Quyền
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
          <div className="bg-[#0D1117] border border-[#C5A880]/80 max-w-3xl w-full p-5 sm:p-7 text-white space-y-5 shadow-2xl rounded-2xl max-h-[92vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#222B35] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#C5A880]/15 border border-[#C5A880] flex items-center justify-center text-[#C5A880] flex-shrink-0">
                  <ScanFace className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                    Khai Báo & Cập Nhật Hồ Sơ e-KYC Cho Người Nhà
                  </h3>
                  <p className="text-xs text-gray-400">
                    Căn Hộ <strong className="text-white font-mono">{aptCode}</strong> • Chủ hộ{' '}
                    <strong className="text-[#C5A880]">{ownerName}</strong> đại diện bảo lãnh
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseEkycModal}
                className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-[#161D26] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Legal Representation Guarantee Box */}
            <div className="p-3.5 bg-gradient-to-r from-[#1A1810] to-[#121820] border border-[#C5A880]/60 rounded-xl text-xs text-gray-300 space-y-1">
              <div className="font-bold text-[#C5A880] flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                <ShieldCheck className="w-4 h-4 text-[#C5A880]" /> Cam Kết Bảo Lãnh Của Chủ Hộ
              </div>
              <p className="leading-relaxed text-gray-300">
                Chủ hộ <strong className="text-white">{ownerName}</strong> đại diện pháp lý Căn hộ{' '}
                <strong className="text-white font-mono">{aptCode}</strong> chịu trách nhiệm kê khai đúng thông tin pháp lý, ảnh CCCD và sinh trắc học khuôn mặt của thành viên{' '}
                <strong className="text-white">{ekycFullName || ekycTargetMember.fullName}</strong> để Ban Quản Lý (BQL) phê duyệt và kích hoạt quyền FaceID ra vào tòa nhà.
              </p>
            </div>

            {/* Error Message */}
            {ekycModalError && (
              <div className="p-3 bg-rose-950/80 border border-rose-500 text-rose-200 text-xs flex items-center gap-2 rounded-lg">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{ekycModalError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmitMemberEkyc} className="space-y-5 text-xs">
              
              {/* SECTION 1: THÔNG TIN PHÁP LÝ NHÂN THÂN */}
              <div className="space-y-3 p-4 bg-[#121820] border border-[#222B35] rounded-xl">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#C5A880] flex items-center gap-2">
                  <User className="w-4 h-4" /> 1. Thông Tin Pháp Lý Của Người Nhà
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
                      placeholder="VD: Nguyễn Hữu Nhựt"
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white rounded-lg focus:border-[#C5A880] outline-none font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-gray-300 font-semibold block mb-1">
                      Mối Quan Hệ Với Chủ Hộ: *
                    </label>
                    <select
                      value={ekycRelationship}
                      onChange={(e) => setEkycRelationship(e.target.value)}
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white rounded-lg focus:border-[#C5A880] outline-none"
                    >
                      <option value="Vợ / Chồng">Vợ / Chồng</option>
                      <option value="Con Cái">Con Cái</option>
                      <option value="Bố / Mẹ">Bố / Mẹ</option>
                      <option value="Anh / Chị / Em">Anh / Chị / Em</option>
                      <option value="Người Thân Cùng Căn Hộ">Người Thân Cùng Căn Hộ</option>
                      <option value="Khách Thuê Căn Hộ">Khách Thuê Căn Hộ</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-gray-300 font-semibold block mb-1">
                      Số Điện Thoại Liên Hệ: *
                    </label>
                    <input
                      type="tel"
                      required
                      value={ekycPhone}
                      onChange={(e) => setEkycPhone(e.target.value)}
                      placeholder="0917795211"
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white font-mono rounded-lg focus:border-[#C5A880] outline-none"
                    />
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
                      onChange={(e) => setEkycIdCard(e.target.value)}
                      placeholder="VD: 079198005678"
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-[#C5A880] font-mono font-bold rounded-lg focus:border-[#C5A880] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-gray-300 font-semibold block mb-1">
                      Ngày Sinh:
                    </label>
                    <input
                      type="date"
                      value={ekycDob}
                      onChange={(e) => setEkycDob(e.target.value)}
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white rounded-lg focus:border-[#C5A880] outline-none font-mono"
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
                      placeholder="TP. Hồ Chí Minh"
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white rounded-lg focus:border-[#C5A880] outline-none"
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
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white rounded-lg focus:border-[#C5A880] outline-none font-mono"
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
                      placeholder="VD: 59P1-886.79"
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-cyan-300 font-mono rounded-lg focus:border-[#C5A880] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: ẢNH CHÂN DUNG FACEID & CCCD 2 MẶT */}
              <div className="space-y-4 p-4 bg-[#121820] border border-[#222B35] rounded-xl">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#C5A880] flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <ScanFace className="w-4 h-4" /> 2. Ảnh Chân Dung FaceID & CCCD 2 Mặt Gửi BQL
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    Độ khớp AI: 98.6% (Đạt tiêu chuẩn)
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Photo 1: Chân Dung FaceID */}
                  <div className="p-3 bg-[#161D26] border border-[#2D3748] rounded-xl space-y-2.5 flex flex-col justify-between">
                    <div>
                      <div className="font-bold text-white flex items-center justify-between">
                        <span>Chân Dung FaceID</span>
                        <span className="text-[10px] text-[#C5A880]">Khuôn mặt</span>
                      </div>
                      <p className="text-[10.5px] text-gray-400 mt-0.5">
                        Chụp thẳng mặt, rõ nét, không đeo kính râm hay khẩu trang.
                      </p>
                    </div>

                    {/* Camera or Image Preview */}
                    <div className="relative w-full h-44 bg-[#0D1117] rounded-lg border border-gray-700 overflow-hidden flex items-center justify-center">
                      {isCameraActive ? (
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          src={ekycAvatarUrl || 'https://data.nks.vn/storage/users/default.png'}
                          alt="FaceID Avatar"
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>

                    <div className="space-y-1.5">
                      {isCameraActive ? (
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={captureCamera}
                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Camera className="w-3.5 h-3.5" /> Chụp Ngay
                          </button>
                          <button
                            type="button"
                            onClick={stopCamera}
                            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg cursor-pointer"
                          >
                            Hủy
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={startCamera}
                            className="flex-1 py-2 bg-[#1C2533] hover:bg-[#253245] border border-[#C5A880]/70 text-[#C5A880] font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Camera className="w-3.5 h-3.5" /> Camera
                          </button>
                          <button
                            type="button"
                            onClick={() => fileInputAvatarRef.current?.click()}
                            className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer"
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
                      )}
                    </div>
                  </div>

                  {/* Photo 2: CCCD Mặt Trước */}
                  <div className="p-3 bg-[#161D26] border border-[#2D3748] rounded-xl space-y-2.5 flex flex-col justify-between">
                    <div>
                      <div className="font-bold text-white flex items-center justify-between">
                        <span>CCCD Mặt Trước</span>
                        <span className="text-[10px] text-cyan-400">Mặt có ảnh</span>
                      </div>
                      <p className="text-[10.5px] text-gray-400 mt-0.5">
                        Chụp đủ 4 góc thẻ, không lóa sáng hoặc mất góc.
                      </p>
                    </div>

                    <div className="relative w-full h-44 bg-[#0D1117] rounded-lg border border-gray-700 overflow-hidden flex items-center justify-center">
                      <img
                        src={
                          ekycFrontImage ||
                          'https://images.unsplash.com/photo-1578852612716-854e527abf2e?w=600'
                        }
                        alt="CCCD Mặt Trước"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={() => fileInputFrontRef.current?.click()}
                        className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" /> Tải Lên Mặt Trước
                      </button>
                      <input
                        ref={fileInputFrontRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, setEkycFrontImage)}
                      />
                    </div>
                  </div>

                  {/* Photo 3: CCCD Mặt Sau */}
                  <div className="p-3 bg-[#161D26] border border-[#2D3748] rounded-xl space-y-2.5 flex flex-col justify-between">
                    <div>
                      <div className="font-bold text-white flex items-center justify-between">
                        <span>CCCD Mặt Sau</span>
                        <span className="text-[10px] text-purple-400">Chip & Vân tay</span>
                      </div>
                      <p className="text-[10.5px] text-gray-400 mt-0.5">
                        Chụp rõ chip điện tử, mã QR và ngày cấp.
                      </p>
                    </div>

                    <div className="relative w-full h-44 bg-[#0D1117] rounded-lg border border-gray-700 overflow-hidden flex items-center justify-center">
                      <img
                        src={
                          ekycBackImage ||
                          'https://images.unsplash.com/photo-1578852612716-854e527abf2e?w=600'
                        }
                        alt="CCCD Mặt Sau"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={() => fileInputBackRef.current?.click()}
                        className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" /> Tải Lên Mặt Sau
                      </button>
                      <input
                        ref={fileInputBackRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, setEkycBackImage)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#222B35]">
                <div className="text-[11px] text-gray-400">
                  Hồ sơ sẽ được chuyển tới Bàn Thẩm Định e-KYC của Ban Quản Lý ngay lập tức.
                </div>

                <div className="flex items-center gap-2.5 justify-end">
                  <button
                    type="button"
                    onClick={handleCloseEkycModal}
                    className="px-4 py-2.5 bg-transparent hover:bg-[#161D26] text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                  >
                    Đóng
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmittingEkyc}
                    className="px-6 py-2.5 bg-[#C5A880] hover:bg-white text-[#0D1117] font-bold text-xs uppercase tracking-wider rounded-lg shadow-xl transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    {isSubmittingEkyc ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Đang Gửi Lên BQL...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" /> Gửi BQL Phê Duyệt & Kích Hoạt FaceID
                      </>
                    )}
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: THÊM THÀNH VIÊN THEO DỮ LIỆU API                              */}
      {/* =================================================================== */}
      {showAddModal && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fadeIn"
        >
          <div className="bg-[#0D1117] border border-[#C5A880]/70 max-w-2xl w-full p-5 sm:p-6 text-white space-y-4 shadow-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#222B35] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#C5A880]/20 flex items-center justify-center text-[#C5A880]">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-serif font-bold text-white">
                    Thêm Cư Dân Vào Căn Hộ {aptCode}
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Liên kết tài khoản người nhà từ hệ thống định danh API Ban Quản Lý
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-[#161D26] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error / Alert */}
            {actionError && (
              <div className="p-3 bg-rose-950/80 border border-rose-500 text-rose-200 text-xs flex items-center gap-2 rounded-lg">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {/* Tab Selector Mode */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#161B22] border border-[#222B35] rounded-lg text-xs">
              <button
                type="button"
                onClick={() => {
                  setModalMode('PRE_APPROVED');
                  setSelectedAccount(null);
                  setActionError(null);
                }}
                className={`py-2 px-3 rounded-md font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  modalMode === 'PRE_APPROVED'
                    ? 'bg-[#C5A880] text-[#0D1117] shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" /> 1. Tài Khoản Khả Dụng ({bqlAccounts.length})
              </button>

              <button
                type="button"
                onClick={() => {
                  setModalMode('SEARCH_API');
                  setSelectedAccount(null);
                  setActionError(null);
                }}
                className={`py-2 px-3 rounded-md font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  modalMode === 'SEARCH_API'
                    ? 'bg-[#C5A880] text-[#0D1117] shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Search className="w-3.5 h-3.5" /> 2. Tra Cứu Theo SĐT / CCCD
              </button>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* MODE 1: CHỌN TỪ DANH SÁCH TÀI KHOẢN KHẢ DỤNG                   */}
            {/* ------------------------------------------------------------- */}
            {modalMode === 'PRE_APPROVED' && (
              <div className="space-y-2.5">
                <div className="text-[11px] text-gray-400">
                  Danh sách tài khoản đã được Ban Quản Lý phê duyệt trước cho Căn hộ {aptCode}:
                </div>

                {bqlAccounts.length === 0 ? (
                  <div className="p-6 bg-[#161D26] border border-[#222B35] rounded-lg text-center text-xs text-gray-400">
                    Không có tài khoản người nhà nào đang chờ thêm. Bạn có thể tra cứu SĐT qua tab &quot;Tra Cứu&quot;.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {bqlAccounts.map((acc) => {
                      const isAlreadyInUnit = members.some(
                        (m) => m.id === acc.id || m.phone === acc.phone || m.username === acc.username
                      );
                      const isSelected = selectedAccount?.id === acc.id;

                      return (
                        <div
                          key={acc.id}
                          onClick={() => !isAlreadyInUnit && handleSelectPreApproved(acc)}
                          className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                            isAlreadyInUnit
                              ? 'bg-[#161D26]/40 border-gray-800 opacity-60 cursor-not-allowed'
                              : isSelected
                              ? 'bg-[#1C2533] border-[#C5A880] shadow-md cursor-pointer'
                              : 'bg-[#161D26] border-[#222B35] hover:border-gray-600 cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full overflow-hidden border border-[#C5A880]/60 flex-shrink-0 bg-[#0D1117]">
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
                              <div className="font-bold text-white text-xs flex items-center gap-2">
                                <span className="truncate">{acc.fullName}</span>
                                {isAlreadyInUnit && (
                                  <span className="text-[9px] px-1.5 py-0.5 bg-gray-800 text-gray-400 rounded flex-shrink-0">
                                    Đã có trong căn hộ
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-gray-400 flex items-center gap-2 font-mono">
                                <span>SĐT: {acc.phone}</span>
                                <span>• CCCD: {acc.idCard}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex-shrink-0">
                            {isAlreadyInUnit ? (
                              <span className="text-[10px] text-gray-500 italic">Đã kích hoạt</span>
                            ) : isSelected ? (
                              <span className="px-2.5 py-1 bg-[#C5A880] text-[#0D1117] text-[10px] font-bold rounded flex items-center gap-1">
                                <Check className="w-3 h-3" /> Đang chọn
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-[10px] font-semibold rounded">
                                Chọn tài khoản
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

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
                    placeholder="Nhập SĐT hoặc CCCD người nhà (VD: 0908776655)..."
                    className="flex-1 bg-[#161B22] border border-[#2D3748] p-2.5 text-white text-xs font-mono rounded-lg focus:border-[#C5A880] outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isSearchingApi || !searchQuery.trim()}
                    className="px-4 py-2.5 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    {isSearchingApi ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Search className="w-3.5 h-3.5" />
                    )}
                    Tìm Kiếm
                  </button>
                </form>

                {searchNotFound && (
                  <div className="p-3 bg-[#161D26] border border-gray-700 text-gray-300 text-xs rounded-lg">
                    {searchNotFound}
                  </div>
                )}

                {searchResult && (
                  <div className="p-4 bg-[#161D26] border border-emerald-500/60 rounded-xl space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between text-xs text-emerald-400 font-bold border-b border-[#222B35] pb-2">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4" /> Thông Tin Người Nhà Tìm Thấy:
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAccount(searchResult);
                          setNewRelationship(searchResult.relationship || 'Vợ / Chồng');
                          setNewLicensePlate(searchResult.licensePlate || '');
                        }}
                        className="px-3 py-1 bg-[#C5A880] text-[#0D1117] font-bold text-[11px] rounded hover:bg-white transition-colors cursor-pointer"
                      >
                        {selectedAccount?.id === searchResult.id ? 'Đang Chọn ✓' : '+ Chọn Tài Khoản Này'}
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-full overflow-hidden border border-[#C5A880]/60 flex-shrink-0 bg-[#161D26]">
                        <img
                          src={
                            searchResult.avatarUrl
                              ? searchResult.avatarUrl.replace('data.nks.vn//', 'data.nks.vn/')
                              : 'https://data.nks.vn/storage/users/default.png'
                          }
                          alt={searchResult.fullName}
                          onError={(e) => {
                            e.currentTarget.src = 'https://data.nks.vn/storage/users/default.png';
                          }}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="space-y-0.5 text-xs">
                        <div className="font-bold text-white text-sm">{searchResult.fullName}</div>
                        <div className="text-gray-300 font-mono">SĐT: {searchResult.phone}</div>
                        <div className="text-[#C5A880] font-mono">CCCD: {searchResult.idCard}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* CONFIRMATION & ROLE ASSIGNMENT SECTION                        */}
            {/* ------------------------------------------------------------- */}
            {selectedAccount ? (
              <form onSubmit={handleAddMember} className="pt-3 border-t border-[#222B35] space-y-3.5 text-xs">
                <div className="p-3.5 bg-[#161D26] border border-[#C5A880]/60 rounded-xl space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#C5A880] flex items-center justify-between">
                    <span>Thông Tin Người Nhà Xác Thực:</span>
                    <span className="text-emerald-400 text-[10px] font-mono">Đã Xác Thực e-KYC</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-gray-200">
                    <div>• Họ tên: <strong className="text-white">{selectedAccount.fullName}</strong></div>
                    <div>• SĐT: <strong className="font-mono text-white">{selectedAccount.phone}</strong></div>
                    <div>• Số CCCD: <strong className="font-mono text-[#C5A880]">{selectedAccount.idCard}</strong></div>
                    <div>• Vai trò cấp phát: <strong className="text-purple-300">Người Nhà / Gia Đình</strong></div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-300 font-medium block mb-1">Mối Quan Hệ Với Chủ Hộ:</label>
                    <select
                      value={newRelationship}
                      onChange={(e) => setNewRelationship(e.target.value)}
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white rounded-lg focus:border-[#C5A880] outline-none"
                    >
                      <option value="Vợ / Chồng">Vợ / Chồng</option>
                      <option value="Con Cái">Con Cái</option>
                      <option value="Bố / Mẹ">Bố / Mẹ</option>
                      <option value="Anh / Chị / Em">Anh / Chị / Em</option>
                      <option value="Người Thân Gia Đình">Người Thân Gia Đình</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-gray-300 font-medium block mb-1">Biển Số Xe (Nếu có):</label>
                    <input
                      type="text"
                      value={newLicensePlate}
                      onChange={(e) => setNewLicensePlate(e.target.value)}
                      placeholder="VD: 59P1-886.79"
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white font-mono rounded-lg focus:border-[#C5A880] outline-none"
                    />
                  </div>
                </div>

                <div className="p-3 bg-purple-950/40 border border-purple-500/40 rounded-lg text-purple-300 text-[11px] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span>Sau khi xác nhận, tài khoản người nhà sẽ được cấp quyền FaceID sảnh đón, thang máy và tiện ích sinh hoạt.</span>
                </div>

                <div className="pt-2 flex justify-end gap-2.5 border-t border-[#222B35]">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-transparent hover:bg-[#161D26] text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-[#C5A880] hover:bg-white text-[#0D1117] font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg transition-colors flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Đang Xử Lý...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" /> Xác Nhận Thêm Thành Viên
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-4 bg-[#121820] border border-[#222B35] rounded-xl text-center text-xs text-gray-400">
                Vui lòng chọn một tài khoản người nhà ở trên để tiếp tục thiết lập quan hệ và cấp quyền.
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
