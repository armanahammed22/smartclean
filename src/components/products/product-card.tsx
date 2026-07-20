"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Star, Package, Zap, ShoppingCart, Search } from 'lucide-react';
import { Product } from '@/types';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/components/providers/language-provider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import React, { useState, useEffect, useMemo, memo } from 'react';
import { useCart } from '@/components/providers/cart-provider';

interface ProductCardProps {
  product: Product;
  isDark?: boolean;
  customStyle?: any;
}

// ⚡ PERFORMANCE: Wrapped in memo to prevent re-renders in large grids
export const ProductCard = memo(({ product, isDark = false, customStyle }: ProductCardProps) => {
  const { t } = useLanguage();
  const { addToCart, setCheckoutOpen } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isService = (product as any).type === 'service' || 'basePrice' in product || 'mainServiceId' in product;
  const displayPrice = (product as any).basePrice !== undefined ? (product as any).basePrice : product.price;
  const regularPrice = (product as any).regularPrice !== undefined ? (product as any).regularPrice : product.regularPrice;
  const displayName = (product as any).title || product.name;

  const discountPercent = regularPrice && regularPrice > displayPrice
    ? Math.round(((regularPrice - displayPrice) / regularPrice) * 100)
    : null;

  const rating = product.rating || 5.0;
  const bookingCount = (product as any).bookingCount || 0;
  const soldCount = product.salesCount || 0;

  const style = useMemo(() => ({
    cardBg: customStyle?.cardBg || '#ffffff',
    cardRadiusTL: customStyle?.cardRadiusTL !== undefined ? customStyle.cardRadiusTL : 16,
    cardRadiusTR: customStyle?.cardRadiusTR !== undefined ? customStyle.cardRadiusTR : 16,
    cardRadiusBL: customStyle?.cardRadiusBL !== undefined ? customStyle.cardRadiusBL : 16,
    cardRadiusBR: customStyle?.cardRadiusBR !== undefined ? customStyle.cardRadiusBR : 16,
    cardPadding: customStyle?.cardPadding !== undefined ? customStyle.cardPadding : 10,
    elementGap: customStyle?.elementGap !== undefined ? customStyle.elementGap : 4,
    
    imgHeight: customStyle?.imgHeight || 150,
    imgRadius: customStyle?.imgRadius !== undefined ? customStyle.imgRadius : 12,
    imgPadding: customStyle?.imgPadding !== undefined ? customStyle.imgPadding : 0,
    
    textAlign: customStyle?.textAlign || 'left',
    
    titleSize: customStyle?.titleSize || 'text-[11px] md:text-xs',
    titleColor: customStyle?.titleColor || '#1f2937',
    titlePadding: {
      top: customStyle?.titlePaddingTop ?? 0,
      bottom: customStyle?.titlePaddingBottom ?? 1,
      left: customStyle?.titlePaddingLeft ?? 0,
      right: customStyle?.titlePaddingRight ?? 0
    },
    
    priceSize: customStyle?.priceSize || 'text-sm md:text-base',
    priceColor: customStyle?.priceColor || '#1E5F7A',
    
    metaSize: customStyle?.metaSize || 'text-[9px]',
    metaColor: customStyle?.metaColor || '#9ca3af',
    metaLabelRating: customStyle?.metaLabelRating || '',
    metaLabelCount: customStyle?.metaLabelCount || (isService ? 'Booked' : 'Sold'),
    
    btnBg: customStyle?.primaryBtnBg || '#1E5F7A',
    btnColor: customStyle?.primaryBtnColor || '#ffffff',
    btnSize: customStyle?.primaryBtnSize || 'text-[10px]',
    btnWidth: customStyle?.btnWidth || '100%',
    btnHeight: customStyle?.btnHeight || '40'
  }), [customStyle, isService]);

  const handleOrderNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product as any, 1, false);
    setCheckoutOpen(true);
  };

  if (!mounted) return <div className="aspect-[3/4] bg-gray-50 rounded-2xl animate-pulse" />;

  const isFullWidthBtn = style.btnWidth === '100%';

  return (
    <div className="block h-full group active:scale-[0.98] transition-all">
      <div 
        className="flex flex-col h-full border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
        style={{ 
          backgroundColor: style.cardBg, 
          borderTopLeftRadius: `${style.cardRadiusTL}px`, 
          borderTopRightRadius: `${style.cardRadiusTR}px`, 
          borderBottomLeftRadius: `${style.cardRadiusBL}px`, 
          borderBottomRightRadius: `${style.cardRadiusBR}px`, 
          padding: `${style.cardPadding}px`,
          gap: `${style.elementGap}px`
        }}
      >
        <div 
          className="w-full shrink-0"
          style={{ padding: `${style.imgPadding}px` }}
        >
          <Link 
            href={`/${isService ? 'service' : 'product'}/${product.slug || product.id}`} 
            className="block relative overflow-hidden bg-gray-50"
            style={{ height: `${style.imgHeight}px`, borderRadius: `${style.imgRadius}px` }}
          >
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={displayName}
                fill
                className="object-contain transition-transform duration-500 group-hover:scale-105"
                unoptimized
              />
            ) : (
              <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-200">
                <Package size={24} />
              </div>
            )}
            
            <div className="absolute top-1.5 left-1.5 flex flex-col gap-1 z-10">
              {discountPercent && (
                <Badge className="bg-red-600 text-white border-none text-[8px] font-black px-1.5 py-0.5 rounded-sm uppercase shadow-sm">
                  {discountPercent}% OFF
                </Badge>
              )}
              {product.badgeText && (
                <Badge className={cn(
                  "border-none text-[8px] font-black px-1.5 py-0.5 rounded-sm uppercase shadow-sm",
                  product.badgeText === 'HOT' ? "bg-orange-50 text-white animate-pulse" : "bg-primary text-white"
                )}>
                  {product.badgeText}
                </Badge>
              )}
            </div>
          </Link>
        </div>

        <div className="flex-1 flex flex-col w-full">
          <div 
            className="w-full min-h-[2.5rem] flex flex-col justify-start" 
            style={{ 
              textAlign: style.textAlign as any,
              paddingTop: `${style.titlePadding.top}px`,
              paddingBottom: `${style.titlePadding.bottom}px`
            }}
          >
            <Link href={`/${isService ? 'service' : 'product'}/${product.slug || product.id}`}>
              <h3 
                className={cn("font-bold line-clamp-2 leading-tight uppercase tracking-tight transition-colors", style.titleSize)}
                style={{ color: style.titleColor }}
              >
                {displayName}
              </h3>
            </Link>
          </div>
          
          <div className={cn("w-full flex flex-wrap items-baseline gap-1.5 mb-2", style.textAlign === 'center' ? 'justify-center' : 'justify-start')}>
            <p className={cn("font-black tracking-tighter leading-none", style.priceSize)} style={{ color: style.priceColor }}>
              ৳{displayPrice?.toLocaleString()}
            </p>
            {regularPrice && regularPrice > displayPrice && (
              <span className="text-[9px] text-gray-400 line-through font-medium">
                ৳{regularPrice.toLocaleString()}
              </span>
            )}
          </div>
          
          <div className="w-full flex items-center justify-between font-bold border-t border-gray-50 pt-2" style={{ color: style.metaColor }}>
            <div className="flex items-center gap-0.5 text-amber-500">
              <Star size={10} fill="currentColor" />
              <span className={cn("font-black", style.metaSize)}>{rating.toFixed(1)}</span>
            </div>
            <span className={cn("uppercase font-black", style.metaSize)}>{(isService ? bookingCount : soldCount).toLocaleString()} {style.metaLabelCount}</span>
          </div>

          <div className={cn("w-full flex items-center gap-2 mt-4", style.textAlign === 'center' ? 'justify-center' : 'justify-start')}>
            <button 
              onClick={handleOrderNow}
              className={cn(
                "inline-flex items-center justify-center font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 border-none shadow-md", 
                style.btnSize,
                isFullWidthBtn && "flex-1"
              )}
              style={{ 
                backgroundColor: style.btnBg, 
                color: style.btnColor,
                width: isFullWidthBtn ? 'auto' : style.btnWidth,
                height: `${style.btnHeight}px`
              }}
            >
              <Zap className="mr-1 size-3" fill="currentColor" />
              {customStyle?.primaryBtnText || (isService ? t('book_now') : t('buy_now'))}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';