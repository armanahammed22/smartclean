'use client';

import React from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Package, ArrowRight, TrendingDown, Layers } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function StockAlertsPage() {
  const db = useFirestore();

  const productsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'products'), orderBy('stockQuantity', 'asc'));
  }, [db]);

  const { data: products, isLoading } = useCollection(productsQuery);

  const lowStock = products?.filter(p => p.stockQuantity > 0 && p.stockQuantity <= 10) || [];
  const outOfStock = products?.filter(p => p.stockQuantity === 0) || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inventory Alerts</h1>
        <p className="text-muted-foreground text-sm">Monitor critical stock levels across your supply catalog</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-red-50 text-red-700">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-red-700/80 text-xs font-bold uppercase tracking-wider">Out of Stock</p>
              <h3 className="text-3xl font-black mt-1">{outOfStock.length}</h3>
            </div>
            <AlertCircle size={40} className="opacity-20" />
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-sm bg-orange-50 text-orange-700">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-orange-700/80 text-xs font-bold uppercase tracking-wider">Low Stock Items</p>
              <h3 className="text-3xl font-black mt-1">{lowStock.length}</h3>
            </div>
            <TrendingDown size={40} className="opacity-20" />
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-primary text-white">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-primary-foreground/80 text-xs font-bold uppercase tracking-wider">Impacted SKUs</p>
              <h3 className="text-3xl font-black mt-1">{outOfStock.length + lowStock.length}</h3>
            </div>
            <Layers size={40} className="opacity-20" />
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white">
        <CardHeader className="bg-gray-50/50 border-b">
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-gray-500">Critical Inventory Items</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="font-bold py-4">Product Details</TableHead>
                <TableHead className="font-bold">Category</TableHead>
                <TableHead className="font-bold">Current Stock</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-20">Monitoring stock levels...</TableCell></TableRow>
              ) : [...outOfStock, ...lowStock].length ? (
                [...outOfStock, ...lowStock].map((product) => (
                  <TableRow key={product.id} className="hover:bg-gray-50/50">
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                          <Package size={20} />
                        </div>
                        <div>
                          <div className="font-bold text-sm text-gray-900">{product.name}</div>
                          <div className="text-[10px] text-muted-foreground uppercase font-medium">SKU: {product.id.slice(0, 8).toUpperCase()}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-[10px] font-black uppercase text-muted-foreground">{product.categoryId}</TableCell>
                    <TableCell>
                      <div className={cn(
                        "font-black text-sm",
                        product.stockQuantity === 0 ? "text-red-600" : "text-orange-600"
                      )}>
                        {product.stockQuantity} Units
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        "text-[9px] font-black border-none",
                        product.stockQuantity === 0 ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"
                      )}>
                        {product.stockQuantity === 0 ? 'OUT OF STOCK' : 'LOW STOCK'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm" className="text-primary gap-1 font-bold text-xs hover:bg-primary/5">
                        <Link href="/admin/products">Update <ArrowRight size={14} /></Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20 italic text-muted-foreground">
                    All inventory levels are healthy.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
