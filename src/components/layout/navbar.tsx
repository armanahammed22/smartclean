
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Globe, ShieldCheck, UserCircle, LayoutDashboard, LogOut, ChevronDown } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useUser, useFirestore, useDoc, useMemoFirebase, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const { language, setLanguage, t } = useLanguage();
  const { user } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const [searchQuery, setSearchQuery] = useState('');

  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'global') : null, [db]);
  const { data: settings } = useDoc(settingsRef);

  const adminRef = useMemoFirebase(() => user ? doc(db, 'roles_admins', user.uid) : null, [db, user]);
  const { data: adminRole } = useDoc(adminRef);
  const isAdmin = !!adminRole || user?.uid === 'gcp03WmpjROVvRdpLNsghNU4zHa2';

  const displayLogo = settings?.logoUrl || PlaceHolderImages.find(img => img.id === 'app-logo')?.imageUrl;

  return (
    <header className="w-full z-50 sticky top-0 shadow-sm">
      <div className="bg-[#081621] text-white py-4">
        <div className="container mx-auto px-4 flex items-center justify-between gap-8">
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center">
              {displayLogo ? (
                <Image src={displayLogo} alt="Logo" fill className="object-contain p-1" />
              ) : (
                <span className="text-primary font-bold text-xl">S</span>
              )}
            </div>
            <span className="text-2xl font-bold tracking-tighter font-headline text-white uppercase">
              {settings?.websiteName || 'SMART CLEAN'}
            </span>
          </Link>

          <div className="flex-1 max-xl relative hidden md:block">
            <div className="relative">
              <Input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('search_placeholder')}
                className="w-full bg-white text-black h-11 pr-12 rounded-sm border-none"
              />
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-6">
            <Button 
              variant="ghost" 
              className="text-white hover:text-primary hover:bg-transparent gap-2 px-0"
              onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')}
            >
              <Globe size={20} className="text-primary" />
              <span className="text-xs font-bold">{language === 'bn' ? "English" : "বাংলা"}</span>
            </Button>
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-primary hover:text-white transition-colors font-bold gap-2 p-0 h-auto">
                    <UserCircle size={24} />
                    <span className="text-xs">{t('nav_account')}</span>
                    <ChevronDown size={14} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 mt-2 rounded-xl">
                  <DropdownMenuLabel className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">My Portal</DropdownMenuLabel>
                  <DropdownMenuItem asChild><Link href="/account/dashboard" className="font-bold">{t('personal_dashboard')}</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link href="/account/history" className="font-bold">{t('service_history')}</Link></DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="font-black text-[10px] uppercase tracking-widest text-primary">Management</DropdownMenuLabel>
                      <DropdownMenuItem asChild><Link href="/admin/dashboard" className="font-bold flex items-center gap-2"><LayoutDashboard size={14} /> {t('admin_portal')}</Link></DropdownMenuItem>
                      <DropdownMenuItem asChild><Link href="/admin/orders" className="font-bold">{t('manage_orders')}</Link></DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut(auth)} className="text-destructive font-bold flex items-center gap-2">
                    <LogOut size={14} /> {t('sign_out')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login" className="flex items-center gap-2 hover:text-primary transition-colors">
                <ShieldCheck className="text-primary" size={20} />
                <span className="text-xs font-bold">{t('portal_access')}</span>
              </Link>
            )}
            
            <Button asChild className="bg-primary hover:bg-primary/90 font-bold px-6 h-11 rounded-sm text-primary-foreground relative">
              <Link href="/support">{t('get_inquiry')}</Link>
            </Button>
          </div>
          
          <div className="flex lg:hidden items-center gap-4">
            <Button variant="ghost" size="sm" className="text-white hover:text-primary p-0 h-auto" onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')}>
              <div className="flex flex-col items-center">
                <Globe size={20} className="text-primary" />
                <span className="text-[10px] font-bold mt-0.5">{language === 'bn' ? "EN" : "বাং"}</span>
              </div>
            </Button>
            {user && (
              <Link href="/account/dashboard" className="text-primary">
                <UserCircle size={24} />
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
