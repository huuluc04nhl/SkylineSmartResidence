'use client';

import React, { useState } from 'react';
import { DEMO_SURVEYS } from '@/lib/dataStore';
import { Vote, CheckCircle2, ShieldCheck, Lock } from 'lucide-react';

export default function SurveysVoting() {
  const [survey, setSurvey] = useState(DEMO_SURVEYS[0]);
  const [selectedOption, setSelectedOption] = useState(survey.user_voted || 'opt-1');
  const [votedSuccess, setVotedSuccess] = useState(false);

  const handleVote = () => {
    setVotedSuccess(true);
    setTimeout(() => setVotedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 w-full animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222B35] pb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-semibold">
            Quyền Biểu Quyết Cư Dân • Dành Cho Chủ Hộ
          </div>
          <h2 className="font-serif text-2xl text-white font-bold mt-1">
            Khảo Sát Ý Kiến & Biểu Quyết Ban Quản Trị
          </h2>
        </div>

        <span className="px-3 py-1 bg-[#161B22] border border-[#C5A880] text-[#C5A880] text-xs font-semibold flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" /> Tư Cách Chủ Sở Hữu Hợp Pháp
        </span>
      </div>

      {votedSuccess && (
        <div className="p-3 bg-emerald-950 border border-emerald-500 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> Lá phiếu biểu quyết của Căn 12A05 đã được mã hóa và ghi nhận vào hệ thống kiểm toán!
        </div>
      )}

      {/* Survey Card */}
      <div className="p-6 bg-[#121820] border border-[#222B35] space-y-5">
        <div className="space-y-2 border-b border-[#222B35] pb-4">
          <div className="flex items-center justify-between text-xs">
            <span className="px-2 py-0.5 bg-[#1C2533] border border-gray-700 text-[#C5A880] font-mono uppercase font-bold">
              {survey.legal_type}
            </span>
            <span className="text-gray-400 font-mono">Hạn chót: 10/09/2026</span>
          </div>

          <h3 className="font-serif text-xl text-white font-bold">
            {survey.title}
          </h3>

          <p className="text-xs text-gray-400 font-light leading-relaxed">
            {survey.description}
          </p>
        </div>

        {/* Voting Options */}
        <div className="space-y-3">
          <div className="text-xs uppercase tracking-wider text-gray-300 font-semibold">
            Lựa chọn biểu quyết:
          </div>

          {survey.options.map((opt) => {
            const isSelected = selectedOption === opt.id;
            const percentage = ((opt.votes / survey.total_votes) * 100).toFixed(1);

            return (
              <div
                key={opt.id}
                onClick={() => setSelectedOption(opt.id)}
                className={`p-4 bg-[#161B22] border cursor-pointer transition-all space-y-2 ${
                  isSelected ? 'border-[#C5A880] bg-[#1E2631]' : 'border-[#222B35] hover:border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-3.5 h-3.5 rounded-none border flex items-center justify-center ${
                      isSelected ? 'border-[#C5A880] bg-[#C5A880]' : 'border-gray-500'
                    }`}>
                      {isSelected && <span className="w-1.5 h-1.5 bg-[#0D1117]"></span>}
                    </span>
                    <span className="text-white font-medium">{opt.text}</span>
                  </div>
                  <span className="font-mono text-gray-300 font-bold">{percentage}% ({opt.votes} phiếu)</span>
                </div>

                <div className="w-full h-1.5 bg-[#121820] overflow-hidden">
                  <div
                    className={`h-full ${isSelected ? 'bg-[#C5A880]' : 'bg-gray-600'}`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-2 flex justify-between items-center">
          <div className="text-[11px] text-gray-500">
            Tổng số phiếu hợp lệ: <strong>{survey.total_votes}</strong> căn hộ đã tham gia
          </div>

          <button
            onClick={handleVote}
            className="px-6 py-2.5 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-colors"
          >
            Xác Nhận Biểu Quyết
          </button>
        </div>
      </div>
    </div>
  );
}
