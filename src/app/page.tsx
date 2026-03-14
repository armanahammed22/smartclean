
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ProductCard } from '@/components/products/product-card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useLanguage } from '@/components/providers/language-provider';
import { getMockProducts, getMockServices } from '@/lib/data';
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
  Layout, Home, Building2, 
  Brush, Sparkles, Wind, CalendarCheck, 
  Waves, Thermometer, Box, Smartphone, 
  Laptop, Computer, BellRing, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';

export default function SmartCleanHomePage() {
  const { language, t } = useLanguage();
  const { addToCart, setCheckoutOpen } = useCart();
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [currentDate, setCurrentDate] = useState<string>('');
  const db = useFirestore();

  // Real-time Customization Fetching
  const customizationRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'homepage') : null, [db]);
  const { data: customization } = useDoc(customizationRef);

  const prodCatsQuery = useMemoFirebase(() => db ? query(collection(db, 'product_categories'), orderBy('name', 'asc')) : null, [db]);
  const servCatsQuery = useMemoFirebase(() => db ? query(collection(db, 'service_categories'), orderBy('name', 'asc')) : null, [db]);
  const productsQuery = useMemoFirebase(() => db ? query(collection(db, 'products'), orderBy('name', 'asc')) : null, [db]);
  const servicesQuery = useMemoFirebase(() => db ? query(collection(db, 'services'), orderBy('title', 'asc')) : null, [db]);

  const { data: prodCats } = useCollection(prodCatsQuery);
  const { data: servCats } = useCollection(servCatsQuery);
  const { data: products } = useCollection(productsQuery);
  const { data: services } = useCollection(servicesQuery);

  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  useEffect(() => {
    const dateStr = new Date().toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    setCurrentDate(dateStr);
  }, [language]);

  const HERO_BANNERS = [
    { imageUrl: customization?.hero?.imageUrl || PlaceHolderImages.find(img => img.id === 'hero-main')?.imageUrl || '', title: customization?.hero?.title, subtitle: customization?.hero?.subtitle },
    { imageUrl: PlaceHolderImages.find(img => img.id === 'hero-side-1')?.imageUrl || '' },
    { imageUrl: PlaceHolderImages.find(img => img.id === 'hero-side-2')?.imageUrl || '' },
  ];

  const handleBookNowDirectly = (service: any) => {
    addToCart(service);
    setCheckoutOpen(true);
  };

  const marqueeText = `${currentDate ? currentDate + ' | ' : ''}${t('hero_banner_title')} | ${t('hero_phone')} | ${t('footer_address')} | ${t('footer_hours')} | Professional Cleaning Nationwide.`;

  return (
    <PublicLayout>
      <div className="flex flex-col gap-4 pb-12 bg-[#F2F4F8]">
        {/* Hero Carousel Section */}
        {(!customization || customization.hero?.enabled !== false) && (
          <section className="container mx-auto px-4 pt-4">
            <div className="relative group">
              <Carousel setApi={setApi} className="w-full" opts={{ loop: true }}>
                <CarouselContent>
                  {HERO_BANNERS.map((banner, index) => (
                    <CarouselItem key={index}>
                      <div className="relative aspect-[21/9] w-full overflow-hidden rounded-2xl shadow-lg bg-white border">
                        <Image src={banner.imageUrl} alt="Promo" fill className="object-cover" priority={index === 0} />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent flex flex-col justify-center p-8 md:p-16">
                           {index === 0 && (
                             <div className="max-w-md space-y-4">
                               <h2 className="text-2xl md:text-5xl font-black text-white drop-shadow-lg leading-tight font-headline">
                                 {banner.title || t('hero_question')}
                               </h2>
                               <p className="text-white font-medium drop-shadow-md text-sm md:text-lg">
                                 {banner.subtitle || ''}
                               </p>
                               <Button className="bg-[#EF4A23] hover:bg-[#D43D1A] text-white rounded-full px-6 md:px-10 py-4 md:py-8 h-auto text-base md:text-2xl font-black shadow-2xl transition-transform hover:scale-105" onClick={() => setCheckoutOpen(true)}>
                                 {customization?.hero?.ctaText || t('hero_cta')}
                               </Button>
                             </div>
                           )}
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            </div>
          </section>
        )}

        {/* Marquee */}
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

        <div className="container mx-auto px-4 space-y-16 mt-8">
          {/* Grouped Services */}
          {(customization?.sections?.popularServices !== false) && (
            <section id="services">
              <div className="mb-10 text-center">
                <h2 className="text-3xl font-black text-[#081621] font-headline uppercase tracking-tighter">{t('services_title')}</h2>
                <div className="h-1 w-20 bg-primary mx-auto mt-2 rounded-full" />
              </div>
              
              <div className="space-y-12">
                {servCats?.map(cat => {
                  const filteredServices = services?.filter(s => s.categoryId === cat.id);
                  if (!filteredServices?.length) return null;

                  return (
                    <div key={cat.id} className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary rounded-lg text-white"><Layout size={20} /></div>
                        <h3 className="text-xl font-bold text-gray-900 uppercase tracking-tight">{cat.name}</h3>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        {filteredServices.map((service) => (
                          <Card key={service.id} className="border-none shadow-sm hover:shadow-md transition-all overflow-hidden bg-white flex flex-col h-full group">
                            <Link href={`/service/${service.id}`} className="block relative aspect-video overflow-hidden shrink-0">
                              <Image src={service.imageUrl || ''} alt={service.title} fill className="object-cover group-hover:scale-105 transition-transform" />
                            </Link>
                            <CardHeader className="p-4 pb-1">
                              <CardTitle className="text-sm md:text-base font-bold line-clamp-1">{service.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-0 flex-1">
                              <div className="flex flex-col">
                                <span className="text-[9px] text-muted-foreground font-semibold uppercase">{t('price_from')}</span>
                                <span className="text-primary font-black text-lg">৳{service.basePrice.toLocaleString()}</span>
                              </div>
                            </CardContent>
                            <CardFooter className="p-4 pt-0">
                              <Button onClick={() => handleBookNowDirectly(service)} size="sm" className="w-full gap-2 font-bold bg-primary text-white h-10">{t('book_now')}</Button>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Grouped Products */}
          {(customization?.sections?.popularProducts !== false) && (
            <section id="products">
              <div className="mb-10 text-center">
                <h2 className="text-3xl font-black text-[#081621] font-headline uppercase tracking-tighter">{t('products_title')}</h2>
                <div className="h-1 w-20 bg-primary mx-auto mt-2 rounded-full" />
              </div>

              <div className="space-y-12">
                {prodCats?.filter(c => !c.parentId).map(cat => {
                  const filteredProducts = products?.filter(p => p.categoryId === cat.id);
                  if (!filteredProducts?.length) return null;

                  return (
                    <div key={cat.id} className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#081621] rounded-lg text-white"><Box size={20} /></div>
                        <h3 className="text-xl font-bold text-gray-900 uppercase tracking-tight">{cat.name}</h3>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {filteredProducts.map((product) => (
                          <ProductCard key={product.id} product={product} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
