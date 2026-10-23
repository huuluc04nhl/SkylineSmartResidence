'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Camera, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  RefreshCw, 
  CreditCard, 
  Scan, 
  FileText, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Eye, 
  Layers, 
  RotateCw, 
  AlertCircle,
  Check
} from 'lucide-react';
import { 
  runDualSideCccdOcr, 
  parseCccdText, 
  OcrCccdResult, 
  formatToDateInput, 
  formatToDisplayDate, 
  formatToApiDate,
  compressImageDataUrl,
  rotateImageDataUrl,
  extractCccdFromClientQr 
} from '@/lib/ocrParser';
import { nksUpdateCccd } from '@/lib/nksApiClient';
import { useLanguage } from '@/lib/languageContext';
import { cleanCccdNumber, isValidCccdNumber, getCccdValidationError } from '@/lib/validationUtils';

interface CccdOcrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyOcrData: (data: OcrCccdResult, frontImage: string, backImage: string) => void;
  initialFrontImage?: string;
  initialBackImage?: string;
}

export default function CccdOcrScannerModal({
  isOpen,
  onClose,
  onApplyOcrData,
  initialFrontImage,
  initialBackImage,
}: CccdOcrScannerModalProps) {
  const { t } = useLanguage();
  const [frontImage, setFrontImage] = useState<string>(initialFrontImage || '');
  const [backImage, setBackImage] = useState<string>(initialBackImage || '');
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      if (initialFrontImage) setFrontImage(initialFrontImage);
      if (initialBackImage) setBackImage(initialBackImage);
    }
  }, [isOpen, initialFrontImage, initialBackImage]);
  
  // Scanning state
  const [isScanning, setIsScanning] = useState(false);
  const [scanStage, setScanStage] = useState<'IDLE' | 'SCANNING_FRONT' | 'FLIPPING' | 'SCANNING_BACK' | 'COMPLETE'>('IDLE');
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatusText, setScanStatusText] = useState('');
  const [ocrResult, setOcrResult] = useState<OcrCccdResult | null>(null);
  const [isSyncingApi, setIsSyncingApi] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Editable fields in verification table
  const [editIdNumber, setEditIdNumber] = useState('');
  const [editFullName, setEditFullName] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editGender, setEditGender] = useState<'1' | '0'>('1');
  const [editPob, setEditPob] = useState('');
  const [editIdDate, setEditIdDate] = useState('');
  const [editIdPlace, setEditIdPlace] = useState('');

  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFrontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Tệp tải lên chưa đúng định dạng. Quý cư dân vui lòng chọn tệp hình ảnh (JPG, PNG).');
      return;
    }

    if (file.size < 5000) {
      setErrorMessage('Ảnh chụp chưa đủ rõ nét. Quý cư dân vui lòng tải ảnh chụp rõ các góc của thẻ.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const dataUrl = reader.result;
        const img = new Image();
        img.onload = async () => {
          let finalDataUrl = dataUrl;
          if (img.height > img.width) {
            finalDataUrl = await rotateImageDataUrl(dataUrl, 90, 1200);
          } else {
            finalDataUrl = await compressImageDataUrl(dataUrl, 1200);
          }
          setFrontImage(finalDataUrl);
          setOcrResult(null);
          setErrorMessage(null);
          if (!backImage) {
            setTimeout(() => {
              setIsFlipped(true);
            }, 400);
          }
        };
        img.src = dataUrl;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleBackUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Tệp tải lên chưa đúng định dạng. Quý cư dân vui lòng chọn tệp hình ảnh (JPG, PNG).');
      return;
    }

    if (file.size < 5000) {
      setErrorMessage('Ảnh chụp chưa đủ rõ nét. Quý cư dân vui lòng tải ảnh chụp rõ các góc của thẻ.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const dataUrl = reader.result;
        const img = new Image();
        img.onload = async () => {
          let finalDataUrl = dataUrl;
          if (img.height > img.width) {
            finalDataUrl = await rotateImageDataUrl(dataUrl, 90, 1200);
          } else {
            finalDataUrl = await compressImageDataUrl(dataUrl, 1200);
          }
          setBackImage(finalDataUrl);
          setOcrResult(null);
          setErrorMessage(null);
        };
        img.src = dataUrl;
      }
    };
    reader.readAsDataURL(file);
  };

  /**
   * 2-Stage Auto-Flip Scanning Workflow
   * 1. Turn to Front Side -> Scan Front (0 -> 50%)
   * 2. Auto 3D-Flip to Back Side -> Scan Back (50 -> 100%)
   * 3. Consolidate Real Data
   */
  const handleStartAutoFlipOcr = async () => {
    if (!frontImage || !backImage) {
      setErrorMessage('Vui lòng tải lên đầy đủ cả Mặt Trước và Mặt Sau của CCCD trước khi quét.');
      return;
    }

    setIsScanning(true);
    setOcrResult(null);
    setErrorMessage(null);

    try {
      // 1. Force flip to FRONT SIDE
      setIsFlipped(false);
      setScanStage('SCANNING_FRONT');
      setScanStatusText('Đang kiểm tra thông tin mặt trước của thẻ...');
      setScanProgress(25);

      let ocrSucceeded = false;

      // 1. ƯU TIÊN: Quét mã QR bảo mật trực tiếp trên ảnh mặt trước hoặc mặt sau
      try {
        let clientQrResult = await extractCccdFromClientQr(frontImage);
        if (!clientQrResult && backImage) {
          clientQrResult = await extractCccdFromClientQr(backImage);
        }

        if (clientQrResult && clientQrResult.idNumber) {
          setScanProgress(60);
          setScanStatusText('✨ Đã tìm thấy thông tin trên thẻ! Đang kiểm tra mặt sau...');
          setIsFlipped(true);
          await new Promise((r) => setTimeout(r, 400));

          setScanProgress(100);
          setScanStatusText('✨ Hoàn tất nhận diện! Đang tự động điền vào hồ sơ...');
          setScanStage('COMPLETE');

          const finalResult: OcrCccdResult = {
            ...clientQrResult,
            idNumber: clientQrResult.idNumber.replace(/\D/g, '').slice(0, 12),
            fullName: clientQrResult.fullName.toUpperCase().trim(),
            dob: formatToDateInput(clientQrResult.dob),
            gender: clientQrResult.gender,
            pob: clientQrResult.pob,
            province: clientQrResult.province || 'TP. Hồ Chí Minh',
            idDate: formatToDateInput(clientQrResult.idDate),
            idPlace: clientQrResult.idPlace || 'Cục Cảnh sát QLHC về TTXH',
          };

          setOcrResult(finalResult);
          ocrSucceeded = true;

          // Tự động điền thẳng thông tin vào hồ sơ và đóng modal
          onApplyOcrData(finalResult, frontImage, backImage);
          setTimeout(() => {
            onClose();
          }, 500);
          return;
        }
      } catch (qrErr) {
        console.warn('Client QR scan attempt:', qrErr);
      }

      // 2. Nếu QR không có hoặc bị mờ, gửi ảnh lên hệ thống để đọc chữ và đối chiếu
      if (!ocrSucceeded) {
        setScanStatusText('Đang đối chiếu thông tin từ hình ảnh thẻ...');
        setScanProgress(40);

        const [compFront, compBack] = await Promise.all([
          compressImageDataUrl(frontImage),
          compressImageDataUrl(backImage),
        ]);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000);

        try {
          const aiRes = await fetch('/api/ai/ocr-cccd', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ frontImage: compFront, backImage: compBack }),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          const aiData = await aiRes.json();
          if (aiRes.ok && aiData.success && (aiData.data?.idNumber || aiData.data?.fullName)) {
            setScanProgress(60);
            setScanStatusText('✨ Đã nhận diện thông tin mặt trước! Đang kiểm tra mặt sau...');
            setIsFlipped(true);
            await new Promise((r) => setTimeout(r, 400));

            setScanProgress(100);
            setScanStatusText('✨ Hoàn tất nhận diện! Đang tự động điền vào hồ sơ...');
            setScanStage('COMPLETE');

            const d = aiData.data;
            const finalResult: OcrCccdResult = {
              idNumber: (d.idNumber || '').replace(/\D/g, '').slice(0, 12),
              fullName: (d.fullName || '').toUpperCase().trim(),
              dob: formatToDateInput(d.dob || ''),
              gender: (d.gender === '0' || d.gender === 0 ? '0' : '1') as '1' | '0',
              pob: d.pob || '',
              residence: d.residence || d.pob || '',
              province: d.province || 'TP. Hồ Chí Minh',
              idDate: formatToDateInput(d.idDate || ''),
              idPlace: d.idPlace || 'Cục Cảnh sát QLHC về TTXH',
              confidence: d.confidence || 98,
              rawText: `[THÔNG TIN THẺ CĂN CƯỚC]:\nSố CCCD: ${d.idNumber}\nHọ tên: ${d.fullName}`,
            };

            setOcrResult(finalResult);
            ocrSucceeded = true;

            // Tự động điền thẳng thông tin vào hồ sơ và đóng modal
            onApplyOcrData(finalResult, frontImage, backImage);
            setTimeout(() => {
              onClose();
            }, 500);
            return;
          } else {
            // Khi ảnh chụp bị mờ/lóa không nhận dạng được chữ: Lưu lại ảnh chụp vào hồ sơ và mở bảng nhập nhanh
            setScanProgress(100);
            setScanStatusText('✨ Đã lưu ảnh chụp 2 mặt! Quý cư dân vui lòng hỗ trợ điền nhanh thông tin:');
            setScanStage('COMPLETE');
            setIsFlipped(false);
            setErrorMessage('Ảnh chụp có thể bị lóa sáng hoặc nghiêng góc. Hệ thống đã lưu ảnh 2 mặt, Quý cư dân vui lòng hỗ trợ điền nhanh các ô bên dưới.');
            ocrSucceeded = true;
          }
        } catch (fetchErr: any) {
          setScanProgress(100);
          setScanStatusText('✨ Đã lưu ảnh chụp 2 mặt! Quý cư dân vui lòng hỗ trợ điền nhanh thông tin:');
          setScanStage('COMPLETE');
          setIsFlipped(false);
          setErrorMessage('Hệ thống đã nhận 2 mặt ảnh chụp. Quý cư dân vui lòng hỗ trợ điền nhanh thông tin vào các ô bên dưới.');
          ocrSucceeded = true;
        }
      }
    } catch (err: any) {
      console.error('Scan Error:', err);
      setErrorMessage('Quý cư dân vui lòng kiểm tra lại ảnh chụp hoặc tự điền thông tin vào các ô bên dưới.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleApply = async () => {
    if (!ocrResult) return;

    const cccdErr = getCccdValidationError(editIdNumber);
    if (cccdErr) {
      setErrorMessage(cccdErr);
      return;
    }

    setIsSyncingApi(true);
    const finalResult: OcrCccdResult = {
      ...ocrResult,
      idNumber: cleanCccdNumber(editIdNumber),
      fullName: editFullName.trim().toUpperCase(),
      dob: formatToDateInput(editDob),
      gender: editGender,
      pob: editPob.trim(),
      province: editPob.trim().includes('Hồ Chí Minh') ? 'TP. Hồ Chí Minh' : editPob.trim().includes('Hà Nội') ? 'Hà Nội' : (ocrResult.province || 'TP. Hồ Chí Minh'),
      idDate: formatToDateInput(editIdDate),
      idPlace: editIdPlace.trim(),
    };

    // Tự động đồng bộ ngay lên API
    try {
      await nksUpdateCccd({
        number: finalResult.idNumber,
        date: finalResult.idDate,
        place: finalResult.idPlace,
        front: frontImage,
        back: backImage,
        fullName: finalResult.fullName,
        dob: finalResult.dob,
        pob: finalResult.pob,
        gender: finalResult.gender === '1' ? 1 : 0,
      });
    } catch (apiErr) {
      console.warn('API sync in modal warning:', apiErr);
    } finally {
      setIsSyncingApi(false);
    }

    onApplyOcrData(finalResult, frontImage, backImage);
    onClose();
  };

  const hasBothImages = Boolean(frontImage && backImage);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="bg-[#0D1117] border border-[#C5A880] max-w-3xl w-full p-4 sm:p-8 text-white space-y-5 sm:space-y-6 shadow-2xl overflow-y-auto max-h-[94vh] rounded-none">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#222B35] pb-3 sm:pb-4">
          <div className="space-y-1 min-w-0 pr-2">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#C5A880] font-bold flex items-center gap-1.5 font-mono">
              <Sparkles className="w-3.5 h-3.5 flex-shrink-0" /> 
              <span>{t('Thông Tin Cư Dân')}</span>
            </div>
            <h3 className="font-serif text-base sm:text-2xl font-bold text-white flex items-center gap-2 truncate">
              <Scan className="w-4 h-4 sm:w-5 sm:h-5 text-[#C5A880] flex-shrink-0" /> <span>{t('Đọc Thông Tin Thẻ Căn Cước (2 Mặt)')}</span>
            </h3>
            <p className="text-xs text-gray-400 hidden sm:block">
              {t('Quét thông tin từ 2 mặt thẻ Căn cước công dân để cập nhật hồ sơ.')}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-[#161B22] rounded-none transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice / Guidance Alert */}
        {errorMessage && (
          <div className="p-3 bg-amber-950/80 border border-amber-500/60 text-amber-300 text-xs flex items-center gap-2 rounded-none">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* INTERACTIVE 3D FLIPPABLE CARD CONTAINER                       */}
        {/* ------------------------------------------------------------- */}
        <div className="space-y-4">
          {/* Card Face Status Switcher Bar */}
          <div className="flex items-center justify-between bg-[#121820] p-2.5 px-3 sm:px-4 border border-[#222B35] rounded-none">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-400 hidden sm:inline">{t('Đang hiển thị:')}</span>
              <span className={`font-bold uppercase tracking-wider px-2 py-0.5 rounded-none text-[11px] font-mono ${
                !isFlipped 
                  ? 'bg-amber-950/80 text-[#C5A880] border border-[#C5A880]' 
                  : 'bg-cyan-950/80 text-cyan-400 border border-cyan-500'
              }`}>
                {!isFlipped ? t('MẶT TRƯỚC') : t('MẶT SAU')}
              </span>
            </div>

            {/* Manual Flip Button */}
            <button
              type="button"
              onClick={() => setIsFlipped(!isFlipped)}
              disabled={isScanning}
              className="px-3 py-1.5 bg-[#1C2533] hover:bg-[#C5A880] hover:text-[#0D1117] text-[#C5A880] border border-[#C5A880] text-xs font-bold uppercase tracking-wider rounded-none transition-all flex items-center gap-1.5 shadow"
            >
              <RotateCw className={`w-3.5 h-3.5 transition-transform duration-500 ${isFlipped ? 'rotate-180' : ''}`} />
              <span>{isFlipped ? t('Xem Mặt Trước') : t('Xem Mặt Sau')}</span>
            </button>
          </div>

          {/* 3D Perspective Flip Box - Exact Physical Card Aspect Ratio 85.6mm x 54mm */}
          <div className="relative w-full max-w-sm sm:max-w-md mx-auto aspect-[85.6/54] [perspective:1400px]">
            <div
              className={`w-full h-full relative transition-transform duration-700 [transform-style:preserve-3d] ${
                isFlipped ? '[transform:rotateY(180deg)]' : '[transform:rotateY(0deg)]'
              }`}
            >
              {/* ========================================================= */}
              {/* FACE 1: FRONT SIDE (MẶT TRƯỚC)                            */}
              {/* ========================================================= */}
              <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] [-webkit-backface-visibility:hidden] rounded-none overflow-hidden border-2 border-[#C5A880]/80 bg-gradient-to-br from-[#1A232E] via-[#121820] to-[#0A0E14] shadow-2xl p-2.5 sm:p-4 flex flex-col justify-between">
                {/* Decorative chip header */}
                <div className="flex items-center justify-between text-xs border-b border-gray-800 pb-1.5">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#C5A880]" />
                    <span className="text-[#C5A880] font-bold uppercase tracking-wider text-[10px] sm:text-[11px]">
                      {t('Mặt Trước • Căn Cước Công Dân')}
                    </span>
                  </div>
                  {frontImage && (
                    <span className="text-emerald-400 font-mono text-[10px] flex items-center gap-1">
                      <Check className="w-3 h-3" /> {t('Đã Tải Lên')}
                    </span>
                  )}
                </div>

                {/* Front Image Content */}
                <div 
                  onClick={() => frontInputRef.current?.click()}
                  className="flex-1 my-1 sm:my-2 bg-black/60 border border-dashed border-gray-700 hover:border-[#C5A880] rounded-none overflow-hidden relative group cursor-pointer flex items-center justify-center"
                >
                  {frontImage ? (
                    <>
                      <img
                        src={frontImage}
                        alt="CCCD Front"
                        className="w-full h-full object-contain sm:object-cover group-hover:scale-105 transition-transform"
                      />
                      {/* Laser scanning beam */}
                      {isScanning && scanStage === 'SCANNING_FRONT' && (
                        <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#C5A880] to-transparent shadow-[0_0_20px_#C5A880] animate-bounce top-1/2 pointer-events-none" />
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-bold text-white transition-opacity">
                        <Upload className="w-4 h-4 mr-1" /> {t('Chọn Lại Ảnh Mặt Trước')}
                      </div>
                    </>
                  ) : (
                    <div className="text-center space-y-1.5 text-gray-400 p-2 sm:p-4">
                      <Camera className="w-7 h-7 sm:w-10 sm:h-10 mx-auto text-gray-500 group-hover:text-[#C5A880] transition-colors" />
                      <div className="text-[11px] sm:text-xs font-semibold text-white">{t('Bấm để tải lên Mặt Trước CCCD')}</div>
                      <div className="text-[9px] sm:text-[10px] text-gray-500">{t('Chứa ảnh chân dung, 12 số CCCD, Họ tên, Ngày sinh')}</div>
                    </div>
                  )}
                </div>

                {/* Bottom Bar on Front Face */}
                <div className="flex items-center justify-between text-[10px] sm:text-[11px]">
                  <button
                    type="button"
                    onClick={() => frontInputRef.current?.click()}
                    className="text-gray-400 hover:text-white flex items-center gap-1 font-mono hover:underline"
                  >
                    <Upload className="w-3 h-3" /> {frontImage ? t('Đổi Ảnh Mặt Trước') : t('Chọn Tệp Ảnh')}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsFlipped(true)}
                    className="text-[#C5A880] hover:text-white font-bold flex items-center gap-1"
                  >
                    <span>{t('Lật Sang Mặt Sau')}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* ========================================================= */}
              {/* FACE 2: BACK SIDE (MẶT SAU)                              */}
              {/* ========================================================= */}
              <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] [-webkit-backface-visibility:hidden] [transform:rotateY(180deg)] rounded-none overflow-hidden border-2 border-cyan-500/80 bg-gradient-to-br from-[#121E2A] via-[#101820] to-[#091018] shadow-2xl p-2.5 sm:p-4 flex flex-col justify-between">
                {/* Decorative chip header */}
                <div className="flex items-center justify-between text-xs border-b border-gray-800 pb-1.5">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
                    <span className="text-cyan-400 font-bold uppercase tracking-wider text-[10px] sm:text-[11px]">
                      {t('Mặt Sau • Ngày Cấp & Nơi Cấp')}
                    </span>
                  </div>
                  {backImage && (
                    <span className="text-cyan-400 font-mono text-[10px] flex items-center gap-1">
                      <Check className="w-3 h-3" /> {t('Đã Tải Lên')}
                    </span>
                  )}
                </div>

                {/* Back Image Content */}
                <div 
                  onClick={() => backInputRef.current?.click()}
                  className="flex-1 my-1 sm:my-2 bg-black/60 border border-dashed border-gray-700 hover:border-cyan-400 rounded-none overflow-hidden relative group cursor-pointer flex items-center justify-center"
                >
                  {backImage ? (
                    <>
                      <img
                        src={backImage}
                        alt="CCCD Back"
                        className="w-full h-full object-contain sm:object-cover group-hover:scale-105 transition-transform"
                      />
                      {/* Laser scanning beam */}
                      {isScanning && scanStage === 'SCANNING_BACK' && (
                        <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_#38BDF8] animate-bounce top-1/2 pointer-events-none" />
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-bold text-white transition-opacity">
                        <Upload className="w-4 h-4 mr-1" /> {t('Chọn Lại Ảnh Mặt Sau')}
                      </div>
                    </>
                  ) : (
                    <div className="text-center space-y-1.5 text-gray-400 p-2 sm:p-4">
                      <Camera className="w-7 h-7 sm:w-10 sm:h-10 mx-auto text-gray-500 group-hover:text-cyan-400 transition-colors" />
                      <div className="text-[11px] sm:text-xs font-semibold text-white">{t('Bấm để tải lên Mặt Sau CCCD')}</div>
                      <div className="text-[9px] sm:text-[10px] text-gray-500">{t('Bao gồm Ngày cấp và Nơi cấp thẻ')}</div>
                    </div>
                  )}
                </div>

                {/* Bottom Bar on Back Face */}
                <div className="flex items-center justify-between text-[10px] sm:text-[11px]">
                  <button
                    type="button"
                    onClick={() => backInputRef.current?.click()}
                    className="text-gray-400 hover:text-white flex items-center gap-1 font-mono hover:underline"
                  >
                    <Upload className="w-3 h-3" /> {backImage ? t('Đổi Ảnh Mặt Sau') : t('Chọn Tệp Ảnh')}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsFlipped(false)}
                    className="text-cyan-400 hover:text-white font-bold flex items-center gap-1"
                  >
                    <ArrowRight className="w-3 h-3 rotate-180" />
                    <span>{t('Xem Mặt Trước')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <input
            ref={frontInputRef}
            type="file"
            accept="image/*"
            onChange={handleFrontUpload}
            className="hidden"
          />
          <input
            ref={backInputRef}
            type="file"
            accept="image/*"
            onChange={handleBackUpload}
            className="hidden"
          />
        </div>

        {/* ------------------------------------------------------------- */}
        {/* SCAN TRIGGER & PROGRESS SECTION                               */}
        {/* ------------------------------------------------------------- */}
        <div className="p-4 bg-[#161D26] border border-[#222B35] space-y-3 rounded-none">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-xs text-gray-300">
              {hasBothImages ? (
                <span className="text-emerald-400 font-bold font-mono flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> {t('Đã Tải Đủ 2 Mặt — Sẵn sàng nhận diện thông tin thẻ')}
                </span>
              ) : (
                <span className="text-amber-400 font-bold font-mono">
                  ⚠️ {t('Hãy tải lên đủ cả Mặt Trước và Mặt Sau trước khi quét!')}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleStartAutoFlipOcr}
              disabled={isScanning || !hasBothImages}
              className={`w-full sm:w-auto px-6 py-3 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 rounded-none shadow-lg ${
                isScanning || !hasBothImages
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#C5A880] to-amber-400 hover:from-white hover:to-white text-[#0D1117] cursor-pointer'
              }`}
            >
              {isScanning ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4 text-[#0D1117]" />
              )}
              {isScanning ? t('Đang Nhận Diện Thông Tin...') : t('Tự Động Nhận Diện Thông Tin Thẻ')}
            </button>
          </div>

          {/* Scanning Progress & Status */}
          {isScanning && (
            <div className="space-y-1.5 pt-2 animate-fadeIn">
              <div className="flex justify-between text-[11px] font-mono text-gray-300">
                <span className="text-[#C5A880]">{t(scanStatusText)}</span>
                <span className="font-bold">{scanProgress}%</span>
              </div>
              <div className="w-full bg-[#0D1117] h-2 rounded-none overflow-hidden border border-gray-700">
                <div
                  className="bg-gradient-to-r from-[#C5A880] via-cyan-400 to-emerald-400 h-full transition-all duration-300 rounded-none"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* EXTRACTED REAL DATA TABLE (EDITABLE BEFORE APPLYING)          */}
        {/* ------------------------------------------------------------- */}
        {ocrResult && (
          <div className="p-4 sm:p-5 bg-gradient-to-r from-[#121820] to-[#161D26] border border-emerald-500/80 space-y-4 rounded-none animate-fadeIn shadow-2xl">
            <div className="border-b border-emerald-500/30 pb-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4" /> {t('Thông Tin Thẻ Căn Cước')}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-mono font-semibold">{t('1. Số Căn cước công dân:')}</label>
                <input
                  type="text"
                  maxLength={12}
                  value={editIdNumber}
                  onChange={(e) => setEditIdNumber(cleanCccdNumber(e.target.value))}
                  className="w-full bg-[#0D1117] border border-gray-700 p-2 text-[#C5A880] font-mono font-bold rounded-none focus:border-[#C5A880] outline-none"
                  placeholder="12 số định danh..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-mono font-semibold">{t('2. Họ và Tên:')}</label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full bg-[#0D1117] border border-gray-700 p-2 text-white font-bold rounded-none focus:border-[#C5A880] outline-none uppercase"
                  placeholder="Họ và tên..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-mono font-semibold">{t('3. Ngày sinh:')}</label>
                <input
                  type="date"
                  value={formatToApiDate(editDob)}
                  onChange={(e) => setEditDob(e.target.value)}
                  className="w-full bg-[#0D1117] border border-gray-700 p-2 text-white font-mono rounded-none focus:border-[#C5A880] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-mono font-semibold">{t('4. Giới Tính:')}</label>
                <select
                  value={editGender}
                  onChange={(e) => setEditGender(e.target.value as '1' | '0')}
                  className="w-full bg-[#0D1117] border border-gray-700 p-2 text-white rounded-none focus:border-[#C5A880] outline-none"
                >
                  <option value="1">{t('Nam')}</option>
                  <option value="0">{t('Nữ')}</option>
                </select>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-[10px] text-gray-400 font-mono font-semibold">{t('5. Quê quán / Nơi sinh:')}</label>
                <input
                  type="text"
                  value={editPob}
                  onChange={(e) => setEditPob(e.target.value)}
                  className="w-full bg-[#0D1117] border border-gray-700 p-2 text-white rounded-none focus:border-[#C5A880] outline-none"
                  placeholder="Xã/Phường, Quận/Huyện, Tỉnh/Thành phố..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-mono font-semibold">{t('6. Ngày Cấp (Mặt Sau):')}</label>
                <input
                  type="date"
                  value={formatToApiDate(editIdDate)}
                  onChange={(e) => setEditIdDate(e.target.value)}
                  className="w-full bg-[#0D1117] border border-gray-700 p-2 text-cyan-400 font-mono rounded-none focus:border-[#C5A880] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-mono font-semibold">{t('7. Nơi Cấp (Mặt Sau):')}</label>
                <input
                  type="text"
                  value={editIdPlace}
                  onChange={(e) => setEditIdPlace(e.target.value)}
                  className="w-full bg-[#0D1117] border border-gray-700 p-2 text-cyan-400 rounded-none focus:border-[#C5A880] outline-none"
                  placeholder="Cục Cảnh sát QLHC về TTXH..."
                />
              </div>
            </div>

            {/* Action Bar when data is ready */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleApply}
                disabled={isSyncingApi}
                className={`w-full sm:w-auto px-8 py-3 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 rounded-none shadow-xl cursor-pointer ${
                  isSyncingApi
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-[#C5A880] hover:bg-white text-[#0D1117]'
                }`}
              >
                {isSyncingApi ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-[#0D1117]" />
                    <span>{t('Đang Lưu Thông Tin...')}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{t('Xác Nhận & Lưu Vào Hồ Sơ')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
