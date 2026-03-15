
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/components/providers/language-provider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PublicLayout } from '@/components/layout/public-layout';
import { useCollection, useFirestore, useMemoFirebase, useDoc, useUser } from '@/firebase';
import { collection, query, doc, where, limit, orderBy } from 'firebase/firestore';
import { 
  BellRing, 
  ArrowRight, 
  Package, 
  Wrench, 
  ChevronRight, 
  Loader2, 
  ChevronDown, 
  Satellite, 
  Thermometer, 
  Plane, 
  Camera, 
  Tv, 
  Smartphone, 
  Tablet, 
  Glasses, 
  Watch, 
  Video, 
  Grid, 
  Monitor, 
  Zap, 
  LayoutDashboard, 
  Users, 
  ShoppingCart, 
  TrendingUp, 
  UserCheck, 
  Briefcase, 
  Settings, 
  Plus, 
  Calendar, 
  Share2, 
  CreditCard, 
  ShieldCheck,
  Info,
  AlertCircle,
  Megaphone
} from 'lucide-react';
import { ProductCard } from '@/components/products/product-card';
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from '@/components/ui/carousel';
import { cn } from '@/lib/utils';

const ICONS: Record<string, any> = {
  Satellite, Thermometer, Plane, Camera, Tv, Smartphone, Tablet, Glasses, Watch, Video, Grid, Monitor, Zap, Wrench, Package, LayoutDashboard, Users, ShoppingCart, Briefcase, Settings, Calendar, Share2, CreditCard, ShieldCheck, BellRing, Info, AlertCircle, Megaphone
};

