
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
  LogIn,
  ShoppingCart,
  Menu,
  Shield
} from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useUser, useFirestore, useDoc, useMemoFirebase, useAuth } from '@/firebase';
import { useCart } from '@/components/providers/cart-provider';
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
import { NavbarOfferSlider } from './navbar-offer-slider';

const BOOTSTRAP_ADMIN_UID = '6YTKdslETkVXcftvhSY5x9sjOgT2';

export function Navbar() {
  const { language, setLanguage, t } = useLanguage();
  const { user } = useUser();
  const { itemCount } = useCart();
  const auth = useAuth();
  const db = useFirestore();
  const [searchQuery, setSearchQuery] = useState('');

  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'global') : null, [db]);
  const { data: settings } = useDoc(settingsRef);

  // Admin Check
  const adminRef = useMemoFirebase(() => (db && user) ? doc(db, 'roles_admins', user.uid) : null, [db, user]);
  const { data: adminRole } = useDoc(adminRef);
  const isAdmin = !!adminRole || user?.uid === BOOTSTRAP_ADMIN_UID;

  // Staff Check
  const staffRef = useMemoFirebase(() => (db && user) ? doc(db, 'roles_employees', user.uid) : null, [db, user]);
  const { data: staffRole } = useDoc(staffRef);
  const isStaff = !!staffRole;

  const displayLogo = settings?.logoUrl || PlaceHolderImages.find(img => img.id === 'app-logo')?.imageUrl;
  const logoLink = settings?.logoLink || '/';

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
    }
  };

  return (
    <header className="w-full z-50 sticky top-0 bg-white shadow-sm">
      {/* Top Utility Bar */}
      <div className="hidden lg:block bg-gray-50 border-b py-1">
        <div className="container mx-auto px-4 flex justify-end gap-6">
          <Link href="/page/about-us" className="text-[10px] font-bold text-gray-500 hover:text-primary uppercase tracking-wider">About Us</Link>
          <Link href="/support" className="text-[10px] font-bold text-gray-500 hover:text-primary uppercase tracking-wider">Support</Link>
          <button onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')} className="text-[10px] font-black text-primary uppercase tracking-widest">
            {language === 'bn' ? "English" : "বাংলা"}
          </button>
        </div>
      </div>

      {/* Main Header */}
      <div className="bg-white py-2 md:py-4 px-3 md:px-4">
        <div className="container mx-auto flex items-center gap-2 md:gap-8">
          
          <Link href={logoLink} className="flex items-center shrink-0">
            <div className="relative h-7 md:h-10 w-auto min-w-[80px] md:min-w-[140px] flex items-center justify-start overflow-hidden">
              {displayLogo ? (
                <Image 
                  src={displayLogo} 
                  alt="Logo" 
                  fill
                  className="object-contain object-left" 
                  priority 
                  unoptimized
                />
              ) : (
                <div className="bg-primary p-1.5 rounded-lg">
                  <span className="text-white font-black text-sm md:text-lg">S</span>
                </div>
              )}
            </div>
          </Link>

          <div className="hidden sm:block">
            <NavbarOfferSlider />
          </div>

          <div className="flex-1 relative">
            <div className="relative group">
              <Input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('search_placeholder')}
                className="w-full bg-gray-100 border-none h-9 md:h-11 pr-10 md:pr-12 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all font-medium placeholder:text-gray-400 text-xs md:text-sm"
              />
              <button className="absolute right-0 top-0 h-full w-9 md:w-12 bg-primary flex items-center justify-center rounded-r-lg text-white hover:bg-primary/90 transition-colors">
                <Search size={16} className="md:w-5 md:h-5" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1 md:gap-6 shrink-0">
            <div className="hidden md:block">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2.5 px-3 py-1.5 rounded-full hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100">
                      <Avatar className="h-8 w-8 border-2 border-white shadow-sm">
                        <AvatarImage src={user.photoURL || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary font-black text-[10px] uppercase">
                          {user.displayName?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-left hidden lg:block">
                        <p className="text-xs font-black text-gray-900 leading-none truncate max-w-[100px] uppercase">
                          {user.displayName?.split(' ')[0] || 'User'}
                        </p>
                        <p className="text-[8px] font-bold text-muted-foreground uppercase mt-0.5 tracking-tighter">My Account</p>
                      </div>
                      <ChevronDown size={14} className="opacity-30" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-60 mt-2 rounded-2xl p-2 border-none shadow-2xl animate-in slide-in-from-top-2">
                    <DropdownMenuLabel className="text-[10px] font-black uppercase opacity-40 px-3 py-2 tracking-widest">Navigation</DropdownMenuLabel>
                    <DropdownMenuItem asChild className="rounded-xl p-3 cursor-pointer hover:bg-primary/5 transition-colors">
                      <Link href="/account/dashboard" className="flex items-center gap-3 font-bold text-gray-700">
                        <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><UserCircle size={18} /></div>
                        Profile Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-xl p-3 cursor-pointer hover:bg-primary/5 transition-colors">
                      <Link href="/account/history" className="flex items-center gap-3 font-bold text-gray-700">
                        <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg"><History size={18} /></div>
                        Order History
                      </Link>
                    </DropdownMenuItem>
                    
                    {(isAdmin || isStaff) && (
                      <>
                        <DropdownMenuSeparator className="my-2 opacity-50" />
                        <DropdownMenuLabel className="text-[10px] font-black uppercase opacity-40 px-3 py-1 tracking-widest">Portal Entry</DropdownMenuLabel>
                        {isAdmin && (
                          <DropdownMenuItem asChild className="rounded-xl p-3 cursor-pointer bg-red-50 hover:bg-red-100 text-red-700 mt-1">
                            <Link href="/admin/dashboard" className="flex items-center gap-3 font-black uppercase text-[10px]">
                              <ShieldCheck size={18} /> Admin Terminal
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {isStaff && (
                          <DropdownMenuItem asChild className="rounded-xl p-3 cursor-pointer bg-emerald-50 hover:bg-emerald-100 text-emerald-700 mt-1">
                            <Link href="/staff/dashboard" className="flex items-center gap-3 font-black uppercase text-[10px]">
                              <HardHat size={18} /> Staff App
                            </Link>
                          </DropdownMenuItem>
                        )}
                      </>
                    )}

                    <DropdownMenuSeparator className="my-2 opacity-50" />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive font-black p-3 rounded-xl cursor-pointer hover:bg-red-50 transition-colors">
                      <div className="p-1.5 bg-red-100 text-red-600 rounded-lg mr-1"><LogOut size={18} /></div>
                      {t('sign_out')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link href="/login" className="flex items-center gap-2 text-gray-700 hover:text-primary font-black uppercase text-xs tracking-widest px-4 py-2 rounded-full border border-gray-100 hover:bg-gray-50 transition-all">
                  <User size={18} className="text-gray-400" />
                  <span>Login</span>
                </Link>
              )}
            </div>

            <Link href="/cart" className="relative p-2 text-gray-600 hover:text-primary transition-all group bg-gray-50 rounded-full hover:bg-primary/5 active:scale-90">
              <ShoppingCart size={22} />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-[8px] font-black h-4.5 w-4.5 flex items-center justify-center rounded-full shadow-lg border-2 border-white animate-in zoom-in">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
