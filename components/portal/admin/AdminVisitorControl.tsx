'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  QrCode, 
  Check, 
  X, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  AlertCircle,
  Scan, 
  Lock, 
  Unlock, 
  Camera, 
  RefreshCw, 
  ShieldCheck, 
  Building, 
  ShieldAlert, 
  Sparkles, 
  Search, 
  Activity, 
  Zap, 
  Repeat, 
  Filter,
  ArrowUp,
  Volume2,
  BellRing,
  KeyRound,
  Eye,
  Video,
  VideoOff,
  Radio,
  Share2
} from 'lucide-react';
import { 
  verifyVisitorQr, 
  VerificationScanResult, 
  getGateAuditLogs, 
  GateAuditLog,
  parseApartmentDestination
} from '@/lib/visitorStore';

export default function AdminVisitorControl() {
  const [customQrInput, setCustomQrInput] = useState('');
  const [scanResult, setScanResult] = useState<VerificationScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [barrierState, setBarrierState] = useState<'CLOSED' | 'OPEN' | 'LOCKED'>('CLOSED');
  const [selectedCheckpoint, setSelectedCheckpoint] = useState('Barrier Cổng Sảnh A');
  const [filterResult, setFilterResult] = useState<'ALL' | 'VALID' | 'INVALID' | 'EXPIRED'>('ALL');
  
  // Realtime scan log
  const [scanHistory, setScanHistory] = useState<GateAuditLog[]>([]);

  // Live Camera state
  const [isLiveCameraActive, setIsLiveCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<any>(null);

  const refreshLogs = () => {
    setScanHistory([...getGateAuditLogs()]);
  };

  useEffect(() => {
    refreshLogs();
    return () => {
      stopCamera();
    };
  }, []);

  const handleScan = (qrCodeToTest: string) => {
    if (!qrCodeToTest.trim()) return;
    setIsScanning(true);
    setScanResult(null);

    setTimeout(() => {
      const result = verifyVisitorQr(qrCodeToTest, selectedCheckpoint);
      setScanResult(result);
      setIsScanning(false);

      if (result.canEnter && result.scanResult === 'VALID') {
        setBarrierState('OPEN');
      } else if (result.scanResult === 'EXPIRED') {
        setBarrierState('CLOSED');
      } else {
        setBarrierState('LOCKED');
      }

      refreshLogs();
    }, 450);
  };

  // Start real webcam
  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsLiveCameraActive(true);

      // Check if BarcodeDetector is supported natively in browser
      if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
        try {
          const barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
          scanIntervalRef.current = setInterval(async () => {
            if (videoRef.current && videoRef.current.readyState >= 2) {
              try {
                const barcodes = await barcodeDetector.detect(videoRef.current);
                if (barcodes.length > 0) {
                  const detected = barcodes[0].rawValue;
                  if (detected && detected !== customQrInput) {
                    setCustomQrInput(detected);
                    handleScan(detected);
                    stopCamera();
                  }
                }
              } catch (e) {
                // frame detection pass
              }
            }
          }, 600);
        } catch (e) {
          // BarcodeDetector initialization error fallback
        }
      }
    } catch (err: any) {
      console.error('Camera start error:', err);
      setCameraError('Không thể mở camera: ' + (err.message || 'Vui lòng cấp quyền truy cập camera'));
    }
  };

  // Stop real webcam
  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsLiveCameraActive(false);
  };

  // Capture current camera frame manually for test
  const handleCaptureFrameTest = () => {
    if (!isLiveCameraActive) return;
    // Simulate reading valid QR code from frame
    const demoToken = 'SKYLINE_PASS_VALID_12A05_101';
    setCustomQrInput(demoToken);
    handleScan(demoToken);
    stopCamera();
  };

  const filteredLogs = scanHistory.filter((l) => {
    if (filterResult === 'ALL') return true;
    return l.result === filterResult;
  });

  const destInfo = scanResult?.apartmentCode
    ? parseApartmentDestination(scanResult.apartmentCode)
    : { tower: 'Tòa A (Sapphire)', floor: 12, elevatorCabin: 'Cabin Thang 02 (Sảnh Tòa A)' };

  // Sample elevator floor list for simulation
  const elevatorFloors = [
    { num: 'G', label: 'Sảnh Đón & Lễ Tân' },
    { num: 1, label: 'Khu Thương Mại' },
    { num: 2, label: 'Khu Nhà Trẻ & Sinh Hoạt' },
    { num: 3, label: 'Căn Hộ Sân Vườn' },
    { num: 5, label: 'Căn Hộ' },
    { num: 8, label: 'Căn Hộ' },
    { num: 10, label: 'Căn Hộ' },
    { num: 12, label: `Căn Hộ ${scanResult?.apartmentCode || '12A05'}` },
    { num: 14, label: 'Căn Hộ' },
    { num: 18, label: 'Căn Hộ' },
    { num: 25, label: 'Sky Pool & Panorama Gym' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn select-none">
      
      {/* Header & KPI Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222B35] pb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Trạm Kiểm Soát Ra Vào Tự Động • Sảnh & Barrier
          </div>
          <h2 className="font-serif text-2xl text-white font-bold mt-1">
            Kiểm Soát Barrier & Quét Mã Khách
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Hệ thống tự động xác thực chữ ký số mã QR căn hộ, tự động điều khiển Barrier và phân quyền thang máy
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className={`px-4 py-2 rounded-xl font-bold text-xs font-mono flex items-center gap-2 border shadow-lg transition-all ${
            barrierState === 'OPEN'
              ? 'bg-emerald-950 text-emerald-300 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
              : barrierState === 'LOCKED'
              ? 'bg-rose-950 text-rose-300 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)] animate-pulse'
              : 'bg-[#121820] text-gray-300 border-gray-700'
          }`}>
            {barrierState === 'OPEN' ? (
              <Unlock className="w-4 h-4 text-emerald-400 animate-bounce" />
            ) : barrierState === 'LOCKED' ? (
              <Lock className="w-4 h-4 text-rose-400" />
            ) : (
              <Lock className="w-4 h-4 text-gray-400" />
            )}
            <span>
              CỔNG BARRIER: {barrierState === 'OPEN' ? 'ĐÃ MỞ (CHO QUA)' : barrierState === 'LOCKED' ? 'KHÓA CỨNG (BÁO ĐỘNG)' : 'ĐANG ĐÓNG (CHỜ QUÉT)'}
            </span>
          </div>
        </div>
      </div>

      {/* Privacy Notice Banner */}
      <div className="p-3.5 bg-[#121E2A] border border-[#1E3A5F] rounded-xl flex items-center justify-between text-xs text-cyan-200">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <span>
            <strong>Bảo Mật Quyền Riêng Tư:</strong> Ban Quản Lý chỉ kiểm tra tính hợp lệ của mã ra vào qua hệ thống máy quét. Không lưu vết thông tin cá nhân khách thăm để đảm bảo quyền riêng tư của từng căn hộ.
          </span>
        </div>
        <span className="text-[10px] text-cyan-400 font-mono px-2 py-0.5 bg-cyan-950 rounded border border-cyan-800 flex-shrink-0 ml-2">
          Zero-Dossier Privacy
        </span>
      </div>

      {/* MAIN SCANNER CONTROLLER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Scanner Terminal & Hardware Interlock Simulation */}
        <div className="lg:col-span-2 space-y-5">
          
          {/* Section 1: Terminal Control Box */}
          <div className="p-5 bg-gradient-to-r from-[#121820] to-[#161D26] border border-[#C5A880]/70 rounded-xl space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222B35] pb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-[#C5A880]" />
                <div>
                  <h3 className="font-serif text-base font-bold text-white">Máy Quét Mã QR Cổng (Gate Security Scanner)</h3>
                  <div className="text-[11px] text-gray-400">Kiểm soát an ninh tự động • Khách Thăm Căn Hộ</div>
                </div>
              </div>

              {/* Checkpoint selector */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-400">Trạm quét:</span>
                <select
                  value={selectedCheckpoint}
                  onChange={(e) => setSelectedCheckpoint(e.target.value)}
                  className="bg-[#161B22] border border-[#2D3748] text-xs text-[#C5A880] font-semibold py-1 px-2.5 rounded-lg outline-none cursor-pointer"
                >
                  <option value="Barrier Cổng Sảnh A">Barrier Cổng Sảnh A</option>
                  <option value="Barrier Cổng Sảnh B">Barrier Cổng Sảnh B</option>
                  <option value="Barrier Cổng Hầm B1">Barrier Cổng Hầm B1</option>
                  <option value="Cửa Tự Động Sảnh A">Cửa Tự Động Sảnh A</option>
                </select>
              </div>
            </div>

            {/* 3 Quick-Action Verification Scenarios */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => {
                  const validDemo = 'SKYLINE_PASS_VALID_12A05_101';
                  setCustomQrInput(validDemo);
                  handleScan(validDemo);
                }}
                disabled={isScanning}
                className="p-3.5 bg-emerald-950/70 hover:bg-emerald-900 border-2 border-emerald-500 rounded-xl text-left transition-all shadow-lg group cursor-pointer active:scale-98"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5 uppercase">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 1. Mã QR Đúng
                  </span>
                  <span className="text-[10px] bg-emerald-500 text-black font-bold px-1.5 py-0.2 rounded">Hợp Lệ</span>
                </div>
                <p className="text-[11px] text-emerald-200/80">
                  Mã đúng chữ ký căn hộ & còn hạn. Barrier mở & Thang máy gọi tầng!
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  const invalidDemo = 'SIM_QR_INVALID';
                  setCustomQrInput(invalidDemo);
                  handleScan(invalidDemo);
                }}
                disabled={isScanning}
                className="p-3.5 bg-rose-950/70 hover:bg-rose-900 border-2 border-rose-500 rounded-xl text-left transition-all shadow-lg group cursor-pointer active:scale-98"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5 uppercase">
                    <XCircle className="w-4 h-4 text-rose-400" /> 2. Mã QR Sai
                  </span>
                  <span className="text-[10px] bg-rose-500 text-white font-bold px-1.5 py-0.2 rounded">Không Hợp Lệ</span>
                </div>
                <p className="text-[11px] text-rose-200/80">
                  Mã giả mạo hoặc không thuộc tòa nhà. Khóa chặt Barrier ngay!
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  const expDemo = 'EXP_VISITOR_EXPIRED_MOCK_DATA';
                  setCustomQrInput(expDemo);
                  handleScan(expDemo);
                }}
                disabled={isScanning}
                className="p-3.5 bg-amber-950/70 hover:bg-amber-900 border-2 border-amber-500 rounded-xl text-left transition-all shadow-lg group cursor-pointer active:scale-98"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5 uppercase">
                    <Clock className="w-4 h-4 text-amber-400" /> 3. Mã QR Quá Hạn
                  </span>
                  <span className="text-[10px] bg-amber-500 text-black font-bold px-1.5 py-0.2 rounded">Quá Hạn</span>
                </div>
                <p className="text-[11px] text-amber-200/80">
                  Mã đã hết thời gian được phép ra vào. Từ chối vào sảnh!
                </p>
              </button>
            </div>

            {/* Live Camera Scanner Bar */}
            <div className="p-3 bg-[#0D1117] border border-[#222B35] rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <span className="text-xs font-bold text-white">Chế Độ Quét Trực Tiếp Bằng Camera:</span>
                </div>

                <div className="flex items-center gap-2">
                  {!isLiveCameraActive ? (
                    <button
                      type="button"
                      onClick={startCamera}
                      className="px-3 py-1.5 bg-[#1C2533] hover:bg-[#C5A880] text-[#C5A880] hover:text-[#0D1117] border border-[#C5A880] text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Video className="w-3.5 h-3.5" /> Bật Web Camera
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCaptureFrameTest}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow"
                      >
                        <Scan className="w-3.5 h-3.5" /> Quét Khung Hình Này
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="px-3 py-1.5 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-500 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <VideoOff className="w-3.5 h-3.5" /> Tắt Camera
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {cameraError && (
                <div className="p-2 bg-rose-950/80 border border-rose-500 text-rose-200 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{cameraError}</span>
                </div>
              )}

              {/* Video preview when camera active */}
              {isLiveCameraActive && (
                <div className="relative w-full h-56 bg-black rounded-lg overflow-hidden border border-[#C5A880]/60 flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* Cyber Scanner Reticle Overlay */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-dashed border-[#C5A880] rounded-xl relative shadow-[0_0_20px_rgba(197,168,128,0.4)]">
                      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-emerald-400"></div>
                      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-emerald-400"></div>
                      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-emerald-400"></div>
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-emerald-400"></div>
                      {/* Laser scanning beam line */}
                      <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_8px_cyan] animate-bounce top-1/2"></div>
                    </div>
                  </div>
                  <div className="absolute bottom-2 left-2 px-2.5 py-1 bg-black/80 rounded text-[10px] font-mono text-cyan-300 border border-cyan-500/40">
                    Đang quét QR code trước ống kính camera...
                  </div>
                </div>
              )}
            </div>

            {/* Custom Input Scanner Form */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleScan(customQrInput);
              }}
              className="flex gap-2 pt-1"
            >
              <input
                type="text"
                value={customQrInput}
                onChange={(e) => setCustomQrInput(e.target.value)}
                placeholder="Nhập chuỗi mã QR hoặc mã PIN 6 số..."
                className="flex-1 bg-[#161B22] border border-[#2D3748] p-3 text-white text-xs font-mono rounded-lg focus:border-[#C5A880] outline-none"
              />
              <button
                type="submit"
                disabled={isScanning || !customQrInput.trim()}
                className="px-5 py-3 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 shadow cursor-pointer active:scale-95"
              >
                {isScanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Scan className="w-4 h-4" />}
                Xác Thực Mã
              </button>
            </form>

            {/* Scan Result Feedback Card */}
            {scanResult && (
              <div className="space-y-3 pt-1 animate-fadeIn">
                <div className={`p-4 rounded-xl border flex items-start gap-3.5 shadow-lg ${
                  scanResult.canEnter && scanResult.scanResult === 'VALID'
                    ? 'bg-emerald-950/70 border-emerald-500 text-emerald-200'
                    : scanResult.scanResult === 'EXPIRED'
                    ? 'bg-amber-950/70 border-amber-500 text-amber-200'
                    : 'bg-rose-950/70 border-rose-500 text-rose-200'
                }`}>
                  {scanResult.canEnter && scanResult.scanResult === 'VALID' ? (
                    <CheckCircle2 className="w-7 h-7 text-emerald-400 flex-shrink-0" />
                  ) : scanResult.scanResult === 'EXPIRED' ? (
                    <AlertTriangle className="w-7 h-7 text-amber-400 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-7 h-7 text-rose-400 flex-shrink-0" />
                  )}

                  <div className="space-y-1 text-xs flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm sm:text-base">{scanResult.title}</span>
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${
                        scanResult.canEnter
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                          : 'bg-rose-950 text-rose-300 border-rose-500'
                      }`}>
                        {scanResult.canEnter ? 'CẤP QUYỀN QUA CỔNG' : 'TỪ CHỐI RA VÀO'}
                      </span>
                    </div>
                    <div className="text-gray-200">{scanResult.message}</div>
                    {scanResult.apartmentCode && (
                      <div className="text-[11px] text-[#C5A880] pt-1 font-semibold flex items-center gap-2">
                        <span>• Căn hộ: Căn {scanResult.apartmentCode} ({destInfo.tower})</span>
                        <span>• Lệnh: {scanResult.gateAction}</span>
                      </div>
                    )}
                    <div className="text-[10px] text-gray-400 pt-0.5">
                      Thời gian: {scanResult.scannedAt} • Trạm quét: {scanResult.checkpoint}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: VISUAL HARDWARE INTERLOCK SIMULATION (BARRIER & ELEVATOR) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* 1. Visual Barrier & Speed Gate Simulation */}
            <div className="p-4 bg-[#121820] border border-[#222B35] rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-[#222B35] pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#C5A880] flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" /> Mô Phỏng Cần Barrier Cổng
                </span>
                <span className="text-[10px] font-mono text-gray-400">{selectedCheckpoint}</span>
              </div>

              {/* Graphic Representation */}
              <div className="relative h-44 bg-[#0A0E14] border border-[#222B35] rounded-xl overflow-hidden flex items-end justify-center p-4">
                {/* Road surface */}
                <div className="absolute bottom-0 left-0 right-0 h-6 bg-[#161D26] border-t border-gray-700 flex items-center justify-center">
                  <span className="text-[9px] font-mono text-gray-500 tracking-widest">LÀN XE RA VÀO CHUNG CƯ</span>
                </div>

                {/* Left Barrier Post / Housing */}
                <div className="absolute left-8 bottom-6 w-12 h-28 bg-gradient-to-b from-[#C5A880] via-[#8C7355] to-[#1C2533] rounded-t-lg border border-[#E2C799] flex flex-col items-center justify-between p-1.5 shadow-xl z-10">
                  <div className="w-4 h-4 rounded-full bg-black flex items-center justify-center">
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      barrierState === 'OPEN'
                        ? 'bg-emerald-400 shadow-[0_0_8px_#10B981]'
                        : barrierState === 'LOCKED'
                        ? 'bg-rose-500 shadow-[0_0_8px_#F43F5E] animate-ping'
                        : 'bg-amber-400 shadow-[0_0_8px_#F59E0B]'
                    }`}></span>
                  </div>
                  <div className="text-[8px] font-bold text-white font-mono uppercase text-center leading-none">
                    SKYLINE GATE
                  </div>
                  <div className="w-6 h-6 rounded-full bg-black/80 border border-gray-600 flex items-center justify-center">
                    {barrierState === 'OPEN' ? (
                      <Unlock className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Lock className="w-3 h-3 text-rose-400" />
                    )}
                  </div>
                </div>

                {/* Boom Arm (Cần Chắn) */}
                <div 
                  className={`absolute left-16 bottom-[100px] h-3.5 origin-left transition-all duration-700 ease-out z-0 shadow-lg ${
                    barrierState === 'OPEN' 
                      ? '-rotate-75 w-36 bg-gradient-to-r from-emerald-400 via-white to-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                      : barrierState === 'LOCKED'
                      ? 'rotate-0 w-48 bg-gradient-to-r from-red-600 via-white to-red-600 shadow-[0_0_15px_rgba(239,68,68,0.7)] animate-pulse'
                      : 'rotate-0 w-48 bg-gradient-to-r from-red-500 via-white to-red-500'
                  }`}
                  style={{
                    backgroundImage: 'repeating-linear-gradient(45deg, #DC2626, #DC2626 10px, #FFFFFF 10px, #FFFFFF 20px)'
                  }}
                ></div>

                {/* Status Overlay */}
                <div className="absolute top-2 right-2 px-2.5 py-1 bg-black/80 rounded border text-[10px] font-mono font-bold flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${barrierState === 'OPEN' ? 'bg-emerald-400' : barrierState === 'LOCKED' ? 'bg-rose-500' : 'bg-gray-400'}`}></span>
                  <span className={barrierState === 'OPEN' ? 'text-emerald-400' : barrierState === 'LOCKED' ? 'text-rose-400' : 'text-gray-300'}>
                    {barrierState === 'OPEN' ? 'BARRIER ĐANG MỞ (PASS)' : barrierState === 'LOCKED' ? 'BARRIER KHÓA (ALARM)' : 'BARRIER ĐÓNG (WAIT)'}
                  </span>
                </div>
              </div>

              {/* Manual Hardware Override Buttons */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setBarrierState('OPEN')}
                  className="flex-1 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500 text-emerald-300 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Mở Cưỡng Bức
                </button>
                <button
                  type="button"
                  onClick={() => setBarrierState('CLOSED')}
                  className="flex-1 py-1.5 bg-[#161B22] hover:bg-[#202936] border border-gray-600 text-gray-300 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Đóng Cổng
                </button>
                <button
                  type="button"
                  onClick={() => setBarrierState('LOCKED')}
                  className="flex-1 py-1.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-500 text-rose-300 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Khóa Cứng
                </button>
              </div>
            </div>

            {/* 2. Visual Elevator Destination Floor Dispatch Simulation */}
            <div className="p-4 bg-[#121820] border border-[#222B35] rounded-xl space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-[#222B35] pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#C5A880] flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-[#C5A880]" /> Phân Quyền Thang Máy Điểm Đến
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400">Interlocked</span>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="text-[11px] text-gray-300 flex items-center justify-between">
                    <span>Cabin Điều Phối:</span>
                    <strong className="text-white font-mono">{destInfo.elevatorCabin}</strong>
                  </div>

                  <div className="text-[11px] text-gray-300 flex items-center justify-between">
                    <span>Điểm Đến Được Phép:</span>
                    <span className="text-emerald-400 font-bold font-mono">
                      {scanResult?.canEnter ? `TẦNG ${destInfo.floor} (${destInfo.tower})` : 'CHƯA PHÂN QUYỀN'}
                    </span>
                  </div>

                  {/* Elevator Floor Keypad Simulation */}
                  <div className="p-2.5 bg-[#0D1117] border border-[#222B35] rounded-lg">
                    <div className="text-[9.5px] uppercase tracking-wider font-bold text-gray-400 mb-1.5 text-center">
                      Bảng Gọi Tầng Điện Tử Trong Cabin Thang Máy:
                    </div>

                    <div className="grid grid-cols-4 gap-1.5">
                      {elevatorFloors.map((floor) => {
                        const isAuthorized = scanResult?.canEnter && (floor.num === destInfo.floor || floor.num === 'G');
                        return (
                          <div
                            key={String(floor.num)}
                            className={`py-1 px-1 rounded text-center font-mono font-bold text-xs border transition-all ${
                              isAuthorized
                                ? 'bg-[#C5A880] text-[#0D1117] border-[#E2C799] shadow-[0_0_10px_rgba(197,168,128,0.6)] ring-2 ring-[#C5A880]/50'
                                : 'bg-[#161B22] text-gray-500 border-gray-800'
                            }`}
                          >
                            <div className="flex items-center justify-center gap-0.5">
                              <span>{floor.num}</span>
                              {isAuthorized ? (
                                <KeyRound className="w-2.5 h-2.5 text-[#0D1117]" />
                              ) : (
                                <Lock className="w-2.5 h-2.5 text-gray-600" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Resident Notification Alert Confirmation */}
              {scanResult?.canEnter && (
                <div className="p-2.5 bg-emerald-950/70 border border-emerald-500/80 rounded-lg text-emerald-300 text-[11px] flex items-center gap-2">
                  <BellRing className="w-4 h-4 shrink-0 text-emerald-400 animate-bounce" />
                  <span>
                    Đã phát chuông thông báo đến Căn hộ <strong>{scanResult.apartmentCode}</strong>: Khách đã vào sảnh & thang máy đang đưa lên Tầng {destInfo.floor}.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Realtime Access Security Audit Stream */}
        <div className="space-y-4">
          <div className="bg-[#121820] border border-[#222B35] rounded-xl p-4 space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#222B35] pb-2.5">
              <div className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#C5A880]" /> Nhật Ký An Ninh Cổng Barrier
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
                Sai Mã
              </button>
              <button
                type="button"
                onClick={() => setFilterResult('EXPIRED')}
                className={`flex-1 py-1 rounded transition-colors cursor-pointer ${filterResult === 'EXPIRED' ? 'bg-amber-500 text-black font-bold' : 'text-gray-400'}`}
              >
                Quá Hạn
              </button>
            </div>

            {/* Log Stream List */}
            <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-xs font-mono">
                  Chưa có lượt quét nào được ghi nhận.
                </div>
              ) : (
                filteredLogs.map((log) => {
                  const logDest = parseApartmentDestination(log.apartmentCode);
                  return (
                    <div 
                      key={log.id}
                      className={`p-2.5 rounded-lg border text-xs space-y-1 transition-all ${
                        log.result === 'VALID'
                          ? 'bg-[#161D26] border-emerald-500/40 hover:border-emerald-500'
                          : log.result === 'EXPIRED'
                          ? 'bg-[#1D1A16] border-amber-500/40 hover:border-amber-500'
                          : 'bg-[#201518] border-rose-500/40 hover:border-rose-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white flex items-center gap-1">
                          {log.result === 'VALID' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          ) : log.result === 'EXPIRED' ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-rose-400" />
                          )}
                          Căn {log.apartmentCode}
                        </span>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold font-mono uppercase ${
                          log.result === 'VALID'
                            ? 'bg-emerald-950 text-emerald-300'
                            : log.result === 'EXPIRED'
                            ? 'bg-amber-950 text-amber-300'
                            : 'bg-rose-950 text-rose-300'
                        }`}>
                          {log.result === 'VALID' ? 'Hợp Lệ' : log.result === 'EXPIRED' ? 'Quá Hạn' : 'Không Hợp Lệ'}
                        </span>
                      </div>

                      <div className="text-[11px] text-gray-300">
                        {log.result === 'VALID' 
                          ? `Đã mở Barrier & Cấp quyền lên Tầng ${logDest.floor} (${logDest.tower})` 
                          : log.gateAction}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono pt-1 border-t border-gray-800">
                        <span>{log.checkpoint}</span>
                        <span>{log.timestamp.split(' ')[0]}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
