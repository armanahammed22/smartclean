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

  const offersQuery = useMemoFirebase(() => db ? query(collection(db, 'marketing_offers'), where('enabled', '==', true)) : null, [db]);
  const { data: offers } = useCollection(offersQuery);

  const linksQuery = useMemoFirebase(() => db ? query(collection(db, 'quick_links'), orderBy('order', 'asc')) : null, [db]);
  const { data: quickLinks } = useCollection(linksQuery);

  const actionsQuery = useMemoFirebase(() => db ? query(collection(db, 'quick_actions')) : null, [db]);
  const { data: quickActions } = useCollection(actionsQuery);

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

  const HeroBtnIconGlobal = ICONS[customization?.hero?.buttonIcon || 'ArrowRight'] || ArrowRight;

  return (
    <PublicLayout>
      <div className="flex flex-col bg-[#F2F4F8]">
        
        {/* 0. Admin Dashboard Summary */}
        {isAdmin && (
          <section className="container mx-auto px-4 py-6 md:py-6">
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

        {/* 1. Interactive Hero Slider */}
        <section className="container mx-auto px-4 py-6 md:py-6">
          <div className="max-w-[982px] mx-auto">
            {customization?.hero?.enabled && customization.hero.images?.length > 0 ? (
              <Carousel className="w-full" opts={{ loop: true }}>
                <CarouselContent>
                  {customization.hero.images.map((img: any, idx: number) => {
                    const SlideIcon = ICONS[img.btnIcon || 'ArrowRight'] || ArrowRight;
                    const alignClass = img.alignment === 'left' ? 'items-start text-left' : img.alignment === 'right' ? 'items-end text-right' : 'items-center text-center';
                    
                    return (
                      <CarouselItem key={idx}>
                        <div className="relative aspect-[982/500] w-full rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10 group bg-gray-100">
                          <Image 
                            src={img.imageUrl} 
                            alt={img.title || img.ctaText || `Banner ${idx + 1}`} 
                            fill 
                            className="object-cover transition-transform duration-1000 group-hover:scale-105" 
                            priority={idx === 0}
                          />
                          <div className={cn("absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-8 md:p-16", alignClass)}>
                             <div className="max-w-2xl space-y-4">
                                <h2 className="text-3xl md:text-5xl font-black text-white leading-tight uppercase font-headline tracking-tighter drop-shadow-lg">
                                  {img.title || customization.hero.title || t('hero_title')}
                                </h2>
                                {(img.subtitle || customization.hero.subtitle) && (
                                  <p className="text-white/80 text-sm md:text-lg font-medium drop-shadow-md">
                                    {img.subtitle || customization.hero.subtitle}
                                  </p>
                                )}
                                <Button asChild size="lg" className={cn("h-14 px-10 rounded-full font-black text-lg shadow-2xl text-white border-none transition-all hover:scale-105", img.btnColor || customization.hero.buttonColor || 'bg-primary')}>
                                  <Link href={img.ctaLink || customization.hero.buttonLink || '/services'}>
                                    {img.ctaText || customization.hero.buttonText || 'Book Now'} 
                                    <SlideIcon className="ml-2" />
                                  </Link>
                                </Button>
                             </div>
                          </div>
                        </div>
                      </CarouselItem>
                    );
                  })}
                </CarouselContent>
                {customization.hero.images.length > 1 && (
                  <>
                    <CarouselPrevious className="hidden md:flex left-6 bg-white/10 text-white border-none hover:bg-white/30 backdrop-blur-md rounded-full" />
                    <CarouselNext className="hidden md:flex right-6 bg-white/10 text-white border-none hover:bg-white/30 backdrop-blur-md rounded-full" />
                  </>
                )}
              </Carousel>
            ) : (
              <div className={cn(
                "relative aspect-[982/500] w-full rounded-[2.5rem] overflow-hidden bg-[#081621] flex flex-col justify-center text-white border border-white/5 shadow-2xl p-8 md:p-16",
                customization?.hero?.alignment === 'left' ? 'items-start text-left' : customization?.hero?.alignment === 'right' ? 'items-end text-right' : 'items-center text-center'
              )}>
                <div className="space-y-6 max-w-4xl relative z-10">
                  <Badge className="bg-primary text-white border-none uppercase tracking-[0.3em] font-black text-xs px-4 py-1.5 rounded-full shadow-lg shadow-primary/20">Premier Maintenance</Badge>
                  <h2 className="text-3xl md:text-6xl font-black uppercase font-headline tracking-tighter leading-none">
                    {customization?.hero?.title || t('hero_title')}
                  </h2>
                  <p className="text-sm md:text-xl opacity-60 font-medium leading-relaxed max-w-2xl">
                    {customization?.hero?.subtitle || t('hero_subtitle')}
                  </p>
                  <Button asChild size="lg" className={cn("h-16 px-12 rounded-full font-black text-xl shadow-2xl transition-all hover:scale-105 active:scale-95", customization?.hero?.buttonColor || 'bg-primary')}>
                    <Link href={customization?.hero?.buttonLink || '/services'}>
                      {customization?.hero?.buttonText || t('hero_cta')}
                      <HeroBtnIconGlobal className="ml-2" />
                    </Link>
                  </Button>
                </div>
                <div className="absolute inset-0 opacity-20 bg-[url('https://picsum.photos/seed/clean/1200/800')] bg-cover mix-blend-overlay" />
              </div>
            )}
          </div>
        </section>

        {/* 2. Marquee */}
        {isMounted && (!marqueeSettings || marqueeSettings.enabled) && (
          <section className="container mx-auto px-4 py-1">
            <div className={cn(
              marqueeSettings?.height || "h-5",
              "shadow-sm border border-white/10 flex items-center overflow-hidden transition-all duration-500",
              marqueeSettings?.radius || "rounded-full",
              marqueeSettings?.bgColor || "bg-[#081621]"
            )}>
              <div className={cn(
                "h-full px-3 flex items-center gap-1.5 font-black text-[8px] uppercase tracking-widest shadow-md shrink-0 z-10",
                "bg-primary text-white"
              )}>
                <MarqueeIcon size={12} /> {marqueeSettings?.label || 'ALERT'}
              </div>
              <div className="flex-1 overflow-hidden relative h-full flex items-center">
                 <div className={cn(
                   "animate-marquee inline-flex items-center whitespace-nowrap px-4 gap-4",
                   marqueeSettings?.textColor || "text-white",
                   marqueeSettings?.fontSize || "text-[10px]"
                 )}>
                   <span className="font-bold">{getMarqueeContent()}</span>
                   {marqueeSettings?.ctaText && marqueeSettings?.ctaLink && (
                     <Link href={marqueeSettings.ctaLink} className="px-2 py-0.5 rounded-full text-[7px] uppercase font-black bg-white text-gray-900 shadow-sm leading-none">
                       {marqueeSettings.ctaText}
                     </Link>
                   )}
                 </div>
              </div>
            </div>
          </section>
        )}

        {/* 3. Primary Service Actions */}
        <section className="container mx-auto px-4 py-6 md:py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Deep Cleaning', link: '/service/s_home', icon: Sparkles, grad: 'from-blue-600 to-indigo-700' },
              { label: 'AC Maintenance', link: '/service/s_ac', icon: Wrench, grad: 'from-emerald-500 to-teal-600' },
              { label: 'Pest Control', link: '/service/s_pest', icon: ShieldCheck, grad: 'from-orange-500 to-red-600' },
              { label: 'Home Repair', link: '/services', icon: Settings, grad: 'from-slate-700 to-slate-900' }
            ].map((action, i) => (
              <Link key={i} href={action.link} className={cn("relative h-24 md:h-32 rounded-[2rem] overflow-hidden group shadow-xl transition-all hover:scale-[1.02]", `bg-gradient-to-br ${action.grad}`)}>
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-10">
                  <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md border border-white/10"><action.icon className="text-white w-6 h-6 md:w-8 md:h-8" /></div>
                  <h3 className="text-white text-[10px] md:text-sm font-black uppercase tracking-widest">{action.label}</h3>
                </div>
                <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12 scale-150 group-hover:rotate-0 transition-transform duration-700"><action.icon size={100} className="text-white" /></div>
              </Link>
            ))}
          </div>
        </section>

        <div className="container mx-auto px-4">
          {/* Services Grid */}
          <section className="py-6 md:py-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-primary/10 pb-3">
              <div className="space-y-1">
                <Badge className="bg-primary/10 text-primary border-none uppercase tracking-[0.2em] font-black py-1 px-4 rounded-full text-[9px]">Expert Solutions</Badge>
                <h2 className="text-2xl md:text-4xl font-black font-headline text-[#081621] uppercase tracking-tighter">{t('expert_services')}</h2>
              </div>
              <Button variant="outline" className="gap-2 font-black uppercase text-[10px] tracking-widest border-primary/20 text-primary rounded-full h-10 px-6 hover:bg-primary/5" asChild>
                <Link href="/services">{t('view_all')} <ChevronRight size={14} /></Link>
              </Button>
            </div>
            
            <div className="mt-4">
              {servicesLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" size={40} /></div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {services?.map((service) => (
                    <div key={service.id} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100 flex flex-col relative h-full">
                      <Link href={`/service/${service.id}`} className="block relative aspect-[4/3] overflow-hidden shrink-0">
                        <Image 
                          src={service.imageUrl || 'https://picsum.photos/seed/srv/600/400'} 
                          alt={service.title || 'Service Image'} 
                          fill 
                          className="object-cover transition-transform duration-700 group-hover:scale-105" 
                        />
                        <div className="absolute top-3 left-3">
                          <Badge className="bg-white/95 text-primary border-none shadow-md backdrop-blur-md font-black text-[8px] uppercase px-2 py-0.5 rounded-full">{service.categoryId || 'General'}</Badge>
                        </div>
                      </Link>
                      <div className="p-3 flex flex-col flex-1 gap-2">
                        <div className="space-y-0.5">
                          <Link href={`/service/${service.id}`} className="hover:text-primary transition-colors block">
                            <h3 className="text-sm md:text-base font-bold group-hover:text-primary transition-colors line-clamp-1 leading-tight uppercase tracking-tight">{service.title}</h3>
                          </Link>
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-black text-primary tracking-tighter">৳{(service.basePrice || 0).toLocaleString()}</span>
                            <span className="text-[9px] font-black uppercase text-gray-400">{t('price_from')}</span>
                          </div>
                        </div>
                        <Button size="sm" className="w-full rounded-full font-black text-[10px] uppercase shadow-md h-9 tracking-widest transition-transform active:scale-95 mt-auto" asChild>
                          <Link href={`/service/${service.id}`}>{t('book_now')}</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Products Grid */}
          <section className="py-6 md:py-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-primary/10 pb-3">
              <div className="space-y-1">
                <Badge className="bg-slate-100 text-slate-600 border-none uppercase tracking-[0.2em] font-black py-1 px-4 rounded-full text-[9px]">Supply Store</Badge>
                <h2 className="text-2xl md:text-4xl font-black font-headline text-[#081621] uppercase tracking-tighter">{t('professional_tools')}</h2>
              </div>
              <Button variant="link" className="gap-2 font-black uppercase text-[10px] tracking-widest text-primary p-0 h-auto" asChild>
                <Link href="/products">{t('view_all')} <ChevronRight size={14} /></Link>
              </Button>
            </div>
            
            <div className="mt-4">
              {productsLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" size={40} /></div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                  {products?.map((product) => (
                    <ProductCard key={product.id} product={product as any} />
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </PublicLayout>
  );
}
