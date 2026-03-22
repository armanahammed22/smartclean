
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
  const discountPercent = product.regularPrice && product.regularPrice > product.price
    ? Math.round(((product.regularPrice - product.price) / product.regularPrice) * 100)
    : null;

  return (
    <Link href={`/product/${product.id}`} className="block h-full group">
      <Card className="h-full border-none shadow-sm hover:shadow-md transition-all duration-300 rounded-lg overflow-hidden flex flex-col bg-[#FFFFFF]">
        {/* Image Section */}
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
            <div className="w-full h-full flex items-center justify-center text-gray-100 bg-gray-50">
              <Package size={24} />
            </div>
          )}
          
          {/* Discount Badge */}
          {discountPercent && (
            <div className="absolute top-0 left-0 bg-[#f85606] text-white text-[9px] font-black px-1.5 py-0.5 rounded-br-md z-10 uppercase tracking-tighter">
              -{discountPercent}%
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-2 flex flex-col flex-1 gap-1">
          <h3 className="text-[11px] font-medium text-[#212121] line-clamp-2 leading-tight min-h-[2.2rem]">
            {product.name}
          </h3>
          
          <div className="mt-auto space-y-0.5">
            <p className="text-[#f85606] font-bold text-sm">
              ৳{product.price.toLocaleString()}
            </p>
            
            {product.regularPrice && product.regularPrice > product.price && (
              <p className="text-[9px] text-gray-400 line-through">
                ৳{product.regularPrice.toLocaleString()}
              </p>
            )}

            <div className="flex items-center gap-1 pt-0.5">
              <div className="flex text-[#faca51]">
                {[1,2,3,4,5].map(i => <Star key={i} size={8} fill="currentColor" strokeWidth={0} />)}
              </div>
              <span className="text-[8px] text-gray-400 font-bold">(12)</span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
