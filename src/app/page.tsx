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
import { collection, doc, query, where, orderBy, limit } from 'firebase/firestore';
import * as LucideIcons from 'lucide-react';
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
  Box,
  ShoppingCart,
  Info,
  TicketPercent,
  Gift,
  Layout
} from 'lucide-react';
import { ProductCard } from '@/components/products/product-card';
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
  Award,
  TicketPercent,
  Gift
};

export default function SmartCleanHomePage() {
  const { t } = useLanguage();
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Registry Queries
  const sectionsRef = useMemoFirebase(() => db ? collection(db, 'homepage_sections') : null, [db]);
  const bannersRef = useMemoFirebase(() => db ? collection(db, 'hero_banners') : null, [db]);
  const topNavRef = useMemoFirebase(() => db ? collection(db, 'top_nav_categories') : null, [db]);
  const productsRef = useMemoFirebase(() => db ? collection(db, 'products') : null, [db]);
  const servicesRef = useMemoFirebase(() => db ? collection(db, 'services') : null, [db]);
  const subServicesRef = useMemoFirebase(() => db ? collection(db, 'sub_services') : null, [db]);
  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'global') : null, [db]);
  const stylesRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'card_styles') : null, [db]);
  const advancedOffersRef = useMemoFirebase(() => db ? collection(db, 'advanced_offers') : null, [db]);
  const couponsRef = useMemoFirebase(() => db ? collection(db, 'coupons') : null, [db]);
  const quickLinksRef = useMemoFirebase(() => db ? collection(db, 'quick_links') : null, [db]);
  const quickActionsRef = useMemoFirebase(() => db ? collection(db, 'quick_actions') : null, [db]);

  const { data: allSectionsRaw, isLoading: layoutLoading } = useCollection(sectionsRef);
  const { data: allBanners } = useCollection(bannersRef);
  const { data: allTopNav } = useCollection(topNavRef);
  const { data: allProducts } = useCollection(productsRef);
  const { data: allServices } = useCollection(servicesRef);
  const { data: allSubServices } = useCollection(subServicesRef);
  const { data: settings } = useDoc(settingsRef);
  const { data: cardStyles } = useDoc(stylesRef);
  const { data: advancedOffers } = useCollection(advancedOffersRef);
  const { data: coupons } = useCollection(couponsRef);
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

  const getGridCols = (cols: string | undefined) => {
    const c = cols || '5';
    if (c === '2') return 'grid-cols-2';
    if (c === '3') return 'grid-cols-2 md:grid-cols-3';
    if (c === '4') return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
    if (c === '5') return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5';
    if (c === '6') return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6';
    return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5';
  };

  const renderSection = (section: any) => {
    const config = section.config || {};
    const sectionType = section.type;
    
    if (sectionType === 'hero' || sectionType === 'side_promo') return null;

    switch (sectionType) {
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
                        {ICONS[action.iconName] ? React.createElement(ICONS[action.iconName], { size: 24, className: "opacity-40 mb-1" }) : <Zap size={24} className="opacity-40 mb-1" />}
                        <h3 className="text-xl font-black uppercase tracking-tight">{action.title}</h3>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        );

      case 'products_dynamic':
        let filteredProducts = allProducts?.filter(p => p.status?.toLowerCase() === 'active') || [];
        if (config.sourceType === 'category' && config.sourceId) {
          filteredProducts = filteredProducts.filter(p => p.categoryId === config.sourceId);
        } else if (config.sourceType === 'brand' && config.sourceId) {
          filteredProducts = filteredProducts.filter(p => p.brand === config.sourceId);
        } else if (config.sourceType === 'vendor' && config.sourceId) {
          filteredProducts = filteredProducts.filter(p => p.vendorId === config.sourceId);
        } else if (config.sourceType === 'manual' && config.manualIds?.length) {
          filteredProducts = filteredProducts.filter(p => config.manualIds.includes(p.id));
        }

        // Sorting Logic
        if (config.sortBy === 'popular') filteredProducts.sort((a,b) => (b.salesCount || 0) - (a.salesCount || 0));
        else if (config.sortBy === 'rating') filteredProducts.sort((a,b) => (b.rating || 0) - (a.rating || 0));
        else if (config.sortBy === 'discount') filteredProducts.sort((a,b) => ((b.regularPrice || 0) - b.price) - ((a.regularPrice || 0) - a.price));
        else filteredProducts.sort((a,b) => (new Date(b.createdAt || 0).getTime()) - (new Date(a.createdAt || 0).getTime()));
        
        filteredProducts = filteredProducts.slice(0, config.limit || 12);
        if (!filteredProducts.length) return null;

        return (
          <section key={section.id} className="px-4 py-12">
            <div className="container mx-auto max-w-7xl">
              <div className="flex items-center justify-between mb-10 px-2">
                <h2 className={cn("font-black uppercase tracking-tighter text-[#081621] text-3xl md:text-5xl")} style={{ textAlign: config.titleAlign || 'left' }}>{section.title}</h2>
                <Link href="/products" className="text-xs font-black uppercase tracking-widest text-primary hover:underline flex items-center gap-1">VIEW ALL <ChevronRight size={14}/></Link>
              </div>
              <div className={cn("grid gap-4 md:gap-6", getGridCols(config.gridColsDesktop))}>
                {filteredProducts.map(p => <ProductCard key={p.id} product={p as any} customStyle={cardStyles?.productCard} />)}
              </div>
            </div>
          </section>
        );

      case 'services_dynamic':
        let filteredServices = allServices?.filter(s => s.status?.toLowerCase() === 'active') || [];
        if (config.sourceType === 'category' && config.sourceId) {
          filteredServices = filteredServices.filter(s => s.categoryId === config.sourceId);
        } else if (config.sourceType === 'manual' && config.manualIds?.length) {
          filteredServices = filteredServices.filter(s => config.manualIds.includes(s.id));
        }
        
        filteredServices = filteredServices.slice(0, config.limit || 10);
        if (!filteredServices.length) return null;

        return (
          <section key={section.id} className="px-4 py-12">
            <div className="container mx-auto max-w-7xl">
              <h2 className={cn("font-black uppercase tracking-tighter mb-10 text-[#081621] text-3xl md:text-5xl")} style={{ textAlign: config.titleAlign || 'left' }}>{section.title}</h2>
              <div className={cn("grid gap-4 md:gap-6", getGridCols(config.gridColsDesktop))}>
                {filteredServices.map(s => <div key={s.id}><ProductCard product={{...s, name: s.title, price: s.basePrice, type: 'service'} as any} customStyle={cardStyles?.serviceCard} /></div>)}
              </div>
            </div>
          </section>
        );

      case 'affiliate_promo':
        return (
          <section key={section.id} className="container mx-auto px-4 py-12 max-w-7xl">
            <Card className="border-none shadow-2xl bg-[#081621] text-white rounded-[2.5rem] overflow-hidden relative border border-white/5">
              <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 scale-150"><Zap size={160} className="text-primary" /></div>
              <CardContent className="p-8 md:p-12 relative z-10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="space-y-4 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-3">
                      <div className="p-2 bg-primary rounded-xl shadow-lg shadow-primary/20"><TrendingUp size={24}/></div>
                      <Badge className="bg-primary/20 text-primary border-none uppercase font-black tracking-widest px-3 py-1 rounded-lg text-[9px]">Passive Income</Badge>
                    </div>
                    <h3 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic">Earn with Smart Clean</h3>
                    <p className="text-white/60 text-base md:text-lg max-w-xl leading-relaxed">
                      Join our affiliate network and earn up to <span className="text-primary font-black">৳500 per booking</span> when your friends or followers book a professional cleaning service.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    <Button asChild className="h-16 px-10 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                      <Link href="/account/affiliate">Join Program <ArrowRight className="ml-2" size={18}/></Link>
                    </Button>
                    <Button variant="outline" asChild className="h-16 px-10 rounded-2xl bg-white/5 border-white/10 text-white hover:bg-white/10 font-black uppercase text-xs tracking-widest">
                      <Link href="/page/partnership-terms">Terms & Benefits</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        );

      case 'advanced_offers':
        const liveOffers = advancedOffers?.filter(o => o.status === 'Live') || [];
        if (!liveOffers.length) return null;
        return (
          <section key={section.id} className="px-4 py-12">
            <div className="container mx-auto max-w-7xl space-y-8">
              <div className="flex items-center gap-3 px-2">
                <div className="p-2 bg-rose-500 rounded-xl text-white"><Gift size={20}/></div>
                <h2 className="text-2xl font-black uppercase tracking-tight text-[#081621]">{section.title || 'Exclusive Offers'}</h2>
              </div>
              <div className="flex gap-6 overflow-x-auto no-scrollbar pb-4">
                {liveOffers.map(offer => (
                  <Card key={offer.id} className="border-none shadow-xl rounded-[2.5rem] overflow-hidden min-w-[300px] flex-1 bg-gradient-to-br from-indigo-600 to-indigo-900 text-white relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 scale-150"><Zap size={80} /></div>
                    <CardContent className="p-8 relative z-10 space-y-4">
                      <Badge className="bg-white/20 text-white border-none text-[8px] font-black uppercase px-2 py-0.5">{offer.type.replace(/_/g, ' ')}</Badge>
                      <h3 className="text-xl font-black uppercase tracking-tight leading-tight">{offer.title}</h3>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-primary">
                          {offer.rules.discountType === 'percentage' ? `${offer.rules.discountValue}%` : `৳${offer.rules.discountValue}`}
                        </span>
                        <span className="text-[10px] font-bold opacity-60 uppercase">OFF AT CHECKOUT</span>
                      </div>
                      <Button className="w-full h-11 rounded-xl bg-white text-indigo-600 hover:bg-gray-100 font-black uppercase tracking-widest text-[9px]">Claim Offer</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        );

      case 'coupons_grid':
        const activeCoupons = coupons?.filter(c => c.status === 'Active') || [];
        if (!activeCoupons.length) return null;
        return (
          <section key={section.id} className="px-4 py-12">
            <div className="container mx-auto max-w-7xl">
              <h2 className="text-2xl font-black uppercase tracking-tight text-[#081621] mb-8 px-2">{section.title || 'Voucher Codes'}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {activeCoupons.map(coupon => (
                  <div key={coupon.id} className="p-6 bg-white rounded-3xl border-2 border-dashed border-primary/20 flex flex-col items-center justify-center text-center gap-3 relative group overflow-hidden">
                    <div className="absolute -top-4 -right-4 bg-primary/5 p-8 rounded-full group-hover:scale-110 transition-transform"><TicketPercent size={48} className="text-primary/10" /></div>
                    <span className="text-[9px] font-black uppercase text-gray-400">Coupon Code</span>
                    <div className="text-2xl font-black font-mono tracking-widest text-[#081621]">{coupon.code}</div>
                    <Badge className="bg-primary/10 text-primary border-none font-black text-[9px] uppercase px-3 py-1">
                      {coupon.discountType === 'percent' ? `${coupon.value}% OFF` : `৳${coupon.value} FLAT`}
                    </Badge>
                  </div>
                ))}
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

      case 'campaign':
        return <CampaignSection key={section.id} />;

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
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t('fetching_data')}</p>
          </div>
        ) : (
          <>
            {/* Standard Hero Section */}
            <section className="w-full px-0 lg:px-4 lg:mt-4 mb-6">
              <div className="flex flex-row flex-nowrap gap-2 md:gap-4 w-full h-[280px] md:h-[320px] max-h-[320px] overflow-hidden">
                <div className="relative overflow-hidden bg-gray-100 shadow-sm rounded-xl md:rounded-2xl lg:rounded-3xl h-full w-full lg:w-[70%]">
                  {mainBanners.length > 0 ? (
                    <Carousel className="w-full h-full" opts={{ loop: true }}>
                      <CarouselContent className="h-full -ml-0">
                        {mainBanners.map((banner) => (
                          <CarouselItem key={banner.id} className="h-full basis-full relative pl-0">
                            <Link href={banner.buttonLink || '#'} className="block w-full h-full relative">
                              <Image src={banner.imageUrl || ''} alt={banner.title} fill className="object-cover" priority unoptimized />
                              <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex flex-col justify-center p-4 md:p-12 text-left">
                                <h2 className="text-white text-base md:text-4xl lg:text-5xl font-black uppercase tracking-tight mb-1 drop-shadow-xl">{banner.title}</h2>
                                <p className="text-white/90 text-[10px] md:text-lg font-medium mb-2 md:mb-4 max-w-md line-clamp-2">{banner.subtitle}</p>
                                <Button size="sm" className="w-fit h-7 md:h-10 rounded-full px-4 md:px-6 font-black uppercase text-[10px] md:text-xs shadow-lg" style={{ backgroundColor: banner.buttonColor }}>
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
                {sidePromos.length > 0 && (
                  <div className="hidden lg:flex w-[30%] min-w-[100px] shrink-0 flex-col gap-2 md:gap-4 h-full">
                    {sidePromos.slice(0, 2).map(promo => (
                      <Link key={promo.id} href={promo.buttonLink || '#'} className="flex-1 relative rounded-xl md:rounded-2xl lg:rounded-3xl overflow-hidden shadow-sm group">
                        <Image src={promo.imageUrl} alt={promo.title} fill className="object-cover transition-transform duration-700 group-hover:scale-110" unoptimized />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-2 md:p-6 flex flex-col justify-end text-left">
                          <h3 className="text-white text-[10px] md:text-sm lg:text-lg font-black uppercase tracking-tight leading-tight line-clamp-2 drop-shadow-md">{promo.title}</h3>
                          <div className="mt-1 md:mt-2 text-primary flex items-center gap-1 text-[8px] md:text-[10px] font-black uppercase">
                            {promo.buttonText || 'Discover'} <ChevronRight size={10} className="w-2 h-2 md:w-3 md:h-3"/>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {activeLayoutSections.map(renderSection)}
          </>
        )}
      </div>
    </PublicLayout>
  );
}