
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
  type CarouselApi
} from '@/components/ui/carousel';
import { 
  Layout, 
  Box, 
  BellRing, 
  Star,
  Zap,
  TicketPercent,
  Megaphone
} from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, doc, limit } from 'firebase/firestore';

export default function SmartCleanHomePage() {
  const { language, t } = useLanguage();
  const { addToCart, setCheckoutOpen } = useCart();
  const [api, setApi] = useState<CarouselApi>();
  const [currentDate, setCurrentDate] = useState<string>('');
  const db = useFirestore();

  // Real-time Customization Fetching
  const customizationRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'homepage') : null, [db]);
  const { data: customization } = useDoc(customizationRef);

  const prodCatsQuery = useMemoFirebase(() => db ? query(collection(db, 'product_categories'), orderBy('name', 'asc')) : null, [db]);
  const productsQuery = useMemoFirebase(() => db ? query(collection(db, 'products'), orderBy('name', 'asc')) : null, [db]);
  const servicesQuery = useMemoFirebase(() => db ? query(collection(db, 'services'), orderBy('title', 'asc')) : null, [db]);
  
  // Specific sections queries
  const recentProductsQuery = useMemoFirebase(() => db ? query(collection(db, 'products'), orderBy('name', 'desc'), limit(5)) : null, [db]);
  const recentServicesQuery = useMemoFirebase(() => db ? query(collection(db, 'services'), orderBy('title', 'desc'), limit(4)) : null, [db]);

  const { data: prodCats } = useCollection(prodCatsQuery);
  const { data: products } = useCollection(productsQuery);
  const { data: services } = useCollection(servicesQuery);
  const { data: recentProducts } = useCollection(recentProductsQuery);
  const { data: recentServices } = useCollection(recentServicesQuery);

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

  const marqueeText = `${currentDate ? currentDate + ' | ' : ''}${t('hero_banner_title')} | ${t('hero_phone')} | ${t('footer_address')} | Professional Cleaning Nationwide.`;

  const featuredProducts = products?.filter(p => customization?.featuredProductIds?.includes(p.id)) || [];
  const featuredServices = services?.filter(s => customization?.featuredServiceIds?.includes(s.id)) || [];

  return (
    <PublicLayout>
      <div className="flex flex-col gap-4 pb-12 bg-[#F2F4F8]">
        {/* Hero Carousel Section */}
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
          
          {/* Custom Content Section */}
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

          {/* Offer Banners Section */}
          {customization?.sections?.offerBanners && (
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {customization.offerBanners?.filter((b: any) => b.enabled).map((banner: any, i: number) => (
                <Link key={i} href={banner.link || '#'} className="block relative aspect-[16/7] rounded-2xl overflow-hidden group shadow-sm hover:shadow-md transition-all">
                  <Image src={banner.imageUrl} alt="Promo" fill className="object-cover group-hover:scale-105 transition-transform" />
                </Link>
              ))}
            </section>
          )}

          {/* Campaigns Section */}
          {customization?.sections?.campaigns && (
            <section className="space-y-8">
              {customization.campaigns?.filter((c: any) => c.enabled).map((camp: any, i: number) => (
                <div key={i} className="relative aspect-[21/7] w-full rounded-3xl overflow-hidden shadow-lg">
                  <Image src={camp.imageUrl} alt={camp.title} fill className="object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex flex-col justify-center p-8 md:p-16">
                    <div className="max-w-xl space-y-4">
                      <div className="flex items-center gap-2 text-primary">
                        <Zap size={20} fill="currentColor" />
                        <span className="text-xs font-black uppercase tracking-widest text-white">Active Campaign</span>
                      </div>
                      <h2 className="text-2xl md:text-4xl font-black text-white">{camp.title}</h2>
                      <p className="text-white/80 text-sm md:text-lg">{camp.description}</p>
                      <Button className="w-fit bg-primary hover:bg-primary/90 font-bold px-8">Learn More</Button>
                    </div>
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* Featured Services */}
          {customization?.sections?.popularServices !== false && featuredServices.length > 0 && (
            <section>
              <div className="mb-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary rounded-lg text-white"><Star size={20} /></div>
                  <h2 className="text-2xl font-black text-[#081621] uppercase tracking-tight">{t('services_title')}</h2>
                </div>
                <div className="h-1 flex-1 bg-gray-100 mx-6 rounded-full" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {featuredServices.map((service) => (
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
            </section>
          )}

          {/* Recent Services */}
          {customization?.sections?.recentServices !== false && recentServices?.length && (
            <section>
              <div className="mb-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary"><Layout size={20} /></div>
                  <h2 className="text-2xl font-black text-[#081621] uppercase tracking-tight">New Services</h2>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {recentServices.map((service) => (
                  <Card key={service.id} className="border-none shadow-sm hover:shadow-md transition-all overflow-hidden bg-white flex flex-col h-full group">
                    <Link href={`/service/${service.id}`} className="block relative aspect-video overflow-hidden shrink-0">
                      <Image src={service.imageUrl || ''} alt={service.title} fill className="object-cover group-hover:scale-105 transition-transform" />
                    </Link>
                    <CardHeader className="p-4 pb-1">
                      <CardTitle className="text-sm md:text-base font-bold line-clamp-1">{service.title}</CardTitle>
                    </CardHeader>
                    <CardFooter className="p-4 pt-0">
                      <Button onClick={() => handleBookNowDirectly(service)} size="sm" className="w-full gap-2 font-bold bg-primary text-white h-10">{t('book_now')}</Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Featured Products */}
          {customization?.sections?.bestSellingProducts !== false && featuredProducts.length > 0 && (
            <section>
              <div className="mb-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#081621] rounded-lg text-white"><Box size={20} /></div>
                  <h2 className="text-2xl font-black text-[#081621] uppercase tracking-tight">Featured Equipment</h2>
                </div>
                <div className="h-1 flex-1 bg-gray-100 mx-6 rounded-full" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {featuredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          )}

          {/* Recent Products */}
          {customization?.sections?.recentProducts !== false && recentProducts?.length && (
            <section>
              <div className="mb-10">
                <h2 className="text-2xl font-black text-[#081621] uppercase tracking-tight">Recently Added Supplies</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {recentProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
