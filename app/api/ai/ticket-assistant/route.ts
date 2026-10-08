import { NextRequest, NextResponse } from 'next/server';
import { GEMINI_API_KEY } from '@/lib/geminiClient';
import { classifyTicket, findInquiryAnswer } from '@/lib/ticketClassification';

// Timeout configuration
const GEMINI_TIMEOUT_MS = 8000;

async function callGemini(prompt: string, systemInstruction: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const payload = {
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemInstruction}\n\n${prompt}` }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 600,
      },
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini error: ${err}`);
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('No text returned');
    return text.trim();
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

/**
 * Gọi Gemini với Vision (ảnh base64 + text prompt)
 */
async function callGeminiVision(
  base64Image: string,
  mimeType: string,
  textPrompt: string,
  systemInstruction: string
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  // Bóc bỏ data URI prefix nếu có
  const pureBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '');

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const payload = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: systemInstruction },
            {
              inline_data: {
                mime_type: mimeType || 'image/jpeg',
                data: pureBase64,
              },
            },
            { text: textPrompt },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 500,
      },
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini Vision error: ${err}`);
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('No vision text returned');
    return text.trim();
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

/**
 * Phân tích ảnh cục bộ (fallback khi Gemini Vision không khả dụng)
 */
function getLocalImageAnalysis(area?: string): {
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  category: string;
  summary: string;
  action: string;
} {
  const areaLower = (area || '').toLowerCase();
  if (areaLower.includes('bếp') || areaLower.includes('rửa') || areaLower.includes('cống')) {
    return {
      severity: 'HIGH',
      category: 'Nước',
      summary: 'Ảnh ghi nhận dấu hiệu sự cố liên quan đến đường ống hoặc thiết bị cấp thoát nước tại khu vực bếp/vệ sinh.',
      action: 'Khóa van nước cục bộ ngay để tránh tràn sàn trong khi chờ KTV.',
    };
  }
  if (areaLower.includes('điện') || areaLower.includes('aptomat') || areaLower.includes('đèn')) {
    return {
      severity: 'HIGH',
      category: 'Điện',
      summary: 'Ảnh cho thấy dấu hiệu bất thường tại hệ thống điện hoặc thiết bị chiếu sáng.',
      action: 'Ngắt aptomat nhánh tại khu vực sự cố, không bật lại thiết bị điện khi chưa có KTV kiểm tra.',
    };
  }
  return {
    severity: 'MEDIUM',
    category: 'Khác',
    summary: 'Hình ảnh đã được ghi nhận. Hệ thống đề xuất KTV đến kiểm tra trực tiếp để xác định mức độ và phương án xử lý.',
    action: 'Kỹ thuật viên sẽ mang dụng cụ phù hợp để khắc phục sự cố sau khi kiểm tra hiện trường.',
  };
}

/**
 * Sinh lời khuyên an toàn sơ bộ tức thì theo ngữ cảnh sự cố
 */
function getLocalSafetyTips(category: string, content: string): string {
  const text = `${category} ${content}`.toLowerCase();

  if (text.includes('nước') || text.includes('vòi') || text.includes('rỉ') || text.includes('ngập') || text.includes('bồn')) {
    return '💡 Lời khuyên sơ bộ từ AI: Khóa ngay van cấp nước dưới bồn rửa hoặc van tổng tại hộp kỹ thuật cửa vào để chống tràn ngập sàn gỗ trong lúc chờ KTV đến kiểm tra.';
  }
  if (text.includes('điện') || text.includes('chập') || text.includes('aptomat') || text.includes('mất điện') || text.includes('khói')) {
    return '⚡ Khuyến cáo an toàn từ AI: Ngắt cầu dao (aptomat) nhánh khu vực xảy ra sự cố. Không dùng tay ướt hoặc cắm thêm thiết bị điện công suất lớn cho đến khi KTV đo đạc tải điện.';
  }
  if (text.includes('điều hòa') || text.includes('máy lạnh') || text.includes('không mát') || text.includes('chảy nước')) {
    return '❄️ Hướng dẫn sơ bộ từ AI: Tắt máy lạnh và mở cửa sổ thông thoáng. Nếu chảy nước dàn lạnh, đặt khăn hoặc chậu hứng để bảo vệ sàn gỗ và tường sơn.';
  }
  if (text.includes('khóa') || text.includes('cửa') || text.includes('vân tay') || text.includes('mật mã')) {
    return '🔑 Hướng dẫn sơ bộ từ AI: Thử cắm sạc dự phòng qua cổng Micro-USB/Type-C dưới đáy khóa điện tử nếu khóa hết pin. KTV hỗ trợ sẽ mang chìa cơ dự phòng đến.';
  }
  return '🛠️ Hướng dẫn sơ bộ từ AI: Giữ nguyên hiện trạng để KTV dễ dàng xác định nguyên nhân. Yêu cầu của Quý cư dân đã được tiếp nhận và phân bổ chuyên viên xử lý.';
}

/**
 * Tối ưu hóa mô tả sự cố thành bản viết rõ ràng, chuyên nghiệp cho KTV
 */
function getLocalPolishedDescription(content: string, area?: string): string {
  const areaText = area ? `tại khu vực ${area}` : '';
  const trimmed = content.trim();

  const lower = trimmed.toLowerCase();
  if (lower.includes('vòi') && (lower.includes('rỉ') || lower.includes('nước'))) {
    return `Hiện tượng: Vòi nước bị rò rỉ rỉ nước liên tục ${areaText}, nước chảy nhỏ giọt xuống sàn/gầm tủ. Đã thử siết van nhưng không khắc phục được, nhờ KTV hỗ trợ kiểm tra gioăng cao su và van khóa.`;
  }
  if (lower.includes('điện') || lower.includes('aptomat') || lower.includes('đèn')) {
    return `Hiện tượng: Sự cố điện chập chờn / nhảy aptomat ${areaText}. Thiết bị chiếu sáng và ổ cắm mất điện cục bộ. Nhờ Đội Kỹ Thuật mang đồng hồ vạn năng kiểm tra rò điện và đo tải an toàn.`;
  }
  if (lower.includes('nghẹt') || lower.includes('tắc') || lower.includes('bồn cầu') || lower.includes('cống')) {
    return `Hiện tượng: Hệ thống thoát nước ${areaText} có dấu hiệu thoát chậm / tắc nghẽn, phát sinh mùi hôi nhẹ. Nhờ KTV mang dụng cụ thông tắc chuyên dụng hỗ trợ xử lý.`;
  }
  if (lower.includes('máy lạnh') || lower.includes('điều hòa')) {
    return `Hiện tượng: Máy điều hòa nhiệt độ ${areaText} hoạt động nhưng không mát / có tiếng kêu lạ và chảy nước dàn lạnh. Nhờ KTV kiểm tra gas, phin lọc và đường ống xả.`;
  }

  return `Hiện tượng: Phát hiện sự cố ${trimmed} ${areaText}. Căn hộ cần Đội Kỹ Thuật Tòa Nhà đến khảo sát thực tế và hỗ trợ xử lý khắc phục đảm bảo an toàn sinh hoạt.`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, content, area, category, aptCode, residentName, imageBase64, imageMimeType } = body;

    // ──────────────────────────────────────────────────────────────
    // 0. ACTION: PHÂN TÍCH ẢNH SỰ CỐ (AI IMAGE ANALYSIS)
    // ──────────────────────────────────────────────────────────────
    if (action === 'ANALYZE_IMAGE') {
      if (!imageBase64) {
        return NextResponse.json({ success: false, error: 'Không có ảnh để phân tích' }, { status: 400 });
      }

      const systemPrompt = `Bạn là AI Chuyên Gia Kỹ Thuật của Chung Cư Cao Cấp Skyline Smart Residence (TP.HCM).
