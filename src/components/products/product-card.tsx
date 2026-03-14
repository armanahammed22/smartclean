
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
  const { addToCart } = useCart();
  const { t } = useLanguage();

  return (
    <Card className="overflow-hidden group flex flex-col h-full hover:shadow-lg transition-all duration-300 border-border/50">
      <Link href={`/product/${product.id}`} className="block relative aspect-[4/3] overflow-hidden">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </Link>
      <CardHeader className="p-4 pb-1">
        <div className="flex justify-between items-start gap-2">
          <Link href={`/product/${product.id}`} className="hover:text-primary transition-colors">
            <h3 className="font-semibold text-lg line-clamp-1 leading-tight">{product.name}</h3>
          </Link>
          <span className="font-bold text-primary">৳{product.price.toLocaleString()}</span>
        </div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mt-1">
          {product.category}
        </p>
      </CardHeader>
      <CardContent className="p-4 pt-2 flex-1">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {product.shortDescription}
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button 
          className="w-full gap-2 group font-bold" 
          onClick={() => addToCart(product)}
        >
          <ShoppingCart size={16} className="group-active:scale-125 transition-transform" />
          {t('add_to_cart')}
        </Button>
      </CardFooter>
    </Card>
  );
}
