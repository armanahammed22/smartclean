"use client";

import React from 'react';
import { ProductCard } from '@/components/products/product-card';
import { Product } from '@/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Ergonomic Office Chair',
    price: 299.99,
    category: 'Furniture',
    shortDescription: 'Maximum comfort for long work days with breathable mesh.',
    description: 'The Pro Series Ergonomic Chair offers 4D adjustable armrests, a dynamic lumbar support system, and a breathable mesh back that keeps you cool. Designed for high performance and durability, this chair is the perfect companion for your home office.',
    imageUrl: PlaceHolderImages.find(img => img.id === 'prod-1')?.imageUrl || '',
  },
  {
    id: '2',
    name: 'Mechanical Keyboard',
    price: 159.50,
    category: 'Peripherals',
    shortDescription: 'Tactile typing experience with RGB lighting and aluminum frame.',
    description: 'Experience precision with every keystroke. This mechanical keyboard features hot-swappable switches, a solid aluminum top plate, and fully customizable RGB backlighting via our software suite. Durable and stylish.',
    imageUrl: PlaceHolderImages.find(img => img.id === 'prod-2')?.imageUrl || '',
  },
  {
    id: '3',
    name: 'Noise-Cancelling Headphones',
    price: 349.00,
    category: 'Audio',
    shortDescription: 'Immersive sound with industry-leading active noise cancellation.',
    description: 'Silence the world around you. Our flagship headphones deliver crisp audio with deep bass and clear highs. With 30 hours of battery life and rapid charging, you can listen all day in ultimate comfort.',
    imageUrl: PlaceHolderImages.find(img => img.id === 'prod-3')?.imageUrl || '',
  },
  {
    id: '4',
    name: 'Dual Monitor Arm',
    price: 89.99,
    category: 'Accessories',
    shortDescription: 'Heavy-duty steel monitor mount for desk space optimization.',
    description: 'Reclaim your desk space. This dual monitor mount supports screens up to 27 inches each. Features full motion adjustment including height, tilt, swivel, and rotation for the perfect viewing angle.',
    imageUrl: PlaceHolderImages.find(img => img.id === 'prod-4')?.imageUrl || '',
  },
  {
    id: '5',
    name: 'Leather Desk Organizer',
    price: 45.00,
    category: 'Office',
    shortDescription: 'Elegant storage solution for pens, phones, and stationery.',
    description: 'Add a touch of class to your workspace. Handcrafted from premium vegan leather, this organizer features multiple compartments to keep your essentials tidy and within reach.',
    imageUrl: PlaceHolderImages.find(img => img.id === 'prod-5')?.imageUrl || '',
  },
  {
    id: '6',
    name: 'Smart LED Desk Lamp',
    price: 75.25,
    category: 'Lighting',
    shortDescription: 'Adjustable brightness and color temperature with USB charging.',
    description: 'The perfect light for any task. Adjust between five color modes and seven brightness levels. Includes a built-in USB port for convenient device charging and a sleep timer function.',
    imageUrl: PlaceHolderImages.find(img => img.id === 'prod-6')?.imageUrl || '',
  }
];

export default function CatalogPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col items-center mb-16 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold font-headline mb-4 text-primary tracking-tight">
          Enhance Your Workspace
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl">
          Curated premium office essentials designed for comfort, productivity, and modern aesthetics.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {MOCK_PRODUCTS.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}