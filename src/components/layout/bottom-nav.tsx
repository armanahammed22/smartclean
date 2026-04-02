
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
  User,
  Layers,
  Heart,
  Search,
  Package,
  Wrench,
  Grid,
  Zap,
  LayoutGrid
} from 'lucide-react';
import { useCart } from '@/components/providers/cart-provider';
import { useSupport } from '@/components/providers/support-provider';
import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { cn } from '@/lib/utils';

const ICONS: Record<string, any> = {
  Home,
  ShoppingCart,
  Sparkles,
  MessageCircle,
  User,
  Layers,
  Heart,
  Search,
  Package,
  Wrench,
  Grid,
  Zap,
  LayoutGrid
};

export function BottomNav() {
  const { itemCount } = useCart();
  const { toggleSupport, isSupportOpen } = useSupport();
  const pathname = usePathname();
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);
  const [currentOffer, setCurrentOffer] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Fetch Circular Offers
  const offersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'offers'), orderBy('order', 'asc'));
  }, [db]);
  const { data: allOffers } = useCollection(offersQuery);
  const offers = useMemo(() => allOffers?.filter(o => o.isActive === true) || [], [allOffers]);

  // 2. Fetch Navbar Configuration
  const configRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'bottom_nav') : null, [db]);
  const { data: config } = useDoc(configRef);

  // 3. Global Feature Check (for fallback logic)
  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'global') : null, [db]);
  const { data: settings } = useDoc(settingsRef);
  const productsEnabled = settings?.productsEnabled !== false;

  useEffect(() => {
    if (offers.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentOffer((prev) => (prev + 1) % offers.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [offers]);

  // 4. Generate Navigation Items
  const NAV_ITEMS = useMemo(() => {
    if (config?.links && config.links.length > 0) {
      return config.links.map((link: any) => ({
        ...link,
        icon: ICONS[link.icon] || Grid,
        badge: link.icon === 'ShoppingCart' ? itemCount : 0,
        onClick: link.icon === 'MessageCircle' ? (e: any) => { e.preventDefault(); toggleSupport(); } : undefined
      }));
    }

    // Default Fallback
    const base = [
      { label: 'হোম', href: '/', icon: Home },
      { label: 'প্যাকেজ', href: '/services', icon: Layers, hidden: productsEnabled },
      { label: 'মেসেজ', href: '#', icon: MessageCircle, onClick: (e: any) => { e.preventDefault(); toggleSupport(); } },
      { label: 'কার্ট', href: '/cart', icon: ShoppingCart, badge: itemCount },
      { label: 'একাউন্ট', href: '/account/dashboard', icon: User },
    ];
    return base.filter(i => !i.hidden);
  }, [config, productsEnabled, itemCount, toggleSupport]);

  if (!mounted) return null;

  const showOffer = config?.showOfferCircle !== false;
  const bgColor = config?.bgColor || '#ffffff';
  const activeColor = config?.activeColor || '#1E5F7A';
  const inactiveColor = config?.inactiveColor || '#9ca3af';

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-[150] h-[70px] md:h-[80px] w-full flex items-center px-2 pb-safe shadow-[0_-15px_50px_rgba(0,0,0,0.15)] bg-white/95 backdrop-blur-3xl border-t border-gray-100"
      style={{ backgroundColor: `${bgColor}f2` }} // slight transparency
    >
      <div className="relative flex w-full max-w-5xl mx-auto items-center z-10 px-1">
        {NAV_ITEMS.map((item: any, idx: number) => {
          const isActive = (item.href !== '#' && pathname === item.href) || (item.label === 'মেসেজ' && isSupportOpen);
          const Icon = item.icon;

          // Standard Nav Button
          const NavButton = (
            <div className="flex flex-col items-center gap-1 transition-all duration-300">
              <div 
                className={cn(
                  "relative w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-xl transition-all duration-500",
                  isActive ? "shadow-xl scale-110 -translate-y-1" : "bg-gray-50/50"
                )}
                style={{ 
                  color: isActive ? '#fff' : inactiveColor,
                  backgroundColor: isActive ? activeColor : 'rgba(0,0,0,0.03)'
                }}
              >
                <Icon size={isActive ? 20 : 18} strokeWidth={isActive ? 2.5 : 2} />
                {item.badge > 0 && (
                  <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[7px] font-black h-4 min-w-[16px] flex items-center justify-center rounded-full border border-white shadow-md px-1 animate-bounce">
                    {item.badge}
                  </div>
                )}
              </div>
              <span 
                className={cn("text-[8px] md:text-[10px] font-bold uppercase tracking-tight transition-all duration-300")}
                style={{ color: isActive ? activeColor : inactiveColor, fontWeight: isActive ? 900 : 700 }}
              >
                {item.label}
              </span>
            </div>
          );

          return (
            <React.Fragment key={idx}>
              {/* Insert Offer Circle in the middle */}
              {showOffer && idx === Math.floor(NAV_ITEMS.length / 2) && (
                <div className="relative -mt-10 md:-mt-12 px-1 group animate-in slide-in-from-bottom-4 duration-700">
                  <Link href={offers[currentOffer]?.link || "/#offers"} className="flex flex-col items-center gap-1">
                    <div className="relative w-14 h-14 md:w-16 md:h-16 flex items-center justify-center">
                      <div className="absolute inset-[-4px] rounded-full opacity-30 blur-xl animate-pulse bg-primary" />
                      <div className="relative w-full h-full rounded-full bg-white border-[3px] border-white shadow-2xl overflow-hidden transition-transform duration-300 group-hover:scale-110">
                        {offers.length > 0 ? (
                          <div className="relative w-full h-full">
                            {offers.map((offer, i) => (
                              <div
                                key={offer.id}
                                className={cn(
                                  "absolute inset-0 transition-transform duration-700",
                                  i === currentOffer ? "translate-y-0" : i < currentOffer ? "-translate-y-full" : "translate-y-full"
                                )}
                              >
                                <Image src={offer.image} alt="Offer" fill className="object-cover" unoptimized />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white">
                            <Sparkles size={24} />
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-[8px] md:text-[10px] font-black text-primary uppercase tracking-[0.1em] drop-shadow-sm">অফার</span>
                  </Link>
                </div>
              )}

              {item.onClick ? (
                <button onClick={item.onClick} className="flex-1 flex justify-center py-1 outline-none">
                  {NavButton}
                </button>
              ) : (
                <Link href={item.href || '#'} className="flex-1 flex justify-center py-1 outline-none">
                  {NavButton}
                </Link>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </nav>
  );
}
