
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Package } from 'lucide-react';
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
    <Card className="overflow-hidden group flex flex-col h-full hover:shadow-xl transition-all duration-300 border-gray-100 bg-white rounded-2xl shadow-sm">
      <Link href={`/product/${product.id}`} className="block relative aspect-[4/3] overflow-hidden shrink-0">
        {product.imageUrl && typeof product.imageUrl === 'string' && product.imageUrl !== '' ? (
          <Image
            src={product.imageUrl}
            alt={product.name || 'Product Image'}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-primary/5 flex items-center justify-center text-primary/40">
            <Package size={40} />
          </div>
        )}
        <div className="absolute top-2 left-2">
          <span className="bg-white/95 text-primary text-[8px] font-black px-2 py-0.5 rounded-full backdrop-blur-md uppercase tracking-tighter shadow-sm border border-primary/10">
            {product.category || 'Supplies'}
          </span>
        </div>
      </Link>
      <div className="p-3 flex flex-col flex-1 gap-1">
        <CardHeader className="p-0 space-y-0.5">
          <Link href={`/product/${product.id}`} className="hover:text-primary transition-colors block">
            <h3 className="font-bold text-[13px] md:text-[14px] line-clamp-1 leading-tight text-gray-900 group-hover:text-primary uppercase tracking-tight">{product.name}</h3>
          </Link>
          <div className="flex items-center gap-1.5">
            <span className="font-black text-primary text-sm">৳{product.price.toLocaleString()}</span>
            {product.regularPrice && product.regularPrice > product.price && (
              <span className="text-[10px] text-gray-400 line-through">৳{product.regularPrice.toLocaleString()}</span>
            )}
          </div>
        </CardHeader>
        
        <CardFooter className="p-0 pt-1.5 gap-1.5 mt-auto flex items-center">
          <Button 
            className="flex-1 text-[10px] font-black h-8 rounded-full bg-primary hover:bg-primary/90 shadow-md uppercase tracking-tight transition-transform active:scale-95" 
            onClick={handleOrderNow}
          >
            {t('order_now')}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 h-8 w-8 rounded-full hover:bg-primary hover:text-white transition-all border-primary/20 text-primary bg-white shadow-sm"
            onClick={handleAddToCart}
            title={t('add_to_cart')}
          >
            <ShoppingCart size={14} />
          </Button>
        </CardFooter>
      </div>
    </Card>
  );
}
