'use client';

import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { 
  Camera, 
  CameraOff, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Upload, 
  Zap, 
  Building2, 
  User, 
  Phone, 
  Car, 
  Clock, 
  KeyRound, 
  Search, 
  RefreshCw, 
  Check, 
  UserCheck, 
  LogIn, 
  LogOut, 
  ShieldCheck, 
  ShieldAlert, 
  Sparkles,
  FileText,
  Home,
  Users,
  Info
} from 'lucide-react';
import { 
  verifyVisitorQr, 
  VerificationScanResult, 
  getAllVisitorPasses,
  GeneratedVisitorPass,
  checkInVisitorPass,
  checkOutVisitorPass,
  VisitorPassStatus
} from '@/lib/visitorStore';

export default function AdminVisitorControl() {
  // Checkpoint selector
  const [selectedCheckpoint, setSelectedCheckpoint] = useState('Sảnh Lễ Tân Tòa A (Sapphire)');

  // Input & Scanner modes: CAMERA | UPLOAD | PIN_SEARCH
  const [scanMode, setScanMode] = useState<'CAMERA' | 'UPLOAD' | 'PIN_SEARCH'>('CAMERA');

  // Camera State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Manual PIN / PassID search
  const [searchQuery, setSearchQuery] = useState('');

  // Current Scan / Verification Result
  const [scanResult, setScanResult] = useState<VerificationScanResult | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Visitor Passes List & Filtering
  const [passesList, setPassesList] = useState<GeneratedVisitorPass[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [tableSearch, setTableSearch] = useState('');

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const animationFrameId = useRef<number | null>(null);

  // Load passes from store
  const refreshPasses = () => {
    const list = getAllVisitorPasses();
    setPassesList([...list]);
  };

  useEffect(() => {
    refreshPasses();
  }, []);

  const showFeedback = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 3500);
  };

  // Perform QR / PIN Verification
  const handleVerify = (rawInput: string) => {
    if (!rawInput.trim() || isScanning) return;
    setIsScanning(true);

    setTimeout(() => {
      const result = verifyVisitorQr(rawInput.trim(), selectedCheckpoint);
      setScanResult(result);
      setIsScanning(false);
      refreshPasses();

      if (result.canEnter && result.scanResult === 'VALID') {
        showFeedback(`Xác thực thành công! Khách: ${result.visitor?.visitorName} • Chủ hộ: ${result.host?.hostName}`);
      }
    }, 200);
  };

  // Check-in Action
  const handleCheckIn = (passId: string) => {
    const updated = checkInVisitorPass(passId);
    if (updated) {
      showFeedback(`Đã xác nhận cho khách [${updated.visitorName}] vào chung cư!`);
      // Update current scan result
      if (scanResult && scanResult.visitor?.passId === passId) {
        setScanResult({
          ...scanResult,
          title: 'KHÁCH ĐÃ CHECK-IN (ĐANG Ở TRONG TÒA NHÀ)',
          visitor: {
            ...scanResult.visitor,
            status: 'CHECKED_IN',
            checkedInAt: updated.checkedInAt
          }
        });
      }
      refreshPasses();
    }
  };

  // Check-out Action
  const handleCheckOut = (passId: string) => {
    const updated = checkOutVisitorPass(passId);
    if (updated) {
      showFeedback(`Đã ghi nhận khách [${updated.visitorName}] rời chung cư!`);
      if (scanResult && scanResult.visitor?.passId === passId) {
        setScanResult({
          ...scanResult,
          title: 'KHÁCH ĐÃ RỜI ĐI (HOÀN TẤT THĂM CĂN HỘ)',
          visitor: {
            ...scanResult.visitor,
            status: 'COMPLETED',
            checkedOutAt: updated.checkedOutAt
          }
        });
      }
      refreshPasses();
    }
  };

  // Camera video frame scanner loop
  const scanVideoFrame = () => {
    if (!videoRef.current || !canvasRef.current || !isCameraActive) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data && !isScanning) {
        // Detected a QR code!
        handleVerify(code.data);
      }
    }

    animationFrameId.current = requestAnimationFrame(scanVideoFrame);
  };

  // Start Camera
  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraActive(true);
        animationFrameId.current = requestAnimationFrame(scanVideoFrame);
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError('Không thể mở camera. Vui lòng kiểm tra quyền truy cập camera trên trình duyệt hoặc sử dụng chế độ tải ảnh QR / tra cứu mã PIN.');
      setIsCameraActive(false);
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const toggleCamera = () => {
    if (isCameraActive) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Handle Upload Image
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code && code.data) {
          handleVerify(code.data);
        } else {
          handleVerify('INVALID_UNRECOGNIZED_IMAGE');
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Quick stats
  const totalPasses = passesList.length;
  const inBuildingCount = passesList.filter((p) => p.status === 'CHECKED_IN').length;
  const pendingCount = passesList.filter((p) => p.status === 'ACTIVE').length;
  const completedCount = passesList.filter((p) => p.status === 'COMPLETED').length;

  // Filtered passes for bottom table
  const filteredPasses = passesList.filter((p) => {
    if (filterStatus !== 'ALL' && p.status !== filterStatus) return false;
    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase().trim();
      const matchName = p.visitorName.toLowerCase().includes(q);
      const matchApt = p.apartmentCode.toLowerCase().includes(q);
      const matchHost = p.hostName.toLowerCase().includes(q);
      const matchPlate = (p.licensePlate || '').toLowerCase().includes(q);
      const matchPhone = (p.phoneNumber || '').toLowerCase().includes(q);
      const matchPin = p.pinCode.includes(q);
      return matchName || matchApt || matchHost || matchPlate || matchPhone || matchPin;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn select-none">
      
      {/* Toast Feedback */}
      {actionFeedback && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-[#161D26] border border-[#C5A880] text-[#C5A880] text-xs font-bold rounded-none shadow-2xl flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222B35] pb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#C5A880]" /> Ban Quản Lý Chung Cư • Bộ Phận Lễ Tân & An Ninh
          </div>
          <h2 className="font-serif text-2xl text-white font-bold mt-1">
            Quản Lý & Tiếp Đón Khách Thăm (Mã QR Do Chủ Hộ Cung Cấp)
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Quét mã QR hoặc tra cứu thông tin khách vào chung cư. Đối chiếu trực tiếp thông tin chủ hộ bảo lãnh và thông tin khách thăm đã điền.
          </p>
        </div>

        {/* Checkpoint selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-medium">Vị trí:</span>
          <select
            value={selectedCheckpoint}
            onChange={(e) => setSelectedCheckpoint(e.target.value)}
            className="bg-[#161B22] border border-[#2D3748] text-xs text-[#C5A880] font-semibold py-1.5 px-3 rounded-none outline-none cursor-pointer"
          >
            <option value="Sảnh Lễ Tân Tòa A (Sapphire)">Sảnh Lễ Tân Tòa A (Sapphire)</option>
            <option value="Sảnh Lễ Tân Tòa B (Diamond)">Sảnh Lễ Tân Tòa B (Diamond)</option>
            <option value="Chốt An Ninh Cổng Chính">Chốt An Ninh Cổng Chính</option>
            <option value="Chốt Bảo Vệ Hầm B1">Chốt Bảo Vệ Hầm B1</option>
          </select>
        </div>
      </div>

      {/* 4 Stat Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-3.5 bg-[#121820] border border-[#222B35] rounded-none space-y-1">
          <div className="text-[11px] text-gray-400 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[#C5A880]" /> Tổng Khách Được Cấp
          </div>
          <div className="text-xl font-bold font-mono text-white">{totalPasses}</div>
        </div>

        <div className="p-3.5 bg-[#121820] border border-[#222B35] rounded-none space-y-1">
          <div className="text-[11px] text-emerald-400 flex items-center gap-1.5">
            <LogIn className="w-3.5 h-3.5 text-emerald-400" /> Đang Trong Chung Cư
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400">{inBuildingCount}</div>
        </div>

        <div className="p-3.5 bg-[#121820] border border-[#222B35] rounded-none space-y-1">
          <div className="text-[11px] text-amber-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" /> Chờ Vào (Chưa Check-in)
          </div>
          <div className="text-xl font-bold font-mono text-amber-400">{pendingCount}</div>
        </div>

        <div className="p-3.5 bg-[#121820] border border-[#222B35] rounded-none space-y-1">
          <div className="text-[11px] text-gray-400 flex items-center gap-1.5">
            <LogOut className="w-3.5 h-3.5 text-gray-400" /> Đã Rời Đi (Check-out)
          </div>
          <div className="text-xl font-bold font-mono text-gray-300">{completedCount}</div>
        </div>
      </div>

      {/* Main Terminal: Left (Scanner/Lookup) & Right (Host & Visitor Verification Details) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Col (5 / 12): Quét & Tra Cứu Mã QR */}
        <div className="lg:col-span-5 space-y-4">
          
          <div className="p-4 bg-[#121820] border border-[#2D3748] rounded-none space-y-3.5 shadow-xl">
            
            {/* Mode Switcher */}
            <div className="flex items-center justify-between border-b border-[#222B35] pb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#C5A880] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" /> Phương Thức Tra Cứu
              </span>

              <div className="flex gap-1 bg-[#161B22] p-0.5 rounded-none border border-[#222B35] text-[11px]">
                <button
                  type="button"
                  onClick={() => setScanMode('CAMERA')}
                  className={`px-2.5 py-1 rounded-none transition-all cursor-pointer ${
                    scanMode === 'CAMERA' ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Camera
                </button>
                <button
                  type="button"
                  onClick={() => setScanMode('UPLOAD')}
                  className={`px-2.5 py-1 rounded-none transition-all cursor-pointer ${
                    scanMode === 'UPLOAD' ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Tải Ảnh
                </button>
                <button
                  type="button"
                  onClick={() => setScanMode('PIN_SEARCH')}
                  className={`px-2.5 py-1 rounded-none transition-all cursor-pointer ${
                    scanMode === 'PIN_SEARCH' ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Nhập PIN
                </button>
              </div>
            </div>

            {/* Hidden Canvas for QR frame processing */}
            <canvas ref={canvasRef} className="hidden" />

            {/* MODE 1: LIVE CAMERA SCANNER */}
            {scanMode === 'CAMERA' && (
              <div className="space-y-3">
                <div className="relative w-full h-64 bg-[#090D12] border-2 border-dashed border-[#2D3748] rounded-none overflow-hidden flex items-center justify-center shadow-inner">
                  {isCameraActive ? (
                    <>
                      <video
                        ref={videoRef}
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      {/* Targeting box */}
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="relative w-48 h-48 border-2 border-emerald-400/80 rounded-none shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                          <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-emerald-400"></div>
                          <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-emerald-400"></div>
                          <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-emerald-400"></div>
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-emerald-400"></div>
                          <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent absolute top-0 animate-[bounce_2.2s_infinite]"></div>
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-black/80 rounded-none text-[9.5px] text-emerald-300 font-mono whitespace-nowrap">
                            Đang quét mã QR khách...
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center space-y-2.5 p-4">
                      <div className="w-12 h-12 mx-auto rounded-none bg-[#161D26] border border-[#2D3748] flex items-center justify-center text-[#C5A880]">
                        <CameraOff className="w-6 h-6" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="font-bold text-white text-xs">Camera Đang Tắt</div>
                        <p className="text-[11px] text-gray-400 max-w-xs">
                          Bật camera để quét trực tiếp mã QR trên điện thoại của khách thăm khi đến sảnh.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={startCamera}
                        className="px-4 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold rounded-none shadow transition-all flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" /> Bật Camera Quét Mã
                      </button>
                    </div>
                  )}

                  {isScanning && (
                    <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center text-white z-20 animate-fadeIn">
                      <div className="text-center space-y-1.5">
                        <RefreshCw className="w-6 h-6 text-[#C5A880] animate-spin mx-auto" />
                        <div className="text-xs font-bold text-[#C5A880]">Đang Đối Chiếu Thông Tin...</div>
                      </div>
                    </div>
                  )}
                </div>

                {cameraError && (
                  <div className="p-2.5 bg-rose-950/80 border border-rose-500 rounded-none text-xs text-rose-200 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{cameraError}</span>
                  </div>
                )}

                {isCameraActive && (
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="w-full py-2 bg-rose-950/80 hover:bg-rose-900 border border-rose-600 text-rose-300 text-xs font-bold rounded-none flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <CameraOff className="w-3.5 h-3.5" /> Dừng Camera
                  </button>
                )}
              </div>
            )}

            {/* MODE 2: UPLOAD QR IMAGE */}
            {scanMode === 'UPLOAD' && (
              <div className="space-y-3">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-56 bg-[#090D12] border-2 border-dashed border-[#2D3748] hover:border-[#C5A880] rounded-none flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-colors group"
                >
                  <div className="w-12 h-12 rounded-none bg-[#161D26] border border-[#2D3748] group-hover:border-[#C5A880] flex items-center justify-center text-[#C5A880] mb-2">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="font-bold text-white text-xs">Nhấn Để Tải Ảnh Mã QR Lên</div>
                  <p className="text-[11px] text-gray-400 mt-1 max-w-xs">
                    Hỗ trợ ảnh chụp màn hình thư mời Zalo, Messenger hoặc file ảnh thẻ mời do chủ hộ gửi.
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>
            )}

            {/* MODE 3: MANUAL PIN / PASS ID SEARCH */}
            <div className="pt-1 border-t border-[#222B35]">
              <label className="text-[11px] text-gray-400 font-medium block mb-1">
                Hoặc Nhập Nhanh Mã PIN (6 số) / Mã Vé Đón Khách:
              </label>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (searchQuery.trim()) {
                    handleVerify(searchQuery.trim());
                  }
                }}
                className="flex gap-2"
              >
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="VD: 849201 hoặc SKY-PASS-..."
                    className="w-full bg-[#161B22] border border-[#2D3748] rounded-none px-3 py-2 text-xs text-white placeholder-gray-500 font-mono focus:border-[#C5A880] outline-none pl-8"
                  />
                  <KeyRound className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2.5" />
                </div>
                <button
                  type="submit"
                  disabled={!searchQuery.trim() || isScanning}
                  className="px-4 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold rounded-none flex items-center gap-1 transition-all disabled:opacity-50 cursor-pointer shrink-0"
                >
                  <Search className="w-3.5 h-3.5" /> Tra Cứu
                </button>
              </form>
            </div>

          </div>

        </div>

        {/* Right Col (7 / 12): Hiển Thị Thông Tin Chủ Hộ & Khách Thăm */}
        <div className="lg:col-span-7 space-y-4">
          
          {scanResult ? (
            <div className="p-5 bg-[#121820] border border-[#2D3748] rounded-none space-y-4 shadow-xl animate-fadeIn">
              
              {/* Status Header Banner */}
              <div className={`p-4 rounded-none border flex items-start justify-between gap-3 ${
                scanResult.canEnter && scanResult.scanResult === 'VALID'
                  ? scanResult.visitor?.status === 'CHECKED_IN'
                    ? 'bg-amber-950/50 border-amber-500/80 text-amber-200'
                    : 'bg-emerald-950/60 border-emerald-500/80 text-emerald-200'
                  : scanResult.scanResult === 'EXPIRED'
                  ? 'bg-rose-950/60 border-rose-500/80 text-rose-200'
                  : 'bg-rose-950/70 border-rose-600 text-rose-200'
              }`}>
                <div className="flex items-start gap-3">
                  {scanResult.canEnter && scanResult.scanResult === 'VALID' ? (
                    scanResult.visitor?.status === 'CHECKED_IN' ? (
                      <Clock className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                    )
                  ) : (
                    <XCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
                  )}

                  <div className="space-y-0.5">
                    <div className="font-bold text-sm text-white">{scanResult.title}</div>
                    <div className="text-xs text-gray-300 leading-relaxed">{scanResult.message}</div>
                    <div className="text-[10.5px] text-gray-400 pt-1 font-mono">
                      Quét lúc: {scanResult.scannedAt} • {scanResult.checkpoint}
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-none border font-mono ${
                    scanResult.canEnter && scanResult.scanResult === 'VALID'
                      ? scanResult.visitor?.status === 'CHECKED_IN'
                        ? 'bg-amber-900 text-amber-300 border-amber-500'
                        : 'bg-emerald-900 text-emerald-300 border-emerald-500'
                      : 'bg-rose-900 text-rose-300 border-rose-500'
                  }`}>
                    {scanResult.visitor?.status === 'CHECKED_IN'
                      ? 'Đang Ở Trong'
                      : scanResult.scanResult === 'VALID'
                      ? 'Hợp Lệ'
                      : 'Không Hợp Lệ'}
                  </span>
                </div>
              </div>

              {/* 2 Detailed Panels: Host Info vs Visitor Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* 1. THÔNG TIN CHỦ HỘ BẢO LÃNH */}
                <div className="p-4 bg-[#161D26] border border-[#2D3748] rounded-none space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#C5A880] flex items-center justify-between border-b border-[#222B35] pb-2">
                    <span className="flex items-center gap-1.5">
                      <Home className="w-3.5 h-3.5 text-[#C5A880]" /> Thông Tin Chủ Hộ
                    </span>
                    <span className="text-[9.5px] bg-[#1C2533] px-1.5 py-0.5 rounded-none text-emerald-400 font-mono">
                      Bảo Lãnh
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <div className="text-gray-400 text-[10.5px]">Họ Tên Chủ Hộ / Người Cấp:</div>
                      <div className="font-bold text-white text-sm">
                        {scanResult.host?.hostName || 'Chưa xác định'}
                      </div>
                    </div>

                    <div>
                      <div className="text-gray-400 text-[10.5px]">Căn Hộ Điểm Đến:</div>
                      <div className="font-bold text-[#C5A880] text-sm flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>Căn {scanResult.host?.apartmentCode}</span>
                        <span className="text-xs text-gray-300 font-normal">
                          ({scanResult.host?.towerName})
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="text-gray-400 text-[10.5px]">Số Điện Thoại Chủ Hộ:</div>
                      <div className="font-mono text-gray-200 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-gray-400" />
                        <span>{scanResult.host?.hostPhone || 'Đã liên kết hệ thống'}</span>
                      </div>
                    </div>

                    <div className="pt-1 text-[10.5px] text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Tư cách cư trú: Hợp pháp • Đã duyệt e-KYC</span>
                    </div>
                  </div>
                </div>

                {/* 2. THÔNG TIN KHÁCH THĂM */}
                <div className="p-4 bg-[#161D26] border border-[#2D3748] rounded-none space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#C5A880] flex items-center justify-between border-b border-[#222B35] pb-2">
                    <span className="flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-[#C5A880]" /> Thông Tin Khách Thăm
                    </span>
                    <span className="text-[9.5px] bg-[#1C2533] px-1.5 py-0.5 rounded-none text-cyan-400 font-mono">
                      Khách Vào
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <div className="text-gray-400 text-[10.5px]">Họ Tên Khách Thăm:</div>
                      <div className="font-bold text-white text-sm">
                        {scanResult.visitor?.visitorName || 'Khách Thăm'}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-gray-400 text-[10.5px]">Số Điện Thoại:</div>
                        <div className="font-mono text-gray-200">
                          {scanResult.visitor?.phoneNumber || 'Không có'}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-[10.5px]">Biển Số Xe:</div>
                        <div className="font-mono font-bold text-[#C5A880]">
                          {scanResult.visitor?.licensePlate || 'Đi bộ / Taxi'}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-gray-400 text-[10.5px]">Thời Hạn Hiệu Lực Thẻ:</div>
                      <div className="text-emerald-400 font-medium text-[11px] flex items-center gap-1">
                        <Clock className="w-3 h-3 shrink-0" />
                        <span>
                          Đến {scanResult.visitor?.validUntil ? new Date(scanResult.visitor.validUntil).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 'Hôm nay'}{' '}
                          ({scanResult.visitor?.validHours || 4} giờ)
                        </span>
                      </div>
                    </div>

                    <div className="pt-1 flex items-center justify-between text-[10.5px] text-gray-400 font-mono">
                      <span>Mã PIN: <strong className="text-[#C5A880]">{scanResult.visitor?.pinCode}</strong></span>
                      <span>Mã vé: {scanResult.visitor?.passId}</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Action Operations: Check-in / Check-out */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#222B35]">
                <div className="text-xs text-gray-400">
                  Thao tác nhân viên lễ tân / an ninh:
                </div>

                <div className="flex items-center gap-2">
                  {/* If valid and not checked in yet */}
                  {scanResult.canEnter && scanResult.visitor && scanResult.visitor.status === 'ACTIVE' && (
                    <button
                      type="button"
                      onClick={() => handleCheckIn(scanResult.visitor!.passId)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-none shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <LogIn className="w-4 h-4" /> Xác Nhận Cho Khách Vào (Check-in)
                    </button>
                  )}

                  {/* If already in building */}
                  {scanResult.visitor && scanResult.visitor.status === 'CHECKED_IN' && (
                    <button
                      type="button"
                      onClick={() => handleCheckOut(scanResult.visitor!.passId)}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-none shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" /> Xác Nhận Khách Rời Đi (Check-out)
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setScanResult(null);
                      setSearchQuery('');
                    }}
                    className="px-3.5 py-2 bg-[#161B22] hover:bg-[#1E2530] text-gray-300 text-xs font-medium rounded-none border border-[#2D3748] transition-colors cursor-pointer"
                  >
                    Tiếp Đón Lượt Mới
                  </button>
                </div>
              </div>

            </div>
          ) : (
            /* Placeholder when no pass scanned */
            <div className="p-8 bg-[#121820] border border-dashed border-[#2D3748] rounded-none flex flex-col items-center justify-center text-center min-h-[340px] space-y-3 shadow-inner">
              <div className="w-16 h-16 rounded-none bg-[#161D26] border border-[#2D3748] flex items-center justify-center text-[#C5A880]/70">
                <FileText className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <div className="font-serif font-bold text-white text-base">Chưa Có Dữ Liệu Khách Được Quét</div>
                <p className="text-xs text-gray-400 max-w-sm leading-relaxed">
                  Vui lòng đưa mã QR thẻ mời của khách vào vùng quét camera hoặc nhập mã PIN 6 số bên trái. Hệ thống sẽ lập tức hiển thị thông tin đối chiếu của chủ hộ và khách thăm.
                </p>
              </div>
              <div className="text-[11px] text-gray-500 flex items-center gap-1.5 pt-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Hệ thống bảo mật thông tin cư dân theo quy chuẩn tòa nhà
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Bottom Section: Danh Sách & Lịch Sử Quản Lý Khách Thăm */}
      <div className="p-5 bg-[#121820] border border-[#222B35] rounded-none space-y-4 shadow-xl">
        
        {/* Table Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222B35] pb-3">
          <div>
            <h3 className="font-serif text-base font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-[#C5A880]" />
              Danh Sách Khách Thăm Do Chủ Hộ Phát Hành Mã
            </h3>
            <div className="text-[11px] text-gray-400">
              Quản lý toàn bộ khách ra vào chung cư theo mã QR được chủ hộ căn hộ bảo lãnh.
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Tìm khách, căn hộ, biển số..."
                className="bg-[#161B22] border border-[#2D3748] text-xs text-white placeholder-gray-500 rounded-none pl-8 pr-3 py-1.5 w-52 focus:border-[#C5A880] outline-none"
              />
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2" />
            </div>

            {/* Refresh */}
            <button
              type="button"
              onClick={refreshPasses}
              className="p-1.5 bg-[#161B22] hover:bg-[#1E2530] text-gray-300 hover:text-[#C5A880] border border-[#2D3748] rounded-none transition-colors cursor-pointer"
              title="Làm mới danh sách"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'ALL', label: 'Tất Cả Khách' },
            { id: 'CHECKED_IN', label: 'Đang Ở Trong Tòa Nhà' },
            { id: 'ACTIVE', label: 'Chờ Check-in' },
            { id: 'COMPLETED', label: 'Đã Rời Đi' },
            { id: 'EXPIRED', label: 'Quá Hạn' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-none text-xs font-medium transition-all cursor-pointer shrink-0 border ${
                filterStatus === tab.id
                  ? 'bg-[#C5A880] text-[#0D1117] font-bold border-[#C5A880]'
                  : 'bg-[#161B22] text-gray-400 hover:text-white border-[#2D3748]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Passes Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-[#161D26] text-gray-400 uppercase text-[10px] tracking-wider border-y border-[#222B35]">
              <tr>
                <th className="py-3 px-3">Mã Vé / Giờ Cấp</th>
                <th className="py-3 px-3">Khách Thăm</th>
                <th className="py-3 px-3">Chủ Hộ Bảo Lãnh</th>
                <th className="py-3 px-3">Căn Hộ / Điểm Đến</th>
                <th className="py-3 px-3">Thời Hạn Hiệu Lực</th>
                <th className="py-3 px-3">Trạng Thái</th>
                <th className="py-3 px-3 text-right">Thao Tác Lễ Tân</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222B35]">
              {filteredPasses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500 text-xs">
                    Chưa có dữ liệu khách trong bộ lọc này. Khi cư dân tạo mã đón khách, thông tin sẽ được ghi nhận tự động tại đây.
                  </td>
                </tr>
              ) : (
                filteredPasses.map((pass) => (
                  <tr key={pass.id} className="hover:bg-[#161B22]/70 transition-colors">
                    
                    {/* Mã vé & giờ cấp */}
                    <td className="py-3 px-3">
                      <div className="font-mono font-bold text-white">{pass.id}</div>
                      <div className="text-[10px] text-gray-400 font-mono">
                        PIN: <span className="text-[#C5A880]">{pass.pinCode}</span>
                      </div>
                    </td>

                    {/* Khách thăm */}
                    <td className="py-3 px-3">
                      <div className="font-bold text-white text-xs">{pass.visitorName}</div>
                      <div className="text-[10.5px] text-gray-400">
                        {pass.phoneNumber ? `SĐT: ${pass.phoneNumber}` : 'Không có SĐT'}
                        {pass.licensePlate && ` • Xe: ${pass.licensePlate}`}
                      </div>
                    </td>

                    {/* Chủ hộ bảo lãnh */}
                    <td className="py-3 px-3">
                      <div className="font-medium text-white">{pass.hostName}</div>
                      <div className="text-[10px] text-gray-400 font-mono">
                        {pass.hostPhone || 'Chủ hộ'}
                      </div>
                    </td>

                    {/* Căn hộ */}
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 bg-[#1C2533] border border-[#2D3748] rounded-none text-[#C5A880] font-bold font-mono">
                        Căn {pass.apartmentCode}
                      </span>
                      <div className="text-[10px] text-gray-400 mt-0.5">
                        {pass.towerName || (pass.apartmentCode.includes('A') ? 'Tòa A' : 'Tòa B')}
                      </div>
                    </td>

                    {/* Thời hạn hiệu lực */}
                    <td className="py-3 px-3 text-[11px]">
                      <div className="text-gray-200">
                        Đến {new Date(pass.validUntil).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {new Date(pass.validUntil).toLocaleDateString('vi-VN')} ({pass.validHours}h)
                      </div>
                    </td>

                    {/* Trạng thái */}
                    <td className="py-3 px-3">
                      {pass.status === 'CHECKED_IN' ? (
                        <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-500 rounded-none text-[10px] font-bold">
                          Đang Trong Chung Cư
                        </span>
                      ) : pass.status === 'ACTIVE' ? (
                        <span className="px-2 py-0.5 bg-amber-950 text-amber-300 border border-amber-500 rounded-none text-[10px] font-bold">
                          Chờ Check-in
                        </span>
                      ) : pass.status === 'COMPLETED' ? (
                        <span className="px-2 py-0.5 bg-gray-800 text-gray-300 border border-gray-600 rounded-none text-[10px] font-medium">
                          Đã Rời Đi
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-rose-950 text-rose-300 border border-rose-600 rounded-none text-[10px] font-bold">
                          Quá Hạn
                        </span>
                      )}
                    </td>

                    {/* Thao tác */}
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleVerify(pass.id)}
                          className="px-2.5 py-1 bg-[#161B22] hover:bg-[#1E2530] text-gray-300 hover:text-white border border-[#2D3748] rounded-none text-[10.5px] transition-colors cursor-pointer"
                        >
                          Chi Tiết
                        </button>

                        {pass.status === 'ACTIVE' && (
                          <button
                            type="button"
                            onClick={() => handleCheckIn(pass.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-none text-[10.5px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <LogIn className="w-3 h-3" /> Vào
                          </button>
                        )}

                        {pass.status === 'CHECKED_IN' && (
                          <button
                            type="button"
                            onClick={() => handleCheckOut(pass.id)}
                            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-none text-[10.5px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <LogOut className="w-3 h-3" /> Ra
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
