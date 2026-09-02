'use client';

import React, { useState, useEffect } from 'react';
import { 
  QrCode, 
  Check, 
  X, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Scan, 
  Search, 
  Filter, 
  Building, 
  Phone, 
  Car, 
  Lock, 
  Unlock, 
  Camera, 
  RefreshCw, 
  ShieldCheck, 
  Sparkles,
  UserCheck
} from 'lucide-react';
import { 
  VisitorPass, 
  getVisitorPassesFromStorage, 
  approveVisitorPass, 
  rejectVisitorPass, 
  verifyVisitorQr,
  VerificationScanResult
} from '@/lib/visitorStore';

export default function AdminVisitorControl() {
  const [passes, setPasses] = useState<VisitorPass[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Scanner Simulator State
  const [customQrInput, setCustomQrInput] = useState('');
  const [scanResult, setScanResult] = useState<VerificationScanResult | null>(null);
  const [isScanningSimulation, setIsScanningSimulation] = useState(false);
  const [barrierState, setBarrierState] = useState<'CLOSED' | 'OPEN' | 'LOCKED'>('CLOSED');

  const refreshPasses = () => {
    setPasses(getVisitorPassesFromStorage());
  };

  useEffect(() => {
    refreshPasses();
  }, []);

  const handleApprove = (id: string) => {
    approveVisitorPass(id, 'BQL Trực Ban Sảnh A');
    refreshPasses();
  };

  const handleReject = (id: string) => {
    rejectVisitorPass(id, 'BQL từ chối - Chưa xác thực nhân thân');
    refreshPasses();
  };

  const handleSimulateScan = (qrCodeToTest: string) => {
    setIsScanningSimulation(true);
    setScanResult(null);

    setTimeout(() => {
      const result = verifyVisitorQr(qrCodeToTest);
      setScanResult(result);
      setIsScanningSimulation(false);

      if (result.canEnter && result.scanResult === 'VALID') {
        setBarrierState('OPEN');
      } else if (result.scanResult === 'EXPIRED') {
        setBarrierState('CLOSED');
      } else {
        setBarrierState('LOCKED');
      }
    }, 600);
  };

  // Filter passes
  const filteredPasses = passes.filter((p) => {
    const matchesFilter = filterStatus === 'ALL' || p.status === filterStatus;
    const matchesQuery = !searchQuery || 
      p.visitorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.apartmentCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.visitorPhone.includes(searchQuery);
    return matchesFilter && matchesQuery;
  });

  return (
    <div className="space-y-6 animate-fadeIn select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222B35] pb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-semibold flex items-center gap-1.5">
            <QrCode className="w-3.5 h-3.5" /> An Ninh Sảnh Đón • Kiểm Soát Khách Vãng Lai
          </div>
          <h2 className="font-serif text-2xl text-white font-bold mt-1">
            Duyệt Khách Đón & Kiểm Soát Cổng Sảnh (Visitor QR Gate)
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Xem xét phê duyệt mã QR đón khách từ cư dân và kiểm soát Barrier sảnh A/B
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-amber-950/80 border border-amber-500 text-amber-300 text-xs font-bold rounded">
            Chờ Duyệt: {passes.filter(p => p.status === 'PENDING_APPROVAL').length}
          </span>
          <span className="px-3 py-1 bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-xs font-bold rounded">
            Đã Duyệt: {passes.filter(p => p.status === 'APPROVED').length}
          </span>
        </div>
      </div>

      {/* SECTION 1: CỔNG QUÉT SCANNER SIMULATOR (3 TRƯỜNG HỢP: ĐÚNG - SAI - HẾT HẠN) */}
      <div className="p-5 bg-gradient-to-r from-[#121820] to-[#161D26] border border-[#C5A880] rounded-xl space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222B35] pb-3">
          <div>
            <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
              <Scan className="w-5 h-5 text-[#C5A880]" /> Máy Quét Barrier Tại Cổng Sảnh A/B (Gate Scanner)
            </h3>
            <p className="text-xs text-gray-400">
              Kiểm tra trực quan 3 kịch bản: <strong>QR Đúng</strong>, <strong>QR Sai</strong> và <strong>QR Hết Hạn</strong>
            </p>
          </div>

          <div className={`px-4 py-1.5 rounded-lg font-bold text-xs font-mono flex items-center gap-2 border ${
            barrierState === 'OPEN'
              ? 'bg-emerald-950 text-emerald-300 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
              : barrierState === 'LOCKED'
              ? 'bg-rose-950 text-rose-300 border-rose-500'
              : 'bg-gray-900 text-gray-400 border-gray-700'
          }`}>
            {barrierState === 'OPEN' ? <Unlock className="w-4 h-4 text-emerald-400 animate-bounce" /> : <Lock className="w-4 h-4" />}
            <span>TRẠNG THÁI BARRIER: {barrierState === 'OPEN' ? 'ĐÃ MỞ TỰ ĐỘNG' : barrierState === 'LOCKED' ? 'KHÓA CHẶT' : 'ĐANG ĐÓNG'}</span>
          </div>
        </div>

        {/* 3 Quick-Test Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Button 1: QR ĐÚNG */}
          <button
            type="button"
            onClick={() => {
              const validPass = passes.find(p => p.status === 'APPROVED');
              handleSimulateScan(validPass ? validPass.qrData : 'SKYLINE_PASS_VALID_12A05_101');
            }}
            disabled={isScanningSimulation}
            className="p-3.5 bg-emerald-950/80 hover:bg-emerald-900 border-2 border-emerald-500 rounded-lg text-left transition-all shadow group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5 uppercase">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Mã QR Đúng (Hợp Lệ)
              </span>
              <span className="text-[10px] bg-emerald-500 text-black font-bold px-2 py-0.5 rounded">Hợp Lệ</span>
            </div>
            <p className="text-[11px] text-emerald-200/80">
              Mã đã được BQL duyệt & còn hạn. Barrier mở tự động mời khách vào!
            </p>
          </button>

          {/* Button 2: QR SAI */}
          <button
            type="button"
            onClick={() => handleSimulateScan('SIM_QR_INVALID')}
            disabled={isScanningSimulation}
            className="p-3.5 bg-rose-950/80 hover:bg-rose-900 border-2 border-rose-500 rounded-lg text-left transition-all shadow group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5 uppercase">
                <XCircle className="w-4 h-4 text-rose-400" /> Mã QR Sai / Chưa Duyệt
              </span>
              <span className="text-[10px] bg-rose-500 text-white font-bold px-2 py-0.5 rounded">Không Hợp Lệ</span>
            </div>
            <p className="text-[11px] text-rose-200/80">
              Mã giả mạo, chưa được BQL duyệt hoặc bị từ chối. Khóa Barrier ngay!
            </p>
          </button>

          {/* Button 3: QR HẾT HẠN */}
          <button
            type="button"
            onClick={() => {
              const expiredPass = passes.find(p => p.status === 'EXPIRED');
              handleSimulateScan(expiredPass ? expiredPass.qrData : 'SKYLINE_PASS_EXPIRED_12A05_103');
            }}
            disabled={isScanningSimulation}
            className="p-3.5 bg-amber-950/80 hover:bg-amber-900 border-2 border-amber-500 rounded-lg text-left transition-all shadow group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5 uppercase">
                <Clock className="w-4 h-4 text-amber-400" /> Mã QR Quá Hạn
              </span>
              <span className="text-[10px] bg-amber-500 text-black font-bold px-2 py-0.5 rounded">Quá Hạn</span>
            </div>
            <p className="text-[11px] text-amber-200/80">
              Mã đã quá thời gian 24 giờ. Từ chối vào, yêu cầu chủ hộ tạo mã mới!
            </p>
          </button>
        </div>

        {/* Scan Result Feedback Box */}
        {scanResult && (
          <div className={`p-4 rounded-lg border-2 animate-fadeIn transition-all ${
            scanResult.scanResult === 'VALID'
              ? 'bg-emerald-950/90 border-emerald-500 text-emerald-200'
              : scanResult.scanResult === 'EXPIRED'
              ? 'bg-amber-950/90 border-amber-500 text-amber-200'
              : 'bg-rose-950/90 border-rose-500 text-rose-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {scanResult.scanResult === 'VALID' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                {scanResult.scanResult === 'INVALID' && <XCircle className="w-5 h-5 text-rose-400" />}
                {scanResult.scanResult === 'EXPIRED' && <Clock className="w-5 h-5 text-amber-400" />}
                <span className="font-serif font-bold text-base text-white">{scanResult.title}</span>
              </div>
              <span className={`px-2.5 py-0.5 rounded font-mono text-xs font-bold uppercase ${
                scanResult.canEnter ? 'bg-emerald-500 text-black' : 'bg-rose-600 text-white'
              }`}>
                {scanResult.canEnter ? 'MỜI VÀO SẢNH' : 'TỪ CHỐI VÀO'}
              </span>
            </div>
            <p className="text-xs leading-relaxed text-gray-100">{scanResult.message}</p>
            {scanResult.pass && (
              <div className="text-[11px] text-gray-300 mt-2 pt-2 border-t border-white/10 flex flex-wrap gap-4 font-mono">
                <span>Khách: <strong>{scanResult.pass.visitorName}</strong></span>
                <span>Căn hộ: <strong>Căn {scanResult.pass.apartmentCode}</strong></span>
                <span>SĐT: <strong>{scanResult.pass.visitorPhone}</strong></span>
                <span>Duyệt bởi: <strong>{scanResult.pass.approvedBy || 'Chưa duyệt'}</strong></span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION 2: BẢNG DUYỆT YÊU CẦU ĐÓN KHÁCH */}
      <div className="bg-[#121820] border border-[#222B35] rounded-xl p-5 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222B35] pb-3">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-[#C5A880]" />
            <h3 className="font-serif text-base font-bold text-white uppercase tracking-wider">
              Danh Sách Yêu Cầu Đón Khách Toàn Tòa Nhà ({filteredPasses.length})
            </h3>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo tên khách, căn hộ, SĐT..."
                className="bg-[#161B22] border border-gray-700 pl-8 pr-3 py-1.5 text-xs text-white rounded focus:border-[#C5A880] outline-none w-56"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-[#161B22] border border-gray-700 px-3 py-1.5 text-xs text-white rounded focus:border-[#C5A880] outline-none"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="PENDING_APPROVAL">Chờ BQL duyệt</option>
              <option value="APPROVED">Đã phê duyệt</option>
              <option value="REJECTED">Đã từ chối</option>
              <option value="EXPIRED">Đã hết hạn</option>
            </select>
          </div>
        </div>

        {/* Passes Table */}
        <div className="divide-y divide-[#222B35] border border-[#222B35] rounded-lg overflow-hidden">
          {filteredPasses.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400">
              Không tìm thấy yêu cầu đón khách nào phù hợp.
            </div>
          ) : (
            filteredPasses.map((pass) => (
              <div
                key={pass.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#161B22] transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 bg-[#C5A880] text-[#0D1117] font-bold text-[10px] rounded">
                      Căn {pass.apartmentCode}
                    </span>
                    <span className="font-bold text-white text-sm">{pass.visitorName}</span>
                    <span className="text-xs text-gray-400">({pass.purposeLabel})</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      pass.status === 'APPROVED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-600' :
                      pass.status === 'PENDING_APPROVAL' ? 'bg-amber-950 text-amber-300 border border-amber-600 animate-pulse' :
                      pass.status === 'EXPIRED' ? 'bg-gray-800 text-gray-400' : 'bg-rose-950 text-rose-300 border border-rose-600'
                    }`}>
                      {pass.status === 'APPROVED' ? 'Đã Duyệt ✓' :
                       pass.status === 'PENDING_APPROVAL' ? 'Chờ BQL Duyệt' :
                       pass.status === 'EXPIRED' ? 'Đã Hết Hạn' : 'Bị Từ Chối'}
                    </span>
                  </div>

                  <div className="text-xs text-gray-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span>Chủ hộ: <strong className="text-gray-200">{pass.hostName}</strong></span>
                    <span>• SĐT Khách: <strong className="font-mono text-gray-200">{pass.visitorPhone}</strong></span>
                    {pass.licensePlate && (
                      <span>• Biển số: <strong className="font-mono text-cyan-400">{pass.licensePlate}</strong></span>
                    )}
                    <span>• Thời hạn: <strong className="text-[#C5A880]">{pass.validHours} giờ</strong></span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                  {pass.status === 'PENDING_APPROVAL' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleApprove(pass.id)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded flex items-center gap-1 shadow transition-colors"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" /> Phê Duyệt
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(pass.id)}
                        className="px-3 py-1.5 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-600 text-xs font-semibold rounded flex items-center gap-1 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" /> Từ Chối
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => handleSimulateScan(pass.qrData)}
                    className="px-3 py-1.5 bg-[#1C2533] hover:bg-[#C5A880] hover:text-[#0D1117] text-[#C5A880] text-xs font-semibold rounded border border-[#C5A880]/50 flex items-center gap-1 transition-colors"
                  >
                    <Scan className="w-3.5 h-3.5" /> Quét Thử
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
