'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/components/providers/language-provider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PublicLayout } from '@/components/layout/public-layout';
import { useCollection, useFirestore, useMemoFirebase, useDoc, useUser } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { 
  ArrowRight, 
  Wrench, 
  ChevronRight, 
  Loader2, 
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Clock,
  Package,
  ShoppingCart,
  Zap,
  LayoutGrid,
  Flashlight,
  Timer
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
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Role Checks
  const adminRoleRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'roles_admins', user.uid);
  }, [db, user]);
  const { data: adminRole } = useDoc(adminRoleRef);
  const isAdmin = !!adminRole || user?.uid === 'gcp03WmpjROVvRdpLNsghNU4zHa2';

  /**
   * DATA FETCHING
   */
  const bannersRef = useMemoFirebase(() => db ? collection(db, 'hero_banners') : null, [db]);
  const topNavRef = useMemoFirebase(() => db ? collection(db, 'top_nav_categories') : null, [db]);
  const productsRef = useMemoFirebase(() => db ? collection(db, 'products') : null, [db]);
  const servicesRef = useMemoFirebase(() => db ? collection(db, 'services') : null, [db]);

  const { data: allBanners, isLoading: bannersLoading } = useCollection(bannersRef);
  const { data: allTopNav, isLoading: topNavLoading } = useCollection(topNavRef);
  const { data: allProducts, isLoading: productsLoading } = useCollection(productsRef);
  const { data: allServices, isLoading: servicesLoading } = useCollection(servicesRef);

  // In-Memory Processing: Banners
  const mainBanners = useMemo(() => {
    return allBanners
      ?.filter(b => b.isActive && (b.type === 'main' || !b.type))
      .sort((a, b) => (a.order || 0) - (b.order || 0)) || [];
  }, [allBanners]);

  const sideBanners = useMemo(() => {
    return allBanners
      ?.filter(b => b.isActive && b.type === 'side')
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .slice(0, 2) || [];
  }, [allBanners]);

  // In-Memory Processing: Products
  const featuredProducts = useMemo(() => {
    return allProducts
      ?.filter(p => p.status === 'Active')
      .sort((a, b) => (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0))
      .slice(0, 6) || [];
  }, [allProducts]);

  const latestProducts = useMemo(() => {
    return allProducts
      ?.filter(p => p.status === 'Active')
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      }) || [];
  }, [allProducts]);

  // In-Memory Processing: Services
  const activeServices = useMemo(() => {
    return allServices
      ?.filter(s => s.status === 'Active')
      .slice(0, 8) || [];
  }, [allServices]);

  if (!mounted) return null;

  return (
    <PublicLayout>
      <div className="flex flex-col bg-[#F9FAFB] min-h-screen">
        
        {/* HERO SECTION */}
        <section className="bg-white lg:bg-transparent lg:mt-4">
          <div className="container mx-auto px-0 lg:px-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              
              {/* Main Banner Slider */}
              <div className={cn("col-span-1", (sideBanners.length > 0) ? "lg:col-span-9" : "lg:col-span-12")}>
                <div className="relative aspect-[21/10] md:aspect-[982/400] w-full lg:rounded-xl overflow-hidden shadow-sm bg-gray-100">
                  {bannersLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>
                  ) : mainBanners.length > 0 ? (
                    <Carousel className="w-full h-full" opts={{ loop: true }}>
                      <CarouselContent className="h-full flex -ml-0">
                        {mainBanners.map((banner) => (
                          <CarouselItem key={banner.id} className="h-full min-w-0 shrink-0 grow-0 basis-full relative pl-0">
                            <Link href={banner.buttonLink || '#'} className="block w-full h-full relative">
                              {banner.imageUrl ? (
                                <Image src={banner.imageUrl} alt={banner.title} fill className="object-cover" priority unoptimized />
                              ) : (
                                <div className="w-full h-full bg-primary/5 flex items-center justify-center text-primary/40"><Sparkles size={60} /></div>
                              )}
                              {/* Content Overlay */}
                              <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent flex flex-col justify-center p-4 md:p-12">
                                <h2 className="text-white text-lg md:text-4xl font-black uppercase tracking-tight drop-shadow-lg mb-1">{banner.title}</h2>
                                <p className="text-white/90 text-[10px] md:text-lg font-medium drop-shadow-md mb-3 max-w-[200px] md:max-w-md line-clamp-2">{banner.subtitle}</p>
                                {banner.isButtonEnabled !== false && (
                                  <Button size="sm" className="w-fit h-7 md:h-10 rounded-full px-4 md:px-6 font-black uppercase text-[8px] md:text-xs" style={{ backgroundColor: banner.buttonColor }}>
                                    {banner.buttonText || 'Shop Now'}
                                  </Button>
                                )}
                              </div>
                            </Link>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                    </Carousel>
                  ) : null}
                </div>
              </div>

              {/* Side Banners - Desktop Only */}
              {sideBanners.length > 0 && (
                <div className="hidden lg:flex lg:col-span-3 flex-col gap-4">
                  {sideBanners.map((banner) => (
                    <Link key={banner.id} href={banner.buttonLink || '#'} className="flex-1 relative rounded-xl overflow-hidden shadow-sm group border bg-white">
                      {banner.imageUrl ? (
                        <Image src={banner.imageUrl} alt={banner.title} fill className="object-cover transition-transform group-hover:scale-105" unoptimized />
                      ) : (
                        <div className="w-full h-full bg-primary/5 flex items-center justify-center text-primary/20"><Sparkles size={32} /></div>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* CATEGORY GRID - Daraz Mobile Style */}
        <section className="container mx-auto px-3 md:px-4 py-4 md:py-6">
          <div className="bg-white rounded-xl shadow-sm p-3 md:p-6">
            <div className="grid grid-cols-4 md:grid-cols-8 gap-y-4 gap-x-2 md:gap-8">
              {allTopNav?.length ? allTopNav.sort((a,b) => (a.order||0)-(b.order||0)).map((cat) => (
                <Link 
                  key={cat.id} 
                  href={cat.link || `/services?category=${cat.name}`} 
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gray-50 flex items-center justify-center p-2.5 transition-all group-hover:bg-primary/10 group-hover:scale-110 border border-gray-100">
                    <LayoutGrid size={20} className="text-gray-400 group-hover:text-primary" />
                  </div>
                  <span className="text-[9px] md:text-xs font-bold text-center text-gray-600 group-hover:text-primary transition-colors line-clamp-1 truncate w-full px-0.5">
                    {cat.name}
                  </span>
                </Link>
              )) : Array(8).fill(0).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gray-50 animate-pulse" />
                  <div className="w-10 h-2 bg-gray-50 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FLASH SALE - Horizontal Scroll */}
        <section className="container mx-auto px-3 md:px-4 py-2">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-[#FEF3C7] border-b border-[#FDE68A] p-3 md:p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-[#F59E0B] p-1 rounded-md text-white"><Flashlight size={16} fill="currentColor" /></div>
                <h2 className="text-xs md:text-lg font-black uppercase tracking-tight text-[#92400E]">Flash Sale</h2>
                <div className="flex items-center gap-1.5 ml-2 md:ml-4">
                  <span className="text-[8px] md:text-[10px] font-bold text-[#92400E] uppercase hidden sm:block">On Sale Now:</span>
                  <div className="flex gap-1">
                    {['02', '14', '55'].map((t, i) => (
                      <span key={i} className="bg-[#92400E] text-white text-[9px] md:text-[10px] font-black px-1 py-0.5 rounded min-w-[18px] text-center">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <Button variant="link" className="text-[#92400E] font-black uppercase text-[9px] md:text-[10px] p-0 h-auto gap-0.5" asChild>
                <Link href="/products">Shop More <ChevronRight size={12} /></Link>
              </Button>
            </div>
            <div className="p-3 md:p-4 overflow-x-auto no-scrollbar">
              <div className="flex gap-3 md:gap-4 min-w-max pb-1">
                {featuredProducts.length > 0 ? featuredProducts.map((product) => (
                  <div key={product.id} className="w-[120px] md:w-[180px] shrink-0">
                    <ProductCard product={product} />
                  </div>
                )) : Array(5).fill(0).map((_, i) => (
                  <div key={i} className="w-[120px] md:w-[180px] h-[180px] bg-gray-50 animate-pulse rounded-xl" />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* JUST FOR YOU - Main Product Grid */}
        <section className="container mx-auto px-3 md:px-4 py-6 md:py-8">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className="text-sm md:text-2xl font-black uppercase tracking-tight text-gray-900 flex items-center gap-2">
              <Sparkles className="text-[#22C55E]" size={18} fill="currentColor" /> Just For You
            </h2>
          </div>
          
          {productsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-6">
              {Array(10).fill(0).map((_, i) => <div key={i} className="aspect-[3/4] bg-white rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-6">
              {latestProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {!latestProducts.length && !productsLoading && (
            <div className="py-16 text-center bg-white rounded-2xl border-2 border-dashed">
              <Package size={40} className="mx-auto text-gray-200 mb-3" />
              <p className="text-[10px] font-bold text-gray-400 uppercase">No products available</p>
            </div>
          )}
        </section>

        {/* SERVICES SECTION */}
        <section className="container mx-auto px-3 md:px-4 py-6 md:py-8 border-t border-gray-200 mt-4 bg-white md:bg-transparent md:mt-8">
          <div className="flex items-center justify-between mb-4 md:mb-6 px-1 md:px-0">
            <h2 className="text-sm md:text-2xl font-black uppercase tracking-tight text-gray-900 flex items-center gap-2">
              <Wrench className="text-primary" size={18} /> Essential Services
            </h2>
            <Button variant="outline" size="sm" className="rounded-full font-black text-[9px] md:text-[10px] uppercase h-7 md:h-8" asChild>
              <Link href="/services">See All</Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {activeServices.map((service) => (
              <Link key={service.id} href={`/service/${service.id}`} className="group relative aspect-[4/3] rounded-xl overflow-hidden shadow-sm bg-white border border-gray-100 block">
                {service.imageUrl ? (
                  <Image src={service.imageUrl} alt={service.title} fill className="object-cover transition-transform group-hover:scale-110" unoptimized />
                ) : (
                  <div className="w-full h-full bg-primary/5 flex items-center justify-center text-primary/40"><Wrench size={24} /></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2.5">
                  <h3 className="text-white font-black uppercase text-[9px] md:text-xs leading-tight line-clamp-1">{service.title}</h3>
                  <p className="text-primary font-black text-[10px] md:text-sm mt-0.5">৳{service.basePrice?.toLocaleString()}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

      </div>
    </PublicLayout>
  );
}
