'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/components/providers/language-provider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PublicLayout } from '@/components/layout/public-layout';
import { useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { 
  Wrench, 
  ChevronRight, 
  Loader2, 
  Sparkles,
  Zap,
  LayoutGrid,
  Star,
  Droplets,
  Wind,
  Armchair,
  Briefcase,
  Smartphone,
  ShieldCheck,
  Award,
  Clock,
  Users,
  TrendingUp,
  Package,
  ShoppingBag
} from 'lucide-react';
import { ProductCard } from '@/components/products/product-card';
import { FlashSaleCard } from '@/components/products/flash-sale-card';
import { CampaignSection } from '@/components/campaigns/campaign-section';
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem
} from '@/components/ui/carousel';
import { cn } from '@/lib/utils';
import { CountdownTimer } from '@/components/campaigns/countdown-timer';

// Default layout used if the database collection is empty
const DEFAULT_LAYOUT = [
  { id: 'def-hero', type: 'hero', isActive: true, order: 0 },
  { id: 'def-cats', type: 'categories', isActive: true, order: 1 },
  { id: 'def-flash', type: 'flash_deals', isActive: true, order: 2 },
  { id: 'def-camp', type: 'campaign', isActive: true, order: 3 },
  { id: 'def-srv-feat', type: 'services_featured', title: 'Our Featured Services', isActive: true, order: 4 },
  { id: 'def-prod-new', type: 'products_new', title: 'Latest Arrivals', isActive: true, order: 5 },
  { id: 'def-trust', type: 'trust_stats', isActive: true, order: 6 }
];

const getCategoryStyles = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('clean')) return { bg: 'bg-blue-50', color: 'text-blue-600', icon: Droplets };
  if (n.includes('ac')) return { bg: 'bg-cyan-50', color: 'text-cyan-600', icon: Wind };
  if (n.includes('sofa') || n.includes('furniture')) return { bg: 'bg-orange-50', color: 'text-orange-600', icon: Armchair };
  if (n.includes('repair')) return { bg: 'bg-red-50', color: 'text-red-600', icon: Wrench };
  if (n.includes('office')) return { bg: 'bg-indigo-50', color: 'text-indigo-600', icon: Briefcase };
  if (n.includes('device') || n.includes('gadget')) return { bg: 'bg-purple-50', color: 'text-purple-600', icon: Smartphone };
  if (n.includes('health') || n.includes('sanit')) return { bg: 'bg-green-50', color: 'text-green-600', icon: ShieldCheck };
  return { bg: 'bg-gray-50', color: 'text-gray-600', icon: LayoutGrid };
};

