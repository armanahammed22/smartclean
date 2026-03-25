
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
  Layout as LayoutIcon,
  ZapIcon,
  Star
} from 'lucide-react';
import { ProductCard } from '@/components/products/product-card';
import { FlashSaleCard } from '@/components/products/flash-sale-card';
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem
} from '@/components/ui/carousel';
import { cn } from '@/lib/utils';
import { CampaignSection } from '@/components/campaigns/campaign-section';
import { CountdownTimer } from '@/components/campaigns/countdown-timer';
import { Card, CardContent } from '@/components/ui/card';

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
              <div className="relative aspect-[21/11] md:aspect-[982/400] w-full lg:rounded-2xl overflow-hidden bg-gray-100 shadow-sm">
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
          <section key={section.id} className="px-4 py-6 md:py-10">
            <div className="container mx-auto max-w-7xl">
              <div className="app-card p-4 md:p-6 shadow-md border-gray-50">
                <Carousel className="w-full">
                  <CarouselContent className="-ml-0">
                    {categoryChunks.map((chunk, idx) => (
                      <CarouselItem key={idx} className="pl-0 basis-full">
                        <div className="grid grid-cols-4 grid-rows-2 gap-y-6 gap-x-4">
                          {chunk.map((cat) => (
                            <Link key={cat.id} href={cat.link || `/services?search=${cat.name}`} className="flex flex-col items-center gap-2 group app-button">
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
          <section key={section.id} className="w-full py-4 md:py-6">
            <div className="bg-[#1E5F7A] overflow-hidden shadow-xl border-y border-white/5">
              <div className="container mx-auto max-w-7xl">
                <div className="p-4 md:p-8 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="p-1 bg-amber-400 rounded text-[#1E5F7A]"><Zap size={14} fill="currentColor" /></div>
                        <span className="text-[10px] md:text-xs font-black text-white uppercase tracking-[0.2em]">{flashSaleConfig.title || 'Flash Sale'}</span>
                      </div>
                      <CountdownTimer endDate={flashSaleConfig.endDate} variant="light" />
                    </div>
                  </div>
                  <Link href="/products" className="flex items-center gap-1.5 text-[9px] md:text-[10px] font-black text-white uppercase tracking-widest hover:opacity-80 transition-opacity bg-white/10 px-3 py-1.5 rounded-full">
                    ALL <ChevronRight size={12} className="text-amber-400" />
                  </Link>
                </div>
                
                <div className="px-2 md:px-8 pb-6 md:pb-8">
                  {/* Single Row Horizontal Scrolling Container with Snap logic */}
                  <div className="flex gap-2 md:gap-4 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory pb-2">
                    {flashProducts.map(p => (
                      <div 
                        key={p.id} 
                        className="w-[calc(33.33%-0.5rem)] sm:w-[calc(25%-0.75rem)] lg:w-[calc(16.66%-1rem)] shrink-0 snap-start"
                      >
                        <FlashSaleCard product={p} />
                      </div>
                    ))}
                  </div>
                  {flashProducts.length === 0 && (
                    <div className="w-full py-12 text-center text-white/40 italic text-sm">
                      Coming Soon...
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
            <div className="container mx-auto max-w-7xl">
              <div className="flex items-center justify-between mb-6 px-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-xl text-primary"><Wrench size={20} /></div>
                  <h2 className="text-xl font-black uppercase text-[#081621] tracking-tight">{section.title}</h2>
                </div>
                <Link href="/services" className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-1.5">
                  ALL <ChevronRight size={14} className="bg-primary/10 rounded-full" />
                </Link>
              </div>
              <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                {activeServices.map(s => (
                  <Link key={s.id} href={`/service/${s.id}`} className="group relative aspect-[4/3] w-[220px] md:w-[280px] shrink-0 block active:scale-95 transition-transform rounded-[2rem] overflow-hidden shadow-lg border border-white">
                    <Image src={s.imageUrl || ''} alt={s.title} fill className="object-cover group-hover:scale-110 transition-transform duration-700" unoptimized />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-5">
                      <h3 className="text-white font-black uppercase text-xs tracking-tight mb-1">{s.title}</h3>
                      <p className="text-primary font-black text-sm">৳{s.basePrice?.toLocaleString()}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        );

      case 'products_feed':
      case 'custom_grid':
        let feed = allProducts?.filter(p => p.status === 'Active') || [];
        if (config.dataSource === 'popular') feed = feed.filter(p => p.isPopular);
        if (config.dataSource === 'category' && config.categoryId) feed = feed.filter(p => p.categoryId === config.categoryId);
        if (config.dataSource === 'latest') feed = [...feed].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        
        feed = feed.slice(0, config.limit || 12);

        return (
          <section key={section.id} className="px-4 py-8">
            <div className="container mx-auto max-w-7xl">
              <div className="flex items-center justify-between mb-8 px-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-accent/10 rounded-xl text-accent"><Sparkles size={20} fill="currentColor" /></div>
                  <h2 className="text-xl font-black uppercase text-[#081621] tracking-tight">{section.title}</h2>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                {feed.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            </div>
          </section>
        );

      case 'testimonials':
        return (
          <section key={section.id} className="py-12 md:py-20 bg-gray-50/50">
            <div className="container mx-auto px-4 max-w-7xl">
              <div className="text-center mb-12 space-y-3">
                <Badge variant="outline" className="font-black text-primary border-primary/20 uppercase tracking-widest text-[9px] px-4 py-1 rounded-full">Reviews</Badge>
                <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-[#081621]">Satisfied Clients</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { name: "Sarah J.", text: "The team arrived on time and did an incredible job with the kitchen. Worth every Taka!", area: "Gulshan" },
                  { name: "Rafiq Ahmed", text: "I've tried many services in Dhaka, but Smart Clean's tech and professionalism are on another level.", area: "Uttara" },
                  { name: "Mila K.", text: "Highly reliable. They arrived exactly on time and finished ahead of schedule.", area: "Banani" }
                ].map((rev, i) => (
                  <Card key={i} className="border-none shadow-sm rounded-[2.5rem] bg-white p-8 space-y-6 group hover:shadow-xl transition-all">
                    <CardContent className="p-0 space-y-6">
                      <div className="flex text-amber-400 gap-0.5">
                        {[1,2,3,4,5].map(j => <Star key={j} size={14} fill="currentColor" />)}
                      </div>
                      <p className="text-gray-600 font-medium italic leading-relaxed">"{rev.text}"</p>
                      <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-black text-primary text-xs uppercase">{rev.name[0]}</div>
                        <div>
                          <p className="font-black text-[11px] text-[#081621] uppercase tracking-tight">{rev.name}</p>
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{rev.area}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
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
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Syncing Marketplace...</p>
          </div>
        ) : layoutSections && layoutSections.length > 0 ? (
          layoutSections.map(renderSection)
        ) : (
          /* 🛡️ DEFAULT FALLBACK LAYOUT */
          <>
            {renderSection({ id: 'def-hero', type: 'hero', config: {} })}
            {renderSection({ id: 'def-flash', type: 'flash_deals', title: 'Flash Sale' })}
            {renderSection({ id: 'def-cats', type: 'categories', config: {} })}
            {renderSection({ id: 'def-camp', type: 'campaign', config: {} })}
            {renderSection({ 
              id: 'def-serv', 
              type: 'services', 
              title: 'Pro Services',
              config: { layout: 'grid', itemsPerRow: 4, limit: 8 } 
            })}
            {renderSection({ 
              id: 'def-feed', 
              type: 'products_feed', 
              title: 'Just For You',
              config: { dataSource: 'latest', limit: 12 } 
            })}
          </>
        )}
      </div>
    </PublicLayout>
  );
}
