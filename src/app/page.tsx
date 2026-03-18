
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/components/providers/language-provider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PublicLayout } from '@/components/layout/public-layout';
import { useCollection, useFirestore, useMemoFirebase, useDoc, useUser } from '@/firebase';
import { collection, query, doc, limit } from 'firebase/firestore';
import { 
  ArrowRight, 
  Wrench, 
  ChevronRight, 
  Loader2, 
  LayoutDashboard, 
  ShieldCheck,
  Sparkles
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

  // Data Fetching
  const bannersQuery = useMemoFirebase(() => db ? query(collection(db, 'hero_banners')) : null, [db]);
  const { data: banners, isLoading: bannersLoading } = useCollection(bannersQuery);

  const activeBanners = React.useMemo(() => {
    if (!banners) return [];
    return banners
      .filter(b => b.isActive === true)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [banners]);

  const productsQuery = useMemoFirebase(() => db ? query(collection(db, 'products'), limit(10)) : null, [db]);
  const servicesQuery = useMemoFirebase(() => db ? query(collection(db, 'services'), limit(15)) : null, [db]);

  const { data: products, isLoading: productsLoading } = useCollection(productsQuery);
  const { data: services, isLoading: servicesLoading } = useCollection(servicesQuery);

  const handleDirectServiceCheckout = (service: any) => {
    addToCart(service);
    setCheckoutOpen(true);
  };

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

        {/* Unified Dynamic Hero Carousel - Updated to 982x500 Aspect Ratio and Width */}
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
                        {/* Slide Background */}
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
                          {/* Dynamic Color Overlay */}
                          <div 
                            className="absolute inset-0 transition-opacity duration-500" 
                            style={{ 
                              backgroundColor: banner.overlayColor || '#000000',
                              opacity: (banner.overlayOpacity || 40) / 100 
                            }} 
                          />
                        </div>

                        {/* Slide Content Layer */}
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
                /* Static Fallback Banner */
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
        <div className="container mx-auto px-4 mt-8 space-y-16 pb-24">
          {/* Services Section */}
          <section>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-primary/10 pb-3">
              <div className="space-y-1">
                <Badge className="bg-primary/10 text-primary border-none uppercase tracking-[0.2em] font-black py-1 px-4 rounded-full text-[9px]">Expert Solutions</Badge>
                <h2 className="text-2xl md:text-4xl font-black font-headline text-[#081621] uppercase tracking-tighter">{t('expert_services')}</h2>
              </div>
              <Button variant="outline" className="gap-2 font-black uppercase text-[10px] tracking-widest border-primary/20 text-primary rounded-full h-10 px-6" asChild>
                <Link href="/services">{t('view_all')} <ChevronRight size={14} /></Link>
              </Button>
            </div>
            
            <div className="mt-8">
              {servicesLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" size={40} /></div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
                  {services?.map((service) => (
                    <div key={service.id} className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100 flex flex-col h-full">
                      <Link href={`/service/${service.id}`} className="block relative aspect-[4/3] overflow-hidden shrink-0">
                        {service.imageUrl ? (
                          <Image src={service.imageUrl} alt={service.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                        ) : (
                          <div className="w-full h-full bg-primary/5 flex items-center justify-center text-primary/40"><Wrench size={40} /></div>
                        )}
                      </Link>
                      <div className="p-4 flex flex-col flex-1 gap-3">
                        <h3 className="text-sm font-black uppercase tracking-tight line-clamp-1">{service.title}</h3>
                        <div className="flex items-center justify-between mt-auto">
                          <span className="text-lg font-black text-primary">৳{service.basePrice?.toLocaleString()}</span>
                          <Button size="sm" variant="secondary" className="rounded-full h-8 px-4 text-[10px] font-black uppercase" onClick={() => handleDirectServiceCheckout(service)}>
                            Book
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Products Section */}
          <section>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-primary/10 pb-3">
              <div className="space-y-1">
                <Badge className="bg-slate-100 text-slate-600 border-none uppercase tracking-[0.2em] font-black py-1 px-4 rounded-full text-[9px]">Supply Store</Badge>
                <h2 className="text-2xl md:text-4xl font-black font-headline text-[#081621] uppercase tracking-tighter">{t('professional_tools')}</h2>
              </div>
              <Button variant="link" className="gap-2 font-black uppercase text-[10px] tracking-widest text-primary p-0 h-auto" asChild>
                <Link href="/products">{t('view_all')} <ChevronRight size={14} /></Link>
              </Button>
            </div>
            <div className="mt-8">
              {productsLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" size={40} /></div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
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
