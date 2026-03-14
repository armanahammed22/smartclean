"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { Plus, Minus, ShoppingCart } from 'lucide-react';
import { Product } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useCart } from '@/components/providers/cart-provider';
import { useLanguage } from '@/components/providers/language-provider';

interface ProductDetailsDialogProps {
  product: Product;
  children: React.ReactNode;
}

export function ProductDetailsDialog({ product, children }: ProductDetailsDialogProps) {
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  const handleAdd = () => {
    addToCart(product, quantity);
    setOpen(false);
    setQuantity(1);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px] gap-0 p-0 overflow-hidden">
        <div className="grid md:grid-cols-2">
          <div className="relative aspect-square md:aspect-auto h-64 md:h-full">
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover"
            />
          </div>
          <div className="p-6 flex flex-col">
            <DialogHeader className="mb-4">
              <div className="text-xs font-bold text-primary uppercase tracking-widest mb-1">
                {product.category}
              </div>
              <DialogTitle className="text-2xl font-bold">{product.name}</DialogTitle>
              <div className="text-xl font-bold text-primary mt-1">
                ৳{product.price.toLocaleString()}
              </div>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto max-h-48 md:max-h-64 mb-6">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {product.description}
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">{t('quantity')}</span>
                <div className="flex items-center border rounded-md">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-none border-r"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Minus size={14} />
                  </Button>
                  <span className="w-10 text-center text-sm font-medium">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-none border-l"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus size={14} />
                  </Button>
                </div>
              </div>

              <Button onClick={handleAdd} className="w-full gap-2 font-bold">
                <ShoppingCart size={18} />
                {t('add_to_cart')} — ৳{(product.price * quantity).toLocaleString()}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
