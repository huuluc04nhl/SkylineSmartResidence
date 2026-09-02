'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  QrCode, 
  Share2, 
  Copy, 
  Check, 
  Clock, 
  ShieldCheck, 
  KeyRound, 
  Sparkles,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  UserCheck,
  Send,
  Scan,
  RefreshCw,
  Eye,
  Lock,
  Unlock,
  Building,
  Car,
  ChevronRight,
  ThumbsUp,
  XCircle,
  Camera
} from 'lucide-react';
import { 
  VisitorPass, 
  getVisitorPassesFromStorage, 
  createVisitorPass, 
  approveVisitorPass, 
  rejectVisitorPass, 
  verifyVisitorQr,
  VerificationScanResult
} from '@/lib/visitorStore';

interface VisitorQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  apartmentCode: string;
  defaultTab?: 'RESIDENT' | 'BQL_DESK' | 'SCANNER';
}

export default function VisitorQrModal({ 
  isOpen, 
  onClose, 
  apartmentCode = '12A05',
  defaultTab = 'RESIDENT'
}: VisitorQrModalProps) {
  const [activeTab, setActiveTab] = useState<'RESIDENT' | 'BQL_DESK' | 'SCANNER'>(defaultTab);
  const [passes, setPasses] = useState<VisitorPass[]>([]);

  // Form State
  const [visitorName, setVisitorName] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [validHours, setValidHours] = useState('2');
  const [purpose, setPurpose] = useState<'VISITOR' | 'DELIVERY' | 'TECH' | 'OTHER'>('VISITOR');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Selected pass for viewing QR
  const [selectedPassForQr, setSelectedPassForQr] = useState<VisitorPass | null>(null);
  const [copied, setCopied] = useState(false);

  // Scanner Simulator State (3 trường hợp: Đúng, Sai, Hết Hạn)
  const [customQrInput, setCustomQrInput] = useState('');
  const [scanResult, setScanResult] = useState<VerificationScanResult | null>(null);
  const [isScanningSimulation, setIsScanningSimulation] = useState(false);
  const [barrierState, setBarrierState] = useState<'CLOSED' | 'OPEN' | 'LOCKED'>('CLOSED');

  // Load passes on open
  useEffect(() => {
    if (isOpen) {
      const stored = getVisitorPassesFromStorage();
      setPasses(stored);
      // Auto-select first approved pass for preview if available
      const firstApproved = stored.find(p => p.status === 'APPROVED');
      if (firstApproved) {
        setSelectedPassForQr(firstApproved);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Refresh passes
  const refreshPasses = () => {
    const stored = getVisitorPassesFromStorage();
    setPasses([...stored]);
    if (selectedPassForQr) {
      const updated = stored.find(p => p.id === selectedPassForQr.id);
      if (updated) setSelectedPassForQr(updated);
    }
  };

  // 1. Cư dân gửi yêu cầu tạo mã đón khách
  const handleResidentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName.trim() || !visitorPhone.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const newPass = createVisitorPass({
        apartmentCode,
        hostName: 'Nguyễn Hữu Lực',
        hostPhone: '0903112233',
        visitorName: visitorName.trim(),
        visitorPhone: visitorPhone.trim(),
        licensePlate: licensePlate.trim(),
        purpose,
        validHours: parseInt(validHours) || 2,
      });

      setIsSubmitting(false);
      setSubmitSuccess(`✓ Đã gửi yêu cầu đón khách cho "${newPass.visitorName}"! Yêu cầu đang được chuyển đến Ban Quản Lý xem xét & duyệt.`);
      refreshPasses();

      // Reset form
      setVisitorName('');
      setVisitorPhone('');
      setLicensePlate('');

      setTimeout(() => setSubmitSuccess(null), 5000);
    }, 600);
  };

  // 2. BQL phê duyệt
  const handleBqlApprove = (id: string) => {
    approveVisitorPass(id, 'BQL Trực Ban Sảnh A');
    refreshPasses();
  };

  // 3. BQL từ chối
  const handleBqlReject = (id: string) => {
    rejectVisitorPass(id, 'Thông tin khách chưa xác thực hoặc không liên hệ được');
    refreshPasses();
  };

  // 4. Máy Quét Barrier Tại Cổng Sảnh - Xử Lý 3 Trường Hợp Cụ Thể
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
    }, 700);
  };

  const handleCopyLink = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentQrImage = selectedPassForQr 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(selectedPassForQr.qrData)}`
    : `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=SKYLINE_VISITOR_SAMPLE`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="bg-[#0D1117] border border-[#C5A880] max-w-4xl w-full text-white shadow-2xl rounded-xl flex flex-col max-h-[94vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#222B35] flex items-center justify-between bg-gradient-to-r from-[#121820] to-[#161D26]">
          <div className="space-y-0.5">
            <div className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-bold flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5" /> Quy Trình Đón Khách 3 Bước • Căn Hộ {apartmentCode}
            </div>
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <QrCode className="w-5 h-5 text-[#C5A880]" /> Quản Lý Mã QR Đón Khách & Kiểm Soát Cổng Sảnh
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-[#1E2631] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Steps / Tabs Navigation */}
        <div className="grid grid-cols-3 border-b border-[#222B35] bg-[#121820] text-xs font-semibold uppercase tracking-wider text-center">
          <button
            type="button"
            onClick={() => setActiveTab('RESIDENT')}
            className={`py-3 px-2 border-b-2 flex items-center justify-center gap-2 transition-all ${
              activeTab === 'RESIDENT'
                ? 'border-[#C5A880] text-[#C5A880] bg-[#161D26] font-bold'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Send className="w-4 h-4" /> 
            <span className="truncate">1. Cư Dân Gửi Yêu Cầu</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('BQL_DESK')}
            className={`py-3 px-2 border-b-2 flex items-center justify-center gap-2 transition-all relative ${
              activeTab === 'BQL_DESK'
                ? 'border-[#C5A880] text-[#C5A880] bg-[#161D26] font-bold'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <UserCheck className="w-4 h-4" /> 
            <span className="truncate">2. BQL Xem Xét & Duyệt</span>
            {passes.filter(p => p.status === 'PENDING_APPROVAL').length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('SCANNER')}
            className={`py-3 px-2 border-b-2 flex items-center justify-center gap-2 transition-all ${
              activeTab === 'SCANNER'
                ? 'border-[#C5A880] text-[#C5A880] bg-[#161D26] font-bold'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Scan className="w-4 h-4" /> 
            <span className="truncate">3. Mô Phỏng Máy Quét (3 Loại QR)</span>
          </button>
        </div>

        {/* Modal Body Container */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* ============================================================= */}
          {/* TAB 1: RESIDENT CREATES & SENDS VISITOR PASS REQUEST          */}
          {/* ============================================================= */}
          {activeTab === 'RESIDENT' && (
            <div className="space-y-6 animate-fadeIn">
              {submitSuccess && (
                <div className="p-4 bg-emerald-950/90 border border-emerald-500 text-emerald-300 text-xs flex items-center gap-2.5 rounded-lg shadow-lg">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  <span>{submitSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Form to Request New Pass (7 cols) */}
                <form onSubmit={handleResidentSubmit} className="lg:col-span-7 bg-[#121820] border border-[#222B35] p-5 rounded-xl space-y-4 shadow-xl">
                  <div className="border-b border-[#222B35] pb-2.5">
                    <h4 className="font-serif text-base font-bold text-white flex items-center gap-2">
                      <Send className="w-4 h-4 text-[#C5A880]" /> Đăng Ký Khách Đến Thăm / Shipper
                    </h4>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Yêu cầu sẽ được chuyển đến Ban Quản Lý xem xét & phê duyệt trước khi kích hoạt
                    </p>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="text-gray-300 font-medium block mb-1">
                        Họ & Tên Khách Đến Thăm / Đơn Vị Giao Hàng: <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={visitorName}
                        onChange={(e) => setVisitorName(e.target.value)}
                        placeholder="VD: Anh Nam, Shipper Shopee, Thợ sửa điện lạnh..."
                        className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white rounded focus:border-[#C5A880] outline-none"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-gray-300 font-medium block mb-1">
                          Số Điện Thoại Khách: <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="tel"
                          value={visitorPhone}
                          onChange={(e) => setVisitorPhone(e.target.value)}
                          placeholder="09xx xxx xxx"
                          className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white font-mono rounded focus:border-[#C5A880] outline-none"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-gray-300 font-medium block mb-1">Biển Số Xe (Nếu có):</label>
                        <input
                          type="text"
                          value={licensePlate}
                          onChange={(e) => setLicensePlate(e.target.value)}
                          placeholder="VD: 51K-889.99"
                          className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white font-mono rounded focus:border-[#C5A880] outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-gray-300 font-medium block mb-1">Thời Gian Hiệu Lực:</label>
                        <select
                          value={validHours}
                          onChange={(e) => setValidHours(e.target.value)}
                          className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white rounded focus:border-[#C5A880] outline-none"
                        >
                          <option value="1">1 Giờ (Giao hàng nhanh / Shipper)</option>
                          <option value="2">2 Giờ (Khách đến chơi)</option>
                          <option value="4">4 Giờ (Tiệc / Khách họp)</option>
                          <option value="24">24 Giờ (Người thân lưu trú 1 ngày)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-gray-300 font-medium block mb-1">Mục Đích Đến:</label>
                        <select
                          value={purpose}
                          onChange={(e) => setPurpose(e.target.value as any)}
                          className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white rounded focus:border-[#C5A880] outline-none"
                        >
                          <option value="VISITOR">Khách Thăm Nhà</option>
                          <option value="DELIVERY">Giao Hàng Shipper</option>
                          <option value="TECH">Bảo Trì Kỹ Thuật Riêng</option>
                          <option value="OTHER">Mục Đích Khác</option>
                        </select>
                      </div>
                    </div>

                    <div className="p-3 bg-[#161B22] border border-[#2D3748] rounded text-gray-400 text-[11px] leading-relaxed">
                      💡 <strong>Quy trình an ninh:</strong> Khi gửi, mã sẽ ở trạng thái <strong className="text-amber-400">[Chờ BQL Duyệt]</strong>. Sau khi BQL duyệt, mã chuyển sang <strong className="text-emerald-400">[Hợp Lệ]</strong> và khách có thể dùng mã này quét tại Barrier để được mời vào sảnh.
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 bg-[#C5A880] hover:bg-white text-[#0D1117] font-bold uppercase tracking-wider rounded transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                    >
                      {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      <span>{isSubmitting ? 'Đang Gửi Yêu Cầu...' : 'Gửi Yêu Cầu Cho BQL Phê Duyệt'}</span>
                    </button>
                  </div>
                </form>

                {/* QR Display Card & Active Passes (5 cols) */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="bg-[#121820] border border-[#222B35] p-5 rounded-xl text-center space-y-3 shadow-xl">
                    <div className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center justify-between border-b border-[#222B35] pb-2">
                      <span>Mã QR Đón Khách</span>
                      {selectedPassForQr && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          selectedPassForQr.status === 'APPROVED'
                            ? 'bg-emerald-950 border border-emerald-500 text-emerald-400'
                            : selectedPassForQr.status === 'PENDING_APPROVAL'
                            ? 'bg-amber-950 border border-amber-500 text-amber-400'
                            : selectedPassForQr.status === 'EXPIRED'
                            ? 'bg-gray-800 text-gray-400'
                            : 'bg-rose-950 border border-rose-500 text-rose-400'
                        }`}>
                          {selectedPassForQr.status === 'APPROVED' ? 'Đã Phê Duyệt ✓' :
                           selectedPassForQr.status === 'PENDING_APPROVAL' ? 'Chờ BQL Duyệt' :
                           selectedPassForQr.status === 'EXPIRED' ? 'Đã Hết Hạn' : 'Bị Từ Chối'}
                        </span>
                      )}
                    </div>

                    {selectedPassForQr ? (
                      <div className="space-y-3">
                        {/* QR Image */}
                        <div className={`p-3 inline-block rounded-lg shadow-2xl transition-all ${
                          selectedPassForQr.status === 'APPROVED' 
                            ? 'bg-white border-2 border-emerald-500' 
                            : 'bg-white/80 border-2 border-dashed border-gray-600 opacity-70'
                        }`}>
                          <img
                            src={currentQrImage}
                            alt="QR Pass"
                            className="w-40 h-40 object-contain mx-auto"
                          />
                        </div>

                        <div className="text-xs space-y-0.5">
                          <div className="font-bold text-white text-sm">{selectedPassForQr.visitorName}</div>
                          <div className="text-gray-400">
                            SĐT: <span className="font-mono text-gray-200">{selectedPassForQr.visitorPhone}</span>
                          </div>
                          <div className="text-[11px] text-[#C5A880] font-mono">
                            Hết hạn: {new Date(selectedPassForQr.validUntil).toLocaleTimeString('vi-VN')} ({new Date(selectedPassForQr.validUntil).toLocaleDateString('vi-VN')})
                          </div>
                        </div>

                        {selectedPassForQr.status === 'APPROVED' ? (
                          <div className="flex gap-2 pt-2">
                            <button
                              type="button"
                              onClick={handleCopyLink}
                              className="flex-1 py-2 bg-[#1C2533] hover:bg-[#222B35] border border-gray-700 text-xs font-semibold rounded flex items-center justify-center gap-1.5 transition-colors"
                            >
                              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#C5A880]" />}
                              <span>{copied ? 'Đã Sao Chép' : 'Sao Chép Link'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setActiveTab('SCANNER');
                                handleSimulateScan(selectedPassForQr.qrData);
                              }}
                              className="py-2 px-3 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase rounded transition-colors flex items-center gap-1"
                            >
                              <Scan className="w-3.5 h-3.5" /> Quét Thử
                            </button>
                          </div>
                        ) : (
                          <div className="text-[11px] text-amber-300/90 bg-amber-950/40 p-2 border border-amber-500/40 rounded">
                            {selectedPassForQr.status === 'PENDING_APPROVAL' && '⏳ Mã đang chờ BQL duyệt trước khi có thể quét vào cổng.'}
                            {selectedPassForQr.status === 'REJECTED' && '✗ Yêu cầu đã bị Ban Quản Lý từ chối.'}
                            {selectedPassForQr.status === 'EXPIRED' && '⏳ Mã đã quá thời gian hiệu lực 24 giờ.'}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-8 text-gray-500 text-xs">
                        Chọn một mã đón khách bên dưới để xem chi tiết
                      </div>
                    )}
                  </div>

                  {/* List of Resident Passes */}
                  <div className="bg-[#121820] border border-[#222B35] p-3 rounded-xl space-y-2">
                    <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-1">
                      Lịch Sử Đăng Ký Của Căn {apartmentCode} ({passes.filter(p => p.apartmentCode === apartmentCode).length}):
                    </div>

                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {passes.filter(p => p.apartmentCode === apartmentCode).map((p) => {
                        const isSelected = selectedPassForQr?.id === p.id;
                        return (
                          <div
                            key={p.id}
                            onClick={() => setSelectedPassForQr(p)}
                            className={`p-2.5 rounded border transition-all text-xs cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? 'bg-[#1C2533] border-[#C5A880]'
                                : 'bg-[#161D26] border-gray-800 hover:border-gray-700'
                            }`}
                          >
                            <div className="truncate pr-2">
                              <div className="font-semibold text-white truncate">{p.visitorName}</div>
                              <div className="text-[10px] text-gray-400 font-mono">{p.visitorPhone} • {p.purposeLabel}</div>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold flex-shrink-0 ${
                              p.status === 'APPROVED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-600' :
                              p.status === 'PENDING_APPROVAL' ? 'bg-amber-950 text-amber-300 border border-amber-600' :
                              p.status === 'EXPIRED' ? 'bg-gray-800 text-gray-400' : 'bg-rose-950 text-rose-300 border border-rose-600'
                            }`}>
                              {p.status === 'APPROVED' ? 'Đã Duyệt ✓' :
                               p.status === 'PENDING_APPROVAL' ? 'Chờ Duyệt' :
                               p.status === 'EXPIRED' ? 'Hết Hạn' : 'Bị Từ Chối'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* TAB 2: BQL DESK - REVIEW & APPROVE VISITOR PASSES             */}
          {/* ============================================================= */}
          {activeTab === 'BQL_DESK' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 bg-gradient-to-r from-[#161D26] to-[#121820] border border-[#222B35] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-serif text-lg font-bold text-white flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-[#C5A880]" /> Bàn Xét Duyệt Khách Của Ban Quản Lý & Lễ Tân
                  </h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Ban Quản Lý xem xét thông tin căn hộ gửi và phê duyệt trước khi khách có thể quét mã vào tòa nhà
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

              {/* Passes Review Table */}
              <div className="bg-[#121820] border border-[#222B35] rounded-xl overflow-hidden shadow-xl">
                <div className="divide-y divide-[#222B35]">
                  {passes.length === 0 ? (
                    <div className="p-8 text-center text-xs text-gray-400">
                      Chưa có yêu cầu đón khách nào trong hệ thống.
                    </div>
                  ) : (
                    passes.map((pass) => (
                      <div
                        key={pass.id}
                        className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#161D26] transition-colors"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 bg-[#C5A880] text-[#0D1117] font-bold text-[10px] rounded">
                              Căn {pass.apartmentCode}
                            </span>
                            <span className="font-bold text-white text-sm sm:text-base">{pass.visitorName}</span>
                            <span className="text-xs text-gray-400">({pass.purposeLabel})</span>
                          </div>

                          <div className="text-xs text-gray-400 flex flex-wrap items-center gap-x-4 gap-y-1">
                            <span>SĐT Khách: <strong className="font-mono text-gray-200">{pass.visitorPhone}</strong></span>
                            {pass.licensePlate && (
                              <span>Biển số xe: <strong className="font-mono text-cyan-400">{pass.licensePlate}</strong></span>
                            )}
                            <span>Hiệu lực: <strong className="text-[#C5A880]">{pass.validHours} giờ</strong></span>
                          </div>

                          <div className="text-[11px] text-gray-500 flex items-center gap-2">
                            <span>Chủ hộ gửi: <strong className="text-gray-300">{pass.hostName}</strong></span>
                            <span>• Trạng thái: <strong className={`${
                              pass.status === 'APPROVED' ? 'text-emerald-400' :
                              pass.status === 'PENDING_APPROVAL' ? 'text-amber-400' :
                              pass.status === 'EXPIRED' ? 'text-gray-400' : 'text-rose-400'
                            }`}>{pass.statusMessage}</strong></span>
                          </div>
                        </div>

                        {/* Action Buttons for BQL */}
                        <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                          {pass.status === 'PENDING_APPROVAL' ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleBqlApprove(pass.id)}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded flex items-center gap-1.5 shadow transition-colors"
                              >
                                <Check className="w-4 h-4 stroke-[3]" /> Phê Duyệt
                              </button>
                              <button
                                type="button"
                                onClick={() => handleBqlReject(pass.id)}
                                className="px-3 py-2 bg-rose-900/60 hover:bg-rose-800 border border-rose-600 text-rose-200 text-xs font-semibold rounded flex items-center gap-1 transition-colors"
                              >
                                <X className="w-4 h-4" /> Từ Chối
                              </button>
                            </>
                          ) : pass.status === 'APPROVED' ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 bg-emerald-950/80 px-2.5 py-1 rounded border border-emerald-500/40">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Đã Cấp Quyền
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveTab('SCANNER');
                                  handleSimulateScan(pass.qrData);
                                }}
                                className="px-3 py-1 bg-[#1C2533] hover:bg-[#C5A880] hover:text-[#0D1117] text-[#C5A880] text-xs font-semibold rounded border border-[#C5A880]/50 transition-colors"
                              >
                                Quét Cổng
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500 font-mono px-2 py-1 bg-gray-900 rounded">
                              {pass.status === 'EXPIRED' ? 'Đã Hết Hạn' : 'Đã Từ Chối'}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* TAB 3: GATE SCANNER SIMULATOR (3 CASES: VALID, INVALID, EXPIRED) */}
          {/* ============================================================= */}
          {activeTab === 'SCANNER' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Simulator Header & Quick Action Buttons */}
              <div className="p-4 bg-gradient-to-r from-[#121820] to-[#161D26] border border-[#C5A880] rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#222B35] pb-3">
                  <div>
                    <h4 className="font-serif text-lg font-bold text-white flex items-center gap-2">
                      <Scan className="w-5 h-5 text-[#C5A880]" /> Máy Quét Kiểm Soát Cổng Sảnh & Barrier Thông Minh
                    </h4>
                    <p className="text-xs text-gray-400">
                      Mô phỏng máy đọc mã QR tại Barrier Sảnh A/B. Kiểm tra chính xác 3 trường hợp:
                    </p>
                  </div>

                  {/* Barrier Indicator */}
                  <div className={`px-4 py-1.5 rounded-lg font-bold text-xs font-mono flex items-center gap-2 border ${
                    barrierState === 'OPEN'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                      : barrierState === 'LOCKED'
                      ? 'bg-rose-950 text-rose-300 border-rose-500'
                      : 'bg-gray-900 text-gray-400 border-gray-700'
                  }`}>
                    {barrierState === 'OPEN' ? <Unlock className="w-4 h-4 text-emerald-400 animate-bounce" /> : <Lock className="w-4 h-4" />}
                    <span>BARRIER: {barrierState === 'OPEN' ? 'ĐÃ MỞ (OPEN)' : barrierState === 'LOCKED' ? 'KHÓA CHẶT (LOCKED)' : 'ĐANG ĐÓNG (CLOSED)'}</span>
                  </div>
                </div>

                {/* 3 Dedicated Test Buttons as requested by User */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {/* Case 1: QR ĐÚNG */}
                  <button
                    type="button"
                    onClick={() => {
                      const validPass = passes.find(p => p.status === 'APPROVED');
                      handleSimulateScan(validPass ? validPass.qrData : 'SKYLINE_PASS_VALID_12A05_101');
                    }}
                    disabled={isScanningSimulation}
                    className="p-3 bg-emerald-950/80 hover:bg-emerald-900 border-2 border-emerald-500 rounded-lg text-left transition-all group shadow"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5 uppercase">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 1. Thử Quét: QR Đúng
                      </span>
                      <span className="text-[10px] bg-emerald-500 text-black font-bold px-1.5 py-0.5 rounded">Đã Duyệt</span>
                    </div>
                    <p className="text-[11px] text-emerald-200/80">
                      Mã hợp lệ, đã được BQL duyệt & còn hạn. Barrier mở mời khách vào!
                    </p>
                  </button>

                  {/* Case 2: QR SAI */}
                  <button
                    type="button"
                    onClick={() => {
                      handleSimulateScan('SIM_QR_INVALID');
                    }}
                    disabled={isScanningSimulation}
                    className="p-3 bg-rose-950/80 hover:bg-rose-900 border-2 border-rose-500 rounded-lg text-left transition-all group shadow"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5 uppercase">
                        <XCircle className="w-4 h-4 text-rose-400" /> 2. Thử Quét: QR Sai
                      </span>
                      <span className="text-[10px] bg-rose-500 text-white font-bold px-1.5 py-0.5 rounded">Không Hợp Lệ</span>
                    </div>
                    <p className="text-[11px] text-rose-200/80">
                      Mã giả mạo, chưa được BQL duyệt hoặc bị từ chối. Khóa Barrier cảnh báo!
                    </p>
                  </button>

                  {/* Case 3: QR HẾT HẠN */}
                  <button
                    type="button"
                    onClick={() => {
                      const expiredPass = passes.find(p => p.status === 'EXPIRED');
                      handleSimulateScan(expiredPass ? expiredPass.qrData : 'SKYLINE_PASS_EXPIRED_12A05_103');
                    }}
                    disabled={isScanningSimulation}
                    className="p-3 bg-amber-950/80 hover:bg-amber-900 border-2 border-amber-500 rounded-lg text-left transition-all group shadow"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5 uppercase">
                        <Clock className="w-4 h-4 text-amber-400" /> 3. Thử Quét: QR Hết Hạn
                      </span>
                      <span className="text-[10px] bg-amber-500 text-black font-bold px-1.5 py-0.5 rounded">Quá Hạn</span>
                    </div>
                    <p className="text-[11px] text-amber-200/80">
                      Mã đã quá thời gian 24 giờ. Từ chối vào, yêu cầu chủ hộ tạo mã mới!
                    </p>
                  </button>
                </div>
              </div>

              {/* Laser Camera Viewport & Result Display */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Gate Camera Viewport (5 cols) */}
                <div className="lg:col-span-5 bg-[#121820] border border-[#222B35] p-5 rounded-xl text-center space-y-3">
                  <div className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center justify-between border-b border-[#222B35] pb-2">
                    <span className="flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-[#C5A880]" /> Ống Kính Máy Quét Sảnh A
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400">ACTIVE</span>
                  </div>

                  {/* Scanner Box with Laser Animation */}
                  <div className="relative w-full h-56 bg-black border-2 border-dashed border-[#C5A880]/60 rounded-lg overflow-hidden flex items-center justify-center">
                    {/* Laser Scanner Bar */}
                    <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10B981] animate-bounce pointer-events-none"></div>

                    {/* Corner Reticles */}
                    <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-emerald-400"></div>
                    <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-emerald-400"></div>
                    <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-emerald-400"></div>
                    <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-emerald-400"></div>

                    {/* QR Icon in viewport */}
                    <div className="text-center space-y-2">
                      <QrCode className="w-20 h-20 text-gray-600 mx-auto animate-pulse" />
                      <div className="text-[11px] font-mono text-gray-400">
                        {isScanningSimulation ? 'Đang đọc mã QR...' : 'Đưa mã QR trước ống kính'}
                      </div>
                    </div>
                  </div>

                  {/* Custom Code Input for testing any custom QR */}
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={customQrInput}
                      onChange={(e) => setCustomQrInput(e.target.value)}
                      placeholder="Hoặc nhập mã / ID để test..."
                      className="flex-1 bg-[#161B22] border border-[#2D3748] p-2 text-white text-xs font-mono rounded focus:border-[#C5A880] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleSimulateScan(customQrInput)}
                      className="px-3 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase rounded transition-colors"
                    >
                      Quét
                    </button>
                  </div>
                </div>

                {/* Scan Result Feedback Card (7 cols) */}
                <div className="lg:col-span-7 space-y-4">
                  <div className={`p-6 rounded-xl border-2 transition-all shadow-2xl ${
                    !scanResult
                      ? 'bg-[#121820] border-[#222B35]'
                      : scanResult.scanResult === 'VALID'
                      ? 'bg-gradient-to-br from-[#062D1F] via-[#0E2018] to-[#121820] border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.2)]'
                      : scanResult.scanResult === 'EXPIRED'
                      ? 'bg-gradient-to-br from-[#2D1F06] via-[#20180E] to-[#121820] border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.2)]'
                      : 'bg-gradient-to-br from-[#2D0606] via-[#200E0E] to-[#121820] border-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.2)]'
                  }`}>
                    {!scanResult ? (
                      <div className="text-center py-10 space-y-2">
                        <Scan className="w-12 h-12 text-gray-600 mx-auto" />
                        <div className="font-serif text-base font-bold text-gray-300">
                          Chưa Có Dữ Liệu Quét
                        </div>
                        <p className="text-xs text-gray-500 max-w-sm mx-auto">
                          Bấm vào 1 trong 3 nút màu phía trên để kiểm tra ngay 3 kịch bản: <strong>QR Đúng</strong>, <strong>QR Sai</strong> hoặc <strong>QR Hết Hạn</strong>.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4 animate-fadeIn">
                        {/* Result Title & Badge */}
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                          <div className="flex items-center gap-2.5">
                            {scanResult.scanResult === 'VALID' && <CheckCircle2 className="w-7 h-7 text-emerald-400 animate-pulse" />}
                            {scanResult.scanResult === 'INVALID' && <XCircle className="w-7 h-7 text-rose-400 animate-pulse" />}
                            {scanResult.scanResult === 'EXPIRED' && <Clock className="w-7 h-7 text-amber-400 animate-pulse" />}
                            <div>
                              <div className="text-xs uppercase tracking-wider font-mono opacity-80">
                                {scanResult.scannedAt} • Kết Quả Quét Cổng
                              </div>
                              <h3 className={`font-serif text-lg sm:text-xl font-bold ${
                                scanResult.scanResult === 'VALID' ? 'text-emerald-300' :
                                scanResult.scanResult === 'EXPIRED' ? 'text-amber-300' : 'text-rose-300'
                              }`}>
                                {scanResult.title}
                              </h3>
                            </div>
                          </div>

                          <span className={`px-3 py-1 rounded text-xs font-mono font-bold uppercase ${
                            scanResult.canEnter
                              ? 'bg-emerald-500 text-black'
                              : 'bg-rose-600 text-white'
                          }`}>
                            {scanResult.canEnter ? 'MỜI VÀO SẢNH' : 'TỪ CHỐI VÀO'}
                          </span>
                        </div>

                        {/* Message Description */}
                        <div className="p-3.5 bg-black/40 rounded-lg text-xs leading-relaxed text-gray-200 border border-white/10">
                          {scanResult.message}
                        </div>

                        {/* If Pass Details Available */}
                        {scanResult.pass && (
                          <div className="space-y-2 pt-1 border-t border-white/10 text-xs">
                            <div className="grid grid-cols-2 gap-2 text-gray-300">
                              <div>Khách: <strong className="text-white">{scanResult.pass.visitorName}</strong></div>
                              <div>Căn hộ: <strong className="text-[#C5A880] font-mono">Căn {scanResult.pass.apartmentCode}</strong></div>
                              <div>SĐT: <strong className="font-mono text-gray-200">{scanResult.pass.visitorPhone}</strong></div>
                              <div>Mục đích: <strong className="text-gray-200">{scanResult.pass.purposeLabel}</strong></div>
                              {scanResult.pass.licensePlate && (
                                <div>Biển số: <strong className="font-mono text-cyan-400">{scanResult.pass.licensePlate}</strong></div>
                              )}
                              <div>BQL Duyệt: <strong className="text-emerald-400">{scanResult.pass.approvedBy || 'Chưa duyệt'}</strong></div>
                            </div>

                            {scanResult.canEnter && (
                              <div className="p-2.5 bg-emerald-950/60 border border-emerald-500/40 rounded text-[11px] text-emerald-300 flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                <span>Thang máy Tòa A đã tự động phân quyền mở cửa lên Tầng 12.</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#222B35] flex items-center justify-between bg-[#121820] text-xs text-gray-400">
          <div className="flex items-center gap-2 font-mono">
            <Building className="w-4 h-4 text-[#C5A880]" /> Skyline Smart Residence • Cổng Kiểm Soát Ra Vào
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-[#1C2533] hover:bg-[#222B35] text-white rounded font-semibold transition-colors"
          >
            Đóng Cửa Sổ
          </button>
        </div>

      </div>
    </div>
  );
}
