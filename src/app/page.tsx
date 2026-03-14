
"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ProductCard } from '@/components/products/product-card';
import { Product, Service, Feature } from '@/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Layout, Wrench, Activity, Truck, ShieldCheck, Headphones, ArrowRight, Star } from 'lucide-react';
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
    name: 'Ergonomic Office Chair',
    price: 299.99,
    category: 'Furniture',
    shortDescription: 'Maximum comfort for long work days with breathable mesh.',
    description: 'The Pro Series Ergonomic Chair offers 4D adjustable armrests and dynamic lumbar support.',
    imageUrl: PlaceHolderImages.find(img => img.id === 'prod-1')?.imageUrl || '',
  },
  {
    id: '2',
    name: 'Mechanical Keyboard',
    price: 159.50,
    category: 'Peripherals',
    shortDescription: 'Tactile typing experience with RGB lighting.',
    description: 'Experience precision with every keystroke. Durable aluminum top plate.',
    imageUrl: PlaceHolderImages.find(img => img.id === 'prod-2')?.imageUrl || '',
  },
  {
    id: '3',
    name: 'Noise-Cancelling Headphones',
    price: 349.00,
    category: 'Audio',
    shortDescription: 'Immersive sound with industry-leading cancellation.',
    description: 'Silence the world around you. 30 hours of battery life.',
    imageUrl: PlaceHolderImages.find(img => img.id === 'prod-3')?.imageUrl || '',
  }
];

const MOCK_SERVICES: Service[] = [
  {
    id: 's1',
    title: 'Workspace Design',
    description: 'Custom ergonomic layout planning for your specific home or corporate office space.',
    icon: 'Layout',
    price: 'From $199'
  },
  {
    id: 's2',
    title: 'Installation Support',
    description: 'Professional assembly and cable management for all purchased furniture and tech.',
    icon: 'Wrench',
    price: 'From $99'
  },
  {
    id: 's3',
    title: 'Posture Assessment',
    description: '1-on-1 ergonomic consultation with a specialist to optimize your desk health.',
    icon: 'Activity',
    price: 'From $75'
  }
];

