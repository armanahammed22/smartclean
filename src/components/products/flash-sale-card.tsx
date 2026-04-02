'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Star, Zap } from 'lucide-react';
import { Product } from '@/types';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/components/providers/language-provider';
import { Button } from '@/components/ui/button';

interface FlashSaleCardProps {
  product: Product;
  customStyle?: any;
}

export function FlashSaleCard({ product, customStyle }: FlashSaleCardProps) {
  const { t } = useLanguage();
  const discountPercent = product.regularPrice && product.regularPrice > product.price
    ? Math.round(((product.regularPrice - product.price) / product.regularPrice) * 100)
    : null;

  const rating = 4.8;
  const soldCount = Math.floor((parseInt(product.id.slice(0, 3), 16) || 50) % 800);
  const totalStock = 1000;
  const progress = (soldCount / totalStock) * 100;

  const cardStyle = {
    backgroundColor: customStyle?.cardBg || '#ffffff',
    borderRadius: `${customStyle?.cardRadius !== undefined ? customStyle.cardRadius : 24}px`,
  };

  const titleAlign = customStyle?.titleAlign || 'left';
  const priceAlign = customStyle?.priceAlign || 'left';
  const btnAlign = customStyle?.btnAlign || 'full';

  return (
    <Link href={`/product/${product.slug || product.id}`} className="block h-full group active:scale-[0.97] transition-all">
      <div 
        className={cn(
          "overflow-hidden flex flex-col h-full shadow-md border border-gray-100 group-hover:shadow-xl transition-all hover:-translate-y-1",
          customStyle?.cardShadow
        )}
        style={cardStyle}
      >
        <div className="p-1">
          <div className="relative aspect-square w-full rounded-xl md:rounded-2xl bg-gray-50 flex items-center justify-center overflow-hidden">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                unoptimized
              />
            ) : (
              <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-200">
                <Star size={20} />
              </div>
            )}
            
            {discountPercent && (
              <div className="absolute top-2 left-2 bg-[#f85606] text-white text-[8px] md:text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg z-10 uppercase tracking-tighter animate-pulse">
                -{discountPercent}%
              </div>
            )}
          </div>
        </div>

        <div className="p-3 md:p-4 flex flex-col flex-1 gap-0.5 pt-0">
          <div className={cn("w-full", titleAlign === 'center' ? 'text-center' : 'text-left')}>
            <h3 className={cn(
              "font-bold text-gray-800 uppercase tracking-tight line-clamp-1 leading-tight group-hover:text-primary transition-colors",
              customStyle?.titleSize || 'text-[11px] md:text-xs'
            )} style={{ color: customStyle?.titleColor }}>
              {product.name}
            </h3>
          </div>
          
          <div className="mt-auto pt-2 flex flex-col gap-3">
            <div className={cn("w-full flex flex-col", priceAlign === 'center' ? 'items-center' : 'items-start')}>
              <div className="flex items-baseline gap-2">
                <p className={cn(
                  "font-black text-primary tracking-tighter leading-none",
                  customStyle?.priceSize || 'text-base md:text-lg'
                )} style={{ color: customStyle?.priceColor || '#f85606' }}>
                  ৳{product.price.toLocaleString()}
                </p>
                {product.regularPrice && product.regularPrice > product.price && (
                  <span className="text-[8px] md:text-[10px] font-bold text-gray-300 line-through">
                    ৳{product.regularPrice.toLocaleString()}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-[8px] md:text-[9px] font-bold mt-1">
                <div className="flex items-center gap-1 text-amber-400">
                  <Star size={10} fill="currentColor" />
                  <span className="font-black text-gray-600">{rating.toFixed(1)}</span>
                </div>
                <span className="uppercase tracking-widest text-gray-400 font-black">{soldCount} {t('sold')}</span>
              </div>
            </div>

            <div className="w-full bg-gray-100 h-1 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#f85606] to-[#ff8c00] transition-all duration-1000" style={{ width: `${progress}%` }} />
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
