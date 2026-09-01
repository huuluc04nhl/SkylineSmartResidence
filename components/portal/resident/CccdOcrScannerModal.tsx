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
  Image as ImageIcon
} from 'lucide-react';
import { runDualSideCccdOcr, OcrCccdResult } from '@/lib/ocrParser';
import { nksUpdateCccd } from '@/lib/nksApiClient';

interface CccdOcrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyOcrData: (data: OcrCccdResult, frontImage: string, backImage: string) => void;
}

const SAMPLE_FRONT_IMAGE = 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=600';
const SAMPLE_BACK_IMAGE = 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600';

export default function CccdOcrScannerModal({
  isOpen,
  onClose,
  onApplyOcrData,
}: CccdOcrScannerModalProps) {
  const [frontImage, setFrontImage] = useState<string>(SAMPLE_FRONT_IMAGE);
  const [backImage, setBackImage] = useState<string>(SAMPLE_BACK_IMAGE);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatusText, setScanStatusText] = useState('');
  const [ocrResult, setOcrResult] = useState<OcrCccdResult | null>(null);
  const [isSyncingApi, setIsSyncingApi] = useState(false);

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
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStartOcr = async () => {
    if (!frontImage || !backImage) return;

    setIsScanning(true);
    setScanProgress(0);
    setOcrResult(null);

    try {
      const result = await runDualSideCccdOcr(frontImage, backImage, (pct, status) => {
        setScanProgress(pct);
        setScanStatusText(status);
      });

      setOcrResult(result);
    } catch (err) {
      console.warn('OCR error', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleApply = async () => {
    if (!ocrResult) return;
    setIsSyncingApi(true);

    try {
      // 1. Call official NKS CCCD Update API with 2 sides
      await nksUpdateCccd({
        number: ocrResult.idNumber,
        date: ocrResult.idDate,
        place: ocrResult.idPlace,
        front: frontImage,
        back: backImage,
      });

      // 2. Callback to parent form to auto-fill all profile fields
      onApplyOcrData(ocrResult, frontImage, backImage);
      onClose();
    } catch (err) {
      console.warn('Sync CCCD error', err);
      onApplyOcrData(ocrResult, frontImage, backImage);
      onClose();
    } finally {
      setIsSyncingApi(false);
    }
  };

  const hasBothImages = Boolean(frontImage && backImage);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="bg-[#0D1117] border border-[#C5A880] max-w-4xl w-full p-6 sm:p-8 text-white space-y-6 shadow-2xl overflow-y-auto max-h-[92vh] rounded-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#222B35] pb-4">
          <div className="space-y-1">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#C5A880] font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Tesseract.js Dual-Side AI Engine • e-KYC CCCD Chip
            </div>
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Scan className="w-5 h-5 text-[#C5A880]" /> Quét OCR 2 Mặt Căn Cước Công Dân (Chip)
            </h3>
            <p className="text-xs text-gray-400">
              Tải lên đồng thời <strong>Mặt Trước</strong> và <strong>Mặt Sau</strong> CCCD, sau đó bấm Quét AI để tự động trích xuất toàn bộ thông tin.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-[#161B22] rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* STEP 1: DUAL-SIDE UPLOAD PREVIEWS (MẶT TRƯỚC + MẶT SAU)       */}
        {/* ------------------------------------------------------------- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Front Side Upload Box */}
          <div className="space-y-3 p-4 bg-[#121820] border border-[#222B35] rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#C5A880] uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-4 h-4" /> 1. Mặt Trước CCCD (Chân dung & Số định danh)
              </span>
              <button
                type="button"
                onClick={() => frontInputRef.current?.click()}
                className="text-[11px] text-white hover:text-[#C5A880] flex items-center gap-1 font-mono hover:underline"
              >
                <Upload className="w-3.5 h-3.5" /> Tải Ảnh Mặt Trước
              </button>
            </div>

            <div 
              onClick={() => frontInputRef.current?.click()}
              className="h-48 bg-black/60 border-2 border-dashed border-gray-700 hover:border-[#C5A880] overflow-hidden relative group cursor-pointer flex items-center justify-center rounded"
            >
              {frontImage ? (
                <>
                  <img
                    src={frontImage}
                    alt="CCCD Front"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  {isScanning && (
                    <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#C5A880] to-transparent shadow-[0_0_15px_#C5A880] animate-bounce top-1/2 pointer-events-none" />
                  )}
                  <div className="absolute bottom-2 left-2 bg-black/80 px-2 py-0.5 text-[10px] font-mono text-emerald-400 border border-emerald-500 rounded">
                    Mặt Trước: Đã Tải Lên ✓
                  </div>
                </>
              ) : (
                <div className="text-center space-y-2 text-gray-400 p-4">
                  <Camera className="w-8 h-8 mx-auto text-gray-500" />
                  <div className="text-xs">Bấm để tải lên ảnh Mặt Trước</div>
                </div>
              )}
            </div>

            <input
              ref={frontInputRef}
              type="file"
              accept="image/*"
              onChange={handleFrontUpload}
              className="hidden"
            />
          </div>

          {/* Back Side Upload Box */}
          <div className="space-y-3 p-4 bg-[#121820] border border-[#222B35] rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#C5A880] uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4" /> 2. Mặt Sau CCCD (Chip & Ngày cấp)
              </span>
              <button
                type="button"
                onClick={() => backInputRef.current?.click()}
                className="text-[11px] text-white hover:text-[#C5A880] flex items-center gap-1 font-mono hover:underline"
              >
                <Upload className="w-3.5 h-3.5" /> Tải Ảnh Mặt Sau
              </button>
            </div>

            <div 
              onClick={() => backInputRef.current?.click()}
              className="h-48 bg-black/60 border-2 border-dashed border-gray-700 hover:border-[#C5A880] overflow-hidden relative group cursor-pointer flex items-center justify-center rounded"
            >
              {backImage ? (
                <>
                  <img
                    src={backImage}
                    alt="CCCD Back"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  {isScanning && (
                    <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#38BDF8] animate-bounce top-1/2 pointer-events-none" />
                  )}
                  <div className="absolute bottom-2 left-2 bg-black/80 px-2 py-0.5 text-[10px] font-mono text-cyan-400 border border-cyan-500 rounded">
                    Mặt Sau: Đã Tải Lên ✓
                  </div>
                </>
              ) : (
                <div className="text-center space-y-2 text-gray-400 p-4">
                  <Camera className="w-8 h-8 mx-auto text-gray-500" />
                  <div className="text-xs">Bấm để tải lên ảnh Mặt Sau</div>
                </div>
              )}
            </div>

            <input
              ref={backInputRef}
              type="file"
              accept="image/*"
              onChange={handleBackUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* STEP 2: OCR TRIGGER BUTTON & PROGRESS BAR                     */}
        {/* ------------------------------------------------------------- */}
        <div className="p-4 bg-[#161D26] border border-[#222B35] space-y-3 rounded-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-xs text-gray-300">
              Trạng thái tải ảnh: {hasBothImages ? (
                <span className="text-emerald-400 font-bold font-mono">Đủ 2 Mặt CCCD (Sẵn sàng quét AI) ✓</span>
              ) : (
                <span className="text-amber-400 font-bold font-mono">Vui lòng tải lên đủ cả Mặt Trước và Mặt Sau!</span>
              )}
            </div>

            <button
              type="button"
              onClick={handleStartOcr}
              disabled={isScanning || !hasBothImages}
              className={`px-6 py-2.5 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 rounded shadow-lg ${
                isScanning || !hasBothImages
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : 'bg-[#C5A880] hover:bg-white text-[#0D1117]'
              }`}
            >
              {isScanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-amber-900" />}
              {isScanning ? 'Đang Phân Tích 2 Mặt...' : 'Tiến Hành Quét AI OCR 2 Mặt'}
            </button>
          </div>

          {/* Scanning Progress Bar */}
          {isScanning && (
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-[11px] font-mono text-gray-300">
                <span className="text-[#C5A880]">{scanStatusText}</span>
                <span>{scanProgress}%</span>
              </div>
              <div className="w-full bg-[#0D1117] h-2 rounded-full overflow-hidden border border-gray-700">
                <div
                  className="bg-gradient-to-r from-[#C5A880] to-amber-300 h-full transition-all duration-300"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* STEP 3: EXTRACTED DUAL-SIDE VERIFICATION TABLE                */}
        {/* ------------------------------------------------------------- */}
        {ocrResult && (
          <div className="p-5 bg-gradient-to-r from-[#121820] to-[#161D26] border border-emerald-500/80 space-y-4 rounded-lg animate-fadeIn shadow-2xl">
            <div className="flex items-center justify-between border-b border-emerald-500/30 pb-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4" /> Kết Quả Bóc Tách OCR 2 Mặt Thành Công
              </div>
              <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-500 text-[10px] font-mono font-bold rounded">
                Độ Tin Cậy: {ocrResult.confidence}%
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-2.5 bg-[#0D1117] border border-gray-800 rounded">
                <div className="text-[10px] text-gray-400">Số CCCD (12 Số)</div>
                <div className="text-[#C5A880] font-bold mt-0.5">{ocrResult.idNumber}</div>
              </div>

              <div className="p-2.5 bg-[#0D1117] border border-gray-800 rounded">
                <div className="text-[10px] text-gray-400">Họ và Tên</div>
                <div className="text-white font-bold mt-0.5">{ocrResult.fullName}</div>
              </div>

              <div className="p-2.5 bg-[#0D1117] border border-gray-800 rounded">
                <div className="text-[10px] text-gray-400">Ngày Sinh (DOB)</div>
                <div className="text-white font-bold mt-0.5">{ocrResult.dob}</div>
              </div>

              <div className="p-2.5 bg-[#0D1117] border border-gray-800 rounded">
                <div className="text-[10px] text-gray-400">Giới Tính</div>
                <div className="text-white font-bold mt-0.5">{ocrResult.gender === '1' ? 'Nam' : 'Nữ'}</div>
              </div>

              <div className="p-2.5 bg-[#0D1117] border border-gray-800 rounded">
                <div className="text-[10px] text-gray-400">Ngày Cấp (Mặt Sau)</div>
                <div className="text-cyan-400 font-bold mt-0.5">{ocrResult.idDate}</div>
              </div>

              <div className="p-2.5 bg-[#0D1117] border border-gray-800 rounded">
                <div className="text-[10px] text-gray-400">Nơi Cấp (Mặt Sau)</div>
                <div className="text-cyan-400 font-bold mt-0.5 truncate">{ocrResult.idPlace}</div>
              </div>

              <div className="p-2.5 bg-[#0D1117] border border-gray-800 rounded sm:col-span-2">
                <div className="text-[10px] text-gray-400">Quê Quán / Thường Trú</div>
                <div className="text-white font-bold mt-0.5 truncate">{ocrResult.pob}</div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-[#222B35]">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-800 text-gray-300 hover:text-white text-xs font-semibold rounded"
          >
            Đóng
          </button>

          <button
            type="button"
            onClick={handleApply}
            disabled={!ocrResult || isSyncingApi}
            className={`px-6 py-2.5 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 rounded shadow-xl ${
              !ocrResult || isSyncingApi
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                : 'bg-[#C5A880] hover:bg-white text-[#0D1117]'
            }`}
          >
            {isSyncingApi ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            {isSyncingApi ? 'Đang Đồng Bộ NKS API...' : 'Áp Dụng Dữ Liệu 2 Mặt & Lưu Lên NKS API'}
          </button>
        </div>
      </div>
    </div>
  );
}
