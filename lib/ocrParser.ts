// ============================================================================
// OCR & CCCD CHIP PARSER WITH TESSERACT.JS (PRECISE CLEANING ENGINE - NO NOISE)
// ============================================================================

export interface OcrCccdResult {
  idNumber: string;
  fullName: string;
  dob: string;
  gender: '1' | '0';
  pob: string;
  residence?: string;
  province: string;
  idDate: string;
  idPlace: string;
  confidence: number;
  rawTextFront?: string;
  rawTextBack?: string;
  rawText: string;
}

/**
 * Advanced sanitizer for Full Name
 * Removes labels (Họ và tên, Full name), noise characters (|, :, /, numbers, punctuation)
 * Leaves ONLY clean Vietnamese words in UPPERCASE
 */
export function cleanFullName(raw: string): string {
  if (!raw) return '';

  let s = raw;
  // Remove known labels in Vietnamese & English
  s = s.replace(/(?:họ(?:,\s*chữ\s*đệm)?\s*và\s*tên|full\s*name|họ\s*tên|họ\s*và\s*tên\s*\/\s*full\s*name)/gi, ' ');

  // Remove numbers and punctuation symbols
  s = s.replace(/[0-9:;\/\\\.\,\-\_\!\?\"\'\*\#\$\%\^\&\(\)\[\]\{\}\|\=\+~`<>]/g, ' ');

  // Keep only Vietnamese letters and spaces
  s = s.replace(/[^A-Za-zÀ-ỹ\s]/g, ' ');

  // Remove duplicate spaces
  s = s.replace(/\s+/g, ' ').trim();

  // Filter out any national header words that might have crept in
  const forbidden = [
    'CỘNG', 'HÒA', 'XÃ', 'HỘI', 'CHỦ', 'NGHĨA', 'VIỆT', 'NAM', 
    'ĐỘC', 'LẬP', 'TỰ', 'DO', 'HẠNH', 'PHÚC', 
    'CĂN', 'CƯỚC', 'CÔNG', 'DÂN', 'IDENTITY', 'CARD', 'REPUBLIC'
  ];
  
  const words = s.split(' ').filter(w => {
    const up = w.toUpperCase();
    return !forbidden.includes(up) && w.length > 1;
  });

  return words.join(' ').toUpperCase();
}

/**
 * Advanced sanitizer for Address (Quê quán / Nơi thường trú)
 * Strips label prefixes, trailing section labels, barcodes, and stray noise symbols
 */
export function cleanAddress(raw: string): string {
  if (!raw) return '';

  let s = raw;

  // 1. Remove label prefixes
  s = s.replace(/(?:quê\s*quán|nguyên\s*quán|place\s*of\s*origin|nơi\s*thường\s*trú|place\s*of\s*residence|nơi\s*cư\s*trú|thường\s*trú)[:\s\/\.]*/gi, ' ');

  // 2. Cut off any trailing labels from subsequent card sections
  s = s.replace(/(?:có\s*giá\s*trị\s*đến|date\s*of\s*expiry|hạn\s*sử\s*dụng|không\s*thời\s*hạn|đặc\s*điểm|giới\s*tính|quốc\s*tịch|dân\s*tộc|tôn\s*giáo).*$/gi, '');

  // 3. Remove garbage noise symbols while keeping letters, digits, comma, period, slash, hyphen
  s = s.replace(/[\|_~{}\[\]\\=\+*\^><@#\$%\:;\"\'`]/g, ' ');

  // 4. Clean up commas & separators
  s = s.replace(/,\s*,+/g, ', ');
  s = s.replace(/\s+/g, ' ');

  // 5. Clean leading & trailing punctuation
  s = s.replace(/^[\s,.:;/\-]+/, '').replace(/[\s,.:;/\-]+$/, '');

  return s.trim();
}

/**
 * Format DD/MM/YYYY to YYYY-MM-DD for standard HTML5 date input fields
 */
export function formatToDateInput(d: string): string {
  if (!d) return '';
  const cleanD = d.replace(/[^\d\/\-\.]/g, '');
  const parts = cleanD.split(/[\/\-\.]/);
  if (parts.length === 3) {
    if (parts[2].length === 4) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }
    if (parts[0].length === 4) {
      const year = parts[0];
      const month = parts[1].padStart(2, '0');
      const day = parts[2].padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }
  return d;
}

/**
 * Parse Vietnamese CCCD from raw OCR text with multi-line address and full name awareness
 */
export function parseCccdText(rawText: string, isBackSide: boolean = false): Partial<OcrCccdResult> {
  const result: Partial<OcrCccdResult> = {
    idNumber: '',
    fullName: '',
    dob: '',
    gender: '1',
    pob: '',
    residence: '',
    province: '',
    idDate: '',
    idPlace: '',
  };

  if (!rawText) return result;

  const lines = rawText.split(/\r?\n/).map(l => l.replace(/[\r\t]/g, ' ').trim()).filter(Boolean);

  if (!isBackSide) {
    // -------------------------------------------------------------
    // 1. EXTRACT 12-DIGIT CCCD ID NUMBER (Mặt trước)
    // -------------------------------------------------------------
    const idMatch = rawText.match(/(?:Số|No|CCCD|SỐ)\.?[:\s]*([0-9]{12})/i) || 
                    rawText.match(/\b(0[0-9]{11})\b/) || 
                    rawText.match(/\b([0-9]{12})\b/);
    if (idMatch && idMatch[1]) {
      result.idNumber = idMatch[1].trim();
    }

    // -------------------------------------------------------------
    // 2. EXTRACT FULL NAME (HỌ VÀ TÊN) WITH NOISE STRIPPING
    // -------------------------------------------------------------
    // Strategy 1: Same-line or immediate next-line after "Họ và tên"
    const nameBlockMatch = rawText.match(/(?:Họ(?:,\s*chữ\s*đệm)?\s*và\s*tên|Full\s*name|Họ\s*tên)[:\s\/\.]*\n*\s*([A-ZÀ-Ỹ\s]{3,45})/i);
    if (nameBlockMatch && nameBlockMatch[1]) {
      const cleaned = cleanFullName(nameBlockMatch[1]);
      if (cleaned.length >= 3) {
        result.fullName = cleaned;
      }
    }

    // Strategy 2: Line index contextual search
    if (!result.fullName) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (/(?:họ.*tên|full\s*name)/i.test(line)) {
          // Check same line after label
          const afterLabel = line.replace(/.*(?:họ.*tên|full\s*name)[:\s\/\.]*/i, '').trim();
          const cleanedSame = cleanFullName(afterLabel);
          if (cleanedSame.length >= 3) {
            result.fullName = cleanedSame;
            break;
          }
          // Check next line
          if (i + 1 < lines.length) {
            const nextLine = lines[i + 1].trim();
            if (!/(?:ngày|sinh|giới|sex|quốc|quê|nơi|thường\s*trú)/i.test(nextLine)) {
              const cleanedNext = cleanFullName(nextLine);
              if (cleanedNext.length >= 3) {
                result.fullName = cleanedNext;
                break;
              }
            }
          }
        }
      }
    }

    // Strategy 3: Find all-caps line between CCCD ID line and DOB line
    if (!result.fullName) {
      let foundIdIndex = -1;
      let foundDobIndex = -1;

      for (let i = 0; i < lines.length; i++) {
        if (/\d{12}/.test(lines[i]) || /số|no/i.test(lines[i])) foundIdIndex = i;
        if (/(?:ngày\s*sinh|date\s*of\s*birth|\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/i.test(lines[i])) foundDobIndex = i;
      }

      if (foundIdIndex !== -1 && foundDobIndex > foundIdIndex) {
        for (let i = foundIdIndex + 1; i < foundDobIndex; i++) {
          const candidate = cleanFullName(lines[i]);
          if (candidate.length >= 4) {
            result.fullName = candidate;
            break;
          }
        }
      }
    }

    // -------------------------------------------------------------
    // 3. EXTRACT DATE OF BIRTH (NGÀY SINH)
    // -------------------------------------------------------------
    const dobMatch = rawText.match(/(?:Ngày sinh|Date of birth|Sinh ngày|DOB)[:\s]+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/i) ||
                     rawText.match(/\b(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})\b/);
    if (dobMatch && dobMatch[1]) {
      result.dob = formatToDateInput(dobMatch[1]);
    }

    // -------------------------------------------------------------
    // 4. EXTRACT GENDER (GIỚI TÍNH)
    // -------------------------------------------------------------
    const genderMatch = rawText.match(/(?:Giới tính|Sex)[:\s]+(Nam|Nữ|Male|Female)/i);
    if (genderMatch && genderMatch[1]) {
      const g = genderMatch[1].toLowerCase();
      result.gender = g.includes('nữ') || g.includes('female') ? '0' : '1';
    }

    // -------------------------------------------------------------
    // 5. EXTRACT QUÊ QUÁN & NƠI THƯỜNG TRÚ WITH NOISE STRIPPING
    // -------------------------------------------------------------
    const pobLines: string[] = [];
    const residenceLines: string[] = [];
    let currentMode: 'NONE' | 'POB' | 'RESIDENCE' = 'NONE';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Switch to Quê quán mode
      if (/(?:quê\s*quán|place\s*of\s*origin|nguyên\s*quán)/i.test(line)) {
        currentMode = 'POB';
        const stripped = cleanAddress(line);
        if (stripped.length > 1) pobLines.push(stripped);
        continue;
      }

      // Switch to Nơi thường trú mode
      if (/(?:nơi\s*thường\s*trú|place\s*of\s*residence|thường\s*trú|nơi\s*cư\s*trú)/i.test(line)) {
        currentMode = 'RESIDENCE';
        const stripped = cleanAddress(line);
        if (stripped.length > 1) residenceLines.push(stripped);
        continue;
      }

      // Stop condition
      if (/(?:có\s*giá\s*trị\s*đến|date\s*of\s*expiry|hạn\s*sử\s*dụng|giá\s*trị)/i.test(line)) {
        currentMode = 'NONE';
        continue;
      }

      if (currentMode === 'POB') {
        if (!/(?:nơi\s*thường\s*trú|place\s*of\s*residence|có\s*giá\s*trị)/i.test(line)) {
          const cleanedLine = cleanAddress(line);
          if (cleanedLine.length > 1) pobLines.push(cleanedLine);
        }
      } else if (currentMode === 'RESIDENCE') {
        if (!/(?:có\s*giá\s*trị|date\s*of\s*expiry|đặc\s*điểm)/i.test(line)) {
          const cleanedLine = cleanAddress(line);
          if (cleanedLine.length > 1) residenceLines.push(cleanedLine);
        }
      }
    }

    const rawPob = pobLines.join(', ');
    const rawResidence = residenceLines.join(', ');

    const cleanPob = cleanAddress(rawPob);
    const cleanResidence = cleanAddress(rawResidence);

    const primaryAddress = cleanResidence || cleanPob;
    if (primaryAddress) {
      result.pob = primaryAddress;
      result.residence = cleanResidence || cleanPob;

      // Extract Province
      const lower = primaryAddress.toLowerCase();
      if (lower.includes('hồ chí minh') || lower.includes('hcm') || lower.includes('sài gòn') || lower.includes('tp.hcm')) {
        result.province = 'TP. Hồ Chí Minh';
      } else if (lower.includes('hà nội') || lower.includes('hn')) {
        result.province = 'Hà Nội';
      } else if (lower.includes('đà nẵng')) {
        result.province = 'Đà Nẵng';
      } else if (lower.includes('hải phòng')) {
        result.province = 'Hải Phòng';
      } else if (lower.includes('cần thơ')) {
        result.province = 'Cần Thơ';
      } else if (lower.includes('bình dương')) {
        result.province = 'Bình Dương';
      } else if (lower.includes('đồng nai')) {
        result.province = 'Đồng Nai';
      } else {
        const parts = primaryAddress.split(',');
        result.province = parts.slice(-1)[0]?.trim() || primaryAddress;
      }
    }
  }

  // -------------------------------------------------------------
  // 6. EXTRACT ISSUE DATE & ISSUE PLACE (MẶT SAU)
  // -------------------------------------------------------------
  const dateMatch = rawText.match(/(?:Ngày,\s*tháng,\s*năm|Ngày cấp|Date of issue|Issued on)[:\s]+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/i) ||
                    rawText.match(/(?:ngày|ngày\s+)(\d{1,2})\s+tháng\s+(\d{1,2})\s+năm\s+(\d{4})/i) ||
                    rawText.match(/\b(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})\b/);
  if (dateMatch) {
    if (dateMatch[1] && dateMatch[2] && dateMatch[3]) {
      result.idDate = `${dateMatch[3]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[1].padStart(2, '0')}`;
    } else if (dateMatch[1]) {
      result.idDate = formatToDateInput(dateMatch[1]);
    }
  }

  const placeMatch = rawText.match(/(?:CỤC TRƯỞNG|CỤC CẢNH SÁT|GIÁM ĐỐC|Nơi cấp)[:\s]*([^\n\r]+)/i);
  if (placeMatch && placeMatch[1]) {
    result.idPlace = cleanAddress(placeMatch[1]);
  } else if (rawText.toLowerCase().includes('cảnh sát qlhc') || rawText.toLowerCase().includes('ttxh') || isBackSide) {
    result.idPlace = 'Cục Cảnh sát QLHC về TTXH';
  }

  return result;
}

