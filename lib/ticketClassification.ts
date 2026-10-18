/**
 * Skyline Smart Residence - Intelligent Ticket Classification & AI Response Engine
 * 
 * Phân định rõ ràng trách nhiệm giữa AI và Ban Quản Lý (BQL):
 * 1. INQUIRY (Hỏi đáp & Cần hỗ trợ): AI trả lời tự động 24/7 tức thì dựa vào tri thức chung cư.
 * 2. FEEDBACK (Phản ánh & Khiếu nại): BQL trực tiếp trả lời, giải trình và cử người xử lý thực tế.
 * 3. REPAIR (Sự cố kỹ thuật): Điều phối KTV đến căn hộ sửa chữa, nghiệm thu ảnh trước/sau.
 * 4. SERVICE_REQUEST (Yêu cầu dịch vụ): BQL tiếp nhận và phê duyệt.
 */

export type TicketCategoryType = 'REPAIR' | 'INQUIRY' | 'FEEDBACK' | 'SERVICE_REQUEST';
export type TicketHandlerRole = 'AI' | 'MANAGEMENT' | 'TECHNICIAN';

export interface TicketClassificationResult {
  type: TicketCategoryType;
  typeLabel: string;
  handledBy: TicketHandlerRole;
  handledByLabel: string;
  urgent: boolean;
  priority: 1 | 2;
  isSerious?: boolean;
  canAutoResolve?: boolean;
  autoReplyText?: string;
  suggestedAiReply?: string;
  suggestedAdminReply?: string;
  actionHint: string;
}

const INQUIRY_KNOWLEDGE_BASE: Array<{
  keywords: string[];
  reply: string;
}> = [
  {
    keywords: ['giờ mở', 'mấy giờ', 'giờ đóng', 'quy định hồ bơi', 'bơi mấy giờ'],
    reply: 'Hồ bơi vô cực (Tầng 4) mở cửa từ 06:00 đến 21:00 hàng ngày (nghỉ bảo trì lúc 11:30 - 13:30). Cư dân quét mã QR hoặc FaceID tại cổng vào để sử dụng miễn phí.',
  },
  {
    keywords: ['chất lượng nước hồ bơi', 'nước hồ bơi', 'clo', 'độ ph hồ bơi'],
    reply: 'Nước hồ bơi vô cực được lọc tuần hoàn điện phân muối, tự động duy trì pH (7.2 - 7.6) và clo dư an toàn 1.5 ppm, kiểm định an toàn sinh hoạt hàng ngày.',
  },
  {
    keywords: ['gym', 'phòng gym', 'tập gym', 'technogym', 'huấn luyện viên', 'pt'],
    reply: 'Phòng Gym Technogym mở cửa từ 05:30 đến 22:00 hàng ngày tại Tầng 4. Quý cư dân vào cửa bằng thẻ cư dân hoặc FaceID. Đăng ký PT tại mục Dịch Vụ Căn Hộ trên Cổng Cư Dân.',
  },
  {
    keywords: ['gửi xe', 'bãi đỗ xe', 'biển số', 'xe máy', 'ô tô', 'hầm b1', 'hầm b2', 'đỗ xe'],
    reply: 'Bãi đỗ xe gồm Hầm B1 (xe máy) và Hầm B2 (ô tô), nhận diện biển số tự động LPR. Định mức: tối đa 01 ô tô và 02 xe máy/căn. Đăng ký cà vẹt trên Cổng Cư Dân hoặc Lễ tân Sảnh L1.',
  },
  {
    keywords: ['hóa đơn', 'tiền điện', 'tiền nước', 'phí quản lý', 'thanh toán', 'vnpay', 'momo'],
    reply: 'Hóa đơn dịch vụ phát hành ngày 05 và hạn nộp ngày 20 hàng tháng. Thanh toán trực tuyến 24/7 qua VietQR hoặc VNPAY tại mục Hóa Đơn trên Cổng Cư Dân.',
  },
  {
    keywords: ['rác', 'vứt rác', 'gom rác', 'phòng rác', 'giờ rác'],
    reply: 'Phòng rác mở 24/7 tại sảnh phụ mỗi tầng với hệ thống hút mùi tự động. Thu gom vào 3 khung giờ: 08:00, 14:00 và 20:00 hàng ngày. Vui lòng buộc kín miệng túi trước khi bỏ vào thùng.',
  },
  {
    keywords: ['chuyển đồ', 'chuyển nhà', 'thang máy hàng', 'hàng cồng kềnh', 'nội thất'],
    reply: 'Khung giờ chuyển đồ cồng kềnh: 08:30 - 11:30 và 13:30 - 17:00 (Thứ 2 - Thứ 7, trừ Chủ nhật). Quý cư dân vui lòng đăng ký trước 24h để BQL bọc đệm bảo vệ thang máy.',
  },
  {
    keywords: ['tiệc', 'bbq', 'nướng', 'sân vườn', 'đặt chỗ'],
    reply: 'Khu tiệc nướng BBQ ngoài trời tại Vườn Malibu mở cửa 17:00 - 21:30. Miễn phí 02 lượt/tháng/căn. Quý cư dân vui lòng đặt trước trên Cổng Cư Dân tối thiểu 6 tiếng.',
  },
];

