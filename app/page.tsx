'use client';

import React, { useState } from 'react';
import HeaderNav from '@/components/landing/HeaderNav';
import HeroSection from '@/components/landing/HeroSection';
import AboutConcept from '@/components/landing/AboutConcept';
import FloorPlanExplorer from '@/components/landing/FloorPlanExplorer';
import AmenitiesSection from '@/components/landing/AmenitiesSection';
import SmartTechSection from '@/components/landing/SmartTechSection';
import Footer from '@/components/landing/Footer';
import LoginModal from '@/components/landing/LoginModal';
import { UserRole } from '@/lib/dataStore';

export default function HomePage() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const handleOpenLogin = () => {
    setIsLoginOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col justify-between">
      {/* Navigation */}
      <HeaderNav onOpenLogin={handleOpenLogin} />

      {/* Main Content */}
      <main>
        {/* 1. Hero Showcase */}
        <HeroSection onOpenLogin={handleOpenLogin} />

        {/* 2. Architecture & Concept */}
        <AboutConcept />

        {/* 3. Interactive Floor Plan & Units */}
        <FloorPlanExplorer />

        {/* 4. Luxury Amenities */}
        <AmenitiesSection />

        {/* 5. Smart AI Core & Specifications */}
        <SmartTechSection />
      </main>

      {/* Footer */}
      <Footer />

      {/* Login & Role Switcher Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
      />
    </div>
  );
}
