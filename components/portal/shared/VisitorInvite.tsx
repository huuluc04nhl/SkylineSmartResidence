'use client';

import React from 'react';
import VisitorQrModal from '@/components/portal/resident/VisitorQrModal';

interface VisitorInviteProps {
  isOpen: boolean;
  onClose: () => void;
  aptCode?: string;
}

export default function VisitorInvite({ isOpen, onClose, aptCode = '12A05' }: VisitorInviteProps) {
  return (
    <VisitorQrModal
      isOpen={isOpen}
      onClose={onClose}
      apartmentCode={aptCode}
    />
  );
}