/**
 * Phân tích và phân loại thông minh một Ticket dựa trên tiêu đề, nội dung và dịch vụ
 */
export function classifyTicket(
  content: string, 
  service?: string, 
  subject?: string
): TicketClassificationResult {
  const text = `${service || ''} ${subject || ''} ${content || ''}`.toLowerCase();

  // 1. Dấu hiệu SỰ CỐ HƯ HỎNG KỸ THUẬT THỰC TẾ (REPAIR - Cần KTV đến căn hộ sửa chữa)
  const isRepair = (
    text.includes('hỏng') ||
    text.includes('hư') ||
    text.includes('rò rỉ') ||
    text.includes('chập điện') ||
    text.includes('cháy bóng') ||
    text.includes('mất điện') ||
    text.includes('mất nước') ||
    text.includes('vỡ ống') ||
    text.includes('nghẹt cống') ||
    text.includes('tắc bồn') ||
    text.includes('thấm dột') ||
    text.includes('điều hòa không mát') ||
    text.includes('điều hòa chảy nước') ||
    text.includes('kẹt khóa') ||
    text.includes('chuông cửa hỏng') ||
    text.includes('vòi sen gãy') ||
    text.includes('aptomat nhảy') ||
    text.includes('thang máy kẹt')
  );

  // --- TRƯỜNG HỢP 1: SỰ CỐ KỸ THUẬT / SỬA CHỮA CĂN HỘ (REPAIR) -> PHÂN BỔ KTV ---
  if (isRepair) {
    const isUrgent = text.includes('tràn nước') || text.includes('chập điện') || text.includes('vỡ ống') || text.includes('thang máy kẹt');
    return {
      type: 'REPAIR',
      typeLabel: 'Sửa Chữa Kỹ Thuật',
      handledBy: 'TECHNICIAN',
      handledByLabel: 'Kỹ Thuật Viên Sửa Chữa Hiện Trường',
      urgent: isUrgent,
      priority: isUrgent ? 1 : 2,
      actionHint: isUrgent 
        ? 'Sự cố cấp bách: Cần phân bổ KTV chuyên môn có mặt kiểm tra trong 15 - 30 phút.' 
        : 'Sự cố kỹ thuật: BQL tiếp nhận và phân bổ KTV phù hợp theo ca trực.',
    };
  }

  // --- TRƯỜNG HỢP 2: PHẢN ÁNH / Ý KIẾN / THẮC MẮC CƯ DÂN (FEEDBACK) ---
  // Phân tích ngầm mức độ nghiêm trọng:
  // NGHIÊM TRỌNG THẬT SỰ (cần Ban Quản Lý trực tiếp thụ lý & kiểm tra hiện trường):
  // - Mất an ninh, trộm cắp, kẻ gian đột nhập
  // - Nguy cơ cháy nổ, mùi khét, khí gas, tai nạn khẩn cấp
  // - Thái độ nhân viên xúc phạm, xô xát, đe dọa, kiện tụng, tranh chấp gay gắt
  // - Ô nhiễm nghiêm trọng: tràn rác diện rộng, ngập hôi thối, xác động vật
  const isSerious = (
    text.includes('trộm') ||
    text.includes('mất cắp') ||
    text.includes('mất đồ') ||
    text.includes('kẻ gian') ||
    text.includes('đột nhập') ||
    text.includes('an ninh') ||
    text.includes('camera an ninh') ||
    text.includes('cháy') ||
    text.includes('khói') ||
    text.includes('mùi khét') ||
    text.includes('cháy nổ') ||
    text.includes('khí gas') ||
    text.includes('tai nạn') ||
    text.includes('thái độ') ||
    text.includes('xúc phạm') ||
    text.includes('đe dọa') ||
    text.includes('đánh nhau') ||
    text.includes('chửi') ||
    text.includes('khiếu nại bql') ||
    text.includes('kiện') ||
    text.includes('công an') ||
    text.includes('bồi thường') ||
    text.includes('tràn rác') ||
    text.includes('hôi thối nồng nặc') ||
    text.includes('ngập hành lang')
  );

  const smartReply = generateSuggestedAdminReply(content, service);
  // Nếu không nghiêm trọng (nội quy, chất lượng nước hồ bơi, giờ gym, gửi xe, lịch rác, BBQ, hóa đơn...): AI tự động hoàn tất ticket
  const canAutoResolve = !isSerious;

  return {
    type: 'FEEDBACK',
    typeLabel: 'Phản Ánh & Ý Kiến',
    handledBy: 'MANAGEMENT',
    handledByLabel: isSerious ? 'Ban Quản Lý Trực Tiếp Thụ Lý' : 'AI Tự Động Phân Tích & Hoàn Tất',
    urgent: isSerious,
    priority: isSerious ? 1 : 2,
    isSerious,
    canAutoResolve,
    autoReplyText: canAutoResolve ? smartReply : undefined,
    suggestedAdminReply: smartReply,
    actionHint: isSerious
      ? 'Vấn đề nghiêm trọng: Chuyển Ban Quản Lý trực tiếp kiểm tra hiện trường và gửi văn bản xử lý.'
      : 'Vấn đề thông thường: AI đã ngầm phân tích và gửi phản hồi tự động hoàn thiện ticket cho cư dân.',
  };
}

