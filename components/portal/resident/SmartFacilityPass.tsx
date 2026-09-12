'use client';

import React, { useState, useEffect } from 'react';
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
  CalendarCheck,
  Calendar,
  XCircle,
  Plus,
  ArrowRight,
  Check,
  Wifi
} from 'lucide-react';
import { User } from '@/lib/dataStore';
import SkylineLogo from '@/components/shared/SkylineLogo';
import ResidentSmartCard from './ResidentSmartCard';
import { 
  getFacilityCheckinLogs, 
  addFacilityCheckinLog, 
  getFacilityBookings, 
  createFacilityBooking, 
  cancelFacilityBooking,
  getFacilityMonthlyQuota,
  FacilityCheckinLog,
  FacilityBooking
} from '@/lib/facilityStore';

interface SmartFacilityPassProps {
  currentUser: User;
}

export default function SmartFacilityPass({ currentUser }: SmartFacilityPassProps) {
  const aptCode = currentUser.apartment_code || '12A05';
  const isOwner = currentUser.role === 'OWNER';
  const userName = currentUser?.full_name || (currentUser as any)?.fullname || 'Cư Dân';

  const [activeTab, setActiveTab] = useState<'ACCESS' | 'BOOKING'>('ACCESS');

  // Facilities with Live Smart Turnstile / Barrier Data
  const amenitiesList = [
    {
      id: 'fac-pool',
      name: 'Hồ Bơi Vô Cực Panoramic Sky Pool',
      location: 'Tầng 25 (Sân Thượng Tòa Chung Cư)',
      hours: '06:00 - 22:00',
      density: '20% (Rất vắng)',
      temp: '28°C',
      image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600&auto=format&fit=crop&q=80',
      icon: Waves,
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
    },
  ];

  const [activeBarrierId, setActiveBarrierId] = useState<string | null>(null);
  const [welcomeMessage, setWelcomeMessage] = useState<string | null>(null);
  
  // Dữ liệu thực tế từ facilityStore (Không dữ liệu ảo)
  const [accessLogs, setAccessLogs] = useState<FacilityCheckinLog[]>(() => getFacilityCheckinLogs(aptCode));
  const [bookings, setBookings] = useState<FacilityBooking[]>(() => getFacilityBookings(aptCode));
  const [quota, setQuota] = useState(() => getFacilityMonthlyQuota(aptCode));

  // Form đặt chỗ tiện ích
  const todayStr = new Date().toISOString().split('T')[0];
  const [bookingFacilityId, setBookingFacilityId] = useState('fac-bbq');
  const [bookingDate, setBookingDate] = useState(todayStr);
  const [bookingTimeSlot, setBookingTimeSlot] = useState('18:00 - 20:00 (Buổi tối)');
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const handleLogAdded = () => {
      setAccessLogs(getFacilityCheckinLogs(aptCode));
    };
    const handleBooked = () => {
      setBookings(getFacilityBookings(aptCode));
      setQuota(getFacilityMonthlyQuota(aptCode));
    };

    window.addEventListener('skyline_facility_log_added', handleLogAdded);
    window.addEventListener('skyline_facility_booked', handleBooked);

    return () => {
      window.removeEventListener('skyline_facility_log_added', handleLogAdded);
      window.removeEventListener('skyline_facility_booked', handleBooked);
    };
  }, [aptCode]);

  // Quẹt thẻ / FaceID vào cổng tiện ích thực tế
  const handleTapToAccess = (fac: typeof amenitiesList[0]) => {
    if (activeBarrierId) return;
    setActiveBarrierId(fac.id);
    const msg = `🎉 Cổng ${fac.name} đã mở tự động! Xin chào cư dân Căn ${aptCode} (${userName}). Chúc bạn có thời gian tận hưởng tuyệt vời!`;
    setWelcomeMessage(msg);

    // Lưu vào facilityStore thực tế
    const updated = addFacilityCheckinLog(aptCode, {
      facilityId: fac.id,
      facilityName: fac.name,
      userName: userName,
      role: isOwner ? 'Chủ Hộ (Master)' : 'Người Nhà',
      method: 'NFC_CARD',
      cardUid: `NFC-SKY-${aptCode}-01`,
      status: 'SUCCESS',
      detail: `Quẹt thẻ NFC 1-chạm tại cổng Barrier ${fac.name} (${fac.location}) • Cổng mở 0.3s`
    });
    setAccessLogs(updated);

    setTimeout(() => {
      setActiveBarrierId(null);
      setWelcomeMessage(null);
    }, 4000);
  };

  // Xác nhận đặt chỗ tiện ích
  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault();
    const fac = amenitiesList.find(f => f.id === bookingFacilityId) || amenitiesList[4];
    const pricing = fac.id === 'fac-bbq' ? '200.000 đ / lượt (Phí dọn dẹp)' : 'Miễn phí cho cư dân';
    
    const { bookings: updated, newBooking } = createFacilityBooking(
      aptCode,
      fac.id,
      fac.name,
      bookingDate,
      bookingTimeSlot,
      userName,
      pricing
    );
    setBookings(updated);
    setQuota(getFacilityMonthlyQuota(aptCode));
    setBookingSuccessMsg(`🎉 Đặt chỗ thành công! Mã vé điện tử của bạn: ${newBooking.ticketCode}`);
    setTimeout(() => setBookingSuccessMsg(null), 5000);
  };

  // Hủy đặt chỗ
  const handleCancelBooking = (id: string) => {
    const updated = cancelFacilityBooking(aptCode, id);
    setBookings(updated);
    setQuota(getFacilityMonthlyQuota(aptCode));
  };

  return (
    <div className="space-y-6 w-full animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222B35] pb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Tiện Ích Đặc Quyền Cư Dân Skyline • 5 Sao Quốc Tế
          </div>
          <h2 className="font-serif text-2xl text-white font-bold mt-1">
            Trung Tâm Tiện Ích & Thẻ Cư Dân Không Chạm
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Quẹt thẻ NFC / FaceID qua cổng kiểm soát thông minh & Đặt lịch tiện ích đặc quyền Căn {aptCode}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs text-gray-300 bg-[#121820] border border-[#222B35] px-3.5 py-2 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Hạn mức tháng: <strong className="text-[#C5A880] font-mono">{quota.remaining} / {quota.max} lượt</strong></span>
          </div>
        </div>
      </div>

      {/* Segmented Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#222B35] pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('ACCESS')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-2 ${
            activeTab === 'ACCESS'
              ? 'bg-[#C5A880] text-[#0D1117] shadow-lg'
              : 'bg-[#121820] text-gray-400 hover:text-white border border-[#222B35]'
          }`}
        >
          <DoorOpen className="w-4 h-4" />
          <span>1. Cổng Kiểm Soát Tiện Ích (Quẹt Thẻ & FaceID)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('BOOKING')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-2 ${
            activeTab === 'BOOKING'
              ? 'bg-[#C5A880] text-[#0D1117] shadow-lg'
              : 'bg-[#121820] text-gray-400 hover:text-white border border-[#222B35]'
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          <span>2. Đặt Chỗ Tiện Ích Đặc Quyền ({bookings.filter(b => b.status === 'CONFIRMED').length})</span>
        </button>
      </div>

      {/* ============================================================= */}
      {/* TAB 1: CỔNG KIỂM SOÁT TIỆN ÍCH (QUẸT THẺ & FACEID TỰ ĐỘNG)    */}
      {/* ============================================================= */}
      {activeTab === 'ACCESS' && (
        <div className="space-y-6">
          {/* Top Section: VIP 3D Resident Smart Business Card */}
          <div className="p-6 bg-[#121820] border border-[#222B35] space-y-4 shadow-2xl rounded-xl">
            <div className="border-b border-[#222B35] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-[#C5A880] font-bold">
                  Thẻ Thông Minh Không Chạm (VIP Smart Access Card)
                </div>
                <h3 className="font-serif text-lg text-white font-bold">
                  Thẻ Cư Dân Kim Loại Mạ Vàng Căn {aptCode}
                </h3>
              </div>
              <div className="text-[11px] text-gray-400 font-mono flex items-center gap-2">
                <Wifi className="w-3.5 h-3.5 text-emerald-400 rotate-90" />
                <span>NFC RFID 13.56 MHz Mifare DESFire EV3</span>
              </div>
            </div>

            <ResidentSmartCard 
              currentUser={currentUser} 
              onTapSuccess={(fac) => {
                const msg = `🎉 Cổng ${fac} đã mở tự động! Xin chào cư dân Căn ${aptCode} (${userName}).`;
                setWelcomeMessage(msg);
                setTimeout(() => setWelcomeMessage(null), 4000);
              }}
            />
          </div>

          {/* Welcoming Barrier Opening Banner */}
          {welcomeMessage && (
            <div className="p-4 bg-[#122A1E] border-2 border-emerald-500 text-emerald-200 text-xs font-medium flex items-center justify-between animate-fadeIn shadow-2xl rounded-lg">
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
            <div className="text-xs uppercase tracking-wider text-[#C5A880] font-bold flex items-center justify-between">
              <span>Danh Sách Cổng Tiện Ích 5 Sao (Chạm Để Mở Cổng Barrier Tự Động):</span>
              <span className="text-[11px] text-gray-400 font-normal font-mono">Đồng bộ cảm biến AI Turnstile</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {amenitiesList.map((fac) => {
                const Icon = fac.icon;
                const isOpening = activeBarrierId === fac.id;

                return (
                  <div
                    key={fac.id}
                    className={`bg-[#121820] border transition-all flex flex-col justify-between overflow-hidden group rounded-lg ${
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

                      <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-sm border border-[#222B35] px-2 py-1 text-[10px] text-white flex items-center gap-1.5 font-mono rounded">
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
                        type="button"
                        onClick={() => handleTapToAccess(fac)}
                        disabled={isOpening}
                        className={`w-full py-2.5 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 rounded ${
                          isOpening
                            ? 'bg-emerald-600 text-white animate-pulse'
                            : 'bg-[#C5A880] hover:bg-[#d5b991] text-[#0D1117] shadow-md'
                        }`}
                      >
                        {isOpening ? (
                          <>
                            <DoorOpen className="w-4 h-4" /> ĐANG MỞ CỔNG BARRIER...
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-4 h-4" /> Quẹt Thẻ / Quét FaceID Vào Cửa
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Facility Access History (Thực tế không ảo) */}
          <div className="p-5 bg-[#121820] border border-[#222B35] space-y-3 rounded-xl">
            <div className="text-xs uppercase tracking-wider text-[#C5A880] font-bold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-3.5 h-3.5" /> 
                <span>Lịch Sử Ra Vào Tiện Ích Tự Động (Thời Gian Thực):</span>
              </div>
              <span className="text-[11px] font-mono text-gray-400">{accessLogs.length} lượt ghi nhận</span>
            </div>

            {accessLogs.length === 0 ? (
              <div className="p-8 text-center bg-[#0D1117] border border-[#222B35] rounded-lg space-y-2">
                <div className="w-10 h-10 rounded-full bg-[#161D26] border border-[#2A374A] flex items-center justify-center mx-auto text-gray-400">
                  <History className="w-5 h-5 text-[#C5A880]" />
                </div>
                <div className="text-xs font-bold text-white">Chưa có lượt ra vào tiện ích nào</div>
                <div className="text-[11px] text-gray-400 max-w-sm mx-auto leading-relaxed">
                  Lịch sử sẽ tự động ghi lại mỗi khi cư dân quẹt thẻ NFC hoặc quét FaceID tại cổng kiểm soát Barrier của Hồ bơi, Gym, Vườn BBQ.
                </div>
              </div>
            ) : (
              <div className="divide-y divide-[#222B35] max-h-64 overflow-y-auto pr-1">
                {accessLogs.map((log) => (
                  <div key={log.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <div className="font-semibold text-white">{log.facilityName}</div>
                        <div className="text-[10px] text-gray-400">
                          {log.userName} ({log.role}) • {log.method === 'NFC_CARD' ? 'Thẻ Cư Dân NFC' : 'FaceID AI'}
                        </div>
                      </div>
                    </div>
                    <div className="text-[11px] text-[#C5A880] font-mono text-right">
                      <div>{log.timestamp}</div>
                      <div className="text-[9px] text-emerald-400">✓ Hợp Lệ</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 2: ĐẶT CHỖ TIỆN ÍCH ĐẶC QUYỀN (THỰC TẾ KHÔNG DỮ LIỆU ẢO)   */}
      {/* ============================================================= */}
      {activeTab === 'BOOKING' && (
        <div className="space-y-6">
          {/* Form Đặt Chỗ */}
          <form onSubmit={handleCreateBooking} className="p-6 bg-[#121820] border border-[#222B35] rounded-xl space-y-4 shadow-xl">
            <div className="border-b border-[#222B35] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-[#C5A880] font-bold">
                  Đăng Ký Khung Giờ Riêng Tư
                </div>
                <h3 className="font-serif text-lg text-white font-bold">
                  Đặt Lịch Sử Dụng Tiện Ích Cho Căn Hộ {aptCode}
                </h3>
              </div>

              <div className="text-xs text-gray-400 font-mono">
                Người đặt: <span className="text-white font-bold">{userName}</span>
              </div>
            </div>

            {bookingSuccessMsg && (
              <div className="p-3.5 bg-emerald-950 border border-emerald-500 text-emerald-300 text-xs flex items-center gap-2 rounded animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{bookingSuccessMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-gray-400 font-semibold uppercase text-[10px]">Tiện ích muốn đặt:</label>
                <select
                  value={bookingFacilityId}
                  onChange={(e) => setBookingFacilityId(e.target.value)}
                  className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white rounded focus:outline-none focus:border-[#C5A880]"
                >
                  <option value="fac-bbq">Vườn Nướng Sky BBQ Panoramic (Tầng 25)</option>
                  <option value="fac-pool">Khu Ghế Nằm Hồ Bơi Vô Cực (Tầng 25)</option>
                  <option value="fac-sauna">Phòng Xông Hơi Đá Muối Himalaya (Tầng 3)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-gray-400 font-semibold uppercase text-[10px]">Ngày sử dụng:</label>
                <input
                  type="date"
                  min={todayStr}
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white rounded focus:outline-none focus:border-[#C5A880]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-gray-400 font-semibold uppercase text-[10px]">Khung giờ đặt:</label>
                <select
                  value={bookingTimeSlot}
                  onChange={(e) => setBookingTimeSlot(e.target.value)}
                  className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white rounded focus:outline-none focus:border-[#C5A880]"
                >
                  <option>06:00 - 08:00 (Sáng sớm)</option>
                  <option>16:00 - 18:00 (Buổi chiều)</option>
                  <option>18:00 - 20:00 (Buổi tối - Giờ đẹp)</option>
                  <option>20:00 - 22:00 (Đêm muộn)</option>
                </select>
              </div>
            </div>

            <div className="p-3 bg-[#0D1117] border border-[#222B35] rounded flex items-center justify-between text-xs">
              <span className="text-gray-400">Biểu phí áp dụng theo quy chế tòa nhà:</span>
              <span className="text-[#C5A880] font-bold">
                {bookingFacilityId === 'fac-bbq' ? '200.000 đ / lượt (Phí vệ sinh sân nướng)' : 'Miễn phí cho cư dân'}
              </span>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#C5A880] hover:bg-[#d5b991] text-[#0D1117] text-xs font-bold uppercase tracking-wider rounded transition-colors flex items-center gap-2 shadow-lg"
              >
                <Check className="w-4 h-4" /> Xác Nhận Đặt Tiện Ích
              </button>
            </div>
          </form>

          {/* Danh Sách Vé Điện Tử Đã Đặt */}
          <div className="p-6 bg-[#121820] border border-[#222B35] rounded-xl space-y-4 shadow-xl">
            <div className="text-xs uppercase tracking-wider text-[#C5A880] font-bold flex items-center justify-between border-b border-[#222B35] pb-3">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4" /> Danh Sách Vé Điện Tử Đã Đặt Của Căn {aptCode}:
              </div>
              <span className="font-mono text-gray-400 text-[11px]">{bookings.length} vé</span>
            </div>

            {bookings.length === 0 ? (
              <div className="p-8 text-center bg-[#0D1117] border border-[#222B35] rounded-lg space-y-2">
                <div className="w-10 h-10 rounded-full bg-[#161D26] border border-[#2A374A] flex items-center justify-center mx-auto text-gray-400">
                  <Calendar className="w-5 h-5 text-[#C5A880]" />
                </div>
                <div className="text-xs font-bold text-white">Chưa có lịch đặt tiện ích nào</div>
                <div className="text-[11px] text-gray-400 max-w-sm mx-auto leading-relaxed">
                  Hãy điền form ở trên để đặt trước Vườn BBQ hoặc Chòi nghỉ Hồ bơi cho gia đình và bạn bè.
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bookings.map((b) => (
                  <div 
                    key={b.id}
                    className={`p-4 bg-[#0D1117] border rounded-lg space-y-3 transition-all ${
                      b.status === 'CONFIRMED' ? 'border-[#2A374A]' : 'border-gray-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          <span>{b.facilityName}</span>
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          Ngày: <strong className="text-white">{b.bookingDate}</strong> • Khung: <strong className="text-white">{b.timeSlot}</strong>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded uppercase border ${
                        b.status === 'CONFIRMED' 
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40' 
                          : 'bg-gray-800 text-gray-400 border-gray-600'
                      }`}>
                        {b.status === 'CONFIRMED' ? '✓ ĐÃ XÁC NHẬN' : '✕ ĐÃ HỦY'}
                      </span>
                    </div>

                    <div className="p-2.5 bg-[#161D26] border border-[#222B35] rounded flex items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="text-[9px] text-gray-400 uppercase font-mono">Mã Vé Điện Tử (NFC / QR):</div>
                        <div className="text-xs font-mono font-bold text-[#C5A880]">{b.ticketCode}</div>
                        <div className="text-[9px] text-gray-400">Người đặt: {b.bookerName}</div>
                      </div>

                      <div className="p-1 bg-white rounded shrink-0">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${b.ticketCode}`}
                          alt="Ticket QR"
                          className="w-12 h-12 object-contain"
                        />
                      </div>
                    </div>

                    {b.status === 'CONFIRMED' && (
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleCancelBooking(b.id)}
                          className="text-[11px] text-red-400 hover:text-red-300 font-semibold transition-colors flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Hủy Lịch Đặt
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
