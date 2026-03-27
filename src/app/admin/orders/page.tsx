
'use client';

import React, { useState, useEffect } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Filter, 
  ShoppingCart, 
  Truck, 
  Trash2,
  Eye,
  Loader2,
  Zap,
  AlertTriangle,
  FileText,
  Download,
  MoreVertical
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getOrCreateInvoice } from '@/lib/invoice-utils';

export default function OrdersManagementPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessingInvoice, setIsProcessingInvoice] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const ordersQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
  }, [db, user]);

  const { data: orders, isLoading } = useCollection(ordersQuery);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    if (!db) return;
    await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
    toast({ title: "Order Updated" });
  };

  const handleOpenInvoice = async (order: any) => {
    if (!db) return;
    setIsProcessingInvoice(order.id);
    try {
      const invId = await getOrCreateInvoice(db, order.id, 'order', order);
      router.push(`/admin/invoices/${invId}`);
    } catch (e) {
      toast({ variant: "destructive", title: "Invoice Error" });
    } finally {
      setIsProcessingInvoice(null);
    }
  };

  const handleDownloadInvoice = async (order: any) => {
    if (!db) return;
    setIsProcessingInvoice(order.id);
    try {
      const invId = await getOrCreateInvoice(db, order.id, 'order', order);
      router.push(`/admin/invoices/${invId}?download=true`);
    } catch (e) {
      toast({ variant: "destructive", title: "Download Error" });
    } finally {
      setIsProcessingInvoice(null);
    }
  };

  const filteredOrders = orders?.filter(o => 
    o.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.id?.includes(searchTerm)
  );

  const STATUS_COLORS: Record<string, string> = {
    'New': 'bg-blue-50 text-blue-700',
    'Processing': 'bg-amber-50 text-amber-700',
    'Shipped': 'bg-purple-50 text-purple-700',
    'Delivered': 'bg-green-50 text-green-700',
    'Cancelled': 'bg-red-50 text-red-700',
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 uppercase">Product Orders</h1>
          <p className="text-muted-foreground text-sm">Manage sales, shipping and billing</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input 
            placeholder="Search Order ID or Customer..." 
            className="pl-10 h-11 border-gray-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="h-11 gap-2 w-full sm:w-auto"><Filter size={18} /> Filters</Button>
      </div>

      <Card className="border-none shadow-sm bg-white rounded-2xl md:rounded-[2rem] overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="font-bold py-5 pl-8 uppercase text-[10px]">Order ID</TableHead>
                <TableHead className="font-bold uppercase text-[10px]">Customer</TableHead>
                <TableHead className="font-bold uppercase text-[10px]">Price</TableHead>
                <TableHead className="font-bold uppercase text-[10px]">Status</TableHead>
                <TableHead className="text-right pr-8 uppercase text-[10px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-20"><Loader2 className="animate-spin inline" /></TableCell></TableRow>
              ) : filteredOrders?.map((order) => (
                <TableRow key={order.id} className="hover:bg-gray-50/50 transition-colors group">
                  <TableCell className="py-5 pl-8">
                    <div className="font-black text-gray-900 text-xs">#ORD-{order.id.slice(0, 6).toUpperCase()}</div>
                    <div className="text-[9px] text-muted-foreground mt-1">
                      {mounted && order.createdAt ? format(new Date(order.createdAt), 'MMM dd') : 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs font-bold text-gray-700">{order.customerName}</div>
                    <div className="text-[10px] text-muted-foreground">{order.customerPhone}</div>
                  </TableCell>
                  <TableCell className="font-black text-sm text-gray-900">৳{order.totalPrice?.toLocaleString()}</TableCell>
                  <TableCell>
                    <Select defaultValue={order.status} onValueChange={(val) => handleUpdateStatus(order.id, val)}>
                      <SelectTrigger className={cn("h-8 text-[9px] font-black uppercase w-[110px] border-none", STATUS_COLORS[order.status])}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['New', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <div className="flex justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-primary" 
                        onClick={() => handleOpenInvoice(order)}
                        disabled={isProcessingInvoice === order.id}
                      >
                        {isProcessingInvoice === order.id ? <Loader2 className="animate-spin h-4 w-4" /> : <FileText size={16} />}
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical size={16}/></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem className="text-xs font-bold" onClick={() => handleOpenInvoice(order)}>View Invoice</DropdownMenuItem>
                          <DropdownMenuItem className="text-xs font-bold" onClick={() => handleDownloadInvoice(order)}>Download PDF</DropdownMenuItem>
                          <DropdownMenuItem className="text-xs font-bold text-destructive">Delete Order</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
