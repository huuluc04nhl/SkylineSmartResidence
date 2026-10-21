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
  Tag,
  RefreshCw,
  Loader2,
  Eye,
  EyeOff,
  Camera,
  Image as ImageIcon,
  Settings,
  Calendar
} from 'lucide-react';
import { User } from '@/lib/dataStore';
import { compressImageFile } from '@/lib/imageUtils';
import { 
  CommunityPost, 
  PostCategory, 
  getCommunityPosts, 
  createCommunityPostWithAi,
  fetchCommunitySentimentReport,
  CommunitySentimentReport,
  toggleLikeCommunityPost, 
  addCommentToPost, 
  castCommunityPollVote, 
  deleteCommunityPost,
  analyzePostWithAi
} from '@/lib/communityStore';
import { useLanguage } from '@/lib/languageContext';

interface SurveysVotingProps {
  currentUser?: User;
}

function LuxuryToggle({ 
  checked, 
  onChange, 
  disabled = false 
}: { 
  checked: boolean; 
  onChange: (val: boolean) => void; 
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-10 sm:h-5.5 sm:w-11 flex-shrink-0 cursor-pointer rounded-none border transition-colors duration-150 ease-in-out focus:outline-none ${
        checked ? 'bg-[#C5A880] border-[#C5A880]' : 'bg-[#141B24] border-[#2A3647]'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 sm:h-4.5 sm:w-4.5 transform rounded-none transition duration-150 ease-in-out shadow-sm ${
          checked ? 'translate-x-5 bg-[#0A0E14]' : 'translate-x-0.5 bg-gray-400'
        }`}
      />
    </button>
  );
}

export default function SurveysVoting({ currentUser }: SurveysVotingProps) {
  const { t, isEn } = useLanguage();
  const isAdmin = currentUser?.role === 'ADMIN';
  const isOwner = currentUser?.role === 'OWNER';
  const isTenant = currentUser?.role === 'TENANT';
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
  // Unblurred toxic posts map: postId -> boolean
  const [unblurredPosts, setUnblurredPosts] = useState<Record<string, boolean>>({});

  // Notification message
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modal: Create Post
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createCategory, setCreateCategory] = useState<PostCategory>(isAdmin ? 'ANNOUNCEMENT' : 'DISCUSSION');
  const [createTitle, setCreateTitle] = useState('');
  const [createContent, setCreateContent] = useState('');
  const [createTags, setCreateTags] = useState('');
  const [createIsPinned, setCreateIsPinned] = useState(false);
  const [isSubmittingWithAi, setIsSubmittingWithAi] = useState(false);

  // Modal: Image Attachments & Lightbox Zoom
  const [createImages, setCreateImages] = useState<string[]>([]);
  const [isCompressingImage, setIsCompressingImage] = useState(false);
  const [previewZoomImage, setPreviewZoomImage] = useState<string | null>(null);

  // Modal: AI Community Sentiment Report
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [sentimentReport, setSentimentReport] = useState<CommunitySentimentReport | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  
  // Modal: Attach Poll
  const [attachPoll, setAttachPoll] = useState(false);
  const [pollDeadline, setPollDeadline] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0] + 'T23:59:59';
  });
  const [pollIsOwnerOnly, setPollIsOwnerOnly] = useState(false);
  const [pollNoDeadline, setPollNoDeadline] = useState(false);
  const [pollAllowMultiple, setPollAllowMultiple] = useState(true);
  const [pollAllowAddOptions, setPollAllowAddOptions] = useState(true);
  const [pollHideResultsBeforeVote, setPollHideResultsBeforeVote] = useState(false);
  const [pollIsAnonymous, setPollIsAnonymous] = useState(false);
  const [pollOptions, setPollOptions] = useState<string[]>(() => isEn ? [
    'Approve proposal',
    'Reject proposal, keep current state',
    'Other opinion'
  ] : [
    'Đồng ý thông qua phương án',
    'Không đồng ý, giữ nguyên hiện trạng',
    'Ý kiến khác'
  ]);

  useEffect(() => {
    setPollOptions(prev => {
      const isDefaultVn = prev.length === 3 && prev[0] === 'Đồng ý thông qua phương án';
      const isDefaultEn = prev.length === 3 && prev[0] === 'Approve proposal';
      if (isEn && isDefaultVn) {
        return ['Approve proposal', 'Reject proposal, keep current state', 'Other opinion'];
      }
      if (!isEn && isDefaultEn) {
        return ['Đồng ý thông qua phương án', 'Không đồng ý, giữ nguyên hiện trạng', 'Ý kiến khác'];
      }
      return prev;
    });
  }, [isEn]);

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
    const positiveRate = totalPosts > 0 ? Math.round((positiveCount / totalPosts) * 100) : 100;
    const hotspotCount = posts.filter(p => p.isHotspot).length;
    return { totalPosts, activePolls, totalComments, positiveRate, hotspotCount };
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
    if (isTenant) {
      showToast(
        isEn
          ? 'Family members have view access to the forum. Official voting is reserved for Apartment Owners.'
          : 'Tài khoản Người nhà có quyền theo dõi diễn đàn. Quyền biểu quyết đại diện căn hộ thuộc độc quyền của Chủ Hộ.',
        'error'
      );
      return;
    }

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

  // Handle Open AI Sentiment Report Modal (Admin / Management only)
  const handleOpenReportModal = async () => {
    if (!isAdmin) {
      showToast(isEn ? 'This analytics report is reserved for Building Management.' : 'Báo cáo quản trị này dành riêng cho Ban Quản Lý.', 'error');
      return;
    }
    setIsReportModalOpen(true);
    setIsLoadingReport(true);
    try {
      const rep = await fetchCommunitySentimentReport();
      setSentimentReport(rep);
    } catch {
      showToast('Lỗi khi tải báo cáo.', 'error');
    } finally {
      setIsLoadingReport(false);
    }
  };

  // Handle Image Upload with Canvas compression
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (createImages.length + files.length > 4) {
      showToast('Tối đa 4 hình ảnh cho mỗi bài viết.', 'error');
      return;
    }

    setIsCompressingImage(true);
    try {
      const newImages: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;
        const compressed = await compressImageFile(file, 1000, 1000, 0.75);
        newImages.push(compressed);
      }
      setCreateImages(prev => [...prev, ...newImages].slice(0, 4));
      showToast(`Đã tải lên ${newImages.length} hình ảnh.`);
    } catch {
      showToast('Lỗi khi nén và tải hình ảnh.', 'error');
    } finally {
      setIsCompressingImage(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setCreateImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Handle Create Post with AI Auto-Moderation & Sentiment
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    const isPollActive = createCategory === 'VOTING' || attachPoll;

    if (!createTitle.trim()) {
      showToast(isPollActive 
        ? (isEn ? 'Please enter the poll question or topic.' : 'Vui lòng nhập chủ đề / câu hỏi bình chọn.') 
        : (isEn ? 'Please enter post title.' : 'Vui lòng nhập tiêu đề bài viết.'), 'error');
      return;
    }

    const effectiveContent = createContent.trim() || createTitle.trim();

    const tagsArray = createTags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    let pollData = undefined;
    if (isPollActive) {
      const validOptions = pollOptions.filter(o => o.trim().length > 0);
      if (validOptions.length < 2) {
        showToast(isEn ? 'A poll requires at least 2 voting options.' : 'Cuộc bình chọn cần ít nhất 2 phương án lựa chọn.', 'error');
        return;
      }
      pollData = {
        deadline: pollNoDeadline ? '' : pollDeadline,
        noDeadline: pollNoDeadline,
        isOwnerOnly: isAdmin && pollIsOwnerOnly,
        allowMultipleAnswers: pollAllowMultiple,
        allowAddOptions: pollAllowAddOptions,
        hideResultsBeforeVote: pollHideResultsBeforeVote,
        isAnonymous: pollIsAnonymous,
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

    setIsSubmittingWithAi(true);
    try {
      await createCommunityPostWithAi({
        category: createCategory,
        code: createCategory === 'VOTING' ? `BQ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}` : undefined,
        authorName: userName,
        authorRole: currentUser?.role || 'OWNER',
        aptCode,
        avatarUrl: userAvatar,
        title: createTitle.trim(),
        content: effectiveContent,
        images: createImages.length > 0 ? createImages : undefined,
        tags: tagsArray.length > 0 ? tagsArray : (isPollActive ? ['Bình chọn', 'Cư dân'] : ['Cộng đồng', 'Skyline']),
        isPinned: isAdmin && createIsPinned,
        poll: pollData,
      });

      setIsCreateModalOpen(false);
      setCreateTitle('');
      setCreateContent('');
      setCreateTags('');
      setCreateImages([]);
      setAttachPoll(false);
      setPollNoDeadline(false);
      showToast(isEn ? 'Post & Poll published successfully!' : 'Đã đăng bài viết / tạo cuộc bình chọn thành công!');
    } catch {
      showToast('Lỗi khi đăng bài viết.', 'error');
    } finally {
      setIsSubmittingWithAi(false);
    }
  };

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
              <span>{t('Cộng Đồng Cư Dân 5 Sao • The Tropical Beverly Solari')}</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-serif font-bold text-white tracking-wide">
              {t('Diễn Đàn & Biểu Quyết Cư Dân SKYLINE')}
            </h1>
            <p className="text-xs text-gray-400 max-w-2xl leading-relaxed">
              {isEn
                ? 'Official resident community space: discuss building amenities, share classifieds, and vote transparently.'
                : 'Không gian tương tác cộng đồng cư dân Skyline: trao đổi tiện ích tòa nhà, thông báo ban quản lý và biểu quyết minh bạch.'}
            </p>
            {isTenant && (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#141B24] border border-[#C5A880]/40 text-gray-300 text-[11px]">
                <Users className="w-3.5 h-3.5 text-[#C5A880]" />
                <span>
                  {isEn
                    ? 'Role: Family Member • Community Forum Viewing Mode (Voting reserved for Owner)'
                    : 'Vai trò: Thành viên gia đình • Chế độ xem diễn đàn cư dân (Quyền biểu quyết thuộc Chủ Hộ)'}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Management Analytics Report Button (Admin Only) */}
            {isAdmin && (
              <button
                onClick={handleOpenReportModal}
                className="px-4 py-3 bg-[#141B24] hover:bg-[#1E293B] border border-[#C5A880]/40 text-[#C5A880] hover:text-white font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center gap-2 shadow-md"
              >
                <BarChart3 className="w-4 h-4 text-[#C5A880]" />
                <span>{isEn ? 'Management Sentiment Report' : 'Báo Cáo Cảm Xúc BQL'}</span>
              </button>
            )}

            {/* Create Post Button */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-5 py-3 bg-[#C5A880] hover:bg-white text-[#0A0E14] font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-[#C5A880]/30 transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>
                {isAdmin
                  ? (isEn ? 'Create Post / Launch Poll' : 'Đăng Bài / Tạo Biểu Quyết')
                  : (isEn ? 'Create Post' : 'Đăng Bài Viết')}
              </span>
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
              <div className="text-[10px] text-gray-400 uppercase tracking-wider">{t('Tổng Bài Viết')}</div>
              <div className="text-lg font-serif font-bold text-white font-mono">{stats.totalPosts}</div>
            </div>
          </div>

          <div className="p-3 bg-[#0A0E14]/80 border border-[#C5A880]/20 flex items-center gap-3">
            <div className="w-9 h-9 bg-[#10B981]/10 border border-[#10B981]/30 flex items-center justify-center text-[#10B981]">
              <Vote className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wider">{t('Biểu Quyết Đang Mở')}</div>
              <div className="text-lg font-serif font-bold text-[#10B981] font-mono">{stats.activePolls}</div>
            </div>
          </div>

          <div className="p-3 bg-[#0A0E14]/80 border border-[#C5A880]/20 flex items-center gap-3">
            <div className="w-9 h-9 bg-[#F59E0B]/10 border border-[#F59E0B]/30 flex items-center justify-center text-[#F59E0B]">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wider">{t('Lượt Thảo Luận')}</div>
              <div className="text-lg font-serif font-bold text-white font-mono">{stats.totalComments}</div>
            </div>
          </div>

          <div className="p-3 bg-[#0A0E14]/80 border border-[#C5A880]/20 flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wider">
                {isAdmin ? t('Chỉ Số Hài Lòng BQL') : t('Chuẩn Sống Văn Minh')}
              </div>
              <div className="text-lg font-serif font-bold text-emerald-400 font-mono">
                {isAdmin ? `${stats.positiveRate}%` : '100%'}
              </div>
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
              { id: 'VOTING', label: 'Biểu Quyết & Khảo Sát', icon: Vote },
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
                  <span>{t(tab.label)}</span>
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
              placeholder={isEn ? "Search posts, titles, apartment code..." : "Tìm bài viết, tiêu đề, mã căn..."}
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
            <span>{isEn ? 'Pinned Notices only' : 'Chỉ xem Thông báo Ghim quan trọng'}</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer hover:text-white">
            <input
              type="checkbox"
              checked={onlyVoted}
              onChange={e => setOnlyVoted(e.target.checked)}
              className="accent-[#C5A880] rounded-none"
            />
            <span>{isEn ? 'Surveys apartment participated in' : 'Bài viết có Biểu quyết căn hộ đã tham gia'}</span>
          </label>
        </div>
      </div>

      {/* FEED LIST */}
      <div className="space-y-5">
        {filteredPosts.length === 0 ? (
          <div className="p-12 text-center bg-[#0E131B] border border-[#C5A880]/20 space-y-4">
            <div className="w-12 h-12 bg-[#141B24] border border-[#C5A880]/30 flex items-center justify-center mx-auto text-[#C5A880]">
              <MessageSquareQuote className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="text-base font-serif font-bold text-white">
                {posts.length === 0 
                  ? (isEn ? 'No Community Posts Yet' : 'Chưa Có Bài Viết Nào Trên Diễn Đàn') 
                  : (isEn ? 'No Matching Posts Found' : 'Không Tìm Thấy Bài Viết Phù Hợp')}
              </div>
              <p className="text-xs text-gray-400 max-w-md mx-auto">
                {posts.length === 0 
                  ? (isAdmin
                    ? (isEn ? 'The community forum is currently clean. Be the first to share, post classifieds, or launch an official poll for residents!' : 'Diễn đàn hiện tại hoàn toàn sạch dữ liệu. Hãy là người đầu tiên đăng bài chia sẻ, rao vặt hoặc tạo cuộc biểu quyết cho cộng đồng cư dân!')
                    : (isEn ? 'The community forum is currently clean. Be the first to share discussions or post classifieds for the community!' : 'Diễn đàn hiện tại hoàn toàn sạch dữ liệu. Hãy là người đầu tiên chia sẻ thông tin hoặc đăng tin rao vặt cho cộng đồng cư dân!'))
                  : (isEn ? 'No posts match your search query or active filter criteria.' : 'Không có bài viết nào khớp với tiêu chí tìm kiếm hoặc bộ lọc hiện tại của bạn.')}
              </p>
            </div>
            {posts.length === 0 && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-5 py-2.5 bg-[#C5A880] hover:bg-white text-[#0A0E14] font-bold text-xs uppercase tracking-wider transition-colors inline-flex items-center gap-2 shadow"
              >
                <Plus className="w-4 h-4" />
                <span>{isEn ? 'Create First Post' : 'Đăng Bài Viết Đầu Tiên'}</span>
              </button>
            )}
          </div>
        ) : (
          filteredPosts.map(post => {
            const hasLiked = post.likes.some(c => c.toUpperCase() === aptCode.toUpperCase());
            const isCommentsOpen = !!expandedComments[post.id];
            const isBql = post.authorRole === 'ADMIN' || post.authorRole === 'STAFF';
            const isToxic = post.aiModeration === 'Toxic';
            const isUnblurred = !!unblurredPosts[post.id];

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
                    : post.isHotspot
                    ? 'border-rose-500/60 shadow-[0_2px_15px_rgba(244,63,94,0.15)]'
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
                            {t('Ban Quản Lý')}
                          </span>
                        ) : post.authorRole === 'OWNER' ? (
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9px] font-semibold uppercase tracking-wider">
                            {t('Chủ Hộ')} ({post.aptCode || 'CH-06'})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-gray-700/40 text-gray-300 border border-gray-600 text-[9px] font-semibold uppercase tracking-wider">
                            {t('Cư Dân')} ({post.aptCode || t('Căn Hộ')})
                          </span>
                        )}

                        {post.isPinned && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-[#C5A880] font-bold uppercase tracking-wider">
                            <Pin className="w-3 h-3 fill-[#C5A880]" />
                            {t('Ghim Quan Trọng')}
                          </span>
                        )}

                        {post.isHotspot && (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-rose-500/15 border border-rose-500/40 text-rose-400 px-2 py-0.5 font-bold uppercase tracking-wider animate-pulse">
                            <Flame className="w-3 h-3 text-rose-400" />
                            {t('Điểm Nóng BQL')}
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-gray-500 flex items-center gap-2 mt-0.5 font-mono">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(post.createdAt).toLocaleDateString(isEn ? 'en-US' : 'vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                        {post.code && <span>• {t('Mã')}: <strong className="text-[#C5A880]">{post.code}</strong></span>}
                      </div>
                    </div>
                  </div>

                  {/* AI MODERATION & SENTIMENT BADGES */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {post.aiModeration === 'Toxic' ? (
                      <span className="px-2 py-0.5 bg-rose-500/20 border border-rose-500 text-rose-400 text-[10px] font-mono flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-rose-400" />
                        {t('AI: Vi Phạm Tiêu Chuẩn')}
                      </span>
                    ) : post.aiModeration === 'Warning' ? (
                      <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[10px] font-mono flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                        {t('AI: Cần Lưu Tâm')}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-[#141B24] border border-[#10B981]/40 text-[#10B981] text-[10px] font-mono flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        {t('AI: Chuẩn Văn Minh')}
                      </span>
                    )}

                    <span className={`px-2 py-0.5 text-[10px] font-mono border ${
                      post.aiSentimentLabel === 'Tích cực' 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                        : post.aiSentimentLabel === 'Góp ý'
                        ? 'bg-[#C5A880]/10 text-[#C5A880] border-[#C5A880]/30'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    }`}>
                      {post.aiSentimentLabel === 'Tích cực' ? '🌱 ' : post.aiSentimentLabel === 'Góp ý' ? '💡 ' : '⚠️ '}
                      {t('Cảm xúc')}: {t(post.aiSentimentLabel)} ({post.aiSentiment > 0 ? `+${post.aiSentiment.toFixed(2)}` : post.aiSentiment.toFixed(2)})
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

                    {/* Auto-Moderation Blur if content is toxic */}
                    {isToxic && !isUnblurred ? (
                      <div className="p-4 bg-rose-950/20 border border-rose-500/40 space-y-2 text-center my-2">
                        <div className="flex items-center justify-center gap-2 text-rose-400 text-xs font-semibold">
                          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                          <span>Nội dung đã bị AI tự động làm mờ do chứa từ ngữ nhạy cảm / công kích.</span>
                        </div>
                        <p className="text-[11px] text-gray-400">
                          {post.aiModerationReason || 'Vi phạm bộ quy tắc ứng xử văn minh trong cộng đồng cư dân SKYLINE.'}
                        </p>
                        <button
                          onClick={() => setUnblurredPosts(prev => ({ ...prev, [post.id]: true }))}
                          className="text-[11px] text-[#C5A880] hover:underline flex items-center justify-center gap-1 mx-auto pt-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Tôi vẫn muốn xem nội dung gốc</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-line">
                          {post.content}
                        </p>

                        {/* Attached Images */}
                        {post.images && post.images.length > 0 && (
                          <div className={`grid gap-2 pt-1 ${
                            post.images.length === 1 ? 'grid-cols-1 max-w-sm' :
                            post.images.length === 2 ? 'grid-cols-2 max-w-md' :
                            'grid-cols-2 sm:grid-cols-3 max-w-lg'
                          }`}>
                            {post.images.map((img, imgIdx) => (
                              <div 
                                key={imgIdx} 
                                onClick={() => setPreviewZoomImage(img)}
                                className="relative aspect-video sm:aspect-square bg-[#141B24] border border-[#C5A880]/30 overflow-hidden cursor-pointer group"
                              >
                                <img 
                                  src={img} 
                                  alt={`Ảnh đính kèm ${imgIdx + 1}`} 
                                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] gap-1 font-mono">
                                  <Eye className="w-3.5 h-3.5 text-[#C5A880]" />
                                  <span>Xem ảnh</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* AI CONCIERGE QUICK REPLY BOX (If inquiry detected) */}
                  {post.aiQuickReply && (
                    <div className="p-3.5 bg-[#141B24] border border-[#C5A880]/30 border-l-4 border-l-[#C5A880] space-y-1.5 shadow-md my-2">
                      <div className="flex items-center gap-1.5 text-[10px] text-[#C5A880] font-mono font-bold uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
                        <span>Trợ Lý Ảo SKYLINE AI Phản Hồi Tức Thì (Theo Sổ Tay Tòa Nhà):</span>
                      </div>
                      <p className="text-xs text-gray-200 leading-relaxed italic">
                        "{post.aiQuickReply}"
                      </p>
                    </div>
                  )}

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
                        <div className="flex items-center gap-2 flex-wrap">
                          <Vote className="w-4 h-4 text-[#C5A880]" />
                          <span className="text-xs font-bold uppercase tracking-wider text-white">
                            {t('Cuộc Thăm Dò & Biểu Quyết Tòa Nhà')}
                          </span>
                          {post.poll.isOwnerOnly ? (
                            <span className="px-2 py-0.5 bg-amber-500/15 border border-amber-500/40 text-amber-400 text-[9px] font-semibold uppercase tracking-wider">
                              {t('Chủ Hộ (Owner Only)')}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-[#C5A880]/15 border border-[#C5A880]/40 text-[#C5A880] text-[9px] font-semibold uppercase tracking-wider">
                              {t('Toàn Thể Cư Dân')}
                            </span>
                          )}
                          {post.poll.isAnonymous && (
                            <span className="px-2 py-0.5 bg-purple-500/15 border border-purple-500/40 text-purple-300 text-[9px] font-semibold uppercase tracking-wider">
                              {isEn ? 'Anonymous' : 'Ẩn danh'}
                            </span>
                          )}
                          {post.poll.allowMultipleAnswers && (
                            <span className="px-2 py-0.5 bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[9px] font-semibold uppercase tracking-wider">
                              {isEn ? 'Multiple choice' : 'Chọn nhiều PA'}
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-gray-400 font-mono flex items-center gap-2">
                          <span>{t('Đã biểu quyết')}: <strong className="text-white">{totalPollVotes}</strong>/{eligibleCount} {t('căn')} ({participationRate}%)</span>
                          <span>• {t('Hạn')}: {post.poll.noDeadline ? (isEn ? 'No deadline' : 'Không thời hạn') : (post.poll.deadline ? new Date(post.poll.deadline).toLocaleDateString(isEn ? 'en-US' : 'vi-VN') : '—')}</span>
                        </div>
                      </div>

                      {/* Notice if user cannot vote */}
                      {isTenant ? (
                        <div className="p-2.5 bg-[#141B24] border border-[#C5A880]/30 text-gray-300 text-[11px] flex items-center gap-2">
                          <Info className="w-3.5 h-3.5 flex-shrink-0 text-[#C5A880]" />
                          <span>
                            {isEn
                              ? 'Family Member Mode: You have viewing access to the forum and poll statistics. Official voting is reserved for Apartment Owners.'
                              : 'Chế độ Người nhà: Quý cư dân có quyền theo dõi thảo luận và thống kê biểu quyết. Quyền bỏ phiếu đại diện căn hộ thuộc về Chủ Hộ.'}
                          </span>
                        </div>
                      ) : post.poll.isOwnerOnly && !isOwner && !isAdmin ? (
                        <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] flex items-center gap-2">
                          <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>Quyền hạn: Cuộc biểu quyết pháp lý này yêu cầu tài khoản <strong>Chủ Hộ</strong>. Bạn đang xem với quyền tham khảo.</span>
                        </div>
                      ) : null}

                      {/* Notice if results hidden before vote */}
                      {post.poll.hideResultsBeforeVote && !userVote && !isTenant && (
                        <div className="p-2 bg-[#C5A880]/10 border border-[#C5A880]/30 text-[#C5A880] text-[11px] flex items-center gap-2">
                          <EyeOff className="w-3.5 h-3.5 flex-shrink-0 text-[#C5A880]" />
                          <span>{isEn ? 'Results are hidden until you cast your vote.' : 'Kết quả đang ẩn, Quý cư dân vui lòng bình chọn để xem tỉ lệ phiếu.'}</span>
                        </div>
                      )}

                      {/* Options List */}
                      <div className="space-y-2.5 pt-1">
                        {post.poll.options.map(option => {
                          const isUserSelected = userVote?.optionId === option.id;
                          const showResults = !post.poll?.hideResultsBeforeVote || !!userVote || isTenant || isAdmin;
                          const percentage = totalPollVotes > 0 ? Math.round((option.votes / totalPollVotes) * 100) : 0;
                          const canVote = (!post.poll?.isOwnerOnly || isOwner) && !isTenant;

                          return (
                            <div
                              key={option.id}
                              onClick={() => handleVote(post.id, option.id)}
                              className={`relative p-3 border transition-all duration-200 select-none ${
                                canVote ? 'cursor-pointer hover:border-[#C5A880]' : isTenant ? 'cursor-not-allowed hover:border-amber-500/40' : 'cursor-default'
                              } ${
                                isUserSelected
                                  ? 'bg-[#10B981]/10 border-[#10B981]'
                                  : 'bg-[#0E131B] border-[#222B35]'
                              }`}
                            >
                              {/* Background percentage progress bar */}
                              {showResults && (
                                <div
                                  className={`absolute left-0 top-0 bottom-0 transition-all duration-500 ${
                                    isUserSelected ? 'bg-[#10B981]/15' : 'bg-[#C5A880]/15'
                                  }`}
                                  style={{ width: `${percentage}%` }}
                                />
                              )}

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
                                  <span className="text-gray-400">{option.votes} {t('phiếu')}</span>
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
                            {t('Căn hộ')} {aptCode} {t('đã bỏ phiếu thành công (bấm phương án khác để đổi ý kiến).')}
                          </span>
                          <span className="text-gray-500">
                            {t('Lúc')}: {new Date(userVote.votedAt).toLocaleTimeString(isEn ? 'en-US' : 'vi-VN', { hour: '2-digit', minute: '2-digit' })}
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
                      <span className="hidden sm:inline">{hasLiked ? t('Đã Thích') : t('Thích')}</span>
                    </button>

                    {/* Comment button */}
                    <button
                      onClick={() => setExpandedComments(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{post.comments.length}</span>
                      <span className="hidden sm:inline">{t('Thảo luận')}</span>
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
                                  {cmt.aiModeration === 'Toxic' && (
                                    <span className="px-1.5 py-0.2 bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[8px]">Đã lọc từ ngữ</span>
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

      {/* CREATE POST & RESIDENT POLL MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden">
          <div className="bg-[#0E131B] border border-[#C5A880]/60 max-w-4xl w-full max-h-[92vh] sm:max-h-[88vh] flex flex-col shadow-[0_25px_70px_rgba(0,0,0,0.95)] rounded-none overflow-hidden relative">
            {/* 1. STICKY MODAL HEADER */}
            <div className="px-5 py-3.5 bg-[#121820] border-b border-[#222B35] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#C5A880]/15 border border-[#C5A880]/40 flex items-center justify-center text-[#C5A880]">
                  <Vote className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-serif font-bold text-white flex items-center gap-2">
                    {createCategory === 'VOTING' || attachPoll
                      ? (isEn ? 'Create Resident Poll' : 'Tạo bình chọn cư dân')
                      : (isEn ? 'Create Community Post' : 'Đăng bài viết cư dân')}
                  </h3>
                  <div className="text-[10px] text-gray-400 font-mono flex items-center gap-2">
                    <span className="text-[#C5A880]">The Tropical • BS-07</span>
                    <span>•</span>
                    <span className="text-gray-400">Skyline Smart Residence</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                title={isEn ? "Close" : "Đóng"}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 2. CATEGORY TABS BAR (Instant lag-free tab switching) */}
            <div className="px-5 py-2.5 bg-[#0A0E14] border-b border-[#1E2733] flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
              {[
                ...(!isTenant ? [{ id: 'VOTING', label: isEn ? 'Create Poll' : 'Tạo bình chọn', icon: Vote }] : []),
                { id: 'DISCUSSION', label: isEn ? 'Discussion' : 'Thảo luận', icon: Users },
                { id: 'MARKETPLACE', label: isEn ? 'Classifieds' : 'Rao vặt', icon: ShoppingBag },
                ...(isAdmin ? [{ id: 'ANNOUNCEMENT', label: isEn ? 'Notice BQL' : 'Thông báo BQL', icon: Megaphone }] : []),
              ].map(cat => {
                const Icon = cat.icon;
                const isSelected = createCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setCreateCategory(cat.id as any);
                      setAttachPoll(cat.id === 'VOTING');
                    }}
                    className={`px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 select-none whitespace-nowrap transition-colors duration-150 ${
                      isSelected
                        ? 'bg-[#C5A880] text-[#0A0E14] font-bold shadow'
                        : 'bg-[#141B24] text-gray-400 hover:text-white hover:bg-[#1A232F]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* 3. SCROLLABLE MODAL BODY */}
            <form id="create-post-form" onSubmit={handleCreatePost} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 scrollbar-thin">
              {/* Poll Layout */}
              {createCategory === 'VOTING' || attachPoll ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6">
                  {/* LEFT COLUMN: Question & Options */}
                  <div className="lg:col-span-7 space-y-4">
                    {/* Poll Topic / Question */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-200 uppercase tracking-wider flex items-center justify-between">
                        <span>{isEn ? 'Poll Topic / Question *' : 'Chủ đề bình chọn *'}</span>
                      </label>
                      <div className="relative">
                        <textarea
                          required
                          rows={3}
                          maxLength={200}
                          value={createTitle}
                          onChange={e => setCreateTitle(e.target.value)}
                          placeholder={isEn ? "Ask a question for residents to vote on..." : "Đặt câu hỏi bình chọn"}
                          className="w-full bg-[#141B24] border border-[#2A3647] focus:border-[#C5A880] text-white p-3 text-xs placeholder-gray-500 focus:outline-none resize-none transition-colors"
                        />
                        <div className="text-[11px] text-gray-500 font-mono text-right pt-0.5">
                          {createTitle.length}/200
                        </div>
                      </div>
                    </div>

                    {/* Poll Options */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-200 uppercase tracking-wider block">
                        {isEn ? 'Options *' : 'Các lựa chọn *'}
                      </label>
                      <div className="space-y-2">
                        {pollOptions.map((opt, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={opt}
                              onChange={e => {
                                const newOpts = [...pollOptions];
                                newOpts[idx] = e.target.value;
                                setPollOptions(newOpts);
                              }}
                              placeholder={isEn ? `Option ${idx + 1}` : `Lựa chọn ${idx + 1}`}
                              className="flex-1 bg-[#141B24] border border-[#2A3647] focus:border-[#C5A880] text-white px-3.5 py-2 text-xs placeholder-gray-500 focus:outline-none transition-colors"
                            />
                            {pollOptions.length > 2 && (
                              <button
                                type="button"
                                onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}
                                className="p-2 text-gray-400 hover:text-rose-400 transition-colors"
                                title={isEn ? "Remove option" : "Xóa lựa chọn này"}
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Add Option Button */}
                      {pollOptions.length < 8 && (
                        <button
                          type="button"
                          onClick={() => setPollOptions([...pollOptions, ''])}
                          className="inline-flex items-center gap-1.5 text-xs text-[#C5A880] hover:text-[#E2C9A5] font-semibold pt-1 transition-colors select-none"
                        >
                          <Plus className="w-4 h-4" />
                          <span>{isEn ? 'Add option' : 'Thêm lựa chọn'}</span>
                        </button>
                      )}
                    </div>

                    {/* Optional details note */}
                    <div className="space-y-1.5 pt-2 border-t border-[#1E2733]">
                      <label className="text-[11px] text-gray-400 font-medium">
                        {isEn ? 'Additional Context Note (Optional)' : 'Ghi chú mô tả thêm (Tùy chọn)'}
                      </label>
                      <textarea
                        rows={2}
                        value={createContent}
                        onChange={e => setCreateContent(e.target.value)}
                        placeholder={isEn ? "Add more context or guidelines for neighbors..." : "Mô tả cụ thể thông tin hoặc lý do khảo sát..."}
                        className="w-full bg-[#141B24] border border-[#222B35] focus:border-[#C5A880] text-white p-2.5 text-xs placeholder-gray-500 focus:outline-none resize-none transition-colors"
                      />
                    </div>

                    {/* Optional photos attachment */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400 flex items-center gap-1.5">
                          <Camera className="w-3.5 h-3.5 text-[#C5A880]" />
                          <span>{isEn ? 'Attach Illustration Photos' : 'Hình ảnh đính kèm minh họa'}</span>
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono">{createImages.length}/4</span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {createImages.map((img, idx) => (
                          <div key={idx} className="relative w-14 h-14 bg-[#141B24] border border-[#C5A880]/50 overflow-hidden">
                            <img src={img} alt="Preview" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
                              className="absolute top-0 right-0 p-1 bg-black/80 text-white hover:text-rose-400"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        {createImages.length < 4 && (
                          <label className="w-14 h-14 border border-dashed border-[#2A3647] hover:border-[#C5A880] bg-[#141B24]/60 hover:bg-[#141B24] flex flex-col items-center justify-center cursor-pointer text-gray-400 hover:text-[#C5A880] transition-colors">
                            {isCompressingImage ? (
                              <Loader2 className="w-4 h-4 animate-spin text-[#C5A880]" />
                            ) : (
                              <>
                                <Plus className="w-4 h-4" />
                                <span className="text-[8px] mt-0.5">{isEn ? 'Photo' : 'Ảnh'}</span>
                              </>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              disabled={isCompressingImage}
                              onChange={handleImageUpload}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: Advanced Settings */}
                  <div className="lg:col-span-5 space-y-4 lg:border-l lg:border-[#222B35] lg:pl-6">
                    {/* 1. Poll Deadline */}
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-gray-200 uppercase tracking-wider">
                        {isEn ? 'Voting Deadline' : 'Thời hạn bình chọn'}
                      </div>
                      <div className="p-3 bg-[#141B24] border border-[#2A3647] flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className={pollNoDeadline ? 'text-white font-medium' : 'text-gray-400'}>
                            {pollNoDeadline ? (isEn ? 'No deadline' : 'Không thời hạn') : (isEn ? 'Set deadline' : 'Có thời hạn')}
                          </span>
                        </div>
                        <LuxuryToggle checked={pollNoDeadline} onChange={setPollNoDeadline} />
                      </div>

                      {!pollNoDeadline && (
                        <div className="pt-1">
                          <input
                            type="datetime-local"
                            value={pollDeadline}
                            onChange={e => setPollDeadline(e.target.value)}
                            className="w-full bg-[#141B24] border border-[#2A3647] text-white px-3 py-2 text-xs focus:outline-none focus:border-[#C5A880] transition-colors"
                          />
                        </div>
                      )}
                    </div>

                    <div className="border-b border-[#222B35] pt-1" />

                    {/* 2. Advanced Settings */}
                    <div className="space-y-3">
                      <div className="text-xs font-semibold text-gray-200 uppercase tracking-wider">
                        {isEn ? 'Advanced Settings' : 'Thiết lập nâng cao'}
                      </div>

                      {/* Pin to top */}
                      <div className="flex items-center justify-between py-1 text-xs text-gray-300">
                        <span>{isEn ? 'Pin to top of bulletin' : 'Ghim lên đầu bảng tin'}</span>
                        <LuxuryToggle checked={createIsPinned} onChange={setCreateIsPinned} />
                      </div>

                      {/* Allow multiple options */}
                      <div className="flex items-center justify-between py-1 text-xs text-gray-300">
                        <span className="flex items-center gap-1.5">
                          <span>{isEn ? 'Allow multiple choices' : 'Chọn nhiều phương án'}</span>
                          <span title={isEn ? "Voters can select more than one option" : "Cư dân có thể tick chọn nhiều phương án cùng lúc"}>
                            <HelpCircle className="w-3.5 h-3.5 text-gray-500 hover:text-gray-300 cursor-help" />
                          </span>
                        </span>
                        <LuxuryToggle checked={pollAllowMultiple} onChange={setPollAllowMultiple} />
                      </div>

                      {/* Allow add options */}
                      <div className="flex items-center justify-between py-1 text-xs text-gray-300">
                        <span className="flex items-center gap-1.5">
                          <span>{isEn ? 'Allow adding options' : 'Có thể thêm phương án'}</span>
                          <span title={isEn ? "Voters can contribute new options" : "Cư dân khi tham gia có thể đề xuất thêm phương án mới"}>
                            <HelpCircle className="w-3.5 h-3.5 text-gray-500 hover:text-gray-300 cursor-help" />
                          </span>
                        </span>
                        <LuxuryToggle checked={pollAllowAddOptions} onChange={setPollAllowAddOptions} />
                      </div>
                    </div>

                    <div className="border-b border-[#222B35] pt-1" />

                    {/* 3. Anonymous Poll */}
                    <div className="space-y-3">
                      <div className="text-xs font-semibold text-gray-200 uppercase tracking-wider">
                        {isEn ? 'Anonymous Poll' : 'Bình chọn ẩn danh'}
                      </div>

                      {/* Hide results before voting */}
                      <div className="flex items-center justify-between py-1 text-xs text-gray-300">
                        <span className="flex items-center gap-1.5">
                          <span>{isEn ? 'Hide results before vote' : 'Ẩn kết quả khi chưa bình chọn'}</span>
                          <span title={isEn ? "Results revealed only after casting vote" : "Cư dân chỉ xem được kết quả sau khi đã tham gia bình chọn"}>
                            <HelpCircle className="w-3.5 h-3.5 text-gray-500 hover:text-gray-300 cursor-help" />
                          </span>
                        </span>
                        <LuxuryToggle checked={pollHideResultsBeforeVote} onChange={setPollHideResultsBeforeVote} />
                      </div>

                      {/* Anonymous voters */}
                      <div className="flex items-center justify-between py-1 text-xs text-gray-300">
                        <span className="flex items-center gap-1.5">
                          <span>{isEn ? 'Hide voter identities' : 'Ẩn người bình chọn'}</span>
                          <span title={isEn ? "Voter identity will be kept private" : "Bảo mật thông tin căn hộ và người đã bỏ phiếu"}>
                            <HelpCircle className="w-3.5 h-3.5 text-gray-500 hover:text-gray-300 cursor-help" />
                          </span>
                        </span>
                        <LuxuryToggle checked={pollIsAnonymous} onChange={setPollIsAnonymous} />
                      </div>

                      {/* Owner Only (Legal poll) */}
                      {isAdmin && (
                        <div className="flex items-center justify-between py-1 text-xs text-[#C5A880]">
                          <span className="flex items-center gap-1.5">
                            <span>{isEn ? 'Apartment Owners Only (Legal)' : 'Chỉ Chủ Hộ mới được biểu quyết'}</span>
                            <span title="Cuộc biểu quyết pháp lý giới hạn cho tài khoản Chủ Hộ">
                              <HelpCircle className="w-3.5 h-3.5 text-[#C5A880]/70 cursor-help" />
                            </span>
                          </span>
                          <LuxuryToggle checked={pollIsOwnerOnly} onChange={setPollIsOwnerOnly} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* Standard Post Layout (Discussion / Marketplace / Announcement) */
                <div className="space-y-4">
                  {/* Title input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-300">
                      {isEn ? 'Post Title *' : 'Tiêu Đề Bài Viết *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={createTitle}
                      onChange={e => setCreateTitle(e.target.value)}
                      placeholder={isEn ? "e.g. Reselling study desk / Weekend badminton..." : "Ví dụ: Rao lại bàn làm việc gỗ sồi / Nhóm cầu lông cuối tuần..."}
                      className="w-full bg-[#141B24] border border-[#2A3647] focus:border-[#C5A880] text-white px-3 py-2.5 text-xs placeholder-gray-500 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Content input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-300">
                      {isEn ? 'Detailed Content *' : 'Nội Dung Chi Tiết *'}
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={createContent}
                      onChange={e => setCreateContent(e.target.value)}
                      placeholder={isEn ? "Share specific information with residents..." : "Mô tả cụ thể thông tin, thắc mắc để cư dân và BQL cùng trao đổi..."}
                      className="w-full bg-[#141B24] border border-[#2A3647] focus:border-[#C5A880] text-white p-3 text-xs placeholder-gray-500 focus:outline-none resize-none transition-colors"
                    />
                  </div>

                  {/* Switch to attach Poll */}
                  <div className="p-3 bg-[#141B24] border border-[#2A3647] flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-[#C5A880] font-medium">
                      <Vote className="w-4 h-4 text-[#C5A880]" />
                      <span>{isEn ? 'Attach resident poll to this post' : 'Đính kèm cuộc biểu quyết / bình chọn cư dân'}</span>
                    </div>
                    <LuxuryToggle checked={attachPoll} onChange={setAttachPoll} />
                  </div>

                  {/* Tags & Images */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-300">
                        {isEn ? 'Tags (comma-separated)' : 'Thẻ phân loại (Tags)'}
                      </label>
                      <input
                        type="text"
                        value={createTags}
                        onChange={e => setCreateTags(e.target.value)}
                        placeholder="Tiện ích, Rao vặt, Thể thao..."
                        className="w-full bg-[#141B24] border border-[#2A3647] text-white px-3 py-2 text-xs placeholder-gray-500 focus:outline-none focus:border-[#C5A880]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <label className="font-semibold text-gray-300 flex items-center gap-1.5">
                          <Camera className="w-3.5 h-3.5 text-[#C5A880]" />
                          <span>{isEn ? 'Attach Photos' : 'Hình ảnh đính kèm'}</span>
                        </label>
                        <span className="text-[10px] text-gray-500 font-mono">{createImages.length}/4</span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {createImages.map((img, idx) => (
                          <div key={idx} className="relative w-12 h-12 bg-[#141B24] border border-[#C5A880]/50 overflow-hidden">
                            <img src={img} alt="Preview" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
                              className="absolute top-0 right-0 p-0.5 bg-black/80 text-white hover:text-rose-400"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        {createImages.length < 4 && (
                          <label className="w-12 h-12 border border-dashed border-[#2A3647] hover:border-[#C5A880] bg-[#141B24]/60 hover:bg-[#141B24] flex items-center justify-center cursor-pointer text-gray-400 hover:text-[#C5A880] transition-colors">
                            <Plus className="w-4 h-4" />
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              disabled={isCompressingImage}
                              onChange={handleImageUpload}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </form>

            {/* 4. STICKY MODAL FOOTER (Never Cut Off / Never Overflow) */}
            <div className="px-5 py-3.5 bg-[#121820] border-t border-[#222B35] flex items-center justify-between shrink-0">
              {/* Reset / Settings button on the left */}
              <button
                type="button"
                onClick={() => {
                  setPollNoDeadline(false);
                  setPollAllowMultiple(true);
                  setPollAllowAddOptions(true);
                  setPollHideResultsBeforeVote(false);
                  setPollIsAnonymous(false);
                  setPollOptions(isEn ? ['Approve proposal', 'Reject proposal', 'Other opinion'] : ['Đồng ý thông qua', 'Không đồng ý', 'Ý kiến khác']);
                  showToast(isEn ? 'Restored default poll settings.' : 'Đã khôi phục thiết lập bình chọn mặc định.');
                }}
                className="p-2.5 bg-[#161F2C] hover:bg-[#1E2B3E] text-gray-300 hover:text-[#C5A880] border border-[#2A3647] transition-colors"
                title={isEn ? "Reset poll settings" : "Khôi phục thiết lập mặc định"}
              >
                <Settings className="w-4 h-4" />
              </button>

              {/* Action buttons on the right */}
              <div className="flex items-center gap-2.5 sm:gap-3">
                <button
                  type="button"
                  disabled={isSubmittingWithAi}
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs text-gray-300 hover:text-white uppercase tracking-wider font-semibold disabled:opacity-50 transition-colors"
                >
                  {isEn ? 'Cancel' : 'Hủy'}
                </button>

                <button
                  type="submit"
                  form="create-post-form"
                  disabled={isSubmittingWithAi}
                  className="px-6 py-2.5 bg-[#C5A880] hover:bg-white text-[#0A0E14] font-bold text-xs uppercase tracking-wider transition-all shadow-[0_4px_20px_rgba(197,168,128,0.25)] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-95"
                >
                  {isSubmittingWithAi ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#0A0E14]" />
                      <span>{isEn ? 'Publishing...' : 'Đang Đăng...'}</span>
                    </>
                  ) : (
                    <span>
                      {createCategory === 'VOTING' || attachPoll
                        ? (isEn ? 'Create Poll' : 'Tạo bình chọn')
                        : (isEn ? 'Publish Post' : 'Đăng bài')}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: AI COMMUNITY SENTIMENT REPORT (Admin Only) */}
      {isAdmin && isReportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0E131B] border border-[#C5A880] max-w-2xl w-full p-6 space-y-5 shadow-2xl relative my-8">
            <button
              onClick={() => setIsReportModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="text-[10px] text-[#C5A880] uppercase tracking-widest font-mono flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
                <span>{isEn ? 'Google Gemini AI Analytics • Forum Intelligence' : 'Google Gemini AI Analytics • Phân Tích Diễn Đàn'}</span>
              </div>
              <h3 className="text-xl font-serif font-bold text-white">
                {isEn ? 'Sentiment Report & Operational Strategy' : 'Báo Cáo Cảm Xúc & Khuyến Nghị Vận Hành'}
              </h3>
              <p className="text-xs text-gray-400">
                {isEn
                  ? 'Artificial intelligence synthesizes community discussions, measures satisfaction index, and recommends proactive actions.'
                  : 'Trí tuệ nhân tạo khai phá dữ liệu từ các luồng thảo luận, đo lường độ hài lòng và đề xuất chiến lược.'}
              </p>
            </div>

            {isLoadingReport ? (
              <div className="p-12 text-center space-y-3">
                <Loader2 className="w-8 h-8 text-[#C5A880] animate-spin mx-auto" />
                <div className="text-xs font-mono text-[#C5A880]">
                  {isEn ? 'Google Gemini AI is synthesizing resident sentiment insights...' : 'Google Gemini AI đang tổng hợp insight từ cộng đồng cư dân...'}
                </div>
              </div>
            ) : sentimentReport ? (
              <div className="space-y-4">
                {/* Score Banner */}
                <div className="p-4 bg-[#141B24] border border-[#C5A880]/30 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider">
                      {isEn ? 'Resident Satisfaction Index (AI Satisfaction Score)' : 'Chỉ Số Hài Lòng Cư Dân (AI Satisfaction Score)'}
                    </div>
                    <div className="text-2xl font-serif font-bold text-[#10B981] font-mono mt-0.5">
                      {sentimentReport.overallSatisfactionScore}/100
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-gray-500 font-mono">
                    {isEn ? 'Updated: ' : 'Cập nhật: '}
                    {new Date(sentimentReport.analyzedAt).toLocaleTimeString(isEn ? 'en-US' : 'vi-VN')}
                  </div>
                </div>

                {/* Summary */}
                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-[#C5A880] uppercase tracking-wider">
                    {isEn ? 'Resident Sentiment Summary' : 'Tóm Tắt Tâm Lý Cư Dân'}
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed p-3.5 bg-[#121820] border border-[#222B35]">
                    {isEn && sentimentReport.summary === 'Hiện tại diễn đàn chưa có bài viết nào, không gian thảo luận hoàn toàn yên tĩnh và ổn định.'
                      ? 'The community forum currently has no posts; discussions are quiet and stable.'
                      : isEn && sentimentReport.summary.startsWith('Chưa ghi nhận phản hồi tiêu cực nào')
                      ? 'No negative sentiment recorded. Resident discussions remain peaceful and civil.'
                      : sentimentReport.summary}
                  </p>
                </div>

                {/* Hotspots */}
                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-rose-400" />
                    <span>
                      {isEn
                        ? `Operational Hotspots Requiring Attention (${sentimentReport.hotspots.length})`
                        : `Các Điểm Nóng Cần BQL Lưu Tâm (${sentimentReport.hotspots.length})`}
                    </span>
                  </div>
                  {sentimentReport.hotspots.length === 0 ? (
                    <div className="text-xs text-emerald-400 p-3 bg-emerald-500/10 border border-emerald-500/30">
                      {isEn
                        ? '✓ No urgent grievances reported. Apartment community order meets 5-star standards.'
                        : '✓ Không ghi nhận điểm nóng bức xúc nào. Tình hình trật tự chung cư đạt chuẩn xuất sắc.'}
                    </div>
                  ) : (
                    <ul className="space-y-1.5">
                      {sentimentReport.hotspots.map((hs, idx) => (
                        <li key={idx} className="text-xs text-rose-300 p-2.5 bg-rose-500/10 border border-rose-500/30 flex items-center gap-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                          <span>{hs}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Actionable Recommendations */}
                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-[#C5A880] uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
                    <span>
                      {isEn
                        ? 'Actionable Recommendations for Management'
                        : 'Đề Xuất Hành Động Cho Ban Quản Lý (Actionable Recommendations)'}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {sentimentReport.actionableRecommendations.map((rec, idx) => {
                      const localizedRec = isEn
                        ? rec === 'BQL có thể đăng thông báo định kỳ về kế hoạch bảo trì tháng để tăng kết nối với cư dân.'
                          ? 'Management may publish periodic maintenance notices to enhance resident engagement.'
                          : rec === 'Duy trì phản hồi tự động của Trợ lý AI để giải đáp thắc mắc cư dân tức thì.'
                          ? 'Maintain AI Concierge automated replies to promptly answer resident queries.'
                          : rec === 'Rà soát các góp ý về thời gian vận hành tiện ích chung để đề xuất biểu quyết hợp pháp.'
                          ? 'Review resident suggestions regarding facility operating hours for official polling.'
                          : rec
                        : rec;

                      return (
                        <div key={idx} className="text-xs text-gray-200 p-3 bg-[#141B24] border border-[#C5A880]/20 flex items-start gap-2.5">
                          <span className="w-5 h-5 bg-[#C5A880]/20 border border-[#C5A880]/40 text-[#C5A880] text-[10px] font-mono font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="leading-relaxed">{localizedRec}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setIsReportModalOpen(false)}
                    className="px-5 py-2.5 bg-[#C5A880] hover:bg-white text-[#0A0E14] font-bold text-xs uppercase tracking-wider transition-colors shadow"
                  >
                    {isEn ? 'Close Report' : 'Đóng Báo Cáo'}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
      {/* LIGHTBOX MODAL: FULL VIEW ATTACHED IMAGE */}
      {previewZoomImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer animate-fadeIn"
          onClick={() => setPreviewZoomImage(null)}
        >
          <div 
            className="relative max-w-4xl max-h-[90vh] border border-[#C5A880] bg-[#0E131B] p-2 shadow-2xl" 
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setPreviewZoomImage(null)}
              className="absolute -top-10 right-0 text-gray-300 hover:text-white p-2 flex items-center justify-center rounded-none bg-black/60 border border-gray-700"
              title="Đóng hình ảnh"
            >
              <X className="w-5 h-5" />
            </button>
            <img 
              src={previewZoomImage} 
              alt="Hình ảnh đính kèm" 
              className="max-w-full max-h-[82vh] object-contain mx-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
}
