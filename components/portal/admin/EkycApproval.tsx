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

export default function EkycApproval() {
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
            <UserCheck className="w-3.5 h-3.5 text-[#C5A880]" /> Xác Thực Cư Dân • Ban Quản Lý
          </div>
          <h2 className="font-serif text-2xl text-white font-bold mt-1">
            Xác Thực Căn Cước Công Dân &amp; Kích Hoạt Quyền Ra Vào
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Kiểm tra và đối chiếu căn cước công dân với khuôn mặt cư dân trước khi kích hoạt quyền ra vào thang máy và sảnh đón.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={refreshList}
            className="px-3 py-1.5 text-gray-300 hover:text-white bg-[#161B22] border border-[#2D3748] rounded-none transition-colors flex items-center gap-1.5 shadow"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Làm Mới
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
          <div className="text-gray-400 text-[11px]">Tổng Hồ Sơ Tiếp Nhận</div>
          <div className="text-xl font-bold font-mono text-white">{requests.length}</div>
        </div>

        <div 
          onClick={() => setFilterStatus('PENDING')}
          className={`p-4 bg-[#121820] border rounded-none space-y-1 cursor-pointer transition-all ${
            filterStatus === 'PENDING' ? 'border-amber-500 bg-amber-950/20' : 'border-[#222B35] hover:border-amber-500/50'
          }`}
        >
          <div className="text-amber-400 text-[11px] flex items-center gap-1 font-semibold">
            <Clock className="w-3 h-3 animate-pulse" /> Đang Chờ Xác Thực
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
            <CheckCircle2 className="w-3 h-3" /> Đã Kích Hoạt Quyền Ra Vào
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
            <XCircle className="w-3 h-3" /> Cần Cập Nhật / Chụp Lại
          </div>
          <div className="text-xl font-bold font-mono text-rose-300">{rejectedCount}</div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222B35] pb-3">
        <div className="flex gap-1.5 text-xs overflow-x-auto">
          {[
            { id: 'ALL', label: 'Tất Cả' },
            { id: 'PENDING', label: `Chờ Xác Thực (${pendingCount})` },
            { id: 'APPROVED', label: `Đã Kích Hoạt (${approvedCount})` },
            { id: 'REJECTED', label: `Cần Bổ Sung (${rejectedCount})` },
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
            placeholder="Tìm theo Căn hộ (CH-06), Tên, CCCD..."
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
                        Căn Hộ: <strong className="text-white font-mono">{req.apartmentCode}</strong> • SĐT: <span className="font-mono text-gray-400">{req.phone}</span>
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono">
                        Nộp lúc: {req.submittedAt}
                      </div>
                    </div>
                  </div>

                  {/* Middle: CCCD Details & Quick Previews */}
                  <div className="lg:col-span-5 flex items-center justify-between gap-3 bg-[#161D26] p-3 rounded-none border border-[#222B35]">
                    <div className="space-y-1 min-w-0 flex-1 text-xs">
                      <div>
                        <span className="text-gray-400 text-[10px] block">Số Căn Cước Công Dân:</span>
                        <strong className="font-mono text-[#C5A880] text-sm tracking-wider">{req.idCardNo}</strong>
                      </div>
                      <div className="flex items-center gap-2 text-[10.5px] text-gray-300">
                        <span>Cấp: <span className="font-mono">{req.idDate || 'N/A'}</span></span>
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
                        <Eye className="w-3 h-3" /> Kiểm Tra Đối Chiếu Chi Tiết
                      </button>
                    </div>

                    {/* CCCD Front/Back Mini Thumbnails */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {req.idCardFrontUrl && (
                        <div
                          onClick={() => setZoomImage({ url: req.idCardFrontUrl!, title: `Mặt trước CCCD - ${req.fullName}` })}
                          className="w-14 h-9 bg-black border border-gray-700 hover:border-[#C5A880] overflow-hidden cursor-pointer relative group"
                          title="Xem mặt trước CCCD"
                        >
                          <img src={req.idCardFrontUrl} alt="Trước" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[7px] text-gray-300 text-center font-mono">Trước</span>
                        </div>
                      )}
                      {req.idCardBackUrl && (
                        <div
                          onClick={() => setZoomImage({ url: req.idCardBackUrl!, title: `Mặt sau CCCD - ${req.fullName}` })}
                          className="w-14 h-9 bg-black border border-gray-700 hover:border-[#C5A880] overflow-hidden cursor-pointer relative group"
                          title="Xem mặt sau CCCD"
                        >
                          <img src={req.idCardBackUrl} alt="Sau" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[7px] text-gray-300 text-center font-mono">Sau</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions & Status Badge */}
                  <div className="lg:col-span-3 flex flex-col items-end justify-center gap-2">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      {isApproved ? (
                        <button
                          type="button"
                          onClick={() => {
                            setInspectingRequest(req);
                            setInspectingSide('FRONT');
                            setJustApprovedId(null);
                          }}
                          className="px-3 py-1.5 bg-[#121B24] hover:bg-[#1A2634] border border-emerald-500/60 text-emerald-300 text-xs font-semibold rounded-none transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-400" /> Xem Chi Tiết
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setInspectingRequest(req);
                            setInspectingSide('FRONT');
                            setJustApprovedId(null);
                          }}
                          className="px-3 py-1.5 bg-[#1C2533] hover:bg-[#2B394E] border border-gray-700 text-gray-200 text-xs font-semibold rounded-none transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#C5A880]" /> Kiểm Tra
                        </button>
                      )}

                      {isPending && (
                        <>
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleApprove(req.id, req.fullName)}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-none shadow transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5" /> Xác Nhận
                          </button>
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => {
                              setRejectingId(req.id);
                              setRejectionReason('Ảnh chụp CCCD bị mờ/lóa sáng, vui lòng chụp lại rõ nét');
                            }}
                            className="px-2.5 py-1.5 bg-rose-950 hover:bg-rose-900 border border-rose-500 text-rose-300 text-xs font-semibold rounded-none transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <X className="w-3.5 h-3.5" /> Báo Chụp Lại
                          </button>
                        </>
                      )}
                    </div>

                    {isApproved && (
                      <div className="text-right space-y-1">
                        <span className="px-3 py-1 bg-emerald-950 text-emerald-300 border border-emerald-500 text-xs font-bold rounded-none inline-flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Đã Kích Hoạt Quyền Ra Vào
                        </span>
                        <div className="text-[10px] text-gray-400 flex items-center justify-end gap-1 font-mono">
                          {req.reviewedAt && <span>Duyệt: {req.reviewedAt}</span>}
                          {req.reviewedAt && <span>•</span>}
                          <button
                            type="button"
                            onClick={() => {
                              setRevokingId(req.id);
                              setRevokeReason('Ban Quản Lý tạm thu hồi quyền ra vào FaceID để đối soát lại hồ sơ.');
                            }}
                            className="text-rose-400 hover:text-rose-300 underline cursor-pointer"
                          >
                            Thu hồi
                          </button>
                        </div>
                      </div>
                    )}

                    {isRejected && (
                      <div className="text-right space-y-0.5">
                        <span className="px-3 py-1 bg-rose-950 text-rose-300 border border-rose-500 text-xs font-bold rounded-none inline-flex items-center gap-1.5">
                          <XCircle className="w-3.5 h-3.5" /> Cần Cập Nhật Lại
                        </span>
                        <div className="text-[10px] text-rose-400 max-w-[180px] truncate" title={req.rejectionReason}>
                          Lý do: {req.rejectionReason}
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
          <div className="bg-[#0D1117] border border-[#C5A880]/70 max-w-3xl w-full p-6 rounded-none space-y-5 shadow-2xl overflow-y-auto max-h-[92vh]">
            
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
                    <span>Hệ Thống Thẩm Định BQL • Căn Hộ {inspectingRequest.apartmentCode}</span>
                    {inspectingRequest.status === 'APPROVED' && (
                      <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-500 text-emerald-300 font-mono text-[9px] font-bold uppercase rounded-none">
                        ✓ ĐÃ KÍCH HOẠT HỆ THỐNG
                      </span>
                    )}
                    {inspectingRequest.status === 'REJECTED' && (
                      <span className="px-2 py-0.5 bg-rose-950 border border-rose-500 text-rose-300 font-mono text-[9px] font-bold uppercase rounded-none">
                        ⚠ YÊU CẦU CẬP NHẬT
                      </span>
                    )}
                    {inspectingRequest.status === 'PENDING' && (
                      <span className="px-2 py-0.5 bg-amber-950 border border-amber-500 text-amber-300 font-mono text-[9px] font-bold uppercase rounded-none animate-pulse">
                        ⏳ CHỜ THẨM ĐỊNH
                      </span>
                    )}
                    {inspectingRequest.roleLabel.includes('Bảo lãnh') && (
                      <span className="px-2 py-0.5 bg-purple-950/90 border border-purple-500/80 text-purple-300 font-sans text-[10px] rounded-none normal-case font-semibold flex items-center gap-1">
                        <Users className="w-3 h-3 text-purple-400" /> Được Chủ Hộ Bảo Lãnh
                      </span>
                    )}
                  </div>
                  <h3 className="font-serif text-lg font-bold text-white mt-0.5">
                    Đối Chiếu Khuôn Mặt Cư Dân &amp; Thẻ Căn Cước: {inspectingRequest.fullName}
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
                    <strong>Phê duyệt thành công!</strong> Đã kích hoạt sinh trắc học FaceID và nạp dữ liệu nhận diện vào Camera AI cổng Barrier và Thang máy toà nhà.
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-900/50 px-2 py-0.5">Thời gian thực</span>
              </div>
            )}



            {/* Thông báo lý do từ chối (Dành cho hồ sơ REJECTED) */}
            {inspectingRequest.status === 'REJECTED' && (
              <div className="p-4 bg-rose-950/60 border border-rose-500/70 rounded-none space-y-2">
                <div className="flex items-center gap-2 text-rose-300 font-bold text-xs uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  Hồ Sơ Đã Bị Từ Chối / Yêu Cầu Cung Cấp Lại
                </div>
                <div className="text-xs text-rose-200 bg-black/40 p-2.5 border border-rose-900/60 space-y-1">
                  <span className="text-gray-400 block text-[10px]">Lý do từ chối gửi cư dân:</span>
                  <strong>&quot;{inspectingRequest.rejectionReason || 'Ảnh chụp CCCD không đạt tiêu chuẩn rõ nét.'}&quot;</strong>
                </div>
                <div className="text-[10.5px] text-gray-400 font-mono">
                  Xử lý lúc: {inspectingRequest.reviewedAt} • Bởi: {inspectingRequest.reviewedBy}
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
                          <Camera className="w-3.5 h-3.5 text-[#C5A880]" /> Ảnh Chân Dung Nhận Diện:
                        </span>
                        <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-500/50 rounded-none font-mono text-[10px]">
                          Độ Trùng Khớp: {inspectingRequest.faceScore}%
                        </span>
                      </div>
                      
                      <div className="w-36 h-44 sm:w-40 sm:h-48 mx-auto rounded-none overflow-hidden border-2 border-[#C5A880] shadow-lg bg-[#0A0E14] relative group cursor-pointer"
                           onClick={() => setZoomImage({ url: inspectingRequest.avatarUrl || samples?.front || '', title: `Chân dung FaceID - ${inspectingRequest.fullName}` })}>
                        <img
                          src={inspectingRequest.avatarUrl || samples?.front || 'https://data.nks.vn/storage/users/default.png'}
                          alt="FaceID Portrait"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <ZoomIn className="w-6 h-6 text-white" />
                        </div>
                        <div className="absolute bottom-2 inset-x-2 bg-black/70 backdrop-blur text-[9px] font-mono text-[#C5A880] py-0.5 rounded-none">
                          CHÂN DUNG CHÍNH DIỆN
                        </div>
                      </div>

                      {/* 4 Multi-angle samples if enrolled */}
                      {samples && (
                        <div className="space-y-1.5 pt-2 border-t border-[#222B35]">
                          <div className="text-[10px] uppercase font-bold text-[#C5A880] tracking-wider flex items-center justify-between">
                            <span>Bộ Mẫu Thu Thập 4 Góc Mặt:</span>
                            <span className="text-emerald-400 font-mono text-[9px]">Liveness 100%</span>
                          </div>
                          <div className="grid grid-cols-4 gap-1.5">
                            {[
                              { label: 'Chính diện', img: samples.front },
                              { label: 'Trái (-25°)', img: samples.left },
                              { label: 'Phải (+25°)', img: samples.right },
                              { label: 'Xác thực', img: samples.smile },
                            ].map((s, idx) => (
                              <div key={idx} 
                                   onClick={() => s.img && setZoomImage({ url: s.img, title: `Mẫu góc ${s.label} - ${inspectingRequest.fullName}` })}
                                   className="border border-[#263140] bg-black aspect-square overflow-hidden relative group cursor-pointer">
                                {s.img ? (
                                  <img src={s.img} alt={s.label} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-500">Chưa có</div>
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
                        {samples ? 'Dữ liệu nhận diện khuôn mặt đã sẵn sàng kích hoạt quyền ra vào sảnh & thang máy' : 'Ảnh chân dung chụp trực tiếp từ thiết bị'}
                      </div>
                    </div>

                    {/* 2. CCCD Card (Interactive Front/Back & Both views) */}
                    <div className="p-4 bg-[#161D26] border border-[#2D3748] rounded-none space-y-3 text-center flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between text-xs text-gray-300 font-semibold border-b border-[#222B35] pb-2">
                          <span className="flex items-center gap-1.5">
                            <CreditCard className="w-3.5 h-3.5 text-[#C5A880]" /> Thẻ Căn Cước Công Dân:
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
                              Mặt Trước
                            </button>
                            <button
                              type="button"
                              onClick={() => setInspectingSide('BACK')}
                              className={`px-2.5 py-1 rounded-none font-bold transition-all ${
                                inspectingSide === 'BACK' ? 'bg-[#C5A880] text-[#0D1117]' : 'text-gray-400 hover:text-white'
                              }`}
                            >
                              Mặt Sau
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
                                    title: inspectingSide === 'FRONT' ? `Mặt trước CCCD - ${inspectingRequest.fullName}` : `Mặt sau CCCD - ${inspectingRequest.fullName}`
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
                                    {inspectingSide === 'FRONT' ? 'Chưa Tải Ảnh Mặt Trước CCCD' : 'Chưa Tải Ảnh Mặt Sau CCCD'}
                                  </div>
                                  <div className="text-[10px] text-gray-400 font-mono">
                                    Số CCCD: {inspectingRequest.idCardNo || 'Chưa cung cấp'}
                                  </div>
                                </div>
                              )}
                              <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/80 backdrop-blur rounded-none text-[9.5px] font-mono text-gray-300">
                                {inspectingSide === 'FRONT' ? 'MẶT TRƯỚC (CÓ ẢNH & SỐ ĐỊNH DANH)' : 'MẶT SAU (CHIP ĐIỆN TỬ & VÂN TAY)'}
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Dual-Side Mini Bar */}
                      <div className="pt-2 border-t border-[#222B35] flex items-center justify-between text-[11px] text-gray-400">
                        <span>Nhấp vào ảnh để phóng to toàn màn hình</span>
                        <div className="flex gap-1 font-mono text-[10px]">
                          <span className={inspectingRequest.idCardFrontUrl ? 'text-emerald-400' : 'text-amber-400'}>
                            {inspectingRequest.idCardFrontUrl ? '✓ Mặt trước Đầy Đủ' : '⚠ Chưa Có Mặt Trước'}
                          </span>
                          <span>•</span>
                          <span className={inspectingRequest.idCardBackUrl ? 'text-emerald-400' : 'text-amber-400'}>
                            {inspectingRequest.idCardBackUrl ? '✓ Mặt Sau Đầy Đủ' : '⚠ Chưa Có Mặt Sau'}
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
                          Đạt Tiêu Chuẩn Xác Thực &amp; Đủ Điều Kiện Kích Hoạt Quyền Ra Vào
                        </span>
                      ) : (
                        <span className="text-rose-400 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-rose-400" />
                          Cần Kiểm Tra: Ảnh Khuôn Mặt Chưa Khớp Hoặc Thẻ CCCD Mờ
                        </span>
                      )}
                    </div>
                    <p className="text-[11.5px] text-gray-300">
                      {isEligible
                        ? `Ảnh khuôn mặt trùng khớp với chân dung trên CCCD (${displayScore.toFixed(1)}% ≥ 85%). Thẻ CCCD hợp lệ nằm ngang (tỷ lệ ${card.aspectRatio ? card.aspectRatio.toFixed(2) + ':1' : 'chuẩn'}).`
                        : `${bio.reason}. Vui lòng kiểm tra lại ảnh thẻ CCCD hoặc yêu cầu cư dân nộp lại chân dung rõ nét.`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 font-mono">
                    <div className={`px-3 py-1.5 rounded-none border font-bold text-xs ${
                      displayScore >= 85
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500/80'
                        : 'bg-rose-950 text-rose-300 border-rose-500/80'
                    }`}>
                      Độ Khớp: {displayScore.toFixed(1)}%
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Legal Information Verification Table */}
            <div className="p-4 bg-[#161D26] border border-[#2D3748] rounded-none space-y-3 text-xs">
              <div className="text-gray-300 font-bold flex items-center gap-1.5 border-b border-[#222B35] pb-2">
                <FileText className="w-3.5 h-3.5 text-[#C5A880]" /> Bảng Đối Chiếu Thông Tin Khai Báo &amp; Trích Xuất Thẻ:
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-gray-500 text-[10.5px] block">Họ và Tên:</span>
                  <strong className="text-white text-sm">{inspectingRequest.fullName}</strong>
                </div>

                <div>
                  <span className="text-gray-500 text-[10.5px] block">Số Căn Cước Công Dân:</span>
                  <strong className="text-[#C5A880] font-mono text-sm tracking-wider">{inspectingRequest.idCardNo}</strong>
                </div>

                <div>
                  <span className="text-gray-500 text-[10.5px] block">Căn Hộ & Vai Trò:</span>
                  <strong className="text-white font-mono">Căn {inspectingRequest.apartmentCode}</strong> ({inspectingRequest.roleLabel})
                </div>

                <div>
                  <span className="text-gray-500 text-[10.5px] block">Ngày Sinh:</span>
                  <span className="text-gray-200 font-mono">{inspectingRequest.dob || 'Chưa cập nhật'}</span>
                </div>

                <div>
                  <span className="text-gray-500 text-[10.5px] block">Ngày Cấp & Nơi Cấp:</span>
                  <span className="text-gray-200">
                    {inspectingRequest.idDate || 'Chưa cập nhật'}
                    {inspectingRequest.idPlace ? ` • ${inspectingRequest.idPlace}` : ''}
                  </span>
                </div>

                <div>
                  <span className="text-gray-500 text-[10.5px] block">Số Điện Thoại:</span>
                  <span className="text-gray-200 font-mono">{inspectingRequest.phone}</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#222B35]">
              <div className="text-xs text-gray-400 flex items-center gap-2">
                <span>Trạng thái hồ sơ:</span>
                {inspectingRequest.status === 'APPROVED' ? (
                  <span className="px-2.5 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-500 text-[10px] font-mono font-bold">
                    ĐÃ KÍCH HOẠT QUYỀN RA VÀO
                  </span>
                ) : inspectingRequest.status === 'REJECTED' ? (
                  <span className="px-2.5 py-0.5 bg-rose-950 text-rose-300 border border-rose-500 text-[10px] font-mono font-bold">
                    CẦN BỔ SUNG HỒ SƠ
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 bg-amber-950 text-amber-300 border border-amber-500 text-[10px] font-mono font-bold animate-pulse">
                    ĐANG CHỜ PHÊ DUYỆT
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setInspectingRequest(null)}
                  className="px-4 py-2 bg-[#161B22] hover:bg-[#202936] text-gray-300 hover:text-white text-xs font-semibold rounded-none transition-all cursor-pointer border border-[#2D3748]"
                >
                  Đóng
                </button>

                {/* Nếu hồ sơ ĐÃ ĐƯỢC DUYỆT: Cho phép Thu hồi quyền nếu cần */}
                {inspectingRequest.status === 'APPROVED' && (
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => {
                      setRevokingId(inspectingRequest.id);
                      setRevokeReason('Ban Quản Lý tạm thu hồi quyền ra vào FaceID để đối soát lại hồ sơ.');
                    }}
                    className="px-4 py-2 bg-rose-950/80 hover:bg-rose-900 border border-rose-600/80 text-rose-300 hover:text-rose-100 text-xs font-semibold rounded-none transition-all flex items-center gap-1.5 cursor-pointer shadow disabled:opacity-50"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Tạm Khóa / Thu Hồi Quyền
                  </button>
                )}

                {/* Nếu hồ sơ ĐANG CHỜ DUYỆT: Hiện nút Xác nhận và Yêu cầu bổ sung */}
                {inspectingRequest.status === 'PENDING' && (
                  <>
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => {
                        setRejectingId(inspectingRequest.id);
                        setRejectionReason('Ảnh chụp CCCD bị mờ/lóa sáng/mất góc, vui lòng chụp lại rõ nét');
                      }}
                      className="px-4 py-2 bg-rose-950 hover:bg-rose-900 border border-rose-500 text-rose-300 text-xs font-bold rounded-none transition-all flex items-center gap-1.5 shadow cursor-pointer disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" /> Yêu Cầu Bổ Sung
                    </button>

                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleApprove(inspectingRequest.id, inspectingRequest.fullName)}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-none shadow-lg transition-all flex items-center gap-1.5 active:scale-[0.99] cursor-pointer disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Đang Xử Lý...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" /> Xác Nhận Hợp Lệ &amp; Kích Hoạt Quyền Ra Vào
                        </>
                      )}
                    </button>
                  </>
                )}

                {/* Nếu hồ sơ BỊ TỪ CHỐI: Cho phép phê duyệt lại nếu cư dân đã hoàn tất giải trình */}
                {inspectingRequest.status === 'REJECTED' && (
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleApprove(inspectingRequest.id, inspectingRequest.fullName)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-none shadow transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RotateCw className="w-3.5 h-3.5" /> Phê Duyệt Lại Hồ Sơ Này
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
                <AlertTriangle className="w-4 h-4" /> Yêu Cầu Cư Dân Cập Nhật Lại Hồ Sơ
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
              <label className="text-gray-300 font-medium block">Chọn hoặc nhập lý do cần bổ sung (Gửi thông báo tới cư dân):</label>
              <select
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white rounded-none outline-none focus:border-rose-500"
              >
                <option value="Ảnh chụp CCCD bị mờ/lóa sáng/mất góc, vui lòng chụp lại rõ nét">Ảnh chụp CCCD bị mờ/lóa sáng/mất góc</option>
                <option value="Số CCCD hoặc thông tin không trùng khớp với hồ sơ đăng ký căn hộ">Số CCCD không trùng khớp hồ sơ</option>
                <option value="Ảnh chân dung khuôn mặt chưa trùng khớp với ảnh trên thẻ CCCD">Ảnh chân dung chưa trùng khớp ảnh CCCD</option>
                <option value="Chưa cung cấp đủ 2 mặt thẻ CCCD hợp lệ">Chưa cung cấp đủ 2 mặt thẻ CCCD</option>
                <option value="Thẻ CCCD đã hết hạn sử dụng theo quy định pháp luật">Thẻ CCCD đã hết hạn sử dụng</option>
              </select>

              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                placeholder="Ghi chú chi tiết lý do gửi cư dân..."
                className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white rounded-none outline-none focus:border-rose-500 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#222B35]">
              <button
                type="button"
                onClick={() => setRejectingId(null)}
                className="px-4 py-2 bg-[#161B22] text-gray-300 hover:text-white text-xs rounded-none cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmReject}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-none shadow cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isProcessing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                Xác Nhận Từ Chối
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
                <AlertTriangle className="w-4 h-4 text-rose-400" /> Tạm Khóa / Thu Hồi Quyền Ra Vào FaceID
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
              Hành động này sẽ <strong>tạm khóa hoặc hủy quyền nhận diện khuôn mặt</strong> của cư dân tại sảnh đón và thang máy toà nhà.
            </div>

            <div className="space-y-2 text-xs">
              <label className="text-gray-300 font-medium block">Lý do thu hồi quyền:</label>
              <select
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white rounded-none outline-none focus:border-rose-500"
              >
                <option value="Hết thời hạn hợp đồng thuê / Chuyển nơi cư trú">Hết thời hạn hợp đồng thuê / Chuyển nơi cư trú</option>
                <option value="Ban Quản Lý tạm thu hồi quyền ra vào FaceID để đối soát lại hồ sơ">Ban Quản Lý tạm thu hồi để đối soát lại hồ sơ</option>
                <option value="Phát hiện thông tin CCCD hoặc ảnh sinh trắc học có sai lệch">Phát hiện thông tin CCCD có sai lệch</option>
                <option value="Vi phạm quy định vận hành an ninh toà nhà">Vi phạm quy định vận hành an ninh toà nhà</option>
              </select>

              <textarea
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                rows={3}
                placeholder="Ghi chú chi tiết lý do gửi cư dân..."
                className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white rounded-none outline-none focus:border-rose-500 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#222B35]">
              <button
                type="button"
                onClick={() => setRevokingId(null)}
                className="px-4 py-2 bg-[#161B22] text-gray-300 hover:text-white text-xs rounded-none cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmRevoke}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-none shadow transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isProcessing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                Xác Nhận Thu Hồi
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
