
"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Search, 
  ShoppingCart,
  ChevronDown,
  X,
  Package,
  Loader2,
  Wrench,
  User,
  Zap
} from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { Input } from '@/components/ui/input';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useFirestore, useDoc, useMemoFirebase, useCollection, useUser } from '@/firebase';
import { useCart } from '@/components/providers/cart-provider';
import { doc, collection } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export function Navbar() {
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

  const productsEnabled = settings?.productsEnabled !== false;
  const servicesEnabled = settings?.servicesEnabled !== false;

  const productsRef = useMemoFirebase(() => db ? collection(db, 'products') : null, [db]);
  const servicesRef = useMemoFirebase(() => db ? collection(db, 'services') : null, [db]);

  const { data: products } = useCollection(productsRef);
  const { data: services } = useCollection(servicesRef);

  const displayLogo = settings?.logoUrl || PlaceHolderImages.find(img => img.id === 'app-logo')?.imageUrl;
  const companyName = settings?.websiteName || 'Smart Clean';

  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return [];
    const combined = [
      ...(productsEnabled ? (products?.map(p => ({ ...p, type: 'product' })) || []) : []),
      ...(servicesEnabled ? (services?.map(s => ({ ...s, type: 'service' })) || []) : [])
    ];
    return combined.filter(item => (item.name || item.title || '').toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 6);
  }, [searchQuery, products, services, productsEnabled, servicesEnabled]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setIsSearchFocused(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchFocused(false);
      router.push(`/services?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const navStyles = {
    backgroundColor: layout?.header?.bgColor || '#ffffff',
    color: layout?.header?.textColor || '#081621'
  };

  const DEFAULT_CUSTOM_REQ_ICON = 'https://picsum.photos/seed/clean-bucket/100/100';
  const customReqIcon = layout?.header?.customRequestIconUrl || DEFAULT_CUSTOM_REQ_ICON;

  return (
    <header className="hidden lg:block w-full z-[160] sticky top-0 shadow-md transition-colors duration-500" style={navStyles}>
      <div className="py-4 px-4 container mx-auto flex items-center justify-between gap-8">
        <Link href="/" className="flex items-center gap-3 shrink-0 group">
          <div className="relative h-14 w-14 rounded-xl overflow-hidden bg-white shadow-sm border border-gray-100">
            {displayLogo ? <Image src={displayLogo} alt="Logo" fill className="object-contain" unoptimized /> : <div className="w-full h-full bg-primary flex items-center justify-center text-white font-black">S</div>}
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black font-headline uppercase leading-none" style={{ color: layout?.header?.textColor }}>{companyName}</span>
            <span className="text-[8px] font-black text-primary uppercase tracking-[0.2em] mt-1">Professional Care</span>
          </div>
        </Link>

        <nav className="flex items-center gap-6">
          {layout?.header?.menuItems?.map((item: any, i: number) => (
            <Link key={i} href={item.link} className={cn("font-bold uppercase tracking-widest text-sm hover:text-primary transition-colors")}>{item.label}</Link>
          ))}
        </nav>

        <div className="flex-1 relative max-w-md mx-4" ref={searchRef}>
          <form onSubmit={handleSearchSubmit} className="relative">
            <Input 
              value={searchQuery} 
              onFocus={() => setIsSearchFocused(true)}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('search_placeholder')}
              className="w-full bg-gray-100 border-none h-11 pl-10 rounded-xl focus:bg-white shadow-inner"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          </form>
          {isSearchFocused && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[200]">
              {searchResults.map(item => (
                <Link key={item.id} href={`/${item.type === 'product' ? 'product' : 'service'}/${item.id}`} className="flex items-center gap-4 p-4 hover:bg-gray-50 border-b border-gray-50 last:border-none" onClick={() => setIsSearchFocused(false)}>
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-50 shrink-0">
                    {item.imageUrl && <Image src={item.imageUrl} alt="Result" fill className="object-cover" unoptimized />}
                  </div>
                  <span className="text-xs font-bold uppercase truncate">{item.name || item.title}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {servicesEnabled && (
            <Link href="/account/custom-requests" className="flex items-center gap-3 px-5 py-2.5 rounded-full font-black uppercase text-[10px] tracking-widest bg-primary text-white shadow-lg hover:scale-105 active:scale-95 transition-all">
              <div className="relative w-5 h-5 shrink-0"><Image src={customReqIcon} alt="Icon" fill className="object-contain" unoptimized /></div>
              {layout?.header?.customRequestDesktopTitle || 'Request'}
            </Link>
          )}
          <Link href="/cart" className="relative p-2.5 bg-gray-50 rounded-full border border-gray-100 shadow-sm text-gray-600 hover:text-primary active:scale-90">
            <ShoppingCart size={22} />
            {itemCount > 0 && <span className="absolute -top-1 -right-1 bg-primary text-white text-[8px] font-black h-5 w-5 flex items-center justify-center rounded-full border-2 border-white">{itemCount}</span>}
          </Link>
          <Link href={user ? "/account/dashboard" : "/login"} className="p-2.5 bg-gray-50 rounded-full border border-gray-100 shadow-sm text-gray-600 hover:text-primary active:scale-90">
            <User size={22} />
          </Link>
        </div>
      </div>
    </header>
  );
}
