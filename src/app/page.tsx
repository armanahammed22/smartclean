
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/components/providers/language-provider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PublicLayout } from '@/components/layout/public-layout';
import { useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, orderBy, doc } from 'firebase/firestore';
import { 
  Wrench, 
  ChevronRight, 
  Loader2, 
  Sparkles,
  Zap,
  LayoutGrid,
  Layout as LayoutIcon
} from 'lucide-react';
import { ProductCard } from '@/components/products/product-card';
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem
} from '@/components/ui/carousel';
import { cn } from '@/lib/utils';
import { CampaignSection } from '@/components/campaigns/campaign-section';
import { CountdownTimer } from '@/components/campaigns/countdown-timer';

export default function SmartCleanHomePage() {
  const { t } = useLanguage();
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Fetch Layout Sections
  const sectionsQuery = useMemoFirebase(() => 
    db ? query(collection(db, 'homepage_sections'), where('isActive', '==', true), orderBy('order', 'asc')) : null, [db]);
  const { data: layoutSections, isLoading: layoutLoading } = useCollection(sectionsQuery);

  // 2. Fetch Base Data for sections
  const bannersRef = useMemoFirebase(() => db ? collection(db, 'hero_banners') : null, [db]);
  const topNavRef = useMemoFirebase(() => db ? collection(db, 'top_nav_categories') : null, [db]);
  const productsRef = useMemoFirebase(() => db ? collection(db, 'products') : null, [db]);
  const servicesRef = useMemoFirebase(() => db ? collection(db, 'services') : null, [db]);
  const flashSaleRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'flash_sale') : null, [db]);

  const { data: allBanners } = useCollection(bannersRef);
  const { data: allTopNav } = useCollection(topNavRef);
  const { data: allProducts } = useCollection(productsRef);
  const { data: allServices } = useCollection(servicesRef);
  const { data: flashSaleConfig } = useDoc(flashSaleRef);

  const mainBanners = useMemo(() => allBanners?.filter(b => b.isActive && (b.type === 'main' || !b.type)).sort((a, b) => (a.order || 0) - (b.order || 0)) || [], [allBanners]);

  const categoryChunks = useMemo(() => {
    if (!allTopNav) return [];
    const sorted = [...allTopNav].sort((a, b) => (a.order || 0) - (b.order || 0));
    const chunks = [];
    for (let i = 0; i < sorted.length; i += 8) chunks.push(sorted.slice(i, i + 8));
    return chunks;
  }, [allTopNav]);

  const renderSection = (section: any) => {
    const config = section.config || {};
    
    switch (section.type) {
      case 'hero':
        return (
          <section key={section.id} className="bg-white pb-4 lg:bg-transparent lg:mt-4">
            <div className="container mx-auto px-0 lg:px-4">
              <div className="relative aspect-[21/11] md:aspect-[982/400] w-full lg:rounded-2xl overflow-hidden bg-gray-100">
                {mainBanners.length > 0 && (
                  <Carousel className="w-full h-full" opts={{ loop: true }}>
                    <CarouselContent className="h-full -ml-0">
                      {mainBanners.map((banner) => (
                        <CarouselItem key={banner.id} className="h-full basis-full relative pl-0">
                          <Link href={banner.buttonLink || '#'} className="block w-full h-full relative">
                            <Image src={banner.imageUrl || ''} alt={banner.title} fill className="object-cover" priority unoptimized />
                            <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent flex flex-col justify-center p-6 md:p-12">
                              <h2 className="text-white text-xl md:text-4xl font-black uppercase tracking-tight mb-1 drop-shadow-md">{banner.title}</h2>
                              <p className="text-white/90 text-[10px] md:text-lg font-medium mb-4 max-w-[180px] md:max-w-md line-clamp-2">{banner.subtitle}</p>
                              <Button size="sm" className="w-fit h-8 md:h-10 rounded-full px-6 font-black uppercase text-[9px]" style={{ backgroundColor: banner.buttonColor }}>
                                {banner.buttonText || 'Discover'}
                              </Button>
                            </div>
                          </Link>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                  </Carousel>
                )}
              </div>
            </div>
          </section>
        );

      case 'categories':
        return (
          <section key={section.id} className="px-4 py-10">
            <div className="app-card p-4 md:p-6">
              <Carousel className="w-full">
                <CarouselContent className="-ml-0">
                  {categoryChunks.map((chunk, idx) => (
                    <CarouselItem key={idx} className="pl-0 basis-full">
                      <div className="grid grid-cols-4 grid-rows-2 gap-y-6 gap-x-4">
                        {chunk.map((cat) => (
                          <Link key={cat.id} href={cat.link || `/services?category=${cat.name}`} className="flex flex-col items-center gap-2 group app-button">
                            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center p-3 border border-gray-50 shadow-sm group-hover:bg-primary/10 transition-colors">
                              {cat.imageUrl ? <div className="relative w-full h-full"><Image src={cat.imageUrl} alt={cat.name} fill className="object-contain" unoptimized /></div> : <LayoutGrid size={20} className="text-gray-400" />}
                            </div>
                            <span className="text-[9px] font-black text-center text-gray-600 uppercase tracking-tighter truncate w-full">{cat.name}</span>
                          </Link>
                        ))}
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            </div>
          </section>
        );

      case 'campaign':
        return <CampaignSection key={section.id} />;

      case 'flash_deals':
        const isFlashActive = flashSaleConfig?.isActive && new Date(flashSaleConfig.endDate) > new Date();
        if (!isFlashActive) return null;

        const flashProductIds = flashSaleConfig?.productIds || [];
        const flashProducts = allProducts?.filter(p => flashProductIds.includes(p.id) && p.status === 'Active') || [];

        return (
          <section key={section.id} className="px-4 py-6">
            <div className="app-card border-none bg-[#081621] text-white shadow-2xl overflow-hidden rounded-[2.5rem]">
              <div className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border-b border-white/10 bg-gradient-to-r from-[#081621] to-[#1a2533]">
                <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
                  <div className="flex items-center gap-3">
                    <div className="bg-amber-400 p-2.5 rounded-2xl text-black shadow-lg animate-pulse">
                      <Zap size={24} fill="currentColor" />
                    </div>
                    <div>
                      <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter italic">
                        {flashSaleConfig?.title || 'Flash Sale'}
                      </h2>
                      <p className="text-[9px] font-black uppercase tracking-widest text-amber-400/80">Exclusive Offers</p>
                    </div>
                  </div>
                  <div className="h-10 w-px bg-white/10 hidden md:block" />
                  <div className="flex flex-col items-center md:items-start gap-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Ends In:</span>
                    <CountdownTimer endDate={flashSaleConfig.endDate} variant="light" />
                  </div>
                </div>
                <Button variant="outline" className="rounded-full bg-white/5 border-white/10 text-white font-black uppercase text-[10px] tracking-widest px-8 h-11 hover:bg-white/10" asChild>
                  <Link href="/products">View All Deals</Link>
                </Button>
              </div>
              <div className="p-6 md:p-10">
                <div className="flex gap-6 overflow-x-auto no-scrollbar pb-2">
                  {flashProducts.map(p => (
                    <div key={p.id} className="w-[160px] md:w-[220px] shrink-0">
                      <ProductCard product={p} isDark={true} />
                    </div>
                  ))}
                  {flashProducts.length === 0 && (
                    <div className="w-full py-12 text-center text-white/40 italic text-sm">
                      Upcoming deals...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        );

      case 'services':
        const activeServices = allServices?.filter(s => s.status === 'Active').slice(0, config.limit || 8) || [];
        return (
          <section key={section.id} className="px-4 py-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black uppercase text-[#081621] flex items-center gap-2">
                <Wrench className="text-primary" size={20} /> {section.title}
              </h2>
              <Link href="/services" className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-1">View All <ChevronRight size={14} /></Link>
            </div>
            <div className={cn("grid gap-4", (config.layout === 'grid' || !config.layout) ? `grid-cols-2 md:grid-cols-${config.itemsPerRow || 4}` : "flex overflow-x-auto no-scrollbar")}>
              {activeServices.map(s => (
                <Link key={s.id} href={`/service/${s.id}`} className="app-card group relative aspect-[4/3] block active:scale-95 transition-transform min-w-[160px]">
                  <Image src={s.imageUrl || ''} alt={s.title} fill className="object-cover" unoptimized />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex flex-col justify-end p-3">
                    <h3 className="text-white font-black uppercase text-[10px] leading-tight mb-1">{s.title}</h3>
                    <p className="text-primary font-black text-xs">৳{s.basePrice?.toLocaleString()}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );

      case 'products_feed':
      case 'custom_grid':
        let feed = allProducts?.filter(p => p.status === 'Active') || [];
        if (config.dataSource === 'popular') feed = feed.filter(p => p.isPopular);
        if (config.dataSource === 'category' && config.categoryId) feed = feed.filter(p => p.categoryId === config.categoryId);
        if (config.dataSource === 'latest') feed = [...feed].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        
        feed = feed.slice(0, config.limit || 10);

        return (
          <section key={section.id} className="px-4 py-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black uppercase text-[#081621] flex items-center gap-2">
                <Sparkles className="text-[#22C55E]" size={20} fill="currentColor" /> {section.title}
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {feed.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  if (!mounted) return null;

  return (
    <PublicLayout>
      <div className="flex flex-col bg-[#F8FAFC] min-h-screen pb-24">
        {layoutLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-32">
            <Loader2 className="animate-spin text-primary" size={48} />
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Syncing Environment...</p>
          </div>
        ) : layoutSections && layoutSections.length > 0 ? (
          layoutSections.map(renderSection)
        ) : (
          /* 🛡️ DEFAULT FALLBACK LAYOUT */
          <>
            {renderSection({ id: 'def-hero', type: 'hero', config: {} })}
            {renderSection({ id: 'def-flash', type: 'flash_deals', title: 'Flash Deals' })}
            {renderSection({ id: 'def-cats', type: 'categories', config: {} })}
            {renderSection({ id: 'def-camp', type: 'campaign', config: {} })}
            {renderSection({ 
              id: 'def-serv', 
              type: 'services', 
              title: 'Recommended Services',
              config: { layout: 'grid', itemsPerRow: 4, limit: 8 } 
            })}
            {renderSection({ 
              id: 'def-feed', 
              type: 'products_feed', 
              title: 'New Arrivals',
              config: { dataSource: 'latest', limit: 10 } 
            })}
          </>
        )}
      </div>
    </PublicLayout>
  );
}
