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
  Lock,
  Unlock,
  Building,
  Car,
  XCircle,
  Camera,
  ShieldAlert,
  Info,
  Zap,
  Repeat
} from 'lucide-react';
import { 
  GeneratedVisitorPass,
  PassEntryType,
  generateVisitorPassToken,
  verifyVisitorQr,
  VerificationScanResult
} from '@/lib/visitorStore';
import { User as UserType } from '@/lib/dataStore';

interface VisitorQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  apartmentCode: string;
  currentUser?: UserType;
  defaultTab?: 'RESIDENT' | 'SCANNER';
}

export default function VisitorQrModal({ 
  isOpen, 
  onClose, 
  apartmentCode = '12A05',
  currentUser,
  defaultTab = 'RESIDENT'
}: VisitorQrModalProps) {
  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'TECHNICIAN';

  // Active view tab
  const [activeTab, setActiveTab] = useState<'RESIDENT' | 'SCANNER'>(
    !isAdmin ? 'RESIDENT' : defaultTab
  );

  // Form State
  const [visitorName, setVisitorName] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [validHours, setValidHours] = useState('4');
  const [entryType, setEntryType] = useState<PassEntryType>('MULTI');
  const [activePass, setActivePass] = useState<GeneratedVisitorPass | null>(null);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Scanner Simulator State (BQL / Kỹ thuật)
  const [customQrInput, setCustomQrInput] = useState('');
  const [scanResult, setScanResult] = useState<VerificationScanResult | null>(null);
  const [isScanningSimulation, setIsScanningSimulation] = useState(false);
  const [barrierState, setBarrierState] = useState<'CLOSED' | 'OPEN' | 'LOCKED'>('CLOSED');

  // Generate initial pass on open
  useEffect(() => {
    if (isOpen) {
      if (!activePass) {
        const pass = generateVisitorPassToken({
          apartmentCode,
          visitorName: 'Khách Thăm Nhà',
          entryType: 'MULTI',
          validHours: 4,
        });
        setActivePass(pass);
      }
    }
  }, [isOpen, apartmentCode]);

  if (!isOpen) return null;

  // Handle Resident create/regenerate pass
  const handleGeneratePass = (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);

    setTimeout(() => {
      const pass = generateVisitorPassToken({
        apartmentCode,
        visitorName: visitorName.trim() || 'Khách Thăm Nhà',
        phoneNumber: visitorPhone.trim(),
        licensePlate: licensePlate.trim().toUpperCase(),
        entryType,
        validHours: parseInt(validHours, 10) || 4,
      });
      setActivePass(pass);
      setIsGenerating(false);
    }, 300);
  };

  // Copy share text
  const handleCopyPass = () => {
    if (!activePass) return;
    const expTime = new Date(activePass.validUntil).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const expDate = new Date(activePass.validUntil).toLocaleDateString('vi-VN');
    const typeLabel = activePass.entryType === 'SINGLE' ? 'Vé 1 Lần (Tự hủy sau khi vào cổng)' : 'Vé Nhiều Lần (Ra vào tự do trong thời hạn)';
    
    let shareText = `[SKYLINE SMART RESIDENCE] Thư Mời Khách Thăm Căn Hộ ${activePass.apartmentCode}\n`;
    shareText += `Kính gửi: ${activePass.visitorName}\n`;
    if (activePass.phoneNumber) shareText += `Số điện thoại: ${activePass.phoneNumber}\n`;
    if (activePass.licensePlate) shareText += `Biển số xe: ${activePass.licensePlate}\n`;
    shareText += `Điểm đến: Căn hộ ${activePass.apartmentCode} - Tòa ${activePass.apartmentCode.includes('A') ? 'A' : 'B'}\n`;
    shareText += `Mã PIN Thẻ Cổng: ${activePass.pinCode}\n`;
    shareText += `Thời hạn hiệu lực: Đến ${expTime} ngày ${expDate} (${activePass.validHours} giờ)\n`;
    shareText += `Loại thẻ: ${typeLabel}\n\n`;
    shareText += `Quý khách vui lòng xuất trình mã QR này trước camera Barrier hoặc Sảnh Thang Máy để vào tòa nhà.\n`;
    shareText += `(Lưu ý: Chung cư có Điểm Giao Nhận Hàng tại Sảnh Lễ Tân cho Shipper, mã này chỉ cấp quyền đón khách lên căn hộ).`;

    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Gate Scanner Simulator (BQL)
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
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0D1117] border border-[#C5A880]/80 max-w-3xl w-full p-5 sm:p-6 text-white space-y-5 shadow-2xl rounded-2xl max-h-[92vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#222B35] pb-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-semibold flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5" /> Dịch Vụ Đón Khách Thăm Căn Hộ
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-white mt-0.5">
              Mã QR Đón Khách • Căn Hộ {apartmentCode}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#161B22] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher (For Admin / Technician only) */}
        {isAdmin && (
          <div className="grid grid-cols-2 gap-2 bg-[#121820] p-1 rounded-xl border border-[#222B35] text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('RESIDENT')}
              className={`py-2 px-3 rounded-lg text-center font-medium transition-all ${
                activeTab === 'RESIDENT'
                  ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              1. Tạo Mã QR Đón Khách
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('SCANNER')}
              className={`py-2 px-3 rounded-lg text-center font-medium transition-all ${
                activeTab === 'SCANNER'
                  ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              2. Trạm Quét & Kiểm Tra Mã QR (Gate Scanner)
            </button>
          </div>
        )}

        {/* ================================================================= */}
        {/* VIEW 1: RESIDENT QR CREATION & REAL-TIME PASS DISPLAY             */}
        {/* ================================================================= */}
        {activeTab === 'RESIDENT' && (
          <div className="space-y-4">
            {/* Building Policy & Privacy Guarantee Banner */}
            <div className="p-3.5 bg-[#121E2A] border border-[#1E3A5F] rounded-xl flex items-start gap-2.5 text-xs text-cyan-200/95 leading-relaxed">
              <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Quy Định Tòa Nhà & Bảo Mật:</strong> Chung cư đã có <strong>Điểm Nhận Hàng & Bưu Phẩm Tập Trung tại Sảnh Lễ Tân</strong> dành cho Shipper. Mã QR này dành riêng để cư dân đón <strong>Khách Thăm</strong> trực tiếp lên căn hộ. Thông tin được mã hóa bảo mật thời gian thực và tự động hết hạn.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Form tạo mã thông tin khách */}
              <form onSubmit={handleGeneratePass} className="space-y-3.5 bg-[#121820] border border-[#222B35] p-4 sm:p-5 rounded-xl text-xs">
                <div className="text-xs font-bold uppercase tracking-wider text-[#C5A880] flex items-center gap-1.5 pb-2 border-b border-[#222B35]">
                  <UserCheck className="w-3.5 h-3.5" /> Thông Tin Khách Thăm
                </div>

                {/* 1. Họ tên khách */}
                <div>
                  <label className="text-gray-300 font-medium block mb-1">
                    Họ Tên Khách Thăm <span className="text-rose-400">*</span>:
                  </label>
                  <input
                    type="text"
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                    placeholder="VD: Anh Minh, Chị Lan..."
                    className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white rounded-lg focus:border-[#C5A880] outline-none"
                    required
                  />
                </div>

                {/* 2. Số điện thoại khách */}
                <div>
                  <label className="text-gray-300 font-medium block mb-1">
                    Số Điện Thoại Khách:
                  </label>
                  <input
                    type="tel"
                    value={visitorPhone}
                    onChange={(e) => setVisitorPhone(e.target.value)}
                    placeholder="VD: 0912 345 678 (Dùng liên hệ khi cần)"
                    className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white rounded-lg focus:border-[#C5A880] outline-none"
                  />
                </div>

                {/* 3. Biển số xe & Thời gian hiệu lực */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-300 font-medium block mb-1">
                      Biển Số Xe (Nếu Có):
                    </label>
                    <input
                      type="text"
                      value={licensePlate}
                      onChange={(e) => setLicensePlate(e.target.value)}
                      placeholder="VD: 51F-123.45"
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white font-mono uppercase rounded-lg focus:border-[#C5A880] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-gray-300 font-medium block mb-1">
                      Thời Gian Hiệu Lực:
                    </label>
                    <select
                      value={validHours}
                      onChange={(e) => setValidHours(e.target.value)}
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white rounded-lg focus:border-[#C5A880] outline-none"
                    >
                      <option value="1">1 Giờ (Gặp nhanh)</option>
                      <option value="2">2 Giờ (Tiếp khách)</option>
                      <option value="4">4 Giờ (Nửa ngày)</option>
                      <option value="8">8 Giờ (Trong ngày)</option>
                      <option value="24">24 Giờ (Cả ngày)</option>
                    </select>
                  </div>
                </div>

                {/* 4. Lượt sử dụng mã */}
                <div>
                  <label className="text-gray-300 font-medium block mb-1.5">Hình Thức Ra Vào Cổng:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEntryType('MULTI')}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        entryType === 'MULTI'
                          ? 'bg-[#1C2533] border-[#C5A880] ring-1 ring-[#C5A880]'
                          : 'bg-[#161B22] border-[#2D3748] text-gray-400 hover:text-white'
                      }`}
                    >
                      <div className="font-bold flex items-center gap-1 text-white text-[11px]">
                        <Repeat className="w-3.5 h-3.5 text-cyan-400" /> Quét Nhiều Lần
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5">Ra vào tự do trong thời hạn hiệu lực</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEntryType('SINGLE')}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        entryType === 'SINGLE'
                          ? 'bg-[#1C2533] border-[#C5A880] ring-1 ring-[#C5A880]'
                          : 'bg-[#161B22] border-[#2D3748] text-gray-400 hover:text-white'
                      }`}
                    >
                      <div className="font-bold flex items-center gap-1 text-white text-[11px]">
                        <Zap className="w-3.5 h-3.5 text-amber-400" /> Quét 1 Lần
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5">Tự hủy ngay sau khi vào cổng</div>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isGenerating}
                  className="w-full py-2.5 bg-[#C5A880] hover:bg-white text-[#0D1117] font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg transition-all flex items-center justify-center gap-2 mt-2"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Đang Tạo Mã Mới...
                    </>
                  ) : (
                    <>
                      <QrCode className="w-4 h-4" /> Tạo Mã QR Mời Khách
                    </>
                  )}
                </button>
              </form>

              {/* Thẻ hiển thị mã QR trực tiếp */}
              {activePass && (
                <div className="bg-gradient-to-b from-[#161D26] to-[#0E131A] border-2 border-[#C5A880] p-5 rounded-xl space-y-3.5 shadow-2xl flex flex-col justify-between">
                  <div className="flex items-center justify-between border-b border-[#222B35] pb-2.5">
                    <div className="space-y-0.5">
                      <div className="font-bold text-white text-base truncate">{activePass.visitorName}</div>
                      <div className="text-[11px] text-[#C5A880]">
                        Điểm đến: Căn hộ {activePass.apartmentCode}
                        {activePass.phoneNumber && ` • SĐT: ${activePass.phoneNumber}`}
                        {activePass.licensePlate && ` • Xe: ${activePass.licensePlate}`}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                      <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded border ${
                        activePass.entryType === 'SINGLE'
                          ? 'bg-amber-950 text-amber-300 border-amber-500/60'
                          : 'bg-cyan-950 text-cyan-300 border-cyan-500/60'
                      }`}>
                        {activePass.entryType === 'SINGLE' ? 'Vé 1 Lần' : 'Vé Nhiều Lần'}
                      </span>
                      <span className="text-[9px] text-emerald-400 font-mono">Hiệu Lực Ngay</span>
                    </div>
                  </div>

                  {/* QR Image Container */}
                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#0A0E14] p-3.5 rounded-xl border border-[#222B35]">
                    <div className="bg-white p-2 rounded-lg shadow-inner flex-shrink-0">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(activePass.qrData)}`}
                        alt="QR Mời Khách"
                        className="w-28 h-28 object-contain"
                      />
                    </div>

                    <div className="space-y-2 text-xs flex-1 w-full sm:w-auto">
                      <div className="p-2 bg-[#121820] border border-[#222B35] rounded space-y-0.5">
                        <div className="text-gray-400 text-[10px]">Mã PIN Nhập Cổng:</div>
                        <div className="font-mono text-lg font-bold text-[#C5A880] tracking-widest">
                          {activePass.pinCode}
                        </div>
                      </div>

                      <div className="text-[11px] text-gray-300 space-y-1">
                        <div className="flex items-center gap-1.5 text-emerald-400">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          <span>Thời hạn: {activePass.validHours} giờ</span>
                        </div>
                        <div className="text-[10px] text-gray-400">
                          Hết hạn: {new Date(activePass.validUntil).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ({new Date(activePass.validUntil).toLocaleDateString('vi-VN')})
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleCopyPass}
                      className="flex-1 py-2 px-3 bg-[#1C2533] hover:bg-[#253245] text-white text-xs font-semibold rounded-lg border border-[#2D3748] transition-colors flex items-center justify-center gap-1.5"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" /> Đã Sao Chép
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-[#C5A880]" /> Sao Chép Mã Mời
                        </>
                      )}
                    </button>

                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('SCANNER');
                          setCustomQrInput(activePass.qrData);
                          handleSimulateScan(activePass.qrData);
                        }}
                        className="py-2 px-3 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
                      >
                        <Scan className="w-3.5 h-3.5" /> Quét Thử Cổng
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* VIEW 2: GATE SCANNER VALIDATION (3 SECURITY STATES)               */}
        {/* ================================================================= */}
        {activeTab === 'SCANNER' && isAdmin && (
          <div className="space-y-4">
            <div className="p-3 bg-[#121820] border border-[#222B35] rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#C5A880]" />
                <span className="font-bold text-white">Trạm Quét Barrier Sảnh A/B:</span>
                <span className="text-gray-400">Kiểm tra tính hợp lệ của mã QR khi khách quét vào cổng</span>
              </div>
              <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 text-[10px] font-mono rounded border border-emerald-600">
                Trực Tuyến
              </span>
            </div>

            {/* 3 Quick-Test Scenarios */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => {
                  const validQr = activePass ? activePass.qrData : 'SKYLINE_PASS_VALID_12A05_101';
                  setCustomQrInput(validQr);
                  handleSimulateScan(validQr);
                }}
                className="p-3.5 bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/80 rounded-xl text-left transition-all shadow-lg"
              >
                <div className="text-xs font-bold text-emerald-300 flex items-center justify-between mb-1">
                  <span>🟢 1. Mã QR Đúng</span>
                  <span className="text-[10px] bg-emerald-500 text-black font-bold px-1.5 py-0.2 rounded">Hợp Lệ</span>
                </div>
                <div className="text-[11px] text-emerald-200/80">Mã có chữ ký số đúng & còn trong thời hạn</div>
                <div className="text-[10px] text-emerald-400 mt-2 font-medium">→ Barrier tự động mở, cấp quyền thang máy</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  const invalidQr = 'INVALID_UNKNOWN_QR_SKYLINE_999999';
                  setCustomQrInput(invalidQr);
                  handleSimulateScan(invalidQr);
                }}
                className="p-3.5 bg-rose-950/70 hover:bg-rose-900 border border-rose-500/80 rounded-xl text-left transition-all shadow-lg"
              >
                <div className="text-xs font-bold text-rose-300 flex items-center justify-between mb-1">
                  <span>🔴 2. Mã QR Sai</span>
                  <span className="text-[10px] bg-rose-500 text-white font-bold px-1.5 py-0.2 rounded">Không Hợp Lệ</span>
                </div>
                <div className="text-[11px] text-rose-200/80">Mã giả mạo hoặc không thuộc tòa nhà</div>
                <div className="text-[10px] text-rose-400 mt-2 font-medium">→ Cổng Barrier khóa chặt, cảnh báo an ninh</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  const expiredQr = 'EXP_VISITOR_EXPIRED_MOCK_DATA';
                  setCustomQrInput(expiredQr);
                  handleSimulateScan(expiredQr);
                }}
                className="p-3.5 bg-amber-950/70 hover:bg-amber-900 border border-amber-500/80 rounded-xl text-left transition-all shadow-lg"
              >
                <div className="text-xs font-bold text-amber-300 flex items-center justify-between mb-1">
                  <span>🟡 3. Mã QR Quá Hạn</span>
                  <span className="text-[10px] bg-amber-500 text-black font-bold px-1.5 py-0.2 rounded">Quá Hạn</span>
                </div>
                <div className="text-[11px] text-amber-200/80">Mã đã quá thời gian sử dụng được cấp</div>
                <div className="text-[10px] text-amber-400 mt-2 font-medium">→ Cổng đóng, thông báo mã đã hết hạn</div>
              </button>
            </div>

            {/* Custom Input Scanner */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSimulateScan(customQrInput);
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={customQrInput}
                onChange={(e) => setCustomQrInput(e.target.value)}
                placeholder="Nhập chuỗi mã QR hoặc mã PIN để kiểm tra..."
                className="flex-1 bg-[#161B22] border border-[#2D3748] p-2.5 text-white text-xs font-mono rounded-lg focus:border-[#C5A880] outline-none"
              />
              <button
                type="submit"
                disabled={isScanningSimulation || !customQrInput.trim()}
                className="px-4 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5"
              >
                {isScanningSimulation ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Scan className="w-3.5 h-3.5" />}
                Quét Mã
              </button>
            </form>

            {/* Scan Result & Barrier State */}
            {scanResult && (
              <div className="space-y-3 animate-fadeIn">
                <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${
                  scanResult.canEnter && scanResult.scanResult === 'VALID'
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200'
                    : scanResult.scanResult === 'EXPIRED'
                    ? 'bg-amber-950/60 border-amber-500 text-amber-200'
                    : 'bg-rose-950/60 border-rose-500 text-rose-200'
                }`}>
                  {scanResult.canEnter && scanResult.scanResult === 'VALID' ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                  ) : scanResult.scanResult === 'EXPIRED' ? (
                    <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-6 h-6 text-rose-400 flex-shrink-0" />
                  )}

                  <div className="space-y-1 text-xs">
                    <div className="font-bold text-sm">{scanResult.title}</div>
                    <div className="text-gray-200">{scanResult.message}</div>
                    <div className="text-[10px] text-gray-400 pt-0.5">Thời gian quét: {scanResult.scannedAt} • Điểm kiểm soát: {scanResult.checkpoint || 'Barrier Cổng Sảnh A'}</div>
                  </div>
                </div>

                {/* Barrier Hardware Indicator */}
                <div className="p-3.5 bg-[#121820] border border-[#222B35] rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {barrierState === 'OPEN' ? (
                      <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-emerald-400">
                        <Unlock className="w-4 h-4" />
                      </div>
                    ) : barrierState === 'LOCKED' ? (
                      <div className="w-9 h-9 rounded-full bg-rose-500/20 border border-rose-500 flex items-center justify-center text-rose-400">
                        <Lock className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gray-700/40 border border-gray-600 flex items-center justify-center text-gray-400">
                        <Lock className="w-4 h-4" />
                      </div>
                    )}
                    <div>
                      <div className="text-[11px] text-gray-400">Trạng Thái Barrier Cổng:</div>
                      <div className="font-bold text-xs sm:text-sm">
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
                    className="px-3 py-1.5 text-xs text-gray-400 hover:text-white bg-[#161B22] border border-[#2D3748] rounded-lg transition-colors"
                  >
                    Đặt Lại Barrier
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
