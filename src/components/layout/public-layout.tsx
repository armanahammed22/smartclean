
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
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import { useCart } from '@/components/providers/cart-provider';

interface PublicLayoutProps {
  children: React.ReactNode;
  minimalMobile?: boolean;
}

export function PublicLayout({ children, minimalMobile = false }: PublicLayoutProps) {
  const db = useFirestore();
  const { itemCount } = useCart();
  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'global') : null, [db]);
  const { data: settings } = useDoc(settingsRef);

  // Sync Dynamic Title, Favicon and Meta Tags
  useEffect(() => {
    if (settings) {
      if (settings.seoTitle) {
        document.title = settings.seoTitle;
      } else if (settings.websiteName) {
        document.title = `${settings.websiteName} | Professional Cleaning`;
      } else {
        document.title = "Smart Clean | Professional Cleaning in Bangladesh";
      }

      if (settings.faviconUrl) {
        let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.getElementsByTagName('head')[0].appendChild(link);
        }
        link.href = settings.faviconUrl;
      }

      if (settings.seoDescription) {
        let metaDesc: HTMLMetaElement | null = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
          metaDesc = document.createElement('meta');
          metaDesc.name = 'description';
          document.getElementsByTagName('head')[0].appendChild(metaDesc);
        }
        metaDesc.content = settings.seoDescription;
      }
    }
  }, [settings]);

  return (
    <div className="flex flex-col min-h-screen pb-16 lg:pb-0 relative">
      {/* Standard Navbar (Hidden on mobile if minimalMobile is true) */}
      <div className={cn(minimalMobile ? "hidden lg:block" : "block")}>
        <Navbar />
      </div>

      {/* Minimalist Mobile Header (Only if minimalMobile is true) */}
      {minimalMobile && (
        <header className="lg:hidden sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b px-4 h-16 flex items-center justify-between shadow-sm">
          <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 bg-gray-50" asChild>
            <Link href="/"><ArrowLeft size={20} /></Link>
          </Button>
          <div className="text-center">
            <p className="text-[9px] font-black uppercase text-primary tracking-[0.2em] leading-none mb-1">Smart Clean</p>
            <p className="text-xs font-black text-gray-900 uppercase tracking-tight">View Details</p>
          </div>
          <Link href="/cart" className="relative p-2 h-10 w-10 bg-gray-50 rounded-full flex items-center justify-center">
            <ShoppingCart size={18} className="text-gray-700" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-white text-[8px] font-black h-4 w-4 flex items-center justify-center rounded-full border border-white">
                {itemCount}
              </span>
            )}
          </Link>
        </header>
      )}

      <main className="flex-1">
        {children}
      </main>
      
      <Footer />
      
      {/* Standard Bottom Nav (Hidden on mobile if minimalMobile is true) */}
      <div className={cn(minimalMobile ? "hidden lg:block" : "block")}>
        <BottomNav />
      </div>

      <WhatsAppContact />
      <CheckoutModal />
    </div>
  );
}
