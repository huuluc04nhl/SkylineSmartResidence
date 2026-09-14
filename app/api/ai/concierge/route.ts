import { NextRequest, NextResponse } from 'next/server';
import { askGeminiConcierge, generateSmartProjectFallback } from '@/lib/geminiClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, history, aptCode } = body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        { success: false, error: 'Tin nhắn không được để trống.' },
        { status: 400 }
      );
    }

    const targetAptCode = aptCode || '12A05';
    const reply = await askGeminiConcierge(message, history || [], targetAptCode);

    return NextResponse.json({
      success: true,
      reply,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Handled error in /api/ai/concierge:', error);
    // Never fail the user: return instant smart project data answer
    const fallbackAnswer = generateSmartProjectFallback(error?.message || '', '12A05');
    return NextResponse.json({
      success: true,
      reply: fallbackAnswer,
      timestamp: new Date().toISOString(),
      isFallback: true,
    });
  }
}
