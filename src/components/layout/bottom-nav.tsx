
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  ShoppingCart, 
  Sparkles, 
  MessageCircle, 
  User 
} from 'lucide-react';
import { useCart } from '@/components/providers/cart-provider';
import { useSupport } from '@/components/providers/support-provider';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const { itemCount } = useCart();
  const { toggleSupport, isSupportOpen } = useSupport();
  const pathname = usePathname();
  const db = useFirestore();
  const [currentOffer, setCurrentOffer] = useState(0);

  // Fetch dynamic offers for the middle button
  const offersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'offers'), orderBy('order', 'asc'));
  }, [db]);

  const { data: allOffers } = useCollection(offersQuery);
  const offers = useMemo(() => allOffers?.filter(o => o.isActive === true) || [], [allOffers]);

  // Auto-rotate offers every 3 seconds
  useEffect(() => {
    if (offers.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentOffer((prev) => (prev + 1) % offers.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [offers]);

  const NAV_ITEMS = [
    { label: 'হোম', href: '/', icon: Home },
    { label: 'মেসেজ', href: '#', icon: MessageCircle, badge: 0, onClick: (e: any) => { e.preventDefault(); toggleSupport(); } },
    { label: 'অফার', href: '/#offers', isMiddle: true },
    { label: 'কার্ট', href: '/cart', icon: ShoppingCart, badge: itemCount },
    { label: 'একাউন্ট', href: '/account/dashboard', icon: User },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[150] h-[75px] md:max-w-[600px] md:mx-auto md:left-1/2 md:-translate-x-1/2 md:rounded-t-[25px] flex items-center justify-between px-4 pb-safe-offset-0">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-white/95 backdrop-blur-2xl border-t border-black/5 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] md:rounded-t-[25px]" />

      <div className="relative flex w-full items-center justify-between z-10">
        {NAV_ITEMS.map((item, idx) => {
          const isActive = (item.href !== '#' && pathname === item.href) || (item.label === 'মেসেজ' && isSupportOpen);
          const Icon = item.icon;

          if (item.isMiddle) {
            return (
              <div key="middle-offer" className="relative -mt-10 px-2 animate-in slide-in-from-bottom-5 duration-500 delay-150">
                <Link href={offers[currentOffer]?.link || "/#offers"} className="flex flex-col items-center gap-1.5 group">
                  <div className="relative w-[60px] h-[60px] flex items-center justify-center">
                    {/* Glow Effect */}
                    <div className="absolute inset-[-5px] rounded-full opacity-30 blur-xl animate-pulse bg-primary" />
                    
                    {/* Image Container */}
                    <div className="relative w-full h-full rounded-full bg-white border-[3px] border-white shadow-xl overflow-hidden">
                      {offers.length > 0 ? (
                        <div className="relative w-full h-full">
                          {offers.map((offer, i) => (
                            <div
                              key={offer.id}
                              className={cn(
                                "absolute inset-0 transition-transform duration-700 ease-in-out",
                                i === currentOffer ? "translate-y-0" : i < currentOffer ? "-translate-y-full" : "translate-y-full"
                              )}
                            >
                              <Image src={offer.image} alt="Offer" fill className="object-cover" unoptimized />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="w-full h-full bg-primary flex items-center justify-center text-white">
                          <Sparkles size={24} />
                        </div>
                      )}
                    </div>

                    {/* Sparkle Decoration */}
                    <div className="absolute -top-1 -right-1 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full w-6 h-6 flex items-center justify-center text-white shadow-lg animate-spin [animation-duration:4s]">
                      <Sparkles size={14} />
                    </div>

                    {/* Dots Indicator */}
                    {offers.length > 1 && (
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                        {offers.map((_, i) => (
                          <div key={i} className={cn(
                            "h-1 rounded-full transition-all duration-300",
                            i === currentOffer ? "w-3 bg-primary" : "w-1 bg-primary/30"
                          )} />
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest mt-1">অফার</span>
                </Link>
              </div>
            );
          }

          const NavContent = (
            <div className="flex flex-col items-center gap-1">
              <div className={cn(
                "relative w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300",
                isActive ? "bg-primary text-white shadow-lg scale-105" : "text-gray-400 bg-black/5"
              )}>
                {Icon && <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />}
                {item.badge !== undefined && item.badge > 0 && (
                  <div className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-black h-4.5 min-w-4.5 flex items-center justify-center rounded-full border-2 border-white shadow-sm px-1 animate-bounce">
                    {item.badge > 9 ? '9+' : item.badge}
                  </div>
                )}
              </div>
              <span className={cn(
                "text-[9px] font-bold uppercase tracking-tighter transition-colors",
                isActive ? "text-primary" : "text-gray-500"
              )}>
                {item.label}
              </span>
            </div>
          );

          if (item.onClick) {
            return (
              <button 
                key={item.label} 
                onClick={item.onClick} 
                className="flex-1 app-button animate-in slide-in-from-bottom-5 duration-500"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                {NavContent}
              </button>
            );
          }

          return (
            <Link 
              key={item.label} 
              href={item.href} 
              className="flex-1 app-button animate-in slide-in-from-bottom-5 duration-500"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              {NavContent}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
