
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
  Menu
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

export function Navbar() {
  const { language, setLanguage, t } = useLanguage();
  const { user } = useUser();
  const { itemCount } = useCart();
  const auth = useAuth();
  const db = useFirestore();
  const [searchQuery, setSearchQuery] = useState('');

  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'global') : null, [db]);
  const { data: settings } = useDoc(settingsRef);

  const adminRef = useMemoFirebase(() => (db && user) ? doc(db, 'roles_admins', user.uid) : null, [db, user]);
  const { data: adminRole } = useDoc(adminRef);
  const isAdmin = !!adminRole || user?.uid === 'gcp03WmpjROVvRdpLNsghNU4zHa2';

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
    <header className="w-full z-50 sticky top-0 bg-white">
      {/* Top Utility Bar - Hidden on Mobile */}
      <div className="hidden lg:block bg-gray-50 border-b py-1">
        <div className="container mx-auto px-4 flex justify-end gap-6">
          <Link href="/page/about-us" className="text-[10px] font-bold text-gray-500 hover:text-primary uppercase tracking-wider">About Us</Link>
          <Link href="/page/careers" className="text-[10px] font-bold text-gray-500 hover:text-primary uppercase tracking-wider">Careers</Link>
          <Link href="/support" className="text-[10px] font-bold text-gray-500 hover:text-primary uppercase tracking-wider">Support</Link>
          <button onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')} className="text-[10px] font-black text-primary uppercase tracking-widest">
            {language === 'bn' ? "English" : "বাংলা"}
          </button>
        </div>
      </div>

      {/* Main Daraz-style Header */}
      <div className="bg-white border-b py-2 md:py-4 px-3 md:px-4">
        <div className="container mx-auto flex items-center gap-2 md:gap-8">
          
          {/* Logo Section */}
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

          {/* Offer Slider - CIRCULAR Daraz Style */}
          <NavbarOfferSlider />

          {/* Daraz-style Search Bar - Responsive */}
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

          {/* Actions Section */}
          <div className="flex items-center gap-1 md:gap-6 shrink-0">
            {/* Desktop Account */}
            <div className="hidden md:block">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 text-gray-700 hover:text-primary transition-colors font-bold text-sm">
                      <Avatar className="h-8 w-8 border-2 border-gray-100">
                        <AvatarImage src={user.photoURL || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary font-black text-xs uppercase">
                          {user.displayName?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="max-w-[100px] truncate">{user.displayName?.split(' ')[0] || 'Account'}</span>
                      <ChevronDown size={14} className="opacity-40" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 mt-2 rounded-xl p-2 border-none shadow-2xl">
                    <DropdownMenuItem asChild className="rounded-lg p-3 cursor-pointer"><Link href="/account/dashboard" className="flex items-center gap-3 font-bold"><LayoutDashboard size={18} /> Dashboard</Link></DropdownMenuItem>
                    {isAdmin && <DropdownMenuItem asChild className="rounded-lg p-3 cursor-pointer bg-primary/5 text-primary mt-1"><Link href="/admin/dashboard" className="flex items-center gap-3 font-black uppercase text-[10px]"><ShieldCheck size={18} /> Admin Portal</Link></DropdownMenuItem>}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive font-black p-3 rounded-lg cursor-pointer"><LogOut size={18} className="mr-2" /> {t('sign_out')}</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link href="/login" className="flex items-center gap-2 text-gray-700 hover:text-primary font-bold text-sm">
                  <User size={20} className="text-gray-400" />
                  <span>Login</span>
                </Link>
              )}
            </div>

            {/* Mobile User Icon */}
            <Link href={user ? "/account/dashboard" : "/login"} className="md:hidden p-1.5 text-gray-600 hover:text-primary transition-colors">
              <User size={22} />
            </Link>

            {/* Cart Icon */}
            <Link href="/cart" className="relative p-1.5 text-gray-600 hover:text-primary transition-colors group">
              <ShoppingCart size={22} />
              {itemCount > 0 && (
                <span className="absolute top-0 right-0 bg-primary text-white text-[8px] font-black h-4 w-4 flex items-center justify-center rounded-full shadow-lg border-2 border-white animate-in zoom-in">
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
