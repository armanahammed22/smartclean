'use client';

import React from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { PublicLayout } from '@/components/layout/public-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { ProductCard } from '@/components/products/product-card';
import { useLanguage } from '@/components/providers/language-provider';

export default function ProductsListPage() {
  const db = useFirestore();
  const { t } = useLanguage();

  const productsQuery = useMemoFirebase(() => 
    db ? query(collection(db, 'products'), where('status', '==', 'Active'), orderBy('name', 'asc')) : null, [db]);
  const { data: products, isLoading } = useCollection(productsQuery);

  return (
    <PublicLayout>
      <div className="bg-[#F2F4F8] min-h-screen py-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="space-y-4 mb-12 text-center">
            <Badge className="bg-primary/10 text-primary border-none uppercase tracking-[0.2em] font-black py-1.5 px-5 rounded-full text-[10px]">Inventory Catalog</Badge>
            <h1 className="text-4xl font-black text-[#081621] font-headline">{t('nav_products')}</h1>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={40} /></div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2 md:gap-3 lg:gap-4">
              {products?.map((product) => (
                <ProductCard key={product.id} product={product as any} />
              ))}
              {!products?.length && !isLoading && (
                <div className="col-span-full p-20 text-center border-2 border-dashed rounded-3xl text-muted-foreground italic bg-white">
                  No products found.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
