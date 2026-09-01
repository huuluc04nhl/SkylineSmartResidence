'use client';

import React, { useState } from 'react';
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
  Smartphone
} from 'lucide-react';

interface VisitorQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  apartmentCode: string;
}

export default function VisitorQrModal({ isOpen, onClose, apartmentCode }: VisitorQrModalProps) {
  const [visitorName, setVisitorName] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [validHours, setValidHours] = useState('2');
  const [purpose, setPurpose] = useState<'VISITOR' | 'DELIVERY' | 'TECH'>('VISITOR');
  const [isGenerated, setIsGenerated] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerated(true);
  };

  const handleReset = () => {
    setIsGenerated(false);
    setVisitorName('');
    setVisitorPhone('');
  };

  const handleCopyLink = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=SKYLINE_VISITOR_${apartmentCode}_${Date.now()}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn select-none">
      <div className="bg-[#0D1117] border border-[#C5A880] max-w-md w-full p-6 text-white space-y-4 shadow-2xl relative">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="border-b border-[#222B35] pb-3 text-center space-y-1">
          <div className="text-[10px] uppercase tracking-[0.2em] text-[#C5A880] font-bold flex items-center justify-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5" /> Thẻ Khách Ra Vào Tạm Thời
          </div>
          <h3 className="font-serif text-lg font-bold text-white">
            Tạo Mã QR Đón Khách / Shipper
          </h3>
          <p className="text-xs text-gray-400">
            Cấp quyền mở cổng sảnh & thang máy tự động lên Căn {apartmentCode}
          </p>
        </div>

        {!isGenerated ? (
          <form onSubmit={handleGenerate} className="space-y-3 text-xs">
            <div>
              <label className="text-gray-300">Tên khách đến thăm / Đơn vị:</label>
              <input
                type="text"
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                placeholder="VD: Anh Nam, Shipper Shopee, Giao hàng..."
                className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white mt-1 focus:outline-none focus:border-[#C5A880]"
                required
              />
            </div>

            <div>
              <label className="text-gray-300">Số điện thoại khách (nhận mã SMS/Zalo):</label>
              <input
                type="tel"
                value={visitorPhone}
                onChange={(e) => setVisitorPhone(e.target.value)}
                placeholder="09xx xxx xxx"
                className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white mt-1 font-mono focus:outline-none focus:border-[#C5A880]"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-gray-300">Thời hạn có hiệu lực:</label>
                <select
                  value={validHours}
                  onChange={(e) => setValidHours(e.target.value)}
                  className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white mt-1 focus:outline-none focus:border-[#C5A880]"
                >
                  <option value="1">1 Giờ (Giao hàng nhanh)</option>
                  <option value="2">2 Giờ (Khách đến chơi)</option>
                  <option value="4">4 Giờ (Tiệc / Hội họp)</option>
                  <option value="24">24 Giờ (Người thân lưu trú 1 ngày)</option>
                </select>
              </div>

              <div>
                <label className="text-gray-300">Mục đích:</label>
                <select
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value as any)}
                  className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white mt-1 focus:outline-none focus:border-[#C5A880]"
                >
                  <option value="VISITOR">Khách Thăm Nhà</option>
                  <option value="DELIVERY">Giao Hàng Shipper</option>
                  <option value="TECH">Bảo Trì Riêng</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#C5A880] hover:bg-white text-[#0D1117] font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 mt-4 shadow-lg"
            >
              <QrCode className="w-4 h-4" /> Tạo Mã QR Đón Khách Ngay
            </button>
          </form>
        ) : (
          <div className="space-y-4 text-center animate-fadeIn">
            {/* QR Card */}
            <div className="p-4 bg-white inline-block border-2 border-[#C5A880] shadow-xl">
              <img
                src={qrDataUrl}
                alt="Visitor Pass QR"
                className="w-44 h-44 object-contain mx-auto"
              />
            </div>

            <div className="space-y-1 text-xs">
              <div className="font-bold text-white text-sm">{visitorName}</div>
              <div className="text-gray-400">
                SĐT: <span className="font-mono text-gray-200">{visitorPhone}</span> • Hiệu lực: <strong className="text-[#C5A880]">{validHours} giờ</strong>
              </div>
              <div className="text-[10px] text-emerald-400 font-mono flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Đã phân quyền thang máy lên thẳng Tầng 12 (Căn {apartmentCode})
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#222B35]">
              <button
                type="button"
                onClick={handleCopyLink}
                className="py-2.5 bg-[#161B22] hover:bg-[#1C2533] border border-gray-700 text-gray-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#C5A880]" />}
                {copied ? 'Đã Sao Chép' : 'Sao Chép Link QR'}
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="py-2.5 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" /> Tạo Mã Mới
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
