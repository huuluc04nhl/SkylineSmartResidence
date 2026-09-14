/**
 * Skyline Smart Residence - Google Gemini AI Client
 * Powered by Google Gemini 2.5 Flash / 1.5 Flash
 */

export const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY ||
  process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
  '';

const GEMINI_PRIMARY_MODEL = 'gemini-2.5-flash';
const GEMINI_FALLBACK_MODEL = 'gemini-1.5-flash';

const CONCIERGE_SYSTEM_PROMPT = `
Bạn là "Skyline AI Concierge" - Người bạn đồng hành và Trợ lý thông minh tận tâm 24/7 của Quý cư dân tại Khu phức hợp Căn hộ Cao cấp Skyline Smart Residence (Quận 7, TP. Hồ Chí Minh).

THÔNG TIN QUAN TRỌNG DÀNH CHO CƯ DÂN (DỄ HIỂU, TỰ NHIÊN):
1. Vị trí & Tòa nhà:
   - Tọa lạc tại cung đường ven sông thoáng đãng Quận 7, TP.HCM.
   - Gồm 2 tòa tháp: Skyline Diamond (Tháp A) và Skyline Sapphire (Tháp B), cao 40 tầng sang trọng.
   - An ninh được bảo vệ 24/7 với hệ thống camera thông minh, cổng kiểm soát tự động và bảo vệ trực sảnh.

2. Tiện ích 5 sao dành cho cư dân (Miễn phí sử dụng khi có Thẻ cư dân):
   - Hồ bơi vô cực Horizon: Tầng 5, mở cửa từ 06:00 sáng đến 21:00 tối hàng ngày. Mỗi căn hộ được miễn phí 20 lượt bơi mỗi tháng.
   - Phòng tập Gym & Yoga: Tầng 5, mở cửa từ 05:30 sáng đến 22:00 đêm hàng ngày với đầy đủ trang thiết bị hiện đại.
   - Sân Pickleball & Tennis tầng thượng: Tầng 38, mở cửa từ 06:00 đến 22:00. Quý cư dân vui lòng đặt trước trên ứng dụng để giữ sân.
   - Phòng tiếp khách & làm việc Sky Lounge: Tầng 38, mở cửa từ 08:00 đến 22:00 (không gian yên tĩnh, sang trọng).
   - Khu vui chơi trẻ em Kid Zone: Tầng trệt và tầng 2, mở cửa từ 07:00 đến 21:00 an toàn, sạch sẽ.

3. Biểu phí sinh hoạt & dịch vụ định kỳ:
   - Phí quản lý tòa nhà: 10.000 VNĐ / m² diện tích căn hộ / tháng.
   - Nước sinh hoạt: 18.000 VNĐ / m³ (đồng hồ đo tự động chính xác).
   - Phí gửi xe ô tô: 1.400.000 VNĐ / xe / tháng (đỗ tại tầng hầm B1, B2).
   - Phí gửi xe máy: 120.000 VNĐ / xe / tháng.
   - Hạn thanh toán: Từ ngày 01 đến ngày 10 hàng tháng, thanh toán thuận tiện qua Cổng cư dân hoặc chuyển khoản ngân hàng.

4. Cửa thông minh & An toàn căn hộ:
   - Cách mở cửa căn hộ: Quét khuôn mặt (nhanh chỉ 1 giây), Chạm thẻ cư dân, Nhập mã số tạm thời cho khách, hoặc Mở cửa từ xa qua chuông hình có camera.
   - Tính năng an toàn: Cửa tự động khóa chốt sau 5 giây để tránh quên, Khóa riêng tư ban đêm, và Cảnh báo chống cạy cửa an toàn.
   - Đón khách đến chơi: Chủ hộ tạo mã vé điện tử gửi cho người thân/bạn bè để tự bấm thang máy lên thẳng căn hộ.

5. Hỗ trợ kỹ thuật & Liên hệ khẩn cấp:
   - Đội kỹ thuật trực ban: Cam kết có mặt tại căn hộ hỗ trợ trong vòng 60 phút khi nhận được yêu cầu.
   - Tổng đài Ban Quản Lý (BQL): 1900 8899 hoặc 028.7300.8899.
   - Văn phòng BQL: Tầng trệt Sảnh A, mở cửa 08:00 - 17:30 (Thứ 2 đến Thứ 7).
   - Lễ tân & Bảo vệ trực 24/7 tại sảnh đón khách.

NGUYÊN TẮC GIAO TIẾP VÀ DÙNG TỪ (CỰC KỲ QUAN TRỌNG):
- Xưng hô: "Tôi" và gọi cư dân là "Quý cư dân" hoặc "Quý vị".
- Dùng ngôn ngữ tự nhiên, ấm áp, gần gũi, tôn trọng và chu đáo như một quản gia khách sạn 5 sao.
- TUYỆT ĐỐI TRÁNH dùng các thuật ngữ chuyên ngành kỹ thuật khô khan (như: "RAG", "SLA", "AES-256", "Matter", "Zigbee", "Turnstile", "UID", "eKYC", "IoT", "Token"). Thay bằng các từ ngữ đời thường, thân thiện: "cổng vào tiện ích", "cam kết hỗ trợ trong 60 phút", "nhận diện khuôn mặt", "thẻ cư dân", "hệ thống bảo mật an toàn".
- Câu trả lời rõ ràng, ngắn gọn, có gạch đầu dòng các ý chính để cư dân đọc nhanh và thoải mái nhất.
`;

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

/**
 * Send message to Gemini AI for Skyline Concierge Chat
 */
