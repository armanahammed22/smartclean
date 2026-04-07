
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/components/providers/language-provider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { PublicLayout } from '@/components/layout/public-layout';
import { useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { 
  Wrench, 
  ChevronRight, 
  Loader2, 
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
  ArrowRight,
  Calendar,
  Layers,
  Plus,
  Check,
  CreditCard,
  Navigation,
  Grid,
  Columns,
  ImageIcon,
  MousePointer2,
  Box
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

const ICONS: Record<string, any> = {
  Smartphone,
  Zap,
  Wrench,
  Package,
  Layers,
  Star,
  Activity: TrendingUp,
  Calendar,
  Grid,
  ShieldCheck,
  Award
};

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

  const sectionsRef = useMemoFirebase(() => db ? collection(db, 'homepage_sections') : null, [db]);
  const bannersRef = useMemoFirebase(() => db ? collection(db, 'hero_banners') : null, [db]);
  const topNavRef = useMemoFirebase(() => db ? collection(db, 'top_nav_categories') : null, [db]);
  const productsRef = useMemoFirebase(() => db ? collection(db, 'products') : null, [db]);
  const servicesRef = useMemoFirebase(() => db ? collection(db, 'services') : null, [db]);
  const subServicesRef = useMemoFirebase(() => db ? collection(db, 'sub_services') : null, [db]);
  const flashSaleRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'flash_sale') : null, [db]);
  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'global') : null, [db]);
  const gridModulesRef = useMemoFirebase(() => db ? collection(db, 'custom_grid_modules') : null, [db]);
  const plansRef = useMemoFirebase(() => db ? collection(db, 'subscription_plans') : null, [db]);
  const marketingOffersRef = useMemoFirebase(() => db ? collection(db, 'marketing_offers') : null, [db]);
  const quickLinksRef = useMemoFirebase(() => db ? collection(db, 'quick_links') : null, [db]);
  const quickActionsRef = useMemoFirebase(() => db ? collection(db, 'quick_actions') : null, [db]);

  const { data: allSectionsRaw, isLoading: layoutLoading } = useCollection(sectionsRef);
  const { data: allBanners } = useCollection(bannersRef);
  const { data: allTopNav } = useCollection(topNavRef);
  const { data: allProducts } = useCollection(productsRef);
  const { data: allServices } = useCollection(servicesRef);
  const { data: allSubServices } = useCollection(subServicesRef);
  const { data: flashSaleConfig } = useDoc(flashSaleRef);
  const { data: settings } = useDoc(settingsRef);
  const { data: gridModules } = useCollection(gridModulesRef);
  const { data: plans } = useCollection(plansRef);
  const { data: marketingOffers } = useCollection(marketingOffersRef);
  const { data: quickLinks } = useCollection(quickLinksRef);
  const { data: quickActions } = useCollection(quickActionsRef);

  const productsEnabled = settings?.productsEnabled !== false;
  const servicesEnabled = settings?.servicesEnabled !== false;

  const activeLayoutSections = useMemo(() => {
    if (layoutLoading) return [];
    return (allSectionsRaw || [])
      .filter(s => {
        if (!s.isActive) return false;
        if (!productsEnabled && (s.type === 'flash_deals' || s.type.startsWith('products_'))) return false;
        if (!servicesEnabled && (s.type.startsWith('services_') || s.type === 'sub_services_custom')) return false;
        return true;
      })
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [allSectionsRaw, layoutLoading, productsEnabled, servicesEnabled]);

  const mainBanners = useMemo(() => allBanners?.filter(b => b.isActive && (b.type === 'main' || !b.type)).sort((a, b) => (a.order || 0) - (b.order || 0)) || [], [allBanners]);
  const sidePromos = useMemo(() => allBanners?.filter(b => b.isActive && b.type === 'side').sort((a, b) => (a.order || 0) - (b.order || 0)) || [], [allBanners]);
  const topCategories = useMemo(() => allTopNav?.sort((a, b) => (a.order || 0) - (b.order || 0)) || [], [allTopNav]);

  const renderSection = (section: any) => {
    const config = section.config || {};
    const sectionType = section.type;
    
    if (sectionType === 'hero' || sectionType === 'side_promo') return null;

    switch (sectionType) {
      case 'grid_module':
        const module = gridModules?.find(m => m.id === config.moduleId);
        if (!module) return null;
        const style = module.styleConfig || {};
        const activeItems = module.items?.filter((i: any) => i.isActive) || [];
        if (activeItems.length === 0) return null;
        
        const gridCols = `grid grid-cols-${style.columnsMobile || 2} md:grid-cols-${style.columnsTablet || 3} lg:grid-cols-${style.columnsDesktop || 4}`;
        const gridGap = `gap-${Math.floor(style.gap / 4) || 4}`;

        return (
          <section key={section.id} className="px-4 py-12">
            <div className="container mx-auto max-w-7xl">
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-10" style={{ textAlign: style.textAlign || 'left' }}>{section.title || module.name}</h2>
              <div className={cn(gridCols, gridGap)}>
                {activeItems.map((item: any) => (
                  <Link key={item.id} href={item.btnLink || '#'} className="block h-full group">
                    <Card className="border-none flex flex-col h-full overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 bg-white" style={{ borderRadius: `${style.cardRadius || 24}px` }}>
                      {item.imageUrl && (
                        <div className="relative overflow-hidden bg-gray-50 shrink-0" style={{ height: `${style.imgHeight || 200}px` }}>
                          <Image src={item.imageUrl} alt={item.title} fill className="object-cover transition-transform group-hover:scale-110" unoptimized />
                          {item.badge && <Badge className="absolute top-3 left-3 bg-primary text-white border-none font-black text-[8px] uppercase px-2 py-0.5 rounded-sm shadow-lg">{item.badge}</Badge>}
                        </div>
                      )}
                      <CardContent className="p-5 flex flex-col flex-1" style={{ textAlign: style.textAlign || 'left' }}>
                        <h3 className="font-bold text-sm text-gray-800 uppercase line-clamp-2 mb-2 leading-tight">{item.title}</h3>
                        <p className="text-[11px] text-gray-500 font-medium line-clamp-3 mb-4">{item.desc}</p>
                        <div className="mt-auto pt-4 flex flex-col gap-3">
                          {item.price && <span className="font-black text-primary text-lg">৳{item.price}</span>}
                          <Button className="w-full h-10 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg" style={{ backgroundColor: style.btnBg || '#1E5F7A', color: style.btnTextColor || '#ffffff' }}>
                            {item.btnText || 'Action'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        );

      case 'top_nav_links':
        if (!topCategories.length) return null;
        return (
          <section key={section.id} className="px-4 py-6">
            <div className="container mx-auto max-w-7xl">
              <div className="bg-white border rounded-2xl p-4 shadow-sm overflow-x-auto no-scrollbar whitespace-nowrap flex gap-6">
                {topCategories.map(cat => (
                  <Link key={cat.id} href={cat.link || '#'} className="text-xs font-black uppercase tracking-widest text-gray-600 hover:text-primary transition-colors">
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        );

      case 'icon_grid':
        if (!quickLinks?.length) return null;
        return (
          <section key={section.id} className="px-4 py-8">
            <div className="container mx-auto max-w-7xl">
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-6">
                {quickLinks.map(link => {
                  const LinkIcon = ICONS[link.iconName] || Grid;
                  return (
                    <Link key={link.id} href={link.link || '#'} className="flex flex-col items-center gap-2 group">
                      <div className="relative w-12 h-12 md:w-16 md:h-16 rounded-full bg-white border shadow-sm flex items-center justify-center overflow-hidden transition-transform group-hover:scale-110">
                        {link.imageUrl ? (
                          <Image src={link.imageUrl} alt={link.label} fill className="object-cover" unoptimized />
                        ) : (
                          <LinkIcon size={24} className="text-primary" />
                        )}
                      </div>
                      <span className="text-[8px] md:text-[10px] font-black uppercase text-center text-gray-600 truncate w-full">{link.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        );

      case 'feature_cards':
        if (!quickActions?.length) return null;
        return (
          <section key={section.id} className="px-4 py-8">
            <div className="container mx-auto max-w-7xl">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {quickActions.map(action => (
                  <Link key={action.id} href={action.link || '#'}>
                    <Card className={cn("border-none shadow-xl bg-gradient-to-br text-white relative overflow-hidden h-32 rounded-3xl", action.bgGradient)}>
                      <CardContent className="p-6 h-full flex flex-col justify-center gap-1 relative z-10">
                        <MousePointer2 size={24} className="opacity-40 mb-1" />
                        <h3 className="text-xl font-black uppercase tracking-tight">{action.title}</h3>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        );

      case 'section_banners':
        const enabledBanners = marketingOffers?.filter(o => o.enabled) || [];
        if (!enabledBanners.length) return null;
        return (
          <section key={section.id} className="px-4 py-8 space-y-6">
            <div className="container mx-auto max-w-7xl">
              {enabledBanners.map(banner => (
                <Link key={banner.id} href={banner.link || '#'} className="block relative aspect-[21/7] w-full rounded-[2.5rem] overflow-hidden shadow-lg group mb-6">
                  <Image src={banner.imageUrl} alt={banner.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" unoptimized />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10" />
                </Link>
              ))}
            </div>
          </section>
        );

      case 'categories':
        return (
          <section key={section.id} className="px-4 py-10">
            <div className="container mx-auto max-w-7xl">
              <div className="bg-white p-6 md:p-10 shadow-sm border border-gray-100 rounded-[2.5rem] overflow-hidden">
                <div className="flex gap-4 md:gap-8 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory">
                  {topCategories.map((cat) => {
                    const catStyle = getCategoryStyles(cat.name);
                    const DisplayIcon = catStyle.icon;
                    return (
                      <Link key={cat.id} href={cat.link || `/services?search=${cat.name}`} className="flex flex-col items-center gap-3 group shrink-0 basis-[calc(25%-1rem)] sm:basis-[calc(16%-1rem)] snap-start">
                        <div className={cn("w-14 h-14 md:w-20 md:h-20 rounded-[1.5rem] flex items-center justify-center p-4 border shadow-sm transition-all duration-300 group-hover:scale-110", catStyle.bg, catStyle.color)}>
                          {cat.imageUrl ? <div className="relative w-full h-full"><Image src={cat.imageUrl} alt={cat.name} fill className="object-contain" unoptimized /></div> : <DisplayIcon size={28} />}
                        </div>
                        <span className="text-[10px] md:text-xs font-black text-center text-gray-600 uppercase tracking-tighter truncate w-full group-hover:text-primary">{cat.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        );

      case 'flash_deals':
        if (!flashSaleConfig?.isActive || !productsEnabled) return null;
        const flashProducts = allProducts?.filter(p => flashSaleConfig.productIds?.includes(p.id) && p.status === 'Active') || [];
        if (flashProducts.length === 0) return null;
        return (
          <section key={section.id} className="px-4 py-8">
            <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-md border border-gray-100">
              <div className="container mx-auto max-w-7xl">
                <div className="p-6 md:p-8 flex items-center justify-between border-b">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-500 rounded-2xl text-white shadow-lg shadow-red-500/20"><Zap size={24} fill="currentColor" /></div>
                    <div className="flex flex-col">
                      <span className="text-xl md:text-3xl font-black uppercase tracking-tight">{flashSaleConfig.title || t('flash_sale')}</span>
                      <CountdownTimer endDate={flashSaleConfig.endDate} variant="dark" />
                    </div>
                  </div>
                  <Link href="/products" className="flex items-center gap-1 text-xs font-black text-primary uppercase tracking-widest hover:underline">
                    {t('view_all').toUpperCase()} <ChevronRight size={16} />
                  </Link>
                </div>
                <div className="p-6 md:p-8 flex gap-4 overflow-x-auto no-scrollbar">
                  {flashProducts.map(p => <div key={p.id} className="w-[180px] md:w-[240px] shrink-0"><FlashSaleCard product={p} /></div>)}
                </div>
              </div>
            </div>
          </section>
        );

      case 'services_featured':
        const displayServices = (allServices?.filter(s => s.status === 'Active') || []).slice(0, config.limit || 10);
        if (displayServices.length === 0) return null;
        return (
          <section key={section.id} className="px-4 py-12">
            <div className="container mx-auto max-w-7xl">
              <div className="flex items-center justify-between mb-10 px-2">
                <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-[#081621]">{section.title}</h2>
                <Link href="/services" className="text-xs font-black uppercase px-6 py-2.5 rounded-full shadow-md border border-gray-100 bg-white hover:bg-gray-50">
                  {t('view_all').toUpperCase()}
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
                {displayServices.map(s => (
                  <Link key={s.id} href={`/service/${s.slug || s.id}`} className="block h-full group">
                    <Card className="border-none h-full flex flex-col overflow-hidden transition-all duration-500 bg-white shadow-sm hover:shadow-xl rounded-3xl border border-gray-100">
                      <div className="relative aspect-square overflow-hidden bg-gray-50 shrink-0">
                        {s.imageUrl ? (
                          <Image src={s.imageUrl} alt={s.title} fill className="object-cover transition-transform group-hover:scale-110" unoptimized />
                        ) : (
                          <div className="w-full h-full bg-primary/5 flex items-center justify-center text-primary/40"><Wrench size={40} /></div>
                        )}
                      </div>
                      <CardContent className="p-4 flex flex-col flex-1">
                        <div className="min-h-[48px] mb-2"><h3 className="font-bold text-sm text-gray-800 uppercase line-clamp-2 leading-tight group-hover:text-primary transition-colors">{s.title}</h3></div>
                        <div className="flex flex-col mb-2"><span className="font-black text-primary text-lg">৳{s.basePrice?.toLocaleString()}</span></div>
                        <div className="flex items-center justify-between text-[10px] font-bold border-t border-gray-50 pt-2 mb-4">
                          <div className="flex items-center gap-1 text-amber-500"><Star size={12} fill="currentColor" /><span>{(s.rating || 5.0).toFixed(1)}</span></div>
                          <span className="uppercase text-gray-400 font-black">{Math.floor(Math.random() * 100) + 20} {t('booked')}</span>
                        </div>
                        <Button size="sm" className="w-full mt-auto h-10 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 shadow-lg shadow-primary/10">
                          {t('book_now')}
                        </Button>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        );

      case 'products_new':
        const displayProducts = (allProducts?.filter(p => p.status === 'Active') || []).slice(0, config.limit || 12);
        if (displayProducts.length === 0) return null;
        return (
          <section key={section.id} className="px-4 py-12">
            <div className="container mx-auto max-w-7xl">
              <h2 className="mb-10 px-2 text-3xl md:text-5xl font-black uppercase tracking-tighter text-[#081621]">{section.title}</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4 lg:gap-6">
                {displayProducts.map(p => <ProductCard key={p.id} product={p as any} />)}
              </div>
            </div>
          </section>
        );

      case 'trust_stats':
        return (
          <section key={section.id} className="px-4 py-4 bg-white border-y border-gray-50">
            <div className="container mx-auto max-w-7xl flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
              {[
                { label: t('happy_clients'), val: "15k+", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
                { label: t('trust_score'), val: "4.9/5", icon: Star, color: "text-rose-600", bg: "bg-rose-50" },
                { label: t('verified_pros'), val: "250+", icon: Award, color: "text-amber-600", bg: "bg-amber-50" },
                { label: t('service_hours'), val: "50k+", icon: Clock, color: "text-green-600", bg: "bg-green-50" }
              ].map((stat, i) => (
                <div key={i} className="flex items-center gap-3 h-[48px] shrink-0">
                  <div className={cn("p-2 rounded-xl shrink-0 shadow-sm", stat.bg, stat.color)}><stat.icon size={18} strokeWidth={2.5} /></div>
                  <div className="flex flex-col justify-center">
                    <h4 className="text-base font-black text-[#081621] tracking-tighter leading-none">{stat.val}</h4>
                    <p className="text-[8px] font-black uppercase text-muted-foreground tracking-[0.2em] mt-0.5 whitespace-nowrap">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );

      case 'billing_plans':
        if (!plans?.length) return null;
        return (
          <section key={section.id} className="px-4 py-16 bg-gray-50/50">
            <div className="container mx-auto max-w-7xl text-center space-y-12">
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-[#081621]">{section.title || 'Subscription Plans'}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {plans.slice(0, 3).map((plan) => (
                  <Card key={plan.id} className={cn("border-none flex flex-col h-full overflow-hidden transition-all duration-500 bg-white shadow-sm hover:shadow-2xl rounded-[2.5rem]", plan.featured && "ring-4 ring-primary ring-offset-4 scale-105 z-10")}>
                    <div className={cn("p-8", plan.color || 'bg-gray-50')}>
                      <p className="text-[10px] font-black uppercase text-primary tracking-widest mb-2">Package Tier</p>
                      <h3 className="text-2xl font-black text-gray-900 uppercase">{plan.name}</h3>
                      <div className="mt-6 flex items-baseline justify-center gap-1">
                        <span className="text-4xl font-black text-primary">{plan.price}</span>
                        <span className="text-gray-400 font-bold text-sm uppercase">{plan.period}</span>
                      </div>
                    </div>
                    <CardContent className="p-8 flex-1 flex flex-col">
                      <ul className="space-y-4 mb-10 flex-1 text-left">
                        {plan.features?.slice(0, 5).map((f: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-3 text-xs font-bold text-gray-600 uppercase tracking-tight">
                            <Check size={14} className="text-green-500 shrink-0 mt-0.5" strokeWidth={4} /> {f}
                          </li>
                        ))}
                      </ul>
                      <Button className="w-full h-14 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20">Subscribe Plan</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        );

      case 'campaign':
        return <CampaignSection key={section.id} />;

      default:
        return null;
    }
  };

  const heroSection = activeLayoutSections.find(s => s.type === 'hero');
  const sidePromoSection = activeLayoutSections.find(s => s.type === 'side_promo');

  if (!mounted) return null;

  return (
    <PublicLayout>
      <div className="flex flex-col bg-[#F8FAFC] min-h-screen pb-24">
        {layoutLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 className="animate-spin text-primary" size={48} />
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t('fetching_data')}</p>
          </div>
        ) : (
          <>
            {(heroSection || sidePromoSection) && (
              <section className="w-full px-0 lg:px-4 lg:mt-4 mb-6">
                <div className="flex flex-row flex-nowrap gap-2 md:gap-4 w-full h-[280px] md:h-[320px] max-h-[320px] overflow-hidden">
                  {heroSection && (
                    <div className={cn("relative overflow-hidden bg-gray-100 shadow-sm rounded-xl md:rounded-2xl lg:rounded-3xl h-full", sidePromoSection ? "w-[70%]" : "w-full")}>
                      {mainBanners.length > 0 ? (
                        <Carousel className="w-full h-full" opts={{ loop: true }}>
                          <CarouselContent className="h-full -ml-0">
                            {mainBanners.map((banner) => (
                              <CarouselItem key={banner.id} className="h-full basis-full relative pl-0">
                                <Link href={banner.buttonLink || '#'} className="block w-full h-full relative">
                                  <Image src={banner.imageUrl || ''} alt={banner.title} fill className="object-cover" priority unoptimized />
                                  <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex flex-col justify-center p-4 md:p-12">
                                    <h2 className="text-white text-[10px] sm:text-base md:text-4xl lg:text-5xl font-black uppercase tracking-tight mb-1 drop-shadow-xl">{banner.title}</h2>
                                    <p className="text-white/90 text-[7px] sm:text-[10px] md:text-lg font-medium mb-2 md:mb-4 max-w-[80px] sm:max-w-xs md:max-w-md line-clamp-2">{banner.subtitle}</p>
                                    <Button size="sm" className="w-fit h-5 sm:h-7 md:h-10 rounded-full px-2 sm:px-4 md:px-6 font-black uppercase text-[6px] sm:text-[8px] md:text-xs shadow-lg" style={{ backgroundColor: banner.buttonColor }}>
                                      {banner.buttonText || t('view_all')}
                                    </Button>
                                  </div>
                                </Link>
                              </CarouselItem>
                            ))}
                          </CarouselContent>
                        </Carousel>
                      ) : <div className="w-full h-full bg-primary/5 animate-pulse flex items-center justify-center"><Loader2 className="animate-spin text-primary/20" /></div>}
                    </div>
                  )}
                  {sidePromoSection && sidePromos.length > 0 && (
                    <div className={cn("w-[30%] min-w-[100px] shrink-0 flex flex-col gap-2 md:gap-4 h-full", !heroSection ? "w-full" : "")}>
                      {sidePromos.slice(0, 2).map(promo => (
                        <Link key={promo.id} href={promo.buttonLink || '#'} className="flex-1 relative rounded-xl md:rounded-2xl lg:rounded-3xl overflow-hidden shadow-sm group">
                          <Image src={promo.imageUrl} alt={promo.title} fill className="object-cover transition-transform duration-700 group-hover:scale-110" unoptimized />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-2 md:p-6 flex flex-col justify-end">
                            <h3 className="text-white text-[7px] sm:text-[10px] md:text-sm lg:text-lg font-black uppercase tracking-tight leading-tight line-clamp-2 drop-shadow-md">{promo.title}</h3>
                            <div className="mt-1 md:mt-2 text-primary flex items-center gap-1 text-[5px] sm:text-[8px] md:text-[10px] font-black uppercase">
                              {promo.buttonText || 'Discover'} <ChevronRight size={10} className="w-2 h-2 md:w-3 md:h-3"/>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}
            {activeLayoutSections.map(renderSection)}
          </>
        )}
      </div>
    </PublicLayout>
  );
}
