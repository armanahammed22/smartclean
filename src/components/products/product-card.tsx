"use client";

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
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
    <Card className="overflow-hidden group flex flex-col h-full hover:shadow-xl transition-all duration-300 border-border/50 bg-white">
      <Link href={`/product/${product.id}`} className="block relative aspect-square overflow-hidden shrink-0">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-2 left-2">
          <span className="bg-primary/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
            {product.category}
          </span>
        </div>
      </Link>
      <CardHeader className="p-3 md:p-4 pb-1">
        <Link href={`/product/${product.id}`} className="hover:text-primary transition-colors block">
          <h3 className="font-bold text-sm md:text-base line-clamp-1 leading-tight mb-1">{product.name}</h3>
        </Link>
        <span className="font-black text-primary text-base md:text-lg">৳{product.price.toLocaleString()}</span>
      </CardHeader>
      <CardContent className="p-3 md:p-4 pt-0 flex-1">
        <p className="text-[11px] md:text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {product.shortDescription}
        </p>
      </CardContent>
      <CardFooter className="p-3 md:p-4 pt-2 gap-2 mt-auto border-t">
        <Button 
          className="flex-1 gap-1 text-[11px] md:text-xs font-bold h-9 md:h-10 rounded-lg bg-primary hover:bg-primary/90" 
          onClick={handleOrderNow}
        >
          {t('order_now')}
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="shrink-0 h-9 w-9 md:h-10 md:w-10 rounded-lg hover:bg-primary hover:text-white transition-colors border-primary/30 text-primary"
          onClick={handleAddToCart}
          title={t('add_to_cart')}
        >
          <ShoppingCart size={16} />
        </Button>
      </CardFooter>
    </Card>
  );
}
