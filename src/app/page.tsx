"use client";

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
  Laptop, Computer, CheckCircle2,
  BellRing
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SmartCleanHomePage() {
  const { language, t } = useLanguage();
  const { addToCart, setCheckoutOpen } = useCart();
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const MOCK_PRODUCTS = getMockProducts(language);
  const MOCK_SERVICES = getMockServices(language);

  const QUICK_CATEGORIES = [
    { name: language === 'bn' ? 'আবাসিক' : 'Residential', icon: Home },
    { name: language === 'bn' ? 'অফিস' : 'Office', icon: Building2 },
    { name: language === 'bn' ? 'ডিপ ক্লিন' : 'Deep Clean', icon: Brush },
    { name: language === 'bn' ? 'এসি সার্ভিস' : 'AC Service', icon: Wind },
    { name: language === 'bn' ? 'স্যানিটাইজেশন' : 'Sanitization', icon: Sparkles },
    { name: language === 'bn' ? 'কার্পেট' : 'Carpet', icon: Waves },
    { name: language === 'bn' ? 'উইন্ডো' : 'Window', icon: Box },
    { name: language === 'bn' ? 'কিচেন' : 'Kitchen', icon: Thermometer },
    { name: language === 'bn' ? 'বাথরুম' : 'Bathroom', icon: Box },
    { name: language === 'bn' ? 'ফোন সাপোর্ট' : 'Support', icon: Smartphone },
  ];

  const HERO_BANNERS = [
    PlaceHolderImages.find(img => img.id === 'hero-main'),
    PlaceHolderImages.find(img => img.id === 'hero-side-1'),
    PlaceHolderImages.find(img => img.id === 'hero-side-2'),
  ];

  const handleBookNowDirectly = (service: any) => {
    addToCart(service);
    setCheckoutOpen(true);
  };

  const currentDate = new Date().toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const marqueeText = `${currentDate} | ${t('hero_banner_title')} | ${t('hero_phone')} | ${t('footer_address')} | ${t('footer_hours')} | Professional Cleaning Nationwide.`;

  return (
    <PublicLayout>
      <div className="flex flex-col gap-4 pb-12 bg-[#F2F4F8]">
        {/* Mobile Search Bar */}
        <div className="lg:hidden container mx-auto px-4 pt-4">
          <div className="relative">
            <input 
              type="text" 
              placeholder={t('search_placeholder')}
              className="w-full bg-white border border-gray-200 rounded-full h-12 px-6 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
              <Layout size={20} />
            </div>
          </div>
        </div>

        {/* Hero Carousel Section */}
        <section className="container mx-auto px-4 pt-2">
          <div className="relative group">
            <Carousel setApi={setApi} className="w-full" opts={{ loop: true }}>
              <CarouselContent>
                {HERO_BANNERS.map((banner, index) => (
                  <CarouselItem key={index}>
                    <div className="relative aspect-[21/9] w-full overflow-hidden rounded-2xl shadow-lg bg-white border">
                      <Image 
                        src={banner?.imageUrl || ''} 
                        alt={banner?.description || 'Promo'} 
                        fill 
                        className="object-cover"
                        priority={index === 0}
                      />
                      {/* Promo Overlay (Optional/Static for now) */}
                      <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent flex flex-col justify-center p-8 md:p-16">
                         {index === 0 && (
                           <div className="max-w-md space-y-4">
                             <h2 className="text-2xl md:text-5xl font-black text-white drop-shadow-lg leading-tight font-headline">
                                {t('hero_question')}
                             </h2>
                             <Button 
                               className="bg-[#EF4A23] hover:bg-[#D43D1A] text-white rounded-full px-6 md:px-10 py-4 md:py-8 h-auto text-base md:text-2xl font-black shadow-2xl transition-transform hover:scale-105"
                               onClick={() => setCheckoutOpen(true)}
                             >
                                {t('hero_cta')}
                             </Button>
                           </div>
                         )}
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="hidden md:block">
                <CarouselPrevious className="left-4" />
                <CarouselNext className="right-4" />
              </div>
            </Carousel>

            {/* Carousel Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
               {HERO_BANNERS.map((_, i) => (
                 <div 
                   key={i} 
                   className={cn(
                     "h-2 w-2 md:h-3 md:w-3 rounded-full transition-all",
                     current === i ? "bg-primary w-6 md:w-8" : "bg-white/50"
                   )} 
                 />
               ))}
            </div>
          </div>
        </section>

        {/* Scrolling Marquee Bar */}
        <section className="container mx-auto px-4">
          <div className="bg-white rounded-full h-12 md:h-14 shadow-sm border border-gray-100 flex items-center overflow-hidden">
            <div className="h-full bg-[#F9FAFB] px-4 md:px-6 flex items-center gap-2 border-r z-10 shrink-0">
               <BellRing size={18} className="text-primary animate-bounce" />
               <span className="text-[10px] md:text-xs font-black uppercase text-[#081621] tracking-widest hidden sm:inline">Update</span>
            </div>
            <div className="flex-1 overflow-hidden relative h-full flex items-center">
               <p className="animate-marquee inline-block whitespace-nowrap text-xs md:text-sm font-medium text-gray-600 px-4">
                 {marqueeText}
               </p>
            </div>
          </div>
        </section>

        {/* Category Grid */}
        <section className="container mx-auto px-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="grid grid-cols-5 gap-y-6">
              {QUICK_CATEGORIES.map((cat, i) => (
                <div key={i} className="flex flex-col items-center gap-2 group cursor-pointer">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-[#F2F4F8] rounded-full flex items-center justify-center text-gray-600 group-hover:bg-primary group-hover:text-white transition-colors">
                    <cat.icon size={24} />
                  </div>
                  <span className="text-[10px] md:text-xs font-medium text-center text-gray-800">{cat.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Action Cards */}
        <section className="container mx-auto px-4 grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-r from-[#F38A18] to-[#EF4A23] rounded-xl p-4 flex flex-col items-center justify-center text-white gap-2 shadow-sm cursor-pointer hover:opacity-90 transition-opacity">
            <Computer size={32} />
            <span className="text-sm font-bold">{t('action_custom_quote')}</span>
          </div>
          <div className="bg-gradient-to-r from-[#0081C4] to-[#00529E] rounded-xl p-4 flex flex-col items-center justify-center text-white gap-2 shadow-sm cursor-pointer hover:opacity-90 transition-opacity">
            <Laptop size={32} />
            <span className="text-sm font-bold">{t('action_service_tracker')}</span>
          </div>
        </section>

        <div className="container mx-auto px-4 space-y-12">
          {/* Featured Products */}
          <section id="products">
            <div className="text-center mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-[#081621]">{t('products_title')}</h2>
              <p className="text-xs text-muted-foreground">{t('products_subtitle')}</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {MOCK_PRODUCTS.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>

          {/* Professional Services */}
          <section id="services">
            <div className="text-center mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-[#081621]">{t('services_title')}</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
              {MOCK_SERVICES.map((service) => (
                <Card key={service.id} className="border-none shadow-sm hover:shadow-md transition-all overflow-hidden bg-white flex flex-col h-full">
                  <Link href={`/service/${service.id}`} className="block relative aspect-video overflow-hidden shrink-0">
                    <Image src={service.imageUrl || ''} alt={service.title} fill className="object-cover" />
                  </Link>
                  <CardHeader className="p-3 md:p-4 pb-1">
                    <CardTitle className="text-sm md:text-lg font-bold line-clamp-1">{service.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 md:p-4 pt-0 flex-1">
                    <div className="flex flex-col">
                      <span className="text-[9px] md:text-[10px] text-muted-foreground font-semibold uppercase">{t('price_from')}</span>
                      <span className="text-primary font-bold text-base md:text-xl">৳{service.displayPrice}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="p-3 md:p-4 pt-0">
                    <Button 
                      onClick={() => handleBookNowDirectly(service)}
                      size="sm"
                      className="w-full gap-1 md:gap-2 font-bold bg-primary text-white text-[10px] md:text-sm h-8 md:h-10"
                    >
                      <CalendarCheck size={14} className="md:w-4 md:h-4" />
                      {t('book_now')}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </section>
        </div>
      </div>
    </PublicLayout>
  );
}