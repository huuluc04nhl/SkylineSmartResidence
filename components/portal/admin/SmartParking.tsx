'use client';

import React, { useState } from 'react';
import { Car, ShieldCheck, AlertTriangle, Camera, Check, RefreshCw } from 'lucide-react';

export default function SmartParking() {
  const [occupancy, setOccupancy] = useState(88); // 88%
  const [barrierOpen, setBarrierOpen] = useState(false);
  const [lastScannedPlate, setLastScannedPlate] = useState('51K-988.24');
  const [scanResult, setScanResult] = useState<'MATCHED' | 'UNREGISTERED'>('MATCHED');

  const simulateVehicleEntry = (plate: string, isRegistered: boolean) => {
    setLastScannedPlate(plate);
    if (isRegistered) {
      setScanResult('MATCHED');
      setBarrierOpen(true);
      setTimeout(() => setBarrierOpen(false), 3000);
    } else {
      setScanResult('UNREGISTERED');
      setBarrierOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222B35] pb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-semibold">
            Module 3.2.15 (SRS Specification)
          </div>
          <h2 className="font-serif text-2xl text-white font-bold mt-1">
            Bãi Đỗ Xe Thông Minh & Camera Nhận Diện Biển Số (AI Smart Parking)
          </h2>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1 bg-[#161B22] border border-[#2D3748] text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Tốc độ đọc ALPR: &lt; 0.5s
          </span>
        </div>
      </div>

      {/* Capacity Bar */}
      <div className="p-5 bg-[#121820] border border-[#222B35] space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-300 font-semibold uppercase tracking-wider flex items-center gap-2">
            <Car className="w-4 h-4 text-[#C5A880]" /> Sức Chứa Hầm Xe B1 & B2
          </span>
          <span className="font-mono text-sm font-bold text-white">
            {occupancy}% / 100% ({Math.round(occupancy * 3.5)} / 350 xe)
          </span>
        </div>

        <div className="w-full h-3 bg-[#1C2533] border border-[#2D3748] overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              occupancy >= 95 ? 'bg-red-500' : occupancy >= 85 ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${occupancy}%` }}
          ></div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-gray-400">
          <span>* Ngưỡng cảnh báo tự động: 95% (Kích hoạt từ chối xe khách vãng lai để giữ chỗ cho cư dân)</span>
          <div className="flex gap-2">
            <button
              onClick={() => setOccupancy(88)}
              className="px-2 py-0.5 bg-[#1C2533] border border-gray-700 text-gray-300 hover:text-white"
            >
              88%
            </button>
            <button
              onClick={() => setOccupancy(96)}
              className="px-2 py-0.5 bg-red-950 border border-red-500 text-red-300 hover:bg-red-900"
            >
              96% (Test Cảnh Báo)
            </button>
          </div>
        </div>
      </div>

      {/* Simulation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Camera Feed Simulator */}
        <div className="bg-[#121820] border border-[#222B35] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#222B35] pb-3 text-xs">
            <span className="text-[#C5A880] uppercase tracking-wider font-semibold flex items-center gap-1.5">
              <Camera className="w-4 h-4" /> Camera ALPR Làn Vào Số 01 (Hầm B1)
            </span>
            <span className="font-mono text-gray-400">60 FPS • HD 1080P</span>
          </div>

          <div className="relative h-56 bg-black border border-gray-800 flex items-center justify-center overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80"
              alt="Car Entry"
              className="w-full h-full object-cover opacity-60"
            />
            {/* AI Bounding Box Overlay */}
            <div className="absolute inset-x-12 bottom-6 border-2 border-emerald-500 p-2 bg-black/60 flex items-center justify-between">
              <div className="font-mono text-base text-emerald-400 font-bold tracking-widest">
                [ {lastScannedPlate} ]
              </div>
              <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950 px-2 py-0.5 border border-emerald-500">
                ALPR MATCHED &lt; 0.38s
              </span>
            </div>
          </div>

          {/* Test Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => simulateVehicleEntry('51K-988.24', true)}
              className="flex-1 py-2 bg-[#1C2533] border border-[#C5A880] text-[#C5A880] text-xs font-semibold uppercase tracking-wider hover:bg-[#C5A880] hover:text-[#0D1117] transition-all"
            >
              Xe Cư Dân (51K-988.24)
            </button>
            <button
              onClick={() => simulateVehicleEntry('29A-123.45', false)}
              className="flex-1 py-2 bg-[#1C2533] border border-gray-700 text-gray-300 text-xs font-semibold uppercase tracking-wider hover:border-gray-500 transition-all"
            >
              Xe Vãng Lai (29A-123.45)
            </button>
          </div>
        </div>

        {/* Right: Barrier Status & Match Result */}
        <div className="bg-[#121820] border border-[#222B35] p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-[#222B35] pb-3 text-xs uppercase tracking-wider text-[#C5A880] font-semibold">
              Trạng Thái Barrier & Đối Soát Danh Sách Cư Dân
            </div>

            <div className="p-4 bg-[#161B22] border border-[#222B35] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Biển số quét:</span>
                <span className="font-mono font-bold text-white text-sm">{lastScannedPlate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Chủ xe hợp pháp:</span>
                <span className="text-gray-200">
                  {scanResult === 'MATCHED' ? 'Nguyễn Hữu Lực (Căn 12A05)' : 'Khách Vãng Lai / Chưa Đăng Ký'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Vị trí đỗ cố định:</span>
                <span className="text-[#C5A880] font-mono">
                  {scanResult === 'MATCHED' ? 'Ô B1-42 (Khu VIP)' : 'Cần mua vé lượt'}
                </span>
              </div>
            </div>

            <div className="p-4 border text-center space-y-1" style={{
              backgroundColor: barrierOpen ? 'rgba(6, 78, 59, 0.4)' : 'rgba(30, 41, 59, 0.4)',
              borderColor: barrierOpen ? '#10B981' : '#475569'
            }}>
              <div className="text-xs uppercase tracking-widest text-gray-400">Trạng Thái Rào Chắn (Barrier)</div>
              <div className={`font-serif text-2xl font-bold ${barrierOpen ? 'text-emerald-400' : 'text-gray-300'}`}>
                {barrierOpen ? 'BARRIER ĐANG MỞ (TỰ ĐỘNG QUA)' : 'BARRIER ĐANG ĐÓNG'}
              </div>
            </div>
          </div>

          <div className="text-[11px] text-gray-500 italic">
            * Toàn bộ lịch sử ra/vào hầm được mã hóa và lưu trữ tại bảng CSDL `visitor_logs` và `vehicles`.
          </div>
        </div>
      </div>
    </div>
  );
}
