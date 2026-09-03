'use client';

import React, { useState, useEffect } from 'react';
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
  Filter
} from 'lucide-react';
import { 
  verifyVisitorQr,
  VerificationScanResult,
  getGateAuditLogs,
  GateAuditLog
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

  const refreshLogs = () => {
    setScanHistory([...getGateAuditLogs()]);
  };

  useEffect(() => {
    refreshLogs();
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

  const filteredLogs = scanHistory.filter(l => {
    if (filterResult === 'ALL') return true;
    return l.result === filterResult;
  });

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
            Hệ thống tự động xác thực chữ ký số mã QR căn hộ, tự động điều khiển Barrier và phân quyền thang máy
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
            <strong>Bảo Mật Quyền Riêng Tư:</strong> Ban Quản Lý chỉ kiểm tra tính hợp lệ của mã ra vào qua hệ thống máy quét. Không lưu vết thông tin cá nhân khách thăm để đảm bảo quyền riêng tư của từng căn hộ.
          </span>
        </div>
        <span className="text-[10px] text-cyan-400 font-mono px-2 py-0.5 bg-cyan-950 rounded border border-cyan-800 flex-shrink-0 ml-2">
          Zero-Dossier Privacy
        </span>
      </div>

      {/* MAIN SCANNER CONTROLLER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Scanner Terminal */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-5 bg-gradient-to-r from-[#121820] to-[#161D26] border border-[#C5A880]/70 rounded-xl space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222B35] pb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-[#C5A880]" />
                <div>
                  <h3 className="font-serif text-base font-bold text-white">Máy Quét Mã QR Cổng (Gate Security Scanner)</h3>
                  <div className="text-[11px] text-gray-400">Tự động phân loại: Vé 1 Lần (Shipper) & Vé Nhiều Lần (Khách Thăm)</div>
                </div>
              </div>

              {/* Checkpoint selector */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-400">Trạm quét:</span>
                <select
                  value={selectedCheckpoint}
                  onChange={(e) => setSelectedCheckpoint(e.target.value)}
                  className="bg-[#161B22] border border-[#2D3748] text-xs text-[#C5A880] font-semibold py-1 px-2.5 rounded-lg outline-none"
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
                className="p-3.5 bg-emerald-950/70 hover:bg-emerald-900 border-2 border-emerald-500 rounded-xl text-left transition-all shadow-lg group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5 uppercase">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 1. Mã QR Đúng
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
                className="p-3.5 bg-amber-950/70 hover:bg-amber-900 border-2 border-amber-500 rounded-xl text-left transition-all shadow-lg group"
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
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm sm:text-base">{scanResult.title}</span>
                      {scanResult.entryType && (
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${
                          scanResult.entryType === 'SINGLE'
                            ? 'bg-amber-950 text-amber-300 border-amber-500'
                            : 'bg-cyan-950 text-cyan-300 border-cyan-500'
                        }`}>
                          {scanResult.entryType === 'SINGLE' ? 'Vé 1 Lần (Shipper)' : 'Vé Nhiều Lần'}
                        </span>
                      )}
                    </div>
                    <div className="text-gray-200">{scanResult.message}</div>
                    {scanResult.apartmentCode && (
                      <div className="text-[11px] text-[#C5A880] pt-1 font-semibold">
                        • Căn hộ bảo lãnh: Căn {scanResult.apartmentCode} • Lệnh phần cứng: {scanResult.gateAction}
                      </div>
                    )}
                    <div className="text-[10px] text-gray-400 pt-0.5">
                      Thời gian: {scanResult.scannedAt} • Trạm quét: {scanResult.checkpoint}
                    </div>
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

        {/* Right 1 Col: Realtime Access Security Audit Stream */}
        <div className="space-y-4">
          <div className="bg-[#121820] border border-[#222B35] rounded-xl p-4 space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#222B35] pb-2.5">
              <div className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#C5A880]" /> Nhật Ký An Ninh Cổng Barrier
              </div>
              <button 
                onClick={refreshLogs}
                className="text-[10px] text-gray-400 hover:text-[#C5A880] flex items-center gap-1 font-mono transition-colors"
              >
                <RefreshCw className="w-3 h-3" /> Làm mới
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1 bg-[#161B22] p-1 rounded-lg border border-[#222B35] text-[10px]">
              <button
                type="button"
                onClick={() => setFilterResult('ALL')}
                className={`flex-1 py-1 rounded transition-colors ${filterResult === 'ALL' ? 'bg-[#C5A880] text-[#0D1117] font-bold' : 'text-gray-400'}`}
              >
                Tất Cả
              </button>
              <button
                type="button"
                onClick={() => setFilterResult('VALID')}
                className={`flex-1 py-1 rounded transition-colors ${filterResult === 'VALID' ? 'bg-emerald-500 text-black font-bold' : 'text-gray-400'}`}
              >
                Hợp Lệ
              </button>
              <button
                type="button"
                onClick={() => setFilterResult('INVALID')}
                className={`flex-1 py-1 rounded transition-colors ${filterResult === 'INVALID' ? 'bg-rose-500 text-white font-bold' : 'text-gray-400'}`}
              >
                Khóa
              </button>
              <button
                type="button"
                onClick={() => setFilterResult('EXPIRED')}
                className={`flex-1 py-1 rounded transition-colors ${filterResult === 'EXPIRED' ? 'bg-amber-500 text-black font-bold' : 'text-gray-400'}`}
              >
                Quá Hạn
              </button>
            </div>

            {/* Audit Log Stream */}
            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1 text-xs">
              {filteredLogs.map((log) => (
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
                      Căn: {log.apartmentCode}
                    </span>
                    <span className="font-mono text-gray-400 text-[9px]">{log.timestamp}</span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-gray-300 mt-1">
                    <span>Mục đích: <strong>{log.purposeLabel}</strong></span>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono ${
                      log.entryType === 'SINGLE' ? 'bg-amber-950 text-amber-300 border border-amber-700' : 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                    }`}>
                      {log.entryType === 'SINGLE' ? '⚡ 1 Lần' : '🔁 Nhiều Lần'}
                    </span>
                  </div>

                  <div className="text-[10px] text-gray-400 flex items-center justify-between mt-1 pt-1 border-t border-[#222B35]/60">
                    <span>📍 {log.checkpoint}</span>
                    <span className="text-gray-200 font-medium truncate max-w-[150px]">{log.gateAction}</span>
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
