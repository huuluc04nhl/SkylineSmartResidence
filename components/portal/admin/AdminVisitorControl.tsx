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
  Car,
  UserCheck,
  ArrowRight,
  AlertCircle,
  KeyRound,
  Eye,
  Sliders,
  Bell
} from 'lucide-react';
import { 
  verifyVisitorQr,
  VerificationScanResult,
  getGateAuditLogs,
  GateAuditLog,
  getLatestVisitorPass,
  GeneratedVisitorPass
} from '@/lib/visitorStore';

export default function AdminVisitorControl() {
  const [customQrInput, setCustomQrInput] = useState('');
  const [scanResult, setScanResult] = useState<VerificationScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [barrierState, setBarrierState] = useState<'CLOSED' | 'OPEN' | 'LOCKED'>('CLOSED');
  const [selectedCheckpoint, setSelectedCheckpoint] = useState('Barrier Cổng Sảnh A');
  const [filterResult, setFilterResult] = useState<'ALL' | 'VALID' | 'INVALID' | 'EXPIRED'>('ALL');
  const [searchApt, setSearchApt] = useState('');
  
  // Realtime scan log
  const [scanHistory, setScanHistory] = useState<GateAuditLog[]>([]);
  const [latestPass, setLatestPass] = useState<GeneratedVisitorPass | null>(null);

  // Auto-close countdown
  const [autoCloseCountdown, setAutoCloseCountdown] = useState<number | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Camera video ref
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const refreshLogs = () => {
    setScanHistory([...getGateAuditLogs()]);
    setLatestPass(getLatestVisitorPass());
  };

  useEffect(() => {
    refreshLogs();
  }, []);

  // Handle camera toggle
  const toggleCamera = async () => {
    if (isCameraActive) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      setIsCameraActive(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsCameraActive(true);
      } catch (err) {
        console.warn('Cannot access camera, falling back to simulated scan:', err);
        alert('Không thể mở camera trên thiết bị này. Vui lòng sử dụng các nút quét hoặc nhập mã PIN số.');
      }
    }
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, []);

  // Auto close timer when barrier opens
  useEffect(() => {
    if (barrierState === 'OPEN') {
      let seconds = 6;
      setAutoCloseCountdown(seconds);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

      countdownTimerRef.current = setInterval(() => {
        seconds -= 1;
        if (seconds <= 0) {
          if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
          setBarrierState('CLOSED');
          setAutoCloseCountdown(null);
        } else {
          setAutoCloseCountdown(seconds);
        }
      }, 1000);
    } else {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      setAutoCloseCountdown(null);
    }
  }, [barrierState]);

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
    }, 400);
  };

  const filteredLogs = scanHistory.filter(l => {
    const matchesFilter = filterResult === 'ALL' || l.result === filterResult;
    const matchesSearch = !searchApt.trim() || l.apartmentCode.toLowerCase().includes(searchApt.toLowerCase().trim());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fadeIn select-none">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222B35] pb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Trạm Kiểm Soát Ra Vào Tự Động • Sảnh & Barrier Chung Cư
          </div>
          <h2 className="font-serif text-2xl text-white font-bold mt-1">
            Kiểm Soát Barrier & Quét Mã Khách
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Hệ thống tự động xác thực mã QR căn hộ, điều khiển cần Barrier và liên động phân quyền thang máy đón khách
          </p>
        </div>

        {/* Realtime Gate State Badge */}
        <div className="flex items-center gap-2">
          <div className={`px-4 py-2 rounded-xl font-bold text-xs font-mono flex items-center gap-2 border shadow-lg transition-all ${
            barrierState === 'OPEN'
              ? 'bg-emerald-950 text-emerald-300 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.35)]'
              : barrierState === 'LOCKED'
              ? 'bg-rose-950 text-rose-300 border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.35)] animate-pulse'
              : 'bg-[#121820] text-gray-400 border-gray-700'
          }`}>
            {barrierState === 'OPEN' ? (
              <Unlock className="w-4 h-4 text-emerald-400 animate-bounce" />
            ) : barrierState === 'LOCKED' ? (
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            ) : (
              <Lock className="w-4 h-4 text-gray-400" />
            )}
            <span>
              BARRIER: {barrierState === 'OPEN' ? 'ĐÃ MỞ (CHO QUA)' : barrierState === 'LOCKED' ? 'KHÓA CỨNG (BÁO ĐỘNG)' : 'ĐANG ĐÓNG (CHỜ QUÉT)'}
            </span>
          </div>
        </div>
      </div>

      {/* Hardware Barrier Visual Simulator & Status Bar */}
      <div className="bg-[#121820] border border-[#222B35] p-5 rounded-2xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#C5A880]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Visual Gate Barrier Mechanical Diagram */}
          <div className="lg:col-span-6 bg-[#0A0E14] border border-[#1E2732] rounded-xl p-5 relative overflow-hidden flex flex-col justify-between min-h-[220px]">
            <div className="flex items-center justify-between text-xs text-gray-400 border-b border-[#1E2732] pb-2">
              <span className="flex items-center gap-1.5 font-mono text-[11px] text-[#C5A880]">
                <Activity className="w-3.5 h-3.5" /> MÔ PHỎNG PHẦN CỨNG BARRIER CỔNG
              </span>
              <span className="font-mono text-[10px] text-gray-400">{selectedCheckpoint}</span>
            </div>

            {/* Animation Scene */}
            <div className="relative h-32 flex items-end justify-between px-6 py-2">
              
              {/* Traffic Light / Status Post */}
              <div className="flex flex-col items-center gap-1 pb-1">
                <div className="w-6 h-14 bg-[#161D26] border border-gray-700 rounded-lg p-1 flex flex-col justify-between items-center shadow-lg">
                  <div className={`w-3.5 h-3.5 rounded-full transition-all ${
                    barrierState === 'OPEN' 
                      ? 'bg-emerald-500 shadow-[0_0_10px_#10B981]' 
                      : 'bg-emerald-950 opacity-40'
                  }`} />
                  <div className={`w-3.5 h-3.5 rounded-full transition-all ${
                    barrierState === 'CLOSED' || barrierState === 'LOCKED' 
                      ? barrierState === 'LOCKED' ? 'bg-rose-500 animate-ping shadow-[0_0_12px_#F43F5E]' : 'bg-rose-500 shadow-[0_0_10px_#F43F5E]' 
                      : 'bg-rose-950 opacity-40'
                  }`} />
                </div>
                <div className="w-1.5 h-6 bg-gray-600 rounded-full" />
              </div>

              {/* Barrier Mechanism & Boom Arm */}
              <div className="relative flex-1 flex items-end ml-4">
                {/* Cabinet Base */}
                <div className="relative w-12 h-20 bg-gradient-to-t from-amber-900 to-amber-600 border border-amber-400 rounded-t-lg shadow-2xl flex flex-col items-center justify-center">
                  <div className="w-8 h-2 bg-black/50 rounded mb-1" />
                  <div className="w-4 h-4 rounded-full bg-black/60 border border-amber-300 flex items-center justify-center">
                    <div className={`w-2 h-2 rounded-full ${barrierState === 'OPEN' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                  </div>
                  <div className="text-[7px] font-mono text-white font-bold mt-1">SKYLINE</div>
                </div>

                {/* Rotating Boom Arm (Cần Barie) */}
                <div 
                  className="absolute left-6 bottom-14 h-3.5 bg-gradient-to-r from-red-600 via-white to-red-600 border border-black shadow-xl origin-bottom-left transition-transform duration-700 ease-in-out"
                  style={{
                    width: '260px',
                    transform: barrierState === 'OPEN' ? 'rotate(-75deg)' : 'rotate(0deg)',
                    backgroundImage: 'repeating-linear-gradient(45deg, #DC2626, #DC2626 15px, #FFFFFF 15px, #FFFFFF 30px)'
                  }}
                >
                  <div className="w-full h-full flex items-center justify-end pr-2">
                    <div className={`w-2 h-2 rounded-full ${barrierState === 'OPEN' ? 'bg-emerald-400' : 'bg-rose-500'}`} />
                  </div>
                </div>

                {/* Vehicle/Pedestrian Lane Indicator */}
                <div className="flex-1 ml-10 border-b-2 border-dashed border-gray-600 pb-1 text-center">
                  <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">
                    {barrierState === 'OPEN' ? 'LÀN XE: ĐƯỢC PHÉP ĐI QUA' : 'LÀN XE: DỪNG LẠI CHỜ QUÉT MÃ'}
                  </span>
                </div>
              </div>

            </div>

            {/* Hardware Status Footer */}
            <div className="flex items-center justify-between text-xs pt-2 border-t border-[#1E2732]">
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-[11px]">Trạng Thái:</span>
                <span className={`font-bold font-mono ${
                  barrierState === 'OPEN' ? 'text-emerald-400' : barrierState === 'LOCKED' ? 'text-rose-400' : 'text-gray-300'
                }`}>
                  {barrierState === 'OPEN' && 'ĐÃ NÂNG CẦN (BOOM_UP)'}
                  {barrierState === 'CLOSED' && 'HẠ CẦN ĐÓNG (BOOM_DOWN)'}
                  {barrierState === 'LOCKED' && 'KHÓA CỨNG AN NINH (EMERGENCY_LOCK)'}
                </span>
              </div>

              {autoCloseCountdown !== null && (
                <div className="text-amber-400 text-[11px] font-mono font-semibold flex items-center gap-1 animate-pulse">
                  <Clock className="w-3.5 h-3.5" /> Tự động hạ cần sau: {autoCloseCountdown}s
                </div>
              )}
            </div>
          </div>

          {/* Quick Manual Override Hardware Control Panel */}
          <div className="lg:col-span-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#C5A880] flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" /> Bảng Điều Khiển Cổng Khẩn Cấp (BQL / Bảo Vệ)
              </span>
              <span className="text-[10px] text-gray-400 font-mono">ID: GATE-CTRL-01</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                type="button"
                onClick={() => setBarrierState('OPEN')}
                className="p-3 bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500 text-emerald-300 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all shadow cursor-pointer active:scale-95"
              >
                <Unlock className="w-4 h-4" />
                <span>Mở Cưỡng Bức</span>
              </button>

              <button
                type="button"
                onClick={() => setBarrierState('CLOSED')}
                className="p-3 bg-[#161D26] hover:bg-[#202936] border border-gray-600 text-gray-200 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all shadow cursor-pointer active:scale-95"
              >
                <Lock className="w-4 h-4" />
                <span>Đóng Cổng</span>
              </button>

              <button
                type="button"
                onClick={() => setBarrierState('LOCKED')}
                className="p-3 bg-rose-950/80 hover:bg-rose-900 border border-rose-500 text-rose-300 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all shadow cursor-pointer active:scale-95"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Khóa Báo Động</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setBarrierState('CLOSED');
                  setScanResult(null);
                }}
                className="p-3 bg-[#1C2533] hover:bg-[#2A374A] border border-[#C5A880]/60 text-[#C5A880] rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all shadow cursor-pointer active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Đặt Lại (Reset)</span>
              </button>
            </div>

            {/* Active Checkpoint Location */}
            <div className="p-3 bg-[#0A0E14] border border-[#1E2732] rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-[#C5A880]" />
                <span className="text-gray-300">Vị trí trạm trực:</span>
                <strong className="text-white">{selectedCheckpoint}</strong>
              </div>
              <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Sẵn Sàng Quét
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* SCANNER & AUDIT LOG SPLIT VIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (7 Cols): Scanner Input & Validation Result */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 bg-[#121820] border border-[#222B35] rounded-xl space-y-4 shadow-xl">
            
            {/* Terminal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222B35] pb-3">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-[#C5A880]" />
                <div>
                  <h3 className="font-serif text-base font-bold text-white">Máy Quét Mã QR Cổng & Nhập PIN Khách</h3>
                  <p className="text-[11px] text-gray-400">Tự động nhận diện mã QR khách thăm căn hộ & mở barrier</p>
                </div>
              </div>

              {/* Camera Toggle Button */}
              <button
                type="button"
                onClick={toggleCamera}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow cursor-pointer ${
                  isCameraActive
                    ? 'bg-rose-600 hover:bg-rose-500 text-white'
                    : 'bg-[#1C2533] hover:bg-[#C5A880] text-[#C5A880] hover:text-[#0D1117] border border-[#C5A880]'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{isCameraActive ? 'Tắt Camera Quét' : 'Bật Camera Quét Trực Tiếp'}</span>
              </button>
            </div>

            {/* Live Camera View if Active */}
            {isCameraActive && (
              <div className="relative w-full h-56 bg-black rounded-xl overflow-hidden border-2 border-[#C5A880] shadow-2xl flex items-center justify-center animate-fadeIn">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-[#C5A880]/60 m-8 rounded-lg flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-emerald-400 rounded-lg animate-pulse" />
                </div>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/80 backdrop-blur rounded text-[11px] text-emerald-300 font-mono border border-emerald-500/40">
                  Đang hướng camera về mã QR của khách...
                </div>
              </div>
            )}

            {/* Quick Test & Recent Pass Buttons */}
            <div className="space-y-2">
              <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                Thử Nghiệm Nhanh / Mã Khách Mới Nhất:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                
                {/* Button 1: Test with latest created resident pass */}
                <button
                  type="button"
                  onClick={() => {
                    if (latestPass) {
                      setCustomQrInput(latestPass.qrData);
                      handleScan(latestPass.qrData);
                    } else {
                      const validDemo = 'SKYLINE_PASS_VALID_12A05_101';
                      setCustomQrInput(validDemo);
                      handleScan(validDemo);
                    }
                  }}
                  disabled={isScanning}
                  className="p-3 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/80 rounded-xl text-left transition-all shadow cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      {latestPass ? `Khách Căn ${latestPass.apartmentCode}` : 'Mã Hợp Lệ (Demo)'}
                    </span>
                    <span className="text-[9px] bg-emerald-500 text-black font-bold px-1.5 py-0.2 rounded font-mono">ĐÚNG</span>
                  </div>
                  <p className="text-[10.5px] text-emerald-200/80 line-clamp-1">
                    {latestPass ? `PIN: ${latestPass.pinCode} • ${latestPass.visitorName}` : 'Căn hộ 12A05 • Tòa A'}
                  </p>
                </button>

                {/* Button 2: Test Invalid / Fake */}
                <button
                  type="button"
                  onClick={() => {
                    const fake = 'INVALID_FAKE_CODE_999999';
                    setCustomQrInput(fake);
                    handleScan(fake);
                  }}
                  disabled={isScanning}
                  className="p-3 bg-rose-950/60 hover:bg-rose-900 border border-rose-500/80 rounded-xl text-left transition-all shadow cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-rose-300 flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5 text-rose-400" /> Mã Giả Mạo
                    </span>
                    <span className="text-[9px] bg-rose-500 text-white font-bold px-1.5 py-0.2 rounded font-mono">SAI</span>
                  </div>
                  <p className="text-[10.5px] text-rose-200/80 line-clamp-1">
                    Mã không thuộc chung cư • Khóa barrier
                  </p>
                </button>

                {/* Button 3: Test Expired */}
                <button
                  type="button"
                  onClick={() => {
                    const expired = 'EXP_VISITOR_EXPIRED_MOCK_DATA';
                    setCustomQrInput(expired);
                    handleScan(expired);
                  }}
                  disabled={isScanning}
                  className="p-3 bg-amber-950/60 hover:bg-amber-900 border border-amber-500/80 rounded-xl text-left transition-all shadow cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-400" /> Mã Quá Hạn
                    </span>
                    <span className="text-[9px] bg-amber-500 text-black font-bold px-1.5 py-0.2 rounded font-mono">HẾT HẠN</span>
                  </div>
                  <p className="text-[10.5px] text-amber-200/80 line-clamp-1">
                    Mã quá thời gian được cấp • Từ chối
                  </p>
                </button>

              </div>
            </div>

            {/* Custom Input Form (Accepts QR string or 6-digit PIN) */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleScan(customQrInput);
              }}
              className="space-y-2 pt-1"
            >
              <div className="text-[11px] text-gray-300 font-semibold flex items-center justify-between">
                <span>Nhập Chuỗi Mã QR hoặc Mã PIN 6 Chữ Số Của Khách:</span>
                {latestPass && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomQrInput(latestPass.pinCode);
                      handleScan(latestPass.pinCode);
                    }}
                    className="text-[10.5px] text-[#C5A880] hover:underline font-mono"
                  >
                    Điền PIN vừa tạo ({latestPass.pinCode})
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={customQrInput}
                    onChange={(e) => setCustomQrInput(e.target.value)}
                    placeholder="Quét mã QR từ camera hoặc nhập mã PIN số (VD: 849201)..."
                    className="w-full bg-[#161B22] border border-[#2D3748] p-3 text-white text-xs font-mono rounded-lg focus:border-[#C5A880] outline-none"
                  />
                  {customQrInput && (
                    <button
                      type="button"
                      onClick={() => setCustomQrInput('')}
                      className="absolute right-3 top-3 text-gray-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isScanning || !customQrInput.trim()}
                  className="px-5 py-3 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider rounded-lg transition-colors whitespace-nowrap flex items-center gap-2 shadow cursor-pointer active:scale-95"
                >
                  {isScanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Scan className="w-4 h-4" />}
                  <span>Xác Thực & Mở</span>
                </button>
              </div>
            </form>

            {/* Scan Result Feedback Card */}
            {scanResult && (
              <div className="space-y-3 pt-2 animate-fadeIn">
                <div className={`p-4 rounded-xl border flex items-start gap-3.5 shadow-lg ${
                  scanResult.canEnter && scanResult.scanResult === 'VALID'
                    ? 'bg-emerald-950/70 border-emerald-500 text-emerald-200'
                    : scanResult.scanResult === 'EXPIRED'
                    ? 'bg-amber-950/70 border-amber-500 text-amber-200'
                    : 'bg-rose-950/70 border-rose-500 text-rose-200'
                }`}>
                  {scanResult.canEnter && scanResult.scanResult === 'VALID' ? (
                    <CheckCircle2 className="w-7 h-7 text-emerald-400 flex-shrink-0 mt-0.5" />
                  ) : scanResult.scanResult === 'EXPIRED' ? (
                    <AlertTriangle className="w-7 h-7 text-amber-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-7 h-7 text-rose-400 flex-shrink-0 mt-0.5" />
                  )}

                  <div className="space-y-1.5 text-xs flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm sm:text-base">{scanResult.title}</span>
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border font-mono ${
                        scanResult.scanResult === 'VALID'
                          ? 'bg-emerald-500 text-black border-emerald-400'
                          : scanResult.scanResult === 'EXPIRED'
                          ? 'bg-amber-500 text-black border-amber-400'
                          : 'bg-rose-500 text-white border-rose-400'
                      }`}>
                        {scanResult.scanResult === 'VALID' ? 'CHO VÀO' : scanResult.scanResult === 'EXPIRED' ? 'QUÁ HẠN' : 'TỪ CHỐI'}
                      </span>
                    </div>

                    <div className="text-gray-200 leading-relaxed">{scanResult.message}</div>

                    {/* Guest & Destination Details */}
                    {scanResult.apartmentCode && (
                      <div className="p-2.5 bg-black/40 rounded-lg border border-white/10 space-y-1 text-[11px]">
                        <div className="text-[#C5A880] font-bold">
                          • Điểm đến: Căn hộ {scanResult.apartmentCode} {scanResult.towerName ? `(${scanResult.towerName})` : ''}
                        </div>
                        {scanResult.visitorName && (
                          <div className="text-gray-300">
                            • Tên khách: <strong>{scanResult.visitorName}</strong>
                            {scanResult.licensePlate ? ` • Biển số xe: ${scanResult.licensePlate}` : ''}
                          </div>
                        )}
                        <div className="text-cyan-300 font-mono text-[10.5px]">
                          • Lệnh chấp hành cổng: {scanResult.gateAction}
                        </div>
                      </div>
                    )}

                    <div className="text-[10px] text-gray-400 pt-0.5">
                      Thời gian quét: {scanResult.scannedAt} • Vị trí: {scanResult.checkpoint}
                    </div>
                  </div>
                </div>

                {/* Elevator Interlock Feedback Panel if Valid */}
                {scanResult.canEnter && scanResult.targetFloor && (
                  <div className="p-3.5 bg-gradient-to-r from-[#162536] to-[#121820] border border-cyan-500/60 rounded-xl flex items-center justify-between text-xs animate-fadeIn">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-300">
                        <Building className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span>Liên Động Thang Máy Tòa {scanResult.apartmentCode?.includes('A') ? 'A' : 'B'}</span>
                          <span className="text-[10px] bg-cyan-500 text-black font-bold px-1.5 py-0.2 rounded font-mono">TỰ ĐỘNG</span>
                        </div>
                        <p className="text-[11px] text-cyan-200/90">
                          Thang máy đã tự động mở quyền đón khách tại Sảnh G lên đúng <strong>Tầng {scanResult.targetFloor}</strong>.
                        </p>
                      </div>
                    </div>
                    <span className="text-cyan-400 font-mono text-xs font-bold">TẦNG {scanResult.targetFloor}</span>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* Right Column (5 Cols): Realtime Access Audit Stream */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#121820] border border-[#222B35] rounded-xl p-4 space-y-3 shadow-xl flex flex-col justify-between min-h-[500px]">
            
            <div className="space-y-2.5">
              <div className="flex items-center justify-between border-b border-[#222B35] pb-2.5">
                <div className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#C5A880]" /> Nhật Ký An Ninh Ra Vào
                </div>
                <button 
                  type="button"
                  onClick={refreshLogs}
                  className="text-[10px] text-gray-400 hover:text-[#C5A880] flex items-center gap-1 font-mono transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" /> Cập nhật
                </button>
              </div>

              {/* Search Apt Code & Filter Tabs */}
              <div className="space-y-2">
                <div className="relative">
                  <input
                    type="text"
                    value={searchApt}
                    onChange={(e) => setSearchApt(e.target.value)}
                    placeholder="Tìm theo mã căn hộ (VD: 12A05)..."
                    className="w-full bg-[#161B22] border border-[#2D3748] py-1.5 pl-7 pr-2.5 text-xs text-white rounded-lg outline-none focus:border-[#C5A880]"
                  />
                  <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2 top-2.5" />
                </div>

                <div className="flex gap-1 bg-[#161B22] p-1 rounded-lg border border-[#222B35] text-[10px]">
                  <button
                    type="button"
                    onClick={() => setFilterResult('ALL')}
                    className={`flex-1 py-1 rounded transition-colors cursor-pointer ${filterResult === 'ALL' ? 'bg-[#C5A880] text-[#0D1117] font-bold' : 'text-gray-400 hover:text-white'}`}
                  >
                    Tất Cả
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterResult('VALID')}
                    className={`flex-1 py-1 rounded transition-colors cursor-pointer ${filterResult === 'VALID' ? 'bg-emerald-500 text-black font-bold' : 'text-gray-400 hover:text-white'}`}
                  >
                    Hợp Lệ
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterResult('INVALID')}
                    className={`flex-1 py-1 rounded transition-colors cursor-pointer ${filterResult === 'INVALID' ? 'bg-rose-500 text-white font-bold' : 'text-gray-400 hover:text-white'}`}
                  >
                    Khóa
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterResult('EXPIRED')}
                    className={`flex-1 py-1 rounded transition-colors cursor-pointer ${filterResult === 'EXPIRED' ? 'bg-amber-500 text-black font-bold' : 'text-gray-400 hover:text-white'}`}
                  >
                    Quá Hạn
                  </button>
                </div>
              </div>
            </div>

            {/* Audit Log Stream Cards */}
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 text-xs flex-1">
              {filteredLogs.length === 0 ? (
                <div className="py-12 text-center text-gray-500 text-xs">
                  Không có lượt quét nào phù hợp với bộ lọc
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <div 
                    key={log.id} 
                    className={`p-2.5 rounded-lg border transition-all ${
                      log.result === 'VALID'
                        ? 'bg-emerald-950/25 border-emerald-500/40 text-emerald-300'
                        : log.result === 'EXPIRED'
                        ? 'bg-amber-950/25 border-amber-500/40 text-amber-300'
                        : 'bg-rose-950/25 border-rose-500/40 text-rose-300'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-[11px]">
                      <span className="flex items-center gap-1.5">
                        {log.result === 'VALID' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        ) : log.result === 'EXPIRED' ? (
                          <Clock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                        )}
                        Căn: <strong className="text-white">{log.apartmentCode}</strong>
                      </span>
                      <span className="font-mono text-gray-400 text-[9px]">{log.timestamp}</span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-gray-300 mt-1">
                      <span>Mục đích: <strong>{log.purposeLabel}</strong></span>
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono ${
                        log.result === 'VALID' ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : log.result === 'EXPIRED' ? 'bg-amber-950 text-amber-300 border border-amber-700' : 'bg-rose-950 text-rose-300 border border-rose-700'
                      }`}>
                        {log.result === 'VALID' ? '✓ ĐÃ MỞ CỔNG' : log.result === 'EXPIRED' ? '⌛ QUÁ HẠN' : '⛔ KHÓA CỨNG'}
                      </span>
                    </div>

                    <div className="text-[10px] text-gray-400 flex items-center justify-between mt-1 pt-1 border-t border-[#222B35]/60">
                      <span>📍 {log.checkpoint}</span>
                      <span className="text-gray-200 font-medium truncate max-w-[170px]">{log.gateAction}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Privacy Summary Note */}
            <div className="pt-2 border-t border-[#222B35] text-[10.5px] text-gray-400 flex items-center justify-between">
              <span>Đạt tiêu chuẩn an ninh tòa nhà 5 sao</span>
              <span className="text-[#C5A880] font-mono">Bảo mật thời gian thực</span>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
