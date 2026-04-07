
"use client";

import Image from 'next/image';
import Link from 'next/link';
import * as LucideIcons from 'lucide-react';
import { Star, Package, Clock } from 'lucide-react';
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

  const discountPercent = product.regularPrice && product.regularPrice > product.price
    ? Math.round(((product.regularPrice - product.price) / product.regularPrice) * 100)
    : null;

  const rating = 4.8;
  const soldCount = Math.floor((parseInt(product.id.slice(0, 3), 16) || 50) % 800);

  const cardStyle = {
    backgroundColor: customStyle?.cardBg || (isDark ? 'transparent' : '#ffffff'),
    borderRadius: `${customStyle?.cardRadius !== undefined ? customStyle.cardRadius : 16}px`,
  };

  const titleAlign = customStyle?.textAlign || 'left';
  
  // Icon Helper
  const renderIcon = (iconName: string, className?: string) => {
    const Icon = (LucideIcons as any)[iconName] || LucideIcons.Zap;
    return <Icon className={className || "size-3"} />;
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
        className={cn(
          "flex flex-col h-full border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden bg-white",
          customStyle?.showShadow !== false ? "shadow-sm" : "shadow-none"
        )}
        style={cardStyle}
      >
        <Link href={`/product/${product.slug || product.id}`} className="block relative aspect-square w-full overflow-hidden bg-gray-50 shrink-0">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
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

          {product.onSale && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-md p-1.5 flex items-center justify-center gap-2">
              <Clock size={10} className="text-primary animate-spin" />
              <span className="text-[8px] font-black text-white uppercase tracking-widest">Ending Soon</span>
            </div>
          )}
        </Link>

        <div className="p-3 md:p-4 flex flex-col flex-1">
          <div className={cn("w-full min-h-[40px] md:min-h-[48px] mb-2", titleAlign === 'center' ? 'text-center' : 'text-left')}>
            <Link href={`/product/${product.slug || product.id}`}>
              <h3 className={cn(
                "font-bold line-clamp-2 leading-tight uppercase tracking-tight transition-colors",
                customStyle?.titleSize || 'text-[11px] md:text-sm',
                isDark ? "text-white/90 group-hover:text-white" : "text-gray-800 group-hover:text-primary"
              )} style={{ color: customStyle?.titleColor }}>
                {product.name}
              </h3>
            </Link>
          </div>
          
          <div className="space-y-2 mb-3">
            <div className={cn("w-full flex flex-wrap items-baseline gap-2 pt-1", titleAlign === 'center' ? 'justify-center' : 'justify-start')}>
              <p className={cn(
                "font-black tracking-tighter leading-none",
                customStyle?.priceSize || 'text-base md:text-lg',
                isDark ? "text-amber-400" : "text-primary"
              )} style={{ color: customStyle?.priceColor || '#1E5F7A' }}>
                ৳{product.price.toLocaleString()}
              </p>
              {product.regularPrice && product.regularPrice > product.price && (
                <span className="text-[10px] md:text-xs text-gray-400 line-through font-medium">
                  ৳{product.regularPrice.toLocaleString()}
                </span>
              )}
            </div>
            
            <div className="flex items-center justify-between text-[9px] md:text-[10px] font-bold border-t border-gray-50 pt-2">
              <div className="flex items-center gap-1 text-amber-500">
                <Star size={12} fill="currentColor" />
                <span className="text-gray-600">{rating.toFixed(1)}</span>
              </div>
              <span className="uppercase text-gray-400 font-black">{soldCount} {t('sold')}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-auto">
            {/* Primary Button: Buy Now */}
            {customStyle?.primaryBtnEnabled !== false && (
              <Button 
                size="sm"
                onClick={handleOrderNow}
                className="font-black uppercase tracking-widest text-[9px] rounded-lg transition-all active:scale-95 border-none h-9 w-full shadow-lg"
                style={{ 
                  backgroundColor: customStyle?.primaryBtnBg || '#1E5F7A', 
                  color: customStyle?.primaryBtnColor || '#ffffff' 
                }}
              >
                {renderIcon(customStyle?.primaryBtnIcon || 'Zap', "mr-1.5 size-3")}
                {customStyle?.primaryBtnText || t('buy_now')}
              </Button>
            )}

            {/* Secondary Button: Add to Cart */}
            {customStyle?.secondaryBtnEnabled === true && (
              <Button 
                variant="outline"
                size="sm"
                onClick={handleAddToCart}
                className="font-black uppercase tracking-widest text-[9px] rounded-lg transition-all active:scale-95 h-9 w-full border-2"
                style={{ 
                  backgroundColor: customStyle?.secondaryBtnBg || '#f3f4f6', 
                  color: customStyle?.secondaryBtnColor || '#1f2937',
                  borderColor: 'rgba(0,0,0,0.05)'
                }}
              >
                {renderIcon(customStyle?.secondaryBtnIcon || 'ShoppingCart', "mr-1.5 size-3")}
                {customStyle?.secondaryBtnText || 'Add to Cart'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
