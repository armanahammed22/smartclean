
'use client';

import React, { useEffect, useState, useMemo } from 'react';
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
import { ArrowLeft, Search, ChevronRight } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/components/providers/language-provider';

interface PublicLayoutProps {
  children: React.ReactNode;
  minimalMobile?: boolean;
}

export function PublicLayout({ children, minimalMobile = false }: PublicLayoutProps) {
  const db = useFirestore();
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [pathname]);

  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'global') : null, [db]);
  const { data: settings } = useDoc(settingsRef);

  const layoutRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'layout') : null, [db]);
  const { data: layout } = useDoc(layoutRef);

  const isHome = pathname === '/';
  const displayLogo = settings?.logoUrl || PlaceHolderImages.find(img => img.id === 'app-logo')?.imageUrl;
  const servicesEnabled = settings?.servicesEnabled !== false;

  useEffect(() => {
    if (settings) {
      document.title = settings.seoTitle || settings.websiteName || "Smart Clean";
    }
  }, [settings]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/services?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const breadcrumbs = useMemo(() => {
    const parts = pathname.split('/').filter(Boolean);
    return parts.map((part, i) => ({
      name: part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' '),
      href: '/' + parts.slice(0, i + 1).join('/')
    }));
  }, [pathname]);

  const DEFAULT_CUSTOM_REQ_ICON = 'https://picsum.photos/seed/clean-bucket/100/100';
  const customReqIcon = layout?.header?.customRequestIconUrl || DEFAULT_CUSTOM_REQ_ICON;
  const mobileTitle = layout?.header?.customRequestMobileTitle;

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] relative">
      <link rel="canonical" href={`https://smartclean.com.bd${pathname}`} />
      
      {/* MOBILE HEADER */}
      <header className="lg:hidden sticky top-0 z-[160] bg-white/95 backdrop-blur-xl border-b border-gray-100 px-4 h-16 flex items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center shrink-0">
          {!isHome ? (
            <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 bg-gray-50 active:scale-90 transition-transform" onClick={() => router.back()}>
              <ArrowLeft size={20} />
            </Button>
          ) : (
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative h-10 w-10 rounded-lg overflow-hidden border border-gray-100 bg-white shadow-sm">
                {displayLogo ? (
                  <Image src={displayLogo} alt="Logo" fill className="object-contain" unoptimized />
                ) : (
                  <div className="w-full h-full bg-primary rounded-lg flex items-center justify-center text-white font-black text-xs">S</div>
                )}
              </div>
            </Link>
          )}
        </div>

        <div className="flex-1 max-sm">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" size={16} strokeWidth={3} />
            <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('search_placeholder')}
              className="h-10 pl-10 pr-4 bg-gray-100 border-none rounded-full text-xs font-bold focus:bg-white shadow-inner"
            />
          </form>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {servicesEnabled && (
            <Button 
              variant="ghost" 
              className={cn(
                "h-10 active:scale-90 transition-transform rounded-full border border-gray-100 gap-2 shadow-sm",
                mobileTitle ? "px-4 w-auto" : "w-10 px-0",
                layout?.header?.customRequestMobileFontSize || "text-[10px]"
              )}
              style={{ 
                backgroundColor: layout?.header?.customRequestMobileBg || '#f1f5f9',
                color: layout?.header?.customRequestMobileTextColor || '#1E5F7A'
              }}
              onClick={() => router.push('/account/custom-requests')}
            >
              <div className="relative w-5 h-5 shrink-0">
                <Image src={customReqIcon} alt="Icon" fill className="object-contain" unoptimized />
              </div>
              {mobileTitle && <span className="font-black uppercase whitespace-nowrap">{mobileTitle}</span>}
            </Button>
          )}
        </div>
      </header>

      {/* DESKTOP HEADER - Sticky logic handled inside Navbar */}
      <Navbar />

      {/* MAIN CONTENT */}
      <main className={cn(
        "flex-1 w-full",
        !isHome && !minimalMobile && "pb-24 lg:pb-0"
      )}>
        <div className={cn(
          "mx-auto",
          isHome ? "max-w-none" : "max-w-7xl px-0 md:px-4"
        )}>
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
