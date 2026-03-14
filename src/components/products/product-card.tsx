"use client";

import Image from 'next/image';
import { ShoppingCart, Info } from 'lucide-react';
import { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { useCart } from '@/components/providers/cart-provider';
import { useLanguage } from '@/components/providers/language-provider';
import { ProductDetailsDialog } from './product-details-dialog';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { t } = useLanguage();

  return (
    <Card className="overflow-hidden group flex flex-col h-full hover:shadow-lg transition-all duration-300 border-border/50">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <ProductDetailsDialog product={product}>
            <Button size="icon" variant="secondary" className="rounded-full shadow-md">
              <Info size={16} />
            </Button>
          </ProductDetailsDialog>
        </div>
      </div>
      <CardHeader className="p-4 pb-1">
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-semibold text-lg line-clamp-1 leading-tight">{product.name}</h3>
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
