'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { RefreshCw } from 'lucide-react';

/**
 * Route /admin automatically redirects to the unified portal.
 * All logins are consolidated into a single unified entry point.
 */
export default function AdminRedirectPage() {
  const router = useRouter();
  const { currentUser, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (currentUser?.role === 'ADMIN' || currentUser?.role === 'TECHNICIAN') {
        router.replace('/portal?tab=admin-dashboard');
      } else {
        router.replace('/portal');
      }
    }
  }, [currentUser, isLoading, router]);

  return (
    <div className="min-h-screen bg-[#070A0E] text-white flex items-center justify-center p-4 font-sans">
      <div className="text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-[#C5A880] animate-spin mx-auto" />
        <p className="text-xs text-gray-400 font-mono">Đang chuyển tiếp đến trung tâm điều hành...</p>
      </div>
    </div>
  );
}
