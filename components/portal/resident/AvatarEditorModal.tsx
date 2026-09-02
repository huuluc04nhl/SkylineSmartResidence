'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Camera,
  Upload,
  ZoomIn,
  ZoomOut,
  RotateCw,
  FlipHorizontal,
  Sliders,
  Check,
  RefreshCw,
  Sparkles,
  Image as ImageIcon,
  Move,
  Sun,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { nksUpdateAvatar } from '@/lib/nksApiClient';

interface AvatarEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatarUrl?: string;
  onAvatarUpdated: (newAvatarUrl: string) => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400',
];

type FilterType = 'normal' | 'bright' | 'warm' | 'cool' | 'grayscale';

export default function AvatarEditorModal({
  isOpen,
  onClose,
  currentAvatarUrl,
  onAvatarUpdated,
}: AvatarEditorModalProps) {
  // Source image
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [activeSourceTab, setActiveSourceTab] = useState<'UPLOAD' | 'CAMERA' | 'PRESET'>('UPLOAD');

  // Transform controls
  const [scale, setScale] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [flipHorizontal, setFlipHorizontal] = useState<boolean>(false);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [filter, setFilter] = useState<FilterType>('normal');
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);

  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Camera state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Saving state
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const imageObjRef = useRef<HTMLImageElement | null>(null);

  // Initialize with current avatar if open
  useEffect(() => {
    if (isOpen) {
      if (currentAvatarUrl) {
        setSourceImage(currentAvatarUrl);
      }
      resetTransforms();
      setSaveSuccess(false);
      setSaveError(null);
    } else {
      stopCamera();
    }
  }, [isOpen, currentAvatarUrl]);

  // Reset transforms
  const resetTransforms = () => {
    setScale(1);
    setRotation(0);
    setFlipHorizontal(false);
    setPosition({ x: 0, y: 0 });
    setFilter('normal');
    setBrightness(100);
    setContrast(100);
  };

  // Stop webcam stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Start webcam stream
  const startCamera = async () => {
    stopCamera();
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 640 }, facingMode: 'user' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      setCameraError('Không thể mở camera. Vui lòng cấp quyền truy cập máy ảnh cho trình duyệt.');
      setIsCameraActive(false);
    }
  };

  // Capture photo from camera
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const captureCanvas = document.createElement('canvas');
    captureCanvas.width = video.videoWidth || 640;
    captureCanvas.height = video.videoHeight || 640;
    const ctx = captureCanvas.getContext('2d');
    if (!ctx) return;

    // Mirror camera capture
    ctx.translate(captureCanvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height);

    const dataUrl = captureCanvas.toDataURL('image/jpeg', 0.95);
    setSourceImage(dataUrl);
    stopCamera();
    resetTransforms();
    setActiveSourceTab('UPLOAD');
  };

  // Load image object when sourceImage changes
  useEffect(() => {
    if (!sourceImage) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageObjRef.current = img;
      drawCanvas();
    };
    img.src = sourceImage;
  }, [sourceImage]);

  // Apply CSS / Canvas filters
  const getFilterString = useCallback(() => {
    let base = `brightness(${brightness}%) contrast(${contrast}%)`;
    switch (filter) {
      case 'bright':
        return `${base} brightness(115%) saturate(110%)`;
      case 'warm':
        return `${base} sepia(20%) saturate(120%)`;
      case 'cool':
        return `${base} hue-rotate(15deg) saturate(110%)`;
      case 'grayscale':
        return `${base} grayscale(100%)`;
      default:
        return base;
    }
  }, [filter, brightness, contrast]);

  // Render main editor canvas and preview thumbnail
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageObjRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Save context for transform
    ctx.save();

    // 1. Move to center + pan offset
    ctx.translate(centerX + position.x, centerY + position.y);

    // 2. Rotate
    ctx.rotate((rotation * Math.PI) / 180);

    // 3. Flip & Scale
    ctx.scale(flipHorizontal ? -scale : scale, scale);

    // 4. Apply image filters
    ctx.filter = getFilterString();

    // 5. Draw image centered
    const imgAspect = img.width / img.height;
    let renderW = width;
    let renderH = width / imgAspect;
    if (renderH < height) {
      renderH = height;
      renderW = height * imgAspect;
    }
    ctx.drawImage(img, -renderW / 2, -renderH / 2, renderW, renderH);

    ctx.restore();

    // 6. Draw Circular Mask Overlay on main editor
    ctx.save();
    ctx.fillStyle = 'rgba(10, 14, 20, 0.7)';
    ctx.beginPath();
    ctx.rect(0, 0, width, height);
    const radius = Math.min(width, height) * 0.42;
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();

    // Circle border
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#C5A880';
    ctx.shadowColor = '#C5A880';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 7. Update Mini Preview Canvas (512x512 clean circle)
    const previewCanvas = previewCanvasRef.current;
    if (previewCanvas) {
      const pCtx = previewCanvas.getContext('2d');
      if (pCtx) {
        const pW = previewCanvas.width;
        const pH = previewCanvas.height;
        pCtx.clearRect(0, 0, pW, pH);

        // Circular clipping
        pCtx.save();
        pCtx.beginPath();
        pCtx.arc(pW / 2, pH / 2, pW / 2, 0, Math.PI * 2);
        pCtx.closePath();
        pCtx.clip();

        // Copy from crop area of main canvas
        const srcRadius = radius;
        const srcX = centerX - srcRadius;
        const srcY = centerY - srcRadius;
        const srcSize = srcRadius * 2;

        // Draw cropped source onto preview
        pCtx.drawImage(canvas, srcX, srcY, srcSize, srcSize, 0, 0, pW, pH);
        pCtx.restore();
      }
    }
  }, [position, rotation, scale, flipHorizontal, getFilterString]);

  // Re-draw when any transform changes
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // File selection handler
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setSourceImage(result);
      resetTransforms();
      setActiveSourceTab('UPLOAD');
    };
    reader.readAsDataURL(file);
  };

  // Mouse / Touch drag handling
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY * -0.001;
    setScale((prev) => Math.min(Math.max(0.4, prev + delta), 4));
  };

  // Export cropped circle image and update to NKS API
  const handleApplyAndSave = async () => {
    const previewCanvas = previewCanvasRef.current;
    if (!previewCanvas) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      // Export high quality PNG/JPEG (512x512)
      const croppedBase64 = previewCanvas.toDataURL('image/png', 0.95);

      // Call live NKS updateAvatar API
      const res = await nksUpdateAvatar(croppedBase64);
      if (res.success) {
        const finalUrl = res.avatar_url || croppedBase64;
        onAvatarUpdated(finalUrl);
        setSaveSuccess(true);
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setSaveError('Không thể cập nhật ảnh đại diện lên máy chủ NKS.');
      }
    } catch (err: any) {
      console.error('Error saving avatar:', err);
      setSaveError('Đã xảy ra lỗi khi gửi ảnh lên máy chủ.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
      <div className="bg-[#121820] border border-[#C5A880]/60 rounded-xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-[#161D26] border-b border-[#222B35] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#C5A880]/20 border border-[#C5A880] flex items-center justify-center text-[#C5A880]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-white text-base">
                Chỉnh Sửa & Tùy Biến Ảnh Đại Diện (Avatar Studio)
              </h3>
              <p className="text-[11px] text-gray-400">
                Tự do xoay, phóng to, kéo căn chỉnh khuôn mặt chuẩn nhận diện e-KYC Skyline
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#222B35] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Source Tabs */}
          <div className="flex border-b border-[#222B35] gap-2 pb-2">
            <button
              onClick={() => {
                setActiveSourceTab('UPLOAD');
                stopCamera();
              }}
              className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 transition-all ${
                activeSourceTab === 'UPLOAD'
                  ? 'bg-[#C5A880] text-[#0D1117]'
                  : 'text-gray-400 hover:text-white hover:bg-[#1C2533]'
              }`}
            >
              <Upload className="w-3.5 h-3.5" /> Tải Ảnh Từ Máy
            </button>
            <button
              onClick={() => {
                setActiveSourceTab('CAMERA');
                startCamera();
              }}
              className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 transition-all ${
                activeSourceTab === 'CAMERA'
                  ? 'bg-[#C5A880] text-[#0D1117]'
                  : 'text-gray-400 hover:text-white hover:bg-[#1C2533]'
              }`}
            >
              <Camera className="w-3.5 h-3.5" /> Chụp Bằng Camera
            </button>
            <button
              onClick={() => {
                setActiveSourceTab('PRESET');
                stopCamera();
              }}
              className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 transition-all ${
                activeSourceTab === 'PRESET'
                  ? 'bg-[#C5A880] text-[#0D1117]'
                  : 'text-gray-400 hover:text-white hover:bg-[#1C2533]'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" /> Bộ Sưu Tập Cư Dân VIP
            </button>
          </div>

          {/* Camera View Mode */}
          {activeSourceTab === 'CAMERA' && (
            <div className="p-6 bg-[#0E131A] border border-[#222B35] rounded-xl flex flex-col items-center justify-center space-y-4">
              {cameraError ? (
                <div className="p-4 bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2 rounded-lg">
                  <AlertCircle className="w-4 h-4" />
                  <span>{cameraError}</span>
                </div>
              ) : (
                <div className="relative w-72 h-72 rounded-full overflow-hidden border-4 border-[#C5A880] shadow-2xl bg-black">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                  <div className="absolute inset-0 border border-white/30 rounded-full pointer-events-none" />
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  onClick={capturePhoto}
                  disabled={!isCameraActive}
                  className="px-6 py-2.5 bg-[#C5A880] hover:bg-white text-[#0D1117] font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  <Camera className="w-4 h-4" /> Chụp Ảnh Này
                </button>
                <button
                  onClick={startCamera}
                  className="px-4 py-2.5 bg-[#1C2533] text-gray-300 hover:text-white text-xs font-bold rounded-lg border border-gray-700 flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Khởi Động Lại
                </button>
              </div>
            </div>
          )}

          {/* Preset Avatars View */}
          {activeSourceTab === 'PRESET' && (
            <div className="p-4 bg-[#0E131A] border border-[#222B35] rounded-xl space-y-3">
              <p className="text-xs text-gray-400">
                Chọn một ảnh mẫu chuẩn phong cách Skyline Smart Residence:
              </p>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                {PRESET_AVATARS.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSourceImage(url);
                      resetTransforms();
                      setActiveSourceTab('UPLOAD');
                    }}
                    className={`relative aspect-square rounded-full overflow-hidden border-2 transition-all hover:scale-105 ${
                      sourceImage === url ? 'border-[#C5A880] ring-2 ring-[#C5A880]' : 'border-gray-700'
                    }`}
                  >
                    <img src={url} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Interactive Canvas Workspace & Live Controls */}
          {activeSourceTab === 'UPLOAD' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Left Column: Interactive Canvas Editor */}
              <div className="lg:col-span-2 space-y-3">
                <div className="relative bg-[#0A0E14] border border-[#222B35] rounded-xl overflow-hidden flex items-center justify-center min-h-[340px]">
                  <canvas
                    ref={canvasRef}
                    width={420}
                    height={420}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onWheel={handleWheel}
                    className="cursor-move max-w-full h-auto select-none"
                    title="Kéo chuột để di chuyển • Lăn chuột để phóng to/thu nhỏ"
                  />

                  {/* Drag Hint Overlay */}
                  <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 bg-black/70 backdrop-blur text-[10px] text-gray-300 rounded border border-white/10 flex items-center gap-1.5 pointer-events-none">
                    <Move className="w-3 h-3 text-[#C5A880]" />
                    <span>Giữ & Kéo để căn chỉnh • Lăn chuột để Zoom</span>
                  </div>

                  {/* Hidden File Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>

                {/* Quick Upload from Local Device */}
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-[#1C2533] hover:bg-[#C5A880] hover:text-[#0D1117] border border-gray-700 hover:border-[#C5A880] text-xs font-bold text-white transition-all rounded flex items-center gap-2"
                  >
                    <Upload className="w-3.5 h-3.5" /> Chọn File Ảnh Khác
                  </button>
                  <button
                    type="button"
                    onClick={resetTransforms}
                    className="px-3 py-2 bg-[#161D26] hover:bg-[#222B35] text-gray-400 hover:text-white text-xs rounded border border-gray-700 flex items-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" /> Đặt Lại Căn Chỉnh
                  </button>
                </div>
              </div>

              {/* Right Column: Controls & Result Preview */}
              <div className="space-y-4 bg-[#161D26] p-4 border border-[#222B35] rounded-xl flex flex-col justify-between">
                <div className="space-y-4">
                  {/* Live Final Result Circle Preview */}
                  <div className="flex flex-col items-center justify-center p-3 bg-[#0E131A] rounded-lg border border-[#222B35]">
                    <span className="text-[10px] uppercase font-mono font-bold text-gray-400 mb-2">
                      Xem Trước Kết Quả Chuẩn e-KYC:
                    </span>
                    <div className="relative">
                      <canvas
                        ref={previewCanvasRef}
                        width={128}
                        height={128}
                        className="w-28 h-28 rounded-full border-2 border-[#C5A880] shadow-xl bg-black"
                      />
                      <span className="absolute -bottom-1 -right-1 p-1 bg-[#C5A880] text-[#0D1117] rounded-full shadow">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    </div>
                  </div>

                  {/* 1. Zoom Control */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-gray-300 font-semibold">
                      <span className="flex items-center gap-1.5">
                        <ZoomIn className="w-3.5 h-3.5 text-[#C5A880]" /> Phóng To / Thu Nhỏ:
                      </span>
                      <span className="font-mono text-[#C5A880] text-[11px]">{Math.round(scale * 100)}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setScale((prev) => Math.max(0.4, prev - 0.1))}
                        className="p-1.5 bg-[#222B35] hover:bg-gray-700 rounded text-white"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="range"
                        min="0.4"
                        max="3.0"
                        step="0.05"
                        value={scale}
                        onChange={(e) => setScale(parseFloat(e.target.value))}
                        className="flex-1 accent-[#C5A880] cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={() => setScale((prev) => Math.min(3.0, prev + 0.1))}
                        className="p-1.5 bg-[#222B35] hover:bg-gray-700 rounded text-white"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* 2. Rotate & Flip Buttons */}
                  <div className="space-y-1.5">
                    <label className="text-xs text-gray-300 font-semibold flex items-center gap-1.5">
                      <RotateCw className="w-3.5 h-3.5 text-[#C5A880]" /> Xoay & Lật Ảnh:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRotation((prev) => (prev + 90) % 360)}
                        className="p-2 bg-[#1C2533] hover:bg-[#222B35] text-xs font-semibold text-gray-200 border border-gray-700 rounded flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <RotateCw className="w-3.5 h-3.5 text-[#C5A880]" /> Xoay 90°
                      </button>
                      <button
                        type="button"
                        onClick={() => setFlipHorizontal((prev) => !prev)}
                        className={`p-2 text-xs font-semibold border rounded flex items-center justify-center gap-1.5 transition-colors ${
                          flipHorizontal
                            ? 'bg-[#C5A880] text-[#0D1117] border-[#C5A880]'
                            : 'bg-[#1C2533] hover:bg-[#222B35] text-gray-200 border-gray-700'
                        }`}
                      >
                        <FlipHorizontal className="w-3.5 h-3.5" /> Lật Ngang
                      </button>
                    </div>
                  </div>

                  {/* 3. Color Preset Filters */}
                  <div className="space-y-1.5">
                    <label className="text-xs text-gray-300 font-semibold flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-[#C5A880]" /> Bộ Lọc Màu Sắc:
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                      {(
                        [
                          { id: 'normal', name: 'Tự Nhiên' },
                          { id: 'bright', name: 'Tươi Sáng' },
                          { id: 'warm', name: 'Ấm Áp' },
                          { id: 'cool', name: 'Mát Mẻ' },
                          { id: 'grayscale', name: 'Trắng Đen' },
                        ] as const
                      ).map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setFilter(item.id)}
                          className={`py-1.5 px-2 font-semibold rounded border transition-colors ${
                            filter === item.id
                              ? 'bg-[#C5A880] text-[#0D1117] border-[#C5A880]'
                              : 'bg-[#0E131A] text-gray-300 border-gray-700 hover:border-gray-500'
                          }`}
                        >
                          {item.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Status Messages */}
                {saveSuccess && (
                  <div className="p-3 bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2 rounded animate-fadeIn">
                    <Check className="w-4 h-4 flex-shrink-0" />
                    <span>Đã cập nhật ảnh đại diện lên máy chủ NKS thành công!</span>
                  </div>
                )}
                {saveError && (
                  <div className="p-3 bg-rose-950/70 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2 rounded animate-fadeIn">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{saveError}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-[#161D26] border-t border-[#222B35] flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-gray-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Đồng bộ tức thì với Barrier tự động, Cổng bảo vệ & Smart Home</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-[#1C2533] hover:bg-[#222B35] text-gray-300 text-xs font-bold rounded-lg border border-gray-700 transition-colors"
            >
              Đóng
            </button>

            <button
              type="button"
              disabled={isSaving || !sourceImage}
              onClick={handleApplyAndSave}
              className="px-6 py-2.5 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider rounded-lg shadow-xl flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 stroke-[3]" />}
              {isSaving ? 'Đang Lưu Lên NKS API...' : 'Cắt & Lưu Ảnh Đại Diện'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
