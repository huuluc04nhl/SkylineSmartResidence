'use client';

import React, { useState } from 'react';
import { DEMO_BILLS } from '@/lib/dataStore';
import { 
  CreditCard, 
  AlertTriangle, 
  Download, 
  CheckCircle2, 
  QrCode, 
  Shield, 
  Sparkles, 
  X, 
  Copy, 
  Check, 
  Smartphone, 
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Building,
  Lock
} from 'lucide-react';
import SkylineLogo from '@/components/shared/SkylineLogo';

type PaymentMethodType = 'VNPAY' | 'MOMO' | 'VIETQR';

export default function FinanceBilling() {
  const currentBill = DEMO_BILLS[0]; // 12A05 Bill (2.465.000 đ)
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('VNPAY');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Copy helper
  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSimulatePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setPaymentSuccess(true);
      setTimeout(() => {
        setPaymentSuccess(false);
        setShowPaymentModal(false);
      }, 3000);
    }, 1200);
  };

  const billAmountFormatted = currentBill.total_amount.toLocaleString('vi-VN');

  return (
    <div className="space-y-6 w-full animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222B35] pb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-semibold flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" /> Quản Lý Tài Chính & Hóa Đơn Căn Hộ
          </div>
          <h2 className="font-serif text-2xl text-white font-bold mt-1">
            Hóa Đơn Dịch Vụ & Cổng Thanh Toán Trực Tuyến
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPaymentModal(true)}
            className="px-5 py-2.5 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg"
          >
            <CreditCard className="w-4 h-4" /> Thanh Toán VNPay / MoMo
          </button>
        </div>
      </div>

      {/* AI Leakage Detection Alert Banner */}
      <div className="p-4 bg-amber-950/40 border border-amber-500 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-gray-200">
          <div className="text-amber-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" /> Cảnh Báo AI Energy: Nghi Vấn Rò Rỉ Nước Sinh Hoạt
          </div>
          <p className="text-gray-300">
            Hệ thống AI phát hiện lượng nước tiêu thụ tăng vọt <strong>+115%</strong> và có dòng chảy liên tục vào khung giờ <strong>02:00 - 04:00 sáng</strong>. 
            Kính đề nghị Quý chủ hộ kiểm tra lại các van xả bồn cầu hoặc thiết bị vệ sinh trong căn 12A05 để tránh thất thoát nước.
          </p>
        </div>
      </div>

      {/* Bill Overview Card */}
      <div className="p-6 bg-[#121820] border border-[#222B35] space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222B35] pb-4">
          <div>
            <div className="text-xs text-gray-400">Kỳ thanh toán: <strong className="text-white">{currentBill.billing_month}</strong></div>
            <div className="text-xs text-gray-400 mt-0.5">Hạn chót thanh toán: <strong className="text-amber-400 font-mono">30/08/2026</strong></div>
            <div className="text-[11px] text-gray-400 mt-0.5">Đơn vị thụ hưởng: <strong className="text-gray-200">BQL Chung cư SKYLINE Smart Residence</strong></div>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-wider text-gray-400">Tổng Tiền Cần Thanh Toán</div>
            <div className="font-serif text-3xl font-bold text-[#C5A880]">
              {billAmountFormatted} đ
            </div>
            <span className="inline-block mt-1 px-2.5 py-0.5 bg-amber-950 text-amber-300 border border-amber-600 text-[10px] uppercase font-bold font-mono">
              Chờ Thanh Toán
            </span>
          </div>
        </div>

        {/* Breakdown Table */}
        <div className="space-y-3">
          <div className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
            Chi Tiết Từng Hạng Mục Phí Tháng 08/2026:
          </div>

          <div className="divide-y divide-[#222B35] border border-[#222B35] text-xs">
            {currentBill.details.map((item) => (
              <div key={item.id} className="p-3.5 flex items-center justify-between hover:bg-[#161B22] transition-colors">
                <div>
                  <div className="font-semibold text-white">
                    {item.service_type === 'Electricity' && '1. Tiền Điện Sinh Hoạt (Đo lường thông minh)'}
                    {item.service_type === 'Water' && '2. Tiền Nước Sinh Hoạt (AI Anomaly Alert +115%)'}
                    {item.service_type === 'Management_Fee' && '3. Phí Quản Lý Vận Hành Tòa Nhà (73.2 m² thông thủy)'}
                    {item.service_type === 'Parking' && '4. Phí Trông Giữ Xe Ô Tô Biển Số 51K-889.99 (Hầm B1)'}
                  </div>
                  {item.usage && (
                    <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                      Chỉ số tiêu thụ: {item.usage} • Đơn giá: {item.unit_price?.toLocaleString('vi-VN')} đ
                    </div>
                  )}
                  {item.ai_anomaly && (
                    <div className="text-[10px] text-amber-400 font-medium mt-0.5 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> {item.anomaly_reason}
                    </div>
                  )}
                </div>

                <div className="font-mono font-bold text-gray-200 text-sm">
                  {item.total_line_amount.toLocaleString('vi-VN')} đ
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-[#222B35]">
          <button className="text-xs text-[#C5A880] hover:underline flex items-center gap-1.5">
            <Download className="w-4 h-4" /> Tải Hóa Đơn Điện Tử PDF (e-Invoice & Chữ Ký Số)
          </button>
          <div className="text-[11px] text-gray-500">
            Hóa đơn được ký số bảo mật bởi Ban Quản Lý SKYLINE.
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MULTI-GATEWAY PAYMENT MODAL (VNPAY / MOMO / VIETQR)          */}
      {/* ------------------------------------------------------------- */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-[#0D1117] border border-[#C5A880] max-w-lg w-full p-6 md:p-7 text-white space-y-5 shadow-2xl relative">
            {/* Close Button */}
            <button 
              onClick={() => setShowPaymentModal(false)} 
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="border-b border-[#222B35] pb-3 text-center space-y-1">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#C5A880] font-bold">
                Cổng Thanh Toán Trực Tuyến
              </span>
              <h3 className="font-serif text-lg font-bold text-white">
                Thanh Toán Hóa Đơn Căn {currentBill.apt_code}
              </h3>
              <div className="text-sm font-mono text-[#C5A880] font-bold">
                Số tiền: {billAmountFormatted} đ
              </div>
            </div>

            {/* Success State Screen */}
            {paymentSuccess ? (
              <div className="py-8 text-center space-y-4 animate-fadeIn">
                <div className="w-16 h-16 bg-emerald-950/80 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 animate-bounce" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-serif text-xl font-bold text-white">Giao Dịch Thành Công!</h4>
                  <p className="text-xs text-gray-300">
                    Hệ thống đã tự động gạch nợ hóa đơn Tháng {currentBill.billing_month} cho Căn {currentBill.apt_code}.
                  </p>
                  <p className="text-[11px] font-mono text-[#C5A880] pt-1">
                    Mã chuẩn chi: SKY-PAY-{Date.now().toString().slice(-8)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 3 Payment Methods Switcher */}
                <div className="grid grid-cols-3 gap-1.5 bg-[#121820] p-1 border border-[#222B35]">
                  {/* Method 1: VNPay */}
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('VNPAY')}
                    className={`py-2 px-1 text-center text-[11px] uppercase tracking-wider font-semibold transition-all flex flex-col items-center gap-1 ${
                      selectedMethod === 'VNPAY'
                        ? 'bg-[#005BAA] text-white font-bold shadow'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <span className="font-black text-xs">VNPAY</span>
                    <span className="text-[9px] font-normal opacity-90">QR / Thẻ ATM</span>
                  </button>

                  {/* Method 2: MoMo */}
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('MOMO')}
                    className={`py-2 px-1 text-center text-[11px] uppercase tracking-wider font-semibold transition-all flex flex-col items-center gap-1 ${
                      selectedMethod === 'MOMO'
                        ? 'bg-[#A50064] text-white font-bold shadow'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <span className="font-black text-xs">Ví MoMo</span>
                    <span className="text-[9px] font-normal opacity-90">MoMo QR / 1-Chạm</span>
                  </button>

                  {/* Method 3: VietQR Bank Transfer */}
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('VIETQR')}
                    className={`py-2 px-1 text-center text-[11px] uppercase tracking-wider font-semibold transition-all flex flex-col items-center gap-1 ${
                      selectedMethod === 'VIETQR'
                        ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <span className="font-black text-xs">VietQR</span>
                    <span className="text-[9px] font-normal opacity-90">Chuyển Khoản 24/7</span>
                  </button>
                </div>

                {/* --------------------------------------------------------- */}
                {/* 1. VNPAY TAB CONTENT                                      */}
                {/* --------------------------------------------------------- */}
                {selectedMethod === 'VNPAY' && (
                  <div className="space-y-3.5 text-center bg-[#121820] p-4 border border-[#005BAA]/50">
                    <div className="flex items-center justify-between text-xs border-b border-[#222B35] pb-2">
                      <span className="text-[#005BAA] font-bold">Cổng Thanh Toán VNPAY-QR</span>
                      <span className="text-[10px] text-gray-400 font-mono">Merchant: SKYLINE_RES</span>
                    </div>

                    <div className="p-2.5 bg-white inline-block border-2 border-[#005BAA] shadow-md">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=00020101021238540010A00000072701240006970436011009031122330208QRIBFTTA5303704540724650005802VN5913SKYLINE_12A0562200816SKYLINE12A05T086304`}
                        alt="VNPAY QR"
                        className="w-40 h-40 object-contain"
                      />
                    </div>

                    <p className="text-[11px] text-gray-300">
                      Mở ứng dụng <strong>Ngân hàng</strong> bất kỳ (VCB, BIDV, Techcombank, MB...) hoặc <strong>Ví VNPAY</strong> và quét mã QR trên để thanh toán.
                    </p>

                    <button
                      onClick={handleSimulatePayment}
                      disabled={isProcessing}
                      className="w-full py-2.5 bg-[#005BAA] hover:bg-[#004887] text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-md"
                    >
                      {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      {isProcessing ? 'Đang Kiểm Tra Kết Quả VNPAY...' : 'Xác Nhận Đã Thanh Toán VNPAY (Giả Lập IPN)'}
                    </button>
                  </div>
                )}

                {/* --------------------------------------------------------- */}
                {/* 2. MOMO TAB CONTENT                                       */}
                {/* --------------------------------------------------------- */}
                {selectedMethod === 'MOMO' && (
                  <div className="space-y-3.5 text-center bg-[#121820] p-4 border border-[#A50064]/50">
                    <div className="flex items-center justify-between text-xs border-b border-[#222B35] pb-2">
                      <span className="text-[#D82D8B] font-bold flex items-center gap-1">
                        Ví Điện Tử MoMo (QR Pay)
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">Partner: SKYLINE_MOMO</span>
                    </div>

                    <div className="p-2.5 bg-white inline-block border-2 border-[#A50064] shadow-md">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=2|99|0903112233|NGUYEN%20HUU%20LUC|luctk@skyline.vn|0|0|2465000|Thanh%20toan%20hoa%20don%20Can%2012A05%20T8|transfer_myqr`}
                        alt="MoMo QR"
                        className="w-40 h-40 object-contain"
                      />
                    </div>

                    <p className="text-[11px] text-gray-300">
                      Mở ứng dụng <strong>Ví MoMo</strong> trên điện thoại, chọn <strong>Quét Mã</strong> để thanh toán tức thì <strong>{billAmountFormatted} đ</strong>.
                    </p>

                    <button
                      onClick={handleSimulatePayment}
                      disabled={isProcessing}
                      className="w-full py-2.5 bg-[#A50064] hover:bg-[#850050] text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-md"
                    >
                      {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      {isProcessing ? 'Đang Xử Lý Giao Dịch MoMo...' : 'Xác Nhận Đã Thanh Toán MoMo (Webhook)'}
                    </button>
                  </div>
                )}

                {/* --------------------------------------------------------- */}
                {/* 3. VIETQR / BANK TRANSFER TAB CONTENT                     */}
                {/* --------------------------------------------------------- */}
                {selectedMethod === 'VIETQR' && (
                  <div className="space-y-3.5 bg-[#121820] p-4 border border-[#C5A880]/50">
                    <div className="flex items-center justify-between text-xs border-b border-[#222B35] pb-2">
                      <span className="text-[#C5A880] font-bold">Chuyển Khoản Ngân Hàng VietQR 24/7</span>
                      <span className="text-[10px] text-gray-400 font-mono">Napas 247 Auto Match</span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <div className="p-2 bg-white flex-shrink-0 border border-gray-400">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=00020101021238580010A0000007270128000697043601149988112233440208QRIBFTTA5303704540724650005802VN62240820SKYLINE%2012A05%20T0820266304`}
                          alt="VietQR Bank"
                          className="w-32 h-32 object-contain"
                        />
                      </div>

                      <div className="space-y-2 text-xs w-full">
                        <div className="flex justify-between items-center bg-[#161B22] p-2 border border-[#222B35]">
                          <div>
                            <div className="text-[10px] text-gray-400">Ngân Hàng Thụ Hưởng:</div>
                            <div className="font-semibold text-white">Vietcombank (Sở Giao Dịch)</div>
                          </div>
                        </div>

                        <div className="flex justify-between items-center bg-[#161B22] p-2 border border-[#222B35]">
                          <div>
                            <div className="text-[10px] text-gray-400">Số Tài Khoản:</div>
                            <div className="font-mono font-bold text-white">9988 1122 3344</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopy('998811223344', 'acc')}
                            className="text-[10px] text-[#C5A880] hover:text-white flex items-center gap-1"
                          >
                            {copiedField === 'acc' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            {copiedField === 'acc' ? 'Đã chép' : 'Sao chép'}
                          </button>
                        </div>

                        <div className="flex justify-between items-center bg-[#161B22] p-2 border border-[#222B35]">
                          <div>
                            <div className="text-[10px] text-gray-400">Cú Pháp Chuyển Khoản:</div>
                            <div className="font-mono font-bold text-[#C5A880]">SKYLINE 12A05 T082026</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopy('SKYLINE 12A05 T082026', 'msg')}
                            className="text-[10px] text-[#C5A880] hover:text-white flex items-center gap-1"
                          >
                            {copiedField === 'msg' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            {copiedField === 'msg' ? 'Đã chép' : 'Sao chép'}
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleSimulatePayment}
                      disabled={isProcessing}
                      className="w-full py-2.5 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-md"
                    >
                      {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      {isProcessing ? 'Đang Kiểm Tra Biến Động Số Dư...' : 'Tôi Đã Chuyển Khoản Xong'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
