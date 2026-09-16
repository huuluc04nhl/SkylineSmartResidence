import { NextRequest, NextResponse } from 'next/server';
import { askGeminiConcierge, generateSmartProjectFallback, extractAiSuggestions } from '@/lib/geminiClient';
import { getUserStore } from '@/lib/userStore';

export async function POST(req: NextRequest) {
  let userMessage = '';
  let fallbackContext: any = {
    aptCode: '12A05',
    userName: 'Nguyễn Hữu Lực',
    userRole: 'OWNER',
  };

  try {
    const body = await req.json();
    const { 
      message, 
      history, 
      aptCode, 
      userName, 
      userRole, 
      bookings,
      phone,
      email,
      idCard,
      licensePlate,
      visitors,
      tickets 
    } = body;

    userMessage = message || '';

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        { success: false, error: 'Tin nhắn không được để trống.' },
        { status: 400 }
      );
    }

    const targetApt = aptCode || '12A05';
    const dynamicUser = getUserStore(targetApt);

    const context = {
      aptCode: targetApt,
      userName: userName || dynamicUser?.fullname || dynamicUser?.full_name || 'Nguyễn Hữu Lực',
      userRole: userRole || dynamicUser?.role || 'OWNER',
      phone: phone || dynamicUser?.phone,
      email: email || dynamicUser?.email,
      idCard: idCard || dynamicUser?.id_number || dynamicUser?.id_card_no,
      licensePlate: licensePlate || dynamicUser?.license_plate,
      bookings: Array.isArray(bookings) ? bookings : undefined,
      tickets: Array.isArray(tickets) ? tickets : undefined,
      visitors: Array.isArray(visitors) ? visitors : undefined,
    };

    fallbackContext = context;

    const rawReply = await askGeminiConcierge(message, history || [], context);
    const { cleanText, suggestions } = extractAiSuggestions(rawReply);

    return NextResponse.json({
      success: true,
      reply: cleanText,
      suggestions,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Handled error in /api/ai/concierge:', error);
    // Never fail the user: return instant smart project data answer using resident's prompt!
    const fallbackAnswer = generateSmartProjectFallback(userMessage || '', fallbackContext);
    const { cleanText, suggestions } = extractAiSuggestions(fallbackAnswer);
    return NextResponse.json({
      success: true,
      reply: cleanText,
      suggestions,
      timestamp: new Date().toISOString(),
      isFallback: true,
    });
  }
}
