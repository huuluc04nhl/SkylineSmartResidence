'use client';

import React, { useState, useEffect } from 'react';
import { Bill, BillDetail, User } from '@/lib/dataStore';
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
  Lock,
  Calendar,
  Receipt,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { 
  getBills, 
  payBill, 
  ExtendedBill 
} from '@/lib/billingStore';

type MainGatewayType = 'VNPAY' | 'MOMO';
type VnpaySubChannel = 'QR' | 'ATM';
type MomoSubChannel = 'QR' | 'WALLET';

interface FinanceBillingProps {
  currentUser?: User;
}

export default function FinanceBilling({ currentUser }: FinanceBillingProps) {
  const aptCode = currentUser?.apartment_code || '12A05';
  const residentName = currentUser?.full_name || (currentUser as any)?.fullname || 'Nguyễn Hữu Lực';
  const residentPhone = currentUser?.phone || '0364967082';

  const [bills, setBills] = useState<ExtendedBill[]>([]);
  const [selectedBillId, setSelectedBillId] = useState<string>('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<MainGatewayType>('VNPAY');
  
  // VNPAY states
  const [vnpChannel, setVnpChannel] = useState<VnpaySubChannel>('QR');
  const [selectedBank, setSelectedBank] = useState('VCB');
  const [cardNumber, setCardNumber] = useState('9704 1985 2619 1432 198');
  const [cardHolder, setCardHolder] = useState('NGUYEN VAN A');
  const [cardDate, setCardDate] = useState('07/15');
  const [vnpOtp, setVnpOtp] = useState('');
  const [vnpStep, setVnpStep] = useState<'FORM' | 'OTP'>('FORM');

  // MOMO states
  const [momoChannel, setMomoChannel] = useState<MomoSubChannel>('QR');
  const [momoPhone, setMomoPhone] = useState(residentPhone);
  const [momoOtp, setMomoOtp] = useState('');
  const [momoStep, setMomoStep] = useState<'PHONE' | 'OTP'>('PHONE');

  // Processing & result states
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastPaymentResult, setLastPaymentResult] = useState<{
    gateway: 'VNPAY' | 'MOMO';
    transId: string;
    amount: number;
    paidAt: string;
  } | null>(null);

  const refreshBills = () => {
    const list = getBills(aptCode);
    setBills(list);
  };

  useEffect(() => {
    refreshBills();
    const handleUpdate = () => refreshBills();
    window.addEventListener('skyline_billing_updated', handleUpdate);
    return () => window.removeEventListener('skyline_billing_updated', handleUpdate);
  }, [aptCode]);

  // Hóa đơn hiện tại đang xem (ưu tiên hóa đơn chưa thanh toán)
  const currentBill = bills.find(b => b.id === selectedBillId) 
    || bills.find(b => b.status === 'Unpaid') 
    || bills[0];

  const billAmountFormatted = currentBill ? currentBill.total_amount.toLocaleString('vi-VN') : '0';

  // Xử lý thanh toán VNPAY (QR hoặc Thẻ ATM)
  const handlePayVnpay = (channel: VnpaySubChannel) => {
    if (!currentBill) return;
    setIsProcessing(true);

    setTimeout(() => {
      const transId = `VNP${Date.now().toString().slice(-8)}`;
      const updated = payBill(currentBill.id, 'VNPAY', transId, channel === 'QR' ? 'VNPAY_QR' : selectedBank);
      setIsProcessing(false);

      if (updated) {
        setLastPaymentResult({
          gateway: 'VNPAY',
          transId,
          amount: currentBill.total_amount,
          paidAt: new Date().toLocaleString('vi-VN'),
        });
        setVnpStep('FORM');
      }
    }, 1000);
  };

  // Xử lý thanh toán MOMO (QR hoặc Trừ ví)
  const handlePayMomo = (channel: MomoSubChannel) => {
    if (!currentBill) return;
    setIsProcessing(true);

    setTimeout(() => {
      const transId = `MM${Date.now().toString().slice(-8)}`;
      const updated = payBill(currentBill.id, 'MOMO', transId, 'MOMO_WALLET');
      setIsProcessing(false);

      if (updated) {
        setLastPaymentResult({
          gateway: 'MOMO',
          transId,
          amount: currentBill.total_amount,
          paidAt: new Date().toLocaleString('vi-VN'),
        });
        setMomoStep('PHONE');
      }
    }, 1000);
  };

  return (
    <div className="space-y-6 w-full animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222B35] pb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-semibold flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" /> Tài Chính Căn Hộ • Căn {aptCode}
          </div>
          <h2 className="font-serif text-2xl text-white font-bold mt-1">
            Hóa Đơn & Thanh Toán Trực Tuyến
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {currentBill && currentBill.status === 'Unpaid' && (
            <button
              onClick={() => {
                setLastPaymentResult(null);
                setShowPaymentModal(true);
              }}
              className="px-5 py-2.5 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg"
            >
              <CreditCard className="w-4 h-4" /> Thanh Toán VNPay / MoMo
            </button>
          )}

          {currentBill && currentBill.status === 'Paid' && (
            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 bg-[#161B22] border border-[#2D3748] hover:border-[#C5A880] text-gray-200 text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-2"
            >
              <Receipt className="w-4 h-4 text-[#C5A880]" /> In Biên Nhận Thu Phí
            </button>
          )}
        </div>
      </div>

      {/* Cảnh báo rò rỉ / biến động tiêu thụ */}
      {currentBill?.has_ai_anomaly && (
        <div className="p-4 bg-amber-950/40 border border-amber-500 flex items-start gap-3 animate-fadeIn">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs text-gray-200">
            <div className="text-amber-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" /> Cảnh Báo Tiêu Thụ Nước Bất Thường
            </div>
            <p className="text-gray-300">
              Hệ thống phát hiện dòng chảy liên tục khung giờ <strong>02:00 - 04:00 sáng</strong> (+115% so với tháng trước).
              Vui lòng kiểm tra van xả bồn cầu hoặc thiết bị vệ sinh trong căn hộ để tránh phát sinh chi phí lãng phí nước sạch.
            </p>
          </div>
        </div>
      )}

      {/* Selector nếu có nhiều kỳ hóa đơn */}
      {bills.length > 1 && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-400">Chọn kỳ thanh toán:</span>
          <div className="flex items-center gap-2">
            {bills.map(b => (
              <button
                key={b.id}
                onClick={() => setSelectedBillId(b.id)}
                className={`px-3 py-1.5 text-xs font-mono transition-all ${
                  (currentBill?.id === b.id)
                    ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow'
                    : 'bg-[#161B22] border border-[#2D3748] text-gray-300 hover:text-white'
                }`}
              >
                {b.billing_month} ({b.status === 'Paid' ? 'Đã thanh toán ✓' : 'Chưa thanh toán'})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bill Overview Card */}
      {currentBill ? (
        <div className="p-6 bg-[#121820] border border-[#222B35] space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222B35] pb-4">
            <div>
              <div className="text-xs text-gray-400">Kỳ thu phí: <strong className="text-white">{currentBill.billing_month}</strong></div>
              <div className="text-xs text-gray-400 mt-0.5">
                Hạn chót thanh toán: <strong className="text-amber-400 font-mono">
                  {new Date(currentBill.due_date).toLocaleDateString('vi-VN')}
                </strong>
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5">
                Đơn vị quản lý thu: <strong className="text-gray-200">Ban Quản Lý Chung Cư Skyline Smart Residence</strong>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs uppercase tracking-wider text-gray-400">Tổng Số Tiền Cần Thanh Toán</div>
              <div className="font-serif text-3xl font-bold text-[#C5A880]">
                {billAmountFormatted} đ
              </div>
              <div className="mt-1 flex items-center justify-end gap-2">
                <span className={`px-2.5 py-0.5 text-[10px] uppercase font-bold font-mono ${
                  currentBill.status === 'Paid'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500'
                    : 'bg-amber-950 text-amber-300 border border-amber-600'
                }`}>
                  {currentBill.status === 'Paid' ? '✓ Đã Thanh Toán Hoàn Tất' : 'Chờ Thanh Toán'}
                </span>

                {currentBill.payment_method && (
                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase font-mono ${
                    currentBill.payment_method === 'VNPAY'
                      ? 'bg-[#005BAA]/20 text-[#005BAA] border border-[#005BAA]/50'
                      : currentBill.payment_method === 'MOMO'
                        ? 'bg-[#A50064]/20 text-[#D82D8B] border border-[#A50064]/50'
                        : 'bg-gray-800 text-gray-300 border border-gray-600'
                  }`}>
                    Qua {currentBill.payment_method}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="space-y-3">
            <div className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
              Chi Tiết Các Hạng Mục Phí Dịch Vụ:
            </div>

            <div className="divide-y divide-[#222B35] border border-[#222B35] text-xs">
              {currentBill.details.map((item) => (
                <div key={item.id} className="p-3.5 flex items-center justify-between hover:bg-[#161B22] transition-colors">
                  <div>
                    <div className="font-bold text-white flex items-center gap-2">
                      <span>
                        {item.service_type === 'Electricity' ? 'Tiền Điện Sinh Hoạt' :
                         item.service_type === 'Water' ? 'Tiền Nước Sinh Hoạt' :
                         item.service_type === 'Management_Fee' ? 'Phí Quản Lý Vận Hành' :
                         item.service_type === 'Parking' ? 'Phí Gửi Xe Căn Hộ' : 'Phí Dịch Vụ'}
                      </span>
                      {item.ai_anomaly && (
                        <span className="px-2 py-0.5 bg-red-950 border border-red-500 text-red-300 text-[10px] font-mono font-bold">
                          Biến động bất thường
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-400 mt-0.5">
                      Khối lượng tiêu thụ: <strong>{item.usage}</strong> {item.service_type === 'Electricity' ? 'kWh' : item.service_type === 'Water' ? 'm³' : item.service_type === 'Management_Fee' ? 'm²' : 'xe'} • Đơn giá: {item.unit_price?.toLocaleString('vi-VN')} đ
                    </div>
                    {item.anomaly_reason && (
                      <div className="text-[10px] text-amber-400 italic mt-0.5">
                        * {item.anomaly_reason}
                      </div>
                    )}
                  </div>
                  <div className="font-mono font-bold text-sm text-white">
                    {item.total_line_amount.toLocaleString('vi-VN')} đ
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Gateway Action Banner */}
          <div className="p-4 bg-[#161B22] border border-[#2D3748] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div className="space-y-1">
              <div className="font-bold text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#C5A880]" /> 
                <span>Hỗ Trợ Thanh Toán Trực Tuyến 24/7 Qua Cổng:</span>
              </div>
              <div className="text-gray-400 flex items-center gap-3 pt-0.5">
                <span className="px-2 py-0.5 bg-[#005BAA]/20 border border-[#005BAA]/50 text-[#005BAA] font-bold text-[10px]">
                  Cổng VNPAY (ATM / Visa / QR)
                </span>
                <span className="px-2 py-0.5 bg-[#A50064]/20 border border-[#A50064]/50 text-[#D82D8B] font-bold text-[10px]">
                  Ví Điện Tử MoMo
                </span>
              </div>
            </div>

            {currentBill.status === 'Unpaid' ? (
              <button
                onClick={() => {
                  setLastPaymentResult(null);
                  setShowPaymentModal(true);
                }}
                className="px-5 py-2.5 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-colors shadow flex items-center gap-1.5 flex-shrink-0"
              >
                <CreditCard className="w-4 h-4" /> Mở Cổng Thanh Toán Ngay
              </button>
            ) : (
              <div className="text-emerald-400 font-mono text-xs flex items-center gap-1 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Đã hoàn tất thanh toán hóa đơn này
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-12 bg-[#121820] border border-[#222B35] text-center text-gray-400 text-xs">
          Căn hộ hiện chưa có hóa đơn nào được phát hành.
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL THANH TOÁN CHÍNH: VNPAY & MOMO GATEWAY                              */}
      {/* ========================================================================= */}
      {showPaymentModal && currentBill && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121820] border border-[#C5A880] max-w-lg w-full p-6 space-y-4 shadow-2xl animate-fadeIn text-white">
            <div className="flex items-center justify-between border-b border-[#222B35] pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#C5A880]" />
                <h3 className="font-serif text-lg font-bold text-white">
                  Cổng Thanh Toán Hóa Đơn Kỳ {currentBill.billing_month}
                </h3>
              </div>
              <button 
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Màn hình thông báo khi thanh toán thành công */}
            {lastPaymentResult ? (
              <div className="p-6 bg-[#161B22] border border-emerald-500 text-center space-y-4 animate-fadeIn">
                <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>

                <div className="space-y-1">
                  <h4 className="font-serif text-lg font-bold text-white">Giao Dịch Thành Công!</h4>
                  <p className="text-xs text-emerald-300">
                    Hệ thống đã nhận phản hồi IPN từ cổng thanh toán <strong>{lastPaymentResult.gateway}</strong>.
                  </p>
                </div>

                <div className="p-3 bg-[#121820] border border-[#2D3748] text-xs text-left space-y-1.5 font-mono">
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-sans">Mã giao dịch:</span>
                    <span className="text-[#C5A880] font-bold">{lastPaymentResult.transId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-sans">Số tiền thanh toán:</span>
                    <span className="text-white font-bold">{lastPaymentResult.amount.toLocaleString('vi-VN')} đ</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-sans">Căn hộ thụ hưởng:</span>
                    <span className="text-white">Căn {aptCode} ({residentName})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-sans">Thời gian ghi nhận:</span>
                    <span className="text-gray-300">{lastPaymentResult.paidAt}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-sans">Trạng thái gạch nợ:</span>
                    <span className="text-emerald-400 font-bold">ĐÃ GẠCH NỢ THÀNH CÔNG ✓</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-6 py-2.5 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-colors shadow"
                >
                  Hoàn Tất & Đóng
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 2 Primary Gateway Tabs: VNPAY vs MOMO */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedGateway('VNPAY')}
                    className={`p-3 border text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                      selectedGateway === 'VNPAY'
                        ? 'border-[#005BAA] bg-[#005BAA] text-white shadow-lg'
                        : 'border-[#222B35] bg-[#161B22] text-gray-400 hover:text-white'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" /> Cổng VNPAY
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedGateway('MOMO')}
                    className={`p-3 border text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                      selectedGateway === 'MOMO'
                        ? 'border-[#A50064] bg-[#A50064] text-white shadow-lg'
                        : 'border-[#222B35] bg-[#161B22] text-gray-400 hover:text-white'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" /> Ví Điện Tử MoMo
                  </button>
                </div>

                {/* ------------------------------------------------------------- */}
                {/* GATEWAY 1: VNPAY FLOW                                         */}
                {/* ------------------------------------------------------------- */}
                {selectedGateway === 'VNPAY' && (
                  <div className="space-y-3.5 bg-[#161B22] p-4 border border-[#005BAA]/50 text-xs">
                    <div className="flex items-center justify-between border-b border-[#222B35] pb-2">
                      <span className="font-bold text-[#005BAA] uppercase tracking-wider flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4" /> Cổng Thanh Toán Quốc Gia VNPAY
                      </span>
                      <span className="font-mono text-[#C5A880] font-bold text-sm">
                        {billAmountFormatted} đ
                      </span>
                    </div>

                    {/* VNPAY Sub Channels: VNPAY-QR vs ATM Card */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setVnpChannel('QR')}
                        className={`px-3 py-1.5 text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                          vnpChannel === 'QR' 
                            ? 'bg-[#005BAA] text-white' 
                            : 'bg-[#121820] text-gray-400 border border-[#2D3748]'
                        }`}
                      >
                        <QrCode className="w-3.5 h-3.5" /> Quét Mã VNPAY-QR
                      </button>

                      <button
                        type="button"
                        onClick={() => setVnpChannel('ATM')}
                        className={`px-3 py-1.5 text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                          vnpChannel === 'ATM' 
                            ? 'bg-[#005BAA] text-white' 
                            : 'bg-[#121820] text-gray-400 border border-[#2D3748]'
                        }`}
                      >
                        <CreditCard className="w-3.5 h-3.5" /> Thẻ ATM / Tài Khoản Nội Địa
                      </button>
                    </div>

                    {/* VNPAY CHANNEL A: VNPAY-QR */}
                    {vnpChannel === 'QR' && (
                      <div className="space-y-3 text-center py-2">
                        <div className="p-3 bg-white border-2 border-[#005BAA] inline-block shadow-xl">
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=00020101021238540010A00000072701240006970436011009031122330208QRIBFTTA5303704540724650005802VN5913SKYLINE_12A0562200816SKYLINE12A05T086304`} 
                            alt="VNPAY-QR Code" 
                            className="w-40 h-40 object-contain mx-auto"
                          />
                        </div>

                        <p className="text-[11px] text-gray-300 max-w-sm mx-auto">
                          Mở ứng dụng <strong>Mobile Banking của 35+ ngân hàng</strong> (Vietcombank, BIDV, Techcombank, MB, Agribank...) hoặc <strong>Ví VNPAY</strong> và chọn tính năng quét mã QR.
                        </p>

                        <button
                          type="button"
                          onClick={() => handlePayVnpay('QR')}
                          disabled={isProcessing}
                          className="w-full py-2.5 bg-[#005BAA] hover:bg-[#004887] text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-lg"
                        >
                          {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                          {isProcessing ? 'Đang Kiểm Tra Phản Hồi VNPAY...' : 'Xác Nhận Đã Quét Mã VNPAY-QR Thành Công'}
                        </button>
                      </div>
                    )}

                    {/* VNPAY CHANNEL B: ATM CARD FORM & OTP */}
                    {vnpChannel === 'ATM' && (
                      <div className="space-y-3 pt-1">
                        {vnpStep === 'FORM' ? (
                          <div className="space-y-2.5">
                            <div className="space-y-1">
                              <label className="text-[11px] text-gray-400">Chọn Ngân Hàng Nội Địa:</label>
                              <select
                                value={selectedBank}
                                onChange={(e) => setSelectedBank(e.target.value)}
                                className="w-full bg-[#121820] border border-[#2D3748] p-2 text-white text-xs focus:outline-none focus:border-[#005BAA]"
                              >
                                <option value="VCB">Vietcombank - Ngân hàng TMCP Ngoại Thương</option>
                                <option value="BIDV">BIDV - Ngân hàng Đầu tư & Phát triển</option>
                                <option value="TCB">Techcombank - Ngân hàng Kỹ Thương</option>
                                <option value="MB">MBBank - Ngân hàng Quân Đội</option>
                                <option value="CTG">VietinBank - Ngân hàng Công Thương</option>
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[11px] text-gray-400">Số Thẻ Ngân Hàng (ATM):</label>
                              <input
                                type="text"
                                value={cardNumber}
                                onChange={(e) => setCardNumber(e.target.value)}
                                placeholder="9704 xxxx xxxx xxxx"
                                className="w-full bg-[#121820] border border-[#2D3748] p-2 text-white text-xs font-mono focus:outline-none focus:border-[#005BAA]"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[11px] text-gray-400">Tên In Trên Thẻ:</label>
                                <input
                                  type="text"
                                  value={cardHolder}
                                  onChange={(e) => setCardHolder(e.target.value)}
                                  className="w-full bg-[#121820] border border-[#2D3748] p-2 text-white text-xs font-mono uppercase focus:outline-none focus:border-[#005BAA]"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[11px] text-gray-400">Ngày Phát Hành:</label>
                                <input
                                  type="text"
                                  value={cardDate}
                                  onChange={(e) => setCardDate(e.target.value)}
                                  placeholder="MM/YY"
                                  className="w-full bg-[#121820] border border-[#2D3748] p-2 text-white text-xs font-mono focus:outline-none focus:border-[#005BAA]"
                                />
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => setVnpStep('OTP')}
                              className="w-full py-2.5 bg-[#005BAA] hover:bg-[#004887] text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 shadow"
                            >
                              Tiếp Tục Xác Thực OTP <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-3 bg-[#121820] p-4 border border-[#2D3748] text-center">
                            <div className="text-xs text-gray-300">
                              Mã xác thực OTP đã được gửi tới số điện thoại đăng ký thẻ ngân hàng ({selectedBank}):
                            </div>

                            <input
                              type="text"
                              maxLength={6}
                              placeholder="Nhập 6 số OTP (VD: 123456)"
                              value={vnpOtp}
                              onChange={(e) => setVnpOtp(e.target.value)}
                              className="w-48 mx-auto bg-[#161B22] border-2 border-[#005BAA] p-2.5 text-center text-white text-base font-mono tracking-widest focus:outline-none"
                            />

                            <div className="flex gap-2 justify-center pt-2">
                              <button
                                type="button"
                                onClick={() => setVnpStep('FORM')}
                                className="px-3 py-1.5 border border-gray-700 text-xs text-gray-400"
                              >
                                Quay Lại
                              </button>

                              <button
                                type="button"
                                onClick={() => handlePayVnpay('ATM')}
                                disabled={isProcessing}
                                className="px-5 py-2 bg-[#005BAA] hover:bg-[#004887] text-white text-xs font-bold uppercase tracking-wider transition-colors shadow flex items-center gap-1.5"
                              >
                                {isProcessing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                Xác Nhận Thanh Toán
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ------------------------------------------------------------- */}
                {/* GATEWAY 2: MOMO E-WALLET FLOW                                 */}
                {/* ------------------------------------------------------------- */}
                {selectedGateway === 'MOMO' && (
                  <div className="space-y-3.5 bg-[#161B22] p-4 border border-[#A50064]/50 text-xs">
                    <div className="flex items-center justify-between border-b border-[#222B35] pb-2">
                      <span className="font-bold text-[#D82D8B] uppercase tracking-wider flex items-center gap-1.5">
                        <Smartphone className="w-4 h-4" /> Cổng Thanh Toán Ví Điện Tử MoMo
                      </span>
                      <span className="font-mono text-[#C5A880] font-bold text-sm">
                        {billAmountFormatted} đ
                      </span>
                    </div>

                    {/* MoMo Sub Channels */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setMomoChannel('QR')}
                        className={`px-3 py-1.5 text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                          momoChannel === 'QR' 
                            ? 'bg-[#A50064] text-white' 
                            : 'bg-[#121820] text-gray-400 border border-[#2D3748]'
                        }`}
                      >
                        <QrCode className="w-3.5 h-3.5" /> Quét Mã MoMo QR
                      </button>

                      <button
                        type="button"
                        onClick={() => setMomoChannel('WALLET')}
                        className={`px-3 py-1.5 text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                          momoChannel === 'WALLET' 
                            ? 'bg-[#A50064] text-white' 
                            : 'bg-[#121820] text-gray-400 border border-[#2D3748]'
                        }`}
                      >
                        <Smartphone className="w-3.5 h-3.5" /> Trừ Ví MoMo Trực Tiếp
                      </button>
                    </div>

                    {/* MOMO CHANNEL A: QR PAY */}
                    {momoChannel === 'QR' && (
                      <div className="space-y-3 text-center py-2">
                        <div className="p-3 bg-white border-2 border-[#A50064] inline-block shadow-xl">
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=2|99|${momoPhone}|${encodeURIComponent(residentName)}|skyline@residence.vn|0|0|${currentBill.total_amount}|Thanh%20toan%20hoa%20don%20Can%20${aptCode}|transfer_myqr`} 
                            alt="MoMo QR Code" 
                            className="w-40 h-40 object-contain mx-auto"
                          />
                        </div>

                        <p className="text-[11px] text-gray-300 max-w-sm mx-auto">
                          Mở ứng dụng <strong>Ví MoMo</strong> trên điện thoại, chọn biểu tượng <strong>Quét Mã</strong> để thanh toán tức thì số tiền <strong>{billAmountFormatted} đ</strong>.
                        </p>

                        <button
                          type="button"
                          onClick={() => handlePayMomo('QR')}
                          disabled={isProcessing}
                          className="w-full py-2.5 bg-[#A50064] hover:bg-[#850050] text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-lg"
                        >
                          {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                          {isProcessing ? 'Đang Chờ Xác Thực Từ MoMo...' : 'Xác Nhận Đã Quét Mã Ví MoMo Thành Công'}
                        </button>
                      </div>
                    )}

                    {/* MOMO CHANNEL B: WALLET DEBIT */}
                    {momoChannel === 'WALLET' && (
                      <div className="space-y-3 pt-1">
                        {momoStep === 'PHONE' ? (
                          <div className="space-y-2.5">
                            <div className="space-y-1">
                              <label className="text-[11px] text-gray-400">Số Điện Thoại Đăng Ký Ví MoMo:</label>
                              <input
                                type="text"
                                value={momoPhone}
                                onChange={(e) => setMomoPhone(e.target.value)}
                                placeholder="090x xxx xxx"
                                className="w-full bg-[#121820] border border-[#2D3748] p-2 text-white text-xs font-mono focus:outline-none focus:border-[#A50064]"
                              />
                            </div>

                            <div className="p-3 bg-[#121820] border border-[#2D3748] text-[11px] text-gray-400 space-y-1">
                              <div>Tài khoản ví: <strong className="text-white">{residentName}</strong></div>
                              <div>Hạn mức thanh toán: <span className="text-emerald-400 font-mono">Đủ số dư khả dụng</span></div>
                            </div>

                            <button
                              type="button"
                              onClick={() => setMomoStep('OTP')}
                              className="w-full py-2.5 bg-[#A50064] hover:bg-[#850050] text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 shadow"
                            >
                              Gửi Yêu Cầu Thanh Toán Đến Ví MoMo <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-3 bg-[#121820] p-4 border border-[#2D3748] text-center">
                            <div className="text-xs text-gray-300">
                              Yêu cầu thanh toán đã được gửi đến ứng dụng MoMo ({momoPhone}). Vui lòng nhập mã bảo mật OTP xác nhận:
                            </div>

                            <input
                              type="text"
                              maxLength={6}
                              placeholder="Nhập 6 số (VD: 686868)"
                              value={momoOtp}
                              onChange={(e) => setMomoOtp(e.target.value)}
                              className="w-48 mx-auto bg-[#161B22] border-2 border-[#A50064] p-2.5 text-center text-white text-base font-mono tracking-widest focus:outline-none"
                            />

                            <div className="flex gap-2 justify-center pt-2">
                              <button
                                type="button"
                                onClick={() => setMomoStep('PHONE')}
                                className="px-3 py-1.5 border border-gray-700 text-xs text-gray-400"
                              >
                                Quay Lại
                              </button>

                              <button
                                type="button"
                                onClick={() => handlePayMomo('WALLET')}
                                disabled={isProcessing}
                                className="px-5 py-2 bg-[#A50064] hover:bg-[#850050] text-white text-xs font-bold uppercase tracking-wider transition-colors shadow flex items-center gap-1.5"
                              >
                                {isProcessing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                Xác Nhận Trừ Tiền Ví MoMo
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
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
