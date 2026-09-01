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
  Image as ImageIcon,
  AlertCircle
} from 'lucide-react';
import { runDualSideCccdOcr, OcrCccdResult } from '@/lib/ocrParser';
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
  const [isScanning, setIsScanning] = useState(false);
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

  const handleStartOcr = async () => {
    if (!frontImage || !backImage) {
      setErrorMessage('Vui lòng tải lên đầy đủ cả Mặt Trước và Mặt Sau của CCCD.');
      return;
    }

    setIsScanning(true);
    setScanProgress(0);
    setOcrResult(null);
    setErrorMessage(null);

    try {
      const result = await runDualSideCccdOcr(frontImage, backImage, (pct, status) => {
        setScanProgress(pct);
        setScanStatusText(status);
      });

      setOcrResult(result);
      // Populate editable fields
      setEditIdNumber(result.idNumber);
      setEditFullName(result.fullName);
      setEditDob(result.dob);
      setEditGender(result.gender);
      setEditPob(result.pob);
      setEditIdDate(result.idDate);
      setEditIdPlace(result.idPlace || 'Cục Cảnh sát QLHC về TTXH');
    } catch (err: any) {
      console.error('OCR Error:', err);
      setErrorMessage(err.message || 'Lỗi phân tích hình ảnh. Vui lòng thử tải lên ảnh rõ nét hơn.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleApply = async () => {
    if (!ocrResult) return;
    setIsSyncingApi(true);

    const finalResult: OcrCccdResult = {
      ...ocrResult,
      idNumber: editIdNumber.trim(),
      fullName: editFullName.trim(),
      dob: editDob,
      gender: editGender,
      pob: editPob.trim(),
      province: editPob.trim().includes('Hồ Chí Minh') ? 'TP. Hồ Chí Minh' : editPob.trim().includes('Hà Nội') ? 'Hà Nội' : editPob.trim(),
      idDate: editIdDate,
      idPlace: editIdPlace.trim(),
    };

    try {
      // Call official NKS CCCD Update API with 2 sides
      await nksUpdateCccd({
        number: finalResult.idNumber,
        date: finalResult.idDate,
        place: finalResult.idPlace,
        front: frontImage,
        back: backImage,
      });

      // Callback to parent form to auto-fill all profile fields
      onApplyOcrData(finalResult, frontImage, backImage);
      onClose();
    } catch (err) {
      console.warn('Sync CCCD error', err);
      onApplyOcrData(finalResult, frontImage, backImage);
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
              Tải lên đủ <strong>Mặt Trước</strong> và <strong>Mặt Sau</strong> CCCD thực tế của bạn, sau đó nhấn Quét để AI trích xuất thông tin.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-[#161B22] rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Message Banner */}
        {errorMessage && (
          <div className="p-3 bg-rose-950/90 border border-rose-500 text-rose-300 text-xs flex items-center gap-2 rounded">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

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
                <Upload className="w-3.5 h-3.5" /> Chọn Ảnh Mặt Trước
              </button>
            </div>

            <div 
              onClick={() => frontInputRef.current?.click()}
              className="h-52 bg-black/60 border-2 border-dashed border-gray-700 hover:border-[#C5A880] overflow-hidden relative group cursor-pointer flex items-center justify-center rounded"
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
                <div className="text-center space-y-2 text-gray-400 p-6">
                  <Camera className="w-10 h-10 mx-auto text-gray-500 group-hover:text-[#C5A880] transition-colors" />
                  <div className="text-xs font-semibold text-white">Bấm để tải lên Mặt Trước CCCD</div>
                  <div className="text-[10px] text-gray-500">Hỗ trợ định dạng JPG, PNG, WEBP</div>
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
                <Upload className="w-3.5 h-3.5" /> Chọn Ảnh Mặt Sau
              </button>
            </div>

            <div 
              onClick={() => backInputRef.current?.click()}
              className="h-52 bg-black/60 border-2 border-dashed border-gray-700 hover:border-[#C5A880] overflow-hidden relative group cursor-pointer flex items-center justify-center rounded"
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
                <div className="text-center space-y-2 text-gray-400 p-6">
                  <Camera className="w-10 h-10 mx-auto text-gray-500 group-hover:text-[#C5A880] transition-colors" />
                  <div className="text-xs font-semibold text-white">Bấm để tải lên Mặt Sau CCCD</div>
                  <div className="text-[10px] text-gray-500">Hỗ trợ định dạng JPG, PNG, WEBP</div>
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
              Trạng thái ảnh: {hasBothImages ? (
                <span className="text-emerald-400 font-bold font-mono">Đã chọn đủ 2 Mặt CCCD (Sẵn sàng quét AI) ✓</span>
              ) : (
                <span className="text-amber-400 font-bold font-mono">Chưa đủ 2 mặt — Hãy chọn ảnh Mặt Trước và Mặt Sau!</span>
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
              {isScanning ? 'Đang Quét 2 Mặt...' : 'Tiến Hành Quét AI OCR 2 Mặt'}
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
        {/* STEP 3: EXTRACTED DUAL-SIDE VERIFICATION & EDITING TABLE      */}
        {/* ------------------------------------------------------------- */}
        {ocrResult && (
          <div className="p-5 bg-gradient-to-r from-[#121820] to-[#161D26] border border-emerald-500/80 space-y-4 rounded-lg animate-fadeIn shadow-2xl">
            <div className="flex items-center justify-between border-b border-emerald-500/30 pb-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4" /> Kết Quả Trích Xuất AI Thực Tế (Có Thể Chỉnh Sửa)
              </div>
              <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-500 text-[10px] font-mono font-bold rounded">
                Độ Tin Cậy: {ocrResult.confidence}%
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-mono">Số CCCD (12 Số):</label>
                <input
                  type="text"
                  value={editIdNumber}
                  onChange={(e) => setEditIdNumber(e.target.value)}
                  className="w-full bg-[#0D1117] border border-gray-700 p-2 text-[#C5A880] font-mono font-bold rounded focus:border-[#C5A880] outline-none"
                  placeholder="12 số CCCD..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-mono">Họ và Tên:</label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full bg-[#0D1117] border border-gray-700 p-2 text-white font-bold rounded focus:border-[#C5A880] outline-none"
                  placeholder="Họ và tên..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-mono">Ngày Sinh (DOB):</label>
                <input
                  type="date"
                  value={editDob}
                  onChange={(e) => setEditDob(e.target.value)}
                  className="w-full bg-[#0D1117] border border-gray-700 p-2 text-white font-mono rounded focus:border-[#C5A880] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-mono">Giới Tính:</label>
                <select
                  value={editGender}
                  onChange={(e) => setEditGender(e.target.value as '1' | '0')}
                  className="w-full bg-[#0D1117] border border-gray-700 p-2 text-white rounded focus:border-[#C5A880] outline-none"
                >
                  <option value="1">Nam</option>
                  <option value="0">Nữ</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-mono">Ngày Cấp (Mặt Sau):</label>
                <input
                  type="date"
                  value={editIdDate}
                  onChange={(e) => setEditIdDate(e.target.value)}
                  className="w-full bg-[#0D1117] border border-gray-700 p-2 text-cyan-400 font-mono rounded focus:border-[#C5A880] outline-none"
                />
              </div>

              <div className="space-y-1 md:col-span-3">
                <label className="text-[10px] text-gray-400 font-mono">Nơi Cấp (Mặt Sau):</label>
                <input
                  type="text"
                  value={editIdPlace}
                  onChange={(e) => setEditIdPlace(e.target.value)}
                  className="w-full bg-[#0D1117] border border-gray-700 p-2 text-cyan-400 rounded focus:border-[#C5A880] outline-none"
                  placeholder="Cục Cảnh sát QLHC về TTXH..."
                />
              </div>

              <div className="space-y-1 sm:col-span-2 md:col-span-4">
                <label className="text-[10px] text-gray-400 font-mono">Quê Quán / Nơi Thường Trú:</label>
                <input
                  type="text"
                  value={editPob}
                  onChange={(e) => setEditPob(e.target.value)}
                  className="w-full bg-[#0D1117] border border-gray-700 p-2 text-white rounded focus:border-[#C5A880] outline-none"
                  placeholder="Địa chỉ thường trú..."
                />
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
