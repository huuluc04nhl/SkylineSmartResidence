import { NextRequest, NextResponse } from 'next/server';
import { askGeminiConcierge, generateSmartProjectFallback } from '@/lib/geminiClient';
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

    const reply = await askGeminiConcierge(message, history || [], context);

    return NextResponse.json({
      success: true,
      reply,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Handled error in /api/ai/concierge:', error);
    // Never fail the user: return instant smart project data answer using resident's prompt!
    const fallbackAnswer = generateSmartProjectFallback(userMessage || '', fallbackContext);
    return NextResponse.json({
      success: true,
      reply: fallbackAnswer,
      timestamp: new Date().toISOString(),
      isFallback: true,
    });
  }
}
