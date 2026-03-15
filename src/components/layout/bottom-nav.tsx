"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, Home, Package, Wrench, TicketPercent } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export function BottomNav() {
  const { t } = useLanguage();
  const db = useFirestore();

  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'global') : null, [db]);
  const { data: settings } = useDoc(settingsRef);

  const displayLogo = settings?.logoUrl || PlaceHolderImages.find(img => img.id === 'app-logo')?.imageUrl;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#081621] text-white z-[100] border-t border-white/10 h-16 shadow-[0_-4px_10px_rgba(0,0,0,0.3)] safe-area-pb">
      <div className="flex items-center justify-between h-full px-2 relative">
        {/* 1. Services (Prioritized) */}
        <Link href="/services" className="flex flex-col items-center gap-1 flex-1 group transition-all">
          <Wrench size={20} className="text-white group-hover:text-primary transition-colors" />
          <span className="text-[9px] font-black uppercase tracking-tighter">{t('nav_services')}</span>
        </Link>
        
        {/* 2. Products */}
        <Link href="/products" className="flex flex-col items-center gap-1 flex-1 group transition-all">
          <Package size={20} className="text-white group-hover:text-primary transition-colors" />
          <span className="text-[9px] font-black uppercase tracking-tighter">Supplies</span>
        </Link>
        
        {/* 3. Home (Middle) */}
        <div className="flex-1 flex justify-center relative h-full">
          <div className="absolute -top-6">
            <Link 
              href="/" 
              className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-3 rounded-full shadow-[0_8px_20px_rgba(34,99,192,0.5)] border-[6px] border-[#081621] flex items-center justify-center transition-transform hover:scale-110 active:scale-95 overflow-hidden w-16 h-16"
            >
              <div className="relative w-10 h-10">
                {displayLogo ? (
                  <Image 
                    src={displayLogo} 
                    alt="Home" 
                    fill 
                    className="object-contain" 
                  />
                ) : (
                  <Home size={28} className="text-white" />
                )}
              </div>
            </Link>
          </div>
        </div>
        
        {/* 4. Offer */}
        <Link href="/#offers" className="flex flex-col items-center gap-1 flex-1 group transition-all">
          <TicketPercent size={20} className="text-white group-hover:text-primary transition-colors" />
          <span className="text-[9px] font-black uppercase tracking-tighter">{t('nav_offers')}</span>
        </Link>
        
        {/* 5. Menu / Profile */}
        <Link href="/account/dashboard" className="flex flex-col items-center gap-1 flex-1 group transition-all">
          <Menu size={20} className="text-white group-hover:text-primary transition-colors" />
          <span className="text-[9px] font-black uppercase tracking-tighter">Portal</span>
        </Link>
      </div>
    </nav>
  );
}
