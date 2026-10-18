/**
 * SKYLINE SMART RESIDENCE — COMMUNITY FORUM & POLLING STORE
 * Architecture: Ponytail Minimalist + Graphify Data Store
 * 100% DỮ LIỆU THỰC TẾ — KHÔNG DỮ LIỆU ẢO / KHÔNG BÀI VIẾT MOCK
 * Tích hợp lõi AI: Google Gemini Auto-Moderation, Sentiment Scoring,
 * Hotspot Detection & AI Concierge Community Quick Reply.
 */

import { UserRole } from './dataStore';

export type PostCategory = 'ANNOUNCEMENT' | 'VOTING' | 'MARKETPLACE' | 'DISCUSSION';

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface PollVoter {
  aptCode: string;
  voterName: string;
  optionId: string;
  votedAt: string;
}

export interface PostComment {
  id: string;
  authorName: string;
  authorRole: UserRole | 'STAFF' | string;
  aptCode?: string;
  avatarUrl?: string;
  content: string;
  createdAt: string;
  aiModeration?: 'Clean' | 'Warning' | 'Toxic';
}

export interface CommunityPost {
  id: string;
  code?: string; // VD: BQ-2026-01 cho biểu quyết
  category: PostCategory;
  authorName: string;
  authorRole: UserRole | 'STAFF' | string;
  aptCode?: string;
  avatarUrl?: string;
  title: string;
  content: string;
  tags: string[];
  isPinned?: boolean;
  createdAt: string;
  likes: string[]; // Danh sách mã căn hộ thực tế đã bấm thích
  comments: PostComment[]; // Danh sách bình luận thực tế
  // AI Attributes
  aiModeration: 'Clean' | 'Warning' | 'Toxic';
  aiModerationReason?: string;
  aiSentiment: number; // -1.0 to 1.0
  aiSentimentLabel: 'Tích cực' | 'Trung lập' | 'Góp ý' | 'Bức xúc';
  isHotspot?: boolean; // Cờ cảnh báo điểm nóng bức xúc cho BQL
  aiQuickReply?: string; // Trợ lý AI tự động phản hồi thắc mắc về nội quy/giờ giấc
  // Poll / Voting attributes
  poll?: {
    deadline: string;
    isOwnerOnly: boolean;
    status: 'OPEN' | 'CLOSED';
    totalEligibleApartments: number;
    options: PollOption[];
    voters: PollVoter[];
  };
}

export interface CommunitySentimentReport {
  summary: string;
  hotspots: string[];
  actionableRecommendations: string[];
  overallSatisfactionScore: number;
  analyzedAt: string;
}

const STORAGE_KEY = 'skyline_community_posts_real_v4';
const EVENT_NAME = 'skyline_community_updated';

// Mặc định hoàn toàn sạch — 0 bài viết ảo, 0 bình luận ảo, 0 vote ảo
export const OFFICIAL_COMMUNITY_TOPICS: CommunityPost[] = [];

