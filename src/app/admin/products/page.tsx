
'use client';

import React from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Plus, Trash2, Edit, Tag, ShoppingCart, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

export default function ProductsManagementPage() {
  const db = useFirestore();

  const productsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'products'), orderBy('name', 'asc'));
  }, [db]);

  const { data: products, isLoading } = useCollection(productsQuery);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory & Products</h1>
          <p className="text-muted-foreground text-sm">Manage cleaning supplies and equipment catalog</p>
        </div>
        <Button className="gap-2 font-bold shadow-lg h-11">
          <Plus size={18} /> Add New Product
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {isLoading ? (
          <div className="col-span-full text-center py-24 flex flex-col items-center gap-3">
            <Loader2 className="animate-spin text-primary" size={32} />
            <span className="text-muted-foreground font-medium">Loading inventory...</span>
          </div>
        ) : products?.length ? (
          products.map((product) => (
            <Card key={product.id} className="border-none shadow-sm group hover:shadow-md transition-all overflow-hidden bg-white flex flex-col h-full">
              <div className="relative aspect-[4/3] overflow-hidden bg-gray-50 border-b">
                {product.imageUrl ? (
                  <Image 
                    src={product.imageUrl} 
                    alt={product.name || 'Product Image'} 
                    fill 
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                    <Package size={48} />
                  </div>
                )}
                <Badge className="absolute top-2 right-2 bg-white/95 text-primary border-none text-[8px] font-black shadow-sm uppercase tracking-tighter">
                  {product.category || 'GENERAL'}
                </Badge>
              </div>
              
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm md:text-base font-bold line-clamp-1 text-gray-900">{product.name}</CardTitle>
                <div className="text-primary font-black text-lg">
                  ৳{product.price.toLocaleString()}
                </div>
              </CardHeader>
              
              <CardContent className="p-4 pt-0 space-y-4 flex-1">
                <p className="text-[10px] md:text-xs text-muted-foreground line-clamp-2 min-h-[32px]">
                  {product.description || 'Professional equipment for deep cleaning and maintenance.'}
                </p>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-50 text-[9px] font-black uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Tag size={12} className="text-primary" /> Stock: {product.stockQuantity || 24}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ShoppingCart size={12} className="text-primary" /> Sold: 12
                  </div>
                </div>
              </CardContent>
              
              <div className="p-4 pt-0 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 gap-1.5 h-9 text-[10px] font-bold uppercase">
                  <Edit size={12} /> Edit
                </Button>
                <Button variant="ghost" size="sm" className="h-9 w-9 text-destructive hover:bg-destructive/5 rounded-lg shrink-0">
                  <Trash2 size={14} />
                </Button>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-24 border-2 border-dashed rounded-3xl text-muted-foreground italic bg-white">
            <Package size={40} className="mx-auto mb-4 opacity-10" />
            No products in your catalog yet.
          </div>
        )}
      </div>
    </div>
  );
}
