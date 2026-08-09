'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, deleteDoc, addDoc, where, limit } from 'firebase/firestore';
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
  ShoppingCart, 
  Trash2,
  Loader2,
  Zap,
  FileText,
  CheckCircle2,
  Clock,
  Plus,
  X,
  Package,
  Smartphone,
  Eye,
  Edit
} from 'lucide-react';
import { format, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { getOrCreateInvoice } from '@/lib/invoice-utils';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';

function OrdersListContent() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessingInvoice, setIsProcessingInvoice] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Creation State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [customer, setCustomer] = useState({ name: '', phone: '', address: '' });
  const [pricing, setPricing] = useState({ discount: 0, delivery: 80 });
  
  const [paymentCategory, setPaymentCategory] = useState<'cod' | 'online'>('cod');
  const [selectedGatewayId, setSelectedGatewayId] = useState<string>('');

  useEffect(() => {
    setMounted(true);
    if (searchParams.get('create') === 'true') {
      setIsCreateOpen(true);
    }
  }, [searchParams]);

  // 🚀 OPTIMIZATION: Strictly limited to 100 most recent orders for snappy load
  const ordersQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(100));
  }, [db, user]);

  const productsQuery = useMemoFirebase(() => db ? query(collection(db, 'products'), orderBy('name', 'asc'), limit(50)) : null, [db]);
  const gatewaysQuery = useMemoFirebase(() => db ? query(collection(db, 'payment_methods'), where('isEnabled', '==', true)) : null, [db]);
  
  const { data: orders, isLoading } = useCollection(ordersQuery);
  const { data: allProducts } = useCollection(productsQuery);
  const { data: activeGateways } = useCollection(gatewaysQuery);

  const stats = useMemo(() => {
    if (!orders) return { total: 0, processing: 0, delivered: 0, daily: 0 };
    return {
      total: orders.length,
      processing: orders.filter(o => o.status === 'Processing').length,
      delivered: orders.filter(o => o.status === 'Delivered').length,
      daily: orders.filter(o => isToday(new Date(o.createdAt))).reduce((acc, o) => acc + (o.totalPrice || 0), 0),
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    if (!searchTerm.trim()) return orders;
    return orders.filter(o => 
      o.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerPhone?.includes(searchTerm)
    );
  }, [orders, searchTerm]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return allProducts?.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.id.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 10);
  }, [searchQuery, allProducts]);

  const addItem = (p: any) => {
    const existing = selectedItems.find(i => i.id === p.id);
    if (existing) {
      setSelectedItems(selectedItems.map(i => i.id === p.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setSelectedItems([...selectedItems, { id: p.id, name: p.name, price: p.price, quantity: 1 }]);
    }
    setSearchQuery('');
  };

  const calculateTotals = () => {
    const subtotalValue = selectedItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    const totalValue = subtotalValue + pricing.delivery - pricing.discount;
    return { subtotalValue, totalValue };
  };

  const { subtotalValue, totalValue } = calculateTotals();

  const handleCreateOrder = async () => {
    if (!db) return;
    if (selectedItems.length === 0 || !customer.name || !customer.phone || !customer.address) {
      toast({ variant: "destructive", title: "Information Missing", description: "Please fill all required fields." });
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedGateway = activeGateways?.find(g => g.id === selectedGatewayId);
      const orderData = {
        customerName: customer.name,
        customerPhone: customer.phone,
        address: customer.address,
        items: selectedItems.map(i => ({ ...i, itemType: 'product' })),
        subtotal: subtotalValue,
        discount: pricing.discount,
        deliveryCharge: pricing.delivery,
        totalPrice: totalValue,
        paymentMethod: paymentCategory === 'cod' ? 'Cash on Delivery' : (selectedGateway?.name || 'Online'),
        status: 'New',
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'orders'), orderData);
      await getOrCreateInvoice(db, docRef.id, 'order', orderData);

      toast({ title: "Success", description: "Order created successfully!" });
      setIsCreateOpen(false);
      setSelectedItems([]);
      setCustomer({ name: '', phone: '', address: '' });
    } catch (e) {
      toast({ variant: "destructive", title: "Error" });
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const handleDeleteSingle = async (id: string) => {
    if (!db || !confirm("Delete this order?")) return;
    setIsSubmitting(true);
    try {
      await deleteDoc(doc(db, 'orders', id));
      toast({ title: "Order Removed" });
    } catch (e) {
      toast({ variant: "destructive", title: "Delete Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="space-y-8 min-w-0 page-transition-fade">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-[#081621]">Product Orders</h1>
          <p className="text-muted-foreground text-sm font-medium">Manage e-commerce sales and tracking</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="rounded-xl font-black gap-2 h-11 px-6 shadow-xl shadow-primary/20 uppercase text-xs tracking-widest">
          <Plus size={18} /> Create Manual Order
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: "Total Volume", val: stats.total, icon: ShoppingCart, bg: "bg-blue-50", color: "text-blue-600" },
          { label: "Processing", val: stats.processing, icon: Clock, bg: "bg-amber-50", color: "text-amber-600" },
          { label: "Completed", val: stats.delivered, icon: CheckCircle2, bg: "bg-green-50", color: "text-green-600" },
          { label: "Daily Revenue", val: `৳${stats.daily.toLocaleString()}`, icon: Zap, bg: "bg-primary/5", color: "text-primary" }
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

      <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden">
        <div className="p-4 border-b bg-gray-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input 
              placeholder="Search by Order ID or Name..." 
              className="pl-10 h-11 bg-white border-gray-100 rounded-xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <CardContent className="p-0 overflow-x-auto custom-scrollbar">
          <div className="min-w-full">
            <Table className="min-w-[900px]">
              <TableHeader className="bg-gray-50/30">
                <TableRow>
                  <TableHead className="font-bold py-5 pl-8 uppercase text-[10px] tracking-widest">Order ID</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest">Customer</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest">Price</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest">Status</TableHead>
                  <TableHead className="text-right pr-8 uppercase text-[10px] tracking-widest">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-20"><Loader2 className="animate-spin text-primary inline" /></TableCell></TableRow>
                ) : filteredOrders?.map((order) => (
                  <TableRow key={order.id} className="hover:bg-gray-50/50 transition-colors group">
                    <TableCell className="py-5 pl-8">
                      <div className="font-black text-gray-900 text-xs">#ORD-{order.id.slice(0, 6).toUpperCase()}</div>
                      <div className="text-[9px] text-muted-foreground mt-1 font-bold">{order.createdAt ? format(new Date(order.createdAt), 'MMM dd, HH:mm') : 'N/A'}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs font-bold text-gray-700 uppercase">{order.customerName}</div>
                      <div className="text-[10px] text-muted-foreground">{order.customerPhone}</div>
                    </TableCell>
                    <TableCell className="font-black text-sm text-gray-900">৳{order.totalPrice?.toLocaleString()}</TableCell>
                    <TableCell>
                      <Select defaultValue={order.status} onValueChange={(val) => handleUpdateStatus(order.id, val)}>
                        <SelectTrigger className="h-8 text-[9px] font-black uppercase w-[110px] border-none bg-blue-50 text-blue-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {['New', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="flex justify-end gap-1 opacity-100">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => handleOpenInvoice(order)} disabled={isProcessingInvoice === order.id}><FileText size={16} /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteSingle(order.id)} disabled={isSubmitting}><Trash2 size={16} /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-4xl w-full h-full md:h-auto md:max-h-[90vh] p-0 border-none rounded-none md:rounded-[2.5rem] shadow-2xl bg-white flex flex-col">
          <div className="flex flex-col h-full overflow-hidden">
            <header className="p-6 md:p-8 bg-[#081621] text-white shrink-0 flex justify-between items-center">
              <div className="space-y-1">
                <DialogTitle className="text-xl md:text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                  <ShoppingCart className="text-primary" size={24} /> Manual Order Terminal
                </DialogTitle>
                <DialogDescription className="text-white/40 text-[9px] font-bold uppercase tracking-widest">Enroll direct sales into registry</DialogDescription>
              </div>
              <button type="button" onClick={() => setIsCreateOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white"><X size={24}/></button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar bg-white">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-8">
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Select Products</Label>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <Input 
                        placeholder="Search product catalog..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-11 md:h-12 pl-12 bg-gray-50 border-none rounded-xl font-bold"
                      />
                      {filteredProducts.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border z-50 overflow-hidden">
                          {filteredProducts.map(p => (
                            <div key={p.id} onClick={() => addItem(p)} className="p-4 flex items-center justify-between hover:bg-primary/5 cursor-pointer border-b last:border-none">
                              <div>
                                <p className="font-bold text-sm uppercase">{p.name}</p>
                                <p className="text-[10px] text-muted-foreground">৳{p.price}</p>
                              </div>
                              <Plus size={16} className="text-primary" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      {selectedItems.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                          <div className="flex-1 min-w-0 mr-4">
                            <p className="font-black text-xs uppercase truncate">{item.name}</p>
                            <p className="text-[9px] font-bold text-primary mt-0.5">৳{item.price} × {item.quantity}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => {
                              const next = [...selectedItems];
                              next[idx].quantity = Math.max(1, next[idx].quantity - 1);
                              setSelectedItems(next);
                            }} className="w-8 h-8 rounded-lg bg-white border flex items-center justify-center font-black">-</button>
                            <span className="w-6 text-center font-black text-xs">{item.quantity}</span>
                            <button onClick={() => {
                              const next = [...selectedItems];
                              next[idx].quantity++;
                              setSelectedItems(next);
                            }} className="w-8 h-8 rounded-lg bg-white border flex items-center justify-center font-black">+</button>
                            <button onClick={() => setSelectedItems(selectedItems.filter((_, i) => i !== idx))} className="ml-2 text-red-400 hover:text-red-600"><X size={16}/></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Customer Identity</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input placeholder="Full Name" value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} className="h-11 md:h-12 bg-gray-50 border-none rounded-xl font-bold shadow-inner" />
                      <Input placeholder="Mobile Number" value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} className="h-11 md:h-12 bg-gray-50 border-none rounded-xl font-bold shadow-inner" />
                    </div>
                    <Textarea placeholder="Detailed Address" value={customer.address} onChange={e => setCustomer({...customer, address: e.target.value})} className="bg-gray-50 border-none rounded-xl min-h-[80px] p-4 shadow-inner" />
                  </div>
                </div>

                <div className="bg-gray-50/50 p-6 md:p-8 rounded-[2rem] border border-gray-100 flex flex-col gap-8 h-fit">
                  <div className="space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2"><Plus size={16} /> Bill Calculation</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between text-xs font-bold text-gray-500 uppercase"><span>Subtotal</span><span>৳{subtotalValue.toLocaleString()}</span></div>
                      <div className="grid grid-cols-2 gap-4 items-center">
                        <Label className="text-[10px] font-black uppercase text-gray-400">Delivery Fee</Label>
                        <Input type="number" value={pricing.delivery} onChange={e => setPricing({...pricing, delivery: parseFloat(e.target.value) || 0})} className="h-9 bg-white text-right font-black rounded-lg shadow-sm" />
                      </div>
                      <div className="grid grid-cols-2 gap-4 items-center">
                        <Label className="text-[10px] font-black uppercase text-gray-400">Discount</Label>
                        <Input type="number" value={pricing.discount} onChange={e => setPricing({...pricing, discount: parseFloat(e.target.value) || 0})} className="h-9 bg-white text-right font-black text-red-600 rounded-lg shadow-sm" />
                      </div>
                      <div className="pt-4 border-t-2 border-dashed border-gray-200 flex justify-between items-end">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase text-gray-400">Net Payable</span>
                          <span className="text-4xl font-black text-primary tracking-tighter">৳{totalValue.toLocaleString()}</span>
                        </div>
                        <Badge className="bg-primary/10 text-primary border-none font-black text-[10px]">BDT</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Settlement Channel</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div 
                        onClick={() => setPaymentCategory('cod')} 
                        className={cn("p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col items-center gap-2", paymentCategory === 'cod' ? "border-primary bg-primary/5 shadow-md" : "bg-white border-gray-100 opacity-60 hover:opacity-100")}
                      >
                        <Package size={20} className={paymentCategory === 'cod' ? "text-primary" : "text-gray-400"} />
                        <span className="text-[10px] font-black uppercase tracking-widest">COD</span>
                      </div>
                      <div 
                        onClick={() => setPaymentCategory('online')} 
                        className={cn("p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col items-center gap-2", paymentCategory === 'online' ? "border-blue-600 bg-blue-50 shadow-md" : "bg-white border-gray-100 opacity-60 hover:opacity-100")}
                      >
                        <Smartphone size={20} className={paymentCategory === 'online' ? "text-blue-600" : "text-gray-400"} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Gateway</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="p-6 md:p-8 bg-gray-50 border-t shrink-0 flex flex-col sm:flex-row gap-3">
              <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)} className="flex-1 sm:flex-none h-12 md:h-14 px-10 rounded-xl font-bold uppercase text-[10px] tracking-widest">Discard</Button>
              <Button onClick={handleCreateOrder} disabled={isSubmitting} className="flex-1 h-12 md:h-14 rounded-xl font-black bg-primary text-white shadow-xl shadow-primary/20 uppercase tracking-tighter transition-all active:scale-95 text-xs">
                {isSubmitting ? <Loader2 className="animate-spin" /> : "Confirm & Finalize Order"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function OrdersManagementPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-primary" size={40} /></div>}>
      <OrdersListContent />
    </Suspense>
  );
}