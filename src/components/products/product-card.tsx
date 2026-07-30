
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Star, Package, Zap } from 'lucide-react';
import { Product } from '@/types';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/components/providers/language-provider';
import React, { useState, useEffect, useMemo, memo } from 'react';
import { useCart } from '@/components/providers/cart-provider';
import { Badge } from '@/components/ui/badge';

interface ProductCardProps {
  product: Product;
  isDark?: boolean;
  customStyle?: any;
}

// ⚡ PERFORMANCE: Wrapped in memo to prevent redundant re-renders
export const ProductCard = memo(({ product, isDark = false, customStyle }: ProductCardProps) => {
  const { t } = useLanguage();
  const { addToCart, setCheckoutOpen } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isService = (product as any).type === 'service' || 'basePrice' in product;
  const displayPrice = (product as any).basePrice !== undefined ? (product as any).basePrice : product.price;
  const regularPrice = product.regularPrice;
  const displayName = (product as any).title || product.name;

  const discountPercent = regularPrice && regularPrice > displayPrice
    ? Math.round(((regularPrice - displayPrice) / regularPrice) * 100)
    : null;

  // Memoize style object to prevent re-calculations
  const style = useMemo(() => ({
    cardBg: customStyle?.cardBg || '#ffffff',
    cardRadius: customStyle?.cardRadiusTL || 24,
    cardPadding: customStyle?.cardPadding ?? 12,
    imgHeight: customStyle?.imgHeight || 160,
    imgRadius: customStyle?.imgRadius ?? 16,
    textAlign: customStyle?.textAlign || 'left',
    titleSize: customStyle?.titleSize || 'text-xs',
    titleColor: customStyle?.titleColor || '#1f2937',
    priceSize: customStyle?.priceSize || 'text-base',
    priceColor: customStyle?.priceColor || '#1E5F7A',
    btnBg: customStyle?.primaryBtnBg || '#1E5F7A',
    btnColor: customStyle?.primaryBtnColor || '#ffffff',
    btnHeight: customStyle?.btnHeight || '40'
  }), [customStyle]);

  const handleOrderNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product as any, 1, false);
    setCheckoutOpen(true);
  };

  if (!mounted) return <div className="aspect-[3/4] bg-gray-50 rounded-[2rem] animate-pulse" />;

  return (
    <div className="block h-full group active:scale-[0.98] transition-all">
      <div 
        className="flex flex-col h-full border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden"
        style={{ 
          backgroundColor: style.cardBg, 
          borderRadius: `${style.cardRadius}px`, 
          padding: `${style.cardPadding}px`
        }}
      >
        <Link 
          href={`/${isService ? 'service' : 'product'}/${product.slug || product.id}`} 
          className="block relative overflow-hidden bg-gray-50 mb-3"
          style={{ height: `${style.imgHeight}px`, borderRadius: `${style.imgRadius}px` }}
        >
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={displayName}
              fill
              className="object-contain transition-transform duration-700 group-hover:scale-110"
              sizes="(max-width: 768px) 50vw, 240px"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-200"><Package size={24} /></div>
          )}
          
          <div className="absolute top-2 left-2 z-10">
            {discountPercent && <Badge className="bg-red-600 text-white border-none text-[8px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-tighter shadow-sm">{discountPercent}% OFF</Badge>}
          </div>
        </Link>

        <div className="flex-1 flex flex-col w-full" style={{ textAlign: style.textAlign as any }}>
          <Link href={`/${isService ? 'service' : 'product'}/${product.slug || product.id}`}>
            <h3 className={cn("font-black line-clamp-2 leading-tight uppercase tracking-tight mb-2", style.titleSize)} style={{ color: style.titleColor }}>
              {displayName}
            </h3>
          </Link>
          
          <div className={cn("flex flex-wrap items-baseline gap-1.5 mb-4", style.textAlign === 'center' ? 'justify-center' : 'justify-start')}>
            <p className={cn("font-black tracking-tighter leading-none", style.priceSize)} style={{ color: style.priceColor }}>৳{displayPrice?.toLocaleString()}</p>
            {regularPrice > displayPrice && <span className="text-[9px] text-gray-400 line-through font-bold">৳{regularPrice.toLocaleString()}</span>}
          </div>
          
          <button 
            onClick={handleOrderNow}
            className="w-full mt-auto inline-flex items-center justify-center font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 border-none shadow-md text-[9px]"
            style={{ backgroundColor: style.btnBg, color: style.btnColor, height: `${style.btnHeight}px` }}
          >
            <Zap className="mr-1.5 size-3" fill="currentColor" /> {isService ? t('book_now') : t('buy_now')}
          </button>
        </div>
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';
