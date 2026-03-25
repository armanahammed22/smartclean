'use client';

import React, { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Loader2, 
  Package, 
  Tag, 
  Store,
  AlertCircle,
  TrendingUp,
  ArrowUpRight
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export default function ProductApprovalsPage() {
  const db = useFirestore();
  const { toast } = useToast();

  const pendingQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'products'), where('approvalStatus', '==', 'Pending'), orderBy('createdAt', 'desc'));
  }, [db]);

  const { data: pendingProducts, isLoading } = useCollection(pendingQuery);

  const handleApprove = async (id: string) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'products', id), { 
        approvalStatus: 'Approved',
        status: 'Active',
        approvedAt: new Date().toISOString()
      });
      toast({ title: "Product Approved", description: "Successfully published to the catalog." });
    } catch (e) {
      toast({ variant: "destructive", title: "Action Failed" });
    }
  };

  const handleReject = async (id: string) => {
    if (!db || !confirm("Reject this product?")) return;
    try {
      await updateDoc(doc(db, 'products', id), { 
        approvalStatus: 'Rejected',
        status: 'Inactive'
      });
      toast({ title: "Product Rejected" });
    } catch (e) {
      toast({ variant: "destructive", title: "Action Failed" });
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Product Approvals</h1>
          <p className="text-muted-foreground text-sm font-medium">Review and verify vendor listings before publication</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-orange-50 text-orange-700">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-orange-700/80 text-[10px] font-black uppercase tracking-widest leading-none mb-1">Queue Size</p>
              <h3 className="text-3xl font-black">{pendingProducts?.length || 0}</h3>
            </div>
            <AlertCircle size={40} className="opacity-20" />
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-blue-50 text-blue-700">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-blue-700/80 text-[10px] font-black uppercase tracking-widest leading-none mb-1">New Today</p>
              <h3 className="text-3xl font-black">
                {pendingProducts?.filter(p => p.createdAt?.startsWith(new Date().toISOString().split('T')[0])).length || 0}
              </h3>
            </div>
            <Package size={40} className="opacity-20" />
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-[#081621] text-white">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-white/60 text-[10px] font-black uppercase tracking-widest leading-none mb-1">Avg. TAT</p>
              <h3 className="text-3xl font-black">2.4h</h3>
            </div>
            <TrendingUp size={40} className="opacity-20 text-primary" />
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white rounded-[2rem]">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="font-bold py-5 pl-8">Product Preview</TableHead>
                <TableHead className="font-bold">Vendor Info</TableHead>
                <TableHead className="font-bold">Category</TableHead>
                <TableHead className="font-bold">Price Point</TableHead>
                <TableHead className="text-right pr-8">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-20"><Loader2 className="animate-spin inline" /></TableCell></TableRow>
              ) : pendingProducts?.map((product) => (
                <TableRow key={product.id} className="hover:bg-gray-50/50 transition-colors group">
                  <TableCell className="py-5 pl-8">
                    <div className="flex items-center gap-4">
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden border bg-gray-50 shrink-0">
                        {product.imageUrl && <Image src={product.imageUrl} alt={product.name} fill className="object-cover" unoptimized />}
                      </div>
                      <div className="min-w-0">
                        <span className="font-black text-gray-900 uppercase text-xs truncate max-w-[200px] block leading-none mb-1">{product.name}</span>
                        <span className="text-[9px] text-muted-foreground font-mono uppercase tracking-widest">SKU: {product.id.slice(0, 8)}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-orange-50 text-orange-600 rounded-lg"><Store size={12} /></div>
                      <span className="text-xs font-bold text-gray-700 uppercase">{product.vendorName || 'Independent Vendor'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-white border-primary/20 text-primary font-black uppercase text-[8px]">{product.categoryId}</Badge>
                  </TableCell>
                  <TableCell className="font-black text-sm text-gray-900">
                    ৳{product.price?.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-green-600 hover:bg-green-50" onClick={() => handleApprove(product.id)}>
                        <CheckCircle2 size={18} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-red-600 hover:bg-red-50" onClick={() => handleReject(product.id)}>
                        <XCircle size={18} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-primary hover:bg-primary/5">
                        <Eye size={18} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!pendingProducts?.length && !isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-24 italic text-muted-foreground font-medium">
                    Queue is empty. No products awaiting approval.
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
