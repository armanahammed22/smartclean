"use client";

import React from 'react';
import { ProductCard } from '@/components/products/product-card';
import { Product, Service, Feature } from '@/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Layout, Wrench, Activity, Truck, ShieldCheck, Headphones } from 'lucide-react';

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

const IconMap = {
  Layout: <Layout className="text-primary" size={32} />,
  Wrench: <Wrench className="text-primary" size={32} />,
  Activity: <Activity className="text-primary" size={32} />,
  Truck: <Truck className="text-primary" size={32} />,
  ShieldCheck: <ShieldCheck className="text-primary" size={32} />,
  Headphones: <Headphones className="text-primary" size={32} />,
};

export default function CatalogPage() {
  return (
    <div className="container mx-auto px-4 py-12 space-y-24">
      {/* Hero Layer */}
      <section className="text-center max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-extrabold font-headline mb-4 text-primary tracking-tight">
          Modern Office Excellence
        </h1>
        <p className="text-muted-foreground text-lg">
          Elevate your productivity with our curated collection of workspace essentials and professional services.
        </p>
      </section>

      {/* Layer 1: Featured Products Grid */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold font-headline">Featured Products</h2>
          <div className="h-px flex-1 bg-border mx-4 hidden md:block"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {MOCK_PRODUCTS.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Layer 2: Services Grid */}
      <section className="bg-muted/30 -mx-4 px-4 py-16 rounded-3xl">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold font-headline">Our Services</h2>
            <div className="h-px flex-1 bg-border mx-4 hidden md:block"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {MOCK_SERVICES.map((service) => (
              <Card key={service.id} className="border-none shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="mb-4">{IconMap[service.icon]}</div>
                  <CardTitle>{service.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{service.description}</p>
                  <p className="text-primary font-bold">{service.price}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Layer 3: Why Choose Us Grid */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold font-headline">Why Choose QuickOrder</h2>
          <div className="h-px flex-1 bg-border mx-4 hidden md:block"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {MOCK_FEATURES.map((feature) => (
            <div key={feature.id} className="flex flex-col items-center text-center p-6 bg-card rounded-xl border border-border/50">
              <div className="mb-4 p-3 bg-primary/5 rounded-full">{IconMap[feature.icon]}</div>
              <h3 className="font-bold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
