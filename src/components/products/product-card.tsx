
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Star, Package } from 'lucide-react';
import { Product } from '@/types';
import { Card } from '@/components/ui/card';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  // Calculate discount percentage if regular price exists and is higher
  const discountPercent = product.regularPrice && product.regularPrice > product.price
    ? Math.round(((product.regularPrice - product.price) / product.regularPrice) * 100)
    : null;

  return (
    <Link href={`/product/${product.id}`} className="block h-full group">
      <Card className="h-full border border-gray-100 hover:border-primary/20 shadow-sm hover:shadow-md transition-all duration-300 rounded-lg overflow-hidden flex flex-col bg-white">
        {/* Image Section - 1:1 Aspect Ratio */}
        <div className="relative aspect-square w-full bg-white overflow-hidden">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-contain p-2 transition-transform duration-500 group-hover:scale-105"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-200">
              <Package size={40} />
            </div>
          )}
          
          {/* Discount Badge */}
          {discountPercent && (
            <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-black px-2 py-0.5 rounded-bl-lg shadow-sm z-10">
              -{discountPercent}%
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-2 md:p-3 flex flex-col flex-1">
          {/* Product Title - Max 2 Lines */}
          <h3 className="text-[12px] md:text-sm font-medium text-gray-800 line-clamp-2 leading-tight mb-2 min-h-[2.5rem] group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          
          <div className="mt-auto space-y-1">
            {/* Price Display */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-primary font-black text-sm md:text-lg leading-none">
                ৳{product.price.toLocaleString()}
              </span>
            </div>
            
            {/* Regular Price (Strikethrough) */}
            {product.regularPrice && product.regularPrice > product.price && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] md:text-xs text-gray-400 line-through">
                  ৳{product.regularPrice.toLocaleString()}
                </span>
              </div>
            )}

            {/* Rating Summary (Static Placeholder) */}
            <div className="flex items-center gap-1 pt-1">
              <div className="flex text-amber-400">
                <Star size={10} fill="currentColor" strokeWidth={0} />
                <Star size={10} fill="currentColor" strokeWidth={0} />
                <Star size={10} fill="currentColor" strokeWidth={0} />
                <Star size={10} fill="currentColor" strokeWidth={0} />
                <Star size={10} fill="currentColor" strokeWidth={0} className="opacity-30" />
              </div>
              <span className="text-[9px] text-gray-400 font-medium">(12)</span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
