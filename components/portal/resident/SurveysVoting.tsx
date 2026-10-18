'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  MessageSquareQuote,
  Vote, 
  CheckCircle2, 
  ShieldCheck, 
  Lock, 
  Clock, 
  Users, 
  Building, 
  Sparkles, 
  Filter, 
  Search, 
  Plus, 
  ChevronRight, 
  BarChart3, 
  X, 
  Check, 
  AlertTriangle, 
  Info,
  Send,
  Heart,
  MessageSquare,
  Share2,
  Trash2,
  Pin,
  ShoppingBag,
  Megaphone,
  HelpCircle,
  ThumbsUp,
  Flame,
  Tag
} from 'lucide-react';
import { User } from '@/lib/dataStore';
import { 
  CommunityPost, 
  PostCategory, 
  getCommunityPosts, 
  createCommunityPost, 
  toggleLikeCommunityPost, 
  addCommentToPost, 
  castCommunityPollVote, 
  deleteCommunityPost,
  analyzePostWithAi
} from '@/lib/communityStore';

interface SurveysVotingProps {
  currentUser?: User;
}

export default function SurveysVoting({ currentUser }: SurveysVotingProps) {
  const isAdmin = currentUser?.role === 'ADMIN';
  const isOwner = currentUser?.role === 'OWNER';
  const aptCode = currentUser?.apartment_code || (isAdmin ? 'BQL_OFFICE' : 'CH-06');
  const userName = currentUser?.full_name || (currentUser as any)?.fullname || 'Cư Dân SKYLINE';
  const userAvatar = currentUser?.avatar_url || 'https://data.nks.vn/storage/users/default.png';

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | PostCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyPinned, setOnlyPinned] = useState(false);
  const [onlyVoted, setOnlyVoted] = useState(false);

  // Expanded comment sections map: postId -> boolean
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  // Comment draft input map: postId -> string
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

  // Notification message
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modal: Create Post
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createCategory, setCreateCategory] = useState<PostCategory>(isAdmin ? 'ANNOUNCEMENT' : 'DISCUSSION');
  const [createTitle, setCreateTitle] = useState('');
  const [createContent, setCreateContent] = useState('');
  const [createTags, setCreateTags] = useState('');
  const [createIsPinned, setCreateIsPinned] = useState(false);
  
  // Modal: Attach Poll
  const [attachPoll, setAttachPoll] = useState(false);
  const [pollDeadline, setPollDeadline] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0] + 'T23:59:59';
  });
  const [pollIsOwnerOnly, setPollIsOwnerOnly] = useState(true);
  const [pollOptions, setPollOptions] = useState<string[]>([
    'Đồng ý thông qua phương án',
    'Không đồng ý, giữ nguyên hiện trạng',
    'Ý kiến khác'
  ]);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4500);
  };

  const loadPosts = () => {
    setPosts(getCommunityPosts());
  };

  useEffect(() => {
    loadPosts();
    const handleUpdate = () => loadPosts();
    window.addEventListener('skyline_community_updated', handleUpdate);
    return () => window.removeEventListener('skyline_community_updated', handleUpdate);
  }, []);

  // Filtered posts
  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      if (selectedCategory !== 'ALL' && post.category !== selectedCategory) return false;
      if (onlyPinned && !post.isPinned) return false;
      if (onlyVoted && (!post.poll || !post.poll.voters.some(v => v.aptCode.toUpperCase() === aptCode.toUpperCase()))) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = post.title.toLowerCase().includes(q);
        const matchesContent = post.content.toLowerCase().includes(q);
        const matchesAuthor = post.authorName.toLowerCase().includes(q);
        const matchesApt = (post.aptCode || '').toLowerCase().includes(q);
        const matchesTags = post.tags.some(t => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesContent && !matchesAuthor && !matchesApt && !matchesTags) return false;
      }
      return true;
    });
  }, [posts, selectedCategory, onlyPinned, onlyVoted, searchQuery, aptCode]);

  // Statistics
  const stats = useMemo(() => {
    const totalPosts = posts.length;
    const activePolls = posts.filter(p => p.poll && p.poll.status === 'OPEN').length;
    const totalComments = posts.reduce((acc, p) => acc + p.comments.length, 0);
    const positiveCount = posts.filter(p => p.aiSentimentLabel === 'Tích cực').length;
    const positiveRate = totalPosts > 0 ? Math.round((positiveCount / totalPosts) * 100) : 95;
    return { totalPosts, activePolls, totalComments, positiveRate };
  }, [posts]);

  // Handle Like
  const handleLike = (postId: string) => {
    toggleLikeCommunityPost(postId, aptCode);
  };

  // Handle Comment Submit
  const handleCommentSubmit = (postId: string) => {
    const content = (commentDrafts[postId] || '').trim();
    if (!content) return;

    addCommentToPost(postId, {
      authorName: userName,
      authorRole: currentUser?.role || 'OWNER',
      aptCode,
      avatarUrl: userAvatar,
      content,
    });

    setCommentDrafts(prev => ({ ...prev, [postId]: '' }));
    setExpandedComments(prev => ({ ...prev, [postId]: true }));
    showToast('Đã gửi bình luận của bạn thành công!');
  };

  // Handle Vote in Poll
  const handleVote = (postId: string, optionId: string) => {
    const res = castCommunityPollVote({
      postId,
      optionId,
      aptCode,
      voterName: userName,
      isOwner,
    });

    if (res.success) {
      showToast(res.message, 'success');
    } else {
      showToast(res.message, 'error');
    }
  };

  // Handle Delete Post
  const handleDeletePost = (postId: string, authorApt?: string) => {
    if (!isAdmin && authorApt?.toUpperCase() !== aptCode.toUpperCase()) {
      showToast('Bạn chỉ có thể xóa bài viết do chính bạn đăng.', 'error');
      return;
    }
    if (confirm('Bạn có chắc chắn muốn gỡ bài viết này khỏi diễn đàn chung cư?')) {
      deleteCommunityPost(postId);
      showToast('Đã gỡ bài viết thành công.');
    }
  };

  // Handle Create Post
  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createTitle.trim()) {
      showToast('Vui lòng nhập tiêu đề bài viết.', 'error');
      return;
    }
    if (!createContent.trim()) {
      showToast('Vui lòng nhập nội dung chia sẻ.', 'error');
      return;
    }

    const tagsArray = createTags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    let pollData = undefined;
    if (attachPoll || createCategory === 'VOTING') {
      const validOptions = pollOptions.filter(o => o.trim().length > 0);
      if (validOptions.length < 2) {
        showToast('Cuộc biểu quyết cần ít nhất 2 phương án bình chọn.', 'error');
        return;
      }
      pollData = {
        deadline: pollDeadline,
        isOwnerOnly: isAdmin ? pollIsOwnerOnly : false,
        status: 'OPEN' as const,
        totalEligibleApartments: 250,
        options: validOptions.map((opt, idx) => ({
          id: `opt-${idx + 1}`,
          text: opt,
          votes: 0,
        })),
        voters: [],
      };
    }

    createCommunityPost({
      category: createCategory,
      code: createCategory === 'VOTING' ? `BQ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}` : undefined,
      authorName: userName,
      authorRole: currentUser?.role || 'OWNER',
      aptCode,
      avatarUrl: userAvatar,
      title: createTitle.trim(),
      content: createContent.trim(),
      tags: tagsArray.length > 0 ? tagsArray : ['Cộng đồng', 'Skyline'],
      isPinned: isAdmin && createIsPinned,
      poll: pollData,
    });

    setIsCreateModalOpen(false);
    setCreateTitle('');
    setCreateContent('');
    setCreateTags('');
    setAttachPoll(false);
    showToast('Bài viết đã được đăng lên Diễn đàn Cư Dân SKYLINE!');
  };

  // Preview AI analysis in real-time
  const liveAiPreview = useMemo(() => {
    if (!createTitle && !createContent) return null;
    return analyzePostWithAi(`${createTitle} ${createContent}`);
  }, [createTitle, createContent]);

  return (
    <div className="space-y-6 select-none animate-fadeIn pb-16">
      {/* Toast Notification */}
      {toastMsg && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 border shadow-2xl backdrop-blur-xl animate-slideDown ${
          toastMsg.type === 'success' 
            ? 'bg-[#10B981]/20 border-[#10B981] text-[#10B981]' 
            : 'bg-[#F43F5E]/20 border-[#F43F5E] text-[#F43F5E]'
        }`}>
          {toastMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
          <span className="text-xs font-semibold tracking-wide">{toastMsg.text}</span>
        </div>
      )}

      {/* TOP HEADER: BRAND HERO */}
      <div className="relative border border-[#C5A880]/30 bg-gradient-to-r from-[#0E131B] via-[#141B24] to-[#0E131B] p-6 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#C5A880]/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#C5A880]/15 border border-[#C5A880]/40 text-[#C5A880] text-[10px] uppercase tracking-widest font-mono">
              <Sparkles className="w-3 h-3" />
              <span>Cộng Đồng Cư Dân 5 Sao • The Tropical Beverly Solari</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-serif font-bold text-white tracking-wide">
              Diễn Đàn & Biểu Quyết Cư Dân SKYLINE
            </h1>
            <p className="text-xs text-gray-400 max-w-2xl leading-relaxed">
              Không gian tương tác trực tuyến 24/7: Thảo luận nội bộ, thông báo chính thức từ Ban Quản Lý, rao vặt đồ cũ và tham gia biểu quyết các vấn đề pháp lý của tòa nhà.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-5 py-3 bg-[#C5A880] hover:bg-white text-[#0A0E14] font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-[#C5A880]/30 transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Đăng Bài / Tạo Thăm Dò</span>
            </button>
          </div>
        </div>

        {/* METRICS KPI BAR */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-[#C5A880]/20">
          <div className="p-3 bg-[#0A0E14]/80 border border-[#C5A880]/20 flex items-center gap-3">
            <div className="w-9 h-9 bg-[#C5A880]/10 border border-[#C5A880]/30 flex items-center justify-center text-[#C5A880]">
              <MessageSquareQuote className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wider">Tổng Bài Viết</div>
              <div className="text-lg font-serif font-bold text-white font-mono">{stats.totalPosts}</div>
            </div>
          </div>

          <div className="p-3 bg-[#0A0E14]/80 border border-[#C5A880]/20 flex items-center gap-3">
            <div className="w-9 h-9 bg-[#10B981]/10 border border-[#10B981]/30 flex items-center justify-center text-[#10B981]">
              <Vote className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wider">Biểu Quyết Đang Mở</div>
              <div className="text-lg font-serif font-bold text-[#10B981] font-mono">{stats.activePolls}</div>
            </div>
          </div>

          <div className="p-3 bg-[#0A0E14]/80 border border-[#C5A880]/20 flex items-center gap-3">
            <div className="w-9 h-9 bg-[#F59E0B]/10 border border-[#F59E0B]/30 flex items-center justify-center text-[#F59E0B]">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wider">Lượt Thảo Luận</div>
              <div className="text-lg font-serif font-bold text-white font-mono">{stats.totalComments}</div>
            </div>
          </div>

          <div className="p-3 bg-[#0A0E14]/80 border border-[#C5A880]/20 flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wider">AI Cảm Xúc Tích Cực</div>
              <div className="text-lg font-serif font-bold text-emerald-400 font-mono">{stats.positiveRate}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER TABS & TOOLBAR */}
      <div className="p-4 bg-[#0E131B] border border-[#C5A880]/30 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'ALL', label: 'Tất Cả Bài Viết', icon: MessageSquareQuote },
              { id: 'VOTING', label: 'Biểu Quyết & Poll', icon: Vote },
              { id: 'ANNOUNCEMENT', label: 'Thông Báo BQL', icon: Megaphone },
              { id: 'MARKETPLACE', label: 'Rao Vặt & Đồ Cũ', icon: ShoppingBag },
              { id: 'DISCUSSION', label: 'Thảo Luận Cư Dân', icon: Users },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = selectedCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id as any)}
                  className={`px-3.5 py-2 text-xs uppercase tracking-wider font-semibold transition-all duration-200 flex items-center gap-2 ${
                    isActive
                      ? 'bg-[#C5A880] text-[#0A0E14] shadow-md font-bold'
                      : 'bg-[#141B24] text-gray-300 hover:text-white hover:bg-[#1C2633] border border-white/5'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[260px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm bài viết, tiêu đề, mã căn..."
              className="w-full bg-[#141B24] border border-[#C5A880]/30 text-white pl-9 pr-3 py-2 text-xs placeholder-gray-500 focus:outline-none focus:border-[#C5A880]"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Secondary Toggles */}
        <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-white/5 text-xs text-gray-400">
          <label className="flex items-center gap-2 cursor-pointer hover:text-white">
            <input
              type="checkbox"
              checked={onlyPinned}
              onChange={e => setOnlyPinned(e.target.checked)}
              className="accent-[#C5A880] rounded-none"
            />
            <span>Chỉ xem Thông báo Ghim quan trọng</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer hover:text-white">
            <input
              type="checkbox"
              checked={onlyVoted}
              onChange={e => setOnlyVoted(e.target.checked)}
              className="accent-[#C5A880] rounded-none"
            />
            <span>Bài viết có Biểu quyết căn hộ đã tham gia</span>
          </label>
        </div>
      </div>

      {/* FEED LIST */}
      <div className="space-y-5">
        {filteredPosts.length === 0 ? (
          <div className="p-12 text-center bg-[#0E131B] border border-[#C5A880]/20 space-y-3">
            <HelpCircle className="w-10 h-10 text-gray-500 mx-auto" />
            <div className="text-sm font-semibold text-gray-300">Không tìm thấy bài viết nào phù hợp</div>
            <p className="text-xs text-gray-500">Hãy thử đổi bộ lọc hoặc bấm Đăng bài để chia sẻ câu chuyện đầu tiên với cư dân.</p>
          </div>
        ) : (
          filteredPosts.map(post => {
            const hasLiked = post.likes.some(c => c.toUpperCase() === aptCode.toUpperCase());
            const isCommentsOpen = !!expandedComments[post.id];
            const isBql = post.authorRole === 'ADMIN' || post.authorRole === 'STAFF';

            // Poll calculations
            const userVote = post.poll?.voters.find(v => v.aptCode.toUpperCase() === aptCode.toUpperCase());
            const totalPollVotes = post.poll ? post.poll.options.reduce((acc, o) => acc + o.votes, 0) : 0;
            const eligibleCount = post.poll?.totalEligibleApartments || 250;
            const participationRate = post.poll ? Math.round((totalPollVotes / eligibleCount) * 100) : 0;

            return (
              <article
                key={post.id}
                className={`bg-[#0E131B] border transition-all duration-200 ${
                  post.isPinned
                    ? 'border-[#C5A880] shadow-[0_4px_20px_rgba(197,168,128,0.12)]'
                    : 'border-[#222B35] hover:border-[#C5A880]/50'
                }`}
              >
                {/* POST HEADER */}
                <div className="p-5 border-b border-[#1A222D] flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={post.avatarUrl || 'https://data.nks.vn/storage/users/default.png'}
                      alt={post.authorName}
                      onError={e => { e.currentTarget.src = 'https://data.nks.vn/storage/users/default.png'; }}
                      className="w-10 h-10 object-cover border border-[#C5A880]/50 rounded-none flex-shrink-0"
                    />

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-white tracking-wide">{post.authorName}</span>
                        {isBql ? (
                          <span className="px-2 py-0.5 bg-[#C5A880] text-[#0A0E14] text-[9px] font-bold uppercase tracking-wider">
                            Ban Quản Lý
                          </span>
                        ) : post.authorRole === 'OWNER' ? (
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9px] font-semibold uppercase tracking-wider">
                            Chủ Hộ ({post.aptCode || 'CH-06'})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-gray-700/40 text-gray-300 border border-gray-600 text-[9px] font-semibold uppercase tracking-wider">
                            Cư Dân ({post.aptCode || 'Căn Hộ'})
                          </span>
                        )}

                        {post.isPinned && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-[#C5A880] font-bold uppercase tracking-wider">
                            <Pin className="w-3 h-3 fill-[#C5A880]" />
                            Ghim Quan Trọng
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-gray-500 flex items-center gap-2 mt-0.5 font-mono">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(post.createdAt).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                        {post.code && <span>• Mã: <strong className="text-[#C5A880]">{post.code}</strong></span>}
                      </div>
                    </div>
                  </div>

                  {/* AI MODERATION & SENTIMENT PILL */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 bg-[#141B24] border border-[#10B981]/40 text-[#10B981] text-[10px] font-mono flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      AI: Đã Duyệt
                    </span>

                    <span className={`px-2 py-0.5 text-[10px] font-mono border ${
                      post.aiSentimentLabel === 'Tích cực' 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                        : post.aiSentimentLabel === 'Góp ý'
                        ? 'bg-[#C5A880]/10 text-[#C5A880] border-[#C5A880]/30'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    }`}>
                      {post.aiSentimentLabel === 'Tích cực' ? '🌱 ' : post.aiSentimentLabel === 'Góp ý' ? '💡 ' : '⚠️ '}
                      Cảm xúc: {post.aiSentimentLabel} ({post.aiSentiment > 0 ? `+${post.aiSentiment.toFixed(2)}` : post.aiSentiment.toFixed(2)})
                    </span>

                    {/* Delete post button (Admin or Author) */}
                    {(isAdmin || post.aptCode?.toUpperCase() === aptCode.toUpperCase()) && (
                      <button
                        onClick={() => handleDeletePost(post.id, post.aptCode)}
                        className="p-1.5 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors ml-1"
                        title="Gỡ bài viết này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* POST BODY */}
                <div className="p-5 space-y-4">
                  <div className="space-y-2">
                    <h2 className="text-lg font-serif font-bold text-white tracking-wide">
                      {post.title}
                    </h2>
                    <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-line">
                      {post.content}
                    </p>
                  </div>

                  {/* POST TAGS */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {post.tags.map(tag => (
                        <span 
                          key={tag}
                          className="px-2 py-0.5 bg-[#141B24] border border-[#C5A880]/20 text-gray-400 text-[10px] flex items-center gap-1 font-mono"
                        >
                          <Tag className="w-2.5 h-2.5 text-[#C5A880]" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* INTERACTIVE POLL / VOTING SECTION */}
                  {post.poll && (
                    <div className="mt-4 p-4 bg-[#141B24] border border-[#C5A880]/30 space-y-4">
                      {/* Poll Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/5">
                        <div className="flex items-center gap-2">
                          <Vote className="w-4 h-4 text-[#C5A880]" />
                          <span className="text-xs font-bold uppercase tracking-wider text-white">
                            Cuộc Thăm Dò & Biểu Quyết Tòa Nhà
                          </span>
                          {post.poll.isOwnerOnly ? (
                            <span className="px-2 py-0.5 bg-amber-500/15 border border-amber-500/40 text-amber-400 text-[9px] font-semibold uppercase tracking-wider">
                              Chủ Hộ (Owner Only)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-blue-500/15 border border-blue-500/40 text-blue-400 text-[9px] font-semibold uppercase tracking-wider">
                              Toàn Thể Cư Dân
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-gray-400 font-mono flex items-center gap-2">
                          <span>Đã biểu quyết: <strong className="text-white">{totalPollVotes}</strong>/{eligibleCount} căn ({participationRate}%)</span>
                          <span>• Hạn: {new Date(post.poll.deadline).toLocaleDateString('vi-VN')}</span>
                        </div>
                      </div>

                      {/* Notice if user cannot vote */}
                      {post.poll.isOwnerOnly && !isOwner && !isAdmin && (
                        <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] flex items-center gap-2">
                          <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>Quyền hạn: Cuộc biểu quyết pháp lý này yêu cầu tài khoản <strong>Chủ Hộ</strong>. Bạn đang xem với quyền tham khảo.</span>
                        </div>
                      )}

                      {/* Options List */}
                      <div className="space-y-2.5 pt-1">
                        {post.poll.options.map(option => {
                          const isUserSelected = userVote?.optionId === option.id;
                          const percentage = totalPollVotes > 0 ? Math.round((option.votes / totalPollVotes) * 100) : 0;
                          const canVote = !post.poll?.isOwnerOnly || isOwner;

                          return (
                            <div
                              key={option.id}
                              onClick={() => canVote && handleVote(post.id, option.id)}
                              className={`relative p-3 border transition-all duration-200 select-none ${
                                canVote ? 'cursor-pointer hover:border-[#C5A880]' : 'cursor-default'
                              } ${
                                isUserSelected
                                  ? 'bg-[#10B981]/10 border-[#10B981]'
                                  : 'bg-[#0E131B] border-[#222B35]'
                              }`}
                            >
                              {/* Background percentage progress bar */}
                              <div
                                className={`absolute left-0 top-0 bottom-0 transition-all duration-500 ${
                                  isUserSelected ? 'bg-[#10B981]/15' : 'bg-[#C5A880]/10'
                                }`}
                                style={{ width: `${percentage}%` }}
                              />

                              {/* Foreground content */}
                              <div className="relative z-10 flex items-center justify-between gap-3 text-xs">
                                <div className="flex items-center gap-2.5">
                                  <div className={`w-4 h-4 border flex items-center justify-center flex-shrink-0 ${
                                    isUserSelected 
                                      ? 'border-[#10B981] bg-[#10B981] text-[#0A0E14]' 
                                      : 'border-gray-500 bg-[#16202D]'
                                  }`}>
                                    {isUserSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                  </div>
                                  <span className={`font-medium ${isUserSelected ? 'text-[#10B981] font-bold' : 'text-gray-200'}`}>
                                    {option.text}
                                  </span>
                                </div>

                                <div className="flex items-center gap-3 font-mono flex-shrink-0 text-[11px]">
                                  <span className="text-gray-400">{option.votes} phiếu</span>
                                  <span className={`font-bold ${isUserSelected ? 'text-[#10B981]' : 'text-[#C5A880]'}`}>
                                    {percentage}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* User voted status footer */}
                      {userVote && (
                        <div className="text-[11px] text-[#10B981] flex items-center justify-between pt-1 font-mono">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Căn hộ {aptCode} đã bỏ phiếu thành công (bấm phương án khác để đổi ý kiến).
                          </span>
                          <span className="text-gray-500">
                            Lúc: {new Date(userVote.votedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* POST FOOTER: ACTIONS */}
                <div className="px-5 py-3 bg-[#0A0E14] border-t border-[#1A222D] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4">
                    {/* Like button */}
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 transition-all duration-150 ${
                        hasLiked 
                          ? 'text-[#F43F5E] bg-[#F43F5E]/10 border border-[#F43F5E]/30 font-bold' 
                          : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${hasLiked ? 'fill-[#F43F5E]' : ''}`} />
                      <span>{post.likes.length}</span>
                      <span className="hidden sm:inline">{hasLiked ? 'Đã Thích' : 'Thích'}</span>
                    </button>

                    {/* Comment button */}
                    <button
                      onClick={() => setExpandedComments(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{post.comments.length}</span>
                      <span className="hidden sm:inline">Thảo luận</span>
                    </button>
                  </div>

                  <div className="text-[11px] text-gray-500 font-mono">
                    Khu Dân Cư The Tropical BS-07 - BS-10
                  </div>
                </div>

                {/* EXPANDABLE COMMENTS SECTION */}
                {isCommentsOpen && (
                  <div className="p-5 bg-[#0C1017] border-t border-[#1A222D] space-y-4 animate-fadeIn">
                    <div className="text-xs font-serif font-bold text-[#C5A880] uppercase tracking-wider flex items-center gap-2">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Bình luận & Ý kiến trao đổi ({post.comments.length})</span>
                    </div>

                    {/* Comments list */}
                    {post.comments.length === 0 ? (
                      <p className="text-xs text-gray-500 italic py-2">
                        Chưa có bình luận nào. Hãy là người đầu tiên trao đổi với cư dân căn hộ này!
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {post.comments.map(cmt => {
                          const isCmtBql = cmt.authorRole === 'ADMIN' || cmt.authorRole === 'STAFF';
                          return (
                            <div key={cmt.id} className="p-3 bg-[#121820] border border-[#222B35] space-y-1.5">
                              <div className="flex items-center justify-between text-[11px]">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-white">{cmt.authorName}</span>
                                  {isCmtBql ? (
                                    <span className="px-1.5 py-0.2 bg-[#C5A880] text-[#0A0E14] text-[8px] font-bold uppercase">BQL</span>
                                  ) : (
                                    <span className="text-gray-400 font-mono">({cmt.aptCode || 'Căn Hộ'})</span>
                                  )}
                                </div>
                                <span className="text-gray-500 font-mono text-[10px]">
                                  {new Date(cmt.createdAt).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-xs text-gray-300 leading-relaxed">
                                {cmt.content}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* New comment input */}
                    <div className="flex gap-2 pt-2">
                      <input
                        type="text"
                        value={commentDrafts[post.id] || ''}
                        onChange={e => setCommentDrafts({ ...commentDrafts, [post.id]: e.target.value })}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleCommentSubmit(post.id);
                          }
                        }}
                        placeholder={`Viết phản hồi với tư cách ${userName} (${aptCode})...`}
                        className="flex-1 bg-[#141B24] border border-[#C5A880]/30 text-white px-3 py-2 text-xs placeholder-gray-500 focus:outline-none focus:border-[#C5A880]"
                      />
                      <button
                        onClick={() => handleCommentSubmit(post.id)}
                        className="px-4 py-2 bg-[#C5A880] hover:bg-white text-[#0A0E14] font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Gửi</span>
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>

      {/* CREATE POST MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0E131B] border border-[#C5A880] max-w-2xl w-full p-6 space-y-5 shadow-2xl relative my-8">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="text-[10px] text-[#C5A880] uppercase tracking-widest font-mono">Diễn Đàn SKYLINE Community</div>
              <h3 className="text-xl font-serif font-bold text-white">Đăng Bài Viết & Tạo Khảo Sát Cư Dân</h3>
              <p className="text-xs text-gray-400">Chia sẻ thông tin, rao vặt nội bộ hoặc mở cuộc thăm dò ý kiến toàn khu chung cư.</p>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4">
              {/* Category picker */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Chuyên Mục Bài Đăng</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'DISCUSSION', label: 'Thảo Luận', icon: Users },
                    { id: 'MARKETPLACE', label: 'Rao Vặt', icon: ShoppingBag },
                    { id: 'VOTING', label: 'Biểu Quyết', icon: Vote },
                    ...(isAdmin ? [{ id: 'ANNOUNCEMENT', label: 'Thông Báo BQL', icon: Megaphone }] : []),
                  ].map(cat => {
                    const Icon = cat.icon;
                    const isSelected = createCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setCreateCategory(cat.id as any);
                          if (cat.id === 'VOTING') setAttachPoll(true);
                        }}
                        className={`p-2.5 text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                          isSelected
                            ? 'bg-[#C5A880] text-[#0A0E14] border-[#C5A880] font-bold'
                            : 'bg-[#141B24] text-gray-300 border-[#222B35] hover:border-gray-500'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Tiêu Đề Bài Viết *</label>
                <input
                  type="text"
                  required
                  value={createTitle}
                  onChange={e => setCreateTitle(e.target.value)}
                  placeholder="Ví dụ: Trao đổi bộ bàn ghế sồi ban công / Đề xuất thêm thùng rác phân loại..."
                  className="w-full bg-[#141B24] border border-[#C5A880]/30 text-white px-3 py-2 text-xs placeholder-gray-500 focus:outline-none focus:border-[#C5A880]"
                />
              </div>

              {/* Content input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Nội Dung Chi Tiết *</label>
                <textarea
                  required
                  rows={4}
                  value={createContent}
                  onChange={e => setCreateContent(e.target.value)}
                  placeholder="Mô tả cụ thể thông tin, tình trạng, lý do để cư dân và BQL nắm rõ..."
                  className="w-full bg-[#141B24] border border-[#C5A880]/30 text-white p-3 text-xs placeholder-gray-500 focus:outline-none focus:border-[#C5A880] resize-none"
                />
              </div>

              {/* Tags input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Thẻ Phân Loại (Tags, cách nhau bằng dấu phẩy)</label>
                <input
                  type="text"
                  value={createTags}
                  onChange={e => setCreateTags(e.target.value)}
                  placeholder="Rao vặt, Tiện ích, Thang máy, Hồ bơi..."
                  className="w-full bg-[#141B24] border border-[#222B35] text-white px-3 py-2 text-xs placeholder-gray-500 focus:outline-none focus:border-[#C5A880]"
                />
              </div>

              {/* Admin pinned toggle */}
              {isAdmin && (
                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#C5A880]">
                  <input
                    type="checkbox"
                    checked={createIsPinned}
                    onChange={e => setCreateIsPinned(e.target.checked)}
                    className="accent-[#C5A880]"
                  />
                  <span>Ghim bài viết này lên đầu bảng tin diễn đàn</span>
                </label>
              )}

              {/* Poll toggle */}
              <div className="pt-2 border-t border-white/5 space-y-3">
                <label className="flex items-center justify-between cursor-pointer text-xs text-gray-200">
                  <span className="flex items-center gap-2 font-semibold">
                    <Vote className="w-4 h-4 text-[#C5A880]" />
                    Đính kèm cuộc thăm dò ý kiến / Biểu quyết (Interactive Poll)
                  </span>
                  <input
                    type="checkbox"
                    checked={attachPoll || createCategory === 'VOTING'}
                    onChange={e => setAttachPoll(e.target.checked)}
                    className="accent-[#C5A880]"
                  />
                </label>

                {(attachPoll || createCategory === 'VOTING') && (
                  <div className="p-3.5 bg-[#141B24] border border-[#C5A880]/30 space-y-3 animate-fadeIn">
                    <div className="text-[11px] text-[#C5A880] font-bold uppercase tracking-wider">
                      Cấu Hình Các Phương Án Bình Chọn
                    </div>

                    <div className="space-y-2">
                      {pollOptions.map((opt, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input
                            type="text"
                            value={opt}
                            onChange={e => {
                              const newOpts = [...pollOptions];
                              newOpts[idx] = e.target.value;
                              setPollOptions(newOpts);
                            }}
                            placeholder={`Phương án ${idx + 1}...`}
                            className="flex-1 bg-[#0E131B] border border-[#222B35] text-white px-3 py-1.5 text-xs focus:outline-none focus:border-[#C5A880]"
                          />
                          {pollOptions.length > 2 && (
                            <button
                              type="button"
                              onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}
                              className="px-2.5 text-gray-400 hover:text-rose-400"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}

                      {pollOptions.length < 5 && (
                        <button
                          type="button"
                          onClick={() => setPollOptions([...pollOptions, ''])}
                          className="text-xs text-[#C5A880] hover:underline flex items-center gap-1 pt-1"
                        >
                          <Plus className="w-3 h-3" /> Thêm phương án lựa chọn
                        </button>
                      )}
                    </div>

                    {/* Poll constraints */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="text-[10px] text-gray-400 block mb-1">Thời Hạn Biểu Quyết Đến</label>
                        <input
                          type="datetime-local"
                          value={pollDeadline}
                          onChange={e => setPollDeadline(e.target.value)}
                          className="w-full bg-[#0E131B] border border-[#222B35] text-white px-3 py-1.5 text-xs focus:outline-none focus:border-[#C5A880]"
                        />
                      </div>

                      {isAdmin && (
                        <div className="flex items-center gap-2 pt-4">
                          <input
                            type="checkbox"
                            id="pollOwnerOnly"
                            checked={pollIsOwnerOnly}
                            onChange={e => setPollIsOwnerOnly(e.target.checked)}
                            className="accent-[#C5A880]"
                          />
                          <label htmlFor="pollOwnerOnly" className="text-xs text-gray-300 cursor-pointer">
                            Chỉ Chủ Hộ mới được biểu quyết (Biểu quyết pháp lý)
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* LIVE AI PREVIEW BAR */}
              {liveAiPreview && (
                <div className="p-3 bg-[#141B24]/90 border border-emerald-500/30 text-xs flex items-center justify-between text-gray-300 font-mono">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                    AI Kiểm duyệt: {liveAiPreview.moderation === 'Clean' ? 'Hợp lệ ✓' : 'Cần rà soát ⚠️'}
                  </span>
                  <span>
                    Chỉ số cảm xúc: <strong>{liveAiPreview.sentimentLabel}</strong> ({liveAiPreview.sentiment > 0 ? `+${liveAiPreview.sentiment.toFixed(2)}` : liveAiPreview.sentiment.toFixed(2)})
                  </span>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1A222D]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 text-xs text-gray-400 hover:text-white uppercase tracking-wider font-semibold"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#C5A880] hover:bg-white text-[#0A0E14] font-bold text-xs uppercase tracking-wider transition-colors shadow-lg"
                >
                  Đăng Lên Diễn Đàn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
