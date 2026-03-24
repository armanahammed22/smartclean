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
    <Link href={`/product/${product.id}`} className="block h-full app-button">
      <Card className="h-full border-none shadow-sm rounded-2xl overflow-hidden flex flex-col bg-white">
        {/* Image Section */}
        <div className="relative aspect-square w-full bg-white overflow-hidden">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-contain p-2"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-100 bg-gray-50">
              <Package size={24} />
            </div>
          )}
          
          {/* Discount Badge */}
          {discountPercent && (
            <div className="absolute top-0 left-0 bg-[#f85606] text-white text-[8px] font-black px-2 py-1 rounded-br-xl z-10 uppercase tracking-tighter">
              -{discountPercent}%
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-3 flex flex-col flex-1 gap-1">
          <h3 className="text-[10px] font-bold text-gray-800 line-clamp-2 leading-tight min-h-[2.4rem] uppercase">
            {product.name}
          </h3>
          
          <div className="mt-auto space-y-0.5">
            <p className="text-primary font-black text-sm tracking-tighter">
              ৳{product.price.toLocaleString()}
            </p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Star size={10} fill="#faca51" className="text-[#faca51]" />
                <span className="text-[9px] text-gray-400 font-black">4.8</span>
              </div>
              {product.regularPrice && product.regularPrice > product.price && (
                <span className="text-[8px] text-gray-300 line-through font-bold">
                  ৳{product.regularPrice.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}