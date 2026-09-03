'use client';

import React, { useState } from 'react';
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
  Activity
} from 'lucide-react';
import { 
  verifyVisitorQr,
  VerificationScanResult
} from '@/lib/visitorStore';

interface ScanHistoryEntry {
  id: string;
  qrCode: string;
  result: 'VALID' | 'INVALID' | 'EXPIRED';
  title: string;
  apartmentCode?: string;
  timestamp: string;
}

export default function AdminVisitorControl() {
  const [customQrInput, setCustomQrInput] = useState('');
  const [scanResult, setScanResult] = useState<VerificationScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [barrierState, setBarrierState] = useState<'CLOSED' | 'OPEN' | 'LOCKED'>('CLOSED');
  
  // Realtime scan log
  const [scanHistory, setScanHistory] = useState<ScanHistoryEntry[]>([
    {
      id: 'LOG-1',
      qrCode: 'SKY_TOKEN_12A05_8832_1788299000_A9F2',
      result: 'VALID',
      title: 'Mã Hợp Lệ Căn 12A05',
      apartmentCode: '12A05',
      timestamp: '11:45:10'
    },
    {
      id: 'LOG-2',
      qrCode: 'INVALID_QR_FAKE_CODE_001',
      result: 'INVALID',
      title: 'Mã Không Hợp Lệ (Khóa Cổng)',
      timestamp: '11:32:05'
    },
    {
      id: 'LOG-3',
      qrCode: 'EXP_VISITOR_EXPIRED_MOCK_DATA',
      result: 'EXPIRED',
      title: 'Mã Quá Hạn Sử Dụng',
      apartmentCode: '14B02',
      timestamp: '10:15:22'
    }
  ]);

  const handleScan = (qrCodeToTest: string) => {
    if (!qrCodeToTest.trim()) return;
    setIsScanning(true);
    setScanResult(null);

    setTimeout(() => {
      const result = verifyVisitorQr(qrCodeToTest);
      setScanResult(result);
      setIsScanning(false);

      if (result.canEnter && result.scanResult === 'VALID') {
        setBarrierState('OPEN');
      } else if (result.scanResult === 'EXPIRED') {
        setBarrierState('CLOSED');
      } else {
        setBarrierState('LOCKED');
      }

      // Add to audit log
      setScanHistory(prev => [
        {
          id: `LOG-${Date.now()}`,
          qrCode: qrCodeToTest,
          result: result.scanResult,
          title: result.title,
          apartmentCode: result.apartmentCode,
          timestamp: result.scannedAt
        },
        ...prev.slice(0, 9)
      ]);
    }, 450);
  };

  return (
    <div className="space-y-6 animate-fadeIn select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222B35] pb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Trạm Kiểm Soát Ra Vào Tự Động • Sảnh & Barrier
          </div>
          <h2 className="font-serif text-2xl text-white font-bold mt-1">
            Kiểm Soát Barrier & Quét Mã Khách
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Hệ thống tự động xác thực chữ ký số mã QR của căn hộ, tự động điều khiển Barrier và phân quyền thang máy
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className={`px-4 py-2 rounded-xl font-bold text-xs font-mono flex items-center gap-2 border shadow-lg ${
            barrierState === 'OPEN'
              ? 'bg-emerald-950 text-emerald-300 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
              : barrierState === 'LOCKED'
              ? 'bg-rose-950 text-rose-300 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
              : 'bg-[#121820] text-gray-400 border-gray-700'
          }`}>
            {barrierState === 'OPEN' ? <Unlock className="w-4 h-4 text-emerald-400 animate-bounce" /> : <Lock className="w-4 h-4" />}
            <span>BARRIER: {barrierState === 'OPEN' ? 'ĐÃ MỞ (CHO QUA)' : barrierState === 'LOCKED' ? 'KHÓA CỨNG (BÁO ĐỘNG)' : 'ĐANG ĐÓNG (CHỜ QUÉT)'}</span>
          </div>
        </div>
      </div>

      {/* Privacy Notice Banner */}
      <div className="p-3.5 bg-[#121E2A] border border-[#1E3A5F] rounded-xl flex items-center justify-between text-xs text-cyan-200">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <span>
            <strong>Cơ Chế Bảo Mật Tự Động:</strong> Ban Quản Lý chỉ kiểm soát tính hợp lệ của mã ra vào qua hệ thống máy quét. Danh tính và đời tư khách thăm được bảo mật trực tiếp theo thẩm quyền tạo mã của từng chủ hộ.
          </span>
        </div>
        <span className="text-[10px] text-cyan-400 font-mono px-2 py-0.5 bg-cyan-950 rounded border border-cyan-800">
          Zero-Dossier Privacy
        </span>
      </div>

      {/* MAIN SCANNER CONTROLLER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Scanner Terminal */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-5 bg-gradient-to-r from-[#121820] to-[#161D26] border border-[#C5A880]/70 rounded-xl space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#222B35] pb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-[#C5A880]" />
                <div>
                  <h3 className="font-serif text-base font-bold text-white">Máy Quét Mã QR Barrier (Sảnh A / Sảnh B / Hầm B1)</h3>
                  <div className="text-[11px] text-gray-400">Kiểm tra tức thì 3 trạng thái: Hợp lệ, Không hợp lệ hoặc Quá hạn</div>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-emerald-950 text-emerald-300 text-[10px] font-mono rounded border border-emerald-600 animate-pulse">
                Camera AI Online
              </span>
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
                className="p-3.5 bg-emerald-950/70 hover:bg-emerald-900 border-2 border-emerald-500 rounded-xl text-left transition-all shadow-lg group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5 uppercase">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Mã QR Đúng
                  </span>
                  <span className="text-[10px] bg-emerald-500 text-black font-bold px-1.5 py-0.2 rounded">Hợp Lệ</span>
                </div>
                <p className="text-[11px] text-emerald-200/80">
                  Mã đúng chữ ký căn hộ & còn trong thời hạn. Mở Barrier tự động!
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
                className="p-3.5 bg-rose-950/70 hover:bg-rose-900 border-2 border-rose-500 rounded-xl text-left transition-all shadow-lg group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5 uppercase">
                    <XCircle className="w-4 h-4 text-rose-400" /> Mã QR Sai
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
                className="p-3.5 bg-amber-950/70 hover:bg-amber-900 border-2 border-amber-500 rounded-xl text-left transition-all shadow-lg group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5 uppercase">
                    <Clock className="w-4 h-4 text-amber-400" /> Mã QR Quá Hạn
                  </span>
                  <span className="text-[10px] bg-amber-500 text-black font-bold px-1.5 py-0.2 rounded">Quá Hạn</span>
                </div>
                <p className="text-[11px] text-amber-200/80">
                  Mã đã hết thời gian được phép ra vào. Từ chối vào sảnh!
                </p>
              </button>
            </div>

            {/* Custom Input Scanner Form */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleScan(customQrInput);
              }}
              className="flex gap-2 pt-2"
            >
              <input
                type="text"
                value={customQrInput}
                onChange={(e) => setCustomQrInput(e.target.value)}
                placeholder="Quét mã QR từ camera hoặc nhập mã PIN số..."
                className="flex-1 bg-[#161B22] border border-[#2D3748] p-3 text-white text-xs font-mono rounded-lg focus:border-[#C5A880] outline-none"
              />
              <button
                type="submit"
                disabled={isScanning || !customQrInput.trim()}
                className="px-5 py-3 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 shadow"
              >
                {isScanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Scan className="w-4 h-4" />}
                Xác Thực Mã
              </button>
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
                    <CheckCircle2 className="w-7 h-7 text-emerald-400 flex-shrink-0" />
                  ) : scanResult.scanResult === 'EXPIRED' ? (
                    <AlertTriangle className="w-7 h-7 text-amber-400 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-7 h-7 text-rose-400 flex-shrink-0" />
                  )}

                  <div className="space-y-1 text-xs flex-1">
                    <div className="font-bold text-sm sm:text-base">{scanResult.title}</div>
                    <div className="text-gray-200">{scanResult.message}</div>
                    {scanResult.apartmentCode && (
                      <div className="text-[11px] text-[#C5A880] pt-1 font-semibold">
                        • Quyền truy cập: Căn hộ {scanResult.apartmentCode} • Thang máy Tầng 12
                      </div>
                    )}
                    <div className="text-[10px] text-gray-400 pt-0.5">Thời gian quét: {scanResult.scannedAt}</div>
                  </div>
                </div>

                {/* Barrier Control Override */}
                <div className="p-4 bg-[#121820] border border-[#222B35] rounded-xl flex items-center justify-between">
                  <div className="text-xs text-gray-300">
                    <div>Lệnh Phần Cứng Cổng: <strong className="text-white">{barrierState === 'OPEN' ? 'MỞ BARRIER (OPEN_GATE)' : barrierState === 'LOCKED' ? 'KHÓA CỨNG (LOCK_SECURITY)' : 'ĐÓNG (GATE_IDLE)'}</strong></div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setBarrierState('OPEN')}
                      className="px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-500 text-emerald-300 text-xs font-semibold rounded-lg transition-colors"
                    >
                      Mở Cưỡng Bức
                    </button>
                    <button
                      type="button"
                      onClick={() => setBarrierState('CLOSED')}
                      className="px-3 py-1.5 bg-[#161B22] hover:bg-[#202936] border border-gray-600 text-gray-300 text-xs font-semibold rounded-lg transition-colors"
                    >
                      Đóng Cổng
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Realtime Access Verification Stream */}
        <div className="space-y-4">
          <div className="bg-[#121820] border border-[#222B35] rounded-xl p-4 space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#222B35] pb-2.5">
              <div className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#C5A880]" /> Nhật Ký Quét Cổng Thời Gian Thực
              </div>
              <span className="text-[10px] text-gray-400 font-mono">Live Logs</span>
            </div>

            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 text-xs">
              {scanHistory.map((log) => (
                <div 
                  key={log.id} 
                  className={`p-2.5 rounded-lg border transition-all ${
                    log.result === 'VALID'
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                      : log.result === 'EXPIRED'
                      ? 'bg-amber-950/30 border-amber-500/40 text-amber-300'
                      : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-[11px]">
                    <span className="flex items-center gap-1.5">
                      {log.result === 'VALID' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : log.result === 'EXPIRED' ? (
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-rose-400" />
                      )}
                      {log.title}
                    </span>
                    <span className="font-mono text-gray-400 text-[10px]">{log.timestamp}</span>
                  </div>
                  <div className="text-[10px] text-gray-400 font-mono truncate mt-1">
                    Mã: {log.qrCode}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
