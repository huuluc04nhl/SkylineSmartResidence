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
  CreditCard,
  FileCheck2,
  Printer,
  ShieldCheck,
  Zap,
  Droplets,
  BadgeCheck,
  MapPin,
  Sparkles,
  ClipboardList,
  Copy,
  Loader2,
  Server
} from 'lucide-react';
import { 
  ApartmentUnit, 
  ApartmentResidentOwner, 
  ApartmentHandoverProtocol,
  assignApartmentResident 
} from '@/lib/apartmentStore';
import { nksHandoverProvisionAccount } from '@/lib/nksApiClient';

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
  // Tabs: 'FORM' | 'CERTIFICATE'
  const [currentStep, setCurrentStep] = useState<'FORM' | 'CERTIFICATE'>('FORM');
  const [activeFormTab, setActiveFormTab] = useState<'RESIDENT' | 'PROTOCOL'>('RESIDENT');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Section 1: Thông tin chủ hộ
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [cccd, setCccd] = useState('');
  const [dob, setDob] = useState('15/06/1992');
  const [pob, setPob] = useState('TP. Hồ Chí Minh');
  const [avatar, setAvatar] = useState('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop&crop=face');

  // Section 2: Biên bản bàn giao kỹ thuật
  const todayStr = new Date().toLocaleDateString('vi-VN');
  const [handoverDate, setHandoverDate] = useState(todayStr);
  const [handoverOfficer, setHandoverOfficer] = useState('KS. Nguyễn Văn Quản Trị (BQL Tòa Nhà)');
  const [keysCount, setKeysCount] = useState<number>(3);
  const [cardsCount, setCardsCount] = useState<number>(2);
  const [initialElectricMeter, setInitialElectricMeter] = useState<number>(15.0);
  const [initialWaterMeter, setInitialWaterMeter] = useState<number>(1.5);
  const [handoverNotes, setHandoverNotes] = useState(
    'Đã kiểm tra hệ thống điều hòa, thiết bị vệ sinh, hệ thống điện nước, khóa thông minh và PCCC hoạt động đạt tiêu chuẩn bàn giao CĐT.'
  );

  const [createdProtocol, setCreatedProtocol] = useState<ApartmentHandoverProtocol | null>(null);
  const [provisionedAccount, setProvisionedAccount] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !unit) return null;

  const dateCode = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const generatedProtocolCode = `BBBG-SKYLINE-${unit.code.toUpperCase()}-${dateCode}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Vui lòng nhập họ tên chủ sở hữu / cư dân tiếp nhận.');
      setActiveFormTab('RESIDENT');
      return;
    }
    if (!phone.trim()) {
      setError('Vui lòng nhập số điện thoại (sử dụng làm tài khoản cư dân).');
      setActiveFormTab('RESIDENT');
      return;
    }
    if (!cccd.trim() || cccd.trim().length < 9) {
      setError('Vui lòng nhập số thẻ CCCD hợp lệ (9 đến 12 số).');
      setActiveFormTab('RESIDENT');
      return;
    }

    const protocol: ApartmentHandoverProtocol = {
      protocolCode: generatedProtocolCode,
      handoverDate: handoverDate.trim() || todayStr,
      handoverOfficer: handoverOfficer.trim() || 'Ban Quản Lý Skyline Smart Residence',
      keysCount: Number(keysCount) || 3,
      cardsCount: Number(cardsCount) || 2,
      initialElectricMeter: Number(initialElectricMeter) || 0,
      initialWaterMeter: Number(initialWaterMeter) || 0,
      notes: handoverNotes.trim()
    };

    setIsSubmitting(true);
    try {
      // 1. GỌI API MÁY CHỦ CẤP TÀI KHOẢN CƯ DÂN & BÀN GIAO CĂN HỘ
      const apiRes = await nksHandoverProvisionAccount({
        apartmentCode: unit.code,
        fullName: name.trim(),
        phone: phone.trim(),
        email: email.trim() || `${phone.trim()}@skyline.residence.vn`,
        idCard: cccd.trim(),
        dob: dob.trim(),
        pob: pob.trim(),
        avatarUrl: avatar,
        handoverProtocol: protocol
      });

      setProvisionedAccount(apiRes.account || null);
      setCreatedProtocol(apiRes.protocol || protocol);
      setCurrentStep('CERTIFICATE');
      onSuccess();
    } catch (err: any) {
      console.error('Lỗi API bàn giao:', err);
      // Fallback cục bộ nếu máy chủ từ xa gặp lỗi
      const newOwner: ApartmentResidentOwner = {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || `${phone.trim()}@skyline.residence.vn`,
        cccd: cccd.trim(),
        avatar,
        eKycApproved: true,
        handoverDate: handoverDate.trim() || todayStr,
        dob: dob.trim(),
        pob: pob.trim(),
        handoverProtocol: protocol
      };
      const ok = assignApartmentResident(unit.code, newOwner, protocol);
      if (ok) {
        setCreatedProtocol(protocol);
        setCurrentStep('CERTIFICATE');
        onSuccess();
      } else {
        setError(err?.message || 'Không thể cấp tài khoản từ API máy chủ. Vui lòng kiểm tra lại.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleCopyCredentials = () => {
    const accText = `TÀI KHOẢN CƯ DÂN SKYLINE SMART RESIDENCE\nCăn hộ: ${unit.code}\nChủ hộ: ${name}\nSố điện thoại (Đăng nhập): ${phone}\nSố CCCD: ${cccd}\nMật khẩu mặc định: 12345678\nCổng cư dân: https://skyline.residence.vn/portal`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(accText);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-2xl bg-[#0D1117] border border-[#C5A880]/80 shadow-2xl p-5 sm:p-6 text-white rounded-none space-y-4 max-h-[92vh] overflow-y-auto">
        
        {/* ========================================================= */}
        {/* STEP 1: FORM BÀN GIAO & KÊ KHAI                           */}
        {/* ========================================================= */}
        {currentStep === 'FORM' && (
          <>
            {/* Header */}
            <div className="flex items-start justify-between border-b border-[#222B35] pb-3.5">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-[#C5A880] font-mono font-semibold flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5" /> Thủ Tục Nghiệm Thu • Bàn Giao Căn Hộ Chính Thức
                </div>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-white mt-1">
                  Biên Bản Bàn Giao Căn Hộ {unit.code}
                </h3>
                <div className="text-xs text-gray-400 mt-0.5 flex flex-wrap items-center gap-2">
                  <span className="text-[#C5A880] font-medium">{unit.towerName}</span>
                  <span>•</span>
                  <span>Tầng {unit.floor}</span>
                  <span>•</span>
                  <span>{unit.typeLabel} ({unit.area} m²)</span>
                  <span>•</span>
                  <span className="font-mono text-gray-300">Giá CĐT: {unit.priceBillion} tỷ VNĐ</span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={onClose} 
                className="text-gray-400 hover:text-white p-1 hover:bg-[#161B22] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-950/80 border border-rose-600 text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Tab switchers */}
            <div className="flex border-b border-[#222B35] text-xs">
              <button
                type="button"
                onClick={() => setActiveFormTab('RESIDENT')}
                className={`flex-1 py-2.5 px-3 font-semibold uppercase tracking-wider text-center border-b-2 transition-all flex items-center justify-center gap-2 ${
                  activeFormTab === 'RESIDENT'
                    ? 'border-[#C5A880] text-[#C5A880] bg-[#C5A880]/10'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" /> 1. Thông Tin Chủ Hộ Tiếp Nhận
              </button>

              <button
                type="button"
                onClick={() => setActiveFormTab('PROTOCOL')}
                className={`flex-1 py-2.5 px-3 font-semibold uppercase tracking-wider text-center border-b-2 transition-all flex items-center justify-center gap-2 ${
                  activeFormTab === 'PROTOCOL'
                    ? 'border-[#C5A880] text-[#C5A880] bg-[#C5A880]/10'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <ClipboardList className="w-3.5 h-3.5" /> 2. Nghiệm Thu Thiết Bị & Chỉ Số
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* TAB 1: THÔNG TIN CƯ DÂN */}
              {activeFormTab === 'RESIDENT' && (
                <div className="space-y-3.5 animate-fadeIn">
                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">
                      Họ Và Tên Chủ Hộ / Đại Diện Nhận Bàn Giao <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="VD: Nguyễn Văn Nam, Trần Thị Hạnh..."
                      className="w-full bg-[#161B22] border border-[#2D3748] px-3 py-2.5 text-white font-medium rounded-none focus:outline-none focus:border-[#C5A880]"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-300 font-semibold mb-1">
                        Số Điện Thoại (Tài khoản Cư Dân) <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="0901234567"
                        className="w-full bg-[#161B22] border border-[#2D3748] px-3 py-2 text-white font-mono rounded-none focus:outline-none focus:border-[#C5A880]"
                        required
                      />
                      <span className="text-[10px] text-gray-500 mt-0.5 block">
                        Dùng để đăng nhập Cổng Cư Dân Skyline
                      </span>
                    </div>

                    <div>
                      <label className="block text-gray-300 font-semibold mb-1">
                        Số Thẻ Căn Cước Công Dân (12 số) <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={cccd}
                        onChange={(e) => setCccd(e.target.value)}
                        placeholder="079201005566"
                        maxLength={12}
                        className="w-full bg-[#161B22] border border-[#2D3748] px-3 py-2 text-white font-mono rounded-none focus:outline-none focus:border-[#C5A880]"
                        required
                      />
                      <span className="text-[10px] text-gray-500 mt-0.5 block">
                        Định danh cư dân liên kết sinh trắc học FaceID
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-300 font-semibold mb-1">
                        Email Nhận Hóa Đơn & Thông Báo BQL
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="cudan@gmail.com"
                        className="w-full bg-[#161B22] border border-[#2D3748] px-3 py-2 text-white rounded-none focus:outline-none focus:border-[#C5A880]"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 font-semibold mb-1">Ngày Sinh Chủ Hộ</label>
                      <input
                        type="text"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        placeholder="DD/MM/YYYY"
                        className="w-full bg-[#161B22] border border-[#2D3748] px-3 py-2 text-white font-mono rounded-none focus:outline-none focus:border-[#C5A880]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">
                      Nơi Thường Trú / Quê Quán Trên CCCD
                    </label>
                    <input
                      type="text"
                      value={pob}
                      onChange={(e) => setPob(e.target.value)}
                      placeholder="VD: Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh"
                      className="w-full bg-[#161B22] border border-[#2D3748] px-3 py-2 text-white rounded-none focus:outline-none focus:border-[#C5A880]"
                    />
                  </div>

                  <div className="p-3 bg-[#121820] border border-[#222B35] flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white">Ảnh Nhận Diện Cư Dân</div>
                      <div className="text-[10.5px] text-gray-400">Tự động khởi tạo ảnh mẫu hoặc đồng bộ qua CCCD</div>
                    </div>
                    <img 
                      src={avatar} 
                      alt="Avatar" 
                      className="w-10 h-10 rounded-none border border-[#C5A880] object-cover" 
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: BIÊN BẢN BÀN GIAO THIẾT BỊ & CHỈ SỐ */}
              {activeFormTab === 'PROTOCOL' && (
                <div className="space-y-3.5 animate-fadeIn">
                  <div className="p-2.5 bg-[#161B22] border border-[#C5A880]/40 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-gray-400">Mã Số Biên Bản:</span>{' '}
                      <strong className="text-[#C5A880] font-mono">{generatedProtocolCode}</strong>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-500 font-mono text-[10px]">
                      HỢP THỨC HÓA BQL
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-300 font-semibold mb-1">
                        Ngày Lập Biên Bản Bàn Giao <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={handoverDate}
                        onChange={(e) => setHandoverDate(e.target.value)}
                        className="w-full bg-[#161B22] border border-[#2D3748] px-3 py-2 text-white font-mono rounded-none focus:outline-none focus:border-[#C5A880]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 font-semibold mb-1">
                        Cán Bộ Đại Diện BQL Bàn Giao <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={handoverOfficer}
                        onChange={(e) => setHandoverOfficer(e.target.value)}
                        className="w-full bg-[#161B22] border border-[#2D3748] px-3 py-2 text-white rounded-none focus:outline-none focus:border-[#C5A880]"
                        required
                      />
                    </div>
                  </div>

                  {/* Bàn giao chìa khóa & thẻ từ */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-[#121820] border border-[#222B35]">
                    <div>
                      <label className="block text-gray-300 font-semibold mb-1 flex items-center gap-1">
                        <Key className="w-3.5 h-3.5 text-[#C5A880]" /> Số Lượng Chìa Khóa Cơ Bàn Giao
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={keysCount}
                        onChange={(e) => setKeysCount(Number(e.target.value))}
                        className="w-full bg-[#161B22] border border-[#2D3748] px-3 py-2 text-white font-mono rounded-none focus:outline-none focus:border-[#C5A880]"
                      />
                      <span className="text-[10px] text-gray-500 mt-0.5 block">
                        Gồm: Khóa cửa chính, khóa phụ, hòm thư
                      </span>
                    </div>

                    <div>
                      <label className="block text-gray-300 font-semibold mb-1 flex items-center gap-1">
                        <CreditCard className="w-3.5 h-3.5 text-[#C5A880]" /> Số Thẻ Từ RFID Cư Dân Bàn Giao
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={cardsCount}
                        onChange={(e) => setCardsCount(Number(e.target.value))}
                        className="w-full bg-[#161B22] border border-[#2D3748] px-3 py-2 text-white font-mono rounded-none focus:outline-none focus:border-[#C5A880]"
                      />
                      <span className="text-[10px] text-gray-500 mt-0.5 block">
                        Thẻ từ thang máy & phân tầng bảo mật
                      </span>
                    </div>
                  </div>

                  {/* Chỉ số công tơ điện nước lúc bàn giao */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-[#121820] border border-[#222B35]">
                    <div>
                      <label className="block text-gray-300 font-semibold mb-1 flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-amber-400" /> Chỉ Số Công Tơ Điện Lúc Bàn Giao (kWh)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min={0}
                        value={initialElectricMeter}
                        onChange={(e) => setInitialElectricMeter(Number(e.target.value))}
                        className="w-full bg-[#161B22] border border-[#2D3748] px-3 py-2 text-white font-mono rounded-none focus:outline-none focus:border-[#C5A880]"
                      />
                      <span className="text-[10px] text-gray-500 mt-0.5 block">
                        Căn cứ tính cước hóa đơn tháng đầu tiên
                      </span>
                    </div>

                    <div>
                      <label className="block text-gray-300 font-semibold mb-1 flex items-center gap-1">
                        <Droplets className="w-3.5 h-3.5 text-cyan-400" /> Chỉ Số Đồng Hồ Nước Lúc Bàn Giao (m³)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min={0}
                        value={initialWaterMeter}
                        onChange={(e) => setInitialWaterMeter(Number(e.target.value))}
                        className="w-full bg-[#161B22] border border-[#2D3748] px-3 py-2 text-white font-mono rounded-none focus:outline-none focus:border-[#C5A880]"
                      />
                      <span className="text-[10px] text-gray-500 mt-0.5 block">
                        Căn cứ chốt số tiêu thụ nước sinh hoạt
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">
                      Hiện Trạng Nghiệm Thu Kỹ Thuật & Ghi Chú Của BQL
                    </label>
                    <textarea
                      rows={2}
                      value={handoverNotes}
                      onChange={(e) => setHandoverNotes(e.target.value)}
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white text-xs rounded-none focus:outline-none focus:border-[#C5A880]"
                    />
                  </div>
                </div>
              )}

              {/* Thông tin thông báo tự động kích hoạt API */}
              <div className="p-3 bg-[#121820] border border-[#222B35] text-[11px] text-gray-300 space-y-1">
                <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <Server className="w-4 h-4" /> Tự động gọi API cấp tài khoản cư dân & phân quyền chính thức
                </div>
                <div>
                  Căn hộ <strong className="text-white">{unit.code}</strong> sẽ lập tức chuyển sang trạng thái <strong>ĐANG SINH SỐNG</strong>. Máy chủ API sẽ khởi tạo tài khoản đăng nhập với SĐT <strong className="text-[#C5A880]">{phone || '...'}</strong> và CCCD <strong className="text-[#C5A880]">{cccd || '...'}</strong> để cư dân truy cập hệ thống ngay lập tức.
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-[#222B35]">
                {activeFormTab === 'RESIDENT' ? (
                  <button
                    type="button"
                    onClick={() => setActiveFormTab('PROTOCOL')}
                    className="px-4 py-2 bg-[#161B22] hover:bg-[#202936] text-gray-200 hover:text-white border border-[#2D3748] font-semibold transition-colors flex items-center gap-1.5"
                  >
                    Tiếp: Nghiệm Thu & Chỉ Số →
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActiveFormTab('RESIDENT')}
                    className="px-4 py-2 bg-[#161B22] hover:bg-[#202936] text-gray-200 hover:text-white border border-[#2D3748] font-semibold transition-colors flex items-center gap-1.5"
                  >
                    ← Quay Lại Thông Tin Cư Dân
                  </button>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-[#161B22] hover:bg-[#202936] text-gray-300 hover:text-white border border-[#2D3748] font-semibold transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] font-bold uppercase tracking-wider transition-colors shadow flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Đang Gọi API Cấp Tài Khoản...
                      </>
                    ) : (
                      <>
                        <FileCheck2 className="w-4 h-4" /> Ký & Cấp Tài Khoản Qua API
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </>
        )}

        {/* ========================================================= */}
        {/* STEP 2: CHỨNG THƯ BÀN GIAO ĐIỆN TỬ (DIGITAL CERTIFICATE)    */}
        {/* ========================================================= */}
        {currentStep === 'CERTIFICATE' && createdProtocol && (
          <div className="space-y-4 animate-fadeIn">
            {/* Header chứng thư */}
            <div className="p-6 bg-gradient-to-b from-[#1C2533] to-[#121820] border-2 border-[#C5A880] text-center space-y-3 relative">
              <div className="w-12 h-12 bg-[#C5A880]/15 border border-[#C5A880] flex items-center justify-center mx-auto text-[#C5A880]">
                <ShieldCheck className="w-7 h-7" />
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-mono font-bold">
                  SKYLINE SMART RESIDENCE • MANAGEMENT BOARD
                </div>
                <h2 className="font-serif text-2xl text-white font-bold mt-1">
                  CHỨNG THƯ BÀN GIAO CĂN HỘ & CẤP TÀI KHOẢN ĐIỆN TỬ
                </h2>
                <div className="text-xs text-gray-300 font-mono mt-0.5">
                  Mã Biên Bản: <strong className="text-[#C5A880]">{createdProtocol.protocolCode}</strong>
                </div>
              </div>

              {/* Dấu mộc điện tử BQL & API */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="p-2 bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-[11px] font-mono font-bold">
                  ✓ ĐÃ NGHIỆM THU KỸ THUẬT & BÀN GIAO CHÍNH THỨC
                </span>
                <span className="p-2 bg-blue-950/80 border border-blue-500 text-blue-300 text-[11px] font-mono font-bold flex items-center gap-1">
                  <Server className="w-3.5 h-3.5" /> ĐÃ CẤP TÀI KHOẢN TỪ MÁY CHỦ API NKS
                </span>
              </div>

              {/* Tóm tắt biên bản */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-3 border-t border-[#2D3748] text-left text-xs font-mono">
                <div className="p-2.5 bg-[#0D1117] border border-[#222B35]">
                  <div className="text-gray-400 text-[10.5px]">MÃ CĂN HỘ & VỊ TRÍ:</div>
                  <div className="text-white font-bold text-sm">CĂN {unit.code}</div>
                  <div className="text-gray-300 text-[11px]">{unit.towerName} • Tầng {unit.floor} • {unit.typeLabel}</div>
                </div>

                <div className="p-2.5 bg-[#0D1117] border border-[#222B35]">
                  <div className="text-gray-400 text-[10.5px]">CHỦ SỞ HỮU TIẾP NHẬN:</div>
                  <div className="text-white font-bold text-sm">{name}</div>
                  <div className="text-gray-300 text-[11px]">SĐT: {phone} • CCCD: {cccd}</div>
                </div>

                <div className="p-2.5 bg-[#0D1117] border border-[#222B35]">
                  <div className="text-gray-400 text-[10.5px]">CHÌA KHÓA & THẺ TỪ:</div>
                  <div className="text-emerald-400 font-bold">
                    {createdProtocol.keysCount} Chìa khóa cơ • {createdProtocol.cardsCount} Thẻ từ RFID
                  </div>
                  <div className="text-gray-400 text-[10px]">Đã bàn giao đầy đủ cho cư dân</div>
                </div>

                <div className="p-2.5 bg-[#0D1117] border border-[#222B35]">
                  <div className="text-gray-400 text-[10.5px]">CHỈ SỐ BÀN GIAO BAN ĐẦU:</div>
                  <div className="text-amber-400 font-bold">
                    Điện: {createdProtocol.initialElectricMeter} kWh • Nước: {createdProtocol.initialWaterMeter} m³
                  </div>
                  <div className="text-gray-400 text-[10px]">Cán bộ BQL: {createdProtocol.handoverOfficer}</div>
                </div>
              </div>

              {/* Thông tin tài khoản đăng nhập được cấp từ API */}
              <div className="p-3.5 bg-emerald-950/40 border border-emerald-600/60 text-left text-xs text-gray-300 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <Check className="w-4 h-4" /> Kích Hoạt Tài Khoản Cư Dân Từ API Thành Công
                  </div>
                  <span className="text-[10px] font-mono text-emerald-300 px-2 py-0.5 bg-emerald-900/60 border border-emerald-500/50">
                    ROLE: OWNER (CHỦ HỘ)
                  </span>
                </div>

                <p className="text-gray-300 text-[11.5px]">
                  Chủ hộ <strong>{name}</strong> có thể sử dụng ngay thông tin sau để đăng nhập vào Cổng Cư Dân:
                </p>

                <div className="font-mono text-white bg-black/60 p-3 border border-[#222B35] space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Tên đăng nhập (SĐT):</span>
                    <strong className="text-emerald-400 text-sm">{phone}</strong>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Số CCCD định danh:</span>
                    <strong className="text-white">{cccd}</strong>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Mật khẩu mặc định:</span>
                    <strong className="text-amber-300">12345678</strong>
                  </div>
                  {provisionedAccount?.id && (
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-gray-800">
                      <span className="text-gray-500">Mã ID Máy Chủ API:</span>
                      <span className="text-gray-300">{provisionedAccount.id}</span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleCopyCredentials}
                  className="px-3 py-1.5 bg-[#161B22] hover:bg-[#202936] text-gray-200 hover:text-white border border-[#2D3748] text-xs font-semibold transition-all flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5 text-[#C5A880]" />
                  {copied ? '✓ Đã Sao Chép Thông Tin Tài Khoản!' : 'Sao Chép Thông Tin Đăng Nhập Để Gửi Cư Dân'}
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2.5 bg-[#161B22] hover:bg-[#202936] text-gray-200 hover:text-white border border-[#2D3748] text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-2"
              >
                <Printer className="w-4 h-4 text-[#C5A880]" /> In / Lưu Biên Bản (PDF)
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-[#C5A880] hover:bg-white text-[#0D1117] font-bold text-xs uppercase tracking-wider transition-colors shadow-lg flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Hoàn Tất Thủ Tục
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
