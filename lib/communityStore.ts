/**
 * SKYLINE SMART RESIDENCE — COMMUNITY FORUM & POLLING STORE
 * Architecture: Ponytail Minimalist + Graphify Data Store
 * 100% DỮ LIỆU THỰC TẾ — KHÔNG DỮ LIỆU ẢO / KHÔNG ẢNH UNSPLASH
 * Mọi số lượng like, comment, và lá phiếu đều được tính toán trực tiếp từ thao tác người dùng.
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
  code?: string; // e.g. BQ-2026-01 for voting
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
  likes: string[]; // Danh sách mã căn hộ hoặc User ID thực tế đã bấm thích (100% không like ảo)
  comments: PostComment[]; // Danh sách bình luận thực tế (100% không bình luận ảo)
  // AI Attributes
  aiModeration: 'Clean' | 'Flagged';
  aiSentiment: number; // -1.0 to 1.0
  aiSentimentLabel: 'Tích cực' | 'Trung lập' | 'Góp ý' | 'Bức xúc';
  // Poll / Voting attributes
  poll?: {
    deadline: string; // ISO date
    isOwnerOnly: boolean;
    status: 'OPEN' | 'CLOSED';
    totalEligibleApartments: number;
    options: PollOption[];
    voters: PollVoter[]; // Danh sách cử tri đã bỏ phiếu thực tế (100% không vote ảo)
  };
}

const STORAGE_KEY = 'skyline_community_posts_clean_v3';
const EVENT_NAME = 'skyline_community_updated';

// Default Official Building Announcements & Legal Polls (Sạch 100%, không like/vote/comment ảo)
export const OFFICIAL_COMMUNITY_TOPICS: CommunityPost[] = [
  {
    id: 'post-bql-01',
    code: 'TB-BQL-0826',
    category: 'ANNOUNCEMENT',
    authorName: 'Ban Quản Lý Chung Cư SKYLINE',
    authorRole: 'ADMIN',
    aptCode: 'BQL_OFFICE',
    avatarUrl: 'https://data.nks.vn/storage/users/default.png',
    title: 'Thông báo lịch bảo dưỡng định kỳ hệ thống thang máy Chung Cư BS-08',
    content: 'Ban Quản lý xin thông báo kế hoạch kiểm tra kỹ thuật định kỳ thang máy số 02 tại sảnh BS-08 vào ngày 28/08/2026 từ 09:00 - 11:30. Kính mong Quý cư dân ưu tiên sử dụng thang máy số 01 và 03 trong thời gian bảo trì.',
    tags: ['Thông báo BQL', 'Bảo trì', 'Thang máy', 'Tòa BS-08'],
    isPinned: true,
    createdAt: '2026-08-25T08:30:00',
    likes: [],
    comments: [],
    aiModeration: 'Clean',
    aiSentiment: 0.85,
    aiSentimentLabel: 'Tích cực',
  },
  {
    id: 'post-vote-01',
    code: 'BQ-2026-01',
    category: 'VOTING',
    authorName: 'Ban Quản Trị & Kỹ Thuật Tòa Nhà',
    authorRole: 'ADMIN',
    aptCode: 'BQL_OFFICE',
    avatarUrl: 'https://data.nks.vn/storage/users/default.png',
    title: 'Biểu quyết Thông qua Phương án Nâng cấp Hệ thống Camera AI Đọc Biển Số Hầm B1 - B2',
    content: 'Chiến dịch lấy ý kiến hợp pháp của các Chủ sở hữu căn hộ về việc trích Quỹ Bảo trì để trang bị camera AI LPR đọc biển số tự động tốc độ cao và mở rộng làn xe máy giờ cao điểm tại Hầm B1/B2 Tòa BS-07. Dự toán thực hiện: 150.000.000 VNĐ theo báo giá cạnh tranh minh bạch.',
    tags: ['Biểu quyết', 'Quỹ bảo trì', 'Camera AI', 'Hầm xe B1/B2'],
    isPinned: true,
    createdAt: '2026-08-20T08:00:00',
    likes: [],
    comments: [],
    aiModeration: 'Clean',
    aiSentiment: 0.82,
    aiSentimentLabel: 'Tích cực',
    poll: {
      deadline: '2026-10-30T23:59:59',
      isOwnerOnly: true,
      status: 'OPEN',
      totalEligibleApartments: 250,
      options: [
        { id: 'opt-1', text: 'Đồng ý thông qua phương án nâng cấp (Dự toán 150 triệu VNĐ từ Quỹ Bảo trì)', votes: 0 },
        { id: 'opt-2', text: 'Không đồng ý, giữ nguyên hiện trạng kiểm soát thẻ từ thủ công', votes: 0 },
        { id: 'opt-3', text: 'Đồng ý nhưng yêu cầu điều chỉnh giảm dự toán xuống dưới 120 triệu VNĐ', votes: 0 },
      ],
      voters: [],
    },
  },
  {
    id: 'post-vote-02',
    code: 'BQ-2026-02',
    category: 'VOTING',
    authorName: 'Bộ Phận Vận Hành Ban Quản Lý',
    authorRole: 'ADMIN',
    aptCode: 'BQL_OFFICE',
    avatarUrl: 'https://data.nks.vn/storage/users/default.png',
    title: 'Lấy ý kiến Điều chỉnh Giờ giấc Hoạt động Hồ Bơi Vô Cực & Phòng Gym đến 22:30',
    content: 'Theo đề xuất của cư dân về việc tăng thời gian tập luyện và thư giãn buổi tối sau giờ làm việc, Ban Quản Lý xin ý kiến biểu quyết kéo dài giờ hoạt động tiện ích nội khu đến 22:30 hàng ngày. Chi phí chiếu sáng và vệ sinh đã được cân đối trong ngân sách dịch vụ.',
    tags: ['Quy chế', 'Tiện ích', 'Hồ bơi', 'Gym'],
    isPinned: false,
    createdAt: '2026-09-01T08:00:00',
    likes: [],
    comments: [],
    aiModeration: 'Clean',
    aiSentiment: 0.78,
    aiSentimentLabel: 'Tích cực',
    poll: {
      deadline: '2026-10-25T23:59:59',
      isOwnerOnly: false,
      status: 'OPEN',
      totalEligibleApartments: 250,
      options: [
        { id: 'opt-2-1', text: 'Nhất trí kéo dài mở cửa đến 22:30 tất cả các ngày trong tuần', votes: 0 },
        { id: 'opt-2-2', text: 'Chỉ kéo dài đến 22:30 vào các ngày cuối tuần (Thứ Sáu, Thứ Bảy, Chủ Nhật)', votes: 0 },
        { id: 'opt-2-3', text: 'Giữ nguyên khung giờ đóng cửa lúc 22:00 để đảm bảo yên tĩnh cho cư dân các tầng thấp', votes: 0 },
      ],
      voters: [],
    },
  },
];

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
 * Lấy toàn bộ danh sách bài viết diễn đàn & biểu quyết
 * 100% dữ liệu thực tế: số vote luôn bằng số voter thực tế đã bầu.
 */
export function getCommunityPosts(): CommunityPost[] {
  if (typeof window === 'undefined') return OFFICIAL_COMMUNITY_TOPICS;
  try {
    // Tự động dọn dẹp các cache chứa dữ liệu ảo / mock cũ
    localStorage.removeItem('skyline_community_posts_v1');
    localStorage.removeItem('skyline_community_posts_v2');

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(OFFICIAL_COMMUNITY_TOPICS));
      return OFFICIAL_COMMUNITY_TOPICS;
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
    return OFFICIAL_COMMUNITY_TOPICS;
  } catch {
    return OFFICIAL_COMMUNITY_TOPICS;
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

/**
 * Reset sạch toàn bộ diễn đàn về dữ liệu gốc Ban Quản Lý (Xóa toàn bộ bài rác/dữ liệu ảo)
 */
export function resetCommunityToCleanData(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(OFFICIAL_COMMUNITY_TOPICS));
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: OFFICIAL_COMMUNITY_TOPICS }));
}