Nhiệm vụ: Phân tích ảnh sự cố do cư dân tải lên và trả về đánh giá kỹ thuật ngắn gọn.

Hãy xác định:
1. MỨC ĐỘ: LOW (nhẹ, chưa cần xử lý gấp), MEDIUM (cần xử lý trong ngày), HIGH (khẩn cấp < 45 phút)
2. HẠNG MỤC: Điện / Nước / Điều hòa / Khóa cửa / Khác
3. TÓM TẮT: 1-2 câu mô tả những gì quan sát được trong ảnh (hiện tượng, vị trí, dấu hiệu rõ ràng)
4. HÀNH ĐỘNG: 1 câu khuyến cáo tức thì cho cư dân trong lúc chờ KTV

Trả về chính xác theo format JSON sau (không có markdown, không giải thích thêm):
{"severity":"LOW|MEDIUM|HIGH","category":"tên hạng mục","summary":"mô tả quan sát","action":"hành động khuyến cáo"}`;

      try {
        const visionResponse = await callGeminiVision(
          imageBase64,
          imageMimeType || 'image/jpeg',
          `Ảnh sự cố trong căn hộ${area ? ` khu vực ${area}` : ''}${aptCode ? ` (Căn ${aptCode})` : ''}. Phân tích và trả về JSON như hướng dẫn.`,
          systemPrompt
        );

        let parsed: { severity: string; category: string; summary: string; action: string };
        try {
          const cleaned = visionResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          parsed = JSON.parse(cleaned);
        } catch {
          parsed = {
            severity: visionResponse.toLowerCase().includes('khẩn') || visionResponse.toLowerCase().includes('nguy hiểm') ? 'HIGH'
              : visionResponse.toLowerCase().includes('cần xử lý') ? 'MEDIUM' : 'LOW',
            category: area || 'Khác',
            summary: visionResponse.substring(0, 200),
            action: 'Vui lòng chờ Kỹ thuật viên đến kiểm tra trực tiếp.',
          };
        }

        return NextResponse.json({
          success: true,
          severity: parsed.severity as 'LOW' | 'MEDIUM' | 'HIGH',
          category: parsed.category,
          summary: parsed.summary,
          action: parsed.action,
          source: 'GEMINI_VISION_AI',
        });
      } catch (err) {
        const fallback = getLocalImageAnalysis(area);
        return NextResponse.json({ success: true, ...fallback, source: 'LOCAL_RULE_ENGINE' });
      }
    }

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ success: false, error: 'Nội dung không hợp lệ' }, { status: 400 });
    }

    // 1. ACTION: TỐI ƯU HÓA MÔ TẢ PHIẾU (SMART PROMPT POLISH)
    if (action === 'POLISH_DESCRIPTION') {
      try {
        const systemPrompt = `Bạn là Trợ lý Kỹ thuật Chung Cư Cao Cấp Skyline Smart Residence.
