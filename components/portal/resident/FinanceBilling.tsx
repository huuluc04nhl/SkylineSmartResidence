'use client';

import React, { useState, useEffect } from 'react';
import { Bill, BillDetail, User } from '@/lib/dataStore';
import { 
  CreditCard, 
  AlertTriangle, 
  Download, 
  CheckCircle2, 
  QrCode, 
  Shield, 
  Sparkles, 
  X, 
  Copy, 
  Check, 
  Smartphone, 
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Building,
  Lock,
  Calendar,
  Receipt,
  ArrowRight,
  ShieldAlert,
  Clock,
  Zap,
  Droplets,
  Car,
  Shirt,
  Dumbbell,
  Tag,
  Wifi,
  Globe,
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  Coins,
  Activity,
  CalendarDays,
  FileSpreadsheet,
  CheckCheck,
  ArrowUpRight,
  ArrowDownRight,
  HelpCircle,
  Percent,
  Layers,
  Info
} from 'lucide-react';
import { 
  getBills, 
  payBill, 
  ExtendedBill 
} from '@/lib/billingStore';
const VNPAY_NCB_TEST_CARD = {
  bank: 'NCB',
  cardNumber: '9704198526191432198',
  cardHolder: 'NGUYEN VAN A',
  issueDate: '07/15',
  otp: '123456',
};

type MainGatewayType = 'VNPAY' | 'MOMO';
type VnpayStep = 'SELECT_METHOD' | 'ATM_FORM' | 'ATM_OTP' | 'QR_SCAN' | 'APP_CONFIRM' | 'PROCESSING';
type MomoSubChannel = 'QR' | 'WALLET';

interface FinanceBillingProps {
  currentUser?: User;
}

