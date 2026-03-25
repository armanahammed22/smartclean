
'use client';

import React, { useEffect, useState } from 'react';
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
import { ArrowLeft, ShoppingCart, Search, ShieldCheck, HardHat, Wrench } from 'lucide-react';
import { useCart } from '@/components/providers/cart-provider';
import { usePathname, useRouter } from 'next/navigation';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';

interface PublicLayoutProps {
  children: React.ReactNode;
  minimalMobile?: boolean;
}

const BOOTSTRAP_ADMIN_UID = '6YTKdslETkVXcftvhSY5x9sjOgT2';
const BOOTSTRAP_ADMIN_EMAIL = 'smartclean422@gmail.com';

export function PublicLayout({ children, minimalMobile = false }: PublicLayoutProps) {
  const db = useFirestore();
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const { itemCount } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'global') : null, [db]);
  const { data: settings } = useDoc(settingsRef);

  const adminRoleRef = useMemoFirebase(() => (db && user) ? doc(db, 'roles_admins', user.uid) : null, [db, user]);
  const { data: adminRole } = useDoc(adminRoleRef);
  const isAdmin = !!adminRole || user?.uid === BOOTSTRAP_ADMIN_UID || user?.email === BOOTSTRAP_ADMIN_EMAIL;

  const staffRoleRef = useMemoFirebase(() => (db && user) ? doc(db, 'roles_employees', user.uid) : null, [db, user]);
  const { data: staffRole } = useDoc(staffRoleRef);
  const isStaff = !!staffRole;

  const isHome = pathname === '/';
  const displayLogo = settings?.logoUrl || PlaceHolderImages.find(img => img.id === 'app-logo')?.imageUrl;
  const companyName = settings?.websiteName || 'Smart Clean';

  useEffect(() => {
    if (settings) {
      document.title = settings.seoTitle || settings.websiteName || "Smart Clean";
    }
  }, [settings]);

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] relative overflow-hidden">
      
      {user && (isAdmin || isStaff) && (
        <div className="fixed top-20 right-4 z-[200] animate-in slide-in-from-right-10">
          {isAdmin ? (
            <Button size="sm" className="rounded-full bg-red-600 shadow-2xl border-none font-black text-[10px] uppercase h-9 px-4 gap-2" asChild>
              <Link href="/admin/dashboard"><ShieldCheck size={14} /> Admin App</Link>
            </Button>
          ) : (
            <Button size="sm" className="rounded-full bg-amber-500 shadow-2xl border-none font-black text-[10px] uppercase h-9 px-4 gap-2" asChild>
              <Link href="/staff/dashboard"><HardHat size={14} /> Staff App</Link>
            </Button>
          )}
        </div>
      )}

      <header className="lg:hidden sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-100 px-4 h-16 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          {!isHome ? (
            <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 bg-gray-50 active:scale-90 transition-transform" onClick={() => router.back()}>
              <ArrowLeft size={20} />
            </Button>
          ) : (
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative h-10 w-10 rounded-xl overflow-hidden border border-gray-100 bg-white shadow-sm">
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
          <Link href="/cart" className="relative p-2.5 h-10 w-10 bg-gray-50 rounded-full flex items-center justify-center active:scale-90 transition-transform shadow-sm border border-gray-100">
            <ShoppingCart size={18} className="text-gray-700" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-white text-[8px] font-black h-5 w-5 flex items-center justify-center rounded-full border border-white shadow-lg animate-in zoom-in">
                {itemCount}
              </span>
            )}
          </Link>
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
