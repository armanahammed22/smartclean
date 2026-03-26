
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { Product } from '@/types';
import { cn } from '@/lib/utils';

interface FlashSaleCardProps {
  product: Product;
}

/**
 * Highly optimized Flash Sale card for horizontal scroll layout.
 * Features rounded images, discount badges, and smooth typography.
 */
export function FlashSaleCard({ product }: FlashSaleCardProps) {
  const discountPercent = product.regularPrice && product.regularPrice > product.price
    ? Math.round(((product.regularPrice - product.price) / product.regularPrice) * 100)
    : null;

  return (
    <Link href={`/product/${product.id}`} className="block h-full group active:scale-[0.97] transition-all">
      <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] overflow-hidden flex flex-col h-full shadow-md border border-gray-100 group-hover:shadow-xl transition-all hover:-translate-y-1">
        
        {/* Image Container with Discount Badge */}
        <div className="p-2">
          <div className="relative aspect-square w-full rounded-2xl bg-gray-50 flex items-center justify-center overflow-hidden">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-200">
                <Star size={24} />
              </div>
            )}
            
            {/* Discount Badge */}
            {discountPercent && (
              <div className="absolute top-2 left-2 bg-[#f85606] text-white text-[8px] md:text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg z-10 uppercase tracking-tighter">
                -{discountPercent}%
              </div>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="p-3 md:p-4 flex flex-col flex-1 gap-1.5 pt-0">
          <h3 className="text-[10px] md:text-[13px] font-bold text-gray-800 uppercase tracking-tight line-clamp-1 leading-tight group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          
          <div className="mt-auto space-y-1">
            <div className="flex flex-col">
              <p className="text-[12px] md:text-base font-black text-primary tracking-tighter leading-none">
                ৳{product.price.toLocaleString()}
              </p>
              {product.regularPrice && product.regularPrice > product.price && (
                <span className="text-[8px] md:text-[10px] font-bold text-gray-300 line-through mt-0.5">
                  ৳{product.regularPrice.toLocaleString()}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-1 text-amber-400">
              <Star size={8} fill="currentColor" className="md:w-3 md:h-3" />
              <span className="text-[8px] md:text-[10px] font-black text-gray-400">4.8</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
