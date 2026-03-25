
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { Product } from '@/types';
import { cn } from '@/lib/utils';

interface FlashSaleCardProps {
  product: Product;
}

export function FlashSaleCard({ product }: FlashSaleCardProps) {
  const discountPercent = product.regularPrice && product.regularPrice > product.price
    ? Math.round(((product.regularPrice - product.price) / product.regularPrice) * 100)
    : null;

  return (
    <Link href={`/product/${product.id}`} className="block h-full group active:scale-95 transition-transform">
      <div className="bg-white rounded-2xl md:rounded-[1.5rem] overflow-hidden flex flex-col h-full shadow-sm border border-gray-100">
        {/* Image & Discount Badge */}
        <div className="relative aspect-square w-full bg-gray-50 flex items-center justify-center overflow-hidden">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110 p-2"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-200">
              <Star size={40} />
            </div>
          )}
          
          {discountPercent && (
            <div className="absolute top-2 left-2 bg-[#f85606] text-white text-[8px] md:text-[10px] font-black px-1.5 py-0.5 rounded-md shadow-lg">
              -{discountPercent}%
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="p-3 flex flex-col flex-1 gap-1.5">
          <h3 className="text-[10px] md:text-xs font-bold text-gray-800 uppercase tracking-tight line-clamp-2 min-h-[2.5em] leading-tight">
            {product.name}
          </h3>
          
          <div className="space-y-0.5">
            <p className="text-sm md:text-base font-black text-primary tracking-tight">
              ৳{product.price.toLocaleString()}
            </p>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5 text-[#faca51]">
                <Star size={10} fill="currentColor" />
                <span className="text-[9px] font-black text-gray-500">4.8</span>
              </div>
              {product.regularPrice && product.regularPrice > product.price && (
                <span className="text-[9px] font-bold text-gray-300 line-through">
                  ৳{product.regularPrice.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
