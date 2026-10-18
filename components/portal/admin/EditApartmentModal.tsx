'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/languageContext';
import { 
  X, 
  Building, 
  Check, 
  AlertCircle, 
  Save, 
  Trash2,
  Key
} from 'lucide-react';
import { 
  ApartmentUnit, 
  ApartmentType, 
  ApartmentStatus, 
  updateApartmentUnit, 
  deleteApartmentUnit 
} from '@/lib/apartmentStore';

interface EditApartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  unit: ApartmentUnit | null;
  onSuccess: () => void;
}

export default function EditApartmentModal({
  isOpen,
  onClose,
  unit,
  onSuccess
}: EditApartmentModalProps) {
  const { t } = useLanguage();
  const [area, setArea] = useState<number>(78.5);
  const [wallArea, setWallArea] = useState<number>(83.2);
  const [type, setType] = useState<ApartmentType>('2PN');
  const [bedrooms, setBedrooms] = useState<number>(2);
  const [bathrooms, setBathrooms] = useState<number>(2);
  const [direction, setDirection] = useState('Đông Nam');
  const [mainDoorDirection, setMainDoorDirection] = useState('Tây Bắc');
  const [priceBillion, setPriceBillion] = useState<number>(4.85);
  const [status, setStatus] = useState<ApartmentStatus>('VACANT');
  const [description, setDescription] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (unit) {
      setArea(unit.area);
      setWallArea(unit.wallArea || unit.area * 1.06);
      setType(unit.type);
      setBedrooms(unit.bedrooms || 2);
      setBathrooms(unit.bathrooms || 2);
      setDirection(unit.direction);
      setMainDoorDirection(unit.mainDoorDirection || 'Tây Bắc');
      setPriceBillion(unit.priceBillion);
      setStatus(unit.status);
      setDescription(unit.description || '');
      setIsDeleting(false);
      setError(null);
    }
  }, [unit]);

  if (!isOpen || !unit) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let typeLabel = '2 Phòng Ngủ - 2WC';
    if (type === '1PN') typeLabel = '1 Phòng Ngủ - 1WC';
    if (type === '3PN') typeLabel = '3 Phòng Ngủ - 3WC';
    if (type === 'DUPLEX_PENTHOUSE') typeLabel = 'Duplex Penthouse 5 Sao';

    const patch: Partial<ApartmentUnit> = {
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
      description: description.trim()
    };

    const ok = updateApartmentUnit(unit.code, patch);
    if (!ok) {
      setError('Không thể cập nhật thông tin căn hộ. Vui lòng thử lại.');
      return;
    }

    onSuccess();
    onClose();
  };

  const handleDelete = () => {
    if (unit.status === 'OCCUPIED') {
      setError('Không thể xóa căn hộ đang có cư dân sinh sống. Vui lòng thu hồi căn hộ trước khi xóa.');
      return;
    }

    const ok = deleteApartmentUnit(unit.code);
    if (!ok) {
      setError('Không thể xóa căn hộ.');
      return;
    }

    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-xl bg-[#0D1117] border border-[#C5A880]/80 shadow-2xl p-6 text-white rounded-none space-y-4 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#222B35] pb-3">
          <div>
            <div className="text-[10.5px] uppercase tracking-widest text-[#C5A880] font-mono font-semibold">
              {t('Cập Nhật Thông Tin Không Gian', 'Update Space & Specifications')}
            </div>
            <h3 className="font-serif text-xl font-bold text-white mt-0.5 flex items-center gap-2">
              <span>{t('Chỉnh Sửa Căn Hộ', 'Edit Apartment')} {unit.code}</span>
              <span className="text-xs px-2 py-0.5 bg-[#161B22] border border-[#2D3748] text-gray-300 font-sans">
                {unit.towerName}
              </span>
            </h3>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white p-1" title={t('Đóng', 'Close')}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-950/80 border border-rose-600 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Trạng thái căn hộ */}
          <div>
            <label className="block text-gray-300 font-semibold mb-1">{t('Trạng Thái Căn Hộ', 'Apartment Status')}</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full bg-[#161B22] border border-[#2D3748] px-3 py-2 text-white font-semibold rounded-none focus:outline-none focus:border-[#C5A880]"
            >
              <option value="OCCUPIED">🟢 {t('Đã Có Người Ở (Đang sinh sống)', 'Occupied (Resident living)')}</option>
              <option value="VACANT">🟡 {t('Nhà Trống (Sẵn sàng bàn giao)', 'Vacant (Ready for handover)')}</option>
              <option value="MAINTENANCE">🔵 {t('Đang Sửa Chữa / Nghiệm Thu', 'Under Maintenance / Inspection')}</option>
              <option value="HANDOVER_PENDING">🟣 {t('Chờ Bàn Giao', 'Pending Handover')}</option>
            </select>
          </div>

          {/* Phân loại căn hộ */}
          <div>
            <label className="block text-gray-300 font-semibold mb-1">{t('Loại Căn Hộ', 'Apartment Type')}</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full bg-[#161B22] border border-[#2D3748] px-3 py-2 text-white rounded-none focus:outline-none focus:border-[#C5A880]"
            >
              <option value="1PN">1 {t('Phòng Ngủ - 1WC', 'Bedroom - 1 Bathroom')}</option>
              <option value="2PN">2 {t('Phòng Ngủ - 2WC', 'Bedrooms - 2 Bathrooms')}</option>
              <option value="3PN">3 {t('Phòng Ngủ - 3WC', 'Bedrooms - 3 Bathrooms')}</option>
              <option value="DUPLEX_PENTHOUSE">{t('Căn Lớn Penthouse', '5-Star Duplex Penthouse')}</option>
            </select>
          </div>

          {/* Diện tích & Số phòng */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-gray-300 font-semibold mb-1">{t('Thông Thủy (m²)', 'Net Usable (m²)')}</label>
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
              <label className="block text-gray-300 font-semibold mb-1">{t('Tim Tường (m²)', 'Gross Area (m²)')}</label>
              <input
                type="number"
                step="0.1"
                value={wallArea}
                onChange={(e) => setWallArea(Number(e.target.value))}
                className="w-full bg-[#161B22] border border-[#2D3748] px-3 py-2 text-white font-mono rounded-none focus:outline-none focus:border-[#C5A880]"
              />
            </div>

            <div>
              <label className="block text-gray-300 font-semibold mb-1">{t('Phòng Ngủ', 'Bedrooms')}</label>
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
              <label className="block text-gray-300 font-semibold mb-1">{t('Phòng Tắm', 'Bathrooms')}</label>
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

          {/* Hướng & Giá */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-300 font-semibold mb-1">{t('Hướng Ban Công', 'Balcony Facing')}</label>
              <input
                type="text"
                value={direction}
                onChange={(e) => setDirection(e.target.value)}
                className="w-full bg-[#161B22] border border-[#2D3748] px-3 py-2 text-white rounded-none focus:outline-none focus:border-[#C5A880]"
              />
            </div>

            <div>
              <label className="block text-gray-300 font-semibold mb-1">{t('Định Giá Căn Hộ (Tỷ VNĐ)', 'Valuation (Billion VND)')}</label>
              <input
                type="number"
                step="0.05"
                value={priceBillion}
                onChange={(e) => setPriceBillion(Number(e.target.value))}
                className="w-full bg-[#161B22] border border-[#2D3748] px-3 py-2 text-[#C5A880] font-mono font-bold rounded-none focus:outline-none focus:border-[#C5A880]"
                required
              />
            </div>
          </div>

          {/* Mô tả */}
          <div>
            <label className="block text-gray-300 font-semibold mb-1">{t('Ghi Chú Kỹ Thuật', 'Technical Notes & Description')}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full bg-[#161B22] border border-[#2D3748] px-3 py-2 text-white rounded-none focus:outline-none focus:border-[#C5A880]"
            />
          </div>

          {/* Xóa căn hộ */}
          {isDeleting ? (
            <div className="p-3 bg-rose-950/90 border border-rose-600 text-rose-200 text-xs space-y-2">
              <div>{t('Bạn có chắc chắn muốn xóa vĩnh viễn căn hộ', 'Are you sure you want to permanently delete unit')} <strong>{unit.code}</strong> {t('khỏi hệ thống?', 'from system?')}</div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-3 py-1 bg-rose-600 text-white font-bold uppercase text-[11px]"
                >
                  {t('Xác Nhận Xóa', 'Confirm Delete')}
                </button>
                <button
                  type="button"
                  onClick={() => setIsDeleting(false)}
                  className="px-2.5 py-1 bg-black/50 text-gray-300 border border-gray-600 text-[11px]"
                >
                  {t('Hủy', 'Cancel')}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setIsDeleting(true)}
                className="text-rose-400 hover:text-rose-300 text-xs flex items-center gap-1 font-semibold"
              >
                <Trash2 className="w-3.5 h-3.5" /> {t('Xóa Căn Hộ Này', 'Delete This Unit')}
              </button>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-3 border-t border-[#222B35]">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 bg-[#161B22] hover:bg-[#202936] text-gray-300 hover:text-white border border-[#2D3748] font-semibold transition-colors text-center"
            >
              {t('Hủy', 'Cancel')}
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2.5 bg-[#C5A880] hover:bg-white text-[#0D1117] font-bold uppercase tracking-wider transition-colors shadow flex items-center justify-center gap-1.5"
            >
              <Save className="w-4 h-4" /> {t('Lưu Thay Đổi', 'Save Changes')}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
