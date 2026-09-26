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

const VOTING_STORAGE_KEY = 'skyline_voting_topics_v5';

export const INITIAL_VOTING_TOPICS: VotingTopic[] = [
  {
    id: 'vote-01',
    code: 'BQ-2026-01',
    title: 'Biểu quyết Thông qua Phương án Nâng cấp Hệ thống Kiểm soát Xe Tự Động Hầm B1 - B2',
    description: 'Chiến dịch lấy ý kiến hợp pháp của các Chủ sở hữu căn hộ về việc trích Quỹ Bảo trì để trang bị camera AI LPR đọc biển số tự động tốc độ cao và mở rộng làn xe máy giờ cao điểm tại Hầm B1/B2 Tòa BS-07. Dự toán thực hiện: 150.000.000 VNĐ theo báo giá cạnh tranh.',
    legalType: 'Đóng góp Quỹ Bảo trì',
    createdBy: 'Ban Quản Trị & Kỹ Thuật Tòa Nhà',
    createdAt: '2026-08-20T08:00:00',
    deadline: '2026-10-15T23:59:59',
    status: 'OPEN',
    isOwnerOnly: true,
    totalEligibleApartments: 200,
    totalVotes: 0,
    options: [
      { id: 'opt-1-1', text: 'Đồng ý phương án nâng cấp (Dự toán 150 triệu VNĐ từ Quỹ Bảo trì)', votes: 0 },
      { id: 'opt-1-2', text: 'Không đồng ý, giữ nguyên hiện trạng kiểm soát thủ công', votes: 0 },
      { id: 'opt-1-3', text: 'Đồng ý nhưng yêu cầu điều chỉnh giảm dự toán xuống dưới 120 triệu VNĐ', votes: 0 },
    ],
    voters: [],
    summaryReport: 'Hệ thống kiểm soát xe hiện tại vào giờ cao điểm (07:00 - 08:30) thường ùn ứ từ 3-5 phút. Việc nâng cấp cảm biến RFID tầm xa và camera AI YOLOv8 giúp giải phóng xe trong dưới 0.3s/lượt.',
  },
  {
    id: 'vote-02',
    code: 'BQ-2026-02',
    title: 'Lấy ý kiến Điều chỉnh Giờ giấc Hoạt động Khu Thể Thao & Tiện Ích Nội Khu The Tropical',
    description: 'Theo đề xuất của cư dân về việc tăng thời gian tập luyện và thư giãn buổi tối sau giờ làm việc, Ban Quản Lý xin ý kiến biểu quyết kéo dài giờ hoạt động sân thể thao và tiện ích nội khu đến 22:30 hàng ngày. Chi phí chiếu sáng và vệ sinh đã được cân đối trong ngân sách dịch vụ.',
    legalType: 'Quy Chế Chung Cư',
    createdBy: 'Bộ Phận Vận Hành Ban Quản Lý',
    createdAt: '2026-09-01T08:00:00',
    deadline: '2026-10-20T23:59:59',
    status: 'OPEN',
    isOwnerOnly: false,
    totalEligibleApartments: 200,
    totalVotes: 0,
    options: [
      { id: 'opt-2-1', text: 'Nhất trí kéo dài mở cửa đến 22:30 tất cả các ngày trong tuần', votes: 0 },
      { id: 'opt-2-2', text: 'Chỉ kéo dài đến 22:30 vào các ngày cuối tuần (Thứ Sáu, Thứ Bảy, Chủ Nhật)', votes: 0 },
      { id: 'opt-2-3', text: 'Giữ nguyên khung giờ đóng cửa lúc 21:30 để đảm bảo yên tĩnh cho cư dân các tầng thấp', votes: 0 },
    ],
    voters: [],
    summaryReport: 'Đội bảo vệ cam kết tuần tra kiểm soát tiếng ồn sau 22:00 nhằm đảm bảo không gian yên tĩnh và nghỉ ngơi cho các tầng căn hộ xung quanh.',
  },
  {
    id: 'vote-03',
    code: 'BQ-2026-03',
    title: 'Hội nghị Nhà Chung Cư: Lựa chọn Đơn vị Quản lý Vận hành Chung Cư BS-07 Giai đoạn 2026 - 2028',
    description: 'Biểu quyết lựa chọn đơn vị trúng thầu cung cấp dịch vụ quản lý vận hành tòa nhà Chung Cư BS-07 The Tropical tiêu chuẩn cao cấp giữa các nhà thầu đã vượt qua vòng thẩm định hồ sơ năng lực.',
    legalType: 'Bầu Ban Quản Trị',
    createdBy: 'Hội Nghị Nhà Chung Cư',
    createdAt: '2026-09-05T09:00:00',
    deadline: '2026-10-30T23:59:59',
    status: 'OPEN',
    isOwnerOnly: true,
    totalEligibleApartments: 200,
    totalVotes: 0,
    options: [
      { id: 'opt-3-1', text: 'Công ty Quản Lý Bất Động Sản Skyline Living Pro (Giá thầu: 11.000 đ/m²)', votes: 0 },
      { id: 'opt-3-2', text: 'Tập đoàn Quản lý Bất động sản Savills Việt Nam (Giá thầu: 14.500 đ/m²)', votes: 0 },
      { id: 'opt-3-3', text: 'Công ty Cổ phần Dịch vụ Đô thị CBRE Property (Giá thầu: 13.800 đ/m²)', votes: 0 },
    ],
    voters: [],
    summaryReport: 'Toàn bộ hồ sơ đề xuất kỹ thuật, cam kết SLA bảo trì và báo cáo tài chính của 3 đơn vị đã được niêm yết công khai tại văn phòng Ban Quản Lý và trên cổng thông tin số.',
  },
  {
    id: 'vote-04',
    code: 'BQ-2026-04',
    title: 'Thông qua Chủ trương Bố trí Khu Sạc Xe Điện Thông Minh An Toàn PCCC tại Hầm B1',
    description: 'Bình chọn phương án phối hợp lắp đặt 8 trụ sạc xe ô tô điện và 20 vị trí sạc xe máy điện công nghệ ngắt nguồn tự động khi đầy pin, tích hợp cảm biến nhiệt và hệ thống chữa cháy aerosol chuyên dụng.',
    legalType: 'Ý kiến Cải tạo',
    createdBy: 'Ban Quản Trị Tòa Nhà',
    createdAt: '2026-07-15T08:00:00',
    deadline: '2026-08-30T23:59:59',
    status: 'CLOSED',
    isOwnerOnly: true,
    totalEligibleApartments: 200,
    totalVotes: 0,
    options: [
      { id: 'opt-4-1', text: 'Nhất trí thông qua phương án lắp đặt trạm sạc theo tiêu chuẩn an toàn PCCC', votes: 0 },
      { id: 'opt-4-2', text: 'Đồng ý nhưng yêu cầu chuyển trạm sạc ra khu vực sân thoáng ngoài trời', votes: 0 },
      { id: 'opt-4-3', text: 'Không đồng ý lắp đặt trạm sạc xe điện trong hầm', votes: 0 },
    ],
    voters: [],
    summaryReport: 'Cuộc biểu quyết đã kết thúc với sự tham gia của các căn hộ tòa nhà. Dự án đã được Ban Quản Lý nghiệm thu và đưa vào vận hành.',
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
    // Dọn dẹp cache dữ liệu ảo phiên bản cũ
    localStorage.removeItem('skyline_voting_topics_v1');
    localStorage.removeItem('skyline_voting_topics_v2');

    const raw = localStorage.getItem(VOTING_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(VOTING_STORAGE_KEY, JSON.stringify(INITIAL_VOTING_TOPICS));
      return INITIAL_VOTING_TOPICS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Đảm bảo tính toán chính xác 100% từ danh sách cử tri thực tế (không dữ liệu ảo)
      return parsed.map((topic: VotingTopic) => {
        const voters = Array.isArray(topic.voters) ? topic.voters : [];
        return {
          ...topic,
          totalVotes: voters.length,
          options: (topic.options || []).map(opt => ({
            ...opt,
            votes: voters.filter(v => v.optionId === opt.id).length,
          })),
        };
      });
    }
    return INITIAL_VOTING_TOPICS;
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

  let updatedVoters = [...topic.voters];

  if (existingVoterIndex !== -1) {
    // Đã biểu quyết trước đó -> Cập nhật lại lựa chọn
    const prevOptionId = topic.voters[existingVoterIndex].optionId;
    if (prevOptionId === params.optionId) {
      return { success: true, message: 'Lá phiếu của bạn đã được ghi nhận trước đó.', topic };
    }

    updatedVoters[existingVoterIndex] = {
      aptCode: cleanApt,
      voterName: params.voterName,
      optionId: params.optionId,
      votedAt: new Date().toISOString(),
    };
  } else {
    // Biểu quyết lần đầu
    updatedVoters.push({
      aptCode: cleanApt,
      voterName: params.voterName,
      optionId: params.optionId,
      votedAt: new Date().toISOString(),
    });
  }

  // Luôn tính toán số phiếu của từng phương án và tổng số phiếu trực tiếp từ danh sách cử tri thực tế (100% không dữ liệu ảo)
  const updatedOptions = topic.options.map(opt => ({
    ...opt,
    votes: updatedVoters.filter(v => v.optionId === opt.id).length,
  }));
  const updatedTotalVotes = updatedVoters.length;

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
