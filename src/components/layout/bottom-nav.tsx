
"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, LayoutGrid, Zap, ShoppingCart, Home } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { useCart } from '@/components/providers/cart-provider';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export function BottomNav() {
  const { t } = useLanguage();
  const { itemCount, setCheckoutOpen } = useCart();
  const LOGO_IMAGE = PlaceHolderImages.find(img => img.id === 'app-logo');
  const HOME_IMAGE = PlaceHolderImages.find(img => img.id === 'nav-home');

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#081621] text-white z-[100] border-t border-white/10 h-16">
      <div className="flex items-center justify-between h-full px-4 relative">
        {/* Home Button - Admin can change the image/logo via PlaceHolderImages */}
        <Link href="/" className="flex flex-col items-center gap-1 flex-1">
          <div className="relative w-5 h-5 flex items-center justify-center">
            {HOME_IMAGE ? (
              <Image 
                src={HOME_IMAGE.imageUrl} 
                alt="Home" 
                fill 
                className="object-contain opacity-80" 
              />
            ) : (
              <Home size={22} className="text-white/80" />
            )}
          </div>
          <span className="text-[10px] font-medium">{t('nav_home')}</span>
        </Link>
        
        <Link href="#" className="flex flex-col items-center gap-1 flex-1">
          <LayoutGrid size={22} className="text-white/80" />
          <span className="text-[10px] font-medium">{t('nav_categories')}</span>
        </Link>
        
        <div className="flex-1 flex justify-center">
          <Link href="/" className="absolute -top-6 bg-[#EF4A23] p-3 rounded-full shadow-lg border-4 border-[#081621]">
            <div className="relative w-8 h-8">
              {LOGO_IMAGE ? (
                <Image src={LOGO_IMAGE.imageUrl} alt="Logo" fill className="object-contain" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-white">S</div>
              )}
            </div>
          </Link>
        </div>
        
        <button onClick={() => setCheckoutOpen(true)} className="flex flex-col items-center gap-1 flex-1 relative">
          <ShoppingCart size={22} className="text-white/80" />
          <span className="text-[10px] font-medium">{t('nav_booking')}({itemCount})</span>
        </button>
        
        <Link href="#" className="flex flex-col items-center gap-1 flex-1">
          <Menu size={22} className="text-white/80" />
          <span className="text-[10px] font-medium">{t('nav_menu')}</span>
        </Link>
      </div>
    </nav>
  );
}
