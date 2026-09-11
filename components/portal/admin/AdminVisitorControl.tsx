'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import jsQR from 'jsqr';
import QRCode from 'qrcode';
import { 
  Camera, 
  CameraOff, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Upload, 
  Zap, 
  Building2, 
  User, 
  Phone, 
  Car, 
  Clock, 
  KeyRound, 
  Search, 
  RefreshCw, 
  Check, 
  UserCheck, 
  LogIn, 
  LogOut, 
  ShieldCheck, 
  ShieldAlert, 
  Sparkles,
  FileText,
  Home,
  Users,
  Info,
  Plus,
  QrCode,
  SlidersHorizontal,
  LayoutGrid,
  ListFilter,
  Trash2,
  Share2,
  Copy,
  ExternalLink,
  ChevronRight,
  Printer,
  X
} from 'lucide-react';
import { 
  verifyVisitorQr, 
  VerificationScanResult, 
  getAllVisitorPasses,
  GeneratedVisitorPass,
  checkInVisitorPass,
  checkOutVisitorPass,
  deleteVisitorPass,
  generateVisitorPassToken,
  getGateAuditLogs,
  GateAuditLog,
  VisitorPassStatus,
  clearAllVisitorData
} from '@/lib/visitorStore';
import { getApartmentUnits } from '@/lib/apartmentStore';

export type VisitorTab = 'LIST' | 'SCANNER' | 'AUDIT_LOGS';

