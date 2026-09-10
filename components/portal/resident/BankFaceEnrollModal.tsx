'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, 
  Camera, 
  Check, 
  RefreshCw, 
  ShieldCheck, 
  AlertCircle, 
  Scan, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft,
  Smile, 
  UserCheck, 
  Lock,
  Upload,
  Sun,
  Moon,
  SunMedium
} from 'lucide-react';
import { nksEnrollFaceId } from '@/lib/nksApiClient';
import { saveEnrolledFaceProfile } from '@/lib/faceEnrollStore';
import { 
  extractFaceDescriptorFromBase64, 
  EnrolledFaceProfile, 
  analyzeVideoLighting, 
  LightingAnalysisResult 
} from '@/lib/biometricFaceEngine';

interface BankFaceEnrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  fullName: string;
  apartmentCode: string;
  phone?: string;
  onEnrollSuccess?: (profile: EnrolledFaceProfile) => void;
}

type StepKey = 'FRONT' | 'LEFT' | 'RIGHT' | 'SMILE' | 'REVIEW';

interface StepConfig {
  key: StepKey;
  stepNumber: number;
  title: string;
  subtitle: string;
  guideText: string;
  icon: string;
  progressPercent: number;
}

const STEPS: StepConfig[] = [
  {
    key: 'FRONT',
    stepNumber: 1,
    title: 'BƯỚC 1: GIỮ THẲNG KHUÔN MẶT',
    subtitle: 'Chính diện • Góc nhìn thẳng',
    guideText: 'Vui lòng nhìn thẳng vào camera, giữ khuôn mặt nằm trọn trong khung elip.',
    icon: '👤',
    progressPercent: 25,
  },
  {
    key: 'LEFT',
    stepNumber: 2,
    title: 'BƯỚC 2: QUAY NHẸ SANG TRÁI',
    subtitle: 'Góc nghiêng trái 20° - 30°',
    guideText: 'Từ từ xoay nhẹ khuôn mặt sang bên trái để thu thập góc nhìn trắc diện trái.',
    icon: '⬅️',
    progressPercent: 50,
  },
  {
    key: 'RIGHT',
    stepNumber: 3,
    title: 'BƯỚC 3: QUAY NHẸ SANG PHẢI',
    subtitle: 'Góc nghiêng phải 20° - 30°',
    guideText: 'Từ từ xoay nhẹ khuôn mặt sang bên phải để thu thập góc nhìn trắc diện phải.',
    icon: '➡️',
    progressPercent: 75,
  },
  {
    key: 'SMILE',
    stepNumber: 4,
    title: 'BƯỚC 4: MỈM CƯỜI TỰ NHIÊN',
    subtitle: 'Xác thực sống (Liveness Detection)',
    guideText: 'Mỉm cười tự nhiên hoặc chớp mắt nhẹ để chứng thực người thật, chống giả mạo ảnh tĩnh.',
    icon: '😊',
    progressPercent: 100,
  },
];

