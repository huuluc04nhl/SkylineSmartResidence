'use client';

import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  Car, 
  Package, 
  Volume2, 
  ShieldCheck, 
  Flame, 
  PhoneCall, 
  Waves, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  ExternalLink, 
  ChevronRight, 
  Bot, 
  Zap, 
  Droplets, 
  HelpCircle,
  Sparkles,
  Info,
  Building
} from 'lucide-react';
import { User as UserType } from '@/lib/dataStore';

interface ResidentHandbookProps {
  currentUser: UserType;
  onNavigate?: (moduleId: string) => void;
}

interface HandbookSection {
  id: string;
  title: string;
  badge: string;
  icon: any;
  color: string;
  shortDesc: string;
  keyPoints: string[];
  fullContent: {
    heading: string;
    details: string[];
    importantNotice?: string;
    actionLabel?: string;
    actionModule?: string;
  }[];
}

const HANDBOOK_SECTIONS: HandbookSection[] = [
  {
    id: 'parking',
    title: 'Đăng Ký & Gửi Xe Hầm B1/B2',
    badge: 'Hầm B1 • BS-07',
    icon: Car,
    color: '#0284C7',
    shortDesc: 'Quy trình cấp thẻ từ, biểu phí xe máy & ô tô, nhận diện biển số tự động AI tại ram dốc chung cư BS-07.',
    keyPoints: [
      'Xe máy: 120.000 đ/tháng (Tối đa 2 xe/căn hộ)',
      'Ô tô: 1.250.000 đ/tháng (Cần đăng ký lốt đỗ hầm B1/B2)',
      'Camera AI quét biển số tự động mở barie không cần dừng xe'
    ],
    fullContent: [
      {
        heading: 'Biểu Phí Gửi Xe Định Kỳ',
        details: [
          'Xe máy: 120.000 VNĐ / xe / tháng (Định mức tối đa: 02 xe máy cho căn 1PN - 2PN).',
          'Xe ô tô: 1.250.000 VNĐ / xe / tháng (Định mức tối đa: 01 lốt đỗ cho căn hộ).',
          'Xe đạp / Xe điện cư dân: Miễn phí định kỳ có gắn chip quản lý.'
        ],
        importantNotice: 'Cư dân xuất trình Căn cước công dân và Cà-vẹt xe chính chủ tại Văn phòng BQL tầng 1 chung cư BS-07 để kích hoạt chip từ và camera AI biển số xe.'
      },
      {
        heading: 'Quy Chuẩn An Toàn & Đỗ Xe Hầm B1 - B2',
        details: [
          'Tốc độ lưu thông tối đa trong tầng hầm: 10 km/h. Bắt buộc bật đèn chiếu gần.',
          'Nghiêm cấm sạc xe điện qua đêm bằng ổ cắm thông thường; chỉ sử dụng khu vực Trụ Sạc Xe Điện Thông Minh chuyên dụng tại Hầm B1.',
          'Đỗ xe đúng vạch sơn kẻ số phòng hoặc ô đánh dấu quy định; không chắn ram dốc và lối thoát hiểm PCCC.'
        ],
        actionLabel: 'Xem Hóa Đơn & Phí Gửi Xe',
        actionModule: 'resident-finance'
      }
    ]
  },
  {
    id: 'moving',
    title: 'Chuyển Đồ & Thang Hàng PCCC',
    badge: 'Thang PCCC Tải 1350kg',
    icon: Package,
    color: '#EAB308',
    shortDesc: 'Khung giờ cho phép chuyển đồ nặng cồng kềnh, quy định bọc lót chống trầy và thủ tục đặt lịch thang máy hàng.',
    keyPoints: [
      'Khung giờ: 8:30 - 11:30 & 13:30 - 16:30 (T2 đến T7)',
      'Sử dụng thang máy hàng PCCC chuyên dụng chung cư BS-07',
      'Đăng ký với Đội An Ninh / BQL trước tối thiểu 02 tiếng'
    ],
    fullContent: [
      {
        heading: 'Khung Giờ Cho Phép Vận Chuyển Hàng Nặng',
        details: [
          'Buổi sáng: 08:30 - 11:30 (Tránh giờ cao điểm cư dân đi làm).',
          'Buổi chiều: 13:30 - 16:30 (Tránh giờ cao điểm tan tầm).',
          'Chủ Nhật và Ngày Lễ: Tuyệt đối không vận chuyển hàng cồng kềnh, nội thất lớn để bảo đảm không gian yên tĩnh cho cư dân chung cư.'
        ],
        importantNotice: 'Bắt buộc sử dụng thang máy hàng PCCC có gắn vách gỗ bảo vệ; nghiêm cấm sử dụng 3 thang máy chở khách thông thường để vận chuyển đồ nặng/nội thất cồng kềnh.'
      },
      {
        heading: 'Quy Trình Đăng Ký Vận Chuyển',
        details: [
          'Bước 1: Báo trước với Lễ tân sảnh chung cư BS-07 hoặc qua hotline BQL 1900 8899 ít nhất 2 giờ trước khi xe tải đến.',
          'Bước 2: Xe tải bốc dỡ tại ram dốc giao hàng Hầm B1 (chiều cao tĩnh không tối đa 2.2m).',
          'Bước 3: Đơn vị vận chuyển trải thảm bọc lót hành lang từ cửa thang máy đến cửa căn hộ.'
        ]
      }
    ]
  },
  {
    id: 'noise',
    title: 'Tiếng Ồn & Giờ Khoan Đục Thi Công',
    badge: 'Nghiêm Ngặt 100%',
    icon: Volume2,
    color: '#EF4444',
    shortDesc: 'Quy định giờ yên tĩnh sinh hoạt, lịch thi công khoan đục sửa chữa và chế tài xử lý vi phạm tiếng ồn chung cư.',
    keyPoints: [
      'Giờ yên tĩnh: 22:00 đêm đến 06:00 sáng hôm sau',
      'Chỉ được khoan đục: Thứ 2 đến Thứ 6 (8:00 - 11:30 & 13:30 - 17:00)',
      'CẤM TUYỆT ĐỐI khoan đục vào Thứ 7, Chủ Nhật & Nghỉ trưa (12:00 - 13:30)'
    ],
    fullContent: [
      {
        heading: 'Khung Giờ Cấm Khoan Đục & Gây Tiếng Động Mạnh',
        details: [
          'Buổi trưa (12:00 - 13:30): Khung giờ nghỉ trưa của người già và trẻ nhỏ, nghiêm cấm mọi tiếng ồn lớn.',
          'Buổi tối & Đêm (sau 17:00 đến 08:00 sáng): Tuyệt đối không thực hiện khoan cắt, đục phá tường.',
          'Thứ 7, Chủ Nhật & Các ngày Lễ Tết: CẤM TUYỆT ĐỐI mọi hoạt động khoan tường, gõ búa, cắt gạch thi công.'
        ],
        importantNotice: 'Mọi hoạt động sửa chữa, cải tạo nội thất căn hộ cần nộp bản vẽ thi công và ký quỹ an toàn kỹ thuật với Ban Quản Lý trước khi tiến hành.'
      },
      {
        heading: 'Nội Quy Tiếng Ồn Sinh Hoạt & Âm Thanh',
        details: [
          'Âm thanh TV, dàn loa nghe nhạc, karaoke tại gia phải giữ ở mức vừa phải, dưới 55 dB sau 21:00.',
          'Sau 22:00 đêm, cư dân đóng cửa ban công khi có tiệc sinh hoạt gia đình để tránh ảnh hưởng đến các căn hộ lân cận tầng 30 chung cư BS-07.'
        ]
      }
    ]
  },
  {
    id: 'pets',
    title: 'Quy Chế Nuôi Thú Cưng',
    badge: 'Chó • Mèo Có Kiểm Soát',
    icon: ShieldCheck,
    color: '#10B981',
    shortDesc: 'Quy chuẩn đăng ký thú nuôi với BQL, bắt buộc xích và rọ mõm nơi công cộng, di chuyển bằng thang hàng PCCC.',
    keyPoints: [
      'Bắt buộc đăng ký thú cưng với BQL và tiêm phòng dại định kỳ',
      'Phải có dây dắt và rọ mõm khi ra khỏi cửa căn hộ',
      'Chỉ di chuyển bằng thang máy hàng PCCC, không đi thang khách'
    ],
    fullContent: [
      {
        heading: 'Quy Định Vận Chuyển & Dắt Thú Cưng',
        details: [
          'Thú cưng khi ra khỏi căn hộ bắt buộc phải có dây xích ngắn và rọ mõm bảo hộ an toàn.',
          'Chỉ sử dụng thang máy hàng PCCC chuyên dụng (Thang số 04) chung cư BS-07 để di chuyển cùng thú cưng.',
          'Nghiêm cấm để thú cưng chạy tự do tại hành lang tầng 30, sảnh Grand Lobby và khu vực hồ bơi resort.'
        ],
        importantNotice: 'Chủ nuôi có trách nhiệm mang theo túi vệ sinh và dọn dẹp ngay lập tức nếu thú cưng phóng uế tại các đường dạo bộ công viên nội khu The Tropical.'
      },
      {
        heading: 'Giới Hạn & Trách Nhiệm Chủ Hộ',
        details: [
          'Mỗi căn hộ được phép nuôi tối đa 02 thú cưng (chó/mèo) có trọng lượng dưới 15kg/con.',
          'Không nuôi các giống chó săn, chó chiến đấu hung dữ (Pitbull, Doberman, Rottweiler...).',
          'Nếu thú cưng gây tiếng sủa liên tục ảnh hưởng giấc ngủ của hàng xóm, BQL sẽ gửi biên bản nhắc nhở lần 1 và áp dụng chế tài theo Nội quy chung cư.'
        ]
      }
    ]
  },
  {
    id: 'safety',
    title: 'Kỹ Thuật An Toàn & PCCC Căn Hộ',
    badge: 'Căn CH-06 • Tầng 30',
    icon: Flame,
    color: '#F97316',
    shortDesc: 'Vị trí tủ điện Aptomat tổng, van khóa nước sạch hành lang, kịch bản ứng phó khi có chuông báo cháy tòa nhà.',
    keyPoints: [
      'Tủ Aptomat RCBO chống giật: Phía sau tủ giày âm tường sảnh vào',
      'Van cấp nước sạch tổng: Trong hộp kỹ thuật hành lang tầng 30',
      'Khi chuông báo cháy reo: Dùng thang bộ thoát hiểm, TUYỆT ĐỐI KHÔNG DÙNG THANG MÁY'
    ],
    fullContent: [
      {
        heading: 'Vị Trí Kỹ Thuật Điện Nước Căn Hộ',
        details: [
          'Tủ Aptomat Tổng (RCBO): Nằm ở sảnh đón cửa căn hộ CH-06. Được trang bị thiết bị đóng cắt tự động chống giật, chống sét lan truyền.',
          'Van Khóa Nước Sạch Căn Hộ: Đặt trong hộp gen kỹ thuật bên ngoài hành lang tầng 30 (cạnh cửa chính căn CH-06). Khóa van theo chiều kim đồng hồ khi đi vắng dài ngày.',
          'Cảm biến rò rỉ nước AI: Kết nối với van điện từ thông minh, tự động ngắt nguồn cấp nước trong 3 giây khi phát hiện tràn nước.'
        ],
        importantNotice: 'Nếu gặp sự cố chập điện hoặc rò rỉ nước khẩn cấp, bấm gọi Kỹ sư trực tầng 30 qua số 028 7300 9988 để được hỗ trợ trong 5 - 10 phút.'
      },
      {
        heading: 'Kịch Bản Thoát Hiểm PCCC Khi Báo Động',
        details: [
          'Bước 1: Giữ bình tĩnh, tắt Aptomat điện và đóng kín cửa căn hộ (không khóa chốt) để ngăn khói lan tỏa.',
          'Bước 2: Dùng khăn ướt che mũi miệng, cúi thấp người men theo đèn chỉ dẫn EXIT hành lang.',
          'Bước 3: Mở cửa thang bộ thoát hiểm có điều áp khói (buồng thang ngăn lửa 120 phút).',
          'QUY TẮC SỐNG CÒN: TUYỆT ĐỐI KHÔNG SỬ DỤNG THANG MÁY KHI CÓ CHUÔNG BÁO CHÁY.'
        ],
        actionLabel: 'Báo Hỏng & Hỗ Trợ Kỹ Thuật',
        actionModule: 'resident-tickets'
      }
    ]
  },
  {
    id: 'facilities',
    title: 'Nội Quy Tiện Ích & Hồ Bơi Resort',
    badge: '22+ Tiện Ích Nội Khu',
    icon: Waves,
    color: '#06B6D4',
    shortDesc: 'Giờ mở cửa Hồ bơi nhiệt đới resort, phòng Gym công nghệ, Nhà hàng tầng 1 chung cư BS-07 và vườn nướng BBQ.',
    keyPoints: [
      'Hồ bơi nhiệt đới resort: Mở cửa 6:00 - 21:00 hàng ngày (Nhận diện FaceID)',
      'Nhà hàng tầng 1 chung cư BS-07: Phục vụ 6:30 - 22:00 (Ưu đãi 15% cư dân)',
      'Phòng Gym & Yoga: 6:00 - 22:00 (Miễn phí cư dân)'
    ],
    fullContent: [
      {
        heading: 'Khung Giờ & Điều Kiện Sử Dụng Hồ Bơi Resort',
        details: [
          'Thời gian mở cửa: 06:00 - 11:30 và 14:00 - 21:00 hàng ngày (nghỉ trưa để nhân viên bảo trì lọc nước).',
          'Vào cửa: Tự động nhận diện khuôn mặt FaceID cư dân tại cổng soát vé thông minh.',
          'Trang phục: Bắt buộc mặc đồ bơi chuyên dụng; trẻ em dưới 12 tuổi phải có người lớn giám sát.',
          'Nghiêm cấm mang đồ ăn, thức uống có cồn, chai thủy tinh vào khu vực hồ bơi.'
        ]
      },
      {
        heading: 'Nhà Hàng Tầng 1 & Vườn Nướng BBQ Nội Khu',
        details: [
          'Nhà hàng ẩm thực tầng 1 chung cư BS-07: Mở cửa 06:30 - 22:00, nhận đặt món tận căn hộ miễn phí giao hàng.',
          'Vườn nướng BBQ The Tropical: Cần đặt trước qua App Cư Dân ít nhất 06 tiếng để BQL chuẩn bị bàn nướng và công tác vệ sinh.',
          'Phòng Gym & Yoga công nghệ: Trang bị máy Technogym, mở cửa tự do cho cư dân đã e-KYC.'
        ],
        actionLabel: 'Đặt Lịch Tiện Ích Ngay',
        actionModule: 'resident-facilities'
      }
    ]
  }
];