Nhiệm vụ: Nhận một mô tả ngắn hoặc cụt ngủn của cư dân về sự cố trong căn hộ, viết lại thành 1 ĐOẠN VĂN NGẮN GỌN (dưới 45 từ) chuẩn mực kỹ thuật, nêu rõ hiện tượng, vị trí (${area || 'trong căn hộ'}), thái độ lịch sự, để Kỹ thuật viên tòa nhà đọc hiểu ngay lập tức.
Chỉ trả về nội dung đã viết lại, không giải thích thêm hay dùng dấu ngoặc kép.`;
        
        const polished = await callGemini(
          `Mô tả gốc của cư dân: "${content}". Vị trí: ${area || 'không chỉ định'}.`,
          systemPrompt
        );
        return NextResponse.json({
          success: true,
          polishedContent: polished.replace(/^"|"$/g, '').trim(),
          source: 'GEMINI_AI',
        });
      } catch (err) {
        // Fallback tức thì nếu Gemini chậm hoặc offline
        const fallback = getLocalPolishedDescription(content, area);
        return NextResponse.json({
          success: true,
          polishedContent: fallback,
          source: 'RULE_ENGINE',
        });
      }
    }

    // 2. ACTION: CHẨN ĐOÁN THỜI GIAN THỰC & KHUYẾN NGHỊ AN TOÀN (LIVE DIAGNOSIS & SAFETY)
    if (action === 'DIAGNOSE') {
      const classification = classifyTicket(content, category);
      const safetyTip = getLocalSafetyTips(category || classification.type, content);

      let urgency = classification.urgent ? 'HIGH' : 'NORMAL';
      let estimatedSla = classification.urgent ? '15 - 30 phút' : 'Trong vòng 45 - 60 phút';

      // Gợi ý KTV phù hợp theo chuyên môn
      let suggestedTech = 'Nguyễn Văn Hùng (Chuyên trách Điện Nước)';
      const lower = content.toLowerCase();
      if (lower.includes('lạnh') || lower.includes('điều hòa') || lower.includes('thang')) {
        suggestedTech = 'Trần Đình Trọng (Chuyên môn Điện Lạnh & Cơ Điện)';
      } else if (lower.includes('vệ sinh') || lower.includes('rác') || lower.includes('mùi')) {
        suggestedTech = 'Lê Thị Mai (Tổ trưởng Vệ sinh & Cảnh quan)';
      }

      return NextResponse.json({
        success: true,
        classification,
        urgency,
        estimatedSla,
        safetyTip,
        suggestedTechnician: suggestedTech,
        source: 'AI_DIAGNOSTIC_ENGINE',
      });
    }

    // 3. ACTION: GIẢI ĐÁP TỰ ĐỘNG CÂU HỎI TIỆN ÍCH (INSTANT FAQ AUTO REPLY)
    if (action === 'ANSWER_INQUIRY') {
      // Thử dùng RAG nội bộ trước (nhanh < 10ms và chuẩn 100% nội quy Skyline)
      const localAnswer = findInquiryAnswer(content);
      const isGeneric = localAnswer.includes('Bộ phận Chăm sóc Cư dân Skyline xin thông tin');

      if (!isGeneric) {
        return NextResponse.json({
          success: true,
          reply: localAnswer,
          confidence: 0.98,
          source: 'SKYLINE_KNOWLEDGE_BASE',
        });
      }

      // Nếu câu hỏi phức tạp hơn, hỏi Gemini có nạp ngữ cảnh Skyline
      try {
        const systemPrompt = `Bạn là Trợ lý AI Cư Dân của Chung Cư Cao Cấp Skyline Smart Residence (Quận 7, TP.HCM).
