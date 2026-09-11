'use client';

import React, { useState } from 'react';
import { 
  X, 
  Building, 
  Check, 
  Plus, 
  AlertCircle, 
  Layers, 
  DollarSign, 
  Compass,
  FileText
} from 'lucide-react';
import { 
  ApartmentUnit, 
  ApartmentType, 
  ApartmentStatus, 
  addApartmentUnit 
} from '@/lib/apartmentStore';

interface AddApartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newUnit: ApartmentUnit) => void;
}

export default function AddApartmentModal({
  isOpen,
  onClose,
  onSuccess
}: AddApartmentModalProps) {
  const [code, setCode] = useState('');
  const [tower, setTower] = useState<'A' | 'B'>('A');
  const [floor, setFloor] = useState<number>(12);
  const [type, setType] = useState<ApartmentType>('2PN');
  const [area, setArea] = useState<number>(78.5);
  const [wallArea, setWallArea] = useState<number>(83.2);
  const [bedrooms, setBedrooms] = useState<number>(2);
  const [bathrooms, setBathrooms] = useState<number>(2);
  const [direction, setDirection] = useState('Đông Nam');
  const [mainDoorDirection, setMainDoorDirection] = useState('Tây Bắc');
  const [priceBillion, setPriceBillion] = useState<number>(4.85);
  const [status, setStatus] = useState<ApartmentStatus>('VACANT');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTypeChange = (selectedType: ApartmentType) => {
    setType(selectedType);
    if (selectedType === '1PN') {
      setArea(52.0);
      setWallArea(56.4);
      setBedrooms(1);
      setBathrooms(1);
      setPriceBillion(3.20);
    } else if (selectedType === '2PN') {
      setArea(78.5);
      setWallArea(83.2);
      setBedrooms(2);
      setBathrooms(2);
      setPriceBillion(4.85);
    } else if (selectedType === '3PN') {
      setArea(112.0);
      setWallArea(119.5);
      setBedrooms(3);
      setBathrooms(3);
      setPriceBillion(7.60);
    } else if (selectedType === 'DUPLEX_PENTHOUSE') {
      setArea(215.0);
      setWallArea(232.0);
      setBedrooms(4);
      setBathrooms(4);
      setPriceBillion(18.50);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setError('Vui lòng nhập mã căn hộ (Ví dụ: 12A06, 18B05, 25PH-03).');
      return;
    }

    let typeLabel = '2 Phòng Ngủ - 2WC';
    if (type === '1PN') typeLabel = '1 Phòng Ngủ - 1WC';
    if (type === '3PN') typeLabel = '3 Phòng Ngủ - 3WC';
    if (type === 'DUPLEX_PENTHOUSE') typeLabel = 'Căn Lớn Penthouse';

    let statusLabel = 'Nhà Trống';
    if (status === 'OCCUPIED') statusLabel = 'Đã Có Người Ở';
    if (status === 'MAINTENANCE') statusLabel = 'Đang Sửa Chữa / Nghiệm Thu';
    if (status === 'HANDOVER_PENDING') statusLabel = 'Chờ Bàn Giao';

    const newUnit: ApartmentUnit = {
      code: cleanCode,
      tower,
      towerName: 'Chung Cư Skyline',
      floor: Number(floor),
      type,
      typeLabel,
      area: Number(area),
      wallArea: Number(wallArea),
      bedrooms: Number(bedrooms),
      bathrooms: Number(bathrooms),
      direction,
      mainDoorDirection,
      priceBillion: Number(priceBillion),
      status,
      statusLabel,
      membersCount: 0,
      vehicles: [],
      billing: {
        monthlyFee: Math.round(Number(area) * 18500),
        parkingFee: 0,
        serviceFee: 0,
        totalAmount: Math.round(Number(area) * 18500),
        status: 'PAID',
        period: 'Tháng 08/2026',
        dueDate: '10/09/2026'
      },
      description: description.trim() || `Căn hộ ${cleanCode} tiêu chuẩn 5 sao tại Skyline Smart Residence.`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const success = addApartmentUnit(newUnit);
    if (!success) {
      setError(`Mã căn hộ "${cleanCode}" đã tồn tại trong hệ thống. Vui lòng kiểm tra lại.`);
      return;
    }

    onSuccess(newUnit);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-2xl bg-[#0D1117] border border-[#C5A880]/80 shadow-2xl p-6 text-white rounded-none space-y-4 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#222B35] pb-3">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#C5A880] font-mono font-semibold flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5" /> Quản Lý Danh Mục Không Gian BQL
            </div>
            <h3 className="font-serif text-xl font-bold text-white mt-1">
              Thêm Căn Hộ Mới Vào Hệ Thống
            </h3>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-950/80 border border-rose-600/80 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Hàng 1: Mã căn, Tòa, Tầng */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-gray-300 font-semibold mb-1">
                Mã Căn Hộ <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="VD: 12A06, 18B05..."
                className="w-full bg-[#161B22] border border-[#2D3748] px-3 py-2 text-white font-mono uppercase rounded-none focus:outline-none focus:border-[#C5A880]"
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 font-semibold mb-1">Tòa Tháp</label>
              <select
                value={tower}
                onChange={(e) => setTower(e.target.value as any)}
                className="w-full bg-[#161B22] border border-[#2D3748] px-3 py-2 text-white rounded-none focus:outline-none focus:border-[#C5A880]"
              >
                <option value="A">Tòa A (Sapphire)</option>
                <option value="B">Tòa B (Diamond)</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-300 font-semibold mb-1">Tầng</label>
              <input
                type="number"
                min="1"
                max="25"
                value={floor}
                onChange={(e) => setFloor(Number(e.target.value))}
                className="w-full bg-[#161B22] border border-[#2D3748] px-3 py-2 text-white font-mono rounded-none focus:outline-none focus:border-[#C5A880]"
                required
              />
            </div>
          </div>

          {/* Hàng 2: Loại căn hộ */}
          <div>
            <label className="block text-gray-300 font-semibold mb-1">Loại Hình Căn Hộ</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: '1PN', label: '1PN - 1WC' },
                { id: '2PN', label: '2PN - 2WC' },
                { id: '3PN', label: '3PN - 3WC' },
                { id: 'DUPLEX_PENTHOUSE', label: 'Duplex Penthouse' }
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleTypeChange(t.id as any)}
                  className={`py-2 px-2 text-center font-semibold border transition-all ${
                    type === t.id
                      ? 'bg-[#C5A880] text-[#0D1117] border-[#C5A880] font-bold shadow'
                      : 'bg-[#161B22] text-gray-300 border-[#2D3748] hover:border-gray-500'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Hàng 3: Diện tích & Số phòng */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-gray-300 font-semibold mb-1">Diện Tích Thông Thủy (m²)</label>
              <input
                type="number"
                step="0.1"
                value={area}
                onChange={(e) => setArea(Number(e.target.value))}
                className="w-full bg-[#161B22] border border-[#2D3748] px-3 py-2 text-white font-mono rounded-none focus:outline-none focus:border-[#C5A880]"
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 font-semibold mb-1">Diện Tích Tim Tường (m²)</label>
              <input
                type="number"
                step="0.1"
                value={wallArea}
                onChange={(e) => setWallArea(Number(e.target.value))}
                className="w-full bg-[#161B22] border border-[#2D3748] px-3 py-2 text-white font-mono rounded-none focus:outline-none focus:border-[#C5A880]"
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 font-semibold mb-1">Phòng Ngủ</label>
              <input
                type="number"
                min="1"
                max="6"
                value={bedrooms}
                onChange={(e) => setBedrooms(Number(e.target.value))}
                className="w-full bg-[#161B22] border border-[#2D3748] px-3 py-2 text-white font-mono rounded-none focus:outline-none focus:border-[#C5A880]"
              />
            </div>

            <div>
              <label className="block text-gray-300 font-semibold mb-1">Phòng Vệ Sinh</label>
              <input
                type="number"
                min="1"
                max="6"
                value={bathrooms}
                onChange={(e) => setBathrooms(Number(e.target.value))}
                className="w-full bg-[#161B22] border border-[#2D3748] px-3 py-2 text-white font-mono rounded-none focus:outline-none focus:border-[#C5A880]"
              />
            </div>
          </div>

          {/* Hàng 4: Hướng & Định giá */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-gray-300 font-semibold mb-1">Hướng Ban Công</label>
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value)}
                className="w-full bg-[#161B22] border border-[#2D3748] px-3 py-2 text-white rounded-none focus:outline-none focus:border-[#C5A880]"
              >
                <option value="Đông Nam">Đông Nam (Mát mẻ view sông)</option>
                <option value="Đông Bắc">Đông Bắc (Đón gió sớm)</option>
                <option value="Tây Nam">Tây Nam (Ấm áp, view thành phố)</option>
                <option value="Tây Bắc">Tây Bắc (View nội khu)</option>
                <option value="Chính Nam">Chính Nam</option>
                <option value="Chính Bắc">Chính Bắc</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-300 font-semibold mb-1">Định Giá Bán (Tỷ VNĐ)</label>
              <input
                type="number"
                step="0.05"
                value={priceBillion}
                onChange={(e) => setPriceBillion(Number(e.target.value))}
                className="w-full bg-[#161B22] border border-[#2D3748] px-3 py-2 text-[#C5A880] font-mono font-bold rounded-none focus:outline-none focus:border-[#C5A880]"
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 font-semibold mb-1">Trạng Thái Khởi Tạo</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-[#161B22] border border-[#2D3748] px-3 py-2 text-white rounded-none focus:outline-none focus:border-[#C5A880]"
              >
                <option value="VACANT">Căn Hộ Trống (Sẵn sàng bàn giao)</option>
                <option value="MAINTENANCE">Đang Bảo Trì / Hoàn Thiện Nội Thất</option>
                <option value="HANDOVER_PENDING">Chờ Bàn Giao Cho Cư Dân</option>
              </select>
            </div>
          </div>

          {/* Mô tả */}
          <div>
            <label className="block text-gray-300 font-semibold mb-1">Ghi Chú Kỹ Thuật / Mô Tả</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Mô tả tầm view, gói thiết bị bàn giao hoặc ghi chú riêng của BQL..."
              className="w-full bg-[#161B22] border border-[#2D3748] px-3 py-2 text-white rounded-none focus:outline-none focus:border-[#C5A880]"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#222B35]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#161B22] hover:bg-[#202936] text-gray-300 hover:text-white border border-[#2D3748] font-semibold transition-colors"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] font-bold uppercase tracking-wider transition-colors shadow flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Lưu Căn Hộ Mới
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
