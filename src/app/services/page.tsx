'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { PublicLayout } from '@/components/layout/public-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, Search, Filter, X, Wrench, Package, Star, Calendar, Zap } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/components/providers/language-provider';
import { ProductCard } from '@/components/products/product-card';
import { cn } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';

function ServicesContent() {
  const db = useFirestore();
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const queryParam = searchParams.get('search');
    if (queryParam) {
      setSearchQuery(queryParam);
    }
  }, [searchParams]);

  const servicesRef = useMemoFirebase(() => db ? collection(db, 'services') : null, [db]);
  const productsRef = useMemoFirebase(() => db ? collection(db, 'products') : null, [db]);
  const subServicesRef = useMemoFirebase(() => db ? collection(db, 'sub_services') : null, [db]);

  const { data: services, isLoading: sLoading } = useCollection(servicesRef);
  const { data: products, isLoading: pLoading } = useCollection(productsRef);
  const { data: subServices, isLoading: subLoading } = useCollection(subServicesRef);

  const CATEGORIES = [
    { id: 'All', label: t('cat_all') },
    { id: 'Cleaning', label: t('cat_cleaning') },
    { id: 'Maintenance', label: t('cat_maintenance') },
    { id: 'Repair', label: t('cat_repair') },
    { id: 'Tools', label: t('cat_tools') }
  ];

  const filteredOfferings = useMemo(() => {
    let combined: any[] = [];
    if (services) {
      combined = [...combined, ...services
        .filter(s => s.status === 'Active')
        .map(s => ({ ...s, itemType: 'service' }))
      ];
    }
    if (products) {
      combined = [...combined, ...products
        .filter(p => p.status === 'Active')
        .map(p => ({ ...p, itemType: 'product' }))
      ];
    }
    if (subServices) {
      combined = [...combined, ...subServices
        .filter(sub => sub.status === 'Active')
        .map(sub => ({ 
          ...sub, 
          title: sub.name, 
          basePrice: sub.price, 
          itemType: 'service',
          isAddOn: true 
        }))
      ];
    }

    return combined.filter(item => {
      const nameMatch = (item.title || item.name || '').toLowerCase();
      const queryText = searchQuery.toLowerCase();
      const matchesSearch = nameMatch.includes(queryText);
      
      const matchesCategory = activeCategory === 'All' || 
        (activeCategory === 'Tools' ? item.itemType === 'product' : item.categoryId === activeCategory);
      
      return matchesSearch && matchesCategory;
    });
  }, [services, products, subServices, searchQuery, activeCategory]);

  const isLoading = sLoading || pLoading || subLoading;

  if (!mounted) return null;

  return (
    <div className="bg-[#F9FAFB] min-h-screen pb-24">
      <header className="bg-white border-b py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-7xl text-center space-y-8">
          <div className="space-y-3">
            <Badge className="bg-primary/10 text-primary border-none uppercase tracking-widest font-black py-1.5 px-5 rounded-full text-[10px]">
              Marketplace Catalog
            </Badge>
            <h1 className="text-4xl md:text-6xl font-black text-[#081621] font-headline tracking-tighter uppercase">
              {searchQuery ? `Results for "${searchQuery}"` : t('all_services_title')}
            </h1>
          </div>

          <div className="max-w-2xl mx-auto relative group">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
              <Search size={20} />
            </div>
            <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('find_service_placeholder')}
              className="h-14 md:h-16 pl-14 pr-12 rounded-full border-gray-200 bg-white shadow-xl shadow-gray-100/50 focus:ring-primary focus:border-primary text-lg font-medium transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-5 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={18} className="text-gray-400" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap justify-center gap-3 pt-4">
            {CATEGORIES.map((cat) => (
              <Button
                key={cat.id}
                variant={activeCategory === cat.id ? 'default' : 'outline'}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "rounded-full px-6 h-11 font-black text-[11px] uppercase tracking-widest transition-all",
                  activeCategory === cat.id 
                    ? "shadow-lg shadow-primary/20 scale-105" 
                    : "bg-white hover:bg-primary/5 hover:border-primary/30"
                )}
              >
                {cat.label}
              </Button>
            ))}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 max-w-7xl py-12">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 className="animate-spin text-primary" size={48} />
            <p className="text-muted-foreground font-black uppercase tracking-widest text-[10px]">Syncing Catalog...</p>
          </div>
        ) : filteredOfferings.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4 lg:gap-6">
            {filteredOfferings.map((item) => (
              item.itemType === 'service' ? (
                <div key={item.id} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100 flex flex-col relative h-full">
                  <Link href={`/service/${item.slug || item.id}`} className="block relative aspect-square overflow-hidden shrink-0 bg-gray-50">
                    {item.imageUrl ? (
                      <Image 
                        src={item.imageUrl} 
                        alt={item.title || 'Service Image'} 
                        fill 
                        className="object-cover transition-transform duration-500 group-hover:scale-110" 
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full bg-primary/5 flex items-center justify-center text-primary/40">
                        <Wrench size={40} />
                      </div>
                    )}
                    <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                      <Badge className="bg-white/95 text-primary border-none shadow-sm backdrop-blur-md font-black text-[8px] uppercase px-2 py-0.5 rounded-sm">
                        {item.categoryId || 'General'}
                      </Badge>
                    </div>
                  </Link>
                  <div className="p-3 flex flex-col flex-1">
                    <div className="min-h-[40px] md:min-h-[48px] mb-2 text-left">
                      <Link href={`/service/${item.slug || item.id}`} className="hover:text-primary transition-colors block">
                        <h3 className="text-[11px] md:text-xs font-bold group-hover:text-primary transition-colors line-clamp-2 leading-tight uppercase tracking-tight text-gray-800">
                          {item.title}
                        </h3>
                      </Link>
                    </div>
                    
                    <div className="space-y-2 mb-3">
                      <div className="flex flex-col items-start pt-1">
                        <span className="text-base font-black text-primary tracking-tighter leading-none">
                          ৳{(item.basePrice || 0).toLocaleString()}
                        </span>
                        {item.regularPrice && item.regularPrice > item.basePrice && (
                          <span className="text-[10px] text-gray-400 line-through font-medium leading-none mt-1">৳{item.regularPrice.toLocaleString()}</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[9px] md:text-[10px] font-bold border-t border-gray-50 pt-2">
                        <div className="flex items-center gap-1 text-amber-500">
                          <Star size={12} fill="currentColor" />
                          <span className="text-gray-600">{(item.rating || 5.0).toFixed(1)}</span>
                        </div>
                        <span className="uppercase text-gray-400 font-black">{Math.floor(Math.random() * 200) + 50} {t('booked')}</span>
                      </div>
                    </div>

                    <Button size="sm" className="w-full rounded-lg font-black text-[9px] uppercase shadow-md h-9 tracking-widest transition-transform active:scale-95 mt-auto" asChild>
                      <Link href={`/service/${item.slug || item.id}`}>
                        <Calendar size={12} className="mr-1" />
                        {t('book_now')}
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <ProductCard key={item.id} product={item} />
              )
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center space-y-6">
            <Filter size={48} className="text-gray-300" />
            <h3 className="text-2xl font-black text-[#081621] uppercase">No Match Found</h3>
            <Button onClick={() => { setSearchQuery(''); setActiveCategory('All'); }} variant="outline" className="rounded-full px-8 font-black uppercase text-[10px]">Clear Filters</Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ServicesListPage() {
  return (
    <PublicLayout>
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin text-primary" /></div>}>
        <ServicesContent />
      </Suspense>
    </PublicLayout>
  );
}
