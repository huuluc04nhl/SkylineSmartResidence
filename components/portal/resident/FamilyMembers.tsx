'use client';

import React, { useState } from 'react';
import { Users, UserPlus, Trash2, ShieldCheck, KeyRound, CheckCircle2 } from 'lucide-react';

export default function FamilyMembers() {
  const [members, setMembers] = useState([
    {
      id: 'mem-1',
      fullName: 'Trần Thị Mai',
      role: 'Tenant',
      relationship: 'Vợ',
      phone: '0908776655',
      faceStatus: 'Đã kích hoạt FaceID',
      addedDate: '15/06/2026',
    },
    {
      id: 'mem-2',
      fullName: 'Nguyễn Văn Minh',
      role: 'Family',
      relationship: 'Con trai',
      phone: '0912334455',
      faceStatus: 'Đã kích hoạt FaceID',
      addedDate: '10/01/2026',
    },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRelation, setNewRelation] = useState<'Family' | 'Tenant'>('Family');

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName || !newPhone) return;

    setMembers([
      ...members,
      {
        id: `mem-${Date.now()}`,
        fullName: newFullName,
        role: newRelation,
        relationship: newRelation === 'Family' ? 'Người thân' : 'Khách thuê mới',
        phone: newPhone,
        faceStatus: 'Chờ đối soát e-KYC',
        addedDate: new Date().toLocaleDateString('vi-VN'),
      },
    ]);

    setNewFullName('');
    setNewPhone('');
    setShowAddModal(false);
  };

  const handleRemoveMember = (id: string) => {
    setMembers(members.filter(m => m.id !== id));
  };

  return (
    <div className="space-y-6 w-full animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222B35] pb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-semibold">
            Quyền Tự Trị Căn Hộ • Chủ Sở Hữu
          </div>
          <h2 className="font-serif text-2xl text-white font-bold mt-1">
            Quản Lý Cư Dân & Thành Viên Căn Hộ
          </h2>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5"
        >
          <UserPlus className="w-4 h-4" /> Thêm Thành Viên Cư Dân
        </button>
      </div>

      {/* Members List */}
      <div className="space-y-3">
        {members.map((member) => (
          <div
            key={member.id}
            className="p-5 bg-[#121820] border border-[#222B35] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#161B22] border border-[#C5A880] flex items-center justify-center text-[#C5A880] font-serif font-bold text-sm">
                {member.fullName.charAt(0)}
              </div>
              <div>
                <h4 className="font-serif text-base font-bold text-white">
                  {member.fullName}
                </h4>
                <div className="text-xs text-[#C5A880]">{member.relationship}</div>
                <div className="text-[11px] text-gray-400 font-mono mt-0.5">SĐT: {member.phone} • Ngày thêm: {member.addedDate}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 bg-[#1C2533] border border-emerald-600 text-emerald-400 text-xs font-mono font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> {member.faceStatus}
              </span>

              <button
                onClick={() => handleRemoveMember(member.id)}
                className="p-2 border border-gray-700 text-gray-400 hover:text-red-400 hover:border-red-500 transition-colors"
                title="Xóa quyền truy cập khỏi căn hộ"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="bg-[#0D1117] border border-[#C5A880] max-w-md w-full p-6 text-white space-y-4">
            <div className="flex items-center justify-between border-b border-[#222B35] pb-3">
              <span className="font-serif text-lg font-bold">Thêm Thành Viên Vào Căn 12A05</span>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-gray-300">Họ và tên đầy đủ:</label>
                <input
                  type="text"
                  placeholder="VD: Trần Thị B"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white focus:outline-none focus:border-[#C5A880]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-300">Số điện thoại (dùng làm tài khoản):</label>
                <input
                  type="text"
                  placeholder="VD: 0988112233"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white focus:outline-none focus:border-[#C5A880]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-300">Vai trò trong căn hộ:</label>
                <select
                  value={newRelation}
                  onChange={(e) => setNewRelation(e.target.value as any)}
                  className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white focus:outline-none focus:border-[#C5A880]"
                >
                  <option value="Family">Cư dân thuộc chủ hộ (Thành viên gia đình)</option>
                  <option value="Tenant">Cư dân tạm trú căn hộ</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-transparent border border-gray-700 text-gray-300"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#C5A880] text-[#0D1117] font-bold uppercase tracking-wider"
                >
                  Cấp Quyền
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
