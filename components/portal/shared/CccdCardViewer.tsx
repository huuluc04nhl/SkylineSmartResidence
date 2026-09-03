'use client';

import React, { useState, useRef } from 'react';
import { 
  X, 
  RotateCw, 
  ZoomIn, 
  ZoomOut, 
  Upload, 
  CreditCard, 
  CheckCircle2, 
  ShieldCheck, 
  AlertCircle,
  FileText
} from 'lucide-react';

export interface CccdCardViewerProps {
  isOpen: boolean;
  onClose: () => void;
  fullName: string;
  idCardNo: string;
  apartmentCode?: string;
  frontImage?: string;
  backImage?: string;
  idDate?: string;
  idPlace?: string;
  dob?: string;
  gender?: string;
  pob?: string;
  avatarUrl?: string;
  allowUpload?: boolean;
  onUpdateImages?: (front: string, back: string) => void;
}

export default function CccdCardViewer({
  isOpen,
  onClose,
  fullName,
  idCardNo,
  apartmentCode = '12A05',
  frontImage = '',
  backImage = '',
  idDate = '',
  idPlace = '',
  allowUpload = false,
  onUpdateImages,
}: CccdCardViewerProps) {
  const [activeSide, setActiveSide] = useState<'FRONT' | 'BACK'>('FRONT');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [currentFront, setCurrentFront] = useState<string>(frontImage);
  const [currentBack, setCurrentBack] = useState<string>(backImage);

  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  // Synchronize with incoming props when changed
  React.useEffect(() => {
    setCurrentFront(frontImage || '');
    setCurrentBack(backImage || '');
  }, [frontImage, backImage]);

  if (!isOpen) return null;

  // Handle resident uploading their actual real photo file
  const handleFrontFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setCurrentFront(reader.result);
          onUpdateImages?.(reader.result, currentBack);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBackFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setCurrentBack(reader.result);
          onUpdateImages?.(currentFront, reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleReset = () => {
    setZoomLevel(1);
    setRotation(0);
  };

  const activeImage = activeSide === 'FRONT' ? currentFront : currentBack;
  const hasImage = Boolean(activeImage && activeImage.trim().length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-4xl bg-[#0D1117] border border-[#C5A880] p-6 text-white space-y-4 shadow-2xl rounded-2xl max-h-[95vh] flex flex-col justify-between overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#222B35] pb-3">
          <div className="space-y-0.5">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#C5A880] font-bold flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-[#C5A880]" /> Hồ Sơ Ảnh Chụp CCCD Thật (e-KYC)
            </div>
            <h3 className="font-serif text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <span>{fullName}</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#1C2533] border border-[#C5A880] text-[#C5A880]">
                Căn {apartmentCode}
              </span>
            </h3>
            <p className="text-xs text-gray-400 font-mono">
              Số CCCD: <strong className="text-white">{idCardNo || 'Chưa cập nhật'}</strong>
              {idDate && <> • Ngày cấp: {idDate}</>}
              {idPlace && <> • Nơi cấp: {idPlace}</>}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white bg-[#161B22] border border-[#2D3748] hover:border-[#C5A880] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Side Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#121820] p-3 border border-[#222B35] rounded-xl text-xs">
          {/* Side Tabs */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { setActiveSide('FRONT'); handleReset(); }}
              className={`px-4 py-2 rounded-lg font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                activeSide === 'FRONT'
                  ? 'bg-[#C5A880] text-[#0D1117] shadow-lg'
                  : 'bg-[#161B22] text-gray-300 hover:text-white border border-[#2D3748]'
              }`}
            >
              <span>Mặt Trước</span>
              {currentFront ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <span className="text-[10px] text-gray-500">(Chưa có)</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => { setActiveSide('BACK'); handleReset(); }}
              className={`px-4 py-2 rounded-lg font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                activeSide === 'BACK'
                  ? 'bg-[#C5A880] text-[#0D1117] shadow-lg'
                  : 'bg-[#161B22] text-gray-300 hover:text-white border border-[#2D3748]'
              }`}
            >
              <span>Mặt Sau</span>
              {currentBack ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <span className="text-[10px] text-gray-500">(Chưa có)</span>
              )}
            </button>
          </div>

          {/* Inspection Tools */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={!hasImage}
              className="p-2 bg-[#161B22] hover:bg-[#1C2533] border border-[#2D3748] rounded-lg text-gray-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
              title="Thu nhỏ"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <span className="font-mono text-gray-400 text-xs px-1">
              {Math.round(zoomLevel * 100)}%
            </span>

            <button
              type="button"
              onClick={handleZoomIn}
              disabled={!hasImage}
              className="p-2 bg-[#161B22] hover:bg-[#1C2533] border border-[#2D3748] rounded-lg text-gray-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
              title="Phóng to"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleRotate}
              disabled={!hasImage}
              className="p-2 bg-[#161B22] hover:bg-[#1C2533] border border-[#2D3748] rounded-lg text-gray-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
              title="Xoay 90 độ"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {allowUpload && (
              <button
                type="button"
                onClick={() => {
                  if (activeSide === 'FRONT') frontInputRef.current?.click();
                  else backInputRef.current?.click();
                }}
                className="px-3 py-2 bg-[#1C2533] hover:bg-[#C5A880] hover:text-[#0D1117] text-[#C5A880] border border-[#C5A880] rounded-lg font-bold flex items-center gap-1.5 transition-all shadow"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Tải Ảnh Chụp Thật</span>
              </button>
            )}

            {/* Hidden Inputs for upload */}
            <input
              ref={frontInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFrontFile}
            />
            <input
              ref={backInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleBackFile}
            />
          </div>
        </div>

        {/* Viewport Area: Strictly Displaying Actual Photo File */}
        <div className="relative w-full h-80 sm:h-96 bg-[#070A0E] border border-[#222B35] rounded-2xl flex items-center justify-center overflow-hidden shadow-inner">
          {hasImage ? (
            <div 
              className="transition-transform duration-200 ease-out max-w-full max-h-full flex items-center justify-center p-3"
              style={{
                transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
              }}
            >
              <img
                src={activeImage}
                alt={`Ảnh chụp thật CCCD ${activeSide === 'FRONT' ? 'Mặt Trước' : 'Mặt Sau'}`}
                className="max-h-72 sm:max-h-84 w-auto max-w-full object-contain rounded-xl shadow-2xl border border-gray-700"
              />
            </div>
          ) : (
            /* Honest State: No Photo Uploaded Yet */
            <div className="text-center p-8 space-y-3">
              <div className="w-16 h-16 rounded-full bg-[#121820] border border-gray-700 flex items-center justify-center mx-auto text-gray-500">
                <CreditCard className="w-8 h-8 text-gray-600" />
              </div>
              <div className="space-y-1">
                <h4 className="text-white font-bold text-sm">
                  Chưa Có Ảnh Chụp {activeSide === 'FRONT' ? 'Mặt Trước' : 'Mặt Sau'}
                </h4>
                <p className="text-xs text-gray-400 max-w-md mx-auto">
                  Cư dân chưa tải lên ảnh chụp thật cho mặt này của thẻ Căn cước công dân. Hệ thống tuyệt đối không tự tạo ảnh giả mạo.
                </p>
              </div>
              {allowUpload && (
                <button
                  type="button"
                  onClick={() => {
                    if (activeSide === 'FRONT') frontInputRef.current?.click();
                    else backInputRef.current?.click();
                  }}
                  className="px-4 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow"
                >
                  Tải Ảnh Chụp Thật ({activeSide === 'FRONT' ? 'Mặt Trước' : 'Mặt Sau'})
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer Info & Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-[#222B35] text-xs">
          <div className="flex items-center gap-2 text-gray-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Chỉ hiển thị bản gốc ảnh chụp thật do cư dân cung cấp khi đăng ký e-KYC.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow"
          >
            Đóng Cửa Sổ
          </button>
        </div>

      </div>
    </div>
  );
}
