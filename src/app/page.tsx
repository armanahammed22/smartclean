
'use client';

import React, { useMemo, useState, useEffect, Suspense, memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/components/providers/language-provider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { PublicLayout } from '@/components/layout/public-layout';
import { useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc, query, where, orderBy, limit } from 'firebase/firestore';
import { 
  Smartphone, Zap, Wrench, Package, Layers, Star, TrendingUp, Calendar, Grid, 
  ShieldCheck, Award, TicketPercent, Gift, ChevronRight, Loader2, Users, Clock 
} from 'lucide-react';
import { ProductCard } from '@/components/products/product-card';
import { CampaignSection } from '@/components/campaigns/campaign-section';
import { TeamSection } from '@/components/home/team-section';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const ICONS: Record<string, any> = {
  Smartphone, Zap, Wrench, Package, Layers, Star,
  Activity: TrendingUp, Calendar, Grid, ShieldCheck,
  Award, TicketPercent, Gift, Users, Clock
};

// 🦴 Component Skeletons to prevent CLS
const GridSkeleton = ({ count = 6 }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="space-y-3">
        <Skeleton className="aspect-square w-full rounded-2xl" />
        <Skeleton className="h-4 w-3/4 rounded" />
        <Skeleton className="h-4 w-1/2 rounded" />
      </div>
    ))}
  </div>
);

/**
 * 🚀 Optimized Dynamic Section Component
 * Handles its own data fetching to allow progressive rendering
 */
const DynamicDataSection = memo(({ section, allProducts, allServices, allSubServices, cardStyles }: any) => {
  const config = section.config || {};
  const type = section.type;

  if (type === 'products_dynamic') {
    let filtered = allProducts?.filter((p: any) => p.status === 'Active') || [];
    if (config.sourceType === 'category' && config.sourceId) {
      filtered = filtered.filter((p: any) => p.categoryId === config.sourceId);
    } else if (config.sourceType === 'manual' && config.manualIds?.length) {
      filtered = filtered.filter((p: any) => config.manualIds.includes(p.id));
    }
    filtered = filtered.slice(0, config.limit || 12);
    if (!filtered.length) return null;

    return (
      <div className="container mx-auto max-w-7xl">
        <div className="flex items-center justify-between mb-8 px-2">
          <h2 className="font-black uppercase tracking-tighter text-[#081621] text-2xl md:text-4xl">{section.title}</h2>
          <Link href="/products" className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline flex items-center gap-1">See More <ChevronRight size={14}/></Link>
        </div>
        <div className={cn("grid gap-4", getGridCols(config.gridColsDesktop))}>
          {filtered.map((p: any) => <ProductCard key={p.id} product={p} customStyle={cardStyles?.productCard} />)}
        </div>
      </div>
    );
  }

  if (type === 'services_dynamic') {
    let filtered = allServices?.filter((s: any) => s.status === 'Active') || [];
    if (config.sourceType === 'category' && config.sourceId) {
      filtered = filtered.filter((s: any) => s.categoryId === config.sourceId);
    } else if (config.sourceType === 'manual' && config.manualIds?.length) {
      filtered = filtered.filter((s: any) => config.manualIds.includes(s.id));
    }
    filtered = filtered.slice(0, config.limit || 12);
    if (!filtered.length) return null;

    return (
      <div className="container mx-auto max-w-7xl">
        <div className="flex items-center justify-between mb-8 px-2">
          <h2 className="font-black uppercase tracking-tighter text-[#081621] text-2xl md:text-4xl">{section.title}</h2>
          <Link href="/services" className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline flex items-center gap-1">See More <ChevronRight size={14}/></Link>
        </div>
        <div className={cn("grid gap-4", getGridCols(config.gridColsDesktop))}>
          {filtered.map((s: any) => <ProductCard key={s.id} product={{...s, type: 'service'} as any} customStyle={cardStyles?.serviceCard} />)}
        </div>
      </div>
    );
  }

  if (type === 'sub_services_custom') {
    let filtered = allSubServices?.filter((s: any) => s.status === 'Active') || [];
    if (config.sourceType === 'manual' && config.manualIds?.length) {
      filtered = filtered.filter((s: any) => config.manualIds.includes(s.id));
    }
    filtered = filtered.slice(0, config.limit || 12);
    if (!filtered.length) return null;

    return (
      <div className="container mx-auto max-w-7xl">
        <div className="flex items-center justify-between mb-8 px-2">
          <h2 className="font-black uppercase tracking-tighter text-[#081621] text-2xl md:text-4xl">{section.title}</h2>
          <Link href="/services" className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline flex items-center gap-1">See More <ChevronRight size={14}/></Link>
        </div>
        <div className={cn("grid gap-4", getGridCols(config.gridColsDesktop))}>
          {filtered.map((s: any) => <ProductCard key={s.id} product={{...s, type: 'service'} as any} customStyle={cardStyles?.serviceCard} />)}
        </div>
      </div>
    );
  }

  return null;
});

