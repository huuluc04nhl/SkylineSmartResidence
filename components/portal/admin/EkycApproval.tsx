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
  Filter
} from 'lucide-react';
import { 
  getEkycRequests, 
  approveEkycRequest, 
  rejectEkycRequest, 
  EkycRequest, 
  EkycStatus 
} from '@/lib/ekycStore';

export default function EkycApproval() {
  const [requests, setRequests] = useState<EkycRequest[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedRequest, setSelectedRequest] = useState<EkycRequest | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('Ảnh chụp CCCD bị lóa sáng, vui lòng chụp lại');
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const refreshList = () => {
    setRequests(getEkycRequests());
  };

  useEffect(() => {
    refreshList();
    const handleUpdate = () => refreshList();
    window.addEventListener('skyline_ekyc_updated', handleUpdate);
    return () => window.removeEventListener('skyline_ekyc_updated', handleUpdate);
  }, []);

  // Approve action
  const handleApprove = (id: string, name: string) => {
    const updated = approveEkycRequest(id, 'Ban Quản Lý Skyline');
    if (updated) {
      refreshList();
      setActionNotice({
        type: 'success',
        message: `Đã phê duyệt hồ sơ e-KYC của ${name} & Kích hoạt quyền FaceID thành công!`
      });
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  // Reject action
  const handleConfirmReject = () => {
    if (!rejectingId) return;
    const updated = rejectEkycRequest(rejectingId, rejectionReason, 'Ban Quản Lý Skyline');
    if (updated) {
      refreshList();
      setActionNotice({
        type: 'error',
        message: `Đã từ chối hồ sơ e-KYC: ${rejectionReason}`
      });
      setRejectingId(null);
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  const filteredRequests = requests.filter(r => {
    if (filterStatus === 'ALL') return true;
    return r.status === filterStatus;
  });

  const pendingCount = requests.filter(r => r.status === 'PENDING').length;

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
            Liên kết trực tiếp với dữ liệu cư dân gửi lên. Phê duyệt hồ sơ để tự động kích hoạt quyền ra vào FaceID, thang máy và tiện ích.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1.5 bg-amber-950/80 border border-amber-500 text-amber-300 font-bold rounded flex items-center gap-1.5 shadow">
            <Clock className="w-3.5 h-3.5" /> Chờ BQL Duyệt: {pendingCount}
          </span>
          <button
            type="button"
            onClick={refreshList}
            className="p-1.5 text-gray-400 hover:text-white bg-[#161B22] border border-[#2D3748] rounded transition-colors"
            title="Làm mới"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Action Notification */}
      {actionNotice && (
        <div className={`p-3.5 border text-xs font-semibold flex items-center gap-2.5 rounded-lg animate-fadeIn ${
          actionNotice.type === 'success' 
            ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300' 
            : 'bg-rose-950/80 border-rose-500 text-rose-300'
        }`}>
          {actionNotice.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{actionNotice.message}</span>
        </div>
      )}

      {/* Status Filter Tabs */}
      <div className="flex gap-2 border-b border-[#222B35] pb-2 text-xs">
        {[
          { id: 'ALL', label: 'Tất Cả Hồ Sơ' },
          { id: 'PENDING', label: `Chờ Duyệt (${pendingCount})` },
          { id: 'APPROVED', label: 'Đã Phê Duyệt' },
          { id: 'REJECTED', label: 'Bị Từ Chối' },
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilterStatus(tab.id)}
            className={`px-3 py-1.5 rounded transition-all font-semibold ${
              filterStatus === tab.id
                ? 'bg-[#C5A880] text-[#0D1117] shadow'
                : 'text-gray-400 hover:text-white bg-[#161B22] border border-[#222B35]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List of e-KYC Dossiers */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="p-12 text-center text-gray-400 bg-[#121820] border border-[#222B35] rounded-xl space-y-2">
            <UserCheck className="w-10 h-10 text-gray-600 mx-auto" />
            <div className="font-semibold text-white text-sm">Không có hồ sơ e-KYC nào trong mục này</div>
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
                        <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded border bg-amber-950/80 text-amber-300 border-amber-500/60">
                          {req.roleLabel}
                        </span>
                      </div>
                      <div className="text-xs text-gray-300">
                        Căn: <strong className="text-white font-mono">{req.apartmentCode}</strong> • SĐT: <span className="font-mono text-gray-400">{req.phone}</span>
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
                      <strong className="font-mono text-[#C5A880] text-sm">{req.idCardNo}</strong>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[10px] block">Ngày cấp:</span>
                      <span className="font-mono text-gray-200 text-xs">{req.idDate || '2022-08-18'}</span>
                    </div>
                    <div className="col-span-2 pt-1 border-t border-[#222B35] flex justify-between items-center text-[10px]">
                      <span className="text-gray-400 truncate">Nơi cấp: {req.idPlace}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedRequest(req)}
                        className="text-[#C5A880] hover:text-white font-bold flex items-center gap-1 underline flex-shrink-0 ml-2"
                      >
                        <Eye className="w-3 h-3" /> Xem Ảnh Thẻ
                      </button>
                    </div>
                  </div>

                  {/* Right: Actions & Status Badge */}
                  <div className="lg:col-span-3 flex flex-col items-end justify-center gap-2">
                    {isPending && (
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => handleApprove(req.id, req.fullName)}
                          className="flex-1 sm:flex-none px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow transition-all flex items-center justify-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" /> Phê Duyệt
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRejectingId(req.id);
                            setRejectionReason('Ảnh chụp CCCD bị mờ/lóa sáng, vui lòng chụp lại rõ nét');
                          }}
                          className="flex-1 sm:flex-none px-3 py-2 bg-rose-950 hover:bg-rose-900 border border-rose-500 text-rose-300 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" /> Từ Chối
                        </button>
                      </div>
                    )}

                    {isApproved && (
                      <div className="text-right space-y-0.5">
                        <span className="px-3 py-1 bg-emerald-950 text-emerald-300 border border-emerald-500 text-xs font-bold rounded inline-flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Đã Kích Hoạt FaceID
                        </span>
                        <div className="text-[10px] text-gray-400">Duyệt bởi: {req.reviewedBy}</div>
                      </div>
                    )}

                    {isRejected && (
                      <div className="text-right space-y-0.5">
                        <span className="px-3 py-1 bg-rose-950 text-rose-300 border border-rose-500 text-xs font-bold rounded inline-flex items-center gap-1.5">
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

      {/* Modal: View ID Card Images (Front & Back) */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0D1117] border border-[#C5A880] max-w-2xl w-full p-5 rounded-xl space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#222B35] pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-white">Ảnh Thẻ Căn Cước (e-KYC)</h3>
                <div className="text-xs text-[#C5A880]">{selectedRequest.fullName} • Căn {selectedRequest.apartmentCode} • Số: {selectedRequest.idCardNo}</div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 text-center">
                <span className="text-xs font-semibold text-gray-300">1. Mặt Trước Thẻ CCCD</span>
                <div className="h-44 bg-black border border-[#222B35] rounded-lg overflow-hidden flex items-center justify-center">
                  <img
                    src={selectedRequest.idCardFrontUrl}
                    alt="CCCD Mặt Trước"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-center">
                <span className="text-xs font-semibold text-gray-300">2. Mặt Sau Thẻ CCCD</span>
                <div className="h-44 bg-black border border-[#222B35] rounded-lg overflow-hidden flex items-center justify-center">
                  <img
                    src={selectedRequest.idCardBackUrl}
                    alt="CCCD Mặt Sau"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#222B35]">
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 bg-[#1C2533] hover:bg-[#253245] text-white text-xs font-semibold rounded"
              >
                Đóng
              </button>
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
                className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white rounded outline-none focus:border-rose-500"
              >
                <option value="Ảnh chụp CCCD bị mờ/lóa sáng, vui lòng chụp lại rõ nét">Ảnh chụp CCCD bị mờ/lóa sáng</option>
                <option value="Số CCCD không trùng khớp với hồ sơ đăng ký căn hộ">Số CCCD không trùng khớp</option>
                <option value="Ảnh chân dung FaceID không rõ mặt hoặc ngược sáng">Ảnh FaceID không rõ mặt</option>
                <option value="Chưa cung cấp đủ 2 mặt thẻ CCCD hợp lệ">Chưa đủ 2 mặt CCCD</option>
              </select>

              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                placeholder="Ghi chú chi tiết lý do..."
                className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white rounded outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#222B35]">
              <button
                type="button"
                onClick={() => setRejectingId(null)}
                className="px-4 py-2 bg-[#161B22] text-gray-300 hover:text-white text-xs rounded"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded shadow"
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
