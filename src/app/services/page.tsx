
'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { PublicLayout } from '@/components/layout/public-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, Search, Filter, X, Wrench, Package, Star, Calendar } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/components/providers/language-provider';
import { ProductCard } from '@/components/products/product-card';
import { cn } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

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

  // 🚀 OPTIMIZATION: Limited to 100 items per catalog read
  const servicesRef = useMemoFirebase(() => db ? query(collection(db, 'services'), where('status', '==', 'Active'), limit(100)) : null, [db]);
  const productsRef = useMemoFirebase(() => db ? query(collection(db, 'products'), where('status', '==', 'Active'), limit(100)) : null, [db]);
  const subServicesRef = useMemoFirebase(() => db ? query(collection(db, 'sub_services'), where('status', '==', 'Active'), limit(100)) : null, [db]);

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
      combined = [...combined, ...services.map(s => ({ ...s, itemType: 'service' }))];
    }
    if (products) {
      combined = [...combined, ...products.map(p => ({ ...p, itemType: 'product' }))];
    }
    if (subServices) {
      combined = [...combined, ...subServices.map(sub => ({ 
        ...sub, 
        title: sub.name, 
        basePrice: sub.price, 
        itemType: 'service',
        isAddOn: true 
      }))];
    }

    return combined.filter(item => {
      const nameMatch = (item.title || item.name || '').toLowerCase();
      const queryText = searchQuery.toLowerCase();
      const matchesSearch = nameMatch.includes(queryText);
      
      const matchesCategory = activeCategory === 'All' || 
        (activeCategory === 'Tools' ? item.itemType === 'product' : item.categoryId === activeCategory);
      
      return nameMatch && matchesCategory;
    });
  }, [services, products, subServices, searchQuery, activeCategory, t]);

  const isLoading = sLoading || pLoading || subLoading;

  if (!mounted) return null;

  return (
    <div className="bg-[#F9FAFB] min-h-screen pb-24 page-transition-fade">
      <header className="bg-white border-b py-10 md:py-12">
        <div className="container mx-auto px-4 max-w-7xl text-center space-y-6">
          <div className="space-y-2">
            <Badge className="bg-primary/10 text-primary border-none uppercase tracking-widest font-black py-1 px-4 rounded-full text-[10px]">
              Marketplace Catalog
            </Badge>
            <h1 className="text-3xl md:text-5xl font-black text-[#081621] font-headline tracking-tighter uppercase">
              {searchQuery ? `Results for "${searchQuery}"` : t('all_services_title')}
            </h1>
          </div>

          <div className="max-w-2xl mx-auto relative group">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
              <Search size={18} />
            </div>
            <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('find_service_placeholder')}
              className="h-12 md:h-14 pl-12 pr-12 rounded-full border-gray-200 bg-white shadow-lg shadow-gray-100/50 focus:ring-primary focus:border-primary text-base font-medium transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-5 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={16} className="text-gray-400" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {CATEGORIES.map((cat) => (
              <Button
                key={cat.id}
                variant={activeCategory === cat.id ? 'default' : 'outline'}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "rounded-full px-5 h-9 font-black text-[10px] uppercase tracking-widest transition-all",
                  activeCategory === cat.id 
                    ? "shadow-md shadow-primary/20 scale-105" 
                    : "bg-white hover:bg-primary/5 hover:border-primary/30"
                )}
              >
                {cat.label}
              </Button>
            ))}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 max-w-7xl py-10">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(i => (
              <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
            ))}
          </div>
        ) : filteredOfferings.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 animate-in fade-in duration-500">
            {filteredOfferings.map((item) => (
              <div key={item.id} className="h-full">
                <ProductCard product={item as any} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-6">
            <Filter size={40} className="text-gray-300" />
            <h3 className="text-xl font-black text-[#081621] uppercase">No Match Found</h3>
            <Button onClick={() => { setSearchQuery(''); setActiveCategory('All'); }} variant="outline" className="rounded-full px-6 font-black uppercase text-[10px]">Clear Filters</Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ServicesListPage() {
  return (
    <PublicLayout>
      <Suspense fallback={
        <div className="container mx-auto px-4 py-16 max-w-7xl">
           <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />)}
          </div>
        </div>
      }>
        <ServicesContent />
      </Suspense>
    </PublicLayout>
  );
}
