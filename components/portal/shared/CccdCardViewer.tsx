'use client';

import React, { useState, useRef } from 'react';
import { useLanguage } from '@/lib/languageContext';
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
  apartmentCode = 'CH-06',
  frontImage = '',
  backImage = '',
  idDate = '',
  idPlace = '',
  allowUpload = false,
  onUpdateImages,
}: CccdCardViewerProps) {
  const { t } = useLanguage();
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
      <div className="relative w-full max-w-4xl bg-[#0D1117] border border-[#C5A880] p-6 text-white space-y-4 shadow-2xl rounded-none max-h-[95vh] flex flex-col justify-between overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#222B35] pb-3">
          <div className="space-y-0.5">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#C5A880] font-bold flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-[#C5A880]" /> {t('Hồ Sơ Ảnh Chụp CCCD Thật (e-KYC)', 'Actual ID Card Dossier (e-KYC)')}
            </div>
            <h3 className="font-serif text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <span>{fullName}</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-none bg-[#1C2533] border border-[#C5A880] text-[#C5A880]">
                {t('Căn', 'Apt')} {apartmentCode}
              </span>
            </h3>
            <p className="text-xs text-gray-400 font-mono">
              {t('Số CCCD:', 'ID Card No:')} <strong className="text-white">{idCardNo || t('Chưa cập nhật', 'Not updated')}</strong>
              {idDate && <> • {t('Ngày cấp:', 'Issued date:')} {idDate}</>}
              {idPlace && <> • {t('Nơi cấp:', 'Issued at:')} {idPlace}</>}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white bg-[#161B22] border border-[#2D3748] hover:border-[#C5A880] rounded-none transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Side Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 bg-[#121820] p-2.5 sm:p-3 border border-[#222B35] rounded-none text-xs">
          {/* Side Tabs */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => { setActiveSide('FRONT'); handleReset(); }}
              className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-none font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs ${
                activeSide === 'FRONT'
                  ? 'bg-[#C5A880] text-[#0D1117] shadow-lg'
                  : 'bg-[#161B22] text-gray-300 hover:text-white border border-[#2D3748]'
              }`}
            >
              <span>{t('Mặt Trước', 'Front Side')}</span>
              {currentFront ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <span className="text-[10px] text-gray-500">({t('Chưa có', 'None')})</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => { setActiveSide('BACK'); handleReset(); }}
              className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-none font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs ${
                activeSide === 'BACK'
                  ? 'bg-[#C5A880] text-[#0D1117] shadow-lg'
                  : 'bg-[#161B22] text-gray-300 hover:text-white border border-[#2D3748]'
              }`}
            >
              <span>{t('Mặt Sau', 'Back Side')}</span>
              {currentBack ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <span className="text-[10px] text-gray-500">({t('Chưa có', 'None')})</span>
              )}
            </button>
          </div>

          {/* Inspection Tools */}
          <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={!hasImage}
                className="p-2 bg-[#161B22] hover:bg-[#1C2533] border border-[#2D3748] rounded-none text-gray-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                title={t('Thu nhỏ', 'Zoom out')}
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <span className="font-mono text-gray-400 text-xs px-1 min-w-[42px] text-center">
                {Math.round(zoomLevel * 100)}%
              </span>

              <button
                type="button"
                onClick={handleZoomIn}
                disabled={!hasImage}
                className="p-2 bg-[#161B22] hover:bg-[#1C2533] border border-[#2D3748] rounded-none text-gray-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                title={t('Phóng to', 'Zoom in')}
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleRotate}
                disabled={!hasImage}
                className="p-2 bg-[#161B22] hover:bg-[#1C2533] border border-[#2D3748] rounded-none text-gray-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                title={t('Xoay 90 độ', 'Rotate 90°')}
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>

            {allowUpload && (
              <button
                type="button"
                onClick={() => {
                  if (activeSide === 'FRONT') frontInputRef.current?.click();
                  else backInputRef.current?.click();
                }}
                className="px-3 py-2 bg-[#1C2533] hover:bg-[#C5A880] hover:text-[#0D1117] text-[#C5A880] border border-[#C5A880] rounded-none font-bold flex items-center gap-1.5 transition-all shadow text-xs"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{t('Tải Ảnh Thật', 'Upload Photo')}</span>
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

        {/* Viewport Area: Exact Card Proportions (85.6mm x 54mm) */}
        <div className="relative w-full aspect-[85.6/54] max-h-[50vh] sm:max-h-none sm:h-96 bg-[#070A0E] border border-[#222B35] rounded-none flex items-center justify-center overflow-hidden shadow-inner mx-auto">
          {hasImage ? (
            <div 
              className="transition-transform duration-200 ease-out max-w-full max-h-full flex items-center justify-center p-2 sm:p-3"
              style={{
                transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
              }}
            >
              <img
                src={activeImage}
                alt={t('Ảnh chụp thật CCCD', 'Actual ID Card Photo')}
                className="max-h-64 sm:max-h-84 w-auto max-w-full object-contain rounded-none shadow-2xl border border-gray-700"
              />
            </div>
          ) : (
            /* Honest State: No Photo Uploaded Yet */
            <div className="text-center p-4 sm:p-8 space-y-2.5">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-none bg-[#121820] border border-gray-700 flex items-center justify-center mx-auto text-gray-500">
                <CreditCard className="w-6 h-6 sm:w-8 sm:h-8 text-gray-600" />
              </div>
              <div className="space-y-1">
                <h4 className="text-white font-bold text-xs sm:text-sm">
                  {t('Chưa Có Ảnh Chụp', 'No Photo Uploaded Yet')} ({activeSide === 'FRONT' ? t('Mặt Trước', 'Front Side') : t('Mặt Sau', 'Back Side')})
                </h4>
                <p className="text-[11px] sm:text-xs text-gray-400 max-w-md mx-auto line-clamp-2 sm:line-clamp-none">
                  {t('Cư dân chưa tải lên ảnh chụp thật cho mặt này của thẻ Căn cước công dân.', 'Resident has not uploaded the actual photo for this side of the ID card.')}
                </p>
              </div>
              {allowUpload && (
                <button
                  type="button"
                  onClick={() => {
                    if (activeSide === 'FRONT') frontInputRef.current?.click();
                    else backInputRef.current?.click();
                  }}
                  className="px-4 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] font-bold text-xs uppercase tracking-wider rounded-none transition-all shadow"
                >
                  {t('Tải Ảnh Chụp Thật', 'Upload Actual Photo')}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer Info: Clean security badge without redundant duplicate close button */}
        <div className="flex items-center justify-between gap-3 pt-2.5 border-t border-[#222B35] text-[11px] sm:text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="truncate">{t('Bản gốc ảnh chụp thật do cư dân tải lên khi làm thủ tục hồ sơ.', 'Original photo files uploaded by resident during registration.')}</span>
          </div>
          <span className="font-mono text-[10px] text-[#C5A880] shrink-0 font-bold hidden sm:inline">
            SKYLINE ENCRYPTED
          </span>
        </div>

      </div>
    </div>
  );
}
