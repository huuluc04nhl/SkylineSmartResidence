/**
 * Skyline Smart Residence - Centralized Voting & Polling Store
 * 
 * Quản trị dữ liệu Biểu Quyết & Lấy Ý Kiến Cư Dân:
 * - Lưu trữ danh sách các cuộc biểu quyết hợp pháp của Tòa nhà
 * - Quản lý lá phiếu của từng căn hộ (Mã căn, người biểu quyết, thời gian)
 * - Cập nhật tỷ lệ phiếu thời gian thực và đồng bộ hai chiều giữa Ban Quản Lý & Cư Dân
 */

export type VotingLegalType = 
  | 'Bầu Ban Quản Trị' 
  | 'Đóng góp Quỹ Bảo trì' 
  | 'Ý kiến Cải tạo' 
  | 'Quy Chế Chung Cư' 
  | 'Tiện Ích & Dịch Vụ';

export interface VotingOption {
  id: string;
  text: string;
  votes: number;
}

export interface VoterRecord {
  aptCode: string;
  voterName: string;
  optionId: string;
  votedAt: string;
}

export interface VotingTopic {
  id: string;
  code: string; // VD: BQ-2026-01
  title: string;
  description: string;
  legalType: VotingLegalType;
  createdBy: string;
  createdAt: string;
  deadline: string; // ISO String
  status: 'OPEN' | 'CLOSED';
  isOwnerOnly: boolean;
  options: VotingOption[];
  totalVotes: number;
  totalEligibleApartments: number; // Tổng số căn hộ có quyền biểu quyết (VD: 250 căn)
  voters: VoterRecord[];
  summaryReport?: string;
}

const VOTING_STORAGE_KEY = 'skyline_voting_topics_v1';