// Phân tích từ ngữ kiểm duyệt & cảm xúc cục bộ bằng quy tắc xác định (Deterministic Engine)
export function analyzePostWithAi(text: string): {
  moderation: 'Clean' | 'Warning' | 'Toxic';
  moderationReason?: string;
  sentiment: number;
  sentimentLabel: 'Tích cực' | 'Trung lập' | 'Góp ý' | 'Bức xúc';
  isHotspot: boolean;
  aiQuickReply?: string;
} {
  const lower = text.toLowerCase();
  const toxicKeywords = ['lừa đảo', 'chửi', 'đập phá', 'cứt', 'đụ', 'địt', 'chó đẻ', 'bố láo', 'mẹ kiếp'];
  const hotspotKeywords = ['quá tệ', 'bức xúc', 'mất nước', 'cúp điện', 'cháy nổ', 'rò rỉ', 'hỏng hoài', 'bảo vệ dọa', 'nguy hiểm'];
  const positiveKeywords = ['tuyệt vời', 'cảm ơn', 'hài lòng', 'nhanh nhẹn', 'ủng hộ', 'đẹp', 'chu đáo', 'tốt'];
  const suggestionKeywords = ['đề xuất', 'góp ý', 'nên', 'cần xem xét', 'mong bql', 'cải thiện'];

  const isToxic = toxicKeywords.some(k => lower.includes(k));
  if (isToxic) {
    return {
      moderation: 'Toxic',
      moderationReason: 'Nội dung chứa từ ngữ công kích hoặc vi phạm chuẩn mực văn minh cộng đồng.',
      sentiment: -0.95,
      sentimentLabel: 'Bức xúc',
      isHotspot: true,
    };
  }

  const isHotspot = hotspotKeywords.some(k => lower.includes(k));
  let score = 0.5;
  if (positiveKeywords.some(k => lower.includes(k))) score += 0.35;
  if (suggestionKeywords.some(k => lower.includes(k))) score += 0.15;
  if (isHotspot) score -= 0.5;

  score = Math.max(-1, Math.min(1, score));

  let label: 'Tích cực' | 'Trung lập' | 'Góp ý' | 'Bức xúc' = 'Trung lập';
  if (score >= 0.7) label = 'Tích cực';
  else if (score >= 0.5) label = 'Góp ý';
  else if (score < 0.2) label = 'Bức xúc';

  let quickReply: string | undefined = undefined;
  if (lower.includes('hồ bơi') || lower.includes('bơi')) {
    quickReply = 'Hồ bơi vô cực (Tầng 25) và Cụm hồ bơi resort nội khu The Tropical mở cửa từ 06:00 - 22:00 hàng ngày, miễn phí vào tự do bằng FaceID/Thẻ cư dân.';
  } else if (lower.includes('gym') || lower.includes('phòng tập')) {
    quickReply = 'Trung tâm thể hình Technogym (Tầng 3) mở cửa 24/7 suốt ngày đêm, phục vụ miễn phí cho toàn thể cư dân.';
  } else if (lower.includes('bbq') || lower.includes('xông hơi') || lower.includes('sauna')) {
    quickReply = 'Vườn nướng BBQ chân mây (17:00-23:00) và Phòng xông hơi VIP (08:00-22:00) là tiện ích riêng tư, Quý cư dân vui lòng đặt trước tại tab Tiện Ích để giữ chỗ.';
  } else if (lower.includes('hotline') || lower.includes('bảo vệ') || lower.includes('số điện thoại')) {
    quickReply = 'Hotline Ban Quản Lý túc trực 24/7: 1900 8899. Quầy Lễ tân tiếp dân đặt tại Sảnh Grand Lobby Tầng 1.';
  }

  return {
    moderation: isHotspot ? 'Warning' : 'Clean',
    sentiment: score,
    sentimentLabel: label,
    isHotspot,
    aiQuickReply: quickReply,
  };
}

/**
 * Lấy toàn bộ danh sách bài viết diễn đàn thực tế
 */
export function getCommunityPosts(): CommunityPost[] {
  if (typeof window === 'undefined') return [];
  try {
    localStorage.removeItem('skyline_community_posts_v1');
    localStorage.removeItem('skyline_community_posts_v2');
    localStorage.removeItem('skyline_community_posts_clean_v3');

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((post: CommunityPost) => {
        if (!post.poll) return post;
        const voters = Array.isArray(post.poll.voters) ? post.poll.voters : [];
        return {
          ...post,
          poll: {
            ...post.poll,
            options: (post.poll.options || []).map(opt => ({
              ...opt,
              votes: voters.filter(v => v.optionId === opt.id).length,
            })),
          },
        };
      });
    }
    return [];
  } catch {
    return [];
  }
}

function saveCommunityPosts(posts: CommunityPost[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: posts }));
  } catch (e) {
    console.error('Failed to save community posts', e);
  }
}

/**
 * Đăng bài viết mới kết hợp gọi Google Gemini AI phân tích bất đồng bộ
 */
