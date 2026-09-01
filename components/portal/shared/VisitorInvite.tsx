'use client';

import React, { useState } from 'react';
import { X, QrCode, Share2, Copy, Check, Clock, User } from 'lucide-react';

interface VisitorInviteProps {
  isOpen: boolean;
  onClose: () => void;
  aptCode?: string;
}

export default function VisitorInvite({ isOpen, onClose, aptCode = '12A05' }: VisitorInviteProps) {
  const [visitorName, setVisitorName] = useState('Nguyễn Văn An');
  const [purpose, setPurpose] = useState('Thăm bạn');
  const [validHours, setValidHours] = useState('2 giờ');
  const [generatedPass, setGeneratedPass] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    setGeneratedPass(true);
  };

  const handleCopyLink = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="bg-[#0D1117] border border-[#C5A880] max-w-md w-full p-6 text-white space-y-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#222B35] pb-3">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[#C5A880] font-semibold">
              Module 3.2.4 (SRS Visitor Pass)
            </div>
            <h3 className="font-serif text-lg font-bold">Tạo Mã QR Đón Khách / Shipper</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>

        {!generatedPass ? (
          <form onSubmit={handleGenerate} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="text-gray-300">Tên khách thăm / Shipper:</label>
              <input
                type="text"
                placeholder="VD: Anh Minh (Giao hàng Shopee)"
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white focus:outline-none focus:border-[#C5A880]"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-gray-300">Mục đích ra vào:</label>
              <input
                type="text"
                placeholder="VD: Thăm người thân / Giao đồ ăn"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white focus:outline-none focus:border-[#C5A880]"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-gray-300">Thời hạn hiệu lực của mã QR:</label>
              <select
                value={validHours}
                onChange={(e) => setValidHours(e.target.value)}
                className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white focus:outline-none focus:border-[#C5A880]"
              >
                <option>1 giờ (Giao hàng nhanh / Shipper)</option>
                <option>2 giờ (Khách thăm ngắn)</option>
                <option>4 giờ (Khách ăn tối)</option>
                <option>12 giờ (Khách ở lại qua ngày)</option>
              </select>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-transparent border border-gray-700 text-gray-300"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#C5A880] text-[#0D1117] font-bold uppercase tracking-wider"
              >
                Tạo Thiệp Mời QR
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 text-center">
            {/* Passcard display */}
            <div className="p-5 bg-[#161B22] border border-[#C5A880] space-y-3">
              <div className="text-[10px] uppercase tracking-widest text-[#C5A880] font-mono">
                SKYLINE GUEST ACCESS PASS
              </div>
              <div className="font-serif text-base font-bold text-white">
                Khách Thăm Căn Hộ {aptCode}
              </div>
              <div className="text-xs text-gray-300">Khách: <strong>{visitorName}</strong> ({purpose})</div>

              <div className="p-3 bg-white inline-block border border-gray-400">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=SKYLINE_VISITOR_${aptCode}_${Date.now()}`}
                  alt="Visitor Pass QR"
                  className="w-36 h-36 object-contain"
                />
              </div>

              <div className="text-[11px] text-gray-400 flex items-center justify-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#C5A880]" />
                Thời hạn: {validHours} (Tự hủy sau khi hết hạn)
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCopyLink}
                className="flex-1 py-2.5 bg-[#1C2533] border border-[#2D3748] hover:border-[#C5A880] text-xs font-semibold text-gray-200 flex items-center justify-center gap-1.5"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Đã Sao Chép Link' : 'Sao Chép Link Gửi Khách'}
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2.5 bg-[#C5A880] text-[#0D1117] text-xs font-bold uppercase tracking-wider"
              >
                Hoàn Tất
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
