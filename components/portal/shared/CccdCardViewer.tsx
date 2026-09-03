'use client';

import React, { useState, useRef } from 'react';
import { 
  X, 
  RotateCw, 
  ZoomIn, 
  ZoomOut, 
  Upload, 
  CreditCard, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  Eye, 
  FileText,
  UserCheck,
  Download,
  Maximize2
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
  idDate = '18/08/2022',
  idPlace = 'Cục Cảnh sát QLHC về TTXH',
  dob = '18/08/2004',
  gender = 'Nam',
  pob = 'Quảng Trị',
  avatarUrl = '',
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

  // Sync with incoming props if changed
  React.useEffect(() => {
    if (frontImage) setCurrentFront(frontImage);
    if (backImage) setCurrentBack(backImage);
  }, [frontImage, backImage]);

  if (!isOpen) return null;

  // Handle local file uploads
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
    setZoomLevel(prev => Math.min(prev + 0.25, 2.5));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.75));
  };

  const handleReset = () => {
    setZoomLevel(1);
    setRotation(0);
  };

  const activeImage = activeSide === 'FRONT' ? currentFront : currentBack;
  const isCustomUploaded = Boolean(
    activeImage && 
    (activeImage.startsWith('data:image/') || activeImage.startsWith('blob:') || (!activeImage.includes('unsplash') && !activeImage.includes('default.png')))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-4xl bg-[#0D1117] border border-[#C5A880] p-6 text-white space-y-5 shadow-2xl rounded-2xl max-h-[94vh] flex flex-col justify-between overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#222B35] pb-4">
          <div className="space-y-1">
            <div className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-bold flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-[#C5A880]" /> Hồ Sơ Căn Cước Công Dân (e-KYC)
            </div>
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <span>{fullName}</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#1C2533] border border-[#C5A880] text-[#C5A880]">
                Căn {apartmentCode}
              </span>
            </h3>
            <p className="text-xs text-gray-400 font-mono">
              Số CCCD: <strong className="text-white">{idCardNo || '067204000961'}</strong> • Ngày cấp: {idDate} • Nơi cấp: {idPlace}
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
              <span>1. Mặt Trước (Front)</span>
              {currentFront && <CheckCircle2 className="w-3.5 h-3.5" />}
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
              <span>2. Mặt Sau (Back)</span>
              {currentBack && <CheckCircle2 className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Inspection Tools */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-2 bg-[#161B22] hover:bg-[#1C2533] border border-[#2D3748] rounded-lg text-gray-300 hover:text-white"
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
              className="p-2 bg-[#161B22] hover:bg-[#1C2533] border border-[#2D3748] rounded-lg text-gray-300 hover:text-white"
              title="Phóng to"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleRotate}
              className="p-2 bg-[#161B22] hover:bg-[#1C2533] border border-[#2D3748] rounded-lg text-gray-300 hover:text-white"
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
                <span>Tải Ảnh Mới</span>
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

        {/* Viewport Area */}
        <div className="relative w-full h-80 sm:h-96 bg-[#070A0E] border border-[#222B35] rounded-2xl flex items-center justify-center overflow-hidden shadow-inner">
          
          {/* If the resident uploaded their own authentic raw file */}
          {isCustomUploaded ? (
            <div 
              className="transition-transform duration-200 ease-out max-w-full max-h-full flex items-center justify-center p-4"
              style={{
                transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
              }}
            >
              <img
                src={activeImage}
                alt={`CCCD ${activeSide === 'FRONT' ? 'Mặt Trước' : 'Mặt Sau'}`}
                className="max-h-72 sm:max-h-80 w-auto object-contain rounded-xl shadow-2xl border border-gray-700"
              />
            </div>
          ) : (
            /* Authentic Realistic Vietnamese Chip CCCD Card Rendering */
            <div 
              className="transition-transform duration-200 ease-out p-2 flex items-center justify-center"
              style={{
                transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
              }}
            >
              {activeSide === 'FRONT' ? (
                /* FRONT SIDE OF VIETNAMESE CITIZEN ID */
                <div className="w-[420px] sm:w-[480px] h-[260px] sm:h-[300px] bg-gradient-to-br from-[#E2F0D9] via-[#F4F9F2] to-[#D5E8D4] text-[#1A2E1A] p-4 sm:p-5 rounded-2xl border-2 border-[#82B366] shadow-2xl relative font-sans select-text overflow-hidden">
                  {/* Subtle Guilloche Security Pattern */}
                  <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#274E13_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none" />
                  
                  {/* Top National Header */}
                  <div className="flex items-center gap-3 border-b border-[#82B366]/40 pb-2">
                    {/* Emblem */}
                    <div className="w-11 h-11 rounded-full bg-red-600 border border-amber-400 flex items-center justify-center text-amber-300 font-bold text-lg shadow">
                      ★
                    </div>
                    <div className="flex-1 text-center">
                      <div className="text-[10px] sm:text-[11px] uppercase font-bold tracking-wider text-[#0D3B0E]">
                        CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                      </div>
                      <div className="text-[8px] sm:text-[9px] text-[#274E13]">
                        Độc lập - Tự do - Hạnh phúc
                      </div>
                      <div className="text-[11px] sm:text-[12px] font-black uppercase text-red-700 tracking-widest mt-0.5">
                        CĂN CƯỚC CÔNG DÂN
                      </div>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="grid grid-cols-12 gap-3 mt-3 items-center">
                    {/* Portrait Photo & Stamp */}
                    <div className="col-span-4 relative">
                      <div className="w-24 sm:w-28 h-32 sm:h-36 rounded-lg overflow-hidden border-2 border-[#274E13] shadow bg-white">
                        <img
                          src={avatarUrl || 'https://data.nks.vn/storage/users/default.png'}
                          alt={fullName}
                          onError={(e) => {
                            e.currentTarget.src = 'https://data.nks.vn/storage/users/default.png';
                          }}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {/* Red Stamp Overlay */}
                      <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-full border-2 border-dashed border-red-600/70 flex items-center justify-center rotate-[-15deg] pointer-events-none">
                        <span className="text-[7px] font-bold text-red-600 text-center uppercase leading-tight">
                          QLHC<br/>TTXH
                        </span>
                      </div>
                    </div>

                    {/* ID Card Fields */}
                    <div className="col-span-8 space-y-1 text-[10px] sm:text-[11px] text-[#1E3A1E] font-medium leading-tight pl-1">
                      <div>
                        <span className="text-[9px] text-[#4F6D4F] block">Số / No.:</span>
                        <strong className="text-red-700 font-mono text-base sm:text-lg font-black tracking-widest">
                          {idCardNo || '067204000961'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[9px] text-[#4F6D4F] block">Họ và tên / Full name:</span>
                        <strong className="uppercase font-bold text-[#0D3B0E] text-xs sm:text-sm">
                          {fullName}
                        </strong>
                      </div>
                      <div className="flex justify-between pr-4">
                        <div>
                          <span className="text-[9px] text-[#4F6D4F] block">Ngày sinh / Date of birth:</span>
                          <span className="font-mono font-bold text-[#1E3A1E]">{dob}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-[#4F6D4F] block">Giới tính / Sex:</span>
                          <span className="font-bold text-[#1E3A1E]">{gender}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-[9px] text-[#4F6D4F] block">Quê quán / Place of origin:</span>
                        <span className="font-semibold text-[#1E3A1E] text-[10px]">{pob}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-[#4F6D4F] block">Nơi thường trú / Place of residence:</span>
                        <span className="font-semibold text-[#1E3A1E] text-[10px]">
                          Căn {apartmentCode}, Tòa nhà Skyline Smart Residence
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Security Watermark */}
                  <div className="absolute bottom-2 right-3 text-[8px] font-mono text-[#527952]">
                    BỘ CÔNG AN • CỤC CẢNH SÁT QLHC VỀ TTXH
                  </div>
                </div>
              ) : (
                /* BACK SIDE OF VIETNAMESE CITIZEN ID WITH SMART CHIP */
                <div className="w-[420px] sm:w-[480px] h-[260px] sm:h-[300px] bg-gradient-to-br from-[#E2F0D9] via-[#F4F9F2] to-[#D5E8D4] text-[#1A2E1A] p-4 sm:p-5 rounded-2xl border-2 border-[#82B366] shadow-2xl relative font-sans select-text overflow-hidden flex flex-col justify-between">
                  {/* Subtle Guilloche Security Pattern */}
                  <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#274E13_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none" />

                  {/* Top: Smart Chip & Biometric Features */}
                  <div className="flex items-center justify-between border-b border-[#82B366]/40 pb-2">
                    {/* Electronic Smart Chip Icon */}
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-9 bg-gradient-to-r from-amber-300 via-amber-200 to-amber-400 border border-amber-600 rounded-md shadow flex items-center justify-center relative">
                        <div className="w-4 h-6 border-x border-[#8D6E63] flex flex-col justify-between py-1">
                          <div className="h-0.5 bg-[#8D6E63]" />
                          <div className="h-0.5 bg-[#8D6E63]" />
                        </div>
                      </div>
                      <div className="text-[9px] font-mono text-[#274E13] font-bold">
                        CHIP ĐIỆN TỬ BẢO MẬT (ICAO)
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[9px] text-[#4F6D4F] block">Ngày cấp / Date of issue:</span>
                      <strong className="font-mono text-[#0D3B0E] text-xs">{idDate}</strong>
                    </div>
                  </div>

                  {/* Middle: Signature & Authority */}
                  <div className="grid grid-cols-2 gap-3 text-[10px] text-[#1E3A1E] my-auto">
                    <div className="space-y-1">
                      <span className="text-[9px] text-[#4F6D4F] block">Đặc điểm nhân dạng / Personal identification:</span>
                      <div className="text-[9px] italic text-[#274E13]">
                        Sẹo chấm c.0,5cm dưới sau mép phải
                      </div>
                    </div>
                    <div className="text-center space-y-0.5">
                      <div className="text-[9px] uppercase font-bold text-[#0D3B0E]">
                        GIÁM ĐỐC / CỤC TRƯỞNG
                      </div>
                      <div className="font-serif italic text-blue-900 text-sm py-1 font-bold">
                        Nguyễn Văn Long
                      </div>
                      <div className="text-[8px] text-[#4F6D4F]">Đã ký số điện tử</div>
                    </div>
                  </div>

                  {/* Bottom: ICAO 3-Line Machine Readable Zone (MRZ) */}
                  <div className="bg-[#121820]/90 text-emerald-400 font-mono text-[9px] sm:text-[10px] p-2 rounded-lg border border-emerald-500/50 tracking-widest leading-relaxed">
                    <div>IDVNM{idCardNo || '067204000961'}5&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</div>
                    <div>0408180M3208182VNM&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;8</div>
                    <div>{fullName.toUpperCase().replace(/\s+/g, '&lt;')}&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Laser Scanner Line Effect */}
          <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-[#C5A880] to-transparent shadow-[0_0_10px_#C5A880] opacity-40 pointer-events-none animate-pulse" />
        </div>

        {/* Footer Info & Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-[#222B35] text-xs">
          <div className="flex items-center gap-2 text-gray-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Ảnh thẻ được đối chiếu bảo mật theo tiêu chuẩn e-KYC quốc gia.</span>
          </div>

          <div className="flex items-center gap-2">
            {allowUpload && (
              <span className="text-[11px] text-[#C5A880] font-mono">
                Quý cư dân có thể bấm &quot;Tải Ảnh Mới&quot; để đổi ảnh thẻ
              </span>
            )}
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
    </div>
  );
}