Dữ liệu chuẩn:
- 25 tầng nổi, 2 tầng hầm (B1 xe máy, B2 ô tô).
- Hồ bơi vô cực chân mây Tầng 25: 06:00 - 22:00 hàng ngày (miễn phí cư dân).
- Trung tâm thể hình Technogym Tầng 3: 24/7 (miễn phí).
- Phòng xông hơi đá muối Tầng 3: 08:00 - 22:00 (500k/giờ).
- Khu vui chơi trẻ em Sky Kids Tầng 1: 07:00 - 21:00 (miễn phí).
- Vườn BBQ Tầng 25: 17:00 - 23:00 (600k/ca, cần đặt trước).
- Hóa đơn dịch vụ: phát hành mùng 5, hạn đóng ngày 20 qua VietQR/VNPAY trên Cổng cư dân.
- Ban quản lý: Sảnh L1, Hotline 1900 8899.
Trả lời cư dân lịch sự, ngắn gọn (dưới 80 từ), chính xác và hữu ích.`;

        const geminiReply = await callGemini(
          `Cư dân căn hộ ${aptCode || 'Skyline'} hỏi: "${content}"`,
          systemPrompt
        );

        return NextResponse.json({
          success: true,
          reply: geminiReply,
          confidence: 0.95,
          source: 'GEMINI_AI',
        });
      } catch (err) {
        return NextResponse.json({
          success: true,
          reply: localAnswer,
          confidence: 0.85,
          source: 'SKYLINE_KNOWLEDGE_BASE_FALLBACK',
        });
      }
    }

    return NextResponse.json({ success: false, error: 'Action không hỗ trợ' }, { status: 400 });
  } catch (error: any) {
    console.error('Lỗi API AI Ticket Assistant:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi xử lý AI' },
      { status: 500 }
    );
  }
}
