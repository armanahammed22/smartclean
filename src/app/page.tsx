"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ProductCard } from '@/components/products/product-card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useLanguage } from '@/components/providers/language-provider';
import { getMockProducts, getMockServices } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCart } from '@/components/providers/cart-provider';
import { 
  Layout, Wrench, Activity, Home, Building2, 
  Brush, Sparkles, Wind, CalendarCheck, ShoppingCart,
  ShieldCheck, Truck, Headphones, Smartphone, Monitor,
  Waves, Thermometer, Box, Laptop, Computer
} from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export default function SmartCleanHomePage() {
  const { language, t } = useLanguage();
  const { addToCart, setCheckoutOpen } = useCart();

  const MOCK_PRODUCTS = getMockProducts(language);
  const MOCK_SERVICES = getMockServices(language);

  const QUICK_CATEGORIES = [
    { name: language === 'bn' ? 'আবাসিক' : 'Residential', icon: Home },
    { name: language === 'bn' ? 'অফিস' : 'Office', icon: Building2 },
    { name: language === 'bn' ? 'ডিপ ক্লিন' : 'Deep Clean', icon: Brush },
    { name: language === 'bn' ? 'এসি সার্ভিস' : 'AC Service', icon: Wind },
    { name: language === 'bn' ? 'স্যানিটাইজেশন' : 'Sanitization', icon: Sparkles },
    { name: language === 'bn' ? 'কার্পেট' : 'Carpet', icon: Waves },
    { name: language === 'bn' ? 'উইন্ডো' : 'Window', icon: Monitor },
    { name: language === 'bn' ? 'কিচেন' : 'Kitchen', icon: Thermometer },
    { name: language === 'bn' ? 'বাথরুম' : 'Bathroom', icon: Box },
    { name: language === 'bn' ? 'ফোন সাপোর্ট' : 'Support', icon: Smartphone },
  ];

  const IconMap: Record<string, React.ReactNode> = {
    Layout: <Layout className="text-primary" size={32} />,
    Wrench: <Wrench className="text-primary" size={32} />,
    Activity: <Activity className="text-primary" size={32} />,
  };

  const HERO_IMAGES = [
    PlaceHolderImages.find(img => img.id === 'hero-main'),
    PlaceHolderImages.find(img => img.id === 'hero-side-1'),
    PlaceHolderImages.find(img => img.id === 'hero-side-2'),
  ];

  const MOBILE_ONLY_BANNER = PlaceHolderImages.find(img => img.id === 'hero-side-1');

  const handleBookNowDirectly = (service: any) => {
    addToCart(service);
    setCheckoutOpen(true);
  };

  return (
    <div className="flex flex-col gap-6 pb-24 bg-[#F2F4F8]">
      {/* Mobile Search Bar (Star Tech Style) */}
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

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-2">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-auto lg:h-[450px]">
          <div className="lg:col-span-8 relative rounded-xl overflow-hidden shadow-sm h-[200px] lg:h-full">
            <Carousel className="w-full h-full" opts={{ loop: true }}>
              <CarouselContent className="h-full">
                {HERO_IMAGES.map((img, index) => (
                  <CarouselItem key={index} className="h-full pl-0">
                    <div className="relative h-full w-full group">
                      <Image
                        src={img?.imageUrl || ''}
                        alt={img?.description || 'Hero main'}
                        fill
                        className="object-cover"
                        priority={index === 0}
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent flex items-center px-8">
                        <div className="max-w-xs text-white space-y-2">
                          <h1 className="text-xl md:text-4xl font-bold leading-tight">{t('hero_title')}</h1>
                          <Button size="sm" className="rounded-full px-6 bg-[#EF4A23] hover:bg-[#D43D1A] text-white border-none font-bold">{t('hero_cta')}</Button>
                        </div>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>

          <div className="lg:col-span-4 hidden lg:flex flex-col gap-4 h-full">
            <div className="relative flex-1 rounded-xl overflow-hidden shadow-sm group">
              <Image src={PlaceHolderImages.find(img => img.id === 'hero-side-1')?.imageUrl || ''} alt="Promo 1" fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
            </div>
            <div className="relative flex-1 rounded-xl overflow-hidden shadow-sm group">
              <Image src={PlaceHolderImages.find(img => img.id === 'hero-side-2')?.imageUrl || ''} alt="Promo 2" fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
            </div>
          </div>
        </div>
      </section>

      {/* Category Grid (Star Tech Circular Style) */}
      <section className="container mx-auto px-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm">
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
          <div className="mt-6 flex justify-center">
            <Button variant="ghost" size="sm" className="text-primary font-bold gap-1">
              Show more
              <Layout size={14} className="rotate-90" />
            </Button>
          </div>
        </div>
      </section>

      {/* Mobile Special Banner */}
      <section className="lg:hidden container mx-auto px-4">
        <div className="relative aspect-[21/9] rounded-xl overflow-hidden shadow-sm border-4 border-[#EF4A23]">
          <Image 
            src={MOBILE_ONLY_BANNER?.imageUrl || ''} 
            alt="Offer Banner" 
            fill 
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[#EF4A23]/10 flex flex-col items-center justify-center text-white text-center p-2">
            <p className="text-[10px] font-medium opacity-90">{language === 'bn' ? 'আমাদের ঢাকা এবং ঢাকার বাইরের সকল আউটলেট' : 'All our outlets inside and outside Dhaka'}</p>
            <h3 className="text-lg font-bold leading-none my-1">{language === 'bn' ? 'খোলা থাকবে' : 'Open Now'}</h3>
            <p className="text-[8px] opacity-80">১২৪০৩</p>
          </div>
        </div>
      </section>

      {/* Action Cards (PC Builder Style) */}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {MOCK_SERVICES.map((service) => (
              <Card key={service.id} className="border-none shadow-sm hover:shadow-md transition-all overflow-hidden bg-white">
                <Link href={`/service/${service.id}`} className="block relative aspect-video overflow-hidden">
                  <Image src={service.imageUrl || ''} alt={service.title} fill className="object-cover" />
                </Link>
                <CardHeader className="p-4 pb-0">
                  <CardTitle className="text-lg font-bold">{service.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground font-semibold">{t('price_from')}</span>
                    <span className="text-primary font-bold text-xl">৳{service.displayPrice}</span>
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button 
                    onClick={() => handleBookNowDirectly(service)}
                    className="w-full gap-2 font-bold bg-primary text-white"
                  >
                    <CalendarCheck size={18} />
                    {t('book_now')}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