export async function createCommunityPostWithAi(
  newPost: Omit<CommunityPost, 'id' | 'createdAt' | 'likes' | 'comments' | 'aiModeration' | 'aiSentiment' | 'aiSentimentLabel'>
): Promise<CommunityPost> {
  const posts = getCommunityPosts();
  let aiData: any = null;

  try {
    const res = await fetch('/api/ai/community-assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'ANALYZE_POST',
        title: newPost.title,
        content: newPost.content,
        authorRole: newPost.authorRole,
        aptCode: newPost.aptCode,
      }),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        aiData = json.data;
      }
    }
  } catch (e) {
    console.warn('API AI Community call failed, using deterministic local engine:', e);
  }

  // Fallback to local analysis if API fails
  if (!aiData) {
    aiData = analyzePostWithAi(`${newPost.title} ${newPost.content}`);
  }

  const post: CommunityPost = {
    ...newPost,
    id: `post-${Date.now()}`,
    createdAt: new Date().toISOString(),
    likes: [],
    comments: [],
    aiModeration: aiData.moderation || 'Clean',
    aiModerationReason: aiData.moderationReason,
    aiSentiment: typeof aiData.sentiment === 'number' ? aiData.sentiment : 0.5,
    aiSentimentLabel: aiData.sentimentLabel || 'Trung lập',
    isHotspot: !!aiData.isHotspot,
    aiQuickReply: aiData.aiQuickReply || undefined,
  };

  const updated = [post, ...posts];
  saveCommunityPosts(updated);
  return post;
}

/**
 * Đăng bài viết đồng bộ dự phòng
 */
export function createCommunityPost(
  newPost: Omit<CommunityPost, 'id' | 'createdAt' | 'likes' | 'comments' | 'aiModeration' | 'aiSentiment' | 'aiSentimentLabel'>
): CommunityPost {
  const posts = getCommunityPosts();
  const aiResult = analyzePostWithAi(`${newPost.title} ${newPost.content}`);

  const post: CommunityPost = {
    ...newPost,
    id: `post-${Date.now()}`,
    createdAt: new Date().toISOString(),
    likes: [],
    comments: [],
    aiModeration: aiResult.moderation,
    aiModerationReason: aiResult.moderationReason,
    aiSentiment: aiResult.sentiment,
    aiSentimentLabel: aiResult.sentimentLabel,
    isHotspot: aiResult.isHotspot,
    aiQuickReply: aiResult.aiQuickReply,
  };

  const updated = [post, ...posts];
  saveCommunityPosts(updated);
  return post;
}

/**
 * Lấy Báo Cáo Cảm Xúc & Khuyến Nghị Hành Động AI cho Ban Quản Lý
 */
export async function fetchCommunitySentimentReport(): Promise<CommunitySentimentReport> {
  const posts = getCommunityPosts();

  try {
    const res = await fetch('/api/ai/community-assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'COMMUNITY_REPORT',
        posts,
      }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return {
          ...json.data,
          analyzedAt: new Date().toISOString(),
        };
      }
    }
  } catch (e) {
    console.warn('Failed to fetch AI community report:', e);
  }

  // Local fallback report
  const hotspotCount = posts.filter(p => p.isHotspot).length;
  return {
    summary: posts.length === 0
      ? 'Chưa ghi nhận phản hồi tiêu cực nào. Diễn đàn cư dân hoạt động ổn định và văn minh.'
      : `Đã tổng hợp ý kiến từ ${posts.length} bài viết cư dân. Có ${hotspotCount} điểm nóng cần BQL lưu tâm.`,
    hotspots: posts.filter(p => p.isHotspot).map(p => p.title),
    actionableRecommendations: [
      'Duy trì phản hồi tự động của Trợ lý AI để giải đáp thắc mắc cư dân tức thì.',
      'Rà soát các góp ý về thời gian vận hành tiện ích chung để đề xuất biểu quyết hợp pháp.',
    ],
    overallSatisfactionScore: posts.length === 0 ? 98 : Math.max(70, Math.round(95 - hotspotCount * 8)),
    analyzedAt: new Date().toISOString(),
  };
}

/**
 * Thả tim / Bỏ thích bài viết theo mã căn hộ thực tế
 */
