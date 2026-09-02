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
  Camera,
  ShieldAlert
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
import { User as UserType } from '@/lib/dataStore';

interface VisitorQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  apartmentCode: string;
  currentUser?: UserType;
  defaultTab?: 'RESIDENT' | 'BQL_DESK' | 'SCANNER';
}

export default function VisitorQrModal({ 
  isOpen, 
  onClose, 
  apartmentCode = '12A05',
  currentUser,
  defaultTab = 'RESIDENT'
}: VisitorQrModalProps) {
  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'TECHNICIAN';

  // State: Tab selection
  const [activeTab, setActiveTab] = useState<'RESIDENT' | 'BQL_DESK' | 'SCANNER'>(
    !isAdmin && defaultTab !== 'RESIDENT' ? 'RESIDENT' : defaultTab
  );

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

  // Scanner Simulator State (Dành riêng cho BQL/Kỹ thuật)
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
      } else if (stored.length > 0) {
        setSelectedPassForQr(stored[0]);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter passes relevant to this apartment for resident, or all for admin
  const apartmentPasses = isAdmin 
    ? passes 
    : passes.filter(p => p.apartmentCode === apartmentCode);

  const pendingCount = passes.filter(p => p.status === 'PENDING_APPROVAL').length;

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
        hostName: currentUser?.full_name || 'Nguyễn Hữu Lực',
        hostPhone: currentUser?.phone || '0903112233',
        visitorName: visitorName.trim(),
        visitorPhone: visitorPhone.trim(),
        licensePlate: licensePlate.trim(),
        purpose,
        validHours: parseInt(validHours) || 2,
      });

      setIsSubmitting(false);
      setSubmitSuccess(`Đã gửi yêu cầu đón khách "${visitorName.trim()}" đến Ban Quản Lý thành công! Vui lòng chờ BQL duyệt.`);
      setVisitorName('');
      setVisitorPhone('');
      setLicensePlate('');
      refreshPasses();
      setSelectedPassForQr(newPass);

      setTimeout(() => setSubmitSuccess(null), 5000);
    }, 400);
  };

  // 2. BQL Phê duyệt mã đón khách (Chỉ Admin)
  const handleBqlApprove = (id: string) => {
    if (!isAdmin) return;
    approveVisitorPass(id, currentUser?.full_name || 'BQL Tòa Nhà');
    refreshPasses();
  };

  // 3. BQL Từ chối mã đón khách (Chỉ Admin)
  const handleBqlReject = (id: string) => {
    if (!isAdmin) return;
    rejectVisitorPass(id, 'BQL từ chối - Chưa xác minh nhân thân');
    refreshPasses();
  };

  // 4. Mô phỏng quét mã QR (Chỉ Admin)
  const handleSimulateScan = (qrCodeToTest: string) => {
    if (!isAdmin) return;
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

  const handleCopyPass = () => {
    if (!selectedPassForQr) return;
    const shareText = `[SKYLINE SMART RESIDENCE] Mã mời đón khách Căn hộ ${selectedPassForQr.apartmentCode}\nKhách: ${selectedPassForQr.visitorName}\nMã Thẻ Vào Cổng: ${selectedPassForQr.id}\nHiệu lực: ${selectedPassForQr.validUntil}\nQuý khách vui lòng đưa mã QR này cho camera tại Cổng Barrier hoặc Sảnh Thang máy để vào tòa nhà.`;
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0A0E14] border border-[#C5A880]/70 max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl rounded-xl overflow-hidden text-white">
        
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 border-b border-[#222B35] flex items-center justify-between bg-[#121820]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#161D26] border border-[#C5A880]/80 flex items-center justify-center text-[#C5A880] shadow-md flex-shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-bold flex items-center gap-1.5">
                <span>Skyline Luxury Gate Access</span>
                <span className="w-1 h-1 rounded-full bg-[#C5A880]"></span>
                <span className="text-gray-400 font-mono">Căn Hộ {apartmentCode}</span>
              </div>
              <h3 className="font-serif text-base sm:text-lg font-bold text-white">
                {isAdmin ? 'Trung Tâm Điều Hành & Duyệt Mã QR Đón Khách' : 'Đăng Ký & Quản Lý Mã QR Đón Khách'}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refreshPasses}
              className="p-2 text-gray-400 hover:text-white hover:bg-[#161D26] rounded transition-colors"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-rose-950/50 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation - STRICTLY ROLE-BASED */}
        {isAdmin ? (
          /* BQL / Admin view: All 3 management tabs */
          <div className="grid grid-cols-3 border-b border-[#222B35] bg-[#0E131A] text-xs">
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
              <span className="truncate">1. Yêu Cầu Căn Hộ</span>
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
              <span className="truncate">2. BQL Phê Duyệt ({pendingCount})</span>
              {pendingCount > 0 && (
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
              <span className="truncate">3. Mô Phỏng Barrier Cổng</span>
            </button>
          </div>
        ) : (
          /* Resident view: Role-isolated banner explaining the 3-step security flow */
          <div className="px-5 py-2.5 bg-[#0E141C] border-b border-[#222B35] flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#C5A880]" />
              <span className="text-[11px]">
                Quy trình đón khách 3 bước: 
                <strong className="text-gray-200"> 1. Cư dân gửi yêu cầu</strong> → 
                <strong className="text-amber-400"> 2. BQL thẩm định duyệt</strong> → 
                <strong className="text-emerald-400"> 3. Khách quét QR qua cổng</strong>
              </span>
            </div>
            <div className="text-[10px] text-gray-500 font-mono hidden sm:block">
              An Ninh Sảnh 24/7
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* ============================================================= */}
          {/* TAB 1: RESIDENT VIEW (Request Form + My Passes Status List)   */}
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
                
                {/* Form to Request New Pass (5 cols) */}
                <form onSubmit={handleResidentSubmit} className="lg:col-span-5 bg-[#121820] border border-[#222B35] p-5 rounded-xl space-y-4 shadow-xl">
                  <div className="border-b border-[#222B35] pb-2.5">
                    <h4 className="font-serif text-base font-bold text-white flex items-center gap-2">
                      <Send className="w-4 h-4 text-[#C5A880]" /> Gửi Yêu Cầu Đón Khách
                    </h4>
                    <p className="text-xs text-gray-400 mt-0.5">
                      BQL sẽ thẩm định và kích hoạt mã QR hợp lệ trong 3-5 phút
                    </p>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="text-gray-300 font-medium block mb-1">
                        Họ & Tên Khách Đến Thăm / Giao Hàng: <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={visitorName}
                        onChange={(e) => setVisitorName(e.target.value)}
                        placeholder="VD: Anh Nam (Shopee), Chị Linh..."
                        className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white rounded focus:border-[#C5A880] outline-none"
                        required
                      />
                    </div>

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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

                      <div>
                        <label className="text-gray-300 font-medium block mb-1">Thời Gian Hiệu Lực:</label>
                        <select
                          value={validHours}
                          onChange={(e) => setValidHours(e.target.value)}
                          className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white rounded focus:border-[#C5A880] outline-none"
                        >
                          <option value="1">1 Giờ (Giao hàng nhanh)</option>
                          <option value="2">2 Giờ (Khách thăm bạn)</option>
                          <option value="4">4 Giờ (Thợ sửa chữa)</option>
                          <option value="8">8 Giờ (Khách ở ban ngày)</option>
                          <option value="24">24 Giờ (Khách qua đêm)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-gray-300 font-medium block mb-1">Mục Đích Đến:</label>
                      <select
                        value={purpose}
                        onChange={(e) => setPurpose(e.target.value as any)}
                        className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white rounded focus:border-[#C5A880] outline-none"
                      >
                        <option value="VISITOR">Khách Thăm Gia Đình</option>
                        <option value="DELIVERY">Giao Hàng / Đồ Ăn (Shipper)</option>
                        <option value="TECH">Bảo Trì / Thợ Sửa Thiết Bị</option>
                        <option value="OTHER">Mục Đích Khác</option>
                      </select>
                    </div>

                    <div className="p-3 bg-[#161D26] border border-[#222B35] rounded text-[11px] text-gray-400 space-y-1">
                      <div className="flex items-center gap-1.5 text-[#C5A880] font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5" /> An Ninh Tòa Nhà Thông Minh
                      </div>
                      <p>
                        Mã QR được phân quyền vào Barrier Hầm B1 hoặc Sảnh A và phân tầng thang máy thẳng lên Căn hộ {apartmentCode}.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || !visitorName.trim() || !visitorPhone.trim()}
                      className={`w-full py-3 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 rounded shadow-lg ${
                        isSubmitting || !visitorName.trim() || !visitorPhone.trim()
                          ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                          : 'bg-[#C5A880] hover:bg-white text-[#0D1117]'
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" /> Đang Gửi Yêu Cầu...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" /> Gửi Yêu Cầu Đến Ban Quản Lý
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Right: Passes List & Live Active QR (7 cols) */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="bg-[#121820] border border-[#222B35] p-5 rounded-xl space-y-4 shadow-xl">
                    <div className="flex items-center justify-between border-b border-[#222B35] pb-3">
                      <div>
                        <h4 className="font-serif text-sm font-bold text-white flex items-center gap-2">
                          <QrCode className="w-4 h-4 text-[#C5A880]" /> Danh Sách Lượt Đón Khách ({apartmentPasses.length})
                        </h4>
                        <span className="text-[11px] text-gray-400">
                          Bấm vào lượt đón để xem mã QR và trạng thái duyệt
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-[#C5A880] bg-[#161D26] px-2 py-0.5 border border-[#C5A880]/40 rounded">
                        Căn {apartmentCode}
                      </span>
                    </div>

                    {apartmentPasses.length === 0 ? (
                      <div className="p-8 text-center text-gray-400 text-xs space-y-2">
                        <QrCode className="w-8 h-8 text-gray-600 mx-auto" />
                        <p>Căn hộ chưa tạo lượt đón khách nào. Hãy điền form bên trái để gửi yêu cầu!</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {apartmentPasses.map((p) => {
                          const isSelected = selectedPassForQr?.id === p.id;
                          return (
                            <div
                              key={p.id}
                              onClick={() => setSelectedPassForQr(p)}
                              className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between gap-3 text-xs ${
                                isSelected
                                  ? 'bg-[#161D26] border-[#C5A880] shadow-md'
                                  : 'bg-[#0E141C] border-[#222B35] hover:border-gray-600 text-gray-300'
                              }`}
                            >
                              <div className="space-y-0.5 min-w-0">
                                <div className="font-bold text-white truncate flex items-center gap-2">
                                  <span>{p.visitorName}</span>
                                  <span className="text-[10px] text-gray-400 font-mono font-normal">({p.visitorPhone})</span>
                                </div>
                                <div className="text-[10px] text-gray-400 flex items-center gap-2">
                                  <span>Tạo: {new Date(p.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                                  <span>• Hạn: {new Date(p.validUntil).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                              </div>

                              <div className="flex-shrink-0">
                                {p.status === 'APPROVED' ? (
                                  <span className="px-2 py-0.5 bg-emerald-950/80 text-emerald-300 border border-emerald-600/60 rounded text-[10px] font-semibold flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> Đã Duyệt
                                  </span>
                                ) : p.status === 'PENDING_APPROVAL' ? (
                                  <span className="px-2 py-0.5 bg-amber-950/80 text-amber-300 border border-amber-600/60 rounded text-[10px] font-semibold flex items-center gap-1">
                                    <Clock className="w-3 h-3 animate-spin" /> Chờ BQL
                                  </span>
                                ) : p.status === 'REJECTED' ? (
                                  <span className="px-2 py-0.5 bg-rose-950/80 text-rose-300 border border-rose-600/60 rounded text-[10px] font-semibold flex items-center gap-1">
                                    <XCircle className="w-3 h-3" /> Từ Chối
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-gray-800 text-gray-400 border border-gray-700 rounded text-[10px]">
                                    Hết Hạn
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Active Selected Pass Detail Card */}
                    {selectedPassForQr && (
                      <div className="mt-4 pt-4 border-t border-[#222B35] bg-[#0E141C] p-4 rounded-lg border space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="font-bold text-white text-sm flex items-center gap-2">
                            <span>Chi Tiết Mã Đón: <strong>{selectedPassForQr.visitorName}</strong></span>
                          </div>
                          <div>
                            {selectedPassForQr.status === 'APPROVED' ? (
                              <span className="px-2.5 py-1 bg-emerald-950 text-emerald-300 border border-emerald-500 rounded text-xs font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> BQL ĐÃ PHÊ DUYỆT
                              </span>
                            ) : selectedPassForQr.status === 'PENDING_APPROVAL' ? (
                              <span className="px-2.5 py-1 bg-amber-950 text-amber-300 border border-amber-500 rounded text-xs font-bold flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 animate-spin" /> ĐANG CHỜ BQL DUYỆT
                              </span>
                            ) : selectedPassForQr.status === 'REJECTED' ? (
                              <span className="px-2.5 py-1 bg-rose-950 text-rose-300 border border-rose-500 rounded text-xs font-bold flex items-center gap-1">
                                <XCircle className="w-3.5 h-3.5" /> BQL TỪ CHỐI
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 bg-gray-800 text-gray-400 border border-gray-700 rounded text-xs font-bold">
                                MÃ ĐÃ HẾT HẠN
                              </span>
                            )}
                          </div>
                        </div>

                        {/* QR Code Presentation */}
                        <div className="flex flex-col sm:flex-row items-center gap-5 justify-center py-2">
                          <div className="relative p-3 bg-white rounded-xl shadow-2xl flex-shrink-0 border-2 border-[#C5A880]">
                            {/* QR Canvas / Image */}
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                                selectedPassForQr.status === 'APPROVED' ? selectedPassForQr.qrData : 'PENDING_BQL_APPROVAL'
                              )}`}
                              alt="Visitor QR Code"
                              className={`w-40 h-40 object-contain transition-all ${
                                selectedPassForQr.status !== 'APPROVED' ? 'filter blur-[3px] opacity-40' : ''
                              }`}
                            />
                            
                            {/* Watermark overlay if not approved */}
                            {selectedPassForQr.status === 'PENDING_APPROVAL' && (
                              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-amber-300 p-2 text-center rounded-xl">
                                <Clock className="w-8 h-8 animate-spin mb-1 text-amber-400" />
                                <div className="font-bold text-xs">CHỜ BQL DUYỆT</div>
                                <div className="text-[9px] text-gray-300">Chưa thể quét qua cổng</div>
                              </div>
                            )}

                            {selectedPassForQr.status === 'REJECTED' && (
                              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-rose-300 p-2 text-center rounded-xl">
                                <XCircle className="w-8 h-8 mb-1 text-rose-400" />
                                <div className="font-bold text-xs">TỪ CHỐI</div>
                              </div>
                            )}

                            {selectedPassForQr.status === 'EXPIRED' && (
                              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-gray-300 p-2 text-center rounded-xl">
                                <AlertTriangle className="w-8 h-8 mb-1 text-gray-400" />
                                <div className="font-bold text-xs">HẾT HẠN</div>
                              </div>
                            )}
                          </div>

                          <div className="space-y-2 text-xs flex-1">
                            <div className="p-2.5 bg-[#161B22] border border-[#222B35] rounded space-y-1">
                              <div className="text-gray-400 text-[11px]">Mã Thẻ / PIN Vào Cổng:</div>
                              <div className="font-mono text-lg font-bold text-[#C5A880] tracking-widest">
                                {selectedPassForQr.status === 'APPROVED' ? selectedPassForQr.id : '••••••'}
                              </div>
                            </div>

                            <div className="text-[11px] text-gray-300 space-y-1">
                              <div>• Khách: <strong className="text-white">{selectedPassForQr.visitorName}</strong> ({selectedPassForQr.visitorPhone})</div>
                              {selectedPassForQr.licensePlate && (
                                <div>• Biển số xe: <strong className="font-mono text-cyan-400">{selectedPassForQr.licensePlate}</strong></div>
                              )}
                              <div>• Hiệu lực đến: <strong className="font-mono text-gray-200">{new Date(selectedPassForQr.validUntil).toLocaleString('vi-VN')}</strong></div>
                              {selectedPassForQr.approvedBy && (
                                <div className="text-emerald-400">• Người duyệt: <strong>{selectedPassForQr.approvedBy}</strong></div>
                              )}
                            </div>

                            {selectedPassForQr.status === 'APPROVED' ? (
                              <div className="pt-2 flex gap-2">
                                <button
                                  type="button"
                                  onClick={handleCopyPass}
                                  className="flex-1 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] font-bold text-xs rounded transition-colors flex items-center justify-center gap-1.5 shadow"
                                >
                                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                  {copied ? 'Đã Sao Chép!' : 'Gửi Khách / Copy'}
                                </button>
                              </div>
                            ) : selectedPassForQr.status === 'PENDING_APPROVAL' ? (
                              <div className="p-2.5 bg-amber-950/40 border border-amber-600/40 rounded text-amber-300 text-[11px]">
                                ⏳ Yêu cầu đang được trực ban BQL thẩm định. Vui lòng đợi trong giây lát, hệ thống sẽ tự động cập nhật mã QR ngay sau khi được duyệt.
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* TAB 2: BQL APPROVAL DESK (STRICTLY ADMIN / BQL ONLY)          */}
          {/* ============================================================= */}
          {activeTab === 'BQL_DESK' && isAdmin && (
            <div className="space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-[#222B35] pb-3">
                <div>
                  <h4 className="font-serif text-base font-bold text-white flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-[#C5A880]" /> Bàn Thẩm Định & Duyệt Mã Đón Khách (BQL Desk)
                  </h4>
                  <p className="text-xs text-gray-400">
                    Chỉ dành riêng cho Ban Quản Lý và Bộ phận Trực ban Sảnh Đón
                  </p>
                </div>
                <div className="text-xs font-mono text-amber-300 bg-amber-950/60 px-3 py-1 border border-amber-500/50 rounded">
                  Chờ duyệt: {pendingCount}
                </div>
              </div>

              {passes.length === 0 ? (
                <div className="p-12 text-center text-gray-400 text-xs space-y-2">
                  <UserCheck className="w-8 h-8 text-gray-600 mx-auto" />
                  <p>Hiện không có yêu cầu đón khách nào từ cư dân.</p>
                </div>
              ) : (
                <div className="divide-y divide-[#222B35] bg-[#121820] border border-[#222B35] rounded-xl overflow-hidden shadow-xl">
                  {passes.map((p) => (
                    <div key={p.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#161B22] transition-colors">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-bold text-white text-sm sm:text-base">{p.visitorName}</span>
                          <span className="text-xs text-gray-400 font-mono">({p.visitorPhone})</span>
                          <span className="px-2 py-0.5 bg-[#161D26] text-[#C5A880] border border-[#C5A880]/50 rounded text-[10px] font-bold">
                            Căn {p.apartmentCode}
                          </span>
                          {p.status === 'APPROVED' && (
                            <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-500 rounded text-[10px] font-bold">
                              ✓ Đã Duyệt
                            </span>
                          )}
                          {p.status === 'PENDING_APPROVAL' && (
                            <span className="px-2 py-0.5 bg-amber-950 text-amber-300 border border-amber-500 rounded text-[10px] font-bold animate-pulse">
                              ⏳ Chờ Thẩm Định
                            </span>
                          )}
                          {p.status === 'REJECTED' && (
                            <span className="px-2 py-0.5 bg-rose-950 text-rose-300 border border-rose-500 rounded text-[10px] font-bold">
                              ✕ Từ Chối
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-gray-400 flex flex-wrap items-center gap-x-4 gap-y-1">
                          <span>Chủ hộ gửi: <strong className="text-gray-200">{p.hostName}</strong></span>
                          <span>• Mục đích: <strong className="text-gray-200">{p.purpose}</strong></span>
                          {p.licensePlate && <span>• Biển số: <strong className="font-mono text-cyan-400">{p.licensePlate}</strong></span>}
                          <span>• Hạn: <strong className="font-mono text-gray-300">{new Date(p.validUntil).toLocaleString('vi-VN')}</strong></span>
                        </div>
                      </div>

                      {/* BQL Action Buttons */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {p.status === 'PENDING_APPROVAL' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleBqlApprove(p.id)}
                              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded flex items-center gap-1.5 shadow transition-colors"
                            >
                              <Check className="w-4 h-4" /> Duyệt Ngay
                            </button>
                            <button
                              type="button"
                              onClick={() => handleBqlReject(p.id)}
                              className="px-3.5 py-2 bg-rose-950/80 hover:bg-rose-900 border border-rose-600 text-rose-300 text-xs font-bold rounded flex items-center gap-1.5 transition-colors"
                            >
                              <X className="w-4 h-4" /> Từ Chối
                            </button>
                          </>
                        ) : p.status === 'APPROVED' ? (
                          <div className="text-emerald-400 text-xs flex items-center gap-1 font-semibold">
                            <CheckCircle2 className="w-4 h-4" /> Đã cấp quyền Barrier
                          </div>
                        ) : (
                          <div className="text-rose-400 text-xs flex items-center gap-1 font-semibold">
                            <XCircle className="w-4 h-4" /> Đã từ chối
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ============================================================= */}
          {/* TAB 3: SMART GATE SCANNER SIMULATION (STRICTLY ADMIN ONLY)    */}
          {/* ============================================================= */}
          {activeTab === 'SCANNER' && isAdmin && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-[#222B35] pb-3">
                <h4 className="font-serif text-base font-bold text-white flex items-center gap-2">
                  <Scan className="w-5 h-5 text-[#C5A880]" /> Mô Phỏng Quét QR Cổng Barrier (3 Kịch Bản Kiểm Tra)
                </h4>
                <p className="text-xs text-gray-400">
                  Thử nghiệm 3 trường hợp thực tế: QR Hợp Lệ (Đã duyệt), QR Chưa Duyệt / Giả Mạo, và QR Đã Hết Hạn
                </p>
              </div>

              {/* 3 Quick Test Trigger Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const approved = passes.find(p => p.status === 'APPROVED');
                    if (approved) {
                      setCustomQrInput(approved.qrData);
                      handleSimulateScan(approved.qrData);
                    } else {
                      alert('Chưa có mã nào được duyệt. Vui lòng duyệt một mã trước!');
                    }
                  }}
                  className="p-4 bg-[#121E2A] hover:bg-[#162738] border border-emerald-500/80 rounded-xl text-left transition-all shadow-lg group"
                >
                  <div className="text-xs font-bold text-emerald-400 flex items-center justify-between mb-1">
                    <span>🟢 1. Quét QR Đúng (Hợp Lệ)</span>
                  </div>
                  <div className="text-xs text-gray-200">Mã BQL đã phê duyệt & còn thời hạn</div>
                  <div className="text-[10px] text-gray-400 mt-2 flex items-center gap-1 group-hover:text-emerald-300">
                    → Barrier tự động mở, cấp quyền thang máy
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const invalidQr = 'INVALID_UNKNOWN_QR_SKYLINE_999999';
                    setCustomQrInput(invalidQr);
                    handleSimulateScan(invalidQr);
                  }}
                  className="p-4 bg-[#201518] hover:bg-[#2B1B20] border border-rose-500/80 rounded-xl text-left transition-all shadow-lg group"
                >
                  <div className="text-xs font-bold text-rose-400 flex items-center justify-between mb-1">
                    <span>🔴 2. Quét QR Sai / Chưa Duyệt</span>
                  </div>
                  <div className="text-xs text-gray-200">Mã giả mạo hoặc BQL chưa phê duyệt</div>
                  <div className="text-[10px] text-gray-400 mt-2 flex items-center gap-1 group-hover:text-rose-300">
                    → Cổng Barrier khóa cứng, báo còi an ninh
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const expiredQr = 'EXP_VISITOR_EXPIRED_MOCK_DATA';
                    setCustomQrInput(expiredQr);
                    handleSimulateScan(expiredQr);
                  }}
                  className="p-4 bg-[#231E12] hover:bg-[#302918] border border-amber-500/80 rounded-xl text-left transition-all shadow-lg group"
                >
                  <div className="text-xs font-bold text-amber-400 flex items-center justify-between mb-1">
                    <span>🟡 3. Quét QR Quá Hạn</span>
                  </div>
                  <div className="text-xs text-gray-200">Mã đã quá 24h hoặc hết thời gian mời</div>
                  <div className="text-[10px] text-gray-400 mt-2 flex items-center gap-1 group-hover:text-amber-300">
                    → Cổng đóng, cảnh báo mã đã hết hiệu lực
                  </div>
                </button>
              </div>

              {/* Simulation Display Barrier Status */}
              <div className="bg-[#121820] border border-[#222B35] p-6 rounded-xl space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-[#222B35] pb-3">
                  <div className="text-xs uppercase tracking-wider text-[#C5A880] font-bold flex items-center gap-2">
                    <Camera className="w-4 h-4" /> Camera AI Barrier Hầm B1 & Sảnh A
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    <span className="text-[11px] font-mono text-emerald-400">Trực Tuyến</span>
                  </div>
                </div>

                {isScanningSimulation ? (
                  <div className="py-12 text-center text-xs text-[#C5A880] space-y-3 font-mono">
                    <Scan className="w-10 h-10 animate-spin mx-auto text-[#C5A880]" />
                    <div>Đang đối soát mã QR với Cơ Sở Dữ Liệu An Ninh Tòa Nhà...</div>
                  </div>
                ) : scanResult ? (
                  <div className="space-y-4">
                    <div className={`p-4 rounded-xl border flex items-start gap-4 ${
                      scanResult.canEnter && scanResult.scanResult === 'VALID'
                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200'
                        : scanResult.scanResult === 'EXPIRED'
                        ? 'bg-amber-950/60 border-amber-500 text-amber-200'
                        : 'bg-rose-950/60 border-rose-500 text-rose-200'
                    }`}>
                      {scanResult.canEnter && scanResult.scanResult === 'VALID' ? (
                        <CheckCircle2 className="w-7 h-7 text-emerald-400 flex-shrink-0" />
                      ) : scanResult.scanResult === 'EXPIRED' ? (
                        <AlertTriangle className="w-7 h-7 text-amber-400 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-7 h-7 text-rose-400 flex-shrink-0" />
                      )}

                      <div className="space-y-1 text-xs">
                        <div className="font-bold text-sm sm:text-base">
                          {scanResult.message}
                        </div>
                        {scanResult.pass && (
                          <div className="text-gray-300 text-xs space-y-0.5 pt-1">
                            <div>• Khách: <strong>{scanResult.pass.visitorName}</strong> ({scanResult.pass.visitorPhone})</div>
                            <div>• Điểm đến: <strong>Căn hộ {scanResult.pass.apartmentCode}</strong> (Chủ hộ: {scanResult.pass.hostName})</div>
                            <div>• Phê duyệt bởi: <strong>{scanResult.pass.approvedBy || 'Ban Quản Lý'}</strong></div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Barrier Visual Indicator */}
                    <div className="p-4 bg-[#161B22] border border-[#222B35] rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {barrierState === 'OPEN' ? (
                          <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-emerald-400">
                            <Unlock className="w-5 h-5" />
                          </div>
                        ) : barrierState === 'LOCKED' ? (
                          <div className="w-10 h-10 rounded-full bg-rose-500/20 border border-rose-500 flex items-center justify-center text-rose-400">
                            <Lock className="w-5 h-5" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-700/40 border border-gray-600 flex items-center justify-center text-gray-400">
                            <Lock className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <div className="text-xs text-gray-400">Trạng Thái Barrier Cổng:</div>
                          <div className="font-serif font-bold text-sm sm:text-base">
                            {barrierState === 'OPEN' && <span className="text-emerald-400">ĐÃ MỞ - KHÁCH ĐƯỢC PHÉP VÀO</span>}
                            {barrierState === 'LOCKED' && <span className="text-rose-400">KHÓA CỨNG - BÁO ĐỘNG AN NINH</span>}
                            {barrierState === 'CLOSED' && <span className="text-gray-300">ĐANG ĐÓNG (Chờ quét mã)</span>}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setBarrierState('CLOSED');
                          setScanResult(null);
                        }}
                        className="px-3 py-1.5 bg-[#222B35] hover:bg-[#2D3748] text-gray-300 text-xs rounded transition-colors"
                      >
                        Đặt Lại Cổng
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-400 text-xs space-y-2">
                    <Scan className="w-8 h-8 text-gray-600 mx-auto" />
                    <p>Bấm vào 1 trong 3 nút kiểm tra nhanh ở trên để kiểm tra phản hồi của hệ thống barrier thông minh.</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Modal Bottom Footer */}
        <div className="p-4 bg-[#121820] border-t border-[#222B35] flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="text-[11px] font-mono">Hệ Thống Kiểm Soát Ra Vào Tự Động Skyline Gate 4.0</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-[#161D26] hover:bg-[#202937] text-gray-300 hover:text-white rounded border border-gray-700 text-xs font-semibold transition-colors"
          >
            Đóng Cửa Sổ
          </button>
        </div>

      </div>
    </div>
  );
}
