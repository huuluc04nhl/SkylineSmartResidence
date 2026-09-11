'use client';

import React, { useState } from 'react';
import { 
  X, 
  Building, 
  Layers, 
  Home, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Phone, 
  Mail, 
  CreditCard, 
  Car, 
  Users, 
  Wrench, 
  ShieldCheck, 
  Sparkles, 
  Key, 
  Compass, 
  Maximize2, 
  Calendar, 
  FileText, 
  Edit, 
  UserPlus, 
  Check, 
  RefreshCw,
  Eye,
  AlertTriangle,
  FileCheck2,
  Zap,
  Droplets
} from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { 
  ApartmentUnit, 
  updateApartmentBillingStatus, 
  evictApartmentResident 
} from '@/lib/apartmentStore';
import ApartmentModel3DViewer from '@/components/portal/shared/ApartmentModel3DViewer';

interface ApartmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  unit: ApartmentUnit | null;
  onEditUnit: (unit: ApartmentUnit) => void;
  onAssignResident: (unit: ApartmentUnit) => void;
  onRefresh: () => void;
}

type DetailTab = 'OVERVIEW_3D' | 'RESIDENT_MEMBERS' | 'VEHICLES' | 'BILLING' | 'MAINTENANCE';

export default function ApartmentDetailModal({
  isOpen,
  onClose,
  unit,
  onEditUnit,
  onAssignResident,
  onRefresh
}: ApartmentDetailModalProps) {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'ADMIN';

  const [activeTab, setActiveTab] = useState<DetailTab>('OVERVIEW_3D');
  const [isUpdatingBill, setIsUpdatingBill] = useState(false);
  const [isConfirmingEvict, setIsConfirmingEvict] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  if (!isOpen || !unit) return null;

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleToggleBilling = () => {
    if (!unit.billing) return;
    setIsUpdatingBill(true);
    const newStatus = unit.billing.status === 'PAID' ? 'UNPAID' : 'PAID';
    updateApartmentBillingStatus(unit.code, newStatus);
    setIsUpdatingBill(false);
    showToast(newStatus === 'PAID' ? '✓ Đã xác nhận thanh toán phí quản lý thành công!' : '✓ Đã chuyển trạng thái hóa đơn về Chưa Thanh Toán.');
    onRefresh();
  };

  const handleEvict = () => {
    evictApartmentResident(unit.code);
    setIsConfirmingEvict(false);
    showToast(`✓ Đã thu hồi căn hộ ${unit.code} về trạng thái Căn Trống.`);
    onRefresh();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl bg-[#0D1117] border border-[#C5A880]/80 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-white rounded-none">
        
        {/* ============================================================= */}
        {/* 1. MODAL HEADER                                               */}
        {/* ============================================================= */}
        <div className="p-4 sm:p-5 bg-[#121820] border-b border-[#222B35] flex items-start justify-between gap-4 select-none">
          <div>
            <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-widest text-[#C5A880] font-mono font-semibold">
              <Building className="w-3.5 h-3.5" />
              <span>Hồ Sơ Căn Hộ • Chung Cư Skyline</span>
              <span>•</span>
              <span>Tầng {unit.floor}</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 mt-1">
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-wide">
                Căn Hộ {unit.code}
              </h2>
              
              {/* Badges */}
              <span className={`px-2.5 py-0.5 text-[11px] font-bold uppercase rounded-none border shadow-sm flex items-center gap-1 font-mono ${
                unit.status === 'OCCUPIED'
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                  : unit.status === 'MAINTENANCE'
                  ? 'bg-purple-950 text-purple-300 border-purple-500'
                  : 'bg-amber-950 text-amber-300 border-amber-500'
              }`}>
                {unit.status === 'OCCUPIED' ? <CheckCircle2 className="w-3 h-3" /> : <Key className="w-3 h-3" />}
                {unit.statusLabel}
              </span>

              <span className="px-2 py-0.5 text-xs bg-[#161B22] border border-[#2D3748] text-[#C5A880] font-semibold">
                {unit.typeLabel}
              </span>

              <span className="text-xs text-gray-400">
                Diện tích: <strong className="text-white font-mono">{unit.area} m²</strong> (Thông thủy)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                type="button"
                onClick={() => onEditUnit(unit)}
                className="px-3 py-1.5 bg-[#161B22] hover:bg-[#202936] text-gray-200 hover:text-white border border-[#2D3748] text-xs font-semibold rounded-none transition-all flex items-center gap-1.5"
              >
                <Edit className="w-3.5 h-3.5 text-[#C5A880]" />
                <span className="hidden sm:inline">Chỉnh Sửa</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-[#161B22] transition-colors rounded-none"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ============================================================= */}
        {/* 2. TAB SELECTOR BAR                                           */}
        {/* ============================================================= */}
        <div className="flex items-center gap-1 px-4 sm:px-5 bg-[#0F141C] border-b border-[#222B35] overflow-x-auto text-xs font-mono select-none">
          {[
            { id: 'OVERVIEW_3D', label: '1. Phối Cảnh & Thông Số', icon: Maximize2 },
            { id: 'RESIDENT_MEMBERS', label: `2. Cư Dân & Nhân Khẩu (${unit.membersCount})`, icon: Users },
            { id: 'VEHICLES', label: `3. Xe Cộ & Thẻ Hầm (${unit.vehicles?.length || 0})`, icon: Car },
            { id: 'BILLING', label: '4. Phí Quản Lý & Hóa Đơn', icon: CreditCard },
            { id: 'MAINTENANCE', label: `5. Lịch Sử Kỹ Thuật (${unit.maintenanceHistory?.length || 0})`, icon: Wrench }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2.5 px-3 whitespace-nowrap font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'border-[#C5A880] text-[#C5A880] bg-[#161D26]'
                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-[#121820]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Success Toast */}
        {successToast && (
          <div className="bg-emerald-950/90 border-b border-emerald-500/80 px-4 py-2 text-xs text-emerald-200 font-medium flex items-center justify-between animate-fadeIn">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              {successToast}
            </span>
            <button type="button" onClick={() => setSuccessToast(null)} className="text-emerald-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ============================================================= */}
        {/* 3. TAB CONTENTS BODY                                          */}
        {/* ============================================================= */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">

          {/* ----------------------------------------------------------- */}
          {/* TAB 1: SƠ ĐỒ 3D MẶT BẰNG & THÔNG SỐ KỸ THUẬT               */}
          {/* ----------------------------------------------------------- */}
          {activeTab === 'OVERVIEW_3D' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Khối nhúng trực quan 3D Floor Plan Viewer */}
              <div className="border border-[#222B35] bg-[#05070A] overflow-hidden">
                <div className="p-3 bg-[#121820] border-b border-[#222B35] flex items-center justify-between">
                  <span className="text-xs font-mono text-[#C5A880] font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Phối Cảnh Không Gian Nội Thất Căn Hộ {unit.code}
                  </span>
                  <span className="text-[11px] text-gray-400">
                    Phối cảnh phòng khách, phòng ngủ Master, bếp, ban công
                  </span>
                </div>
                <div className="h-[360px] sm:h-[420px] w-full relative">
                  <ApartmentModel3DViewer
                    apartmentCode={unit.code}
                    apartmentType={unit.typeLabel}
                    clearArea={unit.area}
                    interactive={true}
                  />
                </div>
              </div>

              {/* Bảng thông số chi tiết & tiêu chuẩn kỹ thuật */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3.5 bg-[#121820] border border-[#222B35]">
                  <div className="text-[10px] text-gray-400 uppercase font-mono">Diện Tích Thông Thủy</div>
                  <div className="text-xl font-bold font-mono text-white mt-0.5">{unit.area} m²</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">Tim tường: {unit.wallArea} m²</div>
                </div>

                <div className="p-3.5 bg-[#121820] border border-[#222B35]">
                  <div className="text-[10px] text-gray-400 uppercase font-mono">Cấu Trúc Phòng</div>
                  <div className="text-xl font-bold font-mono text-white mt-0.5">{unit.bedrooms} PN • {unit.bathrooms} WC</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">Bếp mở + Ban công riêng</div>
                </div>

                <div className="p-3.5 bg-[#121820] border border-[#222B35]">
                  <div className="text-[10px] text-gray-400 uppercase font-mono">Hướng Ban Công / Cửa</div>
                  <div className="text-xl font-bold font-mono text-[#C5A880] mt-0.5">{unit.direction}</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">Cửa chính: {unit.mainDoorDirection || 'Tây Bắc'}</div>
                </div>

                <div className="p-3.5 bg-[#121820] border border-[#222B35]">
                  <div className="text-[10px] text-gray-400 uppercase font-mono">Định Giá Bất Động Sản</div>
                  <div className="text-xl font-bold font-mono text-[#C5A880] mt-0.5">{unit.priceBillion} Tỷ VNĐ</div>
                  <div className="text-[11px] text-emerald-400 mt-0.5">Pháp lý: Sổ hồng lâu dài</div>
                </div>
              </div>

              {/* Mô tả căn hộ & ghi chú kỹ thuật */}
              <div className="p-4 bg-[#121820] border border-[#222B35] space-y-2">
                <div className="text-xs uppercase tracking-wider text-gray-300 font-bold font-mono">
                  Mô Tả Không Gian & Tiện Ích Bàn Giao
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  {unit.description || 'Căn hộ tiêu chuẩn 5 sao tại Skyline Smart Residence. Được trang bị thiết bị điều khiển thông minh Smart Home Hub, khóa cửa điện tử nhận diện khuôn mặt FaceID, chuông hình cảm ứng và kính cách âm 3 lớp.'}
                </p>
              </div>

            </div>
          )}

          {/* ----------------------------------------------------------- */}
          {/* TAB 2: CƯ DÂN & NHÂN KHẨU                                   */}
          {/* ----------------------------------------------------------- */}
          {activeTab === 'RESIDENT_MEMBERS' && (
            <div className="space-y-5 animate-fadeIn">
              
              {unit.status === 'OCCUPIED' && unit.owner ? (
                <>
                  {/* Thẻ thông tin chủ hộ chính thức */}
                  <div className="p-4 sm:p-5 bg-gradient-to-r from-[#161D26] to-[#121820] border border-emerald-500/50 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        Chủ Sở Hữu / Chủ Hộ Đang Sinh Sống
                      </span>
                      
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase bg-emerald-950 text-emerald-300 border border-emerald-500">
                          e-KYC Đã Xác Thực ✓
                        </span>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => setIsConfirmingEvict(true)}
                            className="px-2.5 py-1 text-[11px] font-semibold bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-600 transition-colors"
                          >
                            Thu Hồi / Cư Dân Chuyển Đi
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <img
                        src={unit.owner.avatar.replace('data.nks.vn//', 'data.nks.vn/')}
                        alt={unit.owner.name}
                        className="w-16 h-16 object-cover border-2 border-emerald-500/80 shadow-md"
                      />
                      <div className="space-y-1 min-w-0 flex-1">
                        <h4 className="font-serif text-xl font-bold text-white">
                          {unit.owner.name}
                        </h4>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-300">
                          <span className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-[#C5A880]" /> {unit.owner.phone}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-[#C5A880]" /> {unit.owner.email}
                          </span>
                          <span className="flex items-center gap-1.5 font-mono">
                            <CreditCard className="w-3.5 h-3.5 text-[#C5A880]" /> CCCD: {unit.owner.cccd}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#222B35] text-xs">
                      <div>
                        <span className="text-gray-400">Ngày Bàn Giao:</span>{' '}
                        <strong className="text-white font-mono">{unit.owner.handoverDate || 'Chưa cập nhật'}</strong>
                      </div>
                      <div>
                        <span className="text-gray-400">Ngày Sinh:</span>{' '}
                        <strong className="text-white">{unit.owner.dob || 'Chưa cập nhật'}</strong>
                      </div>
                      <div className="truncate">
                        <span className="text-gray-400">Nơi Cấp:</span>{' '}
                        <strong className="text-white">{unit.owner.pob || 'Chưa cập nhật'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Biên Bản Bàn Giao Kỹ Thuật (Smart Handover Protocol) */}
                  {(unit.handoverProtocol || unit.owner?.handoverProtocol) && (
                    <div className="p-4 bg-[#161B22] border border-[#C5A880]/60 space-y-2.5">
                      <div className="font-mono text-xs text-[#C5A880] uppercase tracking-wider flex items-center justify-between font-bold">
                        <span className="flex items-center gap-1.5">
                          <FileCheck2 className="w-4 h-4 text-[#C5A880]" /> Hồ Sơ Biên Bản Bàn Giao Căn Hộ
                        </span>
                        <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-500 text-[10px] font-mono">
                          ✓ ĐÃ NGHIỆM THU
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                        <div className="p-2 bg-[#0D1117] border border-[#222B35]">
                          <span className="text-gray-400 block text-[10px]">Mã Biên Bản BQL:</span>
                          <strong className="text-[#C5A880]">
                            {unit.handoverProtocol?.protocolCode || unit.owner?.handoverProtocol?.protocolCode}
                          </strong>
                        </div>
                        <div className="p-2 bg-[#0D1117] border border-[#222B35]">
                          <span className="text-gray-400 block text-[10px]">Cán Bộ Bàn Giao:</span>
                          <strong className="text-white">
                            {unit.handoverProtocol?.handoverOfficer || unit.owner?.handoverProtocol?.handoverOfficer || 'BQL Tòa Nhà'}
                          </strong>
                        </div>
                        <div className="p-2 bg-[#0D1117] border border-[#222B35]">
                          <span className="text-gray-400 block text-[10px]">Chìa Khóa Cơ & Thẻ Từ:</span>
                          <strong className="text-emerald-400">
                            {unit.handoverProtocol?.keysCount ?? 3} Chìa cơ • {unit.handoverProtocol?.cardsCount ?? 2} Thẻ từ RFID
                          </strong>
                        </div>
                        <div className="p-2 bg-[#0D1117] border border-[#222B35]">
                          <span className="text-gray-400 block text-[10px]">Chỉ Số Bàn Giao Ban Đầu:</span>
                          <strong className="text-amber-400">
                            ⚡ {unit.handoverProtocol?.initialElectricMeter ?? 0} kWh • 💧 {unit.handoverProtocol?.initialWaterMeter ?? 0} m³
                          </strong>
                        </div>
                      </div>

                      {(unit.handoverProtocol?.notes || unit.owner?.handoverProtocol?.notes) && (
                        <div className="text-[11px] text-gray-300 p-2 bg-[#0D1117] border border-[#222B35] leading-relaxed">
                          <span className="text-gray-400">Ghi chú hiện trạng nghiệm thu:</span>{' '}
                          {unit.handoverProtocol?.notes || unit.owner?.handoverProtocol?.notes}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Hộp xác nhận thu hồi căn hộ */}
                  {isConfirmingEvict && (
                    <div className="p-4 bg-rose-950/90 border border-rose-500 text-rose-200 text-xs space-y-3 animate-fadeIn">
                      <div className="flex items-center gap-2 font-bold text-sm text-white">
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                        Xác Nhận Thu Hồi Căn Hộ {unit.code} & Chuyển Về Căn Trống?
                      </div>
                      <p className="leading-relaxed">
                        Thao tác này sẽ giải phóng trạng thái cư trú của căn hộ, gỡ bỏ thông tin cư dân hiện tại và chuyển mã căn sang trạng thái <strong>CĂN HỘ TRỐNG</strong> sẵn sàng bàn giao cho chủ mới.
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleEvict}
                          className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold uppercase text-[11px] transition-colors"
                        >
                          Xác Nhận Thu Hồi Căn Hộ
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsConfirmingEvict(false)}
                          className="px-3 py-1.5 bg-black/50 hover:bg-black text-gray-300 hover:text-white border border-gray-600 text-[11px] transition-colors"
                        >
                          Hủy Bỏ
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Danh sách thành viên gia đình (nhân khẩu) */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-cyan-400" />
                        Danh Sách Nhân Khẩu Cùng Cư Trú ({unit.members?.length || 0} người thân)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {unit.members && unit.members.length > 0 ? (
                        unit.members.map(member => (
                          <div key={member.id} className="p-3 bg-[#121820] border border-[#222B35] flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={member.avatarUrl?.replace('data.nks.vn//', 'data.nks.vn/') || 'https://data.nks.vn/storage/users/default.png'}
                                alt={member.fullName}
                                className="w-10 h-10 object-cover border border-[#2D3748] flex-shrink-0"
                              />
                              <div className="min-w-0 space-y-0.5">
                                <div className="font-bold text-white text-xs truncate">
                                  {member.fullName}
                                </div>
                                <div className="text-[11px] text-gray-400">
                                  {member.relationship}
                                </div>
                                <div className="text-[10px] text-gray-500 font-mono">
                                  SĐT: {member.phone} • CCCD: {member.idCard}
                                </div>
                              </div>
                            </div>

                            <span className={`text-[9.5px] px-2 py-0.5 font-bold uppercase whitespace-nowrap border ${
                              member.faceStatus.includes('Đã')
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                                : 'bg-amber-950 text-amber-300 border-amber-600'
                            }`}>
                              {member.faceStatus}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-2 p-4 text-center text-gray-500 text-xs bg-[#121820] border border-[#222B35]">
                          Chưa đăng ký thêm thành viên gia đình.
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                /* TRƯỜNG HỢP CĂN TRỐNG */
                <div className="p-6 bg-[#161B22] border border-amber-500/40 text-center space-y-4">
                  <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                    <Key className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">Căn Hộ Hiện Đang Trống</h4>
                    <p className="text-xs text-gray-400 max-w-md mx-auto mt-1">
                      Căn hộ chưa có cư dân nhận bàn giao hoặc đăng ký sinh sống. Bạn có thể tiến hành bàn giao và gán chủ sở hữu mới ngay bây giờ.
                    </p>
                  </div>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => onAssignResident(unit)}
                      className="px-5 py-2.5 bg-[#C5A880] hover:bg-white text-[#0D1117] font-bold text-xs uppercase tracking-wider transition-colors inline-flex items-center gap-2 shadow-lg"
                    >
                      <UserPlus className="w-4 h-4" /> Bàn Giao Chìa Khóa Cho Chủ Hộ Mới
                    </button>
                  )}
                </div>
              )}

            </div>
          )}

          {/* ----------------------------------------------------------- */}
          {/* TAB 3: PHƯƠNG TIỆN & THẺ HẦM                                */}
          {/* ----------------------------------------------------------- */}
          {activeTab === 'VEHICLES' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                  <Car className="w-4 h-4 text-[#C5A880]" />
                  Danh Sách Phương Tiện Đăng Ký Đậu Tầng Hầm (B1/B2)
                </span>
              </div>

              {unit.vehicles && unit.vehicles.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {unit.vehicles.map(v => (
                    <div key={v.id} className="p-4 bg-[#121820] border border-[#222B35] flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#161B22] border border-[#2D3748] flex items-center justify-center text-[#C5A880]">
                          <Car className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-mono text-base font-bold text-white">
                            {v.plate}
                          </div>
                          <div className="text-xs text-gray-400">
                            {v.brand || (v.type === 'CAR' ? 'Xe Ô tô' : 'Xe Máy')} • Vị trí: <strong className="text-[#C5A880]">{v.slot || 'Tự do'}</strong>
                          </div>
                        </div>
                      </div>

                      <div className="text-right text-[11px] font-mono text-gray-400">
                        <div className="text-emerald-400 font-bold">Đang Hoạt Động</div>
                        <div className="text-[10px] text-gray-500">{v.cardNo}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-400 text-xs bg-[#121820] border border-[#222B35] space-y-2">
                  <Car className="w-8 h-8 text-gray-600 mx-auto" />
                  <div>Căn hộ chưa đăng ký phương tiện đậu tại tầng hầm.</div>
                </div>
              )}
            </div>
          )}

          {/* ----------------------------------------------------------- */}
          {/* TAB 4: PHÍ QUẢN LÝ & HÓA ĐƠN                                */}
          {/* ----------------------------------------------------------- */}
          {activeTab === 'BILLING' && (
            <div className="space-y-4 animate-fadeIn">
              {unit.billing ? (
                <div className="p-5 bg-[#121820] border border-[#222B35] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-gray-400 font-mono">Kỳ Phí Quản Lý & Dịch Vụ</span>
                      <h4 className="text-lg font-bold font-serif text-white">{unit.billing.period}</h4>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 text-xs font-bold uppercase rounded-none border ${
                        unit.billing.status === 'PAID'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                          : 'bg-amber-950 text-amber-300 border-amber-500'
                      }`}>
                        {unit.billing.status === 'PAID' ? '✓ Đã Thanh Toán' : 'Chưa Thanh Toán'}
                      </span>

                      {isAdmin && (
                        <button
                          type="button"
                          onClick={handleToggleBilling}
                          disabled={isUpdatingBill}
                          className={`px-3 py-1 text-xs font-bold uppercase transition-all flex items-center gap-1.5 ${
                            unit.billing.status === 'PAID'
                              ? 'bg-[#161B22] hover:bg-[#202936] text-amber-400 border border-amber-500/50'
                              : 'bg-[#C5A880] hover:bg-white text-[#0D1117]'
                          }`}
                        >
                          {isUpdatingBill ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          {unit.billing.status === 'PAID' ? 'Đổi Thành Chưa Nộp' : 'Xác Nhận Đã Thu Tiền'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Bảng chi tiết từng khoản thu */}
                  <div className="border border-[#222B35] divide-y divide-[#222B35] text-xs">
                    <div className="p-3 flex items-center justify-between bg-[#161B22]/50">
                      <span className="text-gray-300">Phí quản lý vận hành tòa nhà ({unit.area} m² x 18.500đ)</span>
                      <span className="font-mono font-bold text-white">{unit.billing.monthlyFee.toLocaleString('vi-VN')} đ</span>
                    </div>
                    <div className="p-3 flex items-center justify-between bg-[#161B22]/50">
                      <span className="text-gray-300">Phí trông giữ phương tiện tầng hầm</span>
                      <span className="font-mono font-bold text-white">{unit.billing.parkingFee.toLocaleString('vi-VN')} đ</span>
                    </div>
                    <div className="p-3 flex items-center justify-between bg-[#161B22]/50">
                      <span className="text-gray-300">Phí dịch vụ tiện ích phát sinh</span>
                      <span className="font-mono font-bold text-white">{unit.billing.serviceFee.toLocaleString('vi-VN')} đ</span>
                    </div>
                    <div className="p-3.5 flex items-center justify-between bg-[#1C2533] font-bold">
                      <span className="text-white uppercase tracking-wider font-mono">Tổng Cộng Cần Thu</span>
                      <span className="font-mono text-base text-[#C5A880]">{unit.billing.totalAmount.toLocaleString('vi-VN')} đ</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-gray-400 flex items-center justify-between pt-1">
                    <span>Hạn nộp định kỳ: <strong className="text-white font-mono">{unit.billing.dueDate}</strong></span>
                    {unit.billing.lastPaidDate && (
                      <span>Ngày nộp gần nhất: <strong className="text-emerald-400 font-mono">{unit.billing.lastPaidDate}</strong></span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500 text-xs bg-[#121820] border border-[#222B35]">
                  Chưa phát sinh bảng kê hóa đơn cho căn hộ này.
                </div>
              )}
            </div>
          )}

          {/* ----------------------------------------------------------- */}
          {/* TAB 5: LỊCH SỬ KỸ THUẬT & BẢO TRÌ                           */}
          {/* ----------------------------------------------------------- */}
          {activeTab === 'MAINTENANCE' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                  <Wrench className="w-4 h-4 text-[#C5A880]" />
                  Nhật Ký Kiểm Tra Kỹ Thuật & Bảo Trì Định Kỳ
                </span>
              </div>

              {unit.maintenanceHistory && unit.maintenanceHistory.length > 0 ? (
                <div className="space-y-3">
                  {unit.maintenanceHistory.map(rec => (
                    <div key={rec.id} className="p-4 bg-[#121820] border border-[#222B35] space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-white text-sm flex items-center gap-2">
                          <span>{rec.title}</span>
                          <span className={`text-[10px] px-2 py-0.5 uppercase font-mono border ${
                            rec.status === 'COMPLETED' ? 'bg-emerald-950 text-emerald-300 border-emerald-600' : 'bg-amber-950 text-amber-300 border-amber-600'
                          }`}>
                            {rec.status === 'COMPLETED' ? 'Đã Hoàn Thành' : 'Đang Xử Lý'}
                          </span>
                        </div>
                        <div className="font-mono text-gray-400 text-[11px] flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> {rec.date}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 text-gray-400 pt-1 border-t border-[#222B35]">
                        <div>Kỹ thuật viên phụ trách: <strong className="text-gray-200">{rec.technician}</strong></div>
                        <div>Chi phí: <strong className="text-[#C5A880] font-mono">{rec.cost > 0 ? `${rec.cost.toLocaleString('vi-VN')} đ` : 'Miễn phí bảo hành'}</strong></div>
                      </div>

                      {rec.note && (
                        <div className="text-[11px] text-gray-400 italic">
                          Ghi chú: {rec.note}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-400 text-xs bg-[#121820] border border-[#222B35]">
                  Chưa ghi nhận lịch sử bảo trì cho căn hộ này.
                </div>
              )}
            </div>
          )}

        </div>

        {/* ============================================================= */}
        {/* 4. MODAL FOOTER                                               */}
        {/* ============================================================= */}
        <div className="p-4 bg-[#121820] border-t border-[#222B35] flex items-center justify-between select-none">
          <div className="text-xs text-gray-400 font-mono">
            Mã định danh: <strong className="text-white">SKYLINE-{unit.tower}-{unit.code}</strong>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-[#161B22] hover:bg-[#202936] text-gray-200 hover:text-white border border-[#2D3748] text-xs font-semibold uppercase tracking-wider transition-colors rounded-none"
          >
            Đóng Hồ Sơ
          </button>
        </div>

      </div>
    </div>
  );
}
