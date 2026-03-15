
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/components/providers/language-provider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PublicLayout } from '@/components/layout/public-layout';
import { useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, doc, where } from 'firebase/firestore';
import { 
  BellRing, 
  Clock, 
  ArrowRight,
  LayoutGrid,
  Mail,
  Phone
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function SmartCleanHomePage() {
  const { language, t } = useLanguage();
  const [marqueeText, setMarqueeText] = useState<string>('');
  const db = useFirestore();

  // Settings & Marketing
  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'homepage') : null, [db]);
  const { data: settings } = useDoc(settingsRef);

  const offersQuery = useMemoFirebase(() => db ? query(collection(db, 'marketing_offers'), where('enabled', '==', true)) : null, [db]);
  const { data: offers } = useCollection(offersQuery);

  useEffect(() => {
    const dateStr = new Date().toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
    setMarqueeText(`${dateStr} | ${t('hero_banner_title')} | Bangladesh's Leading Cleaning Tech Partner.`);
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
                    <Link href="#contact">
                      Contact Us
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
          
          {/* Middle Offers */}
          <div className="space-y-6">
            {renderOffers('middle')}
          </div>

          {/* Contact Section */}
          <section id="contact" className="py-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center bg-white rounded-3xl p-8 md:p-16 shadow-sm border">
              <div className="space-y-6">
                <h2 className="text-3xl md:text-4xl font-black font-headline text-[#081621]">Get a Custom Inquiry</h2>
                <p className="text-muted-foreground text-lg">Our experts are ready to help you with specialized cleaning solutions for your home or business.</p>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-xl text-primary"><Phone size={24} /></div>
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase">Phone</p>
                      <p className="font-black text-lg">+8801919640422</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-xl text-primary"><Mail size={24} /></div>
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase">Email</p>
                      <p className="font-black text-lg">smartclean422@gmail.com</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative aspect-square md:aspect-auto h-full min-h-[300px] rounded-2xl overflow-hidden shadow-2xl">
                <Image src="https://picsum.photos/seed/cleancontact/800/800" alt="Contact" fill className="object-cover" />
              </div>
            </div>
          </section>

          {/* Offers: After Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {renderOffers('after_products')}
          </div>

        </div>
      </div>
    </PublicLayout>
  );
}
