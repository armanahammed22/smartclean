
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
import { PublicLayout } from '@/components/layout/public-layout';
import { 
  Layout, Home, Building2, 
  Brush, Sparkles, Wind, CalendarCheck, 
  Waves, Thermometer, Box, Smartphone, 
  Laptop, Computer, CheckCircle2
} from 'lucide-react';

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
    { name: language === 'bn' ? 'উইন্ডো' : 'Window', icon: Box },
    { name: language === 'bn' ? 'কিচেন' : 'Kitchen', icon: Thermometer },
    { name: language === 'bn' ? 'বাথরুম' : 'Bathroom', icon: Box },
    { name: language === 'bn' ? 'ফোন সাপোর্ট' : 'Support', icon: Smartphone },
  ];

  const GRID_HERO_IMAGES = [
    PlaceHolderImages.find(img => img.id === 'hero-grid-1'),
    PlaceHolderImages.find(img => img.id === 'hero-grid-2'),
    PlaceHolderImages.find(img => img.id === 'hero-grid-3'),
    PlaceHolderImages.find(img => img.id === 'hero-grid-4'),
    PlaceHolderImages.find(img => img.id === 'hero-grid-5'),
    PlaceHolderImages.find(img => img.id === 'hero-grid-6'),
  ];

  const HERO_LOGOS = PlaceHolderImages.find(img => img.id === 'app-logo');

  const CHECKLIST = [
    t('service_home'),
    t('service_office'),
    t('service_deep'),
    t('service_showroom'),
    t('service_kitchen'),
    t('service_sofa'),
  ];

  const handleBookNowDirectly = (service: any) => {
    addToCart(service);
    setCheckoutOpen(true);
  };

  return (
    <PublicLayout>
      <div className="flex flex-col gap-6 pb-12 bg-[#F2F4F8]">
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

        {/* Marketing Hero Grid Section (Ref Image Style) */}
        <section className="container mx-auto px-4 pt-2">
          <div className="bg-white rounded-2xl overflow-hidden shadow-md flex flex-col lg:flex-row border border-gray-100">
            {/* Left Content */}
            <div className="flex-1 p-6 lg:p-12 bg-gradient-to-br from-[#F0F9FF] to-white flex flex-col justify-center relative">
               <div className="flex items-center gap-3 mb-6 lg:mb-10">
                  <div className="relative w-12 h-12 lg:w-16 lg:h-16">
                    <Image src={HERO_LOGOS?.imageUrl || ''} alt="Logo" fill className="object-contain" />
                  </div>
                  <span className="text-2xl lg:text-4xl font-black text-[#081621] tracking-tighter uppercase font-headline">Smart Clean</span>
               </div>

               <h2 className="text-xl lg:text-4xl font-bold text-[#081621] mb-2 leading-tight">
                  {t('hero_question')}
               </h2>
               <p className="text-sm lg:text-xl font-medium text-gray-600 mb-8 max-w-lg">
                  {t('hero_banner_title')}
               </p>

               <div className="grid grid-cols-2 gap-y-4 mb-10">
                  {CHECKLIST.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <CheckCircle2 className="text-primary w-5 h-5 shrink-0" />
                      <span className="text-xs lg:text-sm font-bold text-gray-700">{item}</span>
                    </div>
                  ))}
               </div>

               <Button 
                className="bg-[#EF4A23] hover:bg-[#D43D1A] text-white rounded-full px-8 py-6 h-auto text-lg lg:text-xl font-black shadow-xl w-fit"
                onClick={() => setCheckoutOpen(true)}
               >
                  {t('hero_phone')}
               </Button>
            </div>

            {/* Right Image Grid */}
            <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-0.5 bg-gray-100 border-l border-gray-100">
               {GRID_HERO_IMAGES.map((img, idx) => (
                 <div key={idx} className="relative aspect-square lg:aspect-auto overflow-hidden group">
                   <Image 
                    src={img?.imageUrl || ''} 
                    alt={img?.description || 'Cleaning service'} 
                    fill 
                    className="object-cover transition-transform duration-500 group-hover:scale-110" 
                   />
                   <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                 </div>
               ))}
            </div>
          </div>
        </section>

        {/* Category Grid */}
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