DynamicDataSection.displayName = 'DynamicDataSection';

const getGridCols = (cols: string | undefined) => {
  const c = cols || '5';
  if (c === '2') return 'grid-cols-2';
  if (c === '3') return 'grid-cols-2 md:grid-cols-3';
  if (c === '4') return 'grid-cols-2 md:grid-cols-4';
  if (c === '6') return 'grid-cols-2 md:grid-cols-6';
  return 'grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6';
};

export default function SmartCleanHomePage() {
  const { t } = useLanguage();
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Critical Meta-Data Fetch (Render Shell)
  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'global') : null, [db]);
  const { data: settings } = useDoc(settingsRef);

  const sectionsRef = useMemoFirebase(() => db ? query(collection(db, 'homepage_sections'), orderBy('order', 'asc')) : null, [db]);
  const { data: activeLayoutSections, isLoading: layoutLoading } = useCollection(sectionsRef);

  const bannersRef = useMemoFirebase(() => db ? collection(db, 'hero_banners') : null, [db]);
  const { data: allBanners } = useCollection(bannersRef);

  const stylesRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'card_styles') : null, [db]);
  const { data: cardStyles } = useDoc(stylesRef);

  // 2. Data Pipes for dynamic sections (limited to reduce payload)
  const productsRef = useMemoFirebase(() => (db && settings?.productsEnabled !== false) ? query(collection(db, 'products'), where('status', '==', 'Active'), limit(50)) : null, [db, settings]);
  const servicesRef = useMemoFirebase(() => (db && settings?.servicesEnabled !== false) ? query(collection(db, 'services'), where('status', '==', 'Active'), limit(50)) : null, [db, settings]);
  const subServicesRef = useMemoFirebase(() => (db && settings?.servicesEnabled !== false) ? query(collection(db, 'sub_services'), where('status', '==', 'Active'), limit(50)) : null, [db, settings]);

  const { data: allProducts } = useCollection(productsRef);
  const { data: allServices } = useCollection(servicesRef);
  const { data: allSubServices } = useCollection(subServicesRef);

  // Other dynamic data
  const quickLinksRef = useMemoFirebase(() => db ? query(collection(db, 'quick_links'), orderBy('order', 'asc')) : null, [db]);
  const { data: quickLinks } = useCollection(quickLinksRef);

  const quickActionsRef = useMemoFirebase(() => db ? collection(db, 'quick_actions') : null, [db]);
  const { data: quickActions } = useCollection(quickActionsRef);

  const siteStatsRef = useMemoFirebase(() => db ? query(collection(db, 'site_stats'), orderBy('order', 'asc')) : null, [db]);
  const { data: siteStats } = useCollection(siteStatsRef);

  const topNavRef = useMemoFirebase(() => db ? query(collection(db, 'top_nav_categories'), orderBy('order', 'asc')) : null, [db]);
  const { data: topCategories } = useCollection(topNavRef);

  const couponsRef = useMemoFirebase(() => db ? collection(db, 'coupons') : null, [db]);
  const { data: coupons } = useCollection(couponsRef);

  // Derived above-the-fold content
  const mainBanners = useMemo(() => allBanners?.filter(b => b.isActive && (b.type === 'main' || !b.type)).sort((a, b) => (a.order || 0) - (b.order || 0)) || [], [allBanners]);
  const sidePromos = useMemo(() => allBanners?.filter(b => b.isActive && b.type === 'side').sort((a, b) => (a.order || 0) - (b.order || 0)) || [], [allBanners]);

  if (!mounted) return null;

  return (
    <PublicLayout>
      <div className="flex flex-col bg-[#F8FAFC] min-h-screen pb-24 page-transition-fade">
        
        {/* 🎯 HERO SECTION - PRIORITY RENDER */}
        <section className="w-full px-0 lg:px-4 lg:mt-4 mb-6">
          <div className="flex flex-row flex-nowrap gap-2 md:gap-4 w-full h-[200px] sm:h-[320px] max-h-[320px] overflow-hidden">
            <div className="relative overflow-hidden bg-white shadow-sm rounded-xl md:rounded-3xl h-full w-[70%] border border-gray-100">
              {mainBanners.length > 0 ? (
                <Carousel className="w-full h-full" opts={{ loop: true }}>
                  <CarouselContent className="h-full -ml-0">
                    {mainBanners.map((banner, i) => (
                      <CarouselItem key={banner.id} className="h-full basis-full relative pl-0">
                        <Link href={banner.buttonLink || '#'} className="block w-full h-full relative">
                          <Image 
                            src={banner.imageUrl || ''} 
                            alt={banner.title} 
                            fill 
                            className="object-cover" 
                            priority={i === 0} // CRITICAL: Prioritize first banner
                            sizes="(max-width: 1024px) 70vw, 982px"
                            unoptimized 
                          />
                          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex flex-col justify-center p-6 md:p-12 text-left">
                            <h2 className="text-white text-xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight mb-2 drop-shadow-xl">{banner.title}</h2>
                            <p className="text-white/90 text-xs sm:text-lg font-medium mb-4 max-w-md line-clamp-2">{banner.subtitle}</p>
                            <Button size="sm" className="w-fit rounded-full px-6 font-black uppercase text-[9px] md:text-xs" style={{ backgroundColor: banner.buttonColor }}>
                              {banner.buttonText || t('view_all')}
                            </Button>
                          </div>
                        </Link>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                </Carousel>
              ) : <Skeleton className="h-full w-full" />}
            </div>
            {sidePromos.length > 0 && (
              <div className="flex w-[30%] min-w-[100px] flex-col gap-2 md:gap-4 h-full">
                {sidePromos.slice(0, 2).map((promo, i) => (
                  <Link key={promo.id} href={promo.buttonLink || '#'} className="flex-1 relative rounded-xl md:rounded-3xl overflow-hidden shadow-sm group border border-gray-100">
                    <Image 
                      src={promo.imageUrl} 
                      alt={promo.title} 
                      fill 
                      className="object-cover transition-transform duration-700 group-hover:scale-110" 
                      priority={true}
                      sizes="(max-width: 1024px) 30vw, 400px"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent p-3 md:p-6 flex flex-col justify-end text-left">
                      <h3 className="text-white text-[10px] md:text-base font-black uppercase tracking-tight leading-tight line-clamp-2">{promo.title}</h3>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 🧩 DYNAMIC PROGRESSIVE CONTENT */}
        {layoutLoading ? (
          <div className="space-y-12">
            <SectionSkeleton />
            <SectionSkeleton />
          </div>
        ) : (
          activeLayoutSections?.map((section: any) => {
            const type = section.type;
            
            // Non-data Static/Internal Sections
            if (type === 'top_nav_links') {
              return topCategories?.length ? (
                <section key={section.id} className="px-4 py-4">
                  <div className="container mx-auto max-w-7xl flex gap-4 overflow-x-auto no-scrollbar whitespace-nowrap bg-white border p-3 rounded-2xl shadow-sm">
                    {topCategories.map(cat => (
                      <Link key={cat.id} href={cat.link || '#'} className="text-[10px] font-black uppercase text-gray-500 hover:text-primary px-3">{cat.name}</Link>
                    ))}
                  </div>
                </section>
              ) : null;
            }

            if (type === 'icon_grid') {
              return quickLinks?.length ? (
                <section key={section.id} className="px-4 py-8">
                  <div className="container mx-auto max-w-7xl grid grid-cols-4 md:grid-cols-8 gap-6">
                    {quickLinks.map(link => {
                      const Icon = ICONS[link.iconName] || Grid;
                      return (
                        <Link key={link.id} href={link.link || '#'} className="flex flex-col items-center gap-2 group">
                          <div className="relative w-12 h-12 md:w-16 md:h-16 rounded-full bg-white border shadow-sm flex items-center justify-center overflow-hidden transition-transform group-hover:scale-110">
                            {link.imageUrl ? <Image src={link.imageUrl} alt={link.label} fill className="object-cover p-2" unoptimized /> : <Icon size={24} className="text-primary" />}
                          </div>
                          <span className="text-[9px] font-black uppercase text-gray-600 truncate w-full text-center">{link.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              ) : null;
            }

            if (type === 'feature_cards') {
              return quickActions?.length ? (
                <section key={section.id} className="px-4 py-8">
                  <div className="container mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-3 gap-6">
                    {quickActions.map(action => (
                      <Link key={action.id} href={action.link || '#'}>
                        <div className={cn("h-28 rounded-[2rem] p-6 flex flex-col justify-center gap-1 shadow-xl bg-gradient-to-br text-white", action.bgGradient)}>
                           {ICONS[action.iconName] ? React.createElement(ICONS[action.iconName], { size: 24, className: "opacity-40" }) : <Zap size={24} className="opacity-40"/>}
                           <h3 className="text-lg font-black uppercase tracking-tight">{action.title}</h3>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              ) : null;
            }

            if (type === 'trust_stats') {
              return (
                <section key={section.id} className="px-4 py-6 bg-white border-y">
                  <div className="container mx-auto max-w-7xl flex flex-wrap justify-center gap-x-12 gap-y-6">
                    {(siteStats?.length ? siteStats : []).map((stat: any, i: number) => {
                      const Icon = ICONS[stat.icon] || Zap;
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <div className={cn("p-2.5 rounded-xl", stat.bg, stat.color)}><Icon size={18} strokeWidth={3}/></div>
                          <div>
                            <p className="text-sm font-black text-gray-900">{stat.value}</p>
                            <p className="text-[8px] font-black uppercase text-gray-400 tracking-widest">{stat.label}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            }

            if (type === 'team_grid') return <TeamSection key={section.id} />;
            if (type === 'campaign') return <CampaignSection key={section.id} />;

            // ⚡ Data Intensive Sections: Optimized with progressive loading
            return (
              <section key={section.id} className="px-4 py-12">
                <DynamicDataSection 
                  section={section} 
                  allProducts={allProducts} 
                  allServices={allServices} 
                  allSubServices={allSubServices}
                  cardStyles={cardStyles}
                />
              </section>
            );
          })
        )}
      </div>
    </PublicLayout>
  );
}

const SectionSkeleton = () => (
  <div className="container mx-auto px-4 max-w-7xl space-y-6">
    <Skeleton className="h-10 w-64 rounded-xl" />
    <GridSkeleton count={6} />
  </div>
);
