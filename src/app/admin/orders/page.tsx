'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Checkbox } from '@/components/ui/checkbox';
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
  MoreVertical,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';
import { format, isToday, isThisMonth } from 'date-fns';
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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const ordersQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
  }, [db, user]);

  const { data: orders, isLoading } = useCollection(ordersQuery);

  // Dynamic KPIs
  const stats = useMemo(() => {
    if (!orders) return { total: 0, processing: 0, delivered: 0, cancelled: 0, daily: 0, monthly: 0 };
    return {
      total: orders.length,
      processing: orders.filter(o => o.status === 'Processing').length,
      delivered: orders.filter(o => o.status === 'Delivered').length,
      cancelled: orders.filter(o => o.status === 'Cancelled').length,
      daily: orders.filter(o => isToday(new Date(o.createdAt))).reduce((acc, o) => acc + (o.totalPrice || 0), 0),
      monthly: orders.filter(o => isThisMonth(new Date(o.createdAt))).reduce((acc, o) => acc + (o.totalPrice || 0), 0),
    };
  }, [orders]);

  const filteredOrders = orders?.filter(o => 
    o.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.id?.includes(searchTerm)
  );

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

  // Selection Logic
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredOrders?.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredOrders?.map(o => o.id) || []);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkStatus = async (status: string) => {
    if (!db || selectedIds.length === 0) return;
    setIsBulkProcessing(true);
    try {
      const batch = writeBatch(db);
      selectedIds.forEach(id => {
        batch.update(doc(db, 'orders', id), { status });
      });
      await batch.commit();
      toast({ title: `Bulk Update: ${status}`, description: `${selectedIds.length} orders updated.` });
      setSelectedIds([]);
    } catch (e) {
      toast({ variant: "destructive", title: "Bulk Action Failed" });
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!db || selectedIds.length === 0) return;
    if (!confirm(`Permanently delete ${selectedIds.length} orders?`)) return;
    setIsBulkProcessing(true);
    try {
      const batch = writeBatch(db);
      selectedIds.forEach(id => {
        batch.delete(doc(db, 'orders', id));
      });
      await batch.commit();
      toast({ title: "Bulk Delete Success", description: "Orders removed from database." });
      setSelectedIds([]);
    } catch (e) {
      toast({ variant: "destructive", title: "Delete Failed" });
    } finally {
      setIsBulkProcessing(false);
    }
  };

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
          <p className="text-muted-foreground text-sm">Manage sales, shipping and billing lifecycle</p>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: "Total Volume", val: stats.total, icon: ShoppingCart, bg: "bg-blue-50", color: "text-blue-600" },
          { label: "Processing", val: stats.processing, icon: Clock, bg: "bg-amber-50", color: "text-amber-600" },
          { label: "Delivered", val: stats.delivered, icon: CheckCircle2, bg: "bg-green-50", color: "text-green-600" },
          { label: "Revenue (Today)", val: `৳${stats.daily.toLocaleString()}`, icon: Zap, bg: "bg-primary/5", color: "text-primary" }
        ].map((s, i) => (
          <Card key={i} className="border-none shadow-sm bg-white rounded-2xl overflow-hidden group">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">{s.label}</p>
                <h3 className="text-xl font-black text-gray-900">{s.val}</h3>
              </div>
              <div className={cn("p-3 rounded-2xl transition-transform group-hover:scale-110", s.bg, s.color)}><s.icon size={20} /></div>
            </CardContent>
          </Card>
        ))}
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

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-primary text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between animate-in slide-in-from-top-4">
          <div className="flex items-center gap-4 px-2">
            <span className="text-xs font-black uppercase tracking-widest">{selectedIds.length} SELECTED</span>
            <div className="h-6 w-px bg-white/20" />
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => handleBulkStatus('Processing')} disabled={isBulkProcessing} className="h-8 text-[10px] font-black uppercase">Process</Button>
              <Button size="sm" variant="secondary" onClick={() => handleBulkStatus('Delivered')} disabled={isBulkProcessing} className="h-8 text-[10px] font-black uppercase">Deliver</Button>
            </div>
          </div>
          <Button variant="ghost" onClick={handleBulkDelete} disabled={isBulkProcessing} className="text-white hover:bg-red-500 font-black uppercase text-[10px] h-8">
            <Trash2 size={14} className="mr-2" /> Delete Bulk
          </Button>
        </div>
      )}

      <Card className="border-none shadow-sm bg-white rounded-2xl md:rounded-[2rem] overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="w-12 pl-6">
                  <Checkbox 
                    checked={filteredOrders?.length ? selectedIds.length === filteredOrders.length : false}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="font-bold py-5 pl-4 uppercase text-[10px] tracking-widest">Order ID</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Customer</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Price</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Status</TableHead>
                <TableHead className="text-right pr-8 uppercase text-[10px] tracking-widest">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-20"><Loader2 className="animate-spin inline" /></TableCell></TableRow>
              ) : filteredOrders?.map((order) => (
                <TableRow key={order.id} className={cn("hover:bg-gray-50/50 transition-colors group", selectedIds.includes(order.id) && "bg-primary/5")}>
                  <TableCell className="pl-6">
                    <Checkbox 
                      checked={selectedIds.includes(order.id)}
                      onCheckedChange={() => toggleSelect(order.id)}
                    />
                  </TableCell>
                  <TableCell className="py-5 pl-4">
                    <div className="font-black text-gray-900 text-xs">#ORD-{order.id.slice(0, 6).toUpperCase()}</div>
                    <div className="text-[9px] text-muted-foreground mt-1 uppercase font-bold">
                      {mounted && order.createdAt ? format(new Date(order.createdAt), 'MMM dd, HH:mm') : 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs font-bold text-gray-700 uppercase">{order.customerName}</div>
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
                        title="View Invoice"
                        disabled={isProcessingInvoice === order.id}
                      >
                        {isProcessingInvoice === order.id ? <Loader2 className="animate-spin h-4 w-4" /> : <FileText size={16} />}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-indigo-600" 
                        onClick={() => handleDownloadInvoice(order)}
                        title="Download PDF"
                        disabled={isProcessingInvoice === order.id}
                      >
                        <Download size={16} />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical size={16}/></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl border-none shadow-xl">
                          <DropdownMenuItem className="text-xs font-bold" onClick={() => router.push(`/admin/orders/${order.id}`)}>Edit Details</DropdownMenuItem>
                          <DropdownMenuItem className="text-xs font-bold text-destructive" onClick={() => deleteDoc(doc(db!, 'orders', order.id))}>Delete Record</DropdownMenuItem>
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
