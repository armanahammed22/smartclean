'use client';

import React, { useMemo } from 'react';
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
  const db = useFirestore();

  // Role Checks
  const adminRef = useMemoFirebase(() => user ? doc(db, 'roles_admins', user.uid) : null, [db, user]);
  const { data: adminRole } = useDoc(adminRef);
  const isAdmin = !!adminRole || user?.uid === 'gcp03WmpjROVvRdpLNsghNU4zHa2';

  /**
   * DATA FETCHING:
   * Fetching full collections to handle filtering in-memory.
   * This is the most reliable method to avoid Firestore Index errors.
   */
  const bannersRef = useMemoFirebase(() => db ? collection(db, 'hero_banners') : null, [db]);
  const topNavRef = useMemoFirebase(() => db ? collection(db, 'top_nav_categories') : null, [db]);
  const productsRef = useMemoFirebase(() => db ? collection(db, 'products') : null, [db]);
  const servicesRef = useMemoFirebase(() => db ? collection(db, 'services') : null, [db]);

  const { data: allBanners, isLoading: bannersLoading } = useCollection(bannersRef);
  const { data: allTopNav, isLoading: topNavLoading } = useCollection(topNavRef);
  const { data: allProducts, isLoading: productsLoading } = useCollection(productsRef);
  const { data: allServices, isLoading: servicesLoading } = useCollection(servicesRef);

  // Debug Logging
  React.useEffect(() => {
    console.log('[Home] Banners loaded:', allBanners?.length || 0);
    console.log('[Home] Top Nav loaded:', allTopNav?.length || 0);
    console.log('[Home] Products loaded:', allProducts?.length || 0);
    console.log('[Home] Services loaded:', allServices?.length || 0);
  }, [allBanners, allTopNav, allProducts, allServices]);

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
      .slice(0, 5) || [];
  }, [allProducts]);

  const latestProducts = useMemo(() => {
    return allProducts
      ?.filter(p => p.status === 'Active')
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 5) || [];
  }, [allProducts]);

  // In-Memory Processing: Services
  const activeServices = useMemo(() => {
    return allServices
      ?.filter(s => s.status === 'Active')
      .slice(0, 5) || [];
  }, [allServices]);

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
      <div className="flex flex-col bg-[#F2F4F8] min-h-screen">
        
        {/* TOP NAV BAR: CATEGORIES */}
        <div className="bg-white border-b overflow-x-auto no-scrollbar py-2">
          <div className="container mx-auto px-4 flex items-center justify-start md:justify-center gap-6 whitespace-nowrap min-w-max">
            {allTopNav?.length ? allTopNav.sort((a,b) => (a.order||0)-(b.order||0)).map((cat) => (
              <Link 
                key={cat.id} 
                href={cat.link || `/services?category=${cat.name}`} 
                className="text-[11px] font-bold text-gray-700 hover:text-primary transition-colors px-1"
              >
                {cat.name}
              </Link>
            )) : !topNavLoading && (
              ["Desktop", "Laptop", "Component", "Monitor", "Power", "Phone", "Tablet", "Appliance"].map(cat => (
                <Link key={cat} href={`/services?category=${cat}`} className="text-[11px] font-bold text-gray-400 hover:text-primary transition-colors px-1">{cat}</Link>
              ))
            )}
            {topNavLoading && <Loader2 className="animate-spin text-primary/20 h-4 w-4" />}
          </div>
        </div>

        {isAdmin && (
          <section className="container mx-auto px-4 py-4">
            <div className="bg-[#081621] text-white p-4 rounded-2xl shadow-xl border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldCheck className="text-primary" size={20} />
                <span className="text-xs font-black uppercase tracking-widest">Admin Mode Active</span>
              </div>
              <Button size="sm" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 font-bold" asChild>
                <Link href="/admin/dashboard">Go to Dashboard <ArrowRight size={14} className="ml-1" /></Link>
              </Button>
            </div>
          </section>
        )}

        {/* HERO GRID: SLIDER + PROMOS */}
        <section className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            
            {/* Main Slider */}
            <div className={cn("col-span-1", sideBanners.length > 0 ? "lg:col-span-9" : "lg:col-span-12")}>
              <div className="relative aspect-[16/9] md:aspect-[982/500] w-full rounded-2xl md:rounded-[2.5rem] overflow-hidden shadow-xl border border-white/10 bg-white">
                {bannersLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={40} /></div>
                ) : mainBanners.length > 0 ? (
                  <Carousel className="w-full h-full" opts={{ loop: true }}>
                    <CarouselContent className="h-full">
                      {mainBanners.map((banner) => (
                        <CarouselItem key={banner.id} className="h-full relative">
                          <Link href={banner.buttonLink || '#'} className="block w-full h-full relative">
                            {banner.imageUrl ? (
                              <Image 
                                src={banner.imageUrl} 
                                alt={banner.title || 'Slide'} 
                                fill 
                                className="object-cover" 
                                priority
                              />
                            ) : (
                              <div className="w-full h-full bg-primary/5 flex items-center justify-center text-primary/40"><Sparkles size={80} /></div>
                            )}
                            <div 
                              className="absolute inset-0" 
                              style={{ 
                                backgroundColor: banner.overlayColor || '#000000',
                                opacity: (banner.overlayOpacity || 0) / 100 
                              }} 
                            />
                            <div className={cn(
                              "absolute inset-0 z-10 flex flex-col p-8 md:p-16",
                              banner.textPosition === 'top' ? 'justify-start' : 
                              banner.textPosition === 'bottom' ? 'justify-end' : 'justify-center',
                              banner.textAlignment === 'left' ? 'items-start text-left' :
                              banner.textAlignment === 'right' ? 'items-end text-right' : 'items-center text-center'
                            )}>
                              <div className="max-w-2xl space-y-4">
                                <h2 
                                  className={cn("font-black uppercase tracking-tighter leading-tight drop-shadow-xl", banner.titleSize || 'text-3xl md:text-6xl')}
                                  style={{ color: banner.titleColor || '#ffffff' }}
                                >
                                  {banner.title}
                                </h2>
                                <p className="text-white/90 text-sm md:text-xl font-medium drop-shadow-md">
                                  {banner.subtitle}
                                </p>
                                {banner.isButtonEnabled !== false && banner.buttonText && (
                                  <Button className="mt-4 rounded-xl font-black uppercase text-xs px-8 h-12 shadow-xl" style={{ backgroundColor: banner.buttonColor }}>
                                    {banner.buttonText}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </Link>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                  </Carousel>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-center p-8">
                    <Sparkles size={48} className="text-primary/20 mb-4" />
                    <p className="font-bold text-gray-400 uppercase tracking-widest text-xs">No Main Banners Active</p>
                    <p className="text-[10px] text-gray-300 mt-2">Manage sliders in Admin &gt; Site Customize &gt; Hero Banners</p>
                  </div>
                )}
              </div>
            </div>

            {/* Side Banners (Desktop Only) */}
            {sideBanners.length > 0 && (
              <div className="hidden lg:flex lg:col-span-3 flex-col gap-4">
                {sideBanners.map((banner) => (
                  <Link key={banner.id} href={banner.buttonLink || '#'} className="flex-1 relative rounded-[1.5rem] overflow-hidden shadow-lg group border border-gray-100">
                    <Image src={banner.imageUrl} alt={banner.title} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CATALOG SECTIONS */}
        <div className="container mx-auto px-4 py-12 space-y-24 pb-32">
          
          {/* PROFESSIONAL SERVICES */}
          <section>
            <SectionHeader icon={Wrench} title="Expert Services" subtitle="Professional Care" link="/services" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
              {servicesLoading ? Array(5).fill(0).map((_, i) => <div key={i} className="aspect-[4/3] rounded-3xl bg-gray-100 animate-pulse" />) : 
                activeServices.length > 0 ? activeServices.map((service) => (
                  <div key={service.id} className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100 flex flex-col">
                    <Link href={`/service/${service.id}`} className="block relative aspect-[4/3] overflow-hidden shrink-0">
                      {service.imageUrl ? (
                        <Image src={service.imageUrl} alt={service.title} fill className="object-cover transition-transform group-hover:scale-105" />
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
                )) : (
                  <div className="col-span-full py-16 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100">
                    <Wrench size={48} className="mx-auto text-gray-200 mb-4" />
                    <p className="font-bold text-gray-400 uppercase tracking-widest text-xs">No Services Published</p>
                  </div>
                )
              }
            </div>
          </section>

          {/* FEATURED PRODUCTS */}
          <section>
            <SectionHeader icon={TrendingUp} title="Best Sellers" subtitle="Popular Supplies" link="/products" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
              {productsLoading ? Array(5).fill(0).map((_, i) => <div key={i} className="aspect-[4/3] rounded-3xl bg-gray-100 animate-pulse" />) : 
                featuredProducts.length > 0 ? featuredProducts.map((product) => (
                  <ProductCard key={product.id} product={product as any} />
                )) : (
                  <div className="col-span-full py-16 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100">
                    <Package size={48} className="mx-auto text-gray-200 mb-4" />
                    <p className="font-bold text-gray-400 uppercase tracking-widest text-xs">Inventory Empty</p>
                  </div>
                )
              }
            </div>
          </section>

          {/* LATEST ARRIVALS */}
          <section>
            <SectionHeader icon={Clock} title="New Arrivals" subtitle="Fresh Catalog" link="/products" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
              {productsLoading ? Array(5).fill(0).map((_, i) => <div key={i} className="aspect-[4/3] rounded-3xl bg-gray-100 animate-pulse" />) : 
                latestProducts.length > 0 ? latestProducts.map((product) => (
                  <ProductCard key={product.id} product={product as any} />
                )) : (
                  <div className="col-span-full py-16 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100">
                    <Package size={48} className="mx-auto text-gray-200 mb-4" />
                    <p className="font-bold text-gray-400 uppercase tracking-widest text-xs">No Products Found</p>
                  </div>
                )
              }
            </div>
          </section>

        </div>
      </div>
    </PublicLayout>
  );
}
