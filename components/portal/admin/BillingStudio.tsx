'use client';

import React, { useState } from 'react';
import { DEMO_BILLS, Bill } from '@/lib/dataStore';
import { Receipt, AlertTriangle, CheckCircle2, Send, Download, Sparkles, Filter, Check } from 'lucide-react';

export default function BillingStudio() {
  const [bills, setBills] = useState<Bill[]>(DEMO_BILLS);
  const [filterAnomalyOnly, setFilterAnomalyOnly] = useState(false);
  const [isPublishedAll, setIsPublishedAll] = useState(false);
  const [reminderSent, setReminderSent] = useState(false);

  const displayedBills = filterAnomalyOnly
    ? bills.filter(b => b.has_ai_anomaly)
    : bills;

  const handlePublishAll = () => {
    setIsPublishedAll(true);
    setTimeout(() => setIsPublishedAll(false), 3000);
  };

  const handleSendReminders = () => {
    setReminderSent(true);
    setTimeout(() => setReminderSent(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222B35] pb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-semibold">
            Module 3.2.11 (SRS Specification)
          </div>
          <h2 className="font-serif text-2xl text-white font-bold mt-1">
            Studio Rà Soát Hóa Đơn & AI Phát Hiện Bất Thường (Smart Billing Studio)
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePublishAll}
            className="px-4 py-2 bg-[#C5A880] text-[#0D1117] text-xs font-bold uppercase tracking-wider hover:bg-white transition-colors"
          >
            {isPublishedAll ? 'Đã Phát Hành Hàng Loạt ✓' : 'Phát Hành Toàn Bộ Hóa Đơn'}
          </button>
          <button
            onClick={handleSendReminders}
            className="px-4 py-2 bg-[#1C2533] border border-[#2D3748] hover:border-[#C5A880] text-gray-200 text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5 text-[#C5A880]" />
            {reminderSent ? 'Đã Gửi Nhắc Nợ AI ✓' : 'Gửi Nhắc Nợ Tự Động'}
          </button>
        </div>
      </div>

      {/* AI Anomaly Alert Banner */}
      <div className="p-4 bg-red-950/40 border border-red-500/60 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <div className="text-red-300 font-bold uppercase tracking-wider">
            AI Billing Assistant: Phát hiện 02 căn hộ có biến động tiêu thụ điện/nước bất thường (&gt; 50%)
          </div>
          <p className="text-gray-300">
            Hệ thống đã tự động bôi đỏ cảnh báo các dòng nghi ngờ rò rỉ đường ống hoặc câu trộm điện để Kế toán đối soát với số đo công tơ thực tế trước khi phát hành hóa đơn.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterAnomalyOnly(!filterAnomalyOnly)}
            className={`px-3 py-1.5 text-xs font-semibold border transition-all ${
              filterAnomalyOnly
                ? 'bg-red-900/60 border-red-500 text-red-200'
                : 'bg-[#161B22] border-[#2D3748] text-gray-300 hover:border-gray-500'
            }`}
          >
            {filterAnomalyOnly ? '✓ Đang lọc: Chỉ xem căn có cảnh báo AI' : 'Xem toàn bộ căn hộ'}
          </button>
        </div>
        <div className="text-xs text-gray-400">
          Hiển thị: <strong>{displayedBills.length}</strong> hóa đơn
        </div>
      </div>

      {/* Data Table with Red Highlighting */}
      <div className="bg-[#121820] border border-[#222B35] overflow-x-auto">
        <table className="w-full text-left text-xs text-gray-300">
          <thead className="bg-[#161B22] text-[#C5A880] uppercase tracking-wider font-semibold border-b border-[#222B35] text-[11px]">
            <tr>
              <th className="p-3.5">Mã Căn</th>
              <th className="p-3.5">Chủ Hộ</th>
              <th className="p-3.5">Kỳ Thu</th>
              <th className="p-3.5">Tiền Điện</th>
              <th className="p-3.5">Tiền Nước</th>
              <th className="p-3.5">Phí Quản Lý</th>
              <th className="p-3.5">Tổng Tiền (VNĐ)</th>
              <th className="p-3.5">Đánh Giá AI Anomaly</th>
              <th className="p-3.5 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#222B35]">
            {displayedBills.map((bill) => {
              const elecDetail = bill.details.find(d => d.service_type === 'Electricity');
              const waterDetail = bill.details.find(d => d.service_type === 'Water');
              const mgmtDetail = bill.details.find(d => d.service_type === 'Management_Fee');
              const hasAnomaly = bill.has_ai_anomaly;

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
                  <td className={`p-3.5 font-mono ${elecDetail?.ai_anomaly ? 'text-red-400 font-bold bg-red-950/40' : ''}`}>
                    {elecDetail?.total_line_amount.toLocaleString('vi-VN')} đ
                  </td>
                  <td className={`p-3.5 font-mono ${waterDetail?.ai_anomaly ? 'text-red-400 font-bold bg-red-950/40' : ''}`}>
                    {waterDetail?.total_line_amount.toLocaleString('vi-VN')} đ
                  </td>
                  <td className="p-3.5 font-mono text-gray-300">
                    {mgmtDetail?.total_line_amount.toLocaleString('vi-VN')} đ
                  </td>
                  <td className="p-3.5 font-mono font-bold text-[#C5A880] text-sm">
                    {bill.total_amount.toLocaleString('vi-VN')} đ
                  </td>
                  <td className="p-3.5">
                    {hasAnomaly ? (
                      <span className="px-2 py-0.5 bg-red-900/60 border border-red-500 text-red-300 font-semibold text-[10px] uppercase">
                        Bôi Đỏ Bất Thường
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-600 text-emerald-400 font-semibold text-[10px]">
                        Hợp Lệ ✓
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 text-right space-x-2">
                    <button className="px-2.5 py-1 bg-[#1C2533] border border-gray-600 text-[11px] text-gray-200 hover:border-[#C5A880]">
                      Chi Tiết
                    </button>
                    <button className="px-2.5 py-1 bg-emerald-800 hover:bg-emerald-700 text-white text-[11px] font-semibold">
                      Duyệt
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
