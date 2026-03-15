'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/components/providers/language-provider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PublicLayout } from '@/components/layout/public-layout';
import { useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, doc, where, limit } from 'firebase/firestore';
import { 
  BellRing, 
  Clock, 
  Mail,
  Phone,
  ArrowRight,
  Package,
  Wrench,
  Star,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { ProductCard } from '@/components/products/product-card';

export default function SmartCleanHomePage() {
  const { language, t } = useLanguage();
  const [marqueeText, setMarqueeText] = useState<string>('');
  const db = useFirestore();

  // Settings & Marketing
  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'homepage') : null, [db]);
  const { data: settings } = useDoc(settingsRef);

  const offersQuery = useMemoFirebase(() => db ? query(collection(db, 'marketing_offers'), where('enabled', '==', true)) : null, [db]);
  const { data: offers } = useCollection(offersQuery);

  const productsQuery = useMemoFirebase(() => db ? query(collection(db, 'products'), limit(8)) : null, [db]);
  const servicesQuery = useMemoFirebase(() => db ? query(collection(db, 'services'), limit(6)) : null, [db]);

  const { data: products, isLoading: productsLoading } = useCollection(productsQuery);
  const { data: services, isLoading: servicesLoading } = useCollection(servicesQuery);

  useEffect(() => {
    const dateStr = new Date().toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
    setMarqueeText(`${dateStr} | Clean Tech Excellence | Bangladesh's Leading CRM for Cleaning Operations.`);
  }, [language]);

  const renderOffers = (placement: string) => {
    return offers?.filter(o => o.placement === placement).map(offer => {
      if (!offer.imageUrl) return null;
      return (
        <Link key={offer.id} href={offer.link || '#'} className="block relative aspect-[21/7] rounded-3xl overflow-hidden group shadow-lg">
          <Image 
            src={offer.imageUrl} 
            alt={offer.title || 'Marketing Offer'} 
            fill 
            className="object-cover group-hover:scale-105 transition-transform duration-700" 
          />
          <div className="absolute inset-0 bg-black/20" />
        </Link>
      );
    });
  };

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
                src={settings?.hero?.imageUrl || "https://picsum.photos/seed/crmhero/1200/600"} 
                alt="Smart Clean Hero" 
                fill 
                className="object-cover opacity-40" 
                priority
              />
              <div className="absolute inset-0 flex flex-col justify-center p-8 md:p-16 space-y-6">
                <div className="max-w-xl space-y-2">
                  <Badge className="bg-primary text-white border-none mb-4 uppercase tracking-[0.2em]">
                    Smart Clean Operations
                  </Badge>
                  <h1 className="text-3xl md:text-6xl font-black font-headline leading-tight">
                    {settings?.hero?.title || 'Intelligent Cleaning CRM'}
                  </h1>
                  <p className="text-white/80 text-sm md:text-lg">
                    {settings?.hero?.subtitle || 'Managing enterprise cleaning services across Bangladesh with efficiency.'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-4">
                  <Button className="bg-[#EF4A23] hover:bg-[#D43D1A] rounded-full h-14 px-10 text-lg font-black shadow-2xl" asChild>
                    <Link href="/support">
                      Contact Sales
                    </Link>
                  </Button>
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-6 rounded-full border border-white/20">
                    <Clock className="text-primary" />
                    <span className="font-bold text-sm">24/7 Support Available</span>
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

        <div className="container mx-auto px-4 space-y-16 mt-8">
          
          {/* Services Grid */}
          <section className="space-y-8">
            <div className="flex justify-between items-end">
              <div className="space-y-2">
                <h2 className="text-3xl font-black font-headline text-[#081621]">Expert Services</h2>
                <p className="text-muted-foreground">Professional maintenance solutions for home and office.</p>
              </div>
              <Button variant="link" className="gap-2 font-bold" asChild>
                <Link href="/services">View All Services <ChevronRight size={16} /></Link>
              </Button>
            </div>
            
            {servicesLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" /></div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                {services?.map((service) => (
                  <Link key={service.id} href={`/service/${service.id}`} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-transparent hover:border-primary/20 flex flex-col">
                    <div className="relative aspect-video overflow-hidden">
                      <Image 
                        src={service.imageUrl || 'https://picsum.photos/seed/srv/600/400'} 
                        alt={service.title || 'Cleaning Service'} 
                        fill 
                        className="object-cover group-hover:scale-110 transition-transform duration-500" 
                      />
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-white/90 text-primary border-none shadow-sm backdrop-blur-sm font-black hidden sm:inline-flex">{service.category || 'General'}</Badge>
                      </div>
                    </div>
                    <div className="p-3 md:p-6 space-y-2 md:space-y-4 flex-1">
                      <h3 className="text-sm md:text-xl font-bold group-hover:text-primary transition-colors line-clamp-1">{service.title || 'Service Title'}</h3>
                      <p className="text-[10px] md:text-sm text-muted-foreground line-clamp-2 hidden sm:block">{service.description || 'Professional cleaning service.'}</p>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 md:pt-4 border-t gap-2">
                        <span className="text-xs md:text-lg font-black text-primary">
                          ৳{(service.basePrice || 0).toLocaleString()} 
                          <span className="text-[8px] md:text-[10px] ml-1 font-bold text-muted-foreground uppercase">Base</span>
                        </span>
                        <Button size="sm" className="rounded-full font-bold px-4 md:px-6 h-8 md:h-9 text-[10px] md:text-xs">Book Now</Button>
                      </div>
                    </div>
                  </Link>
                ))}
                {services?.length === 0 && !servicesLoading && (
                  <div className="col-span-full py-12 text-center text-muted-foreground italic">No services available currently.</div>
                )}
              </div>
            )}
          </section>

          {/* Products Grid */}
          <section className="space-y-8">
            <div className="flex justify-between items-end">
              <div className="space-y-2">
                <h2 className="text-3xl font-black font-headline text-[#081621]">Professional Tools</h2>
                <p className="text-muted-foreground">High-performance cleaning equipment and supplies.</p>
              </div>
              <Button variant="link" className="gap-2 font-bold" asChild>
                <Link href="/products">Shop Catalog <ChevronRight size={16} /></Link>
              </Button>
            </div>
            
            {productsLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" /></div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                {products?.map((product) => (
                  <ProductCard key={product.id} product={product as any} />
                ))}
                {products?.length === 0 && !productsLoading && (
                  <div className="col-span-full py-12 text-center text-muted-foreground italic">No products in stock.</div>
                )}
              </div>
            )}
          </section>

          {/* Custom Content Section */}
          {settings?.sections?.customContent && settings.marketingContent && (
            <section className="bg-white p-8 md:p-16 rounded-3xl border shadow-sm">
               <div className="max-w-3xl prose prose-slate">
                  {settings.marketingContent}
               </div>
            </section>
          )}

        </div>
      </div>
    </PublicLayout>
  );
}
