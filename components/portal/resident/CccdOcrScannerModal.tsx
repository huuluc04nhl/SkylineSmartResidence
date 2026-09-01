'use client';

import React, { useState } from 'react';
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
  Eye
} from 'lucide-react';
import { runTesseractOcr, OcrCccdResult } from '@/lib/ocrParser';
import { nksUpdateCccd } from '@/lib/nksApiClient';

interface CccdOcrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyOcrData: (data: OcrCccdResult, imageSrc: string) => void;
}

const SAMPLE_CCCD_IMAGES = [
  {
    label: 'Ảnh CCCD Chip Mẫu 1 (Anh Nguyễn Hữu Lực)',
    url: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=600',
  },
  {
    label: 'Ảnh CCCD Chip Mẫu 2 (Chị Trần Thị Mai)',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600',
  },
];

export default function CccdOcrScannerModal({
  isOpen,
  onClose,
  onApplyOcrData,
}: CccdOcrScannerModalProps) {
  const [selectedImage, setSelectedImage] = useState<string>(SAMPLE_CCCD_IMAGES[0].url);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatusText, setScanStatusText] = useState('');
  const [ocrResult, setOcrResult] = useState<OcrCccdResult | null>(null);
  const [isSyncingApi, setIsSyncingApi] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setSelectedImage(reader.result);
          setOcrResult(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStartOcr = async () => {
    setIsScanning(true);
    setScanProgress(0);
    setOcrResult(null);

    try {
      const result = await runTesseractOcr(selectedImage, (pct, status) => {
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
      // 1. Call official NKS CCCD Update API
      await nksUpdateCccd({
        number: ocrResult.idNumber,
        date: ocrResult.idDate,
        place: ocrResult.idPlace,
        front: selectedImage,
      });

      // 2. Callback to parent form to auto-fill all profile fields
      onApplyOcrData(ocrResult, selectedImage);
      onClose();
    } catch (err) {
      console.warn('Sync NKS CCCD error', err);
      onApplyOcrData(ocrResult, selectedImage);
      onClose();
    } finally {
      setIsSyncingApi(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm animate-fadeIn select-none">
      <div className="bg-[#0D1117] border border-[#C5A880] w-full max-w-2xl text-white shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-[#161D26] to-[#0D1117] border-b border-[#222B35] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#1C2533] border border-[#C5A880] flex items-center justify-center text-[#C5A880]">
              <Scan className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-white flex items-center gap-2">
                Quét OCR CCCD Chip (Tesseract AI)
                <span className="px-1.5 py-0.2 bg-[#C5A880] text-[#0D1117] text-[9px] font-mono font-bold uppercase">
                  Tesseract v5
                </span>
              </h3>
              <p className="text-[11px] text-gray-400">
                Tự động nhận diện 12 số CCCD, Họ tên, Ngày sinh, Nơi thường trú và tự điền form
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 hover:bg-[#1C2533] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {/* 1. Image Preview & Upload Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-gray-300 font-semibold flex items-center justify-between">
                <span>Ảnh CCCD Mặt Trước:</span>
                <label className="text-[11px] text-[#C5A880] hover:text-white cursor-pointer flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5" /> Tải Ảnh Lên
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="h-44 bg-black border-2 border-dashed border-[#C5A880]/60 rounded relative flex items-center justify-center overflow-hidden group">
                <img
                  src={selectedImage}
                  alt="CCCD Preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-[11px] text-white bg-black/80 px-2 py-1 border border-gray-600">
                    Nhấp nút dưới để quét OCR
                  </span>
                </div>
              </div>

              {/* Sample Selector */}
              <div className="flex gap-2 pt-1">
                {SAMPLE_CCCD_IMAGES.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedImage(sample.url);
                      setOcrResult(null);
                    }}
                    className={`flex-1 py-1.5 px-2 text-[10px] border transition-colors ${
                      selectedImage === sample.url
                        ? 'border-[#C5A880] text-[#C5A880] bg-[#161B22]'
                        : 'border-gray-700 text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    Ảnh Mẫu {idx + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Action & Instructions */}
            <div className="flex flex-col justify-between p-4 bg-[#121820] border border-[#222B35] space-y-3">
              <div className="space-y-2">
                <div className="text-[11px] uppercase tracking-wider text-[#C5A880] font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Quy Trình OCR Tự Động
                </div>
                <ul className="space-y-1.5 text-gray-400 text-[11px] list-disc list-inside">
                  <li>Trích xuất 12 số CCCD định danh quốc gia.</li>
                  <li>Tự tách Họ & Tên đệm, Tên chính xác.</li>
                  <li>Nhận diện Ngày sinh, Giới tính, Quê quán.</li>
                  <li>Đồng bộ vào NKS API <code className="text-gray-300 font-mono">/updateCccd</code>.</li>
                </ul>
              </div>

              <button
                type="button"
                onClick={handleStartOcr}
                disabled={isScanning}
                className="w-full py-3 bg-[#C5A880] hover:bg-white text-[#0D1117] font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                {isScanning ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                {isScanning ? 'Đang Quét OCR...' : '🚀 Bắt Đầu Quét OCR Tesseract'}
              </button>
            </div>
          </div>

          {/* 3. Realtime Scanning Progress Bar */}
          {isScanning && (
            <div className="p-4 bg-[#161B22] border border-[#C5A880]/70 space-y-2 animate-fadeIn">
              <div className="flex justify-between text-[11px]">
                <span className="text-[#C5A880] font-mono flex items-center gap-1.5">
                  <RefreshCw className="w-3 h-3 animate-spin" /> {scanStatusText}
                </span>
                <span className="font-mono font-bold text-white">{scanProgress}%</span>
              </div>
              <div className="w-full h-2 bg-[#0D1117] overflow-hidden border border-gray-700">
                <div
                  className="h-full bg-gradient-to-r from-[#C5A880] to-amber-300 transition-all duration-300"
                  style={{ width: `${scanProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* 4. Extracted OCR Result Summary */}
          {ocrResult && !isScanning && (
            <div className="p-4 bg-[#121820] border border-emerald-500/70 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-[#222B35] pb-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4" /> Đã Trích Xuất Thành Công
                </div>
                <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/80 px-2 py-0.5 border border-emerald-500">
                  Độ tin cậy: {ocrResult.confidence}%
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-[11px]">
                <div className="p-2 bg-[#161B22] border border-[#222B35]">
                  <span className="text-gray-400 block text-[10px]">Số CCCD:</span>
                  <strong className="font-mono text-[#C5A880]">{ocrResult.idNumber}</strong>
                </div>

                <div className="p-2 bg-[#161B22] border border-[#222B35]">
                  <span className="text-gray-400 block text-[10px]">Họ và Tên:</span>
                  <strong className="text-white">{ocrResult.fullName}</strong>
                </div>

                <div className="p-2 bg-[#161B22] border border-[#222B35]">
                  <span className="text-gray-400 block text-[10px]">Ngày Sinh (DOB):</span>
                  <span className="text-gray-200 font-mono">{ocrResult.dob}</span>
                </div>

                <div className="p-2 bg-[#161B22] border border-[#222B35]">
                  <span className="text-gray-400 block text-[10px]">Giới Tính:</span>
                  <span className="text-gray-200">{ocrResult.gender === '1' ? 'Nam' : 'Nữ'}</span>
                </div>

                <div className="p-2 bg-[#161B22] border border-[#222B35]">
                  <span className="text-gray-400 block text-[10px]">Quê Quán:</span>
                  <span className="text-gray-200 truncate block">{ocrResult.pob}</span>
                </div>

                <div className="p-2 bg-[#161B22] border border-[#222B35]">
                  <span className="text-gray-400 block text-[10px]">Nơi Cấp:</span>
                  <span className="text-gray-200 truncate block">{ocrResult.idPlace}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#0D1117] border-t border-[#222B35] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#161B22] hover:bg-[#1C2533] border border-gray-700 text-gray-300 text-xs font-semibold"
          >
            Đóng
          </button>

          {ocrResult && (
            <button
              type="button"
              onClick={handleApply}
              disabled={isSyncingApi}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-[#0D1117] font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition-colors"
            >
              {isSyncingApi ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              {isSyncingApi ? 'Đang Đồng Bộ NKS...' : '⚡ Tự Động Điền & Cập Nhật CCCD Ngay'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
