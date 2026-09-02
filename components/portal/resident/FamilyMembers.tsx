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
  Lock,
  Search,
  Check,
  CheckCircle,
  Clock
} from 'lucide-react';
import { User as UserType } from '@/lib/dataStore';
import { 
  nksGetFamilyMembers, 
  nksAddFamilyMember, 
  nksRemoveFamilyMember,
  nksSearchFamilyAccount
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
  role: 'Family';
  relationship?: string;
  isAdded?: boolean;
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

  // Add Member Modal State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'PRE_APPROVED' | 'SEARCH_API'>('PRE_APPROVED');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Selected Account from API
  const [selectedAccount, setSelectedAccount] = useState<BqlEligibleAccount | null>(null);
  const [newRelationship, setNewRelationship] = useState<string>('Vợ / Chồng');
  const [newLicensePlate, setNewLicensePlate] = useState<string>('');

  // Live API Search State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchingApi, setIsSearchingApi] = useState<boolean>(false);
  const [searchResult, setSearchResult] = useState<BqlEligibleAccount | null>(null);
  const [searchNotFound, setSearchNotFound] = useState<string | null>(null);

  // Load Family Members & Pre-verified API Accounts
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
      console.warn('Load family API error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  // Select account from pre-verified list
  const handleSelectPreApproved = (acc: BqlEligibleAccount) => {
    setSelectedAccount(acc);
    setNewRelationship(acc.relationship || 'Vợ / Chồng');
    setNewLicensePlate(acc.licensePlate || '');
    setActionError(null);
  };

  // Search account via live API
  const handleSearchApi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearchingApi(true);
    setSearchNotFound(null);
    setSearchResult(null);
    setActionError(null);

    try {
      const res = await nksSearchFamilyAccount(searchQuery.trim());
      if (res.success && res.found && res.account) {
        setSearchResult(res.account);
      } else {
        setSearchNotFound(res.message || `Không tìm thấy tài khoản nào khớp với "${searchQuery}" trên hệ thống API.`);
      }
    } catch (err) {
      setSearchNotFound('Lỗi kết nối khi tra cứu API người dùng.');
    } finally {
      setIsSearchingApi(false);
    }
  };

  // Submit Add Member strictly via API
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) {
      setActionError('Vui lòng chọn hoặc tra cứu một tài khoản hợp lệ từ hệ thống API.');
      return;
    }

    setIsSubmitting(true);
    setActionError(null);

    try {
      const res = await nksAddFamilyMember({
        accountId: selectedAccount.id,
        username: selectedAccount.username,
        phone: selectedAccount.phone,
        fullName: selectedAccount.fullName,
        idCard: selectedAccount.idCard,
        licensePlate: newLicensePlate.trim() || selectedAccount.licensePlate,
        avatarUrl: selectedAccount.avatarUrl,
        relationship: newRelationship,
      });

      if (res.success && res.members) {
        setMembers(res.members);
        setShowAddModal(false);
        setActionSuccess(`✓ Đã thêm thành viên "${selectedAccount.fullName}" vào Căn hộ ${aptCode} theo hồ sơ API thành công!`);
        setTimeout(() => setActionSuccess(null), 4000);

        // Reset
        setSelectedAccount(null);
        setSearchResult(null);
        setSearchQuery('');
        setNewRelationship('Vợ / Chồng');
        setNewLicensePlate('');
        fetchMembers();
      } else {
        setActionError(res.message || 'Không thể thêm thành viên. Vui lòng thử lại.');
      }
    } catch (err: any) {
      setActionError(err.message || 'Lỗi kết nối API khi thêm thành viên.');
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
        fetchMembers();
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
            <Users className="w-3.5 h-3.5" /> Quyền Quản Trị Căn Hộ • Ban Quản Lý & Chủ Hộ
          </div>
          <h2 className="font-serif text-2xl text-white font-bold mt-1">
            Quản Lý Cư Dân & Thành Viên Căn Hộ {aptCode}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Căn hộ: <strong className="text-white font-mono">{aptCode}</strong> • Phân quyền ra vào tự động, FaceID và sử dụng tiện ích cho người nhà
          </p>
        </div>

        {isOwner && (
          <button
            type="button"
            onClick={() => {
              setShowAddModal(true);
              setSelectedAccount(null);
              setSearchResult(null);
              setActionError(null);
            }}
            className="px-5 py-2.5 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 rounded shadow-lg flex-shrink-0"
          >
            <UserPlus className="w-4 h-4" /> Thêm Thành Viên Mới
          </button>
        )}
      </div>

      {/* Success Alerts */}
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
            Thành Viên Đang Cư Trú
          </div>
          <div className="text-2xl font-bold font-serif text-white mt-1 flex items-baseline gap-2">
            <span>{members.length}</span>
            <span className="text-xs text-gray-400 font-normal">/ 6 người tối đa</span>
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
            <Users className="w-4 h-4 text-[#C5A880]" /> Danh Sách Người Nhà Được Cấp Quyền Căn Hộ ({members.length})
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
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(m.id, m.fullName)}
                    className="self-end sm:self-center px-3 py-1.5 text-xs text-rose-400 hover:text-white hover:bg-rose-950/60 border border-rose-900/60 rounded transition-colors flex items-center gap-1.5"
                    title="Hủy quyền thành viên"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Hủy Quyền
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* MODAL: THÊM THÀNH VIÊN THEO DỮ LIỆU API                              */}
      {/* =================================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0D1117] border border-[#C5A880]/70 max-w-2xl w-full p-5 sm:p-6 text-white space-y-4 shadow-2xl rounded-xl max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#222B35] pb-3">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-[#C5A880] font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Xác Thực Hồ Sơ Người Nhà
                </div>
                <h3 className="font-serif text-lg font-bold text-white">
                  Thêm Thành Viên Căn Hộ {aptCode}
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Message */}
            {actionError && (
              <div className="p-3 bg-rose-950/80 border border-rose-500 text-rose-300 text-xs flex items-center gap-2 rounded">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 gap-2 bg-[#121820] p-1 rounded-lg border border-[#222B35] text-xs">
              <button
                type="button"
                onClick={() => setModalMode('PRE_APPROVED')}
                className={`py-2 px-3 rounded text-center font-medium transition-all ${
                  modalMode === 'PRE_APPROVED'
                    ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                1. Danh Sách Đã Đăng Ký ({bqlAccounts.length})
              </button>

              <button
                type="button"
                onClick={() => setModalMode('SEARCH_API')}
                className={`py-2 px-3 rounded text-center font-medium transition-all ${
                  modalMode === 'SEARCH_API'
                    ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                2. Tìm Kiếm Theo SĐT / CCCD
              </button>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* MODE 1: CHỌN TỪ TÀI KHOẢN ĐÃ ĐĂNG KÝ CHO CĂN HỘ               */}
            {/* ------------------------------------------------------------- */}
            {modalMode === 'PRE_APPROVED' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Chọn tài khoản người nhà đã đăng ký với Ban Quản Lý:</span>
                  <span className="text-[11px] text-[#C5A880] font-mono">Căn {aptCode}</span>
                </div>

                {bqlAccounts.length === 0 ? (
                  <div className="p-6 text-center text-xs text-gray-400 border border-[#222B35] rounded-lg">
                    Chưa có tài khoản người nhà nào được đăng ký trong hệ thống API cho Căn hộ {aptCode}.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                    {bqlAccounts.map((acc) => {
                      const isAlreadyAdded = members.some(
                        (m) => m.username === acc.username || m.phone === acc.phone || m.id === acc.id
                      );
                      const isSelected = selectedAccount?.id === acc.id;

                      return (
                        <div
                          key={acc.id}
                          onClick={() => {
                            if (!isAlreadyAdded) handleSelectPreApproved(acc);
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
                                  Đã Cấp Quyền
                                </span>
                              ) : isSelected ? (
                                <span className="text-[9px] text-[#0D1117] font-bold bg-[#C5A880] px-1.5 py-0.5 rounded flex-shrink-0">
                                  Đang Chọn ✓
                                </span>
                              ) : (
                                <span className="text-[9px] text-purple-300 font-medium bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-800/40 flex-shrink-0">
                                  {acc.relationship || 'Người Nhà'}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-gray-300 font-mono truncate">{acc.phone}</div>
                            <div className="text-[10px] text-[#C5A880] font-mono truncate">CCCD: {acc.idCard}</div>
                            {acc.licensePlate && (
                              <div className="text-[10px] text-cyan-400 font-mono truncate">Xe: {acc.licensePlate}</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* MODE 2: TRA CỨU TÀI KHOẢN QUA API BẰNG SĐT / CCCD             */}
            {/* ------------------------------------------------------------- */}
            {modalMode === 'SEARCH_API' && (
              <div className="space-y-3">
                <form onSubmit={handleSearchApi} className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Nhập SĐT hoặc CCCD người nhà (VD: 0908776655)..."
                    className="flex-1 bg-[#161B22] border border-[#2D3748] p-2.5 text-white text-xs font-mono rounded focus:border-[#C5A880] outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isSearchingApi || !searchQuery.trim()}
                    className="px-4 py-2.5 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold rounded flex items-center gap-1.5 transition-colors whitespace-nowrap"
                  >
                    {isSearchingApi ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                    Tìm Kiếm
                  </button>
                </form>

                {searchNotFound && (
                  <div className="p-3 bg-[#161D26] border border-gray-700 text-gray-300 text-xs rounded">
                    {searchNotFound}
                  </div>
                )}

                {searchResult && (
                  <div className="p-4 bg-[#161D26] border border-emerald-500/60 rounded-lg space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between text-xs text-emerald-400 font-bold border-b border-[#222B35] pb-2">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4" /> Thông Tin Người Nhà Tìm Thấy:
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAccount(searchResult);
                          setNewRelationship(searchResult.relationship || 'Vợ / Chồng');
                          setNewLicensePlate(searchResult.licensePlate || '');
                        }}
                        className="px-3 py-1 bg-[#C5A880] text-[#0D1117] font-bold text-[11px] rounded hover:bg-white transition-colors"
                      >
                        {selectedAccount?.id === searchResult.id ? 'Đang Chọn ✓' : '+ Chọn Tài Khoản Này'}
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <img
                        src={searchResult.avatarUrl || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'}
                        alt={searchResult.fullName}
                        className="w-12 h-12 rounded-full object-cover border border-[#C5A880]/60 flex-shrink-0"
                      />
                      <div className="space-y-0.5 text-xs">
                        <div className="font-bold text-white text-sm flex items-center gap-2">
                          <span>{searchResult.fullName}</span>
                          <span className="text-[10px] text-purple-300 font-normal bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-800/40">
                            {searchResult.relationship || 'Người Nhà'}
                          </span>
                        </div>
                        <div className="text-gray-300 font-mono">SĐT: {searchResult.phone}</div>
                        <div className="text-[#C5A880] font-mono">CCCD: {searchResult.idCard}</div>
                        {searchResult.licensePlate && (
                          <div className="text-cyan-400 font-mono">Biển số xe: {searchResult.licensePlate}</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* CONFIRMATION & ROLE ASSIGNMENT SECTION                        */}
            {/* ------------------------------------------------------------- */}
            {selectedAccount ? (
              <form onSubmit={handleAddMember} className="pt-3 border-t border-[#222B35] space-y-3.5 text-xs">
                <div className="p-3 bg-[#161D26] border border-[#C5A880]/60 rounded-lg space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#C5A880] flex items-center justify-between">
                    <span>Thông Tin Người Nhà Xác Thực:</span>
                    <span className="text-emerald-400 text-[10px] font-mono">Đã Xác Thực e-KYC</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-gray-200">
                    <div>• Họ tên: <strong className="text-white">{selectedAccount.fullName}</strong></div>
                    <div>• SĐT: <strong className="font-mono text-white">{selectedAccount.phone}</strong></div>
                    <div>• Số CCCD: <strong className="font-mono text-[#C5A880]">{selectedAccount.idCard}</strong></div>
                    <div>• Quan hệ mặc định: <strong className="text-purple-300">{selectedAccount.relationship || 'Người Nhà'}</strong></div>
                    {selectedAccount.licensePlate && (
                      <div className="col-span-2">• Biển số xe đăng ký: <strong className="font-mono text-cyan-400">{selectedAccount.licensePlate}</strong></div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
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

                  <div>
                    <label className="text-gray-300 font-medium block mb-1">Biển Số Xe (Nếu có):</label>
                    <input
                      type="text"
                      value={newLicensePlate}
                      onChange={(e) => setNewLicensePlate(e.target.value)}
                      placeholder="VD: 59P1-886.79"
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white font-mono rounded focus:border-[#C5A880] outline-none"
                    />
                  </div>
                </div>

                <div className="p-3 bg-purple-950/40 border border-purple-500/40 rounded text-purple-300 text-[11px] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span>Sau khi xác nhận, tài khoản người nhà sẽ được cấp quyền FaceID sảnh đón, thang máy và tiện ích sinh hoạt.</span>
                </div>

                <div className="pt-2 flex justify-end gap-2.5 border-t border-[#222B35]">
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
                    className="px-5 py-2.5 bg-[#C5A880] hover:bg-white text-[#0D1117] font-bold text-xs uppercase tracking-wider rounded shadow-lg transition-colors flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Đang Xử Lý...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" /> Xác Nhận Thêm Thành Viên
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-4 bg-[#121820] border border-[#222B35] rounded-lg text-center text-xs text-gray-400">
                Vui lòng chọn một tài khoản người nhà ở trên để tiếp tục thiết lập quan hệ và cấp quyền.
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
