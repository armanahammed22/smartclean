
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Globe, ShieldCheck, UserCircle, LayoutDashboard, LogOut, ChevronDown, CalendarCheck, HardHat } from 'lucide-react';
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

  const staffRef = useMemoFirebase(() => user ? doc(db, 'roles_employees', user.uid) : null, [db, user]);
  const { data: staffRole } = useDoc(staffRef);
  const isStaff = !!staffRole;

  const displayLogo = settings?.logoUrl || PlaceHolderImages.find(img => img.id === 'app-logo')?.imageUrl;
  const logoLink = settings?.logoLink || '/';

  return (
    <header className="w-full z-50 sticky top-0 shadow-sm border-b border-white/10">
      <div className="bg-[#081621] text-white py-4">
        <div className="container mx-auto px-4 flex items-center justify-between gap-8">
          <Link href={logoLink} className="flex items-center gap-3 shrink-0">
            <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-white/10 flex items-center justify-center border border-white/5">
              {displayLogo ? (
                <Image src={displayLogo} alt="Logo" fill className="object-contain p-1.5" />
              ) : (
                <span className="text-primary font-black text-xl">S</span>
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tighter font-headline text-white uppercase leading-none">
                {settings?.websiteName || 'SMART CLEAN'}
              </span>
              <span className="text-[8px] font-black text-primary uppercase tracking-[0.2em] mt-1">Expert Solutions</span>
            </div>
          </Link>

          <div className="flex-1 max-w-md relative hidden md:block">
            <div className="relative group">
              <Input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('search_placeholder')}
                className="w-full bg-white/5 hover:bg-white/10 focus:bg-white text-white focus:text-black h-11 pr-12 rounded-xl border border-white/10 focus:border-primary transition-all font-medium"
              />
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-primary transition-colors" size={18} />
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-8">
            <nav className="flex items-center gap-6">
              <Link href="/services" className="text-xs font-black uppercase tracking-widest text-white/70 hover:text-primary transition-colors">Services</Link>
              <Link href="/products" className="text-xs font-black uppercase tracking-widest text-white/70 hover:text-primary transition-colors">Supply Store</Link>
            </nav>

            <Button 
              variant="ghost" 
              className="text-white hover:text-primary hover:bg-transparent gap-2 px-0 h-auto rounded-xl"
              onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')}
            >
              <Globe size={18} className="text-primary" />
              <span className="text-xs font-black uppercase tracking-tight">{language === 'bn' ? "English" : "বাংলা"}</span>
            </Button>
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-primary hover:text-white transition-colors font-black gap-2 p-0 h-auto uppercase text-xs tracking-tighter rounded-xl">
                    <UserCircle size={24} />
                    <span>{t('nav_account')}</span>
                    <ChevronDown size={14} className="opacity-40" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 mt-2 rounded-[1.5rem] p-2 border-none shadow-2xl">
                  <DropdownMenuLabel className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground px-4 py-3">Personal Portal</DropdownMenuLabel>
                  <DropdownMenuItem asChild><Link href="/account/dashboard" className="font-bold rounded-xl">{t('personal_dashboard')}</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link href="/account/history" className="font-bold rounded-xl">{t('service_history')}</Link></DropdownMenuItem>
                  
                  {isStaff && (
                    <>
                      <DropdownMenuSeparator className="bg-gray-50" />
                      <DropdownMenuLabel className="font-black text-[10px] uppercase tracking-[0.2em] text-amber-600 px-4 py-3">Operations</DropdownMenuLabel>
                      <DropdownMenuItem asChild><Link href="/staff/dashboard" className="font-bold flex items-center gap-2 rounded-xl bg-amber-50 text-amber-700"><HardHat size={14} /> Staff Portal</Link></DropdownMenuItem>
                    </>
                  )}

                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator className="bg-gray-50" />
                      <DropdownMenuLabel className="font-black text-[10px] uppercase tracking-[0.2em] text-primary px-4 py-3">Admin Console</DropdownMenuLabel>
                      <DropdownMenuItem asChild><Link href="/admin/dashboard" className="font-bold flex items-center gap-2 rounded-xl bg-primary/5 text-primary"><LayoutDashboard size={14} /> {t('admin_portal')}</Link></DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator className="bg-gray-50" />
                  <DropdownMenuItem onClick={() => signOut(auth)} className="text-destructive font-black flex items-center gap-2 rounded-xl uppercase text-[10px] tracking-widest hover:bg-red-50">
                    <LogOut size={14} /> {t('sign_out')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login" className="flex items-center gap-2 hover:text-primary transition-all group">
                <ShieldCheck className="text-primary group-hover:scale-110 transition-transform" size={20} />
                <span className="text-xs font-black uppercase tracking-widest">{t('portal_access')}</span>
              </Link>
            )}
            
            <Button asChild className="bg-primary hover:bg-primary/90 font-black px-8 h-12 rounded-[1.25rem] text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:translate-y-[-2px] active:scale-95 uppercase text-xs tracking-widest">
              <Link href="/services"><CalendarCheck size={18} className="mr-2" /> Book A Service</Link>
            </Button>
          </div>
          
          <div className="flex lg:hidden items-center gap-4">
            <Button variant="ghost" size="sm" className="text-white hover:text-primary p-0 h-auto rounded-xl" onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')}>
              <div className="flex flex-col items-center">
                <Globe size={20} className="text-primary" />
                <span className="text-[9px] font-black mt-0.5">{language === 'bn' ? "EN" : "বাং"}</span>
              </div>
            </Button>
            {user && (
              <Link href="/account/dashboard" className="text-primary">
                <UserCircle size={28} />
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
