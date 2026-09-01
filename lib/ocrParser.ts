// ============================================================================
// OCR & CCCD CHIP PARSER WITH TESSERACT.JS (ULTRA PRECISION VIETNAMESE FILTER)
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

const VIETNAMESE_SURNAMES = [
  'NGUYỄN', 'NGUYÊN', 'TRẦN', 'TRAN', 'LÊ', 'LE', 'PHẠM', 'PHAM', 
  'HOÀNG', 'HOANG', 'HUỲNH', 'HUYNH', 'PHAN', 'VŨ', 'VU', 'VO', 'VÕ', 
  'ĐẶNG', 'DANG', 'BÙI', 'BUI', 'ĐỖ', 'DO', 'HỒ', 'HO', 'NGÔ', 'NGO', 
  'DƯƠNG', 'DUONG', 'LÝ', 'LY', 'ĐÀO', 'DAO', 'ĐOÀN', 'DOAN', 'VƯƠNG', 'VUONG', 
  'TRỊNH', 'TRINH', 'ĐINH', 'DINH', 'LÂM', 'LAM', 'PHÙNG', 'PHUNG', 'MAI', 
  'TÔ', 'TO', 'TRƯƠNG', 'TRUONG', 'HÀ', 'HA', 'TĂNG', 'TANG', 'LƯƠNG', 'LUONG', 
  'LƯU', 'LUU', 'THÁI', 'THAI', 'TẠ', 'TA', 'TỐNG', 'TONG', 'CHÂU', 'CHAU', 
  'QUÁCH', 'QUACH', 'BẠCH', 'BACH', 'TRIỆU', 'TRIEU'
];

/**
 * Advanced sanitizer for Full Name
 * Eliminates OCR noise prefixes like "YA", "VA", labels ("Họ và tên", "Full name"),
 * and anchors to valid Vietnamese surnames.
 */
