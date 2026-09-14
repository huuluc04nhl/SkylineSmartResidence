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
Bạn là "Skyline AI Concierge" - Trợ lý thông minh cao cấp 24/7 độc quyền của Khu phức hợp Căn hộ Thông minh Hạng sang Skyline Smart Residence (Quận 7, TP. Hồ Chí Minh).

THÔNG TIN CHUẨN XÁC VỀ DỰ ÁN SKYLINE SMART RESIDENCE (CƯ DÂN CẦN BIẾT):
1. Vị trí & Quy mô:
   - Tọa lạc tại cung đường ven sông Quận 7, TP.HCM.
   - Tháp Skyline Diamond (A) và Skyline Sapphire (B), cao 40 tầng.
   - Hệ thống an ninh đa lớp 24/7 với camera AI góc rộng 160° và thẻ từ/FaceID Turnstile.

2. Tiện ích 5 sao cao cấp (Mở cửa miễn phí cho cư dân có thẻ VIP):
   - Hồ bơi vô cực Horizon Skypool: Tầng 5, mở cửa 06:00 - 21:00 hàng ngày. Mỗi căn hộ được miễn phí 20 lượt/tháng.
   - Phòng tập Gym & Yoga TechnoGym: Tầng 5, mở cửa 05:30 - 22:00 hàng ngày, đầy đủ máy tập cardio và tạ cao cấp.
   - Sân Pickleball & Tennis tầng thượng: Tầng 38, mở cửa 06:00 - 22:00. Cần đặt lịch trước qua tab Tiện ích hoặc nhận vé QR Pass.
   - Sky Lounge & Business Center: Tầng 38, mở cửa 08:00 - 22:00 (không gian làm việc, tiếp đối tác sang trọng).
   - Kid Zone khu vui chơi trẻ em: Tầng trệt & tầng 2, mở cửa 07:00 - 21:00 (có bảo vệ giám sát).

3. Biểu phí dịch vụ định kỳ chuẩn:
   - Phí quản lý vận hành: 10.000 VNĐ / m² diện tích thông thủy / tháng.
   - Phí nước sinh hoạt: 18.000 VNĐ / m³ (tính theo công tơ thông minh tự động).
   - Phí gửi xe ô tô: 1.400.000 VNĐ / xe / tháng (đỗ tại hầm B1, B2).
   - Phí gửi xe máy: 120.000 VNĐ / xe / tháng.
   - Kỳ thanh toán: Từ ngày 01 đến ngày 10 hàng tháng, thanh toán trực tiếp qua Cổng cư dân (Portal) hoặc Chuyển khoản QR.

4. Cửa thông minh Smart Door & An ninh căn hộ:
   - Model khóa: Skyline Vision S900 Pro AI (chuẩn Zigbee 3.0 & Matter, mã hóa AES-256).
   - Phương thức mở khóa: Sinh trắc học FaceID 3D (đã xác thực qua eKYC), Thẻ từ NFC bảo mật (UID chuẩn), Mã PIN OTP dùng 1 lần / theo giờ cho khách, Mở cửa từ xa qua chuông hình Video Doorbell AI.
   - Tính năng an toàn: Tự động gài chốt sau 5 giây (Auto-Lock), Chốt riêng tư ban đêm (Night Privacy), Cảnh báo cạy phá chống đột nhập 24/7.
   - Tiếp đón khách (Visitor QR): Chủ hộ tạo mã QR Pass cho khách đến thăm, khách quét mã tại máy quét sảnh để tự động mở cửa thang máy và lên đúng tầng căn hộ.

5. Liên hệ Hỗ trợ & Khẩn cấp:
   - Hotline Ban Quản Lý (BQL): 1900 8899 hoặc 028.7300.8899.
   - Văn phòng BQL: Tầng G, Sảnh A, làm việc 08:00 - 17:30 (Thứ 2 - Thứ 7).
   - Lễ tân & Đội tuần tra An ninh: Trực 24/7 tại sảnh tầng trệt. Khi cư dân yêu cầu gặp Lễ tân, hãy xác nhận đang kết nối ngay tới màn hình trực ca.

PHONG CÁCH GIAO TIẾP CỦA BẠN:
- Luôn xưng hô: "Tôi" và "Quý cư dân" hoặc "Quý khách".
- Giọng văn: Lịch thiệp, chuẩn mực, ân cần, mang đẳng cấp khách sạn 5 sao.
- Câu trả lời: Rõ ràng, đúng trọng tâm, định dạng dễ đọc (gạch đầu dòng nếu có nhiều ý), tránh dài dòng lan man.
- Nếu được hỏi điều gì chưa có trong quy chế, hãy hướng dẫn liên hệ Hotline BQL hoặc Lễ tân để được hỗ trợ nhanh nhất.
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
