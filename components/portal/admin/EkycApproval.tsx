'use client';

import React, { useState } from 'react';
import { UserCheck, CheckCircle2, XCircle, Eye, Shield, Sparkles } from 'lucide-react';

export default function EkycApproval() {
  const [approvedIds, setApprovedIds] = useState<string[]>([]);

  const pendingUsers = [
    {
      id: 'ekyc-1',
      fullName: 'Trần Thị Mai',
      role: 'Thành viên gia đình (Căn 12A05)',
      phone: '0908776655',
      idCardNo: '079302008765',
      faceScore: 98.4,
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300',
      idCardFrontUrl: 'https://images.unsplash.com/photo-1578852612716-854e527abf2e?w=500',
      submittedAt: '26/08/2026 15:40',
    },
    {
      id: 'ekyc-2',
      fullName: 'Vũ Đức Thịnh',
      role: 'Chủ sở hữu mới (Căn 18A01)',
      phone: '0912998877',
      idCardNo: '001095012345',
      faceScore: 96.1,
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300',
      idCardFrontUrl: 'https://images.unsplash.com/photo-1578852612716-854e527abf2e?w=500',
      submittedAt: '26/08/2026 14:15',
    },
  ];

  const handleApprove = (id: string) => {
    setApprovedIds(prev => [...prev, id]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222B35] pb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-semibold">
            Hồ Sơ Cư Dân • Xác Thực Danh Tính
          </div>
          <h2 className="font-serif text-2xl text-white font-bold mt-1">
            Phê Duyệt Hồ Sơ Định Danh e-KYC & Cấp Quyền FaceID
          </h2>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-300">
          <span className="px-3 py-1 bg-[#161B22] border border-[#2D3748] text-[#C5A880]">
            Xác Minh Tự Động & So Khớp Khuôn Mặt
          </span>
        </div>
      </div>

      {/* Queue List */}
      <div className="space-y-4">
        {pendingUsers.map((user) => {
          const isApproved = approvedIds.includes(user.id);

          return (
            <div
              key={user.id}
              className={`p-6 bg-[#121820] border transition-colors ${
                isApproved ? 'border-emerald-500/80 bg-emerald-950/10' : 'border-[#222B35]'
              }`}
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                {/* Avatar & Face Match */}
                <div className="lg:col-span-3 flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={user.avatarUrl}
                      alt={user.fullName}
                      className="w-16 h-16 object-cover border border-[#C5A880]"
                    />
                    <span className="absolute -bottom-2 -right-1 px-1.5 py-0.5 bg-emerald-950 border border-emerald-500 text-emerald-400 text-[9px] font-mono font-bold">
                      {user.faceScore}%
                    </span>
                  </div>
                  <div>
                    <h3 className="font-serif text-base font-bold text-white">
                      {user.fullName}
                    </h3>
                    <div className="text-xs text-[#C5A880]">{user.role}</div>
                    <div className="text-[11px] text-gray-400 font-mono mt-0.5">SĐT: {user.phone}</div>
                  </div>
                </div>

                {/* OCR ID Card details */}
                <div className="lg:col-span-6 grid grid-cols-2 gap-3 text-xs bg-[#161B22] p-3.5 border border-[#222B35]">
                  <div>
                    <span className="text-gray-500 block text-[10px] uppercase">Số CCCD (AI OCR trích xuất):</span>
                    <strong className="font-mono text-white text-sm">{user.idCardNo}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px] uppercase">Thời gian nộp e-KYC:</span>
                    <span className="font-mono text-gray-300">{user.submittedAt}</span>
                  </div>
                  <div className="col-span-2 text-[11px] text-emerald-400 flex items-center gap-1 pt-1 border-t border-[#222B35]">
                    <Sparkles className="w-3.5 h-3.5" /> Ảnh chân dung khớp 98.4% với ảnh thẻ CCCD.
                  </div>
                </div>

                {/* Actions */}
                <div className="lg:col-span-3 flex flex-col gap-2 justify-center">
                  {isApproved ? (
                    <div className="py-2.5 bg-emerald-900/60 border border-emerald-500 text-emerald-300 text-xs text-center font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Đã Cấp Quyền FaceID
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => handleApprove(user.id)}
                        className="py-2.5 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
                      >
                        <UserCheck className="w-4 h-4" /> Phê Duyệt & Cấp Quyền FaceID
                      </button>
                      <button className="py-1.5 bg-transparent border border-red-800 hover:bg-red-950 text-red-400 text-xs font-semibold uppercase tracking-wider transition-colors">
                        Từ Chối Hồ Sơ
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