export const INITIAL_VOTING_TOPICS: VotingTopic[] = [
  {
    id: 'vote-01',
    code: 'BQ-2026-01',
    title: 'Biểu quyết Thông qua Phương án Nâng cấp Hệ thống Kiểm soát Xe Tự Động Hầm B1 - B2',
    description: 'Chiến dịch lấy ý kiến hợp pháp của các Chủ sở hữu căn hộ về việc trích Quỹ Bảo trì để trang bị camera AI đọc biển số tự động tốc độ cao và mở rộng làn xe máy giờ cao điểm. Dự toán thực hiện: 150.000.000 VNĐ theo báo giá cạnh tranh.',
    legalType: 'Đóng góp Quỹ Bảo trì',
    createdBy: 'Ban Quản Trị & Kỹ Thuật Tòa Nhà',
    createdAt: '2026-08-20T08:00:00',
    deadline: '2026-10-15T23:59:59',
    status: 'OPEN',
    isOwnerOnly: true,
    totalEligibleApartments: 250,
    totalVotes: 182,
    options: [
      { id: 'opt-1-1', text: 'Đồng ý phương án nâng cấp (Dự toán 150 triệu VNĐ từ Quỹ Bảo trì)', votes: 146 },
      { id: 'opt-1-2', text: 'Không đồng ý, giữ nguyên hiện trạng kiểm soát thủ công', votes: 24 },
      { id: 'opt-1-3', text: 'Đồng ý nhưng yêu cầu điều chỉnh giảm dự toán xuống dưới 120 triệu VNĐ', votes: 12 },
    ],
    voters: [
      {
        aptCode: '12A05',
        voterName: 'Nguyễn Hữu Lực',
        optionId: 'opt-1-1',
        votedAt: '2026-08-22T14:35:10',
      },
      {
        aptCode: '08A02',
        voterName: 'Trần Thị Bích Ngọc',
        optionId: 'opt-1-1',
        votedAt: '2026-08-23T09:12:44',
      },
      {
        aptCode: '18A01',
        voterName: 'Lê Hoàng Nam',
        optionId: 'opt-1-2',
        votedAt: '2026-08-24T18:40:02',
      },
    ],
    summaryReport: 'Hệ thống kiểm soát xe hiện tại vào giờ cao điểm (07:00 - 08:30) thường ùn ứ từ 3-5 phút. Việc nâng cấp cảm biến RFID tầm xa và camera AI YOLOv8 giúp giải phóng xe trong dưới 0.3s/lượt.',
  },
  {
    id: 'vote-02',
    code: 'BQ-2026-02',
    title: 'Lấy ý kiến Điều chỉnh Giờ giấc Vận hành Hồ Bơi Vô Cực Chân Mây Tầng 25 đến 22:30 Hàng Đêm',
    description: 'Theo đề xuất của cư dân về việc tăng thời gian bơi lội và thư giãn buổi tối sau giờ làm việc, Ban Quản Lý xin ý kiến biểu quyết kéo dài giờ mở cửa từ 21:30 sang 22:30 hàng ngày. Chi phí tăng ca nhân viên cứu hộ và hệ thống lọc nước đã được cân đối trong ngân sách dịch vụ.',
    legalType: 'Quy Chế Chung Cư',
    createdBy: 'Bộ Phận Dịch Vụ & Tiện Ích',
    createdAt: '2026-09-01T08:00:00',
    deadline: '2026-10-20T23:59:59',
    status: 'OPEN',
    isOwnerOnly: false,
    totalEligibleApartments: 250,
    totalVotes: 215,
    options: [
      { id: 'opt-2-1', text: 'Nhất trí kéo dài mở cửa đến 22:30 tất cả các ngày trong tuần', votes: 105 },
      { id: 'opt-2-2', text: 'Chỉ kéo dài đến 22:30 vào các ngày cuối tuần (Thứ Sáu, Thứ Bảy, Chủ Nhật)', votes: 68 },
      { id: 'opt-2-3', text: 'Giữ nguyên khung giờ đóng cửa lúc 21:30 để đảm bảo yên tĩnh cho tầng 24', votes: 42 },
    ],
    voters: [
      {
        aptCode: '12A05',
        voterName: 'Nguyễn Hữu Lực',
        optionId: 'opt-2-1',
        votedAt: '2026-09-03T20:15:30',
      },
    ],
    summaryReport: 'Đội ngũ cứu hộ cam kết bố trí 2 nhân sự trực hồ bơi liên tục trong suốt khung giờ mở rộng và đo kiểm nồng độ clo/pH định kỳ lúc 22:45.',
  },
  {
    id: 'vote-03',
    code: 'BQ-2026-03',
    title: 'Hội nghị Nhà Chung Cư: Lựa chọn Đơn vị Quản lý Vận hành Tòa Nhà Giai đoạn 2026 - 2028',
    description: 'Biểu quyết lựa chọn đơn vị trúng thầu cung cấp dịch vụ quản lý vận hành tòa nhà Skyline Smart Residence tiêu chuẩn 5 sao giữa các nhà thầu quốc tế và nội địa đã vượt qua vòng thẩm định hồ sơ năng lực.',
    legalType: 'Bầu Ban Quản Trị',
    createdBy: 'Hội Nghị Nhà Chung Cư',
    createdAt: '2026-09-05T09:00:00',
    deadline: '2026-10-30T23:59:59',
    status: 'OPEN',
    isOwnerOnly: true,
    totalEligibleApartments: 250,
    totalVotes: 198,
    options: [
      { id: 'opt-3-1', text: 'Công ty Quản Lý Bất Động Sản Skyline Living Pro (Giá thầu: 11.000 đ/m²)', votes: 98 },
      { id: 'opt-3-2', text: 'Tập đoàn Quản lý Bất động sản Savills Việt Nam (Giá thầu: 14.500 đ/m²)', votes: 54 },
      { id: 'opt-3-3', text: 'Công ty Cổ phần Dịch vụ Đô thị CBRE Property (Giá thầu: 13.800 đ/m²)', votes: 46 },
    ],
    voters: [],
    summaryReport: 'Toàn bộ hồ sơ đề xuất kỹ thuật, cam kết SLA bảo trì và báo cáo tài chính của 3 đơn vị đã được niêm yết công khai tại văn phòng Ban Quản Lý và trên cổng thông tin số.',
  },
  {
    id: 'vote-04',
    code: 'BQ-2026-04',
    title: 'Thông qua Chủ trương Lắp đặt Cụm Trạm Sạc Xe Điện Thông minh tại Hầm B1',
    description: 'Bình chọn phương án hợp tác lắp đặt 8 trụ sạc xe ô tô điện và 20 vị trí sạc xe máy điện công nghệ ngắt nguồn tự động khi đầy, tích hợp camera nhiệt và hệ thống chữa cháy aerosol chuyên dụng.',
    legalType: 'Ý kiến Cải tạo',
    createdBy: 'Ban Quản Trị Tòa Nhà',
    createdAt: '2026-07-15T08:00:00',
    deadline: '2026-08-30T23:59:59',
    status: 'CLOSED',
    isOwnerOnly: true,
    totalEligibleApartments: 250,
    totalVotes: 250,
    options: [
      { id: 'opt-4-1', text: 'Nhất trí thông qua phương án lắp đặt trạm sạc theo tiêu chuẩn an toàn PCCC', votes: 192 },
      { id: 'opt-4-2', text: 'Đồng ý nhưng yêu cầu chuyển trạm sạc ra khu vực sân ngoài trời', votes: 30 },
      { id: 'opt-4-3', text: 'Không đồng ý lắp đặt trạm sạc xe điện', votes: 28 },
    ],
    voters: [
      {
        aptCode: '12A05',
        voterName: 'Nguyễn Hữu Lực',
        optionId: 'opt-4-1',
        votedAt: '2026-08-01T10:00:00',
      },
    ],
    summaryReport: 'Cuộc biểu quyết đã kết thúc với 76.8% căn hộ tán thành. Dự án đã được Ban Quản Lý ký hợp đồng triển khai thi công và đưa vào vận hành từ tháng 09/2026.',
  },
];

function notifyVotingUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('skyline_voting_updated'));
  }
}

/**
 * Lấy toàn bộ danh sách cuộc biểu quyết
 */
export function getVotingTopics(): VotingTopic[] {
  if (typeof window === 'undefined') return INITIAL_VOTING_TOPICS;
  try {
    const raw = localStorage.getItem(VOTING_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(VOTING_STORAGE_KEY, JSON.stringify(INITIAL_VOTING_TOPICS));
      return INITIAL_VOTING_TOPICS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_VOTING_TOPICS;
  } catch {
    return INITIAL_VOTING_TOPICS;
  }
}

/**
 * Lấy chi tiết một cuộc biểu quyết theo ID
 */
export function getVotingTopicById(id: string): VotingTopic | undefined {
  return getVotingTopics().find(t => t.id === id);
}

/**
 * Lưu danh sách các cuộc biểu quyết
 */
export function saveVotingTopics(topics: VotingTopic[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(VOTING_STORAGE_KEY, JSON.stringify(topics));
    notifyVotingUpdated();
  }
}

/**
 * Cư dân / Chủ hộ thực hiện bỏ phiếu biểu quyết
 */
export function castVote(params: {
  topicId: string;
  aptCode: string;
  optionId: string;
  voterName: string;
}): { success: boolean; message: string; topic?: VotingTopic } {
  const topics = getVotingTopics();
  const cleanApt = params.aptCode.trim().toUpperCase();

  const targetIndex = topics.findIndex(t => t.id === params.topicId);
  if (targetIndex === -1) {
    return { success: false, message: 'Không tìm thấy cuộc biểu quyết yêu cầu.' };
  }

  const topic = topics[targetIndex];

  // Kiểm tra thời hạn
  if (topic.status === 'CLOSED' || new Date(topic.deadline) < new Date()) {
    return { success: false, message: 'Cuộc biểu quyết này đã kết thúc thời gian bình chọn.' };
  }

  const existingVoterIndex = topic.voters.findIndex(v => v.aptCode.trim().toUpperCase() === cleanApt);

  let updatedOptions = [...topic.options];
  let updatedTotalVotes = topic.totalVotes;
  let updatedVoters = [...topic.voters];

  if (existingVoterIndex !== -1) {
    // Đã biểu quyết trước đó -> Cập nhật lại lựa chọn
    const prevOptionId = topic.voters[existingVoterIndex].optionId;
    if (prevOptionId === params.optionId) {
      return { success: true, message: 'Lá phiếu của bạn đã được ghi nhận trước đó.', topic };
    }

    // Giảm phiếu cũ, tăng phiếu mới
    updatedOptions = updatedOptions.map(opt => {
      if (opt.id === prevOptionId) {
        return { ...opt, votes: Math.max(0, opt.votes - 1) };
      }
      if (opt.id === params.optionId) {
        return { ...opt, votes: opt.votes + 1 };
      }
      return opt;
    });

    updatedVoters[existingVoterIndex] = {
      aptCode: cleanApt,
      voterName: params.voterName,
      optionId: params.optionId,
      votedAt: new Date().toISOString(),
    };
  } else {
    // Biểu quyết lần đầu
    updatedOptions = updatedOptions.map(opt => {
      if (opt.id === params.optionId) {
        return { ...opt, votes: opt.votes + 1 };
      }
      return opt;
    });

    updatedTotalVotes += 1;
    updatedVoters.push({
      aptCode: cleanApt,
      voterName: params.voterName,
      optionId: params.optionId,
      votedAt: new Date().toISOString(),
    });
  }

  const updatedTopic: VotingTopic = {
    ...topic,
    options: updatedOptions,
    totalVotes: updatedTotalVotes,
    voters: updatedVoters,
  };

  topics[targetIndex] = updatedTopic;
  saveVotingTopics(topics);

  return {
    success: true,
    message: existingVoterIndex !== -1
      ? `Đã cập nhật lại phương án biểu quyết của Căn ${cleanApt} thành công!`
      : `Lá phiếu biểu quyết của Căn ${cleanApt} đã được mã hóa và ghi nhận thành công!`,
    topic: updatedTopic,
  };
}

/**
 * Ban Quản Lý tạo cuộc biểu quyết mới
 */
export function createVotingTopic(params: {
  title: string;
  description: string;
  legalType: VotingLegalType;
  deadline: string;
  isOwnerOnly: boolean;
  options: string[];
  summaryReport?: string;
}): VotingTopic {
  const topics = getVotingTopics();
  const nextNum = topics.length + 1;
  const code = `BQ-2026-${String(nextNum).padStart(2, '0')}`;
  const id = `vote-${Date.now()}`;

  const optionItems: VotingOption[] = params.options
    .filter(t => t.trim().length > 0)
    .map((text, idx) => ({
      id: `opt-${id}-${idx + 1}`,
      text: text.trim(),
      votes: 0,
    }));

  const newTopic: VotingTopic = {
    id,
    code,
    title: params.title.trim(),
    description: params.description.trim(),
    legalType: params.legalType,
    createdBy: 'Ban Quản Trị Tòa Nhà',
    createdAt: new Date().toISOString(),
    deadline: params.deadline,
    status: 'OPEN',
    isOwnerOnly: params.isOwnerOnly,
    totalEligibleApartments: 250,
    totalVotes: 0,
    options: optionItems,
    voters: [],
    summaryReport: params.summaryReport?.trim() || '',
  };

  const nextList = [newTopic, ...topics];
  saveVotingTopics(nextList);

  return newTopic;
}

/**
 * Đóng hoặc mở lại cuộc biểu quyết
 */
export function toggleVotingTopicStatus(topicId: string): VotingTopic | null {
  const topics = getVotingTopics();
  let updated: VotingTopic | null = null;

  const nextList = topics.map(t => {
    if (t.id === topicId) {
      updated = {
        ...t,
        status: t.status === 'OPEN' ? 'CLOSED' : 'OPEN',
      };
      return updated;
    }
    return t;
  });

  if (updated) {
    saveVotingTopics(nextList);
  }

  return updated;
}
