'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Vote, 
  CheckCircle2, 
  ShieldCheck, 
  Lock, 
  Clock, 
  Calendar, 
  Users, 
  Building, 
  Sparkles, 
  Filter, 
  Search, 
  Plus, 
  AlertCircle, 
  ChevronRight, 
  BarChart3, 
  FileText, 
  X, 
  Check, 
  AlertTriangle, 
  Info,
  ShieldAlert,
  Send,
  Eye,
  RefreshCw,
  Archive
} from 'lucide-react';
import { User } from '@/lib/dataStore';
import { 
  VotingTopic, 
  VotingOption, 
  VotingLegalType, 
  getVotingTopics, 
  castVote, 
  createVotingTopic, 
  toggleVotingTopicStatus 
} from '@/lib/votingStore';

interface SurveysVotingProps {
  currentUser?: User;
}

export default function SurveysVoting({ currentUser }: SurveysVotingProps) {
  const isAdmin = currentUser?.role === 'ADMIN';
  const isOwner = currentUser?.role === 'OWNER';
  const aptCode = currentUser?.apartment_code || '12A05';
  const userName = currentUser?.full_name || (currentUser as any)?.fullname || 'Cư Dân Skyline';

  const [topics, setTopics] = useState<VotingTopic[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [selectedOptionId, setSelectedOptionId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'VOTED' | 'CLOSED'>('ALL');
  const [legalTypeFilter, setLegalTypeFilter] = useState<'ALL' | VotingLegalType>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [votedSuccessMsg, setVotedSuccessMsg] = useState<string | null>(null);

  // Admin Modal: Create New Voting Topic
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newLegalType, setNewLegalType] = useState<VotingLegalType>('Đóng góp Quỹ Bảo trì');
  const [newDeadline, setNewDeadline] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0] + 'T23:59:59';
  });
  const [newIsOwnerOnly, setNewIsOwnerOnly] = useState(true);
  const [newOptions, setNewOptions] = useState<string[]>([
    'Đồng ý thông qua phương án đề xuất',
    'Không đồng ý, giữ nguyên hiện trạng',
    'Ý kiến khác'
  ]);
  const [newSummaryReport, setNewSummaryReport] = useState('');

  const refreshTopics = () => {
    const list = getVotingTopics();
    setTopics(list);
    if (!selectedTopicId && list.length > 0) {
      setSelectedTopicId(list[0].id);
    }
  };

  useEffect(() => {
    refreshTopics();
    const handleUpdate = () => refreshTopics();
    window.addEventListener('skyline_voting_updated', handleUpdate);
    return () => window.removeEventListener('skyline_voting_updated', handleUpdate);
  }, []);

  // Currently selected topic
  const activeTopic = useMemo(() => {
    return topics.find(t => t.id === selectedTopicId) || topics[0];
  }, [topics, selectedTopicId]);

  // Check if current user / apartment has voted in active topic
  const userVotedRecord = useMemo(() => {
    if (!activeTopic) return null;
    return activeTopic.voters.find(v => v.aptCode.trim().toUpperCase() === aptCode.trim().toUpperCase());
  }, [activeTopic, aptCode]);

  useEffect(() => {
    if (userVotedRecord) {
      setSelectedOptionId(userVotedRecord.optionId);
    } else if (activeTopic && activeTopic.options.length > 0) {
      setSelectedOptionId(activeTopic.options[0].id);
    }
  }, [activeTopic, userVotedRecord]);

  // Filtered topics
  const filteredTopics = useMemo(() => {
    return topics.filter(t => {
      // Status filter
      if (statusFilter === 'OPEN' && t.status !== 'OPEN') return false;
      if (statusFilter === 'CLOSED' && t.status !== 'CLOSED') return false;
      if (statusFilter === 'VOTED') {
        const hasVoted = t.voters.some(v => v.aptCode.trim().toUpperCase() === aptCode.trim().toUpperCase());
        if (!hasVoted) return false;
      }

      // Legal type filter
      if (legalTypeFilter !== 'ALL' && t.legalType !== legalTypeFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return t.title.toLowerCase().includes(q) || t.code.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
      }

      return true;
    });
  }, [topics, statusFilter, legalTypeFilter, searchQuery, aptCode]);

  // KPI calculations
  const stats = useMemo(() => {
    const total = topics.length;
    const openCount = topics.filter(t => t.status === 'OPEN').length;
    const votedCount = topics.filter(t => t.voters.some(v => v.aptCode.trim().toUpperCase() === aptCode.trim().toUpperCase())).length;
    const avgParticipation = total > 0 
      ? (topics.reduce((acc, t) => acc + (t.totalVotes / (t.totalEligibleApartments || 250)), 0) / total * 100).toFixed(1)
      : '0.0';

    return { total, openCount, votedCount, avgParticipation };
  }, [topics, aptCode]);

  // Handle Voting Submission
  const handleSubmitVote = () => {
    if (!activeTopic || !selectedOptionId) return;

    const res = castVote({
      topicId: activeTopic.id,
      aptCode,
      optionId: selectedOptionId,
      voterName: userName,
    });

    if (res.success) {
      setVotedSuccessMsg(res.message);
      refreshTopics();
      setTimeout(() => setVotedSuccessMsg(null), 5000);
    } else {
      alert(res.message);
    }
  };

  // Admin Handle Create Topic
  const handleCreateTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      alert('Vui lòng nhập tiêu đề cuộc biểu quyết.');
      return;
    }

    const validOptions = newOptions.filter(o => o.trim().length > 0);
    if (validOptions.length < 2) {
      alert('Vui lòng cung cấp ít nhất 2 phương án bình chọn.');
      return;
    }

    const created = createVotingTopic({
      title: newTitle,
      description: newDescription,
      legalType: newLegalType,
      deadline: newDeadline,
      isOwnerOnly: newIsOwnerOnly,
      options: validOptions,
      summaryReport: newSummaryReport,
    });

    setIsCreateModalOpen(false);
    setNewTitle('');
    setNewDescription('');
    setNewSummaryReport('');
    refreshTopics();
    setSelectedTopicId(created.id);
  };

  // Admin Toggle Status
  const handleToggleStatus = (topicId: string) => {
    toggleVotingTopicStatus(topicId);
    refreshTopics();
  };

  return (
    <div className="space-y-6 w-full animate-fadeIn select-none">
      {/* ------------------------------------------------------------- */}
      {/* 1. HEADER CHÍNH                                               */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222B35] pb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-semibold flex items-center gap-1.5">
            <Vote className="w-3.5 h-3.5 text-[#C5A880]" /> Quyền Làm Chủ Cư Dân • Hội Nghị Nhà Chung Cư
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl text-white font-bold mt-1 tracking-wide">
            Ý Kiến Đóng Góp & Biểu Quyết Tòa Nhà
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Biểu quyết số minh bạch và bảo mật cho các quyết định bảo trì, nâng cấp cơ sở vật chất và quy chế sinh hoạt chung cư.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {isAdmin ? (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-colors shadow-lg flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Tạo Cuộc Biểu Quyết
            </button>
          ) : isOwner ? (
            <span className="px-3 py-1.5 bg-[#161B22] border border-[#C5A880] text-[#C5A880] text-xs font-semibold flex items-center gap-1.5 shadow">
              <ShieldCheck className="w-4 h-4 text-[#C5A880]" /> Chủ Hộ Hợp Pháp (Căn {aptCode})
            </span>
          ) : (
            <span className="px-3 py-1.5 bg-[#161B22] border border-[#2D3748] text-gray-300 text-xs font-semibold flex items-center gap-1.5 shadow">
              <Users className="w-4 h-4 text-gray-400" /> Cư Dân Căn Hộ {aptCode} (Xem Kết Quả)
            </span>
          )}
        </div>
      </div>

      {/* Thông báo biểu quyết thành công */}
      {votedSuccessMsg && (
        <div className="p-4 bg-emerald-950/90 border border-emerald-500 text-emerald-200 text-xs flex items-center gap-3 animate-fadeIn shadow-lg">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <div>
            <div className="font-bold uppercase tracking-wider text-emerald-300">Biểu Quyết Thành Công</div>
            <div className="text-[11px] mt-0.5">{votedSuccessMsg}</div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. THẺ CHỈ SỐ TỔNG QUAN                                        */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 bg-[#121820] border border-[#222B35] space-y-1">
          <div className="text-xs text-gray-400 font-medium">Tổng Số Cuộc Biểu Quyết</div>
          <div className="font-serif text-2xl font-bold text-white">{stats.total}</div>
          <div className="text-[10px] text-[#C5A880] font-mono">Toàn bộ chiến dịch tòa nhà</div>
        </div>

        <div className="p-4 bg-[#121820] border border-[#222B35] space-y-1">
          <div className="text-xs text-gray-400 font-medium">Đang Mở Bình Chọn</div>
          <div className="font-serif text-2xl font-bold text-emerald-400">{stats.openCount}</div>
          <div className="text-[10px] text-emerald-500/80 font-mono">Đang tiếp nhận phiếu bầu</div>
        </div>

        <div className="p-4 bg-[#121820] border border-[#222B35] space-y-1">
          <div className="text-xs text-gray-400 font-medium">Căn Hộ Đã Tham Gia</div>
          <div className="font-serif text-2xl font-bold text-[#C5A880]">{stats.votedCount} / {stats.total}</div>
          <div className="text-[10px] text-gray-400 font-mono">Lá phiếu của Căn {aptCode}</div>
        </div>

        <div className="p-4 bg-[#121820] border border-[#222B35] space-y-1">
          <div className="text-xs text-gray-400 font-medium">Tỷ Lệ Cử Tri Toàn Tòa Nhà</div>
          <div className="font-serif text-2xl font-bold text-cyan-400">{stats.avgParticipation}%</div>
          <div className="text-[10px] text-cyan-500/80 font-mono">250 căn hộ sở hữu hợp pháp</div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. BỘ LỌC & TÌM KIẾM BIỂU QUYẾT                                */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#121820] p-3 border border-[#222B35]">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1 md:pb-0">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 font-semibold transition-all border whitespace-nowrap ${
              statusFilter === 'ALL'
                ? 'bg-[#C5A880] text-[#0D1117] border-[#C5A880] font-bold'
                : 'bg-[#161B22] border-[#2D3748] text-gray-300 hover:text-white'
            }`}
          >
            Tất Cả ({topics.length})
          </button>

          <button
            onClick={() => setStatusFilter('OPEN')}
            className={`px-3 py-1.5 font-semibold transition-all border whitespace-nowrap ${
              statusFilter === 'OPEN'
                ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                : 'bg-[#161B22] border-[#2D3748] text-emerald-400 hover:border-emerald-400'
            }`}
          >
            Đang Diễn Ra ({topics.filter(t => t.status === 'OPEN').length})
          </button>

          <button
            onClick={() => setStatusFilter('VOTED')}
            className={`px-3 py-1.5 font-semibold transition-all border whitespace-nowrap ${
              statusFilter === 'VOTED'
                ? 'bg-[#C5A880] text-[#0D1117] border-[#C5A880] font-bold'
                : 'bg-[#161B22] border-[#2D3748] text-amber-400 hover:border-amber-400'
            }`}
          >
            Đã Biểu Quyết ({topics.filter(t => t.voters.some(v => v.aptCode.trim().toUpperCase() === aptCode.trim().toUpperCase())).length})
          </button>

          <button
            onClick={() => setStatusFilter('CLOSED')}
            className={`px-3 py-1.5 font-semibold transition-all border whitespace-nowrap ${
              statusFilter === 'CLOSED'
                ? 'bg-gray-700 text-white border-gray-600 font-bold'
                : 'bg-[#161B22] border-[#2D3748] text-gray-400 hover:text-white'
            }`}
          >
            Đã Kết Thúc ({topics.filter(t => t.status === 'CLOSED').length})
          </button>
        </div>

        {/* Search & Legal Category Filter */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <select
            value={legalTypeFilter}
            onChange={(e) => setLegalTypeFilter(e.target.value as any)}
            className="bg-[#161B22] border border-[#2D3748] text-gray-300 text-xs px-2.5 py-1.5 focus:outline-none focus:border-[#C5A880]"
          >
            <option value="ALL">Mọi Loại Biểu Quyết</option>
            <option value="Đóng góp Quỹ Bảo trì">Quỹ Bảo Trì</option>
            <option value="Quy Chế Chung Cư">Quy Chế Tòa Nhà</option>
            <option value="Bầu Ban Quản Trị">Bầu Ban Quản Trị</option>
            <option value="Ý kiến Cải tạo">Ý Kiến Cải Tạo</option>
            <option value="Tiện Ích & Dịch Vụ">Tiện Ích & Dịch Vụ</option>
          </select>

          <div className="relative w-full sm:w-56">
            <input
              type="text"
              placeholder="Tìm kiếm biểu quyết..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#161B22] border border-[#2D3748] text-white text-xs px-3 py-1.5 pr-8 focus:outline-none focus:border-[#C5A880]"
            />
            <Search className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. MASTER-DETAIL VIEW: DANH SÁCH & CHI TIẾT BIỂU QUYẾT         */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CỘT TRÁI: DANH SÁCH CÁC CUỘC BIỂU QUYẾT (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-400 font-semibold px-1">
            <span>Danh Sách Chiến Dịch ({filteredTopics.length})</span>
            <span className="text-[11px] font-mono text-[#C5A880]">Bấm để xem chi tiết</span>
          </div>

          {filteredTopics.length === 0 ? (
            <div className="p-8 text-center bg-[#121820] border border-[#222B35] text-xs text-gray-400">
              Không tìm thấy cuộc biểu quyết nào phù hợp với bộ lọc hiện tại.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
              {filteredTopics.map((topic) => {
                const isSelected = activeTopic?.id === topic.id;
                const hasVoted = topic.voters.some(v => v.aptCode.trim().toUpperCase() === aptCode.trim().toUpperCase());
                const voterRecord = topic.voters.find(v => v.aptCode.trim().toUpperCase() === aptCode.trim().toUpperCase());
                const votedOption = voterRecord ? topic.options.find(o => o.id === voterRecord.optionId) : null;
                const participationRate = ((topic.totalVotes / (topic.totalEligibleApartments || 250)) * 100).toFixed(1);

                return (
                  <div
                    key={topic.id}
                    onClick={() => setSelectedTopicId(topic.id)}
                    className={`p-4 border cursor-pointer transition-all space-y-2.5 relative ${
                      isSelected
                        ? 'bg-[#18212D] border-[#C5A880] shadow-xl'
                        : 'bg-[#121820] border-[#222B35] hover:border-[#2D3748] hover:bg-[#151D27]'
                    }`}
                  >
                    {/* Top Badges */}
                    <div className="flex items-center justify-between gap-2 text-[10px]">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 bg-[#0D1117] border border-[#C5A880]/50 text-[#C5A880] font-mono font-bold">
                          #{topic.code}
                        </span>
                        <span className="px-2 py-0.5 bg-[#161B22] border border-gray-700 text-gray-300 font-medium truncate max-w-[140px]">
                          {topic.legalType}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {topic.status === 'OPEN' ? (
                          <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-500 font-mono font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            Đang Mở
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-gray-800 text-gray-400 border border-gray-600 font-mono font-bold">
                            Đã Kết Thúc
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className={`text-sm font-bold line-clamp-2 transition-colors ${
                      isSelected ? 'text-white' : 'text-gray-200'
                    }`}>
                      {topic.title}
                    </h3>

                    {/* Voter status pill */}
                    {hasVoted ? (
                      <div className="p-2 bg-emerald-950/40 border border-emerald-500/40 text-[11px] text-emerald-300 flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1 truncate">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          <span className="truncate">Đã bầu: <strong>{votedOption?.text || 'Đã chọn'}</strong></span>
                        </span>
                        <span className="font-mono text-[10px] text-emerald-400 flex-shrink-0">Hợp lệ ✓</span>
                      </div>
                    ) : (
                      <div className="p-1.5 bg-amber-950/20 border border-amber-600/30 text-[11px] text-amber-300 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-amber-400" />
                          <span>Căn {aptCode} chưa gửi biểu quyết</span>
                        </span>
                        <span className="font-bold text-[10px] text-amber-400 uppercase">Chờ bầu →</span>
                      </div>
                    )}

                    {/* Progress Bar & Deadline */}
                    <div className="pt-1 border-t border-[#222B35] space-y-1 text-[10px] text-gray-400">
                      <div className="flex items-center justify-between">
                        <span>Tham gia: <strong>{topic.totalVotes} / {topic.totalEligibleApartments}</strong> căn ({participationRate}%)</span>
                        <span className="font-mono text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Hạn: {new Date(topic.deadline).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      <div className="w-full h-1 bg-[#0D1117] overflow-hidden">
                        <div 
                          className="h-full bg-[#C5A880] transition-all"
                          style={{ width: `${Math.min(100, parseFloat(participationRate))}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* CỘT PHẢI: CHI TIẾT BIỂU QUYẾT & LÁ PHIẾU BẦU (7 cols) */}
        <div className="lg:col-span-7">
          {activeTopic ? (
            <div className="bg-[#121820] border border-[#222B35] p-5 sm:p-6 space-y-6 shadow-2xl">
              {/* Topic Detail Header */}
              <div className="space-y-3 border-b border-[#222B35] pb-4">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-[#C5A880]/15 border border-[#C5A880]/50 text-[#C5A880] font-mono font-bold">
                      {activeTopic.code}
                    </span>
                    <span className="px-2.5 py-0.5 bg-[#161B22] border border-gray-700 text-gray-300 font-semibold">
                      {activeTopic.legalType}
                    </span>
                    {activeTopic.isOwnerOnly && (
                      <span className="px-2 py-0.5 bg-[#1F1924] border border-purple-500/50 text-purple-300 text-[10px] font-bold uppercase">
                        Chủ Hộ
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 text-xs font-mono font-bold ${
                      activeTopic.status === 'OPEN' 
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500' 
                        : 'bg-gray-800 text-gray-400 border border-gray-600'
                    }`}>
                      {activeTopic.status === 'OPEN' ? '● Đang Mở Tiếp Nhận' : 'Đã Khóa Sổ Biểu Quyết'}
                    </span>

                    {/* Admin Action to close/re-open */}
                    {isAdmin && (
                      <button
                        onClick={() => handleToggleStatus(activeTopic.id)}
                        className="px-2.5 py-0.5 bg-[#161B22] hover:bg-[#222B35] border border-gray-600 text-gray-300 text-[11px] font-mono transition-colors"
                      >
                        {activeTopic.status === 'OPEN' ? 'Đóng Biểu Quyết' : 'Mở Lại'}
                      </button>
                    )}
                  </div>
                </div>

                <h3 className="font-serif text-xl sm:text-2xl text-white font-bold leading-snug">
                  {activeTopic.title}
                </h3>

                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 font-mono">
                  <span>Khởi tạo: <strong className="text-gray-300">{activeTopic.createdBy}</strong></span>
                  <span>•</span>
                  <span>Hạn chót: <strong className="text-amber-400">{new Date(activeTopic.deadline).toLocaleDateString('vi-VN')}</strong></span>
                  <span>•</span>
                  <span>Tiến độ: <strong className="text-[#C5A880]">{activeTopic.totalVotes} / {activeTopic.totalEligibleApartments} phiếu</strong></span>
                </div>

                <p className="text-xs text-gray-300 leading-relaxed font-light pt-1">
                  {activeTopic.description}
                </p>

                {activeTopic.summaryReport && (
                  <div className="p-3 bg-[#161B22] border-l-2 border-[#C5A880] text-xs text-gray-300 space-y-1">
                    <div className="text-[10px] text-[#C5A880] font-bold uppercase tracking-wider flex items-center gap-1">
                      <FileText className="w-3 h-3" /> Căn Cứ & Báo Cáo Kỹ Thuật Đính Kèm:
                    </div>
                    <p className="text-gray-300 text-[11.5px] leading-relaxed">
                      {activeTopic.summaryReport}
                    </p>
                  </div>
                )}
              </div>

              {/* Voting Form / Options */}
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-semibold text-gray-300">
                  <span className="uppercase tracking-wider text-[#C5A880] flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5" /> Các Phương Án Bình Chọn:
                  </span>
                  <span className="text-gray-400 text-[11px]">
                    {userVotedRecord ? '✓ Bạn đã bỏ phiếu cho cuộc này' : 'Chưa có phiếu từ căn hộ của bạn'}
                  </span>
                </div>

                {/* Options List */}
                <div className="space-y-3">
                  {activeTopic.options.map((option) => {
                    const isSelected = selectedOptionId === option.id;
                    const isUserChoice = userVotedRecord?.optionId === option.id;
                    const percentage = activeTopic.totalVotes > 0
                      ? ((option.votes / activeTopic.totalVotes) * 100).toFixed(1)
                      : '0.0';

                    const canVote = (isOwner || isAdmin) && activeTopic.status === 'OPEN';

                    return (
                      <div
                        key={option.id}
                        onClick={() => {
                          if (canVote) setSelectedOptionId(option.id);
                        }}
                        className={`p-4 border transition-all space-y-2.5 ${
                          canVote ? 'cursor-pointer' : 'cursor-default'
                        } ${
                          isSelected
                            ? 'bg-[#1A2330] border-[#C5A880] shadow-md'
                            : 'bg-[#161B22]/70 border-[#222B35] hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2.5">
                            {canVote && (
                              <span className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
                                isSelected ? 'border-[#C5A880] bg-[#C5A880]' : 'border-gray-500'
                              }`}>
                                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#0D1117]"></span>}
                              </span>
                            )}
                            <span className="font-medium text-white text-[12.5px] leading-snug">
                              {option.text}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            {isUserChoice && (
                              <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-500 text-[10px] font-bold font-mono">
                                Lựa Chọn Của Bạn ✓
                              </span>
                            )}
                            <span className="font-mono font-bold text-sm text-[#C5A880]">
                              {percentage}%
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono">
                              ({option.votes} phiếu)
                            </span>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full h-2 bg-[#0D1117] overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              isUserChoice ? 'bg-emerald-500' : isSelected ? 'bg-[#C5A880]' : 'bg-gray-600'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Footer */}
              <div className="pt-2 border-t border-[#222B35] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  {userVotedRecord ? (
                    <div className="text-xs text-gray-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>
                        Căn <strong className="text-white font-mono">{aptCode}</strong> đã ghi nhận phiếu lúc{' '}
                        <span className="font-mono text-[#C5A880]">
                          {new Date(userVotedRecord.votedAt).toLocaleString('vi-VN')}
                        </span>
                      </span>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400">
                      Mỗi căn hộ tương ứng với 01 lá phiếu hợp lệ có tính pháp lý theo Luật Nhà Ở.
                    </div>
                  )}
                </div>

                {/* Submit / Update Button */}
                {activeTopic.status === 'OPEN' && (isOwner || isAdmin) ? (
                  <button
                    onClick={handleSubmitVote}
                    className="px-6 py-2.5 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-colors shadow-lg flex items-center justify-center gap-1.5"
                  >
                    <Vote className="w-4 h-4" />
                    {userVotedRecord ? 'Cập Nhật Lại Phiếu' : 'Xác Nhận Biểu Quyết'}
                  </button>
                ) : activeTopic.status === 'CLOSED' ? (
                  <div className="px-4 py-2 bg-[#161B22] border border-gray-700 text-gray-400 text-xs font-mono">
                    Cuộc biểu quyết đã kết thúc
                  </div>
                ) : (
                  <div className="text-xs text-amber-400 italic">
                    * Chỉ Chủ hộ (Owner) được cấp quyền biểu quyết cho căn {aptCode}
                  </div>
                )}
              </div>

              {/* Admin Audit Log: Danh sách căn hộ đã bỏ phiếu */}
              {isAdmin && activeTopic.voters.length > 0 && (
                <div className="pt-4 border-t border-[#222B35] space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#C5A880] flex items-center justify-between">
                    <span>Nhật Ký Kiểm Toán Phiếu Bầu Thực Tế ({activeTopic.voters.length} căn):</span>
                    <span className="text-[10px] text-gray-400 font-normal">Minh bạch 100% không dữ liệu ảo</span>
                  </div>

                  <div className="max-h-40 overflow-y-auto border border-[#222B35] divide-y divide-[#222B35] text-xs">
                    {activeTopic.voters.map((voter, idx) => {
                      const opt = activeTopic.options.find(o => o.id === voter.optionId);
                      return (
                        <div key={idx} className="p-2.5 flex items-center justify-between bg-[#161B22]/50 hover:bg-[#161B22]">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-white px-1.5 py-0.5 bg-[#0D1117] border border-[#2D3748]">
                              {voter.aptCode}
                            </span>
                            <span className="text-gray-300">{voter.voterName}</span>
                          </div>

                          <div className="flex items-center gap-3 font-mono text-[11px]">
                            <span className="text-[#C5A880] truncate max-w-[200px]" title={opt?.text}>
                              {opt?.text}
                            </span>
                            <span className="text-gray-400">
                              {new Date(voter.votedAt).toLocaleString('vi-VN')}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center bg-[#121820] border border-[#222B35] text-gray-400 text-xs">
              Vui lòng chọn một cuộc biểu quyết bên danh sách để xem chi tiết.
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 5. MODAL TẠO CUỘC BIỂU QUYẾT MỚI (CHO ADMIN)                  */}
      {/* ------------------------------------------------------------- */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121820] border border-[#C5A880] max-w-2xl w-full p-6 space-y-5 shadow-2xl animate-scaleUp max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#222B35] pb-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-[#C5A880] font-bold flex items-center gap-1.5">
                  <Vote className="w-3.5 h-3.5 text-[#C5A880]" /> Ban Quản Trị • Khởi Tạo Biểu Quyết
                </div>
                <h3 className="font-serif text-xl font-bold text-white mt-0.5">
                  Khởi Tạo Cuộc Biểu Quyết Toàn Tòa Nhà
                </h3>
              </div>

              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTopic} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-gray-300 font-semibold block">Tiêu Đề Cuộc Biểu Quyết:</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ví dụ: Biểu quyết Thông qua Dự toán Bảo trì Định kỳ Hệ thống Thang máy năm 2026..."
                  className="w-full p-2.5 bg-[#0D1117] border border-[#2D3748] text-white focus:outline-none focus:border-[#C5A880] text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-gray-300 font-semibold block">Loại Hình Pháp Lý:</label>
                  <select
                    value={newLegalType}
                    onChange={(e) => setNewLegalType(e.target.value as any)}
                    className="w-full p-2.5 bg-[#0D1117] border border-[#2D3748] text-white focus:outline-none focus:border-[#C5A880] text-xs"
                  >
                    <option value="Đóng góp Quỹ Bảo trì">Đóng góp Quỹ Bảo trì</option>
                    <option value="Quy Chế Chung Cư">Quy Chế Chung Cư</option>
                    <option value="Bầu Ban Quản Trị">Bầu Ban Quản Trị</option>
                    <option value="Ý kiến Cải tạo">Ý kiến Cải tạo</option>
                    <option value="Tiện Ích & Dịch Vụ">Tiện Ích & Dịch Vụ</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-gray-300 font-semibold block">Hạn Chót Biểu Quyết:</label>
                  <input
                    type="datetime-local"
                    required
                    value={newDeadline.slice(0, 16)}
                    onChange={(e) => setNewDeadline(e.target.value + ':00')}
                    className="w-full p-2 bg-[#0D1117] border border-[#2D3748] text-white focus:outline-none focus:border-[#C5A880] font-mono text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-gray-300 font-semibold block">Nội Dung & Căn Cứ Đề Xuất:</label>
                <textarea
                  rows={3}
                  required
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Mô tả bối cảnh, lý do cần lấy ý kiến biểu quyết và phạm vi tác động đến cư dân..."
                  className="w-full p-2.5 bg-[#0D1117] border border-[#2D3748] text-white focus:outline-none focus:border-[#C5A880] text-xs resize-none"
                />
              </div>

              {/* Options Builder */}
              <div className="space-y-2 pt-2 border-t border-[#222B35]">
                <div className="flex items-center justify-between">
                  <label className="text-gray-300 font-semibold">Các Phương Án Bình Chọn ({newOptions.length}):</label>
                  <button
                    type="button"
                    onClick={() => setNewOptions([...newOptions, `Phương án ${newOptions.length + 1}`])}
                    className="text-[11px] text-[#C5A880] hover:underline font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Thêm Phương Án
                  </button>
                </div>

                <div className="space-y-2">
                  {newOptions.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="font-mono text-gray-500 w-6 text-right text-xs">{idx + 1}.</span>
                      <input
                        type="text"
                        required
                        value={opt}
                        onChange={(e) => {
                          const updated = [...newOptions];
                          updated[idx] = e.target.value;
                          setNewOptions(updated);
                        }}
                        className="flex-1 p-2 bg-[#0D1117] border border-[#2D3748] text-white focus:outline-none focus:border-[#C5A880] text-xs"
                      />
                      {newOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => setNewOptions(newOptions.filter((_, i) => i !== idx))}
                          className="p-2 text-red-400 hover:text-red-300 border border-red-900/50"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-gray-300 font-semibold block">Tóm Tắt Báo Cáo Kỹ Thuật / Tài Chính (Tùy chọn):</label>
                <textarea
                  rows={2}
                  value={newSummaryReport}
                  onChange={(e) => setNewSummaryReport(e.target.value)}
                  placeholder="Ghi chú về dự toán kinh phí, thông số kỹ thuật, hồ sơ báo giá cạnh tranh..."
                  className="w-full p-2 bg-[#0D1117] border border-[#2D3748] text-white focus:outline-none focus:border-[#C5A880] text-xs resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#222B35]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-gray-700 text-gray-300 text-xs hover:border-gray-500"
                >
                  Hủy Bỏ
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-colors shadow-lg flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" /> Phát Hành Biểu Quyết
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
