"use client";

import React from 'react';
import Image from 'next/image';
import { ProductCard } from '@/components/products/product-card';
import { Product, Service, Feature } from '@/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Layout, Wrench, Activity, Truck, ShieldCheck, Headphones, ArrowRight } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Smart Vacuum Robot',
    price: 499.99,
    category: 'Equipment',
    shortDescription: 'AI-powered autonomous cleaning for all floor types.',
    description: 'The UltraClean Robot uses advanced LiDAR mapping to navigate your home and ensure every corner is spotless.',
    imageUrl: PlaceHolderImages.find(img => img.id === 'prod-1')?.imageUrl || '',
  },
  {
    id: '2',
    name: 'Eco-Friendly Solution Kit',
    price: 45.00,
    category: 'Supplies',
    shortDescription: 'Biodegradable non-toxic cleaning agents.',
    description: 'Safe for pets and children, our organic cleaning kit includes multi-surface sprays and glass cleaners.',
    imageUrl: PlaceHolderImages.find(img => img.id === 'prod-2')?.imageUrl || '',
  },
  {
    id: '3',
    name: 'Professional Steam Mop',
    price: 129.00,
    category: 'Equipment',
    shortDescription: 'Sanitize floors without chemicals using high-temp steam.',
    description: 'Kills 99.9% of bacteria and germs. Perfect for hardwood and tile floors.',
    imageUrl: PlaceHolderImages.find(img => img.id === 'prod-3')?.imageUrl || '',
  }
];

const MOCK_SERVICES: Service[] = [
  {
    id: 's1',
    title: 'Home Deep Clean',
    description: 'Comprehensive top-to-bottom cleaning of your entire residence by professional teams.',
    icon: 'Layout',
    price: 'From $150'
  },
  {
    id: 's2',
    title: 'AC Maintenance',
    description: 'Expert servicing, cleaning, and sanitization of split and central AC units.',
    icon: 'Wrench',
    price: 'From $50'
  },
  {
    id: 's3',
    title: 'Sanitization Service',
    description: 'Medical-grade fogging and surface sanitization for homes and corporate offices.',
    icon: 'Activity',
    price: 'From $75'
  }
];

const MOCK_FEATURES: Feature[] = [
  {
    id: 'f1',
    title: 'Vetted Professionals',
    description: 'Every cleaner undergoes background checks and rigorous training.',
    icon: 'ShieldCheck'
  },
  {
    id: 'f2',
    title: 'Flexible Scheduling',
    description: 'Book a service at any time that fits your busy lifestyle.',
    icon: 'Truck'
  },
  {
    id: 'f3',
    title: 'Happiness Guarantee',
    description: 'Not satisfied? We will re-clean for free until you are happy.',
    icon: 'Headphones'
  }
];

const IconMap: Record<string, React.ReactNode> = {
  Layout: <Layout className="text-primary" size={32} />,
  Wrench: <Wrench className="text-primary" size={32} />,
  Activity: <Activity className="text-primary" size={32} />,
  Truck: <Truck className="text-primary" size={32} />,
  ShieldCheck: <ShieldCheck className="text-primary" size={32} />,
  Headphones: <Headphones className="text-primary" size={32} />,
};

const HERO_IMAGES = [
  PlaceHolderImages.find(img => img.id === 'hero-main'),
  PlaceHolderImages.find(img => img.id === 'hero-side-1'),
  PlaceHolderImages.find(img => img.id === 'hero-side-2'),
];

export default function SmartCleanHomePage() {
  return (
    <div className="flex flex-col gap-12 pb-24 bg-[#F2F4F8]">
      {/* Hero Section Grid */}
      <section className="container mx-auto px-4 pt-6">
        <div className="grid lg:grid-cols-12 gap-5">
          <div className="lg:col-span-12 relative rounded-xl overflow-hidden h-[300px] md:h-[500px] shadow-lg">
            <Carousel className="w-full h-full" opts={{ loop: true }}>
              <CarouselContent className="h-full">
                {HERO_IMAGES.map((img, index) => (
                  <CarouselItem key={index} className="h-full pl-0">
                    <div className="relative h-full w-full group">
                      <Image
                        src={img?.imageUrl || ''}
                        alt={img?.description || 'Hero image'}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        priority={index === 0}
                        data-ai-hint={img?.imageHint}
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-center px-12">
                        <div className="max-w-xl text-white space-y-4">
                          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">Smart Solutions for a Clean Life</h1>
                          <p className="text-lg opacity-90">Expert cleaning and maintenance services in Bangladesh. Trusted by thousands.</p>
                          <Button size="lg" className="rounded-full px-8 bg-primary hover:bg-primary/90">Book Now</Button>
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
        </div>
      </section>

      <div className="container mx-auto px-4 space-y-16">
        {/* Layer 1: Featured Products */}
        <section id="products">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-border/50">
            <div className="flex items-center justify-between mb-8">
              <div className="space-y-1">
                <h2 className="text-3xl font-bold tracking-tight text-[#081621]">Top Cleaning Products</h2>
                <p className="text-muted-foreground">High-performance tools for professional results.</p>
              </div>
              <Button variant="outline" className="rounded-full">View All</Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {MOCK_PRODUCTS.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>

        {/* Layer 2: Professional Services */}
        <section id="services">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-border/50">
            <div className="text-center mb-12 space-y-2">
              <h2 className="text-4xl font-bold tracking-tight text-[#081621]">Our Expertise</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                We provide a wide range of specialized cleaning and maintenance services.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {MOCK_SERVICES.map((service) => (
                <Card key={service.id} className="border-none shadow-md hover:shadow-xl transition-all duration-300 group overflow-hidden">
                  <CardHeader className="pt-8 px-6">
                    <div className="mb-6 p-4 bg-primary/5 rounded-2xl w-fit group-hover:bg-primary group-hover:text-white transition-all duration-500 transform group-hover:-translate-y-2">
                      {IconMap[service.icon]}
                    </div>
                    <CardTitle className="text-2xl font-bold">{service.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="px-6 pb-8">
                    <p className="text-muted-foreground leading-relaxed mb-6">
                      {service.description}
                    </p>
                    <div className="flex items-center justify-between pt-6 border-t">
                      <span className="text-primary font-bold text-xl">{service.price}</span>
                      <Button variant="ghost" size="sm" className="gap-2 group-hover:text-primary">
                        Details <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Layer 3: Advantages */}
        <section className="pb-12">
          <div className="text-center mb-12 space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-[#081621]">The Smart Clean Advantage</h2>
            <p className="text-muted-foreground">Why we are the preferred choice for 1000+ clients.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {MOCK_FEATURES.map((feature) => (
              <div key={feature.id} className="bg-white flex flex-col items-center text-center p-10 rounded-3xl shadow-sm border border-border/50 group hover:bg-primary/5 transition-colors">
                <div className="mb-8 p-6 bg-primary text-white rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                  {React.cloneElement(IconMap[feature.icon] as React.ReactElement, { className: "text-white", size: 32 })}
                </div>
                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}