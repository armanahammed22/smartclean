"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Search, Globe, User, Menu, Package, Briefcase } from 'lucide-react';
import { useCart } from '@/components/providers/cart-provider';
import { useLanguage } from '@/components/providers/language-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { getMockProducts, getMockServices } from '@/lib/data';
import { Card } from '@/components/ui/card';

const LOGO_IMAGE = PlaceHolderImages.find(img => img.id === 'app-logo');

export function Navbar() {
  const { itemCount, setCheckoutOpen } = useCart();
  const { language, setLanguage, t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<{ id: string; name: string; type: 'product' | 'service'; category?: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const CATEGORIES = language === 'bn' 
    ? ["আবাসিক", "অফিস", "ডিপ ক্লিন", "মুভ ইন/আউট", "উইন্ডো", "কার্পেট", "স্যানিটাইজেশন", "কিচেন", "বাথরুম"]
    : ["Residential", "Office", "Deep Clean", "Move In/Out", "Window", "Carpet", "Sanitization", "Kitchen", "Bathroom"];

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const productsEn = getMockProducts('en');
      const productsBn = getMockProducts('bn');
      const servicesEn = getMockServices('en');
      const servicesBn = getMockServices('bn');
      
      const query = searchQuery.toLowerCase();
      const matchedProductIds = new Set<string>();
      const matchedServiceIds = new Set<string>();

      productsEn.forEach(p => {
        if (p.name.toLowerCase().includes(query)) matchedProductIds.add(p.id);
      });
      servicesEn.forEach(s => {
        if (s.title.toLowerCase().includes(query)) matchedServiceIds.add(s.id);
      });

      productsBn.forEach(p => {
        if (p.name.toLowerCase().includes(query)) matchedProductIds.add(p.id);
      });
      servicesBn.forEach(s => {
        if (s.title.toLowerCase().includes(query)) matchedServiceIds.add(s.id);
      });

      const currentProducts = getMockProducts(language);
      const currentServices = getMockServices(language);

      const filteredProducts = currentProducts
        .filter(p => matchedProductIds.has(p.id))
        .map(p => ({ id: p.id, name: p.name, type: 'product' as const, category: p.category }));
      
      const filteredServices = currentServices
        .filter(s => matchedServiceIds.has(s.id))
        .map(s => ({ id: s.id, name: s.title, type: 'service' as const }));
      
      setSuggestions([...filteredProducts, ...filteredServices]);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery, language]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="w-full z-50 sticky top-0 shadow-sm">
      <div className="bg-[#081621] text-white py-4">
        <div className="container mx-auto px-4 flex items-center justify-between gap-8">
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center">
              {LOGO_IMAGE ? (
                <Image src={LOGO_IMAGE.imageUrl} alt="Logo" fill className="object-contain p-1" />
              ) : (
                <span className="text-primary font-bold text-xl">S</span>
              )}
            </div>
            <span className="text-2xl font-bold tracking-tighter font-headline text-white">SMART CLEAN</span>
          </Link>

          <div className="flex-1 max-w-2xl relative hidden md:block" ref={searchRef}>
            <div className="relative">
              <Input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.trim() && setShowSuggestions(true)}
                placeholder={t('search_placeholder')}
                className="w-full bg-white text-black h-11 pr-12 rounded-sm border-none"
              />
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            </div>

            {showSuggestions && suggestions.length > 0 && (
              <Card className="absolute top-full left-0 right-0 mt-1 shadow-xl border-border bg-white z-[60] max-h-[400px] overflow-y-auto">
                <div className="py-2">
                  {suggestions.map((item) => (
                    <div 
                      key={`${item.type}-${item.id}`}
                      className="px-4 py-3 hover:bg-primary/5 cursor-pointer flex items-center gap-3 border-b border-border/50 transition-colors"
                      onClick={() => {
                        setSearchQuery('');
                        setShowSuggestions(false);
                      }}
                    >
                      <div className="p-2 bg-muted rounded-md text-primary">
                        {item.type === 'product' ? <Package size={16} /> : <Briefcase size={16} />}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm text-black">{item.name}</span>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                          {item.type === 'product' ? (item.category || t('products_title')) : t('services_title')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
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
            
            <Link href="#" className="flex items-center gap-2 hover:text-primary transition-colors">
              <User className="text-primary" size={20} />
              <span className="text-xs font-bold">{t('nav_account')}</span>
            </Link>
            
            <Button 
              onClick={() => setCheckoutOpen(true)}
              className="bg-primary hover:bg-primary/90 font-bold px-6 h-11 rounded-sm text-primary-foreground relative"
            >
              <ShoppingCart size={18} className="mr-2" />
              {t('nav_booking')}
              {itemCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-white text-primary border-2 border-primary">
                  {itemCount}
                </Badge>
              )}
            </Button>
          </div>
          
          <div className="flex lg:hidden items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:text-primary p-0 h-auto"
              onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')}
            >
              <div className="flex flex-col items-center">
                <Globe size={20} className="text-primary" />
                <span className="text-[10px] font-bold mt-0.5">{language === 'bn' ? "EN" : "বাং"}</span>
              </div>
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setCheckoutOpen(true)} className="relative text-white">
              <ShoppingCart size={22} />
              {itemCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-primary text-white">
                  {itemCount}
                </Badge>
              )}
            </Button>
            <Menu className="cursor-pointer" size={28} />
          </div>
        </div>
      </div>

      <div className="bg-white border-b hidden lg:block overflow-hidden">
        <div className="container mx-auto px-4">
          <nav className="flex items-center justify-between py-2">
            <div className="flex gap-6 overflow-x-auto no-scrollbar">
              {CATEGORIES.map((cat) => (
                <Link key={cat} href="#" className="text-[13px] font-semibold hover:text-primary whitespace-nowrap px-1">
                  {cat}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