export async function askGeminiConcierge(
  message: string,
  history: ChatMessage[] = []
): Promise<string> {
  const contents = [
    ...history.slice(-8).map((h) => ({
      role: h.role === 'model' ? 'model' : 'user',
      parts: [{ text: h.text }],
    })),
    {
      role: 'user',
      parts: [{ text: message }],
    },
  ];

  const payload = {
    systemInstruction: {
      parts: [{ text: CONCIERGE_SYSTEM_PROMPT }],
    },
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1000,
    },
  };

  const tryModel = async (model: string) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error [${response.status}]: ${errText}`);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    const replyText = candidate?.content?.parts?.[0]?.text;
    if (!replyText) {
      throw new Error('Gemini API returned empty candidate response.');
    }
    return replyText;
  };

  try {
    return await tryModel(GEMINI_PRIMARY_MODEL);
  } catch (err) {
    console.warn(`Gemini primary model ${GEMINI_PRIMARY_MODEL} failed, falling back to ${GEMINI_FALLBACK_MODEL}:`, err);
    return await tryModel(GEMINI_FALLBACK_MODEL);
  }
}

/**
 * Extract clean base64 data and mime type from data URL
 */
function parseDataUrl(dataUrl: string): { mimeType: string; base64: string } {
  if (dataUrl.startsWith('data:')) {
    const matches = dataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      return { mimeType: matches[1], base64: matches[2] };
    }
  }
  // Assume jpeg if raw base64
  return { mimeType: 'image/jpeg', base64: dataUrl };
}

export interface GeminiOcrCccdResult {
  idNumber: string;
  fullName: string;
  dob: string;
  gender: '1' | '0';
  pob: string;
  residence: string;
  province: string;
  idDate: string;
  idPlace: string;
  confidence: number;
}

/**
 * Use Gemini Vision to perform high-accuracy OCR on Vietnamese CCCD chip card
 */
export async function parseCccdWithGeminiVision(
  frontImage: string,
  backImage?: string
): Promise<GeminiOcrCccdResult> {
  const parts: any[] = [
    {
      text: `Bạn là hệ thống trích xuất thông tin Căn Cước Công Dân (CCCD gắn chip) Việt Nam siêu chính xác cấp chuyên gia eKYC.
Nhiệm vụ: Phân tích kỹ ảnh chụp thẻ CCCD (mặt trước và mặt sau nếu có) và trích xuất đúng các trường thông tin.

YÊU CẦU ĐẦU RA BẮT BUỘC:
Chỉ trả về DUY NHẤT một chuỗi JSON hợp lệ (không kèm theo văn bản giải thích, không bọc trong markdown tick nếu có thể, hoặc bọc trong \`\`\`json ... \`\`\`) theo cấu trúc:
{
  "idNumber": "Số CCCD gồm đúng 12 chữ số",
  "fullName": "Họ và tên tiếng Việt viết hoa đầy đủ dấu, ví dụ: NGUYỄN VĂN AN",
  "dob": "Ngày tháng năm sinh định dạng YYYY-MM-DD hoặc DD/MM/YYYY",
  "gender": "1" cho Nam hoặc "0" cho Nữ,
  "pob": "Quê quán đầy đủ",
  "residence": "Nơi thường trú đầy đủ",
  "province": "Tỉnh hoặc Thành phố nơi thường trú",
  "idDate": "Ngày cấp thẻ định dạng YYYY-MM-DD hoặc DD/MM/YYYY",
  "idPlace": "Nơi cấp (thường là Cục Cảnh sát QLHC về TTXH)"
}

LƯU Ý CỰC KỲ QUAN TRỌNG:
- Không lấy các từ nhãn "Họ và tên", "Full name", "Số / No", "Ngày sinh", "Giới tính", "Quê quán", "Nơi thường trú" vào giá trị.
- Tên người phải đúng chính tả tiếng Việt có dấu.
- Số CCCD phải đúng 12 chữ số.
- Nếu không tìm thấy thông tin nào đó thì để chuỗi rỗng "".`,
    },
  ];

  if (frontImage) {
    const front = parseDataUrl(frontImage);
    parts.push({
      inlineData: {
        mimeType: front.mimeType,
        data: front.base64,
      },
    });
  }

  if (backImage) {
    const back = parseDataUrl(backImage);
    parts.push({
      inlineData: {
        mimeType: back.mimeType,
        data: back.base64,
      },
    });
  }

  const payload = {
    contents: [{ parts }],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json',
    },
  };

  const tryModel = async (model: string) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini Vision API error [${response.status}]: ${errText}`);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    let replyText = candidate?.content?.parts?.[0]?.text;
    if (!replyText) {
      throw new Error('Gemini Vision returned empty candidate response.');
    }

    // Clean markdown code blocks if present
    replyText = replyText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
    const parsed = JSON.parse(replyText);

    return {
      idNumber: (parsed.idNumber || '').replace(/\D/g, '').slice(0, 12),
      fullName: (parsed.fullName || '').toUpperCase().trim(),
      dob: parsed.dob || '',
      gender: (parsed.gender === '0' || parsed.gender === 0 ? '0' : '1') as '1' | '0',
      pob: parsed.pob || '',
      residence: parsed.residence || parsed.pob || '',
      province: parsed.province || '',
      idDate: parsed.idDate || '',
      idPlace: parsed.idPlace || 'Cục Cảnh sát QLHC về TTXH',
      confidence: 99,
    };
  };

  try {
    return await tryModel(GEMINI_PRIMARY_MODEL);
  } catch (err) {
    console.warn(`Gemini Vision OCR with ${GEMINI_PRIMARY_MODEL} failed, falling back to ${GEMINI_FALLBACK_MODEL}:`, err);
    return await tryModel(GEMINI_FALLBACK_MODEL);
  }
}
