"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, Home, Package, Wrench, TicketPercent } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const { t } = useLanguage();
  const db = useFirestore();

  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'global') : null, [db]);
  const { data: settings } = useDoc(settingsRef);

  const displayLogo = settings?.logoUrl || PlaceHolderImages.find(img => img.id === 'app-logo')?.imageUrl;

  const NAV_LINK_CLASS = "flex flex-col items-center justify-center gap-1 flex-1 group transition-all h-full pt-1";
  const ICON_SIZE = 22;
  const LABEL_CLASS = "text-[8px] font-bold uppercase tracking-wider transition-colors";

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#081621] text-white z-[100] border-t border-white/10 h-16 shadow-[0_-4px_15px_rgba(0,0,0,0.4)] safe-area-pb">
      <div className="flex items-center justify-between h-full px-1 relative">
        {/* 1. Services */}
        <Link href="/services" className={NAV_LINK_CLASS}>
          <Wrench size={ICON_SIZE} className="text-white/60 group-hover:text-primary transition-colors" />
          <span className={cn(LABEL_CLASS, "text-white/40 group-hover:text-primary")}>{t('nav_services')}</span>
        </Link>
        
        {/* 2. Products */}
        <Link href="/products" className={NAV_LINK_CLASS}>
          <Package size={ICON_SIZE} className="text-white/60 group-hover:text-primary transition-colors" />
          <span className={cn(LABEL_CLASS, "text-white/40 group-hover:text-primary")}>Supplies</span>
        </Link>
        
        {/* 3. Home (Prominent Center) */}
        <div className="flex-1 flex justify-center relative h-full">
          <div className="absolute -top-5">
            <Link 
              href="/" 
              className="bg-primary p-1.5 rounded-full shadow-[0_10px_25px_rgba(34,99,192,0.4)] border-[5px] border-[#081621] flex items-center justify-center transition-transform hover:scale-110 active:scale-90 overflow-hidden w-14 h-14"
            >
              <div className="relative w-full h-full">
                {displayLogo ? (
                  <Image 
                    src={displayLogo} 
                    alt="Home" 
                    fill 
                    className="object-contain p-1" 
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full">
                    <Home size={24} className="text-white" />
                  </div>
                )}
              </div>
            </Link>
          </div>
        </div>
        
        {/* 4. Offer */}
        <Link href="/#offers" className={NAV_LINK_CLASS}>
          <TicketPercent size={ICON_SIZE} className="text-white/60 group-hover:text-primary transition-colors" />
          <span className={cn(LABEL_CLASS, "text-white/40 group-hover:text-primary")}>{t('nav_offers')}</span>
        </Link>
        
        {/* 5. Portal */}
        <Link href="/account/dashboard" className={NAV_LINK_CLASS}>
          <Menu size={ICON_SIZE} className="text-white/60 group-hover:text-primary transition-colors" />
          <span className={cn(LABEL_CLASS, "text-white/40 group-hover:text-primary")}>Portal</span>
        </Link>
      </div>
    </nav>
  );
}
