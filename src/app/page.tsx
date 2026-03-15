
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
  Megaphone,
  Sparkles
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

  const carouselOffers = offers?.filter(o => o.placement === 'top');

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

  return (
    <PublicLayout>
      <div className="flex flex-col gap-6 pb-16 bg-[#F2F4F8]">
        
        {/* 0. Admin Dashboard Summary */}
        {isAdmin && (
          <section className="container mx-auto px-4 pt-6">
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
        <section className="container mx-auto px-4 pt-6">
          <div className="max-w-[982px] mx-auto">
            {customization?.hero?.enabled && customization.hero.images?.length > 0 ? (
              <Carousel className="w-full" opts={{ loop: true }}>
                <CarouselContent>
                  {customization.hero.images.map((img: any, idx: number) => (
                    <CarouselItem key={idx}>
                      <div className="relative aspect-[982/500] w-full rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10 group bg-gray-100">
                        <Image 
                          src={img.imageUrl} 
                          alt={img.ctaText || `Banner ${idx + 1}`} 
                          fill 
                          className="object-cover transition-transform duration-1000 group-hover:scale-105" 
                          priority={idx === 0}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-8 md:p-16">
                           <div className="max-w-xl space-y-4">
                              <h2 className="text-3xl md:text-5xl font-black text-white leading-tight uppercase font-headline tracking-tighter">{img.ctaText || t('hero_title')}</h2>
                              <Button asChild size="lg" className="h-14 px-10 rounded-xl font-black text-lg shadow-2xl bg-primary text-white border-none hover:bg-primary/90">
                                <Link href={img.ctaLink || '/services'}>Book This Service <ChevronRight className="ml-2" /></Link>
                              </Button>
                           </div>
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {customization.hero.images.length > 1 && (
                  <>
                    <CarouselPrevious className="hidden md:flex left-6 bg-white/10 text-white border-none hover:bg-white/30 backdrop-blur-md rounded-full" />
                    <CarouselNext className="hidden md:flex right-6 bg-white/10 text-white border-none hover:bg-white/30 backdrop-blur-md rounded-full" />
                  </>
                )}
              </Carousel>
            ) : (
              <div className="relative aspect-[982/500] w-full rounded-[2.5rem] overflow-hidden bg-[#081621] flex items-center justify-center text-white border border-white/5 shadow-2xl">
                <div className="text-center space-y-6 px-8 max-w-4xl relative z-10">
                  <Badge className="bg-primary text-white border-none uppercase tracking-[0.3em] font-black text-xs px-4 py-1.5 rounded-full shadow-lg shadow-primary/20">Premier Maintenance</Badge>
                  <h2 className="text-3xl md:text-6xl font-black uppercase font-headline tracking-tighter leading-none">{t('hero_title')}</h2>
                  <p className="text-sm md:text-xl opacity-60 font-medium leading-relaxed max-w-2xl mx-auto">{t('hero_subtitle')}</p>
                  <Button asChild size="lg" className="h-16 px-12 rounded-2xl font-black text-xl shadow-2xl shadow-primary/30 transition-all hover:scale-105 active:scale-95">
                    <Link href="/services">{t('hero_cta')}</Link>
                  </Button>
                </div>
                <div className="absolute inset-0 opacity-20 bg-[url('https://picsum.photos/seed/clean/1200/800')] bg-cover mix-blend-overlay" />
              </div>
            )}
          </div>
        </section>

        {/* 2. Marquee */}
        {isMounted && (!marqueeSettings || marqueeSettings.enabled) && (
          <section className="container mx-auto px-4">
            <div className={cn(
              "h-14 shadow-md border border-white/10 flex items-center overflow-hidden transition-all duration-500",
              marqueeSettings?.radius || "rounded-full",
              marqueeSettings?.bgColor || "bg-[#081621]"
            )}>
              <div className={cn(
                "h-full px-8 flex items-center gap-2 font-black text-xs uppercase tracking-widest shadow-lg shrink-0 z-10",
                "bg-primary text-white"
              )}>
                <MarqueeIcon size={18} /> {marqueeSettings?.label || 'ALERT'}
              </div>
              <div className="flex-1 overflow-hidden relative h-full flex items-center">
                 <div className={cn(
                   "animate-marquee inline-flex items-center whitespace-nowrap px-6 gap-6",
                   marqueeSettings?.textColor || "text-white",
                   marqueeSettings?.fontSize || "text-sm"
                 )}>
                   <span className="font-bold">{getMarqueeContent()}</span>
                   {marqueeSettings?.ctaText && marqueeSettings?.ctaLink && (
                     <Link href={marqueeSettings.ctaLink} className="px-4 py-1.5 rounded-full text-[10px] uppercase font-black bg-white text-gray-900 shadow-lg">
                       {marqueeSettings.ctaText}
                     </Link>
                   )}
                 </div>
              </div>
            </div>
          </section>
        )}

        {/* 3. Primary Service Actions */}
        <section className="container mx-auto px-4 mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[
              { label: 'Deep Cleaning', link: '/service/s_home', icon: Sparkles, grad: 'from-blue-600 to-indigo-700' },
              { label: 'AC Maintenance', link: '/service/s_ac', icon: Wrench, grad: 'from-emerald-500 to-teal-600' },
              { label: 'Pest Control', link: '/service/s_pest', icon: ShieldCheck, grad: 'from-orange-500 to-red-600' },
              { label: 'Home Repair', link: '/services', icon: Settings, grad: 'from-slate-700 to-slate-900' }
            ].map((action, i) => (
              <Link key={i} href={action.link} className={cn("relative h-24 md:h-32 rounded-3xl overflow-hidden group shadow-xl transition-all hover:scale-[1.02]", `bg-gradient-to-br ${action.grad}`)}>
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-10">
                  <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md border border-white/10"><action.icon className="text-white w-6 h-6 md:w-8 md:h-8" /></div>
                  <h3 className="text-white text-[10px] md:text-sm font-black uppercase tracking-widest">{action.label}</h3>
                </div>
                <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12 scale-150 group-hover:rotate-0 transition-transform duration-700"><action.icon size={100} className="text-white" /></div>
              </Link>
            ))}
          </div>
        </section>

        <div className="container mx-auto px-4 space-y-24 mt-12">
          {/* Services Grid (Main) */}
          <section className="space-y-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-primary/10 pb-8">
              <div className="space-y-2">
                <Badge className="bg-primary/10 text-primary border-none uppercase tracking-[0.3em] font-black py-1.5 px-5 rounded-full text-[10px]">Expert Solutions</Badge>
                <h2 className="text-3xl md:text-5xl font-black font-headline text-[#081621] uppercase tracking-tighter">{t('expert_services')}</h2>
                <p className="text-muted-foreground text-sm font-medium max-w-xl">{t('services_subtitle')}</p>
              </div>
              <Button variant="outline" className="gap-2 font-black uppercase text-xs tracking-widest border-primary/20 text-primary rounded-xl h-12 px-8 hover:bg-primary/5 shadow-sm" asChild>
                <Link href="/services">{t('view_all')} <ChevronRight size={16} /></Link>
              </Button>
            </div>
            
            {servicesLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={48} /></div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-8">
                {services?.map((service) => (
                  <div key={service.id} className="group bg-white rounded-none overflow-hidden shadow-sm hover:shadow-[0_20px_50px_rgba(34,99,192,0.1)] transition-all duration-700 border border-transparent hover:border-primary/20 flex flex-col relative h-full">
                    <Link href={`/service/${service.id}`} className="block relative aspect-square overflow-hidden shrink-0">
                      <Image 
                        src={service.imageUrl || 'https://picsum.photos/seed/srv/600/400'} 
                        alt={service.title || 'Service Image'} 
                        fill 
                        className="object-cover group-hover:scale-110 transition-transform duration-700" 
                      />
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-white/95 text-primary border-none shadow-xl backdrop-blur-md font-black text-[9px] uppercase px-3 py-1 rounded-none">{service.categoryId || 'General'}</Badge>
                      </div>
                    </Link>
                    <div className="p-6 flex flex-col flex-1 gap-4">
                      <Link href={`/service/${service.id}`} className="hover:text-primary transition-colors block">
                        <h3 className="text-base md:text-lg font-black group-hover:text-primary transition-colors line-clamp-1 leading-tight uppercase tracking-tight">{service.title}</h3>
                      </Link>
                      <div className="flex flex-col border-t border-gray-50 pt-4 gap-4 mt-auto">
                        <div className="flex justify-between items-center">
                          <div className="flex flex-col">
                            <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest">{t('price_from')}</span>
                            <span className="text-xl font-black text-primary tracking-tighter">৳{(service.basePrice || 0).toLocaleString()}</span>
                          </div>
                          <div className="p-2 bg-gray-50 rounded-none text-gray-400"><Wrench size={16} /></div>
                        </div>
                        <Button size="lg" className="w-full rounded-none font-black text-xs uppercase shadow-xl h-12 tracking-widest transition-all hover:translate-y-[-2px] active:scale-95" asChild>
                          <Link href={`/service/${service.id}`}>{t('book_now')}</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Products Grid (Secondary) */}
          <section className="space-y-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-primary/10 pb-8">
              <div className="space-y-2">
                <Badge className="bg-slate-100 text-slate-600 border-none uppercase tracking-[0.3em] font-black py-1.5 px-5 rounded-full text-[10px]">Supply Store</Badge>
                <h2 className="text-3xl md:text-5xl font-black font-headline text-[#081621] uppercase tracking-tighter">{t('professional_tools')}</h2>
                <p className="text-muted-foreground text-sm font-medium">{t('products_subtitle')}</p>
              </div>
              <Button variant="link" className="gap-2 font-black uppercase text-xs tracking-widest text-primary p-0 h-auto" asChild>
                <Link href="/products">{t('view_all')} <ChevronRight size={16} /></Link>
              </Button>
            </div>
            
            {productsLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={40} /></div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-8">
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
