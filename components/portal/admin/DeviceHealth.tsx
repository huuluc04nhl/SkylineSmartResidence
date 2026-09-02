'use client';

import React from 'react';
import { DEMO_DEVICES } from '@/lib/dataStore';
import { Activity, AlertTriangle, CheckCircle2, Wrench, Calendar, Sparkles } from 'lucide-react';

export default function DeviceHealth() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222B35] pb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-semibold">
            Hạ Tầng Tòa Nhà • IoT & Giám Sát Kỹ Thuật
          </div>
          <h2 className="font-serif text-2xl text-white font-bold mt-1">
            Chấm Điểm Tình Trạng Thiết Bị & Dự Báo Bảo Trì
          </h2>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-300">
          <span className="px-3 py-1 bg-[#161B22] border border-[#2D3748] text-[#C5A880]">
            AI IoT Monitoring: 4 Cụm Thiết Bị Lõi
          </span>
        </div>
      </div>

      {/* Grid of Devices */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {DEMO_DEVICES.map((device) => {
          const isDanger = device.health_score < 60;
          const isWarning = device.health_score >= 60 && device.health_score < 80;

          return (
            <div
              key={device.id}
              className="p-5 bg-[#121820] border border-[#222B35] space-y-4 hover:border-[#C5A880] transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2 py-0.5 bg-[#1C2533] border border-gray-700 text-gray-300 text-[10px] uppercase font-mono">
                    {device.category}
                  </span>
                  <h3 className="font-serif text-lg text-white font-bold mt-1">
                    {device.name}
                  </h3>
                  <div className="text-xs text-gray-400 mt-0.5">{device.location}</div>
                </div>

                <span className={`px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${
                  isDanger ? 'bg-red-950 text-red-400 border border-red-500' :
                  isWarning ? 'bg-amber-950 text-amber-400 border border-amber-500' :
                  'bg-emerald-950 text-emerald-400 border border-emerald-500'
                }`}>
                  {device.status}
                </span>
              </div>

              {/* Health Score Gauge */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400 flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-[#C5A880]" /> Điểm sức khỏe AI (Health Score):
                  </span>
                  <strong className={`font-mono text-sm ${
                    isDanger ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {device.health_score.toFixed(1)} / 100
                  </strong>
                </div>

                <div className="w-full h-2.5 bg-[#1C2533] border border-[#2D3748] overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 ${
                      isDanger ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${device.health_score}%` }}
                  ></div>
                </div>
              </div>

              {/* Maintenance Prediction info */}
              <div className="p-3 bg-[#161B22] border border-[#222B35] space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" /> AI Dự Báo Ngày Cần Bảo Dưỡng:
                  </span>
                  <strong className="text-[#C5A880] font-mono">{device.predict_date}</strong>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Lần bảo trì gần nhất:</span>
                  <span className="font-mono">{device.last_maintenance}</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button className="px-3 py-1.5 bg-[#1C2533] border border-gray-700 hover:border-gray-500 text-xs text-gray-300">
                  Xem Lý Lịch
                </button>
                <button className="px-3 py-1.5 bg-[#C5A880] text-[#0D1117] text-xs font-bold uppercase tracking-wider hover:bg-white transition-colors">
                  Tạo Phiếu Bảo Trì Dự Phòng
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
