"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Search, 
  Globe, 
  ShieldCheck, 
  UserCircle, 
  LayoutDashboard, 
  LogOut, 
  ChevronDown, 
  CalendarCheck, 
  HardHat,
  User,
  History,
  LogIn
} from 'lucide-react';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

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

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <header className="w-full z-50 sticky top-0 shadow-sm border-b border-white/10">
      <div className="bg-[#081621] text-white py-4">
        <div className="container mx-auto px-4 flex items-center justify-between gap-8">
          {/* Logo Section */}
          <Link href={logoLink} className="flex items-center gap-3 shrink-0 group">
            <div className="relative h-10 md:h-12 w-auto min-w-[120px] max-w-[200px] flex items-center justify-start overflow-hidden">
              {displayLogo ? (
                <Image 
                  src={displayLogo} 
                  alt="Logo" 
                  fill
                  className="object-contain object-left transition-transform group-hover:scale-105" 
                  priority 
                  data-ai-hint="company logo"
                />
              ) : (
                <div className="bg-primary p-2 rounded-lg">
                  <span className="text-white font-black text-xl">S</span>
                </div>
              )}
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-xl md:text-2xl font-black tracking-tighter font-headline text-white uppercase leading-none">
                {settings?.websiteName || 'SMART CLEAN'}
              </span>
              <span className="text-[8px] font-black text-primary uppercase tracking-[0.2em] mt-1">Expert Solutions</span>
            </div>
          </Link>

          {/* Desktop Search */}
          <div className="flex-1 max-w-md relative hidden md:block">
            <div className="relative group">
              <Input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('search_placeholder')}
                className="w-full bg-white/5 hover:bg-white/10 focus:bg-white text-white focus:text-black h-11 pr-12 rounded-xl border border-white/10 focus:border-primary transition-all font-medium placeholder:text-white/40"
              />
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-primary transition-colors" size={18} />
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-6">
            <nav className="flex items-center gap-6 mr-2">
              <Link href="/services" className="text-[11px] font-black uppercase tracking-widest text-white/70 hover:text-primary transition-colors">Services</Link>
              <Link href="/products" className="text-[11px] font-black uppercase tracking-widest text-white/70 hover:text-primary transition-colors">Store</Link>
            </nav>

            <Button 
              variant="ghost" 
              className="text-white hover:text-primary hover:bg-transparent gap-2 px-0 h-auto rounded-xl"
              onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')}
            >
              <Globe size={18} className="text-primary" />
              <span className="text-[11px] font-black uppercase tracking-widest">{language === 'bn' ? "EN" : "বাং"}</span>
            </Button>
            
            <div className="h-8 w-px bg-white/10" />

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="hover:bg-white/5 p-1 h-auto rounded-full gap-2 group">
                    <Avatar className="h-9 w-9 border-2 border-primary/20 transition-all group-hover:border-primary shadow-sm">
                      <AvatarImage src={user.photoURL || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary font-black uppercase text-xs">
                        {user.displayName?.[0] || user.email?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown size={14} className="text-white/40 group-hover:text-primary transition-colors mr-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 mt-2 rounded-[1.5rem] p-2 border-none shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                  <DropdownMenuLabel className="flex flex-col px-4 py-3">
                    <span className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Logged in as</span>
                    <span className="font-bold text-gray-900 truncate">{user.displayName || user.email}</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-gray-50" />
                  
                  <DropdownMenuItem asChild className="rounded-xl focus:bg-primary/5 focus:text-primary cursor-pointer p-3">
                    <Link href="/account/dashboard" className="flex items-center gap-3 w-full font-bold">
                      <LayoutDashboard size={18} /> {t('personal_dashboard')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-xl focus:bg-primary/5 focus:text-primary cursor-pointer p-3">
                    <Link href="/account/history" className="flex items-center gap-3 w-full font-bold">
                      <History size={18} /> {t('service_history')}
                    </Link>
                  </DropdownMenuItem>
                  
                  {isStaff && (
                    <>
                      <DropdownMenuSeparator className="bg-gray-50" />
                      <DropdownMenuItem asChild className="rounded-xl bg-amber-50 text-amber-700 focus:bg-amber-100 focus:text-amber-800 cursor-pointer p-3 m-1">
                        <Link href="/staff/dashboard" className="flex items-center gap-3 w-full font-black uppercase text-[10px] tracking-widest">
                          <HardHat size={18} /> Staff Portal
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator className="bg-gray-50" />
                      <DropdownMenuItem asChild className="rounded-xl bg-primary/10 text-primary focus:bg-primary focus:text-white cursor-pointer p-3 m-1">
                        <Link href="/admin/dashboard" className="flex items-center gap-3 w-full font-black uppercase text-[10px] tracking-widest">
                          <ShieldCheck size={18} /> {t('admin_portal')}
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  
                  <DropdownMenuSeparator className="bg-gray-50" />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive font-black flex items-center gap-3 rounded-xl uppercase text-[10px] tracking-widest hover:bg-red-50 focus:bg-red-50 focus:text-destructive cursor-pointer p-3">
                    <LogOut size={18} /> {t('sign_out')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild variant="ghost" className="text-white hover:text-primary hover:bg-white/5 gap-2 h-11 px-5 rounded-xl font-black uppercase text-[11px] tracking-widest border border-white/10">
                <Link href="/login">
                  <ShieldCheck size={18} className="text-primary" />
                  {t('portal_access')}
                </Link>
              </Button>
            )}
            
            <Button asChild className="bg-primary hover:bg-primary/90 font-black px-8 h-12 rounded-[1.25rem] text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:translate-y-[-2px] active:scale-95 uppercase text-[11px] tracking-widest">
              <Link href="/services"><CalendarCheck size={18} className="mr-2" /> Book Now</Link>
            </Button>
          </div>
          
          {/* Mobile & Tablet Icons */}
          <div className="flex lg:hidden items-center gap-4">
            <Button variant="ghost" size="sm" className="text-white hover:text-primary p-0 h-auto rounded-xl" onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')}>
              <div className="flex flex-col items-center">
                <Globe size={20} className="text-primary" />
                <span className="text-[9px] font-black mt-0.5">{language === 'bn' ? "EN" : "বাং"}</span>
              </div>
            </Button>
            
            <Link href={user ? "/account/dashboard" : "/login"} className="relative group">
              {user ? (
                <Avatar className="h-9 w-9 border-2 border-primary shadow-sm">
                  <AvatarImage src={user.photoURL || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary font-black text-xs">
                    {user.displayName?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 text-white hover:text-primary hover:border-primary/50 transition-all">
                  <User size={20} />
                </div>
              )}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