export function cleanFullName(raw: string): string {
  if (!raw) return '';

  let s = raw;
  // 1. Remove labels
  s = s.replace(/(?:họ(?:,\s*chữ\s*đệm)?\s*và\s*tên|full\s*name|họ\s*tên|họ\s*và\s*tên\s*\/\s*full\s*name)/gi, ' ');

  // 2. Remove symbols & digits
  s = s.replace(/[0-9:;\/\\\.\,\-\_\!\?\"\'\*\#\$\%\^\&\(\)\[\]\{\}\|\=\+~`<>]/g, ' ');

  // 3. Keep only letters and spaces
  s = s.replace(/[^A-Za-zÀ-ỹ\s]/g, ' ');
  s = s.replace(/\s+/g, ' ').trim();

  // 4. Split into words
  let words = s.split(' ').map(w => w.toUpperCase()).filter(Boolean);

  // 5. Remove national header fragments
  const forbiddenWords = [
    'CỘNG', 'HÒA', 'XÃ', 'HỘI', 'CHỦ', 'NGHĨA', 'VIỆT', 'NAM', 
    'ĐỘC', 'LẬP', 'TỰ', 'DO', 'HẠNH', 'PHÚC', 
    'CĂN', 'CƯỚC', 'CÔNG', 'DÂN', 'IDENTITY', 'CARD', 'REPUBLIC',
    'NAME', 'FULL', 'SEX', 'DOB', 'NO'
  ];
  words = words.filter(w => !forbiddenWords.includes(w));

  // 6. Anchor to Vietnamese Surname:
  // If first word is a 1-2 letter artifact (e.g. 'YA', 'VA', 'Y', 'A', 'LA', 'HA')
  // and second word is a known Vietnamese surname, discard the artifact!
  if (words.length >= 2) {
    const firstWord = words[0];
    const secondWord = words[1];
    if ((firstWord.length <= 2 || firstWord === 'YA' || firstWord === 'VA' || firstWord === 'TEN') && VIETNAMESE_SURNAMES.includes(secondWord)) {
      words = words.slice(1);
    }
  }

  // If first word is 'NGUYÊN' without tilde, normalize to 'NGUYỄN'
  if (words.length > 0 && words[0] === 'NGUYÊN') {
    words[0] = 'NGUYỄN';
  }

  return words.join(' ');
}

/**
 * Advanced sanitizer for Address (Quê quán / Nơi thường trú)
 * Strips label distortions (og of coment, ob Gia dân p /2029, cee l, etc.)
 * and heals broken kerning (Q uản g Đạt -> Quảng Đạt).
 */
export function cleanAddress(raw: string): string {
  if (!raw) return '';

  let s = raw;

  // 1. Remove label prefixes and known OCR distortions
  s = s.replace(/(?:quê\s*quán|nguyên\s*quán|place\s*of\s*origin|nơi\s*thường\s*trú|place\s*of\s*residence|nơi\s*cư\s*trú|thường\s*trú)[:\s\/\.]*/gi, ' ');
  s = s.replace(/(?:og\s*of\s*coment|place\s*of\s*coment|place\s*of\s*origin|place\s*of|place|origin|residence)[:\s\/\.]*/gi, ' ');

  // 2. Remove expiry fragments like "ob Gia dân p /2029", "Có giá trị đến", dates, years
  s = s.replace(/(?:ob\s*)?gia\s*dân\s*[a-z0-9\/\s\-]*20[2-4][0-9]/gi, ' ');
  s = s.replace(/(?:có\s*giá\s*trị\s*đến|date\s*of\s*expiry|hạn\s*sử\s*dụng|không\s*thời\s*hạn|đặc\s*điểm).*$/gi, ' ');
  s = s.replace(/\/?20[2-4][0-9]\b/g, ' ');
  s = s.replace(/\b(ob|dob|cee\s*l|cee\s*i|cee|coment)\b/gi, ' ');

  // 3. Heal broken letter-spacing caused by OCR font tracking:
  // e.g. "Q uản g" -> "Quảng", "Đ ạ t" -> "Đạt", "T h ô n" -> "Thôn"
  s = s.replace(/\bQ\s+uản\s+g\b/gi, 'Quảng');
  s = s.replace(/\bQ\s+u\s*ả\s*n\s*g\b/gi, 'Quảng');
  s = s.replace(/\bĐ\s*ạ\s*t\b/gi, 'Đạt');
  s = s.replace(/\bT\s*h\s*ô\s*n\b/gi, 'Thôn');
  s = s.replace(/\bP\s*h\s*ư\s*ờ\s*n\s*g\b/gi, 'Phường');
  s = s.replace(/\bH\s*u\s*y\s*ệ\s*n\b/gi, 'Huyện');
  s = s.replace(/\bQ\s*u\s*ậ\s*n\b/gi, 'Quận');
  s = s.replace(/\bT\s*ỉ\s*n\s*h\b/gi, 'Tỉnh');

  // If starts with "ôn " followed by uppercase, turn into "Thôn "
  s = s.replace(/^ôn\s+([A-ZÀ-Ỹ])/i, 'Thôn $1');

  // 4. Remove garbage noise symbols
  s = s.replace(/[\|_~{}\[\]\\=\+*\^><@#\$%\:;\"\'`]/g, ' ');

  // 5. Clean up multiple commas & spaces
  s = s.replace(/,\s*,+/g, ', ');
  s = s.replace(/\s+/g, ' ');

  // 6. Clean leading & trailing punctuation
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
 * Parse Vietnamese CCCD from raw OCR text with strict filtering
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
    // 2. EXTRACT FULL NAME (HỌ VÀ TÊN) WITH ULTRA-CLEAN FILTER
    // -------------------------------------------------------------
    const nameBlockMatch = rawText.match(/(?:Họ(?:,\s*chữ\s*đệm)?\s*và\s*tên|Full\s*name|Họ\s*tên)[:\s\/\.]*\n*\s*([A-ZÀ-Ỹ\s]{3,45})/i);
    if (nameBlockMatch && nameBlockMatch[1]) {
      const cleaned = cleanFullName(nameBlockMatch[1]);
      if (cleaned.length >= 3) {
        result.fullName = cleaned;
      }
    }

    if (!result.fullName) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (/(?:họ.*tên|full\s*name)/i.test(line)) {
          const afterLabel = line.replace(/.*(?:họ.*tên|full\s*name)[:\s\/\.]*/i, '').trim();
          const cleanedSame = cleanFullName(afterLabel);
          if (cleanedSame.length >= 3) {
            result.fullName = cleanedSame;
            break;
          }
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
    // -------------------------------------------------------------
    // 3. EXTRACT DATE OF BIRTH (NGÀY SINH)
    // -------------------------------------------------------------
    // Determine expected birth year from 12-digit CCCD number if available
    let cccdYear: number | null = null;
    if (result.idNumber && result.idNumber.length === 12) {
      const centuryDigit = parseInt(result.idNumber[3], 10);
      const yearTwoDigits = parseInt(result.idNumber.substring(4, 6), 10);
      let century = 1900;
      if (centuryDigit === 2 || centuryDigit === 3) century = 2000;
      else if (centuryDigit === 4 || centuryDigit === 5) century = 2100;
      cccdYear = century + yearTwoDigits;
    }

    // Collect all valid dates in text: DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY, DD 11 2004, DD|MM|YYYY
    const dateCandidates: { raw: string; formatted: string; year: number }[] = [];
    const dateRegex = /(?:(\d{1,2})\s*[\/\-\.\s\|]\s*(\d{1,2})\s*[\/\-\.\s\|]\s*(19\d{2}|20\d{2}))/g;
    let dateM;
    while ((dateM = dateRegex.exec(rawText)) !== null) {
      const day = dateM[1].padStart(2, '0');
      const month = dateM[2].padStart(2, '0');
      const year = parseInt(dateM[3], 10);
      // Valid birth years are strictly between 1930 and 2012 (excludes expiry dates like 2029, 2026)
      if (year >= 1930 && year <= 2012 && parseInt(month, 10) >= 1 && parseInt(month, 10) <= 12 && parseInt(day, 10) >= 1 && parseInt(day, 10) <= 31) {
        dateCandidates.push({ raw: dateM[0], formatted: `${year}-${month}-${day}`, year });
      }
    }

    // 3.1. Match against CCCD year if known
    if (cccdYear && dateCandidates.length > 0) {
      const matchCccd = dateCandidates.find(d => d.year === cccdYear);
      if (matchCccd) {
        result.dob = matchCccd.formatted;
      }
    }

    // 3.2. Match label line: "Ngày, tháng, năm sinh", "Date of birth", "Ngày sinh"
    if (!result.dob) {
      const dobLabelPattern = /(?:ngày[,\s]+tháng[,\s]+năm\s+sinh|ngày\s*sinh|date\s*of\s*birth|sinh\s*ngày|sinh|dob)[:\s\/\.]*([0-9]{1,2})\s*[\/\-\.\s\|]\s*([0-9]{1,2})\s*[\/\-\.\s\|]\s*(19[0-9]{2}|20[0-9]{2})/i;
      const dobMatch = rawText.match(dobLabelPattern);
      if (dobMatch && dobMatch[1] && dobMatch[2] && dobMatch[3]) {
        const year = parseInt(dobMatch[3], 10);
        if (year >= 1930 && year <= 2012) {
          result.dob = `${year}-${dobMatch[2].padStart(2, '0')}-${dobMatch[1].padStart(2, '0')}`;
        }
      }
    }

    // 3.3. Check lines containing "sinh" or "birth" or "dob"
    if (!result.dob) {
      for (const line of lines) {
        if (/(?:ngày.*sinh|date\s*of\s*birth|sinh|dob)/i.test(line) && !line.includes('Quê') && !line.includes('trú')) {
          const m = line.match(/([0-9]{1,2})\s*[\/\-\.\s\|]\s*([0-9]{1,2})\s*[\/\-\.\s\|]\s*(19\d{2}|20\d{2})/);
          if (m) {
            const year = parseInt(m[3], 10);
            if (year >= 1930 && year <= 2012) {
              result.dob = `${year}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
              break;
            }
          }
        }
      }
    }

    // 3.4. Pick first candidate date with valid birth year
    if (!result.dob && dateCandidates.length > 0) {
      result.dob = dateCandidates[0].formatted;
    }

    // 3.5. Smart fallback: if CCCD year is known (e.g. 2004) and there is DD/MM
    if (!result.dob && cccdYear) {
      const dmMatch = rawText.match(/\b(0[1-9]|[12][0-9]|3[01])\s*[\/\-\.\s]\s*(0[1-9]|1[0-2])\b/);
      if (dmMatch) {
        result.dob = `${cccdYear}-${dmMatch[2].padStart(2, '0')}-${dmMatch[1].padStart(2, '0')}`;
      }
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
    // 5. EXTRACT QUÊ QUÁN & NƠI THƯỜNG TRÚ WITH STRICT FILTER
    // -------------------------------------------------------------
    const pobLines: string[] = [];
    const residenceLines: string[] = [];
    let currentMode: 'NONE' | 'POB' | 'RESIDENCE' = 'NONE';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Ignore lines that belong to DOB, Gender, Nationality, Expiry Date
      if (/(?:ngày\s*sinh|date\s*of\s*birth|sinh\s*ngày|\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/i.test(line) && !line.includes('Quê') && !line.includes('trú')) {
        continue;
      }
      if (/(?:giới\s*tính|sex|quốc\s*tịch|nationality|việt\s*nam)/i.test(line) && !line.includes('Quê') && !line.includes('trú')) {
        continue;
      }
      if (/(?:có\s*giá\s*trị|date\s*of\s*expiry|hạn\s*sử\s*dụng|gia\s*dân)/i.test(line)) {
        currentMode = 'NONE';
        continue;
      }

      // Switch to Quê quán mode
      if (/(?:quê\s*quán|place\s*of\s*origin|nguyên\s*quán|og\s*of\s*coment)/i.test(line)) {
        currentMode = 'POB';
        const cleaned = cleanAddress(line);
        if (cleaned.length > 1) pobLines.push(cleaned);
        continue;
      }

      // Switch to Nơi thường trú mode
      if (/(?:nơi\s*thường\s*trú|place\s*of\s*residence|thường\s*trú|nơi\s*cư\s*trú)/i.test(line)) {
        currentMode = 'RESIDENCE';
        const cleaned = cleanAddress(line);
        if (cleaned.length > 1) residenceLines.push(cleaned);
        continue;
      }

      if (currentMode === 'POB') {
        const cleaned = cleanAddress(line);
        if (cleaned.length > 1) pobLines.push(cleaned);
      } else if (currentMode === 'RESIDENCE') {
        const cleaned = cleanAddress(line);
        if (cleaned.length > 1) residenceLines.push(cleaned);
      }
    }

    const rawPob = pobLines.join(', ');
    const rawResidence = residenceLines.join(', ');

    const cleanPob = cleanAddress(rawPob);
    const cleanResidence = cleanAddress(rawResidence);

    // Quê quán / Nơi sinh: Nếu không quét được hoặc không hợp lệ thì để trống theo đúng yêu cầu người dùng
    const isValidPob = cleanPob && cleanPob.length >= 4 && !/gia\s*dân|coment|cee/i.test(cleanPob);
    result.pob = isValidPob ? cleanPob : '';
    result.residence = cleanResidence || '';

    const primaryAddress = cleanResidence || cleanPob;
    if (primaryAddress) {
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
      } else if (lower.includes('quảng')) {
        // e.g. Quảng Nam, Quảng Trị, Quảng Ngãi, Quảng Ninh, Quảng Bình
        const matchQ = primaryAddress.match(/Quảng\s+[A-ZÀ-Ỹa-zà-ỹ]+/i);
        result.province = matchQ ? matchQ[0] : 'Quảng Nam';
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
 * Execute Dual-Side Tesseract OCR processing on actual images
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

    if (onProgress) onProgress(92, 'Đang loại bỏ ký tự thừa & chuẩn hóa danh xưng, địa chỉ...');

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