const MOCK_FEATURES: Feature[] = [
  {
    id: 'f1',
    title: 'Express Delivery',
    description: 'Get your orders delivered within 48 hours for local metropolitan areas.',
    icon: 'Truck'
  },
  {
    id: 'f2',
    title: '2-Year Warranty',
    description: 'Comprehensive protection on all premium furniture and electronic items.',
    icon: 'ShieldCheck'
  },
  {
    id: 'f3',
    title: '24/7 Expert Support',
    description: 'Our dedicated team is always available to help with setup and troubleshooting.',
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
  PlaceHolderImages.find(img => img.id === 'prod-1'),
  PlaceHolderImages.find(img => img.id === 'prod-4'),
];

export default function CatalogPage() {
  return (
    <div className="flex flex-col gap-24 pb-24">
      {/* Custom Hero Section with Multiple Images */}
      <section className="relative bg-muted/20 border-b overflow-hidden">
        <div className="container mx-auto px-4 py-16 md:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 z-10 animate-in fade-in slide-in-from-left-8 duration-700">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold border border-primary/20">
              <Star size={14} className="fill-primary" />
              <span>Premium Workspace Solutions</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold font-headline tracking-tight text-foreground leading-[1.1]">
              Elevate Your <span className="text-primary">Workflow</span> Performance
            </h1>
            <p className="text-xl text-muted-foreground max-w-lg leading-relaxed">
              Discover a curated collection of ergonomic essentials and professional services designed to optimize your productivity and well-being.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="gap-2 h-14 px-8 text-lg shadow-lg shadow-primary/20" asChild>
                <Link href="#products">
                  Shop Catalog
                  <ArrowRight size={20} />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="h-14 px-8 text-lg bg-background/50 backdrop-blur-sm">
                Our Services
              </Button>
            </div>
          </div>
          
          <div className="relative h-[400px] md:h-[500px] w-full rounded-3xl overflow-hidden shadow-2xl border-4 border-background animate-in fade-in slide-in-from-right-8 duration-700">
            <Carousel className="w-full h-full" opts={{ loop: true }}>
              <CarouselContent className="h-full">
                {HERO_IMAGES.map((img, index) => (
                  <CarouselItem key={index} className="h-full pl-0">
                    <div className="relative h-full w-full">
                      <Image
                        src={img?.imageUrl || ''}
                        alt={img?.description || 'Hero image'}
                        fill
                        className="object-cover"
                        priority={index === 0}
                        data-ai-hint={img?.imageHint}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                      <div className="absolute bottom-6 left-6 text-white">
                        <p className="text-sm font-medium opacity-80 uppercase tracking-widest">{img?.description}</p>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="absolute bottom-6 right-6 flex gap-2 z-20">
                <CarouselPrevious className="relative translate-x-0 left-0 h-12 w-12 bg-white/20 hover:bg-white/40 border-none text-white backdrop-blur-md" />
                <CarouselNext className="relative translate-x-0 right-0 h-12 w-12 bg-white/20 hover:bg-white/40 border-none text-white backdrop-blur-md" />
              </div>
            </Carousel>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 space-y-32">
        {/* Layer 1: Featured Products Grid */}
        <section id="products">
          <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-4">
            <div className="space-y-1">
              <h2 className="text-3xl font-bold font-headline tracking-tight">Featured Products</h2>
              <p className="text-muted-foreground text-lg">Premium gear for modern professionals.</p>
            </div>
            <div className="h-px flex-1 bg-border mx-8 hidden md:block opacity-50"></div>
            <Button variant="outline" className="rounded-full px-6">View All Products</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {MOCK_PRODUCTS.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* Layer 2: Services Grid */}
        <section className="bg-primary/5 -mx-4 px-4 py-24 rounded-[4rem] border-y border-primary/10">
          <div className="container mx-auto">
            <div className="flex flex-col items-center text-center mb-16 space-y-4">
              <div className="p-3 bg-primary/10 rounded-2xl w-fit">
                <Wrench className="text-primary" size={32} />
              </div>
              <h2 className="text-4xl font-bold font-headline tracking-tight">Professional Services</h2>
              <p className="text-muted-foreground max-w-2xl text-lg leading-relaxed">
                We don't just sell products; we provide end-to-end workspace solutions tailored to your unique requirements.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {MOCK_SERVICES.map((service) => (
                <Card key={service.id} className="border-none shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-background group">
                  <CardHeader className="pt-10 px-8">
                    <div className="mb-8 p-5 bg-primary/10 rounded-2xl w-fit group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-500">
                      {IconMap[service.icon]}
                    </div>
                    <CardTitle className="text-2xl font-bold">{service.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-8 px-8 pb-10">
                    <p className="text-muted-foreground text-base leading-relaxed h-20 overflow-hidden line-clamp-3">
                      {service.description}
                    </p>
                    <div className="flex items-center justify-between pt-6 border-t border-border/50">
                      <span className="text-primary font-bold text-2xl tracking-tight">{service.price}</span>
                      <Button variant="ghost" size="sm" className="gap-2 font-semibold">
                        Details <ArrowRight size={16} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Layer 3: Why Choose Us Grid */}
        <section className="pb-12">
          <div className="flex flex-col items-center text-center mb-16 space-y-4">
            <h2 className="text-4xl font-bold font-headline tracking-tight">The QuickOrder Advantage</h2>
            <p className="text-muted-foreground text-lg max-w-xl leading-relaxed">Experience a seamless transition to a better working environment with our core values.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {MOCK_FEATURES.map((feature) => (
              <div key={feature.id} className="flex flex-col items-start p-10 bg-card rounded-[2.5rem] border border-border/50 shadow-sm hover:shadow-xl transition-all duration-300 group">
                <div className="mb-8 p-5 bg-primary text-primary-foreground rounded-[1.5rem] shadow-xl shadow-primary/20 group-hover:scale-110 transition-transform duration-300">
                  {React.cloneElement(IconMap[feature.icon] as React.ReactElement, { className: "text-white" })}
                </div>
                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                <p className="text-muted-foreground text-base leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
