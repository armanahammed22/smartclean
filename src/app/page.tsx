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
  const offersQuery = useMemoFirebase(() => db ? query(collection(db, 'marketing_offers'), where('enabled', '==', true)) : null, [db]);
  const { data: offers } = useCollection(offersQuery);

  const linksQuery = useMemoFirebase(() => db ? query(collection(db, 'quick_links'), orderBy('order', 'asc')) : null, [db]);
  const { data: quickLinks } = useCollection(linksQuery);

  const actionsQuery = useMemoFirebase(() => db ? query(collection(db, 'quick_actions')) : null, [db]);
  const { data: quickActions } = useCollection(actionsQuery);

  const productsQuery = useMemoFirebase(() => db ? query(collection(db, 'products'), limit(10)) : null, [db]);
  const servicesQuery = useMemoFirebase(() => db ? query(collection(db, 'services'), limit(10)) : null, [db]);

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

        {/* 2. Promotional Slider */}
        <section className="container mx-auto px-4">
          <Carousel className="w-full" opts={{ loop: true }}>
            <CarouselContent>
              {carouselOffers?.length ? carouselOffers.map((offer) => (
                <CarouselItem key={offer.id}>
                  <Link href={offer.link || '#'} className="block relative aspect-[21/9] md:aspect-[21/7] rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10">
                    <Image src={offer.imageUrl} alt={offer.title || 'Promo'} fill className="object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8 md:p-16">
                       <h2 className="text-white text-3xl md:text-6xl font-black uppercase tracking-tighter leading-tight max-w-3xl">{offer.title}</h2>
                    </div>
                  </Link>
                </CarouselItem>
              )) : (
                <CarouselItem>
                  <div className="relative aspect-[21/9] md:aspect-[21/7] rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-[#081621] to-[#0a253a] flex items-center justify-center text-white border border-white/5 shadow-2xl">
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
        </section>

        {/* 3. Marquee */}
        {(!marqueeSettings || marqueeSettings.enabled) && (
          <section className="container mx-auto px-4">
            <div className={cn(
              "bg-white h-14 shadow-sm border border-gray-100 flex items-center overflow-hidden",
              marqueeSettings?.radius || "rounded-full"
            )}>
              <div className={cn(
                "h-full px-8 flex items-center gap-2 z-10 text-white font-black text-xs uppercase tracking-widest shadow-lg",
                marqueeSettings?.bgColor || "bg-primary"
              )}>
                <MarqueeIcon size={18} /> {marqueeSettings?.label || 'INFO'}
              </div>
              <div className="flex-1 overflow-hidden relative h-full flex items-center">
                 <p className="animate-marquee inline-block whitespace-nowrap text-xs md:text-sm font-bold text-gray-600 px-6">
                   {getMarqueeContent()}
                 </p>
              </div>
            </div>
          </section>
        )}

        {/* 4. Quick Action Cards */}
        <section className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {quickActions?.length ? quickActions.map((action) => {
              const Icon = ICONS[action.iconName] || Zap;
              return (
                <Link key={action.id} href={action.link || '#'} className={`bg-gradient-to-br ${action.bgGradient} rounded-[2rem] p-10 flex items-center justify-between shadow-xl group hover:shadow-2xl transition-all overflow-hidden relative border border-white/5`}>
                  <div className="space-y-4 relative z-10">
                    <Icon size={56} className="text-white opacity-80 group-hover:scale-110 transition-transform duration-500" />
                    <h3 className="text-white text-3xl font-black uppercase tracking-tight leading-none">
                      {t(action.title)}
                    </h3>
                  </div>
                  <div className="absolute top-0 right-0 p-4 opacity-10 scale-150 rotate-12 group-hover:rotate-0 transition-transform duration-700 pointer-events-none">
                    <Icon size={160} className="text-white" />
                  </div>
                </Link>
              );
            }) : (
              <>
                <Link href="/services" className="bg-gradient-to-br from-orange-500 to-red-600 rounded-[2rem] p-10 flex items-center justify-between shadow-xl group overflow-hidden relative border border-white/5">
                  <div className="space-y-4 relative z-10">
                    <Wrench size={56} className="text-white opacity-80" />
                    <h3 className="text-white text-3xl font-black uppercase tracking-tight">{t('nav_services')}</h3>
                  </div>
                  <div className="absolute right-0 top-0 p-4 opacity-10 rotate-12 scale-150"><Wrench size={160} className="text-white" /></div>
                </Link>
                <Link href="/products" className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[2rem] p-10 flex items-center justify-between shadow-xl group overflow-hidden relative border border-white/5">
                  <div className="space-y-4 relative z-10">
                    <Package size={56} className="text-white opacity-80" />
                    <h3 className="text-white text-3xl font-black uppercase tracking-tight">{t('nav_products')}</h3>
                  </div>
                  <div className="absolute right-0 top-0 p-4 opacity-10 rotate-12 scale-150"><Package size={160} className="text-white" /></div>
                </Link>
              </>
            )}
          </div>
        </section>

        <div className="container mx-auto px-4 space-y-24 mt-16">
          
          {/* Services Grid */}
          <section className="space-y-10">
            <div className="flex justify-between items-end gap-4 border-b pb-6">
              <div className="space-y-2">
                <h2 className="text-3xl md:text-4xl font-black font-headline text-[#081621] uppercase tracking-tight">{t('expert_services')}</h2>
                <p className="text-muted-foreground font-medium">{t('service_desc')}</p>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                {isAdmin && (
                  <Button variant="outline" size="sm" className="hidden sm:flex gap-2 font-black border-primary text-primary rounded-xl" asChild>
                    <Link href="/admin/services"><Plus size={16} /> ADD</Link>
                  </Button>
                )}
                <Button variant="link" className="gap-2 font-black uppercase text-xs tracking-widest text-primary" asChild>
                  <Link href="/services">{t('view_all')} <ChevronRight size={16} /></Link>
                </Button>
              </div>
            </div>
            
            {servicesLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={40} /></div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                {services?.map((service) => (
                  <div key={service.id} className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-transparent hover:border-primary/20 flex flex-col relative">
                    {isAdmin && (
                      <div className="absolute top-4 right-4 z-20">
                        <Button size="icon" variant="secondary" className="h-9 w-9 rounded-full shadow-xl border-none backdrop-blur-md bg-white/80" asChild>
                          <Link href="/admin/services"><Settings size={16} className="text-primary" /></Link>
                        </Button>
                      </div>
                    )}
                    <Link href={`/service/${service.id}`} className="flex flex-col h-full flex-1">
                      <div className="relative aspect-video overflow-hidden">
                        <Image 
                          src={service.imageUrl || 'https://picsum.photos/seed/srv/600/400'} 
                          alt={service.title || 'Cleaning Service'} 
                          fill 
                          className="object-cover group-hover:scale-110 transition-transform duration-700" 
                        />
                        <div className="absolute top-4 left-4">
                          <Badge className="bg-white/95 text-primary border-none shadow-xl backdrop-blur-sm font-black text-[10px] uppercase hidden sm:inline-flex px-3 py-1 rounded-lg">{service.category || 'General'}</Badge>
                        </div>
                      </div>
                      <div className="p-5 md:p-8 space-y-4 flex-1">
                        <h3 className="text-sm md:text-xl font-black group-hover:text-primary transition-colors line-clamp-1 leading-tight">{service.title}</h3>
                        <p className="text-[10px] md:text-xs text-muted-foreground line-clamp-2 hidden sm:block leading-relaxed">{service.description}</p>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-6 border-t gap-4">
                          <div className="flex flex-col">
                            <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">{t('base_price')}</span>
                            <span className="text-base md:text-xl font-black text-primary">
                              ৳{(service.basePrice || 0).toLocaleString()} 
                            </span>
                          </div>
                          <Button size="sm" className="rounded-xl font-black px-4 h-10 md:h-11 text-[10px] uppercase shadow-lg shadow-primary/10">
                            {t('book_now')}
                          </Button>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Products Grid */}
          <section className="space-y-10">
            <div className="flex justify-between items-end gap-4 border-b pb-6">
              <div className="space-y-2">
                <h2 className="text-3xl md:text-4xl font-black font-headline text-[#081621] uppercase tracking-tight">{t('professional_tools')}</h2>
                <p className="text-muted-foreground font-medium">{t('product_desc')}</p>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                {isAdmin && (
                  <Button variant="outline" size="sm" className="hidden sm:flex gap-2 font-black border-primary text-primary rounded-xl" asChild>
                    <Link href="/admin/products"><Plus size={16} /> ADD</Link>
                  </Button>
                )}
                <Button variant="link" className="gap-2 font-black uppercase text-xs tracking-widest text-primary" asChild>
                  <Link href="/products">{t('view_all')} <ChevronRight size={16} /></Link>
                </Button>
              </div>
            </div>
            
            {productsLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={40} /></div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
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
