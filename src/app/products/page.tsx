
'use client';

import React from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { PublicLayout } from '@/components/layout/public-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Package, ShoppingCart, Tag } from 'lucide-react';
import Link from 'next/link';
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
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="space-y-4 mb-12 text-center">
            <Badge className="bg-primary/10 text-primary border-none uppercase tracking-[0.2em] font-black py-1 px-4 rounded-none">Inventory Catalog</Badge>
            <h1 className="text-4xl font-black text-[#081621] font-headline">{t('nav_products')}</h1>
            <p className="text-muted-foreground max-w-lg mx-auto">{t('products_subtitle')}</p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={40} /></div>
          ) : (
            <div className="space-y-4">
              {products?.map((product) => (
                <div key={product.id} className="bg-white p-6 md:p-8 rounded-none border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-50 text-gray-400 rounded-none"><Package size={24} /></div>
                        <h3 className="text-xl font-black text-gray-900 group-hover:text-primary transition-colors">{product.name}</h3>
                      </div>
                      <p className="text-muted-foreground text-sm leading-relaxed">{product.description || 'Professional grade cleaning supply.'}</p>
                      <div className="flex items-center gap-3 pt-2">
                        <Badge variant="secondary" className="text-[9px] font-black uppercase bg-gray-50 text-gray-500 border-none rounded-none">{product.categoryId}</Badge>
                        {product.stockQuantity < 5 && (
                          <span className="text-[10px] font-bold text-red-500 uppercase flex items-center gap-1">
                            <Tag size={10} /> Limited Stock
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('fixed_price')}</p>
                        <p className="text-3xl font-black text-primary">৳{product.price?.toLocaleString()}</p>
                      </div>
                      <Button asChild className="w-full md:w-auto h-12 rounded-none font-black px-8 shadow-lg shadow-primary/20">
                        <Link href={`/product/${product.id}`}>{t('order_now')} <ShoppingCart size={16} className="ml-2" /></Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {!products?.length && !isLoading && (
                <div className="p-20 text-center border-2 border-dashed rounded-none text-muted-foreground italic bg-white">
                  No products are currently available in the online catalog.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
