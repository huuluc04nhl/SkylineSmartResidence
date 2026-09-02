'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw,
  X,
  CreditCard,
  Car,
  Phone,
  ScanFace,
  User,
  Sparkles,
  Lock
} from 'lucide-react';
import { User as UserType } from '@/lib/dataStore';
import { 
  nksGetFamilyMembers, 
  nksAddFamilyMember, 
  nksRemoveFamilyMember
} from '@/lib/nksApiClient';

export interface FamilyMemberItem {
  id: string;
  fullName: string;
  phone: string;
  role: 'Family' | 'Tenant';
  relationship: string;
  idCard?: string;
  licensePlate?: string;
  avatarUrl?: string;
  username?: string;
  faceStatus?: string;
  addedDate?: string;
}

export interface BqlEligibleAccount {
  id: string;
  username: string;
  fullName: string;
  phone: string;
  idCard: string;
  licensePlate?: string;
  avatarUrl?: string;
  role: 'Family' | 'Tenant';
  relationship?: string;
}

interface FamilyMembersProps {
  currentUser: UserType;
}

export default function FamilyMembers({ currentUser }: FamilyMembersProps) {
  const aptCode = currentUser.apartment_code || '12A05';
  const isOwner = currentUser.role === 'OWNER';

  const [members, setMembers] = useState<FamilyMemberItem[]>([]);
  const [bqlAccounts, setBqlAccounts] = useState<BqlEligibleAccount[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedBqlAccountId, setSelectedBqlAccountId] = useState<string | null>(null);

  // Add Member Modal State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Form State
  const [newFullName, setNewFullName] = useState<string>('');
  const [newPhone, setNewPhone] = useState<string>('');
  const [newIdCard, setNewIdCard] = useState<string>('');
  const [newRelationship, setNewRelationship] = useState<string>('Vợ / Chồng');
  const [newRole, setNewRole] = useState<'Family' | 'Tenant'>('Family');
  const [newLicensePlate, setNewLicensePlate] = useState<string>('');
  const [newAvatarUrl, setNewAvatarUrl] = useState<string>('');

  // Load Family Members & BQL Accounts from API on mount
  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const res = await nksGetFamilyMembers();
      if (res.success && res.members) {
        setMembers(res.members);
      }
      if (res.bqlAccounts) {
        setBqlAccounts(res.bqlAccounts);
      }
    } catch (err) {
      console.warn('Load family error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  // Quick-select account pre-approved by BQL
  const handleSelectBqlAccount = (acc: BqlEligibleAccount) => {
    setSelectedBqlAccountId(acc.id);
    setNewFullName(acc.fullName);
    setNewPhone(acc.phone);
    setNewIdCard(acc.idCard);
    setNewLicensePlate(acc.licensePlate || '');
    setNewAvatarUrl(acc.avatarUrl || '');
    setNewRole('Family');
    setNewRelationship(acc.relationship || 'Thành Viên Gia Đình');
  };

  // Submit Add Member
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName || !newPhone) {
      setActionError('Vui lòng nhập họ tên và số điện thoại của thành viên.');
      return;
    }

    setIsSubmitting(true);
    setActionError(null);

    try {
      const res = await nksAddFamilyMember({
        fullName: newFullName,
        phone: newPhone,
        idCard: newIdCard,
        relationship: newRelationship,
        role: newRole,
        licensePlate: newLicensePlate,
        avatarUrl: newAvatarUrl
      });

      if (res.success && res.members) {
        setMembers(res.members);
        setShowAddModal(false);
        setActionSuccess(`✓ Đã thêm thành viên "${newFullName}" vào Căn hộ ${aptCode} thành công!`);
        setTimeout(() => setActionSuccess(null), 4000);

        // Reset form
        setSelectedBqlAccountId(null);
        setNewFullName('');
        setNewPhone('');
        setNewIdCard('');
        setNewRelationship('Vợ / Chồng');
        setNewLicensePlate('');
        setNewAvatarUrl('');
      } else {
        setActionError(res.message || 'Không thể thêm thành viên. Vui lòng thử lại.');
      }
    } catch (err: any) {
      setActionError(err.message || 'Lỗi kết nối khi thêm thành viên.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Remove Member
  const handleRemoveMember = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc muốn hủy phân quyền và xóa thành viên "${name}" khỏi căn hộ ${aptCode}?`)) {
      return;
    }

    try {
      const res = await nksRemoveFamilyMember(id);
      if (res.success) {
        setMembers(prev => prev.filter(m => m.id !== id));
        setActionSuccess(`✓ Đã hủy phân quyền thành viên "${name}".`);
        setTimeout(() => setActionSuccess(null), 3000);
      } else {
        alert(res.message || 'Không thể xóa thành viên.');
      }
    } catch (err) {
      alert('Lỗi kết nối khi xóa thành viên.');
    }
  };

  return (
    <div className="space-y-6 w-full animate-fadeIn select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222B35] pb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-semibold flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> Quyền Quản Trị Căn Hộ • Chủ Sở Hữu
          </div>
          <h2 className="font-serif text-2xl text-white font-bold mt-1">
            Quản Lý Thành Viên Căn Hộ {aptCode}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Căn hộ: <strong className="text-white font-mono">{aptCode}</strong> • Cấp quyền ra vào tự động, FaceID và sử dụng tiện ích cho người nhà
          </p>
        </div>

        {isOwner && (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 rounded shadow-lg flex-shrink-0"
          >
            <UserPlus className="w-4 h-4" /> Thêm Thành Viên Mới
          </button>
        )}
      </div>

      {/* Success / Error Alerts */}
      {actionSuccess && (
        <div className="p-3.5 bg-emerald-950/90 border border-emerald-500 text-emerald-300 text-xs flex items-center gap-2 rounded animate-fadeIn shadow-lg">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Overview Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-[#121820] border border-[#222B35] rounded-lg">
          <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
            Tổng Số Thành Viên
          </div>
          <div className="text-2xl font-bold font-serif text-white mt-1 flex items-baseline gap-2">
            <span>{members.length}</span>
            <span className="text-xs text-gray-500 font-normal font-sans">/ 6 người tối đa</span>
          </div>
        </div>

        <div className="p-4 bg-[#121820] border border-[#222B35] rounded-lg">
          <div className="text-[10px] uppercase tracking-wider text-emerald-300 font-semibold">
            Đã Kích Hoạt FaceID
          </div>
          <div className="text-2xl font-bold font-serif text-emerald-400 mt-1">
            {members.length} người
          </div>
        </div>

        <div className="p-4 bg-[#121820] border border-[#222B35] rounded-lg">
          <div className="text-[10px] uppercase tracking-wider text-cyan-300 font-semibold">
            Phương Tiện Đăng Ký
          </div>
          <div className="text-2xl font-bold font-serif text-cyan-400 mt-1">
            {members.filter(m => m.licensePlate).length} xe
          </div>
        </div>
      </div>

      {/* Members List */}
      <div className="bg-[#121820] border border-[#222B35] rounded-lg overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-[#222B35] flex items-center justify-between">
          <div className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-[#C5A880]" /> Danh Sách Người Được Cấp Quyền Căn Hộ ({members.length})
          </div>
          <button
            onClick={fetchMembers}
            disabled={isLoading}
            className="text-xs text-gray-400 hover:text-[#C5A880] flex items-center gap-1 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Làm mới
          </button>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xs text-[#C5A880] font-mono flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" /> Đang tải danh sách thành viên...
          </div>
        ) : members.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-xs space-y-2">
            <Users className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p>Chưa có thành viên nào được thêm vào Căn hộ {aptCode}.</p>
            {isOwner && (
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="text-[#C5A880] font-bold underline hover:text-white"
              >
                + Thêm thành viên đầu tiên
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-[#222B35]">
            {members.map((m) => (
              <div
                key={m.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#161B22] transition-colors"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={m.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                    alt={m.fullName}
                    className="w-12 h-12 rounded-full object-cover border-2 border-[#C5A880]/60 shadow-md flex-shrink-0"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-sm sm:text-base">{m.fullName}</span>
                      <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded border bg-purple-950/80 text-purple-300 border-purple-600/60">
                        Người Nhà / Gia Đình
                      </span>
                    </div>

                    <div className="text-gray-400 text-xs flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span>Quan hệ: <strong className="text-gray-200">{m.relationship}</strong></span>
                      <span>• SĐT: <strong className="font-mono text-gray-200">{m.phone}</strong></span>
                      {m.idCard && (
                        <span>• CCCD: <strong className="font-mono text-[#C5A880]">{m.idCard}</strong></span>
                      )}
                      {m.licensePlate && (
                        <span>• Biển số: <strong className="font-mono text-cyan-400">{m.licensePlate}</strong></span>
                      )}
                    </div>

                    <div className="text-[11px] text-emerald-400 flex items-center gap-1.5 pt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 
                      <span>{m.faceStatus || 'Đã Kích Hoạt FaceID'} (Phân quyền Sảnh A/B & Thang máy Tầng 12)</span>
                    </div>
                  </div>
                </div>

                {isOwner && (
                  <div className="flex items-center gap-2 sm:self-center self-end">
                    <button
                      onClick={() => handleRemoveMember(m.id, m.fullName)}
                      className="px-3 py-1.5 text-gray-400 hover:text-rose-300 hover:bg-rose-950/50 border border-gray-800 hover:border-rose-500 text-xs rounded transition-colors flex items-center gap-1.5"
                      title="Hủy phân quyền thành viên"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa Quyền</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Member Modal with BQL Approved Accounts Quick-Selector */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#121820] border border-[#C5A880]/80 max-w-2xl w-full p-6 text-white space-y-5 shadow-2xl rounded-xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#222B35] pb-3">
              <div>
                <h4 className="font-serif text-lg font-bold text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-[#C5A880]" /> Thêm Thành Viên Căn Hộ {aptCode}
                </h4>
                <p className="text-xs text-gray-400 mt-0.5">
                  Chọn nhanh tài khoản đã được Ban Quản Lý phê duyệt hoặc nhập thông tin thành viên mới
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error in modal */}
            {actionError && (
              <div className="p-3 bg-rose-950/80 border border-rose-500 text-rose-300 text-xs flex items-center gap-2 rounded">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {/* Section 1: Quick Selector from BQL Pre-Approved Accounts */}
            {bqlAccounts.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#C5A880] uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> Tài Khoản Được BQL Xác Minh Cho Căn Hộ {aptCode}:
                  </label>
                  <span className="text-[10px] text-gray-400">Bấm để chọn nhanh</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {bqlAccounts.map((acc) => {
                    const isAlreadyAdded = members.some(
                      (m) => m.username === acc.username || m.phone === acc.phone
                    );
                    const isSelected = selectedBqlAccountId === acc.id;

                    return (
                      <div
                        key={acc.id}
                        onClick={() => {
                          if (!isAlreadyAdded) handleSelectBqlAccount(acc);
                        }}
                        className={`p-3 rounded-lg border transition-all flex items-center gap-3 cursor-pointer ${
                          isAlreadyAdded
                            ? 'bg-[#0E131A] border-gray-800 opacity-60 cursor-not-allowed'
                            : isSelected
                            ? 'bg-[#1C2533] border-[#C5A880] ring-1 ring-[#C5A880] shadow-lg'
                            : 'bg-[#161D26] border-[#222B35] hover:border-gray-600 hover:bg-[#1A232E]'
                        }`}
                      >
                        <img
                          src={acc.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                          alt={acc.fullName}
                          className="w-10 h-10 rounded-full object-cover border border-[#C5A880]/50 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0 text-xs">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-white truncate">{acc.fullName}</span>
                            {isAlreadyAdded ? (
                              <span className="text-[9px] text-emerald-400 font-bold bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-500/40 flex-shrink-0">
                                Đã Thêm
                              </span>
                            ) : isSelected ? (
                              <span className="text-[9px] text-[#0D1117] font-bold bg-[#C5A880] px-1.5 py-0.5 rounded flex-shrink-0">
                                Đang Chọn ✓
                              </span>
                            ) : null}
                          </div>
                          <div className="text-[11px] text-gray-400 font-mono truncate">{acc.phone}</div>
                          <div className="text-[10px] text-[#C5A880] font-mono truncate">CCCD: {acc.idCard}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Section 2: Details & Custom Confirmation Form */}
            <form onSubmit={handleAddMember} className="space-y-3.5 text-xs pt-3 border-t border-[#222B35]">
              <div className="text-[11px] font-bold text-gray-300 uppercase tracking-wider">
                Thông Tin Xác Nhận & Phân Quyền:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-300 font-medium block mb-1">Họ và Tên Đầy Đủ:</label>
                  <input
                    type="text"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white rounded focus:border-[#C5A880] outline-none"
                    placeholder="VD: Nguyễn Văn A"
                    required
                  />
                </div>

                <div>
                  <label className="text-gray-300 font-medium block mb-1">Số Điện Thoại:</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white font-mono rounded focus:border-[#C5A880] outline-none"
                    placeholder="VD: 0903112233"
                    required
                  />
                </div>

                <div>
                  <label className="text-gray-300 font-medium block mb-1">Số CCCD / Định Danh:</label>
                  <input
                    type="text"
                    value={newIdCard}
                    onChange={(e) => setNewIdCard(e.target.value)}
                    className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white font-mono rounded focus:border-[#C5A880] outline-none"
                    placeholder="12 số CCCD"
                  />
                </div>

                <div>
                  <label className="text-gray-300 font-medium block mb-1">Biển Số Xe Đăng Ký:</label>
                  <input
                    type="text"
                    value={newLicensePlate}
                    onChange={(e) => setNewLicensePlate(e.target.value)}
                    className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white font-mono rounded focus:border-[#C5A880] outline-none"
                    placeholder="VD: 51K-999.88"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-gray-300 font-medium block mb-1">Mối Quan Hệ Với Chủ Hộ:</label>
                  <select
                    value={newRelationship}
                    onChange={(e) => setNewRelationship(e.target.value)}
                    className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white rounded focus:border-[#C5A880] outline-none"
                  >
                    <option value="Vợ / Chồng">Vợ / Chồng</option>
                    <option value="Con Cái">Con Cái</option>
                    <option value="Bố / Mẹ">Bố / Mẹ</option>
                    <option value="Anh / Chị / Em">Anh / Chị / Em</option>
                    <option value="Người Thân Gia Đình">Người Thân Gia Đình</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-purple-950/40 border border-purple-500/40 rounded text-purple-300 text-[11px] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-400 flex-shrink-0" />
                <span>Người nhà sau khi thêm sẽ được tự động kích hoạt FaceID sảnh đón, thang máy và tiện ích sinh hoạt. Quyền tài chính & biểu quyết thuộc độc quyền của chủ hộ.</span>
              </div>

              <div className="pt-3 flex justify-end gap-2.5 border-t border-[#222B35]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-transparent hover:bg-[#161D26] text-gray-400 hover:text-white rounded transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] font-bold uppercase tracking-wider rounded transition-all flex items-center gap-2 shadow-lg disabled:opacity-50"
                >
                  {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>{isSubmitting ? 'Đang Thêm...' : 'Xác Nhận Cấp Quyền'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
