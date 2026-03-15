"use client";

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, ShoppingCart, ShieldCheck, Truck, RotateCcw, CheckCircle2, Loader2, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/providers/language-provider';
import { useCart } from '@/components/providers/cart-provider';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { PublicLayout } from '@/components/layout/public-layout';
import { cn } from '@/lib/utils';

export default function ProductDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { language, t } = useLanguage();
  const { addToCart, setCheckoutOpen } = useCart();
  const db = useFirestore();

  const productRef = useMemoFirebase(() => db ? doc(db, 'products', id as string) : null, [db, id]);
  const { data: product, isLoading } = useDoc(productRef);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={40} /></div>;

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
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <Button 
            variant="ghost" 
            onClick={() => router.back()} 
            className="mb-8 gap-2 hover:bg-white rounded-xl"
          >
            <ArrowLeft size={18} />
            {t('back_to_list')}
          </Button>

          <div className="bg-white rounded-[2.5rem] shadow-sm border border-border/50 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Product Gallery */}
              <div className="relative aspect-square bg-gray-50 p-8 flex items-center justify-center">
                <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl">
                  <Image
                    src={product.imageUrl || 'https://picsum.photos/seed/prod/800/800'}
                    alt={product.name || 'Product'}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
                {product.stockQuantity < 5 && (
                  <div className="absolute top-12 left-12 bg-red-600 text-white px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest animate-pulse shadow-xl">
                    Limited Stock
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-8 lg:p-16 flex flex-col">
                <div className="space-y-6 flex-1">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-primary/10 text-primary border-none px-3 py-1 font-bold text-[10px] uppercase tracking-widest">
                      {product.brand || 'Premium Grade'}
                    </Badge>
                    <Badge variant="outline" className="border-gray-200 text-gray-500 font-bold text-[10px] uppercase">
                      {product.categoryId}
                    </Badge>
                  </div>

                  <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#081621] font-headline leading-none">
                    {product.name}
                  </h1>

                  <div className="flex items-center gap-4">
                    <p className="text-4xl font-black text-primary">
                      ৳{product.price?.toLocaleString()}
                    </p>
                    {product.regularPrice && (
                      <p className="text-xl text-muted-foreground line-through decoration-red-500/50">
                        ৳{product.regularPrice.toLocaleString()}
                      </p>
                    )}
                  </div>

                  <p className="text-lg text-muted-foreground leading-relaxed border-l-4 border-primary/20 pl-6 py-2">
                    {product.shortDescription || product.description}
                  </p>

                  {product.features && product.features.length > 0 && (
                    <div className="space-y-3 pt-4">
                      <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">Key Features</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {product.features.map((feature: string, i: number) => (
                          <div key={i} className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <CheckCircle2 size={16} className="text-primary shrink-0" />
                            {feature}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-8 mt-12">
                  <div className="grid grid-cols-3 gap-4 py-8 border-y border-gray-100">
                    <div className="flex flex-col items-center text-center gap-2">
                      <div className="p-3 bg-gray-50 rounded-2xl text-primary"><ShieldCheck size={20} /></div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-gray-500">Warranty</span>
                    </div>
                    <div className="flex flex-col items-center text-center gap-2">
                      <div className="p-3 bg-gray-50 rounded-2xl text-primary"><Truck size={20} /></div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-gray-500">Free Shipping</span>
                    </div>
                    <div className="flex flex-col items-center text-center gap-2">
                      <div className="p-3 bg-gray-50 rounded-2xl text-primary"><RotateCcw size={20} /></div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-gray-500">7-Day Return</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button 
                      onClick={handleOrderNow} 
                      size="lg" 
                      className="flex-1 h-16 rounded-2xl gap-3 text-lg font-black shadow-xl shadow-primary/20 uppercase tracking-tight"
                    >
                      <ShoppingCart size={24} />
                      {t('order_now')}
                    </Button>
                    <Button 
                      variant="outline"
                      size="lg" 
                      className="h-16 w-16 rounded-2xl text-primary border-primary/20 hover:bg-primary/5"
                      onClick={() => addToCart(product)}
                    >
                      <Plus size={24} />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
