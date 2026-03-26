
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

export function ProductCard({ product, isDark = false }: ProductCardProps) {
  const discountPercent = product.regularPrice && product.regularPrice > product.price
    ? Math.round(((product.regularPrice - product.price) / product.regularPrice) * 100)
    : null;

  const rating = 4.8;
  const reviewCount = Math.floor((parseInt(product.id.slice(0, 2), 16) || 10) % 250);
  const soldCount = Math.floor((parseInt(product.id.slice(0, 3), 16) || 50) % 800);

  return (
    <Link href={`/product/${product.id}`} className="block h-full app-button">
      <div className="flex flex-col h-full bg-transparent group">
        <div className="relative aspect-square w-full rounded-[1.2rem] md:rounded-[1.5rem] overflow-hidden bg-white shadow-sm border border-gray-100 mb-2 md:mb-3">
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
          
          <div className="absolute bottom-1.5 left-1.5 md:bottom-2 md:left-2">
            <div className="flex items-center gap-1 bg-[#2E8B57] text-white text-[6px] md:text-[8px] font-black px-1.5 py-0.5 md:px-2 md:py-1 rounded-md uppercase tracking-tighter shadow-lg">
              <Truck size={8} fill="white" className="shrink-0 md:w-2.5 md:h-2.5" />
              FREE
            </div>
          </div>
        </div>

        <div className="px-0.5 space-y-1">
          <h3 className={cn(
            "text-[9px] md:text-sm font-bold line-clamp-1 leading-tight uppercase tracking-tight transition-colors",
            isDark ? "text-white/90 group-hover:text-white" : "text-gray-800 group-hover:text-primary"
          )}>
            {product.name}
          </h3>
          
          <div className="flex items-center gap-1 md:gap-2">
            <p className={cn(
              "text-xs md:text-lg font-black tracking-tighter",
              isDark ? "text-amber-400" : "text-[#f85606]"
            )}>
              <span className="text-[10px] md:text-sm font-bold mr-0.5">৳</span>
              {product.price.toLocaleString()}
            </p>
            {discountPercent && (
              <span className="text-[7px] md:text-[10px] font-bold text-[#f85606] bg-[#fff1eb] px-1 py-0.5 rounded-sm">
                -{discountPercent}%
              </span>
            )}
          </div>
          
          <div className={cn(
            "flex items-center gap-1 text-[7px] md:text-[10px] font-bold",
            isDark ? "text-white/40" : "text-gray-400"
          )}>
            <div className="flex items-center gap-0.5 text-amber-400">
              <Star size={8} fill="currentColor" className="md:w-2.5 md:h-2.5" />
              <span className={cn(isDark ? "text-white/60" : "text-gray-500")}>{rating}</span>
            </div>
            <span className="hidden sm:inline">({reviewCount})</span>
            <span className="opacity-20 hidden sm:inline">|</span>
            <span className="truncate">{soldCount} Sold</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
