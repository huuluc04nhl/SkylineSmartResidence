'use client';

import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { 
  Camera, 
  CameraOff, 
  ShieldCheck, 
  ShieldAlert, 
  Sparkles, 
  Activity, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Upload, 
  Zap, 
  Lock, 
  Unlock, 
  Building2, 
  Bell, 
  Volume2, 
  VolumeX, 
  Smartphone, 
  Check, 
  Eye, 
  ArrowUpRight, 
  Radio, 
  Cpu, 
  Layers
} from 'lucide-react';
import { 
  verifyVisitorQr, 
  VerificationScanResult, 
  getGateAuditLogs, 
  GateAuditLog,
  ResidentArrivalAlert
} from '@/lib/visitorStore';

export default function AdminVisitorControl() {
  // Checkpoint selector
  const [selectedCheckpoint, setSelectedCheckpoint] = useState('Sảnh A (Sapphire) - Camera AI 01');

  // Camera State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isProcessingAi, setIsProcessingAi] = useState(false);
  const [aiVoiceEnabled, setAiVoiceEnabled] = useState(true);

  // Scan & Workflow Results
  const [scanResult, setScanResult] = useState<VerificationScanResult | null>(null);
  const [activeResidentAlert, setActiveResidentAlert] = useState<ResidentArrivalAlert | null>(null);
  const [activeElevatorCabin, setActiveElevatorCabin] = useState<string | null>(null);
  const [activeTargetFloor, setActiveTargetFloor] = useState<string | null>(null);
  const [gateStatus, setGateStatus] = useState<'IDLE' | 'UNLOCKED' | 'ALARM'>('IDLE');

  // Manual / Demo Input
  const [customQrInput, setCustomQrInput] = useState('');
  const [filterResult, setFilterResult] = useState<'ALL' | 'VALID' | 'INVALID' | 'EXPIRED'>('ALL');
  const [scanHistory, setScanHistory] = useState<GateAuditLog[]>([]);

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const animationFrameId = useRef<number | null>(null);

  // Load audit logs
  const refreshLogs = () => {
    setScanHistory([...getGateAuditLogs()]);
  };

  useEffect(() => {
    refreshLogs();
  }, []);

  // Speak AI Announcement
  const speakAiGreeting = (message: string) => {
    if (!aiVoiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = 'vi-VN';
      utterance.rate = 1.0;
      utterance.pitch = 1.05;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      // Speech synthesis fallback
    }
  };

  // Automated AI Verification Pipeline
  const runAiVerification = (qrRawData: string) => {
    if (!qrRawData || isProcessingAi) return;
    setIsProcessingAi(true);

    setTimeout(() => {
      const result = verifyVisitorQr(qrRawData, selectedCheckpoint);
      setScanResult(result);
      setIsProcessingAi(false);

      if (result.canEnter && result.scanResult === 'VALID') {
        setGateStatus('UNLOCKED');
        setActiveElevatorCabin(result.elevatorCabin || 'Cabin 02 (Sảnh A)');
        setActiveTargetFloor(result.targetFloor || 'Tầng 12');
        if (result.residentPushAlert) {
          setActiveResidentAlert(result.residentPushAlert);
        }

        speakAiGreeting(`Skyline Smart Residence kính chào Quý khách lên ${result.targetFloor || 'Căn hộ'}`);

        // Reset gate to idle after 6 seconds
        setTimeout(() => {
          setGateStatus('IDLE');
        }, 6000);
      } else if (result.scanResult === 'EXPIRED') {
        setGateStatus('IDLE');
        setActiveElevatorCabin(null);
        setActiveTargetFloor(null);
        speakAiGreeting('Mã ra vào đã quá thời gian hiệu lực');
      } else {
        setGateStatus('ALARM');
        setActiveElevatorCabin(null);
        setActiveTargetFloor(null);
        speakAiGreeting('Cảnh báo. Mã ra vào không hợp lệ');

        setTimeout(() => {
          setGateStatus('IDLE');
        }, 5000);
      }

      refreshLogs();
    }, 350);
  };

  // Continuous Camera QR Frame Scanning Loop
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

      if (code && code.data && !isProcessingAi) {
        // Detected a QR code in the camera frame!
        runAiVerification(code.data);
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
      setCameraError('Không thể mở camera. Vui lòng cấp quyền truy cập camera trên trình duyệt hoặc sử dụng chế độ quét ảnh/mô phỏng.');
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

  // Toggle Camera
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

  // Upload QR Image to scan
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
          runAiVerification(code.data);
        } else {
          runAiVerification('INVALID_UNKNOWN_QR_SKYLINE_999999');
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const filteredLogs = scanHistory.filter((l) => {
    if (filterResult === 'ALL') return true;
    return l.result === filterResult;
  });

  return (
    <div className="space-y-6 animate-fadeIn select-none">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222B35] pb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-semibold flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-[#C5A880]" /> Hệ Thống Quản Lý Ra Vào Thông Minh • Skyline AI Vision
          </div>
          <h2 className="font-serif text-2xl text-white font-bold mt-1">
            Trạm Giám Sát Camera AI & Quét Mã Khách Tự Động
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Quy trình tự động hóa 100%: Camera AI quét mã QR, tự động mở cổng sảnh, điều phối cabin thang máy và gửi thông báo tức thì cho cư dân.
          </p>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Audio Voice Synthesizer Toggle */}
          <button
            type="button"
            onClick={() => setAiVoiceEnabled(!aiVoiceEnabled)}
            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
              aiVoiceEnabled 
                ? 'bg-[#1C2533] border-[#C5A880] text-[#C5A880]' 
                : 'bg-[#161B22] border-gray-700 text-gray-400'
            }`}
            title="Bật/Tắt âm thanh AI hướng dẫn khách"
          >
            {aiVoiceEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
            <span>Giọng Nói AI</span>
          </button>

          {/* Gate status indicator */}
          <div className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 border shadow-lg ${
            gateStatus === 'UNLOCKED'
              ? 'bg-emerald-950 text-emerald-300 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
              : gateStatus === 'ALARM'
              ? 'bg-rose-950 text-rose-300 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)] animate-pulse'
              : 'bg-[#121820] text-gray-400 border-gray-700'
          }`}>
            {gateStatus === 'UNLOCKED' ? (
              <>
                <Unlock className="w-4 h-4 text-emerald-400" />
                <span>CỔNG: ĐÃ MỞ TỰ ĐỘNG</span>
              </>
            ) : gateStatus === 'ALARM' ? (
              <>
                <Lock className="w-4 h-4 text-rose-400" />
                <span>CỔNG: KHÓA BÁO ĐỘNG</span>
              </>
            ) : (
              <>
                <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span>AI GATEWAY: SẴN SÀNG</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Live Camera AI Vision & Verification Pipeline */}
        <div className="lg:col-span-2 space-y-5">
          
          {/* 1. Camera AI Live Scanner Card */}
          <div className="p-5 bg-gradient-to-r from-[#121820] to-[#161D26] border border-[#C5A880]/70 rounded-xl space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222B35] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#1C2533] border border-[#C5A880]/40 rounded-lg">
                  <Camera className="w-5 h-5 text-[#C5A880]" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-bold text-white flex items-center gap-2">
                    Camera AI Vision Quét Tự Động
                    <span className="px-2 py-0.5 text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-600 rounded font-mono font-normal">
                      Auto-Detect
                    </span>
                  </h3>
                  <div className="text-[11px] text-gray-400">
                    Tự động nhận diện mã QR trong luồng video thời gian thực (&lt;0.3s)
                  </div>
                </div>
              </div>

              {/* Checkpoint selector */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-400">Trạm:</span>
                <select
                  value={selectedCheckpoint}
                  onChange={(e) => setSelectedCheckpoint(e.target.value)}
                  className="bg-[#161B22] border border-[#2D3748] text-xs text-[#C5A880] font-semibold py-1.5 px-3 rounded-lg outline-none cursor-pointer"
                >
                  <option value="Sảnh A (Sapphire) - Camera AI 01">Sảnh A (Sapphire) • Camera AI 01</option>
                  <option value="Sảnh B (Diamond) - Camera AI 02">Sảnh B (Diamond) • Camera AI 02</option>
                  <option value="Cổng Hầm B1 - Camera ALPR Xe">Cổng Hầm B1 • Camera ALPR Xe</option>
                </select>
              </div>
            </div>

            {/* Video Viewfinder Container */}
            <div className="relative w-full h-72 sm:h-80 bg-[#090D12] border-2 border-dashed border-[#2D3748] rounded-xl overflow-hidden flex items-center justify-center group shadow-inner">
              
              {/* Hidden Canvas for QR frame processing */}
              <canvas ref={canvasRef} className="hidden" />

              {isCameraActive ? (
                <>
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />

                  {/* AI Vision Reticle & Targeting Box */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="relative w-56 h-56 border-2 border-emerald-400/80 rounded-2xl shadow-[0_0_25px_rgba(16,185,129,0.3)]">
                      {/* Corner Targeting Accents */}
                      <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-emerald-400"></div>
                      <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-emerald-400"></div>
                      <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-emerald-400"></div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-emerald-400"></div>

                      {/* Animated Scan Line */}
                      <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent absolute top-0 animate-[bounce_2.5s_infinite]"></div>

                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-black/80 backdrop-blur rounded text-[10px] text-emerald-300 font-mono flex items-center gap-1 border border-emerald-500/30 whitespace-nowrap">
                        <Sparkles className="w-3 h-3 text-emerald-400" /> AI Đang Quét Khung Hình...
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center space-y-3 p-6">
                  <div className="w-14 h-14 mx-auto rounded-full bg-[#161D26] border border-[#2D3748] flex items-center justify-center text-[#C5A880]">
                    <CameraOff className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <div className="font-serif font-bold text-white text-base">Camera AI Đang Tắt</div>
                    <p className="text-xs text-gray-400 max-w-sm mx-auto">
                      Bật Camera để trải nghiệm quét mã QR tự động qua video stream thực tế, hoặc tải ảnh mã lên bên dưới.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-5 py-2.5 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider rounded-lg shadow-lg transition-all flex items-center justify-center gap-2 mx-auto cursor-pointer"
                  >
                    <Camera className="w-4 h-4" /> Bật Camera AI Quét Trực Tiếp
                  </button>
                </div>
              )}

              {/* Processing Overlay */}
              {isProcessingAi && (
                <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center text-white z-20 animate-fadeIn">
                  <div className="text-center space-y-2">
                    <RefreshCw className="w-8 h-8 text-[#C5A880] animate-spin mx-auto" />
                    <div className="font-serif text-sm font-bold text-[#C5A880]">AI Đang Phân Tích Chữ Ký Số...</div>
                    <div className="text-[11px] text-gray-300 font-mono">Giải mã token & kiểm tra hạn giờ</div>
                  </div>
                </div>
              )}
            </div>

            {cameraError && (
              <div className="p-3 bg-rose-950/80 border border-rose-500 rounded-lg text-xs text-rose-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{cameraError}</span>
              </div>
            )}

            {/* Camera Actions & Alternative Upload */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleCamera}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                    isCameraActive 
                      ? 'bg-rose-950/80 border-rose-600 text-rose-300 hover:bg-rose-900' 
                      : 'bg-[#1C2533] border-gray-700 text-gray-300 hover:text-white'
                  }`}
                >
                  {isCameraActive ? <CameraOff className="w-3.5 h-3.5" /> : <Camera className="w-3.5 h-3.5" />}
                  <span>{isCameraActive ? 'Dừng Camera' : 'Mở Camera AI'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2 bg-[#161B22] hover:bg-[#1E2530] border border-gray-700 text-gray-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-[#C5A880]" />
                  <span>Tải Ảnh Mã QR</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>

              {/* 3 Quick-Action AI Scenarios for Testing without camera */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => runAiVerification('SKYLINE_PASS_VALID_12A05_101')}
                  disabled={isProcessingAi}
                  className="px-2.5 py-1.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-600 text-emerald-300 text-[11px] font-bold rounded flex items-center gap-1 transition-all cursor-pointer"
                  title="Mô phỏng khách quét mã hợp lệ"
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Demo: Mã Hợp Lệ
                </button>

                <button
                  type="button"
                  onClick={() => runAiVerification('EXP_VISITOR_EXPIRED_MOCK_DATA')}
                  disabled={isProcessingAi}
                  className="px-2.5 py-1.5 bg-amber-950 hover:bg-amber-900 border border-amber-600 text-amber-300 text-[11px] font-bold rounded flex items-center gap-1 transition-all cursor-pointer"
                  title="Mô phỏng khách quét mã quá hạn"
                >
                  <AlertTriangle className="w-3 h-3 text-amber-400" /> Mã Hết Hạn
                </button>

                <button
                  type="button"
                  onClick={() => runAiVerification('INVALID_UNKNOWN_QR_SKYLINE_999999')}
                  disabled={isProcessingAi}
                  className="px-2.5 py-1.5 bg-rose-950 hover:bg-rose-900 border border-rose-600 text-rose-300 text-[11px] font-bold rounded flex items-center gap-1 transition-all cursor-pointer"
                  title="Mô phỏng mã không đúng quy chuẩn"
                >
                  <XCircle className="w-3 h-3 text-rose-400" /> Mã Giả Mạo
                </button>
              </div>
            </div>
          </div>

          {/* 2. Automated AI Interlock Workflow Output */}
          {scanResult && (
            <div className="p-5 bg-[#121820] border border-[#222B35] rounded-xl space-y-4 shadow-xl animate-fadeIn">
              <div className="flex items-center justify-between border-b border-[#222B35] pb-2.5">
                <div className="text-xs font-bold uppercase tracking-wider text-[#C5A880] flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#C5A880]" /> Kết Quả Điều Phối Tự Động Của AI
                </div>
                <span className="text-[11px] text-gray-400 font-mono">
                  Quét lúc: {scanResult.scannedAt}
                </span>
              </div>

              {/* Status Banner */}
              <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${
                scanResult.canEnter && scanResult.scanResult === 'VALID'
                  ? 'bg-emerald-950/70 border-emerald-500 text-emerald-200'
                  : scanResult.scanResult === 'EXPIRED'
                  ? 'bg-amber-950/70 border-amber-500 text-amber-200'
                  : 'bg-rose-950/70 border-rose-500 text-rose-200'
              }`}>
                {scanResult.canEnter && scanResult.scanResult === 'VALID' ? (
                  <CheckCircle2 className="w-7 h-7 text-emerald-400 shrink-0" />
                ) : scanResult.scanResult === 'EXPIRED' ? (
                  <AlertTriangle className="w-7 h-7 text-amber-400 shrink-0" />
                ) : (
                  <XCircle className="w-7 h-7 text-rose-400 shrink-0" />
                )}

                <div className="space-y-1 text-xs flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm sm:text-base text-white">{scanResult.title}</span>
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${
                      scanResult.canEnter && scanResult.scanResult === 'VALID'
                        ? 'bg-emerald-900 text-emerald-300 border-emerald-500'
                        : 'bg-rose-900 text-rose-300 border-rose-500'
                    }`}>
                      {scanResult.scanResult === 'VALID' ? 'Tự Động Mở Cổng' : 'Từ Chối Vào'}
                    </span>
                  </div>
                  <div className="text-gray-300 text-xs leading-relaxed">{scanResult.message}</div>
                  {scanResult.apartmentCode && (
                    <div className="text-[11px] text-[#C5A880] font-semibold pt-0.5">
                      • Căn hộ bảo lãnh: <strong>Căn {scanResult.apartmentCode}</strong> • Lệnh điều khiển: <strong>{scanResult.gateAction}</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* 3 Interlock Actions (When VALID) */}
              {scanResult.canEnter && scanResult.scanResult === 'VALID' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  
                  {/* Step 1: Cổng Sảnh */}
                  <div className="p-3.5 bg-[#161D26] border border-emerald-500/50 rounded-xl space-y-1.5 shadow-sm">
                    <div className="text-[10.5px] uppercase font-bold text-emerald-400 flex items-center gap-1.5">
                      <Unlock className="w-3.5 h-3.5" /> 1. Cổng Flap Barrier
                    </div>
                    <div className="font-bold text-white text-xs">Mở Tự Động (0.28s)</div>
                    <p className="text-[10px] text-gray-400">
                      Giao thức IoT gửi lệnh mở cánh cổng sảnh, đèn LED chuyển xanh đón khách.
                    </p>
                  </div>

                  {/* Step 2: Thang Máy */}
                  <div className="p-3.5 bg-[#161D26] border border-[#C5A880]/60 rounded-xl space-y-1.5 shadow-sm">
                    <div className="text-[10.5px] uppercase font-bold text-[#C5A880] flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" /> 2. Phân Quyền Thang Máy
                    </div>
                    <div className="font-bold text-white text-xs">
                      {activeElevatorCabin || 'Cabin 02'} ➔ {activeTargetFloor || 'Tầng 12'}
                    </div>
                    <p className="text-[10px] text-gray-400">
                      Thang máy tự động gọi xuống sảnh và chỉ sáng nút đúng tầng của căn hộ.
                    </p>
                  </div>

                  {/* Step 3: Thông Báo Cư Dân */}
                  <div className="p-3.5 bg-[#161D26] border border-cyan-500/50 rounded-xl space-y-1.5 shadow-sm">
                    <div className="text-[10.5px] uppercase font-bold text-cyan-400 flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5" /> 3. Push Notification
                    </div>
                    <div className="font-bold text-white text-xs">Báo Về Căn {scanResult.apartmentCode}</div>
                    <p className="text-[10px] text-gray-400">
                      Điện thoại cư dân rung chuông báo khách đã tới sảnh và đang lên tầng.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. Simulated Resident Mobile Notification Banner */}
          {activeResidentAlert && (
            <div className="p-4 bg-gradient-to-r from-[#142333] to-[#121820] border border-cyan-500/70 rounded-xl space-y-2 shadow-xl animate-fadeIn">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-cyan-300 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                  <Smartphone className="w-4 h-4 text-cyan-400 animate-bounce" /> Mô Phỏng Thông Báo Trên Điện Thoại Cư Dân
                </span>
                <span className="px-2 py-0.5 bg-cyan-950 text-cyan-300 text-[10px] font-mono rounded border border-cyan-700">
                  WebSocket Delivered
                </span>
              </div>

              <div className="p-3 bg-[#0E1722] border border-cyan-500/30 rounded-lg space-y-1">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-[#C5A880]" /> Skyline Smart Residence • Thông Báo Khách Tới
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono">{activeResidentAlert.time}</span>
                </div>
                <p className="text-xs text-gray-200 leading-relaxed">
                  {activeResidentAlert.message}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Col: Smart Elevator Status & AI Audit Stream */}
        <div className="space-y-5">
          
          {/* Smart Elevator Destination Control Status */}
          <div className="bg-[#121820] border border-[#222B35] rounded-xl p-4 space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#222B35] pb-2.5">
              <div className="text-xs font-bold uppercase tracking-wider text-[#C5A880] flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#C5A880]" /> Trạng Thái Thang Máy Liên Động
              </div>
              <span className="text-[10px] text-emerald-400 font-mono font-bold">Trực Tuyến</span>
            </div>

            {/* 3 Elevator Shafts */}
            <div className="space-y-2.5 text-xs">
              {/* Cabin 1 */}
              <div className="p-3 bg-[#161D26] border border-[#2D3748] rounded-lg flex items-center justify-between">
                <div>
                  <div className="font-bold text-white text-xs">Thang Khách 01 (Sảnh A)</div>
                  <div className="text-[10.5px] text-gray-400">Vị trí: Tầng G (Sảnh Đón)</div>
                </div>
                <span className="px-2 py-0.5 text-[9.5px] bg-gray-800 text-gray-300 rounded font-mono">Chờ Lệnh</span>
              </div>

              {/* Cabin 2 - Linked with Active Guest Pass */}
              <div className={`p-3 rounded-lg border flex items-center justify-between transition-all ${
                activeElevatorCabin 
                  ? 'bg-gradient-to-r from-[#1C2533] to-[#121E2A] border-[#C5A880] shadow-md ring-1 ring-[#C5A880]' 
                  : 'bg-[#161D26] border-[#2D3748]'
              }`}>
                <div>
                  <div className="font-bold text-white text-xs flex items-center gap-1.5">
                    Thang Khách 02 (Sảnh A)
                    {activeElevatorCabin && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>}
                  </div>
                  <div className="text-[10.5px] text-[#C5A880]">
                    {activeElevatorCabin ? `Kích hoạt đón lên: ${activeTargetFloor || 'Tầng 12'}` : 'Vị trí: Tầng 6'}
                  </div>
                </div>
                <span className={`px-2 py-0.5 text-[9.5px] rounded font-mono font-bold ${
                  activeElevatorCabin 
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500' 
                    : 'bg-gray-800 text-gray-300'
                }`}>
                  {activeElevatorCabin ? 'Đang Đón Khách' : 'Sẵn Sàng'}
                </span>
              </div>

              {/* Cabin 3 */}
              <div className="p-3 bg-[#161D26] border border-[#2D3748] rounded-lg flex items-center justify-between">
                <div>
                  <div className="font-bold text-white text-xs">Thang Hàng / Kỹ Thuật</div>
                  <div className="text-[10.5px] text-gray-400">Vị trí: Tầng Hầm B1</div>
                </div>
                <span className="px-2 py-0.5 text-[9.5px] bg-gray-800 text-gray-400 rounded font-mono">Chuyên Dụng</span>
              </div>
            </div>
          </div>

          {/* AI Security Access Audit Stream */}
          <div className="bg-[#121820] border border-[#222B35] rounded-xl p-4 space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#222B35] pb-2.5">
              <div className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#C5A880]" /> Nhật Ký An Ninh AI
              </div>
              <button 
                onClick={refreshLogs}
                className="text-[10px] text-gray-400 hover:text-[#C5A880] flex items-center gap-1 font-mono transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" /> Làm mới
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1 bg-[#161B22] p-1 rounded-lg border border-[#222B35] text-[10px]">
              <button
                type="button"
                onClick={() => setFilterResult('ALL')}
                className={`flex-1 py-1 rounded transition-colors cursor-pointer ${filterResult === 'ALL' ? 'bg-[#C5A880] text-[#0D1117] font-bold' : 'text-gray-400'}`}
              >
                Tất Cả
              </button>
              <button
                type="button"
                onClick={() => setFilterResult('VALID')}
                className={`flex-1 py-1 rounded transition-colors cursor-pointer ${filterResult === 'VALID' ? 'bg-emerald-500 text-black font-bold' : 'text-gray-400'}`}
              >
                Hợp Lệ
              </button>
              <button
                type="button"
                onClick={() => setFilterResult('INVALID')}
                className={`flex-1 py-1 rounded transition-colors cursor-pointer ${filterResult === 'INVALID' ? 'bg-rose-500 text-white font-bold' : 'text-gray-400'}`}
              >
                Giả Mạo
              </button>
              <button
                type="button"
                onClick={() => setFilterResult('EXPIRED')}
                className={`flex-1 py-1 rounded transition-colors cursor-pointer ${filterResult === 'EXPIRED' ? 'bg-amber-500 text-black font-bold' : 'text-gray-400'}`}
              >
                Quá Hạn
              </button>
            </div>

            {/* Logs List */}
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-6 text-xs text-gray-500">Chưa có nhật ký trong bộ lọc này</div>
              ) : (
                filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 bg-[#161B22] border border-[#2D3748] rounded-lg text-xs space-y-1 hover:border-[#C5A880]/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white flex items-center gap-1.5 text-[11px]">
                        {log.result === 'VALID' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : log.result === 'EXPIRED' ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        )}
                        Căn {log.apartmentCode}
                      </span>

                      <span className={`px-1.5 py-0.2 text-[9px] font-bold rounded ${
                        log.result === 'VALID'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                          : log.result === 'EXPIRED'
                          ? 'bg-amber-950 text-amber-300 border border-amber-700'
                          : 'bg-rose-950 text-rose-300 border border-rose-700'
                      }`}>
                        {log.result === 'VALID' ? 'HỢP LỆ' : log.result === 'EXPIRED' ? 'QUÁ HẠN' : 'KHÔNG HỢP LỆ'}
                      </span>
                    </div>

                    <div className="text-[10px] text-gray-300">{log.gateAction}</div>
                    <div className="text-[9.5px] text-gray-500 flex items-center justify-between font-mono pt-0.5">
                      <span>{log.timestamp}</span>
                      <span className="truncate max-w-[120px]">{log.checkpoint}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
