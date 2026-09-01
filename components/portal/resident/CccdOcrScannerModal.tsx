'use client';

import React, { useState, useRef } from 'react';
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
import { runDualSideCccdOcr, parseCccdText, OcrCccdResult, formatToDateInput, formatToDisplayDate, formatToApiDate } from '@/lib/ocrParser';
import { nksUpdateCccd } from '@/lib/nksApiClient';

interface CccdOcrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyOcrData: (data: OcrCccdResult, frontImage: string, backImage: string) => void;
}

export default function CccdOcrScannerModal({
  isOpen,
  onClose,
  onApplyOcrData,
}: CccdOcrScannerModalProps) {
  const [frontImage, setFrontImage] = useState<string>('');
  const [backImage, setBackImage] = useState<string>('');
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  
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
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setFrontImage(reader.result);
          setOcrResult(null);
          setErrorMessage(null);
          // Suggest flipping to back side if back not uploaded yet
          if (!backImage) {
            setTimeout(() => {
              setIsFlipped(true);
            }, 500);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBackUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setBackImage(reader.result);
          setOcrResult(null);
          setErrorMessage(null);
        }
      };
      reader.readAsDataURL(file);
    }
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
      setScanStatusText('Đang khởi tạo AI Vision và quét Mặt Trước...');
      setScanProgress(15);

      const { createWorker } = await import('tesseract.js');

      // Scan Front
      const workerFront = await createWorker('vie+eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            const pct = Math.round(15 + (m.progress || 0) * 35);
            setScanProgress(pct);
            setScanStatusText(`Đang quét Mặt Trước (${Math.round((m.progress || 0) * 100)}%)...`);
          }
        },
      });

      const retFront = await workerFront.recognize(frontImage);
      await workerFront.terminate();

      // 2. AUTO 3D FLIP TO BACK SIDE
      setScanStage('FLIPPING');
      setScanProgress(50);
      setScanStatusText('✨ Đã quét xong Mặt Trước! Đang tự động lật sang Mặt Sau...');
      setIsFlipped(true);

      // Smooth animation pause
      await new Promise((r) => setTimeout(r, 900));

      // 3. Scan Back
      setScanStage('SCANNING_BACK');
      setScanStatusText('Đang quét Chip điện tử và Ngày cấp ở Mặt Sau...');

      const workerBack = await createWorker('vie+eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            const pct = Math.round(50 + (m.progress || 0) * 45);
            setScanProgress(pct);
            setScanStatusText(`Đang quét Mặt Sau (${Math.round((m.progress || 0) * 100)}%)...`);
          }
        },
      });

      const retBack = await workerBack.recognize(backImage);
      await workerBack.terminate();

      // 4. Consolidate extracted data
      setScanProgress(100);
      setScanStatusText('Hoàn tất quét OCR 2 mặt!');
      setScanStage('COMPLETE');

      const parsedFront = parseCccdText(retFront.data.text, false);
      const parsedBack = parseCccdText(retBack.data.text, true);

      const merged: OcrCccdResult = {
        idNumber: parsedFront.idNumber || '',
        fullName: parsedFront.fullName || '',
        dob: parsedFront.dob || '',
        gender: parsedFront.gender || '1',
        pob: parsedFront.pob || '',
        province: parsedFront.province || '',
        idDate: parsedBack.idDate || parsedFront.idDate || '',
        idPlace: parsedBack.idPlace || parsedFront.idPlace || '',
        confidence: Math.max(75, Math.round(((retFront.data.confidence || 90) + (retBack.data.confidence || 90)) / 2)),
        rawTextFront: retFront.data.text,
        rawTextBack: retBack.data.text,
        rawText: `[MẶT TRƯỚC]:\n${retFront.data.text}\n\n[MẶT SAU]:\n${retBack.data.text}`,
      };

      setOcrResult(merged);
      setEditIdNumber(merged.idNumber);
      setEditFullName(merged.fullName);
      setEditDob(merged.dob);
      setEditGender(merged.gender);
      setEditPob(merged.pob);
      setEditIdDate(merged.idDate);
      setEditIdPlace(merged.idPlace || 'Cục Cảnh sát QLHC về TTXH');
    } catch (err: any) {
      console.error('OCR Error:', err);
      setErrorMessage(err.message || 'Không thể trích xuất dữ liệu từ ảnh. Vui lòng thử tải lên ảnh rõ nét hơn.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleApply = () => {
    if (!ocrResult) return;

    const finalResult: OcrCccdResult = {
      ...ocrResult,
      idNumber: editIdNumber.trim(),
      fullName: editFullName.trim(),
      dob: editDob,
      gender: editGender,
      pob: editPob.trim(),
      province: editPob.trim().includes('Hồ Chí Minh') ? 'TP. Hồ Chí Minh' : editPob.trim().includes('Hà Nội') ? 'Hà Nội' : (ocrResult.province || 'TP. Hồ Chí Minh'),
      idDate: editIdDate,
      idPlace: editIdPlace.trim(),
    };

    // Auto-fill into parent form fields only - user will review and click Save to update API
    onApplyOcrData(finalResult, frontImage, backImage);
    onClose();
  };

  const hasBothImages = Boolean(frontImage && backImage);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="bg-[#0D1117] border border-[#C5A880] max-w-3xl w-full p-6 sm:p-8 text-white space-y-6 shadow-2xl overflow-y-auto max-h-[92vh] rounded-xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#222B35] pb-4">
          <div className="space-y-1">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#C5A880] font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> 3D Flip Card AI Vision • e-KYC CCCD Chip
            </div>
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Scan className="w-5 h-5 text-[#C5A880]" /> Quét OCR Thẻ CCCD Lật 3D Tự Động
            </h3>
            <p className="text-xs text-gray-400">
              Tải lên mặt trước, bấm <strong>Lật Thẻ 3D</strong> để tải mặt sau. Khi quét, AI sẽ tự động lật và quét tuần tự 2 mặt.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-[#161B22] rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 bg-rose-950/90 border border-rose-500 text-rose-300 text-xs flex items-center gap-2 rounded">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* INTERACTIVE 3D FLIPPABLE CARD CONTAINER                       */}
        {/* ------------------------------------------------------------- */}
        <div className="space-y-4">
          {/* Card Face Status Switcher Bar */}
          <div className="flex items-center justify-between bg-[#121820] p-2.5 px-4 border border-[#222B35] rounded-lg">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-400">Đang hiển thị:</span>
              <span className={`font-bold uppercase tracking-wider px-2 py-0.5 rounded text-[11px] font-mono ${
                !isFlipped 
                  ? 'bg-amber-950/80 text-[#C5A880] border border-[#C5A880]' 
                  : 'bg-cyan-950/80 text-cyan-400 border border-cyan-500'
              }`}>
                {!isFlipped ? 'MẶT TRƯỚC (Front)' : 'MẶT SAU (Back)'}
              </span>
            </div>

            {/* Manual Flip Button */}
            <button
              type="button"
              onClick={() => setIsFlipped(!isFlipped)}
              disabled={isScanning}
              className="px-3.5 py-1.5 bg-[#1C2533] hover:bg-[#C5A880] hover:text-[#0D1117] text-[#C5A880] border border-[#C5A880] text-xs font-bold uppercase tracking-wider rounded transition-all flex items-center gap-1.5 shadow"
            >
              <RotateCw className={`w-3.5 h-3.5 transition-transform duration-500 ${isFlipped ? 'rotate-180' : ''}`} />
              <span>Lật Mặt Thẻ 3D</span>
            </button>
          </div>

          {/* 3D Perspective Flip Box */}
          <div className="relative w-full max-w-lg mx-auto h-64 sm:h-72 [perspective:1400px]">
            <div
              className={`w-full h-full relative transition-transform duration-700 [transform-style:preserve-3d] ${
                isFlipped ? '[transform:rotateY(180deg)]' : '[transform:rotateY(0deg)]'
              }`}
            >
              {/* ========================================================= */}
              {/* FACE 1: FRONT SIDE (MẶT TRƯỚC)                            */}
              {/* ========================================================= */}
              <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] rounded-2xl overflow-hidden border-2 border-[#C5A880]/80 bg-gradient-to-br from-[#1A232E] via-[#121820] to-[#0A0E14] shadow-2xl p-4 flex flex-col justify-between">
                {/* Decorative chip header */}
                <div className="flex items-center justify-between text-xs border-b border-gray-800 pb-2">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#C5A880]" />
                    <span className="text-[#C5A880] font-bold uppercase tracking-wider text-[11px]">
                      Mặt Trước • Căn Cước Công Dân
                    </span>
                  </div>
                  {frontImage && (
                    <span className="text-emerald-400 font-mono text-[10px] flex items-center gap-1">
                      <Check className="w-3 h-3" /> Đã Tải Lên
                    </span>
                  )}
                </div>

                {/* Front Image Content */}
                <div 
                  onClick={() => frontInputRef.current?.click()}
                  className="flex-1 my-2 bg-black/50 border border-dashed border-gray-700 hover:border-[#C5A880] rounded-lg overflow-hidden relative group cursor-pointer flex items-center justify-center"
                >
                  {frontImage ? (
                    <>
                      <img
                        src={frontImage}
                        alt="CCCD Front"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      {/* Laser scanning beam */}
                      {isScanning && scanStage === 'SCANNING_FRONT' && (
                        <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#C5A880] to-transparent shadow-[0_0_20px_#C5A880] animate-bounce top-1/2 pointer-events-none" />
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-bold text-white transition-opacity">
                        <Upload className="w-4 h-4 mr-1" /> Chọn Lại Ảnh Mặt Trước
                      </div>
                    </>
                  ) : (
                    <div className="text-center space-y-2 text-gray-400 p-4">
                      <Camera className="w-10 h-10 mx-auto text-gray-500 group-hover:text-[#C5A880] transition-colors" />
                      <div className="text-xs font-semibold text-white">Bấm để tải lên Mặt Trước CCCD</div>
                      <div className="text-[10px] text-gray-500">Chứa ảnh chân dung, 12 số CCCD, Họ tên, Ngày sinh</div>
                    </div>
                  )}
                </div>

                {/* Bottom Bar on Front Face */}
                <div className="flex items-center justify-between text-[11px]">
                  <button
                    type="button"
                    onClick={() => frontInputRef.current?.click()}
                    className="text-gray-400 hover:text-white flex items-center gap-1 font-mono hover:underline"
                  >
                    <Upload className="w-3 h-3" /> {frontImage ? 'Đổi Ảnh Mặt Trước' : 'Chọn Tệp Ảnh'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsFlipped(true)}
                    className="text-[#C5A880] hover:text-white font-bold flex items-center gap-1"
                  >
                    <span>Lật Sang Mặt Sau</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* ========================================================= */}
              {/* FACE 2: BACK SIDE (MẶT SAU)                              */}
              {/* ========================================================= */}
              <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-2xl overflow-hidden border-2 border-cyan-500/80 bg-gradient-to-br from-[#121E2A] via-[#101820] to-[#091018] shadow-2xl p-4 flex flex-col justify-between">
                {/* Decorative chip header */}
                <div className="flex items-center justify-between text-xs border-b border-gray-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <span className="text-cyan-400 font-bold uppercase tracking-wider text-[11px]">
                      Mặt Sau • Chip Điện Tử & Ngày Cấp
                    </span>
                  </div>
                  {backImage && (
                    <span className="text-cyan-400 font-mono text-[10px] flex items-center gap-1">
                      <Check className="w-3 h-3" /> Đã Tải Lên
                    </span>
                  )}
                </div>

                {/* Back Image Content */}
                <div 
                  onClick={() => backInputRef.current?.click()}
                  className="flex-1 my-2 bg-black/50 border border-dashed border-gray-700 hover:border-cyan-400 rounded-lg overflow-hidden relative group cursor-pointer flex items-center justify-center"
                >
                  {backImage ? (
                    <>
                      <img
                        src={backImage}
                        alt="CCCD Back"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      {/* Laser scanning beam */}
                      {isScanning && scanStage === 'SCANNING_BACK' && (
                        <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_#38BDF8] animate-bounce top-1/2 pointer-events-none" />
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-bold text-white transition-opacity">
                        <Upload className="w-4 h-4 mr-1" /> Chọn Lại Ảnh Mặt Sau
                      </div>
                    </>
                  ) : (
                    <div className="text-center space-y-2 text-gray-400 p-4">
                      <Camera className="w-10 h-10 mx-auto text-gray-500 group-hover:text-cyan-400 transition-colors" />
                      <div className="text-xs font-semibold text-white">Bấm để tải lên Mặt Sau CCCD</div>
                      <div className="text-[10px] text-gray-500">Chứa Chip điện tử, Ngày cấp, Nơi cấp & Mã MRZ</div>
                    </div>
                  )}
                </div>

                {/* Bottom Bar on Back Face */}
                <div className="flex items-center justify-between text-[11px]">
                  <button
                    type="button"
                    onClick={() => backInputRef.current?.click()}
                    className="text-gray-400 hover:text-white flex items-center gap-1 font-mono hover:underline"
                  >
                    <Upload className="w-3 h-3" /> {backImage ? 'Đổi Ảnh Mặt Sau' : 'Chọn Tệp Ảnh'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsFlipped(false)}
                    className="text-cyan-400 hover:text-white font-bold flex items-center gap-1"
                  >
                    <ArrowRight className="w-3 h-3 rotate-180" />
                    <span>Lật Về Mặt Trước</span>
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
        <div className="p-4 bg-[#161D26] border border-[#222B35] space-y-3 rounded-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-xs text-gray-300">
              {hasBothImages ? (
                <span className="text-emerald-400 font-bold font-mono flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Đã Tải Đủ 2 Mặt — Sẵn sàng quét AI tự động lật thẻ
                </span>
              ) : (
                <span className="text-amber-400 font-bold font-mono">
                  ⚠️ Hãy tải lên đủ cả Mặt Trước và Mặt Sau trước khi quét!
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleStartAutoFlipOcr}
              disabled={isScanning || !hasBothImages}
              className={`px-6 py-2.5 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 rounded-lg shadow-lg ${
                isScanning || !hasBothImages
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#C5A880] to-amber-400 hover:from-white hover:to-white text-[#0D1117]'
              }`}
            >
              {isScanning ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4 text-[#0D1117]" />
              )}
              {isScanning ? 'Đang Quét & Tự Động Lật...' : 'Bắt Đầu Quét AI Tự Động Lật 2 Mặt'}
            </button>
          </div>

          {/* Scanning Progress & Status */}
          {isScanning && (
            <div className="space-y-1.5 pt-2 animate-fadeIn">
              <div className="flex justify-between text-[11px] font-mono text-gray-300">
                <span className="text-[#C5A880]">{scanStatusText}</span>
                <span className="font-bold">{scanProgress}%</span>
              </div>
              <div className="w-full bg-[#0D1117] h-2 rounded-full overflow-hidden border border-gray-700">
                <div
                  className="bg-gradient-to-r from-[#C5A880] via-cyan-400 to-emerald-400 h-full transition-all duration-300"
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
          <div className="p-5 bg-gradient-to-r from-[#121820] to-[#161D26] border border-emerald-500/80 space-y-4 rounded-lg animate-fadeIn shadow-2xl">
            <div className="flex items-center justify-between border-b border-emerald-500/30 pb-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4" /> Kết Quả Trích Xuất AI 2 Mặt Thực Tế
              </div>
              <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-500 text-[10px] font-mono font-bold rounded">
                Độ Tin Cậy AI: {ocrResult.confidence}%
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-mono font-semibold">1. Số CCCD (12 Số):</label>
                <input
                  type="text"
                  value={editIdNumber}
                  onChange={(e) => setEditIdNumber(e.target.value)}
                  className="w-full bg-[#0D1117] border border-gray-700 p-2 text-[#C5A880] font-mono font-bold rounded focus:border-[#C5A880] outline-none"
                  placeholder="12 số định danh..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-mono font-semibold">2. Họ và Tên:</label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full bg-[#0D1117] border border-gray-700 p-2 text-white font-bold rounded focus:border-[#C5A880] outline-none uppercase"
                  placeholder="Họ và tên..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-mono font-semibold">3. Ngày Sinh (DOB):</label>
                <input
                  type="date"
                  value={formatToApiDate(editDob)}
                  onChange={(e) => setEditDob(e.target.value)}
                  className="w-full bg-[#0D1117] border border-gray-700 p-2 text-white font-mono rounded focus:border-[#C5A880] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-mono font-semibold">4. Giới Tính:</label>
                <select
                  value={editGender}
                  onChange={(e) => setEditGender(e.target.value as '1' | '0')}
                  className="w-full bg-[#0D1117] border border-gray-700 p-2 text-white rounded focus:border-[#C5A880] outline-none"
                >
                  <option value="1">Nam</option>
                  <option value="0">Nữ</option>
                </select>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-[10px] text-gray-400 font-mono font-semibold">5. Quê Quán / Nơi Sinh (Place of Origin):</label>
                <input
                  type="text"
                  value={editPob}
                  onChange={(e) => setEditPob(e.target.value)}
                  className="w-full bg-[#0D1117] border border-gray-700 p-2 text-white rounded focus:border-[#C5A880] outline-none"
                  placeholder="Xã/Phường, Quận/Huyện, Tỉnh/Thành phố..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-mono font-semibold">6. Ngày Cấp (Mặt Sau):</label>
                <input
                  type="date"
                  value={formatToApiDate(editIdDate)}
                  onChange={(e) => setEditIdDate(e.target.value)}
                  className="w-full bg-[#0D1117] border border-gray-700 p-2 text-cyan-400 font-mono rounded focus:border-[#C5A880] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-mono font-semibold">7. Nơi Cấp (Mặt Sau):</label>
                <input
                  type="text"
                  value={editIdPlace}
                  onChange={(e) => setEditIdPlace(e.target.value)}
                  className="w-full bg-[#0D1117] border border-gray-700 p-2 text-cyan-400 rounded focus:border-[#C5A880] outline-none"
                  placeholder="Cục Cảnh sát QLHC về TTXH..."
                />
              </div>
            </div>

            {/* Raw OCR Text Accordion */}
            {ocrResult.rawText && (
              <details className="text-[11px] bg-[#0D1117] border border-gray-800 rounded p-2.5 text-gray-400">
                <summary className="cursor-pointer font-mono text-[#C5A880] hover:text-white select-none">
                  🔍 Xem Ký Tự Nhận Diện Thô Trực Tiếp Từ 2 Mặt (Raw OCR Inspector)
                </summary>
                <pre className="mt-2 p-2 bg-black/60 rounded font-mono text-[10px] text-gray-300 whitespace-pre-wrap max-h-36 overflow-y-auto border border-gray-800">
                  {ocrResult.rawText}
                </pre>
              </details>
            )}
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-[#222B35]">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-800 text-gray-300 hover:text-white text-xs font-semibold rounded-lg"
          >
            Đóng
          </button>

          <button
            type="button"
            onClick={handleApply}
            disabled={!ocrResult}
            className={`px-6 py-2.5 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 rounded-lg shadow-xl ${
              !ocrResult
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                : 'bg-[#C5A880] hover:bg-white text-[#0D1117]'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Áp Dụng Điền Tự Động Vào Form</span>
          </button>
        </div>
      </div>
    </div>
  );
}
