import { NextRequest, NextResponse } from 'next/server';
import { parseCccdWithGeminiVision } from '@/lib/geminiClient';

// Config max body size for base64 images
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { frontImage, backImage } = body;

    if (!frontImage) {
      return NextResponse.json(
        { success: false, error: 'Thiếu ảnh mặt trước thẻ CCCD.' },
        { status: 400 }
      );
    }

    const result = await parseCccdWithGeminiVision(frontImage, backImage);

    return NextResponse.json({
      success: true,
      data: result,
      source: 'Google Gemini 2.5 Flash Vision',
    });
  } catch (error: any) {
    console.error('Error in /api/ai/ocr-cccd:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Không thể nhận diện thẻ CCCD qua Gemini Vision.',
      },
      { status: 500 }
    );
  }
}
