
"use client";

import React, { useState, useMemo, useRef, useEffect, memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, ShoppingCart, X, Package, Loader2, Wrench, User, Zap, MessageCircle, Globe } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { Input } from '@/components/ui/input';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useFirestore, useDoc, useMemoFirebase, useCollection, useUser } from '@/firebase';
import { useCart } from '@/components/providers/cart-provider';
import { doc, collection, query, where, limit } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export const Navbar = memo(() => {
  const { setLanguage, language, t } = useLanguage();
  const { itemCount } = useCart();
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'global') : null, [db]);
  const { data: settings } = useDoc(settingsRef);

  const layoutRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'layout') : null, [db]);
  const { data: layout } = useDoc(layoutRef);

  // 🚀 OPTIMIZATION: Don't fetch entire collections. Use a focused query when searching.
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      if (!db) return;
      setIsSearching(true);
      try {
        // Fetch limited products and services matching search
        const pQuery = query(collection(db, 'products'), where('status', '==', 'Active'), limit(10));
        const sQuery = query(collection(db, 'services'), where('status', '==', 'Active'), limit(10));
        
        const [pSnap, sSnap] = await Promise.all([getDocs(pQuery), getDocs(sQuery)]);
        
        const pItems = pSnap.docs.map(d => ({ ...d.data(), id: d.id, type: 'product' }));
        const sItems = sSnap.docs.map(d => ({ ...d.data(), id: d.id, type: 'service' }));
        
        const combined = [...pItems, ...sItems].filter(item => 
          (item.name || item.title || '').toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 5);

        setSearchResults(combined);
      } catch (e) {
        console.warn('Search fetch error');
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, db]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setIsSearchFocused(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navStyles = {
    backgroundColor: layout?.header?.bgColor || '#ffffff',
    color: layout?.header?.textColor || '#081621'
  };

  const displayLogo = settings?.logoUrl || PlaceHolderImages.find(img => img.id === 'app-logo')?.imageUrl;

  return (
    <header className="hidden lg:block w-full z-[160] sticky top-0 shadow-md transition-all duration-500" style={navStyles}>
      <div className="py-3 px-4 container mx-auto flex items-center justify-between gap-8">
        <Link href="/" className="flex items-center gap-3 shrink-0 group">
          <div className="relative h-12 w-12 rounded-xl overflow-hidden bg-white shadow-sm border border-gray-100">
            {displayLogo ? <Image src={displayLogo} alt="Logo" fill className="object-contain" priority unoptimized /> : <div className="w-full h-full bg-primary flex items-center justify-center text-white font-black">S</div>}
          </div>
          <div className="flex flex-col text-left">
            <span className="text-lg font-black font-headline uppercase leading-none" style={{ color: layout?.header?.textColor }}>{settings?.websiteName || 'SMART CLEAN'}</span>
            <span className="text-[7px] font-black text-primary uppercase tracking-[0.2em] mt-1">{t('public.service_tagline')}</span>
          </div>
        </Link>

        <nav className="flex items-center gap-6">
          {layout?.header?.menuItems?.map((item: any, i: number) => (
            <Link key={i} href={item.link} prefetch={true} className="font-bold uppercase tracking-widest text-xs hover:text-primary transition-colors">{item.label}</Link>
          ))}
        </nav>

        <div className="flex-1 relative max-w-md" ref={searchRef}>
          <form onSubmit={(e) => { e.preventDefault(); if (searchQuery.trim()) router.push(`/services?search=${encodeURIComponent(searchQuery)}`); }} className="relative">
            <Input 
              value={searchQuery} 
              onFocus={() => setIsSearchFocused(true)}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('public.search_placeholder')}
              className="w-full bg-gray-50 border-none h-10 pl-10 rounded-xl focus:bg-white shadow-inner text-sm"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-primary animate-spin" size={14} />}
          </form>
          {isSearchFocused && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[200]">
              {searchResults.map((item: any) => (
                <Link 
                  key={item.id} 
                  href={`/${item.type === 'product' ? 'product' : 'service'}/${item.slug || item.id}`} 
                  className="flex items-center gap-4 p-3 hover:bg-gray-50 border-b border-gray-50 last:border-none"
                  onClick={() => setIsSearchFocused(false)}
                >
                  <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-gray-50 shrink-0">
                    {item.imageUrl && <Image src={item.imageUrl} alt="Res" fill className="object-cover" unoptimized />}
                  </div>
                  <span className="text-xs font-bold uppercase truncate">{item.name || item.title}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')} className="text-[10px] font-black uppercase tracking-widest gap-2 hover:bg-primary/5 rounded-xl h-9">
            <Globe size={14} className="text-primary" />
            <span>{language === 'bn' ? 'EN' : 'বাংলা'}</span>
          </Button>
          
          <Link href="/cart" prefetch={true} className="relative p-2.5 bg-gray-50 rounded-xl border border-gray-100 shadow-sm text-gray-600 hover:text-primary active:scale-90 transition-all">
            <ShoppingCart size={20} />
            {itemCount > 0 && <span className="absolute -top-1 -right-1 bg-primary text-white text-[7px] font-black h-4 w-4 flex items-center justify-center rounded-full border-2 border-white">{itemCount}</span>}
          </Link>

          <Link href={user ? "/account/dashboard" : "/login"} prefetch={true} className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 shadow-sm text-gray-600 hover:text-primary active:scale-90 transition-all">
            <User size={20} />
          </Link>
        </div>
      </div>
    </header>
  );
});

import { getDocs } from 'firebase/firestore';
Navbar.displayName = 'Navbar';
