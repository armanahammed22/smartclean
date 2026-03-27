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
 * Standard Product Card with increased size and clear information.
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
      <div className="flex flex-col h-full bg-white rounded-2xl md:rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden">
        
        {/* Rounded Image Container */}
        <div className="p-2 md:p-3">
          <div className="relative aspect-square w-full rounded-2xl md:rounded-3xl overflow-hidden bg-gray-50 flex items-center justify-center">
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
              <div className="absolute top-3 left-3">
                <div className="bg-primary text-white text-[9px] md:text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-tighter shadow-lg">
                  {product.badgeText}
                </div>
              </div>
            ) : (
              <div className="absolute bottom-3 left-3">
                <div className="flex items-center gap-1 bg-[#2E8B57] text-white text-[8px] md:text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-tighter shadow-lg">
                  <Truck size={10} fill="white" className="shrink-0 md:w-3 md:h-3" />
                  FREE
                </div>
              </div>
            )}

            {/* Discount Badge */}
            {discountPercent && (
              <div className="absolute top-3 right-3 bg-[#f85606] text-white text-[9px] md:text-[11px] font-black px-2 py-1 rounded-full shadow-md uppercase">
                -{discountPercent}%
              </div>
            )}
          </div>
        </div>

        <div className="px-4 md:px-5 pb-6 space-y-2 pt-1">
          <h3 className={cn(
            "text-sm md:text-base font-bold line-clamp-1 leading-tight uppercase tracking-tight transition-colors",
            isDark ? "text-white/90 group-hover:text-white" : "text-gray-800 group-hover:text-primary"
          )}>
            {product.name}
          </h3>
          
          <div className="flex items-center gap-3">
            <p className={cn(
              "text-lg md:text-3xl font-black tracking-tighter leading-none",
              isDark ? "text-amber-400" : "text-[#f85606]"
            )}>
              <span className="text-[10px] md:text-sm font-bold mr-0.5">৳</span>
              {product.price.toLocaleString()}
            </p>
            {product.regularPrice && product.regularPrice > product.price && (
              <span className="text-[10px] md:text-xs text-gray-300 line-through font-bold">
                ৳{product.regularPrice.toLocaleString()}
              </span>
            )}
          </div>
          
          <div className={cn(
            "flex items-center justify-between gap-1 text-xs md:text-sm font-bold",
            isDark ? "text-white/40" : "text-gray-400"
          )}>
            <div className="flex items-center gap-1.5 text-amber-400">
              <Star size={16} fill="currentColor" />
              <span className={cn(isDark ? "text-white/60" : "text-gray-600")}>{rating}</span>
              <span className="opacity-50">({reviewCount})</span>
            </div>
            <span className="uppercase tracking-widest text-[9px] md:text-[11px] font-black">{soldCount} Sold</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
