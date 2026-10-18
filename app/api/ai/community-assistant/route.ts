import { NextRequest, NextResponse } from 'next/server';
import { GEMINI_API_KEY } from '@/lib/geminiClient';

export const maxDuration = 45;

const GEMINI_MODELS = [
  'gemini-flash-lite-latest',
  'gemini-2.5-flash-lite',
  'gemini-flash-latest',
];

const GEMINI_TIMEOUT_MS = 8000;

async function callGemini(
  prompt: string,
  systemInstruction: string,
  timeoutMs = GEMINI_TIMEOUT_MS
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  let lastError: any = null;

  for (const model of GEMINI_MODELS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      const payload = {
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemInstruction}\n\n${prompt}` }],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
          maxOutputTokens: 1024,
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
        throw new Error(`Gemini ${model} error: ${err}`);
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error(`No text returned from ${model}`);
      return text.trim();
    } catch (err: any) {
      clearTimeout(timer);
      lastError = err;
      console.warn(`Community AI call to ${model} failed (${err.message}), trying next model...`);
    }
  }

  throw lastError || new Error('All Gemini models failed');
}

// Fallback logic when Gemini is offline or timeout
function localDeterministicAnalysis(title: string, content: string): {
  moderation: 'Clean' | 'Warning' | 'Toxic';
  moderationReason?: string;
  sentiment: number;
  sentimentLabel: 'Tích cực' | 'Trung lập' | 'Góp ý' | 'Bức xúc';
  isHotspot: boolean;
  suggestedTags: string[];
  aiQuickReply?: string;
} {
  const text = `${title} ${content}`.toLowerCase();
  const toxicWords = ['lừa đảo', 'chửi', 'đập phá', 'cứt', 'đụ', 'địt', 'chó đẻ', 'bố láo', 'mẹ kiếp'];
  const hotspotWords = ['quá tệ', 'bức xúc', 'mất nước', 'cúp điện', 'cháy nổ', 'rò rỉ', 'hỏng hoài', 'bảo vệ dọa', 'nguy hiểm'];
  const positiveWords = ['cảm ơn', 'hài lòng', 'tuyệt vời', 'khen ngợi', 'chu đáo', 'ủng hộ', 'đẹp'];
  const suggestionWords = ['đề xuất', 'góp ý', 'nên', 'cần xem xét', 'mong bql', 'cải thiện'];

  const isToxic = toxicWords.some(w => text.includes(w));
  if (isToxic) {
    return {
      moderation: 'Toxic',
      moderationReason: 'Nội dung chứa từ ngữ công kích hoặc vi phạm chuẩn mực văn minh cộng đồng.',
      sentiment: -0.95,
      sentimentLabel: 'Bức xúc',
      isHotspot: true,
      suggestedTags: ['Cần rà soát'],
    };
  }

  const isHotspot = hotspotWords.some(w => text.includes(w));
  let sentimentScore = 0.5;
  if (positiveWords.some(w => text.includes(w))) sentimentScore += 0.35;
  if (suggestionWords.some(w => text.includes(w))) sentimentScore += 0.15;
  if (isHotspot) sentimentScore -= 0.55;
  sentimentScore = Math.max(-1, Math.min(1, sentimentScore));

  let label: 'Tích cực' | 'Trung lập' | 'Góp ý' | 'Bức xúc' = 'Trung lập';
  if (sentimentScore >= 0.7) label = 'Tích cực';
  else if (sentimentScore >= 0.5) label = 'Góp ý';
  else if (sentimentScore < 0.2) label = 'Bức xúc';

  // Check if inquiry about building rules
  let quickReply: string | undefined = undefined;
  if (text.includes('hồ bơi') || text.includes('bơi')) {
    quickReply = 'Hồ bơi vô cực (Tầng 25) và Cụm hồ bơi resort nội khu The Tropical mở cửa từ 06:00 - 22:00 hàng ngày, miễn phí vào tự do bằng FaceID/Thẻ cư dân.';
  } else if (text.includes('gym') || text.includes('phòng tập')) {
    quickReply = 'Trung tâm thể hình Technogym (Tầng 3) mở cửa 24/7 suốt ngày đêm, phục vụ miễn phí cho toàn thể cư dân.';
  } else if (text.includes('bbq') || text.includes('xông hơi') || text.includes('sauna')) {
    quickReply = 'Vườn nướng BBQ chân mây (17:00-23:00) và Phòng xông hơi VIP (08:00-22:00) là tiện ích riêng tư, Quý cư dân vui lòng đặt trước tại tab Tiện Ích để giữ chỗ.';
  } else if (text.includes('hotline') || text.includes('bảo vệ') || text.includes('số điện thoại')) {
    quickReply = 'Hotline Ban Quản Lý túc trực 24/7: 1900 8899. Quầy Lễ tân tiếp dân đặt tại Sảnh Grand Lobby Tầng 1.';
  }

  return {
    moderation: isHotspot ? 'Warning' : 'Clean',
    sentiment: sentimentScore,
    sentimentLabel: label,
    isHotspot,
    suggestedTags: ['Cộng đồng', 'Skyline'],
    aiQuickReply: quickReply,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, title, content, authorRole, aptCode, posts } = body;

    // 1. ACTION: ANALYZE A SINGLE POST OR COMMENT
    if (action === 'ANALYZE_POST') {
      if (!title && !content) {
        return NextResponse.json({ success: false, message: 'Thiếu nội dung phân tích' }, { status: 400 });
      }

      const systemInstruction = `Bạn là AI Giám Sát & Kiểm Duyệt Cộng Đồng Chung Cư Cao Cấp SKYLINE Smart Residence (Khu The Tropical - Beverly Solari).
Nhiệm vụ:
1. Kiểm duyệt nội dung (moderation):
   - "Clean": Bình thường, lành mạnh, văn minh.
   - "Warning": Có bức xúc, tranh luận gắt gao hoặc phản ánh dịch vụ nhưng chưa vi phạm.
   - "Toxic": Chửi bới thô tục, bôi nhọ cá nhân/BQL, lừa đảo, quảng cáo bậy, kích động bạo lực.
2. Phân tích cảm xúc (sentiment):
   - sentimentScore: số thực từ -1.0 (cực kỳ bức xúc) đến 1.0 (rất tích cực/hài lòng).
   - sentimentLabel: "Tích cực", "Trung lập", "Góp ý", hoặc "Bức xúc".
   - isHotspot: true nếu là vấn đề nhức nhối cần BQL can thiệp ngay (mất nước, rò rỉ, an ninh, tiếng ồn đêm).
3. Đề xuất nhãn (suggestedTags): mảng 2-3 tag ngắn gọn.
4. Trả lời tự động (aiQuickReply): Nếu bài viết là câu hỏi thắc mắc về nội quy, giờ giấc, biểu phí hoặc tiện ích chung cư, hãy sinh câu trả lời ngắn gọn (1-2 câu), chuẩn xác, lịch sự từ góc độ Trợ lý ảo Skyline AI. Nếu là bài rao vặt hoặc chia sẻ bình thường, để null.

Định dạng JSON trả về bắt buộc:
{
  "moderation": "Clean" | "Warning" | "Toxic",
  "moderationReason": "Lý do nếu Warning hoặc Toxic",
  "sentiment": number,
  "sentimentLabel": "Tích cực" | "Trung lập" | "Góp ý" | "Bức xúc",
  "isHotspot": boolean,
  "suggestedTags": ["tag1", "tag2"],
  "aiQuickReply": "Câu trả lời của AI nếu có câu hỏi thắc mắc, hoặc null"
}`;

      const userPrompt = `Tiêu đề: ${title || '(Không có)'}
Nội dung: ${content}
Tác giả: ${authorRole || 'Cư dân'} (Căn hộ: ${aptCode || 'N/A'})`;

      try {
        const rawJson = await callGemini(userPrompt, systemInstruction);
        const parsed = JSON.parse(rawJson);
        return NextResponse.json({
          success: true,
          source: 'GEMINI_AI',
          data: parsed,
        });
      } catch (aiErr: any) {
        console.warn('Gemini community analysis failed, falling back to local engine:', aiErr.message);
        const fallback = localDeterministicAnalysis(title || '', content || '');
        return NextResponse.json({
          success: true,
          source: 'LOCAL_ENGINE_FALLBACK',
          data: fallback,
        });
      }
    }

    // 2. ACTION: GENERATE COMMUNITY SENTIMENT REPORT FOR ADMIN
    if (action === 'COMMUNITY_REPORT') {
      const postList = Array.isArray(posts) ? posts : [];
      if (postList.length === 0) {
        return NextResponse.json({
          success: true,
          data: {
            summary: 'Hiện tại diễn đàn chưa có bài viết nào, không gian thảo luận hoàn toàn yên tĩnh và ổn định.',
            hotspots: [],
            actionableRecommendations: [
              'BQL có thể đăng thông báo định kỳ về kế hoạch bảo trì tháng để tăng kết nối với cư dân.',
            ],
            overallSatisfactionScore: 95,
          },
        });
      }

      const systemInstruction = `Bạn là Giám đốc Vận hành AI của Ban Quản Lý Chung Cư SKYLINE.
Nhiệm vụ: Phân tích danh sách các bài viết diễn đàn cư dân gần đây để đưa ra Báo cáo Cảm xúc Cộng đồng và Đề xuất Chiến lược hành động (Actionable Recommendations) cho Ban Quản Lý.
Định dạng JSON trả về:
{
  "summary": "Tóm tắt 2-3 câu về tâm tư, nguyện vọng chung và xu hướng thảo luận nổi bật của cư dân",
  "hotspots": ["Vấn đề nóng 1", "Vấn đề nóng 2 nếu có"],
  "actionableRecommendations": [
    "Khuyến nghị cụ thể 1 cho BQL",
    "Khuyến nghị cụ thể 2 cho BQL"
  ],
  "overallSatisfactionScore": 0-100
}`;

      const promptPosts = postList.slice(0, 15).map((p: any, idx: number) => 
        `#${idx + 1} [${p.category}] "${p.title}": ${p.content.slice(0, 150)} (Cảm xúc: ${p.aiSentimentLabel || 'Trung lập'})`
      ).join('\n');

      try {
        const rawJson = await callGemini(`Danh sách bài viết:\n${promptPosts}`, systemInstruction);
        const parsed = JSON.parse(rawJson);
        return NextResponse.json({ success: true, source: 'GEMINI_AI', data: parsed });
      } catch (aiErr: any) {
        console.warn('Gemini report generation failed, using local aggregate:', aiErr.message);
        return NextResponse.json({
          success: true,
          source: 'LOCAL_ENGINE_FALLBACK',
          data: {
            summary: `Đã phân tích ${postList.length} bài viết thực tế. Đa số cư dân có thái độ hợp tác và đóng góp tích cực cho chất lượng sống tòa nhà.`,
            hotspots: postList.filter((p: any) => p.isHotspot).map((p: any) => p.title),
            actionableRecommendations: [
              'Tiếp tục theo dõi các phản hồi về tiện ích hồ bơi và biểu phí dịch vụ.',
              'Phản hồi nhanh các thắc mắc của cư dân trong vòng 30 phút để duy trì chỉ số hài lòng cao.',
            ],
            overallSatisfactionScore: 90,
          },
        });
      }
    }

    return NextResponse.json({ success: false, message: 'Hành động không hợp lệ' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Lỗi xử lý AI' }, { status: 500 });
  }
}
