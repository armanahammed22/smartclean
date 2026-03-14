
'use client';

import React from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Package, ArrowRight, TrendingDown } from 'lucide-react';
import Link from 'next/link';

export default function StockAlertsPage() {
  const db = useFirestore();

  // In a real app, we would query for stockQuantity < threshold
  // For MVP, we fetch all and filter client-side
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
        <p className="text-muted-foreground text-sm">Monitor low stock and out-of-stock items</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-none shadow-sm bg-orange-50/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-black text-orange-700">LOW STOCK ITEMS</CardTitle>
            <TrendingDown className="text-orange-600" size={20} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-orange-900">{lowStock.length}</div>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-sm bg-red-50/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-black text-red-700">OUT OF STOCK</CardTitle>
            <AlertCircle className="text-red-600" size={20} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-red-900">{outOfStock.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="bg-white border-b">
          <CardTitle className="text-lg font-bold">Critical Inventory Items</CardTitle>
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
                          <div className="text-[10px] text-muted-foreground uppercase">SKU: {product.sku || 'N/A'}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-medium">{product.categoryId}</TableCell>
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
                      <Button asChild variant="ghost" size="sm" className="text-primary gap-1 font-bold text-xs">
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
