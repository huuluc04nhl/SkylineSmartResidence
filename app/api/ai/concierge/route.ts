import { NextRequest, NextResponse } from 'next/server';
import { askGeminiConcierge } from '@/lib/geminiClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, history } = body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        { success: false, error: 'Tin nhắn không được để trống.' },
        { status: 400 }
      );
    }

    const reply = await askGeminiConcierge(message, history || []);
    return NextResponse.json({
      success: true,
      reply,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in /api/ai/concierge:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Lỗi xử lý yêu cầu với Google Gemini AI.',
        fallbackReply:
          'Xin lỗi Quý cư dân, hệ thống AI Concierge đang kết nối lại tới máy chủ bảo mật. Quý vị vui lòng thử lại sau giây lát hoặc liên hệ trực tiếp Hotline BQL 1900 8899.',
      },
      { status: 500 }
    );
  }
}
