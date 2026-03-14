"use client";

import React from 'react';
import Image from 'next/image';
import { ProductCard } from '@/components/products/product-card';
import { Product, Service } from '@/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useLanguage } from '@/components/providers/language-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Layout, Wrench, Activity, Truck, ShieldCheck, 
  Headphones, ArrowRight, Home, Building2, 
  Brush, Sparkles, Wind, CalendarCheck 
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

  const MOCK_PRODUCTS: Product[] = [
    {
      id: '1',
      name: language === 'bn' ? 'স্মার্ট ভ্যাকিউম রোবট' : 'Smart Vacuum Robot',
      price: 499.99,
      category: language === 'bn' ? 'সরঞ্জাম' : 'Equipment',
      shortDescription: language === 'bn' ? 'সব ধরনের মেঝের জন্য এআই-চালিত ক্লিনিং।' : 'AI-powered autonomous cleaning for all floor types.',
      description: 'The UltraClean Robot uses advanced LiDAR mapping to navigate your home and ensure every corner is spotless.',
      imageUrl: PlaceHolderImages.find(img => img.id === 'prod-1')?.imageUrl || '',
    },
    {
      id: '2',
      name: language === 'bn' ? 'পরিবেশ বান্ধব সলিউশন কিট' : 'Eco-Friendly Solution Kit',
      price: 45.00,
      category: language === 'bn' ? 'সরবরাহ' : 'Supplies',
      shortDescription: language === 'bn' ? 'জৈব এবং অ-বিষাক্ত ক্লিনিং এজেন্ট।' : 'Biodegradable non-toxic cleaning agents.',
      description: 'Safe for pets and children, our organic cleaning kit includes multi-surface sprays and glass cleaners.',
      imageUrl: PlaceHolderImages.find(img => img.id === 'prod-2')?.imageUrl || '',
    },
    {
      id: '3',
      name: language === 'bn' ? 'প্রফেশনাল স্টিম মপ' : 'Professional Steam Mop',
      price: 129.00,
      category: language === 'bn' ? 'সরঞ্জাম' : 'Equipment',
      shortDescription: language === 'bn' ? 'উচ্চ-তাপমাত্রার বাষ্প ব্যবহার করে মেঝে জীবাণুমুক্ত করুন।' : 'Sanitize floors without chemicals using high-temp steam.',
      description: 'Kills 99.9% of bacteria and germs. Perfect for hardwood and tile floors.',
      imageUrl: PlaceHolderImages.find(img => img.id === 'prod-3')?.imageUrl || '',
    },
    {
      id: '4',
      name: language === 'bn' ? 'এয়ার পিউরিফায়ার প্র' : 'Air Purifier Pro',
      price: 299.00,
      category: language === 'bn' ? 'সরঞ্জাম' : 'Equipment',
      shortDescription: language === 'bn' ? 'পরিষ্কার বাতাসের জন্য উন্নত ফিল্টার।' : 'Advanced filtration for pure indoor air.',
      description: 'High efficiency particulate air filter combined with activated carbon to remove odors and allergens.',
      imageUrl: PlaceHolderImages.find(img => img.id === 'prod-4')?.imageUrl || '',
    },
    {
      id: '5',
      name: language === 'bn' ? 'উইন্ডো ক্লিনিং রোবট' : 'Window Cleaning Robot',
      price: 349.99,
      category: language === 'bn' ? 'সরঞ্জাম' : 'Equipment',
      shortDescription: language === 'bn' ? 'অনায়াসে গ্লাস পরিষ্কারের রোবট।' : 'Effortless window cleaning with AI-driven robot.',
      description: 'Suction-based window cleaner that automatically maps your glass surfaces for a streak-free finish.',
      imageUrl: PlaceHolderImages.find(img => img.id === 'prod-6')?.imageUrl || '',
    }
  ];

  const MOCK_SERVICES: Service[] = [
    {
      id: 's1',
      title: language === 'bn' ? 'হোম ডিপ ক্লিন' : 'Home Deep Clean',
      description: language === 'bn' ? 'প্রফেশনাল টিমের মাধ্যমে আপনার বাসভবনের সম্পূর্ণ পরিচ্ছন্নতা।' : 'Comprehensive top-to-bottom cleaning of your entire residence by professional teams.',
      icon: 'Layout',
      price: language === 'bn' ? '৳১৫০০০ থেকে' : 'From $150'
    },
    {
      id: 's2',
      title: language === 'bn' ? 'এসি রক্ষণাবেক্ষণ' : 'AC Maintenance',
      description: language === 'bn' ? 'এসি ইউনিটের দক্ষ সার্ভিসিং এবং স্যানিটাইজেশন।' : 'Expert servicing, cleaning, and sanitization of split and central AC units.',
      icon: 'Wrench',
      price: language === 'bn' ? '৳৫০০০ থেকে' : 'From $50'
    },
    {
      id: 's3',
      title: language === 'bn' ? 'স্যানিটাইজেশন সার্ভিস' : 'Sanitization Service',
      description: language === 'bn' ? 'বাড়ি এবং অফিসের জন্য মেডিকেল-গ্রেড স্যানিটাইজেশন।' : 'Medical-grade fogging and surface sanitization for homes and corporate offices.',
      icon: 'Activity',
      price: language === 'bn' ? '৳৭৫০০ থেকে' : 'From $75'
    }
  ];

  const QUICK_CATEGORIES = [
    { name: language === 'bn' ? 'আবাসিক' : 'Residential', icon: Home },
    { name: language === 'bn' ? 'অফিস' : 'Office', icon: Building2 },
    { name: language === 'bn' ? 'ডিপ ক্লিন' : 'Deep Clean', icon: Brush },
    { name: language === 'bn' ? 'স্যানিটাইজেশন' : 'Sanitization', icon: Sparkles },
    { name: language === 'bn' ? 'এসি সার্ভিস' : 'AC Service', icon: Wind },
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

  return (
    <div className="flex flex-col gap-12 pb-24 bg-[#F2F4F8]">
      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-auto lg:h-[500px]">
          <div className="lg:col-span-8 relative rounded-xl overflow-hidden shadow-lg h-[300px] lg:h-full">
            <Carousel className="w-full h-full" opts={{ loop: true }}>
              <CarouselContent className="h-full">
                {HERO_IMAGES.map((img, index) => (
                  <CarouselItem key={index} className="h-full pl-0">
                    <div className="relative h-full w-full group">
                      <Image
                        src={img?.imageUrl || ''}
                        alt={img?.description || 'Hero main'}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        priority={index === 0}
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-center px-12">
                        <div className="max-w-md text-white space-y-4">
                          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">{t('hero_title')}</h1>
                          <p className="text-sm md:text-base opacity-90">{t('hero_subtitle')}</p>
                          <Button size="lg" className="rounded-full px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-bold">{t('hero_cta')}</Button>
                        </div>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-4 bg-white/20 hover:bg-white/40 border-none text-white" />
              <CarouselNext className="right-4 bg-white/20 hover:bg-white/40 border-none text-white" />
            </Carousel>
          </div>

          <div className="lg:col-span-4 hidden lg:flex flex-col gap-4 h-full">
            <div className="relative flex-1 rounded-xl overflow-hidden shadow-md group">
              <Image
                src={PlaceHolderImages.find(img => img.id === 'hero-side-1')?.imageUrl || ''}
                alt="Promo 1"
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/30 flex flex-col justify-end p-6 text-white">
                <h3 className="text-xl font-bold mb-1">{language === 'bn' ? 'বিশেষ অফার' : 'Special Offer'}</h3>
                <p className="text-sm opacity-90">{language === 'bn' ? 'আপনার প্রথম বুকিংয়ে ২০% ছাড়!' : '20% Off on your first booking!'}</p>
              </div>
            </div>
            <div className="relative flex-1 rounded-xl overflow-hidden shadow-md group">
              <Image
                src={PlaceHolderImages.find(img => img.id === 'hero-side-2')?.imageUrl || ''}
                alt="Promo 2"
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/30 flex flex-col justify-end p-6 text-white">
                <h3 className="text-xl font-bold mb-1">{language === 'bn' ? 'নতুন সার্ভিস' : 'New Service'}</h3>
                <p className="text-sm opacity-90">{language === 'bn' ? 'আমাদের নতুন কিচেন ডিপ ক্লিন ট্রাই করুন' : 'Try our new Kitchen Deep Clean'}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 space-y-16">
        {/* 5-Column Quick Category Grid */}
        <section className="bg-white p-8 rounded-2xl shadow-sm border border-border/50">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {QUICK_CATEGORIES.map((cat, i) => (
              <div key={i} className="flex flex-col items-center gap-3 p-4 rounded-xl hover:bg-primary/5 transition-colors cursor-pointer group">
                <div className="p-4 bg-primary/10 text-primary rounded-2xl group-hover:bg-primary group-hover:text-white transition-all duration-300 transform group-hover:-translate-y-1">
                  <cat.icon size={32} />
                </div>
                <span className="font-bold text-sm text-center text-[#081621]">{cat.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Professional Services - FIRST PRIORITY */}
        <section id="services">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-border/50">
            <div className="text-center mb-12 space-y-2">
              <h2 className="text-4xl font-bold tracking-tight text-[#081621]">{t('services_title')}</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                {t('services_subtitle')}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {MOCK_SERVICES.map((service) => (
                <Card key={service.id} className="border-none shadow-md hover:shadow-xl transition-all duration-300 group overflow-hidden flex flex-col">
                  <CardHeader className="pt-8 px-6">
                    <div className="mb-6 p-4 bg-primary/5 rounded-2xl w-fit group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 transform group-hover:-translate-y-2">
                      {IconMap[service.icon] || <Layout className="text-primary" size={32} />}
                    </div>
                    <CardTitle className="text-2xl font-bold">{service.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="px-6 pb-8 flex-1 flex flex-col">
                    <p className="text-muted-foreground leading-relaxed mb-6">
                      {service.description}
                    </p>
                    <div className="mt-auto pt-6 border-t">
                      <div className="flex items-center justify-between mb-6">
                        <span className="text-primary font-bold text-xl">{service.price}</span>
                        <Button variant="ghost" size="sm" className="gap-2 group-hover:text-primary font-bold px-0">
                          {t('service_details')} <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </div>
                      <Button className="w-full gap-2 font-bold h-12 rounded-xl bg-primary text-white hover:bg-primary/90 transition-all shadow-md">
                        <CalendarCheck size={18} />
                        {t('book_now')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Products - 5 Column Grid */}
        <section id="products">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-border/50">
            <div className="flex items-center justify-between mb-8">
              <div className="space-y-1">
                <h2 className="text-3xl font-bold tracking-tight text-[#081621]">{t('products_title')}</h2>
                <p className="text-muted-foreground">{t('products_subtitle')}</p>
              </div>
              <Button variant="outline" className="rounded-full font-bold">{t('view_all')}</Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {MOCK_PRODUCTS.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>

        {/* Advantages */}
        <section className="pb-12">
          <div className="text-center mb-12 space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-[#081621]">{t('features_title')}</h2>
            <p className="text-muted-foreground">{t('features_subtitle')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white flex flex-col items-center text-center p-10 rounded-3xl shadow-sm border border-border/50 group hover:bg-primary/5 transition-colors">
              <div className="mb-8 p-6 bg-primary text-white rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                <ShieldCheck size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-4">{language === 'bn' ? 'যাচাইকৃত পেশাদার' : 'Vetted Professionals'}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {language === 'bn' ? 'প্রতিটি ক্লিনার কঠোর প্রশিক্ষণ এবং ব্যাকগ্রাউন্ড চেক এর মাধ্যমে আসে।' : 'Every cleaner undergoes background checks and rigorous training.'}
              </p>
            </div>
            <div className="bg-white flex flex-col items-center text-center p-10 rounded-3xl shadow-sm border border-border/50 group hover:bg-primary/5 transition-colors">
              <div className="mb-8 p-6 bg-primary text-white rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                <Truck size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-4">{language === 'bn' ? 'নমনীয় সময়সূচী' : 'Flexible Scheduling'}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {language === 'bn' ? 'আপনার ব্যস্ত জীবনযাত্রার সাথে মানানসই যেকোনো সময়ে বুক করুন।' : 'Book a service at any time that fits your busy lifestyle.'}
              </p>
            </div>
            <div className="bg-white flex flex-col items-center text-center p-10 rounded-3xl shadow-sm border border-border/50 group hover:bg-primary/5 transition-colors">
              <div className="mb-8 p-6 bg-primary text-white rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                <Headphones size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-4">{language === 'bn' ? 'হ্যাপিনেস গ্যারান্টি' : 'Happiness Guarantee'}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {language === 'bn' ? 'সন্তুষ্ট নন? আমরা আপনার সন্তুষ্টি না হওয়া পর্যন্ত ফ্রি রি-ক্লিন করব।' : 'Not satisfied? We will re-clean for free until you are happy.'}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