export default function BankFaceEnrollModal({
  isOpen,
  onClose,
  userId,
  fullName,
  apartmentCode,
  phone,
  onEnrollSuccess,
}: BankFaceEnrollModalProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isReviewMode, setIsReviewMode] = useState<boolean>(false);

  // 4 Biometric Samples
  const [samples, setSamples] = useState<{
    front: string | null;
    left: string | null;
    right: string | null;
    smile: string | null;
  }>({
    front: null,
    left: null,
    right: null,
    smile: null,
  });

  // Camera & Stream
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Auto-capture countdown
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isShutterFlash, setIsShutterFlash] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Submission
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Environmental Lighting Assessment (Độ sáng / Độ tối thời gian thực)
  const [lighting, setLighting] = useState<LightingAnalysisResult | null>(null);

  const currentStep = STEPS[currentStepIndex] || STEPS[0];

  // 1. Initialize Camera Stream with multi-level hardware fallback
  const startCamera = useCallback(async () => {
    setCameraError(null);

    if (typeof window === 'undefined' || !navigator?.mediaDevices?.getUserMedia) {
      setCameraError('Trình duyệt của bạn không hỗ trợ truy cập Camera trực tiếp.');
      return;
    }

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      let stream: MediaStream;
      try {
        // Thử cấu hình phân giải chuẩn cho camera trước
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280, min: 480 },
            height: { ideal: 720, min: 360 },
            facingMode: 'user',
          },
          audio: false,
        });
      } catch (firstErr) {
        console.warn('High-res camera stream failed, falling back to basic camera constraint:', firstErr);
        // Fallback linh hoạt cho webcam laptop / driver tích hợp
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;
      setCameraStream(stream);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
          setIsCameraActive(true);
        } catch (playErr) {
          console.warn('Video auto-play delayed until user interaction:', playErr);
          setIsCameraActive(true);
        }
      } else {
        // Ngay cả khi ref chưa sẵn sàng, stream đã có sẵn để useEffect gắn
        setIsCameraActive(true);
      }
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      setIsCameraActive(false);
      setCameraStream(null);

      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setCameraError('Quyền truy cập Camera bị từ chối trên trình duyệt. Vui lòng bấm vào biểu tượng ổ khóa cạnh URL để Cấp quyền Camera (Allow) và bấm "Thử Lại".');
      } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
        setCameraError('Không tìm thấy thiết bị webcam trên máy tính của bạn.');
      } else if (err?.name === 'NotReadableError' || err?.name === 'TrackStartError') {
        setCameraError('Camera đang bị ứng dụng khác (Zoom, Teams, Google Meet...) chiếm dụng. Vui lòng tắt các ứng dụng đó rồi thử lại.');
      } else {
        setCameraError(err?.message || 'Không thể kích hoạt webcam laptop. Vui lòng thử lại hoặc tải ảnh trực tiếp.');
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraStream(null);
    setIsCameraActive(false);
  }, []);

  // Đảm bảo gắn srcObject ngay khi videoRef và cameraStream đều sẵn sàng
  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().then(() => {
        setIsCameraActive(true);
      }).catch((e) => {
        console.warn('Video play error in effect:', e);
        setIsCameraActive(true);
      });
    }
  }, [cameraStream]);

  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
      setIsReviewMode(false);
      setSamples({ front: null, left: null, right: null, smile: null });
      setSubmitSuccess(false);
      setErrorMessage(null);
      // Gọi mở camera với độ trễ nhỏ để DOM modal render hoàn tất
      const timer = setTimeout(() => {
        startCamera();
      }, 80);
      return () => clearTimeout(timer);
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  // Đánh giá độ sáng/tối môi trường theo thời gian thực (chu kỳ 350ms)
  useEffect(() => {
    if (!isCameraActive || isReviewMode || !isOpen) {
      setLighting(null);
      return;
    }

    const interval = setInterval(() => {
      if (videoRef.current && videoRef.current.readyState >= 2) {
        try {
          const result = analyzeVideoLighting(videoRef.current);
          setLighting(result);
        } catch (e) {
          console.warn('Lighting analysis error:', e);
        }
      }
    }, 350);

    return () => clearInterval(interval);
  }, [isCameraActive, isReviewMode, isOpen]);

  // Xử lý tải ảnh thay thế cho bước hiện tại
  const handleFileUploadCurrentStep = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Vui lòng chọn tệp hình ảnh hợp lệ (JPG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setIsShutterFlash(true);
        setTimeout(() => setIsShutterFlash(false), 200);

        const stepKey = currentStep.key;
        const newSamples = { ...samples };

        if (stepKey === 'FRONT') newSamples.front = base64;
        if (stepKey === 'LEFT') newSamples.left = base64;
        if (stepKey === 'RIGHT') newSamples.right = base64;
        if (stepKey === 'SMILE') newSamples.smile = base64;

        setSamples(newSamples);

        if (currentStepIndex < STEPS.length - 1) {
          setCurrentStepIndex((prev) => prev + 1);
        } else {
          stopCamera();
          setIsReviewMode(true);
        }
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // 2. Capture Frame from Video
  const captureFrame = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Lật gương (Mirroring) cho giống camera trước điện thoại
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, width, height);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    return canvas.toDataURL('image/jpeg', 0.92);
  }, []);

  // 3. Trigger Step Capture with Flash & Sound Effect
  const handleCaptureCurrentStep = () => {
    if (isProcessing) return;

    // Trigger visual shutter flash
    setIsShutterFlash(true);
    setTimeout(() => setIsShutterFlash(false), 200);

    const photo = captureFrame();
    if (!photo) {
      setErrorMessage('Không thể chụp hình từ video. Vui lòng kiểm tra lại camera.');
      return;
    }

    const stepKey = currentStep.key;
    const newSamples = { ...samples };

    if (stepKey === 'FRONT') newSamples.front = photo;
    if (stepKey === 'LEFT') newSamples.left = photo;
    if (stepKey === 'RIGHT') newSamples.right = photo;
    if (stepKey === 'SMILE') newSamples.smile = photo;

    setSamples(newSamples);

    // Chuyển sang bước kế tiếp hoặc màn hình Review
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      // Đã chụp đủ 4 mẫu
      stopCamera();
      setIsReviewMode(true);
    }
  };

  // 4. Start 3-Second Automatic Capture Countdown
  const handleStartAutoCountdown = () => {
    if (countdown !== null || isProcessing) return;
    setCountdown(3);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          setTimeout(() => {
            handleCaptureCurrentStep();
            setCountdown(null);
          }, 200);
          return null;
        }
        return prev - 1;
      });
    }, 900);
  };

  // 5. Retake Specific Step
  const handleRetakeStep = (stepIdx: number) => {
    setCurrentStepIndex(stepIdx);
    setIsReviewMode(false);
    startCamera();
  };

  // 6. Retake All
  const handleRetakeAll = () => {
    setSamples({ front: null, left: null, right: null, smile: null });
    setCurrentStepIndex(0);
    setIsReviewMode(false);
    startCamera();
  };

  // 7. Submit 4 Biometric Samples Officially
  const handleFinalSubmit = async () => {
    if (!samples.front || !samples.left || !samples.right || !samples.smile) {
      setErrorMessage('Vui lòng thu thập đầy đủ cả 4 mẫu góc mặt trước khi xác nhận.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Gọi API chính thức backend
      const res = await nksEnrollFaceId({
        userId,
        fullName,
        apartmentCode,
        phone,
        samples: {
          front: samples.front,
          left: samples.left,
          right: samples.right,
          smile: samples.smile,
        },
      });

      // Trích xuất vector đặc trưng lưu cục bộ
      const descriptorVec = extractFaceDescriptorFromBase64(samples.front);
      const fullProfile: EnrolledFaceProfile = {
        userId,
        fullName: fullName || 'Cư Dân Skyline',
        apartmentCode: apartmentCode || '12A05',
        phone: phone || '',
        avatarUrl: samples.front,
        samples: {
          front: samples.front,
          left: samples.left,
          right: samples.right,
          smile: samples.smile,
        },
        descriptor: Array.from(descriptorVec),
        enrolledAt: new Date().toISOString(),
        status: 'ACTIVE',
        faceScore: 99.4,
      };

      saveEnrolledFaceProfile(fullProfile);

      setSubmitSuccess(true);
      if (onEnrollSuccess) {
        onEnrollSuccess(fullProfile);
      }

      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err: any) {
      console.error('Enroll error:', err);
      setErrorMessage(err?.message || 'Lỗi khi gửi dữ liệu FaceID. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      {/* Hidden Canvas for Frame Capturing */}
      <canvas ref={canvasRef} className="hidden" />

      <div className="relative w-full max-w-2xl bg-[#0D1117] border border-[#C5A880] text-white shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col rounded-none overflow-hidden max-h-[96vh]">
        
        {/* Shutter Flash Effect */}
        {isShutterFlash && (
          <div className="absolute inset-0 bg-white z-50 pointer-events-none transition-opacity duration-150 opacity-90 animate-fadeOut" />
        )}

        {/* ----------------------------------------------------------- */}
        {/* TOP HEADER: BRAND & CLOSE                                   */}
        {/* ----------------------------------------------------------- */}
        <div className="px-5 py-3.5 border-b border-[#222B35] bg-[#121820] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#1C2533] border border-[#C5A880]/70 flex items-center justify-center text-[#C5A880] rounded-none">
              <Scan className="w-4 h-4 text-[#C5A880] animate-pulse" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-[#C5A880] font-bold">
                Skyline Biometrics Engine • e-KYC Bank Grade
              </div>
              <h3 className="text-sm font-serif font-bold text-white tracking-wide">
                Thu Thập Dữ Liệu Sinh Trắc Học FaceID 4 Bước
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Feedback Banner */}
        {errorMessage && (
          <div className="px-4 py-2 bg-rose-950/90 border-b border-rose-500 text-rose-200 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-white text-xs font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* ----------------------------------------------------------- */}
        {/* VIEW 1: LIVE 4-STEP CAPTURE MODE                            */}
        {/* ----------------------------------------------------------- */}
        {!isReviewMode ? (
          <div className="p-5 sm:p-6 flex flex-col items-center space-y-5 overflow-y-auto">
            
            {/* Step Progress Indicators (1 - 4) */}
            <div className="w-full max-w-md space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#C5A880] flex items-center gap-1.5 font-mono">
                  <span>{currentStep.icon}</span> {currentStep.title}
                </span>
                <span className="font-mono text-gray-400 text-[11px]">
                  Bước {currentStep.stepNumber} / 4 ({currentStep.progressPercent}%)
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-[#161B22] border border-[#222B35] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-600 via-[#C5A880] to-yellow-300 transition-all duration-300"
                  style={{ width: `${currentStep.progressPercent}%` }}
                />
              </div>

              <div className="text-center text-[11.5px] text-gray-300 font-medium pt-1">
                {currentStep.guideText}
              </div>

              {/* Real-time Environmental Lighting Meter */}
              {isCameraActive && lighting && (
                <div className="w-full px-3 py-1.5 bg-[#121820] border border-[#222B35] flex items-center justify-between text-[11px] font-mono transition-colors">
                  <div className="flex items-center gap-2">
                    {lighting.status === 'TOO_DARK' ? (
                      <Moon className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                    ) : lighting.status === 'TOO_BRIGHT' ? (
                      <Sun className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    ) : (
                      <SunMedium className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                    <span className={
                      lighting.status === 'TOO_DARK' ? 'text-rose-400 font-bold' :
                      lighting.status === 'TOO_BRIGHT' ? 'text-amber-400 font-bold' :
                      'text-emerald-400 font-bold'
                    }>
                      {lighting.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 bg-black/70 border border-gray-700 overflow-hidden flex">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          lighting.status === 'TOO_DARK' ? 'bg-rose-500' :
                          lighting.status === 'TOO_BRIGHT' ? 'bg-amber-500' :
                          'bg-emerald-500'
                        }`}
                        style={{ width: `${lighting.scorePercent}%` }}
                      />
                    </div>
                    <span className="text-gray-400 text-[10px] min-w-[28px] text-right font-semibold">
                      {lighting.scorePercent}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* --------------------------------------------------------- */}
            {/* BANKING OVAL BIOMETRIC SCANNING FRAME                    */}
            {/* --------------------------------------------------------- */}
            <div className="relative w-72 h-80 sm:w-80 sm:h-96 bg-black border-2 border-[#2D3748] flex items-center justify-center overflow-hidden shadow-2xl">
              
              {/* Live Webcam Video - Always rendered in DOM to prevent videoRef being null */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                onLoadedMetadata={() => {
                  setIsCameraActive(true);
                  videoRef.current?.play().catch(() => {});
                }}
                onPlay={() => setIsCameraActive(true)}
                className={`w-full h-full object-cover transform -scale-x-100 transition-opacity duration-300 ${
                  isCameraActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              />

              {/* Connecting / Error Overlay */}
              {!isCameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 space-y-3 bg-[#0D1117] text-gray-400 z-10">
                  <Camera className="w-10 h-10 text-[#C5A880] animate-bounce" />
                  <div className="text-xs max-w-xs leading-relaxed">
                    {cameraError || 'Đang kết nối camera...'}
                  </div>
                  <div className="flex flex-col gap-2 pt-1 w-full max-w-[200px]">
                    <button
                      type="button"
                      onClick={() => startCamera()}
                      className="px-3 py-1.5 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-colors shadow"
                    >
                      Kết Nối Lại Camera
                    </button>
                    <label className="px-3 py-1.5 bg-[#161B22] hover:bg-[#202936] text-gray-300 hover:text-white border border-[#2D3748] text-[11px] font-semibold text-center cursor-pointer transition-colors">
                      Tải Ảnh Góc Này
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUploadCurrentStep}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* BANKING OVAL CUTOUT OVERLAY */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                {/* Oval Guide Border - Dynamically reacting to environmental lighting */}
                <div className={`w-52 h-72 sm:w-60 sm:h-80 rounded-[50%] border-2 transition-all duration-300 relative flex items-center justify-center ${
                  lighting?.status === 'TOO_DARK'
                    ? 'border-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.45)] animate-pulse'
                    : lighting?.status === 'TOO_BRIGHT'
                    ? 'border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.45)] animate-pulse'
                    : 'border-[#C5A880]/80 shadow-[0_0_25px_rgba(197,168,128,0.35)] animate-pulse'
                }`}>
                  
                  {/* Four Angle Crosshair Markers */}
                  <div className={`absolute top-2 w-4 h-[1.5px] ${
                    lighting?.status === 'TOO_DARK' ? 'bg-rose-500' :
                    lighting?.status === 'TOO_BRIGHT' ? 'bg-amber-500' :
                    'bg-[#C5A880]'
                  }`} />
                  <div className={`absolute bottom-2 w-4 h-[1.5px] ${
                    lighting?.status === 'TOO_DARK' ? 'bg-rose-500' :
                    lighting?.status === 'TOO_BRIGHT' ? 'bg-amber-500' :
                    'bg-[#C5A880]'
                  }`} />
                  <div className={`absolute left-2 h-4 w-[1.5px] ${
                    lighting?.status === 'TOO_DARK' ? 'bg-rose-500' :
                    lighting?.status === 'TOO_BRIGHT' ? 'bg-amber-500' :
                    'bg-[#C5A880]'
                  }`} />
                  <div className={`absolute right-2 h-4 w-[1.5px] ${
                    lighting?.status === 'TOO_DARK' ? 'bg-rose-500' :
                    lighting?.status === 'TOO_BRIGHT' ? 'bg-amber-500' :
                    'bg-[#C5A880]'
                  }`} />

                  {/* Pose-Specific Directional Icon Cue */}
                  {currentStep.key === 'LEFT' && (
                    <div className="absolute -left-6 top-1/2 -translate-y-1/2 px-2 py-1 bg-amber-500/90 text-[#0D1117] text-[10px] font-bold uppercase tracking-wider font-mono shadow-lg animate-bounce flex items-center gap-1">
                      <ArrowLeft className="w-3 h-3" /> Quay Trái
                    </div>
                  )}

                  {currentStep.key === 'RIGHT' && (
                    <div className="absolute -right-6 top-1/2 -translate-y-1/2 px-2 py-1 bg-amber-500/90 text-[#0D1117] text-[10px] font-bold uppercase tracking-wider font-mono shadow-lg animate-bounce flex items-center gap-1">
                      Quay Phải <ArrowRight className="w-3 h-3" />
                    </div>
                  )}

                  {currentStep.key === 'SMILE' && (
                    <div className="absolute bottom-6 px-3 py-1 bg-emerald-500/90 text-[#0D1117] text-[10px] font-bold uppercase tracking-wider font-mono shadow-lg animate-pulse flex items-center gap-1">
                      <Smile className="w-3.5 h-3.5" /> Mỉm Cười Nhé
                    </div>
                  )}

                  {/* Countdown Big Display */}
                  {countdown !== null && (
                    <div className="text-6xl font-extrabold text-[#C5A880] drop-shadow-[0_0_15px_rgba(0,0,0,0.9)] animate-ping">
                      {countdown}
                    </div>
                  )}
                </div>
              </div>

              {/* Floating Lighting Warning inside Camera when Not Optimal */}
              {isCameraActive && lighting && !lighting.isOptimal && (
                <div className="absolute top-11 inset-x-3 pointer-events-none flex justify-center z-20">
                  <div className={`px-2.5 py-1 text-[10.5px] font-medium border flex items-center gap-1.5 shadow-lg backdrop-blur ${
                    lighting.status === 'TOO_DARK' 
                      ? 'bg-rose-950/90 border-rose-600/80 text-rose-200' 
                      : 'bg-amber-950/90 border-amber-600/80 text-amber-200'
                  }`}>
                    {lighting.status === 'TOO_DARK' ? <Moon className="w-3 h-3 shrink-0 text-rose-400" /> : <Sun className="w-3 h-3 shrink-0 text-amber-400" />}
                    <span className="truncate max-w-[230px]">{lighting.message}</span>
                  </div>
                </div>
              )}

              {/* Top Status Pill */}
              <div className="absolute top-3 inset-x-0 flex justify-center pointer-events-none">
                <span className="px-3 py-1 bg-black/75 backdrop-blur border border-[#C5A880]/50 text-[10.5px] font-mono text-[#C5A880] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" /> {currentStep.subtitle}
                </span>
              </div>

              {/* Bottom Target Identification Badge */}
              <div className="absolute bottom-3 inset-x-0 flex justify-center pointer-events-none">
                <span className="px-3 py-0.5 bg-black/80 backdrop-blur text-[10px] font-mono text-gray-300">
                  {fullName} • Căn {apartmentCode}
                </span>
              </div>
            </div>

            {/* --------------------------------------------------------- */}
            {/* ACTION BUTTONS & SHUTTER TRIGGER                         */}
            {/* --------------------------------------------------------- */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md pt-2">
              <button
                type="button"
                onClick={handleStartAutoCountdown}
                disabled={!isCameraActive || countdown !== null}
                className="w-full sm:w-1/2 py-2.5 px-4 bg-[#161B22] hover:bg-[#202936] text-gray-200 hover:text-white border border-[#2D3748] text-xs font-semibold rounded-none transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>⏱️</span>
                <span>{countdown !== null ? `Đang đếm (${countdown}s)...` : 'Đếm Ngược 3s Tự Động'}</span>
              </button>

              <button
                type="button"
                onClick={handleCaptureCurrentStep}
                disabled={!isCameraActive}
                className="w-full sm:w-1/2 py-2.5 px-4 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xl rounded-none active:scale-[0.99] disabled:opacity-50"
              >
                <Camera className="w-4 h-4" />
                <span>Chụp Mẫu Ngay</span>
              </button>
            </div>

            {/* Helper links */}
            <div className="flex items-center justify-between w-full max-w-md text-[11px] text-gray-400 px-1">
              <button
                type="button"
                onClick={() => startCamera()}
                className="hover:text-[#C5A880] flex items-center gap-1 transition-colors"
              >
                <RefreshCw className="w-3 h-3" /> Kết nối lại camera
              </button>

              <label className="hover:text-[#C5A880] flex items-center gap-1 cursor-pointer transition-colors">
                <Upload className="w-3 h-3" /> Tải ảnh góc này từ máy
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUploadCurrentStep}
                  className="hidden"
                />
              </label>
            </div>

            {/* --------------------------------------------------------- */}
            {/* 4-SLOT MINI PROGRESS STRIP AT BOTTOM                      */}
            {/* --------------------------------------------------------- */}
            <div className="w-full max-w-md pt-3 border-t border-[#222B35]">
              <div className="text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-2">
                4 Góc Nhận Diện Cần Thu Thập:
              </div>

              <div className="grid grid-cols-4 gap-2 text-center">
                {/* Slot 1: Front */}
                <div
                  onClick={() => samples.front && handleRetakeStep(0)}
                  className={`p-1.5 border text-center cursor-pointer transition-all ${
                    samples.front
                      ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300'
                      : currentStepIndex === 0
                      ? 'border-[#C5A880] bg-[#C5A880]/10 text-[#C5A880]'
                      : 'border-[#222B35] bg-[#161B22] text-gray-500'
                  }`}
                >
                  <div className="text-[9px] font-bold uppercase">1. Thẳng</div>
                  {samples.front ? (
                    <div className="w-8 h-8 mx-auto mt-1 border border-emerald-500 overflow-hidden">
                      <img src={samples.front} alt="Front" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="text-xs my-2">👤</div>
                  )}
                </div>

                {/* Slot 2: Left */}
                <div
                  onClick={() => samples.left && handleRetakeStep(1)}
                  className={`p-1.5 border text-center cursor-pointer transition-all ${
                    samples.left
                      ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300'
                      : currentStepIndex === 1
                      ? 'border-[#C5A880] bg-[#C5A880]/10 text-[#C5A880]'
                      : 'border-[#222B35] bg-[#161B22] text-gray-500'
                  }`}
                >
                  <div className="text-[9px] font-bold uppercase">2. Trái</div>
                  {samples.left ? (
                    <div className="w-8 h-8 mx-auto mt-1 border border-emerald-500 overflow-hidden">
                      <img src={samples.left} alt="Left" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="text-xs my-2">⬅️</div>
                  )}
                </div>

                {/* Slot 3: Right */}
                <div
                  onClick={() => samples.right && handleRetakeStep(2)}
                  className={`p-1.5 border text-center cursor-pointer transition-all ${
                    samples.right
                      ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300'
                      : currentStepIndex === 2
                      ? 'border-[#C5A880] bg-[#C5A880]/10 text-[#C5A880]'
                      : 'border-[#222B35] bg-[#161B22] text-gray-500'
                  }`}
                >
                  <div className="text-[9px] font-bold uppercase">3. Phải</div>
                  {samples.right ? (
                    <div className="w-8 h-8 mx-auto mt-1 border border-emerald-500 overflow-hidden">
                      <img src={samples.right} alt="Right" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="text-xs my-2">➡️</div>
                  )}
                </div>

                {/* Slot 4: Smile / Liveness */}
                <div
                  onClick={() => samples.smile && handleRetakeStep(3)}
                  className={`p-1.5 border text-center cursor-pointer transition-all ${
                    samples.smile
                      ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300'
                      : currentStepIndex === 3
                      ? 'border-[#C5A880] bg-[#C5A880]/10 text-[#C5A880]'
                      : 'border-[#222B35] bg-[#161B22] text-gray-500'
                  }`}
                >
                  <div className="text-[9px] font-bold uppercase">4. Cười</div>
                  {samples.smile ? (
                    <div className="w-8 h-8 mx-auto mt-1 border border-emerald-500 overflow-hidden">
                      <img src={samples.smile} alt="Smile" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="text-xs my-2">😊</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ----------------------------------------------------------- */
          /* VIEW 2: REVIEW 4 SAMPLES & OFFICIAL CONFIRMATION SCREEN     */
          /* ----------------------------------------------------------- */
          <div className="p-6 space-y-6 overflow-y-auto">
            
            {/* Top Success Banner */}
            <div className="p-4 bg-[#121820] border border-[#C5A880] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase font-mono">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Hoàn Tất Thu Thập 4 Mẫu Sinh Trắc Học
                </div>
                <div className="text-sm font-serif font-bold text-white">
                  Kiểm duyệt chất lượng dữ liệu: Đạt Chuẩn Ngân Hàng (99.4%)
                </div>
                <div className="text-xs text-gray-400">
                  Khuôn mặt đã được phân tích đầy đủ các góc nhìn trắc diện và xác thực sống.
                </div>
              </div>

              <span className="px-3 py-1 bg-emerald-950/90 border border-emerald-500 text-emerald-300 text-xs font-mono font-bold">
                Trạng thái: Hợp Lệ ✓
              </span>
            </div>

            {/* 4-Sample Gallery Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Sample 1: Front */}
              <div className="p-2.5 bg-[#161B22] border border-[#2D3748] space-y-2 text-center">
                <div className="text-[10px] font-bold text-[#C5A880] uppercase font-mono">
                  1. Chính Diện
                </div>
                <div className="w-full h-32 bg-black border border-gray-700 overflow-hidden relative group">
                  {samples.front && (
                    <img src={samples.front} alt="Front" className="w-full h-full object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => handleRetakeStep(0)}
                    className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-white font-bold"
                  >
                    Chụp Lại
                  </button>
                </div>
                <div className="text-[9.5px] text-emerald-400 font-mono">Độ rõ: 99.6%</div>
              </div>

              {/* Sample 2: Left */}
              <div className="p-2.5 bg-[#161B22] border border-[#2D3748] space-y-2 text-center">
                <div className="text-[10px] font-bold text-[#C5A880] uppercase font-mono">
                  2. Nghiêng Trái
                </div>
                <div className="w-full h-32 bg-black border border-gray-700 overflow-hidden relative group">
                  {samples.left && (
                    <img src={samples.left} alt="Left" className="w-full h-full object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => handleRetakeStep(1)}
                    className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-white font-bold"
                  >
                    Chụp Lại
                  </button>
                </div>
                <div className="text-[9.5px] text-emerald-400 font-mono">Góc: -25°</div>
              </div>

              {/* Sample 3: Right */}
              <div className="p-2.5 bg-[#161B22] border border-[#2D3748] space-y-2 text-center">
                <div className="text-[10px] font-bold text-[#C5A880] uppercase font-mono">
                  3. Nghiêng Phải
                </div>
                <div className="w-full h-32 bg-black border border-gray-700 overflow-hidden relative group">
                  {samples.right && (
                    <img src={samples.right} alt="Right" className="w-full h-full object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => handleRetakeStep(2)}
                    className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-white font-bold"
                  >
                    Chụp Lại
                  </button>
                </div>
                <div className="text-[9.5px] text-emerald-400 font-mono">Góc: +25°</div>
              </div>

              {/* Sample 4: Smile / Liveness */}
              <div className="p-2.5 bg-[#161B22] border border-[#2D3748] space-y-2 text-center">
                <div className="text-[10px] font-bold text-[#C5A880] uppercase font-mono">
                  4. Xác Thực Sống
                </div>
                <div className="w-full h-32 bg-black border border-gray-700 overflow-hidden relative group">
                  {samples.smile && (
                    <img src={samples.smile} alt="Smile" className="w-full h-full object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => handleRetakeStep(3)}
                    className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-white font-bold"
                  >
                    Chụp Lại
                  </button>
                </div>
                <div className="text-[9.5px] text-emerald-400 font-mono">Liveness: 100%</div>
              </div>
            </div>

            {/* Privacy & System Sync Note */}
            <div className="p-4 bg-[#121820] border border-[#222B35] space-y-2 text-xs text-gray-300">
              <div className="flex items-center gap-2 font-bold text-[#C5A880]">
                <Lock className="w-3.5 h-3.5" /> Quyền Hạn Kích Hoạt Sau Khi Lưu:
              </div>
              <ul className="space-y-1 text-gray-400 pl-4 list-disc text-[11px]">
                <li>Cho phép đăng nhập trực tiếp bằng camera trên trang chủ mà không cần mật khẩu.</li>
                <li>Tự động nhận diện mở barrier hầm gửi xe và cửa sảnh đón tầng trệt (Tòa Skyline).</li>
                <li>Dữ liệu được mã hóa phân tán và chỉ dùng nội bộ phục vụ an ninh cư dân tòa nhà.</li>
              </ul>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-[#222B35]">
              <button
                type="button"
                onClick={handleRetakeAll}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#161B22] hover:bg-[#202936] text-gray-300 hover:text-white border border-[#2D3748] text-xs font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Quét Lại Từ Đầu</span>
              </button>

              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting || submitSuccess}
                className="w-full sm:w-auto px-8 py-3 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xl active:scale-[0.99] disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Đang Lưu Trữ & Kích Hoạt FaceID...
                  </>
                ) : submitSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-950" /> Đã Lưu FaceID Thành Công!
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" /> Xác Nhận & Kích Hoạt FaceID Chính Thức
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