export default function ResidentHandbook({ currentUser, onNavigate }: ResidentHandbookProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('noise');
  
  // Trợ lý AI Hỏi Nhanh Nội Quy
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const selectedSection = HANDBOOK_SECTIONS.find(s => s.id === selectedSectionId) || HANDBOOK_SECTIONS[0];

  // Lọc theo từ khóa tìm kiếm
  const filteredSections = HANDBOOK_SECTIONS.filter(s => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      s.shortDesc.toLowerCase().includes(q) ||
      s.keyPoints.some(p => p.toLowerCase().includes(q))
    );
  });

  // Xử lý gửi câu hỏi cho AI Concierge
  const handleAskAi = async (questionText?: string) => {
    const q = questionText || aiQuestion;
    if (!q.trim() || isAiLoading) return;

    setIsAiLoading(true);
    setAiAnswer(null);

    try {
      const res = await fetch('/api/ai/concierge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Cư dân hỏi về nội quy hoặc sổ tay chung cư: "${q}". Hãy giải đáp ngắn gọn, chuẩn xác, văn phong lễ tân 5 sao, dựa trên quy chế chung cư The Tropical (4 chung cư BS-07, BS-08, BS-09, BS-10) và căn hộ ${currentUser.apartment_code || 'CH-06'} tầng 30. Nêu rõ khung giờ hoặc điều cấm cụ thể nếu có.`,
          aptCode: currentUser.apartment_code || 'CH-06',
          userName: currentUser.full_name || (currentUser as any)?.fullname || 'Cư Dân'
        })
      });
      const data = await res.json();
      if (data.reply) {
        setAiAnswer(data.reply);
      } else {
        setAiAnswer('Dạ hiện tại hệ thống kết nối AI đang bận. Quý cư dân có thể tra cứu nhanh các thẻ bên dưới hoặc gọi hotline Ban Quản Lý 1900 8899 ạ!');
      }
    } catch (e) {
      setAiAnswer('Dạ hiện tại hệ thống kết nối AI đang bận. Quý cư dân có thể tra cứu nhanh các thẻ bên dưới hoặc gọi hotline Ban Quản Lý 1900 8899 ạ!');
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="space-y-6 w-full animate-fadeIn select-none">
      {/* 1. APP HEADER: Sổ Tay Cư Dân Số */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-[#161F2C] via-[#121820] to-[#0D1117] border border-[#C5A880]/70 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xl">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-bold flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" /> Sổ Tay Cư Dân Điện Tử • 4 Chung Cư The Tropical
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl text-white font-bold mt-1 tracking-wide">
            Cẩm Nang & Nội Quy Chung Cư
          </h2>
          <p className="text-xs text-gray-300 mt-1.5 flex items-center gap-2 font-mono">
            <span>Căn hộ: CH-06</span>
            <span className="text-gray-500">•</span>
            <span className="text-[#C5A880]">Chung cư BS-07 (Tầng 30)</span>
            <span className="text-gray-500">•</span>
            <span className="text-emerald-400">Hiệu lực BQL 2026 ✓</span>
          </p>
        </div>

        {/* Nút Gọi Hotline BQL 1-Chạm */}
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="tel:19008899"
            className="px-3.5 py-2 bg-[#0D1117] hover:bg-[#1C2533] border border-[#C5A880]/60 text-[#C5A880] text-xs font-bold font-mono transition-all flex items-center gap-2 shadow"
            title="Gọi ngay tổng đài Ban Quản Lý"
          >
            <PhoneCall className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>BQL: 1900 8899</span>
          </a>
          <a
            href="tel:02873009988"
            className="px-3.5 py-2 bg-[#0D1117] hover:bg-[#1C2533] border border-sky-500/40 text-sky-400 text-xs font-bold font-mono transition-all flex items-center gap-2 shadow"
            title="Gọi kỹ sư trực tầng 30 chung cư BS-07"
          >
            <Zap className="w-3.5 h-3.5 text-sky-400" />
            <span>Kỹ Thuật: 028 7300 9988</span>
          </a>
        </div>
      </div>

      {/* 2. INSTANT SEARCH BAR: Tìm kiếm nhanh quy chế kiểu App */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <Search className="w-4 h-4 text-[#C5A880]" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm nhanh nội quy hoặc thủ tục (ví dụ: 'khoan đục', 'thú cưng', 'gửi xe', 'chuyển đồ', 'van nước')..."
          className="w-full pl-10 pr-4 py-3 bg-[#121820] border border-[#2A374A] focus:border-[#C5A880] text-white text-xs sm:text-sm placeholder-gray-500 focus:outline-none transition-colors shadow-inner"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-gray-400 hover:text-white"
          >
            Xóa tìm kiếm
          </button>
        )}
      </div>

      {/* 3. APP GRID: 6 KHỐI THẺ CHUYÊN ĐỀ 1-CHẠM (Cards Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredSections.map((sec) => {
          const IconComp = sec.icon;
          const isSelected = sec.id === selectedSectionId;

          return (
            <div
              key={sec.id}
              onClick={() => setSelectedSectionId(sec.id)}
              className={`p-4 border cursor-pointer transition-all flex flex-col justify-between gap-3 text-left relative overflow-hidden ${
                isSelected
                  ? 'bg-gradient-to-br from-[#1C2533] to-[#121820] border-[#C5A880] ring-1 ring-[#C5A880] shadow-xl'
                  : 'bg-[#121820] border-[#222B35] hover:border-gray-500 hover:bg-[#161D26]'
              }`}
            >
              {/* Highlight ribbon khi đang chọn */}
              {isSelected && (
                <div className="absolute top-0 right-0 w-12 h-12 overflow-hidden pointer-events-none">
                  <div className="bg-[#C5A880] text-[#0D1117] text-[8px] font-bold py-0.5 text-center transform rotate-45 translate-x-3 translate-y-2 uppercase shadow">
                    Xem
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div 
                    className="w-9 h-9 flex items-center justify-center border border-[#2D3A4B] bg-[#0D1117] shadow-sm"
                    style={{ color: sec.color }}
                  >
                    <IconComp className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-[#0D1117] border border-[#222B35] text-gray-300">
                    {sec.badge}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-white text-sm group-hover:text-[#C5A880] transition-colors">
                    {sec.title}
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                    {sec.shortDesc}
                  </p>
                </div>
              </div>

              {/* 3 gạch đầu dòng then chốt (Thumb preview) */}
              <div className="pt-2 border-t border-[#1C2533] space-y-1">
                {sec.keyPoints.slice(0, 2).map((pt, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 text-[10.5px] text-gray-300">
                    <CheckCircle2 className="w-3 h-3 text-[#C5A880] shrink-0 mt-0.5" />
                    <span className="truncate">{pt}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. DRAWER / DETAIL VIEW: CHI TIẾT ĐIỀU KHOẢN CỦA THẺ ĐANG CHỌN */}
      {selectedSection && (
        <div className="p-5 sm:p-6 bg-[#121820] border border-[#2A374A] shadow-2xl space-y-5 animate-fadeIn">
          {/* Header Chi Tiết */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222B35] pb-4">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 flex items-center justify-center border border-[#2D3A4B] bg-[#0D1117]"
                style={{ color: selectedSection.color }}
              >
                {React.createElement(selectedSection.icon, { className: 'w-5 h-5' })}
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#C5A880] font-mono font-bold">
                  Quy định chi tiết • {selectedSection.badge}
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  {selectedSection.title}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-[10.5px] text-emerald-400 font-mono flex items-center gap-1 bg-emerald-950/60 border border-emerald-500/40 px-2.5 py-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> BQL Duyệt Ban Hành
              </span>
            </div>
          </div>

          {/* Các mục quy định con */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedSection.fullContent.map((item, idx) => (
              <div key={idx} className="p-4 bg-[#0D1117] border border-[#222B35] space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-[#C5A880]" />
                    {item.heading}
                  </h4>

                  <ul className="text-xs text-gray-300 space-y-2 font-light leading-relaxed pl-1">
                    {item.details.map((line, lIdx) => (
                      <li key={lIdx} className="flex items-start gap-2">
                        <span className="text-[#C5A880] font-bold">•</span>
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>

                  {item.importantNotice && (
                    <div className="p-2.5 bg-red-950/40 border border-red-500/40 text-red-200 text-[11px] leading-relaxed flex items-start gap-2 mt-2">
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <span>{item.importantNotice}</span>
                    </div>
                  )}
                </div>

                {item.actionLabel && onNavigate && (
                  <button
                    type="button"
                    onClick={() => item.actionModule && onNavigate(item.actionModule)}
                    className="mt-3 w-full py-2 bg-[#1C2533] hover:bg-[#C5A880] hover:text-[#0D1117] border border-[#C5A880]/50 text-[#C5A880] text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow"
                  >
                    <span>{item.actionLabel}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. BOX TRỢ LÝ AI: HỎI NHANH NỘI QUY CĂN HỘ 1-CHẠM */}
      <div className="p-5 bg-gradient-to-r from-[#121E2A] via-[#101720] to-[#0D1117] border border-[#C5A880]/80 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#222B35] pb-3">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-[#C5A880]" />
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Trợ Lý AI Skyline Concierge • Giải Đáp Nội Quy & Sổ Tay Cư Dân
              </h3>
              <p className="text-[11px] text-gray-400">
                Gõ câu hỏi bất kỳ, Trợ lý AI sẽ trích dẫn điều khoản chính xác theo quy chuẩn chung cư The Tropical.
              </p>
            </div>
          </div>
        </div>

        {/* Các câu hỏi gợi ý nhanh 1-chạm */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] text-gray-400 font-mono">Gợi ý câu hỏi:</span>
          {[
            'Hôm nay thứ 7 có được khoan tường không?',
            'Biểu phí gửi xe ô tô hầm B1 chung cư BS-07?',
            'Thú cưng đi thang máy nào?',
            'Vị trí van khóa nước căn CH-06 ở đâu?'
          ].map((promptText, pIdx) => (
            <button
              key={pIdx}
              type="button"
              onClick={() => {
                setAiQuestion(promptText);
                handleAskAi(promptText);
              }}
              className="text-[10.5px] px-2.5 py-1 bg-[#0D1117] hover:bg-[#1C2533] border border-[#2D3A4B] text-gray-300 hover:text-[#C5A880] transition-colors"
            >
              💬 {promptText}
            </button>
          ))}
        </div>

        {/* Input box */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={aiQuestion}
            onChange={(e) => setAiQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAskAi()}
            placeholder="Hỏi bất kỳ quy định nào của chung cư (ví dụ: 'Giờ mở cửa hồ bơi', 'Quy định phơi đồ ban công')..."
            className="flex-1 px-3.5 py-2.5 bg-[#0D1117] border border-[#2A374A] focus:border-[#C5A880] text-white text-xs placeholder-gray-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => handleAskAi()}
            disabled={isAiLoading || !aiQuestion.trim()}
            className="px-4 py-2.5 bg-[#C5A880] hover:bg-[#d8bc94] text-[#0D1117] text-xs font-bold transition-all disabled:opacity-50 shrink-0 flex items-center gap-1.5 shadow"
          >
            {isAiLoading ? (
              <>
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>Đang tra cứu...</span>
              </>
            ) : (
              <>
                <Bot className="w-3.5 h-3.5" />
                <span>Hỏi AI</span>
              </>
            )}
          </button>
        </div>

        {/* AI Answer Box */}
        {aiAnswer && (
          <div className="p-4 bg-[#0A0E14] border border-[#C5A880]/60 text-xs text-gray-200 leading-relaxed space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between text-[10px] font-mono text-[#C5A880]">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#C5A880]" /> Trả lời chính thức từ AI Concierge:
              </span>
              <button
                type="button"
                onClick={() => setAiAnswer(null)}
                className="text-gray-400 hover:text-white"
              >
                Đóng
              </button>
            </div>
            <p className="whitespace-pre-line font-light">{aiAnswer}</p>
          </div>
        )}
      </div>
    </div>
  );
}
