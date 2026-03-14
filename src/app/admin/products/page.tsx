
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
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Inventory & Products</h1>
          <p className="text-muted-foreground text-sm">Manage cleaning supplies and equipment catalog</p>
        </div>
        <Button className="gap-2 font-bold shadow-lg">
          <Plus size={18} /> Add New Product
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center py-20 flex flex-col items-center gap-2">
            <Loader2 className="animate-spin text-primary" />
            <span className="text-muted-foreground">Loading inventory...</span>
          </div>
        ) : products?.length ? (
          products.map((product) => (
            <Card key={product.id} className="border-none shadow-sm group hover:shadow-md transition-all overflow-hidden bg-white flex flex-col h-full">
              <div className="relative aspect-square overflow-hidden bg-muted">
                {product.imageUrl ? (
                  <Image 
                    src={product.imageUrl} 
                    alt={product.name} 
                    fill 
                    className="object-cover transition-transform group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <Package size={48} />
                  </div>
                )}
                <Badge className="absolute top-2 right-2 bg-white/90 text-primary border-none text-[10px] font-bold">
                  {product.category || 'GENERAL'}
                </Badge>
              </div>
              
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-lg font-bold line-clamp-1">{product.name}</CardTitle>
                <div className="flex items-center gap-1 text-primary font-black">
                  <span>৳{product.price.toLocaleString()}</span>
                </div>
              </CardHeader>
              
              <CardContent className="p-4 pt-0 space-y-4 flex-1">
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {product.description || 'No description provided.'}
                </p>
                
                <div className="flex items-center gap-4 pt-4 border-t text-[10px] font-bold text-gray-500">
                  <div className="flex items-center gap-1">
                    <Tag size={12} /> STOCK: {product.stockQuantity || 24}
                  </div>
                  <div className="flex items-center gap-1">
                    <ShoppingCart size={12} /> SOLD: 12
                  </div>
                </div>
              </CardContent>
              
              <div className="p-4 pt-0 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 gap-1 h-8 text-[10px] font-bold uppercase">
                  <Edit size={12} /> Edit
                </Button>
                <Button variant="ghost" size="sm" className="h-8 text-destructive hover:bg-destructive/10">
                  <Trash2 size={12} />
                </Button>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-20 border-2 border-dashed rounded-2xl text-muted-foreground italic bg-white">
            <Package size={48} className="mx-auto mb-4 opacity-20" />
            No products in your catalog yet. Click "Add New Product" to start.
          </div>
        )}
      </div>
    </div>
  );
}
