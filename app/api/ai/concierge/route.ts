import { NextRequest, NextResponse } from 'next/server';
import { askGeminiConcierge, generateSmartProjectFallback } from '@/lib/geminiClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, history, aptCode, userName, userRole, bookings } = body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        { success: false, error: 'Tin nhắn không được để trống.' },
        { status: 400 }
      );
    }

    const context = {
      aptCode: aptCode || '12A05',
      userName: userName || 'Nguyễn Hữu Lực',
      userRole: userRole || 'OWNER',
      bookings: Array.isArray(bookings) ? bookings : undefined,
    };

    const reply = await askGeminiConcierge(message, history || [], context);

    return NextResponse.json({
      success: true,
      reply,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Handled error in /api/ai/concierge:', error);
    // Never fail the user: return instant smart project data answer
    const fallbackAnswer = generateSmartProjectFallback(error?.message || '', {
      aptCode: '12A05',
      userName: 'Nguyễn Hữu Lực',
      userRole: 'OWNER',
    });
    return NextResponse.json({
      success: true,
      reply: fallbackAnswer,
      timestamp: new Date().toISOString(),
      isFallback: true,
    });
  }
}
