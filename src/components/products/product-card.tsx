"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Star, Package, Truck } from 'lucide-react';
import { Product } from '@/types';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  // Calculate discount percentage if regular price exists
  const discountPercent = product.regularPrice && product.regularPrice > product.price
    ? Math.round(((product.regularPrice - product.price) / product.regularPrice) * 100)
    : null;

  // Mock data for Rating and Sales (since these aren't in the base schema)
  // In a real app, these would come from the product object
  const rating = 4.7;
  const reviewCount = Math.floor((parseInt(product.id.slice(0, 2), 16) || 10) % 300);
  const soldCount = Math.floor((parseInt(product.id.slice(0, 3), 16) || 50) % 1000);

  return (
    <Link href={`/product/${product.id}`} className="block h-full app-button">
      <div className="flex flex-col h-full bg-transparent group">
        {/* 🖼️ Image Container */}
        <div className="relative aspect-square w-full rounded-2xl md:rounded-[1.5rem] overflow-hidden bg-white shadow-sm border border-gray-100 mb-3">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-100 bg-gray-50">
              <Package size={40} />
            </div>
          )}
          
          {/* 🚚 Free Delivery Badge (Overlay) */}
          <div className="absolute bottom-2 left-2">
            <div className="flex items-center gap-1 bg-[#2E8B57] text-white text-[7px] md:text-[8px] font-black px-2 py-1 rounded-md uppercase tracking-tighter shadow-lg">
              <Truck size={10} fill="white" className="shrink-0" />
              FREE DELIVERY
            </div>
          </div>
        </div>

        {/* 📝 Content Section */}
        <div className="px-1 space-y-1.5">
          {/* Title */}
          <h3 className="text-sm font-medium text-gray-800 line-clamp-1 leading-tight uppercase tracking-tight">
            {product.name}
          </h3>
          
          {/* Price & Discount */}
          <div className="flex items-center gap-2">
            <p className="text-lg font-black text-[#f85606] tracking-tighter">
              <span className="text-base font-bold mr-0.5">৳</span>
              {product.price.toLocaleString()}
            </p>
            {discountPercent && (
              <span className="text-[10px] font-bold text-[#f85606] bg-[#fff1eb] px-1.5 py-0.5 rounded-sm">
                -{discountPercent}%
              </span>
            )}
          </div>
          
          {/* Rating & Sold Count */}
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold">
            <div className="flex items-center gap-0.5 text-amber-400">
              <Star size={12} fill="currentColor" />
              <span className="text-gray-500">{rating}</span>
            </div>
            <span>({reviewCount})</span>
            <span className="text-gray-200">|</span>
            <span>{soldCount >= 1000 ? (soldCount/1000).toFixed(1) + 'k' : soldCount} Sold</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
