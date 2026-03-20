
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Package, Star } from 'lucide-react';
import { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader } from '@/components/ui/card';
import { useCart } from '@/components/providers/cart-provider';
import { useLanguage } from '@/components/providers/language-provider';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart, setCheckoutOpen } = useCart();
  const { t } = useLanguage();

  const handleOrderNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
    setCheckoutOpen(true);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
  };

  return (
    <Card className="overflow-hidden group flex flex-col h-full hover:shadow-lg transition-all duration-300 border-none bg-white rounded-xl shadow-sm">
      <Link href={`/product/${product.id}`} className="block relative aspect-square overflow-hidden shrink-0">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name || 'Product Image'}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            unoptimized
          />
        ) : (
          <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-200">
            <Package size={40} />
          </div>
        )}
        
        {/* Discount Badge Placeholder if needed */}
        {product.regularPrice && product.regularPrice > product.price && (
          <div className="absolute top-0 right-0 bg-primary text-white text-[9px] font-black px-2 py-1 rounded-bl-lg shadow-sm">
            -{Math.round(((product.regularPrice - product.price) / product.regularPrice) * 100)}%
          </div>
        )}
      </Link>
      <div className="p-2 md:p-3 flex flex-col flex-1 gap-1.5">
        <CardHeader className="p-0 space-y-1">
          <Link href={`/product/${product.id}`} className="hover:text-primary transition-colors block">
            <h3 className="font-medium text-[12px] md:text-sm line-clamp-2 leading-tight text-gray-800 min-h-[2.5rem]">
              {product.name}
            </h3>
          </Link>
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-black text-primary text-sm md:text-lg">৳{product.price.toLocaleString()}</span>
            </div>
            {product.regularPrice && product.regularPrice > product.price && (
              <span className="text-[10px] md:text-xs text-gray-400 line-through">৳{product.regularPrice.toLocaleString()}</span>
            )}
          </div>
        </CardHeader>
        
        {/* Rating Placeholder Daraz Style */}
        <div className="flex items-center gap-1 mt-auto">
          <div className="flex text-amber-400">
            <Star size={10} fill="currentColor" />
          </div>
          <span className="text-[9px] text-gray-400">(12)</span>
        </div>
      </div>
    </Card>
  );
}
