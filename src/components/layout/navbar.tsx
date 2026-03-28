
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
  const logoLink = settings?.logoLink || '/';
  const companyName = settings?.websiteName || 'Smart Clean';

  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return [];
    
    const combined = [
      ...(productsEnabled ? (products?.map(p => ({ ...p, type: 'product' })) || []) : []),
      ...(servicesEnabled ? (services?.map(s => ({ ...s, type: 'service' })) || []) : [])
    ];

    return combined.filter(item => 
      (item.name || item.title || '').toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 6);
  }, [searchQuery, products, services, productsEnabled, servicesEnabled]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
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

  const handleSelectResult = (id: string, type: string) => {
    setSearchQuery('');
    setIsSearchFocused(false);
    router.push(`/${type === 'product' ? 'product' : 'service'}/${id}`);
  };

  const navStyles = {
    backgroundColor: layout?.header?.bgColor || '#ffffff',
    color: layout?.header?.textColor || '#081621'
  };

  const topBarStyles = {
    backgroundColor: layout?.header?.topBarBg || '#f9fafb',
    color: layout?.header?.topBarText || '#6b7280'
  };

  return (
    <header className="w-full z-[160] sticky top-0 shadow-sm transition-colors duration-500" style={navStyles}>
      {(layout?.header?.showTopBar !== false) && (
        <div className="hidden lg:block border-b py-1 transition-colors duration-500" style={topBarStyles}>
          <div className="container mx-auto px-4 flex justify-end gap-6 h-8 items-center">
            <Link href="/page/about-us" className="text-[10px] font-bold uppercase tracking-wider opacity-80 hover:opacity-100 transition-opacity" style={{ color: 'inherit' }}>{t('footer_about')}</Link>
            <Link href="/support" className="text-[10px] font-bold uppercase tracking-wider opacity-80 hover:opacity-100 transition-opacity" style={{ color: 'inherit' }}>{t('item_supporthub')}</Link>
            <button onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')} className="text-[10px] font-black uppercase tracking-widest text-primary">
              {language === 'bn' ? "English" : "বাংলা"}
            </button>
          </div>
        </div>
      )}

      <div className="py-2 md:py-4 px-3 md:px-4 border-b border-gray-100">
        <div className="container mx-auto flex items-center justify-between gap-4 md:gap-8">
          
          <div className="flex items-center gap-4 md:gap-8 shrink-0">
            <Link href={logoLink} className="flex items-center gap-3 shrink-0 group">
              <div className="relative h-12 md:h-16 w-12 md:w-16 flex items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm border border-gray-100">
                {displayLogo ? (
                  <Image 
                    src={displayLogo} 
                    alt="Logo" 
                    fill
                    className="object-contain" 
                    priority 
                    unoptimized
                  />
                ) : (
                  <div className="bg-primary p-1.5 rounded-lg w-full h-full flex items-center justify-center">
                    <span className="text-white font-black text-sm md:text-lg">S</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col hidden sm:flex">
                <span className="text-sm md:text-xl font-black tracking-tighter font-headline uppercase leading-none" style={{ color: layout?.header?.textColor || '#081621' }}>
                  {companyName}
                </span>
                <span className="text-[7px] md:text-[8px] font-bold text-primary uppercase tracking-[0.2em] leading-none mt-1">Professional Care</span>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-6">
              {layout?.header?.menuItems?.map((item: any, i: number) => {
                const isProdLink = item.link === '/products' || item.link === '/cart';
                const isServLink = item.link === '/services';
                if (isProdLink && !productsEnabled) return null;
                if (isServLink && !servicesEnabled) return null;

                return (
                  <Link 
                    key={i} 
                    href={item.link} 
                    className={cn(
                      "font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                      layout?.header?.fontSize || 'text-sm'
                    )}
                    style={{ color: layout?.header?.textColor || '#081621' }}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex-1 relative max-w-2xl mx-4" ref={searchRef}>
            <form onSubmit={handleSearchSubmit} className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10 flex items-center gap-2 pointer-events-none">
                <Search size={16} className="text-primary/60" />
                <div className="w-px h-4 bg-gray-200" />
              </div>
              <Input 
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('search_placeholder')}
                className="w-full bg-gray-100 border-none h-10 md:h-12 pl-12 pr-12 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all font-medium placeholder:text-gray-400 text-xs md:text-sm shadow-inner"
              />
              <button 
                type="submit"
                className="absolute right-0 top-0 h-full w-10 md:w-14 bg-primary flex items-center justify-center rounded-r-xl text-white hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 active:scale-95"
              >
                <Search size={18} className="md:w-5 md:h-5" />
              </button>
            </form>

            {isSearchFocused && searchQuery.length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-3 bg-gray-50/50 border-b flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('search_suggestions')}</span>
                  <button onClick={() => setIsSearchFocused(false)} className="text-gray-400 hover:text-gray-600"><X size={14}/></button>
                </div>
                
                <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                  {searchResults.length > 0 ? (
                    searchResults.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleSelectResult(item.id, item.type)}
                        className="w-full flex items-center gap-4 p-4 hover:bg-primary/5 transition-colors border-b border-gray-50 last:border-none text-left group"
                      >
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-50 border shrink-0">
                          {item.imageUrl ? (
                            <Image src={item.imageUrl} alt="Result" fill className="object-cover" unoptimized />
                          ) : (
                            <div className="w-full h-full bg-primary/5 flex items-center justify-center text-primary/20">
                              {item.type === 'service' ? <Wrench size={20} /> : <Package size={20} />}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-900 uppercase truncate group-hover:text-primary">{item.name || item.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className={cn(
                              "text-[8px] font-black uppercase px-1.5 h-4 border-none",
                              item.type === 'service' ? "text-blue-600" : "text-green-600")}
                            >
                              {item.type === 'service' ? t('service') : t('product')}
                            </Badge>
                            <span className="text-[11px] font-black text-primary">৳{(item.price || item.basePrice)?.toLocaleString()}</span>
                          </div>
                        </div>
                        <ChevronDown size={14} className="-rotate-90 text-gray-300 group-hover:translate-x-1 transition-transform" />
                      </button>
                    ))
                  ) : (
                    <div className="p-10 text-center space-y-3">
                      <div className="mx-auto w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-300"><Search size={24} /></div>
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('no_match_found')}</p>
                    </div>
                  )}
                </div>
                
                {searchResults.length > 0 && (
                  <Link 
                    href={`/services?search=${searchQuery}`}
                    onClick={() => setIsSearchFocused(false)}
                    className="block p-3 bg-primary text-white text-center text-[10px] font-black uppercase tracking-[0.2em] hover:bg-primary/90 transition-colors"
                  >
                    {t('view_all_results')}
                  </Link>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 md:gap-4 shrink-0 h-full">
            {servicesEnabled && (
              <Link 
                href="/account/custom-requests" 
                className={cn(
                  "hidden lg:flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-full font-black uppercase tracking-widest transition-all whitespace-nowrap shadow-xl shadow-primary/20 hover:scale-105 active:scale-95",
                  layout?.header?.fontSize || 'text-[11px]'
                )}
              >
                <Zap size={14} fill="currentColor" /> কাস্টম রিকোয়েস্ট
              </Link>
            )}

            {productsEnabled && (
              <Link href="/cart" className="relative p-2.5 text-gray-600 hover:text-primary transition-all group bg-gray-50 rounded-full hover:bg-primary/5 active:scale-90 border border-gray-100 shadow-sm flex items-center justify-center">
                <ShoppingCart size={22} />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-white text-[8px] font-black h-5 w-5 flex items-center justify-center rounded-full shadow-lg border-2 border-white animate-in zoom-in">
                    {itemCount}
                  </span>
                )}
              </Link>
            )}

            <Link 
              href={user ? "/account/dashboard" : "/login"} 
              className="relative p-2.5 text-gray-600 hover:text-primary transition-all group bg-gray-50 rounded-full hover:bg-primary/5 active:scale-90 border border-gray-100 shadow-sm flex items-center justify-center"
              title={user ? t('personal_dashboard') : t('portal_access')}
            >
              <User size={22} />
              {user && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white shadow-sm" />}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
