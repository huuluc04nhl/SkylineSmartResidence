/**
 * SKYLINE SMART RESIDENCE — COMMUNITY FORUM & POLLING STORE
 * Architecture: Ponytail Minimalist + Graphify Data Store
 * Manages resident discussions, marketplace posts, management announcements,
 * and interactive voting/surveys with real-time localStorage sync.
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
  likes: string[]; // List of aptCodes or userIds who liked
  comments: PostComment[];
  // AI Attributes
  aiModeration: 'Clean' | 'Flagged';
  aiSentiment: number; // -1.0 to 1.0
  aiSentimentLabel: 'Tích cực' | 'Trung lập' | 'Góp ý' | 'Bức xúc';
  // Poll / Voting attributes (optional if category is VOTING or has poll)
  poll?: {
    deadline: string; // ISO date
    isOwnerOnly: boolean;
    status: 'OPEN' | 'CLOSED';
    totalEligibleApartments: number;
    options: PollOption[];
    voters: PollVoter[];
  };
}

const STORAGE_KEY = 'skyline_community_posts_v2';
const EVENT_NAME = 'skyline_community_updated';

export const INITIAL_COMMUNITY_POSTS: CommunityPost[] = [
  {
    id: 'post-bql-01',
    code: 'TB-BQL-0826',
    category: 'ANNOUNCEMENT',
    authorName: 'Ban Quản Lý Chung Cư SKYLINE',
    authorRole: 'ADMIN',
    aptCode: 'BQL_OFFICE',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    title: 'Thông báo lịch bảo dưỡng định kỳ hệ thống thang máy Chung Cư BS-08',
    content: 'Ban Quản lý xin thông báo kế hoạch kiểm tra kỹ thuật định kỳ thang máy số 02 tại sảnh BS-08 vào ngày 28/08/2026 từ 09:00 - 11:30. Kính mong Quý cư dân ưu tiên sử dụng thang máy số 01 và 03 trong thời gian bảo trì.',
    tags: ['Thông báo BQL', 'Bảo trì', 'Thang máy', 'Tòa BS-08'],
    isPinned: true,
    createdAt: '2026-08-25T08:30:00',
    likes: ['CH-06', '12A05', '18A01', '08B02'],
    comments: [
      {
        id: 'cmt-1',
        authorName: 'Trần Hữu Lực',
        authorRole: 'OWNER',
        aptCode: 'CH-06',
        content: 'Cảm ơn BQL đã thông báo sớm để cư dân chủ động giờ đi làm buổi sáng.',
        createdAt: '2026-08-25T09:15:00',
      },
    ],
    aiModeration: 'Clean',
    aiSentiment: 0.88,
    aiSentimentLabel: 'Tích cực',
  },
  {
    id: 'post-vote-01',
    code: 'BQ-2026-01',
    category: 'VOTING',
    authorName: 'Ban Quản Trị & Kỹ Thuật Tòa Nhà',
    authorRole: 'ADMIN',
    aptCode: 'BQL_OFFICE',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    title: 'Biểu quyết Thông qua Phương án Nâng cấp Hệ thống Camera AI Đọc Biển Số Hầm B1 - B2',
    content: 'Chiến dịch lấy ý kiến hợp pháp của các Chủ sở hữu căn hộ về việc trích Quỹ Bảo trì để trang bị camera AI LPR đọc biển số tự động tốc độ cao và mở rộng làn xe máy giờ cao điểm tại Hầm B1/B2 Tòa BS-07. Dự toán thực hiện: 150.000.000 VNĐ theo báo giá cạnh tranh minh bạch.',
    tags: ['Biểu quyết', 'Quỹ bảo trì', 'Camera AI', 'Hầm xe B1/B2'],
    isPinned: true,
    createdAt: '2026-08-20T08:00:00',
    likes: ['CH-06', '12A05', '15B03'],
    comments: [
      {
        id: 'cmt-vote-1',
        authorName: 'Lê Hoàng Nam',
        authorRole: 'OWNER',
        aptCode: '18A01',
        content: 'Rất ủng hộ phương án này, giờ cao điểm hầm B1 hay bị ùn ứ quét thẻ thủ công.',
        createdAt: '2026-08-20T10:20:00',
      },
    ],
    aiModeration: 'Clean',
    aiSentiment: 0.82,
    aiSentimentLabel: 'Tích cực',
    poll: {
      deadline: '2026-10-30T23:59:59',
      isOwnerOnly: true,
      status: 'OPEN',
      totalEligibleApartments: 250,
      options: [
        { id: 'opt-1', text: 'Đồng ý thông qua phương án nâng cấp (Dự toán 150 triệu VNĐ)', votes: 142 },
        { id: 'opt-2', text: 'Không đồng ý, giữ nguyên hiện trạng barrier thẻ từ', votes: 16 },
        { id: 'opt-3', text: 'Cần họp cư dân bổ sung phương án nhà thầu khác', votes: 8 },
      ],
      voters: [
        { aptCode: 'CH-06', voterName: 'Trần Hữu Lực', optionId: 'opt-1', votedAt: '2026-08-21T09:00:00' },
        { aptCode: '18A01', voterName: 'Lê Hoàng Nam', optionId: 'opt-1', votedAt: '2026-08-21T11:30:00' },
      ],
    },
  },
  {
    id: 'post-market-01',
    category: 'MARKETPLACE',
    authorName: 'Trần Hữu Lực',
    authorRole: 'OWNER',
    aptCode: 'CH-06',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
    title: 'Trao đổi lại bộ bàn ghế đọc sách ban công bằng gỗ sồi còn mới 95%',
    content: 'Gia đình mình vừa thay đổi thiết kế nội thất nên muốn nhượng lại bộ bàn ghế ban công bằng gỗ sồi tự nhiên chống ẩm cho bác nào có nhu cầu. Bác nào quan tâm có thể nhắn tin hoặc qua xem trực tiếp tại căn CH-06 tầng 30 nhé!',
    tags: ['Rao vặt', 'Nội thất', 'Ban công', 'Căn CH-06'],
    isPinned: false,
    createdAt: '2026-08-26T11:30:00',
    likes: ['12A05', '09C01'],
    comments: [
      {
        id: 'cmt-market-1',
        authorName: 'Nguyễn Văn Thịnh',
        authorRole: 'TENANT',
        aptCode: '12A05',
        content: 'Bác Lực ơi cho em hỏi kích thước bàn đường kính bao nhiêu ạ? Tối nay em qua xem được không?',
        createdAt: '2026-08-26T12:05:00',
      },
      {
        id: 'cmt-market-2',
        authorName: 'Trần Hữu Lực',
        authorRole: 'OWNER',
        aptCode: 'CH-06',
        content: 'Bàn tròn đường kính 60cm gọn nhẹ nhé Thịnh. Tối sau 19h bác ở nhà, cứ bấm chuông số 30 nhé.',
        createdAt: '2026-08-26T12:15:00',
      },
    ],
    aiModeration: 'Clean',
    aiSentiment: 0.95,
    aiSentimentLabel: 'Tích cực',
  },
  {
    id: 'post-discuss-01',
    category: 'DISCUSSION',
    authorName: 'Phạm Thị Mai',
    authorRole: 'OWNER',
    aptCode: '15B03',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
    title: 'Góp ý: Kéo dài giờ hoạt động Hồ bơi vô cực & Phòng Gym đến 22:30',
    content: 'Sau giờ làm về tầm 19h30 ăn uống xong thì 21h hồ bơi chuẩn bị đóng cửa nên nhiều cư dân đi làm văn phòng khó sắp xếp giờ bơi. Em đề xuất BQL xem xét kéo dài giờ mở cửa đến 22:30 vào các ngày trong tuần được không ạ?',
    tags: ['Góp ý', 'Hồ bơi', 'Gym', 'Tiện ích'],
    isPinned: false,
    createdAt: '2026-08-27T14:00:00',
    likes: ['CH-06', '12A05', '18A01', '15B03', '21A04'],
    comments: [
      {
        id: 'cmt-disc-1',
        authorName: 'Ban Quản Lý Chung Cư SKYLINE',
        authorRole: 'ADMIN',
        aptCode: 'BQL_OFFICE',
        content: 'Chào chị Mai! BQL ghi nhận đề xuất này và sẽ phối hợp đội kỹ thuật kiểm tra ca trực cứu hộ hồ bơi để trình biểu quyết cư dân trong kỳ tới.',
        createdAt: '2026-08-27T15:10:00',
      },
    ],
    aiModeration: 'Clean',
    aiSentiment: 0.65,
    aiSentimentLabel: 'Góp ý',
    poll: {
      deadline: '2026-09-30T23:59:59',
      isOwnerOnly: false,
      status: 'OPEN',
      totalEligibleApartments: 250,
      options: [
        { id: 'opt-d1', text: 'Đồng ý mở hồ bơi & gym đến 22:30 hàng ngày', votes: 89 },
        { id: 'opt-d2', text: 'Chỉ kéo dài vào các ngày cuối tuần (T6 - CN)', votes: 34 },
        { id: 'opt-d3', text: 'Giữ nguyên khung giờ 06:00 - 22:00 để giữ yên tĩnh', votes: 12 },
      ],
      voters: [
        { aptCode: 'CH-06', voterName: 'Trần Hữu Lực', optionId: 'opt-d1', votedAt: '2026-08-27T16:00:00' },
      ],
    },
  },
];

// Helper to analyze text sentiment & moderation locally
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

  let score = 0.5; // neutral base
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

export function getCommunityPosts(): CommunityPost[] {
  if (typeof window === 'undefined') return INITIAL_COMMUNITY_POSTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_COMMUNITY_POSTS));
      return INITIAL_COMMUNITY_POSTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_COMMUNITY_POSTS;
  } catch {
    return INITIAL_COMMUNITY_POSTS;
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
  const existingVoterIdx = poll.voters.findIndex(v => v.aptCode.trim().toUpperCase() === cleanApt);

  if (existingVoterIdx !== -1) {
    const oldOptionId = poll.voters[existingVoterIdx].optionId;
    if (oldOptionId === params.optionId) {
      return { success: false, message: 'Căn hộ của bạn đã bỏ phiếu cho phương án này.' };
    }
    // Change vote
    poll.options = poll.options.map(opt => {
      if (opt.id === oldOptionId) return { ...opt, votes: Math.max(0, opt.votes - 1) };
      if (opt.id === params.optionId) return { ...opt, votes: opt.votes + 1 };
      return opt;
    });
    poll.voters[existingVoterIdx] = {
      aptCode: cleanApt,
      voterName: params.voterName,
      optionId: params.optionId,
      votedAt: new Date().toISOString(),
    };
  } else {
    // New vote
    poll.options = poll.options.map(opt => {
      if (opt.id === params.optionId) return { ...opt, votes: opt.votes + 1 };
      return opt;
    });
    poll.voters = [
      ...poll.voters,
      {
        aptCode: cleanApt,
        voterName: params.voterName,
        optionId: params.optionId,
        votedAt: new Date().toISOString(),
      },
    ];
  }

  post.poll = poll;
  posts[idx] = post;
  saveCommunityPosts(posts);

  return { success: true, message: `Bỏ phiếu thành công cho căn hộ ${cleanApt}!` };
}

export function deleteCommunityPost(postId: string): boolean {
  const posts = getCommunityPosts();
  const filtered = posts.filter(p => p.id !== postId);
  if (filtered.length === posts.length) return false;
  saveCommunityPosts(filtered);
  return true;
}
