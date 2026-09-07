'use client';

import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { 
  X, 
  QrCode, 
  Share2, 
  Copy, 
  Check, 
  Clock, 
  ShieldCheck, 
  KeyRound, 
  Sparkles,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  UserCheck,
  Send,
  Scan,
  RefreshCw,
  Lock,
  Unlock,
  Building,
  Car,
  XCircle,
  Camera,
  ShieldAlert,
  Info,
  Download,
  Link,
  MessageSquare,
  ExternalLink,
  Phone
} from 'lucide-react';
import { 
  GeneratedVisitorPass,
  PassEntryType,
  generateVisitorPassToken,
  verifyVisitorQr,
  VerificationScanResult
} from '@/lib/visitorStore';
import { User as UserType } from '@/lib/dataStore';

// Custom Zalo Brand Icon
const ZaloIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none">
    <rect width="48" height="48" rx="10" fill="#0068FF" />
    <path
      d="M37 24C37 31.1797 31.1797 37 24 37C21.603 37 19.3499 36.3533 17.4172 35.2281L11 37L13.1252 31.3323C11.8021 29.1878 11 26.6896 11 24C11 16.8203 16.8203 11 24 11C31.1797 11 37 16.8203 37 24Z"
      fill="white"
    />
    <path
      d="M20.5 19H29.5V21.5L23.5 28.5H29.5V31H20.5V28.5L26.5 21.5H20.5V19Z"
      fill="#0068FF"
    />
  </svg>
);

// Custom Facebook Messenger Brand Icon
const MessengerIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none">
    <circle cx="12" cy="12" r="12" fill="url(#messenger-gradient)" />
    <path
      d="M12 4C7.58172 4 4 7.37896 4 11.5459C4 13.9189 5.16335 16.0321 6.98565 17.4246V20L9.4678 18.6369C10.2741 18.8994 11.123 19.0357 12 19.0357C16.4183 19.0357 20 15.6567 20 11.4898C20 7.32284 16.4183 4 12 4ZM12.8767 14.0483L10.7495 11.7807L6.59828 14.0483L11.1609 9.20846L13.3106 11.476L17.4393 9.20846L12.8767 14.0483Z"
      fill="white"
    />
    <defs>
      <linearGradient id="messenger-gradient" x1="12" y1="0" x2="12" y2="24" gradientUnits="userSpaceOnUse">
        <stop stopColor="#00B2FE" />
        <stop offset="0.5" stopColor="#006AFF" />
        <stop offset="1" stopColor="#A033FF" />
      </linearGradient>
    </defs>
  </svg>
);

interface VisitorQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  apartmentCode: string;
  currentUser?: UserType;
}

