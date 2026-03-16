
'use client';

import React, { useState, useEffect } from 'react';
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
  Calendar, 
  Share2, 
  CreditCard, 
  ShieldCheck,
  Info,
  AlertCircle,
  Megaphone,
  Sparkles,
  Play,
  CheckCircle2
} from 'lucide-react';
import { ProductCard } from '@/components/products/product-card';
import { useCart } from '@/components/providers/cart-provider';
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from '@/components/ui/carousel';
import { cn } from '@/lib/utils';

const ICONS: Record<string, any> = {
  Satellite, Thermometer, Plane, Camera, Tv, Smartphone, Tablet, Glasses, Watch, Video, Grid, Monitor, Zap, Wrench, Package, LayoutDashboard, Users, ShoppingCart, Briefcase, Settings, Calendar, Share2, CreditCard, ShieldCheck, BellRing, Info, AlertCircle, Megaphone, Sparkles, Play, ArrowRight, CheckCircle2
};

export default function SmartCleanHomePage() {
  const { language, t } = useLanguage();
  const { user } = useUser();
  const { addToCart, setCheckoutOpen } = useCart();
  const [isMounted, setIsMounted] = useState(false);
  const db = useFirestore();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Role Checks
  const adminRef = useMemoFirebase(() => user ? doc(db, 'roles_admins', user.uid) : null, [db, user]);
  const { data: adminRole } = useDoc(adminRef);
  const isAdmin = !!adminRole || user?.uid === 'gcp03WmpjROVvRdpLNsghNU4zHa2';

  // Data Fetching
  const customizationRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'homepage') : null, [db]);
  const { data: customization } = useDoc(customizationRef);

  const heroBannerRef = useMemoFirebase(() => db ? doc(db, 'heroBannerSettings', 'current') : null, [db]);
  const { data: heroSettings } = useDoc(heroBannerRef);

  const linksQuery = useMemoFirebase(() => db ? query(collection(db, 'quick_links'), orderBy('order', 'asc')) : null, [db]);
  const { data: quickLinks } = useCollection(linksQuery);

  const productsQuery = useMemoFirebase(() => db ? query(collection(db, 'products'), limit(10)) : null, [db]);
  const servicesQuery = useMemoFirebase(() => db ? query(collection(db, 'services'), limit(15)) : null, [db]);

  const { data: products, isLoading: productsLoading } = useCollection(productsQuery);
  const { data: services, isLoading: servicesLoading } = useCollection(servicesQuery);

  const marqueeRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'marquee') : null, [db]);
  const { data: marqueeSettings } = useDoc(marqueeRef);

  // Dynamic Marquee Content
  const getMarqueeContent = () => {
    if (!isMounted) return t('hero_subtitle');
    if (marqueeSettings?.text) return marqueeSettings.text;
    
    const dateStr = new Date().toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
    return `${dateStr} | ${t('hero_subtitle')}`;
  };

  const MarqueeIcon = ICONS[marqueeSettings?.iconName || 'BellRing'] || BellRing;

  const handleDirectServiceCheckout = (service: any) => {
    addToCart(service);
    setCheckoutOpen(true);
  };

  // UI Helpers for Hero Positioning
  const getPosClass = (pos: string) => {
    if (pos === 'top') return 'justify-start pt-12 md:pt-24';
    if (pos === 'bottom') return 'justify-end pb-12 md:pb-24';
    return 'justify-center';
  };

  const getAlignClass = (align: string) => {
    if (align === 'left') return 'items-start text-left';
    if (align === 'right') return 'items-end text-right';
    return 'items-center text-center';
  };

  const getButtonShape = (shape: string) => {
    if (shape === 'pill') return 'rounded-full';
    if (shape === 'square') return 'rounded-none';
    return 'rounded-2xl';
  };

  const getButtonSize = (size: string) => {
    if (size === 'sm') return 'h-10 px-6 text-sm';
    if (size === 'lg') return 'h-16 px-12 text-xl';
    return 'h-14 px-10 text-lg';
  };

  return (
    <PublicLayout>
      <div className="flex flex-col bg-[#F2F4F8]">
        
        {/* Admin Center */}
        {isAdmin && (
          <section className="container mx-auto px-4 py-6">
            <div className="bg-[#081621] text-white p-6 md:p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group border border-white/5">
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
                  <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 font-bold h-11 rounded-xl" asChild>
                    <Link href="/admin/dashboard">{t('full_admin')} <ArrowRight size={16} /></Link>
                  </Button>
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

        {/* Hero Slider with Managed Content */}
        <section className="container mx-auto px-4 py-6">
          <div className="max-w-[982px] mx-auto">
            <div className="relative aspect-[982/500] w-full rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10 group bg-gray-100">
              {/* Background Layer */}
              {customization?.hero?.enabled && customization.hero.images?.length > 0 ? (
                <Carousel className="w-full h-full" opts={{ loop: true }}>
                  <CarouselContent className="h-full">
                    {customization.hero.images.map((img: any, idx: number) => (
                      <CarouselItem key={idx} className="h-full">
                        <div className="relative w-full h-full">
                          {img.imageUrl ? (
                            <Image 
                              src={img.imageUrl} 
                              alt="Banner Background" 
                              fill 
                              className="object-cover transition-transform duration-1000 group-hover:scale-105" 
                              priority={idx === 0} 
                            />
                          ) : (
                            <div className="w-full h-full bg-primary/5 flex items-center justify-center text-primary/40">
                              <Sparkles size={120} />
                            </div>
                          )}
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                </Carousel>
              ) : (
                <div className="w-full h-full bg-primary/5 flex items-center justify-center text-primary/40">
                  <Sparkles size={120} />
                </div>
              )}

              {/* Overlay Layer */}
              {heroSettings?.isEnabled && (
                <div 
                  className={cn("absolute inset-0 transition-opacity duration-500", heroSettings.overlayColor || 'bg-black')} 
                  style={{ opacity: heroSettings.overlayOpacity ?? 0.5 }} 
                />
              )}

              {/* Content Layer */}
              <div className={cn(
                "absolute inset-0 flex flex-col p-8 md:p-16 z-10 transition-all duration-500",
                getPosClass(heroSettings?.textPosition || 'center'),
                getAlignClass(heroSettings?.textAlignment || 'center')
              )}>
                {heroSettings?.isEnabled && (
                  <div className={cn("max-w-3xl space-y-6 transition-all duration-700 animate-in fade-in slide-in-from-bottom-4")}>
                    {/* Text Section */}
                    {heroSettings?.isTextEnabled && (
                      <div className="space-y-4">
                        <h2 className={cn(
                          "font-black uppercase font-headline tracking-tighter leading-tight drop-shadow-2xl",
                          heroSettings.titleSize || "text-4xl md:text-6xl",
                          heroSettings.titleColor || "text-white"
                        )}>
                          {heroSettings.titleText || t('hero_title')}
                        </h2>
                        <p className={cn(
                          "text-base md:text-xl font-medium opacity-90 leading-relaxed max-w-xl mx-auto md:mx-0",
                          heroSettings.titleColor || "text-white",
                          heroSettings.textAlignment === 'center' ? 'mx-auto' : heroSettings.textAlignment === 'right' ? 'ml-auto' : 'mr-auto'
                        )}>
                          {heroSettings.subtitleText || t('hero_subtitle')}
                        </p>
                      </div>
                    )}

                    {/* Button Section */}
                    {heroSettings?.isButtonEnabled && (
                      <div className={cn(
                        "flex w-full",
                        heroSettings.buttonPosition === 'center' ? 'justify-center' : heroSettings.buttonPosition === 'right' ? 'justify-end' : 'justify-start'
                      )}>
                        <Button 
                          asChild 
                          className={cn(
                            "font-black shadow-2xl transition-all hover:scale-105 active:scale-95 uppercase tracking-tight",
                            getButtonShape(heroSettings.buttonShape),
                            getButtonSize(heroSettings.buttonSize),
                            heroSettings.buttonColor || 'bg-primary'
                          )}
                        >
                          <Link href={heroSettings.buttonLink || '/services'}>
                            {heroSettings.buttonText || t('hero_cta')} 
                            <ArrowRight className="ml-2" />
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Marquee */}
        {isMounted && (!marqueeSettings || marqueeSettings.enabled) && (
          <section className="container mx-auto px-4 py-1">
            <div className={cn(marqueeSettings?.height || "h-5", "shadow-sm border border-white/10 flex items-center overflow-hidden transition-all duration-500", marqueeSettings?.radius || "rounded-full", marqueeSettings?.bgColor || "bg-[#081621]")}>
              <div className="h-full px-3 flex items-center gap-1.5 font-black text-[8px] uppercase tracking-widest shadow-md shrink-0 z-10 bg-primary text-white">
                <MarqueeIcon size={12} /> {marqueeSettings?.label || 'ALERT'}
              </div>
              <div className="flex-1 overflow-hidden relative h-full flex items-center">
                 <div className={cn("animate-marquee inline-flex items-center whitespace-nowrap px-4 gap-4", marqueeSettings?.textColor || "text-white", marqueeSettings?.fontSize || "text-[10px]")}>
                   <span className="font-bold">{getMarqueeContent()}</span>
                   {marqueeSettings?.ctaText && <Link href={marqueeSettings.ctaLink || "#"} className="px-2 py-0.5 rounded-full text-[7px] uppercase font-black bg-white text-gray-900">{marqueeSettings.ctaText}</Link>}
                 </div>
              </div>
            </div>
          </section>
        )}

        {/* Categories / Services Grid */}
        <div className="container mx-auto px-4 mt-8">
          <section className="py-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-primary/10 pb-3">
              <div className="space-y-1">
                <Badge className="bg-primary/10 text-primary border-none uppercase tracking-[0.2em] font-black py-1 px-4 rounded-full text-[9px]">Expert Solutions</Badge>
                <h2 className="text-2xl md:text-4xl font-black font-headline text-[#081621] uppercase tracking-tighter">{t('expert_services')}</h2>
              </div>
              <Button variant="outline" className="gap-2 font-black uppercase text-[10px] tracking-widest border-primary/20 text-primary rounded-full h-10 px-6" asChild>
                <Link href="/services">{t('view_all')} <ChevronRight size={14} /></Link>
              </Button>
            </div>
            
            <div className="mt-6">
              {servicesLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" size={40} /></div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {services?.map((service) => (
                    <div key={service.id} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100 flex flex-col relative h-full">
                      <Link href={`/service/${service.id}`} className="block relative aspect-[4/3] overflow-hidden shrink-0">
                        {service.imageUrl ? (
                          <Image 
                            src={service.imageUrl} 
                            alt={service.title || 'Service Image'} 
                            fill 
                            className="object-cover transition-transform duration-700 group-hover:scale-105" 
                          />
                        ) : (
                          <div className="w-full h-full bg-primary/5 flex items-center justify-center text-primary/40">
                            <Wrench size={40} />
                          </div>
                        )}
                        <div className="absolute top-3 left-3"><Badge className="bg-white/95 text-primary border-none shadow-md font-black text-[8px] uppercase px-2 py-0.5 rounded-full">{service.categoryId || 'General'}</Badge></div>
                      </Link>
                      <div className="p-3 flex flex-col flex-1 gap-2">
                        <h3 className="text-sm md:text-base font-bold line-clamp-1 uppercase tracking-tight">{service.title}</h3>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-black text-primary">৳{service.basePrice?.toLocaleString()}</span>
                          <span className="text-[9px] font-black uppercase text-gray-400">{t('price_from')}</span>
                        </div>
                        <Button size="sm" className="w-full rounded-full font-black text-[10px] uppercase shadow-md h-9 tracking-widest mt-auto" onClick={() => handleDirectServiceCheckout(service)}>
                          {t('book_now')}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Tools Grid */}
          <section className="py-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-primary/10 pb-3">
              <div className="space-y-1">
                <Badge className="bg-slate-100 text-slate-600 border-none uppercase tracking-[0.2em] font-black py-1 px-4 rounded-full text-[9px]">Supply Store</Badge>
                <h2 className="text-2xl md:text-4xl font-black font-headline text-[#081621] uppercase tracking-tighter">{t('professional_tools')}</h2>
              </div>
              <Button variant="link" className="gap-2 font-black uppercase text-[10px] tracking-widest text-primary p-0 h-auto" asChild>
                <Link href="/products">{t('view_all')} <ChevronRight size={14} /></Link>
              </Button>
            </div>
            <div className="mt-6">
              {productsLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" size={40} /></div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                  {products?.map((product) => <ProductCard key={product.id} product={product as any} />)}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </PublicLayout>
  );
}
