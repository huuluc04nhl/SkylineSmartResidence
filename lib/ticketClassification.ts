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

  // --- TRƯỜNG HỢP 1: PHẢN ÁNH / KHIẾU NẠI (FEEDBACK) -> BQL TRỰC TIẾP XỬ LÝ ---
  if (isFeedback) {
    const isUrgent = text.includes('tràn') || text.includes('chắn lối') || text.includes('cháy');
    return {
      type: 'FEEDBACK',
      typeLabel: 'Phản Ánh & Góp Ý',
      handledBy: 'MANAGEMENT',
      handledByLabel: 'Ban Quản Lý Trực Tiếp Phản Hồi',
      urgent: isUrgent,
      priority: isUrgent ? 1 : 2,
      suggestedAdminReply: generateSuggestedAdminReply(content, service),
      actionHint: 'Ý kiến cư dân cần BQL xác nhận, kiểm tra thực địa và phản hồi chính thức.',
    };
  }

  // --- TRƯỜNG HỢP 2: HỎI ĐÁP / HỖ TRỢ THÔNG TIN (INQUIRY) -> BQL PHÊ DUYỆT (AI HỖ TRỢ SOẠN THẢO) ---
  if (isInquiry && !isRepair) {
    const aiKnowledge = findInquiryAnswer(text);
    return {
      type: 'INQUIRY',
      typeLabel: 'Hỏi Đáp & Hỗ Trợ',
      handledBy: 'MANAGEMENT',
      handledByLabel: 'Ban Quản Lý Phê Duyệt & Phản Hồi',
      urgent: false,
      priority: 2,
      suggestedAiReply: aiKnowledge,
      actionHint: 'AI gợi ý bản thảo câu trả lời từ nội quy, Ban Quản Lý phê duyệt trước khi gửi tới cư dân.',
    };
  }

  // --- TRƯỜNG HỢP 3: SỰ CỐ KỸ THUẬT (REPAIR) -> KỸ THUẬT VIÊN HIỆN TRƯỜNG ---
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
        ? 'Sự cố khẩn cấp: AI điều phối KTV có mặt trong 15 - 30 phút.' 
        : 'AI điều phối KTV chuyên môn phù hợp trong vòng 45 - 60 phút.',
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
 * Sinh câu trả lời mẫu lịch sự, chuyên nghiệp từ Ban Quản Lý khi có phản ánh
 */
export function generateSuggestedAdminReply(content: string, service?: string): string {
  const text = `${service || ''} ${content || ''}`.toLowerCase();

  if (text.includes('nhà hàng') || text.includes('bàn ghế')) {
    return 'Ban Quản Lý chân thành cảm ơn ý kiến đóng góp của Quý cư dân. BQL đã làm việc trực tiếp với Quản lý Khu Nhà hàng và yêu cầu chấn chỉnh ngay quy trình vệ sinh bàn ghế sau mỗi ca phục vụ. Đội ngũ giám sát sẽ tăng cường kiểm tra để đảm bảo vệ sinh tốt nhất cho cư dân.';
  }

  if (text.includes('rác') || text.includes('block') || text.includes('vệ sinh')) {
    return 'Ban Quản Lý đã tiếp nhận phản ánh về tình trạng rác thải. Đội vệ sinh ca trực đã được cử đến khu vực để dọn dẹp sạch sẽ và khử khuẩn. BQL cũng tăng cường nhắc nhở các căn hộ xung quanh tuân thủ đúng vị trí tập kết rác quy định.';
  }

  if (text.includes('tiếng ồn') || text.includes('ồn')) {
    return 'Ban Quản Lý đã cử nhân viên bảo vệ lên tận căn hộ nhắc nhở trực tiếp, yêu cầu tuân thủ khung giờ yên tĩnh của tòa nhà sau 22:00. BQL sẽ tiếp tục theo dõi để đảm bảo không gian yên tĩnh cho Quý cư dân.';
  }

  return 'Ban Quản Lý xin ghi nhận thông tin phản ánh từ Quý cư dân. Chúng tôi đã chuyển tiếp đến bộ phận phụ trách để kiểm tra và xử lý triệt để trong thời gian sớm nhất. Xin chân thành cảm ơn sự đồng hành của Quý cư dân vì một môi trường sống văn minh tại Skyline!';
}
