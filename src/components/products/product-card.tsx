
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Package } from 'lucide-react';
import { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
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
    <Card className="overflow-hidden group flex flex-col h-full hover:shadow-xl transition-all duration-300 border-border/50 bg-white rounded-2xl md:rounded-3xl">
      <Link href={`/product/${product.id}`} className="block relative aspect-square overflow-hidden shrink-0">
        {product.imageUrl && typeof product.imageUrl === 'string' && product.imageUrl !== '' ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground/30">
            <Package size={40} />
          </div>
        )}
        <div className="absolute top-2 left-2">
          <span className="bg-primary/95 text-white text-[8px] md:text-[9px] font-black px-2 py-0.5 rounded-full backdrop-blur-sm uppercase tracking-tighter shadow-sm">
            {product.category}
          </span>
        </div>
      </Link>
      <CardHeader className="p-3 md:p-4 pb-1 space-y-1">
        <Link href={`/product/${product.id}`} className="hover:text-primary transition-colors block">
          <h3 className="font-bold text-[13px] md:text-sm line-clamp-1 leading-tight text-gray-900">{product.name}</h3>
        </Link>
        <div className="flex flex-col">
          <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">{t('fixed_price')}</span>
          <span className="font-black text-primary text-base md:text-lg">৳{product.price.toLocaleString()}</span>
        </div>
      </CardHeader>
      <CardContent className="p-3 md:p-4 pt-0 flex-1">
        <p className="text-[10px] md:text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {product.shortDescription || product.description}
        </p>
      </CardContent>
      <CardFooter className="p-3 md:p-4 pt-2 gap-2 mt-auto border-t border-gray-50 bg-gray-50/30">
        <Button 
          className="flex-1 gap-1 text-[10px] md:text-xs font-black h-9 md:h-10 rounded-xl bg-primary hover:bg-primary/90 shadow-md shadow-primary/10 uppercase tracking-tighter" 
          onClick={handleOrderNow}
        >
          {t('order_now')}
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="shrink-0 h-9 w-9 md:h-10 md:w-10 rounded-xl hover:bg-primary hover:text-white transition-all border-primary/20 text-primary bg-white"
          onClick={handleAddToCart}
          title={t('add_to_cart')}
        >
          <ShoppingCart size={16} />
        </Button>
      </CardFooter>
    </Card>
  );
}
