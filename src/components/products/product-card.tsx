
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Star, Package, Zap, ShoppingCart, Search } from 'lucide-react';
import { Product } from '@/types';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/components/providers/language-provider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import React, { useState, useEffect } from 'react';
import { useCart } from '@/components/providers/cart-provider';

interface ProductCardProps {
  product: Product;
  isDark?: boolean;
  customStyle?: any;
}

export function ProductCard({ product, isDark = false, customStyle }: ProductCardProps) {
  const { t } = useLanguage();
  const { addToCart, setCheckoutOpen } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isService = 'basePrice' in product || (product as any).type === 'service';
  const displayPrice = isService ? (product as any).basePrice : product.price;
  const regularPrice = isService ? (product as any).regularPrice : product.regularPrice;
  const displayName = isService ? (product as any).title : product.name;

  const discountPercent = regularPrice && regularPrice > displayPrice
    ? Math.round(((regularPrice - displayPrice) / regularPrice) * 100)
    : null;

  const rating = product.rating || 4.8;
  const soldCount = Math.floor((parseInt(product.id.slice(0, 3), 16) || 50) % 800);

  // Styling Data
  const style = {
    cardBg: customStyle?.cardBg || '#ffffff',
    cardRadius: customStyle?.cardRadius !== undefined ? customStyle.cardRadius : 16,
    cardPadding: customStyle?.cardPadding !== undefined ? customStyle.cardPadding : 16,
    elementGap: customStyle?.elementGap !== undefined ? customStyle.elementGap : 12,
    
    imgHeight: customStyle?.imgHeight || 200,
    imgRadius: customStyle?.imgRadius !== undefined ? customStyle.imgRadius : 12,
    imgPadding: customStyle?.imgPadding !== undefined ? customStyle.imgPadding : 0,
    
    textAlign: customStyle?.textAlign || 'left',
    
    titleSize: customStyle?.titleSize || 'text-sm',
    titleColor: customStyle?.titleColor || '#1f2937',
    titlePadding: customStyle?.titlePadding !== undefined ? customStyle.titlePadding : 0,
    
    priceSize: customStyle?.priceSize || 'text-lg',
    priceColor: customStyle?.priceColor || '#1E5F7A',
    pricePadding: customStyle?.pricePadding !== undefined ? customStyle.pricePadding : 0,
    
    metaSize: customStyle?.metaSize || 'text-[10px]',
    metaColor: customStyle?.metaColor || '#9ca3af',
    metaPadding: customStyle?.metaPadding !== undefined ? customStyle.metaPadding : 0,
    metaLabelRating: customStyle?.metaLabelRating || 'Rating',
    metaLabelCount: customStyle?.metaLabelCount || (isService ? 'Booked' : 'Sold'),
    
    btnBg: customStyle?.primaryBtnBg || '#1E5F7A',
    btnColor: customStyle?.primaryBtnColor || '#ffffff',
    btnSize: customStyle?.primaryBtnSize || 'text-[10px]',
    btnPadding: customStyle?.btnPadding !== undefined ? customStyle.btnPadding : 0
  };

  const handleOrderNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product as any, 1, false);
    setCheckoutOpen(true);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product as any, 1);
  };

  if (!mounted) return null;

  return (
    <div className="block h-full group active:scale-[0.98] transition-all">
      <div 
        className="flex flex-col h-full border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
        style={{ 
          backgroundColor: style.cardBg, 
          borderRadius: `${style.cardRadius}px`, 
          padding: `${style.cardPadding}px`,
          gap: `${style.elementGap}px`
        }}
      >
        {/* 🖼️ IMAGE AREA */}
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
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                unoptimized
              />
            ) : (
              <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-200">
                <Package size={32} />
              </div>
            )}
            
            <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
              {discountPercent && (
                <Badge className="bg-red-600 text-white border-none text-[9px] font-black px-1.5 py-0.5 rounded-sm uppercase shadow-lg">
                  {discountPercent}% OFF
                </Badge>
              )}
              {product.badgeText && (
                <Badge className={cn(
                  "border-none text-[9px] font-black px-1.5 py-0.5 rounded-sm uppercase shadow-lg",
                  product.badgeText === 'HOT' ? "bg-orange-50 text-white animate-pulse" : "bg-amber-50 text-white"
                )}>
                  {product.badgeText}
                </Badge>
              )}
            </div>
          </Link>
        </div>

        {/* 🏷️ TITLE AREA */}
        <div 
          className="w-full" 
          style={{ 
            textAlign: style.textAlign as any, 
            padding: `${style.titlePadding}px` 
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
        
        {/* 💰 PRICE AREA */}
        <div 
          className={cn("w-full flex flex-wrap items-baseline gap-2", style.textAlign === 'center' ? 'justify-center' : 'justify-start')}
          style={{ padding: `${style.pricePadding}px` }}
        >
          <p className={cn("font-black tracking-tighter leading-none", style.priceSize)} style={{ color: style.priceColor }}>
            ৳{displayPrice?.toLocaleString()}
          </p>
          {regularPrice && regularPrice > displayPrice && (
            <span className="text-[10px] md:text-xs text-gray-400 line-through font-medium">
              ৳{regularPrice.toLocaleString()}
            </span>
          )}
        </div>
        
        {/* ⭐ RATING & COUNT AREA */}
        <div 
          className="w-full flex items-center justify-between font-bold border-t border-gray-50 pt-2" 
          style={{ 
            color: style.metaColor,
            padding: `${style.metaPadding}px`
          }}
        >
          <div className="flex items-center gap-1 text-amber-500">
            <Star size={12} fill="currentColor" />
            <span className={cn("font-black", style.metaSize)}>{rating.toFixed(1)} {style.metaLabelRating}</span>
          </div>
          <span className={cn("uppercase font-black", style.metaSize)}>{soldCount} {style.metaLabelCount}</span>
        </div>

        {/* 🛒 BUTTON AREA */}
        <div 
          className="w-full flex flex-col gap-2 mt-auto"
          style={{ padding: `${style.btnPadding}px` }}
        >
          {customStyle?.primaryBtnEnabled !== false && (
            <Button 
              size="sm"
              onClick={handleOrderNow}
              className={cn("font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 border-none h-10 w-full shadow-lg", style.btnSize)}
              style={{ 
                backgroundColor: style.btnBg, 
                color: style.btnColor 
              }}
            >
              <Zap className="mr-1.5 size-3" fill="currentColor" />
              {customStyle?.primaryBtnText || (isService ? t('book_now') : t('buy_now'))}
            </Button>
          )}

          {customStyle?.secondaryBtnEnabled === true && (
            <Button 
              variant="outline"
              size="sm"
              onClick={isService ? undefined : handleAddToCart}
              asChild={isService}
              className={cn("font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 h-10 w-full border-2", style.btnSize)}
              style={{ 
                backgroundColor: '#f3f4f6', 
                color: '#1f2937',
                borderColor: 'rgba(0,0,0,0.05)'
              }}
            >
              {isService ? (
                <Link href={`/service/${product.slug || product.id}`}>
                  <Search className="mr-1.5 size-3" />
                  {customStyle?.secondaryBtnText || 'View Details'}
                </Link>
              ) : (
                <>
                  <ShoppingCart className="mr-1.5 size-3" />
                  {customStyle?.secondaryBtnText || 'Add to Cart'}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
