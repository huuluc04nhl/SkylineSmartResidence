'use client';

import React, { useState } from 'react';
import { 
  CreditCard, 
  QrCode, 
  ScanFace, 
  CheckCircle2, 
  Sparkles, 
  Star, 
  Users, 
  Clock, 
  ShieldCheck, 
  Waves, 
  Dumbbell, 
  Flame, 
  Smile, 
  UtensilsCrossed, 
  History,
  DoorOpen,
  Volume2
} from 'lucide-react';
import { User, DEMO_FACILITIES } from '@/lib/dataStore';
import SkylineLogo from '@/components/shared/SkylineLogo';
import ResidentSmartCard from './ResidentSmartCard';

interface SmartFacilityPassProps {
  currentUser: User;
}

export default function SmartFacilityPass({ currentUser }: SmartFacilityPassProps) {
  const aptCode = currentUser.apartment_code || '12A05';

  // Facilities with Live Smart Turnstile / Barrier Data
  const amenitiesList = [
    {
      id: 'fac-pool',
      name: 'Hồ Bơi Vô Cực Panoramic Sky Pool',
      location: 'Tầng 25 (Sân Thượng Tháp Sapphire)',
      hours: '06:00 - 22:00',
      density: '20% (Rất vắng)',
      temp: '28°C',
      image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600&auto=format&fit=crop&q=80',
      icon: Waves,
      barrierStatus: 'CLOSED',
    },
    {
      id: 'fac-gym',
      name: 'Trung Tâm Thể Hình Đẳng Cấp Technogym',
      location: 'Tầng 3 (Khu Tiện Ích Chung)',
      hours: 'Mở cửa 24/7',
      density: '42% (Bình thường)',
      temp: '22°C',
      image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=80',
      icon: Dumbbell,
      barrierStatus: 'CLOSED',
    },
    {
      id: 'fac-sauna',
      name: 'Phòng Xông Hơi Đá Muối Himalaya & Jacuzzi',
      location: 'Tầng 3 (Khu Chăm Sóc Sức Khỏe)',
      hours: '08:00 - 21:30',
      density: '15% (Thoáng đãng)',
      temp: '45°C',
      image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&auto=format&fit=crop&q=80',
      icon: Flame,
      barrierStatus: 'CLOSED',
    },
    {
      id: 'fac-kids',
      name: 'Khu Vui Chơi Trẻ Em Sky Kids Zone',
      location: 'Tầng 1 (Sảnh Thương Mại)',
      hours: '07:00 - 21:00',
      density: '35% (Vừa)',
      temp: '24°C',
      image: 'https://images.unsplash.com/photo-1566454544259-f4b94c3d758c?w=600&auto=format&fit=crop&q=80',
      icon: Smile,
      barrierStatus: 'CLOSED',
    },
    {
      id: 'fac-bbq',
      name: 'Vườn Nướng Sky BBQ Panoramic Sân Thượng',
      location: 'Tầng 25 (Khu Vườn Nhật Bản)',
      hours: '17:00 - 23:00',
      density: 'Sẵn sàng 4/6 chòi nướng',
      temp: 'Gió trời',
      image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
      icon: UtensilsCrossed,
      barrierStatus: 'CLOSED',
    },
  ];

  const [activeBarrierId, setActiveBarrierId] = useState<string | null>(null);
  const [welcomeMessage, setWelcomeMessage] = useState<string | null>(null);
  const [accessLogs, setAccessLogs] = useState([
    {
      id: 'log-1',
      facilityName: 'Hồ Bơi Vô Cực Sky Pool',
      time: 'Hôm nay, 06:15',
      method: 'FaceID Biometric (0.3s)',
      user: currentUser?.full_name || (currentUser as any)?.fullname || 'Cư dân',
    },
    {
      id: 'log-2',
      facilityName: 'Phòng Tập Technogym',
      time: 'Hôm qua, 18:30',
      method: 'Thẻ Cư Dân NFC',
      user: currentUser?.full_name || (currentUser as any)?.fullname || 'Cư dân',
    },
  ]);

  const userName = currentUser?.full_name || (currentUser as any)?.fullname || 'Cư Dân';

  const handleTapToAccess = (fac: typeof amenitiesList[0]) => {
    setActiveBarrierId(fac.id);
    const msg = `🎉 Cổng ${fac.name} đã mở tự động! Xin chào cư dân Căn ${aptCode} (${userName}). Chúc bạn có thời gian tận hưởng tuyệt vời!`;
    setWelcomeMessage(msg);

    // Add to access logs
    const newLog = {
      id: `log-${Date.now()}`,
      facilityName: fac.name,
      time: 'Vừa xong',
      method: 'Thẻ Cư Dân 1-Chạm & FaceID',
      user: userName,
    };
    setAccessLogs(prev => [newLog, ...prev]);

    // Reset barrier state after 4 seconds
    setTimeout(() => {
      setActiveBarrierId(null);
    }, 4500);
  };

  return (
    <div className="space-y-6 w-full animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222B35] pb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Tiện Ích Đặc Quyền Cư Dân • Không Chạm
          </div>
          <h2 className="font-serif text-2xl text-white font-bold mt-1">
            Quẹt Thẻ & Quét FaceID Tiện Ích 5 Sao
          </h2>
        </div>

        <div className="text-xs text-gray-300 bg-[#121820] border border-[#222B35] px-3.5 py-2 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Quyền Lợi Cư Dân: <strong>Sử Dụng Không Giới Hạn</strong></span>
        </div>
      </div>

      {/* Top Section: VIP 3D Resident Smart Business Card */}
      <div className="p-6 bg-[#121820] border border-[#222B35] space-y-4 shadow-2xl">
        <div className="border-b border-[#222B35] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#C5A880] font-bold">
              Thẻ Thông Minh Không Chạm (VIP Smart Access Card)
            </div>
            <h3 className="font-serif text-lg text-white font-bold">
              Thẻ Cư Dân Kim Loại Mạ Vàng Căn {aptCode}
            </h3>
          </div>
          <div className="text-[11px] text-gray-400 font-mono">
            Tự động kích hoạt FaceID & RFID 13.56 MHz
          </div>
        </div>

        <ResidentSmartCard 
          currentUser={currentUser} 
          onTapSuccess={(fac) => {
            const msg = `🎉 Cổng ${fac} đã mở tự động! Xin chào cư dân Căn ${aptCode} (${currentUser.full_name}).`;
            setWelcomeMessage(msg);
            setTimeout(() => setWelcomeMessage(null), 4000);
          }}
        />
      </div>

      {/* Welcoming Barrier Opening Banner */}
      {welcomeMessage && (
        <div className="p-4 bg-[#122A1E] border-2 border-emerald-500 text-emerald-200 text-xs font-medium flex items-center justify-between animate-fadeIn shadow-2xl">
          <div className="flex items-center gap-3">
            <DoorOpen className="w-6 h-6 text-emerald-400 animate-bounce" />
            <span className="text-sm font-semibold">{welcomeMessage}</span>
          </div>
          <span className="px-2.5 py-1 bg-emerald-900 text-emerald-300 text-[10px] font-mono uppercase font-bold border border-emerald-400">
            BARRIER OPEN (0.3s)
          </span>
        </div>
      )}

      {/* Facilities 1-Tap Grid */}
      <div className="space-y-3">
        <div className="text-xs uppercase tracking-wider text-[#C5A880] font-bold">
          Danh Sách Tiện Ích 5 Sao (Chạm Để Mở Cổng Tự Động):
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {amenitiesList.map((fac) => {
            const Icon = fac.icon;
            const isOpening = activeBarrierId === fac.id;

            return (
              <div
                key={fac.id}
                className={`bg-[#121820] border transition-all flex flex-col justify-between overflow-hidden group ${
                  isOpening ? 'border-emerald-500 ring-2 ring-emerald-500 shadow-xl' : 'border-[#222B35] hover:border-[#C5A880]/60'
                }`}
              >
                {/* Facility Image with Live Overlay */}
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={fac.image}
                    alt={fac.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#121820] via-transparent to-transparent"></div>

                  <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-sm border border-[#222B35] px-2 py-1 text-[10px] text-white flex items-center gap-1.5 font-mono">
                    <Clock className="w-3 h-3 text-[#C5A880]" />
                    {fac.hours}
                  </div>

                  <div className="absolute bottom-2 left-3 text-white">
                    <div className="text-xs font-bold font-serif flex items-center gap-1.5">
                      <Icon className="w-4 h-4 text-[#C5A880]" />
                      {fac.name}
                    </div>
                    <div className="text-[10px] text-gray-400">{fac.location}</div>
                  </div>
                </div>

                {/* Status Metrics Strip */}
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-[11px] border-b border-[#222B35] pb-3">
                    <div>
                      <div className="text-[10px] text-gray-400 uppercase tracking-wider">Mật Độ Sử Dụng:</div>
                      <div className="font-semibold text-emerald-400 mt-0.5 flex items-center gap-1">
                        <Users className="w-3 h-3" /> {fac.density}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400 uppercase tracking-wider">Môi Trường:</div>
                      <div className="font-semibold text-gray-200 mt-0.5">{fac.temp}</div>
                    </div>
                  </div>

                  {/* 1-Tap Access Button */}
                  <button
                    onClick={() => handleTapToAccess(fac)}
                    disabled={isOpening}
                    className={`w-full py-2.5 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                      isOpening
                        ? 'bg-emerald-600 text-white animate-pulse'
                        : 'bg-[#C5A880] hover:bg-white text-[#0D1117] shadow-md'
                    }`}
                  >
                    {isOpening ? (
                      <>
                        <DoorOpen className="w-4 h-4" /> ĐANG MỞ CỔNG BARRIER...
                      </>
                    ) : (
                      <>
                        <ScanFace className="w-4 h-4" /> Quẹt Thẻ / Quét FaceID Vào Cửa
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Facility Access History */}
      <div className="p-5 bg-[#121820] border border-[#222B35] space-y-3">
        <div className="text-xs uppercase tracking-wider text-[#C5A880] font-bold flex items-center gap-2">
          <History className="w-3.5 h-3.5" /> Lịch Sử Ra Vào Tiện Ích Tự Động (Gần Đây):
        </div>

        <div className="divide-y divide-[#222B35]">
          {accessLogs.map((log) => (
            <div key={log.id} className="py-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="font-semibold text-white">{log.facilityName}</div>
                  <div className="text-[10px] text-gray-400">{log.user} • {log.method}</div>
                </div>
              </div>
              <div className="text-[11px] text-[#C5A880] font-mono">{log.time}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