export default function SmartCleanHomePage() {
  const { language, t } = useLanguage();
  const { user } = useUser();
  const [showAllLinks, setShowAllLinks] = useState(false);
  const db = useFirestore();

  // Role Checks
  const adminRef = useMemoFirebase(() => user ? doc(db, 'roles_admins', user.uid) : null, [db, user]);
  const { data: adminRole } = useDoc(adminRef);
  const isAdmin = !!adminRole || user?.uid === 'gcp03WmpjROVvRdpLNsghNU4zHa2';

  // Data Fetching
  const customizationRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'homepage') : null, [db]);
  const { data: customization } = useDoc(customizationRef);

  const offersQuery = useMemoFirebase(() => db ? query(collection(db, 'marketing_offers'), where('enabled', '==', true)) : null, [db]);
  const { data: offers } = useCollection(offersQuery);

  const linksQuery = useMemoFirebase(() => db ? query(collection(db, 'quick_links'), orderBy('order', 'asc')) : null, [db]);
  const { data: quickLinks } = useCollection(linksQuery);

  const actionsQuery = useMemoFirebase(() => db ? query(collection(db, 'quick_actions')) : null, [db]);
  const { data: quickActions } = useCollection(actionsQuery);

  const productsQuery = useMemoFirebase(() => db ? query(collection(db, 'products'), limit(15)) : null, [db]);
  const servicesQuery = useMemoFirebase(() => db ? query(collection(db, 'services'), limit(15)) : null, [db]);

  const { data: products, isLoading: productsLoading } = useCollection(productsQuery);
  const { data: services, isLoading: servicesLoading } = useCollection(servicesQuery);

  const marqueeRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'marquee') : null, [db]);
  const { data: marqueeSettings } = useDoc(marqueeRef);

  const carouselOffers = offers?.filter(o => o.placement === 'top');

  // Dynamic Marquee Content
  const getMarqueeContent = () => {
    if (marqueeSettings?.text) return marqueeSettings.text;
    const dateStr = new Date().toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
    return `${dateStr} | ${t('hero_subtitle')}`;
  };

  const MarqueeIcon = ICONS[marqueeSettings?.iconName || 'BellRing'] || BellRing;

  return (
    <PublicLayout>
      <div className="flex flex-col gap-6 pb-16 bg-[#F2F4F8]">
        
        {/* 0. Admin Dashboard Summary */}
        {isAdmin && (
          <section className="container mx-auto px-4 pt-6">
            <div className="bg-[#081621] text-white p-6 md:p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group border border-white/5">
              <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-700 pointer-events-none">
                <LayoutDashboard size={160} />
              </div>
              <div className="relative z-10 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                      <ShieldCheck className="text-primary" /> {t('mgmt_center')}
                    </h2>
                    <p className="text-white/60 text-[10px] font-black uppercase tracking-widest">{t('ops_overview')}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 font-bold h-11 rounded-xl" asChild>
                      <Link href="/admin/dashboard">{t('full_admin')} <ArrowRight size={16} /></Link>
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: t('leads'), val: '842', color: 'text-blue-400', icon: Briefcase },
                    { label: t('sales'), val: '৳1.4M', color: 'text-green-400', icon: ShoppingCart },
                    { label: t('growth'), val: '+12%', color: 'text-primary', icon: TrendingUp },
                    { label: t('active_staff'), val: '24', color: 'text-amber-400', icon: UserCheck }
                  ].map((s, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm">
                      <p className="text-[9px] font-black text-white/40 uppercase mb-1">{s.label}</p>
                      <div className="flex items-center justify-between">
                        <span className={cn("text-xl font-black", s.color)}>{s.val}</span>
                        <s.icon size={16} className="text-white/20" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 0.1 Customer Activity Summary */}
        {user && !isAdmin && (
          <section className="container mx-auto px-4 pt-6">
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-primary/10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xl border border-primary/20">
                  {user.email?.[0].toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-900">{t('welcome_back')} {user.displayName?.split(' ')[0]}!</h2>
                  <p className="text-xs text-muted-foreground font-bold">{t('active_bookings')}</p>
                </div>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <Button variant="outline" size="sm" className="flex-1 md:flex-none h-11 rounded-xl font-bold" asChild>
                  <Link href="/account/history">{t('view_history')}</Link>
                </Button>
                <Button size="sm" className="flex-1 md:flex-none h-11 rounded-xl font-bold shadow-lg shadow-primary/20" asChild>
                  <Link href="/account/dashboard">{t('go_dashboard')} <ArrowRight size={14} /></Link>
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* 1. Quick Links Grid */}
        <section className="bg-white py-10 border-b shadow-sm">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-6 md:gap-4">
              {(showAllLinks ? quickLinks : quickLinks?.slice(0, 10))?.map((link) => {
                const Icon = ICONS[link.iconName] || Grid;
                return (
                  <Link key={link.id} href={link.link || '#'} className="flex flex-col items-center gap-3 group">
                    <div className="p-5 bg-gray-50 rounded-[1.5rem] text-gray-600 group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-sm border border-transparent group-hover:border-primary/20">
                      <Icon size={32} />
                    </div>
                    <span className="text-[10px] font-black text-gray-700 uppercase tracking-tighter text-center line-clamp-1">
                      {t(link.label)}
                    </span>
                  </Link>
                );
              })}
            </div>
            {quickLinks && quickLinks.length > 10 && (
              <div className="flex justify-center mt-10">
                <Button 
                  variant="ghost" 
                  className="gap-2 text-primary font-black text-xs uppercase hover:bg-transparent tracking-widest"
                  onClick={() => setShowAllLinks(!showAllLinks)}
                >
                  {showAllLinks ? t('view_less') : t('view_more')} <ChevronDown size={16} className={cn("transition-transform", showAllLinks && "rotate-180")} />
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* 2. Dynamic Hero / Promotional Slider */}
        <section className="container mx-auto px-4">
          {customization?.hero?.enabled && customization.hero.imageUrl ? (
            <div className="relative aspect-[21/9] md:aspect-[21/8] rounded-2xl overflow-hidden shadow-2xl border border-white/10 group bg-gray-100">
              <Image 
                src={customization.hero.imageUrl} 
                alt="Banner" 
                fill 
                className="object-cover transition-transform duration-1000 group-hover:scale-105" 
                priority
              />
              {customization.hero.ctaLink && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20">
                  <Button asChild size="lg" className="h-14 px-10 rounded-xl font-black text-lg shadow-2xl">
                    <Link href={customization.hero.ctaLink}>{customization.hero.ctaText || t('hero_cta')}</Link>
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <Carousel className="w-full" opts={{ loop: true }}>
              <CarouselContent>
                {carouselOffers?.length ? carouselOffers.map((offer) => (
                  <CarouselItem key={offer.id}>
                    <Link href={offer.link || '#'} className="block relative aspect-[21/9] md:aspect-[21/8] rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                      <Image src={offer.imageUrl} alt={offer.title || 'Promo'} fill className="object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8 md:p-16">
                         <h2 className="text-white text-3xl md:text-6xl font-black uppercase tracking-tighter leading-tight max-w-3xl">{offer.title}</h2>
                      </div>
                    </Link>
                  </CarouselItem>
                )) : (
                  <CarouselItem>
                    <div className="relative aspect-[21/9] md:aspect-[21/8] rounded-2xl overflow-hidden bg-gradient-to-br from-[#081621] to-[#0a253a] flex items-center justify-center text-white border border-white/5 shadow-2xl">
                      <div className="text-center space-y-6 px-8 max-w-4xl">
                        <Badge className="bg-primary text-white border-none uppercase tracking-[0.3em] font-black text-xs px-4 py-1 rounded-full">EST. 2026</Badge>
                        <h2 className="text-4xl md:text-7xl font-black uppercase font-headline tracking-tighter leading-none">{t('hero_title')}</h2>
                        <p className="text-lg md:text-xl opacity-60 font-medium leading-relaxed">{t('hero_subtitle')}</p>
                        <Button size="lg" className="h-14 px-10 rounded-2xl font-black text-lg shadow-xl shadow-primary/20">{t('hero_cta')}</Button>
                      </div>
                    </div>
                  </CarouselItem>
                )}
              </CarouselContent>
              <CarouselPrevious className="hidden md:flex left-6 bg-white/10 text-white border-none hover:bg-white/30 backdrop-blur-md" />
              <CarouselNext className="hidden md:flex right-6 bg-white/10 text-white border-none hover:bg-white/30 backdrop-blur-md" />
            </Carousel>
          )}
        </section>

        {/* 3. Marquee */}
        {(!marqueeSettings || marqueeSettings.enabled) && (
          <section className="container mx-auto px-4">
            <div className={cn(
              "h-14 shadow-sm border border-gray-100 flex items-center overflow-hidden transition-all duration-500",
              marqueeSettings?.radius || "rounded-full",
              marqueeSettings?.bgColor || "bg-white"
            )}>
              <div className={cn(
                "h-full px-8 flex items-center gap-2 z-10 font-black text-xs uppercase tracking-widest shadow-lg shrink-0",
                marqueeSettings?.bgColor === 'bg-white' || !marqueeSettings?.bgColor ? "bg-primary text-white" : "bg-black/20 text-white"
              )}>
                <MarqueeIcon size={18} /> {marqueeSettings?.label || 'INFO'}
              </div>
              <div className="flex-1 overflow-hidden relative h-full flex items-center">
                 <div className={cn(
                   "animate-marquee inline-flex items-center whitespace-nowrap px-6 gap-6",
                   marqueeSettings?.textColor || (marqueeSettings?.bgColor === 'bg-white' ? "text-gray-600" : "text-white"),
                   marqueeSettings?.fontSize || "text-sm"
                 )}>
                   <span className="font-bold">{getMarqueeContent()}</span>
                   {marqueeSettings?.ctaText && marqueeSettings?.ctaLink && (
                     <Link 
                       href={marqueeSettings.ctaLink}
                       className={cn(
                         "px-3 py-1 rounded-md text-[10px] uppercase font-black border transition-all hover:scale-105 active:scale-95",
                         marqueeSettings?.bgColor === 'bg-white' || !marqueeSettings?.bgColor ? "bg-primary text-white border-primary" : "bg-white text-gray-900 border-white"
                       )}
                     >
                       {marqueeSettings.ctaText}
                     </Link>
                   )}
                 </div>
              </div>
            </div>
          </section>
        )}

        {/* 4. Quick Action Cards - Center Aligned & Thinner */}
        <section className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-4 md:gap-8">
            {quickActions?.length ? quickActions.map((action) => {
              const Icon = ICONS[action.iconName] || Zap;
              return (
                <Link 
                  key={action.id} 
                  href={action.link || '#'} 
                  className={cn(
                    `bg-gradient-to-br ${action.bgGradient} rounded-xl md:rounded-2xl flex flex-col items-center justify-center text-center shadow-xl group hover:shadow-2xl transition-all overflow-hidden relative border border-white/5 h-32 md:h-44`,
                  )}
                >
                  <div className="flex flex-col items-center gap-2 md:gap-4 relative z-10 p-4">
                    <div className="p-2 md:p-3 bg-white/10 rounded-xl backdrop-blur-md group-hover:scale-110 transition-transform duration-500">
                      <Icon className="text-white w-6 h-6 md:w-10 md:h-10" />
                    </div>
                    <h3 className="text-white text-sm md:text-2xl font-black uppercase tracking-tight leading-tight">
                      {t(action.title)}
                    </h3>
                  </div>
                  {/* Subtle Background Pattern */}
                  <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12 scale-150 group-hover:rotate-0 transition-transform duration-700 pointer-events-none">
                    <Icon size={120} className="text-white" />
                  </div>
                </Link>
              );
            }) : (
              <>
                <Link href="/services" className="bg-gradient-to-br from-primary to-primary/80 rounded-xl md:rounded-2xl h-32 md:h-44 flex flex-col items-center justify-center text-center shadow-xl group overflow-hidden relative border border-white/5">
                  <div className="flex flex-col items-center gap-2 md:gap-4 relative z-10 p-4">
                    <div className="p-2 md:p-3 bg-white/10 rounded-xl backdrop-blur-md group-hover:scale-110 transition-transform duration-500">
                      <Wrench className="text-white w-6 h-6 md:w-10 md:h-10" />
                    </div>
                    <h3 className="text-white text-sm md:text-2xl font-black uppercase tracking-tight">{t('nav_services')}</h3>
                  </div>
                </Link>
                <Link href="/products" className="bg-gradient-to-br from-[#081621] to-[#0a253a] rounded-xl md:rounded-2xl h-32 md:h-44 flex flex-col items-center justify-center text-center shadow-xl group overflow-hidden relative border border-white/5">
                  <div className="flex flex-col items-center gap-2 md:gap-4 relative z-10 p-4">
                    <div className="p-2 md:p-3 bg-white/10 rounded-xl backdrop-blur-md group-hover:scale-110 transition-transform duration-500">
                      <Package className="text-white w-6 h-6 md:w-10 md:h-10" />
                    </div>
                    <h3 className="text-white text-sm md:text-2xl font-black uppercase tracking-tight">{t('nav_products')}</h3>
                  </div>
                </Link>
              </>
            )}
          </div>
        </section>

        <div className="container mx-auto px-4 space-y-20 mt-12">
          
          {/* Services Grid */}
          <section className="space-y-8">
            <div className="flex justify-between items-center gap-4 border-b pb-4">
              <h2 className="text-2xl md:text-3xl font-black font-headline text-[#081621] uppercase tracking-tight">{t('expert_services')}</h2>
              <div className="flex items-center gap-4 shrink-0">
                <Button variant="link" className="gap-2 font-black uppercase text-xs tracking-widest text-primary p-0" asChild>
                  <Link href="/services">{t('view_all')} <ChevronRight size={16} /></Link>
                </Button>
              </div>
            </div>
            
            {servicesLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={40} /></div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                {services?.map((service) => (
                  <div key={service.id} className="group bg-white rounded-xl md:rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-transparent hover:border-primary/20 flex flex-col relative">
                    {isAdmin && (
                      <div className="absolute top-2 right-2 z-20">
                        <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full shadow-lg border-none backdrop-blur-md bg-white/80" asChild>
                          <Link href="/admin/services"><Settings size={14} className="text-primary" /></Link>
                        </Button>
                      </div>
                    )}
                    <Link href={`/service/${service.id}`} className="block relative aspect-square overflow-hidden shrink-0">
                      <Image 
                        src={service.imageUrl || 'https://picsum.photos/seed/srv/600/400'} 
                        alt={service.title || 'Cleaning Service'} 
                        fill 
                        className="object-cover group-hover:scale-110 transition-transform duration-700" 
                      />
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-white/95 text-primary border-none shadow-sm backdrop-blur-sm font-black text-[8px] uppercase px-2 py-0.5 rounded-md">{service.category || 'General'}</Badge>
                      </div>
                    </Link>
                    <div className="p-3 flex flex-col flex-1 gap-2">
                      <Link href={`/service/${service.id}`} className="hover:text-primary transition-colors block">
                        <h3 className="text-[12px] md:text-[13px] font-black group-hover:text-primary transition-colors line-clamp-1 leading-tight">{service.title}</h3>
                      </Link>
                      <div className="flex flex-col border-t border-gray-50 pt-2 gap-2 mt-auto">
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">{t('price_from')}</span>
                          <span className="text-sm md:text-base font-black text-primary">
                            ৳{(service.basePrice || 0).toLocaleString()} 
                          </span>
                        </div>
                        <Button size="sm" className="w-full rounded-lg font-black h-8 text-[10px] uppercase shadow-sm" asChild>
                          <Link href={`/service/${service.id}`}>{t('book_now')}</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Products Grid */}
          <section className="space-y-8">
            <div className="flex justify-between items-center gap-4 border-b pb-4">
              <h2 className="text-2xl md:text-3xl font-black font-headline text-[#081621] uppercase tracking-tight">{t('professional_tools')}</h2>
              <div className="flex items-center gap-4 shrink-0">
                <Button variant="link" className="gap-2 font-black uppercase text-xs tracking-widest text-primary p-0" asChild>
                  <Link href="/products">{t('view_all')} <ChevronRight size={16} /></Link>
                </Button>
              </div>
            </div>
            
            {productsLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={40} /></div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                {products?.map((product) => (
                  <ProductCard key={product.id} product={product as any} />
                ))}
              </div>
            )}
          </section>

        </div>
      </div>
    </PublicLayout>
  );
}
