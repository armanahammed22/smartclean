
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Star, Package, Truck } from 'lucide-react';
import { Product } from '@/types';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  isDark?: boolean;
}

/**
 * Standard Product Card with hover effects and mobile-first responsive layout.
 */
export function ProductCard({ product, isDark = false }: ProductCardProps) {
  const discountPercent = product.regularPrice && product.regularPrice > product.price
    ? Math.round(((product.regularPrice - product.price) / product.regularPrice) * 100)
    : null;

  const rating = 4.8;
  const reviewCount = Math.floor((parseInt(product.id.slice(0, 2), 16) || 10) % 250);
  const soldCount = Math.floor((parseInt(product.id.slice(0, 3), 16) || 50) % 800);

  return (
    <Link href={`/product/${product.id}`} className="block h-full group active:scale-[0.98] transition-all">
      <div className="flex flex-col h-full bg-white rounded-2xl md:rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden">
        
        {/* Rounded Image Container */}
        <div className="p-1.5">
          <div className="relative aspect-square w-full rounded-xl md:rounded-2xl overflow-hidden bg-gray-50 flex items-center justify-center">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-100 bg-gray-100">
                <Package size={40} />
              </div>
            )}
            
            {/* Custom Admin Badge */}
            {product.badgeText ? (
              <div className="absolute top-2 left-2">
                <div className="bg-primary text-white text-[7px] md:text-[9px] font-black px-2 py-0.5 md:py-1 rounded-full uppercase tracking-tighter shadow-lg">
                  {product.badgeText}
                </div>
              </div>
            ) : (
              <div className="absolute bottom-2 left-2">
                <div className="flex items-center gap-1 bg-[#2E8B57] text-white text-[6px] md:text-[8px] font-black px-2 py-0.5 md:py-1 rounded-full uppercase tracking-tighter shadow-lg">
                  <Truck size={8} fill="white" className="shrink-0 md:w-2.5 md:h-2.5" />
                  FREE
                </div>
              </div>
            )}

            {/* Discount Badge */}
            {discountPercent && (
              <div className="absolute top-2 right-2 bg-[#f85606] text-white text-[7px] md:text-[9px] font-black px-2 py-0.5 rounded-full shadow-md uppercase">
                -{discountPercent}%
              </div>
            )}
          </div>
        </div>

        <div className="px-3 md:px-4 pb-4 space-y-1.5 pt-1">
          <h3 className={cn(
            "text-[10px] md:text-sm font-bold line-clamp-1 leading-tight uppercase tracking-tight transition-colors",
            isDark ? "text-white/90 group-hover:text-white" : "text-gray-800 group-hover:text-primary"
          )}>
            {product.name}
          </h3>
          
          <div className="flex items-center gap-2">
            <p className={cn(
              "text-[12px] md:text-lg font-black tracking-tighter leading-none",
              isDark ? "text-amber-400" : "text-[#f85606]"
            )}>
              <span className="text-[10px] md:text-sm font-bold mr-0.5">৳</span>
              {product.price.toLocaleString()}
            </p>
            {product.regularPrice && product.regularPrice > product.price && (
              <span className="text-[8px] md:text-[10px] text-gray-300 line-through font-bold">
                ৳{product.regularPrice.toLocaleString()}
              </span>
            )}
          </div>
          
          <div className={cn(
            "flex items-center justify-between gap-1 text-[7px] md:text-[10px] font-bold",
            isDark ? "text-white/40" : "text-gray-400"
          )}>
            <div className="flex items-center gap-0.5 text-amber-400">
              <Star size={8} fill="currentColor" className="md:w-2.5 md:h-2.5" />
              <span className={cn(isDark ? "text-white/60" : "text-gray-500")}>{rating}</span>
              <span className="opacity-50">({reviewCount})</span>
            </div>
            <span className="uppercase tracking-widest text-[6px] md:text-[8px]">{soldCount} Sold</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
