/**
 * SKYLINE SMART RESIDENCE — COMMUNITY FORUM & POLLING STORE
 * Architecture: Ponytail Minimalist + Graphify Data Store
 * 100% DỮ LIỆU THỰC TẾ — KHÔNG DỮ LIỆU ẢO / KHÔNG BÀI VIẾT MOCK
 * Toàn bộ bài đăng, bình luận, lượt thích và lá phiếu đều xuất phát từ người dùng thực tế.
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
  aiModeration: 'Clean' | 'Flagged';
  aiSentiment: number; // -1.0 to 1.0
  aiSentimentLabel: 'Tích cực' | 'Trung lập' | 'Góp ý' | 'Bức xúc';
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

const STORAGE_KEY = 'skyline_community_posts_real_v4';
const EVENT_NAME = 'skyline_community_updated';

// Mặc định hoàn toàn sạch — 0 bài viết ảo, 0 bình luận ảo, 0 vote ảo
export const OFFICIAL_COMMUNITY_TOPICS: CommunityPost[] = [];

// Phân tích từ ngữ kiểm duyệt & cảm xúc cục bộ bằng AI
export function analyzePostWithAi(text: string): {
  moderation: 'Clean' | 'Flagged';
  sentiment: number;
  sentimentLabel: 'Tích cực' | 'Trung lập' | 'Góp ý' | 'Bức xúc';
} {
  const lower = text.toLowerCase();
  const toxicKeywords = ['lừa đảo', 'chửi bới', 'đập phá', 'cứt', 'đụ', 'địt', 'chó đẻ'];
  const negativeKeywords = ['quá tệ', 'bức xúc', 'chậm trễ', 'hỏng hoài', 'bực mình', 'bẩn', 'ồn ào', 'thất vọng'];
  const suggestionKeywords = ['đề xuất', 'góp ý', 'nên', 'cần xem xét', 'mong bql', 'cải thiện'];
  const positiveKeywords = ['tuyệt vời', 'cảm ơn', 'hài lòng', 'nhanh nhẹn', 'ủng hộ', 'đẹp', 'chu đáo', 'tốt'];

  let isToxic = toxicKeywords.some(k => lower.includes(k));
  if (isToxic) {
    return { moderation: 'Flagged', sentiment: -0.9, sentimentLabel: 'Bức xúc' };
  }

  let score = 0.5;
  if (positiveKeywords.some(k => lower.includes(k))) score += 0.35;
  if (suggestionKeywords.some(k => lower.includes(k))) score += 0.15;
  if (negativeKeywords.some(k => lower.includes(k))) score -= 0.45;

  score = Math.max(-1, Math.min(1, score));

  let label: 'Tích cực' | 'Trung lập' | 'Góp ý' | 'Bức xúc' = 'Trung lập';
  if (score >= 0.7) label = 'Tích cực';
  else if (score >= 0.5) label = 'Góp ý';
  else if (score < 0.2) label = 'Bức xúc';

  return { moderation: 'Clean', sentiment: score, sentimentLabel: label };
}

/**
 * Lấy toàn bộ danh sách bài viết diễn đàn thực tế
 * Không bao giờ tự động tạo bài viết giả / mock
 */
export function getCommunityPosts(): CommunityPost[] {
  if (typeof window === 'undefined') return [];
  try {
    // Dọn dẹp sạch toàn bộ các key cache mock dữ liệu cũ
    localStorage.removeItem('skyline_community_posts_v1');
    localStorage.removeItem('skyline_community_posts_v2');
    localStorage.removeItem('skyline_community_posts_clean_v3');

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Đảm bảo tính toán chính xác 100% từ danh sách cử tri thực tế (KHÔNG DỮ LIỆU ẢO)
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
 * Đăng bài viết mới lên diễn đàn (Lưu trực tiếp vào Store thực tế)
 */
export function createCommunityPost(newPost: Omit<CommunityPost, 'id' | 'createdAt' | 'likes' | 'comments' | 'aiModeration' | 'aiSentiment' | 'aiSentimentLabel'>): CommunityPost {
  const posts = getCommunityPosts();
  const aiResult = analyzePostWithAi(`${newPost.title} ${newPost.content}`);

  const post: CommunityPost = {
    ...newPost,
    id: `post-${Date.now()}`,
    createdAt: new Date().toISOString(),
    likes: [],
    comments: [],
    aiModeration: aiResult.moderation,
    aiSentiment: aiResult.sentiment,
    aiSentimentLabel: aiResult.sentimentLabel,
  };

  const updated = [post, ...posts];
  saveCommunityPosts(updated);
  return post;
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
 * Thêm bình luận thực tế vào bài viết
 */
export function addCommentToPost(postId: string, comment: Omit<PostComment, 'id' | 'createdAt'>): PostComment | null {
  const posts = getCommunityPosts();
  const idx = posts.findIndex(p => p.id === postId);
  if (idx === -1) return null;

  const newComment: PostComment = {
    ...comment,
    id: `cmt-${Date.now()}`,
    createdAt: new Date().toISOString(),
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
    // Cập nhật phương án mới
    voters[existingVoterIdx] = {
      aptCode: cleanApt,
      voterName: params.voterName,
      optionId: params.optionId,
      votedAt: new Date().toISOString(),
    };
  } else {
    // Cử tri mới bỏ phiếu
    voters.push({
      aptCode: cleanApt,
      voterName: params.voterName,
      optionId: params.optionId,
      votedAt: new Date().toISOString(),
    });
  }

  poll.voters = voters;
  // Tính lại số phiếu trực tiếp từ voters (chống hoàn toàn lệch số liệu)
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
