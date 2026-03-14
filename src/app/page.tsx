
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ProductCard } from '@/components/products/product-card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useLanguage } from '@/components/providers/language-provider';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCart } from '@/components/providers/cart-provider';
import { PublicLayout } from '@/components/layout/public-layout';
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext,
  CarouselPrevious,
  type CarouselApi
} from '@/components/ui/carousel';
import { 
  Layout, 
  Box, 
  BellRing, 
  Star,
  Zap,
  TicketPercent,
  Megaphone,
  ChevronRight,
  TrendingUp,
  Clock,
  ArrowRight,
  Tags
} from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, doc, limit, where } from 'firebase/firestore';
import { cn } from '@/lib/utils';

// Helper component for the Flash Sale timer
const CountdownTimer = () => {
  const [timeLeft, setTimeTime] = useState({ hours: 12, minutes: 0, seconds: 0 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeTime(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex gap-2">
      {[timeLeft.hours, timeLeft.minutes, timeLeft.seconds].map((val, i) => (
        <div key={i} className="bg-red-600 text-white px-3 py-2 rounded-lg font-black text-xl min-w-[45px] text-center">
          {val.toString().padStart(2, '0')}
        </div>
      ))}
    </div>
  );
};

export default function SmartCleanHomePage() {
  const { language, t } = useLanguage();
  const { addToCart, setCheckoutOpen } = useCart();
  const [currentDate, setCurrentDate] = useState<string>('');
  const db = useFirestore();

  // Settings & Customization
  const customizationRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'homepage') : null, [db]);
  const { data: customization } = useDoc(customizationRef);

  // Firestore Collections
  const productsQuery = useMemoFirebase(() => db ? query(collection(db, 'products'), orderBy('name', 'asc')) : null, [db]);
  const servicesQuery = useMemoFirebase(() => db ? query(collection(db, 'services'), orderBy('title', 'asc')) : null, [db]);
  const prodCatsQuery = useMemoFirebase(() => db ? query(collection(db, 'product_categories'), orderBy('name', 'asc')) : null, [db]);

  const { data: products } = useCollection(productsQuery);
  const { data: services } = useCollection(servicesQuery);
  const { data: productCategories } = useCollection(prodCatsQuery);

  useEffect(() => {
    const dateStr = new Date().toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    setCurrentDate(dateStr);
  }, [language]);

  const handleBookNowDirectly = (service: any) => {
    addToCart(service);
    setCheckoutOpen(true);
  };

  // Logic Helpers
  const activeProducts = products?.filter(p => p.status !== 'Inactive') || [];
  const activeServices = services?.filter(s => s.status !== 'Inactive') || [];
  const featuredProducts = activeProducts.filter(p => customization?.featuredProductIds?.includes(p.id));
  const trendingProducts = activeProducts.slice(0, 8); // In real app, order by 'views'
  const popularProducts = activeProducts.slice(2, 10);
  const flashSaleProducts = activeProducts.filter(p => p.onSale).length > 0 ? activeProducts.filter(p => p.onSale) : activeProducts.slice(0, 4);

  const marqueeText = `${currentDate ? currentDate + ' | ' : ''}${t('hero_banner_title')} | ${t('hero_phone')} | ${t('footer_address')} | Professional Cleaning Nationwide.`;

  return (
    <PublicLayout>
      <div className="flex flex-col gap-4 pb-12 bg-[#F2F4F8]">
        
        {/* 1. Hero Section */}
        {customization?.hero?.enabled !== false && (
          <section className="container mx-auto px-4 pt-4">
            <div className="relative overflow-hidden rounded-2xl shadow-lg bg-white border aspect-[21/9] w-full">
              <Image 
                src={customization?.hero?.imageUrl || PlaceHolderImages.find(img => img.id === 'hero-main')?.imageUrl || ''} 
                alt="Promo" 
                fill 
                className="object-cover" 
                priority 
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent flex flex-col justify-center p-8 md:p-16">
                <div className="max-w-md space-y-4">
                  <h2 className="text-2xl md:text-5xl font-black text-white drop-shadow-lg leading-tight font-headline">
                    {customization?.hero?.title || t('hero_question')}
                  </h2>
                  <p className="text-white font-medium drop-shadow-md text-sm md:text-lg">
                    {customization?.hero?.subtitle || ''}
                  </p>
                  <Button 
                    className="bg-[#EF4A23] hover:bg-[#D43D1A] text-white rounded-full px-6 md:px-10 py-4 md:py-8 h-auto text-base md:text-2xl font-black shadow-2xl transition-transform hover:scale-105" 
                    asChild
                  >
                    <Link href={customization?.hero?.ctaLink || "/#services"}>
                      {customization?.hero?.ctaText || t('hero_cta')}
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Marquee Updates */}
        <section className="container mx-auto px-4">
          <div className="bg-white rounded-full h-12 md:h-14 shadow-sm border border-gray-100 flex items-center overflow-hidden">
            <div className="h-full bg-[#F9FAFB] px-4 md:px-6 flex items-center gap-2 border-r z-10 shrink-0">
               <BellRing size={18} className="text-primary animate-bounce" />
               <span className="text-[10px] md:text-xs font-black uppercase text-[#081621] tracking-widest hidden sm:inline">Update</span>
            </div>
            <div className="flex-1 overflow-hidden relative h-full flex items-center">
               <p className="animate-marquee inline-block whitespace-nowrap text-xs md:text-sm font-medium text-gray-600 px-4">{marqueeText}</p>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 space-y-12 md:space-y-20 mt-8">
          
          {/* 2. Category Slider */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border overflow-hidden">
            <div className="flex items-center gap-2 mb-6">
              <Tags className="text-primary" size={20} />
              <h2 className="font-black uppercase tracking-tight text-sm md:text-base">Browse by Category</h2>
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
              {productCategories?.map(cat => (
                <Link key={cat.id} href={`/category/${cat.slug}`} className="flex flex-col items-center gap-3 shrink-0 group">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center transition-all group-hover:bg-primary/10 group-hover:border-primary/30 group-hover:scale-110 group-active:scale-95 shadow-sm">
                    <Box size={24} className="text-gray-400 group-hover:text-primary" />
                  </div>
                  <span className="text-[10px] md:text-xs font-bold text-center group-hover:text-primary truncate w-20">{cat.name}</span>
                </Link>
              ))}
            </div>
          </section>

          {/* 3. Trending Products Slider */}
          {customization?.sections?.trendingProducts !== false && activeProducts.length > 0 && (
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary rounded-lg text-white"><TrendingUp size={20} /></div>
                  <h2 className="text-xl md:text-2xl font-black text-[#081621] uppercase tracking-tight">Trending Now</h2>
                </div>
                <Button variant="ghost" className="text-xs font-bold text-primary gap-1">View All <ChevronRight size={14} /></Button>
              </div>
              <Carousel opts={{ align: "start", loop: true }} className="w-full">
                <CarouselContent className="-ml-4">
                  {trendingProducts.map((product) => (
                    <CarouselItem key={product.id} className="pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4">
                      <ProductCard product={product} />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <div className="hidden md:block">
                  <CarouselPrevious className="-left-4 bg-white shadow-xl" />
                  <CarouselNext className="-right-4 bg-white shadow-xl" />
                </div>
              </Carousel>
            </section>
          )}

          {/* 4. Popular Products */}
          {customization?.sections?.popularProducts !== false && popularProducts.length > 0 && (
            <section className="space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#081621] rounded-lg text-white"><Star size={20} /></div>
                  <h2 className="text-xl md:text-2xl font-black text-[#081621] uppercase tracking-tight">Popular Products</h2>
                </div>
                <div className="h-px flex-1 bg-gray-200 mx-6 rounded-full hidden md:block" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {popularProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          )}

          {/* 5. Featured Products (Manual) */}
          {customization?.sections?.featuredProducts !== false && featuredProducts.length > 0 && (
            <section className="bg-primary/5 p-8 rounded-3xl border border-primary/10">
              <div className="mb-10 text-center">
                <Badge className="bg-primary text-white mb-2">Editor's Choice</Badge>
                <h2 className="text-3xl font-black text-[#081621] uppercase tracking-tighter">Featured Equipment</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {featuredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          )}

          {/* 6. Flash Sale */}
          {customization?.sections?.flashSale !== false && flashSaleProducts.length > 0 && (
            <section className="bg-[#081621] p-6 md:p-10 rounded-3xl shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
                <Zap size={200} className="text-white" />
              </div>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 relative z-10">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Zap className="text-yellow-400 fill-yellow-400" size={32} />
                    <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter">Flash Sale</h2>
                  </div>
                  <p className="text-white/60 font-medium">Hurry! Offers end soon.</p>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-white/40 text-[10px] font-black uppercase tracking-widest text-center md:text-left">Ending In</span>
                  <CountdownTimer />
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 relative z-10">
                {flashSaleProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          )}

          {/* 7. Services Section */}
          <section className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary rounded-lg text-white"><TicketPercent size={20} /></div>
                <h2 className="text-xl md:text-2xl font-black text-[#081621] uppercase tracking-tight">{t('services_title')}</h2>
              </div>
              <Button asChild variant="outline" className="rounded-full font-bold border-primary text-primary hover:bg-primary/5">
                <Link href="/services">Browse All Services</Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {(activeServices.length > 0 ? activeServices.slice(0, 4) : []).map((service) => (
                <Card key={service.id} className="border-none shadow-sm hover:shadow-md transition-all overflow-hidden bg-white flex flex-col h-full group">
                  <Link href={`/service/${service.id}`} className="block relative aspect-video overflow-hidden shrink-0">
                    <Image src={service.imageUrl || ''} alt={service.title} fill className="object-cover group-hover:scale-105 transition-transform" />
                  </Link>
                  <CardHeader className="p-4 pb-1">
                    <CardTitle className="text-xs md:text-sm font-bold line-clamp-1">{service.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 flex-1">
                    <div className="flex flex-col">
                      <span className="text-[8px] text-muted-foreground font-semibold uppercase">{t('price_from')}</span>
                      <span className="text-primary font-black text-sm md:text-base">৳{service.basePrice.toLocaleString()}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    <Button onClick={() => handleBookNowDirectly(service)} size="sm" className="w-full gap-2 font-bold bg-primary text-white h-9 text-[10px] md:text-xs">{t('book_now')}</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </section>

          {/* 8. Offer Banners */}
          {customization?.sections?.offerBanners && customization.offerBanners?.length > 0 && (
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {customization.offerBanners?.filter((b: any) => b.enabled).map((banner: any, i: number) => (
                <Link key={i} href={banner.link || '#'} className="block relative aspect-[16/7] rounded-2xl overflow-hidden group shadow-sm hover:shadow-md transition-all">
                  <Image src={banner.imageUrl} alt="Promo" fill className="object-cover group-hover:scale-105 transition-transform" />
                </Link>
              ))}
            </section>
          )}

          {/* 9. Campaign Section */}
          {customization?.sections?.campaigns && customization.campaigns?.length > 0 && (
            <section className="space-y-8">
              {customization.campaigns?.filter((c: any) => c.enabled).map((camp: any, i: number) => (
                <div key={i} className="relative aspect-[21/7] w-full rounded-3xl overflow-hidden shadow-lg group">
                  <Image src={camp.imageUrl} alt={camp.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8 md:p-16">
                    <div className="max-w-xl space-y-4">
                      <div className="flex items-center gap-2 text-primary">
                        <Zap size={20} fill="currentColor" />
                        <span className="text-xs font-black uppercase tracking-widest text-white">Active Campaign</span>
                      </div>
                      <h2 className="text-2xl md:text-4xl font-black text-white">{camp.title}</h2>
                      <p className="text-white/80 text-sm md:text-lg line-clamp-2">{camp.description}</p>
                      <Button className="w-fit bg-primary hover:bg-primary/90 font-bold px-8 h-12 shadow-xl shadow-primary/20">Learn More <ArrowRight size={18} className="ml-2" /></Button>
                    </div>
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* Category-Based Product Sections */}
          {productCategories?.map(cat => {
            const catProducts = activeProducts.filter(p => p.categoryId === cat.id || p.category === cat.name).slice(0, 4);
            if (catProducts.length === 0) return null;
            return (
              <section key={cat.id} className="space-y-8">
                <div className="flex items-center justify-between border-b pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border shadow-sm text-primary">
                      <ChevronRight size={20} />
                    </div>
                    <h2 className="text-xl md:text-2xl font-black text-[#081621] uppercase tracking-tight">{cat.name}</h2>
                  </div>
                  <Button asChild variant="link" className="text-primary font-bold">
                    <Link href={`/category/${cat.slug}`}>View All ({activeProducts.filter(p => p.categoryId === cat.id || p.category === cat.name).length})</Link>
                  </Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                  {catProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </section>
            );
          })}

          {/* Footer Custom Content */}
          {customization?.sections?.customContent && customization.marketingContent && (
            <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <Megaphone className="text-primary" size={24} />
                <h2 className="text-xl font-black uppercase tracking-tight">Special Announcements</h2>
              </div>
              <div className="prose prose-sm max-w-none text-gray-600">
                {customization.marketingContent}
              </div>
            </section>
          )}

        </div>
      </div>
    </PublicLayout>
  );
}
