'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { Product } from '@/types';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/components/providers/language-provider';

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

  const cardStyle = {
    backgroundColor: customStyle?.cardBg || '#ffffff',
    borderRadius: `${customStyle?.cardRadius || 24}px`,
    textAlign: (customStyle?.textAlign || 'left') as any
  };

  return (
    <Link href={`/product/${product.id}`} className="block h-full group active:scale-[0.97] transition-all">
      <div 
        className={cn(
          "overflow-hidden flex flex-col h-full shadow-md border border-gray-100 group-hover:shadow-xl transition-all hover:-translate-y-1",
          customStyle?.cardShadow
        )}
        style={cardStyle}
      >
        <div className="p-2 md:p-3">
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
              <div className="absolute top-2 left-2 bg-[#f85606] text-white text-[8px] md:text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg z-10 uppercase tracking-tighter">
                -{discountPercent}%
              </div>
            )}
          </div>
        </div>

        <div className="p-3 md:p-4 flex flex-col flex-1 gap-0.5 pt-0">
          <h3 className="text-[11px] md:text-xs font-bold text-gray-800 uppercase tracking-tight line-clamp-1 leading-tight group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          
          <div className="mt-auto">
            <div className={cn("flex flex-col", customStyle?.textAlign === 'center' ? 'items-center' : '')}>
              <p className="text-base md:text-lg font-black text-primary tracking-tighter leading-none">
                ৳{product.price.toLocaleString()}
              </p>
              {product.regularPrice && product.regularPrice > product.price && (
                <span className="text-[8px] md:text-[10px] font-bold text-gray-300 line-through mt-0.5">
                  ৳{product.regularPrice.toLocaleString()}
                </span>
              )}
            </div>
            
            <div className="flex items-center justify-between text-[8px] md:text-[9px] font-bold mt-1">
              <div className="flex items-center gap-1 text-amber-400">
                <Star size={10} fill="currentColor" />
                <span className="font-black text-gray-600">{rating}</span>
              </div>
              <span className="uppercase tracking-widest text-[8px] font-black text-gray-400">{soldCount} {t('sold')}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
