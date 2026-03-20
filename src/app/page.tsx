
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/components/providers/language-provider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PublicLayout } from '@/components/layout/public-layout';
import { useCollection, useFirestore, useMemoFirebase, useDoc, useUser } from '@/firebase';
import { collection, query, doc, limit, where, orderBy } from 'firebase/firestore';
import { 
  ArrowRight, 
  Wrench, 
  ChevronRight, 
  Loader2, 
  LayoutDashboard, 
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Clock,
  Zap,
  Package,
  ShoppingCart
} from 'lucide-react';
import { ProductCard } from '@/components/products/product-card';
import { useCart } from '@/components/providers/cart-provider';
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem
} from '@/components/ui/carousel';
import { cn } from '@/lib/utils';

export default function SmartCleanHomePage() {
  const { t } = useLanguage();
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

  // Data Fetching: Hero Banners (Main)
  const mainBannersQuery = useMemoFirebase(() => db ? query(
    collection(db, 'hero_banners'), 
    where('isActive', '==', true),
    where('type', '==', 'main'),
    orderBy('order', 'asc')
  ) : null, [db]);
  const { data: mainBanners, isLoading: mainLoading } = useCollection(mainBannersQuery);

  // Data Fetching: Hero Banners (Side)
  const sideBannersQuery = useMemoFirebase(() => db ? query(
    collection(db, 'hero_banners'),
    where('isActive', '==', true),
    where('type', '==', 'side'),
    orderBy('order', 'asc'),
    limit(2)
  ) : null, [db]);
  const { data: sideBanners, isLoading: sideLoading } = useCollection(sideBannersQuery);

  // Data Fetching: Top Navigation Categories
  const topNavQuery = useMemoFirebase(() => db ? query(
    collection(db, 'top_nav_categories'),
    orderBy('order', 'asc')
  ) : null, [db]);
  const { data: topNavCategories } = useCollection(topNavQuery);

  // Categorized Products & Services
  const popularProductsQuery = useMemoFirebase(() => db ? query(collection(db, 'products'), where('status', '==', 'Active'), where('isPopular', '==', true), limit(5)) : null, [db]);
  const recentProductsQuery = useMemoFirebase(() => db ? query(collection(db, 'products'), where('status', '==', 'Active'), orderBy('createdAt', 'desc'), limit(5)) : null, [db]);
  const popularServicesQuery = useMemoFirebase(() => db ? query(collection(db, 'services'), where('status', '==', 'Active'), where('isPopular', '==', true), limit(5)) : null, [db]);

  const { data: popularProducts, isLoading: pPLoading } = useCollection(popularProductsQuery);
  const { data: recentProducts, isLoading: rPLoading } = useCollection(recentProductsQuery);
  const { data: popularServices, isLoading: pSLoading } = useCollection(popularServicesQuery);

  const handleDirectServiceCheckout = (service: any) => {
    addToCart(service);
    setCheckoutOpen(true);
  };

  const SectionHeader = ({ icon: Icon, title, subtitle, link }: { icon: any, title: string, subtitle: string, link: string }) => (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-primary/10 pb-3 mb-8">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary/10 rounded-lg text-primary"><Icon size={16} /></div>
          <Badge className="bg-primary/5 text-primary border-none uppercase tracking-[0.2em] font-black py-0.5 px-3 rounded-full text-[8px]">{subtitle}</Badge>
        </div>
        <h2 className="text-2xl md:text-3xl font-black font-headline text-[#081621] uppercase tracking-tighter">{title}</h2>
      </div>
      <Button variant="link" className="gap-2 font-black uppercase text-[10px] tracking-widest text-primary p-0 h-auto" asChild>
        <Link href={link}>{t('view_all')} <ChevronRight size={14} /></Link>
      </Button>
    </div>
  );

  return (
    <PublicLayout>
      <div className="flex flex-col bg-[#F2F4F8]">
        
        {/* Top Category Scroller */}
        <div className="bg-white border-b overflow-x-auto no-scrollbar py-2">
          <div className="container mx-auto px-4 flex items-center justify-between gap-6 whitespace-nowrap min-w-max">
            {topNavCategories?.length ? topNavCategories.map((cat) => (
              <Link 
                key={cat.id} 
                href={cat.link || `/services?category=${cat.name}`} 
                className="text-[11px] font-bold text-gray-700 hover:text-primary transition-colors px-1"
              >
                {cat.name}
              </Link>
            )) : (
              // Fallback static categories
              ["Desktop", "Laptop", "Component", "Monitor", "Power", "Phone", "Tablet", "Appliance"].map(cat => (
                <Link key={cat} href={`/services?category=${cat}`} className="text-[11px] font-bold text-gray-400 hover:text-primary transition-colors px-1">{cat}</Link>
              ))
            )}
          </div>
        </div>

        {isAdmin && (
          <section className="container mx-auto px-4 py-4">
            <div className="bg-[#081621] text-white p-4 rounded-2xl shadow-xl relative overflow-hidden group border border-white/5 flex items-center justify-between">
              <div className="relative z-10 flex items-center gap-3">
                <ShieldCheck className="text-primary" size={20} />
                <span className="text-xs font-black uppercase tracking-widest">Admin Control Hub</span>
              </div>
              <Button size="sm" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 font-bold h-8 rounded-lg" asChild>
                <Link href="/admin/dashboard">Dashboard <ArrowRight size={14} className="ml-1" /></Link>
              </Button>
            </div>
          </section>
        )}

        {/* Hero Section Grid */}
        <section className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            
            {/* Main Large Slider (Left) */}
            <div className="lg:col-span-9">
              <div className="relative aspect-[982/500] w-full rounded-2xl md:rounded-[2.5rem] overflow-hidden shadow-xl border border-white/10 group bg-gray-100">
                {mainLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                    <Loader2 className="animate-spin text-primary" size={40} />
                  </div>
                ) : mainBanners?.length ? (
                  <Carousel className="w-full h-full" opts={{ loop: true }}>
                    <CarouselContent className="h-full">
                      {mainBanners.map((banner) => (
                        <CarouselItem key={banner.id} className="h-full relative">
                          <Link href={banner.buttonLink || '#'} className="absolute inset-0">
                            {banner.imageUrl ? (
                              <Image 
                                src={banner.imageUrl} 
                                alt={banner.title || 'Slide'} 
                                fill 
                                className="object-cover transition-transform duration-1000 group-hover:scale-105" 
                                priority
                              />
                            ) : (
                              <div className="w-full h-full bg-primary/5 flex items-center justify-center text-primary/40">
                                <Sparkles size={120} />
                              </div>
                            )}
                            <div 
                              className="absolute inset-0 transition-opacity duration-500" 
                              style={{ 
                                backgroundColor: banner.overlayColor || '#000000',
                                opacity: (banner.overlayOpacity || 0) / 100 
                              }} 
                            />
                          </Link>
                          {banner.isTextEnabled !== false && (
                            <div className={cn(
                              "relative z-10 h-full flex flex-col p-8 md:p-12 pointer-events-none",
                              banner.textPosition === 'top' ? 'justify-start' : 
                              banner.textPosition === 'bottom' ? 'justify-end' : 'justify-center',
                              banner.textAlignment === 'left' ? 'items-start text-left' :
                              banner.textAlignment === 'right' ? 'items-end text-right' : 'items-center text-center'
                            )}>
                              <div className="space-y-4 max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <h2 
                                  className={cn("font-black uppercase tracking-tighter leading-tight drop-shadow-2xl", banner.titleSize || 'text-3xl md:text-5xl')}
                                  style={{ color: banner.titleColor || '#ffffff' }}
                                >
                                  {banner.title}
                                </h2>
                                <p className="text-xs md:text-lg font-medium text-white/90 drop-shadow-md max-w-xl mx-auto">
                                  {banner.subtitle}
                                </p>
                              </div>
                            </div>
                          )}
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                  </Carousel>
                ) : (
                  <div className="w-full h-full bg-[#081621] flex items-center justify-center text-white">
                    <p className="font-bold uppercase tracking-widest opacity-20">Main Hero Slider</p>
                  </div>
                )}
              </div>
            </div>

            {/* Side Small Banners (Right) */}
            <div className="lg:col-span-3 flex flex-col gap-4">
              {[0, 1].map((idx) => {
                const banner = sideBanners?.[idx];
                return (
                  <div key={idx} className="flex-1 relative rounded-2xl md:rounded-[1.5rem] overflow-hidden shadow-lg group bg-white border border-gray-100 min-h-[150px]">
                    {sideLoading ? (
                      <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="animate-spin text-primary/30" size={24} /></div>
                    ) : banner ? (
                      <Link href={banner.buttonLink || '#'} className="block w-full h-full relative">
                        <Image 
                          src={banner.imageUrl} 
                          alt={banner.title || 'Side Banner'} 
                          fill 
                          className="object-cover transition-transform duration-700 group-hover:scale-110" 
                        />
                        <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors" />
                      </Link>
                    ) : (
                      <div className="w-full h-full bg-gray-50 flex items-center justify-center text-[10px] font-bold text-gray-300 uppercase tracking-widest text-center px-4">
                        Promo Banner {idx + 1}<br/>(Managed in Admin)
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>
        </section>

        {/* Catalog Content */}
        <div className="container mx-auto px-4 mt-8 space-y-24 pb-24">
          
          {/* POPULAR SERVICES */}
          <section>
            <SectionHeader icon={TrendingUp} title="Popular Services" subtitle="Highest Rated" link="/services" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
              {pSLoading ? Array(5).fill(0).map((_, i) => <div key={i} className="aspect-[4/3] rounded-3xl bg-gray-200 animate-pulse" />) : 
                popularServices?.map((service) => (
                  <div key={service.id} className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100 flex flex-col h-full">
                    <Link href={`/service/${service.id}`} className="block relative aspect-[4/3] overflow-hidden shrink-0">
                      {service.imageUrl ? (
                        <Image src={service.imageUrl} alt={service.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                      ) : (
                        <div className="w-full h-full bg-primary/5 flex items-center justify-center text-primary/40"><Wrench size={40} /></div>
                      )}
                    </Link>
                    <div className="p-4 flex flex-col flex-1 gap-3">
                      <h3 className="text-[13px] font-black uppercase tracking-tight line-clamp-1">{service.title}</h3>
                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-lg font-black text-primary">৳{service.basePrice?.toLocaleString()}</span>
                        <Button size="sm" variant="secondary" className="rounded-full h-8 px-4 text-[10px] font-black uppercase" onClick={() => handleDirectServiceCheckout(service)}>
                          Book
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
          </section>

          {/* RECENT PRODUCTS */}
          <section>
            <SectionHeader icon={Clock} title="New Arrivals" subtitle="Recently Added" link="/products" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
              {rPLoading ? Array(5).fill(0).map((_, i) => <div key={i} className="aspect-[4/3] rounded-3xl bg-gray-200 animate-pulse" />) : 
                recentProducts?.map((product) => <ProductCard key={product.id} product={product as any} />)
              }
            </div>
          </section>

        </div>
      </div>
    </PublicLayout>
  );
}
