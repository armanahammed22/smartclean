'use client';

import React, { useEffect } from 'react';
import { Navbar } from './navbar';
import { Footer } from './footer';
import { BottomNav } from './bottom-nav';
import { WhatsAppContact } from './whatsapp-contact';
import { CheckoutModal } from '@/components/checkout/checkout-modal';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, ShoppingCart, Search } from 'lucide-react';
import { useCart } from '@/components/providers/cart-provider';
import { usePathname, useRouter } from 'next/navigation';

interface PublicLayoutProps {
  children: React.ReactNode;
  minimalMobile?: boolean;
}

export function PublicLayout({ children, minimalMobile = false }: PublicLayoutProps) {
  const db = useFirestore();
  const pathname = usePathname();
  const router = useRouter();
  const { itemCount } = useCart();
  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'global') : null, [db]);
  const { data: settings } = useDoc(settingsRef);

  const isHome = pathname === '/';

  useEffect(() => {
    if (settings) {
      document.title = settings.seoTitle || settings.websiteName || "Smart Clean";
    }
  }, [settings]);

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] relative">
      
      {/* 📱 TOP APP BAR (MOBILE ONLY) */}
      <header className="lg:hidden sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {!isHome ? (
            <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 bg-gray-50 active:scale-90 transition-transform" onClick={() => router.back()}>
              <ArrowLeft size={18} />
            </Button>
          ) : (
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-black text-xs">S</div>
          )}
          <div>
            <h1 className="text-xs font-black text-gray-900 uppercase tracking-tight">
              {isHome ? (settings?.websiteName || 'Smart Clean') : 'Details'}
            </h1>
            {isHome && <p className="text-[8px] font-bold text-primary uppercase tracking-widest leading-none">Bangladesh</p>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isHome && (
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-gray-50">
              <Search size={18} className="text-gray-500" />
            </Button>
          )}
          <Link href="/cart" className="relative p-2 h-9 w-9 bg-gray-50 rounded-full flex items-center justify-center active:scale-90 transition-transform">
            <ShoppingCart size={18} className="text-gray-700" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-white text-[8px] font-black h-4 w-4 flex items-center justify-center rounded-full border border-white">
                {itemCount}
              </span>
            )}
          </Link>
        </div>
      </header>

      {/* 💻 DESKTOP NAVBAR */}
      <div className="hidden lg:block">
        <Navbar />
      </div>

      <main className={cn(
        "flex-1 overflow-y-auto custom-scrollbar",
        !isHome && "pb-24 lg:pb-0"
      )}>
        <div className={cn(
          "mx-auto",
          isHome ? "max-w-none" : "max-w-7xl px-0 md:px-4"
        )}>
          {children}
        </div>
        
        <div className="hidden lg:block">
          <Footer />
        </div>
      </main>
      
      {/* 📱 BOTTOM NAVIGATION (Hidden on minimal pages like details/checkout) */}
      {!minimalMobile && <BottomNav />}

      <WhatsAppContact />
      <CheckoutModal />
    </div>
  );
}
