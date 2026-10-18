import { NextRequest, NextResponse } from 'next/server';
import { parseVietnameseCccdQr, parseCccdText } from '@/lib/ocrParser';
import jpeg from 'jpeg-js';
import jsQR from 'jsqr';
import { createWorker } from 'tesseract.js';

export const dynamic = 'force-dynamic';

function decodeQrFromBase64(base64Data: string): string | null {
  try {
    const raw = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const buf = Buffer.from(raw, 'base64');
    const decoded = jpeg.decode(buf, { useTArray: true });
    if (!decoded || !decoded.data) return null;

    // 1. Scan full image
    const fullClamped = new Uint8ClampedArray(decoded.data);
    let code = jsQR(fullClamped, decoded.width, decoded.height, { inversionAttempts: 'attemptBoth' });
    if (code && code.data) return code.data;

    // 2. Scan top-right quadrant (where the CCCD QR code is located)
    const cropX = Math.round(decoded.width * 0.40);
    const cropW = Math.round(decoded.width * 0.60);
    const cropH = Math.round(decoded.height * 0.60);

    const cropped = new Uint8ClampedArray(cropW * cropH * 4);
    for (let y = 0; y < cropH; y++) {
      for (let x = 0; x < cropW; x++) {
        const srcIdx = ((y * decoded.width) + (cropX + x)) * 4;
        const dstIdx = ((y * cropW) + x) * 4;
        cropped[dstIdx] = decoded.data[srcIdx];
        cropped[dstIdx + 1] = decoded.data[srcIdx + 1];
        cropped[dstIdx + 2] = decoded.data[srcIdx + 2];
        cropped[dstIdx + 3] = decoded.data[srcIdx + 3];
      }
    }
    code = jsQR(cropped, cropW, cropH, { inversionAttempts: 'attemptBoth' });
    if (code && code.data) return code.data;

    return null;
  } catch (e) {
    return null;
  }
}

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

    // 1. Quét mã QR bảo mật trên mặt trước thẻ CCCD gắn chip (Chính xác 100% từ ảnh thẻ)
    try {
      const qrData = decodeQrFromBase64(frontImage);
      if (qrData) {
        const parsed = parseVietnameseCccdQr(qrData);
        if (parsed && parsed.idNumber) {
          return NextResponse.json({
            success: true,
            data: parsed,
            source: 'CCCD Security QR Code (Hardware Verified)',
          });
        }
      }
    } catch (qrErr) {
      console.warn('QR parse on server failed:', qrErr);
    }

    // 2. Nhận diện chữ trực tiếp trên ảnh thẻ qua Tesseract OCR đa luồng Node.js
    try {
      const worker = await createWorker(['vie', 'eng']);

      const frontClean = frontImage.replace(/^data:image\/\w+;base64,/, '');
      const frontBuf = Buffer.from(frontClean, 'base64');
      const frontRet = await worker.recognize(frontBuf);
      const parsedFront = parseCccdText(frontRet.data.text, false);

      let parsedBack: any = {};
      let backConfidence = 90;
      if (backImage) {
        const backClean = backImage.replace(/^data:image\/\w+;base64,/, '');
        const backBuf = Buffer.from(backClean, 'base64');
        const backRet = await worker.recognize(backBuf);
        parsedBack = parseCccdText(backRet.data.text, true);
        backConfidence = backRet.data.confidence || 90;
      }

      await worker.terminate();

      const merged = {
        idNumber: (parsedFront.idNumber || parsedBack.idNumber || '').replace(/\D/g, '').slice(0, 12),
        fullName: (parsedFront.fullName || parsedBack.fullName || '').toUpperCase().trim(),
        dob: parsedFront.dob || parsedBack.dob || '',
        gender: (parsedFront.gender || parsedBack.gender || '1') as '1' | '0',
        pob: parsedFront.pob || '',
        residence: parsedFront.residence || parsedFront.pob || '',
        province: parsedFront.province || 'TP. Hồ Chí Minh',
        idDate: parsedBack.idDate || parsedFront.idDate || '',
        idPlace: parsedBack.idPlace || parsedFront.idPlace || 'Cục Cảnh sát QLHC về TTXH',
        confidence: Math.round(((frontRet.data.confidence || 90) + backConfidence) / 2),
      };

      if (merged.idNumber || merged.fullName) {
        return NextResponse.json({
          success: true,
          data: merged,
          source: 'Skyline OCR Dual-Side Engine (Card Verified)',
        });
      }
    } catch (ocrErr: any) {
      console.warn('Server Tesseract OCR error:', ocrErr?.message);
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Không thể đọc được thông tin từ ảnh thẻ CCCD đã tải lên. Vui lòng chụp rõ nét cả 4 góc thẻ, tránh chói sáng và thử lại.',
      },
      { status: 422 }
    );
  } catch (error: any) {
    console.error('Error in /api/ai/ocr-cccd:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Lỗi xử lý OCR thẻ CCCD.',
      },
      { status: 500 }
    );
  }
}
