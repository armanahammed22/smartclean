'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Navbar } from './navbar';
import { Footer } from './footer';
import { BottomNav } from './bottom-nav';
import { WhatsAppContact } from './whatsapp-contact';
import { CheckoutModal } from '@/components/checkout/checkout-modal';
import { useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, ShoppingCart, Search, ChevronRight } from 'lucide-react';
import { useCart } from '@/components/providers/cart-provider';
import { usePathname, useRouter } from 'next/navigation';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';

interface PublicLayoutProps {
  children: React.ReactNode;
  minimalMobile?: boolean;
}

export function PublicLayout({ children, minimalMobile = false }: PublicLayoutProps) {
  const db = useFirestore();
  const pathname = usePathname();
  const router = useRouter();
  const { itemCount } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'global') : null, [db]);
  const { data: settings } = useDoc(settingsRef);

  const isHome = pathname === '/';
  const displayLogo = settings?.logoUrl || PlaceHolderImages.find(img => img.id === 'app-logo')?.imageUrl;
  const companyName = settings?.websiteName || 'Smart Clean';

  useEffect(() => {
    if (settings) {
      document.title = settings.seoTitle || settings.websiteName || "Smart Clean";
    }
  }, [settings]);

  // Generate breadcrumb items from path
  const breadcrumbs = useMemo(() => {
    const parts = pathname.split('/').filter(Boolean);
    return parts.map((part, i) => ({
      name: part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' '),
      href: '/' + parts.slice(0, i + 1).join('/')
    }));
  }, [pathname]);

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] relative overflow-hidden">
      <link rel="canonical" href={`https://smartclean.com.bd${pathname}`} />
      
      <header className="lg:hidden sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-100 px-4 h-16 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          {!isHome ? (
            <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 bg-gray-50 active:scale-90 transition-transform" onClick={() => router.back()}>
              <ArrowLeft size={20} />
            </Button>
          ) : (
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative h-12 w-12 rounded-xl overflow-hidden border border-gray-100 bg-white shadow-sm">
                {displayLogo ? (
                  <Image src={displayLogo} alt="Logo" fill className="object-contain" unoptimized />
                ) : (
                  <div className="w-full h-full bg-primary rounded-lg flex items-center justify-center text-white font-black text-xs">S</div>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-black text-[#081621] uppercase tracking-tight leading-none truncate max-w-[120px]">{companyName}</span>
                <span className="text-[7px] font-bold text-primary uppercase tracking-widest leading-none mt-0.5">Professional</span>
              </div>
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10 text-gray-500 active:scale-90 transition-transform rounded-full"
            onClick={() => router.push('/services')}
          >
            <Search size={20} />
          </Button>
          {/* Cart Icon removed from mobile header as requested */}
        </div>
      </header>

      <div className="hidden lg:block">
        <Navbar />
      </div>

      <main className={cn(
        "flex-1 overflow-y-auto custom-scrollbar h-full",
        !isHome && !minimalMobile && "pb-24 lg:pb-0"
      )}>
        <div className={cn(
          "mx-auto",
          isHome ? "max-w-none" : "max-w-7xl px-0 md:px-4"
        )}>
          {/* Internal Breadcrumbs for SEO and Navigation */}
          {!isHome && !minimalMobile && breadcrumbs.length > 0 && (
            <nav className="container mx-auto px-4 py-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
              <Link href="/" className="hover:text-primary transition-colors">Home</Link>
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={crumb.href}>
                  <ChevronRight size={10} className="shrink-0" />
                  <Link 
                    href={crumb.href} 
                    className={cn(
                      "hover:text-primary transition-colors truncate max-w-[150px]",
                      idx === breadcrumbs.length - 1 && "text-primary"
                    )}
                  >
                    {crumb.name}
                  </Link>
                </React.Fragment>
              ))}
            </nav>
          )}
          {children}
        </div>
        
        <div className="hidden lg:block">
          <Footer />
        </div>
      </main>
      
      {mounted && !minimalMobile && (
        <div className="lg:hidden">
          <BottomNav />
        </div>
      )}

      <WhatsAppContact />
      <CheckoutModal />
    </div>
  );
}