export default function FinanceBilling({ currentUser }: FinanceBillingProps) {
  const aptCode = currentUser?.apartment_code || '12A05';
  const residentName = currentUser?.full_name || (currentUser as any)?.fullname || 'Trần Hữu Lực';
  const residentPhone = currentUser?.phone || '0364967082';

  const [bills, setBills] = useState<ExtendedBill[]>([]);
  const [selectedBillId, setSelectedBillId] = useState<string>('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<MainGatewayType>('VNPAY');
  
  // VNPAY Sandbox Real API states
  const [isRedirectingVnpay, setIsRedirectingVnpay] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [redirectBanner, setRedirectBanner] = useState<{
    type: 'success' | 'failed' | 'invalid_checksum';
    message: string;
  } | null>(null);

  // VNPAY Realistic Multi-step Flow states
  const [vnpFlowStep, setVnpFlowStep] = useState<VnpayStep>('SELECT_METHOD');
  const [vnpSelectedBank, setVnpSelectedBank] = useState('NCB');
  const [vnpCardNumber, setVnpCardNumber] = useState(VNPAY_NCB_TEST_CARD.cardNumber);
  const [vnpCardHolder, setVnpCardHolder] = useState(VNPAY_NCB_TEST_CARD.cardHolder);
  const [vnpCardDate, setVnpCardDate] = useState(VNPAY_NCB_TEST_CARD.issueDate);
  const [vnpOtpInput, setVnpOtpInput] = useState('');
  const [vnpOtpError, setVnpOtpError] = useState<string | null>(null);
  const [vnpCountdown, setVnpCountdown] = useState(899); // 14:59
  const [otpCountdown, setOtpCountdown] = useState(120); // 120s
  const [processingStage, setProcessingStage] = useState(1); // 1 -> 2 -> 3

  // MOMO states
  const [momoChannel, setMomoChannel] = useState<MomoSubChannel>('QR');
  const [momoPhone, setMomoPhone] = useState(residentPhone);
  const [momoOtp, setMomoOtp] = useState('');
  const [momoStep, setMomoStep] = useState<'PHONE' | 'OTP'>('PHONE');

  // Processing & result states
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastPaymentResult, setLastPaymentResult] = useState<{
    gateway: 'VNPAY' | 'MOMO';
    transId: string;
    amount: number;
    paidAt: string;
  } | null>(null);

  // Đếm ngược 15:00 phút của VNPAY
  useEffect(() => {
    if (!showPaymentModal) return;
    const interval = setInterval(() => {
      setVnpCountdown(prev => (prev > 0 ? prev - 1 : 899));
    }, 1000);
    return () => clearInterval(interval);
  }, [showPaymentModal]);

  // Đếm ngược OTP 120s
  useEffect(() => {
    if (vnpFlowStep !== 'ATM_OTP') return;
    setOtpCountdown(120);
    const interval = setInterval(() => {
      setOtpCountdown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [vnpFlowStep]);

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const copyToClipboard = (text: string, label: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(label);
      setTimeout(() => setCopiedField(null), 2500);
    }
  };

  const refreshBills = () => {
    const list = getBills(aptCode, residentName);
    setBills(list);
  };

  useEffect(() => {
    refreshBills();
    const handleUpdate = () => refreshBills();
    window.addEventListener('skyline_billing_updated', handleUpdate);

    // Kiểm tra kết quả phản hồi khi được VNPAY redirect về
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const vnpStatus = urlParams.get('vnp_status');
      if (vnpStatus) {
        const transId = urlParams.get('transId') || `VNP${Date.now().toString().slice(-8)}`;
        const amountStr = urlParams.get('amount');
        const billIdParam = urlParams.get('billId');

        if (vnpStatus === 'success') {
          if (billIdParam) {
            payBill(billIdParam, 'VNPAY', transId);
          }
          refreshBills();
          setLastPaymentResult({
            gateway: 'VNPAY',
            transId,
            amount: amountStr ? parseFloat(amountStr) : 0,
            paidAt: new Date().toLocaleString('vi-VN'),
          });
          setShowPaymentModal(true);
          setRedirectBanner({
            type: 'success',
            message: `Giao dịch qua Cổng VNPAY Sandbox thành công! Mã chuẩn chi: #${transId}. Hóa đơn đã được tự động gạch nợ.`,
          });
        } else if (vnpStatus === 'failed') {
          const code = urlParams.get('code') || '';
          setRedirectBanner({
            type: 'failed',
            message: `Giao dịch thanh toán qua VNPAY không hoàn tất hoặc đã bị hủy (Mã phản hồi VNPAY: ${code}).`,
          });
        } else if (vnpStatus === 'invalid_checksum') {
          setRedirectBanner({
            type: 'failed',
            message: 'Chữ ký số bảo mật VNPAY (Checksum) không hợp lệ. Giao dịch đã bị từ chối.',
          });
        }

        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    }

    return () => window.removeEventListener('skyline_billing_updated', handleUpdate);
  }, [aptCode]);

  // Hóa đơn hiện tại đang xem (ưu tiên hóa đơn chưa thanh toán)
  const currentBill = bills.find(b => b.id === selectedBillId) 
    || bills.find(b => b.status === 'Unpaid') 
    || bills[0];

  const billAmountFormatted = currentBill ? currentBill.total_amount.toLocaleString('vi-VN') : '0';

  // Xác thực OTP 3D-Secure từ Ngân hàng Quốc Dân NCB
  const handleVerifyAtmOtp = () => {
    if (vnpOtpInput.trim() !== '123456') {
      setVnpOtpError('Mã OTP không chính xác! Vui lòng nhập đúng mã xác thực kiểm thử do VNPAY cấp: 123456');
      return;
    }
    setVnpOtpError(null);
    executeVnpayPayment(vnpSelectedBank, 'ATM');
  };

  // Xác nhận thanh toán trên Ứng dụng Ngân hàng (sau khi quét VNPAY-QR)
  const handleVerifyQrInBankingApp = () => {
    executeVnpayPayment('VNPAY_QR', 'QR');
  };

  // Tiến trình trừ tiền ngân hàng và gọi IPN gạch nợ tự động của VNPAY
  const executeVnpayPayment = (bankCode: string, channelName: string) => {
    setVnpFlowStep('PROCESSING');
    setProcessingStage(1);

    // Giai đoạn 1: Kết nối Ngân Hàng kiểm tra thông tin thẻ
    setTimeout(() => {
      setProcessingStage(2);
    }, 1300);

    // Giai đoạn 2: Trừ tiền tài khoản và VNPAY phát hành mã chuẩn chi
    setTimeout(() => {
      setProcessingStage(3);
    }, 2600);

    // Giai đoạn 3: Gửi gói tin IPN gạch nợ sang hệ thống Skyline Smart Residence
    setTimeout(() => {
      if (currentBill) {
        const transId = `VNP${Date.now().toString().slice(-8)}`;
        payBill(currentBill.id, 'VNPAY', transId, bankCode);
        setLastPaymentResult({
          gateway: 'VNPAY',
          transId,
          amount: currentBill.total_amount,
          paidAt: new Date().toLocaleString('vi-VN'),
        });
        refreshBills();
        setVnpFlowStep('SELECT_METHOD');
      }
    }, 3800);
  };

  // Xử lý thanh toán MOMO (QR hoặc Trừ ví)
  const handlePayMomo = (channel: MomoSubChannel) => {
    if (!currentBill) return;
    setIsProcessing(true);

    setTimeout(() => {
      const transId = `MM${Date.now().toString().slice(-8)}`;
      const updated = payBill(currentBill.id, 'MOMO', transId, 'MOMO_WALLET');
      setIsProcessing(false);

      if (updated) {
        setLastPaymentResult({
          gateway: 'MOMO',
          transId,
          amount: currentBill.total_amount,
          paidAt: new Date().toLocaleString('vi-VN'),
        });
        setMomoStep('PHONE');
      }
    }, 1000);
  };

  // Mở Cổng thanh toán VNPAY Sandbox chính thức theo cấu hình Merchant
  const handleOpenVnpaySandbox = async (bankCode?: string) => {
    if (!currentBill) return;
    try {
      setIsRedirectingVnpay(true);
      const res = await fetch('/api/billing/vnpay-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billId: currentBill.id,
          bankCode: bankCode || undefined,
        }),
      });
      const data = await res.json();
      if (data.success && data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        alert(data.message || 'Không thể tạo liên kết thanh toán VNPAY');
        setIsRedirectingVnpay(false);
      }
    } catch (err: any) {
      alert('Lỗi kết nối cổng thanh toán VNPAY: ' + (err?.message || ''));
      setIsRedirectingVnpay(false);
    }
  };

  // Tab view: Hóa đơn & Thanh toán vs Thống kê chi tiêu
  const [activeTab, setActiveTab] = useState<'BILLING' | 'ANALYTICS'>('BILLING');
  const [analyticsCategory, setAnalyticsCategory] = useState<string>('ALL');

  // Hàm lấy biểu tượng dịch vụ chuẩn
  const getItemIcon = (type: string) => {
    switch (type) {
      case 'Electricity': return <Zap className="w-3.5 h-3.5 text-amber-400" />;
      case 'Water': return <Droplets className="w-3.5 h-3.5 text-cyan-400" />;
      case 'Management_Fee': return <Building className="w-3.5 h-3.5 text-emerald-400" />;
      case 'Parking': return <Car className="w-3.5 h-3.5 text-blue-400" />;
      case 'Internet': return <Wifi className="w-3.5 h-3.5 text-teal-400" />;
      case 'Facility': return <Sparkles className="w-3.5 h-3.5 text-rose-400" />;
      case 'Laundry': return <Shirt className="w-3.5 h-3.5 text-indigo-400" />;
      case 'Housekeeping': return <Sparkles className="w-3.5 h-3.5 text-purple-400" />;
      case 'Personal_Trainer': return <Dumbbell className="w-3.5 h-3.5 text-orange-400" />;
      case 'Car_Care': return <Car className="w-3.5 h-3.5 text-teal-400" />;
      default: return <Tag className="w-3.5 h-3.5 text-[#C5A880]" />;
    }
  };

  // Hàm lấy tên dịch vụ chuẩn
  const getItemName = (item: BillDetail) => {
    if (item.service_name) return item.service_name;
    switch (item.service_type) {
      case 'Electricity': return 'Tiền Điện Sinh Hoạt';
      case 'Water': return 'Tiền Nước Sinh Hoạt';
      case 'Management_Fee': return 'Phí Quản Lý Vận Hành';
      case 'Parking': return 'Phí Gửi Xe Căn Hộ';
      case 'Internet': return 'Cáp Quang Internet VNPT Fiber 300Mbps';
      case 'Facility': return 'Phí Sử Dụng Tiện Ích Đặt Trước';
      case 'Laundry': return 'Giặt Ủi & Giặt Hấp Cao Cấp';
      case 'Housekeeping': return 'Giúp Việc & Dọn Dẹp Căn Hộ';
      case 'Personal_Trainer': return 'Thuê Huấn Luyện Viên PT Bơi/Gym';
      case 'Car_Care': return 'Chăm Sóc & Rửa Xe Hầm B2';
      default: return 'Phí Dịch Vụ Cư Dân';
    }
  };

  // Sắp xếp các kỳ hóa đơn theo thứ tự thời gian
  const sortedBills = [...bills].sort((a, b) => {
    return new Date(a.created_at || a.due_date || '').getTime() - new Date(b.created_at || b.due_date || '').getTime();
  });

  // Tổng hợp dữ liệu thống kê chi tiêu
  const totalSpendAll = bills.reduce((sum, b) => sum + (b.total_amount || 0), 0);
  const avgMonthlySpend = bills.length > 0 ? Math.round(totalSpendAll / bills.length) : 0;
  const paidCount = bills.filter(b => b.status === 'Paid').length;
  const onTimeRate = bills.length > 0 ? Math.round((paidCount / bills.length) * 100) : 100;

  // Thu thập toàn bộ chi tiết dòng hóa đơn
  const allDetails = bills.flatMap(b => b.details || []);

  const electricityDetails = allDetails.filter(d => d.service_type === 'Electricity');
  const waterDetails = allDetails.filter(d => d.service_type === 'Water');
  const mgmtDetails = allDetails.filter(d => d.service_type === 'Management_Fee');
  const parkingDetails = allDetails.filter(d => d.service_type === 'Parking');
  const internetDetails = allDetails.filter(d => d.service_type === 'Internet');
  const serviceDetails = allDetails.filter(d => !['Electricity', 'Water', 'Management_Fee', 'Parking', 'Internet', 'Facility'].includes(d.service_type));
  const facilityDetails = allDetails.filter(d => d.service_type === 'Facility');

  const sumCategory = (items: BillDetail[]) => items.reduce((s, it) => s + (it.total_line_amount || 0), 0);
  const totalElec = sumCategory(electricityDetails);
  const totalWater = sumCategory(waterDetails);
  const totalMgmt = sumCategory(mgmtDetails);
  const totalParking = sumCategory(parkingDetails);
  const totalInternet = sumCategory(internetDetails);
  const totalLivingServices = sumCategory(serviceDetails);
  const totalFacility = sumCategory(facilityDetails);

  const totalKwh = electricityDetails.reduce((s, it) => s + (it.usage || 0), 0);
  const totalM3 = waterDetails.reduce((s, it) => s + (it.usage || 0), 0);

  // Danh mục thống kê chi tiết theo tỷ trọng
  const categoryStats = [
    {
      id: 'Electricity',
      name: 'Điện Sinh Hoạt',
      subtext: `Tổng ${totalKwh.toLocaleString('vi-VN')} kWh (TB ${bills.length ? Math.round(totalKwh / bills.length) : 0} kWh/tháng)`,
      amount: totalElec,
      percent: totalSpendAll > 0 ? (totalElec / totalSpendAll) * 100 : 0,
      icon: Zap,
      color: '#F59E0B',
      textColor: 'text-amber-400',
      bgColor: 'bg-amber-400',
      bgMuted: 'bg-amber-950/40 border-amber-500/50',
      unitName: 'kWh',
      rate: '3.200 đ/kWh',
      trend: '+15.2%',
      trendDirection: 'up' as const,
      note: 'Định mức bậc thang giá điện sinh hoạt EVN'
    },
    {
      id: 'Water',
      name: 'Nước Sinh Hoạt',
      subtext: `Tổng ${totalM3.toLocaleString('vi-VN')} m³ (TB ${bills.length ? (Math.round((totalM3 / bills.length) * 10) / 10) : 0} m³/tháng)`,
      amount: totalWater,
      percent: totalSpendAll > 0 ? (totalWater / totalSpendAll) * 100 : 0,
      icon: Droplets,
      color: '#06B6D4',
      textColor: 'text-cyan-400',
      bgColor: 'bg-cyan-400',
      bgMuted: 'bg-cyan-950/40 border-cyan-500/50',
      unitName: 'm³',
      rate: '18.000 đ/m³',
      trend: '+55.5%',
      trendDirection: 'up' as const,
      note: 'AI cảnh báo rò rỉ đêm kỳ T08/2026'
    },
    {
      id: 'Management_Fee',
      name: 'Phí Quản Lý Vận Hành',
      subtext: `Diện tích thông thủy 73.2 m² x 10.000 đ/m²`,
      amount: totalMgmt,
      percent: totalSpendAll > 0 ? (totalMgmt / totalSpendAll) * 100 : 0,
      icon: Building,
      color: '#10B981',
      textColor: 'text-emerald-400',
      bgColor: 'bg-emerald-400',
      bgMuted: 'bg-emerald-950/40 border-emerald-500/50',
      unitName: 'm²',
      rate: '10.000 đ/m²',
      trend: '0.0%',
      trendDirection: 'stable' as const,
      note: 'Bao gồm an ninh 24/7, vệ sinh sảnh, hồ bơi & thang máy'
    },
    {
      id: 'Parking',
      name: 'Phí Gửi Xe Căn Hộ',
      subtext: `Xe máy / ô tô đăng ký tầng hầm B1/B2`,
      amount: totalParking,
      percent: totalSpendAll > 0 ? (totalParking / totalSpendAll) * 100 : 0,
      icon: Car,
      color: '#3B82F6',
      textColor: 'text-blue-400',
      bgColor: 'bg-blue-400',
      bgMuted: 'bg-blue-950/40 border-blue-500/50',
      unitName: 'xe/tháng',
      rate: '141.000 - 198.000 đ/xe',
      trend: 'Ổn định',
      trendDirection: 'stable' as const,
      note: 'Thẻ từ tích hợp nhận diện biển số thông minh LPR'
    },
    {
      id: 'Internet',
      name: 'Cáp Quang Internet VNPT',
      subtext: `Gói Fiber 300Mbps chuyên biệt Smart Home`,
      amount: totalInternet,
      percent: totalSpendAll > 0 ? (totalInternet / totalSpendAll) * 100 : 0,
      icon: Wifi,
      color: '#14B8A6',
      textColor: 'text-teal-400',
      bgColor: 'bg-teal-400',
      bgMuted: 'bg-teal-950/40 border-teal-500/50',
      unitName: 'tháng',
      rate: '220.000 đ/tháng',
      trend: 'Cố định',
      trendDirection: 'stable' as const,
      note: 'Băng thông ưu tiên cho hạ tầng nhà thông minh Skyline'
    },
    {
      id: 'Living_Services',
      name: 'Dịch Vụ Cư Dân & Đời Sống',
      subtext: `Giặt ủi, Giúp việc theo giờ, PT Gym/Bơi, Rửa xe`,
      amount: totalLivingServices,
      percent: totalSpendAll > 0 ? (totalLivingServices / totalSpendAll) * 100 : 0,
      icon: Sparkles,
      color: '#A855F7',
      textColor: 'text-purple-400',
      bgColor: 'bg-purple-400',
      bgMuted: 'bg-purple-950/40 border-purple-500/50',
      unitName: 'dịch vụ',
      rate: 'Biểu giá cư dân Skyline',
      trend: serviceDetails.length > 0 ? `${serviceDetails.length} đơn` : 'Chưa đặt',
      trendDirection: 'stable' as const,
      note: 'Đặt trực tiếp trên Portal và cộng gộp vào kỳ hóa đơn'
    },
    {
      id: 'Facility',
      name: 'Tiện Ích & Phòng Sự Kiện',
      subtext: `Khu nướng BBQ ngoài trời, Phòng tiệc VIP`,
      amount: totalFacility,
      percent: totalSpendAll > 0 ? (totalFacility / totalSpendAll) * 100 : 0,
      icon: Tag,
      color: '#F43F5E',
      textColor: 'text-rose-400',
      bgColor: 'bg-rose-400',
      bgMuted: 'bg-rose-950/40 border-rose-500/50',
      unitName: 'lượt',
      rate: 'Phí vận hành & vệ sinh',
      trend: facilityDetails.length > 0 ? `${facilityDetails.length} lượt` : '0 lượt',
      trendDirection: 'stable' as const,
      note: 'Miễn phí hồ bơi, gym cư dân; tính phí khi đặt riêng sự kiện'
    },
  ];

  // Hạng mục chi phí lớn nhất
  const highestCategory = [...categoryStats].sort((a, b) => b.amount - a.amount)[0];

  // Giá trị hóa đơn cao nhất để chuẩn hóa độ cao thanh biểu đồ (tối thiểu 1 để tránh chia cho 0)
  const maxBillAmount = Math.max(...bills.map(b => b.total_amount), 3000000);

  // Xuất file CSV báo cáo tài chính
  const handleExportExpenseCsv = () => {
    const headers = [
      'Mã Hóa Đơn',
      'Kỳ Thanh Toán',
      'Hạng Mục Dịch Vụ',
      'Phân Loại',
      'Chỉ Số / Số Lượng',
      'Đơn Vị Tính',
      'Đơn Giá (VNĐ)',
      'Thành Tiền (VNĐ)',
      'Trạng Thái',
      'Ngày Lập'
    ];

    const rows: string[][] = [];

    sortedBills.forEach(bill => {
      bill.details.forEach(item => {
        const catName = getItemName(item);
        const isUtility = ['Electricity', 'Water', 'Management_Fee', 'Parking', 'Internet'].includes(item.service_type);
        const typeLabel = isUtility ? 'Cố định / Định kỳ' : 'Dịch vụ đời sống phát sinh';
        
        rows.push([
          bill.id,
          bill.billing_month,
          catName,
          typeLabel,
          String(item.usage || 1),
          item.unit || '',
          String(item.unit_price || item.total_line_amount),
          String(item.total_line_amount),
          bill.status === 'Paid' ? 'Đã Thanh Toán' : 'Chờ Thanh Toán',
          bill.created_at ? new Date(bill.created_at).toLocaleDateString('vi-VN') : ''
        ]);
      });
    });

    const csvContent = "\uFEFF" + [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `BaoCao_ThongKe_ChiTieu_Can_${aptCode}_Skyline.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 w-full animate-fadeIn">
      {/* Thông báo kết quả giao dịch sau khi quay lại từ cổng VNPAY */}
      {redirectBanner && (
        <div className={`p-4 border flex items-start justify-between gap-3 animate-fadeIn ${
          redirectBanner.type === 'success' 
            ? 'bg-emerald-950/90 border-emerald-500 text-emerald-300 shadow-xl' 
            : 'bg-red-950/90 border-red-500 text-red-300 shadow-xl'
        }`}>
          <div className="flex items-start gap-2.5 text-xs">
            {redirectBanner.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <div className="font-bold uppercase tracking-wide">
                {redirectBanner.type === 'success' ? 'Thanh Toán VNPAY Thành Công' : 'Thông Báo Giao Dịch VNPAY'}
              </div>
              <p className="text-gray-200 leading-relaxed">{redirectBanner.message}</p>
            </div>
          </div>
          <button 
            onClick={() => setRedirectBanner(null)}
            className="text-gray-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222B35] pb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-semibold flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" /> Tài Chính • Căn {aptCode}
          </div>
          <h2 className="font-serif text-2xl text-white font-bold mt-1">
            {activeTab === 'BILLING' 
              ? 'Hóa Đơn & Thanh Toán' 
              : 'Thống Kê Chi Tiêu & Dịch Vụ'}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'BILLING' ? (
            <>
              {currentBill && currentBill.status === 'Unpaid' && (
                <button
                  onClick={() => {
                    setLastPaymentResult(null);
                    setShowPaymentModal(true);
                  }}
                  className="px-4 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow"
                >
                  <CreditCard className="w-4 h-4" /> Thanh Toán
                </button>
              )}

              {currentBill && currentBill.status === 'Paid' && (
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-[#161B22] border border-[#2D3748] hover:border-[#C5A880] text-gray-200 text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5"
                >
                  <Receipt className="w-4 h-4 text-[#C5A880]" /> In Hóa Đơn
                </button>
              )}
            </>
          ) : (
            <>
              <button
                onClick={handleExportExpenseCsv}
                className="px-3.5 py-2 bg-[#161B22] border border-[#2D3748] hover:border-[#C5A880] text-gray-200 text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5"
                title="Tải bảng tính CSV chi tiết từng hạng mục chi phí"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Xuất CSV</span>
              </button>
              <button
                onClick={() => window.print()}
                className="px-3.5 py-2 bg-[#161B22] border border-[#2D3748] hover:border-[#C5A880] text-gray-200 text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-[#C5A880]" />
                <span>In Báo Cáo</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Sub-tab Navigation Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#222B35] pb-3">
        <div className="flex items-center gap-1.5 bg-[#0D1117] p-1 border border-[#222B35]">
          <button
            onClick={() => setActiveTab('BILLING')}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
              activeTab === 'BILLING'
                ? 'bg-[#C5A880] text-[#0D1117] shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-[#161B22]'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Hóa Đơn</span>
            {bills.some(b => b.status === 'Unpaid') && (
              <span className={`px-1.5 py-0.2 text-[9px] font-mono font-bold rounded ${
                activeTab === 'BILLING' ? 'bg-[#0D1117] text-[#C5A880]' : 'bg-amber-500 text-black'
              }`}>
                1 chưa nộp
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('ANALYTICS')}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
              activeTab === 'ANALYTICS'
                ? 'bg-[#C5A880] text-[#0D1117] shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-[#161B22]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Thống Kê Chi Tiêu</span>
          </button>
        </div>

        <div className="text-xs text-gray-400 flex items-center gap-2 font-mono">
          <span>Căn: <strong className="text-white">{aptCode}</strong></span>
          <span>•</span>
          <span>Chủ hộ: <strong className="text-[#C5A880]">{residentName}</strong></span>
        </div>
      </div>

      {/* VIEW 1: BILLING & PAYMENT */}
      {activeTab === 'BILLING' && (
        <div className="space-y-6 animate-fadeIn">

      {/* Cảnh báo rò rỉ / biến động tiêu thụ */}
      {currentBill?.has_ai_anomaly && (
        <div className="p-4 bg-amber-950/40 border border-amber-500 flex items-start gap-3 animate-fadeIn">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs text-gray-200">
            <div className="text-amber-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" /> Cảnh Báo Tiêu Thụ Nước Bất Thường
            </div>
            <p className="text-gray-300">
              Hệ thống phát hiện dòng chảy liên tục khung giờ <strong>02:00 - 04:00 sáng</strong> (+115% so với tháng trước).
              Vui lòng kiểm tra van xả bồn cầu hoặc thiết bị vệ sinh trong căn hộ để tránh phát sinh chi phí lãng phí nước sạch.
            </p>
          </div>
        </div>
      )}

      {/* Selector nếu có nhiều kỳ hóa đơn */}
      {bills.length > 1 && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-400">Chọn kỳ thanh toán:</span>
          <div className="flex items-center gap-2">
            {bills.map(b => (
              <button
                key={b.id}
                onClick={() => setSelectedBillId(b.id)}
                className={`px-3 py-1.5 text-xs font-mono transition-all ${
                  (currentBill?.id === b.id)
                    ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow'
                    : 'bg-[#161B22] border border-[#2D3748] text-gray-300 hover:text-white'
                }`}
              >
                {b.billing_month} ({b.status === 'Paid' ? 'Đã thanh toán ✓' : 'Chưa thanh toán'})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bill Overview Card */}
      {currentBill ? (
        <div className="p-6 bg-[#121820] border border-[#222B35] space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222B35] pb-4">
            <div>
              <div className="text-xs text-gray-400">Kỳ thu phí: <strong className="text-white">{currentBill.billing_month}</strong></div>
              <div className="text-xs text-gray-400 mt-0.5">
                Hạn chót thanh toán: <strong className="text-amber-400 font-mono">
                  {new Date(currentBill.due_date).toLocaleDateString('vi-VN')}
                </strong>
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5">
                Đơn vị quản lý thu: <strong className="text-gray-200">Ban Quản Lý Chung Cư Skyline Smart Residence</strong>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs uppercase tracking-wider text-gray-400">Tổng Số Tiền Cần Thanh Toán</div>
              <div className="font-serif text-3xl font-bold text-[#C5A880]">
                {billAmountFormatted} đ
              </div>
              <div className="mt-1 flex items-center justify-end gap-2">
                <span className={`px-2.5 py-0.5 text-[10px] uppercase font-bold font-mono ${
                  currentBill.status === 'Paid'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500'
                    : 'bg-amber-950 text-amber-300 border border-amber-600'
                }`}>
                  {currentBill.status === 'Paid' ? '✓ Đã Thanh Toán Hoàn Tất' : 'Chờ Thanh Toán'}
                </span>

                {currentBill.payment_method && (
                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase font-mono ${
                    currentBill.payment_method === 'VNPAY'
                      ? 'bg-[#005BAA]/20 text-[#005BAA] border border-[#005BAA]/50'
                      : currentBill.payment_method === 'MOMO'
                        ? 'bg-[#A50064]/20 text-[#D82D8B] border border-[#A50064]/50'
                        : 'bg-gray-800 text-gray-300 border border-gray-600'
                  }`}>
                    Qua {currentBill.payment_method}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Breakdown Table: Tách bạch rõ 2 nhóm Phí Định Kỳ & Dịch Vụ Cư Dân */}
          {(() => {
            const utilityTypes = ['Electricity', 'Water', 'Management_Fee', 'Parking', 'Internet'];
            const utilityItems = currentBill.details.filter(d => utilityTypes.includes(d.service_type));
            const serviceItems = currentBill.details.filter(d => !utilityTypes.includes(d.service_type));
            const utilitySubtotal = utilityItems.reduce((sum, item) => sum + item.total_line_amount, 0);
            const serviceSubtotal = serviceItems.reduce((sum, item) => sum + item.total_line_amount, 0);

            return (
              <div className="space-y-4">
                {/* 1. Nhóm Phí Sinh Hoạt Cố Định & Chỉ Số */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-300 font-semibold border-b border-[#222B35] pb-1">
                    <span className="uppercase tracking-wider text-[#C5A880] flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5" /> 1. Chi Phí Định Kỳ & Chỉ Số ({utilityItems.length})
                    </span>
                    <span className="font-mono text-gray-300">
                      Tạm tính: {utilitySubtotal.toLocaleString('vi-VN')} đ
                    </span>
                  </div>

                  <div className="divide-y divide-[#222B35] border border-[#222B35] text-xs bg-[#161B22]/40">
                    {utilityItems.map((item) => (
                      <div key={item.id} className="p-3.5 flex items-center justify-between hover:bg-[#161B22] transition-colors">
                        <div>
                          <div className="font-bold text-white flex items-center gap-2">
                            {getItemIcon(item.service_type)}
                            <span>{getItemName(item)}</span>
                            {item.ai_anomaly && (
                              <span className="px-2 py-0.5 bg-red-950 border border-red-500 text-red-300 text-[10px] font-mono font-bold">
                                Biến động bất thường
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-gray-400 mt-0.5 pl-5.5">
                            Chỉ số: <strong>{item.usage}</strong> {item.unit || (item.service_type === 'Electricity' ? 'kWh' : item.service_type === 'Water' ? 'm³' : item.service_type === 'Management_Fee' ? 'm²' : 'xe')} • Đơn giá: {item.unit_price?.toLocaleString('vi-VN')} đ
                          </div>
                          {item.anomaly_reason && (
                            <div className="text-[10px] text-amber-400 italic mt-0.5 pl-5.5">
                              * {item.anomaly_reason}
                            </div>
                          )}
                        </div>
                        <div className="font-mono font-bold text-sm text-white">
                          {item.total_line_amount.toLocaleString('vi-VN')} đ
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Nhóm Dịch Vụ Cư Dân & Giá Trị Gia Tăng */}
                {serviceItems.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-300 font-semibold border-b border-[#222B35] pb-1">
                      <span className="uppercase tracking-wider text-[#C5A880] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> 2. Dịch Vụ Đời Sống & Tiện Ích ({serviceItems.length})
                      </span>
                      <span className="font-mono text-gray-300">
                        Tạm tính: {serviceSubtotal.toLocaleString('vi-VN')} đ
                      </span>
                    </div>

                    <div className="divide-y divide-[#222B35] border border-[#222B35] text-xs bg-[#161B22]/40">
                      {serviceItems.map((item) => (
                        <div key={item.id} className="p-3.5 flex items-center justify-between hover:bg-[#161B22] transition-colors">
                          <div>
                            <div className="font-bold text-white flex items-center gap-2">
                              {getItemIcon(item.service_type)}
                              <span>{getItemName(item)}</span>
                              <span className="px-1.5 py-0.5 bg-purple-950/80 border border-purple-500/60 text-purple-300 text-[10px] font-mono">
                                Dịch Vụ Cư Dân
                              </span>
                            </div>
                            <div className="text-[11px] text-gray-400 mt-0.5 pl-5.5 flex flex-wrap items-center gap-2">
                              <span>Số lượng: <strong>{item.usage}</strong> {item.unit || 'gói'}</span>
                              <span>•</span>
                              <span>Đơn giá: {item.unit_price?.toLocaleString('vi-VN')} đ</span>
                              {item.booking_ref && (
                                <>
                                  <span>•</span>
                                  <span className="text-[#C5A880] font-mono font-semibold">#{item.booking_ref}</span>
                                </>
                              )}
                              {item.order_date && (
                                <>
                                  <span>•</span>
                                  <span className="text-gray-400 font-mono">Ngày: {item.order_date}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="font-mono font-bold text-sm text-[#C5A880]">
                            {item.total_line_amount.toLocaleString('vi-VN')} đ
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-[#161B22]/40 border border-[#222B35] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-gray-400">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-gray-500" />
                      <span>Chưa có dịch vụ đời sống phát sinh trong kỳ này.</span>
                    </div>
                    <span className="text-[11px] text-gray-500 italic">Dịch vụ đặt sẽ tự động cập nhật vào đây</span>
                  </div>
                )}

                {/* Hàng Tổng Kết Tài Chính */}
                <div className="p-3.5 bg-[#0D1117] border border-[#2D3748] flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="font-bold uppercase tracking-wider text-white">
                      Tổng Cộng Thanh Toán:
                    </span>
                    <div className="text-[11px] text-gray-400">
                      {serviceItems.length > 0 
                        ? `${utilityItems.length} mục định kỳ + ${serviceItems.length} dịch vụ (Đã gồm 10% VAT)`
                        : `${utilityItems.length} mục định kỳ (Đã gồm 10% VAT)`}
                    </div>
                  </div>
                  <div className="font-serif text-xl font-bold text-[#C5A880] font-mono">
                    {currentBill.total_amount.toLocaleString('vi-VN')} đ
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Payment Gateway Action Banner */}
          <div className="p-4 bg-[#161B22] border border-[#2D3748] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div className="space-y-1">
              <div className="font-bold text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#C5A880]" /> 
                <span>Cổng Thanh Toán Trực Tuyến 24/7:</span>
              </div>
              <div className="text-gray-400 flex items-center gap-3 pt-0.5">
                <span className="px-2 py-0.5 bg-[#005BAA]/20 border border-[#005BAA]/50 text-[#005BAA] font-bold text-[10px]">
                  Cổng VNPAY (ATM / Visa / QR)
                </span>
                <span className="px-2 py-0.5 bg-[#A50064]/20 border border-[#A50064]/50 text-[#D82D8B] font-bold text-[10px]">
                  Ví Điện Tử MoMo
                </span>
              </div>
            </div>

            {currentBill.status === 'Unpaid' ? (
              <button
                onClick={() => {
                  setLastPaymentResult(null);
                  setShowPaymentModal(true);
                }}
                className="px-4 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-colors shadow flex items-center gap-1.5 flex-shrink-0"
              >
                <CreditCard className="w-4 h-4" /> Thanh Toán Ngay
              </button>
            ) : (
              <div className="text-emerald-400 font-mono text-xs flex items-center gap-1 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Đã hoàn tất thanh toán hóa đơn này
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-12 bg-[#121820] border border-[#222B35] text-center text-gray-400 text-xs">
          Căn hộ hiện chưa có hóa đơn nào được phát hành.
        </div>
      )}
      </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: THỐNG KÊ CHI TIÊU & PHÂN TÍCH DỊCH VỤ TOÀN DIỆN                   */}
      {/* ========================================================================= */}
      {activeTab === 'ANALYTICS' && (
        <div className="space-y-6 animate-fadeIn">
          {/* 1. TOP 4 KEY METRIC CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1 */}
            <div className="p-4 bg-[#121820] border border-[#222B35] relative overflow-hidden shadow-lg group hover:border-[#C5A880]/50 transition-all">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                <span className="uppercase tracking-wider font-semibold">Tổng Chi Năm 2026</span>
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[#C5A880]">
                  <Coins className="w-4 h-4" />
                </div>
              </div>
              <div className="font-serif text-2xl font-bold text-white tracking-tight">
                {totalSpendAll.toLocaleString('vi-VN')} đ
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-gray-400">
                <span className="text-emerald-400 font-mono font-bold flex items-center">
                  <CheckCheck className="w-3.5 h-3.5 mr-0.5" /> {bills.length} kỳ
                </span>
                <span>(T05 - T08/2026)</span>
              </div>
            </div>

            {/* KPI 2 */}
            <div className="p-4 bg-[#121820] border border-[#222B35] relative overflow-hidden shadow-lg group hover:border-[#C5A880]/50 transition-all">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                <span className="uppercase tracking-wider font-semibold">Trung Bình Tháng</span>
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div className="font-serif text-2xl font-bold text-[#C5A880] tracking-tight">
                {avgMonthlySpend.toLocaleString('vi-VN')} đ
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-gray-400">
                <span className="text-cyan-400 font-mono font-bold">Chuẩn 2PN</span>
                <span>Căn hộ 73.2 m²</span>
              </div>
            </div>

            {/* KPI 3 */}
            <div className="p-4 bg-[#121820] border border-[#222B35] relative overflow-hidden shadow-lg group hover:border-[#C5A880]/50 transition-all">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                <span className="uppercase tracking-wider font-semibold">Hạng Mục Cao Nhất</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Building className="w-4 h-4" />
                </div>
              </div>
              <div className="text-base font-bold text-white truncate" title={highestCategory ? highestCategory.name : 'Phí Quản Lý'}>
                {highestCategory ? highestCategory.name : 'Phí Quản Lý & Điện'}
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-gray-400">
                <span className="text-emerald-400 font-mono font-bold">
                  {highestCategory ? `${highestCategory.percent.toFixed(1)}%` : '0%'}
                </span>
                <span>tổng chi phí</span>
              </div>
            </div>

            {/* KPI 4 */}
            <div className="p-4 bg-[#121820] border border-[#222B35] relative overflow-hidden shadow-lg group hover:border-[#C5A880]/50 transition-all">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                <span className="uppercase tracking-wider font-semibold">Thanh Toán Đúng Hạn</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="font-serif text-2xl font-bold text-emerald-400 tracking-tight">
                {onTimeRate}% Đúng Hạn
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-gray-400">
                <span className="text-amber-300 font-bold uppercase tracking-wider text-[10px]">Platinum VIP</span>
                <span>• 0 ngày trễ</span>
              </div>
            </div>
          </div>

          {/* 2. CƠ CẤU CHI TIÊU THEO HẠNG MỤC (EXPENSE BREAKDOWN CARDS & PROGRESS BARS) */}
          <div className="p-6 bg-[#121820] border border-[#222B35] space-y-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222B35] pb-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-[#C5A880] font-semibold flex items-center gap-1.5">
                  <PieChart className="w-3.5 h-3.5" /> Cơ Cấu Chi Phí
                </div>
                <h3 className="font-serif text-lg text-white font-bold mt-0.5">
                  Tỷ Trọng Dịch Vụ & Tiện Ích
                </h3>
              </div>

              {/* Filter categories */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <button
                  onClick={() => setAnalyticsCategory('ALL')}
                  className={`px-2.5 py-1 text-xs font-mono transition-all ${
                    analyticsCategory === 'ALL'
                      ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow'
                      : 'bg-[#161B22] border border-[#2D3748] text-gray-300 hover:text-white'
                  }`}
                >
                  Tất Cả ({categoryStats.length})
                </button>
                {categoryStats.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setAnalyticsCategory(cat.id)}
                    className={`px-2.5 py-1 text-xs font-mono transition-all flex items-center gap-1 ${
                      analyticsCategory === cat.id
                        ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow'
                        : 'bg-[#161B22] border border-[#2D3748] text-gray-300 hover:text-white'
                    }`}
                  >
                    <span>{cat.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Stacked visually proportioned bar of all categories */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Thanh phân bổ tỷ trọng tổng chi phí:</span>
                <span className="font-mono text-gray-300">100% ({totalSpendAll.toLocaleString('vi-VN')} đ)</span>
              </div>
              <div className="w-full h-3.5 bg-[#0D1117] rounded-full overflow-hidden flex border border-[#2D3748]">
                {categoryStats.map(cat => {
                  if (cat.percent <= 0) return null;
                  return (
                    <div
                      key={cat.id}
                      style={{ width: `${cat.percent}%`, backgroundColor: cat.color }}
                      className="h-full transition-all hover:opacity-90 relative group"
                      title={`${cat.name}: ${cat.amount.toLocaleString('vi-VN')} đ (${cat.percent.toFixed(1)}%)`}
                    />
                  );
                })}
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-gray-400">
                {categoryStats.map(cat => (
                  <div key={cat.id} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span>{cat.name}:</span>
                    <strong className="text-gray-200 font-mono">{cat.percent.toFixed(1)}%</strong>
                  </div>
                ))}
              </div>
            </div>

            {/* Grid of Category Detail Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
              {categoryStats
                .filter(cat => analyticsCategory === 'ALL' || analyticsCategory === cat.id)
                .map(cat => {
                  const Icon = cat.icon;
                  return (
                    <div 
                      key={cat.id}
                      className="p-4 bg-[#161B22]/70 border border-[#222B35] hover:border-[#2D3748] transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded bg-[#0D1117] border border-[#222B35]">
                            <Icon className={`w-4 h-4 ${cat.textColor}`} />
                          </div>
                          <div>
                            <div className="font-bold text-white text-xs">{cat.name}</div>
                            <div className="text-[10px] text-gray-400">{cat.rate}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-serif font-bold text-sm text-white font-mono">
                            {cat.amount.toLocaleString('vi-VN')} đ
                          </div>
                          <div className="text-[10px] text-gray-400 font-mono">
                            {cat.percent.toFixed(1)}% tổng chi
                          </div>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-[#0D1117] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(cat.percent, 100)}%`, backgroundColor: cat.color }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-gray-400 pt-0.5 border-t border-[#222B35]">
                        <span className="truncate pr-1">{cat.subtext}</span>
                        <span className="text-gray-300 font-mono font-medium flex-shrink-0">
                          {cat.trend}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* 3. LỊCH SỬ & XU HƯỚNG CHI TIÊU THEO KỲ HÓA ĐƠN (MONTHLY TREND & COMPARISON) */}
          <div className="p-6 bg-[#121820] border border-[#222B35] space-y-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222B35] pb-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-[#C5A880] font-semibold flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" /> Biến Động Qua Các Tháng
                </div>
                <h3 className="font-serif text-lg text-white font-bold mt-0.5">
                  Tiến Trình Chi Phí Sinh Hoạt
                </h3>
              </div>
              <div className="text-xs text-gray-400">
                Chu kỳ: <strong className="text-white">Ngày 05 hàng tháng</strong>
              </div>
            </div>

            {/* Monthly Cards Visual Comparison */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              {sortedBills.map((b, index) => {
                const prev = index > 0 ? sortedBills[index - 1] : null;
                const diffAmount = prev ? b.total_amount - prev.total_amount : 0;
                const diffPercent = prev ? Math.round((diffAmount / prev.total_amount) * 100) : 0;

                // Sub-totals inside this bill
                const elecLine = b.details.find(d => d.service_type === 'Electricity')?.total_line_amount || 0;
                const waterLine = b.details.find(d => d.service_type === 'Water')?.total_line_amount || 0;
                const fixedLine = b.details.filter(d => ['Management_Fee', 'Parking', 'Internet'].includes(d.service_type)).reduce((s, d) => s + d.total_line_amount, 0);
                const serviceLine = b.details.filter(d => !['Electricity', 'Water', 'Management_Fee', 'Parking', 'Internet'].includes(d.service_type)).reduce((s, d) => s + d.total_line_amount, 0);

                return (
                  <div 
                    key={b.id}
                    className={`p-4 border transition-all flex flex-col justify-between space-y-4 ${
                      b.id === currentBill?.id
                        ? 'bg-[#161B22] border-[#C5A880] ring-1 ring-[#C5A880]/30 shadow-xl'
                        : 'bg-[#161B22]/50 border-[#222B35] hover:border-gray-600'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs pb-2 border-b border-[#222B35]">
                        <span className="font-bold text-white font-mono">{b.billing_month}</span>
                        <span className={`px-2 py-0.5 text-[9px] font-mono font-bold ${
                          b.status === 'Paid'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                            : 'bg-amber-950 text-amber-300 border border-amber-500/50'
                        }`}>
                          {b.status === 'Paid' ? 'Đã Nộp ✓' : 'Chờ Nộp'}
                        </span>
                      </div>

                      <div className="mt-3 text-center">
                        <div className="text-[11px] text-gray-400">Hóa đơn kỳ:</div>
                        <div className="font-serif text-xl font-bold text-[#C5A880] mt-0.5">
                          {b.total_amount.toLocaleString('vi-VN')} đ
                        </div>
                      </div>

                      {/* Sub-breakdown badges */}
                      <div className="mt-3 pt-3 border-t border-[#222B35] space-y-1 text-[11px]">
                        <div className="flex items-center justify-between text-gray-300">
                          <span className="flex items-center gap-1 text-amber-400">
                            <Zap className="w-3 h-3" /> Điện:
                          </span>
                          <span className="font-mono">{elecLine.toLocaleString('vi-VN')} đ</span>
                        </div>
                        <div className="flex items-center justify-between text-gray-300">
                          <span className="flex items-center gap-1 text-cyan-400">
                            <Droplets className="w-3 h-3" /> Nước:
                          </span>
                          <span className="font-mono">{waterLine.toLocaleString('vi-VN')} đ</span>
                        </div>
                        <div className="flex items-center justify-between text-gray-300">
                          <span className="flex items-center gap-1 text-emerald-400">
                            <Building className="w-3 h-3" /> Cố định:
                          </span>
                          <span className="font-mono">{fixedLine.toLocaleString('vi-VN')} đ</span>
                        </div>
                        {serviceLine > 0 && (
                          <div className="flex items-center justify-between text-purple-300 font-bold">
                            <span className="flex items-center gap-1">
                              <Sparkles className="w-3 h-3" /> Dịch vụ:
                            </span>
                            <span className="font-mono">{serviceLine.toLocaleString('vi-VN')} đ</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom comparison indicator */}
                    <div className="pt-2 border-t border-[#222B35] flex items-center justify-between text-[10px] text-gray-400">
                      <span>So kỳ trước:</span>
                      {prev ? (
                        <span className={`font-mono font-bold flex items-center gap-0.5 ${
                          diffAmount > 0 ? 'text-amber-400' : diffAmount < 0 ? 'text-emerald-400' : 'text-gray-400'
                        }`}>
                          {diffAmount > 0 ? <ArrowUpRight className="w-3 h-3" /> : diffAmount < 0 ? <ArrowDownRight className="w-3 h-3" /> : null}
                          {diffAmount > 0 ? `+${diffPercent}%` : diffAmount < 0 ? `${diffPercent}%` : '0%'}
                        </span>
                      ) : (
                        <span className="font-mono text-gray-500">Kỳ đầu</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. BẢNG MA TRẬN CHI TIẾT TOÀN BỘ DỊCH VỤ, TIỆN ÍCH, ĐIỆN NƯỚC, INTERNET */}
          <div className="p-6 bg-[#121820] border border-[#222B35] space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222B35] pb-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-[#C5A880] font-semibold flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" /> Bảng Kê Dịch Vụ
                </div>
                <h3 className="font-serif text-lg text-white font-bold mt-0.5">
                  Chi Tiết Định Mức & Tiêu Dùng
                </h3>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={handleExportExpenseCsv}
                  className="px-3 py-1.5 bg-[#161B22] border border-[#2D3748] hover:border-[#C5A880] text-gray-200 text-xs font-semibold transition-all flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Xuất CSV</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#0D1117] text-gray-400 border-b border-[#222B35] uppercase font-mono text-[10px]">
                  <tr>
                    <th className="p-3">Hạng Mục</th>
                    <th className="p-3">Loại Phí</th>
                    <th className="p-3 text-right">Sản Lượng</th>
                    <th className="p-3 text-right">Đơn Giá</th>
                    <th className="p-3 text-right">Tổng Chi</th>
                    <th className="p-3 text-right">Tỷ Trọng</th>
                    <th className="p-3">Ghi Chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222B35]">
                  {categoryStats.map(cat => {
                    const Icon = cat.icon;
                    return (
                      <tr key={cat.id} className="hover:bg-[#161B22]/50 transition-colors">
                        <td className="p-3 font-medium text-white flex items-center gap-2">
                          <Icon className={`w-3.5 h-3.5 ${cat.textColor}`} />
                          <span>{cat.name}</span>
                        </td>
                        <td className="p-3 text-gray-400">
                          {['Electricity', 'Water', 'Management_Fee', 'Parking', 'Internet'].includes(cat.id)
                            ? <span className="px-1.5 py-0.5 bg-blue-950/70 border border-blue-500/40 text-blue-300 text-[10px] font-mono">Định Kỳ</span>
                            : <span className="px-1.5 py-0.5 bg-purple-950/70 border border-purple-500/40 text-purple-300 text-[10px] font-mono">Dịch Vụ</span>
                          }
                        </td>
                        <td className="p-3 text-right font-mono text-gray-200">
                          {cat.id === 'Electricity' ? `${totalKwh.toLocaleString('vi-VN')} kWh` :
                           cat.id === 'Water' ? `${totalM3.toLocaleString('vi-VN')} m³` :
                           cat.id === 'Management_Fee' ? `73.2 m² x ${bills.length} th` :
                           cat.id === 'Internet' ? `${bills.length} tháng` :
                           cat.id === 'Parking' ? `${bills.length} kỳ` :
                           `${serviceDetails.length} đơn`}
                        </td>
                        <td className="p-3 text-right font-mono text-gray-300">{cat.rate}</td>
                        <td className="p-3 text-right font-mono font-bold text-white">
                          {cat.amount.toLocaleString('vi-VN')} đ
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-[#C5A880]">
                          {cat.percent.toFixed(1)}%
                        </td>
                        <td className="p-3 text-gray-400 text-[11px]">{cat.note}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-[#0D1117] border-t-2 border-[#2D3748] font-bold">
                  <tr>
                    <td className="p-3 text-white uppercase tracking-wider" colSpan={4}>
                      Tổng Chi Tiêu Tích Lũy (T05 - T08):
                    </td>
                    <td className="p-3 text-right font-serif text-sm font-bold text-[#C5A880] font-mono">
                      {totalSpendAll.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="p-3 text-right font-mono text-emerald-400">100%</td>
                    <td className="p-3 text-gray-400 text-[11px]">Đã bao gồm 10% VAT</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* 5. GỢI Ý TỐI ƯU HÓA CHI PHÍ & CẢNH BÁO AI THÔNG MINH (AI SMART INSIGHTS) */}
          <div className="p-6 bg-[#121820] border border-[#222B35] space-y-4 shadow-xl">
            <div className="flex items-center gap-2 border-b border-[#222B35] pb-3">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="font-serif text-base text-white font-bold">
                Gợi Ý AI Tối Ưu Năng Lượng & Chi Phí
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Insight 1: Tiết kiệm điện */}
              <div className="p-4 bg-[#161B22] border border-amber-500/40 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <Zap className="w-4 h-4" />
                  <span>Tối Ưu Hóa Tiền Điện</span>
                </div>
                <p className="text-gray-300 leading-relaxed text-[11px]">
                  Mức tiêu thụ điện tháng 8 là <strong>340 kWh</strong>, cao hơn 21% so với tháng 7 do nắng nóng. Bật điều hòa ở mức <strong>26°C kết hợp quạt đối lưu</strong> có thể giúp căn hộ tiết kiệm từ <strong>120.000 - 180.000 đ/tháng</strong>.
                </p>
              </div>

              {/* Insight 2: Cảnh báo nước */}
              <div className="p-4 bg-[#161B22] border border-cyan-500/40 space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 font-bold">
                  <Droplets className="w-4 h-4" />
                  <span>Giám Sát Lưu Lượng Nước</span>
                </div>
                <p className="text-gray-300 leading-relaxed text-[11px]">
                  Cảm biến đồng hồ nước thông minh IoT phát hiện lưu lượng nước đêm (02:00 - 04:00) tại phòng vệ sinh master. Cư dân có thể gửi yêu cầu hỗ trợ kỹ thuật trên Portal để được kiểm tra van miễn phí.
                </p>
              </div>

              {/* Insight 3: Dịch vụ & Internet */}
              <div className="p-4 bg-[#161B22] border border-teal-500/40 space-y-2">
                <div className="flex items-center gap-2 text-teal-400 font-bold">
                  <Wifi className="w-4 h-4" />
                  <span>Ưu Đãi Cáp Quang & Dịch Vụ</span>
                </div>
                <p className="text-gray-300 leading-relaxed text-[11px]">
                  Đường truyền Internet Fiber 300Mbps hoạt động ổn định 99.98% uptime. Khi đặt kèm các dịch vụ đời sống (Giặt ủi, PT, Dọn dẹp), điểm tích lũy Skyline Rewards sẽ được hoàn trực tiếp vào kỳ hóa đơn tiếp theo.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL THANH TOÁN CHÍNH: VNPAY & MOMO GATEWAY                              */}
      {/* ========================================================================= */}
      {showPaymentModal && currentBill && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121820] border border-[#C5A880] max-w-lg w-full p-6 space-y-4 shadow-2xl animate-fadeIn text-white">
            <div className="flex items-center justify-between border-b border-[#222B35] pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#C5A880]" />
                <h3 className="font-serif text-lg font-bold text-white">
                  Cổng Thanh Toán Hóa Đơn Kỳ {currentBill.billing_month}
                </h3>
              </div>
              <button 
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Màn hình thông báo khi thanh toán thành công */}
            {lastPaymentResult ? (
              <div className="p-6 bg-[#161B22] border border-emerald-500 text-center space-y-4 animate-fadeIn">
                <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>

                <div className="space-y-1">
                  <h4 className="font-serif text-lg font-bold text-white">Giao Dịch Thành Công!</h4>
                  <p className="text-xs text-emerald-300">
                    Hệ thống đã nhận phản hồi IPN từ cổng thanh toán <strong>{lastPaymentResult.gateway}</strong>.
                  </p>
                </div>

                <div className="p-3 bg-[#121820] border border-[#2D3748] text-xs text-left space-y-1.5 font-mono">
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-sans">Mã giao dịch:</span>
                    <span className="text-[#C5A880] font-bold">{lastPaymentResult.transId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-sans">Số tiền thanh toán:</span>
                    <span className="text-white font-bold">{lastPaymentResult.amount.toLocaleString('vi-VN')} đ</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-sans">Căn hộ thụ hưởng:</span>
                    <span className="text-white">Căn {aptCode} ({residentName})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-sans">Thời gian ghi nhận:</span>
                    <span className="text-gray-300">{lastPaymentResult.paidAt}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-sans">Trạng thái gạch nợ:</span>
                    <span className="text-emerald-400 font-bold">ĐÃ GẠCH NỢ THÀNH CÔNG ✓</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-6 py-2.5 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-colors shadow"
                >
                  Hoàn Tất & Đóng
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 2 Primary Gateway Tabs: VNPAY vs MOMO */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedGateway('VNPAY')}
                    className={`p-3 border text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                      selectedGateway === 'VNPAY'
                        ? 'border-[#005BAA] bg-[#005BAA] text-white shadow-lg'
                        : 'border-[#222B35] bg-[#161B22] text-gray-400 hover:text-white'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" /> Cổng VNPAY
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedGateway('MOMO')}
                    className={`p-3 border text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                      selectedGateway === 'MOMO'
                        ? 'border-[#A50064] bg-[#A50064] text-white shadow-lg'
                        : 'border-[#222B35] bg-[#161B22] text-gray-400 hover:text-white'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" /> Ví Điện Tử MoMo
                  </button>
                </div>

                {/* ------------------------------------------------------------- */}
                {/* GATEWAY 1: VNPAY GATEWAY - QUY TRÌNH THANH TOÁN ĐA BƯỚC THỰC TẾ */}
                {/* ------------------------------------------------------------- */}
                {selectedGateway === 'VNPAY' && (
                  <div className="space-y-4 bg-[#161B22] p-4 border border-[#005BAA]/70 text-xs shadow-xl animate-fadeIn">
                    {/* Header Cổng VNPAY Chuẩn */}
                    <div className="p-3 bg-gradient-to-r from-[#005BAA]/30 via-[#161B22] to-[#ED1C24]/20 border border-[#005BAA]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="px-2 py-1 bg-white rounded flex items-center gap-1 shadow">
                          <span className="font-extrabold text-[#005BAA] text-sm tracking-tighter">VN</span>
                          <span className="font-extrabold text-[#ED1C24] text-sm tracking-tighter">PAY</span>
                        </div>
                        <div>
                          <div className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">CỔNG THANH TOÁN VNPAY SANDBOX</div>
                          <div className="font-bold text-white text-xs">BAN QUẢN LÝ SKYLINE RESIDENCE</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-auto">
                        <div className="flex items-center gap-1.5 text-[11px] text-amber-400 font-mono bg-black/40 px-2.5 py-1 border border-amber-500/30">
                          <Clock className="w-3.5 h-3.5 animate-spin" />
                          <span>Hết hạn: {formatCountdown(vnpCountdown)}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-gray-400">Số tiền thanh toán:</div>
                          <div className="font-mono font-bold text-[#C5A880] text-sm">{billAmountFormatted} đ</div>
                        </div>
                      </div>
                    </div>

                    {/* BƯỚC 1: CHỌN PHƯƠNG THỨC THANH TOÁN VNPAY */}
                    {vnpFlowStep === 'SELECT_METHOD' && (
                      <div className="space-y-3.5 animate-fadeIn">
                        <div className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                          Bước 1: Chọn Phương Thức Thanh Toán VNPAY:
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Lựa chọn A: Thẻ ATM Nội Địa (NCB) */}
                          <div 
                            onClick={() => setVnpFlowStep('ATM_FORM')}
                            className="p-3.5 bg-[#121820] border-2 border-[#005BAA] hover:bg-[#1A2535] cursor-pointer transition-all space-y-2 group shadow-lg"
                          >
                            <div className="flex items-center justify-between">
                              <span className="px-2 py-0.5 bg-[#005BAA] text-white font-bold text-[9px] uppercase tracking-wider">
                                Khuyên Dùng
                              </span>
                              <CreditCard className="w-5 h-5 text-[#4CC9F0] group-hover:scale-110 transition-transform" />
                            </div>
                            <div>
                              <h4 className="font-bold text-white text-sm">Thẻ ATM & Tài Khoản Ngân Hàng</h4>
                              <p className="text-[11px] text-gray-400 mt-0.5">
                                Thanh toán bằng thẻ nội địa NCB, Vietcombank, BIDV... qua xác thực 3D-Secure OTP.
                              </p>
                            </div>
                            <div className="pt-2 border-t border-[#222B35] flex items-center justify-between text-[11px] text-[#4CC9F0] font-semibold">
                              <span>Tiếp tục điền thẻ NCB</span>
                              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                            </div>
                          </div>

                          {/* Lựa chọn B: VNPAY-QR */}
                          <div 
                            onClick={() => setVnpFlowStep('QR_SCAN')}
                            className="p-3.5 bg-[#121820] border border-[#2D3748] hover:border-[#005BAA] hover:bg-[#1A2535] cursor-pointer transition-all space-y-2 group shadow"
                          >
                            <div className="flex items-center justify-between">
                              <span className="px-2 py-0.5 bg-[#222B35] text-gray-300 font-bold text-[9px] uppercase tracking-wider">
                                Quét Nhanh
                              </span>
                              <QrCode className="w-5 h-5 text-[#C5A880] group-hover:scale-110 transition-transform" />
                            </div>
                            <div>
                              <h4 className="font-bold text-white text-sm">Cổng Quét Mã VNPAY-QR</h4>
                              <p className="text-[11px] text-gray-400 mt-0.5">
                                Quét mã trực tiếp qua 35+ ứng dụng Mobile Banking hoặc Ví VNPAY.
                              </p>
                            </div>
                            <div className="pt-2 border-t border-[#222B35] flex items-center justify-between text-[11px] text-[#C5A880] font-semibold">
                              <span>Quét mã VNPAY-QR</span>
                              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                            </div>
                          </div>
                        </div>

                        {/* Hộp Thông Tin Thẻ Test Do VNPAY Cấp */}
                        <div className="p-3 bg-[#0D1117] border border-[#222B35] space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold text-[#C5A880] tracking-wider">
                              Thông Tin Thẻ Thử Nghiệm Sandbox Được VNPAY Cấp Sẵn:
                            </span>
                            <span className="text-[10px] text-gray-400">Click để sao chép</span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                            <div className="p-1.5 bg-[#161B22] border border-[#222B35] text-center">
                              <div className="text-[10px] text-gray-500 font-sans">Ngân hàng:</div>
                              <div className="font-bold text-white">NCB</div>
                            </div>
                            <div 
                              onClick={() => copyToClipboard(VNPAY_NCB_TEST_CARD.cardNumber, 'card')}
                              className="p-1.5 bg-[#161B22] border border-[#222B35] hover:border-[#005BAA] cursor-pointer text-center transition-colors"
                              title="Click để copy số thẻ"
                            >
                              <div className="text-[10px] text-gray-500 font-sans">Số thẻ test:</div>
                              <div className="font-bold text-emerald-400 flex items-center justify-center gap-1">
                                <span>9704 1985...</span>
                                {copiedField === 'card' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-gray-400" />}
                              </div>
                            </div>
                            <div 
                              onClick={() => copyToClipboard(VNPAY_NCB_TEST_CARD.cardHolder, 'holder')}
                              className="p-1.5 bg-[#161B22] border border-[#222B35] hover:border-[#005BAA] cursor-pointer text-center transition-colors"
                              title="Click để copy tên"
                            >
                              <div className="text-[10px] text-gray-500 font-sans">Chủ thẻ:</div>
                              <div className="font-bold text-white flex items-center justify-center gap-1">
                                <span>NGUYEN VAN A</span>
                                {copiedField === 'holder' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-gray-400" />}
                              </div>
                            </div>
                            <div className="p-1.5 bg-[#161B22] border border-[#222B35] text-center">
                              <div className="text-[10px] text-gray-500 font-sans">Ngày / OTP:</div>
                              <div className="font-bold text-[#4CC9F0]">07/15 • 123456</div>
                            </div>
                          </div>
                        </div>

                        {/* Nút mở trang sandbox ngoài */}
                        <div className="pt-2 border-t border-[#222B35] flex items-center justify-between text-[11px]">
                          <span className="text-gray-400">
                            * Cổng thanh toán Sandbox bên ngoài (`sandbox.vnpayment.vn`):
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenVnpaySandbox()}
                            disabled={isRedirectingVnpay}
                            className="px-3 py-1 bg-[#1C2533] hover:bg-[#233144] border border-[#2D3748] hover:border-[#005BAA] text-gray-200 hover:text-white transition-colors flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3 text-[#005BAA]" />
                            <span>Mở Trang sandbox.vnpayment.vn</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* BƯỚC 2A: FORM ĐIỀN THÔNG TIN THẺ ATM & CHỌN NGÂN HÀNG */}
                    {vnpFlowStep === 'ATM_FORM' && (
                      <div className="space-y-3.5 animate-fadeIn">
                        <div className="flex items-center justify-between border-b border-[#222B35] pb-2">
                          <span className="font-bold text-white uppercase tracking-wider text-xs">
                            Bước 2/3: Chọn Ngân Hàng & Nhập Thông Tin Thẻ ATM
                          </span>
                          <button
                            type="button"
                            onClick={() => setVnpFlowStep('SELECT_METHOD')}
                            className="text-gray-400 hover:text-white text-[11px]"
                          >
                            ← Quay lại
                          </button>
                        </div>

                        {/* Grid các Ngân hàng */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] text-gray-400 font-semibold">Chọn Ngân Hàng Phát Hành:</label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {[
                              { code: 'NCB', name: 'NCB (Quốc Dân)', tag: 'Thẻ Test' },
                              { code: 'VCB', name: 'Vietcombank', tag: '' },
                              { code: 'BIDV', name: 'BIDV', tag: '' },
                              { code: 'CTG', name: 'VietinBank', tag: '' },
                              { code: 'TCB', name: 'Techcombank', tag: '' },
                              { code: 'MB', name: 'MBBank', tag: '' },
                              { code: 'VBA', name: 'Agribank', tag: '' },
                              { code: 'ACB', name: 'ACB', tag: '' },
                            ].map((b) => (
                              <button
                                key={b.code}
                                type="button"
                                onClick={() => setVnpSelectedBank(b.code)}
                                className={`p-2 border text-left text-[11px] transition-all relative ${
                                  vnpSelectedBank === b.code
                                    ? 'border-[#005BAA] bg-[#005BAA]/20 text-white font-bold'
                                    : 'border-[#222B35] bg-[#121820] text-gray-400 hover:text-white'
                                }`}
                              >
                                <div>{b.name}</div>
                                {b.tag && (
                                  <span className="text-[8px] bg-amber-500 text-black px-1 font-bold absolute right-1 top-1">
                                    {b.tag}
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Form Nhập Dữ Liệu Thẻ */}
                        <div className="p-3 bg-[#121820] border border-[#2D3748] space-y-3">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <label className="text-[11px] text-gray-400">Số Thẻ Ngân Hàng (ATM):</label>
                              <button
                                type="button"
                                onClick={() => {
                                  setVnpCardNumber(VNPAY_NCB_TEST_CARD.cardNumber);
                                  setVnpCardHolder(VNPAY_NCB_TEST_CARD.cardHolder);
                                  setVnpCardDate(VNPAY_NCB_TEST_CARD.issueDate);
                                }}
                                className="text-[10px] text-[#4CC9F0] hover:underline"
                              >
                                Điền nhanh thẻ test NCB
                              </button>
                            </div>
                            <input
                              type="text"
                              value={vnpCardNumber}
                              onChange={(e) => setVnpCardNumber(e.target.value)}
                              placeholder="9704 1985 2619 1432 198"
                              className="w-full bg-[#161B22] border border-[#2D3748] focus:border-[#005BAA] p-2 text-white font-mono text-xs focus:outline-none"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[11px] text-gray-400">Tên In Trên Thẻ (Không Dấu):</label>
                              <input
                                type="text"
                                value={vnpCardHolder}
                                onChange={(e) => setVnpCardHolder(e.target.value.toUpperCase())}
                                placeholder="NGUYEN VAN A"
                                className="w-full bg-[#161B22] border border-[#2D3748] focus:border-[#005BAA] p-2 text-white font-mono text-xs uppercase focus:outline-none"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[11px] text-gray-400">Ngày Phát Hành (MM/YY):</label>
                              <input
                                type="text"
                                value={vnpCardDate}
                                onChange={(e) => setVnpCardDate(e.target.value)}
                                placeholder="07/15"
                                className="w-full bg-[#161B22] border border-[#2D3748] focus:border-[#005BAA] p-2 text-white font-mono text-xs focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Nút Tiếp Tục Sang Màn Hình OTP */}
                        <div className="flex gap-2 justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => setVnpFlowStep('SELECT_METHOD')}
                            className="px-4 py-2 border border-gray-700 text-gray-400 hover:text-white text-xs"
                          >
                            Quay Lại
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (!vnpCardNumber.trim() || vnpCardNumber.length < 10) {
                                alert('Vui lòng nhập số thẻ ngân hàng hợp lệ!');
                                return;
                              }
                              setVnpFlowStep('ATM_OTP');
                            }}
                            className="px-6 py-2 bg-[#005BAA] hover:bg-[#004887] text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow"
                          >
                            Tiếp Tục Xác Thực OTP <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* BƯỚC 2B: MÀN HÌNH XÁC THỰC 3D-SECURE OTP CỦA NGÂN HÀNG NCB */}
                    {vnpFlowStep === 'ATM_OTP' && (
                      <div className="space-y-3.5 bg-[#0D1520] p-4 border-2 border-[#005BAA] text-xs animate-fadeIn">
                        {/* Header Ngân Hàng NCB */}
                        <div className="border-b border-[#222B35] pb-2.5 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="px-2 py-0.5 bg-blue-900 text-white font-black text-xs">NCB</div>
                            <div>
                              <div className="font-bold text-white text-xs">NGÂN HÀNG TMCP QUỐC DÂN</div>
                              <div className="text-[10px] text-[#4CC9F0] uppercase tracking-wider font-semibold">CỔNG XÁC THỰC GIAO DỊCH 3D-SECURE</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-gray-400">Hiệu lực OTP: </span>
                            <span className="font-mono text-amber-400 font-bold">{otpCountdown}s</span>
                          </div>
                        </div>

                        {/* Thông tin đơn hàng từ phía Ngân Hàng */}
                        <div className="p-3 bg-[#121820] border border-[#222B35] space-y-1.5 text-[11px]">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Đơn vị thanh toán:</span>
                            <strong className="text-white">CỔNG VNPAY - BQL SKYLINE RESIDENCE</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Thẻ giao dịch:</span>
                            <span className="font-mono text-gray-300">9704 19** **** 198 (NCB)</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Số tiền trích nợ:</span>
                            <span className="font-mono font-bold text-emerald-400 text-xs">{billAmountFormatted} VNĐ</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">SĐT nhận OTP:</span>
                            <span className="font-mono text-gray-300">036496****</span>
                          </div>
                        </div>

                        {/* Ô Nhập OTP */}
                        <div className="space-y-2 text-center py-2">
                          <div className="text-xs text-gray-300">
                            Nhập mã xác thực gồm <strong>6 chữ số</strong> được gửi tới điện thoại của bạn:
                          </div>

                          <div className="flex items-center justify-center gap-2">
                            <input
                              type="text"
                              maxLength={6}
                              value={vnpOtpInput}
                              onChange={(e) => {
                                setVnpOtpInput(e.target.value);
                                if (vnpOtpError) setVnpOtpError(null);
                              }}
                              placeholder="123456"
                              className="w-44 bg-[#161B22] border-2 border-[#005BAA] p-2 text-center text-white text-base font-mono tracking-widest focus:outline-none shadow-inner"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setVnpOtpInput('123456');
                                if (vnpOtpError) setVnpOtpError(null);
                              }}
                              className="px-2.5 py-2 bg-[#1C2533] border border-gray-600 hover:border-[#005BAA] text-[10px] text-[#4CC9F0] transition-colors"
                              title="Điền tự động OTP kiểm thử"
                            >
                              Điền OTP Test (123456)
                            </button>
                          </div>

                          {vnpOtpError && (
                            <div className="text-red-400 text-xs font-semibold animate-shake">
                              {vnpOtpError}
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2 justify-between pt-1 border-t border-[#222B35]">
                          <button
                            type="button"
                            onClick={() => setVnpFlowStep('ATM_FORM')}
                            className="px-3.5 py-2 border border-gray-700 text-gray-400 hover:text-white text-xs"
                          >
                            Quay Lại Sửa Thẻ
                          </button>

                          <button
                            type="button"
                            onClick={handleVerifyAtmOtp}
                            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-lg"
                          >
                            <Check className="w-4 h-4" /> Xác Nhận Trừ Tiền & Thanh Toán
                          </button>
                        </div>
                      </div>
                    )}

                    {/* BƯỚC 2C: MÀN HÌNH QUÉT MÃ VNPAY-QR */}
                    {vnpFlowStep === 'QR_SCAN' && (
                      <div className="space-y-3.5 text-center py-2 animate-fadeIn">
                        <div className="flex items-center justify-between border-b border-[#222B35] pb-2 text-left">
                          <span className="font-bold text-white uppercase tracking-wider text-xs">
                            Bước 2/2: Quét Mã VNPAY-QR Bằng Ứng Dụng Ngân Hàng
                          </span>
                          <button
                            type="button"
                            onClick={() => setVnpFlowStep('SELECT_METHOD')}
                            className="text-gray-400 hover:text-white text-[11px]"
                          >
                            ← Quay lại
                          </button>
                        </div>

                        <div className="p-3 bg-white border-2 border-[#005BAA] inline-block shadow-xl">
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=00020101021238540010A00000072701240006970436011009031122330208QRIBFTTA5303704540724650005802VN5913SKYLINE_12A0562200816SKYLINE12A05T086304`} 
                            alt="VNPAY-QR Code" 
                            className="w-36 h-36 object-contain mx-auto"
                          />
                        </div>

                        <p className="text-[11px] text-gray-300 max-w-sm mx-auto">
                          Mở ứng dụng <strong>Mobile Banking của 35+ ngân hàng</strong> (Vietcombank, BIDV, Techcombank, MB...) hoặc <strong>Ví VNPAY</strong> và chọn tính năng quét mã QR.
                        </p>

                        <button
                          type="button"
                          onClick={() => setVnpFlowStep('APP_CONFIRM')}
                          className="w-full py-2.5 bg-[#005BAA] hover:bg-[#004887] text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-lg"
                        >
                          <Smartphone className="w-4 h-4" />
                          <span>Mở Trình Xác Nhận Trên Ứng Dụng Mobile Banking</span>
                        </button>
                      </div>
                    )}

                    {/* BƯỚC 2D: MÀN HÌNH GIẢ LẬP APP NGÂN HÀNG XÁC NHẬN CHUYỂN TIỀN */}
                    {vnpFlowStep === 'APP_CONFIRM' && (
                      <div className="space-y-3.5 bg-[#0D1520] p-4 border border-[#2D3748] text-xs animate-fadeIn">
                        <div className="flex items-center justify-between border-b border-[#222B35] pb-2">
                          <div className="flex items-center gap-1.5 font-bold text-white">
                            <Smartphone className="w-4 h-4 text-emerald-400" />
                            <span>Ứng Dụng Mobile Banking - Xác Nhận Chuyển Tiền QR</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setVnpFlowStep('QR_SCAN')}
                            className="text-gray-400 hover:text-white text-[11px]"
                          >
                            ← Đổi mã QR
                          </button>
                        </div>

                        <div className="p-3 bg-[#121820] border border-[#222B35] space-y-2 text-[11px]">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Người nhận:</span>
                            <strong className="text-white">BAN QUẢN LÝ SKYLINE RESIDENCE (VNPAY)</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Số tiền chuyển:</span>
                            <strong className="font-mono text-emerald-400 text-sm">{billAmountFormatted} VNĐ</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Nội dung thanh toán:</span>
                            <span className="font-mono text-gray-300">SKYLINE {aptCode} T082026</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Tài khoản nguồn:</span>
                            <span className="font-mono text-gray-300">0364967082 - NGUYEN HUU LUC</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleVerifyQrInBankingApp}
                          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-lg"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Xác Nhận Chuyển Tiền Bằng FaceID / PIN</span>
                        </button>
                      </div>
                    )}

                    {/* BƯỚC 3: MÀN HÌNH XỬ LÝ GIAO DỊCH THỜI GIAN THỰC (PROCESSING) */}
                    {vnpFlowStep === 'PROCESSING' && (
                      <div className="p-6 bg-[#0D1520] border border-[#005BAA] space-y-4 text-center animate-fadeIn">
                        <RefreshCw className="w-8 h-8 text-[#005BAA] animate-spin mx-auto" />
                        <div className="space-y-1">
                          <h4 className="font-bold text-white text-sm uppercase tracking-wider">
                            VNPAY Đang Tiến Hành Xử Lý Giao Dịch
                          </h4>
                          <p className="text-[11px] text-gray-400">
                            Vui lòng không đóng trình duyệt hoặc tải lại trang trong khi hệ thống kết nối với ngân hàng.
                          </p>
                        </div>

                        {/* Tiến trình 3 giai đoạn */}
                        <div className="p-3 bg-[#121820] border border-[#222B35] text-left space-y-2 text-xs font-mono">
                          <div className={`flex items-center gap-2 ${processingStage >= 1 ? 'text-white' : 'text-gray-500'}`}>
                            {processingStage > 1 ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                            ) : (
                              <RefreshCw className="w-4 h-4 animate-spin text-[#005BAA] flex-shrink-0" />
                            )}
                            <span>1. Gửi yêu cầu xác thực sang Ngân hàng Quốc Dân NCB...</span>
                          </div>

                          <div className={`flex items-center gap-2 ${processingStage >= 2 ? 'text-white' : 'text-gray-500'}`}>
                            {processingStage > 2 ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                            ) : processingStage === 2 ? (
                              <RefreshCw className="w-4 h-4 animate-spin text-[#005BAA] flex-shrink-0" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border border-gray-600 flex-shrink-0" />
                            )}
                            <span>2. Ngân hàng phê duyệt, trừ tiền & cấp mã chuẩn chi VNPAY...</span>
                          </div>

                          <div className={`flex items-center gap-2 ${processingStage >= 3 ? 'text-white' : 'text-gray-500'}`}>
                            {processingStage === 3 ? (
                              <RefreshCw className="w-4 h-4 animate-spin text-emerald-400 flex-shrink-0" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border border-gray-600 flex-shrink-0" />
                            )}
                            <span>3. Gửi gói tin IPN gạch nợ sang hệ thống Tòa nhà Skyline...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ------------------------------------------------------------- */}
                {/* GATEWAY 2: MOMO E-WALLET FLOW                                 */}
                {/* ------------------------------------------------------------- */}
                {selectedGateway === 'MOMO' && (
                  <div className="space-y-3.5 bg-[#161B22] p-4 border border-[#A50064]/50 text-xs">
                    <div className="flex items-center justify-between border-b border-[#222B35] pb-2">
                      <span className="font-bold text-[#D82D8B] uppercase tracking-wider flex items-center gap-1.5">
                        <Smartphone className="w-4 h-4" /> Cổng Thanh Toán Ví Điện Tử MoMo
                      </span>
                      <span className="font-mono text-[#C5A880] font-bold text-sm">
                        {billAmountFormatted} đ
                      </span>
                    </div>

                    {/* MoMo Sub Channels */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setMomoChannel('QR')}
                        className={`px-3 py-1.5 text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                          momoChannel === 'QR' 
                            ? 'bg-[#A50064] text-white' 
                            : 'bg-[#121820] text-gray-400 border border-[#2D3748]'
                        }`}
                      >
                        <QrCode className="w-3.5 h-3.5" /> Quét Mã MoMo QR
                      </button>

                      <button
                        type="button"
                        onClick={() => setMomoChannel('WALLET')}
                        className={`px-3 py-1.5 text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                          momoChannel === 'WALLET' 
                            ? 'bg-[#A50064] text-white' 
                            : 'bg-[#121820] text-gray-400 border border-[#2D3748]'
                        }`}
                      >
                        <Smartphone className="w-3.5 h-3.5" /> Trừ Ví MoMo Trực Tiếp
                      </button>
                    </div>

                    {/* MOMO CHANNEL A: QR PAY */}
                    {momoChannel === 'QR' && (
                      <div className="space-y-3 text-center py-2">
                        <div className="p-3 bg-white border-2 border-[#A50064] inline-block shadow-xl">
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=2|99|${momoPhone}|${encodeURIComponent(residentName)}|skyline@residence.vn|0|0|${currentBill.total_amount}|Thanh%20toan%20hoa%20don%20Can%20${aptCode}|transfer_myqr`} 
                            alt="MoMo QR Code" 
                            className="w-40 h-40 object-contain mx-auto"
                          />
                        </div>

                        <p className="text-[11px] text-gray-300 max-w-sm mx-auto">
                          Mở ứng dụng <strong>Ví MoMo</strong> trên điện thoại, chọn biểu tượng <strong>Quét Mã</strong> để thanh toán tức thì số tiền <strong>{billAmountFormatted} đ</strong>.
                        </p>

                        <button
                          type="button"
                          onClick={() => handlePayMomo('QR')}
                          disabled={isProcessing}
                          className="w-full py-2.5 bg-[#A50064] hover:bg-[#850050] text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-lg"
                        >
                          {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                          {isProcessing ? 'Đang Chờ Xác Thực Từ MoMo...' : 'Xác Nhận Đã Quét Mã Ví MoMo Thành Công'}
                        </button>
                      </div>
                    )}

                    {/* MOMO CHANNEL B: WALLET DEBIT */}
                    {momoChannel === 'WALLET' && (
                      <div className="space-y-3 pt-1">
                        {momoStep === 'PHONE' ? (
                          <div className="space-y-2.5">
                            <div className="space-y-1">
                              <label className="text-[11px] text-gray-400">Số Điện Thoại Đăng Ký Ví MoMo:</label>
                              <input
                                type="text"
                                value={momoPhone}
                                onChange={(e) => setMomoPhone(e.target.value)}
                                placeholder="090x xxx xxx"
                                className="w-full bg-[#121820] border border-[#2D3748] p-2 text-white text-xs font-mono focus:outline-none focus:border-[#A50064]"
                              />
                            </div>

                            <div className="p-3 bg-[#121820] border border-[#2D3748] text-[11px] text-gray-400 space-y-1">
                              <div>Tài khoản ví: <strong className="text-white">{residentName}</strong></div>
                              <div>Hạn mức thanh toán: <span className="text-emerald-400 font-mono">Đủ số dư khả dụng</span></div>
                            </div>

                            <button
                              type="button"
                              onClick={() => setMomoStep('OTP')}
                              className="w-full py-2.5 bg-[#A50064] hover:bg-[#850050] text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 shadow"
                            >
                              Gửi Yêu Cầu Thanh Toán Đến Ví MoMo <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-3 bg-[#121820] p-4 border border-[#2D3748] text-center">
                            <div className="text-xs text-gray-300">
                              Yêu cầu thanh toán đã được gửi đến ứng dụng MoMo ({momoPhone}). Vui lòng nhập mã bảo mật OTP xác nhận:
                            </div>

                            <input
                              type="text"
                              maxLength={6}
                              placeholder="Nhập 6 số (VD: 686868)"
                              value={momoOtp}
                              onChange={(e) => setMomoOtp(e.target.value)}
                              className="w-48 mx-auto bg-[#161B22] border-2 border-[#A50064] p-2.5 text-center text-white text-base font-mono tracking-widest focus:outline-none"
                            />

                            <div className="flex gap-2 justify-center pt-2">
                              <button
                                type="button"
                                onClick={() => setMomoStep('PHONE')}
                                className="px-3 py-1.5 border border-gray-700 text-xs text-gray-400"
                              >
                                Quay Lại
                              </button>

                              <button
                                type="button"
                                onClick={() => handlePayMomo('WALLET')}
                                disabled={isProcessing}
                                className="px-5 py-2 bg-[#A50064] hover:bg-[#850050] text-white text-xs font-bold uppercase tracking-wider transition-colors shadow flex items-center gap-1.5"
                              >
                                {isProcessing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                Xác Nhận Trừ Tiền Ví MoMo
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
