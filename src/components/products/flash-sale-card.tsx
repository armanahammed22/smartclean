
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
 */
export function FlashSaleCard({ product }: FlashSaleCardProps) {
  const discountPercent = product.regularPrice && product.regularPrice > product.price
    ? Math.round(((product.regularPrice - product.price) / product.regularPrice) * 100)
    : null;

  return (
    <Link href={`/product/${product.id}`} className="block h-full group active:scale-[0.97] transition-all">
      <div className="bg-white rounded-xl overflow-hidden flex flex-col h-full shadow-sm border border-gray-100/50 group-hover:shadow-md transition-shadow">
        {/* Image & Discount Badge */}
        <div className="relative aspect-square w-full bg-gray-50 flex items-center justify-center overflow-hidden">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110 p-1"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-200">
              <Star size={20} />
            </div>
          )}
          
          {discountPercent && (
            <div className="absolute top-1 left-1 bg-[#f85606] text-white text-[7px] md:text-[9px] font-black px-1 py-0.5 rounded-sm shadow-md z-10 uppercase">
              -{discountPercent}%
            </div>
          )}
        </div>

        {/* Info Section - Optimized for narrow width */}
        <div className="p-1.5 md:p-2.5 flex flex-col flex-1 gap-1">
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
