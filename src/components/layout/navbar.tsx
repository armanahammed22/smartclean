
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Search, 
  Wrench, 
  ShoppingCart,
  ChevronDown
} from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { Input } from '@/components/ui/input';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { useCart } from '@/components/providers/cart-provider';
import { doc } from 'firebase/firestore';
import { NavbarOfferSlider } from './navbar-offer-slider';

export function Navbar() {
  const { setLanguage, language, t } = useLanguage();
  const { itemCount } = useCart();
  const db = useFirestore();
  const [searchQuery, setSearchQuery] = useState('');

  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'global') : null, [db]);
  const { data: settings } = useDoc(settingsRef);

  const displayLogo = settings?.logoUrl || PlaceHolderImages.find(img => img.id === 'app-logo')?.imageUrl;
  const logoLink = settings?.logoLink || '/';

  return (
    <header className="w-full z-50 sticky top-0 bg-white shadow-sm">
      {/* Top Utility Bar */}
      <div className="hidden lg:block bg-gray-50 border-b py-1">
        <div className="container mx-auto px-4 flex justify-end gap-6">
          <Link href="/page/about-us" className="text-[10px] font-bold text-gray-500 hover:text-primary uppercase tracking-wider">About Us</Link>
          <Link href="/support" className="text-[10px] font-bold text-gray-500 hover:text-primary uppercase tracking-wider">Support</Link>
          <button onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')} className="text-[10px] font-black text-primary uppercase tracking-widest">
            {language === 'bn' ? "English" : "বাংলা"}
          </button>
        </div>
      </div>

      {/* Main Header */}
      <div className="bg-white py-2 md:py-4 px-3 md:px-4">
        <div className="container mx-auto flex items-center gap-2 md:gap-8">
          
          <Link href={logoLink} className="flex items-center shrink-0">
            <div className="relative h-8 md:h-12 w-auto min-w-[100px] md:min-w-[160px] flex items-center justify-start overflow-hidden">
              {displayLogo ? (
                <Image 
                  src={displayLogo} 
                  alt="Logo" 
                  fill
                  className="object-contain object-left" 
                  priority 
                  unoptimized
                />
              ) : (
                <div className="bg-primary p-1.5 rounded-lg">
                  <span className="text-white font-black text-sm md:text-lg">S</span>
                </div>
              )}
            </div>
          </Link>

          <div className="hidden sm:block">
            <NavbarOfferSlider />
          </div>

          <div className="flex-1 relative">
            <div className="relative group max-w-2xl">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10 flex items-center gap-2">
                <Wrench size={16} className="text-primary/60" />
                <div className="w-px h-4 bg-gray-200" />
              </div>
              <Input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('search_placeholder')}
                className="w-full bg-gray-100 border-none h-10 md:h-12 pl-12 pr-12 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all font-medium placeholder:text-gray-400 text-xs md:text-sm shadow-inner"
              />
              <button className="absolute right-0 top-0 h-full w-10 md:w-14 bg-primary flex items-center justify-center rounded-r-xl text-white hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
                <Search size={18} className="md:w-5 md:h-5" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1 md:gap-6 shrink-0">
            <Link href="/cart" className="relative p-2.5 text-gray-600 hover:text-primary transition-all group bg-gray-50 rounded-full hover:bg-primary/5 active:scale-90 border border-gray-100 shadow-sm">
              <ShoppingCart size={22} />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-[8px] font-black h-5 w-5 flex items-center justify-center rounded-full shadow-lg border-2 border-white animate-in zoom-in">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