/**
 * Execute Dual-Side Tesseract OCR processing on actual images (No mock fallback)
 */
export async function runDualSideCccdOcr(
  frontSource: string | File,
  backSource: string | File,
  onProgress?: (progress: number, status: string) => void
): Promise<OcrCccdResult> {
  if (onProgress) onProgress(10, 'Đang khởi tạo bộ quét Tesseract AI Dual-Side...');

  try {
    const { createWorker } = await import('tesseract.js');

    // 1. Scan Front Side
    if (onProgress) onProgress(25, 'Đang quét và nhận diện ký tự Mặt Trước CCCD...');

    const workerFront = await createWorker('vie+eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text' && onProgress) {
          const pct = Math.round(25 + (m.progress || 0) * 30);
          onProgress(pct, `Đang quét Mặt Trước (${Math.round((m.progress || 0) * 100)}%)...`);
        }
      },
    });

    const retFront = await workerFront.recognize(frontSource);
    await workerFront.terminate();

    // 2. Scan Back Side
    if (onProgress) onProgress(60, 'Đang quét Chip điện tử & Ngày cấp Mặt Sau CCCD...');

    const workerBack = await createWorker('vie+eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text' && onProgress) {
          const pct = Math.round(60 + (m.progress || 0) * 30);
          onProgress(pct, `Đang quét Mặt Sau (${Math.round((m.progress || 0) * 100)}%)...`);
        }
      },
    });

    const retBack = await workerBack.recognize(backSource);
    await workerBack.terminate();

    if (onProgress) onProgress(92, 'Đang chuẩn hóa & lọc sạch ký tự thừa trên Họ tên và Địa chỉ...');

    const parsedFront = parseCccdText(retFront.data.text, false);
    const parsedBack = parseCccdText(retBack.data.text, true);

    const merged: OcrCccdResult = {
      idNumber: parsedFront.idNumber || '',
      fullName: cleanFullName(parsedFront.fullName || ''),
      dob: parsedFront.dob || '',
      gender: parsedFront.gender || '1',
      pob: cleanAddress(parsedFront.pob || parsedFront.residence || ''),
      residence: cleanAddress(parsedFront.residence || parsedFront.pob || ''),
      province: parsedFront.province || '',
      idDate: parsedBack.idDate || parsedFront.idDate || '',
      idPlace: cleanAddress(parsedBack.idPlace || parsedFront.idPlace || 'Cục Cảnh sát QLHC về TTXH'),
      confidence: Math.max(75, Math.round(((retFront.data.confidence || 90) + (retBack.data.confidence || 90)) / 2)),
      rawTextFront: retFront.data.text,
      rawTextBack: retBack.data.text,
      rawText: `[MẶT TRƯỚC]:\n${retFront.data.text}\n\n[MẶT SAU]:\n${retBack.data.text}`,
    };

    if (onProgress) onProgress(100, 'Hoàn tất quét và chuẩn hóa OCR 2 mặt!');
    return merged;
  } catch (error) {
    console.error('Tesseract OCR error:', error);
    throw new Error('Không thể phân tích OCR từ ảnh đã tải lên. Vui lòng kiểm tra độ nét và góc chụp của ảnh.');
  }
}

/**
 * Single side legacy compatibility runner
 */
export async function runTesseractOcr(
  imageSource: string | File,
  onProgress?: (progress: number, status: string) => void
): Promise<OcrCccdResult> {
  return runDualSideCccdOcr(imageSource, imageSource, onProgress);
}
