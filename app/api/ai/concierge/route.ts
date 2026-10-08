import { NextRequest, NextResponse } from 'next/server';
import { askGeminiConcierge, generateSmartProjectFallback, extractAiSuggestions, ConciergeContext } from '@/lib/geminiClient';
import { getUserStore, getApartmentMembers } from '@/lib/userStore';
import { getBills } from '@/lib/billingStore';
import { getTickets } from '@/lib/ticketStore';
import { getAllVisitorPasses } from '@/lib/visitorStore';
import { getFacilityBookings } from '@/lib/facilityStore';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  let userMessage = '';
  let fallbackContext: ConciergeContext = {
    aptCode: 'CH-06',
    userName: 'Trần Hữu Lực',
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
      tickets,
      bills,
      members,
    } = body;

    userMessage = message || '';

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        { success: false, error: 'Tin nhắn không được để trống.' },
        { status: 400 }
      );
    }

    const targetApt = aptCode || 'CH-06';
    const dynamicUser = getUserStore(targetApt);

    // Dynamic resolution of actual project data if not supplied by client
    const actualBookings = Array.isArray(bookings) ? bookings : getFacilityBookings(targetApt);
    const actualTickets = Array.isArray(tickets) ? tickets : getTickets(targetApt);
    const actualVisitors = Array.isArray(visitors) ? visitors : getAllVisitorPasses();
    const actualBills = Array.isArray(bills) ? bills : getBills(targetApt);
    const actualMembers = Array.isArray(members) ? members : getApartmentMembers(targetApt);

    const context: ConciergeContext = {
      aptCode: targetApt,
      userName: userName || dynamicUser?.fullname || dynamicUser?.full_name || 'Trần Hữu Lực',
      userRole: userRole || dynamicUser?.role || 'OWNER',
      phone: phone || dynamicUser?.phone || '0364967082',
      email: email || dynamicUser?.email || 'huuluc04nhl@gmail.com',
      idCard: idCard || dynamicUser?.id_number || dynamicUser?.id_card_no || '083204008123',
      licensePlate: licensePlate || dynamicUser?.license_plate || '51K-889.99',
      bookings: actualBookings,
      tickets: actualTickets,
      visitors: actualVisitors,
      bills: actualBills,
      members: actualMembers,
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

