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
  suggestedAiReply?: string;
  suggestedAdminReply?: string;
  actionHint: string;
}

/**
 * Kho tri thức RAG xử lý tự động cho các câu hỏi cư dân thường gặp
 */
const INQUIRY_KNOWLEDGE_BASE: Array<{
  keywords: string[];
  reply: string;
}> = [
  {
    keywords: ['hồ bơi', 'bể bơi', 'bơi', 'chất lượng nước', 'mở cửa', 'clo'],
    reply: 'Hồ bơi vô cực (Tầng 4) mở cửa từ 06:00 đến 21:00 hàng ngày (nghỉ bảo trì vệ sinh lúc 11:30 - 13:30). Nước hồ bơi được lọc tuần hoàn điện phân muối, kiểm tra độ pH tự động (chuẩn 7.2 - 7.6) và clo dư an toàn 1.5 ppm. Cư dân quét mã QR hoặc thẻ cư dân điện tử tại cổng vào để sử dụng miễn phí.',
  },
  {
    keywords: ['gym', 'phòng gym', 'tập gym', 'technogym', 'huấn luyện viên', 'pt'],
    reply: 'Phòng Gym Technogym mở cửa từ 05:30 đến 22:00 hàng ngày tại Tầng 4. Quý cư dân vào cửa bằng thẻ cư dân hoặc FaceID. Cư dân có thể đặt lịch Huấn luyện viên cá nhân (PT) tại mục Dịch Vụ Căn Hộ trên Cổng Cư Dân.',
  },
  {
    keywords: ['gửi xe', 'bãi đỗ xe', 'biển số', 'xe máy', 'ô tô', 'hầm b1', 'hầm b2', 'đỗ xe'],
    reply: 'Bãi đỗ xe gồm Hầm B1 (dành cho xe máy) và Hầm B2 (dành cho ô tô), tích hợp nhận diện biển số tự động LPR. Định mức: mỗi căn hộ được đăng ký tối đa 01 ô tô và 02 xe máy. Quý cư dân vui lòng tải ảnh cà vẹt xe lên Cổng Cư Dân hoặc nộp tại Bàn lễ tân sảnh L1 để kích hoạt trong vòng 24h.',
  },
  {
    keywords: ['hóa đơn', 'tiền điện', 'tiền nước', 'phí quản lý', 'thanh toán', 'vnpay', 'momo'],
    reply: 'Hóa đơn dịch vụ được phát hành vào ngày 05 hàng tháng và hạn nộp đến ngày 20. Quý cư dân có thể thanh toán trực tuyến 24/7 qua VietQR, VNPAY hoặc MoMo tại mục Hóa Đơn trên Cổng Cư Dân. Hệ thống sẽ tự động gạch nợ tức thì.',
  },
  {
    keywords: ['rác', 'vứt rác', 'gom rác', 'phòng rác', 'giờ rác'],
    reply: 'Phòng thu gom rác bố trí tại sảnh phụ mỗi tầng, mở cửa 24/7 và có hệ thống hút mùi tự động. Nhân viên vệ sinh thu gom rác vào 3 khung giờ: 08:00, 14:00 và 20:00 hàng ngày. Quý cư dân vui lòng buộc kín miệng túi rác trước khi bỏ vào thùng.',
  },
  {
    keywords: ['chuyển đồ', 'chuyển nhà', 'thang máy hàng', 'hàng cồng kềnh', 'nội thất'],
    reply: 'Quy định vận chuyển hàng hóa cồng kềnh và chuyển nhà: Thời gian cho phép từ 08:30 - 11:30 và 13:30 - 17:00 (từ Thứ 2 đến Thứ 7, không chuyển vào Chủ nhật). Quý cư dân vui lòng đăng ký trước 24h để BQL bọc đệm bảo vệ thang máy hàng.',
  },
  {
    keywords: ['tiệc', 'bbq', 'nướng', 'sân vườn', 'đặt chỗ'],
    reply: 'Khu tiệc nướng BBQ ngoài trời tại Sảnh vườn Malibu mở cửa từ 17:00 - 21:30. Mỗi căn hộ được miễn phí 02 lượt đặt/tháng (đã bao gồm bếp nướng điện, bàn ghế và vệ sinh). Quý cư dân vui lòng đặt trước trên Cổng Cư Dân tối thiểu 6 tiếng.',
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

  // 1. Dấu hiệu PHẢN ÁNH / KHIẾU NẠI (FEEDBACK)
  const isFeedback = (
    text.includes('chưa thực hiện') ||
    text.includes('chưa dọn') ||
    text.includes('chưa làm') ||
    text.includes('xả đầy') ||
    text.includes('rác xả') ||
    text.includes('tràn rác') ||
    text.includes('mùi hôi') ||
    text.includes('tiếng ồn') ||
    text.includes('hát karaoke') ||
    text.includes('thái độ') ||
    text.includes('khiếu nại') ||
    text.includes('phản ánh') ||
    text.includes('góp ý') ||
    text.includes('chấn chỉnh') ||
    text.includes('đỗ xe sai') ||
    text.includes('chắn lối') ||
    text.includes('vệ sinh bàn ghế') ||
    text.includes('nhà hàng') && text.includes('vệ sinh') ||
    text.includes('dịch vụ vệ sinh chung cư')
  );

  // 2. Dấu hiệu HỎI ĐÁP / TRỢ GIÚP THÔNG TIN (INQUIRY)
  const isInquiry = (
    text.includes('hỏi') ||
    text.includes('mấy giờ') ||
    text.includes('giờ mở') ||
    text.includes('giờ giấc') ||
    text.includes('thời gian') ||
    text.includes('thủ tục') ||
    text.includes('làm sao') ||
    text.includes('ở đâu') ||
    text.includes('bao nhiêu') ||
    text.includes('biểu phí') ||
    text.includes('hướng dẫn') ||
    text.includes('chất lượng nước') ||
    text.includes('có được') ||
    text.includes('quy định') ||
    text.includes('cho phép') ||
    text.includes('đăng ký thẻ')
  );

  // 3. Dấu hiệu SỰ CỐ KỸ THUẬT & SỬA CHỮA (REPAIR)
  const isRepair = (
    text.includes('hỏng') ||
    text.includes('hư') ||
    text.includes('rò rỉ') ||
    text.includes('chập') ||
    text.includes('cháy bóng') ||
    text.includes('mất điện') ||
    text.includes('mất nước') ||
    text.includes('vỡ ống') ||
    text.includes('nghẹt') ||
    text.includes('tắc bồn') ||
    text.includes('thấm dột') ||
    text.includes('điều hòa không mát') ||
    text.includes('kẹt khóa') ||
    text.includes('chuông cửa hỏng') ||
    text.includes('vòi sen') ||
    text.includes('aptomat') ||
    text.includes('thang máy kẹt')
  );

  // --- TRƯỜNG HỢP 1: PHẢN ÁNH / KHIẾU NẠI (FEEDBACK) -> CHỜ BQL TRỰC TIẾP XÁC NHẬN ---
  if (isFeedback) {
    const isUrgent = text.includes('tràn') || text.includes('chắn lối') || text.includes('cháy');
    return {
      type: 'FEEDBACK',
      typeLabel: 'Phản Ánh & Góp Ý',
      handledBy: 'MANAGEMENT',
      handledByLabel: 'Ban Quản Lý Trực Tiếp Xác Nhận',
      urgent: isUrgent,
      priority: isUrgent ? 1 : 2,
      suggestedAdminReply: generateSuggestedAdminReply(content, service),
      actionHint: 'Ý kiến / khiếu nại cư dân: Đang chờ BQL xác nhận, kiểm tra thực địa và phản hồi chính thức.',
    };
  }

  // --- TRƯỜNG HỢP 2: HỎI ĐÁP / TRA CỨU TIỆN ÍCH (INQUIRY) -> AI TỰ ĐỘNG PHẢN HỒI (KHÔNG CẦN QUA BQL) ---
  if (isInquiry && !isRepair) {
    const aiKnowledge = findInquiryAnswer(text);
    return {
      type: 'INQUIRY',
      typeLabel: 'Hỏi Đáp & Trợ Giúp',
      handledBy: 'AI',
      handledByLabel: 'Trợ Lý AI Tự Động Phản Hồi 24/7',
      urgent: false,
      priority: 2,
      suggestedAiReply: aiKnowledge,
      actionHint: 'AI tự động tra cứu nội quy và phản hồi tức thì 24/7 cho cư dân mà không cần thông qua BQL.',
    };
  }

  // --- TRƯỜNG HỢP 3: SỰ CỐ KỸ THUẬT (REPAIR) -> CẦN THIẾT PHÂN BỔ KỸ THUẬT VIÊN ---
  if (isRepair) {
    const isUrgent = text.includes('tràn nước') || text.includes('chập điện') || text.includes('vỡ ống') || text.includes('thang máy');
    return {
      type: 'REPAIR',
      typeLabel: 'Sửa Chữa Kỹ Thuật',
      handledBy: 'TECHNICIAN',
      handledByLabel: 'Kỹ Thuật Viên Sửa Chữa Hiện Trường',
      urgent: isUrgent,
      priority: isUrgent ? 1 : 2,
      actionHint: isUrgent 
        ? 'Sự cố cấp bách: AI tự động phân bổ KTV chuyên môn có mặt trong 15 - 30 phút.' 
        : 'Sự cố kỹ thuật: AI phân tích và phân bổ KTV phù hợp theo ca trực.',
    };
  }

  // --- TRƯỜNG HỢP 4: YÊU CẦU DỊCH VỤ / HÀNH CHÍNH (SERVICE_REQUEST) ---
  return {
    type: 'SERVICE_REQUEST',
    typeLabel: 'Yêu Cầu Dịch Vụ',
    handledBy: 'MANAGEMENT',
    handledByLabel: 'Ban Quản Lý Tiếp Nhận',
    urgent: false,
    priority: 2,
    suggestedAdminReply: 'Ban Quản Lý đã tiếp nhận yêu cầu của Quý cư dân và sẽ liên hệ xác nhận thời gian triển khai sớm nhất.',
    actionHint: 'BQL tiếp nhận và bố trí nhân sự phục vụ.',
  };
}

/**
 * Tìm câu trả lời tốt nhất từ cơ sở tri thức cho câu hỏi cư dân
 */
export function findInquiryAnswer(questionText: string): string {
  const lower = questionText.toLowerCase();
  for (const item of INQUIRY_KNOWLEDGE_BASE) {
    if (item.keywords.some(kw => lower.includes(kw))) {
      return item.reply;
    }
  }

  // Câu trả lời thông minh mặc định nếu chưa khớp từ khóa chính xác
  return 'Cảm ơn Quý cư dân đã gửi câu hỏi. Bộ phận Chăm sóc Cư dân Skyline xin thông tin: Yêu cầu của bạn đã được ghi nhận vào hệ thống. Mọi thủ tục, nội quy sinh hoạt và dịch vụ chung cư đều được cập nhật minh bạch trên Cổng Cư Dân. Nếu cần hỗ trợ trực tiếp, Ban Quản Lý luôn sẵn sàng hỗ trợ tại Sảnh Lễ Tân (08:00 - 20:00).';
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
    : ' BQL đã cử kỹ thuật viên chuyên trách đến kiểm tra và xử lý.';
  const close = '\n\nMọi thắc mắc, Quý cư dân vui lòng liên hệ Hotline BQL **1900 8899** hoặc Lễ tân Sảnh L1. Trân trọng!';

  // --- Nước / vòi / rò rỉ / tắc nghẹt / thấm ---
  if (/nước|vòi|gioăng|rò rỉ|rỉ nước|nghẹt|tắc|thấm|ống nước|bồn|lavabo|toilet|bồn cầu|xả nước/.test(text)) {
    return `${hi}\n\nBan Quản Lý đã ghi nhận sự cố hệ thống cấp/thoát nước tại căn hộ.${ktv} Kỹ thuật viên sẽ kiểm tra áp lực, gioăng cao su và toàn bộ hệ thống van, khắc phục dứt điểm tình trạng rò rỉ để đảm bảo sinh hoạt bình thường cho gia đình.${close}`;
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