export default function AdminVisitorControl() {
  // 1. Tab chính điều khiển
  const [activeTab, setActiveTab] = useState<VisitorTab>('LIST');

  // Chốt kiểm soát an ninh
  const [selectedCheckpoint, setSelectedCheckpoint] = useState('Sảnh Tiếp Tân Tầng 1 (Chung Cư Skyline)');

  // Chế độ xem danh sách: 'TABLE' (dạng bảng) | 'CARDS' (dạng thẻ)
  const [viewLayout, setViewLayout] = useState<'TABLE' | 'CARDS'>('TABLE');

  // Input & Scanner modes: CAMERA | UPLOAD | PIN_SEARCH
  const [scanMode, setScanMode] = useState<'CAMERA' | 'UPLOAD' | 'PIN_SEARCH'>('CAMERA');

  // Camera State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Manual PIN / PassID search
  const [pinSearchInput, setPinSearchInput] = useState('');

  // Current Scan / Verification Result
  const [scanResult, setScanResult] = useState<VerificationScanResult | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Visitor Passes List & Filtering
  const [passesList, setPassesList] = useState<GeneratedVisitorPass[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [tableSearch, setTableSearch] = useState('');

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<GateAuditLog[]>([]);
  const [logSearch, setLogSearch] = useState('');

  // Modals
  const [isQuickPassModalOpen, setIsQuickPassModalOpen] = useState(false);
  const [selectedPassForDetail, setSelectedPassForDetail] = useState<GeneratedVisitorPass | null>(null);
  const [detailQrDataUrl, setDetailQrDataUrl] = useState<string>('');

  // Quick Pass Creation Form State (Cấp thẻ tại quầy)
  const [newPassApt, setNewPassApt] = useState('12A05');
  const [newPassVisitorName, setNewPassVisitorName] = useState('');
  const [newPassVisitorPhone, setNewPassVisitorPhone] = useState('');
  const [newPassPlate, setNewPassPlate] = useState('');
  const [newPassHours, setNewPassHours] = useState('4');
  const [newPassNote, setNewPassNote] = useState('');
  const [createdQuickPass, setCreatedQuickPass] = useState<GeneratedVisitorPass | null>(null);
  const [createdQrUrl, setCreatedQrUrl] = useState<string>('');

  // Danh sách căn hộ từ apartmentStore để chọn khi cấp thẻ
  const apartments = useMemo(() => {
    try {
      return getApartmentUnits();
    } catch {
      return [];
    }
  }, []);

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const animationFrameId = useRef<number | null>(null);

  // Load passes from store
  const refreshData = () => {
    const list = getAllVisitorPasses();
    setPassesList([...list]);
    const logs = getGateAuditLogs();
    setAuditLogs([...logs]);
  };

  useEffect(() => {
    refreshData();
  }, []);

  const showFeedback = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setActionFeedback({ type, message });
    setTimeout(() => setActionFeedback(null), 3800);
  };

  // Perform QR / PIN Verification
  const handleVerify = (rawInput: string) => {
    if (!rawInput.trim() || isScanning) return;
    setIsScanning(true);

    setTimeout(() => {
      const result = verifyVisitorQr(rawInput.trim(), selectedCheckpoint);
      setScanResult(result);
      setIsScanning(false);
      refreshData();

      // Nếu đang ở tab khác thì chuyển sang tab SCANNER để đối chiếu
      setActiveTab('SCANNER');

      if (result.canEnter && result.scanResult === 'VALID') {
        showFeedback(`Xác thực thành công! Khách: ${result.visitor?.visitorName} • Điểm đến: Căn ${result.host?.apartmentCode}`);
      } else if (result.scanResult === 'EXPIRED') {
        showFeedback(`Thẻ khách đã hết hạn sử dụng!`, 'error');
      } else {
        showFeedback(`Mã thẻ không hợp lệ hoặc không tồn tại trong hệ thống!`, 'error');
      }
    }, 250);
  };

  // Check-in Action
  const handleCheckIn = (passId: string) => {
    const updated = checkInVisitorPass(passId);
    if (updated) {
      showFeedback(`Đã xác nhận cho khách [${updated.visitorName}] vào chung cư lên Căn ${updated.apartmentCode}!`);
      if (scanResult && scanResult.visitor?.passId === passId) {
        setScanResult({
          ...scanResult,
          title: 'KHÁCH ĐÃ CHECK-IN (ĐANG Ở TRONG TÒA NHÀ)',
          visitor: {
            ...scanResult.visitor,
            status: 'CHECKED_IN',
            checkedInAt: updated.checkedInAt
          }
        });
      }
      if (selectedPassForDetail && selectedPassForDetail.id === passId) {
        setSelectedPassForDetail(updated);
      }
      refreshData();
    }
  };

  // Check-out Action
  const handleCheckOut = (passId: string) => {
    const updated = checkOutVisitorPass(passId);
    if (updated) {
      showFeedback(`Đã ghi nhận khách [${updated.visitorName}] rời chung cư an toàn!`, 'info');
      if (scanResult && scanResult.visitor?.passId === passId) {
        setScanResult({
          ...scanResult,
          title: 'KHÁCH ĐÃ RỜI ĐI (HOÀN TẤT THĂM CĂN HỘ)',
          visitor: {
            ...scanResult.visitor,
            status: 'COMPLETED',
            checkedOutAt: updated.checkedOutAt
          }
        });
      }
      if (selectedPassForDetail && selectedPassForDetail.id === passId) {
        setSelectedPassForDetail(updated);
      }
      refreshData();
    }
  };

  // Delete / Revoke Pass Action
  const handleDeletePass = (pass: GeneratedVisitorPass) => {
    if (confirm(`Bạn có chắc muốn hủy thẻ đón khách [${pass.visitorName}] của Căn ${pass.apartmentCode}?`)) {
      deleteVisitorPass(pass.id);
      showFeedback(`Đã hủy thẻ khách [${pass.id}] thành công.`, 'info');
      if (selectedPassForDetail?.id === pass.id) {
        setSelectedPassForDetail(null);
      }
      if (scanResult?.visitor?.passId === pass.id) {
        setScanResult(null);
      }
      refreshData();
    }
  };

  // Reset / Xóa dữ liệu khách ảo để đảm bảo hệ thống hoàn toàn sạch sẽ
  const handleClearAllData = () => {
    if (confirm('Xác nhận xóa sạch toàn bộ dữ liệu khách và nhật ký thử nghiệm để bắt đầu mới hoàn toàn?')) {
      clearAllVisitorData();
      showFeedback('Đã dọn dẹp sạch sẽ toàn bộ dữ liệu khách thăm.', 'info');
      setSelectedPassForDetail(null);
      setScanResult(null);
      refreshData();
    }
  };

  // Camera video frame scanner loop
  const scanVideoFrame = () => {
    if (!videoRef.current || !canvasRef.current || !isCameraActive) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data && !isScanning) {
        handleVerify(code.data);
      }
    }

    animationFrameId.current = requestAnimationFrame(scanVideoFrame);
  };

  // Start Camera
  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraActive(true);
        animationFrameId.current = requestAnimationFrame(scanVideoFrame);
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError('Không thể mở camera. Vui lòng kiểm tra quyền truy cập camera trên trình duyệt hoặc sử dụng chế độ tải ảnh QR / tra cứu mã PIN.');
      setIsCameraActive(false);
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Handle Upload Image
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code && code.data) {
          handleVerify(code.data);
        } else {
          handleVerify('INVALID_UNRECOGNIZED_IMAGE');
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Open Pass Detail Modal
  const openPassDetail = async (pass: GeneratedVisitorPass) => {
    setSelectedPassForDetail(pass);
    try {
      const url = await QRCode.toDataURL(pass.qrData, {
        width: 240,
        margin: 1.5,
        color: { dark: '#0D1117', light: '#FFFFFF' }
      });
      setDetailQrDataUrl(url);
    } catch {
      setDetailQrDataUrl('');
    }
  };

  // Create Quick Pass at Reception Desk
  const handleCreateQuickPass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassVisitorName.trim()) {
      showFeedback('Vui lòng nhập tên khách thăm!', 'error');
      return;
    }

    const selectedUnitObj = apartments.find(u => u.code === newPassApt);
    const hostName = selectedUnitObj?.owner?.name || (newPassApt === '12A05' ? 'Nguyễn Hữu Lực' : `Chủ Hộ Căn ${newPassApt}`);
    const hostPhone = selectedUnitObj?.owner?.phone || (newPassApt === '12A05' ? '0908.888.888' : '0900.000.000');

    const pass = generateVisitorPassToken({
      apartmentCode: newPassApt,
      hostName,
      hostPhone,
      visitorName: newPassVisitorName.trim(),
      phoneNumber: newPassVisitorPhone.trim(),
      licensePlate: newPassPlate.trim().toUpperCase(),
      validHours: parseInt(newPassHours, 10) || 4,
      note: newPassNote.trim() || 'Thẻ cấp trực tiếp tại quầy lễ tân'
    });

    try {
      const url = await QRCode.toDataURL(pass.qrData, {
        width: 240,
        margin: 1.5,
        color: { dark: '#0D1117', light: '#FFFFFF' }
      });
      setCreatedQrUrl(url);
    } catch {
      setCreatedQrUrl('');
    }

    setCreatedQuickPass(pass);
    refreshData();
    showFeedback(`Đã cấp thẻ đón khách thành công! Mã PIN: ${pass.pinCode}`);
  };

  // Reset Quick Pass Form
  const resetQuickPassForm = () => {
    setNewPassVisitorName('');
    setNewPassVisitorPhone('');
    setNewPassPlate('');
    setNewPassNote('');
    setCreatedQuickPass(null);
    setCreatedQrUrl('');
    setIsQuickPassModalOpen(false);
  };

  // Quick stats
  const totalPasses = passesList.length;
  const inBuildingCount = passesList.filter((p) => p.status === 'CHECKED_IN').length;
  const pendingCount = passesList.filter((p) => p.status === 'ACTIVE').length;
  const completedCount = passesList.filter((p) => p.status === 'COMPLETED').length;
  const expiredCount = passesList.filter((p) => p.status === 'EXPIRED').length;

  // Filtered passes for list
  const filteredPasses = passesList.filter((p) => {
    if (filterStatus !== 'ALL' && p.status !== filterStatus) return false;
    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase().trim();
      const matchName = p.visitorName.toLowerCase().includes(q);
      const matchApt = p.apartmentCode.toLowerCase().includes(q);
      const matchHost = p.hostName.toLowerCase().includes(q);
      const matchPlate = (p.licensePlate || '').toLowerCase().includes(q);
      const matchPhone = (p.phoneNumber || '').toLowerCase().includes(q);
      const matchPin = p.pinCode.includes(q);
      const matchId = p.id.toLowerCase().includes(q);
      return matchName || matchApt || matchHost || matchPlate || matchPhone || matchPin || matchId;
    }
    return true;
  });

  // Filtered audit logs
  const filteredLogs = auditLogs.filter(log => {
    if (!logSearch.trim()) return true;
    const q = logSearch.toLowerCase().trim();
    return (
      (log.visitorName || '').toLowerCase().includes(q) ||
      (log.apartmentCode || '').toLowerCase().includes(q) ||
      (log.hostName || '').toLowerCase().includes(q) ||
      (log.licensePlate || '').toLowerCase().includes(q) ||
      (log.note || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-fadeIn select-none">
      
      {/* Toast Feedback Notification */}
      {actionFeedback && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-none shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-fadeIn border ${
          actionFeedback.type === 'error'
            ? 'bg-rose-950/95 border-rose-500 text-rose-200'
            : actionFeedback.type === 'info'
            ? 'bg-[#1E293B] border-sky-400 text-sky-200'
            : 'bg-[#121E19] border-emerald-500 text-emerald-200'
        }`}>
          {actionFeedback.type === 'error' ? (
            <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : actionFeedback.type === 'info' ? (
            <Info className="w-4 h-4 text-sky-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{actionFeedback.message}</span>
        </div>
      )}

      {/* ============================================================= */}
      {/* 1. HEADER & CHỐT KIỂM SOÁT TIẾP ĐÓN                           */}
      {/* ============================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#222B35] pb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#C5A880]" /> Ban Quản Lý Chung Cư • Bộ Phận Lễ Tân & An Ninh
          </div>
          <h2 className="font-serif text-2xl text-white font-bold mt-1">
            Quản Lý & Tiếp Đón Khách Thăm (Mã QR & Mã PIN)
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Xác thực khách thăm vào chung cư theo bảo lãnh cư dân. Kiểm soát an ninh đa phương thức: quét mã QR, tra cứu mã PIN 6 số và cấp thẻ trực tiếp tại quầy.
          </p>
        </div>

        {/* Nút hành động nhanh trên Header */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Checkpoint selector */}
          <div className="flex items-center gap-2 bg-[#121820] border border-[#2D3748] px-3 py-1.5 text-xs">
            <span className="text-gray-400 font-medium">Chốt:</span>
            <select
              value={selectedCheckpoint}
              onChange={(e) => setSelectedCheckpoint(e.target.value)}
              className="bg-transparent text-[#C5A880] font-bold outline-none cursor-pointer"
            >
              <option value="Sảnh Tiếp Tân Tầng 1 (Chung Cư Skyline)" className="bg-[#121820] text-white">
                Sảnh Tiếp Tân Tầng 1
              </option>
              <option value="Cổng An Ninh Kiểm Soát Chính" className="bg-[#121820] text-white">
                Cổng An Ninh Kiểm Soát Chính
              </option>
              <option value="Trạm Kiểm Soát Hầm Xe B1" className="bg-[#121820] text-white">
                Trạm Kiểm Soát Hầm Xe B1
              </option>
              <option value="Trạm Kiểm Soát Hầm Xe B2" className="bg-[#121820] text-white">
                Trạm Kiểm Soát Hầm Xe B2
              </option>
            </select>
          </div>

          {/* Nút Cấp Thẻ Khách Nhanh */}
          <button
            type="button"
            onClick={() => setIsQuickPassModalOpen(true)}
            className="px-3.5 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold rounded-none shadow flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Cấp Thẻ Tại Quầy
          </button>

          {/* Nút Làm mới */}
          <button
            type="button"
            onClick={() => {
              refreshData();
              showFeedback('Đã làm mới dữ liệu khách thăm!');
            }}
            className="p-2 bg-[#121820] hover:bg-[#1C2533] text-gray-300 hover:text-[#C5A880] border border-[#2D3748] rounded-none transition-colors cursor-pointer"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ============================================================= */}
      {/* 2. 4 THẺ THỐNG KÊ NHANH (KPI STATS) - CLICK VÀO ĐỂ LỌC NHANH   */}
      {/* ============================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div 
          onClick={() => { setFilterStatus('ALL'); setActiveTab('LIST'); }}
          className={`p-3.5 border transition-all cursor-pointer ${
            filterStatus === 'ALL' && activeTab === 'LIST'
              ? 'bg-[#1C2533] border-[#C5A880] shadow-lg'
              : 'bg-[#121820] border-[#222B35] hover:border-gray-600'
          }`}
        >
          <div className="text-[11px] text-gray-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#C5A880]" /> Tổng Khách Thăm
            </span>
            <span className="text-[9.5px] font-mono text-gray-400">Tất cả</span>
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-1">{totalPasses}</div>
          <div className="text-[10.5px] text-gray-400 mt-0.5">Nhấp để xem danh sách</div>
        </div>

        <div 
          onClick={() => { setFilterStatus('CHECKED_IN'); setActiveTab('LIST'); }}
          className={`p-3.5 border transition-all cursor-pointer relative overflow-hidden ${
            filterStatus === 'CHECKED_IN' && activeTab === 'LIST'
              ? 'bg-emerald-950/60 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
              : 'bg-[#121820] border-[#222B35] hover:border-emerald-500/60'
          }`}
        >
          <div className="text-[11px] text-emerald-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-semibold">
              <LogIn className="w-3.5 h-3.5 text-emerald-400" /> Đang Trong Tòa Nhà
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-300 mt-1">{inBuildingCount}</div>
          <div className="text-[10.5px] text-emerald-400/80 mt-0.5">Khách đã check-in qua sảnh</div>
        </div>

        <div 
          onClick={() => { setFilterStatus('ACTIVE'); setActiveTab('LIST'); }}
          className={`p-3.5 border transition-all cursor-pointer ${
            filterStatus === 'ACTIVE' && activeTab === 'LIST'
              ? 'bg-amber-950/60 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
              : 'bg-[#121820] border-[#222B35] hover:border-amber-500/60'
          }`}
        >
          <div className="text-[11px] text-amber-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-semibold">
              <Clock className="w-3.5 h-3.5 text-amber-400" /> Chờ Check-in
            </span>
            <span className="text-[9.5px] font-mono text-amber-400">Chưa đến</span>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300 mt-1">{pendingCount}</div>
          <div className="text-[10.5px] text-amber-400/80 mt-0.5">Mã thẻ còn thời hạn hiệu lực</div>
        </div>

        <div 
          onClick={() => { setFilterStatus('COMPLETED'); setActiveTab('LIST'); }}
          className={`p-3.5 border transition-all cursor-pointer ${
            filterStatus === 'COMPLETED' && activeTab === 'LIST'
              ? 'bg-[#1E293B] border-sky-400 shadow'
              : 'bg-[#121820] border-[#222B35] hover:border-gray-600'
          }`}
        >
          <div className="text-[11px] text-gray-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <LogOut className="w-3.5 h-3.5 text-gray-400" /> Đã Rời Đi
            </span>
            <span className="text-[9.5px] font-mono text-gray-400">Hoàn tất</span>
          </div>
          <div className="text-2xl font-bold font-mono text-gray-300 mt-1">{completedCount}</div>
          <div className="text-[10.5px] text-gray-400 mt-0.5">Đã check-out ra về an toàn</div>
        </div>
      </div>

      {/* ============================================================= */}
      {/* 3. THANH TAB ĐIỀU HƯỚNG CHỨC NĂNG (DỄ DÀNG CHUYỂN ĐỔI)         */}
      {/* ============================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#222B35] pt-1">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('LIST')}
            className={`px-4 py-2.5 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'LIST'
                ? 'border-[#C5A880] text-[#C5A880] bg-[#161D26]'
                : 'border-transparent text-gray-400 hover:text-white hover:bg-[#121820]'
            }`}
          >
            <ListFilter className="w-4 h-4" />
            <span>Danh Sách Khách Thăm ({filteredPasses.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('SCANNER')}
            className={`px-4 py-2.5 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'SCANNER'
                ? 'border-[#C5A880] text-[#C5A880] bg-[#161D26]'
                : 'border-transparent text-gray-400 hover:text-white hover:bg-[#121820]'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Quầy Quét Mã & Tra Cứu PIN</span>
            {scanResult && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('AUDIT_LOGS')}
            className={`px-4 py-2.5 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'AUDIT_LOGS'
                ? 'border-[#C5A880] text-[#C5A880] bg-[#161D26]'
                : 'border-transparent text-gray-400 hover:text-white hover:bg-[#121820]'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Nhật Ký Ra Vào ({auditLogs.length})</span>
          </button>
        </div>

        {/* Nút chuyển chế độ xem (Bảng / Thẻ) & Dọn dẹp dữ liệu */}
        {activeTab === 'LIST' && (
          <div className="flex items-center gap-2 pb-2 flex-wrap">
            <button
              type="button"
              onClick={handleClearAllData}
              className="px-2.5 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 text-[11px] font-mono transition-all flex items-center gap-1"
              title="Xóa bỏ toàn bộ dữ liệu mẫu / dữ liệu rác để làm việc với dữ liệu thật"
            >
              <span>🗑️ Làm Sạch Dữ Liệu</span>
            </button>

            <div className="flex items-center gap-1.5 pl-1 border-l border-[#222B35]">
              <span className="text-[11px] text-gray-400 mr-1">Hiển thị:</span>
              <button
                type="button"
                onClick={() => setViewLayout('TABLE')}
                className={`p-1.5 border transition-all cursor-pointer ${
                  viewLayout === 'TABLE'
                    ? 'bg-[#C5A880] text-[#0D1117] border-[#C5A880]'
                    : 'bg-[#161B22] text-gray-400 hover:text-white border-[#2D3748]'
                }`}
                title="Dạng bảng chi tiết"
              >
                <ListFilter className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewLayout('CARDS')}
                className={`p-1.5 border transition-all cursor-pointer ${
                  viewLayout === 'CARDS'
                    ? 'bg-[#C5A880] text-[#0D1117] border-[#C5A880]'
                    : 'bg-[#161B22] text-gray-400 hover:text-white border-[#2D3748]'
                }`}
                title="Dạng thẻ hồ sơ trực quan"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================= */}
      {/* TAB 1: DANH SÁCH & QUẢN LÝ KHÁCH THĂM (TABLE / CARDS)          */}
      {/* ============================================================= */}
      {activeTab === 'LIST' && (
        <div className="space-y-4">
          
          {/* Thanh công cụ lọc & tìm kiếm */}
          <div className="p-3.5 bg-[#121820] border border-[#222B35] rounded-none flex flex-wrap items-center justify-between gap-3">
            {/* Bộ lọc tình trạng */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-gray-400 font-mono text-[11px] mr-1">Lọc:</span>
              {[
                { id: 'ALL', label: `Tất Cả (${totalPasses})` },
                { id: 'CHECKED_IN', label: `🟢 Đang Ở Trong (${inBuildingCount})` },
                { id: 'ACTIVE', label: `🟡 Chờ Check-in (${pendingCount})` },
                { id: 'COMPLETED', label: `⚪ Đã Rời Đi (${completedCount})` },
                { id: 'EXPIRED', label: `🔴 Quá Hạn (${expiredCount})` }
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilterStatus(f.id)}
                  className={`px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                    filterStatus === f.id
                      ? 'bg-[#1C2533] text-[#C5A880] border border-[#C5A880] shadow font-bold'
                      : 'text-gray-400 hover:text-white bg-[#161B22]/60 hover:bg-[#161B22] border border-transparent'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Ô tìm kiếm thông minh */}
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-[#C5A880] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Tìm tên khách, PIN, căn 12A05, biển số..."
                className="w-full bg-[#161B22] border border-[#2D3748] pl-9 pr-8 py-1.5 text-xs text-white placeholder-gray-500 rounded-none focus:border-[#C5A880] outline-none"
              />
              {tableSearch && (
                <button
                  type="button"
                  onClick={() => setTableSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* DẠNG 1: DẠNG BẢNG CHI TIẾT (TABLE VIEW) */}
          {viewLayout === 'TABLE' && (
            <div className="p-4 bg-[#121820] border border-[#222B35] rounded-none shadow-xl overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-[#161D26] text-gray-400 uppercase text-[10px] tracking-wider border-y border-[#222B35]">
                  <tr>
                    <th className="py-3 px-3">Mã Vé & PIN</th>
                    <th className="py-3 px-3">Khách Thăm</th>
                    <th className="py-3 px-3">Chủ Hộ Bảo Lãnh</th>
                    <th className="py-3 px-3">Căn Hộ</th>
                    <th className="py-3 px-3">Thời Hạn Hiệu Lực</th>
                    <th className="py-3 px-3">Trạng Thái</th>
                    <th className="py-3 px-3 text-right">Thao Tác Tiếp Đón</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222B35]">
                  {filteredPasses.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-400 text-xs">
                        <Users className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                        <div>Không có khách thăm nào phù hợp với bộ lọc hiện tại.</div>
                        <button
                          type="button"
                          onClick={() => { setFilterStatus('ALL'); setTableSearch(''); }}
                          className="mt-2 text-xs text-[#C5A880] underline cursor-pointer"
                        >
                          Xóa bộ lọc để xem toàn bộ khách
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredPasses.map((pass) => (
                      <tr key={pass.id} className="hover:bg-[#161B22]/80 transition-colors">
                        {/* Mã vé & PIN */}
                        <td className="py-3 px-3">
                          <div className="font-mono font-bold text-white">{pass.id}</div>
                          <div className="text-[10.5px] text-gray-400 font-mono">
                            PIN: <strong className="text-[#C5A880] tracking-wider">{pass.pinCode}</strong>
                          </div>
                        </td>

                        {/* Khách thăm */}
                        <td className="py-3 px-3">
                          <div className="font-bold text-white text-xs">{pass.visitorName}</div>
                          <div className="text-[10.5px] text-gray-400 flex items-center gap-1">
                            {pass.phoneNumber ? (
                              <span>{pass.phoneNumber}</span>
                            ) : (
                              <span className="text-gray-500">Chưa có SĐT</span>
                            )}
                            {pass.licensePlate && (
                              <span className="text-[#C5A880] font-mono">• Xe: {pass.licensePlate}</span>
                            )}
                          </div>
                        </td>

                        {/* Chủ hộ bảo lãnh */}
                        <td className="py-3 px-3">
                          <div className="font-medium text-white">{pass.hostName}</div>
                          <div className="text-[10px] text-gray-400 font-mono">
                            {pass.hostPhone || 'Chủ hộ bảo lãnh'}
                          </div>
                        </td>

                        {/* Căn hộ */}
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 bg-[#1C2533] border border-[#2D3748] rounded-none text-[#C5A880] font-bold font-mono">
                            Căn {pass.apartmentCode}
                          </span>
                        </td>

                        {/* Thời hạn hiệu lực */}
                        <td className="py-3 px-3 text-[11px]">
                          <div className="text-gray-200">
                            Đến {new Date(pass.validUntil).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="text-[10px] text-gray-400">
                            {new Date(pass.validUntil).toLocaleDateString('vi-VN')} ({pass.validHours}h)
                          </div>
                        </td>

                        {/* Trạng thái */}
                        <td className="py-3 px-3">
                          {pass.status === 'CHECKED_IN' ? (
                            <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-500 text-[10.5px] font-bold inline-flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Đang Ở Trong
                            </span>
                          ) : pass.status === 'ACTIVE' ? (
                            <span className="px-2 py-0.5 bg-amber-950 text-amber-300 border border-amber-500 text-[10.5px] font-bold inline-flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-400" /> Chờ Check-in
                            </span>
                          ) : pass.status === 'COMPLETED' ? (
                            <span className="px-2 py-0.5 bg-gray-800 text-gray-300 border border-gray-600 text-[10.5px] font-medium">
                              Đã Rời Đi
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-rose-950 text-rose-300 border border-rose-600 text-[10.5px] font-bold">
                              Quá Hạn
                            </span>
                          )}
                        </td>

                        {/* Thao tác 1-chạm */}
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {pass.status === 'ACTIVE' && (
                              <button
                                type="button"
                                onClick={() => handleCheckIn(pass.id)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-none text-[11px] shadow transition-colors cursor-pointer flex items-center gap-1"
                                title="Xác nhận cho khách vào"
                              >
                                <LogIn className="w-3 h-3" /> Vào
                              </button>
                            )}

                            {pass.status === 'CHECKED_IN' && (
                              <button
                                type="button"
                                onClick={() => handleCheckOut(pass.id)}
                                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-none text-[11px] shadow transition-colors cursor-pointer flex items-center gap-1"
                                title="Xác nhận khách rời đi"
                              >
                                <LogOut className="w-3 h-3" /> Ra
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => openPassDetail(pass)}
                              className="px-2.5 py-1 bg-[#161B22] hover:bg-[#1E2530] text-gray-300 hover:text-white border border-[#2D3748] rounded-none text-[11px] transition-colors cursor-pointer"
                              title="Xem chi tiết thẻ và mã QR"
                            >
                              Thẻ QR
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeletePass(pass)}
                              className="p-1 hover:bg-rose-950/60 text-gray-500 hover:text-rose-400 transition-colors cursor-pointer"
                              title="Hủy thẻ khách"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* DẠNG 2: DẠNG THẺ HỒ SƠ TRỰC QUAN (GRID CARDS VIEW) */}
          {viewLayout === 'CARDS' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPasses.length === 0 ? (
                <div className="col-span-full py-12 text-center text-gray-400 bg-[#121820] border border-[#222B35] p-6">
                  <Users className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                  <div>Không có khách thăm nào phù hợp với bộ lọc hiện tại.</div>
                </div>
              ) : (
                filteredPasses.map((pass) => (
                  <div
                    key={pass.id}
                    className={`p-4 bg-[#121820] border rounded-none shadow-xl flex flex-col justify-between space-y-3 transition-all ${
                      pass.status === 'CHECKED_IN'
                        ? 'border-emerald-500/80 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                        : pass.status === 'ACTIVE'
                        ? 'border-amber-500/60'
                        : 'border-[#222B35]'
                    }`}
                  >
                    <div>
                      {/* Card Header: Căn Hộ & Badge Trạng Thái */}
                      <div className="flex items-center justify-between border-b border-[#222B35] pb-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 bg-[#1C2533] border border-[#2D3748] text-[#C5A880] font-bold font-mono text-xs">
                            Căn {pass.apartmentCode}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono">
                            {pass.towerName || 'Chung Cư Skyline'}
                          </span>
                        </div>

                        <div>
                          {pass.status === 'CHECKED_IN' ? (
                            <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-500 text-[9.5px] font-bold">
                              Đang Ở Trong
                            </span>
                          ) : pass.status === 'ACTIVE' ? (
                            <span className="px-2 py-0.5 bg-amber-950 text-amber-300 border border-amber-500 text-[9.5px] font-bold">
                              Chờ Check-in
                            </span>
                          ) : pass.status === 'COMPLETED' ? (
                            <span className="px-2 py-0.5 bg-gray-800 text-gray-300 border border-gray-600 text-[9.5px] font-medium">
                              Đã Rời Đi
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-rose-950 text-rose-300 border border-rose-600 text-[9.5px] font-bold">
                              Quá Hạn
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Khách Thăm & Chủ Hộ */}
                      <div className="pt-2.5 space-y-1.5 text-xs">
                        <div>
                          <div className="text-gray-400 text-[10.5px]">Khách Thăm:</div>
                          <div className="font-bold text-white text-sm">{pass.visitorName}</div>
                          <div className="text-[11px] text-gray-400 flex items-center gap-1">
                            <span>{pass.phoneNumber || 'Không có SĐT'}</span>
                            {pass.licensePlate && (
                              <span className="text-[#C5A880] font-mono">• {pass.licensePlate}</span>
                            )}
                          </div>
                        </div>

                        <div className="pt-1">
                          <div className="text-gray-400 text-[10.5px]">Chủ Hộ Bảo Lãnh:</div>
                          <div className="font-medium text-gray-200">{pass.hostName}</div>
                          <div className="text-[10.5px] text-gray-400 font-mono">{pass.hostPhone}</div>
                        </div>

                        {/* PIN & Thời Hạn */}
                        <div className="pt-2 p-2 bg-[#161D26] border border-[#222B35] flex items-center justify-between text-[11px]">
                          <div>
                            <span className="text-gray-400 text-[10px] block">MÃ PIN:</span>
                            <span className="font-mono font-bold text-[#C5A880] text-sm tracking-wider">{pass.pinCode}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-gray-400 text-[10px] block">HIỆU LỰC:</span>
                            <span className="text-emerald-300 font-mono text-[10.5px]">
                              Đến {new Date(pass.validUntil).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Thao tác Card footer */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#222B35]">
                      <button
                        type="button"
                        onClick={() => openPassDetail(pass)}
                        className="text-xs text-[#C5A880] hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5" /> Xem Thẻ & QR
                      </button>

                      <div className="flex items-center gap-1.5">
                        {pass.status === 'ACTIVE' && (
                          <button
                            type="button"
                            onClick={() => handleCheckIn(pass.id)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow cursor-pointer flex items-center gap-1"
                          >
                            <LogIn className="w-3.5 h-3.5" /> Check-in
                          </button>
                        )}

                        {pass.status === 'CHECKED_IN' && (
                          <button
                            type="button"
                            onClick={() => handleCheckOut(pass.id)}
                            className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow cursor-pointer flex items-center gap-1"
                          >
                            <LogOut className="w-3.5 h-3.5" /> Check-out
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                ))
              )}
            </div>
          )}

        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 2: QUẦY TIẾP ĐÓN (QUÉT MÃ QR & NHẬP MÃ PIN)               */}
      {/* ============================================================= */}
      {activeTab === 'SCANNER' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Cột Trái (5/12): Thiết Bị Quét Đa Phương Thức */}
          <div className="lg:col-span-5 space-y-4">
            
            <div className="p-4 bg-[#121820] border border-[#2D3748] rounded-none space-y-3.5 shadow-xl">
              {/* Tiêu đề & Chọn phương thức */}
              <div className="flex items-center justify-between border-b border-[#222B35] pb-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-[#C5A880] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" /> Phương Thức Tiếp Đón
                </span>

                <div className="flex gap-1 bg-[#161B22] p-0.5 rounded-none border border-[#222B35] text-[11px]">
                  <button
                    type="button"
                    onClick={() => setScanMode('CAMERA')}
                    className={`px-2.5 py-1 rounded-none transition-all cursor-pointer ${
                      scanMode === 'CAMERA' ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Camera
                  </button>
                  <button
                    type="button"
                    onClick={() => setScanMode('UPLOAD')}
                    className={`px-2.5 py-1 rounded-none transition-all cursor-pointer ${
                      scanMode === 'UPLOAD' ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Tải Ảnh
                  </button>
                  <button
                    type="button"
                    onClick={() => setScanMode('PIN_SEARCH')}
                    className={`px-2.5 py-1 rounded-none transition-all cursor-pointer ${
                      scanMode === 'PIN_SEARCH' ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Nhập PIN
                  </button>
                </div>
              </div>

              {/* Hidden Canvas for QR frame processing */}
              <canvas ref={canvasRef} className="hidden" />

              {/* MODE 1: LIVE CAMERA SCANNER */}
              {scanMode === 'CAMERA' && (
                <div className="space-y-3">
                  <div className="relative w-full h-64 bg-[#090D12] border-2 border-dashed border-[#2D3748] rounded-none overflow-hidden flex items-center justify-center shadow-inner">
                    {isCameraActive ? (
                      <>
                        <video
                          ref={videoRef}
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                        />
                        {/* Targeting box */}
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                          <div className="relative w-48 h-48 border-2 border-emerald-400/80 rounded-none shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-emerald-400"></div>
                            <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-emerald-400"></div>
                            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-emerald-400"></div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-emerald-400"></div>
                            <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent absolute top-0 animate-[bounce_2.2s_infinite]"></div>
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-black/80 rounded-none text-[9.5px] text-emerald-300 font-mono whitespace-nowrap">
                              Đang quét mã QR khách...
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center space-y-2.5 p-4">
                        <div className="w-12 h-12 mx-auto rounded-none bg-[#161D26] border border-[#2D3748] flex items-center justify-center text-[#C5A880]">
                          <CameraOff className="w-6 h-6" />
                        </div>
                        <div className="space-y-0.5">
                          <div className="font-bold text-white text-xs">Camera Tiếp Tân Đang Tắt</div>
                          <p className="text-[11px] text-gray-400 max-w-xs">
                            Bật camera để quét trực tiếp mã QR trên điện thoại của khách thăm khi đến sảnh.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={startCamera}
                          className="px-4 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold rounded-none shadow transition-all flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                        >
                          <Camera className="w-3.5 h-3.5" /> Bật Camera Quét Mã
                        </button>
                      </div>
                    )}

                    {isScanning && (
                      <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center text-white z-20 animate-fadeIn">
                        <div className="text-center space-y-1.5">
                          <RefreshCw className="w-6 h-6 text-[#C5A880] animate-spin mx-auto" />
                          <div className="text-xs font-bold text-[#C5A880]">Đang Đối Chiếu Thông Tin...</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {cameraError && (
                    <div className="p-2.5 bg-rose-950/80 border border-rose-500 rounded-none text-xs text-rose-200 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{cameraError}</span>
                    </div>
                  )}

                  {isCameraActive && (
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="w-full py-2 bg-rose-950/80 hover:bg-rose-900 border border-rose-600 text-rose-300 text-xs font-bold rounded-none flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <CameraOff className="w-3.5 h-3.5" /> Dừng Camera
                    </button>
                  )}
                </div>
              )}

              {/* MODE 2: UPLOAD QR IMAGE */}
              {scanMode === 'UPLOAD' && (
                <div className="space-y-3">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-56 bg-[#090D12] border-2 border-dashed border-[#2D3748] hover:border-[#C5A880] rounded-none flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-colors group"
                  >
                    <div className="w-12 h-12 rounded-none bg-[#161D26] border border-[#2D3748] group-hover:border-[#C5A880] flex items-center justify-center text-[#C5A880] mb-2">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div className="font-bold text-white text-xs">Nhấn Để Tải Ảnh Mã QR Lên</div>
                    <p className="text-[11px] text-gray-400 mt-1 max-w-xs">
                      Hỗ trợ ảnh chụp màn hình thư mời Zalo, Messenger hoặc file ảnh thẻ mời do chủ hộ gửi.
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>
              )}

              {/* MODE 3: MANUAL PIN / PASS ID SEARCH */}
              <div className="pt-1 border-t border-[#222B35]">
                <label className="text-[11px] text-gray-400 font-medium block mb-1">
                  Nhập Nhanh Mã PIN (6 số) Hoặc Mã Vé Thẻ Khách:
                </label>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (pinSearchInput.trim()) {
                      handleVerify(pinSearchInput.trim());
                    }
                  }}
                  className="flex gap-2"
                >
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={pinSearchInput}
                      onChange={(e) => setPinSearchInput(e.target.value)}
                      placeholder="VD: 849201 hoặc SKY-PASS-..."
                      className="w-full bg-[#161B22] border border-[#2D3748] rounded-none px-3 py-2 text-xs text-white placeholder-gray-500 font-mono focus:border-[#C5A880] outline-none pl-8"
                    />
                    <KeyRound className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2.5" />
                  </div>
                  <button
                    type="submit"
                    disabled={!pinSearchInput.trim() || isScanning}
                    className="px-4 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold rounded-none flex items-center gap-1 transition-all disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    <Search className="w-3.5 h-3.5" /> Tra Cứu
                  </button>
                </form>
              </div>

              {/* Phím bấm tra cứu nhanh cho khách mẫu */}
              <div className="pt-2 border-t border-[#222B35]/60 text-[11px] space-y-1.5">
                <span className="text-gray-400 block font-mono text-[10.5px]">Thử nhanh với khách thực tế:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setPinSearchInput('849201');
                      handleVerify('849201');
                    }}
                    className="px-2 py-1 bg-[#161D26] hover:bg-[#1E2530] text-[#C5A880] border border-[#2D3748] rounded-none text-[10.5px] cursor-pointer"
                  >
                    PIN 849201 (Căn 12A05)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPinSearchInput('652190');
                      handleVerify('652190');
                    }}
                    className="px-2 py-1 bg-[#161D26] hover:bg-[#1E2530] text-amber-300 border border-[#2D3748] rounded-none text-[10.5px] cursor-pointer"
                  >
                    PIN 652190 (Chờ vào)
                  </button>
                </div>
              </div>

            </div>

          </div>

          {/* Cột Phải (7/12): Thẻ Khách Thăm Kỹ Thuật Số (Digital Guest Pass) */}
          <div className="lg:col-span-7 space-y-4">
            {scanResult ? (
              <div className="p-5 bg-[#121820] border border-[#2D3748] rounded-none space-y-4 shadow-xl animate-fadeIn">
                
                {/* Status Header Banner */}
                <div className={`p-4 rounded-none border flex items-start justify-between gap-3 ${
                  scanResult.canEnter && scanResult.scanResult === 'VALID'
                    ? scanResult.visitor?.status === 'CHECKED_IN'
                      ? 'bg-amber-950/50 border-amber-500/80 text-amber-200'
                      : 'bg-emerald-950/60 border-emerald-500/80 text-emerald-200'
                    : scanResult.scanResult === 'EXPIRED'
                    ? 'bg-rose-950/60 border-rose-500/80 text-rose-200'
                    : 'bg-rose-950/70 border-rose-600 text-rose-200'
                }`}>
                  <div className="flex items-start gap-3">
                    {scanResult.canEnter && scanResult.scanResult === 'VALID' ? (
                      scanResult.visitor?.status === 'CHECKED_IN' ? (
                        <Clock className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                      ) : (
                        <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                      )
                    ) : (
                      <XCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
                    )}

                    <div className="space-y-0.5">
                      <div className="font-bold text-sm text-white">{scanResult.title}</div>
                      <div className="text-xs text-gray-300 leading-relaxed">{scanResult.message}</div>
                      <div className="text-[10.5px] text-gray-400 pt-1 font-mono">
                        Quét lúc: {scanResult.scannedAt} • {scanResult.checkpoint}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-none border font-mono ${
                      scanResult.canEnter && scanResult.scanResult === 'VALID'
                        ? scanResult.visitor?.status === 'CHECKED_IN'
                          ? 'bg-amber-900 text-amber-300 border-amber-500'
                          : 'bg-emerald-900 text-emerald-300 border-emerald-500'
                        : 'bg-rose-900 text-rose-300 border-rose-500'
                    }`}>
                      {scanResult.visitor?.status === 'CHECKED_IN'
                        ? 'Đang Ở Trong'
                        : scanResult.scanResult === 'VALID'
                        ? 'Hợp Lệ'
                        : 'Không Hợp Lệ'}
                    </span>
                  </div>
                </div>

                {/* 2 Detailed Panels: Host Info vs Visitor Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* 1. THÔNG TIN CHỦ HỘ BẢO LÃNH */}
                  <div className="p-4 bg-[#161D26] border border-[#2D3748] rounded-none space-y-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-[#C5A880] flex items-center justify-between border-b border-[#222B35] pb-2">
                      <span className="flex items-center gap-1.5">
                        <Home className="w-3.5 h-3.5 text-[#C5A880]" /> Chủ Hộ Bảo Lãnh
                      </span>
                      <span className="text-[9.5px] bg-[#1C2533] px-1.5 py-0.5 rounded-none text-emerald-400 font-mono">
                        Cư Dân Thật
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <div className="text-gray-400 text-[10.5px]">Chủ Hộ Căn Hộ:</div>
                        <div className="font-bold text-white text-sm">
                          {scanResult.host?.hostName || 'Chưa xác định'}
                        </div>
                      </div>

                      <div>
                        <div className="text-gray-400 text-[10.5px]">Căn Hộ Điểm Đến:</div>
                        <div className="font-bold text-[#C5A880] text-sm flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5" />
                          <span>Căn {scanResult.host?.apartmentCode}</span>
                          <span className="text-xs text-gray-300 font-normal">
                            ({scanResult.host?.towerName})
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className="text-gray-400 text-[10.5px]">Số Điện Thoại Chủ Hộ:</div>
                        <div className="font-mono text-gray-200 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-gray-400" />
                          <span>{scanResult.host?.hostPhone || '0908.888.888'}</span>
                        </div>
                      </div>

                      <div className="pt-1 text-[10.5px] text-emerald-400 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Tư cách cư trú: Hợp pháp • Đã duyệt e-KYC</span>
                      </div>
                    </div>
                  </div>

                  {/* 2. THÔNG TIN KHÁCH THĂM */}
                  <div className="p-4 bg-[#161D26] border border-[#2D3748] rounded-none space-y-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-[#C5A880] flex items-center justify-between border-b border-[#222B35] pb-2">
                      <span className="flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-[#C5A880]" /> Thông Tin Khách Thăm
                      </span>
                      <span className="text-[9.5px] bg-[#1C2533] px-1.5 py-0.5 rounded-none text-cyan-400 font-mono">
                        Khách Vào
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <div className="text-gray-400 text-[10.5px]">Họ Tên Khách Thăm:</div>
                        <div className="font-bold text-white text-sm">
                          {scanResult.visitor?.visitorName || 'Khách Thăm'}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="text-gray-400 text-[10.5px]">Số Điện Thoại:</div>
                          <div className="font-mono text-gray-200">
                            {scanResult.visitor?.phoneNumber || 'Không có SĐT'}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400 text-[10.5px]">Biển Số Xe:</div>
                          <div className="font-mono font-bold text-[#C5A880]">
                            {scanResult.visitor?.licensePlate || 'Đi bộ / Taxi'}
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="text-gray-400 text-[10.5px]">Thời Hạn Hiệu Lực Thẻ:</div>
                        <div className="text-emerald-400 font-medium text-[11px] flex items-center gap-1">
                          <Clock className="w-3 h-3 shrink-0" />
                          <span>
                            Đến {scanResult.visitor?.validUntil ? new Date(scanResult.visitor.validUntil).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 'Hôm nay'}{' '}
                            ({scanResult.visitor?.validHours || 4} giờ)
                          </span>
                        </div>
                      </div>

                      <div className="pt-1 flex items-center justify-between text-[10.5px] text-gray-400 font-mono">
                        <span>Mã PIN: <strong className="text-[#C5A880] text-xs">{scanResult.visitor?.pinCode}</strong></span>
                        <span>Mã vé: {scanResult.visitor?.passId}</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Action Operations: Check-in / Check-out */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#222B35]">
                  <div className="text-xs text-gray-400">
                    Thao tác tiếp đón tại chốt trực:
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Check-in */}
                    {scanResult.canEnter && scanResult.visitor && scanResult.visitor.status === 'ACTIVE' && (
                      <button
                        type="button"
                        onClick={() => handleCheckIn(scanResult.visitor!.passId)}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-none shadow-lg flex items-center gap-2 transition-all cursor-pointer"
                      >
                        <LogIn className="w-4 h-4" /> Xác Nhận Cho Khách Vào (Check-in)
                      </button>
                    )}

                    {/* Check-out */}
                    {scanResult.visitor && scanResult.visitor.status === 'CHECKED_IN' && (
                      <button
                        type="button"
                        onClick={() => handleCheckOut(scanResult.visitor!.passId)}
                        className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-none shadow-lg flex items-center gap-2 transition-all cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" /> Xác Nhận Khách Rời Đi (Check-out)
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setScanResult(null);
                        setPinSearchInput('');
                      }}
                      className="px-4 py-2 bg-[#161B22] hover:bg-[#1E2530] text-gray-300 text-xs font-medium rounded-none border border-[#2D3748] transition-colors cursor-pointer"
                    >
                      Tiếp Đón Lượt Mới
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              /* Trạng thái chờ quét */
              <div className="p-8 bg-[#121820] border border-dashed border-[#2D3748] rounded-none flex flex-col items-center justify-center text-center min-h-[380px] space-y-3.5 shadow-inner">
                <div className="w-16 h-16 rounded-none bg-[#161D26] border border-[#2D3748] flex items-center justify-center text-[#C5A880]/70">
                  <QrCode className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <div className="font-serif font-bold text-white text-base">Chưa Có Khách Được Quét</div>
                  <p className="text-xs text-gray-400 max-w-sm leading-relaxed">
                    Vui lòng đưa mã QR thẻ mời của khách vào camera bên trái hoặc nhập mã PIN 6 số. Thông tin đối chiếu của chủ hộ và khách thăm sẽ hiển thị lập tức tại đây.
                  </p>
                </div>
                <div className="text-[11px] text-gray-500 flex items-center gap-1.5 pt-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Kiểm soát an ninh tự động • Bảo mật thông tin cư dân Skyline
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 3: NHẬT KÝ RA VÀO (GATE AUDIT LOGS)                        */}
      {/* ============================================================= */}
      {activeTab === 'AUDIT_LOGS' && (
        <div className="p-5 bg-[#121820] border border-[#222B35] rounded-none space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222B35] pb-3">
            <div>
              <h3 className="font-serif text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#C5A880]" />
                Nhật Ký Kiểm Soát An Ninh Ra Vào Tòa Nhà
              </h3>
              <div className="text-[11px] text-gray-400">
                Ghi nhận tự động thời gian thực mọi lượt quét thẻ, xác thực và check-in / check-out của khách thăm.
              </div>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                placeholder="Tìm tên khách, căn hộ, ghi chú..."
                className="w-full bg-[#161B22] border border-[#2D3748] pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 rounded-none focus:border-[#C5A880] outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-[#161D26] text-gray-400 uppercase text-[10px] tracking-wider border-y border-[#222B35]">
                <tr>
                  <th className="py-3 px-3">Thời Gian</th>
                  <th className="py-3 px-3">Căn Hộ & Chủ Hộ</th>
                  <th className="py-3 px-3">Khách Thăm</th>
                  <th className="py-3 px-3">Hành Động</th>
                  <th className="py-3 px-3">Kết Quả</th>
                  <th className="py-3 px-3">Chi Tiết Ghi Nhận</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222B35]">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500 text-xs">
                      Không tìm thấy bản ghi nhật ký nào.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#161B22]/70 transition-colors">
                      <td className="py-3 px-3 font-mono text-[11px] text-gray-300 whitespace-nowrap">
                        {log.timestamp}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-[#C5A880]">Căn {log.apartmentCode}</span>
                        {log.hostName && <div className="text-[10px] text-gray-400">{log.hostName}</div>}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-white text-xs">{log.visitorName || 'Vãng lai'}</div>
                        {log.licensePlate && <div className="text-[10px] text-[#C5A880] font-mono">Xe: {log.licensePlate}</div>}
                      </td>
                      <td className="py-3 px-3">
                        {log.action === 'CHECK_IN' ? (
                          <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-600 text-[10px] font-bold">
                            VÀO TÒA NHÀ
                          </span>
                        ) : log.action === 'CHECK_OUT' ? (
                          <span className="px-2 py-0.5 bg-amber-950 text-amber-300 border border-amber-600 text-[10px] font-bold">
                            RỜI ĐI (CHECK-OUT)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-sky-950 text-sky-300 border border-sky-600 text-[10px] font-medium">
                            QUÉT XÁC THỰC
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-600 text-[10px] font-mono font-bold">
                          {log.result}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[11px] text-gray-300 max-w-xs truncate">
                        {log.note}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 1: CẤP THẺ KHÁCH NHANH TẠI QUẦY (QUICK PASS MODAL)       */}
      {/* ============================================================= */}
      {isQuickPassModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-[#0D1117] border border-[#C5A880] text-white shadow-2xl p-6 rounded-none space-y-4 animate-fadeIn">
            
            <div className="flex items-center justify-between border-b border-[#222B35] pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#C5A880]" />
                <h3 className="font-serif text-lg font-bold text-white">
                  Cấp Thẻ Đón Khách Nhanh Tại Quầy
                </h3>
              </div>
              <button
                type="button"
                onClick={resetQuickPassForm}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!createdQuickPass ? (
              <form onSubmit={handleCreateQuickPass} className="space-y-4 text-xs">
                <div>
                  <label className="text-gray-300 font-medium block mb-1">
                    Căn Hộ Điểm Đến:
                  </label>
                  <select
                    value={newPassApt}
                    onChange={(e) => setNewPassApt(e.target.value)}
                    className="w-full bg-[#161B22] border border-[#2D3748] text-[#C5A880] font-bold p-2.5 outline-none"
                  >
                    <option value="12A05">Căn 12A05 (Chủ hộ: Nguyễn Hữu Lực • 0908.888.888)</option>
                    <option value="10A03">Căn 10A03 (BQL Nghiệm Thu Kỹ Thuật)</option>
                    {apartments.filter(u => u.code !== '12A05' && u.code !== '10A03').slice(0, 15).map(u => (
                      <option key={u.code} value={u.code}>
                        Căn {u.code} (Tầng {u.floor})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-300 font-medium block mb-1">
                      Họ Tên Khách Thăm <span className="text-rose-400">*</span>:
                    </label>
                    <input
                      type="text"
                      required
                      value={newPassVisitorName}
                      onChange={(e) => setNewPassVisitorName(e.target.value)}
                      placeholder="VD: Nguyễn Văn An"
                      className="w-full bg-[#161B22] border border-[#2D3748] text-white p-2.5 outline-none focus:border-[#C5A880]"
                    />
                  </div>
                  <div>
                    <label className="text-gray-300 font-medium block mb-1">
                      Số Điện Thoại Khách:
                    </label>
                    <input
                      type="text"
                      value={newPassVisitorPhone}
                      onChange={(e) => setNewPassVisitorPhone(e.target.value)}
                      placeholder="VD: 0912.345.678"
                      className="w-full bg-[#161B22] border border-[#2D3748] text-white p-2.5 outline-none focus:border-[#C5A880]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-300 font-medium block mb-1">
                      Biển Số Xe (Nếu có):
                    </label>
                    <input
                      type="text"
                      value={newPassPlate}
                      onChange={(e) => setNewPassPlate(e.target.value)}
                      placeholder="VD: 51G-123.45 hoặc để trống"
                      className="w-full bg-[#161B22] border border-[#2D3748] text-[#C5A880] font-mono uppercase p-2.5 outline-none focus:border-[#C5A880]"
                    />
                  </div>
                  <div>
                    <label className="text-gray-300 font-medium block mb-1">
                      Thời Gian Hiệu Lực:
                    </label>
                    <select
                      value={newPassHours}
                      onChange={(e) => setNewPassHours(e.target.value)}
                      className="w-full bg-[#161B22] border border-[#2D3748] text-white p-2.5 outline-none"
                    >
                      <option value="2">2 Giờ (Giao nhận nhanh)</option>
                      <option value="4">4 Giờ (Thăm gia đình tiêu chuẩn)</option>
                      <option value="8">8 Giờ (Làm việc / Sửa chữa)</option>
                      <option value="24">24 Giờ (Trong ngày)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-gray-300 font-medium block mb-1">
                    Ghi Chú Tiếp Đón:
                  </label>
                  <input
                    type="text"
                    value={newPassNote}
                    onChange={(e) => setNewPassNote(e.target.value)}
                    placeholder="VD: Khách lên bàn việc với chủ hộ..."
                    className="w-full bg-[#161B22] border border-[#2D3748] text-white p-2.5 outline-none focus:border-[#C5A880]"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-[#222B35]">
                  <button
                    type="button"
                    onClick={resetQuickPassForm}
                    className="px-4 py-2 bg-[#161B22] hover:bg-[#1E2530] text-gray-300 text-xs font-medium border border-[#2D3748] cursor-pointer"
                  >
                    Hủy Bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold shadow cursor-pointer"
                  >
                    Tạo & Kích Hoạt Thẻ Khách
                  </button>
                </div>
              </form>
            ) : (
              /* Thẻ sau khi tạo thành công */
              <div className="space-y-4 text-center animate-fadeIn">
                <div className="p-3 bg-emerald-950/70 border border-emerald-500 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Đã cấp thẻ khách thăm thành công!</span>
                </div>

                <div className="p-4 bg-[#161D26] border border-[#2D3748] rounded-none flex flex-col items-center space-y-3">
                  {createdQrUrl && (
                    <img src={createdQrUrl} alt="Mã QR Khách" className="w-44 h-44 border-4 border-white shadow-lg" />
                  )}
                  <div className="text-center space-y-1">
                    <div className="text-xs text-gray-400">MÃ PIN BÀN PHÍM CỬA / THANG MÁY:</div>
                    <div className="text-2xl font-mono font-extrabold text-[#C5A880] tracking-widest bg-[#121820] px-4 py-1 border border-[#2D3748]">
                      {createdQuickPass.pinCode}
                    </div>
                  </div>

                  <div className="text-xs text-gray-300 text-center space-y-0.5">
                    <div>Khách: <strong className="text-white">{createdQuickPass.visitorName}</strong> • Căn: <strong className="text-[#C5A880]">{createdQuickPass.apartmentCode}</strong></div>
                    <div className="text-[11px] text-gray-400">Chủ hộ: {createdQuickPass.hostName}</div>
                  </div>
                </div>

                <div className="flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleCheckIn(createdQuickPass.id);
                      resetQuickPassForm();
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow flex items-center gap-1.5 cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" /> Check-in Ngay
                  </button>
                  <button
                    type="button"
                    onClick={resetQuickPassForm}
                    className="px-4 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold shadow cursor-pointer"
                  >
                    Hoàn Tất
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 2: XEM CHI TIẾT THẺ KHÁCH & MÃ QR (DETAIL MODAL)         */}
      {/* ============================================================= */}
      {selectedPassForDetail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-[#0D1117] border border-[#C5A880] text-white shadow-2xl p-6 rounded-none space-y-4 animate-fadeIn">
            
            <div className="flex items-center justify-between border-b border-[#222B35] pb-3">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-[#C5A880]" />
                <h3 className="font-serif text-base font-bold text-white">
                  Thẻ Khách Thăm Kỹ Thuật Số
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPassForDetail(null)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-[#161D26] border border-[#2D3748] rounded-none flex flex-col items-center space-y-3">
              {detailQrDataUrl && (
                <img src={detailQrDataUrl} alt="Mã QR" className="w-48 h-48 border-4 border-white shadow-lg" />
              )}
              
              <div className="text-center space-y-1 w-full">
                <span className="text-[10px] text-gray-400 uppercase tracking-widest block font-mono">Mã PIN 6 Số Tra Cứu:</span>
                <div className="text-2xl font-mono font-extrabold text-[#C5A880] tracking-widest bg-[#121820] py-1 border border-[#2D3748]">
                  {selectedPassForDetail.pinCode}
                </div>
                <div className="text-[10.5px] text-gray-400 font-mono">Mã vé: {selectedPassForDetail.id}</div>
              </div>
            </div>

            {/* Thông tin đối chiếu */}
            <div className="p-3 bg-[#121820] border border-[#222B35] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Khách Thăm:</span>
                <span className="font-bold text-white">{selectedPassForDetail.visitorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Số Điện Thoại:</span>
                <span className="font-mono text-gray-200">{selectedPassForDetail.phoneNumber || 'Không có'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Biển Số Xe:</span>
                <span className="font-mono text-[#C5A880]">{selectedPassForDetail.licensePlate || 'Đi bộ / Taxi'}</span>
              </div>
              <div className="flex justify-between border-t border-[#222B35] pt-1.5">
                <span className="text-gray-400">Căn Hộ Điểm Đến:</span>
                <span className="font-bold text-[#C5A880]">Căn {selectedPassForDetail.apartmentCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Chủ Hộ Bảo Lãnh:</span>
                <span className="text-white">{selectedPassForDetail.hostName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Thời Hạn:</span>
                <span className="text-emerald-400 font-mono">
                  Đến {new Date(selectedPassForDetail.validUntil).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ({new Date(selectedPassForDetail.validUntil).toLocaleDateString('vi-VN')})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Trạng Thái:</span>
                <span className="font-bold text-amber-400">{selectedPassForDetail.status}</span>
              </div>
            </div>

            {/* Thao tác trong Modal */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#222B35]">
              <button
                type="button"
                onClick={() => handleDeletePass(selectedPassForDetail)}
                className="px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-700 text-rose-300 text-xs font-semibold cursor-pointer"
              >
                Hủy Thẻ
              </button>

              <div className="flex items-center gap-2">
                {selectedPassForDetail.status === 'ACTIVE' && (
                  <button
                    type="button"
                    onClick={() => handleCheckIn(selectedPassForDetail.id)}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow flex items-center gap-1 cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" /> Check-in
                  </button>
                )}
                {selectedPassForDetail.status === 'CHECKED_IN' && (
                  <button
                    type="button"
                    onClick={() => handleCheckOut(selectedPassForDetail.id)}
                    className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow flex items-center gap-1 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Check-out
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedPassForDetail(null)}
                  className="px-3.5 py-1.5 bg-[#161B22] text-gray-300 border border-[#2D3748] text-xs cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
