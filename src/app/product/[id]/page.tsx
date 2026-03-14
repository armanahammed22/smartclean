"use client";

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, ShoppingCart, ShieldCheck, Truck, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/providers/language-provider';
import { useCart } from '@/components/providers/cart-provider';
import { getProductById } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { PublicLayout } from '@/components/layout/public-layout';

export default function ProductDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { language, t } = useLanguage();
  const { addToCart, setCheckoutOpen } = useCart();
  
  const product = getProductById(id as string, language);

  if (!product) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <Button onClick={() => router.push('/')}>{t('back_to_shop')}</Button>
        </div>
      </PublicLayout>
    );
  }

  const handleOrderNow = () => {
    addToCart(product);
    setCheckoutOpen(true);
  };

  return (
    <PublicLayout>
      <div className="bg-[#F2F4F8] min-h-screen pb-24">
        <div className="container mx-auto px-4 py-8">
          <Button 
            variant="ghost" 
            onClick={() => router.back()} 
            className="mb-8 gap-2 hover:bg-white"
          >
            <ArrowLeft size={18} />
            {t('back_to_list')}
          </Button>

          <div className="bg-white rounded-3xl shadow-sm border border-border/50 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="relative aspect-square lg:aspect-auto bg-muted/30">
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  className="object-cover"
                  priority
                />
              </div>

              <div className="p-8 lg:p-12 flex flex-col">
                <div className="space-y-4 mb-8">
                  <Badge variant="outline" className="text-primary border-primary px-3 py-1">
                    {product.category}
                  </Badge>
                  <h1 className="text-4xl font-bold tracking-tight text-[#081621] font-headline">
                    {product.name}
                  </h1>
                  <p className="text-3xl font-bold text-primary">
                    ৳{product.price.toLocaleString()}
                  </p>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    {product.description}
                  </p>
                </div>

                <div className="space-y-6 mt-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-8 border-b">
                    <div className="flex flex-col items-center text-center gap-2">
                      <div className="p-3 bg-primary/10 rounded-full text-primary">
                        <ShieldCheck size={20} />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider">{language === 'bn' ? 'গ্যারান্টি' : 'Guarantee'}</span>
                    </div>
                    <div className="flex flex-col items-center text-center gap-2">
                      <div className="p-3 bg-primary/10 rounded-full text-primary">
                        <Truck size={20} />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider">{t('shipping_free')}</span>
                    </div>
                    <div className="flex flex-col items-center text-center gap-2">
                      <div className="p-3 bg-primary/10 rounded-full text-primary">
                        <RotateCcw size={20} />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider">{language === 'bn' ? 'সহজ রিটার্ন' : 'Easy Returns'}</span>
                    </div>
                  </div>

                  <Button 
                    onClick={handleOrderNow} 
                    size="lg" 
                    className="w-full h-16 rounded-2xl gap-3 text-lg font-bold shadow-lg"
                  >
                    <ShoppingCart size={24} />
                    {t('order_now')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
