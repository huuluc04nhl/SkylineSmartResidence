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
  Users
} from 'lucide-react';
import { 
  getEkycRequests, 
  approveEkycRequest, 
  rejectEkycRequest, 
  EkycRequest 
} from '@/lib/ekycStore';

export default function EkycApproval() {
  const [requests, setRequests] = useState<EkycRequest[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Inspection & Dialog States
  const [inspectingRequest, setInspectingRequest] = useState<EkycRequest | null>(null);
  const [inspectingSide, setInspectingSide] = useState<'FRONT' | 'BACK'>('FRONT');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('Ảnh chụp CCCD bị lóa sáng/mờ nét, vui lòng chụp lại rõ nét');
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const refreshList = () => {
    setRequests(getEkycRequests());
  };

  useEffect(() => {
    refreshList();
    const handleUpdate = () => refreshList();
    window.addEventListener('skyline_ekyc_updated', handleUpdate);
    return () => window.removeEventListener('skyline_ekyc_updated', handleUpdate);
  }, []);

  // 1. Phê Duyệt Hồ Sơ e-KYC (Kích Hoạt FaceID & Đồng Bộ Căn Hộ)
  const handleApprove = async (id: string, name: string) => {
    setIsProcessing(true);
    try {
      // 1. Cập nhật local storage
      const updated = approveEkycRequest(id, 'Ban Quản Lý Skyline');

      // 2. Gửi API đồng bộ server
      try {
        await fetch('/api/nks/ekyc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'APPROVE',
            id,
            approverName: 'Ban Quản Lý Skyline',
          }),
        });
      } catch (e) {
        console.warn('API approve error:', e);
      }

      if (updated) {
        refreshList();
        setActionNotice({
          type: 'success',
          message: `Đã phê duyệt hồ sơ e-KYC của ${name} & Kích hoạt quyền FaceID thành công!`
        });
        if (inspectingRequest?.id === id) {
          setInspectingRequest(null);
        }
        setTimeout(() => setActionNotice(null), 4000);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Xác Nhận Từ Chối Hồ Sơ e-KYC (Kèm Lý Do Cụ Thể)
  const handleConfirmReject = async () => {
    if (!rejectingId) return;
    setIsProcessing(true);
    try {
      // 1. Cập nhật local storage
      const updated = rejectEkycRequest(rejectingId, rejectionReason, 'Ban Quản Lý Skyline');

      // 2. Gửi API đồng bộ server
      try {
        await fetch('/api/nks/ekyc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'REJECT',
            id: rejectingId,
            reason: rejectionReason,
            approverName: 'Ban Quản Lý Skyline',
          }),
        });
      } catch (e) {
        console.warn('API reject error:', e);
      }

      if (updated) {
        refreshList();
        setActionNotice({
          type: 'error',
          message: `Đã từ chối hồ sơ e-KYC: ${rejectionReason}`
        });
        if (inspectingRequest?.id === rejectingId) {
          setInspectingRequest(null);
        }
        setRejectingId(null);
        setTimeout(() => setActionNotice(null), 4000);
      }
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
            <UserCheck className="w-3.5 h-3.5 text-[#C5A880]" /> Trung Tâm Kiểm Duyệt e-KYC • Ban Quản Lý
          </div>
          <h2 className="font-serif text-2xl text-white font-bold mt-1">
            Phê Duyệt Hồ Sơ Định Danh e-KYC & Cấp Quyền FaceID
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Thẩm định đối chiếu ảnh chụp CCCD thật với khuôn mặt sinh trắc học của cư dân trước khi cấp quyền mở cửa thang máy và sảnh đón.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={refreshList}
            className="px-3 py-1.5 text-gray-300 hover:text-white bg-[#161B22] border border-[#2D3748] rounded-lg transition-colors flex items-center gap-1.5 shadow"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Làm Mới
          </button>
        </div>
      </div>

      {/* Action Notification */}
      {actionNotice && (
        <div className={`p-3.5 border text-xs font-semibold flex items-center gap-2.5 rounded-lg animate-fadeIn shadow-lg ${
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
        <div className="p-4 bg-[#121820] border border-[#222B35] rounded-xl space-y-1">
          <div className="text-gray-400 text-[11px]">Tổng Hồ Sơ Tiếp Nhận</div>
          <div className="text-xl font-bold font-mono text-white">{requests.length}</div>
        </div>

        <div 
          onClick={() => setFilterStatus('PENDING')}
          className={`p-4 bg-[#121820] border rounded-xl space-y-1 cursor-pointer transition-all ${
            filterStatus === 'PENDING' ? 'border-amber-500 bg-amber-950/20' : 'border-[#222B35] hover:border-amber-500/50'
          }`}
        >
          <div className="text-amber-400 text-[11px] flex items-center gap-1 font-semibold">
            <Clock className="w-3 h-3 animate-pulse" /> Đang Chờ BQL Thẩm Duyệt
          </div>
          <div className="text-xl font-bold font-mono text-amber-300">{pendingCount}</div>
        </div>

        <div 
          onClick={() => setFilterStatus('APPROVED')}
          className={`p-4 bg-[#121820] border rounded-xl space-y-1 cursor-pointer transition-all ${
            filterStatus === 'APPROVED' ? 'border-emerald-500 bg-emerald-950/20' : 'border-[#222B35] hover:border-emerald-500/50'
          }`}
        >
          <div className="text-emerald-400 text-[11px] flex items-center gap-1 font-semibold">
            <CheckCircle2 className="w-3 h-3" /> Đã Cấp Quyền FaceID
          </div>
          <div className="text-xl font-bold font-mono text-emerald-300">{approvedCount}</div>
        </div>

        <div 
          onClick={() => setFilterStatus('REJECTED')}
          className={`p-4 bg-[#121820] border rounded-xl space-y-1 cursor-pointer transition-all ${
            filterStatus === 'REJECTED' ? 'border-rose-500 bg-rose-950/20' : 'border-[#222B35] hover:border-rose-500/50'
          }`}
        >
          <div className="text-rose-400 text-[11px] flex items-center gap-1 font-semibold">
            <XCircle className="w-3 h-3" /> Bị Từ Chối (Chụp Lại)
          </div>
          <div className="text-xl font-bold font-mono text-rose-300">{rejectedCount}</div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222B35] pb-3">
        <div className="flex gap-1.5 text-xs overflow-x-auto">
          {[
            { id: 'ALL', label: 'Tất Cả' },
            { id: 'PENDING', label: `Chờ Duyệt (${pendingCount})` },
            { id: 'APPROVED', label: `Đã Duyệt (${approvedCount})` },
            { id: 'REJECTED', label: `Từ Chối (${rejectedCount})` },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg transition-all font-semibold ${
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
            placeholder="Tìm theo Căn hộ (12A05), Tên, CCCD..."
            className="w-full bg-[#161B22] border border-[#2D3748] pl-8 pr-3 py-1.5 text-xs text-white rounded-lg focus:outline-none focus:border-[#C5A880]"
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

      {/* List of e-KYC Dossiers */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="p-12 text-center text-gray-400 bg-[#121820] border border-[#222B35] rounded-xl space-y-2">
            <UserCheck className="w-10 h-10 text-gray-600 mx-auto" />
            <div className="font-semibold text-white text-sm">Không tìm thấy hồ sơ e-KYC nào</div>
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
                className={`p-5 bg-[#121820] border rounded-xl transition-all shadow-lg ${
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
                      <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-emerald-950 border border-emerald-500 text-emerald-400 text-[9px] font-mono font-bold rounded">
                        {req.faceScore}%
                      </span>
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-serif text-base font-bold text-white truncate">
                          {req.fullName}
                        </h3>
                        <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded border ${
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

                  {/* Middle: CCCD OCR Details */}
                  <div className="lg:col-span-5 grid grid-cols-2 gap-2 text-xs bg-[#161D26] p-3 rounded-lg border border-[#222B35]">
                    <div>
                      <span className="text-gray-400 text-[10px] block">Số CCCD (OCR):</span>
                      <strong className="font-mono text-[#C5A880] text-sm tracking-wider">{req.idCardNo}</strong>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[10px] block">Ngày cấp:</span>
                      <span className="font-mono text-gray-200 text-xs">{req.idDate || '18/08/2022'}</span>
                    </div>
                    <div className="col-span-2 pt-1 border-t border-[#222B35] flex justify-between items-center text-[10px]">
                      <span className="text-gray-400 truncate">Nơi cấp: {req.idPlace}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setInspectingRequest(req);
                          setInspectingSide('FRONT');
                        }}
                        className="text-[#C5A880] hover:text-white font-bold flex items-center gap-1 underline flex-shrink-0 ml-2"
                      >
                        <Eye className="w-3 h-3" /> Thẩm Định Hồ Sơ
                      </button>
                    </div>
                  </div>

                  {/* Right: Actions & Status Badge */}
                  <div className="lg:col-span-3 flex flex-col items-end justify-center gap-2">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setInspectingRequest(req);
                          setInspectingSide('FRONT');
                        }}
                        className="px-3 py-1.5 bg-[#1C2533] hover:bg-[#2B394E] border border-gray-700 text-gray-200 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#C5A880]" /> Thẩm Định
                      </button>

                      {isPending && (
                        <>
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleApprove(req.id, req.fullName)}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow transition-all flex items-center justify-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" /> Duyệt
                          </button>
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => {
                              setRejectingId(req.id);
                              setRejectionReason('Ảnh chụp CCCD bị mờ/lóa sáng, vui lòng chụp lại rõ nét');
                            }}
                            className="px-2.5 py-1.5 bg-rose-950 hover:bg-rose-900 border border-rose-500 text-rose-300 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" /> Từ Chối
                          </button>
                        </>
                      )}
                    </div>

                    {isApproved && (
                      <div className="text-right space-y-0.5">
                        <span className="px-3 py-1 bg-emerald-950 text-emerald-300 border border-emerald-500 text-xs font-bold rounded-lg inline-flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Đã Kích Hoạt FaceID
                        </span>
                        <div className="text-[10px] text-gray-400">Duyệt bởi: {req.reviewedBy}</div>
                      </div>
                    )}

                    {isRejected && (
                      <div className="text-right space-y-0.5">
                        <span className="px-3 py-1 bg-rose-950 text-rose-300 border border-rose-500 text-xs font-bold rounded-lg inline-flex items-center gap-1.5">
                          <XCircle className="w-3.5 h-3.5" /> Bị Từ Chối
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
          <div className="bg-[#0D1117] border border-[#C5A880]/70 max-w-3xl w-full p-6 rounded-2xl space-y-5 shadow-2xl overflow-y-auto max-h-[92vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#222B35] pb-3">
              <div>
                <div className="text-[10px] uppercase font-mono text-[#C5A880] font-bold flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> Thẩm Định Hồ Sơ e-KYC • Căn Hộ {inspectingRequest.apartmentCode}
                </div>
                <h3 className="font-serif text-lg font-bold text-white mt-0.5">
                  Đối Chiếu Sinh Trắc Học & Thẻ Căn Cước Công Dân
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectingRequest(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#161B22]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Visual Comparison: Portrait Face vs CCCD Photo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 1. FaceID Live Portrait */}
              <div className="p-4 bg-[#161D26] border border-[#2D3748] rounded-xl space-y-2 text-center">
                <div className="flex items-center justify-between text-xs text-gray-300 font-semibold border-b border-[#222B35] pb-2">
                  <span className="flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-[#C5A880]" /> Ảnh Chân Dung FaceID:
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-500/50 rounded font-mono text-[10px]">
                    Khớp {inspectingRequest.faceScore}%
                  </span>
                </div>
                
                <div className="w-36 h-48 sm:w-40 sm:h-52 mx-auto rounded-xl overflow-hidden border-2 border-[#C5A880] shadow-lg bg-[#0A0E14] relative">
                  <img
                    src={inspectingRequest.avatarUrl || 'https://data.nks.vn/storage/users/default.png'}
                    alt="FaceID Portrait"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 inset-x-2 bg-black/70 backdrop-blur text-[9.5px] font-mono text-[#C5A880] py-0.5 rounded">
                    512D VECTOR MATCH
                  </div>
                </div>
                <div className="text-[11px] text-gray-400">
                  Ảnh chụp camera trực tiếp của cư dân
                </div>
              </div>

              {/* 2. CCCD Card (Front / Back Toggle) */}
              <div className="p-4 bg-[#161D26] border border-[#2D3748] rounded-xl space-y-2 text-center">
                <div className="flex items-center justify-between text-xs text-gray-300 font-semibold border-b border-[#222B35] pb-2">
                  <span className="flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-[#C5A880]" /> Thẻ Căn Cước Công Dân:
                  </span>
                  
                  {/* Side Switcher */}
                  <div className="flex gap-1 bg-[#0D1117] p-0.5 rounded border border-gray-700 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setInspectingSide('FRONT')}
                      className={`px-2 py-0.5 rounded font-bold transition-all ${
                        inspectingSide === 'FRONT' ? 'bg-[#C5A880] text-[#0D1117]' : 'text-gray-400'
                      }`}
                    >
                      Mặt Trước
                    </button>
                    <button
                      type="button"
                      onClick={() => setInspectingSide('BACK')}
                      className={`px-2 py-0.5 rounded font-bold transition-all ${
                        inspectingSide === 'BACK' ? 'bg-[#C5A880] text-[#0D1117]' : 'text-gray-400'
                      }`}
                    >
                      Mặt Sau
                    </button>
                  </div>
                </div>

                <div className="w-full h-48 sm:h-52 rounded-xl overflow-hidden border border-white/20 shadow-lg bg-[#0A0E14] relative flex items-center justify-center">
                  <img
                    src={
                      inspectingSide === 'FRONT'
                        ? inspectingRequest.idCardFrontUrl || 'https://images.unsplash.com/photo-1578852612716-854e527abf2e?w=600'
                        : inspectingRequest.idCardBackUrl || inspectingRequest.idCardFrontUrl || 'https://images.unsplash.com/photo-1578852612716-854e527abf2e?w=600'
                    }
                    alt="CCCD"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/70 backdrop-blur rounded text-[9.5px] font-mono text-gray-300">
                    {inspectingSide === 'FRONT' ? 'MẶT TRƯỚC (CÓ ẢNH & SỐ)' : 'MẶT SAU (CHIP & VÂN TAY)'}
                  </div>
                </div>
                <div className="text-[11px] text-gray-400">
                  Ảnh chụp thẻ CCCD thật do cư dân tải lên
                </div>
              </div>
            </div>

            {/* Legal Information Verification Table */}
            <div className="p-4 bg-[#161D26] border border-[#2D3748] rounded-xl space-y-3 text-xs">
              <div className="text-gray-300 font-bold flex items-center gap-1.5 border-b border-[#222B35] pb-2">
                <FileText className="w-3.5 h-3.5 text-[#C5A880]" /> Bảng Đối Chiếu Thông Tin Khai Báo & OCR:
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
                  <span className="text-gray-200 font-mono">{inspectingRequest.dob || '18/08/2004'}</span>
                </div>

                <div>
                  <span className="text-gray-500 text-[10.5px] block">Ngày Cấp & Nơi Cấp:</span>
                  <span className="text-gray-200">{inspectingRequest.idDate || '18/08/2022'} • {inspectingRequest.idPlace}</span>
                </div>

                <div>
                  <span className="text-gray-500 text-[10.5px] block">Số Điện Thoại:</span>
                  <span className="text-gray-200 font-mono">{inspectingRequest.phone}</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-[#222B35]">
              <div className="text-xs text-gray-400">
                Trạng thái hiện tại: <strong className="text-white font-mono">{inspectingRequest.status}</strong>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setInspectingRequest(null)}
                  className="px-4 py-2 bg-[#161B22] hover:bg-[#202936] text-gray-300 text-xs font-semibold rounded-lg transition-all"
                >
                  Đóng
                </button>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => {
                    setRejectingId(inspectingRequest.id);
                    setRejectionReason('Ảnh chụp CCCD bị mờ/lóa sáng, vui lòng chụp lại rõ nét');
                  }}
                  className="px-4 py-2 bg-rose-950 hover:bg-rose-900 border border-rose-500 text-rose-300 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow"
                >
                  <X className="w-3.5 h-3.5" /> Từ Chối Hồ Sơ
                </button>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleApprove(inspectingRequest.id, inspectingRequest.fullName)}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-lg transition-all flex items-center gap-1.5 active:scale-[0.99]"
                >
                  <Check className="w-4 h-4" /> Phê Duyệt & Kích Hoạt Quyền FaceID
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Modal: Rejection Reason Dialog */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0D1117] border border-rose-500/80 max-w-md w-full p-5 rounded-xl space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#222B35] pb-3">
              <h3 className="font-serif text-base font-bold text-white flex items-center gap-2 text-rose-400">
                <AlertTriangle className="w-4 h-4" /> Từ Chối Hồ Sơ e-KYC
              </h3>
              <button
                type="button"
                onClick={() => setRejectingId(null)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <label className="text-gray-300 font-medium block">Chọn hoặc nhập lý do từ chối (Gửi tới cư dân):</label>
              <select
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white rounded-lg outline-none focus:border-rose-500"
              >
                <option value="Ảnh chụp CCCD bị mờ/lóa sáng/mất góc, vui lòng chụp lại rõ nét">Ảnh chụp CCCD bị mờ/lóa sáng/mất góc</option>
                <option value="Số CCCD hoặc thông tin không trùng khớp với hồ sơ đăng ký căn hộ">Số CCCD không trùng khớp hồ sơ</option>
                <option value="Ảnh chân dung FaceID không khớp với ảnh trên thẻ CCCD">Ảnh FaceID không khớp ảnh CCCD</option>
                <option value="Chưa cung cấp đủ 2 mặt thẻ CCCD hợp lệ">Chưa cung cấp đủ 2 mặt thẻ CCCD</option>
                <option value="Thẻ CCCD đã hết hạn sử dụng theo quy định pháp luật">Thẻ CCCD đã hết hạn sử dụng</option>
              </select>

              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                placeholder="Ghi chú chi tiết lý do gửi cư dân..."
                className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white rounded-lg outline-none focus:border-rose-500 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#222B35]">
              <button
                type="button"
                onClick={() => setRejectingId(null)}
                className="px-4 py-2 bg-[#161B22] text-gray-300 hover:text-white text-xs rounded-lg"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmReject}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg shadow"
              >
                Xác Nhận Từ Chối
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