export function toggleLikeCommunityPost(postId: string, aptCode: string): boolean {
  const posts = getCommunityPosts();
  const idx = posts.findIndex(p => p.id === postId);
  if (idx === -1) return false;

  const post = { ...posts[idx] };
  const targetCode = aptCode.trim().toUpperCase();
  const exists = post.likes.some(c => c.trim().toUpperCase() === targetCode);

  if (exists) {
    post.likes = post.likes.filter(c => c.trim().toUpperCase() !== targetCode);
  } else {
    post.likes = [...post.likes, targetCode];
  }

  posts[idx] = post;
  saveCommunityPosts(posts);
  return !exists;
}

/**
 * Thêm bình luận thực tế vào bài viết (tự động phân tích từ ngữ kiểm duyệt)
 */
export function addCommentToPost(postId: string, comment: Omit<PostComment, 'id' | 'createdAt'>): PostComment | null {
  const posts = getCommunityPosts();
  const idx = posts.findIndex(p => p.id === postId);
  if (idx === -1) return null;

  const aiCheck = analyzePostWithAi(comment.content);

  const newComment: PostComment = {
    ...comment,
    id: `cmt-${Date.now()}`,
    createdAt: new Date().toISOString(),
    aiModeration: aiCheck.moderation,
  };

  posts[idx] = {
    ...posts[idx],
    comments: [...posts[idx].comments, newComment],
  };

  saveCommunityPosts(posts);
  return newComment;
}

/**
 * Bỏ phiếu biểu quyết thực tế (100% minh bạch - lưu định danh căn hộ & người vote)
 */
export function castCommunityPollVote(params: {
  postId: string;
  optionId: string;
  aptCode: string;
  voterName: string;
  isOwner: boolean;
}): { success: boolean; message: string } {
  const posts = getCommunityPosts();
  const idx = posts.findIndex(p => p.id === params.postId);
  if (idx === -1) return { success: false, message: 'Bài viết không tồn tại.' };

  const post = { ...posts[idx] };
  if (!post.poll) return { success: false, message: 'Bài viết không có cuộc biểu quyết.' };
  if (post.poll.status === 'CLOSED') return { success: false, message: 'Cuộc biểu quyết này đã kết thúc.' };

  if (post.poll.isOwnerOnly && !params.isOwner) {
    return {
      success: false,
      message: 'Cuộc biểu quyết pháp lý này yêu cầu quyền Chủ Hộ căn hộ (Owner). Tài khoản Người nhà / Khách thuê không được quyền bỏ phiếu.',
    };
  }

  const cleanApt = params.aptCode.trim().toUpperCase();
  const poll = { ...post.poll };
  const voters = Array.isArray(poll.voters) ? [...poll.voters] : [];
  const existingVoterIdx = voters.findIndex(v => v.aptCode.trim().toUpperCase() === cleanApt);

  if (existingVoterIdx !== -1) {
    const oldOptionId = voters[existingVoterIdx].optionId;
    if (oldOptionId === params.optionId) {
      return { success: false, message: `Căn hộ ${cleanApt} đã chọn phương án này trước đó.` };
    }
    voters[existingVoterIdx] = {
      aptCode: cleanApt,
      voterName: params.voterName,
      optionId: params.optionId,
      votedAt: new Date().toISOString(),
    };
  } else {
    voters.push({
      aptCode: cleanApt,
      voterName: params.voterName,
      optionId: params.optionId,
      votedAt: new Date().toISOString(),
    });
  }

  poll.voters = voters;
  poll.options = poll.options.map(opt => ({
    ...opt,
    votes: voters.filter(v => v.optionId === opt.id).length,
  }));

  post.poll = poll;
  posts[idx] = post;
  saveCommunityPosts(posts);

  return { success: true, message: `Căn hộ ${cleanApt} đã ghi nhận biểu quyết thành công!` };
}

/**
 * Xóa bài viết khỏi diễn đàn
 */
export function deleteCommunityPost(postId: string): boolean {
  const posts = getCommunityPosts();
  const filtered = posts.filter(p => p.id !== postId);
  if (filtered.length === posts.length) return false;
  saveCommunityPosts(filtered);
  return true;
}
