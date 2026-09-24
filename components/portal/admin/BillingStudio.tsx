'use client';

import React, { useState, useEffect } from 'react';
import { Bill, BillDetail } from '@/lib/dataStore';
import { 
  Receipt, 
  AlertTriangle, 
  CheckCircle2, 
  Send, 
  Download, 
  Sparkles, 
  Filter, 
  Check, 
  X,
  CreditCard,
  Building,
  Printer,
  Search
} from 'lucide-react';
import { 
  getBills, 
  confirmPaidByAdmin, 
  publishAllBills, 
  SKYLINE_BANK_INFO,
  ExtendedBill 
} from '@/lib/billingStore';

export default function BillingStudio() {
  const [bills, setBills] = useState<ExtendedBill[]>([]);
  const [filterType, setFilterType] = useState<'ALL' | 'UNPAID' | 'PAID' | 'ANOMALY'>('ALL');
  const [searchApt, setSearchApt] = useState('');
  const [isPublishedAll, setIsPublishedAll] = useState(false);
  const [reminderSent, setReminderSent] = useState(false);
  const [selectedDetailBill, setSelectedDetailBill] = useState<ExtendedBill | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const refreshBills = () => {
    setBills(getBills());
  };

  useEffect(() => {
    refreshBills();
    const handleUpdate = () => refreshBills();
    window.addEventListener('skyline_billing_updated', handleUpdate);
    return () => window.removeEventListener('skyline_billing_updated', handleUpdate);
  }, []);

  const displayedBills = bills.filter(b => {
    if (searchApt.trim() && !b.apt_code.toLowerCase().includes(searchApt.trim().toLowerCase()) && !b.owner_name.toLowerCase().includes(searchApt.trim().toLowerCase())) {
      return false;
    }
    if (filterType === 'UNPAID') return b.status === 'Unpaid';
    if (filterType === 'PAID') return b.status === 'Paid';
    if (filterType === 'ANOMALY') return b.has_ai_anomaly;
    return true;
  });

  const handlePublishAll = () => {
    publishAllBills();
    setIsPublishedAll(true);
    setActionSuccessMsg('Đã phát hành và gửi thông báo hóa đơn thành công tới toàn bộ căn hộ!');
    setTimeout(() => {
      setIsPublishedAll(false);
      setActionSuccessMsg(null);
    }, 3500);
  };

  const handleSendReminders = () => {
    setReminderSent(true);
    const unpaidCount = bills.filter(b => b.status === 'Unpaid').length;
    setActionSuccessMsg(`Đã gửi thông báo nhắc hạn thanh toán tới ${unpaidCount} căn hộ chưa hoàn tất nghĩa vụ phí!`);
    setTimeout(() => {
      setReminderSent(false);
      setActionSuccessMsg(null);
    }, 3500);
  };

  const handleConfirmPaid = (billId: string, aptCode: string) => {
    const updated = confirmPaidByAdmin(billId);
    if (updated) {
      setActionSuccessMsg(`Đã duyệt gạch nợ thành công cho Căn ${aptCode}! Hệ thống đã đồng bộ sang cổng Cư dân.`);
      setTimeout(() => setActionSuccessMsg(null), 3500);
    }
  };

  const totalRevenue = bills.filter(b => b.status === 'Paid').reduce((sum, b) => sum + b.total_amount, 0);
  const totalUnpaid = bills.filter(b => b.status === 'Unpaid').reduce((sum, b) => sum + b.total_amount, 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222B35] pb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-semibold flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5" /> Quản Trị Tài Chính • Kế Toán & Dịch Vụ
          </div>
          <h2 className="font-serif text-2xl text-white font-bold mt-1">
            Sổ Cái Tài Chính & Đối Soát Thu Phí
          </h2>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePublishAll}
            className="px-4 py-2 bg-[#C5A880] text-[#0D1117] text-xs font-bold uppercase tracking-wider hover:bg-white transition-colors shadow"
          >
            {isPublishedAll ? 'Đã Phát Hành Xong ✓' : 'Phát Hành Toàn Bộ Hóa Đơn'}
          </button>

          <button
            onClick={handleSendReminders}
            className="px-4 py-2 bg-[#1C2533] border border-[#2D3748] hover:border-[#C5A880] text-gray-200 text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5 text-[#C5A880]" />
            {reminderSent ? 'Đã Gửi Nhắc Phí ✓' : 'Gửi Nhắc Thanh Toán'}
          </button>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="p-3.5 bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-[#121820] border border-[#222B35] space-y-1">
          <div className="text-xs text-gray-400">Tổng Số Hóa Đơn Phát Hành</div>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            {bills.length} <span className="text-xs text-gray-400 font-normal">căn hộ</span>
          </div>
          <div className="text-[11px] text-gray-400">Kỳ thanh toán: Tháng 08/2026</div>
        </div>

        <div className="p-4 bg-[#121820] border border-emerald-500/30 space-y-1">
          <div className="text-xs text-gray-400">Đã Thu Thành Công</div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
            {totalRevenue.toLocaleString('vi-VN')} <span className="text-xs text-gray-400 font-normal">đ</span>
          </div>
          <div className="text-[11px] text-emerald-400 font-mono">
            {bills.filter(b => b.status === 'Paid').length} / {bills.length} căn hộ đã hoàn tất
          </div>
        </div>

        <div className="p-4 bg-[#121820] border border-amber-500/30 space-y-1">
          <div className="text-xs text-gray-400">Chờ Cư Dân Thanh Toán</div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
            {totalUnpaid.toLocaleString('vi-VN')} <span className="text-xs text-gray-400 font-normal">đ</span>
          </div>
          <div className="text-[11px] text-amber-400 font-mono">
            {bills.filter(b => b.status === 'Unpaid').length} căn hộ chưa thanh toán
          </div>
        </div>
      </div>

      {/* Anomaly Alert Banner: Chỉ hiển thị khi thực sự có căn hộ ghi nhận biến động bất thường */}
      {bills.some(b => b.has_ai_anomaly) && (
        <div className="p-4 bg-red-950/40 border border-red-500/60 flex items-start gap-3 animate-fadeIn">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <div className="text-red-300 font-bold uppercase tracking-wider">
              Cảnh Báo Biến Động Tiêu Thụ Bất Thường (&gt; 50%)
            </div>
            <p className="text-gray-300 leading-relaxed">
              Hệ thống tự động phát hiện và bôi đỏ các căn hộ có chỉ số nước/điện tăng đột biến trong tháng để Kế toán đối soát với số đo thực tế trước khi phát hành hoặc nhắc phí.
            </p>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 text-xs font-semibold border transition-all ${
              filterType === 'ALL'
                ? 'bg-[#C5A880] text-[#0D1117] border-[#C5A880]'
                : 'bg-[#161B22] border-[#2D3748] text-gray-300 hover:text-white'
            }`}
          >
            Tất Cả ({bills.length})
          </button>

          <button
            onClick={() => setFilterType('UNPAID')}
            className={`px-3 py-1.5 text-xs font-semibold border transition-all ${
              filterType === 'UNPAID'
                ? 'bg-amber-500 text-[#0D1117] border-amber-500 font-bold'
                : 'bg-[#161B22] border-[#2D3748] text-amber-400 hover:border-amber-400'
            }`}
          >
            Chờ Thanh Toán ({bills.filter(b => b.status === 'Unpaid').length})
          </button>

          <button
            onClick={() => setFilterType('PAID')}
            className={`px-3 py-1.5 text-xs font-semibold border transition-all ${
              filterType === 'PAID'
                ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                : 'bg-[#161B22] border-[#2D3748] text-emerald-400 hover:border-emerald-400'
            }`}
          >
            Đã Thanh Toán ({bills.filter(b => b.status === 'Paid').length})
          </button>

          <button
            onClick={() => setFilterType('ANOMALY')}
            className={`px-3 py-1.5 text-xs font-semibold border transition-all ${
              filterType === 'ANOMALY'
                ? 'bg-red-900 border-red-500 text-white font-bold'
                : 'bg-[#161B22] border-[#2D3748] text-red-400 hover:border-red-400'
            }`}
          >
            Biến Động Bất Thường ({bills.filter(b => b.has_ai_anomaly).length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Tìm theo mã căn, tên chủ hộ..."
            value={searchApt}
            onChange={(e) => setSearchApt(e.target.value)}
            className="w-full bg-[#161B22] border border-[#2D3748] text-xs text-white px-3 py-1.5 pr-8 focus:outline-none focus:border-[#C5A880]"
          />
          <Search className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-2.5 pointer-events-none" />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-[#121820] border border-[#222B35] overflow-x-auto shadow-xl">
        <table className="w-full text-left text-xs text-gray-300">
          <thead className="bg-[#161B22] text-[#C5A880] uppercase tracking-wider font-semibold border-b border-[#222B35] text-[11px]">
            <tr>
              <th className="p-3.5">Mã Căn</th>
              <th className="p-3.5">Chủ Hộ</th>
              <th className="p-3.5">Kỳ Thu</th>
              <th className="p-3.5 text-right">Tiền Điện</th>
              <th className="p-3.5 text-right">Tiền Nước</th>
              <th className="p-3.5 text-right">Phí Quản Lý</th>
              <th className="p-3.5 text-right">Phí Dịch Vụ</th>
              <th className="p-3.5 text-right">Tổng Tiền (VNĐ)</th>
              <th className="p-3.5 text-center">Trạng Thái</th>
              <th className="p-3.5 text-center">Ghi Chú</th>
              <th className="p-3.5 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#222B35]">
            {displayedBills.length === 0 ? (
              <tr>
                <td colSpan={11} className="p-8 text-center text-gray-500 italic">
                  Không tìm thấy hóa đơn nào phù hợp.
                </td>
              </tr>
            ) : (
              displayedBills.map((bill) => {
                const elecDetail = bill.details.find(d => d.service_type === 'Electricity');
                const waterDetail = bill.details.find(d => d.service_type === 'Water');
                const mgmtDetail = bill.details.find(d => d.service_type === 'Management_Fee');
                const serviceTotal = bill.details
                  .filter(d => !['Electricity', 'Water', 'Management_Fee', 'Parking'].includes(d.service_type))
                  .reduce((sum, d) => sum + (d.total_line_amount || 0), 0);
                const hasAnomaly = bill.has_ai_anomaly;
                const isPaid = bill.status === 'Paid';

                return (
                  <tr
                    key={bill.id}
                    className={`hover:bg-[#1A222C] transition-colors ${
                      hasAnomaly ? 'bg-red-950/20' : ''
                    }`}
                  >
                    <td className="p-3.5 font-mono font-bold text-white">
                      {bill.apt_code}
                    </td>
                    <td className="p-3.5 text-gray-200 font-medium">
                      {bill.owner_name}
                    </td>
                    <td className="p-3.5 text-gray-400 font-mono">
                      {bill.billing_month}
                    </td>
                    <td className={`p-3.5 text-right font-mono ${elecDetail?.ai_anomaly ? 'text-red-400 font-bold bg-red-950/40' : ''}`}>
                      {elecDetail?.total_line_amount.toLocaleString('vi-VN')} đ
                    </td>
                    <td className={`p-3.5 text-right font-mono ${waterDetail?.ai_anomaly ? 'text-red-400 font-bold bg-red-950/40' : ''}`}>
                      {waterDetail?.total_line_amount.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="p-3.5 text-right font-mono text-gray-300">
                      {mgmtDetail?.total_line_amount.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="p-3.5 text-right font-mono">
                      {serviceTotal > 0 ? (
                        <span className="text-purple-300 font-semibold" title="Phí dịch vụ phát sinh (Giặt ủi, Giúp việc, PT, Chăm sóc xe...)">
                          {serviceTotal.toLocaleString('vi-VN')} đ
                        </span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-[#C5A880] text-sm">
                      {bill.total_amount.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          isPaid
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500'
                            : 'bg-amber-950 text-amber-300 border border-amber-500'
                        }`}>
                          {isPaid ? 'Đã Thanh Toán ✓' : 'Chờ Thu'}
                        </span>
                        {isPaid && bill.payment_method && (
                          <div className="flex items-center gap-1 mt-0.5">
                            {bill.payment_method === 'VNPAY' && (
                              <span className="px-1.5 py-0.5 bg-blue-950 text-blue-300 border border-blue-500/60 rounded text-[9px] font-bold font-mono">
                                VNPAY
                              </span>
                            )}
                            {bill.payment_method === 'MOMO' && (
                              <span className="px-1.5 py-0.5 bg-[#4A002E] text-pink-300 border border-pink-500/60 rounded text-[9px] font-bold font-mono">
                                MoMo
                              </span>
                            )}
                            {bill.payment_method === 'BANK_TRANSFER' && (
                              <span className="px-1.5 py-0.5 bg-teal-950 text-teal-300 border border-teal-500/60 rounded text-[9px] font-bold font-mono">
                                Kế Toán Duyệt
                              </span>
                            )}
                            {bill.transaction_ref && (
                              <span className="text-[10px] text-gray-400 font-mono" title={bill.transaction_ref}>
                                #{bill.transaction_ref.slice(-6)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5 text-center">
                      {hasAnomaly ? (
                        <span className="px-2 py-0.5 bg-red-900/60 border border-red-500 text-red-300 font-semibold text-[10px] uppercase">
                          Tiêu Thụ Tăng Vọt
                        </span>
                      ) : (
                        <span className="text-[11px] text-gray-500">
                          Bình thường
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      <button 
                        onClick={() => setSelectedDetailBill(bill)}
                        className="px-2.5 py-1 bg-[#1C2533] border border-gray-600 text-[11px] text-gray-200 hover:border-[#C5A880] transition-colors"
                      >
                        Chi Tiết
                      </button>

                      {!isPaid ? (
                        <button 
                          onClick={() => handleConfirmPaid(bill.id, bill.apt_code)}
                          className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-bold transition-colors shadow"
                        >
                          Duyệt Gạch Nợ
                        </button>
                      ) : (
                        <span className="text-emerald-400 text-[11px] font-mono font-medium">
                          Đã Ghi Thu ✓
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ========================================================================= */}
      {/* MODAL XEM CHI TIẾT HÓA ĐƠN VÀ BIỂU PHÍ                                   */}
      {/* ========================================================================= */}
      {selectedDetailBill && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121820] border border-[#C5A880] max-w-lg w-full p-6 space-y-4 shadow-2xl animate-fadeIn text-white">
            <div className="flex items-center justify-between border-b border-[#222B35] pb-3">
              <div>
                <span className="text-[10px] text-[#C5A880] font-mono uppercase font-bold tracking-wider">BAN QUẢN LÝ SKYLINE SMART RESIDENCE</span>
                <h3 className="font-serif text-lg font-bold text-white">
                  Phiếu Thu Phí Dịch Vụ - Căn {selectedDetailBill.apt_code}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedDetailBill(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-[#161B22] border border-[#222B35] text-xs space-y-1">
              <div>Chủ hộ: <strong className="text-white">{selectedDetailBill.owner_name}</strong></div>
              <div>Kỳ thanh toán: <span className="font-mono text-white">{selectedDetailBill.billing_month}</span></div>
              <div>Hạn nộp: <span className="font-mono text-amber-400">{new Date(selectedDetailBill.due_date).toLocaleDateString('vi-VN')}</span></div>
              <div>Trạng thái: <strong className={selectedDetailBill.status === 'Paid' ? 'text-emerald-400' : 'text-amber-400'}>
                {selectedDetailBill.status === 'Paid' ? 'Đã Thanh Toán Hoàn Tất ✓' : 'Chưa Thu Tiền'}
              </strong></div>
              {selectedDetailBill.status === 'Paid' && (
                <div className="pt-2 mt-2 border-t border-[#222B35] space-y-1 bg-[#0D1117] p-2.5 rounded border border-[#2D3748]">
                  <div className="text-[10px] text-[#C5A880] uppercase tracking-wider font-bold">
                    Thông Tin Đối Soát Giao Dịch
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-gray-400">Cổng thanh toán:</span>
                    <span className="font-bold text-white">
                      {selectedDetailBill.payment_method === 'VNPAY' ? 'Cổng VNPAY (Thẻ ATM / QR)' :
                       selectedDetailBill.payment_method === 'MOMO' ? 'Ví Điện Tử MoMo (QR / Trừ ví)' :
                       selectedDetailBill.payment_method === 'BANK_TRANSFER' ? 'Kế toán duyệt / Chuyển khoản' : 'Tại quầy BQL'}
                    </span>
                  </div>
                  {selectedDetailBill.transaction_ref && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-400">Mã chuẩn chi / Giao dịch:</span>
                      <span className="font-mono font-bold text-emerald-400">{selectedDetailBill.transaction_ref}</span>
                    </div>
                  )}
                  {selectedDetailBill.paid_at && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-400">Thời gian ghi nhận:</span>
                      <span className="font-mono text-gray-300">{new Date(selectedDetailBill.paid_at).toLocaleString('vi-VN')}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2 text-xs">
              <div className="font-bold text-gray-300">Bảng Kê Chi Tiết:</div>
              <div className="divide-y divide-[#222B35] border border-[#222B35]">
                {selectedDetailBill.details.map((d) => {
                  const isService = !['Electricity', 'Water', 'Management_Fee', 'Parking', 'Internet'].includes(d.service_type);
                  const name = d.service_name || (
                    d.service_type === 'Electricity' ? 'Tiền Điện Sinh Hoạt' :
                    d.service_type === 'Water' ? 'Tiền Nước Sinh Hoạt' :
                    d.service_type === 'Management_Fee' ? 'Phí Quản Lý Vận Hành' :
                    d.service_type === 'Parking' ? 'Phí Gửi Xe Căn Hộ' :
                    d.service_type === 'Internet' ? 'Cáp Quang Internet Tốc Độ Cao' :
                    d.service_type === 'Facility' ? 'Phí Sử Dụng Tiện Ích Đặt Trước' :
                    d.service_type === 'Laundry' ? 'Giặt Ủi & Giặt Hấp Cao Cấp' :
                    d.service_type === 'Housekeeping' ? 'Giúp Việc & Dọn Dẹp Căn Hộ' :
                    d.service_type === 'Personal_Trainer' ? 'Thuê Huấn Luyện Viên PT Bơi/Gym' :
                    d.service_type === 'Car_Care' ? 'Chăm Sóc & Rửa Xe Hầm B2' : 'Phí Dịch Vụ'
                  );

                  return (
                    <div key={d.id} className="p-2.5 flex items-center justify-between">
                      <div>
                        <div className="text-white font-medium flex items-center gap-1.5">
                          <span>{name}</span>
                          {isService && (
                            <span className="px-1.5 py-0.5 bg-purple-950/80 border border-purple-500/60 text-purple-300 text-[9px] font-mono font-bold">
                              Dịch Vụ Cư Dân
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          {d.usage} {d.unit || (d.service_type === 'Electricity' ? 'kWh' : d.service_type === 'Water' ? 'm³' : d.service_type === 'Management_Fee' ? 'm²' : 'lần')} × {d.unit_price?.toLocaleString('vi-VN')} đ
                          {d.booking_ref && <span className="ml-1 text-[#C5A880] font-mono">• #{d.booking_ref}</span>}
                          {d.order_date && <span className="ml-1 text-gray-400 font-mono">• {d.order_date}</span>}
                        </div>
                      </div>
                      <div className={`font-mono font-bold ${isService ? 'text-[#C5A880]' : 'text-white'}`}>
                        {d.total_line_amount.toLocaleString('vi-VN')} đ
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#222B35] text-sm">
                <span className="font-bold text-white">TỔNG CỘNG:</span>
                <span className="font-bold font-mono text-base text-[#C5A880]">
                  {selectedDetailBill.total_amount.toLocaleString('vi-VN')} đ
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-[#222B35]">
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-[#161B22] border border-[#2D3748] text-gray-300 hover:text-white text-xs flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" /> In Hóa Đơn
              </button>

              <div className="flex items-center gap-2">
                {selectedDetailBill.status === 'Unpaid' && (
                  <button
                    onClick={() => {
                      handleConfirmPaid(selectedDetailBill.id, selectedDetailBill.apt_code);
                      setSelectedDetailBill(null);
                    }}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider transition-colors shadow"
                  >
                    Duyệt Gạch Nợ Ngay
                  </button>
                )}
                <button
                  onClick={() => setSelectedDetailBill(null)}
                  className="px-4 py-1.5 border border-gray-700 text-gray-300 text-xs"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
