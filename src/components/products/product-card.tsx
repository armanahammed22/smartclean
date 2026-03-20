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
      <Card className="h-full border border-[#E5E7EB] shadow-sm hover:shadow-xl transition-all duration-300 rounded-xl overflow-hidden flex flex-col bg-[#FFFFFF]">
        {/* Image Section - 1:1 Aspect Ratio */}
        <div className="relative aspect-square w-full bg-white overflow-hidden border-b border-[#F3F4F6]">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-contain p-2 md:p-4 transition-transform duration-500 group-hover:scale-110"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-200">
              <Package size={32} />
            </div>
          )}
          
          {/* Discount Badge */}
          {discountPercent && (
            <div className="absolute top-0 right-0 bg-[#EF4444] text-white text-[9px] md:text-[11px] font-black px-2 py-0.5 rounded-bl-lg shadow-sm z-10 uppercase tracking-tighter">
              -{discountPercent}%
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-2.5 md:p-4 flex flex-col flex-1">
          {/* Product Title - Max 2 Lines */}
          <h3 className="text-[11px] md:text-sm font-semibold text-[#111827] line-clamp-2 leading-snug mb-2 min-h-[2.2rem] md:min-h-[2.5rem] group-hover:text-[#22C55E] transition-colors">
            {product.name}
          </h3>
          
          <div className="mt-auto space-y-1">
            {/* Price Display */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[#22C55E] font-extrabold text-sm md:text-xl leading-none">
                ৳{product.price.toLocaleString()}
              </span>
            </div>
            
            {/* Regular Price */}
            {product.regularPrice && product.regularPrice > product.price && (
              <div className="flex items-center gap-1">
                <span className="text-[9px] md:text-xs text-[#6B7280] line-through opacity-70">
                  ৳{product.regularPrice.toLocaleString()}
                </span>
              </div>
            )}

            {/* Rating & Metadata */}
            <div className="flex items-center gap-1 pt-1">
              <div className="flex text-[#F59E0B]">
                <Star size={10} fill="currentColor" strokeWidth={0} />
                <Star size={10} fill="currentColor" strokeWidth={0} />
                <Star size={10} fill="currentColor" strokeWidth={0} />
                <Star size={10} fill="currentColor" strokeWidth={0} />
                <Star size={10} fill="currentColor" strokeWidth={0} className="opacity-20" />
              </div>
              <span className="text-[8px] md:text-[10px] text-[#6B7280] font-bold">(12)</span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
