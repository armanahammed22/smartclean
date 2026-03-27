
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  ShoppingCart, 
  TicketPercent, 
  MessageCircle, 
  User 
} from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { useCart } from '@/components/providers/cart-provider';
import { useSupport } from '@/components/providers/support-provider';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { cn } from '@/lib/utils';

/**
 * Animated Logo/Offer Slider for Bottom Nav
 */
function LogoSlider() {
  const db = useFirestore();
  const [currentIndex, setCurrentIndex] = useState(0);

  const offersQuery = useMemoFirebase(() => {
    if (!db) return null;
    // Removed 'where' to avoid missing index errors, filtering in memory instead
    return query(
      collection(db, 'offers'),
      orderBy('order', 'asc')
    );
  }, [db]);

  const { data: allOffers } = useCollection(offersQuery);

  // Filter active offers in memory
  const offers = useMemo(() => {
    return allOffers?.filter(o => o.isActive === true) || [];
  }, [allOffers]);

  useEffect(() => {
    if (!offers || offers.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % offers.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [offers]);

  if (!offers || offers.length === 0) {
    return (
      <div className="bg-primary p-3 rounded-full shadow-xl shadow-primary/30">
        <TicketPercent size={26} className="text-white" />
      </div>
    );
  }

  const current = offers[currentIndex];

  return (
    <div className="relative w-14 h-14 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-white animate-in zoom-in-90 duration-500">
      <Link href={current.link || '/#offers'} className="block w-full h-full relative">
        <Image 
          key={current.id}
          src={current.image} 
          alt="Offer" 
          fill 
          className="object-cover transition-all duration-700" 
          unoptimized
        />
      </Link>
    </div>
  );
}

export function BottomNav() {
  const { itemCount } = useCart();
  const { toggleSupport, isSupportOpen } = useSupport();
  const pathname = usePathname();

  const NAV_ITEMS = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Message', href: '#', icon: MessageCircle, onClick: (e: any) => { e.preventDefault(); toggleSupport(); } },
    { label: 'OFFER', href: '/#offers', icon: TicketPercent, isMiddle: true },
    { label: 'Cart', href: '/cart', icon: ShoppingCart, badge: itemCount },
    { label: 'Account', href: '/account/dashboard', icon: User },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-2xl z-[150] border-t border-gray-100 h-[calc(4.5rem+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_40px_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-around h-16 px-2 relative">
        {NAV_ITEMS.map((item) => {
          const isActive = (item.href !== '#' && pathname === item.href) || (item.label === 'Message' && isSupportOpen);
          const Icon = item.icon;
          
          if (item.isMiddle) {
            return (
              <div key={item.label} className="relative -translate-y-4">
                <LogoSlider />
                <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[8px] font-black text-primary uppercase tracking-widest whitespace-nowrap">Special Offer</span>
              </div>
            );
          }

          const Content = (
            <>
              <div className="relative">
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} className={cn(isActive && "scale-110 transition-transform")} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-primary text-white text-[9px] font-black h-4 w-4 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[9px] font-black uppercase tracking-tighter mt-1">
                {item.label}
              </span>
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-b-full shadow-[0_2px_10px_rgba(30,95,122,0.3)]" />
              )}
            </>
          );

          if (item.onClick) {
            return (
              <button
                key={item.label}
                onClick={item.onClick}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-all duration-300 relative app-button",
                  isActive ? "text-primary" : "text-gray-400"
                )}
              >
                {Content}
              </button>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-all duration-300 relative app-button",
                isActive ? "text-primary" : "text-gray-400"
              )}
            >
              {Content}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
