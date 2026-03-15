'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ProductCard } from '@/components/products/product-card';
import { useLanguage } from '@/components/providers/language-provider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/components/providers/cart-provider';
import { PublicLayout } from '@/components/layout/public-layout';
import { useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, doc, where } from 'firebase/firestore';
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext,
  CarouselPrevious 
} from '@/components/ui/carousel';
import { 
  BellRing, 
  Zap,
  ChevronRight,
  TrendingUp,
  Clock,
  ArrowRight,
  Tags,
  LayoutGrid
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const CountdownTimer = ({ targetDate }: { targetDate: string }) => {
  const [timeLeft, setTimeTime] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const timer = setInterval(() => {
      const difference = +new Date(targetDate) - +new Date();
      if (difference > 0) {
        setTimeTime({
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

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
  const [marqueeText, setMarqueeText] = useState<string>('');
  const db = useFirestore();

  // Settings & Marketing
  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'homepage') : null, [db]);
  const { data: settings } = useDoc(settingsRef);

  // Queries
  const productsQuery = useMemoFirebase(() => db ? query(collection(db, 'products'), where('status', '==', 'Active'), orderBy('name', 'asc')) : null, [db]);
  const servicesQuery = useMemoFirebase(() => db ? query(collection(db, 'services'), where('status', '==', 'Active'), orderBy('title', 'asc')) : null, [db]);
  const categoriesQuery = useMemoFirebase(() => db ? query(collection(db, 'product_categories'), where('status', '==', 'Active'), orderBy('name', 'asc')) : null, [db]);
  const offersQuery = useMemoFirebase(() => db ? query(collection(db, 'marketing_offers'), where('enabled', '==', true)) : null, [db]);
  const campaignsQuery = useMemoFirebase(() => db ? query(collection(db, 'marketing_campaigns'), where('enabled', '==', true)) : null, [db]);

  const { data: products } = useCollection(productsQuery);
  const { data: services } = useCollection(servicesQuery);
  const { data: categories } = useCollection(categoriesQuery);
  const { data: offers } = useCollection(offersQuery);
  const { data: campaigns } = useCollection(campaignsQuery);

  useEffect(() => {
    const dateStr = new Date().toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
    setMarqueeText(`${dateStr} | ${t('hero_banner_title')} | Free Shipping on Equipment | Professional Deep Cleaning Across Bangladesh.`);
  }, [language, t]);

  const renderOffers = (placement: string) => {
    return offers?.filter(o => o.placement === placement).map(offer => {
      if (!offer.imageUrl || typeof offer.imageUrl !== 'string' || offer.imageUrl === '') return null;
      return (
        <Link key={offer.id} href={offer.link || '#'} className="block relative aspect-[21/7] rounded-3xl overflow-hidden group shadow-lg">
          <Image 
            src={offer.imageUrl} 
            alt={offer.title || 'Offer'} 
            fill 
            className="object-cover group-hover:scale-105 transition-transform duration-700" 
          />
          <div className="absolute inset-0 bg-black/20" />
        </Link>
      );
    });
  };

  const activeCampaign = campaigns?.find(c => {
    const now = new Date().toISOString();
    return now >= c.startDate && now <= c.endDate;
  });

  return (
    <PublicLayout>
      <div className="flex flex-col gap-4 pb-12 bg-[#F2F4F8]">
        
        {/* Top Banner Offers */}
        <section className="container mx-auto px-4 pt-4 space-y-4">
          {renderOffers('top')}
        </section>

        {/* Hero Section */}
        {(!settings || settings.hero?.enabled !== false) && (
          <section className="container mx-auto px-4">
            <div className="relative overflow-hidden rounded-3xl shadow-xl bg-[#081621] text-white aspect-[21/9] md:aspect-[21/7]">
              <Image 
                src={settings?.hero?.imageUrl || "https://picsum.photos/seed/main-hero/1200/600"} 
                alt="Hero" 
                fill 
                className="object-cover opacity-40" 
              />
              <div className="absolute inset-0 flex flex-col justify-center p-8 md:p-16 space-y-6">
                <div className="max-w-xl space-y-2">
                  <Badge className="bg-primary text-white border-none mb-4 uppercase tracking-[0.2em]">
                    Bangladesh's #1 Clean Tech
                  </Badge>
                  <h1 className="text-3xl md:text-6xl font-black font-headline leading-tight">
                    {settings?.hero?.title || t('hero_banner_title')}
                  </h1>
                  <p className="text-white/80 text-sm md:text-lg">
                    {settings?.hero?.subtitle || t('hero_subtitle')}
                  </p>
                </div>
                <div className="flex flex-wrap gap-4">
                  <Button className="bg-[#EF4A23] hover:bg-[#D43D1A] rounded-full h-14 px-10 text-lg font-black shadow-2xl" asChild>
                    <Link href={settings?.hero?.ctaLink || "#services"}>
                      {settings?.hero?.ctaText || t('hero_cta')}
                    </Link>
                  </Button>
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-6 rounded-full border border-white/20">
                    <Clock className="text-primary" />
                    <span className="font-bold text-sm">{t('hero_phone')}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Marquee */}
        <section className="container mx-auto px-4">
          <div className="bg-white rounded-full h-12 shadow-sm border border-gray-100 flex items-center overflow-hidden">
            <div className="h-full bg-primary px-6 flex items-center gap-2 z-10 text-white font-black text-xs uppercase tracking-widest">
              <BellRing size={16} /> LIVE
            </div>
            <div className="flex-1 overflow-hidden relative h-full flex items-center">
               <p className="animate-marquee inline-block whitespace-nowrap text-xs md:text-sm font-medium text-gray-600 px-4">
                 {marqueeText}
               </p>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 space-y-12 mt-8">
          
          {/* Categories Slider */}
          {(!settings || settings.sections?.categorySections) && categories && categories.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-[#081621]">
                <Tags size={20} className="text-primary" />
                <h2 className="text-lg font-bold uppercase tracking-tight">{t('nav_categories')}</h2>
              </div>
              <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                {categories.map(cat => (
                  <Button key={cat.id} variant="outline" className="rounded-full whitespace-nowrap font-bold bg-white shadow-sm border-gray-100 px-6">
                    {cat.name}
                  </Button>
                ))}
              </div>
            </section>
          )}

          {/* Active Campaign Flash Sale */}
          {activeCampaign && (!settings || settings.sections?.flashSale) && (
            <section className="bg-[#081621] p-8 rounded-3xl shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-10"><Zap size={200} className="text-white" /></div>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-yellow-400">
                    <Zap fill="currentColor" size={32} />
                    <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter">{activeCampaign.title}</h2>
                  </div>
                  <p className="text-white/60 font-medium">{activeCampaign.description}</p>
                  <Button variant="link" className="text-primary p-0 h-auto font-bold" asChild>
                    <Link href={`/campaign/${activeCampaign.id}`}>View Campaign Details <ArrowRight size={16} className="ml-2" /></Link>
                  </Button>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">Ending In</span>
                  <CountdownTimer targetDate={activeCampaign.endDate} />
                </div>
              </div>
            </section>
          )}

          {/* Trending Slider */}
          {(!settings || settings.sections?.trendingProducts) && products && products.length > 0 && (
            <section className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#EF4A23] rounded-2xl text-white shadow-lg shadow-red-500/20"><TrendingUp size={24} /></div>
                <h2 className="text-2xl md:text-3xl font-black text-[#081621] uppercase tracking-tighter">Trending Now</h2>
              </div>
              <Carousel className="w-full">
                <CarouselContent className="-ml-4">
                  {products.slice(0, 8).map(product => (
                    <CarouselItem key={product.id} className="pl-4 basis-1/2 md:basis-1/4 lg:basis-1/5">
                      <ProductCard product={product} />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="hidden md:flex" />
                <CarouselNext className="hidden md:flex" />
              </Carousel>
            </section>
          )}

          {/* Offers: Before Products */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderOffers('before_products')}
          </div>

          {/* Service Showcase */}
          {(!settings || settings.sections?.popularServices) && services && services.length > 0 && (
            <section id="services" className="space-y-8">
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary rounded-2xl text-white shadow-lg shadow-primary/20"><LayoutGrid size={24} /></div>
                  <h2 className="text-2xl md:text-3xl font-black text-[#081621] uppercase tracking-tighter">{t('services_title')}</h2>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {services.map((service) => (
                  <Card key={service.id} className="border-none shadow-sm hover:shadow-xl transition-all overflow-hidden bg-white group flex flex-col">
                    <Link href={`/service/${service.id}`} className="block relative aspect-video overflow-hidden">
                      {service.imageUrl ? (
                        <Image src={service.imageUrl} alt={service.title} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground/30">
                          <LayoutGrid size={48} />
                        </div>
                      )}
                    </Link>
                    <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-4">
                      <h3 className="font-bold text-sm leading-tight line-clamp-2">{service.title}</h3>
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-col">
                          <span className="text-[8px] text-muted-foreground font-black uppercase tracking-widest">{t('price_from')}</span>
                          <span className="text-primary font-black text-lg">৳{service.basePrice.toLocaleString()}</span>
                        </div>
                        <Button onClick={() => { addToCart(service); setCheckoutOpen(true); }} className="w-full gap-2 font-bold bg-primary text-white h-10 text-xs">
                          {t('book_now')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Category Sections */}
          {(!settings || settings.sections?.categorySections) && categories?.map(cat => {
            const catProducts = products?.filter(p => p.categoryId === cat.id);
            if (!catProducts || catProducts.length === 0) return null;
            return (
              <section key={cat.id} className="space-y-8">
                <div className="flex items-center justify-between border-b pb-4">
                  <h2 className="text-2xl font-black text-[#081621] uppercase tracking-tighter">{cat.name}</h2>
                  <Button variant="link" className="text-primary font-bold">View All <ChevronRight size={16} /></Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                  {catProducts.slice(0, 10).map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </section>
            );
          })}

          {/* Middle Offers */}
          <div className="space-y-6">
            {renderOffers('middle')}
          </div>

          {/* Offers: After Products */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {renderOffers('after_products')}
          </div>

        </div>
      </div>
    </PublicLayout>
  );
}