export default function VisitorQrModal({ 
  isOpen, 
  onClose, 
  apartmentCode = '12A05',
  currentUser,
}: VisitorQrModalProps) {

  // Form State (Đã lược bỏ hoàn toàn hình thức mã theo yêu cầu)
  const [visitorName, setVisitorName] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [validHours, setValidHours] = useState('4');
  const [activePass, setActivePass] = useState<GeneratedVisitorPass | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  
  // Interaction states
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Helper toast notification
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Generate QR Code data URL whenever activePass changes
  useEffect(() => {
    if (activePass?.qrData) {
      QRCode.toDataURL(activePass.qrData, {
        width: 320,
        margin: 1,
        color: {
          dark: '#0D1117',
          light: '#FFFFFF',
        },
      })
        .then(setQrDataUrl)
        .catch((err) => console.error('Error generating QR code:', err));
    }
  }, [activePass?.qrData]);

  if (!isOpen) return null;

  // Handle Resident create/regenerate pass
  const handleGeneratePass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName.trim()) {
      showToast('Vui lòng nhập họ tên khách thăm!');
      return;
    }
    setIsGenerating(true);

    setTimeout(() => {
      const pass = generateVisitorPassToken({
        apartmentCode,
        visitorName: visitorName.trim(),
        phoneNumber: visitorPhone.trim(),
        licensePlate: licensePlate.trim().toUpperCase(),
        entryType: 'MULTI',
        validHours: parseInt(validHours, 10) || 4,
      });
      setActivePass(pass);
      setIsGenerating(false);
      showToast('Đã tạo mã QR đón khách thành công!');
    }, 200);
  };

  // Format full invitation text
  const getShareText = (pass: GeneratedVisitorPass) => {
    const expTime = new Date(pass.validUntil).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const expDate = new Date(pass.validUntil).toLocaleDateString('vi-VN');
    const towerName = pass.apartmentCode.includes('A') ? 'Tòa A (Sapphire)' : 'Tòa B (Diamond)';

    let text = `✨ [SKYLINE SMART RESIDENCE] THƯ MỜI ĐÓN KHÁCH ĐIỆN TỬ ✨\n`;
    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    text += `👤 Kính gửi: ${pass.visitorName}\n`;
    if (pass.phoneNumber) text += `📞 Số điện thoại: ${pass.phoneNumber}\n`;
    if (pass.licensePlate) text += `🚗 Biển số xe: ${pass.licensePlate}\n`;
    text += `🏢 Điểm đến: Căn hộ ${pass.apartmentCode} - ${towerName}\n`;
    text += `📍 Địa chỉ: Chung cư Skyline Smart Residence\n`;
    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    text += `🔑 MÃ PIN VÀO CỔNG: ${pass.pinCode}\n`;
    text += `⏳ Thời hạn hiệu lực: Đến ${expTime} ngày ${expDate} (${pass.validHours} giờ)\n`;
    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    text += `📲 HƯỚNG DẪN VÀO CỔNG:\n`;
    text += `1. Quý khách vui lòng xuất trình mã QR này trước Camera AI tại Cổng Sảnh hoặc Sảnh Thang Máy để vào tòa nhà.\n`;
    text += `2. Cổng tự động mở và thang máy được tự động phân quyền đón Quý khách lên thẳng căn hộ.\n`;
    text += `(Quý khách cũng có thể nhập mã PIN ${pass.pinCode} trực tiếp tại bàn phím cổng nếu cần).\n`;
    text += `Trân trọng đón tiếp!`;
    return text;
  };

  // Copy invitation text
  const handleCopyPass = () => {
    if (!activePass) return;
    const shareText = getShareText(activePass);
    navigator.clipboard.writeText(shareText);
  };

  // Copy PIN only
  const handleCopyPin = () => {
    if (!activePass) return;
    navigator.clipboard.writeText(activePass.pinCode);
    showToast(`Đã sao chép mã PIN: ${activePass.pinCode}`);
  };

  // Copy Direct Link
  const handleCopyLink = () => {
    if (!activePass) return;
    const shareUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}/portal?pass=${encodeURIComponent(activePass.qrData)}&pin=${activePass.pinCode}`
      : `https://skyline.residence/portal?pin=${activePass.pinCode}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
    showToast('Đã sao chép liên kết đón khách!');
  };

  // Share via Zalo
  const handleShareZalo = () => {
    if (!activePass) return;
    handleCopyPass();
    showToast('Đã sao chép thư mời! Đang mở Zalo để gửi...');
    setTimeout(() => {
      const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        window.open('https://zalo.me', '_blank');
      } else {
        window.open('https://chat.zalo.me', '_blank');
      }
    }, 400);
  };

  // Share via Messenger
  const handleShareMessenger = () => {
    if (!activePass) return;
    handleCopyPass();
    showToast('Đã sao chép thư mời! Đang mở Messenger...');
    setTimeout(() => {
      const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        window.open('fb-messenger://', '_blank');
      } else {
        window.open('https://www.facebook.com/messages/', '_blank');
      }
    }, 400);
  };

  // Native Web Share API
  const handleNativeShare = async () => {
    if (!activePass) return;
    const shareText = getShareText(activePass);
    const shareUrl = typeof window !== 'undefined' ? window.location.origin : '';

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Thẻ Mời Khách Căn Hộ ${activePass.apartmentCode} - Skyline Smart Residence`,
          text: shareText,
          url: shareUrl,
        });
        showToast('Đã mở menu chia sẻ hệ thống!');
      } catch (e) {
        // User dismissed
      }
    } else {
      handleCopyPass();
    }
  };

  // Export & Download Card as PNG Image
  const handleDownloadCardImage = async () => {
    if (!activePass) return;
    setIsDownloading(true);

    try {
      // 1. Generate QR Code Image URL
      const qrUrl = await QRCode.toDataURL(activePass.qrData, {
        width: 440,
        margin: 1,
        color: { dark: '#0D1117', light: '#FFFFFF' }
      });

      // 2. Setup High-Res Canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Cannot init canvas context');

      const W = 840;
      const H = 1140;
      canvas.width = W;
      canvas.height = H;

      // 3. Dark Luxury Gradient Background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
      bgGrad.addColorStop(0, '#090D12');
      bgGrad.addColorStop(0.35, '#121922');
      bgGrad.addColorStop(0.75, '#0E141C');
      bgGrad.addColorStop(1, '#06090D');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // 4. Gold Outer & Inner Borders
      ctx.strokeStyle = '#C5A880';
      ctx.lineWidth = 3;
      ctx.strokeRect(30, 30, W - 60, H - 60);

      ctx.strokeStyle = 'rgba(197, 168, 128, 0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(40, 40, W - 80, H - 80);

      // Luxury Corner Highlights
      const cSize = 28;
      ctx.strokeStyle = '#E2C799';
      ctx.lineWidth = 4;
      // Top-Left
      ctx.beginPath();
      ctx.moveTo(28, 28 + cSize); ctx.lineTo(28, 28); ctx.lineTo(28 + cSize, 28);
      ctx.stroke();
      // Top-Right
      ctx.beginPath();
      ctx.moveTo(W - 28 - cSize, 28); ctx.lineTo(W - 28, 28); ctx.lineTo(W - 28, 28 + cSize);
      ctx.stroke();
      // Bottom-Left
      ctx.beginPath();
      ctx.moveTo(28, H - 28 - cSize); ctx.lineTo(28, H - 28); ctx.lineTo(28 + cSize, H - 28);
      ctx.stroke();
      // Bottom-Right
      ctx.beginPath();
      ctx.moveTo(W - 28 - cSize, H - 28); ctx.lineTo(W - 28, H - 28); ctx.lineTo(W - 28, H - 28 - cSize);
      ctx.stroke();

      // 5. Header Branding
      ctx.textAlign = 'center';
      ctx.fillStyle = '#C5A880';
      ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('SKYLINE SMART RESIDENCE', W / 2, 85);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 28px serif';
      ctx.fillText('THẺ ĐÓN KHÁCH ĐIỆN TỬ', W / 2, 130);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '13px sans-serif';
      ctx.fillText('VIP VISITOR SMART PASS • HỆ THỐNG AN NINH TỰ ĐỘNG', W / 2, 160);

      // Gold divider line
      const divGrad = ctx.createLinearGradient(120, 0, W - 120, 0);
      divGrad.addColorStop(0, 'rgba(197, 168, 128, 0)');
      divGrad.addColorStop(0.5, 'rgba(197, 168, 128, 0.8)');
      divGrad.addColorStop(1, 'rgba(197, 168, 128, 0)');
      ctx.strokeStyle = divGrad;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(100, 185);
      ctx.lineTo(W - 100, 185);
      ctx.stroke();

      // 6. Guest Information Card Box
      ctx.fillStyle = 'rgba(20, 27, 36, 0.85)';
      ctx.fillRect(80, 210, W - 160, 120);
      ctx.strokeStyle = 'rgba(197, 168, 128, 0.45)';
      ctx.lineWidth = 1;
      ctx.strokeRect(80, 210, W - 160, 120);

      ctx.textAlign = 'left';
      ctx.fillStyle = '#C5A880';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('KÍNH GỬI QUÝ KHÁCH THĂM:', 110, 242);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(activePass.visitorName || 'Khách Thăm Nhà', 110, 276);

      ctx.fillStyle = '#9FB1C7';
      ctx.font = '14px sans-serif';
      const towerText = activePass.apartmentCode.includes('A') ? 'Tòa A (Sapphire)' : 'Tòa B (Diamond)';
      ctx.fillText(`Điểm đến: Căn hộ ${activePass.apartmentCode} • ${towerText} • Chung cư Skyline`, 110, 308);

      // 7. QR Code Card Container
      const qrBoxW = 340;
      const qrBoxH = 340;
      const qrBoxX = (W - qrBoxW) / 2;
      const qrBoxY = 360;

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.rect(qrBoxX, qrBoxY, qrBoxW, qrBoxH);
      ctx.fill();

      // Draw QR image
      const qrImg = new Image();
      await new Promise<void>((resolve, reject) => {
        qrImg.onload = () => resolve();
        qrImg.onerror = reject;
        qrImg.src = qrUrl;
      });
      ctx.drawImage(qrImg, qrBoxX + 18, qrBoxY + 18, qrBoxW - 36, qrBoxH - 36);

      // 8. PIN Box below QR
      const pinBoxY = 730;
      ctx.fillStyle = 'rgba(16, 22, 30, 0.95)';
      ctx.fillRect(80, pinBoxY, W - 160, 115);
      ctx.strokeStyle = '#C5A880';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(80, pinBoxY, W - 160, 115);

      ctx.textAlign = 'center';
      ctx.fillStyle = '#94A3B8';
      ctx.font = '12px sans-serif';
      ctx.fillText('MÃ PIN DỰ PHÒNG NHẬP CỔNG BARRIER / THANG MÁY', W / 2, pinBoxY + 35);

      ctx.fillStyle = '#F0D4A3';
      ctx.font = 'bold 38px monospace';
      ctx.fillText(activePass.pinCode, W / 2, pinBoxY + 82);

      // 9. Instructions & Validity
      const expTime = new Date(activePass.validUntil).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      const expDate = new Date(activePass.validUntil).toLocaleDateString('vi-VN');

      ctx.fillStyle = '#10B981';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText(`Thời hạn hiệu lực: Đến ${expTime} ngày ${expDate} (${activePass.validHours} giờ)`, W / 2, 885);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '13px sans-serif';
      ctx.fillText('Quý khách vui lòng xuất trình mã QR trước camera Barrier hoặc Sảnh Thang Máy.', W / 2, 920);
      ctx.fillText('Cổng Barrier tự động mở và thang máy được cấp quyền đón lên căn hộ.', W / 2, 946);

      // 10. Watermark Footer
      ctx.fillStyle = 'rgba(197, 168, 128, 0.45)';
      ctx.font = '11px sans-serif';
      ctx.fillText('Chung cư Skyline Smart Residence • Mã hóa thời gian thực • Verified Pass', W / 2, 1070);

      // 11. Download trigger
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.download = `Skyline_The_Moi_Khach_${activePass.apartmentCode}_${(activePass.visitorName || 'VIP').replace(/\s+/g, '_')}.png`;
      a.href = dataUrl;
      a.click();
      showToast('Đã lưu ảnh Thẻ Mời Khách vào máy thành công!');
    } catch (err) {
      console.error('Download card error:', err);
      showToast('Không thể lưu ảnh, vui lòng thử lại.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0D1117] border border-[#C5A880]/80 max-w-3xl w-full p-5 sm:p-6 text-white space-y-5 shadow-2xl rounded-2xl max-h-[92vh] overflow-y-auto relative">
        
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] px-4 py-2.5 bg-[#161D26] border border-[#C5A880] text-[#C5A880] text-xs font-bold rounded-xl shadow-2xl flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#222B35] pb-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-semibold flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5" /> Dịch Vụ Đón Khách Thăm Căn Hộ
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-white mt-0.5">
              Mã QR Đón Khách • Căn Hộ {apartmentCode}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#161B22] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resident Pass Creation & Sharing */}
        <div className="space-y-4">
            {/* Building Policy & Privacy Guarantee Banner */}
            <div className="p-3 bg-[#121E2A] border border-[#1E3A5F] rounded-xl flex items-start gap-2.5 text-xs text-cyan-200/95 leading-relaxed">
              <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Chung cư Skyline Smart Residence:</strong> Đã bố trí <strong>Điểm Nhận Hàng & Bưu Phẩm Tập Trung tại Sảnh Lễ Tân</strong> dành riêng cho Shipper. Mã QR dưới đây dành để cư dân đón <strong>Khách Thăm</strong> trực tiếp lên căn hộ qua Barrier và thang máy.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
              
              {/* Form tạo mã thông tin khách (ĐÃ LƯỢC BỎ HOÀN TOÀN HÌNH THỨC MÃ) */}
              <form onSubmit={handleGeneratePass} className="space-y-3.5 bg-[#121820] border border-[#222B35] p-4 sm:p-5 rounded-xl text-xs">
                <div className="text-xs font-bold uppercase tracking-wider text-[#C5A880] flex items-center gap-1.5 pb-2 border-b border-[#222B35]">
                  <UserCheck className="w-3.5 h-3.5" /> Thông Tin Khách Thăm
                </div>

                {/* 1. Họ tên khách */}
                <div>
                  <label className="text-gray-300 font-medium block mb-1">
                    Họ Tên Khách Thăm <span className="text-rose-400">*</span>:
                  </label>
                  <input
                    type="text"
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                    placeholder="VD: Anh Minh, Chị Lan..."
                    className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white rounded-lg focus:border-[#C5A880] outline-none"
                    required
                  />
                </div>

                {/* 2. Số điện thoại khách */}
                <div>
                  <label className="text-gray-300 font-medium block mb-1">
                    Số Điện Thoại Khách:
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={visitorPhone}
                      onChange={(e) => setVisitorPhone(e.target.value)}
                      placeholder="VD: 0912 345 678 (Dùng liên hệ khi cần)"
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 pl-8 text-white rounded-lg focus:border-[#C5A880] outline-none"
                    />
                    <Phone className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-3" />
                  </div>
                </div>

                {/* 3. Biển số xe & Thời gian hiệu lực */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-300 font-medium block mb-1">
                      Biển Số Xe (Nếu Có):
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={licensePlate}
                        onChange={(e) => setLicensePlate(e.target.value)}
                        placeholder="51F-123.45"
                        className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 pl-8 text-white font-mono uppercase rounded-lg focus:border-[#C5A880] outline-none"
                      />
                      <Car className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-3" />
                    </div>
                  </div>

                  <div>
                    <label className="text-gray-300 font-medium block mb-1">
                      Thời Gian Hiệu Lực:
                    </label>
                    <select
                      value={validHours}
                      onChange={(e) => setValidHours(e.target.value)}
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white rounded-lg focus:border-[#C5A880] outline-none cursor-pointer"
                    >
                      <option value="1">1 Giờ (Gặp nhanh)</option>
                      <option value="2">2 Giờ (Tiếp khách)</option>
                      <option value="4">4 Giờ (Nửa ngày)</option>
                      <option value="8">8 Giờ (Trong ngày)</option>
                      <option value="24">24 Giờ (Cả ngày)</option>
                    </select>
                  </div>
                </div>

                {/* Nút Tạo Mã */}
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="w-full py-2.5 bg-[#C5A880] hover:bg-white text-[#0D1117] font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer active:scale-98"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Đang Tạo Mã Mới...
                    </>
                  ) : (
                    <>
                      <QrCode className="w-4 h-4" /> Tạo Mã QR Mời Khách
                    </>
                  )}
                </button>
              </form>

              {/* Thẻ hiển thị mã QR & Bộ công cụ chia sẻ VIP */}
              {!activePass ? (
                <div className="bg-[#121820] border-2 border-dashed border-[#2D3748] p-6 rounded-xl flex flex-col items-center justify-center text-center h-full min-h-[360px] space-y-3.5 shadow-inner">
                  <div className="w-16 h-16 rounded-2xl bg-[#161D26] border border-[#2D3748] flex items-center justify-center text-[#C5A880]/70">
                    <QrCode className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <div className="font-serif font-bold text-white text-base">Chưa Tạo Thẻ Đón Khách</div>
                    <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
                      Vui lòng điền thông tin khách thăm ở biểu mẫu bên trái và nhấn <span className="text-[#C5A880] font-semibold">"Tạo Mã QR Mời Khách"</span> để xuất thẻ QR bảo mật thực tế.
                    </p>
                  </div>
                  <div className="text-[11px] text-gray-500 flex items-center gap-1.5 pt-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> Hệ thống bảo mật 100% không lưu hồ sơ cá nhân
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-b from-[#161D26] to-[#0E131A] border-2 border-[#C5A880] p-4 sm:p-5 rounded-xl space-y-3.5 shadow-2xl flex flex-col justify-between">
                  
                  {/* Card Header */}
                  <div className="flex items-center justify-between border-b border-[#222B35] pb-2.5">
                    <div className="space-y-0.5">
                      <div className="font-serif font-bold text-white text-base truncate">
                        {activePass.visitorName || 'Khách Thăm Nhà'}
                      </div>
                      <div className="text-[11px] text-[#C5A880]">
                        Điểm đến: Căn hộ {activePass.apartmentCode} • Chung cư Skyline
                        {activePass.licensePlate && ` • Xe: ${activePass.licensePlate}`}
                      </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0 ml-2">
                      <span className="px-2 py-0.5 text-[9.5px] font-bold uppercase rounded border bg-emerald-950/80 text-emerald-300 border-emerald-500/60 font-mono">
                        VIP PASS
                      </span>
                      <span className="text-[9px] text-emerald-400 font-mono mt-0.5">Hiệu Lực Ngay</span>
                    </div>
                  </div>

                  {/* QR Image Container */}
                  <div className="flex flex-col sm:flex-row items-center gap-3.5 bg-[#0A0E14] p-3.5 rounded-xl border border-[#222B35]">
                    <div className="bg-white p-2 rounded-lg shadow-inner flex-shrink-0 group relative cursor-pointer" onClick={handleDownloadCardImage} title="Nhấn để lưu ảnh">
                      <img
                        src={qrDataUrl || `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(activePass.qrData)}`}
                        alt="QR Mời Khách"
                        className="w-28 h-28 object-contain"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center text-white text-[10px] font-bold gap-1">
                        <Download className="w-3.5 h-3.5" /> Lưu ảnh
                      </div>
                    </div>

                    <div className="space-y-2 text-xs flex-1 w-full sm:w-auto">
                      <div className="p-2 bg-[#121820] border border-[#222B35] rounded flex items-center justify-between">
                        <div>
                          <div className="text-gray-400 text-[10px]">Mã PIN Nhập Cổng:</div>
                          <div className="font-mono text-xl font-bold text-[#C5A880] tracking-wider">
                            {activePass.pinCode}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyPin}
                          className="px-2 py-1 bg-[#1C2533] hover:bg-[#2A374A] text-gray-300 hover:text-white rounded text-[10px] flex items-center gap-1 border border-gray-700 transition-colors cursor-pointer"
                          title="Sao chép mã PIN"
                        >
                          <Copy className="w-3 h-3 text-[#C5A880]" /> Chép PIN
                        </button>
                      </div>

                      <div className="text-[11px] text-gray-300 space-y-0.5">
                        <div className="flex items-center gap-1.5 text-emerald-400">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          <span>Thời hạn hiệu lực: {activePass.validHours} giờ</span>
                        </div>
                        <div className="text-[10px] text-gray-400">
                          Đến {new Date(activePass.validUntil).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ({new Date(activePass.validUntil).toLocaleDateString('vi-VN')})
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ======================================================= */}
                  {/* BỘ CÔNG CỤ CHIA SẺ, ZALO, MESSENGER, LƯU ẢNH THEO YÊU CẦU */}
                  {/* ======================================================= */}
                  <div className="space-y-2 pt-1 border-t border-[#222B35]">
                    <div className="text-[10px] uppercase tracking-wider font-bold text-gray-400 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Share2 className="w-3 h-3 text-[#C5A880]" /> Chia Sẻ Mã Đến Khách:
                      </span>
                      <span className="text-[9.5px] text-emerald-400 font-normal">Sẵn sàng gửi</span>
                    </div>

                    {/* HÀNG 1: CÁC KÊNH CHIA SẺ TRỰC TIẾP */}
                    <div className="grid grid-cols-3 gap-2">
                      {/* Nút Gửi Zalo */}
                      <button
                        type="button"
                        onClick={handleShareZalo}
                        className="py-2 px-2 bg-[#0068FF]/15 hover:bg-[#0068FF] text-[#60A5FA] hover:text-white border border-[#0068FF]/50 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer group"
                        title="Sao chép lời mời và mở Zalo để gửi"
                      >
                        <ZaloIcon className="w-4 h-4 shrink-0 rounded" />
                        <span className="truncate">Gửi Zalo</span>
                      </button>

                      {/* Nút Gửi Messenger */}
                      <button
                        type="button"
                        onClick={handleShareMessenger}
                        className="py-2 px-2 bg-[#0084FF]/15 hover:bg-[#0084FF] text-[#38BDF8] hover:text-white border border-[#0084FF]/50 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer group"
                        title="Sao chép lời mời và mở Messenger"
                      >
                        <MessengerIcon className="w-4 h-4 shrink-0" />
                        <span className="truncate">Messenger</span>
                      </button>

                      {/* Nút Lưu Ảnh Thẻ Mời PNG */}
                      <button
                        type="button"
                        onClick={handleDownloadCardImage}
                        disabled={isDownloading}
                        className="py-2 px-2 bg-[#C5A880]/20 hover:bg-[#C5A880] text-[#C5A880] hover:text-[#0D1117] border border-[#C5A880] rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                        title="Tải ảnh thẻ mời VIP định dạng PNG về máy"
                      >
                        {isDownloading ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                        <span className="truncate">Lưu Ảnh</span>
                      </button>
                    </div>

                    {/* HÀNG 2: TIỆN ÍCH LIÊN KẾT & CHIA SẺ HỆ THỐNG */}
                    <div className="grid grid-cols-2 gap-2">
                      {/* Sao chép link */}
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="py-2 px-3 bg-[#161B22] hover:bg-[#1E2530] text-gray-300 hover:text-white border border-[#2D3748] rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {copiedLink ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400 font-bold truncate">Đã Chép Link</span>
                          </>
                        ) : (
                          <>
                            <Link className="w-3.5 h-3.5 text-[#C5A880]" />
                            <span className="truncate">Sao Chép Link Đón Khách</span>
                          </>
                        )}
                      </button>

                      {/* Chia sẻ hệ thống / Khác */}
                      <button
                        type="button"
                        onClick={handleNativeShare}
                        className="py-2 px-3 bg-[#161B22] hover:bg-[#1E2530] text-gray-300 hover:text-white border border-[#2D3748] rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5 text-[#C5A880]" />
                        <span className="truncate">Chia Sẻ Khác</span>
                      </button>
                    </div>

                  </div>
                </div>
              )}
            </div>
          </div>

      </div>
    </div>
  );
}
