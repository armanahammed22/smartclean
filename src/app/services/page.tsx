
'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { PublicLayout } from '@/components/layout/public-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, Search, Filter, X, Wrench, Package } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/components/providers/language-provider';
import { ProductCard } from '@/components/products/product-card';
import { cn } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';

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

  // Fetch collections
  const servicesRef = useMemoFirebase(() => db ? collection(db, 'services') : null, [db]);
  const productsRef = useMemoFirebase(() => db ? collection(db, 'products') : null, [db]);
  const subServicesRef = useMemoFirebase(() => db ? collection(db, 'sub_services') : null, [db]);

  const { data: services, isLoading: sLoading } = useCollection(servicesRef);
  const { data: products, isLoading: pLoading } = useCollection(productsRef);
  const { data: subServices, isLoading: subLoading } = useCollection(subServicesRef);

  // Unified Categories
  const CATEGORIES = [
    { id: 'All', label: t('cat_all') },
    { id: 'Cleaning', label: t('cat_cleaning') },
    { id: 'Maintenance', label: t('cat_maintenance') },
    { id: 'Repair', label: t('cat_repair') },
    { id: 'Tools', label: t('cat_tools') }
  ];

  // In-Memory Filtering Logic for both Products, Services, and Sub-Services
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
      {/* Modern Header */}
      <header className="bg-white border-b py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-7xl text-center space-y-8">
          <div className="space-y-3">
            <Badge className="bg-primary/10 text-primary border-none uppercase tracking-widest font-black py-1.5 px-5 rounded-full text-[10px]">
              Marketplace Catalog
            </Badge>
            <h1 className="text-4xl md:text-6xl font-black text-[#081621] font-headline tracking-tighter uppercase">
              {searchQuery ? `Results for "${searchQuery}"` : t('all_services_title')}
            </h1>
            <p className="text-muted-foreground text-sm md:text-lg max-w-2xl mx-auto font-medium">
              Discover professional services and high-quality tools in one place.
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
                  <Link href={`/service/${item.slug || item.id}`} className="block relative aspect-[4/3] overflow-hidden shrink-0">
                    {item.imageUrl ? (
                      <Image 
                        src={item.imageUrl} 
                        alt={item.title || 'Service Image'} 
                        fill 
                        className="object-cover transition-transform duration-500 group-hover:scale-105" 
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full bg-primary/5 flex items-center justify-center text-primary/40">
                        <Wrench size={40} />
                      </div>
                    )}
                    <div className="absolute top-3 left-3 flex flex-col gap-1">
                      <Badge className="bg-white/95 text-primary border-none shadow-md backdrop-blur-md font-black text-[8px] uppercase px-2 py-0.5 rounded-full w-fit">
                        {item.categoryId || 'General'}
                      </Badge>
                      <Badge className={cn(
                        "text-white border-none shadow-md font-black text-[7px] uppercase px-2 py-0.5 rounded-full w-fit",
                        item.isAddOn ? "bg-amber-600" : "bg-blue-600"
                      )}>
                        {item.isAddOn ? 'Add-on' : 'Service'}
                      </Badge>
                    </div>
                  </Link>
                  <div className="p-3 flex flex-col flex-1 gap-2">
                    <div className="space-y-0.5">
                      <Link href={`/service/${item.slug || item.id}`} className="hover:text-primary transition-colors block">
                        <h3 className="text-[13px] md:text-sm font-bold group-hover:text-primary transition-colors line-clamp-1 leading-tight uppercase tracking-tight">
                          {item.title}
                        </h3>
                      </Link>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-black text-primary tracking-tighter">
                          ৳{(item.basePrice || 0).toLocaleString()}
                        </span>
                        <span className="text-[9px] font-black uppercase text-gray-400">
                          {item.pricingType === 'sqft' ? 'Start From' : 'Price'}
                        </span>
                      </div>
                    </div>
                    <Button size="sm" className="w-full rounded-full font-black text-[10px] uppercase shadow-md h-9 tracking-widest transition-transform active:scale-95 mt-auto" asChild>
                      <Link href={`/service/${item.slug || item.id}`}>{t('book_now')}</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div key={item.id} className="relative h-full">
                  <ProductCard product={item} />
                  <div className="absolute top-12 right-2 z-10">
                    <Badge className="bg-emerald-600 text-white border-none shadow-md font-black text-[7px] uppercase px-2 py-0.5 rounded-full">
                      Product
                    </Badge>
                  </div>
                </div>
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
              <p className="text-muted-foreground font-medium max-sm">We couldn't find any services or tools matching your search criteria.</p>
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
