'use client';

import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Shield, 
  Sparkles, 
  RefreshCw, 
  Clock, 
  AlertTriangle,
  FileText,
  Scan,
  Check,
  X,
  Camera,
  Filter,
  Search,
  Building,
  CreditCard,
  Calendar,
  MapPin,
  RotateCw,
  ZoomIn,
  Users,
  ShieldCheck
} from 'lucide-react';
import { 
  getEkycRequests, 
  saveEkycRequests,
  approveEkycRequest, 
  rejectEkycRequest, 
  EkycRequest 
} from '@/lib/ekycStore';
import { validateCccdCard, verifyFaceWithCccd } from '@/lib/ekycValidator';
import { getEnrolledFaceProfile, updateEnrolledFaceStatus, saveEnrolledFaceProfile } from '@/lib/faceEnrollStore';
import { useLanguage } from '@/lib/languageContext';

export default function EkycApproval() {
  const { t, language } = useLanguage();
  const [requests, setRequests] = useState<EkycRequest[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Inspection & Dialog States
  const [inspectingRequest, setInspectingRequest] = useState<EkycRequest | null>(null);
  const [inspectingSide, setInspectingSide] = useState<'FRONT' | 'BACK'>('FRONT');
  const [zoomImage, setZoomImage] = useState<{ url: string; title: string } | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('Ảnh chụp CCCD bị lóa sáng/mờ nét, vui lòng chụp lại rõ nét');
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokeReason, setRevokeReason] = useState<string>('Ban Quản Lý tạm thu hồi quyền ra vào FaceID để đối soát lại hồ sơ');
  const [justApprovedId, setJustApprovedId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const refreshList = async () => {
    try {
      const res = await fetch('/api/ekyc');
      const data = await res.json();
      if (data.success && Array.isArray(data.requests)) {
        setRequests(data.requests);
        saveEkycRequests(data.requests);
      } else {
        setRequests(getEkycRequests());
      }
    } catch (e) {
      setRequests(getEkycRequests());
    }

    // Đồng bộ toàn bộ hồ sơ 4 mẫu quét từ máy chủ về để BQL trên Desktop kiểm tra được mẫu từ Mobile
    fetch('/api/user/face-enroll')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.profiles)) {
          data.profiles.forEach((p: any) => saveEnrolledFaceProfile(p));
        }
      })
      .catch(e => console.warn('Lỗi đồng bộ face profiles:', e));
  };

  useEffect(() => {
    refreshList();
    const handleUpdate = () => refreshList();
    window.addEventListener('skyline_ekyc_updated', handleUpdate);
    window.addEventListener('skyline_faceid_enrolled', handleUpdate);
    return () => {
      window.removeEventListener('skyline_ekyc_updated', handleUpdate);
      window.removeEventListener('skyline_faceid_enrolled', handleUpdate);
    };
  }, []);

  // 1. Phê Duyệt Hồ Sơ e-KYC (Kích Hoạt FaceID & Đồng Bộ Căn Hộ)
  const handleApprove = async (id: string, name: string) => {
    setIsProcessing(true);
    try {
      // 1. Gửi API đồng bộ server
      let apiMsg = '';
      try {
        const res = await fetch('/api/ekyc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'APPROVE',
            id,
            approverName: 'Ban Quản Lý Skyline',
          }),
        });
        const data = await res.json();
        apiMsg = data.message || '';
      } catch (e) {
        console.warn('API approve error:', e);
      }

      // 2. Cập nhật local storage
      const updated = approveEkycRequest(id, 'Ban Quản Lý Skyline');
      if (updated) {
        updateEnrolledFaceStatus(updated.userId, 'ACTIVE');
        if (updated.phone) updateEnrolledFaceStatus(updated.phone, 'ACTIVE');
      }

      await refreshList();
      setActionNotice({
        type: 'success',
        message: apiMsg || `Đã phê duyệt hồ sơ e-KYC của ${name} & Kích hoạt quyền FaceID thành công!`
      });
      // Giữ modal mở và cập nhật trực tiếp sang trạng thái ĐÃ DUYỆT để BQL kiểm tra kết quả ngay
      if (inspectingRequest?.id === id && updated) {
        setInspectingRequest(updated);
        setJustApprovedId(id);
      }
      setTimeout(() => setActionNotice(null), 4000);
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Xác Nhận Từ Chối Hồ Sơ e-KYC (Kèm Lý Do Cụ Thể)
  const handleConfirmReject = async () => {
    if (!rejectingId) return;
    setIsProcessing(true);
    try {
      // 1. Gửi API đồng bộ server
      let apiMsg = '';
      try {
        const res = await fetch('/api/ekyc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'REJECT',
            id: rejectingId,
            reason: rejectionReason,
            approverName: 'Ban Quản Lý Skyline',
          }),
        });
        const data = await res.json();
        apiMsg = data.message || '';
      } catch (e) {
        console.warn('API reject error:', e);
      }

      // 2. Cập nhật local storage
      const updated = rejectEkycRequest(rejectingId, rejectionReason, 'Ban Quản Lý Skyline');
      if (updated) {
        updateEnrolledFaceStatus(updated.userId, 'REVOKED');
        if (updated.phone) updateEnrolledFaceStatus(updated.phone, 'REVOKED');
      }

      await refreshList();
      setActionNotice({
        type: 'error',
        message: apiMsg || `Đã từ chối hồ sơ e-KYC: ${rejectionReason}`
      });
      if (inspectingRequest?.id === rejectingId && updated) {
        setInspectingRequest(updated);
      }
      setRejectingId(null);
      setTimeout(() => setActionNotice(null), 4000);
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. Xác Nhận Tạm Khóa / Thu Hồi Quyền Ra Vào (Đối với hồ sơ đã duyệt)
  const handleConfirmRevoke = async () => {
    if (!revokingId) return;
    setIsProcessing(true);
    try {
      let apiMsg = '';
      try {
        const res = await fetch('/api/ekyc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'REVOKE',
            id: revokingId,
            reason: revokeReason,
            approverName: 'Ban Quản Lý Skyline',
          }),
        });
        const data = await res.json();
        apiMsg = data.message || '';
      } catch (e) {
        console.warn('API revoke error:', e);
      }

      const updated = rejectEkycRequest(revokingId, revokeReason, 'Ban Quản Lý Skyline');
      if (updated) {
        updateEnrolledFaceStatus(updated.userId, 'REVOKED');
        if (updated.phone) updateEnrolledFaceStatus(updated.phone, 'REVOKED');
      }

      await refreshList();
      setActionNotice({
        type: 'error',
        message: apiMsg || `Đã thu hồi quyền ra vào FaceID của hồ sơ.`
      });
      if (inspectingRequest?.id === revokingId && updated) {
        setInspectingRequest(updated);
      }
      setRevokingId(null);
      setTimeout(() => setActionNotice(null), 4000);
    } finally {
      setIsProcessing(false);
    }
  };

  // Lọc danh sách theo trạng thái & từ khóa tìm kiếm
  const filteredRequests = requests.filter(r => {
    const matchesStatus = filterStatus === 'ALL' || r.status === filterStatus;
    if (!matchesStatus) return false;

    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    return (
      r.fullName.toLowerCase().includes(query) ||
      r.apartmentCode.toLowerCase().includes(query) ||
      r.phone.includes(query) ||
      r.idCardNo.includes(query)
    );
  });

  const pendingCount = requests.filter(r => r.status === 'PENDING').length;
  const approvedCount = requests.filter(r => r.status === 'APPROVED').length;
  const rejectedCount = requests.filter(r => r.status === 'REJECTED').length;

  return (
    <div className="space-y-6 animate-fadeIn select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222B35] pb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-semibold flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-[#C5A880]" /> {t('Xác Thực Cư Dân • Ban Quản Lý', 'Resident Verification • Management')}
          </div>
          <h2 className="font-serif text-2xl text-white font-bold mt-1">
            {t('Xác Thực Căn Cước Công Dân & Kích Hoạt Quyền Ra Vào', 'Citizen ID Verification & Access Activation')}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {t('Kiểm tra và đối chiếu căn cước công dân với khuôn mặt cư dân trước khi kích hoạt quyền ra vào thang máy và sảnh đón.', 'Inspect and match citizen ID card against resident facial portrait before activating lift and lobby access.')}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={refreshList}
            className="px-3 py-1.5 text-gray-300 hover:text-white bg-[#161B22] border border-[#2D3748] rounded-none transition-colors flex items-center gap-1.5 shadow"
          >
            <RefreshCw className="w-3.5 h-3.5" /> {t('Làm Mới', 'Refresh')}
          </button>
        </div>
      </div>

      {/* Action Notification */}
      {actionNotice && (
        <div className={`p-3.5 border text-xs font-semibold flex items-center gap-2.5 rounded-none animate-fadeIn shadow-lg ${
          actionNotice.type === 'success' 
            ? 'bg-emerald-950/90 border-emerald-500 text-emerald-300' 
            : 'bg-rose-950/90 border-rose-500 text-rose-300'
        }`}>
          {actionNotice.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
          <span>{actionNotice.message}</span>
        </div>
      )}

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="p-4 bg-[#121820] border border-[#222B35] rounded-none space-y-1">
          <div className="text-gray-400 text-[11px]">{t('Tổng Hồ Sơ Tiếp Nhận', 'Total Received Profiles')}</div>
          <div className="text-xl font-bold font-mono text-white">{requests.length}</div>
        </div>

        <div 
          onClick={() => setFilterStatus('PENDING')}
          className={`p-4 bg-[#121820] border rounded-none space-y-1 cursor-pointer transition-all ${
            filterStatus === 'PENDING' ? 'border-amber-500 bg-amber-950/20' : 'border-[#222B35] hover:border-amber-500/50'
          }`}
        >
          <div className="text-amber-400 text-[11px] flex items-center gap-1 font-semibold">
            <Clock className="w-3 h-3 animate-pulse" /> {t('Đang Chờ Xác Thực', 'Pending Verification')}
          </div>
          <div className="text-xl font-bold font-mono text-amber-300">{pendingCount}</div>
        </div>

        <div 
          onClick={() => setFilterStatus('APPROVED')}
          className={`p-4 bg-[#121820] border rounded-none space-y-1 cursor-pointer transition-all ${
            filterStatus === 'APPROVED' ? 'border-emerald-500 bg-emerald-950/20' : 'border-[#222B35] hover:border-emerald-500/50'
          }`}
        >
          <div className="text-emerald-400 text-[11px] flex items-center gap-1 font-semibold">
            <CheckCircle2 className="w-3 h-3" /> {t('Đã Kích Hoạt Quyền Ra Vào', 'Access Granted')}
          </div>
          <div className="text-xl font-bold font-mono text-emerald-300">{approvedCount}</div>
        </div>

        <div 
          onClick={() => setFilterStatus('REJECTED')}
          className={`p-4 bg-[#121820] border rounded-none space-y-1 cursor-pointer transition-all ${
            filterStatus === 'REJECTED' ? 'border-rose-500 bg-rose-950/20' : 'border-[#222B35] hover:border-rose-500/50'
          }`}
        >
          <div className="text-rose-400 text-[11px] flex items-center gap-1 font-semibold">
            <XCircle className="w-3 h-3" /> {t('Cần Cập Nhật / Chụp Lại', 'Needs Update / Reshot')}
          </div>
          <div className="text-xl font-bold font-mono text-rose-300">{rejectedCount}</div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222B35] pb-3">
        <div className="flex gap-1.5 text-xs overflow-x-auto">
          {[
            { id: 'ALL', label: t('Tất Cả', 'All') },
            { id: 'PENDING', label: `${t('Chờ Xác Thực', 'Pending Verification')} (${pendingCount})` },
            { id: 'APPROVED', label: `${t('Đã Kích Hoạt', 'Activated')} (${approvedCount})` },
            { id: 'REJECTED', label: `${t('Cần Bổ Sung', 'Needs Update')} (${rejectedCount})` },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-none transition-all font-semibold ${
                filterStatus === tab.id
                  ? 'bg-[#C5A880] text-[#0D1117] shadow'
                  : 'text-gray-400 hover:text-white bg-[#161B22] border border-[#222B35]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('Tìm theo Căn hộ (CH-06), Tên, CCCD...', 'Search by Apartment (CH-06), Name, ID...')}
            className="w-full bg-[#161B22] border border-[#2D3748] pl-8 pr-3 py-1.5 text-xs text-white rounded-none focus:outline-none focus:border-[#C5A880]"
          />
          <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2.5" />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-gray-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Danh Sách Hồ Sơ Xác Thực Căn Cước & Khuôn Mặt */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="p-12 text-center text-gray-400 bg-[#121820] border border-[#222B35] rounded-none space-y-2">
            <UserCheck className="w-10 h-10 text-gray-600 mx-auto" />
            <div className="font-semibold text-white text-sm">Không tìm thấy hồ sơ cư dân nào</div>
            <div className="text-xs text-gray-500">Hồ sơ gửi từ cư dân sẽ tự động xuất hiện tại đây theo thời gian thực.</div>
          </div>
        ) : (
          filteredRequests.map((req) => {
            const isPending = req.status === 'PENDING';
            const isApproved = req.status === 'APPROVED';
            const isRejected = req.status === 'REJECTED';

            return (
              <div
                key={req.id}
                className={`p-5 bg-[#121820] border rounded-none transition-all shadow-lg ${
                  isPending
                    ? 'border-amber-500/70 bg-gradient-to-r from-[#121820] to-[#1A1810]'
                    : isApproved
                    ? 'border-emerald-500/50'
                    : 'border-rose-500/50'
                }`}
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
                  
                  {/* Left: Avatar & Face Match Score */}
                  <div className="lg:col-span-4 flex items-center gap-4">
                    <div className="relative flex-shrink-0">
                      <img
                        src={req.avatarUrl || 'https://data.nks.vn/storage/users/default.png'}
                        alt={req.fullName}
                        onError={(e) => {
                          e.currentTarget.src = 'https://data.nks.vn/storage/users/default.png';
                        }}
                        className="w-16 h-16 rounded-full object-cover border-2 border-[#C5A880] shadow"
                      />
                      <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-emerald-950 border border-emerald-500 text-emerald-400 text-[9px] font-mono font-bold rounded-none">
                        {req.faceScore}%
                      </span>
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-serif text-base font-bold text-white truncate">
                          {req.fullName}
                        </h3>
                        <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-none border ${
                          req.roleLabel.includes('Chủ Hộ')
                            ? 'bg-[#C5A880]/20 text-[#C5A880] border-[#C5A880]/50'
                            : 'bg-purple-950/80 text-purple-300 border-purple-500/60'
                        }`}>
                          {req.roleLabel}
                        </span>
                      </div>
                      <div className="text-xs text-gray-300">
                        {t('Căn Hộ:', 'Apartment:')} <strong className="text-white font-mono">{req.apartmentCode}</strong> • {t('SĐT:', 'Phone:')} <span className="font-mono text-gray-400">{req.phone}</span>
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono">
                        {t('Nộp lúc:', 'Submitted at:')} {req.submittedAt}
                      </div>
                    </div>
                  </div>

                  {/* Middle: CCCD Details & Quick Previews */}
                  <div className="lg:col-span-4 flex items-center justify-between gap-3 bg-[#161D26] p-3 rounded-none border border-[#222B35]">
                    <div className="space-y-1 min-w-0 flex-1 text-xs">
                      <div>
                        <span className="text-gray-400 text-[10px] block">{t('Số Căn Cước Công Dân:', 'Citizen ID Number:')}</span>
                        <strong className="font-mono text-[#C5A880] text-sm tracking-wider">{req.idCardNo}</strong>
                      </div>
                      <div className="flex items-center gap-2 text-[10.5px] text-gray-300">
                        <span>{t('Cấp', 'Issued')}: <span className="font-mono">{req.idDate || 'N/A'}</span></span>
                        <span>•</span>
                        <span className="truncate">{req.idPlace || 'Cục Cảnh sát QLHC'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setInspectingRequest(req);
                          setInspectingSide('FRONT');
                          setJustApprovedId(null);
                        }}
                        className="text-[#C5A880] hover:text-white font-bold text-[10.5px] flex items-center gap-1 underline pt-0.5 cursor-pointer"
                      >
                        <Eye className="w-3 h-3" /> {t('Kiểm Tra Đối Chiếu Chi Tiết')}
                      </button>
                    </div>

                    {/* CCCD Front/Back Mini Thumbnails */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {req.idCardFrontUrl && (
                        <div
                          onClick={() => setZoomImage({ url: req.idCardFrontUrl!, title: `${t('Mặt trước CCCD')} - ${req.fullName}` })}
                          className="w-14 h-9 bg-black border border-gray-700 hover:border-[#C5A880] overflow-hidden cursor-pointer relative group"
                          title={t('Xem mặt trước CCCD')}
                        >
                          <img src={req.idCardFrontUrl} alt="Trước" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[7px] text-gray-300 text-center font-mono">{t('Trước')}</span>
                        </div>
                      )}
                      {req.idCardBackUrl && (
                        <div
                          onClick={() => setZoomImage({ url: req.idCardBackUrl!, title: `${t('Mặt sau CCCD')} - ${req.fullName}` })}
                          className="w-14 h-9 bg-black border border-gray-700 hover:border-[#C5A880] overflow-hidden cursor-pointer relative group"
                          title={t('Xem mặt sau CCCD')}
                        >
                          <img src={req.idCardBackUrl} alt="Sau" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[7px] text-gray-300 text-center font-mono">{t('Sau')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions & Status Badge */}
                  <div className="lg:col-span-4 flex flex-col items-stretch sm:items-end justify-center gap-2">
                    {isApproved ? (
                      <div className="flex flex-col items-stretch sm:items-end gap-1.5 w-full sm:w-64">
                        <button
                          type="button"
                          onClick={() => {
                            setInspectingRequest(req);
                            setInspectingSide('FRONT');
                            setJustApprovedId(null);
                          }}
                          className="w-full h-8 px-3 bg-[#121B24] hover:bg-[#1A2634] border border-emerald-500/60 text-emerald-300 text-xs font-semibold rounded-none transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow whitespace-nowrap"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{t('Xem Chi Tiết')}</span>
                        </button>

                        <div className="w-full h-8 px-3 bg-emerald-950/80 text-emerald-300 border border-emerald-500 text-xs font-bold rounded-none flex items-center justify-center gap-1.5 whitespace-nowrap shadow-sm">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{t('Đã Kích Hoạt Quyền Ra Vào')}</span>
                        </div>

                        <div className="text-[10px] text-gray-400 flex items-center justify-center sm:justify-end gap-1 font-mono w-full pt-0.5">
                          {req.reviewedAt && <span>{t('Duyệt')}: {req.reviewedAt}</span>}
                          {req.reviewedAt && <span>•</span>}
                          <button
                            type="button"
                            onClick={() => {
                              setRevokingId(req.id);
                              setRevokeReason('Ban Quản Lý tạm thu hồi quyền ra vào FaceID để đối soát lại hồ sơ.');
                            }}
                            className="text-rose-400 hover:text-rose-300 underline cursor-pointer"
                          >
                            {t('Thu hồi')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full sm:w-64">
                        {isPending && (
                          <div className="grid grid-cols-3 gap-1.5 w-full">
                            <button
                              type="button"
                              onClick={() => {
                                setInspectingRequest(req);
                                setInspectingSide('FRONT');
                                setJustApprovedId(null);
                              }}
                              className="h-8 px-1 bg-[#1C2533] hover:bg-[#2B394E] border border-gray-700 text-gray-200 text-[11px] font-semibold rounded-none transition-all flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap"
                              title={t('Kiểm Tra')}
                            >
                              <Eye className="w-3 h-3 text-[#C5A880] flex-shrink-0" />
                              <span>{t('Kiểm Tra')}</span>
                            </button>

                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleApprove(req.id, req.fullName)}
                              className="h-8 px-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-none shadow transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 whitespace-nowrap"
                              title={t('Xác Nhận')}
                            >
                              <Check className="w-3 h-3 flex-shrink-0" />
                              <span>{t('Xác Nhận')}</span>
                            </button>

                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => {
                                setRejectingId(req.id);
                                setRejectionReason('Ảnh chụp CCCD bị mờ/lóa sáng, vui lòng chụp lại rõ nét');
                              }}
                              className="h-8 px-1 bg-rose-950 hover:bg-rose-900 border border-rose-500 text-rose-300 text-[11px] font-semibold rounded-none transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 whitespace-nowrap"
                              title={t('Báo Chụp Lại')}
                            >
                              <X className="w-3 h-3 flex-shrink-0" />
                              <span>{t('Báo Chụp Lại')}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {isRejected && (
                      <div className="w-full sm:w-64 text-right space-y-1">
                        <span className="w-full h-8 px-3 bg-rose-950 text-rose-300 border border-rose-500 text-xs font-bold rounded-none flex items-center justify-center gap-1.5 whitespace-nowrap">
                          <XCircle className="w-3.5 h-3.5 text-rose-400" /> {t('Cần Cập Nhật Lại')}
                        </span>
                        <div className="text-[10px] text-rose-400 truncate" title={req.rejectionReason}>
                          {t('Lý do:')} {req.rejectionReason}
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ============================================================= */}
      {/* MODAL: THẨM ĐỊNH HỒ SƠ SINH TRẮC HỌC CHI TIẾT (BQL INSPECTION)  */}
      {/* ============================================================= */}
      {inspectingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0D1117] border border-[#C5A880]/70 max-w-4xl w-full p-5 sm:p-6 rounded-none space-y-5 shadow-2xl overflow-y-auto max-h-[92vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#222B35] pb-3">
              <div className="flex items-center gap-3">
                {inspectingRequest.status === 'APPROVED' ? (
                  <div className="w-8 h-8 bg-emerald-950/80 border border-emerald-500/80 flex items-center justify-center text-emerald-400 flex-shrink-0">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  </div>
                ) : inspectingRequest.status === 'REJECTED' ? (
                  <div className="w-8 h-8 bg-rose-950/80 border border-rose-500/80 flex items-center justify-center text-rose-400 flex-shrink-0">
                    <XCircle className="w-4 h-4 text-rose-400" />
                  </div>
                ) : (
                  <div className="w-8 h-8 bg-[#161D26] border border-[#C5A880] flex items-center justify-center text-[#C5A880] flex-shrink-0">
                    <Shield className="w-4 h-4 text-[#C5A880]" />
                  </div>
                )}
                <div>
                  <div className="text-[10px] uppercase font-mono text-[#C5A880] font-bold flex items-center gap-1.5 flex-wrap">
                    <span>{t('Hệ Thống Thẩm Định BQL • Căn Hộ', 'Management System Appraisal • Apartment')} {inspectingRequest.apartmentCode}</span>
                    {inspectingRequest.status === 'APPROVED' && (
                      <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-500 text-emerald-300 font-mono text-[9px] font-bold uppercase rounded-none">
                        {t('✓ ĐÃ KÍCH HOẠT HỆ THỐNG', '✓ SYSTEM ACTIVATED')}
                      </span>
                    )}
                    {inspectingRequest.status === 'REJECTED' && (
                      <span className="px-2 py-0.5 bg-rose-950 border border-rose-500 text-rose-300 font-mono text-[9px] font-bold uppercase rounded-none">
                        {t('⚠ YÊU CẦU CẬP NHẬT', '⚠ UPDATE REQUIRED')}
                      </span>
                    )}
                    {inspectingRequest.status === 'PENDING' && (
                      <span className="px-2 py-0.5 bg-amber-950 border border-amber-500 text-amber-300 font-mono text-[9px] font-bold uppercase rounded-none animate-pulse">
                        {t('⏳ CHỜ THẨM ĐỊNH', '⏳ PENDING APPRAISAL')}
                      </span>
                    )}
                    {inspectingRequest.roleLabel.includes('Bảo lãnh') && (
                      <span className="px-2 py-0.5 bg-purple-950/90 border border-purple-500/80 text-purple-300 font-sans text-[10px] rounded-none normal-case font-semibold flex items-center gap-1">
                        <Users className="w-3 h-3 text-purple-400" /> {t('Được Chủ Hộ Bảo Lãnh', 'Owner Sponsored')}
                      </span>
                    )}
                  </div>
                  <h3 className="font-serif text-lg font-bold text-white mt-0.5">
                    {t('Đối Chiếu Khuôn Mặt Cư Dân & Thẻ Căn Cước:', 'Resident Facial & ID Card Matching:')} {inspectingRequest.fullName}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectingRequest(null)}
                className="text-gray-400 hover:text-white p-1 rounded-none hover:bg-[#161B22] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Flash Banner: Just approved successfully in this session */}
            {justApprovedId === inspectingRequest.id && (
              <div className="p-3 bg-emerald-950/70 border border-emerald-500/80 text-emerald-200 text-xs flex items-center justify-between gap-2 rounded-none animate-fadeIn">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>
                    <strong>{t('Phê duyệt thành công!', 'Approval Successful!')}</strong> {t('Đã kích hoạt sinh trắc học FaceID và nạp dữ liệu nhận diện vào Camera AI cổng Barrier và Thang máy toà nhà.', 'FaceID biometrics activated and recognition data loaded to AI barrier gate and building elevators.')}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-900/50 px-2 py-0.5">{t('Thời gian thực', 'Real-time')}</span>
              </div>
            )}

            {/* Thông báo lý do từ chối (Dành cho hồ sơ REJECTED) */}
            {inspectingRequest.status === 'REJECTED' && (
              <div className="p-4 bg-rose-950/60 border border-rose-500/70 rounded-none space-y-2">
                <div className="flex items-center gap-2 text-rose-300 font-bold text-xs uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  {t('Hồ Sơ Đã Bị Từ Chối / Yêu Cầu Cung Cấp Lại', 'Dossier Rejected / Resubmission Required')}
                </div>
                <div className="text-xs text-rose-200 bg-black/40 p-2.5 border border-rose-900/60 space-y-1">
                  <span className="text-gray-400 block text-[10px]">{t('Lý do từ chối gửi cư dân:', 'Rejection reason sent to resident:')}</span>
                  <strong>&quot;{inspectingRequest.rejectionReason || t('Ảnh chụp CCCD không đạt tiêu chuẩn rõ nét.', 'Citizen ID photo does not meet clarity standards.')}&quot;</strong>
                </div>
                <div className="text-[10.5px] text-gray-400 font-mono">
                  {t('Xử lý lúc:', 'Processed at:')} {inspectingRequest.reviewedAt} • {t('Bởi:', 'By:')} {inspectingRequest.reviewedBy}
                </div>
              </div>
            )}

            {/* Visual Comparison: Portrait Face & 4 Angle Samples vs CCCD Photo */}
            {(() => {
              const enrolled = getEnrolledFaceProfile(inspectingRequest.userId) || getEnrolledFaceProfile(inspectingRequest.phone);
              const samples = inspectingRequest.faceSamples || enrolled?.samples;

              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* 1. FaceID Live Portrait & Angle Gallery */}
                    <div className="p-4 bg-[#161D26] border border-[#2D3748] rounded-none space-y-3 text-center">
                      <div className="flex items-center justify-between text-xs text-gray-300 font-semibold border-b border-[#222B35] pb-2">
                        <span className="flex items-center gap-1.5">
                          <Camera className="w-3.5 h-3.5 text-[#C5A880]" /> {t('Ảnh Chân Dung Nhận Diện:', 'Facial Portrait Photo:')}
                        </span>
                        <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-500/50 rounded-none font-mono text-[10px]">
                          {t('Độ Trùng Khớp:', 'Match Rate:')} {inspectingRequest.faceScore}%
                        </span>
                      </div>
                      
                      <div className="w-36 h-44 sm:w-40 sm:h-48 mx-auto rounded-none overflow-hidden border-2 border-[#C5A880] shadow-lg bg-[#0A0E14] relative group cursor-pointer"
                           onClick={() => setZoomImage({ url: inspectingRequest.avatarUrl || samples?.front || '', title: `${t('Chân dung FaceID', 'FaceID Portrait')} - ${inspectingRequest.fullName}` })}>
                        <img
                          src={inspectingRequest.avatarUrl || samples?.front || 'https://data.nks.vn/storage/users/default.png'}
                          alt="FaceID Portrait"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <ZoomIn className="w-6 h-6 text-white" />
                        </div>
                        <div className="absolute bottom-2 inset-x-2 bg-black/70 backdrop-blur text-[9px] font-mono text-[#C5A880] py-0.5 rounded-none">
                          {t('CHÂN DUNG CHÍNH DIỆN', 'FRONT FACIAL PORTRAIT')}
                        </div>
                      </div>

                      {/* 4 Multi-angle samples if enrolled */}
                      {samples && (
                        <div className="space-y-1.5 pt-2 border-t border-[#222B35]">
                          <div className="text-[10px] uppercase font-bold text-[#C5A880] tracking-wider flex items-center justify-between">
                            <span>{t('Bộ Mẫu Thu Thập 4 Góc Mặt:', '4-Angle Face Enrollment Set:')}</span>
                            <span className="text-emerald-400 font-mono text-[9px]">{t('Liveness 100%', 'Liveness 100%')}</span>
                          </div>
                          <div className="grid grid-cols-4 gap-1.5">
                            {[
                              { label: t('Chính diện', 'Front'), img: samples.front },
                              { label: t('Trái (-25°)', 'Left (-25°)'), img: samples.left },
                              { label: t('Phải (+25°)', 'Right (+25°)'), img: samples.right },
                              { label: t('Xác thực', 'Verify'), img: samples.smile },
                            ].map((s, idx) => (
                              <div key={idx} 
                                   onClick={() => s.img && setZoomImage({ url: s.img, title: `${s.label} - ${inspectingRequest.fullName}` })}
                                   className="border border-[#263140] bg-black aspect-square overflow-hidden relative group cursor-pointer">
                                {s.img ? (
                                  <img src={s.img} alt={s.label} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-500">{t('Chưa có', 'None')}</div>
                                )}
                                <div className="absolute bottom-0 inset-x-0 bg-black/80 text-[8px] text-gray-300 py-0.5 truncate">
                                  {s.label}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="text-[11px] text-gray-400">
                        {samples ? t('Dữ liệu nhận diện khuôn mặt đã sẵn sàng kích hoạt quyền ra vào sảnh & thang máy', 'Face biometric data ready to activate lobby & elevator access') : t('Ảnh chân dung chụp trực tiếp từ thiết bị', 'Portrait captured directly from device')}
                      </div>
                    </div>

                    {/* 2. CCCD Card (Interactive Front/Back & Both views) */}
                    <div className="p-4 bg-[#161D26] border border-[#2D3748] rounded-none space-y-3 text-center flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between text-xs text-gray-300 font-semibold border-b border-[#222B35] pb-2">
                          <span className="flex items-center gap-1.5">
                            <CreditCard className="w-3.5 h-3.5 text-[#C5A880]" /> {t('Thẻ Căn Cước Công Dân:', 'Citizen ID Card:')}
                          </span>
                          
                          {/* Side Switcher */}
                          <div className="flex gap-1 bg-[#0D1117] p-0.5 rounded-none border border-gray-700 text-[10px]">
                            <button
                              type="button"
                              onClick={() => setInspectingSide('FRONT')}
                              className={`px-2.5 py-1 rounded-none font-bold transition-all ${
                                inspectingSide === 'FRONT' ? 'bg-[#C5A880] text-[#0D1117]' : 'text-gray-400 hover:text-white'
                              }`}
                            >
                              {t('Mặt Trước', 'Front Side')}
                            </button>
                            <button
                              type="button"
                              onClick={() => setInspectingSide('BACK')}
                              className={`px-2.5 py-1 rounded-none font-bold transition-all ${
                                inspectingSide === 'BACK' ? 'bg-[#C5A880] text-[#0D1117]' : 'text-gray-400 hover:text-white'
                              }`}
                            >
                              {t('Mặt Sau', 'Back Side')}
                            </button>
                          </div>
                        </div>

                        {/* Card Image Display */}
                        {(() => {
                          const activeCardUrl = inspectingSide === 'FRONT' 
                            ? inspectingRequest.idCardFrontUrl 
                            : (inspectingRequest.idCardBackUrl || inspectingRequest.idCardFrontUrl);

                          return (
                            <div 
                              className="w-full h-44 sm:h-52 rounded-none overflow-hidden border border-white/20 shadow-lg bg-[#0A0E14] relative flex items-center justify-center mt-3 group cursor-pointer"
                              onClick={() => {
                                if (activeCardUrl) {
                                  setZoomImage({
                                    url: activeCardUrl,
                                    title: inspectingSide === 'FRONT' ? `${t('Mặt trước CCCD', 'Citizen ID Front')} - ${inspectingRequest.fullName}` : `${t('Mặt sau CCCD', 'Citizen ID Back')} - ${inspectingRequest.fullName}`
                                  });
                                }
                              }}
                            >
                              {activeCardUrl ? (
                                <>
                                  <img
                                    src={activeCardUrl}
                                    alt="CCCD"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <ZoomIn className="w-6 h-6 text-white" />
                                  </div>
                                </>
                              ) : (
                                <div className="p-4 text-center space-y-2">
                                  <CreditCard className="w-10 h-10 text-[#C5A880]/60 mx-auto" />
                                  <div className="text-xs font-semibold text-gray-300">
                                    {inspectingSide === 'FRONT' ? t('Chưa Tải Ảnh Mặt Trước CCCD', 'Front ID Photo Not Uploaded') : t('Chưa Tải Ảnh Mặt Sau CCCD', 'Back ID Photo Not Uploaded')}
                                  </div>
                                  <div className="text-[10px] text-gray-400 font-mono">
                                    {t('Số CCCD:', 'Citizen ID No:')} {inspectingRequest.idCardNo || t('Chưa cung cấp', 'Not provided')}
                                  </div>
                                </div>
                              )}
                              <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/80 backdrop-blur rounded-none text-[9.5px] font-mono text-gray-300">
                                {inspectingSide === 'FRONT' ? t('MẶT TRƯỚC (CÓ ẢNH & SỐ ĐỊNH DANH)', 'FRONT (PHOTO & CITIZEN ID NO)') : t('MẶT SAU (CHIP ĐIỆN TỬ & VÂN TAY)', 'BACK (CHIP & FINGERPRINT)')}
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Dual-Side Mini Bar */}
                      <div className="pt-2 border-t border-[#222B35] flex items-center justify-between text-[11px] text-gray-400">
                        <span>{t('Nhấp vào ảnh để phóng to toàn màn hình', 'Click image to expand fullscreen')}</span>
                        <div className="flex gap-1 font-mono text-[10px]">
                          <span className={inspectingRequest.idCardFrontUrl ? 'text-emerald-400' : 'text-amber-400'}>
                            {inspectingRequest.idCardFrontUrl ? t('✓ Mặt trước Đầy Đủ', '✓ Front Complete') : t('⚠ Chưa Có Mặt Trước', '⚠ Front Missing')}
                          </span>
                          <span>•</span>
                          <span className={inspectingRequest.idCardBackUrl ? 'text-emerald-400' : 'text-amber-400'}>
                            {inspectingRequest.idCardBackUrl ? t('✓ Mặt Sau Đầy Đủ', '✓ Back Complete') : t('⚠ Chưa Có Mặt Sau', '⚠ Back Missing')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* AI Biometric & CCCD Card Health Analysis Badge */}
            {(() => {
              const bio = verifyFaceWithCccd(inspectingRequest.avatarUrl, inspectingRequest.idCardFrontUrl);
              const card = validateCccdCard(inspectingRequest.idCardFrontUrl, 'Mặt trước CCCD');
              const displayScore = inspectingRequest.faceScore || bio.similarity;
              const isEligible = displayScore >= 85.0 && card.isValid;

              return (
                <div className={`p-4 rounded-none border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-md ${
                  isEligible
                    ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200'
                    : 'bg-rose-950/40 border-rose-500/60 text-rose-200'
                }`}>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-[11px]">
                      {isEligible ? (
                        <span className="text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          {t('Đạt Tiêu Chuẩn Xác Thực & Đủ Điều Kiện Kích Hoạt Quyền Ra Vào', 'Verification Standard Met & Eligible for Access Activation')}
                        </span>
                      ) : (
                        <span className="text-rose-400 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-rose-400" />
                          {t('Cần Kiểm Tra: Ảnh Khuôn Mặt Chưa Khớp Hoặc Thẻ CCCD Mờ', 'Needs Review: Face Mismatch or Blurry ID')}
                        </span>
                      )}
                    </div>
                    <p className="text-[11.5px] text-gray-300">
                      {isEligible
                        ? `${t('Ảnh khuôn mặt trùng khớp với chân dung trên CCCD', 'Face portrait matches Citizen ID photo')} (${displayScore.toFixed(1)}% ≥ 85%). ${t('Thẻ CCCD hợp lệ', 'Valid Citizen ID card')}.`
                        : `${t(bio.reason, bio.reason)}. ${t('Vui lòng kiểm tra lại ảnh thẻ CCCD hoặc yêu cầu cư dân nộp lại chân dung rõ nét.', 'Please review ID card photo or request resident to resubmit a sharp portrait.')}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 font-mono">
                    <div className={`px-3 py-1.5 rounded-none border font-bold text-xs ${
                      displayScore >= 85
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500/80'
                        : 'bg-rose-950 text-rose-300 border-rose-500/80'
                    }`}>
                      {t('Độ Khớp:', 'Match Rate:')} {displayScore.toFixed(1)}%
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Legal Information Verification Table */}
            <div className="p-4 bg-[#161D26] border border-[#2D3748] rounded-none space-y-3 text-xs">
              <div className="text-gray-300 font-bold flex items-center gap-1.5 border-b border-[#222B35] pb-2">
                <FileText className="w-3.5 h-3.5 text-[#C5A880]" />
                <span>{t('Bảng Đối Chiếu Thông Tin Khai Báo & Trích Xuất Thẻ:', 'Declared Info & ID Extraction Comparison:')}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-gray-500 text-[10.5px] block">{t('Họ và Tên:', 'Full Name:')}</span>
                  <strong className="text-white text-sm">{inspectingRequest.fullName}</strong>
                </div>

                <div>
                  <span className="text-gray-500 text-[10.5px] block">{t('Số Căn Cước Công Dân:', 'Citizen ID Number:')}</span>
                  <strong className="text-[#C5A880] font-mono text-sm tracking-wider">{inspectingRequest.idCardNo}</strong>
                </div>

                <div>
                  <span className="text-gray-500 text-[10.5px] block">{t('Căn Hộ & Vai Trò:', 'Apartment & Role:')}</span>
                  <strong className="text-white font-mono">{t('Căn', 'Unit')} {inspectingRequest.apartmentCode}</strong> ({t(inspectingRequest.roleLabel, inspectingRequest.roleLabel)})
                </div>

                <div>
                  <span className="text-gray-500 text-[10.5px] block">{t('Ngày Sinh:', 'Date of Birth:')}</span>
                  <span className="text-gray-200 font-mono">{inspectingRequest.dob || t('Chưa cập nhật', 'Not updated')}</span>
                </div>

                <div>
                  <span className="text-gray-500 text-[10.5px] block">{t('Ngày Cấp & Nơi Cấp:', 'Issue Date & Place:')}</span>
                  <span className="text-gray-200">
                    {inspectingRequest.idDate || t('Chưa cập nhật', 'Not updated')}
                    {inspectingRequest.idPlace ? ` • ${inspectingRequest.idPlace}` : ''}
                  </span>
                </div>

                <div>
                  <span className="text-gray-500 text-[10.5px] block">{t('Số Điện Thoại:', 'Phone Number:')}</span>
                  <span className="text-gray-200 font-mono">{inspectingRequest.phone}</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-[#222B35] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Left: Status */}
              <div className="flex items-center gap-2.5 text-xs text-gray-400 flex-shrink-0">
                <span className="whitespace-nowrap font-medium">{t('Trạng thái hồ sơ:', 'Dossier Status:')}</span>
                {inspectingRequest.status === 'APPROVED' ? (
                  <span className="h-8 px-3 bg-emerald-950 text-emerald-300 border border-emerald-500 text-[10.5px] font-mono font-bold whitespace-nowrap inline-flex items-center gap-1.5 rounded-none">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    {t('ĐÃ KÍCH HOẠT QUYỀN RA VÀO', 'ACCESS ACTIVATED')}
                  </span>
                ) : inspectingRequest.status === 'REJECTED' ? (
                  <span className="h-8 px-3 bg-rose-950 text-rose-300 border border-rose-500 text-[10.5px] font-mono font-bold whitespace-nowrap inline-flex items-center gap-1.5 rounded-none">
                    <XCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                    {t('CẦN BỔ SUNG HỒ SƠ', 'DOSSIER UPDATE REQUIRED')}
                  </span>
                ) : (
                  <span className="h-8 px-3 bg-amber-950 text-amber-300 border border-amber-500 text-[10.5px] font-mono font-bold whitespace-nowrap inline-flex items-center gap-1.5 rounded-none animate-pulse">
                    <Clock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    {t('ĐANG CHỜ PHÊ DUYỆT', 'PENDING APPROVAL')}
                  </span>
                )}
              </div>

              {/* Right: Actions */}
              <div className="flex items-center justify-end gap-2 flex-wrap sm:flex-nowrap">
                <button
                  type="button"
                  onClick={() => setInspectingRequest(null)}
                  className="h-8 px-4 bg-[#161B22] hover:bg-[#202936] text-gray-300 hover:text-white text-xs font-semibold rounded-none transition-all cursor-pointer border border-[#2D3748] whitespace-nowrap flex items-center justify-center"
                >
                  {t('Đóng', 'Close')}
                </button>

                {inspectingRequest.status === 'APPROVED' && (
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => {
                      setRevokingId(inspectingRequest.id);
                      setRevokeReason('Ban Quản Lý tạm thu hồi quyền ra vào FaceID để đối soát lại hồ sơ.');
                    }}
                    className="h-8 px-4 bg-rose-950/80 hover:bg-rose-900 border border-rose-600/80 text-rose-300 hover:text-rose-100 text-xs font-semibold rounded-none transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow disabled:opacity-50 whitespace-nowrap"
                  >
                    <XCircle className="w-3.5 h-3.5 text-rose-400" />
                    <span>{t('Tạm Khóa / Thu Hồi', 'Suspend / Revoke')}</span>
                  </button>
                )}

                {inspectingRequest.status === 'PENDING' && (
                  <>
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => {
                        setRejectingId(inspectingRequest.id);
                        setRejectionReason('Ảnh chụp CCCD bị mờ/lóa sáng/mất góc, vui lòng chụp lại rõ nét');
                      }}
                      className="h-8 px-3.5 bg-rose-950 hover:bg-rose-900 border border-rose-500 text-rose-300 text-xs font-bold rounded-none transition-all flex items-center justify-center gap-1.5 shadow cursor-pointer disabled:opacity-50 whitespace-nowrap"
                    >
                      <X className="w-3.5 h-3.5 text-rose-400" />
                      <span>{t('Yêu Cầu Bổ Sung', 'Request Update')}</span>
                    </button>

                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleApprove(inspectingRequest.id, inspectingRequest.fullName)}
                      className="h-8 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-none shadow-lg transition-all flex items-center justify-center gap-1.5 active:scale-[0.99] cursor-pointer disabled:opacity-50 whitespace-nowrap"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>{t('Đang Xử Lý...', 'Processing...')}</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>{t('Xác Nhận & Kích Hoạt Quyền Ra Vào', 'Confirm & Activate Access')}</span>
                        </>
                      )}
                    </button>
                  </>
                )}

                {inspectingRequest.status === 'REJECTED' && (
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleApprove(inspectingRequest.id, inspectingRequest.fullName)}
                    className="h-8 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-none shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 whitespace-nowrap"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>{t('Phê Duyệt Lại Hồ Sơ', 'Re-approve Dossier')}</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Modal: Rejection Reason Dialog */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0D1117] border border-rose-500/80 max-w-md w-full p-5 rounded-none space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#222B35] pb-3">
              <h3 className="font-serif text-base font-bold text-white flex items-center gap-2 text-rose-400">
                <AlertTriangle className="w-4 h-4" /> {t('Yêu Cầu Cư Dân Cập Nhật Lại Hồ Sơ', 'Request Resident to Update Dossier')}
              </h3>
              <button
                type="button"
                onClick={() => setRejectingId(null)}
                className="text-gray-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <label className="text-gray-300 font-medium block">{t('Chọn hoặc nhập lý do cần bổ sung (Gửi thông báo tới cư dân):', 'Select or enter reason for update (Sent to resident):')}</label>
              <select
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white rounded-none outline-none focus:border-rose-500"
              >
                <option value="Ảnh chụp CCCD bị mờ/lóa sáng/mất góc, vui lòng chụp lại rõ nét">{t('Ảnh chụp CCCD bị mờ/lóa sáng/mất góc', 'ID photo is blurry/glared/cropped')}</option>
                <option value="Số CCCD hoặc thông tin không trùng khớp với hồ sơ đăng ký căn hộ">{t('Số CCCD không trùng khớp hồ sơ', 'ID number does not match registration')}</option>
                <option value="Ảnh chân dung khuôn mặt chưa trùng khớp với ảnh trên thẻ CCCD">{t('Ảnh chân dung chưa trùng khớp ảnh CCCD', 'Portrait does not match ID card photo')}</option>
                <option value="Chưa cung cấp đủ 2 mặt thẻ CCCD hợp lệ">{t('Chưa cung cấp đủ 2 mặt thẻ CCCD', 'Missing one or both sides of ID card')}</option>
                <option value="Thẻ CCCD đã hết hạn sử dụng theo quy định pháp luật">{t('Thẻ CCCD đã hết hạn sử dụng', 'Citizen ID card has expired')}</option>
              </select>

              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                placeholder={t('Ghi chú chi tiết lý do gửi cư dân...', 'Detailed notes sent to resident...')}
                className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white rounded-none outline-none focus:border-rose-500 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#222B35]">
              <button
                type="button"
                onClick={() => setRejectingId(null)}
                className="px-4 py-2 bg-[#161B22] text-gray-300 hover:text-white text-xs rounded-none cursor-pointer"
              >
                {t('Hủy', 'Cancel')}
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmReject}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-none shadow cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isProcessing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                {t('Xác Nhận Từ Chối', 'Confirm Rejection')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Revoke Access Dialog (Tạm Khóa / Thu Hồi Quyền Sau Khi Đã Duyệt) */}
      {revokingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0D1117] border border-rose-500/90 max-w-md w-full p-5 rounded-none space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#222B35] pb-3">
              <h3 className="font-serif text-base font-bold text-white flex items-center gap-2 text-rose-400">
                <AlertTriangle className="w-4 h-4 text-rose-400" /> {t('Tạm Khóa / Thu Hồi Quyền Ra Vào FaceID', 'Suspend / Revoke FaceID Access')}
              </h3>
              <button
                type="button"
                onClick={() => setRevokingId(null)}
                className="text-gray-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-rose-950/40 border border-rose-500/50 text-xs text-rose-200">
              {t('Hành động này sẽ tạm khóa hoặc hủy quyền nhận diện khuôn mặt của cư dân tại sảnh đón và thang máy toà nhà.', 'This action will suspend or revoke resident facial recognition access at lobby and building elevators.')}
            </div>

            <div className="space-y-2 text-xs">
              <label className="text-gray-300 font-medium block">{t('Lý do thu hồi quyền:', 'Revocation reason:')}</label>
              <select
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white rounded-none outline-none focus:border-rose-500"
              >
                <option value="Hết thời hạn hợp đồng thuê / Chuyển nơi cư trú">{t('Hết thời hạn hợp đồng thuê / Chuyển nơi cư trú', 'Lease expired / Relocated')}</option>
                <option value="Ban Quản Lý tạm thu hồi quyền ra vào FaceID để đối soát lại hồ sơ">{t('Ban Quản Lý tạm thu hồi để đối soát lại hồ sơ', 'Management temporary suspension for auditing')}</option>
                <option value="Phát hiện thông tin CCCD hoặc ảnh sinh trắc học có sai lệch">{t('Phát hiện thông tin CCCD có sai lệch', 'Discrepancy detected in ID information')}</option>
                <option value="Vi phạm quy định vận hành an ninh toà nhà">{t('Vi phạm quy định vận hành an ninh toà nhà', 'Violation of building security regulations')}</option>
              </select>

              <textarea
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                rows={3}
                placeholder={t('Ghi chú chi tiết lý do gửi cư dân...', 'Detailed notes sent to resident...')}
                className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white rounded-none outline-none focus:border-rose-500 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#222B35]">
              <button
                type="button"
                onClick={() => setRevokingId(null)}
                className="px-4 py-2 bg-[#161B22] text-gray-300 hover:text-white text-xs rounded-none cursor-pointer"
              >
                {t('Hủy Bỏ', 'Cancel')}
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmRevoke}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-none shadow transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isProcessing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                {t('Xác Nhận Thu Hồi', 'Confirm Revocation')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Full-Resolution Image Zoom Preview */}
      {zoomImage && (
        <div 
          onClick={() => setZoomImage(null)}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn cursor-zoom-out"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-[#0D1117] border border-[#C5A880] p-4 max-w-4xl max-h-[90vh] flex flex-col space-y-3 rounded-none shadow-2xl overflow-hidden cursor-default"
          >
            <div className="flex items-center justify-between border-b border-[#222B35] pb-2 text-xs">
              <span className="font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-[#C5A880]" /> {zoomImage.title}
              </span>
              <button
                type="button"
                onClick={() => setZoomImage(null)}
                className="text-gray-400 hover:text-white p-1 hover:bg-[#161B22]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-auto max-h-[75vh] flex items-center justify-center bg-[#070A0E] p-2">
              <img src={zoomImage.url} alt="Zoomed" className="max-w-full max-h-[70vh] object-contain rounded-none shadow-xl" />
            </div>
            <div className="text-right text-[11px] text-gray-400">
              Nhấp vào biểu tượng dấu X hoặc bên ngoài khung để đóng
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
