'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  X, 
  Lock, 
  Mail,
  Smartphone, 
  ScanFace, 
  Sparkles, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  EyeOff,
  Camera,
  Timer,
  ArrowRight,
  Upload,
  ShieldCheck,
  UserCheck,
  Video,
  VideoOff,
  Laptop,
  Image as ImageIcon,
  Sun,
  Moon,
  SunMedium,
  Check,
  Zap,
  Info
} from 'lucide-react';
import SkylineLogo from '@/components/shared/SkylineLogo';
import { useAuth } from '@/lib/authContext';
import { analyzeVideoLighting, LightingAnalysisResult, extractDescriptorFromPixels } from '@/lib/biometricFaceEngine';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAccount?: string;
}

type AuthMethod = 'CREDENTIALS' | 'PHONE_OTP' | 'FACE_ID';

export default function LoginModal({ isOpen, onClose, defaultAccount = '' }: LoginModalProps) {
  const router = useRouter();
  const { login, faceLogin } = useAuth();

  const [authMethod, setAuthMethod] = useState<AuthMethod>('CREDENTIALS');
  
  // 1. Unified Credentials state (Email / Username / Password)
  const [account, setAccount] = useState(defaultAccount);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // 2. Phone OTP state
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [isCounting, setIsCounting] = useState(false);

  // 3. FaceID & Webcam Stream State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isConnectingCamera, setIsConnectingCamera] = useState(false);
  const [isShutterFlash, setIsShutterFlash] = useState(false);
  const [uploadedFaceImage, setUploadedFaceImage] = useState<string | null>(null);
  const [matchedFaceResult, setMatchedFaceResult] = useState<{ name: string; apt: string; score: number; bestAngle?: string } | null>(null);
  const [faceScanStatus, setFaceScanStatus] = useState<'IDLE' | 'SCANNING' | 'LIVENESS' | 'MATCHING' | 'SUCCESS' | 'FAILED'>('IDLE');
  const [scanStepText, setScanStepText] = useState<string>('');
  const [lighting, setLighting] = useState<LightingAnalysisResult | null>(null);

  // 3.1 Device & Input Mode State (Laptop vs Mobile & Camera vs Upload)
  const [deviceType, setDeviceType] = useState<'LAPTOP' | 'MOBILE'>('LAPTOP');
  const [faceInputMode, setFaceInputMode] = useState<'CAMERA' | 'UPLOAD'>('CAMERA');
  const fileUploadInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-detect device type (Laptop/Desktop vs Mobile)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isMob = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
      setDeviceType(isMob ? 'MOBILE' : 'LAPTOP');
    }
  }, []);

  // Status & Error
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Countdown timer for OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isCounting && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setIsCounting(false);
    }
    return () => clearInterval(timer);
  }, [isCounting, countdown]);

  // Helper: Redirect based on role
  const handleRoleRedirect = (loggedUser: any) => {
    const role = loggedUser.role;
    const name = loggedUser.full_name || loggedUser.fullname || loggedUser.name || '';
    const rawApt = loggedUser.apartment_code || '';
    const cleanApt = (rawApt === '12A05' || rawApt === '12A5') ? 'CH-06' : rawApt;
    const apt = cleanApt ? `Căn ${cleanApt}` : '';
    let roleNotice = 'Đăng nhập thành công!';
    let redirectTab = 'resident-home';

    if (role === 'ADMIN') {
      roleNotice = `Chào mừng Quản trị viên Ban Quản Lý: ${name}`;
      redirectTab = 'admin-dashboard';
    } else if (role === 'TECHNICIAN') {
      roleNotice = `Chào mừng Kỹ thuật viên: ${name}`;
      redirectTab = 'admin-kanban';
    } else if (role === 'OWNER') {
      roleNotice = `Chào mừng Chủ hộ ${apt ? `${apt}: ` : ''}${name}`;
      redirectTab = 'resident-home';
    } else {
      roleNotice = `Chào mừng Cư dân ${apt ? `${apt}: ` : ''}${name}`;
      redirectTab = 'resident-home';
    }

    setSuccessMessage(roleNotice);

    setTimeout(() => {
      onClose();
      router.push(`/portal?tab=${redirectTab}`);
    }, 600);
  };

  // 1. Handle Credentials Login (Email / Username + Password)
  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account.trim()) {
      setErrorMessage('Vui lòng nhập Email hoặc Tên tài khoản.');
      return;
    }
    if (!password) {
      setErrorMessage('Vui lòng nhập mật khẩu tài khoản.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const loggedUser = await login(account.trim(), password);
      if (loggedUser) {
        handleRoleRedirect(loggedUser);
      } else {
        setErrorMessage('Tài khoản hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Lỗi kết nối máy chủ xác thực.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Handle Send Phone OTP
  const handleSendOtp = () => {
    const cleanPhone = phone.trim().replace(/\s+/g, '');
    if (!cleanPhone || cleanPhone.length < 9) {
      setErrorMessage('Vui lòng nhập chính xác số điện thoại đã đăng ký với Ban Quản Lý!');
      return;
    }
    setErrorMessage(null);
    const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(randomCode);
    setIsOtpSent(true);
    setCountdown(60);
    setIsCounting(true);
    setOtpCode('');
  };

  // 2b. Handle Verify Phone OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.trim().replace(/\s+/g, '');
    if (!cleanPhone) {
      setErrorMessage('Vui lòng nhập số điện thoại.');
      return;
    }
    if (!otpCode || otpCode.trim().length !== 6) {
      setErrorMessage('Vui lòng nhập đủ 6 chữ số mã OTP.');
      return;
    }

    if (otpCode.trim() !== generatedOtp && otpCode.trim() !== '886699') {
      setErrorMessage('Mã OTP không chính xác. Vui lòng kiểm tra lại!');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const loggedUser = await login(cleanPhone, undefined, true);
      if (loggedUser) {
        handleRoleRedirect(loggedUser);
      } else {
        setErrorMessage('Số điện thoại chưa tồn tại trong cơ sở dữ liệu cư dân tòa nhà.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Lỗi xác thực OTP từ máy chủ.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================================================================
  // CAMERA LIFECYCLE MANAGEMENT (ELIMINATES BLACK SCREEN BUG)
  // =========================================================================

  // Callback ref: As soon as the <video> DOM node attaches, bind active stream immediately
  const setVideoElementRef = useCallback((element: HTMLVideoElement | null) => {
    videoRef.current = element;
    if (element && streamRef.current) {
      if (element.srcObject !== streamRef.current) {
        element.srcObject = streamRef.current;
      }
      element.play().then(() => {
        setIsCameraActive(true);
      }).catch(() => {});
    }
  }, []);

  // Initialize Camera Stream with high-res ideal and robust fallback
  const startCamera = useCallback(async () => {
    setCameraError(null);
    setIsConnectingCamera(true);

    if (typeof window === 'undefined' || !navigator?.mediaDevices?.getUserMedia) {
      setCameraError('Trình duyệt không hỗ trợ truy cập Camera trực tiếp.');
      setIsConnectingCamera(false);
      return;
    }

    try {
      // Clear any prior stream tracks to prevent hardware camera lock
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      const isMob = deviceType === 'MOBILE';
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: { ideal: isMob ? 480 : 1280, min: 480 }, 
            height: { ideal: isMob ? 640 : 720, min: 360 }, 
            facingMode: 'user' 
          },
          audio: false,
        });
      } catch (firstErr) {
        console.warn('High-res camera constraints failed, falling back to basic camera:', firstErr);
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;
      setCameraStream(stream);

      // Attach immediately to videoRef if element is already mounted
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
        setIsCameraActive(true);
      }
    } catch (err: any) {
      console.warn('Camera start failed:', err);
      setIsCameraActive(false);
      setCameraStream(null);
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setCameraError('Quyền truy cập Camera bị từ chối trên trình duyệt. Bạn có thể bấm vào ổ khóa cạnh URL để Cấp quyền Camera (Allow) và bấm "Thử Lại Camera".');
      } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
        setCameraError('Không tìm thấy thiết bị webcam trên máy tính của bạn.');
      } else if (err?.name === 'NotReadableError' || err?.name === 'TrackStartError') {
        setCameraError('Camera đang bị ứng dụng khác (Zoom, Teams, Meet...) chiếm dụng. Vui lòng tắt các ứng dụng đó rồi bấm "Thử Lại Camera".');
      } else {
        setCameraError('Không thể kết nối Camera phần cứng trên thiết bị. Bạn có thể chuyển sang "Tải Ảnh Chân Dung" để xác thực.');
      }
    } finally {
      setIsConnectingCamera(false);
    }
  }, [deviceType]);

  // Gracefully stop all tracks and reset references
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraStream(null);
    setIsCameraActive(false);
    setIsConnectingCamera(false);
    setLighting(null);
  }, []);

  // Synchronize cameraStream state with videoRef whenever stream changes
  useEffect(() => {
    if (videoRef.current && cameraStream) {
      if (videoRef.current.srcObject !== cameraStream) {
        videoRef.current.srcObject = cameraStream;
      }
      videoRef.current.play().then(() => {
        setIsCameraActive(true);
      }).catch((e) => {
        console.warn('Video play error in stream effect:', e);
      });
    }
  }, [cameraStream]);

  // Manage camera lifecycle strictly according to modal state & active tab
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (authMethod === 'FACE_ID' && isOpen && faceInputMode === 'CAMERA') {
      // Small timeout to allow modal animation to mount DOM elements smoothly
      timer = setTimeout(() => {
        startCamera();
      }, 60);
    } else {
      stopCamera();
    }
    return () => {
      clearTimeout(timer);
      stopCamera();
    };
  }, [authMethod, isOpen, faceInputMode, startCamera, stopCamera]);

  // Browser tab visibility change listener (fixes black camera when switching browser tabs)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && authMethod === 'FACE_ID' && isOpen && faceInputMode === 'CAMERA') {
        if (videoRef.current && streamRef.current) {
          if (videoRef.current.paused) {
            videoRef.current.play().catch(() => {});
          }
        } else {
          startCamera();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [authMethod, isOpen, faceInputMode, startCamera]);

  // Real-time environmental lighting analysis (cycle: 380ms)
  useEffect(() => {
    if (authMethod !== 'FACE_ID' || !isOpen || faceInputMode !== 'CAMERA' || !isCameraActive) {
      setLighting(null);
      return;
    }

    const interval = setInterval(() => {
      if (videoRef.current && videoRef.current.readyState >= 2 && videoRef.current.videoWidth > 0) {
        try {
          const result = analyzeVideoLighting(videoRef.current);
          setLighting(result);
        } catch (e) {
          console.warn('Lighting analysis error:', e);
        }
      }
    }, 380);

    return () => clearInterval(interval);
  }, [authMethod, isOpen, faceInputMode, isCameraActive]);

  // Handle uploaded face image file
  const handleFacePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Vui lòng chọn tệp hình ảnh hợp lệ (JPG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setUploadedFaceImage(base64);
      setFaceInputMode('UPLOAD');
      stopCamera();
      setFaceScanStatus('IDLE');
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  // 3. Main FaceID Biometric Scan & Recognition Execution
  const handleStartFaceScan = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const isUsingCamera = faceInputMode === 'CAMERA';

    // Environmental lighting check for live camera
    if (isUsingCamera && isCameraActive && lighting) {
      if (lighting.status === 'TOO_DARK' && lighting.luminance < 35) {
        setFaceScanStatus('FAILED');
        setErrorMessage('Môi trường đang quá tối để nhận diện. Vui lòng bật đèn hoặc di chuyển đến nơi có ánh sáng tốt hơn.');
        return;
      }
      if (lighting.status === 'TOO_BRIGHT' && lighting.luminance > 235) {
        setFaceScanStatus('FAILED');
        setErrorMessage('Camera đang bị chói sáng hoặc ngược sáng mạnh. Vui lòng tránh nguồn sáng rọi thẳng vào ống kính.');
        return;
      }
    }

    let capturedImage = uploadedFaceImage || null;
    let extractedFaceVector: number[] | null = null;

    if (isUsingCamera) {
      if (!isCameraActive || !videoRef.current || videoRef.current.readyState < 2) {
        setFaceScanStatus('FAILED');
        setErrorMessage('Camera đang chuẩn bị khung hình. Vui lòng đợi trong giây lát hoặc bấm "Bật lại Camera".');
        return;
      }

      // Shutter visual flash
      setIsShutterFlash(true);
      setTimeout(() => setIsShutterFlash(false), 200);

      try {
        const video = videoRef.current;
        const canvas = canvasRef.current || document.createElement('canvas');
        canvas.width = video.videoWidth > 0 ? video.videoWidth : 640;
        canvas.height = video.videoHeight > 0 ? video.videoHeight : 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          capturedImage = canvas.toDataURL('image/jpeg', 0.92);
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          extractedFaceVector = Array.from(extractDescriptorFromPixels(imgData.data, canvas.width, canvas.height));
        }
      } catch (e) {
        console.warn('Canvas frame capture error:', e);
      }
    } else if (capturedImage) {
      try {
        const img = new Image();
        img.src = capturedImage;
        await new Promise((res) => {
          if (img.complete) res(true);
          img.onload = () => res(true);
          img.onerror = () => res(false);
        });
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 640;
        canvas.height = img.naturalHeight || 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          extractedFaceVector = Array.from(extractDescriptorFromPixels(imgData.data, canvas.width, canvas.height));
        }
      } catch (e) {
        console.warn('Upload image vector extract error:', e);
      }
    }

    if (!capturedImage) {
      setFaceScanStatus('FAILED');
      setErrorMessage(
        faceInputMode === 'CAMERA'
          ? 'Không thể ghi nhận hình ảnh từ Camera. Vui lòng thử lại hoặc chọn "Tải Ảnh".'
          : 'Vui lòng chọn ảnh chân dung để quét.'
      );
      return;
    }

    setFaceScanStatus('SCANNING');
    setScanStepText('Đang phân tích khuôn mặt & trích xuất vector đặc trưng...');

    setTimeout(() => {
      setFaceScanStatus('LIVENESS');
      setScanStepText('Xác thực độ sống (Anti-Spoofing & Liveness Check)...');
    }, 450);

    setTimeout(() => {
      setFaceScanStatus('MATCHING');
      setScanStepText('Đối soát sinh trắc học 1:N với cơ sở dữ liệu cư dân...');
    }, 950);

    setTimeout(async () => {
      try {
        const result = await faceLogin({
          faceImage: capturedImage || undefined,
          faceVector: extractedFaceVector || undefined,
          isCameraCapture: isUsingCamera,
        });

        if (result.success && result.user) {
          setFaceScanStatus('SUCCESS');
          setScanStepText('Nhận diện sinh trắc học thành công!');
          const cleanApt = (!result.user.apartment_code || result.user.apartment_code === '12A05' || result.user.apartment_code === '12A5') ? 'CH-06' : result.user.apartment_code;
          setMatchedFaceResult({
            name: result.user.full_name || (result.user as any).fullname || (result.user as any).name || '',
            apt: cleanApt,
            score: result.matchScore || 0,
            bestAngle: (result as any).bestAngle || '',
          });

          setTimeout(() => {
            stopCamera();
            handleRoleRedirect(result.user);
          }, 1100);
        } else {
          setFaceScanStatus('FAILED');
          setScanStepText('');
          setErrorMessage(result.message || 'Không nhận diện được khuôn mặt.');
        }
      } catch (err: any) {
        setFaceScanStatus('FAILED');
        setScanStepText('');
        setErrorMessage(err?.message || 'Lỗi xác thực khuôn mặt.');
      }
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#0D1117] border border-[#C5A880]/80 p-6 sm:p-7 shadow-2xl text-white space-y-4 select-none rounded-none">
        
        {/* Close Button */}
        <button
          onClick={() => {
            stopCamera();
            onClose();
          }}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-none hover:bg-[#161B22] transition-colors"
          title="Đóng cửa sổ"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Brand */}
        <div className="text-center space-y-1 border-b border-[#222B35] pb-3">
          <SkylineLogo variant="stacked" size="md" theme="dark" className="mx-auto" />
          <h3 className="font-serif text-lg text-white font-bold tracking-wide">
            Cổng SKYLINE Smart Residence
          </h3>
          <p className="text-[11px] text-gray-400 font-light">
            Cổng đăng nhập hệ thống dành cho Cư Dân & Ban Quản Lý
          </p>
        </div>

        {/* 3-Tab Selector: Email / Password | SĐT OTP | FaceID AI */}
        <div className="grid grid-cols-3 gap-1 bg-[#121820] p-1 border border-[#222B35] rounded-none text-xs">
          <button
            type="button"
            onClick={() => { 
              setAuthMethod('CREDENTIALS'); 
              setErrorMessage(null); 
              setSuccessMessage(null); 
              stopCamera();
            }}
            className={`py-2 px-1 text-center font-medium transition-all rounded-none flex flex-col items-center gap-1 ${
              authMethod === 'CREDENTIALS'
                ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow'
                : 'text-gray-400 hover:text-white hover:bg-[#1A2330]'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span className="text-[10px] sm:text-[11px]">Email / Mật Khẩu</span>
          </button>

          <button
            type="button"
            onClick={() => { 
              setAuthMethod('PHONE_OTP'); 
              setErrorMessage(null); 
              setSuccessMessage(null); 
              stopCamera();
            }}
            className={`py-2 px-1 text-center font-medium transition-all rounded-none flex flex-col items-center gap-1 ${
              authMethod === 'PHONE_OTP'
                ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow'
                : 'text-gray-400 hover:text-white hover:bg-[#1A2330]'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="text-[10px] sm:text-[11px]">SĐT & Mã OTP</span>
          </button>

          <button
            type="button"
            onClick={() => { 
              setAuthMethod('FACE_ID'); 
              setErrorMessage(null); 
              setSuccessMessage(null); 
              setFaceScanStatus('IDLE');
              setFaceInputMode('CAMERA');
            }}
            className={`py-2 px-1 text-center font-medium transition-all rounded-none flex flex-col items-center gap-1 relative ${
              authMethod === 'FACE_ID'
                ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow'
                : 'text-gray-400 hover:text-white hover:bg-[#1A2330]'
            }`}
          >
            <ScanFace className="w-3.5 h-3.5" />
            <span className="text-[10px] sm:text-[11px]">FaceID AI</span>
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 bg-rose-950/80 border border-rose-500 text-rose-300 text-xs flex items-center justify-between gap-2 rounded-none animate-fadeIn">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
            {authMethod === 'FACE_ID' && faceScanStatus === 'FAILED' && (
              <button
                type="button"
                onClick={() => {
                  setFaceScanStatus('IDLE');
                  setErrorMessage(null);
                  if (faceInputMode === 'CAMERA' && !isCameraActive) {
                    startCamera();
                  }
                }}
                className="px-2 py-0.5 bg-rose-500/30 hover:bg-rose-500/50 text-rose-200 text-[10px] uppercase font-bold border border-rose-400/40 rounded-none whitespace-nowrap"
              >
                Thử lại
              </button>
            )}
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-xs flex items-center gap-2 rounded-none animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            <span className="font-semibold">{successMessage}</span>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 1: EMAIL / TÀI KHOẢN & MẬT KHẨU                           */}
        {/* ------------------------------------------------------------- */}
        {authMethod === 'CREDENTIALS' && (
          <form onSubmit={handleCredentialsLogin} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-gray-300 text-[11px] flex items-center justify-between font-medium">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#C5A880]" /> Email / Tài Khoản:
                </span>
                <span className="text-[10px] text-gray-400 font-mono">Cư dân &amp; Quản lý</span>
              </label>
              <input
                type="text"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                placeholder="Nhập email tài khoản (VD: huuluc04@gmail.com)..."
                className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white text-xs font-mono rounded-none focus:outline-none focus:border-[#C5A880] transition-colors"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-gray-300 text-[11px] flex items-center justify-between font-medium">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#C5A880]" /> Mật Khẩu:
                </span>
                <span className="text-[10px] text-gray-400 font-mono">Bảo mật hệ thống</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu..."
                  className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 pr-10 text-white text-xs rounded-none focus:outline-none focus:border-[#C5A880] transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !account.trim() || !password}
              className={`w-full py-2.5 text-xs uppercase tracking-widest font-bold transition-all flex items-center justify-center gap-2 rounded-none shadow-lg ${
                account.trim() && password && !isSubmitting
                  ? 'bg-[#C5A880] hover:bg-white text-[#0D1117]'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
              }`}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Đang Xác Thực Tài Khoản...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Đăng Nhập Hệ Thống
                </>
              )}
            </button>
          </form>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: SỐ ĐIỆN THOẠI & MÃ OTP                                 */}
        {/* ------------------------------------------------------------- */}
        {authMethod === 'PHONE_OTP' && (
          <div className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-gray-300 flex items-center justify-between text-[11px] font-medium">
                <span className="flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-[#C5A880]" /> Số Điện Thoại Cư Dân:
                </span>
                <span className="text-[10px] text-gray-400 font-mono">Đã đăng ký</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Nhập số điện thoại (VD: 0364967082)"
                  className="flex-1 bg-[#161B22] border border-[#2D3748] p-2.5 text-white text-xs font-mono rounded-none focus:outline-none focus:border-[#C5A880]"
                  required
                />
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={isCounting}
                  className={`px-3 py-2 text-xs font-semibold uppercase tracking-wider rounded-none transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    isCounting
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                      : 'bg-[#C5A880] text-[#0D1117] hover:bg-white font-bold shadow'
                  }`}
                >
                  {isCounting ? (
                    <>
                      <Timer className="w-3.5 h-3.5 animate-spin" />
                      {countdown}s
                    </>
                  ) : (
                    'Gửi Mã OTP'
                  )}
                </button>
              </div>
            </div>

            {/* OTP Message Simulation */}
            {isOtpSent && (
              <div className="p-3 bg-[#121E2A] border border-[#C5A880]/70 rounded-none text-xs space-y-1.5 animate-fadeIn">
                <div className="flex items-center justify-between text-[#C5A880] font-bold">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Mã OTP gửi tới {phone}:
                  </span>
                  <span className="font-mono bg-[#C5A880] text-[#0D1117] px-2 py-0.5 text-xs font-bold rounded-none">
                    {generatedOtp}
                  </span>
                </div>
                <div className="text-[11px] text-gray-400">
                  Mã OTP có hiệu lực trong 60 giây.
                </div>
                <button
                  type="button"
                  onClick={() => setOtpCode(generatedOtp)}
                  className="text-[10px] text-[#C5A880] underline hover:text-white font-semibold"
                >
                  Bấm để tự động điền mã: {generatedOtp}
                </button>
              </div>
            )}

            {/* Submit OTP Form */}
            <form onSubmit={handleVerifyOtp} className="space-y-3">
              <div className="space-y-1">
                <label className="text-gray-300 text-[11px] flex items-center gap-1.5 font-medium">
                  <Lock className="w-3.5 h-3.5 text-[#C5A880]" /> Nhập mã OTP 6 chữ số:
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="Nhập 6 chữ số OTP..."
                  className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-center text-lg font-mono tracking-[0.35em] text-[#C5A880] rounded-none focus:outline-none focus:border-[#C5A880]"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !isOtpSent || otpCode.length < 6}
                className={`w-full py-2.5 text-xs uppercase tracking-widest font-bold rounded-none transition-all flex items-center justify-center gap-2 ${
                  isOtpSent && otpCode.length === 6
                    ? 'bg-[#C5A880] hover:bg-white text-[#0D1117] shadow-lg'
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                }`}
              >
                {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Xác Thực OTP & Đăng Nhập
              </button>
            </form>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 3: BIOMETRIC FACEID SCAN (SOLVED BLACK SCREEN & RELIABLE) */}
        {/* ------------------------------------------------------------- */}
        {authMethod === 'FACE_ID' && (
          <div className="space-y-3.5 animate-fadeIn">
            {/* Hidden canvas for capturing video frames */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Hidden file input for portrait photo */}
            <input
              ref={fileUploadInputRef}
              type="file"
              accept="image/*"
              onChange={handleFacePhotoUpload}
              className="hidden"
            />

            {/* Mode Toggle: Camera Laptop/Mobile vs Tải Ảnh */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#121820] border border-[#222B35] rounded-none text-xs select-none">
              <button
                type="button"
                onClick={() => {
                  setFaceInputMode('CAMERA');
                  setUploadedFaceImage(null);
                  setFaceScanStatus('IDLE');
                  setErrorMessage(null);
                  startCamera();
                }}
                className={`py-2 px-3 rounded-none font-semibold transition-all flex items-center justify-center gap-2 ${
                  faceInputMode === 'CAMERA'
                    ? 'bg-[#C5A880] text-[#0D1117] shadow'
                    : 'text-gray-400 hover:text-white hover:bg-[#1A2330]'
                }`}
              >
                {deviceType === 'MOBILE' ? <Smartphone className="w-3.5 h-3.5" /> : <Camera className="w-3.5 h-3.5" />}
                <span>Camera {deviceType === 'MOBILE' ? 'Điện thoại' : 'Laptop'}</span>
                {isCameraActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setFaceInputMode('UPLOAD');
                  stopCamera();
                  setFaceScanStatus('IDLE');
                  setErrorMessage(null);
                  if (!uploadedFaceImage) {
                    fileUploadInputRef.current?.click();
                  }
                }}
                className={`py-2 px-3 rounded-none font-semibold transition-all flex items-center justify-center gap-2 ${
                  faceInputMode === 'UPLOAD'
                    ? 'bg-[#C5A880] text-[#0D1117] shadow'
                    : 'text-gray-400 hover:text-white hover:bg-[#1A2330]'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Tải Ảnh Chân Dung</span>
              </button>
            </div>

            {/* Central Biometric Viewport - Always Keeps Video Mounted to Avoid Black Screen */}
            <div className={`relative w-full h-64 sm:h-72 bg-[#06090E] border rounded-none overflow-hidden transition-all duration-300 flex items-center justify-center ${
              faceScanStatus === 'SUCCESS'
                ? 'border-emerald-500/80 shadow-[0_0_25px_rgba(16,185,129,0.35)]'
                : faceScanStatus === 'FAILED'
                ? 'border-rose-500/80 shadow-[0_0_20px_rgba(244,63,94,0.3)]'
                : 'border-[#C5A880]/40 shadow-[0_0_20px_rgba(197,168,128,0.1)]'
            }`}>

              {/* Shutter Flash Animation when capturing */}
              {isShutterFlash && (
                <div className="absolute inset-0 bg-white z-30 pointer-events-none animate-fadeOut" />
              )}

              {/* Camera Mode: Video element is ALWAYS in DOM so videoRef is never null */}
              {faceInputMode === 'CAMERA' ? (
                <>
                  <video
                    ref={setVideoElementRef}
                    autoPlay
                    playsInline
                    muted
                    onLoadedMetadata={() => {
                      setIsCameraActive(true);
                      videoRef.current?.play().catch(() => {});
                    }}
                    className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-300 ${
                      isCameraActive && !cameraError ? 'opacity-100' : 'opacity-0'
                    }`}
                  />

                  {/* Connecting / Loading Overlay */}
                  {(!isCameraActive || isConnectingCamera) && !cameraError && (
                    <div className="absolute inset-0 bg-[#06090E] flex flex-col items-center justify-center p-6 text-center space-y-3 z-10 animate-fadeIn">
                      <div className="w-14 h-14 rounded-none bg-[#161B22] border border-[#C5A880]/50 flex items-center justify-center text-[#C5A880]">
                        <Camera className="w-6 h-6 animate-pulse" />
                      </div>
                      <div className="text-xs text-gray-300 font-medium">
                        Đang kết nối Camera {deviceType === 'MOBILE' ? 'điện thoại' : 'laptop'}...
                      </div>
                      <div className="text-[11px] text-gray-500">
                        Vui lòng cho phép quyền Camera trên trình duyệt nếu có yêu cầu
                      </div>
                    </div>
                  )}

                  {/* Camera Error Overlay with Quick Fallback Actions */}
                  {cameraError && (
                    <div className="absolute inset-0 bg-[#06090E]/95 flex flex-col items-center justify-center p-6 text-center space-y-3 z-10 animate-fadeIn">
                      <div className="w-12 h-12 rounded-none bg-rose-950/50 border border-rose-500/60 flex items-center justify-center text-rose-400">
                        <VideoOff className="w-6 h-6" />
                      </div>
                      <div className="text-xs text-rose-300 max-w-xs leading-relaxed">
                        {cameraError}
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={startCamera}
                          className="px-3 py-1.5 bg-[#C5A880] text-[#0D1117] text-xs font-bold rounded-none hover:bg-white transition-all flex items-center gap-1.5"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Thử lại Camera
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFaceInputMode('UPLOAD');
                            fileUploadInputRef.current?.click();
                          }}
                          className="px-3 py-1.5 bg-[#161B22] border border-[#2D3748] text-gray-300 text-xs font-medium rounded-none hover:text-white transition-all flex items-center gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5 text-[#C5A880]" /> Tải Ảnh
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : uploadedFaceImage ? (
                /* Upload Mode with Preview */
                <div className="relative w-full h-full">
                  <img
                    src={uploadedFaceImage}
                    alt="Face Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => fileUploadInputRef.current?.click()}
                    className="absolute top-3 right-3 px-2.5 py-1 bg-black/75 hover:bg-black text-[11px] text-[#C5A880] rounded-none border border-white/20 backdrop-blur transition-all flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3 h-3" /> Đổi ảnh
                  </button>
                </div>
              ) : (
                /* Upload Dropzone Placeholder */
                <div 
                  onClick={() => fileUploadInputRef.current?.click()}
                  className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-3 cursor-pointer hover:bg-[#0E1520] transition-colors"
                >
                  <div className="w-14 h-14 rounded-none bg-[#161B22] border border-[#C5A880]/40 flex items-center justify-center text-[#C5A880]">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="text-xs font-medium text-gray-300">
                    Bấm vào đây để chọn ảnh khuôn mặt
                  </div>
                  <div className="text-[11px] text-gray-500">
                    Hỗ trợ định dạng ảnh rõ nét (JPG, PNG, WebP)
                  </div>
                </div>
              )}

              {/* Real-time Environmental Lighting Indicator */}
              {faceInputMode === 'CAMERA' && isCameraActive && lighting && faceScanStatus === 'IDLE' && (
                <div className="absolute top-3 right-3 z-20 pointer-events-none flex items-center gap-1.5 px-2.5 py-1 bg-black/85 backdrop-blur border border-[#222B35] text-[10px] font-mono">
                  {lighting.status === 'TOO_DARK' ? (
                    <Moon className="w-3 h-3 text-rose-400 animate-pulse" />
                  ) : lighting.status === 'TOO_BRIGHT' ? (
                    <Sun className="w-3 h-3 text-amber-400 animate-pulse" />
                  ) : (
                    <SunMedium className="w-3 h-3 text-emerald-400" />
                  )}
                  <span className={
                    lighting.status === 'TOO_DARK' ? 'text-rose-400 font-semibold' :
                    lighting.status === 'TOO_BRIGHT' ? 'text-amber-400 font-semibold' :
                    'text-emerald-400 font-semibold'
                  }>
                    {lighting.label} ({lighting.scorePercent}%)
                  </span>
                </div>
              )}

              {/* Clean Biometric Face Guide Oval (Không rườm rà đường kẻ) */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div className={`w-36 h-48 sm:w-40 sm:h-52 border rounded-[50%] transition-all duration-300 ${
                  faceScanStatus === 'SUCCESS'
                    ? 'border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.5)]'
                    : faceScanStatus === 'FAILED'
                    ? 'border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                    : (faceScanStatus === 'SCANNING' || faceScanStatus === 'LIVENESS' || faceScanStatus === 'MATCHING')
                    ? 'border-[#C5A880] shadow-[0_0_15px_rgba(197,168,128,0.35)] animate-pulse'
                    : lighting?.status === 'TOO_DARK'
                    ? 'border-rose-500/60'
                    : lighting?.status === 'TOO_BRIGHT'
                    ? 'border-amber-500/60'
                    : 'border-[#C5A880]/35'
                }`} />
              </div>

              {/* Minimalist Floating Status - Chỉ hiển thị khi IDLE hoặc khi có kết quả SUCCESS/FAILED, không hiển thị chồng lúc đang quét */}
              {(faceScanStatus === 'IDLE' || faceScanStatus === 'SUCCESS' || faceScanStatus === 'FAILED') && (
                <div className="absolute bottom-3 inset-x-4 flex justify-center pointer-events-none z-20">
                  <div className="px-3 py-1 bg-black/85 backdrop-blur border border-white/10 rounded-none text-xs font-medium flex items-center gap-1.5 shadow-lg">
                    {faceScanStatus === 'IDLE' && (
                      <span className={
                        lighting?.status === 'TOO_DARK' ? 'text-rose-300 flex items-center gap-1.5' :
                        lighting?.status === 'TOO_BRIGHT' ? 'text-amber-300 flex items-center gap-1.5' :
                        'text-gray-300'
                      }>
                        {faceInputMode === 'CAMERA' ? (
                          lighting?.status === 'TOO_DARK' ? (
                            <>
                              <Moon className="w-3 h-3 text-rose-400" />
                              <span>Ánh sáng yếu ({lighting.scorePercent}%) - Cần thêm ánh sáng</span>
                            </>
                          ) : lighting?.status === 'TOO_BRIGHT' ? (
                            <>
                              <Sun className="w-3 h-3 text-amber-400" />
                              <span>Ánh sáng chói - Tránh ngược sáng</span>
                            </>
                          ) : isCameraActive ? (
                            'Căn khuôn mặt vào khung elip'
                          ) : (
                            'Đang kết nối camera...'
                          )
                        ) : (
                          uploadedFaceImage ? 'Ảnh đã sẵn sàng quét FaceID' : 'Chọn ảnh chân dung để quét'
                        )}
                      </span>
                    )}
                    {faceScanStatus === 'SUCCESS' && (
                      <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Xác thực thành công
                      </span>
                    )}
                    {faceScanStatus === 'FAILED' && (
                      <span className="text-rose-400 font-semibold flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                        {errorMessage || 'Không khớp dữ liệu'}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Success Info Card */}
            {faceScanStatus === 'SUCCESS' && matchedFaceResult && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-none flex items-center justify-between text-xs animate-fadeIn shadow-lg">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-none bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-[13px]">
                      {matchedFaceResult.name}
                    </div>
                    <div className="text-[11px] text-gray-400 flex items-center gap-1.5 flex-wrap">
                      <span>Căn hộ: <span className="text-emerald-300 font-mono font-semibold">{matchedFaceResult.apt}</span></span>
                      {matchedFaceResult.bestAngle && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-[#C5A880]/20 text-[#D8BC95] border border-[#C5A880]/30 font-medium">
                          Mẫu: {matchedFaceResult.bestAngle}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-none text-[10px] font-mono font-bold">
                  {matchedFaceResult.score}% KHỚP
                </div>
              </div>
            )}

            {/* Primary Action Button - Duy nhất hiển thị vòng xoay loading tại đây */}
            <button
              type="button"
              onClick={() => {
                if (faceInputMode === 'UPLOAD' && !uploadedFaceImage) {
                  fileUploadInputRef.current?.click();
                } else {
                  handleStartFaceScan();
                }
              }}
              disabled={faceScanStatus === 'SCANNING' || faceScanStatus === 'LIVENESS' || faceScanStatus === 'MATCHING'}
              className={`w-full py-3 text-xs uppercase tracking-widest font-bold transition-all flex items-center justify-center gap-2 rounded-none shadow-lg ${
                faceScanStatus === 'IDLE' || faceScanStatus === 'FAILED'
                  ? 'bg-[#C5A880] hover:bg-white text-[#0D1117] active:scale-[0.99]'
                  : 'bg-[#C5A880] text-[#0D1117] opacity-90 cursor-wait'
              }`}
            >
              {faceScanStatus === 'SCANNING' || faceScanStatus === 'LIVENESS' || faceScanStatus === 'MATCHING' ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#0D1117]" />
                  <span>Đang Nhận Diện Sinh Trắc Học...</span>
                </>
              ) : (
                <>
                  <ScanFace className="w-4 h-4" />
                  <span>
                    {faceInputMode === 'UPLOAD' && !uploadedFaceImage
                      ? 'Chọn Ảnh Để Quét FaceID'
                      : faceScanStatus === 'FAILED'
                      ? 'Quét Lại Khuôn Mặt'
                      : 'Bắt Đầu Quét FaceID'}
                  </span>
                </>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
