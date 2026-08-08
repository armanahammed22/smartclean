
'use client';

import React, { useMemo, useState, useEffect, memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/components/providers/language-provider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

// 🦴 Reusable Skeleton Grid to prevent CLS
const GridSkeleton = ({ count = 6 }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="space-y-3 p-4 bg-white rounded-[2rem] border border-gray-100">
        <Skeleton className="aspect-square w-full rounded-2xl" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4 rounded" />
          <Skeleton className="h-4 w-1/2 rounded" />
        </div>
      </div>
    ))}
  </div>
);

/**
 * ⚡ Isolated Dynamic Data Section
 */
const DynamicDataSection = memo(({ section, cardStyles }: { section: any, cardStyles: any }) => {
  const db = useFirestore();
  const config = section.config || {};
  const type = section.type;

  const targetCol = type === 'products_dynamic' ? 'products' : (type === 'services_dynamic' ? 'services' : 'sub_services');
  
  const dataQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, targetCol), where('status', '==', 'Active'), limit(config.limit || 8));
  }, [db, targetCol, config.limit]);

  const { data: items, isLoading } = useCollection(dataQuery);

  const filteredItems = useMemo(() => {
    if (!items) return [];
    let list = [...items];
    
    if (config.sourceType === 'category' && config.sourceId) {
      list = list.filter((p: any) => p.categoryId === config.sourceId);
    } else if (config.sourceType === 'manual' && config.manualIds?.length) {
      list = list.filter((p: any) => config.manualIds.includes(p.id));
    }
    
    return list;
  }, [items, config]);

  if (isLoading) return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <Skeleton className="h-8 w-48 mb-8 rounded-lg" />
      <GridSkeleton count={6} />
    </div>
  );

  if (!filteredItems.length) return null;

  const isService = type === 'services_dynamic' || type === 'sub_services_custom';
  const targetPath = isService ? '/services' : '/products';
  const customCardStyle = isService ? cardStyles?.serviceCard : cardStyles?.productCard;

  return (
    <div className="container mx-auto max-w-7xl px-4 py-12">
      <div className="flex items-center justify-between mb-8 px-2">
        <h2 className="font-black uppercase tracking-tighter text-[#081621] text-2xl md:text-4xl">{section.title}</h2>
        <Link href={targetPath} className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline flex items-center gap-1">
          See More <ChevronRight size={14}/>
        </Link>
      </div>
      <div className={cn("grid gap-4", getGridCols(config.gridColsDesktop))}>
        {filteredItems.map((item: any) => (
          <ProductCard 
            key={item.id} 
            product={isService ? {...item, type: 'service'} as any : item} 
            customStyle={customCardStyle} 
          />
        ))}
      </div>
    </div>
  );
});

DynamicDataSection.displayName = 'DynamicDataSection';

/**
 * ⚡ Isolated Quick Links Section
 */
const QuickLinksSection = memo(() => {
  const db = useFirestore();
  const q = useMemoFirebase(() => db ? query(collection(db, 'quick_links'), orderBy('order', 'asc')) : null, [db]);
  const { data: links, isLoading } = useCollection(q);

  if (isLoading) return <div className="container mx-auto max-w-7xl px-4 py-8 grid grid-cols-4 md:grid-cols-8 gap-6">{[1,2,3,4].map(i => <Skeleton key={i} className="h-20 rounded-full" />)}</div>;
  if (!links?.length) return null;

  return (
    <section className="px-4 py-8">
      <div className="container mx-auto max-w-7xl grid grid-cols-4 md:grid-cols-8 gap-6">
        {links.map(link => {
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
  );
});
QuickLinksSection.displayName = 'QuickLinksSection';

/**
 * ⚡ Isolated Stats Section
 */
const StatsSection = memo(() => {
  const db = useFirestore();
  const q = useMemoFirebase(() => db ? query(collection(db, 'site_stats'), orderBy('order', 'asc')) : null, [db]);
  const { data: stats, isLoading } = useCollection(q);

  if (isLoading || !stats?.length) return null;

  return (
    <section className="px-4 py-6 bg-white border-y">
      <div className="container mx-auto max-w-7xl flex flex-wrap justify-center gap-x-12 gap-y-6">
        {stats.map((stat: any, i: number) => {
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
});
StatsSection.displayName = 'StatsSection';

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

  const sectionsRef = useMemoFirebase(() => db ? query(collection(db, 'homepage_sections'), orderBy('order', 'asc')) : null, [db]);
  const { data: activeLayoutSections, isLoading: layoutLoading } = useCollection(sectionsRef);

  const bannersRef = useMemoFirebase(() => db ? query(collection(db, 'hero_banners'), where('isActive', '==', true)) : null, [db]);
  const { data: allBanners } = useCollection(bannersRef);

  const stylesRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'card_styles') : null, [db]);
  const { data: cardStyles } = useDoc(stylesRef);

  const topNavRef = useMemoFirebase(() => db ? query(collection(db, 'top_nav_categories'), orderBy('order', 'asc')) : null, [db]);
  const { data: topCategories } = useCollection(topNavRef);

  const quickActionsRef = useMemoFirebase(() => db ? collection(db, 'quick_actions') : null, [db]);
  const { data: quickActions } = useCollection(quickActionsRef);

  const mainBanners = useMemo(() => allBanners?.filter(b => b.type === 'main' || !b.type).sort((a, b) => (a.order || 0) - (b.order || 0)) || [], [allBanners]);
  const sidePromos = useMemo(() => allBanners?.filter(b => b.type === 'side').sort((a, b) => (a.order || 0) - (b.order || 0)) || [], [allBanners]);

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
                            priority={i === 0} 
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
                {sidePromos.slice(0, 2).map((promo) => (
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

            if (type === 'icon_grid') return <QuickLinksSection key={section.id} />;

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

            if (type === 'trust_stats') return <StatsSection key={section.id} />;

            if (type === 'team_grid') return <TeamSection key={section.id} />;
            if (type === 'campaign') return <CampaignSection key={section.id} />;

            if (['products_dynamic', 'services_dynamic', 'sub_services_custom'].includes(type)) {
              return (
                <section key={section.id} className="py-2">
                  <DynamicDataSection 
                    section={section} 
                    cardStyles={cardStyles}
                  />
                </section>
              );
            }

            return null;
          })
        )}
      </div>
    </PublicLayout>
  );
}

const SectionSkeleton = () => (
  <div className="container mx-auto px-4 max-w-7xl space-y-8 py-10">
    <Skeleton className="h-10 w-64 rounded-xl" />
    <GridSkeleton count={5} />
  </div>
);
