
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
 * Highly optimized Flash Sale card for narrow grid displays (3 items on mobile)
 * Features rounded images and modern typography
 */
export function FlashSaleCard({ product }: FlashSaleCardProps) {
  const discountPercent = product.regularPrice && product.regularPrice > product.price
    ? Math.round(((product.regularPrice - product.price) / product.regularPrice) * 100)
    : null;

  return (
    <Link href={`/product/${product.id}`} className="block h-full group active:scale-[0.97] transition-all">
      <div className="bg-white rounded-2xl overflow-hidden flex flex-col h-full shadow-sm border border-gray-100 group-hover:shadow-md transition-shadow">
        
        {/* Rounded Image Container */}
        <div className="p-1.5">
          <div className="relative aspect-square w-full rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden">
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
                <Star size={20} />
              </div>
            )}
            
            {/* Discount Badge positioned over rounded image */}
            {discountPercent && (
              <div className="absolute top-1.5 left-1.5 bg-[#f85606] text-white text-[7px] md:text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-md z-10 uppercase tracking-tighter">
                -{discountPercent}%
              </div>
            )}
          </div>
        </div>

        {/* Info Section - Optimized for narrow width */}
        <div className="p-2 md:p-3 flex flex-col flex-1 gap-1 pt-0">
          <h3 className="text-[9px] md:text-[11px] font-bold text-gray-800 uppercase tracking-tighter line-clamp-1 leading-tight group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          
          <div className="mt-auto space-y-0.5">
            <p className="text-[11px] md:text-sm font-black text-primary tracking-tighter leading-none">
              ৳{product.price.toLocaleString()}
            </p>
            
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-0.5 text-[#faca51] shrink-0">
                <Star size={7} fill="currentColor" className="md:w-2.5 md:h-2.5" />
                <span className="text-[7px] md:text-[9px] font-black text-gray-400">4.8</span>
              </div>
              {product.regularPrice && product.regularPrice > product.price && (
                <span className="text-[7px] md:text-[9px] font-bold text-gray-300 line-through truncate">
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
