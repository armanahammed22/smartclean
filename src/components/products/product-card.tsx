"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Star, Package, Truck } from 'lucide-react';
import { Product } from '@/types';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/components/providers/language-provider';
import { Button } from '@/components/ui/button';

interface ProductCardProps {
  product: Product;
  isDark?: boolean;
  customStyle?: any;
}

export function ProductCard({ product, isDark = false, customStyle }: ProductCardProps) {
  const { t } = useLanguage();
  const discountPercent = product.regularPrice && product.regularPrice > product.price
    ? Math.round(((product.regularPrice - product.price) / product.regularPrice) * 100)
    : null;

  const rating = 4.8;
  const soldCount = Math.floor((parseInt(product.id.slice(0, 3), 16) || 50) % 800);

  // Dynamic Styles Mapping
  const cardStyle = {
    backgroundColor: customStyle?.cardBg || (isDark ? 'transparent' : '#ffffff'),
    borderRadius: `${customStyle?.cardRadius !== undefined ? customStyle.cardRadius : 24}px`,
  };

  const titleAlign = customStyle?.titleAlign || 'left';
  const priceAlign = customStyle?.priceAlign || 'left';
  const btnAlign = customStyle?.btnAlign || 'full';

  return (
    <Link href={`/product/${product.slug || product.id}`} className="block h-full group active:scale-[0.98] transition-all">
      <div 
        className={cn(
          "flex flex-col h-full border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden",
          customStyle?.cardShadow
        )}
        style={cardStyle}
      >
        <div className="p-1">
          <div className="relative aspect-square w-full rounded-xl md:rounded-2xl overflow-hidden bg-gray-50 flex items-center justify-center">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                unoptimized
              />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-100">
                <Package size={32} />
              </div>
            )}
            
            {product.badgeText ? (
              <div className="absolute top-2 left-2">
                <div className="bg-primary text-white text-[8px] md:text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-lg">
                  {product.badgeText}
                </div>
              </div>
            ) : (
              <div className="absolute bottom-2 left-2">
                <div className="flex items-center gap-1 bg-[#2E8B57] text-white text-[7px] md:text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter shadow-lg">
                  <Truck size={8} fill="white" className="shrink-0" />
                  {t('shipping_free').toUpperCase()}
                </div>
              </div>
            )}

            {discountPercent && (
              <div className="absolute top-2 right-2 bg-[#f85606] text-white text-[8px] md:text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-md uppercase">
                -{discountPercent}%
              </div>
            )}
          </div>
        </div>

        <div className="px-3 md:px-4 pb-5 space-y-0.5 pt-0 flex flex-col flex-1">
          <div className={cn("w-full", titleAlign === 'center' ? 'text-center' : 'text-left')}>
            <h3 className={cn(
              "font-bold line-clamp-1 leading-tight uppercase tracking-tight transition-colors",
              customStyle?.titleSize || 'text-[11px] md:text-sm',
              isDark ? "text-white/90 group-hover:text-white" : "text-gray-800 group-hover:text-primary"
            )} style={{ color: customStyle?.titleColor }}>
              {product.name}
            </h3>
          </div>
          
          <div className={cn("mt-auto pt-2 flex flex-col gap-3")}>
            <div className={cn("w-full flex flex-col", priceAlign === 'center' ? 'items-center' : 'items-start')}>
              <div className="flex items-baseline gap-2">
                <p className={cn(
                  "font-black tracking-tighter leading-none",
                  customStyle?.priceSize || 'text-lg md:text-xl',
                  isDark ? "text-amber-400" : "text-[#f85606]"
                )} style={{ color: customStyle?.priceColor }}>
                  <span className="text-[9px] md:text-xs font-bold mr-0.5">৳</span>
                  {product.price.toLocaleString()}
                </p>
                {product.regularPrice && product.regularPrice > product.price && (
                  <span className="text-[8px] md:text-[10px] text-gray-300 line-through font-bold">
                    ৳{product.regularPrice.toLocaleString()}
                  </span>
                )}
              </div>
              
              <div className={cn(
                "flex items-center gap-2 text-[8px] md:text-[9px] font-bold mt-1",
                isDark ? "text-white/40" : "text-gray-400"
              )}>
                <div className="flex items-center gap-1 text-amber-400">
                  <Star size={10} fill="currentColor" />
                  <span className={cn("font-black", isDark ? "text-white/60" : "text-gray-600")}>{rating.toFixed(1)}</span>
                </div>
                <span className="uppercase tracking-widest font-black">{soldCount} {t('sold')}</span>
              </div>
            </div>

            {/* Dynamic Button Rendering */}
            <div className={cn(
              "flex w-full",
              btnAlign === 'center' ? 'justify-center' : btnAlign === 'right' ? 'justify-end' : 'justify-start'
            )}>
              <Button 
                size={customStyle?.btnSize || 'sm'}
                className={cn(
                  "font-black uppercase tracking-widest text-[9px] rounded-xl transition-all active:scale-95 border-none",
                  btnAlign === 'full' ? 'w-full' : 'w-fit px-6'
                )}
                style={{ 
                  backgroundColor: customStyle?.btnBg || '#f85606', 
                  color: customStyle?.btnTextColor || '#ffffff' 
                }}
              >
                {t('buy_now')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
