'use client';

import React, { useState } from 'react';
import { 
  X, 
  UserPlus, 
  Key, 
  AlertCircle, 
  Check, 
  Building, 
  Calendar, 
  Phone, 
  Mail, 
  CreditCard 
} from 'lucide-react';
import { 
  ApartmentUnit, 
  ApartmentResidentOwner, 
  assignApartmentResident 
} from '@/lib/apartmentStore';

interface AssignResidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  unit: ApartmentUnit | null;
  onSuccess: () => void;
}

export default function AssignResidentModal({
  isOpen,
  onClose,
  unit,
  onSuccess
}: AssignResidentModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [cccd, setCccd] = useState('');
  const [handoverDate, setHandoverDate] = useState(new Date().toLocaleDateString('vi-VN'));
  const [dob, setDob] = useState('15/06/1990');
  const [pob, setPob] = useState('TP. Hồ Chí Minh');
  const [avatar, setAvatar] = useState('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop&crop=face');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !unit) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Vui lòng nhập họ tên chủ sở hữu / cư dân.');
      return;
    }
    if (!phone.trim()) {
      setError('Vui lòng nhập số điện thoại liên lạc.');
      return;
    }
    if (!cccd.trim()) {
      setError('Vui lòng nhập số thẻ CCCD 12 số của chủ hộ.');
      return;
    }

    const newOwner: ApartmentResidentOwner = {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || `${phone.trim()}@skyline.residence.vn`,
      cccd: cccd.trim(),
      avatar,
      eKycApproved: true,
      handoverDate,
      dob,
      pob
    };

    const ok = assignApartmentResident(unit.code, newOwner);
    if (!ok) {
      setError('Không thể gán cư dân cho căn hộ này. Vui lòng thử lại.');
      return;
    }

    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-lg bg-[#0D1117] border border-[#C5A880]/80 shadow-2xl p-6 text-white rounded-none space-y-4 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#222B35] pb-3">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#C5A880] font-mono font-semibold flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5" /> Bàn Giao Căn Hộ & Cấp Quyền Cư Trú
            </div>
            <h3 className="font-serif text-xl font-bold text-white mt-0.5">
              Bàn Giao Chìa Khóa Căn Hộ {unit.code}
            </h3>
            <div className="text-xs text-gray-400 mt-0.5">
              {unit.towerName} • Tầng {unit.floor} • {unit.typeLabel} ({unit.area} m²)
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-950/80 border border-rose-600 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-gray-300 font-semibold mb-1">
              Họ Và Tên Chủ Hộ <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Nguyễn Văn An, Trần Thị Hạnh..."
              className="w-full bg-[#161B22] border border-[#2D3748] px-3 py-2 text-white font-medium rounded-none focus:outline-none focus:border-[#C5A880]"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-300 font-semibold mb-1">
                Số Điện Thoại <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0901234567"
                className="w-full bg-[#161B22] border border-[#2D3748] px-3 py-2 text-white font-mono rounded-none focus:outline-none focus:border-[#C5A880]"
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 font-semibold mb-1">
                Số Thẻ CCCD <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={cccd}
                onChange={(e) => setCccd(e.target.value)}
                placeholder="079201005566"
                className="w-full bg-[#161B22] border border-[#2D3748] px-3 py-2 text-white font-mono rounded-none focus:outline-none focus:border-[#C5A880]"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-300 font-semibold mb-1">Email Liên Hệ</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cudan@gmail.com"
                className="w-full bg-[#161B22] border border-[#2D3748] px-3 py-2 text-white rounded-none focus:outline-none focus:border-[#C5A880]"
              />
            </div>

            <div>
              <label className="block text-gray-300 font-semibold mb-1">Ngày Bàn Giao Nhà</label>
              <input
                type="text"
                value={handoverDate}
                onChange={(e) => setHandoverDate(e.target.value)}
                className="w-full bg-[#161B22] border border-[#2D3748] px-3 py-2 text-white font-mono rounded-none focus:outline-none focus:border-[#C5A880]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-300 font-semibold mb-1">Ngày Sinh Chủ Hộ</label>
              <input
                type="text"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full bg-[#161B22] border border-[#2D3748] px-3 py-2 text-white rounded-none focus:outline-none focus:border-[#C5A880]"
              />
            </div>

            <div>
              <label className="block text-gray-300 font-semibold mb-1">Quê Quán / Nơi Đăng Ký</label>
              <input
                type="text"
                value={pob}
                onChange={(e) => setPob(e.target.value)}
                className="w-full bg-[#161B22] border border-[#2D3748] px-3 py-2 text-white rounded-none focus:outline-none focus:border-[#C5A880]"
              />
            </div>
          </div>

          <div className="p-3 bg-[#121820] border border-[#222B35] text-[11px] text-gray-300 space-y-1">
            <div className="text-emerald-400 font-bold flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Tự động kích hoạt quyền Cư Dân
            </div>
            <div>
              Căn hộ sẽ chuyển sang trạng thái <strong>ĐANG SINH SỐNG</strong>, mở khóa quyền quản lý căn hộ, mở mã QR thang máy và tích hợp vào hệ thống kiểm soát ban quản lý.
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#222B35]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#161B22] hover:bg-[#202936] text-gray-300 hover:text-white border border-[#2D3748] font-semibold transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] font-bold uppercase tracking-wider transition-colors shadow flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" /> Bàn Giao & Lưu Hồ Sơ
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