export default function SmartCleanHomePage() {
  const { t } = useLanguage();
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch collections
  const sectionsRef = useMemoFirebase(() => db ? collection(db, 'homepage_sections') : null, [db]);
  const bannersRef = useMemoFirebase(() => db ? collection(db, 'hero_banners') : null, [db]);
  const topNavRef = useMemoFirebase(() => db ? collection(db, 'top_nav_categories') : null, [db]);
  const productsRef = useMemoFirebase(() => db ? collection(db, 'products') : null, [db]);
  const servicesRef = useMemoFirebase(() => db ? collection(db, 'services') : null, [db]);
  const flashSaleRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'flash_sale') : null, [db]);
  const brandsRef = useMemoFirebase(() => db ? collection(db, 'brands') : null, [db]);

  const { data: allSectionsRaw, isLoading: layoutLoading } = useCollection(sectionsRef);
  const { data: allBanners } = useCollection(bannersRef);
  const { data: allTopNav } = useCollection(topNavRef);
  const { data: allProducts } = useCollection(productsRef);
  const { data: allServices } = useCollection(servicesRef);
  const { data: flashSaleConfig } = useDoc(flashSaleRef);
  const { data: allBrands } = useCollection(brandsRef);

  // Filter and Sort layout in memory
  const layoutSections = useMemo(() => {
    if (layoutLoading) return [];
    if (!allSectionsRaw || allSectionsRaw.length === 0) return DEFAULT_LAYOUT;
    
    return [...allSectionsRaw]
      .filter(s => s.isActive === true)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [allSectionsRaw, layoutLoading]);

  const mainBanners = useMemo(() => allBanners?.filter(b => b.isActive && (b.type === 'main' || !b.type)).sort((a, b) => (a.order || 0) - (b.order || 0)) || [], [allBanners]);
  const categories = useMemo(() => allTopNav?.sort((a, b) => (a.order || 0) - (b.order || 0)) || [], [allTopNav]);

  const renderSection = (section: any) => {
    const config = section.config || {};
    const sectionType = section.type;
    
    const getFilteredProducts = () => {
      let feed = allProducts?.filter(p => p.status === 'Active') || [];
      if (sectionType === 'products_featured' || config.dataSource === 'popular') feed = feed.filter(p => p.isPopular);
      if (sectionType === 'products_new' || config.dataSource === 'latest') feed = [...feed].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      if (sectionType === 'products_trending') feed = [...feed].sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0));
      return feed.slice(0, config.limit || 10);
    };

    const getFilteredServices = () => {
      let feed = allServices?.filter(s => s.status === 'Active') || [];
      if (sectionType === 'services_featured') feed = feed.filter(s => s.isPopular);
      if (sectionType === 'services_popular' || sectionType === 'services_top_rated') feed = [...feed].sort((a, b) => (b.rating || 0) - (a.rating || 0));
      return feed.slice(0, 12);
    };

    switch (sectionType) {
      case 'hero':
        return (
          <section key={section.id} className="bg-white pb-4 lg:bg-transparent lg:mt-4">
            <div className="container mx-auto px-0 lg:px-4">
              <div className="relative aspect-[21/11] md:aspect-[982/400] w-full lg:rounded-2xl overflow-hidden bg-gray-100 shadow-sm">
                {mainBanners.length > 0 ? (
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
                                {banner.buttonText || t('view_all')}
                              </Button>
                            </div>
                          </Link>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                  </Carousel>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary/20"><Package size={60} /></div>
                )}
              </div>
            </div>
          </section>
        );

      case 'categories':
        return (
          <section key={section.id} className="px-2 md:px-4 py-6">
            <div className="container mx-auto max-w-7xl">
              <div className="bg-white rounded-3xl p-4 md:p-6 shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex gap-4 md:gap-8 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory">
                  {categories.map((cat) => {
                    const styles = getCategoryStyles(cat.name);
                    const DisplayIcon = styles.icon;
                    return (
                      <Link 
                        key={cat.id} 
                        href={cat.link || `/services?search=${cat.name}`} 
                        className="flex flex-col items-center gap-3 group shrink-0 basis-[calc(25%-0.75rem)] sm:basis-[calc(16.66%-1rem)] md:basis-[calc(12.5%-1.2rem)] snap-start"
                      >
                        <div className={cn(
                          "w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center p-3 border shadow-sm transition-all duration-300 group-hover:scale-110",
                          styles.bg,
                          styles.color,
                          "border-transparent group-hover:border-white group-hover:shadow-md"
                        )}>
                          {cat.imageUrl ? (
                            <div className="relative w-full h-full">
                              <Image src={cat.imageUrl} alt={cat.name} fill className="object-contain" unoptimized />
                            </div>
                          ) : (
                            <DisplayIcon size={28} />
                          )}
                        </div>
                        <span className="text-[9px] md:text-[10px] font-black text-center text-gray-600 uppercase tracking-tighter truncate w-full group-hover:text-primary">
                          {cat.name}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        );

      case 'flash_deals':
        const isFlashActive = flashSaleConfig?.isActive;
        if (!isFlashActive) return null;
        const flashProductIds = flashSaleConfig?.productIds || [];
        const flashProducts = allProducts?.filter(p => flashProductIds.includes(p.id) && p.status === 'Active') || [];
        if (flashProducts.length === 0) return null;

        return (
          <section key={section.id} className="w-full py-4 md:py-6 px-3 md:px-4">
            <div className="bg-white overflow-hidden shadow-md rounded-3xl border border-gray-100">
              <div className="container mx-auto max-w-7xl">
                <div className="p-4 md:p-6 flex items-center justify-between border-b">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-500 rounded-xl text-white"><Zap size={18} fill="currentColor" /></div>
                    <div className="flex flex-col">
                      <span className="text-sm md:text-lg font-black text-[#081621] uppercase tracking-tight">{flashSaleConfig.title || t('flash_sale')}</span>
                      {flashSaleConfig.endDate && (
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-bold text-gray-400 uppercase">{t('ends_in')}</span>
                          <CountdownTimer endDate={flashSaleConfig.endDate} variant="dark" />
                        </div>
                      )}
                    </div>
                  </div>
                  <Link href="/products" className="flex items-center gap-1 text-[10px] font-black text-primary uppercase tracking-widest hover:underline">
                    {t('cat_all').toUpperCase()} <ChevronRight size={14} />
                  </Link>
                </div>
                <div className="p-4 md:p-6">
                  <div className="flex gap-3 md:gap-6 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory pb-2">
                    {flashProducts.map(p => (
                      <div key={p.id} className="w-[165px] md:w-[200px] shrink-0 snap-start">
                        <FlashSaleCard product={p} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        );

      case 'campaign':
        return <CampaignSection key={section.id} />;

      case 'services':
      case 'services_featured':
      case 'services_popular':
      case 'services_trending':
      case 'services_top_rated':
      case 'services_new':
        const displayServices = getFilteredServices();
        if (displayServices.length === 0) return null;
        return (
          <section key={section.id} className="px-3 md:px-4 py-8 md:py-12 bg-white/50">
            <div className="container mx-auto max-w-7xl">
              <div className="flex items-center justify-between mb-8 px-2">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary/10 rounded-xl text-primary"><Sparkles size={24} fill="currentColor" /></div>
                  <h2 className="text-xl md:text-2xl font-black uppercase text-[#081621] tracking-tighter">{section.title}</h2>
                </div>
                <Link href="/services" className="text-[10px] md:text-xs font-black uppercase text-primary tracking-widest flex items-center gap-1.5 bg-white border border-primary/20 px-5 py-2.5 rounded-full hover:bg-primary hover:text-white transition-all shadow-sm">
                  {t('view_all').toUpperCase()} <ChevronRight size={14} />
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-8">
                {displayServices.map(s => <ServiceGridItem key={s.id} s={s} />)}
              </div>
            </div>
          </section>
        );

      case 'products_feed':
      case 'products_featured':
      case 'products_trending':
      case 'products_new':
        const displayProducts = getFilteredProducts();
        if (displayProducts.length === 0) return null;
        return (
          <section key={section.id} className="px-3 md:px-4 py-8 md:py-12">
            <div className="container mx-auto max-w-7xl">
              <div className="flex items-center justify-between mb-8 px-2">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-accent/10 rounded-xl text-accent"><TrendingUp size={24} fill="currentColor" /></div>
                  <h2 className="text-xl md:text-2xl font-black uppercase text-[#081621] tracking-tighter">{section.title}</h2>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-8">
                {displayProducts.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            </div>
          </section>
        );

      case 'brands_grid':
        const brands = allBrands?.slice(0, 12) || [];
        return (
          <section key={section.id} className="px-4 py-12 bg-white">
            <div className="container mx-auto max-w-7xl">
              <h2 className="text-lg font-black uppercase text-[#081621] mb-8 text-center tracking-widest">{section.title}</h2>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                {brands.map(brand => (
                  <div key={brand.id} className="aspect-video bg-gray-50 rounded-2xl flex items-center justify-center p-4 grayscale hover:grayscale-0 transition-all border border-transparent hover:border-gray-100 hover:shadow-sm cursor-pointer">
                    <span className="font-black text-gray-300 uppercase text-[10px]">{brand.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );

      case 'trust_stats':
        return (
          <section key={section.id} className="py-12 md:py-16 bg-white">
            <div className="container mx-auto px-4 max-w-7xl">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-10">
                {[
                  { label: "Happy Clients", val: "15k+", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
                  { label: "Pro Technicians", val: "250+", icon: Award, color: "text-amber-600", bg: "bg-amber-50" },
                  { label: "Service Hours", val: "50k+", icon: Clock, color: "text-green-600", bg: "bg-green-50" },
                  { label: "Trust Score", val: "4.9/5", icon: Star, color: "text-rose-600", bg: "bg-rose-50" }
                ].map((stat, i) => (
                  <div key={i} className="flex flex-col items-center text-center space-y-3">
                    <div className={cn("p-4 rounded-2xl transition-transform hover:scale-110 shadow-sm", stat.bg, stat.color)}>
                      <stat.icon size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h4 className="text-2xl md:text-3xl font-black text-[#081621] tracking-tighter">{stat.val}</h4>
                      <p className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em] mt-1">{stat.label}</p>
                    </div>
                  </div>
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
          <div className="flex-1 flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 className="animate-spin text-primary" size={48} />
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Syncing Marketplace...</p>
          </div>
        ) : (
          layoutSections.map(renderSection)
        )}
      </div>
    </PublicLayout>
  );
}

function ServiceGridItem({ s }: { s: any }) {
  const { t } = useLanguage();
  const bookCount = Math.floor(Math.random() * 500) + 10;

  return (
    <div className="relative group bg-white rounded-2xl md:rounded-[1.5rem] overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 border border-gray-100 flex flex-col h-full hover:-translate-y-1">
      <Link href={`/service/${s.id}`} className="block h-full flex flex-col">
        <div className="p-2 md:p-3 shrink-0">
          <div className="relative aspect-square overflow-hidden rounded-xl md:rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
            {s.imageUrl ? (
              <Image src={s.imageUrl} alt={s.title} fill className="object-cover transition-transform duration-700 group-hover:scale-110" unoptimized />
            ) : (
              <Wrench size={32} className="text-gray-200" />
            )}
            <div className="absolute bottom-2 left-2">
              <Badge className="bg-white/95 text-primary border-none shadow-md backdrop-blur-md font-black text-[7px] md:text-[9px] uppercase px-1.5 py-0.5 rounded-full">
                {s.categoryId || 'General'}
              </Badge>
            </div>
          </div>
        </div>

        <div className="p-3 md:p-4 flex flex-col flex-1 gap-1 pt-0">
          <h3 className="text-[12px] md:text-sm font-black group-hover:text-primary transition-colors line-clamp-1 leading-tight uppercase tracking-tight text-gray-900">
            {s.title}
          </h3>
          <div className="mt-auto space-y-2">
            <p className="text-lg md:text-xl font-black text-primary tracking-tighter leading-none">
              <span className="text-[9px] md:text-xs font-bold mr-0.5">৳</span>
              {(s.basePrice || 0).toLocaleString()}
            </p>
            <div className="flex items-center justify-between text-[9px] md:text-[10px] font-bold">
              <div className="flex items-center gap-1 text-amber-400">
                <Star size={12} fill="currentColor" />
                <span className="font-black text-gray-600">{s.rating || '4.8'}</span>
              </div>
              <span className="uppercase tracking-widest text-[8px] md:text-[9px] font-black text-gray-400">{bookCount} {t('book')}</span>
            </div>
            <Button size="sm" className="w-full rounded-xl font-black text-sm md:text-base uppercase shadow-xl h-10 md:h-11 tracking-tighter transition-all active:scale-95 bg-primary hover:bg-primary/90 text-white border-none mt-1">
              {t('book_now')}
            </Button>
          </div>
        </div>
      </Link>
    </div>
  );
}