/**
 * Tìm câu trả lời tốt nhất từ cơ sở tri thức cho câu hỏi cư dân (tham khảo cho BQL)
 */
export function findInquiryAnswer(questionText: string): string {
  const lower = questionText.toLowerCase();
  for (const item of INQUIRY_KNOWLEDGE_BASE) {
    if (item.keywords.some(kw => lower.includes(kw))) {
      return item.reply;
    }
  }

  // Câu trả lời thông minh mặc định nếu chưa khớp từ khóa chính xác
  return 'Cảm ơn Quý cư dân đã gửi thông tin. Ban Quản Lý xin thông tin: Yêu cầu của Quý cư dân đã được ghi nhận. Mọi thủ tục, nội quy sinh hoạt và dịch vụ chung cư đều được cập nhật minh bạch trên Cổng Cư Dân. Ban Quản Lý luôn sẵn sàng hỗ trợ trực tiếp tại Sảnh Lễ Tân (08:00 - 20:00).';
}

/**
 * Smart Local Reply Engine - Đọc nội dung phản ánh cụ thể và tạo phản hồi phù hợp tức thì
 * Không phụ thuộc API, không bao giờ bị timeout hay cắt giữa chừng.
 */
export function generateSuggestedAdminReply(
  content: string,
  service?: string,
  residentName?: string,
  aptCode?: string,
  engineerName?: string
): string {
  // Tách phần nội dung chính (bỏ metadata NKS như "• Khu vực: ... • Mức độ: ...")
  const cleanContent = (content || '').split('•')[0].trim();
  const text = `${service || ''} ${cleanContent} ${content || ''}`.toLowerCase();

  const name  = residentName || 'Quý cư dân';
  const apt   = aptCode ? ` (Căn hộ ${aptCode})` : '';
  const hi    = `Kính gửi ${name}${apt},`;
  const ktv   = engineerName
    ? ` BQL đã phân công Kỹ thuật viên ${engineerName} trực tiếp phụ trách xử lý.`
    : '';
  const close = '\n\nMọi thắc mắc, Quý cư dân vui lòng liên hệ Hotline BQL **1900 8899** hoặc Lễ tân Sảnh L1. Trân trọng!';

  // --- Hồ bơi / chất lượng nước hồ bơi / gym / tiện ích ---
  if (/hồ bơi|bể bơi|chất lượng nước|clo|độ ph|gym|tiện ích|sân thượng|bbq|sân chơi/.test(text)) {
    return `${hi}\n\nBan Quản Lý xin cảm ơn phản ánh / ý kiến của Quý cư dân về khu vực tiện ích. Bộ phận quản lý vận hành tòa nhà luôn thực hiện kiểm định chất lượng nước hồ bơi (pH 7.2 - 7.6, clo dư an toàn, điện phân muối) và vệ sinh định kỳ hàng ngày, mọi chỉ số đều đảm bảo an toàn tuyệt đối theo tiêu chuẩn sinh hoạt. BQL đã ghi nhận và tiếp tục tăng cường kiểm tra để phục vụ Quý cư dân tốt nhất.${close}`;
  }

  // --- Nước / vòi / rò rỉ / tắc nghẹt / thấm trong căn hộ ---
  if (/vòi|gioăng|rò rỉ|rỉ nước|nghẹt|tắc|thấm|ống nước|lavabo|toilet|bồn cầu|xả nước/.test(text)) {
    return `${hi}\n\nBan Quản Lý đã ghi nhận sự cố hệ thống cấp/thoát nước tại căn hộ.${ktv ? ktv : ' BQL đã bố trí kỹ thuật viên chuyên trách đến kiểm tra.'} Kỹ thuật viên sẽ kiểm tra áp lực, gioăng cao su và khắc phục dứt điểm để đảm bảo sinh hoạt cho gia đình.${close}`;
  }

  // --- Điện / mất điện / chập điện ---
  if (/điện|đèn|mất điện|chập|aptomat|cầu dao|ổ cắm|bóng đèn|bảng điện/.test(text)) {
    return `${hi}\n\nBan Quản Lý đã tiếp nhận yêu cầu về sự cố điện trong căn hộ.${ktv} Kỹ thuật điện sẽ kiểm tra tải điện, tình trạng aptomat và xử lý an toàn theo quy trình kỹ thuật, đảm bảo hệ thống điện hoạt động ổn định trở lại.${close}`;
  }

  // --- Thang máy ---
  if (/thang máy|thang|elevator|cửa thang/.test(text)) {
    return `${hi}\n\nCảm ơn Quý cư dân đã phản ánh kịp thời. Ban Quản Lý đã liên hệ ngay đơn vị bảo trì thang máy chuyên dụng để kiểm tra thông số kỹ thuật, tình trạng cửa và động cơ. Sự cố sẽ được khắc phục triệt để, đảm bảo an toàn tuyệt đối cho cư dân.${close}`;
  }

  // --- Tiếng ồn / thi công / khoan ---
  if (/tiếng ồn|ồn|khoan|búa|nhạc|âm thanh|thi công|đập phá/.test(text)) {
    return `${hi}\n\nBan Quản Lý thành thật xin lỗi vì sự bất tiện này. Đội An ninh tòa nhà đã lập tức kiểm tra hiện trường, nhắc nhở và yêu cầu chấm dứt ngay hành vi gây ồn vi phạm nội quy khung giờ sinh hoạt. BQL sẽ giám sát liên tục để đảm bảo không tái diễn.${close}`;
  }

  // --- Vệ sinh / rác / mùi hôi ---
  if (/rác|vệ sinh|bẩn|mùi|hôi|côn trùng|gián|chuột|ruồi|muỗi/.test(text)) {
    return `${hi}\n\nBan Quản Lý đã ghi nhận phản ánh về vệ sinh môi trường. Đội dịch vụ vệ sinh${engineerName ? ` và KTV ${engineerName}` : ''} đã được điều động đến dọn dẹp, khử khuẩn và xử lý nguồn gây mùi ngay trong ngày. BQL sẽ tăng tần suất tuần tra để duy trì môi trường sạch đẹp.${close}`;
  }

  // --- An ninh / trộm / thang bộ ---
  if (/an ninh|trộm|mất|xe|bãi đỗ|camera|bảo vệ|thang bộ|hành lang/.test(text)) {
    return `${hi}\n\nBan Quản Lý rất coi trọng vấn đề an ninh và đã tiếp nhận phản ánh của Quý cư dân. Bộ phận An ninh đã được chỉ đạo rà soát ngay camera giám sát khu vực liên quan, tăng cường tuần tra và lập biên bản xử lý. BQL cam kết đảm bảo an toàn tuyệt đối trong khuôn viên Skyline.${close}`;
  }

  // --- Hồ bơi / gym / tiện ích ---
  if (/hồ bơi|gym|phòng tập|tiện ích|sân thượng|BBQ|sân chơi|khu vui chơi/.test(text)) {
    return `${hi}\n\nCảm ơn Quý cư dân đã phản ánh về khu vực tiện ích. Ban Quản Lý đã ghi nhận và làm việc ngay với bộ phận quản lý tiện ích để kiểm tra, bảo trì và khắc phục trong thời gian sớm nhất. BQL luôn nỗ lực mang đến trải nghiệm sống đẳng cấp 5 sao cho Quý cư dân.${close}`;
  }

  // --- Phí dịch vụ / hóa đơn ---
  if (/phí|hóa đơn|thanh toán|tiền|phí quản lý|phí dịch vụ|thu phí/.test(text)) {
    return `${hi}\n\nBan Quản Lý đã tiếp nhận ý kiến của Quý cư dân liên quan đến vấn đề phí dịch vụ. Bộ phận Kế toán Tòa nhà sẽ liên hệ trực tiếp để đối soát chi tiết và giải trình rõ ràng trong vòng **24 giờ làm việc**. Mọi thắc mắc đều được BQL giải quyết minh bạch và thấu đáo.${close}`;
  }

  // --- Thái độ nhân viên ---
  if (/nhân viên|bảo vệ|lễ tân|thái độ|phục vụ|cư xử|thiếu lịch sự/.test(text)) {
    return `${hi}\n\nBan Quản Lý thành thật xin lỗi vì trải nghiệm chưa tốt mà Quý cư dân gặp phải. Chúng tôi đã ghi nhận nghiêm túc và sẽ làm việc, nhắc nhở trực tiếp với nhân sự liên quan, đồng thời tổ chức đào tạo lại chuẩn mực thái độ phục vụ 5 sao của Skyline. BQL cam kết không tái diễn.${close}`;
  }

  // --- Thấm / trần / tường ---
  if (/trần|tường|thấm dột|nứt|sơn|bong tróc|ẩm mốc/.test(text)) {
    return `${hi}\n\nBan Quản Lý đã ghi nhận phản ánh về hiện tượng thấm/nứt tại căn hộ.${ktv} Kỹ thuật viên sẽ đánh giá mức độ hư hỏng, xác định nguồn thấm và thi công khắc phục đảm bảo tiêu chuẩn kỹ thuật, không ảnh hưởng đến kết cấu công trình.${close}`;
  }

  // --- Điều hòa / máy lạnh ---
  if (/điều hòa|máy lạnh|lạnh|không mát|chảy nước|tiếng kêu|điều hoà/.test(text)) {
    return `${hi}\n\nBan Quản Lý đã ghi nhận sự cố hệ thống điều hòa tại căn hộ.${ktv} Kỹ thuật viên sẽ kiểm tra gas, bộ lọc, cánh quạt và toàn bộ hệ thống, đảm bảo điều hòa vận hành hiệu quả và êm ái trở lại.${close}`;
  }

  // --- Mặc định ---
  return `${hi}\n\nBan Quản Lý đã tiếp nhận và ghi nhận đầy đủ thông tin phản ánh của Quý cư dân.${engineerName ? ` BQL đã phân công KTV ${engineerName} phụ trách xử lý.` : ''} Bộ phận chuyên trách sẽ xác minh hiện trường và phản hồi kết quả xử lý trong thời gian sớm nhất. BQL cam kết giải quyết dứt điểm, đảm bảo chất lượng sống tốt nhất tại Skyline Smart Residence.${close}`;
}
