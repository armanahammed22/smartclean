
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
 * Flash Sale card with refined typography for better balance on tablet/desktop.
 */
export function FlashSaleCard({ product }: FlashSaleCardProps) {
  const discountPercent = product.regularPrice && product.regularPrice > product.price
    ? Math.round(((product.regularPrice - product.price) / product.regularPrice) * 100)
    : null;

  const rating = 4.8;
  const soldCount = Math.floor((parseInt(product.id.slice(0, 3), 16) || 50) % 800);

  return (
    <Link href={`/product/${product.id}`} className="block h-full group active:scale-[0.97] transition-all">
      <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] overflow-hidden flex flex-col h-full shadow-md border border-gray-100 group-hover:shadow-xl transition-all hover:-translate-y-1">
        
        {/* Image Container with Discount Badge */}
        <div className="p-2 md:p-3">
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
              <div className="absolute top-2 left-2 bg-[#f85606] text-white text-[10px] md:text-xs font-black px-2.5 py-1 rounded-full shadow-lg z-10 uppercase tracking-tighter">
                -{discountPercent}%
              </div>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="p-4 md:p-5 flex flex-col flex-1 gap-2 pt-0">
          <h3 className="text-xs md:text-sm font-bold text-gray-800 uppercase tracking-tight line-clamp-1 leading-tight group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          
          <div className="mt-auto space-y-2">
            <div className="flex flex-col">
              <p className="text-lg md:text-2xl font-black text-primary tracking-tighter leading-none">
                ৳{product.price.toLocaleString()}
              </p>
              {product.regularPrice && product.regularPrice > product.price && (
                <span className="text-[10px] md:text-xs font-bold text-gray-300 line-through mt-1">
                  ৳{product.regularPrice.toLocaleString()}
                </span>
              )}
            </div>
            
            <div className="flex items-center justify-between text-[10px] md:text-xs font-bold">
              <div className="flex items-center gap-1 text-amber-400">
                <Star size={14} fill="currentColor" />
                <span className="font-black text-gray-600">{rating}</span>
              </div>
              <span className="uppercase tracking-widest text-[9px] font-black text-gray-400">{soldCount} Sold</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
