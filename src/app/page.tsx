
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

const MAIN_HERO_IMAGES = [
  PlaceHolderImages.find(img => img.id === 'hero-main'),
  PlaceHolderImages.find(img => img.id === 'prod-1'),
  PlaceHolderImages.find(img => img.id === 'prod-4'),
];

const SIDE_BANNERS = [
  PlaceHolderImages.find(img => img.id === 'hero-side-1'),
  PlaceHolderImages.find(img => img.id === 'hero-side-2'),
];

export default function CatalogPage() {
  return (
    <div className="flex flex-col gap-12 pb-24 bg-[#F2F4F8]">
      {/* Hero Section Grid */}
      <section className="container mx-auto px-4 pt-6">
        <div className="grid lg:grid-cols-12 gap-5">
          {/* Main Carousel (approx 2/3 width) */}
          <div className="lg:col-span-9 relative rounded-lg overflow-hidden h-[300px] md:h-[450px]">
            <Carousel className="w-full h-full" opts={{ loop: true }}>
              <CarouselContent className="h-full">
                {MAIN_HERO_IMAGES.map((img, index) => (
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
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-4 bg-black/30 hover:bg-black/50 border-none text-white h-10 w-10" />
              <CarouselNext className="right-4 bg-black/30 hover:bg-black/50 border-none text-white h-10 w-10" />
            </Carousel>
          </div>

          {/* Side Banners */}
          <div className="lg:col-span-3 flex flex-col gap-5">
            {SIDE_BANNERS.map((banner, index) => (
              <div key={index} className="relative flex-1 min-h-[140px] rounded-lg overflow-hidden group">
                <Image
                  src={banner?.imageUrl || ''}
                  alt={banner?.description || 'Promo'}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  data-ai-hint={banner?.imageHint}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 space-y-16">
        {/* Featured Products Layer */}
        <section id="products">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight">Featured Products</h2>
                <p className="text-sm text-muted-foreground">Check & Buy Your Desired Product!</p>
              </div>
              <Button variant="outline" className="rounded-full px-6">View All</Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {/* Using a larger set of products for the grid feel */}
              {[...MOCK_PRODUCTS, ...MOCK_PRODUCTS, ...MOCK_PRODUCTS].slice(0, 10).map((product, idx) => (
                <ProductCard key={`${product.id}-${idx}`} product={product} />
              ))}
            </div>
          </div>
        </section>

        {/* Services Layer */}
        <section>
          <div className="bg-white p-8 rounded-lg shadow-sm">
            <div className="text-center mb-10 space-y-2">
              <h2 className="text-3xl font-bold tracking-tight">Professional Services</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                End-to-end workspace solutions tailored to your unique requirements.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {MOCK_SERVICES.map((service) => (
                <Card key={service.id} className="border-none shadow-md hover:shadow-lg transition-shadow group overflow-hidden">
                  <CardHeader className="pt-8 px-6">
                    <div className="mb-6 p-4 bg-primary/5 rounded-full w-fit group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-500">
                      {IconMap[service.icon]}
                    </div>
                    <CardTitle className="text-xl font-bold">{service.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="px-6 pb-8">
                    <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                      {service.description}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t">
                      <span className="text-primary font-bold text-lg">{service.price}</span>
                      <Button variant="ghost" size="sm" className="gap-2">
                        Details <ArrowRight size={14} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Advantages Layer */}
        <section className="pb-12">
          <div className="text-center mb-10 space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">The QuickOrder Advantage</h2>
            <p className="text-muted-foreground">Why shopping with us is the best choice.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {MOCK_FEATURES.map((feature) => (
              <div key={feature.id} className="bg-white flex flex-col items-center text-center p-8 rounded-xl shadow-sm border group">
                <div className="mb-6 p-5 bg-primary text-primary-foreground rounded-full shadow-lg group-hover:rotate-12 transition-transform">
                  {React.cloneElement(IconMap[feature.icon] as React.ReactElement, { className: "text-white" })}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
