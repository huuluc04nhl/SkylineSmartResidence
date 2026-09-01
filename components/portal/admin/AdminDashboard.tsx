'use client';

import React, { useState } from 'react';
import { 
  DEMO_SECURITY_ALERTS, 
  DEMO_TICKETS, 
  DEMO_BILLS, 
  DEMO_DEVICES,
  SecurityAlert 
} from '@/lib/dataStore';
import { 
  ShieldAlert, 
  Activity, 
  Receipt, 
  Wrench, 
  Car, 
  Flame, 
  Eye, 
  Radio, 
  CheckCircle2, 
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Sparkles,
  Bell,
  Cpu,
  Server,
  Zap,
  Users,
  Building
} from 'lucide-react';

export default function AdminDashboard() {
  const [selectedFloor, setSelectedFloor] = useState<'B1' | 'L1' | '12' | '25'>('B1');
  const [activeAlert, setActiveAlert] = useState<SecurityAlert>(DEMO_SECURITY_ALERTS[0]);
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);

  const handleDispatchSecurity = () => {
    setDispatchStatus('📡 Đã gửi lệnh điều động Đội Bảo Vệ Trực Ban đến vị trí Hầm B1 (SLA 3 phút)!');
    setTimeout(() => setDispatchStatus(null), 5000);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Module Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222B35] pb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-bold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Module 3.2.6 & 3.2.10 • SRS Architecture
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl text-white font-bold mt-1 tracking-wide">
            Trung Tâm Điều Hành Trung Ương (SOC Command Center)
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Giám sát 24/7 toàn bộ hạ tầng BMS, Thị giác máy tính YOLOv8, Radar PCCC & Chỉ số cư dân
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs flex-shrink-0">
          <span className="flex items-center gap-2 px-3 py-1.5 bg-[#121820] border border-emerald-500/50 text-emerald-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>Vision AI Radar: ACTIVE (12 Kênh)</span>
          </span>
        </div>
      </div>

      {/* 4 Core KPI Cards with Luxury Trend Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="p-5 bg-[#121820] border border-[#222B35] space-y-2 hover:border-[#C5A880]/60 transition-colors shadow-lg">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Doanh Thu Tháng 08/2026</span>
            <Receipt className="w-4 h-4 text-[#C5A880]" />
          </div>
          <div className="font-serif text-2xl text-white font-bold">1.845.200.000 đ</div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
            <TrendingUp className="w-3.5 h-3.5" /> +8.4% so với tháng trước
          </div>
        </div>

        {/* KPI 2 */}
        <div className="p-5 bg-[#121820] border border-[#222B35] space-y-2 hover:border-[#C5A880]/60 transition-colors shadow-lg">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Tỷ Lệ Thu Hồi Công Nợ</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-serif text-2xl text-white font-bold">94.8%</div>
          <div className="text-[11px] text-gray-400 font-mono">Còn 12 hóa đơn chưa thanh toán</div>
        </div>

        {/* KPI 3 */}
        <div className="p-5 bg-[#121820] border border-[#222B35] space-y-2 hover:border-[#C5A880]/60 transition-colors shadow-lg">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Sự Cố Đang Xử Lý (Kanban)</span>
            <Wrench className="w-4 h-4 text-amber-400" />
          </div>
          <div className="font-serif text-2xl text-white font-bold">03 Phiếu</div>
          <div className="text-[11px] text-amber-400 flex items-center gap-1 font-mono">
            <AlertTriangle className="w-3.5 h-3.5" /> 1 phiếu sắp chạm ngưỡng SLA
          </div>
        </div>

        {/* KPI 4 */}
        <div className="p-5 bg-[#121820] border border-[#222B35] space-y-2 hover:border-[#C5A880]/60 transition-colors shadow-lg">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Sức Chứa Hầm Xe (ALPR)</span>
            <Car className="w-4 h-4 text-[#C5A880]" />
          </div>
          <div className="font-serif text-2xl text-white font-bold">88% / 100%</div>
          <div className="text-[11px] text-emerald-400 font-mono">Bình thường (&lt; 95% threshold)</div>
        </div>
      </div>

      {/* Main Section: Live Security Alert Map & Vision AI Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Building Radar Sơ đồ Tòa nhà 3D Tương tác */}
        <div className="lg:col-span-7 bg-[#121820] border border-[#222B35] p-6 space-y-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222B35] pb-3">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-red-500 animate-pulse" />
              <span className="font-serif text-base text-white font-bold">
                Bản Đồ Cảnh Báo An Ninh Trực Tuyến (Live Alert Radar)
              </span>
            </div>
            <div className="flex gap-1 border border-[#2D3748] bg-[#0D1117] p-0.5">
              {(['B1', 'L1', '12', '25'] as const).map((floor) => (
                <button
                  key={floor}
                  type="button"
                  onClick={() => setSelectedFloor(floor)}
                  className={`px-3 py-1 text-xs font-mono font-semibold transition-colors ${
                    selectedFloor === floor
                      ? 'bg-[#C5A880] text-[#0D1117] font-bold'
                      : 'text-gray-400 hover:bg-[#1C2533] hover:text-white'
                  }`}
                >
                  Tầng {floor}
                </button>
              ))}
            </div>
          </div>

          {/* Sơ đồ radar mô phỏng */}
          <div className="relative h-72 bg-[#0A0E14] border border-[#222B35] flex items-center justify-center overflow-hidden">
            {/* Background grid line architectural */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#161B22_1px,transparent_1px),linear-gradient(to_bottom,#161B22_1px,transparent_1px)] bg-[size:24px_24px] opacity-40"></div>

            {/* Simulated floor blueprint representation */}
            <div className="relative z-10 w-4/5 h-4/5 border border-dashed border-gray-700 flex flex-col justify-between p-4">
              <div className="flex justify-between text-[11px] font-mono text-gray-500">
                <span>Trục Tháp A (Sapphire) - Khu Vực Tầng {selectedFloor}</span>
                <span>Camera AI: 12 Kênh Active</span>
              </div>

              {/* Pinpoint 1: Active Alert on Floor B1 */}
              {selectedFloor === 'B1' && (
                <div 
                  onClick={() => setActiveAlert(DEMO_SECURITY_ALERTS[0])}
                  className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                >
                  <div className="relative flex items-center justify-center">
                    <span className="w-8 h-8 rounded-full bg-red-600/40 animate-ping absolute"></span>
                    <span className="w-4 h-4 rounded-full bg-red-600 border border-white flex items-center justify-center text-[9px] text-white font-bold shadow-lg">
                      !
                    </span>
                  </div>
                  <div className="mt-1 px-2 py-0.5 bg-red-950/90 border border-red-500 text-red-300 text-[10px] whitespace-nowrap shadow-lg font-mono font-bold">
                    CAM-B1-08: Phát hiện khói (96%)
                  </div>
                </div>
              )}

              {/* Normal status markers */}
              <div className="flex justify-around">
                <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Thang máy #01: Hoạt động êm
                </div>
                <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Cửa thoát hiểm: An toàn
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
            <span>* Chấm nhấp nháy đỏ biểu thị sự cố an ninh/cháy nổ do Camera Vision AI phát hiện tự động.</span>
          </div>
        </div>

        {/* Right: Snapshot & Instant Action Panel */}
        <div className="lg:col-span-5 bg-[#121820] border border-[#222B35] p-6 space-y-4 flex flex-col justify-between shadow-xl">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#222B35] pb-3">
              <span className="text-xs uppercase tracking-wider text-[#C5A880] font-semibold flex items-center gap-1.5">
                <Eye className="w-4 h-4" /> Chi Tiết Snapshot Vision AI
              </span>
              <span className="px-2 py-0.5 bg-red-900/60 border border-red-500 text-red-300 text-[10px] font-mono font-bold">
                Độ Tin Cậy: {(activeAlert.confidence * 100).toFixed(0)}%
              </span>
            </div>

            {/* Snapshot Image */}
            <div className="relative border border-red-500/50 h-44 overflow-hidden shadow-inner">
              <img
                src={activeAlert.snapshot_url}
                alt="Camera AI Snapshot"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 bg-black/80 px-2 py-0.5 text-[10px] font-mono text-red-400 border border-red-800">
                LIVE SNAPSHOT: {activeAlert.camera_id}
              </div>
              <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-0.5 text-[10px] font-mono text-gray-300">
                {activeAlert.created_at}
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-gray-300 bg-[#161B22] p-3 border border-[#222B35]">
              <div className="flex justify-between">
                <span className="text-gray-400">Loại sự cố:</span>
                <strong className="text-red-400 uppercase font-semibold">{activeAlert.title}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Vị trí phát hiện:</span>
                <span className="font-mono text-white">{activeAlert.location}</span>
              </div>
            </div>

            {/* Dispatch feedback toast */}
            {dispatchStatus && (
              <div className="p-2.5 bg-blue-950/80 border border-blue-500 text-blue-300 text-xs font-mono animate-fadeIn">
                {dispatchStatus}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-[#222B35] space-y-2">
            <button
              onClick={() => setIsEmergencyActive(!isEmergencyActive)}
              className={`w-full py-3 text-xs uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-2 ${
                isEmergencyActive
                  ? 'bg-red-600 text-white animate-pulse shadow-lg'
                  : 'bg-red-950/80 border border-red-500 text-red-300 hover:bg-red-900'
              }`}
            >
              <Flame className="w-4 h-4" />
              {isEmergencyActive ? 'ĐÃ KÍCH HOẠT CHUÔNG BÁO PCCC KHẨN CẤP' : 'Kích Hoạt Chuông Báo PCCC Khẩn Cấp'}
            </button>
            <button 
              onClick={handleDispatchSecurity}
              className="w-full py-2.5 bg-[#1C2533] hover:bg-[#253042] border border-gray-700 hover:border-[#C5A880] text-gray-200 hover:text-white text-xs uppercase tracking-wider font-semibold transition-colors"
            >
              Điều Phối Đội Bảo Vệ Đến Hiện Trường Ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
