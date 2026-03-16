
'use client';

import React, { useState, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { PublicLayout } from '@/components/layout/public-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, Search, Filter, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/components/providers/language-provider';
import { ProductCard } from '@/components/products/product-card';
import { cn } from '@/lib/utils';

export default function ServicesListPage() {
  const db = useFirestore();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  // Fetch Services
  const servicesQuery = useMemoFirebase(() => 
    db ? query(collection(db, 'services'), where('status', '==', 'Active'), orderBy('title', 'asc')) : null, [db]);
  const { data: services, isLoading: sLoading } = useCollection(servicesQuery);

  // Fetch Products
  const productsQuery = useMemoFirebase(() => 
    db ? query(collection(db, 'products'), where('status', '==', 'Active'), orderBy('name', 'asc')) : null, [db]);
  const { data: products, isLoading: pLoading } = useCollection(productsQuery);

  // Unified Categories
  const CATEGORIES = [
    { id: 'All', label: t('cat_all') },
    { id: 'Cleaning', label: t('cat_cleaning') },
    { id: 'Maintenance', label: t('cat_maintenance') },
    { id: 'Repair', label: t('cat_repair') },
    { id: 'Tools', label: t('cat_tools') }
  ];

  // Filtered Results
  const filteredOfferings = useMemo(() => {
    let combined: any[] = [];
    if (services) combined = [...combined, ...services.map(s => ({ ...s, itemType: 'service' }))];
    if (products) combined = [...combined, ...products.map(p => ({ ...p, itemType: 'product' }))];

    return combined.filter(item => {
      const matchesSearch = (item.title || item.name)?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'All' || 
        (activeCategory === 'Tools' ? item.itemType === 'product' : item.categoryId === activeCategory);
      
      return matchesSearch && matchesCategory;
    });
  }, [services, products, searchQuery, activeCategory]);

  const isLoading = sLoading || pLoading;

  return (
    <PublicLayout>
      <div className="bg-[#F9FAFB] min-h-screen pb-24">
        {/* Modern Header */}
        <header className="bg-white border-b py-12 md:py-16">
          <div className="container mx-auto px-4 max-w-7xl text-center space-y-8">
            <div className="space-y-3">
              <Badge className="bg-primary/10 text-primary border-none uppercase tracking-widest font-black py-1.5 px-5 rounded-full text-[10px]">
                Marketplace Catalog
              </Badge>
              <h1 className="text-4xl md:text-6xl font-black text-[#081621] font-headline tracking-tighter uppercase">
                {t('all_services_title')}
              </h1>
              <p className="text-muted-foreground text-sm md:text-lg max-w-2xl mx-auto font-medium">
                {t('all_services_subtitle')}
              </p>
            </div>

            {/* High Performance Search Bar */}
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

            {/* Category Filter Buttons */}
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

        {/* Results Grid */}
        <div className="container mx-auto px-4 max-w-7xl py-12">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <Loader2 className="animate-spin text-primary" size={48} />
              <p className="text-muted-foreground font-black uppercase tracking-widest text-[10px]">Syncing Catalog...</p>
            </div>
          ) : filteredOfferings.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
              {filteredOfferings.map((item) => (
                item.itemType === 'service' ? (
                  <div key={item.id} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100 flex flex-col relative h-full">
                    <Link href={`/service/${item.id}`} className="block relative aspect-[4/3] overflow-hidden shrink-0">
                      <Image 
                        src={item.imageUrl || 'https://picsum.photos/seed/srv/600/400'} 
                        alt={item.title || 'Service Image'} 
                        fill 
                        className="object-cover transition-transform duration-700 group-hover:scale-105" 
                      />
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-white/95 text-primary border-none shadow-md backdrop-blur-md font-black text-[8px] uppercase px-2 py-0.5 rounded-full">
                          {item.categoryId || 'General'}
                        </Badge>
                      </div>
                    </Link>
                    <div className="p-3 flex flex-col flex-1 gap-2">
                      <div className="space-y-0.5">
                        <Link href={`/service/${item.id}`} className="hover:text-primary transition-colors block">
                          <h3 className="text-[13px] md:text-sm font-bold group-hover:text-primary transition-colors line-clamp-1 leading-tight uppercase tracking-tight">
                            {item.title}
                          </h3>
                        </Link>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-black text-primary tracking-tighter">
                            ৳{(item.basePrice || 0).toLocaleString()}
                          </span>
                          <span className="text-[9px] font-black uppercase text-gray-400">{t('price_from')}</span>
                        </div>
                      </div>
                      <Button size="sm" className="w-full rounded-full font-black text-[10px] uppercase shadow-md h-9 tracking-widest transition-transform active:scale-95 mt-auto" asChild>
                        <Link href={`/service/${item.id}`}>{t('book_now')}</Link>
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
              <div className="p-6 bg-white rounded-full shadow-xl border border-gray-100">
                <Filter size={48} className="text-gray-300" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-[#081621] uppercase">No Match Found</h3>
                <p className="text-muted-foreground font-medium max-w-sm">We couldn't find any services or tools matching your search criteria. Try a different keyword or category.</p>
              </div>
              <Button 
                onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
                variant="outline" 
                className="rounded-full px-8 font-black uppercase text-[10px] tracking-widest"
              >
                Clear All Filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
