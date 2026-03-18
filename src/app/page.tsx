
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
  Zap
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

  // Data Fetching: Hero Banners
  const bannersQuery = useMemoFirebase(() => db ? query(collection(db, 'hero_banners')) : null, [db]);
  const { data: banners, isLoading: bannersLoading } = useCollection(bannersQuery);

  const activeBanners = React.useMemo(() => {
    if (!banners) return [];
    return banners
      .filter(b => b.isActive === true)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [banners]);

  // Data Fetching: Categorized Products
  const popularProductsQuery = useMemoFirebase(() => db ? query(collection(db, 'products'), where('status', '==', 'Active'), where('isPopular', '==', true), limit(5)) : null, [db]);
  const recentProductsQuery = useMemoFirebase(() => db ? query(collection(db, 'products'), where('status', '==', 'Active'), orderBy('createdAt', 'desc'), limit(5)) : null, [db]);
  const bestSellingProductsQuery = useMemoFirebase(() => db ? query(collection(db, 'products'), where('status', '==', 'Active'), orderBy('salesCount', 'desc'), limit(5)) : null, [db]);

  // Data Fetching: Categorized Services
  const popularServicesQuery = useMemoFirebase(() => db ? query(collection(db, 'services'), where('status', '==', 'Active'), where('isPopular', '==', true), limit(5)) : null, [db]);
  const recentServicesQuery = useMemoFirebase(() => db ? query(collection(db, 'services'), where('status', '==', 'Active'), orderBy('createdAt', 'desc'), limit(5)) : null, [db]);

  const { data: popularProducts, isLoading: pPLoading } = useCollection(popularProductsQuery);
  const { data: recentProducts, isLoading: rPLoading } = useCollection(recentProductsQuery);
  const { data: bestSellingProducts, isLoading: bPLoading } = useCollection(bestSellingProductsQuery);
  const { data: popularServices, isLoading: pSLoading } = useCollection(popularServicesQuery);
  const { data: recentServices, isLoading: rSLoading } = useCollection(recentServicesQuery);

  const handleDirectServiceCheckout = (service: any) => {
    addToCart(service);
    setCheckoutOpen(true);
  };

  const SectionHeader = ({ icon: Icon, title, subtitle, link }: { icon: any, title: string, subtitle: string, link: string }) => (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-primary/10 pb-3 mb-8">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
            <Icon size={16} />
          </div>
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
        
        {/* Admin Center Shortcut */}
        {isAdmin && (
          <section className="container mx-auto px-4 py-6">
            <div className="bg-[#081621] text-white p-6 md:p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group border border-white/5">
              <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 pointer-events-none">
                <LayoutDashboard size={160} />
              </div>
              <div className="relative z-10 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                      <ShieldCheck className="text-primary" /> System Management
                    </h2>
                    <p className="text-white/60 text-[10px] font-black uppercase tracking-widest">Administrative Control Hub</p>
                  </div>
                  <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 font-bold h-11 rounded-xl" asChild>
                    <Link href="/admin/dashboard">Go to Dashboard <ArrowRight size={16} /></Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Hero Carousel */}
        <section className="container mx-auto px-4 py-6">
          <div className="max-w-[982px] mx-auto">
            <div className="relative aspect-[982/500] w-full rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10 group bg-gray-100">
              {bannersLoading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                  <Loader2 className="animate-spin text-primary" size={40} />
                </div>
              ) : activeBanners.length > 0 ? (
                <Carousel className="w-full h-full" opts={{ loop: true }}>
                  <CarouselContent className="h-full">
                    {activeBanners.map((banner) => (
                      <CarouselItem key={banner.id} className="h-full relative">
                        <div className="absolute inset-0">
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
                              opacity: (banner.overlayOpacity || 40) / 100 
                            }} 
                          />
                        </div>
                        <div className={cn(
                          "relative z-10 h-full flex flex-col p-8 md:p-12",
                          banner.textPosition === 'top' ? 'justify-start' : 
                          banner.textPosition === 'bottom' ? 'justify-end' : 'justify-center',
                          banner.textAlignment === 'left' ? 'items-start text-left' :
                          banner.textAlignment === 'right' ? 'items-end text-right' : 'items-center text-center'
                        )}>
                          <div className="space-y-4 max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {banner.isTextEnabled !== false && (
                              <>
                                <h2 
                                  className={cn("font-black uppercase tracking-tighter leading-tight drop-shadow-2xl", banner.titleSize || 'text-3xl md:text-5xl')}
                                  style={{ color: banner.titleColor || '#ffffff' }}
                                >
                                  {banner.title}
                                </h2>
                                <p className="text-xs md:text-lg font-medium text-white/90 drop-shadow-md max-w-xl mx-auto">
                                  {banner.subtitle}
                                </p>
                              </>
                            )}
                            {banner.isButtonEnabled !== false && banner.buttonText && (
                              <div className="pt-2">
                                <Button 
                                  asChild 
                                  className={cn(
                                    "h-10 md:h-12 px-8 md:px-10 font-black text-xs md:text-base uppercase tracking-tight shadow-2xl transition-all hover:scale-105 active:scale-95",
                                    banner.buttonShape || 'rounded-2xl'
                                  )}
                                  style={{ backgroundColor: banner.buttonColor || '#22c55e' }}
                                >
                                  <Link href={banner.buttonLink || '/services'}>
                                    {banner.buttonText} <ArrowRight className="ml-2" />
                                  </Link>
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                </Carousel>
              ) : (
                <div className="relative w-full h-full flex flex-col justify-center items-center text-center p-8 bg-[#081621]">
                  <div className="absolute inset-0 opacity-20 bg-[url('https://picsum.photos/seed/clean/982/500')] bg-cover" />
                  <div className="relative z-10 space-y-4">
                    <h2 className="text-2xl md:text-5xl font-black uppercase text-white tracking-tighter leading-tight">
                      Expert Cleaning Solutions
                    </h2>
                    <p className="text-xs md:text-base text-white/70 max-w-md mx-auto font-medium">
                      Professional home and office maintenance across Bangladesh.
                    </p>
                    <Button asChild className="h-10 md:h-12 px-8 rounded-2xl font-black text-xs md:text-base uppercase shadow-xl bg-primary hover:bg-primary/90">
                      <Link href="/services">View Our Services</Link>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Content Grids */}
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

          {/* BEST SELLING PRODUCTS */}
          <section>
            <SectionHeader icon={Zap} title="Best Selling Products" subtitle="Most Ordered" link="/products" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
              {bPLoading ? Array(5).fill(0).map((_, i) => <div key={i} className="aspect-[4/3] rounded-3xl bg-gray-200 animate-pulse" />) : 
                bestSellingProducts?.map((product) => <ProductCard key={product.id} product={product as any} />)
              }
            </div>
          </section>

          {/* POPULAR PRODUCTS */}
          <section>
            <SectionHeader icon={TrendingUp} title="Popular Products" subtitle="Customer Choice" link="/products" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
              {pPLoading ? Array(5).fill(0).map((_, i) => <div key={i} className="aspect-[4/3] rounded-3xl bg-gray-200 animate-pulse" />) : 
                popularProducts?.map((product) => <ProductCard key={product.id} product={product as any} />)
              }
            </div>
          </section>

          {/* RECENT SERVICES */}
          <section>
            <SectionHeader icon={Clock} title="New Services" subtitle="Recently Added" link="/services" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
              {rSLoading ? Array(5).fill(0).map((_, i) => <div key={i} className="aspect-[4/3] rounded-3xl bg-gray-200 animate-pulse" />) : 
                recentServices?.map((service) => (
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
            <SectionHeader icon={Clock} title="Recently Added Supplies" subtitle="New Arrivals" link="/products" />
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
